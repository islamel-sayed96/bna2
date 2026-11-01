/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans Arabic"', 'system-ui', 'Segoe UI', 'Tahoma', 'sans-serif'],
        display: ['"Baloo Bhaijaan 2"', '"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f3f2fd', 100: '#e7e5fb', 200: '#d2cdf7', 300: '#b3a9f0', 400: '#9282e6',
          500: '#7a64db', 600: '#6a4fcc', 700: '#5a40b2', 800: '#4a3791', 900: '#3d3174', 950: '#252046',
        },
        ink: { DEFAULT: '#2b2c6b', soft: '#5d5f97' },
        paper: { DEFAULT: '#f3f0fb', line: '#e7e2f6', dark: '#16142b' },
        note: { DEFAULT: '#fff4b0', deep: '#ffe873' },
      },
      boxShadow: {
        card: '0 1px 0 rgb(43 44 107 / 0.04), 0 12px 28px -14px rgb(90 64 178 / 0.28)',
        note: '0 1px 0 rgb(0 0 0 / 0.03), 0 14px 24px -14px rgb(160 120 0 / 0.45)',
      },
    },
  },
  plugins: [],
}
