import { useState } from 'react';
import { useSocioAuth } from '@decant/firebase-client';
import MainNavbar from '../components/layout/MainNavbar';

export default function MiCuenta() {
  const { socio, enviarLinkAcceso, logout, loading } = useSocioAuth();
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');
  const [procesando, setProcesando] = useState(false);

  const handleEnviar = async (e) => {
    e.preventDefault();
    setError('');
    setProcesando(true);
    try {
      await enviarLinkAcceso(email);
      setEnviado(true);
    } catch (err) {
      console.error(err);
      setError('No se pudo enviar el enlace. Verificá el email e intentá de nuevo.');
    } finally {
      setProcesando(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-extra-black flex items-center justify-center">
      <img src="/assets/brand/logo-white-T.png" className="h-10 animate-pulse opacity-50" alt="Decant" />
    </div>;
  }

  // Si ya está logueado (Fase 1: solo confirmamos el acceso; los datos vienen en Fase 3)
  if (socio) {
    return (
      <div className="min-h-screen bg-extra-black text-brand-white">
        <MainNavbar />
        <div className="max-w-3xl mx-auto px-6 py-20">
          <h1 className="text-3xl font-playfair italic mb-4">Hola, {socio.email}</h1>
          <p className="text-brand-white/60 mb-8">Acceso confirmado. Tu panel de socio estará disponible en breve.</p>
          <button onClick={logout} className="text-[10px] font-black uppercase tracking-widest text-brand-orange hover:underline">
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  // Pantalla de login
  return (
    <div className="min-h-screen bg-extra-black text-brand-white">
      <MainNavbar />
      <div className="max-w-md mx-auto px-6 py-20">
        <h1 className="text-3xl font-playfair italic mb-2">Mi Cuenta</h1>
        <p className="text-brand-white/60 text-sm mb-8">Ingresá con tu email de socio. Te enviaremos un enlace de acceso, sin contraseñas.</p>

        {enviado ? (
          <div className="bg-brand-orange/10 border border-brand-orange/20 p-6 rounded-sm">
            <p className="text-sm text-brand-white/90">Te enviamos un enlace de acceso a <strong>{email}</strong>. Revisá tu correo y hacé click para entrar.</p>
          </div>
        ) : (
          <form onSubmit={handleEnviar} className="flex flex-col gap-4">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="bg-dark-blue/40 border-b border-light-blue/20 px-4 py-4 text-sm outline-none text-brand-white placeholder-brand-white/30 focus:border-brand-orange"
            />
            {error && <p className="text-red-400 text-xs font-bold">{error}</p>}
            <button
              type="submit"
              disabled={procesando}
              className="bg-brand-orange text-brand-white text-[12px] font-black uppercase tracking-[0.2em] px-8 py-5 hover:bg-brand-white hover:text-extra-black transition-all disabled:opacity-50"
            >
              {procesando ? 'Enviando...' : 'Enviar enlace de acceso'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}