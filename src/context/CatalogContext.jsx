import { createContext, useContext, useState, useEffect } from "react";
import { db } from "../config/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

const CatalogContext = createContext();

export const useCatalog = () => {
  const context = useContext(CatalogContext);
  if (!context) throw new Error("useCatalog debe usarse dentro de CatalogProvider");
  return context;
};

export function CatalogProvider({ children }) {
  const [productos, setProductos] = useState([]);
  const [menuTree, setMenuTree] = useState({});
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let isProductosLoaded = false;
    let isMenuLoaded = false;

    // =========================================================
    // 1. ESCUCHAMOS EL CATÁLOGO DE PRODUCTOS
    // =========================================================
    const qProductos = query(collection(db, "productos"), orderBy("createdAt", "desc"));
    const unsubscribeProductos = onSnapshot(qProductos, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filtramos los productos que se pueden mostrar en la web
      const productosWeb = docs.filter(p => p.mostrarEnWeb !== false);
      setProductos(productosWeb);
      
      isProductosLoaded = true;
      if (isProductosLoaded && isMenuLoaded) setCargando(false);
    }, (error) => {
      console.error("Error cargando productos:", error);
    });

    // =========================================================
    // 2. ESCUCHAMOS MENÚ OFICIAL)
    // =========================================================
    const unsubscribeMenu = onSnapshot(collection(db, "categorias_menu"), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const formattedTree = {};
      
      docs.forEach(cat => {
        // Solo incluimos la categoría si su switch de 'visible' es true
        if (cat.visible !== false) { 
          const catName = cat.nombre || "Sin Nombre";
          formattedTree[catName] = {};
          
          if (cat.subcategorias && Array.isArray(cat.subcategorias)) {
            cat.subcategorias.forEach(sub => {
              // Solo incluimos la subcategoría si es visible
              if (sub.visible !== false) {
                const subName = sub.nombre || "General";
                
                // Extraemos las cepas y filtramos solo las visibles
                const cepas = sub.cepas 
                  ? sub.cepas.filter(c => c.visible !== false).map(c => c.nombre)
                  : [];
                
                formattedTree[catName][subName] = cepas;
              }
            });
          }
        }
      });

      setMenuTree(formattedTree);
      
      isMenuLoaded = true;
      if (isProductosLoaded && isMenuLoaded) setCargando(false);
    }, (error) => {
      console.error("Error cargando el menú:", error);
    });

    return () => {
      unsubscribeProductos();
      unsubscribeMenu();
    };
  }, []);

  return (
    <CatalogContext.Provider value={{ productos, menuTree, cargando }}>
      {children}
    </CatalogContext.Provider>
  );
}