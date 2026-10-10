import { describe, expect, it } from 'vitest';
import {
  EMPTY, FEAT_MIN, PEACH, WILD, addPeaches, evaluate, lineSymbol, playFeature, seededRng,
} from './engine';
import { simulate } from './simulate';

describe('linhas', () => {
  it('curinga completa a linha', () => {
    expect(lineSymbol([0, WILD, 0, 1, 2, 3, 4, 5, 6], [0, 1, 2])).toBe(0);
  });
  it('Happeach só paga com 3 na linha e não aceita curinga', () => {
    expect(lineSymbol([PEACH, PEACH, PEACH, 0, 0, 0, 0, 0, 0], [0, 1, 2])).toBe(PEACH);
    expect(lineSymbol([PEACH, WILD, PEACH, 0, 0, 0, 0, 0, 0], [0, 1, 2])).toBe(-1);
  });
  it('casa vazia da Rodada Especial não fecha linha', () => {
    expect(lineSymbol([0, EMPTY, 0, 0, 0, 0, 0, 0, 0], [0, 1, 2])).toBe(-1);
  });
  it('tela cheia multiplica por 10', () => {
    const r = evaluate(Array(9).fill(0), 1);
    expect(r.full).toBe(true);
    expect(r.lines).toHaveLength(5);
    expect(r.win).toBe(95); // 5 linhas × (5/5 × 1,9) × 10
  });
});

describe('cesta de Happeach', () => {
  it('abre a Rodada Especial em 5 e guarda o excedente', () => {
    expect(addPeaches(4, 2)).toEqual({ basket: 5, feature: true, carry: 1 });
    expect(addPeaches(1, 1)).toEqual({ basket: 2, feature: false, carry: 0 });
  });
});

describe('Rodada Especial', () => {
  it('nunca paga menos que o mínimo', () => {
    const rng = seededRng(7);
    for (let i = 0; i < 2000; i++) expect(playFeature(rng, 10).result.win).toBeGreaterThanOrEqual(10 * FEAT_MIN);
  });
});

// Trava de segurança da matemática (MANUAL §3): rode antes de mexer em qualquer constante.
describe('balanço (500 mil giros)', () => {
  const s = simulate(seededRng(20261009), 500_000);
  it('RTP entre 96% e 99%', () => {
    expect(s.rtp).toBeGreaterThan(0.96);
    expect(s.rtp).toBeLessThan(0.99);
  });
  it('acerto de pelo menos 20%', () => {
    expect(s.hitRate).toBeGreaterThanOrEqual(0.2);
  });
  it('Rodada Especial entre 1 a cada 50 e 1 a cada 100 giros', () => {
    expect(s.spinsPerFeature).toBeGreaterThan(50);
    expect(s.spinsPerFeature).toBeLessThan(100);
  });
});
