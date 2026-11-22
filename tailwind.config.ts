import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#faf8f4',
        surface: '#ffffff',
        ink: { DEFAULT: '#15140f', soft: '#3b3932', muted: '#757065' },
        line: { DEFAULT: '#e8e3d9', strong: '#d6cfc1' },
        forest: { DEFAULT: '#1f4634', dark: '#163328', light: '#2c6349' },
        clay: '#b4612d',
        sale: '#9c2a2a',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
      },
      letterSpacing: { wide2: '0.14em', wide3: '0.26em' },
      boxShadow: {
        card: '0 1px 2px rgba(21,20,15,0.04), 0 8px 24px -12px rgba(21,20,15,0.12)',
        pop: '0 10px 40px -12px rgba(21,20,15,0.22)',
      },
      transitionTimingFunction: { silk: 'cubic-bezier(0.16,1,0.3,1)' },
      keyframes: {
        'fade-up': { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'none' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: { 'fade-up': 'fade-up .5s cubic-bezier(.16,1,.3,1) both' },
    },
  },
  plugins: [],
};
export default config;
