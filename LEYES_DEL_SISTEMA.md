# Ã¢Å¡â€“Ã¯Â¸ LEYES DEL SISTEMA - TCG Application

**Versión**: 3.7
**Última Actualización**: 2026-05-05 (Null-Safe Pricing & Discount Integrity)
**PropÃƒÂ³sito**: Definir reglas inmutables para operaciÃƒÂ³n autÃƒÂ³noma del agente

---

## Ã°Å¸â€Â´ LEYES FUNDAMENTALES (Nunca Violar)

### Ley 1: Integridad de Datos

**Nunca** ejecutar comandos que puedan:

- Eliminar datos de producciÃƒÂ³n sin backup
- Truncar tablas sin confirmaciÃƒÂ³n explÃƒÂ­cita
- Modificar esquemas de base de datos sin migration

**Excepciones**: Ninguna

---

### Ley 2: Deployment Seguro

**Siempre** seguir el checklist de deployment:

1. Verificar cambios locales (`git status`)
2. Commit con mensaje descriptivo
3. Push a GitHub
4. Desplegar Edge Functions si se modificaron
5. Verificar en producciÃƒÂ³n

**Excepciones**: Ninguna

---

### Ley 3: Testing Obligatorio

**Siempre** ejecutar tests antes de deployment a producciÃƒÂ³n.

**Comandos de Confianza** (Auto-aprobados, nunca requieren confirmaciÃƒÂ³n):

- `.\run_tests.ps1`
- `python -m pytest`
- `npm test`
- `python check_api_health.py`
- `python check_products_health.py`

**Excepciones**: Tests pueden omitirse en hotfixes crÃƒÂ­ticos, pero deben ejecutarse inmediatamente despuÃƒÂ©s.

---

### Ley 4: DocumentaciÃƒÂ³n Obligatoria

**Siempre** documentar:

- Cambios significativos en cÃƒÂ³digo
- Bugs encontrados y sus soluciones
- Decisiones de diseÃƒÂ±o importantes
- Sesiones de trabajo en `SESION_*.md`

**Excepciones**: Cambios triviales (typos, formatting)

---

### Ley 5: PRD como Source of Truth

**Siempre** consultar `PRD.md` antes de:

- Implementar nuevas features
- Modificar comportamiento existente
- Tomar decisiones de diseÃƒÂ±o

**Excepciones**: Bugfixes que no afectan funcionalidad

---

### Ley 6: Performance Garantizado (La Regla del Tiempo Real)

**Siempre** validar que las consultas crÃƒÂ­ticas respondan en <200ms.

- **DenormalizaciÃƒÂ³n Extrema**: Si una consulta de filtrado (marketplace/buscador) requiere mÃƒÂ¡s de 2 joins en tablas masivas (>50k filas), es **OBLIGATORIO** denormalizar los metadatos de filtrado (`colors`, `type`, `release_date`) a la tabla principal (`products`).
- **RPC Single-Table**: Los RPCs de bÃƒÂºsqueda deben tender a ser consultas de una sola tabla sobre datos denormalizados para maximizar la velocidad de los ÃƒÂ­ndices.
- **Indices**: OBLIGATORIO crear ÃƒÂ­ndices B-Tree o GIN para CADA columna usada en filtros o sorts ANTES de desplegar cÃƒÂ³digo que los use. Usar `pg_trgm` para bÃƒÆ’Ã‚Âºsquedas de texto.
- **Timeouts**: Si una query da timeout (500), la soluciÃƒÂ³n NO es aumentar el timeout, es optimizar la query (generalmente denormalizando o pasando a Materialized View).
- **Almacenamiento Diferencial**: PROHIBIDO guardar snapshots diarios de datos que no cambian. Siempre implementar lÃƒÂ³gica de comparaciÃƒÂ³n en la ingesta.

**Excepciones**: Consultas analÃƒÂ­ticas offline o scripts de migraciÃƒÂ³n manual.

---

### Ley 7: GestiÃƒÂ³n Segura de Secretos

**Nunca** hardcodear secretos reales (passwords, API keys, tokens) en archivos `.env` o archivos de configuraciÃƒÂ³n persistentes para entornos de producciÃƒÂ³n.

