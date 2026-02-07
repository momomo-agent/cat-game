// Cat Game - Core Engine
const SPEED_MULT = { slow: 0.5, medium: 1.0, fast: 1.8 };

class CatGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.sound = new SoundManager();
    this.particles = new ParticleSystem();
    this.entities = [];
    this.paused = false;
    this.score = 0;
    this.themeName = 'aquarium';
    this.theme = THEMES.aquarium;
    this.speedMult = 1.0;
    this.targetCount = 5;
    this.bgTime = 0;
    this.bgBubbles = [];
    this.bgGrass = [];
    this._loadSettings();
    this._resize();
    this._bindTouch();
    this._bindSettings();
    this._initBg();
    this._spawnAll();
    this._loop();
  }

  _loadSettings() {
    try {
      const s = JSON.parse(localStorage.getItem('catGameSettings'));
      if (s) {
        this.themeName = s.theme || 'aquarium';
        this.theme = THEMES[this.themeName] || THEMES.aquarium;
        this.speedMult = SPEED_MULT[s.speed] || 1.0;
        this.targetCount = s.count || 5;
      }
    } catch (e) {}
  }

  _saveSettings() {
    const sn = Object.keys(SPEED_MULT).find(k => SPEED_MULT[k] === this.speedMult) || 'medium';
    try { localStorage.setItem('catGameSettings', JSON.stringify({ theme: this.themeName, speed: sn, count: this.targetCount })); } catch (e) {}
  }

  _resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.W = window.innerWidth;
    this.H = window.innerHeight;
  }

  _bindTouch() {
    window.addEventListener('resize', () => { this._resize(); this._initBg(); });
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault(); this.sound.init(); this.sound.resume();
      for (const t of e.changedTouches) this._hit(t.clientX, t.clientY);
    }, { passive: false });
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) this._hit(t.clientX, t.clientY);
    }, { passive: false });
    this.canvas.addEventListener('mousedown', (e) => {
      this.sound.init(); this.sound.resume(); this._hit(e.clientX, e.clientY);
    });
    this.canvas.addEventListener('mousemove', (e) => { if (e.buttons) this._hit(e.clientX, e.clientY); });
    document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
    document.addEventListener('gesturestart', e => e.preventDefault());
    document.addEventListener('gesturechange', e => e.preventDefault());
  }

  _hit(x, y) {
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
    this.score++;
    document.getElementById('scoreDisplay').textContent = '✨ ' + this.score;
    this.particles.emit(entity.x, entity.y, this.theme.particleColors, 22);
    this.particles.emitRing(entity.x, entity.y, this.theme.particleColors);
    this.sound.play(this.theme.captureSound);
    setTimeout(() => {
      const idx = this.entities.indexOf(entity);
      if (idx !== -1) this.entities.splice(idx, 1);
      if (!this.paused) this._spawnOne();
    }, 300);
  }

  _bindSettings() {
    const gear = document.getElementById('gearBtn');
    const overlay = document.getElementById('settingsOverlay');
    const ring = gear.querySelector('.progress-ring');
    const circ = 2 * Math.PI * 18;
    let pressTimer = null, rafId = null, pressStart = 0;
    const startPress = (e) => {
      e.preventDefault(); e.stopPropagation();
      if (this.paused) return;
      pressStart = Date.now();
      gear.classList.add('pressing');
      const anim = () => {
        const p = Math.min((Date.now() - pressStart) / 3000, 1);
        ring.style.strokeDashoffset = circ * (1 - p);
        if (p < 1) rafId = requestAnimationFrame(anim);
      };
      rafId = requestAnimationFrame(anim);
      pressTimer = setTimeout(() => {
        this.paused = true;
        overlay.classList.add('visible');
        gear.classList.remove('pressing');
        ring.style.strokeDashoffset = circ;
      }, 3000);
    };
    const endPress = (e) => {
      e.preventDefault(); e.stopPropagation();
      clearTimeout(pressTimer); cancelAnimationFrame(rafId);
      gear.classList.remove('pressing');
      ring.style.strokeDashoffset = circ;
    };
    gear.addEventListener('touchstart', startPress, { passive: false });
    gear.addEventListener('touchend', endPress, { passive: false });
    gear.addEventListener('touchcancel', endPress, { passive: false });
    gear.addEventListener('mousedown', startPress);
    gear.addEventListener('mouseup', endPress);
    gear.addEventListener('mouseleave', endPress);

    // Close
    document.getElementById('closeBtn').addEventListener('click', () => {
      overlay.classList.remove('visible'); this.paused = false;
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) { overlay.classList.remove('visible'); this.paused = false; }
    });
    document.getElementById('settingsPanel').addEventListener('touchstart', e => e.stopPropagation(), { passive: false });

    // Theme buttons
    const tc = document.getElementById('themeButtons');
    for (const [key, t] of Object.entries(THEMES)) {
      const btn = document.createElement('button');
      btn.className = 'theme-btn' + (key === this.themeName ? ' active' : '');
      btn.dataset.theme = key;
      btn.textContent = t.icon + ' ' + t.name;
      tc.appendChild(btn);
    }
    tc.addEventListener('click', (e) => {
      const btn = e.target.closest('.theme-btn');
      if (!btn) return;
      tc.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      this.themeName = btn.dataset.theme;
      this.theme = THEMES[this.themeName];
      this._saveSettings(); this._reset();
    });

    // Speed
    const sn = Object.keys(SPEED_MULT).find(k => SPEED_MULT[k] === this.speedMult) || 'medium';
    document.querySelectorAll('.speed-btn').forEach(b => b.classList.toggle('active', b.dataset.speed === sn));
    document.querySelector('.speed-buttons').addEventListener('click', (e) => {
      const btn = e.target.closest('.speed-btn');
      if (!btn) return;
      document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      this.speedMult = SPEED_MULT[btn.dataset.speed] || 1.0;
      this._saveSettings(); this._reset();
    });

    // Count
    const slider = document.getElementById('countSlider');
    const cv = document.getElementById('countValue');
    slider.value = this.targetCount; cv.textContent = this.targetCount;
    slider.addEventListener('input', () => {
      this.targetCount = parseInt(slider.value);
      cv.textContent = this.targetCount;
      this._saveSettings(); this._reset();
    });
  }

  _reset() { this.entities = []; this.particles.clear(); this._initBg(); this._spawnAll(); }
  _spawnAll() { for (let i = this.entities.length; i < this.targetCount; i++) this._spawnOne(); }

  _spawnOne() {
    const pad = 60, pattern = this.theme.movePattern;
    let x, y;
    if (pattern === 'scurry') {
      const edge = Math.floor(Math.random() * 4);
      if (edge === 0) { x = -pad; y = Math.random() * this.H; }
      else if (edge === 1) { x = this.W + pad; y = Math.random() * this.H; }
      else if (edge === 2) { x = Math.random() * this.W; y = -pad; }
      else { x = Math.random() * this.W; y = this.H + pad; }
    } else {
      x = pad + Math.random() * (this.W - pad * 2);
      y = pad + Math.random() * (this.H - pad * 2);
    }
    const emoji = this.theme.emojis[Math.floor(Math.random() * this.theme.emojis.length)];
    const size = pattern === 'laser' ? 32 : 28 + Math.random() * 16;
    const a = Math.random() * Math.PI * 2;
    const spd = pattern === 'scurry' ? 2 + Math.random() * 2 : 1 + Math.random();
    this.entities.push({
      x, y, emoji, size, captured: false,
      vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
      wobblePhase: Math.random() * Math.PI * 2,
      time: Math.random() * 1000, pauseTimer: 0,
      flipX: Math.random() > 0.5,
      jumpTimer: Math.floor(Math.random() * 60),
      jumpTargetX: x, jumpTargetY: y,
      pathPoints: this._genPath(x, y), pathProgress: 0
    });
  }

  _genPath(sx, sy) {
    const pts = [{ x: sx, y: sy }];
    for (let i = 0; i < 4; i++) pts.push({ x: 80 + Math.random() * (this.W - 160), y: 80 + Math.random() * (this.H - 160) });
    return pts;
  }

  _updateEntity(e) {
    if (e.captured) return;
    const p = this.theme.movePattern, spd = this.speedMult;
    e.time++; e.wobblePhase += 0.03;
    switch (p) {
      case 'swim': this._moveSwim(e, spd); break;
      case 'scurry': this._moveScurry(e, spd); break;
      case 'crawl': this._moveCrawl(e, spd); break;
      case 'laser': this._moveLaser(e, spd); break;
      case 'flutter': this._moveFlutter(e, spd); break;
    }
    if (p !== 'laser') {
      const m = 100;
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
    e.x += e.vx; e.y += e.vy; e.flipX = e.vx > 0;
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
    const max = 4.5 * spd, len = Math.sqrt(e.vx * e.vx + e.vy * e.vy);
    if (len > max) { e.vx = (e.vx / len) * max; e.vy = (e.vy / len) * max; }
    e.x += e.vx; e.y += e.vy; e.flipX = e.vx > 0;
  }

  _moveCrawl(e, spd) {
    e.pathProgress += 0.8 * spd * 0.003;
    if (e.pathProgress >= 1) { e.pathProgress = 0; e.pathPoints = this._genPath(e.x, e.y); }
    const t = e.pathProgress, pts = e.pathPoints, n = pts.length - 1;
    const seg = Math.min(Math.floor(t * n), n - 1), lt = (t * n) - seg;
    const p0 = pts[seg], p1 = pts[Math.min(seg + 1, n)];
    const prevX = e.x;
    e.x = p0.x + (p1.x - p0.x) * lt + Math.sin(e.time * 0.03) * 4;
    e.y = p0.y + (p1.y - p0.y) * lt + Math.cos(e.time * 0.04) * 3;
    e.flipX = e.x > prevX;
  }

  _moveLaser(e, spd) {
    e.jumpTimer--;
    if (e.jumpTimer <= 0) {
      e.jumpTargetX = 60 + Math.random() * (this.W - 120);
      e.jumpTargetY = 60 + Math.random() * (this.H - 120);
      e.jumpTimer = (40 + Math.random() * 30) / spd;
    }
    e.x += (e.jumpTargetX - e.x) * 0.12 * spd;
    e.y += (e.jumpTargetY - e.y) * 0.12 * spd;
    e.x += (Math.random() - 0.5) * 2 * spd;
    e.y += (Math.random() - 0.5) * 2 * spd;
  }

  _moveFlutter(e, spd) {
    e.vx += Math.sin(e.time * 0.04 + e.wobblePhase) * 0.08 * spd + (Math.random() - 0.5) * 0.03 * spd;
    e.vy += Math.cos(e.time * 0.03 + e.wobblePhase) * 0.12 * spd + (Math.random() - 0.5) * 0.03 * spd;
    if (Math.random() < 0.015) { e.vx += (Math.random() - 0.5) * 3 * spd; e.vy += (Math.random() - 0.5) * 2 * spd; }
    const max = 1.2 * spd, len = Math.sqrt(e.vx * e.vx + e.vy * e.vy);
    if (len > max) { e.vx = (e.vx / len) * max; e.vy = (e.vy / len) * max; }
    e.x += e.vx; e.y += e.vy; e.flipX = e.vx > 0;
  }

  _initBg() {
    this.bgBubbles = []; this.bgGrass = [];
    if (this.theme.bgType === 'bubbles') {
      for (let i = 0; i < 15; i++) this.bgBubbles.push({ x: Math.random() * this.W, y: Math.random() * this.H, r: 5 + Math.random() * 20, speed: 0.2 + Math.random() * 0.5, wobble: Math.random() * Math.PI * 2 });
    }
    if (this.theme.bgType === 'grass') {
      for (let i = 0; i < 50; i++) this.bgGrass.push({ x: Math.random() * this.W, h: 20 + Math.random() * 40, phase: Math.random() * Math.PI * 2 });
    }
  }

  _drawBg(ctx) {
    this.bgTime += 0.016;
    const grad = ctx.createLinearGradient(0, 0, 0, this.H);
    this.theme.bgGradient.forEach((c, i, a) => grad.addColorStop(i / (a.length - 1), c));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.W, this.H);

    if (this.theme.bgType === 'bubbles') {
      ctx.fillStyle = 'rgba(135,206,235,0.12)';
      for (const b of this.bgBubbles) {
        b.y -= b.speed; b.x += Math.sin(b.wobble + this.bgTime) * 0.3;
        if (b.y < -b.r * 2) b.y = this.H + b.r * 2;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (this.theme.bgType === 'woodgrain') {
      ctx.strokeStyle = 'rgba(62,39,35,0.12)'; ctx.lineWidth = 1;
      for (let y = 0; y < this.H; y += 30) {
        ctx.beginPath(); ctx.moveTo(0, y);
        for (let x = 0; x < this.W; x += 20) ctx.lineTo(x, y + Math.sin(x * 0.01 + y * 0.1) * 4);
        ctx.stroke();
      }
    }
    if (this.theme.bgType === 'grass') {
      ctx.strokeStyle = 'rgba(76,175,80,0.2)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      for (const g of this.bgGrass) {
        const sway = Math.sin(this.bgTime * 1.5 + g.phase) * 8;
        ctx.beginPath(); ctx.moveTo(g.x, this.H);
        ctx.quadraticCurveTo(g.x + sway, this.H - g.h * 0.6, g.x + sway * 1.5, this.H - g.h);
        ctx.stroke();
      }
    }
    if (this.theme.bgType === 'flowers') {
      ctx.globalAlpha = 0.06; ctx.font = '24px serif';
      ['🌸','🌺','🌼'].forEach((f, i) => { for (let j = i; j < 12; j += 3) ctx.fillText(f, (j * 137.5) % this.W, (j * 97.3) % this.H); });
      ctx.globalAlpha = 1;
    }
  }

  _drawEntity(ctx, e) {
    if (e.captured) return;
    ctx.save();
    ctx.translate(e.x, e.y);
    if (e.flipX) ctx.scale(-1, 1);
    if (this.theme.movePattern === 'laser') {
      ctx.shadowColor = '#ff1744'; ctx.shadowBlur = 40;
      const pulse = 0.85 + Math.sin(e.time * 0.15) * 0.15;
      ctx.scale(pulse, pulse);
      // Extra glow layer
      ctx.beginPath();
      ctx.arc(0, 0, e.size * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,23,68,0.15)';
      ctx.fill();
    }
    ctx.font = e.size + 'px serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(e.emoji, 0, 0);
    ctx.restore();
  }

  _loop() {
    requestAnimationFrame(() => this._loop());
    if (this.paused) return;
    const ctx = this.ctx;
    this._drawBg(ctx);
    for (const e of this.entities) { this._updateEntity(e); this._drawEntity(ctx, e); }
    while (this.entities.filter(e => !e.captured).length < this.targetCount) this._spawnOne();
    this.particles.update();
    this.particles.draw(ctx);
  }
}

// Init
window.addEventListener('DOMContentLoaded', () => {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
  window.game = new CatGame();
});
