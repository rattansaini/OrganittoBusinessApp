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
        ground: '#F4F3EE',
        panel: '#FFFFFF',
        'panel-2': '#FBFAF7',
        edge: '#E6E4DC',
        'edge-soft': '#EFEDE6',
        ink: '#191C16',
        'ink-2': '#646B5E',
        'ink-3': '#969C8D',
        forest: '#1F3F10',
        leaf: '#4C7A28',
        gold: '#C0982F',
        clay: '#B44A2B',
      },
      fontFamily: {
        heading: ['Fraunces', 'Georgia', 'serif'],
        body: ['Manrope', 'system-ui', 'sans-serif'],
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '12px',
      },
      boxShadow: {
        soft: '0 1px 2px hsl(95 30% 18% / .05), 0 2px 6px hsl(95 30% 18% / .04)',
        'soft-lg': '0 1px 2px hsl(95 30% 18% / .05), 0 4px 10px hsl(95 30% 18% / .06), 0 10px 24px hsl(95 30% 18% / .05)',
        'soft-xl': '0 2px 4px hsl(95 30% 18% / .05), 0 8px 18px hsl(95 30% 18% / .07), 0 18px 40px hsl(95 30% 18% / .06)',
        e1: '0 1px 2px hsl(95 30% 18% / .05), 0 2px 6px hsl(95 30% 18% / .04)',
        e2: '0 1px 2px hsl(95 30% 18% / .05), 0 4px 10px hsl(95 30% 18% / .06), 0 10px 24px hsl(95 30% 18% / .05)',
        e3: '0 2px 4px hsl(95 30% 18% / .05), 0 8px 18px hsl(95 30% 18% / .07), 0 18px 40px hsl(95 30% 18% / .06)',
      },
      fontSize: {
        label: ['10.5px', { lineHeight: '1.4', letterSpacing: '0.12em' }],
        'body-sm': ['13px', { lineHeight: '1.5', letterSpacing: '0' }],
        body: ['14px', { lineHeight: '1.55', letterSpacing: '0' }],
        title: ['15px', { lineHeight: '1.3', letterSpacing: '-0.012em' }],
        fig: ['27px', { lineHeight: '1.0', letterSpacing: '-0.03em' }],
        h1: ['26px', { lineHeight: '1.1', letterSpacing: '-0.028em' }],
      },
      transitionTimingFunction: {
        brisk: 'cubic-bezier(.2,.8,.2,1)',
      },
    },
  },
  plugins: [],
};
