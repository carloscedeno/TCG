# 🧠 COMPOUND: Hotfix de Producción - Restricción NOT NULL en `order_items.product_name` (Mayo 2026)

**Date**: 2026-05-17 19:30

## Objective
Solucionar incidencia crítica de producción donde las compras fallaban con `null value in column "product_name" of relation "order_items" violates not-null constraint`.

## Knowledge Codification

### 1. Invariantes del Esquema de Base de Datos vs RPC Dinámicos
- **Feature**: Refactorización de la migración de `create_order_atomic` para recuperar explícitamente `name`, `printing_id`, `finish` y `set_code` desde las tablas de catálogo (`products` y `accessories`).
- **Lesson**: Al escribir y refactorizar procedimientos almacenados en PL/pgSQL, es mandatorio inspeccionar previamente las restricciones de columna de la base de datos (e.g. `NOT NULL`, `CHECK`). Cualquier columna obligatoria en la tabla destino debe ser explícitamente asignada o tener un `COALESCE` robusto con un valor por defecto.
- **Pattern**: En sistemas de comercio electrónico, los ítems de un pedido (`order_items`) deben capturar y congelar los metadatos descriptivos en el instante de la compra (nombre del producto, precio, acabado, edición) para preservar la inmutabilidad del historial y las facturas ante futuras modificaciones o borrados del catálogo.

## Technical Validation
- **Database**: Migración `20260517233000_fix_create_order_atomic_product_name.sql` aplicada y verificada en producción.
- **Unit Tests**: 100% exitosos en `main` y `dev`.
- **Frontend Build**: Compilación exitosa en ambas ramas.

---

# 🧠 COMPOUND: Corrección de Atomicidad y Deadlocks en Transacciones de Orden (Mayo 2026)

**Date**: 2026-05-17 17:20

## Objective

Resolver bloqueos de concurrencia (deadlocks) y cuellos de botella de atomicidad en el RPC `create_order_atomic` durante picos de tráfico en el checkout.

## Knowledge Codification

### 1. Ordenación Canónica para Prevención de Deadlocks
- **Feature**: Refactorización del RPC `create_order_atomic` para ordenar los ítems entrantes por su identificador (`printing_id` o `accessory_id`) antes de realizar la validación y reserva de stock.
- **Pattern**: En bases de datos relacionales, cuando múltiples transacciones concurrentes actualizan el mismo conjunto de registros en diferente orden, se producen deadlocks de exclusión mutua. El ordenamiento canónico (ej. `ORDER BY id`) garantiza que todas las transacciones adquieran los bloqueos de fila exactamente en la misma secuencia, eliminando la posibilidad de interbloqueos.

### 2. Gestión de Bloqueos Selectivos (`FOR UPDATE`)
- **Feature**: Reemplazo de bloqueos de tabla pesados por cursores y `SELECT ... FOR UPDATE` a nivel de fila individual durante la iteración de reserva de stock.
- **Lesson**: El uso incondicional de bloqueos de tabla o la falta de bloqueos explícitos a nivel de fila durante lecturas-para-escritura en funciones PL/pgSQL genera condiciones de carrera o bloqueos masivos que degradan el rendimiento de la aplicación en producción.

## Technical Validation
- **Database**: Migración `20260517211800_fix_create_order_atomic_status.sql` aplicada con éxito.
- **Unit Tests**: 28 passed.
- **Frontend Build**: Success con 0 errores y exit code 0.

---

# 🧠 COMPOUND: Gestión de Descripciones y UX Premium (Mayo 2026)

**Date**: 2026-05-14 17:35

## Objective

Restaurar la visibilidad de descripciones en el catálogo y torneos, y mejorar drásticamente la experiencia de edición administrativa y navegación.

## Knowledge Codification

### 1. Modal de Edición Full vs Inline Editing

- **Feature**: Reemplazo de la edición inline en `CatalogPage.tsx` por un componente `EditProductModal.tsx` de pantalla completa.
- **Pattern**: Para objetos complejos (TCG Products), la edición modal es superior porque permite gestionar galerías de imágenes, descripciones largas y metadatos sin romper el flujo visual de la tabla maestra.
- **Lesson**: El diseño inline falla cuando el número de campos supera los 5-6 o cuando hay inputs multilínea.

