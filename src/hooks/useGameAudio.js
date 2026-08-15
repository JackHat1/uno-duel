import { useCallback, useEffect, useRef, useState } from 'react'

const SOUND_PREF_KEY = 'uno:sound-enabled'
const MUSIC_PREF_KEY = 'uno:music-enabled'

function getAudioContext() {
  if (typeof window === 'undefined') return null
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return null
  if (!window.__unoAudioContext) window.__unoAudioContext = new Ctx()
  return window.__unoAudioContext
}

function scheduleTone(ctx, startAt, {
  frequency = 440,
  duration = 0.08,
  type = 'triangle',
  volume = 0.03,
  ramp = 0.012,
} = {}) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(frequency, startAt)
  gain.gain.setValueAtTime(0.0001, startAt)
  gain.gain.linearRampToValueAtTime(volume, startAt + ramp)
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(startAt)
  osc.stop(startAt + duration + 0.03)
}

function playPattern(name) {
  const ctx = getAudioContext()
  if (!ctx) return
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})

  const t = ctx.currentTime + 0.005
  const tone = (offset, options) => scheduleTone(ctx, t + offset, options)

  switch (name) {
    case 'tap':
      tone(0, { frequency: 420, duration: 0.04, volume: 0.018 })
      break
    case 'chat':
      tone(0, { frequency: 760, duration: 0.045, volume: 0.014 })
      tone(0.05, { frequency: 920, duration: 0.06, volume: 0.012 })
      break
    case 'draw':
      tone(0, { frequency: 290, duration: 0.06, volume: 0.025, type: 'sine' })
      tone(0.05, { frequency: 340, duration: 0.08, volume: 0.018 })
      break
    case 'play':
      tone(0, { frequency: 460, duration: 0.05, volume: 0.028, type: 'square' })
      tone(0.045, { frequency: 620, duration: 0.08, volume: 0.022 })
      break
    case 'penalty2':
      tone(0, { frequency: 180, duration: 0.09, volume: 0.03, type: 'sawtooth' })
      tone(0.07, { frequency: 240, duration: 0.1, volume: 0.026, type: 'square' })
      tone(0.16, { frequency: 360, duration: 0.11, volume: 0.022, type: 'triangle' })
      break
    case 'penalty4':
      tone(0, { frequency: 150, duration: 0.11, volume: 0.034, type: 'sawtooth' })
      tone(0.06, { frequency: 220, duration: 0.11, volume: 0.03, type: 'square' })
      tone(0.12, { frequency: 310, duration: 0.12, volume: 0.026, type: 'triangle' })
      tone(0.18, { frequency: 470, duration: 0.14, volume: 0.024, type: 'triangle' })
      tone(0.30, { frequency: 720, duration: 0.16, volume: 0.019, type: 'sine' })
      break
    case 'colorShift':
      tone(0, { frequency: 360, duration: 0.08, volume: 0.018, type: 'sine' })
      tone(0.045, { frequency: 510, duration: 0.11, volume: 0.022, type: 'triangle' })
      tone(0.11, { frequency: 680, duration: 0.15, volume: 0.024, type: 'triangle' })
      tone(0.22, { frequency: 940, duration: 0.18, volume: 0.018, type: 'sine' })
      break
    case 'skip':
      tone(0, { frequency: 520, duration: 0.055, volume: 0.02, type: 'square' })
      tone(0.06, { frequency: 360, duration: 0.09, volume: 0.018, type: 'triangle' })
      break
    case 'reverse':
      tone(0, { frequency: 360, duration: 0.06, volume: 0.018, type: 'triangle' })
      tone(0.055, { frequency: 520, duration: 0.07, volume: 0.02, type: 'triangle' })
      tone(0.12, { frequency: 710, duration: 0.09, volume: 0.018, type: 'sine' })
      break
    case 'turn':
      tone(0, { frequency: 560, duration: 0.06, volume: 0.018 })
      tone(0.055, { frequency: 710, duration: 0.06, volume: 0.016 })
      break
    case 'uno':
      tone(0, { frequency: 720, duration: 0.06, volume: 0.022 })
      tone(0.06, { frequency: 860, duration: 0.08, volume: 0.025 })
      tone(0.12, { frequency: 980, duration: 0.11, volume: 0.02 })
      break
    case 'win':
      tone(0, { frequency: 523.25, duration: 0.09, volume: 0.028 })
      tone(0.1, { frequency: 659.25, duration: 0.1, volume: 0.028 })
      tone(0.22, { frequency: 783.99, duration: 0.14, volume: 0.03 })
      tone(0.36, { frequency: 1046.5, duration: 0.2, volume: 0.026, type: 'sine' })
      break
    case 'lose':
      tone(0, { frequency: 420, duration: 0.1, volume: 0.018, type: 'sine' })
      tone(0.1, { frequency: 350, duration: 0.12, volume: 0.018, type: 'sine' })
      tone(0.22, { frequency: 290, duration: 0.16, volume: 0.018, type: 'sine' })
      break
    case 'start':
      tone(0, { frequency: 392, duration: 0.08, volume: 0.02 })
      tone(0.09, { frequency: 523.25, duration: 0.09, volume: 0.022 })
      tone(0.18, { frequency: 659.25, duration: 0.11, volume: 0.024 })
      break
    default:
      break
  }
}

