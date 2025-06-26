/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        poppins: ["Poppins_400Regular", "sans-serif"],
        "poppins-medium": ["Poppins_500Medium", "sans-serif"],
        "poppins-bold": ["Poppins_700Bold", "sans-serif"],
      },
    },
  },
  plugins: [],
};
