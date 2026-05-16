/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts}'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        // C2C brand orange. Exact hex from c2c_ui variables.scss.
        brand: {
          50: '#fff5e6',
          100: '#ffce9e',                  // $color-base-c2c-lighter
          200: '#ffb870',
          300: '#ffa347',
          400: '#ff9933',
          500: '#ff9933',                  // $color-base-c2c
          600: '#cc7a14',
          700: '#b26f1e',                  // $color-base-c2c-darker
          800: '#8c5717',
          900: '#6b4111',
        },
        // C2C complementary blue (links, primary buttons on c2c.org).
        c2c: {
          link: '#337ab7',                 // $color-link / $color-complementary-c2c
          'link-light': '#7699b8',
          text: '#4a4a4a',                 // $color-text
          bg: '#fbfaf6',                   // $body-background-color (warm off-white)
          green: '#4baf50',                // success
        },
      },
      fontFamily: {
        // System stack matching Bulma's default (what c2c.org actually uses).
        sans: [
          'BlinkMacSystemFont', '-apple-system', '"Segoe UI"', 'Roboto',
          'Oxygen', 'Ubuntu', 'Cantarell', '"Fira Sans"', '"Droid Sans"',
          '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif',
        ],
      },
      fontSize: {
        // c2c body is 14px. Mobile inputs stay 16px to prevent iOS auto-zoom.
        base: ['14px', '1.5'],
      },
      boxShadow: {
        // c2c card shadow from variables.scss
        card: '0 2px 3px rgba(0, 0, 0, 0.1)',
        'card-hover': '1px 3px 4px rgba(0, 0, 0, 0.1)',
        sheet: '0 -8px 32px -4px rgba(0, 0, 0, 0.25)',
      },
      borderRadius: {
        // c2c uses square corners on cards ($box-radius: 0). Keep small radius
        // only on chips/pills and inputs for mobile thumb ergonomics.
        card: '0px',
      },
      maxWidth: {
        app: '480px',
      },
      animation: {
        'fade-in': 'fade-in 0.18s ease-out',
        'slide-up': 'slide-up 0.22s cubic-bezier(0.32, 0.72, 0, 1)',
        'sheet-in': 'sheet-in 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'sheet-in': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
