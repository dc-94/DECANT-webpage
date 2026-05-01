import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

const SocioContext = createContext();

export const useSocio = () => {
  const context = useContext(SocioContext);
  if (!context) {
    throw new Error('useSocio debe ser usado dentro de un SocioProvider');
  }
  return context;
};

export const SocioProvider = ({ children }) => {
  const [socio, setSocio] = useState(null); // Guardará { email, pin, badge, porcentaje }
  const [validando, setValidando] = useState(false);

  // Al cargar la app, revisamos si el socio ya se había logueado en esta pestaña
  useEffect(() => {
    const savedSocio = sessionStorage.getItem('decant_socio');
    if (savedSocio) {
      try {
        setSocio(JSON.parse(savedSocio));
      } catch (e) {
        sessionStorage.removeItem('decant_socio');
      }
    }
  }, []);

  // Función para validar contra la base de datos
  const validarPin = async (email, pin) => {
    if (!email || !pin) return { success: false, error: 'Completá todos los datos.' };
    
    setValidando(true);
    try {
      const emailLower = email.toLowerCase().trim();
      const clientRef = doc(db, 'clientes', emailLower);
      const clientSnap = await getDoc(clientRef);
      
      if (clientSnap.exists()) {
        const data = clientSnap.data();
        // Verificamos que el PIN coincida y tenga un badge de socio
        if (data.numeroCliente === pin && data.badge) {
          
          let porcentaje = 0;
          if (data.badge === 'Descorche') porcentaje = 0.15;
          if (data.badge === 'Terruño' || data.badge === 'Terruno') porcentaje = 0.20;

          if (porcentaje > 0) {
            const socioData = { email: emailLower, pin, badge: data.badge, porcentaje };
            setSocio(socioData);
            sessionStorage.setItem('decant_socio', JSON.stringify(socioData));
            return { success: true };
          } else {
            return { success: false, error: 'Tu membresía no posee descuentos activos.' };
          }
        } else {
          return { success: false, error: 'El PIN no coincide o no es válido.' };
        }
      } else {
        return { success: false, error: 'No encontramos un socio registrado con este email.' };
      }
    } catch (error) {
      console.error("Error validando socio:", error);
      return { success: false, error: 'Error al conectar de forma segura.' };
    } finally {
      setValidando(false);
    }
  };

  // Función para cerrar sesión VIP
  const cerrarSesionSocio = () => {
    setSocio(null);
    sessionStorage.removeItem('decant_socio');
  };

  const value = {
    socio,
    validando,
    validarPin,
    cerrarSesionSocio
  };

  return <SocioContext.Provider value={value}>{children}</SocioContext.Provider>;
};