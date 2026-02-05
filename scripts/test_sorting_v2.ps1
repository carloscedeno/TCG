
$baseUrl = "https://sxuotvogwvmxuvwbsscv.supabase.co/functions/v1/tcg-api/api/cards"

function Test-Sort {
    param($sortParam, $testName)
    Write-Host "`nTesting: $testName ($sortParam)" -ForegroundColor Yellow
    try {
        $uri = "$baseUrl?sort=$sortParam&limit=5"
        $response = Invoke-RestMethod -Uri $uri -Method Get
        
        if ($response.cards.Count -eq 0) {
            Write-Host "   Warning: No cards returned" -ForegroundColor Gray
            return
        }

        $first = $response.cards[0]
        $last = $response.cards[$response.cards.Count - 1]
        
        Write-Host "   First Card: $($first.name) | CMC: $($first.cmc) | Price: $($first.price) | Date: $($first.release_date)" -ForegroundColor Gray
        Write-Host "   Last Card:  $($last.name) | CMC: $($last.cmc) | Price: $($last.price) | Date: $($last.release_date)" -ForegroundColor Gray
        Write-Host "   OK" -ForegroundColor Green
    }
    catch {
        Write-Host "   FAIL: $_" -ForegroundColor Red
    }
}

Test-Sort "mana_asc" "Mana Low -> High"
Test-Sort "mana_desc" "Mana High -> Low"
Test-Sort "price_asc" "Price Low -> High"
Test-Sort "price_desc" "Price High -> Low"
Test-Sort "name" "Name A-Z"
Test-Sort "newest" "Newest"
