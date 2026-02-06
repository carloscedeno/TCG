# PRD - Corrección de Sistema de Filtros

**Versión**: 1.0  
**Fecha de Creación**: 2026-02-05  
**Prioridad**: 🔴 ALTA  
**Estimación**: 80-100 minutos  
**Owner**: Antigravity AI

---

## 1. Contexto y Problema

### 1.1 Situación Actual

El usuario reportó que **"los filtros según el prd inicial no existen y no están funcionando"**. Esto afecta la experiencia principal de búsqueda y navegación de cartas en la aplicación.

### 1.2 Impacto

- **UX**: Los usuarios no pueden filtrar cartas efectivamente
- **Business**: Reduce la utilidad de la plataforma como herramienta de búsqueda
- **SEO**: Afecta la capacidad de encontrar cartas específicas

### 1.3 Filtros Esperados (según PRD original)

Según `PRD.md` líneas 28-31:

- ✓ **Game** (Magic, Pokemon, Lorcana, etc.)
- ✓ **Set/Edition** (expansiones específicas)
- ✓ **Rarity** (Common, Uncommon, Rare, Mythic)
- ✓ **Color** (Red, Blue, Green, White, Black, Colorless)
- ✓ **Type** (Creature, Instant, Sorcery, etc.)
- ✓ **Year Range** (filtro por año de lanzamiento)
- ✓ **Search/Query** (búsqueda parcial con ILIKE - ya implementado)

**Nota**: El filtro de búsqueda (`q` parameter) ya está implementado con `ILIKE` para búsqueda parcial en:

- Backend (línea 259): `query.ilike('cards.card_name',`%${q}%`)`
- Frontend fallback (línea 81): `query.ilike('cards.card_name',`%${filters.q}%`)`

Si el usuario reporta que no funciona, verificar:

1. Que el Edge Function esté desplegado correctamente
2. Que no haya errores 500 en los logs
3. Que el parámetro `q` se esté pasando correctamente desde el frontend

---

## 2. Objetivos del Proyecto

### 2.1 Objetivos Primarios

1. **Diagnosticar** exactamente qué filtros no funcionan
2. **Identificar** la causa raíz (frontend, backend, o base de datos)
3. **Implementar** fixes para todos los filtros
4. **Verificar** que funcionen correctamente en producción

### 2.2 Objetivos Secundarios

1. Documentar el problema y la solución
2. Crear tests para prevenir regresiones
3. Optimizar performance de filtros si es necesario

### 2.3 Criterios de Éxito

- ✅ Todos los filtros aplican correctamente
- ✅ Combinaciones de filtros funcionan (ej: Game + Rarity)
- ✅ Response time < 500ms para queries filtradas
- ✅ Tests automatizados pasan
- ✅ Documentación completa

---

## 3. Alcance del Proyecto

### 3.1 En Alcance

- ✅ Diagnóstico completo de todos los filtros
- ✅ Corrección de bugs en frontend
- ✅ Corrección de bugs en Edge Function
- ✅ Optimización de queries si causan timeout
- ✅ Tests de integración
- ✅ Documentación técnica

### 3.2 Fuera de Alcance

- ❌ Agregar nuevos filtros no especificados en PRD
- ❌ Rediseño visual de la UI de filtros
- ❌ Migración de base de datos (solo índices si es necesario)

---

## 4. Plan de Implementación

### Fase 1: Diagnóstico (15-20 min)

#### 4.1.1 Verificación Visual en Producción

**Herramienta**: Browser Subagent

**Acciones**:

1. Navegar a `https://carloscedeno.github.io/TCG/`
2. Probar cada filtro individualmente:

   ```
   - [ ] Game filter (Magic, Pokemon, etc.)
   - [ ] Set/Edition filter (dropdown)
   - [ ] Rarity filter (Common, Rare, etc.)
   - [ ] Color filter (Red, Blue, etc.)
   - [ ] Type filter (Creature, Instant, etc.)
   - [ ] Year Range filter (slider)
   ```

3. Documentar comportamiento:
   - ✅ Funciona correctamente
   - ❌ No filtra nada
   - ⚠️ Filtra parcialmente

**Entregable**: Screenshot de cada filtro + tabla de resultados

---

#### 4.1.2 Verificación de Network Requests

**Herramienta**: Browser DevTools

**Acciones**:

