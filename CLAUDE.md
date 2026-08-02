# CLAUDE.md — Contexto del proyecto DECANT

> Este archivo va en la **raíz del repo `web-decant`**. Es la fuente de verdad para
> cualquier sesión de Claude Code. Leelo entero antes de tocar código.

---

## Qué es DECANT

Plataforma de e-commerce de vinos con **tres entornos**:

- **decant.online** — storefront público (e-commerce)
- **sealed.decantclub.online** — panel administrativo
- **decant-catalogo** — catálogo público de solo lectura (⚠️ **repo aparte**, no se toca desde acá)

Requisitos de negocio que condicionan la arquitectura:
- Va a manejar **pagos reales** → seguridad y validación server-side son no-negociables.
- Se venderá como **modelo white-label** a negocios similares → **multi-tenant desde el diseño**: nada de valores de negocio hardcodeados (admin email, colores, WhatsApp, moneda, tiers de descuento viven en config por tenant).

## Stack

pnpm workspaces + Turborepo · React 19 · Vite 8 (→ Next.js en E4, solo `sealed`) · Firebase (Firestore + Auth Google + Cloud Functions v2) · Tailwind CSS 4 · Cloudinary · Brevo (email) · Mercado Pago (suscripciones). Deploy en Vercel.

---

## ⭐ REGLA DE ORO (no la rompas nunca)

1. **`@decant/core` no importa React, Firebase ni el DOM.** Es lógica pura. Se importa
   tanto desde el navegador como desde Cloud Functions, así el precio se calcula con el
   MISMO código en cliente y servidor. Si un archivo necesita Firebase/React/DOM, **no va en core**.
2. **Subpath exports de core:** lo que empieza con `use` (hooks) va a `@decant/core/react`.
   Todo lo demás (`calcularPrecio`, `redondearCentena`, `formatPrice`, `esDescuentoSocio`)
   va a `@decant/core`.
3. **Dirección de dependencias:** las apps dependen de los packages, **nunca al revés**.
   Un package jamás importa de `apps/`. Componentes compartidos van a `@decant/ui` y
   reciben datos por **props** (no consumen contextos de la app internamente).
4. **`firebase-client` (SDK navegador) y `firebase-admin` (SDK servidor) son packages
   separados** para que el Admin SDK nunca termine en un bundle de browser.
5. **Tailwind 4 escanea vía `@source` en el CSS**, no vía `content` del config. Todo package
   con JSX estilado necesita su ruta en `@source` (ver `apps/public/src/index.css`).
6. **Dentro de un package, imports relativos** (`./client.js`). El nombre del paquete
   (`@decant/...`) es solo para consumirlo desde afuera. (Un auto-import rompe el build.)

---

## Estado actual: E1 COMPLETO ✅

Rama de trabajo: `parallel-building` (basada en `main` = E0, **sin mergear ni deployar**).

E0 (base, ya en `main`): monorepo pnpm+Turborepo; `@decant/core` (pricing fuente única,
`tipoDescuento: 'SOCIO'`, `usePricingEngine`), `@decant/firebase-client` (`client.js` + `AuthContext`
Google-only), `@decant/ui` (`ProductCard` por props + `BlobProducto`); fix Tailwind `@source`.

Lo hecho en E1 — `apps/web` partido en dos apps deployables independientes:
- **`apps/public`** (name `public`, dev :5173) → decant.online. Hereda el historial de `apps/web`.
  Rutas: Home, Shop, ProductDetail, Checkout, Gracias, Ayuda, Manifiesto, Suscripciones,
  CheckoutSuscripciones, GraciasSuscripciones, Tracking, CatalogoRapido.
  Providers: `Auth > Catalog > Socio > Cart`.
- **`apps/sealed`** (name `sealed`, dev :5174) → sealed.decantclub.online.
  Rutas: Login, AdminSelector, locked_cellar/storefront, AdminInventario/Ventas/Clientes/
  Facturacion/Ajustes. Providers: `Auth > Catalog` (Catalog lo usa `locked_storefront`).
- **Eliminada la host-detection** (`window.location.hostname`, hallazgo **A3**) y el bug
  `currentHost === '[www.decant.online]...'`. El código admin ya no viaja en el bundle público.
- **`@decant/ui`** sumó `ErrorBoundary`, `ScrollToTop` (presentacionales compartidos) y
  `lazyWithRetry` (recupera chunks vencidos tras un redeploy en vez de caer al ErrorBoundary).
- Cada app tiene su `vite.config.js` (puerto fijo `strictPort`), `index.html`, `vercel.json`,
  `.env` (gitignored, copiado a cada app) e `index.css` con `@source "../../../packages/ui/src"`.

