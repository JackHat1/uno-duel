import { useEffect, useState } from 'react'
import AppIcon from './AppIcon'
import { PROFILE_ACCENTS, PROFILE_AVATARS, normalizeProfile } from '../services/profileService'

const accentNames = {
  ember: 'Ember', ocean: 'Ocean', mint: 'Mint', gold: 'Gold', violet: 'Violet', rose: 'Rose',
}

export default function ProfileModal({ profile, uid, busy = false, onSave, onClose }) {
  const [draft, setDraft] = useState(() => normalizeProfile(profile))
  useEffect(() => setDraft(normalizeProfile(profile)), [profile])

  const submit = async (event) => {
    event.preventDefault()
    if (!draft.name.trim()) return
    await onSave(normalizeProfile(draft))
  }

  return (
    <div className="modal-backdrop profile-backdrop v8-profile-backdrop" role="presentation" onClick={onClose}>
      <section className="profile-modal v8-profile-sheet" role="dialog" aria-modal="true" aria-label="Player profile" onClick={(event) => event.stopPropagation()}>
        <div className="v8-sheet-handle" />
        <header className="v8-profile-header">
          <div><small>PLAYER CARD</small><h2>Your look</h2></div>
          <button className="v8-round-tool" type="button" onClick={onClose} aria-label="Close profile"><AppIcon name="close" size={19} /></button>
        </header>

        <div className={`v8-player-card-preview accent-${draft.accent}`}>
          <span className="v8-player-card-avatar">{draft.avatar}</span>
          <div><small>UNO DUEL</small><strong>{draft.name || 'Player'}</strong><span>PLAYER</span></div>
          <i>★</i>
        </div>

        <form onSubmit={submit} className="v8-profile-form">
          <label className="v8-field-label" htmlFor="profile-name">Name</label>
          <input
            id="profile-name"
            className="v8-name-input"
            value={draft.name}
            maxLength={18}
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            autoComplete="nickname"
            disabled={busy}
          />

          <div className="v8-profile-block">
            <span className="v8-field-label">Avatar</span>
            <div className="v8-avatar-grid">
              {PROFILE_AVATARS.map((avatar) => (
                <button key={avatar} className={draft.avatar === avatar ? 'selected' : ''} type="button" onClick={() => setDraft((current) => ({ ...current, avatar }))}>{avatar}</button>
              ))}
            </div>
          </div>

          <div className="v8-profile-block">
            <span className="v8-field-label">Card color</span>
            <div className="v8-accent-row">
              {PROFILE_ACCENTS.map((accent) => (
                <button key={accent} className={`accent-${accent} ${draft.accent === accent ? 'selected' : ''}`} type="button" onClick={() => setDraft((current) => ({ ...current, accent }))} aria-label={accentNames[accent]}><i /></button>
              ))}
            </div>
          </div>

          <div className="v8-player-id"><span>PLAYER ID</span><code>{uid ? `${uid.slice(0, 6)}…${uid.slice(-4)}` : 'connecting…'}</code></div>

          <button className="v8-play-button v8-save-profile" type="submit" disabled={busy || !draft.name.trim()}>
            <span className="v8-play-button-copy"><small>PLAYER CARD</small><strong>{busy ? 'Saving…' : 'Save changes'}</strong></span>
            <span className="v8-play-button-arrow"><AppIcon name="arrow" size={21} /></span>
          </button>
        </form>
      </section>
    </div>
  )
}
