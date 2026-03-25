import { motion } from 'framer-motion'
import useStore from '../store/useStore'

const EMOTION_LABELS = {
  heal: '治愈', happy: '开心', relief: '释然',
  tired: '疲惫', breakthrough: '突破', plain: '平淡',
}

function getContextLine() {
  const h = new Date().getHours()
  const day = new Date().getDay()
  const isWeekend = day === 0 || day === 6
  if (h >= 6 && h < 10) return isWeekend ? '周末早晨。不用赶。' : '早上好。'
  if (h >= 10 && h < 12) return isWeekend ? '上午，有整块时间。' : '上午。'
  if (h >= 12 && h < 14) return '午后。'
  if (h >= 14 && h < 17) return isWeekend ? '下午，阳光还在。' : '下午了。'
  if (h >= 17 && h < 19) return day === 5 ? '周五傍晚。' : '傍晚。'
  if (h >= 19 && h < 22) return day === 5 ? '周五晚上。' : '晚上。'
  if (h >= 22 || h < 2) return '深夜了。'
  return '夜里。'
}

export default function Landing() {
  const setView = useStore(s => s.setView)
  const isFirstVisit = useStore(s => s.isFirstVisit)
  const markVisited = useStore(s => s.markVisited)
  const stars = useStore(s => s.stars)
  const getCardById = useStore(s => s.getCardById)

  const brightStars = stars.filter(s => s.type === 'bright')
  const darkStars = stars.filter(s => s.type === 'dark')

  const enterCards = () => {
    if (isFirstVisit) markVisited()
    setView('cards')
  }

  // 状态文案
  const statusLine = (() => {
    // 优先级：暗星等待 > 上次体验 > 无
    const threeDays = 3 * 864e5
    const waiting = darkStars.find(s => (Date.now() - s.date) > threeDays)
    if (waiting) {
      const c = getCardById(waiting.cardId)
      return c ? `「${c.invite.split('\n')[0]}」还在等你。` : null
    }
    const last = brightStars[brightStars.length - 1]
    if (last) {
      const c = getCardById(last.cardId)
      const days = Math.floor((Date.now() - last.checkinDate) / 864e5)
      const t = days === 0 ? '今天' : days === 1 ? '昨天' : `${days} 天前`
      return c ? `上次：「${c.invite.split('\n')[0]}」· ${t} · ${EMOTION_LABELS[last.emotion] || ''}` : null
    }
    return null
  })()

  return (
    <motion.div
      style={styles.container}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
      onClick={enterCards}
    >
      <motion.div
        style={styles.content}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <div style={styles.contextLine}>{getContextLine()}</div>
        {statusLine && (
          <motion.div
            style={styles.statusLine}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.45 }}
            transition={{ delay: 0.7 }}
          >
            {statusLine}
          </motion.div>
        )}
      </motion.div>

      <motion.div
        style={styles.tapHint}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.15 }}
        transition={{ delay: 1.5 }}
      >
        轻触任意位置
      </motion.div>
    </motion.div>
  )
}

const styles = {
  container: {
    position: 'absolute', inset: 0,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '0 32px', zIndex: 10, cursor: 'pointer',
  },
  content: {
    textAlign: 'center',
    display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center',
  },
  contextLine: {
    fontSize: 18, fontWeight: 300, color: 'var(--text-dim)', letterSpacing: 1.5,
  },
  statusLine: {
    fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.7, maxWidth: 260,
  },
  tapHint: {
    position: 'absolute', bottom: 52,
    fontSize: 13, color: 'var(--text)', letterSpacing: 1,
  },
}
