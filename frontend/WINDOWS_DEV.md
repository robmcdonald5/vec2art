# Windows Development Notes

## Vercel Adapter Symlink Issue

**Issue**: On Windows, the Vercel adapter may fail during build with `EPERM: operation not permitted, symlink` errors.

**Root Cause**: Windows requires special permissions to create symbolic links, which the Vercel adapter uses during the build process.

**Impact**:
- ✅ **CI/CD**: Not affected (GitHub Actions uses Linux runners)
- ✅ **SvelteKit Development**: Works fine (`npm run dev`)
- ❌ **Local Production Builds**: May fail with symlink errors

## Solutions

### Option 1: Enable Windows Developer Mode (Recommended)
1. Open Windows Settings → Update & Security → For Developers
2. Enable "Developer Mode"
3. Restart your terminal/VS Code
4. Run builds normally

### Option 2: Run as Administrator
1. Right-click on your terminal/VS Code
2. Select "Run as administrator"
3. Run the build command

### Option 3: Use WSL2 (Alternative)
```bash
# Install WSL2 with Ubuntu
wsl --install
# Run builds in WSL2 environment
wsl
cd /mnt/c/path/to/project/frontend
npm run build
```

## Build Verification

The GitHub Actions workflow has been updated to check for the correct SvelteKit output directories:
- `.svelte-kit/output/client/` - Client-side build output
- `.svelte-kit/output/server/` - Server-side build output

This ensures consistent builds across environments while avoiding Windows-specific symlink issues.