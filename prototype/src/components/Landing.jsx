import { motion } from 'framer-motion'
import useStore from '../store/useStore'

const EMOTIONS_LABEL = {
  heal: '治愈', happy: '开心', relief: '释然',
  tired: '疲惫', breakthrough: '突破', plain: '平淡',
}

export default function Landing() {
  const setView = useStore(s => s.setView)
  const isFirstVisit = useStore(s => s.isFirstVisit)
  const markVisited = useStore(s => s.markVisited)
  const brightStars = useStore(s => s.brightStars)
  const darkStars = useStore(s => s.darkStars)
  const getCardById = useStore(s => s.getCardById)

  // 首次访问直接进卡片流
  if (isFirstVisit) {
    return (
      <motion.div
        style={styles.container}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          style={styles.firstVisit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div style={styles.greeting}>你好</div>
          <div style={styles.sub}>这里有一些你可能想做的事</div>
        </motion.div>
        <motion.button
          style={styles.enter}
          onClick={() => { markVisited(); setView('cards') }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          whileTap={{ scale: 0.97 }}
        >
          看看
        </motion.button>
      </motion.div>
    )
  }

  // 非首次：展示天空状态
  const lastBright = brightStars[brightStars.length - 1]
  const lastCard = lastBright ? getCardById(lastBright.cardId) : null

  // 找超过 3 天的暗星
  const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000
  const waitingStar = darkStars.find(s => s.timestamp < threeDaysAgo)
  const waitingCard = waitingStar ? getCardById(waitingStar.cardId) : null

  return (
    <motion.div
      style={styles.container}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div style={styles.skyStatus}>
        <div style={styles.skyTitle}>你的天空</div>
        <div style={styles.counts}>
          <span style={styles.bright}>★ {brightStars.length}</span>
          <span style={styles.dark}>○ {darkStars.length}</span>
        </div>
      </div>

      {lastCard && (
        <motion.div
          style={styles.lastExp}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div style={styles.lastLabel}>上次：</div>
          <div style={styles.lastTitle}>
            「{lastCard.invite.replace(/\n/g, '')}」
          </div>
          <div style={styles.lastMeta}>
            {new Date(lastBright.timestamp).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
            {' · '}
            {EMOTIONS_LABEL[lastBright.emotion] || lastBright.emotion}
          </div>
        </motion.div>
      )}

      {waitingCard && (
        <motion.div
          style={styles.waiting}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.5 }}
        >
          「{waitingCard.invite.split('\n')[0]}」还在等你。不急。
        </motion.div>
      )}

      <motion.button
        style={styles.enter}
        onClick={() => setView('cards')}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        whileTap={{ scale: 0.97 }}
      >
        看看今天有什么
      </motion.button>
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
    gap: 24,
  },
  firstVisit: {
    textAlign: 'center',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 300,
    letterSpacing: 2,
    marginBottom: 12,
  },
  sub: {
    fontSize: 15,
    color: 'var(--text-dim)',
  },
  skyStatus: {
    textAlign: 'center',
  },
  skyTitle: {
    fontSize: 14,
    color: 'var(--text-dim)',
    marginBottom: 8,
    letterSpacing: 2,
  },
  counts: {
    fontSize: 24,
    fontWeight: 300,
    display: 'flex',
    gap: 20,
    justifyContent: 'center',
  },
  bright: { color: 'var(--blue)' },
  dark: { color: 'var(--text-muted)' },
  lastExp: {
    textAlign: 'center',
    maxWidth: 280,
  },
  lastLabel: {
    fontSize: 13,
    color: 'var(--text-dim)',
    marginBottom: 4,
  },
  lastTitle: {
    fontSize: 15,
    lineHeight: 1.6,
    marginBottom: 4,
  },
  lastMeta: {
    fontSize: 13,
    color: 'var(--text-dim)',
  },
  waiting: {
    fontSize: 13,
    color: 'var(--text-dim)',
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 1.6,
  },
  enter: {
    fontSize: 15,
    color: 'var(--text-dim)',
    padding: '12px 32px',
    borderRadius: 24,
    border: '1px solid var(--text-muted)',
    marginTop: 12,
    transition: 'all 0.2s',
  },
}
