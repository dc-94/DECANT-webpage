import { redondearCentena } from './redondearCentena.js';

const PORCENTAJE_MAX = 0.9;

/** Tolera 0.2 y 20 como "20%". Clampea para que nunca haya precio negativo. */
const normalizarPorcentaje = (valor) => {
  const n = Number(valor);
  if (!Number.isFinite(n) || n <= 0) return 0;
  const fraccion = n > 1 ? n / 100 : n;
  return Math.min(fraccion, PORCENTAJE_MAX);
};

/** Fuente única de verdad. Usa tipoDescuento; el string es shim @deprecated. */
export const esDescuentoSocio = (producto) => {
  if (producto?.tipoDescuento) return producto.tipoDescuento === 'SOCIO';
  return Boolean(producto?.descuentoNombre?.toLowerCase().includes('socio'));
};

export const calcularPrecio = (producto, socio) => {
  const vacio = { precioBase: 0, precioEfectivo: 0, descuentoVIPAplicado: false, ahorroUnitario: 0 };
  if (!producto) return vacio;

  const precioBase = Number(producto.precioBase ?? producto.precioFinal ?? 0);
  let precioEfectivo = Number(producto.precioFinal ?? precioBase);
  if (!Number.isFinite(precioBase) || !Number.isFinite(precioEfectivo)) return vacio;

  let descuentoVIPAplicado = esDescuentoSocio(producto);
  const porcentaje = normalizarPorcentaje(socio?.porcentaje);

  if (porcentaje > 0 && !descuentoVIPAplicado) {
    const precioTeoricoSocio = redondearCentena(precioBase * (1 - porcentaje));
    if (precioTeoricoSocio < precioEfectivo) {
      precioEfectivo = precioTeoricoSocio;
      descuentoVIPAplicado = true;
    }
  }

  precioEfectivo = Math.max(0, precioEfectivo);
  const ahorroUnitario =
    descuentoVIPAplicado && precioBase > precioEfectivo ? precioBase - precioEfectivo : 0;

  return { precioBase, precioEfectivo, descuentoVIPAplicado, ahorroUnitario };
};