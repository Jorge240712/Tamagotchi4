// ============================================================
// sounds.js — Motor de sonido 8-bit con Web Audio API
// Sin archivos externos, todo generado proceduralmente
// ============================================================

let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// ─── Primitiva: tono con forma de onda ───────────────────────
function playTone({ freq = 440, type = 'square', duration = 0.1, volume = 0.3, delay = 0, attack = 0.005, decay = 0.05 }) {
  const c = getCtx();
  const osc  = c.createOscillator();
  const gain = c.createGain();

  osc.connect(gain);
  gain.connect(c.destination);

  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime + delay);

  // Envelope
  gain.gain.setValueAtTime(0, c.currentTime + delay);
  gain.gain.linearRampToValueAtTime(volume, c.currentTime + delay + attack);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + duration);

  osc.start(c.currentTime + delay);
  osc.stop(c.currentTime + delay + duration + 0.02);
}

// ─── Primitiva: sweep de frecuencia ──────────────────────────
function playSweep({ startFreq, endFreq, type = 'square', duration = 0.15, volume = 0.25, delay = 0 }) {
  const c = getCtx();
  const osc  = c.createOscillator();
  const gain = c.createGain();

  osc.connect(gain);
  gain.connect(c.destination);

  osc.type = type;
  osc.frequency.setValueAtTime(startFreq, c.currentTime + delay);
  osc.frequency.exponentialRampToValueAtTime(endFreq, c.currentTime + delay + duration);

  gain.gain.setValueAtTime(volume, c.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + duration);

  osc.start(c.currentTime + delay);
  osc.stop(c.currentTime + delay + duration + 0.02);
}

// ─── Ruido blanco (para efectos de limpieza) ─────────────────
function playNoise({ duration = 0.1, volume = 0.15, delay = 0 }) {
  const c    = getCtx();
  const size = c.sampleRate * duration;
  const buf  = c.createBuffer(1, size, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;

  const src  = c.createBufferSource();
  const gain = c.createGain();
  const filt = c.createBiquadFilter();

  src.buffer = buf;
  filt.type  = 'bandpass';
  filt.frequency.value = 1200;

  src.connect(filt);
  filt.connect(gain);
  gain.connect(c.destination);

  gain.gain.setValueAtTime(volume, c.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + duration);

  src.start(c.currentTime + delay);
  src.stop(c.currentTime + delay + duration + 0.02);
}

// ================================================================
//  SONIDOS DEL JUEGO
// ================================================================

export const Sounds = {

  // 🍖 Alimentar — melodía ascendente feliz
  feed() {
    playTone({ freq: 330, duration: 0.09, delay: 0.00 });
    playTone({ freq: 440, duration: 0.09, delay: 0.09 });
    playTone({ freq: 550, duration: 0.09, delay: 0.18 });
    playTone({ freq: 660, duration: 0.18, delay: 0.27, volume: 0.35 });
  },

  // 🎮 Jugar — arpeggio animado
  play() {
    [392, 494, 587, 784].forEach((f, i) => {
      playTone({ freq: f, type: 'triangle', duration: 0.08, delay: i * 0.07, volume: 0.28 });
    });
  },

  // 🧹 Limpiar — ruido con sweep descendente
  clean() {
    playNoise({ duration: 0.18, volume: 0.18, delay: 0 });
    playSweep({ startFreq: 800, endFreq: 200, type: 'sine', duration: 0.2, volume: 0.2, delay: 0.05 });
    playTone({ freq: 440, type: 'sine', duration: 0.15, delay: 0.22, volume: 0.2 });
  },

  // 💊 Medicar — dos tonos suaves médicos
  medicate() {
    playTone({ freq: 523, type: 'sine', duration: 0.12, delay: 0.00, volume: 0.25 });
    playTone({ freq: 659, type: 'sine', duration: 0.20, delay: 0.14, volume: 0.30 });
  },

  // 📏 Disciplinar — tono bajo y firme
  discipline() {
    playSweep({ startFreq: 220, endFreq: 110, type: 'sawtooth', duration: 0.2, volume: 0.3, delay: 0 });
    playTone({ freq: 110, type: 'square', duration: 0.15, delay: 0.2, volume: 0.25 });
  },

  // 😴 Dormir — melodía suave descendente
  sleep() {
    [494, 440, 392, 330].forEach((f, i) => {
      playTone({ freq: f, type: 'triangle', duration: 0.12, delay: i * 0.1, volume: 0.2 });
    });
  },

  // 🌅 Despertar — melodía ascendente brillante
  wakeUp() {
    [330, 392, 494, 587, 784].forEach((f, i) => {
      playTone({ freq: f, type: 'triangle', duration: 0.1, delay: i * 0.08, volume: 0.25 });
    });
  },

  // ✨ Evolución — fanfare épica
  evolve() {
    const melody = [523, 659, 784, 1047];
    melody.forEach((f, i) => {
      playTone({ freq: f, type: 'square', duration: 0.18, delay: i * 0.16, volume: 0.3 });
    });
    // Acorde final
    [523, 659, 784].forEach((f) => {
      playTone({ freq: f, type: 'triangle', duration: 0.4, delay: 0.7, volume: 0.2 });
    });
  },

  // ⚠️ Alerta — pitido de advertencia
  alert() {
    playTone({ freq: 880, type: 'square', duration: 0.08, delay: 0.00, volume: 0.3 });
    playTone({ freq: 880, type: 'square', duration: 0.08, delay: 0.18, volume: 0.3 });
    playTone({ freq: 660, type: 'square', duration: 0.16, delay: 0.36, volume: 0.35 });
  },

  // 💀 Muerte — melodía descendente triste
  death() {
    [440, 392, 349, 330, 294, 262].forEach((f, i) => {
      playTone({ freq: f, type: 'sawtooth', duration: 0.18, delay: i * 0.15, volume: 0.25 });
    });
  },

  // 🖱️ Click de botón — tick corto
  click() {
    playTone({ freq: 600, type: 'square', duration: 0.04, volume: 0.15 });
  },

  // ❌ Error — buzz negativo
  error() {
    playSweep({ startFreq: 300, endFreq: 150, type: 'sawtooth', duration: 0.18, volume: 0.25 });
  },

  // 🎵 Tick periódico del juego — latido sutil
  tick() {
    playTone({ freq: 220, type: 'sine', duration: 0.04, volume: 0.08 });
  },
};