/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      spacing: {
        '40': '10rem',   // 160px
        '44': '11rem',   // 176px
        '48': '12rem',   // 192px
        '52': '13rem',   // 208px
        '56': '14rem',   // 224px
        '60': '15rem',   // 240px
      },
    },
  },
  plugins: [],
}