import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../store/useStore'
import { getStarPos } from './StarSky'

const EMOTION_COLORS = {
  heal: '#5B9CF5', happy: '#F59E42', relief: '#4ADE80',
  tired: '#C9CDD4', breakthrough: '#A78BFA', plain: '#C9CDD4',
}
const EMOTION_LABELS = {
  heal: '治愈', happy: '开心', relief: '释然',
  tired: '疲惫', breakthrough: '突破', plain: '平淡',
}
const EMOTION_RESPONSES = {
  heal: '有些事做完就会觉得，本来就该这样。',
  happy: '对吧。',
  relief: '有些重量，放下的时候才发现它一直在。',
  tired: '累了就是真的做了。休息一下。',
  breakthrough: '第一次做的事，你永远记得当时的感觉。',
  plain: '不是每次都有大感觉。但你去做了。',
}

const ATMO_HEX = {
  warm: '#F59E42', blue: '#5B9CF5', green: '#4ADE80',
  purple: '#A78BFA', white: '#9CA3AF',
}

export default function StarMap() {
  const stars = useStore(s => s.stars)
  const dismissed = useStore(s => s.dismissed)
  const getCardById = useStore(s => s.getCardById)
  const setView = useStore(s => s.setView)
  const startCheckin = useStore(s => s.startCheckin)
  const recover = useStore(s => s.recover)
  const justLitStarId = useStore(s => s.justLitStarId)
  const clearJustLit = useStore(s => s.clearJustLit)

  const [selected, setSelected] = useState(null)
  const [showDismissed, setShowDismissed] = useState(false)
  const [showResponse, setShowResponse] = useState(!!justLitStarId)

  const brightStars = stars.filter(s => s.type === 'bright')
  const darkStars = stars.filter(s => s.type === 'dark')
  const justLitStar = justLitStarId ? brightStars.find(s => s.cardId === justLitStarId) : null

  useEffect(() => {
    if (justLitStarId) {
      setShowResponse(true)
      const t = setTimeout(() => { setShowResponse(false); clearJustLit() }, 4000)
      return () => clearTimeout(t)
    }
  }, [justLitStarId, clearJustLit])

  // 洞察
  const insight = useMemo(() => {
    const n = brightStars.length
    if (n === 3) return '三颗星了。这是一个开始。'
    if (n === 10) return '你的天空开始有形状了。'
    const counts = {}
    brightStars.forEach(s => {
      const c = getCardById(s.cardId)
      if (c) counts[c.actions.primary] = (counts[c.actions.primary] || 0) + 1
    })
    const dom = Object.entries(counts).find(([, v]) => v >= 3)
    if (dom) {
      const l = { explore: '探索', taste: '尝试新事物', create: '创造', connect: '和人连接', move: '运动', observe: '安静感受', reflect: '向内看自己' }
      return `这几颗星连在了一起。你好像特别喜欢${l[dom[0]]}。`
    }
    return null
  }, [brightStars, getCardById])

  return (
    <motion.div
      style={styles.container}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
    >
      {/* 星图交互覆盖层 — 点击星星 */}
      <div style={styles.touchLayer}>
        {/* 暗星触摸区 */}
        {darkStars.map((star, i) => {
          const card = getCardById(star.cardId)
          if (!card) return null
          const pos = getStarPos(card, brightStars.length + i)
          return (
            <div
              key={star.cardId}
              style={{ ...styles.touchTarget, left: `${pos.x * 100}%`, top: `${pos.y * 100}%` }}
              onClick={() => setSelected({ star, card, type: 'dark' })}
            />
          )
        })}
        {/* 亮星触摸区 */}
        {brightStars.map((star, i) => {
          const card = getCardById(star.cardId)
          if (!card) return null
          const pos = getStarPos(card, i)
          return (
            <div
              key={star.cardId}
              style={{ ...styles.touchTarget, left: `${pos.x * 100}%`, top: `${pos.y * 100}%` }}
              onClick={() => setSelected({ star, card, type: 'bright' })}
            />
          )
        })}
      </div>

      {/* 底部：退出 + 沉降入口 */}
      <div style={styles.footer}>
        <motion.div
          style={styles.exitHint}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 0.5 }}
          onClick={() => setView('cards')}
        >
          ↓ 返回
        </motion.div>

        {dismissed.length > 0 && (
          <motion.div
            style={styles.dismissedHint}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            transition={{ delay: 0.8 }}
            onClick={() => setShowDismissed(true)}
          >
            还有 {dismissed.length} 张你放下的
          </motion.div>
        )}
      </div>

      {/* 情绪回应 */}
      <AnimatePresence>
        {showResponse && justLitStar && (
          <motion.div
            style={styles.response}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.7, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.8 }}
          >
            {EMOTION_RESPONSES[justLitStar.emotion]}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 洞察 */}
      {insight && !showResponse && (
        <motion.div
          style={styles.insight}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.6 }}
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
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div style={styles.detailTitle}>
                {selected.card.invite.split('\n').map((l, i) => <div key={i}>{l}</div>)}
              </div>

              {selected.type === 'bright' && (
                <>
                  <div style={{ color: EMOTION_COLORS[selected.star.emotion], fontSize: 14 }}>
                    {EMOTION_LABELS[selected.star.emotion]}
                  </div>
                  <div style={styles.detailMeta}>
                    {new Date(selected.star.checkinDate).toLocaleDateString('zh-CN')}
                  </div>
                  {selected.star.focusAnswer && (
                    <div style={styles.detailAnswer}>「{selected.star.focusAnswer}」</div>
                  )}
                </>
              )}

              {selected.type === 'dark' && (
                <motion.button
                  style={styles.checkinBtn}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setSelected(null); startCheckin(selected.card.id) }}
                >
                  ★ 我做了
                </motion.button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 沉降卡片列表 */}
      <AnimatePresence>
        {showDismissed && (
          <motion.div
            style={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDismissed(false)}
          >
            <motion.div
              style={styles.dismissedPanel}
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div style={styles.dismissedTitle}>你放下的</div>
              {dismissed.map(d => {
                const card = getCardById(d.cardId)
                if (!card) return null
                const atmoColor = ATMO_HEX[card.atmosphere] || '#9CA3AF'
                return (
                  <motion.div
                    key={d.cardId}
                    style={styles.dismissedItem}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { recover(d.cardId); setShowDismissed(false) }}
                  >
                    <div style={{ ...styles.atmoDot, background: atmoColor }} />
                    <div style={styles.dismissedItemText}>
                      {card.invite.replace(/\n/g, ' ')}
                    </div>
                    <div style={styles.dismissedRecover}>找回</div>
                  </motion.div>
                )
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

const styles = {
  container: { position: 'absolute', inset: 0, zIndex: 15 },
  touchLayer: { position: 'absolute', inset: '50px 16px 100px', zIndex: 2 },
  touchTarget: {
    position: 'absolute', transform: 'translate(-50%, -50%)',
    width: 44, height: 44, cursor: 'pointer', borderRadius: '50%',
  },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: '16px 0 36px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
    zIndex: 5,
  },
  exitHint: {
    fontSize: 14, color: 'var(--text)', padding: '8px 20px', cursor: 'pointer',
  },
  dismissedHint: {
    fontSize: 13, color: 'var(--text-dim)', padding: '6px 16px', cursor: 'pointer',
  },
  response: {
    position: 'absolute', bottom: 120, left: 0, right: 0,
    textAlign: 'center', fontSize: 14, color: 'var(--text-dim)',
    lineHeight: 1.8, padding: '0 32px', zIndex: 5,
  },
  insight: {
    position: 'absolute', bottom: 120, left: 0, right: 0,
    textAlign: 'center', fontSize: 13, color: 'var(--text-dim)',
    lineHeight: 1.7, padding: '0 32px', zIndex: 5,
  },
  overlay: {
    position: 'absolute', inset: 0,
    background: 'rgba(10, 14, 20, 0.85)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30,
  },
  detail: {
    background: 'rgba(20, 26, 36, 0.95)',
    border: '1px solid var(--border)', borderRadius: 18,
    padding: '32px 28px', maxWidth: 300, width: '85%',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
  },
  detailTitle: { fontSize: 16, fontWeight: 300, lineHeight: 1.7, textAlign: 'center' },
  detailMeta: { fontSize: 13, color: 'var(--text-muted)' },
  detailAnswer: { fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.6, textAlign: 'center' },
  checkinBtn: {
    padding: '12px 32px', borderRadius: 20,
    border: '1px solid var(--border)', color: 'var(--blue)',
    fontSize: 15, marginTop: 8, background: 'rgba(91,156,245,0.08)',
    display: 'flex', alignItems: 'center', gap: 6,
  },
  dismissedPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    background: 'rgba(16, 22, 30, 0.97)',
    border: '1px solid var(--border)', borderRadius: '18px 18px 0 0',
    padding: '24px 20px 40px', maxHeight: '60vh', overflowY: 'auto',
  },
  dismissedTitle: {
    fontSize: 14, color: 'var(--text-dim)', marginBottom: 16, textAlign: 'center',
  },
  dismissedItem: {
    display: 'flex', alignItems: 'center',
    padding: '14px 0', borderBottom: '1px solid var(--border)', gap: 12,
  },
  atmoDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0, opacity: 0.6 },
  dismissedItemText: { fontSize: 14, color: 'var(--text-dim)', flex: 1, lineHeight: 1.5 },
  dismissedRecover: { fontSize: 13, color: 'var(--blue)', flexShrink: 0 },
}
