import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const COLOR_LABELS = {
  red: 'RED',
  yellow: 'YELLOW',
  green: 'GREEN',
  blue: 'BLUE',
}

const COLOR_HEX = {
  red: '#ef433d',
  yellow: '#f4ca35',
  green: '#2db367',
  blue: '#2f80df',
}

function readVisualViewport() {
  if (typeof window === 'undefined') {
    return { width: 390, height: 844, left: 0, top: 0 }
  }
  const vv = window.visualViewport
  return {
    width: Math.round(vv?.width || window.innerWidth || 390),
    height: Math.round(vv?.height || window.innerHeight || 844),
    left: Math.round(vv?.offsetLeft || 0),
    top: Math.round(vv?.offsetTop || 0),
  }
}

function animateSafely(node, keyframes, options) {
  if (!node) return null
  if (typeof node.animate === 'function') {
    try {
      return node.animate(keyframes, options)
    } catch {
      // Static fallback remains visible when Web Animations is unavailable.
    }
  }
  return null
}

function FxCard({ index = 0, rainbow = false }) {
  return (
    <div
      className={`iosfx-flying-card${rainbow ? ' is-rainbow' : ''}`}
      data-fx-card={index}
      aria-hidden="true"
    >
      <span>UNO</span>
    </div>
  )
}

