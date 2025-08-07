# frontend/CLAUDE.md

This document provides SvelteKit 5-specific implementation guidelines for the vec2art frontend application. You are an expert SvelteKit 5 developer specializing in creating clean, robust, and high-performance frontend code using **SvelteKit 5, TypeScript, Tailwind CSS 4, and Zod**.

## Scope Overview

This directory contains the SvelteKit 5 frontend application that provides a user interface for the vec2art image-to-SVG conversion tool. The frontend loads and interacts with the WASM module for client-side processing.

## Application Architecture

### Core Features
- **Image Upload** — Drag-and-drop or file selection for raster images
- **Real-time Preview** — Live SVG preview with pan/zoom controls
- **Algorithm Selection** — UI for choosing vectorization modes and parameters
- **Export Options** — Download SVG with quality/size optimization settings
- **Batch Processing** — Handle multiple images with progress tracking

## Project Structure

```
frontend/
├── package.json                    # Dependencies and scripts
├── package-lock.json              # Dependency lockfile
├── vite.config.ts                 # Vite configuration
├── svelte.config.js               # SvelteKit configuration
├── tailwind.config.js             # Tailwind CSS configuration
├── tsconfig.json                  # TypeScript configuration
├── playwright.config.ts           # Playwright E2E test config
├── vitest.config.ts              # Vitest unit test config
├── .eslintrc.cjs                 # ESLint configuration
├── .prettierrc                   # Prettier configuration
├── CLAUDE.md                     # This documentation file
├── README.md                     # Frontend-specific readme
│
├── src/                          # Source code
│   ├── app.html                  # HTML template
│   ├── app.css                   # Global styles (Tailwind directives)
│   ├── app.d.ts                  # App-wide TypeScript definitions
│   │
│   ├── routes/                   # SvelteKit pages and API routes
│   │   ├── +layout.svelte        # Root layout component
│   │   ├── +layout.ts            # Layout data loader
│   │   ├── +page.svelte          # Home page
│   │   ├── +page.ts              # Home page data loader
│   │   ├── +error.svelte         # Global error page
│   │   │
│   │   ├── app/                  # Main application routes
│   │   │   ├── +layout.svelte    # App layout with sidebar/header
│   │   │   ├── +page.svelte      # Main converter interface
│   │   │   ├── gallery/          # Image gallery/history
│   │   │   │   ├── +page.svelte
│   │   │   │   └── +page.ts
│   │   │   ├── settings/         # Application settings
│   │   │   │   ├── +page.svelte
│   │   │   │   └── +page.ts
│   │   │   └── help/             # Help and documentation
│   │   │       ├── +page.svelte
│   │   │       └── algorithms/
│   │   │           └── +page.svelte
│   │   │
│   │   ├── api/                  # API routes (if needed)
│   │   │   └── health/
│   │   │       └── +server.ts
│   │   │
│   │   └── examples/             # Demo examples page
│   │       ├── +page.svelte
│   │       └── +page.ts
│   │
│   └── lib/                      # Library code
│       ├── index.ts              # Main library exports
│       │
│       ├── components/           # Reusable Svelte components
│       │   ├── ui/               # Basic UI components
│       │   │   ├── Button.svelte
│       │   │   ├── Input.svelte
│       │   │   ├── Select.svelte
│       │   │   ├── Slider.svelte
│       │   │   ├── Toggle.svelte
│       │   │   ├── Modal.svelte
│       │   │   ├── Tooltip.svelte
│       │   │   ├── Progress.svelte
│       │   │   └── LoadingSpinner.svelte
│       │   │
│       │   ├── layout/           # Layout components
│       │   │   ├── Header.svelte
│       │   │   ├── Sidebar.svelte
│       │   │   ├── Footer.svelte
│       │   │   └── Navigation.svelte
│       │   │
│       │   ├── upload/           # Image upload components
│       │   │   ├── DropZone.svelte
│       │   │   ├── FileSelector.svelte
│       │   │   ├── ImagePreview.svelte
│       │   │   └── BatchUploader.svelte
│       │   │
│       │   ├── editor/           # Main editor components
│       │   │   ├── ImageCanvas.svelte
│       │   │   ├── SVGPreview.svelte
│       │   │   ├── SplitView.svelte
│       │   │   ├── ZoomControls.svelte
│       │   │   └── ComparisonView.svelte
│       │   │
│       │   ├── controls/         # Algorithm control components
│       │   │   ├── AlgorithmSelector.svelte
│       │   │   ├── ParameterPanel.svelte
│       │   │   ├── PresetSelector.svelte
│       │   │   ├── QualitySlider.svelte
│       │   │   └── AdvancedControls.svelte
│       │   │
│       │   ├── export/           # Export and download components
│       │   │   ├── ExportPanel.svelte
│       │   │   ├── FormatSelector.svelte
│       │   │   ├── QualityControls.svelte
│       │   │   └── DownloadButton.svelte
│       │   │
│       │   ├── gallery/          # Gallery and history components
│       │   │   ├── ImageGallery.svelte
│       │   │   ├── HistoryPanel.svelte
│       │   │   ├── ThumbnailGrid.svelte
│       │   │   └── FilterControls.svelte
│       │   │
│       │   └── feedback/         # User feedback components
│       │       ├── ErrorBoundary.svelte
│       │       ├── Toast.svelte
│       │       ├── ProcessingStatus.svelte
│       │       └── PerformanceIndicator.svelte
│       │
│       ├── stores/               # Svelte stores (using runes)
│       │   ├── app.svelte.ts     # Global app state
│       │   ├── images.svelte.ts  # Image and processing state
│       │   ├── ui.svelte.ts      # UI state (modals, panels, etc.)
│       │   ├── settings.svelte.ts # User preferences
│       │   ├── history.svelte.ts # Processing history
│       │   └── theme.svelte.ts   # Dark mode and theming
│       │
│       ├── wasm/                 # WASM module integration
│       │   ├── loader.ts         # WASM module loading
│       │   ├── worker.ts         # Web Worker wrapper
│       │   ├── processor.ts      # Processing coordination
│       │   ├── memory.ts         # Memory management utilities
│       │   ├── threading.ts      # Multi-threading support
│       │   └── types.ts          # WASM-related TypeScript types
│       │
│       ├── utils/                # Utility functions
│       │   ├── files.ts          # File handling utilities
│       │   ├── images.ts         # Image manipulation utilities
│       │   ├── validation.ts     # Input validation (with Zod)
│       │   ├── formatting.ts     # Number/string formatting
│       │   ├── performance.ts    # Performance monitoring
│       │   ├── storage.ts        # Local storage utilities
│       │   ├── download.ts       # File download utilities
│       │   └── constants.ts      # App constants and configuration
│       │
│       ├── types/                # TypeScript type definitions
│       │   ├── app.ts            # General app types
│       │   ├── images.ts         # Image and processing types
│       │   ├── algorithms.ts     # Algorithm configuration types
│       │   ├── export.ts         # Export format types
│       │   ├── ui.ts             # UI component types
│       │   └── api.ts            # API response types
│       │
│       ├── schemas/              # Zod validation schemas
│       │   ├── image.ts          # Image validation
│       │   ├── settings.ts       # Settings validation
│       │   ├── export.ts         # Export options validation
│       │   └── upload.ts         # Upload validation
│       │
│       └── workers/              # Web Worker scripts
│           ├── image-processor.worker.ts
│           ├── wasm-coordinator.worker.ts
│           └── batch-processor.worker.ts
│
├── static/                       # Static assets
│   ├── favicon.ico
│   ├── app-icon-192.png
│   ├── app-icon-512.png
│   ├── images/                   # Static images
│   │   ├── examples/             # Example images
│   │   │   ├── logo-example.png
│   │   │   ├── photo-example.jpg
│   │   │   └── artwork-example.png
│   │   ├── tutorials/            # Tutorial images
│   │   └── backgrounds/          # Background patterns/textures
│   ├── fonts/                    # Custom fonts (if needed)
│   └── manifest.json             # Web app manifest
│
├── tests/                        # Test files
│   ├── unit/                     # Unit tests
│   │   ├── components/           # Component tests
│   │   │   ├── ui/
│   │   │   ├── upload/
│   │   │   └── editor/
│   │   ├── stores/               # Store tests
│   │   ├── utils/                # Utility function tests
│   │   └── wasm/                 # WASM integration tests
│   │
│   ├── e2e/                      # End-to-end tests
│   │   ├── upload-workflow.spec.ts
│   │   ├── conversion-workflow.spec.ts
│   │   ├── export-workflow.spec.ts
│   │   ├── batch-processing.spec.ts
│   │   └── responsive-design.spec.ts
│   │
│   ├── fixtures/                 # Test fixtures
│   │   ├── images/               # Test images
│   │   └── expected-outputs/     # Expected SVG outputs
│   │
│   └── helpers/                  # Test helper functions
│       ├── setup.ts
│       ├── mocks.ts
│       └── assertions.ts
│
├── docs/                         # Frontend-specific documentation
│   ├── components.md             # Component documentation
│   ├── state-management.md      # Store and state patterns
│   ├── wasm-integration.md      # WASM integration details
│   ├── deployment.md            # Deployment instructions
│   └── styling-guide.md         # Tailwind CSS usage guide
│
└── scripts/                     # Build and utility scripts
    ├── build.sh                 # Production build script
    ├── dev.sh                   # Development server script
    ├── test.sh                  # Test runner script
    ├── type-check.sh            # Type checking script
    └── generate-types.sh        # Generate types from WASM
```

