# 📋 PRD MASTER — Geekorium v4.0
>
> **Estado:** Activo | **Última actualización:** 2026-02-26  
> **Fuente base:** `docs/PRD nuevas modificaciones 20260223.md` + estado real de implementación

---

## 1. Visión del Producto

**Geekorium** es un marketplace TCG de alta fidelidad para coleccionistas de Magic: The Gathering (y otros TCGs). Opera como un **Generador de Leads Verificados**: el carrito no garantiza reserva de stock hasta que el Geeko-Asesor confirma la existencia física.

**Stack:** React 18 + TypeScript | Supabase (Auth/DB/Storage/Edge Functions) | Tailwind CSS | GitHub Pages (deploy)

---

## 2. Sistema de Diseño (Tokens Canónicos)

Todos los valores deben derivar de `tailwind.config.js`. Sin valores hardcoded.

| Token | Hex | Uso |
|---|---|---|
| `bg-primary` | `#1F182D` | Main viewport |
| `bg-secondary` | `#281F3E` | Cards, filtros |
| `bg-accent` | `#373266` | Header, modales |
| `action-cyan` | `#00AEB4` | Botones, precios activos |
| `format-gold` | `#F9AE00` | Badges de legalidad MTG |
| `text-high` | `#FFFFFF` | Títulos, precios |
| `text-low` | `#B7B7B7` | Flavor text, metadata |

**Tipografía:**

- `font-bogue`: Solo logo y H1
- `font-daito`: Navegación y CTAs
- `font-rubik`: Body y datos (Regular/Semibold/Italic)

---

## 3. Arquitectura Técnica

```
frontend/           → React 18 + TypeScript (GitHub Pages)
supabase/
  functions/
    tcg-api/        → Edge Function principal (Deno)
  migrations/       → Migraciones SQL versionadas
src/                → Scripts Python (sync, import, admin)
scripts/            → Scripts de operación (deploy, sync)
```

### 3.1 Modelos de Datos Principales

**`inventory`** — Stock físico de Geekorium

```sql
id UUID, card_name TEXT, set_code TEXT, collector_number TEXT,
is_foil BOOLEAN, condition TEXT, stock_quantity INTEGER,
store_price DECIMAL(10,2), market_price DECIMAL(10,2),
metadata JSONB, updated_at TIMESTAMPTZ
```

**`orders`** — Leads/checkout

```sql
id UUID, customer_name TEXT, id_number TEXT, whatsapp_number TEXT,
order_total DECIMAL(10,2), items JSONB,
status TEXT ('pending_verification' | 'confirmed' | 'cancelled')
```

**`cards` + `card_printings`** — Catálogo Scryfall

- Las cartas foil son entradas virtuales (no registros separados en DB)
- Foil detectado por `prices.usd_foil IS NOT NULL`
- DFC: imagen de cara frontal via `card_faces[0].image_uris`

---

## 4. Componentes Críticos ("Shielded")

### 4.1 CardModal — Patrón "Controlled Flex"

- **Header**: Sticky, nombre + botón X (44px touch target)
- **Imagen**: `object-contain` + Skeleton loader + DFC flip button
- **Versiones**: Lista scrolleable `max-h-[35vh]`, indica stock vs. encargo
- **Footer activo**: Toggle Normal/Foil, botón "Añadir al carrito"
- **Precios**: Mostrar `market_price` como fallback si stock=0. `S/P` si null.
- ⚠️ **NUNCA** filtrar `all_versions` al cambiar printing. Preservar en estado.

### 4.2 ShoppingCart — State Machine

- Validación de stock en tiempo real (bloquear `+` si `qty >= stock`)
- Persistencia: React Context + localStorage
- Al cargar: verificar si precios cambiaron respecto a DB → notificar usuario

### 4.3 QuickStockPanel — Admin

- Panel flotante para ajuste rápido de stock
- Actualización directa vía Supabase RPC `update_stock`

---

## 5. Checkout (Venta Asistida)

1. **Identificación**: Nombre + Cédula (V/E)
2. **Ubicación**: Dropdown 24 estados de Venezuela (sin USA)
3. **Pago**: Upload de comprobante → `payment-proofs/{order_id}/` en Supabase Storage (captura de cámara móvil habilitada)
4. **WhatsApp Handshake**: Abrir tab con mensaje estructurado al finalizar

---

## 6. Parser de Inventario (ManaBox TXT)

**Formato:** `1x Ad Nauseam (2XM) 076 *F*`

| Campo | Regla |
|---|---|
| Cantidad | Primer entero antes de `x` |
| Nombre | String entre `x` y primer `(` |
| Set Code | String dentro de `()` |
| Collector # | Entero después de `)` |
| Foil | Contiene `*F*`, `(F)` o `Foil` |

**Error handling:** Líneas no parseables → array `failed_imports` → mostrar resumen al usuario.

---

## 7. Estado de Features (Feb 2026)

### ✅ Implementado

- **Almacenamiento Diferencial (Ahorro 75% DB)**: Optimización masiva de `price_history` eliminando 3.7M de filas redundantes. Ingesta de precios ahora es incremental (solo cambios reales).
- **Estabilidad de Aplicación (Defensive Coding)**: Protecciones `Array.isArray()` aplicadas sistemáticamente en todos los componentes que utilizan `.reduce()`.
- Catálogo de cartas con filtros (juego, rareza, color, tipo, set)
- CardModal con selector de versiones, precios dinámicos, foil toggle
- DFC: flip de imagen + links CardKingdom con solo nombre frontal
- Carrito con persistencia localStorage
- Checkout completo (datos + comprobante + WhatsApp)
- Admin panel: órdenes, inventory management, QuickStock
- Bulk import (ManaBox TXT/CSV)
- Símbolos de maná renderizados (mana-font)
- Auth (login/logout)
- Precios de mercado via Scryfall sync

### 🚧 Pendiente / Mejoras

- Swipe-down para cerrar modal en móvil (framer-motion)
- Stale-While-Revalidate para datos de Scryfall
- Virtualización del grid de cartas (performance)
- Dashboard de "cartas más buscadas sin stock" para admin
- Tests unitarios del parser ManaBox
- Responsive images optimizadas

---

## 8. Reglas de Desarrollo

1. **PRD-First**: Todo cambio de funcionalidad documenta su intención aquí antes o durante la implementación.
2. **Build Check**: Antes de push a `frontend/src/`, ejecutar `npm run build` para validar TypeScript.
3. **Sin `any` implícito**: Especialmente en `map`, `filter`, `forEach`.
4. **Defensive Coding Patterns**: Siempre validar que los datos son arreglos usando `Array.isArray()` antes de llamar a métodos como `.reduce()`, `.map()`, o `.filter()` sobre respuestas de la API.
5. **Precios centralizados**: El cálculo de precios ocurre en el backend (Edge Function `tcg-api`), nunca en el cliente.
6. **Consultar `.agent/lessons_learned.md`** antes de tocar lógica de DB, filtros, o el CardModal.

---

*Geekorium — Geeko-Engineering Division*  
*PRDs históricos archivados en `docs/archive/prds/`*
