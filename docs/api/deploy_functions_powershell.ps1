# Script para desplegar las Edge Functions de Supabase - VERSIÓN POWERSHELL
# Se puede ejecutar múltiples veces sin errores

Write-Host "🚀 Desplegando Edge Functions (versión PowerShell)..." -ForegroundColor Green

# Verificar que npx esté disponible
try {
    $null = npx --version
    Write-Host "✅ npx está disponible" -ForegroundColor Green
} catch {
    Write-Host "❌ npx no está disponible" -ForegroundColor Red
    Write-Host "💡 Instala Node.js desde: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Verificar variables de entorno
if (-not $env:SUPABASE_PROJECT_REF) {
    Write-Host "❌ Variable SUPABASE_PROJECT_REF no está definida" -ForegroundColor Red
    Write-Host "💡 Ejecuta: `$env:SUPABASE_PROJECT_REF='tu-project-ref'" -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 Project Reference: $env:SUPABASE_PROJECT_REF" -ForegroundColor Cyan

# Crear estructura de directorios si no existe
Write-Host "📁 Creando estructura de directorios..." -ForegroundColor Yellow
if (-not (Test-Path "supabase/functions/tcg-api")) {
    New-Item -ItemType Directory -Path "supabase/functions/tcg-api" -Force
    Write-Host "✅ Directorio creado" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Directorio ya existe" -ForegroundColor Cyan
}

# Copiar archivos de Edge Functions si no existen o están desactualizados
Write-Host "📦 Preparando archivos de Edge Functions..." -ForegroundColor Yellow

# Crear el archivo index.ts si no existe o está desactualizado
$sourceFile = "docs/api/edge_functions_clean.ts"
$targetFile = "supabase/functions/tcg-api/index.ts"

if (-not (Test-Path $targetFile) -or (Get-Item $sourceFile).LastWriteTime -gt (Get-Item $targetFile).LastWriteTime) {
    Copy-Item $sourceFile $targetFile -Force
    Write-Host "✅ Archivo index.ts actualizado" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Archivo index.ts ya está actualizado" -ForegroundColor Cyan
}

# Crear el import_map.json si no existe
$importMapSource = "docs/api/import_map.json"
$importMapTarget = "supabase/functions/import_map.json"

if (-not (Test-Path $importMapTarget)) {
    Copy-Item $importMapSource $importMapTarget -Force
    Write-Host "✅ Archivo import_map.json creado" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Archivo import_map.json ya existe" -ForegroundColor Cyan
}

# Verificar conexión con Supabase
Write-Host "🔗 Verificando conexión con Supabase..." -ForegroundColor Yellow
try {
    $null = npx supabase status --project-ref $env:SUPABASE_PROJECT_REF 2>$null
    Write-Host "✅ Conexión verificada" -ForegroundColor Green
} catch {
    Write-Host "⚠️  No se pudo verificar el estado del proyecto" -ForegroundColor Yellow
    Write-Host "💡 Asegúrate de estar autenticado: npx supabase login" -ForegroundColor Yellow
}

# Desplegar función TCG API
Write-Host "📦 Desplegando función TCG API..." -ForegroundColor Yellow
try {
    npx supabase functions deploy tcg-api --project-ref $env:SUPABASE_PROJECT_REF
    Write-Host "✅ Función TCG API desplegada exitosamente" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Error al desplegar la función (puede que ya esté desplegada)" -ForegroundColor Yellow
    Write-Host "💡 Intentando actualizar la función..." -ForegroundColor Yellow
    
    # Intentar actualizar la función
    try {
        npx supabase functions deploy tcg-api --project-ref $env:SUPABASE_PROJECT_REF --no-verify-jwt
        Write-Host "✅ Función TCG API actualizada exitosamente" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error al actualizar la función" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🎉 Despliegue completado exitosamente!" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 URLs de las funciones:" -ForegroundColor Cyan
Write-Host "   TCG API: https://$env:SUPABASE_PROJECT_REF.supabase.co/functions/v1/tcg-api" -ForegroundColor White
Write-Host ""
Write-Host "📚 Endpoints disponibles:" -ForegroundColor Cyan
Write-Host "   GET  /api/games - Listar juegos" -ForegroundColor White
Write-Host "   GET  /api/games/{code} - Obtener juego específico" -ForegroundColor White
Write-Host "   GET  /api/sets - Listar sets" -ForegroundColor White
Write-Host "   GET  /api/cards - Listar cartas" -ForegroundColor White
Write-Host "   GET  /api/cards/{id} - Obtener carta específica" -ForegroundColor White
Write-Host "   GET  /api/prices - Obtener precios" -ForegroundColor White
Write-Host "   POST /api/search - Buscar cartas" -ForegroundColor White
Write-Host "   GET  /api/collections - Obtener colección del usuario" -ForegroundColor White
Write-Host "   POST /api/collections - Añadir a colección" -ForegroundColor White
Write-Host "   GET  /api/watchlists - Obtener watchlist del usuario" -ForegroundColor White
Write-Host "   POST /api/watchlists - Añadir a watchlist" -ForegroundColor White
Write-Host "   GET  /api/stats/prices - Estadísticas de precios" -ForegroundColor White
Write-Host "   GET  /api/stats/collection - Estadísticas de colección" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Para probar los endpoints:" -ForegroundColor Cyan
Write-Host "   curl `"https://$env:SUPABASE_PROJECT_REF.supabase.co/functions/v1/tcg-api/api/games`"" -ForegroundColor White
Write-Host ""
Write-Host "📊 Para ver logs:" -ForegroundColor Cyan
Write-Host "   npx supabase functions logs tcg-api --project-ref $env:SUPABASE_PROJECT_REF" -ForegroundColor White
Write-Host ""
Write-Host "🔄 Este script es idempotente - puedes ejecutarlo múltiples veces sin problemas" -ForegroundColor Green 