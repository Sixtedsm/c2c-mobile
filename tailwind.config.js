/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts}'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        // Brand orange anchored on the C2C identity. Used for primary actions
        // and the active state of nav/tab/filter controls.
        brand: {
          50: '#fff5e6',
          100: '#ffe6c2',
          200: '#ffce85',
          300: '#ffb547',
          400: '#ffa31f',
          500: '#ff9933',
          600: '#e6791f',
          700: '#bf5a17',
          800: '#994513',
          900: '#7a370f',
        },
        // Per-activity hues. Reused everywhere an activity is rendered (pills,
        // detail icons, list dividers). Keeps the app legible without
        // overwhelming the orange brand.
        act: {
          rock: '#c2410c',      // escalade — terracotta
          mountain: '#1d4ed8',  // alpinisme — bleu glacier
          ice: '#0e7490',       // cascade — bleu cyan
          ski: '#7c3aed',       // ski — violet
          hiking: '#15803d',    // rando — vert forêt
          snowshoe: '#0891b2',  // raquettes — bleu pâle
          ferrata: '#a16207',   // via ferrata — bronze
          paragliding: '#db2777',// parapente — rose
          mtb: '#65a30d',       // VTT — vert olive
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 16px -4px rgba(0, 0, 0, 0.08), 0 1px 3px -1px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 8px 24px -8px rgba(0, 0, 0, 0.15)',
        sheet: '0 -8px 32px -4px rgba(0, 0, 0, 0.25)',
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