- **ValidaciÃƒÂ³n Estricta**: Las aplicaciones deben validar la existencia de secretos en variables de entorno del sistema al iniciar.
- **Placeholders**: Usar solo placeholders (ej. `SET_ME_VIA_ENV_VAR`) en archivos `.env` locales.
- **Acceso Directo**: En producciÃƒÂ³n, leer siempre desde variables de entorno del host o gestores de secretos.

**Excepciones**: Ninguna.

### Ley 8: SEO y Entornos No-Productivos

**Siempre** desactivar el indexado por motores de bÃƒÂºsqueda en entornos de desarrollo, preview o staging.

- **ConfiguraciÃƒÂ³n**: El tag `<meta name="robots" />` debe estar en `noindex, nofollow` para cualquier rama que no sea `main`.
- **ImplementaciÃƒÂ³n**: Usar variables de entorno de Vite (`VITE_ROBOTS`) para controlar este comportamiento dinÃƒÂ¡micamente segÃƒÂºn el branch de despliegue en Cloudflare.

**Excepciones**: Ninguna.

---

### Ley 9: SegregaciÃƒÂ³n de Ambientes y Hosting

**Siempre** usar instancias de base de datos y entornos de hosting independientes para producciÃƒÂ³n y desarrollo.

- **Ambiente de ProducciÃƒÂ³n**:
  - Branch: `main`
  - Hosting: Cloudflare Pages (`geekorium.shop`)
  - DB: Proyecto Supabase principal.
- **Ambiente de Desarrollo (DEV)**:
  - Branch: `dev`
  - Hosting: GitHub Pages (`dev.geekorium.shop`)
  - DB: Branch de Supabase vinculada a la rama `dev`.
- **Flujo de Trabajo**: Todo cambio DEBE validarse primero en el ambiente `dev` antes de ser integrado a `main`.
- **ConfiguraciÃƒÂ³n**: La inyecciÃƒÂ³n de variables de entorno debe ser especÃƒÂ­fica por cada plataforma de hosting.

**Excepciones**: Ninguna.

---

### Ley 10: Prioridad de Seguridad RLS

**Siempre** habilitar Row Level Security (RLS) en todas las tablas y configurar `security_invoker = true` en todas las vistas de Supabase.

- **PolÃƒÂ­ticas ExplÃƒÂ­citas**: Ninguna tabla debe quedar sin polÃƒÂ­ticas de seguridad.
- **Security Advisor**: El dashboard de Supabase Security Advisor debe mantenerse en **0 errores**.
- **AuditorÃƒÂ­a**: Cualquier cambio en el esquema debe ser verificado contra el linter de seguridad de Supabase.

**Excepciones**: Ninguna.

---

### Ley 21: ProhibiciÃ³n de Hardcoding de Conexiones (Seguridad de Credenciales)

**Nunca** escribir URLs de conexiÃ³n `postgresql://` ni contraseÃ±as de base de datos directamente en el cÃ³digo fuente de scripts, herramientas o aplicaciones.

- **Mandato**: Todas las conexiones a bases de datos deben resolverse mediante variables de entorno (`os.getenv`) o archivos `.env` (siempre ignorados por Git).
- **PatrÃ³n EstÃ¡ndar**: Usar `DATABASE_URL_PROD` y `DATABASE_URL_DEV` como nombres de variables estÃ¡ndar en todo el ecosistema de scripts.
- **AutomatizaciÃ³n**: Cualquier script de utilidad en `scripts/` o `scratch/` debe importar `os` y validar la existencia de las variables antes de proceder.

**Excepciones**: Ninguna. Detectar una URL hardcodeada bloquea cualquier despliegue a producciÃ³n.

---

### Ley 11: Integridad de Branding

**Siempre** mantener sincronizados los activos de marca entre el repositorio de diseÃƒÂ±o y el cÃƒÂ³digo fuente.

