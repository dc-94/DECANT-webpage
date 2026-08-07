// Uso: node scripts/backfillCatalogo.mjs
// Copia productos existentes → catalogo_publico (lista blanca).
// Requiere serviceAccountKey.json en la raíz (NUNCA commitear).

import { readFileSync } from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const CAMPOS_PUBLICOS = [
  'nombre', 'bodega', 'varietal', 'categoria', 'subcategoria',
  'precioFinal', 'precioBase', 'imageUrl', 'stock', 'aPedido',
  'slug', 'descuentoNombre', 'tipoDescuento', 'createdAt'
];

const run = async () => {
  const snap = await db.collection('productos').get();
  console.log(`Encontrados ${snap.size} productos. Copiando...`);

  let batch = db.batch();
  let count = 0;

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const publico = {};
    for (const campo of CAMPOS_PUBLICOS) {
      if (data[campo] !== undefined) publico[campo] = data[campo];
    }
    batch.set(db.collection('catalogo_publico').doc(docSnap.id), publico);
    count++;

    // Firestore limita a 500 operaciones por batch
    if (count % 400 === 0) {
      await batch.commit();
      batch = db.batch();
      console.log(`  ${count} copiados...`);
    }
  }

  await batch.commit();
  console.log(`✓ Backfill completo: ${count} productos en catalogo_publico.`);
  process.exit(0);
};

run().catch((err) => { console.error('Error:', err.message); process.exit(1); });