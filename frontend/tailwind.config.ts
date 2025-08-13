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
				'tech-primary': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
				'tech-secondary': 'linear-gradient(45deg, #844fc1 0%, #3b86d1 100%)',
				'processing-gradient': 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
				'aurora-tech': 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #667eea 100%)',
				'card-gradient': 'linear-gradient(145deg, rgba(30, 41, 59, 0.8) 0%, rgba(51, 65, 85, 0.6) 100%)',
				
				// Hero: Dark Cool Diagonal (135deg)
				'hero-gradient': 'linear-gradient(135deg, #0f172a 0%, #1e293b 20%, #312e81 40%, #1e40af 60%, #1e293b 80%, #0f172a 100%)',
				
				// Features: Light Neutral Vertical (90deg) 
				'features-gradient': 'linear-gradient(90deg, #ffffff 0%, #f8fafc 20%, #f1f5f9 40%, #e2e8f0 60%, #f1f5f9 80%, #ffffff 100%)',
				
				// Algorithm: Medium Warm Diagonal Opposite (45deg)
				'algorithm-gradient': 'linear-gradient(45deg, #fef3c7 0%, #fde68a 25%, #fed7aa 50%, #fecaca 75%, #fde68a 100%)',
				
				// Footer: Perceptual OKLCH gradient for smooth interpolation
				'footer-gradient': 'linear-gradient(in oklch to bottom, oklch(0.15 0.03 270) 0%, oklch(0.17 0.04 275) 25%, oklch(0.19 0.05 280) 50%, oklch(0.17 0.04 285) 75%, oklch(0.15 0.03 270) 100%)',
				
				// Subtle noise overlay for dithering effect
				'noise-overlay': 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'1\' stitchTiles=\'stitch\'/%3E%3CfeColorMatrix in=\'turbulence\' type=\'saturate\' values=\'0\'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type=\'discrete\' tableValues=\'0 .5 0 .5 0 .5\'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.03\'/%3E%3C/svg%3E")',
				
				// Dark mode variants
				'features-gradient-dark': 'linear-gradient(90deg, #1e293b 0%, #334155 20%, #475569 40%, #64748b 60%, #475569 80%, #334155 100%)',
				'algorithm-gradient-dark': 'linear-gradient(45deg, #374151 0%, #4b5563 25%, #6b7280 50%, #9ca3af 75%, #6b7280 100%)'
			},
			animation: {
				'gradient': 'gradient 8s ease infinite',
				'fade-in': 'fadeIn 0.5s ease-in-out',
				'slide-up': 'slideUp 0.5s ease-out'
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
				fadeIn: {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				slideUp: {
					'0%': { transform: 'translateY(20px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				}
			}
		}
	},
	plugins: []
};

export default config;
