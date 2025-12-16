# Contributing

Guidelines for contributing to vec2art.

## Development Setup

### Prerequisites

- Node.js 18+
- Rust toolchain (stable)
- wasm-pack

### Clone and Install

```bash
git clone https://github.com/yourusername/vec2art.git
cd vec2art

cd frontend
npm install
npm run build:wasm
npm run dev
```

## Code Style

### Formatting

Run before every commit:

```bash
cd frontend
npx prettier --write .
```

CI will reject unformatted code.

### Linting

```bash
npm run lint        # Check
npm run lint:fix    # Auto-fix
```

Zero warnings required for merge.

### TypeScript

Strict mode enabled. All types must be explicit.

```typescript
// Correct
function process(config: AlgorithmConfig): Promise<string> { ... }

// Incorrect
function process(config) { ... }
```

### Rust

```bash
cd wasm
cargo fmt
cargo clippy
```

## Git Workflow

### Branches

- `main` - Production, protected
- `dev` - Integration branch
- `feat/*` - New features
- `fix/*` - Bug fixes
- `chore/*` - Maintenance

### Commits

Use conventional commits:

```
feat: add new algorithm parameter
fix: resolve memory leak in WASM
docs: update API reference
chore: update dependencies
```

### Pull Requests

1. Branch from `dev`
2. Make changes
3. Run all checks locally
4. Open PR to `dev`
5. Address review feedback
6. Squash merge when approved

## Testing Requirements

### Before PR

```bash
cd frontend
npm run format:check
npm run lint
npm run check
npm run test:coverage
npm run build
```

All must pass.

### Coverage

Maintain or improve coverage:

- New features require tests
- Bug fixes require regression tests

## Documentation

### When to Update

- New features require documentation
- API changes require reference updates
- Bug fixes may need troubleshooting notes

### Style

- Technical and concise
- No emojis
- Code examples where helpful
- Tables for parameter lists

## Architecture Guidelines

### WASM Changes

1. Update Rust struct in `vectorize-core`
2. Regenerate TypeScript types: `npm run generate:types`
3. Update transformer if needed
4. Test across browsers

### Frontend Changes

1. Follow existing component patterns
2. Use Svelte 5 runes for state
3. Add component tests
4. Check responsive behavior

### Adding Parameters

1. Add to Rust `TraceLowConfig`
2. Regenerate types
3. Update `config-transformer.ts`
4. Update parameter docs
5. Add to UI if user-facing

## Review Process

### Reviewers Look For

- Code quality and style
- Test coverage
- Documentation updates
- Performance implications
- Browser compatibility

### Response Time

Aim to respond to reviews within 48 hours.

## Release Process

1. Changes merged to `dev`
2. `dev` tested thoroughly
3. PR from `dev` to `main`
4. Merge triggers production deployment

## Getting Help

- Check existing documentation
- Search closed issues
- Open new issue with details

## License

Contributions are subject to the project's custom non-commercial license. By contributing, you agree to these terms.
