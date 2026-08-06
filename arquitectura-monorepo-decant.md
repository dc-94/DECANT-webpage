# DECANT — Arquitectura del monorepo (`web-decant`)

**Stack:** pnpm workspaces + Turborepo · React 19 · Vite 8 (→ Next en Etapa 4) · Firebase · Tailwind 4
**Alcance:** solo el repo `web-decant`. `decant-catalogo` sigue como repo aparte y entra como `apps/catalog` más adelante.

**Leyenda de etapas:**
`[E0]` scaffold + extracción DRY · `[E1]` split de apps · `[E2]` piso de seguridad · `[E3]` quick wins · `[E4]` Next

---

## Árbol destino

```
decant-web/
│
├── package.json                    [E0]  workspaces + scripts raíz (dev, build, lint)
├── pnpm-workspace.yaml             [E0]  declara apps/* y packages/*
├── turbo.json                      [E0]  pipeline + caché de builds
├── .npmrc                          [E0]  strict-peer-deps, shamefully-hoist=false
├── .gitignore                      [E0]
├── .env.example                    [E0]  contrato de variables (sin valores reales)
├── README.md                       [E0]  cómo levantar cada app
│
├── .github/
│   └── workflows/
│       └── ci.yml                  [E3]  lint + build por app vía turbo
│
│  ── RAÍZ FIREBASE (compartida por todo el proyecto) ──
├── firebase.json                   [E0]  ya existe
├── .firebaserc                     [E0]  ya existe
├── firestore.rules                 [E2]  ⚠️ NO EXISTE — hueco crítico. Se escribe acá.
├── firestore.indexes.json          [E2]
├── storage.rules                   [E2]
│
│  ══════════ APPS ══════════
├── apps/
│   │
│   ├── web/                        [E0]  ⚠️ TEMPORAL: tu app actual entra acá tal cual.
│   │                                     Se disuelve en public/ + sealed/ en E1.
│   │
│   ├── public/                     [E1]  decant.online — storefront
│   │   ├── package.json
│   │   ├── vite.config.js                extiende packages/config
│   │   ├── vercel.json                   deploy propio → decant.online
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.jsx
│   │       ├── App.jsx                   SIN host-detection (muere window.location.hostname)
│   │       ├── routes/                   Home · Shop · ProductDetail · Checkout
│   │       │                             CheckoutSuscripciones · Tracking · Gracias
│   │       ├── features/
│   │       │   ├── cart/                 CartDrawer, CartContext
│   │       │   ├── socio/                SocioContext (→ pasa a validar por servidor en E2)
│   │       │   ├── catalog/              CatalogContext, ProductFilter, SearchOverlay
│   │       │   └── agegate/              AgeGate
│   │       └── styles/
│   │
│   ├── sealed/                     [E1]  sealed.decantclub.online — panel admin
│   │   ├── package.json
│   │   ├── vite.config.js                → next.config.js en E4
│   │   ├── vercel.json                   deploy propio → sealed.decantclub.online
│   │   └── src/
│   │       ├── main.jsx
│   │       ├── App.jsx
│   │       ├── routes/                   Login · AdminSelector · LockedCellar · LockedStorefront
│   │       └── features/
│   │           ├── inventario/           ProductForm, historial de stock
│   │           ├── ventas/               DrawerNuevaVenta, DrawerDetalleVenta
│   │           ├── pedidos/              ResumenFooterPedido (UNA sola copia → mata L2)
│   │           ├── facturacion/          DrawerFactura
│   │           ├── clientes/             gestión + PIN (modal enmascarado → A4)
│   │           └── ajustes/              storefront editor, datos empresa
│   │
│   └── catalog/                    [—]   HOY REPO APARTE (decant-catalogo).
│                                         Cuando entre: importa de packages/ y se
│                                         eliminan las copias de redondearCentena/ProductCard.
│
│  ══════════ PACKAGES (el corazón DRY) ══════════
├── packages/
│   │
│   ├── core/                       [E0]  ⭐ PRIMER ENTREGABLE. Lógica de negocio pura.
│   │   ├── package.json                  @decant/core · sin React, sin Firebase, sin DOM
│   │   └── src/
│   │       ├── pricing/
│   │       │   ├── calcularPrecio.js      fuente ÚNICA de precio (cliente + servidor)
│   │       │   ├── redondearCentena.js    fuente ÚNICA de redondeo
│   │       │   ├── descuentos.js          VIP, promo, escalonados
│   │       │   └── usePricingEngine.js    wrapper React sobre lo de arriba
│   │       ├── cart/                      totales, subtotales, envío
│   │       ├── orders/                    armado + validación de pedido
│   │       ├── metrics/                   useDashboardMetrics
│   │       └── utils/
│   │           ├── format.js              formatPrice (Intl ARS) → mata UX1
│   │           ├── validators.js          allowlist de campos (→ A7)
│   │           └── slug.js
│   │
│   ├── firebase-client/            [E0]  SDK de navegador
│   │   └── src/
│   │       ├── client.js                  init de Firebase
│   │       ├── AuthContext.jsx            UNA sola versión, Google-only → mata A6
│   │       └── hooks/                     useCollection, useDoc, useSnapshot
│   │
│   ├── firebase-admin/             [E2]  SDK de servidor (Functions / Next server)
│   │   └── src/                           SEPARADO a propósito: evita que el Admin SDK
│   │                                      termine en un bundle de browser por un import suelto
│   │
│   ├── ui/                         [E0]  design system tokenizado
│   │   └── src/
│   │       ├── tokens/                    colores/tipografía como variables (NO literales)
│   │       ├── primitives/                Button, Modal, Drawer, Toast, Input, Select
│   │       ├── commerce/                  ProductCard, PriceTag, StockBadge, DiscountBadge
│   │       └── layout/                    Header, Footer, Container
│   │
│   ├── types/                      [E0]  contratos de datos
│   │   └── src/                           Producto, Pedido, Cliente, Tenant, Pago
│   │                                      (campos públicos vs privados explícitos → C1)
│   │
│   ├── tenant/                     [E0]  ⭐ costura multi-tenant / white-label
│   │   └── src/
│   │       ├── schema.js                  forma de un config de tenant
│   │       └── decant.config.js           branding, adminEmails, whatsapp, moneda,
│   │                                      tiers de descuento. NADA hardcodeado en código.
│   │
│   └── config/                     [E0]  configuración compartida
│       ├── eslint/
│       ├── tailwind/                      preset único (consume tokens de ui)
│       ├── vite/                          base config que extienden las apps
│       └── jsconfig/                      (o tsconfig si adoptás TS)
│
│  ══════════ SERVIDOR ══════════
└── functions/                      [E2]  Cloud Functions v2 (node 24)
    ├── package.json                       importa @decant/core → el servidor recalcula
    │                                      precios con EL MISMO código que el cliente
    └── src/
        ├── index.js
        ├── middleware/
        │   ├── appCheck.js                → cierra A5, E5, E6
        │   └── verifyAuth.js              valida ID token
        ├── orders/
        │   └── procesarCheckoutTienda.js  ya recalcula server-side (bien)
        ├── payments/
        │   └── mercadopago.webhook.js     ⭐ ÚNICO lugar que otorga membresía → mata E1
        ├── email/
        │   └── brevo.js                   toEmail derivado del pedido, no del request → E6
        └── catalog/
            └── syncCatalogoPublico.js     trigger productos → catalogo_publico → mata C1
```

