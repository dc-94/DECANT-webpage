import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../config/firebase';
import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function CheckoutSuscripciones() {
  const { plan } = useParams(); // 'descorche' o 'terrurio'
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '', apellido: '', email: '', telefono: '',
    direccion: '', ciudad: '', cp: '', pago: 'transferencia'
  });

  // Datos del plan según URL
  const planesInfo = {
    descorche: { nombre: 'Club Descorche', precio: 15000, badge: 'Descorche' },
    terrurio: { nombre: 'Club Terruño', precio: 25000, badge: 'Terruño' }
  };
  const currentPlan = planesInfo[plan?.toLowerCase()] || planesInfo.descorche;

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleCheckout = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const emailLower = formData.email.toLowerCase();
      const numeroCliente = Math.floor(1000 + Math.random() * 9000).toString(); // PIN de Socio

      // 1. Guardar/Actualizar Cliente con su nuevo Badge
      await setDoc(doc(db, 'clientes', emailLower), {
        nombre: formData.nombre, apellido: formData.apellido,
        email: emailLower, telefono: formData.telefono,
        numeroCliente, badge: currentPlan.badge,
        createdAt: serverTimestamp()
      }, { merge: true });

      // 2. Registrar Pedido de Suscripción
      const pedidoInfo = {
        clienteEmail: emailLower, numeroCliente, tipo: 'suscripcion',
        plan: currentPlan.nombre, totalFinal: currentPlan.precio,
        formData, estado: 'Pendiente', createdAt: serverTimestamp()
      };

      const pedidoRef = await addDoc(collection(db, 'pedidos'), pedidoInfo);
      
      // 👉 LÓGICA DE SINCRONIZACIÓN DE N° DE ORDEN
      const pedidoIdReal = pedidoRef.id;
      const numeroOrdenCorto = pedidoIdReal.slice(0, 5).toUpperCase();

      localStorage.setItem('decant_sub_order', JSON.stringify({
        ...pedidoInfo,
        id: pedidoIdReal,
        ordenDisplay: numeroOrdenCorto,
        numeroSocio: numeroCliente
      }));

      navigate('/gracias-suscripcion');
    } catch (error) {
      console.error(error);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-blue flex items-center justify-center p-6 font-poppins">
      <form onSubmit={handleCheckout} className="bg-white max-w-xl w-full p-10 rounded-2xl shadow-2xl">
        <h2 className="text-2xl font-black uppercase tracking-tight text-dark-blue mb-2">Unite al {currentPlan.nombre}</h2>
        <p className="text-sm text-slate-400 mb-8 font-medium">Completá tus datos para activar tu membresía exclusiva.</p>
        
        <div className="grid grid-cols-2 gap-4">
          <input required name="nombre" placeholder="Nombre" onChange={handleInputChange} className="border p-4 rounded-lg outline-none focus:border-brand-orange transition-all" />
          <input required name="apellido" placeholder="Apellido" onChange={handleInputChange} className="border p-4 rounded-lg outline-none focus:border-brand-orange transition-all" />
          <input required name="email" type="email" placeholder="Email" onChange={handleInputChange} className="border p-4 rounded-lg outline-none focus:border-brand-orange transition-all col-span-2" />
          <input required name="telefono" placeholder="WhatsApp" onChange={handleInputChange} className="border p-4 rounded-lg outline-none focus:border-brand-orange transition-all col-span-2" />
        </div>

        <div className="mt-8 pt-8 border-t border-slate-100">
           <div className="flex justify-between items-center mb-6">
              <span className="font-bold text-slate-400 uppercase text-xs tracking-widest">Total a pagar</span>
              <span className="text-3xl font-black text-dark-blue">${currentPlan.precio.toLocaleString()}</span>
           </div>
           <button disabled={isProcessing} className="w-full bg-brand-orange text-white py-5 rounded-xl font-black uppercase tracking-widest hover:bg-dark-orange transition-all shadow-xl shadow-brand-orange/20">
             {isProcessing ? 'Procesando...' : 'Confirmar Membresía'}
           </button>
        </div>
      </form>
    </div>
  );
}