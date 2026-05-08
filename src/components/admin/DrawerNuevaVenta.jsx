import { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { 
  collection, query, where, getDocs, writeBatch, 
  doc, increment, serverTimestamp 
} from 'firebase/firestore';

export default function DrawerNuevaVenta({ isOpen, onClose, productos = [] }) {
  const [cargando, setCargando] = useState(false);
  const [paso, setPaso] = useState(1); 
  const [busquedaSocio, setBusquedaSocio] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '', apellido: '', email: '', telefono: '',
    fechaNacimiento: '', tipo: 'Consumidor Final', dni: '', cuit: '',
    direccion: '', numero: '', piso: '', ciudad: '', cp: ''
  });

  const [items, setItems] = useState([]);
  const [busquedaProd, setBusquedaProd] = useState('');
  
  // Estados para Búsqueda y Teclado
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [indiceSeleccionado, setIndiceSeleccionado] = useState(-1);

  // Estados para Pagos
  const [metodoPago, setMetodoPago] = useState('Transferencia');
  const [nroComprobante, setNroComprobante] = useState('');

  // --- EFECTO: BÚSQUEDA HÍBRIDA SOBRE ÍNDICE DE SERVIDOR ---
  useEffect(() => {
    const realizarBusqueda = () => {
      const term = busquedaProd.trim().toLowerCase();
      if (term.length < 2) {
        setResultadosBusqueda([]);
        setIndiceSeleccionado(-1);
        setBuscando(false);
        return;
      }

      setBuscando(true);
      const encontrados = productos.filter(p => 
        p.nombre.toLowerCase().includes(term)
      );
      
      setResultadosBusqueda(encontrados);
      setIndiceSeleccionado(-1);
      setBuscando(false);
    };

    const delay = setTimeout(realizarBusqueda, 600); 
    return () => clearTimeout(delay);
  }, [busquedaProd, productos]);

  // --- NAVEGACIÓN POR TECLADO ---
  const handleKeyDown = (e) => {
    if (resultadosBusqueda.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndiceSeleccionado(prev => (prev < resultadosBusqueda.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndiceSeleccionado(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (indiceSeleccionado >= 0 && indiceSeleccionado < resultadosBusqueda.length) {
        agregarProducto(resultadosBusqueda[indiceSeleccionado]);
      } else if (resultadosBusqueda.length === 1) {
        agregarProducto(resultadosBusqueda[0]);
      }
    }
  };

  // --- LÓGICA DE PIN ---
  const generarPinUnico = async () => {
    let pin = '';
    let existe = true;
    while (existe) {
      pin = Math.floor(1000 + Math.random() * 9000).toString();
      const q = query(collection(db, 'clientes'), where('numeroCliente', '==', pin));
      const snap = await getDocs(q);
      if (snap.empty) existe = false;
    }
    return pin;
  };

  const buscarSocio = async () => {
    if (!busquedaSocio) return;
    setCargando(true);
    const q = query(collection(db, 'clientes'), where('numeroCliente', '==', busquedaSocio));
    const snap = await getDocs(q);
    if (!snap.empty) {
      setClienteSeleccionado({ id: snap.docs[0].id, ...snap.docs[0].data() });
      setPaso(3);
    } else {
      alert("Socio no encontrado. Registre uno nuevo.");
    }
    setCargando(false);
  };

  const handleRegistroNuevo = async () => {
    if (!nuevoCliente.nombre || !nuevoCliente.email) {
      return alert("El nombre y el email son obligatorios para el seguimiento.");
    }
    if (nuevoCliente.tipo === 'Responsable Inscripto' && !nuevoCliente.cuit) {
      return alert("El CUIT es obligatorio para emitir factura a Responsable Inscripto.");
    }
    
    setCargando(true);
    const pin = await generarPinUnico();
    const dataFinal = { ...nuevoCliente, numeroCliente: pin, createdAt: new Date() };
    setClienteSeleccionado({ id: 'NUEVO', ...dataFinal });
    alert("CLIENTE AGREGADO (PIN: " + pin + ")");
    setPaso(3);
    setCargando(false);
  };

  // --- GESTIÓN DE PRODUCTOS ---
  const agregarProducto = (p) => {
    if (items.find(i => i.id === p.id)) return;
    setItems([...items, { 
      id: p.id, 
      nombre: p.nombre, 
      cantidad: 1, 
      precioFinal: p.precioFinal, 
      stockActual: p.stock 
    }]);
    setBusquedaProd('');
    setResultadosBusqueda([]);
    setIndiceSeleccionado(-1);
  };

  const actualizarItem = (id, campo, valor) => {
    setItems(items.map(i => i.id === id ? { ...i, [campo]: valor } : i));
  };

  // --- MOTOR DE CÁLCULOS ---
  const subtotalVenta = items.reduce((acc, i) => acc + (i.cantidad * i.precioFinal), 0);
  const aplicaDescuentoExtra = metodoPago === 'Transferencia' || metodoPago === 'Efectivo';
  const descuentoMonto = aplicaDescuentoExtra ? subtotalVenta * 0.05 : 0;
  const totalVenta = subtotalVenta - descuentoMonto;
  const requiereComprobante = metodoPago === 'Transferencia' || metodoPago === 'MercadoPago';

  // --- FINALIZAR ---
  const finalizarVenta = async () => {
    if (items.length === 0) return alert("Cargue al menos un producto.");
    if (requiereComprobante && !nroComprobante.trim()) return alert("El número de comprobante/operación es obligatorio para este método de pago.");
    
    setCargando(true);
    try {
      const batch = writeBatch(db);
      const emailCli = clienteSeleccionado.email.toLowerCase().trim();
      const cliRef = doc(db, 'clientes', emailCli);
      
      if (clienteSeleccionado.id === 'NUEVO') {
        batch.set(cliRef, { ...clienteSeleccionado, totalCompras: 1 });
      } else {
        batch.update(cliRef, { totalCompras: increment(1) });
      }

      const orderRef = doc(collection(db, 'pedidos'));
      batch.set(orderRef, {
        tipo: 'OFFLINE',
        clienteEmail: emailCli,
        numeroCliente: clienteSeleccionado.numeroCliente,
        formData: {
          nombre: clienteSeleccionado.nombre,
          apellido: clienteSeleccionado.apellido,
          telefono: clienteSeleccionado.telefono,
          direccion: clienteSeleccionado.direccion || 'Venta Local'
        },
        cart: items,
        subtotal: subtotalVenta,
        descuentoAplicado: descuentoMonto,
        totalFinal: totalVenta,
        metodoPago,
        nroComprobante: nroComprobante.trim() || null,
        estado: 'Pagado',
        estadoLogistica: 'Entregado',
        createdAt: serverTimestamp()
      });

      items.forEach(i => {
        batch.update(doc(db, 'productos', i.id), { stock: increment(-i.cantidad) });
      });

      await batch.commit();
      alert("Venta confirmada y stock actualizado.");
      onClose();
      resetStates();
    } catch (e) { alert("Error al procesar venta."); }
    setCargando(false);
  };

  const resetStates = () => {
    setPaso(1); setClienteSeleccionado(null); setItems([]); setBusquedaProd(''); setNroComprobante(''); setMetodoPago('Transferencia');
    setNuevoCliente({ nombre: '', apellido: '', email: '', telefono: '', fechaNacimiento: '', tipo: 'Consumidor Final', dni: '', cuit: '', direccion: '', numero: '', piso: '', ciudad: '', cp: '' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex justify-end font-poppins text-slate-900">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        <header className="p-8 border-b bg-slate-50 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black uppercase">Venta Manual</h2>
            <p className="text-[10px] font-black text-brand-orange uppercase tracking-widest">Paso {paso} de 3</p>
          </div>
          <button onClick={onClose} className="text-3xl font-light">×</button>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          
          {paso === 1 && (
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase text-slate-400">Buscar Socio Existente</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="PIN (Ej: 1234)" className="flex-1 p-4 bg-slate-50 border rounded-xl outline-none focus:border-brand-orange font-bold" value={busquedaSocio} onChange={(e)=>setBusquedaSocio(e.target.value)} />
                  <button onClick={buscarSocio} className="bg-slate-900 text-white px-8 rounded-xl font-black uppercase text-[10px] tracking-widest">Validar</button>
                </div>
              </div>
              <div className="pt-6 border-t flex flex-col items-center">
                <p className="text-xs text-slate-400 mb-4">¿Es un cliente nuevo?</p>
                <button onClick={() => setPaso(2)} className="bg-white border-2 border-slate-900 text-slate-900 w-full py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-900 hover:text-white transition-all">+ Crear Nuevo Perfil</button>
              </div>
            </div>
          )}

          {paso === 2 && (
            <div className="space-y-4 animate-in fade-in duration-500">
              <h3 className="font-black text-xs uppercase tracking-widest mb-4">Ficha de Registro</h3>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Nombre *" className="p-3 border rounded-xl text-sm" onChange={(e)=>setNuevoCliente({...nuevoCliente, nombre: e.target.value})} />
                <input placeholder="Apellido" className="p-3 border rounded-xl text-sm" onChange={(e)=>setNuevoCliente({...nuevoCliente, apellido: e.target.value})} />
                <input placeholder="Email *" className="col-span-2 p-3 border rounded-xl text-sm" onChange={(e)=>setNuevoCliente({...nuevoCliente, email: e.target.value})} />
                <input placeholder="WhatsApp (Con código de área) *" className="col-span-2 p-3 border rounded-xl text-sm" onChange={(e)=>setNuevoCliente({...nuevoCliente, telefono: e.target.value})} />
                
                <div className="col-span-2">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Fecha de Nacimiento (Opcional)</label>
                  <input type="date" className="w-full p-3 border rounded-xl text-sm" onChange={(e)=>setNuevoCliente({...nuevoCliente, fechaNacimiento: e.target.value})} />
                </div>

                <select className="col-span-2 p-3 border rounded-xl text-sm bg-white" onChange={(e)=>setNuevoCliente({...nuevoCliente, tipo: e.target.value})}>
                  <option value="Consumidor Final">Consumidor Final</option>
                  <option value="Responsable Inscripto">Responsable Inscripto</option>
                </select>

                {nuevoCliente.tipo === 'Consumidor Final' ? (
                  <input placeholder="DNI (Opcional)" className="col-span-2 p-3 border rounded-xl text-sm" onChange={(e)=>setNuevoCliente({...nuevoCliente, dni: e.target.value})} />
                ) : (
                  <input placeholder="CUIT *" className="col-span-2 p-3 border rounded-xl text-sm" onChange={(e)=>setNuevoCliente({...nuevoCliente, cuit: e.target.value})} />
                )}

                <input placeholder="Dirección" className="col-span-2 p-3 border rounded-xl text-sm" onChange={(e)=>setNuevoCliente({...nuevoCliente, direccion: e.target.value})} />
                <input placeholder="N°" className="p-3 border rounded-xl text-sm" onChange={(e)=>setNuevoCliente({...nuevoCliente, numero: e.target.value})} />
                <input placeholder="Piso/Depto" className="p-3 border rounded-xl text-sm" onChange={(e)=>setNuevoCliente({...nuevoCliente, piso: e.target.value})} />
                <input placeholder="Ciudad" className="p-3 border rounded-xl text-sm" onChange={(e)=>setNuevoCliente({...nuevoCliente, ciudad: e.target.value})} />
                <input placeholder="CP" className="p-3 border rounded-xl text-sm" onChange={(e)=>setNuevoCliente({...nuevoCliente, cp: e.target.value})} />
              </div>
              <div className="flex gap-2 pt-4">
                <button onClick={()=>setPaso(1)} className="flex-1 py-4 text-[10px] font-black uppercase">Cancelar</button>
                <button onClick={handleRegistroNuevo} className="flex-[2] bg-slate-900 text-white py-4 rounded-xl font-black uppercase text-[10px]">Registrar y Continuar</button>
              </div>
            </div>
          )}

          {paso === 3 && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4">
              <div className="p-4 bg-slate-900 text-white rounded-2xl flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold opacity-60 uppercase">Cliente</p>
                  <p className="text-sm font-black">{clienteSeleccionado.nombre} {clienteSeleccionado.apellido}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold opacity-60 uppercase">PIN</p>
                  <p className="text-sm font-black">#{clienteSeleccionado.numeroCliente}</p>
                </div>
              </div>

              {/* BÚSQUEDA INTELIGENTE */}
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Buscar producto por nombre..." 
                  className="w-full p-4 bg-slate-100 rounded-xl outline-none focus:ring-2 ring-brand-orange/20" 
                  value={busquedaProd} 
                  onChange={(e)=>setBusquedaProd(e.target.value)}
                  onKeyDown={handleKeyDown} 
                />
                
                {buscando && <div className="absolute right-4 top-4 text-[10px] font-black text-brand-orange animate-pulse">BUSCANDO...</div>}

                {resultadosBusqueda.length > 0 && (
                  <div className="absolute z-20 w-full mt-2 bg-white border shadow-2xl rounded-2xl max-h-60 overflow-y-auto">
                    {resultadosBusqueda.map((p, index) => (
                      <button 
                        key={p.id} 
                        onClick={()=>agregarProducto(p)} 
                        className={`w-full p-4 text-left border-b flex justify-between items-center transition-colors ${index === indiceSeleccionado ? 'bg-slate-100 border-l-4 border-l-brand-orange' : 'hover:bg-slate-50'}`}
                      >
                        <span className="text-xs font-bold uppercase">{p.nombre}</span>
                        <span className="text-[10px] font-black text-brand-orange">STOCK: {p.stock}</span>
                      </button>
                    ))}
                  </div>
                )}
                {busquedaProd.length > 1 && !buscando && resultadosBusqueda.length === 0 && (
                  <div className="absolute z-20 w-full mt-2 bg-white border shadow-2xl rounded-2xl p-4 text-center text-[10px] uppercase font-bold text-slate-400">
                    No hay resultados en el servidor
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {items.map(i => (
                  <div key={i.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs font-black uppercase max-w-[70%]">{i.nombre}</span>
                      <button onClick={()=>setItems(items.filter(item=>item.id!==i.id))} className="text-red-400 text-xs">Quitar</button>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase">Cantidad</label>
                        <input type="number" value={i.cantidad} onChange={(e)=>actualizarItem(i.id, 'cantidad', parseInt(e.target.value) || 1)} className="w-full p-2 bg-white border rounded-lg text-xs font-bold" />
                      </div>
                      <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase">Precio Unit.</label>
                        <input type="number" value={i.precioFinal} onChange={(e)=>actualizarItem(i.id, 'precioFinal', parseInt(e.target.value) || 0)} className="w-full p-2 bg-white border rounded-lg text-xs font-bold" />
                      </div>
                      <div className="text-right flex flex-col justify-end">
                        <p className="text-xs font-black">${(i.cantidad * i.precioFinal).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t">
                {/* LÓGICA DE PAGOS Y DESCUENTOS */}
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-2 uppercase">
                  <span>Subtotal</span>
                  <span>${subtotalVenta.toLocaleString()}</span>
                </div>
                
                {descuentoMonto > 0 && (
                  <div className="flex justify-between items-center text-[10px] font-bold text-brand-orange mb-2 uppercase">
                    <span>Descuento (5%)</span>
                    <span>- ${descuentoMonto.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-black uppercase tracking-widest">Total a Cobrar</span>
                  <span className="text-3xl font-black text-slate-900">${totalVenta.toLocaleString()}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {['Transferencia', 'Efectivo', 'MercadoPago'].map(m => (
                    <button key={m} onClick={() => { setMetodoPago(m); setNroComprobante(''); }} className={`py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${metodoPago === m ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-200'}`}>{m}</button>
                  ))}
                </div>

                {/* COMPROBANTE OBLIGATORIO */}
                {requiereComprobante && (
                  <div className="mb-6 animate-in fade-in zoom-in duration-300">
                    <label className="text-[10px] font-bold uppercase text-brand-orange mb-2 block">Nro de Comprobante / Operación *</label>
                    <input 
                      type="text" 
                      placeholder="Ingrese el código del recibo" 
                      className="w-full p-3 border-2 border-brand-orange/30 rounded-xl outline-none focus:border-brand-orange text-sm font-bold bg-orange-50/30"
                      value={nroComprobante}
                      onChange={(e) => setNroComprobante(e.target.value)}
                    />
                  </div>
                )}

                <div className="flex gap-3 mt-4">
                  <button onClick={()=>setPaso(1)} className="flex-1 py-4 text-[10px] font-black uppercase">Atrás</button>
                  <button onClick={finalizarVenta} disabled={cargando} className="flex-[3] bg-brand-orange text-white py-4 rounded-xl font-black uppercase text-[10px] shadow-lg shadow-brand-orange/20">{cargando ? 'Procesando...' : 'Confirmar Venta'}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}