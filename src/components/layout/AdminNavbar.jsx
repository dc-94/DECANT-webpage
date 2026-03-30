import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AdminNavbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isCellar = location.pathname === "/locked_cellar";

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      window.location.href = "/";
    }
  };

  return (
    <nav className="bg-extra-black border-b border-brand-blue/20 px-6 h-20 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <Link to="/admin/dashboard" className="text-xl font-black tracking-[0.2em] text-brand-white italic">
          DECANT<span className="text-brand-orange">.</span>
        </Link>
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-dark-grey border-l border-dark-grey pl-8 hidden md:block">
          {isCellar ? "Gestión de Cava" : "Diseño Storefront"}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* BOTÓN CONMUTADOR (Toggle) */}
        <Link 
          to={isCellar ? "/admin/storefront" : "/locked_cellar"}
          className="text-[10px] font-black uppercase tracking-widest text-light-blue border border-light-blue/20 px-4 py-2 rounded-lg hover:border-brand-orange hover:text-brand-orange transition-all"
        >
          {isCellar ? "✨ Ir a Storefront" : "🍷 Ir a La Cava"}
        </Link>

        {/* BOTÓN SALIR */}
        <button 
          onClick={handleLogout}
          className="text-[10px] font-black uppercase tracking-widest text-brand-white bg-dark-blue px-4 py-2 rounded-lg hover:bg-brand-orange transition-all"
        >
          Salir
        </button>
      </div>
    </nav>
  );
}