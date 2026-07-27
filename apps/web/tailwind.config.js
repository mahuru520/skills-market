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
          mute: "#6E716C", // 加深,对 #F4F2EA 达 AA(4.9:1)
        },
        canvas: "#F4F3EE", // 暖白(页面底)
        canvas2: "#FFFFFF", // 纯白(卡片/容器底)
        line: "#E2E0D8", // 调淡
        lineStrong: "#C9C6BC", // 同步调淡
        surface: "#FFFFFF",
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
