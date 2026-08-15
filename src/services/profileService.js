import { get, ref, set, update } from 'firebase/database'
import { db } from '../lib/firebase.js'

export const PROFILE_AVATARS = ['🦊', '🐼', '🐯', '🦁', '🐸', '🐵', '🐧', '🐙', '🦄', '🐲', '😎', '🤠', '🦅', '🐺', '🦈', '🦖']
export const PROFILE_ACCENTS = ['ember', 'ocean', 'mint', 'gold', 'violet', 'rose']

const LOCAL_PROFILE_KEY = 'uno:player-profile-v1'
const PROFILE_NETWORK_TIMEOUT_MS = 2500

function cleanName(name) {
  const value = String(name || '').trim().replace(/\s+/g, ' ')
  return (value || 'Player').slice(0, 18)
}

function normalizeAvatar(avatar) {
  return PROFILE_AVATARS.includes(avatar) ? avatar : PROFILE_AVATARS[0]
}

function normalizeAccent(accent) {
  return PROFILE_ACCENTS.includes(accent) ? accent : PROFILE_ACCENTS[0]
}

function withTimeout(promise, milliseconds = PROFILE_NETWORK_TIMEOUT_MS) {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = window.setTimeout(() => reject(new Error('Profile sync timed out.')), milliseconds)
  })
  return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timer))
}

export function normalizeProfile(profile = {}) {
  return {
    name: cleanName(profile.name),
    avatar: normalizeAvatar(profile.avatar),
    accent: normalizeAccent(profile.accent),
  }
}

export function readLocalProfile() {
  if (typeof window === 'undefined') return normalizeProfile({})
  try {
    const raw = window.localStorage.getItem(LOCAL_PROFILE_KEY)
    if (!raw) {
      const legacyName = window.localStorage.getItem('uno:playerName') || 'Player'
      return normalizeProfile({ name: legacyName })
    }
    return normalizeProfile(JSON.parse(raw))
  } catch {
    return normalizeProfile({})
  }
}

export function writeLocalProfile(profile) {
  const normalized = normalizeProfile(profile)
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(normalized))
    window.localStorage.setItem('uno:playerName', normalized.name)
  }
  return normalized
}

export async function loadPlayerProfile(uid) {
  const local = readLocalProfile()
  if (!db || !uid) return local

  try {
    const snapshot = await withTimeout(get(ref(db, `profiles/${uid}`)))
    if (!snapshot.exists()) {
      // Best effort only. A missing/locked profiles rule must never block play.
      withTimeout(set(ref(db, `profiles/${uid}`), { ...local, updatedAt: Date.now() }))
        .catch(() => {})
      return local
    }
    const remote = normalizeProfile(snapshot.val())
    writeLocalProfile(remote)
    return remote
  } catch {
    return local
  }
}

export async function savePlayerProfile(uid, profile) {
  const normalized = writeLocalProfile(profile)
  if (db && uid) {
    // Profile storage is optional: save locally first and do a best-effort
    // remote write with a short timeout.
    try {
      await withTimeout(set(ref(db, `profiles/${uid}`), { ...normalized, updatedAt: Date.now() }))
    } catch {
      // Keep local profile and continue normally.
    }
  }
  return normalized
}

export async function syncProfileIntoRoom(roomCode, uid, profile) {
  if (!db || !roomCode || !uid) return
  const normalized = normalizeProfile(profile)
  try {
    const roomSnap = await withTimeout(get(ref(db, `rooms/${roomCode}`)))
    if (!roomSnap.exists()) return
    const room = roomSnap.val()
    const key = room.players?.p1?.uid === uid ? 'p1' : room.players?.p2?.uid === uid ? 'p2' : null
    if (!key) return
    await withTimeout(update(ref(db, `rooms/${roomCode}/players/${key}`), {
      name: normalized.name,
      avatar: normalized.avatar,
      accent: normalized.accent,
    }))
  } catch {
    // Do not break the active game because optional profile sync failed.
  }
}