function playMusicBar() {
  const ctx = getAudioContext()
  if (!ctx || ctx.state !== 'running') return
  const start = ctx.currentTime + 0.02
  const notes = [196, 246.94, 293.66, 246.94, 220, 261.63, 329.63, 261.63]
  notes.forEach((frequency, index) => {
    scheduleTone(ctx, start + index * 0.36, {
      frequency,
      duration: 0.28,
      type: index % 2 ? 'sine' : 'triangle',
      volume: 0.006,
      ramp: 0.035,
    })
  })
}

export default function useGameAudio({ game, uid, myHandLength, topCardId }) {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === 'undefined') return true
    const stored = window.localStorage.getItem(SOUND_PREF_KEY)
    return stored == null ? true : stored === '1'
  })
  const [musicEnabled, setMusicEnabled] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(MUSIC_PREF_KEY) === '1'
  })

  const previousRef = useRef({
    phase: null,
    topCardId: null,
    myHandLength: null,
    currentTurnUid: null,
    winnerUid: null,
  })

  useEffect(() => {
    window.localStorage.setItem(SOUND_PREF_KEY, enabled ? '1' : '0')
  }, [enabled])

  useEffect(() => {
    window.localStorage.setItem(MUSIC_PREF_KEY, musicEnabled ? '1' : '0')
  }, [musicEnabled])

  const primeAudio = useCallback(() => {
    const ctx = getAudioContext()
    if (ctx?.state === 'suspended') ctx.resume().catch(() => {})
  }, [])

  const play = useCallback((name) => {
    if (enabled) playPattern(name)
  }, [enabled])

  const toggleEnabled = useCallback(() => {
    setEnabled((current) => {
      const next = !current
      if (next) {
        primeAudio()
        window.setTimeout(() => playPattern('tap'), 0)
      }
      return next
    })
  }, [primeAudio])

  const toggleMusic = useCallback(() => {
    primeAudio()
    setMusicEnabled((current) => !current)
  }, [primeAudio])

  useEffect(() => {
    if (!musicEnabled || game?.phase !== 'playing') return undefined
    primeAudio()
    const first = window.setTimeout(playMusicBar, 80)
    const interval = window.setInterval(playMusicBar, 3200)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(interval)
    }
  }, [game?.phase, musicEnabled, primeAudio])

  useEffect(() => {
    if (!game) return

    const previous = previousRef.current
    const next = {
      phase: game.phase ?? null,
      topCardId: topCardId ?? null,
      myHandLength: myHandLength ?? 0,
      currentTurnUid: game.currentTurnUid ?? null,
      winnerUid: game.winnerUid ?? null,
    }

    const eventType = game.lastEvent?.type
    const cinematicEvent = ['round_start', 'play', 'draw', 'wild_color', 'draw2', 'wild4', 'catch_uno', 'skip', 'reverse', 'uno'].includes(eventType)
    const penaltyEvent = ['draw', 'draw2', 'wild4', 'catch_uno'].includes(eventType)

    if (previous.phase === 'waiting' && next.phase === 'playing') play('start')
    if (previous.topCardId && next.topCardId && previous.topCardId !== next.topCardId && next.phase === 'playing' && !cinematicEvent) play('play')
    if (previous.phase === 'playing' && next.myHandLength > previous.myHandLength && !penaltyEvent) play('draw')
    if (previous.currentTurnUid && previous.currentTurnUid !== next.currentTurnUid && next.currentTurnUid === uid && next.phase === 'playing') play('turn')
    if (previous.myHandLength != null && previous.myHandLength > 1 && next.myHandLength === 1 && next.phase === 'playing') play('uno')
    if (!previous.winnerUid && next.winnerUid) play(next.winnerUid === uid ? 'win' : 'lose')

    previousRef.current = next
  }, [game, myHandLength, play, topCardId, uid])

  return {
    soundEnabled: enabled,
    musicEnabled,
    toggleSoundEnabled: toggleEnabled,
    toggleMusicEnabled: toggleMusic,
    primeAudio,
    playSound: play,
  }
}
