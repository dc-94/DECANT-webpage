import { lazy } from 'react';

// React.lazy que se recupera de chunks vencidos (tras un redeploy el chunk viejo
// con hash da 404). Al primer fallo recarga una vez para pedir los chunks nuevos;
// si vuelve a fallar, propaga al ErrorBoundary (la bandera en sessionStorage evita loops).
export function lazyWithRetry(factory) {
  return lazy(async () => {
    const FLAG = 'decant:chunk-reload';
    try {
      const mod = await factory();
      try { sessionStorage.removeItem(FLAG); } catch { /* no-op */ }
      return mod;
    } catch (err) {
      let yaRecargado = false;
      try { yaRecargado = !!sessionStorage.getItem(FLAG); } catch { /* no-op */ }
      if (!yaRecargado) {
        try { sessionStorage.setItem(FLAG, '1'); } catch { /* no-op */ }
        window.location.reload();
        return new Promise(() => {});
      }
      throw err;
    }
  });
}
