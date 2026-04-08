import { useState, useEffect } from "react";
import { db } from "../../config/firebase";
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import BlobProducto from "../icons/BlobProducto";

// 🎨 Ajustados para ser flexibles
const obtenerColorBlob = (categoria, subcategoria) => {
  const catStr = (categoria || "").toLowerCase();
  const subStr = (subcategoria || "").toLowerCase();
  
  if (catStr.includes("vino")) {
    if (subStr.includes("tinto") || subStr.includes("blend")) return "text-red-800/40";
    if (subStr.includes("blanco")) return "text-yellow-400/40";
    if (subStr.includes("rosado")) return "text-pink-400/40";
    return "text-red-800/30";
  } 
  if (catStr.includes("espumante")) return "text-amber-400/40"; 
  if (catStr.includes("destilado")) return "text-cyan-400/40";
  if (catStr.includes("aperitivo")) return "text-orange-500/40";
  if (catStr.includes("deli") || catStr.includes("cafe")) return "text-stone-400/40";
  
  return "text-gray-300/50"; 
};

// 👉 NUEVA FUNCIÓN PARA GENERAR URLS AMIGABLES
const generarSlug = (texto) => {
  return texto
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD') // Quita acentos
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '') // Borra caracteres raros
    .replace(/\s+/g, '-') // Cambia espacios por guiones
    .replace(/-+/g, '-'); // Quita guiones repetidos
};

