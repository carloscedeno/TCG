#!/bin/bash
# Script de despliegue automático para Supabase Functions
# Generado por deploy_supabase_functions.py

set -e

echo "🚀 Iniciando despliegue de Supabase Functions..."

# Verificar que Supabase CLI esté instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI no está instalado"
    echo "💡 Instala con: pnpm add -g supabase"
    exit 1
fi

# Verificar variables de entorno
if [ -z "$SUPABASE_PROJECT_REF" ]; then
    echo "❌ Variable SUPABASE_PROJECT_REF no está definida"
    echo "💡 Exporta tu Project Reference:"
    echo "   export SUPABASE_PROJECT_REF=your-project-ref"
    exit 1
fi

# Verificar que estemos en el directorio correcto
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ No se encontró supabase/config.toml"
    echo "💡 Asegúrate de estar en el directorio raíz del proyecto"
    exit 1
fi

echo "📦 Desplegando Edge Functions..."

# Desplegar función TCG API
echo "   - Desplegando tcg-api..."
supabase functions deploy tcg-api --project-ref $SUPABASE_PROJECT_REF

echo "✅ Edge Functions desplegadas exitosamente"
echo ""
echo "🔗 URLs de las funciones:"
echo "   TCG API: https://$SUPABASE_PROJECT_REF.supabase.co/functions/v1/tcg-api"
echo ""
echo "📚 Próximos pasos:"
echo "   1. Ejecutar funciones SQL desde el SQL Editor de Supabase"
echo "   2. Configurar variables de entorno en Settings > Edge Functions"
echo "   3. Probar los endpoints"
echo ""
echo "📖 Documentación completa: docs/api/supabase_functions_complete.md"
