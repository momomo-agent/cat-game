// Sound Manager - Web Audio API synthesized sounds
class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      this.enabled = false;
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  play(type) {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    switch (type) {
      case 'bubble': this._bubble(); break;
      case 'squeak': this._squeak(); break;
      case 'crunch': this._crunch(); break;
      case 'zap': this._zap(); break;
      case 'chime': this._chime(); break;
      case 'bounce': this._bounce(); break;
      default: this._chime();
    }
  }

  _bubble() {
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.1);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.15);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  _squeak() {
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1800, t);
    osc.frequency.exponentialRampToValueAtTime(2400, t + 0.05);
    osc.frequency.exponentialRampToValueAtTime(1600, t + 0.1);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  _crunch() {
    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
    }
    const src = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 2;
    src.buffer = buffer;
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    src.connect(filter).connect(gain).connect(this.ctx.destination);
    src.start(t);
  }

  _zap() {
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.15);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  _chime() {
    const t = this.ctx.currentTime;
    [523, 659, 784].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      const off = i * 0.04;
      gain.gain.setValueAtTime(0, t + off);
      gain.gain.linearRampToValueAtTime(0.2, t + off + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, t + off + 0.25);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(t + off);
      osc.stop(t + off + 0.25);
    });
  }

  _bounce() {
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.15);
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.2);
    // Rubber squeak
    const osc2 = this.ctx.createOscillator();
    const g2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(800, t + 0.02);
    osc2.frequency.exponentialRampToValueAtTime(400, t + 0.1);
    g2.gain.setValueAtTime(0.15, t + 0.02);
    g2.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
    osc2.connect(g2).connect(this.ctx.destination);
    osc2.start(t + 0.02);
    osc2.stop(t + 0.12);
  }

  // Big exaggerated capture sound
  playBig(type) {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    // Play normal sound louder
    this.play(type);
    // Plus a satisfying "pop-sparkle" overlay
    const t = this.ctx.currentTime;
    // Deep thump
    const osc1 = this.ctx.createOscillator();
    const g1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(150, t);
    osc1.frequency.exponentialRampToValueAtTime(40, t + 0.2);
    g1.gain.setValueAtTime(0.5, t);
    g1.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
    osc1.connect(g1).connect(this.ctx.destination);
    osc1.start(t); osc1.stop(t + 0.25);
    // High sparkle
    const osc2 = this.ctx.createOscillator();
    const g2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1200, t + 0.05);
    osc2.frequency.exponentialRampToValueAtTime(2000, t + 0.15);
    g2.gain.setValueAtTime(0.3, t + 0.05);
    g2.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
    osc2.connect(g2).connect(this.ctx.destination);
    osc2.start(t + 0.05); osc2.stop(t + 0.3);
  }
}
