import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../store/useStore'

const EMOTION_COLORS = {
  heal: 'var(--blue)',
  happy: 'var(--warm)',
  relief: 'var(--green)',
  tired: 'var(--white)',
  breakthrough: 'var(--purple)',
  plain: 'var(--white)',
}

const EMOTION_RESPONSES = {
  heal: '有些事做完就会觉得，本来就该这样。',
  happy: '对吧。',
  relief: '有些重量，放下的时候才发现它一直在。',
  tired: '累了就是真的做了。休息一下。',
  breakthrough: '第一次做的事，你永远记得当时的感觉。',
  plain: '不是每次都有大感觉。但你去做了。',
}

// 动作原子到星图区域的映射
const ACTION_REGIONS = {
  explore:  { cx: 0.2, cy: 0.2 },
  taste:    { cx: 0.7, cy: 0.15 },
  create:   { cx: 0.85, cy: 0.5 },
  connect:  { cx: 0.5, cy: 0.3 },
  move:     { cx: 0.15, cy: 0.6 },
  observe:  { cx: 0.5, cy: 0.7 },
  reflect:  { cx: 0.35, cy: 0.85 },
}

function getStarPosition(card, index) {
  const action = card.actions.primary
  const region = ACTION_REGIONS[action] || { cx: 0.5, cy: 0.5 }
  // 在区域内加随机偏移（用 index 做伪随机）
  const offsetX = ((index * 137.5) % 100 - 50) / 500
  const offsetY = ((index * 73.1) % 100 - 50) / 500
  return {
    x: region.cx + offsetX,
    y: region.cy + offsetY,
  }
}

// 生成背景微弱远光
function generateBgStars(count) {
  const stars = []
  for (let i = 0; i < count; i++) {
    stars.push({
      x: (i * 173.3 % 100) / 100,
      y: (i * 89.7 % 100) / 100,
      opacity: 0.1 + (i * 37.1 % 20) / 100,
      size: 1 + (i % 3) * 0.5,
    })
  }
  return stars
}

