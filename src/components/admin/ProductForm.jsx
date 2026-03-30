import { useState, useEffect } from "react";
import { db } from "../../config/firebase";
import { collection, addDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import BlobProducto from "../icons/BlobProducto";

const diccionarioCategorias = {
  "Vino": ["Tinto", "Blanco", "Rosado", "Blend"],
  "Espumante": ["Nature", "Extra Brut", "Blanco", "Dulce"],
  "Aperitivo": ["Vermut", "Amargo"],
  "Destilado": ["Gin", "Vodka", "Whisky", "Ron"],
  "Delicatessen": ["Oliva", "Aceto", "Aceitunas", "Pesto", "Dulce", "Cafe"]
};

// 🎨 Ajustados para verse vibrantes en fondo transparente/blanco
const obtenerColorBlob = (categoria, subcategoria) => {
  let color = "text-gray-300/50"; 
  if (categoria === "Vino") {
    if (subcategoria === "Tinto" || subcategoria === "Blend") color = "text-red-800/40";
    else if (subcategoria === "Blanco") color = "text-yellow-400/40";
    else if (subcategoria === "Rosado") color = "text-pink-400/40";
  } else if (categoria === "Espumante") { color = "text-amber-400/40"; } 
  else if (categoria === "Destilado") {
    if (subcategoria === "Gin" || subcategoria === "Vodka") color = "text-cyan-400/40";
    else color = "text-amber-600/40"; 
  } else if (categoria === "Aperitivo") { color = "text-orange-500/40"; }
  else if (categoria === "Delicatessen") { color = "text-stone-400/40"; }
  return color;
};

export default function ProductForm({ productoEnAccion, setProductoEnAccion }) {
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagenGuardadaUrl, setImagenGuardadaUrl] = useState(""); 
  const [showPreview, setShowPreview] = useState(false); 
  
  // 1. AÑADIMOS "origen" AL ESTADO INICIAL
  const [formData, setFormData] = useState({
    categoria: "Vino", subcategoria: "", bodega: "", origen: "", producto: "", varietal: "",
    descripcion: "", costo: "", ganancia: "", stock: "", aPedido: false,
    descuentoPorcentaje: "", descuentoNombre: "", mostrarDescuento: false
  });

  useEffect(() => {
    if (productoEnAccion && productoEnAccion.data) {
      const { data } = productoEnAccion;
      // 2. RECUPERAMOS EL ORIGEN AL EDITAR
      setFormData({
        categoria: data.categoria || "Vino", subcategoria: data.subcategoria || "", bodega: data.bodega || "",
        origen: data.origen || "", // NUEVO
        producto: data.nombre || "", varietal: data.varietal || "", descripcion: data.descripcion || "", 
        costo: data.costo || "", ganancia: data.ganancia || "", stock: data.stock || "",
        aPedido: data.aPedido || false, descuentoPorcentaje: data.descuentoPorcentaje || "",
        descuentoNombre: data.descuentoNombre || "", mostrarDescuento: data.mostrarDescuento || false
      });
      setImagenGuardadaUrl(data.imageUrl || "");
      setImageFile(null); 
    }
  }, [productoEnAccion]);

  const handleCategoriaChange = (e) => setFormData({ ...formData, categoria: e.target.value, subcategoria: "" });
  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const uploadImage = async (file) => {
    try {
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", "upld_decant"); 
      const res = await fetch("https://api.cloudinary.com/v1_1/ds7shexal/image/upload", { method: "POST", body: data });
      const fileRes = await res.json();
      return fileRes.secure_url || "";
    } catch (error) { console.error("Error al subir imagen:", error); return ""; }
  };

  const cerrarModal = () => setProductoEnAccion(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subcategoria || !formData.bodega || !formData.producto || !formData.costo || !formData.ganancia || !formData.descripcion) {
      alert("⚠️ Completa todos los campos obligatorios."); return;
    }
    setLoading(true);

    try {
      let finalImageUrl = imagenGuardadaUrl; 
      if (imageFile) finalImageUrl = await uploadImage(imageFile); 
      
      const costoNum = parseFloat(formData.costo) || 0;
      const gananciaNum = parseFloat(formData.ganancia) || 0;
      const descNum = parseFloat(formData.descuentoPorcentaje) || 0;
      const stockNum = formData.aPedido ? 0 : (parseInt(formData.stock) || 0);
      const precioBase = costoNum + (costoNum * (gananciaNum / 100)); 
      const precioFinal = precioBase - (precioBase * (descNum / 100)); 

      // 3. AÑADIMOS "origen" AL PAYLOAD QUE SE GUARDA EN FIREBASE
      const payload = {
        categoria: formData.categoria, subcategoria: formData.subcategoria, bodega: formData.bodega,
        origen: formData.origen, // NUEVO
        nombre: formData.producto, varietal: formData.varietal, descripcion: formData.descripcion, 
        costo: costoNum, ganancia: gananciaNum, precioBase, precioFinal, descuentoPorcentaje: descNum, 
        descuentoNombre: formData.descuentoNombre, mostrarDescuento: formData.mostrarDescuento, 
        stock: stockNum, aPedido: formData.aPedido, imageUrl: finalImageUrl
      };

      if (productoEnAccion?.modo === "editar") {
        const docRef = doc(db, "productos", productoEnAccion.data.id);
        await updateDoc(docRef, { ...payload, updatedAt: serverTimestamp() });
        alert("✅ Producto actualizado correctamente.");
      } else {
        await addDoc(collection(db, "productos"), { ...payload, createdAt: serverTimestamp() });
        alert("🍷 Producto guardado con éxito.");
      }
      cerrarModal(); 
    } catch (error) { alert("Error: " + error.message); } finally { setLoading(false); }
  };

  const isEditMode = productoEnAccion?.modo === "editar";
  const colorDelBlob = obtenerColorBlob(formData.categoria, formData.subcategoria);
  const localImageUrl = imageFile ? URL.createObjectURL(imageFile) : imagenGuardadaUrl;

  const precioBaseCalculado = (parseFloat(formData.costo) || 0) * (1 + ((parseFloat(formData.ganancia) || 0) / 100));
  const precioFinalCalculado = precioBaseCalculado - (precioBaseCalculado * ((parseFloat(formData.descuentoPorcentaje) || 0) / 100));
  const stockActual = parseInt(formData.stock) || 0;

  // --- COMPONENTE DE TARJETA ---
  const TarjetaPreview = () => (
    <div className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl overflow-hidden relative shadow-xl flex flex-col mx-auto">
      
      <div className="relative h-72 w-full flex items-center justify-center pt-6 pb-10 px-6 overflow-hidden bg-transparent">
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <BlobProducto className={`w-80 h-80 ${colorDelBlob} transition-colors duration-500 transform -translate-y-4`} />
         </div>
         
         {localImageUrl ? (
           <img src={localImageUrl} alt="Preview" className="h-full object-contain drop-shadow-xl relative z-10 mix-blend-multiply hover:scale-105 transition-transform duration-500" />
         ) : (
           <span className="text-gray-400 text-sm border border-dashed border-gray-300 p-4 rounded relative z-10 bg-white/50 backdrop-blur-sm">Sin imagen</span>
         )}
         
         <div className="absolute top-4 left-4 flex flex-col gap-2 items-start z-20">
            {formData.descuentoPorcentaje > 0 && (
              <span className="bg-brand-accent text-white text-[10px] font-black uppercase px-3 py-1.5 rounded shadow-lg tracking-widest">
                 -{formData.descuentoPorcentaje}% {formData.mostrarDescuento ? formData.descuentoNombre : ''}
              </span>
            )}
         </div>

         {formData.aPedido ? (
            <div className="absolute bottom-0 left-0 w-full bg-gray-200 text-gray-800 py-2 text-center text-[11px] font-black uppercase tracking-widest z-20">
               A Pedido
            </div>
         ) : (stockActual === 1 || stockActual === 2) && (
            <div className="absolute bottom-0 left-0 w-full bg-brand-accent/10 backdrop-blur-sm py-2 flex justify-center items-center z-20 border-t border-brand-accent/20">
               <div className="text-brand-orange flex items-center gap-2 text-[11px] font-black uppercase tracking-widest animate-pulse">
                 <span className="w-1.5 h-1.5 rounded-full bg-brand-orange"></span> 
                 {stockActual === 1 ? "¡Es el último!" : "Solo quedan 2"}
               </div>
            </div>
         )}
      </div>
      
      <div className="p-6 bg-white flex flex-col flex-grow justify-between border-t border-gray-100 z-30">
         <div>
           {/* 4. AÑADIMOS EL ORIGEN EN EL PREVIEW (Junto a la bodega) */}
           <p className="text-brand-orange text-[10px] font-bold tracking-widest uppercase mb-1">
             {formData.bodega || "BODEGA"} {formData.origen && <span className="text-gray-400">| {formData.origen}</span>}
           </p>
           <h3 className="text-gray-900 text-xl font-bold leading-tight mb-1">{formData.producto || "Nombre del Producto"}</h3>
           <p className="text-gray-500 text-xs mb-2">{formData.varietal || "Varietal"}</p>
           
           <p className="text-gray-600 text-xs mb-4 line-clamp-3 leading-relaxed min-h-[3rem]">
             {formData.descripcion || "La descripción del producto aparecerá aquí. Los clientes podrán leer los detalles principales."}
           </p>
         </div>
         
         <div className="mt-auto">
            <div className="flex items-end justify-between">
                <div className="flex flex-col">
                    {formData.descuentoPorcentaje > 0 && (
                      <span className="text-gray-400 line-through text-sm font-medium">
                        ${precioBaseCalculado.toLocaleString()}
                      </span>
                    )}
                    <span className="text-gray-900 text-3xl font-black tracking-tight">
                      ${precioFinalCalculado.toLocaleString()}
                    </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-brand-accent flex items-center justify-center text-white font-bold text-xl hover:bg-brand-orange transition-colors cursor-pointer shadow-md">
                  +
                </div>
            </div>
         </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 md:p-8">
        
        <div className={`relative w-full max-w-6xl h-[90vh] md:h-[85vh] flex flex-col lg:flex-row overflow-hidden rounded-xl shadow-2xl border transition-colors ${isEditMode ? 'border-yellow-400 bg-yellow-50' : 'bg-white border-gray-200'}`}>
          
          <div className="w-full lg:w-[55%] h-full overflow-y-auto p-6 md:p-8 custom-scrollbar">
            <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4 sticky top-0 bg-inherit z-10">
              <div>
                <h2 className={`text-xl font-bold uppercase tracking-wider ${isEditMode ? 'text-yellow-600' : 'text-brand-accent'}`}>
                  {isEditMode ? "✏️ Editando Botella" : (productoEnAccion?.modo === "copiar" ? "📄 Copiando Botella" : "Añadir a la Cava")}
                </h2>
              </div>
              <div className="flex gap-2 items-center">
                <button type="button" onClick={() => setShowPreview(true)} className="lg:hidden px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-bold border border-gray-200 rounded hover:bg-gray-200 transition-all flex items-center gap-2">
                  👁️ Preview
                </button>
                <button type="button" onClick={cerrarModal} className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all text-xl font-bold border border-red-100">
                  ✕
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select name="categoria" value={formData.categoria} onChange={handleCategoriaChange} className="bg-white border border-gray-300 p-3 rounded text-gray-900 focus:border-brand-accent outline-none shadow-sm">
                {Object.keys(diccionarioCategorias).map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <select name="subcategoria" value={formData.subcategoria} onChange={handleChange} required className="bg-white border border-gray-300 p-3 rounded text-gray-900 focus:border-brand-accent outline-none shadow-sm">
                <option value="">Subcategoría... *</option>
                {(diccionarioCategorias[formData.categoria] || []).map(sub => <option key={sub} value={sub}>{sub}</option>)}
              </select>

              <input required type="text" name="bodega" value={formData.bodega} onChange={handleChange} placeholder="Bodega / Productor *" className="bg-white border border-gray-300 p-3 rounded text-gray-900 focus:border-brand-accent outline-none shadow-sm" />
              <input required type="text" name="producto" value={formData.producto} onChange={handleChange} placeholder="Nombre del Producto *" className="bg-white border border-gray-300 p-3 rounded text-gray-900 focus:border-brand-accent outline-none shadow-sm" />
              <input required type="text" name="varietal" value={formData.varietal} onChange={handleChange} placeholder="Varietal / Tipo *" className="bg-white border border-gray-300 p-3 rounded text-gray-900 focus:border-brand-accent outline-none shadow-sm" />
              
              {/* 5. AÑADIMOS EL INPUT DE ORIGEN AL FORMULARIO */}
              <input type="text" name="origen" value={formData.origen} onChange={handleChange} placeholder="Origen (Ej: Mendoza, ARG)" className="bg-white border border-gray-300 p-3 rounded text-gray-900 focus:border-brand-accent outline-none shadow-sm" />

              <div className="md:col-span-2">
                 <textarea required name="descripcion" value={formData.descripcion} onChange={handleChange} placeholder="Descripción detallada del producto *" className="w-full bg-white border border-gray-300 p-3 rounded text-gray-900 focus:border-brand-accent outline-none h-24 resize-none shadow-sm"></textarea>
              </div>
              
              <div className="flex gap-2 md:col-span-2">
                <input required type="number" name="costo" value={formData.costo} onChange={handleChange} placeholder="Costo ($) *" className="w-1/2 bg-white border border-gray-300 p-3 rounded text-gray-900 focus:border-brand-accent outline-none shadow-sm" />
                <input required type="number" name="ganancia" value={formData.ganancia} onChange={handleChange} placeholder="% Gan. *" className="w-1/2 bg-white border border-gray-300 p-3 rounded text-gray-900 focus:border-brand-accent outline-none shadow-sm" />
              </div>

              <div className="md:col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col md:flex-row gap-4 items-center">
                 <div className="w-full md:w-1/2">
                    <label className="text-xs text-gray-500 font-bold mb-1 block uppercase tracking-widest">Unidades Físicas</label>
                    <input required={!formData.aPedido} disabled={formData.aPedido} type="number" name="stock" value={formData.aPedido ? "" : formData.stock} onChange={handleChange} placeholder={formData.aPedido ? "No aplica (A Pedido)" : "Stock Actual *"} className="w-full bg-white border border-gray-300 p-3 rounded text-gray-900 focus:border-brand-orange outline-none disabled:bg-gray-100 disabled:text-gray-400 shadow-sm" />
                 </div>
                 <div className="w-full md:w-1/2 flex items-center justify-start gap-3 md:pt-5 border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pl-6">
                    <input type="checkbox" name="aPedido" checked={formData.aPedido} onChange={handleChange} className="w-5 h-5 accent-brand-accent cursor-pointer rounded" id="chkPedido" />
                    <label htmlFor="chkPedido" className="text-sm text-gray-700 cursor-pointer select-none font-bold">Es un producto "A Pedido"</label>
                 </div>
              </div>

              <div className="md:col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-widest">Zona de Promociones</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input type="number" name="descuentoPorcentaje" value={formData.descuentoPorcentaje} onChange={handleChange} placeholder="% Descuento" className="bg-white border border-gray-300 p-3 rounded text-gray-900 focus:border-brand-orange outline-none shadow-sm" />
                  <input type="text" name="descuentoNombre" value={formData.descuentoNombre} onChange={handleChange} placeholder="Motivo (ej: Día Malbec)" className="bg-white border border-gray-300 p-3 rounded text-gray-900 focus:border-brand-orange outline-none shadow-sm" />
                  <div className="flex items-center gap-2 bg-white border border-gray-300 p-3 rounded shadow-sm">
                    <input type="checkbox" name="mostrarDescuento" checked={formData.mostrarDescuento} onChange={handleChange} className="w-5 h-5 accent-brand-orange cursor-pointer rounded" id="chkDesc" />
                    <label htmlFor="chkDesc" className="text-sm text-gray-700 cursor-pointer select-none">Mostrar en web</label>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                 <input required={!isEditMode && !imagenGuardadaUrl} type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer w-full"/>
                 <p className="text-xs text-brand-orange mt-2 font-medium">
                    {imagenGuardadaUrl ? "✅ Ya tiene una foto. Sube otra solo si quieres reemplazarla." : "* Sube el PNG transparente."}
                 </p>
              </div>
              
              <button disabled={loading} className={`md:col-span-2 w-full mt-4 text-white font-black py-4 rounded-xl transition-colors uppercase tracking-widest text-lg shadow-md ${isEditMode ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-brand-accent hover:bg-brand-orange'}`}>
                {loading ? "Procesando..." : (isEditMode ? "Actualizar Inventario" : "Guardar Producto")}
              </button>

            </form>
          </div>

          <div className="hidden lg:flex lg:w-[45%] bg-gray-50 border-l border-gray-200 flex-col items-center justify-center p-8 relative">
            <h3 className="absolute top-6 left-6 text-gray-400 font-bold uppercase tracking-widest text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Live Preview
            </h3>
            <TarjetaPreview />
          </div>

        </div>
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4 lg:hidden">
          <div className="relative w-full">
            <button onClick={() => setShowPreview(false)} className="absolute -top-12 right-0 z-20 w-10 h-10 bg-white border border-gray-200 text-gray-800 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors shadow-lg">✕</button>
            <TarjetaPreview />
          </div>
        </div>
      )}
    </>
  );
}