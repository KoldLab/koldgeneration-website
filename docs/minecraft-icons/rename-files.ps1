# PowerShell script to rename Minecraft item icons
Write-Host "Renaming Minecraft item icons..." -ForegroundColor Cyan
Write-Host ""

$renamedCount = 0
$skippedCount = 0

# Get all PNG files in current directory
Get-ChildItem -Path . -Filter "*.png" | ForEach-Object {
    $file = $_.Name
    
    if ($file -match '^minecraft__') {
        # Pattern: minecraft__item_name__0.png -> item_name.png
        $newName = $file -replace '^minecraft__', '' -replace '__\d+\.png$', '.png'
        
        # Check if target already exists
        if (Test-Path $newName) {
            Write-Host "Skipping $file ($newName already exists)" -ForegroundColor Yellow
            $skippedCount++
        } else {
            Rename-Item -Path $file -NewName $newName
            Write-Host "Renamed: $file -> $newName" -ForegroundColor Green
            $renamedCount++
        }
    } else {
        Write-Host "Already correct: $file" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Done! Renamed $renamedCount files, skipped $skippedCount files." -ForegroundColor Cyan

