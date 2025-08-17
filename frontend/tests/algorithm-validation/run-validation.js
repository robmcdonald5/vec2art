/**
 * Algorithm Validation Test Runner
 *
 * Systematically tests all vectorization algorithms with their parameter combinations
 * to identify configuration errors, invalid function calls, and logic issues.
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import { getExpectedFunctions } from './wasm-introspection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class AlgorithmValidator {
	constructor(options = {}) {
		this.options = {
			verbose: false,
			backend: null,
			outputDir: join(__dirname, 'outputs'),
			...options
		};

		this.results = {
			timestamp: new Date().toISOString(),
			summary: {},
			tests: [],
			errors: [],
			configurations: []
		};
	}

	async run() {
		console.log('🧪 Starting Algorithm Validation Suite\n');

		try {
			await this.setupOutputDirectories();
			await this.generateTestConfigurations();
			await this.generateBrowserTestSuite();
			await this.generateReports();

			console.log('\n✅ Validation suite setup complete!');
			console.log('📁 Check outputs/ directory for results');
			console.log('🌐 Open browser-test-suite.html to run tests');
		} catch (error) {
			console.error('❌ Validation failed:', error);
			throw error;
		}
	}

	async setupOutputDirectories() {
		const dirs = ['results', 'reports', 'baselines'];

		for (const dir of dirs) {
			const path = join(this.options.outputDir, dir);
			await fs.mkdir(path, { recursive: true });
		}

		console.log('📁 Output directories created');
	}

	async generateTestConfigurations() {
		console.log('⚙️ Generating test configurations...');

		const configs = {
			edge: this.generateEdgeConfigurations(),
			centerline: this.generateCenterlineConfigurations(),
			superpixel: this.generateSuperpixelConfigurations(),
			dots: this.generateDotsConfigurations()
		};

		// Save individual backend configurations
		for (const [backend, configurations] of Object.entries(configs)) {
			const configPath = join(__dirname, 'test-configs', `${backend}-backend.json`);
			await fs.mkdir(join(__dirname, 'test-configs'), { recursive: true });
			await fs.writeFile(configPath, JSON.stringify(configurations, null, 2));
			console.log(`📝 Generated ${configurations.length} configs for ${backend} backend`);
		}

		this.results.configurations = configs;
		return configs;
	}

	generateEdgeConfigurations() {
		const baseConfig = {
			backend: 'edge',
			detail: 0.4,
			stroke_width: 1.0,
			noise_filtering: true,
			multipass: true,
			reverse_pass: false,
			diagonal_pass: false,
			enable_etf_fdog: false,
			enable_flow_tracing: false,
			enable_bezier_fitting: false,
			hand_drawn_preset: 'medium',
			variable_weights: 0.3,
			tremor_strength: 0.2,
			tapering: 0.5
		};

		const configurations = [
			// Basic configurations
			{ ...baseConfig, name: 'edge-basic' },
			{ ...baseConfig, name: 'edge-no-multipass', multipass: false },
			{ ...baseConfig, name: 'edge-with-reverse', reverse_pass: true },
			{ ...baseConfig, name: 'edge-with-diagonal', diagonal_pass: true },
			{ ...baseConfig, name: 'edge-all-passes', reverse_pass: true, diagonal_pass: true },

			// Hand-drawn variations
			{
				...baseConfig,
				name: 'edge-no-handdrawn',
				hand_drawn_preset: 'none',
				variable_weights: 0,
				tremor_strength: 0,
				tapering: 0
			},
			{
				...baseConfig,
				name: 'edge-subtle-handdrawn',
				hand_drawn_preset: 'subtle',
				variable_weights: 0.1,
				tremor_strength: 0.1,
				tapering: 0.2
			},
			{
				...baseConfig,
				name: 'edge-strong-handdrawn',
				hand_drawn_preset: 'strong',
				variable_weights: 0.6,
				tremor_strength: 0.4,
				tapering: 0.8
			},
			{
				...baseConfig,
				name: 'edge-sketchy-handdrawn',
				hand_drawn_preset: 'sketchy',
				variable_weights: 0.8,
				tremor_strength: 0.5,
				tapering: 0.9
			},

			// Flow tracing combinations
			{ ...baseConfig, name: 'edge-with-flow', enable_flow_tracing: true },
			{
				...baseConfig,
				name: 'edge-flow-bezier',
				enable_flow_tracing: true,
				enable_bezier_fitting: true
			},
			{ ...baseConfig, name: 'edge-flow-etf', enable_flow_tracing: true, enable_etf_fdog: true },
			{
				...baseConfig,
				name: 'edge-all-advanced',
				enable_flow_tracing: true,
				enable_bezier_fitting: true,
				enable_etf_fdog: true
			},

			// Detail variations
			{ ...baseConfig, name: 'edge-low-detail', detail: 0.1 },
			{ ...baseConfig, name: 'edge-high-detail', detail: 0.8 },
			{ ...baseConfig, name: 'edge-max-detail', detail: 1.0 },

			// Stroke width variations
			{ ...baseConfig, name: 'edge-thin-stroke', stroke_width: 0.5 },
			{ ...baseConfig, name: 'edge-thick-stroke', stroke_width: 3.0 },

			// Invalid combinations (should fail)
			{
				...baseConfig,
				name: 'edge-invalid-bezier-no-flow',
				enable_bezier_fitting: true,
				enable_flow_tracing: false,
				expectError: true
			},
			{
				...baseConfig,
				name: 'edge-invalid-etf-no-flow',
				enable_etf_fdog: true,
				enable_flow_tracing: false,
				expectError: true
			}
		];

		return configurations;
	}

	generateCenterlineConfigurations() {
		const baseConfig = {
			backend: 'centerline',
			detail: 0.3,
			stroke_width: 0.8,
			noise_filtering: true,
			hand_drawn_preset: 'none',
			variable_weights: 0.0,
			tremor_strength: 0.0,
			tapering: 0.0,
			enable_adaptive_threshold: true,
			window_size: 25,
			sensitivity_k: 0.4,
			min_branch_length: 8,
			enable_width_modulation: false,
			douglas_peucker_epsilon: 1.0
		};

		const configurations = [
			// Basic configurations
			{ ...baseConfig, name: 'centerline-basic' },
			{ ...baseConfig, name: 'centerline-no-adaptive', enable_adaptive_threshold: false },
			{ ...baseConfig, name: 'centerline-with-width-mod', enable_width_modulation: true },

			// Hand-drawn variations (less common for centerline)
			{
				...baseConfig,
				name: 'centerline-subtle-handdrawn',
				hand_drawn_preset: 'subtle',
				variable_weights: 0.1,
				tremor_strength: 0.05,
				tapering: 0.1
			},
			{
				...baseConfig,
				name: 'centerline-medium-handdrawn',
				hand_drawn_preset: 'medium',
				variable_weights: 0.2,
				tremor_strength: 0.1,
				tapering: 0.3
			},

			// Parameter variations
			{ ...baseConfig, name: 'centerline-small-window', window_size: 15 },
			{ ...baseConfig, name: 'centerline-large-window', window_size: 45 },
			{ ...baseConfig, name: 'centerline-low-sensitivity', sensitivity_k: 0.1 },
			{ ...baseConfig, name: 'centerline-high-sensitivity', sensitivity_k: 0.9 },
			{ ...baseConfig, name: 'centerline-min-branch', min_branch_length: 4 },
			{ ...baseConfig, name: 'centerline-max-branch', min_branch_length: 20 },
			{ ...baseConfig, name: 'centerline-low-epsilon', douglas_peucker_epsilon: 0.5 },
			{ ...baseConfig, name: 'centerline-high-epsilon', douglas_peucker_epsilon: 2.5 },

			// Detail variations
			{ ...baseConfig, name: 'centerline-low-detail', detail: 0.1 },
			{ ...baseConfig, name: 'centerline-high-detail', detail: 0.6 },

			// Invalid combinations (should warn)
			{
				...baseConfig,
				name: 'centerline-invalid-flow',
				enable_flow_tracing: true,
				expectWarning: true
			},
			{
				...baseConfig,
				name: 'centerline-invalid-bezier',
				enable_bezier_fitting: true,
				expectWarning: true
			}
		];

		return configurations;
	}

	generateSuperpixelConfigurations() {
		const baseConfig = {
			backend: 'superpixel',
			detail: 0.2,
			stroke_width: 1.5,
			hand_drawn_preset: 'subtle',
			variable_weights: 0.1,
			tremor_strength: 0.0,
			tapering: 0.2,
			num_superpixels: 150,
			compactness: 20,
			slic_iterations: 10,
			fill_regions: true,
			stroke_regions: true,
			simplify_boundaries: true,
			boundary_epsilon: 1.0
		};

		const configurations = [
			// Basic configurations
			{ ...baseConfig, name: 'superpixel-basic' },
			{ ...baseConfig, name: 'superpixel-fill-only', stroke_regions: false },
			{ ...baseConfig, name: 'superpixel-stroke-only', fill_regions: false },
			{ ...baseConfig, name: 'superpixel-no-simplify', simplify_boundaries: false },

			// Superpixel count variations
			{ ...baseConfig, name: 'superpixel-few', num_superpixels: 50 },
			{ ...baseConfig, name: 'superpixel-many', num_superpixels: 400 },
			{ ...baseConfig, name: 'superpixel-max', num_superpixels: 800 },

			// Compactness variations
			{ ...baseConfig, name: 'superpixel-loose', compactness: 5 },
			{ ...baseConfig, name: 'superpixel-tight', compactness: 40 },

			// Iterations variations
			{ ...baseConfig, name: 'superpixel-few-iter', slic_iterations: 5 },
			{ ...baseConfig, name: 'superpixel-many-iter', slic_iterations: 15 },

			// Boundary epsilon variations
			{ ...baseConfig, name: 'superpixel-fine-boundary', boundary_epsilon: 0.5 },
			{ ...baseConfig, name: 'superpixel-coarse-boundary', boundary_epsilon: 2.5 },

			// Hand-drawn variations
			{
				...baseConfig,
				name: 'superpixel-no-handdrawn',
				hand_drawn_preset: 'none',
				variable_weights: 0,
				tremor_strength: 0,
				tapering: 0
			},
			{
				...baseConfig,
				name: 'superpixel-strong-handdrawn',
				hand_drawn_preset: 'medium',
				variable_weights: 0.3,
				tremor_strength: 0.1,
				tapering: 0.4
			}
		];

		return configurations;
	}

	generateDotsConfigurations() {
		const baseConfig = {
			backend: 'dots',
			detail: 0.3,
			hand_drawn_preset: 'none',
			variable_weights: 0.0,
			tremor_strength: 0.0,
			tapering: 0.0,
			dot_density_threshold: 0.15,
			preserve_colors: true,
			adaptive_sizing: true,
			min_radius: 0.5,
			max_radius: 3.0,
			background_tolerance: 0.1,
			poisson_disk_sampling: true,
			gradient_based_sizing: true
		};

		const configurations = [
			// Basic configurations
			{ ...baseConfig, name: 'dots-basic' },
			{ ...baseConfig, name: 'dots-no-colors', preserve_colors: false },
			{ ...baseConfig, name: 'dots-no-adaptive', adaptive_sizing: false },
			{ ...baseConfig, name: 'dots-no-poisson', poisson_disk_sampling: false },
			{ ...baseConfig, name: 'dots-no-gradient', gradient_based_sizing: false },

			// Density variations
			{ ...baseConfig, name: 'dots-sparse', dot_density_threshold: 0.05 },
			{ ...baseConfig, name: 'dots-dense', dot_density_threshold: 0.3 },
			{ ...baseConfig, name: 'dots-very-dense', dot_density_threshold: 0.5 },

			// Size variations
			{ ...baseConfig, name: 'dots-tiny', min_radius: 0.2, max_radius: 1.0 },
			{ ...baseConfig, name: 'dots-large', min_radius: 1.0, max_radius: 6.0 },
			{ ...baseConfig, name: 'dots-huge', min_radius: 2.0, max_radius: 10.0 },
			{ ...baseConfig, name: 'dots-uniform', min_radius: 1.5, max_radius: 1.5 },

			// Background tolerance variations
			{ ...baseConfig, name: 'dots-sensitive-bg', background_tolerance: 0.01 },
			{ ...baseConfig, name: 'dots-tolerant-bg', background_tolerance: 0.3 },

			// Detail variations
			{ ...baseConfig, name: 'dots-low-detail', detail: 0.1 },
			{ ...baseConfig, name: 'dots-high-detail', detail: 0.6 },

			// Invalid combinations
			{
				...baseConfig,
				name: 'dots-invalid-size-range',
				min_radius: 3.0,
				max_radius: 1.0,
				expectError: true
			},
			{
				...baseConfig,
				name: 'dots-invalid-handdrawn',
				hand_drawn_preset: 'strong',
				variable_weights: 0.5,
				expectWarning: true
			}
		];

		return configurations;
	}

	async generateBrowserTestSuite() {
		console.log('🌐 Generating browser test suite...');

		const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Algorithm Validation Test Suite</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
            margin: 0; 
            background: #0d1117; 
            color: #c9d1d9; 
            overflow-x: hidden;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { 
            background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
            padding: 30px; 
            border-radius: 12px; 
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .section { 
            background: #161b22; 
            margin: 20px 0; 
            padding: 25px; 
            border-radius: 8px; 
            border: 1px solid #30363d;
        }
        .controls { 
            display: flex; 
            flex-wrap: wrap;
            gap: 15px; 
            margin: 20px 0; 
            align-items: center;
        }
        button { 
            padding: 12px 24px; 
            background: #238636; 
            color: white; 
            border: none; 
            border-radius: 6px; 
            cursor: pointer; 
            font-weight: 500;
            transition: background-color 0.2s ease;
        }
        button:hover { background: #2ea043; }
        .test-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; }
        .test-card { background: #0d1117; border: 1px solid #30363d; border-radius: 6px; padding: 15px; }
        .test-card.passed { border-color: #2ea043; background: rgba(46, 160, 67, 0.1); }
        .test-card.failed { border-color: #da3633; background: rgba(218, 54, 51, 0.1); }
        .test-card.warning { border-color: #fb8500; background: rgba(251, 133, 0, 0.1); }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; }
        .stat { text-align: center; padding: 15px; background: #21262d; border-radius: 6px; }
        .stat-value { font-size: 24px; font-weight: bold; }
        .passed { color: #2ea043; }
        .failed { color: #da3633; }
        .warning { color: #fb8500; }
        .progress-bar { width: 100%; height: 8px; background: #21262d; border-radius: 4px; }
        .progress-fill { height: 100%; background: #2ea043; transition: width 0.3s ease; }
        .log-container { max-height: 400px; overflow-y: auto; background: #0d1117; border: 1px solid #30363d; border-radius: 6px; padding: 15px; }
        .log-entry { margin: 5px 0; font-size: 13px; }
        .log-timestamp { color: #7c3aed; }
        .log-level { font-weight: 600; margin: 0 8px; }
        .log-level.info { color: #58a6ff; }
        .log-level.error { color: #da3633; }
        .log-level.success { color: #2ea043; }
        pre { background: #0d1117; padding: 15px; border-radius: 6px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Algorithm Validation Test Suite</h1>
            <p>Comprehensive testing of all vectorization algorithms and parameter combinations</p>
        </div>

        <div class="section">
            <h2>📊 Test Statistics</h2>
            <div class="stats">
                <div class="stat">
                    <div class="stat-value" id="total-tests">0</div>
                    <div>Total Tests</div>
                </div>
                <div class="stat">
                    <div class="stat-value passed" id="passed-tests">0</div>
                    <div>Passed</div>
                </div>
                <div class="stat">
                    <div class="stat-value failed" id="failed-tests">0</div>
                    <div>Failed</div>
                </div>
                <div class="stat">
                    <div class="stat-value warning" id="warning-tests">0</div>
                    <div>Warnings</div>
                </div>
                <div class="stat">
                    <div class="stat-value" id="completion">0%</div>
                    <div>Complete</div>
                </div>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" id="progress" style="width: 0%"></div>
            </div>
        </div>

        <div class="section">
            <h2>🎮 Test Controls</h2>
            <div class="controls">
                <button onclick="runAllTests()">🚀 Run All Tests</button>
                <button onclick="runBackendTests('edge')">Test Edge Backend</button>
                <button onclick="runBackendTests('centerline')">Test Centerline Backend</button>
                <button onclick="runBackendTests('superpixel')">Test Superpixel Backend</button>
                <button onclick="runBackendTests('dots')">Test Dots Backend</button>
                <button onclick="downloadResults()">📥 Download Report</button>
            </div>
        </div>

        <div class="section">
            <h2>📝 Test Log</h2>
            <div class="log-container" id="log-container">
                <div class="log-entry">
                    <span class="log-timestamp">[${new Date().toISOString().split('T')[1].split('.')[0]}]</span>
                    <span class="log-level info">INFO</span>
                    <span>Test suite initialized. Ready to run validation tests.</span>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>🧪 Test Results</h2>
            <div class="test-grid" id="test-grid">
                <!-- Tests will be populated here -->
            </div>
        </div>
    </div>

    <script>
        // Test configurations
        const testConfigurations = ${JSON.stringify(this.results.configurations, null, 8)};
        
        let currentTests = [];
        let testResults = {};
        let isRunning = false;

        // Initialize the test suite
        function initializeTestSuite() {
            for (const [backend, configs] of Object.entries(testConfigurations)) {
                for (const config of configs) {
                    currentTests.push({
                        id: backend + '-' + (config.name || 'unnamed'),
                        name: config.name || 'Unnamed Test',
                        backend: backend,
                        config: config,
                        status: 'pending',
                        error: null,
                        result: null
                    });
                }
            }
            
            updateStatistics();
            renderTestGrid();
            log('info', 'Loaded ' + currentTests.length + ' test configurations');
        }

        async function runAllTests() {
            if (isRunning) return;
            isRunning = true;
            
            for (let i = 0; i < currentTests.length; i++) {
                if (!isRunning) break;
                await runSingleTest(currentTests[i], i);
                updateStatistics();
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            isRunning = false;
            log('success', 'Algorithm validation complete!');
        }

        async function runBackendTests(backend) {
            if (isRunning) return;
            isRunning = true;
            
            const backendTests = currentTests.filter(test => test.backend === backend);
            
            for (let i = 0; i < backendTests.length; i++) {
                if (!isRunning) break;
                await runSingleTest(backendTests[i], i);
                updateStatistics();
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            isRunning = false;
            log('success', backend + ' backend tests complete!');
        }

        async function runSingleTest(test, index) {
            test.status = 'running';
            renderTestGrid();
            
            log('info', 'Running test: ' + test.name);
            
            try {
                // Try to access vectorizer service from main app
                if (!window.vectorizerService) {
                    throw new Error('Vectorizer service not available. Load converter page first.');
                }

                // Validate configuration
                const validation = validateConfiguration(test.config);
                if (!validation.isValid) {
                    if (test.config.expectError) {
                        test.status = 'passed';
                        test.result = { message: 'Expected validation error occurred', validation };
                        log('success', 'Test ' + test.name + ': Expected validation error - PASSED');
                    } else {
                        test.status = 'failed';
                        test.error = 'Configuration validation failed: ' + validation.errors.join(', ');
                        log('error', 'Test ' + test.name + ': ' + test.error);
                    }
                    return;
                }

                // Try to configure the service
                await window.vectorizerService.configure(test.config);
                
                test.status = 'passed';
                test.result = { message: 'Configuration applied successfully' };
                log('success', 'Test ' + test.name + ': PASSED');
                
                if (test.config.expectWarning) {
                    test.status = 'warning';
                    log('warning', 'Test ' + test.name + ': Expected warning condition');
                }
                
            } catch (error) {
                if (test.config.expectError) {
                    test.status = 'passed';
                    test.result = { message: 'Expected error occurred', error: error.message };
                    log('success', 'Test ' + test.name + ': Expected error - PASSED');
                } else {
                    test.status = 'failed';
                    test.error = error.message;
                    log('error', 'Test ' + test.name + ': ' + error.message);
                }
            }
        }

        function validateConfiguration(config) {
            const errors = [];
            
            // Basic validation
            if (config.detail < 0 || config.detail > 1) {
                errors.push('Detail must be between 0.0 and 1.0');
            }
            
            if (config.stroke_width < 0.1 || config.stroke_width > 10) {
                errors.push('Stroke width must be between 0.1 and 10.0');
            }
            
            // Backend-specific validation
            if (config.backend === 'edge') {
                if (config.enable_bezier_fitting && !config.enable_flow_tracing) {
                    errors.push('Bézier fitting requires flow tracing');
                }
                if (config.enable_etf_fdog && !config.enable_flow_tracing) {
                    errors.push('ETF/FDoG requires flow tracing');
                }
            }
            
            if (config.backend === 'dots') {
                if (config.min_radius >= config.max_radius) {
                    errors.push('min_radius must be less than max_radius');
                }
            }
            
            return { isValid: errors.length === 0, errors };
        }

        function updateStatistics() {
            const total = currentTests.length;
            const passed = currentTests.filter(t => t.status === 'passed').length;
            const failed = currentTests.filter(t => t.status === 'failed').length;
            const warnings = currentTests.filter(t => t.status === 'warning').length;
            const completed = passed + failed + warnings;
            const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
            
            document.getElementById('total-tests').textContent = total;
            document.getElementById('passed-tests').textContent = passed;
            document.getElementById('failed-tests').textContent = failed;
            document.getElementById('warning-tests').textContent = warnings;
            document.getElementById('completion').textContent = percentage + '%';
        }

        function renderTestGrid() {
            const grid = document.getElementById('test-grid');
            grid.innerHTML = currentTests.map(test => 
                '<div class="test-card ' + test.status + '">' +
                '<div><strong>' + test.name + '</strong></div>' +
                '<div>Backend: ' + test.backend + '</div>' +
                '<div>Status: ' + test.status + '</div>' +
                (test.error ? '<div style="color: #da3633; font-size: 12px; margin-top: 5px;">' + test.error + '</div>' : '') +
                '</div>'
            ).join('');
        }

        function downloadResults() {
            const report = {
                timestamp: new Date().toISOString(),
                summary: {
                    total: currentTests.length,
                    passed: currentTests.filter(t => t.status === 'passed').length,
                    failed: currentTests.filter(t => t.status === 'failed').length,
                    warnings: currentTests.filter(t => t.status === 'warning').length
                },
                results: testResults
            };
            
            const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'algorithm-validation-' + new Date().toISOString().split('T')[0] + '.json';
            a.click();
            URL.revokeObjectURL(url);
        }

        function log(level, message) {
            const container = document.getElementById('log-container');
            const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
            
            const entry = document.createElement('div');
            entry.className = 'log-entry';
            entry.innerHTML = 
                '<span class="log-timestamp">[' + timestamp + ']</span>' +
                '<span class="log-level ' + level + '">' + level.toUpperCase() + '</span>' +
                '<span>' + message + '</span>';
            
            container.appendChild(entry);
            container.scrollTop = container.scrollHeight;
        }

        document.addEventListener('DOMContentLoaded', initializeTestSuite);
    </script>
</body>
</html>`;

		const outputPath = join(this.options.outputDir, 'browser-test-suite.html');
		await fs.writeFile(outputPath, htmlContent);

		console.log(`🌐 Browser test suite saved to: ${outputPath}`);
	}

	async generateReports() {
		console.log('📊 Generating test reports...');

		const summaryReport = {
			timestamp: this.results.timestamp,
			totalConfigurations: Object.values(this.results.configurations).reduce(
				(sum, configs) => sum + configs.length,
				0
			),
			configurationsByBackend: Object.fromEntries(
				Object.entries(this.results.configurations).map(([backend, configs]) => [
					backend,
					configs.length
				])
			),
			expectedFunctions: getExpectedFunctions(),
			instructions: [
				'1. Open browser-test-suite.html in a web browser',
				'2. Open the converter application in another tab',
				'3. Wait for WASM initialization',
				'4. Return to test suite and click "Run All Tests"',
				'5. Download the results for analysis'
			]
		};

		const reportPath = join(this.options.outputDir, 'reports', 'validation-summary.json');
		await fs.writeFile(reportPath, JSON.stringify(summaryReport, null, 2));

		console.log(`📝 Summary report saved to: ${reportPath}`);
	}
}

// CLI execution
const currentFilePath = fileURLToPath(import.meta.url);
if (currentFilePath === process.argv[1]) {
	const args = process.argv.slice(2);
	const options = {};

	// Parse command line arguments
	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (arg === '--verbose') {
			options.verbose = true;
		} else if (arg === '--backend' && args[i + 1]) {
			options.backend = args[i + 1];
			i++;
		} else if (arg === '--output' && args[i + 1]) {
			options.outputDir = args[i + 1];
			i++;
		}
	}

	const validator = new AlgorithmValidator(options);
	validator
		.run()
		.then(() => {
			console.log('\n✅ Algorithm validation setup complete!');
			console.log('📖 Next steps:');
			console.log('   1. Open outputs/browser-test-suite.html');
			console.log('   2. Load converter page in another tab');
			console.log('   3. Run validation tests');
		})
		.catch((error) => {
			console.error('\n❌ Validation setup failed:', error);
			process.exit(1);
		});
}

export { AlgorithmValidator };
