import { useState, useCallback } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import useStore from '../store/useStore'

const ATMOSPHERE_COLORS = {
  warm: 'var(--warm)',
  blue: 'var(--blue)',
  green: 'var(--green)',
  purple: 'var(--purple)',
  white: 'var(--white)',
}

const ATMOSPHERE_HEX = {
  warm: '#F59E42',
  blue: '#5B8DEF',
  green: '#4ADE80',
  purple: '#A78BFA',
  white: '#9CA3AF',
}

const SWIPE_THRESHOLD = 80

export default function CardFlow() {
  const getCardStack = useStore(s => s.getCardStack)
  const swipeRight = useStore(s => s.swipeRight)
  const swipeLeft = useStore(s => s.swipeLeft)
  const setView = useStore(s => s.setView)

  const cards = getCardStack()
  const [feedback, setFeedback] = useState(null)

  const currentCard = cards[0]
  const nextCard = cards[1]

  const handleSwipeComplete = useCallback((direction, card) => {
    if (direction === 'right') {
      swipeRight(card.id)
    } else {
      setFeedback(card.id)
      setTimeout(() => {
        swipeLeft(card.id, 'dislike')
        setFeedback(null)
      }, 1500)
    }
  }, [swipeRight, swipeLeft])

  if (!currentCard) {
    return (
      <motion.div
        style={styles.empty}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div style={{ fontSize: 15, color: 'var(--text-dim)' }}>
          暂时没有更多了。
        </div>
        <button style={styles.backBtn} onClick={() => setView('landing')}>
          回到天空
        </button>
      </motion.div>
    )
  }

  return (
    <motion.div
      style={styles.container}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {nextCard && (
        <div style={styles.cardWrapper}>
          <CardStatic card={nextCard} dimmed />
        </div>
      )}

      <div style={styles.cardWrapper}>
        <SwipeableCard
          key={currentCard.id}
          card={currentCard}
          onSwipeComplete={handleSwipeComplete}
        />
      </div>

      {feedback && (
        <motion.div
          style={styles.feedback}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            style={styles.feedbackBtn}
            onClick={() => { swipeLeft(feedback, 'dislike'); setFeedback(null) }}
          >
            不感兴趣
          </button>
          <button
            style={styles.feedbackBtn}
            onClick={() => { swipeLeft(feedback, 'timing'); setFeedback(null) }}
          >
            现在不合适
          </button>
        </motion.div>
      )}

      <motion.div
        style={styles.hint}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 1.5 }}
      >
        ← 跳过 · 想做 →
      </motion.div>
    </motion.div>
  )
}

function SwipeableCard({ card, onSwipeComplete }) {
  const [expanded, setExpanded] = useState(false)
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-8, 8])
  const cardOpacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 0.8, 1, 0.8, 0.5])
  const rightOpacity = useTransform(x, [0, 80], [0, 1])
  const leftOpacity = useTransform(x, [-80, 0], [1, 0])

  const hex = ATMOSPHERE_HEX[card.atmosphere] || ATMOSPHERE_HEX.white
  const color = ATMOSPHERE_COLORS[card.atmosphere] || ATMOSPHERE_COLORS.white

  const handleDragEnd = (_, info) => {
    if (info.offset.x > SWIPE_THRESHOLD) {
      animate(x, 500, { duration: 0.3 })
      setTimeout(() => onSwipeComplete('right', card), 250)
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      animate(x, -500, { duration: 0.3 })
      setTimeout(() => onSwipeComplete('left', card), 250)
    } else {
      animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 })
    }
  }

  return (
    <motion.div
      style={{
        ...styles.card,
        background: `radial-gradient(ellipse at 30% 20%, ${hex}15 0%, #1A2028 70%)`,
        border: `1px solid ${hex}20`,
        overflowY: expanded ? 'auto' : 'hidden',
        x,
        rotate,
        opacity: cardOpacity,
      }}
      drag={expanded ? false : 'x'}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      onClick={() => !expanded && setExpanded(true)}
    >
      {/* 右滑指示 */}
      <motion.div
        style={{ ...styles.indicator, ...styles.indicatorRight, color }}
        initial={false}
        animate={{}}
        transformTemplate={() => ''}
      >
        <motion.span style={{ opacity: rightOpacity }}>想做 ✦</motion.span>
      </motion.div>

      {/* 左滑指示 */}
      <motion.div style={{ ...styles.indicator, ...styles.indicatorLeft }}>
        <motion.span style={{ opacity: leftOpacity }}>跳过</motion.span>
      </motion.div>

      {/* 氛围光 */}
      <div style={{
        ...styles.glow,
        background: `radial-gradient(circle at 50% 0%, ${hex}30, transparent 60%)`,
      }} />

      {/* 第一层：邀请 */}
      <div style={styles.invite}>
        {card.invite.split('\n').map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>

      {/* 第二层：预演钩子 */}
      <div style={styles.hook}>
        {card.hook.split('\n').map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>

      {/* 第三层：展开后 */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {card.preview && (
            <>
              <div style={styles.divider} />
              <div style={styles.preview}>
                {card.preview.split('\n').map((line, i) => (
                  <div key={i} style={{ minHeight: line === '' ? 12 : 'auto' }}>{line}</div>
                ))}
              </div>
            </>
          )}

          <div style={styles.divider} />

          <div style={styles.meta}>
            {card.context.time >= 60
              ? `约 ${card.context.time / 60} 小时`
              : `约 ${card.context.time} 分钟`}
            {card.context.cost > 0 && ` · ¥${card.context.cost}`}
            {' · '}
            {card.context.space === 'home' ? '在家' :
             card.context.space === 'nearby' ? '附近' :
             card.context.space === 'city' ? '城市' : '户外'}
          </div>

          <div style={styles.voice}>
            有人做完说：<br />{card.voice}
          </div>

          <button
            style={styles.collapseBtn}
            onClick={(e) => { e.stopPropagation(); setExpanded(false) }}
          >
            收起
          </button>
        </motion.div>
      )}

      {!expanded && (
        <div style={styles.expandHint}>点击展开 ↓</div>
      )}
    </motion.div>
  )
}

