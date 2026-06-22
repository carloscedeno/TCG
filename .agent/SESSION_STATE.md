# 🧠 SESSION STATE — TCG Hub

> Agente: leer al INICIO de cada sesión. Actualizar al FINAL antes de cerrar.
> Máximo 60 líneas. Si crece, comprimir.

---

## 📅 Última sesión: 2026-06-22
**Rama activa:** `dev`
**Último commit conocido:** 🧠 compound: Sincronización Scryfall y Dinamización de Novedades
**En progreso:** Ninguno — finalizando sesión (finalizado /finalize)

## 📁 Zona Caliente (archivos tocados recientemente)
- get_products_filtered (RPC Supabase) — Actualización del filtro p_only_new a 14 días
- sets (Tabla Supabase) — Creación del constraint UNIQUE (game_id, set_code)
- data/loaders/load_mtgs_sets_from_scryfall.py — Ejecución de importación de sets
- data/loaders/load_mtgs_cards_from_scryfall.py — Importación de 1795 cartas recientes (Marvel)

## ⏭️ Próxima acción recomendada
Monitorear la carga y visualización de eventos tanto en el panel de administrador como en el TournamentHub para validar que sigan mostrando la hora exacta de Caracas (local) de forma consistente.

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
