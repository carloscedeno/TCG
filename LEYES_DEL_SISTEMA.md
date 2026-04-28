# âš–ï¸� LEYES DEL SISTEMA - TCG Application

**VersiÃ³n**: 2.8
**Ãšltima ActualizaciÃ³n**: 2026-04-15 (Filtro Global Nuevo)
**PropÃ³sito**: Definir reglas inmutables para operaciÃ³n autÃ³noma del agente

---

## ðŸ”´ LEYES FUNDAMENTALES (Nunca Violar)

### Ley 1: Integridad de Datos

**Nunca** ejecutar comandos que puedan:

- Eliminar datos de producciÃ³n sin backup
- Truncar tablas sin confirmaciÃ³n explÃ­cita
- Modificar esquemas de base de datos sin migration

**Excepciones**: Ninguna

---

### Ley 2: Deployment Seguro

**Siempre** seguir el checklist de deployment:

1. Verificar cambios locales (`git status`)
2. Commit con mensaje descriptivo
3. Push a GitHub
4. Desplegar Edge Functions si se modificaron
5. Verificar en producciÃ³n

**Excepciones**: Ninguna

---

### Ley 3: Testing Obligatorio

**Siempre** ejecutar tests antes de deployment a producciÃ³n.

**Comandos de Confianza** (Auto-aprobados, nunca requieren confirmaciÃ³n):

- `.\run_tests.ps1`
- `python -m pytest`
- `npm test`
- `python check_api_health.py`
- `python check_products_health.py`

**Excepciones**: Tests pueden omitirse en hotfixes crÃ­ticos, pero deben ejecutarse inmediatamente despuÃ©s.

---

### Ley 4: DocumentaciÃ³n Obligatoria

**Siempre** documentar:

- Cambios significativos en cÃ³digo
- Bugs encontrados y sus soluciones
- Decisiones de diseÃ±o importantes
- Sesiones de trabajo en `SESION_*.md`

**Excepciones**: Cambios triviales (typos, formatting)

---

### Ley 5: PRD como Source of Truth

**Siempre** consultar `PRD.md` antes de:

- Implementar nuevas features
- Modificar comportamiento existente
- Tomar decisiones de diseÃ±o

**Excepciones**: Bugfixes que no afectan funcionalidad

---

### Ley 6: Performance Garantizado (La Regla del Tiempo Real)

**Siempre** validar que las consultas crÃ­ticas respondan en <200ms.

- **DenormalizaciÃ³n Extrema**: Si una consulta de filtrado (marketplace/buscador) requiere mÃ¡s de 2 joins en tablas masivas (>50k filas), es **OBLIGATORIO** denormalizar los metadatos de filtrado (`colors`, `type`, `release_date`) a la tabla principal (`products`).
- **RPC Single-Table**: Los RPCs de bÃºsqueda deben tender a ser consultas de una sola tabla sobre datos denormalizados para maximizar la velocidad de los Ã­ndices.
- **Indices**: OBLIGATORIO crear Ã­ndices B-Tree o GIN para CADA columna usada en filtros o sorts ANTES de desplegar cÃ³digo que los use. Usar `pg_trgm` para bÃƒÂºsquedas de texto.
- **Timeouts**: Si una query da timeout (500), la soluciÃ³n NO es aumentar el timeout, es optimizar la query (generalmente denormalizando o pasando a Materialized View).
- **Almacenamiento Diferencial**: PROHIBIDO guardar snapshots diarios de datos que no cambian. Siempre implementar lÃ³gica de comparaciÃ³n en la ingesta.

**Excepciones**: Consultas analÃ­ticas offline o scripts de migraciÃ³n manual.

---

### Ley 7: GestiÃ³n Segura de Secretos

**Nunca** hardcodear secretos reales (passwords, API keys, tokens) en archivos `.env` o archivos de configuraciÃ³n persistentes para entornos de producciÃ³n.

- **ValidaciÃ³n Estricta**: Las aplicaciones deben validar la existencia de secretos en variables de entorno del sistema al iniciar.
- **Placeholders**: Usar solo placeholders (ej. `SET_ME_VIA_ENV_VAR`) en archivos `.env` locales.
- **Acceso Directo**: En producciÃ³n, leer siempre desde variables de entorno del host o gestores de secretos.

**Excepciones**: Ninguna.

### Ley 8: SEO y Entornos No-Productivos

