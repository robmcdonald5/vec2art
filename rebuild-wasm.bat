@echo off
REM Complete WASM rebuild script with all required fixes
REM Run from project root: rebuild-wasm.bat

echo 🔧 Building WASM module with multithreading...
cd wasm\vectorize-wasm

REM Build the WASM module
wasm-pack build --target web --out-dir pkg --features wasm-parallel

if %ERRORLEVEL% EQU 0 (
    echo ✅ Build successful!
    
    echo 📁 Copying files from pkg/ to frontend...
    copy pkg\vectorize_wasm.js ..\..\frontend\src\lib\wasm\
    copy pkg\vectorize_wasm.d.ts ..\..\frontend\src\lib\wasm\
    copy pkg\vectorize_wasm_bg.wasm ..\..\frontend\src\lib\wasm\
    copy pkg\vectorize_wasm_bg.wasm.d.ts ..\..\frontend\src\lib\wasm\
    xcopy pkg\snippets\ ..\..\frontend\src\lib\wasm\snippets\ /E /I /Y
    
    echo 🔧 CRITICAL: Applying all required import fixes...
    cd ..\..\frontend\src\lib\wasm
    
    REM Fix 1a: Import statement at top of file
    echo   → Fixing import statement...
    powershell -Command "(Get-Content vectorize_wasm.js) -replace \"from '__wbindgen_placeholder__'\", \"from './__wbindgen_placeholder__.js'\" | Set-Content vectorize_wasm.js"
    
    REM Fix 1b: Main WASM import keys in imports object
    echo   → Fixing import object keys...
    powershell -Command "(Get-Content vectorize_wasm.js) -replace \"imports\['\\./__wbindgen_placeholder__\\.js'\]\", \"imports['__wbindgen_placeholder__']\" | Set-Content vectorize_wasm.js"
    
    REM Fix 2: Worker helper imports
    echo   → Fixing worker helper imports...
    for /r snippets %%f in (workerHelpers.js) do (
        powershell -Command "(Get-Content '%%f') -replace \"from '\\.\\.\\/\\.\\.\\/\\.\\.\'\", \"from '../../../vectorize_wasm.js'\" | Set-Content '%%f'"
    )
    
    REM Fix 3: Worker context check
    echo   → Fixing worker context check...
    for /r snippets %%f in (workerHelpers.js) do (
        powershell -Command "(Get-Content '%%f') -replace 'if \\(name === \"wasm_bindgen_worker\"\\)', 'if (typeof self !== ''undefined'' && self.name === \"wasm_bindgen_worker\")' | Set-Content '%%f'"
    )
    
    echo 📁 Synchronizing to static directory...
    cd ..\..\..\
    if not exist static\wasm mkdir static\wasm
    xcopy src\lib\wasm\* static\wasm\ /E /I /Y
    
    echo 🎉 WASM rebuild complete with all fixes applied!
    echo ✅ All import paths fixed automatically
    echo ✅ Worker helpers fixed
    echo ✅ Files synchronized to static directory
    echo.
    echo ℹ️  Changes deployed to:
    echo    • frontend/src/lib/wasm/ (source^)
    echo    • frontend/static/wasm/ (static serving^)
    echo.
    echo 🚀 Ready to test!
) else (
    echo ❌ Build failed!
    exit /b 1
)