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
    // Escuchamos la base de datos en tiempo real (una sola vez por visitante)
    const q = query(collection(db, "productos"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // 1. Filtramos los productos que se pueden mostrar en la web
      // (Preparamos el terreno para el checkbox de mañana. Si no existe la propiedad, asumimos que sí se muestra).
      const productosWeb = docs.filter(p => p.mostrarEnWeb !== false);
      
      setProductos(productosWeb);

      // 2. Construimos el "Árbol" dinámico para el Mega Menú
      const tree = {};
      
      productosWeb.forEach(prod => {
        const cat = prod.categoria || "Otros";
        const sub = prod.subcategoria || "General";
        const varietal = prod.varietal || "";

        // Si la categoría no existe en el árbol, la creamos
        if (!tree[cat]) tree[cat] = {};
        
        // Si la subcategoría no existe, la creamos como un Set (para evitar varietales duplicados)
        if (!tree[cat][sub]) tree[cat][sub] = new Set();
        
        // Agregamos el varietal solo si tiene uno
        if (varietal) tree[cat][sub].add(varietal);
      });

      // 3. Convertimos los "Sets" a "Arrays" ordenados alfabéticamente para que React los pueda dibujar fácil
      const formattedTree = {};
      Object.keys(tree).sort().forEach(cat => {
        formattedTree[cat] = {};
        Object.keys(tree[cat]).sort().forEach(sub => {
          formattedTree[cat][sub] = Array.from(tree[cat][sub]).sort();
        });
      });

      setMenuTree(formattedTree);
      setCargando(false);
    }, (error) => {
      console.error("Error cargando el catálogo público:", error);
      setCargando(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <CatalogContext.Provider value={{ productos, menuTree, cargando }}>
      {children}
    </CatalogContext.Provider>
  );
}