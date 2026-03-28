/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: { 50: "#fef5ee", 100: "#fde8d4", 400: "#e8914f", 500: "#d47e3e", 600: "#c06c30" },
        navy: { 50: "#f0f4ff", 100: "#dbe4ff", 400: "#5b8ef5", 500: "#4876d9", 700: "#364fc7", 800: "#162038", 900: "#0c1222" },
        teal: { 50: "#e6fcf5", 100: "#c3fae8", 400: "#34c9a2", 500: "#20b890", 600: "#12a67e" },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "-apple-system", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      borderRadius: {
        "xl": "14px",
        "2xl": "18px",
      },
    },
  },
  plugins: [],
};
