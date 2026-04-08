import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCatalog } from '../context/CatalogContext';
import SEO from '../components/public/SEO';
import MainNavbar from '../components/layout/MainNavbar';
import ProductCard from '../components/public/ProductCard';
import ProductFilter from '../components/public/ProductFilter';
import Footer from '../components/layout/Footer';

export default function Shop() {
  const { categoria, subcategoria, cepa } = useParams();
  const { productos, cargando } = useCatalog();
  
  const [orden, setOrden] = useState('recientes');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  
  const [filtros, setFiltros] = useState({
    categoria: [],
    subcategoria: [],
    varietal: [],
    disponibilidad: []
  });

  const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';
  const catFormat = capitalize(categoria);
  const subFormat = capitalize(subcategoria);
  const cepaFormat = capitalize(cepa);

  // 1. FILTRADO POR URL (Categoría > Subcategoría > Cepa) Y EXCLUSIÓN DE SUSCRIPCIONES
  const productosContextoURL = useMemo(() => {
    let base = [...(productos || [])];
    
    // 👉 REGLA DE ORO: Ocultar suscripciones del catálogo público
    base = base.filter(p => !p.categoria || !p.categoria.toLowerCase().includes('suscripci'));

    if (categoria) base = base.filter(p => p.categoria?.toLowerCase().trim() === categoria.toLowerCase().trim());
    if (subcategoria) base = base.filter(p => p.subcategoria?.toLowerCase().trim() === subcategoria.toLowerCase().trim());
    if (cepa) base = base.filter(p => p.varietal?.toLowerCase().trim() === cepa.toLowerCase().trim());
    return base;
  }, [productos, categoria, subcategoria, cepa]);

  // 2. FILTRADO DEL SIDEBAR Y ORDENAMIENTO
  const productosMostrados = useMemo(() => {
    let filtrados = [...(productosContextoURL || [])];

    if (filtros.categoria.length > 0) {
      filtrados = filtrados.filter(p => filtros.categoria.includes(p.categoria));
    }
    if (filtros.subcategoria.length > 0) {
      filtrados = filtrados.filter(p => filtros.subcategoria.includes(p.subcategoria));
    }
    if (filtros.varietal.length > 0) {
      filtrados = filtrados.filter(p => filtros.varietal.includes(p.varietal));
    }
    if (filtros.disponibilidad.length > 0) {
      filtrados = filtrados.filter(p => {
        if (filtros.disponibilidad.includes('A Pedido') && p.aPedido) return true;
        if (filtros.disponibilidad.includes('En Stock') && !p.aPedido && p.stock > 0) return true;
        return false;
      });
    }

    if (orden === 'menor_precio') {
      filtrados.sort((a, b) => (a.precioFinal || 0) - (b.precioFinal || 0));
    } else if (orden === 'mayor_precio') {
      filtrados.sort((a, b) => (b.precioFinal || 0) - (a.precioFinal || 0));
    }

    return filtrados;
  }, [productosContextoURL, filtros, orden]);

  // 3. GENERADOR DE 4 RECOMENDADOS ALEATORIOS GLOBALES
  const recomendadosAleatorios = useMemo(() => {
    if (!productos || productos.length === 0) return [];
    
    // 👉 También ocultamos suscripciones de los recomendados
    const sinSuscripciones = productos.filter(p => !p.categoria || !p.categoria.toLowerCase().includes('suscripci'));
    
    return sinSuscripciones.sort(() => 0.5 - Math.random()).slice(0, 4);
  }, [productos]);

  // 4. TÍTULO DINÁMICO
  const getTituloPagina = () => {
    if (cepaFormat) return cepaFormat;
    if (subFormat) return subFormat;
    if (catFormat) return catFormat;
    return 'Catálogo Completo';
  };

  // PANTALLA DE CARGA
  if (cargando) {
    return (
      <div className="min-h-screen bg-neutral-white flex flex-col">
        <SEO 
          title={categoria ? `Comprar ${categoria}` : "Catálogo Completo"} 
          description="Explora nuestra cava. Vinos de autor, partidas limitadas y selecciones exclusivas listas para llegar a tu copa."
        />
        <MainNavbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="font-poppins text-brand-orange uppercase tracking-[0.3em] text-[10px] animate-pulse font-black">
            Descorchando la cava...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-white overflow-x-hidden">
      <MainNavbar />

      <div className="w-full border-b border-dark-blue/10 pt-28 lg:pt-36 flex-shrink-0 relative z-20">
        <div className="max-w-[95rem] mx-auto px-6 lg:px-20 pb-4 flex items-center gap-1.5 text-[10px] font-poppins font-black uppercase tracking-[0.2em] text-dark-blue/40 flex-wrap">
          <Link to="/" className="hover:text-brand-orange transition-colors">Home</Link>
          <span className="mx-1">/</span>
          <Link to="/shop" className="hover:text-brand-orange transition-colors">Shop</Link>
          {catFormat && (
            <>
              <span className="mx-1">/</span>
              <Link to={`/shop/${categoria}`} className="hover:text-brand-orange transition-colors">{catFormat}</Link>
            </>
          )}
          {subFormat && (
            <>
              <span className="mx-1">/</span>
              {cepaFormat ? (
                 <Link to={`/shop/${categoria}/${subcategoria}`} className="hover:text-brand-orange transition-colors">{subFormat}</Link>
              ) : (
                 <span className="text-light-blue">{subFormat}</span>
              )}
            </>
          )}
          {cepaFormat && (
            <>
              <span className="mx-1">/</span>
              <span className="text-light-blue">{cepaFormat}</span>
            </>
          )}
        </div>
      </div>

      <main className="max-w-[95rem] mx-auto px-6 lg:px-20 pt-10 pb-24 relative z-10">
        
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-dark-blue/5 pb-8">
          <div>
            <h1 className="font-playfair italic text-5xl md:text-6xl text-dark-blue capitalize leading-tight mb-2">
              {getTituloPagina()}
            </h1>
            <p className="font-poppins text-[10px] uppercase tracking-[0.3em] font-black text-light-blue">
              Mostrando {productosMostrados.length} productos
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="font-poppins text-[9px] uppercase tracking-[0.2em] text-dark-blue/50 font-black hidden md:block whitespace-nowrap">
              Ordenar por:
            </span>
            <div className="relative w-full md:w-auto">
              <select 
                value={orden}
                onChange={(e) => setOrden(e.target.value)}
                className="w-full md:w-auto bg-white border border-dark-blue/10 text-dark-blue font-poppins text-[9px] font-black uppercase tracking-[0.2em] px-4 py-3 rounded-none outline-none focus:border-brand-orange transition-colors cursor-pointer appearance-none shadow-sm pr-10"
              >
                <option value="recientes">Últimos Ingresos</option>
                <option value="menor_precio">Menor Precio</option>
                <option value="mayor_precio">Mayor Precio</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-brand-orange">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
            
            <button 
              onClick={() => setMobileFilterOpen(true)}
              className="md:hidden bg-brand-orange text-white px-4 py-3 font-poppins text-[9px] font-black uppercase tracking-[0.2em] shadow-sm whitespace-nowrap"
            >
              Filtros
            </button>
          </div>
        </header>

        <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start">
          
          <ProductFilter 
            productos={productosContextoURL}
            filtros={filtros}
            setFiltros={setFiltros}
            isMobileOpen={mobileFilterOpen}
            onCloseMobile={() => setMobileFilterOpen(false)}
          />

          <div className="flex-1 w-full">
            {productosMostrados.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-3 gap-y-10 md:gap-x-6 md:gap-y-14">
                {productosMostrados.map(prod => (
                  <ProductCard key={prod.id} producto={prod} />
                ))}
              </div>
            ) : (
              <div className="py-12 md:py-24 text-center flex flex-col items-center w-full">
                <span className="text-4xl opacity-50 grayscale mb-4">🍷</span>
                <h3 className="font-playfair italic text-3xl md:text-4xl text-dark-blue mb-3">
                  Preparando Selección
                </h3>
                <p className="font-poppins text-[10px] uppercase tracking-[0.2em] font-black text-light-blue mb-12 max-w-lg">
                  Aún no hemos descorchado botellas en esta categoría. Mientras tanto, descubre estas joyas de nuestra cava:
                </p>

                {/* GRILLA DE 4 RECOMENDADOS */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-10 md:gap-x-6 w-full text-left mb-16">
                  {recomendadosAleatorios.map(prod => (
                    <ProductCard key={`rec-${prod.id}`} producto={prod} />
                  ))}
                </div>

                <button 
                  onClick={() => setFiltros({ categoria: [], subcategoria: [], varietal: [], disponibilidad: [] })}
                  className="bg-brand-orange text-brand-white font-poppins text-[10px] font-black uppercase tracking-[0.2em] px-8 py-4 hover:bg-dark-orange transition-all shadow-md outline-none inline-block"
                >
                  Limpiar Filtros
                </button>
              </div>
            )}
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}