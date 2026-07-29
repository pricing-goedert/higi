/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: {
        // Ported 1:1 from docs/design-frame/styles.css's CSS custom properties.
        primary: '#143C52',
        bg: '#F8FAFC',
        card: '#FFFFFF',
        divider: '#E7ECF1',
        ink: '#1E293B', // --text
        muted: '#64748B', // --text2
        faint: '#94A3B8', // --text3
        'icon-soft': '#E9F0F5', // --icon-circle
        danger: '#EF4444', // --red (reserved for validation states)
        // Home screen's 3 menu sections — hardcoded in design-frame's
        // index.html, not the (unused) --green/--orange root vars.
        comercial: '#143C52',
        'comercial-soft': '#E9F0F5',
        produtos: '#15803D',
        'produtos-soft': '#E5F6EC',
        conteudo: '#B45309',
        'conteudo-soft': '#FDF1DF',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
      borderRadius: {
        hero: '28px',
        card: '20px',
        search: '18px',
        btn: '16px',
        field: '14px',
        chip: '10px',
      },
      boxShadow: {
        card: '0 6px 16px rgba(15,23,42,.06)',
        search: '0 8px 20px rgba(15,23,42,.1)',
        shell: '0 0 40px rgba(15,23,42,.08)',
        'focus-ring': '0 0 0 4px rgba(20,60,82,.08)',
      },
      maxWidth: {
        shell: '460px',
      },
    },
  },
  plugins: [],
}
