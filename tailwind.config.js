/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2D5016',
        secondary: '#C85A3E',
        accent: '#D4AF37',
        cream: '#F5F1E8',
        'dark-brown': '#3E2723',
        sage: '#87A96B',
        'soft-red': '#D84315',
      },
      fontFamily: {
        heading: ['Playfair Display', 'serif'],
        body: ['Inter', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '12px',
      },
      boxShadow: {
        soft: '0 4px 6px -1px rgba(45, 80, 22, 0.1), 0 2px 4px -1px rgba(45, 80, 22, 0.06)',
        'soft-lg': '0 10px 15px -3px rgba(45, 80, 22, 0.1), 0 4px 6px -2px rgba(45, 80, 22, 0.05)',
      },
    },
  },
  plugins: [],
};
