# ⚖️ LEYES DEL SISTEMA - TCG Application

**Versión**: 2.8
**Última Actualización**: 2026-04-15 (Filtro Global Nuevo)
**Propósito**: Definir reglas inmutables para operación autónoma del agente

---

## 🔴 LEYES FUNDAMENTALES (Nunca Violar)

### Ley 1: Integridad de Datos

**Nunca** ejecutar comandos que puedan:

- Eliminar datos de producción sin backup
- Truncar tablas sin confirmación explícita
- Modificar esquemas de base de datos sin migration

**Excepciones**: Ninguna

---

### Ley 2: Deployment Seguro

**Siempre** seguir el checklist de deployment:

1. Verificar cambios locales (`git status`)
2. Commit con mensaje descriptivo
3. Push a GitHub
4. Desplegar Edge Functions si se modificaron
5. Verificar en producción

**Excepciones**: Ninguna

---

### Ley 3: Testing Obligatorio

**Siempre** ejecutar tests antes de deployment a producción.

**Comandos de Confianza** (Auto-aprobados, nunca requieren confirmación):

- `.\run_tests.ps1`
- `python -m pytest`
- `npm test`
- `python check_api_health.py`
- `python check_products_health.py`

**Excepciones**: Tests pueden omitirse en hotfixes críticos, pero deben ejecutarse inmediatamente después.

---

### Ley 4: Documentación Obligatoria

**Siempre** documentar:

- Cambios significativos en código
- Bugs encontrados y sus soluciones
- Decisiones de diseño importantes
- Sesiones de trabajo en `SESION_*.md`

**Excepciones**: Cambios triviales (typos, formatting)

---

### Ley 5: PRD como Source of Truth

**Siempre** consultar `PRD.md` antes de:

- Implementar nuevas features
- Modificar comportamiento existente
- Tomar decisiones de diseño

**Excepciones**: Bugfixes que no afectan funcionalidad

---

### Ley 6: Performance Garantizado (La Regla del Tiempo Real)

**Siempre** validar que las consultas críticas respondan en <200ms.

- **Denormalización Extrema**: Si una consulta de filtrado (marketplace/buscador) requiere más de 2 joins en tablas masivas (>50k filas), es **OBLIGATORIO** denormalizar los metadatos de filtrado (`colors`, `type`, `release_date`) a la tabla principal (`products`).
- **RPC Single-Table**: Los RPCs de búsqueda deben tender a ser consultas de una sola tabla sobre datos denormalizados para maximizar la velocidad de los índices.
- **Indices**: OBLIGATORIO crear índices B-Tree o GIN para CADA columna usada en filtros o sorts ANTES de desplegar código que los use. Usar `pg_trgm` para bÃºsquedas de texto.
- **Timeouts**: Si una query da timeout (500), la solución NO es aumentar el timeout, es optimizar la query (generalmente denormalizando o pasando a Materialized View).
- **Almacenamiento Diferencial**: PROHIBIDO guardar snapshots diarios de datos que no cambian. Siempre implementar lógica de comparación en la ingesta.

**Excepciones**: Consultas analíticas offline o scripts de migración manual.

---

### Ley 7: Gestión Segura de Secretos

**Nunca** hardcodear secretos reales (passwords, API keys, tokens) en archivos `.env` o archivos de configuración persistentes para entornos de producción.

- **Validación Estricta**: Las aplicaciones deben validar la existencia de secretos en variables de entorno del sistema al iniciar.
- **Placeholders**: Usar solo placeholders (ej. `SET_ME_VIA_ENV_VAR`) en archivos `.env` locales.
- **Acceso Directo**: En producción, leer siempre desde variables de entorno del host o gestores de secretos.

**Excepciones**: Ninguna.

### Ley 8: SEO y Entornos No-Productivos

**Siempre** desactivar el indexado por motores de búsqueda en entornos de desarrollo, preview o staging.