---

## Las 3 decisiones que hacen esto escalable

**1. `packages/core` no depende de React, Firebase ni del DOM.**
Por eso lo puede importar tanto el navegador como las Cloud Functions. Resultado: el precio se calcula con **el mismo código** en cliente y servidor. Es DRY, y además elimina de raíz toda la clase de bugs de "el cliente manda un precio distinto al real".

**2. `firebase-client` y `firebase-admin` son paquetes separados.**
No es burocracia: es para que nadie importe por error el Admin SDK (con credenciales privilegiadas) en código que se envía al browser. La separación física es la garantía.

**3. `packages/tenant` es la costura del white-label.**
Hoy hay un solo tenant. Pero como `ADMIN_EMAIL`, colores, WhatsApp y tiers de descuento se leen de un config y no están hardcodeados, vender el modelo a otro negocio mañana es **cargar un config nuevo**, no forkear el repo. Es la diferencia entre un producto y un proyecto a medida.

---

## Sobre TypeScript (recomendación, no bloqueante)

Hoy el repo es JS/JSX. Para algo que va a manejar pagos y venderse como modelo, mi consejo senior es **adoptar TS en el borde de los paquetes primero**: tipar `packages/types` y `packages/core` (son chicos y de alto apalancamiento — ahí un contrato mal usado te cuesta plata), dejando las apps en JSX con `allowJs: true`. Ganás seguridad donde importa sin frenar el desarrollo con una migración total. Es incremental y podés decidirlo después del E0.

---

## Orden de ejecución

| Etapa | Qué | Cierra |
|---|---|---|
| **E0** | Scaffold + extraer `core`, `firebase-client`, `ui`, `types`, `tenant`, `config` | A6, L2, UX1 (dedup) |
| **E1** | Split `apps/public` + `apps/sealed`, matar host-detection | A3 |
| **E2** | `firestore.rules`, `catalogo_publico`, App Check, webhook MP | A1, A5, A7, C1, C3, E1, E2, E4, E5, E6, E9 |
| **E3** | Quick wins restantes | E10, E11, UX2, A4, CX1 |
| **E4** | `apps/sealed` → Next (middleware, server components) | DX + refuerza A3 |
