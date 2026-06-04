# âš–ï¸� LEYES DEL SISTEMA - TCG Application

**VersiÃ³n**: 3.8
**Ãšltima ActualizaciÃ³n**: 2026-05-10 (TCG Code Canonicalization)
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
- `pnpm test`
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
- **Indices**: OBLIGATORIO crear Ã­ndices B-Tree o GIN para CADA columna usada en filtros o sorts ANTES de desplegar cÃ³digo que los use. Usar `pg_trgm` para bÃºsquedas de texto.
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

---

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
  - DB: Proyecto Supabase DEV (Sandbox).
- **Flujo de Trabajo**: Todo cambio DEBE validarse primero en el ambiente `dev` antes de ser integrado a `main`.

**Excepciones**: Ninguna.

---

### Ley 10: Prioridad de Seguridad RLS

**Siempre** habilitar Row Level Security (RLS) en todas las tablas y configurar `security_invoker = true` en todas las vistas de Supabase.

**Excepciones**: Ninguna.

---

### Ley 18: EstandarizaciÃ³n de CÃ³digos TCG (Ãšnica Fuente de Verdad)

- **Mandato**: Toda operaciÃ³n (Banners, Filtros, Productos, Cards) DEBE usar exclusivamente cÃ³digos canÃ³nicos de 3 letras: MTG, PKM, YGO, OPC, LOR, FAB, RFB, GND, DGM.
- **ProhibiciÃ³n**: Queda terminantemente prohibido el uso de IDs numÃ©ricos hardcodeados o la creaciÃ³n de capas de "normalizaciÃ³n" en el frontend que traduzcan cÃ³digos (ej. YGO -> YUGIOH). La DB es la fuente de verdad.
- **MigraciÃ³n**: Cualquier cÃ³digo legacy detectado (`POKEMON`, `YUGIOH`, `ONEPIECE`) debe ser migrado de inmediato al formato canÃ³nico.

---

### Ley 19: ProtecciÃ³n de Entornos (Dev vs Main)

- **VerificaciÃ³n**: Antes de scripts de mantenimiento, verificar el Project ID en .env.
- **ProducciÃ³n**: sxuotvogwvmxuvwbsscv (Geekorium Live).
- **Desarrollo**: bqfkqnnostzaqueujdms (Sandbox).
- **AcciÃ³n**: Abortar si el entorno no coincide con el objetivo del script.

---

### Ley 20: Integridad Visual de Ofertas (Dynamic Discounts)

- **Mandato**: Todo producto con descuento activo (`discount_percentage > 0` y `discount_until` no expirado) DEBE mostrar el Ribbon diagonal distintivo y el precio tachado.
- **Null-Safe Rendering**: Todo renderizado de precios y descuentos en la UI (especialmente en el Admin) DEBE usar el patrÃ³n de fallback `(val || 0)` antes de formatear con `.toFixed()`.
- **Visibilidad**: El Ribbon de descuento debe tener un `z-index` mÃ­nimo de `100`.

---

## ðŸŽ¨ DISEÃ‘O Y UX

### Ley 25: RESPIRACIÃ“N VISUAL PARA ANIMACIONES

Cualquier componente que utilice transformaciones de escala (scale) o traslaciÃ³n vertical (-translate-y) **debe** tener un contenedor con suficiente padding o overflow-visible para evitar recortes (clipping) en los bordes.

### Ley 26: IDENTIDAD DE MARCA TCG

Todos los logos de juegos TCG deben centralizarse en `frontend/public/logos/tcg/`. 
- La variante `black/` (monocromo) se reserva para sidebars, listas pequeÃ±as y UI de administraciÃ³n.
- La variante `color/` se utiliza para selectores principales y elementos de alta jerarquÃ­a visual.

### Ley 30: BRANDING MTG INMUTABLE

La marca para Magic: The Gathering debe ser siempre "MTG" en toda la interfaz de usuario. PROHIBIDO el uso del tÃ©rmino "SINGLES" para referirse al juego en cabeceras o selectores principales.

### Ley 31: VISIBILIDAD DE INVENTARIO CONDICIONAL

El acceso a la pestaÃ±a "Stock Geekorium" (inventario de cartas sueltas) debe estar condicionado a la selecciÃ³n activa del juego "MTG".

---

### Ley 32: NORMALIZACIÃ“N DE CÃ“DIGOS TCG (DEPRECIADA)

*Esta ley ha sido integrada en la Ley #18. Se prohÃ­be el uso de capas de traducciÃ³n en frontend; los cÃ³digos deben ser canÃ³nicos desde el origen.*

---

### Ley 33: INDEPENDENCIA DE BANNER Y DASHBOARD

La renderizaciÃ³n del Banner Hero (`HeroSection`) debe ser lÃ³gica y tÃ©cnicamente independiente de la renderizaciÃ³n del Dashboard de Ofertas.
- El Dashboard de Ofertas (Presale/Deals) se reserva exclusivamente para la Home Global o vistas de "Ofertas" especÃ­ficas.

---

### Ley 34: EVITAR SOBRECARGA DE FUNCIONES SQL (PGRST203)

**Siempre** que se modifique una funciÃ³n SQL existente usando `CREATE OR REPLACE FUNCTION`:
- Se **DEBE** respetar exactamente el mismo orden, nombre y tipo de los argumentos originales.
- Alterar el orden de los argumentos genera una funciÃ³n *sobrecargada* (overloaded) en lugar de reemplazarla, lo que causa errores fatales en Supabase/PostgREST (`PGRST203: Could not choose the best candidate function`).
- Si es indispensable cambiar el orden o eliminar argumentos, primero se debe ejecutar un `DROP FUNCTION IF EXISTS nombre_funcion(tipos_viejos);` explÃ­cito.

---

### Ley 35: APLICACIÃ“N MANUAL DE MIGRACIONES EN CLOUDFLARE

**Siempre** recordar que Cloudflare Pages **NO** aplica migraciones de base de datos automÃ¡ticamente al hacer push.
- Si se crean o modifican archivos `.sql` en `supabase/migrations/`, estos cambios deben aplicarse **manualmente** tanto en la base de datos de Desarrollo (`bqfkqn`) como en ProducciÃ³n (`sxuotvog`) usando herramientas MCP (`execute_sql`) o el Dashboard de Supabase para que tengan efecto real en el sistema.

---

### Ley 36: DIFERENCIACIÓN DE CATEGORY_CODE VS CATEGORY

En los endpoints de búsqueda (ej. `fetchAccessories`), **NUNCA** se debe pasar un valor de texto libre o etiqueta de UI (ej. 'Otros', 'Accesorios') al parámetro `category_code`. 
- `category_code` está reservado estrictamente para **códigos normalizados exactos** (ej. 'OTHER', 'BOOSTER_BOX').
- Para búsquedas basadas en etiquetas de UI, se debe usar el parámetro `category` heredado, el cual realiza una búsqueda con `ILIKE`.


---


---

### Ley 37: CENTRALIZACIÓN EN LA CONSTRUCCIÓN DE ENDPOINTS API EN EL FRONTEND

**Siempre** que se necesite invocar una Edge Function mediante una petición HTTP directa (etch) en lugar de los SDKs de Supabase:
- Se **DEBE** utilizar la función de utilidad getApiUrl() (o equivalente) para asegurar que se inyectan correctamente los prefijos necesarios (como /api o /tcg-api).
- Concatenar directamente API_BASE + '/endpoint' causa fallos 404 (Not Found) debido a las discrepancias de enrutamiento entre entornos (DEV vs PROD).
