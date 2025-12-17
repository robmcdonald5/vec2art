# vec2art Frontend

SvelteKit 5 frontend for the vec2art image-to-SVG conversion tool.

## Quick Start

```bash
npm install
npm run build:wasm
npm run dev
```

Visit `http://localhost:5173`.

## Environment Variables

For the contact form (optional):

```bash
cp .env.example .env
```

Required variables:

- `PUBLIC_FORMSPARK_ENDPOINT_ID` - Formspark form endpoint
- `PUBLIC_TURNSTILE_SITE_KEY` - Cloudflare Turnstile key

## Commands

| Command              | Description              |
| -------------------- | ------------------------ |
| `npm run dev`        | Start development server |
| `npm run build`      | Production build         |
| `npm run preview`    | Preview production build |
| `npm run build:wasm` | Rebuild WASM module      |
| `npm test`           | Run unit tests           |
| `npm run lint`       | Run linting checks       |

## Documentation

- [Frontend Guide](../docs/development/frontend-guide.md) - Development patterns
- [Testing](../docs/development/testing.md) - Test suites and CI
- [Architecture](../docs/development/architecture.md) - System design
- [WASM Build](../docs/development/wasm-build.md) - WASM compilation
