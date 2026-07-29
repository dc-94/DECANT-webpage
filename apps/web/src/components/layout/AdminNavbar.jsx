import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AdminNavbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Usamos .includes para que funcione en /locked_cellar Y en /locked_cellar/inventario
  const isCellar = location.pathname.includes("/locked_cellar");

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      window.location.href = "/";
    }
  };

  return (
    <nav className="bg-[#111111] border-b border-light-blue/10 px-6 h-20 flex items-center justify-between sticky top-0 z-50 font-poppins">
      <div className="flex items-center gap-8">
        {/* LOGO (Sin itálicas, estricto) */}
        <Link to="/admin_selector" className="text-xl font-black tracking-[0.2em] text-brand-white uppercase">
          DECANT<span className="text-brand-orange">.</span>
        </Link>
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-dark-grey border-l border-dark-grey/50 pl-8 hidden md:block">
          {isCellar ? "Gestión de Cava" : "Diseño Storefront"}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* BOTÓN CONMUTADOR (Toggle) */}
        <Link 
          to={isCellar ? "/locked_storefront" : "/locked_cellar"}
          className="text-[10px] font-bold uppercase tracking-widest text-light-blue border border-light-blue/20 px-4 py-2.5 rounded-sm hover:border-brand-orange hover:text-brand-orange transition-all bg-dark-black"
        >
          {isCellar ? "Cambiar a Storefront" : "Cambiar a Locked Cellar"}
        </Link>

        {/* BOTÓN SALIR */}
        <button 
          onClick={handleLogout}
          className="text-[10px] font-bold uppercase tracking-widest text-extra-black bg-brand-white px-6 py-2.5 rounded-sm hover:bg-brand-orange hover:text-brand-white transition-all outline-none"
        >
          Salir
        </button>
      </div>
    </nav>
  );
}