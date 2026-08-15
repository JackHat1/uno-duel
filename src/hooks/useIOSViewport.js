import { useEffect, useState } from 'react'

function readViewport() {
  if (typeof window === 'undefined') {
    return { width: 390, height: 844, offsetTop: 0, offsetLeft: 0, scale: 1 }
  }

  const vv = window.visualViewport
  return {
    width: Math.round(vv?.width || window.innerWidth || 390),
    height: Math.round(vv?.height || window.innerHeight || 844),
    offsetTop: Math.round(vv?.offsetTop || 0),
    offsetLeft: Math.round(vv?.offsetLeft || 0),
    scale: vv?.scale || 1,
  }
}

export default function useIOSViewport() {
  const [viewport, setViewport] = useState(readViewport)

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    let raf = 0
    const root = document.documentElement

    const update = () => {
      window.cancelAnimationFrame(raf)
      raf = window.requestAnimationFrame(() => {
        const next = readViewport()
        setViewport(next)
        root.style.setProperty('--vv-width', `${next.width}px`)
        root.style.setProperty('--vv-height', `${next.height}px`)
        root.style.setProperty('--vv-top', `${next.offsetTop}px`)
        root.style.setProperty('--vv-left', `${next.offsetLeft}px`)
        root.style.setProperty('--vv-scale', String(next.scale))
        root.dataset.viewport = next.height < 620 ? 'tiny' : next.height < 700 ? 'short' : next.height < 780 ? 'compact' : 'full'
      })
    }

    update()
    window.addEventListener('resize', update, { passive: true })
    window.addEventListener('orientationchange', update, { passive: true })
    window.visualViewport?.addEventListener('resize', update, { passive: true })
    window.visualViewport?.addEventListener('scroll', update, { passive: true })

    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
      window.visualViewport?.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('scroll', update)
    }
  }, [])

  return viewport
}
