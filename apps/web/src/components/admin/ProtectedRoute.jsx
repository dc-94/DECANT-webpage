import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // Mientras Firebase está verificando si hay sesión, mostramos un cargando
  if (loading) {
    return (
      <div className="min-h-screen bg-extra-black flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-brand-orange border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Si no hay usuario, lo mandamos al login
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Si hay usuario, lo dejamos pasar al contenido (children)
  return children;
}