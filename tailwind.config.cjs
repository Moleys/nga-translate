/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        midnight: '#0b1410',
        pine: '#0f1913',
        moss: '#1b2b21',
        mint: '#9ad64d',
        fog: '#dfe9dc',
        smoke: '#94a89c',
      },
      boxShadow: {
        card: '0 16px 40px rgba(0,0,0,0.35)'
      }
    },
  },
  plugins: [],
}
