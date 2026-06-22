/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#e8f4fd',
          100: '#c5e2f9',
          200: '#9ecef4',
          300: '#70b8ee',
          400: '#4aa8ea',
          500: '#1a97e6',  // primary
          600: '#1585ce',
          700: '#0e6fb0',
          800: '#085890',
          900: '#034070',
        },
        surface: {
          base:    '#0a0e1a',
          raised:  '#111827',
          overlay: '#1a2234',
          border:  '#1e2d45',
        },
        status: {
          success: '#22c55e',
          warning: '#f59e0b',
          error:   '#ef4444',
          info:    '#3b82f6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
