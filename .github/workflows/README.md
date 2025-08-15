# GitHub Actions Workflows

This directory contains the CI/CD workflows for the vec2art project.

## 🚀 Active Workflows

### Frontend CI/CD Pipeline
**File:** `frontend-ci.yml`  
**Triggers:** Push to main, Pull requests affecting frontend  
**Badge:** ![Frontend CI](https://github.com/YOUR_USERNAME/vec2art/workflows/Frontend%20CI/CD%20Pipeline/badge.svg)

**What it does:**
- ✅ **Cross-Platform Testing**: Ubuntu & Windows with Node.js 18.x & 20.x
- 🎨 **Code Quality**: Prettier formatting checks
- 🔍 **Type Safety**: SvelteKit sync + TypeScript checking with strict mode
- 🚨 **Linting**: ESLint with zero warnings tolerance
- 🧪 **Testing**: Vitest unit tests with coverage reporting
- 🏗️ **Build Verification**: Full SvelteKit production build + smoke tests
- 🌐 **WASM Integration**: Validates WASM multithreading compatibility
- 📦 **Artifacts**: Upload coverage reports and build artifacts
- 🎭 **E2E Testing**: Playwright end-to-end tests on PRs

### WASM Build Pipeline
**File:** `wasm-build.yml`  
**Triggers:** Push to main, Pull requests affecting Rust/WASM code  
**Badge:** ![WASM Build](https://github.com/YOUR_USERNAME/vec2art/workflows/WASM%20Build%20%26%20Test/badge.svg)

**What it does:**
- 🦀 **Rust Quality**: rustfmt, clippy lints for all packages
- 🧪 **Cross-Platform Testing**: Ubuntu, Windows, macOS
- 🕸️ **WASM Compilation**: wasm-pack builds with size optimization
- 🏃 **Performance Testing**: Benchmark tests and size comparisons
- 🔗 **Integration Testing**: Frontend + WASM integration validation
- 📱 **CLI Testing**: Native binary builds and functionality tests

### Security Scanning
**File:** `security-scan.yml`  
**Triggers:** Push, Pull requests, Weekly schedule  
**Badge:** ![Security Scan](https://github.com/YOUR_USERNAME/vec2art/workflows/Security%20Scan/badge.svg)

**What it does:**
- 🔒 **Dependency Auditing**: npm audit + cargo audit
- 🕵️ **Code Analysis**: GitHub CodeQL security scanning
- 📊 **Vulnerability Reports**: Automated security artifact uploads
- ⚠️ **Threshold Management**: Fails on critical vulnerabilities
- 📅 **Weekly Monitoring**: Scheduled security health checks

## 📋 Workflow Standards

### Commit Requirements
All workflows enforce these standards:
- **Formatting**: Prettier for consistent code style
- **Linting**: ESLint with zero warnings policy
- **Type Safety**: Full TypeScript strict mode checking
- **Testing**: Automated test suite execution
- **Security**: Dependency vulnerability scanning

### Performance Features
- **Smart Caching**: npm dependencies, Rust builds, SvelteKit files
- **Parallel Execution**: Matrix builds across platforms/versions
- **Artifact Management**: Build outputs and test reports
- **Fail-Fast Strategy**: Quick feedback on critical issues
- **Resource Optimization**: Memory limits and timeout controls

### Branch Protection
The `main` branch should be protected with these requirements:
- ✅ All status checks must pass
- ✅ Require branches to be up to date
- ✅ Require at least 1 review for PRs
- ✅ Dismiss stale reviews when new commits are pushed
- ✅ Require status checks: "Frontend CI", "WASM Build", "Security Scan"

## 🔧 Local Development

### Running CI Checks Locally

```bash
# Frontend checks
cd frontend
npm ci
npx prettier --check .
npx svelte-kit sync
npx svelte-check --tsconfig ./tsconfig.json --fail-on-warnings
npx eslint . --max-warnings=0
npx vitest run
npm run build

# WASM checks
cd ../vectorize-core
cargo fmt --all -- --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test --all-features

# Security checks
npm audit --audit-level=moderate
cargo audit
```

### Setting Up Pre-commit Hooks

Consider setting up pre-commit hooks to run these checks automatically:

```bash
# Install pre-commit
pip install pre-commit

# Set up hooks (create .pre-commit-config.yaml)
pre-commit install
```

## 🤖 Dependabot Configuration

Automated dependency updates are configured in `.github/dependabot.yml`:
- **Frontend**: Weekly npm dependency updates
- **Rust**: Weekly cargo dependency updates  
- **GitHub Actions**: Monthly workflow updates
- **Grouping**: Related dependencies bundled to reduce PR noise

## 📊 Monitoring & Badges

Add these badges to your README.md:

```markdown
![Frontend CI](https://github.com/YOUR_USERNAME/vec2art/workflows/Frontend%20CI/CD%20Pipeline/badge.svg)
![WASM Build](https://github.com/YOUR_USERNAME/vec2art/workflows/WASM%20Build%20%26%20Test/badge.svg)
![Security Scan](https://github.com/YOUR_USERNAME/vec2art/workflows/Security%20Scan/badge.svg)
```

## 🚨 Troubleshooting

### Common Issues

**WASM files causing Prettier errors:**
- ✅ Fixed: WASM files excluded via `.prettierignore`

**Missing coverage dependency:**
- ✅ Fixed: Conditional coverage execution in workflow

**Cross-origin isolation for WASM threading:**
- ✅ Handled: Build succeeds despite WASM threading requirements

**TypeScript errors with WASM:**
- ✅ Fixed: WASM generated files excluded from TypeScript checking

### Debug Workflows

Enable debug logging by setting repository secrets:
- `ACTIONS_STEP_DEBUG: true`
- `ACTIONS_RUNNER_DEBUG: true`

---

**Note:** Replace `YOUR_USERNAME` in badge URLs with your actual GitHub username.