**Siempre** desactivar el indexado por motores de bÃºsqueda en entornos de desarrollo, preview o staging.

- **ConfiguraciÃ³n**: El tag `<meta name="robots" />` debe estar en `noindex, nofollow` para cualquier rama que no sea `main`.
- **ImplementaciÃ³n**: Usar variables de entorno de Vite (`VITE_ROBOTS`) para controlar este comportamiento dinÃ¡micamente segÃºn el branch de despliegue en Cloudflare.

**Excepciones**: Ninguna.

---

### Ley 9: SegregaciÃ³n de Ambientes y Hosting

**Siempre** usar instancias de base de datos y entornos de hosting independientes para producciÃ³n y desarrollo.

- **Ambiente de ProducciÃ³n**:
  - Branch: `main`
  - Hosting: Cloudflare Pages (`geekorium.shop`)
  - DB: Proyecto Supabase principal.
- **Ambiente de Desarrollo (DEV)**:
  - Branch: `dev`
  - Hosting: GitHub Pages (`dev.geekorium.shop`)
  - DB: Branch de Supabase vinculada a la rama `dev`.
- **Flujo de Trabajo**: Todo cambio DEBE validarse primero en el ambiente `dev` antes de ser integrado a `main`.
- **ConfiguraciÃ³n**: La inyecciÃ³n de variables de entorno debe ser especÃ­fica por cada plataforma de hosting.

**Excepciones**: Ninguna.

---

### Ley 10: Prioridad de Seguridad RLS

**Siempre** habilitar Row Level Security (RLS) en todas las tablas y configurar `security_invoker = true` en todas las vistas de Supabase.

- **PolÃ­ticas ExplÃ­citas**: Ninguna tabla debe quedar sin polÃ­ticas de seguridad.
- **Security Advisor**: El dashboard de Supabase Security Advisor debe mantenerse en **0 errores**.
- **AuditorÃ­a**: Cualquier cambio en el esquema debe ser verificado contra el linter de seguridad de Supabase.

**Excepciones**: Ninguna.

---

### Ley 11: Integridad de Branding

**Siempre** mantener sincronizados los activos de marca entre el repositorio de diseÃ±o y el cÃ³digo fuente.

- **Fuente de Verdad**: Los archivos en `docs/logos/` son la fuente de verdad para la identidad visual.
- **SincronizaciÃ³n**: Cualquier cambio en `docs/logos/` debe replicarse inmediatamente en `frontend/public/branding/`.
- **Consistencia**: No se permiten referencias a archivos de marca obsoletos o con extensiones incorrectas en los componentes de React.
- **Favicon**: El favicon debe estar sincronizado con la versiÃ³n oficial de `docs/logos/Fav.jpg` (destino: `frontend/public/favicon.jpg`).

**Excepciones**: Ninguna.

---

## ðŸŸ¡ REGLAS DE OPERACIÃ“N AUTÃ“NOMA

### Regla 1: Auto-AprobaciÃ³n de Comandos Seguros

Los siguientes comandos **NUNCA** requieren aprobaciÃ³n del usuario:

#### Testing y VerificaciÃ³n

```powershell
.\run_tests.ps1
.\nightly.ps1
.\scripts\verify_deployment.ps1
python check_api_health.py
python check_products_health.py
python tests/verify_supabase_functions.py
pytest
npm test
```

#### Limpieza de Caches

```powershell
rm -rf .pytest_cache
rm -rf __pycache__
rm -rf node_modules/.cache
```

#### Consultas de Solo Lectura

```powershell
git status
git log
git diff
ls
cat <file>
```

#### VerificaciÃ³n de Conexiones

```powershell
Invoke-WebRequest -Method HEAD <url>
curl -I <url>
ping <host>
```

---

### Regla 2: Comandos que Requieren AprobaciÃ³n

Los siguientes comandos **SIEMPRE** requieren aprobaciÃ³n:

#### ModificaciÃ³n de Datos

```sql
DELETE FROM ...
TRUNCATE TABLE ...
UPDATE ... (sin WHERE clause)
DROP TABLE ...
```

#### Deployment a ProducciÃ³n

```bash
git push origin main (si hay cambios crÃ­ticos)
npx supabase functions deploy
npm run build && deploy
```

#### InstalaciÃ³n de Dependencias

```bash
npm install <package>
pip install <package>
```

---

### Regla 3: Modo Nightly Sync

Cuando se ejecuta `@[/nightly-sync]` o `.\nightly.ps1`:

