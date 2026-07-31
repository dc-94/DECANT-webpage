import { useState, memo } from 'react';
import { Link } from 'react-router-dom';
import BlobProducto from '../icons/BlobProducto.jsx';
import { formatPrice } from '@decant/core';
import { usePricingEngine } from '@decant/core/react';

// 👉 Función de colores dinámicos (Sin el /40 porque el contenedor ya tiene opacity-15)
const obtenerColorBlob = (categoria, subcategoria) => {
  const catStr = (categoria || "").toLowerCase();
  const subStr = (subcategoria || "").toLowerCase();
  
  if (catStr.includes("vino")) {
    if (subStr.includes("tinto") || subStr.includes("blend")) return "text-red-800";
    if (subStr.includes("blanco")) return "text-yellow-400";
    if (subStr.includes("rosado")) return "text-pink-400";
    return "text-red-800";
  } 
  if (catStr.includes("espumante")) return "text-amber-400"; 
  if (catStr.includes("destilado")) return "text-cyan-400";
  if (catStr.includes("aperitivo")) return "text-orange-500";
  if (catStr.includes("deli") || catStr.includes("cafe")) return "text-stone-400";
  
  return "text-light-blue"; 
};

const ShoppingBagIcon = memo(({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
));

const ProductCard = memo(function ProductCard({ producto, socio = null, onAddToCart }) {
  
  const [showQuantity, setShowQuantity] = useState(false);
  const [cantidad, setCantidad] = useState(1);

  // 👉 Llamamos a nuestro Hook para que haga toda la matemática por nosotros
  const { 
    precioBase, 
    precioEfectivo, 
    descuentoVIPAplicado 
  } = usePricingEngine(producto, socio);

  const stock = producto.stock || 0;
  const sinStock = stock <= 0 && !producto.aPedido;
  
  // Definimos qué precio tachado mostrar y si se debe mostrar el label de descuento normal
  const precioAnterior = (precioBase > precioEfectivo) ? precioBase : null;
  const mostrarLabelNormal = !descuentoVIPAplicado && (producto.precioBase > producto.precioFinal) && producto.mostrarDescuento && producto.descuentoNombre;

  const leyendaStock = stock === 1 ? "¡Es el último!" : `¡Últimas ${stock} u.!`;

  const sumar = (e) => { e.stopPropagation(); if (cantidad < stock) setCantidad(cantidad + 1); };
  const restar = (e) => { e.stopPropagation(); if (cantidad > 1) setCantidad(cantidad - 1); else setShowQuantity(false); };

  const productUrl = `/producto/${producto.slug || producto.id}`;

  // Determinamos el color dinámico para esta tarjeta
  const colorDelBlob = obtenerColorBlob(producto.categoria, producto.subcategoria);

  return (
    <div className="group flex flex-col h-full bg-transparent font-poppins">
      <Link to={productUrl} className="relative aspect-[3/4] flex items-center justify-center overflow-hidden p-0 bg-transparent flex-shrink-0 block outline-none">
        <div className="absolute inset-0 flex items-center justify-center z-0 opacity-15 transition-transform duration-1000 group-hover:scale-110 pointer-events-none">
           {/* 👉 BLOB DINÁMICO */}
           <BlobProducto className={`w-[90%] h-[90%] ${colorDelBlob}`} /> 
        </div>
        {producto.imageUrl ? (
          <img src={producto.imageUrl} alt={producto.nombre} loading="lazy" decoding="async" className={`relative z-10 h-[80%] object-contain transition-transform duration-700 group-hover:scale-105 ${sinStock ? 'grayscale opacity-30' : ''}`} />
        ) : (
          <div className="text-[10px] uppercase tracking-widest opacity-20 italic font-playfair relative z-10">Sin Imagen</div>
        )}
      </Link>

      <div className="flex flex-col flex-1 mt-3">
        <div className="h-6 flex items-start justify-center w-full mb-1 flex-shrink-0">
          {producto.aPedido ? (
            <div className="bg-extra-black text-brand-white text-[9px] font-black uppercase tracking-[0.4em] py-1.5 w-full text-center shadow-sm">A Pedido</div>
          ) : (stock > 0 && stock <= 3) ? (
            <div className="text-brand-orange text-[9px] font-black uppercase tracking-[0.3em] py-1.5 w-full text-center animate-pulse">{leyendaStock}</div>
          ) : null}
        </div>

        {/* 👉 BODEGA Y ORIGEN (Movidos hacia arriba de forma elegante) */}
        <div className="flex flex-col mb-2 mt-1">
          <div className="flex items-center gap-2 text-[9px] font-poppins font-black uppercase tracking-[0.25em] text-dark-blue mb-1">
            <span className="whitespace-nowrap truncate max-w-[70%]">{producto.bodega}</span>
            <span className="flex-1 h-[1px] bg-dark-blue/15"></span>
          </div>
          <div className="flex items-center gap-2 text-[8px] font-poppins font-black uppercase tracking-[0.4em] text-light-blue">
            <span className="flex-1 h-[1px] bg-dark-blue/10"></span>
            {/* Reemplazamos varietal por ORIGEN */}
            <span className="whitespace-nowrap truncate max-w-[80%]">{producto.origen || 'ARGENTINA'}</span>
          </div>
        </div>

        {/* 👉 NOMBRE DEL PRODUCTO */}
        <div className="mb-2">
          <Link to={productUrl} className="outline-none block">
            <h3 className="font-playfair italic text-xl md:text-2xl leading-tight text-dark-blue line-clamp-3 hover:text-brand-orange transition-colors">
              {producto.nombre}
            </h3>
          </Link>
        </div>

        <div className="mt-auto flex flex-col pt-2">
          <div className="h-5 flex items-end mb-1">
            {descuentoVIPAplicado ? (
              <div className="flex flex-row items-center bg-extra-black text-brand-orange rounded-[4px] overflow-hidden w-max shadow-sm px-2 py-0.5">
                <span className="text-[9px] font-black uppercase tracking-widest">Socio {socio?.badge ?? ''}</span>
              </div>
            ) : mostrarLabelNormal ? (
              <div className="flex flex-row items-center bg-white border border-brand-orange text-brand-orange rounded-[4px] overflow-hidden w-max shadow-sm">
                {producto.descuentoPorcentaje > 0 && <span className="text-[9px] font-medium uppercase px-1.5 py-0.5 tracking-widest">-{producto.descuentoPorcentaje}%</span>}
                <span className={`text-[8px] font-medium uppercase px-1.5 py-0.5 tracking-widest ${producto.descuentoPorcentaje > 0 ? 'border-l border-brand-orange' : ''}`}>{producto.descuentoNombre}</span>
              </div>
            ) : null}
          </div>
          
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className={`text-xl md:text-2xl font-semibold whitespace-nowrap ${descuentoVIPAplicado ? 'text-brand-orange' : 'text-dark-blue'}`}>
              {formatPrice(precioEfectivo)}
            </span>
            {precioAnterior && (
              <span className="text-[11px] line-through text-dark-grey/50 italic whitespace-nowrap">
                {formatPrice(precioAnterior)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 h-[42px] flex-shrink-0 relative z-30">
        {!showQuantity ? (
          <button onClick={(e) => { e.preventDefault(); if(!sinStock) setShowQuantity(true); }} disabled={sinStock} className={`w-full h-full group/btn flex items-center justify-between pl-5 pr-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 outline-none ${sinStock ? 'bg-light-grey text-dark-grey cursor-not-allowed' : 'bg-brand-orange text-brand-white hover:bg-dark-orange shadow-md'}`}>
            <span>{sinStock ? 'Agotado' : 'Comprar'}</span><ShoppingBagIcon className="w-4 h-4 transform transition-transform group-hover/btn:scale-110 group-hover/btn:-rotate-6" />
          </button>
        ) : (
          <div className="flex items-center border border-brand-orange h-full animate-in fade-in zoom-in duration-300">
            <button onClick={(e) => { e.preventDefault(); restar(e); }} className="w-10 h-full hover:bg-brand-orange/10 transition-colors text-lg flex items-center justify-center text-brand-orange outline-none">
              {cantidad === 1 ? <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg> : '—'}
            </button>
            <span className="flex-1 text-center font-bold text-sm h-full flex items-center justify-center bg-neutral-white text-dark-blue">{cantidad}</span>
            <button onClick={(e) => { e.preventDefault(); sumar(e); }} className="w-10 h-full hover:bg-brand-orange/10 transition-colors text-lg flex items-center justify-center text-brand-orange outline-none">+</button>
            <button onClick={(e) => { 
                e.preventDefault(); e.stopPropagation(); 
                
                // 👉 Usamos precioEfectivo validado por el hook
                const productoParaBolsa = { ...producto, precioFinal: precioEfectivo };
                if (descuentoVIPAplicado) {
                  productoParaBolsa.tipoDescuento = 'SOCIO';
                  productoParaBolsa.descuentoNombre = `Socio ${socio?.badge ?? ''}`.trim();
                }
                onAddToCart(productoParaBolsa, cantidad); 
                setShowQuantity(false); setCantidad(1);                
              }} className="bg-brand-orange text-brand-white h-full px-3 flex items-center justify-center hover:bg-dark-orange transition-colors outline-none">
              <ShoppingBagIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default ProductCard;