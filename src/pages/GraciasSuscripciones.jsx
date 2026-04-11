import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const StarIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
);

export default function GraciasSuscripciones() {
  const [pedido, setPedido] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const data = localStorage.getItem('decant_sub_order');
    if (data) {
      setPedido(JSON.parse(data));
    } else {
      navigate('/');
    }
  }, [navigate]);

  if (!pedido) return null;

  return (
    <div className="min-h-screen bg-dark-blue text-[#F7F5F0] font-poppins flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg animate-in fade-in duration-500">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 border border-brand-orange bg-brand-orange/10 rounded-full flex items-center justify-center mb-6">
            <StarIcon className="w-8 h-8 text-brand-orange" />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-orange mb-4">BIENVENIDO AL CLUB EXCLUSIVO</p>
          <h2 className="font-playfair italic text-4xl md:text-5xl text-white">¡Salud, {pedido.formData.nombre}!</h2>
        </div>

        <div className="bg-gradient-to-br from-[#1a2332] to-dark-blue border border-brand-orange/50 p-8 md:p-12 shadow-2xl mb-8 rounded-lg text-center">
          <p className="text-sm text-[#F7F5F0]/80 mb-8">Ya eres miembro oficial. Tu tarjeta de socio digital ha sido activada.</p>
          
          <div className="bg-black/20 p-6 rounded-md border border-white/5 inline-block w-full">
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-brand-orange mb-2 block">N° DE SOCIO (PIN)</span>
            <span className="font-playfair italic text-5xl font-black text-white tracking-widest">#{pedido?.numeroSocio}</span>
          </div>
          
          <p className="text-[9px] uppercase tracking-widest text-[#F7F5F0]/40 mt-6 italic">
            * Usa este número en tus compras para activar tus descuentos automáticos.
          </p>
        </div>

        <div className="flex flex-col items-center gap-6">
          <Link to={`/pedido/${pedido.id}`} className="w-full border border-white/20 text-white text-center text-[10px] font-black uppercase tracking-[0.2em] px-8 py-5 hover:bg-brand-orange hover:border-brand-orange transition-all">Ver Estado de mi Membresía</Link>
          <Link to="/shop" className="w-full bg-brand-orange text-white text-center text-[10px] font-black uppercase tracking-[0.2em] px-8 py-5 hover:bg-white hover:text-dark-blue transition-colors">Comprar con mi descuento</Link>
        </div>
      </div>
    </div>
  );
}