- **Fuente de Verdad**: Los archivos en `docs/logos/` son la fuente de verdad para la identidad visual.
- **SincronizaciÃƒÂ³n**: Cualquier cambio en `docs/logos/` debe replicarse inmediatamente en `frontend/public/branding/`.
- **Consistencia**: No se permiten referencias a archivos de marca obsoletos o con extensiones incorrectas en los componentes de React.
- **Favicon**: El favicon debe estar sincronizado con la versiÃƒÂ³n oficial de `docs/logos/Fav.jpg` (destino: `frontend/public/favicon.jpg`).

**Excepciones**: Ninguna.

---

## Ã°Å¸Å¸Â¡ REGLAS DE OPERACIÃƒâ€œN AUTÃƒâ€œNOMA

### Regla 1: Auto-AprobaciÃƒÂ³n de Comandos Seguros

Los siguientes comandos **NUNCA** requieren aprobaciÃƒÂ³n del usuario:

#### Testing y VerificaciÃƒÂ³n

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

#### VerificaciÃƒÂ³n de Conexiones

```powershell
Invoke-WebRequest -Method HEAD <url>
curl -I <url>
ping <host>
```

---

### Regla 2: Comandos que Requieren AprobaciÃƒÂ³n

Los siguientes comandos **SIEMPRE** requieren aprobaciÃƒÂ³n:

#### ModificaciÃƒÂ³n de Datos

```sql
DELETE FROM ...
TRUNCATE TABLE ...
UPDATE ... (sin WHERE clause)
DROP TABLE ...
```

#### Deployment a ProducciÃƒÂ³n

```bash
git push origin main (si hay cambios crÃƒÂ­ticos)
npx supabase functions deploy
npm run build && deploy
```

#### InstalaciÃƒÂ³n de Dependencias

```bash
npm install <package>
pip install <package>
```

---

### Regla 3: Modo Nightly Sync

Cuando se ejecuta `@[/nightly-sync]` o `.\nightly.ps1`:

- **Todos** los comandos del workflow son auto-aprobados
- El agente opera en modo 100% autÃƒÂ³nomo
- Se genera reporte completo al finalizar
- Se hace commit y push automÃƒÂ¡tico

---

### Regla 4: Manejo de Errores

Cuando un comando falla:

1. **Capturar** el error completo
2. **Documentar** en logs
3. **Intentar** soluciÃƒÂ³n automÃƒÂ¡tica si es seguro
4. **Reportar** al usuario si requiere intervenciÃƒÂ³n manual

---

### Regla de Negocio 4 (Soporte "Por Encargo")

- El sistema debe permitir la venta de cualquier carta, incluso si no hay stock fÃƒÂ­sico disponible (stock 0).
- Si un usuario intenta aÃƒÂ±adir al carrito una variante (Foil/NM) que no existe en el catÃƒÂ¡logo local (`products`), el sistema la crearÃƒÂ¡ automÃƒÂ¡ticamente con stock 0.
- Estas ÃƒÂ³rdenes se procesan bajo la etiqueta "POR ENCARGO" en el flujo de checkout y notificaciones.

---

## Ã°Å¸â€ºÂ  REGLAS TÃƒâ€°CNICAS

### Herramientas CLI (Entorno Windows)

- **Supabase**: Se debe usar `npx supabase` para asegurar la compatibilidad con el entorno local del usuario.
- **Project Ref**: En comandos de despliegue, incluir siempre el flag `--project-ref` seguido del ID del proyecto (`sxuotvogwvmxuvwbsscv`) para garantizar que los cambios se apliquen al proyecto correcto.

### SincronizaciÃƒÂ³n de Edge Functions

- Si existen mÃƒÂºltiples carpetas de funciones con lÃƒÂ³gica compartida (ej: `api/` y `tcg-api/`), todo cambio debe ser replicado en ambas antes de cualquier despliegue para evitar estados inconsistentes en el frontend.

### PrÃƒÂ¡ctica 1: Commits Descriptivos

Formato de commits:

```text
<type>: <description>

<body (opcional)>

<footer (opcional)>
```

Tipos vÃƒÂ¡lidos:

- `feat`: Nueva feature
- `fix`: Bugfix
- `docs`: DocumentaciÃƒÂ³n
- `refactor`: RefactorizaciÃƒÂ³n
- `test`: Tests
- `chore`: Mantenimiento
- `Ã°Å¸Â¤â€“`: Commit autÃƒÂ³nomo del agente

