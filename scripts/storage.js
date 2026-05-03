// ============================================================
// storage.js — Persistencia en localStorage
// ============================================================
const SAVE_KEY = 'tamagotchi_save';

export function saveGame(pet) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(pet.toJSON()));
  } catch (e) {
    console.warn('No se pudo guardar:', e);
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearGame() {
  localStorage.removeItem(SAVE_KEY);
}