### 2. SPA Navigation & Scroll Management

- **Feature**: Implementación de `ScrollToTop.tsx` global en `App.tsx`.
- **Lesson**: En aplicaciones React, es obligatorio resetear el scroll (`window.scrollTo(0, 0)`) en cada cambio de ruta para evitar que el usuario aterrice en el "footer" al entrar a un detalle de producto desde una lista larga.
- **Rule**: Cada nueva aplicación SPA debe incluir un `ScrollToTop` de serie.

### 3. Redirección Directa vs Vista Previa

- **UX**: Eliminación del modal de vista previa rápida en favor de la navegación directa a la página de detalle espectacular (`CardDetail.tsx`).
- **Optimization**: Esto simplifica la lógica del frontend y asegura que el usuario siempre vea la mejor versión del producto con todos sus metadatos (descripción, variantes, carrusel).

## Technical Validation

- **Frontend Build**: Success (tras limpieza de variables TS6133).
- **Git Status**: Pushed to `dev`.
- **UX Audit**: Verificado el reset de scroll y la carga de descripciones en `dev.geekorium.shop`.

---

# 🧠 COMPOUND: Sincronización de Catálogo y Remediación de Importación Masiva (v63)

**Date**: 2026-05-13 11:30

## Objective

Resolver fallos en la carga masiva de inventario mediante la sincronización de metadatos faltantes y el endurecimiento de la lógica de upsert en la base de datos.

## Knowledge Codification

### 1. Remediación Automática de Catálogo (Scryfall Sync)

- **Feature**: Creados scripts de utilidad (`fetch_missing_cards.py`) que utilizan IDs de Scryfall para parchar automáticamente el catálogo maestro cuando se detectan sets o cartas faltantes.
- **Rule**: Ninguna importación de inventario debe fallar por restricciones de llave foránea si el ID de Scryfall es válido; el sistema debe ser capaz de auto-abastecerse de metadatos.

### 2. Endurecimiento de Upsert (SQL Constraints)

- **Pattern**: Uso de `ON CONFLICT ON CONSTRAINT products_printing_id_condition_finish_key` en lugar de targets de columnas genéricos.
- **Lesson**: Esto previene ambigüedades en tablas con columnas que permiten nulos (`finish`) o donde existen múltiples índices parciales.

### 3. Integridad Visual de Tokens y Sets Especiales

- **Optimization**: Los tokens (sets terminados en `C`, `Tokens`) ahora se registran correctamente vinculándolos a sus juegos correspondientes (`MTG`), asegurando que las imágenes y rarezas sean visibles en el storefront.

## Technical Validation

- **Frontend Build**: Success.
- **Database**: 24 productos fallidos cargados exitosamente tras el parche de catálogo.
- **Unit Tests**: 28 Passed.

---

# 🧠 COMPOUND: Bulk Catalog Import & Validation Hardening

**Date**: 2026-05-12 17:45

## Objective

Implement a high-performance bulk import system for the accessory catalog, bypassing image requirements and standardizing category ingestion.

## Knowledge Codification

### 1. Catalog Import Architecture (Edge Function)

- **Feature**: Added `catalog` import type to `tcg-api`. It maps CSV headers to the `accessories` table and performs batch insertions.
- **Optimization**: Implemented `.trim()` on `category_code` within the Edge Function to prevent foreign key violations caused by hidden whitespace in CSV files.
- **Flexibility**: Updated validation to allow `price: 0.00` for promotional or free items, using `isNaN()` instead of truthy checks.

### 2. Intelligent Auto-mapping (BulkImport.tsx)

- **Pattern**: Implemented a "Catalog Detection" mode. If headers match the system template (`category_code`, `suggested_price`), the UI pre-selects all mappings automatically.
- **Language**: Standardized example data and templates to **English** by default, aligning with international TCG standards while maintaining local currency support.

### 3. Product-Centric UI Integration

- **Component**: Created `BulkImportCatalogModal.tsx` following the "Geeko Noir" design system (GlassCard, Geeko Cyan accents).
- **Placement**: Integrated into `CatalogPage.tsx` as a primary administrative action alongside manual creation.

## Technical Validation

