# ÃƒÂ¢Ã…Â¡Ã¢â‚¬â€œÃƒÂ¯Ã‚Â¸ LEYES DEL SISTEMA - TCG Application

**VersiÃ³n**: 3.7
**Ãšltima ActualizaciÃ³n**: 2026-05-05 (Null-Safe Pricing & Discount Integrity)
**PropÃƒÆ’Ã‚Â³sito**: Definir reglas inmutables para operaciÃƒÆ’Ã‚Â³n autÃƒÆ’Ã‚Â³noma del agente

---

## ÃƒÂ°Ã…Â¸Ã¢â‚¬Â�Ã‚Â´ LEYES FUNDAMENTALES (Nunca Violar)

### Ley 1: Integridad de Datos

**Nunca** ejecutar comandos que puedan:

- Eliminar datos de producciÃƒÆ’Ã‚Â³n sin backup
- Truncar tablas sin confirmaciÃƒÆ’Ã‚Â³n explÃƒÆ’Ã‚Â­cita
- Modificar esquemas de base de datos sin migration

**Excepciones**: Ninguna

---

### Ley 2: Deployment Seguro

**Siempre** seguir el checklist de deployment:

1. Verificar cambios locales (`git status`)
2. Commit con mensaje descriptivo
3. Push a GitHub
4. Desplegar Edge Functions si se modificaron
5. Verificar en producciÃƒÆ’Ã‚Â³n

**Excepciones**: Ninguna

---

### Ley 3: Testing Obligatorio

**Siempre** ejecutar tests antes de deployment a producciÃƒÆ’Ã‚Â³n.

**Comandos de Confianza** (Auto-aprobados, nunca requieren confirmaciÃƒÆ’Ã‚Â³n):

- `.\run_tests.ps1`
- `python -m pytest`
- `npm test`
- `python check_api_health.py`
- `python check_products_health.py`

**Excepciones**: Tests pueden omitirse en hotfixes crÃƒÆ’Ã‚Â­ticos, pero deben ejecutarse inmediatamente despuÃƒÆ’Ã‚Â©s.

---

### Ley 4: DocumentaciÃƒÆ’Ã‚Â³n Obligatoria

**Siempre** documentar:

- Cambios significativos en cÃƒÆ’Ã‚Â³digo
- Bugs encontrados y sus soluciones
- Decisiones de diseÃƒÆ’Ã‚Â±o importantes
- Sesiones de trabajo en `SESION_*.md`

**Excepciones**: Cambios triviales (typos, formatting)

---

### Ley 5: PRD como Source of Truth

**Siempre** consultar `PRD.md` antes de:

- Implementar nuevas features
- Modificar comportamiento existente
- Tomar decisiones de diseÃƒÆ’Ã‚Â±o

**Excepciones**: Bugfixes que no afectan funcionalidad

---

### Ley 6: Performance Garantizado (La Regla del Tiempo Real)

**Siempre** validar que las consultas crÃƒÆ’Ã‚Â­ticas respondan en <200ms.

- **DenormalizaciÃƒÆ’Ã‚Â³n Extrema**: Si una consulta de filtrado (marketplace/buscador) requiere mÃƒÆ’Ã‚Â¡s de 2 joins en tablas masivas (>50k filas), es **OBLIGATORIO** denormalizar los metadatos de filtrado (`colors`, `type`, `release_date`) a la tabla principal (`products`).
- **RPC Single-Table**: Los RPCs de bÃƒÆ’Ã‚Âºsqueda deben tender a ser consultas de una sola tabla sobre datos denormalizados para maximizar la velocidad de los ÃƒÆ’Ã‚Â­ndices.
- **Indices**: OBLIGATORIO crear ÃƒÆ’Ã‚Â­ndices B-Tree o GIN para CADA columna usada en filtros o sorts ANTES de desplegar cÃƒÆ’Ã‚Â³digo que los use. Usar `pg_trgm` para bÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºsquedas de texto.
- **Timeouts**: Si una query da timeout (500), la soluciÃƒÆ’Ã‚Â³n NO es aumentar el timeout, es optimizar la query (generalmente denormalizando o pasando a Materialized View).
- **Almacenamiento Diferencial**: PROHIBIDO guardar snapshots diarios de datos que no cambian. Siempre implementar lÃƒÆ’Ã‚Â³gica de comparaciÃƒÆ’Ã‚Â³n en la ingesta.

**Excepciones**: Consultas analÃƒÆ’Ã‚Â­ticas offline o scripts de migraciÃƒÆ’Ã‚Â³n manual.

---

### Ley 7: GestiÃƒÆ’Ã‚Â³n Segura de Secretos

**Nunca** hardcodear secretos reales (passwords, API keys, tokens) en archivos `.env` o archivos de configuraciÃƒÆ’Ã‚Â³n persistentes para entornos de producciÃƒÆ’Ã‚Â³n.

