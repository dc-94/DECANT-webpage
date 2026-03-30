/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // En v4, no necesitas duplicar el theme aquí si ya está en el CSS
  theme: {
    extend: {},
  },
  plugins: [],
}