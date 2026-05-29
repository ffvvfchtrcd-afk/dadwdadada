/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#09090b", // zinc-950
        cardBg: "#18181b", // zinc-900
        primary: "#8b5cf6", // violet-500
        primaryHover: "#7c3aed", // violet-600
        secondary: "#06b6d4", // cyan-500
        secondaryHover: "#0891b2", // cyan-600
        success: "#10b981", // emerald-500
        danger: "#f43f5e", // rose-500
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
