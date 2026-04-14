import React from 'react';

export default function DrawerDetalleVenta({ isOpen, onClose, pedido }) {
  if (!isOpen || !pedido) return null;

  return (
    <div className="fixed inset-0 z-[160] flex justify-end font-poppins text-slate-900">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <header className="p-8 border-b bg-slate-50 flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black text-brand-orange uppercase tracking-widest">
              Orden {pedido.tipo || 'WEB'}
            </p>
            <h2 className="text-2xl font-black uppercase">#{pedido.id.slice(0, 5).toUpperCase()}</h2>
          </div>
          <button onClick={onClose} className="text-3xl font-light hover:text-brand-orange transition-colors">×</button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <section className="border-b pb-4">
            <h4 className="text-xs font-black uppercase text-slate-400 mb-2 tracking-widest">Cliente</h4>
            <p className="font-bold text-lg">{pedido.formData?.nombre || 'Socio'} {pedido.formData?.apellido || ''}</p>
            <p className="text-sm text-slate-600">{pedido.clienteEmail}</p>
            <p className="text-sm text-slate-600">{pedido.formData?.telefono}</p>
          </section>

          <section>
            <h4 className="text-xs font-black uppercase text-slate-400 mb-2 tracking-widest">Detalle de Productos</h4>
            {pedido.cart?.map((item, idx) => (
              <div key={idx} className="flex justify-between p-4 bg-slate-50 rounded-xl mb-2">
                <div className="flex flex-col">
                  <span className="text-xs font-bold uppercase">{item.nombre}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Cant: {item.cantidad}</span>
                </div>
                <span className="font-bold text-sm">${(item.precioFinal * item.cantidad).toLocaleString()}</span>
              </div>
            ))}
          </section>

          <section className="bg-slate-900 text-white p-6 rounded-2xl mt-auto">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Metodo de Pago</span>
              <span className="text-[10px] font-black uppercase tracking-widest">{pedido.metodoPago || pedido.formData?.pago || 'No especificado'}</span>
            </div>
            <div className="flex justify-between items-end pt-4 border-t border-white/10">
              <span className="text-xs font-bold uppercase tracking-widest">Total Final</span>
              <span className="text-3xl font-black">${pedido.totalFinal?.toLocaleString()}</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}