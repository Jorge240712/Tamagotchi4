// ============================================================
// pet.js — Clase central de la mascota (revisión completa)
// ============================================================
import { EVOLUTION, DECAY } from './constants.js';

export class Pet {
  constructor(name) {
    this.name       = name;
    this.age        = 0;

    // Estadísticas (0-100)
    this.hunger     = 80;
    this.fun        = 80;
    this.health     = 100;
    this.hygiene    = 90;
    this.discipline = 80;
    this.energy     = 100;
    this.friendship = 0;
    this.friendshipLevel = 1;
    this.won        = false;

    // Economía
    this.coins      = 0;
    this.isPuppy    = false;
    this.hasBeachBackground = false;
    this.hasSpaceBackground = false;
    this.activeBackground   = 'fondo.webp';

    this.stage      = 'LARVA_1';
    this.alive      = true;
    this.sleeping   = false;
    this.isSick     = false;

    // Flags de alerta
    this.needsSleep      = false;
    this.needsDiscipline = false;

    // Sprite actual y override temporal
    this.currentSprite = 'larva_1';
    this.tempSprite    = null;

    // Popo en la habitación: array de posiciones {x, y} en porcentaje
    this.hasPoop       = false;
    this.poopPositions = [];
  }

  // ─── Tick del juego ─────────────────────────────────────────
  tick() {
    if (!this.alive) return;
    this.age++;

    // ── Modo durmiendo ──────────────────────────────────────
    if (this.sleeping) {
      this.energy  = Math.min(100, this.energy  + 15); // recupera energía (intermedio)
      this.health  = Math.min(100, this.health  + 2);  // salud se recupera mejor durmiendo
      this.hunger  = Math.max(0,   this.hunger  - 1);  // se come muy poco al dormir
      // Auto-despertar cuando energy es alta
      if (this.energy >= 90) {
        this.sleeping   = false;
        this.needsSleep = false;
      }
      this._updateStage();
      this._resolveSprite();
      return; // no más lógica mientras duerme
    }

    // ── Decaimiento natural (despierto) ─────────────────────
    this.hunger     = Math.max(0, this.hunger     + DECAY.hunger);
    this.fun        = Math.max(0, this.fun        + DECAY.fun);
    this.hygiene    = Math.max(0, this.hygiene    + DECAY.hygiene);
    this.energy     = Math.max(0, this.energy     + DECAY.energy);
    this.discipline = Math.max(0, this.discipline + DECAY.discipline);

    // Resetear el flag del bono de sueño cuando la energía se recupera
    if (this.energy >= 95) this.sleepBonusGiven = false;

    // ── Disciplina baja EXTRA cuando fun o higiene muy bajas ──────
    if (this.fun < 35 || this.hygiene < 35) {
      this.discipline = Math.max(0, this.discipline - 2);
    }

    // ── Hambre extrema daña la salud ────────────────────────
    if (this.hunger < 15) {
      this.health = Math.max(0, this.health - 3);
      this.isSick = true;
    }

    // ── Generación de popo (máx 3, probabilidad baja) ───────
    if (this.poopPositions.length < 3) {
      // Base: 4% por tick normal (~2.5 min). Sube si higiene es baja.
      const prob = this.hygiene < 25 ? 0.18
                 : this.hygiene < 50 ? 0.08
                 : 0.04;
      if (Math.random() < prob) {
        this._spawnPoop();
      }
    }

    // ── Popo acumulado daña higiene extra (suavizado) ───────
    if (this.hasPoop) {
      this.hygiene = Math.max(0, this.hygiene - this.poopPositions.length);
    }

    // ── 3 popos → daño a salud ──────────────────────────────
    if (this.poopPositions.length >= 3) {
      this.health = Math.max(0, this.health - 2);
      this.isSick = true;
    }

    // ── Flag de sueño ───────────────────────────────────────
    if (this.energy < 20) {
      this.needsSleep = true;
    } else if (this.energy > 60) {
      this.needsSleep = false;
    }

    // ── Flag de disciplina ──────────────────────────────────
    if (this.discipline < 20) {
      this.needsDiscipline = true;
    } else if (this.discipline > 50) {
      this.needsDiscipline = false;
    }

    // ── Recuperación de enfermedad ──────────────────────────
    if (this.health > 75 && this.isSick) this.isSick = false;

    // ── Amistad crece si todo está en buen estado ───────────
    if (
      this.hunger  > 50 &&
      this.fun     > 50 &&
      this.hygiene > 50 &&
      this.health  > 50 &&
      this.energy  > 35
    ) {
      this._addFriendship(5); // +5 por tick pasivo
    }

    // ── Muerte ──────────────────────────────────────────────
    if (this.health <= 0) this.alive = false;

    this._updateStage();
    this._resolveSprite();
  }

  // ─── Gestión de Amistad / Nivel ──────────────────────────────
  _addFriendship(amount) {
    if (!this.alive || this.won) return;
    this.friendship += amount;
    
    // Subir de nivel si llega a 100
    while (this.friendship >= 100) {
      this.friendship -= 100;
      this.friendshipLevel++;
      
      if (this.friendshipLevel >= 30) {
        this.friendshipLevel = 30;
        this.friendship = 100; // Se queda lleno
        this.won = true;
        break;
      }
    }
  }

  // ─── Acciones del usuario ────────────────────────────────────