- **ValidaciÃƒÆ’Ã‚Â³n Estricta**: Las aplicaciones deben validar la existencia de secretos en variables de entorno del sistema al iniciar.
- **Placeholders**: Usar solo placeholders (ej. `SET_ME_VIA_ENV_VAR`) en archivos `.env` locales.
- **Acceso Directo**: En producciÃƒÆ’Ã‚Â³n, leer siempre desde variables de entorno del host o gestores de secretos.

**Excepciones**: Ninguna.

### Ley 8: SEO y Entornos No-Productivos

**Siempre** desactivar el indexado por motores de bÃƒÆ’Ã‚Âºsqueda en entornos de desarrollo, preview o staging.

- **ConfiguraciÃƒÆ’Ã‚Â³n**: El tag `<meta name="robots" />` debe estar en `noindex, nofollow` para cualquier rama que no sea `main`.
- **ImplementaciÃƒÆ’Ã‚Â³n**: Usar variables de entorno de Vite (`VITE_ROBOTS`) para controlar este comportamiento dinÃƒÆ’Ã‚Â¡micamente segÃƒÆ’Ã‚Âºn el branch de despliegue en Cloudflare.

**Excepciones**: Ninguna.

---

### Ley 9: SegregaciÃƒÆ’Ã‚Â³n de Ambientes y Hosting

**Siempre** usar instancias de base de datos y entornos de hosting independientes para producciÃƒÆ’Ã‚Â³n y desarrollo.

- **Ambiente de ProducciÃƒÆ’Ã‚Â³n**:
  - Branch: `main`
  - Hosting: Cloudflare Pages (`geekorium.shop`)
  - DB: Proyecto Supabase principal.
- **Ambiente de Desarrollo (DEV)**:
  - Branch: `dev`
  - Hosting: GitHub Pages (`dev.geekorium.shop`)
  - DB: Branch de Supabase vinculada a la rama `dev`.
- **Flujo de Trabajo**: Todo cambio DEBE validarse primero en el ambiente `dev` antes de ser integrado a `main`.
- **ConfiguraciÃƒÆ’Ã‚Â³n**: La inyecciÃƒÆ’Ã‚Â³n de variables de entorno debe ser especÃƒÆ’Ã‚Â­fica por cada plataforma de hosting.

**Excepciones**: Ninguna.

---

### Ley 10: Prioridad de Seguridad RLS

**Siempre** habilitar Row Level Security (RLS) en todas las tablas y configurar `security_invoker = true` en todas las vistas de Supabase.

- **PolÃƒÆ’Ã‚Â­ticas ExplÃƒÆ’Ã‚Â­citas**: Ninguna tabla debe quedar sin polÃƒÆ’Ã‚Â­ticas de seguridad.
- **Security Advisor**: El dashboard de Supabase Security Advisor debe mantenerse en **0 errores**.
- **AuditorÃƒÆ’Ã‚Â­a**: Cualquier cambio en el esquema debe ser verificado contra el linter de seguridad de Supabase.

**Excepciones**: Ninguna.

---

### Ley 21: ProhibiciÃƒÂ³n de Hardcoding de Conexiones (Seguridad de Credenciales)

**Nunca** escribir URLs de conexiÃƒÂ³n `postgresql://` ni contraseÃƒÂ±as de base de datos directamente en el cÃƒÂ³digo fuente de scripts, herramientas o aplicaciones.

- **Mandato**: Todas las conexiones a bases de datos deben resolverse mediante variables de entorno (`os.getenv`) o archivos `.env` (siempre ignorados por Git).
- **PatrÃƒÂ³n EstÃƒÂ¡ndar**: Usar `DATABASE_URL_PROD` y `DATABASE_URL_DEV` como nombres de variables estÃƒÂ¡ndar en todo el ecosistema de scripts.
- **AutomatizaciÃƒÂ³n**: Cualquier script de utilidad en `scripts/` o `scratch/` debe importar `os` y validar la existencia de las variables antes de proceder.

**Excepciones**: Ninguna. Detectar una URL hardcodeada bloquea cualquier despliegue a producciÃƒÂ³n.

---

### Ley 11: Integridad de Branding

**Siempre** mantener sincronizados los activos de marca entre el repositorio de diseÃƒÆ’Ã‚Â±o y el cÃƒÆ’Ã‚Â³digo fuente.

- **Fuente de Verdad**: Los archivos en `docs/logos/` son la fuente de verdad para la identidad visual.
- **SincronizaciÃƒÆ’Ã‚Â³n**: Cualquier cambio en `docs/logos/` debe replicarse inmediatamente en `frontend/public/branding/`.
- **Consistencia**: No se permiten referencias a archivos de marca obsoletos o con extensiones incorrectas en los componentes de React.
- **Favicon**: El favicon debe estar sincronizado con la versiÃƒÆ’Ã‚Â³n oficial de `docs/logos/Fav.jpg` (destino: `frontend/public/favicon.jpg`).