export default function GameMomentOverlay({ event, uid, onDone }) {
  const [viewport, setViewport] = useState(readVisualViewport)
  const rootRef = useRef(null)
  const glowRef = useRef(null)
  const heroRef = useRef(null)
  const trailRef = useRef(null)
  const mountedEventRef = useRef(null)
  const onDoneRef = useRef(onDone)

  const duration = useMemo(() => {
    if (!event) return 0
    if (event.type === 'wild4') return 2200
    if (event.type === 'draw2' || event.type === 'catch_uno') return 1950
    if (event.type === 'wild_color') return 1850
    if (event.type === 'uno') return 1650
    if (event.type === 'skip' || event.type === 'reverse') return 1500
    if (event.type === 'round_start') return 1300
    return 1200
  }, [event])

  useEffect(() => {
    onDoneRef.current = onDone
  }, [onDone])

  useEffect(() => {
    if (!event || typeof window === 'undefined') return undefined

    const update = () => setViewport(readVisualViewport())
    update()
    window.visualViewport?.addEventListener('resize', update, { passive: true })
    window.visualViewport?.addEventListener('scroll', update, { passive: true })
    window.addEventListener('orientationchange', update, { passive: true })

    return () => {
      window.visualViewport?.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('scroll', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [event])

  useEffect(() => {
    if (!event || !duration || typeof window === 'undefined') return undefined
    if (mountedEventRef.current === event.id) return undefined
    mountedEventRef.current = event.id

    const activeViewport = readVisualViewport()
    const root = rootRef.current
    const hero = heroRef.current
    const glow = glowRef.current
    const trail = trailRef.current
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

    // Always force a visible static state first. This is the fallback path on iOS
    // if an animation API is unavailable or interrupted.
    if (root) root.style.opacity = '1'
    if (hero) {
      hero.style.opacity = '1'
      hero.style.transform = 'translate3d(0,0,0) scale(1)'
    }
    if (glow) glow.style.opacity = '0.68'

    if (reducedMotion) {
      animateSafely(root, [{ opacity: 0 }, { opacity: 1, offset: 0.12 }, { opacity: 1, offset: 0.82 }, { opacity: 0 }], {
        duration,
        easing: 'linear',
        fill: 'forwards',
      })
    } else {
      animateSafely(root, [{ opacity: 0 }, { opacity: 1, offset: 0.06 }, { opacity: 1, offset: 0.82 }, { opacity: 0 }], {
        duration,
        easing: 'cubic-bezier(.2,.8,.2,1)',
        fill: 'forwards',
      })

      if (event.type === 'play') {
        const startY = event.actorUid === uid ? activeViewport.height * 0.43 : -activeViewport.height * 0.34
        animateSafely(hero, [
          { transform: `translate3d(0, ${startY}px, 0) rotate(${event.actorUid === uid ? 13 : -13}deg) scale(.72)`, opacity: 0 },
          { transform: 'translate3d(0,-8px,0) rotate(-2deg) scale(1.08)', opacity: 1, offset: 0.66 },
          { transform: 'translate3d(0,0,0) rotate(0deg) scale(1)', opacity: 0 },
        ], { duration: 1050, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' })
      } else if (event.type === 'draw') {
        const endY = event.targetUid === uid ? activeViewport.height * 0.34 : -activeViewport.height * 0.31
        animateSafely(hero, [
          { transform: 'translate3d(0,0,0) rotate(-8deg) scale(.66)', opacity: 0 },
          { transform: 'translate3d(0,0,0) rotate(2deg) scale(1)', opacity: 1, offset: 0.28 },
          { transform: `translate3d(0,${endY}px,0) rotate(14deg) scale(.62)`, opacity: 0 },
        ], { duration: 1080, easing: 'cubic-bezier(.2,.85,.2,1)', fill: 'forwards' })
      } else if (event.type === 'wild_color') {
        animateSafely(glow, [
          { transform: 'translate3d(-50%,-50%,0) scale(.25)', opacity: 0 },
          { transform: 'translate3d(-50%,-50%,0) scale(1)', opacity: .82, offset: .38 },
          { transform: 'translate3d(-50%,-50%,0) scale(1.35)', opacity: 0 },
        ], { duration: 1700, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' })
        animateSafely(hero, [
          { transform: 'translate3d(0,18px,0) scale(.72)', opacity: 0 },
          { transform: 'translate3d(0,0,0) scale(1.08)', opacity: 1, offset: .24 },
          { transform: 'translate3d(0,0,0) scale(1)', opacity: 1, offset: .72 },
          { transform: 'translate3d(0,-8px,0) scale(1.03)', opacity: 0 },
        ], { duration: 1750, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' })
      } else if (event.type === 'draw2' || event.type === 'wild4' || event.type === 'catch_uno') {
        animateSafely(glow, [
          { transform: 'translate3d(-50%,-50%,0) scale(.3)', opacity: 0 },
          { transform: 'translate3d(-50%,-50%,0) scale(1)', opacity: .9, offset: .2 },
          { transform: 'translate3d(-50%,-50%,0) scale(1.18)', opacity: .22, offset: .7 },
          { transform: 'translate3d(-50%,-50%,0) scale(1.35)', opacity: 0 },
        ], { duration, easing: 'ease-out', fill: 'forwards' })
        animateSafely(hero, [
          { transform: 'translate3d(0,14px,0) scale(.42)', opacity: 0 },
          { transform: 'translate3d(0,-5px,0) scale(1.12)', opacity: 1, offset: .2 },
          { transform: 'translate3d(0,0,0) scale(1)', opacity: 1, offset: .72 },
          { transform: 'translate3d(0,-7px,0) scale(.94)', opacity: 0 },
        ], { duration: duration - 120, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' })

        const cards = root?.querySelectorAll('[data-fx-card]') || []
        const targetMe = event.targetUid === uid
        cards.forEach((card, index) => {
          const count = cards.length
          const spread = index - (count - 1) / 2
          const x = spread * 38
          const finalY = targetMe ? activeViewport.height * .43 : -activeViewport.height * .39
          const delay = index * 80
          animateSafely(card, [
            { transform: `translate3d(-50%,-50%,0) translateX(${spread * 10}px) rotate(${spread * 10}deg) scale(.46)`, opacity: 0 },
            { transform: `translate3d(-50%,-50%,0) translate(${x * .45}px,${targetMe ? 22 : -22}px) rotate(${spread * -7}deg) scale(1.02)`, opacity: 1, offset: .34 },
            { transform: `translate3d(-50%,-50%,0) translate(${x}px,${finalY}px) rotate(${spread * 22}deg) scale(.62)`, opacity: 0 },
          ], { duration: 1250, delay, easing: 'cubic-bezier(.2,.85,.25,1)', fill: 'forwards' })
        })
      } else if (event.type === 'skip' || event.type === 'reverse') {
        animateSafely(hero, [
          { transform: `translate3d(0,0,0) rotate(${event.type === 'reverse' ? '-190deg' : '-10deg'}) scale(.45)`, opacity: 0 },
          { transform: 'translate3d(0,0,0) rotate(0deg) scale(1.1)', opacity: 1, offset: .28 },
          { transform: 'translate3d(0,0,0) rotate(0deg) scale(1)', opacity: 1, offset: .72 },
          { transform: 'translate3d(0,0,0) rotate(3deg) scale(1.08)', opacity: 0 },
        ], { duration: 1400, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' })
      } else if (event.type === 'uno') {
        animateSafely(glow, [
          { transform: 'translate3d(-50%,-50%,0) scale(.35)', opacity: 0 },
          { transform: 'translate3d(-50%,-50%,0) scale(1)', opacity: .82, offset: .28 },
          { transform: 'translate3d(-50%,-50%,0) scale(1.2)', opacity: 0 },
        ], { duration: 1550, easing: 'ease-out', fill: 'forwards' })
        animateSafely(hero, [
          { transform: 'translate3d(0,0,0) rotate(-16deg) scale(.3)', opacity: 0 },
          { transform: 'translate3d(0,0,0) rotate(-7deg) scale(1.13)', opacity: 1, offset: .24 },
          { transform: 'translate3d(0,0,0) rotate(-7deg) scale(1)', opacity: 1, offset: .72 },
          { transform: 'translate3d(0,0,0) rotate(-3deg) scale(1.12)', opacity: 0 },
        ], { duration: 1550, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' })
      } else if (event.type === 'round_start') {
        animateSafely(hero, [
          { transform: 'translate3d(0,12px,0) scale(.86)', opacity: 0 },
          { transform: 'translate3d(0,0,0) scale(1)', opacity: 1, offset: .3 },
          { transform: 'translate3d(0,0,0) scale(1)', opacity: 1, offset: .7 },
          { transform: 'translate3d(0,-8px,0) scale(1.03)', opacity: 0 },
        ], { duration: 1200, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' })
      }

      if (trail) {
        animateSafely(trail, [
          { transform: 'translate3d(-50%,-50%,0) scale(.25)', opacity: 0 },
          { transform: 'translate3d(-50%,-50%,0) scale(1)', opacity: .45, offset: .35 },
          { transform: 'translate3d(-50%,-50%,0) scale(1.35)', opacity: 0 },
        ], { duration: Math.min(duration, 1500), easing: 'ease-out', fill: 'forwards' })
      }
    }

    const timer = window.setTimeout(() => onDoneRef.current?.(event.id), duration + 120)
    return () => window.clearTimeout(timer)
  }, [duration, event?.id, uid])

  if (!event || typeof document === 'undefined') return null

  const color = event.color || 'red'
  const accent = COLOR_HEX[color] || COLOR_HEX.red
  const actorIsMe = event.actorUid === uid
  const targetIsMe = event.targetUid === uid
  const amount = Number(event.amount || (event.type === 'wild4' ? 4 : 2))

  let content = null

  if (event.type === 'play') {
    content = (
      <div className="iosfx-play-card" ref={heroRef} style={{ '--fx-accent': accent }}>
        <small>{actorIsMe ? 'YOU PLAYED' : `${event.actorName || 'OPPONENT'} PLAYED`}</small>
        <div className="iosfx-card-face"><strong>{event.cardType === 'number' ? event.value : ''}</strong></div>
      </div>
    )
  } else if (event.type === 'draw') {
    content = (
      <div className="iosfx-draw-card" ref={heroRef}>
        <small>{targetIsMe ? 'CARD DRAWN' : `${event.actorName || 'OPPONENT'} DREW`}</small>
        <FxCard />
      </div>
    )
  } else if (event.type === 'wild_color') {
    content = (
      <div className="iosfx-color-hero" ref={heroRef} style={{ '--fx-accent': accent }}>
        <small>{actorIsMe ? 'COLOR LOCKED' : `${event.actorName || 'OPPONENT'} CHANGED COLOR`}</small>
        <strong>{COLOR_LABELS[color]}</strong>
        <i />
      </div>
    )
  } else if (event.type === 'draw2' || event.type === 'wild4' || event.type === 'catch_uno') {
    content = (
      <>
        <div className="iosfx-penalty-hero" ref={heroRef} style={{ '--fx-accent': event.type === 'wild4' ? '#ffffff' : accent }}>
          <small>{event.type === 'catch_uno' ? (actorIsMe ? 'UNO CAUGHT' : `${event.actorName || 'OPPONENT'} CAUGHT UNO`) : (actorIsMe ? 'PENALTY SENT' : `${event.actorName || 'OPPONENT'} ATTACKED`)}</small>
          <strong>+{amount}</strong>
          <span>{targetIsMe ? 'YOU DRAW' : `${event.targetName || 'OPPONENT'} DRAWS`}</span>
          {event.type === 'wild4' && <em>NEXT · {COLOR_LABELS[color]}</em>}
        </div>
        <div className="iosfx-card-flight">
          {Array.from({ length: amount }).map((_, index) => <FxCard key={`${event.id}-${index}`} index={index} rainbow={event.type === 'wild4'} />)}
        </div>
      </>
    )
  } else if (event.type === 'skip' || event.type === 'reverse') {
    content = (
      <div className="iosfx-action-hero" ref={heroRef}>
        <b>{event.type === 'reverse' ? '↻' : '⊘'}</b>
        <strong>{event.type === 'reverse' ? 'REVERSE' : 'SKIP'}</strong>
        <small>{actorIsMe ? 'YOU PLAY AGAIN' : `${event.actorName || 'OPPONENT'} PLAYS AGAIN`}</small>
      </div>
    )
  } else if (event.type === 'uno') {
    content = (
      <div className="iosfx-uno-hero" ref={heroRef}>
        <strong>UNO!</strong>
        <small>{actorIsMe ? 'ONE CARD LEFT' : `${event.actorName || 'OPPONENT'} HAS ONE LEFT`}</small>
      </div>
    )
  } else if (event.type === 'round_start') {
    content = (
      <div className="iosfx-round-hero" ref={heroRef}>
        <small>NEXT DUEL</small>
        <strong>{event.label || 'ROUND'}</strong>
      </div>
    )
  }

  if (!content) return null

  return createPortal(
    <div
      ref={rootRef}
      className={`iosfx-layer iosfx-${event.type}`}
      style={{
        left: `${viewport.left}px`,
        top: `${viewport.top}px`,
        width: `${viewport.width}px`,
        height: `${viewport.height}px`,
        '--fx-accent': accent,
      }}
      aria-hidden="true"
    >
      <div ref={glowRef} className="iosfx-glow" />
      <div ref={trailRef} className="iosfx-trail" />
      {content}
    </div>,
    document.body,
  )
}
