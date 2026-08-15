import { get, onValue, ref, runTransaction, update } from 'firebase/database'
import { db, ensureAuthenticated } from '../lib/firebase.js'

function cleanName(name, fallback) {
  const value = String(name || '').trim().replace(/\s+/g, ' ')
  return (value || fallback).slice(0, 18)
}

export function normalizeRoomCode(roomCode) {
  return String(roomCode || '').replace(/\D/g, '').slice(0, 4)
}

function randomRoomCode() {
  return String(Math.floor(1000 + Math.random() * 9000))
}

export async function createRoom(profile) {
  const user = await ensureAuthenticated()

  for (let attempt = 0; attempt < 40; attempt += 1) {
    const roomCode = randomRoomCode()
    const roomRef = ref(db, `rooms/${roomCode}`)

    const result = await runTransaction(
      roomRef,
      (currentRoom) => {
        if (currentRoom !== null) return

        const now = Date.now()
        return {
          status: 'waiting',
          hostUid: user.uid,
          createdAt: now,
          updatedAt: now,
          players: {
            p1: {
              uid: user.uid,
              name: cleanName(profile?.name, 'Player 1'),
              avatar: profile?.avatar || '🦊',
              accent: profile?.accent || 'ember',
              unoArmed: false,
            },
          },
        }
      },
      { applyLocally: false },
    )

    if (!result.committed) continue

    // IMPORTANT: do not show a room code unless it can be read back from the
    // actual remote Realtime Database. This catches wrong URL/rules instantly.
    const verification = await get(roomRef)
    if (!verification.exists()) {
      throw new Error('Room creation was not saved in Firebase. Check Realtime Database Rules.')
    }

    return { roomCode, uid: user.uid }
  }

  throw new Error('Could not find a free 4-digit room code. Try again.')
}

export async function joinRoom(roomCode, profile) {
  const user = await ensureAuthenticated()
  const code = normalizeRoomCode(roomCode)

  if (!/^\d{4}$/.test(code)) {
    throw new Error('Enter a valid 4-digit room code.')
  }

  const roomRef = ref(db, `rooms/${code}`)
  const snapshot = await get(roomRef)

  if (!snapshot.exists()) {
    throw new Error(`Room ${code} was not found in Firebase.`)
  }

  const room = snapshot.val()

  if (room.players?.p1?.uid === user.uid) {
    throw new Error('This browser is already Player 1. Use another device or a Private/Incognito window for Player 2.')
  }

  if (room.players?.p2?.uid === user.uid) {
    return { roomCode: code, uid: user.uid }
  }

  if (room.players?.p2) {
    throw new Error('This room already has two players.')
  }

  if (room.status !== 'waiting') {
    throw new Error('This game has already started.')
  }

  // Reserve ONLY the p2 slot. This is simpler and safer than transacting the
  // entire room and avoids stale/null room-cache edge cases.
  const p2Ref = ref(db, `rooms/${code}/players/p2`)
  const joinResult = await runTransaction(
    p2Ref,
    (currentPlayer2) => {
      if (currentPlayer2 !== null) return

      return {
        uid: user.uid,
        name: cleanName(profile?.name, 'Player 2'),
        avatar: profile?.avatar || '🦊',
        accent: profile?.accent || 'ember',
        unoArmed: false,
      }
    },
    { applyLocally: false },
  )

  if (!joinResult.committed) {
    throw new Error('Another player joined this room first.')
  }

  await update(roomRef, { updatedAt: Date.now() })

  // Verify the second player is really present on the remote DB.
  const verification = await get(roomRef)
  if (verification.val()?.players?.p2?.uid !== user.uid) {
    throw new Error('Firebase did not save Player 2. Check Realtime Database Rules.')
  }

  return { roomCode: code, uid: user.uid }
}

export function subscribeToRoom(roomCode, onRoom, onError) {
  if (!db || !roomCode) return () => {}

  const roomRef = ref(db, `rooms/${roomCode}`)
  return onValue(
    roomRef,
    (snapshot) => onRoom(snapshot.val()),
    (error) => onError?.(error),
  )
}

export async function leaveRoom(roomCode, uid) {
  if (!db || !roomCode || !uid) return

  const roomRef = ref(db, `rooms/${roomCode}`)
  await runTransaction(
    roomRef,
    (room) => {
      if (!room) return null

      const isPlayer =
        room.players?.p1?.uid === uid || room.players?.p2?.uid === uid

      if (!isPlayer) return
      return null
    },
    { applyLocally: false },
  )
}
