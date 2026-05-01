import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

// 1. Creamos el contexto
const SocioContext = createContext();

// Hook personalizado para usarlo fácilmente
export const useSocio = () => useContext(SocioContext);

// 2. El proveedor que envolverá nuestra App
export const SocioProvider = ({ children }) => {
  // Leemos la sesión guardada previamente (si existe)
  const [socio, setSocio] = useState(() => {
    const saved = sessionStorage.getItem('decant_socio');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [validando, setValidando] = useState(false);

  // Guardamos la sesión automáticamente cuando el estado cambia
  useEffect(() => {
    if (socio) {
      sessionStorage.setItem('decant_socio', JSON.stringify(socio));
    } else {
      sessionStorage.removeItem('decant_socio');
    }
  }, [socio]);

  // Función principal de Login
  const loginSocio = async (email, pin) => {
    setValidando(true);
    try {
      const emailLower = email.toLowerCase().trim();
      // Buscamos directamente el documento usando el email como ID
      const docRef = doc(db, 'clientes', emailLower);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Verificamos el PIN (contraseña)
        if (data.numeroCliente === pin) {
          
          // Verificamos la membresía
          if (data.badge === 'Descorche' || data.badge === 'Terruño') {
            const porcentaje = data.badge === 'Terruño' ? 0.20 : 0.15;
            
            // Guardamos al socio en el estado global
            setSocio({ 
              email: emailLower, 
              pin, 
              badge: data.badge, 
              porcentaje,
              nombre: data.nombre 
            });
            return { success: true };
          } else {
            return { success: false, error: 'No tienes una membresía VIP activa en este momento.' };
          }
        } else {
          return { success: false, error: 'El PIN ingresado es incorrecto.' };
        }
      } else {
        return { success: false, error: 'No encontramos un registro con ese correo electrónico.' };
      }
    } catch (error) {
      console.error("Error al validar:", error);
      return { success: false, error: 'Error de conexión. Por favor, intenta nuevamente.' };
    } finally {
      setValidando(false);
    }
  };

  const logoutSocio = () => {
    setSocio(null);
  };

  return (
    <SocioContext.Provider value={{ socio, loginSocio, logoutSocio, validando }}>
      {children}
    </SocioContext.Provider>
  );
};