---

### PrÃƒÂ¡ctica 2: Branches y Workflow

- `main`: ProducciÃƒÂ³n estable
- `develop`: Desarrollo activo
- `feature/*`: Nuevas features
- `hotfix/*`: Fixes urgentes

---

### PrÃƒÂ¡ctica 3: Code Review

Antes de merge a `main`:

1. Tests pasando
2. DocumentaciÃƒÂ³n actualizada
3. PRD compliance verificado
4. Performance aceptable

---

## Ã°Å¸â€œÅ  MÃƒâ€°TRICAS DE CALIDAD

### MÃƒÂ©tricas Obligatorias

- **Test Coverage**: >80%
- **API Response Time**: <500ms (p95)
- **Error Rate**: <1%
- **Deployment Success**: >95%

### MÃƒÂ©tricas Deseables

- **Test Coverage**: >90%
- **API Response Time**: <200ms (p95)
- **Error Rate**: <0.1%
- **Deployment Success**: >99%

---

## Ã°Å¸Å¡Â¨ PROTOCOLO DE EMERGENCIA

### En Caso de ProducciÃƒÂ³n CaÃƒÂ­da

1. **Rollback** inmediato al ÃƒÂºltimo commit estable
2. **Notificar** al usuario
3. **Documentar** el incidente
4. **Investigar** causa raÃƒÂ­z
5. **Implementar** fix y tests
6. **Desplegar** con verificaciÃƒÂ³n extra

### En Caso de PÃƒÂ©rdida de Datos

1. **DETENER** todas las operaciones
2. **Restaurar** desde backup mÃƒÂ¡s reciente
3. **Notificar** al usuario inmediatamente
4. **Documentar** el incidente
5. **Implementar** prevenciones

---

## Ã°Å¸â€Âµ REGLAS DE NEGOCIO (TCG Specific)

### Regla 1: Precios de Geekorium

**Siempre** usar el precio de **Card Kingdom (NM)** para los ÃƒÂ­tems de **Geekorium**, a menos que un administrador especifique lo contrario explÃƒÂ­citamente. Esta es la fuente ÃƒÂºnica de verdad para la valoraciÃƒÂ³n de la tienda. Si el precio de un acabado especÃƒÂ­fico (Foil/Etched) falta, el sistema debe aplicar un fallback automÃƒÂ¡tico al precio de mercado general (Nonfoil) antes de mostrar "S/P".

### Regla 2: ImportaciÃƒÂ³n Ambigua

Al importar cartas sin ediciÃƒÂ³n (Set) especÃƒÂ­fica, el sistema **siempre** debe priorizar la impresiÃƒÂ³n con el **valor de mercado mÃƒÂ¡s alto**.

### Regla 3: AgregaciÃƒÂ³n en Lotes (Bulk Import)

**Siempre** agregar o consolidar filas duplicadas (mismo `printing_id`, `condition` y `finish`) dentro de un mismo lote de importaciÃƒÂ³n antes de enviarlo a la base de datos. El sistema debe sumar las cantidades (`stock`) de las filas duplicadas para evitar errores de restricciÃƒÂ³n de unicidad (`ON CONFLICT`) durante el procesamiento por lotes.

### Regla 4: GestiÃƒÂ³n de Procesos y Estado

Antes de iniciar procesos de sincronizaciÃƒÂ³n pesados o de larga duraciÃƒÂ³n, se deben identificar y terminar instancias previas del mismo script para evitar condiciones de carrera, agotamiento de conexiones o el uso de credenciales/entornos obsoletos (`stale environment`).

---

### Ley 18: Performance en Sincronizaciones Masivas

**Siempre** utilizar actualizaciones en lote (Batch Updates) tipo `VALUES` single-statement para operaciones que involucren >1,000 registros.

- **ProhibiciÃƒÂ³n**: Evitar el uso de `executemany` o bucles de `UPDATE` individuales sobre conexiones de pool (ej: port 6543) para grandes volÃƒÂºmenes de datos.
- **ImplementaciÃƒÂ³n**: Agrupar los cambios en chunks (ej: 2,000 filas) y ejecutar un solo `UPDATE ... FROM (VALUES ...)` para minimizar el round-trip y la latencia de red.

