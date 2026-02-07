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
        // Surface hierarchy (Apple dark mode)
        surface: {
          '0': '#0a0a0c',
          '1': '#111114',
          '2': '#1c1c1f',
          '3': '#252528',
          '4': '#2e2e32',
          '5': '#3a3a3f',
        },
        // Text hierarchy (Apple opacity levels)
        label: {
          'primary':    'rgba(255,255,255,0.98)',
          'secondary':  'rgba(255,255,255,0.72)',
          'tertiary':   'rgba(255,255,255,0.56)',
          'quaternary': 'rgba(255,255,255,0.40)',
          'faint':      'rgba(255,255,255,0.24)',
        },
        // Separator
        separator: 'rgba(255,255,255,0.08)',
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
