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
  endFrequency = null,
  duration = 0.08,
  type = 'triangle',
  volume = 0.03,
  ramp = 0.012,
  destination = ctx.destination,
} = {}) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(frequency, startAt)
  if (endFrequency) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), startAt + duration)
  }
  gain.gain.setValueAtTime(0.0001, startAt)
  gain.gain.linearRampToValueAtTime(volume, startAt + Math.min(ramp, duration * .35))
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)
  osc.connect(gain)
  gain.connect(destination)
  osc.start(startAt)
  osc.stop(startAt + duration + 0.035)
}

function getNoiseBuffer(ctx) {
  if (window.__unoNoiseBuffer?.sampleRate === ctx.sampleRate) return window.__unoNoiseBuffer
  const length = Math.floor(ctx.sampleRate * .42)
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i += 1) {
    const fade = 1 - i / length
    data[i] = (Math.random() * 2 - 1) * fade
  }
  window.__unoNoiseBuffer = buffer
  return buffer
}

function scheduleNoise(ctx, startAt, {
  duration = .07,
  volume = .02,
  lowpass = 2200,
  highpass = 120,
  playbackRate = 1,
} = {}) {
  const source = ctx.createBufferSource()
  const gain = ctx.createGain()
  const hp = ctx.createBiquadFilter()
  const lp = ctx.createBiquadFilter()
  source.buffer = getNoiseBuffer(ctx)
  source.playbackRate.setValueAtTime(playbackRate, startAt)
  hp.type = 'highpass'
  hp.frequency.setValueAtTime(highpass, startAt)
  lp.type = 'lowpass'
  lp.frequency.setValueAtTime(lowpass, startAt)
  gain.gain.setValueAtTime(volume, startAt)
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)
  source.connect(hp)
  hp.connect(lp)
  lp.connect(gain)
  gain.connect(ctx.destination)
  source.start(startAt)
  source.stop(startAt + duration + .025)
}

function vibrateFor(name) {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
  const patterns = {
    tap: 8,
    cardLift: 7,
    cardDrop: 13,
    play: 12,
    draw: 9,
    turn: 10,
    uno: [14, 30, 20],
    penalty2: [18, 32, 22],
    penalty4: [22, 28, 22, 28, 32],
    wild4: [22, 28, 22, 28, 32],
    win: [20, 35, 28, 35, 45],
    lose: [18, 42, 18],
  }
  const pattern = patterns[name]
  if (pattern) navigator.vibrate(pattern)
}

