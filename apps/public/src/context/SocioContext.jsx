import { createContext, useContext } from 'react';

const SocioContext = createContext();

export const useSocio = () => {
  const context = useContext(SocioContext);
  if (!context) throw new Error('useSocio debe ser usado dentro de un SocioProvider');
  return context;
};

// El descuento de socio se resuelve por email en el checkout (verificarBeneficio).
// El login / "Mi cuenta" (magic link) se implementará como feature propia más adelante.
export const SocioProvider = ({ children }) => {
  return (
    <SocioContext.Provider value={{ socio: null }}>
      {children}
    </SocioContext.Provider>
  );
};