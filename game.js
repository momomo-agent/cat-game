// Cat Game - Core Game Engine
class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.entities = [];
    this.paused = false;
    this.score = 0;
    this.theme = null;
    this.themeName = 'aquarium';
    this.speedMultiplier = 1;
    this.targetCount = 5;
    this.particles = new ParticleSystem();
    this.sound = new SoundManager();
    this.bgTime = 0;

    this._resize();
    this._bindEvents();
    this.setTheme('aquarium');
    this._spawnInitial();
    this._loop(0);
  }

  // --- Canvas ---
  _resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.W = window.innerWidth;
    this.H = window.innerHeight;
  }

  // --- Events ---
  _bindEvents() {
    window.addEventListener('resize', () => this._resize());
    this.canvas.addEventListener('touchstart', e => {
      e.preventDefault();
      this.sound.init(); this.sound.resume();
      for (const t of e.changedTouches) this._checkHit(t.clientX, t.clientY);
    }, { passive: false });
    this.canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      for (const t of e.changedTouches) this._checkHit(t.clientX, t.clientY);
    }, { passive: false });
    this.canvas.addEventListener('mousedown', e => {
      this.sound.init(); this.sound.resume();
      this._checkHit(e.clientX, e.clientY);
    });
    this.canvas.addEventListener('mousemove', e => {
      if (e.buttons) this._checkHit(e.clientX, e.clientY);
    });
    document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
    document.addEventListener('gesturestart', e => e.preventDefault());
    document.addEventListener('gesturechange', e => e.preventDefault());
  }

  // --- Hit Detection ---
  _checkHit(x, y) {
    if (this.paused) return;
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const e = this.entities[i];
      if (e.captured) continue;
      const hitR = e.size * 2.5;
      const dx = x - e.x, dy = y - e.y;
      if (dx * dx + dy * dy < hitR * hitR) this._capture(e);
    }
  }

  _capture(entity) {
    entity.captured = true;
    entity.captureTime = Date.now();
    this.score++;
    document.getElementById('score-display').textContent = this.score;
    const colors = this.theme.particleColors;
    this.particles.emit(entity.x, entity.y, colors, 24);
    this.particles.emitRing(entity.x, entity.y, colors);
    this.particles.emitStars(entity.x, entity.y, colors);
    this.sound.play(this.theme.captureSound);
    setTimeout(() => {
      const idx = this.entities.indexOf(entity);
      if (idx !== -1) this.entities.splice(idx, 1);
      if (!this.paused) this._spawnOne();
    }, 300);
  }

  // --- Spawning ---
  _spawnInitial() {
    this.entities = [];
    for (let i = 0; i < this.targetCount; i++) this._spawnOne();
  }

  _spawnOne() {
    const th = this.theme;
    const emoji = th.emojis[Math.floor(Math.random() * th.emojis.length)];
    const size = th.movePattern === 'laser' ? 18 : 28 + Math.random() * 16;
    const pad = 60;
    let x, y;
    if (th.movePattern === 'scurry') {
      const edge = Math.floor(Math.random() * 4);
      if (edge === 0) { x = -pad; y = Math.random() * this.H; }
      else if (edge === 1) { x = this.W + pad; y = Math.random() * this.H; }
      else if (edge === 2) { x = Math.random() * this.W; y = -pad; }
      else { x = Math.random() * this.W; y = this.H + pad; }
    } else {
      x = pad + Math.random() * (this.W - pad * 2);
      y = pad + Math.random() * (this.H - pad * 2);
    }
    const e = {
      x, y, emoji, size, captured: false, captureTime: 0,
      vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2,
      wobblePhase: Math.random() * Math.PI * 2,
      time: Math.random() * 1000, pauseTimer: 0,
      flipX: Math.random() > 0.5,
      jumpTimer: Math.floor(Math.random() * 60),
      jumpTargetX: pad + Math.random() * (this.W - pad * 2),
      jumpTargetY: pad + Math.random() * (this.H - pad * 2),
      pathPoints: this._genPath(x, y), pathProgress: 0
    };
    if (th.movePattern === 'scurry') {
      const a = Math.atan2(this.H / 2 - y, this.W / 2 - x) + (Math.random() - 0.5);
      const s = 2 + Math.random() * 2;
      e.vx = Math.cos(a) * s; e.vy = Math.sin(a) * s;
    }
    this.entities.push(e);
  }

  _genPath(sx, sy) {
    const pts = [{ x: sx, y: sy }];
    const pad = 80;
    for (let i = 0; i < 4; i++) {
      pts.push({ x: pad + Math.random() * (this.W - pad * 2), y: pad + Math.random() * (this.H - pad * 2) });
    }
    return pts;
  }

  // --- Movement ---
  _updateEntity(e) {
    if (e.captured) return;
    const pattern = this.theme.movePattern;
    const spd = this.speedMultiplier;
    e.time++;
    e.wobblePhase += 0.03;

    switch (pattern) {
      case 'swim': this._moveSwim(e, spd); break;
      case 'scurry': this._moveScurry(e, spd); break;
      case 'crawl': this._moveCrawl(e, spd); break;
      case 'laser': this._moveLaser(e, spd); break;
      case 'flutter': this._moveFlutter(e, spd); break;
    }

    const m = 100;
    if (pattern !== 'laser') {
      if (e.x < -m) e.x = this.W + m * 0.5;
      if (e.x > this.W + m) e.x = -m * 0.5;
      if (e.y < -m) e.y = this.H + m * 0.5;
      if (e.y > this.H + m) e.y = -m * 0.5;
    }
  }

  _moveSwim(e, spd) {
    e.vx += (Math.random() - 0.5) * 0.02 * spd;
    e.vy = Math.sin(e.time * 0.02 + e.wobblePhase) * 0.9 * spd;
    const max = 1.5 * spd;
    e.vx = Math.max(-max, Math.min(max, e.vx));
    if (Math.abs(e.vx) < 0.3 * spd) e.vx += (e.flipX ? 1 : -1) * 0.5 * spd;
    e.x += e.vx;
    e.y += e.vy;
    e.flipX = e.vx > 0;
  }

  _moveScurry(e, spd) {
    if (e.pauseTimer > 0) { e.pauseTimer--; return; }
    if (Math.random() < 0.005) { e.pauseTimer = 30 + Math.random() * 30; return; }
    if (Math.random() < 0.03) {
      const a = Math.atan2(e.vy, e.vx) + (Math.random() - 0.5) * 2;
      const s = 3 * spd * (0.5 + Math.random());
      e.vx = Math.cos(a) * s; e.vy = Math.sin(a) * s;
    }
    e.vx += (Math.random() - 0.5) * 0.1 * spd;
    e.vy += (Math.random() - 0.5) * 0.1 * spd;
    const max = 4.5 * spd;
    const len = Math.sqrt(e.vx * e.vx + e.vy * e.vy);
    if (len > max) { e.vx = (e.vx / len) * max; e.vy = (e.vy / len) * max; }
    e.x += e.vx; e.y += e.vy;
    e.flipX = e.vx > 0;
  }

  _initBg() {
    this.bgBubbles = [];
    this.bgGrass = [];
    if (this.theme.bgType === 'bubbles') {
      for (let i = 0; i < 15; i++) {
        this.bgBubbles.push({
          x: Math.random() * this.W,
          y: Math.random() * this.H,
          r: 5 + Math.random() * 20,
          speed: 0.2 + Math.random() * 0.5,
          wobble: Math.random() * Math.PI * 2
        });
      }
    }
    if (this.theme.bgType === 'grass') {
      for (let i = 0; i < 50; i++) {
        this.bgGrass.push({
          x: Math.random() * this.W,
          h: 20 + Math.random() * 40,
          phase: Math.random() * Math.PI * 2
        });
      }
    }
  }

  _drawBg(ctx) {
    this.bgTime += 0.016;
    const grad = ctx.createLinearGradient(0, 0, 0, this.H);
    const colors = this.theme.bgGradient;
    colors.forEach((c, i) => grad.addColorStop(i / (colors.length - 1), c));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.W, this.H);

    const bgType = this.theme.bgType;
    if (bgType === 'bubbles') {
      ctx.fillStyle = 'rgba(135,206,235,0.12)';
      for (const b of this.bgBubbles) {
        b.y -= b.speed;
        b.x += Math.sin(b.wobble + this.bgTime) * 0.3;
        if (b.y < -b.r * 2) b.y = this.H + b.r * 2;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (bgType === 'woodgrain') {
      ctx.strokeStyle = 'rgba(62,39,35,0.12)';
      ctx.lineWidth = 1;
      for (let y = 0; y < this.H; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x < this.W; x += 20) {
          ctx.lineTo(x, y + Math.sin(x * 0.01 + y * 0.1) * 4);
        }
        ctx.stroke();
      }
    }

    if (bgType === 'grass') {
      ctx.strokeStyle = 'rgba(76,175,80,0.2)';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      for (const g of this.bgGrass) {
        const sway = Math.sin(this.bgTime * 1.5 + g.phase) * 8;
        ctx.beginPath();
        ctx.moveTo(g.x, this.H);
        ctx.quadraticCurveTo(g.x + sway, this.H - g.h * 0.6, g.x + sway * 1.5, this.H - g.h);
        ctx.stroke();
      }
    }

    if (bgType === 'flowers') {
      ctx.globalAlpha = 0.06;
      const flowers = ['🌸', '🌺', '🌼'];
      ctx.font = '24px serif';
      for (let i = 0; i < 12; i++) {
        ctx.fillText(flowers[i % 3], (i * 137.5) % this.W, (i * 97.3) % this.H);
      }
      ctx.globalAlpha = 1;
    }
  }

  _drawEntity(ctx, e) {
    if (e.captured) return;
    ctx.save();
    ctx.translate(e.x, e.y);
    if (e.flipX) ctx.scale(-1, 1);

    if (this.theme.movePattern === 'laser') {
      ctx.shadowColor = '#ff1744';
      ctx.shadowBlur = 25;
      const pulse = 0.8 + Math.sin(e.time * 0.15) * 0.2;
      ctx.scale(pulse, pulse);
    }

    ctx.font = e.size + 'px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(e.emoji, 0, 0);
    ctx.restore();
  }

  _loop() {
    requestAnimationFrame(() => this._loop());
    if (this.paused) return;
    const ctx = this.ctx;

    this._drawBg(ctx);

    for (const e of this.entities) {
      this._updateEntity(e);
      this._drawEntity(ctx, e);
    }

    // Maintain count
    while (this.entities.filter(e => !e.captured).length < this.targetCount) {
      this._spawnOne();
    }

    this.particles.update();
    this.particles.draw(ctx);
  }

  pause() { this.paused = true; }
  resume() { this.paused = false; }
}

// Init
window.addEventListener('DOMContentLoaded', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
  window.game = new CatGame();
});
