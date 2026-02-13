import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    // Apple-scale typography (Inter mapped to SF Pro scale)
    fontSize: {
      'xs':   ['11px', { lineHeight: '16px', letterSpacing: '0.01em' }],
      'sm':   ['13px', { lineHeight: '18px', letterSpacing: '0em' }],
      'base': ['15px', { lineHeight: '22px', letterSpacing: '-0.01em' }],
      'lg':   ['17px', { lineHeight: '24px', letterSpacing: '-0.01em' }],
      'xl':   ['20px', { lineHeight: '28px', letterSpacing: '-0.01em' }],
      '2xl':  ['24px', { lineHeight: '30px', letterSpacing: '-0.02em' }],
      '3xl':  ['28px', { lineHeight: '34px', letterSpacing: '-0.02em' }],
      '4xl':  ['34px', { lineHeight: '40px', letterSpacing: '-0.02em' }],
      '5xl':  ['48px', { lineHeight: '52px', letterSpacing: '-0.03em' }],
    },
    // Apple-style border radius
    borderRadius: {
      'none': '0',
      'sm':   '8px',
      DEFAULT: '8px',
      'md':   '12px',
      'lg':   '16px',
      'xl':   '20px',
      '2xl':  '24px',
      'full': '9999px',
    },
    extend: {
      colors: {
        // Semantic surfaces (theme-driven)
        surface: {
          '0': 'rgb(var(--surface-0) / <alpha-value>)',
          '1': 'rgb(var(--surface-1) / <alpha-value>)',
          '2': 'rgb(var(--surface-2) / <alpha-value>)',
          '3': 'rgb(var(--surface-3) / <alpha-value>)',
          '4': 'rgb(var(--surface-4) / <alpha-value>)',
          '5': 'rgb(var(--surface-5) / <alpha-value>)',
        },
        // Semantic text labels (theme-driven)
        label: {
          'primary': 'rgb(var(--label-primary) / <alpha-value>)',
          'secondary': 'rgb(var(--label-secondary) / <alpha-value>)',
          'tertiary': 'rgb(var(--label-tertiary) / <alpha-value>)',
          'quaternary': 'rgb(var(--label-quaternary) / <alpha-value>)',
          'faint': 'rgb(var(--label-faint) / <alpha-value>)',
        },
        // Separator
        separator: 'rgb(var(--separator) / <alpha-value>)',
        // Compatibility aliases (legacy/shadcn-style tokens)
        border: 'rgb(var(--separator) / <alpha-value>)',
        background: 'rgb(var(--surface-0) / <alpha-value>)',
        foreground: 'rgb(var(--label-primary) / <alpha-value>)',
        card: 'rgb(var(--surface-1) / <alpha-value>)',
        muted: {
          DEFAULT: 'rgb(var(--surface-2) / <alpha-value>)',
          foreground: 'rgb(var(--label-tertiary) / <alpha-value>)',
        },
        // Primary: emerald
        primary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        // Accent: purple
        accent: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#581c87',
          950: '#3b0764',
        },
      },
      // 5-level elevation system (Apple-style)
      boxShadow: {
        'elevation-1': '0 1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.15)',
        'elevation-2': '0 2px 4px rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.15)',
        'elevation-3': '0 4px 8px rgba(0,0,0,0.3), 0 8px 16px rgba(0,0,0,0.15)',
        'elevation-4': '0 8px 16px rgba(0,0,0,0.3), 0 16px 32px rgba(0,0,0,0.15)',
        'elevation-5': '0 16px 32px rgba(0,0,0,0.3), 0 32px 64px rgba(0,0,0,0.15)',
        'glow-emerald': '0 0 20px rgba(16,185,129,0.25)',
        'glow-purple': '0 0 20px rgba(168,85,247,0.25)',
        'inner-shine': 'inset 0 1px 0 rgba(255,255,255,0.06)',
      },
      // Z-index layer system
      zIndex: {
        'dropdown': '30',
        'sticky': '40',
        'overlay': '50',
        'modal': '60',
        'toast': '70',
      },
      // Custom easing
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'ease-out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
