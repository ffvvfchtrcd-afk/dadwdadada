/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#09090b",
        surface: "#111115",
        cardBg: "#16161a",
        primary: "#3b82f6",
        primaryHover: "#2563eb",
        secondary: "#06b6d4",
        secondaryHover: "#0891b2",
        success: "#10b981",
        danger: "#f43f5e",
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
      },
    },
  },
  plugins: [],
}
