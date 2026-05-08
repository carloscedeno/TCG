# AGENTS â€” Geekorium Project Context & Rules

Este directorio contiene las reglas de arquitectura modular del proyecto. Garantizan consistencia y alta calidad en el output de todos los agentes que trabajan en el sistema.

## ðŸŽ¯ Objetivo Principal

Geekorium es un **marketplace TCG de venta asistida** para coleccionistas. El objetivo tÃ©cnico es reducir la fricciÃ³n entre la selecciÃ³n del producto y la comunicaciÃ³n con el Geeko-Asesor, manteniendo integridad de datos y una UX premium mobile-first.

## ðŸ—ï¸ Stack Actual (Feb 2026)

| Capa | TecnologÃ­a |
| :--- | :--- |
| Frontend | React 18 + TypeScript + Tailwind CSS |
| Backend | Supabase Edge Functions (Deno/TypeScript) |
| Base de Datos | Supabase PostgreSQL |
| Auth | Supabase Auth |
| Storage | Supabase Storage (Oculto - ConfirmaciÃ³n vÃ­a WA) |
| Deploy | Cloudflare Pages (frontend) + Supabase (multi-DB: prod/dev) |
| Scripts Admin | Python 3.12 + scripts/ |

## ðŸ“‚ DocumentaciÃ³n de Referencia

Cargar segÃºn la tarea especÃ­fica:

1. **[PRD Master](../docs/PRD_MASTER.md)** â€” Fuente de verdad. Estado actual + features pendientes.
2. **[Core Methodology](reference/methodology.md)** â€” PRD-first, reglas modulares, context resets.
3. **[Frontend Standards](reference/frontend.md)** â€” React, Tailwind, aesthetics premium.
4. **[Backend & API](reference/api.md)** â€” Supabase Edge Functions, modelos, business logic.
5. **[Scraper & Data](reference/scrapers.md)** â€” Calidad de datos, detecciÃ³n de variantes.
6. **[Documentation](reference/documentation.md)** â€” GestiÃ³n del PRD y docs/.
7. **[Lessons Learned](lessons_learned.md)** â€” Bugs crÃ­ticos, soluciones, anti-patrones.

## âš™ï¸ Ciclo de Trabajo â€” Compounding Engineer

Este proyecto sigue el framework **Compounding Engineer** (Dan Shipper / Every.to).
Cada sesiÃ³n de trabajo debe completar los 4 pasos:

| Paso | QuÃ© hace el agente |
| :--- | :--- |
| **1. Plan** | Crear `implementation_plan.md`, revisar PRD, pedir aprobaciÃ³n |
| **2. Work** | Ejecutar cambios en cÃ³digo, DB y scripts |
| **3. Review** | Correr tests (`pytest`, Playwright), crear `walkthrough.md` |
| **4. Audit** | Ejecutar `/audit` â€” verificar integridad: build, git, tests, docs |
| **5. Compound** | Ejecutar `/compound` â€” codificar lo aprendido en archivos permanentes |

> **Regla de Oro:** Si el conocimiento solo estÃ¡ en el historial de conversaciÃ³n, **no existe**.
> Solo cuenta lo que estÃ¡ escrito en los archivos del repo.

Artefactos del Compound step:

- `.agent/COMPOUND.md` â€” Log cronolÃ³gico de lo que se aprendiÃ³ por sesiÃ³n
- `.agent/lessons_learned.md` â€” Base de conocimiento tÃ©cnico acumulado

---

## ðŸ› ï¸ Workflows Disponibles

- `/audit` â€” **Post-ejecuciÃ³n**: verificar integridad del sistema (build, git, tests, docs)
- `/compound` â€” **Post-sesiÃ³n**: codificar lo aprendido (Compound step)
- `/finalize` â€” **Cierre de SesiÃ³n**: AuditorÃ­a, Compound y Push en un solo paso
- `/import` â€” Implementar y verificar el Bulk Import feature
- `/nightly-sync` â€” EjecuciÃ³n autÃ³noma del framework Strata

## âœ… Features Implementadas (Feb 2026)

