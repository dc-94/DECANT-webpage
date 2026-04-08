import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const CheckIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M5 13l4 4L19 7" /></svg>
);

export default function Gracias() {
  const [pedido, setPedido] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const data = localStorage.getItem('decant_last_order');
    if (data) {
      setPedido(JSON.parse(data));
    } else {
      navigate('/');
    }
  }, [navigate]);

  if (!pedido) return null;

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-dark-blue font-poppins flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg animate-in fade-in duration-500">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 border border-brand-orange/30 bg-brand-orange/5 rounded-full flex items-center justify-center mb-6">
            <CheckIcon className="w-8 h-8 text-brand-orange" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-dark-blue/80 mb-4">
            PEDIDO #{pedido.ordenDisplay} CONFIRMADO
          </p>
          <h2 className="font-playfair italic text-4xl md:text-5xl text-dark-blue">¡Salud, {pedido.formData.nombre}!</h2>
        </div>

        <div className="bg-white border border-dark-blue/10 p-8 md:p-12 shadow-sm mb-8 relative">
          <p className="text-sm text-dark-blue/80 leading-relaxed text-center mb-8">
            Tu cava está en camino. Puedes seguir el estado de tu orden en tiempo real aquí:
          </p>
          
          {/* BOTÓN DE TRACKING VIP */}
          <Link to={`/pedido/${pedido.id}`} className="block w-full border-2 border-brand-orange text-brand-orange text-center py-4 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-brand-orange hover:text-white transition-all mb-8">
            Ver Seguimiento de mi Orden
          </Link>

          <div className="border-t border-dark-blue/10 pt-6 space-y-4">
            <div className="flex justify-between text-[10px] uppercase tracking-widest text-light-blue">
              <span>Pago: {pedido.formData.pago}</span>
              <span>Envío: {pedido.formData.envio}</span>
            </div>
            <div className="flex justify-between items-end mt-4">
              <span className="font-semibold text-xl">Total</span>
              <span className="text-3xl font-black text-brand-orange">${pedido.totalFinal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6">
          <Link to="/shop" className="w-full bg-dark-blue text-brand-white text-center text-[10px] font-black uppercase tracking-[0.2em] px-8 py-5 hover:bg-brand-orange transition-colors outline-none">Volver a la tienda</Link>
          <a href={`https://wa.me/TUNUMERO?text=Hola! Soy ${pedido.formData.nombre}. Mi pedido es el #${pedido.ordenDisplay}.`} target="_blank" rel="noreferrer" className="text-[10px] text-light-blue hover:text-brand-orange underline decoration-light-blue/30 underline-offset-4 outline-none uppercase tracking-widest font-bold">¿Dudas? WhatsApp</a>
        </div>
      </div>
    </div>
  );
}