- **Todos** los comandos del workflow son auto-aprobados
- El agente opera en modo 100% autÃ³nomo
- Se genera reporte completo al finalizar
- Se hace commit y push automÃ¡tico

---

### Regla 4: Manejo de Errores

Cuando un comando falla:

1. **Capturar** el error completo
2. **Documentar** en logs
3. **Intentar** soluciÃ³n automÃ¡tica si es seguro
4. **Reportar** al usuario si requiere intervenciÃ³n manual

---

### Regla de Negocio 4 (Soporte "Por Encargo")

- El sistema debe permitir la venta de cualquier carta, incluso si no hay stock fÃ­sico disponible (stock 0).
- Si un usuario intenta aÃ±adir al carrito una variante (Foil/NM) que no existe en el catÃ¡logo local (`products`), el sistema la crearÃ¡ automÃ¡ticamente con stock 0.
- Estas Ã³rdenes se procesan bajo la etiqueta "POR ENCARGO" en el flujo de checkout y notificaciones.

---

## ðŸ›  REGLAS TÃ‰CNICAS

### Herramientas CLI (Entorno Windows)

- **Supabase**: Se debe usar `npx supabase` para asegurar la compatibilidad con el entorno local del usuario.
- **Project Ref**: En comandos de despliegue, incluir siempre el flag `--project-ref` seguido del ID del proyecto (`sxuotvogwvmxuvwbsscv`) para garantizar que los cambios se apliquen al proyecto correcto.

### SincronizaciÃ³n de Edge Functions

- Si existen mÃºltiples carpetas de funciones con lÃ³gica compartida (ej: `api/` y `tcg-api/`), todo cambio debe ser replicado en ambas antes de cualquier despliegue para evitar estados inconsistentes en el frontend.

### PrÃ¡ctica 1: Commits Descriptivos

Formato de commits:

```text
<type>: <description>

<body (opcional)>

<footer (opcional)>
```

Tipos vÃ¡lidos:

- `feat`: Nueva feature
- `fix`: Bugfix
- `docs`: DocumentaciÃ³n
- `refactor`: RefactorizaciÃ³n
- `test`: Tests
- `chore`: Mantenimiento
- `ðŸ¤–`: Commit autÃ³nomo del agente

---

### PrÃ¡ctica 2: Branches y Workflow

- `main`: ProducciÃ³n estable
- `develop`: Desarrollo activo
- `feature/*`: Nuevas features
- `hotfix/*`: Fixes urgentes

---

### PrÃ¡ctica 3: Code Review

Antes de merge a `main`:

1. Tests pasando
2. DocumentaciÃ³n actualizada
3. PRD compliance verificado
4. Performance aceptable

---

## ðŸ“Š MÃ‰TRICAS DE CALIDAD

### MÃ©tricas Obligatorias

- **Test Coverage**: >80%
- **API Response Time**: <500ms (p95)
- **Error Rate**: <1%
- **Deployment Success**: >95%

### MÃ©tricas Deseables

- **Test Coverage**: >90%
- **API Response Time**: <200ms (p95)
- **Error Rate**: <0.1%
- **Deployment Success**: >99%

---

## ðŸš¨ PROTOCOLO DE EMERGENCIA

### En Caso de ProducciÃ³n CaÃ­da

1. **Rollback** inmediato al Ãºltimo commit estable
2. **Notificar** al usuario
3. **Documentar** el incidente
4. **Investigar** causa raÃ­z
5. **Implementar** fix y tests
6. **Desplegar** con verificaciÃ³n extra

### En Caso de PÃ©rdida de Datos

1. **DETENER** todas las operaciones
2. **Restaurar** desde backup mÃ¡s reciente
3. **Notificar** al usuario inmediatamente
4. **Documentar** el incidente
5. **Implementar** prevenciones

---

## ðŸ”µ REGLAS DE NEGOCIO (TCG Specific)

### Regla 1: Precios de Geekorium

**Siempre** usar el precio de **Card Kingdom (NM)** para los Ã­tems de **Geekorium**, a menos que un administrador especifique lo contrario explÃ­citamente. Esta es la fuente Ãºnica de verdad para la valoraciÃ³n de la tienda. Si el precio de un acabado especÃ­fico (Foil/Etched) falta, el sistema debe aplicar un fallback automÃ¡tico al precio de mercado general (Nonfoil) antes de mostrar "S/P".

