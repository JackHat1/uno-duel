import { useState } from 'react'
import AppIcon from './AppIcon'
import { getPlayerAvatar, getPlayerGradient } from '../lib/playerVisuals'

function fallbackCopy(text) {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  document.execCommand('copy')
  textarea.remove()
}

export default function LobbyScreen({
  room,
  roomCode,
  uid,
  onStart,
  onLeave,
  busy,
  error,
  theme,
  onToggleTheme,
  onOpenProfile,
}) {
  const [copied, setCopied] = useState(false)
  const isHost = room.hostUid === uid
  const opponent = room.players?.p1?.uid === uid ? room.players?.p2 : room.players?.p1
  const me = room.players?.p1?.uid === uid ? room.players?.p1 : room.players?.p2
  const ready = Boolean(room.players?.p1 && room.players?.p2)

  const copyCode = async () => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(roomCode)
      else fallbackCopy(roomCode)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      fallbackCopy(roomCode)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    }
  }

  const shareRoom = async () => {
    const text = `Join my UNO room: ${roomCode}`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'UNO Duel', text })
        return
      } catch {
        // User cancelled.
      }
    }
    await copyCode()
  }

  return (
    <main className="lobby-screen safe-screen premium-lobby-screen">
      <div className="ambient-grid" aria-hidden="true" />
      <div className="ambient-orb orb-one" aria-hidden="true" />
      <div className="ambient-orb orb-two" aria-hidden="true" />

      <header className="lobby-topbar premium-shell-width">
        <div className="mini-brand-lockup"><span className="mini-brand-symbol">U</span><div><strong>UNO DUEL</strong><small>LOBBY</small></div></div>
        <div className="topbar-actions">
          <button className="clean-icon-button premium-control" type="button" onClick={onToggleTheme} aria-label="Toggle theme">
            <AppIcon name={theme === 'dark' ? 'sun' : 'moon'} />
          </button>
          <button className="profile-avatar-button" type="button" onClick={onOpenProfile} aria-label="Edit player profile">
            <span style={{ background: getPlayerGradient(me) }}>{getPlayerAvatar(me)}</span>
          </button>
        </div>
      </header>

      <section className="premium-lobby-card premium-shell-width">
        <div className="lobby-status-line"><i className={`status-dot ${ready ? 'ready' : ''}`} /><span>{ready ? 'BOTH PLAYERS READY' : 'WAITING FOR PLAYER 2'}</span></div>
        <p className="section-kicker">PRIVATE ROOM</p>
        <h1>Share the code</h1>
        <p className="lobby-subtitle">Your opponent joins instantly from any phone or browser.</p>

        <button className="premium-room-code" onClick={copyCode} type="button" aria-label="Copy room code">
          <span>{roomCode}</span>
          <span className="copy-code-action"><AppIcon name="copy" size={18} /> {copied ? 'COPIED' : 'COPY'}</span>
        </button>

        <div className="duel-player-list">
          {[room.players?.p1, room.players?.p2].map((player, index) => (
            <div className={`duel-player-row ${player ? 'is-ready' : ''}`} key={player?.uid || `slot-${index}`}>
              <span className="duel-player-avatar" style={{ background: getPlayerGradient(player || { name: 'Waiting' }) }}>
                {player ? getPlayerAvatar(player) : '·'}
              </span>
              <div className="duel-player-copy">
                <strong>{player?.name || 'Open slot'}</strong>
                <span>{index === 0 ? 'HOST' : 'CHALLENGER'}</span>
              </div>
              <span className={`player-ready-state ${player ? 'ready' : ''}`}>{player ? 'READY' : 'WAITING'}</span>
            </div>
          ))}
        </div>

        {!ready && isHost && (
          <button className="premium-secondary-button" onClick={shareRoom} type="button">
            <AppIcon name="share" size={19} />
            <span>Share invite</span>
          </button>
        )}

        {ready && isHost && (
          <button className="premium-primary-button lobby-start-button" onClick={onStart} disabled={busy} type="button">
            <span className="button-copy"><small>PLAYERS READY</small><strong>{busy ? 'Starting…' : 'Start match'}</strong></span>
            <span className="button-arrow"><AppIcon name="arrow" /></span>
          </button>
        )}

        {ready && !isHost && (
          <div className="premium-waiting-host"><span className="spinner" /><div><strong>Ready to play</strong><span>Waiting for {opponent?.name || 'the host'}…</span></div></div>
        )}

        {error && <div className="error-banner premium-error" role="alert">{error}</div>}

        <button className="premium-text-button danger-text" onClick={onLeave} disabled={busy} type="button">Leave room</button>
      </section>
    </main>
  )
}