function CardStatic({ card, dimmed }) {
  const hex = ATMOSPHERE_HEX[card.atmosphere] || ATMOSPHERE_HEX.white
  return (
    <div style={{
      ...styles.card,
      background: `radial-gradient(ellipse at 30% 20%, ${hex}10 0%, #1A2028 70%)`,
      border: `1px solid ${hex}10`,
      opacity: dimmed ? 0.4 : 1,
      transform: 'scale(0.96)',
    }}>
      <div style={styles.invite}>
        {card.invite.split('\n').map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
      <div style={styles.hook}>
        {card.hook.split('\n').map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </div>
  )
}

const styles = {
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cardWrapper: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px 80px',
  },
  card: {
    width: '100%',
    maxHeight: '100%',
    borderRadius: 20,
    padding: '40px 28px 32px',
    position: 'relative',
    cursor: 'grab',
    touchAction: 'none',
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    borderRadius: '20px 20px 0 0',
    pointerEvents: 'none',
  },
  invite: {
    fontSize: 22,
    fontWeight: 300,
    lineHeight: 1.7,
    position: 'relative',
    zIndex: 1,
    letterSpacing: 0.5,
  },
  hook: {
    fontSize: 14,
    lineHeight: 1.8,
    color: 'var(--text-dim)',
    marginTop: 24,
    position: 'relative',
    zIndex: 1,
  },
  divider: {
    height: 1,
    background: 'var(--text-muted)',
    opacity: 0.3,
    margin: '24px 0',
  },
  preview: {
    fontSize: 14,
    lineHeight: 1.9,
    color: 'var(--text-dim)',
  },
  meta: {
    fontSize: 13,
    color: 'var(--text-muted)',
    marginBottom: 16,
  },
  voice: {
    fontSize: 13,
    color: 'var(--text-dim)',
    lineHeight: 1.7,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  expandHint: {
    fontSize: 12,
    color: 'var(--text-muted)',
    textAlign: 'center',
    marginTop: 24,
    position: 'relative',
    zIndex: 1,
  },
  collapseBtn: {
    display: 'block',
    margin: '20px auto 0',
    fontSize: 13,
    color: 'var(--text-muted)',
  },
  indicator: {
    position: 'absolute',
    top: 16,
    fontSize: 14,
    fontWeight: 500,
    zIndex: 10,
    pointerEvents: 'none',
  },
  indicatorRight: { right: 20 },
  indicatorLeft: { left: 20, color: 'var(--text-muted)' },
  hint: {
    position: 'absolute',
    bottom: 32,
    fontSize: 13,
    color: 'var(--text-dim)',
    letterSpacing: 1,
  },
  feedback: {
    position: 'absolute',
    bottom: 60,
    display: 'flex',
    gap: 12,
    zIndex: 20,
  },
  feedbackBtn: {
    fontSize: 13,
    color: 'var(--text-dim)',
    padding: '8px 16px',
    borderRadius: 20,
    border: '1px solid var(--text-muted)',
  },
  empty: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  backBtn: {
    fontSize: 14,
    color: 'var(--text-dim)',
    padding: '10px 24px',
    borderRadius: 20,
    border: '1px solid var(--text-muted)',
  },
}
