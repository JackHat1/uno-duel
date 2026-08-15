import { useState } from 'react'
import AppIcon from './AppIcon'
import { getPlayerAvatar, getPlayerGradient } from '../lib/playerVisuals'
import { playMenuSound } from '../hooks/useGameAudio'

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
    playMenuSound('tap')
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
    playMenuSound('chatOpen')
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
    <main className="lobby-screen safe-screen v8-lobby-screen">
      <div className="v8-felt-bg" aria-hidden="true" />

      <header className="v8-menu-topbar">
        <button className="v8-leave-mini" type="button" onClick={() => { playMenuSound('tap'); onLeave() }} disabled={busy}>
          <AppIcon name="exit" size={17} />
          <span>Leave</span>
        </button>
        <div className="v8-wordmark-small"><b>UNO</b><span>DUEL</span></div>
        <div className="v8-menu-tools">
          <button className="v8-round-tool" type="button" onClick={() => { playMenuSound('tap'); onToggleTheme() }} aria-label="Toggle theme"><AppIcon name={theme === 'dark' ? 'sun' : 'moon'} size={18} /></button>
          <button className="v8-round-tool v8-profile-tool" type="button" onClick={() => { playMenuSound('tap'); onOpenProfile() }} aria-label="Player profile"><span style={{ background: getPlayerGradient(me) }}>{getPlayerAvatar(me)}</span></button>
        </div>
      </header>

      <section className="v8-lobby-stage">
        <div className="v8-room-ticket">
          <span>ROOM CODE</span>
          <button type="button" onClick={copyCode} aria-label="Copy room code">{roomCode}</button>
          <small>{copied ? 'Copied to clipboard' : 'Tap the code to copy'}</small>
        </div>

        <div className="v8-versus-table">
          <div className={`v8-seat v8-seat-you ${me ? 'is-ready' : ''}`}>
            <span className="v8-seat-avatar" style={{ background: getPlayerGradient(me) }}>{getPlayerAvatar(me)}</span>
            <div><small>YOU</small><strong>{me?.name || 'Player'}</strong></div>
            <i>{me ? 'READY' : 'WAITING'}</i>
          </div>

          <div className="v8-vs-medallion">VS</div>

          <div className={`v8-seat v8-seat-opponent ${opponent ? 'is-ready' : ''}`}>
            <span className="v8-seat-avatar" style={{ background: getPlayerGradient(opponent || { name: 'Opponent' }) }}>{opponent ? getPlayerAvatar(opponent) : '?'}</span>
            <div><small>OPPONENT</small><strong>{opponent?.name || 'Waiting…'}</strong></div>
            <i>{opponent ? 'READY' : 'OPEN'}</i>
          </div>
        </div>

        <div className="v8-lobby-status">
          <span className={ready ? 'ready' : ''} />
          {ready ? 'Both players are ready' : 'Waiting for your opponent'}
        </div>

        {!ready && isHost && (
          <button className="v8-secondary-game-button" onClick={shareRoom} type="button">
            <AppIcon name="share" size={19} />
            <span>Share invite</span>
          </button>
        )}

        {ready && isHost && (
          <button className="v8-play-button v8-start-match" onClick={() => { playMenuSound('start'); onStart() }} disabled={busy} type="button">
            <span className="v8-play-button-copy"><small>MATCH READY</small><strong>{busy ? 'Dealing…' : 'Start game'}</strong></span>
            <span className="v8-play-button-arrow"><AppIcon name="arrow" size={22} /></span>
          </button>
        )}

        {ready && !isHost && (
          <div className="v8-host-wait"><span className="spinner" /><div><strong>Ready</strong><span>Waiting for {opponent?.name || 'host'} to deal…</span></div></div>
        )}

        {error && <div className="v8-error-toast" role="alert">{error}</div>}
      </section>
    </main>
  )
}
