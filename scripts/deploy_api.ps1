# Script de Despliegue y Verificación de TCG-API
# Requisitos: Tener SUPABASE_ACCESS_TOKEN configurado en el entorno o pasado como argumento.

param (
    [string]$AccessToken = $env:SUPABASE_ACCESS_TOKEN
)

if (-not $AccessToken) {
    Write-Host "❌ Error: No se encontró SUPABASE_ACCESS_TOKEN." -ForegroundColor Red
    Write-Host "Por favor, pásalo como argumento o configúralo en tu entorno:"
    Write-Host ".\scripts\deploy_api.ps1 -AccessToken 'tu_token'"
    exit 1
}

$env:SUPABASE_ACCESS_TOKEN = $AccessToken
# Desplegar la funcion tcg-api al proyecto vinculado actualmente
Write-Host "🚀 Iniciando despliegue de tcg-api..." -ForegroundColor Cyan

# 1. Despliegue (Usa el proyecto vinculado via 'supabase link')
npx supabase functions deploy tcg-api --no-verify-jwt

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error durante el despliegue." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Despliegue completado. Esperando 5 segundos para propagación..." -ForegroundColor Green
Start-Sleep -Seconds 5

# 2. Verificación E2E
Write-Host "🧪 Iniciando verificación E2E..." -ForegroundColor Cyan
& .venv\Scripts\python.exe tests/verify_supabase_functions.py

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ La verificación E2E falló. Por favor, revisa los logs arriba." -ForegroundColor Red
    exit 1
}

Write-Host "🎉 ¡Todo listo! El backend está desplegado y verificado." -ForegroundColor Green