Verificado en local (ambas apps, dev separado): idénticas a antes del split. Público probado
end-to-end salvo pago real: catálogo, filtros, product detail, **add-to-cart** (persiste en
`localStorage decant_cart`), checkout y suscripciones renderizan sin errores de consola. Sealed:
login renderiza y `ProtectedRoute` redirige a `/login`.

⚠️ **NO mergear a main ni deployar.** `sealed.decantclub.online` en prod corre la versión vieja.

---

## Próximo paso: E2 — piso de seguridad

Ver roadmap. **E2 es la de mayor retorno** (cierra 11 de 26 hallazgos, no depende de Next):
`firestore.rules` (hoy no existe → sangrado más grave), colección `catalogo_publico` de solo
lectura, App Check, y validación server-side del webhook de Mercado Pago.

Antes de E2, dos verificaciones funcionales que quedaron fuera de mi alcance (necesitan login/servicios):
- **CRUD admin** logueado con Google (carga de productos, facturas, ventas offline).
- **Pago Mercado Pago** en checkout con credenciales reales.

---

## Roadmap completo

| Etapa | Qué | Estado |
|---|---|---|
| **E0** | Scaffold monorepo + extracción DRY (core/ui/firebase-client) | ✅ Hecho |
| **E1** | Split `apps/public` + `apps/sealed`, eliminar host-detection | ✅ Hecho |
| **E2** | Piso de seguridad: `firestore.rules`, `catalogo_publico`, App Check, webhook MP | ← siguiente |
| **E3** | Quick wins restantes (dedup, CORS www, placeholder de imágenes) | Pendiente |
| **E4** | Migrar `apps/sealed` a Next.js (middleware, server components) | Pendiente |

**E2 es la de mayor retorno:** cierra 11 de los 26 hallazgos pendientes y NO depende de Next.
Es el sangrado de seguridad más grave (no existe `firestore.rules`).

---

## Deuda técnica flaggeada (no perder de vista)

- **`@decant/ui` importa `Link` de `react-router-dom`** → parametrizar (recibir el componente
  de link por prop) en E4, porque con Next el `Link` es otro.
- **`CartContext` depende de `SocioContext`** → desacoplar cuando la validación de socio pase
  al servidor (E2): el carrito debería recibir el descuento como dato, no ir a otro contexto.
- **`CatalogContext` está duplicado** en `apps/public` y `apps/sealed` (lo necesitan ambas;
  es un contexto con Firebase, no puede ir a `@decant/ui` por regla de oro #3). Candidato a un
  paquete `@decant/catalog` compartido cuando exista `catalogo_publico` (E2+).
- **`functions/` está fuera del workspace pnpm.** En E2, cuando importe `@decant/core`, hay que
  meterlo al workspace y resolver que Firebase Deploy no sigue symlinks de pnpm (tiene su maña).
- **`favicon.svg` no existe:** los `index.html` lo referencian pero en assets sólo hay
  `favicon.png` → favicon roto (preexistente de E0). Agregar el `.svg` o corregir el `<link>`.
- **`tailwind.config.js` (`content`) quedó inerte** con Tailwind 4: el scan real es `@source`
  en el CSS. Se mantiene por paridad; se puede borrar en ambas apps.
- **Código admin muerto en `apps/sealed`:** `components/admin/ProductList.jsx` y
  `components/admin/ventas/*` no los importa nadie hoy (¿WIP?). Se movieron, no se borraron.

---

## Primeras acciones sugeridas para esta sesión de Claude Code

1. Verificar rama `parallel-building` y que `pnpm ls -r --depth -1` liste:
   `decant`, `public`, `sealed`, `@decant/core`, `@decant/firebase-client`, `@decant/ui`.
2. Correr `pnpm build` (turbo) para confirmar que ambas apps compilan limpio.
3. Dev: `pnpm --filter public dev` (:5173) y `pnpm --filter sealed dev` (:5174) por separado.
4. Empezar E2 (piso de seguridad). Convención de commits: `chore(e2): ...`, uno por sub-fase.

## Reglas de trabajo (aprendidas en E0)

- **Un `package.json` con `"name"` es lo único que convierte una carpeta en package.**
  Tras crear un package, correr `pnpm ls -r --depth -1` ANTES de agregarlo a `dependencies` de una app.
- **Usar `pnpm --filter <name> build` como juez** de imports: recorre todo el grafo y lista
  los que no resuelven de una, sin depender de navegar a la página que los importa.
- **`git mv`** para todo movimiento de archivos (conserva historial).
- **Verificar en disco antes de asumir.** Muchos errores de E0 fueron archivos que no llegaron
  a crearse (bloque cortado al pegar). `ls`/`grep` antes de avanzar.
