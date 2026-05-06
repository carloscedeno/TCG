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
- `/finalize` — **Cierre de Sesión**: Auditoría, Compound y Push en un solo paso
- `/import` — Implementar y verificar el Bulk Import feature
- `/nightly-sync` — Ejecución autónoma del framework Strata

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
- ✅ **Extrema Performance (Denormalización)**: Eliminación de timeouts mediante denormalización de metadatos (`colors`, `type`, `release_date`) en tabla `products`. RPC `get_products_filtered` optimizado para single-table query.
- ✅ **Comprobante PDF Real**: `CheckoutSuccessPage` genera un HTML de recibo completo (Inter font, tabla itemizada, datos del cliente, ID de orden, total, status) en una nueva pestaña que auto-dispara el diálogo de impresión. Sin librerías externas.
- ✅ **WhatsApp Itemizado (Restaurado)**: El mensaje de WhatsApp incluye línea por carta (`• Qty x Nombre [SET] [FINISH] - $Total`) con límite de 40 ítems y overflow note. Los datos del cliente ahora se pasan vía `navigate()` state.
- ✅ **Frontend Request Cancellation**: Implementación de `AbortController` en `Home.tsx` para cancelar peticiones de red obsoletas durante el filtrado.
- ✅ **Detalles del Comprador en Admin**: El panel de órdenes ahora muestra Nombre, Teléfono, Email y Dirección completa (priorizando datos de invitado y envío).
- ✅ **Ocultamiento de Sección Archivo**: Removida la pestaña de histórico para simplificar la UX. El sistema ahora opera exclusivamente sobre el inventario vivo (Marketplace).
- ✅ **Version 1.0 Baseline**: Creación de rama estable `v1.0-productiva` para preservar features apagadas.
- ✅ **Limpieza de Repositorio (Garbage Removal)**: Eliminación de más de 70 scripts de depuración, logs y archivos temporales redundantes para mejorar la mantenibilidad.
- ✅ **Alineación de IDs de Fuentes**: Estandarización de IDs de mercado (17: Card Kingdom, 16: TCGplayer) para integridad del historial de precios.
- ✅ **Pricing Integrity & SKU Sync (v52)**: Resolución de contaminación global de precios. Implementación de mapeo basado en SKU para CardKingdom (soporte prefijo `F` y números de coleccionista).
- ✅ **Optimización de Batch SQL (Ley 18)**: Aplicación de actualizaciones masivas mediante el patrón `VALUES` table, reduciendo tiempos de horas a segundos.
- ✅ **Gestión de Accesorios (Accessories Management)**: Módulo completo de administración de accesorios con soporte para imágenes (`public_assets`), historial de auditoría y vitrina dinámica en el marketplace.
- ✅ **Resolución Dinámica de Juegos**: Eliminación de IDs hardcodeados para garantizar compatibilidad entre entornos DEV y PROD.
- ✅ **Checkout Polimórfico (Products & Accessories)**: Soporte nativo para pedidos mixtos en una sola transacción atómica, con recuperación defensiva de IDs en el frontend y validación de integridad en el RPC.
- ✅ **Rastreo de Pedidos Público**: Implementación de políticas RLS para rastreo por ID (invitados/auth).
- ✅ **Importación Masiva de Inventario (Accesorios)**: Carga de 164+ artículos mediante script automatizado con mapeo dinámico.
- ✅ **Soporte para Precios de Alto Valor ($1,000,000)**: Actualización de filtros para artículos de colección premium.
- ✅ **Filtrado Inclusivo de Accesorios Genéricos**: Los productos sin `game_id` son visibles en todos los contextos de juego.
- ✅ **Omni-TCG Architecture (v1.0)**: Soporte nativo para múltiples juegos (Pokémon, One Piece, Digimon, etc.) con validación polimórfica vía JSONB y triggers de integridad.
- ✅ **Estandarización de Juegos (Ley 26)**: Unificación de códigos de franquicia (`PKM`, `OPC`, `DGM`, `FAB`, `GND`, `RFB`) y eliminación de duplicados en la base de datos.
- ✅ **RPC Integrity & Overload Cleaning**: Limpieza quirúrgica de funciones Postgres para evitar ambigüedad (`PGRST203`) y asegurar filtrado exacto por TCG. Implementación de limpieza dinámica via `pg_proc`.
- ✅ **Filtro "Nuevo" Restaurado**: Sincronización de la lógica `p_only_new` entre base de datos, API y Frontend con botón de acceso premium en la barra de navegación.
- ✅ **Centralized UX Navigation**: Sincronización reactiva de URL y menús para navegación fluida entre Marketplace y Catálogo por juego.
- ✅ **Visibilidad de Ofertas en Inventario (Singles)**: Implementación de columnas de descuento y fechas de expiración en la tabla de inventario administrativo para cartas, con renderizado Null-Safe para evitar crashes durante el ordenamiento.
- ✅ **Saneamiento Masivo de Credenciales (v55)**: Remediación total de un incidente de seguridad crítico. Eliminación de contraseñas hardcodeadas en más de 60 scripts y parametrización vía `os.getenv`. Actualización de `.gitignore` global y eliminación de archivos de texto con credenciales (`prod_credentials.txt`).
- ✅ **Estabilización de Precios en Producción (v56)**: Reparación de discrepancias masivas mediante sincronización atómica SQL. Procesamiento de 148,000+ precios y actualización de 38,000+ cartas sin timeouts.
- ✅ **Hardening de CI/CD (Omni-Sync)**: Inyección de secretos de producción en GitHub Actions y refactorización de `common/db.py` para aislamiento total de entornos.
- ✅ **Integración de Logos TCG (Premium)**: Sustitución de emojis por assets PNG estandarizados (`color` y `black`) en landing, header y administración. Implementación de leyes de respiración visual para evitar clipping en animaciones de escala.

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
6. **WhatsApp = Canal Operacional Primario**: El mensaje de WhatsApp en el checkout SIEMPRE debe incluir el detalle por carta (nombre, cantidad, set, finish, subtotal). Nunca simplificar a conteos agregados. (Lección #86)
7. **Sincronización SKU-Aware**: Los scripts de sincronización con CardKingdom deben priorizar el SKU (`[F]SET-NNNN`) sobre el campo `variation` para sets modernos y tokens para garantizar un mapeo 100% exacto de acabados y coleccionistas.
8. **RLS de Rastreo**: El acceso de lectura a `orders` y `order_items` debe permitirse para el rol `anon` basado en el conocimiento del UUID de la orden para habilitar el rastreo de invitados.
9. **Prohibición de Hardcoding de Conexiones**: Nunca escribir URLs `postgresql://` o contraseñas directamente en el código. Toda conexión debe pasar por `os.getenv`. (Ley 21).
10. **Null-Safe Price Rendering**: Todo renderizado de precios y descuentos en interfaces administrativas DEBE usar fallbacks `(val || 0)` antes de formatear para prevenir fallos fatales por datos incompletos. (Lección #151)

---

## 🛡️ Footer

*Geekorium — Geeko-Engineering Division | Limpieza: 2026-03-23*

### ? Soporte Multi-Imagen y Carrusel Premium (Mayo 2026)
- **Prop�sito**: Permitir que los administradores suban m�ltiples fotos por producto y que los usuarios disfruten de una experiencia de visualizaci�n inmersiva.
- **Implementaci�n**: Sistema de galer�a en Admin + AnimatePresence de Framer Motion en el modal de detalles.
- **Estatus**: ? Implementado (Compound v58).

