export default function ListaProductosPedido({ pedido }) {
  return (
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
  );
}