import { getToken } from 'firebase/app-check';
import { appCheck } from './client.js';

export const fetchConAppCheck = async (url, options = {}) => {
  let appCheckToken = '';
  try {
    const result = await getToken(appCheck, false);
    appCheckToken = result.token;
    console.log('[AppCheck] token obtenido:', appCheckToken ? 'SÍ (' + appCheckToken.slice(0,10) + '...)' : 'VACÍO');
  } catch (err) {
    console.error('[AppCheck] getToken FALLÓ:', err.code, err.message);
  }

  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      'X-Firebase-AppCheck': appCheckToken
    }
  });
};