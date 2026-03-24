import { useState } from 'react'
import { motion } from 'framer-motion'
import useStore from '../store/useStore'

const EMOTIONS = [
  { key: 'heal', label: '治愈', color: 'var(--blue)' },
  { key: 'happy', label: '开心', color: 'var(--warm)' },
  { key: 'relief', label: '释然', color: 'var(--green)' },
  { key: 'tired', label: '疲惫', color: 'var(--white)' },
  { key: 'breakthrough', label: '突破', color: 'var(--purple)' },
  { key: 'plain', label: '平淡', color: 'var(--white)' },
]

export default function Checkin() {
  const checkinCardId = useStore(s => s.checkinCardId)
  const getCardById = useStore(s => s.getCardById)
  const completeCheckin = useStore(s => s.completeCheckin)

  const card = getCardById(checkinCardId)
  const [emotion, setEmotion] = useState(null)
  const [focusAnswer, setFocusAnswer] = useState('')
  const [step, setStep] = useState('emotion') // emotion | focus

  if (!card) return null

  const handleSelectEmotion = (emo) => {
    setEmotion(emo)
    setStep('focus')
  }

  const handleComplete = () => {
    completeCheckin(card.id, emotion.key, focusAnswer)
  }

  return (
    <motion.div
      style={styles.container}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* 卡片标题 */}
      <motion.div
        style={styles.title}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {card.invite.split('\n')[0]}
      </motion.div>

      <motion.div
        style={styles.done}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        你做到了。
      </motion.div>

      {step === 'emotion' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div style={styles.label}>选一个感受</div>
          <div style={styles.emotionGrid}>
            {EMOTIONS.map(emo => (
              <motion.button
                key={emo.key}
                style={{
                  ...styles.emotionBtn,
                  borderColor: emotion?.key === emo.key ? emo.color : 'var(--text-muted)',
                  color: emotion?.key === emo.key ? emo.color : 'var(--text-dim)',
                }}
                whileTap={{ scale: 0.95 }}
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
          style={styles.focusSection}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* 情绪已选显示 */}
          <div style={{ ...styles.selectedEmotion, color: emotion.color }}>
            {emotion.label}
          </div>

          {/* 焦点追问 */}
          <div style={styles.focusQ}>{card.focusQuestion}</div>
          <textarea
            style={styles.textarea}
            placeholder="写一句话，也可以不写"
            value={focusAnswer}
            onChange={e => setFocusAnswer(e.target.value)}
            rows={2}
          />

          <motion.button
            style={styles.completeBtn}
            whileTap={{ scale: 0.96 }}
            onClick={handleComplete}
          >
            完成 ✦
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  )
}

const styles = {
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 32px',
    gap: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 300,
    textAlign: 'center',
    lineHeight: 1.6,
    maxWidth: 280,
  },
  done: {
    fontSize: 14,
    color: 'var(--text-dim)',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    color: 'var(--text-dim)',
    textAlign: 'center',
    marginBottom: 16,
  },
  emotionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 12,
    maxWidth: 300,
  },
  emotionBtn: {
    padding: '12px 0',
    borderRadius: 12,
    border: '1px solid var(--text-muted)',
    fontSize: 15,
    transition: 'all 0.2s',
  },
  focusSection: {
    width: '100%',
    maxWidth: 320,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
  },
  selectedEmotion: {
    fontSize: 16,
    fontWeight: 400,
  },
  focusQ: {
    fontSize: 15,
    color: 'var(--text)',
    textAlign: 'center',
    lineHeight: 1.6,
  },
  textarea: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 12,
    border: '1px solid var(--text-muted)',
    fontSize: 14,
    lineHeight: 1.6,
    resize: 'none',
    color: 'var(--text)',
    background: 'var(--bg-light)',
  },
  completeBtn: {
    padding: '14px 40px',
    borderRadius: 24,
    border: '1px solid var(--text-muted)',
    fontSize: 15,
    color: 'var(--text)',
    marginTop: 8,
    transition: 'all 0.2s',
  },
}