  feed() {
    if (!this.alive || this.sleeping || this.won) return 'sleeping';
    if (this.hunger >= 95) return 'full'; // Antispam
    this.hunger     = Math.min(100, this.hunger     + 30);
    this.health     = Math.min(100, this.health     + 5);
    this._addFriendship(20); // +20
    this.coins     += 10;
    if (this.isSick && this.health > 60) this.isSick = false;
    this._resolveSprite();
    return 'fed';
  }

  play() {
    if (!this.alive || this.sleeping || this.won) return 'sleeping';
    if (this.hunger < 15) return 'too_hungry';
    if (this.fun >= 95) return 'refuse'; // Antispam
    this.fun        = Math.min(100, this.fun        + 30);
    this._addFriendship(25); // +25
    this.coins     += 10;
    this.hunger     = Math.max(0,   this.hunger     - 5);
    this.energy     = Math.max(0,   this.energy     - 8);
    this._resolveSprite();
    return 'played';
  }

  clean() {
    if (!this.alive || this.won) return 'cleaned';
    if (!this.hasPoop && this.hygiene >= 95) return 'clean_already'; // Antispam
    this.hygiene       = Math.min(100, this.hygiene    + 35);
    this.hasPoop       = false;
    this.poopPositions = [];
    this._addFriendship(15); // +15
    this.coins        += 10;
    this._resolveSprite();
    return 'cleaned';
  }

  medicate() {
    if (!this.alive || this.won) return 'medicated';
    if (!this.isSick) return 'healthy'; // Antispam
    this.health     = Math.min(100, this.health     + 35);
    this.isSick     = false;
    this._addFriendship(15); // +15
    this._resolveSprite();
    return 'medicated';
  }

  scold() {
    if (!this.alive || this.won) return 'disciplined';
    if (this.sleeping) return 'sleeping'; // no se puede disciplinar dormido
    const wasUnjust = this.discipline >= 90;

    this.discipline      = Math.min(100, this.discipline + 35);
    this.needsDiscipline = false;
    
    // Penalización por regañar: si fue injusto duele mucho (-10 de amistad)
    this.friendship = Math.max(0, this.friendship - (wasUnjust ? 10 : 2)); 
    
    this._resolveSprite();
    return wasUnjust ? 'not_needed' : 'disciplined';
  }

  sleep() {
    if (!this.alive || this.won) return this.sleeping ? 'woke_up' : 'sleeping';
    if (!this.sleeping && this.energy >= 90) return 'not_sleepy'; // Antispam
    
    this.sleeping = !this.sleeping;
    if (this.sleeping) {
      this.needsSleep = false; // apagamos la alerta al poner a dormir
      // Solo dar bono de dormir UNA vez por ciclo de cansancio
      if (!this.sleepBonusGiven && this.energy < 80) {
        this._addFriendship(10); 
        this.sleepBonusGiven = true;
      }
    }
    this._resolveSprite();
    return this.sleeping ? 'sleeping' : 'woke_up';
  }

  // ─── Economía ────────────────────────────────────────────────
  gastarMonedas(cantidad) {
    if (this.coins >= cantidad) {
      this.coins -= cantidad;
      return true;
    }
    return false;
  }

  // ─── Lógica interna ──────────────────────────────────────────

  _spawnPoop() {
    this.poopPositions.push({
      x: 12 + Math.random() * 74, // 12%–86% horizontal
      y: 40 + Math.random() * 32, // 40%–72% vertical (sobre el suelo)
    });
    this.hasPoop = true;
  }

  _updateStage() {
    if      (this.friendshipLevel >= 10) this.stage = 'ADULT';
    else if (this.friendshipLevel >= 5)  this.stage = 'LARVA_2';
    else                                 this.stage = 'LARVA_1';
  }

  _resolveSprite() {
    const prefix = this.isPuppy && this.stage === 'ADULT' ? '_dog' : '';

    // Siempre prioridad: muerto
    if (!this.alive) { this.currentSprite = 'dead' + prefix; return; }

    // Larvas: imagen fija, sin cambios de estado
    if (this.stage !== 'ADULT') {
      this.currentSprite = this.stage === 'LARVA_2' ? 'larva_2' : 'larva_1';
      return;
    }

    // === Solo adultos tienen sprites de estado ===

    // 1. Override temporal (eating / playing / grumpy por acción)
    //    main.js lo limpia con un setTimeout
    if (this.tempSprite) {
      this.currentSprite = this.tempSprite + prefix;
      return;
    }

    // 2. Durmiendo
    if (this.sleeping) { this.currentSprite = 'sleepy' + prefix; return; }

    // 3. Muy enfermo (salud crítica)
    if (this.health < 30) { this.currentSprite = 'sick' + prefix; return; }

    // 4. Triste por diversión baja
    if (this.fun < 50) { this.currentSprite = 'sad' + prefix; return; }

    // 5. Triste por salud baja (no crítica)
    if (this.health < 50) { this.currentSprite = 'sad' + prefix; return; }

    // 6. Malhumorado por disciplina baja
    if (this.discipline < 30) { this.currentSprite = 'grumpy' + prefix; return; }

    // 7. Estado normal
    this.currentSprite = 'idle' + prefix;
  }

  // ─── Serialización ───────────────────────────────────────────
  toJSON() { return { ...this }; }

  static fromJSON(data) {
    const p = new Pet(data.name);
    Object.assign(p, data);
    // Asegurar que tempSprite no persista entre sesiones
    p.tempSprite = null;
    return p;
  }
}