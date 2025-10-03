module.exports = {
	plugins: {
		'@csstools/postcss-oklab-function': {
			preserve: true // Keep OKLCH for modern browsers, add RGB fallbacks for Safari < 15.4
		},
		autoprefixer: {}
	}
};
