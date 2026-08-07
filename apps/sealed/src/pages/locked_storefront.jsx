import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '@decant/firebase-client';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import AdminNavbar from '../components/layout/AdminNavbar';
import { useCatalog } from '../context/CatalogContext';

// =========================================================
// HELPERS (Fuera del render para estabilidad total)
// =========================================================

const AccordionSection = ({ title, children, isOpen, onClick }) => (
  <section className="bg-white border border-light-blue/20 rounded-sm shadow-sm overflow-hidden mb-4 font-poppins text-extra-black">
    <button onClick={onClick} className="w-full p-5 flex justify-between items-center bg-gray-50/50 hover:bg-gray-100 transition-colors outline-none">
      <h2 className="font-bold text-[11px] uppercase tracking-widest">{title}</h2>
      <svg className={`w-4 h-4 text-dark-grey transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
    </button>
    <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
      <div className="p-6 border-t border-light-blue/10">{children}</div>
    </div>
  </section>
);

const crearRecetaVacia = () => ({
  id: Date.now().toString(),
  tema: 'oliva', 
  tituloReceta: '', 
  textoReceta: '', 
  linkProducto: '', 
  botonSecundarioTexto: 'Descubrí Deli', 
  botonSecundarioLink: '/shop/deli', 
  imgProductoUrl: '', 
  imgProductoFile: null
});

const crearSlideVacio = () => ({ 
  id: Date.now().toString(), 
  titulo: "", 
  subtitulo: "", 
  botonPrincipalTexto: "", 
  botonPrincipalLink: "", 
  botonSecundarioActivo: false, 
  botonSecundarioTexto: "", 
  botonSecundarioLink: "", 
  imageUrl: "", 
  imageFile: null 
});

const uploadImage = async (file, folder = "decant/storefront/general") => {
  if (!file) return "";
  try {
    const data = new FormData(); 
    data.append("file", file); 
    data.append("upload_preset", "upld_decant");
    data.append("folder", folder);
    const res = await fetch("https://api.cloudinary.com/v1_1/ds7shexal/image/upload", { method: "POST", body: data });
    const fileRes = await res.json(); 
    return fileRes.secure_url || "";
  } catch (error) { 
    return ""; 
  }
};

// =========================================================
// COMPONENTE PRINCIPAL
// =========================================================

export default function LockedStorefront() {
  const { menuTree } = useCatalog(); 
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [openSection, setOpenSection] = useState('categorias');

  // ESTADOS
  const [valueProps, setValueProps] = useState([]);
  const [anuncios, setAnuncios] = useState([]);
  const [heroSlides, setHeroSlides] = useState([]);
  const [seccionClub, setSeccionClub] = useState({ 
    bodegasSeleccion1Urls: [], bodegasSeleccion1Files: [],
    bodegasSeleccion2Urls: [], bodegasSeleccion2Files: [] 
  });
  const [listaDeli, setListaDeli] = useState([crearRecetaVacia()]);
  const [catImagesUrls, setCatImagesUrls] = useState({});
  const [catImagesFiles, setCatImagesFiles] = useState({});
  const [datosEmpresa, setDatosEmpresa] = useState({
    whatsapp: '5493416878568', email: 'the.decantclub@gmail.com', instagram: 'www.instagram.com/_decantclub', direccion: 'Italia 341, Rosario'
  });

  // LECTURA DE FIREBASE
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'ajustes_storefront', 'home'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setValueProps(data.valueProps || []);
        setAnuncios(data.anuncios || []);
        setHeroSlides(data.heroSlides?.length > 0 ? data.heroSlides : [crearSlideVacio()]);
        setSeccionClub(data.seccionClub ? { ...data.seccionClub, bodegasSeleccion1Files: [], bodegasSeleccion2Files: [] } : { bodegasSeleccion1Urls: [], bodegasSeleccion2Urls: [] });
        setListaDeli(data.listaDeli?.length > 0 ? data.listaDeli : [crearRecetaVacia()]);
        setCatImagesUrls(data.imagenesCategorias || {});
        if (data.datosEmpresa) setDatosEmpresa(data.datosEmpresa);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // HANDLERS
  const handleAnuncioChange = (index, campo, valor) => { const nuevos = [...anuncios]; nuevos[index][campo] = valor; setAnuncios(nuevos); };
  const handleSlideChange = (index, campo, valor) => { const nuevos = [...heroSlides]; nuevos[index][campo] = valor; setHeroSlides(nuevos); };
  const handleValuePropChange = (index, campo, valor) => { const nuevos = [...valueProps]; nuevos[index][campo] = valor; setValueProps(nuevos); };
  const handleDeliChange = (index, campo, valor) => { const nuevos = [...listaDeli]; nuevos[index][campo] = valor; setListaDeli(nuevos); };
  const handleEmpresaChange = (campo, valor) => { setDatosEmpresa(prev => ({ ...prev, [campo]: valor })); };

  // GUARDAR
  const handleGuardarCambios = async () => {
    setIsSaving(true);
    try {
      const slidesParaGuardar = await Promise.all(heroSlides.map(async (slide) => {
        let finalUrl = slide.imageUrl;
        if (slide.imageFile) finalUrl = await uploadImage(slide.imageFile, "decant/storefront/hero") || finalUrl;
        return { ...slide, imageUrl: finalUrl, imageFile: null };
      }));

      const deliParaGuardar = await Promise.all(listaDeli.map(async (deli) => {
          let finalUrl = deli.imgProductoUrl;
          if (deli.imgProductoFile) finalUrl = await uploadImage(deli.imgProductoFile, "decant/storefront/deli") || finalUrl;
          return { ...deli, imgProductoUrl: finalUrl, imgProductoFile: null };
      }));

      let finalCatUrls = { ...catImagesUrls };
      for (const cat of Object.keys(menuTree || {})) {
        if (catImagesFiles[cat]) finalCatUrls[cat] = await uploadImage(catImagesFiles[cat], "decant/storefront/categorias");
      }

      const payload = {
        valueProps, anuncios, heroSlides: slidesParaGuardar,
        seccionClub: { 
          bodegasSeleccion1Urls: seccionClub.bodegasSeleccion1Urls,
          bodegasSeleccion2Urls: seccionClub.bodegasSeleccion2Urls
        },
        listaDeli: deliParaGuardar, 
        imagenesCategorias: finalCatUrls,
        datosEmpresa,
        updatedAt: new Date()
      };

      await setDoc(doc(db, 'ajustes_storefront', 'home'), payload, { merge: true });
      alert("Publicado con éxito.");
    } catch (error) { alert("Error al guardar."); }
    finally { setIsSaving(false); }
  };

  if (loading) return <div className="min-h-screen bg-[#F4F7FA] flex items-center justify-center font-poppins text-xs uppercase tracking-widest animate-pulse">Cargando...</div>;

  return (
    <div className="min-h-screen bg-[#F4F7FA] font-poppins text-extra-black flex flex-col">
      <AdminNavbar />
      <main className="flex-1 max-w-[95rem] w-full mx-auto pt-8 px-6 pb-20">
        
        <div className="mb-8 flex justify-between items-end border-b border-light-blue/10 pb-6">
          <div>
            <Link to="/locked_cellar" className="text-[10px] font-bold uppercase tracking-widest text-light-blue mb-4 block outline-none hover:text-brand-orange">← Dashboard</Link>
            <h1 className="text-2xl font-bold uppercase tracking-widest">Diseño de Interfaz</h1>
          </div>
          <button onClick={handleGuardarCambios} disabled={isSaving} className="bg-extra-black text-white px-8 py-3 rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-brand-orange disabled:opacity-50 transition-all outline-none">
            {isSaving ? 'Publicando...' : 'Publicar Cambios'}
          </button>
        </div>

        <div className="flex flex-col gap-2 max-w-4xl">
          
          {/* 1. CATEGORÍAS */}
          <AccordionSection title="1. Grilla de Categorías" isOpen={openSection === 'categorias'} onClick={() => setOpenSection(openSection === 'categorias' ? '' : 'categorias')}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.keys(menuTree || {}).map((cat) => (
                <div key={cat} className="bg-gray-50 p-4 border border-light-blue/10 rounded-sm">
                  <p className="text-[10px] font-bold uppercase text-brand-orange mb-3">{cat}</p>
                  <input type="file" accept="image/*" onChange={e => setCatImagesFiles(prev => ({...prev, [cat]: e.target.files[0]}))} className="text-[10px] p-1.5 bg-white border border-light-blue/10 w-full cursor-pointer" />
                  {catImagesUrls[cat] && !catImagesFiles[cat] && <p className="text-[9px] text-green-600 font-bold uppercase mt-1.5">✓ Imagen en servidor</p>}
                </div>
              ))}
            </div>
          </AccordionSection>

          {/* 2. VALUE PROPS */}
          <AccordionSection title="2. Iconos de Confianza" isOpen={openSection === 'valueProps'} onClick={() => setOpenSection(openSection === 'valueProps' ? '' : 'valueProps')}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {valueProps.map((prop, i) => (
                <div key={i} className="bg-gray-50 p-4 border border-light-blue/10 rounded-sm">
                  <input type="text" value={prop.titulo} onChange={e => handleValuePropChange(i, 'titulo', e.target.value)} placeholder="Título" className="w-full border p-2 text-xs mb-2 outline-none" />
                  <input type="text" value={prop.subtitulo} onChange={e => handleValuePropChange(i, 'subtitulo', e.target.value)} placeholder="Subtítulo" className="w-full border p-2 text-[10px] outline-none" />
                </div>
              ))}
            </div>
          </AccordionSection>

          {/* 3. ANUNCIOS */}
          <AccordionSection title="3. Banner de Anuncios" isOpen={openSection === 'anuncios'} onClick={() => setOpenSection(openSection === 'anuncios' ? '' : 'anuncios')}>
             <div className="flex flex-col gap-4">
              {anuncios.map((a, i) => (
                <div key={i} className="flex gap-4 bg-gray-50 p-4 border border-light-blue/10 rounded-sm">
                  <input type="checkbox" checked={a.activo} onChange={e => handleAnuncioChange(i, 'activo', e.target.checked)} className="accent-brand-orange" />
                  <input type="text" value={a.texto} onChange={e => handleAnuncioChange(i, 'texto', e.target.value)} className="flex-1 border p-2 text-xs outline-none" />
                </div>
              ))}
            </div>
          </AccordionSection>

          {/* 4. HERO SLIDES */}
          <AccordionSection title="4. Carrusel Principal (Hero)" isOpen={openSection === 'hero'} onClick={() => setOpenSection(openSection === 'hero' ? '' : 'hero')}>
            <button onClick={() => setHeroSlides([...heroSlides, crearSlideVacio()])} className="mb-4 bg-extra-black text-white px-4 py-2 text-[9px] font-bold uppercase"> + Agregar Slide </button>
            <div className="space-y-6">
              {heroSlides.map((s, i) => (
                <div key={s.id} className="bg-gray-50 p-5 border border-light-blue/10 relative rounded-sm">
                  <button onClick={() => setHeroSlides(heroSlides.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 text-red-500 text-[9px] font-bold">ELIMINAR</button>
                  <input type="file" onChange={e => handleSlideChange(i, 'imageFile', e.target.files[0])} className="text-[10px] mb-2 w-full" />
                  <input type="text" value={s.titulo} onChange={e => handleSlideChange(i, 'titulo', e.target.value)} placeholder="Título" className="w-full border p-2 text-xs mb-2 outline-none" />
                  <input type="text" value={s.subtitulo} onChange={e => handleSlideChange(i, 'subtitulo', e.target.value)} placeholder="Subtítulo" className="w-full border p-2 text-xs outline-none" />
                </div>
              ))}
            </div>
          </AccordionSection>

          {/* 6. DELI & TIPS */}
          <AccordionSection title="6. Deli & Tips" isOpen={openSection === 'deli'} onClick={() => setOpenSection(openSection === 'deli' ? '' : 'deli')}>
            <button onClick={() => setListaDeli([...listaDeli, crearRecetaVacia()])} className="mb-4 bg-extra-black text-white px-4 py-2 text-[9px] font-bold uppercase"> + Agregar Receta </button>
            <div className="space-y-6">
              {listaDeli.map((deli, i) => (
                <div key={deli.id} className="bg-gray-50 p-5 border border-light-blue/10 relative rounded-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button onClick={() => setListaDeli(listaDeli.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 text-red-500 text-[9px] font-bold">ELIMINAR</button>
                  <div className="space-y-2">
                    <input type="text" value={deli.tituloReceta} onChange={e => handleDeliChange(i, 'tituloReceta', e.target.value)} placeholder="Título" className="w-full border p-2 text-xs font-bold outline-none" />
                    <textarea value={deli.textoReceta} onChange={e => handleDeliChange(i, 'textoReceta', e.target.value)} rows="4" className="w-full border p-2 text-xs outline-none" placeholder="Texto..." />
                  </div>
                  <div className="space-y-2">
                    <input type="file" onChange={e => handleDeliChange(i, 'imgProductoFile', e.target.files[0])} className="text-[10px] w-full" />
                    <input type="text" value={deli.linkProducto} onChange={e => handleDeliChange(i, 'linkProducto', e.target.value)} placeholder="Link Producto" className="w-full border p-2 text-[10px] outline-none" />
                  </div>
                </div>
              ))}
            </div>
          </AccordionSection>

          {/* 7. CONTACTO */}
          <AccordionSection title="7. Datos de Contacto y Redes" isOpen={openSection === 'contacto'} onClick={() => setOpenSection(openSection === 'contacto' ? '' : 'contacto')}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-5 border border-light-blue/10 rounded-sm">
              <div>
                <label className="block text-[9px] font-bold text-dark-grey mb-2 uppercase tracking-widest">WhatsApp</label>
                <input type="text" value={datosEmpresa.whatsapp} onChange={e => handleEmpresaChange('whatsapp', e.target.value)} className="w-full border p-2.5 text-xs bg-white outline-none focus:border-brand-orange" />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-dark-grey mb-2 uppercase tracking-widest">Email</label>
                <input type="email" value={datosEmpresa.email} onChange={e => handleEmpresaChange('email', e.target.value)} className="w-full border p-2.5 text-xs bg-white outline-none focus:border-brand-orange" />
              </div>
            </div>
          </AccordionSection>

        </div>
      </main>
    </div>
  );
}