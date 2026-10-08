import type { Config } from 'tailwindcss';

/**
 * Tokens extraídos de design/Componentes.dc.html (e das telas).
 * Inter · teal #0F766E · neutros cinza-azulados · raio 8–14 px ·
 * alvo mínimo 44 px (desktop) e 48 px (tablet) · foco: anel teal de 3 px.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'monospace'],
      },
      colors: {
        brand: {
          DEFAULT: '#0F766E',
          dark: '#0B5B55',
          soft: '#E6F4F2',
          tint: '#F3FAF9',
          ring: '#CCE9E5',
          border: '#99D5CE',
          mid: '#5FD0C3',
        },
        ink: {
          DEFAULT: '#14232E',
          700: '#3B4F5D',
          600: '#4A5D6B',
          500: '#5B6E7C',
          400: '#8A9BA8',
          900: '#1F2A33',
        },
        line: {
          DEFAULT: '#E1E8ED',
          strong: '#C9D4DC',
          soft: '#D5DEE4',
          faint: '#F2F5F7',
        },
        surface: {
          bg: '#F5F8FA',
          subtle: '#F8FAFB',
          muted: '#EEF2F5',
          hover: '#F2F5F7',
          chip: '#F0F3F5',
        },
        danger: { DEFAULT: '#B42318', strong: '#D92D20', bg: '#FEF3F2', border: '#FECDCA', text: '#7A271A' },
        warn: { DEFAULT: '#B54708', bg: '#FFFAEB', border: '#FEDF89', text: '#93370D' },
        ok: { DEFAULT: '#067647', bg: '#ECFDF3', border: '#ABEFC6', text: '#05603A' },
        info: { DEFAULT: '#175CD3', bg: '#EFF8FF', border: '#B2DDFF', text: '#1849A9' },
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '8px',
        lg: '10px',
        xl: '12px',
        '2xl': '14px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,40,56,.05)',
        focus: '0 0 0 3px #99D5CE',
        field: '0 0 0 4px #CCE9E5',
      },
    },
  },
  plugins: [],
};

export default config;
