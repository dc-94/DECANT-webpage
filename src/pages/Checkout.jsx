import { useState, useEffect, useMemo } from 'react';
import SEO from '../components/public/SEO';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

// 👉 Importamos el motor VIP
import { useSocio } from '../context/SocioContext';

// Íconos
const ChevronIcon = ({ className, isOpen }) => (<svg className={`${className} transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>);
const ArrowLeftIcon = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>);
const ShieldIcon = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>);

export default function Checkout() {
  // 👉 Traemos la función para eliminar del carrito (verifica si en tu context se llama removeFromCart o eliminarItem)
  const { cart, totalPrecio, clearCart, removeFromCart } = useCart();
  
  const { socio, loginSocio, validando } = useSocio(); 
  const navigate = useNavigate();

  const [activeStep, setActiveStep] = useState(1);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '', apellido: '', email: '', telefono: '',
    envio: 'retiro', direccion: '', ciudad: '', cp: '',
    pago: 'transferencia'
  });
  
  const [inputSocio, setInputSocio] = useState('');
  const [mensajeSocio, setMensajeSocio] = useState({ tipo: '', texto: '' });

  const [direccionEmpresa, setDireccionEmpresa] = useState('Nuestra Cava');

  useEffect(() => {
    const inicializarDatos = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'ajustes_storefront', 'home'));
        if (docSnap.exists() && docSnap.data().datosEmpresa?.direccion) {
          setDireccionEmpresa(docSnap.data().datosEmpresa.direccion);
        }
      } catch(e) { console.error(e); }

      if (socio && socio.email) {
        try {
          const docSnap = await getDoc(doc(db, 'clientes', socio.email));
          if (docSnap.exists()) {
            const data = docSnap.data();
            setFormData(prev => ({
              ...prev,
              nombre: data.nombre || prev.nombre,
              apellido: data.apellido || prev.apellido,
              email: data.email || socio.email,
              telefono: data.telefono || prev.telefono,
              direccion: data.direccionDefault || prev.direccion,
              ciudad: data.ciudad || prev.ciudad,
              cp: data.cp || prev.cp
            }));
            if (activeStep === 1) setActiveStep(2); 
          }
        } catch (e) { console.error("Error obteniendo datos del socio", e); }
      } 
      else {
        const savedData = localStorage.getItem('decant_customer_data');
        if (savedData) {
          const parsed = JSON.parse(savedData);
          setFormData(prev => ({ 
            ...prev, 
            nombre: parsed.nombre || '', 
            apellido: parsed.apellido || '', 
            email: parsed.email || '', 
            telefono: parsed.telefono || '' 
          }));
        }
      }
    };

    inicializarDatos();
  }, [socio]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === 'email') {
      setMensajeSocio({ tipo: '', texto: '' });
    }
  };

  const handleValidarSocioCheckout = async () => {
    if (!formData.email) {
      setMensajeSocio({ tipo: 'error', texto: 'Completá tu email en el Paso 1 primero.' });
      return;
    }
    if (!inputSocio) return;
    
    setMensajeSocio({ tipo: '', texto: '' });
    
    const resultado = await loginSocio(formData.email, inputSocio);
    
    if (!resultado.success) {
      setMensajeSocio({ tipo: 'error', texto: resultado.error });
    } else {
      setMensajeSocio({ tipo: 'success', texto: '¡Bienvenido! Beneficios aplicados a tu carrito.' });
    }
  };

  const effectiveCart = useMemo(() => {
    return cart.map(item => {
      const precioBase = item.precioBase || item.precioFinal;
      let precioEfectivo = item.precioFinal;
      let descuentoVIPAplicado = item.descuentoNombre?.includes('Socio') || false;

      if (socio && !descuentoVIPAplicado) {
        const precioTeoricoSocio = Math.round(precioBase * (1 - socio.porcentaje));
        if (precioTeoricoSocio < item.precioFinal) {
          precioEfectivo = precioTeoricoSocio;
          descuentoVIPAplicado = true;
        }
      }

      return {
        ...item,
        precioEfectivo,
        descuentoVIPAplicado
      };
    });
  }, [cart, socio]);

  const ahorroSocio = useMemo(() => {
    return effectiveCart.reduce((acc, item) => {
      if (item.descuentoVIPAplicado && (item.precioBase > item.precioEfectivo)) {
        return acc + ((item.precioBase - item.precioEfectivo) * item.cantidad);
      }
      return acc;
    }, 0);
  }, [effectiveCart]);

  const subtotal = effectiveCart.reduce((acc, item) => acc + (item.precioEfectivo * item.cantidad), 0);
  const descuentoMontoTransferencia = formData.pago === 'transferencia' ? subtotal * 0.05 : 0;
  const totalFinal = subtotal - descuentoMontoTransferencia;
  const textoEnvio = formData.envio === 'retiro' ? 'Gratis' : 'A convenir';

  const handleCheckout = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const cartReducido = effectiveCart.map(item => ({ 
        id: item.id, 
        cantidad: item.cantidad,
        precioFinal: item.precioEfectivo 
      }));

      const pinSeguro = socio ? socio.pin : '';

      const response = await fetch('https://us-central1-web-decant.cloudfunctions.net/procesarCheckoutTienda', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData,
          cart: cartReducido,
          pago: formData.pago,
          envio: formData.envio,
          inputSocio: pinSeguro 
        })
      });

      const result = await response.json();

      // 👉 MAGIA DE UX: INTERCEPTAMOS EL ERROR DE STOCK AQUÍ
      if (!response.ok || !result.success) {
        if (result.itemAgotadoId) {
          // 1. Mostramos el motivo real ("Alguien se llevó la última unidad de...")
          alert(result.error); 
          
          // 2. Al cerrar el alert, removemos el producto fantasma
          if (removeFromCart) {
            removeFromCart(result.itemAgotadoId); 
          }
          
          // 3. Detenemos el spinner de carga para que pueda seguir comprando lo demás
          setIsProcessing(false);
          return;
        }
        
        throw new Error(result.error || "Error desconocido en el servidor");
      }

      const emailLower = formData.email.toLowerCase().trim();
      
      if (!socio) {
        localStorage.setItem('decant_customer_data', JSON.stringify({
            nombre: formData.nombre, apellido: formData.apellido, email: emailLower, telefono: formData.telefono
        }));
      }
      
      localStorage.setItem('decant_last_order', JSON.stringify({
          id: result.pedidoId,
          ordenDisplay: result.ordenDisplay,
          formData: formData,
          totalFinal: result.totalFinalReal, 
          clienteEmail: emailLower
      }));

      clearCart();
      navigate('/gracias');

    } catch (error) {
      console.error("Error en el Checkout Seguro:", error);
      alert(error.message || "Hubo un problema al procesar tu pedido. Por favor, intenta nuevamente.");
      setIsProcessing(false);
    }
  };

  // 👉 ESTADO VACÍO ELEGANTE CON BOTÓN DE REDIRECCIÓN
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#F7F5F0] flex flex-col items-center justify-center font-poppins text-dark-blue p-6 text-center">
        <SEO title="Carrito Vacío" description="Tu carrito de compras está vacío." />
        <h2 className="font-playfair italic text-3xl md:text-4xl text-dark-blue mb-4">Tu carrito está vacío</h2>
        <p className="text-sm opacity-70 max-w-md mb-10 leading-relaxed">
           ¡Descubre nuestra selección y encuentra tu próximo vino favorito!
        </p>
        <button 
          onClick={() => navigate('/shop')} 
          className="bg-brand-orange text-white text-[10px] font-black uppercase tracking-[0.2em] px-10 py-5 hover:bg-dark-blue transition-all shadow-[0_10px_30px_rgba(217,119,87,0.2)] outline-none"
        >
          Ver Catálogo
        </button>
      </div>
    );
  }

  const inputClases = "w-full bg-white border border-dark-blue/10 px-4 py-4 text-sm outline-none focus:border-brand-orange text-dark-blue placeholder-dark-blue/40 transition-all focus:shadow-sm";
  const inputReadonlyClases = "w-full bg-slate-50 border border-dark-blue/5 px-4 py-4 text-sm text-dark-blue/60 cursor-not-allowed select-none outline-none";

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-dark-blue font-poppins selection:bg-brand-orange selection:text-white flex flex-col">
      <SEO title="Finalizar Compra" description="Completa tu compra de forma segura en Decant." />
      
      <div className="md:hidden bg-white border-b border-dark-blue/10 shrink-0 relative z-10">
        <button onClick={() => setMobileSummaryOpen(!mobileSummaryOpen)} className="w-full flex items-center justify-between p-6 text-sm font-black uppercase tracking-widest text-dark-blue outline-none">
          <span className="flex items-center gap-2">🛒 Resumen <ChevronIcon className="w-4 h-4" isOpen={mobileSummaryOpen} /></span>
          <span className="text-brand-orange font-bold">${totalFinal.toLocaleString()}</span>
        </button>
        <div className={`overflow-hidden transition-all duration-300 ${mobileSummaryOpen ? 'max-h-[500px] border-t border-dark-blue/5 bg-[#F0EBE1]' : 'max-h-0'}`}>
          <div className="p-6 flex flex-col gap-4">
             {effectiveCart.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <span className="font-playfair text-sm font-bold text-dark-blue">{item.cantidad}x {item.nombre}</span>
                  <div className="flex items-center gap-2">
                    {item.precioBase > item.precioEfectivo && <span className="text-[10px] line-through text-dark-blue/40 italic">${(item.precioBase * item.cantidad).toLocaleString()}</span>}
                    <span className="font-semibold text-dark-blue">${(item.precioEfectivo * item.cantidad).toLocaleString()}</span>
                  </div>
                </div>
             ))}
             <div className="flex justify-between items-center pt-4 border-t border-dark-blue/10">
                <span className="text-[10px] uppercase tracking-widest text-dark-blue/60">Envío</span>
                <span className="text-xs font-bold text-brand-orange">{textoEnvio}</span>
             </div>
             {ahorroSocio > 0 && (
                <div className="mt-2 text-center text-[9px] font-black uppercase tracking-widest text-brand-orange bg-brand-orange/10 py-2 rounded">
                  Socio VIP: Ahorraste ${ahorroSocio.toLocaleString()}
                </div>
             )}
          </div>
        </div>
      </div>

      <div className="max-w-[85rem] w-full mx-auto grid grid-cols-1 md:grid-cols-[1.3fr_1fr] flex-1">
        <div className="p-6 md:p-12 lg:p-16 flex flex-col">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-dark-blue/50 hover:text-brand-orange transition-colors w-max mb-10 outline-none group">
            <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Volver
          </button>
          
          <form onSubmit={handleCheckout} className="flex flex-col gap-8">
            <div className={`bg-white p-6 md:p-10 transition-all duration-500 rounded-sm shadow-sm ${activeStep === 1 ? 'border border-brand-orange/40 shadow-[0_4px_20px_rgba(0,0,0,0.03)]' : 'border border-dark-blue/10 opacity-70'}`}>
              <div className="flex justify-between items-center cursor-pointer" onClick={() => !socio && setActiveStep(1)}>
                <h2 className="font-playfair italic text-2xl md:text-3xl text-dark-blue">1. Datos Personales</h2>
                {activeStep !== 1 && !socio && <span className="text-[10px] font-black uppercase tracking-widest text-brand-orange hover:underline">Editar</span>}
                {socio && <span className="text-[9px] font-black uppercase tracking-widest text-green-500 bg-green-50 px-2 py-1 rounded border border-green-200">Verificado</span>}
              </div>
              <div className={`overflow-hidden transition-all duration-500 ${activeStep === 1 ? 'max-h-[800px] mt-8 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <input required type="text" name="nombre" placeholder="Nombre *" value={formData.nombre} onChange={handleInputChange} readOnly={!!socio} className={socio ? inputReadonlyClases : inputClases} />
                  <input required type="text" name="apellido" placeholder="Apellido *" value={formData.apellido} onChange={handleInputChange} readOnly={!!socio} className={socio ? inputReadonlyClases : inputClases} />
                  <input required type="email" name="email" placeholder="Correo Electrónico *" value={formData.email} onChange={handleInputChange} readOnly={!!socio} className={`${socio ? inputReadonlyClases : inputClases} md:col-span-2`} />
                  <input required type="tel" name="telefono" placeholder="WhatsApp (Ej: 341 555 5555) *" value={formData.telefono} onChange={handleInputChange} readOnly={!!socio} className={`${socio ? inputReadonlyClases : inputClases} md:col-span-2`} />
                </div>
                <button type="button" onClick={() => setActiveStep(2)} className="mt-8 bg-dark-blue text-white text-[10px] font-black uppercase tracking-[0.2em] px-10 py-5 hover:bg-brand-orange transition-all shadow-md outline-none">Continuar a Entrega</button>
              </div>
            </div>

            <div className={`bg-white p-6 md:p-10 transition-all duration-500 rounded-sm shadow-sm ${activeStep === 2 ? 'border border-brand-orange/40 shadow-[0_4px_20px_rgba(0,0,0,0.03)]' : 'border border-dark-blue/10 opacity-70'}`}>
              <div className="flex justify-between items-center cursor-pointer" onClick={() => setActiveStep(2)}>
                <h2 className="font-playfair italic text-2xl md:text-3xl text-dark-blue">2. Modalidad de Entrega</h2>
                {activeStep > 2 && <span className="text-[10px] font-black uppercase tracking-widest text-brand-orange hover:underline">Editar</span>}
              </div>
              <div className={`overflow-hidden transition-all duration-500 ${activeStep === 2 ? 'max-h-[800px] mt-8 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="flex flex-col gap-4">
                  <label className={`border p-6 flex items-center gap-4 cursor-pointer transition-all rounded-sm ${formData.envio === 'retiro' ? 'border-brand-orange bg-[#F0EBE1]/50' : 'border-dark-blue/10 hover:border-brand-orange/50'}`}>
                    <input type="radio" name="envio" value="retiro" checked={formData.envio === 'retiro'} onChange={handleInputChange} className="accent-brand-orange w-5 h-5" />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold uppercase tracking-wider text-dark-blue">Retiro por Cava</span>
                      <span className="text-[10px] text-dark-blue/50 uppercase tracking-widest mt-1">{direccionEmpresa}</span>
                    </div>
                    <span className="ml-auto text-xs text-brand-orange font-bold">Gratis</span>
                  </label>
                  <label className={`border p-6 flex items-center gap-4 cursor-pointer transition-all rounded-sm ${formData.envio === 'convenir' ? 'border-brand-orange bg-[#F0EBE1]/50' : 'border-dark-blue/10 hover:border-brand-orange/50'}`}>
                    <input type="radio" name="envio" value="convenir" checked={formData.envio === 'convenir'} onChange={handleInputChange} className="accent-brand-orange w-5 h-5" />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold uppercase tracking-wider text-dark-blue">Envío a Domicilio</span>
                      <span className="text-[10px] text-dark-blue/50 uppercase tracking-widest mt-1">Rosario y resto del país</span>
                    </div>
                    <span className="ml-auto text-xs text-brand-orange font-bold text-right">A convenir</span>
                  </label>
                </div>
                {formData.envio === 'convenir' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mt-8 pt-8 border-t border-dark-blue/10 animate-in fade-in slide-in-from-top-2">
                    <input required type="text" name="direccion" placeholder="Calle, Número y Piso *" value={formData.direccion} onChange={handleInputChange} className={`${inputClases} md:col-span-2`} />
                    <input required type="text" name="ciudad" placeholder="Ciudad / Provincia *" value={formData.ciudad} onChange={handleInputChange} className={inputClases} />
                    <input required type="text" name="cp" placeholder="Código Postal *" value={formData.cp} onChange={handleInputChange} className={inputClases} />
                  </div>
                )}
                <button type="button" onClick={() => setActiveStep(3)} className="mt-8 bg-dark-blue text-white text-[10px] font-black uppercase tracking-[0.2em] px-10 py-5 hover:bg-brand-orange transition-all shadow-md outline-none">Continuar al Pago</button>
              </div>
            </div>

            <div className={`bg-white p-6 md:p-10 transition-all duration-500 rounded-sm shadow-sm ${activeStep === 3 ? 'border border-brand-orange/40 shadow-[0_4px_20px_rgba(0,0,0,0.03)]' : 'border border-dark-blue/10 opacity-70'}`}>
               <div className="flex justify-between items-center cursor-pointer" onClick={() => setActiveStep(3)}>
                <h2 className="font-playfair italic text-2xl md:text-3xl text-dark-blue">3. Confirmar y Pagar</h2>
              </div>
              <div className={`overflow-hidden transition-all duration-500 ${activeStep === 3 ? 'max-h-[800px] mt-8 opacity-100' : 'max-h-0 opacity-0'}`}>
                
                {!socio ? (
                  <div className="bg-[#F0EBE1]/50 border border-dark-blue/10 p-6 rounded-sm mb-8">
                    <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 text-dark-blue">
                      <ShieldIcon className="w-4 h-4 text-brand-orange" /> Miembro del Club VIP
                    </h3>
                    <div className="flex gap-2">
                      <input type="password" placeholder="Ingresa tu PIN de Socio" value={inputSocio} onChange={(e) => setInputSocio(e.target.value)} className="flex-1 border border-dark-blue/10 p-3 text-sm font-bold tracking-widest outline-none focus:border-brand-orange" />
                      <button type="button" onClick={handleValidarSocioCheckout} disabled={validando} className="bg-dark-blue text-white px-6 text-[10px] font-black uppercase tracking-widest hover:bg-brand-orange transition-colors disabled:opacity-50">
                        {validando ? '...' : 'Aplicar'}
                      </button>
                    </div>
                    {mensajeSocio.texto && <p className={`text-[10px] font-bold mt-3 uppercase tracking-wider ${mensajeSocio.tipo === 'error' ? 'text-red-500' : 'text-green-600'}`}>{mensajeSocio.texto}</p>}
                  </div>
                ) : (
                  <div className="bg-brand-orange/5 border border-brand-orange/20 p-6 rounded-sm mb-8 flex items-center gap-4">
                    <ShieldIcon className="w-8 h-8 text-brand-orange" />
                    <div>
                      <h3 className="text-[11px] font-black uppercase tracking-widest text-brand-orange mb-1">Beneficios VIP Activados</h3>
                      <p className="text-[9px] uppercase tracking-widest text-dark-blue/60 font-bold">Tus descuentos ya están aplicados en el resumen.</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-4 mb-8">
                  <label className={`border p-6 flex items-center gap-4 cursor-pointer transition-all rounded-sm ${formData.pago === 'transferencia' ? 'border-brand-orange bg-[#F0EBE1]/50' : 'border-dark-blue/10 hover:border-brand-orange/50'}`}>
                    <input type="radio" name="pago" value="transferencia" checked={formData.pago === 'transferencia'} onChange={handleInputChange} className="accent-brand-orange w-5 h-5" />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold uppercase tracking-wider text-dark-blue">Transferencia o Efectivo</span>
                      <span className="text-[10px] text-brand-orange uppercase tracking-widest font-bold mt-1">5% de descuento extra</span>
                    </div>
                  </label>
                  <label className={`border p-6 flex items-center gap-4 cursor-pointer transition-all rounded-sm ${formData.pago === 'mercadopago' ? 'border-brand-orange bg-[#F0EBE1]/50' : 'border-dark-blue/10 hover:border-brand-orange/50'}`}>
                    <input type="radio" name="pago" value="mercadopago" checked={formData.pago === 'mercadopago'} onChange={handleInputChange} className="accent-brand-orange w-5 h-5" />
                    <span className="text-sm font-bold uppercase tracking-wider text-dark-blue">Tarjetas (MercadoPago)</span>
                  </label>
                </div>
                <button disabled={isProcessing} type="submit" className="w-full bg-brand-orange text-white text-[12px] font-black uppercase tracking-[0.2em] px-8 py-6 hover:bg-dark-blue transition-all shadow-[0_10px_30px_rgba(217,119,87,0.2)] flex items-center justify-center gap-3 outline-none disabled:opacity-50">
                  {isProcessing ? 'Procesando...' : 'Confirmar Compra'} <span className="text-xl leading-none font-light">→</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* PANEL DERECHO: RESUMEN DESKTOP */}
        <div className="hidden md:block bg-white border-l border-dark-blue/10 shadow-[-10px_0_30px_rgba(0,0,0,0.02)] z-10">
          <div className="sticky top-0 h-screen flex flex-col">
            <div className="p-10 border-b border-dark-blue/5 shrink-0">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-orange block mb-2">Resumen</span>
              <h3 className="font-playfair italic text-4xl text-dark-blue">Tu Compra</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
              <div className="flex flex-col gap-8">
                {effectiveCart.map((item) => (
                   <div key={item.id} className="grid grid-cols-[80px_1fr_auto] gap-x-6 items-center border-b border-dark-blue/5 pb-8">
                    <div className="w-full aspect-[1/1.2] bg-[#F7F5F0] flex items-center justify-center p-2 rounded-sm border border-dark-blue/5 mix-blend-multiply">
                      <img src={item.imageUrl} alt={item.nombre} className="h-full w-auto object-contain mix-blend-multiply" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <h4 className="font-playfair font-bold text-lg text-dark-blue leading-tight">{item.nombre}</h4>
                      <span className="text-[10px] uppercase tracking-widest text-light-blue font-bold">Cantidad: {item.cantidad}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      {item.precioBase > item.precioEfectivo && (
                        <span className="text-[11px] line-through text-dark-blue/40 italic">${(item.precioBase * item.cantidad).toLocaleString()}</span>
                      )}
                      <span className="font-poppins text-lg font-semibold text-dark-blue">${(item.precioEfectivo * item.cantidad).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-8 border-t border-dark-blue/10 flex flex-col gap-4 relative">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-dark-blue/60 uppercase tracking-widest font-bold">Subtotal</span>
                  <span className="text-dark-blue font-semibold">${subtotal.toLocaleString()}</span>
                </div>
                
                {ahorroSocio > 0 && (
                  <div className="bg-brand-orange/10 border border-brand-orange/20 p-3 rounded text-center my-2 animate-in fade-in zoom-in duration-300">
                    <span className="text-[9px] font-black uppercase tracking-widest text-brand-orange">
                      POR SER MIEMBRO {socio.badge.toUpperCase()} AHORRASTE ${ahorroSocio.toLocaleString()}
                    </span>
                  </div>
                )}

                {descuentoMontoTransferencia > 0 && (
                  <div className="flex justify-between items-center text-sm text-brand-orange">
                    <span className="uppercase tracking-widest font-bold">Desc. Transferencia</span>
                    <span className="font-bold">- ${descuentoMontoTransferencia.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-dark-blue/60 uppercase tracking-widest font-bold">Envío ({formData.envio})</span>
                  <span className="text-brand-orange font-bold">{textoEnvio}</span>
                </div>
                <div className="flex justify-between items-end mt-4 pt-4 border-t border-dark-blue/10">
                  <span className="text-xs text-dark-blue/80 uppercase tracking-widest font-bold">Total a Pagar</span>
                  <span className="text-4xl font-playfair font-black italic text-dark-blue">${totalFinal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}