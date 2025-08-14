<script lang="ts">
  import { Upload, X } from 'lucide-svelte';
  import Button from './button.svelte';

  interface Props {
    accept?: string;
    maxSize?: number; // in bytes
    onFileSelect?: (file: File) => void;
    disabled?: boolean;
    currentFile?: File | null;
  }

  let { 
    accept = 'image/*',
    maxSize = 10 * 1024 * 1024, // 10MB
    onFileSelect,
    disabled = false,
    currentFile = null
  }: Props = $props();

  let dragOver = $state(false);
  let fileInput: HTMLInputElement;

  function handleDragOver(event: DragEvent) {
    if (disabled) return;
    event.preventDefault();
    dragOver = true;
  }

  function handleDragLeave() {
    dragOver = false;
  }

  function handleDrop(event: DragEvent) {
    if (disabled) return;
    event.preventDefault();
    dragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }

  function handleFileInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }

  function handleFile(file: File) {
    if (disabled) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      alert(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    onFileSelect?.(file);
  }

  function clearFile() {
    onFileSelect?.(null as any);
    if (fileInput) {
      fileInput.value = '';
    }
  }

  function openFileDialog() {
    if (disabled) return;
    fileInput?.click();
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
</script>

<input
  bind:this={fileInput}
  type="file"
  {accept}
  class="hidden"
  onchange={handleFileInput}
  {disabled}
/>

<div
  class="rounded-lg border-2 border-dashed transition-colors
    {dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
    {disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}
    {currentFile ? 'p-4' : 'p-8'}"
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
  onclick={currentFile ? undefined : openFileDialog}
  role="button"
  tabindex="0"
  onkeydown={(e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !currentFile && !disabled) {
      openFileDialog();
    }
  }}
>
  {#if currentFile}
    <!-- File Selected State -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Upload class="h-6 w-6 text-primary" />
        </div>
        <div>
          <p class="font-medium">{currentFile.name}</p>
          <p class="text-sm text-muted-foreground">{formatFileSize(currentFile.size)}</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        on:click={(e) => {
          e.stopPropagation();
          clearFile();
        }}
        {disabled}
      >
        <X class="h-4 w-4" />
      </Button>
    </div>
  {:else}
    <!-- Upload State -->
    <div class="text-center">
      <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
        <Upload class="h-8 w-8 text-primary" />
      </div>
      <h3 class="mt-4 text-lg font-semibold">Upload your image</h3>
      <p class="mt-2 text-sm text-muted-foreground">
        Drag and drop your image here, or click to browse
      </p>
      <p class="mt-1 text-xs text-muted-foreground">
        Supports PNG, JPG, WebP up to {Math.round(maxSize / (1024 * 1024))}MB
      </p>
      <Button class="mt-4" variant="outline" {disabled}>Choose File</Button>
    </div>
  {/if}
</div>