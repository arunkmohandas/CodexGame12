const KEY = 'pinfall_incremental_save_v1';

export class SaveSystem {
  static defaults() {
    return {
      coins: 0,
      level: 1,
      skins: ['classic'],
      selectedSkin: 'classic',
      theme: 'light',
      audio: true,
      skips: 0,
      upgrades: {
        ballMultiplier: 0,
        coinMultiplier: 0,
        autoPinPuller: 0,
        hintGenerator: 0,
        offlineEarnings: 0,
        ballDropSpeed: 0,
        puzzleSkip: 0
      },
      buildings: {
        factory: { level: 0 },
        mine: { level: 0 },
        lab: { level: 0 }
      },
      stats: {
        levelsCompleted: 0,
        totalCoinsEarned: 0,
        totalBallsDropped: 0,
        playTime: 0,
        achievements: []
      },
      lastSeen: Date.now(),
      dailySeedDate: ''
    };
  }

  static load() {
    const raw = localStorage.getItem(KEY);
    if (!raw) return this.defaults();
    try {
      return { ...this.defaults(), ...JSON.parse(raw) };
    } catch {
      return this.defaults();
    }
  }

  static save(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }
}
