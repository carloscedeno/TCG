#!/usr/bin/env pwsh
$token = [Environment]::GetEnvironmentVariable('GITHUB_TOKEN', 'User')
if (-not $token) {
    Write-Error "GITHUB_TOKEN no configurado. Ejecuta: gh auth token"
    exit 1
}
$env:GITHUB_PERSONAL_ACCESS_TOKEN = $token
npx -y github-mcp-custom@latest stdio
