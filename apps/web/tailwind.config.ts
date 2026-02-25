import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    // Apple Design System — Typography Scale
    fontSize: {
      '2xs': ['11px', { lineHeight: '13px', letterSpacing: '0.01em' }],
      'xs': ['12px', { lineHeight: '16px', letterSpacing: '0em' }],
      'sm': ['13px', { lineHeight: '18px', letterSpacing: '-0.01em' }],
      'base': ['15px', { lineHeight: '20px', letterSpacing: '-0.01em' }],
      'lg': ['17px', { lineHeight: '22px', letterSpacing: '-0.01em' }],
      'xl': ['20px', { lineHeight: '25px', letterSpacing: '-0.02em' }],
      '2xl': ['22px', { lineHeight: '28px', letterSpacing: '-0.02em' }],
      '3xl': ['28px', { lineHeight: '34px', letterSpacing: '-0.02em' }],
      '4xl': ['34px', { lineHeight: '41px', letterSpacing: '-0.01em' }],
      '5xl': ['48px', { lineHeight: '52px', letterSpacing: '-0.03em' }],
    },
    
    // Apple Design System — Border Radius
    borderRadius: {
      'none': '0',
      'xs': '4px',
      'sm': '8px',
      DEFAULT: '9px',
      'md': '10px',
      'lg': '12px',
      'xl': '16px',
      '2xl': '20px',
      '3xl': '24px',
      'full': '9999px',
    },
    
    extend: {
      // Apple System Colors
      colors: {
        // System Backgrounds
        'system-background': 'rgb(var(--system-background) / <alpha-value>)',
        'secondary-system-background': 'rgb(var(--secondary-system-background) / <alpha-value>)',
        'tertiary-system-background': 'rgb(var(--tertiary-system-background) / <alpha-value>)',
        'system-grouped-background': 'rgb(var(--system-grouped-background) / <alpha-value>)',
        
        // System Labels
        'label': 'rgb(var(--label) / <alpha-value>)',
        'secondary-label': 'rgb(var(--secondary-label) / <alpha-value>)',
        'tertiary-label': 'rgb(var(--tertiary-label) / <alpha-value>)',
        'quaternary-label': 'rgb(var(--quaternary-label) / <alpha-value>)',
        'placeholder-text': 'rgb(var(--placeholder-text) / <alpha-value>)',
        
        // System Separators
        'separator': 'rgb(var(--separator) / <alpha-value>)',
        'opaque-separator': 'rgb(var(--opaque-separator) / <alpha-value>)',
        
        // System Fills
        'system-fill': 'rgb(var(--system-fill) / <alpha-value>)',
        'secondary-system-fill': 'rgb(var(--secondary-system-fill) / <alpha-value>)',
        'tertiary-system-fill': 'rgb(var(--tertiary-system-fill) / <alpha-value>)',
        'quaternary-system-fill': 'rgb(var(--quaternary-system-fill) / <alpha-value>)',
        
        // System Grays
        'system-gray': 'rgb(var(--system-gray) / <alpha-value>)',
        'system-gray-2': 'rgb(var(--system-gray-2) / <alpha-value>)',
        'system-gray-3': 'rgb(var(--system-gray-3) / <alpha-value>)',
        'system-gray-4': 'rgb(var(--system-gray-4) / <alpha-value>)',
        'system-gray-5': 'rgb(var(--system-gray-5) / <alpha-value>)',
        'system-gray-6': 'rgb(var(--system-gray-6) / <alpha-value>)',
        
        // Apple System Colors
        'system-red': 'rgb(var(--system-red) / <alpha-value>)',
        'system-orange': 'rgb(var(--system-orange) / <alpha-value>)',
        'system-yellow': 'rgb(var(--system-yellow) / <alpha-value>)',
        'system-green': 'rgb(var(--system-green) / <alpha-value>)',
        'system-mint': 'rgb(var(--system-mint) / <alpha-value>)',
        'system-teal': 'rgb(var(--system-teal) / <alpha-value>)',
        'system-cyan': 'rgb(var(--system-cyan) / <alpha-value>)',
        'system-blue': 'rgb(var(--system-blue) / <alpha-value>)',
        'system-indigo': 'rgb(var(--system-indigo) / <alpha-value>)',
        'system-purple': 'rgb(var(--system-purple) / <alpha-value>)',
        'system-pink': 'rgb(var(--system-pink) / <alpha-value>)',
        'system-brown': 'rgb(var(--system-brown) / <alpha-value>)',
        
        // Darwin Brand Colors
        'darwin': {
          'emerald': 'rgb(var(--darwin-emerald) / <alpha-value>)',
          'emerald-light': 'rgb(var(--darwin-emerald-light) / <alpha-value>)',
          'emerald-dark': 'rgb(var(--darwin-emerald-dark) / <alpha-value>)',
        },
        
        // Legacy aliases for compatibility
        'surface': {
          '0': 'rgb(var(--system-background) / <alpha-value>)',
          '1': 'rgb(var(--secondary-system-background) / <alpha-value>)',
          '2': 'rgb(var(--tertiary-system-background) / <alpha-value>)',
          '3': 'rgb(var(--system-gray-6) / <alpha-value>)',
          '4': 'rgb(var(--system-gray-5) / <alpha-value>)',
          '5': 'rgb(var(--system-gray-4) / <alpha-value>)',
        },
        
        'primary': {
          DEFAULT: 'rgb(var(--system-blue) / <alpha-value>)',
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        
        'accent': {
          DEFAULT: 'rgb(var(--system-purple) / <alpha-value>)',
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
        },
      },
      
      // Apple Design System — Shadows (Depth)
      boxShadow: {
        'depth-1': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'depth-2': '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
        'depth-3': '0 8px 32px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.06)',
        'depth-4': '0 16px 48px rgba(0, 0, 0, 0.16), 0 8px 16px rgba(0, 0, 0, 0.08)',
        'depth-5': '0 32px 64px rgba(0, 0, 0, 0.2), 0 16px 32px rgba(0, 0, 0, 0.1)',
        
        // iOS-style component shadows
        'ios-button': '0 1px 3px rgba(0, 0, 0, 0.12)',
        'ios-card': '0 1px 2px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.04)',
        'ios-modal': '0 22px 70px 4px rgba(0, 0, 0, 0.28), 0 8px 20px rgba(0, 0, 0, 0.15)',
        
        // Glass material inner shine
        'inner-shine': 'inset 0 0.5px 0 rgba(255, 255, 255, 0.08)',
      },
      
      // Z-index layer system (Apple-style)
      zIndex: {
        'background': '-1',
        'default': '0',
        'dropdown': '100',
        'sticky': '200',
        'overlay': '300',
        'modal': '400',
        'popover': '500',
        'toast': '600',
        'tooltip': '700',
      },
      
      // Apple Design System — Transitions
      transitionTimingFunction: {
        'ios': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'ios-spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'apple-ease': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      
      // Animation durations (Apple-style)
      transitionDuration: {
        'ios-fast': '150ms',
        'ios-normal': '200ms',
        'ios-slow': '300ms',
      },
      
      // Backdrop blur for materials
      backdropBlur: {
        'material-ultra-thin': '20px',
        'material-thin': '40px',
        'material-regular': '60px',
        'material-thick': '80px',
        'material-chrome': '120px',
      },
      
      // Font families
      fontFamily: {
        'display': ['SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'text': ['SF Pro Text', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'mono': ['SF Mono', 'SFMono-Regular', 'ui-monospace', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
