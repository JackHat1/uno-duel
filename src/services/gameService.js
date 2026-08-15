import { ref, runTransaction } from 'firebase/database'
import { createUnoDeck, shuffleCards } from '../game/deck.js'
import { canPlayCard, getTopCard, isValidColor } from '../game/rules.js'
import { db } from '../lib/firebase.js'

function asArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean)
  if (!value || typeof value !== 'object') return []
  return Object.keys(value)
    .sort((a, b) => Number(a) - Number(b))
    .map((key) => value[key])
    .filter(Boolean)
}

function getPlayerEntry(room, uid) {
  if (room.players?.p1?.uid === uid) return ['p1', room.players.p1]
  if (room.players?.p2?.uid === uid) return ['p2', room.players.p2]
  return [null, null]
}

function getOpponent(room, uid) {
  if (room.players?.p1?.uid === uid) return room.players?.p2 || null
  if (room.players?.p2?.uid === uid) return room.players?.p1 || null
  return null
}

function normalizeGameArrays(game) {
  game.deck = asArray(game.deck)
  game.discard = asArray(game.discard)
  game.hands = game.hands || {}

  for (const uid of Object.keys(game.hands)) {
    game.hands[uid] = asArray(game.hands[uid])
  }
}

function recycleDeckIfNeeded(game) {
  normalizeGameArrays(game)

  if (game.deck.length > 0 || game.discard.length <= 1) return

  const topCard = game.discard[game.discard.length - 1]
  const recyclable = game.discard.slice(0, -1)
  game.deck = shuffleCards(recyclable)
  game.discard = [topCard]
}

function drawCards(game, uid, amount) {
  normalizeGameArrays(game)
  game.hands[uid] = asArray(game.hands[uid])
  const drawn = []

  for (let count = 0; count < amount; count += 1) {
    recycleDeckIfNeeded(game)
    if (game.deck.length === 0) break

    const card = game.deck.pop()
    game.hands[uid].push(card)
    drawn.push(card)
  }

  return drawn
}

function expireOpponentUnoWindow(game, actingUid) {
  if (game.unoCatchableUid && game.unoCatchableUid !== actingUid) {
    game.unoCatchableUid = null
  }
}

function setNextTurn(game, uid) {
  game.currentTurnUid = uid
  game.drawnCardId = null
  game.turnNumber = (game.turnNumber || 0) + 1
}

function setGameEvent(game, event) {
  const timestamp = Date.now()
  game.eventSequence = Number(game.eventSequence || 0) + 1
  game.lastEvent = {
    id: `${timestamp}-${game.eventSequence}`,
    at: timestamp,
    sequence: game.eventSequence,
    ...event,
  }
}

async function roomTransaction(roomCode, updateRoom) {
  if (!db) throw new Error('Firebase is not configured.')

  let failureReason = 'That action is not allowed right now.'
  const roomRef = ref(db, `rooms/${roomCode}`)

  const result = await runTransaction(
    roomRef,
    (room) => {
      if (!room) {
        failureReason = 'The room no longer exists.'
        return
      }

      const fail = (message) => {
        failureReason = message
        return false
      }

      if (updateRoom(room, fail) === false) return
      room.updatedAt = Date.now()
      return room
    },
    { applyLocally: false },
  )

  if (!result.committed) {
    throw new Error(failureReason)
  }

  return result.snapshot.val()
}

function makeFreshGame(room) {
  const p1 = room.players.p1
  const p2 = room.players.p2
  const deck = shuffleCards(createUnoDeck())
  const hands = {
    [p1.uid]: [],
    [p2.uid]: [],
  }

  for (let cardIndex = 0; cardIndex < 7; cardIndex += 1) {
    hands[p1.uid].push(deck.pop())
    hands[p2.uid].push(deck.pop())
  }

  let starterIndex = deck.findIndex((card) => card.type === 'number')
  if (starterIndex < 0) starterIndex = 0
  const [starterCard] = deck.splice(starterIndex, 1)

  return {
    phase: 'playing',
    deck,
    discard: [starterCard],
    hands,
    currentTurnUid: p1.uid,
    currentColor: starterCard.color,
    direction: 1,
    drawnCardId: null,
    unoCatchableUid: null,
    winnerUid: null,
    turnNumber: 1,
    message: `${p1.name} starts`,
    lastActionAt: Date.now(),
    eventSequence: 0,
    lastEvent: {
      id: `round-start-${Date.now()}`,
      at: Date.now(),
      sequence: 0,
      type: 'round_start',
      actorUid: p1.uid,
      targetUid: p1.uid,
      label: `Round ${Number(room.match?.round || 1)}`,
    },
  }
}

