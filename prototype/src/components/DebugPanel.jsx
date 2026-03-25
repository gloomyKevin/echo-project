import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import useStore from '../store/useStore'

export default function DebugPanel() {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ x: window.innerWidth - 56, y: window.innerHeight - 100 })
  const dragging = useRef(false)
  const startPos = useRef({ x: 0, y: 0 })
  const offset = useRef({ x: 0, y: 0 })

  const { reset, stars, dismissed, view, setView, simulateCheckins, simulateAscends,
    insertNote, setFeatured, getAvailableCards } = useStore()

  const brightCount = stars.filter(s => s.type === 'bright').length
  const darkCount = stars.filter(s => s.type === 'dark').length

  const handlePointerDown = (e) => {
    startPos.current = { x: e.clientX, y: e.clientY }
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
    dragging.current = false
    e.target.setPointerCapture(e.pointerId)
  }
  const handlePointerMove = (e) => {
    const dx = e.clientX - startPos.current.x
    const dy = e.clientY - startPos.current.y
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragging.current = true
    if (dragging.current) {
      setPos({ x: e.clientX - offset.current.x, y: e.clientY - offset.current.y })
    }
  }
  const handlePointerUp = () => {
    if (!dragging.current) setOpen(o => !o)
  }

  const available = getAvailableCards()

  return (
    <>
      <div
        style={{ ...styles.icon, left: pos.x, top: pos.y }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        ⚙
      </div>

      {open && (
        <motion.div
          style={styles.panel}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div style={styles.title}>调试面板</div>

          <div style={styles.info}>
            视图: {view} · 亮★{brightCount} · 暗○{darkCount} · 沉降{dismissed.length} · 剩余{available.length}
          </div>

          <div style={styles.section}>数据</div>
          <div style={styles.buttons}>
            <Btn onClick={() => { reset(); setOpen(false) }}>重置全部</Btn>
            <Btn onClick={() => simulateCheckins(3)}>模拟打卡×3</Btn>
            <Btn onClick={() => simulateAscends(5)}>模拟飞升×5</Btn>
          </div>

          <div style={styles.section}>导航</div>
          <div style={styles.buttons}>
            <Btn onClick={() => { setView('landing'); setOpen(false) }}>着陆</Btn>
            <Btn onClick={() => { setView('cards'); setOpen(false) }}>卡片</Btn>
            <Btn onClick={() => { setView('starmap'); setOpen(false) }}>星图</Btn>
          </div>

          <div style={styles.section}>特殊卡片</div>
          <div style={styles.buttons}>
            <Btn onClick={() => {
              const c = available[0]
              if (c) { setFeatured(c.id); setView('cards'); setOpen(false) }
            }}>下一张设为精选</Btn>
            <Btn onClick={() => {
              insertNote({ type: 'profile', content: '你好像更喜欢「探索」类的体验。' })
              setView('cards'); setOpen(false)
            }}>信笺：画像确认</Btn>
            <Btn onClick={() => {
              insertNote({ type: 'milestone', content: '你的天空有 5 颗星了。' })
              setView('cards'); setOpen(false)
            }}>信笺：里程碑</Btn>
            <Btn onClick={() => {
              insertNote({ type: 'featured', content: '今天为你选了一张。' })
              setView('cards'); setOpen(false)
            }}>信笺：精选预告</Btn>
          </div>

          <button style={styles.close} onClick={() => setOpen(false)}>关闭</button>
        </motion.div>
      )}
    </>
  )
}

function Btn({ onClick, children }) {
  return (
    <button style={styles.btn} onClick={onClick}>{children}</button>
  )
}

const styles = {
  icon: {
    position: 'fixed', zIndex: 9999,
    width: 38, height: 38, borderRadius: '50%',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.12)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 16, cursor: 'grab', touchAction: 'none',
    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
  },
  panel: {
    position: 'fixed', bottom: 16, left: 16, right: 16,
    maxWidth: 380, margin: '0 auto', zIndex: 9998,
    background: 'rgba(14, 20, 28, 0.96)',
    border: '1px solid var(--border)', borderRadius: 16,
    padding: '16px 18px 18px',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    maxHeight: '70vh', overflowY: 'auto',
  },
  title: { fontSize: 13, color: 'var(--text-dim)', marginBottom: 8, textAlign: 'center' },
  info: { fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, textAlign: 'center', lineHeight: 1.5 },
  section: { fontSize: 11, color: 'var(--text-muted)', marginTop: 10, marginBottom: 6, letterSpacing: 1 },
  buttons: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 },
  btn: {
    padding: '9px 0', borderRadius: 10,
    border: '1px solid var(--border)', fontSize: 12,
    color: 'var(--text-dim)', background: 'rgba(255,255,255,0.03)',
  },
  close: {
    width: '100%', marginTop: 12, padding: '7px 0',
    fontSize: 12, color: 'var(--text-muted)',
  },
}