1. Abrir DevTools → Network tab
2. Aplicar filtro "Game = Pokemon"
3. Capturar request:

   ```
   URL esperada: /api/cards?game=Pokemon&limit=50
   Status esperado: 200
   Response esperado: { cards: [...], total_count: N }
   ```

4. Verificar parámetros en URL
5. Verificar response del servidor

**Entregable**: Screenshot de Network tab + JSON response

---

#### 4.1.3 Análisis de Código Frontend

**Archivos a Revisar**:

- `frontend/src/pages/Home.tsx` (líneas 89-101)
- `frontend/src/utils/api.ts` (función `fetchCards`)

**Verificaciones**:

```typescript
// ✓ Estado de filtros se actualiza
const [filters, setFilters] = useState({...});

// ✓ Parámetros se construyen correctamente
const cardRes = await fetchCards({
  game: filters.games?.join(','),
  set: filters.sets?.join(','),
  rarity: filters.rarities?.join(','),
  color: filters.colors?.join(',')
});

// ✓ Request incluye parámetros
const url = `${API_BASE}/api/cards?${params}`;
```

**Entregable**: Reporte de código con issues encontrados

---

#### 4.1.4 Análisis de Edge Function

**Archivo**: `supabase/functions/tcg-api/index.ts`

**Verificaciones**:

```typescript
// ✓ Parámetros se extraen del request
const { game, set, rarity, color } = params;

// ✓ Joins correctos para filtrado
const cardsJoin = (rarity || color) ? "cards!inner" : "cards";

// ✓ Filtros se aplican al query
if (game) query = query.eq('cards.game', game);
if (rarity) query = query.eq('cards.rarity', rarity);
```

**Entregable**: Reporte de lógica de filtrado

---

### Fase 2: Identificación de Problemas (10 min)

#### 4.2.1 Categorización de Issues

**Plantilla de Issue**:

```markdown
### Issue #N: [Nombre del Filtro] no funciona

**Tipo**: Frontend / Backend / Database
**Severidad**: Critical / High / Medium / Low
**Síntoma**: [Descripción del comportamiento]
**Causa Raíz**: [Análisis técnico]
**Fix Propuesto**: [Solución]
```

#### 4.2.2 Problemas Comunes a Buscar

**Frontend**:

- [ ] Estado de filtros no se actualiza (`setFilters` no se llama)
- [ ] Parámetros no se pasan a `fetchCards()`
- [ ] URL encoding incorrecto (espacios, caracteres especiales)
- [ ] Debounce demasiado largo (usuario no ve cambios)

**Backend**:

- [ ] Parámetros no se extraen del request
- [ ] Joins incorrectos (left join en vez de inner join)
- [ ] Filtros no se aplican al query de Supabase
- [ ] Case sensitivity en comparaciones

**Base de Datos**:

- [ ] Datos faltantes (campo `color` vacío)
- [ ] Formato incorrecto (`["Red"]` vs `"Red"`)
- [ ] Índices faltantes (causa timeout)

**Entregable**: Lista priorizada de issues con causa raíz

---

### Fase 3: Implementación de Fixes (30-45 min)

#### 4.3.1 Fix Frontend

**Escenario A**: Filtros no se pasan al API

```typescript
// File: frontend/src/pages/Home.tsx

// ANTES (ROTO)
const cardRes = await fetchCards({
  q: debouncedQuery,
  limit: LIMIT,
  offset
});

// DESPUÉS (FUNCIONAL)
const cardRes = await fetchCards({
  q: debouncedQuery,
  game: filters.games && filters.games.length > 0 ? filters.games.join(',') : undefined,
  set: filters.sets && filters.sets.length > 0 ? filters.sets.join(',') : undefined,
  rarity: activeRarity !== 'All' ? activeRarity : (filters.rarities && filters.rarities.length > 0 ? filters.rarities.join(',') : undefined),
  color: filters.colors && filters.colors.length > 0 ? filters.colors.join(',') : undefined,
  type: filters.types && filters.types.length > 0 ? filters.types.join(',') : undefined,
  year_from: filters.yearRange ? filters.yearRange[0] : undefined,
  year_to: filters.yearRange ? filters.yearRange[1] : undefined,
  limit: LIMIT,
  offset,
  sort: sortBy === 'name' ? 'name' : 'release_date'
});
```

**Escenario B**: Estado de filtros no se actualiza

