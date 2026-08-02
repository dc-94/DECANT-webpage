import { useState, useEffect } from "react";
import { useAuth } from '@decant/firebase-client';
import { useNavigate } from "react-router-dom";

export default function Login() {
  // Solo conservamos los estados de UI (error y carga)
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Quitamos 'login' porque ya lo borramos del AuthContext
  const { loginWithGoogle, user } = useAuth(); 
  const navigate = useNavigate();

  // 🛡️ SENSOR DE SESIÓN ACTIVA: Si ya está logueado, lo patea adentro
  useEffect(() => {
    if (user) {
      // Ajusta esta ruta si tu componente inicial del admin es otro (ej. /admin_selector)
      navigate("/admin/dashboard"); 
    }
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    setError(""); // Limpia errores de intentos previos
    setLoading(true);
    try {
      await loginWithGoogle();
      // No hace falta el navigate aquí porque el useEffect de arriba lo detectará automáticamente
    } catch (err) {
      // Capturamos el error que enviamos desde AuthContext (el throw new Error)
      // y lo mostramos visualmente en el componente
      setError(err.message || "Error al conectar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-extra-black flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        
        <div className="flex flex-col items-center mb-12">
          <img src="/assets/brand/logo-white-T.png" alt="Decant" className="h-12 mb-4 opacity-90" />
        </div>

        <div className="bg-brand-blue/30 border border-light-blue/10 p-8 rounded-3xl backdrop-blur-sm shadow-2xl">
          
          {/* 🔴 BLOQUE DE ALERTA DE SEGURIDAD (Se muestra si alguien no autorizado intenta entrar) */}
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-xs text-center font-bold">
              {error}
            </div>
          )}

          {/* BOTÓN GOOGLE: Único método de acceso blindado */}
          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-brand-white text-extra-black font-black py-4 rounded-xl flex items-center justify-center gap-3 uppercase tracking-widest text-[10px] hover:bg-light-grey transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              // Mini spinner para la UX mientras verifica
              <div className="animate-spin h-4 w-4 border-2 border-extra-black border-t-transparent rounded-full"></div>
            ) : (
            loading ? "Verificando..." : "Acceso Administrador"
            )}
          </button>

        </div>
      </div>
    </div>
  );
}