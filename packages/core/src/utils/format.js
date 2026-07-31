export const formatPrice = (valor, { locale = 'es-AR', moneda = 'ARS' } = {}) =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: moneda,
    maximumFractionDigits: 0
  }).format(Number(valor) || 0);