- **Configuración**: El tag `<meta name="robots" />` debe estar en `noindex, nofollow` para cualquier rama que no sea `main`.
- **Implementación**: Usar variables de entorno de Vite (`VITE_ROBOTS`) para controlar este comportamiento dinámicamente según el branch de despliegue en Cloudflare.

**Excepciones**: Ninguna.

---

### Ley 9: Segregación de Ambientes y Hosting

**Siempre** usar instancias de base de datos y entornos de hosting independientes para producción y desarrollo.

- **Ambiente de Producción**:
  - Branch: `main`
  - Hosting: Cloudflare Pages (`geekorium.shop`)
  - DB: Proyecto Supabase principal.
- **Ambiente de Desarrollo (DEV)**:
  - Branch: `dev`
  - Hosting: GitHub Pages (`dev.geekorium.shop`)
  - DB: Branch de Supabase vinculada a la rama `dev`.
- **Flujo de Trabajo**: Todo cambio DEBE validarse primero en el ambiente `dev` antes de ser integrado a `main`.
- **Configuración**: La inyección de variables de entorno debe ser específica por cada plataforma de hosting.

**Excepciones**: Ninguna.

---

### Ley 10: Prioridad de Seguridad RLS

**Siempre** habilitar Row Level Security (RLS) en todas las tablas y configurar `security_invoker = true` en todas las vistas de Supabase.

- **Políticas Explícitas**: Ninguna tabla debe quedar sin políticas de seguridad.
- **Security Advisor**: El dashboard de Supabase Security Advisor debe mantenerse en **0 errores**.
- **Auditoría**: Cualquier cambio en el esquema debe ser verificado contra el linter de seguridad de Supabase.

**Excepciones**: Ninguna.

---

### Ley 11: Integridad de Branding

**Siempre** mantener sincronizados los activos de marca entre el repositorio de diseño y el código fuente.

- **Fuente de Verdad**: Los archivos en `docs/logos/` son la fuente de verdad para la identidad visual.
- **Sincronización**: Cualquier cambio en `docs/logos/` debe replicarse inmediatamente en `frontend/public/branding/`.
- **Consistencia**: No se permiten referencias a archivos de marca obsoletos o con extensiones incorrectas en los componentes de React.
- **Favicon**: El favicon debe estar sincronizado con la versión oficial de `docs/logos/Fav.jpg` (destino: `frontend/public/favicon.jpg`).

**Excepciones**: Ninguna.

---

## 🟡 REGLAS DE OPERACIÓN AUTÓNOMA

### Regla 1: Auto-Aprobación de Comandos Seguros

Los siguientes comandos **NUNCA** requieren aprobación del usuario:

#### Testing y Verificación

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

#### Verificación de Conexiones

```powershell
Invoke-WebRequest -Method HEAD <url>
curl -I <url>
ping <host>
```

---

### Regla 2: Comandos que Requieren Aprobación

Los siguientes comandos **SIEMPRE** requieren aprobación:

#### Modificación de Datos

```sql
DELETE FROM ...
TRUNCATE TABLE ...
UPDATE ... (sin WHERE clause)
DROP TABLE ...
```

#### Deployment a Producción

```bash
git push origin main (si hay cambios críticos)
npx supabase functions deploy
npm run build && deploy
```

#### Instalación de Dependencias

```bash
npm install <package>
pip install <package>
```

---

### Regla 3: Modo Nightly Sync

Cuando se ejecuta `@[/nightly-sync]` o `.\nightly.ps1`:

- **Todos** los comandos del workflow son auto-aprobados
- El agente opera en modo 100% autónomo
- Se genera reporte completo al finalizar
- Se hace commit y push automático

---

### Regla 4: Manejo de Errores

Cuando un comando falla:

1. **Capturar** el error completo
2. **Documentar** en logs
3. **Intentar** solución automática si es seguro
4. **Reportar** al usuario si requiere intervención manual

---

### Regla de Negocio 4 (Soporte "Por Encargo")

