# 🔴 DIAGNÓSTICO CRÍTICO: Deployment y Sincronización

**Fecha**: 2026-02-05 02:07 EST  
**Problema**: Modal sin datos en producción (sin título, texto, versiones, precios, legalidades)  
**Causa Raíz**: Edge Function llamaba a RPC inexistente + Frontend no configurado correctamente

---

## 📋 CHECKLIST DE DEPLOYMENT (USAR SIEMPRE)

### ✅ 1. Verificar Cambios Locales

```bash
git status
git diff
```

### ✅ 2. Commit y Push

```bash
git add .
git commit -m "descripción clara"
git push origin main
```

### ✅ 3. Desplegar Edge Functions (SI SE MODIFICARON)

```bash
npx supabase functions deploy tcg-api --project-ref sxuotvogwvmxuvwbsscv --no-verify-jwt
```

### ✅ 4. Verificar Edge Function en Producción

```bash
# Test endpoint de lista
Invoke-WebRequest -Uri "https://sxuotvogwvmxuvwbsscv.supabase.co/functions/v1/tcg-api/api/cards?limit=1" -UseBasicParsing

# Test endpoint de detalles (usar un ID real)
Invoke-WebRequest -Uri "https://sxuotvogwvmxuvwbsscv.supabase.co/functions/v1/tcg-api/api/cards/{CARD_ID}" -UseBasicParsing
```

### ✅ 5. Verificar GitHub Secrets

Ir a: <https://github.com/carloscedeno/TCG/settings/secrets/actions>

**Secrets Requeridos**:

- `VITE_SUPABASE_URL`: `https://sxuotvogwvmxuvwbsscv.supabase.co`
- `VITE_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- `VITE_API_BASE`: `https://sxuotvogwvmxuvwbsscv.supabase.co/functions/v1/tcg-api`
- `SUPABASE_ACCESS_TOKEN`: (token personal del usuario)

### ✅ 6. Trigger Manual de GitHub Actions

Ir a: <https://github.com/carloscedeno/TCG/actions>

Ejecutar manualmente:

- **"Deploy Frontend to GitHub Pages"** (si cambiaste frontend)
- **"Deploy and Verify Supabase Edge Functions"** (si cambiaste edge functions)

### ✅ 7. Esperar Deployment (2-3 minutos)

### ✅ 8. Verificar en Producción

- Abrir: <https://carloscedeno.github.io/TCG/>
- Refrescar con Ctrl+Shift+R (hard refresh)
- Abrir DevTools Console (F12)
- Verificar que no haya errores 404 o 500
- Hacer clic en una carta y verificar modal

---

## 🐛 PROBLEMAS ENCONTRADOS EN ESTA SESIÓN

### 1. **Edge Function con RPC Inexistente**

**Archivo**: `supabase/functions/tcg-api/index.ts` (línea 387-398)

**Problema**:

```typescript
// ❌ ANTES (ROTO)
const { data, error } = await supabase
  .rpc('get_card_full_details', { p_printing_id: printingId });
```

**Solución**:

```typescript
// ✅ DESPUÉS (FUNCIONAL)
const { data: printing, error: printingError } = await supabase
  .from('card_printings')
  .select(`*, cards(*), sets(*)`)
  .eq('printing_id', printingId)
  .single();
```

**Commits**:

- `90e1b6c` - fix: implement card details endpoint with direct queries

---

### 2. **Frontend Fallback Sin Deduplicación**

**Archivo**: `frontend/src/utils/api.ts` (línea 66-97)

**Problema**:
El fallback de Supabase mostraba todas las impresiones duplicadas.

**Solución**:
Agregamos lógica de deduplicación usando `Map` y `release_date`.

**Commits**:

- `c6219fc` - fix: add deduplication logic to Supabase fallback

---

### 3. **VITE_API_BASE No Configurado**

**Problema**:
El secret `VITE_API_BASE` no existía en GitHub Secrets, causando que el frontend no llamara al Edge Function.

**Solución**:
Agregar manualmente en GitHub:

- Name: `VITE_API_BASE`
- Value: `https://sxuotvogwvmxuvwbsscv.supabase.co/functions/v1/tcg-api`

---

## 🔧 ARQUITECTURA ACTUAL

