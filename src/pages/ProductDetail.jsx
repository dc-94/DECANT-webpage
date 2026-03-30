import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCatalog } from '../context/CatalogContext';
import MainNavbar from '../components/layout/MainNavbar';
import BlobProducto from '../components/icons/BlobProducto';

const ShoppingBagIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
);

export default function ProductDetail() {
  const { id, categoria, subcategoria } = useParams();
  const { productos, cargando } = useCatalog();
  const [cantidad, setCantidad] = useState(1);

  const producto = productos.find(p => p.id === id);

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

  const formatPrice = (price) => new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0
  }).format(price || 0);

  const stock = producto.stock || 0;
  const sinStock = stock <= 0 && !producto.aPedido;
  
  const tieneDescuento = producto.precioBase > producto.precioFinal;
  const mostrarLabelAdicional = producto.mostrarDescuento && producto.descuentoNombre;
  
  const leyendaStock = stock === 1 ? "¡Es el último disponible!" : `¡Últimas ${stock} unidades!`;

  // Breadcrumb Truncado
  const getTruncatedBreadcrumb = () => {
    const segments = [
      { label: 'Home', link: '/' },
      { label: 'Shop', link: '/shop' }
    ];

    if (categoria) segments.push({ label: categoria, link: `/shop/${categoria}` });
    if (subcategoria) segments.push({ label: subcategoria, link: `/shop/${categoria}/${subcategoria}` });

    const items = [];
    const separator = <span key="sep" className="mx-1">/</span>;

    if (segments.length > 4) {
      items.push(<span key="ellips" className="opacity-60">...</span>);
      items.push(separator);
      
      const activePath = segments.slice(-2);
      activePath.forEach((seg, index) => {
        items.push(
          <Link key={seg.link} to={seg.link} className="hover:text-brand-orange transition-colors">
            {seg.label}
          </Link>
        );
        if (index === 0) items.push(separator);
      });
    } else {
      segments.forEach((seg, index) => {
        items.push(
          <Link key={seg.link} to={seg.link} className="hover:text-brand-orange transition-colors">
            {seg.label}
          </Link>
        );
        if (index < segments.length - 1) items.push(separator);
      });
    }

    return items;
  };

  return (
    <div className="min-h-screen bg-neutral-white overflow-x-hidden">
      <MainNavbar />

      {/* Breadcrumb - Padding aumentado (pt-36 a pt-44) para despegar del nav */}
      <div className="w-full border-b border-dark-blue/10 pt-36 lg:pt-44 flex-shrink-0 relative z-30">
        <div className="max-w-[95rem] mx-auto px-6 lg:px-20 pb-4 flex items-center gap-1.5 text-[10px] font-poppins font-black uppercase tracking-[0.2em] text-dark-blue/40">
          {getTruncatedBreadcrumb()}
        </div>
      </div>

      <main className="max-w-[95rem] mx-auto grid grid-cols-1 lg:grid-cols-2 items-start pt-6 lg:pt-10 pb-20 lg:pb-0">

        {/* COL IZQ: Imagen */}
        <section className="relative h-[40vh] lg:h-[75vh] flex items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r border-dark-blue/5 lg:sticky lg:top-24 lg:pb-8 lg:pl-16 lg:pr-16">
          
          {/* =========================================
              LEYENDA DE STOCK (Móvil: bottom, Desktop: top)
              ========================================= */}
          <div className="absolute bottom-6 md:bottom-auto md:top-6 left-0 w-full flex justify-center z-30 pointer-events-none">
            {producto.aPedido ? (
              <p className="text-dark-blue text-[10px] md:text-[12px] font-poppins font-black uppercase tracking-[0.2em] drop-shadow-sm bg-white/70 px-2 py-0.5 rounded backdrop-blur-sm">
                A Pedido
              </p>
            ) : (stock > 0 && stock <= 3) ? (
              <p className="text-brand-orange text-[10px] md:text-[12px] font-poppins font-black uppercase tracking-[0.2em] animate-pulse drop-shadow-sm bg-white/70 px-2 py-0.5 rounded backdrop-blur-sm">
                {leyendaStock}
              </p>
            ) : null}
          </div>

          <div className="absolute inset-0 flex items-center justify-center opacity-10 z-0">
            <div className="w-[80%] h-[80%] animate-spin-slow">
              <BlobProducto className="w-full h-full text-light-blue" />
            </div>
          </div>
          
          {producto.imageUrl ? (
            <img 
              src={producto.imageUrl} 
              alt={producto.nombre} 
              className={`relative z-10 h-[70%] lg:h-auto max-h-[65%] lg:max-h-[70%] w-auto object-contain drop-shadow-product transition-transform duration-1000 hover:scale-105 ${sinStock ? 'grayscale opacity-40' : ''}`} 
            />
          ) : (
            <span className="font-playfair italic opacity-20 text-3xl z-10">Selección Decant</span>
          )}
        </section>

        {/* COL DER: Info */}
        <section className="px-6 md:px-12 lg:px-24 pt-8 lg:pt-0 pb-24 lg:flex lg:flex-col overflow-x-hidden">

          {/* 1. Bodega + Línea */}
          <div className="flex items-center gap-3 text-[10px] md:text-xs font-poppins font-black uppercase tracking-[0.25em] text-dark-blue mb-4 flex-wrap">
            <span className="whitespace-nowrap">{producto.bodega}</span>
            <span className="flex-1 h-[1px] bg-dark-blue/20 min-w-[20px]"></span>
          </div>
          
          {/* 2. Nombre */}
          <h1 className="font-playfair italic text-4xl md:text-5xl text-dark-blue leading-[1.1] mb-6">
            {producto.nombre}
          </h1>

          {/* 3. Cepa + Línea + Origen */}
          <div className="flex items-center gap-3 text-[10px] font-poppins font-black uppercase tracking-[0.4em] text-light-blue mb-10 flex-wrap">
            <span className="whitespace-nowrap">{producto.varietal || 'CEPA'}</span>
            <span className="flex-1 h-[1px] bg-dark-blue/10 min-w-[20px]"></span>
            <span className="whitespace-nowrap">{producto.origen || 'ARGENTINA'}</span>
          </div>

          {/* 4. Precios y Labels */}
          {/* Le damos un mb-14 amplio para que no se pegue al botón de compra */}
          <div className="flex flex-col mb-14 w-full">
            {/* Fila Precios */}
            <div className="flex items-baseline gap-4 w-full flex-wrap">
              <span className="text-3xl md:text-5xl font-poppins font-semibold text-dark-blue whitespace-nowrap">
                {formatPrice(producto.precioFinal)}
              </span>
              {tieneDescuento && (
                <span className="text-lg md:text-xl font-poppins line-through text-dark-grey/50 italic whitespace-nowrap">
                  {formatPrice(producto.precioBase)}
                </span>
              )}
            </div>

            {/* Fila Labels (Bajo el precio) */}
            {tieneDescuento && (producto.descuentoPorcentaje > 0 || mostrarLabelAdicional) && (
              <div className="mt-3 flex flex-row">
                <div className="flex flex-row items-center justify-center bg-brand-orange text-brand-white shadow-md">
                  {producto.descuentoPorcentaje > 0 && (
                    <span className="text-[11px] md:text-xs font-black uppercase px-3 py-1.5 tracking-widest leading-tight">
                      -{producto.descuentoPorcentaje}%
                    </span>
                  )}
                  {mostrarLabelAdicional && (
                    <span className={`text-[9px] md:text-[10px] font-black uppercase px-3 py-1.5 tracking-widest leading-tight ${producto.descuentoPorcentaje > 0 ? 'border-l border-brand-white/20' : ''}`}>
                      {producto.descuentoNombre}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Carrito */}
          <div className="flex flex-col items-center mb-16 max-w-lg mx-auto w-full relative z-40">
            <div className="flex flex-row items-stretch gap-2 w-full">
              <div className="flex items-center border border-dark-blue/10 bg-white w-32 h-16 px-2 flex-shrink-0">
                <button 
                  onClick={() => cantidad > 1 && setCantidad(cantidad - 1)}
                  className="w-10 h-full text-lg hover:text-brand-orange transition-colors"
                >—</button>
                <span className="flex-1 text-center font-poppins font-bold text-sm">{cantidad}</span>
                <button 
                  onClick={() => cantidad < stock && setCantidad(cantidad + 1)}
                  className="w-10 h-full text-lg hover:text-brand-orange transition-colors"
                >+</button>
              </div>

              <button 
                disabled={sinStock}
                className={`flex-1 flex items-center justify-between px-6 md:px-8 h-16 font-poppins font-black uppercase tracking-[0.2em] text-[10px] md:text-[12px] transition-all duration-500 shadow-2xl
                  ${sinStock 
                    ? 'bg-light-grey text-dark-grey cursor-not-allowed shadow-none' 
                    : 'bg-brand-orange text-brand-white hover:bg-dark-orange hover:translate-y-[-4px]'}`}
              >
                <span>{sinStock ? 'Agotado' : 'Comprar'}</span>
                <ShoppingBagIcon className="w-6 h-6 md:w-7 md:h-7" />
              </button>
            </div>
          </div>

          {/* Descripción */}
          {producto.descripcion && (
            <div className="mt-2 pt-12 border-t border-dark-blue/5 relative z-10">
              <h3 className="font-poppins uppercase tracking-widest text-brand-orange text-lg md:text-2xl mb-6 flex items-baseline gap-2 flex-wrap">
                <span>DESCUBRÍ</span> <span className="font-black text-dark-blue break-words">{producto.nombre}</span>
              </h3>
              <p className="font-playfair text-lg md:text-2xl leading-relaxed text-dark-blue/80 italic break-words">
                "{producto.descripcion}"
              </p>
            </div>
          )}

        </section>
      </main>

      {/* Footer Relacionados */}
      <section className="h-screen bg-dark-blue flex items-center justify-center relative z-20 mt-12">
        <h2 className="font-playfair italic text-brand-white text-2xl md:text-3xl">Otras joyas de nuestra cava</h2>
      </section>
    </div>
  );
}