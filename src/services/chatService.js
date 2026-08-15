import { ref, runTransaction } from 'firebase/database'
import { db } from '../lib/firebase.js'

export const QUICK_MESSAGES = [
  'Nice! 😎',
  'Ouch 😭',
  'UNO! 🔥',
  'Good luck 🍀',
  'Your turn 👀',
  'No way! 🤯',
  'GG 🤝',
  '😂',
  '🔥',
  '👏',
  '😈',
  '💀',
]

export async function sendQuickMessage(roomCode, uid, text) {
  if (!db) throw new Error('Firebase is not configured.')
  if (!QUICK_MESSAGES.includes(text)) throw new Error('That quick message is not available.')

  const roomRef = ref(db, `rooms/${roomCode}`)
  let failureReason = 'Message could not be sent.'

  const result = await runTransaction(
    roomRef,
    (room) => {
      if (!room) {
        failureReason = 'The room no longer exists.'
        return
      }

      const isPlayer = room.players?.p1?.uid === uid || room.players?.p2?.uid === uid
      if (!isPlayer) {
        failureReason = 'You are not a player in this room.'
        return
      }

      const now = Date.now()
      room.chat = {
        latest: {
          id: `${now}-${Math.random().toString(36).slice(2, 7)}`,
          senderUid: uid,
          text,
          sentAt: now,
        },
      }
      room.updatedAt = now
      return room
    },
    { applyLocally: false },
  )

  if (!result.committed) throw new Error(failureReason)
  return result.snapshot.val()?.chat?.latest || null
}
