import { useState, useRef } from 'react'
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import type { Card } from '../types'

interface Props {
  onCheckin: (card: Card) => void
}

const SWIPE_THRESHOLD = 100

export default function CardStack({ onCheckin }: Props) {
  const stack = useStore(s => s.stack)
  const recordSwipe = useStore(s => s.recordSwipe)
  const [exiting, setExiting] = useState<{ id: string; dir: 'left' | 'right' } | null>(null)

  const top = stack[0]?.card ?? null

  function handleSwipe(card: Card, direction: 'left' | 'right') {
    if (exiting) return
    setExiting({ id: card.id, dir: direction })
    setTimeout(() => {
      recordSwipe(card, direction)
      setExiting(null)
    }, 300)
  }

  if (!top) {
    return (
      <div style={styles.container}>
        <div style={styles.empty}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 18 }}>卡片都刷完了</div>
          <div style={{ color: 'var(--text-dim)', fontSize: 14, marginTop: 8 }}>去做一件事，回来继续</div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* Background cards (depth effect) */}
      {stack.slice(1, 3).map((sc, i) => (
        <div
          key={sc.card.id}
          style={{
            ...styles.card,
            background: sc.card.coverColor,
            transform: `scale(${0.94 - i * 0.03}) translateY(${-(i + 1) * 12}px)`,
            zIndex: 10 - i,
            opacity: 0.6 - i * 0.15,
          }}
        />
      ))}

      {/* Top card */}
      <AnimatePresence>
        {!exiting && (
          <SwipeCard
            key={top.id}
            card={top}
            onSwipe={handleSwipe}
            onCheckin={onCheckin}
          />
        )}
        {exiting?.id === top.id && (
          <motion.div
            key={`exit-${top.id}`}
            style={{
              ...styles.card,
              background: top.coverColor,
              zIndex: 20,
              position: 'absolute',
            }}
            animate={{ x: exiting.dir === 'right' ? 400 : -400, opacity: 0, rotate: exiting.dir === 'right' ? 20 : -20 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>

      {/* Hint arrows */}
      <div style={styles.hints}>
        <span style={{ color: 'var(--red)', opacity: 0.5, fontSize: 13 }}>← 没兴趣</span>
        <span style={{ color: 'var(--green)', opacity: 0.5, fontSize: 13 }}>感兴趣 →</span>
      </div>
    </div>
  )
}

function SwipeCard({ card, onSwipe, onCheckin }: { card: Card; onSwipe: (c: Card, d: 'left' | 'right') => void; onCheckin: (c: Card) => void }) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-15, 15])
  const opacity = useTransform(x, [-200, -80, 0, 80, 200], [0.5, 1, 1, 1, 0.5])
  const likeOpacity = useTransform(x, [0, 60], [0, 1])
  const nopeOpacity = useTransform(x, [-60, 0], [1, 0])

  const dragStart = useRef(0)

  function handleDragEnd() {
    const val = x.get()
    if (val > SWIPE_THRESHOLD) onSwipe(card, 'right')
    else if (val < -SWIPE_THRESHOLD) onSwipe(card, 'left')
  }

  const intensityLabel: Record<string, string> = { low: '轻', medium: '中', high: '挑战' }
  const scaleLabel: Record<string, string> = { micro: '微粒', daily: '日常', event: '大事' }

  return (
    <motion.div
      style={{ ...styles.card, background: card.coverColor, x, rotate, opacity, zIndex: 20, position: 'absolute', touchAction: 'none' }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragStart={() => { dragStart.current = Date.now() }}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: 'grabbing' }}
    >
      {/* Like/Nope overlays */}
      <motion.div style={{ ...styles.badge, ...styles.likeBadge, opacity: likeOpacity }}>感兴趣</motion.div>
      <motion.div style={{ ...styles.badge, ...styles.nopeBadge, opacity: nopeOpacity }}>没兴趣</motion.div>

      {/* Content */}
      <div style={styles.cardContent}>
        <div style={styles.tags}>
          <span style={styles.tag}>{scaleLabel[card.scaleType]}</span>
          <span style={styles.tag}>{intensityLabel[card.intensity]}</span>
        </div>

        <div style={{ flex: 1 }} />

        <h2 style={styles.title}>{card.title}</h2>
        <p style={styles.tagline}>{card.tagline}</p>

        <div style={styles.previewBox}>
          <p style={styles.previewText}>{card.preview.processSummary}</p>
        </div>

        <button
          style={styles.checkinBtn}
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onCheckin(card) }}
        >
          已经做过 →
        </button>
      </div>
    </motion.div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100%',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    padding: '20px 20px 80px',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    height: '100%',
    maxHeight: 580,
    borderRadius: 'var(--radius)',
    overflow: 'hidden',
    cursor: 'grab',
    userSelect: 'none',
  },
  cardContent: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: '28px 24px 24px',
    background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.7) 100%)',
  },
  tags: {
    display: 'flex',
    gap: 8,
  },
  tag: {
    fontSize: 12,
    padding: '3px 10px',
    borderRadius: 20,
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    backdropFilter: 'blur(8px)',
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: 'white',
    marginBottom: 8,
    lineHeight: 1.3,
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 16,
    lineHeight: 1.5,
  },
  previewBox: {
    background: 'rgba(0,0,0,0.3)',
    backdropFilter: 'blur(12px)',
    borderRadius: 12,
    padding: '12px 14px',
    marginBottom: 16,
  },
  previewText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 1.6,
  },
  checkinBtn: {
    background: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: '12px 20px',
    color: 'white',
    fontSize: 15,
    fontWeight: 500,
    textAlign: 'center',
    cursor: 'pointer',
  },
  badge: {
    position: 'absolute',
    top: 40,
    padding: '6px 16px',
    borderRadius: 8,
    fontSize: 20,
    fontWeight: 800,
    border: '3px solid',
    letterSpacing: 1,
    zIndex: 30,
  },
  likeBadge: {
    right: 20,
    color: 'var(--green)',
    borderColor: 'var(--green)',
    transform: 'rotate(15deg)',
  },
  nopeBadge: {
    left: 20,
    color: 'var(--red)',
    borderColor: 'var(--red)',
    transform: 'rotate(-15deg)',
  },
  hints: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0 40px',
    pointerEvents: 'none',
  },
}
