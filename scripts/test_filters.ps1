# Test Filters Script
# This script tests all filter endpoints to verify they work correctly

Write-Host "Testing TCG API Filters..." -ForegroundColor Cyan
Write-Host ""

$baseUrl = "https://sxuotvogwvmxuvwbsscv.supabase.co/functions/v1/tcg-api/api/cards"
$testResults = @()

# Test 1: Game Filter
Write-Host "1. Testing Game Filter (Magic: The Gathering)" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl?game=Magic:%20The%20Gathering&limit=5" -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    if ($data.cards.Count -gt 0) {
        Write-Host "   PASS - Returned $($data.cards.Count) cards" -ForegroundColor Green
        $testResults += @{ Test = "Game Filter"; Status = "PASS" }
    }
    else {
        Write-Host "   FAIL - No cards returned" -ForegroundColor Red
        $testResults += @{ Test = "Game Filter"; Status = "FAIL" }
    }
}
catch {
    Write-Host "   FAIL - Error: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{ Test = "Game Filter"; Status = "ERROR" }
}

# Test 2: Rarity Filter
Write-Host "`n2. Testing Rarity Filter (rare)" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl?rarity=rare&limit=5" -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    if ($data.cards.Count -gt 0) {
        Write-Host "   PASS - Returned $($data.cards.Count) cards" -ForegroundColor Green
        $testResults += @{ Test = "Rarity Filter"; Status = "PASS" }
    }
    else {
        Write-Host "   FAIL - No cards returned" -ForegroundColor Red
        $testResults += @{ Test = "Rarity Filter"; Status = "FAIL" }
    }
}
catch {
    Write-Host "   FAIL - Error: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{ Test = "Rarity Filter"; Status = "ERROR" }
}

# Test 3: Color Filter
Write-Host "`n3. Testing Color Filter (Red)" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl?color=Red&limit=5" -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    if ($data.cards.Count -gt 0) {
        Write-Host "   PASS - Returned $($data.cards.Count) cards" -ForegroundColor Green
        $testResults += @{ Test = "Color Filter"; Status = "PASS" }
    }
    else {
        Write-Host "   FAIL - No cards returned" -ForegroundColor Red
        $testResults += @{ Test = "Color Filter"; Status = "FAIL" }
    }
}
catch {
    Write-Host "   FAIL - Error: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{ Test = "Color Filter"; Status = "ERROR" }
}

# Test 4: Type Filter (NEW)
Write-Host "`n4. Testing Type Filter (Creature)" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl?type=Creature&limit=5" -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    if ($data.cards.Count -gt 0) {
        Write-Host "   PASS - Returned $($data.cards.Count) cards" -ForegroundColor Green
        $testResults += @{ Test = "Type Filter"; Status = "PASS" }
    }
    else {
        Write-Host "   FAIL - No cards returned" -ForegroundColor Red
        $testResults += @{ Test = "Type Filter"; Status = "FAIL" }
    }
}
catch {
    Write-Host "   FAIL - Error: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{ Test = "Type Filter"; Status = "ERROR" }
}

# Test 5: Year Range Filter (NEW)
Write-Host "`n5. Testing Year Range Filter (2020-2023)" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl?year_from=2020&year_to=2023&limit=5" -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    if ($data.cards.Count -gt 0) {
        Write-Host "   PASS - Returned $($data.cards.Count) cards" -ForegroundColor Green
        $testResults += @{ Test = "Year Range Filter"; Status = "PASS" }
    }
    else {
        Write-Host "   FAIL - No cards returned" -ForegroundColor Red
        $testResults += @{ Test = "Year Range Filter"; Status = "FAIL" }
    }
}
catch {
    Write-Host "   FAIL - Error: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{ Test = "Year Range Filter"; Status = "ERROR" }
}

# Test 6: Combined Filters
Write-Host "`n6. Testing Combined Filters (Game + Rarity + Type)" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl?game=Magic:%20The%20Gathering&rarity=mythic&type=Creature&limit=5" -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    if ($data.cards.Count -gt 0) {
        Write-Host "   PASS - Returned $($data.cards.Count) cards" -ForegroundColor Green
        $testResults += @{ Test = "Combined Filters"; Status = "PASS" }
    }
    else {
        Write-Host "   FAIL - No cards returned" -ForegroundColor Red
        $testResults += @{ Test = "Combined Filters"; Status = "FAIL" }
    }
}
catch {
    Write-Host "   FAIL - Error: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{ Test = "Combined Filters"; Status = "ERROR" }
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$passed = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$failed = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count
$errors = ($testResults | Where-Object { $_.Status -eq "ERROR" }).Count
$total = $testResults.Count

Write-Host "`nPassed: $passed / $total" -ForegroundColor Green
Write-Host "Failed: $failed / $total" -ForegroundColor Red
Write-Host "Errors: $errors / $total" -ForegroundColor Yellow

if ($passed -eq $total) {
    Write-Host "`nALL TESTS PASSED!" -ForegroundColor Green
}
else {
    Write-Host "`nSOME TESTS FAILED - Review above for details" -ForegroundColor Yellow
}
