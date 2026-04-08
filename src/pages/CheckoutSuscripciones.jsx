import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

// Íconos
const ChevronIcon = ({ className, isOpen }) => (<svg className={`${className} transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>);
const ArrowLeftIcon = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>);
const ShieldIcon = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>);

export default function CheckoutSuscripcion() {
  // ACA TRAEMOS EL CARRITO Y LA FUNCIÓN PARA BORRAR
  const { cart, removeFromCart } = useCart();
  const navigate = useNavigate();

  // FILTRAMOS SOLO LOS PRODUCTOS DE SUSCRIPCIÓN
  const cartSuscripcion = cart.filter(item => item.label?.toLowerCase() === 'suscripción');
  
  // Recalculamos totales solo para la suscripción
  const subtotalSuscripcion = cartSuscripcion.reduce((acc, item) => acc + (item.precioFinal * item.cantidad), 0);

  const [activeStep, setActiveStep] = useState(1);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '', apellido: '', email: '', telefono: '',
    direccion: '', ciudad: '', cp: '',
    envio: 'rosario', // Opciones: resto, rosario, retiro
    pago: 'mercadopago' // Fijo para suscripciones según charlamos
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const textoEnvio = (formData.envio === 'rosario' || formData.envio === 'retiro') ? 'Gratis' : 'A convenir';
  const totalFinal = subtotalSuscripcion; // Sin descuento fijo porque se cobra vía recurrente MP

  const handleCheckout = (e) => {
    e.preventDefault();
    
    const pedidoConfirmado = { 
      cart: cartSuscripcion, 
      subtotal: subtotalSuscripcion,
      envio: formData.envio,
      costoEnvioStr: textoEnvio,
      totalFinal: totalFinal,
      formData 
    };
    
    localStorage.setItem('decant_sub_order', JSON.stringify(pedidoConfirmado));
    
    // 👉 MAGIA AQUÍ: Borramos del carrito global todos los items de suscripción
    cartSuscripcion.forEach(item => {
      removeFromCart(item.id);
    });

    navigate('/gracias-suscripciones'); 
  };

  if (cartSuscripcion.length === 0) {
    return (
      <div className="min-h-screen bg-extra-black flex flex-col items-center justify-center p-6">
        <h2 className="font-playfair italic text-3xl text-brand-orange mb-6">No hay membresías en tu copa</h2>
        <button onClick={() => navigate('/suscripciones')} className="font-poppins text-xs font-black uppercase tracking-[0.2em] text-extra-black bg-brand-white px-8 py-4 hover:bg-brand-orange hover:text-brand-white transition-colors outline-none">Ver Club de Vinos</button>
      </div>
    );
  }

  // Lógica de Inputs VIP
  const inputClases = "w-full bg-dark-blue/40 backdrop-blur-sm border-b border-light-blue/20 px-4 py-4 text-sm outline-none focus:border-brand-orange text-brand-white placeholder-brand-white/30 transition-all focus:bg-dark-blue/60";

  return (
    <div className="min-h-screen bg-extra-black text-brand-white font-poppins selection:bg-brand-orange selection:text-white flex flex-col relative overflow-hidden">
      
      {/* LUCES VIP DE FONDO (Orbes) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-brand-orange/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-light-blue/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

      {/* RESUMEN MÓVIL */}
      <div className="md:hidden bg-extra-black/80 backdrop-blur-md border-b border-brand-orange/20 shrink-0 relative z-10">
        <button onClick={() => setMobileSummaryOpen(!mobileSummaryOpen)} className="w-full flex items-center justify-between p-6 text-sm font-black uppercase tracking-widest text-brand-orange outline-none">
          <span className="flex items-center gap-2">🍷 Club VIP <ChevronIcon className="w-4 h-4" isOpen={mobileSummaryOpen} /></span>
          <span className="text-white font-bold">${totalFinal.toLocaleString()}</span>
        </button>
        <div className={`overflow-hidden transition-all duration-300 ${mobileSummaryOpen ? 'max-h-[500px] border-t border-light-blue/10' : 'max-h-0'}`}>
          <div className="p-6 flex flex-col gap-4">
             {cartSuscripcion.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <span className="font-playfair text-sm text-brand-white/80">{item.nombre}</span>
                  <span className="font-semibold text-brand-orange">${(item.precioFinal * item.cantidad).toLocaleString()}</span>
                </div>
             ))}
             <div className="flex justify-between items-center pt-4 border-t border-light-blue/10">
                <span className="text-[10px] uppercase tracking-widest text-brand-white/60">Envío</span>
                <span className="text-xs font-bold text-brand-orange">{textoEnvio}</span>
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-[85rem] w-full mx-auto grid grid-cols-1 md:grid-cols-[1.3fr_1fr] flex-1 relative z-10">
        
        {/* =======================================
            FORMULARIO IZQUIERDA
            ======================================= */}
        <div className="p-6 md:p-12 lg:p-16 flex flex-col">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-white/50 hover:text-brand-orange transition-colors w-max mb-10 outline-none group">
            <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Volver
          </button>
          
          <form onSubmit={handleCheckout} className="flex flex-col gap-8">
            
            {/* PASO 1: DATOS Y DIRECCIÓN */}
            <div className={`bg-dark-blue/20 backdrop-blur-sm p-6 md:p-10 transition-all duration-500 rounded-sm ${activeStep === 1 ? 'border border-brand-orange/50 shadow-[0_0_30px_rgba(217,119,87,0.1)]' : 'border border-light-blue/10 opacity-60'}`}>
              <div className="flex justify-between items-center cursor-pointer" onClick={() => setActiveStep(1)}>
                <h2 className="font-playfair italic text-2xl md:text-3xl text-brand-orange">1. Datos Personales y Domicilio</h2>
                {activeStep !== 1 && <span className="text-[10px] font-black uppercase tracking-widest text-brand-white/60 hover:text-brand-orange">Editar</span>}
              </div>
              <div className={`overflow-hidden transition-all duration-500 ${activeStep === 1 ? 'max-h-[800px] mt-8 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  
                  <div className="md:col-span-2 mb-2">
                    <span className="text-[10px] uppercase tracking-widest text-brand-orange font-bold">Datos de Contacto</span>
                  </div>
                  <input required type="text" name="nombre" placeholder="Nombre *" value={formData.nombre} onChange={handleInputChange} className={inputClases} />
                  <input required type="text" name="apellido" placeholder="Apellido *" value={formData.apellido} onChange={handleInputChange} className={inputClases} />
                  <input required type="email" name="email" placeholder="Correo Electrónico *" value={formData.email} onChange={handleInputChange} className={`${inputClases} md:col-span-2`} />
                  <input required type="tel" name="telefono" placeholder="WhatsApp (Ej: 341 555 5555) *" value={formData.telefono} onChange={handleInputChange} className={`${inputClases} md:col-span-2`} />

                  <div className="md:col-span-2 mb-2 mt-6">
                    <span className="text-[10px] uppercase tracking-widest text-brand-orange font-bold">Domicilio de Facturación / Envío</span>
                  </div>
                  <input required type="text" name="direccion" placeholder="Calle, Número y Piso *" value={formData.direccion} onChange={handleInputChange} className={`${inputClases} md:col-span-2`} />
                  <input required type="text" name="ciudad" placeholder="Ciudad / Provincia *" value={formData.ciudad} onChange={handleInputChange} className={inputClases} />
                  <input required type="text" name="cp" placeholder="Código Postal *" value={formData.cp} onChange={handleInputChange} className={inputClases} />

                </div>
                <button type="button" onClick={() => setActiveStep(2)} className="mt-10 bg-brand-white text-extra-black text-[10px] font-black uppercase tracking-[0.2em] px-10 py-5 hover:bg-brand-orange hover:text-brand-white transition-all shadow-md outline-none">Continuar a Entrega</button>
              </div>
            </div>

           {/* PASO 2: MODALIDAD DE ENTREGA */}
            <div className={`bg-dark-blue/20 backdrop-blur-sm p-6 md:p-10 transition-all duration-500 rounded-sm ${activeStep === 2 ? 'border border-brand-orange/50 shadow-[0_0_30px_rgba(217,119,87,0.1)]' : 'border border-light-blue/10 opacity-60'}`}>
              <div className="flex justify-between items-center cursor-pointer" onClick={() => setActiveStep(2)}>
                <h2 className="font-playfair italic text-2xl md:text-3xl text-brand-orange">2. Modalidad de Entrega</h2>
                {activeStep > 2 && <span className="text-[10px] font-black uppercase tracking-widest text-brand-white/60 hover:text-brand-orange">Editar</span>}
              </div>
              <div className={`overflow-hidden transition-all duration-500 ${activeStep === 2 ? 'max-h-[800px] mt-8 opacity-100' : 'max-h-0 opacity-0'}`}>
                
                <div className="flex flex-col gap-4">
                  {/* OPCIÓN 1: ROSARIO */}
                  <label className={`border p-6 flex items-center gap-4 cursor-pointer transition-all rounded-sm ${formData.envio === 'rosario' ? 'border-brand-orange bg-brand-orange/10' : 'bg-dark-blue/40 border-light-blue/20 hover:border-brand-orange/50'}`}>
                    <input type="radio" name="envio" value="rosario" checked={formData.envio === 'rosario'} onChange={handleInputChange} className="accent-brand-orange w-5 h-5" />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold uppercase tracking-wider text-brand-white">Envío en Rosario</span>
                      <span className="text-xs text-brand-orange font-bold mt-1">Gratis</span>
                    </div>
                  </label>

                  {/* OPCIÓN 2: RETIRO */}
                  <label className={`border p-6 flex items-center gap-4 cursor-pointer transition-all rounded-sm ${formData.envio === 'retiro' ? 'border-brand-orange bg-brand-orange/10' : 'bg-dark-blue/40 border-light-blue/20 hover:border-brand-orange/50'}`}>
                    <input type="radio" name="envio" value="retiro" checked={formData.envio === 'retiro'} onChange={handleInputChange} className="accent-brand-orange w-5 h-5" />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold uppercase tracking-wider text-brand-white">Retiro por Cava</span>
                      <span className="text-[10px] text-brand-white/50 uppercase tracking-widest mt-1">Acordamos horario</span>
                    </div>
                    <span className="ml-auto text-xs text-brand-orange font-bold">Gratis</span>
                  </label>

                  {/* OPCIÓN 3: RESTO DEL PAÍS */}
                  <label className={`border p-6 flex items-center gap-4 cursor-pointer transition-all rounded-sm ${formData.envio === 'resto' ? 'border-brand-orange bg-brand-orange/10' : 'bg-dark-blue/40 border-light-blue/20 hover:border-brand-orange/50'}`}>
                    <input type="radio" name="envio" value="resto" checked={formData.envio === 'resto'} onChange={handleInputChange} className="accent-brand-orange w-5 h-5" />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold uppercase tracking-wider text-brand-white">Resto del País</span>
                      <span className="text-[10px] text-brand-white/50 uppercase tracking-widest mt-1">A cargo del suscriptor</span>
                    </div>
                    <span className="ml-auto text-xs text-brand-orange font-bold text-right">A convenir</span>
                  </label>
                </div>
                
                <button type="button" onClick={() => setActiveStep(3)} className="mt-8 bg-brand-white text-extra-black text-[10px] font-black uppercase tracking-[0.2em] px-10 py-5 hover:bg-brand-orange hover:text-brand-white transition-all shadow-md outline-none">Finalizar</button>
              </div>
            </div>

            {/* PASO 3: CONFIRMACIÓN */}
            <div className={`bg-dark-blue/20 backdrop-blur-sm p-6 md:p-10 transition-all duration-500 rounded-sm ${activeStep === 3 ? 'border border-brand-orange/50 shadow-[0_0_30px_rgba(217,119,87,0.1)]' : 'border border-light-blue/10 opacity-60'}`}>
               <div className="flex justify-between items-center cursor-pointer" onClick={() => setActiveStep(3)}>
                <h2 className="font-playfair italic text-2xl md:text-3xl text-brand-orange">3. Confirmar Ingreso</h2>
              </div>
              <div className={`overflow-hidden transition-all duration-500 ${activeStep === 3 ? 'max-h-[800px] mt-8 opacity-100' : 'max-h-0 opacity-0'}`}>
                
                <div className="bg-extra-black/50 border border-light-blue/20 p-6 rounded-sm mb-8 flex gap-4 items-start">
                  <ShieldIcon className="w-6 h-6 text-brand-orange shrink-0 mt-1" />
                  <p className="text-xs text-brand-white/80 leading-relaxed font-poppins">
                    Al confirmar, te enviaremos a nuestro canal seguro de WhatsApp. Allí un Concierge de Decant te dará la bienvenida y te enviará el link de MercadoPago para habilitar tu membresía (Recuerda que los primeros 30 días de plataforma están bonificados para darte tiempo a recibir tu primera selección).
                  </p>
                </div>

                <button type="submit" className="w-full bg-brand-orange text-brand-white text-[12px] font-black uppercase tracking-[0.2em] px-8 py-6 hover:bg-brand-white hover:text-extra-black transition-all shadow-[0_10px_40px_rgba(217,119,87,0.3)] flex items-center justify-center gap-3 outline-none">
                  Unirse al Club <span className="text-xl leading-none font-light">→</span>
                </button>
              </div>
            </div>

          </form>
        </div>

        {/* =======================================
            RESUMEN DERECHA
            ======================================= */}
        <div className="hidden md:block bg-extra-black/40 backdrop-blur-md border-l border-light-blue/10">
          <div className="sticky top-0 h-screen flex flex-col">
            <div className="p-10 border-b border-light-blue/10 shrink-0">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-orange block mb-2">Resumen</span>
              <h3 className="font-playfair italic text-4xl text-brand-white">Tu Membresía</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
              <div className="flex flex-col gap-8">
                {cartSuscripcion.map((item) => (
                   <div key={item.id} className="grid grid-cols-[80px_1fr_auto] gap-x-6 items-center border-b border-light-blue/10 pb-8">
                    <div className="w-full aspect-[1/1.2] bg-brand-white/5 flex items-center justify-center p-2 rounded-sm border border-light-blue/5">
                      <img src={item.imageUrl} alt={item.nombre} className="h-full w-auto object-contain drop-shadow-lg" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <h4 className="font-playfair font-bold text-xl text-brand-white leading-tight">{item.nombre}</h4>
                      <span className="text-[10px] uppercase tracking-widest text-brand-orange font-bold">Renovación Mensual</span>
                    </div>
                    <div className="font-poppins text-xl font-semibold text-brand-white">
                      ${(item.precioFinal * item.cantidad).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* TOTALES */}
              <div className="mt-8 pt-8 border-t border-light-blue/20 flex flex-col gap-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-brand-white/60 uppercase tracking-widest">Subtotal</span>
                  <span className="text-brand-white">${subtotalSuscripcion.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-brand-white/60 uppercase tracking-widest">Envío ({formData.envio})</span>
                  <span className="text-brand-orange font-bold">{textoEnvio}</span>
                </div>
                <div className="flex justify-between items-end mt-4 pt-4 border-t border-light-blue/10">
                  <span className="text-xs text-brand-white/80 uppercase tracking-widest font-bold">Monto Mensual</span>
                  <span className="text-4xl font-playfair font-black italic text-brand-white">${totalFinal.toLocaleString()}</span>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}