import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, onSnapshot, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../components/layout/AdminNavbar';

// URL de tu servidor seguro
const BACKEND_URL = 'https://enviarconfirmacionpedido-jztey4742a-uc.a.run.app';

export default function AdminClientes() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [historialPedidos, setHistorialPedidos] = useState([]);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'clientes'), (snapshot) => {
      setClientes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (clienteSeleccionado) {
      const fetchHistorial = async () => {
        const q = query(collection(db, 'pedidos'), where('numeroCliente', '==', clienteSeleccionado.numeroCliente));
        const snap = await getDocs(q);
        setHistorialPedidos(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => b.createdAt?.seconds - a.createdAt?.seconds));
      };
      fetchHistorial();
    }
  }, [clienteSeleccionado]);

  const actualizarEstadoPedido = async (id, nuevoEstado, pedidoActual) => {
    try {
      await updateDoc(doc(db, 'pedidos', id), { estado: nuevoEstado });
      
      setHistorialPedidos(prev => prev.map(p => p.id === id ? { ...p, estado: nuevoEstado } : p));
      if (ventaSeleccionada?.id === id) {
        setVentaSeleccionada(prev => ({ ...prev, estado: nuevoEstado }));
      }

      const numeroOrden = id.slice(0, 5).toUpperCase();

      if (nuevoEstado === 'En Preparación' && pedidoActual) {
        await fetch(BACKEND_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toEmail: pedidoActual.clienteEmail,
            toName: pedidoActual.formData.nombre,
            templateId: 7,
            params: { nombre: pedidoActual.formData.nombre, orden: numeroOrden }
          })
        });
        alert("Correo de 'En Preparación' enviado.");
      } 
      else if (nuevoEstado === 'Entregado' && pedidoActual) {
        await fetch(BACKEND_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toEmail: pedidoActual.clienteEmail,
            toName: pedidoActual.formData.nombre,
            templateId: 6,
            params: { nombre: pedidoActual.formData.nombre, orden: numeroOrden }
          })
        });
        alert("Correo de 'Pedido Entregado' enviado.");
      }
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      alert("Hubo un error al actualizar el estado.");
    }
  };

  const handleEliminarCliente = async () => {
    const confirmar = window.confirm(`¿Estás seguro de eliminar a ${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}? Esta acción borrará su ficha de cliente definitivamente.`);
    
    if (confirmar) {
      try {
        await deleteDoc(doc(db, 'clientes', clienteSeleccionado.id));
        setClienteSeleccionado(null);
        alert("Cliente eliminado correctamente.");
      } catch (error) {
        console.error("Error al eliminar cliente:", error);
        alert("Hubo un error al intentar eliminar el cliente.");
      }
    }
  };

  const clientesFiltrados = clientes.filter(c => (c.nombre + c.apellido + c.email + c.numeroCliente).toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-poppins text-slate-800 flex flex-col">
      <AdminNavbar />
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
        <button onClick={() => navigate('/locked_cellar')} className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-brand-orange mb-8 transition-colors">← Volver al Panel</button>
        
        <div className="flex flex-col md:flex-row justify-between mb-10 gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Base de Clientes</h1>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Perfiles de socios registrados</p>
          </div>
          <input 
            type="text" 
            placeholder="Buscar por nombre o PIN..." 
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-orange w-full md:w-80 shadow-sm"
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
              <tr>
                <th className="px-8 py-5">Socio</th>
                <th className="px-8 py-5">Nombre y Apellido</th>
                <th className="px-8 py-5">Membresía</th>
                <th className="px-8 py-5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {clientesFiltrados.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-5"><span className="font-bold text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg tracking-widest">{c.numeroCliente}</span></td>
                  <td className="px-8 py-5 font-bold text-slate-900">{c.nombre} {c.apellido}</td>
                  <td className="px-8 py-5">{c.badge ? <span className="bg-orange-100 text-orange-700 text-[9px] px-3 py-1.5 rounded-lg font-black uppercase tracking-[0.2em]">{c.badge}</span> : <span className="text-slate-300 font-bold uppercase text-[10px]">Sin Club</span>}</td>
                  <td className="px-8 py-5 text-right"><button onClick={() => setClienteSeleccionado(c)} className="text-brand-orange text-[10px] font-black tracking-[0.3em] uppercase hover:underline">Ver Ficha</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {clienteSeleccionado && (
        <div className="fixed inset-0 z-[100] flex justify-end font-poppins">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setClienteSeleccionado(null)} />
          <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            
            <div className="p-8 border-b flex justify-between bg-slate-50 sticky top-0">
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{clienteSeleccionado.nombre} {clienteSeleccionado.apellido}</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">Socio N° {clienteSeleccionado.numeroCliente}</p>
              </div>
              <button onClick={() => setClienteSeleccionado(null)} className="text-slate-400 hover:text-slate-900 text-3xl">×</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-3 mb-6">Historial de Compras</h4>
              <div className="space-y-4">
                {historialPedidos.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 text-sm font-medium italic">No se registran compras todavía.</div>
                ) : historialPedidos.map(p => (
                  <div key={p.id} onClick={() => setVentaSeleccionada(p)} className="flex justify-between items-center p-6 bg-white border border-slate-100 rounded-2xl cursor-pointer hover:border-brand-orange hover:shadow-lg transition-all">
                    <div>
                      <p className="text-sm font-bold text-slate-900">Orden #{p.id.slice(0,5).toUpperCase()}</p>
                      <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase">{new Date(p.createdAt?.seconds * 1000).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-slate-900">${p.totalFinal?.toLocaleString()}</p>
                      <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${p.estado === 'Enviado' ? 'text-blue-500' : p.estado === 'Entregado' ? 'text-green-500' : 'text-brand-orange'}`}>{p.estado}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 border-t bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
              <button 
                  onClick={handleEliminarCliente}
                  className="w-full py-4 text-red-400 hover:text-red-600 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
              >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Eliminar Cliente
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}