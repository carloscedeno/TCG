# 🏰 Geekorium — Developer Knowledge Hub & Obsidian Vault

> **Bienvenido a tu Segundo Cerebro (PKM) de Ingeniería para Geekorium.**
> Esta bóveda de Obsidian está optimizada para maximizar tu velocidad de desarrollo, claridad arquitectónica y colaboración con agentes de IA.

---

## 🧭 Mapa de Navegación Rápida (MOCs)

`
                       ┌─────────────────────────┐
                       │  Geekorium Vault Hub    │
                       └────────────┬────────────┘
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  01. Arquitectura│      │  02. Reglas Oro  │      │  03. Flujos & UX │
│  & Base de Datos │      │ & Guías Maestras │      │   (Check/Admin)  │
└──────────────────┘      └──────────────────┘      └──────────────────┘
         │                          │                          │
         ▼                          ▼                          ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  04. Dev Logs &  │      │  05. ADRs &      │      │  06. Patrones &  │
│  Daily Notes     │      │      Specs       │      │   Buenas Prác.   │
└──────────────────┘      └──────────────────┘      └──────────────────┘
`

---

## ⚡ 1. Núcleo del Proyecto & Reglas de Oro

- 📜 **[[LEYES_DEL_SISTEMA]]**: Leyes inmutables de consistencia, tipos, migraciones e integridad.
- 🚀 **[[INICIO_RAPIDO]]**: Comandos diarios para levantar frontend, sync y base de datos.
- 🏗️ **[[PROJECT_STRUCTURE]]**: Estructura de carpetas, frontend, backend y scripts.
- 📖 **[[README]]**: Visión general del marketplace TCG y tech stack.
- 📈 **[[PROGRESS]]**: Bitácora de hitos completados y pendientes técnicos.
- 💡 **[[docs/lessons_learned|Lecciones Aprendidas]]**: Historial de errores pasados para no repetirlos.

---

## 🏛️ 2. Arquitectura, Datos y Backend

- 🗄️ **Base de Datos & Supabase**:
  - `supabase/migrations/`: Historial de migraciones SQL versionadas.
  - `supabase/functions/tcg-api/`: Edge function unificada en Deno/TS.
  - [[docs/database/]]: Documentación de esquemas, índices y RLS.
- 🌐 **Frontend (React 18 + TS + Tailwind)**:
  - `frontend/src/components/`: Catálogo, CardModal, Carrito, Checkout, Admin.
  - `frontend/src/utils/api.ts`: Cliente de conexión tipado con Supabase.
- 🔄 **Scripts & Sync Scrapers (Python)**:
  - `src/`: Scrapers de Scryfall / TCGPlayer y sincronizadores de stock/precios.
  - [[HANDOVER_PRICING]]: Mecánica de cálculo de precios y conversiones.
- 🗺️ **Grafo AST de Código**:
  - [[docs/architecture/Graphify_Code_Map|Mapa de Código & Comunidades Graphify]]: Puente entre el análisis AST de 5,400+ nodos y la arquitectura del proyecto.
  - [[graphify-out/GRAPH_REPORT.md|Graph Report Completo de Graphify]].

---

## 🎨 3. Flujos de Usuario, Negocio y PRDs

- 🛒 [[docs/flujo_checkout_corregido|Flujo de Checkout]]: Paso a paso de compra, comprobante y WhatsApp handshake.
- 📦 [[docs/Flujos_BPMN_Geeko|Diagramas BPMN]]: Procesos de negocio e inventario.
- 📋 [[docs/PRD_MASTER|PRD Master]]: Requerimientos funcionales globales.
- 🚀 [[docs/specs/SPEC-2026-CORE-UPGRADE|Spec Maestro: Gran Evolución 2026]]: Hoja de ruta para DB, Odoo, Multi-TCG, Eventos y UI/UX (en `dev`).
- 👥 [[docs/PRD_COMUNIDADES_Y_RANKINGS|PRD Comunidades & Rankings]]: Módulo social y torneos.
- 🛡️ [[GUIA_ADMINISTRACION|Guía de Administración]]: Gestión de órdenes, QuickStock e inventario.
- 📍 [[docs/reference/ESTRUCTURA_UBICACION_FISICA_SINGLES|Ubicación Física de Singles]]: Estándar de coordenadas de estanterías, ficheros, carpetas e ingestión.

---

## 🛠️ 4. Sistema de Trabajo con Obsidian (Tu Flujo Diario)

- 📖 **[[docs/user-guides/GUIA_OBSIDIAN_DEV|Guía Completa de Obsidian para Devs]]**: Flujo diario, plugins recomendados y atajos.

| Actividad | Cómo hacerlo en Obsidian | Plantilla / Destino |
| :--- | :--- | :--- |
| **Bitácora Diaria** | `Ctrl + P` -> *Daily Notes: Open today's note* | `docs/daily-logs/` (Plantilla diaria) |
| **Registrar un Bug** | Crear nota con `Ctrl + P` -> *Templates: Insert template* | `docs/incident_reports/` (`bug-investigation-template`) |
| **Decisión de Diseño** | Registrar nuevo ADR de arquitectura | `docs/architecture/adr/` (`architecture-decision-record-template`) |
| **Nuevo Feature** | Crear especificación técnica / PRD | `docs/specs/` (`feature-spec-template`) |
| **Patrón Reutilizable** | Documentar patrón o snippet canónico | `docs/patterns/` (`code-pattern-template`) |

---

## 🧠 5. Sinergia con IA y Graphify

1. **Memoria Aumentada**: Durante nuestras sesiones de programación en Antigravity / Cursor, usamos estas notas como fuente de verdad y contexto directo.
2. **Graph View (`Ctrl + G`)**: Abre la vista de grafo en Obsidian para visualizar todas las conexiones entre PRDs, ADRs, módulos de código y base de datos.
3. **Canvas de Arquitectura**: Crea un archivo `.canvas` dentro de Obsidian para diseñar esquemas visuales arrastrando notas, diagramas Mermaid y archivos.
