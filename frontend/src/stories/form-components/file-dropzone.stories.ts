import type { Meta, StoryObj } from '@storybook/sveltekit';
import FileDropzone from '$lib/components/ui/file-dropzone.svelte';

const meta: Meta<FileDropzone> = {
	title: 'Form Components/File Dropzone',
	component: FileDropzone,
	parameters: {
		layout: 'centered',
		docs: {
			description: {
				component: `
A comprehensive file upload component with drag-and-drop support and full accessibility.

**Features:**
- Drag and drop file upload with visual feedback
- Click to browse file selection
- File type and size validation
- Error handling with user-friendly messages
- Screen reader announcements for all interactions
- Keyboard navigation support
- File preview with removal option
- SvelteKit 5 runes syntax with reactive state management

**Accessibility:**
- Full keyboard navigation (Enter/Space to interact)
- Screen reader announcements for all state changes
- ARIA labels and descriptions for context
- Error messages announced to screen readers
- Focus management and visible focus indicators
- High contrast support
				`
			}
		}
	},
	argTypes: {
		accept: {
			control: { type: 'text' },
			description: 'File types to accept (e.g., "image/*", ".jpg,.png")'
		},
		maxSize: {
			control: { type: 'number' },
			description: 'Maximum file size in bytes'
		},
		disabled: {
			control: { type: 'boolean' },
			description: 'Whether the dropzone is disabled'
		},
		currentFile: {
			control: { type: 'object' },
			description: 'Currently selected file'
		}
	},
	tags: ['autodocs']
};

export default meta;
type Story = StoryObj<meta>;

export const Default: Story = {
	args: {
		accept: 'image/*',
		maxSize: 10 * 1024 * 1024, // 10MB
		disabled: false,
		currentFile: null,
		onFileSelect: (file) => {
			console.log('File selected:', file);
			// In a real app, this would update the currentFile
		}
	}
};

export const WithSelectedFile: Story = {
	args: {
		accept: 'image/*',
		maxSize: 10 * 1024 * 1024,
		disabled: false,
		currentFile: new File([''], 'example-image.jpg', { type: 'image/jpeg' }),
		onFileSelect: (file) => {
			console.log('File selected:', file);
		}
	},
	parameters: {
		docs: {
			description: {
				story: 'File dropzone with a file already selected, showing the preview state.'
			}
		}
	}
};

export const SmallMaxSize: Story = {
	args: {
		accept: 'image/*',
		maxSize: 1024 * 1024, // 1MB
		disabled: false,
		currentFile: null,
		onFileSelect: (file) => {
			console.log('File selected:', file);
		}
	},
	parameters: {
		docs: {
			description: {
				story: 'File dropzone with a smaller maximum file size (1MB) for demonstration.'
			}
		}
	}
};

export const Disabled: Story = {
	args: {
		accept: 'image/*',
		maxSize: 10 * 1024 * 1024,
		disabled: true,
		currentFile: null,
		onFileSelect: (file) => {
			console.log('File selected:', file);
		}
	},
	parameters: {
		docs: {
			description: {
				story: 'Disabled state prevents all interactions and shows visual feedback.'
			}
		}
	}
};

export const SpecificFileTypes: Story = {
	args: {
		accept: '.jpg,.jpeg,.png,.webp',
		maxSize: 5 * 1024 * 1024, // 5MB
		disabled: false,
		currentFile: null,
		onFileSelect: (file) => {
			console.log('File selected:', file);
		}
	},
	parameters: {
		docs: {
			description: {
				story: 'File dropzone configured to accept only specific image formats.'
			}
		}
	}
};

export const InteractiveDemo: Story = {
	parameters: {
		docs: {
			description: {
				story: 'Interactive demo showing file selection, validation, and state management.'
			}
		}
	},
	render: () => {
		let selectedFile = null;
		let errorCount = 0;
		let successCount = 0;

		const handleFileSelect = (file) => {
			if (file) {
				selectedFile = file;
				successCount++;
				console.log('File selected successfully:', file.name);
			} else {
				selectedFile = null;
			}
		};

		const handleFileError = () => {
			errorCount++;
		};

		return {
			Component: (() => {
				return {
					render: () => `
						<div class="space-y-4 w-96">
							<div class="text-sm space-y-1">
								<div>Files selected: <strong>${successCount}</strong></div>
								<div>Validation errors: <strong>${errorCount}</strong></div>
								<div>Current file: <strong>${selectedFile ? selectedFile.name : 'None'}</strong></div>
							</div>
							<FileDropzone
								accept="image/*"
								maxSize={2 * 1024 * 1024}
								currentFile={selectedFile}
								onFileSelect={handleFileSelect}
							/>
							<div class="text-xs text-gray-500">
								Try uploading an image file (max 2MB) or a non-image file to see validation.
							</div>
						</div>
					`
				};
			})()
		};
	}
};

