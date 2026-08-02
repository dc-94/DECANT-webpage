import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
// CONTEXTOS (motor del panel administrativo)
import { AuthProvider } from '@decant/firebase-client';
import { CatalogProvider } from './context/CatalogContext';

// COMPONENTES GLOBALES LIVIANOS
import ProtectedRoute from './components/admin/ProtectedRoute';
import { ScrollToTop, ErrorBoundary } from '@decant/ui';

// RUTAS DEL PANEL
const Login = lazy(() => import('./pages/Login'));
const AdminSelector = lazy(() => import('./pages/AdminSelector'));
const LockedCellar = lazy(() => import('./pages/locked_cellar'));
const LockedStorefront = lazy(() => import('./pages/locked_storefront'));
const AdminInventario = lazy(() => import('./pages/AdminInventario'));
const AdminVentas = lazy(() => import('./pages/AdminVentas'));
const AdminClientes = lazy(() => import('./pages/AdminClientes'));
const AdminFacturacion = lazy(() => import('./pages/AdminFacturacion'));
const AdminAjustes = lazy(() => import('./pages/AdminAjustes'));

function App() {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <AuthProvider>
          <CatalogProvider>
            <Router>
              <Toaster position="bottom-right" reverseOrder={false} />
              <ScrollToTop />

              <Suspense fallback={
                <div className="h-screen w-full flex items-center justify-center bg-extra-black">
                  <img src="/assets/brand/logo-white-T.png" className="h-10 animate-pulse opacity-50" alt="Decant" />
                </div>
              }>
                <Routes>
                  <Route path="/login" element={<Login />} />

                  <Route path="/admin_selector" element={<ProtectedRoute><AdminSelector /></ProtectedRoute>} />
                  <Route path="/admin/dashboard" element={<ProtectedRoute><AdminSelector /></ProtectedRoute>} />
                  <Route path="/locked_storefront" element={<ProtectedRoute><LockedStorefront /></ProtectedRoute>} />
                  <Route path="/locked_cellar" element={<ProtectedRoute><LockedCellar /></ProtectedRoute>} />
                  <Route path="/locked_cellar/inventario" element={<ProtectedRoute><AdminInventario /></ProtectedRoute>} />
                  <Route path="/locked_cellar/ventas" element={<ProtectedRoute><AdminVentas /></ProtectedRoute>} />
                  <Route path="/locked_cellar/clientes" element={<ProtectedRoute><AdminClientes /></ProtectedRoute>} />
                  <Route path="/locked_cellar/ajustes" element={<ProtectedRoute><AdminAjustes /></ProtectedRoute>} />
                  <Route path="/locked_cellar/facturacion" element={<ProtectedRoute><AdminFacturacion /></ProtectedRoute>} />

                  <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
              </Suspense>
            </Router>
          </CatalogProvider>
        </AuthProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;
