import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from './client.js';
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Toma el email desde el archivo .env configurado en Vercel
  const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "the.decantclub@gmail.com"; 

  const loginWithGoogle = async () => {
    // Ya no usamos try/catch aquí para que el error suba a la pantalla de Login y se muestre en rojo
    const result = await signInWithPopup(auth, googleProvider);
    
    if (result.user.email !== ADMIN_EMAIL) {
      await signOut(auth);
      // Reemplazamos el alert() por un throw Error (Best Practice)
      throw new Error("Acceso denegado. No eres el administrador de Decant.");
    }
    
    return result;
  };

  const logout = () => signOut(auth);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // Verifica estrictamente que el usuario de Google sea el admin
      if (currentUser && currentUser.email === ADMIN_EMAIL) {
        setUser(currentUser);
      } else {
        // Limpieza de estado si se cuela alguien que no es
        setUser(null);
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [ADMIN_EMAIL]);

  return (
    // Quitamos 'login' de los values provistos
    <AuthContext.Provider value={{ user, loginWithGoogle, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};