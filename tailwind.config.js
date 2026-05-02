/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        base:      'var(--c-base)',
        surface:   'var(--c-surface)',
        card:      'var(--c-card)',
        cardHover: 'var(--c-cardHover)',
        primary:   'var(--c-primary)',
        secondary: 'var(--c-secondary)',
        cta:       'var(--c-cta)',
        ink:       'var(--c-ink)',
        inkMuted:  'var(--c-inkMuted)',
        border:    'var(--c-border)',
      },
      fontFamily: {
        heading: ['"Barlow Condensed"', 'sans-serif'],
        mono:    ['"Space Mono"', 'monospace'],
        body:    ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
