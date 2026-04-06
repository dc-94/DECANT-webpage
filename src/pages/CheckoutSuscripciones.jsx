import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

// Íconos (Mismos que ya usas)
const TrashIcon = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>);
const ChevronIcon = ({ className, isOpen }) => (<svg className={`${className} transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>);
const LockIcon = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>);
const ArrowLeftIcon = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>);

export default function CheckoutSuscripcion() {
  const { cart, removeFromCart, updateQuantity } = useCart();
  const navigate = useNavigate();

  // FILTRAMOS SOLO LOS PRODUCTOS DE SUSCRIPCIÓN
  const cartSuscripcion = cart.filter(item => item.label?.toLowerCase() === 'suscripción');
  
  // Recalculamos totales solo para la suscripción
  const subtotalSuscripcion = cartSuscripcion.reduce((acc, item) => acc + (item.precioFinal * item.cantidad), 0);

  const [activeStep, setActiveStep] = useState(1);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '', apellido: '', email: '', telefono: '',
    envio: 'convenir', direccion: '', ciudad: '', cp: '',
    pago: 'mercadopago' // Asumimos que las suscripciones suelen ser con tarjeta
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const descuentoMonto = formData.pago === 'transferencia' ? subtotalSuscripcion * 0.05 : 0;
  const totalFinal = subtotalSuscripcion - descuentoMonto;
  const textoEnvio = formData.envio === 'retiro' || formData.envio === 'local' ? 'Gratis' : 'A convenir';

  const handleCheckout = (e) => {
    e.preventDefault();
    
    const pedidoConfirmado = { 
      cart: cartSuscripcion, 
      subtotal: subtotalSuscripcion,
      descuento: descuentoMonto,
      totalFinal: totalFinal,
      formData 
    };
    // Guardamos con un nombre distinto para no pisar pedidos normales
    localStorage.setItem('decant_sub_order', JSON.stringify(pedidoConfirmado));
    
    // Aquí idealmente borrarías solo los items de suscripción del carrito global,
    // pero para empezar podemos redirigir directamente.
    navigate('/gracias-suscripciones'); 
  };

  if (cartSuscripcion.length === 0) {
    return (
      <div className="min-h-screen bg-dark-blue flex flex-col items-center justify-center p-6">
        <h2 className="font-playfair italic text-3xl text-brand-orange mb-6">No hay suscripciones en tu copa</h2>
        <button onClick={() => navigate('/shop')} className="font-poppins text-xs font-black uppercase tracking-[0.2em] text-dark-blue bg-[#F7F5F0] px-8 py-4 hover:bg-brand-orange hover:text-white transition-colors">Volver a la tienda</button>
      </div>
    );
  }

  // DISEÑO VIP
  return (
    <div className="min-h-screen bg-dark-blue text-[#F7F5F0] font-poppins selection:bg-brand-orange selection:text-white flex flex-col">
      
      {/* RESUMEN MÓVIL (Oscuro) */}
      <div className="md:hidden bg-dark-blue border-b border-brand-orange/30 shrink-0">
        <button onClick={() => setMobileSummaryOpen(!mobileSummaryOpen)} className="w-full flex items-center justify-between p-6 text-sm font-black uppercase tracking-widest text-brand-orange outline-none">
          <span className="flex items-center gap-2">🍷 Club VIP <ChevronIcon className="w-4 h-4" isOpen={mobileSummaryOpen} /></span>
          <span className="text-white font-bold">${totalFinal.toLocaleString()}</span>
        </button>
        {/* ... (Contenido del acordeón móvil igual pero adaptando clases de texto a claras) ... */}
      </div>

      <div className="max-w-[85rem] w-full mx-auto grid grid-cols-1 md:grid-cols-[1.2fr_1fr] flex-1">
        
        {/* FORMULARIO */}
        <div className="p-6 md:p-12 lg:p-16 flex flex-col">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#F7F5F0]/50 hover:text-brand-orange transition-colors w-max mb-10 outline-none group">
            <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Volver
          </button>
          
          <form onSubmit={handleCheckout} className="flex flex-col gap-6">
            
            {/* PASO 1 */}
            <div className={`bg-dark-blue/50 p-6 md:p-8 transition-all duration-300 ${activeStep === 1 ? 'border border-brand-orange shadow-[0_0_15px_rgba(217,119,87,0.1)]' : 'border border-[#F7F5F0]/10 opacity-70'}`}>
              <div className="flex justify-between items-center cursor-pointer" onClick={() => setActiveStep(1)}>
                <h2 className="font-poppins font-semibold text-xl md:text-2xl text-brand-orange">1. Tus Datos</h2>
                {activeStep !== 1 && <span className="text-xs font-black uppercase tracking-widest text-[#F7F5F0] hover:underline">Editar</span>}
              </div>
              <div className={`overflow-hidden transition-all duration-500 ${activeStep === 1 ? 'max-h-[500px] mt-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Inputs VIP: transparentes con borde sutil */}
                  <input required type="text" name="nombre" placeholder="Nombre" value={formData.nombre} onChange={handleInputChange} className="w-full bg-transparent border border-[#F7F5F0]/20 p-4 text-sm outline-none focus:border-brand-orange text-white placeholder-white/40 transition-colors" />
                  <input required type="text" name="apellido" placeholder="Apellido" value={formData.apellido} onChange={handleInputChange} className="w-full bg-transparent border border-[#F7F5F0]/20 p-4 text-sm outline-none focus:border-brand-orange text-white placeholder-white/40 transition-colors" />
                  <input required type="email" name="email" placeholder="Correo Electrónico" value={formData.email} onChange={handleInputChange} className="w-full bg-transparent border border-[#F7F5F0]/20 p-4 text-sm outline-none focus:border-brand-orange text-white placeholder-white/40 transition-colors md:col-span-2" />
                  <input required type="tel" name="telefono" placeholder="WhatsApp (Ej: 341 555 5555)" value={formData.telefono} onChange={handleInputChange} className="w-full bg-transparent border border-[#F7F5F0]/20 p-4 text-sm outline-none focus:border-brand-orange text-white placeholder-white/40 transition-colors md:col-span-2" />
                </div>
                <button type="button" onClick={() => setActiveStep(2)} className="mt-6 bg-[#F7F5F0] text-dark-blue text-[10px] font-black uppercase tracking-[0.2em] px-8 py-4 hover:bg-brand-orange hover:text-white transition-colors outline-none">Continuar al Envío</button>
              </div>
            </div>

           {/* PASO 2 */}
            <div className={`bg-dark-blue/50 p-6 md:p-8 transition-all duration-300 ${activeStep === 2 ? 'border border-brand-orange shadow-[0_0_15px_rgba(217,119,87,0.1)]' : 'border border-[#F7F5F0]/10 opacity-70'}`}>
              <div className="flex justify-between items-center cursor-pointer" onClick={() => setActiveStep(2)}>
                <h2 className="font-poppins font-semibold text-xl md:text-2xl text-brand-orange">2. Entrega</h2>
              </div>
              <div className={`overflow-hidden transition-all duration-500 ${activeStep === 2 ? 'max-h-[800px] mt-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                
                <div className="flex flex-col gap-3 mb-6">
                  {/* OPCIÓN 1: A CONVENIR */}
                  <label className={`border p-4 flex items-center gap-3 cursor-pointer transition-colors ${formData.envio === 'convenir' ? 'border-brand-orange bg-brand-orange/10' : 'bg-transparent border-[#F7F5F0]/20 hover:border-brand-orange/50'}`}>
                    <input type="radio" name="envio" value="convenir" checked={formData.envio === 'convenir'} onChange={handleInputChange} className="accent-brand-orange w-4 h-4" />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold uppercase tracking-wider text-white">Envío a convenir (Todo el país)</span>
                      <span className="text-xs text-brand-orange font-bold">Abonás al recibir</span>
                    </div>
                  </label>
                  
                  {/* OPCIÓN 2: LOCAL */}
                  <label className={`border p-4 flex items-center gap-3 cursor-pointer transition-colors ${formData.envio === 'local' ? 'border-brand-orange bg-brand-orange/10' : 'bg-transparent border-[#F7F5F0]/20 hover:border-brand-orange/50'}`}>
                    <input type="radio" name="envio" value="local" checked={formData.envio === 'local'} onChange={handleInputChange} className="accent-brand-orange w-4 h-4" />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold uppercase tracking-wider text-white">Envío Local (Rosario)</span>
                      <span className="text-xs text-brand-orange font-bold">Costo a confirmar</span>
                    </div>
                  </label>

                  {/* OPCIÓN 3: RETIRO */}
                  <label className={`border p-4 flex items-center gap-3 cursor-pointer transition-colors ${formData.envio === 'retiro' ? 'border-brand-orange bg-brand-orange/10' : 'bg-transparent border-[#F7F5F0]/20 hover:border-brand-orange/50'}`}>
                    <input type="radio" name="envio" value="retiro" checked={formData.envio === 'retiro'} onChange={handleInputChange} className="accent-brand-orange w-4 h-4" />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold uppercase tracking-wider text-white">Retiro por Cava</span>
                      <span className="text-xs text-brand-orange font-bold">Gratis</span>
                    </div>
                  </label>
                </div>

                {/* LOS INPUTS DE DIRECCIÓN APARECEN AUTOMÁTICAMENTE */}
                {formData.envio !== 'retiro' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[#F7F5F0]/10 pt-6">
                    <input required type="text" name="direccion" placeholder="Calle y Número" value={formData.direccion} onChange={handleInputChange} className="w-full bg-transparent border border-[#F7F5F0]/20 p-4 text-sm outline-none focus:border-brand-orange text-white placeholder-white/40 transition-colors md:col-span-2" />
                    <input required type="text" name="ciudad" placeholder="Ciudad / Provincia" value={formData.ciudad} onChange={handleInputChange} className="w-full bg-transparent border border-[#F7F5F0]/20 p-4 text-sm outline-none focus:border-brand-orange text-white placeholder-white/40 transition-colors" />
                    <input required type="text" name="cp" placeholder="Código Postal" value={formData.cp} onChange={handleInputChange} className="w-full bg-transparent border border-[#F7F5F0]/20 p-4 text-sm outline-none focus:border-brand-orange text-white placeholder-white/40 transition-colors" />
                  </div>
                )}
                
                <button type="button" onClick={() => setActiveStep(3)} className="mt-6 bg-[#F7F5F0] text-dark-blue text-[10px] font-black uppercase tracking-[0.2em] px-8 py-4 hover:bg-brand-orange hover:text-white transition-colors outline-none">Continuar al Pago</button>
              </div>
            </div>

            {/* PASO 3 */}
            <div className={`bg-dark-blue/50 p-6 md:p-8 transition-all duration-300 ${activeStep === 3 ? 'border border-brand-orange shadow-[0_0_15px_rgba(217,119,87,0.1)]' : 'border border-[#F7F5F0]/10 opacity-70'}`}>
               <div className="flex justify-between items-center cursor-pointer" onClick={() => setActiveStep(3)}>
                <h2 className="font-poppins font-semibold text-xl md:text-2xl text-brand-orange">3. Unirse al Club</h2>
              </div>
              <div className={`overflow-hidden transition-all duration-500 ${activeStep === 3 ? 'max-h-[800px] mt-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                {/* Mismo código de pago que tienes, cambiando colores de bordes como en el Paso 2 */}
                <button type="submit" className="w-full mt-6 bg-brand-orange text-brand-white text-[12px] font-black uppercase tracking-[0.2em] px-8 py-5 hover:bg-[#F7F5F0] hover:text-dark-blue transition-all flex items-center justify-center gap-2 outline-none">
                  Confirmar Suscripción <span className="text-xs opacity-70">(WhatsApp)</span>
                </button>
              </div>
            </div>

          </form>
        </div>

        {/* RESUMEN DERECHA (Oscuro) */}
        <div className="hidden md:block bg-dark-blue border-l border-brand-orange/20">
          <div className="sticky top-0 h-screen flex flex-col">
            <div className="p-8 border-b border-brand-orange/20 shrink-0">
              <h3 className="font-poppins font-semibold text-2xl text-brand-orange">Tu Suscripción</h3>
            </div>
            {/* Lista de carrito: Mapeamos cartSuscripcion en vez de cart */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="flex flex-col gap-8">
                {cartSuscripcion.map((item) => (
                   <div key={item.id} className="grid grid-cols-[60px_1fr_auto_auto] gap-x-4 gap-y-1 items-start border-b border-[#F7F5F0]/10 pb-6">
                    <div className="row-span-2 w-full aspect-[1/1.5] bg-[#F7F5F0] flex items-center justify-center p-1 rounded-sm">
                      <img src={item.imageUrl} alt={item.nombre} className="h-[95%] w-auto object-contain mix-blend-multiply" />
                    </div>
                    <h4 className="col-start-2 font-playfair font-bold text-md text-white leading-tight self-center">{item.nombre}</h4>
                    <div className="col-start-4 font-poppins text-lg font-semibold text-brand-orange self-center text-right">
                      ${(item.precioFinal * item.cantidad).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}