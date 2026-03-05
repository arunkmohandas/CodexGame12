import { LevelGenerator } from './levels.js';

class AudioManager {
  constructor(state) { this.state = state; this.ctx = null; }
  play(type) {
    if (!this.state.audio) return;
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
    o.type = 'triangle';
    const map = { pin: 420, bounce: 280, boom: 80, coin: 700, upgrade: 560, win: 900, lose: 130 };
    o.frequency.value = map[type] || 300;
    g.gain.value = 0.001; g.gain.exponentialRampToValueAtTime(0.15, this.ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + (type === 'boom' ? 0.25 : 0.12));
    o.connect(g).connect(this.ctx.destination); o.start(); o.stop(this.ctx.currentTime + 0.28);
  }
}

export class GameManager {
  constructor(state, upgrades, ui) {
    this.state = state; this.upgrades = upgrades; this.ui = ui;
    this.audio = upgrades.audio;
    this.chamber = document.getElementById('chamber');
    this.effects = document.getElementById('effectsLayer');
    this.current = null;
    this.balls = []; this.pins = []; this.walls = []; this.platforms = [];
    this.history = [];
    this.autoTimer = 0;
  }

  init() {
    this.loadLevel();
    this.bind();
    requestAnimationFrame((t) => this.loop(t));
  }

  bind() {
    document.getElementById('restartBtn').onclick = () => this.loadLevel();
    document.getElementById('undoBtn').onclick = () => this.undo();
    document.getElementById('hintBtn').onclick = () => this.showHint();
    document.getElementById('nextLevelBtn').onclick = () => { this.ui.hideModal(); this.state.level++; this.loadLevel(); };
    document.getElementById('replayBtn').onclick = () => { this.ui.hideModal(); this.loadLevel(); };
  }

  loadLevel() {
    this.history = [];
    this.current = LevelGenerator.generate(this.state.level);
    this.balls = this.current.balls.map((b, i) => ({ ...b, id: i, vx: 0, vy: 0, alive: true, colored: b.type === 'color', inContainer: false }));
    this.pins = this.current.pins.map(p => ({ ...p }));
    this.walls = this.current.walls.map(w => ({ ...w }));
    this.platforms = this.current.platforms.map(p => ({ ...p, originX: p.x }));
    this.renderLevel();
    this.ui.showScreen('puzzleScreen');
    this.ui.refreshPanels();
  }

  renderLevel() {
    this.chamber.querySelectorAll('.ball,.pin,.wall,.platform').forEach(e => e.remove());
    this.pins.forEach(p => {
      const el = document.createElement('div'); el.className = 'pin'; el.style.left = `${p.x}px`; el.style.top = `${p.y}px`; el.style.width = `${p.width}px`;
      el.onclick = () => this.pullPin(p.id); p.el = el; this.chamber.appendChild(el);
    });
    this.balls.forEach(b => {
      const el = document.createElement('div'); el.className = `ball ${b.type}`; el.style.left = `${b.x}px`; el.style.top = `${b.y}px`;
      if (this.state.selectedSkin === 'striped') el.classList.add('skin-striped');
      if (this.state.selectedSkin === 'neon') el.classList.add('skin-neon');
      b.el = el; this.chamber.appendChild(el);
    });
    this.walls.forEach(w => { const e = document.createElement('div'); e.className = 'wall'; Object.assign(e.style, { left: `${w.x}px`, top: `${w.y}px`, width: `${w.width}px`, height: `${w.height}px` }); w.el = e; this.chamber.appendChild(e); });
    this.platforms.forEach(p => { const e = document.createElement('div'); e.className = 'platform'; Object.assign(e.style, { left: `${p.x}px`, top: `${p.y}px`, width: `${p.width}px`, height: `${p.height}px` }); p.el = e; this.chamber.appendChild(e); });
  }

  pullPin(id) {
    const p = this.pins.find(x => x.id === id && !x.removed);
    if (!p) return;
    this.history.push(this.pins.map(k => ({ id: k.id, removed: k.removed })));
    p.removed = true; p.el.classList.add('removed'); this.audio.play('pin');
  }

  undo() {
    const last = this.history.pop();
    if (!last) return;
    last.forEach(s => {
      const p = this.pins.find(x => x.id === s.id);
      p.removed = s.removed;
      p.el.classList.toggle('removed', s.removed);
    });
  }

  showHint() {
    const candidate = this.pins.find(p => !p.removed);
    if (!candidate) return;
    candidate.el.style.outline = '4px solid #22c55e';
    setTimeout(() => candidate.el.style.outline = '', 700);
  }

