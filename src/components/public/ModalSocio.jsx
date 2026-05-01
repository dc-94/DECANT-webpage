import { useState } from 'react';
import { useSocio } from '../../context/SocioContext';

export default function ModalSocio({ isOpen, onClose }) {
  const { loginSocio, validando } = useSocio();
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !pin) {
      setError('Por favor, completa ambos campos.');
      return;
    }

    const resultado = await loginSocio(email, pin);
    
    if (resultado.success) {
      // Limpiamos y cerramos si el login es exitoso
      setEmail('');
      setPin('');
      onClose();
    } else {
      setError(resultado.error);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-poppins">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-[#F7F5F0] w-full max-w-md p-8 shadow-2xl border border-dark-blue/10 animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-dark-blue/50 hover:text-brand-orange text-2xl leading-none outline-none"
        >
          ×
        </button>
        
        <div className="text-center mb-8">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-orange block mb-2">
            Club VIP
          </span>
          <h2 className="font-playfair italic text-3xl text-dark-blue">
            Acceso Socios
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-dark-blue block mb-2">Correo Electrónico</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full bg-white border border-dark-blue/10 px-4 py-3 text-sm outline-none focus:border-brand-orange text-dark-blue transition-colors"
            />
          </div>
          
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-dark-blue block mb-2">PIN de Acceso</label>
            <input 
              type="password" 
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Ej: 1234"
              className="w-full bg-white border border-dark-blue/10 px-4 py-3 text-sm outline-none focus:border-brand-orange text-dark-blue transition-colors"
            />
          </div>

          {error && (
            <div className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center mt-2">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={validando}
            className="mt-4 w-full bg-dark-blue text-white text-[11px] font-black uppercase tracking-[0.2em] px-8 py-4 hover:bg-brand-orange transition-all disabled:opacity-50 outline-none"
          >
            {validando ? 'Validando...' : 'Ingresar a mi Cava'}
          </button>
        </form>
      </div>
    </div>
  );
}