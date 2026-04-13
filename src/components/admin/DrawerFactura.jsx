import { useState, useEffect } from 'react';
import { db } from '../../config/firebase'; // Ruta corregida
import { collection, onSnapshot, writeBatch, doc, increment, serverTimestamp } from 'firebase/firestore';

export default function DrawerFactura({ isOpen, onClose, productos }) {
  const [cargando, setCargando] = useState(false);
  const [mostrarResumen, setMostrarResumen] = useState(false);
  
  // 👉 Estado para proveedores reales de la DB
  const [listaProveedores, setListaProveedores] = useState([]);
  
  const [cabecera, setCabecera] = useState({
    proveedor: '',
    nroFactura: '',
    fecha: new Date().toISOString().split('T')[0]
  });

  const [items, setItems] = useState([
    { id: '', nombre: '', cantidad: 1, valor: 0, descuento: 0, busqueda: '' }
  ]);

  // 1. Escuchar proveedores de Firebase
  useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = onSnapshot(collection(db, 'proveedores'), (snapshot) => {
      setListaProveedores(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [isOpen]);

  const agregarFila = () => {
    setItems([...items, { id: '', nombre: '', cantidad: 1, valor: 0, descuento: 0, busqueda: '' }]);
  };

  const eliminarFila = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const actualizarItem = (index, campo, valor) => {
    const nuevosItems = [...items];
    nuevosItems[index][campo] = valor;
    setItems(nuevosItems);
  };

  const seleccionarProducto = (index, prod) => {
    const nuevosItems = [...items];
    nuevosItems[index].id = prod.id;
    nuevosItems[index].nombre = prod.nombre;
    nuevosItems[index].busqueda = prod.nombre;
    nuevosItems[index].valor = prod.costo || 0;
    setItems(nuevosItems);
  };

  const calcularValorFinalUnitario = (item) => item.valor - item.descuento;
  const calcularTotalLinea = (item) => item.cantidad * calcularValorFinalUnitario(item);
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
          valorFinalUnitario: calcularValorFinalUnitario(item),
          totalLinea: calcularTotalLinea(item)
        })),
        totalFactura,
        tipo: 'INGRESO_FACTURA',
        createdAt: serverTimestamp()
      });

      items.forEach(item => {
        if (!item.id) return;
        const pRef = doc(db, 'productos', item.id);
        batch.update(pRef, {
          stock: increment(item.cantidad),
          costo: calcularValorFinalUnitario(item)
        });
      });

      await batch.commit();
      alert("Factura cargada y stock actualizado.");
      onClose();
      setItems([{ id: '', nombre: '', cantidad: 1, valor: 0, descuento: 0, busqueda: '' }]);
      setMostrarResumen(false);
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
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight">Ingreso de Factura</h2>
            <p className="text-[10px] font-black text-brand-orange uppercase tracking-widest">Control de Compras</p>
          </div>
          <button onClick={onClose} className="text-3xl font-light hover:text-brand-orange transition-colors">×</button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* CABECERA */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Proveedor</label>
              <select 
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-orange font-bold"
                value={cabecera.proveedor}
                onChange={(e) => setCabecera({...cabecera, proveedor: e.target.value})}
              >
                <option value="">Seleccionar Proveedor...</option>
                {listaProveedores.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Nro Factura</label>
              <input type="text" className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none font-bold" value={cabecera.nroFactura} onChange={(e) => setCabecera({...cabecera, nroFactura: e.target.value})} />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Fecha</label>
              <input type="date" className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none font-bold" value={cabecera.fecha} onChange={(e) => setCabecera({...cabecera, fecha: e.target.value})} />
            </div>
          </div>

          {/* ITEMS */}
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-[2fr_0.8fr_1fr_1fr_1fr_auto] gap-4 items-end bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                <div className="relative">
                  <label className="text-[9px] font-black uppercase text-slate-400 mb-1 block">Producto</label>
                  <input type="text" className="w-full p-2.5 border border-slate-200 rounded-lg text-xs outline-none" value={item.busqueda} onChange={(e) => actualizarItem(index, 'busqueda', e.target.value)} placeholder="Buscar..." />
                  {item.busqueda.length > 2 && !item.id && (
                    <div className="absolute top-full left-0 w-full bg-white border shadow-2xl rounded-xl mt-1 z-50 max-h-48 overflow-y-auto">
                      {productos.filter(p => p.nombre.toLowerCase().includes(item.busqueda.toLowerCase())).map(p => (
                        <button key={p.id} onClick={() => seleccionarProducto(index, p)} className="w-full p-3 text-left hover:bg-slate-50 text-[10px] font-black border-b last:border-0 uppercase">{p.nombre}</button>
                      ))}
                    </div>
                  )}
                </div>
                <div><label className="text-[9px] font-black uppercase text-slate-400 mb-1 block">Cant.</label><input type="number" className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-bold" value={item.cantidad} onChange={(e) => actualizarItem(index, 'cantidad', parseInt(e.target.value) || 0)} /></div>
                <div><label className="text-[9px] font-black uppercase text-slate-400 mb-1 block">Valor</label><input type="number" className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-bold" value={item.valor} onChange={(e) => actualizarItem(index, 'valor', parseFloat(e.target.value) || 0)} /></div>
                <div><label className="text-[9px] font-black uppercase text-slate-400 mb-1 block">Desc.</label><input type="number" className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-bold text-green-600" value={item.descuento} onChange={(e) => actualizarItem(index, 'descuento', parseFloat(e.target.value) || 0)} /></div>
                <div><label className="text-[9px] font-black uppercase text-slate-400 mb-1 block">V. Final</label><div className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-black">${(calcularTotalLinea(item)).toLocaleString()}</div></div>
                <button onClick={() => eliminarFila(index)} className="p-2.5 text-slate-300 hover:text-red-500 transition-colors">✕</button>
              </div>
            ))}
            <button onClick={agregarFila} className="w-full py-4 border-2 border-dashed border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:border-brand-orange hover:text-brand-orange transition-all">+ Agregar Item</button>
          </div>
        </div>

        <footer className="p-8 border-t bg-white">
          <div className="flex justify-between items-center mb-6">
            <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Total Factura</span>
            <span className="text-3xl font-black text-slate-900 tracking-tighter">${totalFactura.toLocaleString()}</span>
          </div>
          {!mostrarResumen ? (
            <button onClick={() => setMostrarResumen(true)} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-brand-orange transition-all shadow-xl">Revisar Carga</button>
          ) : (
            <div className="flex gap-3 animate-in zoom-in duration-200">
              <button onClick={() => setMostrarResumen(false)} className="flex-1 bg-slate-100 text-slate-600 py-5 rounded-2xl font-black uppercase tracking-widest">Cancelar</button>
              <button onClick={handleConfirmar} disabled={cargando} className="flex-[2] bg-brand-orange text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg">{cargando ? 'Procesando...' : 'Confirmar Ingreso'}</button>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}