**Excepciones**: Ninguna.

---

## ÃƒÂ°Ã…Â¸Ã…Â¸Ã‚Â¡ REGLAS DE OPERACIÃƒÆ’Ã¢â‚¬Å“N AUTÃƒÆ’Ã¢â‚¬Å“NOMA

### Regla 1: Auto-AprobaciÃƒÆ’Ã‚Â³n de Comandos Seguros

Los siguientes comandos **NUNCA** requieren aprobaciÃƒÆ’Ã‚Â³n del usuario:

#### Testing y VerificaciÃƒÆ’Ã‚Â³n

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

#### VerificaciÃƒÆ’Ã‚Â³n de Conexiones

```powershell
Invoke-WebRequest -Method HEAD <url>
curl -I <url>
ping <host>
```

---

### Regla 2: Comandos que Requieren AprobaciÃƒÆ’Ã‚Â³n

Los siguientes comandos **SIEMPRE** requieren aprobaciÃƒÆ’Ã‚Â³n:

#### ModificaciÃƒÆ’Ã‚Â³n de Datos

```sql
DELETE FROM ...
TRUNCATE TABLE ...
UPDATE ... (sin WHERE clause)
DROP TABLE ...
```

#### Deployment a ProducciÃƒÆ’Ã‚Â³n

```bash
git push origin main (si hay cambios crÃƒÆ’Ã‚Â­ticos)
npx supabase functions deploy
npm run build && deploy
```

#### InstalaciÃƒÆ’Ã‚Â³n de Dependencias

```bash
npm install <package>
pip install <package>
```

---

### Regla 3: Modo Nightly Sync

Cuando se ejecuta `@[/nightly-sync]` o `.\nightly.ps1`:

- **Todos** los comandos del workflow son auto-aprobados
- El agente opera en modo 100% autÃƒÆ’Ã‚Â³nomo
- Se genera reporte completo al finalizar
- Se hace commit y push automÃƒÆ’Ã‚Â¡tico

---

### Regla 4: Manejo de Errores

Cuando un comando falla:

1. **Capturar** el error completo
2. **Documentar** en logs
3. **Intentar** soluciÃƒÆ’Ã‚Â³n automÃƒÆ’Ã‚Â¡tica si es seguro
4. **Reportar** al usuario si requiere intervenciÃƒÆ’Ã‚Â³n manual

---

### Regla de Negocio 4 (Soporte "Por Encargo")

- El sistema debe permitir la venta de cualquier carta, incluso si no hay stock fÃƒÆ’Ã‚Â­sico disponible (stock 0).
- Si un usuario intenta aÃƒÆ’Ã‚Â±adir al carrito una variante (Foil/NM) que no existe en el catÃƒÆ’Ã‚Â¡logo local (`products`), el sistema la crearÃƒÆ’Ã‚Â¡ automÃƒÆ’Ã‚Â¡ticamente con stock 0.
- Estas ÃƒÆ’Ã‚Â³rdenes se procesan bajo la etiqueta "POR ENCARGO" en el flujo de checkout y notificaciones.

---

## ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂºÃ‚Â  REGLAS TÃƒÆ’Ã¢â‚¬Â°CNICAS

### Herramientas CLI (Entorno Windows)

- **Supabase**: Se debe usar `npx supabase` para asegurar la compatibilidad con el entorno local del usuario.
- **Project Ref**: En comandos de despliegue, incluir siempre el flag `--project-ref` seguido del ID del proyecto (`sxuotvogwvmxuvwbsscv`) para garantizar que los cambios se apliquen al proyecto correcto.

### SincronizaciÃƒÆ’Ã‚Â³n de Edge Functions

- Si existen mÃƒÆ’Ã‚Âºltiples carpetas de funciones con lÃƒÆ’Ã‚Â³gica compartida (ej: `api/` y `tcg-api/`), todo cambio debe ser replicado en ambas antes de cualquier despliegue para evitar estados inconsistentes en el frontend.

### PrÃƒÆ’Ã‚Â¡ctica 1: Commits Descriptivos

Formato de commits:

```text
<type>: <description>

<body (opcional)>

<footer (opcional)>
```

Tipos vÃƒÆ’Ã‚Â¡lidos:

- `feat`: Nueva feature
- `fix`: Bugfix
- `docs`: DocumentaciÃƒÆ’Ã‚Â³n
- `refactor`: RefactorizaciÃƒÆ’Ã‚Â³n
- `test`: Tests
- `chore`: Mantenimiento
- `ÃƒÂ°Ã…Â¸Ã‚Â¤Ã¢â‚¬â€œ`: Commit autÃƒÆ’Ã‚Â³nomo del agente

