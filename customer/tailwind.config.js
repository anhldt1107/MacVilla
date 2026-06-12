/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#004a99',
        secondary: '#d70018',
        'accent-red': '#d70018',
        'accent-orange': '#f97316',
        'success-green': '#22c55e',
        'background-light': '#f5f7f8',
        'background-dark': '#0f1923',
      },
      fontFamily: {
        display: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
    },
  },
  plugins: [],
}
