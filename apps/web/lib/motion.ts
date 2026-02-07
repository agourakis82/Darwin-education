/**
 * Darwin Education — Motion Design Tokens
 *
 * Spring physics presets for Apple-native animations.
 * Use with Framer Motion's `transition` prop.
 */

/** Spring animation presets */
export const spring = {
  /** Quick, responsive — buttons, toggles, micro-interactions */
  snappy: { type: 'spring' as const, stiffness: 300, damping: 30 },
  /** Natural feel — cards entering, page transitions */
  gentle: { type: 'spring' as const, stiffness: 120, damping: 14 },
  /** Playful — notifications, success states */
  bouncy: { type: 'spring' as const, stiffness: 200, damping: 15, mass: 0.8 },
  /** Slow, fluid — background elements, parallax */
  smooth: { type: 'spring' as const, stiffness: 80, damping: 20 },
}

/** Duration presets (seconds) for non-spring animations */
export const duration = {
  instant: 0.1,
  fast: 0.15,
  base: 0.2,
  slow: 0.3,
  slower: 0.5,
}

/** Easing presets for CSS transitions */
export const easing = {
  easeOutExpo: [0.16, 1, 0.3, 1] as const,
  spring: [0.34, 1.56, 0.64, 1] as const,
}
