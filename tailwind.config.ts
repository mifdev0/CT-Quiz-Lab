import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        leaf: "#58CC02",
        leafDark: "#46A302",
        sky: "#1CB0F6",
        honey: "#FFC800",
        coral: "#FF6B6B",
        ink: "#243042",
        paper: "#F7F9FC"
      },
      boxShadow: {
        lift: "0 6px 0 rgba(36, 48, 66, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
