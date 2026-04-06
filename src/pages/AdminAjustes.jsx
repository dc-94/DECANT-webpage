import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../config/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, addDoc } from 'firebase/firestore';
import AdminNavbar from '../components/layout/AdminNavbar';

export default function AdminAjustes() {
  // Estado principal desde Firebase
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados del Modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [catActiva, setCatActiva] = useState(null); // Clon local para editar sin afectar el fondo
  const [subCatExpandida, setSubCatExpandida] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // 1. ESCUCHAR FIREBASE (Colección 'categorias_menu')
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'categorias_menu'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategorias(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. ABRIR / CERRAR MODAL
  const abrirModal = (categoria) => {
    if (categoria) {
      // Clon profundo para poder editar tranquilamente en el modal sin afectar la UI trasera
      setCatActiva(JSON.parse(JSON.stringify(categoria)));
    } else {
      // Nueva Categoría en blanco
      setCatActiva({
        nombre: 'Nueva Categoría',
        visible: true,
        subcategorias: []
      });
    }
    setSubCatExpandida(null);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setCatActiva(null);
  };

  const toggleExpandir = (subId) => {
    setSubCatExpandida(subCatExpandida === subId ? null : subId);
  };

  // =========================================================
  // 3. FUNCIONES PARA EDITAR EL ESTADO LOCAL (DENTRO DEL MODAL)
  // =========================================================

  // ---- Funciones de Categoría Principal ----
  const updateCatActiva = (campo, valor) => {
    setCatActiva(prev => ({ ...prev, [campo]: valor }));
  };

  // ---- Funciones de Subcategorías ----
  const agregarSubcategoria = () => {
    const nuevaSub = { id: Date.now().toString(), nombre: 'Nueva Sub', visible: true, cepas: [] };
    setCatActiva(prev => ({ ...prev, subcategorias: [...prev.subcategorias, nuevaSub] }));
    setSubCatExpandida(nuevaSub.id); // Expandir automáticamente
  };

  const actualizarSubcategoria = (subId, campo, valor) => {
    setCatActiva(prev => ({
      ...prev,
      subcategorias: prev.subcategorias.map(sub => sub.id === subId ? { ...sub, [campo]: valor } : sub)
    }));
  };

  const eliminarSubcategoria = (subId) => {
    if(!window.confirm('¿Seguro que deseas eliminar esta subcategoría y todas sus cepas?')) return;
    setCatActiva(prev => ({
      ...prev,
      subcategorias: prev.subcategorias.filter(sub => sub.id !== subId)
    }));
  };

  // ---- Funciones de Cepas ----
  const agregarCepa = (subId) => {
    const nuevaCepa = { id: Date.now().toString(), nombre: 'Nueva Cepa', visible: true };
    setCatActiva(prev => ({
      ...prev,
      subcategorias: prev.subcategorias.map(sub => 
        sub.id === subId ? { ...sub, cepas: [...(sub.cepas || []), nuevaCepa] } : sub
      )
    }));
  };

  const actualizarCepa = (subId, cepaId, campo, valor) => {
    setCatActiva(prev => ({
      ...prev,
      subcategorias: prev.subcategorias.map(sub => 
        sub.id === subId ? {
          ...sub,
          cepas: sub.cepas.map(cepa => cepa.id === cepaId ? { ...cepa, [campo]: valor } : cepa)
        } : sub
      )
    }));
  };

  const eliminarCepa = (subId, cepaId) => {
    setCatActiva(prev => ({
      ...prev,
      subcategorias: prev.subcategorias.map(sub => 
        sub.id === subId ? { ...sub, cepas: sub.cepas.filter(c => c.id !== cepaId) } : sub
      )
    }));
  };


  // =========================================================
  // 4. GUARDAR / ELIMINAR EN FIREBASE
  // =========================================================
  const guardarCambios = async () => {
    if (!catActiva.nombre.trim()) return alert("La categoría necesita un nombre");
    setIsSaving(true);
    try {
      if (catActiva.id) {
        // Actualizar existente
        await setDoc(doc(db, 'categorias_menu', catActiva.id), catActiva);
      } else {
        // Crear nueva
        await addDoc(collection(db, 'categorias_menu'), catActiva);
      }
      cerrarModal();
    } catch (error) {
      console.error("Error guardando categoría:", error);
      alert("Hubo un error al guardar.");
    } finally {
      setIsSaving(false);
    }
  };

  const eliminarCategoriaCompleta = async () => {
    if (!catActiva.id) return cerrarModal(); // Si era nueva y no se había guardado
    if (window.confirm(`¿Estás 100% seguro de eliminar la categoría "${catActiva.nombre}" completa? Esta acción no se puede deshacer.`)) {
      setIsSaving(true);
      try {
        await deleteDoc(doc(db, 'categorias_menu', catActiva.id));
        cerrarModal();
      } catch (error) {
        console.error("Error eliminando:", error);
      } finally {
        setIsSaving(false);
      }
    }
  };


  return (
    <div className="min-h-screen bg-[#F4F7FA] font-poppins text-extra-black flex flex-col relative">
      <AdminNavbar />
      
      <main className="flex-1 max-w-[95rem] w-full mx-auto pt-8 px-6 pb-20">
        
        {/* BOTÓN VOLVER Y HEADER */}
        <div className="mb-10">
          <Link to="/locked_cellar" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-light-blue hover:text-brand-orange transition-colors mb-6 outline-none">
            <span className="text-lg leading-none mb-0.5">←</span> Volver al Dashboard
          </Link>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-light-blue/10 pb-6">
            <div>
              <h1 className="font-poppins text-3xl font-black uppercase tracking-widest text-extra-black mb-1">Taxonomía y Menú</h1>
              <p className="font-poppins text-xs font-medium text-dark-grey">Gestiona el árbol de categorías de tu tienda pública.</p>
            </div>
            
            <button 
              onClick={() => abrirModal(null)}
              className="flex items-center gap-3 bg-extra-black text-brand-white px-6 py-3 rounded-sm hover:bg-brand-orange transition-all shadow-md shrink-0 outline-none"
            >
              <span className="text-lg font-light leading-none">+</span>
              <span className="font-poppins text-[11px] font-bold uppercase tracking-widest">Nueva Categoría</span>
            </button>
          </div>
        </div>

        {/* GRILLA DE CATEGORÍAS PRINCIPALES */}
        {loading ? (
          <p className="text-xs font-bold uppercase tracking-widest text-dark-grey animate-pulse">Cargando árbol de menú...</p>
        ) : categorias.length === 0 ? (
          <div className="bg-white p-10 border border-light-blue/10 rounded-sm text-center">
            <p className="text-sm font-medium text-dark-grey mb-4">No has configurado ninguna categoría aún.</p>
            <button onClick={() => abrirModal(null)} className="text-[10px] font-bold uppercase tracking-widest text-brand-white bg-brand-orange px-6 py-2.5 rounded-sm hover:bg-dark-blue transition-colors outline-none">
              Crear mi primera Categoría
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categorias.map(cat => (
              <div key={cat.id} className="bg-white border border-light-blue/20 rounded-sm p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between min-h-[12rem]">
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="font-bold text-xl text-extra-black mb-1">{cat.nombre}</h2>
                    <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest ${cat.visible ? 'text-green-600' : 'text-red-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cat.visible ? 'bg-green-600' : 'bg-red-500'}`}></span>
                      {cat.visible ? 'Visible en Tienda' : 'Oculto'}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-dark-grey font-medium mb-4">
                    {cat.subcategorias?.length || 0} Subcategorías configuradas
                  </p>
                  <button 
                    onClick={() => abrirModal(cat)}
                    className="w-full text-center bg-gray-50 border border-light-blue/20 text-extra-black text-[10px] font-bold uppercase tracking-widest py-2.5 rounded-sm hover:border-brand-orange hover:text-brand-orange transition-colors outline-none"
                  >
                    Configurar Árbol →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ======================================= */}
      {/* MODAL DEL ÁRBOL (CATEGORÍA -> SUB -> CEPA)*/}
      {/* ======================================= */}
      {modalAbierto && catActiva && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-extra-black/60 backdrop-blur-sm" onClick={cerrarModal}></div>
          
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-sm shadow-2xl relative z-10 flex flex-col">
            
            {/* Cabecera del Modal */}
            <div className="p-6 border-b border-light-blue/10 flex justify-between items-start bg-gray-50">
              <div className="flex-1 pr-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-dark-grey mb-2">
                  {catActiva.id ? 'Editando Categoría' : 'Nueva Categoría'}
                </p>
                <div className="flex items-center gap-4">
                  <input 
                    type="text" 
                    value={catActiva.nombre}
                    onChange={(e) => updateCatActiva('nombre', e.target.value)}
                    placeholder="Ej: Vinos"
                    className="font-poppins text-2xl font-black text-extra-black bg-transparent border-b border-dashed border-light-blue/30 focus:border-brand-orange outline-none w-full max-w-[300px] py-1"
                  />
                  <label className="flex items-center gap-2 cursor-pointer mt-1">
                    <input 
                      type="checkbox" 
                      checked={catActiva.visible} 
                      onChange={(e) => updateCatActiva('visible', e.target.checked)}
                      className="w-4 h-4 accent-brand-orange" 
                    />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-dark-grey">Visible</span>
                  </label>
                </div>
              </div>
              <button onClick={cerrarModal} className="text-2xl text-dark-grey hover:text-red-500 transition-colors leading-none outline-none">&times;</button>
            </div>

            {/* Cuerpo del Modal: Subcategorías */}
            <div className="p-6 flex-1">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-sm uppercase tracking-widest text-extra-black">Subcategorías</h3>
                <button 
                  onClick={agregarSubcategoria}
                  className="text-[10px] font-bold uppercase tracking-widest text-brand-white bg-extra-black px-3 py-1.5 rounded-sm hover:bg-brand-orange transition-colors outline-none"
                >
                  + Agregar Sub
                </button>
              </div>

              {!catActiva.subcategorias || catActiva.subcategorias.length === 0 ? (
                <p className="text-xs text-dark-grey p-4 bg-gray-50 border border-light-blue/10 rounded-sm text-center">
                  No hay subcategorías. Agrega una para organizar el menú.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {catActiva.subcategorias.map(sub => (
                    <div key={sub.id} className="border border-light-blue/20 rounded-sm overflow-hidden bg-white shadow-sm">
                      
                      {/* Fila de la Subcategoría */}
                      <div className="flex items-center justify-between p-3 bg-white">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => toggleExpandir(sub.id)}
                            className="w-6 h-6 flex items-center justify-center bg-gray-100 text-dark-grey rounded-sm hover:bg-light-blue hover:text-white transition-colors outline-none"
                            title="Ver Cepas"
                          >
                            {subCatExpandida === sub.id ? '−' : '+'}
                          </button>
                          <input 
                            type="text" 
                            value={sub.nombre}
                            onChange={(e) => actualizarSubcategoria(sub.id, 'nombre', e.target.value)}
                            placeholder="Ej: Tinto"
                            className="font-semibold text-sm outline-none focus:border-b border-brand-orange w-40" 
                          />
                          <label className="flex items-center gap-1 cursor-pointer" title="Visible en tienda">
                            <input 
                              type="checkbox" 
                              checked={sub.visible}
                              onChange={(e) => actualizarSubcategoria(sub.id, 'visible', e.target.checked)}
                              className="w-3.5 h-3.5 accent-brand-orange" 
                            />
                          </label>
                        </div>
                        <button 
                          onClick={() => eliminarSubcategoria(sub.id)}
                          className="text-[10px] font-bold uppercase tracking-widest text-red-500/50 hover:text-red-500 transition-colors outline-none"
                        >
                          Eliminar
                        </button>
                      </div>

                      {/* Acordeón de las Cepas */}
                      {subCatExpandida === sub.id && (
                        <div className="p-3 bg-gray-50 border-t border-light-blue/10 pl-12">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-dark-grey">Cepas / Varietales</span>
                            <button 
                              onClick={() => agregarCepa(sub.id)}
                              className="text-[9px] font-bold uppercase tracking-widest text-light-blue hover:text-brand-orange outline-none"
                            >
                              + Agregar Cepa
                            </button>
                          </div>
                          
                          {!sub.cepas || sub.cepas.length === 0 ? (
                            <p className="text-[10px] text-dark-grey/50 italic mb-2">Sin cepas asignadas.</p>
                          ) : (
                            <div className="flex flex-col gap-2">
                              {sub.cepas.map(cepa => (
                                <div key={cepa.id} className="flex items-center justify-between border-b border-light-blue/5 pb-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-light-blue/30 text-xs">↳</span>
                                    <input 
                                      type="text" 
                                      value={cepa.nombre} 
                                      onChange={(e) => actualizarCepa(sub.id, cepa.id, 'nombre', e.target.value)}
                                      placeholder="Ej: Malbec"
                                      className="text-xs bg-transparent outline-none focus:border-b border-brand-orange w-32" 
                                    />
                                    <input 
                                      type="checkbox" 
                                      checked={cepa.visible} 
                                      onChange={(e) => actualizarCepa(sub.id, cepa.id, 'visible', e.target.checked)}
                                      className="w-3 h-3 accent-brand-orange cursor-pointer" 
                                      title="Visible en tienda"
                                    />
                                  </div>
                                  <button 
                                    onClick={() => eliminarCepa(sub.id, cepa.id)}
                                    className="text-[10px] text-red-500/30 hover:text-red-500 outline-none"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pie del Modal */}
            <div className="p-6 border-t border-light-blue/10 bg-white flex justify-between items-center rounded-b-sm">
              <button 
                onClick={eliminarCategoriaCompleta}
                disabled={isSaving}
                className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 px-4 py-2 rounded-sm transition-colors outline-none disabled:opacity-50"
              >
                Eliminar Categoría
              </button>
              <div className="flex gap-4">
                <button 
                  onClick={cerrarModal} 
                  disabled={isSaving}
                  className="text-[10px] font-bold uppercase tracking-widest text-dark-grey hover:text-extra-black transition-colors outline-none disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button 
                  onClick={guardarCambios}
                  disabled={isSaving}
                  className="text-[10px] font-bold uppercase tracking-widest text-brand-white bg-dark-blue hover:bg-brand-orange px-6 py-2.5 rounded-sm transition-colors outline-none disabled:opacity-50"
                >
                  {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}