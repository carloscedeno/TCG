# ADR-002: Arquitectura Tripartita de Inventario (Web -> SortSwift -> Odoo)

**Fecha**: 2026-11-07
**Estado**: 🟢 Aceptado
**Autores**: Dev Team & AI Copilot
**Tags**: #adr #architecture #inventory #sortswift #odoo #tcg-app

---

## 📋 Contexto y Problema
Geekorium opera con tres capas de inventario físico y digital:
1. **Tienda Web (Geekorium Web / Supabase)**: Catálogo mobile-first de cara al usuario coleccionista, con precios dinámicos Scryfall/CardKingdom y reservas de carrito.
2. **SortSwift**: Sistema WMS y clasificador robótico de almacenamiento físico granular en gavetas (`bin`, `binPosition`, `warehouse`), tracking por copia física (`raw-card`).
3. **Odoo ERP**: Sistema de contabilidad, facturación, clientes y Punto de Venta (POS) en mostrador para ventas directas físicas.

El reto era definir la autoridad rectora del flujo para evitar sobreventas, interbloqueos y pérdidas de trazabilidad en las gavetas físicas al combinar ventas por la web con ventas directas de mostrador.

---

## 🎯 Criterios de Decisión
- **Autoridad Rectora Única**: La tienda Web gobierna el ciclo de compra de coleccionistas. Odoo factura y SortSwift resguarda la copia física.
- **Prevención de Sobrevendidos (Zero Oversell)**: Bloqueo inmediato en Web y reserva física temporal (Hold) en SortSwift de 60 minutos durante la confirmación por WhatsApp.
- **Idempotencia y Resiliencia**: Los webhooks de Odoo no deben sobreescribir ni destruir metadatos de reserva originados en la web.
- **Trazabilidad de Almacén**: Conocimiento exacto de en qué gaveta física está cada single para su pick-and-pack expedito.

---

## ⚖️ Opciones Consideradas

### Opción A: Odoo como Autoridad Central Absoluta
- *Pros*: Odoo centraliza todas las transacciones antes de impactar inventarios.
- *Contras*: Añade latencia masiva en el checkout web. Si Odoo tarda en responder o sus webhooks fallan, el usuario web queda bloqueado. Riesgo de sobreescritura de metadatos finos de singles (acabados foil/non-foil, condiciones NM/LP, IDs de escaneo SortSwift).

### Opción B: Flujo Tripartito Dirigido por la Web (Elegida)
- *Pros*:
  - **La Web dirige**: al hacer click en checkout, la base de datos bloquea el stock web y dispara en paralelo la creación del pedido en Odoo y el hold de 60 minutos en SortSwift (`raw-card-reservations`).
  - **Odoo valida**: cuando el cliente paga (vía WhatsApp/Factura) o se entrega el producto (`stock.picking`), Odoo notifica a Supabase Edge Function (`odoo-webhook`), ejecutando el **commit permanente** en SortSwift (removiendo la carta física de la gaveta).
  - **Cancelación segura**: si el pedido expira o se anula, el webhook libera el hold en SortSwift sin alterar el resto del inventario.
  - **Venta de mostrador (POS)**: si un cliente compra en mostrador físico, Odoo valida la entrega (`stock.picking.done`) y el webhook descuenta automáticamente tanto en web como en SortSwift.
- *Contras*: Requiere coordinación bidireccional mediante Edge Functions y manejo cuidadoso de condiciones de carrera en webhooks.

---

## 🚀 Decisión Elegida y Justificación
Se adoptó la **Opción B**. La Web es la autoridad del flujo comercial:
$$\text{Web Order} \longrightarrow \text{Hold SortSwift (60 min)} + \text{Creación SO Odoo} \xrightarrow{\text{Pago/Entrega}} \text{Commit Físico en SortSwift}$$

---

## 💥 Consecuencias e Impacto

### 🗄️ Base de Datos (Supabase)
- **`products`**: Agregadas columnas `sortswift_id (TEXT)`, `warehouse (TEXT)`, `bin (TEXT)`, `bin_position (INT)`, `cost (NUMERIC)`.
- **`order_items`**: Agregada columna `sortswift_reservation_id (TEXT NULL)` con índice dedicado para registrar el token de hold de SortSwift durante la orden.

### ⚡ Edge Functions (Deno / TS)
- **`_shared/sortswift.ts`**: Módulo canónico que implementa `reserveSortSwiftCard`, `commitSortSwiftReservation`, `releaseSortSwiftReservation` y `deductSortSwiftDirectSale`.
- **`odoo-sync`**: Al crear la Sales Order en Odoo, busca si los productos tienen `sortswift_id` y crea la reserva en SortSwift, persistiendo el `sortswift_reservation_id` en `order_items`.
- **`odoo-webhook`**:
  - Aislada la reconstrucción de `order_items` solo a pedidos nativos de Odoo (`if (!webOrderId)`). Los pedidos web preservan sus items y reservas intactos.
  - Al marcar factura pagada (`account.move.paid`) o entrega realizada (`stock.picking.done`), se invoca `processSortSwiftOrderCommit(false)`.
  - Al cancelar o reembolsar, se invoca `processSortSwiftOrderCommit(true)`.

### 🐍 Scripts & Tests (Python)
- **`SortSwiftClient`**: Cliente robusto en `scripts/sync/common/sortswift_client.py` con reintentos Tenacity y métodos de reserva/commit/deducción.
- **Suite E2E**: `scripts/tests/e2e_full_checkout_sortswift_test.py` con 3 tests automáticos que validan:
  1. Web Checkout $\to$ Hold $\to$ Odoo Confirm $\to$ Commit SortSwift.
  2. Web Checkout $\to$ Hold $\to$ Cancelación Odoo $\to$ Release SortSwift.
  3. Venta directa POS mostrador $\to$ Deducción directa SortSwift.

---

## 🔗 Referencias Cruzadas
- [[00 - Geekorium Vault Hub|Vault Hub]]
- [[docs/daily-logs/2026-11-07|Daily Log 2026-11-07]]
- [[docs/reference/ESTRUCTURA_UBICACION_FISICA_SINGLES|Estructura de Ubicación Física]]
- [[LEYES_DEL_SISTEMA|Leyes del Sistema]]
