import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useCatalog } from '../../context/CatalogContext';
import { useSocio } from '../../context/SocioContext';
import { usePricingEngine } from '../../hooks/usePricingEngine';

// Íconos
const CloseIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
);
const TrashIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
);

// 👉 SUBCOMPONENTE 1: Tarjeta de Sugeridos (Aplica el Hook individualmente)
const SuggestedItemCard = ({ prod, onClose, addToCart }) => {
  const { socio } = useSocio();
  const { precioBase, precioEfectivo, descuentoVIPAplicado } = usePricingEngine(prod, socio);
  const mostrarLabelNormal = !descuentoVIPAplicado && (prod.precioBase > prod.precioFinal) && prod.mostrarDescuento && prod.descuentoNombre;

  const handleAdd = (e) => {
    e.stopPropagation();
    const productoParaBolsa = { ...prod, precioFinal: precioEfectivo };
    if (descuentoVIPAplicado) productoParaBolsa.descuentoNombre = `Socio ${socio.badge}`;
    addToCart(productoParaBolsa, 1);
  };

  return (
    <div className="group flex flex-col items-center text-center bg-[#F7F5F0] p-4 border border-dark-blue/5 hover:border-brand-orange transition-colors">
      <Link to={`/producto/${prod.id}`} onClick={onClose} className="flex flex-col items-center outline-none">
        <img src={prod.imageUrl || "https://via.placeholder.com/150x200?text=Vino"} alt={prod.nombre} className="h-40 w-auto object-contain mb-4 group-hover:scale-105 transition-transform" />
        <h4 className="font-poppins text-[10px] font-black uppercase tracking-widest text-dark-blue group-hover:text-brand-orange transition-colors">{prod.nombre}</h4>
        <p className="font-poppins text-[9px] uppercase tracking-widest text-light-blue mt-1">{prod.varietal || prod.cepa}</p>
      </Link>
      <div className="mt-4 flex flex-col items-center w-full">
        {descuentoVIPAplicado ? (
          <div className="flex flex-col items-center mb-3">
            <span className="font-poppins text-[8px] font-black uppercase tracking-[0.1em] text-brand-orange bg-brand-orange/10 border border-brand-orange/20 px-2 py-0.5 mb-1 rounded-sm flex items-center gap-1">SOCIO {socio.badge}</span>
            <div className="flex items-baseline gap-1.5"><span className="font-poppins text-[12px] line-through text-light-blue/60">${precioBase?.toLocaleString()}</span><span className="font-poppins text-md font-black text-dark-blue">${precioEfectivo?.toLocaleString()}</span></div>
          </div>
        ) : mostrarLabelNormal ? (
          <div className="flex flex-col items-center mb-3">
            <span className="font-poppins text-[8px] font-black uppercase tracking-[0.1em] text-brand-orange bg-brand-orange/10 border border-brand-orange/20 px-2 py-0.5 mb-1 rounded-sm flex items-center gap-1">-{prod.descuentoPorcentaje}% {prod.descuentoNombre && <span className="text-[7px]">{prod.descuentoNombre}</span>}</span>
            <div className="flex items-baseline gap-1.5"><span className="font-poppins text-[12px] line-through text-light-blue/60">${precioBase?.toLocaleString()}</span><span className="font-poppins text-md font-black text-dark-blue">${precioEfectivo?.toLocaleString()}</span></div>
          </div>
        ) : (
          <span className="font-poppins text-md font-black text-dark-blue mb-3">${precioEfectivo?.toLocaleString()}</span>
        )}
        <button onClick={handleAdd} className="font-poppins text-[11px] font-black uppercase tracking-[0.2em] text-brand-orange hover:text-dark-orange transition-colors flex items-center gap-1 border-b border-brand-orange/30 pb-0.5 hover:border-brand-orange outline-none">+ Agregar</button>
      </div>
    </div>
  );
};

