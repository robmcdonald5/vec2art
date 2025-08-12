# Page Spec — Homepage (Landing) — v2

**Route:** `/`  
**Owner:** Frontend (SvelteKit + Tailwind + TypeScript + shadcn-svelte)

---

## Purpose

Welcome users, explain what the site does (image → SVG conversions with artistic options), **showcase results**, and **drive users to the Converter**.

---

## Primary User Stories (Acceptance Criteria)

- As a visitor, I can **see a clear hero** explaining the app and core technologies.
- As a visitor, I can **navigate via a top navbar** (logo → home, links to Converter, Docs, GitHub).
- As a visitor, I can **watch a scrolling, live “Before → After” gallery** of recent conversions.
- As a visitor, I can **open the Converter** from either the **hero CTA** or a **prominent CTA inside the content/gallery section**.
- As a visitor, I can **reach support/contact** and view **copyright** info in the footer.

---

## Information Architecture

- **Navbar (persistent):** logo/home, main links, theme toggle.
- **Hero:** headline, subheading, primary CTA (“Open Converter”), secondary CTA (“See Examples” anchor).
- **Content (Showcase):** vertically auto-scrolling or horizontally looping gallery with Before/After conversions **and an always-visible CTA inside the content area**.
- **Footer:** copyright, contact link/email, minimal legal links (placeholder).

---

## Content-Section CTA (Required)

### Goal

Provide a **clearly visible control inside the gallery/content section** that navigates to the **Converter** route `(app)/converter`, distinct from the hero’s CTA.

### Placement & Behavior

- **Desktop:** A small **floating CTA card** anchored to the **bottom-right corner** of the showcase section (not the viewport), with `position: sticky` within the section to remain visible while scrolling the gallery.
- **Mobile:** A **sticky bottom bar** within the showcase section that remains visible as users scroll the examples.
- **Action:** Pressing the CTA navigates to `(app)/converter`.
- **Label:** “Convert your image” (accessible name: “Convert your image — open the converter”).
- **A11y:** Focusable with keyboard, visible focus ring, `aria-label` present. Tooltip on hover (desktop) to clarify.

### shadcn Components

- Use `Button` within a small `Card` (desktop) or a full-width `Sheet`/bar (mobile).
- Optional `Tooltip` wrapping the button on desktop.

### Visual

- High-contrast styling using tokens (no hardcoded colors).
- Subtext: one line, e.g., “Try your own PNG/JPG → SVG”.

---

## Data & Loading

### Data sources (initial pass)

- Use **static stub data** first: images in `/static/examples/` and a JSON array in the route’s `+page.ts` or inline constant. Upgrade to API later.
- Shape:
  ```ts
  export type ConversionExample = {
  	id: string;
  	title?: string;
  	beforeSrc: string; // e.g., '/examples/before/portrait1.png'
  	afterSrc: string; // e.g., '/examples/after/portrait1.svg'
  	tags?: string[];
  	createdAt?: string; // ISO
  };
  ```

### States

- `loading`: skeletons for hero CTA and gallery items.
- `error`: non-blocking alert/toast; the page still renders hero and nav.
- `empty`: friendly placeholder card with one curated sample pair.

### Future (live feed)

- Replace stub with server endpoint (e.g., `/api/examples`) or websocket when backend exists.
- Add query params (e.g., `?tag=logo&limit=20`) when the dataset grows.

---

## Component Tree & Imports (shadcn-svelte first)

> Import UI from `$lib/components/ui/*` only. Create app composites in `$lib/components/app/*`.

- `src/routes/(marketing)/+layout.svelte` (chrome for landing pages)
  - `Navbar` (app composite) → `NavigationMenu`, `Button`, `Separator`, `ThemeToggle`
  - `<slot />`
  - `Footer` (app composite) → `Separator`
- `src/routes/(marketing)/+page.svelte` (Homepage)
  - **Hero** (app composite) → `Button`, optional `Badge`; icons: `lucide-svelte`
  - **Showcase / Live Gallery** (app composite)
    - Uses `Card`, `Skeleton`, `Tooltip`; optional `Tabs`
    - Optional `CompareSlider` app composite
    - **CTA: “Convert your image”** — `Card` + `Button` (desktop sticky in section), sticky bar on mobile

**Canonical imports example:**

```svelte
<script lang="ts">
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import Separator from '$lib/components/ui/separator.svelte';
	import Tooltip from '$lib/components/ui/tooltip.svelte';
	import { Upload, Wand2 } from 'lucide-svelte';
</script>
```

---

## Layout & Wireframe (textual)

