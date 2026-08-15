import { useEffect, useMemo, useRef, useState } from 'react'
import useGameAudio from '../hooks/useGameAudio'
import useIOSViewport from '../hooks/useIOSViewport'
import AppIcon from './AppIcon'
import GameSettingsSheet from './GameSettingsSheet'
import GameMomentOverlay from './GameMomentOverlay'
import { canPlayCard, getTopCard } from '../game/rules'
import ColorPicker from './ColorPicker'
import UnoCard from './UnoCard'
import SwipeHandCard from './SwipeHandCard'
import QuickChat from './QuickChat'
import { getPlayerAvatar, getPlayerGradient } from '../lib/playerVisuals'

function toArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean)
  if (!value || typeof value !== 'object') return []
  return Object.keys(value)
    .sort((a, b) => Number(a) - Number(b))
    .map((key) => value[key])
    .filter(Boolean)
}

function CardBack({ mini = false }) {
  return (
    <div className={mini ? 'card-back mini-card-back' : 'card-back'} aria-hidden="true">
      <span>UNO</span>
    </div>
  )
}

export default function GameBoard({
  room,
  roomCode,
  uid,
  busy,
  error,
  onPlayCard,
  onDrawCard,
  onPass,
  onCallUno,
  onCatchUno,
  onSendQuickMessage,
  onRematch,
  onLeave,
  onOpenProfile,
  theme,
  onToggleTheme,
}) {
  const [pendingWild, setPendingWild] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [momentEvent, setMomentEvent] = useState(null)
  const seenGameEventRef = useRef(null)
  const handZoneRef = useRef(null)
  const [handZoneWidth, setHandZoneWidth] = useState(0)
  const viewport = useIOSViewport()

  const game = room.game

  const me = room.players?.p1?.uid === uid ? room.players.p1 : room.players.p2
  const opponent = room.players?.p1?.uid === uid ? room.players.p2 : room.players.p1
  const isHost = room.hostUid === uid

  const myHand = useMemo(() => toArray(game?.hands?.[uid]), [game?.hands, uid])
  const opponentHand = useMemo(
    () => toArray(game?.hands?.[opponent?.uid]),
    [game?.hands, opponent?.uid],
  )
  const deck = useMemo(() => toArray(game?.deck), [game?.deck])
  const topCard = getTopCard({ discard: toArray(game?.discard) })

  const isMyTurn = game?.currentTurnUid === uid && game?.phase === 'playing'
  const canCallUno =
    (isMyTurn && myHand.length === 2) ||
    (myHand.length === 1 && game?.unoCatchableUid === uid)
  const canCatchUno = Boolean(
    game?.unoCatchableUid && game.unoCatchableUid !== uid && game.phase === 'playing',
  )

  const winner = game?.winnerUid
    ? room.players?.p1?.uid === game.winnerUid
      ? room.players.p1
      : room.players.p2
    : null

  const {
    soundEnabled,
    musicEnabled,
    toggleSoundEnabled,
    toggleMusicEnabled,
    primeAudio,
    playSound,
  } = useGameAudio({
    game,
    uid,
    myHandLength: myHand.length,
    topCardId: topCard?.id,
  })

  const myScore = Number(room.match?.wins?.[uid] || 0)
  const opponentScore = Number(room.match?.wins?.[opponent?.uid] || 0)
  const roundNumber = Number(room.match?.round || game?.round || 1)
  const targetWins = Number(room.match?.targetWins || 5)
  const matchWinner = room.match?.matchWinnerUid

  useEffect(() => {
    const event = game?.lastEvent
    if (!event?.id || event.id === seenGameEventRef.current) return

    seenGameEventRef.current = event.id

    const age = Date.now() - Number(event.at || 0)
    if (age > 5000) return

    const cinematicTypes = new Set(['round_start', 'play', 'draw', 'wild_color', 'draw2', 'wild4', 'catch_uno', 'skip', 'reverse', 'uno'])
    if (!cinematicTypes.has(event.type)) return

    setMomentEvent(event)

    if (event.type === 'round_start') playSound('start')
    else if (event.type === 'play') playSound('play')
    else if (event.type === 'draw') playSound('draw')
    else if (event.type === 'wild_color') playSound('colorShift')
    else if (event.type === 'wild4') playSound('penalty4')
    else if (event.type === 'draw2' || event.type === 'catch_uno') playSound('penalty2')
    else if (event.type === 'skip') playSound('skip')
    else if (event.type === 'reverse') playSound('reverse')
    else if (event.type === 'uno') playSound('uno')
  }, [game?.lastEvent, playSound])


  useEffect(() => {
    const node = handZoneRef.current
    if (!node) return undefined

    const updateHandWidth = () => {
      const width = node.getBoundingClientRect().width
      if (width > 0) setHandZoneWidth(Math.floor(width))
    }

    updateHandWidth()

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateHandWidth)
      observer.observe(node)
      return () => observer.disconnect()
    }

    window.addEventListener('resize', updateHandWidth)
    return () => window.removeEventListener('resize', updateHandWidth)
  }, [])


  const viewportMode = viewport.height < 620 ? 'tiny' : viewport.height < 700 ? 'short' : viewport.height < 780 ? 'compact' : 'full'
  const boardClassName = `game-screen polished-game-screen premium-game-board ios-board ios-${viewportMode} v6-game-board v6-color-${game?.currentColor || 'red'}`
  const boardStyle = {
    '--board-vw': `${viewport.width}px`,
    '--board-vh': `${viewport.height}px`,
  }

  const handFanLayout = useMemo(() => {
    const count = Math.max(myHand.length, 1)
    const compact = viewport.height < 760
    const veryCompact = viewport.height < 690

    // The hand is positioned explicitly instead of relying on flexbox/scroll width.
    // This guarantees the first and last card always stay inside the iPhone viewport.
    const measuredWidth = handZoneWidth > 0 ? handZoneWidth : viewport.width - 18
    const availableWidth = Math.max(120, measuredWidth - 28)
    const cardWidth = veryCompact ? 56 : compact ? 64 : Math.min(74, Math.max(66, viewport.width * 0.18))
    const cardHeight = Math.round(cardWidth * 1.435)
    const naturalStep = cardWidth + 6
    const fittedStep = count > 1 ? (availableWidth - cardWidth) / (count - 1) : 0
    const step = count > 1 ? Math.max(0, Math.min(naturalStep, fittedStep)) : 0
    const totalWidth = count === 1 ? cardWidth : cardWidth + step * (count - 1)
    const startX = Math.max(0, (availableWidth - totalWidth) / 2)

    return {
      availableWidth: Math.round(availableWidth),
      cardWidth: Math.round(cardWidth),
      cardHeight,
      step,
      startX,
      containerHeight: cardHeight + 22,
    }
  }, [handZoneWidth, myHand.length, viewport.height, viewport.width])

  const tapCard = (card) => {
    if (busy) return
    primeAudio()
    if (card.type === 'wild' || card.type === 'wild4') {
      playSound('tap')
      setPendingWild(card)
      return
    }
    playSound('tap')
    onPlayCard(card.id)
  }

  const chooseWildColor = (color) => {
    const card = pendingWild
    setPendingWild(null)
    if (card) {
      primeAudio()
      playSound('tap')
      onPlayCard(card.id, color)
    }
  }

  const handleDraw = () => {
    primeAudio()
    playSound('tap')
    onDrawCard()
  }

  const handlePass = () => {
    primeAudio()
    playSound('tap')
    onPass()
  }

  const handleCallUno = () => {
    primeAudio()
    playSound('uno')
    onCallUno()
  }

  const handleCatchUno = () => {
    primeAudio()
    playSound('tap')
    onCatchUno()
  }

  const handleRematch = () => {
    primeAudio()
    playSound('tap')
    onRematch()
  }

  const handleLeave = () => {
    primeAudio()
    playSound('tap')
    onLeave()
  }

  return (
    <main className={boardClassName} style={boardStyle}>
      <div className="game-ambient-grid" aria-hidden="true" />
      <div className="game-table-glow" aria-hidden="true" />
      <div className={`v6-color-field v6-field-${game?.currentColor || 'red'}`} aria-hidden="true" />
      <div className="game-noise-layer" aria-hidden="true" />
      <header className="game-topbar glass-topbar">
        <div className="room-mini room-mini-glass">
          <span>ROOM</span>
          <strong>{roomCode}</strong>
        </div>

        <div className="match-score" aria-label={`Round ${roundNumber}, score ${myScore} to ${opponentScore}`}>
          <small>ROUND {roundNumber}</small>
          <strong>{myScore}<i>:</i>{opponentScore}</strong>
          <span>first to {targetWins}</span>
        </div>

        <div className="topbar-actions premium-game-actions ios-top-actions">
          <button className="clean-icon-button game-control-button profile-game-button" type="button" onClick={onOpenProfile} aria-label="Edit player account" title="Player account">
            <span className="game-profile-avatar" style={{ background: getPlayerGradient(me) }}>{getPlayerAvatar(me)}</span>
          </button>
          <button className="clean-icon-button game-control-button ios-menu-button" type="button" onClick={() => setSettingsOpen(true)} aria-label="Open game settings" title="Game settings">
            <AppIcon name="settings" />
          </button>
        </div>
      </header>

      <section className={`opponent-zone glass-section v6-opponent-strip ${!isMyTurn && game.phase === 'playing' ? 'turn-active' : ''}`}>
        <div className="opponent-info">
          <div className="player-avatar avatar-gradient" style={{ background: getPlayerGradient(opponent) }}>{getPlayerAvatar(opponent)}</div>
          <div>
            <strong>{opponent?.name || 'Opponent'}</strong>
            <span>{opponentHand.length} {opponentHand.length === 1 ? 'card' : 'cards'}</span>
          </div>
        </div>

        <div className="opponent-hand" aria-label={`${opponentHand.length} opponent cards`}>
          {Array.from({ length: Math.min(opponentHand.length, 9) }).map((_, index) => (
            <CardBack mini key={index} />
          ))}
          {opponentHand.length > 9 && <span className="more-cards">+{opponentHand.length - 9}</span>}
        </div>
      </section>

      <section className="table-zone">
        <div className={`turn-pill v6-turn-pill ${isMyTurn ? 'your-turn' : ''}`}>
          <span className="turn-indicator" />
          {game.phase === 'finished'
            ? 'GAME OVER'
            : isMyTurn
              ? 'YOUR TURN'
              : `${opponent?.name || 'Opponent'}'S TURN`}
        </div>

        <div className="center-table-card glass-center-table v6-table-stage">
          <div className={`v6-discard-aura aura-${game.currentColor}`} aria-hidden="true" />
          <div className="piles-row">
            <button
              className="draw-stack"
              type="button"
              onClick={handleDraw}
              disabled={!isMyTurn || busy || Boolean(game.drawnCardId)}
              aria-label={`Draw pile, ${deck.length} cards`}
            >
              <CardBack />
              <span className="pile-caption">DRAW · {deck.length}</span>
            </button>

            <div className="discard-stack" aria-label="Discard pile">
              <UnoCard key={topCard?.id} card={topCard} playable={false} />
              <span className="pile-caption">DISCARD</span>
            </div>
          </div>

          <div className="table-meta table-meta-grid">
            <div className="meta-chip current-color-wrap">
              <span>COLOR</span>
              <i className={`current-color-dot ${game.currentColor}`} />
              <strong>{game.currentColor?.toUpperCase()}</strong>
            </div>
            <div className="meta-chip direction-wrap" title="Direction">
              <span>{game.direction === -1 ? '↺' : '↻'}</span>
              1 vs 1
            </div>
            <div className="meta-chip">
              <span>DECK</span>
              <strong>{deck.length}</strong>
            </div>
          </div>

          <div className="game-message" aria-live="polite">{game.message}</div>
        </div>

        {game.drawnCardId && isMyTurn && (
          <div className="draw-choice-banner glass-inline-banner">
            <span>You drew a playable card.</span>
            <button type="button" onClick={handlePass} disabled={busy}>Pass</button>
          </div>
        )}

        {canCatchUno && (
          <button className="catch-uno-button" type="button" onClick={handleCatchUno} disabled={busy}>
            CATCH UNO! <small>Opponent forgot to call it</small>
          </button>
        )}
      </section>

      <section className="player-controls v6-player-controls">
        <button
          className={`uno-button ${canCallUno ? 'uno-ready' : ''}`}
          type="button"
          onClick={handleCallUno}
          disabled={!canCallUno || busy}
        >
          UNO!
        </button>
      </section>

      <section ref={handZoneRef} className={`hand-zone glass-section v6-hand-dock ${isMyTurn ? 'turn-active' : ''}`}>
        <div className="my-hand-header">
          <div className="my-player-summary">
            <span className="mini-player-avatar" style={{ background: getPlayerGradient(me) }}>{getPlayerAvatar(me)}</span>
            <div className="my-player-copy">
              <strong>{me?.name || 'You'}</strong>
              <span>{myHand.length} {myHand.length === 1 ? 'card' : 'cards'}</span>
            </div>
          </div>
          <div className="player-badges">
            {isMyTurn && <span className="turn-badge">PLAY</span>}
            {game.drawnCardId && <span className="drawn-badge">PLAY DRAWN CARD</span>}
          </div>
        </div>

        <div
          className="hand-fan-fixed"
          aria-label="Your cards"
          style={{
            width: `${handFanLayout.availableWidth}px`,
            height: `${handFanLayout.containerHeight}px`,
            '--fan-card-width': `${handFanLayout.cardWidth}px`,
            '--fan-card-height': `${handFanLayout.cardHeight}px`,
          }}
        >
          {myHand.map((card, index) => {
            const playable =
              isMyTurn &&
              !busy &&
              (!game.drawnCardId || game.drawnCardId === card.id) &&
              canPlayCard(card, topCard, game.currentColor, myHand)

            const centerIndex = (myHand.length - 1) / 2
            const relativeIndex = index - centerIndex
            const half = Math.max(1, centerIndex)
            const normalized = relativeIndex / half
            const fanAngle = Math.max(-14, Math.min(14, normalized * 14))
            const fanLift = Math.pow(Math.abs(normalized), 1.55) * 9

            return (
              <SwipeHandCard
                key={card.id}
                card={card}
                playable={playable}
                selected={game.drawnCardId === card.id}
                angle={fanAngle}
                lift={fanLift}
                left={handFanLayout.startX + index * handFanLayout.step}
                zIndex={index + 1}
                onPlay={tapCard}
              />
            )
          })}
        </div>
      </section>

      <GameMomentOverlay key={momentEvent?.id || 'no-moment'} event={momentEvent} uid={uid} onDone={() => setMomentEvent(null)} />

      <QuickChat
        latestMessage={room.chat?.latest}
        uid={uid}
        me={me}
        opponent={opponent}
        busy={busy}
        onSend={onSendQuickMessage}
        onIncoming={() => playSound('chat')}
      />

      <GameSettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={theme}
        onToggleTheme={onToggleTheme}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSoundEnabled}
        musicEnabled={musicEnabled}
        onToggleMusic={toggleMusicEnabled}
        onLeave={handleLeave}
        busy={busy}
      />

      {error && <div className="floating-error" role="alert">{error}</div>}

      {pendingWild && (
        <ColorPicker onSelect={chooseWildColor} onCancel={() => setPendingWild(null)} />
      )}

      {game.phase === 'finished' && (
        <div className="modal-backdrop winner-backdrop">
          <section className="winner-modal" role="dialog" aria-modal="true">
            <div className="winner-crown">★</div>
            <p className="eyebrow">{matchWinner ? 'MATCH COMPLETE' : `ROUND ${roundNumber} COMPLETE`}</p>
            <h2>{winner?.uid === uid ? (matchWinner ? 'Champion! 🏆' : 'You win!') : `${winner?.name || 'Opponent'} wins!`}</h2>
            <div className="winner-score"><span>{getPlayerAvatar(me)} {myScore}</span><i>:</i><span>{opponentScore} {getPlayerAvatar(opponent)}</span></div>
            <p>{matchWinner ? `First to ${targetWins} wins takes the match.` : `Next round will be round ${roundNumber + 1}.`}</p>

            {isHost ? (
              <button className="premium-primary-button winner-rematch-button" type="button" onClick={handleRematch} disabled={busy}>
                {busy ? 'Starting…' : matchWinner ? 'New match' : 'Next round'}
              </button>
            ) : (
              <div className="waiting-host"><span className="spinner" /> Waiting for host to rematch…</div>
            )}

            <button className="premium-text-button" type="button" onClick={handleLeave} disabled={busy}>Leave room</button>
          </section>
        </div>
      )}
    </main>
  )
}