// 👉 SUBCOMPONENTE 2: Fila de Producto en el Carrito (Aplica el Hook individualmente)
const CartItemRow = ({ item, onClose, updateQuantity, removeFromCart }) => {
  const { socio } = useSocio();
  const { precioBase, precioEfectivo, descuentoVIPAplicado } = usePricingEngine(item, socio);

  return (
    <div className="grid grid-cols-[70px_1fr_auto] md:grid-cols-[80px_1.5fr_1fr_1fr] gap-4 md:gap-6 border-b border-dark-blue/10 pb-8 items-center">
      <Link to={`/producto/${item.id}`} onClick={onClose} className="w-full aspect-[1/1.5] bg-[#F0EBE1] flex items-center justify-center group cursor-pointer">
        <img src={item.imageUrl || "https://via.placeholder.com/150x200?text=Vino"} alt={item.nombre} className="h-[90%] w-auto object-contain mix-blend-multiply group-hover:scale-105 transition-transform" />
      </Link>
      <div className="flex flex-col gap-1 justify-center">
        <Link to={`/producto/${item.id}`} onClick={onClose} className="hover:text-brand-orange transition-colors outline-none">
          <h4 className="font-playfair font-bold text-lg md:text-xl text-dark-blue leading-tight">{item.nombre}</h4>
        </Link>
        <p className="font-poppins text-[9px] uppercase tracking-[0.2em] text-light-blue">{item.varietal || item.cepa}</p>
        <div className="md:hidden flex items-center border border-dark-blue/20 w-max mt-3">
          <button onClick={() => updateQuantity(item.id, item.cantidad - 1)} className="px-3 py-1 text-dark-blue hover:text-brand-orange outline-none">-</button>
          <span className="font-poppins text-[10px] font-black w-6 text-center">{item.cantidad}</span>
          <button onClick={() => updateQuantity(item.id, item.cantidad + 1)} className="px-3 py-1 text-dark-blue hover:text-brand-orange outline-none">+</button>
        </div>
      </div>
      <div className="hidden md:flex flex-col items-start gap-4">
        <div className="flex items-center border border-dark-blue/20 rounded-full px-2 py-1">
          <button onClick={() => updateQuantity(item.id, item.cantidad - 1)} className="px-3 text-dark-blue hover:text-brand-orange transition-colors outline-none">-</button>
          <span className="font-poppins text-[10px] font-black w-4 text-center">{item.cantidad}</span>
          <button onClick={() => updateQuantity(item.id, item.cantidad + 1)} className="px-3 text-dark-blue hover:text-brand-orange transition-colors outline-none">+</button>
        </div>
        <button onClick={() => removeFromCart(item.id)} className="flex items-center gap-1 text-[9px] font-poppins font-black uppercase tracking-[0.1em] text-red-500 hover:scale-110 transition-transform group outline-none">
          <TrashIcon className="w-4 h-4" /><span className="underline decoration-dark-blue/30 underline-offset-4">Eliminar</span>
        </button>
      </div>
      <div className="flex flex-col items-end gap-1 md:justify-center">
        {descuentoVIPAplicado ? (
          <>
            <span className="font-poppins text-[9px] font-black uppercase tracking-[0.1em] text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded-sm mb-1">SOCIO {socio.badge}</span>
            <span className="font-poppins text-[10px] line-through text-dark-blue/40">${precioBase.toLocaleString()}</span>
            <span className="font-poppins text-sm md:text-base font-black text-dark-blue">${precioEfectivo.toLocaleString()}</span>
          </>
        ) : item.descuento > 0 ? (
          <>
            <span className="font-poppins text-[9px] font-black uppercase tracking-[0.1em] text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded-sm mb-1">-{item.descuento}% OFF</span>
            <span className="font-poppins text-[10px] line-through text-dark-blue/40">${precioBase.toLocaleString()}</span>
            <span className="font-poppins text-sm md:text-base font-black text-dark-blue">${precioEfectivo.toLocaleString()}</span>
          </>
        ) : (
          <span className="font-poppins text-sm md:text-base font-black text-dark-blue">${precioEfectivo.toLocaleString()}</span>
        )}
        <button onClick={() => removeFromCart(item.id)} className="md:hidden text-dark-blue/40 hover:text-red-500 mt-4 p-2 -mr-2 outline-none"><TrashIcon className="w-5 h-5" /></button>
      </div>
    </div>
  );
};

