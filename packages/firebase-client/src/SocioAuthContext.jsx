import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut
} from "firebase/auth";
import { auth } from './client.js';

const SocioAuthContext = createContext();

// A dónde vuelve el socio tras hacer click en el link del email.
const getRedirectUrl = () => `${window.location.origin}/mi-cuenta`;

export const SocioAuthProvider = ({ children }) => {
  const [socio, setSocio] = useState(null);
  const [loading, setLoading] = useState(true);

  // Enviar el magic link al email del socio
  const enviarLinkAcceso = async (email) => {
    const emailLower = email.toLowerCase().trim();
    const actionCodeSettings = {
      url: getRedirectUrl(),
      handleCodeInApp: true
    };
    await sendSignInLinkToEmail(auth, emailLower, actionCodeSettings);
    // Guardamos el email para completar el login cuando vuelva del click
    window.localStorage.setItem('decant_email_login', emailLower);
  };

  // Al cargar /mi-cuenta, si la URL es un magic link, completar el login
  const completarLoginDesdeLink = async () => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('decant_email_login');
      if (!email) {
        // Si abrió el link en otro dispositivo, pedimos el email de nuevo
        email = window.prompt('Confirmá tu email para completar el acceso:');
      }
      if (email) {
        await signInWithEmailLink(auth, email.toLowerCase().trim(), window.location.href);
        window.localStorage.removeItem('decant_email_login');
        // Limpiamos el link de la URL
        window.history.replaceState({}, document.title, '/mi-cuenta');
      }
    }
  };

  const logout = () => signOut(auth);

  useEffect(() => {
    // Primero intentamos completar el login si venimos de un link
    completarLoginDesdeLink().finally(() => {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        // Acepta cualquier usuario autenticado (los socios NO tienen ADMIN_EMAIL).
        // La validación de "es socio real" la hace la Cloud Function al leer sus datos.
        setSocio(currentUser);
        setLoading(false);
      });
      return () => unsubscribe();
    });
  }, []);

  return (
    <SocioAuthContext.Provider value={{ socio, enviarLinkAcceso, logout, loading }}>
      {children}
    </SocioAuthContext.Provider>
  );
};

export const useSocioAuth = () => {
  const context = useContext(SocioAuthContext);
  if (!context) throw new Error("useSocioAuth debe usarse dentro de SocioAuthProvider");
  return context;
};