- âœ… CatÃ¡logo completo con filtros (juego, rareza, color, tipo, set)
- âœ… CardModal: versiones, precios dinÃ¡micos, foil toggle, DFC flip
- âœ… CarKingdom links (DFC: solo nombre de cara frontal)
- âœ… Carrito con persistencia localStorage
- âœ… Checkout: datos + reserva de inventario temporal + validaciÃ³n WhatsApp
- âœ… Admin panel: Ã³rdenes, gestiÃ³n de inventario, QuickStock panel
- âœ… Bulk import ManaBox TXT/CSV con reporte de errores y **soporte para acabados Foil/Non-Foil**. AgregaciÃ³n automÃ¡tica de duplicados en lote para garantizar integridad de datos.
- âœ… SÃ­mbolos de manÃ¡ (mana-font)
- âœ… Auth completo (login/logout/session)
- âœ… Precios de mercado via Scryfall sync
- âœ… Soporte foil virtual (detectado por `prices.usd_foil`)
- âœ… **Estabilidad de AplicaciÃ³n (ðŸ›¡ï¸ Guardas)**: ImplementaciÃ³n masiva de `Array.isArray()` en componentes `.reduce()`. Evita crashes en producciÃ³n por datos malformados.
- âœ… **Flujo de Pago Diferido**: EliminaciÃ³n de obligatoriedad de comprobante al checkout.
- âœ… **Fix Precio Normal/Foil (CardDetail)**: Toggle navega al `printing_id` correcto de la variante destino. Badge visual NORMAL/FOIL junto al precio.
- âœ… **Checkout WhatsApp Routing (PRD 2026-03-04)**: Eliminados datos bancarios (Pago MÃ³vil/Zelle). NÃºmero WA actualizado a `584242507802`. Mensaje estructurado con detalle de cartas, finish y truncamiento a 40 Ã­tems. BotÃ³n renombrado "Confirmar y Pagar por WhatsApp".
- âœ… **Notificaciones por Correo ElectrÃ³nico**: ImplementaciÃ³n de `fastapi-mail` usando SMTP de Hostinger para confirmaciÃ³n a compradores al momento de la orden y notificaciones de nueva venta a la tienda, utilizando `asyncio.create_task` para evitar el bloqueo del API.
- âœ… **CorrecciÃ³n de Branding y Contacto**: SustituciÃ³n del nombre en texto por el logo circular oficial (`Logo.png`) en Header, Footer, Home y WelcomeModal. ActualizaciÃ³n del favicon oficial. RestauraciÃ³n del enlace `mailto` directo a `info@geekorium.shop` eliminando redirecciones obsoletas a Mailchimp. SincronizaciÃ³n de assets oficiales y eliminaciÃ³n de badges "DEV" hardcodeados.
- âœ… **EstabilizaciÃ³n de Checkout y Persistencia de Schema**: ResoluciÃ³n del error "Orden no encontrada". AdiciÃ³n de snapshotting de `product_name` en `order_items`. ConfiguraciÃ³n de RLS pÃºblica para rastreo de pedidos.
- âœ… **OptimizaciÃ³n de Storage**: DepreciaciÃ³n del flujo de carga de comprobantes automatizado para preservar cuota de base de datos; transiciÃ³n a flujo manual asistido (WhatsApp).
- âœ… **Multi-Environment & Dynamic IDs**: RefactorizaciÃ³n total para usar `VITE_SUPABASE_PROJECT_ID`. Despliegue de entorno DEV en GitHub Pages (`dev.geekorium.shop`) con segregaciÃ³n total de base de datos.
- âœ… **Regla "No Goldfish"**: PriorizaciÃ³n absoluta de Card Kingdom sobre la tabla legacy `aggregated_prices` para valoraciones externas.
- âœ… **SimplificaciÃ³n de Precios (Card Kingdom NM)**: Todos los precios de Geekorium se basan exclusivamente en el precio NM de Card Kingdom. El branding original "Geekorium" ha sido preservado integralmente en frontend y notificaciones.
- âœ… **MigraciÃ³n de Precios de Alto Rendimiento**: Implementado backfill de precios mediante CTEs y `UPDATE FROM`.
- âœ… **API Routing Defensivo**: NormalizaciÃ³n de rutas en Edge Functions.
- âœ… **SincronizaciÃ³n de Precios Card Kingdom (Foil/Non-Foil)**: Batched updates implementados para evitar timeouts en producciÃ³n.
- âœ… **ConexiÃ³n Segura via Supabase Pooler**: UnificaciÃ³n de `DATABASE_URL` para scripts de mantenimiento.
- âœ… **LÃ³gica de Fallback de Precios (TMNT/PZA)**: Implementado matching por `collector_number` + `edition` para sets con Scryfall IDs inconsistentes.
- âœ… **UnificaciÃ³n de Entorno**: ConsolidaciÃ³n de todos los archivos `.env` en una Ãºnica fuente de verdad en la raÃ­z del proyecto.
- âœ… **Soporte "Por Encargo" (On-Demand)**: El sistema ahora permite aÃ±adir cartas sin stock al carrito, creÃ¡ndolas automÃ¡ticamente en la DB con stock 0 si es necesario.
- âœ… **Notificaciones Premium**: Los correos incluyen botones de rastreo funcionales, etiquetas [FOIL] y [POR ENCARGO] dinÃ¡micas.
- âœ… **Limpieza de Checkout Success**: EliminaciÃ³n de campos redundantes y activaciÃ³n del botÃ³n de seguimiento integrado.
- âœ… **SincronizaciÃ³n de Credenciales SMTP**: UnificaciÃ³n de nombres de variables (`SMTP_USERNAME`/`SMTP_PASSWORD`) y sincronizaciÃ³n de lÃ³gica entre las funciones `api` y `tcg-api` para garantizar fiabilidad en las notificaciones.
- âœ… **Visibilidad Condicional de Carrito**: El botÃ³n "AÃ±adir al carrito" ahora estÃ¡ oculto por defecto en la vista general (grid/list) y solo es visible en el modal de detalles, mejorando la estÃ©tica de navegaciÃ³n masiva.
- âœ… **SincronizaciÃ³n de Metadatos Strixhaven**: ReparaciÃ³n de visibilidad de 360+ productos mediante la correcciÃ³n del trigger `sync_product_metadata` en la base de datos, asegurando que `type_line`, `colors` y `release_date` se propaguen siempre al inventario.
- âœ… **Extrema Performance (DenormalizaciÃ³n)**: EliminaciÃ³n de timeouts mediante denormalizaciÃ³n de metadatos (`colors`, `type`, `release_date`) en tabla `products`. RPC `get_products_filtered` optimizado para single-table query.
- âœ… **Comprobante PDF Real**: `CheckoutSuccessPage` genera un HTML de recibo completo (Inter font, tabla itemizada, datos del cliente, ID de orden, total, status) en una nueva pestaÃ±a que auto-dispara el diÃ¡logo de impresiÃ³n. Sin librerÃ­as externas.
- âœ… **WhatsApp Itemizado (Restaurado)**: El mensaje de WhatsApp incluye lÃ­nea por carta (`â€¢ Qty x Nombre [SET] [FINISH] - $Total`) con lÃ­mite de 40 Ã­tems y overflow note. Los datos del cliente ahora se pasan vÃ­a `navigate()` state.
- âœ… **Frontend Request Cancellation**: ImplementaciÃ³n de `AbortController` en `Home.tsx` para cancelar peticiones de red obsoletas durante el filtrado.
- âœ… **Detalles del Comprador en Admin**: El panel de Ã³rdenes ahora muestra Nombre, TelÃ©fono, Email y DirecciÃ³n completa (priorizando datos de invitado y envÃ­o).
- âœ… **Ocultamiento de SecciÃ³n Archivo**: Removida la pestaÃ±a de histÃ³rico para simplificar la UX. El sistema ahora opera exclusivamente sobre el inventario vivo (Marketplace).
- âœ… **Version 1.0 Baseline**: CreaciÃ³n de rama estable `v1.0-productiva` para preservar features apagadas.
- âœ… **Limpieza de Repositorio (Garbage Removal)**: EliminaciÃ³n de mÃ¡s de 70 scripts de depuraciÃ³n, logs y archivos temporales redundantes para mejorar la mantenibilidad.
- âœ… **AlineaciÃ³n de IDs de Fuentes**: EstandarizaciÃ³n de IDs de mercado (17: Card Kingdom, 16: TCGplayer) para integridad del historial de precios.
- âœ… **Pricing Integrity & SKU Sync (v52)**: ResoluciÃ³n de contaminaciÃ³n global de precios. ImplementaciÃ³n de mapeo basado en SKU para CardKingdom (soporte prefijo `F` y nÃºmeros de coleccionista).
- âœ… **OptimizaciÃ³n de Batch SQL (Ley 18)**: AplicaciÃ³n de actualizaciones masivas mediante el patrÃ³n `VALUES` table, reduciendo tiempos de horas a segundos.
- âœ… **GestiÃ³n de Accesorios (Accessories Management)**: MÃ³dulo completo de administraciÃ³n de accesorios con soporte para imÃ¡genes (`public_assets`), historial de auditorÃ­a y vitrina dinÃ¡mica en el marketplace.
- âœ… **ResoluciÃ³n DinÃ¡mica de Juegos**: EliminaciÃ³n de IDs hardcodeados para garantizar compatibilidad entre entornos DEV y PROD.
- âœ… **Checkout PolimÃ³rfico (Products & Accessories)**: Soporte nativo para pedidos mixtos en una sola transacciÃ³n atÃ³mica, con recuperaciÃ³n defensiva de IDs en el frontend y validaciÃ³n de integridad en el RPC.
- âœ… **Rastreo de Pedidos PÃºblico**: ImplementaciÃ³n de polÃ­ticas RLS para rastreo por ID (invitados/auth).
- âœ… **ImportaciÃ³n Masiva de Inventario (Accesorios)**: Carga de 164+ artÃ­culos mediante script automatizado con mapeo dinÃ¡mico.
- âœ… **Soporte para Precios de Alto Valor ($1,000,000)**: ActualizaciÃ³n de filtros para artÃ­culos de colecciÃ³n premium.
- âœ… **Filtrado Inclusivo de Accesorios GenÃ©ricos**: Los productos sin `game_id` son visibles en todos los contextos de juego.
- âœ… **Omni-TCG Architecture (v1.0)**: Soporte nativo para mÃºltiples juegos (PokÃ©mon, One Piece, Digimon, etc.) con validaciÃ³n polimÃ³rfica vÃ­a JSONB y triggers de integridad.
- âœ… **EstandarizaciÃ³n de Juegos (Ley 26)**: UnificaciÃ³n de cÃ³digos de franquicia (`PKM`, `OPC`, `DGM`, `FAB`, `GND`, `RFB`) y eliminaciÃ³n de duplicados en la base de datos.
- âœ… **RPC Integrity & Overload Cleaning**: Limpieza quirÃºrgica de funciones Postgres para evitar ambigÃ¼edad (`PGRST203`) y asegurar filtrado exacto por TCG. ImplementaciÃ³n de limpieza dinÃ¡mica via `pg_proc`.
- âœ… **Filtro "Nuevo" Restaurado**: SincronizaciÃ³n de la lÃ³gica `p_only_new` entre base de datos, API y Frontend con botÃ³n de acceso premium en la barra de navegaciÃ³n.
- âœ… **Centralized UX Navigation**: SincronizaciÃ³n reactiva de URL y menÃºs para navegaciÃ³n fluida entre Marketplace y CatÃ¡logo por juego.
- âœ… **Visibilidad de Ofertas en Inventario (Singles)**: ImplementaciÃ³n de columnas de descuento y fechas de expiraciÃ³n en la tabla de inventario administrativo para cartas, con renderizado Null-Safe para evitar crashes durante el ordenamiento.
- âœ… **Saneamiento Masivo de Credenciales (v55)**: RemediaciÃ³n total de un incidente de seguridad crÃ­tico. EliminaciÃ³n de contraseÃ±as hardcodeadas en mÃ¡s de 60 scripts y parametrizaciÃ³n vÃ­a `os.getenv`. ActualizaciÃ³n de `.gitignore` global y eliminaciÃ³n de archivos de texto con credenciales (`prod_credentials.txt`).
- âœ… **EstabilizaciÃ³n de Precios en ProducciÃ³n (v56)**: ReparaciÃ³n de discrepancias masivas mediante sincronizaciÃ³n atÃ³mica SQL. Procesamiento de 148,000+ precios y actualizaciÃ³n de 38,000+ cartas sin timeouts.
- âœ… **Hardening de CI/CD (Omni-Sync)**: InyecciÃ³n de secretos de producciÃ³n en GitHub Actions y refactorizaciÃ³n de `common/db.py` para aislamiento total de entornos.
- ✅ **Integración de Logos TCG (Premium)**: Sustitución de emojis por assets PNG estandarizados (`color` y `black`) en landing, header y administración. Implementación de leyes de respiración visual para evitar clipping en animaciones de escala.
- ✅ **Estandarización de Pantone y Color (Mayo 2026)**: Eliminación masiva de clases `neutral-XXX` de Tailwind y reemplazo por tokens `#B7B7B7` (`text-low`) y `#FFFFFF` (`text-high`) para asegurar paridad visual con el PRD en todos los entornos.
- ✅ **Optimización de Efectos Foil (v59)**: Refactorización de `CardDetail.tsx` para evitar el oscurecimiento de imágenes. El efecto shimmer ahora usa una capa independiente con opacidad controlada (30%) y solo se activa en versiones Foil.


