import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { db } from '../config/firebase';
import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Íconos
const TrashIcon = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>);
const ChevronIcon = ({ className, isOpen }) => (<svg className={`${className} transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>);
const LockIcon = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>);
const ArrowLeftIcon = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>);
const ShieldIcon = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>);

export default function Checkout() {
  const { cart, removeFromCart, updateQuantity, totalPrecio, clearCart } = useCart();
  const navigate = useNavigate();

  const [activeStep, setActiveStep] = useState(1);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '', apellido: '', email: '', telefono: '',
    envio: 'convenir', direccion: '', ciudad: '', cp: '',
    pago: 'transferencia'
  });

  const [inputSocio, setInputSocio] = useState('');
  const [datosSocio, setDatosSocio] = useState(null);
  const [mensajeSocio, setMensajeSocio] = useState({ tipo: '', texto: '' });
  const [validandoSocio, setValidandoSocio] = useState(false);

  useEffect(() => {
    const savedData = localStorage.getItem('decant_customer_data');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setFormData(prev => ({ ...prev, ...parsed }));
    }
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === 'email') {
      setDatosSocio(null);
      setMensajeSocio({ tipo: '', texto: '' });
    }
  };

  const handleValidarSocio = async () => {
    if (!formData.email) {
      setMensajeSocio({ tipo: 'error', texto: 'Completá tu email en el Paso 1 primero.' });
      return;
    }
    if (!inputSocio) return;
    setValidandoSocio(true);
    setMensajeSocio({ tipo: '', texto: '' });

    try {
      const emailLower = formData.email.toLowerCase();
      const clientRef = doc(db, 'clientes', emailLower);
      const clientSnap = await getDoc(clientRef);
      if (clientSnap.exists()) {
        const data = clientSnap.data();
        if (data.numeroCliente === inputSocio) {
          if (data.badge === 'Descorche') setDatosSocio({ porcentaje: 0.15, badge: 'Descorche' });
          else if (data.badge === 'Terruño') setDatosSocio({ porcentaje: 0.20, badge: 'Terruño' });
          else setMensajeSocio({ tipo: 'error', texto: 'No posees una membresía activa.' });
        } else setMensajeSocio({ tipo: 'error', texto: 'El PIN no coincide con tu email.' });
      } else setMensajeSocio({ tipo: 'error', texto: 'No encontramos un socio con este email.' });
    } catch (error) {
      setMensajeSocio({ tipo: 'error', texto: 'Error al validar.' });
    }
    setValidandoSocio(false);
  };

  const subtotal = totalPrecio;
  const montoDescuentoVIP = datosSocio ? subtotal * datosSocio.porcentaje : 0;
  const subtotalPostVIP = subtotal - montoDescuentoVIP;
  const descuentoMontoTransferencia = formData.pago === 'transferencia' ? subtotalPostVIP * 0.05 : 0;
  const totalFinal = subtotalPostVIP - descuentoMontoTransferencia;
  const textoEnvio = formData.envio === 'retiro' || formData.envio === 'local' ? 'Gratis' : 'A convenir';

  const handleCheckout = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const emailLower = formData.email.toLowerCase();
      const clientRef = doc(db, 'clientes', emailLower);
      const clientSnap = await getDoc(clientRef);
      let numeroCliente = '';

      if (clientSnap.exists()) {
        numeroCliente = clientSnap.data().numeroCliente;
        await setDoc(clientRef, {
          nombre: formData.nombre, apellido: formData.apellido,
          telefono: formData.telefono, direccionDefault: formData.direccion,
          ciudad: formData.ciudad, cp: formData.cp,
          totalCompras: (clientSnap.data().totalCompras || 0) + 1,
        }, { merge: true });
      } else {
        numeroCliente = Math.floor(1000 + Math.random() * 9000).toString();
        await setDoc(clientRef, {
          numeroCliente, nombre: formData.nombre, apellido: formData.apellido,
          email: emailLower, telefono: formData.telefono, direccionDefault: formData.direccion,
          ciudad: formData.ciudad, cp: formData.cp, totalCompras: 1, badge: null
        });
      }

      const pedidoInfo = {
        clienteEmail: emailLower, numeroCliente, tipo: 'tienda',
        cart, subtotal: totalPrecio, 
        descuentoVIP: { aplicado: !!datosSocio, badge: datosSocio ? datosSocio.badge : null, monto: montoDescuentoVIP },
        descuentoTransferencia: descuentoMontoTransferencia, totalFinal,
        envio: formData.envio, textoEnvio, formData, estado: 'Pendiente', createdAt: serverTimestamp()
      };

      const pedidoRef = await addDoc(collection(db, 'pedidos'), pedidoInfo);
      
      // 👉 LÓGICA DE SINCRONIZACIÓN DE N° DE ORDEN
      const pedidoIdReal = pedidoRef.id;
      const numeroOrdenCorto = pedidoIdReal.slice(0, 5).toUpperCase();

      localStorage.setItem('decant_customer_data', JSON.stringify(formData));
      localStorage.setItem('decant_last_order', JSON.stringify({
        ...pedidoInfo,
        id: pedidoIdReal,
        ordenDisplay: numeroOrdenCorto
      }));
      
      clearCart();
      navigate('/gracias');
    } catch (error) {
      console.error("Error:", error);
      setIsProcessing(false);
    }
  };

  if (cart.length === 0) return <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center font-poppins text-xs font-black uppercase tracking-widest">Carrito vacío</div>;

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-dark-blue font-poppins flex flex-col">
       {/* UI Simplificada para el código: Todo tu diseño de 3 pasos aquí... */}
       <div className="md:hidden bg-[#F0EBE1] border-b border-dark-blue/10 shrink-0">
        <button onClick={() => setMobileSummaryOpen(!mobileSummaryOpen)} className="w-full flex items-center justify-between p-6 text-sm font-black uppercase tracking-widest outline-none">
          <span className="flex items-center gap-2">🛒 Resumen <ChevronIcon className="w-4 h-4" isOpen={mobileSummaryOpen} /></span>
          <span className="text-brand-orange font-bold">${totalFinal.toLocaleString()}</span>
        </button>
      </div>

      <div className="max-w-[85rem] w-full mx-auto grid grid-cols-1 md:grid-cols-[1.2fr_1fr] flex-1">
        <div className="p-6 md:p-12 lg:p-16">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-10 outline-none"><ArrowLeftIcon className="w-4 h-4"/> Volver</button>
          
          <form onSubmit={handleCheckout} className="flex flex-col gap-6">
            {/* PASO 1 */}
            <div className={`bg-white p-8 shadow-sm border ${activeStep === 1 ? 'border-brand-orange/30' : 'border-dark-blue/10 opacity-60'}`}>
              <h2 className="font-semibold text-xl mb-6">1. Tus Datos</h2>
              {activeStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input required type="text" name="nombre" placeholder="Nombre" value={formData.nombre} onChange={handleInputChange} className="w-full border border-dark-blue/10 p-4 text-sm outline-none focus:border-brand-orange" />
                  <input required type="text" name="apellido" placeholder="Apellido" value={formData.apellido} onChange={handleInputChange} className="w-full border border-dark-blue/10 p-4 text-sm outline-none focus:border-brand-orange" />
                  <input required type="email" name="email" placeholder="Email" value={formData.email} onChange={handleInputChange} className="w-full border border-dark-blue/10 p-4 text-sm outline-none focus:border-brand-orange md:col-span-2" />
                  <input required type="tel" name="telefono" placeholder="WhatsApp" value={formData.telefono} onChange={handleInputChange} className="w-full border border-dark-blue/10 p-4 text-sm outline-none focus:border-brand-orange md:col-span-2" />
                  <button type="button" onClick={() => setActiveStep(2)} className="bg-dark-blue text-white text-[10px] font-black uppercase tracking-widest px-8 py-4 mt-4">Continuar</button>
                </div>
              )}
            </div>

            {/* PASO 2 */}
            <div className={`bg-white p-8 shadow-sm border ${activeStep === 2 ? 'border-brand-orange/30' : 'border-dark-blue/10 opacity-60'}`}>
              <h2 className="font-semibold text-xl mb-6">2. Entrega</h2>
              {activeStep === 2 && (
                <div className="flex flex-col gap-4">
                  <label className="border p-4 flex items-center gap-3 cursor-pointer"><input type="radio" name="envio" value="convenir" checked={formData.envio === 'convenir'} onChange={handleInputChange} /> <span>Envío a convenir</span></label>
                  <label className="border p-4 flex items-center gap-3 cursor-pointer"><input type="radio" name="envio" value="retiro" checked={formData.envio === 'retiro'} onChange={handleInputChange} /> <span>Retiro por Cava</span></label>
                  <div className="grid grid-cols-1 gap-4 mt-4">
                    <input required type="text" name="direccion" placeholder="Dirección" value={formData.direccion} onChange={handleInputChange} className="w-full border border-dark-blue/10 p-4 text-sm outline-none" />
                  </div>
                  <button type="button" onClick={() => setActiveStep(3)} className="bg-dark-blue text-white text-[10px] font-black uppercase tracking-widest px-8 py-4 mt-4">Continuar al Pago</button>
                </div>
              )}
            </div>

            {/* PASO 3 */}
            <div className={`bg-white p-8 shadow-sm border ${activeStep === 3 ? 'border-brand-orange/30' : 'border-dark-blue/10'}`}>
              <h2 className="font-semibold text-xl mb-6">3. Pago</h2>
              {activeStep === 3 && (
                <div className="flex flex-col gap-6">
                  <div className="bg-slate-50 p-6 border border-dark-blue/10 rounded-lg">
                    <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2"><ShieldIcon className="w-4 h-4 text-brand-orange" /> Miembro del Club</h3>
                    <div className="flex gap-2">
                      <input type="text" placeholder="PIN de Socio" value={inputSocio} onChange={(e) => setInputSocio(e.target.value)} className="flex-1 border p-3 text-sm font-bold tracking-widest" />
                      <button type="button" onClick={handleValidarSocio} className="bg-dark-blue text-white px-6 text-[10px] font-black uppercase tracking-widest">Aplicar</button>
                    </div>
                    {mensajeSocio.texto && <p className={`text-[10px] font-bold mt-2 uppercase ${mensajeSocio.tipo === 'error' ? 'text-red-500' : 'text-green-600'}`}>{mensajeSocio.texto}</p>}
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <label className="border p-4 flex items-center gap-3 cursor-pointer"><input type="radio" name="pago" value="transferencia" checked={formData.pago === 'transferencia'} onChange={handleInputChange} /> <span>Transferencia (5% OFF Extra)</span></label>
                    <label className="border p-4 flex items-center gap-3 cursor-pointer"><input type="radio" name="pago" value="mercadopago" checked={formData.pago === 'mercadopago'} onChange={handleInputChange} /> <span>Mercado Pago</span></label>
                  </div>

                  <button disabled={isProcessing} type="submit" className="w-full bg-brand-orange text-white text-[12px] font-black uppercase tracking-widest py-5 hover:bg-dark-orange transition-all disabled:opacity-50">
                    {isProcessing ? 'Procesando...' : 'Confirmar Pedido (WhatsApp)'}
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* RESUMEN DERECHA */}
        <div className="hidden md:block bg-white border-l border-dark-blue/10 p-8 sticky top-0 h-screen overflow-y-auto">
          <h3 className="text-2xl font-semibold mb-8">Resumen</h3>
          <div className="space-y-6 mb-8">
            {cart.map(item => (
              <div key={item.id} className="flex gap-4">
                <img src={item.imageUrl} className="w-16 h-20 object-contain bg-slate-50" />
                <div className="flex-1"><p className="text-sm font-bold">{item.nombre}</p><p className="text-xs text-slate-400">{item.cantidad} x ${item.precioFinal.toLocaleString()}</p></div>
              </div>
            ))}
          </div>
          <div className="border-t pt-6 space-y-3">
             <div className="flex justify-between text-sm"><span>Subtotal</span><span>${subtotal.toLocaleString()}</span></div>
             {montoDescuentoVIP > 0 && <div className="flex justify-between text-sm text-brand-orange font-bold"><span>Socio {datosSocio.badge}</span><span>- ${montoDescuentoVIP.toLocaleString()}</span></div>}
             {descuentoMontoTransferencia > 0 && <div className="flex justify-between text-sm text-brand-orange"><span>Descuento Transferencia</span><span>- ${descuentoMontoTransferencia.toLocaleString()}</span></div>}
             <div className="flex justify-between text-xl font-black border-t pt-4 mt-4"><span>Total</span><span>${totalFinal.toLocaleString()}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}