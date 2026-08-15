import { useRef, useState } from 'react'
import UnoCard from './UnoCard'

const SWIPE_PLAY_THRESHOLD = 58
const SWIPE_MAX_X = 92
const SWIPE_MAX_DOWN = 22

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export default function SwipeHandCard({
  card,
  playable,
  selected,
  angle = 0,
  lift = 0,
  left = 0,
  zIndex = 1,
  onPlay,
}) {
  const slotRef = useRef(null)
  const startRef = useRef(null)
  const movedRef = useRef(false)
  const suppressClickRef = useRef(false)
  const [dragging, setDragging] = useState(false)

  const setDragTransform = (dx = 0, dy = 0, active = false) => {
    const node = slotRef.current
    if (!node) return

    const safeDx = clamp(dx, -SWIPE_MAX_X, SWIPE_MAX_X)
    const safeDy = Math.min(SWIPE_MAX_DOWN, dy)
    const progress = clamp(-safeDy / SWIPE_PLAY_THRESHOLD, 0, 1.25)
    const dragRotation = safeDx * 0.055
    const scale = 1 + Math.min(0.07, progress * 0.065)

    node.style.setProperty('--drag-x', `${safeDx}px`)
    node.style.setProperty('--drag-y', `${safeDy}px`)
    node.style.setProperty('--drag-rot', `${dragRotation}deg`)
    node.style.setProperty('--drag-scale', String(scale))
    node.dataset.dragging = active ? 'true' : 'false'
    node.dataset.armed = playable && -safeDy >= SWIPE_PLAY_THRESHOLD ? 'true' : 'false'
  }

  const resetDrag = () => {
    const node = slotRef.current
    if (!node) return
    node.style.setProperty('--drag-x', '0px')
    node.style.setProperty('--drag-y', '0px')
    node.style.setProperty('--drag-rot', '0deg')
    node.style.setProperty('--drag-scale', '1')
    node.dataset.dragging = 'false'
    node.dataset.armed = 'false'
  }

  const handlePointerDown = (event) => {
    if (!playable || event.pointerType === 'mouse' && event.button !== 0) return
    startRef.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId }
    movedRef.current = false
    suppressClickRef.current = false
    setDragging(true)
    slotRef.current?.setPointerCapture?.(event.pointerId)
    setDragTransform(0, 0, true)
  }

  const handlePointerMove = (event) => {
    const start = startRef.current
    if (!start || start.pointerId !== event.pointerId || !playable) return

    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.hypot(dx, dy) > 7) movedRef.current = true

    if (movedRef.current) {
      event.preventDefault()
      setDragTransform(dx, dy, true)
    }
  }

  const finishGesture = (event, cancelled = false) => {
    const start = startRef.current
    if (!start || start.pointerId !== event.pointerId) return

    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    const shouldPlay = !cancelled && playable && dy <= -SWIPE_PLAY_THRESHOLD

    suppressClickRef.current = movedRef.current
    startRef.current = null
    setDragging(false)

    try {
      slotRef.current?.releasePointerCapture?.(event.pointerId)
    } catch {
      // Safari can release capture automatically before pointerup.
    }

    if (shouldPlay) {
      const node = slotRef.current
      const needsColor = card.type === 'wild' || card.type === 'wild4'

      if (needsColor) {
        if (node?.animate) {
          node.animate(
            [
              { transform: `translate3d(${dx}px, ${dy}px, 0) rotate(${angle + dx * 0.055}deg) scale(1.05)` },
              { transform: `translate3d(0, -22px, 0) rotate(${angle}deg) scale(1.07)` },
              { transform: `translate3d(0, 0, 0) rotate(${angle}deg) scale(1)` },
            ],
            { duration: 220, easing: 'cubic-bezier(.2,.85,.25,1)' },
          )
        }
        resetDrag()
        onPlay?.(card, { via: 'swipe' })
        return
      }

      if (node?.animate) {
        node.animate(
          [
            { transform: `translate3d(${dx}px, ${dy}px, 0) rotate(${angle + dx * 0.055}deg) scale(1.05)`, opacity: 1 },
            { transform: `translate3d(${dx * 0.35}px, -190px, 0) rotate(${angle + dx * 0.02}deg) scale(.78)`, opacity: 0 },
          ],
          { duration: 165, easing: 'cubic-bezier(.2,.85,.25,1)', fill: 'forwards' },
        )
      }
      window.setTimeout(() => {
        resetDrag()
        onPlay?.(card, { via: 'swipe' })
      }, 105)
      return
    }

    resetDrag()
  }

  const handleClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }
    if (playable) onPlay?.(card, { via: 'tap' })
  }

  return (
    <div
      ref={slotRef}
      className={`hand-card-slot swipe-hand-card${dragging ? ' is-dragging' : ''}`}
      style={{
        left: `${left}px`,
        zIndex: dragging ? 120 : zIndex,
        '--fan-angle': `${angle}deg`,
        '--fan-lift': `${lift}px`,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={(event) => finishGesture(event, false)}
      onPointerCancel={(event) => finishGesture(event, true)}
    >
      <UnoCard
        card={card}
        playable={playable}
        selected={selected}
        onClick={handleClick}
      />
      {playable && <span className="swipe-card-hint" aria-hidden="true">↑</span>}
    </div>
  )
}