### Regla 2: ImportaciÃ³n Ambigua

Al importar cartas sin ediciÃ³n (Set) especÃ­fica, el sistema **siempre** debe priorizar la impresiÃ³n con el **valor de mercado mÃ¡s alto**.

### Regla 3: AgregaciÃ³n en Lotes (Bulk Import)

**Siempre** agregar o consolidar filas duplicadas (mismo `printing_id`, `condition` y `finish`) dentro de un mismo lote de importaciÃ³n antes de enviarlo a la base de datos. El sistema debe sumar las cantidades (`stock`) de las filas duplicadas para evitar errores de restricciÃ³n de unicidad (`ON CONFLICT`) durante el procesamiento por lotes.

### Regla 4: GestiÃ³n de Procesos y Estado

Antes de iniciar procesos de sincronizaciÃ³n pesados o de larga duraciÃ³n, se deben identificar y terminar instancias previas del mismo script para evitar condiciones de carrera, agotamiento de conexiones o el uso de credenciales/entornos obsoletos (`stale environment`).

---

### Ley 18: Performance en Sincronizaciones Masivas

**Siempre** utilizar actualizaciones en lote (Batch Updates) tipo `VALUES` single-statement para operaciones que involucren >1,000 registros.

- **ProhibiciÃ³n**: Evitar el uso de `executemany` o bucles de `UPDATE` individuales sobre conexiones de pool (ej: port 6543) para grandes volÃºmenes de datos.
- **ImplementaciÃ³n**: Agrupar los cambios en chunks (ej: 2,000 filas) y ejecutar un solo `UPDATE ... FROM (VALUES ...)` para minimizar el round-trip y la latencia de red.

---

### Regla de Negocio 7: SincronizaciÃ³n SKU CardKingdom

**Siempre** priorizar el SKU de CardKingdom como fuente de verdad para el mapeo de coleccionistas y acabados (Finish) en sets modernos/tokens donde la data de Scryfall o `variation` sea ambigua.

- **Foil Detection**: El prefijo `F` en el SKU (ej: `FSOA-0022`) es la seÃ±al definitiva de acabado Foil/Etched.
- **Collector Number**: Extraer del SKU despuÃ©s del guion (`SOA-0022` -> `22`) eliminando ceros a la izquierda.
- **Prioridad de EdiciÃ³n**: Ante mÃºltiples ediciones mapeadas al mismo cÃ³digo de set (ej: Strixhaven vs Secrets of Strixhaven), priorizar siempre la ediciÃ³n nominal completa ("Secrets of...") para evitar precios contaminados de aliases antiguos.

---

### ðŸ“� CHANGELOG DE LEYES

### v3.4 (2026-04-17)

- âœ… Agregada **Ley 18**: Performance en Sincronizaciones Masivas (VALUES batch updates).
- âœ… Agregada **Regla de Negocio 7**: SincronizaciÃ³n SKU CardKingdom (F prefix & collector mapping).

### v2.8 (2026-03-11)

- âœ… Agregada **Ley 10**: Prioridad de Seguridad RLS (Mandato de 0 errores en Security Advisor).

### v2.9 (2026-03-11)

- âœ… Agregada **Ley 12**: Ãšnica Fuente de Verdad para ConfiguraciÃ³n (.env) (ProhibiciÃ³n de mÃºltiples archivos .env).
- âœ… Actualizada Regla de Negocio 1: Incluida menciÃ³n a la lÃ³gica de fallback por `collector_number`.

### v3.0 (2026-03-11)

- âœ… Agregada **Regla de OperaciÃ³n 4**: GestiÃ³n de Procesos y Estado (Control de procesos huÃ©rfanos).
- âœ… Documentadas lecciones #53 y #54 sobre diagnÃ³stico robusto y limpieza de entorno.

### v2.7 (2026-03-07)

- âœ… Actualizada Ley 9: Especificada segregaciÃ³n de ambientes (Main/Cloudflare vs Dev/GitHub Pages) y vinculaciÃ³n de ramas de Supabase.

### v2.7 (2026-03-10)

- âœ… Agregada Ley 11: Integridad de Branding.
- âœ… ActualizaciÃ³n de Logo (`Logo.png`) y Favicon (`favicon.jpg`).
- âœ… SincronizaciÃ³n de assets oficiales y eliminaciÃ³n de logos obsoletos.

### v2.6 (2026-03-07)