---

### Regla de Negocio 7: SincronizaciÃƒÂ³n SKU CardKingdom

**Siempre** priorizar el SKU de CardKingdom como fuente de verdad para el mapeo de coleccionistas y acabados (Finish) en sets modernos/tokens donde la data de Scryfall o `variation` sea ambigua.

- **Foil Detection**: El prefijo `F` en el SKU (ej: `FSOA-0022`) es la seÃƒÂ±al definitiva de acabado Foil/Etched.
- **Collector Number**: Extraer del SKU despuÃƒÂ©s del guion (`SOA-0022` -> `22`) eliminando ceros a la izquierda.
- **Prioridad de EdiciÃƒÂ³n**: Ante mÃƒÂºltiples ediciones mapeadas al mismo cÃƒÂ³digo de set (ej: Strixhaven vs Secrets of Strixhaven), priorizar siempre la ediciÃƒÂ³n nominal completa ("Secrets of...") para evitar precios contaminados de aliases antiguos.

---

### Ã°Å¸â€œ CHANGELOG DE LEYES

### v3.4 (2026-04-17)

- Ã¢Å“â€¦ Agregada **Ley 18**: Performance en Sincronizaciones Masivas (VALUES batch updates).
- Ã¢Å“â€¦ Agregada **Regla de Negocio 7**: SincronizaciÃƒÂ³n SKU CardKingdom (F prefix & collector mapping).

### v2.8 (2026-03-11)

- Ã¢Å“â€¦ Agregada **Ley 10**: Prioridad de Seguridad RLS (Mandato de 0 errores en Security Advisor).

### v2.9 (2026-03-11)

- Ã¢Å“â€¦ Agregada **Ley 12**: ÃƒÅ¡nica Fuente de Verdad para ConfiguraciÃƒÂ³n (.env) (ProhibiciÃƒÂ³n de mÃƒÂºltiples archivos .env).
- Ã¢Å“â€¦ Actualizada Regla de Negocio 1: Incluida menciÃƒÂ³n a la lÃƒÂ³gica de fallback por `collector_number`.

### v3.0 (2026-03-11)

- Ã¢Å“â€¦ Agregada **Regla de OperaciÃƒÂ³n 4**: GestiÃƒÂ³n de Procesos y Estado (Control de procesos huÃƒÂ©rfanos).
- Ã¢Å“â€¦ Documentadas lecciones #53 y #54 sobre diagnÃƒÂ³stico robusto y limpieza de entorno.

### v2.7 (2026-03-07)

- Ã¢Å“â€¦ Actualizada Ley 9: Especificada segregaciÃƒÂ³n de ambientes (Main/Cloudflare vs Dev/GitHub Pages) y vinculaciÃƒÂ³n de ramas de Supabase.

### v2.7 (2026-03-10)

- Ã¢Å“â€¦ Agregada Ley 11: Integridad de Branding.
- Ã¢Å“â€¦ ActualizaciÃƒÂ³n de Logo (`Logo.png`) y Favicon (`favicon.jpg`).
- Ã¢Å“â€¦ SincronizaciÃƒÂ³n de assets oficiales y eliminaciÃƒÂ³n de logos obsoletos.

### v2.6 (2026-03-07)

- Ã¢Å“â€¦ Agregada Ley 8: SEO y Entornos No-Productivos (ProhibiciÃƒÂ³n de indexado en ramas que no sean main).

### v2.5 (2026-03-05)

- Ã¢Å“â€¦ Agregada Ley 7: GestiÃƒÂ³n Segura de Secretos (ProhibiciÃƒÂ³n de secretos hardcodeados en producciÃƒÂ³n).

### v2.4 (2026-03-03)

- Ã¢Å“â€¦ Agregada Regla de Negocio 3: AgregaciÃƒÂ³n obligatoria de duplicados en lotes de importaciÃƒÂ³n para soporte de FoliaciÃƒÂ³n (Finish).

### v2.3 (2026-02-12)

