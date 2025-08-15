# vec2art Storybook Documentation

This document provides an overview of the Storybook setup for the vec2art component library.

## 🎨 What's Included

### Component Library
- **UI Components** - Basic building blocks (Button, Modal, Progress Bar)
- **Form Components** - Interactive elements (File Dropzone, Smart Performance Selector)
- **Design System** - Colors, Typography, Spacing documentation

### Documentation
- **Welcome Guide** - Introduction to the design system
- **Quick Start** - Getting started with components
- **Accessibility Guide** - Comprehensive a11y documentation

## 🚀 Getting Started

### Development

Start the development server:
```bash
npm run storybook
```

This will start Storybook on `http://localhost:6006` (or next available port).

### Building

Build Storybook for production:
```bash
npm run storybook:build
```

Output will be in the `storybook-static` directory.

### Testing

Run Storybook tests:
```bash
npm run storybook:test
```

## 📁 Project Structure

```
src/stories/
├── introduction/
│   ├── welcome.mdx              # Welcome and overview
│   ├── quick-start.mdx          # Getting started guide  
│   └── accessibility.mdx        # Accessibility documentation
├── design-system/
│   ├── colors.stories.ts        # Color palette and tokens
│   ├── typography.stories.ts    # Font scales and text styles
│   └── spacing.stories.ts       # Spacing system and layout
├── ui-components/
│   ├── button.stories.ts        # Button component variants
│   ├── modal.stories.ts         # Modal dialog component
│   └── progress-bar.stories.ts  # Progress indicator
└── form-components/
    ├── file-dropzone.stories.ts         # File upload component
    └── smart-performance-selector.stories.ts  # Performance selection
```

## 🛠 Configuration

### Core Configuration
- **Framework**: SvelteKit 5 with TypeScript
- **Styling**: Tailwind CSS 4 with design tokens
- **Build**: Vite with optimized production builds

### Addons Installed
- `@storybook/addon-docs` - Automatic documentation generation
- `@storybook/addon-a11y` - Accessibility testing and validation
- `@storybook/addon-vitest` - Integration testing with Vitest
- `@chromatic-com/storybook` - Visual regression testing

### Key Features
- **Accessibility Testing** - Built-in axe-core testing on every story
- **TypeScript Support** - Full type safety with auto-generated docs
- **Dark Mode Support** - Toggle between light and dark themes
- **Responsive Design** - Test components across different viewports

## ♿ Accessibility

Every component includes comprehensive accessibility features:
- **WCAG 2.1 AA Compliance** - All components meet accessibility standards
- **Keyboard Navigation** - Full keyboard support with proper focus management
- **Screen Reader Support** - Optimized for assistive technologies
- **Color Contrast** - High contrast color combinations throughout

Use the Accessibility addon panel to check compliance for each story.

## 🎯 Component Guidelines

### Story Structure
Each component includes multiple stories:
- **Default** - Basic usage example
- **Variants** - All available variants and sizes
- **States** - Different states (loading, error, disabled)
- **Interactive** - Functional examples with event handlers
- **Accessibility** - Keyboard navigation and screen reader examples

### Best Practices
- All components use SvelteKit 5 runes syntax (`$state`, `$derived`, `$props`)
- Consistent prop interfaces with TypeScript
- Comprehensive ARIA labels and descriptions
- Mobile-first responsive design
- Semantic HTML structure

## 📊 Testing

### Visual Testing
- **Chromatic** - Automated visual regression testing
- **Cross-browser** - Testing across different browsers and devices
- **Accessibility** - Automated a11y testing with detailed reports

### Manual Testing
- **Keyboard Navigation** - Test all interactive elements with keyboard
- **Screen Readers** - Verify compatibility with NVDA, JAWS, VoiceOver
- **Mobile Devices** - Touch interaction testing

## 🚢 Deployment

### GitHub Pages
Automatic deployment is configured via GitHub Actions:
- Builds on every push to `main` branch
- Deploys to GitHub Pages at `/storybook` path
- Includes accessibility and visual regression testing

### Scripts Available
```bash
npm run storybook              # Start development server
npm run storybook:build        # Build for production
npm run storybook:test         # Run story tests
npm run storybook:test:ci      # CI-ready testing
```

## 🔧 Customization

### Adding New Components
1. Create the component in `src/lib/components/`
2. Create stories file in appropriate `src/stories/` category
3. Include all variants, states, and accessibility examples
4. Add comprehensive documentation and usage examples

### Design System Updates
Update design tokens in:
- `tailwind.config.ts` - Tailwind configuration
- `src/app.css` - CSS custom properties
- Design system stories for documentation

## 📝 Contributing

When adding or updating components:
1. **Follow Patterns** - Use established component and story patterns
2. **Test Accessibility** - Verify WCAG compliance with addon
3. **Document Everything** - Include comprehensive examples and documentation
4. **Maintain Consistency** - Follow existing design system principles

## 🆘 Troubleshooting

### Common Issues

**Build Failures:**
- Check PostCSS configuration in `.storybook/main.ts`
- Verify all imports are correctly resolved
- Ensure no + prefixed files in routes (SvelteKit conflict)

**Accessibility Warnings:**
- Review component ARIA labels and roles
- Check color contrast ratios
- Verify keyboard navigation implementation

**TypeScript Errors:**
- Update story interfaces to match component props
- Check SvelteKit 5 runes syntax usage
- Verify addon-docs import paths

## 📚 Resources

- [Storybook Documentation](https://storybook.js.org/docs)
- [SvelteKit 5 Guide](https://svelte.dev/docs/kit)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Tailwind CSS 4 Docs](https://tailwindcss.com/docs)

---

*The vec2art Storybook serves as both component documentation and design system reference, ensuring consistent and accessible user experiences across the application.*