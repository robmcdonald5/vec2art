# PowerShell SVG Path Analysis Script
# Extracts and compares path data between SVG files

param(
    [string]$File1 = "examples\outputs\debug_artistic_effects\none\checkerboard.svg",
    [string]$File2 = "examples\outputs\debug_artistic_effects\sketchy\checkerboard.svg"
)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "SVG PATH DATA COMPARISON" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

function Analyze-SVGFile {
    param([string]$FilePath)
    
    if (-not (Test-Path $FilePath)) {
        Write-Host "File not found: $FilePath" -ForegroundColor Red
        return $null
    }
    
    $content = Get-Content $FilePath -Raw
    
    # Extract all path elements
    $pathMatches = [regex]::Matches($content, '<path[^>]*d="([^"]*)"[^>]*/?>')
    
    # Extract stroke-width values
    $strokeWidths = [regex]::Matches($content, 'stroke-width="([^"]*)"') | ForEach-Object { $_.Groups[1].Value }
    
    # Extract stroke-opacity values
    $strokeOpacities = [regex]::Matches($content, 'stroke-opacity="([^"]*)"') | ForEach-Object { $_.Groups[1].Value }
    
    # Count different path commands
    $pathData = $pathMatches | ForEach-Object { $_.Groups[1].Value }
    $totalPathLength = ($pathData -join "").Length
    
    # Count curve commands (C, S, Q, T indicate curves/tremor)
    $curveCommands = 0
    $pathData | ForEach-Object {
        $curveCommands += ([regex]::Matches($_, '[CSQTcsqt]')).Count
    }
    
    # Count line commands (L, H, V for straight lines)
    $lineCommands = 0
    $pathData | ForEach-Object {
        $lineCommands += ([regex]::Matches($_, '[LHVlhv]')).Count
    }
    
    # Check for decimal precision (more decimals = more detail/tremor)
    $decimalCount = 0
    $pathData | ForEach-Object {
        $decimalCount += ([regex]::Matches($_, '\.\d+')).Count
    }
    
    $avgDecimalsPerPath = if ($pathMatches.Count -gt 0) { $decimalCount / $pathMatches.Count } else { 0 }
    
    return @{
        FilePath = $FilePath
        FileName = Split-Path $FilePath -Leaf
        FileSize = (Get-Item $FilePath).Length
        PathCount = $pathMatches.Count
        TotalPathLength = $totalPathLength
        StrokeWidths = $strokeWidths
        UniqueStrokeWidths = ($strokeWidths | Select-Object -Unique).Count
        StrokeOpacities = $strokeOpacities
        CurveCommands = $curveCommands
        LineCommands = $lineCommands
        DecimalCount = $decimalCount
        AvgDecimalsPerPath = $avgDecimalsPerPath
    }
}

