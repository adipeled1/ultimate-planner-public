/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        pastel: {
          red: "#FFADAD",
          orange: "#FFD6A5",
          yellow: "#FDFFB6",
          green: "#CAFFBF",
          cyan: "#9BF6FF",
          blue: "#A0C4FF",
          indigo: "#BDB2FF",
          pink: "#FFC6FF",
          white: "#FFFFFC",
          purple: "#D4C1EC",
          rose: "#F49AC2",
          sky: "#87CEFA"
        }
      }
    },
  },
  plugins: [],
}

