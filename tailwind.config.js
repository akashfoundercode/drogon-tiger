/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Cinzel', 'Georgia', 'serif'],
        body: ['Poppins', 'system-ui', 'sans-serif'],
      },
      colors: {
        gold: { 100: '#fff7c2', 300: '#fde68a', 400: '#f5c542', 500: '#d9a21b', 700: '#9a6a12', 900: '#5c3b06' },
        dragon: { 300: '#7dd3fc', 500: '#2563eb', 700: '#1537a8', 900: '#0a1a5c' },
        tigerc: { 300: '#fdba74', 500: '#ea580c', 700: '#a01212', 900: '#4a0707' },
        tiec: { 300: '#86efac', 500: '#16a34a', 700: '#0f6b30', 900: '#064e24' },
      },
    },
  },
  plugins: [],
};
