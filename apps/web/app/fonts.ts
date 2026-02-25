/**
 * Apple Design System — Typography
 * Uses system font stack with SF Pro as priority
 */

import { Inter } from 'next/font/google'

// Fallback font that closely matches SF Pro metrics
export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

/**
 * Font Stack Strategy:
 * 1. SF Pro Display (macOS/iOS system font)
 * 2. SF Pro Text (macOS/iOS system font)
 * 3. -apple-system (system font on Apple devices)
 * 4. Inter (Google Font fallback with similar metrics)
 * 5. Segoe UI (Windows)
 * 6. Roboto (Android)
 */

export const fontStack = {
  display: [
    'SF Pro Display',
    '-apple-system',
    'BlinkMacSystemFont',
    'var(--font-inter)',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
  ].join(', '),
  
  text: [
    'SF Pro Text',
    '-apple-system',
    'BlinkMacSystemFont',
    'var(--font-inter)',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
  ].join(', '),
  
  mono: [
    'SF Mono',
    'SFMono-Regular',
    'ui-monospace',
    'Menlo',
    'Monaco',
    'Consolas',
    'monospace',
  ].join(', '),
}

/**
 * Apple Typography Scale (Dynamic Type)
 * Matches iOS/macOS dynamic type sizes
 */
export const typography = {
  // Large titles (hero sections)
  'large-title': {
    size: '34px',
    lineHeight: '41px',
    letterSpacing: '-0.01em',
    weight: 700,
  },
  'title-1': {
    size: '28px',
    lineHeight: '34px',
    letterSpacing: '-0.02em',
    weight: 700,
  },
  'title-2': {
    size: '22px',
    lineHeight: '28px',
    letterSpacing: '-0.02em',
    weight: 700,
  },
  'title-3': {
    size: '20px',
    lineHeight: '25px',
    letterSpacing: '-0.02em',
    weight: 600,
  },
  // Headlines
  headline: {
    size: '17px',
    lineHeight: '22px',
    letterSpacing: '-0.01em',
    weight: 600,
  },
  // Body
  'body-large': {
    size: '17px',
    lineHeight: '22px',
    letterSpacing: '-0.01em',
    weight: 400,
  },
  body: {
    size: '16px',
    lineHeight: '21px',
    letterSpacing: '-0.01em',
    weight: 400,
  },
  'body-small': {
    size: '15px',
    lineHeight: '20px',
    letterSpacing: '-0.01em',
    weight: 400,
  },
  // Callout & subhead
  callout: {
    size: '16px',
    lineHeight: '21px',
    letterSpacing: '-0.01em',
    weight: 400,
  },
  subheadline: {
    size: '15px',
    lineHeight: '20px',
    letterSpacing: '-0.01em',
    weight: 400,
  },
  // Footnote & caption
  footnote: {
    size: '13px',
    lineHeight: '18px',
    letterSpacing: '-0.01em',
    weight: 400,
  },
  caption: {
    size: '12px',
    lineHeight: '16px',
    letterSpacing: '0em',
    weight: 400,
  },
  'caption-2': {
    size: '11px',
    lineHeight: '13px',
    letterSpacing: '0.01em',
    weight: 400,
  },
}

/**
 * Apple Color Tokens
 * Matches iOS/macOS system colors
 */
export const appleColors = {
  // iOS System Colors
  red: { light: '#FF3B30', dark: '#FF453A' },
  orange: { light: '#FF9500', dark: '#FF9F0A' },
  yellow: { light: '#FFCC00', dark: '#FFD60A' },
  green: { light: '#34C759', dark: '#30D158' },
  mint: { light: '#00C7BE', dark: '#63E6E2' },
  teal: { light: '#30B0C7', dark: '#40C8E0' },
  cyan: { light: '#32ADE6', dark: '#64D2FF' },
  blue: { light: '#007AFF', dark: '#0A84FF' },
  indigo: { light: '#5856D6', dark: '#5E5CE6' },
  purple: { light: '#AF52DE', dark: '#BF5AF2' },
  pink: { light: '#FF2D55', dark: '#FF375F' },
  brown: { light: '#A2845E', dark: '#AC8E68' },
  // Grays
  gray: { light: '#8E8E93', dark: '#8E8E93' },
  'gray-2': { light: '#AEAEB2', dark: '#636366' },
  'gray-3': { light: '#C7C7CC', dark: '#48484A' },
  'gray-4': { light: '#D1D1D6', dark: '#3A3A3C' },
  'gray-5': { light: '#E5E5EA', dark: '#2C2C2E' },
  'gray-6': { light: '#F2F2F7', dark: '#1C1C1E' },
  // Emerald (Darwin brand)
  emerald: { light: '#10B981', dark: '#34D399' },
}
