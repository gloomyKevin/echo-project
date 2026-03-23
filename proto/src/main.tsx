import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { useStore } from './store'

function Root() {
  const refreshStack = useStore(s => s.refreshStack)
  useEffect(() => { refreshStack() }, [refreshStack])
  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>
)
