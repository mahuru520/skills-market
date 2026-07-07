/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#FF5C28",
          dark: "#E0451A",
        },
        ink: {
          DEFAULT: "#111111",
          soft: "#3A3A3A",
          mute: "#8A8A8A",
        },
        canvas: "#FAF8F3",
        line: "#ECE9E2",
        surface: "#FFFFFF",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"PingFang SC"', "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
        xl2: "20px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(17,17,17,0.04), 0 8px 24px rgba(17,17,17,0.06)",
        cardHover: "0 2px 6px rgba(17,17,17,0.06), 0 16px 40px rgba(17,17,17,0.10)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
