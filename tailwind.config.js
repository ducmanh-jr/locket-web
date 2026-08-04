/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        locket: {
          yellow: "#FFC700",
          yellowHover: "#FFD633",
          yellowDark: "#E6B200",
          bg: "#0E0E10",
          surface: "#18181C",
          card: "#222228",
          border: "#2C2C34",
          textMuted: "#8E8E93",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
      },
      borderRadius: {
        "3xl": "1.75rem",
        "4xl": "2.25rem",
        "5xl": "2.75rem",
      },
      boxShadow: {
        "locket-glow": "0 0 25px -5px rgba(255, 199, 0, 0.4)",
        "card-glass": "0 8px 32px 0 rgba(0, 0, 0, 0.5)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float-emoji": "floatUp 1.2s ease-out forwards",
      },
      keyframes: {
        floatUp: {
          "0%": { opacity: "1", transform: "translateY(0) scale(0.8)" },
          "50%": { opacity: "1", transform: "translateY(-40px) scale(1.3)" },
          "100%": { opacity: "0", transform: "translateY(-90px) scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
