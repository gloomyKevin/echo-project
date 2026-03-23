import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore, useClusterProfile } from '../store'

const DIM_LABELS: Record<string, string> = {
  health: '健康', finance: '财务', career: '成长',
  social: '关系', environment: '环境', possibility: '可能性',
}

const DOMAIN_LABELS: Record<string, string> = {
  reflective: '反思', exploration: '探索', social: '社交',
  physical: '体能', creative: '创意', food: '美食',
}

export default function DevPanel() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'cluster' | 'dims' | 'stack'>('cluster')

  const { stack, dimensionScores, swipeHistory, checkins, reset } = useStore()
  const profile = useClusterProfile()

  return (
    <div style={styles.wrapper}>
      {/* Toggle button */}
      <button style={styles.toggle} onClick={() => setOpen(o => !o)}>
        <span style={{ fontSize: 14 }}>🛠</span>
        {!open && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>
            {swipeHistory.length}滑 / {checkins.length}打卡
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            style={styles.panel}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.15 }}
          >
            {/* Header */}
            <div style={styles.panelHeader}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>Dev Panel</span>
              <button style={{ color: 'var(--text-muted)', fontSize: 18, lineHeight: 1 }} onClick={() => setOpen(false)}>×</button>
            </div>

            {/* Stats row */}
            <div style={styles.statsRow}>
              <Stat label="滑动" value={swipeHistory.length} />
              <Stat label="右滑" value={swipeHistory.filter(s => s.direction === 'right').length} />
              <Stat label="打卡" value={checkins.length} />
              <Stat label="卡片池" value={stack.length} />
            </div>

            {/* Tabs */}
            <div style={styles.tabs}>
              {(['cluster', 'dims', 'stack'] as const).map(t => (
                <button
                  key={t}
                  style={{ ...styles.tabBtn, ...(tab === t ? styles.tabActive : {}) }}
                  onClick={() => setTab(t)}
                >
                  {{ cluster: '聚类', dims: '维度', stack: '推荐' }[t]}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={styles.tabContent}>
              {tab === 'cluster' && <ClusterTab profile={profile} />}
              {tab === 'dims' && <DimsTab scores={dimensionScores} />}
              {tab === 'stack' && <StackTab stack={stack} />}
            </div>

            {/* Reset */}
            <button style={styles.resetBtn} onClick={() => { if (confirm('重置所有数据？')) reset() }}>
              重置数据
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{label}</div>
    </div>
  )
}

function ClusterTab({ profile }: { profile: ReturnType<typeof useClusterProfile> }) {
  const { soloVsSocial, indoorVsOutdoor, domainWeights, swipeCount } = profile

  if (swipeCount < 5) {
    return <div style={{ color: 'var(--text-dim)', fontSize: 12, padding: '8px 0' }}>需要至少 5 次滑动才有意义（当前 {swipeCount}）</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <BiBar label1="独处" label2="社交" value={soloVsSocial} />
      <BiBar label1="室内" label2="户外" value={indoorVsOutdoor} />
      <div style={{ marginTop: 6 }}>
        <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 4 }}>域偏好（右滑率）</div>
        {Object.entries(domainWeights).map(([d, w]) => (
          <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 32 }}>{DOMAIN_LABELS[d] ?? d}</span>
            <div style={{ flex: 1, height: 4, background: 'var(--surface2)', borderRadius: 2 }}>
              <div style={{ height: '100%', width: `${w * 100}%`, background: 'var(--accent)', borderRadius: 2 }} />
            </div>
            <span style={{ fontSize: 10, color: 'var(--text-dim)', width: 28 }}>{(w * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function BiBar({ label1, label2, value }: { label1: string; label2: string; value: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 28, textAlign: 'right' }}>{label1}</span>
      <div style={{ flex: 1, height: 6, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value * 100}%`, background: 'var(--accent)', borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 28 }}>{label2}</span>
    </div>
  )
}

function DimsTab({ scores }: { scores: Record<string, number> }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {Object.entries(DIM_LABELS).map(([key, label]) => {
        const val = scores[key] ?? 50
        return (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 36 }}>{label}</span>
            <div style={{ flex: 1, height: 5, background: 'var(--surface2)', borderRadius: 3 }}>
              <div style={{ height: '100%', width: `${val}%`, background: 'var(--accent)', borderRadius: 3 }} />
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-dim)', width: 24, textAlign: 'right' }}>{val}</span>
          </div>
        )
      })}
    </div>
  )
}

function StackTab({ stack }: { stack: Array<{ card: { id: string; title: string; intensity: string }; score: number; reasoning: string }> }) {
  if (stack.length === 0) return <div style={{ color: 'var(--text-dim)', fontSize: 12 }}>推荐栈为空</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {stack.slice(0, 8).map((sc, i) => (
        <div key={sc.card.id} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '7px 10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>#{i + 1} {sc.card.title}</span>
            <span style={{ fontSize: 11, color: 'var(--accent)' }}>{sc.score.toFixed(0)}分</span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{sc.reasoning}</div>
        </div>
      ))}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'fixed',
    bottom: 20,
    right: 16,
    zIndex: 200,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
  },
  toggle: {
    display: 'flex',
    alignItems: 'center',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 20,
    padding: '6px 12px',
    cursor: 'pointer',
    backdropFilter: 'blur(12px)',
  },
  panel: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    width: 280,
    maxHeight: '70vh',
    overflowY: 'auto',
    padding: '12px 14px',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    background: 'var(--surface2)',
    borderRadius: 10,
    padding: '10px 0',
    marginBottom: 10,
  },
  tabs: {
    display: 'flex',
    gap: 4,
    marginBottom: 10,
  },
  tabBtn: {
    flex: 1,
    fontSize: 12,
    padding: '5px',
    borderRadius: 8,
    background: 'var(--surface2)',
    color: 'var(--text-muted)',
    cursor: 'pointer',
  },
  tabActive: {
    background: 'var(--accent-dim)',
    color: 'var(--accent)',
    fontWeight: 600,
  },
  tabContent: {
    minHeight: 80,
    marginBottom: 10,
  },
  resetBtn: {
    width: '100%',
    fontSize: 12,
    padding: '7px',
    borderRadius: 8,
    background: 'transparent',
    color: 'var(--red)',
    border: '1px solid var(--border)',
    cursor: 'pointer',
  },
}
