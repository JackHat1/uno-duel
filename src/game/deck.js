export const CARD_COLORS = ['red', 'yellow', 'green', 'blue']

function makeCard(id, color, type, value = null) {
  return { id, color, type, value }
}

export function createUnoDeck() {
  const deck = []

  for (const color of CARD_COLORS) {
    deck.push(makeCard(`${color}-0`, color, 'number', 0))

    for (let number = 1; number <= 9; number += 1) {
      deck.push(makeCard(`${color}-${number}-a`, color, 'number', number))
      deck.push(makeCard(`${color}-${number}-b`, color, 'number', number))
    }

    for (const copy of ['a', 'b']) {
      deck.push(makeCard(`${color}-skip-${copy}`, color, 'skip'))
      deck.push(makeCard(`${color}-reverse-${copy}`, color, 'reverse'))
      deck.push(makeCard(`${color}-draw2-${copy}`, color, 'draw2'))
    }
  }

  for (let index = 1; index <= 4; index += 1) {
    deck.push(makeCard(`wild-${index}`, 'wild', 'wild'))
    deck.push(makeCard(`wild4-${index}`, 'wild', 'wild4'))
  }

  return deck
}

export function shuffleCards(cards) {
  const result = [...cards]

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[randomIndex]] = [result[randomIndex], result[index]]
  }

  return result
}
