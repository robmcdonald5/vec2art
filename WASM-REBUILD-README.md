# WASM Rebuild Automation

This directory contains automated scripts to rebuild the WASM module with all required fixes applied automatically.

## Quick Usage

### Option 1: From Project Root

```bash
# Linux/Mac/Git Bash
./rebuild-wasm.sh

# Windows Command Prompt
rebuild-wasm.bat
```

### Option 2: From Frontend Directory

```bash
# Cross-platform npm script
cd frontend
npm run rebuild-wasm
```

## What the Scripts Do

1. **Build WASM Module**
   - Runs `wasm-pack build` with correct flags
   - Builds with `--features wasm-parallel` for multithreading

2. **Copy Files**
   - Copies all generated files to `frontend/src/lib/wasm/`
   - Preserves directory structure for worker snippets

3. **Apply Critical Fixes**
   - **Fix 1a**: Import statement - `from './__wbindgen_placeholder__.js'`
   - **Fix 1b**: Import object key - `imports['__wbindgen_placeholder__']`
   - **Fix 2**: Worker helper imports - `from '../../../vectorize_wasm.js'`
   - **Fix 3**: Worker context check - `typeof self !== 'undefined'`

4. **Synchronize to Static**
   - Copies all fixed files to `frontend/static/wasm/`
   - Ensures both locations are updated

## Benefits

- ✅ **No Manual Fixes** - All import path fixes applied automatically
- ✅ **No Missed Steps** - Comprehensive script covers all requirements
- ✅ **Cross-Platform** - Works on Windows, Mac, and Linux
- ✅ **Error Handling** - Stops on build failures
- ✅ **Verification** - Shows what was fixed and where files went

## Files Generated

After running, these locations will be updated:

- `frontend/src/lib/wasm/` - Source files for development
- `frontend/static/wasm/` - Static files for serving

## Troubleshooting

If you get build errors:

1. Ensure you're in the project root directory
2. Check that `wasm-pack` is installed: `cargo install wasm-pack`
3. Verify Rust target is installed: `rustup target add wasm32-unknown-unknown`

If fixes aren't applied:

1. The scripts use `sed` (Linux/Mac) or `powershell` (Windows)
2. Check file permissions if on Linux/Mac
3. Run with admin privileges if needed on Windows

## Why This Automation?

Previously, every WASM rebuild required manual application of 4 different fixes to multiple files. This was error-prone and annoying. Now it's fully automated and consistent.
