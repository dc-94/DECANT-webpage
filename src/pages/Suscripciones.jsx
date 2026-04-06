import { useState } from 'react';
import MainNavbar from '../components/layout/MainNavbar';
// 1. IMPORTAMOS EL CONTEXTO DEL CARRITO
import { useCart } from '../context/CartContext'; 

const StepIcons = [
  <svg className="w-8 h-8 text-brand-orange mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeWidth="1.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.773 2.853M7.228 22l.758-2.83M14.44 5.06h-.01M2.014 12.062H2" /></svg>,
  <svg className="w-8 h-8 text-brand-orange mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
  <svg className="w-8 h-8 text-brand-orange mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeWidth="1.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>,
  <svg className="w-8 h-8 text-brand-orange mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeWidth="1.5" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
];

export default function Suscripciones() {
  const [openFaq, setOpenFaq] = useState(null);
  
  // 2. EXTRAEMOS LA FUNCIÓN ADDTOCART
  const { addToCart } = useCart(); 

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

  // 3. LÓGICA PARA AGREGAR EL PLAN AL CARRITO
  const handleAgregarSuscripcion = (tipoPlan) => {
    // Construimos el objeto del producto dependiendo del botón presionado
    const productoSuscripcion = {
      id: tipoPlan === 'esencial' ? 'sub-esencial-01' : 'sub-exclusiva-01', // ID único
      nombre: tipoPlan === 'esencial' ? 'Membresía Esencial' : 'Membresía Exclusiva',
      varietal: 'Suscripción Mensual',
      // PRECIOS: Actualiza estos valores con el costo real de tus planes
      precioFinal: tipoPlan === 'esencial' ? 15000 : 35000, 
      precio: tipoPlan === 'esencial' ? 15000 : 35000,
      imageUrl: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&q=80",
      label: 'suscripción', // ¡MUY IMPORTANTE! Esto activa el botón VIP en el drawer
      stock: 999 // Stock infinito para suscripciones
    };

    // Agregamos 1 unidad al carrito
    addToCart(productoSuscripcion, 1);
    
    // Opcional: Si tienes una función para abrir el carrito manualmente, la llamarías aquí.
    // Ej: alert("Suscripción agregada a tu copa. ¡Abre el carrito para finalizar!");
  };

  return (
    <div className="min-h-screen bg-neutral-white font-poppins text-extra-black">
      <MainNavbar />

      <section className="relative w-full py-32 md:py-40 bg-extra-black overflow-hidden flex items-center justify-center border-b border-light-blue/10">
        <div className="absolute inset-0 z-0 opacity-40 mix-blend-luminosity">
          <img src="https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&q=80" alt="Club Decant" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-extra-black via-extra-black/80 to-transparent z-10" />
        
        <div className="relative z-20 text-center px-6 max-w-4xl mx-auto flex flex-col items-center mt-10">
          <span className="bg-brand-orange/20 text-brand-orange border border-brand-orange/30 px-4 py-1.5 text-[9px] font-black uppercase tracking-widest mb-6 rounded-sm backdrop-blur-sm">
            Cupos Limitados
          </span>
          <h1 className="text-brand-white text-4xl md:text-6xl font-playfair font-black italic uppercase leading-tight mb-6 tracking-tight">
            El Ritual Decant
          </h1>
          <p className="text-light-blue text-sm md:text-base font-medium tracking-wide max-w-2xl leading-relaxed">
            Mucho más que recibir vino. Una membresía diseñada para paladares inquietos, con selecciones curadas por sommeliers y beneficios exclusivos.
          </p>
        </div>
      </section>

      <section className="py-24 bg-white border-b border-dark-blue/5">
        <div className="max-w-[90rem] mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-brand-orange font-poppins text-[12px] font-bold uppercase tracking-[0.4em] mb-4 block">El Proceso</span>
            <h2 className="text-dark-blue font-playfair font-black uppercase text-2xl md:text-3xl tracking-tight italic">
              Tu cava personal en 4 pasos
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              { title: "Tu Elección", text: "Seleccioná la membresía y registrá tus datos en nuestra web para iniciar la gestión." },
              { title: "Concierge Decant", text: "Nos contactamos personalmente para coordinar tus fechas y enviarte el link de MercadoPago." },
              { title: "Primera Entrega", text: "En menos de 48hs hábiles recibís tu primera selección en puerta (Envío bonificado en Rosario)." },
              { title: "Absoluta Libertad", text: "Disfrutá mes a mes. Pausá o cancelá tu suscripción desde la app cuando lo desees." }
            ].map((step, idx) => (
              <div key={idx} className="flex flex-col items-center text-center p-6 relative">
                <div className="absolute top-0 -left-4 text-9xl font-black text-gray-50 opacity-5 select-none z-0">
                  {idx + 1}
                </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            
            {/* PLAN ESENCIAL */}
            <div className="bg-white p-8 md:p-12 border border-light-blue/10 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col">
              <span className="text-dark-grey text-[10px] font-black tracking-widest uppercase mb-2">Membresía</span>
              <h3 className="text-3xl font-playfair font-black italic text-extra-black mb-6">Esencial</h3>
              <p className="text-sm text-dark-grey mb-8 leading-relaxed">
                Ideal para quienes buscan descubrir nuevas cepas y bodegas boutique mes a mes, asegurando siempre una mesa bien servida.
              </p>
              
              <ul className="flex flex-col gap-4 mb-10 flex-grow">
                {["Selección mensual de 3 a 4 botellas", "Notas de cata y maridaje sugerido", "10% OFF en todo el Shop", "Envío bonificado en Rosario"].map((ben, i) => (
                  <li key={i} className="flex items-start gap-3 text-xs font-medium text-extra-black">
                    <svg className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    {ben}
                  </li>
                ))}
              </ul>
              
              {/* 4. CONECTAMOS EL BOTÓN ESENCIAL */}
              <button 
                onClick={() => handleAgregarSuscripcion('esencial')}
                className="w-full bg-extra-black text-white py-4 text-[10px] font-black uppercase tracking-widest hover:bg-brand-orange transition-colors outline-none"
              >
                Elegir Esencial
              </button>
            </div>

            {/* PLAN EXCLUSIVO */}
            <div className="bg-extra-black p-8 md:p-12 border border-extra-black shadow-2xl flex flex-col relative transform md:-translate-y-4">
              <div className="absolute top-0 right-0 bg-brand-orange text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-sm">
                Más Elegido
              </div>
              <span className="text-brand-orange text-[10px] font-black tracking-widest uppercase mb-2">Membresía</span>
              <h3 className="text-3xl font-playfair font-black italic text-white mb-6">Exclusiva</h3>
              <p className="text-light-blue text-sm mb-8 leading-relaxed">
                Para paladares exigentes. Etiquetas de alta gama, añadas especiales y vinos de autor difíciles de conseguir en el mercado.
              </p>
              
              <ul className="flex flex-col gap-4 mb-10 flex-grow">
                {["Selección Alta Gama (3 a 4 botellas)", "Acceso a pre-ventas de añadas limitadas", "15% OFF en todo el Shop", "Invitación a catas privadas", "Envío bonificado en Rosario"].map((ben, i) => (
                  <li key={i} className="flex items-start gap-3 text-xs font-medium text-gray-300">
                    <svg className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    {ben}
                  </li>
                ))}
              </ul>
              
              {/* 5. CONECTAMOS EL BOTÓN EXCLUSIVO */}
              <button 
                onClick={() => handleAgregarSuscripcion('exclusiva')}
                className="w-full bg-brand-orange text-white py-4 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-extra-black transition-colors outline-none"
              >
                Elegir Exclusiva
              </button>
            </div>

          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-dark-blue font-playfair font-black uppercase text-2xl tracking-tight italic">
              Preguntas Frecuentes
            </h2>
          </div>

          <div className="flex flex-col gap-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-light-blue/20 rounded-sm overflow-hidden">
                <button 
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex justify-between items-center p-6 text-left bg-gray-50 hover:bg-gray-100 transition-colors outline-none"
                >
                  <span className="font-bold text-xs uppercase tracking-wider text-extra-black pr-4">{faq.pregunta}</span>
                  <span className="text-brand-orange text-xl font-light">{openFaq === index ? '−' : '+'}</span>
                </button>
                <div className={`transition-all duration-300 ease-in-out ${openFaq === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                  <div className="p-6 pt-2 text-sm text-dark-grey leading-relaxed border-t border-light-blue/10 bg-white">
                    {faq.respuesta}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}