# File: scripts/test_sorting.ps1

Write-Host "🧪 Testing Sorting Options..." -ForegroundColor Cyan

$baseUrl = "https://sxuotvogwvmxuvwbsscv.supabase.co/functions/v1/tcg-api/api/cards"

function Test-Sort {
    param($sortParam, $testName)
    Write-Host "`nTesting: $testName ($sortParam)" -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl?sort=$sortParam&limit=5" -UseBasicParsing
        $data = $response.Content | ConvertFrom-Json
        
        if ($data.cards.Count -eq 0) {
            Write-Host "   ⚠️ No cards returned" -ForegroundColor Gray
            return
        }

        $first = $data.cards[0]
        $last = $data.cards[$data.cards.Count - 1]
        
        Write-Host "   First Card: $($first.name) | CMC: $($first.cmc) | Price: $($first.price) | Date: $($first.release_date)" -ForegroundColor Gray
        Write-Host "   Last Card:  $($last.name) | CMC: $($last.cmc) | Price: $($last.price) | Date: $($last.release_date)" -ForegroundColor Gray
        Write-Host "   ✅ OK (Response received)" -ForegroundColor Green
    }
    catch {
        Write-Host "   ❌ FAIL: $_" -ForegroundColor Red
    }
}

Test-Sort "mana_asc" "Mana Low -> High"
Test-Sort "mana_desc" "Mana High -> Low"
Test-Sort "price_asc" "Price Low -> High"
Test-Sort "price_desc" "Price High -> Low"
Test-Sort "name" "Name A-Z"
Test-Sort "newest" "Newest"
