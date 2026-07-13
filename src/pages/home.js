import { navigate } from '../router.js';

// Tela inicial: define o nome do radar e escolhe entre usar ou controlar.
export function renderHome(app) {
  app.innerHTML = `
    <main class="screen home">
      <div class="home-card">
        <div class="radar-badge" aria-hidden="true">
          <span class="radar-badge__ring"></span>
          <span class="radar-badge__ring"></span>
          <span class="radar-badge__dot"></span>
        </div>
        <h1>Radar de Proximidade</h1>
        <p class="subtitle">
          Um controla a intensidade dos apitos, o outro escuta e ve o pulso em tempo real.
        </p>

        <label class="field">
          <span class="field__label">Nome do radar</span>
          <input
            id="radar-name"
            type="text"
            inputmode="text"
            autocomplete="off"
            autocapitalize="none"
            spellcheck="false"
            placeholder="ex: sala-de-estar"
            maxlength="40"
          />
        </label>
        <p class="hint" id="hint">&nbsp;</p>

        <div class="actions">
          <button id="btn-use" class="btn btn-primary" type="button">
            <span class="btn__icon">🎧</span> Usar radar
          </button>
          <button id="btn-control" class="btn btn-secondary" type="button">
            <span class="btn__icon">🎚️</span> Controlar radar
          </button>
        </div>

        <p class="tip">
          As duas pessoas devem usar <strong>exatamente o mesmo nome</strong> de radar
          para se conectarem.
        </p>
      </div>
      <footer class="home-foot">
        Radar ficticio &middot; feito para brincar &middot; sincroniza via MQTT
      </footer>
    </main>
  `;

  const input = app.querySelector('#radar-name');
  const hint = app.querySelector('#hint');

  const last = localStorage.getItem('radar:lastName');
  if (last) input.value = last;

  function go(kind) {
    const name = input.value.trim();
    if (!name) {
      hint.textContent = 'Digite um nome para o radar.';
      hint.classList.add('hint--error');
      input.focus();
      return;
    }
    localStorage.setItem('radar:lastName', name);
    navigate(`/${kind}/${encodeURIComponent(name)}`);
  }

  input.addEventListener('input', () => {
    hint.textContent = ' ';
    hint.classList.remove('hint--error');
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') go('radar');
  });
  app.querySelector('#btn-use').addEventListener('click', () => go('radar'));
  app.querySelector('#btn-control').addEventListener('click', () => go('control'));

  setTimeout(() => input.focus(), 50);

  return () => {};
}
