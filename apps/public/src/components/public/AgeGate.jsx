import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function AgeGate() {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // 1. Si es ruta de admin o login, no mostramos el cartel y nos aseguramos de no bloquear
    const isAdminRoute = location.pathname.includes('/locked') || location.pathname.includes('/admin') || location.pathname.includes('/login');
    if (isAdminRoute) {
      document.body.classList.remove('lock-age');
      setIsVisible(false);
      return;
    }

    // 2. Buscamos si ya existe el registro en el navegador
    const ageVerified = localStorage.getItem('decant_age_verified');
    if (ageVerified) {
      const { timestamp } = JSON.parse(ageVerified);
      if (new Date().getTime() - timestamp < (24 * 60 * 60 * 1000)) {
        return; 
      }
    }
    
    setIsVisible(true);
    document.body.classList.add('lock-age'); // 👉 Solución Pro al scroll
  }, [location.pathname]);

  const handleAccept = () => {
    localStorage.setItem('decant_age_verified', JSON.stringify({ timestamp: new Date().getTime() }));
    setIsVisible(false);
    document.body.classList.remove('lock-age'); 
  };

  const handleReject = () => window.location.href = 'https://www.google.com'; 

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-blue/6 backdrop-blur-sm px-4 transition-opacity duration-500">
      <div className="bg-brand-orange p-8 md:p-12 max-w-lg w-full text-center shadow-2xl flex flex-col items-center border border-white/10 relative overflow-hidden">
        <img src="/assets/brand/logo-white-T.png" alt="Decant" className="h-8 mb-8 object-contain" />
        <h2 className="text-3xl md:text-4xl font-playfair font-black italic text-brand-white mb-8 tracking-tight drop-shadow-sm">
          ¿Tenés más de 18 años?
        </h2>
        <div className="flex flex-col sm:flex-row w-full gap-4 mb-8">
          <button onClick={handleAccept} className="flex-1 bg-extra-black text-brand-white py-4 text-[11px] font-black uppercase tracking-widest hover:bg-brand-white hover:text-extra-black transition-colors outline-none shadow-md">
            Sí, soy mayor
          </button>
          <button onClick={handleReject} className="flex-1 border border-extra-black/20 text-extra-black py-4 text-[11px] font-black uppercase tracking-widest hover:bg-extra-black hover:text-brand-white transition-colors outline-none">
            No, salir
          </button>
        </div>
        <p className="text-[10px] text-extra-black font-poppins font-normal leading-tight opacity-80">
          Beber con moderación. Prohibida su venta a menores de 18 años.
        </p>
      </div>
    </div>
  );
}