import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminSelector() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleOption = (path) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-extra-black flex flex-col items-center justify-center p-6 text-brand-white">
      
      <div className="mb-16 text-center">
        <img src="/assets/brand/logo-white-T.png" alt="Decant" className="h-10 mx-auto mb-6 opacity-80" />
        <h1 className="text-sm font-black uppercase tracking-[0.4em] text-light-blue">Console Management</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl w-full">
        {/* BOTÓN CAVA */}
        <button 
          onClick={() => handleOption("/locked_cellar")}
          className="group bg-brand-blue border border-light-blue/10 p-12 rounded-[2rem] text-center hover:border-brand-orange transition-all duration-500 shadow-2xl"
        >
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🍷</div>
          <h2 className="text-xl font-black uppercase tracking-tighter mb-2 italic">La Cava</h2>
          <p className="text-[10px] text-light-blue uppercase font-bold tracking-widest">Inventario & Stock</p>
        </button>

        {/* BOTÓN STOREFRONT */}
        <button 
          onClick={() => handleOption("/admin/storefront")}
          className="group bg-brand-blue border border-light-blue/10 p-12 rounded-[2rem] text-center hover:border-brand-orange transition-all duration-500 shadow-2xl"
        >
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">✨</div>
          <h2 className="text-xl font-black uppercase tracking-tighter mb-2 italic">Storefront</h2>
          <p className="text-[10px] text-light-blue uppercase font-bold tracking-widest">Diseño & Contenido</p>
        </button>
      </div>

      <button 
        onClick={logout}
        className="mt-16 text-[10px] font-black uppercase tracking-[0.3em] text-dark-grey hover:text-brand-orange transition-colors"
      >
        Finalizar Sesión Admin
      </button>

    </div>
  );
}