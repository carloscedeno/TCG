
# Autopilot.ps1 - Agentic Dream Framework Executor [Windows Version]
param (
    [string]$SpecsFile = "..\..\docs\specs\stories.json",
    [string]$LogFile = "..\..\logs\progress.txt"
)

# Configuration
$ErrorActionPreference = "Stop"

function Get-NextStory {
    param($jsonFile)
    $content = Get-Content -Raw $jsonFile | ConvertFrom-Json
    foreach ($story in $content.stories) {
        if (-not $story.passes) {
            return $story
        }
    }
    return $null
}

Write-Host "🔵 Agentic Dream Engine: ONLINE" -ForegroundColor Cyan

# Main Loop
while ($true) {
    $story = Get-NextStory -jsonFile $SpecsFile
    
    if ($null -eq $story) {
        Write-Host "✅ All stories complete!" -ForegroundColor Green
        break
    }

    Write-Host "`n🚀 CURRENT MISSION: $($story.id)" -ForegroundColor Yellow
    Write-Host "📄 Description: $($story.description)"
    Write-Host "📂 Files: $($story.files_to_touch -join ', ')"
    Write-Host "`n🚦 ACCEPTANCE CRITERIA:"
    $story.acceptance_criteria | ForEach-Object { Write-Host "  - $_" }

    Write-Host "`n🤖 [PRIME PHASE]" -ForegroundColor Magenta
    Write-Host "Action: Load 'docs/specs/stories.json' and '.cursor/rules/global.mdc'."
    Write-Host "Goal: Understand the task. Do NOT code."
    
    Read-Host "Press Enter after you have PRIMED the agent..."

    Write-Host "`n📝 [PLAN PHASE]" -ForegroundColor Magenta
    Write-Host "Action: Ask agent for a detailed Implementation Plan."
    Write-Host "Goal: Get user approval for the plan."

    Read-Host "Press Enter after you have an APPROVED PLAN..."

    Write-Host "`n🛑 [RESET PHASE - KILL SWITCH]" -ForegroundColor Red
    Write-Host "Action: Press Ctrl+K / Clear Context / New Chat."
    Write-Host "Goal: Restore Agent IQ to 100%."
    
    $confirm = Read-Host "Have you RESET the context logic? (y/n)"
    if ($confirm -ne 'y') {
        Write-Host "⚠️ YOU MUST RESET CONTEXT!" -ForegroundColor Red
        continue
    }

    Write-Host "`n⚡ [EXECUTE PHASE]" -ForegroundColor Cyan
    Write-Host "Action: Paste the Plan. Generate Code."
    Write-Host "Goal: Fulfill acceptance criteria."

    Read-Host "Press Enter after Execution is complete..."

    # Verification
    Write-Host "`n🔍 [VERIFICATION PHASE]" -ForegroundColor Green
    $allPassed = $true
    foreach ($criteria in $story.acceptance_criteria) {
        $result = Read-Host "Did pass: '$criteria'? (y/n)"
        if ($result -ne 'y') {
            $allPassed = $false
            Write-Host "❌ Failed: $criteria" -ForegroundColor Red
        }
    }

    if ($allPassed) {
        Write-Host "✅ Story Complete!" -ForegroundColor Green
        # Update JSON (Simple string replace for MVP, ideally use jq equivalent)
        # Note: In a real script, we'd perform proper JSON manipulation. 
        # For now, we ask the human to update it or we implemented a simple toggle later.
        Write-Host "👉 Please manually update 'stories.json' to set 'passes': true for $($story.id)"
        
        $logEntry = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm')] ✅ $($story.id): $($story.description)"
        Add-Content -Path $LogFile -Value $logEntry
    } else {
        Write-Host "❌ Story Failed. Update agents.md with lessons learned." -ForegroundColor Red
    }
}
