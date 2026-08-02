export default function PanelLogistica({ 
  pedido, estadoLocal, setEstadoLocal, actualizando, notificarCliente, setNotificarCliente, 
  handleActualizacion, handleConfirmarPago, handleEnviarRecordatorio, enviandoRecordatorio, esRetiro 
}) {
  return (
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
              disabled={actualizando || pedido.estado === 'Pagado'} 
            >
              <option value="Pendiente">Pendiente</option>
              <option value="Pagado">Pagado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>

          {estadoLocal.estado !== 'Pagado' && (
            <button onClick={handleEnviarRecordatorio} disabled={enviandoRecordatorio} className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-md text-[8px] font-black uppercase tracking-widest transition-colors outline-none">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              {enviandoRecordatorio ? 'Enviando...' : 'Recordar Pago'}
            </button>
          )}

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
                  <button onClick={handleConfirmarPago} disabled={actualizando} className="mt-2 w-full py-2.5 bg-brand-orange text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-orange-600 transition-colors disabled:opacity-50 shadow-md">
                    {actualizando ? 'Procesando...' : 'Acreditar Pago y Notificar'}
                  </button>
                )}
              </div>
            </div>
          )}

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
  );
}