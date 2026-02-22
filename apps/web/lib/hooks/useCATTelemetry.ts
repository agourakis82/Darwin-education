// ============================================================
// CAT BEHAVIORAL TELEMETRY HOOK
// Integrates useBehavioralCapture with adaptive testing flow
// ============================================================

'use client'

import { useCallback, useRef } from 'react'
import { useBehavioralCapture } from './useBehavioralCapture'
import type { BehavioralData } from '@/lib/ddl/types'

interface CATEvent {
  type: 'item_rendered' | 'option_selected' | 'option_changed' | 'answer_submitted' | 'item_exited'
  timestamp: string
  questionId: string
  questionNumber: number
  metadata?: Record<string, unknown>
}

interface UseCATTelemetryReturn {
  startItemCapture: (questionId: string, questionNumber: number) => void
  stopItemCapture: (questionId: string, questionNumber: number) => BehavioralData | null
  recordOptionSelected: (questionId: string, optionIndex: number, optionText: string) => void
  recordOptionChanged: (questionId: string, fromIndex: number, toIndex: number) => void
  recordAnswerSubmitted: (questionId: string, selectedOptionIndex: number, isCorrect: boolean) => void
  flushEvents: () => Promise<void>
}

/**
 * useCATTelemetry - Behavioral telemetry integration for CAT sessions.
 *
 * Captures micro-events during adaptive testing:
 * - Item render time
 * - Option selection patterns
 * - Answer changes (indecision)
 * - Time spent per question
 * - Keystroke dynamics (if applicable)
 */
export function useCATTelemetry(sessionId: string | null): UseCATTelemetryReturn {
  const behavioralCapture = useBehavioralCapture()
  const eventsRef = useRef<CATEvent[]>([])
  const currentQuestionRef = useRef<{ id: string; number: number; startTime: number } | null>(null)

  const startItemCapture = useCallback(
    (questionId: string, questionNumber: number) => {
      // Start behavioral capture for this item
      behavioralCapture.startCapture()

      currentQuestionRef.current = {
        id: questionId,
        number: questionNumber,
        startTime: Date.now(),
      }

      const event: CATEvent = {
        type: 'item_rendered',
        timestamp: new Date().toISOString(),
        questionId,
        questionNumber,
      }

      eventsRef.current.push(event)

      // Send to server (fire-and-forget)
      sendEvent(sessionId, event)
    },
    [behavioralCapture, sessionId]
  )

  const stopItemCapture = useCallback(
    (questionId: string, questionNumber: number): BehavioralData | null => {
      const behavioralData = behavioralCapture.stopCapture()

      const event: CATEvent = {
        type: 'item_exited',
        timestamp: new Date().toISOString(),
        questionId,
        questionNumber,
        metadata: {
          timeSpentMs: currentQuestionRef.current
            ? Date.now() - currentQuestionRef.current.startTime
            : 0,
          behavioralSummary: {
            pauseCount: behavioralData.pause_count,
            keystrokeCount: behavioralData.keystroke_dynamics?.total_keystrokes ?? 0,
            revisionCount: behavioralData.revision_events?.length ?? 0,
          },
        },
      }

      eventsRef.current.push(event)
      sendEvent(sessionId, event)

      currentQuestionRef.current = null

      return behavioralData
    },
    [behavioralCapture, sessionId]
  )

  const recordOptionSelected = useCallback(
    (questionId: string, optionIndex: number, optionText: string) => {
      const event: CATEvent = {
        type: 'option_selected',
        timestamp: new Date().toISOString(),
        questionId,
        questionNumber: currentQuestionRef.current?.number ?? 0,
        metadata: {
          optionIndex,
          optionText: optionText.slice(0, 100), // Truncate for privacy
        },
      }

      eventsRef.current.push(event)
      sendEvent(sessionId, event)
    },
    [sessionId]
  )

  const recordOptionChanged = useCallback(
    (questionId: string, fromIndex: number, toIndex: number) => {
      const event: CATEvent = {
        type: 'option_changed',
        timestamp: new Date().toISOString(),
        questionId,
        questionNumber: currentQuestionRef.current?.number ?? 0,
        metadata: {
          fromIndex,
          toIndex,
        },
      }

      eventsRef.current.push(event)
      sendEvent(sessionId, event)
    },
    [sessionId]
  )

  const recordAnswerSubmitted = useCallback(
    (questionId: string, selectedOptionIndex: number, isCorrect: boolean) => {
      const event: CATEvent = {
        type: 'answer_submitted',
        timestamp: new Date().toISOString(),
        questionId,
        questionNumber: currentQuestionRef.current?.number ?? 0,
        metadata: {
          selectedOptionIndex,
          isCorrect,
          timeSpentMs: currentQuestionRef.current
            ? Date.now() - currentQuestionRef.current.startTime
            : 0,
        },
      }

      eventsRef.current.push(event)
      sendEvent(sessionId, event)
    },
    [sessionId]
  )

  const flushEvents = useCallback(async (): Promise<void> => {
    if (!sessionId || eventsRef.current.length === 0) return

    try {
      await fetch('/api/cat/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          events: eventsRef.current,
        }),
      })

      // Clear events after successful flush
      eventsRef.current = []
    } catch (error) {
      console.warn('Failed to flush telemetry events:', error)
      // Don't throw - telemetry is non-critical
    }
  }, [sessionId])

  return {
    startItemCapture,
    stopItemCapture,
    recordOptionSelected,
    recordOptionChanged,
    recordAnswerSubmitted,
    flushEvents,
  }
}

/**
 * Send a single event to the telemetry endpoint (fire-and-forget).
 */
function sendEvent(sessionId: string | null, event: CATEvent): void {
  if (!sessionId) return

  // Use sendBeacon if available for reliable delivery on page unload
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const blob = new Blob(
      [JSON.stringify({ sessionId, events: [event] })],
      { type: 'application/json' }
    )
    navigator.sendBeacon('/api/cat/telemetry', blob)
    return
  }

  // Fallback to fetch
  fetch('/api/cat/telemetry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, events: [event] }),
    // Use keepalive to ensure delivery even if page unloads
    keepalive: true,
  }).catch((error) => {
    console.warn('Failed to send telemetry event:', error)
  })
}
