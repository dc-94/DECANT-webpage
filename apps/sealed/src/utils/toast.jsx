import toast from 'react-hot-toast';

// Toast simple de éxito
export const toastOk = (mensaje) => toast.success(mensaje);

// Toast de error
export const toastError = (mensaje) => toast.error(mensaje);

// Toast con número de socio y botón de copiar (reemplaza el alert del PIN)
export const toastNumeroSocio = (numero) => {
  toast.custom((t) => (
    <div className={`${t.visible ? 'animate-in fade-in' : 'animate-out fade-out'} bg-white border border-slate-200 shadow-lg rounded-lg p-4 flex items-center gap-4 max-w-sm`}>
      <div className="flex-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Cliente agregado · Número de socio</p>
        <p className="text-2xl font-black text-brand-orange tracking-widest">{numero}</p>
      </div>
      <button
        onClick={() => {
          navigator.clipboard.writeText(numero);
          toast.success('Número copiado', { duration: 1500 });
        }}
        className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded hover:bg-brand-orange transition-colors"
      >
        Copiar
      </button>
    </div>
  ), { duration: 8000 });
};