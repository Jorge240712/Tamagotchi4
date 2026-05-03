// ============================================================
// main.js — Punto de entrada; orquesta todo el juego
// ============================================================
import { Pet }      from './pet.js';
import { UI }       from './ui.js';
import { Movement } from './movement.js';
import { Sounds }   from './sounds.js';
import { saveGame, loadGame, clearGame } from './storage.js';
import { TICK_INTERVAL } from './constants.js';

let pet             = null;
let ui              = null;
let movement        = null;
let tickLoop        = null;
let tempSpriteTimer = null; // timer para revertir sprite temporal

// ─── SVGs para flashes flotantes ────────────────────────────
const FLASH_SVG = {
  feed: `<svg viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 18 Q6 28 18 28 Q30 28 30 18 Z" fill="#f97316"/>
    <path d="M6 18 Q6 22 18 22 Q30 22 30 18 Z" fill="#fb923c"/>
    <line x1="24" y1="8" x2="28" y2="20" stroke="#e0c8a0" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="24" cy="7" r="3" fill="#e0c8a0"/>
    <line x1="13" y1="8" x2="13" y2="20" stroke="#e0c8a0" stroke-width="2" stroke-linecap="round"/>
    <line x1="10" y1="8" x2="10" y2="14" stroke="#e0c8a0" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="16" y1="8" x2="16" y2="14" stroke="#e0c8a0" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,
  play: `<svg viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
    <circle cx="18" cy="18" r="13" fill="#a855f7"/>
    <path d="M8 12 Q18 18 28 12" stroke="#7c3aed" stroke-width="1.5" fill="none"/>
    <path d="M8 24 Q18 18 28 24" stroke="#7c3aed" stroke-width="1.5" fill="none"/>
    <circle cx="23" cy="13" r="2.5" fill="rgba(255,255,255,0.35)"/>
  </svg>`,
  clean: `<svg viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="18" width="20" height="13" rx="4" fill="#22d3ee"/>
    <rect x="8" y="18" width="20" height="5" rx="3" fill="#67e8f9"/>
    <circle cx="14" cy="13" r="3" fill="none" stroke="#22d3ee" stroke-width="1.5"/>
    <circle cx="22" cy="11" r="2" fill="none" stroke="#22d3ee" stroke-width="1.5"/>
    <circle cx="18" cy="7" r="1.5" fill="none" stroke="#22d3ee" stroke-width="1.2"/>
  </svg>`,
  medicate: `<svg viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="14" width="20" height="8" rx="4" fill="#ec4899"/>
    <rect x="8" y="14" width="10" height="8" rx="4" fill="#f9a8d4"/>
    <rect x="16.5" y="8" width="3" height="10" rx="1.5" fill="white" opacity=".9"/>
    <rect x="11" y="13.5" width="14" height="3" rx="1.5" fill="white" opacity=".9"/>
  </svg>`,
  discipline: `<svg viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 5 L11 20 H18 L16 31 L25 16 H18 L20 5Z" fill="#facc15"/>
    <circle cx="18" cy="14" r="2" fill="rgba(255,255,255,0.35)"/>
  </svg>`,
  sleep: `<svg viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 8 A12 12 0 1 0 22 28 A9 9 0 1 1 22 8Z" fill="#818cf8"/>
    <circle cx="27" cy="10" r="1.5" fill="#e0e7ff"/>
    <circle cx="29" cy="16" r="1" fill="#e0e7ff"/>
  </svg>`,
};

// ─── Mensajes de retroalimentación ───────────────────────────
const MESSAGES = {
  fed:         { text: '¡Qué rico! ¡Gracias por darme de comer!',  type: 'success' },
  played:      { text: '¡Woohoo! ¡Me encanta jugar contigo!',       type: 'success' },
  cleaned:     { text: '¡Ahora huelo a flores!',                    type: 'success' },
  medicated:   { text: 'Me siento mejor... ¡Gracias!',             type: 'success' },
  disciplined: { text: 'Está bien... me portaré mejor.',            type: 'warning' },
  sleeping:    { text: 'Zzz... déjame dormir...',                   type: 'info'    },
  too_hungry:  { text: 'Tengo mucha hambre para jugar...',          type: 'warning' },
  woke_up:     { text: '¡Buenos días! ¡Listo para la aventura!',    type: 'success' },
  not_needed:  { text: '¡No he hecho nada malo!',                   type: 'info'    },
  full:        { text: '¡No, gracias, ya estoy lleno!',             type: 'info'    },
  refuse:      { text: '¡Uff, ya me cansé de jugar!',               type: 'info'    },
  clean_already:{ text: '¡La habitación ya está impecable!',        type: 'info'    },
  healthy:     { text: '¡Estoy sano, no necesito medicinas!',       type: 'info'    },
  not_sleepy:  { text: '¡No tengo sueño todavía!',                  type: 'info'    },
};

// ─── Helper: sprite temporal (solo adultos) ──────────────────
// Setea tempSprite, actualiza UI, y lo revierte automáticamente.
// main.js es el único responsable de manejar tempSprite.
function setTempSprite(sprite, durationMs = 2000) {
  if (!pet || pet.stage !== 'ADULT' || !pet.alive) return;
  clearTimeout(tempSpriteTimer);
  pet.tempSprite = sprite;
  pet._resolveSprite(); // ← Actualizamos currentSprite basado en el nuevo tempSprite
  ui.update(pet);       // ← Ahora sí la UI verá el cambio
  tempSpriteTimer = setTimeout(() => {
    pet.tempSprite = null;
    pet._resolveSprite();
    ui.update(pet);
  }, durationMs);
}

// ─── Iniciar partida ──────────────────────────────────────────
function startGame(name, fromSave = false, saveData = null) {
  pet = fromSave && saveData ? Pet.fromJSON(saveData) : new Pet(name);
  ui  = new UI();
  ui.showGame();

  const roomEl = document.getElementById('room-container');
  const sprite = document.getElementById('pet-sprite');
  movement = new Movement(roomEl, sprite);

  // Si la mascota está durmiendo al cargar, pausamos el movimiento
  if (pet.sleeping) movement.pause();

  ui.update(pet);

  clearInterval(tickLoop);
  tickLoop = setInterval(() => {
    if (!pet.alive) {
      clearInterval(tickLoop);
      Sounds.death();
      ui.showDead(pet.name);
      movement.pause();
      return;
    }

    const prevStage    = pet.stage;
    const wasSleeping  = pet.sleeping;

    pet.tick();
    saveGame(pet);
    ui.update(pet);

    if (pet.won) {
      clearInterval(tickLoop);
      Sounds.evolve();
      movement.pause();
      return;
    }

    // ── Detección de auto-despertar (tick() puede cambiar sleeping) ──
    if (wasSleeping && !pet.sleeping) {
      movement.resume();
      Sounds.wakeUp();
      ui.showMessage('¡Buenos días! ¡Listo para la aventura!', 'success');
    }

    // ── Alertas sonoras ──────────────────────────────────────
    if (!pet.sleeping && (
      pet.needsDiscipline ||
      pet.hunger  < 15   ||
      pet.health  < 20   ||
      pet.needsSleep
    )) {
      Sounds.alert();
    }

    checkEvolve(prevStage);
  }, TICK_INTERVAL);
}

// ─── Evolución ────────────────────────────────────────────────
function checkEvolve(prevStage) {
  if (pet.stage !== prevStage) {
    const labels = { LARVA_1: 'Larva I', LARVA_2: 'Larva II', ADULT: '¡Adulto!' };
    showEvolutionBanner(labels[pet.stage]);
  }
}
function showEvolutionBanner(label) {
  Sounds.evolve();
  document.getElementById('evolution-text').textContent = `¡Evolucionó a ${label}!`;
  document.getElementById('evolution-banner').classList.add('visible');
  setTimeout(() => document.getElementById('evolution-banner').classList.remove('visible'), 3800);
  movement.center();
}

// ─── Botones de acción ────────────────────────────────────────
function bindButtons() {
  const actions = {

    'btn-feed': () => {
      const r = pet.feed();
      handleResult(r);
      if (r === 'fed') {
        Sounds.feed();
        ui.flashAction(FLASH_SVG.feed);
        setTempSprite('eating', 2000); // eating.webp por 2 segundos
      } else {
        Sounds.error();
      }
    },

    'btn-play': () => {
      const r = pet.play();
      handleResult(r);
      if (r === 'played') {
        Sounds.play();
        ui.flashAction(FLASH_SVG.play);
        setTempSprite('playing', 2200); // playing.png por 2.2 segundos
      } else {
        Sounds.error();
      }
    },

    'btn-clean': () => {
      const r = pet.clean();
      handleResult(r, 'cleaned');
      if (r === 'clean_already') {
        Sounds.error();
        return;
      }
      Sounds.clean();
      ui.flashAction(FLASH_SVG.clean);
    },

    'btn-medicate': () => {
      const r = pet.medicate();
      handleResult(r, 'medicated');
      if (r === 'healthy') {
        Sounds.error();
        return;
      }
      Sounds.medicate();
      ui.flashAction(FLASH_SVG.medicate);
    },

    'btn-discipline': () => {
      const r = pet.scold();
      handleResult(r, 'disciplined');
      if (r === 'sleeping') {
        Sounds.error();
        return;
      }
      
      if (r === 'not_needed') {
        Sounds.error(); // Sonido de error porque lo hiciste mal
      } else {
        Sounds.discipline(); // Sonido normal de regaño
      }
      
      ui.flashAction(FLASH_SVG.discipline);
      setTempSprite('grumpy', 1800); // Se enoja visualmente de todas formas
    },

    'btn-sleep': () => {
      const r = pet.sleep();
      handleResult(r);
      if (r === 'not_sleepy') {
        Sounds.error();
        return;
      }
      if (r === 'sleeping') {
        Sounds.sleep();
        movement.pause();   // ← PAUSA el movimiento al dormir
      } else {
        Sounds.wakeUp();
        movement.resume();  // ← REANUDA el movimiento al despertar
      }
      ui.flashAction(FLASH_SVG.sleep);
    },

    'btn-store': () => {
      document.getElementById('store-screen').classList.remove('hidden');
      updateStoreButtons();
    },
    'btn-close-store': () => {
      document.getElementById('store-screen').classList.add('hidden');
    },
    'btn-buy-beach': () => {
      if (pet.hasBeachBackground) {
        pet.activeBackground = 'beach_background.webp';
      } else if (pet.gastarMonedas(100)) {
        pet.hasBeachBackground = true;
        pet.activeBackground = 'beach_background.webp';
        Sounds.click();
      } else {
        ui.showMessage('¡No tienes suficientes monedas!', 'warning');
        Sounds.error();
      }
      updateStoreButtons();
    },
    'btn-buy-space': () => {
      if (pet.hasSpaceBackground) {
        pet.activeBackground = 'space_background.webp';
      } else if (pet.gastarMonedas(200)) {
        pet.hasSpaceBackground = true;
        pet.activeBackground = 'space_background.webp';
        Sounds.click();
      } else {
        ui.showMessage('¡No tienes suficientes monedas!', 'warning');
        Sounds.error();
      }
      updateStoreButtons();
    },
    'btn-buy-puppy': () => {
      if (pet.isPuppy) return;
      if (pet.gastarMonedas(500)) {
        pet.isPuppy = true;
        pet._resolveSprite();
        Sounds.evolve();
      } else {
        ui.showMessage('¡No tienes suficientes monedas!', 'warning');
        Sounds.error();
      }
      updateStoreButtons();
    },
    'btn-arcade': () => {
      document.getElementById('arcade-screen').classList.remove('hidden');
      document.getElementById('arcade-result').textContent = '';
    },
    'btn-close-arcade': () => {
      document.getElementById('arcade-screen').classList.add('hidden');
    },

  };

  let lastClickTime = 0;

  for (const [id, fn] of Object.entries(actions)) {
    document.getElementById(id)?.addEventListener('click', () => {
      const now = Date.now();
      // Cooldown global de 600ms entre cualquier acción para evitar autoclickers
      if (now - lastClickTime < 600) return; 
      
      if (!pet?.alive || pet?.won) return;
      lastClickTime = now;
      
      Sounds.click();
      fn();
      ui.update(pet);
      saveGame(pet);
      
      if (pet.won) {
        clearInterval(tickLoop);
        Sounds.evolve();
        movement.pause();
      }
    });
  }

  document.querySelectorAll('.btn-arcade-guess').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const now = Date.now();
      if (now - lastClickTime < 600) return; 
      lastClickTime = now;

      const guess = parseInt(e.target.dataset.guess);
      const target = Math.floor(Math.random() * 3) + 1;
      const resEl = document.getElementById('arcade-result');
      
      if (guess === target) {
        pet.coins += 50;
        resEl.textContent = `¡Acertaste! Era el ${target}. ¡Ganas 50 🪙!`;
        resEl.style.color = '#34d399'; // green
        Sounds.evolve();
      } else {
        resEl.textContent = `Fallaste. Era el ${target}. ¡Intenta de nuevo!`;
        resEl.style.color = '#ef4444'; // red
        Sounds.error();
      }
      ui.update(pet);
      saveGame(pet);
    });
  });
}

function updateStoreButtons() {
  if (!pet) return;
  const btnBeach = document.getElementById('btn-buy-beach');
  const btnSpace = document.getElementById('btn-buy-space');
  const btnPuppy = document.getElementById('btn-buy-puppy');

  if (pet.hasBeachBackground) {
    btnBeach.textContent = pet.activeBackground === 'beach_background.webp' ? 'Equipado' : 'Equipar';
  }
  if (pet.hasSpaceBackground) {
    btnSpace.textContent = pet.activeBackground === 'space_background.webp' ? 'Equipado' : 'Equipar';
  }
  if (pet.isPuppy) {
    btnPuppy.textContent = 'Comprado';
    btnPuppy.disabled = true;
    btnPuppy.style.opacity = '0.5';
  }
}

function handleResult(result, fallback) {
  const msg = MESSAGES[result] || MESSAGES[fallback];
  if (msg) ui.showMessage(msg.text, msg.type);
}

// ─── Pantalla de inicio ───────────────────────────────────────
function bindStartScreen() {
  const btnNew    = document.getElementById('btn-new-game');
  const btnLoad   = document.getElementById('btn-load-game');
  const nameInput = document.getElementById('pet-name-input');

  const saved = loadGame();
  if (saved) {
    btnLoad?.classList.remove('hidden');
    const el = document.getElementById('saved-name');
    if (el) el.textContent = saved.name;
  }

  btnNew.addEventListener('click', () => {
    const name = nameInput.value.trim();
    if (!name) {
      Sounds.error();
      nameInput.classList.add('shake');
      nameInput.placeholder = '¡Escribe un nombre!';
      setTimeout(() => nameInput.classList.remove('shake'), 500);
      return;
    }
    Sounds.click();
    clearGame();
    startGame(name);
    bindButtons();
  });

  btnLoad?.addEventListener('click', () => {
    const data = loadGame();
    if (data) {
      Sounds.click();
      startGame(data.name, true, data);
      bindButtons();
    }
  });

  document.getElementById('btn-restart')?.addEventListener('click', () => {
    Sounds.click();
    clearGame();
    location.reload();
  });

  document.getElementById('btn-victory-restart')?.addEventListener('click', () => {
    Sounds.click();
    clearGame();
    location.reload();
  });

  document.querySelector('.egg-anim')?.addEventListener('click', () => Sounds.feed());
}

// ─── Bootstrap ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const ui0 = new UI();
  ui0.showStart();
  bindStartScreen();
});