import { Link } from 'react-router-dom';

export default function ModalSocio({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-poppins">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-[#F7F5F0] w-full max-w-md p-8 shadow-2xl border border-dark-blue/10 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-dark-blue/50 hover:text-brand-orange text-2xl leading-none outline-none"
        >
          ×
        </button>

        <div className="text-center mb-6">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-orange block mb-2">
            Club DECANT
          </span>
          <h2 className="font-playfair italic text-3xl text-dark-blue mb-4">
            Beneficios de Socio
          </h2>
          <p className="text-sm text-dark-blue/70 leading-relaxed">
            Como socio, tu descuento se aplica <strong>automáticamente</strong> al comprar:
            solo usá el email de tu membresía en el checkout. Sin códigos, sin contraseñas.
          </p>
        </div>

        <div className="bg-brand-orange/5 border border-brand-orange/20 rounded-sm p-5 mb-6 text-center">
          <p className="text-[11px] font-black uppercase tracking-widest text-brand-orange mb-1">
            ¿Todavía no sos socio?
          </p>
          <p className="text-xs text-dark-blue/70">
            Sumate al club y accedé a hasta 20% off en toda la tienda.
          </p>
        </div>

        <Link
          to="/suscripciones"
          onClick={onClose}
          className="block text-center w-full bg-dark-blue text-white text-[11px] font-black uppercase tracking-[0.2em] px-8 py-4 hover:bg-brand-orange transition-all outline-none"
        >
          Conocer los planes
        </Link>
      </div>
    </div>
  );
}