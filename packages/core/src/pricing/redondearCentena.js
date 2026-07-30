export const redondearCentena = (valor) => {
  const n = Number(valor);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n / 100) * 100;
};