export async function startGame(roomCode, uid) {
  return roomTransaction(roomCode, (room, fail) => {
    if (room.hostUid !== uid) return fail('Only the room creator can start the game.')
    if (!room.players?.p2) return fail('A second player has not joined yet.')

    const p1 = room.players.p1
    const p2 = room.players.p2
    const previousRoundFinished = room.status === 'finished' || room.game?.phase === 'finished'
    const previousMatchFinished = Boolean(room.match?.matchWinnerUid)

    if (!room.match || previousMatchFinished) {
      room.match = {
        round: 1,
        targetWins: 5,
        wins: {
          [p1.uid]: 0,
          [p2.uid]: 0,
        },
        matchWinnerUid: null,
      }
    } else {
      room.match.wins = room.match.wins || {}
      room.match.wins[p1.uid] = Number(room.match.wins[p1.uid] || 0)
      room.match.wins[p2.uid] = Number(room.match.wins[p2.uid] || 0)
      room.match.targetWins = Number(room.match.targetWins || 5)
      room.match.round = Number(room.match.round || 1)
      if (previousRoundFinished) room.match.round += 1
    }

    room.players.p1.unoArmed = false
    room.players.p2.unoArmed = false
    room.game = makeFreshGame(room)
    room.game.round = room.match.round
    room.status = 'playing'
    return true
  })
}

