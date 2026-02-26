/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      colors: {
        roseGold: {
          DEFAULT: '#b76e79',
          light: '#e8a0a8',
          dark: '#8b4f5a',
        },
        indigo: {
          electric: '#6366f1',
          glow: '#818cf8',
        },
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-rose': 'pulseRose 2s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'fadeInUp': 'fadeInUp 0.6s ease-out forwards',
        'fadeIn': 'fadeIn 0.4s ease-out forwards',
        'slideUp': 'slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'slideDown': 'slideDown 0.4s ease-out forwards',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-subtle': 'bounceSubtle 1.5s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'thinking-dot': 'thinkingDot 1.4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        pulseRose: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(183,110,121,0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(183,110,121,0.8), 0 0 80px rgba(183,110,121,0.3)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        thinkingDot: {
          '0%, 80%, 100%': { transform: 'scale(0)', opacity: '0' },
          '40%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
