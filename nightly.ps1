# Nightly Autonomous Sync & Verification Script
$env:PYTHONPATH = "."

Write-Host "--- 1. Syncing CardKingdom Data ---" -ForegroundColor Cyan
python scripts/sync_cardkingdom_api.py

Write-Host "--- 2. Fixing Missing Prices ---" -ForegroundColor Cyan
python scripts/fix_missing_prices.py

Write-Host "--- 3. Running API Health Checks ---" -ForegroundColor Cyan
python check_api_health.py

Write-Host "--- 4. Verifying PRD Features (Commerce, Analytics, Alerts) ---" -ForegroundColor Cyan
python tests/verify_prd_features.py

Write-Host "--- 5. Running Regression Tests (Supabase) ---" -ForegroundColor Cyan
python tests/verify_supabase_functions.py

Write-Host "--- 6. Committing Progress ---" -ForegroundColor Cyan
git add .
git commit -m "🤖 Nightly Autonomous Sync: Complete (Data, Commerce, Analytics)"
git push origin main

Write-Host "--- NIGHTLY SYNC COMPLETED SUCCESSFULLY ---" -ForegroundColor Green
