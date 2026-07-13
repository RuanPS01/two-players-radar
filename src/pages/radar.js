import { navigate } from '../router.js';
import { RadarSync } from '../radar-sync.js';
import { BeepEngine } from '../audio.js';
import { applyStatus } from './status.js';
import { LEVELS, LEVEL_COLORS } from '../levels.js';

// Tela do ouvinte: escuta os apitos e ve o pulso do radar controlado por outra pessoa.
export function renderRadar(app, radarName) {
  app.innerHTML = `
    <main class="screen radar" id="radar-screen" style="--accent:${LEVEL_COLORS[1]}">
      <header class="topbar topbar--over">
        <button class="icon-btn" id="btn-back" type="button" title="Voltar">‹ Voltar</button>
        <div class="topbar__title">
          <span class="topbar__label">Usando</span>
          <strong class="topbar__name">${escapeHtml(radarName)}</strong>
        </div>
        <span class="status-pill" id="status">Conectando...</span>
      </header>

      <div class="radar-stage" id="stage">
        <div class="radar-grid" id="grid">
          <span class="radar-ring-static"></span>
          <span class="radar-ring-static"></span>
          <span class="radar-ring-static"></span>
          <span class="radar-cross radar-cross--h"></span>
          <span class="radar-cross radar-cross--v"></span>
          <span class="radar-sweep"></span>
          <div class="radar-core" id="core">
            <span class="radar-core__level" id="core-level">1</span>
            <span class="radar-core__name" id="core-name">Aguardando controlador...</span>
          </div>
        </div>
      </div>

      <div class="radar-caption" id="caption">Aguardando sinal do controlador.</div>

      <div class="audio-overlay" id="overlay">
        <div class="audio-overlay__inner">
          <div class="audio-overlay__icon">🔊</div>
          <h2>Ativar radar</h2>
          <p>Toque para ligar o som e comecar a escutar os apitos.</p>
          <button class="btn btn-primary" id="btn-start" type="button">Ativar</button>
        </div>
      </div>
    </main>
  `;

  const engine = new BeepEngine();
  const sync = new RadarSync(radarName);

  const screen = app.querySelector('#radar-screen');
  const stage = app.querySelector('#stage');
  const grid = app.querySelector('#grid');
  const core = app.querySelector('#core');
  const coreLevel = app.querySelector('#core-level');
  const coreName = app.querySelector('#core-name');
  const caption = app.querySelector('#caption');
  const statusEl = app.querySelector('#status');
  const overlay = app.querySelector('#overlay');

  let hasSignal = false;
  let currentLevel = 1;

  // Cada apito gera um anel expandindo a partir do centro.
  engine.onBeep = () => spawnRing(grid);
  engine.onContinuous = (on) => {
    stage.classList.toggle('is-continuous', on);
  };

  function applyLevel(level) {
    currentLevel = level;
    const lvl = LEVELS[level];
    const accent = LEVEL_COLORS[level];
    screen.style.setProperty('--accent', accent);
    coreLevel.textContent = level;
    coreName.textContent = lvl.name;
    caption.textContent = `Nivel ${level} — ${lvl.desc}`;
    stage.classList.toggle('is-silent', lvl.kind === 'silent');
    engine.setLevel(level);
  }

  sync.onLevel = (level) => {
    hasSignal = true;
    applyLevel(level);
  };
  sync.onStatus = (s) => applyStatus(statusEl, s);
  sync.connect();

  // Libera o audio a partir do gesto do usuario (politica de autoplay).
  async function start() {
    await engine.unlock();
    overlay.classList.add('is-hidden');
    if (!hasSignal) {
      coreName.textContent = 'Aguardando controlador...';
    }
  }
  app.querySelector('#btn-start').addEventListener('click', start);
  app.querySelector('#btn-back').addEventListener('click', () => navigate('/'));

  // Estado inicial (visual) enquanto nao chega sinal.
  stage.classList.add('is-silent');

  return () => {
    engine.stop();
    sync.disconnect();
  };
}

function spawnRing(grid) {
  const ring = document.createElement('span');
  ring.className = 'radar-ping';
  grid.appendChild(ring);
  ring.addEventListener('animationend', () => ring.remove());
  // fallback caso o evento nao dispare
  setTimeout(() => ring.remove(), 1400);
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c]);
}
