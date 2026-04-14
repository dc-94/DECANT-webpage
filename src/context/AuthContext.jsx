import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { auth, googleProvider } from "../config/firebase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "the.decantclub@gmail.com"; 

  const login = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    // Verificamos si el que entró manual es el admin
    if (result.user.email !== ADMIN_EMAIL) {
      alert("Acceso denegado. No eres el administrador de Decant.");
      await signOut(auth);
      throw new Error("Usuario no autorizado");
    }
    return result;
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user.email !== ADMIN_EMAIL) {
        alert("Acceso denegado. No eres el administrador de Decant.");
        await signOut(auth);
      }
    } catch (error) {
      console.error("Error al iniciar sesión con Google:", error);
    }
  };

  const logout = () => signOut(auth);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // Verifica nuevamente que sea el admin
      if (currentUser && currentUser.email === ADMIN_EMAIL) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [ADMIN_EMAIL]);

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, logout, loading }}>
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