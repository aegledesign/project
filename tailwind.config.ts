import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { ink: '#111827', ocean: '#115E59', clay: '#C2410C', cream: '#FFF7ED' },
      boxShadow: { soft: '0 18px 60px rgba(15,23,42,.12)' }
    }
  },
  plugins: []
};
export default config;
