<#
.SYNOPSIS
  Geekorium Unified Test & Quality Gate Runner (Carlos AI Framework - Ley 3)
.PARAMETER Mode
  smoke : Fast regression gate (Python unit + Jest unit + Playwright smoke)
  unit  : All unit tests (Python pytest unit + Frontend Jest)
  e2e   : Playwright E2E smoke suite (or full if -IncludeAuth is set)
  full  : Complete battery (Build + Python unit/integration + Jest + Playwright E2E + API Health)
.PARAMETER IncludeAuth
  Include authenticated Playwright chromium project (requires valid admin test creds)
#>
param(
    [ValidateSet("smoke", "unit", "e2e", "full")]
    [string]$Mode = "smoke",
    [switch]$IncludeAuth
)

$ErrorActionPreference = "Stop"
$RootDir = $PSScriptRoot
$Results = @()

function Invoke-Stage {
    param(
        [string]$Name,
        [scriptblock]$Action
    )
    Write-Host "`n============================================================" -ForegroundColor Cyan
    Write-Host "▶ STAGE: $Name" -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan

    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        & $Action
        if ($LASTEXITCODE -ne 0) {
            throw "Command exited with code $LASTEXITCODE"
        }
        $sw.Stop()
        $script:Results += [PSCustomObject]@{ Stage = $Name; Status = "PASS"; Duration = "$([math]::Round($sw.Elapsed.TotalSeconds, 1))s" }
        Write-Host "✅ PASS: $Name ($([math]::Round($sw.Elapsed.TotalSeconds, 1))s)" -ForegroundColor Green
    }
    catch {
        $sw.Stop()
        $script:Results += [PSCustomObject]@{ Stage = $Name; Status = "FAIL"; Duration = "$([math]::Round($sw.Elapsed.TotalSeconds, 1))s" }
        Write-Host "❌ FAIL: $Name - $_" -ForegroundColor Red
        throw
    }
}

Push-Location $RootDir
try {
    # Load root .env variables into process scope (without overwriting existing env vars)
    if (Test-Path "$RootDir\.env") {
        Get-Content "$RootDir\.env" | ForEach-Object {
            if ($_ -match "^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$") {
                $k = $matches[1]
                $v = $matches[2].Trim('"').Trim("'")
                if (-not [Environment]::GetEnvironmentVariable($k, "Process")) {
                    [Environment]::SetEnvironmentVariable($k, $v, "Process")
                }
            }
        }
    }

    # Ensure Vite has VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY in local smoke/e2e runs
    if (-not $env:VITE_SUPABASE_URL) {
        if ($env:DEV_SUPABASE_URL) { $env:VITE_SUPABASE_URL = $env:DEV_SUPABASE_URL }
        elseif ($env:SUPABASE_URL) { $env:VITE_SUPABASE_URL = $env:SUPABASE_URL }
        else { $env:VITE_SUPABASE_URL = "https://bqfkqnnostzaqueujdms.supabase.co" }
    }
    if (-not $env:VITE_SUPABASE_ANON_KEY) {
        if ($env:DEV_SUPABASE_ANON_KEY) { $env:VITE_SUPABASE_ANON_KEY = $env:DEV_SUPABASE_ANON_KEY }
        else { $env:VITE_SUPABASE_ANON_KEY = "local-smoke-anon-placeholder" }
    }
    if ($Mode -eq "full") {
        Invoke-Stage "Frontend TypeScript & Vite Build" {
            Push-Location "$RootDir\frontend"
            try {
                pnpm --config.verify-deps-before-run=false build
            } finally {
                Pop-Location
            }
        }
    }

    if ($Mode -in @("smoke", "unit", "full")) {
        Invoke-Stage "Python Unit Tests (pytest tests/unit)" {
            python -m pytest tests/unit -q
        }

        Invoke-Stage "Frontend Unit Tests (Jest)" {
            Push-Location "$RootDir\frontend"
            try {
                pnpm --config.verify-deps-before-run=false test
            } finally {
                Pop-Location
            }
        }
    }

    if ($Mode -eq "full") {
        if (Test-Path "$RootDir\check_api_health.py") {
            Invoke-Stage "API Health Check" {
                python check_api_health.py
            }
        }

        if (Test-Path "$RootDir\tests\integration") {
            Invoke-Stage "Python Integration Tests (pytest tests/integration)" {
                python -m pytest tests/integration -q
            }
        }
    }

    if ($Mode -in @("smoke", "e2e", "full")) {
        Invoke-Stage "Playwright E2E Smoke Suite" {
            Push-Location "$RootDir\frontend"
            try {
                if ($IncludeAuth) {
                    pnpm --config.verify-deps-before-run=false exec playwright test
                } else {
                    pnpm --config.verify-deps-before-run=false exec playwright test --project=smoke
                }
            } finally {
                Pop-Location
            }
        }
    }
}
finally {
    Pop-Location
    Write-Host "`n==================== TEST BATTERY SUMMARY ====================" -ForegroundColor Yellow
    $Results | Format-Table -AutoSize
}
