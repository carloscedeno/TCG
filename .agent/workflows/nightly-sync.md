---
description: Workflow para ejecución autónoma del framework (Strata) y validación del PRD mientras el usuario descansa.
---

// turbo-all

# /nightly-sync: Framework & PRD Autonomous Execution

Este workflow permite que el agente opere de forma 100% autónoma, auto-aceptando comandos para mantener el sistema actualizado, verificado y alineado con el PRD.

## 1. Preparación del Entorno

- Verificar que las variables de entorno estén cargadas.
- Limpiar caches de testing: `rm -rf .pytest_cache`.
- Asegurar que la conexión con el servidor MCP y Supabase esté activa.

## 2. Ejecución del Framework (Data & Logic)

- **Sincronización de Precios**: Ejecutar el motor de sincronización de CardKingdom.
  - Command: `python scripts/sync_cardkingdom_api.py`
- **Saneamiento de Datos**: Ejecutar reparaciones de base de datos pendientes.
  - Command: `python scripts/fix_missing_prices.py`

## 3. Validación de Salud (PRD Compliance)

- **API Health**: Correr suite de verificación de endpoints.
  - Command: `python check_api_health.py`
- **Product Health**: Verificar integridad de precios y stock.
  - Command: `python check_products_health.py`
- **Regression Testing**: Ejecutar pruebas de integración de Supabase.
  - Command: `python tests/verify_supabase_functions.py`

## 4. Análisis de Progreso del PRD

- Leer `PRD.md` y `PLAN.md`.
- Identificar la siguiente tarea lógica (ej. Task 2.2: Printing Matcher AI).
- **Auto-Implementación (Safe Mode)**: Si hay bugs menores detectados en los logs, el agente debe corregirlos y verificar el fix.

## 5. Persistencia y Reporte (Top 1% Engineering)

- **Git Sync**: Guardar todo el progreso y logs.
  - Command: `git add . && git commit -m "🤖 Nightly Autonomous Sync: Data updated & PRD verified" && git push origin main`
- **Morning Summary**: Crear o actualizar `SESION_COMPLETADA.md` con un resumen ejecutivo de lo realizado.

## 6. Finalización

- Cerrar todas las terminales activas.
- Dejar el sistema en un estado equilibrado para la revisión matutina.
