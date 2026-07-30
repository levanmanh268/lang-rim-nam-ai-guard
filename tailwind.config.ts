import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cyber: {
          ink: "#05060d",
          panel: "#0a0d18",
          orange: "#ff7a18",
          cyan: "#14f1ff",
          violet: "#8b5cf6",
          green: "#29f19c",
          danger: "#ff3864"
        }
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"]
      },
      boxShadow: {
        neon: "0 0 36px rgba(20,241,255,.18), 0 0 74px rgba(255,122,24,.12)",
        orange: "0 0 30px rgba(255,122,24,.3)",
        violet: "0 0 34px rgba(139,92,246,.24)"
      },
      backgroundImage: {
        "grid-cyber":
          "linear-gradient(rgba(255,255,255,.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.055) 1px, transparent 1px)"
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateY(-120%)" },
          "100%": { transform: "translateY(120%)" }
        },
        pulseGlow: {
          "0%,100%": { opacity: ".45", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.04)" }
        },
        floatNode: {
          "0%,100%": { transform: "translate3d(0,0,0)" },
          "50%": { transform: "translate3d(8px,-14px,0)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-220% 0" },
          "100%": { backgroundPosition: "220% 0" }
        },
        skeleton: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" }
        }
      },
      animation: {
        scan: "scan 4.8s linear infinite",
        pulseGlow: "pulseGlow 3.2s ease-in-out infinite",
        floatNode: "floatNode 6s ease-in-out infinite",
        shimmer: "shimmer 4.8s linear infinite",
        skeleton: "skeleton 1.6s linear infinite"
      }
    }
  },
  plugins: []
};

export default config;
