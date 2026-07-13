import { navigate } from '../router.js';
import { RadarSync } from '../radar-sync.js';
import { applyStatus } from './status.js';
import { LEVELS, LEVEL_COLORS, MIN_LEVEL, MAX_LEVEL } from '../levels.js';

// Tela do controlador: escolhe o nivel de apito e publica para o radar.
export function renderControl(app, radarName) {
  const buttons = Object.keys(LEVELS)
    .map((n) => {
      const lvl = LEVELS[n];
      return `
        <button class="level-btn" type="button" data-level="${n}" style="--accent:${LEVEL_COLORS[n]}">
          <span class="level-btn__num">${n}</span>
          <span class="level-btn__text">
            <span class="level-btn__name">${lvl.name}</span>
            <span class="level-btn__desc">${lvl.desc}</span>
          </span>
        </button>`;
    })
    .join('');

  app.innerHTML = `
    <main class="screen control">
      <header class="topbar">
        <button class="icon-btn" id="btn-back" type="button" title="Voltar">‹ Voltar</button>
        <div class="topbar__title">
          <span class="topbar__label">Controlando</span>
          <strong class="topbar__name">${escapeHtml(radarName)}</strong>
        </div>
        <span class="status-pill" id="status">Conectando...</span>
      </header>

      <section class="control-body">
        <div class="control-readout" id="readout" style="--accent:${LEVEL_COLORS[MIN_LEVEL]}">
          <span class="control-readout__pulse" id="ctrl-pulse"></span>
          <span class="control-readout__level" id="readout-level">1</span>
          <span class="control-readout__name" id="readout-name">${LEVELS[MIN_LEVEL].name}</span>
        </div>

        <div class="levels" role="group" aria-label="Niveis do radar">
          ${buttons}
        </div>

        <div class="stepper">
          <button class="btn btn-ghost" id="btn-down" type="button">− Diminuir</button>
          <button class="btn btn-ghost" id="btn-up" type="button">Aumentar +</button>
        </div>

        <p class="tip tip--center">
          O nivel escolhido e enviado na hora para quem estiver <strong>usando</strong>
          o radar "<strong>${escapeHtml(radarName)}</strong>".
        </p>
      </section>
    </main>
  `;

  const sync = new RadarSync(radarName);
  const statusEl = app.querySelector('#status');
  const readout = app.querySelector('#readout');
  const readoutLevel = app.querySelector('#readout-level');
  const readoutName = app.querySelector('#readout-name');
  const ctrlPulse = app.querySelector('#ctrl-pulse');
  const levelBtns = Array.from(app.querySelectorAll('.level-btn'));

  let current = MIN_LEVEL;
  let pulseTimer = null;

  function paint() {
    const lvl = LEVELS[current];
    const accent = LEVEL_COLORS[current];
    readout.style.setProperty('--accent', accent);
    readoutLevel.textContent = current;
    readoutName.textContent = lvl.name;
    readout.classList.toggle('is-silent', lvl.kind === 'silent');
    readout.classList.toggle('is-continuous', lvl.kind === 'continuous');

    levelBtns.forEach((b) => {
      b.classList.toggle('is-active', Number(b.dataset.level) === current);
    });

    // Feedback visual do "envio" no controlador (sem som).
    if (pulseTimer) {
      clearInterval(pulseTimer);
      pulseTimer = null;
    }
    ctrlPulse.classList.remove('pulsing', 'continuous');
    if (lvl.kind === 'beep') {
      const fire = () => {
        ctrlPulse.classList.remove('pulsing');
        void ctrlPulse.offsetWidth; // reinicia a animacao
        ctrlPulse.classList.add('pulsing');
      };
      fire();
      pulseTimer = setInterval(fire, lvl.interval);
    } else if (lvl.kind === 'continuous') {
      ctrlPulse.classList.add('continuous');
    }
  }

  function setLevel(n) {
    const next = Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, n));
    current = next;
    paint();
    sync.publishLevel(current);
  }

  levelBtns.forEach((b) => {
    b.addEventListener('click', () => setLevel(Number(b.dataset.level)));
  });
  app.querySelector('#btn-up').addEventListener('click', () => setLevel(current + 1));
  app.querySelector('#btn-down').addEventListener('click', () => setLevel(current - 1));
  app.querySelector('#btn-back').addEventListener('click', () => navigate('/'));

  window.addEventListener('keydown', onKey);
  function onKey(e) {
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') setLevel(current + 1);
    else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') setLevel(current - 1);
    else if (e.key >= '1' && e.key <= '6') setLevel(Number(e.key));
  }

  sync.onStatus = (s) => applyStatus(statusEl, s);
  // Ao conectar, publica o estado atual para que ouvintes ja o recebam.
  sync.onConnected = () => sync.publishLevel(current);
  sync.connect();

  paint();

  // cleanup
  return () => {
    window.removeEventListener('keydown', onKey);
    if (pulseTimer) clearInterval(pulseTimer);
    sync.disconnect();
  };
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
