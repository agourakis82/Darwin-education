import confetti from 'canvas-confetti'

function randomInRange(min: number, max: number) {
  return Math.random() * (max - min) + min
}

/**
 * Perfect score celebration — golden confetti shower
 */
function celebratePerfect() {
  const count = 200
  const defaults = { origin: { y: 0.7 }, zIndex: 9999 }
  const colors = ['#FFD700', '#FFA500', '#FF8C00']

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) })
  }

  fire(0.25, { spread: 26, startVelocity: 55, colors })
  fire(0.2, { spread: 60, colors })
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors })
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, colors })
  fire(0.1, { spread: 120, startVelocity: 45, colors })
}

/**
 * High score celebration — continuous confetti rain from both sides
 */
function celebrateHigh(colors = ['#a855f7', '#ec4899', '#8b5cf6']) {
  const duration = 3000
  const animationEnd = Date.now() + duration
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

  const interval = window.setInterval(() => {
    const timeLeft = animationEnd - Date.now()
    if (timeLeft <= 0) return clearInterval(interval)

    const particleCount = 50 * (timeLeft / duration)
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, colors })
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, colors })
  }, 250)
}

/**
 * Passing score celebration — simple confetti burst
 */
function celebratePassing(colors = ['#10b981', '#3b82f6', '#8b5cf6']) {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors,
    zIndex: 9999,
  })
}

/**
 * Celebrate an exam result based on score thresholds.
 */
export function celebrateExamResult(opts: {
  score: number
  maxScore: number
  passThreshold: number
  passed: boolean
}) {
  const percentage = (opts.score / opts.maxScore) * 100

  if (percentage >= 95) {
    celebratePerfect()
  } else if (opts.score >= 800) {
    celebrateHigh(['#10b981', '#3b82f6', '#06b6d4'])
  } else if (opts.passed) {
    celebratePassing()
  }
}

/**
 * Celebrate a CIP puzzle result.
 */
export function celebrateCIPResult(opts: {
  scaledScore: number
  percentageCorrect: number
  passed: boolean
}) {
  if (opts.percentageCorrect === 100) {
    celebratePerfect()
  } else if (opts.scaledScore >= 800) {
    celebrateHigh()
  } else if (opts.passed) {
    celebratePassing()
  }
}

/**
 * Celebrate a flashcard study session completion.
 * Only fires if accuracy >= 80%.
 */
export function celebrateSessionComplete(accuracy: number) {
  if (accuracy >= 95) {
    celebratePerfect()
  } else if (accuracy >= 80) {
    celebratePassing(['#10b981', '#34d399', '#6ee7b7'])
  }
}
