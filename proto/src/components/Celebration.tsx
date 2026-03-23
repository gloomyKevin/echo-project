import { motion } from 'framer-motion'
import { useStore } from '../store'
import type { Card, CheckinRecord } from '../types'

interface Props {
  card: Card
  checkin: CheckinRecord
  onDone: () => void
}

const EMOTION_LABELS: Record<string, string> = {
  refreshed: '焕然一新', satisfied: '满足', surprised: '有点意外',
  peaceful: '平静下来了', excited: '很兴奋', touched: '有所触动', proud: '挺自豪的',
}

const DIM_LABELS: Record<string, string> = {
  health: '健康', finance: '财务', career: '成长',
  social: '关系', environment: '环境', possibility: '可能性',
}

export default function Celebration({ card, checkin, onDone }: Props) {
  const scores = useStore(s => s.dimensionScores)
  const deltas = checkin.dimensionDelta
  const impactedDims = Object.entries(deltas).filter(([, v]) => (v ?? 0) !== 0)

  return (
    <motion.div
      style={styles.container}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Burst particles */}
      <Particles />

      <div style={styles.content}>
        <motion.div
          style={styles.emoji}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.1, damping: 12 }}
        >
          🎯
        </motion.div>

        <motion.h1
          style={styles.heading}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          做到了
        </motion.h1>

        <motion.p
          style={styles.subheading}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {card.title}
        </motion.p>

        {/* Emotion */}
        <motion.div
          style={styles.emotionTag}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          {EMOTION_LABELS[checkin.emotion] ?? checkin.emotion}
        </motion.div>

        {/* Dimension impact */}
        {impactedDims.length > 0 && (
          <motion.div
            style={styles.dimBox}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            {impactedDims.map(([dim, val]) => (
              <div key={dim} style={styles.dimRow}>
                <span style={styles.dimLabel}>{DIM_LABELS[dim] ?? dim}</span>
                <div style={styles.dimBar}>
                  <div
                    style={{
                      ...styles.dimFill,
                      width: `${(scores[dim as keyof typeof scores] ?? 50)}%`,
                    }}
                  />
                </div>
                <span style={styles.dimDelta}>+{val}</span>
              </div>
            ))}
          </motion.div>
        )}

        {checkin.note && (
          <motion.p
            style={styles.note}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            「{checkin.note}」
          </motion.p>
        )}

        <motion.button
          style={styles.doneBtn}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          onClick={onDone}
        >
          继续探索
        </motion.button>
      </div>
    </motion.div>
  )
}

function Particles() {
  const colors = ['#818cf8', '#4ade80', '#f472b6', '#facc15', '#38bdf8']
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {Array.from({ length: 18 }).map((_, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: colors[i % colors.length],
            left: `${10 + (i * 5) % 80}%`,
            top: '40%',
          }}
          initial={{ y: 0, opacity: 1, scale: 1 }}
          animate={{ y: -(120 + (i % 4) * 40), x: (i % 2 === 0 ? 1 : -1) * (20 + (i % 5) * 15), opacity: 0, scale: 0 }}
          transition={{ duration: 0.8 + (i % 3) * 0.2, delay: i * 0.03, ease: 'easeOut' }}
        />
      ))}
    </div>
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
    background: 'var(--bg)',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 32px',
    width: '100%',
    maxWidth: 380,
    zIndex: 10,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  heading: {
    fontSize: 36,
    fontWeight: 800,
    color: 'var(--text)',
    marginBottom: 8,
  },
  subheading: {
    fontSize: 17,
    color: 'var(--text-muted)',
    marginBottom: 16,
    textAlign: 'center',
  },
  emotionTag: {
    background: 'var(--surface2)',
    color: 'var(--accent)',
    padding: '6px 16px',
    borderRadius: 20,
    fontSize: 14,
    marginBottom: 28,
  },
  dimBox: {
    width: '100%',
    background: 'var(--surface)',
    borderRadius: 16,
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 20,
  },
  dimRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  dimLabel: {
    fontSize: 13,
    color: 'var(--text-muted)',
    width: 44,
    flexShrink: 0,
  },
  dimBar: {
    flex: 1,
    height: 6,
    background: 'var(--surface2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  dimFill: {
    height: '100%',
    background: 'var(--accent)',
    borderRadius: 3,
    transition: 'width 0.6s ease',
  },
  dimDelta: {
    fontSize: 13,
    color: 'var(--green)',
    width: 28,
    textAlign: 'right',
    flexShrink: 0,
  },
  note: {
    fontSize: 14,
    color: 'var(--text-muted)',
    fontStyle: 'italic',
    marginBottom: 32,
    textAlign: 'center',
  },
  doneBtn: {
    background: 'var(--accent)',
    color: 'white',
    fontWeight: 600,
    fontSize: 16,
    padding: '14px 48px',
    borderRadius: 16,
    cursor: 'pointer',
    marginTop: 8,
  },
}
