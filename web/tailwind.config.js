/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",   // ✅ enable dark mode
  theme: {
    extend: {
      screens: {
        'ms': '320px',    // Mobile S
        'mm': '375px',    // Mobile M
        'ml': '425px',    // Mobile L
        'tab': '768px',   // Tab
      },
    },
  },
  plugins: [],
};
