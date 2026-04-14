import { createContext, useContext, useState, useEffect } from "react";
import { db } from "../config/firebase";
import { getDocs, collection, query, orderBy } from 'firebase/firestore';

const CatalogContext = createContext();

export const useCatalog = () => {
  const context = useContext(CatalogContext);
  if (!context) throw new Error("useCatalog debe usarse dentro de CatalogProvider");
  return context;
};

export function CatalogProvider({ children }) {
  const [productos, setProductos] = useState([]);
  const [menuTree, setMenuTree] = useState({}); // 👉 Volvemos a Objeto para el Navbar
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Cargar Productos
        const qProd = query(collection(db, 'productos'), orderBy('createdAt', 'desc'));
        const snapProd = await getDocs(qProd);
        const docsProd = snapProd.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProductos(docsProd);

        // 2. Cargar y Transformar Menú
        const qMenu = query(collection(db, 'categorias_menu'));
        const snapMenu = await getDocs(qMenu);
        const docsMenu = snapMenu.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // 👉 TRANSFORMADOR: Convertimos Array de Docs en el Objeto que espera el Navbar
        const treeTransformado = {};
        
        docsMenu.forEach(cat => {
          const subsObj = {};
          
          // Procesamos cada subcategoría del documento
          (cat.subcategorias || []).forEach(sub => {
            // Extraemos las cepas como un array de strings (nombres)
            // Esto asegura que .filter() siempre funcione en el Navbar
            subsObj[sub.nombre] = (sub.cepas || []).map(cepa => 
              typeof cepa === 'string' ? cepa : (cepa.nombre || '')
            );
          });
          
          treeTransformado[cat.nombre] = subsObj;
        });

        setMenuTree(treeTransformado);

      } catch (error) {
        console.error("Error cargando catálogo:", error);
      } finally {
        setCargando(false); // 👉 Usamos el nombre correcto de tu estado
      }
    };

    fetchData();
  }, []);

  return (
    <CatalogContext.Provider value={{ productos, menuTree, cargando }}>
      {children}
    </CatalogContext.Provider>
  );
}