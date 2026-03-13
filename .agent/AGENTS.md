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
- **✅ Notificaciones por Correo Electrónico**: Implementación de `fastapi-mail` usando SMTP de Hostinger para confirmación a compradores al momento de la orden y notificaciones de nueva venta a la tienda, utilizando `asyncio.create_task` para evitar el bloqueo del API.
81: - **✅ Corrección de Branding y Contacto**: Sustitución del nombre en texto por el logo circular oficial (`Logo.png`) en Header, Footer, Home y WelcomeModal. Actualización del favicon oficial. Restauración del enlace `mailto` directo a `info@geekorium.shop` eliminando redirecciones obsoletas a Mailchimp. Sincronización de assets oficiales y eliminación de badges "DEV" hardcodeados.
- **✅ Estabilización de Checkout y Persistencia de Schema**: Resolución del error "Orden no encontrada". Adición de snapshotting de `product_name` en `order_items`. Configuración de RLS pública para rastreo de pedidos.
- **✅ Optimización de Storage**: Depreciación del flujo de carga de comprobantes automatizado para preservar cuota de base de datos; transición a flujo manual asistido (WhatsApp).
- **✅ Multi-Environment & Dynamic IDs**: Refactorización total para usar `VITE_SUPABASE_PROJECT_ID`. Despliegue de entorno DEV en GitHub Pages (`dev.geekorium.shop`) con segregación total de base de datos.
- **✅ Regla "No Goldfish"**: Priorización absoluta de Card Kingdom sobre la tabla legacy `aggregated_prices` para valoraciones externas.
- **✅ Simplificación de Precios (Card Kingdom NM)**: Todos los precios de Geekorium se basan exclusivamente en el precio NM de Card Kingdom. El branding original "Geekorium" ha sido preservado integralmente en frontend y notificaciones.
- ✅ Migración de Precios de Alto Rendimiento: Implementado backfill de precios mediante CTEs y `UPDATE FROM`.
- ✅ API Routing Defensivo: Normalización de rutas en Edge Functions.
- ✅ Sincronización de Precios Card Kingdom (Foil/Non-Foil): Batched updates implementados para evitar timeouts en producción.
- ✅ Conexión Segura via Supabase Pooler: Unificación de `DATABASE_URL` para scripts de mantenimiento.
- ✅ Lógica de Fallback de Precios (TMNT/PZA): Implementado matching por `collector_number` + `edition` para sets con Scryfall IDs inconsistentes.
- ✅ Unificación de Entorno: Consolidación de todos los archivos `.env` en una única fuente de verdad en la raíz del proyecto.
- ✅ **Soporte "Por Encargo" (On-Demand)**: El sistema ahora permite añadir cartas sin stock al carrito, creándolas automáticamente en la DB con stock 0 si es necesario.
- ✅ **Notificaciones Premium**: Los correos incluyen botones de rastreo funcionales, etiquetas [FOIL] y [POR ENCARGO] dinámicas.
- ✅ **Limpieza de Checkout Success**: Eliminación de campos redundantes y activación del botón de seguimiento integrado.
- ✅ **Sincronización de Credenciales SMTP**: Unificación de nombres de variables (`SMTP_USERNAME`/`SMTP_PASSWORD`) y sincronización de lógica entre las funciones `api` y `tcg-api` para garantizar fiabilidad en las notificaciones.

- ✅ **Extrema Performance (Denormalización)**: Eliminación de timeouts mediante denormalización de metadatos (`colors`, `type`, `release_date`) en tabla `products`. RPC `get_products_filtered` optimizado para single-table query.
- ✅ **Frontend Request Cancellation**: Implementación de `AbortController` en `Home.tsx` para cancelar peticiones de red obsoletas durante el filtrado.

- ✅ **Detalles del Comprador en Admin**: El panel de órdenes ahora muestra Nombre, Teléfono, Email y Dirección completa (priorizando datos de invitado y envío).
- ✅ **Saneamiento Automático de Precios**: Implementado script de barrido que identifica y corrige productos con precio $0.00 usando metadata de mercado.

## 🚧 Features Pendientes

- Swipe-down cierre modal en móvil
- Stale-While-Revalidate para Scryfall
- Virtualización del grid (performance)
- Dashboard "cartas más buscadas sin stock" (admin)
- Tests unitarios parser ManaBox

## ⚠️ Reglas Críticas del Sistema

1. **Testing Lazy Imports**: Parchear siempre la clase importada desde el módulo de origen (`modulo.Clase`), no desde el importador.
2. **Estrategia de Branching Obligatoria**: Todo cambio debe integrarse en `dev` para validación en el entorno de "Preview" de Cloudflare antes de ser mergeado a `main` para producción.
3. **Segregación de Bases de Datos**: Uso obligatorio de proyectos Supabase independientes para `dev` y `main`, gestionados vía Cloudflare Environment Overrides.
4. **Prioridad de Datos del Comprador**: No intentar joins con `profiles` para obtener el email; usar siempre `guest_info` o `shipping_address` en `orders`.
5. **Cero Tolerancia a Precio 0**: Todo producto activo en inventario debe tener un precio mayor a 0 o fallback manual al mercado.

---

## 🛡️ Footer

*Geekorium — Geeko-Engineering Division | Limpieza: 2026-03-13*
