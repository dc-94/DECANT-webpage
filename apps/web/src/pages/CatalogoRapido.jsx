import { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useCatalog } from '../context/CatalogContext';

export default function CatalogoRapido() {
  const { productos, cargando, fetchAllProductos } = useCatalog();
  
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');
  const [subcategoriaActiva, setSubcategoriaActiva] = useState('Todas');
  const [ordenActivo, setOrdenActivo] = useState('recomendados');

  useEffect(() => {
    if (productos.length === 0) {
      fetchAllProductos();
    }
  }, [productos.length, fetchAllProductos]);

  const productosConSeed = useMemo(() => {
    return productos.map(p => ({
      ...p,
      _seed: Math.random() 
    }));
  }, [productos]);

  // 1. AHORA SÍ MOSTRAMOS "SUSCRIPCIONES" EN LOS BOTONES
  const categorias = useMemo(() => {
    const cats = productosConSeed
      .filter(p => p.estado !== 'Oculto' && p.estado !== 'eliminado')
      .map(p => p.categoria)
      .filter((v, i, a) => v && a.indexOf(v) === i);
    return ['Todos', ...cats];
  }, [productosConSeed]);

  const subcategorias = useMemo(() => {
    if (categoriaActiva === 'Todos') return [];
    const subcats = productosConSeed
      .filter(p => p.categoria === categoriaActiva && p.estado !== 'Oculto' && p.estado !== 'eliminado')
      .map(p => p.subcategoria)
      .filter((v, i, a) => v && a.indexOf(v) === i);
    return ['Todas', ...subcats];
  }, [productosConSeed, categoriaActiva]);

  useEffect(() => {
    setSubcategoriaActiva('Todas');
  }, [categoriaActiva]);

  const productosFiltrados = useMemo(() => {
    let result = productosConSeed.filter(p => p.estado !== 'eliminado' && p.estado !== 'Oculto');

    // 2. PERO OCULTAMOS SUSCRIPCIONES SI ESTAMOS EN LA VISTA "TODOS"
    if (categoriaActiva === 'Todos') {
      result = result.filter(p => p.categoria !== 'Suscripciones');
    } else {
      result = result.filter(p => p.categoria === categoriaActiva);
    }

    if (subcategoriaActiva !== 'Todas') {
      result = result.filter(p => p.subcategoria === subcategoriaActiva);
    }

    if (busqueda) {
      const searchStr = busqueda.toLowerCase();
      result = result.filter(p => 
        (p.nombre?.toLowerCase() || '').includes(searchStr) || 
        (p.bodega?.toLowerCase() || '').includes(searchStr) ||
        (p.varietal?.toLowerCase() || '').includes(searchStr)
      );
    }

    switch (ordenActivo) {
      case 'menor':
        result.sort((a, b) => (a.precioFinal || a.precioBase || 0) - (b.precioFinal || b.precioBase || 0));
        break;
      case 'mayor':
        result.sort((a, b) => (b.precioFinal || b.precioBase || 0) - (a.precioFinal || a.precioBase || 0));
        break;
      case 'az':
        result.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
        break;
      case 'recomendados':
      default:
        if (categoriaActiva === 'Todos') {
          result.sort((a, b) => a._seed - b._seed);
        }
        break;
    }

    return result;
  }, [productosConSeed, categoriaActiva, subcategoriaActiva, busqueda, ordenActivo]);

  return (
    <div className="min-h-screen bg-[#0F1714] text-[#F5F5DC] font-poppins selection:bg-[#ED6B48] selection:text-white">
      <Helmet>
        <title>Catálogo | DECANT</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <header className="sticky top-0 z-50 bg-[#0F1714]/95 backdrop-blur-md border-b border-white/10 px-4 py-5 shadow-xl">
        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          
          <div className="flex justify-between items-end mb-1">
            <img src="/assets/brand/logo-white-T.png" alt="Decant Club" className="h-12 object-contain opacity-90" />
            
            
          </div>

          <div className="relative">
            <input 
              type="text" 
              placeholder="Buscar vino, bodega, varietal..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-[#F5F5DC] placeholder-white/40 focus:outline-none focus:border-[#ED6B48] transition-colors shadow-inner"
            />
          </div>

          <div className="flex overflow-x-auto hide-scrollbar gap-2">
            {categorias.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoriaActiva(cat)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider transition-colors outline-none
                  ${categoriaActiva === cat 
                    ? 'bg-[#ED6B48] text-white shadow-md shadow-[#ED6B48]/20' 
                    : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {subcategorias.length > 1 && (
            <div className="flex overflow-x-auto hide-scrollbar gap-2 pt-1 border-t border-white/5 mt-1">
              {subcategorias.map(sub => (
                <button
                  key={sub}
                  onClick={() => setSubcategoriaActiva(sub)}
                  className={`whitespace-nowrap px-3 py-1 rounded border text-[9px] md:text-[10px] font-bold uppercase tracking-wider transition-all outline-none
                    ${subcategoriaActiva === sub 
                      ? 'border-[#ED6B48] text-[#ED6B48] bg-[#ED6B48]/10' 
                      : 'border-white/10 text-white/40 hover:border-white/30 hover:text-white/70'}`}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}

        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 pb-20">
        {cargando ? (
          <div className="flex justify-center py-20">
            <span className="text-sm font-bold uppercase tracking-widest text-white/40 animate-pulse">Cargando bodega...</span>
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="text-center py-20 text-white/40 text-sm font-medium">
            No se encontraron productos para esta búsqueda/filtro.
          </div>
        ) : (
          <div className="flex flex-col">
            {/* SELECTOR REDISEÑADO: Texto en lugar de icono */}
            <div className="flex justify-center items-center mb-2 gap-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Ordenar por:</span>
              <select 
                value={ordenActivo}
                onChange={(e) => setOrdenActivo(e.target.value)}
                className="bg-transparent text-[#F5F5DC] text-[10px] md:text-xs font-bold uppercase tracking-wider outline-none cursor-pointer appearance-none border-b border-white/20 pb-0.5 focus:border-[#ED6B48] transition-colors"
              >
                <option value="recomendados" className="bg-[#0F1714]">Sugeridos</option>
                <option value="menor" className="bg-[#0F1714]">Menor Precio</option>
                <option value="mayor" className="bg-[#0F1714]">Mayor Precio</option>
                <option value="az" className="bg-[#0F1714]">Nombre A-Z</option>
              </select>
            </div>
            {productosFiltrados.map((producto) => (
              <div key={producto.id || producto.slug} className="flex justify-between items-center py-4 border-b border-white/10 group hover:bg-white/5 transition-colors px-2 -mx-2 rounded-lg">
                
                <div className="flex flex-col pr-4">
                  <span className="text-sm md:text-base font-bold uppercase tracking-wide text-[#F5F5DC] leading-tight mb-0.5">
                    {producto.nombre}
                  </span>
                  <span className="text-[10px] md:text-xs font-semibold text-white/50 uppercase tracking-widest">
                    {producto.bodega} {producto.varietal ? `• ${producto.varietal}` : ''}
                  </span>
                  
                  {producto.aPedido ? (
                    <span className="text-[9px] text-[#ED6B48] font-bold uppercase mt-1 tracking-widest inline-block">
                      A pedido
                    </span>
                  ) : producto.stock <= 0 ? (
                    <span className="text-[9px] text-red-500 font-bold uppercase mt-1 tracking-widest inline-block">
                      Agotado
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-col items-end shrink-0">
                  {producto.mostrarDescuento && producto.descuentoPorcentaje > 0 ? (
                    <>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="bg-[#ED6B48] text-white text-[9px] font-bold px-1.5 py-0.5 rounded tracking-widest shadow-sm">
                          {producto.descuentoPorcentaje}% OFF
                        </span>
                        <span className="text-[10px] text-white/40 font-medium line-through">
                          ${producto.precioBase?.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-base md:text-lg font-semibold text-[#ED6B48] tracking-tighter">
                        ${producto.precioFinal?.toLocaleString()}
                      </span>
                    </>
                  ) : (
                    <span className="text-base md:text-lg font-semibold text-[#F5F5DC] tracking-tighter">
                      ${producto.precioFinal?.toLocaleString() || producto.precioBase?.toLocaleString()}
                    </span>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="text-center py-8 text-[10px] text-white/20 font-bold uppercase tracking-widest">
        D E C A N T • {new Date().getFullYear()}
      </footer>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}