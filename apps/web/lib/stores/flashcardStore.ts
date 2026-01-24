import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Flashcard, SM2State, ReviewQuality } from '@darwin-education/shared'

interface FlashcardWithState extends Flashcard {
  sm2State?: SM2State
}

interface StudySessionStats {
  cardsStudied: number
  cardsCorrect: number
  cardsIncorrect: number
  averageQuality: number
  sessionDuration: number // seconds
}

interface FlashcardState {
  // Current session
  currentDeck: {
    id: string
    name: string
    description?: string
  } | null
  sessionCards: FlashcardWithState[]
  currentCardIndex: number
  isFlipped: boolean
  sessionStartedAt: Date | null

  // Session tracking
  reviewedCards: Map<string, ReviewQuality>
  sessionStats: StudySessionStats | null

  // UI state
  showAnswer: boolean

  // Actions
  startSession: (deck: { id: string; name: string; description?: string }, cards: FlashcardWithState[]) => void
  flipCard: () => void
  rateCard: (quality: ReviewQuality) => void
  nextCard: () => void
  previousCard: () => void
  goToCard: (index: number) => void
  endSession: () => void
  resetSession: () => void
}

const initialState = {
  currentDeck: null,
  sessionCards: [],
  currentCardIndex: 0,
  isFlipped: false,
  sessionStartedAt: null,
  reviewedCards: new Map(),
  sessionStats: null,
  showAnswer: false,
}

export const useFlashcardStore = create<FlashcardState>()(
  persist(
    (set, get) => ({
      ...initialState,
      reviewedCards: new Map(),

      startSession: (deck, cards) => {
        set({
          currentDeck: deck,
          sessionCards: cards,
          currentCardIndex: 0,
          isFlipped: false,
          sessionStartedAt: new Date(),
          reviewedCards: new Map(),
          sessionStats: null,
          showAnswer: false,
        })
      },

      flipCard: () => {
        set((state) => ({
          isFlipped: !state.isFlipped,
          showAnswer: !state.showAnswer,
        }))
      },

      rateCard: (quality) => {
        const { sessionCards, currentCardIndex, reviewedCards } = get()
        const currentCard = sessionCards[currentCardIndex]

        if (currentCard) {
          const newReviewedCards = new Map(reviewedCards)
          newReviewedCards.set(currentCard.id, quality)
          set({ reviewedCards: newReviewedCards })
        }
      },

      nextCard: () => {
        const { currentCardIndex, sessionCards } = get()
        if (currentCardIndex < sessionCards.length - 1) {
          set({
            currentCardIndex: currentCardIndex + 1,
            isFlipped: false,
            showAnswer: false,
          })
        }
      },

      previousCard: () => {
        const { currentCardIndex } = get()
        if (currentCardIndex > 0) {
          set({
            currentCardIndex: currentCardIndex - 1,
            isFlipped: false,
            showAnswer: false,
          })
        }
      },

      goToCard: (index) => {
        const { sessionCards } = get()
        if (index >= 0 && index < sessionCards.length) {
          set({
            currentCardIndex: index,
            isFlipped: false,
            showAnswer: false,
          })
        }
      },

      endSession: () => {
        const { reviewedCards, sessionStartedAt } = get()

        const cardsStudied = reviewedCards.size
        const qualities = Array.from(reviewedCards.values())
        const cardsCorrect = qualities.filter((q) => q >= 3).length
        const cardsIncorrect = qualities.filter((q) => q < 3).length
        const averageQuality =
          qualities.length > 0
            ? qualities.reduce((a: number, b) => a + b, 0) / qualities.length
            : 0
        const sessionDuration = sessionStartedAt
          ? Math.floor((Date.now() - sessionStartedAt.getTime()) / 1000)
          : 0

        set({
          sessionStats: {
            cardsStudied,
            cardsCorrect,
            cardsIncorrect,
            averageQuality,
            sessionDuration,
          },
        })
      },

      resetSession: () => {
        set({
          ...initialState,
          reviewedCards: new Map(),
        })
      },
    }),
    {
      name: 'darwin-flashcard-store',
      partialize: (state) => ({
        currentDeck: state.currentDeck,
        currentCardIndex: state.currentCardIndex,
        sessionStartedAt: state.sessionStartedAt,
      }),
      // Custom serialization for Map
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name)
          if (!str) return null
          return JSON.parse(str)
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value))
        },
        removeItem: (name) => {
          localStorage.removeItem(name)
        },
      },
    }
  )
)

// Selectors
export const selectCurrentCard = (state: FlashcardState) =>
  state.sessionCards[state.currentCardIndex] ?? null

export const selectProgress = (state: FlashcardState) => {
  if (state.sessionCards.length === 0) return 0
  return (state.reviewedCards.size / state.sessionCards.length) * 100
}

export const selectRemainingCards = (state: FlashcardState) =>
  state.sessionCards.length - state.reviewedCards.size

export const selectIsLastCard = (state: FlashcardState) =>
  state.currentCardIndex === state.sessionCards.length - 1

export const selectIsFirstCard = (state: FlashcardState) =>
  state.currentCardIndex === 0