```typescript
// File: frontend/src/pages/Home.tsx

const handleFilterChange = (newFilters: FilterState) => {
  console.log('🔍 Filters changed:', newFilters); // Debug log
  setFilters(newFilters);
  setOffset(0); // Reset pagination
  setCards([]); // Clear current cards
};
```

**Escenario C**: URL encoding incorrecto

```typescript
// File: frontend/src/utils/api.ts

export async function fetchCards(params: CardFilters) {
  const queryParams = new URLSearchParams();
  
  if (params.game) queryParams.append('game', params.game);
  if (params.set) queryParams.append('set', params.set);
  if (params.rarity) queryParams.append('rarity', params.rarity);
  // URLSearchParams maneja encoding automáticamente
  
  const url = `${API_BASE}/api/cards?${queryParams.toString()}`;
  // ...
}
```

---

#### 4.3.2 Fix Backend

**Escenario A**: Parámetros no se extraen

```typescript
// File: supabase/functions/tcg-api/index.ts

async function handleCardsEndpoint(supabase: SupabaseClient, path: string, method: string, params: RequestParams) {
  if (method === 'GET') {
    if (path === '/api/cards') {
      // Extraer TODOS los parámetros de filtro
      const { 
        q, 
        game, 
        set, 
        rarity, 
        color, 
        type,
        year_from,
        year_to,
        limit = 50, 
        offset = 0 
      } = params;
      
      console.log('📊 Received filters:', { game, set, rarity, color, type }); // Debug
      
      // ...
    }
  }
}
```

**Escenario B**: Joins incorrectos

```typescript
// File: supabase/functions/tcg-api/index.ts

// Determinar si necesitamos inner joins para filtrar
const cardsJoin = (q || rarity || game || color || type) ? "cards!inner" : "cards";
const setsJoin = set ? "sets!inner" : "sets";

let query = supabase.from('card_printings').select(`
  printing_id, 
  image_url,
  ${cardsJoin}(card_id, card_name, type_line, rarity, mana_cost, oracle_text, colors, game),
  ${setsJoin}(set_name, set_code, release_date)
`, { count: 'estimated' });
```

**Escenario C**: Filtros no se aplican

```typescript
// File: supabase/functions/tcg-api/index.ts

// Aplicar filtros al query
if (game) {
  query = query.eq('cards.game', game);
}

if (set) {
  query = query.eq('sets.set_code', set);
}

if (rarity) {
  query = query.eq('cards.rarity', rarity.toLowerCase()); // Case insensitive
}

if (color) {
  // Para arrays de colores, usar contains
  query = query.contains('cards.colors', [color]);
}

if (type) {
  query = query.ilike('cards.type_line', `%${type}%`); // Partial match
}

if (year_from || year_to) {
  const fromDate = year_from ? `${year_from}-01-01` : '1900-01-01';
  const toDate = year_to ? `${year_to}-12-31` : '2100-12-31';
  query = query.gte('sets.release_date', fromDate).lte('sets.release_date', toDate);
}
```

---

#### 4.3.3 Fix Base de Datos

**Escenario A**: Verificar datos faltantes

```sql
-- Ejecutar en Supabase SQL Editor
SELECT 
  COUNT(*) as total_cards,
  COUNT(game) as cards_with_game,
  COUNT(rarity) as cards_with_rarity,
  COUNT(colors) as cards_with_colors,
  COUNT(type_line) as cards_with_type,
  ROUND(100.0 * COUNT(game) / COUNT(*), 2) as game_coverage,
  ROUND(100.0 * COUNT(rarity) / COUNT(*), 2) as rarity_coverage
FROM cards;
```

**Escenario B**: Agregar índices para performance

```sql
-- Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_cards_game ON cards(game);
CREATE INDEX IF NOT EXISTS idx_cards_rarity ON cards(rarity);
CREATE INDEX IF NOT EXISTS idx_cards_colors ON cards USING GIN(colors);
CREATE INDEX IF NOT EXISTS idx_cards_type_line ON cards(type_line);
CREATE INDEX IF NOT EXISTS idx_sets_release_date ON sets(release_date);
CREATE INDEX IF NOT EXISTS idx_sets_set_code ON sets(set_code);
```

**Escenario C**: Normalizar datos si es necesario

```sql
-- Normalizar rarities a lowercase
UPDATE cards 
SET rarity = LOWER(rarity) 
WHERE rarity != LOWER(rarity);

-- Normalizar game names
UPDATE cards 
SET game = TRIM(game) 
WHERE game != TRIM(game);
```

