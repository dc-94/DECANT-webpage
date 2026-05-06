import { useState, useEffect } from 'react';
import SEO from '../components/public/SEO';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../config/firebase'; 
import { doc, setDoc, collection, addDoc, serverTimestamp, query, where, getDocs, getDoc } from 'firebase/firestore'; 

import { useSocio } from '../context/SocioContext';

const ChevronIcon = ({ className, isOpen }) => (<svg className={`${className} transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>);
const ArrowLeftIcon = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>);
const ShieldIcon = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>);

export default function CheckoutSuscripcion() {
  const navigate = useNavigate();
  const location = useLocation();
  const { socio } = useSocio(); 
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [planVIP] = useState(() => location.state?.planElegido || null);

  const [activeStep, setActiveStep] = useState(1);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '', apellido: '', email: '', telefono: '', direccion: '', ciudad: '', cp: '', envio: 'rosario', pago: 'mercadopago' 
  });

  const [errores, setErrores] = useState({ email: '', telefono: '' });

  useEffect(() => {
    if (socio && socio.email) {
      const fetchSocioData = async () => {
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
      };
      fetchSocioData();
    }
  }, [socio, activeStep]);

  const handleInputChange = (e) => {
    let { name, value } = e.target;

    // 👉 SEGURIDAD CISO: Sanitización estricta por tipo de campo
    if (name === 'email') {
      // Bloquea inyección CRLF en cabeceras de correo
      value = value.replace(/[\r\n]+/g, '');
    } else {
      // Bloquea XSS y Server-Side Template Injection eliminando < > { } = |
      // Permite letras, números, espacios, acentos y signos de puntuación normales
      value = value.replace(/[<>{}|=]/g, '');
    }

    setFormData({ ...formData, [name]: value });
    
    if (errores[name]) {
      setErrores({ ...errores, [name]: '' });
    }
  };

  const handleBlur = async (e) => {
    const { name, value } = e.target;
    
    if (name === 'email' && value.trim() !== '') {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(value)) {
        setErrores(prev => ({ ...prev, email: 'Ingresa un formato de correo válido.' }));
        return;
      }

      if (!socio) {
        try {
          const docRef = doc(db, 'clientes', value.toLowerCase().trim());
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setErrores(prev => ({ ...prev, email: 'Este correo ya está registrado. Por favor, inicia sesión en el menú superior para suscribirte.' }));
          }
        } catch (error) {
          console.error("Error verificando email:", error);
        }
      }
    }
    
    if (name === 'telefono' && value.trim() !== '') {
      const numeros = value.replace(/\D/g, ''); 
      if (numeros.length < 10 || numeros.length > 15) {
        setErrores(prev => ({ ...prev, telefono: 'Ingresa un número válido con código de área (10-15 dígitos).' }));
      }
    }
  };

  const textoEnvio = (formData.envio === 'rosario' || formData.envio === 'retiro') ? 'Gratis' : 'A convenir';

  const generarPinUnico = async () => {
    let pin = '';
    let existe = true;
    while (existe) {
      pin = Math.floor(1000 + Math.random() * 9000).toString();
      const q = query(collection(db, 'clientes'), where('numeroCliente', '==', pin));
      const snap = await getDocs(q);
      if (snap.empty) existe = false;
    }
    return pin;
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!planVIP) return; 

    if (errores.email || errores.telefono) {
      alert("Por favor, corrige los errores en el formulario antes de continuar.");
      return;
    }

    setIsProcessing(true);

    try {
      const emailLower = formData.email.toLowerCase().trim();
      const numeroCliente = socio ? socio.pin : await generarPinUnico();
      const nombrePlan = planVIP.nombre || 'Club de Vinos';
      const badgeSocio = planVIP.subcategoria || planVIP.nombre || 'Socio VIP';
      const subtotalSuscripcion = planVIP.precioFinal; 
      
      let mpPlanId = '';
      
      if (nombrePlan.toLowerCase().includes('descorche')) {
        mpPlanId = import.meta.env.VITE_MP_PLAN_DESCORCHE; 
      } else if (nombrePlan.toLowerCase().includes('terruño') || nombrePlan.toLowerCase().includes('terruno')) {
        mpPlanId = import.meta.env.VITE_MP_PLAN_TERRUNO;
      } else {
        mpPlanId = import.meta.env.VITE_MP_PLAN_DESCORCHE; 
      }

      if (!mpPlanId) throw new Error("Error de configuración: Faltan los IDs de Mercado Pago en el sistema.");

      await setDoc(doc(db, 'clientes', emailLower), {
        nombre: formData.nombre, 
        apellido: formData.apellido, 
        email: emailLower, 
        telefono: formData.telefono,
        direccionDefault: formData.direccion,
        ciudad: formData.ciudad,
        cp: formData.cp,  
        numeroCliente: numeroCliente, 
        badge: badgeSocio, 
        createdAt: serverTimestamp()
      }, { merge: true });

      const cartSuscripcion = [planVIP]; 

      const pedidoInfo = {
        clienteEmail: emailLower, 
        numeroCliente: numeroCliente, 
        tipo: 'suscripcion', 
        plan: nombrePlan,
        cart: cartSuscripcion, 
        subtotal: subtotalSuscripcion, 
        envio: formData.envio, 
        costoEnvioStr: textoEnvio,
        totalFinal: subtotalSuscripcion, 
        formData: formData, 
        estado: 'Pendiente', 
        pagoAprobado: false, 
        createdAt: serverTimestamp()
      };

      const pedidoRef = await addDoc(collection(db, 'pedidos'), pedidoInfo);
      const numeroOrdenCorto = pedidoRef.id.slice(0, 5).toUpperCase();

      localStorage.setItem('decant_sub_order', JSON.stringify({ 
        ...pedidoInfo, id: pedidoRef.id, ordenDisplay: numeroOrdenCorto 
      }));

      try {
        await fetch('https://enviarconfirmacionpedido-jztey4742a-uc.a.run.app', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toEmail: emailLower,
            toName: `${formData.nombre} ${formData.apellido}`.trim(),
            templateId: 1, 
            params: { nombre: formData.nombre, orden: numeroOrdenCorto, plan: nombrePlan }
          })
        });
      } catch (mailError) {
        console.error("Error enviando email de recepción:", mailError);
      }

      window.location.href = `https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=${mpPlanId}`;

    } catch (error) {
      console.error("Error en checkout suscripción:", error);
      alert(error.message || "Error al procesar la orden. Intentá nuevamente.");
      setIsProcessing(false);
    }
  };

  if (!planVIP) {
    return (
      <div className="min-h-screen bg-extra-black flex flex-col items-center justify-center p-6 text-center">
        <h2 className="font-playfair italic text-3xl text-brand-orange mb-4">Aún no has elegido una membresía</h2>
        <p className="font-poppins text-brand-white/80 text-sm mb-8 max-w-md">
          Para continuar con el registro seguro, por favor selecciona el plan que mejor se adapte a tu paladar.
        </p>
        <button 
          onClick={() => navigate('/suscripciones')} 
          className="font-poppins text-[10px] font-black uppercase tracking-[0.2em] text-extra-black bg-brand-white px-10 py-5 hover:bg-brand-orange hover:text-brand-white transition-all shadow-lg outline-none"
        >
          Explorar Membresías
        </button>
      </div>
    );
  }

  let beneficiosPlan = [];
  const nombreLower = planVIP.nombre.toLowerCase();
  if (nombreLower.includes('descorche')) {
    beneficiosPlan = ["Selección curada mensual", "Notas de cata y maridaje sugerido", "10% OFF en todo el Shop", "Envío bonificado en Rosario"];
  } else if (nombreLower.includes('terruño') || nombreLower.includes('terruno')) {
    beneficiosPlan = ["Selección Alta Gama mensual", "Acceso a pre-ventas limitadas", "15% OFF en todo el Shop", "Invitación a catas privadas", "Envío bonificado en Rosario"];
  } else {
    beneficiosPlan = ["Selección curada mensual", "Beneficios exclusivos en el Shop", "Envío bonificado en Rosario"];
  }

  const getInputClasses = (fieldName) => {
    let base = "w-full bg-dark-blue/40 backdrop-blur-sm border-b px-4 py-4 text-sm outline-none text-brand-white transition-all focus:bg-dark-blue/60";
    if (socio) {
      base = "w-full bg-dark-blue/10 backdrop-blur-sm border-b px-4 py-4 text-sm outline-none text-brand-white/50 cursor-not-allowed select-none";
      return `${base} border-light-blue/10`;
    }
    const status = errores[fieldName] 
      ? "border-red-500 placeholder-brand-white/30" 
      : "border-light-blue/20 focus:border-brand-orange placeholder-brand-white/30";
    return `${base} ${status}`;
  };

  return (
    <div className="min-h-screen bg-extra-black text-brand-white font-poppins selection:bg-brand-orange selection:text-white flex flex-col relative overflow-hidden">
      <SEO title="Finalizar Compra" description="Completa tu compra de forma segura en Decant." />  
      
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-brand-orange/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-light-blue/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

      <div className="md:hidden bg-extra-black/80 backdrop-blur-md border-b border-brand-orange/20 shrink-0 relative z-10">
        <button type="button" onClick={() => setMobileSummaryOpen(!mobileSummaryOpen)} className="w-full flex items-center justify-between p-6 text-sm font-black uppercase tracking-widest text-brand-orange outline-none">
          <span className="flex items-center gap-2">🍷 Resumen de Membresía <ChevronIcon className="w-4 h-4" isOpen={mobileSummaryOpen} /></span>
          <span className="text-white font-bold">${planVIP.precioFinal.toLocaleString()}</span>
        </button>
        <div className={`overflow-hidden transition-all duration-300 ${mobileSummaryOpen ? 'max-h-[800px] border-t border-light-blue/10' : 'max-h-0'}`}>
          <div className="p-6 flex flex-col gap-4">
             <div className="flex items-center gap-4">
               {planVIP.imageUrl && (
                 <div className="w-14 h-14 bg-brand-white/5 flex items-center justify-center p-1.5 rounded-sm shrink-0">
                   <img src={planVIP.imageUrl} alt={planVIP.nombre} className="w-full h-full object-contain drop-shadow-md" />
                 </div>
               )}
               <div className="flex flex-col">
                 <span className="font-playfair text-lg text-brand-white leading-tight">{planVIP.nombre}</span>
                 <span className="text-[10px] text-brand-white/50 uppercase tracking-widest mt-1">Membresía Mensual</span>
               </div>
             </div>
             
             <div className="mt-2 pt-4 border-t border-light-blue/10">
               <span className="text-[10px] uppercase tracking-widest text-brand-white/50 font-bold mb-3 block">Tus Beneficios</span>
               <ul className="flex flex-col gap-2">
                 {beneficiosPlan.map((ben, i) => (
                   <li key={i} className="flex items-start gap-2 text-[11px] font-medium text-brand-white/80">
                     <svg className="w-3.5 h-3.5 text-brand-orange shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                     {ben}
                   </li>
                 ))}
               </ul>
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-[85rem] w-full mx-auto grid grid-cols-1 md:grid-cols-[1.3fr_1fr] flex-1 relative z-10">
        
        <div className="p-6 md:p-12 lg:p-16 flex flex-col">
          <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-white/50 hover:text-brand-orange transition-colors w-max mb-10 outline-none group">
            <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Volver
          </button>
          
          <form onSubmit={handleCheckout} className="flex flex-col gap-8">
            <div className={`bg-dark-blue/20 backdrop-blur-sm p-6 md:p-10 transition-all duration-500 rounded-sm ${activeStep === 1 ? 'border border-brand-orange/50 shadow-[0_0_30px_rgba(217,119,87,0.1)]' : 'border border-light-blue/10 opacity-60'}`}>
              <div className="flex justify-between items-center cursor-pointer" onClick={() => !socio && setActiveStep(1)}>
                <h2 className="font-playfair italic text-2xl md:text-3xl text-brand-orange">1. Datos Personales y Domicilio</h2>
                {activeStep !== 1 && !socio && <span className="text-[10px] font-black uppercase tracking-widest text-brand-white/60 hover:text-brand-orange">Editar</span>}
                {socio && <span className="text-[9px] font-black uppercase tracking-widest text-green-400 bg-green-400/10 px-2 py-1 rounded border border-green-400/20">Verificado</span>}
              </div>
              <div className={`overflow-hidden transition-all duration-500 ${activeStep === 1 ? 'max-h-[800px] mt-8 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="md:col-span-2 mb-2"><span className="text-[10px] uppercase tracking-widest text-brand-orange font-bold">Datos de Contacto</span></div>
                  
                  <input required type="text" name="nombre" placeholder="Nombre *" value={formData.nombre} onChange={handleInputChange} readOnly={!!socio} className={getInputClasses('nombre')} />
                  <input required type="text" name="apellido" placeholder="Apellido *" value={formData.apellido} onChange={handleInputChange} readOnly={!!socio} className={getInputClasses('apellido')} />
                  
                  <div className="md:col-span-2 relative">
                    <input required type="email" name="email" placeholder="Correo Electrónico *" value={formData.email} onChange={handleInputChange} onBlur={handleBlur} readOnly={!!socio} className={getInputClasses('email')} />
                    {errores.email && <span className="text-red-400 text-[10px] absolute -bottom-5 left-2">{errores.email}</span>}
                  </div>

                  <div className="md:col-span-2 relative mt-2">
                    <input required type="tel" name="telefono" placeholder="WhatsApp (Ej: 341 555 5555 sin espacios) *" value={formData.telefono} onChange={handleInputChange} onBlur={handleBlur} readOnly={!!socio} className={getInputClasses('telefono')} />
                    {errores.telefono && <span className="text-red-400 text-[10px] absolute -bottom-5 left-2">{errores.telefono}</span>}
                  </div>

                  <div className="md:col-span-2 mb-2 mt-8"><span className="text-[10px] uppercase tracking-widest text-brand-orange font-bold">Domicilio de Facturación / Envío</span></div>
                  <input required type="text" name="direccion" placeholder="Calle, Número y Piso *" value={formData.direccion} onChange={handleInputChange} className={`${getInputClasses('direccion')} md:col-span-2`} />
                  <input required type="text" name="ciudad" placeholder="Ciudad / Provincia *" value={formData.ciudad} onChange={handleInputChange} className={getInputClasses('ciudad')} />
                  <input required type="text" name="cp" placeholder="Código Postal *" value={formData.cp} onChange={handleInputChange} className={getInputClasses('cp')} />
                </div>
                <button type="button" onClick={() => setActiveStep(2)} className="mt-10 bg-brand-white text-extra-black text-[10px] font-black uppercase tracking-[0.2em] px-10 py-5 hover:bg-brand-orange hover:text-brand-white transition-all shadow-md outline-none">Continuar a Entrega</button>
              </div>
            </div>

            <div className={`bg-dark-blue/20 backdrop-blur-sm p-6 md:p-10 transition-all duration-500 rounded-sm ${activeStep === 2 ? 'border border-brand-orange/50 shadow-[0_0_30px_rgba(217,119,87,0.1)]' : 'border border-light-blue/10 opacity-60'}`}>
              <div className="flex justify-between items-center cursor-pointer" onClick={() => setActiveStep(2)}>
                <h2 className="font-playfair italic text-2xl md:text-3xl text-brand-orange">2. Modalidad de Entrega</h2>
              </div>
              <div className={`overflow-hidden transition-all duration-500 ${activeStep === 2 ? 'max-h-[800px] mt-8 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="flex flex-col gap-4">
                  <label className={`border p-6 flex items-center gap-4 cursor-pointer transition-all rounded-sm ${formData.envio === 'rosario' ? 'border-brand-orange bg-brand-orange/10' : 'bg-dark-blue/40 border-light-blue/20 hover:border-brand-orange/50'}`}>
                    <input type="radio" name="envio" value="rosario" checked={formData.envio === 'rosario'} onChange={handleInputChange} className="accent-brand-orange w-5 h-5" />
                    <div className="flex flex-col"><span className="text-sm font-bold uppercase tracking-wider text-brand-white">Envío en Rosario</span></div>
                  </label>
                  <label className={`border p-6 flex items-center gap-4 cursor-pointer transition-all rounded-sm ${formData.envio === 'retiro' ? 'border-brand-orange bg-brand-orange/10' : 'bg-dark-blue/40 border-light-blue/20 hover:border-brand-orange/50'}`}>
                    <input type="radio" name="envio" value="retiro" checked={formData.envio === 'retiro'} onChange={handleInputChange} className="accent-brand-orange w-5 h-5" />
                    <div className="flex flex-col"><span className="text-sm font-bold uppercase tracking-wider text-brand-white">Retiro por Cava</span></div>
                  </label>
                </div>
                <button type="button" onClick={() => setActiveStep(3)} className="mt-8 bg-brand-white text-extra-black text-[10px] font-black uppercase tracking-[0.2em] px-10 py-5 hover:bg-brand-orange hover:text-brand-white transition-all shadow-md outline-none">Finalizar</button>
              </div>
            </div>

            <div className={`bg-dark-blue/20 backdrop-blur-sm p-6 md:p-10 transition-all duration-500 rounded-sm ${activeStep === 3 ? 'border border-brand-orange/50 shadow-[0_0_30px_rgba(217,119,87,0.1)]' : 'border border-light-blue/10 opacity-60'}`}>
               <div className="flex justify-between items-center cursor-pointer" onClick={() => setActiveStep(3)}>
                <h2 className="font-playfair italic text-2xl md:text-3xl text-brand-orange">3. Mercado Pago</h2>
              </div>
              <div className={`overflow-hidden transition-all duration-500 ${activeStep === 3 ? 'max-h-[800px] mt-8 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="bg-extra-black/50 border border-light-blue/20 p-6 rounded-sm mb-8 flex gap-4 items-start">
                  <ShieldIcon className="w-6 h-6 text-brand-orange shrink-0 mt-1" />
                  <p className="text-xs text-brand-white/80 leading-relaxed font-poppins">
                    Al continuar, serás redirigido a Mercado Pago de forma segura para activar tu débito automático mensual.
                  </p>
                </div>

                <button disabled={isProcessing} type="submit" className="w-full bg-brand-orange text-brand-white text-[12px] font-black uppercase tracking-[0.2em] px-8 py-6 hover:bg-brand-white hover:text-extra-black transition-all shadow-[0_10px_40px_rgba(217,119,87,0.3)] flex items-center justify-center gap-3 outline-none disabled:opacity-50">
                  {isProcessing ? 'Procesando...' : 'Pagar Suscripción'} <span className="text-xl leading-none font-light">→</span>
                </button>
              </div>
            </div>
          </form>
        </div>
        
        <div className="hidden md:block bg-extra-black/40 backdrop-blur-md border-l border-light-blue/10">
          <div className="sticky top-0 h-screen flex flex-col p-10 overflow-y-auto">
            <h3 className="font-playfair italic text-3xl text-brand-white mb-8">Tu Membresía</h3>
            
            <div className="bg-dark-blue/20 border border-light-blue/10 p-8 rounded-sm flex flex-col relative shadow-xl">
              {nombreLower.includes('terruño') && (
                <div className="absolute top-0 right-0 bg-brand-orange text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-bl-sm">
                  Más Elegido
                </div>
              )}

              <div className="text-left mb-6">
                <span className="text-brand-orange text-[9px] font-black tracking-widest uppercase mb-2 block">Plan Seleccionado</span>
                <h4 className="font-playfair font-black italic text-3xl text-brand-white">{planVIP.nombre}</h4>
              </div>

              {planVIP.imageUrl && (
                <div className="w-32 h-32 mx-auto bg-brand-white/5 flex items-center justify-center p-4 mb-6 shrink-0 rounded-sm">
                  <img src={planVIP.imageUrl} alt={planVIP.nombre} className="w-full h-full object-contain drop-shadow-lg" />
                </div>
              )}

              <p className="text-xs text-brand-white/70 mb-8 leading-relaxed">
                {planVIP.descripcion || "Ideal para quienes buscan descubrir nuevas cepas y bodegas boutique mes a mes, asegurando siempre una mesa bien servida."}
              </p>

              <div className="mb-8 border-b border-light-blue/10 pb-6">
                <span className="font-poppins text-3xl font-black text-brand-orange tracking-tight">
                  ${planVIP.precioFinal.toLocaleString('es-AR')}
                </span>
                <span className="text-[10px] font-bold text-light-blue ml-2 uppercase tracking-widest">/ mes</span>
              </div>
              
              <div>
                <span className="text-[10px] uppercase tracking-widest text-brand-white/50 font-bold mb-4 block">Beneficios Incluidos</span>
                <ul className="flex flex-col gap-4">
                  {beneficiosPlan.map((ben, i) => (
                    <li key={i} className="flex items-start gap-3 text-xs font-medium text-brand-white/80">
                      <svg className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                      {ben}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}