- Ã¢Å“â€¦ Agregada Regla de Negocio 2: PriorizaciÃƒÂ³n de valor mÃƒÂ¡s alto en importaciones ambiguas.
- Ã¢Å“â€¦ Actualizada Regla de Negocio 1: DefiniciÃƒÂ³n de Fallback de precios (Store -> Market).

### v2.2 (2026-02-08)

- Ã¢Å“â€¦ Agregada Regla de Negocio 1: SincronizaciÃƒÂ³n de precios Geekorium con Card Kingdom.

### v2.1 (2026-02-06)

- Ã¢Å“â€¦ Agregada Ley 6: Performance Garantizado (Uso obligatorio de Vistas Materializadas para queries masivas).

### v2.0 (2026-02-05)

- Ã¢Å“â€¦ Agregada Ley 3: Testing Obligatorio con comandos auto-aprobados
- Ã¢Å“â€¦ Agregada auto-aprobaciÃƒÂ³n de `.\run_tests.ps1`
- Ã¢Å“â€¦ Agregada Regla 3: Modo Nightly Sync
- Ã¢Å“â€¦ Documentado protocolo de emergencia

### v1.0 (2026-02-01)

- Ã¢Å“â€¦ Leyes fundamentales establecidas
- Ã¢Å“â€¦ Reglas de operaciÃƒÂ³n autÃƒÂ³noma definidas
- Ã¢Å“â€¦ Mejores prÃƒÂ¡cticas documentadas

---

### Ley 14: Filtro de Stock Garantizado

**Siempre** filtrar los resultados para mostrar ÃƒÂºnicamente ÃƒÂ­tems con existencia real (`stock > 0`) en las vistas de Marketplace y Detalle de Carta.

- **ImplementaciÃƒÂ³n**: El filtrado principal debe ocurrir en `api.ts` (`fetchCardDetails`) y en los RPCs de bÃƒÂºsqueda (`get_products_filtered`).
- **ExcepciÃƒÂ³n**: Vistas administrativas de inventario o si el cliente solicita explÃƒÂ­citamente habilitar el modo "Archivo / Referencia".

---

### Ley 23: Sincronización de RPC (Evitar PGRST203)
**Siempre** incluir un bloque de limpieza dinámica de sobrecargas al modificar la firma de una función RPC en PostgreSQL.

- **Mandato**: Antes de ejecutar `CREATE OR REPLACE FUNCTION`, se debe identificar y eliminar (`DROP FUNCTION ... CASCADE`) cualquier versión anterior de la función con el mismo nombre pero distintos argumentos.
- **Implementación**: Usar el patrón de búsqueda en `pg_proc` para automatizar el borrado de todas las versiones sobrecargadas en el mismo script de migración.
- **Propósito**: Garantizar que PostgREST siempre tenga un único candidato válido, evitando errores de ambigüedad `PGRST203` que bloquean la carga de datos en el frontend.

---

### Ley 24: Integridad de Sincronización en Producción
**Siempre** verificar la paridad entre `price_history`, `card_printings` y `products` tras una sincronización de mercado masiva.

- **Mandato**: No se considera completada una sincronización si el reporte de auditoría muestra desajustes (drifts) entre las tablas denormalizadas.
- **Implementación**: Utilizar el patrón de `MATERIALIZED VIEW` temporal para realizar denormalizaciones atómicas y evitar desajustes causados por bloqueos parciales o fallas de conexión.
- **Refresco Obligatorio**: Todo cambio en precios de catálogo REQUIERE un `REFRESH MATERIALIZED VIEW CONCURRENTLY mv_unique_cards` para impactar el storefront sin downtime.

---

**Estas leyes son inmutables y deben ser respetadas en todo momento por el agente autónomo.**

### 13. SincronizaciÃƒÂ³n Estricta de Migraciones (CI/CD)

NingÃƒÂºn archivo de migraciÃƒÂ³n SQL (`supabase/migrations/`) desplegado y registrado en la rama de `dev` o `main` debe ser borrado localmente para "limpiar". Si se requiere consolidar migraciones o eliminar versiones antiguas, se debe purgar su registro equivalente en la tabla `supabase_migrations.schema_migrations` del entorno remoto alojado correspondiente. De lo contrario, GitHub Actions y Supabase CLI fallarÃƒÂ¡n con un `Migration mismatch`.
---

