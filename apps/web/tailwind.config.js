/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#007AFF",
          dark: "#0052D9",
        },
        ink: {
          DEFAULT: "#1c1c1e",
          mute: "#8a8a8e",
        },
        canvas: "#f5f5f5",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"PingFang SC"', "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
      },
      boxShadow: {
        card: "0 4px 16px #0000001a",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
