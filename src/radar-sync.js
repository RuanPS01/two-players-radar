import mqtt from 'mqtt';
import { clampLevel } from './levels.js';
import { resolveBroker } from './config.js';

// Camada de sincronizacao em tempo real.
//
// Abordagem escolhida: MQTT sobre WebSocket usando um broker publico.
// Motivos:
//   - O GitHub Pages e hospedagem estatica (sem backend), entao um servidor
//     WebSocket proprio nao e possivel sem outro host.
//   - Um broker MQTT publico funciona direto do navegador, sem cadastro nem
//     credenciais, e o modelo pub/sub encaixa perfeitamente na ideia:
//     o NOME DO RADAR vira o topico, isolando cada radar dos demais.
//   - Mensagens "retained" fazem um ouvinte que acabou de entrar receber
//     imediatamente o ultimo nivel publicado pelo controlador.
//
// Para trocar de broker (ou migrar para outra solucao), ajuste DEFAULT_BROKER
// em config.js, use ?broker=... na URL, ou passe { broker } no construtor.
// Veja o README para como migrar para Firebase Realtime Database, se desejar
// mais privacidade.
const TOPIC_PREFIX = 'two-players-radar';

// Monta o topico a partir do nome do radar, normalizando para evitar
// caracteres invalidos e diferencas de maiuscula/minuscula.
export function topicFor(radarName) {
  const safe = String(radarName)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'radar';
  return `${TOPIC_PREFIX}/${safe}/level`;
}

export class RadarSync {
  constructor(radarName, { broker = resolveBroker() } = {}) {
    this.radarName = radarName;
    this.broker = broker;
    this.topic = topicFor(radarName);
    this.client = null;

    // Callbacks (definidos por quem usa a classe):
    this.onLevel = null; // (level:number) => void  -> novo nivel recebido
    this.onStatus = null; // (status:string) => void -> 'connecting'|'connected'|'offline'|'error'
    this.onConnected = null; // () => void            -> conexao estabelecida
  }

  connect() {
    this._emitStatus('connecting');
    const clientId = `${TOPIC_PREFIX}-${Math.random().toString(16).slice(2, 10)}`;

    this.client = mqtt.connect(this.broker, {
      clientId,
      clean: true,
      keepalive: 30,
      connectTimeout: 8000,
      reconnectPeriod: 2500,
    });

    this.client.on('connect', () => {
      this._emitStatus('connected');
      this.client.subscribe(this.topic, { qos: 1 });
      if (this.onConnected) this.onConnected();
    });
    this.client.on('reconnect', () => this._emitStatus('connecting'));
    this.client.on('close', () => this._emitStatus('offline'));
    this.client.on('offline', () => this._emitStatus('offline'));
    this.client.on('error', () => this._emitStatus('error'));

    this.client.on('message', (topic, payload) => {
      if (topic !== this.topic) return;
      const level = clampLevel(payload.toString());
      if (this.onLevel) this.onLevel(level);
    });
  }

  // Publica o nivel como mensagem retida, para que novos ouvintes recebam
  // o estado atual assim que se conectarem.
  publishLevel(level) {
    if (!this.client || !this.client.connected) return;
    this.client.publish(this.topic, String(clampLevel(level)), { qos: 1, retain: true });
  }

  get connected() {
    return !!(this.client && this.client.connected);
  }

  disconnect() {
    if (this.client) {
      this.client.end(true);
      this.client = null;
    }
  }

  _emitStatus(status) {
    if (this.onStatus) this.onStatus(status);
  }
}
