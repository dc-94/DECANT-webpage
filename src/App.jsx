import Loader from './components/public/Loader';
import AgeGate from './components/public/AgeGate';
import { AuthProvider } from './context/AuthContext';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CatalogProvider } from './context/CatalogContext';
import { CartProvider } from './context/CartContext';

import ScrollToTop from './components/public/ScrollToTop';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Checkout from './pages/Checkout';
import Gracias from './pages/Gracias';
import ProductDetail from './pages/ProductDetail';
import Ayuda from './pages/Ayuda'; 
import Manifiesto from './pages/Manifiesto'; 
import Suscripciones from './pages/Suscripciones';
import CheckoutSuscripciones from './pages/CheckoutSuscripciones';
import GraciasSuscripciones from './pages/GraciasSuscripciones';
import Tracking from './pages/Tracking';

// ADMIN RUTAS
import Login from './pages/Login';
import AdminSelector from './pages/AdminSelector';
import LockedCellar from './pages/locked_cellar'; 
import LockedStorefront from './pages/locked_storefront';
import AdminInventario from './pages/AdminInventario'; 
import AdminVentas from './pages/AdminVentas';
import AdminClientes from './pages/AdminClientes';
import AdminAjustes from './pages/AdminAjustes';

import ProtectedRoute from './components/admin/ProtectedRoute';

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <CatalogProvider>
          <CartProvider>
            <style>{`
              body.lock-loader, body.lock-age { overflow: hidden !important; }
            `}</style>
            
            <Router>
              <ScrollToTop />
              
              <Loader />
              <AgeGate />

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

                {/* =========================================
                    RUTAS PRIVADAS
                    ========================================= */}
                <Route path="/admin_selector" element={<ProtectedRoute><AdminSelector /></ProtectedRoute>} />
                <Route path="/admin/dashboard" element={<ProtectedRoute><AdminSelector /></ProtectedRoute>} />
                <Route path="/locked_storefront" element={<ProtectedRoute><LockedStorefront /></ProtectedRoute>} />
                <Route path="/locked_cellar" element={<ProtectedRoute><LockedCellar /></ProtectedRoute>} />
                <Route path="/locked_cellar/inventario" element={<ProtectedRoute><AdminInventario /></ProtectedRoute>} />
                <Route path="/locked_cellar/ventas" element={<ProtectedRoute><AdminVentas /></ProtectedRoute>} />
                <Route path="/locked_cellar/clientes" element={<ProtectedRoute><AdminClientes /></ProtectedRoute>} />
                <Route path="/locked_cellar/ajustes" element={<ProtectedRoute><AdminAjustes /></ProtectedRoute>} />
              </Routes>
            </Router>
          </CartProvider>
        </CatalogProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;