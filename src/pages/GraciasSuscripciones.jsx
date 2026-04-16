import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom'; // 👉 Agregamos useSearchParams
import SEO from '../components/public/SEO';
import { db } from '../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function GraciasSuscripciones() {
  const [ordenData, setOrdenData] = useState(null);
  const correoEnviado = useRef(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // 👉 Para leer la URL que devuelve Mercado Pago

  useEffect(() => {
    const fetchOrderAndConfirm = async () => {
      // 1. Verificamos que venga de Mercado Pago (que tenga el ID de suscripción en la URL)
      const preapprovalId = searchParams.get('preapproval_id');
      const dataStr = localStorage.getItem('decant_sub_order');

      // Si entró "por la ventana" sin pagar o el LocalStorage está vacío, lo expulsamos
      if (!dataStr || !preapprovalId) {
        navigate('/'); 
        return;
      }

      const order = JSON.parse(dataStr);
      setOrdenData(order);

      // Si ya hicimos el proceso (para evitar que React envíe el mail 2 veces), cortamos acá
      if (correoEnviado.current || order.correoEnviado) return;
      correoEnviado.current = true;

      try {
        // 2. Actualizamos la orden en Firebase como PAGADA
        await updateDoc(doc(db, 'pedidos', order.id), {
          estado: 'Pagado',
          pagoAprobado: true,
          mpPreapprovalId: preapprovalId // Guardamos el comprobante de MP
        });

        // 3. Actualizamos al cliente para que oficialmente sea SOCIO
        await updateDoc(doc(db, 'clientes', order.clienteEmail), {
          esSocio: true,
          planActual: order.plan
        });

        // 4. Enviamos el Correo de Bienvenida por Brevo
        await fetch('https://enviarconfirmacionpedido-jztey4742a-uc.a.run.app', { // 👈 Tu URL de correos
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toEmail: order.clienteEmail,
            toName: `${order.formData.nombre} ${order.formData.apellido}`,
            templateId: 2, // 👈 Tu template ID de Brevo para BIENVENIDA AL CLUB
            params: {
              nombre: order.formData.nombre,
              plan: order.plan,
              pin: order.numeroCliente, // Usamos el número de cliente generado
              orden: order.ordenDisplay,
              link_tracking: `${window.location.origin}/`
            }
          })
        });

        // 5. Marcamos en localstorage que ya se envió para no repetir
        localStorage.setItem('decant_sub_order', JSON.stringify({ ...order, correoEnviado: true }));

      } catch (error) {
        console.error("Error confirmando pago y enviando mail:", error);
      }
    };

    fetchOrderAndConfirm();
  }, [navigate, searchParams]);

  if (!ordenData) return null; // Pantalla en blanco una fracción de segundo mientras redirige o carga

  return (
    <div className="min-h-screen bg-extra-black text-brand-white font-poppins flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <SEO title="¡Bienvenido al Club!" description="Tu suscripción a Decant se ha completado." />
      
      {/* Círculos de luz de fondo */}
      <div className="absolute top-[-20%] right-[-10%] w-[50rem] h-[50rem] bg-brand-orange/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[40rem] h-[40rem] bg-light-blue/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <div className="max-w-2xl w-full text-center relative z-10 flex flex-col items-center">
        <svg className="w-20 h-20 text-brand-orange mb-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        
        <h1 className="font-playfair italic text-5xl md:text-6xl text-brand-white mb-6">¡Bienvenido al Club!</h1>
        <p className="text-sm md:text-base text-brand-white/80 mb-12 max-w-lg mx-auto leading-relaxed">
          Hemos confirmado tu suscripción al plan <strong className="text-brand-orange font-bold uppercase">{ordenData.plan}</strong>. Te hemos enviado un correo con todos los detalles de tu nueva membresía.
        </p>

        <div className="bg-dark-blue/20 backdrop-blur-md border border-light-blue/20 p-8 rounded-sm w-full mb-12 shadow-xl">
          <span className="text-[10px] uppercase tracking-[0.3em] text-brand-white/50 block mb-2 font-bold">Tu PIN de Socio Exclusivo</span>
          <p className="text-5xl font-black text-brand-orange tracking-widest">{ordenData.numeroCliente}</p>
          <p className="text-[10px] text-brand-white/60 mt-4 uppercase tracking-widest">Guárdalo. Lo usarás para aplicar tus descuentos en la tienda.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link to="/" className="bg-brand-white text-extra-black text-[10px] font-black uppercase tracking-[0.2em] px-8 py-5 hover:bg-brand-orange hover:text-brand-white transition-all w-full sm:w-auto text-center outline-none">
            Volver al Inicio
          </Link>
          <a href={`https://wa.me/5493416878568?text=Hola!%20Acabo%20de%20suscribirme%20al%20plan%20${ordenData.plan}.%20Mi%20orden%20es%20%23${ordenData.ordenDisplay}`} target="_blank" rel="noopener noreferrer" className="bg-transparent border border-light-blue/30 text-brand-white text-[10px] font-black uppercase tracking-[0.2em] px-8 py-5 hover:border-brand-orange hover:text-brand-orange transition-all w-full sm:w-auto text-center outline-none">
            Contactar a mi Concierge
          </a>
        </div>
      </div>
    </div>
  );
}