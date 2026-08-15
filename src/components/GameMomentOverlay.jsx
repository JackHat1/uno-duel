import { useEffect, useMemo } from 'react'

const COLOR_LABELS = {
  red: 'RED',
  yellow: 'YELLOW',
  green: 'GREEN',
  blue: 'BLUE',
}

function MiniPenaltyCard({ index, amount, target }) {
  const spread = index - (amount - 1) / 2
  return (
    <span
      className="moment-penalty-card"
      style={{
        '--moment-index': index,
        '--moment-delay': `${index * 72}ms`,
        '--moment-spread': spread,
        '--moment-x': `${spread * 27}px`,
        '--moment-rot': `${spread * 13}deg`,
        '--moment-rot-mid': `${spread * -7.8}deg`,
        '--moment-rot-end': `${spread * 19.5}deg`,
        '--moment-x-end': `${spread * 40.5}px`,
      }}
      data-target={target}
    >
      <i>UNO</i>
    </span>
  )
}

export default function GameMomentOverlay({ event, uid, onDone }) {
  const duration = useMemo(() => {
    if (!event) return 0
    if (event.type === 'wild4') return 2100
    if (event.type === 'draw2' || event.type === 'catch_uno') return 1850
    if (event.type === 'wild_color') return 1750
    if (event.type === 'uno') return 1500
    if (event.type === 'skip' || event.type === 'reverse') return 1400
    return 1100
  }, [event])

  useEffect(() => {
    if (!event || !duration) return undefined
    const timer = window.setTimeout(() => onDone?.(event.id), duration)
    return () => window.clearTimeout(timer)
  }, [duration, event, onDone])

  if (!event) return null

  const actorIsMe = event.actorUid === uid
  const targetIsMe = event.targetUid === uid
  const target = targetIsMe ? 'me' : 'opponent'
  const color = event.color || 'red'


  if (event.type === 'play') {
    const label = event.cardType === 'number' ? String(event.value ?? '') : ''
    return (
      <div className={`game-moment moment-card-play moment-card-play-${actorIsMe ? 'me' : 'opponent'} moment-card-color-${color}`} aria-hidden="true">
        <div className="moment-card-trail" />
        <div className="moment-play-card">
          <span>{label}</span>
        </div>
        <small>{actorIsMe ? 'PLAYED' : `${event.actorName || 'OPPONENT'} PLAYED`}</small>
      </div>
    )
  }

  if (event.type === 'draw') {
    return (
      <div className={`game-moment moment-draw moment-draw-${targetIsMe ? 'me' : 'opponent'}`} aria-hidden="true">
        <div className="moment-draw-card"><i>UNO</i></div>
        <small>{targetIsMe ? 'CARD DRAWN' : `${event.actorName || 'OPPONENT'} DREW`}</small>
      </div>
    )
  }

  if (event.type === 'round_start') {
    return (
      <div className="game-moment moment-round-start" aria-hidden="true">
        <span>NEXT DUEL</span>
        <strong>{event.label || 'ROUND'}</strong>
        <i />
      </div>
    )
  }

  if (event.type === 'wild_color') {
    return (
      <div className={`game-moment moment-color moment-color-${color}`} aria-hidden="true">
        <div className="moment-color-wash" />
        <div className="moment-color-ring moment-color-ring-a" />
        <div className="moment-color-ring moment-color-ring-b" />
        <div className="moment-color-core">
          <small>{actorIsMe ? 'COLOR LOCKED' : `${event.actorName || 'OPPONENT'} CHANGED COLOR`}</small>
          <strong>{COLOR_LABELS[color] || color.toUpperCase()}</strong>
          <div className="moment-color-swatch" />
        </div>
      </div>
    )
  }

  if (event.type === 'draw2' || event.type === 'wild4' || event.type === 'catch_uno') {
    const amount = Number(event.amount || (event.type === 'wild4' ? 4 : 2))
    const sourceCopy = event.type === 'catch_uno'
      ? (actorIsMe ? 'UNO CAUGHT' : `${event.actorName || 'OPPONENT'} CAUGHT UNO`)
      : (actorIsMe ? 'PENALTY SENT' : `${event.actorName || 'OPPONENT'} ATTACKED`)
    const targetCopy = targetIsMe ? 'YOU DRAW' : `${event.targetName || 'OPPONENT'} DRAWS`

    return (
      <div className={`game-moment moment-penalty moment-penalty-${amount} moment-target-${target} moment-penalty-color-${color}`} aria-hidden="true">
        <div className="moment-impact-flash" />
        <div className="moment-speed-lines" />
        <div className="moment-penalty-copy">
          <small>{sourceCopy}</small>
          <strong>+{amount}</strong>
          <span>{targetCopy}</span>
          {event.type === 'wild4' && <em>NEXT · {COLOR_LABELS[color] || color.toUpperCase()}</em>}
        </div>
        <div className="moment-penalty-flight">
          {Array.from({ length: amount }).map((_, index) => (
            <MiniPenaltyCard key={`${event.id}-${index}`} index={index} amount={amount} target={target} />
          ))}
        </div>
      </div>
    )
  }

  if (event.type === 'skip' || event.type === 'reverse') {
    const isReverse = event.type === 'reverse'
    return (
      <div className={`game-moment moment-action moment-action-${event.type}`} aria-hidden="true">
        <div className="moment-action-orbit" />
        <div className="moment-action-core">
          <span>{isReverse ? '↻' : '⊘'}</span>
          <strong>{isReverse ? 'REVERSE' : 'SKIP'}</strong>
          <small>{actorIsMe ? 'YOU PLAY AGAIN' : `${event.actorName || 'OPPONENT'} PLAYS AGAIN`}</small>
        </div>
      </div>
    )
  }

  if (event.type === 'uno') {
    return (
      <div className={`game-moment moment-uno ${actorIsMe ? 'moment-uno-me' : 'moment-uno-opponent'}`} aria-hidden="true">
        <div className="moment-uno-glow" />
        <div className="moment-uno-stamp">UNO!</div>
        <small>{actorIsMe ? 'ONE CARD LEFT' : `${event.actorName || 'OPPONENT'} HAS ONE LEFT`}</small>
      </div>
    )
  }

  return null
}
