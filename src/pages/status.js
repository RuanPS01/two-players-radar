// Traducao dos estados de conexao MQTT para rotulo + classe CSS.
const STATUS_MAP = {
  connecting: { label: 'Conectando...', cls: 'is-connecting' },
  connected: { label: 'Conectado', cls: 'is-connected' },
  offline: { label: 'Offline', cls: 'is-offline' },
  error: { label: 'Erro de conexao', cls: 'is-error' },
};

export function applyStatus(pillEl, status) {
  const info = STATUS_MAP[status] || STATUS_MAP.connecting;
  pillEl.textContent = info.label;
  pillEl.className = `status-pill ${info.cls}`;
}
