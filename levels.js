function rand(seed) {
  let t = seed + 0x6D2B79F5;
  t = Math.imul(t ^ t >>> 15, t | 1);
  t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

export class LevelGenerator {
  static generate(level, seed = Date.now() % 100000) {
    if (level <= 10) return this.make(level, { pins: 2, colorBalls: 10, grayBalls: 0, bombs: 0, chambers: 1, moving: false }, seed);
    if (level <= 30) return this.make(level, { pins: 4, colorBalls: 8, grayBalls: 4, bombs: 0, chambers: 1, moving: false }, seed);
    if (level <= 60) return this.make(level, { pins: 4, colorBalls: 9, grayBalls: 6, bombs: 2, chambers: 1, moving: false }, seed);
    return this.make(level, { pins: 6, colorBalls: 12, grayBalls: 8, bombs: 3, chambers: 2, moving: true }, seed);
  }

  static make(level, cfg, seed) {
    const w = 900, h = 580;
    const pins = [];
    const balls = [];
    const walls = [];
    const platforms = [];
    for (let i = 0; i < cfg.pins; i++) {
      const y = 120 + i * (360 / cfg.pins);
      const x = 120 + rand(seed + i) * 500 + (i % 2 ? 120 : 0);
      pins.push({ id: i, x, y, width: 190 - (i % 3) * 20, removed: false });
    }
    for (let i = 0; i < cfg.colorBalls; i++) balls.push({ x: 150 + (i % 6) * 28, y: 20 + Math.floor(i / 6) * 24, type: 'color' });
    for (let i = 0; i < cfg.grayBalls; i++) balls.push({ x: 470 + (i % 5) * 28, y: 24 + Math.floor(i / 5) * 24, type: 'gray' });
    for (let i = 0; i < cfg.bombs; i++) balls.push({ x: 650 + i * 30, y: 30, type: 'bomb' });

    if (cfg.chambers > 1) {
      walls.push({ x: 450, y: 0, width: 14, height: 460 });
      pins.push({ id: pins.length, x: 425, y: 300, width: 100, removed: false });
    }
    if (level >= 30) walls.push({ x: 300, y: 250, width: 120, height: 10 });
    if (cfg.moving) platforms.push({ x: 230, y: 360, width: 130, height: 12, range: 160, speed: 1.2, dir: 1 });

    return { width: w, height: h, pins, balls, walls, platforms, container: { x: 180, y: 505, width: 540, height: 65 } };
  }

  static daily(level) {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return this.generate(level, Number(date));
  }
}
