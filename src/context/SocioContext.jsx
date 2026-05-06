import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const SocioContext = createContext();

export const useSocio = () => useContext(SocioContext);

export const SocioProvider = ({ children }) => {
  const [socio, setSocio] = useState(() => {
    const saved = sessionStorage.getItem('decant_socio');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [validando, setValidando] = useState(false);

  useEffect(() => {
    if (socio) {
      sessionStorage.setItem('decant_socio', JSON.stringify(socio));
    } else {
      sessionStorage.removeItem('decant_socio');
    }
  }, [socio]);

  const loginSocio = async (email, pin) => {
    setValidando(true);
    const ahora = Date.now();
    const mensajeErrorGenerico = 'El correo electrónico o el PIN ingresados son incorrectos.';

    try {
      const emailLower = email.toLowerCase().trim();
      const docRef = doc(db, 'clientes', emailLower);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        if (data.bloqueadoHasta && ahora < data.bloqueadoHasta) {
          const minutosRestantes = Math.ceil((data.bloqueadoHasta - ahora) / 60000);
          return { success: false, error: `Cuenta bloqueada. Intenta en ${minutosRestantes} min.` };
        }
        
        // 👉 VALIDACIÓN DE IDENTIDAD (PIN)
        if (data.numeroCliente === pin) {
          // Éxito de identidad: reseteamos seguridad
          await updateDoc(docRef, { intentosFallidos: 0, bloqueadoHasta: null });

          // 👉 LÓGICA DE MEMBRESÍA: Determinamos si aplica descuento o no
          const esVip = (data.badge === 'Descorche' || data.badge === 'Terruño');
          let porcentaje = 0;
          
          if (data.badge === 'Terruño') porcentaje = 0.20;
          else if (data.badge === 'Descorche') porcentaje = 0.15;

          // Guardamos al usuario (sea VIP o no) para autocompletar
          const datosSocio = { 
            email: emailLower, 
            pin, 
            badge: data.badge || 'Cliente', 
            porcentaje,
            nombre: data.nombre,
            isVip: esVip // Flag para la UI del checkout
          };

          setSocio(datosSocio);
          return { success: true, isVip: esVip };

        } else {
          // PIN Incorrecto: Lógica de Rate Limiting
          const nuevosIntentos = (data.intentosFallidos || 0) + 1;
          const updates = { intentosFallidos: nuevosIntentos };
          if (nuevosIntentos >= 5) updates.bloqueadoHasta = ahora + 900000;
          await updateDoc(docRef, updates);
          return { success: false, error: mensajeErrorGenerico };
        }
      } else {
        return { success: false, error: mensajeErrorGenerico };
      }
    } catch (error) {
      console.error("Error al validar:", error);
      return { success: false, error: 'Error de conexión.' };
    } finally {
      setValidando(false);
    }
  };

  const logoutSocio = () => setSocio(null);

  return (
    <SocioContext.Provider value={{ socio, loginSocio, logoutSocio, validando }}>
      {children}
    </SocioContext.Provider>
  );
};