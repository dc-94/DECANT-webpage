import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../config/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import AdminNavbar from '../components/layout/AdminNavbar';
import { useCatalog } from '../context/CatalogContext';

const AccordionSection = ({ title, children, isOpen, onClick }) => (
  <section className="bg-white border border-light-blue/20 rounded-sm shadow-sm overflow-hidden mb-4 font-poppins">
    <button onClick={onClick} className="w-full p-5 flex justify-between items-center bg-gray-50/50 hover:bg-gray-100 transition-colors outline-none">
      <h2 className="font-bold text-[11px] uppercase tracking-widest text-extra-black">{title}</h2>
      <svg className={`w-4 h-4 text-dark-grey transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
    </button>
    <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}`}>
      <div className="p-6 border-t border-light-blue/10">{children}</div>
    </div>
  </section>
);

export default function LockedStorefront() {
  const { menuTree } = useCatalog(); 
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [openSection, setOpenSection] = useState('categorias');

  const [valueProps, setValueProps] = useState([]);
  const [anuncios, setAnuncios] = useState([]);
  const [heroSlides, setHeroSlides] = useState([]);
  
  // 👇 ESTADO LIMPIO: Solo manejamos los logos de las bodegas
  const [seccionClub, setSeccionClub] = useState({ 
    bodegasSeleccion1Urls: [], bodegasSeleccion1Files: [],
    bodegasSeleccion2Urls: [], bodegasSeleccion2Files: [] 
  });
  
  const [seccionDeli, setSeccionDeli] = useState({ 
    tema: 'oliva', tituloReceta: '', textoReceta: '', linkProducto: '', botonSecundarioTexto: 'Descubrí Deli', botonSecundarioLink: '/shop/deli', imgProductoUrl: '', imgProductoFile: null 
  });
  
  const [catImagesUrls, setCatImagesUrls] = useState({});
  const [catImagesFiles, setCatImagesFiles] = useState({});

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'ajustes_storefront', 'home'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        if (data.valueProps && data.valueProps.length > 0) {
          setValueProps(data.valueProps);
        } else {
          setValueProps([
            { titulo: 'Envíos a todo el país', subtitulo: 'Con embalaje de seguridad' },
            { titulo: 'Cuidado en Bodega', subtitulo: 'Temperatura controlada' },
            { titulo: 'Asesoría Personalizada', subtitulo: 'Sommelier a disposición' },
            { titulo: 'Pago Seguro', subtitulo: 'Transacciones encriptadas' }
          ]);
        }

        if (data.anuncios) setAnuncios(data.anuncios);
        if (data.heroSlides && data.heroSlides.length > 0) setHeroSlides(data.heroSlides); else setHeroSlides([crearSlideVacio()]);
        
        // 👇 Carga inicial limpia
        if (data.seccionClub) setSeccionClub({ ...data.seccionClub, bodegasSeleccion1Files: [], bodegasSeleccion2Files: [] });
        
        if (data.seccionDeli) setSeccionDeli({ ...data.seccionDeli, imgProductoFile: null });
        if (data.imagenesCategorias) setCatImagesUrls(data.imagenesCategorias);
      } else {
        setHeroSlides([crearSlideVacio()]);
        setValueProps([
          { titulo: 'Envíos a todo el país', subtitulo: 'Con embalaje de seguridad' },
          { titulo: 'Cuidado en Bodega', subtitulo: 'Temperatura controlada' },
          { titulo: 'Asesoría Personalizada', subtitulo: 'Sommelier a disposición' },
          { titulo: 'Pago Seguro', subtitulo: 'Transacciones encriptadas' }
        ]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const crearSlideVacio = () => ({ id: Date.now().toString(), titulo: "", subtitulo: "", botonPrincipalTexto: "", botonPrincipalLink: "", botonSecundarioActivo: false, botonSecundarioTexto: "", botonSecundarioLink: "", imageUrl: "", imageFile: null });

  const handleAnuncioChange = (index, campo, valor) => { const nuevos = [...anuncios]; nuevos[index][campo] = valor; setAnuncios(nuevos); };
  const handleSlideChange = (index, campo, valor) => { const nuevos = [...heroSlides]; nuevos[index][campo] = valor; setHeroSlides(nuevos); };
  const handleValuePropChange = (index, campo, valor) => { const nuevos = [...valueProps]; nuevos[index][campo] = valor; setValueProps(nuevos); };

  const uploadImage = async (file, folder = "decant/storefront/general") => {
    if (!file) return "";
    try {
      const data = new FormData(); 
      data.append("file", file); 
      data.append("upload_preset", "upld_decant");
      data.append("folder", folder);
      const res = await fetch("https://api.cloudinary.com/v1_1/ds7shexal/image/upload", { method: "POST", body: data });
      const fileRes = await res.json(); return fileRes.secure_url || "";
    } catch (error) { return ""; }
  };

  const handleGuardarCambios = async () => {
    setIsSaving(true);
    try {
      const slidesParaGuardar = await Promise.all(heroSlides.map(async (slide) => {
        let finalUrl = slide.imageUrl;
        if (slide.imageFile) finalUrl = await uploadImage(slide.imageFile, "decant/storefront/hero") || finalUrl;
        return { ...slide, imageUrl: finalUrl, imageFile: null };
      }));

      // 👇 GUARDADO LIMPIO: Solo procesamos los logos de las bodegas
      let bodegas1Urls = seccionClub.bodegasSeleccion1Urls || [];
      let bodegas2Urls = seccionClub.bodegasSeleccion2Urls || [];
      if (seccionClub.bodegasSeleccion1Files?.length > 0) {
        bodegas1Urls = await Promise.all(seccionClub.bodegasSeleccion1Files.map(f => uploadImage(f, "decant/storefront/club/bodegas")));
      }
      if (seccionClub.bodegasSeleccion2Files?.length > 0) {
        bodegas2Urls = await Promise.all(seccionClub.bodegasSeleccion2Files.map(f => uploadImage(f, "decant/storefront/club/bodegas")));
      }

      let finalDeliImg = seccionDeli.imgProductoUrl;
      if (seccionDeli.imgProductoFile) finalDeliImg = await uploadImage(seccionDeli.imgProductoFile, "decant/storefront/deli");

      let finalCatUrls = { ...catImagesUrls };
      const categoriasActivas = Object.keys(menuTree || {});
      for (const cat of categoriasActivas) {
        if (catImagesFiles[cat]) {
          finalCatUrls[cat] = await uploadImage(catImagesFiles[cat], "decant/storefront/categorias");
        }
      }

      const payload = {
        valueProps, 
        anuncios, 
        heroSlides: slidesParaGuardar,
        // 👇 PAYLOAD LIMPIO: Solo subimos las URLs de los logos
        seccionClub: { 
          bodegasSeleccion1Urls: bodegas1Urls,
          bodegasSeleccion2Urls: bodegas2Urls
        },
        seccionDeli: { ...seccionDeli, imgProductoUrl: finalDeliImg, imgProductoFile: null },
        imagenesCategorias: finalCatUrls,
        updatedAt: new Date()
      };

      await setDoc(doc(db, 'ajustes_storefront', 'home'), payload, { merge: true });
      setCatImagesFiles({});
      alert("Storefront publicado con éxito.");
    } catch (error) { alert("Error al guardar."); }
    finally { setIsSaving(false); }
  };

  if (loading) return <div className="min-h-screen bg-[#F4F7FA] flex items-center justify-center font-poppins text-xs uppercase tracking-widest animate-pulse">Cargando...</div>;

  const categoriasMenu = Object.keys(menuTree || {});

  return (
    <div className="min-h-screen bg-[#F4F7FA] font-poppins text-extra-black flex flex-col">
      <AdminNavbar />
      <main className="flex-1 max-w-[95rem] w-full mx-auto pt-8 px-6 pb-20">
        
        <div className="mb-8 flex justify-between items-end border-b border-light-blue/10 pb-6">
          <div>
            <Link to="/locked_cellar" className="text-[10px] font-bold uppercase tracking-widest text-light-blue mb-4 block outline-none">← Dashboard</Link>
            <h1 className="text-2xl font-bold uppercase tracking-widest">Diseño de Interfaz</h1>
          </div>
          <button onClick={handleGuardarCambios} disabled={isSaving} className="bg-extra-black text-white px-8 py-3 rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-brand-orange disabled:opacity-50 transition-all outline-none">
            {isSaving ? 'Publicando...' : 'Publicar Cambios'}
          </button>
        </div>

        <div className="flex flex-col gap-2 max-w-4xl">
          
          <AccordionSection title="1. Grilla de Categorías (Bento Box Aleatorio)" isOpen={openSection === 'categorias'} onClick={() => setOpenSection(openSection === 'categorias' ? '' : 'categorias')}>
            <p className="text-[10px] text-dark-grey mb-6">El diseño mezclará las fotos en distintos tamaños y agregará bloques transparentes para un efecto de "mosaico incompleto".</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {categoriasMenu.map((cat) => (
                <div key={cat} className="bg-gray-50 p-4 border border-light-blue/10 rounded-sm">
                  <p className="text-[10px] font-bold uppercase text-brand-orange mb-3">{cat}</p>
                  <label className="block text-[8px] font-bold text-dark-grey mb-1 uppercase tracking-widest">Imagen de Categoría</label>
                  <input type="file" accept="image/*" onChange={e => setCatImagesFiles(prev => ({...prev, [cat]: e.target.files[0]}))} className="text-[10px] p-1.5 bg-white border border-light-blue/10 w-full cursor-pointer" />
                  {catImagesUrls[cat] && !catImagesFiles[cat] && <p className="text-[9px] text-green-600 font-bold uppercase mt-1.5">Imagen en servidor.</p>}
                </div>
              ))}
            </div>
          </AccordionSection>

          <AccordionSection title="2. Iconos de Confianza (Value Props)" isOpen={openSection === 'valueProps'} onClick={() => setOpenSection(openSection === 'valueProps' ? '' : 'valueProps')}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {valueProps.map((prop, i) => (
                <div key={i} className="bg-gray-50 p-4 border border-light-blue/10 rounded-sm">
                  <p className="text-[9px] font-bold uppercase text-brand-orange mb-3">Icono {i + 1}</p>
                  <input type="text" value={prop.titulo} onChange={e => handleValuePropChange(i, 'titulo', e.target.value)} placeholder="Título principal" className="w-full border border-light-blue/20 p-2.5 text-xs bg-white outline-none focus:border-brand-orange mb-2" />
                  <input type="text" value={prop.subtitulo} onChange={e => handleValuePropChange(i, 'subtitulo', e.target.value)} placeholder="Subtítulo corto" className="w-full border border-light-blue/20 p-2 text-[10px] bg-white outline-none focus:border-brand-orange" />
                </div>
              ))}
            </div>
          </AccordionSection>

          <AccordionSection title="3. Banner de Anuncios" isOpen={openSection === 'anuncios'} onClick={() => setOpenSection(openSection === 'anuncios' ? '' : 'anuncios')}>
             <div className="flex flex-col gap-6">
              {anuncios.map((a, i) => (
                <div key={a.id} className="flex flex-col md:flex-row gap-4 bg-gray-50 p-4 border border-light-blue/10 rounded-sm">
                  <label className="flex flex-col items-center gap-2 border-r pr-4 shrink-0">
                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-50">Activo</span>
                    <input type="checkbox" checked={a.activo} onChange={e => handleAnuncioChange(i, 'activo', e.target.checked)} className="accent-brand-orange w-4 h-4 cursor-pointer" />
                  </label>
                  <div className="flex-1 flex flex-col gap-3">
                    <input type="text" value={a.texto} onChange={e => handleAnuncioChange(i, 'texto', e.target.value)} placeholder="Texto del mensaje..." className="w-full border p-2 text-xs outline-none focus:border-brand-orange bg-white" />
                    <input type="text" value={a.link} onChange={e => handleAnuncioChange(i, 'link', e.target.value)} placeholder="Link (Opcional, ej: /shop)" className="w-full border p-2 text-xs outline-none focus:border-brand-orange bg-white" />
                  </div>
                </div>
              ))}
            </div>
          </AccordionSection>

          <AccordionSection title="4. Carrusel Principal (Hero)" isOpen={openSection === 'hero'} onClick={() => setOpenSection(openSection === 'hero' ? '' : 'hero')}>
             <button onClick={() => setHeroSlides([...heroSlides, crearSlideVacio()])} className="mb-6 bg-extra-black text-white px-4 py-2 text-[9px] font-bold uppercase hover:bg-brand-orange outline-none transition-colors"> + Agregar Slide </button>
            <div className="flex flex-col gap-8">
              {heroSlides.map((s, i) => (
                <div key={s.id} className="bg-gray-50 p-5 border border-light-blue/10 relative rounded-sm">
                  <button onClick={() => { if(window.confirm("¿Eliminar slide?")) setHeroSlides(heroSlides.filter((_, idx) => idx !== i)) }} className="absolute top-3 right-3 text-[9px] text-red-500 font-bold uppercase hover:underline outline-none">Eliminar</button>
                  <div className="grid gap-4 mt-4">
                    <div>
                      <label className="block text-[9px] font-bold text-dark-grey mb-1 uppercase tracking-widest">Imagen de Fondo *</label>
                      <input type="file" accept="image/*" onChange={e => handleSlideChange(i, 'imageFile', e.target.files[0])} className="text-[10px] p-1.5 bg-white border border-light-blue/10 w-full cursor-pointer" />
                      {s.imageUrl && !s.imageFile && <p className="text-[9px] text-green-600 font-bold uppercase mt-1.5">Imagen en servidor.</p>}
                    </div>
                    <input type="text" value={s.titulo} onChange={e => handleSlideChange(i, 'titulo', e.target.value)} placeholder="Título" className="border p-2.5 text-xs w-full bg-white outline-none focus:border-brand-orange" />
                    <input type="text" value={s.subtitulo} onChange={e => handleSlideChange(i, 'subtitulo', e.target.value)} placeholder="Subtítulo" className="border p-2.5 text-xs w-full bg-white outline-none focus:border-brand-orange" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-3 border border-light-blue/10 rounded-sm">
                        <p className="text-[8px] font-bold uppercase mb-2 text-dark-grey">Botón Principal</p>
                        <input type="text" value={s.botonPrincipalTexto} onChange={e => handleSlideChange(i, 'botonPrincipalTexto', e.target.value)} placeholder="Texto" className="w-full border p-1.5 text-[10px] mb-2 outline-none" />
                        <input type="text" value={s.botonPrincipalLink} onChange={e => handleSlideChange(i, 'botonPrincipalLink', e.target.value)} placeholder="Link" className="w-full border p-1.5 text-[10px] outline-none" />
                      </div>
                      <div className="bg-white p-3 border border-light-blue/10 rounded-sm">
                        <p className="text-[8px] font-bold uppercase mb-2 flex justify-between text-dark-grey">Secundario <input type="checkbox" checked={s.botonSecundarioActivo} onChange={e => handleSlideChange(i, 'botonSecundarioActivo', e.target.checked)} className="w-3.5 h-3.5 accent-brand-orange" /></p>
                        <input type="text" disabled={!s.botonSecundarioActivo} value={s.botonSecundarioTexto} onChange={e => handleSlideChange(i, 'botonSecundarioTexto', e.target.value)} placeholder="Texto" className="w-full border p-1.5 text-[10px] mb-2 outline-none disabled:bg-gray-100" />
                        <input type="text" disabled={!s.botonSecundarioActivo} value={s.botonSecundarioLink} onChange={e => handleSlideChange(i, 'botonSecundarioLink', e.target.value)} placeholder="Link" className="w-full border p-1.5 text-[10px] outline-none disabled:bg-gray-100" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </AccordionSection>

          {/* 5. CLUB DE VINOS (VERSIÓN LIMPIA) */}
          <AccordionSection title="5. Logos Bodegas (Suscripciones)" isOpen={openSection === 'club'} onClick={() => setOpenSection(openSection === 'club' ? '' : 'club')}>
            <p className="text-[10px] text-dark-grey mb-6 leading-relaxed max-w-2xl">
              Las imágenes de las botellas, los precios y descripciones de las membresías ahora se gestionan directamente desde la pestaña <b>Productos</b> (Subiendo un producto "Descorche" o "Terruño"). Aquí solo puedes actualizar los logos de las bodegas participantes del mes.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[1, 2].map(num => (
                <div key={num} className="bg-gray-50 p-5 border border-light-blue/10 rounded-sm">
                  <p className="text-[10px] font-bold uppercase mb-4 text-brand-orange">
                    Plan {num === 1 ? 'Descorche' : 'Terruño'}
                  </p>
                  
                  <div className="mb-4">
                    <label className="block text-[9px] font-bold text-dark-grey mb-1 uppercase tracking-widest">Subir Nuevos Logos</label>
                    <input type="file" accept="image/*" multiple onChange={e => setSeccionClub({...seccionClub, [`bodegasSeleccion${num}Files`]: Array.from(e.target.files)})} className="text-[10px] p-1.5 bg-white border border-light-blue/10 w-full cursor-pointer" />
                    <p className="text-[8px] text-light-blue mt-1">Sube 2 o más archivos a la vez. Esto reemplazará los logos actuales en la página web.</p>
                    
                    {seccionClub[`bodegasSeleccion${num}Urls`]?.length > 0 && (
                      <p className="text-[9px] text-green-600 font-bold uppercase mt-3">
                        {seccionClub[`bodegasSeleccion${num}Urls`].length} logos en servidor.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </AccordionSection>

          {/* 6. DELI */}
          <AccordionSection title="6. Deli & Tips" isOpen={openSection === 'deli'} onClick={() => setOpenSection(openSection === 'deli' ? '' : 'deli')}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-poppins">
              <div className="flex flex-col gap-4">
                <select value={seccionDeli.tema} onChange={e => setSeccionDeli({...seccionDeli, tema: e.target.value})} className="border p-2.5 text-xs font-bold uppercase bg-white outline-none">
                  <option value="oliva">🌿 Tema Oliva</option> <option value="cafe">☕ Tema Café</option>
                </select>
                <div>
                  <label className="block text-[9px] font-bold text-dark-grey mb-1 uppercase tracking-widest">Imagen Producto *</label>
                  <input type="file" accept="image/*" onChange={e => setSeccionDeli({...seccionDeli, imgProductoFile: e.target.files[0]})} className="text-[10px] p-1.5 bg-white border border-light-blue/10 w-full cursor-pointer" />
                  {seccionDeli.imgProductoUrl && !seccionDeli.imgProductoFile && <p className="text-[9px] text-green-600 font-bold uppercase mt-1.5">Imagen en servidor.</p>}
                </div>
                <input type="text" value={seccionDeli.linkProducto} onChange={e => setSeccionDeli({...seccionDeli, linkProducto: e.target.value})} placeholder="Link Botón Principal (/shop/id)" className="border p-2.5 text-xs bg-white outline-none" />
                <div className="grid grid-cols-2 gap-2">
                   <input type="text" value={seccionDeli.botonSecundarioTexto} onChange={e => setSeccionDeli({...seccionDeli, botonSecundarioTexto: e.target.value})} placeholder="Txt Botón 2" className="border p-2.5 text-xs bg-white outline-none" />
                   <input type="text" value={seccionDeli.botonSecundarioLink} onChange={e => setSeccionDeli({...seccionDeli, botonSecundarioLink: e.target.value})} placeholder="Link Botón 2" className="border p-2.5 text-xs bg-white outline-none" />
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <input type="text" value={seccionDeli.tituloReceta} onChange={e => setSeccionDeli({...seccionDeli, tituloReceta: e.target.value})} placeholder="Título" className="border p-2.5 text-xs font-bold bg-white outline-none" />
                <textarea rows="7" value={seccionDeli.textoReceta} onChange={e => setSeccionDeli({...seccionDeli, textoReceta: e.target.value})} placeholder="Instrucciones..." className="border p-2.5 text-xs outline-none resize-none bg-white" />
              </div>
            </div>
          </AccordionSection>

        </div>
      </main>
    </div>
  );
}