function Compare-SVGFiles {
    param(
        [hashtable]$Analysis1,
        [hashtable]$Analysis2
    )
    
    Write-Host "File 1: $($Analysis1.FileName)" -ForegroundColor Yellow
    Write-Host "File 2: $($Analysis2.FileName)" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "FILE SIZE:" -ForegroundColor Green
    $sizeDiff = $Analysis2.FileSize - $Analysis1.FileSize
    $sizeRatio = if ($Analysis1.FileSize -gt 0) { [math]::Round($Analysis2.FileSize / $Analysis1.FileSize, 3) } else { 0 }
    Write-Host "  File 1: $($Analysis1.FileSize) bytes"
    Write-Host "  File 2: $($Analysis2.FileSize) bytes"
    Write-Host "  Difference: $sizeDiff bytes (Ratio: $sizeRatio)" -ForegroundColor $(if ($sizeDiff -eq 0) { "Red" } else { "Green" })
    Write-Host ""
    
    Write-Host "PATH METRICS:" -ForegroundColor Green
    Write-Host "  Path Count: $($Analysis1.PathCount) -> $($Analysis2.PathCount)"
    Write-Host "  Total Path Length: $($Analysis1.TotalPathLength) -> $($Analysis2.TotalPathLength)"
    $pathLengthDiff = $Analysis2.TotalPathLength - $Analysis1.TotalPathLength
    Write-Host "  Path Length Difference: $pathLengthDiff chars" -ForegroundColor $(if ($pathLengthDiff -eq 0) { "Red" } else { "Green" })
    Write-Host ""
    
    Write-Host "STROKE ANALYSIS:" -ForegroundColor Green
    Write-Host "  Unique Stroke Widths:"
    Write-Host "    File 1: $($Analysis1.UniqueStrokeWidths) unique values"
    Write-Host "    File 2: $($Analysis2.UniqueStrokeWidths) unique values"
    $strokeVariation = $Analysis2.UniqueStrokeWidths - $Analysis1.UniqueStrokeWidths
    if ($strokeVariation -gt 0) {
        Write-Host "  ✓ Variable stroke widths detected! (+$strokeVariation)" -ForegroundColor Green
    } elseif ($strokeVariation -eq 0) {
        Write-Host "  ✗ No change in stroke width variation" -ForegroundColor Red
    }
    Write-Host ""
    
    Write-Host "PATH COMMANDS:" -ForegroundColor Green
    Write-Host "  Curve Commands (C,S,Q,T - indicate tremor/organic lines):"
    Write-Host "    File 1: $($Analysis1.CurveCommands)"
    Write-Host "    File 2: $($Analysis2.CurveCommands)"
    $curveDiff = $Analysis2.CurveCommands - $Analysis1.CurveCommands
    if ($curveDiff -gt 0) {
        Write-Host "  ✓ More curves detected! (+$curveDiff) - Indicates tremor effect" -ForegroundColor Green
    } elseif ($curveDiff -eq 0) {
        Write-Host "  ✗ No change in curve usage" -ForegroundColor Red
    }
    Write-Host ""
    
    Write-Host "  Line Commands (L,H,V - straight lines):"
    Write-Host "    File 1: $($Analysis1.LineCommands)"
    Write-Host "    File 2: $($Analysis2.LineCommands)"
    Write-Host ""
    
    Write-Host "COORDINATE PRECISION:" -ForegroundColor Green
    Write-Host "  Decimal Count:"
    Write-Host "    File 1: $($Analysis1.DecimalCount) (avg: $([math]::Round($Analysis1.AvgDecimalsPerPath, 2))/path)"
    Write-Host "    File 2: $($Analysis2.DecimalCount) (avg: $([math]::Round($Analysis2.AvgDecimalsPerPath, 2))/path)"
    $decimalDiff = $Analysis2.DecimalCount - $Analysis1.DecimalCount
    if ([Math]::Abs($decimalDiff) -gt 10) {
        Write-Host "  ✓ Significant precision change! ($decimalDiff decimals)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ No significant precision change" -ForegroundColor Red
    }
    Write-Host ""
    
    # Overall verdict
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host "VERDICT:" -ForegroundColor Cyan
    
    $effectsDetected = ($sizeDiff -ne 0) -or ($pathLengthDiff -ne 0) -or ($strokeVariation -gt 0) -or ($curveDiff -ne 0) -or ([Math]::Abs($decimalDiff) -gt 10)
    
    if ($effectsDetected) {
        Write-Host "✓ ARTISTIC EFFECTS DETECTED!" -ForegroundColor Green
        Write-Host "  Changes found in: " -NoNewline
        $changes = @()
        if ($sizeDiff -ne 0) { $changes += "file size" }
        if ($pathLengthDiff -ne 0) { $changes += "path complexity" }
        if ($strokeVariation -gt 0) { $changes += "stroke variation" }
        if ($curveDiff -ne 0) { $changes += "curve usage" }
        if ([Math]::Abs($decimalDiff) -gt 10) { $changes += "coordinate precision" }
        Write-Host ($changes -join ", ") -ForegroundColor Green
    } else {
        Write-Host "✗ NO ARTISTIC EFFECTS DETECTED" -ForegroundColor Red
        Write-Host "  Files appear to be identical or nearly identical" -ForegroundColor Red
    }
    Write-Host "============================================" -ForegroundColor Cyan
}

# Main execution
$analysis1 = Analyze-SVGFile -FilePath $File1
$analysis2 = Analyze-SVGFile -FilePath $File2

if ($analysis1 -and $analysis2) {
    Compare-SVGFiles -Analysis1 $analysis1 -Analysis2 $analysis2
    
    # Extract first few paths for manual inspection
    Write-Host ""
    Write-Host "SAMPLE PATH DATA (First path from each file):" -ForegroundColor Cyan
    Write-Host ""
    
    $content1 = Get-Content $File1 -Raw
    $firstPath1 = [regex]::Match($content1, '<path[^>]*d="([^"]*)"').Groups[1].Value
    if ($firstPath1.Length -gt 200) { $firstPath1 = $firstPath1.Substring(0, 200) + "..." }
    
    $content2 = Get-Content $File2 -Raw
    $firstPath2 = [regex]::Match($content2, '<path[^>]*d="([^"]*)"').Groups[1].Value
    if ($firstPath2.Length -gt 200) { $firstPath2 = $firstPath2.Substring(0, 200) + "..." }
    
    Write-Host "File 1 first path:" -ForegroundColor Yellow
    Write-Host $firstPath1
    Write-Host ""
    Write-Host "File 2 first path:" -ForegroundColor Yellow
    Write-Host $firstPath2
    
    if ($firstPath1 -eq $firstPath2) {
        Write-Host ""
        Write-Host "⚠ WARNING: First paths are IDENTICAL!" -ForegroundColor Red
    }
}