- **Frontend Build**: Success.
- **Git Status**: Pushed to `dev`.
- **Edge Function**: Deployed and verified with a 10-row test file (`TEST_IMPORT_FUNCIONA.csv`).

---


# 🧠 COMPOUND: Banner Regression & React "Phantom Zero" Remediation

**Date**: 2026-05-12 16:45

## Objective

Remediate a UI regression where global banners were overwriting game-specific TCG banners, and eliminate "stray 0" artifacts from the product grid.

## Knowledge Codification

### 1. Banner Category Shadowing (Home.tsx)

- **Regression**: In a recent refactor, `gameCode` was being forced to `undefined` when `activeTab === 'catalog'`, causing the `HeroSection` to fallback to global home banners even when a specific TCG was filtered.
- **Fix**: Restored the direct link between `filters.games` and `HeroSection`. The banner logic now respects the selected TCG regardless of the active viewing mode (Cartas vs Accesorios).
- **Rule**: Never override state-derived props with hardcoded defaults in the top-level page unless a specific view explicitly forbids it.

### 2. The "Phantom Zero" React Anti-pattern

- **Discovery**: In React, `{number && <Component />}` evaluates to `0` and renders it if the number is `0`.
- **Lesson**: Transitioned components to `{!!number && <Component />}` or `number > 0 && <Component />`.
- **Reference**: Added to `.agent/lessons_learned.md` as Lesson #155.

## Technical Validation

- **Frontend Build**: Success.
- **Git Status**: Clean.
- **TCG Testing**: MTG and Pokémon banners verified via browser subagent.
- **Unit Tests**: 28 Passed.

---


# 🧠 COMPOUND: Unified Cart & Discount Synchronization

**Date**: 2026-05-11 22:00

## Objective

Finalize the unified cart architecture to ensure cards and accessories are handled consistently, with real-time discount synchronization across authenticated and guest sessions.

## Knowledge Codification

### 1. Unified Cart Mapping (RPC Trust)

- **Standard**: The frontend `fetchCart` now trusts the `get_user_cart` RPC as the single source of truth for all cart item metadata and price calculations.
- **Bypass**: Removed complex client-side normalization and fallback queries in `api.ts` to favor server-side consistency.

### 2. Guest Discount Parity

- **Pattern**: Guest cart processing in `api.ts` now mirrors the backend's discount logic.
- **Rule**: Prices for accessories and cards in local storage are dynamically recalculated based on active offers (`discount_percentage` and expiration dates) to prevent pricing drift.

### 3. Detail Fetching Hierarchy

- **Hierarchy**: When fetching product details by UUID, always check the `accessories` table BEFORE falling back to the Edge Function (Scryfall/Cards). 
- **Logging**: Added diagnostic logging to distinguish between store-local inventory (Accessories) and global catalog data (Cards), resolving 404 console errors.

## Technical Validation

- **Frontend Build**: Success.
- **E2E Verification**: Confirmed via browser subagent (Auth & Guest flows).
- **Console Audit**: Zero 404s for accessory details.

---


# 🧠 COMPOUND: E2E Checkout Remediation & "Por Encargo" Workflow

**Date**: 2026-05-07 00:10

## Objective

Remediate the E2E checkout process by implementing "Por Encargo" logic to bypass strict stock validation and provide clear UI feedback.

## Knowledge Codification

### 1. The "On-Demand" Bypass Pattern

- **Pattern**: Instead of blocking orders with `RAISE EXCEPTION` when stock is low, the system now accepts the order and flags `order_items.is_on_demand = true`.
- **Rule**: Stock can be decremented to 0 (floor) or allowed to go negative depending on the specific product type tracking needs.

### 2. Contextual UI Feedback

- **UI**: Cyan badges (`geeko-cyan`) with black text are used for "POR ENCARGO" labels to ensure high visibility against the dark theme.
- **Badge logic**: `quantity > stock` is the definitive trigger for the "On-Demand" state in the UI.

### 3. Operational WhatsApp Flow

- **Rule**: Every WhatsApp order message MUST identify if it contains on-demand items via a header and per-item markers to alert the sales team of needed sourcing.

## Technical Validation

- **Frontend Build**: Success.
- **Unit Tests**: 28 Passed.
- **Database**: Migration 20260507120000 prepared for remote deployment.
