import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../config/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import SEO from '../components/public/SEO'; 
import MainNavbar from "../components/layout/MainNavbar";
import ProductCard from "../components/public/ProductCard"; 
import { useCatalog } from "../context/CatalogContext"; 
import Footer from '../components/layout/Footer';

const TrustIcons = [
  <svg className="w-6 h-6 mb-3 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  <svg className="w-6 h-6 mb-3 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  <svg className="w-6 h-6 mb-3 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M21 21H3M9 21v-6.5M15 21v-6.5M12 14.5c3.5 0 5-2 5-6.5C17 5 15.5 3 12 3S7 5 7 8c0 4.5 1.5 6.5 5 6.5z" /></svg>,
  <svg className="w-6 h-6 mb-3 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
];

export default function Home() {
  const { productos, menuTree } = useCatalog(); 
  const [storefront, setStorefront] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'ajustes_storefront', 'home'), (docSnap) => {
      if (docSnap.exists()) setStorefront(docSnap.data());
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const slides = storefront?.heroSlides || [];
    if (slides.length <= 1) return;
    const interval = setInterval(() => setCurrentSlide((prev) => (prev + 1) % slides.length), 8000); 
    return () => clearInterval(interval);
  }, [storefront]);

  const categoriasMain = Object.keys(menuTree || {});
  const bentoItems = useMemo(() => {
    if (categoriasMain.length === 0) return [];
    
    const spans = ['col-span-2 row-span-2', 'col-span-1 row-span-1', 'col-span-2 row-span-1', 'col-span-1 row-span-2'];
    let items = categoriasMain.map((cat, i) => ({ type: 'cat', cat, span: spans[i % spans.length], sortKey: Math.random() }));
    for (let i = 0; i < 2; i++) { items.push({ type: 'empty', id: `empty-${i}`, span: 'col-span-1 row-span-1', sortKey: Math.random() }); }

    return items.sort((a, b) => a.sortKey - b.sortKey);
  }, [categoriasMain]);

  const productosSuscripcion = productos.filter(p => p.categoria && p.categoria.toLowerCase().includes('suscripci'));
  const planDescorche = productosSuscripcion.find(p => p.nombre && p.nombre.toLowerCase().includes('descorche'));
  const planTerruno = productosSuscripcion.find(p => p.nombre && (p.nombre.toLowerCase().includes('terruño') || p.nombre.toLowerCase().includes('terruno')));

  // 👉 LA MAGIA: Elegir una receta al azar cuando carga
  const deliAleatorio = useMemo(() => {
    if (!storefront) return {};
    
    // Si existe el array nuevo 'listaDeli' con elementos
    if (storefront.listaDeli && storefront.listaDeli.length > 0) {
      const indiceAzar = Math.floor(Math.random() * storefront.listaDeli.length);
      return storefront.listaDeli[indiceAzar];
    } 
    // Si todavía usan el formato viejo 'seccionDeli'
    else if (storefront.seccionDeli) {
      return storefront.seccionDeli;
    }
    
    return {};
  }, [storefront]);


  if (loading) return <div className="min-h-screen flex items-center justify-center font-poppins text-[10px] font-black uppercase tracking-widest text-brand-orange animate-pulse">Cargando...</div>;

  const slides = storefront?.heroSlides || [];
  const productosDestacados = productos.filter(p => !p.categoria || !p.categoria.toLowerCase().includes('suscripci')).slice(0, 10);
  const club = storefront?.seccionClub || {};
  const imagenesCat = storefront?.imagenesCategorias || {};
  const valueProps = storefront?.valueProps || [
    { titulo: 'Envíos a todo el país', subtitulo: 'Con embalaje de seguridad' }, { titulo: 'Cuidado en Bodega', subtitulo: 'Temperatura controlada' },
    { titulo: 'Asesoría Personalizada', subtitulo: 'Sommelier a disposición' }, { titulo: 'Pago Seguro', subtitulo: 'Transacciones encriptadas' }
  ];

  const planesHome = [
    { titulo: 'Selección Descorche', planData: planDescorche, logosBodegas: club.bodegasSeleccion1Urls || [] },
    { titulo: 'Selección Terruño', planData: planTerruno, logosBodegas: club.bodegasSeleccion2Urls || [] }
  ];

  return (
    <div className="min-h-screen bg-neutral-white overflow-x-hidden font-poppins">
      <SEO 
        title="Inicio" 
        description="Decant - Club de vinos y tienda exclusiva. Descubre etiquetas de partidas limitadas seleccionadas por sommeliers."/>  
      <MainNavbar />

      {/* HERO SECTION */}
      <header className="relative w-full h-[80vh] bg-extra-black overflow-hidden border-b border-light-blue/10">
        {slides.map((slide, index) => (
          <div key={slide.id} className={`absolute inset-0 w-full h-full flex items-center justify-center transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
            {slide.imageUrl && <img src={slide.imageUrl} className="absolute inset-0 w-full h-full object-cover" alt="" />}
            <div className="absolute inset-0 bg-extra-black/40 mix-blend-multiply z-10" />
            <div className="relative z-20 flex flex-col items-center text-center px-6 max-w-5xl">
              {slide.titulo && <h1 className="text-brand-white text-5xl md:text-8xl font-poppins font-black italic uppercase leading-none mb-4 animate-fadeInUp tracking-tighter">{slide.titulo}</h1>}
              <div className="flex flex-col md:flex-row gap-4 animate-fadeInUp delay-200">
                {slide.botonPrincipalTexto && <Link to={slide.botonPrincipalLink} className="bg-brand-orange text-brand-white font-poppins text-[10px] font-black uppercase tracking-[0.2em] px-10 py-4 hover:bg-dark-orange transition-all">{slide.botonPrincipalTexto}</Link>}
              </div>
            </div>
          </div>
        ))}
      </header>

      {/* ICONOS DE CONFIANZA */}
      <section className="w-full bg-white border-b border-dark-blue/5 py-8 md:py-10">
        <div className="max-w-[95rem] mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-4 divide-y md:divide-y-0 md:divide-x divide-dark-blue/5">
          {valueProps.map((prop, index) => (
            <div key={index} className={`flex flex-col items-center text-center px-4 ${index > 1 ? 'pt-8 md:pt-0' : ''}`}>
              {TrustIcons[index]}
              <span className="font-poppins text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-dark-blue mb-1">{prop.titulo}</span>
              <span className="font-poppins text-[8px] md:text-[9px] text-light-blue uppercase tracking-widest">{prop.subtitulo}</span>
            </div>
          ))}
        </div>
      </section>

      {/* === BENTO BOX CATEGORÍAS === */}
      {bentoItems.length > 0 && (
        <section className="w-full bg-extra-black p-2 md:p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[200px] md:auto-rows-[250px] gap-2 md:gap-4 grid-flow-dense">
            {bentoItems.map((item) => {
              if (item.type === 'empty') return <div key={item.id} className={`${item.span} bg-transparent border border-white/5`}></div>;
              
              return (
                <Link key={item.cat} to={`/shop/${item.cat}`} className={`group relative overflow-hidden block ${item.span} bg-dark-blue`}>
                  {imagenesCat[item.cat] && (
                    <img src={imagenesCat[item.cat]} alt={item.cat} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-all duration-700 group-hover:scale-105" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-extra-black/80 to-transparent" />
                  <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8 z-10 flex items-center gap-4">
                    <h3 className="font-playfair italic text-2xl md:text-4xl text-brand-white capitalize">{item.cat}</h3>
                    <svg className="w-6 h-6 text-brand-orange opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* SECCIÓN NOVEDADES */}
      <section className="max-w-[95rem] mx-auto px-6 md:px-12 py-24 bg-neutral-white">
        <div className="flex flex-col items-center mb-20 text-center">
          <span className="text-brand-orange font-poppins text-[16px] font-bold uppercase tracking-[0.4em] mb-4">Descubrí</span>
          <h2 className="text-dark-blue font-playfair font-black uppercase text-2xl md:text-3xl tracking-tight italic">Novedades de nuestra Cava</h2>
          <div className="w-16 h-px bg-brand-orange/40 mt-8" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-12 md:gap-x-10 md:gap-y-20">
          {productosDestacados.map(prod => <ProductCard key={prod.id} producto={prod} />)}
        </div>
      </section>

      {/* SECCIÓN CLUB DE VINOS */}
      <section className="w-full bg-[#f8f8f8] py-24 border-y border-dark-blue/5">
        <div className="max-w-[95rem] mx-auto px-6 md:px-12">
          <div className="flex flex-col items-center mb-16 text-center">
            <span className="text-brand-orange font-poppins text-[16px] font-bold uppercase tracking-[0.4em] mb-4">Membresía</span>
            <h2 className="text-dark-blue font-playfair font-black uppercase text-2xl md:text-3xl tracking-tight italic">Selecciones del Mes</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {planesHome.map((plan, index) => (
              <div key={index} className="group relative bg-white p-8 md:p-12 shadow-sm hover:shadow-xl transition-all duration-700 flex flex-col justify-between h-full">
                <div className="flex flex-col lg:flex-row gap-8 items-start h-full">
                  <div className="w-full lg:w-1/2 aspect-[3/4] overflow-hidden bg-gray-50 flex items-center justify-center p-4">
                    {plan.planData?.imageUrl ? (
                      <img src={plan.planData.imageUrl} className="w-full h-full object-contain transition-transform duration-1000 group-hover:scale-105 mix-blend-multiply" alt={plan.titulo} />
                    ) : ( <span className="text-xs text-light-blue/50 uppercase tracking-widest font-bold">Sin Imagen</span> )}
                  </div>
                  
                  <div className="w-full lg:w-1/2 flex flex-col h-full">
                    <h4 className="font-playfair italic text-3xl text-dark-blue mb-2">{plan.titulo}</h4>
                    {plan.planData?.precioFinal ? (
                      <span className="font-poppins text-brand-orange text-lg font-black tracking-widest mb-6 block">
                        ${Number(plan.planData.precioFinal).toLocaleString('es-AR')} <span className="text-[9px] text-light-blue font-medium">/MES</span>
                      </span>
                    ) : (
                      <span className="font-poppins text-light-blue/50 text-sm font-black tracking-widest mb-6 block">Próximamente</span>
                    )}

                    <p className="text-xs text-light-blue leading-relaxed mb-6 whitespace-pre-wrap flex-grow">
                      {plan.planData?.descripcion || "Ideal para descubrir nuevas cepas y bodegas boutique asegurando siempre una mesa bien servida."}
                    </p>
                    
                    {plan.logosBodegas && plan.logosBodegas.length > 0 && (
                      <div className="flex flex-wrap gap-4 items-center mt-auto pt-6 border-t border-light-blue/10 grayscale opacity-60">
                        {plan.logosBodegas.map((logo, i) => (
                          <img key={i} src={logo} className="h-8 w-auto object-contain" alt="Bodega" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-center mt-16">
            <Link to="/suscripciones" className="bg-brand-orange text-brand-white font-poppins text-[11px] font-black uppercase tracking-[0.2em] px-12 py-5 hover:bg-dark-orange transition-all shadow-xl outline-none">
              Sé parte del Club
            </Link>
          </div>
        </div>
      </section>

      {/* SECCIÓN DELI CON RECETA ALEATORIA */}
      {deliAleatorio.tituloReceta && (
        <section className={`w-full py-24 transition-colors duration-1000 ${deliAleatorio.tema === 'cafe' ? 'bg-[#FAF7F2]' : 'bg-[#F2F4F0]'}`}>
          <div className="max-w-[90rem] mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
            <div className="w-full md:w-1/2">
               <img src={deliAleatorio.imgProductoUrl} className="w-full max-h-[600px] object-contain drop-shadow-2xl relative z-10" alt="Deli Destacado" />
            </div>
            <div className="w-full md:w-1/2 relative z-10">
               <div className="absolute top-0 right-0 text-[15rem] opacity-5 select-none pointer-events-none -z-10 leading-none -mt-10 -mr-10">
                  {deliAleatorio.tema === 'cafe' ? '☕' : '🌿'}
               </div>
               
               <span className="text-brand-orange font-poppins text-[14px] font-bold uppercase tracking-[0.4em] mb-4 block">Deli & Tips</span>
               <h2 className="text-dark-blue font-playfair font-black uppercase text-3xl md:text-5xl italic mb-8 leading-tight">{deliAleatorio.tituloReceta}</h2>
               <div className="font-poppins text-sm text-dark-blue/70 leading-relaxed mb-10 whitespace-pre-wrap">{deliAleatorio.textoReceta}</div>
               
               <div className="flex flex-col sm:flex-row gap-4">
                 <Link to={deliAleatorio.linkProducto || "/shop/deli"} className="bg-extra-black text-brand-white px-10 py-4 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand-orange transition-all text-center outline-none">
                    Comprar Ingredientes
                 </Link>
                 {deliAleatorio.botonSecundarioTexto && (
                   <Link to={deliAleatorio.botonSecundarioLink || "/shop"} className="border border-extra-black text-extra-black px-10 py-4 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-extra-black hover:text-brand-white transition-all text-center outline-none">
                      {deliAleatorio.botonSecundarioTexto}
                   </Link>
                 )}
               </div>
            </div>
          </div>
        </section>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeInUp { animation: fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .delay-100 { animation-delay: 0.15s; }
        .delay-200 { animation-delay: 0.3s; }
      `}} />

      <Footer />
    </div>
  );
}