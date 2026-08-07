// Uso: node scripts/checkAdminClaim.mjs correo@admin.com
// Muestra los custom claims de una cuenta.

import { readFileSync } from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
initializeApp({ credential: cert(serviceAccount) });

const email = process.argv[2];
const user = await getAuth().getUserByEmail(email);
console.log(`Claims de ${email}:`, user.customClaims || '(ninguno)');
process.exit(0);