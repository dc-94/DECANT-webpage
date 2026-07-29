import { useState, useEffect } from 'react';
import { db } from '../../config/firebase'; 
import { collection, onSnapshot, writeBatch, doc, increment, serverTimestamp, getDoc, query, where, limit, getDocs } from 'firebase/firestore';

export default function DrawerFactura({ isOpen, onClose, productos }) {
  const [cargando, setCargando] = useState(false);
  const [buscando, setBuscando] = useState(null); 
  const [mostrarResumen, setMostrarResumen] = useState(false);
  const [listaProveedores, setListaProveedores] = useState([]);
  const [resultadosRemotos, setResultadosRemotos] = useState({}); 

  const [cabecera, setCabecera] = useState({ proveedor: '', nroFactura: '', fecha: new Date().toISOString().split('T')[0] });
  const [items, setItems] = useState([{ id: '', nombre: '', cantidad: 1, valor: 0, descuento: 0, busqueda: '' }]);

  useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = onSnapshot(collection(db, 'proveedores'), (snapshot) => {
      setListaProveedores(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [isOpen]);

  // --- LÓGICA DE BÚSQUEDA HÍBRIDA POR FILA ---
  const handleBusquedaProducto = async (index, valor) => {
    const nuevosItems = [...items];
    nuevosItems[index].busqueda = valor;
    nuevosItems[index].id = ''; // 🚨 RESET DE ID: Permite que el buscador se abra de nuevo
    setItems(nuevosItems);

    const term = valor.toLowerCase().trim();
    if (term.length < 2) return;

    // Filtro local
    const locales = productos.filter(p => p.nombre.toLowerCase().includes(term));
    if (locales.length === 0) {
      setBuscando(index);
      try {
        const q = query(collection(db, 'productos'), where('nombre', '>=', valor), where('nombre', '<=', valor + '\uf8ff'), limit(5));
        const snap = await getDocs(q);
        const remotos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setResultadosRemotos(prev => ({ ...prev, [index]: remotos }));
      } catch (e) { console.error(e); }
      setBuscando(null);
    } else {
      setResultadosRemotos(prev => ({ ...prev, [index]: [] })); // Limpiamos remotos si hay locales
    }
  };

  const seleccionarProducto = (index, prod) => {
    const nuevosItems = [...items];
    nuevosItems[index] = { ...nuevosItems[index], id: prod.id, nombre: prod.nombre, busqueda: prod.nombre, valor: prod.costo || 0 };
    setItems(nuevosItems);
  };

  const calcularTotalLinea = (item) => item.cantidad * (item.valor * (1 - (item.descuento / 100)));
  const totalFactura = items.reduce((acc, item) => acc + calcularTotalLinea(item), 0);

  const handleConfirmar = async () => {
    if (!cabecera.proveedor) return alert("Selecciona un proveedor");
    setCargando(true);
    try {
      const batch = writeBatch(db);
      const movRef = doc(collection(db, 'historial_stock'));

      batch.set(movRef, {
        ...cabecera,
        items: items.map(item => ({
          ...item,
          valorFinalUnitario: (item.valor || 0) * (1 - ((item.descuento || 0) / 100)),
          totalLinea: calcularTotalLinea(item)
        })),
        totalFactura,
        tipo: 'INGRESO_FACTURA',
        createdAt: serverTimestamp()
      });

      // Usamos un loop tradicional en lugar de forEach porque necesitamos hacer "await getDoc"
      for (const item of items) {
        if (!item.id) continue;
        
        const pRef = doc(db, 'productos', item.id);
        const pSnap = await getDoc(pRef);
        
        if (pSnap.exists()) {
          const prodData = pSnap.data();
          const nuevoCosto = (item.valor || 0) * (1 - ((item.descuento || 0) / 100));
          
          // LÓGICA DE AUTO-PRICING CON EL MARGEN EXACTO DEL PRODUCTO
          const gananciaGuardada = parseFloat(prodData.ganancia) || 0;
          const descVenta = parseFloat(prodData.descuentoPorcentaje) || 0;

          const nuevoPrecioBase = nuevoCosto * (1 + (gananciaGuardada / 100));
          const nuevoPrecioFinal = nuevoPrecioBase * (1 - (descVenta / 100));

          batch.update(pRef, {
            stock: increment(item.cantidad),
            costo: nuevoCosto,
            precioBase: nuevoPrecioBase,
            precioFinal: nuevoPrecioFinal
          });
        }
      }

      await batch.commit();
      alert("Factura cargada. Stock, Costos y Precios actualizados con éxito.");
      onClose();
      setItems([{ id: '', nombre: '', cantidad: 1, valor: 0, descuento: 0, busqueda: '' }]);
      setMostrarResumen(false); // Reseteamos el estado visual
    } catch (e) {
      console.error(e);
      alert("Error al procesar la factura.");
    }
    setCargando(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex justify-end font-poppins text-slate-900">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        <header className="p-8 border-b bg-slate-50 flex justify-between items-center">
          <div><h2 className="text-2xl font-black uppercase">Ingreso de Factura</h2><p className="text-[10px] font-black text-brand-orange uppercase">Control de Compras</p></div>
          <button onClick={onClose} className="text-3xl font-light hover:text-brand-orange">×</button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-2xl border">
            <div><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Proveedor</label>
              <select className="w-full p-3 bg-white border rounded-xl text-sm font-bold outline-none" value={cabecera.proveedor} onChange={(e) => setCabecera({...cabecera, proveedor: e.target.value})}>
                <option value="">Seleccionar...</option>
                {listaProveedores.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
              </select>
            </div>
            <div><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Factura #</label>
              <input type="text" className="w-full p-3 border rounded-xl text-sm font-bold outline-none" value={cabecera.nroFactura} onChange={(e) => setCabecera({...cabecera, nroFactura: e.target.value})} /></div>
            <div><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Fecha</label>
              <input type="date" className="w-full p-3 border rounded-xl text-sm font-bold outline-none" value={cabecera.fecha} onChange={(e) => setCabecera({...cabecera, fecha: e.target.value})} /></div>
          </div>

          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-[2fr_0.8fr_1fr_1fr_1fr_auto] gap-4 items-end bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                <div className="relative">
                  <label className="text-[9px] font-black uppercase text-slate-400 mb-1 block">Producto {buscando === idx && <span className="text-brand-orange animate-pulse">...</span>}</label>
                  <input type="text" className="w-full p-2.5 border border-slate-200 rounded-lg text-xs outline-none" value={item.busqueda} onChange={(e) => handleBusquedaProducto(idx, e.target.value)} placeholder="Buscar..." />
                  
                  {item.busqueda.length > 1 && !item.id && (
                    <div className="absolute top-full left-0 w-full bg-white border shadow-2xl rounded-xl mt-1 z-50 max-h-48 overflow-y-auto">
                      {(resultadosRemotos[idx]?.length > 0 ? resultadosRemotos[idx] : productos.filter(p => p.nombre.toLowerCase().includes(item.busqueda.toLowerCase()))).map(p => (
                        <button key={p.id} onClick={() => seleccionarProducto(idx, p)} className="w-full p-3 text-left hover:bg-slate-50 text-[10px] font-black border-b uppercase">{p.nombre}</button>
                      ))}
                    </div>
                  )}
                </div>
                <div><input type="number" className="w-full p-2.5 border rounded-lg text-xs font-bold" value={item.cantidad} onChange={(e) => { const n=[...items]; n[idx].cantidad=parseInt(e.target.value); setItems(n); }} /></div>
                <div><input type="number" className="w-full p-2.5 border rounded-lg text-xs font-bold" value={item.valor} onChange={(e) => { const n=[...items]; n[idx].valor=parseFloat(e.target.value); setItems(n); }} /></div>
                <div><input type="number" className="w-full p-2.5 border rounded-lg text-xs font-bold text-green-600" value={item.descuento} onChange={(e) => { const n=[...items]; n[idx].descuento=parseFloat(e.target.value); setItems(n); }} /></div>
                <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-black text-right">${calcularTotalLinea(item).toLocaleString()}</div>
                <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="p-2.5 text-slate-300 hover:text-red-500">✕</button>
              </div>
            ))}
            <button onClick={()=>setItems([...items, { id:'', nombre:'', cantidad:1, valor:0, descuento:0, busqueda:'' }])} className="w-full py-4 border-2 border-dashed border-slate-200 text-slate-400 text-[10px] font-black uppercase rounded-2xl hover:border-brand-orange hover:text-brand-orange">+ Agregar Item</button>
          </div>
        </div>

        <footer className="p-8 border-t bg-white">
          <div className="flex justify-between items-center mb-6">
            <span className="text-slate-400 font-black text-[10px] uppercase">Total Factura</span>
            <span className="text-3xl font-black text-slate-900">${totalFactura.toLocaleString()}</span>
          </div>
          
          {/* 👉 AQUÍ ESTÁ EL ARREGLO: Renderizado condicional de los botones */}
          {!mostrarResumen ? (
            <button 
              onClick={() => setMostrarResumen(true)} 
              className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-[10px] shadow-xl hover:bg-brand-orange transition-all"
            >
              Revisar y Confirmar
            </button>
          ) : (
            <div className="flex gap-3 animate-in fade-in zoom-in duration-200">
              <button 
                onClick={() => setMostrarResumen(false)} 
                className="flex-1 bg-slate-100 text-slate-600 py-5 rounded-2xl font-black uppercase text-[10px] hover:bg-slate-200 transition-colors"
              >
                Atrás
              </button>
              <button 
                onClick={handleConfirmar} 
                disabled={cargando} 
                className="flex-[2] bg-brand-orange text-white py-5 rounded-2xl font-black uppercase text-[10px] hover:bg-slate-900 transition-all shadow-lg"
              >
                {cargando ? 'Procesando Ingreso...' : 'Confirmar Ingreso a Stock'}
              </button>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}