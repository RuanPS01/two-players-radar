// Broker MQTT padrao (publico, sem cadastro). Funciona direto do navegador.
export const DEFAULT_BROKER = 'wss://broker.emqx.io:8084/mqtt';

// Permite trocar o broker em tempo de execucao, sem rebuild:
//   1. via query string:   ?broker=wss://seu-broker:porta/mqtt
//   2. via localStorage:   localStorage.setItem('radar:broker', 'wss://...')
// Util para usar um broker proprio/privado ou um broker local em testes.
export function resolveBroker() {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get('broker');
    if (fromQuery) {
      localStorage.setItem('radar:broker', fromQuery);
      return fromQuery;
    }
    const fromStorage = localStorage.getItem('radar:broker');
    if (fromStorage) return fromStorage;
  } catch {
    /* ambiente sem window/localStorage */
  }
  return DEFAULT_BROKER;
}