export async function playCard(roomCode, uid, cardId, chosenColor = null) {
  return roomTransaction(roomCode, (room, fail) => {
    if (room.status !== 'playing' || room.game?.phase !== 'playing') {
      return fail('The game is not active.')
    }

    const [playerKey, player] = getPlayerEntry(room, uid)
    const opponent = getOpponent(room, uid)
    if (!player || !opponent) return fail('You are not a player in this room.')

    const game = room.game
    normalizeGameArrays(game)

    if (game.currentTurnUid !== uid) return fail('Wait for your turn.')

    const hand = asArray(game.hands?.[uid])
    game.hands[uid] = hand

    const cardIndex = hand.findIndex((card) => card.id === cardId)
    if (cardIndex < 0) return fail('That card is not in your hand.')

    const card = hand[cardIndex]
    const topCard = getTopCard(game)

    if (game.drawnCardId && game.drawnCardId !== card.id) {
      return fail('After drawing, you may only play the card you just drew.')
    }

    if (!canPlayCard(card, topCard, game.currentColor, hand)) {
      return fail('That card cannot be played on the current card.')
    }

    if ((card.type === 'wild' || card.type === 'wild4') && !isValidColor(chosenColor)) {
      return fail('Choose a color first.')
    }

    expireOpponentUnoWindow(game, uid)

    hand.splice(cardIndex, 1)
    game.discard.push(card)
    game.currentColor =
      card.type === 'wild' || card.type === 'wild4' ? chosenColor : card.color
    game.drawnCardId = null
    game.lastActionAt = Date.now()

    if (hand.length === 1) {
      game.unoCatchableUid = player.unoArmed ? null : uid
    } else if (game.unoCatchableUid === uid) {
      game.unoCatchableUid = null
    }

    room.players[playerKey].unoArmed = false

    if (card.type === 'skip') {
      setNextTurn(game, uid)
      game.message = `${player.name} played Skip and plays again`
      setGameEvent(game, {
        type: 'skip',
        actorUid: uid,
        targetUid: opponent.uid,
        cardId: card.id,
        cardType: card.type,
        color: game.currentColor,
        actorName: player.name,
        targetName: opponent.name,
      })
    } else if (card.type === 'reverse') {
      game.direction = game.direction === 1 ? -1 : 1
      setNextTurn(game, uid)
      game.message = `${player.name} played Reverse and plays again`
      setGameEvent(game, {
        type: 'reverse',
        actorUid: uid,
        targetUid: opponent.uid,
        cardId: card.id,
        cardType: card.type,
        color: game.currentColor,
        actorName: player.name,
        targetName: opponent.name,
      })
    } else if (card.type === 'draw2') {
      drawCards(game, opponent.uid, 2)
      setNextTurn(game, uid)
      game.message = `${opponent.name} draws 2 — ${player.name} plays again`
      setGameEvent(game, {
        type: 'draw2',
        actorUid: uid,
        targetUid: opponent.uid,
        amount: 2,
        cardId: card.id,
        cardType: card.type,
        color: game.currentColor,
        actorName: player.name,
        targetName: opponent.name,
      })
    } else if (card.type === 'wild4') {
      drawCards(game, opponent.uid, 4)
      setNextTurn(game, uid)
      game.message = `${opponent.name} draws 4 — ${player.name} plays again`
      setGameEvent(game, {
        type: 'wild4',
        actorUid: uid,
        targetUid: opponent.uid,
        amount: 4,
        cardId: card.id,
        cardType: card.type,
        color: game.currentColor,
        actorName: player.name,
        targetName: opponent.name,
      })
    } else if (card.type === 'wild') {
      setNextTurn(game, opponent.uid)
      game.message = `${player.name} changed color to ${game.currentColor}`
      setGameEvent(game, {
        type: 'wild_color',
        actorUid: uid,
        targetUid: opponent.uid,
        cardId: card.id,
        cardType: card.type,
        color: game.currentColor,
        actorName: player.name,
        targetName: opponent.name,
      })
    } else {
      setNextTurn(game, opponent.uid)
      game.message = `${player.name} played a card`
      setGameEvent(game, {
        type: 'play',
        actorUid: uid,
        targetUid: opponent.uid,
        cardId: card.id,
        cardType: card.type,
        color: game.currentColor,
        value: card.value ?? null,
        actorName: player.name,
        targetName: opponent.name,
      })
    }


    if (hand.length === 0) {
      game.phase = 'finished'
      game.winnerUid = uid
      game.currentTurnUid = null
      game.drawnCardId = null
      game.unoCatchableUid = null

      const targetWins = Number(room.match?.targetWins || 5)
      room.match = room.match || {
        round: Number(game.round || 1),
        targetWins,
        wins: {},
        matchWinnerUid: null,
      }
      room.match.wins = room.match.wins || {}
      room.match.wins[uid] = Number(room.match.wins[uid] || 0) + 1
      room.match.targetWins = targetWins

      if (room.match.wins[uid] >= targetWins) {
        room.match.matchWinnerUid = uid
        game.message = `${player.name} wins the match!`
      } else {
        game.message = `${player.name} wins round ${room.match.round || game.round || 1}!`
      }

      room.status = 'finished'
      setGameEvent(game, {
        type: 'win',
        actorUid: uid,
        targetUid: opponent.uid,
        actorName: player.name,
        targetName: opponent.name,
        matchComplete: Boolean(room.match.matchWinnerUid),
      })
    }

    return true
  })
}

