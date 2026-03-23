import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Card, EmotionType } from '../types'

interface Props {
  card: Card
  onSubmit: (emotion: EmotionType, note: string) => void
  onCancel: () => void
}

const EMOTIONS: { key: EmotionType; label: string; emoji: string }[] = [
  { key: 'refreshed', label: '焕然', emoji: '🌊' },
  { key: 'satisfied', label: '满足', emoji: '😌' },
  { key: 'surprised', label: '意外', emoji: '✨' },
  { key: 'peaceful', label: '平静', emoji: '🍃' },
  { key: 'excited', label: '兴奋', emoji: '⚡' },
  { key: 'touched', label: '触动', emoji: '🫧' },
  { key: 'proud', label: '自豪', emoji: '🏔' },
]

export default function CheckinModal({ card, onSubmit, onCancel }: Props) {
  const [selected, setSelected] = useState<EmotionType | null>(null)
  const [note, setNote] = useState('')

  return (
    <motion.div
      style={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        style={styles.sheet}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      >
        <div style={styles.handle} />

        <div style={{ padding: '0 24px 32px' }}>
          {/* Card reference */}
          <div style={{ ...styles.cardRef, background: card.coverColor }}>
            <span style={styles.cardRefTitle}>{card.title}</span>
          </div>

          <h2 style={styles.heading}>做完了，感觉怎么样？</h2>

          {/* Emotion grid */}
          <div style={styles.emotionGrid}>
            {EMOTIONS.map(e => (
              <button
                key={e.key}
                style={{
                  ...styles.emotionBtn,
                  ...(selected === e.key ? styles.emotionSelected : {}),
                }}
                onClick={() => setSelected(e.key)}
              >
                <span style={{ fontSize: 24 }}>{e.emoji}</span>
                <span style={{ fontSize: 12, marginTop: 4 }}>{e.label}</span>
              </button>
            ))}
          </div>

          {/* Note */}
          <textarea
            style={styles.textarea}
            placeholder="随手记两个字（可选）"
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
          />

          {/* Actions */}
          <button
            style={{ ...styles.submitBtn, opacity: selected ? 1 : 0.4 }}
            disabled={!selected}
            onClick={() => selected && onSubmit(selected, note)}
          >
            完成打卡
          </button>
          <button style={styles.cancelBtn} onClick={onCancel}>
            还没做完
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'flex-end',
    zIndex: 100,
  },
  sheet: {
    width: '100%',
    background: 'var(--surface)',
    borderRadius: '24px 24px 0 0',
    paddingTop: 12,
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  handle: {
    width: 40,
    height: 4,
    background: 'var(--border)',
    borderRadius: 2,
    margin: '0 auto 20px',
  },
  cardRef: {
    borderRadius: 12,
    padding: '12px 16px',
    marginBottom: 20,
  },
  cardRefTitle: {
    color: 'white',
    fontWeight: 600,
    fontSize: 15,
  },
  heading: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 20,
    color: 'var(--text)',
  },
  emotionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 8,
    marginBottom: 20,
  },
  emotionBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '12px 8px',
    background: 'var(--surface2)',
    borderRadius: 12,
    color: 'var(--text-muted)',
    border: '2px solid transparent',
    cursor: 'pointer',
  },
  emotionSelected: {
    border: '2px solid var(--accent)',
    background: 'var(--accent-dim)',
    color: 'var(--text)',
  },
  textarea: {
    width: '100%',
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '12px 14px',
    color: 'var(--text)',
    fontSize: 15,
    resize: 'none',
    outline: 'none',
    fontFamily: 'inherit',
    marginBottom: 16,
  },
  submitBtn: {
    width: '100%',
    background: 'var(--accent)',
    color: 'white',
    fontWeight: 600,
    fontSize: 16,
    padding: '14px',
    borderRadius: 14,
    marginBottom: 10,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  cancelBtn: {
    width: '100%',
    background: 'transparent',
    color: 'var(--text-muted)',
    fontSize: 15,
    padding: '10px',
    borderRadius: 14,
    cursor: 'pointer',
  },
}
