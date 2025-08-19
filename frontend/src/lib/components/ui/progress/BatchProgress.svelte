<script lang="ts">
import { CheckCircle, Circle, Loader2, Clock, Zap } from 'lucide-svelte';
import type { ProcessingProgress } from '$lib/types/vectorizer';

interface Props {
	totalImages: number;
	currentImageIndex: number;
	currentProgress?: ProcessingProgress | null;
	completedImages: number;
	isProcessing: boolean;
	startTime?: Date;
}

let { 
	totalImages, 
	currentImageIndex, 
	currentProgress, 
	completedImages,
	isProcessing,
	startTime
}: Props = $props();

// Calculate overall progress
const overallProgress = $derived(() => {
	if (totalImages === 0) return 0;
	
	// Progress from completed images
	const completedProgress = (completedImages / totalImages) * 100;
	
	// Progress from current image (if processing)
	const currentImageProgress = currentProgress ? (currentProgress.progress / totalImages) : 0;
	
	return Math.min(100, completedProgress + currentImageProgress);
});

// Calculate time estimates
const elapsedTime = $derived(() => {
	if (!startTime || !isProcessing) return 0;
	return Date.now() - startTime.getTime();
});

const estimatedTimeRemaining = $derived(() => {
	if (!isProcessing || completedImages === 0 || elapsedTime === 0) return null;
	
	const avgTimePerImage = elapsedTime / (completedImages + (currentProgress?.progress || 0) / 100);
	const remainingImages = totalImages - completedImages - (currentProgress?.progress || 0) / 100;
	
	return avgTimePerImage * remainingImages;
});

function formatTime(ms: number): string {
	const seconds = Math.floor(ms / 1000);
	if (seconds < 60) return `${seconds}s`;
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	return `${minutes}m ${remainingSeconds}s`;
}

function formatSpeed(ms: number, completed: number): string {
	if (completed === 0 || ms === 0) return '—';
	const avgTimePerImage = ms / completed;
	const imagesPerSecond = 1000 / avgTimePerImage;
	
	if (imagesPerSecond > 1) {
		return `${imagesPerSecond.toFixed(1)} img/s`;
	} else {
		return `${(avgTimePerImage / 1000).toFixed(1)}s/img`;
	}
}
</script>

<div class="progress-container">
	<!-- Header -->
	<div class="flex items-center justify-between mb-4">
		<div class="flex items-center gap-3">
			<div class="flex items-center gap-2">
				{#if isProcessing}
					<Loader2 class="h-5 w-5 text-red-600 animate-spin" />
				{:else if completedImages === totalImages}
					<CheckCircle class="h-5 w-5 text-green-600" />
				{:else}
					<Circle class="h-5 w-5 text-gray-400" />
				{/if}
				<h3 class="text-lg font-semibold text-converter-primary">
					Batch Progress
				</h3>
			</div>
			<span class="text-sm text-converter-secondary bg-gray-100 px-2 py-1 rounded">
				{completedImages}/{totalImages}
			</span>
		</div>
		
		<div class="text-right">
			<div class="text-2xl font-bold text-converter-primary">
				{Math.round(overallProgress)}%
			</div>
			<div class="text-xs text-converter-secondary">
				Complete
			</div>
		</div>
	</div>

	<!-- Overall Progress Bar -->
	<div class="mb-4">
		<div class="progress-bar-bg">
			<div 
				class="progress-bar-fill"
				style="width: {overallProgress}%"
			>
				<div class="progress-bar-shimmer"></div>
			</div>
		</div>
	</div>

	<!-- Current Image Progress (if processing) -->
	{#if isProcessing && currentProgress}
		<div class="mb-4 p-3 bg-gray-50 rounded-lg">
			<div class="flex items-center justify-between mb-2">
				<div class="flex items-center gap-2">
					<Loader2 class="h-4 w-4 text-red-600 animate-spin" />
					<span class="text-sm font-medium text-converter-primary">
						Image {currentImageIndex + 1}: {currentProgress.stage}
					</span>
				</div>
				<span class="text-xs text-converter-secondary">
					{Math.round(currentProgress.progress)}%
				</span>
			</div>
			
			<div class="h-1.5 bg-gray-200 rounded-full overflow-hidden">
				<div 
					class="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-300"
					style="width: {currentProgress.progress}%"
				></div>
			</div>
			
			{#if currentProgress.message}
				<div class="text-xs text-converter-secondary mt-2">
					{currentProgress.message}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Statistics -->
	<div class="grid grid-cols-2 gap-4 text-sm">
		<!-- Time Statistics -->
		<div class="space-y-2">
			<div class="flex items-center gap-2">
				<Clock class="h-4 w-4 text-gray-500" />
				<span class="font-medium text-converter-primary">Time</span>
			</div>
			
			<div class="space-y-1 text-xs text-converter-secondary">
				{#if isProcessing}
					<div class="flex justify-between">
						<span>Elapsed:</span>
						<span class="font-mono">{formatTime(elapsedTime)}</span>
					</div>
					{#if estimatedTimeRemaining}
						<div class="flex justify-between">
							<span>Remaining:</span>
							<span class="font-mono">{formatTime(estimatedTimeRemaining)}</span>
						</div>
					{/if}
				{:else if completedImages > 0}
					<div class="flex justify-between">
						<span>Total time:</span>
						<span class="font-mono">{formatTime(elapsedTime)}</span>
					</div>
				{/if}
			</div>
		</div>

		<!-- Speed Statistics -->
		<div class="space-y-2">
			<div class="flex items-center gap-2">
				<Zap class="h-4 w-4 text-gray-500" />
				<span class="font-medium text-converter-primary">Speed</span>
			</div>
			
			<div class="space-y-1 text-xs text-converter-secondary">
				{#if isProcessing && completedImages > 0}
					<div class="flex justify-between">
						<span>Average:</span>
						<span class="font-mono">{formatSpeed(elapsedTime, completedImages)}</span>
					</div>
				{/if}
				
				{#if completedImages > 0}
					<div class="flex justify-between">
						<span>Completed:</span>
						<span class="font-mono text-green-600">{completedImages}</span>
					</div>
				{/if}
				
				{#if isProcessing}
					<div class="flex justify-between">
						<span>Remaining:</span>
						<span class="font-mono text-gray-500">{totalImages - completedImages}</span>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Image Grid (for multiple images) -->
	{#if totalImages > 1}
		<div class="mt-4 pt-4 border-t border-gray-200">
			<div class="text-xs font-medium text-converter-primary mb-2">
				Images ({totalImages})
			</div>
			
			<div class="grid grid-cols-8 gap-1">
				{#each Array(totalImages) as _, index}
					<div 
						class="aspect-square rounded border-2 flex items-center justify-center text-xs font-medium transition-all duration-200 {
							index < completedImages 
								? 'bg-green-100 border-green-300 text-green-700' 
								: index === currentImageIndex && isProcessing
									? 'bg-red-100 border-red-300 text-red-700 animate-pulse'
									: 'bg-gray-100 border-gray-300 text-gray-500'
						}"
						title="Image {index + 1}"
					>
						{#if index < completedImages}
							<CheckCircle class="h-3 w-3" />
						{:else if index === currentImageIndex && isProcessing}
							<Loader2 class="h-3 w-3 animate-spin" />
						{:else}
							{index + 1}
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>