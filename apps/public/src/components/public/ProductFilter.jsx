import { useState, useMemo } from 'react';

export default function ProductFilter({ 
  productos = [], // <--- SALVAVIDAS 1: Default array vacío
  filtros, 
  setFiltros, 
  isMobileOpen, 
  onCloseMobile,
  modoAdmin = false
}) {
  const [openSections, setOpenSections] = useState({
    categoria: true,
    subcategoria: false,
    varietal: true,
    disponibilidad: false
  });

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const opciones = useMemo(() => {
    const cumpleOtrosFiltros = (p, grupoActual) => {
      if (modoAdmin) return true;

      if (grupoActual !== 'categoria' && filtros.categoria.length > 0 && !filtros.categoria.includes(p.categoria)) return false;
      if (grupoActual !== 'subcategoria' && filtros.subcategoria.length > 0 && !filtros.subcategoria.includes(p.subcategoria)) return false;
      if (grupoActual !== 'varietal' && filtros.varietal.length > 0 && !filtros.varietal.includes(p.varietal)) return false;
      if (grupoActual !== 'disponibilidad' && filtros.disponibilidad.length > 0) {
        const esApedido = p.aPedido;
        const enStock = !p.aPedido && p.stock > 0;
        let dispMatch = false;
        if (filtros.disponibilidad.includes('A Pedido') && esApedido) dispMatch = true;
        if (filtros.disponibilidad.includes('En Stock') && enStock) dispMatch = true;
        if (!dispMatch) return false;
      }
      return true;
    };

    const counts = { categoria: {}, subcategoria: {}, varietal: {}, disponibilidad: { 'En Stock': 0, 'A Pedido': 0 } };

    // SALVAVIDAS 2: (productos || []) previene el undefined
    (productos || []).forEach(p => {
      if (cumpleOtrosFiltros(p, 'categoria') && p.categoria) {
        counts.categoria[p.categoria] = (counts.categoria[p.categoria] || 0) + 1;
      }
      if (cumpleOtrosFiltros(p, 'subcategoria') && p.subcategoria) {
        counts.subcategoria[p.subcategoria] = (counts.subcategoria[p.subcategoria] || 0) + 1;
      }
      if (cumpleOtrosFiltros(p, 'varietal') && p.varietal) {
        counts.varietal[p.varietal] = (counts.varietal[p.varietal] || 0) + 1;
      }
      if (cumpleOtrosFiltros(p, 'disponibilidad')) {
        if (p.aPedido) counts.disponibilidad['A Pedido']++;
        else if (p.stock > 0) counts.disponibilidad['En Stock']++;
      }
    });

    return {
      categoria: Object.entries(counts.categoria).map(([nombre, count]) => ({ nombre, count })).sort((a,b) => b.count - a.count),
      subcategoria: Object.entries(counts.subcategoria).map(([nombre, count]) => ({ nombre, count })).sort((a,b) => b.count - a.count),
      varietal: Object.entries(counts.varietal).map(([nombre, count]) => ({ nombre, count })).sort((a,b) => b.count - a.count),
      disponibilidad: Object.entries(counts.disponibilidad).map(([nombre, count]) => ({ nombre, count })).filter(item => item.count > 0)
    };
  }, [productos, filtros, modoAdmin]);

  const handleCheckboxChange = (tipo, valor) => {
    setFiltros(prev => {
      const seleccionActual = prev[tipo];
      if (seleccionActual.includes(valor)) {
        return { ...prev, [tipo]: seleccionActual.filter(item => item !== valor) };
      } else {
        return { ...prev, [tipo]: [...seleccionActual, valor] };
      }
    });
  };

  const resetFilter = (tipo) => {
    setFiltros(prev => ({ ...prev, [tipo]: [] }));
  };

  const FilterSection = ({ title, tipo, data }) => {
    if (!data || data.length === 0) return null;
    
    const seleccionados = filtros[tipo].length;
    const isOpen = openSections[tipo];

    return (
      <div className="border-b border-dark-blue/10 py-4">
        <button 
          onClick={() => toggleSection(tipo)}
          className="w-full flex items-center justify-between text-left font-poppins font-black uppercase tracking-[0.15em] text-[11px] text-dark-blue hover:text-brand-orange transition-colors"
        >
          {title}
          <svg className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
        </button>

        {isOpen && (
          <div className="mt-4 flex flex-col gap-3 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-[10px] font-poppins font-bold text-dark-blue">
              <span>{seleccionados} Seleccionados</span>
              {seleccionados > 0 && (
                <button onClick={() => resetFilter(tipo)} className="underline hover:text-brand-orange">Reset</button>
              )}
            </div>

            <div className="max-h-48 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-3">
              {data.map((item) => (
                <label key={item.nombre} className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-4 h-4 mt-0.5 border border-dark-blue/30 bg-white group-hover:border-brand-orange transition-colors">
                    <input 
                      type="checkbox" 
                      className="peer sr-only"
                      checked={filtros[tipo].includes(item.nombre)}
                      onChange={() => handleCheckboxChange(tipo, item.nombre)}
                    />
                    <svg className="w-3 h-3 text-brand-white bg-brand-orange absolute inset-0 opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span className="font-poppins text-xs font-semibold text-dark-blue group-hover:text-brand-orange transition-colors capitalize">
                    {item.nombre} <span className="text-dark-blue/40 font-normal">({item.count})</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const contenido = (
    <div className="bg-neutral-white/95 md:bg-transparent h-full flex flex-col">
      <div className="md:hidden flex items-center justify-between p-6 border-b border-dark-blue/10">
        <h3 className="font-poppins font-black uppercase tracking-[0.2em] text-sm text-dark-blue">Filtros</h3>
        <button onClick={onCloseMobile} className="text-dark-blue hover:text-brand-orange p-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="p-6 md:p-0 flex-1 overflow-y-auto">
        <p className="font-playfair italic text-dark-blue/50 text-sm mb-4">
          {modoAdmin ? 'Filtros de Inventario:' : 'Filtrar por:'}
        </p>
        <FilterSection title="Categoría" tipo="categoria" data={opciones.categoria} />
        <FilterSection title="Subcategoría" tipo="subcategoria" data={opciones.subcategoria} />
        <FilterSection title="Varietal" tipo="varietal" data={opciones.varietal} />
        <FilterSection title="Disponibilidad" tipo="disponibilidad" data={opciones.disponibilidad} />
      </div>
      
      <div className="md:hidden p-6 border-t border-dark-blue/10 bg-white">
        <button onClick={onCloseMobile} className="w-full bg-brand-orange text-white font-poppins font-black uppercase tracking-[0.2em] py-4 text-[10px] shadow-lg">
          Ver Resultados
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden md:block w-64 flex-shrink-0 relative z-10">
        {contenido}
      </div>
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-[100] flex">
          <div className="absolute inset-0 bg-extra-black/60 backdrop-blur-sm" onClick={onCloseMobile}></div>
          <div className="relative w-[85%] max-w-sm bg-neutral-white h-full ml-auto shadow-2xl animate-in slide-in-from-right duration-300">
            {contenido}
          </div>
        </div>
      )}
    </>
  );
}