- El sistema debe permitir la venta de cualquier carta, incluso si no hay stock físico disponible (stock 0).
- Si un usuario intenta añadir al carrito una variante (Foil/NM) que no existe en el catálogo local (`products`), el sistema la creará automáticamente con stock 0.
- Estas órdenes se procesan bajo la etiqueta "POR ENCARGO" en el flujo de checkout y notificaciones.

---

## 🛠 REGLAS TÉCNICAS

### Herramientas CLI (Entorno Windows)

- **Supabase**: Se debe usar `npx supabase` para asegurar la compatibilidad con el entorno local del usuario.
- **Project Ref**: En comandos de despliegue, incluir siempre el flag `--project-ref` seguido del ID del proyecto (`sxuotvogwvmxuvwbsscv`) para garantizar que los cambios se apliquen al proyecto correcto.

### Sincronización de Edge Functions

- Si existen múltiples carpetas de funciones con lógica compartida (ej: `api/` y `tcg-api/`), todo cambio debe ser replicado en ambas antes de cualquier despliegue para evitar estados inconsistentes en el frontend.

### Práctica 1: Commits Descriptivos

Formato de commits:

```text
<type>: <description>

<body (opcional)>

<footer (opcional)>
```

Tipos válidos:

- `feat`: Nueva feature
- `fix`: Bugfix
- `docs`: Documentación
- `refactor`: Refactorización
- `test`: Tests
- `chore`: Mantenimiento
- `🤖`: Commit autónomo del agente

---

### Práctica 2: Branches y Workflow

- `main`: Producción estable
- `develop`: Desarrollo activo
- `feature/*`: Nuevas features
- `hotfix/*`: Fixes urgentes

---

### Práctica 3: Code Review

Antes de merge a `main`:

1. Tests pasando
2. Documentación actualizada
3. PRD compliance verificado
4. Performance aceptable

---

## 📊 MÉTRICAS DE CALIDAD

### Métricas Obligatorias

- **Test Coverage**: >80%
- **API Response Time**: <500ms (p95)
- **Error Rate**: <1%
- **Deployment Success**: >95%

### Métricas Deseables

- **Test Coverage**: >90%
- **API Response Time**: <200ms (p95)
- **Error Rate**: <0.1%
- **Deployment Success**: >99%

---

## 🚨 PROTOCOLO DE EMERGENCIA

### En Caso de Producción Caída

1. **Rollback** inmediato al último commit estable
2. **Notificar** al usuario
3. **Documentar** el incidente
4. **Investigar** causa raíz
5. **Implementar** fix y tests
6. **Desplegar** con verificación extra

### En Caso de Pérdida de Datos

1. **DETENER** todas las operaciones
2. **Restaurar** desde backup más reciente
3. **Notificar** al usuario inmediatamente
4. **Documentar** el incidente
5. **Implementar** prevenciones

---

## 🔵 REGLAS DE NEGOCIO (TCG Specific)

### Regla 1: Precios de Geekorium

**Siempre** usar el precio de **Card Kingdom (NM)** para los ítems de **Geekorium**, a menos que un administrador especifique lo contrario explícitamente. Esta es la fuente única de verdad para la valoración de la tienda. Si el precio de un acabado específico (Foil/Etched) falta, el sistema debe aplicar un fallback automático al precio de mercado general (Nonfoil) antes de mostrar "S/P".

### Regla 2: Importación Ambigua

Al importar cartas sin edición (Set) específica, el sistema **siempre** debe priorizar la impresión con el **valor de mercado más alto**.

### Regla 3: Agregación en Lotes (Bulk Import)

**Siempre** agregar o consolidar filas duplicadas (mismo `printing_id`, `condition` y `finish`) dentro de un mismo lote de importación antes de enviarlo a la base de datos. El sistema debe sumar las cantidades (`stock`) de las filas duplicadas para evitar errores de restricción de unicidad (`ON CONFLICT`) durante el procesamiento por lotes.

### Regla 4: Gestión de Procesos y Estado

