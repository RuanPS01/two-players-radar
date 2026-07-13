import { LEVELS, clampLevel } from './levels.js';

// Motor de apitos do radar.
//
// Gera o som via Web Audio API (osciladores), sem depender de arquivos.
// A parte VISUAL e desacoplada do audio: o agendamento dos apitos roda
// sempre (disparando `onBeep`/`onContinuous`), mas o som so e emitido depois
// que `unlock()` for chamado a partir de um gesto do usuario -- exigencia
// das politicas de autoplay dos navegadores.
export class BeepEngine {
  constructor() {
    this.ctx = null;
    this.audioReady = false;
    this.level = 1;
    this.timer = null;
    this.continuousOsc = null;
    this.continuousGain = null;

    // Callbacks para a camada visual:
    this.onBeep = null; // () => void        -> disparado a cada apito
    this.onContinuous = null; // (on:bool)=>  -> entra/sai do modo continuo
  }

  // Deve ser chamado dentro de um gesto do usuario (click/touch) para
  // liberar o audio. Reaplica o nivel atual ja com som.
  async unlock() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    this.audioReady = true;
    this.restart();
  }

  setLevel(level) {
    this.level = clampLevel(level);
    this.restart();
  }

  // (Re)aplica o comportamento do nivel atual.
  restart() {
    this._clearTimer();
    this._stopContinuous();

    const cfg = LEVELS[this.level];
    if (this.onContinuous) this.onContinuous(cfg.kind === 'continuous');

    if (cfg.kind === 'silent') return;

    if (cfg.kind === 'continuous') {
      this._startContinuous();
      return;
    }

    // Apitos sequenciais: dispara um imediatamente e agenda os proximos.
    this._tick();
    this.timer = setInterval(() => this._tick(), cfg.interval);
  }

  _tick() {
    if (this.onBeep) this.onBeep();
    if (this.audioReady) this._playBeep();
  }

  _playBeep() {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 1850;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  _startContinuous() {
    if (!this.audioReady) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 1850;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(now);
    this.continuousOsc = osc;
    this.continuousGain = gain;
  }

  _stopContinuous() {
    if (this.continuousOsc) {
      try {
        const now = this.ctx ? this.ctx.currentTime : 0;
        if (this.continuousGain && this.ctx) {
          this.continuousGain.gain.cancelScheduledValues(now);
          this.continuousGain.gain.setValueAtTime(this.continuousGain.gain.value, now);
          this.continuousGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
        }
        this.continuousOsc.stop((this.ctx ? this.ctx.currentTime : 0) + 0.06);
      } catch {
        /* oscilador ja parado */
      }
      this.continuousOsc = null;
      this.continuousGain = null;
    }
  }

  _clearTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  stop() {
    this._clearTimer();
    this._stopContinuous();
  }
}
