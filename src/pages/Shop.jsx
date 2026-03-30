import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCatalog } from '../context/CatalogContext';
import MainNavbar from '../components/layout/MainNavbar';
import ProductCard from '../components/public/ProductCard';

export default function Shop() {
  // Capturamos los parámetros de la URL (si existen)
  const { categoria, subcategoria, varietal } = useParams();
  const { productos, cargando } = useCatalog();
  const [orden, setOrden] = useState('recientes'); // recientes, menor_precio, mayor_precio

  // Filtramos y ordenamos mágicamente según la URL
  const productosMostrados = useMemo(() => {
    let filtrados = [...productos];

    // 1. Filtrar por URL
    if (categoria) {
      filtrados = filtrados.filter(p => p.categoria?.toLowerCase() === categoria.toLowerCase());
    }
    if (subcategoria) {
      filtrados = filtrados.filter(p => p.subcategoria?.toLowerCase() === subcategoria.toLowerCase());
    }
    if (varietal) {
      filtrados = filtrados.filter(p => p.varietal?.toLowerCase() === varietal.toLowerCase());
    }

    // 2. Ordenar
    if (orden === 'menor_precio') {
      filtrados.sort((a, b) => (a.precioFinal || 0) - (b.precioFinal || 0));
    } else if (orden === 'mayor_precio') {
      filtrados.sort((a, b) => (b.precioFinal || 0) - (a.precioFinal || 0));
    } else {
      // Por defecto: los más recientes (asumimos que ya vienen ordenados por createdAt del Context)
      // Opcional: podrías ordenar alfabéticamente aquí.
    }

    return filtrados;
  }, [productos, categoria, subcategoria, varietal, orden]);

  // Título dinámico para la cabecera
  const tituloPagina = varietal ? varietal : (subcategoria ? subcategoria : (categoria ? categoria : 'Catálogo Completo'));

  if (cargando) {
    return (
      <div className="min-h-screen bg-extra-black text-brand-white flex items-center justify-center">
        <MainNavbar />
        <p className="text-light-blue uppercase tracking-[0.3em] text-sm animate-pulse">Descorchando la cava...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-extra-black text-brand-white">
      <MainNavbar />

      <main className="max-w-[90rem] mx-auto px-4 md:px-8 pt-32 pb-24">
        
        {/* ==============================================
            CABECERA EDITORIAL Y FILTROS
            ============================================== */}
        <header className="mb-16 border-b border-light-blue/10 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-8">
          
          <div>
            {/* Migas de pan (Breadcrumbs) */}
            <nav className="text-[9px] font-black uppercase tracking-widest text-dark-grey mb-4 flex items-center gap-2 flex-wrap">
              <Link to="/" className="hover:text-brand-orange transition-colors">Inicio</Link>
              <span className="text-light-blue/30">/</span>
              <Link to="/shop" className="hover:text-brand-orange transition-colors">Shop</Link>
              
              {categoria && (
                <>
                  <span className="text-light-blue/30">/</span>
                  <Link to={`/shop/${categoria}`} className="hover:text-brand-orange transition-colors">{categoria}</Link>
                </>
              )}
              {subcategoria && (
                <>
                  <span className="text-light-blue/30">/</span>
                  <Link to={`/shop/${categoria}/${subcategoria}`} className="hover:text-brand-orange transition-colors">{subcategoria}</Link>
                </>
              )}
              {varietal && (
                <>
                  <span className="text-light-blue/30">/</span>
                  <span className="text-brand-white">{varietal}</span>
                </>
              )}
            </nav>

            <h1 className="text-4xl md:text-5xl font-light capitalize tracking-wide">
              {tituloPagina}
            </h1>
            <p className="text-light-blue text-xs mt-3 uppercase tracking-widest font-bold">
              {productosMostrados.length} {productosMostrados.length === 1 ? 'Etiqueta' : 'Etiquetas'}
            </p>
          </div>

          {/* Ordenamiento */}
          <div className="flex items-center gap-4">
            <span className="text-[10px] uppercase tracking-widest text-dark-grey font-bold hidden md:inline-block">
              Ordenar por:
            </span>
            <select 
              value={orden}
              onChange={(e) => setOrden(e.target.value)}
              className="bg-transparent border border-light-blue/20 text-brand-white text-[10px] uppercase tracking-widest font-bold p-3 rounded-none outline-none focus:border-brand-orange transition-colors cursor-pointer appearance-none"
            >
              <option value="recientes" className="bg-extra-black text-brand-white">Últimos Ingresos</option>
              <option value="menor_precio" className="bg-extra-black text-brand-white">Menor Precio</option>
              <option value="mayor_precio" className="bg-extra-black text-brand-white">Mayor Precio</option>
            </select>
          </div>

        </header>

        {/* ==============================================
            GRILLA DE PRODUCTOS (Reutilizamos estructura de la Home)
            ============================================== */}
        {productosMostrados.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-10 md:gap-x-8 md:gap-y-16">
            {productosMostrados.map(prod => (
              <ProductCard key={prod.id} producto={prod} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center flex flex-col items-center">
            <span className="text-4xl text-dark-grey mb-4">🍷</span>
            <h3 className="text-brand-white text-2xl font-light mb-2">No hay botellas aquí</h3>
            <p className="text-light-blue text-sm uppercase tracking-widest mb-8">
              Aún no hemos agregado productos en esta categoría.
            </p>
            <Link to="/shop" className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-orange border border-brand-orange px-8 py-3 hover:bg-brand-orange hover:text-brand-white transition-colors">
              Explorar Colección Completa
            </Link>
          </div>
        )}

      </main>
    </div>
  );
}