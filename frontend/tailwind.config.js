/** @type {import('tailwindcss').Config} */
module.exports = {
  // Preflight tắt để không reset/đè lên giao diện antd ở các trang admin/reception.
  // Reset cơ bản đã có sẵn trong index.css.
  corePlugins: {
    preflight: false,
  },
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Bám đúng design token trong index.css
        gold: {
          DEFAULT: '#A18348',
          hover: '#8B6F3F',
          active: '#7D6338',
          light: '#C9A45C',
          soft: '#E8D9B5',
        },
        charcoal: '#222222',
        ink: '#3E3E3F',
        'off-white': '#F8F9FF',
        cream: '#FBF8F2',
        'soft-green': '#CEF093',
        'warm-gold': '#FFD074',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body: ['Raleway', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        nav: ['"Gothic A1"', 'Arial', 'sans-serif'],
      },
      maxWidth: {
        container: '1280px',
      },
      boxShadow: {
        subtle: '0px 2px 4px rgba(0, 0, 0, 0.05)',
        raised: '0px 4px 12px rgba(0, 0, 0, 0.08)',
        elevated: '0px 8px 24px rgba(0, 0, 0, 0.12)',
        modal: '0px 16px 32px rgba(0, 0, 0, 0.15)',
      },
      letterSpacing: {
        luxe: '0.25em',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'ken-burns': {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.12)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.8s ease forwards',
        'fade-in': 'fade-in 1s ease forwards',
        'ken-burns': 'ken-burns 18s ease-out forwards',
      },
    },
  },
  plugins: [],
}
