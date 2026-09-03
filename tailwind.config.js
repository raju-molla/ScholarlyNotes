/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["Georgia", "Cambria", "'Times New Roman'", "Times", "serif"],
      },
      colors: {
        ink: "#1b1f23",
        paper: "#faf9f6",
        accent: "#2f5d50",
        accent2: "#8a5a44",
      },
    },
  },
  plugins: [],
};
