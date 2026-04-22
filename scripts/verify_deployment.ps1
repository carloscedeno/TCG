# Script de Verificacion de Deployment
# Ejecutar despues de cada deployment para verificar que todo este funcionando

Write-Host "`n--- VERIFICACION DE DEPLOYMENT - TCG APP ---`n" -ForegroundColor Cyan

# 1. Verificar Edge Function - Lista de Cartas
Write-Host "1. Verificando Edge Function - Lista de Cartas..." -ForegroundColor Yellow
try {
    $sbUrl = "https://bqfkqnnostzaqueujdms.supabase.co" # Proyecto DEV
    $response = Invoke-WebRequest -Uri "$sbUrl/functions/v1/tcg-api/api/cards?limit=1" -Method GET -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    if ($data.cards.Count -gt 0) {
        Write-Host "   OK: Edge Function /api/cards funcionando" -ForegroundColor Green
        Write-Host "   Data: Primera carta: $($data.cards[0].name)" -ForegroundColor Gray
    } else {
        Write-Host "   ERROR: Edge Function devuelve 0 cartas" -ForegroundColor Red
    }
} catch {
    Write-Host "   ERROR: al llamar Edge Function: $_" -ForegroundColor Red
}

# 2. Verificar Edge Function - Detalles de Carta
Write-Host "`n2. Verificando Edge Function - Detalles de Carta..." -ForegroundColor Yellow
try {
    # Usar el ID de la primera carta obtenida
    $testId = "ffff0825-9996-4ae5-90c8-cb976ccf4ae0"
    $sbUrl = "https://bqfkqnnostzaqueujdms.supabase.co" # Proyecto DEV
    $response = Invoke-WebRequest -Uri "$sbUrl/functions/v1/tcg-api/api/cards/$testId" -Method GET -UseBasicParsing
    $details = $response.Content | ConvertFrom-Json
    
    $checks = @(
        @{Name="Nombre"; Value=$details.name; Valid=$null -ne $details.name},
        @{Name="Texto"; Value=$details.oracle_text; Valid=$null -ne $details.oracle_text},
        @{Name="Versiones"; Value=$details.all_versions.Count; Valid=$details.all_versions.Count -gt 0},
        @{Name="Precio"; Value=$details.price; Valid=$details.price -gt 0}
    )
    
    foreach ($check in $checks) {
        if ($check.Valid) {
            Write-Host "   OK: $($check.Name): $($check.Value)" -ForegroundColor Green
        } else {
            Write-Host "   ERROR: $($check.Name): FALTA o Invalido" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "   ERROR: al obtener detalles: $_" -ForegroundColor Red
}

# 3. Verificar Frontend en Dev (Cloudflare)
Write-Host "`n3. Verificando Frontend en Dev (Cloudflare)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://dev.geekorium.shop/" -Method GET -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "   OK: Frontend accesible (HTTP 200)" -ForegroundColor Green
        
        # Verificar que el HTML contenga el div root
        if ($response.Content -match 'id="root"') {
            Write-Host "   OK: HTML contiene div#root" -ForegroundColor Green
        } else {
            Write-Host "   ERROR: HTML no contiene div#root" -ForegroundColor Red
        }
    } else {
        Write-Host "   ERROR: Frontend devuelve HTTP $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ERROR: al acceder frontend: $_" -ForegroundColor Red
}

# 4. Verificar Git Status
Write-Host "`n4. Verificando Estado de Git..." -ForegroundColor Yellow
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "   AVISO: Hay cambios sin commitear:" -ForegroundColor Yellow
    Write-Host $gitStatus -ForegroundColor Gray
} else {
    Write-Host "   OK: Working directory limpio" -ForegroundColor Green
}

# 5. Verificar Ultimos Commits
Write-Host "`n5. Ultimos 3 Commits:" -ForegroundColor Yellow
git log --oneline -3 | ForEach-Object {
    Write-Host "   - $_" -ForegroundColor Gray
}

# Resumen Final
Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "RESUMEN DE VERIFICACION" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "`nOK = Funcionando correctamente" -ForegroundColor Green
Write-Host "ERROR = Requiere atencion" -ForegroundColor Red
Write-Host "AVISO = Advertencia" -ForegroundColor Yellow
Write-Host "`nSi hay errores, revisar la configuracion de enviroment en Cloudflare.`n" -ForegroundColor White