### Regla de Negocio 5 (Integridad de Acabados / Finish)

**Nunca** permitir que un producto sea marcado como 'foil' si la impresiÃƒÂ³n base (`card_printings`) no soporta oficialmente ese acabado. En caso de duda durante una importaciÃƒÂ³n masiva, el sistema debe defaultear a 'nonfoil' a menos que se detecte una coincidencia exacta y exclusiva de la palabra 'foil' (evitando falsos positivos con 'nonfoil').
---

### Regla de Negocio 6 (ImportaciÃƒÂ³n Robusta - Foil Reliability)

**Siempre** validar la intenciÃƒÂ³n del acabado (foil/nonfoil) contra todas las fuentes disponibles en la metadata:
- Priorizar la coincidencia del array `finishes` de `card_printings` si el booleano `is_foil` es falso o ambiguo.
- **ValidaciÃƒÂ³n de Capa Superior**: El frontend debe emitir alertas si se detectan discrepancias entre el valor declarado (Precio) y el acabado seleccionado (ej. precio de foil en carta marcada como normal) para prevenir errores de mapeo del usuario.

- Ã¢Å“â€¦ Actualizado **Protocolo de AuditorÃƒÂ­a**: InclusiÃƒÂ³n de buyer metadata en flujos de administraciÃƒÂ³n.

### v3.2 (2026-04-12)

- Ã¢Å“â€¦ Agregada **Ley 15**: Resiliencia de Conectividad (Uso preferente de API REST para sincronizaciÃƒÂ³n masiva).

### v3.3 (2026-04-14)

- Ã¢Å“â€¦ Agregada **Ley 16**: Cero Suposiciones (ObligaciÃƒÂ³n del agente de auditar/leer el cÃƒÂ³digo real con comandos antes de emitir o proponer cambios).

---

### Ley 15: Resiliencia de Conectividad (Cross-Branch Sync)

**Siempre** priorizar el uso de la API REST (PostgREST/HTTPS) sobre conexiones directas de Postgres (psycopg2/port 5432) al realizar tareas de sincronizaciÃƒÂ³n masiva entre ramas de Supabase, especialmente en entornos con restricciones de red o DNS inestables.

