import { useMemo } from 'react';
import { calcularPrecio } from '../pricing/calcularPrecio.js';

export function usePricingEngine(producto, socio) {
  return useMemo(
    () => calcularPrecio(producto, socio),
    [
      producto?.id,
      producto?.precioBase,
      producto?.precioFinal,
      producto?.tipoDescuento,
      producto?.descuentoNombre,
      socio?.porcentaje,
      socio?.badge
    ]
  );
}