---

### PrÃƒÆ’Ã‚Â¡ctica 2: Branches y Workflow

- `main`: ProducciÃƒÆ’Ã‚Â³n estable
- `develop`: Desarrollo activo
- `feature/*`: Nuevas features
- `hotfix/*`: Fixes urgentes

---

### PrÃƒÆ’Ã‚Â¡ctica 3: Code Review

Antes de merge a `main`:

1. Tests pasando
2. DocumentaciÃƒÆ’Ã‚Â³n actualizada
3. PRD compliance verificado
4. Performance aceptable

---

## ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã…Â  MÃƒÆ’Ã¢â‚¬Â°TRICAS DE CALIDAD

### MÃƒÆ’Ã‚Â©tricas Obligatorias

- **Test Coverage**: >80%
- **API Response Time**: <500ms (p95)
- **Error Rate**: <1%
- **Deployment Success**: >95%

### MÃƒÆ’Ã‚Â©tricas Deseables

- **Test Coverage**: >90%
- **API Response Time**: <200ms (p95)
- **Error Rate**: <0.1%
- **Deployment Success**: >99%

---

## ÃƒÂ°Ã…Â¸Ã…Â¡Ã‚Â¨ PROTOCOLO DE EMERGENCIA

### En Caso de ProducciÃƒÆ’Ã‚Â³n CaÃƒÆ’Ã‚Â­da

1. **Rollback** inmediato al ÃƒÆ’Ã‚Âºltimo commit estable
2. **Notificar** al usuario
3. **Documentar** el incidente
4. **Investigar** causa raÃƒÆ’Ã‚Â­z
5. **Implementar** fix y tests
6. **Desplegar** con verificaciÃƒÆ’Ã‚Â³n extra

### En Caso de PÃƒÆ’Ã‚Â©rdida de Datos

1. **DETENER** todas las operaciones
2. **Restaurar** desde backup mÃƒÆ’Ã‚Â¡s reciente
3. **Notificar** al usuario inmediatamente
4. **Documentar** el incidente
5. **Implementar** prevenciones

---

## ÃƒÂ°Ã…Â¸Ã¢â‚¬Â�Ã‚Âµ REGLAS DE NEGOCIO (TCG Specific)

### Regla 1: Precios de Geekorium

**Siempre** usar el precio de **Card Kingdom (NM)** para los ÃƒÆ’Ã‚Â­tems de **Geekorium**, a menos que un administrador especifique lo contrario explÃƒÆ’Ã‚Â­citamente. Esta es la fuente ÃƒÆ’Ã‚Âºnica de verdad para la valoraciÃƒÆ’Ã‚Â³n de la tienda. Si el precio de un acabado especÃƒÆ’Ã‚Â­fico (Foil/Etched) falta, el sistema debe aplicar un fallback automÃƒÆ’Ã‚Â¡tico al precio de mercado general (Nonfoil) antes de mostrar "S/P".

### Regla 2: ImportaciÃƒÆ’Ã‚Â³n Ambigua

Al importar cartas sin ediciÃƒÆ’Ã‚Â³n (Set) especÃƒÆ’Ã‚Â­fica, el sistema **siempre** debe priorizar la impresiÃƒÆ’Ã‚Â³n con el **valor de mercado mÃƒÆ’Ã‚Â¡s alto**.

### Regla 3: AgregaciÃƒÆ’Ã‚Â³n en Lotes (Bulk Import)

**Siempre** agregar o consolidar filas duplicadas (mismo `printing_id`, `condition` y `finish`) dentro de un mismo lote de importaciÃƒÆ’Ã‚Â³n antes de enviarlo a la base de datos. El sistema debe sumar las cantidades (`stock`) de las filas duplicadas para evitar errores de restricciÃƒÆ’Ã‚Â³n de unicidad (`ON CONFLICT`) durante el procesamiento por lotes.

### Regla 4: GestiÃƒÆ’Ã‚Â³n de Procesos y Estado

Antes de iniciar procesos de sincronizaciÃƒÆ’Ã‚Â³n pesados o de larga duraciÃƒÆ’Ã‚Â³n, se deben identificar y terminar instancias previas del mismo script para evitar condiciones de carrera, agotamiento de conexiones o el uso de credenciales/entornos obsoletos (`stale environment`).

---

### Ley 18: Performance en Sincronizaciones Masivas

**Siempre** utilizar actualizaciones en lote (Batch Updates) tipo `VALUES` single-statement para operaciones que involucren >1,000 registros.

- **ProhibiciÃƒÆ’Ã‚Â³n**: Evitar el uso de `executemany` o bucles de `UPDATE` individuales sobre conexiones de pool (ej: port 6543) para grandes volÃƒÆ’Ã‚Âºmenes de datos.
- **ImplementaciÃƒÆ’Ã‚Â³n**: Agrupar los cambios en chunks (ej: 2,000 filas) y ejecutar un solo `UPDATE ... FROM (VALUES ...)` para minimizar el round-trip y la latencia de red.

