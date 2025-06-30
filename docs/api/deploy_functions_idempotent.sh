#!/bin/bash
# Script para desplegar las Edge Functions de Supabase - VERSIÓN IDEMPOTENTE
# Se puede ejecutar múltiples veces sin errores

set -e

echo "🚀 Desplegando Edge Functions (versión idempotente)..."

# Verificar que Supabase CLI esté instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI no está instalado"
    echo "💡 Instala con: npm install -g supabase"
    exit 1
fi

# Verificar variables de entorno
if [ -z "$SUPABASE_PROJECT_REF" ]; then
    echo "❌ Variable SUPABASE_PROJECT_REF no está definida"
    echo "💡 Ejecuta: export SUPABASE_PROJECT_REF=tu-project-ref"
    exit 1
fi

# Verificar que estemos en el directorio correcto
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ No se encontró supabase/config.toml"
    echo "💡 Asegúrate de estar en el directorio raíz del proyecto"
    exit 1
fi

# Crear estructura de directorios si no existe
echo "📁 Creando estructura de directorios..."
mkdir -p supabase/functions/tcg-api

# Copiar archivos de Edge Functions si no existen o están desactualizados
echo "📦 Preparando archivos de Edge Functions..."

# Crear el archivo index.ts si no existe o está desactualizado
if [ ! -f "supabase/functions/tcg-api/index.ts" ] || [ "docs/api/edge_functions_clean.ts" -nt "supabase/functions/tcg-api/index.ts" ]; then
    cp docs/api/edge_functions_clean.ts supabase/functions/tcg-api/index.ts
    echo "✅ Archivo index.ts actualizado"
else
    echo "ℹ️  Archivo index.ts ya está actualizado"
fi

# Crear el import_map.json si no existe
if [ ! -f "supabase/functions/import_map.json" ]; then
    cp docs/api/import_map.json supabase/functions/import_map.json
    echo "✅ Archivo import_map.json creado"
else
    echo "ℹ️  Archivo import_map.json ya existe"
fi

# Verificar conexión con Supabase
echo "🔗 Verificando conexión con Supabase..."
if ! supabase status --project-ref $SUPABASE_PROJECT_REF &> /dev/null; then
    echo "⚠️  No se pudo verificar el estado del proyecto"
    echo "💡 Asegúrate de estar autenticado: supabase login"
fi

# Desplegar función TCG API
echo "📦 Desplegando función TCG API..."
if supabase functions deploy tcg-api --project-ref $SUPABASE_PROJECT_REF; then
    echo "✅ Función TCG API desplegada exitosamente"
else
    echo "⚠️  Error al desplegar la función (puede que ya esté desplegada)"
    echo "💡 Intentando actualizar la función..."
    
    # Intentar actualizar la función
    if supabase functions deploy tcg-api --project-ref $SUPABASE_PROJECT_REF --no-verify-jwt; then
        echo "✅ Función TCG API actualizada exitosamente"
    else
        echo "❌ Error al actualizar la función"
        exit 1
    fi
fi

echo ""
echo "🎉 Despliegue completado exitosamente!"
echo ""
echo "🔗 URLs de las funciones:"
echo "   TCG API: https://$SUPABASE_PROJECT_REF.supabase.co/functions/v1/tcg-api"
echo ""
echo "📚 Endpoints disponibles:"
echo "   GET  /api/games - Listar juegos"
echo "   GET  /api/games/{code} - Obtener juego específico"
echo "   GET  /api/sets - Listar sets"
echo "   GET  /api/cards - Listar cartas"
echo "   GET  /api/cards/{id} - Obtener carta específica"
echo "   GET  /api/prices - Obtener precios"
echo "   POST /api/search - Buscar cartas"
echo "   GET  /api/collections - Obtener colección del usuario"
echo "   POST /api/collections - Añadir a colección"
echo "   GET  /api/watchlists - Obtener watchlist del usuario"
echo "   POST /api/watchlists - Añadir a watchlist"
echo "   GET  /api/stats/prices - Estadísticas de precios"
echo "   GET  /api/stats/collection - Estadísticas de colección"
echo ""
echo "🧪 Para probar los endpoints:"
echo "   curl \"https://$SUPABASE_PROJECT_REF.supabase.co/functions/v1/tcg-api/api/games\""
echo ""
echo "📊 Para ver logs:"
echo "   supabase functions logs tcg-api --project-ref $SUPABASE_PROJECT_REF"
echo ""
echo "🔄 Este script es idempotente - puedes ejecutarlo múltiples veces sin problemas" 