// Motor de áudio do jogo — WebAudio puro, sem arquivos.
// Mesmos timbres do Fortune Circus: "tec" de botão (aperta/solta), zumbido de rolo,
// notas de parada, arpejo de vitória. Silencioso até o primeiro toque do usuário.
const NOTES = [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25, 784];
const LEVEL_GAIN = [0, 0.35, 1];

export function createAudio() {
  let ac = null, master = null, level = 2, whirr = null, white = null;

  function ctx() {
    if (!level) return null;
    try {
      if (!ac) {
        const C = window.AudioContext || window.webkitAudioContext;
        if (!C) return null;
        ac = new C();
        master = ac.createGain();
        master.gain.value = 0.5 * LEVEL_GAIN[level];
        master.connect(ac.destination);
      }
      if (ac.state === "suspended") ac.resume();
      return ac;
    } catch (e) { level = 0; return null; }
  }

  function tone(freq, dur, type, vol, when) {
    const a = ctx(); if (!a) return;
    const t = a.currentTime + (when || 0);
    const o = a.createOscillator(), g = a.createGain();
    o.type = type || "triangle";
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.22, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
  }

  return {
    get level() { return level; },
    /** 0 = OFF · 1 = 50% · 2 = 100% */
    setLevel(v) {
      level = v;
      if (!v) this.stopWhirr();
      if (master && ac) master.gain.setTargetAtTime(0.5 * LEVEL_GAIN[v], ac.currentTime, 0.03);
      else if (v) ctx();
    },
    setEnabled(v) { this.setLevel(v ? 2 : 0); },
    /** Mechanical button click. down = firmer press, up = lighter release. */
    click(down = true) {
      const a = ctx(); if (!a) return;
      const t = a.currentTime + 0.001;
      if (!white || white.sampleRate !== a.sampleRate) {
        const len = Math.floor(a.sampleRate * 0.06);
        white = a.createBuffer(1, len, a.sampleRate);
        const ch = white.getChannelData(0);
        for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 4);
      }
      const v = (down ? 1 : 0.55) * 0.35, r = 0.96 + Math.random() * 0.08;
      const n = a.createBufferSource(); n.buffer = white; n.playbackRate.value = (down ? 1 : 1.3) * r;
      const bp = a.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = down ? 2600 : 3800; bp.Q.value = 0.9;
      const pk = a.createBiquadFilter(); pk.type = "peaking"; pk.frequency.value = down ? 1500 : 2200; pk.Q.value = 3; pk.gain.value = 9;
      const ng = a.createGain(); ng.gain.setValueAtTime(1.1 * v, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + (down ? 0.03 : 0.02));
      n.connect(bp); bp.connect(pk); pk.connect(ng); ng.connect(master); n.start(t); n.stop(t + 0.06);
      const o = a.createOscillator(), g = a.createGain(); o.type = "triangle";
      o.frequency.setValueAtTime((down ? 420 : 560) * r, t); o.frequency.exponentialRampToValueAtTime(down ? 120 : 180, t + 0.035);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5 * v, t + 0.0015); g.gain.exponentialRampToValueAtTime(0.0001, t + (down ? 0.07 : 0.045));
      o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.09);
      if (down) {
        const s = a.createOscillator(), g2 = a.createGain(); s.type = "sine";
        s.frequency.setValueAtTime(150, t); s.frequency.exponentialRampToValueAtTime(55, t + 0.06);
        g2.gain.setValueAtTime(0.0001, t); g2.gain.exponentialRampToValueAtTime(0.16, t + 0.003); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
        s.connect(g2); g2.connect(master); s.start(t); s.stop(t + 0.12);
      }
    },
    startWhirr() {
      const a = ctx(); if (!a || whirr) return;
      const o = a.createOscillator(), g = a.createGain(), lp = a.createBiquadFilter();
      o.type = "sawtooth"; o.frequency.value = 78;
      lp.type = "lowpass"; lp.frequency.value = 900;
      g.gain.setValueAtTime(0.0001, a.currentTime);
      g.gain.exponentialRampToValueAtTime(0.05, a.currentTime + 0.08);
      o.connect(lp); lp.connect(g); g.connect(master); o.start();
      whirr = { o, g };
    },
    stopWhirr() {
      if (!whirr || !ac) return;
      const t = ac.currentTime;
      try {
        whirr.g.gain.cancelScheduledValues(t);
        whirr.g.gain.setValueAtTime(whirr.g.gain.value || 0.0001, t);
        whirr.g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
        whirr.o.stop(t + 0.18);
      } catch (e) { /* já parado */ }
      whirr = null;
    },
    stopReel(i) { tone(NOTES[Math.min(i, NOTES.length - 1)], 0.16, "triangle", 0.2); },
    win(big) {
      const steps = big ? [0, 2, 4, 6, 8] : [0, 3, 5];
      steps.forEach((n, i) => tone(NOTES[n] * 2, 0.26, "triangle", 0.2, i * 0.09));
    },
    lose() { tone(196, 0.16, "sine", 0.1); }
  };
}

/** Vibration at 0 / 50% / 100%: 50% halves pulse length and stretches gaps. */
export function buzz(pattern, level = 2) {
  if (!level || !navigator.vibrate) return;
  const k = level === 1 ? 0.5 : 1;
  const p = Array.isArray(pattern)
    ? pattern.map((v, i) => (i % 2 === 0 ? Math.max(4, Math.round(v * k)) : Math.round(v * (k < 1 ? 1.4 : 1))))
    : Math.max(4, Math.round(pattern * k));
  try { navigator.vibrate(p); } catch (e) { /* sem suporte */ }
}
