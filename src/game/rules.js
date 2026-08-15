import { CARD_COLORS } from './deck.js'

export function isValidColor(color) {
  return CARD_COLORS.includes(color)
}

export function getTopCard(game) {
  if (!game?.discard?.length) return null
  return game.discard[game.discard.length - 1]
}

export function canPlayCard(card, topCard, currentColor, hand = []) {
  if (!card || !topCard) return false

  if (card.type === 'wild') return true

  if (card.type === 'wild4') {
    return !hand.some(
      (handCard) => handCard.id !== card.id && handCard.color === currentColor,
    )
  }

  if (card.color === currentColor) return true

  if (
    card.type === 'number' &&
    topCard.type === 'number' &&
    card.value === topCard.value
  ) {
    return true
  }

  return card.type !== 'number' && card.type === topCard.type
}

export function getCardLabel(card) {
  if (!card) return ''
  if (card.type === 'number') return String(card.value)
  if (card.type === 'skip') return '⊘'
  if (card.type === 'reverse') return '↻'
  if (card.type === 'draw2') return '+2'
  if (card.type === 'wild4') return '+4'
  return 'W'
}

export function getCardSpokenName(card) {
  if (!card) return 'card'
  if (card.type === 'number') return `${card.color} ${card.value}`
  if (card.type === 'draw2') return `${card.color} draw two`
  if (card.type === 'wild4') return 'wild draw four'
  if (card.type === 'wild') return 'wild'
  return `${card.color} ${card.type}`
}
