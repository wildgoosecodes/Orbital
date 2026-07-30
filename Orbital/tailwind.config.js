/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Orbital design system — see DESIGN.md. Combined-concept tokens,
      // approved 2026-07-30. Use these instead of raw slate/indigo utilities
      // when building the dashboard rework.
      colors: {
        cosmic: {
          bg: '#07070c',
          surface: '#0e0f18',
          'surface-2': '#14151f',
          'surface-3': '#191a26',
          border: '#22232f',
          'border-soft': '#1a1b26',
        },
        orbital: {
          text: '#f3f4f8',
          'text-muted': '#9497ac',
          'text-faint': '#5b5d70',
          'accent-1': '#6366f1',
          'accent-2': '#22d3ee',
          violet: '#a78bfa',
        },
      },
      fontFamily: {
        display: ['"Avenir Next"', '"Segoe UI Semibold"', '"Helvetica Neue"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', '"Cascadia Code"', '"SF Mono"', '"Roboto Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}