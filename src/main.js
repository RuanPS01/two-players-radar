import './style.css';
import { parseRoute } from './router.js';
import { renderHome } from './pages/home.js';
import { renderRadar } from './pages/radar.js';
import { renderControl } from './pages/control.js';

const app = document.getElementById('app');
let cleanup = null;

function render() {
  // Encerra a tela anterior (desconecta MQTT, para o audio, etc).
  if (typeof cleanup === 'function') {
    cleanup();
    cleanup = null;
  }
  app.innerHTML = '';

  const route = parseRoute();
  if (route.page === 'radar') {
    cleanup = renderRadar(app, route.name);
  } else if (route.page === 'control') {
    cleanup = renderControl(app, route.name);
  } else {
    cleanup = renderHome(app);
  }
}

window.addEventListener('hashchange', render);
render();
