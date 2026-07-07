import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17211d",
        leaf: "#1f8a5b",
        mint: "#e7f7ef",
        rice: "#fbfaf6",
        coral: "#f36f56",
        sky: "#4f9ecf"
      },
      boxShadow: {
        soft: "0 10px 30px rgba(23, 33, 29, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
