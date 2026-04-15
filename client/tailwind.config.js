/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0040a1',
        'primary-container': '#0056d2',
        surface: '#f8f9fa',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f3f4f5',
        'surface-container-high': '#e7e8e9',
        'surface-container-highest': '#e1e3e4',
        'on-surface': '#191c1d',
        'on-surface-variant': '#424654',
        outline: '#737785',
        'outline-variant': '#c3c6d6',
        secondary: '#48626e',
        'secondary-container': '#cbe7f5',
        tertiary: '#822800',
        'tertiary-fixed': '#ffdbcf',
        error: '#ba1a1a',
        'error-container': '#ffdad6',
      },
      fontFamily: {
        headline: ['Manrope', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'radius-card': '0.75rem',
        'radius-chip': '0.5rem',
        'radius-pill': '9999px',
      },
      boxShadow: {
        editorial: '0 10px 25px -12px rgba(0, 64, 161, 0.35)',
      },
    },
  },
  plugins: [],
}

