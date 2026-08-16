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
        bloom: {
          cream: "#FFF8F0",
          sage: "#A8C5A0",
          lavender: "#C4B1D4",
          sky: "#B8D8E8",
          peach: "#FFDAB9",
          yellow: "#F5E6A3",
          rose: "#F4A7BB",
          mint: "#B5E8D5",
          coral: "#FF8A80",
          forest: "#5B8C5A",
          deep: "#2D4A3E",
          night: "#1A1A2E",
          sunset: "#FF6B6B",
          dawn: "#FFE8D6",
          dusk: "#9B8EC4",
          spring: "#C8E6C9",
          autumn: "#FFCC80",
          ocean: "#80DEEA",
          berry: "#CE93D8",
          honey: "#FFE082",
          moss: "#4CAF50",
          cloud: "#F5F5F5",
        },
      },
      fontFamily: {
        sans: ["var(--font-nunito)", "system-ui", "sans-serif"],
        display: ["var(--font-outfit)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
        "6xl": "3rem",
      },
      boxShadow: {
        bloom: "0 4px 20px rgba(168, 197, 160, 0.15)",
        "bloom-lg": "0 8px 40px rgba(168, 197, 160, 0.2)",
        "bloom-xl": "0 16px 60px rgba(168, 197, 160, 0.25)",
        glass: "0 8px 32px rgba(0, 0, 0, 0.06)",
        soft: "0 2px 12px rgba(0, 0, 0, 0.04)",
        "soft-lg": "0 4px 24px rgba(0, 0, 0, 0.06)",
        inner: "inset 0 2px 8px rgba(0, 0, 0, 0.04)",
        glow: "0 0 24px rgba(168, 197, 160, 0.4)",
        "glow-rose": "0 0 24px rgba(244, 167, 187, 0.3)",
        "glow-lavender": "0 0 24px rgba(196, 177, 212, 0.3)",
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "float-slow": "float-slow 8s ease-in-out infinite",
        "float-delayed": "float 6s ease-in-out 2s infinite",
        "sway": "sway 4s ease-in-out infinite",
        "pulse-soft": "pulse-glow 3s ease-in-out infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        "breathe": "breathe 4s ease-in-out infinite",
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "gradient": "gradient-shift 6s ease infinite",
        "sparkle": "sparkle 2s ease-in-out infinite",
        "ripple": "ripple 1.5s ease-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        sway: {
          "0%, 100%": { transform: "rotate(-2deg)" },
          "50%": { transform: "rotate(2deg)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(168, 197, 160, 0.4)" },
          "50%": { boxShadow: "0 0 20px 8px rgba(168, 197, 160, 0.2)" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.02)" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        sparkle: {
          "0%, 100%": { opacity: "0", transform: "scale(0)" },
          "50%": { opacity: "1", transform: "scale(1)" },
        },
        ripple: {
          "0%": { transform: "scale(0.8)", opacity: "1" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
      },
      backgroundImage: {
        "gradient-bloom": "linear-gradient(135deg, #B5E8D5 0%, #A8C5A0 25%, #C4B1D4 50%, #F4A7BB 75%, #FFDAB9 100%)",
        "gradient-sunrise": "linear-gradient(135deg, #FFE8D6 0%, #FFDAB9 30%, #F4A7BB 70%, #C4B1D4 100%)",
        "gradient-forest": "linear-gradient(135deg, #B5E8D5 0%, #A8C5A0 50%, #5B8C5A 100%)",
        "gradient-warmth": "linear-gradient(135deg, #FFF8F0 0%, #FFDAB9 50%, #F5E6A3 100%)",
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "112": "28rem",
        "128": "32rem",
      },
    },
  },
  plugins: [],
};
