/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#007aff", // iOS systemBlue
          dark: "#0071e3", // 苹果官网蓝(hover)
          soft: "rgba(0, 122, 255, 0.08)", // 蓝 8%
        },
        ink: {
          DEFAULT: "#000000f0", // focus 档
          soft: "#000000b8", // secondary 档
          mute: "#8e8e93", // iOS systemGray
        },
        canvas: "#fff", // 纯白页面底
        canvas2: "#ffffffb8", // 72% 白(玻璃卡片底)
        line: "#3c3c4321", // 13% 深灰发丝线
        lineStrong: "#3c3c4342",
        surface: "#ffffffeb", // 92% 白
      },
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          '"PingFang SC"',
          '"HarmonyOS Sans SC"',
          '"Microsoft YaHei"',
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
        heading: [
          '"Outfit"',
          '"PingFang SC"',
          '"HarmonyOS Sans SC"',
          '"Source Han Sans SC"',
          '"Noto Sans SC"',
          '"Microsoft YaHei"',
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
        mono: ['"JetBrains Mono"', '"SF Mono"', "ui-monospace", "monospace"],
      },
      borderRadius: {
        card: "20px", // 玻璃卡片
        pill: "980px", // 胶囊
      },
      maxWidth: {
        market: "1180px",
      },
      boxShadow: {
        glass: "0 8px 32px #00000014, 0 1px 2px #0000000a",
        "glass-hover": "0 16px 48px #0000001f, 0 2px 4px #0000000f",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
