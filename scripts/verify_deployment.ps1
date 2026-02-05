# Script de Verificación de Deployment
# Ejecutar después de cada deployment para verificar que todo esté funcionando

Write-Host "`n🔍 VERIFICACIÓN DE DEPLOYMENT - TCG APP`n" -ForegroundColor Cyan

# 1. Verificar Edge Function - Lista de Cartas
Write-Host "1️⃣ Verificando Edge Function - Lista de Cartas..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://sxuotvogwvmxuvwbsscv.supabase.co/functions/v1/tcg-api/api/cards?limit=1" -Method GET -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    if ($data.cards.Count -gt 0) {
        Write-Host "   ✅ Edge Function /api/cards funcionando" -ForegroundColor Green
        Write-Host "   📊 Primera carta: $($data.cards[0].name)" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Edge Function devuelve 0 cartas" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Error al llamar Edge Function: $_" -ForegroundColor Red
}

# 2. Verificar Edge Function - Detalles de Carta
Write-Host "`n2️⃣ Verificando Edge Function - Detalles de Carta..." -ForegroundColor Yellow
try {
    # Usar el ID de la primera carta obtenida
    $testId = "ffff0825-9996-4ae5-90c8-cb976ccf4ae0"
    $response = Invoke-WebRequest -Uri "https://sxuotvogwvmxuvwbsscv.supabase.co/functions/v1/tcg-api/api/cards/$testId" -Method GET -UseBasicParsing
    $details = $response.Content | ConvertFrom-Json
    
    $checks = @(
        @{Name="Nombre"; Value=$details.name; Valid=$null -ne $details.name},
        @{Name="Texto"; Value=$details.oracle_text; Valid=$null -ne $details.oracle_text},
        @{Name="Versiones"; Value=$details.all_versions.Count; Valid=$details.all_versions.Count -gt 0},
        @{Name="Precio"; Value=$details.price; Valid=$details.price -gt 0},
        @{Name="Legalidades"; Value=$details.legalities.Count; Valid=$details.legalities.Count -gt 0}
    )
    
    foreach ($check in $checks) {
        if ($check.Valid) {
            Write-Host "   ✅ $($check.Name): $($check.Value)" -ForegroundColor Green
        } else {
            Write-Host "   ❌ $($check.Name): FALTA" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "   ❌ Error al obtener detalles: $_" -ForegroundColor Red
}

# 3. Verificar Frontend en Producción
Write-Host "`n3️⃣ Verificando Frontend en Producción..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://carloscedeno.github.io/TCG/" -Method GET -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Frontend accesible (HTTP 200)" -ForegroundColor Green
        
        # Verificar que el HTML contenga el div root
        if ($response.Content -match 'id="root"') {
            Write-Host "   ✅ HTML contiene div#root" -ForegroundColor Green
        } else {
            Write-Host "   ❌ HTML no contiene div#root" -ForegroundColor Red
        }
    } else {
        Write-Host "   ❌ Frontend devuelve HTTP $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Error al acceder frontend: $_" -ForegroundColor Red
}

# 4. Verificar Git Status
Write-Host "`n4️⃣ Verificando Estado de Git..." -ForegroundColor Yellow
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "   ⚠️ Hay cambios sin commitear:" -ForegroundColor Yellow
    Write-Host $gitStatus -ForegroundColor Gray
} else {
    Write-Host "   ✅ Working directory limpio" -ForegroundColor Green
}

# 5. Verificar Últimos Commits
Write-Host "`n5️⃣ Últimos 3 Commits:" -ForegroundColor Yellow
git log --oneline -3 | ForEach-Object {
    Write-Host "   📝 $_" -ForegroundColor Gray
}

# Resumen Final
Write-Host "`n" + "="*60 -ForegroundColor Cyan
Write-Host "📋 RESUMEN DE VERIFICACIÓN" -ForegroundColor Cyan
Write-Host "="*60 -ForegroundColor Cyan
Write-Host "`n✅ = Funcionando correctamente" -ForegroundColor Green
Write-Host "❌ = Requiere atención" -ForegroundColor Red
Write-Host "⚠️ = Advertencia" -ForegroundColor Yellow
Write-Host "`nSi hay ❌, revisar DIAGNOSTICO_DEPLOYMENT.md para troubleshooting.`n" -ForegroundColor White
