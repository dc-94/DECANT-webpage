import { useEffect, useState, useMemo } from "react";
import { db } from "../../config/firebase";
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from "firebase/firestore";

export default function ProductList({ setProductoEnAccion }) {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  const [filtroCat, setFiltroCat] = useState("");
  const [filtroSub, setFiltroSub] = useState("");
  const [filtroBod, setFiltroBod] = useState("");
  const [filtroVar, setFiltroVar] = useState("");
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    const q = query(collection(db, "productos"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProductos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setCargando(false);
    }, (error) => {
      console.error("🔥 Error:", error);
      setCargando(false);
    });
    return () => unsubscribe();
  }, []);

  const productosFiltrados = useMemo(() => {
    return productos.filter(p => {
      const matchCat = filtroCat === "" || (p.categoria || "") === filtroCat;
      const matchSub = filtroSub === "" || (p.subcategoria || "") === filtroSub;
      const matchBod = filtroBod === "" || (p.bodega || "") === filtroBod;
      const matchVar = filtroVar === "" || (p.varietal || "") === filtroVar;
      const texto = `${p.categoria || ""} ${p.subcategoria || ""} ${p.bodega || ""} ${p.nombre || ""} ${p.varietal || ""}`.toLowerCase();
      const matchBusqueda = busqueda === "" || texto.includes(busqueda.toLowerCase());
      return matchCat && matchSub && matchBod && matchVar && matchBusqueda;
    });
  }, [productos, filtroCat, filtroSub, filtroBod, filtroVar, busqueda]);

  const subcategoriasUnicas = [...new Set(productosFiltrados.map(p => p.subcategoria).filter(Boolean))].sort();
  const bodegasUnicas = [...new Set(productosFiltrados.map(p => p.bodega).filter(Boolean))].sort();
  const varietalesUnicos = [...new Set(productosFiltrados.map(p => p.varietal).filter(Boolean))].sort();

  const handleDelete = async (id, nombre) => {
    if (window.confirm(`¿Eliminar permanentemente "${nombre}"?`)) await deleteDoc(doc(db, "productos", id));
  };

  return (
    <div className="mt-8">
      
      {/* BARRA DE FILTROS (Usando tu light-grey y brand-blue) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6 bg-brand-blue p-4 rounded-xl border border-light-blue/20 shadow-lg">
        {[ 
          { val: filtroCat, set: setFiltroCat, opt: ["Vino", "Espumante", "Destilado", "Aperitivo", "Delicatessen"], lab: "Categoría" },
          { val: filtroSub, set: setFiltroSub, opt: subcategoriasUnicas, lab: "Subcategoría" },
          { val: filtroBod, set: setFiltroBod, opt: bodegasUnicas, lab: "Bodega" },
          { val: filtroVar, set: setFiltroVar, opt: varietalesUnicos, lab: "Varietal" }
        ].map((f, i) => (
          <select key={i} value={f.val} onChange={(e) => f.set(e.target.value)} className="bg-dark-blue text-brand-white p-2 rounded border border-light-blue/30 text-xs outline-none focus:border-brand-orange transition-colors">
            <option value="">{f.lab}...</option>
            {f.opt.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ))}
        <input type="text" placeholder="🔍 Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="bg-dark-blue text-brand-white p-2 rounded border border-light-blue/30 text-xs outline-none focus:border-brand-orange col-span-2 md:col-span-1" />
      </div>

      <div className="space-y-3">
        {cargando ? (
          <div className="py-20 text-center"><div className="animate-spin h-10 w-10 border-4 border-brand-orange border-t-transparent rounded-full mx-auto"></div></div>
        ) : productosFiltrados.map((prod) => (
          <div key={prod.id} className="bg-brand-white border border-light-grey rounded-xl p-3 flex flex-col md:flex-row gap-4 items-center group hover:shadow-xl transition-all">
            
            {/* COL 1: IMAGEN */}
            <div className="w-16 h-24 bg-light-grey rounded-lg flex-shrink-0 flex items-center justify-center p-2 border border-gray-200">
              {prod.imageUrl ? (
                <img src={prod.imageUrl} alt={prod.nombre} className="h-full object-contain mix-blend-multiply" />
              ) : (
                <span className="text-[10px] text-dark-grey font-bold">SIN FOTO</span>
              )}
            </div>

            {/* COL 2: INFO (Pegada a la imagen) */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-orange mb-1">
                {prod.categoria} <span className="text-light-blue">/</span> {prod.subcategoria}
              </p>
              <h4 className="text-extra-black font-bold text-base leading-tight">
                <span className="text-dark-grey font-medium uppercase text-xs block mb-1">{prod.bodega}</span>
                {prod.nombre}
                <span className="text-light-blue font-normal text-sm ml-2 italic">({prod.varietal})</span>
              </h4>
            </div>

            {/* COL 3: ADMIN DATA (Precios, Costos, Stock) */}
            <div className="w-full md:w-56 flex-shrink-0 flex flex-col border-t md:border-t-0 md:border-l border-light-grey pt-3 md:pt-0 md:pl-4">
              <div className="flex items-center gap-2">
                <span className="text-brand-orange font-black text-xl">${(prod.precioFinal || 0).toLocaleString()}</span>
                {prod.descuentoPorcentaje > 0 && (
                  <span className="bg-brand-orange/10 text-brand-orange text-[10px] px-1.5 py-0.5 rounded-full font-black">-{prod.descuentoPorcentaje}%</span>
                )}
              </div>
              <div className="text-[10px] text-dark-grey font-bold mt-1 uppercase tracking-tighter">
                Costo: ${(prod.costo || 0).toLocaleString()} <span className="text-light-blue ml-2">Ganancia: {prod.ganancia}%</span>
              </div>
              <div className="mt-2">
                {prod.aPedido ? (
                  <span className="text-[10px] bg-dark-blue text-brand-white px-2 py-0.5 rounded font-black uppercase">A Pedido</span>
                ) : (
                  <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${prod.stock > 0 ? 'bg-light-grey text-dark-grey' : 'bg-red-100 text-red-600'}`}>
                    Stock: {prod.stock}
                  </span>
                )}
              </div>
            </div>

            {/* COL 4: ACCIONES APILADAS */}
            <div className="flex md:flex-col gap-1 w-full md:w-32 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all">
              <button onClick={() => setProductoEnAccion({ modo: "editar", data: prod })} className="flex-1 bg-brand-blue text-brand-white text-[10px] font-black uppercase py-2 rounded hover:bg-light-blue transition-colors">✏️ Editar</button>
              <button onClick={() => setProductoEnAccion({ modo: "copiar", data: prod })} className="flex-1 bg-brand-blue text-brand-white text-[10px] font-black uppercase py-2 rounded hover:bg-light-blue transition-colors">📄 Copiar</button>
              <button onClick={() => handleDelete(prod.id, prod.nombre)} className="flex-1 bg-red-50 text-red-600 text-[10px] font-black uppercase py-2 rounded hover:bg-red-600 hover:text-white transition-colors">❌ Borrar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}