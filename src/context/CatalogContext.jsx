import { createContext, useContext, useState, useEffect } from "react";
import { db } from "../config/firebase";
// 👉 Cambiamos getDocs por onSnapshot
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

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
    // Declaramos las variables para guardar nuestras funciones de desuscripción
    let unsubscribeProductos;
    let unsubscribeMenu;

    try {
      // 1. Escuchar Productos en Tiempo Real
      const qProd = query(collection(db, 'productos'), orderBy('createdAt', 'desc'));
      
      // onSnapshot reemplaza a getDocs y se ejecuta cada vez que hay un cambio en Firebase
      unsubscribeProductos = onSnapshot(qProd, (snapProd) => {
        const docsProd = snapProd.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProductos(docsProd);
      }, (error) => {
        console.error("Error en snapshot de productos:", error);
      });

      // 2. Escuchar y Transformar Menú en Tiempo Real
      const qMenu = query(collection(db, 'categorias_menu'));
      
      unsubscribeMenu = onSnapshot(qMenu, (snapMenu) => {
        const docsMenu = snapMenu.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // 👉 TRANSFORMADOR: Convertimos Array de Docs en el Objeto que espera el Navbar
        const treeTransformado = {};
        
        docsMenu.forEach(cat => {
          const subsObj = {};
          
          // Procesamos cada subcategoría del documento
          (cat.subcategorias || []).forEach(sub => {
            // Extraemos las cepas como un array de strings (nombres)
            subsObj[sub.nombre] = (sub.cepas || []).map(cepa => 
              typeof cepa === 'string' ? cepa : (cepa.nombre || '')
            );
          });
          
          treeTransformado[cat.nombre] = subsObj;
        });

        setMenuTree(treeTransformado);
        
        // Apagamos el estado de carga una vez que recibimos los datos del menú
        setCargando(false); 
      }, (error) => {
        console.error("Error en snapshot de menú:", error);
        setCargando(false);
      });

    } catch (error) {
      console.error("Error configurando el catálogo en tiempo real:", error);
      setCargando(false);
    }

    // 👉 Función de limpieza: Firebase exige que cerremos la conexión si el componente desaparece
    return () => {
      if (unsubscribeProductos) unsubscribeProductos();
      if (unsubscribeMenu) unsubscribeMenu();
    };
  }, []);

  return (
    <CatalogContext.Provider value={{ productos, menuTree, cargando }}>
      {children}
    </CatalogContext.Provider>
  );
}