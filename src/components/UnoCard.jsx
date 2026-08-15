import { getCardLabel, getCardSpokenName } from '../game/rules'

export default function UnoCard({ card, playable = true, selected = false, onClick, small = false }) {
  if (!card) return null

  const classNames = [
    'uno-card',
    `card-${card.color}`,
    playable ? 'is-playable' : 'is-disabled',
    selected ? 'is-selected' : '',
    small ? 'is-small' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      className={classNames}
      onClick={() => playable && onClick?.(card)}
      disabled={!playable}
      aria-label={getCardSpokenName(card)}
    >
      <span className="corner-label corner-top">{getCardLabel(card)}</span>
      <span className="card-oval">
        <span className="card-main-label">{getCardLabel(card)}</span>
      </span>
      <span className="corner-label corner-bottom">{getCardLabel(card)}</span>
    </button>
  )
}
