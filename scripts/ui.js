// ============================================================
// ui.js — Renderizado y actualización de la interfaz
// ============================================================
import { STATS, EVOLUTION, SPRITE_EXT } from './constants.js';

export class UI {
  constructor() {
    this.screen      = document.getElementById('game-screen');
    this.startScreen = document.getElementById('start-screen');
    this.deadScreen  = document.getElementById('dead-screen');
    this.victoryScreen= document.getElementById('victory-screen');
    this.petSprite   = document.getElementById('pet-sprite');
    this.petNameEl   = document.getElementById('pet-name-display');
    this.stageEl     = document.getElementById('pet-stage');
    this.levelEl     = document.getElementById('pet-level');
    this.ageEl       = document.getElementById('pet-age');
    this.msgEl       = document.getElementById('status-message');
    this.coinsCountEl= document.getElementById('coins-count');
    this.storeCoinsEl= document.getElementById('store-coins');
    this.roomBg      = document.querySelector('.room-bg');
    this.msgTimer    = null;

    // Barras (todas las stats, incluyendo energy)
    this.bars = {
      hunger:     document.getElementById('bar-hunger'),
      fun:        document.getElementById('bar-fun'),
      health:     document.getElementById('bar-health'),
      hygiene:    document.getElementById('bar-hygiene'),
      discipline: document.getElementById('bar-discipline'),
      energy:     document.getElementById('bar-energy'),
      friendship: document.getElementById('bar-friendship'),
    };

    // Cache de popo para no re-renderizar si no cambia
    this._lastPoopCount = -1;
  }

  // ─── Pantallas ───────────────────────────────────────────────
  showStart() {
    this.startScreen.classList.remove('hidden');
    this.screen.classList.add('hidden');
    this.deadScreen.classList.add('hidden');
    this.victoryScreen.classList.add('hidden');
  }
  showGame() {
    this.startScreen.classList.add('hidden');
    this.screen.classList.remove('hidden');
    this.deadScreen.classList.add('hidden');
    this.victoryScreen.classList.add('hidden');
  }
  showDead(name) {
    this.deadScreen.classList.remove('hidden');
    document.getElementById('dead-name').textContent = name;
  }
  showVictory(name) {
    this.victoryScreen.classList.remove('hidden');
    document.getElementById('victory-name').textContent = name;
  }

  // ─── Actualizar HUD ──────────────────────────────────────────
  update(pet) {
    // Sprite — respetar extensión (playing.png vs *.webp)
    // Usamos includes() porque .src devuelve la URL absoluta completa
    const ext      = SPRITE_EXT[pet.currentSprite] || 'webp';
    const filename = `${pet.currentSprite}.${ext}`;
    if (!this.petSprite.src.includes(filename)) {
      this.petSprite.src = `images/${filename}`;
    }

    // Background
    if (this.roomBg && !this.roomBg.src.includes(pet.activeBackground)) {
      this.roomBg.src = `images/${pet.activeBackground}`;
    }

    // Coins
    if (this.coinsCountEl) this.coinsCountEl.textContent = pet.coins;
    if (this.storeCoinsEl) this.storeCoinsEl.textContent = pet.coins;

    // HUD
    this.petNameEl.textContent = pet.name;
    const stageInfo = EVOLUTION[pet.stage];
    this.stageEl.textContent = stageInfo ? stageInfo.label : '';
    this.levelEl.textContent = `Nv.${pet.friendshipLevel}`;
    this.ageEl.textContent   = `Edad: ${pet.age} ticks`;

    // Barras
    for (const key of Object.keys(this.bars)) {
      const bar = this.bars[key];
      if (!bar) continue;
      const val = Math.round(pet[key]);
      bar.style.width = `${val}%`;
      if (val <= 30)      bar.style.setProperty('--bar-color', '#ef4444');
      else if (val <= 60) bar.style.setProperty('--bar-color', '#f59e0b');
      else                bar.style.removeProperty('--bar-color');
    }

    // Popo en la habitación (solo re-renderizar si cambió)
    this._renderPoop(pet);

    // Alertas
    const disciplineAlert = document.getElementById('discipline-alert');
    if (disciplineAlert) disciplineAlert.classList.toggle('visible', pet.needsDiscipline);

    const sleepAlert = document.getElementById('sleep-alert');
    if (sleepAlert) sleepAlert.classList.toggle('visible', pet.needsSleep && !pet.sleeping);

    // Modo durmiendo
    this.screen.classList.toggle('sleeping-mode', pet.sleeping);

    // Muerto
    if (!pet.alive) this.showDead(pet.name);
    // Victoria
    if (pet.won) this.showVictory(pet.name);
  }

  // ─── Popo como imágenes popo.webp en la habitación ───────────
  _renderPoop(pet) {
    const count = pet.poopPositions.length;
    if (count === this._lastPoopCount) return; // sin cambios

    const room = document.getElementById('room-container');
    // Eliminar imágenes existentes
    room.querySelectorAll('.room-poop').forEach(el => el.remove());
    // Crear nuevas
    pet.poopPositions.forEach(pos => {
      const img = document.createElement('img');
      img.src       = 'images/popo.webp';
      img.className = 'room-poop';
      img.draggable = false;
      img.style.left = `${pos.x}%`;
      img.style.top  = `${pos.y}%`;
      room.appendChild(img);
    });
    this._lastPoopCount = count;
  }

  // ─── Mensajes flotantes ──────────────────────────────────────
  showMessage(text, type = 'info') {
    clearTimeout(this.msgTimer);
    this.msgEl.textContent = text;
    this.msgEl.className   = `status-message ${type}`;
    this.msgEl.classList.add('visible');
    this.msgTimer = setTimeout(() => this.msgEl.classList.remove('visible'), 2200);
  }

  // ─── Flash SVG flotante sobre la mascota ─────────────────────
  flashAction(svgMarkup) {
    const el = document.createElement('div');
    el.className = 'action-flash';
    el.innerHTML = svgMarkup;
    const room    = document.getElementById('room-container');
    room.appendChild(el);
    const petRect  = this.petSprite.getBoundingClientRect();
    const roomRect = room.getBoundingClientRect();
    el.style.left = `${petRect.left - roomRect.left + 10}px`;
    el.style.top  = `${petRect.top  - roomRect.top  - 16}px`;
    setTimeout(() => el.remove(), 900);
  }
}