- **Navbar (top, sticky)**: logo→home, “Converter”, “Docs”, “GitHub”, theme toggle.
- **Hero**: headline, subheading (Rust/WASM + SvelteKit + Tailwind + shadcn), primary CTA → `(app)/converter`, secondary CTA → “See Live Examples” (anchor).
- **Showcase**:
  - H2: “Live Conversions”
  - Gallery: scrolling list/carousel of Before→After cards.
  - **CTA inside content**:
    - Desktop: small sticky **CTA Card** in the lower-right area of the showcase section. Contains headline “Convert your image”, subtext, and a **Button** → `(app)/converter`.
    - Mobile: sticky **bottom bar** within the showcase section with a full-width **Button** → `(app)/converter`.
- **Footer**: © YEAR SiteName (left), Contact link (right).

---

## Interactions

- Navbar links keyboard accessible; focus rings visible.
- Theme toggle toggles `dark` class.
- Gallery:
  - Auto-scroll loops slowly; **pause** on hover or when `prefers-reduced-motion` is set.
  - Cards open a **Dialog** with larger Before/After preview and metadata.
  - Mobile: swipeable carousel.
- **Content CTA**:
  - Click/Enter/Space activates navigation to `(app)/converter`.
  - Tooltip on hover (desktop) with the text “Open the converter”.
  - Focus management: sticky CTA is included in tab order and has a visible focus outline.
- CTAs in hero and content both navigate to the same converter route.

---

## Accessibility

- All interactive elements have discernible labels.
- **Keyboard**: Tab order flows nav → hero → content CTA → gallery → footer. Dialogs trap focus and close on `Esc`.
- **Reduced Motion**: Respect `prefers-reduced-motion: reduce` (disable/slow marquee).
- **Contrast**: use tokens; never remove focus outlines.

---

## Performance

- Route JS budget: **≤ 150KB** (target smaller).
- **Lazy-load** heavy components (e.g., CompareSlider) on interaction.
- Gallery images: `loading="lazy"`, responsive sizes.
- No WASM here.
- Use `content-visibility: auto` and IntersectionObserver for progressive hydration if needed.

---

## Telemetry (optional now)

- `hero_click_primary`: { route: '/', dest: '/converter' }
- `content_cta_click`: { route: '/', dest: '/converter' }
- `gallery_open_dialog`: { id }

---

## Test Plan

- **Playwright**:
  - Hero CTA navigates to `(app)/converter`.
  - **Content CTA** is visible within the showcase section and navigates to `(app)/converter`.
  - Reduced-motion mode disables auto-scroll.
  - Dialog opens from a gallery card and is accessible.
  - Footer visible with copyright/contact.
- **Vitest**:
  - Unit-test sticky CTA visibility helper (if any).
  - Unit-test gallery scroll utility & data mapping.

---

## Content & Copy

- **Hero H1**: “Instant, high-fidelity SVG.”
- **Hero sub**: “Convert raster images to stylized vector art using Rust/WASM processing, SvelteKit UX, and Tailwind design primitives.”
- **Hero CTA**: “Open Converter”
- **Secondary CTA**: “See Live Examples”
- **Showcase H2**: “Live Conversions”
- **Content CTA (button text)**: “Convert your image”
- **Content CTA (tooltip)**: “Open the converter”

---

## Assets & Data Stubs

- Place example assets under:
  - `/static/examples/before/*.png`
  - `/static/examples/after/*.svg`
- Starter dataset (example):
  ```ts
  export const EXAMPLES: ConversionExample[] = [
  	{
  		id: 'p1',
  		title: 'Portrait — smooth edges',
  		beforeSrc: '/examples/before/portrait1.png',
  		afterSrc: '/examples/after/portrait1.svg',
  		tags: ['portrait', 'smooth']
  	},
  	{
  		id: 'l1',
  		title: 'Logo — crisp lines',
  		beforeSrc: '/examples/before/logo1.png',
  		afterSrc: '/examples/after/logo1.svg',
  		tags: ['logo', 'high-contrast']
  	}
  ];
  ```

---

## Future Enhancements

- Filter bar (tabs: Portraits, Logos, Regions).
- Realtime feed from backend.
- Optional per-card “Try this image” mini-CTA that deep-links to the converter with a selected sample preloaded (future).
- GPU-friendly compare slider (later).

---

## Out of Scope (initial)

- Auth, comments/likes on examples.
- Complex analytics dashboards.

---

## Ready Checklist

- [ ] Navbar (logo→home, converter/docs/github, theme).
- [ ] Hero with headline, sub, primary/secondary CTAs.
- [ ] Gallery that respects reduced motion.
- [ ] **Content-section CTA** present, accessible, and navigates to `(app)/converter`.
- [ ] Footer with © YEAR SiteName and Contact.
- [ ] a11y & keyboard flows verified; basic E2E passes.
- [ ] No placeholders; stubs render real content.
