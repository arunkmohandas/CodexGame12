import { UPGRADE_DEFS, BUILDING_DEFS } from './upgrades.js';

export class UIManager {
  constructor(game) {
    this.game = game;
    this.toastEl = document.getElementById('toast');
    this.bindNavigation();
  }

  bindNavigation() {
    document.querySelectorAll('[data-screen]').forEach(btn => btn.addEventListener('click', () => this.showScreen(btn.dataset.screen)));
    document.getElementById('menuBtn').addEventListener('click', () => this.showScreen('mainMenu'));
    document.getElementById('upgradeShortcutBtn').addEventListener('click', () => this.showScreen('upgradeScreen'));
  }

  showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    this.refreshPanels();
  }

  refreshTop() {
    document.getElementById('coinDisplay').textContent = `🪙 ${Math.floor(this.game.state.coins)}`;
    document.getElementById('levelDisplay').textContent = `Level ${this.game.state.level}`;
  }

  renderUpgrades() {
    const wrap = document.getElementById('upgradeCards');
    wrap.innerHTML = '';
    Object.keys(UPGRADE_DEFS).forEach(id => {
      const def = UPGRADE_DEFS[id];
      const lvl = this.game.state.upgrades[id];
      const c = this.game.upgrades.getUpgradeCost(id);
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `<h4>${def.name} Lv.${lvl}</h4><p>${def.desc}</p><p>Cost: ${c}</p><button>Buy</button>`;
      card.querySelector('button').onclick = () => this.game.buyUpgrade(id);
      wrap.appendChild(card);
    });
  }

  renderBuildings() {
    const wrap = document.getElementById('buildingCards');
    wrap.innerHTML = '';
    Object.keys(BUILDING_DEFS).forEach(id => {
      const def = BUILDING_DEFS[id];
      const lvl = this.game.state.buildings[id].level;
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `<h4>${def.name} Lv.${lvl}</h4><p>+${def.cps} coin/sec each</p><p>Cost: ${this.game.upgrades.getBuildingCost(id)}</p><button>Build</button>`;
      card.querySelector('button').onclick = () => this.game.buyBuilding(id);
      wrap.appendChild(card);
    });
    document.getElementById('incomeInfo').textContent = `Passive Income: ${this.game.upgrades.idlePerSec().toFixed(1)} coin/sec`;
  }

  renderStats() {
    const s = this.game.state.stats;
    const items = [
      `Levels completed: ${s.levelsCompleted}`,
      `Total coins earned: ${Math.floor(s.totalCoinsEarned)}`,
      `Total balls dropped: ${s.totalBallsDropped}`,
      `Play time: ${Math.floor(s.playTime)} sec`,
      `Achievements: ${s.achievements.join(', ') || 'None yet'}`,
      `Skins unlocked: ${this.game.state.skins.join(', ')}`,
      `Skips available: ${this.game.state.skips}`
    ];
    document.getElementById('statsList').innerHTML = items.map(i => `<li>${i}</li>`).join('');
  }

  refreshPanels() {
    this.refreshTop();
    this.renderUpgrades();
    this.renderBuildings();
    this.renderStats();
    document.getElementById('audioToggle').checked = this.game.state.audio;
    document.getElementById('themeToggle').checked = this.game.state.theme === 'dark';
  }

  toast(msg) {
    this.toastEl.textContent = msg;
    this.toastEl.classList.add('show');
    setTimeout(() => this.toastEl.classList.remove('show'), 1300);
  }

  showLevelComplete(coins, balls) {
    document.getElementById('levelResult').textContent = `Earned ${Math.floor(coins)} coins, collected ${balls} balls.`;
    document.getElementById('levelCompleteModal').classList.remove('hidden');
  }

  hideModal() { document.getElementById('levelCompleteModal').classList.add('hidden'); }
}
