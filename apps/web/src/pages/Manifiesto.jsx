import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MainNavbar from '../components/layout/MainNavbar';
import Footer from '../components/layout/Footer';
import SEO from '../components/public/SEO'; 
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

const WhatsappIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

export default function Manifiesto() {
  const [whatsappEmpresa, setWhatsappEmpresa] = useState('5493416878568');

  useEffect(() => {
    window.scrollTo(0, 0);
    
    const fetchAjustes = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'ajustes_storefront', 'home'));
        if (docSnap.exists() && docSnap.data().datosEmpresa?.whatsapp) {
          setWhatsappEmpresa(docSnap.data().datosEmpresa.whatsapp);
        }
      } catch (error) {
        console.error("Error cargando ajustes manifiesto:", error);
      }
    };
    fetchAjustes();
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F5F0] font-poppins selection:bg-brand-orange selection:text-white flex flex-col">
      <SEO 
        title="Nuestro Manifiesto | Decant Club" 
        description="Conoce la historia detrás de Decant. Daniel y Malen, curaduría de vinos guiada por la experiencia, no por las tendencias."
      />
      <MainNavbar />

      <style>
        {`
          @keyframes slowFloat {
            0% { transform: translateY(0px) translateX(0px); }
            33% { transform: translateY(-15px) translateX(10px); }
            66% { transform: translateY(10px) translateX(-10px); }
            100% { transform: translateY(0px) translateX(0px); }
          }
          .animate-slow-float {
            animation: slowFloat 25s ease-in-out infinite;
          }
          .animate-slow-float-delayed {
            animation: slowFloat 30s ease-in-out infinite reverse;
          }
        `}
      </style>

      {/* 1. HERO SECTION */}
      <header className="pt-40 pb-24 md:pt-48 md:pb-32 bg-extra-black text-center px-6 relative border-b border-light-blue/10 overflow-hidden">
        <div className="absolute inset-0 bg-brand-orange/5 blur-3xl rounded-full w-[150%] h-[150%] -top-1/4 -left-1/4 pointer-events-none"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <span className="text-brand-orange font-poppins text-[10px] md:text-xs font-black uppercase tracking-[0.4em] mb-6 block">
            Nuestro Propósito
          </span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-playfair font-black italic text-brand-white tracking-tight mb-8 leading-tight">
            El tiempo es tu recurso más valioso. <br className="hidden md:block"/> 
            <span className="text-brand-orange">El buen vino, el nuestro.</span>
          </h1>
        </div>
      </header>

      <main className="flex-1">
        {/* 2. LA HISTORIA */}
        <section className="py-16 md:py-18 px-6 max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row gap-12 md:gap-20 items-start">
            
            <div className="md:w-1/3 shrink-0">
              <h2 className="font-playfair italic text-3xl md:text-4xl text-dark-blue mb-4">
                Daniel & Malen
              </h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-orange">
                Sommelier • Bartender • Barista
              </p>
            </div>

            <div className="md:w-2/3 space-y-6 text-sm md:text-base text-dark-blue/80 leading-relaxed font-light">
              <p>
                <strong className="text-dark-blue font-semibold">Decant nació de una charla sobre cómo elegimos, compartimos y disfrutamos lo que consumimos.</strong> Lo que comenzó como un intercambio de ideas personales se transformó en el espacio donde ponemos en práctica nuestra trayectoria profesional.
              </p>
              <p>
                Este bagaje técnico nos permite identificar productos que cuentan una historia real y que respetan la trazabilidad desde su origen. Hoy, esa visión se materializa en una guía pensada para acompañar tus mejores momentos, profesionalizando la pasión que nos trajo hasta aquí.
              </p>
              <p>
                Estamos convencidos de que detrás de cada etiqueta hay personas, y nosotros somos ese puente entre el productor y vos.
              </p>
            </div>

          </div>
        </section>

        {/* 3. IMÁGENES FLOTANTES (Integradas sin fondo ni bordes) */}
        <section className="w-full overflow-hidden py-16 md:py-24">
          <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row gap-16 md:gap-24 justify-center items-center">
            
            {/* Foto Daniel */}
            <div className="w-full max-w-[280px] md:max-w-xs relative animate-slow-float">
              <img 
                src="/assets/img/daniel.png" 
                alt="Daniel" 
                className="w-full h-auto object-contain drop-shadow-2xl opacity-90"
              />
              <div className="absolute -bottom-4 -right-4 bg-[darkorange] px-6 py-3 shadow-lg">
                <span className="text-[10px] font-black uppercase tracking-widest text-white">Daniel</span>
              </div>
            </div>

            {/* Foto Malen */}
            <div className="w-full max-w-[280px] md:max-w-xs relative md:mt-32 animate-slow-float-delayed">
              <img 
                src="/assets/img/malen.png" 
                alt="Malen" 
                className="w-full h-auto object-contain drop-shadow-2xl opacity-90"
              />
              <div className="absolute -bottom-4 -left-4 bg-[darkorange] px-6 py-3 shadow-lg">
                <span className="text-[10px] font-black uppercase tracking-widest text-white">Malen</span>
              </div>
            </div>

          </div>
        </section>

        {/* 4. LOS 3 PILARES (El Manifiesto) */}
        <section className="py-20 md:py-32 px-6 max-w-6xl mx-auto">
          <div className="text-center mb-16 md:mb-24">
            <h2 className="font-playfair italic text-4xl text-dark-blue">Nuestro Manifiesto</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            <div className="flex flex-col border-t border-dark-blue/10 pt-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-orange mb-4">01. Identidad</span>
              <h3 className="font-playfair text-2xl font-bold text-dark-blue mb-4">No seguimos tendencias.</h3>
              <p className="text-sm text-dark-blue/70 leading-relaxed">
                No seleccionamos etiquetas por moda. Buscamos identidad, carácter y coherencia. Conocemos, probamos y evaluamos cada producto con el mismo nivel de exigencia que aplicamos en nuestras barras y cavas.
              </p>
            </div>

            <div className="flex flex-col border-t border-dark-blue/10 pt-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-orange mb-4">02. Curaduría</span>
              <h3 className="font-playfair text-2xl font-bold text-dark-blue mb-4">Elegimos bien por vos.</h3>
              <p className="text-sm text-dark-blue/70 leading-relaxed">
                Asumimos la responsabilidad de la selección. En un mundo saturado de opciones infinitas, fusionamos una selección estratégica con innovación digital para que tu único trabajo sea disfrutar del ritual.
              </p>
            </div>

            <div className="flex flex-col border-t border-dark-blue/10 pt-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-orange mb-4">03. Comunidad</span>
              <h3 className="font-playfair text-2xl font-bold text-dark-blue mb-4">Tecnología y Servicio.</h3>
              <p className="text-sm text-dark-blue/70 leading-relaxed">
                Ponemos la tecnología al servicio del placer. Del otro lado de esta pantalla hay un equipo accesible y apasionado, dedicado a que cada experiencia con nosotros sea simple y memorable.
              </p>
            </div>
          </div>
        </section>

        {/* SECCIÓN DE CONCIERGE */}
        <section className="bg-white border-y border-dark-blue/5 py-16 md:py-24 px-6">
          <div className="max-w-2xl mx-auto text-center flex flex-col items-center">
            <p className="text-base text-dark-blue/80 leading-relaxed mb-8 font-light">
              ¿Buscás una etiqueta específica que no está en el catálogo? ¿Querés armar un regalo corporativo o a medida? <strong className="font-semibold text-dark-blue">Escribinos y lo buscamos por vos.</strong>
            </p>
            
            <a 
              href={`https://wa.me/${whatsappEmpresa}?text=Hola!%20Me%20contacto%20desde%20la%20web%20(Manifiesto)%20y%20quisiera%20hacer%20una%20consulta:`}
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-3 bg-green-500 text-white hover:bg-green-600 transition-colors px-8 py-4 rounded-sm text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-500/20 outline-none"
            >
              <WhatsappIcon className="w-5 h-5" />
              Hablar con nuestra Sommelier
            </a>
          </div>
        </section>

        {/* 5. CTA BOTTOM CON TONOS PASTEL */}
        <section className="bg-extra-black text-center px-6 py-24 border-t border-light-blue/10">
          <p className="text-brand-orange text-[10px] font-black uppercase tracking-[0.3em] mb-4">
            Te damos la bienvenida a la comunidad
          </p>
          <h2 className="font-playfair italic text-3xl md:text-4xl text-brand-white mb-12">
            Descubrí lo mejor de...
          </h2>
          <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-3xl mx-auto">
            
            {/* Botón Vinos */}
            <Link 
              to="/shop" 
              className="border border-[#e5a9a9] text-[#e5a9a9] bg-transparent hover:bg-[#e5a9a9] hover:text-extra-black text-[10px] font-black uppercase tracking-widest px-10 py-5 transition-all shadow-sm rounded-sm"
            >
              Vinos
            </Link>
            
            {/* Botón Suscripciones */}
            <Link 
              to="/suscripciones" 
              className="border border-[#fbc490] text-[#fbc490] bg-transparent hover:bg-[#fbc490] hover:text-extra-black text-[10px] font-black uppercase tracking-widest px-10 py-5 transition-all shadow-sm rounded-sm"
            >
              Suscripciones
            </Link>
            
            {/* Botón Deli */}
            <Link 
              to="/shop/deli" 
              className="border border-[#a2c4a2] text-[#a2c4a2] bg-transparent hover:bg-[#a2c4a2] hover:text-extra-black text-[10px] font-black uppercase tracking-widest px-10 py-5 transition-all shadow-sm rounded-sm"
            >
              Deli 
            </Link>
            
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}