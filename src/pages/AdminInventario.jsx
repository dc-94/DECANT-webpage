import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../config/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import AdminNavbar from '../components/layout/AdminNavbar';
import ProductForm from '../components/admin/ProductForm';

export default function AdminInventario() {
  const [productoEnAccion, setProductoEnAccion] = useState(null);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // ESTADOS DE BÚSQUEDA Y FILTROS
  const [busqueda, setBusqueda] = useState('');
  const [filtroCat, setFiltroCat] = useState('');
  const [filtroSub, setFiltroSub] = useState('');
  const [filtroVar, setFiltroVar] = useState('');

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

    return () => unsubscribe();
  }, []);

  // ==========================================
  // LÓGICA DE FILTROS EN CASCADA
  // ==========================================

  // 1. Categorías: Siempre muestra todas las disponibles
  const categorias = useMemo(() => {
    return [...new Set(productos.map(p => p.categoria).filter(Boolean))];
  }, [productos]);

  // 2. Subcategorías: Limitadas por la Categoría seleccionada
  const subcategorias = useMemo(() => {
    const prods = filtroCat ? productos.filter(p => p.categoria === filtroCat) : productos;
    return [...new Set(prods.map(p => p.subcategoria).filter(Boolean))];
  }, [productos, filtroCat]);

  // 3. Cepas (Varietales): Limitadas por Categoría y Subcategoría seleccionadas
  const varietales = useMemo(() => {
    let prods = productos;
    if (filtroCat) prods = prods.filter(p => p.categoria === filtroCat);
    if (filtroSub) prods = prods.filter(p => p.subcategoria === filtroSub);
    return [...new Set(prods.map(p => p.varietal).filter(Boolean))];
  }, [productos, filtroCat, filtroSub]);


  // HANDLERS PARA RESETEAR HIJOS AL CAMBIAR PADRES
  const handleCatChange = (e) => {
    setFiltroCat(e.target.value);
    setFiltroSub(''); // Resetea subcategoría
    setFiltroVar(''); // Resetea cepa
  };

  const handleSubChange = (e) => {
    setFiltroSub(e.target.value);
    setFiltroVar(''); // Resetea cepa
  };


  // LÓGICA DE FILTRADO COMBINADO
  const productosFiltrados = useMemo(() => {
    return productos.filter(p => {
      const termino = busqueda.toLowerCase();
      const matchBusqueda = 
        (p.nombre?.toLowerCase() || '').includes(termino) || 
        (p.bodega?.toLowerCase() || '').includes(termino) || 
        (p.origen?.toLowerCase() || '').includes(termino);
      
      const matchCat = filtroCat === '' || p.categoria === filtroCat;
      const matchSub = filtroSub === '' || p.subcategoria === filtroSub;
      const matchVar = filtroVar === '' || p.varietal === filtroVar;

      return matchBusqueda && matchCat && matchSub && matchVar;
    });
  }, [productos, busqueda, filtroCat, filtroSub, filtroVar]);

  return (
    <div className="min-h-screen bg-[#F4F7FA] font-poppins text-extra-black flex flex-col">
      <AdminNavbar />
      
      <main className="flex-1 max-w-[95rem] w-full mx-auto pt-8 px-6 pb-20">
        
        {/* BOTÓN VOLVER Y HEADER */}
        <div className="mb-8">
          <Link to="/locked_cellar" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-light-blue hover:text-brand-orange transition-colors mb-6">
            <span className="text-lg leading-none mb-0.5">←</span> Volver al Dashboard
          </Link>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-light-blue/10 pb-6">
            <div>
              <h1 className="font-poppins text-3xl font-black uppercase tracking-widest text-extra-black mb-1">Inventario</h1>
              <p className="font-poppins text-xs font-medium text-dark-grey">Listado general de productos y control de stock.</p>
            </div>

            <button 
              onClick={() => setProductoEnAccion({ modo: "crear" })}
              className="flex items-center gap-3 bg-extra-black text-brand-white px-6 py-3 rounded-sm hover:bg-brand-orange transition-all shadow-md shrink-0 outline-none"
            >
              <span className="text-lg font-light leading-none">+</span>
              <span className="font-poppins text-[11px] font-bold uppercase tracking-widest">Nueva Etiqueta</span>
            </button>
          </div>
        </div>

        {/* BARRA DE BÚSQUEDA Y FILTROS SELECTORES */}
        <div className="mb-6 flex flex-col xl:flex-row gap-4 xl:items-center justify-between">
          
          <div className="flex flex-col lg:flex-row gap-4 w-full xl:w-auto flex-1">
            {/* Buscador de Texto */}
            <div className="relative flex-1 min-w-[250px]">
              <input 
                type="text" 
                placeholder="Buscar etiqueta, bodega..." 
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="font-poppins w-full pl-10 pr-4 py-3 text-xs bg-white border border-light-blue/20 rounded-sm focus:outline-none focus:border-brand-orange shadow-sm text-extra-black transition-colors"
              />
              <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-grey" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>

            {/* Selectores */}
            <div className="flex flex-wrap md:flex-nowrap gap-4">
              <select 
                value={filtroCat} 
                onChange={handleCatChange}
                className="font-poppins text-[10px] font-bold uppercase tracking-widest text-extra-black bg-white border border-light-blue/20 rounded-sm px-3 py-3 outline-none focus:border-brand-orange shadow-sm cursor-pointer"
              >
                <option value="">Todas las Categorías</option>
                {categorias.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select 
                value={filtroSub} 
                onChange={handleSubChange}
                className="font-poppins text-[10px] font-bold uppercase tracking-widest text-extra-black bg-white border border-light-blue/20 rounded-sm px-3 py-3 outline-none focus:border-brand-orange shadow-sm cursor-pointer"
                disabled={subcategorias.length === 0}
              >
                <option value="">Todas las Subcategorías</option>
                {subcategorias.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              <select 
                value={filtroVar} 
                onChange={(e) => setFiltroVar(e.target.value)}
                className="font-poppins text-[10px] font-bold uppercase tracking-widest text-extra-black bg-white border border-light-blue/20 rounded-sm px-3 py-3 outline-none focus:border-brand-orange shadow-sm cursor-pointer"
                disabled={varietales.length === 0}
              >
                <option value="">Todas las Cepas</option>
                {varietales.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>

          <p className="hidden xl:block font-poppins text-[10px] font-bold uppercase tracking-widest text-dark-grey shrink-0 text-right min-w-[100px]">
            {productosFiltrados.length} Registros
          </p>
        </div>

        {/* LISTADO DE PRODUCTOS */}
        {loading ? (
           <p className="text-dark-grey font-poppins text-xs uppercase tracking-widest animate-pulse">Cargando la cava...</p>
        ) : productosFiltrados.length === 0 ? (
           <p className="text-dark-grey font-poppins text-xs uppercase tracking-widest bg-white p-6 rounded-sm border border-light-blue/10">No hay resultados con estos filtros.</p>
        ) : (
          <div className="bg-white border border-light-blue/20 rounded-sm shadow-sm overflow-x-auto">
            <div className="min-w-[1000px]">
              
              {/* Encabezados de Tabla */}
              <div className="flex items-center px-6 py-4 bg-gray-50 border-b border-light-blue/10 font-poppins text-[10px] font-bold uppercase tracking-widest text-dark-grey">
                <div className="w-16 shrink-0">Img</div>
                <div className="flex-1 pr-4">Producto & Bodega</div>
                <div className="w-32 shrink-0">Subcategoría</div>
                <div className="w-32 shrink-0">Categoría</div>
                <div className="w-28 shrink-0 text-right pr-4">Desc / Base</div>
                <div className="w-28 shrink-0 text-right pr-6">Precio Final</div>
                <div className="w-28 shrink-0 text-center">Disponibilidad</div>
                <div className="w-20 shrink-0 text-right">Acción</div>
              </div>

              {/* Filas */}
              <div className="divide-y divide-light-blue/10">
                {productosFiltrados.map(prod => {
                  const tieneDescuento = prod.precioBase > prod.precioFinal;
                  
                  return (
                    <div key={prod.id} className="flex items-center p-4 px-6 hover:bg-gray-50/50 transition-colors">
                      
                      {/* 1. Img */}
                      <div className="w-16 shrink-0">
                        {prod.imageUrl ? (
                          <img src={prod.imageUrl} alt={prod.nombre} className="w-12 h-16 object-contain bg-white border border-light-blue/10 p-1 rounded-sm" />
                        ) : (
                          <div className="w-12 h-16 bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center font-poppins text-[8px] text-gray-400 uppercase tracking-widest text-center rounded-sm">S/F</div>
                        )}
                      </div>

                      {/* 2. Info Producto + Bodega + Cepa */}
                      <div className="flex-1 min-w-0 pr-4 flex flex-col justify-center">
                        {/* Badge Categoría Padre */}
                        <div>
                          <span className="inline-block bg-dark-black/5 border border-dark-black/10 text-dark-grey font-poppins text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm">
                            {prod.categoria || 'Sin Cat'}
                          </span>
                        </div>
                        <h3 className="font-poppins font-semibold text-base text-extra-black truncate mb-1" title={prod.nombre}>
                          {prod.nombre}
                        </h3>
                      </div>

                      {/* 3. Subcategoría */}
                      <div className="w-32 shrink-0 truncate font-poppins text-[10px] uppercase tracking-widest text-dark-grey pr-2">
                        {prod.subcategoria || '-'}
                      </div>

                      {/* 4. Cepa */}
                      <div className="w-32 shrink-0 truncate font-poppins text-[10px] uppercase tracking-widest text-dark-grey pr-2">
                        {prod.varietal || '-'}
                      </div>

                      {/* 5. Descuento / Precio Base */}
                      <div className="w-28 shrink-0 text-right pr-4 flex flex-col items-end justify-center">
                        {tieneDescuento ? (
                          <>
                            <span className="font-poppins text-[11px] text-dark-grey line-through mb-0.5">
                              ${prod.precioBase?.toLocaleString('es-AR')}
                            </span>
                            {prod.descuentoPorcentaje > 0 && (
                              <span className="font-poppins text-[9px] font-black text-brand-white bg-brand-orange px-1.5 py-0.5 rounded-sm">
                                -{prod.descuentoPorcentaje}%
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="font-poppins text-[11px] text-dark-grey/40">-</span>
                        )}
                      </div>

                      {/* 6. Precio Final */}
                      <div className="w-28 shrink-0 text-right pr-6 font-poppins text-lg font-regular text-extra-black">
                        ${prod.precioFinal?.toLocaleString('es-AR')}
                      </div>

                      {/* 7. Disponibilidad */}
                      <div className="w-28 shrink-0 text-center">
                        <span className={`inline-block font-poppins text-[12px] font-regular uppercase tracking-widest px-2 py-1 rounded-sm text-center min-w-[70px]
                          ${prod.aPedido ? 'bg-blue-100 text-blue-900' : (prod.stock > 0 ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900')}`}
                        >
                          {prod.aPedido ? 'A Pedido' : (prod.stock > 0 ? `${prod.stock}` : 'Agotado')}
                        </span>
                      </div>

                      {/* 8. Acción */}
                      <div className="w-20 shrink-0 text-right">
                        <button 
                          onClick={() => setProductoEnAccion({ modo: "editar", data: prod })}
                          className="font-poppins text-[10px] font-bold uppercase tracking-widest text-light-blue hover:text-brand-orange transition-colors outline-none"
                        >
                          Editar →
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
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