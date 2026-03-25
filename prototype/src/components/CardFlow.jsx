import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion'
import useStore, { CAMERA_PRESETS } from '../store/useStore'

const ATMO_HEX = {
  warm: '#F59E42', blue: '#5B9CF5', green: '#4ADE80',
  purple: '#A78BFA', white: '#9CA3AF',
}

const SPACE_HINTS = {
  home: '今晚试试。', nearby: '下次路过。',
  city: '找个时间。', nature: '等一个好天气。',
}

const SWIPE_THRESHOLD = 80

export default function CardFlow() {
  const getAvailableCards = useStore(s => s.getAvailableCards)
  const ascend = useStore(s => s.ascend)
  const sink = useStore(s => s.sink)
  const setView = useStore(s => s.setView)
  const pendingNote = useStore(s => s.pendingNote)
  const clearNote = useStore(s => s.clearNote)
  const featuredCardId = useStore(s => s.featuredCardId)
  const cardsSeenCount = useStore(s => s.cardsSeenCount)

  const cards = getAvailableCards()
  const currentCard = cards[0]
  const [leaving, setLeaving] = useState(false)
  const [ascendHint, setAscendHint] = useState(null) // 飞升后的空间文案
  const [showNote, setShowNote] = useState(false)

  // 信笺检查
  useEffect(() => {
    if (pendingNote && !leaving) setShowNote(true)
  }, [pendingNote, leaving])

  const handleAscend = useCallback((card) => {
    setLeaving(true)
    const space = Array.isArray(card.context.space) ? card.context.space[0] : card.context.space
    const hint = SPACE_HINTS[space] || '找个时间。'
    setTimeout(() => {
      ascend(card.id)
      setAscendHint(hint)
      setLeaving(false)
      setTimeout(() => setAscendHint(null), 2000)
    }, 450)
  }, [ascend])

  const handleSink = useCallback((card, dur) => {
    setLeaving(true)
    setTimeout(() => { sink(card.id, dur); setLeaving(false) }, 350)
  }, [sink])

  const handleDismissNote = () => {
    setShowNote(false)
    clearNote()
  }

  // 信笺
  if (showNote && pendingNote) {
    return (
      <div style={styles.container}>
        <NoteCard note={pendingNote} onDismiss={handleDismissNote} />
      </div>
    )
  }

  if (!currentCard) {
    return (
      <div style={styles.empty}>
        <div style={{ fontSize: 14, color: 'var(--text-dim)' }}>暂时没有更多了</div>
      </div>
    )
  }

  const isFeatured = currentCard.id === featuredCardId

  return (
    <div style={styles.container}>
      {/* 飞升后的空间锚定文案 */}
      <AnimatePresence>
        {ascendHint && (
          <motion.div
            style={styles.ascendHint}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 0.5, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {ascendHint}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!leaving && (
          <SwipeableCard
            key={currentCard.id}
            card={currentCard}
            onAscend={handleAscend}
            onSink={handleSink}
            isFirst={cardsSeenCount === 0}
            isSecond={cardsSeenCount === 1}
            isFeatured={isFeatured}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ── 信笺卡片 ──
function NoteCard({ note, onDismiss }) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const opacity = useTransform(
    [x, y],
    ([lx, ly]) => 1 - Math.min(1, (Math.abs(lx) + Math.abs(ly)) / 200)
  )

  const handleDragEnd = (_, info) => {
    const dist = Math.sqrt(info.offset.x ** 2 + info.offset.y ** 2)
    if (dist > 60) {
      onDismiss()
    } else {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 25 })
      animate(y, 0, { type: 'spring', stiffness: 400, damping: 25 })
    }
  }

  return (
    <motion.div
      style={{ ...styles.cardOuter, x, y, opacity }}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <div style={styles.noteCard}>
        <div style={styles.noteText}>{note.content}</div>
        {note.options && (
          <div style={styles.noteOptions}>
            {note.options.map((opt, i) => (
              <button key={i} style={styles.noteOptBtn} onClick={onDismiss}>{opt}</button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── 可滑动卡片 ──
function SwipeableCard({ card, onAscend, onSink, isFirst, isSecond, isFeatured }) {
  const [flipped, setFlipped] = useState(false)
  const viewStart = useRef(Date.now())
  const [showGuide, setShowGuide] = useState(isFirst)
  const [didNudge, setDidNudge] = useState(false)

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // 飞升/沉降进度 (-1 沉降 ~ 0 中性 ~ 1 飞升)
  const progress = useTransform(
    [x, y],
    ([lx, ly]) => {
      const asc = (lx + Math.max(0, -ly)) / 200
      const snk = (-lx + Math.max(0, ly)) / 200
      return Math.max(-1, Math.min(1, asc - snk))
    }
  )

  // 视觉反馈
  const cardBorder = useTransform(progress, [-1, -0.2, 0, 0.2, 1],
    ['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.03)', 'rgba(255,255,255,0.08)',
     hexToRgba(ATMO_HEX[card.atmosphere] || '#9CA3AF', 0.3),
     hexToRgba(ATMO_HEX[card.atmosphere] || '#9CA3AF', 0.6)])
  const cardBrightness = useTransform(progress, [-1, 0, 1], [0.5, 1, 1.25])
  const cardScaleVal = useTransform(progress, [-1, 0, 1], [0.95, 1, 0.92])
  const cardRoundness = useTransform(progress, [0, 0.5, 1], [20, 24, 40])

  const hex = ATMO_HEX[card.atmosphere] || ATMO_HEX.white

  // 首张卡引导动效
  useEffect(() => {
    if (isFirst && !didNudge) {
      const timer = setTimeout(() => {
        animate(x, 8, { type: 'spring', stiffness: 300, damping: 8 })
        animate(y, -6, { type: 'spring', stiffness: 300, damping: 8 })
        setTimeout(() => {
          animate(x, 0, { type: 'spring', stiffness: 200, damping: 15 })
          animate(y, 0, { type: 'spring', stiffness: 200, damping: 15 })
        }, 400)
        setDidNudge(true)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [isFirst, didNudge, x, y])

  // 第二张也 nudge（无文字）
  useEffect(() => {
    if (isSecond && !didNudge) {
      const timer = setTimeout(() => {
        animate(x, 6, { type: 'spring', stiffness: 300, damping: 10 })
        setTimeout(() => animate(x, 0, { type: 'spring', stiffness: 200, damping: 15 }), 300)
        setDidNudge(true)
      }, 1200)
      return () => clearTimeout(timer)
    }
  }, [isSecond, didNudge, x])

  // 翻转引导
  useEffect(() => {
    if (isFirst) {
      const timer = setTimeout(() => {
        if (!flipped) {
          // 微抖动暗示可翻转
          animate(x, 0, { type: 'spring', stiffness: 800, damping: 5 })
        }
      }, 6000)
      return () => clearTimeout(timer)
    }
  }, [isFirst, flipped, x])

  useEffect(() => {
    if (showGuide) {
      const t = setTimeout(() => setShowGuide(false), 2500)
      return () => clearTimeout(t)
    }
  }, [showGuide])

  const handleDragEnd = (_, info) => {
    const { offset, velocity } = info
    const vMag = Math.sqrt(velocity.x ** 2 + velocity.y ** 2)
    const isAscend = offset.x > SWIPE_THRESHOLD || offset.y < -SWIPE_THRESHOLD ||
      (vMag > 400 && (velocity.x > 200 || velocity.y < -200))
    const isSink = offset.x < -SWIPE_THRESHOLD || offset.y > SWIPE_THRESHOLD ||
      (vMag > 400 && (velocity.x < -200 || velocity.y > 200))

    if (isAscend) {
      // 飞升：缩小飞向右上
      animate(x, 150, { duration: 0.35, ease: 'easeIn' })
      animate(y, -350, { duration: 0.35, ease: 'easeIn' })
      onAscend(card)
    } else if (isSink) {
      animate(x, offset.x < -30 ? -250 : 0, { duration: 0.3 })
      animate(y, 400, { duration: 0.3 })
      onSink(card, Date.now() - viewStart.current)
    } else {
      animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 })
      animate(y, 0, { type: 'spring', stiffness: 500, damping: 30 })
    }
  }

  const handleTap = () => {
    if (Math.abs(x.get()) < 5 && Math.abs(y.get()) < 5) {
      setFlipped(f => !f)
    }
  }

  return (
    <motion.div
      style={{
        ...styles.cardOuter,
        x, y,
        scale: cardScaleVal,
      }}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.85}
      onDragEnd={handleDragEnd}
      onTap={handleTap}
      initial={{ opacity: 0, scale: 0.92, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: -100, transition: { duration: 0.35 } }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <motion.div
        style={{
          ...styles.card,
          borderColor: cardBorder,
          borderRadius: cardRoundness,
          filter: useTransform(cardBrightness, b => `brightness(${b})`),
          ...(isFeatured ? styles.featuredCard : {}),
        }}
      >
        {/* 氛围光 */}
        <div style={{
          ...styles.atmosphereGlow,
          background: `radial-gradient(ellipse at 40% 10%, ${hex}${isFeatured ? '35' : '22'}, transparent 65%)`,
          ...(isFeatured ? { animation: 'pulse-glow 4s ease-in-out infinite' } : {}),
        }} />

        {/* 精选标记 */}
        {isFeatured && <div style={styles.featuredBadge}>✦</div>}

        <AnimatePresence mode="wait">
          {!flipped ? (
            <motion.div
              key="front"
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: -90, opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={styles.cardInner}
            >
              <div style={styles.invite}>
                {card.invite.split('\n').map((line, i) => <div key={i}>{line}</div>)}
              </div>
              <div style={styles.hook}>
                {card.hook.split('\n').map((line, i) => <div key={i}>{line}</div>)}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="back"
              initial={{ rotateY: -90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: 90, opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={styles.cardInner}
            >
              {card.preview && (
                <div style={styles.preview}>
                  {card.preview.split('\n').map((line, i) => (
                    <div key={i} style={{ minHeight: line === '' ? 10 : 'auto' }}>{line}</div>
                  ))}
                </div>
              )}
              <div style={styles.divider} />
              <div style={styles.meta}>
                {card.context.time >= 60 ? `约 ${card.context.time / 60} 小时` : `约 ${card.context.time} 分钟`}
                {card.context.cost > 0 && ` · ¥${card.context.cost}`}
                {' · '}
                {({ home: '在家', nearby: '附近', city: '城市', nature: '户外' })[
                  Array.isArray(card.context.space) ? card.context.space[0] : card.context.space
                ] || ''}
              </div>
              <div style={styles.voice}>有人做完说：{card.voice}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 首张卡引导文字 */}
      <AnimatePresence>
        {showGuide && (
          <motion.div
            style={styles.guide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            exit={{ opacity: 0 }}
          >
            向上或向右 · 想做
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function hexToRgba(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

const styles = {
  container: {
    position: 'absolute', inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px', zIndex: 10,
  },
  empty: {
    position: 'absolute', inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
  },
  cardOuter: {
    width: '100%', maxWidth: 360,
    cursor: 'grab', touchAction: 'none',
    position: 'relative',
  },
  card: {
    position: 'relative', borderRadius: 20,
    background: 'rgba(14, 20, 28, 0.88)',
    backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  featuredCard: {
    borderColor: 'rgba(255,255,255,0.2)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 30px rgba(91,156,245,0.1)',
  },
  featuredBadge: {
    position: 'absolute', top: 16, right: 20,
    fontSize: 12, color: 'var(--blue)', opacity: 0.6, zIndex: 2,
  },
  atmosphereGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 200,
    pointerEvents: 'none',
  },
  cardInner: {
    padding: '40px 28px 36px', position: 'relative', zIndex: 1,
    minHeight: 260, display: 'flex', flexDirection: 'column', justifyContent: 'center',
  },
  invite: { fontSize: 21, fontWeight: 300, lineHeight: 1.75, letterSpacing: 0.5 },
  hook: { fontSize: 14, lineHeight: 1.85, color: 'var(--text-dim)', marginTop: 24 },
  preview: { fontSize: 14, lineHeight: 1.9, color: 'var(--text-dim)' },
  divider: { height: 1, background: 'var(--border)', margin: '20px 0' },
  meta: { fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 },
  voice: { fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.7, opacity: 0.7 },
  guide: {
    position: 'absolute', bottom: -36, left: 0, right: 0,
    textAlign: 'center', fontSize: 13, color: 'var(--text)',
    letterSpacing: 1,
  },
  ascendHint: {
    position: 'absolute', top: 60, left: 0, right: 0,
    textAlign: 'center', fontSize: 14, color: 'var(--text-dim)',
    zIndex: 20, letterSpacing: 1,
  },
  // 信笺
  noteCard: {
    borderRadius: 20,
    background: 'rgba(14, 20, 28, 0.7)',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    border: '1px dashed rgba(255,255,255,0.12)',
    padding: '48px 32px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
  },
  noteText: {
    fontSize: 16, fontWeight: 300, lineHeight: 1.8,
    textAlign: 'center', color: 'var(--text-dim)',
  },
  noteOptions: { display: 'flex', gap: 12 },
  noteOptBtn: {
    padding: '10px 20px', borderRadius: 16,
    border: '1px solid var(--border)', fontSize: 14, color: 'var(--text-dim)',
    background: 'rgba(255,255,255,0.04)',
  },
}