export default function CartDrawer({ isOpen, onClose }) {
  const { cart, removeFromCart, updateQuantity, totalItems, addToCart } = useCart();
  const { productos } = useCatalog();
  const { socio } = useSocio();
  const navigate = useNavigate();

  const tieneSuscripcion = cart.some(item => item.label?.toLowerCase() === 'suscripción');
  const tieneNormales = cart.some(item => item.label?.toLowerCase() !== 'suscripción');

  // 👉 ARQUITECTURA CLEAN CODE: Recalculamos el total efectivo en base al hook VIP
  const effectiveTotalPrecio = useMemo(() => {
    return cart.reduce((acc, item) => {
      const pb = item.precioBase || item.precioFinal;
      let pe = item.precioFinal;
      let vip = item.descuentoNombre?.includes('Socio') || false;
      if (socio && !vip) {
        const ts = Math.round(pb * (1 - socio.porcentaje));
        if (ts < pe) pe = ts;
      }
      return acc + (pe * item.cantidad);
    }, 0);
  }, [cart, socio]);

  const sugeridos = useMemo(() => {
    if (cart.length === 0 || !productos) return [];

    const cepasEnCarrito = cart.map(item => item.varietal).filter(Boolean);
    const subcatsEnCarrito = cart.map(item => item.subcategoria).filter(Boolean);
    const idsEnCarrito = cart.map(item => item.id);

    let candidatos = productos.filter(p => 
      !p.aPedido && 
      p.stock > 0 && 
      !idsEnCarrito.includes(p.id) &&
      !p.categoria?.toLowerCase().includes('suscripci') &&
      p.label?.toLowerCase() !== 'suscripción'
    );

    let matches = candidatos.filter(p => cepasEnCarrito.includes(p.varietal));
    if (matches.length === 0) matches = candidatos.filter(p => subcatsEnCarrito.includes(p.subcategoria));
    if (matches.length === 0) matches = candidatos;

    return matches.sort(() => 0.5 - Math.random()).slice(0, 4);
  }, [cart, productos]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-extra-black/60 backdrop-blur-md animate-in fade-in duration-800 cursor-pointer group flex items-center justify-start pl-[10%] lg:pl-[15%]" onClick={onClose}>
        <div className="hidden md:flex flex-col items-center gap-3 text-brand-white/70 group-hover:text-brand-white transition-colors group-hover:-translate-x-2 duration-300">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          <span className="font-poppins text-xs font-black uppercase tracking-[0.3em] drop-shadow-md">Seguir Comprando</span>
        </div>
      </div>

     <div className="relative w-full max-w-4xl bg-neutral-white h-full shadow-2xl animate-in slide-in-from-right duration-1000 flex flex-col md:flex-row border-l border-brand-white/10">   
        
        <div className="hidden md:flex flex-col w-[35%] bg-[#F0EBE1] border-r border-dark-blue/10 p-8 overflow-y-auto custom-scrollbar">
          <h3 className="font-playfair italic text-2xl text-dark-blue mb-8">Podría interesarte</h3>
          <div className="flex flex-col gap-6">
            {/* 👉 Renderizamos el componente refactorizado con Hooks */}
            {sugeridos.map(prod => (
              <SuggestedItemCard key={prod.id} prod={prod} onClose={onClose} addToCart={addToCart} />
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          <div className="flex items-center justify-between p-6 md:p-8 border-b border-dark-blue/10 shrink-0">
            <h2 className="font-playfair italic text-4xl text-dark-blue">Mi Copa <span className="text-2xl text-light-blue">({totalItems})</span></h2>
            <button onClick={onClose} className="text-dark-blue hover:text-brand-orange transition-colors p-2 outline-none"><CloseIcon className="w-8 h-8" /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                <span className="text-6xl mb-4 grayscale">🍷</span>
                <p className="font-playfair italic text-2xl text-dark-blue">Tu copa está vacía</p>
              </div>
            ) : (
              <div className="flex flex-col gap-8">
                {/* 👉 Renderizamos el componente refactorizado con Hooks */}
                {cart.map((item) => (
                  <CartItemRow key={item.id} item={item} onClose={onClose} updateQuantity={updateQuantity} removeFromCart={removeFromCart} />
                ))}
              </div>
            )}
          </div>

          <div className="bg-neutral-white border-t border-dark-blue/10 p-6 md:p-8 shrink-0">
            <div className="flex justify-between items-end mb-6">
              <span className="font-playfair italic text-xl text-dark-blue">Subtotal</span>
              <span className="font-poppins text-xl font-black text-dark-blue">${effectiveTotalPrecio.toLocaleString()}</span>
            </div>
            <div className="flex flex-col gap-3">
              {tieneSuscripcion && <button onClick={() => { onClose(); navigate('/checkout-suscripciones'); }} className="w-full py-5 font-poppins text-[10px] font-black uppercase tracking-[0.3em] transition-all bg-dark-blue text-[#F7F5F0] hover:bg-brand-orange shadow-lg hover:-translate-y-1 outline-none">★ Pagar Suscripción ★</button>}
              {tieneNormales && <button disabled={cart.length === 0} onClick={() => { onClose(); navigate('/checkout'); }} className={`w-full py-5 font-poppins text-[10px] font-black uppercase tracking-[0.3em] transition-all outline-none ${cart.length === 0 ? 'bg-dark-blue/10 text-dark-blue/40 cursor-not-allowed' : 'bg-brand-orange text-brand-white hover:bg-dark-orange shadow-lg hover:-translate-y-1'}`}>Ir a Pagar (Tienda)</button>}
              <button onClick={onClose} className="w-full py-4 font-poppins text-[12px] font-black uppercase tracking-[0.2em] text-dark-blue/60 hover:text-brand-orange transition-colors underline decoration-dark-blue/20 underline-offset-4 outline-none">Seguir Comprando</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}