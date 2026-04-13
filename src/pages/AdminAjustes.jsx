import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../config/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, addDoc } from 'firebase/firestore';
import AdminNavbar from '../components/layout/AdminNavbar';

export default function AdminAjustes() {
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' o 'proveedores'
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // --- ESTADOS CATEGORÍAS ---
  const [categorias, setCategorias] = useState([]);
  const [modalCatAbierto, setModalCatAbierto] = useState(false);
  const [catActiva, setCatActiva] = useState(null);
  const [subCatExpandida, setSubCatExpandida] = useState(null);

  // --- ESTADOS PROVEEDORES ---
  const [proveedores, setProveedores] = useState([]);
  const [modalProvAbierto, setModalProvAbierto] = useState(false);
  const [provActivo, setProvActivo] = useState(null);

  // 1. ESCUCHAR FIREBASE (TIEMPO REAL)
  useEffect(() => {
    // Escuchar Categorías
    const unsubCat = onSnapshot(collection(db, 'categorias_menu'), (snapshot) => {
      setCategorias(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Escuchar Proveedores
    const unsubProv = onSnapshot(collection(db, 'proveedores'), (snapshot) => {
      setProveedores(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => { unsubCat(); unsubProv(); };
  }, []);

  // =========================================================
  // 2. LÓGICA DE CATEGORÍAS (TU LÓGICA ORIGINAL)
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

  // =========================================================
  // 3. LÓGICA DE PROVEEDORES
  // =========================================================
  const abrirModalProv = (prov) => {
    setProvActivo(prov ? JSON.parse(JSON.stringify(prov)) : {
      nombre: '', razonSocial: '', cuit: '', direccion: '', telefono: '', vendedor: '', plazoPago: ''
    });
    setModalProvAbierto(true);
  };

  const guardarProveedor = async () => {
    if (!provActivo.nombre.trim()) return alert("El nombre es obligatorio");
    setIsSaving(true);
    try {
      if (provActivo.id) await setDoc(doc(db, 'proveedores', provActivo.id), provActivo);
      else await addDoc(collection(db, 'proveedores'), provActivo);
      setModalProvAbierto(false);
    } catch (e) { console.error(e); }
    setIsSaving(false);
  };

  const eliminarProveedor = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este proveedor?")) {
      await deleteDoc(doc(db, 'proveedores', id));
      setModalProvAbierto(false);
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
              <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">Configuración</h1>
              <div className="flex gap-8 mt-6">
                <button 
                  onClick={() => setActiveTab('menu')}
                  className={`pb-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'menu' ? 'border-b-2 border-brand-orange text-brand-orange' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Categorías y Menú
                </button>
                <button 
                  onClick={() => setActiveTab('proveedores')}
                  className={`pb-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'proveedores' ? 'border-b-2 border-brand-orange text-brand-orange' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Proveedores
                </button>
              </div>
            </div>
            
            <button 
              onClick={() => activeTab === 'menu' ? abrirModalCat(null) : abrirModalProv(null)}
              className="bg-slate-900 text-white px-8 py-4 rounded-sm font-black text-[10px] uppercase tracking-widest hover:bg-brand-orange transition-all shadow-lg shadow-slate-900/10"
            >
              + {activeTab === 'menu' ? 'Nueva Categoría' : 'Nuevo Proveedor'}
            </button>
          </div>
        </div>

        {/* --- CONTENIDO DE CATEGORÍAS --- */}
        {activeTab === 'menu' && (
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

        {/* --- CONTENIDO DE PROVEEDORES --- */}
        {activeTab === 'proveedores' && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre / Plazo</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Razón Social / CUIT</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Contacto</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {proveedores.map(prov => (
                  <tr key={prov.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-6">
                      <p className="font-black text-slate-900 text-sm">{prov.nombre}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Plazo: {prov.plazoPago || 'N/A'}</p>
                    </td>
                    <td className="p-6 text-xs text-slate-600">
                      <p className="font-bold">{prov.razonSocial}</p>
                      <p className="opacity-60">{prov.cuit}</p>
                    </td>
                    <td className="p-6 text-xs text-slate-600">
                      <p className="font-bold">{prov.vendedor}</p>
                      <p className="opacity-60">{prov.telefono}</p>
                    </td>
                    <td className="p-6 text-right">
                      <button onClick={() => abrirModalProv(prov)} className="text-brand-orange font-black text-[10px] uppercase tracking-widest hover:underline">Ver Ficha →</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      {/* MODAL PROVEEDORES (COMPLETO) */}
      {modalProvAbierto && provActivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setModalProvAbierto(false)}></div>
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col">
            <header className="p-8 border-b bg-slate-50 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Ficha de Proveedor</h2>
                <p className="text-[10px] font-black text-brand-orange uppercase tracking-widest mt-1">Gestión administrativa</p>
              </div>
              <button onClick={() => setModalProvAbierto(false)} className="text-3xl text-slate-300 hover:text-slate-900">×</button>
            </header>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Nombre Comercial *</label>
                  <input type="text" value={provActivo.nombre} onChange={(e) => setProvActivo({...provActivo, nombre: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-orange font-bold text-sm" />
                </div>
                <div><label className="text-[9px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Razón Social</label><input type="text" value={provActivo.razonSocial} onChange={(e) => setProvActivo({...provActivo, razonSocial: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold" /></div>
                <div><label className="text-[9px] font-black uppercase text-slate-400 mb-2 block tracking-widest">CUIT</label><input type="text" value={provActivo.cuit} onChange={(e) => setProvActivo({...provActivo, cuit: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold" /></div>
                <div className="col-span-2"><label className="text-[9px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Dirección Comercial</label><input type="text" value={provActivo.direccion} onChange={(e) => setProvActivo({...provActivo, direccion: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold" /></div>
                <div><label className="text-[9px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Vendedor / Contacto</label><input type="text" value={provActivo.vendedor} onChange={(e) => setProvActivo({...provActivo, vendedor: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold" /></div>
                <div><label className="text-[9px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Teléfono</label><input type="text" value={provActivo.telefono} onChange={(e) => setProvActivo({...provActivo, telefono: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold" /></div>
                <div className="col-span-2"><label className="text-[9px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Plazo de Pago</label><input type="text" value={provActivo.plazoPago} onChange={(e) => setProvActivo({...provActivo, plazoPago: e.target.value})} placeholder="Ej: 30 días FF" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold" /></div>
              </div>
            </div>
            <footer className="p-8 border-t bg-white flex justify-between items-center">
              <button onClick={() => eliminarProveedor(provActivo.id)} className="text-[10px] font-black uppercase text-red-500 hover:underline">Eliminar Proveedor</button>
              <div className="flex gap-4"><button onClick={() => setModalProvAbierto(false)} className="text-[10px] font-black uppercase text-slate-400">Cancelar</button><button onClick={guardarProveedor} disabled={isSaving} className="bg-slate-900 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase hover:bg-brand-orange transition-all">{isSaving ? 'Guardando...' : 'Guardar Proveedor'}</button></div>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}