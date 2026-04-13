import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import AdminNavbar from '../components/layout/AdminNavbar';

const Icons = {
  Inventario: () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>),
  Ventas: () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M9 14l6-6m-4 0h4v4M3 10h18M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" /></svg>),
  Clientes: () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>),
  Ajustes: () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>),
  TrendingUp: () => (<svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>),
  Clock: () => (<svg className="w-5 h-5 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>),
  MapPin: () => (<svg className="w-5 h-5 text-light-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>),
  Calendar: () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>)
};

export default function LockedCellar() {
  const [loading, setLoading] = useState(true);
  
  const [filtroActivo, setFiltroActivo] = useState('este_mes'); 
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const [metricas, setMetricas] = useState({
    ingresosBrutos: 0, pendienteCobro: 0, ticketPromedio: 0, pedidosPagados: 0,
    mrrSuscripciones: 0, topCiudades: [], horarioEstrella: '', modalidadesEnvio: {},
    sociosTotales: 0, sociosDescorche: 0, sociosTerruno: 0,
    nuevosDescorche: 0, nuevosTerruno: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const now = new Date();
        let inicioRango = new Date();
        let finRango = new Date();

        if (filtroActivo === 'este_mes') {
          inicioRango = new Date(now.getFullYear(), now.getMonth(), 1); 
          finRango = now;
        } else if (filtroActivo === '30_dias') {
          inicioRango = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
          finRango = now;
        } else if (filtroActivo === 'rango' && fechaInicio && fechaFin) {
          inicioRango = new Date(fechaInicio + 'T00:00:00');
          finRango = new Date(fechaFin + 'T23:59:59');
        }

        const pedidosSnap = await getDocs(collection(db, 'pedidos'));
        
        let ingresos = 0, pendientes = 0, pagados = 0, mrr = 0;
        const hourCounts = {}, cityCounts = {}, envioCounts = {};

        pedidosSnap.docs.forEach(doc => {
          const p = doc.data();
          if (!p.createdAt) return;
          const fechaPedido = p.createdAt.toDate();

          if (fechaPedido >= inicioRango && fechaPedido <= finRango) {
            const total = p.totalFinal || 0;
            
            if (p.estado === 'Pendiente') pendientes += total;
            else if (p.estado !== 'Cancelado') {
              ingresos += total;
              pagados += 1;
              if (p.tipo === 'suscripcion') mrr += total;
            }

            const hora = fechaPedido.getHours();
            hourCounts[hora] = (hourCounts[hora] || 0) + 1;

            if (p.formData?.ciudad) {
              const ciudadNorm = p.formData.ciudad.toUpperCase().trim();
              cityCounts[ciudadNorm] = (cityCounts[ciudadNorm] || 0) + 1;
            }
          }
        });

        const clientesSnap = await getDocs(collection(db, 'clientes'));
        
        let descorche = 0, terruno = 0;
        let nDescorche = 0, nTerruno = 0;

        clientesSnap.docs.forEach(doc => {
          const c = doc.data();
          const esDescorche = c.badge?.toLowerCase() === 'descorche';
          const esTerruno = c.badge?.toLowerCase() === 'terruño' || c.badge?.toLowerCase() === 'terruno';
          
          if (esDescorche) descorche++;
          if (esTerruno) terruno++;

          if (c.createdAt) {
            const fechaAlta = c.createdAt.toDate();
            if (fechaAlta >= inicioRango && fechaAlta <= finRango) {
              if (esDescorche) nDescorche++;
              if (esTerruno) nTerruno++;
            }
          }
        });

        const ticketProm = pagados > 0 ? (ingresos / pagados) : 0;
        const top3Ciudades = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
        
        // 👉 NUEVA LÓGICA: Rango de Horario Estrella (Sliding Window de 3 horas)
        let horaTop = 'N/A';
        if (pagados >= 3) {
          let maxSum = 0;
          let bestStart = 0;
          // Buscamos el bloque de 3 horas continuas con más ventas
          for (let i = 0; i <= 21; i++) {
            const sum = (hourCounts[i] || 0) + (hourCounts[i+1] || 0) + (hourCounts[i+2] || 0);
            if (sum > maxSum) {
              maxSum = sum;
              bestStart = i;
            }
          }
          if (maxSum > 0) {
            horaTop = `${bestStart}:00 - ${bestStart + 3}:00 hs`;
          }
        } else if (Object.keys(hourCounts).length > 0) {
          // Fallback si hay muy pocas ventas: muestra la hora pico exacta
          const mejorHora = Object.keys(hourCounts).reduce((a, b) => hourCounts[a] > hourCounts[b] ? a : b);
          horaTop = `${mejorHora}:00 - ${parseInt(mejorHora) + 1}:00 hs`;
        }

        setMetricas({
          ingresosBrutos: ingresos, pendienteCobro: pendientes, ticketPromedio: ticketProm,
          pedidosPagados: pagados, mrrSuscripciones: mrr, topCiudades: top3Ciudades,
          horarioEstrella: horaTop, modalidadesEnvio: envioCounts,
          sociosTotales: descorche + terruno, sociosDescorche: descorche, sociosTerruno: terruno,
          nuevosDescorche: nDescorche, nuevosTerruno: nTerruno
        });

      } catch (error) {
        console.error("Error al cargar dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    if (filtroActivo !== 'rango' || (filtroActivo === 'rango' && fechaInicio && fechaFin)) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [filtroActivo, fechaInicio, fechaFin]);

  const menuCards = [
    { titulo: 'Inventario', icono: <Icons.Inventario />, link: '/locked_cellar/inventario' },
    { titulo: 'Ventas', icono: <Icons.Ventas />, link: '/locked_cellar/ventas' },
    { titulo: 'Clientes', icono: <Icons.Clientes />, link: '/locked_cellar/clientes' },
    { titulo: 'Configuración', icono: <Icons.Ajustes />, link: '/locked_cellar/ajustes' } // 👉 TEXTO CAMBIADO
  ];

  return (
    <div className="min-h-screen bg-[#F4F7FA] font-poppins text-extra-black pb-20">
      <AdminNavbar />
      
      <main className="max-w-[90rem] w-full mx-auto px-6 pt-10">
        
        {/* HEADER Y ACCESOS RÁPIDOS */}
        <div className="flex flex-col xl:flex-row items-start xl:items-end justify-between gap-6 border-b border-light-blue/10 pb-8 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-widest mb-2 text-dark-blue">Locked Cellar</h1>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-light-blue">Panel de Control & Inteligencia</p>
          </div>
          
          <div className="grid grid-cols-2 md:flex gap-3 w-full xl:w-auto">
            {menuCards.map((card, idx) => (
              <Link key={idx} to={card.link} className="flex items-center gap-2 bg-white border border-light-blue/20 px-5 py-4 hover:border-brand-orange transition-all shadow-sm rounded-sm group">
                <span className="text-light-blue group-hover:text-brand-orange transition-colors">{card.icono}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-dark-blue group-hover:text-brand-orange">{card.titulo}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* BARRA DE FILTROS */}
        <div className="bg-white border border-light-blue/10 p-4 rounded-sm shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex bg-gray-100 p-1 rounded-sm w-full md:w-auto">
            <button 
              onClick={() => setFiltroActivo('este_mes')} 
              className={`flex-1 md:flex-none px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-sm transition-all outline-none ${filtroActivo === 'este_mes' ? 'bg-white text-brand-orange shadow-sm' : 'text-dark-grey hover:text-dark-blue'}`}
            >
              Este Mes
            </button>
            <button 
              onClick={() => setFiltroActivo('30_dias')} 
              className={`flex-1 md:flex-none px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-sm transition-all outline-none ${filtroActivo === '30_dias' ? 'bg-white text-brand-orange shadow-sm' : 'text-dark-grey hover:text-dark-blue'}`}
            >
              Últimos 30 Días
            </button>
            <button 
              onClick={() => setFiltroActivo('rango')} 
              className={`flex-1 md:flex-none px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-sm transition-all outline-none ${filtroActivo === 'rango' ? 'bg-white text-brand-orange shadow-sm' : 'text-dark-grey hover:text-dark-blue'}`}
            >
              Rango
            </button>
          </div>

          {filtroActivo === 'rango' && (
            <div className="flex items-center gap-3 w-full md:w-auto animate-in fade-in">
              <Icons.Calendar />
              <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="border border-light-blue/20 p-2 text-xs text-dark-blue outline-none focus:border-brand-orange rounded-sm" />
              <span className="text-light-blue text-xs">-</span>
              <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="border border-light-blue/20 p-2 text-xs text-dark-blue outline-none focus:border-brand-orange rounded-sm" />
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-20 text-center text-brand-orange text-xs font-black uppercase tracking-widest animate-pulse">Cargando métricas...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* COLUMNA 1: SALUD FINANCIERA */}
            <div className="flex flex-col gap-6">
              <div className="bg-white border border-light-blue/10 p-6 rounded-sm shadow-sm relative overflow-hidden">
                <div className="absolute -right-4 -top-4 bg-green-500/10 w-24 h-24 rounded-full blur-2xl"></div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-widest text-dark-grey">Ingresos Brutos</span>
                  <Icons.TrendingUp />
                </div>
                <p className="text-4xl font-playfair italic font-black text-dark-blue relative z-10">${metricas.ingresosBrutos.toLocaleString()}</p>
                <p className="text-[10px] font-bold text-light-blue mt-2 uppercase tracking-widest relative z-10">De {metricas.pedidosPagados} órdenes completadas</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white border border-light-blue/10 p-6 rounded-sm shadow-sm">
                  <span className="text-[10px] font-black uppercase tracking-widest text-dark-grey block mb-2">A Cobrar</span>
                  <p className="text-xl font-bold text-brand-orange">${metricas.pendienteCobro.toLocaleString()}</p>
                </div>
                <div className="bg-white border border-light-blue/10 p-6 rounded-sm shadow-sm">
                  <span className="text-[10px] font-black uppercase tracking-widest text-dark-grey block mb-2">Ticket Prom.</span>
                  <p className="text-xl font-bold text-dark-blue">${Math.round(metricas.ticketPromedio).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* COLUMNA 2: PULSO DEL CLUB */}
            <div className="bg-white border-2 border-brand-orange/20 p-8 rounded-sm shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-brand-orange/10 blur-3xl rounded-full pointer-events-none"></div>
              
              <div className="relative z-10">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-orange mb-1 block">Comunidad VIP (Histórico)</span>
                <h3 className="text-4xl font-playfair italic text-dark-blue mb-8">{metricas.sociosTotales} Socios</h3>
                
                <div className="flex gap-10 mb-8 border-y border-light-blue/10 py-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-3xl font-black text-dark-blue block">{metricas.sociosDescorche}</span>
                      {metricas.nuevosDescorche > 0 && <span className="bg-green-100 text-green-700 text-[9px] font-black px-2 py-0.5 rounded-sm">+{metricas.nuevosDescorche}</span>}
                    </div>
                    <span className="text-[9px] uppercase tracking-widest text-dark-grey font-bold">Descorche</span>
                  </div>
                  <div>
                     <div className="flex items-center gap-2 mb-1">
                      <span className="text-3xl font-black text-dark-blue block">{metricas.sociosTerruno}</span>
                      {metricas.nuevosTerruno > 0 && <span className="bg-green-100 text-green-700 text-[9px] font-black px-2 py-0.5 rounded-sm">+{metricas.nuevosTerruno}</span>}
                    </div>
                    <span className="text-[9px] uppercase tracking-widest text-dark-grey font-bold">Terruño</span>
                  </div>
                </div>
              </div>

              <div className="relative z-10">
                <span className="text-[10px] font-black uppercase tracking-widest text-dark-grey block mb-2">MRR (Ingreso Recurrente del Periodo)</span>
                <p className="text-3xl font-bold text-dark-blue">${metricas.mrrSuscripciones.toLocaleString()}</p>
              </div>
            </div>

            {/* COLUMNA 3: INSIGHTS & COMPORTAMIENTO */}
            <div className="flex flex-col gap-6">
              
              <div className="bg-white border border-light-blue/10 p-6 rounded-sm shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-dark-grey block mb-1">Horario de Oro</span>
                  <p className="text-lg font-bold text-dark-blue">{metricas.horarioEstrella}</p>
                </div>
                <div className="bg-brand-orange/10 p-3 rounded-full"><Icons.Clock /></div>
              </div>

              <div className="bg-white border border-light-blue/10 p-6 rounded-sm shadow-sm flex-1">
                <div className="flex justify-between items-start mb-6 border-b border-light-blue/10 pb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-dark-grey">Destinos Frecuentes</span>
                  <Icons.MapPin />
                </div>
                <ul className="space-y-4">
                  {metricas.topCiudades.length === 0 ? (
                    <li className="text-[10px] font-bold uppercase tracking-widest text-light-blue">Sin datos en este rango.</li>
                  ) : (
                    metricas.topCiudades.map(([ciudad, cantidad], i) => (
                      <li key={ciudad} className="flex justify-between items-center">
                        <span className="text-xs font-bold capitalize text-dark-blue">{i+1}. {ciudad.toLowerCase()}</span>
                        <span className="bg-[#F4F7FA] border border-light-blue/20 text-dark-blue px-2 py-1 text-[10px] font-black rounded-sm">{cantidad} órdenes</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>

            </div>

          </div>
        )}
      </main>
    </div>
  );
}