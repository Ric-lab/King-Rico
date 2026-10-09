// Uso: npm run sim -- [giros] [semente]
import { seededRng } from '../src/game/engine';
import { simulate } from '../src/game/simulate';

const spins = Number(process.argv[2] ?? 500_000);
const seed = Number(process.argv[3] ?? Date.now());
const s = simulate(seededRng(seed), spins);
const pct = (v: number) => (v * 100).toFixed(2) + '%';
console.log(`giros ${spins} · semente ${seed}`);
console.log(`RTP ${pct(s.rtp)} (base ${pct(s.baseRtp)}) · acerto ${pct(s.hitRate)}`);
console.log(`Rodada Especial: 1 a cada ${s.spinsPerFeature.toFixed(1)} giros · média ${s.avgFeatureMult.toFixed(1)}x`);
