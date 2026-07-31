import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCatalog } from '../../context/CatalogContext';
import SearchOverlay from './SearchOverlay';
import { useCart } from '../../context/CartContext';
import CartDrawer from '../cart/CartDrawer';

// 👉 Nuevas importaciones para el sistema de Socios VIP
import { useSocio } from '../../context/SocioContext';
import ModalSocio from '../public/ModalSocio';

export default function MainNavbar() {
  const { menuTree, cargando, productos } = useCatalog();
  const { totalItems, isCartOpen, setIsCartOpen, justAdded } = useCart();
  
  // 👉 Traemos la lógica de socios
  const { socio, logoutSocio } = useSocio();
  const [modalSocioOpen, setModalSocioOpen] = useState(false);

  const location = useLocation();
  
  const [scrolled, setScrolled] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const [openCat, setOpenCat] = useState(null); 
  const [openSub, setOpenSub] = useState(null); 

  const desktopScrollRef = useRef(null);
  const mobileScrollRef = useRef(null);
  const [showScrollHint, setShowScrollHint] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setDesktopMenuOpen(false);
    setMobileMenuOpen(false);
    setOpenCat(null);
    setOpenSub(null);
  }, [location.pathname]);

  const toggleCat = (catName) => {
    if (openCat === catName) {
      setOpenCat(null); 
      setOpenSub(null); 
    } else {
      setOpenCat(catName); 
      setOpenSub(null);    
    }
  };

  const toggleSub = (subName) => {
    if (openSub === subName) {
      setOpenSub(null);
    } else {
      setOpenSub(subName);
    }
  };

  const checkScroll = () => {
    const check = (ref) => ref.current && ref.current.scrollHeight > ref.current.clientHeight + 10;
    if (desktopMenuOpen) setShowScrollHint(check(desktopScrollRef));
    if (mobileMenuOpen) setShowScrollHint(check(mobileScrollRef));
  };

  useEffect(() => {
    setTimeout(checkScroll, 350); 
  }, [openCat, openSub, desktopMenuOpen, mobileMenuOpen]);

  const handleScrollArea = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight - 30) {
      setShowScrollHint(false);
    } else {
      setShowScrollHint(true);
    }
  };

  const menuTreeFiltrado = Object.entries(menuTree || {}).filter(
    ([catName]) => catName.toLowerCase() !== 'suscripciones' && catName.toLowerCase() !== 'suscripciónes'
  );

  return (
    <>
      {/* NAVBAR PRINCIPAL SUPERIOR */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 bg-extra-black ${scrolled || desktopMenuOpen ? 'border-b border-light-blue/20' : ''}`}>
        <div className={`max-w-7xl mx-auto px-6 flex items-center justify-between transition-all duration-500 ${scrolled ? 'h-24' : 'h-28'}`}>
          
          <div className="flex-1 md:flex-none flex items-center">
            <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 -ml-2 text-brand-white outline-none">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeWidth="1.5" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <Link to="/" className="hidden md:block">
               <img src="/assets/brand/logo-white-T.png" alt="Decant" className={`object-contain transition-all duration-500 ${scrolled ? 'h-10' : 'h-12'}`} />
            </Link>
          </div>

          <div className="flex-1 flex justify-center md:hidden">
            <Link to="/">
              <img src="/assets/brand/logo-white-T.png" alt="Decant" className={`object-contain transition-all duration-500 ${scrolled ? 'h-8' : 'h-10'}`} />
            </Link>
          </div>

          <div className="hidden md:flex flex-1 justify-center gap-12">
            <button 
              onClick={() => {
                setDesktopMenuOpen(!desktopMenuOpen);
                if(desktopMenuOpen) { setOpenCat(null); setOpenSub(null); }
              }}
              className={`text-[11px] font-medium uppercase tracking-[0.2em] transition-colors flex items-center gap-1.5 outline-none ${desktopMenuOpen ? 'text-brand-orange' : 'text-brand-white hover:text-brand-orange'}`}
            >
              Shop
              <svg className={`w-3 h-3 transition-transform duration-300 ${desktopMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </button>
            <Link to="/suscripciones" className="text-[11px] font-medium uppercase tracking-[0.2em] text-brand-white hover:text-brand-orange transition-colors">Suscripciones</Link>
            <Link to="/manifiesto" className="text-[11px] font-medium uppercase tracking-[0.2em] text-brand-white hover:text-brand-orange transition-colors">Manifiesto</Link>
          </div>

          <div className="flex-1 flex justify-end gap-5 md:gap-6 items-center text-brand-white">
            
            {/* 👉 BOTONES DE SISTEMA VIP (DESKTOP) */}
            {socio ? (
              <div className="hidden md:flex items-center gap-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-orange border border-brand-orange/30 px-3 py-1 rounded">
                  {socio.badge}
                </span>
                <button 
                  onClick={logoutSocio} 
                  className="text-[10px] font-black uppercase tracking-[0.2em] hover:text-brand-orange transition-colors outline-none"
                  title="Cerrar sesión"
                >
                  Salir
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setModalSocioOpen(true)}
                className="hidden md:block text-[10px] font-black uppercase tracking-[0.2em] hover:text-brand-orange transition-colors outline-none"
              >
                Soy Socio
              </button>
            )}

            <button onClick={() => setSearchOpen(true)} className="hidden md:block hover:text-brand-orange transition-colors outline-none">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>
            <button 
              onClick={() => setIsCartOpen(true)} 
              className={`transition-all duration-300 relative outline-none transform hover:text-brand-orange
                ${justAdded ? 'scale-125 text-brand-orange' : 'scale-100'}`}
            >
              {totalItems > 0 && (
                <span className={`absolute -top-1.5 -right-2 bg-brand-orange text-brand-white text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center transition-transform duration-300 ${justAdded ? 'scale-110 animate-bounce' : ''}`}>
                  {totalItems}
                </span>
              )}
                <svg className={`w-5 h-5 transition-transform ${justAdded ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="square" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
            </button>
          </div>
        </div>

        {/* =========================================
            MENU DESKTOP (GLASSMORPHISM CLARO + FILAS HORIZONTALES)
            ========================================= */}
        <div className={`absolute top-full left-0 w-full bg-neutral-white/75 backdrop-blur-md transition-all duration-700 overflow-hidden hidden md:block border-t border-dark-blue/10 ${desktopMenuOpen ? 'max-h-[85vh] opacity-100' : 'max-h-0 opacity-0 border-transparent'}`}>
          
          <div className="relative w-full h-[85vh]">
            <div 
              ref={desktopScrollRef} 
              onScroll={handleScrollArea}
              className="absolute inset-0 overflow-y-auto no-scrollbar py-20 px-6 flex flex-col items-center text-center"
            >
              
              <div className="mb-16 drop-shadow-sm">
                <Link to="/shop" onClick={() => setDesktopMenuOpen(false)} className="text-[11px] font-poppins font-normal uppercase tracking-[0.3em] text-brand-orange hover:text-dark-orange transition-colors pb-2 border-b border-brand-orange/30">
                  Ver todo el Catálogo
                </Link>
              </div>

              {cargando ? (
                <div className="py-10 text-dark-blue/50 text-sm tracking-widest uppercase animate-pulse drop-shadow-sm">Descorchando catálogo...</div>
              ) : (
                <div className="flex flex-col items-center w-full max-w-6xl">
                  {menuTreeFiltrado.map(([catMadre, subcategorias]) => {
                    const isCatOpen = openCat === catMadre;
                    
                    return (
                      <div key={catMadre} className="w-full flex flex-col items-center mb-8">
                        {/* CATEGORÍA PRINCIPAL */}
                        <button 
                          onClick={() => toggleCat(catMadre)} 
                          className={`text-4xl md:text-[55px] font-playfair tracking-tight drop-shadow-md transition-all duration-300 flex items-center justify-center outline-none ${isCatOpen ? 'italic text-brand-orange' : 'text-extra-black hover:text-brand-orange'}`}
                        >
                          {isCatOpen && <span className="mr-6 font-poppins text-3xl font-light">&rarr;</span>}
                          {catMadre}
                        </button>

                        <div className={`flex flex-col items-center w-full overflow-hidden transition-all duration-700 ease-in-out ${isCatOpen ? 'max-h-[2000px] mt-10 opacity-100' : 'max-h-0 opacity-0'}`}>
                          
                          <Link to={`/shop/${catMadre.toLowerCase()}`} onClick={() => setDesktopMenuOpen(false)} className="text-[11px] font-poppins font-normal uppercase tracking-widest text-brand-orange hover:text-dark-orange transition-colors mb-10 pb-1 border-b border-brand-orange/30 drop-shadow-sm">
                            Ver todos los {catMadre}
                          </Link>

                          {/* 👇 CONTENEDOR HORIZONTAL PARA LAS SUBCATEGORÍAS (Desktop) */}
                          <div className="flex flex-row flex-wrap justify-center items-start gap-x-16 gap-y-10 w-full">
                            {Object.entries(subcategorias).map(([sub, varietales]) => {
                              const isSubOpen = openSub === sub;
                              
                              const varietalesActivos = varietales.filter(v => 
                                productos.some(p => 
                                  (p.varietal && p.varietal.toLowerCase() === v.toLowerCase()) || 
                                  (p.cepa && p.cepa.toLowerCase() === v.toLowerCase())
                                )
                              );
                              
                              return (
                                <div key={sub} className="flex flex-col items-center">
                                  <button 
                                    onClick={() => toggleSub(sub)}
                                    className={`text-2xl md:text-[34px] font-poppins font-light drop-shadow-sm transition-all duration-300 flex items-center outline-none ${isSubOpen ? 'italic text-brand-orange' : 'text-extra-black/80 hover:text-extra-black'}`}
                                  >
                                    {isSubOpen && <span className="mr-3 text-xl">&rarr;</span>}
                                    {sub}
                                  </button>

                                  <div className={`flex flex-col items-center w-full overflow-hidden transition-all duration-500 ease-in-out ${isSubOpen ? 'max-h-[1000px] mt-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <Link to={`/shop/${catMadre.toLowerCase()}/${sub.toLowerCase()}`} onClick={() => setDesktopMenuOpen(false)} className="text-[11px] font-poppins font-normal uppercase tracking-widest text-brand-orange hover:text-dark-orange transition-colors mb-6 drop-shadow-sm">
                                      ↳ Ver todo en {sub}
                                    </Link>
                                    
                                    {/* 👇 CONTENEDOR HORIZONTAL PARA LAS CEPAS (Desktop) */}
                                    <div className="flex flex-row flex-wrap justify-center gap-x-8 gap-y-4 mb-6 max-w-2xl">
                                      {varietalesActivos.map(v => (
                                        <Link key={v} to={`/shop/${catMadre.toLowerCase()}/${sub.toLowerCase()}/${v.toLowerCase()}`} onClick={() => setDesktopMenuOpen(false)} className="text-xl md:text-2xl font-poppins font-light text-light-blue hover:text-brand-orange transition-colors drop-shadow-sm">
                                          {v}
                                        </Link>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {showScrollHint && (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-brand-orange animate-bounce pointer-events-none drop-shadow-md bg-neutral-white/50 backdrop-blur-md p-2 rounded-full border border-dark-blue/5">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* =========================================
          MENÚ FULLSCREEN MOBILE (GLASSMORPHISM CLARO + COLUMNA)
          ========================================= */}
      <div className={`fixed inset-0 z-[60] bg-neutral-white/55 backdrop-blur-md flex flex-col transition-transform duration-700 ease-in-out md:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        <div className="h-20 px-6 flex items-center justify-between border-b border-dark-blue/10 flex-shrink-0 z-10">
          <button onClick={() => setMobileMenuOpen(false)} className="text-extra-black p-2 -ml-2 outline-none">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <img src="/assets/brand/logo-white-T.png" alt="Decant" className="h-6 object-contain invert" />
          <div className="w-6"></div>
        </div>

        <div className="flex-1 relative">
          <div 
            ref={mobileScrollRef}
            onScroll={handleScrollArea}
            className="absolute inset-0 overflow-y-auto no-scrollbar py-12 px-6 flex flex-col items-center text-center"
          >
            <div className="mb-14 drop-shadow-sm">
              <Link to="/shop" onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-poppins font-normal uppercase tracking-[0.3em] text-brand-orange pb-2 border-b border-brand-orange/30">
                Ver todo el catálogo
              </Link>
            </div>

            {menuTreeFiltrado.map(([catMadre, subcategorias]) => {
              const isCatOpen = openCat === catMadre;
              
              return (
                <div key={catMadre} className="w-full flex flex-col items-center mb-8">
                  <button 
                    onClick={() => toggleCat(catMadre)} 
                    className={`text-[40px] font-playfair tracking-tight drop-shadow-md transition-all duration-300 flex items-center justify-center outline-none ${isCatOpen ? 'italic text-brand-orange' : 'text-extra-black'}`}
                  >
                    {isCatOpen && <span className="mr-3 font-poppins text-2xl font-light">&rarr;</span>}
                    {catMadre}
                  </button>

                  <div className={`flex flex-col items-center w-full overflow-hidden transition-all duration-500 ease-in-out ${isCatOpen ? 'max-h-[1500px] mt-8 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <Link to={`/shop/${catMadre.toLowerCase()}`} onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-poppins font-normal uppercase tracking-widest text-brand-orange mb-8 drop-shadow-sm">
                      Ver todos los {catMadre}
                    </Link>

                    {Object.entries(subcategorias).map(([sub, varietales]) => {
                      const isSubOpen = openSub === sub;

                      const varietalesActivos = varietales.filter(v => 
                        productos.some(p => 
                          (p.varietal && p.varietal.toLowerCase() === v.toLowerCase()) || 
                          (p.cepa && p.cepa.toLowerCase() === v.toLowerCase())
                        )
                      );
                      
                      return (
                        <div key={sub} className="w-full flex flex-col items-center mb-6">
                          <button 
                            onClick={() => toggleSub(sub)}
                            className={`text-2xl font-poppins font-light drop-shadow-sm transition-all duration-300 flex items-center outline-none ${isSubOpen ? 'italic text-brand-orange' : 'text-extra-black/80'}`}
                          >
                            {isSubOpen && <span className="mr-3 text-lg">&rarr;</span>}
                            {sub}
                          </button>

                          <div className={`flex flex-col items-center w-full overflow-hidden transition-all duration-500 ease-in-out ${isSubOpen ? 'max-h-[800px] mt-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                            <Link to={`/shop/${catMadre.toLowerCase()}/${sub.toLowerCase()}`} onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-poppins font-normal uppercase tracking-widest text-brand-orange mb-6 drop-shadow-sm">
                              ↳ Ver todo en {sub}
                            </Link>
                            
                            <div className="flex flex-col items-center gap-4 mb-4">
                              {varietalesActivos.map(v => (
                                <Link key={v} to={`/shop/${catMadre.toLowerCase()}/${sub.toLowerCase()}/${v.toLowerCase()}`} onClick={() => setMobileMenuOpen(false)} className="text-xl font-poppins font-light text-light-blue hover:text-brand-orange drop-shadow-sm">
                                  {v}
                                </Link>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div className="mt-12 flex flex-col gap-6 pt-10 border-t border-dark-blue/10 w-full max-w-[200px]">
              <Link to="/suscripciones" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-playfair italic text-extra-black hover:text-brand-orange drop-shadow-md">Suscripciones</Link>
              <Link to="/manifiesto" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-playfair italic text-extra-black hover:text-brand-orange drop-shadow-md">Manifiesto</Link>
              
              {/* 👉 BOTONES DE SISTEMA VIP (MOBILE) */}
              {socio ? (
                 <button onClick={() => { logoutSocio(); setMobileMenuOpen(false); }} className="text-2xl font-playfair italic text-brand-orange drop-shadow-md text-left outline-none">Salir ({socio.badge})</button>
              ) : (
                 <button onClick={() => { setModalSocioOpen(true); setMobileMenuOpen(false); }} className="text-2xl font-playfair italic text-extra-black hover:text-brand-orange drop-shadow-md text-left outline-none">Soy Socio</button>
              )}
            </div>
          </div>

          {showScrollHint && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-brand-orange animate-bounce pointer-events-none drop-shadow-md bg-neutral-white/50 backdrop-blur-md p-2 rounded-full border border-dark-blue/5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
            </div>
          )}
        </div>

        {/* Footer Buscador Móvil */}
        <div className="p-6 border-t border-dark-blue/10 flex-shrink-0 z-10">
          <div 
            className="relative cursor-pointer group drop-shadow-sm"
            onClick={() => { setMobileMenuOpen(false); setSearchOpen(true); }}
          >
            <div className="w-full bg-neutral-white/60 text-light-blue/70 text-sm p-4 pl-12 rounded-xl border border-dark-blue/20 flex items-center group-hover:border-brand-orange transition-colors backdrop-blur-sm">
              Buscar etiquetas, varietales...
            </div>
            <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-light-blue group-hover:text-brand-orange transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>
      </div>

      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      {/* 👉 RENDERIZADO DEL MODAL VIP */}
      <ModalSocio isOpen={modalSocioOpen} onClose={() => setModalSocioOpen(false)} />
    </>
  );
}