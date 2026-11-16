/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        win: {
          bg: {
            light: '#f3f3f3',
            dark: '#202020'
          },
          card: {
            light: 'rgba(255, 255, 255, 0.85)',
            dark: 'rgba(32, 32, 32, 0.85)'
          },
          border: {
            light: '#e5e5e5',
            dark: '#2d2d2d'
          },
          accent: {
            DEFAULT: '#0067c0',
            hover: '#1975c5',
            dark: '#4cc2ff'
          }
        }
      },
      fontFamily: {
        sans: ['"Segoe UI Variable"', '"Segoe UI"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'fluent': '0 4px 16px 0 rgba(0, 0, 0, 0.08), 0 1px 3px 0 rgba(0, 0, 0, 0.04)',
        'fluent-hover': '0 8px 24px 0 rgba(0, 0, 0, 0.12), 0 2px 6px 0 rgba(0, 0, 0, 0.06)',
        'fluent-dark': '0 4px 16px 0 rgba(0, 0, 0, 0.4), 0 1px 3px 0 rgba(0, 0, 0, 0.3)',
      }
    },
  },
  plugins: [],
}
