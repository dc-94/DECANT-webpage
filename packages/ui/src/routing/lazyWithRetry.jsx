import { lazy } from 'react';

/**
 * React.lazy con auto-recuperación ante chunks vencidos.
 *
 * Si el import dinámico falla (caso típico: tras un redeploy en Vercel el chunk
 * viejo con hash ya no existe y da 404; o en dev cuando Vite reinicia y las URLs
 * de módulo quedan viejas), recarga la página UNA sola vez en lugar de mandar al
 * usuario al ErrorBoundary. Tras recargar, el navegador pide el index nuevo y
 * resuelve el chunk actual. Si aun así vuelve a fallar, propaga el error para que
 * el ErrorBoundary lo maneje (evita loops de recarga).
 *
 * Uso: reemplazar `lazy(() => import('./X'))` por `lazyWithRetry(() => import('./X'))`.
 */
export function lazyWithRetry(factory) {
  return lazy(async () => {
    const FLAG = 'decant:chunk-reload';
    try {
      const mod = await factory();
      // Import OK: limpiamos la bandera para permitir una futura recarga.
      try { sessionStorage.removeItem(FLAG); } catch { /* no-op */ }
      return mod;
    } catch (err) {
      let yaRecargado = false;
      try { yaRecargado = !!sessionStorage.getItem(FLAG); } catch { /* no-op */ }

      if (!yaRecargado) {
        try { sessionStorage.setItem(FLAG, '1'); } catch { /* no-op */ }
        window.location.reload();
        // Devolvemos una promesa que nunca resuelve: la página se está recargando.
        return new Promise(() => {});
      }
      throw err;
    }
  });
}
