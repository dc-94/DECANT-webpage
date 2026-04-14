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
  const [menuTree, setMenuTree] = useState({});
  const [cargando, setCargando] = useState(true);

useEffect(() => {
  const fetchProductos = async () => {
    try {
      const q = query(collection(db, 'productos'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q); // Cambiamos onSnapshot por getDocs
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProductos(docs);
    } catch (error) {
      console.error("Error cargando catálogo:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchProductos();
}, []);

  return (
    <CatalogContext.Provider value={{ productos, menuTree, cargando }}>
      {children}
    </CatalogContext.Provider>
  );
}