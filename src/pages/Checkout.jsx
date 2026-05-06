import { useState, useEffect, useMemo, useRef } from 'react';
import SEO from '../components/public/SEO';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useSocio } from '../context/SocioContext';

// Iconos
const ArrowLeftIcon = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>);
const ShieldIcon = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>);

export default function Checkout() {
  const { cart, clearCart } = useCart();
  const { socio, loginSocio, validando } = useSocio(); 
  const navigate = useNavigate();

  const [activeStep, setActiveStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExistingClient, setIsExistingClient] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const submitLock = useRef(false);

  const [formData, setFormData] = useState({
    email: '', 
    nombre: '', 
    apellido: '', 
    telefono: '',
    envio: 'convenir', // 👉 Cambio: Envío a domicilio por defecto
    direccion: '', 
    ciudad: '', 
    cp: '',
    pago: 'transferencia'
  });
  
  const [errores, setErrores] = useState({ email: '', pin: '' });
  const [direccionEmpresa, setDireccionEmpresa] = useState('Nuestra Cava');

  // Cargar dirección de la empresa para el retiro
  useEffect(() => {
    const getStoreData = async () => {
      const docSnap = await getDoc(doc(db, 'ajustes_storefront', 'home'));
      if (docSnap.exists()) setDireccionEmpresa(docSnap.data().datosEmpresa?.direccion || 'Nuestra Cava');
    };
    getStoreData();
  }, []);

  // 1. Verificar identidad por Email
  const checkEmailIdentidad = async () => {
    if (!formData.email || socio) return;
    try {
      const docRef = doc(db, 'clientes', formData.email.toLowerCase().trim());
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setIsExistingClient(true);
      } else {
        setIsExistingClient(false);
      }
    } catch (e) { console.error(e); }
  };

  // 2. Autocompletar datos al identificar
  useEffect(() => {
    if (socio) {
      // Buscamos los datos extendidos del socio para la dirección
      const fetchExtendedData = async () => {
        const docRef = doc(db, 'clientes', socio.email);
        const docSnap = await getDoc(docRef);
        const data = docSnap.exists() ? docSnap.data() : {};

        setFormData(prev => ({
          ...prev,
          email: socio.email,
          nombre: data.nombre || socio.nombre || '',
          apellido: data.apellido || '',
          telefono: data.telefono || '',
          // 👉 Datos de envío: se cargan pero no se bloquean
          direccion: data.direccionDefault || '',
          ciudad: data.ciudad || '',
          cp: data.cp || ''
        }));
      };

      fetchExtendedData();
      setIsExistingClient(false);
      setPinInput('');
      if (activeStep === 1) setActiveStep(2); 
    }
  }, [socio]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errores[name]) setErrores({ ...errores, [name]: '' });
  };

  const handleValidarIdentidad = async () => {
    setErrores(prev => ({ ...prev, pin: '' }));
    const res = await loginSocio(formData.email, pinInput);
    if (!res.success) setErrores(prev => ({ ...prev, pin: res.error }));
  };

  const effectiveCart = useMemo(() => {
    return cart.map(item => {
      const precioBase = item.precioBase || item.precioFinal;
      let precioEfectivo = item.precioFinal;
      if (socio && socio.porcentaje > 0) {
        precioEfectivo = Math.round(precioBase * (1 - socio.porcentaje));
      }
      return { ...item, precioEfectivo };
    });
  }, [cart, socio]);

  const subtotal = effectiveCart.reduce((acc, i) => acc + (i.precioEfectivo * i.cantidad), 0);
  const descTransf = formData.pago === 'transferencia' ? subtotal * 0.05 : 0;
  const totalFinal = subtotal - descTransf;

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (submitLock.current) return;
    submitLock.current = true;
    setIsProcessing(true);

    try {
      const apiUrl = import.meta.env.VITE_API_CHECKOUT_URL;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData,
          cart: effectiveCart.map(i => ({ id: i.id, cantidad: i.cantidad, precioFinal: i.precioEfectivo })),
          pago: formData.pago,
          envio: formData.envio,
          inputSocio: socio ? socio.pin : ''
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      localStorage.setItem('decant_last_order', JSON.stringify({
        id: result.pedidoId,
        ordenDisplay: result.ordenDisplay,
        totalFinal: result.totalFinalReal
      }));

      clearCart();
      navigate('/gracias');
    } catch (error) {
      alert(error.message);
      submitLock.current = false;
      setIsProcessing(false);
    }
  };

  // 👉 Función para determinar si un campo debe estar bloqueado visualmente
  const isFieldBlocked = (name) => {
    const identityFields = ['email', 'nombre', 'apellido', 'telefono'];
    return socio && identityFields.includes(name);
  };

  const getInputClasses = (name) => {
    const blocked = isFieldBlocked(name);
    return `w-full px-4 py-4 text-sm border rounded-sm transition-all outline-none 
    ${errores[name] ? 'border-red-400 bg-red-50' : 'border-dark-blue/10 focus:border-brand-orange'} 
    ${blocked ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-dark-blue'}`;
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] font-poppins selection:bg-brand-orange">
      <SEO title="Finalizar Compra" />
      
      <div className="max-w-[85rem] mx-auto grid grid-cols-1 md:grid-cols-[1.3fr_1fr] min-h-screen">
        <div className="p-6 md:p-16 flex flex-col gap-10">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-dark-blue/40 hover:text-brand-orange transition-colors">
            <ArrowLeftIcon className="w-4 h-4" /> Volver
          </button>

          <form onSubmit={handleCheckout} className="flex flex-col gap-8">
            {/* PASO 1: DATOS PERSONALES / RESUMEN */}
            <div className={`bg-white p-8 rounded-sm shadow-sm border transition-all duration-500 ${activeStep === 1 ? 'border-brand-orange/40' : 'border-dark-blue/5 opacity-100'}`}>
              <div className="flex justify-between items-center">
                <h2 className="font-playfair italic text-2xl text-dark-blue">1. Datos y Contacto</h2>
                {/* Botón para volver al Paso 1 y editar si no es socio bloqueado */}
                {activeStep > 1 && !socio && (
                  <button 
                    type="button" 
                    onClick={() => setActiveStep(1)} 
                    className="text-[10px] font-black uppercase tracking-widest text-brand-orange hover:underline"
                  >
                    Editar
                  </button>
                )}
                {socio && <span className="text-[9px] font-black uppercase text-green-600 bg-green-50 px-2 py-1 rounded">Identidad Verificada</span>}
              </div>

              {/* VISTA DE EDICIÓN (Paso 1 Activo) */}
              <div className={`flex flex-col gap-5 transition-all duration-500 ${activeStep === 1 ? 'max-h-[600px] mt-8 opacity-100' : 'max-h-0 overflow-hidden opacity-0'}`}>
                <div className="relative">
                  <input 
                    required 
                    type="email" 
                    name="email" 
                    placeholder="Email *" 
                    value={formData.email} 
                    onChange={handleInputChange} 
                    onBlur={checkEmailIdentidad}
                    readOnly={isFieldBlocked('email')}
                    className={getInputClasses('email')} 
                  />
                </div>

                {isExistingClient && !socio && (
                  <div className="bg-brand-orange/5 p-5 border border-brand-orange/20 rounded-sm">
                    <p className="text-[10px] font-bold uppercase text-brand-orange mb-3">Identifícate con tu PIN</p>
                    <div className="flex gap-2">
                      <input type="password" placeholder="PIN" value={pinInput} onChange={(e) => setPinInput(e.target.value)} className="flex-1 px-4 py-3 border border-brand-orange/20 outline-none text-sm" />
                      <button type="button" onClick={handleValidarIdentidad} disabled={validando} className="bg-brand-orange text-white px-6 text-[10px] font-black uppercase">Validar</button>
                    </div>
                    {errores.pin && <p className="text-[10px] text-red-500 mt-2">{errores.pin}</p>}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <input required type="text" name="nombre" placeholder="Nombre *" value={formData.nombre} onChange={handleInputChange} readOnly={isFieldBlocked('nombre')} className={getInputClasses('nombre')} />
                  <input required type="text" name="apellido" placeholder="Apellido *" value={formData.apellido} onChange={handleInputChange} readOnly={isFieldBlocked('apellido')} className={getInputClasses('apellido')} />
                </div>
                <input required type="tel" name="telefono" placeholder="WhatsApp *" value={formData.telefono} onChange={handleInputChange} readOnly={isFieldBlocked('telefono')} className={getInputClasses('telefono')} />
                
                <button type="button" onClick={() => setActiveStep(2)} className="bg-dark-blue text-white py-5 text-[10px] font-black uppercase tracking-widest">Confirmar Datos</button>
              </div>

              {/* 👉 VISTA RESUMEN (Visible en Pasos 2 y 3) */}
              <div className={`transition-all duration-500 ${activeStep > 1 ? 'max-h-[200px] mt-6 opacity-100' : 'max-h-0 overflow-hidden opacity-0'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#F8F9FA] p-5 border border-dark-blue/5 rounded-sm">
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-black text-dark-blue/40 tracking-widest">Nombre Completo</span>
                    <span className="text-xs font-bold text-dark-blue">{formData.nombre} {formData.apellido}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-black text-dark-blue/40 tracking-widest">WhatsApp de contacto</span>
                    <span className="text-xs font-bold text-dark-blue">{formData.telefono}</span>
                  </div>
                  <div className="flex flex-col md:col-span-2">
                    <span className="text-[9px] uppercase font-black text-dark-blue/40 tracking-widest">Email</span>
                    <span className="text-xs font-bold text-dark-blue">{formData.email}</span>
                  </div>
                </div>
              </div>
            </div>
            {/* PASO 2: ENTREGA (SIEMPRE EDITABLE) */}
            <div className={`bg-white p-8 rounded-sm shadow-sm border ${activeStep === 2 ? 'border-brand-orange/40' : 'border-dark-blue/5 opacity-80'}`}>
              <h2 className="font-playfair italic text-2xl text-dark-blue">2. Modalidad de Entrega</h2>
              <div className={`mt-8 flex flex-col gap-4 transition-all ${activeStep === 2 ? 'max-h-[800px]' : 'max-h-0 overflow-hidden'}`}>
                
                <label className={`p-5 border flex items-center gap-4 cursor-pointer rounded-sm ${formData.envio === 'convenir' ? 'border-brand-orange bg-brand-orange/5' : 'border-dark-blue/10'}`}>
                  <input type="radio" name="envio" value="convenir" checked={formData.envio === 'convenir'} onChange={handleInputChange} className="accent-brand-orange" />
                  <span className="text-xs font-bold uppercase tracking-widest text-dark-blue">Envío a Domicilio</span>
                </label>

                {formData.envio === 'convenir' && (
                  <div className="grid grid-cols-1 gap-4 mt-2 animate-in fade-in duration-500">
                    <input required type="text" name="direccion" placeholder="Calle, Altura y Piso *" value={formData.direccion} onChange={handleInputChange} className={getInputClasses('direccion')} />
                    <div className="grid grid-cols-2 gap-4">
                      <input required type="text" name="ciudad" placeholder="Ciudad *" value={formData.ciudad} onChange={handleInputChange} className={getInputClasses('ciudad')} />
                      <input required type="text" name="cp" placeholder="C.P. *" value={formData.cp} onChange={handleInputChange} className={getInputClasses('cp')} />
                    </div>
                    <p className="text-[9px] text-brand-orange font-bold uppercase tracking-tighter">* Puedes modificar estos datos para este envío específico.</p>
                  </div>
                )}

                <label className={`p-5 border flex items-center gap-4 cursor-pointer rounded-sm mt-4 ${formData.envio === 'retiro' ? 'border-brand-orange bg-brand-orange/5' : 'border-dark-blue/10'}`}>
                  <input type="radio" name="envio" value="retiro" checked={formData.envio === 'retiro'} onChange={handleInputChange} className="accent-brand-orange" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase tracking-widest text-dark-blue">Retiro por Cava</span>
                    <span className="text-[10px] opacity-60">{direccionEmpresa}</span>
                  </div>
                </label>

                <button type="button" onClick={() => setActiveStep(3)} className="mt-6 bg-dark-blue text-white py-5 text-[10px] font-black uppercase tracking-widest">Continuar al Pago</button>
              </div>
            </div>

            {/* PASO 3: PAGO */}
            <div className={`bg-white p-8 rounded-sm shadow-sm border ${activeStep === 3 ? 'border-brand-orange/40' : 'border-dark-blue/5 opacity-80'}`}>
              <h2 className="font-playfair italic text-2xl text-dark-blue">3. Método de Pago</h2>
              <div className={`mt-8 flex flex-col gap-6 transition-all ${activeStep === 3 ? 'max-h-[500px]' : 'max-h-0 overflow-hidden'}`}>
                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-3 text-xs font-bold uppercase cursor-pointer">
                    <input type="radio" name="pago" value="transferencia" checked={formData.pago === 'transferencia'} onChange={handleInputChange} className="accent-brand-orange" />
                    Transferencia (5% OFF)
                  </label>
                  <label className="flex items-center gap-3 text-xs font-bold uppercase cursor-pointer">
                    <input type="radio" name="pago" value="mercadopago" checked={formData.pago === 'mercadopago'} onChange={handleInputChange} className="accent-brand-orange" />
                    MercadoPago
                  </label>
                </div>
                <button disabled={isProcessing} type="submit" className="w-full bg-brand-orange text-white py-6 text-[12px] font-black uppercase tracking-widest shadow-xl">
                  {isProcessing ? 'Procesando...' : 'Confirmar Compra'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* RESUMEN (Sin cambios) */}
        <div className="bg-white border-l border-dark-blue/5 p-10 hidden md:block">
          <div className="sticky top-20">
            <h3 className="font-playfair italic text-3xl text-dark-blue mb-10">Resumen</h3>
            <div className="flex flex-col gap-6">
              {effectiveCart.map(item => (
                <div key={item.id} className="flex justify-between items-center border-b border-dark-blue/5 pb-4">
                  <span className="text-sm font-bold text-dark-blue">{item.cantidad}x {item.nombre}</span>
                  <span className="text-sm font-semibold">${(item.precioEfectivo * item.cantidad).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="mt-10 flex flex-col gap-4 border-t border-dark-blue/10 pt-5">
              <div className="flex justify-between text-xs font-bold uppercase">
                <span>Subtotal</span>
                <span>${subtotal.toLocaleString()}</span>
              </div>
              {descTransf > 0 && (
                <div className="flex justify-between text-xs font-bold text-brand-orange uppercase">
                  <span>Desc. Transferencia</span>
                  <span>- ${descTransf.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-2xl font-playfair font-black italic text-dark-blue">
                <span>Total</span>
                <span>${totalFinal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}