export async function drawCard(roomCode, uid) {
  return roomTransaction(roomCode, (room, fail) => {
    if (room.status !== 'playing' || room.game?.phase !== 'playing') {
      return fail('The game is not active.')
    }

    const [playerKey, player] = getPlayerEntry(room, uid)
    const opponent = getOpponent(room, uid)
    if (!player || !opponent) return fail('You are not a player in this room.')

    const game = room.game
    normalizeGameArrays(game)

    if (game.currentTurnUid !== uid) return fail('Wait for your turn.')
    if (game.drawnCardId) return fail('You already drew a card. Play it or pass.')

    expireOpponentUnoWindow(game, uid)
    room.players[playerKey].unoArmed = false

    const [drawnCard] = drawCards(game, uid, 1)
    if (!drawnCard) return fail('There are no cards left to draw.')

    const hand = game.hands[uid]
    const topCard = getTopCard(game)
    const playable = canPlayCard(drawnCard, topCard, game.currentColor, hand)

    if (playable) {
      game.drawnCardId = drawnCard.id
      game.message = `${player.name} drew a playable card`
    } else {
      setNextTurn(game, opponent.uid)
      game.message = `${player.name} drew a card`
    }

    game.lastActionAt = Date.now()
    setGameEvent(game, {
      type: 'draw',
      actorUid: uid,
      targetUid: uid,
      amount: 1,
      actorName: player.name,
      targetName: player.name,
      playable,
    })
    return true
  })
}

export async function passAfterDraw(roomCode, uid) {
  return roomTransaction(roomCode, (room, fail) => {
    if (room.status !== 'playing' || room.game?.phase !== 'playing') {
      return fail('The game is not active.')
    }

    const [playerKey, player] = getPlayerEntry(room, uid)
    const opponent = getOpponent(room, uid)
    if (!player || !opponent) return fail('You are not a player in this room.')

    const game = room.game
    if (game.currentTurnUid !== uid || !game.drawnCardId) {
      return fail('There is no drawn card to pass on.')
    }

    expireOpponentUnoWindow(game, uid)
    room.players[playerKey].unoArmed = false
    setNextTurn(game, opponent.uid)
    game.message = `${player.name} passed`
    game.lastActionAt = Date.now()
    setGameEvent(game, {
      type: 'pass',
      actorUid: uid,
      targetUid: opponent.uid,
      actorName: player.name,
      targetName: opponent.name,
    })
    return true
  })
}

export async function callUno(roomCode, uid) {
  return roomTransaction(roomCode, (room, fail) => {
    if (room.status !== 'playing' || room.game?.phase !== 'playing') {
      return fail('The game is not active.')
    }

    const [playerKey, player] = getPlayerEntry(room, uid)
    if (!player) return fail('You are not a player in this room.')

    const game = room.game
    normalizeGameArrays(game)
    const hand = asArray(game.hands?.[uid])

    if (hand.length === 2 && game.currentTurnUid === uid) {
      room.players[playerKey].unoArmed = true
      game.message = `${player.name} called UNO!`
      setGameEvent(game, {
        type: 'uno',
        actorUid: uid,
        targetUid: uid,
        actorName: player.name,
      })
      return true
    }

    if (hand.length === 1 && game.unoCatchableUid === uid) {
      game.unoCatchableUid = null
      room.players[playerKey].unoArmed = false
      game.message = `${player.name} called UNO!`
      setGameEvent(game, {
        type: 'uno',
        actorUid: uid,
        targetUid: uid,
        actorName: player.name,
      })
      return true
    }

    return fail('Call UNO when you are about to go from 2 cards to 1.')
  })
}

export async function catchUno(roomCode, catcherUid) {
  return roomTransaction(roomCode, (room, fail) => {
    if (room.status !== 'playing' || room.game?.phase !== 'playing') {
      return fail('The game is not active.')
    }

    const [, catcher] = getPlayerEntry(room, catcherUid)
    if (!catcher) return fail('You are not a player in this room.')

    const game = room.game
    const victimUid = game.unoCatchableUid
    if (!victimUid || victimUid === catcherUid) {
      return fail('There is nobody to catch right now.')
    }

    const [victimKey, victim] = getPlayerEntry(room, victimUid)
    if (!victim) return fail('The UNO target is no longer in the game.')

    drawCards(game, victimUid, 2)
    game.unoCatchableUid = null
    room.players[victimKey].unoArmed = false
    game.message = `${catcher.name} caught ${victim.name}! ${victim.name} draws 2`
    game.lastActionAt = Date.now()
    setGameEvent(game, {
      type: 'catch_uno',
      actorUid: catcherUid,
      targetUid: victimUid,
      amount: 2,
      actorName: catcher.name,
      targetName: victim.name,
    })
    return true
  })
}
