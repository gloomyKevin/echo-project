import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useStore } from './store'
import CardStack from './components/CardStack'
import CheckinModal from './components/CheckinModal'
import Celebration from './components/Celebration'
import DevPanel from './components/DevPanel'
import type { Card, CheckinRecord, EmotionType } from './types'

type Screen = 'discover' | 'checkin' | 'celebration'

export default function App() {
  const [screen, setScreen] = useState<Screen>('discover')
  const [activeCard, setActiveCard] = useState<Card | null>(null)
  const [lastCheckin, setLastCheckin] = useState<CheckinRecord | null>(null)
  const recordCheckin = useStore(s => s.recordCheckin)

  function handleCheckinOpen(card: Card) {
    setActiveCard(card)
    setScreen('checkin')
  }

  function handleCheckinSubmit(emotion: EmotionType, note: string) {
    if (!activeCard) return
    const card = activeCard

    // Compute dimension delta from card preview
    const delta: Partial<Record<string, number>> = {}
    for (const [dim, range] of Object.entries(card.preview.dimensionImpact)) {
      delta[dim] = Math.round((range.min + range.max) / 2)
    }

    const record: CheckinRecord = {
      id: `ci-${Date.now()}`,
      cardId: card.id,
      completedAt: new Date().toISOString(),
      emotion,
      note,
      dimensionDelta: delta,
    }

    recordCheckin(record)
    setLastCheckin(record)
    setScreen('celebration')
  }

  function handleCelebrationDone() {
    setActiveCard(null)
    setLastCheckin(null)
    setScreen('discover')
  }

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <AnimatePresence mode="wait">
        {screen === 'discover' && (
          <CardStack key="discover" onCheckin={handleCheckinOpen} />
        )}
        {screen === 'checkin' && activeCard && (
          <CheckinModal
            key="checkin"
            card={activeCard}
            onSubmit={handleCheckinSubmit}
            onCancel={() => setScreen('discover')}
          />
        )}
        {screen === 'celebration' && lastCheckin && activeCard && (
          <Celebration
            key="celebration"
            card={activeCard}
            checkin={lastCheckin}
            onDone={handleCelebrationDone}
          />
        )}
      </AnimatePresence>

      <DevPanel />
    </div>
  )
}
