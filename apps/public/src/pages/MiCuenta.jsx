import { useState, useEffect, useCallback } from 'react';
import { useSocioAuth, fetchConAppCheck } from '@decant/firebase-client';
import MainNavbar from '../components/layout/MainNavbar';

const MI_CUENTA_URL = import.meta.env.VITE_MI_CUENTA_URL;

const ESTADOS_LOGISTICA = ['Pendiente', 'En Preparación', 'En Camino', 'Entregado'];

export default function MiCuenta() {
  const { socio, enviarLinkAcceso, logout, loading, getToken } = useSocioAuth();
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');
  const [procesando, setProcesando] = useState(false);

  const [datos, setDatos] = useState(null);
  const [cargandoDatos, setCargandoDatos] = useState(false);
  const [pedidoAbierto, setPedidoAbierto] = useState(null);

  // Trae perfil + pedidos del socio autenticado
  const cargarDatos = useCallback(async () => {
    if (!socio) return;
    setCargandoDatos(true);
    try {
      const token = await getToken();
      const res = await fetchConAppCheck(MI_CUENTA_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.success) setDatos(data);
    } catch (err) {
      console.error('Error cargando datos de cuenta:', err);
    } finally {
      setCargandoDatos(false);
    }
  }, [socio, getToken]);

  useEffect(() => {
    if (socio) cargarDatos();
  }, [socio, cargarDatos]);

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

  const formatFecha = (ts) => {
    if (!ts?.seconds) return '';
    return new Date(ts.seconds * 1000).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatPrecio = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0);

  // ── Pantalla de carga ──
  if (loading) {
    return <div className="min-h-screen bg-extra-black flex items-center justify-center">
      <img src="/assets/brand/logo-white-T.png" className="h-10 animate-pulse opacity-50" alt="Decant" />
    </div>;
  }

  // ── No logueado: pantalla de acceso ──
  if (!socio) {
    return (
      <div className="min-h-screen bg-extra-black text-brand-white">
        <MainNavbar />
        <div className="max-w-md mx-auto px-6 py-20">
          <h1 className="text-3xl font-playfair italic mb-2">Mi Cuenta</h1>
          <p className="text-brand-white/60 text-sm mb-8">Ingresá con tu email de socio. Te enviaremos un enlace de acceso, sin contraseñas.</p>
          {enviado ? (
            <div className="bg-brand-orange/10 border border-brand-orange/20 p-6 rounded-sm">
              <p className="text-sm text-brand-white/90"> 
                Si <strong>{email}</strong> corresponde a una cuenta, te enviamos un enlace de acceso. Revisá tu correo.
                </p>
            </div>
          ) : (
            <form onSubmit={handleEnviar} className="flex flex-col gap-4">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="bg-dark-blue/40 border-b border-light-blue/20 px-4 py-4 text-sm outline-none text-brand-white placeholder-brand-white/30 focus:border-brand-orange" />
              {error && <p className="text-red-400 text-xs font-bold">{error}</p>}
              <button type="submit" disabled={procesando}
                className="bg-brand-orange text-brand-white text-[12px] font-black uppercase tracking-[0.2em] px-8 py-5 hover:bg-brand-white hover:text-extra-black transition-all disabled:opacity-50">
                {procesando ? 'Enviando...' : 'Enviar enlace de acceso'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ── Logueado: panel del socio ──
  const perfil = datos?.perfil;
  const pedidos = datos?.pedidos || [];

  return (
    <div className="min-h-screen bg-extra-black text-brand-white">
      <MainNavbar />
      <div className="max-w-3xl mx-auto px-6 py-16 pt-40  md:pt-48 ">

        {/* Encabezado */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-3xl font-playfair italic mb-1">
              Hola{perfil?.nombre ? `, ${perfil.nombre}` : ''}
            </h1>
            <p className="text-brand-white/50 text-sm">{socio.email}</p>
          </div>
          <button onClick={logout} className="text-[10px] font-black uppercase tracking-widest text-brand-white/50 hover:text-brand-orange transition-colors">
            Cerrar sesión
          </button>
        </div>

        {cargandoDatos ? (
          <p className="text-brand-white/40 text-sm">Cargando tu información...</p>
        ) : (
          <>
            {/* Membresía */}
            <section className="mb-12">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-white/40 border-b border-light-blue/10 pb-2 mb-4">Membresía</h2>
              {perfil?.badge && perfil?.suscripcionActiva ? (
                <div className="flex items-center gap-3">
                  <span className="bg-brand-orange/15 text-brand-orange text-xs px-4 py-2 rounded-sm font-black uppercase tracking-widest">
                    Socio {perfil.badge}
                  </span>
                  {perfil.numeroCliente && (
                    <span className="text-brand-white/50 text-xs">N° {perfil.numeroCliente}</span>
                  )}
                </div>
              ) : perfil?.membresiaEstado === 'pendiente' ? (
                <p className="text-amber-400/80 text-sm">Tu alta de socio está pendiente de pago. Revisá tu correo para completarla.</p>
              ) : (
                // No es socio y no tiene pedidos: invitación con acciones
                <div className="text-center py-10">
                    <p className="text-brand-white/70 text-base mb-2">Todavía no tenés compras ni membresía.</p>
                    <p className="text-brand-white/40 text-sm mb-8">Empezá a explorar nuestra selección o sumate al club.</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <a href="/shop" className="bg-brand-orange text-brand-white text-[11px] font-black uppercase tracking-[0.2em] px-8 py-4 hover:bg-brand-white hover:text-extra-black transition-all">
                        Ver la tienda
                    </a>
                    <a href="/suscripciones" className="border border-light-blue/20 text-brand-white text-[11px] font-black uppercase tracking-[0.2em] px-8 py-4 hover:border-brand-orange hover:text-brand-orange transition-all">
                        Conocer el club
                    </a>
                    </div>
                </div>
                )}
            </section>

            {/* Pedidos */}
            <section>
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-white/40 border-b border-light-blue/10 pb-2 mb-4">Mis pedidos</h2>
              {pedidos.length === 0 ? (
                <p className="text-brand-white/40 text-sm">Todavía no tenés pedidos.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {pedidos.map((p) => {
                    const abierto = pedidoAbierto === p.numeroOrden;
                    const idxEstado = ESTADOS_LOGISTICA.indexOf(p.estadoLogistica);
                    return (
                      <div key={p.numeroOrden} className="border border-light-blue/10 rounded-sm overflow-hidden">
                        {/* Cabecera del pedido (click para expandir) */}
                        <button
                          onClick={() => setPedidoAbierto(abierto ? null : p.numeroOrden)}
                          className="w-full flex items-center justify-between p-4 hover:bg-dark-blue/20 transition-colors text-left"
                        >
                          <div>
                            <p className="text-sm font-bold">Pedido #{p.numeroOrden}</p>
                            <p className="text-brand-white/40 text-xs mt-0.5">
                              {formatFecha(p.fecha)} · {p.tipo === 'suscripcion' ? 'Suscripción' : 'Compra'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold">{formatPrecio(p.total)}</p>
                            <p className="text-brand-orange text-[10px] font-black uppercase tracking-widest mt-0.5">{p.estadoLogistica}</p>
                          </div>
                        </button>

                        {/* Desglose (expandible) */}
                        {abierto && (
                          <div className="px-4 pb-4 border-t border-light-blue/10 pt-4">
                            {/* Progreso de envío */}
                            {p.tipo !== 'suscripcion' && (
                              <div className="flex gap-1 mb-4">
                                {ESTADOS_LOGISTICA.map((estado, i) => (
                                  <div key={estado} className={`flex-1 h-1 rounded-full ${i <= idxEstado ? 'bg-brand-orange' : 'bg-light-blue/10'}`} />
                                ))}
                              </div>
                            )}

                            {/* Fecha de entrega si está en camino */}
                            {p.estadoLogistica === 'En Camino' && p.fechaEnvio && (
                              <p className="text-amber-400/80 text-xs mb-4">
                                Entrega estimada: {p.fechaEnvio} {p.rangoHora ? `entre las ${p.rangoHora}` : ''}
                              </p>
                            )}

                            {/* Items */}
                            <div className="flex flex-col gap-2">
                              {p.items.map((item, i) => (
                                <div key={i} className="flex justify-between text-sm">
                                  <span className="text-brand-white/70">{item.cantidad}× {item.nombre}</span>
                                  <span className="text-brand-white/50">{formatPrecio(item.precio * item.cantidad)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}