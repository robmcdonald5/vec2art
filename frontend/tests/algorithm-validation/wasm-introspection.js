/**
 * WASM Module Introspection Tool
 *
 * This script discovers all available functions in the vectorizer WASM module
 * and generates a comprehensive report of what's actually available vs what
 * we expect to be available.
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the WASM loader (we'll need to run this in a browser-like environment)
async function introspectWasmModule() {
	console.log('🔍 Starting WASM Module Introspection...\n');

	try {
		// We need to load the WASM module in a way that works in Node.js
		// This is challenging since the module is designed for browsers

		// For now, let's create a structure that can be used to analyze the actual module
		const report = {
			timestamp: new Date().toISOString(),
			analysis: {
				expectedFunctions: getExpectedFunctions(),
				browserTestRequired: true,
				nodeIncompatible: true,
				recommendedApproach: [
					'Run this introspection in a browser environment',
					'Use developer console to inspect WASM module',
					'Compare actual vs expected functions',
					'Update algorithm-matrix.md with findings'
				]
			}
		};

		// Generate browser-compatible introspection script
		await generateBrowserIntrospectionScript();

		console.log('📋 Expected Functions Analysis Complete');
		console.log(
			`📝 Generated ${report.analysis.expectedFunctions.length} expected function mappings`
		);
		console.log('🌐 Browser introspection script generated at: browser-introspect.html');

		return report;
	} catch (error) {
		console.error('❌ Error during introspection:', error);
		throw error;
	}
}

/**
 * Get all expected functions based on our algorithm matrix
 */