---

### Regla de Negocio 7: SincronizaciÃƒÆ’Ã‚Â³n SKU CardKingdom

**Siempre** priorizar el SKU de CardKingdom como fuente de verdad para el mapeo de coleccionistas y acabados (Finish) en sets modernos/tokens donde la data de Scryfall o `variation` sea ambigua.

- **Foil Detection**: El prefijo `F` en el SKU (ej: `FSOA-0022`) es la seÃƒÆ’Ã‚Â±al definitiva de acabado Foil/Etched.
- **Collector Number**: Extraer del SKU despuÃƒÆ’Ã‚Â©s del guion (`SOA-0022` -> `22`) eliminando ceros a la izquierda.
- **Prioridad de EdiciÃƒÆ’Ã‚Â³n**: Ante mÃƒÆ’Ã‚Âºltiples ediciones mapeadas al mismo cÃƒÆ’Ã‚Â³digo de set (ej: Strixhaven vs Secrets of Strixhaven), priorizar siempre la ediciÃƒÆ’Ã‚Â³n nominal completa ("Secrets of...") para evitar precios contaminados de aliases antiguos.

---

### ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“ CHANGELOG DE LEYES

### v3.4 (2026-04-17)

- ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Agregada **Ley 18**: Performance en Sincronizaciones Masivas (VALUES batch updates).
- ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Agregada **Regla de Negocio 7**: SincronizaciÃƒÆ’Ã‚Â³n SKU CardKingdom (F prefix & collector mapping).

### v2.8 (2026-03-11)

- ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Agregada **Ley 10**: Prioridad de Seguridad RLS (Mandato de 0 errores en Security Advisor).

### v2.9 (2026-03-11)

- ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Agregada **Ley 12**: ÃƒÆ’Ã…Â¡nica Fuente de Verdad para ConfiguraciÃƒÆ’Ã‚Â³n (.env) (ProhibiciÃƒÆ’Ã‚Â³n de mÃƒÆ’Ã‚Âºltiples archivos .env).
- ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Actualizada Regla de Negocio 1: Incluida menciÃƒÆ’Ã‚Â³n a la lÃƒÆ’Ã‚Â³gica de fallback por `collector_number`.

### v3.0 (2026-03-11)

- ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Agregada **Regla de OperaciÃƒÆ’Ã‚Â³n 4**: GestiÃƒÆ’Ã‚Â³n de Procesos y Estado (Control de procesos huÃƒÆ’Ã‚Â©rfanos).
- ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Documentadas lecciones #53 y #54 sobre diagnÃƒÆ’Ã‚Â³stico robusto y limpieza de entorno.

### v2.7 (2026-03-07)

- ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Actualizada Ley 9: Especificada segregaciÃƒÆ’Ã‚Â³n de ambientes (Main/Cloudflare vs Dev/GitHub Pages) y vinculaciÃƒÆ’Ã‚Â³n de ramas de Supabase.

### v2.7 (2026-03-10)

- ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Agregada Ley 11: Integridad de Branding.
- ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ ActualizaciÃƒÆ’Ã‚Â³n de Logo (`Logo.png`) y Favicon (`favicon.jpg`).
- ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ SincronizaciÃƒÆ’Ã‚Â³n de assets oficiales y eliminaciÃƒÆ’Ã‚Â³n de logos obsoletos.

### v2.6 (2026-03-07)

- ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Agregada Ley 8: SEO y Entornos No-Productivos (ProhibiciÃƒÆ’Ã‚Â³n de indexado en ramas que no sean main).

### v2.5 (2026-03-05)

- ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Agregada Ley 7: GestiÃƒÆ’Ã‚Â³n Segura de Secretos (ProhibiciÃƒÆ’Ã‚Â³n de secretos hardcodeados en producciÃƒÆ’Ã‚Â³n).

### v2.4 (2026-03-03)

- ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Agregada Regla de Negocio 3: AgregaciÃƒÆ’Ã‚Â³n obligatoria de duplicados en lotes de importaciÃƒÆ’Ã‚Â³n para soporte de FoliaciÃƒÆ’Ã‚Â³n (Finish).

### v2.3 (2026-02-12)

- ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Agregada Regla de Negocio 2: PriorizaciÃƒÆ’Ã‚Â³n de valor mÃƒÆ’Ã‚Â¡s alto en importaciones ambiguas.
- ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Actualizada Regla de Negocio 1: DefiniciÃƒÆ’Ã‚Â³n de Fallback de precios (Store -> Market).

### v2.2 (2026-02-08)

- ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Agregada Regla de Negocio 1: SincronizaciÃƒÆ’Ã‚Â³n de precios Geekorium con Card Kingdom.

### v2.1 (2026-02-06)

- ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Agregada Ley 6: Performance Garantizado (Uso obligatorio de Vistas Materializadas para queries masivas).

### v2.0 (2026-02-05)

- ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Agregada Ley 3: Testing Obligatorio con comandos auto-aprobados
- ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Agregada auto-aprobaciÃƒÆ’Ã‚Â³n de `.\run_tests.ps1`
- ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Agregada Regla 3: Modo Nightly Sync
- ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Documentado protocolo de emergencia

### v1.0 (2026-02-01)

- ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Leyes fundamentales establecidas
- ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Reglas de operaciÃƒÆ’Ã‚Â³n autÃƒÆ’Ã‚Â³noma definidas
- ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Mejores prÃƒÆ’Ã‚Â¡cticas documentadas

---

### Ley 14: Filtro de Stock Garantizado

**Siempre** filtrar los resultados para mostrar ÃƒÆ’Ã‚Âºnicamente ÃƒÆ’Ã‚Â­tems con existencia real (`stock > 0`) en las vistas de Marketplace y Detalle de Carta.

- **ImplementaciÃƒÆ’Ã‚Â³n**: El filtrado principal debe ocurrir en `api.ts` (`fetchCardDetails`) y en los RPCs de bÃƒÆ’Ã‚Âºsqueda (`get_products_filtered`).
- **ExcepciÃƒÆ’Ã‚Â³n**: Vistas administrativas de inventario o si el cliente solicita explÃƒÆ’Ã‚Â­citamente habilitar el modo "Archivo / Referencia".

---

### Ley 23: SincronizaciÃ³n de RPC (Evitar PGRST203)
**Siempre** incluir un bloque de limpieza dinÃ¡mica de sobrecargas al modificar la firma de una funciÃ³n RPC en PostgreSQL.

- **Mandato**: Antes de ejecutar `CREATE OR REPLACE FUNCTION`, se debe identificar y eliminar (`DROP FUNCTION ... CASCADE`) cualquier versiÃ³n anterior de la funciÃ³n con el mismo nombre pero distintos argumentos.
- **ImplementaciÃ³n**: Usar el patrÃ³n de bÃºsqueda en `pg_proc` para automatizar el borrado de todas las versiones sobrecargadas en el mismo script de migraciÃ³n.
- **PropÃ³sito**: Garantizar que PostgREST siempre tenga un Ãºnico candidato vÃ¡lido, evitando errores de ambigÃ¼edad `PGRST203` que bloquean la carga de datos en el frontend.

---

### Ley 24: Integridad de SincronizaciÃ³n en ProducciÃ³n
**Siempre** verificar la paridad entre `price_history`, `card_printings` y `products` tras una sincronizaciÃ³n de mercado masiva.

- **Mandato**: No se considera completada una sincronizaciÃ³n si el reporte de auditorÃ­a muestra desajustes (drifts) entre las tablas denormalizadas.
- **ImplementaciÃ³n**: Utilizar el patrÃ³n de `MATERIALIZED VIEW` temporal para realizar denormalizaciones atÃ³micas y evitar desajustes causados por bloqueos parciales o fallas de conexiÃ³n.
- **Refresco Obligatorio**: Todo cambio en precios de catÃ¡logo REQUIERE un `REFRESH MATERIALIZED VIEW CONCURRENTLY mv_unique_cards` para impactar el storefront sin downtime.

---

**Estas leyes son inmutables y deben ser respetadas en todo momento por el agente autÃ³nomo.**

### 13. SincronizaciÃƒÆ’Ã‚Â³n Estricta de Migraciones (CI/CD)

NingÃƒÆ’Ã‚Âºn archivo de migraciÃƒÆ’Ã‚Â³n SQL (`supabase/migrations/`) desplegado y registrado en la rama de `dev` o `main` debe ser borrado localmente para "limpiar". Si se requiere consolidar migraciones o eliminar versiones antiguas, se debe purgar su registro equivalente en la tabla `supabase_migrations.schema_migrations` del entorno remoto alojado correspondiente. De lo contrario, GitHub Actions y Supabase CLI fallarÃƒÆ’Ã‚Â¡n con un `Migration mismatch`.
---

### Regla de Negocio 5 (Integridad de Acabados / Finish)

**Nunca** permitir que un producto sea marcado como 'foil' si la impresiÃƒÆ’Ã‚Â³n base (`card_printings`) no soporta oficialmente ese acabado. En caso de duda durante una importaciÃƒÆ’Ã‚Â³n masiva, el sistema debe defaultear a 'nonfoil' a menos que se detecte una coincidencia exacta y exclusiva de la palabra 'foil' (evitando falsos positivos con 'nonfoil').
---