- âœ… Agregada Ley 8: SEO y Entornos No-Productivos (ProhibiciÃ³n de indexado en ramas que no sean main).

### v2.5 (2026-03-05)

- âœ… Agregada Ley 7: GestiÃ³n Segura de Secretos (ProhibiciÃ³n de secretos hardcodeados en producciÃ³n).

### v2.4 (2026-03-03)

- âœ… Agregada Regla de Negocio 3: AgregaciÃ³n obligatoria de duplicados en lotes de importaciÃ³n para soporte de FoliaciÃ³n (Finish).

### v2.3 (2026-02-12)

- âœ… Agregada Regla de Negocio 2: PriorizaciÃ³n de valor mÃ¡s alto en importaciones ambiguas.
- âœ… Actualizada Regla de Negocio 1: DefiniciÃ³n de Fallback de precios (Store -> Market).

### v2.2 (2026-02-08)

- âœ… Agregada Regla de Negocio 1: SincronizaciÃ³n de precios Geekorium con Card Kingdom.

### v2.1 (2026-02-06)

- âœ… Agregada Ley 6: Performance Garantizado (Uso obligatorio de Vistas Materializadas para queries masivas).

### v2.0 (2026-02-05)

- âœ… Agregada Ley 3: Testing Obligatorio con comandos auto-aprobados
- âœ… Agregada auto-aprobaciÃ³n de `.\run_tests.ps1`
- âœ… Agregada Regla 3: Modo Nightly Sync
- âœ… Documentado protocolo de emergencia

### v1.0 (2026-02-01)

- âœ… Leyes fundamentales establecidas
- âœ… Reglas de operaciÃ³n autÃ³noma definidas
- âœ… Mejores prÃ¡cticas documentadas

---

### Ley 14: Filtro de Stock Garantizado

**Siempre** filtrar los resultados para mostrar Ãºnicamente Ã­tems con existencia real (`stock > 0`) en las vistas de Marketplace y Detalle de Carta.

- **ImplementaciÃ³n**: El filtrado principal debe ocurrir en `api.ts` (`fetchCardDetails`) y en los RPCs de bÃºsqueda (`get_products_filtered`).
- **ExcepciÃ³n**: Vistas administrativas de inventario o si el cliente solicita explÃ­citamente habilitar el modo "Archivo / Referencia".

---

**Estas leyes son inmutables y deben ser respetadas en todo momento por el agente autÃ³nomo.**

### 13. SincronizaciÃ³n Estricta de Migraciones (CI/CD)

NingÃºn archivo de migraciÃ³n SQL (`supabase/migrations/`) desplegado y registrado en la rama de `dev` o `main` debe ser borrado localmente para "limpiar". Si se requiere consolidar migraciones o eliminar versiones antiguas, se debe purgar su registro equivalente en la tabla `supabase_migrations.schema_migrations` del entorno remoto alojado correspondiente. De lo contrario, GitHub Actions y Supabase CLI fallarÃ¡n con un `Migration mismatch`.
---

### Regla de Negocio 5 (Integridad de Acabados / Finish)

**Nunca** permitir que un producto sea marcado como 'foil' si la impresiÃ³n base (`card_printings`) no soporta oficialmente ese acabado. En caso de duda durante una importaciÃ³n masiva, el sistema debe defaultear a 'nonfoil' a menos que se detecte una coincidencia exacta y exclusiva de la palabra 'foil' (evitando falsos positivos con 'nonfoil').
---

### Regla de Negocio 6 (ImportaciÃ³n Robusta - Foil Reliability)

**Siempre** validar la intenciÃ³n del acabado (foil/nonfoil) contra todas las fuentes disponibles en la metadata:
- Priorizar la coincidencia del array `finishes` de `card_printings` si el booleano `is_foil` es falso o ambiguo.
- **ValidaciÃ³n de Capa Superior**: El frontend debe emitir alertas si se detectan discrepancias entre el valor declarado (Precio) y el acabado seleccionado (ej. precio de foil en carta marcada como normal) para prevenir errores de mapeo del usuario.

- âœ… Actualizado **Protocolo de AuditorÃ­a**: InclusiÃ³n de buyer metadata en flujos de administraciÃ³n.

### v3.2 (2026-04-12)

- âœ… Agregada **Ley 15**: Resiliencia de Conectividad (Uso preferente de API REST para sincronizaciÃ³n masiva).

### v3.3 (2026-04-14)

