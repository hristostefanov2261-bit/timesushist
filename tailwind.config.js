/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6366f1',    // фиолетовый
        accent: '#3b82f6',     // голубой
        success: '#10b981',    // зелёный
        warning: '#f97316',    // оранжевый
        danger: '#ef4444',     // красный
        neutral: '#f3f4f6',    // светло-серый фон
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
