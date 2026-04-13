import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function Loader() {
  const [loading, setLoading] = useState(true);
  const [fade, setFade] = useState(false);
  const location = useLocation();

  // Ocultamos si es ruta admin o login
  const isAdminRoute = location.pathname.includes('/locked') || location.pathname.includes('/admin') || location.pathname.includes('/login');

  useEffect(() => {
    if (isAdminRoute) {
      setLoading(false);
      document.body.classList.remove('lock-loader');
      return;
    }

    document.body.classList.add('lock-loader');

    const fadeTimer = setTimeout(() => setFade(true), 2000);
    const removeTimer = setTimeout(() => {
      setLoading(false);
      document.body.classList.remove('lock-loader'); // 👉 Solución Pro
    }, 2500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
      document.body.classList.remove('lock-loader');
    };
  }, [isAdminRoute]);

  if (!loading || isAdminRoute) return null;

  return (
    <>
      <style>{`
        @keyframes fillWine { 0% { y: 120px; height: 0px; } 100% { y: 80px; height: 40px; } }
        .animate-fill-wine { animation: fillWine 1.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }
        @keyframes gentleGroupZoom { 0% { transform: scale(0.95); opacity: 0; } 15% { opacity: 1; } 100% { transform: scale(1.05); opacity: 1; } }
        .animate-gentle-group-zoom { animation: gentleGroupZoom 2.5s ease-out forwards; }
        @keyframes wineDrop { 0% { transform: translateY(15px) scale(1); opacity: 0; } 10% { opacity: 1; } 50% { transform: translateY(75px) scale(1); opacity: 1; } 55% { transform: translateY(80px) scale(0); opacity: 0; } 100% { opacity: 0; } }
        .animate-wine-drop { animation: wineDrop 1.5s infinite; }
      `}</style>
      
      <div className={`fixed inset-0 z-[200] bg-brand-white flex items-center justify-center transition-opacity duration-500 ease-in-out ${fade ? 'opacity-0' : 'opacity-100'}`}>
        <div className="flex flex-col items-center justify-center gap-8 md:gap-12 animate-gentle-group-zoom w-full relative z-10 px-6">
          <div className="relative w-28 md:w-40 flex justify-center opacity-90 shrink-0">
            <svg viewBox="0 0 100 120" className="w-full h-auto drop-shadow-xl overflow-visible">
              <defs><clipPath id="decanterClip"><path d="M 45 15 L 55 15 L 55 40 C 55 60, 95 75, 95 95 C 95 115, 5 115, 5 95 C 5 75, 45 60, 45 40 Z" /></clipPath></defs>
              <g clipPath="url(#decanterClip)"><rect x="0" y="120" width="100" height="0" fill="#ED6B48" className="animate-fill-wine" /></g>
              <path d="M 45 15 L 55 15 L 55 40 C 55 60, 95 75, 95 95 C 95 115, 5 115, 5 95 C 5 75, 45 60, 45 40 Z" fill="none" stroke="#0A1A2F" strokeWidth="1.5" />
              <line x1="41" y1="15" x2="59" y2="15" stroke="#0A1A2F" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 50 15 Q 48 20 50 25 Q 52 20 50 15 Z" fill="#ED6B48" className="animate-wine-drop" />
            </svg>
          </div>
          <div className="flex justify-center text-center">
            <span className="text-xl md:text-lg lg:text-xl font-poppins italic font-regular uppercase tracking-[0.25em] text-dark-blue" style={{ textShadow: '0px 10px 40px rgba(10, 26, 47, 0.08)' }}>Decantando</span>
          </div>
        </div>
      </div>
    </>
  );
}