import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../components/layout/AdminNavbar';
import { enviarMailBrevo } from '../services/brevoService';

export function DetallePedidoDrawer({ pedido, onClose, onActualizarEstado, setPedidoSeleccionado }) {
  if (!pedido) return null;
  const numeroOrden = pedido.id.slice(0, 5).toUpperCase();

  const [fechaEnvio, setFechaEnvio] = useState('');
  const [rangoHora, setRangoHora] = useState('');

  // 1. RE-ENVIAR TRACKING GENERAL
  const handleResendTracking = async () => {
    const template = pedido.tipo === 'suscripcion' ? 2 : 1;
    const exito = await enviarMailBrevo({
      toEmail: pedido.clienteEmail,
      toName: `${pedido.formData.nombre} ${pedido.formData.apellido}`,
      templateId: template,
      params: { 
        nombre: pedido.formData.nombre, 
        orden: numeroOrden, 
        pin: pedido.numeroCliente, 
        link_tracking: `${import.meta.env.VITE_BASE_URL}/pedido/${pedido.id}` 
      }
    });
    if (exito) alert("Link de seguimiento re-enviado con éxito.");
  };

  // 2. RECORDAR PAGO (Template #3)
  const handleRecordarPago = async () => {
    const exito = await enviarMailBrevo({
      toEmail: pedido.clienteEmail,
      toName: pedido.formData.nombre,
      templateId: 3, 
      params: { nombre: pedido.formData.nombre, orden: numeroOrden, total: pedido.totalFinal }
    });
    if (exito) alert("Recordatorio de pago enviado con éxito.");
  };

  // 3. CONFIRMAR PAGO APROBADO (Template #4)
  const handleConfirmarPago = async () => {
    try {
      await updateDoc(doc(db, 'pedidos', pedido.id), { pagoAprobado: true });
      
      if (typeof setPedidoSeleccionado === 'function') {
        setPedidoSeleccionado(prev => ({ ...prev, pagoAprobado: true }));
      }
      
      const exito = await enviarMailBrevo({
        toEmail: pedido.clienteEmail,
        toName: pedido.formData.nombre,
        templateId: 4, 
        params: { nombre: pedido.formData.nombre, orden: numeroOrden, metodo: pedido.formData.pago }
      });
      if (exito) alert("Pago aprobado y notificación enviada con éxito.");
    } catch (error) {
      console.error(error);
      alert("Error al confirmar el pago.");
    }
  };

  // 4. NOTIFICAR ENVÍO LOGÍSTICO (Template #5)
  const handleNotificarEnvio = async () => {
    if (!fechaEnvio || !rangoHora) {
      alert("Por favor completa la fecha y el horario de entrega.");
      return;
    }

    try {
      // Guardamos la fecha y hora en Firebase
      await updateDoc(doc(db, 'pedidos', pedido.id), { 
        fechaEnvio: fechaEnvio, 
        rangoHora: rangoHora 
      });

      const exito = await enviarMailBrevo({
          toEmail: pedido.clienteEmail,
          toName: pedido.formData.nombre,
          templateId: 5, 
          params: { 
            nombre: pedido.formData.nombre, 
            orden: numeroOrden, 
            fecha: fechaEnvio, 
            horario: rangoHora, 
            link_tracking: `${import.meta.env.VITE_BASE_URL}/pedido/${pedido.id}` 
          }
      });
      
      if (exito) {
        setFechaEnvio('');
        setRangoHora('');
        alert("Notificación de envío logístico enviada al cliente.");
      }
    } catch (error) {
      console.error(error);
      alert("Error al procesar el envío.");
    }
  };

  // 5. ELIMINAR PEDIDO
  const handleEliminarPedido = async () => {
    const confirmar = window.confirm(`¿Estás seguro de eliminar la orden #${numeroOrden}? Esta acción borrará la venta definitivamente y no aparecerá en tus reportes.`);
    if (confirmar) {
      try {
        await deleteDoc(doc(db, 'pedidos', pedido.id));
        onClose(); 
        alert("Pedido eliminado correctamente.");
      } catch (error) {
        console.error(error);
        alert("Error al intentar eliminar el pedido.");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex justify-end font-poppins text-slate-900">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col">
        
        <div className="p-8 border-b flex justify-between items-center bg-white sticky top-0 z-20">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Orden #{numeroOrden}</h2>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">Socio: {pedido.numeroCliente}</p>
          </div>
          <button onClick={onClose} className="text-3xl text-slate-300 hover:text-slate-900 transition-colors">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          
          <section className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Gestión de Pago</h4>
            <div className="flex gap-3">
              <button 
                onClick={handleConfirmarPago}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${pedido.pagoAprobado ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-white border text-slate-600 hover:border-green-500'}`}
              >
                {pedido.pagoAprobado ? '✓ Pago Aprobado' : 'Aprobar Pago'}
              </button>
              <button onClick={handleRecordarPago} className="px-4 py-3 bg-white border border-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase hover:text-brand-orange transition-colors">
                Recordar Pago
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-3 font-bold uppercase tracking-wider">
              Método elegido: <span className="text-slate-700">{pedido.formData?.pago}</span>
            </p>
          </section>

          <section className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Estado Logístico</h4>
            <select 
              value={pedido.estado}
              onChange={(e) => onActualizarEstado(pedido.id, e.target.value, pedido)}
              className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none mb-4 focus:border-brand-orange transition-colors cursor-pointer"
            >
              <option value="Pendiente">Pendiente</option>
              <option value="En Preparación">En Preparación</option>
              <option value="Enviado">Enviado</option>
              <option value="Entregado">Entregado</option>
            </select>

            {pedido.estado === 'Enviado' && (
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-200 animate-in fade-in slide-in-from-top-2">
                <h4 className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Notificar Envío</h4>
                <input type="text" placeholder="Fecha (Ej: Jueves 12)" value={fechaEnvio} onChange={(e)=>setFechaEnvio(e.target.value)} className="p-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-brand-orange" />
                <input type="text" placeholder="Horario (Ej: 14 a 18hs)" value={rangoHora} onChange={(e)=>setRangoHora(e.target.value)} className="p-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-brand-orange" />
                <button 
                  onClick={handleNotificarEnvio}
                  className="col-span-2 bg-slate-900 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors mt-2"
                >
                  Enviar Email de Logística
                </button>
              </div>
            )}
          </section>

          <section>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 mb-4">Contenido del Pedido</h4>
            {pedido.cart ? pedido.cart.map((item, i) => (
              <div key={i} className="flex justify-between text-sm py-2">
                <span className="text-slate-600"><strong className="text-slate-900">{item.cantidad}x</strong> {item.nombre}</span>
                <span className="font-bold text-slate-900">${(item.precioFinal * item.cantidad).toLocaleString()}</span>
              </div>
            )) : (
              <div className="text-sm py-2 text-slate-600 font-bold">Membresía: {pedido.plan}</div>
            )}
          </section>
          
          <div className="space-y-3 pt-4">
            <button onClick={handleResendTracking} className="w-full py-4 border-2 border-dashed border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:border-brand-orange hover:text-brand-orange transition-all">
              Re-enviar Link de Seguimiento
            </button>

            <button 
                onClick={handleEliminarPedido}
                className="w-full py-4 text-red-400 hover:text-red-600 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Eliminar Venta
            </button>
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

  const actualizarEstado = async (id, nuevoEstado, pedidoActual) => {
    try {
      await updateDoc(doc(db, 'pedidos', id), { estado: nuevoEstado });
      
      if (pedidoSeleccionado?.id === id) {
        setPedidoSeleccionado(prev => ({ ...prev, estado: nuevoEstado }));
      }

      const numeroOrden = id.slice(0, 5).toUpperCase();

      if (nuevoEstado === 'En Preparación' && pedidoActual) {
        const exito = await enviarMailBrevo({
          toEmail: pedidoActual.clienteEmail,
          toName: pedidoActual.formData.nombre,
          templateId: 7,
          params: { nombre: pedidoActual.formData.nombre, orden: numeroOrden }
        });
        if (exito) alert("Correo de 'En Preparación' enviado.");
      } 
      else if (nuevoEstado === 'Entregado' && pedidoActual) {
        const exito = await enviarMailBrevo({
          toEmail: pedidoActual.clienteEmail,
          toName: pedidoActual.formData.nombre,
          templateId: 6,
          params: { nombre: pedidoActual.formData.nombre, orden: numeroOrden }
        });
        if (exito) alert("Correo de 'Pedido Entregado' enviado.");
      }
      
    } catch (error) {
      console.error(error);
      alert("Hubo un error al actualizar.");
    }
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
            <div className="flex bg-white shadow-sm border border-slate-200 p-1 rounded-xl overflow-x-auto">
              {['Todos', 'Pendiente', 'En Preparación', 'Enviado', 'Entregado'].map(f => (
                <button key={f} onClick={() => setFiltro(f)} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${filtro === f ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>{f}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pedidosFiltrados.map(p => (
            <div key={p.id} onClick={() => setPedidoSeleccionado(p)} className="bg-white border border-slate-200 p-7 rounded-2xl cursor-pointer hover:border-brand-orange hover:shadow-xl transition-all group relative overflow-hidden flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <span className="text-[10px] font-black text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg tracking-wider">#{p.id.slice(0, 5).toUpperCase()}</span>
                <div className="flex flex-col items-end">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${p.estado === 'Entregado' ? 'text-green-500' : p.estado === 'Enviado' ? 'text-blue-500' : 'text-brand-orange'}`}>{p.estado}</span>
                  {p.pagoAprobado && <span className="text-[8px] font-black uppercase text-green-500 mt-1 bg-green-50 px-2 py-0.5 rounded">Pago OK</span>}
                </div>
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-1">{p.formData?.nombre} {p.formData?.apellido}</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6">Socio: {p.numeroCliente}</p>
              <div className="mt-auto flex justify-between items-end border-t border-slate-50 pt-5">
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
      
      <DetallePedidoDrawer 
        pedido={pedidoSeleccionado} 
        onClose={() => setPedidoSeleccionado(null)} 
        onActualizarEstado={actualizarEstado} 
        setPedidoSeleccionado={setPedidoSeleccionado} 
      />
    </div>
  );
}