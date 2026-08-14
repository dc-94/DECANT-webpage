import { useState, useEffect } from 'react';
import { db } from '@decant/firebase-client';
import { collection, onSnapshot, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../components/layout/AdminNavbar';
import DrawerDetalleVenta from '../components/admin/DrawerDetalleVenta'; 
import { toastOk, toastError } from '@/utils/toast';
import { sanearParaUpdate, CAMPOS_EDITABLES_CLIENTE } from '@/utils/sanitize';

export default function AdminClientes() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [editData, setEditData] = useState({}); 
  const [historialPedidos, setHistorialPedidos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const [ventaParaVer, setVentaParaVer] = useState(null);
  const [isDetalleVentaOpen, setIsDetalleVentaOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'clientes'), (snapshot) => {
      setClientes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (clienteSeleccionado) {
      setEditData({ ...clienteSeleccionado });
      const fetchHistorial = async () => {
        const q = query(collection(db, 'pedidos'), where('numeroCliente', '==', clienteSeleccionado.numeroCliente));
        const snap = await getDocs(q);
        setHistorialPedidos(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => b.createdAt?.seconds - a.createdAt?.seconds));
      };
      fetchHistorial();
    }
  }, [clienteSeleccionado]);

  const isDirty = (campo) => {
    return editData[campo] !== clienteSeleccionado[campo];
  };

  const handleGuardarCambios = async () => {
    setIsSaving(true);
    try {
      const clienteRef = doc(db, 'clientes', clienteSeleccionado.id);
       const datosLimpios = sanearParaUpdate(editData, CAMPOS_EDITABLES_CLIENTE);
      await updateDoc(clienteRef, datosLimpios);
      toastOk("Ficha actualizada.");
      setClienteSeleccionado(null);
    } catch (error) { 
        console.error(error);
        toastError("Error al guardar.");
      } finally {
        setIsSaving(false);
      }
    };

  const handleEliminarCliente = async () => {
    if (window.confirm(`¿Eliminar a ${clienteSeleccionado.nombre}?`)) {
      await deleteDoc(doc(db, 'clientes', clienteSeleccionado.id));
      setClienteSeleccionado(null);
    }
  };

  const clientesFiltrados = clientes.filter(c => 
    (c.nombre + c.apellido + c.email + (c.numeroCliente || '')).toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-poppins text-slate-800 flex flex-col">
      <AdminNavbar />
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
        <button onClick={() => navigate('/locked_cellar')} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-orange mb-8 outline-none">← Volver al Panel</button>
        
        <div className="flex flex-col md:flex-row justify-between mb-10 gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Base de Clientes</h1>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Gestión de Perfiles y CRM</p>
          </div>
          <input 
            type="text" 
            placeholder="Buscar socio..." 
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-orange w-full md:w-80 shadow-sm"
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b text-[10px] font-black uppercase tracking-widest text-slate-400">
              <tr>
                <th className="px-8 py-5">PIN</th>
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
                  <td className="px-8 py-5">{c.badge ? <span className="bg-orange-100 text-orange-700 text-[9px] px-3 py-1.5 rounded-lg font-black uppercase tracking-widest">{c.badge}</span> : <span className="text-slate-300 font-bold uppercase text-[10px]">Sin Club</span>}</td>
                  <td className="px-8 py-5 text-right"><button onClick={() => setClienteSeleccionado(c)} className="text-brand-orange text-[10px] font-black uppercase tracking-widest hover:underline outline-none">VER</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* DRAWER CRM 360 */}
      {clienteSeleccionado && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setClienteSeleccionado(null)} />
          <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col font-poppins">
            
            <div className="p-6 border-b flex justify-between bg-slate-50 shrink-0">
              <div>
                <p className="text-[16px] font-black uppercase text-brand-orange ">Socio N° {clienteSeleccionado.numeroCliente}</p>
              </div>
              <button onClick={() => setClienteSeleccionado(null)} className="text-slate-400 hover:text-slate-900 text-2xl outline-none">×</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              <section>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 mb-4">Contacto</h4>
                <div className="grid grid-cols-2 gap-3">
                  {['nombre', 'apellido', 'email', 'telefono'].map((field) => (
                    <div key={field} className={`flex flex-col gap-1 ${field === 'email' || field === 'telefono' ? 'col-span-2' : ''}`}>
                      <label className="text-[9px] font-black uppercase text-slate-400 ml-1">{field}</label>
                      <input 
                        type="text" 
                        value={editData[field] || ''} 
                        onChange={(e) => setEditData({...editData, [field]: e.target.value})} 
                        className={`p-2.5 bg-slate-50 border rounded-xl text-xs font-bold outline-none transition-all ${isDirty(field) ? 'border-brand-orange ring-1 ring-brand-orange/20' : 'border-slate-200'}`} 
                      />
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 mb-4">Dirección de Envío</h4>
                <div className="grid grid-cols-6 gap-3">
                  <div className="col-span-4 flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Calle / Dirección</label>
                    <input type="text" value={editData.direccion || ''} onChange={(e) => setEditData({...editData, direccion: e.target.value})} className={`p-2.5 bg-slate-50 border rounded-xl text-xs font-bold outline-none ${isDirty('direccion') ? 'border-brand-orange' : 'border-slate-200'}`} />
                  </div>
                  <div className="col-span-2 flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Nro / Depto</label>
                    <input type="text" value={editData.numero || ''} onChange={(e) => setEditData({...editData, numero: e.target.value})} className={`p-2.5 bg-slate-50 border rounded-xl text-xs font-bold outline-none ${isDirty('numero') ? 'border-brand-orange' : 'border-slate-200'}`} />
                  </div>
                  <div className="col-span-3 flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Ciudad</label>
                    <input type="text" value={editData.ciudad || ''} onChange={(e) => setEditData({...editData, ciudad: e.target.value})} className={`p-2.5 bg-slate-50 border rounded-xl text-xs font-bold outline-none ${isDirty('ciudad') ? 'border-brand-orange' : 'border-slate-200'}`} />
                  </div>
                  <div className="col-span-3 flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1">CP</label>
                    <input type="text" value={editData.cp || ''} onChange={(e) => setEditData({...editData, cp: e.target.value})} className={`p-2.5 bg-slate-50 border rounded-xl text-xs font-bold outline-none ${isDirty('cp') ? 'border-brand-orange' : 'border-slate-200'}`} />
                  </div>
                </div>
              </section>

              {/* 👉 HISTORIAL INTERACTIVO ACTUALIZADO CON COMPROBANTES DE PAGO */}
              <section>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 mb-4">Historial de Pedidos</h4>
                <div className="space-y-3">
                  {historialPedidos.map(p => (
                    <div key={p.id} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-slate-300 transition-all">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <p className="text-[11px] font-black text-slate-900 uppercase tracking-wide">Orden #{p.id.slice(0,5).toUpperCase()}</p>
                          {/* Etiqueta Visual de Estado */}
                          <span className={`text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-widest ${p.estado === 'Pagado' ? 'bg-green-100 text-green-700' : p.estado === 'Cancelado' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                            {p.estado}
                          </span>
                        </div>
                        
                        {/* Detalles de la Transacción Financiera */}
                        {p.estado === 'Pagado' ? (
                          <p className="text-[9px] font-bold text-slate-500">
                            Vía {p.metodoPago || 'No registrada'} {p.numeroOperacion ? `• Ref: #${p.numeroOperacion}` : ''}
                          </p>
                        ) : (
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            {new Date(p.createdAt?.seconds * 1000).toLocaleDateString('es-AR')}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <p className="text-sm font-black text-slate-900">${p.totalFinal?.toLocaleString()}</p>
                        <button 
                          onClick={() => { setVentaParaVer(p); setIsDetalleVentaOpen(true); }}
                          className="text-[9px] font-black text-brand-orange hover:underline outline-none uppercase tracking-widest"
                        >
                          Ver Detalle
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {historialPedidos.length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-4">No hay compras registradas.</p>
                  )}
                </div>
              </section>
            </div>

            <div className="p-6 border-t bg-white flex gap-3 shrink-0">
              <button onClick={handleEliminarCliente} className="flex-1 py-3 border border-red-100 text-red-400 hover:bg-red-50 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all outline-none">Eliminar</button>
              <button onClick={handleGuardarCambios} disabled={isSaving} className="flex-[2] py-3 bg-slate-900 text-white hover:bg-brand-orange text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg transition-all disabled:opacity-50 outline-none">
                {isSaving ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPONENTE REUTILIZADO PARA VER EL DETALLE DE LA VENTA */}
      <DrawerDetalleVenta 
        isOpen={isDetalleVentaOpen} 
        onClose={() => setIsDetalleVentaOpen(false)} 
        pedido={ventaParaVer} 
      />
    </div>
  );
}