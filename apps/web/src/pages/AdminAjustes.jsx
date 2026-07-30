import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '@decant/firebase-client';
import { collection, onSnapshot, doc, setDoc, deleteDoc, addDoc } from 'firebase/firestore';
import AdminNavbar from '../components/layout/AdminNavbar';

export default function AdminAjustes() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // --- ESTADOS CATEGORÍAS ---
  const [categorias, setCategorias] = useState([]);
  const [modalCatAbierto, setModalCatAbierto] = useState(false);
  const [catActiva, setCatActiva] = useState(null);
  const [subCatExpandida, setSubCatExpandida] = useState(null);

  // 1. ESCUCHAR FIREBASE (TIEMPO REAL)
  useEffect(() => {
    const unsubCat = onSnapshot(collection(db, 'categorias_menu'), (snapshot) => {
      setCategorias(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubCat(); 
  }, []);

  // =========================================================
  // 2. LÓGICA DE CATEGORÍAS 
  // =========================================================
  const abrirModalCat = (categoria) => {
    if (categoria) {
      setCatActiva(JSON.parse(JSON.stringify(categoria)));
    } else {
      setCatActiva({ nombre: 'Nueva Categoría', visible: true, subcategorias: [] });
    }
    setSubCatExpandida(null);
    setModalCatAbierto(true);
  };

  const updateCatActiva = (campo, valor) => setCatActiva(prev => ({ ...prev, [campo]: valor }));

  const agregarSubcategoria = () => {
    const nuevaSub = { id: Date.now().toString(), nombre: 'Nueva Sub', visible: true, cepas: [] };
    setCatActiva(prev => ({ ...prev, subcategorias: [...prev.subcategorias, nuevaSub] }));
    setSubCatExpandida(nuevaSub.id);
  };

  const actualizarSubcategoria = (subId, campo, valor) => {
    setCatActiva(prev => ({
      ...prev,
      subcategorias: prev.subcategorias.map(sub => sub.id === subId ? { ...sub, [campo]: valor } : sub)
    }));
  };

  const eliminarSubcategoria = (subId) => {
    if(!window.confirm('¿Seguro que deseas eliminar esta subcategoría?')) return;
    setCatActiva(prev => ({
      ...prev,
      subcategorias: prev.subcategorias.filter(sub => sub.id !== subId)
    }));
  };

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

  const guardarCategoria = async () => {
    if (!catActiva.nombre.trim()) return alert("La categoría necesita un nombre");
    setIsSaving(true);
    try {
      if (catActiva.id) await setDoc(doc(db, 'categorias_menu', catActiva.id), catActiva);
      else await addDoc(collection(db, 'categorias_menu'), catActiva);
      setModalCatAbierto(false);
    } catch (e) { console.error(e); }
    setIsSaving(false);
  };

  const eliminarCategoriaCompleta = async () => {
    if (!catActiva.id) return setModalCatAbierto(false);
    if (window.confirm(`¿Eliminar "${catActiva.nombre}" completa?`)) {
      setIsSaving(true);
      await deleteDoc(doc(db, 'categorias_menu', catActiva.id));
      setModalCatAbierto(false);
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FA] font-poppins text-slate-900 flex flex-col relative">
      <AdminNavbar />
      
      <main className="flex-1 max-w-[95rem] w-full mx-auto pt-8 px-6 pb-20">
        
        <div className="mb-10">
          <Link to="/locked_cellar" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-brand-orange mb-6 outline-none">
            ← Volver al Dashboard
          </Link>
          
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-slate-200 pb-6">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">Taxonomía y Menú</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">
                Gestión de categorías, subcategorías y cepas
              </p>
            </div>
            
            <button 
              onClick={() => abrirModalCat(null)}
              className="bg-slate-900 text-white px-8 py-4 rounded-sm font-black text-[10px] uppercase tracking-widest hover:bg-brand-orange transition-all shadow-lg shadow-slate-900/10"
            >
              + Nueva Categoría
            </button>
          </div>
        </div>

        {/* --- CONTENIDO DE CATEGORÍAS --- */}
        {loading ? (
           <div className="py-20 text-center text-brand-orange text-xs font-black uppercase tracking-widest animate-pulse">Cargando árbol del menú...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categorias.map(cat => (
              <div key={cat.id} className="bg-white border border-slate-200 p-8 rounded-xl shadow-sm flex flex-col justify-between hover:border-brand-orange/30 transition-colors">
                <div>
                  <h2 className="font-black text-xl text-slate-900 mb-1">{cat.nombre}</h2>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${cat.visible ? 'text-green-500' : 'text-red-400'}`}>
                    {cat.visible ? '● Visible en Tienda' : '○ Oculto'}
                  </span>
                </div>
                <button onClick={() => abrirModalCat(cat)} className="mt-8 w-full py-4 bg-slate-50 border border-slate-100 text-[10px] font-black uppercase tracking-widest hover:text-brand-orange transition-colors rounded-sm">
                  Configurar Árbol →
                </button>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* MODAL CATEGORÍAS (COMPLETO) */}
      {modalCatAbierto && catActiva && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setModalCatAbierto(false)}></div>
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl relative z-10 flex flex-col">
            <div className="p-8 border-b bg-slate-50 flex justify-between items-start">
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Editor de Taxonomía</p>
                <div className="flex items-center gap-6">
                  <input type="text" value={catActiva.nombre} onChange={(e) => updateCatActiva('nombre', e.target.value)} className="text-2xl font-black bg-transparent border-b border-dashed border-slate-300 focus:border-brand-orange outline-none w-full max-w-[300px]" />
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={catActiva.visible} onChange={(e) => updateCatActiva('visible', e.target.checked)} className="w-4 h-4 accent-brand-orange" /><span className="text-[10px] font-black uppercase text-slate-500">Visible</span></label>
                </div>
              </div>
              <button onClick={() => setModalCatAbierto(false)} className="text-3xl text-slate-300 hover:text-slate-900">×</button>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center"><h3 className="font-black text-xs uppercase tracking-widest text-slate-900">Subcategorías</h3><button onClick={agregarSubcategoria} className="text-[10px] font-black uppercase text-white bg-slate-900 px-4 py-2 rounded-sm hover:bg-brand-orange transition-colors">+ Agregar Sub</button></div>
              <div className="flex flex-col gap-4">
                {catActiva.subcategorias.map(sub => (
                  <div key={sub.id} className="border border-slate-100 rounded-xl overflow-hidden shadow-sm bg-white">
                    <div className="flex items-center justify-between p-4 bg-slate-50">
                      <div className="flex items-center gap-4">
                        <button onClick={() => setSubCatExpandida(subCatExpandida === sub.id ? null : sub.id)} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-lg font-light">{subCatExpandida === sub.id ? '−' : '+'}</button>
                        <input type="text" value={sub.nombre} onChange={(e) => actualizarSubcategoria(sub.id, 'nombre', e.target.value)} className="font-bold text-sm outline-none bg-transparent focus:border-b border-brand-orange" />
                      </div>
                      <div className="flex items-center gap-4">
                        <input type="checkbox" checked={sub.visible} onChange={(e) => actualizarSubcategoria(sub.id, 'visible', e.target.checked)} className="w-4 h-4 accent-brand-orange" />
                        <button onClick={() => eliminarSubcategoria(sub.id)} className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest">Eliminar</button>
                      </div>
                    </div>
                    {subCatExpandida === sub.id && (
                      <div className="p-6 bg-white border-t border-slate-100 pl-16 space-y-4">
                        <div className="flex justify-between items-center"><span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Cepas / Varietales</span><button onClick={() => agregarCepa(sub.id)} className="text-[9px] font-black text-brand-orange uppercase">+ Nueva Cepa</button></div>
                        <div className="grid grid-cols-1 gap-2">
                          {sub.cepas?.map(cepa => (
                            <div key={cepa.id} className="flex items-center justify-between group">
                              <div className="flex items-center gap-3">
                                <span className="text-slate-200">↳</span>
                                <input type="text" value={cepa.nombre} onChange={(e) => actualizarCepa(sub.id, cepa.id, 'nombre', e.target.value)} className="text-xs font-bold outline-none bg-transparent focus:border-b border-brand-orange w-40" />
                                <input type="checkbox" checked={cepa.visible} onChange={(e) => actualizarCepa(sub.id, cepa.id, 'visible', e.target.checked)} className="w-3 h-3 accent-brand-orange" />
                              </div>
                              <button onClick={() => eliminarCepa(sub.id, cepa.id)} className="text-[10px] text-slate-300 hover:text-red-500 transition-colors">✕</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <footer className="p-8 border-t bg-white flex justify-between items-center">
              <button onClick={eliminarCategoriaCompleta} className="text-[10px] font-black uppercase text-red-500 hover:underline">Eliminar Categoría</button>
              <div className="flex gap-4"><button onClick={() => setModalCatAbierto(false)} className="text-[10px] font-black uppercase text-slate-400">Cancelar</button><button onClick={guardarCategoria} disabled={isSaving} className="bg-slate-900 text-white px-8 py-3 rounded-lg text-[10px] font-black uppercase hover:bg-brand-orange transition-all">{isSaving ? 'Guardando...' : 'Guardar Cambios'}</button></div>
            </footer>
          </div>
        </div>
      )}

    </div>
  );
}