## ðŸš§ Features Pendientes

- Swipe-down cierre modal en mÃ³vil
- Stale-While-Revalidate para Scryfall
- VirtualizaciÃ³n del grid (performance)
- Dashboard "cartas mÃ¡s buscadas sin stock" (admin)
- Tests unitarios parser ManaBox

## âš ï¸ Reglas CrÃ­ticas del Sistema

1. **Testing Lazy Imports**: Parchear siempre la clase importada desde el mÃ³dulo de origen (`modulo.Clase`), no desde el importador.
2. **Estrategia de Branching Obligatoria**: Todo cambio debe integrarse en `dev` para validaciÃ³n en el entorno de "Preview" de Cloudflare antes de ser mergeado a `main` para producciÃ³n.
3. **SegregaciÃ³n de Bases de Datos**: Uso obligatorio de proyectos Supabase independientes para `dev` y `main`, gestionados vÃ­a Cloudflare Environment Overrides.
4. **Prioridad de Datos del Comprador**: No intentar joins con `profiles` para obtener el email; usar siempre `guest_info` o `shipping_address` en `orders`.
5. **Cero Tolerancia a Precio 0**: Todo producto activo en inventario debe tener un precio mayor a 0 o fallback manual al mercado.
6. **WhatsApp = Canal Operacional Primario**: El mensaje de WhatsApp en el checkout SIEMPRE debe incluir el detalle por carta (nombre, cantidad, set, finish, subtotal). Nunca simplificar a conteos agregados. (LecciÃ³n #86)
7. **SincronizaciÃ³n SKU-Aware**: Los scripts de sincronizaciÃ³n con CardKingdom deben priorizar el SKU (`[F]SET-NNNN`) sobre el campo `variation` para sets modernos y tokens para garantizar un mapeo 100% exacto de acabados y coleccionistas.
8. **RLS de Rastreo**: El acceso de lectura a `orders` y `order_items` debe permitirse para el rol `anon` basado en el conocimiento del UUID de la orden para habilitar el rastreo de invitados.
9. **ProhibiciÃ³n de Hardcoding de Conexiones**: Nunca escribir URLs `postgresql://` o contraseÃ±as directamente en el cÃ³digo. Toda conexiÃ³n debe pasar por `os.getenv`. (Ley 21).
10. **Null-Safe Price Rendering**: Todo renderizado de precios y descuentos en interfaces administrativas DEBE usar fallbacks `(val || 0)` antes de formatear para prevenir fallos fatales por datos incompletos. (LecciÃ³n #151)

---

## ðŸ›¡ï¸ Footer

*Geekorium â€” Geeko-Engineering Division | Limpieza: 2026-03-23*

### ? Soporte Multi-Imagen y Carrusel Premium (Mayo 2026)
- **Propósito**: Permitir que los administradores suban múltiples fotos por producto y que los usuarios disfruten de una experiencia de visualización inmersiva.
- **Implementación**: Sistema de galería en Admin + AnimatePresence de Framer Motion en el modal de detalles.
- **Estatus**: ? Implementado (Compound v58).

