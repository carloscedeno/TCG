# 🚀 Instrucciones para Scripts Idempotentes

## ✅ ¿Qué significa "Idempotente"?

Un script **idempotente** se puede ejecutar múltiples veces sin causar errores. Si algo ya existe, se actualiza; si no existe, se crea.

## 📁 Archivos Actualizados

### 1. **Funciones SQL Idempotentes**
- `docs/api/supabase_functions_clean.sql` - **VERSIÓN IDEMPOTENTE**
  - ✅ `CREATE OR REPLACE FUNCTION` para todas las funciones
  - ✅ `DROP TRIGGER IF EXISTS` antes de crear triggers
  - ✅ Comentarios condicionales que no se duplican

### 2. **Edge Functions Idempotentes**
- `docs/api/edge_functions_clean.ts` - Código TypeScript limpio
- `docs/api/import_map.json` - Configuración de imports
- `docs/api/deploy_functions_idempotent.sh` - **Script de despliegue idempotente**

## 🎯 Instrucciones de Uso

### **Paso 1: Funciones SQL (Idempotentes)**

1. **Abrir Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/[tu-project-ref]/sql
   ```

2. **Copiar y pegar TODO el contenido**
   - Abre `docs/api/supabase_functions_clean.sql`
   - Copia **todo** el contenido
   - Pégalo en el SQL Editor de Supabase
   - Ejecuta

3. **✅ Resultado esperado**
   - Si es la primera vez: Se crean todas las funciones y triggers
   - Si ya existen: Se actualizan sin errores
   - No verás errores de "ya existe"

### **Paso 2: Edge Functions (Idempotentes)**

1. **Configurar variables de entorno**
   ```bash
   export SUPABASE_PROJECT_REF=tu-project-ref
   ```

2. **Ejecutar script de despliegue**
   ```bash
   chmod +x docs/api/deploy_functions_idempotent.sh
   ./docs/api/deploy_functions_idempotent.sh
   ```

3. **✅ Resultado esperado**
   - Si es la primera vez: Se despliega la función
   - Si ya existe: Se actualiza sin errores
   - El script maneja automáticamente los conflictos

## 🔄 Ventajas de los Scripts Idempotentes

### **Para Funciones SQL:**
- ✅ No hay errores de "trigger ya existe"
- ✅ No hay errores de "función ya existe"
- ✅ Se pueden ejecutar múltiples veces
- ✅ Actualizan automáticamente funciones existentes
- ✅ Comentarios no se duplican

### **Para Edge Functions:**
- ✅ No hay errores de "función ya desplegada"
- ✅ Actualiza automáticamente código existente
- ✅ Verifica dependencias antes de desplegar
- ✅ Maneja errores de conexión graciosamente
- ✅ Proporciona feedback detallado

## 🧪 Pruebas de Funcionamiento

### **Probar Funciones SQL:**
```sql
-- Probar función de búsqueda
SELECT * FROM search_cards_with_prices('Black Lotus', 'mtg', 5);

-- Probar función de estadísticas
SELECT * FROM get_user_collection_stats('user-uuid-here');

-- Verificar que los triggers funcionan
UPDATE games SET game_name = game_name WHERE game_id = 1;
-- Debería actualizar automáticamente updated_at
```

### **Probar Edge Functions:**
```bash
# Probar endpoint de juegos
curl "https://tu-project-ref.supabase.co/functions/v1/tcg-api/api/games"

# Probar búsqueda
curl -X POST "https://tu-project-ref.supabase.co/functions/v1/tcg-api/api/search" \
  -H "Content-Type: application/json" \
  -d '{"query": "Black Lotus", "game_code": "mtg"}'
```

## 🔧 Mantenimiento

### **Actualizar Funciones SQL:**
1. Modifica el archivo `supabase_functions_clean.sql`
2. Copia y pega en Supabase SQL Editor
3. Ejecuta - se actualizarán automáticamente

### **Actualizar Edge Functions:**
1. Modifica el archivo `edge_functions_clean.ts`
2. Ejecuta `./docs/api/deploy_functions_idempotent.sh`
3. Se actualizará automáticamente

## 🚨 Solución de Problemas

### **Error: "trigger already exists"**
- ✅ **SOLUCIONADO** - Los scripts ahora usan `DROP TRIGGER IF EXISTS`

### **Error: "function already exists"**
- ✅ **SOLUCIONADO** - Los scripts usan `CREATE OR REPLACE FUNCTION`

### **Error: "function already deployed"**
- ✅ **SOLUCIONADO** - El script maneja automáticamente las actualizaciones

### **Error: "connection failed"**
- Verifica que estés autenticado: `supabase login`
- Verifica tu `SUPABASE_PROJECT_REF`

## 📊 Monitoreo

### **Ver Logs de Funciones SQL:**
- Ve a **Database > Logs** en Supabase Dashboard

### **Ver Logs de Edge Functions:**
```bash
supabase functions logs tcg-api --project-ref $SUPABASE_PROJECT_REF
```

### **Ver Métricas:**
- Ve a **Edge Functions > Metrics** en Supabase Dashboard

## 🎉 Beneficios

1. **Desarrollo más rápido** - No más errores de "ya existe"
2. **Despliegues seguros** - Se pueden ejecutar múltiples veces
3. **Actualizaciones automáticas** - Sin intervención manual
4. **Menos errores** - Manejo robusto de conflictos
5. **Mejor experiencia** - Feedback claro y útil

---

## 🚀 ¡Listo para Usar!

**Ahora puedes ejecutar los scripts tantas veces como quieras sin preocuparte por errores de "ya existe".**

- ✅ **Funciones SQL**: Copia y pega `supabase_functions_clean.sql`
- ✅ **Edge Functions**: Ejecuta `deploy_functions_idempotent.sh`

**¡Todo es completamente idempotente!** 🎯 