---

### Fase 4: Testing y Verificación (15 min)

#### 4.4.1 Tests Unitarios de API

**Script de Test**:

```powershell
# File: scripts/test_filters.ps1

Write-Host "🧪 Testing Filters..." -ForegroundColor Cyan

# Test 1: Game Filter
Write-Host "`n1. Testing Game Filter (Magic)" -ForegroundColor Yellow
$response = Invoke-WebRequest -Uri "https://sxuotvogwvmxuvwbsscv.supabase.co/functions/v1/tcg-api/api/cards?game=Magic%3A%20The%20Gathering&limit=5" -UseBasicParsing
$data = $response.Content | ConvertFrom-Json
if ($data.cards.Count -gt 0 -and $data.cards[0].game -eq "Magic: The Gathering") {
    Write-Host "   ✅ PASS" -ForegroundColor Green
} else {
    Write-Host "   ❌ FAIL" -ForegroundColor Red
}

# Test 2: Rarity Filter
Write-Host "`n2. Testing Rarity Filter (rare)" -ForegroundColor Yellow
$response = Invoke-WebRequest -Uri "https://sxuotvogwvmxuvwbsscv.supabase.co/functions/v1/tcg-api/api/cards?rarity=rare&limit=5" -UseBasicParsing
$data = $response.Content | ConvertFrom-Json
if ($data.cards.Count -gt 0 -and $data.cards[0].rarity -eq "rare") {
    Write-Host "   ✅ PASS" -ForegroundColor Green
} else {
    Write-Host "   ❌ FAIL" -ForegroundColor Red
}

# Test 3: Color Filter
Write-Host "`n3. Testing Color Filter (Red)" -ForegroundColor Yellow
$response = Invoke-WebRequest -Uri "https://sxuotvogwvmxuvwbsscv.supabase.co/functions/v1/tcg-api/api/cards?color=Red&limit=5" -UseBasicParsing
$data = $response.Content | ConvertFrom-Json
if ($data.cards.Count -gt 0) {
    Write-Host "   ✅ PASS" -ForegroundColor Green
} else {
    Write-Host "   ❌ FAIL" -ForegroundColor Red
}

# Test 4: Combined Filters
Write-Host "`n4. Testing Combined Filters (Game + Rarity)" -ForegroundColor Yellow
$response = Invoke-WebRequest -Uri "https://sxuotvogwvmxuvwbsscv.supabase.co/functions/v1/tcg-api/api/cards?game=Magic%3A%20The%20Gathering&rarity=mythic&limit=5" -UseBasicParsing
$data = $response.Content | ConvertFrom-Json
if ($data.cards.Count -gt 0) {
    Write-Host "   ✅ PASS" -ForegroundColor Green
} else {
    Write-Host "   ❌ FAIL" -ForegroundColor Red
}
```

---

#### 4.4.2 Tests de Integración (Browser)

**Checklist Manual**:

```markdown
## Frontend Filter Tests

### Game Filter
- [ ] Dropdown muestra todos los juegos
- [ ] Seleccionar "Magic: The Gathering" filtra correctamente
- [ ] Seleccionar "Pokemon" filtra correctamente
- [ ] Cambiar de juego actualiza el grid
- [ ] URL se actualiza con parámetro `?game=...`

### Set/Edition Filter
- [ ] Dropdown se carga con sets del juego seleccionado
- [ ] Seleccionar un set filtra correctamente
- [ ] Cambiar de set actualiza el grid
- [ ] URL se actualiza con parámetro `?set=...`

### Rarity Filter
- [ ] Botones de rareza son clickeables
- [ ] Seleccionar "Rare" filtra correctamente
- [ ] Seleccionar "Mythic" filtra correctamente
- [ ] Cambiar rareza actualiza el grid
- [ ] URL se actualiza con parámetro `?rarity=...`

### Color Filter
- [ ] Checkboxes de colores funcionan
- [ ] Seleccionar "Red" filtra correctamente
- [ ] Seleccionar múltiples colores funciona (AND/OR)
- [ ] Deseleccionar color actualiza el grid
- [ ] URL se actualiza con parámetro `?color=...`

### Type Filter
- [ ] Dropdown muestra tipos de carta
- [ ] Seleccionar "Creature" filtra correctamente
- [ ] Seleccionar "Instant" filtra correctamente
- [ ] URL se actualiza con parámetro `?type=...`

