import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../components/layout/AdminNavbar';

// COMPONENTE REUTILIZABLE: DETALLE DE PEDIDO 
export function DetallePedidoDrawer({ pedido, onClose, onActualizarEstado }) {
  if (!pedido) return null;
  const numeroOrden = pedido.id.slice(0, 5).toUpperCase();

  const handleResendEmail = async () => {
    try {
      // Aquí llamaremos a la Cloud Function de Firebase en la Fase 3
      alert(`Enviando mail de seguimiento para la Orden #${numeroOrden} a ${pedido.clienteEmail}...`);
      // Lógica de backend: await resendTrackingEmail(pedido.id);
    } catch (error) {
      alert("Error al enviar el mail.");
    }
  };
  return (
    <div className="fixed inset-0 z-[110] flex justify-end font-poppins">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
        <div className="p-8 border-b flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Orden #{numeroOrden}</h2>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] mt-1">Socio: {pedido.numeroCliente}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 text-3xl transition-colors">×</button>
        </div>
        <section className="mt-8">
          <button 
            onClick={handleResendEmail}
            className="w-full flex items-center justify-center gap-2 py-3 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600 hover:bg-slate-50 hover:border-brand-orange hover:text-brand-orange transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Re-enviar Mail de Seguimiento
          </button>
        </section>
        <div className="flex-1 overflow-y-auto p-8">
          <div className="mb-8 p-5 bg-slate-50 border border-slate-200 rounded-xl">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-3">Estado de Gestión</label>
            <select 
              value={pedido.estado}
              onChange={(e) => onActualizarEstado(pedido.id, e.target.value)}
              className="w-full p-4 bg-white border border-slate-200 rounded-lg font-bold text-sm outline-none focus:border-brand-orange transition-all appearance-none cursor-pointer"
            >
              <option value="Pendiente">Pendiente</option>
              <option value="En Preparación">En Preparación</option>
              <option value="Enviado">Enviado</option>
            </select>
          </div>

          <div className="space-y-8">
            <section>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-3 mb-4">Items del Pedido</h4>
              {pedido.cart?.map((item, i) => (
                <div key={i} className="flex justify-between text-sm py-3 border-b border-slate-50 last:border-0">
                  <span className="text-slate-600"><strong className="text-slate-900 font-bold">{item.cantidad}x</strong> {item.nombre}</span>
                  <span className="font-bold text-slate-900">${(item.precioFinal * item.cantidad).toLocaleString()}</span>
                </div>
              ))}
            </section>
              
      
            <section className="bg-slate-50 p-6 rounded-xl border border-slate-100">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Logística y Entrega</h4>
              <div className="text-sm space-y-3">
                <p><span className="text-slate-400 font-medium mr-2">Cliente:</span> <span className="font-bold text-slate-900">{pedido.formData?.nombre} {pedido.formData?.apellido}</span></p>
                <p><span className="text-slate-400 font-medium mr-2">Dirección:</span> <span className="font-bold text-slate-900">{pedido.formData?.direccion}, {pedido.formData?.ciudad}</span></p>
                <p><span className="text-slate-400 font-medium mr-2">WhatsApp:</span> <span className="font-bold text-slate-900">{pedido.formData?.telefono}</span></p>
              </div>
            </section>
          </div>
        </div>
              
        <div className="p-8 border-t bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
          <div className="flex justify-between items-end mb-6">
            <span className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">Monto Total</span>
            <span className="text-3xl font-black text-brand-orange tracking-tight">${pedido.totalFinal?.toLocaleString()}</span>
          </div>
          <a 
            href={`https://wa.me/${pedido.formData?.telefono?.replace(/\D/g,'')}`} 
            target="_blank" 
            rel="noreferrer" 
            className="w-full bg-green-500 text-white font-black text-center py-5 rounded-xl block hover:bg-green-600 transition-all uppercase tracking-[0.2em] text-[11px] shadow-lg shadow-green-500/20"
          >
            Contactar por WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

export default function AdminVentas() {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'pedidos'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPedidos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setCargando(false);
    });
    return () => unsubscribe();
  }, []);

  const actualizarEstado = async (id, nuevoEstado) => {
    await updateDoc(doc(db, 'pedidos', id), { estado: nuevoEstado });
    if (pedidoSeleccionado?.id === id) setPedidoSeleccionado(prev => ({ ...prev, estado: nuevoEstado }));
  };

  const pedidosFiltrados = pedidos.filter(p => {
    const nOrden = p.id.slice(0, 5).toUpperCase();
    const matchesBusqueda = (nOrden + (p.formData?.nombre || "") + (p.formData?.apellido || "") + (p.numeroCliente || "")).toLowerCase().includes(busqueda.toLowerCase());
    const matchesFiltro = filtro === 'Todos' || p.estado === filtro;
    return matchesBusqueda && matchesFiltro;
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-poppins text-slate-800 flex flex-col">
      <AdminNavbar />
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
        <button onClick={() => navigate('/locked_cellar')} className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-brand-orange mb-8 transition-colors">← Volver al Panel</button>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Gestión de Ventas</h1>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Órdenes y membresías activas</p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <input 
              type="text" 
              placeholder="Buscar N° Orden o Socio..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-orange w-full md:w-72 shadow-sm transition-all"
            />
            <div className="flex bg-white shadow-sm border border-slate-200 p-1 rounded-xl">
              {['Todos', 'Pendiente', 'En Preparación', 'Enviado'].map(f => (
                <button key={f} onClick={() => setFiltro(f)} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${filtro === f ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>{f}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pedidosFiltrados.map(p => (
            <div key={p.id} onClick={() => setPedidoSeleccionado(p)} className="bg-white border border-slate-200 p-7 rounded-2xl cursor-pointer hover:border-brand-orange hover:shadow-xl transition-all group relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <span className="text-[10px] font-black text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg tracking-wider">#{p.id.slice(0, 5).toUpperCase()}</span>
                <span className={`text-[10px] font-black uppercase tracking-widest ${p.estado === 'Enviado' ? 'text-green-500' : 'text-brand-orange'}`}>{p.estado}</span>
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-1">{p.formData?.nombre} {p.formData?.apellido}</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6">Socio: {p.numeroCliente}</p>
              <div className="flex justify-between items-end border-t border-slate-50 pt-5">
                <div>
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-1">Monto Venta</span>
                    <p className="text-2xl font-black text-slate-900">${p.totalFinal?.toLocaleString()}</p>
                </div>
                <span className="text-[10px] font-black text-brand-orange uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform">Ver detalle</span>
              </div>
            </div>
          ))}
        </div>
      </main>
      <DetallePedidoDrawer pedido={pedidoSeleccionado} onClose={() => setPedidoSeleccionado(null)} onActualizarEstado={actualizarEstado} />
    </div>
  );
}