Antes de iniciar procesos de sincronización pesados o de larga duración, se deben identificar y terminar instancias previas del mismo script para evitar condiciones de carrera, agotamiento de conexiones o el uso de credenciales/entornos obsoletos (`stale environment`).

---

## 📝 CHANGELOG DE LEYES

### v2.8 (2026-03-11)

- ✅ Agregada **Ley 10**: Prioridad de Seguridad RLS (Mandato de 0 errores en Security Advisor).

### v2.9 (2026-03-11)

- ✅ Agregada **Ley 12**: Única Fuente de Verdad para Configuración (.env) (Prohibición de múltiples archivos .env).
- ✅ Actualizada Regla de Negocio 1: Incluida mención a la lógica de fallback por `collector_number`.

### v3.0 (2026-03-11)

- ✅ Agregada **Regla de Operación 4**: Gestión de Procesos y Estado (Control de procesos huérfanos).
- ✅ Documentadas lecciones #53 y #54 sobre diagnóstico robusto y limpieza de entorno.

### v2.7 (2026-03-07)

- ✅ Actualizada Ley 9: Especificada segregación de ambientes (Main/Cloudflare vs Dev/GitHub Pages) y vinculación de ramas de Supabase.

### v2.7 (2026-03-10)

- ✅ Agregada Ley 11: Integridad de Branding.
- ✅ Actualización de Logo (`Logo.png`) y Favicon (`favicon.jpg`).
- ✅ Sincronización de assets oficiales y eliminación de logos obsoletos.

### v2.6 (2026-03-07)

- ✅ Agregada Ley 8: SEO y Entornos No-Productivos (Prohibición de indexado en ramas que no sean main).

### v2.5 (2026-03-05)

- ✅ Agregada Ley 7: Gestión Segura de Secretos (Prohibición de secretos hardcodeados en producción).

### v2.4 (2026-03-03)

- ✅ Agregada Regla de Negocio 3: Agregación obligatoria de duplicados en lotes de importación para soporte de Foliación (Finish).

### v2.3 (2026-02-12)

- ✅ Agregada Regla de Negocio 2: Priorización de valor más alto en importaciones ambiguas.
- ✅ Actualizada Regla de Negocio 1: Definición de Fallback de precios (Store -> Market).

### v2.2 (2026-02-08)

- ✅ Agregada Regla de Negocio 1: Sincronización de precios Geekorium con Card Kingdom.

### v2.1 (2026-02-06)

- ✅ Agregada Ley 6: Performance Garantizado (Uso obligatorio de Vistas Materializadas para queries masivas).

### v2.0 (2026-02-05)

- ✅ Agregada Ley 3: Testing Obligatorio con comandos auto-aprobados
- ✅ Agregada auto-aprobación de `.\run_tests.ps1`
- ✅ Agregada Regla 3: Modo Nightly Sync
- ✅ Documentado protocolo de emergencia

### v1.0 (2026-02-01)

- ✅ Leyes fundamentales establecidas
- ✅ Reglas de operación autónoma definidas
- ✅ Mejores prácticas documentadas

---

### Ley 14: Filtro de Stock Garantizado

**Siempre** filtrar los resultados para mostrar únicamente ítems con existencia real (`stock > 0`) en las vistas de Marketplace y Detalle de Carta.

- **Implementación**: El filtrado principal debe ocurrir en `api.ts` (`fetchCardDetails`) y en los RPCs de búsqueda (`get_products_filtered`).
- **Excepción**: Vistas administrativas de inventario o si el cliente solicita explícitamente habilitar el modo "Archivo / Referencia".

---

**Estas leyes son inmutables y deben ser respetadas en todo momento por el agente autónomo.**

### 13. Sincronización Estricta de Migraciones (CI/CD)

Ningún archivo de migración SQL (`supabase/migrations/`) desplegado y registrado en la rama de `dev` o `main` debe ser borrado localmente para "limpiar". Si se requiere consolidar migraciones o eliminar versiones antiguas, se debe purgar su registro equivalente en la tabla `supabase_migrations.schema_migrations` del entorno remoto alojado correspondiente. De lo contrario, GitHub Actions y Supabase CLI fallarán con un `Migration mismatch`.
---

