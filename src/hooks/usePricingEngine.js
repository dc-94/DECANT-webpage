import { useMemo } from 'react';

/**
 * Hook para centralizar la lógica de cálculo de precios y descuentos VIP.
 * @param {Object} producto - El objeto del producto a evaluar.
 * @param {Object} socio - El objeto del socio actual (desde SocioContext).
 * @returns {Object} Datos calculados del precio.
 */
export function usePricingEngine(producto, socio) {
  return useMemo(() => {
    // Si no hay producto, devolvemos valores por defecto seguros
    if (!producto) {
      return { 
        precioBase: 0, 
        precioEfectivo: 0, 
        descuentoVIPAplicado: false, 
        ahorroUnitario: 0 
      };
    }

    const precioBase = producto.precioBase || producto.precioFinal;
    let precioEfectivo = producto.precioFinal;
    let descuentoVIPAplicado = producto.descuentoNombre?.includes('Socio') || false;

    // Si el usuario es socio y el producto no traía ya un descuento VIP fijo
    if (socio && socio.porcentaje && !descuentoVIPAplicado) {
      const precioTeoricoSocio = Math.round(precioBase * (1 - socio.porcentaje));
      
      // Solo aplicamos el descuento del socio si es mejor que el precio de oferta actual
      if (precioTeoricoSocio < producto.precioFinal) {
        precioEfectivo = precioTeoricoSocio;
        descuentoVIPAplicado = true;
      }
    }

    const ahorroUnitario = descuentoVIPAplicado && (precioBase > precioEfectivo) 
      ? (precioBase - precioEfectivo) 
      : 0;

    return {
      precioBase,           // El precio original sin descuentos (para mostrar tachado)
      precioEfectivo,       // El precio final que el cliente va a pagar
      descuentoVIPAplicado, // Booleano para saber si mostramos la etiqueta VIP
      ahorroUnitario        // Cuántos pesos se ahorró por unidad
    };
  }, [producto, socio]);
}