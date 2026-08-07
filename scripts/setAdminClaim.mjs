// Uso: node scripts/setAdminClaim.mjs correo@admin.com
// Asigna el custom claim { role: 'admin' } a la cuenta indicada.
// Requiere serviceAccountKey.json en la raíz (NUNCA commitear).

import { readFileSync } from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
initializeApp({ credential: cert(serviceAccount) });

const email = process.argv[2];
if (!email) {
  console.error('Falta el email. Uso: node scripts/setAdminClaim.mjs correo@admin.com');
  process.exit(1);
}

const run = async () => {
  const user = await getAuth().getUserByEmail(email);

  if (user.customClaims?.role === 'admin') {
    console.log(`✓ ${email} ya tenía role:admin. Sin cambios.`);
    process.exit(0);
  }

  await getAuth().setCustomUserClaims(user.uid, { role: 'admin' });
  console.log(`✓ role:admin asignado a ${email} (uid: ${user.uid})`);
  console.log('⚠️  Cerrá sesión y volvé a entrar para que el token tome el claim.');
  process.exit(0);
};

run().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});