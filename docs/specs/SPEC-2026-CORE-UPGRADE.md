# 🚀 SPEC-2026: Gran Evolución del Ecosistema Geekorium (DEV)

> **Estado**: 📝 En Definición / Planificación Estructurada  
> **Ambiente de Ejecución**: Exclusivo `dev`  
> **Objetivo**: Integrar mejoras mayores en Backend Odoo, soporte ampliado Multi-TCG, rediseño de Eventos, campos de BD y renovación integral de interfaz (UI/UX), garantizando cero regresiones mediante contratos de tipos y Graphify.

---

## 🧭 Pilares de Ejecución (Orden de Capas Estricto)

```
[ Track 1: Esquema & Base de Datos (Supabase) ]
  ├── Migraciones SQL versionadas
  ├── Nuevos campos (Productos, Eventos, Sync Odoo)
  └── Generación de tipos TypeScript (`database.types.ts`)
                          │
                          ▼
[ Track 2: Backend, Sync & Odoo ERP ]
  ├── Webhooks de eventos / e-wallets
  ├── Sincronización de inventario & productos Odoo
  └── Scrapers / Mapeadores de nuevos TCGs
                          │
                          ▼
[ Track 3: Módulo de Eventos 2.0 ]
  ├── Lógica de torneos, rondas e inscripciones
  ├── Integración de E-Wallets y canjes
  └── Notificaciones y check-in
                          │
                          ▼
[ Track 4: Rediseño Visual & Experiencia (UI/UX) ]
  ├── Sistema de diseño / Componentes base
  ├── Navegación, Catálogo y Filtros TCG modernos
  └── Experiencia de eventos y checkout
```

---

## 📋 Track 1: Base de Datos & Modelos de Datos

### 1.1 Campos a incorporar / refactorizar
- [ ] **Productos / Cartas**:
  - `game_id` / `tcg_type`: Normalización para soportar múltiples TCGs de forma uniforme.
  - Campos específicos por TCG (código de set, rareza extendida, numeración, estado de inventario).
  - Flags de sincronización con Odoo (`odoo_product_id`, `last_odoo_sync_at`, `odoo_variant_id`).
- [ ] **Eventos & Inscripciones**:
  - Ampliación de campos para el módulo 2.0 (capacidad, reglas de torneo, premios, estado del check-in, tracking de e-wallet).
- [ ] **Generación de Contratos**:
  - Ejecutar `supabase gen types typescript` hacia `frontend/src/types/database.types.ts` antes de tocar código de cliente.

---

## ⚙️ Track 2: Backend, Sincronización & Odoo

### 2.1 Conector Odoo
- [ ] Consolidar Edge Functions y scripts de sincronización (`supabase/functions/odoo-*` y `scripts/sync/`).
- [ ] Manejo idempotente de webhooks (evitar duplicación de registros de ventas/inventario).
- [ ] Saneamiento y mapeo robusto de categorías y variantes.

### 2.2 Motor Multi-TCG
- [ ] Estandarización de adapters para nuevos TCGs (parsers de cartas, precios de mercado e imágenes).
- [ ] Mecánica de fallback para cartas sin precio o imágenes faltantes.

---

## 🏆 Track 3: Módulo de Eventos 2.0

- [ ] Flujo completo de registro y validación de cupos en tiempo real.
- [ ] Integración con el saldo / monedero (e-wallet) de Geekorium para inscripciones y premios.
- [ ] Vistas administrativas para organizadores de torneos (check-in de jugadores).

---

## 🎨 Track 4: Rediseño Visual de Interfaz (UI/UX)

- [ ] Definición de Tokens de Diseño (tipografía, paleta de colores, cards de productos, badges de rareza).
- [ ] Rediseño de la barra de navegación y switch de TCGs (acceso ágil entre MTG, Pokémon, One Piece, Gundam, etc.).
- [ ] Nuevo Catálogo: Filtros reactivos, layout denso/cómodo, modal de carta interactivo.
- [ ] Vista moderna de Eventos (calendario interactivo, tickets digitales).

---

## 📥 5. Buzón de Intake de Requerimientos (Raw Notes / To-Do)
> *Pega aquí directamente las notas en crudo, mensajes, nombres de tablas/campos o listas de features a medida que los recibas. Los procesaremos y estructuraremos en los Tracks de arriba.*

### 5.1 Nuevos Campos de Base de Datos / Odoo
<!-- Pega aquí los campos o modelos a modificar -->

### 5.2 Nuevos TCGs a incorporar
<!-- Lista de juegos y fuentes de datos/precios -->

### 5.3 Cambios en Eventos
<!-- Nuevas reglas, flujos de inscripción o check-in -->

### 5.4 Rediseño Visual (UI/UX)
<!-- Wireframes, referencias o componentes a rediseñar -->

---

## 🛡️ Protocolo de Seguridad y Control de Cambios
1. **Branch**: Todo cambio se desarrolla y prueba exclusivamente en `dev`.
2. **Impact Radius Check**: Uso de `graphify` para mapear dependencias antes de refactorizar componentes clave.
3. **Daily Log**: Registro en `docs/daily-logs/` de cada módulo completado.
4. **Validación de Compilación**: `pnpm build` o comprobación de TypeScript libre de errores en cada commit.

