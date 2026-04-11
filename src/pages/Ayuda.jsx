import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import SEO from '../components/public/SEO';
import MainNavbar from '../components/layout/MainNavbar';
import Footer from '../components/layout/Footer';
import { db } from '../config/firebase'; // 👉 Importamos Firebase
import { doc, getDoc } from 'firebase/firestore';

export default function Ayuda() {
  const location = useLocation();
  const [openSection, setOpenSection] = useState(null);
  
  // 👉 ESTADO PARA LOS DATOS DINÁMICOS DE LA EMPRESA
  const [datosEmpresa, setDatosEmpresa] = useState({
    whatsapp: '5493410000000',
    email: 'info@decant.com.ar',
    direccion: 'Nuestra Cava'
  });

  useEffect(() => {
    // 1. Leer los datos de Firebase
    const fetchAjustes = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'ajustes_storefront', 'home'));
        if (docSnap.exists() && docSnap.data().datosEmpresa) {
          setDatosEmpresa(docSnap.data().datosEmpresa);
        }
      } catch (error) {
        console.error("Error cargando ajustes ayuda:", error);
      }
    };
    fetchAjustes();

    // 2. Lógica del Scroll / Hash link
    window.scrollTo(0, 0);
    const hash = location.hash.replace('#', '');
    if (hash) {
      setOpenSection(hash);
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      setOpenSection('suscripciones');
    }
  }, [location]);

  const toggleSection = (sectionId) => {
    setOpenSection(openSection === sectionId ? null : sectionId);
  };

  const faqs = [
    {
      id: 'suscripciones',
      title: 'Suscripciones (El Club)',
      content: (
        <div className="space-y-6 text-sm text-dark-blue/80 font-poppins leading-relaxed">
          <div>
            <h4 className="font-bold text-dark-blue mb-2 uppercase tracking-widest text-[11px]">1. Alta en la Web</h4>
            <p>El primer paso es comprar la suscripción a través de nuestra página. Al completar este proceso, nos dejas formalmente tus datos de contacto y domicilio de entrega, permitiéndonos iniciar la gestión de tu membresía.</p>
          </div>
          <div>
            <h4 className="font-bold text-dark-blue mb-2 uppercase tracking-widest text-[11px]">2. Contacto y Coordinación</h4>
            <p>Una vez que recibimos tu alta, nos comunicamos con vos de forma personal para: coordinar la entrega de tu primera caja, definir tu calendario futuro (cada 30 días o entre el 5 y 10 de cada mes) y enviarte el link de suscripción de MercadoPago.</p>
          </div>
          <div>
            <h4 className="font-bold text-dark-blue mb-2 uppercase tracking-widest text-[11px]">3. Cobros en MercadoPago</h4>
            <p>Al suscribirte mediante MercadoPago, verás que el sistema indica <strong>"30 días de prueba"</strong>. Esto significa que el segundo cobro no se realiza en el acto, sino que se procesa recién al mes de haber iniciado, una vez que ya estás disfrutando de la experiencia.</p>
          </div>
          <div>
            <h4 className="font-bold text-dark-blue mb-2 uppercase tracking-widest text-[11px]">4. Primera Entrega Inmediata</h4>
            <p>Tu ritual comienza sin esperas. Entregamos tu primer envío dentro de los <strong>2 próximos días hábiles</strong> posteriores a tu suscripción. En Rosario el envío es sin cargo; para el resto del país, despachamos por el transporte de tu preferencia (a cargo del suscriptor).</p>
          </div>
          <div>
            <h4 className="font-bold text-dark-blue mb-2 uppercase tracking-widest text-[11px]">5. Absoluta Libertad</h4>
            <p>Tenés el control total: podés pausar o dar de baja tu membresía cuando quieras directamente desde tu app de MercadoPago, sin complicaciones ni letra chica.</p>
          </div>
        </div>
      )
    },
    {
      id: 'envios',
      title: 'Pagos y Envíos (Shop)',
      content: (
        <div className="space-y-6 text-sm text-dark-blue/80 font-poppins leading-relaxed">
          <p className="italic">En Decant, queremos que el camino entre la bodega y tu copa sea lo más transparente y simple posible.</p>
          
          <div>
            <h4 className="font-bold text-dark-blue mb-2 uppercase tracking-widest text-[11px]">Compra en Tienda (Catálogo)</h4>
            <p>Al finalizar tu carrito en nuestra web, serás derivado directamente a nuestro WhatsApp oficial para atención personalizada. Allí coordinaremos el pago y la entrega.</p>
          </div>
          <div>
            <h4 className="font-bold text-dark-blue mb-2 uppercase tracking-widest text-[11px]">Métodos de Pago</h4>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Transferencia o Efectivo:</strong> Obtendrás un 5% de descuento sobre el total de tu compra (Aplica también si te encuentras en Rosario y abonas al recibir).</li>
              <li><strong>Tarjetas de Crédito / Débito:</strong> Te enviaremos un link de pago de MercadoPago para abonar de forma segura.</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-dark-blue mb-2 uppercase tracking-widest text-[11px]">Logística y Envíos</h4>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Rosario:</strong> Contamos con envíos bonificados o la opción de punto de retiro sin cargo en {datosEmpresa.direccion}.</li>
              <li><strong>Envíos Nacionales:</strong> Despachamos mediante logística premium o el transporte que nos indiques. El costo del envío queda a cargo del comprador y se abona según el transporte elegido.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'devoluciones',
      title: 'Política de Cambios y Devoluciones',
      content: (
        <div className="space-y-6 text-sm text-dark-blue/80 font-poppins leading-relaxed">
          <p>En Decant Club, nuestro principal objetivo es que disfrutes del ritual del vino sin preocupaciones. Hemos diseñado una política clara y alineada con la Ley de Defensa del Consumidor, adaptada a la naturaleza delicada de nuestros productos.</p>
          
          <div>
            <h4 className="font-bold text-dark-blue mb-2 uppercase tracking-widest text-[11px]">1. Derecho de Arrepentimiento</h4>
            <p>Si realizaste una compra online y te arrepentiste, tenés derecho a cancelar la operación dentro de los <strong>10 días corridos</strong> desde que recibís el pedido. Las botellas deben estar <strong>estrictamente cerradas, con sus precintos intactos, etiquetas originales y en su embalaje original</strong>. El costo del envío de regreso corre por nuestra cuenta. Se te reembolsará el dinero por el mismo medio de pago.</p>
          </div>
          <div>
            <h4 className="font-bold text-dark-blue mb-2 uppercase tracking-widest text-[11px]">2. Cambios por roturas en el transporte</h4>
            <p>Si al recibir la caja notás que está mojada, manchada o escuchás vidrios rotos, <strong>no aceptes el paquete al correo</strong> y avisanos. Si lo abriste y hay roturas, envíanos fotos claras dentro de las <strong>48 horas</strong> siguientes. Repondremos las unidades dañadas sin costo.</p>
          </div>
          <div>
            <h4 className="font-bold text-dark-blue mb-2 uppercase tracking-widest text-[11px]">3. Defecto del producto (Vino Picado / TCA)</h4>
            <p>El vino es un producto vivo y un pequeño porcentaje puede presentar defectos de corcho. Si considerás que un vino está defectuoso, <strong>volvé a taparlo con su corcho original</strong> (es fundamental conservar el corcho y al menos 3/4 del líquido para el análisis de bodega). Contactanos y coordinaremos la reposición o un crédito a tu favor.</p>
            <p className="text-xs italic mt-2 opacity-80">* Las devoluciones no aplican si el vino simplemente no fue de tu agrado personal en cuanto a estilo, siempre que esté en buenas condiciones técnicas.</p>
          </div>
          <div>
            <h4 className="font-bold text-dark-blue mb-2 uppercase tracking-widest text-[11px]">¿Cómo gestionarlo?</h4>
            <p>Escribinos a <strong>{datosEmpresa.email}</strong> indicando en el asunto "Cambio/Devolución" y tu Número de Pedido. Adjuntá fotos si corresponde y nuestro equipo te responderá a la brevedad.</p>
          </div>
        </div>
      )
    },
    {
      id: 'contacto',
      title: 'Contacto y Atención',
      content: (
        <div className="space-y-6 text-sm text-dark-blue/80 font-poppins leading-relaxed">
          <p>La atención personalizada es el pilar de nuestro Club. Ante cualquier consulta, nuestro equipo de Concierge está a tu disposición.</p>
          <ul className="space-y-4 mt-4">
            <li className="flex items-center gap-3">
              <svg className="w-5 h-5 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              <span><strong>E-mail:</strong> {datosEmpresa.email}</span>
            </li>
            <li className="flex items-center gap-3">
              <svg className="w-5 h-5 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              <span><strong>WhatsApp:</strong> +{datosEmpresa.whatsapp}</span>
            </li>
            <li className="flex items-center gap-3">
              <svg className="w-5 h-5 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span><strong>Dirección:</strong> {datosEmpresa.direccion}</span>
            </li>
          </ul>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-neutral-white overflow-x-hidden font-poppins">
        <SEO 
        title="Centro de Ayuda" 
        description="Todo lo que necesitas saber sobre envíos, medios de pago, políticas de devolución y atención al cliente en Decant."
        />
      <MainNavbar />

      <header className="pt-40 pb-20 bg-extra-black text-center px-6 relative border-b border-light-blue/10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-extra-black/90 z-0"></div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <span className="text-brand-orange font-poppins text-[10px] font-black uppercase tracking-[0.4em] mb-6 block">Asistencia al cliente</span>
          <h1 className="text-4xl md:text-6xl font-playfair font-black italic text-brand-white tracking-tight mb-6">
            Centro de Ayuda
          </h1>
          <p className="text-light-blue text-sm md:text-base leading-relaxed">
            Todo lo que necesitás saber sobre tus membresías, envíos y políticas de compra, centralizado en un solo lugar.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-24">
        <div className="flex flex-col gap-4">
          {faqs.map((faq) => {
            const isOpen = openSection === faq.id;
            return (
              <div 
                key={faq.id} 
                id={faq.id} 
                className={`border transition-colors duration-500 rounded-sm overflow-hidden ${isOpen ? 'border-brand-orange/30 bg-white shadow-lg' : 'border-light-blue/20 bg-white/50 hover:bg-white hover:border-light-blue/40'}`}
              >
                <button 
                  onClick={() => toggleSection(faq.id)}
                  className="w-full flex items-center justify-between p-6 md:p-8 outline-none text-left"
                >
                  <h3 className={`font-playfair italic text-xl md:text-2xl transition-colors ${isOpen ? 'text-brand-orange' : 'text-dark-blue'}`}>
                    {faq.title}
                  </h3>
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 transition-all duration-500 ${isOpen ? 'border-brand-orange bg-brand-orange text-white rotate-180' : 'border-light-blue/20 text-light-blue'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                
                <div 
                  className={`transition-all duration-700 ease-in-out overflow-hidden ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <div className="p-6 md:p-8 pt-0 border-t border-light-blue/5">
                    {faq.content}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}