- **ImplementaciÃƒÂ³n**: Utilizar scripts basados en `requests` que consuman el endpoint de la API con el header `Prefer: resolution=merge-duplicates`.
- **Scripts de Referencia**: Mantener [**`sync_inventory_only.py`**](file:///c:/Users/carlo/OneDrive/Documents/Antigravity/TCG/scripts/debug/sync_inventory_only.py) como la herramienta estÃƒÂ¡ndar para duplicar estados de inventario entre entornos.

---

### Ley 16: Cero Suposiciones (Lectura Obligatoria - AI Agent)

**Nunca** proponer una soluciÃƒÂ³n estructurada ni ejecutar ediciones de cÃƒÂ³digo (`replace_file_content` / `write_to_file`) basÃƒÂ¡ndose ÃƒÂºnicamente en la memoria o en el historial de la conversaciÃƒÂ³n.

- **AuditorÃƒÂ­a Previa**: **Siempre** utilizar las herramientas del sistema (como `view_file` o `grep_search`) para leer el estado ACTUAL y completo del archivo o funciÃƒÂ³n involucrada antes de hacer o sugerir cualquier modificaciÃƒÂ³n.
- **Seguridad**: Es obligatorio gastar tiempo computacional entendiendo el contexto real antes que romper la lÃƒÂ³gica de un sistema en funcionamiento por exceso de confianza del agente.

---

### Ley 17: GestiÃ³n de Novedades (Inventory & Marketplace)

**Siempre** utilizar el campo `updated_at` como fuente de verdad para identificar Ã­tems "Nuevos" (re-stock o subida inicial).

- **Ventana de Novedad**: El estÃ¡ndar de visualizaciÃ³n es de **12 dÃ­as**.
- **LÃ³gica de Fallback (Graceful Degradation)**: Si el filtro de 12 dÃ­as no devuelve resultados, los RPCs financieros (`get_products_filtered`, `get_inventory_list`) deben ignorar automÃ¡ticamente la restricciÃ³n temporal para mostrar los Ã­tems mÃ¡s recientes disponibles en stock, evitando listas vacÃ­as para el usuario.
- **Desacoplamiento**: El filtro "Nuevo" debe operar siempre como un **toggle independiente**. Nunca debe sobreescribir o bloquear la capacidad del usuario de ordenar los elementos por otras columnas (Precio, Nombre, Stock) mientras el filtro estÃ© activo.

## ??? LEYES DE EXPANSION OMNI-TCG (2026)

### Ley 18: EstandarizaciÃ³n de CÃ³digos de Juego
- **Mandato**: Toda nueva inserciÃ³n en products debe usar cÃ³digos de 3-4 letras: MTG, PKM, OPC, LOR, FAB, YGO, WIX, DGM, GDM, RFB.
- **ProhibiciÃ³n**: No usar IDs numÃ©ricos o nombres largos en la columna game.
- **Objetivo**: Garantizar visibilidad instantÃ¡nea en el buscador de la tienda.

### Ley 19: ProtecciÃ³n de Entornos (Dev vs Main)
- **VerificaciÃ³n**: Antes de scripts de mantenimiento, verificar el Project ID en .env.
- **ProducciÃ³n**: sxuotvogwvmxuvwbsscv (Geekorium Live).
- **Desarrollo**: bqfkqnnostzaqueujdms (Sandbox).
- **AcciÃ³n**: Abortar si el entorno no coincide con el objetivo del script.

### Ley 20: Integridad Visual de Ofertas (Dynamic Discounts)
- **Mandato**: Todo producto con descuento activo (`discount_percentage > 0` y `discount_until` no expirado) DEBE mostrar el Ribbon diagonal distintivo y el precio tachado.
- **Null-Safe Rendering**: Todo renderizado de precios y descuentos en la UI (especialmente en el Admin) DEBE usar el patrón de fallback `(val || 0)` antes de formatear con `.toFixed()`. Esto previene crashes fatales durante el ordenamiento de tablas con datos incompletos.
- **Visibilidad**: El Ribbon de descuento debe tener un `z-index` mínimo de `100` para garantizar que no sea ocultado por overlays de imágenes o gradientes.
- **Cálculo de Precio**: El precio de venta final debe calcularse como `original_price * (1 - discount_percentage / 100)`. La UI debe siempre mostrar el ahorro porcentual de forma prominente.
- **Excepción**: Productos con stock 0 o estado "Por Encargo" pueden omitir el ribbon si el descuento solo aplica a stock físico inmediato, a menos que el admin especifique lo contrario.


## LEY 25: RESPIRACI�N VISUAL PARA ANIMACIONES
Cualquier componente que utilice transformaciones de escala (scale) o traslaci�n vertical (-translate-y) **debe** tener un contenedor con suficiente padding o overflow-visible para evitar recortes (clipping) en los bordes.

## LEY 26: IDENTIDAD DE MARCA TCG
Todos los logos de juegos TCG deben centralizarse en frontend/public/logos/tcg/. 
- La variante black/ (monocromo) se reserva para sidebars, listas peque�as y UI de administraci�n.
- La variante color/ se utiliza para selectores principales y elementos de alta jerarqu�a visual.

## LEY 27: SOPORTE DE GALER�AS Y PREMIUM UX
Todo producto (especialmente Accesorios) con capacidad de m�ltiples vistas debe implementar un sistema de galer�a robusto.
- **Imagen Can�nica**: El campo image_url en la base de datos debe representar siempre la imagen principal (can�nica) para optimizar el renderizado en vistas de lista.
- **Persistencia**: Las im�genes adicionales deben almacenarse en un array de texto (dditional_images) para evitar m�ltiples registros innecesarios.
- **Interacci�n**: El visor de detalles (CardModal) debe transformar autom�ticamente la imagen est�tica en un carousel interactivo solo cuando existan im�genes adicionales, ahorrando recursos de animaci�n en productos simples.
- **Transiciones**: Es obligatorio el uso de transiciones de opacidad y desenfoque (opacity + blur) para los cambios de imagen, garantizando una experiencia de usuario de alta gama ("Premium Feel").

