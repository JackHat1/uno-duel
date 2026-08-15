import { useEffect, useState } from 'react'
import GameBoard from './components/GameBoard'
import HomeScreen from './components/HomeScreen'
import LobbyScreen from './components/LobbyScreen'
import ProfileModal from './components/ProfileModal'
import SetupScreen from './components/SetupScreen'
import useTheme from './hooks/useTheme'
import { ensureAuthenticated, firebaseConfigured } from './lib/firebase'
import {
  callUno,
  catchUno,
  drawCard,
  passAfterDraw,
  playCard,
  startGame,
} from './services/gameService'
import { sendQuickMessage } from './services/chatService'
import {
  loadPlayerProfile,
  readLocalProfile,
  savePlayerProfile,
  syncProfileIntoRoom,
} from './services/profileService'
import {
  createRoom,
  joinRoom,
  leaveRoom,
  subscribeToRoom,
} from './services/roomService'

const ROOM_STORAGE_KEY = 'uno:activeRoom'

export default function App() {
  const [uid, setUid] = useState(null)
  const [roomCode, setRoomCode] = useState(() => localStorage.getItem(ROOM_STORAGE_KEY) || '')
  const [room, setRoom] = useState(null)
  const [authLoading, setAuthLoading] = useState(firebaseConfigured)
  const [busy, setBusy] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [profile, setProfile] = useState(() => readLocalProfile())
  const [error, setError] = useState('')
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    if (!firebaseConfigured) return

    let alive = true

    const boot = async () => {
      try {
        const user = await ensureAuthenticated()
        if (!alive) return

        // Authentication is all we need to enter the app. Never block the
        // startup screen on the optional remote player profile.
        setUid(user.uid)
        setAuthLoading(false)

        // Load/sync the profile in the background. Local profile is already
        // available, so slow RTDB rules/network cannot freeze the whole app.
        loadPlayerProfile(user.uid)
          .then((loadedProfile) => {
            if (alive && loadedProfile) setProfile(loadedProfile)
          })
          .catch(() => {})
      } catch (authError) {
        if (!alive) return
        setError(authError.message || 'Could not connect your player account.')
        setAuthLoading(false)
      }
    }

    boot()

    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!uid || !roomCode) return

    const unsubscribe = subscribeToRoom(
      roomCode,
      (nextRoom) => {
        if (!nextRoom) {
          setRoom(null)
          setRoomCode('')
          localStorage.removeItem(ROOM_STORAGE_KEY)
          setError('The room was closed.')
          return
        }

        const belongsToRoom =
          nextRoom.players?.p1?.uid === uid || nextRoom.players?.p2?.uid === uid

        if (!belongsToRoom) {
          setRoom(null)
          setRoomCode('')
          localStorage.removeItem(ROOM_STORAGE_KEY)
          setError('This browser is not a player in that room anymore.')
          return
        }

        setRoom(nextRoom)
      },
      (subscriptionError) => setError(subscriptionError.message),
    )

    return unsubscribe
  }, [uid, roomCode])

  const runAction = async (action, options = {}) => {
    if (busy) return null
    setBusy(true)
    setError('')

    try {
      return await action()
    } catch (actionError) {
      setError(actionError.message || 'Something went wrong.')
      return null
    } finally {
      setBusy(false)
      if (options.clearErrorAfter) {
        window.setTimeout(() => setError(''), options.clearErrorAfter)
      }
    }
  }

  const enterRoom = ({ roomCode: nextCode, uid: nextUid }) => {
    setUid(nextUid)
    setRoomCode(nextCode)
    localStorage.setItem(ROOM_STORAGE_KEY, nextCode)
  }

  const handleCreate = () =>
    runAction(async () => {
      const result = await createRoom(profile)
      enterRoom(result)
    })

  const handleJoin = (code) =>
    runAction(async () => {
      const result = await joinRoom(code, profile)
      enterRoom(result)
    })

  const handleSaveProfile = async (nextProfile) => {
    if (!uid || profileSaving) return
    setProfileSaving(true)
    setError('')
    try {
      const saved = await savePlayerProfile(uid, nextProfile)
      setProfile(saved)
      if (roomCode) await syncProfileIntoRoom(roomCode, uid, saved)
      setProfileOpen(false)
    } catch (profileError) {
      setError(profileError.message || 'Could not save your profile.')
    } finally {
      setProfileSaving(false)
    }
  }

  const handleLeave = () =>
    runAction(async () => {
      if (roomCode && uid) await leaveRoom(roomCode, uid)
      localStorage.removeItem(ROOM_STORAGE_KEY)
      setRoomCode('')
      setRoom(null)
    })

  let screen

  if (!firebaseConfigured) {
    screen = <SetupScreen />
  } else if (authLoading) {
    screen = (
      <main className="loading-screen safe-screen premium-loading-screen">
        <div className="brand-mark">UNO</div>
        <span className="spinner spinner-large" />
        <p>Connecting your player account…</p>
      </main>
    )
  } else if (roomCode && !room) {
    screen = (
      <main className="loading-screen safe-screen premium-loading-screen">
        <div className="brand-mark">UNO</div>
        <span className="spinner spinner-large" />
        <p>Reconnecting to room {roomCode}…</p>
        {error && <div className="error-banner" role="alert">{error}</div>}
      </main>
    )
  } else if (!roomCode) {
    screen = (
      <HomeScreen
        onCreate={handleCreate}
        onJoin={handleJoin}
        busy={busy}
        error={error}
        theme={theme}
        profile={profile}
        onOpenProfile={() => setProfileOpen(true)}
        onToggleTheme={toggleTheme}
      />
    )
  } else if (room.status === 'waiting') {
    screen = (
      <LobbyScreen
        room={room}
        roomCode={roomCode}
        uid={uid}
        busy={busy}
        error={error}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenProfile={() => setProfileOpen(true)}
        onStart={() => runAction(() => startGame(roomCode, uid))}
        onLeave={handleLeave}
      />
    )
  } else if (!room.game) {
    screen = (
      <main className="loading-screen safe-screen premium-loading-screen">
        <span className="spinner spinner-large" />
        <p>Loading game…</p>
      </main>
    )
  } else {
    screen = (
      <GameBoard
        room={room}
        roomCode={roomCode}
        uid={uid}
        busy={busy}
        error={error}
        onPlayCard={(cardId, color) =>
          runAction(() => playCard(roomCode, uid, cardId, color), { clearErrorAfter: 2200 })
        }
        onDrawCard={() => runAction(() => drawCard(roomCode, uid), { clearErrorAfter: 2200 })}
        onPass={() => runAction(() => passAfterDraw(roomCode, uid), { clearErrorAfter: 2200 })}
        onCallUno={() => runAction(() => callUno(roomCode, uid), { clearErrorAfter: 2200 })}
        onCatchUno={() => runAction(() => catchUno(roomCode, uid), { clearErrorAfter: 2200 })}
        onSendQuickMessage={(text) => runAction(() => sendQuickMessage(roomCode, uid, text), { clearErrorAfter: 1800 })}
        onRematch={() => runAction(() => startGame(roomCode, uid))}
        onLeave={handleLeave}
        onOpenProfile={() => setProfileOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    )
  }

  return (
    <>
      {screen}
      {profileOpen && firebaseConfigured && !authLoading && (
        <ProfileModal
          profile={profile}
          uid={uid}
          busy={profileSaving}
          onSave={handleSaveProfile}
          onClose={() => setProfileOpen(false)}
        />
      )}
    </>
  )
}