```
┌─────────────────────────────────────────────────────────────┐
│                    GITHUB PAGES                              │
│  https://carloscedeno.github.io/TCG/                        │
│  - Frontend React + Vite                                    │
│  - Usa VITE_API_BASE para llamar Edge Functions            │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              SUPABASE EDGE FUNCTIONS                         │
│  https://sxuotvogwvmxuvwbsscv.supabase.co/functions/v1/     │
│  - tcg-api (main API)                                       │
│    ├── /api/cards (lista con deduplicación)                │
│    ├── /api/cards/:id (detalles completos)                 │
│    ├── /api/sets                                            │
│    ├── /api/games                                           │
│    └── /api/products                                        │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  SUPABASE POSTGRES                           │
│  - card_printings (impresiones de cartas)                  │
│  - cards (metadata de cartas)                              │
│  - sets (expansiones)                                       │
│  - aggregated_prices (precios de mercado)                  │
│  - products (inventario de Geekorium)                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 ENDPOINTS CRÍTICOS

### `/api/cards` (Lista)

**Funcionalidad**:

- Devuelve lista de cartas con deduplicación
- Filtros: game, set, rarity, color, search query
- Paginación: limit, offset
- Sorting: por release_date

**Deduplicación**:
Mantiene solo la impresión más reciente de cada carta basándose en `release_date`.

**Ejemplo**:

```
GET /api/cards?game=Magic: The Gathering&limit=50&offset=0
```

---

### `/api/cards/:id` (Detalles)

**Funcionalidad**:

- Devuelve detalles completos de una carta específica
- Incluye: metadata, texto, legalidades, precios, versiones

**Estructura de Respuesta**:

```json
{
  "card_id": "uuid",
  "name": "Card Name",
  "mana_cost": "{2}{U}",
  "type": "Instant",
  "oracle_text": "Card text...",
  "flavor_text": "Flavor...",
  "artist": "Artist Name",
  "rarity": "rare",
  "set": "Set Name",
  "set_code": "ABC",
  "collector_number": "123",
  "image_url": "https://...",
  "price": 5.99,
  "valuation": {
    "store_price": 5.99,
    "market_price": 6.50,
    "market_url": "https://cardkingdom.com/...",
    "valuation_avg": 6.245
  },
  "legalities": {
    "standard": "legal",
    "modern": "legal",
    ...
  },
  "colors": ["U"],
  "card_faces": null,
  "all_versions": [
    {
      "printing_id": "uuid",
      "set_name": "Set Name",
      "set_code": "ABC",
      "collector_number": "123",
      "rarity": "rare",
      "price": 6.50,
      "image_url": "https://..."
    }
  ]
}
```

---

## 🚨 SEÑALES DE ALERTA

### En el Modal de Carta

- ❌ Título vacío o "undefined"
- ❌ Texto de carta vacío
- ❌ "0 Versions" en la lista de ediciones
- ❌ Precio muestra "---" o "$0.00"
- ❌ Todas las legalidades en gris
- ❌ Link "Check Site" en vez de precio de CardKingdom

**Causa Probable**: Edge Function no está devolviendo datos correctos.

**Verificación**:

```bash
# Probar endpoint directamente
Invoke-WebRequest -Uri "https://sxuotvogwvmxuvwbsscv.supabase.co/functions/v1/tcg-api/api/cards/{ID}" -UseBasicParsing
```

---

### En el Grid de Cartas

- ❌ "Showing 0 of 0 cards"
- ❌ Cartas duplicadas (mismo nombre, misma imagen)
- ❌ Dropdown de Sets vacío o con pocos items

**Causa Probable**:

1. `VITE_API_BASE` no configurado
2. Edge Function no desplegado
3. Fallback de Supabase sin deduplicación

---

## 📝 LECCIONES APRENDIDAS

### 1. **SIEMPRE Desplegar Edge Functions Después de Modificarlas**

Los cambios en `supabase/functions/` NO se despliegan automáticamente con git push.

**Comando Obligatorio**:

```bash
npx supabase functions deploy tcg-api --project-ref sxuotvogwvmxuvwbsscv --no-verify-jwt
```

---

### 2. **Verificar Secrets ANTES de Deployment**

GitHub Actions necesita los secrets configurados para que el build funcione.

**Verificar en**: <https://github.com/carloscedeno/TCG/settings/secrets/actions>

---

### 3. **No Confiar en RPCs Sin Verificar**

Si el código llama a un RPC, verificar que exista en la base de datos.

**Verificación**:

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'get_card_full_details';
```

---

### 4. **Fallbacks Deben Tener Misma Lógica que API Principal**

El fallback de Supabase debe implementar deduplicación igual que el Edge Function.

---

### 5. **Hard Refresh en Producción**

Después de deployment, siempre hacer `Ctrl+Shift+R` para evitar cache.

---

## 🎯 PRÓXIMOS PASOS PARA EVITAR ESTO

### 1. Crear Script de Deployment Automático

```bash
# deploy.sh
git add .
git commit -m "$1"
git push origin main
npx supabase functions deploy tcg-api --project-ref sxuotvogwvmxuvwbsscv --no-verify-jwt
echo "✅ Deployment completo. Espera 2-3 minutos para GitHub Actions."
```

### 2. Agregar Tests E2E

Crear tests que verifiquen:

- Endpoint `/api/cards` devuelve datos
- Endpoint `/api/cards/:id` devuelve estructura completa
- Modal carga correctamente

### 3. Documentar RPCs Requeridos

Crear lista de todos los RPCs que el código espera y verificar que existan.

### 4. Monitoring en Producción

Agregar logging para detectar cuando el fallback se activa.

---

## ✅ ESTADO ACTUAL (2026-02-05 02:07)

### Código

- ✅ Edge Function con queries directas (sin RPC)
- ✅ Frontend con deduplicación en fallback
- ✅ Commits pusheados a GitHub

### Deployment

- ✅ Edge Function desplegado manualmente
- ⚠️ Frontend deployment pendiente de verificación
- ⚠️ `VITE_API_BASE` secret agregado manualmente

### Pendiente

1. Verificar que GitHub Actions haya completado el deployment del frontend
2. Hacer hard refresh en producción
3. Verificar que el modal cargue todos los datos correctamente

---

**IMPORTANTE**: Este documento debe consultarse SIEMPRE antes de hacer deployment para evitar perder tiempo.
