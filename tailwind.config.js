/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './entrypoints/**/*.{html,js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        palette: {
          bg: 'var(--qb-bg)',
          input: 'var(--qb-input)',
          border: 'var(--qb-border)',
          text: 'var(--qb-text)',
          muted: 'var(--qb-muted)',
          accent: 'var(--qb-accent)',
          hover: 'var(--qb-hover)',
          selected: 'var(--qb-selected)',
        },
      },
      animation: {
        'fade-in': 'fadeIn 150ms ease-out',
        'slide-down': 'slideDown 150ms ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
