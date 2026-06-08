export default function ResumenFooterPedido({ pedido, estadoLocal, onEliminar, esRetiro }) {
  const subtotalProductos = pedido.cart?.reduce((acc, item) => acc + ((item.precioFinal || item.precio || item.precioUnitario || 0) * item.cantidad), 0) || pedido.totalFinal;
  
  let montoDescuento = 0;
  let motivoDescuento = [];
  
  if (pedido.descuentoMontoTransferencia > 0) { montoDescuento += pedido.descuentoMontoTransferencia; motivoDescuento.push("Transferencia"); }
  if (pedido.descuentoMontoSuscripcion > 0) { montoDescuento += pedido.descuentoMontoSuscripcion; motivoDescuento.push("VIP"); }
  if (montoDescuento === 0 && subtotalProductos > pedido.totalFinal) { montoDescuento = subtotalProductos - pedido.totalFinal; motivoDescuento.push("Promo"); }

  return (
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
  );
}