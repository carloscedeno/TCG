# 🧠 SESSION STATE — TCG Hub

> Agente: leer al INICIO de cada sesión. Actualizar al FINAL antes de cerrar.
> Máximo 60 líneas. Si crece, comprimir.

---

## 📅 Última sesión: 2026-07-04
**Rama activa:** `main` (mezclada desde `dev`)
**Último commit conocido:** feat: forzar limpieza de cache y unregister de Service Workers antiguos al desplegar
**En progreso:** Ninguno — finalizando sesión (finalizado /finalize)

## 📁 Zona Caliente (archivos tocados recientemente)
- frontend/index.html — Limpieza y script de limpieza de caché/Service Workers.
- frontend/src/components/Admin/BulkRarityOfferModal.tsx — Descuentos por rareza dinámicos y opcionales.
- frontend/src/pages/Admin/InventoryPage.tsx — Integración de gameCode en Bulk Modal.
- frontend/src/utils/api.ts — Firma y validaciones de descuento por rareza + fetchDistinctRarities.

## ⏭️ Próxima acción recomendada
Monitorear las implementaciones de descuentos por rareza en el panel administrativo de producción para verificar que funcionen con la carga dinámica de rarezas y sin fecha de finalización.

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
- Corrección de zona horaria de eventos (Caracas UTC-4)
- Checkout E2E + WhatsApp flow
- Bulk Import (cartas y accesorios)
- Sistema de descuentos con fechas NULL
- Carrito unificado (auth + guest)
- Libreta de Direcciones Múltiples (Envío/Facturación)
- Identificadores de jugador TCG (Wizards, Pokémon, Bandai) en perfil
- Filtros y estimaciones de preventa en el historial de órdenes
