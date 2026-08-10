import { getToken } from 'firebase/app-check';
import { appCheck } from './client.js';

export const fetchConAppCheck = async (url, options = {}) => {
  let appCheckToken = '';
  try {
    const result = await getToken(appCheck, false);
    appCheckToken = result.token;
  } catch (err) {
    console.error('No se pudo obtener el token de App Check:', err);
  }

  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      'X-Firebase-AppCheck': appCheckToken
    }
  });
};