### Regla de Negocio 5 (Integridad de Acabados / Finish)

**Nunca** permitir que un producto sea marcado como 'foil' si la impresión base (`card_printings`) no soporta oficialmente ese acabado. En caso de duda durante una importación masiva, el sistema debe defaultear a 'nonfoil' a menos que se detecte una coincidencia exacta y exclusiva de la palabra 'foil' (evitando falsos positivos con 'nonfoil').
---

### Regla de Negocio 6 (Importación Robusta - Foil Reliability)

**Siempre** validar la intención del acabado (foil/nonfoil) contra todas las fuentes disponibles en la metadata:
- Priorizar la coincidencia del array `finishes` de `card_printings` si el booleano `is_foil` es falso o ambiguo.
- **Validación de Capa Superior**: El frontend debe emitir alertas si se detectan discrepancias entre el valor declarado (Precio) y el acabado seleccionado (ej. precio de foil en carta marcada como normal) para prevenir errores de mapeo del usuario.

- ✅ Actualizado **Protocolo de Auditoría**: Inclusión de buyer metadata en flujos de administración.

### v3.2 (2026-04-12)

- ✅ Agregada **Ley 15**: Resiliencia de Conectividad (Uso preferente de API REST para sincronización masiva).

### v3.3 (2026-04-14)

- ✅ Agregada **Ley 16**: Cero Suposiciones (Obligación del agente de auditar/leer el código real con comandos antes de emitir o proponer cambios).

---

### Ley 15: Resiliencia de Conectividad (Cross-Branch Sync)

**Siempre** priorizar el uso de la API REST (PostgREST/HTTPS) sobre conexiones directas de Postgres (psycopg2/port 5432) al realizar tareas de sincronización masiva entre ramas de Supabase, especialmente en entornos con restricciones de red o DNS inestables.

- **Implementación**: Utilizar scripts basados en `requests` que consuman el endpoint de la API con el header `Prefer: resolution=merge-duplicates`.
- **Scripts de Referencia**: Mantener [**`sync_inventory_only.py`**](file:///c:/Users/carlo/OneDrive/Documents/Antigravity/TCG/scripts/debug/sync_inventory_only.py) como la herramienta estándar para duplicar estados de inventario entre entornos.

---

### Ley 16: Cero Suposiciones (Lectura Obligatoria - AI Agent)

**Nunca** proponer una solución estructurada ni ejecutar ediciones de código (`replace_file_content` / `write_to_file`) basándose únicamente en la memoria o en el historial de la conversación.

- **Auditoría Previa**: **Siempre** utilizar las herramientas del sistema (como `view_file` o `grep_search`) para leer el estado ACTUAL y completo del archivo o función involucrada antes de hacer o sugerir cualquier modificación.
- **Seguridad**: Es obligatorio gastar tiempo computacional entendiendo el contexto real antes que romper la lógica de un sistema en funcionamiento por exceso de confianza del agente.

---

### Ley 17: Gestión de Novedades (Inventory & Marketplace)

**Siempre** utilizar el campo `updated_at` como fuente de verdad para identificar ítems "Nuevos" (re-stock o subida inicial).

- **Ventana de Novedad**: El estándar de visualización es de **12 días**.
- **Lógica de Fallback (Graceful Degradation)**: Si el filtro de 12 días no devuelve resultados, los RPCs financieros (`get_products_filtered`, `get_inventory_list`) deben ignorar automáticamente la restricción temporal para mostrar los ítems más recientes disponibles en stock, evitando listas vacías para el usuario.
- **Desacoplamiento**: El filtro "Nuevo" debe operar siempre como un **toggle independiente**. Nunca debe sobreescribir o bloquear la capacidad del usuario de ordenar los elementos por otras columnas (Precio, Nombre, Stock) mientras el filtro esté activo.
