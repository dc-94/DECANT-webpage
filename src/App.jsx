import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CatalogProvider } from './context/CatalogContext';
import { AuthProvider } from './context/AuthContext';

import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import AdminSelector from './pages/AdminSelector';
import LockedCellar from './pages/locked_cellar';
import LockedStorefront from './pages/locked_storefront';

function App() {
  return (
    <AuthProvider>
      <CatalogProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            
            {/* =========================================
                RUTAS PÚBLICAS (SHOP Y PRODUCTOS)
                ========================================= */}
            {/* 1. Shop general */}
            <Route path="/shop" element={<Shop />} />
            
            {/* 2. Shop filtrado por Categoría (Ej: /shop/vino) */}
            <Route path="/shop/:categoria" element={<Shop />} />
            
            {/* 3. Shop filtrado por Subcategoría (Ej: /shop/vino/tinto) */}
            <Route path="/shop/:categoria/:subcategoria" element={<Shop />} />
            
            {/* 4. RUTA LARGA DE PRODUCTO (La que pediste) */}
            <Route path="/shop/:categoria/:subcategoria/:id" element={<ProductDetail />} />

            {/* =========================================
                RUTAS DE ADMINISTRACIÓN
                ========================================= */}
            <Route path="/login" element={<Login />} />
            <Route path="/admin_selector" element={<AdminSelector />} />
            <Route path="/locked_cellar" element={<LockedCellar />} />
            <Route path="/locked_storefront" element={<LockedStorefront />} />
            <Route path="/admin/dashboard" element={<AdminSelector />} />
          </Routes>
        </Router>
      </CatalogProvider>
    </AuthProvider>
  );
}

export default App;