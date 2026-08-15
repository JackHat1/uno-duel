import { useState } from 'react'
import AppIcon from './AppIcon'
import { getAccentGradient } from '../lib/playerVisuals'
import { playMenuSound } from '../hooks/useGameAudio'

export default function HomeScreen({
  onCreate,
  onJoin,
  busy,
  error,
  theme,
  profile,
  onOpenProfile,
  onToggleTheme,
}) {
  const [roomCode, setRoomCode] = useState('')

  const submitJoin = async (event) => {
    event.preventDefault()
    if (roomCode.length !== 4) return
    playMenuSound('turn')
    await onJoin(roomCode)
  }

  return (
    <main className="home-screen safe-screen v8-menu-screen">
      <div className="v8-felt-bg" aria-hidden="true" />
      <div className="v8-menu-card v8-menu-card-left" aria-hidden="true"><span>7</span></div>
      <div className="v8-menu-card v8-menu-card-right" aria-hidden="true"><span>+2</span></div>

      <header className="v8-menu-topbar">
        <div className="v8-wordmark-small"><b>UNO</b><span>DUEL</span></div>
        <div className="v8-menu-tools">
          <button className="v8-round-tool" type="button" onClick={() => { playMenuSound('tap'); onToggleTheme() }} aria-label="Toggle theme">
            <AppIcon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
          </button>
          <button className="v8-player-chip" type="button" onClick={() => { playMenuSound('tap'); onOpenProfile() }}>
            <span className="v8-player-chip-avatar" style={{ background: getAccentGradient(profile?.accent) }}>{profile?.avatar}</span>
            <span>{profile?.name || 'Player'}</span>
          </button>
        </div>
      </header>

      <section className="v8-home-stage">
        <div className="v8-logo-lockup" aria-label="UNO Duel">
          <span className="v8-logo-uno">UNO</span>
          <span className="v8-logo-duel">DUEL</span>
        </div>
        <p className="v8-home-tagline">Two players. One table.</p>

        <div className="v8-home-actions">
          <button className="v8-play-button" type="button" onClick={() => { playMenuSound('start'); onCreate() }} disabled={busy}>
            <span className="v8-play-button-copy">
              <small>NEW GAME</small>
              <strong>{busy ? 'Opening table…' : 'Create room'}</strong>
            </span>
            <span className="v8-play-button-arrow"><AppIcon name="arrow" size={22} /></span>
          </button>

          <form onSubmit={submitJoin} className="v8-join-panel">
            <label htmlFor="room-code">JOIN A ROOM</label>
            <div className="v8-code-row">
              <input
                id="room-code"
                value={roomCode}
                onChange={(event) => setRoomCode(event.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="0000"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                enterKeyHint="go"
                disabled={busy}
                aria-label="4-digit room code"
              />
              <button type="submit" disabled={busy || roomCode.length !== 4} aria-label="Join room">
                <AppIcon name="arrow" size={21} />
              </button>
            </div>
          </form>
        </div>

        {error && <div className="v8-error-toast" role="alert">{error}</div>}

        <footer className="v8-home-footer">
          <span><i /> Online</span>
          <span>Private 1v1 rooms</span>
        </footer>
      </section>
    </main>
  )
}
