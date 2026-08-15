import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/global.css'

// iOS Safari viewport bridge.
// Safari's visible viewport changes when the top/bottom browser chrome expands or collapses.
// Keep CSS synced to the actual VisualViewport rather than relying only on 100vh/100dvh.
const syncVisualViewport = () => {
  const vv = window.visualViewport
  const width = Math.round(vv?.width || window.innerWidth)
  const height = Math.round(vv?.height || window.innerHeight)
  const top = Math.round(vv?.offsetTop || 0)
  const left = Math.round(vv?.offsetLeft || 0)

  document.documentElement.style.setProperty('--app-width', `${width}px`)
  document.documentElement.style.setProperty('--app-height', `${height}px`)
  document.documentElement.style.setProperty('--app-vv-top', `${top}px`)
  document.documentElement.style.setProperty('--app-vv-left', `${left}px`)
}

let viewportRaf = 0
const requestViewportSync = () => {
  cancelAnimationFrame(viewportRaf)
  viewportRaf = requestAnimationFrame(syncVisualViewport)
}

syncVisualViewport()
window.addEventListener('resize', requestViewportSync, { passive: true })
window.addEventListener('orientationchange', requestViewportSync, { passive: true })
window.visualViewport?.addEventListener('resize', requestViewportSync, { passive: true })
window.visualViewport?.addEventListener('scroll', requestViewportSync, { passive: true })

// iOS Safari: block pinch gestures while preserving normal one-finger interactions.
const preventMultiTouch = (event) => {
  if (event.touches && event.touches.length > 1) event.preventDefault()
}

document.addEventListener('touchmove', preventMultiTouch, { passive: false })
document.addEventListener('gesturestart', (event) => event.preventDefault(), { passive: false })
document.addEventListener('gesturechange', (event) => event.preventDefault(), { passive: false })
document.addEventListener('gestureend', (event) => event.preventDefault(), { passive: false })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
