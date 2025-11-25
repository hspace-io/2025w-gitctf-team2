/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        night: {
          50: '#1c2134',
          100: '#181c2c',
          200: '#141826',
          300: '#101322',
          400: '#0c0f1a',
          500: '#090b14',
          900: '#05060b',
        },
        neon: {
          blue: '#5dd9f5',
          purple: '#7c5dfa',
          pink: '#ff6cab',
          green: '#4dd4ac',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'Pretendard',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          '"SF Mono"',
          'Menlo',
          'Monaco',
          '"Cascadia Code"',
          '"Roboto Mono"',
          'Consolas',
          '"Courier New"',
          'monospace',
        ],
      },
      boxShadow: {
        'glass': '0 20px 40px rgba(3,7,18,0.65)',
        'neon': '0 0 40px rgba(124,93,250,0.45)',
        'soft': '0 12px 28px rgba(0,0,0,0.45)',
      },
      animation: {
        'fade-up': 'fadeUp 0.45s ease both',
        'scale-in': 'scaleIn 0.35s ease both',
        'pulse-neon': 'glowPulse 2.5s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        glowPulse: {
          '0%,100%': { boxShadow: '0 0 20px rgba(124,93,250,0.25)' },
          '50%': { boxShadow: '0 0 35px rgba(92,217,245,0.45)' },
        },
      },
      backdropBlur: {
        'lg': '16px',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}