function getExpectedFunctions() {
	return [
		// Core functions (all backends)
		{ name: 'set_detail', backend: 'all', required: true, type: 'float', range: '0.0-1.0' },
		{ name: 'set_stroke_width', backend: 'all', required: true, type: 'float', range: '0.1-10.0' },
		{ name: 'set_noise_filtering', backend: 'all', required: true, type: 'bool' },
		{ name: 'set_backend', backend: 'all', required: true, type: 'string' },

		// Hand-drawn aesthetics (most backends)
		{ name: 'set_hand_drawn_preset', backend: 'all', required: true, type: 'string' },
		{
			name: 'set_custom_variable_weights',
			backend: 'edge,centerline,superpixel',
			required: false,
			type: 'float',
			range: '0.0-1.0'
		},
		{
			name: 'set_custom_tremor',
			backend: 'edge,centerline,superpixel',
			required: false,
			type: 'float',
			range: '0.0-0.5'
		},
		{
			name: 'set_tapering',
			backend: 'edge,centerline,superpixel',
			required: false,
			type: 'float',
			range: '0.0-1.0'
		},

		// Edge backend specific
		{ name: 'set_multipass', backend: 'edge', required: true, type: 'bool' },
		{ name: 'set_reverse_pass', backend: 'edge', required: false, type: 'bool' },
		{ name: 'set_diagonal_pass', backend: 'edge', required: false, type: 'bool' },
		{ name: 'set_enable_etf_fdog', backend: 'edge', required: false, type: 'bool' },
		{ name: 'set_enable_flow_tracing', backend: 'edge', required: false, type: 'bool' },
		{ name: 'set_enable_bezier_fitting', backend: 'edge', required: false, type: 'bool' },

		// Centerline backend specific
		{ name: 'set_enable_adaptive_threshold', backend: 'centerline', required: false, type: 'bool' },
		{
			name: 'set_window_size',
			backend: 'centerline',
			required: false,
			type: 'int',
			range: '15-50'
		},
		{
			name: 'set_sensitivity_k',
			backend: 'centerline',
			required: false,
			type: 'float',
			range: '0.1-1.0'
		},
		{
			name: 'set_min_branch_length',
			backend: 'centerline',
			required: false,
			type: 'int',
			range: '4-24'
		},
		{ name: 'set_enable_width_modulation', backend: 'centerline', required: false, type: 'bool' },
		{
			name: 'set_douglas_peucker_epsilon',
			backend: 'centerline',
			required: false,
			type: 'float',
			range: '0.5-3.0'
		},

		// Superpixel backend specific
		{
			name: 'set_num_superpixels',
			backend: 'superpixel',
			required: false,
			type: 'int',
			range: '20-1000'
		},
		{
			name: 'set_compactness',
			backend: 'superpixel',
			required: false,
			type: 'float',
			range: '1-50'
		},
		{
			name: 'set_slic_iterations',
			backend: 'superpixel',
			required: false,
			type: 'int',
			range: '5-15'
		},
		{ name: 'set_fill_regions', backend: 'superpixel', required: false, type: 'bool' },
		{ name: 'set_stroke_regions', backend: 'superpixel', required: false, type: 'bool' },
		{ name: 'set_simplify_boundaries', backend: 'superpixel', required: false, type: 'bool' },
		{
			name: 'set_boundary_epsilon',
			backend: 'superpixel',
			required: false,
			type: 'float',
			range: '0.5-3.0'
		},

		// Dots backend specific
		{ name: 'set_dot_density', backend: 'dots', required: false, type: 'float', range: '0.0-1.0' },
		{
			name: 'set_dot_size_range',
			backend: 'dots',
			required: false,
			type: 'function',
			params: ['min_radius', 'max_radius']
		},
		{ name: 'set_preserve_colors', backend: 'dots', required: false, type: 'bool' },
		{ name: 'set_adaptive_sizing', backend: 'dots', required: false, type: 'bool' },
		{
			name: 'set_background_tolerance',
			backend: 'dots',
			required: false,
			type: 'float',
			range: '0.0-1.0'
		},
		{ name: 'set_poisson_disk_sampling', backend: 'dots', required: false, type: 'bool' },
		{ name: 'set_gradient_based_sizing', backend: 'dots', required: false, type: 'bool' },

		// Global output settings
		{ name: 'set_svg_precision', backend: 'all', required: false, type: 'int', range: '0-4' },
		{ name: 'set_optimize_svg', backend: 'all', required: false, type: 'bool' },
		{ name: 'set_include_metadata', backend: 'all', required: false, type: 'bool' },

		// Performance settings
		{ name: 'set_max_processing_time_ms', backend: 'all', required: false, type: 'bigint' },
		{ name: 'set_thread_count', backend: 'all', required: false, type: 'int' },
		{ name: 'set_max_image_size', backend: 'all', required: false, type: 'int' },

		// Processing functions
		{ name: 'vectorize', backend: 'all', required: true, type: 'function', params: ['ImageData'] },
		{
			name: 'vectorize_with_progress',
			backend: 'all',
			required: false,
			type: 'function',
			params: ['ImageData', 'callback']
		},
		{ name: 'validate_config', backend: 'all', required: false, type: 'function' },
		{ name: 'export_config', backend: 'all', required: false, type: 'function' },
		{
			name: 'import_config',
			backend: 'all',
			required: false,
			type: 'function',
			params: ['string']
		},
		{ name: 'use_preset', backend: 'all', required: false, type: 'function', params: ['string'] },

		// Cleanup and control
		{ name: 'abort_processing', backend: 'all', required: false, type: 'function' },
		{ name: 'cleanup', backend: 'all', required: false, type: 'function' }
	];
}

/**
 * Generate a browser-compatible introspection script
 */
