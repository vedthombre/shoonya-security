/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0f172a", // Slate-900
        foreground: "#f8fafc", // Slate-50
        card: "#1e293b",       // Slate-800
        "card-foreground": "#f8fafc",
        popover: "#0f172a",
        "popover-foreground": "#f8fafc",
        primary: "#3b82f6",    // Blue-500
        "primary-foreground": "#ffffff",
        secondary: "#334155",  // Slate-700
        "secondary-foreground": "#f8fafc",
        muted: "#334155",
        "muted-foreground": "#94a3b8", // Slate-400
        accent: "#0ea5e9",     // Cyan-500
        "accent-foreground": "#f8fafc",
        destructive: "#ef4444",
        "destructive-foreground": "#f8fafc",
        border: "#334155",
        input: "#334155",
        ring: "#3b82f6",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
