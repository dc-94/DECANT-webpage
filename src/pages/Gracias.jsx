import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

// Ícono de éxito minimalista
const CheckIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M5 13l4 4L19 7" />
  </svg>
);

export default function Gracias() {
  const [pedido, setPedido] = useState(null);
  const [numeroPedido, setNumeroPedido] = useState(''); // Estado para el número aleatorio
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Recuperamos los datos del pedido
    const data = localStorage.getItem('decant_last_order');
    if (data) {
      setPedido(JSON.parse(data));
      
      // 2. Generamos número aleatorio de 6 dígitos (ej: 102345)
      const numero = Math.floor(100000 + Math.random() * 900000);
      setNumeroPedido(numero.toString());
      
      // Opcional: Limpiar localStorage para seguridad
      // localStorage.removeItem('decant_last_order'); 
    } else {
      navigate('/'); // Redirigir si acceden sin comprar
    }
  }, [navigate]);

  if (!pedido) return null;

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-dark-blue font-poppins flex flex-col items-center justify-center p-6 selection:bg-brand-orange selection:text-white">
      
      {/* HEADER SUPERIOR ELIMINADO */}

      <div className="w-full max-w-lg mt-10 md:mt-16 animate-in fade-in duration-500">
        
        {/* ENCABEZADO DE ÉXITO REORDENADO */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 border border-brand-orange/30 bg-brand-orange/5 rounded-full flex items-center justify-center mb-6 animate-in zoom-in delay-150 duration-500">
            <CheckIcon className="w-8 h-8 text-brand-orange" />
          </div>
          
          {/* TÍTULO PRINCIPAL: POPSINS (No Serif), SEMI-BOLD, TRACKING ESPACIADO */}
          <p className="font-poppins text-[11px] md:text-[12px] font-semibold uppercase tracking-[0.25em] text-dark-blue/80 mb-4">
            TU PEDIDO #{numeroPedido} HA SIDO CONFIRMADO
          </p>
          
          <h2 className="font-playfair italic text-4xl md:text-5xl text-dark-blue">
            ¡Salud, {pedido.formData.nombre}!
          </h2>
        </div>

        {/* TICKET / RECIBO BOUTIQUE */}
        <div className="bg-white border border-dark-blue/10 p-8 md:p-12 shadow-sm mb-8 relative">
          
          {/* Detalles decorativos del ticket */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#F7F5F0] w-6 h-6 rounded-full border-b border-dark-blue/10"></div>
          
          <p className="text-sm text-dark-blue/80 leading-relaxed text-center mb-8">
            Estamos preparando tu cava. Hemos enviado un correo con los detalles e instrucciones de pago a <span className="font-semibold text-dark-blue">{pedido.formData.email}</span>.
          </p>
          
          <div className="border-t border-dark-blue/10 pt-6">
            
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] uppercase tracking-widest text-light-blue">Método de pago</span>
              <span className="text-xs font-bold uppercase text-dark-blue">
                {pedido.formData.pago === 'transferencia' ? 'Transferencia (5% OFF)' : 'Mercado Pago'}
              </span>
            </div>
            
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] uppercase tracking-widest text-light-blue">Entrega</span>
              <span className="text-xs font-bold uppercase text-dark-blue">
                {pedido.formData.envio === 'retiro' ? 'Retiro por Cava' : 'Envío a domicilio'}
              </span>
            </div>

            {/* Total: ETIQUETA EN POPSINS (No Serif), PRECIO MÁS GRANDE */}
            <div className="flex justify-between items-end mt-8 pt-6 border-t border-dark-blue/10">
              <span className="font-poppins font-semibold text-xl text-dark-blue">
                Total Abonar
              </span>
              <span className="font-poppins text-3xl font-black text-brand-orange">
                ${pedido.totalFinal.toLocaleString()}
              </span>
            </div>

          </div>
        </div>

        {/* ACCIONES FINAL */}
        <div className="flex flex-col items-center gap-6">
          <Link 
            to="/shop" 
            className="w-full bg-dark-blue text-brand-white text-center text-[10px] font-black uppercase tracking-[0.2em] px-8 py-5 hover:bg-brand-orange transition-colors outline-none"
          >
            Volver a la web
          </Link>
          
          <a 
            href={`https://wa.me/TUNUMERO?text=Hola! Soy ${pedido.formData.nombre}. Mi pedido es el #${numeroPedido}, tengo una consulta.`}
            target="_blank"
            rel="noreferrer"
            className="text-[10px] text-light-blue hover:text-brand-orange transition-colors underline decoration-light-blue/30 underline-offset-4 outline-none"
          >
            ¿Necesitas ayuda? Escríbenos por WhatsApp
          </a>
        </div>

      </div>
    </div>
  );
}