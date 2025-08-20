/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'neon-blue': '#00f5d4',
        'neon-magenta': '#ff3cac',
        'neon-pink': '#ff006e',
      },
    },
  },
  plugins: [],
}