import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, loginWithGoogle, user } = useAuth(); // 👈 Traemos loginWithGoogle y el user actual
  const navigate = useNavigate();

  // 🛡️ SENSOR DE SESIÓN ACTIVA
  useEffect(() => {
    if (user) {
      navigate("/admin/dashboard");
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/admin/dashboard");
    } catch (err) {
      setError("Credenciales inválidas.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      navigate("/admin/dashboard");
    } catch (err) {
      setError("Error al conectar con Google.");
    }
  };

  return (
    <div className="min-h-screen bg-extra-black flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        
        <div className="flex flex-col items-center mb-12">
          <img src="/assets/brand/logo-white-T.png" alt="Decant" className="h-12 mb-4 opacity-90" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-light-blue">Private Access</p>
        </div>

        <div className="bg-brand-blue/30 border border-light-blue/10 p-8 rounded-3xl backdrop-blur-sm shadow-2xl">
          {/* BOTÓN GOOGLE: El más rápido para entrar */}
          <button 
            onClick={handleGoogleLogin}
            className="w-full mb-6 bg-brand-white text-extra-black font-black py-4 rounded-xl flex items-center justify-center gap-3 uppercase tracking-widest text-[10px] hover:bg-light-grey transition-all"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/0/google.svg" className="w-4 h-4" alt="G" />
            Entrar con Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-light-blue/10"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase font-black text-dark-grey bg-transparent px-2">
              <span className="bg-[#12171d] px-2">o vía email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input 
              required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="Email" className="w-full bg-extra-black border border-light-blue/10 p-4 rounded-xl text-brand-white text-sm outline-none focus:border-brand-orange transition-all"
            />
            <input 
              required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Password" className="w-full bg-extra-black border border-light-blue/10 p-4 rounded-xl text-brand-white text-sm outline-none focus:border-brand-orange transition-all"
            />
            <button disabled={loading} className="w-full bg-brand-orange text-brand-white font-black py-4 rounded-xl uppercase tracking-widest text-[10px] hover:bg-dark-orange transition-all">
              {loading ? "Verificando..." : "Acceder"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}