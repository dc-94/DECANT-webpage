import { useState, useEffect } from 'react';

export default function AgeGate() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 1. Buscamos si ya existe el registro en el navegador
    const ageVerified = localStorage.getItem('decant_age_verified');
    
    if (ageVerified) {
      const { timestamp } = JSON.parse(ageVerified);
      const now = new Date().getTime();
      const horas24 = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
      
      // Si pasaron menos de 24hs, no mostramos el cartel
      if (now - timestamp < horas24) {
        return; 
      }
    }
    
    // Si no hay registro o ya expiró, bloqueamos la pantalla
    setIsVisible(true);
    document.body.style.overflow = 'hidden'; 
  }, []);

  const handleAccept = () => {
    // Guardamos la confirmación con la hora actual
    const data = { timestamp: new Date().getTime() };
    localStorage.setItem('decant_age_verified', JSON.stringify(data));
    
    setIsVisible(false);
    document.body.style.overflow = 'auto'; // Devolvemos el scroll
  };

  const handleReject = () => {
    // Si es menor, lo redirigimos a Google (práctica estándar)
    window.location.href = 'https://www.google.com'; 
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-blue/60 backdrop-blur-md px-4 transition-opacity duration-500">
      <div className="bg-brand-orange p-8 md:p-12 max-w-lg w-full text-center shadow-2xl flex flex-col items-center border border-white/10 relative overflow-hidden">
        
        <img src="/assets/brand/logo-white-T.png" alt="Decant" className="h-8 mb-8 object-contain" />
        
        <h2 className="text-3xl md:text-4xl font-playfair font-black italic text-brand-white mb-8 tracking-tight drop-shadow-sm">
          ¿Tenés más de 18 años?
        </h2>
        
        <div className="flex flex-col sm:flex-row w-full gap-4 mb-8">
          <button 
            onClick={handleAccept} 
            className="flex-1 bg-extra-black text-brand-white py-4 text-[11px] font-black uppercase tracking-widest hover:bg-brand-white hover:text-extra-black transition-colors outline-none shadow-md"
          >
            Sí, soy mayor
          </button>
          <button 
            onClick={handleReject} 
            className="flex-1 border border-extra-black/20 text-extra-black py-4 text-[11px] font-black uppercase tracking-widest hover:bg-extra-black hover:text-brand-white transition-colors outline-none"
          >
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