export default function StarMap() {
  const brightStars = useStore(s => s.brightStars)
  const darkStars = useStore(s => s.darkStars)
  const getCardById = useStore(s => s.getCardById)
  const setView = useStore(s => s.setView)
  const startCheckin = useStore(s => s.startCheckin)
  const justCheckedIn = useStore(s => s.justCheckedIn)
  const clearJustCheckedIn = useStore(s => s.clearJustCheckedIn)

  const [selected, setSelected] = useState(null) // { type: 'bright'|'dark', data, card }
  const [showResponse, setShowResponse] = useState(!!justCheckedIn)

  const bgStars = useMemo(() => generateBgStars(40), [])

  // 刚打卡完成时的动画
  const justCheckedInStar = justCheckedIn
    ? brightStars.find(s => s.cardId === justCheckedIn)
    : null

  useEffect(() => {
    if (justCheckedIn) {
      setShowResponse(true)
      const timer = setTimeout(() => {
        setShowResponse(false)
        clearJustCheckedIn()
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [justCheckedIn, clearJustCheckedIn])

  // 计算连线（共享主动作原子的亮星之间）
  const connections = useMemo(() => {
    const lines = []
    for (let i = 0; i < brightStars.length; i++) {
      for (let j = i + 1; j < brightStars.length; j++) {
        const cardA = getCardById(brightStars[i].cardId)
        const cardB = getCardById(brightStars[j].cardId)
        if (cardA && cardB && cardA.actions.primary === cardB.actions.primary) {
          const posA = getStarPosition(cardA, i)
          const posB = getStarPosition(cardB, j)
          lines.push({ x1: posA.x, y1: posA.y, x2: posB.x, y2: posB.y })
        }
      }
    }
    return lines
  }, [brightStars, getCardById])

  // 洞察检查
  const insight = useMemo(() => {
    if (brightStars.length === 3) return '三颗星了。这是一个开始。'
    if (brightStars.length === 10) return '你的天空开始有形状了。'

    // 检查是否有 3+ 颗同原子的亮星
    const actionCounts = {}
    brightStars.forEach(s => {
      const card = getCardById(s.cardId)
      if (card) {
        const a = card.actions.primary
        actionCounts[a] = (actionCounts[a] || 0) + 1
      }
    })
    const dominant = Object.entries(actionCounts).find(([, count]) => count >= 3)
    if (dominant) {
      const labels = {
        explore: '探索', taste: '尝试新事物', create: '创造',
        connect: '和人连接', move: '让身体动起来', observe: '安静感受', reflect: '向内看自己',
      }
      return `这几颗星连在了一起。你好像特别喜欢${labels[dominant[0]] || dominant[0]}。`
    }
    return null
  }, [brightStars, getCardById])

  return (
    <motion.div
      style={styles.container}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* 返回按钮 */}
      <button style={styles.back} onClick={() => setView('landing')}>
        ← 地面
      </button>

      {/* 星图区域 */}
      <div style={styles.sky}>
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
          {/* 背景远光 */}
          {bgStars.map((s, i) => (
            <circle
              key={`bg-${i}`}
              cx={`${s.x * 100}%`}
              cy={`${s.y * 100}%`}
              r={s.size}
              fill="#E8E6E3"
              opacity={s.opacity}
            />
          ))}

          {/* 连线 */}
          {connections.map((line, i) => (
            <motion.line
              key={`line-${i}`}
              x1={`${line.x1 * 100}%`}
              y1={`${line.y1 * 100}%`}
              x2={`${line.x2 * 100}%`}
              y2={`${line.y2 * 100}%`}
              stroke="var(--text-muted)"
              strokeWidth={0.5}
              opacity={0.4}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1 }}
            />
          ))}
        </svg>

        {/* 暗星 */}
        {darkStars.map((star, i) => {
          const card = getCardById(star.cardId)
          if (!card) return null
          const pos = getStarPosition(card, brightStars.length + i)
          const age = Date.now() - star.timestamp
          const dimLevel = age > 21 * 86400000 ? 0.15 : age > 7 * 86400000 ? 0.25 : 0.4

          return (
            <motion.div
              key={star.cardId}
              style={{
                ...styles.star,
                left: `${pos.x * 100}%`,
                top: `${pos.y * 100}%`,
                opacity: dimLevel,
              }}
              initial={{ scale: 0 }}
              animate={{
                scale: 1,
                opacity: age > 7 * 86400000
                  ? [dimLevel, dimLevel + 0.1, dimLevel]
                  : dimLevel,
              }}
              transition={age > 7 * 86400000
                ? { opacity: { repeat: Infinity, duration: 3 } }
                : { duration: 0.5 }
              }
              onClick={() => setSelected({ type: 'dark', data: star, card })}
            >
              ○
            </motion.div>
          )
        })}

        {/* 亮星 */}
        {brightStars.map((star, i) => {
          const card = getCardById(star.cardId)
          if (!card) return null
          const pos = getStarPosition(card, i)
          const color = EMOTION_COLORS[star.emotion] || 'var(--white)'
          const isNew = star.cardId === justCheckedIn

          return (
            <motion.div
              key={star.cardId}
              style={{
                ...styles.star,
                ...styles.brightStar,
                left: `${pos.x * 100}%`,
                top: `${pos.y * 100}%`,
                color,
                textShadow: `0 0 12px ${color}`,
              }}
              initial={isNew ? { scale: 0, opacity: 0 } : { scale: 1 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={isNew
                ? { type: 'spring', stiffness: 200, damping: 10, delay: 0.3 }
                : { duration: 0.3 }
              }
              onClick={() => setSelected({ type: 'bright', data: star, card })}
            >
              ★
            </motion.div>
          )
        })}
      </div>

      {/* 底部信息 */}
      <div style={styles.footer}>
        <span style={styles.footerText}>
          你的天空 · {brightStars.length + darkStars.length} 颗星
        </span>
      </div>

      {/* 打卡完成回应 */}
      <AnimatePresence>
        {showResponse && justCheckedInStar && (
          <motion.div
            style={styles.response}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: 0.8 }}
          >
            {EMOTION_RESPONSES[justCheckedInStar.emotion]}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 洞察 */}
      {insight && !showResponse && (
        <motion.div
          style={styles.insight}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.5 }}
        >
          {insight}
        </motion.div>
      )}

      {/* 星详情浮层 */}
      <AnimatePresence>
        {selected && (
          <motion.div
            style={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              style={styles.detail}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div style={styles.detailInvite}>
                {selected.card.invite.split('\n').map((l, i) => <div key={i}>{l}</div>)}
              </div>

              {selected.type === 'bright' && (
                <>
                  <div style={{
                    ...styles.detailEmotion,
                    color: EMOTION_COLORS[selected.data.emotion],
                  }}>
                    {({ heal: '治愈', happy: '开心', relief: '释然', tired: '疲惫', breakthrough: '突破', plain: '平淡' })[selected.data.emotion]}
                  </div>
                  <div style={styles.detailDate}>
                    {new Date(selected.data.timestamp).toLocaleDateString('zh-CN')}
                  </div>
                  {selected.data.focusAnswer && (
                    <div style={styles.detailAnswer}>
                      「{selected.data.focusAnswer}」
                    </div>
                  )}
                </>
              )}

              {selected.type === 'dark' && (
                <motion.button
                  style={styles.checkinBtn}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    setSelected(null)
                    startCheckin(selected.card.id)
                  }}
                >
                  我做了 ✦
                </motion.button>
              )}

              <button style={styles.closeBtn} onClick={() => setSelected(null)}>
                关闭
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

const styles = {
  container: {
    height: '100%',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  },
  back: {
    position: 'absolute',
    top: 16,
    left: 16,
    fontSize: 14,
    color: 'var(--text-dim)',
    zIndex: 10,
  },
  sky: {
    flex: 1,
    position: 'relative',
    margin: '50px 20px 0',
  },
  star: {
    position: 'absolute',
    fontSize: 16,
    cursor: 'pointer',
    transform: 'translate(-50%, -50%)',
    zIndex: 2,
  },
  brightStar: {
    fontSize: 18,
  },
  footer: {
    padding: '16px 0 24px',
    textAlign: 'center',
  },
  footerText: {
    fontSize: 13,
    color: 'var(--text-muted)',
    letterSpacing: 1,
  },
  response: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 14,
    color: 'var(--text-dim)',
    lineHeight: 1.8,
    padding: '0 32px',
  },
  insight: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 13,
    color: 'var(--text-dim)',
    lineHeight: 1.7,
    padding: '0 32px',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(15, 20, 25, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  detail: {
    background: 'var(--bg-light)',
    borderRadius: 16,
    padding: '32px 28px',
    maxWidth: 300,
    width: '85%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  detailInvite: {
    fontSize: 16,
    fontWeight: 300,
    lineHeight: 1.7,
    textAlign: 'center',
  },
  detailEmotion: {
    fontSize: 15,
  },
  detailDate: {
    fontSize: 13,
    color: 'var(--text-muted)',
  },
  detailAnswer: {
    fontSize: 14,
    color: 'var(--text-dim)',
    lineHeight: 1.6,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  checkinBtn: {
    padding: '12px 32px',
    borderRadius: 20,
    border: '1px solid var(--blue)',
    color: 'var(--blue)',
    fontSize: 15,
    marginTop: 8,
  },
  closeBtn: {
    fontSize: 13,
    color: 'var(--text-muted)',
    marginTop: 4,
  },
}
