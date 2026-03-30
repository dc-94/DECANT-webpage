import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCatalog } from '../../context/CatalogContext';
import SearchOverlay from './SearchOverlay'; // 👈 IMPORTANTE

export default function MainNavbar() {
  const { menuTree, cargando } = useCatalog();
  const location = useLocation();
  
  const [scrolled, setScrolled] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMobileCats, setExpandedMobileCats] = useState({}); 
  const [expandedDesktopSubCats, setExpandedDesktopSubCats] = useState({}); 
 const [searchOpen, setSearchOpen] = useState(false); // 👈 ESTADO DEL BUSCADOR
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setDesktopMenuOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleMobileAccordion = (level) => {
    setExpandedMobileCats(prev => ({ ...prev, [level]: !prev[level] }));
  };

  const toggleDesktopSubCat = (id) => {
    setExpandedDesktopSubCats(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      {/* =========================================
        CORTINA FONDO (DESKTOP) - DARK GLASSMORPHISM
        =========================================
      */}
      {desktopMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-dark-black/50 backdrop-blur-lg transition-all duration-800 hidden md:block"
          onClick={() => setDesktopMenuOpen(false)}
        />
      )}

      {/* =========================================
         NAVBAR PRINCIPAL (Fondo Sólido + Shrink Effect)
        =========================================
      */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 bg-extra-black ${scrolled || desktopMenuOpen ? 'border-b border-light-blue/20' : ''}`}>
        
        {/* El contenedor cambia su altura al hacer scroll (h-28 a h-20) */}
        <div className={`max-w-7xl mx-auto px-6 flex items-center justify-between transition-all duration-500 ${scrolled ? 'h-24' : 'h-28'}`}>
          
          {/* IZQUIERDA: MENÚ HAMBURGUESA / LOGO */}
          <div className="flex-1 md:flex-none flex items-center">
            <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 -ml-2 text-brand-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <Link to="/" className="hidden md:block">
               {/* El logo se achica en Desktop (h-12 a h-8) */}
               <img 
                 src="/assets/brand/logo-white-T.png" 
                 alt="Decant" 
                 className={`object-contain transition-all duration-500 ${scrolled ? 'h-10' : 'h-12'}`} 
               />
            </Link>
          </div>

          {/* CENTRO: LOGO MÓVIL */}
          <div className="flex-1 flex justify-center md:hidden">
            <Link to="/">
              {/* El logo se achica en Móvil (h-10 a h-7) */}
              <img 
                src="/assets/brand/logo-white-T.png" 
                alt="Decant" 
                className={`object-contain transition-all duration-500 ${scrolled ? 'h-8' : 'h-10'}`} 
              />
            </Link>
          </div>

          {/* CENTRO: LINKS DESKTOP */}
          <div className="hidden md:flex flex-1 justify-center gap-12">
            <button 
              onClick={() => setDesktopMenuOpen(!desktopMenuOpen)}
              className={`text-[11px] font-medium uppercase tracking-[0.2em] transition-colors flex items-center gap-1.5 ${desktopMenuOpen ? 'text-brand-orange' : 'text-brand-white hover:text-brand-orange'}`}
            >
              Shop
              <svg className={`w-3 h-3 transition-transform duration-300 ${desktopMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </button>
            <Link to="/suscripciones" className="text-[11px] font-medium uppercase tracking-[0.2em] text-brand-white hover:text-brand-orange transition-colors">Suscripciones</Link>
            <Link to="/manifiesto" className="text-[11px] font-medium uppercase tracking-[0.2em] text-brand-white hover:text-brand-orange transition-colors">Manifiesto</Link>
          </div>

          {/* DERECHA: ÍCONOS */}
          <div className="flex-1 flex justify-end gap-5 md:gap-6 items-center text-brand-white">
            <button 
              onClick={() => setSearchOpen(true)} // 👈 ABRIR BUSCADOR
              className="hidden md:block hover:text-brand-orange transition-colors"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>
            <button className="hover:text-brand-orange transition-colors relative">
              <span className="absolute -top-1.5 -right-2 bg-brand-orange text-brand-white text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">0</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            </button>
          </div>

        </div>

        {/* =========================================
          MEGA MENÚ DESKTOP (Transparente sobre fondo oscuro)
          =========================================
        */}
        <div className={`absolute top-full left-0 w-full bg-brand-white/0 backdrop-blur-md transition-all duration-850 overflow-hidden hidden md:block ${desktopMenuOpen ? 'max-h-[80vh] border-t border-light-blue/20 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="max-w-7xl mx-auto px-6 py-12">
            
            <div className="mb-10 pb-4 border-b border-light-blue/20 flex justify-between items-center">
               <span className="text-xs font-bold text-light-blue uppercase tracking-[0.3em]">Explorar Colección</span>
               <Link to="/shop" className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-orange hover:text-dark-orange transition-colors">
                 Ver todo el Catálogo →
               </Link>
            </div>

            {cargando ? (
              <div className="py-10 text-center text-light-blue text-xs tracking-widest uppercase animate-pulse">Descorchando catálogo...</div>
            ) : (
              <div className="grid grid-cols-4 gap-12">
                {Object.entries(menuTree).map(([catMadre, subcategorias]) => (
                  <div key={catMadre} className="flex flex-col">
                    <h3 className="text-brand-white font-black uppercase tracking-[0.2em] mb-4 text-sm">{catMadre}</h3>
                    <Link to={`/shop/${catMadre.toLowerCase()}`} className="text-[10px] font-bold uppercase tracking-widest text-light-blue hover:text-brand-orange transition-colors mb-6 pb-1 border-b border-light-blue/20 w-fit">
                      Ver todos los {catMadre}
                    </Link>

                    {/* Acordeones de Subcategorías */}
                    <div className="space-y-4">
                      {Object.entries(subcategorias).map(([sub, varietales]) => {
                        const isExpanded = expandedDesktopSubCats[`${catMadre}-${sub}`];
                        return (
                          <div key={sub} className="border-b border-light-blue/10 pb-2">
                            <button 
                              onClick={() => toggleDesktopSubCat(`${catMadre}-${sub}`)}
                              className="w-full flex items-center justify-between text-brand-white font-bold uppercase tracking-wider text-[11px] hover:text-brand-orange transition-colors"
                            >
                              {sub}
                              <span className="text-brand-orange font-normal text-sm">{isExpanded ? '-' : '+'}</span>
                            </button>

                            <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[500px] opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
                              <Link to={`/shop/${catMadre.toLowerCase()}/${sub.toLowerCase()}`} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-orange hover:text-dark-orange transition-colors mb-4 pl-2">
                                ↳ Ver todo en {sub}
                              </Link>
                              
                              <ul className="space-y-2 pl-3 border-l border-brand-orange/20">
                                {varietales.map(v => (
                                  <li key={v}>
                                    <Link to={`/shop/${catMadre.toLowerCase()}/${sub.toLowerCase()}/${v.toLowerCase()}`} className="text-[11px] font-medium text-light-blue hover:text-brand-white transition-colors block">
                                      {v}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* =========================================
        MENÚ FULLSCREEN MOBILE (DARK MODE)
        =========================================
      */}
      <div className={`fixed inset-0 z-[60] bg-extra-black flex flex-col transition-transform duration-500 md:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        <div className="h-20 px-6 flex items-center justify-between border-b border-light-blue/20 flex-shrink-0">
          <button onClick={() => setMobileMenuOpen(false)} className="text-brand-white p-2 -ml-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <img src="/assets/brand/logo-white-T.png" alt="Decant" className="h-6 object-contain" />
          <div className="w-6"></div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-10">
          <nav className="flex flex-col gap-6">
            <div>
              <button onClick={() => toggleMobileAccordion('shop')} className="w-full flex items-center justify-between text-2xl font-black uppercase tracking-[0.1em] text-brand-white">
                Shop <span className="text-brand-orange font-normal">{expandedMobileCats['shop'] ? '-' : '+'}</span>
              </button>
              
              <div className={`overflow-hidden transition-all duration-300 ${expandedMobileCats['shop'] ? 'max-h-[1500px] opacity-100 mt-6' : 'max-h-0 opacity-0'}`}>
                <Link to="/shop" className="block text-xs font-black uppercase tracking-[0.2em] text-brand-orange mb-8 pb-2 border-b border-light-blue/20">Ver todo el catálogo</Link>

                {Object.entries(menuTree).map(([catMadre, subcategorias]) => (
                  <div key={catMadre} className="mb-8 pl-4 border-l border-light-blue/20">
                    <button onClick={() => toggleMobileAccordion(catMadre)} className="w-full flex items-center justify-between text-lg font-bold uppercase tracking-widest text-brand-white mb-4">
                      {catMadre} <span className="text-brand-orange text-sm font-normal">{expandedMobileCats[catMadre] ? '-' : '+'}</span>
                    </button>

                    <div className={`overflow-hidden transition-all duration-300 space-y-6 ${expandedMobileCats[catMadre] ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
                      <Link to={`/shop/${catMadre.toLowerCase()}`} className="block text-[10px] font-bold uppercase tracking-widest text-light-blue mb-2">Ver todos los {catMadre}</Link>
                      
                      {Object.entries(subcategorias).map(([sub, varietales]) => (
                        <div key={sub} className="pl-4">
                          <h4 className="text-sm font-bold uppercase tracking-wider text-brand-white mb-2">{sub}</h4>
                          <Link to={`/shop/${catMadre.toLowerCase()}/${sub.toLowerCase()}`} className="block text-[10px] font-black uppercase tracking-widest text-brand-orange mb-3">↳ Ver todo en {sub}</Link>
                          <ul className="space-y-3">
                            {varietales.map(v => (
                              <li key={v}>
                                <Link to={`/shop/${catMadre.toLowerCase()}/${sub.toLowerCase()}/${v.toLowerCase()}`} className="text-sm text-light-blue hover:text-brand-white">{v}</Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Link to="/suscripciones" className="text-2xl font-black uppercase tracking-[0.1em] text-brand-white">Suscripciones</Link>
            <Link to="/manifiesto" className="text-2xl font-black uppercase tracking-[0.1em] text-brand-white">Manifiesto</Link>
          </nav>
        </div>

        {/* Footer Buscador Móvil Dark */}
        {/* Footer Buscador Móvil Dark (Ahora funciona como botón) */}
        <div className="p-6 border-t border-light-blue/20 bg-extra-black flex-shrink-0">
          <div 
            className="relative cursor-pointer group"
            onClick={() => {
              setMobileMenuOpen(false); // Cierra el menú hamburguesa
              setSearchOpen(true);      // Abre la pantalla del buscador
            }}
          >
            {/* Simulamos el input visualmente, pero al tocarlo dispara el overlay */}
            <div className="w-full bg-extra-black text-light-blue/50 text-sm p-4 pl-12 rounded-xl border border-light-blue/20 group-hover:border-brand-orange transition-colors flex items-center">
              Buscar etiquetas, varietales...
            </div>
            <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-light-blue group-hover:text-brand-orange transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>
      </div>
      {/* =========================================
        OVERLAY DE BÚSQUEDA
        ========================================= */}
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}