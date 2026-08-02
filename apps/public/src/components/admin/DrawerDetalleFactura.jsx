import React from 'react';

export default function DrawerDetalleFactura({ isOpen, onClose, factura }) {
  if (!isOpen || !factura) return null;

  return (
    <div className="fixed inset-0 z-[160] flex justify-end font-poppins text-slate-900">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <header className="p-8 border-b bg-slate-50 flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black text-brand-orange uppercase tracking-widest mb-1">
              {factura.fecha}
            </p>
            <h2 className="text-2xl font-black uppercase">Factura #{factura.nroFactura}</h2>
            <p className="text-sm font-bold text-slate-400 mt-1">Proveedor: {factura.proveedor}</p>
          </div>
          <button onClick={onClose} className="text-3xl font-light hover:text-brand-orange transition-colors">×</button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <section>
            <h4 className="text-xs font-black uppercase text-slate-400 mb-4 tracking-widest border-b pb-2">Mercadería Ingresada</h4>
            
            <div className="space-y-3">
              {factura.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">{item.nombre}</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                      Cant: {item.cantidad} | Costo Base: ${item.valor} | Desc: {item.descuento}%
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-sm">${item.totalLinea?.toLocaleString()}</span>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Costo Final Unit: ${item.valorFinalUnitario?.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-slate-900 text-white p-6 rounded-2xl mt-8">
            <div className="flex justify-between items-end">
              <span className="text-xs font-bold uppercase tracking-widest opacity-60">Total Facturado</span>
              <span className="text-3xl font-black">${factura.totalFactura?.toLocaleString()}</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}