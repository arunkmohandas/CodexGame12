import { SaveSystem } from './save.js';
import { UpgradeSystem } from './upgrades.js';
import { UIManager } from './ui.js';
import { GameManager, AudioManager } from './game.js';
import { LevelGenerator } from './levels.js';

const state = SaveSystem.load();
const audio = new AudioManager(state);
const upgrades = new UpgradeSystem(state, audio);
const ui = new UIManager({ state, upgrades, buyUpgrade, buyBuilding });
const game = new GameManager(state, upgrades, ui);
ui.game = { state, upgrades, buyUpgrade, buyBuilding };

function buyUpgrade(id) {
  if (!upgrades.buyUpgrade(id)) return ui.toast('Not enough coins');
  ui.toast('Upgrade purchased');
  ui.refreshPanels();
}

function buyBuilding(id) {
  if (!upgrades.buyBuilding(id)) return ui.toast('Not enough coins');
  ui.toast('Building improved');
  ui.refreshPanels();
}

function setupSettings() {
  document.getElementById('audioToggle').onchange = (e) => { state.audio = e.target.checked; };
  document.getElementById('themeToggle').onchange = (e) => {
    state.theme = e.target.checked ? 'dark' : 'light';
    document.body.classList.toggle('dark', state.theme === 'dark');
  };
}

function applyTheme() { document.body.classList.toggle('dark', state.theme === 'dark'); }

function claimOffline() {
  const now = Date.now();
  const elapsed = Math.min(60 * 60 * 8, Math.floor((now - state.lastSeen) / 1000));
  const mult = 1 + state.upgrades.offlineEarnings * 0.15;
  const gain = elapsed * upgrades.idlePerSec() * mult;
  if (gain > 1) {
    state.coins += gain;
    state.stats.totalCoinsEarned += gain;
    ui.toast(`Offline earnings +${Math.floor(gain)} coins`);
  }
  state.lastSeen = now;
}

function idleTick() {
  const gain = upgrades.idlePerSec() / 5;
  if (gain > 0) {
    state.coins += gain;
    state.stats.totalCoinsEarned += gain;
  }
  ui.refreshTop();
}

function dailyPuzzleNote() {
  const today = new Date().toISOString().slice(0, 10);
  if (state.dailySeedDate !== today) {
    state.dailySeedDate = today;
    const sample = LevelGenerator.daily(state.level);
    if (sample.pins.length >= 4) ui.toast('Daily puzzle refreshed!');
  }
}

document.getElementById('continueBtn').onclick = () => { ui.showScreen('puzzleScreen'); game.loadLevel(); };
setupSettings();
applyTheme();
claimOffline();
dailyPuzzleNote();
game.init();
ui.refreshPanels();

setInterval(idleTick, 200);
setInterval(() => SaveSystem.save(state), 1500);
window.addEventListener('beforeunload', () => { state.lastSeen = Date.now(); SaveSystem.save(state); });

window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 's' && state.skips > 0) {
    state.skips--;
    state.level++;
    game.loadLevel();
    ui.toast('Puzzle skipped');
  }
  if (e.key.toLowerCase() === 'k') {
    const all = ['classic', 'striped', 'neon'];
    const idx = all.indexOf(state.selectedSkin);
    state.selectedSkin = all[(idx + 1) % all.length];
    ui.toast(`Skin: ${state.selectedSkin}`);
    game.renderLevel();
  }
});
