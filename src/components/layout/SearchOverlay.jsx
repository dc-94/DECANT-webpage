import { useState, useEffect, useRef } from 'react';
import { useCatalog } from '../../context/CatalogContext';
import ProductCard from '../public/ProductCard';
import { Link } from 'react-router-dom';
import BlobProducto from '../icons/BlobProducto'; // Para la versión móvil

// Diccionario de colores para el Blob en la versión móvil
const BLOB_CLASSES = {
  tinto: 'text-brand-orange/60', malbec: 'text-brand-orange/60', cabernet: 'text-brand-orange/60',
  blanco: 'text-light-blue/40', chardonnay: 'text-light-blue/40',
  rosé: 'text-brand-orange/40', rose: 'text-brand-orange/40',
  espumante: 'text-light-blue/60', whisky: 'text-brand-orange/80',
  gin: 'text-light-blue/50', vodka: 'text-brand-white/20', default: 'text-brand-blue/60'
};

const getBlobClass = (sub) => {
  const s = sub?.toLowerCase() || '';
  for (const [key, val] of Object.entries(BLOB_CLASSES)) if (s.includes(key)) return val;
  return BLOB_CLASSES.default;
};

export default function SearchOverlay({ isOpen, onClose }) {
  const { productos } = useCatalog();
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden'; 
    } else {
      setQuery('');
      document.body.style.overflow = 'unset';
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const busquedaNormalizada = query.toLowerCase().trim();
  const resultados = busquedaNormalizada.length > 1 
    ? productos.filter(p => 
        p.nombre?.toLowerCase().includes(busquedaNormalizada) ||
        p.bodega?.toLowerCase().includes(busquedaNormalizada) ||
        p.varietal?.toLowerCase().includes(busquedaNormalizada) ||
        p.categoria?.toLowerCase().includes(busquedaNormalizada)
      ).slice(0, 10) 
    : [];

  const formatPrice = (price) => new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0
  }).format(price || 0);

  return (
    <div className="fixed inset-0 z-[100] bg-extra-black/95 backdrop-blur-xl flex flex-col transition-opacity duration-300">
      
      {/* HEADER BUSCADOR */}
      <div className="h-20 md:h-24 px-6 max-w-[90rem] mx-auto w-full flex items-center justify-end flex-shrink-0">
        <button 
          onClick={onClose}
          className="text-[10px] font-black uppercase tracking-[0.3em] text-light-blue hover:text-brand-orange transition-colors flex items-center gap-2"
        >
          Cerrar
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* ÁREA CENTRAL */}
      <div className="flex-1 max-w-[90rem] mx-auto w-full px-6 flex flex-col pt-2 h-full overflow-hidden">
        
        {/* INPUT */}
        <div className="relative mb-6 md:mb-8 flex-shrink-0 max-w-4xl mx-auto w-full">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar vinos, bodegas..."
            className="w-full bg-transparent border-b border-light-blue/20 text-brand-white text-xl md:text-3xl font-light pb-3 outline-none focus:border-brand-orange transition-colors placeholder:text-light-blue/30 text-center"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-0 top-1 text-dark-grey hover:text-brand-white transition-colors">
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>

        {/* RESULTADOS */}
        <div className="flex-1 overflow-y-auto pb-20 custom-scrollbar" onClick={onClose}>
          
          {query.length > 1 && resultados.length === 0 && (
            <div className="text-light-blue text-xs uppercase tracking-widest font-light text-center mt-12">
              No encontramos resultados para "<span className="text-brand-white font-bold">{query}</span>"
            </div>
          )}

          {resultados.length > 0 && (
            <div onClick={(e) => e.stopPropagation()}>
              
              {/* 📱 VISTA MÓVIL: LISTA HORIZONTAL */}
              <div className="flex flex-col md:hidden">
                {resultados.map((producto) => {
                  const blobClass = getBlobClass(producto.subcategoria || producto.categoria);
                  const sinStock = producto.stock <= 0 && !producto.aPedido;
                  
                  {/* GENERACIÓN SEGURA DE LA URL LARGA */}
                  const catUrl = (producto.categoria || 'catalogo').toLowerCase().trim();
                  const subUrl = (producto.subcategoria || 'seleccion').toLowerCase().trim();

                  return (
                    <Link 
                      key={producto.id} 
                      to={`/shop/${catUrl}/${subUrl}/${producto.id}`} 
                      onClick={onClose}
                      className="flex items-center gap-4 p-4 border-b border-light-blue/10 active:bg-extra-black transition-colors"
                    >
                      {/* Imagen + Blob Miniatura */}
                      <div className="relative w-16 h-20 flex-shrink-0 flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center justify-center opacity-50">
                          <BlobProducto className={`w-full h-full ${blobClass}`} />
                        </div>
                        {producto.imageUrl ? (
                          <img src={producto.imageUrl} alt={producto.nombre} className={`relative z-10 h-[90%] object-contain drop-shadow-lg ${sinStock ? 'grayscale opacity-50' : ''}`} />
                        ) : (
                          <span className="relative z-10 text-xl opacity-50">🍷</span>
                        )}
                      </div>

                      {/* Info de Lista */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-light-blue mb-1 truncate">{producto.bodega}</p>
                        <h4 className="text-brand-white text-sm font-bold truncate mb-1">{producto.nombre}</h4>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-[9px] uppercase tracking-widest text-dark-grey truncate">{producto.varietal}</p>
                          <span className="text-brand-white text-sm font-light tracking-widest ml-2">
                            {formatPrice(producto.precioFinal)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* 💻 VISTA WEB/DESKTOP: GRILLA */}
              <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-8">
                {resultados.map((producto) => (
                  <div key={producto.id} onClick={onClose} className="scale-95 hover:scale-100 transition-transform origin-top">
                    <ProductCard producto={producto} />
                  </div>
                ))}
              </div>

            </div>
          )}
          
        </div>

      </div>
    </div>
  );
}