export default function ProductForm({ productoEnAccion, setProductoEnAccion }) {
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagenGuardadaUrl, setImagenGuardadaUrl] = useState(""); 
  const [showPreview, setShowPreview] = useState(false); 
  
  // --- ESTADOS PARA EL ÁRBOL DINÁMICO DE FIREBASE ---
  const [menuTree, setMenuTree] = useState([]);
  const [subcategoriasDisponibles, setSubcategoriasDisponibles] = useState([]);
  const [cepasDisponibles, setCepasDisponibles] = useState([]);
  const [etiquetaInput, setEtiquetaInput] = useState(""); 

  const [formData, setFormData] = useState({
    categoria: "", subcategoria: "", varietal: "", bodega: "", origen: "", producto: "", 
    descripcion: "", costo: "", ganancia: "", stock: "", aPedido: false,
    descuentoPorcentaje: "", descuentoNombre: "", mostrarDescuento: false,
    etiquetas: [] 
  });

  // 1. ESCUCHAR LAS CATEGORÍAS DEL MENÚ
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'categorias_menu'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMenuTree(data);
    });
    return () => unsubscribe();
  }, []);

  // 2. RECUPERAR DATOS AL EDITAR
  useEffect(() => {
    if (productoEnAccion && productoEnAccion.data) {
      const { data } = productoEnAccion;
      setFormData({
        categoria: data.categoria || "", subcategoria: data.subcategoria || "", varietal: data.varietal || "", 
        bodega: data.bodega || "", origen: data.origen || "", producto: data.nombre || "", 
        descripcion: data.descripcion || "", costo: data.costo || "", ganancia: data.ganancia || "", 
        stock: data.stock || "", aPedido: data.aPedido || false, descuentoPorcentaje: data.descuentoPorcentaje || "",
        descuentoNombre: data.descuentoNombre || "", mostrarDescuento: data.mostrarDescuento || false,
        etiquetas: data.etiquetas || [] 
      });
      setImagenGuardadaUrl(data.imageUrl || "");
      setImageFile(null); 
    }
  }, [productoEnAccion]);

  // 3. LÓGICA DE SELECTORES EN CASCADA
  useEffect(() => {
    const cat = menuTree.find(c => c.nombre === formData.categoria);
    if (cat && cat.subcategorias) {
      setSubcategoriasDisponibles(cat.subcategorias);
      if (!cat.subcategorias.find(s => s.nombre === formData.subcategoria)) {
        setFormData(prev => ({ ...prev, subcategoria: "", varietal: "" }));
      }
    } else {
      setSubcategoriasDisponibles([]);
    }
  }, [formData.categoria, menuTree]);

  useEffect(() => {
    const cat = menuTree.find(c => c.nombre === formData.categoria);
    if (cat && cat.subcategorias) {
      const sub = cat.subcategorias.find(s => s.nombre === formData.subcategoria);
      if (sub && sub.cepas) {
        setCepasDisponibles(sub.cepas);
      } else {
        setCepasDisponibles([]);
      }
    }
  }, [formData.subcategoria, formData.categoria, menuTree]);

  // --- HANDLERS ---
  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleAddEtiqueta = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); 
      const tag = etiquetaInput.trim().toUpperCase();
      if (tag && !formData.etiquetas.includes(tag)) {
        setFormData(prev => ({ ...prev, etiquetas: [...prev.etiquetas, tag] }));
      }
      setEtiquetaInput("");
    }
  };

  const removeEtiqueta = (tag) => {
    setFormData(prev => ({ ...prev, etiquetas: prev.etiquetas.filter(t => t !== tag) }));
  };

  const uploadImage = async (file, categoriaName, subcategoriaName, productName) => {
    if (!file) return "";
    try {
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", "upld_decant");
      
      // 1. Organiza por carpeta según categoría y subcategoría
      if (categoriaName) {
        const catLimpia = categoriaName.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        if (subcategoriaName) {
          const subcatLimpia = subcategoriaName.toLowerCase().replace(/[^a-z0-9]/g, '');
          data.append("folder", `decant/catalog/${catLimpia}/${subcatLimpia}`);
        } else {
          data.append("folder", `decant/catalog/${catLimpia}`);
        }
      } else {
        data.append("folder", `decant/catalog/general`);
      }

      // 2. Nombra el archivo como el producto
      if (productName) {
        const nombreLimpio = productName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        data.append("public_id", nombreLimpio);
      }

      const res = await fetch("https://api.cloudinary.com/v1_1/ds7shexal/image/upload", { method: "POST", body: data });
      const fileRes = await res.json();
      return fileRes.secure_url || "";
    } catch (error) { 
      console.error("Error al subir imagen:", error); 
      return ""; 
    }
  };

  const cerrarModal = () => setProductoEnAccion(null);

  const handleEliminar = async () => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta etiqueta de la cava? Esta acción no se puede deshacer.")) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, "productos", productoEnAccion.data.id));
        cerrarModal();
      } catch (error) {
        alert("Error al eliminar: " + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.categoria || !formData.bodega || !formData.producto || !formData.costo || !formData.ganancia) {
      alert("⚠️ Completa los campos obligatorios."); return;
    }
    setLoading(true);

    try {
      let finalImageUrl = imagenGuardadaUrl; 
      
      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile, formData.categoria, formData.subcategoria, formData.producto); 
      }
      
      const costoNum = parseFloat(formData.costo) || 0;
      const gananciaNum = parseFloat(formData.ganancia) || 0;
      const descNum = parseFloat(formData.descuentoPorcentaje) || 0;
      const stockNum = formData.aPedido ? 0 : (parseInt(formData.stock) || 0);
      const precioBase = costoNum + (costoNum * (gananciaNum / 100)); 
      const precioFinal = precioBase - (precioBase * (descNum / 100)); 

      // 👉 GENERAMOS EL SLUG CON EL NOMBRE DEL PRODUCTO
      const slugGenerado = generarSlug(formData.producto);

      const payload = {
        categoria: formData.categoria, subcategoria: formData.subcategoria, varietal: formData.varietal,
        bodega: formData.bodega, origen: formData.origen, nombre: formData.producto, descripcion: formData.descripcion, 
        costo: costoNum, ganancia: gananciaNum, precioBase, precioFinal, descuentoPorcentaje: descNum, 
        descuentoNombre: formData.descuentoNombre, mostrarDescuento: formData.mostrarDescuento, 
        stock: stockNum, aPedido: formData.aPedido, imageUrl: finalImageUrl,
        etiquetas: formData.etiquetas,
        slug: slugGenerado // 👉 LO GUARDAMOS EN FIREBASE
      };

      if (productoEnAccion?.modo === "editar") {
        const docRef = doc(db, "productos", productoEnAccion.data.id);
        await updateDoc(docRef, { ...payload, updatedAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, "productos"), { ...payload, createdAt: serverTimestamp() });
      }
      cerrarModal(); 
    } catch (error) { alert("Error: " + error.message); } finally { setLoading(false); }
  };

  const isEditMode = productoEnAccion?.modo === "editar";
  const colorDelBlob = obtenerColorBlob(formData.categoria, formData.subcategoria);
  const localImageUrl = imageFile ? URL.createObjectURL(imageFile) : imagenGuardadaUrl;

  const precioBaseCalculado = (parseFloat(formData.costo) || 0) * (1 + ((parseFloat(formData.ganancia) || 0) / 100));
  const precioFinalCalculado = precioBaseCalculado - (precioBaseCalculado * ((parseFloat(formData.descuentoPorcentaje) || 0) / 100));

  // --- COMPONENTE DE TARJETA ---
  const TarjetaPreview = () => (
    <div className="w-full max-w-sm bg-white border border-gray-200 rounded-sm overflow-hidden relative shadow-xl flex flex-col mx-auto font-poppins">
      <div className="relative h-72 w-full flex items-center justify-center pt-6 pb-10 px-6 overflow-hidden bg-transparent">
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <BlobProducto className={`w-80 h-80 ${colorDelBlob} transition-colors duration-500 transform -translate-y-4`} />
         </div>
         {localImageUrl ? (
           <img src={localImageUrl} alt="Preview" className="h-full object-contain drop-shadow-xl relative z-10 mix-blend-multiply hover:scale-105 transition-transform duration-500" />
         ) : (
           <span className="text-gray-400 text-sm border border-dashed border-gray-300 p-4 rounded-sm relative z-10 bg-white/50 backdrop-blur-sm">Sin imagen</span>
         )}
         <div className="absolute top-4 left-4 flex flex-col gap-2 items-start z-20">
            {formData.descuentoPorcentaje > 0 && (
              <span className="bg-brand-orange text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-sm shadow-lg tracking-widest">
                 -{formData.descuentoPorcentaje}% {formData.mostrarDescuento ? formData.descuentoNombre : ''}
              </span>
            )}
         </div>
      </div>
      <div className="p-6 bg-white flex flex-col flex-grow justify-between border-t border-gray-100 z-30">
         <div>
           <p className="text-brand-orange text-[10px] font-bold tracking-widest uppercase mb-1">
             {formData.bodega || "BODEGA"} {formData.origen && <span className="text-gray-400">| {formData.origen}</span>}
           </p>
           <h3 className="text-extra-black text-lg font-bold leading-tight mb-1">{formData.producto || "Nombre del Producto"}</h3>
           <p className="text-gray-500 text-xs mb-2">{formData.varietal || "Varietal"}</p>
         </div>
         <div className="mt-4">
            <div className="flex items-end justify-between">
                <div className="flex flex-col">
                    {formData.descuentoPorcentaje > 0 && (
                      <span className="text-gray-400 line-through text-[11px] font-medium">
                        ${precioBaseCalculado.toLocaleString()}
                      </span>
                    )}
                    <span className="text-extra-black text-2xl font-black tracking-tight">
                      ${precioFinalCalculado.toLocaleString()}
                    </span>
                </div>
            </div>
         </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-extra-black/60 backdrop-blur-sm p-4 md:p-8 font-poppins">
        
        <div className={`relative w-full max-w-6xl h-[90vh] md:h-[85vh] flex flex-col lg:flex-row overflow-hidden rounded-sm shadow-2xl border transition-colors ${isEditMode ? 'border-brand-orange bg-orange-50/10' : 'bg-[#F4F7FA] border-light-blue/20'}`}>
          
          <div className="w-full lg:w-[55%] h-full overflow-y-auto p-6 md:p-8 custom-scrollbar bg-white">
            <div className="flex justify-between items-center mb-6 border-b border-light-blue/10 pb-4 sticky top-0 bg-white z-10">
              <div>
                <h2 className={`text-xl font-black uppercase tracking-wider ${isEditMode ? 'text-brand-orange' : 'text-extra-black'}`}>
                  {isEditMode ? "✏️ Editando Etiqueta" : "Añadir a la Cava"}
                </h2>
              </div>
              <div className="flex gap-2 items-center">
                <button type="button" onClick={() => setShowPreview(true)} className="lg:hidden px-3 py-1.5 bg-gray-100 text-extra-black text-[10px] uppercase tracking-widest font-bold rounded-sm border border-gray-200">
                  Ver Preview
                </button>
                <button type="button" onClick={cerrarModal} className="w-8 h-8 flex items-center justify-center bg-gray-100 text-extra-black rounded-sm hover:bg-red-500 hover:text-white transition-all text-xl font-bold border border-gray-200 outline-none">
                  ✕
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* --- 1. TAXONOMÍA --- */}
              <div className="md:col-span-2">
                <h3 className="text-[10px] font-bold text-dark-grey mb-2 uppercase tracking-widest border-b border-light-blue/10 pb-1">1. Clasificación Principal</h3>
              </div>
              
              <select name="categoria" value={formData.categoria} onChange={handleChange} required className="bg-gray-50 border border-light-blue/20 p-3 rounded-sm text-sm text-extra-black focus:border-brand-orange outline-none shadow-sm cursor-pointer">
                <option value="">Categoría Padre... *</option>
                {menuTree.map(cat => <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>)}
              </select>

              <select name="subcategoria" value={formData.subcategoria} onChange={handleChange} disabled={subcategoriasDisponibles.length === 0} className="bg-gray-50 border border-light-blue/20 p-3 rounded-sm text-sm text-extra-black focus:border-brand-orange outline-none shadow-sm cursor-pointer disabled:opacity-50">
                <option value="">Subcategoría...</option>
                {subcategoriasDisponibles.map(sub => <option key={sub.id} value={sub.nombre}>{sub.nombre}</option>)}
              </select>

              <select name="varietal" value={formData.varietal} onChange={handleChange} disabled={cepasDisponibles.length === 0} className="bg-gray-50 border border-light-blue/20 p-3 rounded-sm text-sm text-extra-black focus:border-brand-orange outline-none shadow-sm cursor-pointer disabled:opacity-50">
                <option value="">Cepa / Varietal...</option>
                {cepasDisponibles.map(cepa => <option key={cepa.id} value={cepa.nombre}>{cepa.nombre}</option>)}
              </select>

              <div className="flex flex-col justify-center">
                 <p className="text-[9px] text-dark-grey uppercase tracking-wider">
                   (Las opciones se configuran en Ajustes)
                 </p>
              </div>

              {/* --- 2. ETIQUETAS MÚLTIPLES --- */}
              <div className="md:col-span-2 bg-gray-50 p-4 border border-light-blue/20 rounded-sm">
                <h3 className="text-[10px] font-bold text-dark-grey mb-2 uppercase tracking-widest">Etiquetas Adicionales (Ej: SALE, NAVIDAD)</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.etiquetas.map(tag => (
                    <span key={tag} className="flex items-center gap-1 bg-extra-black text-brand-white text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-sm">
                      {tag}
                      <button type="button" onClick={() => removeEtiqueta(tag)} className="text-brand-orange hover:text-white outline-none ml-1">✕</button>
                    </span>
                  ))}
                </div>
                <input 
                  type="text" 
                  value={etiquetaInput}
                  onChange={(e) => setEtiquetaInput(e.target.value)}
                  onKeyDown={handleAddEtiqueta}
                  placeholder="Escribe una etiqueta y presiona ENTER..." 
                  className="w-full bg-white border border-light-blue/20 p-3 rounded-sm text-sm text-extra-black focus:border-brand-orange outline-none shadow-sm"
                />
              </div>

              {/* --- 3. DATOS DEL PRODUCTO --- */}
              <div className="md:col-span-2 mt-2">
                <h3 className="text-[10px] font-bold text-dark-grey mb-2 uppercase tracking-widest border-b border-light-blue/10 pb-1">2. Datos de la Etiqueta</h3>
              </div>

              <input required type="text" name="bodega" value={formData.bodega} onChange={handleChange} placeholder="Bodega / Productor *" className="bg-white border border-light-blue/20 p-3 rounded-sm text-sm text-extra-black focus:border-brand-orange outline-none shadow-sm" />
              <input type="text" name="origen" value={formData.origen} onChange={handleChange} placeholder="Origen (Ej: Mendoza, ARG)" className="bg-white border border-light-blue/20 p-3 rounded-sm text-sm text-extra-black focus:border-brand-orange outline-none shadow-sm" />
              
              <div className="md:col-span-2">
                <input required type="text" name="producto" value={formData.producto} onChange={handleChange} placeholder="Nombre Comercial del Vino *" className="w-full bg-white border border-light-blue/20 p-3 rounded-sm text-sm text-extra-black focus:border-brand-orange outline-none shadow-sm" />
              </div>

              <div className="md:col-span-2">
                 <textarea required name="descripcion" value={formData.descripcion} onChange={handleChange} placeholder="Descripción detallada (Notas de cata) *" className="w-full bg-white border border-light-blue/20 p-3 rounded-sm text-sm text-extra-black focus:border-brand-orange outline-none h-24 resize-none shadow-sm"></textarea>
              </div>
              
              {/* --- 4. PRECIOS Y STOCK --- */}
              <div className="md:col-span-2 mt-2">
                <h3 className="text-[10px] font-bold text-dark-grey mb-2 uppercase tracking-widest border-b border-light-blue/10 pb-1">3. Precios y Disponibilidad</h3>
              </div>

              <div className="flex gap-4 md:col-span-2">
                <input required type="number" name="costo" value={formData.costo} onChange={handleChange} placeholder="Costo ($) *" className="w-1/2 bg-white border border-light-blue/20 p-3 rounded-sm text-sm text-extra-black focus:border-brand-orange outline-none shadow-sm" />
                <input required type="number" name="ganancia" value={formData.ganancia} onChange={handleChange} placeholder="% Ganancia *" className="w-1/2 bg-white border border-light-blue/20 p-3 rounded-sm text-sm text-extra-black focus:border-brand-orange outline-none shadow-sm" />
              </div>

              <div className="md:col-span-2 bg-gray-50 p-4 border border-light-blue/20 rounded-sm flex flex-col md:flex-row gap-6 items-center">
                 <div className="w-full md:w-1/2">
                    <label className="text-[10px] text-dark-grey font-bold mb-2 block uppercase tracking-widest">Unidades Físicas</label>
                    <input required={!formData.aPedido} disabled={formData.aPedido} type="number" name="stock" value={formData.aPedido ? "" : formData.stock} onChange={handleChange} placeholder={formData.aPedido ? "No aplica (A Pedido)" : "Stock Actual *"} className="w-full bg-white border border-light-blue/20 p-3 rounded-sm text-sm text-extra-black focus:border-brand-orange outline-none disabled:bg-gray-100 disabled:text-gray-400 shadow-sm" />
                 </div>
                 <div className="w-full md:w-1/2 flex items-center justify-start gap-3 md:pt-5 border-t md:border-t-0 md:border-l border-light-blue/20 pt-4 md:pl-6">
                    <input type="checkbox" name="aPedido" checked={formData.aPedido} onChange={handleChange} className="w-5 h-5 accent-brand-orange cursor-pointer rounded-sm" id="chkPedido" />
                    <label htmlFor="chkPedido" className="text-xs text-extra-black cursor-pointer font-bold uppercase tracking-widest">Es "A Pedido"</label>
                 </div>
              </div>

              {/* --- 5. PROMOCIONES --- */}
              <div className="md:col-span-2 bg-gray-50 p-4 border border-light-blue/20 rounded-sm">
                <h3 className="text-[10px] font-bold text-dark-grey mb-3 uppercase tracking-widest">Zona de Promociones</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input type="number" name="descuentoPorcentaje" value={formData.descuentoPorcentaje} onChange={handleChange} placeholder="% Descuento" className="bg-white border border-light-blue/20 p-3 rounded-sm text-sm text-extra-black focus:border-brand-orange outline-none shadow-sm" />
                  <input type="text" name="descuentoNombre" value={formData.descuentoNombre} onChange={handleChange} placeholder="Motivo (ej: Día Malbec)" className="bg-white border border-light-blue/20 p-3 rounded-sm text-sm text-extra-black focus:border-brand-orange outline-none shadow-sm" />
                  <div className="flex items-center gap-2 bg-white border border-light-blue/20 p-3 rounded-sm shadow-sm">
                    <input type="checkbox" name="mostrarDescuento" checked={formData.mostrarDescuento} onChange={handleChange} className="w-4 h-4 accent-brand-orange cursor-pointer" id="chkDesc" />
                    <label htmlFor="chkDesc" className="text-[10px] uppercase font-bold text-extra-black cursor-pointer tracking-widest">Activar Promo</label>
                  </div>
                </div>
              </div>

              {/* --- 6. IMAGEN --- */}
              <div className="md:col-span-2">
                 <input required={!isEditMode && !imagenGuardadaUrl} type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="text-xs text-dark-grey file:mr-4 file:py-2.5 file:px-4 file:rounded-sm file:border-0 file:text-[10px] file:uppercase file:tracking-widest file:font-bold file:bg-gray-100 file:text-extra-black hover:file:bg-gray-200 cursor-pointer w-full outline-none"/>
                 <p className="text-[10px] text-brand-orange mt-2 font-bold uppercase tracking-widest">
                    {imagenGuardadaUrl ? "✅ Etiqueta cargada. Sube otra solo para reemplazarla." : "* Sube el PNG sin fondo."}
                 </p>
              </div>
              
              {/* --- BOTONES FINALES (GUARDAR / ELIMINAR) --- */}
              <div className="md:col-span-2 flex gap-4 mt-6">
                {isEditMode && (
                  <button 
                    type="button" 
                    onClick={handleEliminar}
                    disabled={loading}
                    className="w-1/3 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white font-black py-4 rounded-sm transition-colors uppercase tracking-widest text-[10px] shadow-sm outline-none border border-red-100"
                  >
                    Eliminar
                  </button>
                )}
                <button 
                  type="submit"
                  disabled={loading} 
                  className={`${isEditMode ? 'w-2/3' : 'w-full'} text-brand-white font-black py-4 rounded-sm transition-colors uppercase tracking-widest text-sm shadow-md outline-none ${isEditMode ? 'bg-brand-orange hover:bg-extra-black' : 'bg-extra-black hover:bg-brand-orange'}`}>
                  {loading ? "Sincronizando..." : (isEditMode ? "Actualizar Etiqueta" : "Cargar al Inventario")}
                </button>
              </div>

            </form>
          </div>

          <div className="hidden lg:flex lg:w-[45%] bg-[#F4F7FA] border-l border-light-blue/10 flex-col items-center justify-center p-8 relative">
            <h3 className="absolute top-6 left-6 text-dark-grey font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Preview Storefront
            </h3>
            <TarjetaPreview />
          </div>

        </div>
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-extra-black/80 backdrop-blur-sm p-4 lg:hidden">
          <div className="relative w-full">
            <button onClick={() => setShowPreview(false)} className="absolute -top-12 right-0 z-20 w-10 h-10 bg-white border border-light-blue/20 text-extra-black rounded-sm flex items-center justify-center hover:bg-gray-100 transition-colors shadow-lg outline-none">✕</button>
            <TarjetaPreview />
          </div>
        </div>
      )}
    </>
  );
}