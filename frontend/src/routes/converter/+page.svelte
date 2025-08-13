<script lang="ts">
	import Button from '$lib/components/ui/button.svelte';
	import { Upload, Settings, Download, Image } from 'lucide-svelte';
</script>

<div class="mx-auto max-w-screen-xl px-4 py-8 sm:px-6 lg:px-8">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold bg-gradient-to-r from-orange-800 to-red-700 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">Image to SVG Converter</h1>
		<p class="text-muted-foreground mt-2">
			Transform any raster image into expressive line art SVGs
		</p>
	</div>

	<!-- Main Converter Interface -->
	<div class="grid gap-8 lg:grid-cols-3">
		<!-- Upload Area -->
		<div class="lg:col-span-2">
			<div class="rounded-lg border-2 border-dashed border-muted-foreground/25 p-8">
				<div class="text-center">
					<div class="bg-primary/10 mx-auto flex h-16 w-16 items-center justify-center rounded-lg">
						<Upload class="text-primary h-8 w-8" />
					</div>
					<h3 class="mt-4 text-lg font-semibold">Upload your image</h3>
					<p class="text-muted-foreground mt-2 text-sm">
						Drag and drop your image here, or click to browse
					</p>
					<p class="text-muted-foreground mt-1 text-xs">
						Supports PNG, JPG, WebP up to 10MB
					</p>
					<Button class="mt-4" variant="outline">Choose File</Button>
				</div>
			</div>

			<!-- Preview Area -->
			<div class="mt-6 rounded-lg border">
				<div class="border-b p-4">
					<h3 class="font-semibold">Preview</h3>
				</div>
				<div class="aspect-video bg-muted/30 flex items-center justify-center p-8">
					<div class="text-center">
						<Image class="text-muted-foreground mx-auto h-12 w-12" />
						<p class="text-muted-foreground mt-2 text-sm">
							Upload an image to see the preview
						</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Controls Panel -->
		<div class="space-y-6">
			<!-- Algorithm Selection -->
			<div class="rounded-lg border p-4">
				<h3 class="flex items-center gap-2 font-semibold">
					<Settings class="h-4 w-4" />
					Algorithm
				</h3>
				<div class="mt-3 space-y-2">
					<label class="flex items-center gap-2">
						<input type="radio" name="algorithm" value="edge" checked class="text-primary" />
						<span class="text-sm">Edge Detection</span>
					</label>
					<label class="flex items-center gap-2">
						<input type="radio" name="algorithm" value="centerline" class="text-primary" />
						<span class="text-sm">Centerline</span>
					</label>
					<label class="flex items-center gap-2">
						<input type="radio" name="algorithm" value="superpixel" class="text-primary" />
						<span class="text-sm">Superpixel</span>
					</label>
					<label class="flex items-center gap-2">
						<input type="radio" name="algorithm" value="dots" class="text-primary" />
						<span class="text-sm">Dots/Stippling</span>
					</label>
				</div>
			</div>

			<!-- Quality Settings -->
			<div class="rounded-lg border p-4">
				<h3 class="font-semibold">Quality Settings</h3>
				<div class="mt-3 space-y-4">
					<div>
						<label for="detail-level" class="text-sm font-medium">Detail Level</label>
						<input id="detail-level" type="range" min="1" max="10" value="5" class="mt-1 w-full" />
					</div>
					<div>
						<label for="smoothness" class="text-sm font-medium">Smoothness</label>
						<input id="smoothness" type="range" min="1" max="10" value="7" class="mt-1 w-full" />
					</div>
				</div>
			</div>

			<!-- Artistic Effects -->
			<div class="rounded-lg border p-4">
				<h3 class="font-semibold">Artistic Effects</h3>
				<div class="mt-3 space-y-3">
					<label class="flex items-center gap-2">
						<input type="checkbox" checked class="text-primary" />
						<span class="text-sm">Hand-drawn style</span>
					</label>
					<label class="flex items-center gap-2">
						<input type="checkbox" class="text-primary" />
						<span class="text-sm">Variable line weights</span>
					</label>
					<label class="flex items-center gap-2">
						<input type="checkbox" class="text-primary" />
						<span class="text-sm">Tremor effects</span>
					</label>
				</div>
			</div>

			<!-- Action Buttons -->
			<div class="space-y-3">
				<Button class="w-full" size="lg">
					Convert to SVG
				</Button>
				<Button variant="outline" class="w-full gap-2" disabled>
					<Download class="h-4 w-4" />
					Download SVG
				</Button>
			</div>

			<!-- Processing Info -->
			<div class="rounded-lg border p-4">
				<h3 class="font-semibold">Processing Info</h3>
				<div class="text-muted-foreground mt-2 space-y-1 text-xs">
					<p>• Processing time: ~1.5s</p>
					<p>• Output format: SVG</p>
					<p>• Client-side processing</p>
				</div>
			</div>
		</div>
	</div>
</div>