- âœ… Agregada **Ley 16**: Cero Suposiciones (ObligaciÃ³n del agente de auditar/leer el cÃ³digo real con comandos antes de emitir o proponer cambios).

---

### Ley 15: Resiliencia de Conectividad (Cross-Branch Sync)

**Siempre** priorizar el uso de la API REST (PostgREST/HTTPS) sobre conexiones directas de Postgres (psycopg2/port 5432) al realizar tareas de sincronizaciÃ³n masiva entre ramas de Supabase, especialmente en entornos con restricciones de red o DNS inestables.

- **ImplementaciÃ³n**: Utilizar scripts basados en `requests` que consuman el endpoint de la API con el header `Prefer: resolution=merge-duplicates`.
- **Scripts de Referencia**: Mantener [**`sync_inventory_only.py`**](file:///c:/Users/carlo/OneDrive/Documents/Antigravity/TCG/scripts/debug/sync_inventory_only.py) como la herramienta estÃ¡ndar para duplicar estados de inventario entre entornos.

---

### Ley 16: Cero Suposiciones (Lectura Obligatoria - AI Agent)

**Nunca** proponer una soluciÃ³n estructurada ni ejecutar ediciones de cÃ³digo (`replace_file_content` / `write_to_file`) basÃ¡ndose Ãºnicamente en la memoria o en el historial de la conversaciÃ³n.

- **AuditorÃ­a Previa**: **Siempre** utilizar las herramientas del sistema (como `view_file` o `grep_search`) para leer el estado ACTUAL y completo del archivo o funciÃ³n involucrada antes de hacer o sugerir cualquier modificaciÃ³n.
- **Seguridad**: Es obligatorio gastar tiempo computacional entendiendo el contexto real antes que romper la lÃ³gica de un sistema en funcionamiento por exceso de confianza del agente.

---

### Ley 17: GestiÃ³n de Novedades (Inventory & Marketplace)

**Siempre** utilizar el campo `updated_at` como fuente de verdad para identificar Ã­tems "Nuevos" (re-stock o subida inicial).
**Nunca** proponer una solución estructurada ni ejecutar ediciones de código (`replace_file_content` / `write_to_file`) basándose únicamente en la memoria o en el historial de la conversación.

- **Auditoría Previa**: **Siempre** utilizar las herramientas del sistema (como `view_file` o `grep_search`) para leer el estado ACTUAL y completo del archivo o función involucrada antes de hacer o sugerir cualquier modificación.
- **Seguridad**: Es obligatorio gastar tiempo computacional entendiendo el contexto real antes que romper la lógica de un sistema en funcionamiento por exceso de confianza del agente.

---

### Ley 17: Gestión de Novedades (Inventory & Marketplace)

**Siempre** utilizar el campo `updated_at` como fuente de verdad para identificar ítems "Nuevos" (re-stock o subida inicial).

- **Ventana de Novedad**: El estándar de visualización es de **12 días**.
- **Lógica de Fallback (Graceful Degradation)**: Si el filtro de 12 días no devuelve resultados, los RPCs financieros (`get_products_filtered`, `get_inventory_list`) deben ignorar automáticamente la restricción temporal para mostrar los ítems más recientes disponibles en stock, evitando listas vacías para el usuario.
- **Desacoplamiento**: El filtro "Nuevo" debe operar siempre como un **toggle independiente**. Nunca debe sobreescribir o bloquear la capacidad del usuario de ordenar los elementos por otras columnas (Precio, Nombre, Stock) mientras el filtro esté activo.

## ??? LEYES DE EXPANSION OMNI-TCG (2026)

### Ley 18: Estandarización de Códigos de Juego
- **Mandato**: Toda nueva inserción en products debe usar códigos de 3-4 letras: MTG, PKM, OPC, LOR, FAB, YGO, WIX, DGM, GDM, RFB.
- **Prohibición**: No usar IDs numéricos o nombres largos en la columna game.
- **Objetivo**: Garantizar visibilidad instantánea en el buscador de la tienda.

### Ley 19: Protección de Entornos (Dev vs Main)
- **Verificación**: Antes de scripts de mantenimiento, verificar el Project ID en .env.
- **Producción**: sxuotvogwvmxuvwbsscv (Geekorium Live).
- **Desarrollo**: bqfkqnnostzaqueujdms (Sandbox).
- **Acción**: Abortar si el entorno no coincide con el objetivo del script.
