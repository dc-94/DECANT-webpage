import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../config/firebase';
import { collection, onSnapshot, doc, setDoc, addDoc, query, orderBy } from 'firebase/firestore';
import { useCatalog } from '../context/CatalogContext';
import AdminNavbar from '../components/layout/AdminNavbar';

// Drawers
import DrawerFactura from '../components/admin/DrawerFactura';
import DrawerDetalleFactura from '../components/admin/DrawerDetalleFactura';

export default function AdminFacturacion() {
  const { productos } = useCatalog();
  const [activeTab, setActiveTab] = useState('facturas'); // 'facturas' o 'proveedores'
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Estados Facturas
  const [facturas, setFacturas] = useState([]);
  const [isDrawerFacturaOpen, setIsDrawerFacturaOpen] = useState(false);
  const [facturaActiva, setFacturaActiva] = useState(null);
  const [isDetalleFacturaOpen, setIsDetalleFacturaOpen] = useState(false);

  // Estados Proveedores
  const [proveedores, setProveedores] = useState([]);
  const [modalProvAbierto, setModalProvAbierto] = useState(false);
  const [provActivo, setProvActivo] = useState(null);

  useEffect(() => {
    // Escuchar Historial de Facturas
    const qFacturas = query(collection(db, 'historial_stock'), orderBy('createdAt', 'desc'));
    const unsubFacturas = onSnapshot(qFacturas, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Filtramos solo los que son ingresos de factura
      setFacturas(docs.filter(d => d.tipo === 'INGRESO_FACTURA'));
    });

    // Escuchar Proveedores
    const unsubProv = onSnapshot(collection(db, 'proveedores'), (snap) => {
      setProveedores(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => { unsubFacturas(); unsubProv(); };
  }, []);

  // --- LÓGICA PROVEEDORES ---
  const abrirModalProv = (p) => {
    setProvActivo(p ? JSON.parse(JSON.stringify(p)) : { 
      nombre: '', cuit: '', razonSocial: '', direccion: '', vendedor: '', telefono: '', plazoPago: '' 
    });
    setModalProvAbierto(true);
  };

  const guardarProveedor = async () => {
    if (!provActivo.nombre.trim()) return alert("El nombre es obligatorio");
    setIsSaving(true);
    try {
      if (provActivo.id) await setDoc(doc(db, 'proveedores', provActivo.id), provActivo);
      else await addDoc(collection(db, 'proveedores'), provActivo);
      setModalProvAbierto(false);
    } catch (e) { console.error(e); }
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-[#F4F7FA] font-poppins text-slate-900 flex flex-col">
      <AdminNavbar />
      <main className="flex-1 max-w-[95rem] w-full mx-auto pt-8 px-6 pb-20">
        
        {/* HEADER Y TABS */}
        <div className="mb-8">
          <Link to="/locked_cellar" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-brand-orange mb-6 outline-none">← Dashboard</Link>
          
          <div className="flex flex-col md:flex-row justify-between items-end border-b border-slate-200 pb-6">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight">Facturación</h1>
              <div className="flex gap-8 mt-6">
                <button onClick={() => setActiveTab('facturas')} className={`pb-3 text-[11px] font-black uppercase tracking-widest transition-colors ${activeTab === 'facturas' ? 'border-b-2 border-brand-orange text-brand-orange' : 'text-slate-400 hover:text-slate-600'}`}>Facturas y Compras</button>
                <button onClick={() => setActiveTab('proveedores')} className={`pb-3 text-[11px] font-black uppercase tracking-widest transition-colors ${activeTab === 'proveedores' ? 'border-b-2 border-brand-orange text-brand-orange' : 'text-slate-400 hover:text-slate-600'}`}>Proveedores</button>
              </div>
            </div>
            
            {/* BOTÓN DINÁMICO SEGÚN LA PESTAÑA */}
            <button 
              onClick={() => activeTab === 'facturas' ? setIsDrawerFacturaOpen(true) : abrirModalProv(null)} 
              className="bg-slate-900 text-white px-8 py-3.5 rounded-sm font-black text-[10px] uppercase shadow-lg hover:bg-brand-orange transition-all"
            >
              {activeTab === 'facturas' ? '+ Cargar Factura' : '+ Nuevo Proveedor'}
            </button>
          </div>
        </div>

        {/* CONTENIDO DE LAS PESTAÑAS */}
        {activeTab === 'facturas' ? (
          // TABLA DE FACTURAS
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-300">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  <th className="p-6">Fecha</th>
                  <th className="p-6">Comprobante</th>
                  <th className="p-6">Proveedor</th>
                  <th className="p-6">Total</th>
                  <th className="p-6 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {facturas.length === 0 ? (
                  <tr><td colSpan="5" className="p-20 text-center text-xs font-bold uppercase text-slate-400">Aún no hay facturas cargadas</td></tr>
                ) : facturas.map(f => (
                  <tr key={f.id} className="hover:bg-slate-50/50">
                    <td className="p-6 text-sm font-bold">{new Date(f.fecha + 'T00:00:00').toLocaleDateString('es-AR')}</td>
                    <td className="p-6 text-sm font-black text-slate-700">#{f.nroFactura}</td>
                    <td className="p-6 text-sm font-bold">{f.proveedor}</td>
                    <td className="p-6 font-black text-slate-900">${f.totalFactura?.toLocaleString()}</td>
                    <td className="p-6 text-right">
                      <button 
                        onClick={() => { setFacturaActiva(f); setIsDetalleFacturaOpen(true); }} 
                        className="text-brand-orange font-black text-[10px] uppercase hover:underline"
                      >
                        Ver Detalle →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          // TABLA DE PROVEEDORES (La misma de siempre)
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-300">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  <th className="p-6">Proveedor</th>
                  <th className="p-6">CUIT / Razón Social</th>
                  <th className="p-6">Contacto</th>
                  <th className="p-6 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {proveedores.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="p-6"><p className="font-black text-sm">{p.nombre}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Plazo: {p.plazoPago}</p></td>
                    <td className="p-6 text-xs font-bold">{p.razonSocial}<br/><span className="text-[10px] text-slate-400">{p.cuit}</span></td>
                    <td className="p-6 text-xs font-bold">{p.vendedor}<br/><span className="text-[10px] text-slate-400">{p.telefono}</span></td>
                    <td className="p-6 text-right"><button onClick={() => abrirModalProv(p)} className="text-brand-orange font-black text-[10px] uppercase hover:underline">Ficha →</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* DRAWERS Y MODALES */}
      
      {/* 1. Modal Nuevo/Editar Proveedor */}
      {modalProvAbierto && provActivo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setModalProvAbierto(false)}></div>
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
            <header className="p-8 border-b bg-slate-50 flex justify-between"><div><h2 className="text-2xl font-black uppercase">Ficha Proveedor</h2></div></header>
            <div className="p-8 space-y-4 overflow-y-auto">
              <input placeholder="Nombre Comercial" className="w-full p-3 bg-slate-50 border rounded-xl font-bold outline-none" value={provActivo.nombre} onChange={(e)=>setProvActivo({...provActivo, nombre: e.target.value})}/>
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="CUIT" className="p-3 bg-slate-50 border rounded-xl outline-none" value={provActivo.cuit} onChange={(e)=>setProvActivo({...provActivo, cuit: e.target.value})}/>
                <input placeholder="Razón Social" className="p-3 bg-slate-50 border rounded-xl outline-none" value={provActivo.razonSocial} onChange={(e)=>setProvActivo({...provActivo, razonSocial: e.target.value})}/>
              </div>
              <input placeholder="Dirección" className="w-full p-3 bg-slate-50 border rounded-xl outline-none" value={provActivo.direccion} onChange={(e)=>setProvActivo({...provActivo, direccion: e.target.value})}/>
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Vendedor" className="p-3 bg-slate-50 border rounded-xl outline-none" value={provActivo.vendedor} onChange={(e)=>setProvActivo({...provActivo, vendedor: e.target.value})}/>
                <input placeholder="Teléfono" className="p-3 bg-slate-50 border rounded-xl outline-none" value={provActivo.telefono} onChange={(e)=>setProvActivo({...provActivo, telefono: e.target.value})}/>
              </div>
              <input placeholder="Plazo de Pago (Ej: 30 días)" className="w-full p-3 bg-slate-50 border rounded-xl outline-none" value={provActivo.plazoPago} onChange={(e)=>setProvActivo({...provActivo, plazoPago: e.target.value})}/>
            </div>
            <footer className="p-8 border-t bg-white flex justify-end gap-4">
               <button onClick={() => setModalProvAbierto(false)} className="text-[10px] font-black uppercase text-slate-400">Cancelar</button>
               <button onClick={guardarProveedor} disabled={isSaving} className="bg-slate-900 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase hover:bg-brand-orange">{isSaving ? 'Guardando...' : 'Guardar'}</button>
            </footer>
          </div>
        </div>
      )}

      {/* 2. Drawer de Carga de Factura (El que modificamos antes) */}
      <DrawerFactura 
        isOpen={isDrawerFacturaOpen} 
        onClose={() => setIsDrawerFacturaOpen(false)} 
        productos={productos} 
      />

      {/* 3. Drawer Visualizador de Facturas */}
      <DrawerDetalleFactura 
        isOpen={isDetalleFacturaOpen} 
        onClose={() => setIsDetalleFacturaOpen(false)} 
        factura={facturaActiva} 
      />

    </div>
  );
}
