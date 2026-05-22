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
| Storage | Supabase Storage (Oculto - Confirmación vía WA) |
| Deploy | Cloudflare Pages (frontend) + Supabase (multi-DB: prod/dev) |
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

- `/prehook` — **Pre-sesión**: anclaje y validación del entorno para evitar pérdida de contexto o desvaríos
- `/audit` — **Post-ejecución**: verificar integridad del sistema (build, git, tests, docs)
- `/compound` — **Post-sesión**: codificar lo aprendido (Compound step)
- `/finalize` — **Cierre de Sesión**: Auditoría, Compound y Push en un solo paso
- `/import` — Implementar y verificar el Bulk Import feature
- `/nightly-sync` — Ejecución autónoma del Carlos AI Framework

## ✅ Features Implementadas (Feb 2026)

- ✅ Catálogo completo con filtros (juego, rareza, color, tipo, set)
- ✅ CardModal: versiones, precios dinámicos, foil toggle, DFC flip
- ✅ CarKingdom links (DFC: solo nombre de cara frontal)
- ✅ Carrito con persistencia localStorage
- ✅ Checkout: datos + reserva de inventario temporal + validación WhatsApp
- ✅ Admin panel: órdenes, gestión de inventario, QuickStock panel
- ✅ Bulk import ManaBox TXT/CSV con reporte de errores y **soporte para acabados Foil/Non-Foil**. Agregación automática de duplicados en lote para garantizar integridad de datos.
- ✅ Símbolos de maná (mana-font)
- ✅ Auth completo (login/logout/session)
- ✅ Precios de mercado via Scryfall sync
- ✅ Soporte foil virtual (detectado por `prices.usd_foil`)
- ✅ **Estabilidad de Aplicación (🛡️ Guardas)**: Implementación masiva de `Array.isArray()` en componentes `.reduce()`. Evita crashes en producción por datos malformados.
- ✅ **Flujo de Pago Diferido**: Eliminación de obligatoriedad de comprobante al checkout.
- ✅ **Fix Precio Normal/Foil (CardDetail)**: Toggle navega al `printing_id` correcto de la variante destino. Badge visual NORMAL/FOIL junto al precio.
- ✅ **Checkout WhatsApp Routing (PRD 2026-03-04)**: Eliminados datos bancarios (Pago Móvil/Zelle). Número WA actualizado a `584242507802`. Mensaje estructurado con detalle de cartas, finish y truncamiento a 40 ítems. Botón renombrado "Confirmar y Pagar por WhatsApp".
- ✅ **Notificaciones por Correo Electrónico**: Implementación de `fastapi-mail` usando SMTP de Hostinger para confirmación a compradores al momento de la orden y notificaciones de nueva venta a la tienda, utilizando `asyncio.create_task` para evitar el bloqueo del API.
- ✅ **Corrección de Branding y Contacto**: Sustitución del nombre en texto por el logo circular oficial (`Logo.png`) en Header, Footer, Home y WelcomeModal. Actualización del favicon oficial. Restauración del enlace `mailto` directo a `info@geekorium.shop` eliminando redirecciones obsoletas a Mailchimp. Sincronización de assets oficiales y eliminación de badges "DEV" hardcodeados.
- ✅ **Estabilización de Checkout y Persistencia de Schema**: Resolución del error "Orden no encontrada". Adición de snapshotting de `product_name` en `order_items`. Configuración de RLS pública para rastreo de pedidos.
- ✅ **Optimización de Storage**: Depreciación del flujo de carga de comprobantes automatizado para preservar cuota de base de datos; transición a flujo manual asistido (WhatsApp).
- ✅ **Multi-Environment & Dynamic IDs**: Refactorización total para usar `VITE_SUPABASE_PROJECT_ID`. Despliegue de entorno DEV en GitHub Pages (`dev.geekorium.shop`) con segregación total de base de datos.
- ✅ **Regla "No Goldfish"**: Priorización absoluta de Card Kingdom sobre la tabla legacy `aggregated_prices` para valoraciones externas.
- ✅ **Simplificación de Precios (Card Kingdom NM)**: Todos los precios de Geekorium se basan exclusivamente en el precio NM de Card Kingdom. El branding original "Geekorium" ha sido preservado integralmente en frontend y notificaciones.
- ✅ **Migración de Precios de Alto Rendimiento**: Implementado backfill de precios mediante CTEs y `UPDATE FROM`.
- ✅ **API Routing Defensivo**: Normalización de rutas en Edge Functions.
- ✅ **Sincronización de Precios Card Kingdom (Foil/Non-Foil)**: Batched updates implementados para evitar timeouts en producción.
- ✅ **Conexión Segura via Supabase Pooler**: Unificación de `DATABASE_URL` para scripts de mantenimiento.
- ✅ **Lógica de Fallback de Precios (TMNT/PZA)**: Implementado matching por `collector_number` + `edition` para sets con Scryfall IDs inconsistentes.
- ✅ **Unificación de Entorno**: Consolidación de todos los archivos `.env` en una única fuente de verdad en la raíz del proyecto.
- ✅ **Soporte "Por Encargo" (On-Demand)**: El sistema ahora permite añadir cartas sin stock al carrito, creándolas automáticamente en la DB con stock 0 si es necesario.
- ✅ **Notificaciones Premium**: Los correos incluyen botones de rastreo funcionales, etiquetas [FOIL] y [POR ENCARGO] dinámicas.
- ✅ **Limpieza de Checkout Success**: Eliminación de campos redundantes y activación del botón de seguimiento integrado.
- ✅ **Sincronización de Credenciales SMTP**: Unificación de nombres de variables (`SMTP_USERNAME`/`SMTP_PASSWORD`) y sincronización de lógica entre las funciones `api` y `tcg-api` para garantizar fiabilidad en las notificaciones.
- ✅ **Visibilidad Condicional de Carrito**: El botón "Añadir al carrito" ahora está oculto por defecto en la vista general (grid/list) y solo es visible en el modal de detalles, mejorando la estética de navegación masiva.
- ✅ **Sincronización de Metadatos Strixhaven**: Reparación de visibilidad de 360+ productos mediante la corrección del trigger `sync_product_metadata` en la base de datos, asegurando que `type_line`, `colors` y `release_date` se propaguen siempre al inventario.
- ✅ **Unificación de Carrito y Sincronización de Descuentos (v62)**: Refactorización total de `fetchCart` para confiar en el RPC del servidor como única fuente de verdad. Implementación de paridad de precios y badges de oferta para carritos de invitados. Resolución de 404s en detalles de accesorios mediante priorización de búsqueda local.
- ✅ **Remediación de Banners y "Cero Fantasma" (v63)**: Restauración de la lógica de filtrado por TCG en `HeroSection` para evitar que banners globales oculten los específicos del juego. Limpieza masiva de artefactos visuales "0" en el grid mediante endurecimiento de lógica booleana en React.
- ✅ **Extrema Performance (Denormalización)**: Eliminación de timeouts mediante denormalización de metadatos (`colors`, `type`, `release_date`) en tabla `products`. RPC `get_products_filtered` optimizado para single-table query.
- ✅ **Consolidación TCG y Branding (Mayo 2026)**: Unificación total de códigos canónicos (`YGO`, `PKM`, `OPC`) eliminando capas de mapeo legacy. Refinado RPC de Artilugios para filtrado estricto por juego.
- ✅ **Sincronización Automática de Catálogo (Bulk Import Recovery)**: Implementación de flujos de recuperación para metadatos faltantes detectados durante importaciones masivas. El sistema ahora identifica y parcha automáticamente sets y cartas inexistentes cruzando datos con la API de Scryfall.
- ✅ **Gestión Avanzada de Descripciones y UX Premium (Mayo 2026)**: Restauración completa de la visibilidad de descripciones para productos y eventos. Implementación de un **Modal de Edición Full** en el panel administrativo, eliminando la edición inline inestable. Optimización de la navegación mediante redirección directa a páginas de detalle y garantía de scroll al inicio (`ScrollToTop`) en cada cambio de ruta.
- ✅ **Prevención de Deadlocks y Concurrencia en Checkout (Mayo 2026)**: Refactorización total del RPC `create_order_atomic` para implementar ordenación canónica por tipo e ID de ítem antes de reservar stock, eliminando interbloqueos mutuos en transacciones simultáneas durante picos de tráfico en producción.
