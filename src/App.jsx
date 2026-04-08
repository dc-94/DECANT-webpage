
import Loader from './components/public/Loader';
import AgeGate from './components/public/AgeGate';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CatalogProvider } from './context/CatalogContext';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';

import ScrollToTop from './components/public/ScrollToTop';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Checkout from './pages/Checkout';
import Gracias from './pages/Gracias';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import AdminSelector from './pages/AdminSelector';
import LockedCellar from './pages/locked_cellar'; 
import LockedStorefront from './pages/locked_storefront';
import Ayuda from './pages/Ayuda'; 
// SUSCRIPCIONES
import Suscripciones from './pages/Suscripciones';
import CheckoutSuscripciones from './pages/CheckoutSuscripciones';
import GraciasSuscripciones from './pages/GraciasSuscripciones';

// <--BOTONES LOCKED_CELLAR
import AdminInventario from './pages/AdminInventario'; 
import AdminVentas from './pages/AdminVentas';
import AdminClientes from './pages/AdminClientes';
import AdminAjustes from './pages/AdminAjustes';


function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <CatalogProvider>
          <CartProvider>
            <Router>
              <ScrollToTop />
              
              <Loader />
              <AgeGate />

              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/ayuda" element={<Ayuda />} />
                {/* =========================================
                    RUTAS PÚBLICAS (SHOP Y PRODUCTOS)
                    ========================================= */}
                <Route path="/shop" element={<Shop />} />
                <Route path="/shop/:categoria" element={<Shop />} />
                <Route path="/shop/:categoria/:subcategoria" element={<Shop />} />
                
                {/* NUEVA: Shop filtrado hasta la Cepa (Ej: /shop/Vino/Tinto/Malbec) */}
                <Route path="/shop/:categoria/:subcategoria/:cepa" element={<Shop />} />
                {/* LA RUTA DEL PRODUCTO AHORA ES ÚNICA PARA EVITAR CONFLICTOS */}
                <Route path="/producto/:id" element={<ProductDetail />} />
                
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/gracias" element={<Gracias />} />
          
                {/* RUTA DE suscripciones */}
                <Route path="/suscripciones" element={<Suscripciones />} />
                <Route path="/checkout-suscripciones" element={<CheckoutSuscripciones />} />
                <Route path="/gracias-suscripciones" element={<GraciasSuscripciones />} />

                {/* =========================================
                    RUTAS DE ADMINISTRACIÓN (LOGIN / SELECTOR)
                    ========================================= */}
                <Route path="/login" element={<Login />} />
                <Route path="/admin_selector" element={<AdminSelector />} />
                <Route path="/admin/dashboard" element={<AdminSelector />} />
                <Route path="/locked_storefront" element={<LockedStorefront />} />

                {/* =========================================
                    RUTAS PRIVADAS (LOCKED CELLAR)
                    ========================================= */}
                {/* 1. Dashboard Principal (Botones) */}
                <Route path="/locked_cellar" element={<LockedCellar />} />
                
                {/* 2. Inventario (Lo que antes era el locked_cellar original) */}
                <Route path="/locked_cellar/inventario" element={<AdminInventario />} />
                <Route path="/locked_cellar/ventas" element={<AdminVentas />} />
                <Route path="/locked_cellar/clientes" element={<AdminClientes />} />
                <Route path="/locked_cellar/ajustes" element={<AdminAjustes />} />

              </Routes>
            </Router>
          </CartProvider>
        </CatalogProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;