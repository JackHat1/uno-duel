import AppIcon from './AppIcon'

export default function GameSettingsSheet({
  open,
  onClose,
  theme,
  onToggleTheme,
  soundEnabled,
  onToggleSound,
  musicEnabled,
  onToggleMusic,
  onLeave,
  onUiSound,
  busy,
}) {
  if (!open) return null

  return (
    <div className="ios-settings-backdrop" role="presentation" onClick={() => { onUiSound?.(); onClose() }}>
      <section className="ios-settings-sheet" role="dialog" aria-modal="true" aria-label="Game settings" onClick={(event) => event.stopPropagation()}>
        <div className="ios-sheet-handle" />
        <div className="ios-settings-header">
          <div>
            <span>GAME</span>
            <strong>Settings</strong>
          </div>
          <button className="clean-icon-button ios-settings-close" type="button" onClick={() => { onUiSound?.(); onClose() }} aria-label="Close settings">
            <AppIcon name="close" />
          </button>
        </div>

        <div className="ios-settings-grid">
          <button className="ios-setting-tile" type="button" onClick={() => { onUiSound?.(); onToggleTheme() }}>
            <span className="ios-setting-icon"><AppIcon name={theme === 'dark' ? 'sun' : 'moon'} /></span>
            <span><strong>Appearance</strong><small>{theme === 'dark' ? 'Dark table' : 'Light table'}</small></span>
            <i>{theme === 'dark' ? 'DARK' : 'LIGHT'}</i>
          </button>

          <button className={`ios-setting-tile ${soundEnabled ? 'is-enabled' : ''}`} type="button" onClick={() => { onUiSound?.(); onToggleSound() }}>
            <span className="ios-setting-icon"><AppIcon name={soundEnabled ? 'volume' : 'mute'} /></span>
            <span><strong>Game sounds</strong><small>Cards, turns & penalties</small></span>
            <i>{soundEnabled ? 'ON' : 'OFF'}</i>
          </button>

          <button className={`ios-setting-tile ${musicEnabled ? 'is-enabled' : ''}`} type="button" onClick={() => { onUiSound?.(); onToggleMusic() }}>
            <span className="ios-setting-icon"><AppIcon name="music" /></span>
            <span><strong>Music</strong><small>Ambient background loop</small></span>
            <i>{musicEnabled ? 'ON' : 'OFF'}</i>
          </button>
        </div>

        <button className="ios-leave-room" type="button" onClick={onLeave} disabled={busy}>
          <AppIcon name="exit" />
          <span>Leave room</span>
        </button>
      </section>
    </div>
  )
}