async function generateBrowserIntrospectionScript() {
	const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WASM Module Introspection</title>
    <style>
        body { font-family: monospace; margin: 20px; background: #1a1a1a; color: #fff; }
        .section { margin: 20px 0; padding: 15px; background: #2a2a2a; border-radius: 5px; }
        .found { color: #4ade80; }
        .missing { color: #f87171; }
        .unknown { color: #fbbf24; }
        .header { color: #60a5fa; font-weight: bold; }
        pre { background: #1a1a1a; padding: 10px; border-radius: 3px; overflow-x: auto; }
        button { padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer; }
        button:hover { background: #2563eb; }
        #results { margin-top: 20px; }
        .stats { display: flex; gap: 20px; margin: 15px 0; }
        .stat { padding: 10px; background: #374151; border-radius: 5px; text-align: center; }
    </style>
</head>
<body>
    <h1>🔍 WASM Module Introspection Tool</h1>
    
    <div class="section">
        <h2 class="header">Instructions</h2>
        <ol>
            <li>Navigate to <code>http://localhost:5173/converter</code> in another tab</li>
            <li>Wait for WASM module to initialize</li>
            <li>Come back to this tab</li>
            <li>Click "Run Introspection" below</li>
        </ol>
    </div>

    <div class="section">
        <button onclick="runIntrospection()">🚀 Run Introspection</button>
        <button onclick="downloadReport()">📥 Download Report</button>
        <button onclick="copyToClipboard()">📋 Copy Results</button>
    </div>

    <div id="results"></div>

    <script>
        let introspectionData = null;
        
        const expectedFunctions = ${JSON.stringify(getExpectedFunctions(), null, 2)};

        async function runIntrospection() {
            const resultsDiv = document.getElementById('results');
            resultsDiv.innerHTML = '<div class="section">🔄 Running introspection...</div>';

            try {
                // Try to access the WASM module from the other tab
                const wasmModule = await getWasmModule();
                
                if (!wasmModule) {
                    throw new Error('WASM module not found. Make sure to load the converter page first.');
                }

                console.log('🎯 Found WASM module:', wasmModule);
                
                const results = analyzeWasmModule(wasmModule);
                introspectionData = results;
                displayResults(results);
                
            } catch (error) {
                resultsDiv.innerHTML = \`
                    <div class="section">
                        <h2 class="header">❌ Error</h2>
                        <pre>\${error.message}</pre>
                        <p>Make sure the converter page is loaded and WASM is initialized.</p>
                    </div>
                \`;
            }
        }

        async function getWasmModule() {
            // Try different ways to access the WASM module
            const attempts = [
                () => window.vectorizerService?.vectorizer,
                () => window.wasmModule,
                () => window.wasmVectorizer,
                () => {
                    // Try to find it in the global scope
                    for (let key of Object.keys(window)) {
                        const obj = window[key];
                        if (obj && typeof obj === 'object' && obj.vectorize) {
                            return obj;
                        }
                    }
                    return null;
                }
            ];

            for (let attempt of attempts) {
                try {
                    const module = attempt();
                    if (module && typeof module === 'object') {
                        return module;
                    }
                } catch (e) {
                    console.log('Attempt failed:', e);
                }
            }

            return null;
        }

        function analyzeWasmModule(wasmModule) {
            const results = {
                timestamp: new Date().toISOString(),
                module: {
                    found: true,
                    type: typeof wasmModule,
                    constructor: wasmModule.constructor?.name
                },
                functions: {
                    found: [],
                    missing: [],
                    unexpected: []
                },
                properties: [],
                summary: {}
            };

            // Get all properties and methods
            const allProperties = [];
            let current = wasmModule;
            while (current && current !== Object.prototype) {
                allProperties.push(...Object.getOwnPropertyNames(current));
                current = Object.getPrototypeOf(current);
            }

            results.properties = [...new Set(allProperties)].sort();

            // Check expected functions
            for (let expected of expectedFunctions) {
                const exists = typeof wasmModule[expected.name] === 'function';
                if (exists) {
                    results.functions.found.push({
                        ...expected,
                        actualType: typeof wasmModule[expected.name]
                    });
                } else {
                    results.functions.missing.push(expected);
                }
            }

            // Find unexpected functions
            const expectedNames = new Set(expectedFunctions.map(f => f.name));
            for (let prop of results.properties) {
                if (typeof wasmModule[prop] === 'function' && !expectedNames.has(prop)) {
                    results.functions.unexpected.push({
                        name: prop,
                        type: typeof wasmModule[prop]
                    });
                }
            }

            // Generate summary
            results.summary = {
                totalExpected: expectedFunctions.length,
                totalFound: results.functions.found.length,
                totalMissing: results.functions.missing.length,
                totalUnexpected: results.functions.unexpected.length,
                completeness: Math.round((results.functions.found.length / expectedFunctions.length) * 100)
            };

            return results;
        }

        function displayResults(results) {
            const html = \`
                <div class="section">
                    <h2 class="header">📊 Introspection Results</h2>
                    <div class="stats">
                        <div class="stat">
                            <div class="header">Found</div>
                            <div class="found">\${results.summary.totalFound}</div>
                        </div>
                        <div class="stat">
                            <div class="header">Missing</div>
                            <div class="missing">\${results.summary.totalMissing}</div>
                        </div>
                        <div class="stat">
                            <div class="header">Unexpected</div>
                            <div class="unknown">\${results.summary.totalUnexpected}</div>
                        </div>
                        <div class="stat">
                            <div class="header">Completeness</div>
                            <div>\${results.summary.completeness}%</div>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h2 class="header">✅ Found Functions (\${results.functions.found.length})</h2>
                    <pre>\${results.functions.found.map(f => \`✓ \${f.name} (\${f.backend})\`).join('\\n')}</pre>
                </div>

                <div class="section">
                    <h2 class="header">❌ Missing Functions (\${results.functions.missing.length})</h2>
                    <pre>\${results.functions.missing.map(f => \`✗ \${f.name} (\${f.backend}) - \${f.required ? 'REQUIRED' : 'optional'}\`).join('\\n')}</pre>
                </div>

                <div class="section">
                    <h2 class="header">❓ Unexpected Functions (\${results.functions.unexpected.length})</h2>
                    <pre>\${results.functions.unexpected.map(f => \`? \${f.name}\`).join('\\n')}</pre>
                </div>

                <div class="section">
                    <h2 class="header">🔧 All Properties (\${results.properties.length})</h2>
                    <pre>\${results.properties.join('\\n')}</pre>
                </div>
            \`;

            document.getElementById('results').innerHTML = html;
        }

        function downloadReport() {
            if (!introspectionData) {
                alert('Run introspection first');
                return;
            }

            const blob = new Blob([JSON.stringify(introspectionData, null, 2)], {
                type: 'application/json'
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = \`wasm-introspection-\${new Date().toISOString().split('T')[0]}.json\`;
            a.click();
            URL.revokeObjectURL(url);
        }

        function copyToClipboard() {
            if (!introspectionData) {
                alert('Run introspection first');
                return;
            }

            const summary = \`
# WASM Module Introspection Results

## Summary
- Found: \${introspectionData.summary.totalFound}/\${introspectionData.summary.totalExpected} (\${introspectionData.summary.completeness}%)
- Missing: \${introspectionData.summary.totalMissing}
- Unexpected: \${introspectionData.summary.totalUnexpected}

## Missing Functions (Critical)
\${introspectionData.functions.missing.filter(f => f.required).map(f => \`- \${f.name} (REQUIRED for \${f.backend})\`).join('\\n')}

## Missing Functions (Optional)
\${introspectionData.functions.missing.filter(f => !f.required).map(f => \`- \${f.name} (optional for \${f.backend})\`).join('\\n')}

## Found Functions
\${introspectionData.functions.found.map(f => \`- \${f.name} (\${f.backend})\`).join('\\n')}
            \`.trim();

            navigator.clipboard.writeText(summary).then(() => {
                alert('Results copied to clipboard!');
            });
        }
    </script>
</body>
</html>`;

	const outputPath = join(__dirname, 'browser-introspect.html');
	await fs.writeFile(outputPath, htmlContent);

	console.log(`📝 Browser introspection tool saved to: ${outputPath}`);
	console.log('🌐 To use: Open this file in a browser alongside the converter page');
}

// Run introspection if called directly
const currentFilePath = fileURLToPath(import.meta.url);
if (currentFilePath === process.argv[1]) {
	introspectWasmModule()
		.then((report) => {
			console.log('\n✅ Introspection complete!');
			console.log('📋 Check browser-introspect.html for detailed analysis');
		})
		.catch((error) => {
			console.error('\n❌ Introspection failed:', error);
			process.exit(1);
		});
}

export { introspectWasmModule, getExpectedFunctions };
