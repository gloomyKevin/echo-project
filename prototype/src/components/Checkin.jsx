import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../store/useStore'

const EMOTIONS = [
  { key: 'heal', label: '治愈', color: 'var(--blue)' },
  { key: 'happy', label: '开心', color: 'var(--warm)' },
  { key: 'relief', label: '释然', color: 'var(--green)' },
  { key: 'tired', label: '疲惫', color: 'var(--white-star)' },
  { key: 'breakthrough', label: '突破', color: 'var(--purple)' },
  { key: 'plain', label: '平淡', color: 'var(--white-star)' },
]

export default function Checkin() {
  const checkinCardId = useStore(s => s.checkinCardId)
  const getCardById = useStore(s => s.getCardById)
  const completeCheckin = useStore(s => s.completeCheckin)

  const card = getCardById(checkinCardId)
  const [emotion, setEmotion] = useState(null)
  const [focusAnswer, setFocusAnswer] = useState('')
  const [step, setStep] = useState('emotion')

  if (!card) return null

  const handleSelectEmotion = (emo) => {
    setEmotion(emo)
    setTimeout(() => setStep('focus'), 200)
  }

  const handleComplete = () => {
    if (navigator.vibrate) navigator.vibrate(50)
    completeCheckin(card.id, emotion.key, focusAnswer || null)
  }

  return (
    <motion.div
      style={styles.container}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        style={styles.title}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {card.invite.split('\n').map((line, i) => <div key={i}>{line}</div>)}
      </motion.div>

      <AnimatePresence mode="wait">
        {step === 'emotion' && (
          <motion.div
            key="emo"
            style={styles.section}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: 0.2 }}
          >
            <div style={styles.emotionGrid}>
              {EMOTIONS.map(emo => (
                <motion.button
                  key={emo.key}
                  style={{
                    ...styles.emotionBtn,
                    borderColor: emotion?.key === emo.key ? emo.color : 'var(--border)',
                    color: emotion?.key === emo.key ? emo.color : 'var(--text-dim)',
                  }}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => handleSelectEmotion(emo)}
                >
                  {emo.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'focus' && (
          <motion.div
            key="focus"
            style={styles.section}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div style={{ ...styles.selectedEmo, color: emotion.color }}>
              {emotion.label}
            </div>

            <div style={styles.focusQ}>{card.focusQuestion}</div>

            <textarea
              style={styles.textarea}
              placeholder="写一句话，也可以跳过"
              value={focusAnswer}
              onChange={e => setFocusAnswer(e.target.value)}
              rows={2}
            />

            <motion.button
              style={styles.lightBtn}
              whileTap={{ scale: 0.95 }}
              onClick={handleComplete}
            >
              <span style={styles.lightStar}>★</span> 点亮
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

const styles = {
  container: {
    position: 'absolute', inset: 0,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '0 32px', gap: 28, zIndex: 20,
  },
  title: {
    fontSize: 18, fontWeight: 300, textAlign: 'center',
    lineHeight: 1.7, maxWidth: 280,
  },
  section: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 18,
    width: '100%', maxWidth: 320,
  },
  emotionGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10, width: '100%',
  },
  emotionBtn: {
    padding: '14px 0', borderRadius: 12,
    border: '1px solid var(--border)', fontSize: 15,
    transition: 'all 0.2s', background: 'rgba(255,255,255,0.03)',
  },
  selectedEmo: { fontSize: 15, fontWeight: 400 },
  focusQ: {
    fontSize: 15, color: 'var(--text)', textAlign: 'center', lineHeight: 1.7,
  },
  textarea: {
    width: '100%', padding: '14px 16px', borderRadius: 14,
    border: '1px solid var(--border)', fontSize: 14,
    lineHeight: 1.6, resize: 'none', color: 'var(--text)',
    background: 'rgba(255,255,255,0.04)',
  },
  lightBtn: {
    padding: '14px 44px', borderRadius: 24,
    border: '1px solid var(--border)', fontSize: 15,
    color: 'var(--text)', background: 'rgba(255,255,255,0.05)',
    marginTop: 4, display: 'flex', alignItems: 'center', gap: 8,
  },
  lightStar: { fontSize: 16, color: 'var(--blue)' },
}
