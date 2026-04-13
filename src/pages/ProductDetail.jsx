import SEO from '../components/public/SEO';
import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useCatalog } from '../context/CatalogContext';
import MainNavbar from '../components/layout/MainNavbar';
import BlobProducto from '../components/icons/BlobProducto';
import ProductCard from '../components/public/ProductCard';
import DynamicGuide from '../components/public/DynamicGuide';
import Footer from '../components/layout/Footer';

const ShoppingBagIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
);

export default function ProductDetail() {
  const { id } = useParams();
  const { productos, cargando } = useCatalog();
  const { addToCart } = useCart();
  const [cantidad, setCantidad] = useState(1);

  const producto = productos.find(p => p.slug === id || p.id === id);

  // ==========================================
  // LÓGICA DE PRODUCTOS RELACIONADOS (Aleatorio y Sin Suscripciones)
  // ==========================================
  const productosRelacionados = useMemo(() => {
    if (!productos || !producto) return [];
    
    // 👉 1. Filtramos las suscripciones de todo el catálogo
    const catalogoLimpio = productos.filter(p => 
      p.id !== producto.id && 
      !p.categoria?.toLowerCase().includes('suscripci') && 
      p.label?.toLowerCase() !== 'suscripción'
    );
    
    // 2. Buscamos en la misma subcategoría
    let relacionados = catalogoLimpio.filter(p => p.subcategoria === producto.subcategoria);
    
    // 3. Si faltan, rellenamos con la misma categoría
    if (relacionados.length < 3) {
      const extra = catalogoLimpio.filter(p => p.categoria === producto.categoria && !relacionados.includes(p));
      relacionados = [...relacionados, ...extra];
    }

    // 4. Si AÚN faltan (ej: única botella en la tienda), rellenamos con cualquier otra cosa al azar
    if (relacionados.length < 3) {
      const fallback = catalogoLimpio.filter(p => !relacionados.includes(p));
      relacionados = [...relacionados, ...fallback];
    }
    
    // 5. Mezclamos y sacamos 3
    return relacionados.sort(() => 0.5 - Math.random()).slice(0, 3);
  }, [productos, producto]);

  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  if (cargando) return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-white font-poppins text-[10px] tracking-[0.4em] uppercase">
      Cargando etiqueta...
    </div>
  );

  if (!producto) return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-white">
      <Link to="/shop" className="font-poppins uppercase tracking-widest text-[10px] border-b border-dark-blue">Volver al Shop</Link>
    </div>
  );

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": producto.nombre,
    "image": producto.imageUrl,
    "description": producto.descripcion || `Exclusivo ${producto.varietal || producto.categoria} disponible en Decant.`,
    "sku": producto.id,
    "brand": { "@type": "Brand", "name": producto.bodega || "Decant" },
    "offers": {
      "@type": "Offer", "url": typeof window !== 'undefined' ? window.location.href : '',
      "priceCurrency": "ARS", "price": producto.precioFinal,
      "availability": producto.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    }
  };

  const formatPrice = (price) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price || 0);

  const stock = producto.stock || 0;
  const sinStock = stock <= 0 && !producto.aPedido;
  const tieneDescuento = producto.precioBase > producto.precioFinal;
  const mostrarLabelAdicional = producto.mostrarDescuento && producto.descuentoNombre;
  const leyendaStock = stock === 1 ? "¡Es el último disponible!" : `¡Últimas ${stock} unidades!`;
  const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';

  const getTruncatedBreadcrumb = () => {
    const segments = [{ label: 'Home', link: '/' }, { label: 'Shop', link: '/shop' }];
    const cat = producto.categoria;
    const sub = producto.subcategoria;
    const cepa = producto.varietal || producto.cepa; 

    if (cat) segments.push({ label: capitalize(cat), link: `/shop/${cat.toLowerCase()}` });
    if (cat && sub) segments.push({ label: capitalize(sub), link: `/shop/${cat.toLowerCase()}/${sub.toLowerCase()}` });
    if (cat && sub && cepa) segments.push({ label: capitalize(cepa), link: `/shop/${cat.toLowerCase()}/${sub.toLowerCase()}/${cepa.toLowerCase()}` });

    const items = [];
    if (segments.length > 4) {
      items.push(<span key="ellips" className="opacity-60">...</span>);
      items.push(<span key="sep-ellips" className="mx-1">/</span>);
      const activePath = segments.slice(-2);
      activePath.forEach((seg, index) => {
        items.push(<Link key={seg.link} to={seg.link} className="hover:text-brand-orange transition-colors">{seg.label}</Link>);
        if (index === 0) items.push(<span key={`sep-active-${index}`} className="mx-1">/</span>);
      });
    } else {
      segments.forEach((seg, index) => {
        items.push(<Link key={seg.link} to={seg.link} className="hover:text-brand-orange transition-colors">{seg.label}</Link>);
        if (index < segments.length - 1) items.push(<span key={`sep-${index}`} className="mx-1">/</span>);
      });
    }
    return items;
  };

  return (
    <div className="min-h-screen bg-neutral-white overflow-x-hidden">
      
      {/* Estilos inyectados para ocultar la barra de scroll y animar la flechita */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes swipe-bounce {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(25%); }
        }
        .animate-swipe-bounce { animation: swipe-bounce 1.5s infinite ease-in-out; }
      `}</style>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SEO title={producto.nombre} description={producto.descripcion || `Adquiere ${producto.nombre} de bodega ${producto.bodega} en Decant.`} image={producto.imageUrl} type="product" />
      <MainNavbar />

      <div className="w-full border-b border-dark-blue/10 pt-36 lg:pt-44 flex-shrink-0 relative z-20">
        <div className="max-w-[95rem] mx-auto px-6 lg:px-20 pb-4 flex items-center gap-1.5 text-[10px] font-poppins font-black uppercase tracking-[0.2em] text-dark-blue/40">
          {getTruncatedBreadcrumb()}
        </div>
      </div>

      <main className="max-w-[95rem] mx-auto grid grid-cols-1 lg:grid-cols-2 items-start pt-6 lg:pt-10 pb-20 lg:pb-0 relative z-10">
        <section className="relative h-[40vh] lg:h-[75vh] flex items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r border-dark-blue/5 lg:sticky lg:top-24 lg:pb-8 lg:pl-16 lg:pr-16 z-10">
          <div className="absolute bottom-6 md:bottom-auto md:top-6 left-0 w-full flex justify-center z-10 pointer-events-none">
            {producto.aPedido ? (
              <p className="text-dark-blue text-[10px] md:text-[12px] font-poppins font-black uppercase tracking-[0.2em] drop-shadow-sm bg-white/70 px-2 py-0.5 rounded backdrop-blur-sm">A Pedido</p>
            ) : (stock > 0 && stock <= 3) ? (
              <p className="text-brand-orange text-[10px] md:text-[12px] font-poppins font-black uppercase tracking-[0.2em] animate-pulse drop-shadow-sm bg-white/70 px-2 py-0.5 rounded backdrop-blur-sm">{leyendaStock}</p>
            ) : null}
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-10 z-0 pointer-events-none">
            <div className="w-[80%] h-[80%] animate-spin-slow"><BlobProducto className="w-full h-full text-light-blue" /></div>
          </div>
          {producto.imageUrl ? (
            <img src={producto.imageUrl} alt={producto.nombre} className={`relative z-10 h-[70%] lg:h-auto max-h-[65%] lg:max-h-[70%] w-auto object-contain drop-shadow-product transition-transform duration-1000 hover:scale-105 ${sinStock ? 'grayscale opacity-40' : ''}`} />
          ) : (
            <span className="font-playfair italic opacity-20 text-3xl z-10 relative">Selección Decant</span>
          )}
        </section>

        <section className="px-6 md:px-12 lg:px-24 pt-8 lg:pt-0 pb-24 lg:flex lg:flex-col overflow-x-hidden relative z-10">
          <div className="flex items-center gap-3 text-[10px] md:text-xs font-poppins font-black uppercase tracking-[0.25em] text-dark-blue mb-4 flex-wrap">
            <span className="whitespace-nowrap">{producto.bodega}</span><span className="flex-1 h-[1px] bg-dark-blue/20 min-w-[20px]"></span>
          </div>
          <h1 className="font-playfair italic text-4xl md:text-5xl text-dark-blue leading-[1.1] mb-6">{producto.nombre}</h1>
          <div className="flex items-center gap-3 text-[14px] font-poppins font-black uppercase tracking-[0.4em] text-light-blue mb-10 flex-wrap">
            <span className="whitespace-nowrap">{producto.varietal || 'CEPA'}</span><span className="flex-1 h-[1px] bg-dark-blue/10 min-w-[20px]"></span><span className="whitespace-nowrap">{producto.origen || 'ARGENTINA'}</span>
          </div>

          <div className="flex flex-col mb-14 w-full">
            <div className="flex items-baseline gap-4 w-full flex-wrap">
              <span className="text-3xl md:text-5xl font-poppins font-semibold text-dark-blue whitespace-nowrap">{formatPrice(producto.precioFinal)}</span>
              {tieneDescuento && <span className="text-lg md:text-xl font-poppins line-through text-dark-grey/50 italic whitespace-nowrap">{formatPrice(producto.precioBase)}</span>}
            </div>
            {tieneDescuento && (producto.descuentoPorcentaje > 0 || mostrarLabelAdicional) && (
              <div className="mt-3 flex flex-row">
                <div className="flex flex-row items-center justify-center bg-brand-orange text-brand-white shadow-md">
                  {producto.descuentoPorcentaje > 0 && <span className="text-[11px] md:text-xs font-black uppercase px-3 py-1.5 tracking-widest leading-tight">-{producto.descuentoPorcentaje}%</span>}
                  {mostrarLabelAdicional && <span className={`text-[9px] md:text-[10px] font-black uppercase px-3 py-1.5 tracking-widest leading-tight ${producto.descuentoPorcentaje > 0 ? 'border-l border-brand-white/20' : ''}`}>{producto.descuentoNombre}</span>}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center mb-16 max-w-lg mx-auto w-full relative z-10">
            <div className="flex flex-row items-stretch gap-2 w-full">
              <div className="flex items-center border border-dark-blue/10 bg-white w-32 h-16 px-2 flex-shrink-0">
                <button onClick={() => cantidad > 1 && setCantidad(cantidad - 1)} className="w-10 h-full text-lg hover:text-brand-orange transition-colors outline-none">—</button>
                <span className="flex-1 text-center font-poppins font-bold text-sm">{cantidad}</span>
                <button onClick={() => cantidad < stock && setCantidad(cantidad + 1)} className="w-10 h-full text-lg hover:text-brand-orange transition-colors outline-none">+</button>
              </div>
              <button disabled={sinStock} onClick={() => addToCart(producto, cantidad)} className={`flex-1 flex items-center justify-between px-6 md:px-8 h-16 font-poppins font-black uppercase tracking-[0.2em] text-[10px] md:text-[12px] transition-all duration-500 outline-none ${sinStock ? 'bg-light-grey text-dark-grey cursor-not-allowed border border-dark-blue/10' : 'bg-brand-orange text-brand-white hover:bg-dark-orange hover:-translate-y-1 shadow-xl hover:shadow-2xl'}`}>
                <span>{sinStock ? 'Agotado' : 'Comprar'}</span><ShoppingBagIcon className="w-6 h-6 md:w-7 md:h-7" />
              </button>
            </div>
          </div>

          {producto.descripcion && (
            <div className="mt-2 pt-12 border-t border-dark-blue/5 relative z-10">
              <h3 className="font-poppins uppercase tracking-widest text-brand-orange text-lg md:text-2xl mb-6 flex items-baseline gap-2 flex-wrap"><span>DESCUBRÍ</span> <span className="font-black text-dark-blue break-words">{producto.nombre}</span></h3>
              <p className="font-poppins text-base md:text-lg leading-relaxed text-dark-blue/80 break-words">{producto.descripcion}</p>
            </div>
          )}
        </section>
      </main>  

      {/* =========================================================
          CARRUSEL MÓVIL / GRILLA DESKTOP DE PRODUCTOS RELACIONADOS 
          ========================================================= */}
      {productosRelacionados.length > 0 && (
        <section className="w-full bg-[#F4F7FA] mt-12 py-16 md:py-24 relative z-10 overflow-hidden">
          <div className="max-w-[95rem] mx-auto px-0 md:px-6 lg:px-20">
            
            <div className="flex items-center justify-between mb-4 md:mb-6 px-6 md:px-0">
              <h2 className="font-playfair italic text-dark-blue text-2xl md:text-4xl">Otras joyas de nuestra cava</h2>
              <Link to={`/shop/${producto.categoria?.toLowerCase()}`} className="hidden md:block font-poppins text-[10px] font-black uppercase tracking-[0.2em] text-brand-orange hover:text-dark-blue transition-colors">
                Ver más
              </Link>
            </div>

            {/* 👉 Indicador de Swipe animado (Solo Móvil) */}
            <div className="md:hidden flex items-center justify-end gap-2 text-brand-orange text-[9px] font-black uppercase tracking-widest px-6 mb-4 opacity-80">
              <span>Deslizá para ver</span>
              <svg className="w-4 h-4 animate-swipe-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </div>

            {/* 👉 Contenedor Híbrido: Flex-Snap (Móvil) / Grid (Desktop) */}
            <div className="flex overflow-x-auto md:grid md:grid-cols-3 gap-4 md:gap-12 lg:gap-24 px-6 md:px-0 lg:px-12 snap-x snap-mandatory hide-scrollbar pb-8 md:pb-0">
              {productosRelacionados.map(prod => (
                <div key={prod.id} className="flex-none w-[75vw] sm:w-[60vw] md:w-auto md:flex-auto snap-center md:snap-align-none">
                  <ProductCard producto={prod} />
                </div>
              ))}
            </div>

            <div className="mt-8 text-center md:hidden border-t border-dark-blue/5 pt-8 mx-6">
              <Link to={`/shop/${producto.categoria?.toLowerCase()}`} className="font-poppins text-[10px] font-black uppercase tracking-[0.2em] text-brand-orange border border-brand-orange px-8 py-3 rounded-sm">
                Ver todo el catálogo
              </Link>
            </div>

          </div>
        </section>
      )}

      <DynamicGuide key={producto.id} categoria={producto.categoria} />    
      <Footer />  
    </div>
  );
}