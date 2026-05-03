// ============================================================
// movement.js — Movimiento autónomo de la mascota en la sala
// ============================================================

export class Movement {
  constructor(containerEl, spriteEl) {
    this.container = containerEl;
    this.sprite    = spriteEl;

    this.x = 50;   // % horizontal
    this.y = 55;   // % vertical
    this.dx = 0;
    this.dy = 0;
    this.speed = 0.08; // % por frame
    this.paused = false;

    this._pickTarget();
    this._loop();
  }

  _pickTarget() {
    // Nueva posición destino aleatoria dentro del área de la habitación
    this.targetX = 10 + Math.random() * 80; // 10%–90%
    this.targetY = 35 + Math.random() * 40; // 35%–75%
    this.waitTime = 1500 + Math.random() * 3000; // pausa en destino
    this.waiting  = false;
  }

  _loop() {
    const step = () => {
      if (!this.paused) {
        this._move();
        this._applyPosition();
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  _move() {
    if (this.waiting) return;

    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 0.5) {
      // Llegó al destino → esperar y voltear sprite
      this.waiting = true;
      this.sprite.classList.remove('flip');
      setTimeout(() => {
        this.waiting = false;
        this._pickTarget();
      }, this.waitTime);
      return;
    }

    // Mover hacia el destino
    const norm = dist > 0 ? 1 / dist : 0;
    this.x += dx * norm * this.speed;
    this.y += dy * norm * this.speed;

    // Voltear sprite según dirección
    if (dx < 0) {
      this.sprite.classList.add('flip');
    } else {
      this.sprite.classList.remove('flip');
    }
  }

  _applyPosition() {
    this.sprite.style.left = `${this.x}%`;
    this.sprite.style.top  = `${this.y}%`;
  }

  pause()  { this.paused = true;  }
  resume() { this.paused = false; }

  // Centra la mascota (para animaciones especiales)
  center() {
    this.x = 50;
    this.y = 55;
    this._applyPosition();
    this.pause();
    setTimeout(() => this.resume(), 2000);
  }
}