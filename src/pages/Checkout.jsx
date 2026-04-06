import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

// Íconos
const TrashIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
);
const ChevronIcon = ({ className, isOpen }) => (
  <svg className={`${className} transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
);
const LockIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
);
const ArrowLeftIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
);

export default function Checkout() {
  const { cart, removeFromCart, updateQuantity, totalPrecio, clearCart } = useCart();
  const navigate = useNavigate();

  // Estados del Acordeón (1: Datos, 2: Envío, 3: Pago)
  const [activeStep, setActiveStep] = useState(1);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  // Estados del Formulario
  const [formData, setFormData] = useState({
    nombre: '', apellido: '', email: '', telefono: '',
    envio: 'convenir', direccion: '', ciudad: '', cp: '',
    pago: 'transferencia'
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ==========================================
  // LÓGICA DE PRECIOS Y ENVÍOS
  // ==========================================
  const descuentoMonto = formData.pago === 'transferencia' ? totalPrecio * 0.05 : 0;
  const totalFinal = totalPrecio - descuentoMonto;
  const textoEnvio = formData.envio === 'retiro' || formData.envio === 'local' ? 'Gratis' : 'A convenir';

  const handleCheckout = (e) => {
    e.preventDefault();
    
    // Guardar temporalmente los datos para la página de gracias
    const pedidoConfirmado = { 
      cart, 
      subtotal: totalPrecio,
      descuento: descuentoMonto,
      totalFinal: totalFinal,
      formData 
    };
    localStorage.setItem('decant_last_order', JSON.stringify(pedidoConfirmado));
    
    clearCart();
    navigate('/gracias'); // Redirige a la página de confirmación
  };

  // Redirigir si no hay nada en el carrito
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#F7F5F0] flex flex-col items-center justify-center p-6">
        <h2 className="font-playfair italic text-3xl text-dark-blue mb-6">Tu copa está vacía</h2>
        <button onClick={() => navigate('/shop')} className="font-poppins text-xs font-black uppercase tracking-[0.2em] text-brand-white bg-dark-blue px-8 py-4 hover:bg-brand-orange transition-colors">Volver a la tienda</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-dark-blue font-poppins selection:bg-brand-orange selection:text-white flex flex-col">
      
      {/* ==========================================
          RESUMEN MÓVIL (Acordeón)
          ========================================== */}
      <div className="md:hidden bg-[#F0EBE1] border-b border-dark-blue/10 shrink-0">
        <button 
          onClick={() => setMobileSummaryOpen(!mobileSummaryOpen)}
          className="w-full flex items-center justify-between p-6 text-sm font-black uppercase tracking-widest text-dark-blue outline-none"
        >
          <span className="flex items-center gap-2">
            🛒 Resumen <ChevronIcon className="w-4 h-4" isOpen={mobileSummaryOpen} />
          </span>
          {/* Muestra el total dinámico en móvil */}
          <span className="text-brand-orange font-bold">${totalFinal.toLocaleString()}</span>
        </button>
        
        <div className={`overflow-hidden transition-all duration-300 px-6 ${mobileSummaryOpen ? 'max-h-[1000px] pb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="flex flex-col gap-6 pt-4 border-t border-dark-blue/10">
            {cart.map((item) => (
              <div key={item.id} className="grid grid-cols-[60px_1fr_auto_auto] gap-x-3 gap-y-1 items-start border-b border-dark-blue/10 pb-4">
                <div className="row-span-2 w-full aspect-[1/1.5] bg-white flex items-center justify-center p-1 rounded-sm">
                  <img src={item.imageUrl} alt={item.nombre} className="h-[95%] w-auto object-contain mix-blend-multiply" />
                </div>
                <h4 className="col-start-2 font-playfair font-bold text-sm leading-tight text-dark-blue">{item.nombre}</h4>
                <div className="col-start-3 text-lg text-dark-blue/60 font-normal whitespace-nowrap text-right self-center">
                  {item.cantidad > 1 ? `${item.cantidad} x ` : ''}${item.precioFinal.toLocaleString()}
                </div>
                <div className="col-start-4 font-poppins text-lg font-semibold text-dark-blue text-right self-center">
                  ${(item.precioFinal * item.cantidad).toLocaleString()}
                </div>
                <p className="col-start-2 text-[8px] uppercase tracking-[0.2em] text-light-blue self-start">{item.varietal}</p>
                <div className="col-start-4 flex items-center justify-end gap-2 self-start">
                  <div className="flex items-center border border-dark-blue/20 rounded-sm">
                    <button onClick={() => updateQuantity(item.id, item.cantidad - 1)} className="px-1.5 py-0.5 text-dark-blue hover:text-brand-orange outline-none">-</button>
                    <span className="font-poppins text-[9px] font-black w-3 text-center">{item.cantidad}</span>
                    <button onClick={() => updateQuantity(item.id, item.cantidad + 1)} className="px-1.5 py-0.5 text-dark-blue hover:text-brand-orange outline-none">+</button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-light-blue hover:text-red-500 transition-colors outline-none">
                    <TrashIcon className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
            
            {/* FOOTER RESUMEN MÓVIL */}
            <div className="pt-2 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-dark-blue/70">Subtotal</span>
                <span className="font-poppins text-xs font-bold text-dark-blue">${totalPrecio.toLocaleString()}</span>
              </div>
              {descuentoMonto > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-brand-orange">Descuento (5%)</span>
                  <span className="font-poppins text-xs font-bold text-brand-orange">- ${descuentoMonto.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-center pb-2 border-b border-dark-blue/10">
                <span className="text-xs text-dark-blue/70">Envío</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${textoEnvio === 'Gratis' ? 'text-green-600' : 'text-brand-orange'}`}>
                  {textoEnvio}
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ==========================================
          LAYOUT PRINCIPAL (Split Screen Desktop)
          ========================================== */}
      <div className="max-w-[85rem] w-full mx-auto grid grid-cols-1 md:grid-cols-[1.2fr_1fr] flex-1">
        
        {/* COLUMNA IZQUIERDA: FORMULARIO ACORDEÓN */}
        <div className="p-6 md:p-12 lg:p-16 flex flex-col">
          
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-dark-blue/50 hover:text-brand-orange transition-colors w-max mb-10 outline-none group"
          >
            <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Seguir Comprando
          </button>
          
          <form onSubmit={handleCheckout} className="flex flex-col gap-6">
            
            {/* PASO 1: DATOS DE CONTACTO */}
            <div className={`bg-neutral-white p-6 md:p-8 shadow-sm transition-all duration-300 ${activeStep === 1 ? 'border border-brand-orange/30' : 'border border-dark-blue/10 opacity-70'}`}>
              <div className="flex justify-between items-center cursor-pointer" onClick={() => setActiveStep(1)}>
                <h2 className="font-poppins font-semibold text-xl md:text-2xl">1. Tus Datos</h2>
                {activeStep !== 1 && <span className="text-xs font-black uppercase tracking-widest text-brand-orange hover:underline">Editar</span>}
              </div>
              
              <div className={`overflow-hidden transition-all duration-500 ${activeStep === 1 ? 'max-h-[500px] mt-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input required type="text" name="nombre" placeholder="Nombre" value={formData.nombre} onChange={handleInputChange} className="w-full bg-white border border-dark-blue/10 p-4 text-sm outline-none focus:border-brand-orange transition-colors" />
                  <input required type="text" name="apellido" placeholder="Apellido" value={formData.apellido} onChange={handleInputChange} className="w-full bg-white border border-dark-blue/10 p-4 text-sm outline-none focus:border-brand-orange transition-colors" />
                  <input required type="email" name="email" placeholder="Correo Electrónico" value={formData.email} onChange={handleInputChange} className="w-full bg-white border border-dark-blue/10 p-4 text-sm outline-none focus:border-brand-orange transition-colors md:col-span-2" />
                  <input required type="tel" name="telefono" placeholder="WhatsApp (Ej: 341 555 5555)" value={formData.telefono} onChange={handleInputChange} className="w-full bg-white border border-dark-blue/10 p-4 text-sm outline-none focus:border-brand-orange transition-colors md:col-span-2" />
                </div>
                <button type="button" onClick={() => setActiveStep(2)} className="mt-6 bg-dark-blue text-brand-white text-[10px] font-black uppercase tracking-[0.2em] px-8 py-4 hover:bg-brand-orange transition-colors outline-none">Continuar al Envío</button>
              </div>
            </div>

            {/* PASO 2: ENTREGA */}
            <div className={`bg-neutral-white p-6 md:p-8 shadow-sm transition-all duration-300 ${activeStep === 2 ? 'border border-brand-orange/30' : 'border border-dark-blue/10 opacity-70'}`}>
              <div className="flex justify-between items-center cursor-pointer" onClick={() => setActiveStep(2)}>
                <h2 className="font-poppins font-semibold text-xl md:text-2xl">2. Entrega</h2>
                {activeStep !== 2 && formData.envio !== '' && activeStep > 2 && <span className="text-xs font-black uppercase tracking-widest text-brand-orange hover:underline">Editar</span>}
              </div>
              
              <div className={`overflow-hidden transition-all duration-500 ${activeStep === 2 ? 'max-h-[800px] mt-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                
                <div className="flex flex-col gap-3 mb-6">
                  <label className={`border p-4 flex items-center gap-3 cursor-pointer transition-colors ${formData.envio === 'convenir' ? 'border-brand-orange bg-brand-orange/5' : 'bg-white border-dark-blue/10 hover:border-dark-blue/30'}`}>
                    <input type="radio" name="envio" value="convenir" checked={formData.envio === 'convenir'} onChange={handleInputChange} className="accent-brand-orange w-4 h-4" />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold uppercase tracking-wider">Envío a convenir (Todo el país)</span>
                      <span className="text-xs text-light-blue">Abonás el envío al recibir. Coordinamos por WhatsApp.</span>
                    </div>
                  </label>
                  <label className={`border p-4 flex items-center gap-3 cursor-pointer transition-colors ${formData.envio === 'local' ? 'border-brand-orange bg-brand-orange/5' : 'bg-white border-dark-blue/10 hover:border-dark-blue/30'}`}>
                    <input type="radio" name="envio" value="local" checked={formData.envio === 'local'} onChange={handleInputChange} className="accent-brand-orange w-4 h-4" />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold uppercase tracking-wider">Envío Local (Rosario)</span>
                      <span className="text-xs text-light-blue">Cadetería privada. Costo a confirmar.</span>
                    </div>
                  </label>
                  <label className={`border p-4 flex items-center gap-3 cursor-pointer transition-colors ${formData.envio === 'retiro' ? 'border-brand-orange bg-brand-orange/5' : 'bg-white border-dark-blue/10 hover:border-dark-blue/30'}`}>
                    <input type="radio" name="envio" value="retiro" checked={formData.envio === 'retiro'} onChange={handleInputChange} className="accent-brand-orange w-4 h-4" />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold uppercase tracking-wider">Retiro por Cava</span>
                      <span className="text-xs text-green-600 font-bold">Gratis</span>
                    </div>
                  </label>
                </div>

                {formData.envio !== 'retiro' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-dark-blue/10 pt-6">
                    <input required type="text" name="direccion" placeholder="Calle y Número" value={formData.direccion} onChange={handleInputChange} className="w-full bg-white border border-dark-blue/10 p-4 text-sm outline-none focus:border-brand-orange transition-colors md:col-span-2" />
                    <input required type="text" name="ciudad" placeholder="Ciudad / Provincia" value={formData.ciudad} onChange={handleInputChange} className="w-full bg-white border border-dark-blue/10 p-4 text-sm outline-none focus:border-brand-orange transition-colors" />
                    <input required type="text" name="cp" placeholder="Código Postal" value={formData.cp} onChange={handleInputChange} className="w-full bg-white border border-dark-blue/10 p-4 text-sm outline-none focus:border-brand-orange transition-colors" />
                  </div>
                )}
                
                <button type="button" onClick={() => setActiveStep(3)} className="mt-6 bg-dark-blue text-brand-white text-[10px] font-black uppercase tracking-[0.2em] px-8 py-4 hover:bg-brand-orange transition-colors outline-none">Continuar al Pago</button>
              </div>
            </div>

            {/* PASO 3: PAGO Y CONFIRMACIÓN */}
            <div className={`bg-neutral-white p-6 md:p-8 shadow-sm transition-all duration-300 ${activeStep === 3 ? 'border border-brand-orange/30' : 'border border-dark-blue/10 opacity-70'}`}>
              <div className="flex justify-between items-center cursor-pointer" onClick={() => setActiveStep(3)}>
                <h2 className="font-poppins font-semibold text-xl md:text-2xl">3. Pago</h2>
              </div>
              
              <div className={`overflow-hidden transition-all duration-500 ${activeStep === 3 ? 'max-h-[800px] mt-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                
                <div className="flex flex-col gap-3 mb-8">
                  <label className={`border p-4 flex items-center gap-3 cursor-pointer transition-colors ${formData.pago === 'transferencia' ? 'border-brand-orange bg-brand-orange/5' : 'bg-white border-dark-blue/10 hover:border-dark-blue/30'}`}>
                    <input type="radio" name="pago" value="transferencia" checked={formData.pago === 'transferencia'} onChange={handleInputChange} className="accent-brand-orange w-4 h-4" />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold uppercase tracking-wider">Transferencia Bancaria / Efectivo</span>
                      <span className="text-xs text-brand-orange font-bold">5% de descuento extra</span>
                    </div>
                  </label>
                  <label className={`border p-4 flex items-center gap-3 cursor-pointer transition-colors ${formData.pago === 'mercadopago' ? 'border-brand-orange bg-brand-orange/5' : 'bg-white border-dark-blue/10 hover:border-dark-blue/30'}`}>
                    <input type="radio" name="pago" value="mercadopago" checked={formData.pago === 'mercadopago'} onChange={handleInputChange} className="accent-brand-orange w-4 h-4" />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold uppercase tracking-wider">Mercado Pago / Tarjetas</span>
                      <span className="text-xs text-light-blue">Te enviaremos el link de pago por WhatsApp</span>
                    </div>
                  </label>
                </div>

                <div className="bg-[#F0EBE1] p-6 mb-6 flex flex-col items-center text-center gap-2">
                  <LockIcon className="w-6 h-6 text-light-blue" />
                  <p className="text-xs text-light-blue uppercase tracking-widest font-bold">Checkout Seguro</p>
                  <p className="text-[10px] text-dark-blue/70">Al confirmar, serás redirigido a WhatsApp para enviar tu pedido a nuestro sommelier y coordinar los detalles.</p>
                </div>

                <button type="submit" className="w-full bg-brand-orange text-brand-white text-[12px] font-black uppercase tracking-[0.2em] px-8 py-5 hover:bg-dark-orange hover:shadow-lg hover:-translate-y-1 transition-all flex items-center justify-center gap-2 outline-none">
                  Confirmar Pedido <span className="text-xs opacity-70">(WhatsApp)</span>
                </button>
              </div>
            </div>

          </form>
        </div>

        {/* ==========================================
            COLUMNA DERECHA: RESUMEN STICKY (Solo Desktop)
            ========================================== */}
        <div className="hidden md:block bg-neutral-white border-l border-dark-blue/10">
          <div className="sticky top-0 h-screen flex flex-col">
            <div className="p-8 border-b border-dark-blue/10 shrink-0">
              <h3 className="font-poppins font-semibold text-2xl">Resumen <span className="text-lg text-light-blue font-normal">({cart.length})</span></h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="flex flex-col gap-8">
                {cart.map((item) => (
                  <div key={item.id} className="grid grid-cols-[60px_1fr_auto_auto] gap-x-4 gap-y-1 items-start border-b border-dark-blue/5 pb-6">
                    
                    <div className="row-span-2 w-full aspect-[1/1.5] bg-[#F0EBE1] flex items-center justify-center p-1 rounded-sm">
                      <img src={item.imageUrl} alt={item.nombre} className="h-[95%] w-auto object-contain mix-blend-multiply" />
                    </div>

                    <h4 className="col-start-2 font-playfair font-bold text-md text-dark-blue leading-tight self-center">
                      {item.nombre}
                    </h4>

                    <div className="col-start-3 text-lg text-dark-blue/60 font-normal self-center text-right whitespace-nowrap">
                      {item.cantidad > 1 ? `${item.cantidad} x ` : ''}${item.precioFinal.toLocaleString()}
                    </div>

                    <div className="col-start-4 font-poppins text-lg font-semibold text-dark-blue self-center text-right">
                      ${(item.precioFinal * item.cantidad).toLocaleString()}
                    </div>

                    <p className="col-start-2 font-poppins text-[9px] uppercase tracking-[0.2em] text-light-blue self-start pt-1">
                      {item.varietal}
                    </p>

                    <div className="col-start-3"></div>

                    <div className="col-start-4 flex items-center justify-end gap-3 self-start pt-1">
                      <div className="flex items-center border border-dark-blue/20 rounded-sm">
                        <button onClick={() => updateQuantity(item.id, item.cantidad - 1)} className="px-2 py-0.5 text-dark-blue hover:text-brand-orange outline-none">-</button>
                        <span className="font-poppins text-[10px] font-black w-4 text-center">{item.cantidad}</span>
                        <button onClick={() => updateQuantity(item.id, item.cantidad + 1)} className="px-2 py-0.5 text-dark-blue hover:text-brand-orange outline-none">+</button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-light-blue hover:text-red-500 transition-colors p-1 outline-none" title="Eliminar">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 bg-[#F0EBE1] border-t border-dark-blue/10 shrink-0">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-dark-blue/70">Subtotal</span>
                <span className="font-poppins text-sm font-bold text-dark-blue">${totalPrecio.toLocaleString()}</span>
              </div>
              
              {/* FILA DE DESCUENTO DINÁMICA */}
              {descuentoMonto > 0 && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-brand-orange">Descuento (5%)</span>
                  <span className="font-poppins text-sm font-bold text-brand-orange">- ${descuentoMonto.toLocaleString()}</span>
                </div>
              )}

              {/* FILA DE ENVÍO DINÁMICA */}
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-dark-blue/10">
                <span className="text-sm text-dark-blue/70">Envío</span>
                <span className={`text-xs font-bold uppercase tracking-wider ${textoEnvio === 'Gratis' ? 'text-green-600' : 'text-brand-orange'}`}>
                  {textoEnvio}
                </span>
              </div>
              
              {/* TOTAL FINAL DINÁMICO */}
              <div className="flex justify-between items-end">
                <span className="font-playfair italic text-xl">Total</span>
                <span className="font-poppins text-2xl font-black text-dark-blue">${totalFinal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}