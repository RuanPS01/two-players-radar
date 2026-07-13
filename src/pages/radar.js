import { navigate } from '../router.js';
import { RadarSync } from '../radar-sync.js';
import { BeepEngine } from '../audio.js';
import { applyStatus } from './status.js';
import { LEVELS, LEVEL_COLORS, MAX_LEVEL } from '../levels.js';

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
            <span class="radar-core__fill" id="core-fill"></span>
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
  const coreFill = app.querySelector('#core-fill');
  const caption = app.querySelector('#caption');
  const statusEl = app.querySelector('#status');
  const overlay = app.querySelector('#overlay');

  // Cada apito gera um anel expandindo a partir do centro.
  engine.onBeep = () => spawnRing(grid);
  engine.onContinuous = (on) => {
    stage.classList.toggle('is-continuous', on);
  };

  function applyLevel(level) {
    const lvl = LEVELS[level];
    const accent = LEVEL_COLORS[level];
    screen.style.setProperty('--accent', accent);
    // A intensidade e comunicada apenas pelo tamanho do circulo preenchido
    // (dentro do nucleo) e pelo som -- sem numero nem palavra na tela.
    coreFill.style.setProperty('--fill', (level / MAX_LEVEL).toFixed(3));
    caption.textContent = '';
    stage.classList.toggle('is-silent', lvl.kind === 'silent');
    engine.setLevel(level);
  }

  sync.onLevel = (level) => {
    applyLevel(level);
  };
  sync.onStatus = (s) => applyStatus(statusEl, s);
  sync.connect();

  // Libera o audio a partir do gesto do usuario (politica de autoplay).
  async function start() {
    await engine.unlock();
    overlay.classList.add('is-hidden');
  }
  app.querySelector('#btn-start').addEventListener('click', start);
  app.querySelector('#btn-back').addEventListener('click', () => navigate('/'));

  // Estado inicial (visual) enquanto nao chega sinal: silencio, circulo minimo.
  stage.classList.add('is-silent');
  coreFill.style.setProperty('--fill', (1 / MAX_LEVEL).toFixed(3));

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
