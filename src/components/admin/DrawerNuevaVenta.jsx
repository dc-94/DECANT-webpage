import { useState } from 'react';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs, writeBatch, doc, increment, serverTimestamp } from 'firebase/firestore';

export default function DrawerNuevaVenta({ isOpen, onClose, productos }) {
  const [cargando, setCargando] = useState(false);
  const [paso, setPaso] = useState(1);
  const [busquedaSocio, setBusquedaSocio] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [clienteManual, setClienteManual] = useState({ nombre: '', apellido: '', email: '', telefono: '' });
  const [items, setItems] = useState([]);
  const [busquedaProd, setBusquedaProd] = useState('');
  const [metodoPago, setMetodoPago] = useState('Transferencia');

  const buscarSocio = async () => {
    if (!busquedaSocio) return;
    setCargando(true);
    try {
      const q = query(collection(db, 'clientes'), where('numeroCliente', '==', busquedaSocio));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setClienteSeleccionado({ id: snap.docs[0].id, ...snap.docs[0].data() });
      } else {
        const qEmail = query(collection(db, 'clientes'), where('email', '==', busquedaSocio.toLowerCase().trim()));
        const snapEmail = await getDocs(qEmail);
        if (!snapEmail.empty) {
          setClienteSeleccionado({ id: snapEmail.docs[0].id, ...snapEmail.docs[0].data() });
        } else {
          setClienteSeleccionado({ id: 'NUEVO' });
        }
      }
    } catch (e) { console.error(e); }
    setCargando(false);
  };

  const agregarProducto = (p) => {
    if (items.find(i => i.id === p.id)) return;
    setItems([...items, { id: p.id, nombre: p.nombre, cantidad: 1, precioVenta: p.precioFinal }]);
    setBusquedaProd('');
  };

  const totalVenta = items.reduce((acc, i) => acc + (i.cantidad * i.precioVenta), 0);

  const handleFinalizarVenta = async () => {
    setCargando(true);
    try {
      const batch = writeBatch(db);
      const emailFinal = clienteSeleccionado.id === 'NUEVO' ? clienteManual.email.toLowerCase().trim() : clienteSeleccionado.email;
      const clientRef = doc(db, 'clientes', emailFinal);
      let pin = clienteSeleccionado.numeroCliente || Math.floor(1000 + Math.random() * 9000).toString();

      if (clienteSeleccionado.id === 'NUEVO') {
        batch.set(clientRef, { ...clienteManual, email: emailFinal, numeroCliente: pin, totalCompras: 1, createdAt: serverTimestamp() });
      } else {
        batch.update(clientRef, { totalCompras: increment(1) });
      }

      const orderRef = doc(collection(db, 'pedidos'));
      batch.set(orderRef, {
        tipo: 'OFFLINE',
        clienteEmail: emailFinal,
        numeroCliente: pin,
        cart: items,
        totalFinal: totalVenta,
        metodoPago,
        estado: 'Entregado',
        createdAt: serverTimestamp()
      });

      items.forEach(i => {
        batch.update(doc(db, 'productos', i.id), { stock: increment(-i.cantidad) });
      });

      await batch.commit();
      alert("Venta registrada con éxito.");
      onClose();
      setPaso(1); setItems([]); setClienteSeleccionado(null); setBusquedaSocio('');
    } catch (e) { console.error(e); }
    setCargando(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex justify-end font-poppins text-slate-900">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <header className="p-8 border-b bg-slate-50">
          <h2 className="text-2xl font-black uppercase">Nueva Venta OFFLINE</h2>
          <p className="text-[10px] font-black text-brand-orange uppercase tracking-widest">Paso {paso} de 2</p>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {paso === 1 ? (
            <div className="space-y-6">
              <div className="flex gap-2">
                <input type="text" placeholder="PIN Socio o Email..." className="flex-1 p-3 border rounded-xl" value={busquedaSocio} onChange={(e)=>setBusquedaSocio(e.target.value)} />
                <button onClick={buscarSocio} className="bg-slate-900 text-white px-6 rounded-xl font-bold">Buscar</button>
              </div>
              {clienteSeleccionado?.id === 'NUEVO' && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in">
                  <input placeholder="Nombre" className="p-3 border rounded-xl" onChange={(e)=>setClienteManual({...clienteManual, nombre: e.target.value})}/>
                  <input placeholder="Apellido" className="p-3 border rounded-xl" onChange={(e)=>setClienteManual({...clienteManual, apellido: e.target.value})}/>
                  <input placeholder="Email" className="col-span-2 p-3 border rounded-xl" onChange={(e)=>setClienteManual({...clienteManual, email: e.target.value})}/>
                  <input placeholder="Telefono" className="col-span-2 p-3 border rounded-xl" onChange={(e)=>setClienteManual({...clienteManual, telefono: e.target.value})}/>
                </div>
              )}
              {clienteSeleccionado && clienteSeleccionado.id !== 'NUEVO' && (
                 <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
                   <p className="font-bold">{clienteSeleccionado.nombre} {clienteSeleccionado.apellido}</p>
                   <p className="text-xs text-green-600">Socio N° {clienteSeleccionado.numeroCliente}</p>
                 </div>
              )}
              <button disabled={!clienteSeleccionado} onClick={()=>setPaso(2)} className="w-full bg-brand-orange text-white py-4 rounded-xl font-black uppercase">Continuar →</button>
            </div>
          ) : (
            <div className="space-y-6">
              <input type="text" placeholder="Buscar vino..." className="w-full p-4 bg-slate-100 rounded-xl" value={busquedaProd} onChange={(e)=>setBusquedaProd(e.target.value)} />
              {busquedaProd.length > 2 && (
                <div className="bg-white border shadow-xl rounded-xl overflow-hidden">
                  {productos.filter(p => p.nombre.toLowerCase().includes(busquedaProd.toLowerCase())).map(p => (
                    <button key={p.id} onClick={()=>agregarProducto(p)} className="w-full p-4 text-left border-b text-xs font-bold hover:bg-slate-50">{p.nombre}</button>
                  ))}
                </div>
              )}
              <div className="space-y-3">
                {items.map(i => (
                  <div key={i.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-xl">
                    <span className="text-xs font-bold">{i.nombre}</span>
                    <button onClick={()=>setItems(items.filter(item=>item.id!==i.id))} className="text-red-400">✕</button>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {['Transferencia', 'Efectivo', 'MercadoPago'].map(m => (
                  <button key={m} onClick={()=>setMetodoPago(m)} className={`p-3 rounded-xl text-[10px] font-black uppercase border ${metodoPago === m ? 'border-brand-orange bg-orange-50 text-brand-orange' : 'border-slate-200 text-slate-400'}`}>{m}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={()=>setPaso(1)} className="flex-1 py-4 bg-slate-100 font-black uppercase text-[10px]">Atrás</button>
                <button onClick={handleFinalizarVenta} disabled={cargando} className="flex-[2] py-4 bg-slate-900 text-white font-black uppercase text-[10px]">{cargando ? 'Procesando...' : 'Finalizar Venta'}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}