import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Card, CheckinRecord, SwipeRecord, DimensionScores, ScoredCard } from '../types'
import { CARDS } from '../data/cards'
import { recommend, computeClusterProfile } from '../engine/recommend'

interface AppState {
  swipeHistory: SwipeRecord[]
  checkins: CheckinRecord[]
  shownIds: Set<string>
  rejectedIds: Set<string>
  completedIds: Set<string>
  likedIds: Set<string>       // right-swiped: saved, removed from swipe deck
  stack: ScoredCard[]
  dimensionScores: DimensionScores

  recordSwipe: (card: Card, direction: 'left' | 'right') => void
  recordCheckin: (record: CheckinRecord) => void
  refreshStack: () => void
  reset: () => void
}

const EMPTY_DIMENSIONS: DimensionScores = {
  health: 50, finance: 50, career: 50, social: 50, environment: 50, possibility: 50,
}

function applyDelta(scores: DimensionScores, delta: Partial<DimensionScores>): DimensionScores {
  const next = { ...scores }
  for (const [k, v] of Object.entries(delta)) {
    const key = k as keyof DimensionScores
    next[key] = Math.max(0, Math.min(100, (next[key] ?? 50) + (v ?? 0)))
  }
  return next
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      swipeHistory: [],
      checkins: [],
      shownIds: new Set<string>(),
      rejectedIds: new Set<string>(),
      completedIds: new Set<string>(),
      likedIds: new Set<string>(),
      stack: [],
      dimensionScores: { ...EMPTY_DIMENSIONS },

      recordSwipe(card, direction) {
        const record: SwipeRecord = {
          cardId: card.id,
          direction,
          timestamp: new Date().toISOString(),
          card: { atoms: card.atoms, intensity: card.intensity },
        }
        set(s => {
          const newShown = new Set(s.shownIds).add(card.id)
          const newRejected = direction === 'left' ? new Set(s.rejectedIds).add(card.id) : s.rejectedIds
          const newLiked = direction === 'right' ? new Set(s.likedIds).add(card.id) : s.likedIds
          // Right-swipe: mild dimension nudge (~15% of avg impact, min 1pt)
          // Signals intent; checkin still carries 5-10x more weight
          let newScores = s.dimensionScores
          if (direction === 'right') {
            const mild: Partial<DimensionScores> = {}
            for (const [dim, range] of Object.entries(card.preview.dimensionImpact)) {
              mild[dim as keyof DimensionScores] = Math.max(1, Math.round(((range.min + range.max) / 2) * 0.15))
            }
            newScores = applyDelta(s.dimensionScores, mild)
          }
          return { swipeHistory: [...s.swipeHistory, record], shownIds: newShown, rejectedIds: newRejected, likedIds: newLiked, dimensionScores: newScores }
        })
        get().refreshStack()
      },

      recordCheckin(record) {
        set(s => {
          const newCompleted = new Set(s.completedIds).add(record.cardId)
          // Remove from liked queue on checkin (card is now completed)
          const newLiked = new Set(s.likedIds)
          newLiked.delete(record.cardId)
          const newRejected = new Set(s.rejectedIds)
          newRejected.delete(record.cardId)
          const newScores = applyDelta(s.dimensionScores, record.dimensionDelta as Partial<DimensionScores>)
          return {
            checkins: [...s.checkins, record],
            completedIds: newCompleted,
            likedIds: newLiked,
            rejectedIds: newRejected,
            dimensionScores: newScores,
          }
        })
        get().refreshStack()
      },

      refreshStack() {
        const s = get()
        const stack = recommend(
          CARDS,
          s.rejectedIds,
          s.completedIds,
          s.likedIds,
          s.swipeHistory,
          s.checkins.length,
          15,
        )
        set({ stack })
      },

      reset() {
        set({
          swipeHistory: [],
          checkins: [],
          shownIds: new Set(),
          rejectedIds: new Set(),
          completedIds: new Set(),
          likedIds: new Set(),
          dimensionScores: { ...EMPTY_DIMENSIONS },
          stack: [],
        })
        setTimeout(() => get().refreshStack(), 0)
      },
    }),
    {
      name: 'sui-proto-store',
      storage: {
        getItem(name) {
          const raw = localStorage.getItem(name)
          if (!raw) return null
          const parsed = JSON.parse(raw)
          const state = parsed.state
          if (state) {
            state.shownIds = new Set(state.shownIds ?? [])
            state.rejectedIds = new Set(state.rejectedIds ?? [])
            state.completedIds = new Set(state.completedIds ?? [])
            state.likedIds = new Set(state.likedIds ?? [])
          }
          return parsed
        },
        setItem(name, value) {
          const toStore = {
            ...value,
            state: {
              ...value.state,
              shownIds: Array.from(value.state.shownIds),
              rejectedIds: Array.from(value.state.rejectedIds),
              completedIds: Array.from(value.state.completedIds),
              likedIds: Array.from(value.state.likedIds),
            },
          }
          localStorage.setItem(name, JSON.stringify(toStore))
        },
        removeItem(name) {
          localStorage.removeItem(name)
        },
      },
    }
  )
)

export function useClusterProfile() {
  const { swipeHistory, checkins } = useStore()
  return computeClusterProfile(swipeHistory, checkins.length)
}
