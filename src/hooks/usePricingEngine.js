import { useMemo } from 'react';

/**
 * Función pura para calcular precios. Exportable para usar fuera de hooks (ej. en el Carrito).
 */
export const calcularPrecio = (producto, socio) => {
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

  if (socio && socio.porcentaje && !descuentoVIPAplicado) {
    const precioTeoricoSocio = Math.round(precioBase * (1 - socio.porcentaje));
    
    if (precioTeoricoSocio < producto.precioFinal) {
      precioEfectivo = precioTeoricoSocio;
      descuentoVIPAplicado = true;
    }
  }

  const ahorroUnitario = descuentoVIPAplicado && (precioBase > precioEfectivo) 
    ? (precioBase - precioEfectivo) 
    : 0;

  return {
    precioBase,
    precioEfectivo,
    descuentoVIPAplicado,
    ahorroUnitario
  };
};

/**
 * Hook para centralizar la lógica de cálculo de precios y descuentos VIP en componentes.
 */
export function usePricingEngine(producto, socio) {
  return useMemo(() => calcularPrecio(producto, socio), [producto, socio]);
}