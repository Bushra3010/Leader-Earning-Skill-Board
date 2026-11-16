/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { 50: '#eef2fa', 100: '#d9e1f2', 500: '#2b4a8c', 600: '#1f3a75', 700: '#172d5e', 800: '#112349', 900: '#0b1834' },
        gold: { 50: '#fbf6e9', 100: '#f5e9c6', 300: '#e5c574', 400: '#d9b04f', 500: '#c9a13b', 600: '#a8832a', 700: '#7f6220' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'], display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'] },
    },
  },
  plugins: [],
}
