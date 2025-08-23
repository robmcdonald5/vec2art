import type { Config } from 'tailwindcss';

const config: Config = {
	darkMode: 'class',
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				// Ferrari-inspired accent colors (10-15% usage)
				ferrari: {
					25: '#fefcfc', // Ultra-light warm white
					50: '#fef7f7',
					100: '#fee5e5',
					200: '#fdd4d4',
					300: '#fbb1b1',
					400: '#f87e7e',
					500: '#DC143C', // Ferrari Crimson (primary accent)
					600: '#b91c2e',
					700: '#9b1627',
					800: '#7c1520',
					900: '#5a1017',
					950: '#2d080b'
				},
				// Clean professional palette (85-90% usage)
				speed: {
					white: '#ffffff',
					gray: {
						25: '#fcfcfc', // Ultra-light
						50: '#fafafa',
						100: '#f5f5f5',
						200: '#e5e5e5',
						300: '#d4d4d4',
						400: '#a3a3a3',
						500: '#737373',
						600: '#525252',
						700: '#404040',
						800: '#262626',
						900: '#171717',
						950: '#0d0d0d' // Deeper black
					},
					black: '#0a0a0a',
					silver: '#e5e7eb', // Light silver for accents
					chrome: '#f3f4f6' // Very light chrome
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif']
			},
			backgroundImage: {
				// Modern gradient hero backgrounds
				'hero-modern': 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #4ecdc4 100%)',
				'hero-vibrant': 'linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 50%, #45b7d1 100%)',
				'hero-dynamic':
					'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #ff6b6b 50%, #4ecdc4 75%, #45b7d1 100%)',
				'hero-clean': 'linear-gradient(135deg, #ffffff 0%, #fafafa 50%, #f5f5f5 100%)',
				'hero-speed': 'radial-gradient(circle at top right, #fef7f7 0%, #ffffff 60%)',
				'hero-speed-dynamic':
					'radial-gradient(ellipse 130% 100% at 70% 20%, #fef7f7 0%, #ffffff 30%, #fafafa 60%, #f5f5f5 100%)',
				'hero-ferrari-subtle':
					'linear-gradient(135deg, #ffffff 0%, #fef7f7 25%, #ffffff 50%, #fafafa 75%, #f5f5f5 100%)',

				// Enhanced section gradients with more depth
				'section-clean': 'linear-gradient(180deg, #ffffff 0%, #fafafa 100%)',
				'section-alt': 'linear-gradient(180deg, #fafafa 0%, #ffffff 100%)',
				'section-elevated': 'linear-gradient(180deg, #fefcfc 0%, #ffffff 50%, #fafafa 100%)',
				'section-premium':
					'linear-gradient(180deg, #fafafa 0%, #f5f5f5 30%, #ffffff 70%, #fafafa 100%)',

				// Enhanced Ferrari accent gradients
				'ferrari-accent': 'linear-gradient(135deg, #DC143C 0%, #b91c2e 100%)',
				'ferrari-modern': 'linear-gradient(135deg, #ff6b6b 0%, #DC143C 50%, #b91c2e 100%)',
				'ferrari-subtle':
					'linear-gradient(90deg, rgba(220, 20, 60, 0.05) 0%, rgba(220, 20, 60, 0.02) 100%)',
				'ferrari-glow': 'linear-gradient(135deg, #DC143C 0%, #b91c2e 50%, #DC143C 100%)',
				'ferrari-vibrant': 'linear-gradient(45deg, #ff6b6b, #DC143C, #4ecdc4, #45b7d1)',
				'ferrari-button': 'linear-gradient(135deg, #ff6b6b 0%, #DC143C 50%, #b91c2e 100%)',

				// Speed-themed overlays and decorative elements
				'speed-line':
					'linear-gradient(90deg, transparent 0%, rgba(220, 20, 60, 0.1) 50%, transparent 100%)',
				'speed-overlay':
					'linear-gradient(90deg, transparent 0%, rgba(220, 20, 60, 0.03) 20%, rgba(220, 20, 60, 0.05) 50%, rgba(220, 20, 60, 0.03) 80%, transparent 100%)',
				'chrome-subtle': 'linear-gradient(145deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)',

				// Enhanced interactive card backgrounds
				'card-hover-ferrari':
					'linear-gradient(145deg, rgba(255, 255, 255, 0.9) 0%, rgba(254, 247, 247, 0.9) 100%)',
				'card-modern':
					'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
				'card-vibrant':
					'linear-gradient(135deg, rgba(255, 107, 107, 0.1) 0%, rgba(78, 205, 196, 0.1) 100%)',
				'card-glassmorphism':
					'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',

				// Navigation backgrounds
				'nav-clean': 'linear-gradient(180deg, #ffffff 0%, rgba(255, 255, 255, 0.95) 100%)',
				'nav-dark': 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)',

				// Legacy gradients (keeping for backwards compatibility)
				'tech-primary': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
				'processing-gradient': 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
				'card-gradient':
					'linear-gradient(145deg, rgba(30, 41, 59, 0.8) 0%, rgba(51, 65, 85, 0.6) 100%)',

				// Footer: Perceptual OKLCH gradient for smooth interpolation
				'footer-gradient':
					'linear-gradient(in oklch to bottom, oklch(0.15 0.03 270) 0%, oklch(0.17 0.04 275) 25%, oklch(0.19 0.05 280) 50%, oklch(0.17 0.04 285) 75%, oklch(0.15 0.03 270) 100%)',

				// Dark mode variants
				'features-clean-dark': 'linear-gradient(180deg, #1e293b 0%, #334155 100%)',
				'algorithm-premium-dark': 'linear-gradient(135deg, #374151 0%, #4b5563 50%, #6b7280 100%)',

				// Noise overlay
				'noise-overlay':
					"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='1' stitchTiles='stitch'/%3E%3CfeColorMatrix in='turbulence' type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='discrete' tableValues='0 .5 0 .5 0 .5'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E\")"
			},
			animation: {
				// Standard animations
				gradient: 'gradient 8s ease infinite',
				'gradient-shift': 'gradientShift 3s ease infinite',
				'gradient-slow': 'gradientShift 8s ease infinite',
				'fade-in': 'fadeIn 0.6s ease-out',
				'slide-up': 'slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
				'fade-in-up': 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)',

				// Subtle speed-themed animations
				'ferrari-pulse': 'ferrariPulse 3s ease-in-out infinite',
				'speed-glow': 'speedGlow 4s ease-in-out infinite alternate',
				'subtle-shift': 'subtleShift 6s ease-in-out infinite',

				// Enhanced racing-inspired animations
				'speed-rush': 'speedRush 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite',
				'ferrari-glow': 'ferrariGlow 4s ease-in-out infinite alternate',
				'dynamic-shift': 'dynamicShift 8s ease-in-out infinite',

				// Performance-focused micro-interactions
				'quick-scale': 'quickScale 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
				'smooth-bounce': 'smoothBounce 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
				'quick-lift': 'quickLift 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
				'smooth-scale': 'smoothScale 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
			},
			keyframes: {
				gradient: {
					'0%, 100%': {
						'background-size': '200% 200%',
						'background-position': 'left center'
					},
					'50%': {
						'background-size': '200% 200%',
						'background-position': 'right center'
					}
				},
				gradientShift: {
					'0%': { 'background-position': '0% 50%' },
					'50%': { 'background-position': '100% 50%' },
					'100%': { 'background-position': '0% 50%' }
				},
				fadeInUp: {
					'0%': { opacity: '0', transform: 'translateY(30px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				fadeIn: {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				slideUp: {
					'0%': { transform: 'translateY(30px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				// Subtle Ferrari-inspired animations
				ferrariPulse: {
					'0%, 100%': {
						boxShadow: '0 0 0 0 rgba(220, 20, 60, 0.1)'
					},
					'50%': {
						boxShadow: '0 0 0 4px rgba(220, 20, 60, 0)'
					}
				},
				speedGlow: {
					'0%': {
						boxShadow: '0 0 5px rgba(220, 20, 60, 0.1)'
					},
					'100%': {
						boxShadow: '0 0 15px rgba(220, 20, 60, 0.2)'
					}
				},
				subtleShift: {
					'0%, 100%': {
						transform: 'translateY(0px)'
					},
					'50%': {
						transform: 'translateY(-2px)'
					}
				},
				// Enhanced racing-inspired keyframes
				speedRush: {
					'0%, 100%': { transform: 'translateX(0px) scale(1)' },
					'50%': { transform: 'translateX(2px) scale(1.01)' }
				},
				ferrariGlow: {
					'0%': { boxShadow: '0 0 10px rgba(220, 20, 60, 0.1)', filter: 'brightness(1)' },
					'100%': { boxShadow: '0 0 25px rgba(220, 20, 60, 0.2)', filter: 'brightness(1.02)' }
				},
				dynamicShift: {
					'0%, 100%': {
						transform: 'translateY(0px) translateX(0px)'
					},
					'25%': {
						transform: 'translateY(-1px) translateX(1px)'
					},
					'50%': {
						transform: 'translateY(-2px) translateX(0px)'
					},
					'75%': {
						transform: 'translateY(-1px) translateX(-1px)'
					}
				},
				// Micro-interaction keyframes
				quickScale: {
					'0%': { transform: 'scale(1)' },
					'100%': { transform: 'scale(1.02)' }
				},
				smoothBounce: {
					'0%': { transform: 'scale(1)' },
					'50%': { transform: 'scale(1.05)' },
					'100%': { transform: 'scale(1)' }
				},
				quickLift: {
					'0%': { transform: 'translateY(0px)' },
					'100%': { transform: 'translateY(-3px)' }
				},
				smoothScale: {
					'0%': { transform: 'scale(1)' },
					'100%': { transform: 'scale(1.02)' }
				}
			}
		}
	},
	plugins: []
};

export default config;
