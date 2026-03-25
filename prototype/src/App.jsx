import { useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import useStore, { CAMERA_PRESETS } from './store/useStore'
import StarSky from './components/StarSky'
import Landing from './components/Landing'
import CardFlow from './components/CardFlow'
import Checkin from './components/Checkin'
import StarMap from './components/StarMap'
import DebugPanel from './components/DebugPanel'
import './App.css'

function App() {
  const view = useStore(s => s.view)
  const setView = useStore(s => s.setView)
  const setCamera = useStore(s => s.setCamera)
  const stars = useStore(s => s.stars)

  const totalStars = stars.length
  const hasBright = stars.some(s => s.type === 'bright')

  // 同步机位到视图
  useEffect(() => {
    const preset = CAMERA_PRESETS[view]
    if (preset) setCamera(preset)
  }, [view, setCamera])

  // 点击星空区域进入星图
  const handleSkyClick = (e) => {
    if (view !== 'cards') return
    // 只有点击上方 40% 区域时才触发
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    if (y < rect.height * 0.35) {
      setView('starmap')
    }
  }

  return (
    <div className="app" onClick={handleSkyClick}>
      {/* Layer 1: 统一星空 — 永远在 */}
      <StarSky />

      {/* 星图入口 — 呼吸点 */}
      {view !== 'starmap' && view !== 'checkin' && totalStars > 0 && (
        <div
          className="star-entry"
          onClick={(e) => { e.stopPropagation(); setView('starmap') }}
        >
          <div className="star-entry-dot" />
          {hasBright && <div className="star-entry-glow" />}
        </div>
      )}

      {/* Layer 2: 前台内容 */}
      <AnimatePresence mode="wait">
        {view === 'landing' && <Landing key="landing" />}
        {view === 'cards' && <CardFlow key="cards" />}
        {view === 'checkin' && <Checkin key="checkin" />}
        {view === 'starmap' && <StarMap key="starmap" />}
      </AnimatePresence>

      {/* Layer 3: 调试 */}
      <DebugPanel />
    </div>
  )
}

export default App
