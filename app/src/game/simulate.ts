import { addPeaches, evaluate, playFeature, spinGrid, type Rng } from './engine';

export interface SimStats {
  spins: number;
  rtp: number;
  baseRtp: number;
  hitRate: number;
  features: number;
  spinsPerFeature: number;
  avgFeatureMult: number;
}

/** Joga `spins` giros pagos com aposta 1, seguindo a cesta de Happeach e a Rodada Especial como o jogo faz. */
export function simulate(rng: Rng, spins: number): SimStats {
  let base = 0, feat = 0, hits = 0, features = 0, basket = 0;
  for (let n = 0; n < spins; n++) {
    const res = evaluate(spinGrid(rng), 1);
    base += res.win;
    if (res.win > 0) hits++;
    if (res.peach.length) {
      const b = addPeaches(basket, res.peach.length);
      basket = b.basket;
      if (b.feature) {
        features++;
        feat += playFeature(rng, 1).result.win;
        basket = b.carry;
      }
    }
  }
  return {
    spins,
    rtp: (base + feat) / spins,
    baseRtp: base / spins,
    hitRate: hits / spins,
    features,
    spinsPerFeature: features ? spins / features : Infinity,
    avgFeatureMult: features ? feat / features : 0,
  };
}