### Regla de Negocio 6 (ImportaciÃƒÆ’Ã‚Â³n Robusta - Foil Reliability)

**Siempre** validar la intenciÃƒÆ’Ã‚Â³n del acabado (foil/nonfoil) contra todas las fuentes disponibles en la metadata:
- Priorizar la coincidencia del array `finishes` de `card_printings` si el booleano `is_foil` es falso o ambiguo.
- **ValidaciÃƒÆ’Ã‚Â³n de Capa Superior**: El frontend debe emitir alertas si se detectan discrepancias entre el valor declarado (Precio) y el acabado seleccionado (ej. precio de foil en carta marcada como normal) para prevenir errores de mapeo del usuario.

- ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Actualizado **Protocolo de AuditorÃƒÆ’Ã‚Â­a**: InclusiÃƒÆ’Ã‚Â³n de buyer metadata en flujos de administraciÃƒÆ’Ã‚Â³n.

### v3.2 (2026-04-12)

- ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Agregada **Ley 15**: Resiliencia de Conectividad (Uso preferente de API REST para sincronizaciÃƒÆ’Ã‚Â³n masiva).

### v3.3 (2026-04-14)

- ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Agregada **Ley 16**: Cero Suposiciones (ObligaciÃƒÆ’Ã‚Â³n del agente de auditar/leer el cÃƒÆ’Ã‚Â³digo real con comandos antes de emitir o proponer cambios).

---

### Ley 15: Resiliencia de Conectividad (Cross-Branch Sync)

**Siempre** priorizar el uso de la API REST (PostgREST/HTTPS) sobre conexiones directas de Postgres (psycopg2/port 5432) al realizar tareas de sincronizaciÃƒÆ’Ã‚Â³n masiva entre ramas de Supabase, especialmente en entornos con restricciones de red o DNS inestables.

