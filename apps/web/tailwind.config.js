/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0E4D44", // 深松绿
          dark: "#0A3A33",
          soft: "#E1ECEA",
        },
        ink: {
          DEFAULT: "#1B1D1C",
          soft: "#4A4D4B",
          mute: "#8A8C88",
        },
        canvas: "#EBEAE4", // 暖灰纸
        canvas2: "#E3E1DA",
        line: "#D0CEC6",
        lineStrong: "#B6B3AA",
        surface: "#E3E1DA",
      },
      fontFamily: {
        serif: ['"Newsreader"', "Georgia", '"Songti SC"', "serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", '"Sarasa Mono SC"', "monospace"],
        sans: ['"Plus Jakarta Sans"', '"PingFang SC"', "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "8px",
      },
      maxWidth: {
        market: "1180px",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
