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
          gold1: "#FFD700",
          gold2: "#FFA500",
          gold3: "#FFAA00",
          goldDark: "#CC8800",
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
        "gold-glow": "0 0 20px rgba(255, 215, 0, 0.6), 0 0 40px rgba(255, 165, 0, 0.3)",
        "gold-glow-lg": "0 0 30px rgba(255, 215, 0, 0.7), 0 0 60px rgba(255, 165, 0, 0.4)",
        "gold-ring": "0 0 0 3px rgba(255, 215, 0, 0.8), 0 0 15px rgba(255, 165, 0, 0.5)",
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%)",
        "gold-gradient-h": "linear-gradient(90deg, #FFD700 0%, #FFAA00 50%, #FFA500 100%)",
        "gold-shimmer": "linear-gradient(90deg, transparent 0%, rgba(255,215,0,0.4) 50%, transparent 100%)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float-emoji": "floatUp 1.2s ease-out forwards",
        "gold-pulse": "goldPulse 2s ease-in-out infinite",
        "gold-shimmer": "goldShimmer 2.5s ease-in-out infinite",
        "gold-spin-slow": "spin 3s linear infinite",
        "gold-ring-pulse": "goldRingPulse 2s ease-in-out infinite",
      },
      keyframes: {
        floatUp: {
          "0%": { opacity: "1", transform: "translateY(0) scale(0.8)" },
          "50%": { opacity: "1", transform: "translateY(-40px) scale(1.3)" },
          "100%": { opacity: "0", transform: "translateY(-90px) scale(1)" },
        },
        goldPulse: {
          "0%, 100%": { boxShadow: "0 0 15px rgba(255,215,0,0.4), 0 0 30px rgba(255,165,0,0.2)" },
          "50%": { boxShadow: "0 0 25px rgba(255,215,0,0.8), 0 0 50px rgba(255,165,0,0.5)" },
        },
        goldShimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        goldRingPulse: {
          "0%, 100%": { opacity: "0.7", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.04)" },
        },
      },
    },
  },
  plugins: [],
};
