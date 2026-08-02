import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
// CONTEXTOS (motor de la app pública)
import { AuthProvider } from '@decant/firebase-client';
import { CatalogProvider } from './context/CatalogContext';
import { CartProvider } from './context/CartContext';
import { SocioProvider } from './context/SocioContext';

// COMPONENTES GLOBALES LIVIANOS
import Loader from './components/public/Loader';
import AgeGate from './components/public/AgeGate';
import { ScrollToTop, ErrorBoundary } from '@decant/ui';

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
const CatalogoRapido = lazy(() => import('./pages/CatalogoRapido'));

function App() {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <AuthProvider>
          <CatalogProvider>
            <SocioProvider>
              <CartProvider>
                <style>{`
                  body.lock-loader, body.lock-age { overflow: hidden !important; }
                `}</style>

                <Router>
                  <Toaster position="bottom-right" reverseOrder={false} />
                  <ScrollToTop />

                  <Loader />
                  <AgeGate />

                  <Suspense fallback={
                    <div className="h-screen w-full flex items-center justify-center bg-extra-black">
                      <img src="/assets/brand/logo-white-T.png" className="h-10 animate-pulse opacity-50" alt="Decant" />
                    </div>
                  }>
                    <Routes>
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
                      <Route path="/catalogo-rapido" element={<CatalogoRapido />} />

                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </Router>
              </CartProvider>
            </SocioProvider>
          </CatalogProvider>
        </AuthProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;
