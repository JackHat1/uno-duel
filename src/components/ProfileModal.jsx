import { useEffect, useState } from 'react'
import AppIcon from './AppIcon'
import { PROFILE_ACCENTS, PROFILE_AVATARS, normalizeProfile } from '../services/profileService'

const accentNames = {
  ember: 'Ember',
  ocean: 'Ocean',
  mint: 'Mint',
  gold: 'Gold',
  violet: 'Violet',
  rose: 'Rose',
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
    <div className="modal-backdrop profile-backdrop" role="presentation" onClick={onClose}>
      <section className="profile-modal" role="dialog" aria-modal="true" aria-label="Player account" onClick={(event) => event.stopPropagation()}>
        <header className="profile-modal-header">
          <div>
            <span className="section-kicker">PLAYER ACCOUNT</span>
            <h2>Make it yours</h2>
          </div>
          <button className="clean-icon-button" type="button" onClick={onClose} aria-label="Close profile">
            <AppIcon name="close" />
          </button>
        </header>

        <div className={`profile-hero accent-${draft.accent}`}>
          <div className="profile-avatar-xl">{draft.avatar}</div>
          <div>
            <strong>{draft.name || 'Player'}</strong>
            <span>UNO Duel Player</span>
          </div>
        </div>

        <form onSubmit={submit} className="profile-form">
          <label className="field-label" htmlFor="profile-name">Display name</label>
          <input
            id="profile-name"
            className="text-input profile-name-input"
            value={draft.name}
            maxLength={18}
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            autoComplete="nickname"
            disabled={busy}
          />

          <div className="profile-field-block">
            <span className="field-label">Avatar</span>
            <div className="avatar-picker-grid">
              {PROFILE_AVATARS.map((avatar) => (
                <button
                  key={avatar}
                  className={`avatar-choice ${draft.avatar === avatar ? 'selected' : ''}`}
                  type="button"
                  onClick={() => setDraft((current) => ({ ...current, avatar }))}
                  aria-label={`Choose avatar ${avatar}`}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>

          <div className="profile-field-block">
            <span className="field-label">Accent</span>
            <div className="accent-picker-grid">
              {PROFILE_ACCENTS.map((accent) => (
                <button
                  key={accent}
                  className={`accent-choice accent-${accent} ${draft.accent === accent ? 'selected' : ''}`}
                  type="button"
                  onClick={() => setDraft((current) => ({ ...current, accent }))}
                >
                  <i />
                  <span>{accentNames[accent]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="account-id-row">
            <span>PLAYER ID</span>
            <code>{uid ? `${uid.slice(0, 6)}…${uid.slice(-4)}` : 'connecting…'}</code>
          </div>

          <button className="premium-primary-button" type="submit" disabled={busy || !draft.name.trim()}>
            <span>{busy ? 'Saving…' : 'Save profile'}</span>
            <AppIcon name="arrow" size={18} />
          </button>
        </form>
      </section>
    </div>
  )
}
