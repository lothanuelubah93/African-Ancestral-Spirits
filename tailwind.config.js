/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        fadeMove: {
          '0%, 100%': { opacity: '0.2', transform: 'translateY(0px) scale(1)' },
          '50%': { opacity: '0.5', transform: 'translateY(-20px) scale(1.05)' },
        },
        fadeMoveSlow: {
          '0%, 100%': { opacity: '0.15', transform: 'translateY(0px) scale(1)' },
          '50%': { opacity: '0.4', transform: 'translateY(15px) scale(1.03)' },
        },
      },
      animation: {
        fadeMove: 'fadeMove 6s ease-in-out infinite',
        fadeMoveSlow: 'fadeMoveSlow 8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
