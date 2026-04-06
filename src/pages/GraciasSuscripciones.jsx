import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const StarIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

export default function GraciasSuscripcion() {
  const [pedido, setPedido] = useState(null);
  const [numeroSocio, setNumeroSocio] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Leemos el localStorage exclusivo de la suscripción
    const data = localStorage.getItem('decant_sub_order');
    if (data) {
      setPedido(JSON.parse(data));
      
      // Generamos un número de socio (Ej: 0842)
      const numero = Math.floor(1000 + Math.random() * 9000);
      setNumeroSocio(numero.toString());
      
    } else {
      navigate('/');
    }
  }, [navigate]);

  if (!pedido) return null;

  return (
    <div className="min-h-screen bg-dark-blue text-[#F7F5F0] font-poppins flex flex-col items-center justify-center p-6 selection:bg-brand-orange selection:text-white">
      
      <div className="w-full max-w-lg mt-10 md:mt-16 animate-in fade-in duration-500">
        
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 border border-brand-orange bg-brand-orange/10 rounded-full flex items-center justify-center mb-6">
            <StarIcon className="w-8 h-8 text-brand-orange" />
          </div>
          
          <p className="font-poppins text-[11px] md:text-[12px] font-semibold uppercase tracking-[0.25em] text-brand-orange mb-4">
            BIENVENIDO AL CLUB EXCLUSIVO
          </p>
          
          <h2 className="font-playfair italic text-4xl md:text-5xl text-white">
            ¡Salud, {pedido.formData.nombre}!
          </h2>
        </div>

        {/* TARJETA DE SOCIO VIP */}
        <div className="bg-gradient-to-br from-[#1a2332] to-dark-blue border border-brand-orange/50 p-8 md:p-12 shadow-2xl mb-8 rounded-lg relative overflow-hidden">
          
          {/* Brillo decorativo */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/10 blur-3xl rounded-full"></div>

          <p className="text-sm text-[#F7F5F0]/80 leading-relaxed text-center mb-8 relative z-10">
            Tu suscripción ha sido confirmada. A partir de hoy, eres miembro oficial de nuestra cava.
          </p>
          
          <div className="border-t border-brand-orange/20 pt-6 relative z-10">
            
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] uppercase tracking-widest text-[#F7F5F0]/50">Miembro</span>
              <span className="text-xs font-bold uppercase text-white">
                {pedido.formData.nombre} {pedido.formData.apellido}
              </span>
            </div>
            
            {/* AQUÍ MOSTRAMOS EL NÚMERO DE SOCIO */}
            <div className="flex flex-col items-center justify-center mt-8 pt-6 border-t border-brand-orange/20 bg-black/20 p-4 rounded-md border border-white/5">
              <span className="font-poppins text-[10px] font-semibold uppercase tracking-[0.3em] text-brand-orange mb-2">
                N° de Socio
              </span>
              <span className="font-playfair italic text-4xl font-black text-white tracking-widest">
                #{numeroSocio}
              </span>
            </div>

          </div>
        </div>

        {/* ACCIONES FINAL */}
        <div className="flex flex-col items-center gap-6">
          <Link to="/shop" className="w-full bg-brand-orange text-white text-center text-[10px] font-black uppercase tracking-[0.2em] px-8 py-5 hover:bg-[#F7F5F0] hover:text-dark-blue transition-colors outline-none">
            Ingresar a la Cava
          </Link>
          
          <a href={`https://wa.me/TUNUMERO?text=Hola! Soy ${pedido.formData.nombre}. Acabo de suscribirme y mi número de socio es el #${numeroSocio}.`} target="_blank" rel="noreferrer" className="text-[10px] text-[#F7F5F0]/50 hover:text-brand-orange transition-colors underline decoration-[#F7F5F0]/30 underline-offset-4 outline-none">
            Escríbenos por WhatsApp
          </a>
        </div>

      </div>
    </div>
  );
}