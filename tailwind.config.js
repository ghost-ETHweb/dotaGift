/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        ui: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        display: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        mono: ['"SF Mono"', 'ui-monospace', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 28px rgba(236, 190, 84, 0.24)',
      },
    },
  },
  plugins: [],
};
