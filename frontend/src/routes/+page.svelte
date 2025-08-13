<script lang="ts">
  import Button from '$lib/components/ui/button.svelte';
  import { ArrowRight, Image, Zap, Download } from 'lucide-svelte';
</script>

<div>
  <!-- Hero Section with Gradient -->
  <section class="relative min-h-[90vh] bg-hero-gradient overflow-hidden">
    <!-- Animated background overlay -->
    <div class="absolute inset-0 bg-aurora-tech opacity-20 animate-gradient"></div>
    <div class="absolute inset-0 bg-black/20"></div>
    
    <!-- Content -->
    <div class="relative z-10 flex items-center justify-center min-h-[90vh] px-4 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-screen-xl">
        <div class="text-center">
          <h1 class="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-white animate-fade-in">
            Transform Images into
            <span class="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-gradient"> SVG Art</span>
          </h1>
          <p class="text-gray-200 mx-auto mt-8 max-w-3xl text-xl sm:text-2xl leading-relaxed animate-slide-up">
            High-performance browser-based tool that converts raster images into expressive,
            hand-drawn style vector graphics using advanced tracing algorithms.
          </p>
          <div class="mt-12 flex flex-col gap-6 sm:flex-row sm:justify-center">
            <Button href="/converter" size="lg" class="gap-2 bg-tech-primary hover:bg-tech-secondary transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-lg px-8 py-4">
              Start Converting
              <ArrowRight class="h-5 w-5" />
            </Button>
            <Button href="/gallery" variant="outline" size="lg" class="border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 text-lg px-8 py-4">
              View Gallery
            </Button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Decorative elements -->
    <div class="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"></div>
    <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
  </section>

  <!-- Features Section -->
  <section class="relative py-24 sm:py-32 bg-features-gradient dark:bg-features-gradient-dark">
    <div class="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-20">
        <h2 class="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-orange-800 to-red-700 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
          Why vec2art?
        </h2>
      <p class="mt-6 text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Experience the power of modern image processing with cutting-edge technology
        </p>
      </div>
      
      <div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <div class="group relative p-8 bg-card-gradient backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
          <div class="relative">
            <div class="bg-processing-gradient mx-auto flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg">
              <Zap class="h-8 w-8 text-white" />
            </div>
            <h3 class="mt-6 text-2xl font-bold text-gray-900 dark:text-white">Ultra-Fast Processing</h3>
            <p class="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed">
              Process images quickly using your system's local computation with WASM technology for blazing-fast results
            </p>
          </div>
          <div class="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </div>
        
        <div class="group relative p-8 bg-card-gradient backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
          <div class="relative">
            <div class="bg-tech-secondary mx-auto flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg">
              <Image class="h-8 w-8 text-white" />
            </div>
            <h3 class="mt-6 text-2xl font-bold text-gray-900 dark:text-white">Artistic Outputs</h3>
            <p class="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed">
              Advanced algorithms with hand-drawn aesthetics, variable weights, and artistic tremor for beautiful results
            </p>
          </div>
          <div class="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </div>
        
        <div class="group relative p-8 bg-card-gradient backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 sm:col-span-2 lg:col-span-1">
          <div class="relative">
            <div class="bg-aurora-tech mx-auto flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg">
              <Download class="h-8 w-8 text-white" />
            </div>
            <h3 class="mt-6 text-2xl font-bold text-gray-900 dark:text-white">Multiple Export Options</h3>
            <p class="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed">
              Convert multiple images in parallel with support for PNG, JPEG, and WebP formats
            </p>
          </div>
          <div class="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </div>
      </div>
    </div>
  </section>

  <!-- Algorithm Backends -->
  <section class="relative py-24 sm:py-32 bg-algorithm-gradient dark:bg-algorithm-gradient-dark">
    <div class="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <h2 class="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-orange-800 to-red-700 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
          Conversion Pipeline
        </h2>
        <p class="mt-6 text-xl text-orange-800 dark:text-gray-300 max-w-3xl mx-auto">
          Choose the perfect algorithm for your image type and artistic vision
        </p>
      </div>
      
      <div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div class="group relative p-8 bg-card-gradient backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 flex flex-col">
          <div class="relative">
            <div class="bg-processing-gradient mx-auto flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg mb-6">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Centerline Tracing</h3>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
              Zhang-Suen algorithm for bold shapes and logos with precise paths
            </p>
          </div>
          <div class="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div class="flex items-center text-sm text-orange-600 font-medium mt-auto pt-6">
            <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
            Best for logos
          </div>
        </div>
        
        <div class="group relative p-8 bg-card-gradient backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 flex flex-col">
          <div class="relative">
            <div class="bg-tech-secondary mx-auto flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg mb-6">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Dot Mapping</h3>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
              Adaptive stippling for artistic textures and vintage effects
            </p>
          </div>
          <div class="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div class="flex items-center text-sm text-orange-600 font-medium mt-auto pt-6">
            <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
            Artistic style
          </div>
        </div>
        
        <div class="group relative p-8 bg-card-gradient backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 flex flex-col">
          <div class="relative">
            <div class="bg-aurora-tech mx-auto flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg mb-6">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Line Tracing</h3>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
              Canny edge detection for detailed line art and sketches
            </p>
          </div>
          <div class="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div class="flex items-center text-sm text-orange-600 font-medium mt-auto pt-6">
            <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
            Sketchy style
          </div>
        </div>
        
        <div class="group relative p-8 bg-card-gradient backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 flex flex-col lg:col-span-1">
          <div class="relative">
            <div class="bg-processing-gradient mx-auto flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg mb-6">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"></path>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Superpixel Mapping</h3>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
              SLIC segmentation for stylized and abstract art
            </p>
          </div>
          <div class="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div class="flex items-center text-sm text-orange-600 font-medium mt-auto pt-6">
            <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
            Retro style
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="relative text-white bg-footer-gradient">
    <!-- Gentle tint overlay (now with a middle stop + lower alpha) -->
    <div class="absolute inset-0 pointer-events-none bg-gradient-to-r from-purple-900/10 via-indigo-900/8 to-blue-900/10"></div>
    <!-- Dither/noise overlay (class defined below) -->
    <div class="absolute inset-0 pointer-events-none bg-noise-overlay"></div>
    
    <!-- Main Footer Content -->
    <div class="relative py-12 md:py-16">
      <div class="mx-auto max-w-screen-xl px-4 md:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          <!-- Brand Section -->
          <div class="lg:col-span-1">
            <div class="flex items-center mb-6">
              <h3 class="text-3xl font-bold bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-300 bg-clip-text text-transparent">
                vec2art
              </h3>
            </div>
            <p class="text-gray-300 text-sm leading-relaxed mb-6 max-w-sm">
              Transform any image into beautiful SVG art using advanced vectorization algorithms with hand-drawn aesthetics.
            </p>
            <!-- Social Links -->
            <div class="flex gap-4">
              <a href="https://x.com/vec2art" aria-label="Follow vec2art on X" class="h-10 w-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg text-gray-300 hover:text-white transition-all duration-200">
                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://instagram.com/vec2art" aria-label="Follow vec2art on Instagram" class="h-10 w-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg text-gray-300 hover:text-white transition-all duration-200">
                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
            </div>
          </div>
          
          <!-- Product Links -->
          <div>
            <h4 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">Product</h4>
            <ul class="space-y-3">
              <li><a href="/converter" class="text-gray-300 hover:text-white text-sm transition-colors duration-200">Converter</a></li>
              <li><a href="/gallery" class="text-gray-300 hover:text-white text-sm transition-colors duration-200">Gallery</a></li>
              <li><span class="text-gray-500 text-sm cursor-not-allowed">API (Coming Soon)</span></li>
              <li><span class="text-gray-500 text-sm cursor-not-allowed">Pricing (Coming Soon)</span></li>
            </ul>
          </div>
          
          <!-- Company Links -->
          <div>
            <h4 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">Company</h4>
            <ul class="space-y-3">
              <li><a href="/about" class="text-gray-300 hover:text-white text-sm transition-colors duration-200">About</a></li>
              <li><span class="text-gray-500 text-sm cursor-not-allowed">Blog (Coming Soon)</span></li>
              <li><span class="text-gray-500 text-sm cursor-not-allowed">Careers (Coming Soon)</span></li>
              <li><span class="text-gray-500 text-sm cursor-not-allowed">Contact (Coming Soon)</span></li>
            </ul>
          </div>
          
          <!-- Support Links -->
          <div>
            <h4 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">Support</h4>
            <ul class="space-y-3">
              <li><span class="text-gray-500 text-sm cursor-not-allowed">Help Center (Coming Soon)</span></li>
              <li><span class="text-gray-500 text-sm cursor-not-allowed">Documentation (Coming Soon)</span></li>
              <li><span class="text-gray-500 text-sm cursor-not-allowed">Community (Coming Soon)</span></li>
              <li><span class="text-gray-500 text-sm cursor-not-allowed">Status (Coming Soon)</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Footer Divider -->
    <div class="w-full border-t border-gray-600/50"></div>
    
    <!-- Copyright Section -->
    <div class="relative py-6">
      <div class="mx-auto max-w-screen-xl px-4 md:px-6 lg:px-8">
        <div class="flex flex-col md:flex-row justify-between items-center gap-4">
          <p class="text-gray-400 text-sm">
            © 2025 vec2art. Powered by Rust + WebAssembly.
          </p>
          <div class="flex gap-6">
            <span class="text-gray-500 text-sm cursor-not-allowed">Privacy Policy (Coming Soon)</span>
            <span class="text-gray-500 text-sm cursor-not-allowed">Terms of Service (Coming Soon)</span>
          </div>
        </div>
      </div>
    </div>
  </footer>
</div>

<style>
  /* --- Footer gradient: sRGB fallback + OKLCH (perceptual) when supported --- */
  .bg-footer-gradient {
    /* Fallback: plain sRGB (still looks fine if OKLCH unsupported) */
    background: linear-gradient(180deg, #0f0a1f 0%, #071227 100%);
  }
  @supports (color: oklch(50% 0 0)) {
    .bg-footer-gradient {
      /* OKLCH greatly reduces visible banding in dark ranges */
      background: linear-gradient(
        in oklch to bottom,
        oklch(18% 0.045 280) 0%,
        oklch(14% 0.035 255) 58%,
        oklch(11% 0.030 245) 100%
      );
    }
  }

  /* --- Dither/noise overlay to break up bands (no extra asset) --- */
  .bg-noise-overlay {
    opacity: 0.06;                 /* try 0.04–0.10 */
    background-image: url("data:image/svg+xml;utf8,\
<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'>\
  <filter id='n'>\
    <feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/>\
  </filter>\
  <rect width='100%' height='100%' filter='url(%23n)'/>\
</svg>");
    background-size: 180px 180px;  /* tile size; tweak to taste */
    /* Ensure it doesn’t block clicks (also set pointer-events-none in markup) */
    pointer-events: none;
  }
</style>