function playPattern(name) {
  const ctx = getAudioContext()
  if (!ctx) return
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})

  const t = ctx.currentTime + 0.008
  const tone = (offset, options) => scheduleTone(ctx, t + offset, options)
  const noise = (offset, options) => scheduleNoise(ctx, t + offset, options)

  switch (name) {
    case 'tap':
      noise(0, { duration: .022, volume: .010, lowpass: 1700, highpass: 500 })
      tone(0, { frequency: 520, endFrequency: 430, duration: .035, volume: .012, type: 'triangle' })
      break
    case 'chatOpen':
      tone(0, { frequency: 620, duration: .035, volume: .012, type: 'sine' })
      tone(.04, { frequency: 790, duration: .05, volume: .010, type: 'sine' })
      break
    case 'chat':
      tone(0, { frequency: 720, duration: .05, volume: .015, type: 'sine' })
      tone(.052, { frequency: 910, duration: .065, volume: .013, type: 'triangle' })
      break
    case 'cardLift':
      noise(0, { duration: .052, volume: .018, lowpass: 2600, highpass: 650, playbackRate: 1.45 })
      tone(.005, { frequency: 310, endFrequency: 470, duration: .065, volume: .010, type: 'sine' })
      break
    case 'cardDrop':
      noise(0, { duration: .045, volume: .032, lowpass: 1500, highpass: 90 })
      tone(0, { frequency: 190, endFrequency: 130, duration: .055, volume: .020, type: 'triangle' })
      break
    case 'draw':
      noise(0, { duration: .095, volume: .022, lowpass: 3300, highpass: 700, playbackRate: 1.25 })
      tone(.015, { frequency: 250, endFrequency: 355, duration: .085, volume: .018, type: 'sine' })
      tone(.08, { frequency: 390, duration: .055, volume: .010, type: 'triangle' })
      break
    case 'play':
      noise(0, { duration: .052, volume: .038, lowpass: 1900, highpass: 120 })
      tone(0, { frequency: 220, endFrequency: 150, duration: .055, volume: .024, type: 'triangle' })
      tone(.035, { frequency: 520, duration: .07, volume: .018, type: 'square' })
      break
    case 'penalty2':
      noise(0, { duration: .09, volume: .045, lowpass: 1150, highpass: 70 })
      tone(0, { frequency: 140, endFrequency: 95, duration: .15, volume: .035, type: 'sawtooth' })
      tone(.075, { frequency: 250, duration: .11, volume: .027, type: 'square' })
      tone(.18, { frequency: 390, duration: .13, volume: .022, type: 'triangle' })
      break
    case 'penalty4':
    case 'wild4':
      noise(0, { duration: .13, volume: .052, lowpass: 1300, highpass: 65 })
      tone(0, { frequency: 118, endFrequency: 72, duration: .19, volume: .040, type: 'sawtooth' })
      tone(.07, { frequency: 185, duration: .13, volume: .033, type: 'square' })
      tone(.14, { frequency: 290, duration: .13, volume: .030, type: 'triangle' })
      tone(.21, { frequency: 460, duration: .14, volume: .027, type: 'triangle' })
      tone(.34, { frequency: 760, duration: .19, volume: .020, type: 'sine' })
      break
    case 'colorShift':
      noise(0, { duration: .17, volume: .014, lowpass: 5200, highpass: 900, playbackRate: 1.5 })
      tone(0, { frequency: 300, endFrequency: 540, duration: .13, volume: .015, type: 'sine' })
      tone(.07, { frequency: 470, endFrequency: 760, duration: .16, volume: .020, type: 'triangle' })
      tone(.16, { frequency: 720, endFrequency: 1180, duration: .22, volume: .020, type: 'sine' })
      break
    case 'skip':
      noise(0, { duration: .035, volume: .020, lowpass: 2400, highpass: 500 })
      tone(0, { frequency: 610, endFrequency: 330, duration: .12, volume: .023, type: 'square' })
      break
    case 'reverse':
      tone(0, { frequency: 330, endFrequency: 510, duration: .08, volume: .017, type: 'triangle' })
      tone(.065, { frequency: 510, endFrequency: 760, duration: .085, volume: .020, type: 'triangle' })
      tone(.13, { frequency: 760, endFrequency: 430, duration: .11, volume: .018, type: 'sine' })
      break
    case 'turn':
      tone(0, { frequency: 554.37, duration: .065, volume: .018, type: 'sine' })
      tone(.06, { frequency: 739.99, duration: .08, volume: .019, type: 'triangle' })
      tone(.13, { frequency: 987.77, duration: .09, volume: .014, type: 'sine' })
      break
    case 'uno':
      noise(0, { duration: .035, volume: .024, lowpass: 2500, highpass: 150 })
      tone(0, { frequency: 660, duration: .07, volume: .025, type: 'square' })
      tone(.065, { frequency: 830.61, duration: .09, volume: .028, type: 'triangle' })
      tone(.145, { frequency: 1046.5, duration: .16, volume: .026, type: 'sine' })
      break
    case 'win':
      noise(0, { duration: .12, volume: .020, lowpass: 5000, highpass: 900 })
      ;[523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
        tone(index * .105, { frequency, duration: index === 3 ? .34 : .14, volume: .028, type: index === 3 ? 'sine' : 'triangle' })
      })
      tone(.45, { frequency: 1318.51, duration: .34, volume: .017, type: 'sine' })
      break
    case 'lose':
      tone(0, { frequency: 440, endFrequency: 400, duration: .13, volume: .018, type: 'sine' })
      tone(.12, { frequency: 349.23, endFrequency: 315, duration: .15, volume: .018, type: 'sine' })
      tone(.26, { frequency: 293.66, endFrequency: 250, duration: .22, volume: .017, type: 'sine' })
      break
    case 'start':
      noise(0, { duration: .08, volume: .014, lowpass: 4500, highpass: 700 })
      tone(0, { frequency: 392, duration: .09, volume: .020 })
      tone(.09, { frequency: 523.25, duration: .10, volume: .023 })
      tone(.18, { frequency: 659.25, duration: .12, volume: .026 })
      tone(.31, { frequency: 783.99, duration: .19, volume: .022, type: 'sine' })
      break
    default:
      break
  }

  vibrateFor(name)
}

function playMusicBar() {
  const ctx = getAudioContext()
  if (!ctx || ctx.state !== 'running') return
  const start = ctx.currentTime + .02
  const bass = [98, 98, 110, 110]
  const notes = [196, 246.94, 293.66, 246.94, 220, 261.63, 329.63, 261.63]

  bass.forEach((frequency, index) => {
    scheduleTone(ctx, start + index * .72, {
      frequency,
      duration: .54,
      type: 'sine',
      volume: .0045,
      ramp: .06,
    })
  })

  notes.forEach((frequency, index) => {
    scheduleTone(ctx, start + index * .36, {
      frequency,
      duration: .28,
      type: index % 2 ? 'sine' : 'triangle',
      volume: .0055,
      ramp: .04,
    })
  })
}


export function playMenuSound(name = 'tap') {
  if (typeof window === 'undefined') return
  const stored = window.localStorage.getItem(SOUND_PREF_KEY)
  if (stored === '0') return
  playPattern(name)
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
