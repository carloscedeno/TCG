#!/usr/bin/env pwsh
$token = [Environment]::GetEnvironmentVariable('SUPABASE_ACCESS_TOKEN', 'User')
if (-not $token) {
    Write-Error "SUPABASE_ACCESS_TOKEN no configurado. Créalo en https://supabase.com/dashboard/account/tokens"
    exit 1
}
npx -y @supabase/mcp-server-supabase@latest --access-token $token
