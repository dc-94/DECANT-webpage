import { lazy, Suspense } from 'react'; // Importamos lazy y Suspense
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

// CONTEXTOS (Estos se mantienen igual porque son el motor de la app)
import { AuthProvider } from './context/AuthContext';
import { CatalogProvider } from './context/CatalogContext';
import { CartProvider } from './context/CartContext';
import { SocioProvider } from './context/SocioContext'; 

// COMPONENTES GLOBALES LIVIANOS
import Loader from './components/public/Loader';
import AgeGate from './components/public/AgeGate';
import ScrollToTop from './components/public/ScrollToTop';
import ProtectedRoute from './components/admin/ProtectedRoute';
import ErrorBoundary from './components/layout/ErrorBoundary'; // Blindaje total contra crashes

// =========================================================
// CARGA PEREZOSA (Lazy Loading) 
// El código de estas páginas NO se descarga al inicio
// =========================================================

// RUTAS PÚBLICAS
const Home = lazy(() => import('./pages/Home'));
const Shop = lazy(() => import('./pages/Shop'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Gracias = lazy(() => import('./pages/Gracias'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Ayuda = lazy(() => import('./pages/Ayuda')); 
const Manifiesto = lazy(() => import('./pages/Manifiesto')); 
const Suscripciones = lazy(() => import('./pages/Suscripciones'));
const CheckoutSuscripciones = lazy(() => import('./pages/CheckoutSuscripciones'));
const GraciasSuscripciones = lazy(() => import('./pages/GraciasSuscripciones'));
const Tracking = lazy(() => import('./pages/Tracking'));
const Login = lazy(() => import('./pages/Login'));

// RUTAS ADMIN (Las más pesadas)
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
      <ErrorBoundary> {/* Blindaje total contra crashes */}
        <AuthProvider>
          <CatalogProvider>
            <CartProvider>
              {/* 👉 NUEVO: Envolvemos la App con el contexto de Socios */}
              <SocioProvider> 
                <style>{`
                  body.lock-loader, body.lock-age { overflow: hidden !important; }
                `}</style>
                
                <Router>
                  <ScrollToTop />
                  
                  {/* Estos componentes ya tienen sus propios estados de visibilidad */}
                  <Loader />
                  <AgeGate />

                  {/* Suspense envuelve las rutas para mostrar algo mientras se descarga el código */}
                  <Suspense fallback={
                    <div className="h-screen w-full flex items-center justify-center bg-extra-black">
                      <img src="/assets/brand/logo-white-T.png" className="h-10 animate-pulse opacity-50" alt="Decant" />
                    </div>
                  }>
                    <Routes>
                      {/* RUTAS PÚBLICAS */}
                      <Route path="/" element={<Home />} />
                      <Route path="/ayuda" element={<Ayuda />} />
                      <Route path="/manifiesto" element={<Manifiesto />} />
                      <Route path="/shop" element={<Shop />} />
                      <Route path="/shop/:categoria" element={<Shop />} />
                      <Route path="/shop/:categoria/:subcategoria" element={<Shop />} />
                      <Route path="/shop/:categoria/:subcategoria/:cepa" element={<Shop />} />
                      <Route path="/producto/:id" element={<ProductDetail />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/gracias" element={<Gracias />} />
                      <Route path="/pedido/:id" element={<Tracking />} />
                      <Route path="/suscripciones" element={<Suscripciones />} />
                      <Route path="/checkout-suscripciones" element={<CheckoutSuscripciones />} />
                      <Route path="/gracias-suscripciones" element={<GraciasSuscripciones />} />
                      <Route path="/login" element={<Login />} />

                      {/* RUTAS PRIVADAS */}
                      <Route path="/admin_selector" element={<ProtectedRoute><AdminSelector /></ProtectedRoute>} />
                      <Route path="/admin/dashboard" element={<ProtectedRoute><AdminSelector /></ProtectedRoute>} />
                      <Route path="/locked_storefront" element={<ProtectedRoute><LockedStorefront /></ProtectedRoute>} />
                      <Route path="/locked_cellar" element={<ProtectedRoute><LockedCellar /></ProtectedRoute>} />
                      <Route path="/locked_cellar/inventario" element={<ProtectedRoute><AdminInventario /></ProtectedRoute>} />
                      <Route path="/locked_cellar/ventas" element={<ProtectedRoute><AdminVentas /></ProtectedRoute>} />
                      <Route path="/locked_cellar/clientes" element={<ProtectedRoute><AdminClientes /></ProtectedRoute>} />
                      <Route path="/locked_cellar/ajustes" element={<ProtectedRoute><AdminAjustes /></ProtectedRoute>} />
                      <Route path="/locked_cellar/facturacion" element={<ProtectedRoute><AdminFacturacion /></ProtectedRoute>} />
                    </Routes>
                  </Suspense>
                </Router>
              </SocioProvider>
            </CartProvider>
          </CatalogProvider>
        </AuthProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;