- **ImplementaciÃƒÆ’Ã‚Â³n**: Utilizar scripts basados en `requests` que consuman el endpoint de la API con el header `Prefer: resolution=merge-duplicates`.
- **Scripts de Referencia**: Mantener [**`sync_inventory_only.py`**](file:///c:/Users/carlo/OneDrive/Documents/Antigravity/TCG/scripts/debug/sync_inventory_only.py) como la herramienta estÃƒÆ’Ã‚Â¡ndar para duplicar estados de inventario entre entornos.

---

### Ley 16: Cero Suposiciones (Lectura Obligatoria - AI Agent)

**Nunca** proponer una soluciÃƒÆ’Ã‚Â³n estructurada ni ejecutar ediciones de cÃƒÆ’Ã‚Â³digo (`replace_file_content` / `write_to_file`) basÃƒÆ’Ã‚Â¡ndose ÃƒÆ’Ã‚Âºnicamente en la memoria o en el historial de la conversaciÃƒÆ’Ã‚Â³n.

- **AuditorÃƒÆ’Ã‚Â­a Previa**: **Siempre** utilizar las herramientas del sistema (como `view_file` o `grep_search`) para leer el estado ACTUAL y completo del archivo o funciÃƒÆ’Ã‚Â³n involucrada antes de hacer o sugerir cualquier modificaciÃƒÆ’Ã‚Â³n.
- **Seguridad**: Es obligatorio gastar tiempo computacional entendiendo el contexto real antes que romper la lÃƒÆ’Ã‚Â³gica de un sistema en funcionamiento por exceso de confianza del agente.

---

### Ley 17: GestiÃƒÂ³n de Novedades (Inventory & Marketplace)

**Siempre** utilizar el campo `updated_at` como fuente de verdad para identificar ÃƒÂ­tems "Nuevos" (re-stock o subida inicial).

- **Ventana de Novedad**: El estÃƒÂ¡ndar de visualizaciÃƒÂ³n es de **12 dÃƒÂ­as**.
- **LÃƒÂ³gica de Fallback (Graceful Degradation)**: Si el filtro de 12 dÃƒÂ­as no devuelve resultados, los RPCs financieros (`get_products_filtered`, `get_inventory_list`) deben ignorar automÃƒÂ¡ticamente la restricciÃƒÂ³n temporal para mostrar los ÃƒÂ­tems mÃƒÂ¡s recientes disponibles en stock, evitando listas vacÃƒÂ­as para el usuario.
- **Desacoplamiento**: El filtro "Nuevo" debe operar siempre como un **toggle independiente**. Nunca debe sobreescribir o bloquear la capacidad del usuario de ordenar los elementos por otras columnas (Precio, Nombre, Stock) mientras el filtro estÃƒÂ© activo.

## ??? LEYES DE EXPANSION OMNI-TCG (2026)

### Ley 18: EstandarizaciÃƒÂ³n de CÃƒÂ³digos de Juego
- **Mandato**: Toda nueva inserciÃƒÂ³n en products debe usar cÃƒÂ³digos de 3-4 letras: MTG, PKM, OPC, LOR, FAB, YGO, WIX, DGM, GDM, RFB.
- **ProhibiciÃƒÂ³n**: No usar IDs numÃƒÂ©ricos o nombres largos en la columna game.
- **Objetivo**: Garantizar visibilidad instantÃƒÂ¡nea en el buscador de la tienda.

### Ley 19: ProtecciÃƒÂ³n de Entornos (Dev vs Main)
- **VerificaciÃƒÂ³n**: Antes de scripts de mantenimiento, verificar el Project ID en .env.
- **ProducciÃƒÂ³n**: sxuotvogwvmxuvwbsscv (Geekorium Live).
- **Desarrollo**: bqfkqnnostzaqueujdms (Sandbox).
- **AcciÃƒÂ³n**: Abortar si el entorno no coincide con el objetivo del script.

### Ley 20: Integridad Visual de Ofertas (Dynamic Discounts)
- **Mandato**: Todo producto con descuento activo (`discount_percentage > 0` y `discount_until` no expirado) DEBE mostrar el Ribbon diagonal distintivo y el precio tachado.
- **Null-Safe Rendering**: Todo renderizado de precios y descuentos en la UI (especialmente en el Admin) DEBE usar el patrÃ³n de fallback `(val || 0)` antes de formatear con `.toFixed()`. Esto previene crashes fatales durante el ordenamiento de tablas con datos incompletos.
- **Visibilidad**: El Ribbon de descuento debe tener un `z-index` mÃ­nimo de `100` para garantizar que no sea ocultado por overlays de imÃ¡genes o gradientes.
- **CÃ¡lculo de Precio**: El precio de venta final debe calcularse como `original_price * (1 - discount_percentage / 100)`. La UI debe siempre mostrar el ahorro porcentual de forma prominente.
- **ExcepciÃ³n**: Productos con stock 0 o estado "Por Encargo" pueden omitir el ribbon si el descuento solo aplica a stock fÃ­sico inmediato, a menos que el admin especifique lo contrario.


## LEY 25: RESPIRACIÓN VISUAL PARA ANIMACIONES
Cualquier componente que utilice transformaciones de escala (scale) o traslación vertical (-translate-y) **debe** tener un contenedor con suficiente padding o overflow-visible para evitar recortes (clipping) en los bordes.

## LEY 26: IDENTIDAD DE MARCA TCG
Todos los logos de juegos TCG deben centralizarse en frontend/public/logos/tcg/. 
- La variante black/ (monocromo) se reserva para sidebars, listas pequeñas y UI de administración.
- La variante color/ se utiliza para selectores principales y elementos de alta jerarquía visual.

## LEY 27: SOPORTE DE GALERÍAS Y PREMIUM UX
Todo producto (especialmente Accesorios) con capacidad de múltiples vistas debe implementar un sistema de galería robusto.
- **Imagen Canónica**: El campo image_url en la base de datos debe representar siempre la imagen principal (canónica) para optimizar el renderizado en vistas de lista.
- **Persistencia**: Las imágenes adicionales deben almacenarse en un array de texto (dditional_images) para evitar múltiples registros innecesarios.
- **Interacción**: El visor de detalles (CardModal) debe transformar automáticamente la imagen estática en un carousel interactivo solo cuando existan imágenes adicionales, ahorrando recursos de animación en productos simples.
- **Transiciones**: Es obligatorio el uso de transiciones de opacidad y desenfoque (opacity + blur) para los cambios de imagen, garantizando una experiencia de usuario de alta gama ("Premium Feel").

## LEY 28: INTEGRIDAD DE RLS EN SUB-CONSULTAS
Toda tabla con RLS (Row Level Security) activado que sea referenciada en la cláusula `USING` de una policy de otra tabla, DEBE tener al menos una policy de lectura (`FOR SELECT`) que permita el acceso al agente que ejecuta la consulta (ej: `auth.uid()`). 
- Sin esta policy, el motor de base de datos retornará un conjunto vacío en la sub-consulta, provocando que la policy principal falle (ej: `EXISTS` será siempre `false`).

## LEY 29: OPTIMIZACIÓN DE ESPACIO EN FILTRADO (SIDEBARS)
Cualquier panel lateral (sidebar) que contenga más de 4 categorías de filtrado independientes DEBE implementar un patrón de secciones colapsables (tipo acordeón).
- **Estado Inicial**: Las secciones con filtros activos deben estar expandidas por defecto para proporcionar feedback inmediato sobre el estado de la búsqueda.
- **Visual**: Cada sección debe contar con un icono de estado (Chevron) y un indicador visual de actividad (punto de color o resalte) si tiene filtros seleccionados.
- **Transiciones**: El despliegue de las secciones debe ser animado para evitar saltos bruscos en el layout.


