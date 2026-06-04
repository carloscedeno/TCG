# ⚖️ LEYES DEL SISTEMA - TCG Application

**Versión**: 3.8
**Última Actualización**: 2026-05-10 (TCG Code Canonicalization)
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
- **Indices**: OBLIGATORIO crear índices B-Tree o GIN para CADA columna usada en filtros o sorts ANTES de desplegar código que los use. Usar `pg_trgm` para búsquedas de texto.
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

---

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
  - DB: Proyecto Supabase DEV (Sandbox).
- **Flujo de Trabajo**: Todo cambio DEBE validarse primero en el ambiente `dev` antes de ser integrado a `main`.

**Excepciones**: Ninguna.

---

### Ley 10: Prioridad de Seguridad RLS

**Siempre** habilitar Row Level Security (RLS) en todas las tablas y configurar `security_invoker = true` en todas las vistas de Supabase.

**Excepciones**: Ninguna.

---

### Ley 18: Estandarización de Códigos TCG (Única Fuente de Verdad)

- **Mandato**: Toda operación (Banners, Filtros, Productos, Cards) DEBE usar exclusivamente códigos canónicos de 3 letras: MTG, PKM, YGO, OPC, LOR, FAB, RFB, GND, DGM.
- **Prohibición**: Queda terminantemente prohibido el uso de IDs numéricos hardcodeados o la creación de capas de "normalización" en el frontend que traduzcan códigos (ej. YGO -> YUGIOH). La DB es la fuente de verdad.
- **Migración**: Cualquier código legacy detectado (`POKEMON`, `YUGIOH`, `ONEPIECE`) debe ser migrado de inmediato al formato canónico.

---

### Ley 19: Protección de Entornos (Dev vs Main)

- **Verificación**: Antes de scripts de mantenimiento, verificar el Project ID en .env.
- **Producción**: sxuotvogwvmxuvwbsscv (Geekorium Live).
- **Desarrollo**: bqfkqnnostzaqueujdms (Sandbox).
- **Acción**: Abortar si el entorno no coincide con el objetivo del script.

---

### Ley 20: Integridad Visual de Ofertas (Dynamic Discounts)

- **Mandato**: Todo producto con descuento activo (`discount_percentage > 0` y `discount_until` no expirado) DEBE mostrar el Ribbon diagonal distintivo y el precio tachado.
- **Null-Safe Rendering**: Todo renderizado de precios y descuentos en la UI (especialmente en el Admin) DEBE usar el patrón de fallback `(val || 0)` antes de formatear con `.toFixed()`.
- **Visibilidad**: El Ribbon de descuento debe tener un `z-index` mínimo de `100`.

---

## 🎨 DISEÑO Y UX

### Ley 25: RESPIRACIÓN VISUAL PARA ANIMACIONES

Cualquier componente que utilice transformaciones de escala (scale) o traslación vertical (-translate-y) **debe** tener un contenedor con suficiente padding o overflow-visible para evitar recortes (clipping) en los bordes.

### Ley 26: IDENTIDAD DE MARCA TCG

Todos los logos de juegos TCG deben centralizarse en `frontend/public/logos/tcg/`. 
- La variante `black/` (monocromo) se reserva para sidebars, listas pequeñas y UI de administración.
- La variante `color/` se utiliza para selectores principales y elementos de alta jerarquía visual.

### Ley 30: BRANDING MTG INMUTABLE

La marca para Magic: The Gathering debe ser siempre "MTG" en toda la interfaz de usuario. PROHIBIDO el uso del término "SINGLES" para referirse al juego en cabeceras o selectores principales.

### Ley 31: VISIBILIDAD DE INVENTARIO CONDICIONAL

El acceso a la pestaña "Stock Geekorium" (inventario de cartas sueltas) debe estar condicionado a la selección activa del juego "MTG".

---

### Ley 32: NORMALIZACIÓN DE CÓDIGOS TCG (DEPRECIADA)

*Esta ley ha sido integrada en la Ley #18. Se prohíbe el uso de capas de traducción en frontend; los códigos deben ser canónicos desde el origen.*

---

### Ley 33: INDEPENDENCIA DE BANNER Y DASHBOARD

La renderización del Banner Hero (`HeroSection`) debe ser lógica y técnicamente independiente de la renderización del Dashboard de Ofertas.
- El Dashboard de Ofertas (Presale/Deals) se reserva exclusivamente para la Home Global o vistas de "Ofertas" específicas.

---

### Ley 34: EVITAR SOBRECARGA DE FUNCIONES SQL (PGRST203)

**Siempre** que se modifique una función SQL existente usando `CREATE OR REPLACE FUNCTION`:
- Se **DEBE** respetar exactamente el mismo orden, nombre y tipo de los argumentos originales.
- Alterar el orden de los argumentos genera una función *sobrecargada* (overloaded) en lugar de reemplazarla, lo que causa errores fatales en Supabase/PostgREST (`PGRST203: Could not choose the best candidate function`).
- Si es indispensable cambiar el orden o eliminar argumentos, primero se debe ejecutar un `DROP FUNCTION IF EXISTS nombre_funcion(tipos_viejos);` explícito.

---

### Ley 35: APLICACIÓN MANUAL DE MIGRACIONES EN CLOUDFLARE

**Siempre** recordar que Cloudflare Pages **NO** aplica migraciones de base de datos automáticamente al hacer push.
- Si se crean o modifican archivos `.sql` en `supabase/migrations/`, estos cambios deben aplicarse **manualmente** tanto en la base de datos de Desarrollo (`bqfkqn`) como en Producción (`sxuotvog`) usando herramientas MCP (`execute_sql`) o el Dashboard de Supabase para que tengan efecto real en el sistema.

---

### Ley 36: DIFERENCIACI�N DE CATEGORY_CODE VS CATEGORY

En los endpoints de b�squeda (ej. `fetchAccessories`), **NUNCA** se debe pasar un valor de texto libre o etiqueta de UI (ej. 'Otros', 'Accesorios') al par�metro `category_code`. 
- `category_code` est� reservado estrictamente para **c�digos normalizados exactos** (ej. 'OTHER', 'BOOSTER_BOX').
- Para b�squedas basadas en etiquetas de UI, se debe usar el par�metro `category` heredado, el cual realiza una b�squeda con `ILIKE`.


---


---

### Ley 37: CENTRALIZACI�N EN LA CONSTRUCCI�N DE ENDPOINTS API EN EL FRONTEND

**Siempre** que se necesite invocar una Edge Function mediante una petici�n HTTP directa (etch) en lugar de los SDKs de Supabase:
- Se **DEBE** utilizar la funci�n de utilidad getApiUrl() (o equivalente) para asegurar que se inyectan correctamente los prefijos necesarios (como /api o /tcg-api).
- Concatenar directamente API_BASE + '/endpoint' causa fallos 404 (Not Found) debido a las discrepancias de enrutamiento entre entornos (DEV vs PROD).
