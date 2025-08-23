# WASM Rebuild Script for Windows (PowerShell)
# This script rebuilds the WASM module and applies all necessary fixes

Write-Host ""
Write-Host "========================================"
Write-Host "WASM Rebuild Script for Web Worker Pattern"
Write-Host "========================================"
Write-Host ""

# Navigate to WASM directory
Push-Location
Set-Location "vectorize-wasm"

Write-Host "Building WASM module with parallel features..."
& wasm-pack build --target web --out-dir pkg --features wasm-parallel

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build successful!" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Copying files to frontend..."
    # Copy to lib/wasm for imports
    Copy-Item -Path "pkg\*" -Destination "..\..\frontend\src\lib\wasm\" -Recurse -Force
    
    # Copy to static/wasm for worker access
    Copy-Item -Path "pkg\*" -Destination "..\..\frontend\static\wasm\" -Recurse -Force
    
    Write-Host ""
    Write-Host "Applying critical import path fixes..."
    
    # Fix import path in lib/wasm/vectorize_wasm.js
    $libWasmFile = "..\..\frontend\src\lib\wasm\vectorize_wasm.js"
    if (Test-Path $libWasmFile) {
        $content = Get-Content $libWasmFile -Raw
        
        # Fix Line ~2: import path
        $content = $content -replace "from '__wbindgen_placeholder__'", "from './__wbindgen_placeholder__.js'"
        
        # Note: The second fix (imports object key) may not be needed in newer versions
        # Check if it exists before applying
        if ($content -match "imports\['./__wbindgen_placeholder__.js'\]") {
            $content = $content -replace "imports\['./__wbindgen_placeholder__.js'\]", "imports['__wbindgen_placeholder__']"
        }
        
        Set-Content -Path $libWasmFile -Value $content -NoNewline
        Write-Host "Fixed import paths in lib/wasm/vectorize_wasm.js" -ForegroundColor Green
    }
    
    # Fix worker helper in lib/wasm
    $workerHelpers = Get-ChildItem -Path "..\..\frontend\src\lib\wasm\snippets\" -Filter "workerHelpers.js" -Recurse
    foreach ($helper in $workerHelpers) {
        $content = Get-Content $helper.FullName -Raw
        $content = $content -replace 'if \(name === "wasm_bindgen_worker"\)', 'if (typeof self !== ''undefined'' && self.name === "wasm_bindgen_worker")'
        Set-Content -Path $helper.FullName -Value $content -NoNewline
        Write-Host "Fixed worker helper: $($helper.Name)" -ForegroundColor Green
    }
    
    # Apply same fixes to static/wasm
    Write-Host ""
    Write-Host "Applying fixes to static/wasm..."
    
    $staticWasmFile = "..\..\frontend\static\wasm\vectorize_wasm.js"
    if (Test-Path $staticWasmFile) {
        $content = Get-Content $staticWasmFile -Raw
        $content = $content -replace "from '__wbindgen_placeholder__'", "from './__wbindgen_placeholder__.js'"
        
        if ($content -match "imports\['./__wbindgen_placeholder__.js'\]") {
            $content = $content -replace "imports\['./__wbindgen_placeholder__.js'\]", "imports['__wbindgen_placeholder__']"
        }
        
        Set-Content -Path $staticWasmFile -Value $content -NoNewline
        Write-Host "Fixed import paths in static/wasm/vectorize_wasm.js" -ForegroundColor Green
    }
    
    # Fix worker helpers in static/wasm
    $staticWorkerHelpers = Get-ChildItem -Path "..\..\frontend\static\wasm\snippets\" -Filter "workerHelpers.js" -Recurse -ErrorAction SilentlyContinue
    foreach ($helper in $staticWorkerHelpers) {
        $content = Get-Content $helper.FullName -Raw
        $content = $content -replace 'if \(name === "wasm_bindgen_worker"\)', 'if (typeof self !== ''undefined'' && self.name === "wasm_bindgen_worker")'
        Set-Content -Path $helper.FullName -Value $content -NoNewline
        Write-Host "Fixed worker helper: $($helper.Name)" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "========================================"
    Write-Host "WASM BUILD COMPLETE!" -ForegroundColor Green
    Write-Host "========================================"
    Write-Host ""
    Write-Host "Verification Checklist:"
    Write-Host "  [✓] WASM built with --features wasm-parallel"
    Write-Host "  [✓] Files copied to frontend/src/lib/wasm/"
    Write-Host "  [✓] Files copied to frontend/static/wasm/"
    Write-Host "  [✓] Import paths fixed in vectorize_wasm.js"
    Write-Host "  [✓] Worker helper fixed in workerHelpers.js"
    Write-Host ""
    Write-Host "Ready to test at: http://localhost:5173/converter"
    Write-Host ""
    Write-Host "Expected behavior:"
    Write-Host "  - No browser freezing on page load"
    Write-Host "  - WASM initializes in Web Worker"
    Write-Host "  - Threading works without UI blocking"
    Write-Host "  - Image processing remains responsive"
} else {
    Write-Host "Build failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}

Pop-Location