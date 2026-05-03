// ============================================================
// constants.js — Configuración global del juego
// ============================================================

export const TICK_INTERVAL = 5500; // 5.5s por tick (intermedio)

export const EVOLUTION = {
  LARVA_1: { minLevel: 1,  maxLevel: 4,  sprite: 'larva_1', label: 'Larva I'  },
  LARVA_2: { minLevel: 5,  maxLevel: 9,  sprite: 'larva_2', label: 'Larva II' },
  ADULT:   { minLevel: 10, maxLevel: 30, sprite: 'idle',    label: 'Adulto'   },
};

export const STATS = {
  hunger: { label: 'Hambre', max: 100, color: '#f97316' },
  fun: { label: 'Diversión', max: 100, color: '#a855f7' },
  health: { label: 'Salud', max: 100, color: '#ef4444' },
  hygiene: { label: 'Higiene', max: 100, color: '#22d3ee' },
  discipline: { label: 'Disciplina', max: 100, color: '#facc15' },
  energy: { label: 'Sueño', max: 100, color: '#818cf8' },
  friendship: { label: 'Amistad', max: 100, color: '#34d399' },
};

// Decaimiento por tick cuando la mascota está DESPIERTA
export const DECAY = {
  hunger: -3,   // era -2
  fun: -3,   // era -2
  hygiene: -2,   // era -1
  energy: -3,   // era -2
  discipline: -1, // Decaimiento pasivo constante
};

// Extensión de archivo por sprite (default: webp)
export const SPRITE_EXT = {
  playing: 'png',
};