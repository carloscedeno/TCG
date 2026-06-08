# 🧠 SESSION STATE — TCG Hub

> Agente: leer al INICIO de cada sesión. Actualizar al FINAL antes de cerrar.
> Máximo 60 líneas. Si crece, comprimir.

---

## 📅 Última sesión: 2026-06-08
**Rama activa:** `dev`
**Último commit conocido:** fix de sincronizador de precios en prod
**En progreso:** Ninguno — sesión de setup de workflow

## 📁 Zona Caliente (archivos tocados recientemente)
- `frontend/src/components/Card/Card.tsx` — carrusel de imágenes (pendiente verificar en DEV)
- `frontend/src/utils/api.ts` — sincronizador de precios
- `frontend/src/pages/Admin/AdminDashboard.tsx` — PriceUpdateHistory modal

## ⏭️ Próxima acción recomendada
Verificar visualmente el carrusel de `Card.tsx` en `dev.geekorium.shop` antes del próximo cambio.

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
- Última actualización del grafo: 2026-06-08
- Comando para actualizar: `graphify update frontend/src --no-viz`

## ✅ Features estables (no tocar sin razón)
- Checkout E2E + WhatsApp flow
- Bulk Import (cartas y accesorios)
- Sistema de descuentos con fechas NULL
- Carrito unificado (auth + guest)