export const MultipleInstances: Story = {
	parameters: {
		docs: {
			description: {
				story: 'Multiple file dropzones with different configurations side by side.'
			}
		}
	},
	render: () => ({
		Component: (() => {
			return {
				render: () => `
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
						<div class="space-y-2">
							<h3 class="font-semibold text-sm">Profile Picture</h3>
							<FileDropzone
								accept="image/*"
								maxSize={1 * 1024 * 1024}
								onFileSelect={(file) => console.log('Profile pic:', file)}
							/>
							<p class="text-xs text-gray-500">Max 1MB, images only</p>
						</div>
						
						<div class="space-y-2">
							<h3 class="font-semibold text-sm">Document Upload</h3>
							<FileDropzone
								accept=".pdf,.doc,.docx"
								maxSize={10 * 1024 * 1024}
								onFileSelect={(file) => console.log('Document:', file)}
							/>
							<p class="text-xs text-gray-500">Max 10MB, documents only</p>
						</div>
					</div>
				`
			};
		})()
	})
};

export const ErrorStates: Story = {
	parameters: {
		docs: {
			description: {
				story: 'Demonstration of various error states and validation messages.'
			}
		}
	},
	render: () => {
		let currentError = '';

		const simulateError = (errorType) => {
			switch (errorType) {
				case 'type':
					currentError = 'Please select an image file. Supported formats: PNG, JPG, WebP';
					break;
				case 'size':
					currentError = 'File size must be less than 1MB. Current file is 2.5MB';
					break;
				case 'generic':
					currentError = 'Something went wrong. Please try again.';
					break;
				default:
					currentError = '';
			}
		};

		return {
			Component: (() => {
				return {
					render: () => `
						<div class="space-y-4 w-96">
							<div class="flex gap-2 flex-wrap">
								<button 
									onclick="simulateError('type')"
									class="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
								>
									Type Error
								</button>
								<button 
									onclick="simulateError('size')"
									class="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
								>
									Size Error
								</button>
								<button 
									onclick="simulateError('generic')"
									class="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
								>
									Generic Error
								</button>
								<button 
									onclick="simulateError('')"
									class="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
								>
									Clear
								</button>
							</div>
							
							${
								currentError
									? `
								<div class="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg" role="alert">
									<div class="flex items-center gap-2">
										<svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
										</svg>
										<span class="text-sm text-red-700 dark:text-red-300">${currentError}</span>
									</div>
								</div>
							`
									: ''
							}
							
							<FileDropzone
								accept="image/*"
								maxSize={1 * 1024 * 1024}
								onFileSelect={(file) => console.log('File:', file)}
							/>
							
							<p class="text-xs text-gray-500">
								Click the buttons above to simulate different error states.
							</p>
						</div>
					`
				};
			})()
		};
	}
};

export const Accessibility: Story = {
	parameters: {
		docs: {
			description: {
				story: `
**Accessibility Features:**

1. **Keyboard Navigation:** Full keyboard support with Enter and Space keys
2. **Screen Reader Support:** Comprehensive announcements for all interactions
3. **ARIA Labels:** Proper labeling and descriptions for context
4. **Focus Management:** Visible focus indicators and proper tab order
5. **Error Announcements:** Errors are announced to screen readers
6. **State Changes:** File selection and removal are announced
7. **Instructions:** Built-in instructions for screen reader users

Try navigating this component with keyboard only:
- Tab to focus the dropzone
- Press Enter or Space to open file dialog
- When a file is selected, Tab to the remove button
- Press Enter or Space to remove the file
				`
			}
		}
	},
	render: () => {
		let selectedFile = null;
		let interactionLog = [];

		const logInteraction = (action) => {
			interactionLog = [...interactionLog, `${new Date().toLocaleTimeString()}: ${action}`];
		};

		const handleFileSelect = (file) => {
			selectedFile = file;
			if (file) {
				logInteraction(`File selected: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
			} else {
				logInteraction('File removed');
			}
		};

		return {
			Component: (() => {
				return {
					render: () => `
						<div class="space-y-4 w-96">
							<div class="text-sm space-y-2">
								<p class="font-medium">Interaction Log:</p>
								<div class="bg-gray-50 p-2 rounded text-xs max-h-32 overflow-y-auto">
									${
										interactionLog.length > 0
											? interactionLog
													.slice(-5)
													.map((log) => `<div>${log}</div>`)
													.join('')
											: '<div class="text-gray-500">No interactions yet</div>'
									}
								</div>
							</div>
							
							<FileDropzone
								accept="image/*"
								maxSize={5 * 1024 * 1024}
								currentFile={selectedFile}
								onFileSelect={handleFileSelect}
							/>
							
							<div class="text-xs text-gray-600 space-y-1">
								<div>• Tab to focus the dropzone</div>
								<div>• Press Enter or Space to select files</div>
								<div>• Use Tab to navigate to remove button when file is selected</div>
								<div>• All actions are announced to screen readers</div>
							</div>
						</div>
					`
				};
			})()
		};
	}
};