### Year Range Filter
- [ ] Slider es interactivo
- [ ] Mover slider filtra por año
- [ ] Rango se muestra correctamente
- [ ] URL se actualiza con parámetros `?year_from=...&year_to=...`

### Combined Filters
- [ ] Game + Rarity funciona
- [ ] Game + Set + Rarity funciona
- [ ] Todos los filtros juntos funcionan
- [ ] Limpiar filtros resetea el grid
```

---

#### 4.4.3 Tests de Performance

**Métricas a Medir**:

```javascript
// File: scripts/test_filter_performance.js

async function testFilterPerformance() {
  const tests = [
    { name: 'Game Filter', params: '?game=Magic%3A%20The%20Gathering' },
    { name: 'Rarity Filter', params: '?rarity=rare' },
    { name: 'Color Filter', params: '?color=Red' },
    { name: 'Combined', params: '?game=Magic%3A%20The%20Gathering&rarity=mythic&color=Red' }
  ];
  
  for (const test of tests) {
    const start = performance.now();
    const response = await fetch(`${API_BASE}/api/cards${test.params}&limit=50`);
    const data = await response.json();
    const duration = performance.now() - start;
    
    console.log(`${test.name}: ${duration.toFixed(2)}ms (${data.cards.length} cards)`);
    
    if (duration > 500) {
      console.warn(`⚠️ ${test.name} is slow (>${duration}ms)`);
    }
  }
}
```

**Targets de Performance**:

- ✅ p50: < 200ms
- ✅ p95: < 500ms
- ✅ p99: < 1000ms

---

### Fase 5: Deployment y Documentación (10 min)

#### 4.5.1 Deployment Checklist

```markdown
## Pre-Deployment
- [ ] Todos los tests pasan localmente
- [ ] Code review completado
- [ ] Documentación actualizada
- [ ] Changelog actualizado

## Deployment
- [ ] Commit con mensaje descriptivo
- [ ] Push a GitHub
- [ ] Desplegar Edge Function (si se modificó)
- [ ] Esperar GitHub Actions (frontend)
- [ ] Verificar deployment exitoso

## Post-Deployment
- [ ] Verificar en producción (hard refresh)
- [ ] Ejecutar tests de integración
- [ ] Verificar métricas de performance
- [ ] Monitorear logs por 15 minutos
```

**Comandos**:

```bash
# Commit
git add .
git commit -m "fix: resolve filter functionality issues

- Fix frontend filter parameter passing
- Fix backend filter application in Edge Function
- Add database indices for performance
- Add comprehensive filter tests
- Update documentation

Fixes: Game, Set, Rarity, Color, Type, and Year filters
Performance: All filters now respond in <500ms"

# Push
git push origin main

# Deploy Edge Function (si se modificó)
npx supabase functions deploy tcg-api --project-ref sxuotvogwvmxuvwbsscv --no-verify-jwt

# Verificar
.\scripts\test_filters.ps1
```

---

#### 4.5.2 Documentación

**Crear**: `FILTROS_FIX.md`

```markdown
# Fix: Sistema de Filtros

**Fecha**: 2026-02-05
**Versión**: 1.0

## Problema
Los filtros de búsqueda no funcionaban correctamente, impidiendo a los usuarios filtrar cartas por Game, Set, Rarity, Color, Type, y Year.

## Causa Raíz
[Documentar la causa específica encontrada]

## Solución Implementada
[Documentar los cambios realizados]

### Frontend
- Archivo: `frontend/src/pages/Home.tsx`
- Cambios: [Detallar]

### Backend
- Archivo: `supabase/functions/tcg-api/index.ts`
- Cambios: [Detallar]

### Base de Datos
- Índices agregados: [Listar]
- Datos normalizados: [Detallar]

## Tests
- ✅ Test unitarios: [N] tests pasando
- ✅ Test de integración: Todos los filtros verificados
- ✅ Performance: <500ms para todos los filtros

## Screenshots
[Antes y después de cada filtro]

