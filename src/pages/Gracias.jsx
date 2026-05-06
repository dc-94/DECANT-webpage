import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

const CheckIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M5 13l4 4L19 7" /></svg>
);

export default function Gracias() {
  const [pedido, setPedido] = useState(null);
  const [whatsappEmpresa, setWhatsappEmpresa] = useState('');
  const [loading, setLoading] = useState(true); // 👉 Estado de carga para evitar renders prematuros
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDatos = async () => {
      try {
        const data = localStorage.getItem('decant_last_order');
        if (data) {
          const parsed = JSON.parse(data);
          setPedido(parsed);
        } else {
          // Si no hay datos en 2 segundos, volvemos al inicio
          setTimeout(() => navigate('/'), 2000);
        }

        const storefrontSnap = await getDoc(doc(db, 'ajustes_storefront', 'home'));
        if (storefrontSnap.exists() && storefrontSnap.data().datosEmpresa?.whatsapp) {
          setWhatsappEmpresa(storefrontSnap.data().datosEmpresa.whatsapp);
        }
      } catch (err) {
         console.error("Error cargando página de gracias:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDatos();
  }, [navigate]);

  // Pantalla de transición segura
  if (loading || !pedido) {
    return (
      <div className="min-h-screen bg-[#F7F5F0] flex flex-col items-center justify-center font-poppins">
        <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-[10px] uppercase tracking-[0.2em] font-black text-dark-blue/40">Preparando tu recibo...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-dark-blue font-poppins flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg animate-in fade-in duration-500">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 border border-brand-orange/30 bg-brand-orange/5 rounded-full flex items-center justify-center mb-6">
            <CheckIcon className="w-8 h-8 text-brand-orange" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-dark-blue/80 mb-4">
            PEDIDO #{pedido?.ordenDisplay || '---'} CONFIRMADO
          </p>
          {/* 👉 Uso de Optional Chaining para evitar el TypeError */}
          <h2 className="font-playfair italic text-4xl md:text-5xl text-dark-blue leading-tight">
            ¡Salud, {pedido?.formData?.nombre || 'gracias por tu compra'}!
          </h2>
        </div>

        <div className="bg-white border border-dark-blue/10 p-8 md:p-12 shadow-sm mb-8 relative">
          <p className="text-sm text-dark-blue/80 leading-relaxed text-center mb-8">
            Tu cava está en camino. Puedes seguir el estado de tu orden en tiempo real aquí:
          </p>
          
          <Link to={`/pedido/${pedido?.id}`} className="block w-full border-2 border-brand-orange text-brand-orange text-center py-4 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-brand-orange hover:text-white transition-all mb-8">
            Ver Seguimiento de mi Orden
          </Link>

          <div className="border-t border-dark-blue/10 pt-6 space-y-4">
            <div className="flex justify-between text-[10px] uppercase tracking-widest text-light-blue">
              {/* 👉 Acceso seguro a formData */}
              <span>Pago: {pedido?.formData?.pago || 'Pendiente'}</span>
              <span>Envío: {pedido?.formData?.envio || 'A convenir'}</span>
            </div>
            <div className="flex justify-between items-end mt-4">
              <span className="font-semibold text-xl text-dark-blue/60">Total</span>
              <span className="text-3xl font-black text-brand-orange">
                ${pedido?.totalFinal?.toLocaleString() || '0'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6">
          <Link to="/shop" className="w-full bg-dark-blue text-brand-white text-center text-[10px] font-black uppercase tracking-[0.2em] px-8 py-5 hover:bg-brand-orange transition-colors outline-none">Volver a la tienda</Link>
          
          {whatsappEmpresa && (
            <a 
              href={`https://wa.me/${whatsappEmpresa}?text=Hola! Soy ${pedido?.formData?.nombre}. Mi pedido es el #${pedido?.ordenDisplay}.`} 
              target="_blank" 
              rel="noreferrer" 
              className="text-[10px] text-light-blue hover:text-brand-orange underline decoration-light-blue/30 underline-offset-4 outline-none uppercase tracking-widest font-bold"
            >
              ¿Dudas? WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
}