# vec2art
### **Project Requirements Document: `vec2art`**

---

#### **1. Project Overview & Vision**

`vec2art` is a high-performance, browser-based creative tool for transforming raster images (JPG, PNG, WebP) into stylized SVG art. The core processing will be handled client-side using a Rust-powered WebAssembly (WASM) module, ensuring speed and user privacy. The initial product will focus on single-image conversions with multiple artistic algorithms, with a fast-follow feature for blending multiple images into a single, unique SVG output.

---

#### **2. Guiding Principles**

These principles should guide all development decisions:

- **Client-Side First:** All core image processing must happen in the user's browser. No server uploads for the conversion process.
- **Performance is a Feature:** The app must be fast and responsive. WASM logic should be optimized, and the SvelteKit front-end should feel instantaneous.
- **Intuitive & Fun User Experience:** The interface should be clean, self-explanatory, and provide real-time feedback, encouraging creative exploration.
- **Modularity & Extensibility:** The architecture, especially the Rust engine, should be built to easily accommodate new conversion algorithms and features in the future.

---

#### **3. Core Features (Epics)**

This breaks the project into large, manageable chunks.

### Epic 1: Core SVG Conversion Engine (Rust / WASM)
- The computational heart of the application. This module will contain all the image processing logic.
    - **Task 1.1 (Setup):** Establish the Rust project structure with `wasm-pack` or a similar toolchain for compiling to WASM.
    - **Task 1.2 (Image Handling):** Implement functions to receive raw image byte data from JavaScript, decode it into a usable format (using crates like `image`), and handle potential decoding errors gracefully.
    - **Task 1.3 (Algorithm Interface):** Design a generic `trait` or `enum` in Rust to represent different conversion algorithms (e.g., `PathTracer`, `GeometricFitter`, `EdgeDetector`). This allows for a modular system.
    - **Task 1.4 (Path Tracing):** Implement the first algorithm: a color-quantizing path tracer. Expose parameters like `number_of_colors`, `curve_smoothing`, and `suppress_speckles`.
    - **Task 1.5 (WASM Bridge):** Create a clean public API exposed to JavaScript using `wasm-bindgen`. It should be a simple function like `fn convert(image_bytes: &[u8], params: ConversionParameters) -> Result<String, JsValue>`, where the output string is the SVG code.

### Epic 2: Single Image Editor UI (SvelteKit / TypeScript)
- The primary user-facing interface for converting a single image.
    - **Task 2.1 (Layout):** Design a two-panel layout: a control panel on the left and a preview panel on the right. The layout must be responsive, stacking vertically on mobile.
    - **Task 2.2 (File Input):** Create a Svelte component for file input that supports both drag-and-drop and a standard file picker. Display a preview of the uploaded raster image.
    - **Task 2.3 (Control Panel):**
        - Build a component for algorithm selection (e.g., a dropdown).
        - Dynamically render sliders and inputs based on the selected algorithm's parameters (passed from the Rust module's metadata).
        - Ensure real-time updates: changing a slider should trigger a new conversion.
    - **Task 2.4 (Output Display):** Create a component that takes the SVG string from the WASM module and renders it directly on the page. Implement zoom/pan functionality for the preview.
    - **Task 2.5 (Actions):** Add "Re-process" and "Download SVG" buttons. The download button should generate a `.svg` file from the output string.

### Epic 3: Multi-Image Blending UI (SvelteKit / TypeScript)
- The unique feature for combining images. Plan to implement this after the single-image editor is stable.
    - **Task 3.1 (UI Scaffolding):** Adapt the UI to support multiple image "slots." Allow users to assign a role to each image (e.g., "Content," "Style," "Layer 1," "Layer 2").
    - **Task 3.2 (Compositional Blending):** Implement the first, simplest blending mode (Layering).
        - The UI will have opacity sliders and a `mix-blend-mode` dropdown for each layer.
        - The WASM module will need a new function `fn blend_compositional(...)` that vectorizes images separately and combines them into a single SVG string with the specified properties.
    - **Task 3.3 (Style Transfer - Future):**
        - Implement the "smart" blending mode.
        - The WASM module will need a function `fn blend_style_transfer(...)` that takes two image byte arrays, extracts shapes from one and the color palette from the other, and returns a single SVG string.

---

#### **4. Technology Stack & Architecture**

- **Frontend:** SvelteKit 5, TypeScript, Tailwind CSS 4
- **Core Logic:** Rust compiled to WebAssembly (WASM)
- **Architecture Flow:**
    1.  **User Interaction:** The user interacts with Svelte components.
    2.  **State Management:** Svelte stores hold the application state (uploaded image data, slider values).
    3.  **TS "Glue" Code:** A TypeScript module is responsible for orchestrating the interaction. On state change, it calls the WASM function.
    4.  **WASM Execution:** The TypeScript glue code invokes the exported Rust `convert()` function, passing the image data and parameters.
    5.  **Rust Processing:** The Rust code executes the heavy-lifting conversion algorithm.
    6.  **Return Value:** The WASM module returns the final SVG string (or an error) back to TypeScript.
    7.  **UI Update:** The SVG string is passed to a Svelte component, which reactively updates the DOM to display the new artwork.

---

#### **5. Non-Functional Requirements**

- **Performance:** A 1920x1080 image conversion should ideally complete in under 2-3 seconds on a modern desktop browser. A loading indicator must be displayed during processing.
- **Responsiveness:** The entire interface must be usable and aesthetically pleasing on screen widths from 375px (mobile) to 1920px+ (desktop).
- **Browser Support:** Target the latest stable versions of Chrome, Firefox, Safari, and Edge.
- **Accessibility (a11y):** All controls must be keyboard-accessible. Use semantic HTML and provide appropriate ARIA labels for interactive elements.

---

#### **6. Phased Rollout Plan**

### MVP (Minimum Viable Product)
- Focus entirely on **Epic 1** and **Epic 2**.
- Implement **only one** algorithm (Path Tracing).
- A functional single-image editor with controls and download capability.
- **Goal:** Get a working product launched to validate the core idea.

### V1.0 (Public Launch)
- Implement the remaining artistic algorithms (Geometric, Edge Detection).
- Implement the simple **Compositional Blending** feature (Task 3.2).
- Build out basic static pages (Homepage, About).
- Refine the UI/UX based on initial feedback.

### V1.x (Future)
- Implement advanced blending modes like Style Transfer.
- Explore performance optimizations.