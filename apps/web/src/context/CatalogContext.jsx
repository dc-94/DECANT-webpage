import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { db } from "../config/firebase";
import { collection, query, getDocs, doc, getDoc, onSnapshot, where, limit } from 'firebase/firestore';

const CatalogContext = createContext();

export const useCatalog = () => {
  const context = useContext(CatalogContext);
  if (!context) throw new Error("useCatalog debe usarse dentro de CatalogProvider");
  return context;
};

export function CatalogProvider({ children }) {
  // 👉 1. EL CACHÉ INTELIGENTE (Diccionario para evitar duplicados)
  const [productosCache, setProductosCache] = useState({});
  
  const [menuTree, setMenuTree] = useState({}); 
  const [cargando, setCargando] = useState(true);

  const productos = Object.values(productosCache);

  useEffect(() => {
    let unsubscribeMenu;

    try {
      const qMenu = query(collection(db, 'categorias_menu'));
      
      unsubscribeMenu = onSnapshot(qMenu, (snapMenu) => {
        const docsMenu = snapMenu.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const treeTransformado = {};
        
        docsMenu.forEach(cat => {
          const subsObj = {};
          (cat.subcategorias || []).forEach(sub => {
            subsObj[sub.nombre] = (sub.cepas || []).map(cepa => 
              typeof cepa === 'string' ? cepa : (cepa.nombre || '')
            );
          });
          treeTransformado[cat.nombre] = subsObj;
        });

        setMenuTree(treeTransformado);
        setCargando(false); 
      }, (error) => {
        console.error("Error en snapshot de menú:", error);
        setCargando(false);
      });

    } catch (error) {
      console.error("Error inicializando el contexto:", error);
      setCargando(false);
    }

    return () => {
      if (unsubscribeMenu) unsubscribeMenu();
    };
  }, []);

  // 👉 2. NUEVO: Función de Carga Masiva (Para el Catálogo Rápido)
  const fetchAllProductos = useCallback(async () => {
    setCargando(true);
    try {
      const qAll = query(collection(db, 'productos'));
      const snapshot = await getDocs(qAll);
      const nuevosProductos = {};

      snapshot.docs.forEach(doc => {
        nuevosProductos[doc.id] = { id: doc.id, ...doc.data() };
      });

      setProductosCache(prev => ({ ...prev, ...nuevosProductos }));
    } catch (error) {
      console.error("Error cargando todo el catálogo:", error);
    } finally {
      setCargando(false);
    }
  }, []);

  // 👉 3. FUNCIÓN DE BÚSQUEDA BAJO DEMANDA (Soporta Paginación)
  const fetchProductosQuery = useCallback(async (customQuery) => {
    try {
      const snapshot = await getDocs(customQuery);
      const nuevosProductos = {};

      snapshot.docs.forEach(doc => {
        nuevosProductos[doc.id] = { id: doc.id, ...doc.data() };
      });

      setProductosCache(prev => ({ ...prev, ...nuevosProductos }));

      return {
        docs: snapshot.docs,
        data: snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      };
    } catch (error) {
      console.error("Error fetching productos:", error);
      return { docs: [], data: [] };
    }
  }, []);

  // 👉 4. FUNCIÓN MEJORADA: Busca por ID o por Slug amigable
  const fetchProductoById = useCallback(async (slugOrId) => {
    // 1. Buscar en el caché local
    const cachedProd = Object.values(productosCache).find(p => p.id === slugOrId || p.slug === slugOrId);
    if (cachedProd) return cachedProd;

    try {
      // 2. Intentar buscar por ID de documento
      const docRef = doc(db, 'productos', slugOrId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const prod = { id: snap.id, ...snap.data() };
        setProductosCache(prev => ({ ...prev, [prod.id]: prod }));
        return prod;
      }

      // 3. Buscar por slug
      const qSlug = query(collection(db, 'productos'), where('slug', '==', slugOrId), limit(1));
      const slugSnap = await getDocs(qSlug);
      
      if (!slugSnap.empty) {
        const docSnap = slugSnap.docs[0];
        const prod = { id: docSnap.id, ...docSnap.data() };
        setProductosCache(prev => ({ ...prev, [prod.id]: prod }));
        return prod;
      }

    } catch (error) {
      console.error("Error buscando producto por ID o Slug:", error);
    }
    
    return null;
  }, [productosCache]);

  return (
    <CatalogContext.Provider value={{ 
      productos, 
      menuTree, 
      cargando,
      fetchAllProductos, // Exportamos la nueva función
      fetchProductosQuery,
      fetchProductoById
    }}>
      {children}
    </CatalogContext.Provider>
  );
}