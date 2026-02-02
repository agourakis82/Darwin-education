// ============================================================
// BEHAVIORAL DATA CAPTURE HOOK
// Captures keystroke dynamics, pauses, revisions for DDL analysis
// ============================================================

'use client'

import { useCallback, useRef, useState } from 'react'
import type { BehavioralData, RevisionEvent, FocusEvent } from '@/lib/ddl/types'

const PAUSE_THRESHOLD_MS = 2000 // 2 seconds = pause

export interface UseBehavioralCaptureReturn {
  isCapturing: boolean
  startCapture: () => void
  stopCapture: () => BehavioralData
  handlers: {
    onKeyDown: (e: React.KeyboardEvent) => void
    onFocus: () => void
    onBlur: () => void
    onScroll: () => void
    onPaste: () => void
  }
}

export function useBehavioralCapture(): UseBehavioralCaptureReturn {
  const [isCapturing, setIsCapturing] = useState(false)

  // Refs to avoid re-renders during capture
  const startTimeRef = useRef<number>(0)
  const lastKeystrokeTimeRef = useRef<number>(0)
  const firstKeystrokeTimeRef = useRef<number | null>(null)
  const keystrokeIntervalsRef = useRef<number[]>([])
  const pauseDurationsRef = useRef<number[]>([])
  const keystrokeCountRef = useRef({
    total: 0,
    backspace: 0,
    delete: 0,
  })
  const revisionEventsRef = useRef<RevisionEvent[]>([])
  const focusEventsRef = useRef<FocusEvent[]>([])
  const scrollCountRef = useRef(0)
  const copyPasteCountRef = useRef(0)
  const blurStartRef = useRef<number | null>(null)

  const startCapture = useCallback(() => {
    const now = Date.now()
    startTimeRef.current = now
    lastKeystrokeTimeRef.current = now
    firstKeystrokeTimeRef.current = null
    keystrokeIntervalsRef.current = []
    pauseDurationsRef.current = []
    keystrokeCountRef.current = { total: 0, backspace: 0, delete: 0 }
    revisionEventsRef.current = []
    focusEventsRef.current = []
    scrollCountRef.current = 0
    copyPasteCountRef.current = 0
    blurStartRef.current = null
    setIsCapturing(true)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isCapturing) return

    const now = Date.now()

    // Track first keystroke
    if (firstKeystrokeTimeRef.current === null) {
      firstKeystrokeTimeRef.current = now
    }

    // Calculate inter-keystroke interval
    const interval = now - lastKeystrokeTimeRef.current

    // Check for pause (gap > threshold)
    if (interval > PAUSE_THRESHOLD_MS) {
      pauseDurationsRef.current.push(interval)
    } else if (interval > 0) {
      keystrokeIntervalsRef.current.push(interval)
    }

    lastKeystrokeTimeRef.current = now
    keystrokeCountRef.current.total++

    // Track deletion keys
    if (e.key === 'Backspace') {
      keystrokeCountRef.current.backspace++
      revisionEventsRef.current.push({
        timestamp: new Date(now).toISOString(),
        type: 'backspace',
      })
    } else if (e.key === 'Delete') {
      keystrokeCountRef.current.delete++
      revisionEventsRef.current.push({
        timestamp: new Date(now).toISOString(),
        type: 'delete',
      })
    }
  }, [isCapturing])

  const handleFocus = useCallback(() => {
    if (!isCapturing) return

    const now = Date.now()

    if (blurStartRef.current !== null) {
      const blurDuration = now - blurStartRef.current
      // Update last focus event with duration
      const lastEvent = focusEventsRef.current[focusEventsRef.current.length - 1]
      if (lastEvent && lastEvent.type === 'blur') {
        lastEvent.duration_ms = blurDuration
      }
    }

    focusEventsRef.current.push({
      timestamp: new Date(now).toISOString(),
      type: 'focus',
    })
    blurStartRef.current = null
  }, [isCapturing])

  const handleBlur = useCallback(() => {
    if (!isCapturing) return

    const now = Date.now()
    blurStartRef.current = now

    focusEventsRef.current.push({
      timestamp: new Date(now).toISOString(),
      type: 'blur',
    })
  }, [isCapturing])

  const handleScroll = useCallback(() => {
    if (!isCapturing) return
    scrollCountRef.current++
  }, [isCapturing])

  const handlePaste = useCallback(() => {
    if (!isCapturing) return
    copyPasteCountRef.current++
  }, [isCapturing])

  const stopCapture = useCallback((): BehavioralData => {
    const endTime = Date.now()
    setIsCapturing(false)

    const intervals = keystrokeIntervalsRef.current
    const avgInterval = intervals.length > 0
      ? intervals.reduce((a, b) => a + b, 0) / intervals.length
      : 0

    return {
      start_timestamp: new Date(startTimeRef.current).toISOString(),
      end_timestamp: new Date(endTime).toISOString(),
      total_time_ms: endTime - startTimeRef.current,
      time_to_first_keystroke_ms: firstKeystrokeTimeRef.current
        ? firstKeystrokeTimeRef.current - startTimeRef.current
        : 0,
      pause_count: pauseDurationsRef.current.length,
      pause_durations_ms: pauseDurationsRef.current,
      keystroke_dynamics: {
        total_keystrokes: keystrokeCountRef.current.total,
        backspace_count: keystrokeCountRef.current.backspace,
        delete_count: keystrokeCountRef.current.delete,
        avg_inter_key_interval_ms: avgInterval,
      },
      revision_events: revisionEventsRef.current,
      focus_events: focusEventsRef.current,
      scroll_events: scrollCountRef.current,
      copy_paste_events: copyPasteCountRef.current,
    }
  }, [])

  return {
    isCapturing,
    startCapture,
    stopCapture,
    handlers: {
      onKeyDown: handleKeyDown,
      onFocus: handleFocus,
      onBlur: handleBlur,
      onScroll: handleScroll,
      onPaste: handlePaste,
    },
  }
}
