# AGENTS — Geekorium Project Context & Rules

Este directorio contiene las reglas de arquitectura modular del proyecto. Garantizan consistencia y alta calidad en el output de todos los agentes que trabajan en el sistema.

## 🎯 Objetivo Principal

Geekorium es un **marketplace TCG de venta asistida** para coleccionistas. El objetivo técnico es reducir la fricción entre la selección del producto y la comunicación con el Geeko-Asesor, manteniendo integridad de datos y una UX premium mobile-first.

## 🏗️ Stack Actual (Feb 2026)

| Capa | Tecnología |
| :--- | :--- |
| Frontend | React 18 + TypeScript + Tailwind CSS |
| Backend | Supabase Edge Functions (Deno/TypeScript) |
| Base de Datos | Supabase PostgreSQL |
| Auth | Supabase Auth |
| Storage | Supabase Storage (payment-proofs) |
| Deploy | GitHub Pages (frontend) + Supabase (backend) |
| Scripts Admin | Python 3.12 + scripts/ |

## 📂 Documentación de Referencia

Cargar según la tarea específica:

1. **[PRD Master](../docs/PRD_MASTER.md)** — Fuente de verdad. Estado actual + features pendientes.
2. **[Core Methodology](reference/methodology.md)** — PRD-first, reglas modulares, context resets.
3. **[Frontend Standards](reference/frontend.md)** — React, Tailwind, aesthetics premium.
4. **[Backend & API](reference/api.md)** — Supabase Edge Functions, modelos, business logic.
5. **[Scraper & Data](reference/scrapers.md)** — Calidad de datos, detección de variantes.
6. **[Documentation](reference/documentation.md)** — Gestión del PRD y docs/.
7. **[Lessons Learned](lessons_learned.md)** — Bugs críticos, soluciones, anti-patrones.

## ⚙️ Ciclo de Trabajo — Compounding Engineer

Este proyecto sigue el framework **Compounding Engineer** (Dan Shipper / Every.to).
Cada sesión de trabajo debe completar los 4 pasos:

| Paso | Qué hace el agente |
| :--- | :--- |
| **1. Plan** | Crear `implementation_plan.md`, revisar PRD, pedir aprobación |
| **2. Work** | Ejecutar cambios en código, DB y scripts |
| **3. Review** | Correr tests (`pytest`, Playwright), crear `walkthrough.md` |
| **4. Audit** | Ejecutar `/audit` — verificar integridad: build, git, tests, docs |
| **5. Compound** | Ejecutar `/compound` — codificar lo aprendido en archivos permanentes |

> **Regla de Oro:** Si el conocimiento solo está en el historial de conversación, **no existe**.
> Solo cuenta lo que está escrito en los archivos del repo.

Artefactos del Compound step:

- `.agent/COMPOUND.md` — Log cronológico de lo que se aprendió por sesión
- `.agent/lessons_learned.md` — Base de conocimiento técnico acumulado

---

## 🛠️ Workflows Disponibles

- `/audit` — **Post-ejecución**: verificar integridad del sistema (build, git, tests, docs)
- `/compound` — **Post-sesión**: codificar lo aprendido (Compound step)
- `/import` — Implementar y verificar el Bulk Import feature
- `/nightly-sync` — Ejecución autónoma del framework Strata

## ✅ Features Implementadas (Feb 2026)

- Catálogo completo con filtros (juego, rareza, color, tipo, set)
- CardModal: versiones, precios dinámicos, foil toggle, DFC flip
- CarKingdom links (DFC: solo nombre de cara frontal)
- Carrito con persistencia localStorage
- Checkout: datos + reserva de inventario temporal + validación WhatsApp
- Admin panel: órdenes, gestión de inventario, QuickStock panel
- Bulk import ManaBox TXT/CSV con reporte de errores y **soporte para acabados Foil/Non-Foil**. Agregación automática de duplicados en lote para garantizar integridad de datos.
- Símbolos de maná (mana-font)
- Auth completo (login/logout/session)
- Precios de mercado via Scryfall sync
- Soporte foil virtual (detectado por `prices.usd_foil`)
- **Estabilidad de Aplicación (🛡️ Guardas)**: Implementación masiva de `Array.isArray()` en componentes `.reduce()`. Evita crashes en producción por datos malformados.
- **Flujo de Pago Diferido**: Eliminación de obligatoriedad de comprobante al checkout.
- **✅ Fix Precio Normal/Foil (CardDetail)**: Toggle navega al `printing_id` correcto de la variante destino. Badge visual NORMAL/FOIL junto al precio.
- **✅ Checkout WhatsApp Routing (PRD 2026-03-04)**: Eliminados datos bancarios (Pago Móvil/Zelle). Número WA actualizado a `584242507802`. Mensaje estructurado con detalle de cartas, finish y truncamiento a 40 ítems. Botón renombrado "Confirmar y Pagar por WhatsApp".

## 🚧 Features Pendientes

- Swipe-down cierre modal en móvil
- Stale-While-Revalidate para Scryfall
- Virtualización del grid (performance)
- Dashboard "cartas más buscadas sin stock" (admin)
- Tests unitarios parser ManaBox

## ⚠️ Reglas Críticas del Sistema

1. **Testing Lazy Imports**: Parchear siempre la clase importada desde el módulo de origen (`modulo.Clase`), no desde el importador.

---
*Geekorium — Geeko-Engineering Division | Limpieza: 2026-02-26*
