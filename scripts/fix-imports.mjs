import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'apps/web/src';

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full) : [full];
  });

// path viejo -> paquete nuevo
const RULES = [
  { re: /(['"])(?:\.{1,2}\/)+context\/AuthContext(?:\.jsx)?\1/g, to: "'@decant/firebase-client'" },
  { re: /(['"])(?:\.{1,2}\/)+config\/firebase(?:\.js)?\1/g,      to: "'@decant/firebase-client'" }
];

// pricing: el destino depende de si importa un hook o la función pura
const PRICING = /(['"])(?:\.{1,2}\/)+hooks\/(?:usePricingEngine|useDashboardMetrics)(?:\.js)?\1/g;

let tocados = 0;

for (const file of walk(ROOT)) {
  if (!/\.(js|jsx)$/.test(file)) continue;
  const original = fs.readFileSync(file, 'utf8');
  let out = original;

  for (const { re, to } of RULES) out = out.replace(re, to);

  out = out.replace(/import\s*{([^}]*)}\s*from\s*(['"])(?:\.{1,2}\/)+hooks\/(?:usePricingEngine|useDashboardMetrics)(?:\.js)?\2/g,
    (match, nombres) => {
      const usaHook = /\buse[A-Z]/.test(nombres);
      const usaPuro = /\b(calcularPrecio|redondearCentena|esDescuentoSocio|formatPrice)\b/.test(nombres);
      if (usaHook && usaPuro) {
        console.warn('⚠️  MIXTO, revisar a mano:', file, '→', nombres.trim());
        return match;
      }
      return `import {${nombres}} from '${usaHook ? '@decant/core/react' : '@decant/core'}'`;
    });

  if (out !== original) {
    fs.writeFileSync(file, out);
    console.log('✓', file);
    tocados++;
  }
}

const restantes = walk(ROOT).filter(
  (f) => /\.(js|jsx)$/.test(f) && PRICING.test(fs.readFileSync(f, 'utf8'))
);
if (restantes.length) console.warn('\nSin migrar:', restantes);
console.log(`\n${tocados} archivos actualizados`);