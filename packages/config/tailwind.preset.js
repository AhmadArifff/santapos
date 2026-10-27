/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        theme: {
          primary: 'var(--color-primary, #C9A84C)',
          'primary-light': 'var(--color-primary-light, #E8C96A)',
          dark: 'var(--color-dark, #0D0A06)',
          dark2: 'var(--color-dark2, #1A1409)',
          dark3: 'var(--color-dark3, #241C0E)',
          cream: 'var(--color-cream, #F5EDD8)',
          cream2: 'var(--color-cream2, #EDE0C4)',
          accent: 'var(--color-accent, #8B1A1A)',
          text: 'var(--color-text, #F5EDD8)',
          'text-muted': 'var(--color-text-muted, #9E8E6E)',
        },
        gold: {
          DEFAULT: 'var(--gold, #C9A84C)',
          light: 'var(--gold-light, #E8C96A)',
        },
        dark: {
          DEFAULT: 'var(--dark, #0D0A06)',
          2: 'var(--dark2, #1A1409)',
          3: 'var(--dark3, #241C0E)',
        },
        cream: {
          DEFAULT: 'var(--cream, #F5EDD8)',
          2: 'var(--cream2, #EDE0C4)',
        },
      },
      fontFamily: {
        body: ['var(--font-dm-sans)', 'sans-serif'],
        heading: ['var(--font-playfair)', 'serif'],
        display: ['var(--font-bebas)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
