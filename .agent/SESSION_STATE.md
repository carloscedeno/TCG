# 🧠 SESSION STATE — TCG Hub

> Agente: leer al INICIO de cada sesión. Actualizar al FINAL antes de cerrar.
> Máximo 60 líneas. Si crece, comprimir.

---

## 📅 Última sesión: 2026-06-12
**Rama activa:** `dev`
**Último commit conocido:** `feat: user dashboard improvements including player IDs, address book, checkout selection, billing form, and order list/tracking filters with preventa estimated dates`
**En progreso:** Ninguno — finalizando sesión (finalizado `/finalize`)

## 📁 Zona Caliente (archivos tocados recientemente)
- `frontend/src/pages/Profile.tsx` — Perfil y credentials
- `frontend/src/components/Profile/AddressBook.tsx` — Libreta de direcciones CRUD
- `frontend/src/components/Profile/ProfileSettingsModal.tsx` — Configuración de perfil y contraseña
- `frontend/src/pages/CheckoutPage.tsx` — Integración de direcciones guardadas y facturación
- `frontend/src/components/Profile/OrdersList.tsx` — Filtros de órdenes y estimación de preventas
- `frontend/src/utils/api.ts` — CRUD de direcciones y endpoints de clave
- `supabase/migrations/20260612000000_user_dashboard_improvements.sql` — Estructura de BD

## ⏭️ Próxima acción recomendada
Monitorear retroalimentación del usuario y jefe en `dev.geekorium.shop` sobre las mejoras del Dashboard y Libreta de Direcciones.

## 🚫 Restricciones activas
- NO usar `npm` — solo `pnpm`
- NO modificar PROD sin backup explícito
- NO tocar `create_order_atomic` RPC sin migration
- Entorno DEV: proyecto Supabase `bqfkqnnostzaqueujdms`
- Entorno PROD: proyecto Supabase `sxuotvogwvmxuvwbsscv`

## 🗺️ Knowledge Graph
- Graphify instalado: ✅ `graphify 0.8.35`
- Grafo construido: ✅ `graphify-out/graph.json` (299 nodos, 595 aristas, 11 comunidades)
- God nodes: `useAuth()` (29 aristas), `useCart()` (17 aristas), `CardProps` (7 aristas)
- Última actualización del grafo: 2026-06-12 (mediante post-commit hook)
- Comando para actualizar: `graphify update frontend/src --no-viz`

## ✅ Features estables (no tocar sin razón)
- Checkout E2E + WhatsApp flow
- Bulk Import (cartas y accesorios)
- Sistema de descuentos con fechas NULL
- Carrito unificado (auth + guest)
- Libreta de Direcciones Múltiples (Envío/Facturación)
- Identificadores de jugador TCG (Wizards, Pokémon, Bandai) en perfil
- Filtros y estimaciones de preventa en el historial de órdenes

