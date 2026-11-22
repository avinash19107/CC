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
        cyber: {
          bg: '#0b0f19',
          card: '#111827',
          border: '#1f2937',
          blue: '#3b82f6',
          purple: '#8b5cf6',
          red: '#ef4444',
          yellow: '#f59e0b',
          green: '#10b981'
        }
      }
    },
  },
  plugins: [],
}

