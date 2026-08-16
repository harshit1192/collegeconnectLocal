/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dbe6fe',
          500: '#3b6ff2',
          600: '#2f56d1',
          700: '#2544a8',
        },
      },
    },
  },
  plugins: [],
};
