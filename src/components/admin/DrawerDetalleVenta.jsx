import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';

// 📧 MAPA DE PLANTILLAS DE BREVO
const BREVO_TEMPLATES = {
  pago: {
    'Pagado': 2,      
    'Cancelado': 3    
  },
  logistica: {
    'En Preparación': 4,
    'En Camino': 5,   
    'Entregado': 6,
    'Listo para Retiro': 7 
  },
  recordatorio: 8 
};

export default function DrawerDetalleVenta({ isOpen, onClose, pedido, onEliminar }) {
  const [actualizando, setActualizando] = useState(false);
  const [enviandoRecordatorio, setEnviandoRecordatorio] = useState(false);
  const [notificarCliente, setNotificarCliente] = useState(true);

  const [estadoLocal, setEstadoLocal] = useState({
    estado: '',
    estadoLogistica: '',
    metodoPago: '',
    numeroOperacion: '' // 👉 Agregamos el número de operación al estado
  });

  useEffect(() => {
    if (pedido) {
      setEstadoLocal({
        estado: pedido.estado || 'Pendiente',
        estadoLogistica: pedido.estadoLogistica || 'Pendiente',
        metodoPago: pedido.metodoPago || '',
        numeroOperacion: pedido.numeroOperacion || ''
      });
    }
  }, [pedido]);

  if (!isOpen || !pedido) return null;

  const functionUrl = import.meta.env.VITE_FUNCTIONS_URL || 'https://enviarconfirmacionpedido-jztey4742a-uc.a.run.app';
  const esRetiro = !pedido.formData?.direccion; 

  const handleActualizacion = async (campo, nuevoValor) => {
    setEstadoLocal(prev => ({ ...prev, [campo]: nuevoValor }));

    // 👉 BARRERA DE SEGURIDAD: Si elige "Pagado", no guardamos todavía.
    // Esperamos a que llene el número de operación y presione el botón final.
    if (campo === 'estado' && nuevoValor === 'Pagado') {
      return; 
    }

    setActualizando(true);

    try {
      const pedidoRef = doc(db, 'pedidos', pedido.id);
      await updateDoc(pedidoRef, {
        [campo]: nuevoValor
      });

      if (notificarCliente && (campo === 'estado' || campo === 'estadoLogistica')) {
        let templateId = null;
        if (campo === 'estado' && BREVO_TEMPLATES.pago[nuevoValor]) templateId = BREVO_TEMPLATES.pago[nuevoValor];
        else if (campo === 'estadoLogistica' && BREVO_TEMPLATES.logistica[nuevoValor]) templateId = BREVO_TEMPLATES.logistica[nuevoValor];

        if (templateId) {
          await fetch(functionUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              toEmail: pedido.clienteEmail,
              toName: `${pedido.formData?.nombre || ''} ${pedido.formData?.apellido || ''}`.trim() || 'Socio',
              templateId: templateId,
              params: { numeroOrden: pedido.id.slice(0, 5).toUpperCase(), estadoNuevo: nuevoValor, total: pedido.totalFinal }
            })
          });
        }
      }
    } catch (error) {
      console.error("Error actualizando:", error);
      alert("Hubo un problema guardando el cambio.");
      setEstadoLocal(prev => ({ ...prev, [campo]: pedido[campo] }));
    } finally {
      setActualizando(false);
    }
  };

  // 👉 NUEVA FUNCIÓN: Confirma el pago, guarda todo el paquete y envía el mail
  const handleConfirmarPago = async () => {
    if (!estadoLocal.metodoPago) return alert("Por favor, selecciona un método de pago.");
    if (!estadoLocal.numeroOperacion) return alert("Por favor, ingresa el número de operación o comprobante.");

    setActualizando(true);
    try {
      const pedidoRef = doc(db, 'pedidos', pedido.id);
      await updateDoc(pedidoRef, {
        estado: 'Pagado',
        metodoPago: estadoLocal.metodoPago,
        numeroOperacion: estadoLocal.numeroOperacion
      });

      if (notificarCliente) {
        await fetch(functionUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toEmail: pedido.clienteEmail,
            toName: `${pedido.formData?.nombre || ''} ${pedido.formData?.apellido || ''}`.trim() || 'Socio',
            templateId: BREVO_TEMPLATES.pago['Pagado'],
            params: { numeroOrden: pedido.id.slice(0, 5).toUpperCase(), estadoNuevo: 'Pagado', total: pedido.totalFinal }
          })
        });
      }
      
      // Actualizamos el objeto pedido localmente para que la UI cambie de inmediato
      pedido.estado = 'Pagado';
      pedido.metodoPago = estadoLocal.metodoPago;
      pedido.numeroOperacion = estadoLocal.numeroOperacion;

      alert("Pago acreditado exitosamente y cliente notificado.");
    } catch (error) {
      console.error(error);
      alert("Error al confirmar el pago.");
    } finally {
      setActualizando(false);
    }
  };

  const handleEnviarRecordatorio = async () => {
    setEnviandoRecordatorio(true);
    try {
      const res = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: pedido.clienteEmail,
          toName: `${pedido.formData?.nombre || ''} ${pedido.formData?.apellido || ''}`.trim() || 'Socio',
          templateId: BREVO_TEMPLATES.recordatorio,
          params: { numeroOrden: pedido.id.slice(0, 5).toUpperCase(), total: pedido.totalFinal }
        })
      });
      if (res.ok) alert("Recordatorio de pago enviado exitosamente.");
      else alert("Error al enviar el recordatorio.");
    } catch (error) {
      console.error("Error al enviar recordatorio:", error);
    } finally {
      setEnviandoRecordatorio(false);
    }
  };

  const formatWhatsApp = (phone) => phone ? phone.replace(/\D/g, '') : '';
  
  const nombreCompleto = `${pedido.formData?.nombre || 'Socio'} ${pedido.formData?.apellido || ''}`.trim();
  const direccionCompleta = !esRetiro 
    ? `${pedido.formData.direccion} ${pedido.formData.numero || ''}${pedido.formData.piso ? `, Piso ${pedido.formData.piso}` : ''}, ${pedido.formData.ciudad || ''} (${pedido.formData.cp || ''})`
    : 'Retiro en Cava / Sin domicilio';

  const subtotalProductos = pedido.cart?.reduce((acc, item) => acc + ((item.precioFinal || item.precio || item.precioUnitario || 0) * item.cantidad), 0) || pedido.totalFinal;
  
  let montoDescuento = 0;
  let motivoDescuento = [];
  
  if (pedido.descuentoMontoTransferencia > 0) { montoDescuento += pedido.descuentoMontoTransferencia; motivoDescuento.push("Transferencia"); }
  if (pedido.descuentoMontoSuscripcion > 0) { montoDescuento += pedido.descuentoMontoSuscripcion; motivoDescuento.push("VIP"); }
  if (montoDescuento === 0 && subtotalProductos > pedido.totalFinal) { montoDescuento = subtotalProductos - pedido.totalFinal; motivoDescuento.push("Promo"); }

  return (
    <div className="fixed inset-0 z-[160] flex justify-end font-poppins text-slate-900">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 font-poppins">
        
        <header className="px-6 py-5 border-b bg-slate-50 flex flex-col gap-4 shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <span className={`text-[9px] font-black uppercase px-2 py-1 rounded border ${pedido.tipo === 'OFFLINE' ? 'bg-slate-200 text-slate-600' : 'bg-orange-50 text-brand-orange border-brand-orange/20'}`}>
                {pedido.tipo || 'WEB'}
              </span>
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">ORDEN #{pedido.id.slice(0, 5).toUpperCase()}</h2>
              <span className="text-[10px] font-bold text-slate-400">
                {new Date(pedido.createdAt?.seconds * 1000).toLocaleDateString('es-AR') || ''}
              </span>
            </div>
            <button onClick={onClose} className="text-2xl font-light text-slate-400 hover:text-brand-orange transition-colors outline-none leading-none">×</button>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative group flex flex-col md:flex-row gap-4 md:gap-6 items-start md:items-center">
            <div className="flex-1 md:border-r border-slate-100 md:pr-4 w-full">
              <p className="font-black text-sm text-slate-900 mb-0.5">{nombreCompleto}</p>
              <p className="text-[10px] font-bold text-slate-500 mb-2">{pedido.clienteEmail}</p>
              {pedido.formData?.telefono ? (
                <a href={`https://wa.me/${formatWhatsApp(pedido.formData.telefono)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-[#25D366] text-white px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest hover:bg-[#1ebe5d] transition-colors">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  {pedido.formData.telefono}
                </a>
              ) : (
                 <span className="text-[10px] font-bold text-slate-400">Sin teléfono</span>
              )}
            </div>

            <div className="flex-1 w-full relative">
              <p className="text-[8px] font-black uppercase text-slate-400 mb-0.5">Destino / Entrega</p>
              <p className="text-[11px] font-bold text-slate-700 leading-tight">{direccionCompleta}</p>
              {pedido.formData?.referencia && <p className="text-[9px] text-slate-500 italic mt-1">Ref: {pedido.formData.referencia}</p>}
              
              <Link to="/locked_cellar/clientes" className="absolute top-0 right-0 text-[8px] font-black uppercase tracking-widest text-brand-orange hover:underline outline-none">
                VER CRM
              </Link>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
          <section className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-100">
              <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Logística y Pagos</h4>
              <div className="flex items-center gap-1.5">
                <input type="checkbox" id="mailSwitch" className="w-3.5 h-3.5 accent-brand-orange cursor-pointer" checked={notificarCliente} onChange={(e) => setNotificarCliente(e.target.checked)} />
                <label htmlFor="mailSwitch" className="text-[9px] font-bold text-slate-600 uppercase cursor-pointer select-none">Notificar al cliente</label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <div>
                  <label className="text-[8px] font-black uppercase text-slate-400 mb-1 block">Estado de Pago</label>
                  <select 
                    className={`w-full p-2 border rounded-lg text-[11px] font-bold outline-none cursor-pointer ${actualizando ? 'opacity-50' : ''} ${estadoLocal.estado === 'Pagado' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200'}`}
                    value={estadoLocal.estado}
                    onChange={(e) => handleActualizacion('estado', e.target.value)}
                    disabled={actualizando || pedido.estado === 'Pagado'} // Bloqueamos si ya está pagado para proteger la info
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Pagado">Pagado</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>

                {/* BOTÓN RECORDATORIO */}
                {estadoLocal.estado !== 'Pagado' && (
                  <button onClick={handleEnviarRecordatorio} disabled={enviandoRecordatorio} className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-md text-[8px] font-black uppercase tracking-widest transition-colors outline-none">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    {enviandoRecordatorio ? 'Enviando...' : 'Recordar Pago'}
                  </button>
                )}

                {/* 👉 CAJA DE COBRO: Solo aparece cuando cambia a Pagado pero aún no se guardó */}
                {estadoLocal.estado === 'Pagado' && pedido.estado !== 'Pagado' && (
                  <div className="mt-2 p-4 bg-orange-50 border border-orange-200 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-brand-orange"></div>
                    <h5 className="text-[9px] uppercase font-black text-brand-orange mb-3 tracking-widest">Completar Cobro</h5>

                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="text-[8px] font-black uppercase text-orange-900/60 mb-1 block">Vía de Ingreso</label>
                        <select
                          className="w-full p-2 border border-orange-200 rounded-lg text-[11px] font-bold outline-none text-orange-900 bg-white focus:border-brand-orange shadow-sm"
                          value={estadoLocal.metodoPago}
                          onChange={(e) => setEstadoLocal(prev => ({...prev, metodoPago: e.target.value}))}
                        >
                          <option value="">Seleccionar...</option>
                          <option value="Mercado Pago">Mercado Pago</option>
                          <option value="Transferencia">Transferencia Bancaria</option>
                          <option value="Efectivo">Efectivo</option>
                        </select>
                      </div>

                      {estadoLocal.metodoPago && (
                        <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                          <label className="text-[8px] font-black uppercase text-orange-900/60 mb-1 block">N° de Operación / Comprobante</label>
                          <input
                            type="text"
                            placeholder="Ej: 123456789"
                            className="w-full p-2 border border-orange-200 rounded-lg text-[11px] font-bold outline-none text-orange-900 bg-white focus:border-brand-orange shadow-sm placeholder:font-medium placeholder:text-orange-900/30"
                            value={estadoLocal.numeroOperacion}
                            onChange={(e) => setEstadoLocal(prev => ({...prev, numeroOperacion: e.target.value}))}
                          />
                        </div>
                      )}

                      {estadoLocal.metodoPago && estadoLocal.numeroOperacion && (
                        <button
                          onClick={handleConfirmarPago}
                          disabled={actualizando}
                          className="mt-2 w-full py-2.5 bg-brand-orange text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-orange-600 transition-colors disabled:opacity-50 shadow-md"
                        >
                          {actualizando ? 'Procesando...' : 'Acreditar Pago y Notificar'}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* 👉 VISTA DE COMPROBANTE: Cuando el pago ya fue confirmado previamente */}
                {pedido.estado === 'Pagado' && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-xl flex flex-col gap-1 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                    <span className="text-[9px] font-black uppercase text-green-700 tracking-widest">Cobro Acreditado</span>
                    <span className="text-[10px] font-bold text-green-900 mt-1">Vía: <span className="font-medium">{pedido.metodoPago || 'No registrada'}</span></span>
                    <span className="text-[10px] font-bold text-green-900">Ref: <span className="font-medium">{pedido.numeroOperacion ? `#${pedido.numeroOperacion}` : 'Sin ref.'}</span></span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[8px] font-black uppercase text-slate-400 mb-1 block">
                  Estado de Envío {esRetiro ? '(Retiro)' : '(Delivery)'}
                </label>
                <select 
                  className={`w-full p-2 border rounded-lg text-[11px] font-bold outline-none cursor-pointer ${actualizando ? 'opacity-50' : ''} ${estadoLocal.estadoLogistica === 'Entregado' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200'}`}
                  value={estadoLocal.estadoLogistica}
                  onChange={(e) => handleActualizacion('estadoLogistica', e.target.value)}
                  disabled={actualizando}
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="En Preparación">En Preparación</option>
                  {esRetiro ? (
                    <option value="Listo para Retiro">Listo para Retiro en Cava</option>
                  ) : (
                    <option value="En Camino">En Camino</option>
                  )}
                  <option value="Entregado">Entregado</option>
                </select>
              </div>
            </div>
          </section>

          <section>
            <h4 className="text-[9px] font-black uppercase text-slate-400 mb-2 tracking-widest">Artículos de la Orden</h4>
            <div className="space-y-1.5">
              {pedido.cart?.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-100 text-slate-600 font-black text-[11px] w-6 h-6 rounded flex items-center justify-center shrink-0">
                      {item.cantidad}x
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold leading-tight">{item.nombre}</span>
                    </div>
                  </div>
                  <span className="font-black text-xs text-slate-900 shrink-0">
                    ${((item.precioFinal || item.precio || item.precioUnitario || 0) * item.cantidad).toLocaleString()}
                  </span>
                </div>
              ))}

              {pedido.plan && (!pedido.cart || pedido.cart.length === 0) && (
                <div className="flex justify-between items-center p-3 bg-brand-orange/5 border border-brand-orange/20 rounded-lg shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="bg-brand-orange text-white font-black text-[11px] w-6 h-6 rounded flex items-center justify-center shrink-0">
                      1x
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold leading-tight text-slate-900">Suscripción: Plan {pedido.plan}</span>
                      <span className="text-[9px] text-brand-orange font-black uppercase tracking-widest">Membresía VIP</span>
                    </div>
                  </div>
                  <span className="font-black text-xs text-brand-orange shrink-0">
                    ${(pedido.totalFinal || 0).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </section>
        </div>

        <section className="px-6 py-4 border-t bg-slate-900 text-white rounded-t-2xl mt-auto shrink-0">
          <div className="flex flex-col gap-1.5 mb-3 pb-3 border-b border-white/10">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[9px] font-black uppercase tracking-widest">Subtotal Mercadería</span>
              <span className="text-[11px] font-bold">${subtotalProductos.toLocaleString()}</span>
            </div>
            
            {montoDescuento > 0 && (
              <div className="flex justify-between items-center text-green-400">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest">Descuento</span>
                  <span className="text-[8px] font-bold opacity-80 leading-none">{motivoDescuento.join(' + ')}</span>
                </div>
                <span className="text-[11px] font-black">- ${montoDescuento.toLocaleString()}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[9px] font-black uppercase tracking-widest">Envío {esRetiro ? '(Retiro)' : ''}</span>
              <span className="text-[11px] font-bold">{(pedido.costoEnvio || 0) === 0 ? '¡Gratis!' : `$${pedido.costoEnvio.toLocaleString()}`}</span>
            </div>
          </div>

          <div className="flex justify-between items-end">
            <div>
              <span className="text-[8px] font-bold uppercase tracking-widest opacity-60 block mb-1">Vía de Ingreso</span>
              <span className="text-[9px] font-black text-brand-orange uppercase bg-white/10 px-2 py-1 rounded tracking-widest">
                {pedido.metodoPago || estadoLocal.metodoPago || pedido.formData?.pago || 'No especificada'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-bold uppercase tracking-widest opacity-60 block mb-0.5">Total Final</span>
              <span className="text-3xl font-black tracking-tighter leading-none">${pedido.totalFinal?.toLocaleString()}</span>
            </div>
          </div>

          {onEliminar && (
            <div className="mt-5 pt-4 border-t border-red-500/20 flex justify-center">
              <button onClick={onEliminar} className="text-[9px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 hover:bg-red-500/10 px-4 py-2 rounded transition-colors outline-none flex items-center gap-2">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Eliminar Venta Permanentemente
              </button>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}