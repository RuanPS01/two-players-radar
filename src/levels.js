// Definicao dos 5 niveis do radar.
// - nivel 1: silencio (radar em repouso)
// - niveis 2..4: apitos sequenciais cada vez mais rapidos (menor "interval")
// - nivel 5: apito continuo, sem pausa
//
// `interval` = tempo em milissegundos entre o inicio de cada apito (0 quando nao ha apitos sequenciais).
// `kind`     = como o motor de audio/visual deve se comportar.
export const LEVELS = {
  1: { name: 'Silencio', short: 'Repouso', desc: 'Radar em repouso, sem apitos.', interval: 0, kind: 'silent' },
  2: { name: 'Lento', short: 'Apitos lentos', desc: 'Apitos espacados. Alvo distante.', interval: 1050, kind: 'beep' },
  3: { name: 'Moderado', short: 'Apitos moderados', desc: 'Apitos sequenciais moderados.', interval: 680, kind: 'beep' },
  4: { name: 'Rapido', short: 'Apitos rapidos', desc: 'Apitos rapidos. Alvo se aproximando.', interval: 420, kind: 'beep' },
  5: { name: 'Muito rapido', short: 'Apitos muito rapidos', desc: 'Apitos muito rapidos. Alvo bem perto.', interval: 220, kind: 'beep' },
  6: { name: 'Continuo', short: 'Apito continuo', desc: 'Apito continuo, sem pausa. Alvo colado.', interval: 0, kind: 'continuous' },
};

// Cor de destaque por nivel (frio -> quente conforme a intensidade sobe).
export const LEVEL_COLORS = {
  1: '#4a5b6b',
  2: '#22c17b',
  3: '#8fd14f',
  4: '#e6c02e',
  5: '#f0842a',
  6: '#f0402e',
};

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 6;

export function clampLevel(n) {
  n = parseInt(n, 10);
  if (Number.isNaN(n)) return MIN_LEVEL;
  return Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, n));
}
