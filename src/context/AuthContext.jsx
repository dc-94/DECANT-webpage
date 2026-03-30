import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "../config/firebase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔒 EL GUARDIÁN: Solo este correo podrá entrar al admin
  const ADMIN_EMAIL = "the.decantclub@gmail.com"; 

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Si el correo no es el tuyo, lo expulsa inmediatamente
      if (result.user.email !== ADMIN_EMAIL) {
        alert("Acceso denegado. No eres el administrador de Decant.");
        await signOut(auth);
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
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
  }, []);

  return (
    <AuthContext.Provider value={{ user, loginWithGoogle, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    // Esto te dará un error más claro en consola si olvidas el Provider
    console.error("useAuth debe usarse dentro de un AuthProvider");
    return {}; 
  }
  return context;
};