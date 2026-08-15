const AVATARS = ['🦊', '🐼', '🐯', '🦁', '🐸', '🐵', '🐧', '🐙', '🦄', '🐲', '😎', '🤠', '🦅', '🐺', '🦈', '🦖']
const GRADIENTS = {
  ember: 'linear-gradient(145deg, #ff8a5c, #d63c67)',
  ocean: 'linear-gradient(145deg, #67d5ff, #4765ff)',
  mint: 'linear-gradient(145deg, #70f0a7, #19a96c)',
  gold: 'linear-gradient(145deg, #ffd86b, #f28a2c)',
  violet: 'linear-gradient(145deg, #d68cff, #7f5cff)',
  rose: 'linear-gradient(145deg, #ff7fc8, #d63e88)',
}
const GRADIENT_LIST = Object.values(GRADIENTS)

function hashString(value = '') {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

export function getPlayerAvatar(player) {
  if (player?.avatar && AVATARS.includes(player.avatar)) return player.avatar
  const seed = `${player?.uid || ''}:${player?.name || ''}`
  return AVATARS[hashString(seed) % AVATARS.length]
}

export function getPlayerGradient(player) {
  if (player?.accent && GRADIENTS[player.accent]) return GRADIENTS[player.accent]
  const seed = `${player?.name || ''}:${player?.uid || ''}:gradient`
  return GRADIENT_LIST[hashString(seed) % GRADIENT_LIST.length]
}

export function getAccentGradient(accent) {
  return GRADIENTS[accent] || GRADIENTS.ember
}
