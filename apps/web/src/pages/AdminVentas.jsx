import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { db } from '@decant/firebase-client';

import { collection, query, orderBy, onSnapshot, doc, deleteDoc, getDocs, writeBatch, increment } from 'firebase/firestore';
import AdminNavbar from '../components/layout/AdminNavbar';

// IMPORTACIONES DE DRAWERS
import DrawerNuevaVenta from '../components/admin/DrawerNuevaVenta';
import DrawerDetalleVenta from '../components/admin/DrawerDetalleVenta';

export default function AdminVentas() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  
  // 👉 NUEVO: Estado dedicado para el buscador de productos en administración
  const [productosBusqueda, setProductosBusqueda] = useState([]);

  // Estados de Modales
  const [isNuevaVentaOpen, setIsNuevaVentaOpen] = useState(false);
  const [isDetalleOpen, setIsDetalleOpen] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);

  useEffect(() => {
    // 1. CARGA DE ÍNDICE DE PRODUCTOS (Para el buscador de ventas manuales)
    const cargarIndiceProductos = async () => {
      try {
        const q = query(collection(db, 'productos'), orderBy('nombre', 'asc'));
        const snap = await getDocs(q);
        const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setProductosBusqueda(lista);
      } catch (err) {
        console.error("Error cargando índice para ventas:", err);
      }
    };
    cargarIndiceProductos();

    // 2. Escuchar Pedidos en tiempo real
    const q = query(collection(db, 'pedidos'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPedidos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isNuevaVentaOpen]);

  const filtered = useMemo(() => 
    pedidos.filter(p => {
      const searchStr = busqueda.toLowerCase();
      return (
        (p.clienteEmail?.toLowerCase() || '').includes(searchStr) ||
        (p.formData?.nombre?.toLowerCase() || '').includes(searchStr) ||
        (p.formData?.apellido?.toLowerCase() || '').includes(searchStr) ||
        (p.id.toLowerCase().includes(searchStr))
      );
    }), [pedidos, busqueda]
  );

 const handleEliminarVenta = async (pedidoId) => {
    const primeraConfirmacion = window.confirm("⚠️ ATENCIÓN: ¿Estás seguro de querer eliminar esta venta?");
    if (!primeraConfirmacion) return;

    // Cambiamos el mensaje porque AHORA SÍ restaura el stock
    const segundaConfirmacion = window.confirm("🚨 Esta acción eliminará el pedido y RESTAURARÁ el stock de los productos. ¿Proceder?");
    if (!segundaConfirmacion) return;

    try {
      const batch = writeBatch(db);

      // 1. Recorremos el carrito del pedido para devolver el stock
      if (pedidoSeleccionado && pedidoSeleccionado.cart) {
        pedidoSeleccionado.cart.forEach(item => {
          const prodRef = doc(db, 'productos', item.id);
          batch.update(prodRef, { stock: increment(item.cantidad) });
        });
      }

      // 2. Agregamos la eliminación del pedido al lote
      const pedidoRef = doc(db, 'pedidos', pedidoId);
      batch.delete(pedidoRef);

      // 3. Ejecutamos todo de golpe
      await batch.commit();

      setIsDetalleOpen(false);
      setPedidoSeleccionado(null);
      alert("Venta eliminada y stock restaurado correctamente.");
    } catch (error) {
      console.error("Error al eliminar la venta:", error);
      alert("Hubo un error al intentar eliminar la venta y restaurar el stock.");
    }
  };

  const handleReenviarTracking = async (pedido) => {
    if (!window.confirm(`¿Reenviar email de seguimiento a ${pedido.clienteEmail}?`)) return;
    const functionUrl = import.meta.env.VITE_FUNCTIONS_URL;
    const baseUrl = window.location.origin;

    try {
      const res = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: pedido.clienteEmail,
          toName: `${pedido.formData?.nombre || ''} ${pedido.formData?.apellido || ''}`.trim(),
          templateId: 1,
          params: { 
            nombre: pedido.formData?.nombre || '', 
            orden: pedido.id.slice(0, 5).toUpperCase(), 
            link_tracking: `${baseUrl}/pedido/${pedido.id}`
          }
        })
      });
      if (res.ok) alert("Tracking reenviado.");
      else alert("Error al enviar email.");
    } catch (error) {
      alert("Error de red.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FA] font-poppins text-slate-900 flex flex-col relative">
      <AdminNavbar />
      <main className="flex-1 max-w-[95rem] w-full mx-auto pt-8 px-6 pb-20">
        
        <div className="mb-10">
          <Link to="/locked_cellar" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-brand-orange mb-6 outline-none">← Dashboard</Link>
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-slate-200 pb-6">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">Ventas</h1>
              <p className="text-xs font-medium text-slate-400 mt-1">Órdenes Web y Ventas Manuales.</p>
            </div>
            <button 
              onClick={() => setIsNuevaVentaOpen(true)}
              className="bg-white border-2 border-slate-900 px-6 py-3.5 font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-md"
            >
              + Nueva Venta Offline
            </button>
          </div>
        </div>

        <div className="mb-6">
          <input 
            type="text" 
            placeholder="Buscar orden..." 
            className="w-full md:w-96 p-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-orange shadow-sm"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b text-[10px] font-black uppercase text-slate-400 tracking-widest">
                <th className="p-6">Orden</th>
                <th className="p-6">Canal</th>
                <th className="p-6">Cliente</th>
                <th className="p-6">Total</th>
                <th className="p-6 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="5" className="p-20 text-center text-xs font-bold uppercase animate-pulse">Cargando ventas...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="5" className="p-20 text-center text-xs font-bold uppercase">Sin registros</td></tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-6 font-black text-sm">#{p.id.slice(0,5).toUpperCase()}</td>
                    <td className="p-6">
                      <span className={`text-[9px] font-black uppercase px-2 py-1 rounded border ${p.tipo === 'OFFLINE' ? 'bg-slate-100 text-slate-500' : 'bg-orange-50 text-brand-orange border-brand-orange/20'}`}>
                        {p.tipo || 'WEB'}
                      </span>
                    </td>
                    <td className="p-6">
                      <p className="text-sm font-bold text-slate-900">{p.formData?.nombre} {p.formData?.apellido}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{p.clienteEmail}</p>
                    </td>
                    <td className="p-6 font-black text-sm">${p.totalFinal?.toLocaleString()}</td>
                    <td className="p-6 text-right">
                      <div className="flex justify-end gap-3 items-center">
                        <button onClick={() => handleReenviarTracking(p)} className="text-light-blue hover:text-brand-orange font-black text-[9px] uppercase tracking-widest transition-colors outline-none">✉️ Tracking</button>
                        <button onClick={() => { setPedidoSeleccionado(p); setIsDetalleOpen(true); }} className="text-brand-orange font-black text-[10px] uppercase hover:underline outline-none">Detalle →</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 👉 Pasamos productosBusqueda en lugar de productos del context */}
        <DrawerNuevaVenta 
          isOpen={isNuevaVentaOpen} 
          onClose={() => setIsNuevaVentaOpen(false)} 
          productos={productosBusqueda} 
        />

        <DrawerDetalleVenta 
          isOpen={isDetalleOpen} 
          onClose={() => setIsDetalleOpen(false)} 
          pedido={pedidoSeleccionado} 
          onEliminar={() => handleEliminarVenta(pedidoSeleccionado.id)}
        />
      </main>
    </div>
  );
}