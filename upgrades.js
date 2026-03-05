export const UPGRADE_DEFS = {
  ballMultiplier: { name: 'Ball Multiplier', baseCost: 40, factor: 1.6, desc: '+1 reward per collected ball' },
  coinMultiplier: { name: 'Coin Multiplier', baseCost: 80, factor: 1.7, desc: '+20% all coin rewards' },
  autoPinPuller: { name: 'Auto Pin Puller', baseCost: 120, factor: 1.8, desc: 'Automatically pulls safe pins' },
  hintGenerator: { name: 'Hint Generator', baseCost: 100, factor: 1.75, desc: 'Highlights likely correct pin' },
  offlineEarnings: { name: 'Offline Earnings', baseCost: 60, factor: 1.65, desc: '+15% offline coin claim' },
  ballDropSpeed: { name: 'Ball Drop Speed', baseCost: 70, factor: 1.6, desc: '+15% physics speed' },
  puzzleSkip: { name: 'Puzzle Skip', baseCost: 200, factor: 2, desc: '+1 usable skip charge' }
};

export const BUILDING_DEFS = {
  factory: { name: 'Factory', baseCost: 50, cps: 1 },
  mine: { name: 'Mine', baseCost: 250, cps: 5 },
  lab: { name: 'Lab', baseCost: 600, cps: 10 }
};

export class UpgradeSystem {
  constructor(state, audio) { this.state = state; this.audio = audio; }
  getUpgradeCost(id) {
    const lvl = this.state.upgrades[id] || 0;
    const d = UPGRADE_DEFS[id];
    return Math.floor(d.baseCost * Math.pow(d.factor, lvl));
  }
  buyUpgrade(id) {
    const cost = this.getUpgradeCost(id);
    if (this.state.coins < cost) return false;
    this.state.coins -= cost;
    this.state.upgrades[id]++;
    if (id === 'puzzleSkip') this.state.skips++;
    this.audio.play('upgrade');
    return true;
  }

  getBuildingCost(id) {
    const lvl = this.state.buildings[id].level;
    return Math.floor(BUILDING_DEFS[id].baseCost * Math.pow(1.55, lvl));
  }
  buyBuilding(id) {
    const cost = this.getBuildingCost(id);
    if (this.state.coins < cost) return false;
    this.state.coins -= cost;
    this.state.buildings[id].level++;
    this.audio.play('upgrade');
    return true;
  }

  getCoinMultiplier() { return 1 + this.state.upgrades.coinMultiplier * 0.2; }
  getBallBonus() { return this.state.upgrades.ballMultiplier; }
  getDropSpeedMult() { return 1 + this.state.upgrades.ballDropSpeed * 0.15; }
  idlePerSec() {
    return Object.entries(BUILDING_DEFS).reduce((sum, [id, d]) => sum + this.state.buildings[id].level * d.cps, 0);
  }
}
