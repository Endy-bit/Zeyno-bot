export const LEVELS = [
  { min: 0, name: 'Osservatore', icon: '👁️' },
  { min: 40, name: 'Interlocutore', icon: '💬' },
  { min: 90, name: 'Partecipante', icon: '🗨️' },
  { min: 160, name: 'Attivo', icon: '⚡' },
  { min: 260, name: 'Costante', icon: '📈' },

  { min: 400, name: 'Presidio', icon: '🛡️' },
  { min: 600, name: 'Custode', icon: '🔰' },
  { min: 850, name: 'Araldo', icon: '📯' },
  { min: 1150, name: 'Magistro', icon: '📜' },
  { min: 1500, name: 'Oracolo', icon: '🔮' },

  { min: 2000, name: 'Campione', icon: '⚔️' },
  { min: 2700, name: 'Esecutore', icon: '🗡️' },
  { min: 3500, name: 'Arcano', icon: '✨' },
  { min: 4500, name: 'Eminenza', icon: '🔥' },
  { min: 6000, name: 'Ascendente', icon: '🌟' },

  { min: 8000, name: 'Dominante', icon: '👑' },
  { min: 10500, name: 'Sovrano', icon: '🏛️' },
  { min: 14000, name: 'Trascendente', icon: '🌌' },
  { min: 19000, name: 'Primordiale', icon: '🧿' },
  { min: 26000, name: 'Leggenda', icon: '💠' }
]

export function getLevelFull(messages = 0) {
  let level = 1
  let name = LEVELS[0].name
  let icon = LEVELS[0].icon

  for (let i = 0; i < LEVELS.length; i++) {
    if (messages >= LEVELS[i].min) {
      level = i + 1
      name = LEVELS[i].name
      icon = LEVELS[i].icon
    }
  }

  const current = LEVELS[level - 1]
  const next = LEVELS[level] || null

  const currentMin = current.min
  const nextMin = next ? next.min : current.min

  const progress = messages - currentMin
  const needed = next ? nextMin - currentMin : 0

  const percent = next && needed > 0
    ? Math.max(0, Math.min(100, Math.floor((progress / needed) * 100)))
    : 100

  const filled = Math.max(0, Math.min(10, Math.floor(percent / 10)))
  const bar = '🟩'.repeat(filled) + '⬜'.repeat(10 - filled)

  return {
    level,
    name,
    icon,
    percent,
    bar,
    nextName: next ? next.name : 'MAX',
    remaining: next ? Math.max(0, nextMin - messages) : 0,
    isMax: !next
  }
    }
