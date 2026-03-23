import React, { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useStore } from './store'
import { CARDS } from './data/cards'
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
  const [savedSheetOpen, setSavedSheetOpen] = useState(false)
  const recordCheckin = useStore(s => s.recordCheckin)
  const likedIds = useStore(s => s.likedIds)
  const likedCards = CARDS.filter(c => likedIds.has(c.id))

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

      {/* Saved cards button */}
      {screen === 'discover' && likedCards.length > 0 && (
        <button style={savedBtnStyle} onClick={() => setSavedSheetOpen(true)}>
          已存 {likedCards.length}
        </button>
      )}

      {/* Saved cards sheet */}
      {savedSheetOpen && (
        <div style={sheetOverlayStyle} onClick={() => setSavedSheetOpen(false)}>
          <div style={sheetStyle} onClick={e => e.stopPropagation()}>
            <div style={sheetHeaderStyle}>已存卡片 ({likedCards.length})</div>
            <div style={{ overflowY: 'auto', maxHeight: 320 }}>
              {likedCards.map(card => (
                <div key={card.id} style={sheetRowStyle}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: card.coverColor, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {card.title}
                  </span>
                  <button
                    style={checkinRowBtnStyle}
                    onClick={() => { setSavedSheetOpen(false); handleCheckinOpen(card) }}
                  >
                    完成打卡
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <DevPanel />
    </div>
  )
}

const savedBtnStyle: React.CSSProperties = {
  position: 'fixed',
  top: 16,
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 20,
  padding: '6px 14px',
  fontSize: 13,
  color: 'var(--text-muted)',
  cursor: 'pointer',
  backdropFilter: 'blur(12px)',
  zIndex: 100,
}

const sheetOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.4)',
  zIndex: 150,
  display: 'flex',
  alignItems: 'flex-end',
}

const sheetStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg)',
  borderRadius: '20px 20px 0 0',
  padding: '20px 20px 40px',
}

const sheetHeaderStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: 'var(--text)',
  marginBottom: 16,
}

const sheetRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 0',
  borderBottom: '1px solid var(--border)',
}

const checkinRowBtnStyle: React.CSSProperties = {
  background: 'var(--accent)',
  color: 'white',
  fontSize: 13,
  fontWeight: 500,
  padding: '6px 12px',
  borderRadius: 10,
  cursor: 'pointer',
  flexShrink: 0,
}