### Core Architecture

## Development Guidelines

### Component Development
- Use Svelte 5 runes (`$state`, `$derived`, `$effect`) for reactivity
- Implement proper TypeScript typing for all props and events
- Follow single-responsibility principle for components
- Use composition over inheritance

### State Management
- Use Svelte stores with runes for global state
- Implement proper TypeScript interfaces for store data
- Keep stores focused and modular
- Use Zod for runtime validation of external data

### WASM Integration
- Lazy-load WASM module on first use
- Implement loading states and error handling
- Use Web Workers for processing to avoid blocking UI
- Handle COOP/COEP headers for SharedArrayBuffer support

### Styling Guidelines
- Use Tailwind CSS 4 utility classes
- Implement dark mode support with CSS variables
- Maintain consistent spacing and typography scales
- Use component-scoped styles when needed

### Performance Optimization
- Implement virtual scrolling for image galleries
- Use progressive image loading
- Optimize bundle size with code splitting
- Implement proper caching strategies

### Accessibility
- Maintain proper ARIA labels and roles
- Ensure keyboard navigation support
- Provide appropriate loading and error states
- Test with screen readers

### Error Handling
- Implement comprehensive error boundaries
- Provide user-friendly error messages
- Log errors appropriately for debugging
- Graceful fallbacks for WASM loading failures

