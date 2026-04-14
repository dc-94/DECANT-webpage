import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';

export function useDashboardMetrics(filtroActivo, fechaInicio, fechaFin) {
  const [loading, setLoading] = useState(true);
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

        // Lógica de Rango de Fechas
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
        let descorche = 0, terruno = 0, nDescorche = 0, nTerruno = 0;

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
        
        // Lógica: Horario Estrella (Sliding Window 3h)
        let horaTop = 'N/A';
        if (pagados >= 3) {
          let maxSum = 0;
          let bestStart = 0;
          for (let i = 0; i <= 21; i++) {
            const sum = (hourCounts[i] || 0) + (hourCounts[i+1] || 0) + (hourCounts[i+2] || 0);
            if (sum > maxSum) {
              maxSum = sum;
              bestStart = i;
            }
          }
          if (maxSum > 0) horaTop = `${bestStart}:00 - ${bestStart + 3}:00 hs`;
        } else if (Object.keys(hourCounts).length > 0) {
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
        console.error("Error en hook de métricas:", error);
      } finally {
        setLoading(false);
      }
    };

    if (filtroActivo !== 'rango' || (filtroActivo === 'rango' && fechaInicio && fechaFin)) {
      fetchDashboardData();
    }
  }, [filtroActivo, fechaInicio, fechaFin]);

  return { metricas, loading };
}