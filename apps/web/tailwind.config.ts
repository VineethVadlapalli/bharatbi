/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        saffron: { 50: "#fff7ed", 100: "#ffedd5", 200: "#fed7aa", 400: "#fb923c", 500: "#f97316", 600: "#ea580c", 700: "#c2410c" },
        navy: { 50: "#f0f4ff", 100: "#dbe4ff", 200: "#bac8ff", 400: "#5c7cfa", 500: "#4263eb", 600: "#3b5bdb", 700: "#364fc7", 800: "#1e3a5f", 900: "#0f1d33" },
        teal: { 50: "#e6fcf5", 100: "#c3fae8", 400: "#38d9a9", 500: "#20c997", 600: "#12b886" },
      },
      fontFamily: {
        display: ['"DM Sans"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
    },
  },
  plugins: [],
};