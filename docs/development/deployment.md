# Deployment

CI/CD pipeline and Vercel deployment configuration.

## Overview

vec2art uses Vercel Git Integration for deployment:

- **GitHub Actions**: Quality checks (lint, test, build)
- **Vercel**: Automatic deployments from Git

## Branch Strategy

| Branch           | Deployment | URL                        |
| ---------------- | ---------- | -------------------------- |
| `main`           | Production | vec2art.vercel.app         |
| `dev`            | Preview    | Auto-generated preview URL |
| Feature branches | Preview    | Auto-generated preview URL |

## CI Pipeline

### GitHub Actions

Located at `.github/workflows/ci.yml`:

```yaml
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: frontend
        run: npm ci

      - name: Format check
        working-directory: frontend
        run: npx prettier --check .

      - name: Lint
        working-directory: frontend
        run: npx eslint . --max-warnings=0

      - name: Type check
        working-directory: frontend
        run: npx svelte-kit sync && npx svelte-check --tsconfig ./tsconfig.json

      - name: Unit tests
        working-directory: frontend
        run: npm run test:coverage

      - name: Build
        working-directory: frontend
        run: npm run build
```

### Quality Gates

All checks must pass before merge:

- Prettier formatting
- ESLint (zero warnings)
- TypeScript/Svelte type checking
- Unit tests with coverage
- Production build

## Vercel Configuration

### vercel.json

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cross-Origin-Embedder-Policy",
          "value": "require-corp"
        },
        {
          "key": "Cross-Origin-Opener-Policy",
          "value": "same-origin"
        }
      ]
    }
  ]
}
```

Cross-Origin Isolation headers are required for WASM features.

### SvelteKit Adapter

```javascript
// svelte.config.js
import adapter from "@sveltejs/adapter-vercel";

export default {
  kit: {
    adapter: adapter({
      runtime: "nodejs20.x",
      regions: ["iad1"],
      memory: 1024,
      maxDuration: 30,
    }),
  },
};
```

## Deployment Process

### Automatic Deployment

1. Push to any branch
2. GitHub Actions runs quality checks
3. If checks pass, Vercel builds and deploys
4. Preview URL generated (or production updated for `main`)

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy preview
cd frontend
vercel

# Deploy production
vercel --prod
```

## Environment Variables

Set in Vercel dashboard:

| Variable              | Purpose                       |
| --------------------- | ----------------------------- |
| `PUBLIC_SITE_URL`     | Production URL for SEO        |
| `PUBLIC_ANALYTICS_ID` | Analytics tracking (optional) |

## Pre-Deployment Checklist

```bash
cd frontend

# 1. Format code
npx prettier --write .

# 2. Run all checks
npm run lint
npm run check
npm run test:coverage

# 3. Test production build
npm run build
npm run preview
```

## Troubleshooting

### CI Failures

| Issue             | Solution                          |
| ----------------- | --------------------------------- |
| Formatting failed | Run `npx prettier --write .`      |
| Lint errors       | Run `npm run lint:fix`            |
| Type errors       | Check compiler output, fix types  |
| Test failures     | Run tests locally, check failures |

### Deployment Failures

| Issue           | Solution                             |
| --------------- | ------------------------------------ |
| Build timeout   | Check for infinite loops in build    |
| Memory exceeded | Reduce bundle size or increase limit |
| WASM errors     | Verify Cross-Origin headers          |
| 404 on routes   | Check adapter configuration          |

### Vercel Dashboard

Check deployment logs at:
`https://vercel.com/[your-team]/vec2art/deployments`

## Rollback

If a deployment has issues:

1. Open Vercel dashboard
2. Find last working deployment
3. Click "Promote to Production"

Or revert the Git commit and push.

## Performance Monitoring

Vercel provides:

- Core Web Vitals tracking
- Function execution metrics
- Edge network performance

Access via Vercel dashboard > Analytics.

## Local Development vs Production

| Aspect  | Development     | Production  |
| ------- | --------------- | ----------- |
| Server  | Vite dev server | Vercel Edge |
| WASM    | Hot reload      | Cached      |
| Headers | Vite config     | vercel.json |
| Build   | Unbundled       | Optimized   |

Development mimics production headers via vite.config.ts:

```typescript
server: {
  headers: {
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin'
  }
}
```
