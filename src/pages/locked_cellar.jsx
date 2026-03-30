import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import AdminNavbar from '../components/layout/AdminNavbar';
import ProductForm from '../components/admin/ProductForm';

export default function LockedCellar() {
  const [productoEnAccion, setProductoEnAccion] = useState(null);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  // ESCUCHAMOS LOS PRODUCTOS EN TIEMPO REAL
  useEffect(() => {
    const q = query(collection(db, 'productos'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProductos(data);
      setLoading(false);
    });

    return () => unsubscribe(); // Limpiamos al desmontar
  }, []);

  return (
    <div className="min-h-screen bg-neutral-white">
      <AdminNavbar />
      
      <main className="max-w-7xl mx-auto pt-12 px-6 pb-20">
        
        {/* HEADER Y BOTÓN NUEVO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-dark-blue/10 pb-8 mb-12 gap-6 md:gap-0">
          <div>
            <p className="font-poppins font-black text-[10px] uppercase tracking-[0.4em] text-light-blue mb-2">Inventario Privado</p>
            <h1 className="font-playfair italic text-5xl md:text-6xl text-dark-blue leading-none">Locked Cellar</h1>
          </div>

          <button 
            onClick={() => setProductoEnAccion({ modo: "crear" })}
            className="flex items-center gap-4 bg-dark-blue text-brand-white pl-8 pr-4 py-4 shadow-xl hover:bg-brand-orange transition-all duration-300 group"
          >
            <div className="flex flex-col items-start text-left">
              <span className="font-poppins font-black text-[9px] uppercase tracking-widest opacity-60">Admin</span>
              <span className="font-playfair italic text-xl">Agregar Etiqueta</span>
            </div>
            <div className="text-2xl font-light w-10 h-10 border border-brand-white/20 group-hover:border-brand-white/50 rounded-full flex items-center justify-center transition-colors">+</div>
          </button>
        </div>

        {/* GRILLA DE PRODUCTOS */}
        {loading ? (
           <p className="text-dark-blue/40 font-poppins text-xs uppercase tracking-widest animate-pulse">Cargando la cava...</p>
        ) : productos.length === 0 ? (
           <p className="text-dark-blue/40 font-poppins text-xs uppercase tracking-widest">No hay botellas en la cava todavía.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {productos.map(prod => (
              <div key={prod.id} className="border border-dark-blue/10 p-6 flex flex-col justify-between bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex gap-4">
                  {/* Miniatura si hay imagen */}
                  {prod.imageUrl ? (
                    <img src={prod.imageUrl} alt={prod.nombre} className="w-16 h-24 object-contain" />
                  ) : (
                    <div className="w-16 h-24 bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-[8px] text-gray-400 uppercase tracking-widest">Sin Foto</div>
                  )}
                  
                  <div>
                    <p className="text-brand-orange text-[9px] font-black uppercase tracking-widest mb-1">
                      {prod.bodega} {prod.origen && <span className="text-gray-400">| {prod.origen}</span>}
                    </p>
                    <h3 className="font-playfair font-bold text-xl text-dark-blue leading-tight mb-1">{prod.nombre}</h3>
                    <p className="font-poppins text-xs text-dark-blue/60">{prod.varietal}</p>
                    <p className="font-poppins text-xs text-dark-blue font-bold mt-2">${prod.precioFinal?.toLocaleString()}</p>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="mt-6 flex justify-between items-center border-t border-dark-blue/5 pt-4">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${prod.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {prod.aPedido ? 'A Pedido' : `Stock: ${prod.stock}`}
                  </span>
                  
                  {/* ESTE BOTÓN ABRE EL MODAL EN MODO EDICIÓN */}
                  <button 
                    onClick={() => setProductoEnAccion({ modo: "editar", data: prod })}
                    className="text-[10px] font-black uppercase tracking-widest text-light-blue hover:text-brand-orange transition-colors px-3 py-1 border border-light-blue/20 rounded hover:border-brand-orange"
                  >
                    Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODAL DEL FORMULARIO */}
        {productoEnAccion && (
          <ProductForm 
            productoEnAccion={productoEnAccion} 
            setProductoEnAccion={setProductoEnAccion} 
          />
        )}

      </main>
    </div>
  );
}