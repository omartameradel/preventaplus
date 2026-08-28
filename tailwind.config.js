/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // تفعيل الوضع الليلي
  theme: {
    extend: {
      fontFamily: {
        cairo: ['Cairo', 'sans-serif'],
      },
      colors: {
        primary: "#4F46E5", // لون احترافي للـ SaaS
      }
    },
  },
  plugins: [],
}