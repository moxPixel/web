/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'inter-tight': ['"Inter Tight"', 'sans-serif'],
        'sans': ['ui-sans-serif', 'system-ui', 'sans-serif', '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"', '"Noto Color Emoji"'],
        'mono': ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
      },
      colors: {
        // Primary colors
        primary: {
          50: '#f4f2fe',
          100: '#ece8ff',
          200: '#dcd4ff',
          300: '#c3b1ff',
          400: '#a585ff',
          500: '#864ffe',
          600: '#7c31f6',
        },
        // Secondary and accent
        secondary: '#1a1a1c',
        accent: '#fcfcfc',
        // Background colors (light mode)
        background: {
          1: '#fcfcfd',
          2: '#f9fafb',
          3: '#f4f5f8',
          4: '#f0f2f6',
          5: '#13171e', // dark mode
          6: '#0f1217', // dark mode
          7: '#181d26', // dark mode
          8: '#070b10', // dark mode
          9: '#1f252f', // dark mode
          12: '#eaeceb',
        },
        // Stroke colors
        stroke: {
          1: '#dfe4eb', // light mode
          2: '#e3e7ed', // light mode
          3: '#d7dde5', // light mode
          4: '#eceff4', // light mode
          5: '#1b232f', // dark mode
          6: '#202731', // dark mode
          7: '#2a333e', // dark mode
          8: '#303b49', // dark mode
          9: '#070b10', // dark mode (same as background-8)
        },
        // NS colors
        'ns-yellow': '#f9eb57',
        'ns-green': '#c6f56f',
        'ns-red': '#ffb9a2',
        'ns-cyan': '#83e7ee',
        'ns-green-light': '#e8fbc6',
        'ns-cyan-light': '#cdf5f8',
        'ns-yellow-light': '#fdf7bc',
        // Standard colors
        black: '#000',
        white: '#fff',
        'red-400': 'oklch(70.4% 0.191 22.216)',
      },
      fontSize: {
        'heading-1': ['4.25rem', { lineHeight: '110%' }],
        'heading-2': ['3.25rem', { lineHeight: '120%' }],
        'heading-3': ['2.5rem', { lineHeight: '120%' }],
        'heading-4': ['2rem', { lineHeight: '130%' }],
        'heading-5': ['1.5rem', { lineHeight: '140%' }],
        'heading-6': ['1.25rem', { lineHeight: '140%' }],
        'tagline-1': ['1rem', { lineHeight: '150%' }],
        'tagline-2': ['0.875rem', { lineHeight: '150%' }],
        'tagline-3': ['0.75rem', { lineHeight: '150%' }],
      },
      borderRadius: {
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      backgroundImage: {
        'gradient-1': 'linear-gradient(135deg, #a585ff 0%, #ffc2ad 100%)',
        'gradient-5': 'linear-gradient(165deg, #ffffff80 0.51%, #fff0 64.43%)',
        'gradient-6': 'linear-gradient(#83e7ee 0%, #c6f56f 100%)',
        'gradient-7': 'linear-gradient(#fff 0%, #83e7ee 100%)',
        'gradient-8': 'linear-gradient(156deg, #fff 32.92%, #a585ff 91%)',
        'gradient-9': 'linear-gradient(156deg, #dfb0ff 32.92%, #fdbedc 91%)',
        'gradient-11': 'linear-gradient(179deg, #fff0 0.68%, #fff 79.47%)',
        'gradient-12': 'radial-gradient(73.01% 80.77% at 19.23% 47.79%, #83e7ee 0%, #864ffe00 100%)',
      },
    },
  },
  plugins: [],
}

