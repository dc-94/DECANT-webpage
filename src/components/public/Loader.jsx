import { useState, useEffect } from 'react';

export default function Loader() {
  const [loading, setLoading] = useState(true);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    // Deshabilitamos el scroll mientras ocurre la magia
    document.body.style.overflow = 'hidden';

    // 1. A los 2 segundos, iniciamos el desvanecimiento (fade out)
    const fadeTimer = setTimeout(() => {
      setFade(true);
    }, 2000);

    // 2. A los 2.5 segundos, destruimos el componente por completo
    const removeTimer = setTimeout(() => {
      setLoading(false);
      document.body.style.overflow = 'auto'; // Devolvemos el scroll
    }, 2500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!loading) return null;

  return (
    <>
      {/* Inyectamos los estilos de animación localmente */}
      <style>{`
        /* 1. Llenado suave del vino dentro del decanter */
        @keyframes fillWine {
          0% { y: 120px; height: 0px; }
          100% { y: 80px; height: 40px; } /* Llenado hasta la base ancha */
        }
        .animate-fill-wine {
          animation: fillWine 1.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        
        /* 2. ZOOM suave que afecta a TODO el conjunto (Decanter + Texto) */
        @keyframes gentleGroupZoom {
          0% { transform: scale(0.95); opacity: 0; }
          15% { opacity: 1; }
          100% { transform: scale(1.05); opacity: 1; }
        }
        .animate-gentle-group-zoom {
          animation: gentleGroupZoom 2.5s ease-out forwards;
        }
        
        /* 3. Animación de la gota cayendo */
        @keyframes wineDrop {
          0% { transform: translateY(15px) scale(1); opacity: 0; }
          10% { opacity: 1; }
          50% { transform: translateY(75px) scale(1); opacity: 1; }
          55% { transform: translateY(80px) scale(0); opacity: 0; }
          100% { opacity: 0; }
        }
        .animate-wine-drop {
          animation: wineDrop 1.5s infinite;
        }
      `}</style>
      
      {/* Contenedor Principal (Fondo respetando tus colores) */}
      <div className={`fixed inset-0 z-[200] bg-brand-white flex items-center justify-center transition-opacity duration-500 ease-in-out ${fade ? 'opacity-0' : 'opacity-100'}`}>
        
        {/* ==================================================
            Contenedor del Grupo (Este es el que hace ZOOM)
            ================================================== */}
        <div className="flex flex-col items-center justify-center gap-8 md:gap-12 animate-gentle-group-zoom w-full relative z-10 px-6">
          
          {/* 1. ARRIBA: El Decanter SVG */}
          <div className="relative w-28 md:w-40 flex justify-center opacity-90 shrink-0">
            <svg viewBox="0 0 100 120" className="w-full h-auto drop-shadow-xl overflow-visible">
              <defs>
                {/* Máscara con la forma exacta del Decanter */}
                <clipPath id="decanterClip">
                  <path d="M 45 15 L 55 15 L 55 40 C 55 60, 95 75, 95 95 C 95 115, 5 115, 5 95 C 5 75, 45 60, 45 40 Z" />
                </clipPath>
              </defs>
              
              {/* Líquido (Vino Naranja) que se anima de abajo hacia arriba */}
              <g clipPath="url(#decanterClip)">
                <rect x="0" y="120" width="100" height="0" fill="#ED6B48" className="animate-fill-wine" />
              </g>
              
              {/* Contorno del Decanter (Trazo oscuro) */}
              <path 
                d="M 45 15 L 55 15 L 55 40 C 55 60, 95 75, 95 95 C 95 115, 5 115, 5 95 C 5 75, 45 60, 45 40 Z" 
                fill="none" 
                stroke="#0A1A2F" 
                strokeWidth="1.5" 
              />
              
              {/* Labio superior del decanter */}
              <line x1="41" y1="15" x2="59" y2="15" stroke="#0A1A2F" strokeWidth="2.5" strokeLinecap="round" />
              
              {/* Gota cayendo */}
              <path d="M 50 15 Q 48 20 50 25 Q 52 20 50 15 Z" fill="#ED6B48" className="animate-wine-drop" />
            </svg>
          </div>

          {/* 2. ABAJO: El Texto Sólido y VIP (No Sans-Serif) */}
          <div className="flex justify-center text-center">
            <span 
              className="text-xl md:text-lg lg:text-xl font-poppins italic font-regular uppercase tracking-[0.25em] text-dark-blue"
              style={{ 
                textShadow: '0px 10px 40px rgba(10, 26, 47, 0.08)' // Sombra sutil para dar volumen
              }}
            >
              Decantando
            </span>
          </div>

        </div>
        
      </div>
    </>
  );
}