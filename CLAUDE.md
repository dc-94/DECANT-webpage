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
   con JSX estilado necesita su ruta en `@source` (ver `apps/web/src/index.css`).
6. **Dentro de un package, imports relativos** (`./client.js`). El nombre del paquete
   (`@decant/...`) es solo para consumirlo desde afuera. (Un auto-import rompe el build.)

---

## Estado actual: E0 COMPLETO ✅

Rama: `chore/monorepo-e0` (commiteada, **sin mergear a main todavía**).

Lo hecho en E0:
- Scaffold pnpm + Turborepo (`pnpm-workspace.yaml`, `turbo.json`, `package.json` raíz, `.npmrc`).
- App actual movida a `apps/web` (temporal; se parte en E1). `git mv` para conservar historial.
- `public/` y `.env` movidos a `apps/web/`.
- Packages extraídos:
  - **`@decant/core`** — pricing como fuente única. `calcularPrecio` con correcciones:
    `redondearCentena` unificado, clamp de `porcentaje` (evita precios negativos),
    `tipoDescuento: 'SOCIO'` con shim `@deprecated` sobre el viejo `descuentoNombre.includes('Socio')`,
    fallbacks simétricos, `usePricingEngine` con deps primitivas.
  - **`@decant/firebase-client`** — `client.js` (init) + `AuthContext` único (Google-only, mata dup A6).
  - **`@decant/ui`** — `ProductCard` (presentacional, recibe `socio` y `onAddToCart` por props) + `BlobProducto`.
- `useDashboardMetrics` volvió a la app (es hook de datos, no lógica pura → no va en core).
- Fix Tailwind 4: `@source "../../../packages/ui/src"` en `apps/web/src/index.css`.

Verificado en local: app idéntica a antes, productos cargan, **precio VIP redondea a la centena**
(prueba de que core es la fuente única real).

⚠️ **NO mergear a main ni deployar el E0.** `sealed.decantclub.online` en producción corre
la versión vieja; tocarlo con el E0 sin cerrar rompe el panel admin en vivo.

---

## Próximo paso: E1 — split de apps

**Objetivo:** partir `apps/web` en dos apps deployables independientes:
- **`apps/public`** → decant.online (Home, Shop, ProductDetail, Checkout, CheckoutSuscripciones, Tracking, Gracias)
- **`apps/sealed`** → sealed.decantclub.online (Login, AdminSelector, LockedCellar, LockedStorefront y sus drawers/forms)

**Lo que E1 cierra:** hallazgo **A3** — hoy `App.jsx` decide admin/público en runtime con
`window.location.hostname`. Al partir, cada app sabe lo que es y **se elimina esa detección**.
El código admin deja de viajar en el bundle público.

**Cómo hacerlo (sin reescribir componentes):**
1. Crear `apps/public` y `apps/sealed`, cada una con su `package.json`, `vite.config.js`,
   `index.html`, `.env` y `vercel.json` propios.
2. Repartir `apps/web/src` según entorno. Lo compartido (contextos comunes, layout base)
   que hoy usan ambos → evaluar si sube a `@decant/ui` o se duplica mínimamente.
3. Cada app arma su propio árbol de providers en su `App.jsx`, **sin** `window.location`.
   ⚠️ Respetar el orden: **`SocioProvider` envuelve a `CartProvider`** (Cart consume `useSocio`).
4. Cada `App.jsx` con su router propio y solo sus rutas.
5. Borrar `apps/web` cuando las dos apps levanten.
6. Actualizar `@source` de Tailwind en cada app y el `firebase.json` (paths de deploy/build).
7. Resolver `sealed.localhost` para dev local (mapear en `/etc/hosts` o correr cada app en su puerto).

**Chequeo de cierre E1:** ambas apps levantan por separado (`pnpm --filter public dev`,
`pnpm --filter sealed dev`), se ven igual que antes, y ya no existe `window.location.hostname`
en el código.

---

## Roadmap completo

| Etapa | Qué | Estado |
|---|---|---|
| **E0** | Scaffold monorepo + extracción DRY (core/ui/firebase-client) | ✅ Hecho |
| **E1** | Split `apps/public` + `apps/sealed`, eliminar host-detection | ← siguiente |
| **E2** | Piso de seguridad: `firestore.rules`, `catalogo_publico`, App Check, webhook MP | Pendiente |
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
- **Bug preexistente en `App.jsx`:** `currentHost === '[www.decant.online](...)'` tiene sintaxis
  de markdown pegada de un copy/paste → esa comparación nunca matchea. Se limpia al partir en E1.
- **`useDashboardMetrics`** quedó en la app (admin). En E1 va a `apps/sealed`.
- **`functions/` está fuera del workspace pnpm.** En E2, cuando importe `@decant/core`, hay que
  meterlo al workspace y resolver que Firebase Deploy no sigue symlinks de pnpm (tiene su maña).

---

## Primeras acciones sugeridas para esta sesión de Claude Code

1. Verificar que la rama es `chore/monorepo-e0` y que el árbol coincide con lo descrito arriba
   (`pnpm ls -r --depth -1` debe listar: `decant`, `web`, `@decant/core`, `@decant/firebase-client`, `@decant/ui`).
2. Correr `pnpm --filter web build` para confirmar que el E0 compila limpio.
3. Empezar E1 según el plan de arriba, **una app por vez**, verificando build tras cada paso.
4. Convención de commits: `chore(e1): ...`, un commit por sub-fase, para poder bisectar.

## Reglas de trabajo (aprendidas en E0)

- **Un `package.json` con `"name"` es lo único que convierte una carpeta en package.**
  Tras crear un package, correr `pnpm ls -r --depth -1` ANTES de agregarlo a `dependencies` de una app.
- **Usar `pnpm --filter <name> build` como juez** de imports: recorre todo el grafo y lista
  los que no resuelven de una, sin depender de navegar a la página que los importa.
- **`git mv`** para todo movimiento de archivos (conserva historial).
- **Verificar en disco antes de asumir.** Muchos errores de E0 fueron archivos que no llegaron
  a crearse (bloque cortado al pegar). `ls`/`grep` antes de avanzar.
