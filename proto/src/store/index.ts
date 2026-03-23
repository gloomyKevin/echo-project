import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Card, CheckinRecord, SwipeRecord, DimensionScores, ScoredCard } from '../types'
import { CARDS } from '../data/cards'
import { recommend, computeClusterProfile } from '../engine/recommend'

interface AppState {
  // Data
  swipeHistory: SwipeRecord[]
  checkins: CheckinRecord[]
  shownIds: Set<string>
  rejectedIds: Set<string>
  completedIds: Set<string>

  // Derived (recomputed on change)
  stack: ScoredCard[]
  dimensionScores: DimensionScores

  // Actions
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
          const newHistory = [...s.swipeHistory, record]
          return { swipeHistory: newHistory, shownIds: newShown, rejectedIds: newRejected }
        })
        get().refreshStack()
      },

      recordCheckin(record) {
        set(s => {
          const newCompleted = new Set(s.completedIds).add(record.cardId)
          const newRejected = new Set(s.rejectedIds)
          newRejected.delete(record.cardId) // un-reject on checkin
          const newScores = applyDelta(s.dimensionScores, record.dimensionDelta as Partial<DimensionScores>)
          return {
            checkins: [...s.checkins, record],
            completedIds: newCompleted,
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
          s.shownIds,
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
          dimensionScores: { ...EMPTY_DIMENSIONS },
          stack: [],
        })
        setTimeout(() => get().refreshStack(), 0)
      },
    }),
    {
      name: 'sui-proto-store',
      // Serialize/deserialize Sets
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

// Derived selector helpers
export function useClusterProfile() {
  const { swipeHistory, checkins } = useStore()
  return computeClusterProfile(swipeHistory, checkins.length)
}