## Métricas
- Tiempo de respuesta promedio: [X]ms
- Cobertura de datos: [Y]%
- Tests pasando: [Z]/[Z]
```

---

## 5. Criterios de Aceptación

### 5.1 Funcionales

- [ ] **Game Filter**: Filtra correctamente por juego seleccionado
- [ ] **Set Filter**: Filtra correctamente por expansión seleccionada
- [ ] **Rarity Filter**: Filtra correctamente por rareza seleccionada
- [ ] **Color Filter**: Filtra correctamente por color(es) seleccionado(s)
- [ ] **Type Filter**: Filtra correctamente por tipo de carta
- [ ] **Year Filter**: Filtra correctamente por rango de años
- [ ] **Combined Filters**: Múltiples filtros funcionan simultáneamente
- [ ] **Clear Filters**: Botón de limpiar resetea todos los filtros

### 5.2 No Funcionales

- [ ] **Performance**: Response time < 500ms (p95)
- [ ] **UX**: Feedback visual inmediato al aplicar filtro
- [ ] **URL**: Parámetros de filtro se reflejan en URL (deep linking)
- [ ] **Mobile**: Filtros funcionan correctamente en mobile
- [ ] **Accessibility**: Filtros son accesibles por teclado

### 5.3 Técnicos

- [ ] **Tests**: 100% de filtros cubiertos por tests
- [ ] **Documentation**: Documentación completa y actualizada
- [ ] **Code Quality**: Sin warnings de linter
- [ ] **Performance**: Sin queries que causen timeout

---

## 6. Riesgos y Mitigaciones

### 6.1 Riesgos Identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Timeout en queries complejos | Media | Alto | Agregar índices, optimizar queries |
| Datos faltantes en DB | Alta | Medio | Normalizar datos, documentar gaps |
| Regresión en otros features | Baja | Alto | Tests de regresión completos |
| Performance degradada | Media | Medio | Monitoreo de métricas, rollback plan |

### 6.2 Plan de Rollback

Si los filtros causan problemas en producción:

1. Revertir commit inmediatamente
2. Desplegar Edge Function anterior
3. Notificar al usuario
4. Investigar en staging
5. Re-desplegar con fix

---

## 7. Métricas de Éxito

### 7.1 KPIs

- **Tasa de Uso de Filtros**: >50% de usuarios usan al menos 1 filtro
- **Tiempo de Respuesta**: <500ms (p95)
- **Error Rate**: <0.1%
- **User Satisfaction**: Feedback positivo del usuario

### 7.2 Monitoreo

- **Logs**: Monitorear logs de Edge Function por errores
- **Performance**: Medir response time de queries filtradas
- **Usage**: Trackear qué filtros se usan más

---

## 8. Timeline

| Fase | Duración | Inicio | Fin |
|------|----------|--------|-----|
| 1. Diagnóstico | 20 min | T+0 | T+20 |
| 2. Identificación | 10 min | T+20 | T+30 |
| 3. Implementación | 45 min | T+30 | T+75 |
| 4. Testing | 15 min | T+75 | T+90 |
| 5. Deployment | 10 min | T+90 | T+100 |
| **TOTAL** | **100 min** | - | - |

---

## 9. Aprobación

### 9.1 Stakeholders

- **Owner**: Antigravity AI
- **Reviewer**: Usuario (Carlos)
- **QA**: Automated Tests + Manual Verification

### 9.2 Sign-off

- [x] Diagnóstico completado y aprobado
- [x] Implementación revisada y aprobada
- [x] Tests pasando y verificados
- [x] Deployment exitoso y verificado
- [x] Documentación completa y aprobada (Ver `BUG_FIX_PAGINATION_FILTERS.md`)

**Nota Adicional (2026-02-06)**: Se detectó y corrigió un problema crítico de concurrencia en el frontend donde la paginación no se reseteaba lo suficientemente rápido al cambiar filtros, causando duplicación de keys en React. Se implementó `handleFilterChange` para sincronizar el estado de forma atómica.

---

## 10. Referencias

### 10.1 Documentos Relacionados

- `PRD.md` - PRD principal del proyecto
- `DIAGNOSTICO_DEPLOYMENT.md` - Guía de deployment
- `LEYES_DEL_SISTEMA.md` - Reglas de operación

### 10.2 Código Relevante

- `frontend/src/pages/Home.tsx` - Lógica de filtros en frontend
- `frontend/src/utils/api.ts` - API client
- `supabase/functions/tcg-api/index.ts` - Edge Function con lógica de filtrado

### 10.3 Issues Relacionados

- Issue original: "los filtros según el prd inicial no existen y no están funcionando"

---

**Última Actualización**: 2026-02-05 07:27  
**Estado**: 📋 Ready for Implementation  
**Próximo Paso**: Ejecutar Fase 1 (Diagnóstico)
