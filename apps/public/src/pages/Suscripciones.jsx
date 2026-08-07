import { useState, useEffect } from 'react';
import SEO from '../components/public/SEO';
import MainNavbar from '../components/layout/MainNavbar';
import { useCatalog } from '../context/CatalogContext'; 
import { useNavigate } from 'react-router-dom'; 
import Footer from '../components/layout/Footer';
// 👉 Importamos herramientas para la consulta de suscripciones
import { collection, query, where } from 'firebase/firestore';
import { db } from '@decant/firebase-client';

const StepIcons = [
  <svg className="w-8 h-8 text-brand-orange mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeWidth="1.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.773 2.853M7.228 22l.758-2.83M14.44 5.06h-.01M2.014 12.062H2" /></svg>,
  <svg className="w-8 h-8 text-brand-orange mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
  <svg className="w-8 h-8 text-brand-orange mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeWidth="1.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>,
  <svg className="w-8 h-8 text-brand-orange mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
];

export default function Suscripciones() {
  const [openFaq, setOpenFaq] = useState(null);
  const navigate = useNavigate(); 
  const { productos, fetchProductosQuery } = useCatalog();

  // 👉 NUEVA LÓGICA: Cargar suscripciones al entrar a la página
  useEffect(() => {
    // Verificamos si ya existen suscripciones en el caché para no repetir el fetch
    const tieneSuscripciones = productos.some(p => p.categoria?.toLowerCase().includes('suscripci'));
    
    if (!tieneSuscripciones) {
            const qSuscripciones = query(collection(db, 'catalogo_publico'), where('categoria', '==', 'Suscripciones'));
      fetchProductosQuery(qSuscripciones);
    }
  }, [fetchProductosQuery, productos]);

  const productosSuscripcion = productos.filter(p => 
    p.categoria && p.categoria.toLowerCase().includes('suscripci')
  );

  const planDescorche = productosSuscripcion.find(p => 
    p.nombre && p.nombre.toLowerCase().includes('descorche')
  );
  
  const planTerruno = productosSuscripcion.find(p => 
    p.nombre && (p.nombre.toLowerCase().includes('terruño') || p.nombre.toLowerCase().includes('terruno'))
  );

  const handleAgregarSuscripcion = (productoDB) => {
    if (!productoDB) return;
    const planElegido = {
      ...productoDB,
      label: 'suscripción',
      cantidad: 1 
    };
    navigate('/checkout-suscripciones', { state: { planElegido } });
  };

  const faqs = [
    {
      pregunta: "¿Cómo funciona el cobro en MercadoPago?",
      respuesta: "Al suscribirte, MercadoPago indicará '30 días de prueba'. Esto significa que abonás tu primer mes por transferencia o link de pago inicial, y el débito automático recién se activará al mes siguiente. Nunca pagarás dos veces el mismo mes."
    },
    {
      pregunta: "¿Cuál es el costo y zona de envío?",
      respuesta: "Para nuestros socios de Rosario, el envío es 100% bonificado. Si sos del resto del país, despachamos tu selección por el transporte de tu preferencia (el costo del envío queda a cargo del suscriptor)."
    },
    {
      pregunta: "¿Puedo pausar o cancelar mi membresía?",
      respuesta: "Absoluta libertad. Podés pausar o dar de baja tu membresía en cualquier momento directamente desde tu app de MercadoPago, sin contratos ni letra chica."
    },
    {
      pregunta: "¿Cuándo recibo mi caja mensual?",
      respuesta: "Tu primera entrega se realiza dentro de las 48hs hábiles posteriores a tu alta. Para los meses siguientes, podés elegir recibirlo cada 30 días exactos o alinearte al ciclo general del Club (entre el 5 y el 10 de cada mes)."
    }
  ];

  return (
    <div className="min-h-screen bg-neutral-white font-poppins text-extra-black">
      <SEO title="Club de Vinos" description="Únete a nuestro club de vinos y recibe selecciones exclusivas todos los meses en la puerta de tu casa." />
      <MainNavbar />

      <section className="relative w-full py-32 md:py-40 bg-extra-black overflow-hidden flex items-center justify-center border-b border-light-blue/10">
        <div className="absolute inset-0 z-0 opacity-40 mix-blend-luminosity">
          <img src="https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&q=80" alt="Club Decant" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-extra-black via-extra-black/80 to-transparent z-10" />
        
        <div className="relative z-20 text-center px-6 max-w-4xl mx-auto flex flex-col items-center mt-10">
          <span className="bg-brand-orange/20 text-brand-orange border border-brand-orange/30 px-4 py-1.5 text-[9px] font-black uppercase tracking-widest mb-6 rounded-sm backdrop-blur-sm">Cupos Limitados</span>
          <h1 className="text-brand-white text-4xl md:text-6xl font-playfair font-black italic uppercase leading-tight mb-6 tracking-tight">El Ritual Decant</h1>
          <p className="text-light-blue text-sm md:text-base font-medium tracking-wide max-w-2xl leading-relaxed">Mucho más que recibir vino. Una membresía diseñada para paladares inquietos, con selecciones curadas por sommeliers y beneficios exclusivos.</p>
        </div>
      </section>

      <section className="py-24 bg-white border-b border-dark-blue/5">
        <div className="max-w-[90rem] mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-brand-orange font-poppins text-[12px] font-bold uppercase tracking-[0.4em] mb-4 block">El Proceso</span>
            <h2 className="text-dark-blue font-playfair font-black uppercase text-2xl md:text-3xl tracking-tight italic">Tu cava personal en 4 pasos</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              { title: "Tu Elección", text: "Seleccioná la membresía y registrá tus datos en nuestra web para iniciar la gestión." },
              { title: "Concierge Decant", text: "Nos contactamos personalmente para coordinar tus fechas y enviarte el link de MercadoPago." },
              { title: "Primera Entrega", text: "En menos de 48hs hábiles recibís tu primera selección en puerta (Envío bonificado en Rosario)." },
              { title: "Absoluta Libertad", text: "Disfrutá mes a mes. Pausá o cancelá tu suscripción desde la app cuando lo desees." }
            ].map((step, idx) => (
              <div key={idx} className="flex flex-col items-center text-center p-6 relative">
                <div className="absolute top-0 -left-4 text-9xl font-black text-gray-50 opacity-5 select-none z-0">{idx + 1}</div>
                <div className="relative z-10 flex flex-col items-center">
                  {StepIcons[idx]}
                  <h3 className="font-playfair italic text-xl text-dark-blue mb-3">{step.title}</h3>
                  <p className="text-xs text-light-blue leading-relaxed">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-[#F8F9FA]">
        <div className="max-w-[70rem] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-stretch">
            {/* PLAN 1: ESENCIAL (Descorche) */}
            <div className="bg-white p-8 md:p-12 border border-light-blue/10 shadow-sm flex flex-col h-full">
              <div className="text-center md:text-left">
                <span className="text-dark-grey text-[10px] font-black tracking-widest uppercase mb-2 block">Membresía</span>
                <h3 className="text-3xl font-playfair font-black italic text-extra-black mb-6">Descorche</h3>
              </div>
              {planDescorche?.imageUrl ? (
                <div className="w-40 h-40 md:w-48 md:h-48 mx-auto bg-gray-50 border border-light-blue/5 flex items-center justify-center p-4 mb-8 shrink-0">
                  <img src={planDescorche.imageUrl} alt="Selección Descorche" className="w-full h-full object-contain mix-blend-multiply drop-shadow-md" />
                </div>
              ) : (
                <div className="w-40 h-40 md:w-48 md:h-48 mx-auto bg-gray-50 border border-light-blue/5 flex items-center justify-center mb-8 shrink-0">
                  <span className="text-xs text-light-blue/50 uppercase tracking-widest">Sin Imagen</span>
                </div>
              )}
              <p className="text-sm text-dark-grey mb-6 leading-relaxed whitespace-pre-wrap text-center md:text-left">
                {planDescorche?.descripcion || "Ideal para quienes buscan descubrir nuevas cepas y bodegas boutique mes a mes, asegurando siempre una mesa bien servida."}
              </p>
              <div className="mb-8 text-center md:text-left">
                {planDescorche?.precioFinal ? (
                  <>
                    <span className="font-poppins text-3xl font-black text-brand-orange tracking-tight">${planDescorche.precioFinal.toLocaleString('es-AR')}</span>
                    <span className="text-xs font-bold text-light-blue ml-2 uppercase tracking-widest">/ mes</span>
                  </>
                ) : ( <span className="font-poppins text-lg font-black text-light-blue/50 tracking-tight">No disponible</span> )}
              </div>
              <ul className="flex flex-col gap-4 mb-10 flex-grow">
                {["Selección curada mensual", "Notas de cata y maridaje sugerido", "10% OFF en todo el Shop", "Envío bonificado en Rosario"].map((ben, i) => (
                  <li key={i} className="flex items-start gap-3 text-xs font-medium text-extra-black">
                    <svg className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>{ben}
                  </li>
                ))}
              </ul>
              <button onClick={() => handleAgregarSuscripcion(planDescorche)} disabled={!planDescorche} className="w-full bg-extra-black text-white py-4 text-[10px] font-black uppercase tracking-widest hover:bg-brand-orange transition-colors outline-none disabled:opacity-50 disabled:cursor-not-allowed mt-auto">
                {planDescorche ? 'Elegir Descorche' : 'Agotado'}
              </button>
            </div>

            {/* PLAN 2: EXCLUSIVA (Terruño) */}
            <div className="bg-extra-black p-8 md:p-12 border border-extra-black shadow-2xl flex flex-col h-full relative">
              <div className="absolute top-0 right-0 bg-brand-orange text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-sm">Más Elegido</div>
              <div className="text-center md:text-left mt-4 md:mt-0">
                <span className="text-brand-orange text-[10px] font-black tracking-widest uppercase mb-2 block">Membresía</span>
                <h3 className="text-3xl font-playfair font-black italic text-white mb-6">Terruño</h3>
              </div>
              {planTerruno?.imageUrl ? (
                <div className="w-40 h-40 md:w-48 md:h-48 mx-auto bg-white/5 flex items-center justify-center p-4 mb-8 shrink-0 rounded-sm">
                  <img src={planTerruno.imageUrl} alt="Selección Terruño" className="w-full h-full object-contain drop-shadow-lg" />
                </div>
              ) : (
                <div className="w-40 h-40 md:w-48 md:h-48 mx-auto bg-white/5 flex items-center justify-center mb-8 shrink-0 rounded-sm"><span className="text-xs text-light-blue/50 uppercase tracking-widest">Sin Imagen</span></div>
              )}
              <p className="text-light-blue text-sm mb-6 leading-relaxed whitespace-pre-wrap text-center md:text-left">
                {planTerruno?.descripcion || "Para paladares exigentes. Etiquetas de alta gama, añadas especiales y vinos de autor difíciles de conseguir en el mercado."}
              </p>
              <div className="mb-8 text-center md:text-left">
                {planTerruno?.precioFinal ? (
                  <>
                    <span className="font-poppins text-3xl font-black text-white tracking-tight">${planTerruno.precioFinal.toLocaleString('es-AR')}</span>
                    <span className="text-xs font-bold text-light-blue ml-2 uppercase tracking-widest">/ mes</span>
                  </>
                ) : ( <span className="font-poppins text-lg font-black text-light-blue/50 tracking-tight">No disponible</span> )}
              </div>
              <ul className="flex flex-col gap-4 mb-10 flex-grow">
                {["Selección Alta Gama mensual", "Acceso a pre-ventas limitadas", "15% OFF en todo el Shop", "Invitación a catas privadas", "Envío bonificado en Rosario"].map((ben, i) => (
                  <li key={i} className="flex items-start gap-3 text-xs font-medium text-gray-300">
                    <svg className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>{ben}
                  </li>
                ))}
              </ul>
              <button onClick={() => handleAgregarSuscripcion(planTerruno)} disabled={!planTerruno} className="w-full bg-brand-orange text-white py-4 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-extra-black transition-colors outline-none disabled:opacity-50 disabled:cursor-not-allowed mt-auto">
                {planTerruno ? 'Elegir Terruño' : 'Agotado'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16"><h2 className="text-dark-blue font-playfair font-black uppercase text-2xl tracking-tight italic">Preguntas Frecuentes</h2></div>
          <div className="flex flex-col gap-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-light-blue/20 rounded-sm overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === index ? null : index)} className="w-full flex justify-between items-center p-6 text-left bg-gray-50 hover:bg-gray-100 transition-colors outline-none">
                  <span className="font-bold text-xs uppercase tracking-wider text-extra-black pr-4">{faq.pregunta}</span>
                  <span className="text-brand-orange text-xl font-light">{openFaq === index ? '−' : '+'}</span>
                </button>
                <div className={`transition-all duration-300 ease-in-out ${openFaq === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                  <div className="p-6 pt-2 text-sm text-dark-grey leading-relaxed border-t border-light-blue/10 bg-white">{faq.respuesta}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}