## UI/UX Guidelines

### User Flow
1. **Upload** — Clear upload area with format support indicators
2. **Configure** — Intuitive parameter controls with live preview
3. **Process** — Real-time progress feedback
4. **Export** — Multiple export options with size estimates

### Responsive Design
- Mobile-first approach
- Adaptive layouts for different screen sizes
- Touch-friendly controls
- Progressive enhancement

### Performance Indicators
- Show processing time estimates
- Display output file size predictions
- Provide quality vs. size trade-off visualizations

## Testing Strategy

### Unit Tests
- Test utility functions and helpers
- Test store logic and state management
- Use `vitest` for fast unit testing

### Component Tests
- Test component props and events
- Test user interactions
- Verify accessibility requirements

### E2E Tests
- Test complete user workflows
- Test WASM module integration
- Use Playwright for cross-browser testing

## Key Dependencies

### Core Framework
- `@sveltejs/kit` — Application framework
- `svelte` — Component framework
- `typescript` — Type safety

### Styling
- `tailwindcss` — Utility-first CSS
- `@tailwindcss/forms` — Form styling
- `@tailwindcss/typography` — Typography utilities

### Utilities
- `zod` — Runtime validation
- `comlink` — Web Worker communication
- `panzoom` — Pan and zoom for SVG preview

### Development
- `vite` — Build tool
- `vitest` — Unit testing
- `playwright` — E2E testing
- `prettier` — Code formatting
- `eslint` — Linting

### CI Pipeline SvelteKit5
- **Formatting** npx prettier --check .
- **Type-Check Sync** npx svelte-kit sync
- **Type-Check** npx sv check --tsconfig ./tsconfig.json --fail-on-warnings
- **Linting** npx eslint . --max-warnings=0
- **Unit/Comp Tests** npx vitest run --coverage
- **E2E Tests** (Optional) npx playwright install --with-deps && npx playwright test --reporter=line
- **Build** npm run build
- **Preview Smoke** (Optional) npm run preview & npx wait-on http://localhost:4173 && pkill -f "svelte-kit preview
- **Suply-Chain** (Optional)
  1. npm audit --audit-level=high
  2. npm outdated