import { AnimatePresence } from 'framer-motion'
import useStore from './store/useStore'
import Landing from './components/Landing'
import CardFlow from './components/CardFlow'
import Checkin from './components/Checkin'
import StarMap from './components/StarMap'
import './App.css'

function App() {
  const view = useStore(s => s.view)
  const setView = useStore(s => s.setView)
  const darkStars = useStore(s => s.darkStars)
  const brightStars = useStore(s => s.brightStars)
  const totalStars = darkStars.length + brightStars.length

  return (
    <div className="app">
      {/* 星图入口 - 有星星后显示 */}
      {view !== 'starmap' && totalStars > 0 && (
        <button className="starmap-entry" onClick={() => setView('starmap')}>
          {totalStars > 0 && <div className="glow" />}
          ✦
        </button>
      )}

      <AnimatePresence mode="wait">
        {view === 'landing' && <Landing key="landing" />}
        {view === 'cards' && <CardFlow key="cards" />}
        {view === 'checkin' && <Checkin key="checkin" />}
        {view === 'starmap' && <StarMap key="starmap" />}
      </AnimatePresence>
    </div>
  )
}

export default App