  loop(last) {
    let prev = last;
    const tick = (t) => {
      const dt = Math.min(0.033, (t - prev) / 1000) * this.upgrades.getDropSpeedMult(); prev = t;
      this.update(dt);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  update(dt) {
    this.state.stats.playTime += dt;
    this.movePlatforms(dt);
    const g = 900;
    const container = this.current.container;
    let aliveColored = 0, collectedColored = 0;
    this.balls.forEach(b => {
      if (!b.alive || b.inContainer) return;
      b.vy += g * dt;
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x < 0 || b.x > this.current.width - 20 || b.y > this.current.height + 10) {
        if (b.type !== 'bomb') this.lose('A ball was lost.');
        b.alive = false;
      }
      this.pins.forEach(p => {
        if (p.removed) return;
        if (b.y + 20 >= p.y && b.y + 20 <= p.y + 14 && b.x + 20 > p.x && b.x < p.x + p.width && b.vy > 0) {
          b.y = p.y - 20; b.vy *= -0.35; b.vx += (Math.random() - 0.5) * 40; this.audio.play('bounce');
        }
      });
      [...this.walls, ...this.platforms].forEach(w => {
        if (b.x + 20 > w.x && b.x < w.x + w.width && b.y + 20 > w.y && b.y < w.y + w.height) {
          if (b.vy > 0) b.y = w.y - 20;
          b.vy *= -0.2;
        }
      });

      if (b.x + 10 > container.x && b.x + 10 < container.x + container.width && b.y + 20 > container.y) {
        b.inContainer = true; this.collectBall(b);
      }
      if (b.type === 'color' && b.alive) aliveColored++;
      if (b.type === 'color' && b.inContainer) collectedColored++;
    });

    this.processCollisions();
    this.updateDOM();
    this.handleAutomation(dt);

    const totalColor = this.balls.filter(b => b.type === 'color').length;
    if (totalColor > 0 && collectedColored === totalColor) this.win();
  }

  movePlatforms(dt) {
    this.platforms.forEach(p => {
      p.x += p.speed * p.dir;
      if (Math.abs(p.x - p.originX) > p.range) p.dir *= -1;
    });
  }

  processCollisions() {
    for (let i = 0; i < this.balls.length; i++) {
      for (let j = i + 1; j < this.balls.length; j++) {
        const a = this.balls[i], b = this.balls[j];
        if (!a.alive || !b.alive || a.inContainer || b.inContainer) continue;
        const dx = (a.x - b.x), dy = (a.y - b.y);
        if (dx * dx + dy * dy > 360) continue;
        if ((a.type === 'bomb' && b.type !== 'bomb') || (b.type === 'bomb' && a.type !== 'bomb')) {
          a.alive = false; b.alive = false; this.explosion((a.x + b.x) / 2, (a.y + b.y) / 2);
          this.lose('A bomb exploded!');
        }
        if ((a.type === 'gray' && b.type === 'color') || (b.type === 'gray' && a.type === 'color')) {
          const g = a.type === 'gray' ? a : b;
          g.type = 'color'; g.el.classList.remove('gray'); g.el.classList.add('color');
        }
      }
    }
  }

  collectBall(b) {
    if (b.type !== 'color') return;
    this.state.stats.totalBallsDropped++;
    const reward = (1 + this.upgrades.getBallBonus()) * this.upgrades.getCoinMultiplier();
    this.state.coins += reward;
    this.state.stats.totalCoinsEarned += reward;
    this.audio.play('coin');
    this.spawnParticles(b.x, b.y);
  }

  win() {
    if (this.won) return;
    this.won = true;
    this.chamber.classList.add('victory');
    this.state.stats.levelsCompleted++;
    this.unlocks();
    this.audio.play('win');
    const base = 10 * this.upgrades.getCoinMultiplier();
    this.state.coins += base;
    this.state.stats.totalCoinsEarned += base;
    this.ui.showLevelComplete(base, this.balls.filter(b => b.inContainer && b.type === 'color').length);
    this.ui.refreshPanels();
    setTimeout(() => { this.won = false; this.chamber.classList.remove('victory'); }, 1000);
  }

  lose(msg) {
    if (this.won) return;
    this.audio.play('lose');
    this.chamber.classList.add('shake');
    setTimeout(() => this.chamber.classList.remove('shake'), 350);
    this.ui.toast(msg);
    this.loadLevel();
  }

  handleAutomation(dt) {
    if (this.state.upgrades.autoPinPuller <= 0) return;
    this.autoTimer += dt;
    const interval = Math.max(0.6, 3 - this.state.upgrades.autoPinPuller * 0.4);
    if (this.autoTimer > interval) {
      this.autoTimer = 0;
      const pin = this.pins.find(p => !p.removed);
      if (pin) this.pullPin(pin.id);
    }
  }

  explosion(x, y) {
    this.audio.play('boom');
    this.spawnParticles(x, y, 16, '#fb923c');
  }

  spawnParticles(x, y, count = 8, color = '#fde047') {
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div'); p.className = 'particle'; p.style.left = `${x}px`; p.style.top = `${y}px`; p.style.background = color;
      p.style.setProperty('--tx', `${(Math.random() - 0.5) * 70}px`); p.style.setProperty('--ty', `${(Math.random() - 0.5) * 70}px`);
      this.effects.appendChild(p); setTimeout(() => p.remove(), 800);
    }
  }

  updateDOM() {
    this.balls.forEach(b => { if (b.el) { b.el.style.left = `${b.x}px`; b.el.style.top = `${b.y}px`; b.el.style.display = b.alive && !b.inContainer ? 'block' : 'none'; } });
    this.platforms.forEach(p => { if (p.el) p.el.style.left = `${p.x}px`; });
  }

  unlocks() {
    const lv = this.state.stats.levelsCompleted;
    const ach = this.state.stats.achievements;
    if (lv >= 5 && !ach.includes('Rookie Solver')) ach.push('Rookie Solver');
    if (lv >= 20 && !this.state.skins.includes('striped')) this.state.skins.push('striped');
    if (lv >= 40 && !this.state.skins.includes('neon')) this.state.skins.push('neon');
  }
}

export { AudioManager };
