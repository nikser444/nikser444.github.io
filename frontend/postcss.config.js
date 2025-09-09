// postcss.config.js
export default {
  plugins: {
    // Import CSS files
    'postcss-import': {},
    
    // Tailwind CSS
    tailwindcss: {},
    
    // Autoprefixer for browser compatibility
    autoprefixer: {},
    
    // PostCSS Nested for nested CSS syntax
    'postcss-nested': {},
    
    // Custom properties (CSS Variables) support for older browsers
    'postcss-custom-properties': {
      preserve: true,
    },
    
    // CSS Modules support (if needed)
    ...(process.env.CSS_MODULES === 'true' && {
      'postcss-modules': {
        generateScopedName: '[name]__[local]___[hash:base64:5]',
        localsConvention: 'camelCase',
      },
    }),
    
    // Production optimizations
    ...(process.env.NODE_ENV === 'production' && {
      // Remove unused CSS
      '@fullhuman/postcss-purgecss': {
        content: [
          './src/**/*.{js,jsx,ts,tsx}',
          './index.html',
          './public/**/*.html',
        ],
        safelist: [
          // Tailwind classes that might be added dynamically
          /^(bg-|text-|border-|hover:|focus:|active:)/,
          // Chat bubble classes
          /^chat-/,
          // Call related classes
          /^call-/,
          // Animation classes
          /^animate-/,
          // Framer Motion classes
          /^motion-/,
          // Toast notification classes
          /^toast-/,
          // React components classes
          /^react-/,
          // Socket.io classes
          /^socket-/,
        ],
        defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
      },
      
      // Minify CSS
      cssnano: {
        preset: [
          'default',
          {
            discardComments: {
              removeAll: true,
            },
            minifyFontValues: {
              removeQuotes: false,
            },
            normalizeWhitespace: false,
          },
        ],
      },
    }),
    
    // Development helpers
    ...(process.env.NODE_ENV === 'development' && {
      // Better CSS debugging
      'postcss-reporter': {
        clearReportedMessages: true,
      },
    }),
  },
  
  // Source maps configuration
  map: process.env.NODE_ENV === 'development',
  
  // Parser configuration for different file types
  parser: process.env.CSS_PARSER || 'postcss',
  
  // Syntax configuration
  syntax: process.env.CSS_SYNTAX,
};