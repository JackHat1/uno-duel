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
    <main className="home-screen safe-screen premium-home-screen v7-home-screen">
      <div className="ambient-grid" aria-hidden="true" />
      <div className="ambient-orb orb-one" aria-hidden="true" />
      <div className="ambient-orb orb-two" aria-hidden="true" />
      <div className="ambient-orb orb-three" aria-hidden="true" />

      <header className="home-topbar premium-shell-width">
        <div className="mini-brand-lockup">
          <span className="mini-brand-symbol">U</span>
          <div><strong>UNO DUEL</strong><small>REALTIME</small></div>
        </div>
        <div className="home-header-actions">
          <button className="clean-icon-button premium-control" type="button" onClick={() => { playMenuSound('tap'); onToggleTheme() }} aria-label="Toggle theme">
            <AppIcon name={theme === 'dark' ? 'sun' : 'moon'} />
          </button>
          <button className="clean-profile-button" type="button" onClick={() => { playMenuSound('tap'); onOpenProfile() }}>
            <span className="header-profile-avatar" style={{ background: getAccentGradient(profile?.accent) }}>{profile?.avatar}</span>
            <span className="header-profile-copy"><small>PLAYER</small><strong>{profile?.name || 'Player'}</strong></span>
            <AppIcon name="edit" size={16} />
          </button>
        </div>
      </header>

      <section className="premium-home-card premium-shell-width v7-home-card">
        <div className="v7-home-card-fan" aria-hidden="true"><i>U</i><i>N</i><i>O</i></div>
        <div className="hero-lockup">
          <div className="hero-logo-wrap">
            <div className="hero-logo-shadow" />
            <div className="hero-logo">UNO</div>
          </div>
          <p className="hero-eyebrow">HEAD TO HEAD · REAL TIME</p>
          <h1>One room.<br />One winner.</h1>
          <p className="hero-subtitle">Fast, private UNO battles built for your phone.</p>
        </div>

        <div className="home-action-stack">
          <button className="premium-primary-button create-room-premium" type="button" onClick={() => { playMenuSound('start'); onCreate() }} disabled={busy}>
            <span className="button-copy"><small>START A NEW MATCH</small><strong>{busy ? 'Connecting…' : 'Create room'}</strong></span>
            <span className="button-arrow"><AppIcon name="arrow" /></span>
          </button>

          <div className="premium-divider"><span>OR JOIN A FRIEND</span></div>

          <form onSubmit={submitJoin} className="premium-join-card">
            <div className="join-input-wrap">
              <span className="join-label">ROOM CODE</span>
              <input
                id="room-code"
                className="premium-room-code-input"
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
            </div>
            <button className="premium-join-button" type="submit" disabled={busy || roomCode.length !== 4}>
              <span>Join</span>
              <AppIcon name="arrow" size={19} />
            </button>
          </form>
        </div>

        {error && <div className="error-banner premium-error" role="alert">{error}</div>}

        <div className="premium-feature-row">
          <span><i className="status-dot" /> LIVE FIREBASE</span>
          <span>PRIVATE ROOMS</span>
          <span>iPHONE READY</span>
        </div>
      </section>
    </main>
  )
}
