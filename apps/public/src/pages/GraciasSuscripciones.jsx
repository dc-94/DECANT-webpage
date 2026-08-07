import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../components/public/SEO';
import { db } from '@decant/firebase-client';
import { doc, onSnapshot } from 'firebase/firestore';

// Íconos SVG reutilizables
const CheckIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PackageIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

export default function GraciasSuscripciones() {
  const [ordenData, setOrdenData] = useState(null);
  const [estadoPago, setEstadoPago] = useState('procesando'); // 'procesando' o 'pagado'
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Leemos los datos básicos guardados en la memoria local
    const dataStr = localStorage.getItem('decant_sub_order');

    if (!dataStr) {
      navigate('/'); 
      return;
    }

    const order = JSON.parse(dataStr);
    setOrdenData(order);

    // 2. Escuchamos SOLO este pedido en tiempo real (Push)
    const docRef = doc(db, 'pedidos', order.id);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const pedidoActualizado = docSnap.data();
        
        // Cuando el backend confirme el pago, actualizamos la vista
        if (pedidoActualizado.estado === 'Pagado') {
          setEstadoPago('pagado');
        }
      }
    }, (error) => {
      console.error("Error al escuchar la orden:", error);
    });

    // Limpiamos la conexión al desmontar
    return () => unsubscribe();

  }, [navigate]);

  if (!ordenData) return null;

  return (
    <div className="min-h-screen bg-extra-black text-brand-white font-poppins flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <SEO title="Estado de Suscripción" description="Revisa el estado de tu suscripción a Decant." />
      
      {/* Luces de fondo decorativas */}
      <div className="absolute top-[-20%] right-[-10%] w-[50rem] h-[50rem] bg-brand-orange/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[40rem] h-[40rem] bg-light-blue/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <div className="max-w-2xl w-full text-center relative z-10 flex flex-col items-center">
        
        {/* ==========================================
            CABECERA DINÁMICA (Procesando vs Pagado)
            ========================================== */}
        <div className="min-h-[160px] flex flex-col items-center justify-center mb-6">
          {estadoPago === 'procesando' ? (
            <div className="flex flex-col items-center animate-in fade-in duration-500">
              <div className="w-16 h-16 border-4 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin mb-6"></div>
              <h1 className="font-playfair italic text-3xl md:text-5xl text-brand-white mb-2">Procesando pago...</h1>
              <p className="text-brand-orange text-xs font-black uppercase tracking-widest animate-pulse">Aguardando confirmación</p>
            </div>
          ) : (
            <div className="flex flex-col items-center animate-in zoom-in duration-500">
              <CheckIcon className="w-20 h-20 text-brand-orange mb-4" />
              <h1 className="font-playfair italic text-4xl md:text-5xl text-brand-white mb-2">¡Pago Confirmado!</h1>
              <p className="text-green-400 text-xs font-black uppercase tracking-widest">Suscripción activa</p>
            </div>
          )}
        </div>

        {/* ==========================================
            INFORMACIÓN DE LA ORDEN SIEMPRE VISIBLE
            ========================================== */}
        <p className="text-sm md:text-base text-brand-white/80 mb-8 max-w-lg mx-auto leading-relaxed">
          Hemos recibido tu orden <strong className="text-brand-white font-bold">#{ordenData.ordenDisplay}</strong> para el plan <strong className="text-brand-orange font-bold uppercase">{ordenData.plan}</strong>.
        </p>

        {/* ==========================================
            BLOQUE DE TRACKING (Solo si está pagado)
            ========================================== */}
        <div className={`w-full overflow-hidden transition-all duration-700 ease-in-out ${estadoPago === 'pagado' ? 'max-h-[300px] mb-8 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="bg-brand-orange/10 border border-brand-orange/30 p-6 rounded-sm w-full flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-left">
              <div className="bg-brand-orange p-3 rounded-full text-extra-black">
                <PackageIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-brand-orange mb-1">Tu Kit de Bienvenida</h3>
                <p className="text-[10px] text-brand-white/70 uppercase tracking-wider">Ya estamos preparando tu envío.</p>
              </div>
            </div>
            <Link 
              to={`/pedido/${ordenData.id}`} 
              className="bg-brand-orange text-extra-black text-[10px] font-black uppercase tracking-[0.2em] px-6 py-4 hover:bg-white transition-all outline-none w-full sm:w-auto text-center shadow-lg"
            >
              Seguir Envío
            </Link>
          </div>
        </div>

        {/* ==========================================
            PIN DE SOCIO SIEMPRE VISIBLE
            ========================================== */}
        <div className="bg-dark-blue/20 backdrop-blur-md border border-light-blue/20 p-8 rounded-sm w-full mb-10 shadow-xl">
          <span className="text-[10px] uppercase tracking-[0.3em] text-brand-white/50 block mb-2 font-bold">Tu PIN de Socio Exclusivo</span>
          <p className="text-5xl font-black text-brand-orange tracking-widest">{ordenData.numeroCliente}</p>
          <p className="text-[10px] text-brand-white/60 mt-4 uppercase tracking-widest leading-relaxed">
            Este es tu código personal de acceso.<br/>
            Ingrésalo en la sección "Soy Socio" del menú para aplicar tus beneficios.
          </p>
        </div>

        {/* Botones de acción inferiores */}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link to="/" className="bg-brand-white text-extra-black text-[10px] font-black uppercase tracking-[0.2em] px-8 py-5 hover:bg-brand-orange hover:text-brand-white transition-all w-full sm:w-auto text-center outline-none">
            Volver al Inicio
          </Link>
          <a href={`https://wa.me/5493416878568?text=Hola!%20Realicé%20el%20pago%20de%20mi%20suscripción%20al%20plan%20${ordenData.plan}.%20Mi%20orden%20es%20%23${ordenData.ordenDisplay}`} target="_blank" rel="noopener noreferrer" className="bg-transparent border border-light-blue/30 text-brand-white text-[10px] font-black uppercase tracking-[0.2em] px-8 py-5 hover:border-brand-orange hover:text-brand-orange transition-all w-full sm:w-auto text-center outline-none">
            Contactar a mi Concierge
          </a>
        </div>
        
      </div>
    </div>
  );
}