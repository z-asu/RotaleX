// Mapping nama game ke file gambar di /images
const gameImages = {
  valorant: '/images/Valorant.jpg',
  'mobile legends': '/images/Mobile-Legends-Bang-Bang.jpg',
  'honor of kings': '/images/Honor-of-Kings.jpg',
  'garena speed drifters': '/images/Garena-speed-drifters.jpg',
}

export function getGameImage(name) {
  if (!name) return null
  return gameImages[name.toLowerCase()] || null
}

// Daftar rank per game (kode rank = nama file tanpa ekstensi, lowercase)
export const RANKS = {
  valorant: [
    'unranked', 'iron', 'bronze', 'silver', 'gold', 'platinum',
    'diamond', 'ascendant', 'immortal', 'radiant',
  ],
  'mobile legends': [
    'warrior', 'elite', 'master', 'grandmaster', 'epic',
    'legend', 'mythic', 'mythical_glory',
  ],
  'honor of kings': [
    'bronze', 'silver', 'gold', 'platinum', 'diamond',
    'master', 'grandmaster', 'king',
  ],
  'garena speed drifters': [
    'bronze', 'silver', 'gold', 'platinum', 'diamond',
    'nova', 'legendary', 'supreme',
  ],
}

// Ekstensi file icon per game
const RANK_EXT = {
  valorant: 'png',
  'mobile legends': 'png',
  'honor of kings': 'png',
  'garena speed drifters': 'jpg',
}

// Folder icon per game (sesuai nama folder asli di public/images/ranks)
const RANK_FOLDER = {
  valorant: 'valorant',
  'mobile legends': 'mobile-legends',
  'honor of kings': 'honor-of-kings',
  'garena speed drifters': 'garena-speed-drifters',
}

// Nama file di disk per game (mis. ML: Mythical_Glory.png)
const FILE_OVERRIDES = {
  'mobile legends': {
    'mythical_glory': 'Mythical_Glory',
  },
}

export function getRankIcon(gameName, rank) {
  if (!gameName || !rank) return null
  const key = gameName.toLowerCase()
  const ranks = RANKS[key]
  const ext = RANK_EXT[key]
  const folder = RANK_FOLDER[key]
  if (!ranks || !ext || !folder || !ranks.includes(rank)) return null

  let file = rank
  const overrides = FILE_OVERRIDES[key]
  if (overrides && overrides[rank]) {
    file = overrides[rank]
  } else if (key === 'mobile legends') {
    // ML: kapitalisasi pertama saja (Warrior.png, Epic.png, dst)
    file = rank.charAt(0).toUpperCase() + rank.slice(1)
  }

  return `/images/ranks/${folder}/${file}.${ext}`
}

// Label tampilan rank
export function rankLabel(rank) {
  if (!rank) return '—'
  return rank.replace(/_/g, ' ').toUpperCase()
}
