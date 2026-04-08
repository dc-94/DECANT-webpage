import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();
  const action = useNavigationType(); 

  useEffect(() => {
    // Si la acción de navegación es distinta a "POP" (que es ir atrás/adelante en el historial)
    if (action !== "POP") {
      // Subimos al tope suavemente
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [pathname, action]);

  return null;
}