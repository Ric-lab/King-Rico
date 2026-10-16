// <bounce-3d> — Fortune Bounce: bola neon quicando por placas num corredor de luzes douradas (three.js).
// 3 pistas. A bola segue o dedo na hora (sem limite). Toda queda é erro de movimento.
// A sorte só escolhe a dificuldade das próximas placas (distância, tamanho, placa que anda), sempre visível de longe.
// Ganchos: window.bounceHooks = { onStart() → bool, decide(n) → 'ok'|'fail', onLand(n, gold), onStopped(), onFall() }
(function () {
  if (customElements.get('bounce-3d')) return;
  const SRC = 'https://unpkg.com/three@0.184.0/build/three.module.js';
  const DZ = 4, BR = 0.32, HOP = 1.5, L = 1.6, XMAX = 2.3, PAD = 0.05;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const hook = (n, ...a) => { const h = window.bounceHooks; return h && h[n] ? h[n](...a) : n === 'onStart' ? true : n === 'decide' ? 'ok' : undefined; };
  function glowTex(T, ring) { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    if (ring) { g.addColorStop(0.6, 'rgba(255,220,120,0)'); g.addColorStop(0.78, 'rgba(255,230,150,1)'); g.addColorStop(1, 'rgba(255,210,87,0)'); }
    else { g.addColorStop(0, 'rgba(255,255,235,1)'); g.addColorStop(0.25, 'rgba(255,220,120,.85)'); g.addColorStop(1, 'rgba(255,170,40,0)'); }
    x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new T.CanvasTexture(c); }
  class Bounce3D extends HTMLElement {
    connectedCallback() { if (this._init) return; this._init = true; Object.assign(this.style, { display: 'block', position: 'relative', width: '100%', height: '100%', touchAction: 'none', cursor: 'grab' }); import(SRC).then(T => this.setup(T)); }
    disconnectedCallback() { cancelAnimationFrame(this._raf); if (this._ro) this._ro.disconnect(); }
    setup(T) {
      this.T = T; const r = this.renderer = new T.WebGLRenderer({ antialias: true }); r.setClearColor(0x0c0318, 1);
      r.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block'; this.appendChild(r.domElement);
      const sc = this.scene = new T.Scene(); sc.fog = new T.Fog(0x1a0630, 14, 46);
      const bg = document.createElement('canvas'); bg.width = 4; bg.height = 256; const bx = bg.getContext('2d'), bgg = bx.createLinearGradient(0, 0, 0, 256);
      bgg.addColorStop(0, '#3a0f5e'); bgg.addColorStop(0.45, '#1a0630'); bgg.addColorStop(1, '#07020f'); bx.fillStyle = bgg; bx.fillRect(0, 0, 4, 256); const bt = new T.CanvasTexture(bg); bt.colorSpace = T.SRGBColorSpace; sc.background = bt;
      this.cam = new T.PerspectiveCamera(60, 1, 0.1, 80);
      this.floor = new T.Mesh(new T.PlaneGeometry(10, 200), new T.MeshBasicMaterial({ color: 0x2a0a48, transparent: true, opacity: 0.55 })); this.floor.rotation.x = -Math.PI / 2; this.floor.position.y = -0.4; sc.add(this.floor);
      sc.add(new T.HemisphereLight(0x9a6ad0, 0x1a0630, 0.9)); const dl = new T.DirectionalLight(0xfff0d0, 0.8); dl.position.set(2, 8, 4); sc.add(dl);
      this.light = new T.PointLight(0xffc040, 18, 9, 1.6); sc.add(this.light);
      this.gTex = glowTex(T, false); this.rTex = glowTex(T, true);
      this.tileM = new T.MeshStandardMaterial({ name: 'placa', color: 0x2a0f4a, emissive: 0x4a1a7a, emissiveIntensity: 0.55, roughness: 0.35, metalness: 0.3 });
      this.goldM = new T.MeshStandardMaterial({ name: 'placa-ouro', color: 0xffc93a, emissive: 0xff9a10, emissiveIntensity: 0.9, roughness: 0.25, metalness: 0.6 });
      this.edgeM = new T.LineBasicMaterial({ color: 0xffd257 }); this.boxG = new T.BoxGeometry(1, 0.25, 1); this.edgeG = new T.EdgesGeometry(this.boxG);
      const railM = new T.MeshBasicMaterial({ color: 0xffd257 }); this.rails = [-1, 1].map(s => { const m = new T.Mesh(new T.BoxGeometry(0.06, 0.06, 140), railM); m.position.set(s * 3.4, -0.35, 0); sc.add(m); return m; });
      this.archM = new T.MeshBasicMaterial({ color: 0xffd257, transparent: true }); this.archG = new T.TorusGeometry(4, 0.07, 8, 48, Math.PI); this.arches = new Map();
      this.ball = new T.Mesh(new T.SphereGeometry(BR, 40, 24), new T.MeshStandardMaterial({ name: 'bola', color: 0xffe27a, emissive: 0xffb020, emissiveIntensity: 1.3, roughness: 0.2, metalness: 0.2 })); sc.add(this.ball);
      this.halo = this.sprite(1.5, 0.7); this.trail = Array.from({ length: 7 }, (_, i) => this.sprite(0.6 - i * 0.06, 0.28 - i * 0.035));
      this.fx = []; this.rows = new Map();
      const fit = () => { const w = this.clientWidth || 453, h = this.clientHeight || 802, s = this.getBoundingClientRect().width / w || 1;
        r.setPixelRatio(Math.min(2.5, (window.devicePixelRatio || 1) * s)); r.setSize(w, h, false); this.cam.aspect = w / h; this.cam.updateProjectionMatrix(); this.W = w; };
      fit(); this._ro = new ResizeObserver(fit); this._ro.observe(this);
      this.addEventListener('pointerdown', e => this.down(e)); this.addEventListener('pointermove', e => this.move(e)); this.addEventListener('pointerup', () => this.drag = null); this.addEventListener('pointercancel', () => this.drag = null);
      this.reset(); let last = performance.now();
      const tick = now => { const dt = Math.min(0.05, (now - last) / 1000); last = now; this.update(dt, now / 1000); r.render(sc, this.cam); this._raf = requestAnimationFrame(tick); };
      this._raf = requestAnimationFrame(tick); window.Bounce3D = this;
    }
    sprite(s, op) { const T = this.T, m = new T.Sprite(new T.SpriteMaterial({ map: this.gTex, blending: T.AdditiveBlending, transparent: true, depthWrite: false, opacity: op })); m.scale.setScalar(s); m.userData.op = op; this.scene.add(m); return m; }
    local(e) { const rc = this.getBoundingClientRect(); return (e.clientX - rc.left) * (this.W || 453) / rc.width; }
    down(e) { try { this.setPointerCapture(e.pointerId); } catch (x) {} this.drag = { x: this.local(e), bx: this.tx };
      if (this.state === 'idle' && hook('onStart')) { this.state = 'run'; this.startHop(0); } }
    move(e) { const d = this.drag; if (!d || this.state !== 'run') return; this.tx = clamp(d.bx + (this.local(e) - d.x) * 0.018, -XMAX, XMAX); }
    // DIFICULDADE SOB DEMANDA (visível de longe): cada fileira sorteia fácil/médio/difícil; difícil fica mais comum e mais duro com a distância (quase impossível ~35ª).
    makeRow(k) { const T = this.T, g = new T.Group(); g.position.z = -k * DZ; this.scene.add(g);
      // 3 pistas (como Tiles Hop): fácil = mesma pista ou vizinha, placa grande; média = vizinha, menor, às vezes anda; difícil = pista oposta / anda rápido entre pistas, pequena
      const prev = this.rows.get(k - 1), pl = prev ? prev.lane : 1, r = clamp(k / 35, 0, 1), u = Math.random();
      const tier = k <= 2 ? 0 : u < 0.12 + 0.5 * r ? 2 : u < 0.5 + 0.3 * r ? 1 : 0, nb = [pl - 1, pl + 1].filter(l => l >= 0 && l <= 2);
      const lane = k === 0 ? 1 : tier === 0 ? (Math.random() < 0.5 ? pl : nb[Math.floor(Math.random() * nb.length)]) : tier === 1 ? nb[Math.floor(Math.random() * nb.length)] : (pl === 1 ? (Math.random() < 0.5 ? 0 : 2) : 2 - pl);
      const ts = [1.6 - 0.3 * r, 1.4 - 0.35 * r, 1.25 - 0.35 * r][tier];
      let cx = (lane - 1) * 1.7;
      const slide = k > 5 && tier >= 1 && Math.random() < 0.25 + 0.4 * r ? (tier === 2 ? { amp: 1.7, w: 1.4 + 1.6 * r, ph: Math.random() * 6.28 } : { amp: 0.85, w: 1.0 + 1.0 * r, ph: Math.random() * 6.28 }) : null;
      if (slide) cx = slide.amp > 1 ? 0 : (lane === 1 ? (Math.random() < 0.5 ? -0.85 : 0.85) : Math.sign(cx) * 0.85);
      const size = k === 0 ? 2.4 : ts, gold = k >= 2 && Math.random() < 1 / 40;
      const t = new T.Group(), m = new T.Mesh(this.boxG, (gold ? this.goldM : this.tileM).clone()); m.position.y = -0.125; t.add(m);
      const ed = new T.LineSegments(this.edgeG, this.edgeM); ed.position.y = -0.125; t.add(ed);
      const dm = new T.Mesh(this.diaG || (this.diaG = new T.PlaneGeometry(0.2, 0.2)), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45, depthWrite: false })); dm.rotation.set(-Math.PI / 2, 0, Math.PI / 4); dm.position.y = 0.01; t.add(dm); t.scale.set(size, 1, size); t.position.x = cx; g.add(t);
      const row = { k, g, t, m, dm, cx, lane, ts: size, gold, flash: 0, slide }; this.rows.set(k, row); return row; }
    ensure(k) { for (let i = Math.max(0, k - 2); i <= k + 14; i++) if (!this.rows.has(i)) this.makeRow(i);
      for (const [i, r] of this.rows) if (i < k - 2) { this.scene.remove(r.g); r.m.material.dispose(); this.rows.delete(i); }
      const a0 = Math.floor(k / 3); for (let a = a0 - 1; a <= a0 + 6; a++) if (!this.arches.has(a)) { const T = this.T, g = new T.Group(); g.position.set(0, -0.35, -a * 12 - 2); g.add(new T.Mesh(this.archG, this.archM.clone()));
          for (let i = 0; i <= 10; i++) { const an = i / 10 * Math.PI, s = new T.Sprite(new T.SpriteMaterial({ map: this.gTex, blending: T.AdditiveBlending, transparent: true, depthWrite: false })); s.scale.setScalar(0.55); s.position.set(Math.cos(an) * 4, Math.sin(an) * 4, 0); g.add(s); }
          this.scene.add(g); this.arches.set(a, g); }
      for (const [a, g] of this.arches) if (a < a0 - 1) { this.scene.remove(g); this.arches.delete(a); } }
    reset() { for (const [, r] of this.rows) this.scene.remove(r.g); this.rows.clear(); for (const [, g] of this.arches) this.scene.remove(g); this.arches.clear();
      this.k = 0; this.streak = 0; this.bx = this.tx = 0; this.bz = 0; this.by = BR; this.vy = 0; this.state = 'idle'; this.hop = null; this.idleT = 0; this.stopReq = false; this.ensure(0); this.ball.visible = true; }
    stop() { if (this.state === 'run') this.stopReq = true; }
    startHop(k) { const dur = Math.max(0.36, 0.6 - k * 0.006); this.hop = { k, t: 0, dur }; this.ensure(k + 1); }
    land() { const k = this.hop.k + 1, row = this.rows.get(k); this.bz = -k * DZ; const hit = Math.abs(this.bx - row.t.position.x) < row.ts / 2 + PAD;
      if (!hit) return this.fall();
      this.k = k; row.flash = 1; row.sink = 1; const perfect = Math.abs(this.bx - row.t.position.x) < row.ts * 0.16; if (perfect) { this.streak = (this.streak || 0) + 1; row.perfect = 1; } else this.streak = 0; row.lit = true; this.squash = 1; this.ring(row); if (perfect) this.ring(row, true);
      hook('onLand', k, row.gold, perfect, this.streak);
      if (this.stopReq) { this.state = 'stopped'; this.hop = null; hook('onStopped'); return; }
      this.startHop(k); }
    ring(row, white) { const T = this.T, s = new T.Sprite(new T.SpriteMaterial({ map: this.rTex, blending: T.AdditiveBlending, transparent: true, depthWrite: false, color: white ? 0xffffff : row.gold ? 0xffe680 : 0xffd27a }));
      s.position.set(row.t.position.x, 0.05, row.g.position.z); this.scene.add(s); this.fx.push({ s, t: 0, big: white ? 1.6 : row.gold ? 4 : 2.6 }); }
    fall() { this.state = 'fall'; this.hop = null; this.vy = 0; this.fallT = 0; this.stopReq = false; }
    update(dt, t) {
      this.bx += (this.tx - this.bx) * Math.min(1, dt * 24);
      if (this.state === 'idle') { this.idleT += dt; const u = (this.idleT % 0.7) / 0.7; this.by = BR + Math.sin(u * Math.PI) * 0.7; this.bz = 0; }
      else if (this.hop) { const h = this.hop; h.t += dt; const u = Math.min(1, h.t / h.dur); this.bz = -(h.k + u) * DZ; this.by = BR + Math.sin(u * Math.PI) * HOP;
        if (u >= 1) { this.by = BR; this.land(); } }
      else if (this.state === 'stopped') this.by += (BR + 0.9 - this.by) * Math.min(1, dt * 4);
      else if (this.state === 'fall') { this.fallT += dt; this.vy -= 22 * dt; this.by += this.vy * dt; this.bz -= dt * 2.5; if (this.fallT > 0.9 && !this.fallDone) { this.fallDone = true; hook('onFall'); } }
      if (this.state !== 'fall') this.fallDone = false;
      this.squash = Math.max(0, (this.squash || 0) - dt * 6); const sq = 1 - 0.3 * this.squash; this.ball.scale.set(1 + 0.2 * this.squash, sq, 1 + 0.2 * this.squash);
      this.ball.position.set(this.bx, this.by, this.bz); this.ball.rotation.x -= dt * 8; this.halo.position.copy(this.ball.position); this.light.position.set(this.bx, this.by + 0.6, this.bz);
      const pulse = this.state === 'stopped' ? 1 + Math.sin(t * 6) * 0.15 : 1; this.halo.scale.setScalar(1.5 * pulse);
      for (let i = this.trail.length - 1; i > 0; i--) this.trail[i].position.copy(this.trail[i - 1].position); this.trail[0].position.copy(this.ball.position);
      const fv = this.state === 'fall' ? Math.max(0, 1 - this.fallT * 1.4) : 1; [this.halo, ...this.trail].forEach(s => s.material.opacity = s.userData.op * fv); this.ball.material.emissiveIntensity = 1.3 * Math.max(0.2, fv);
      for (const [, r] of this.rows) if (r.slide && !(r.k === this.k && this.state === 'stopped')) r.t.position.x = r.cx + Math.sin(t * r.slide.w + r.slide.ph) * r.slide.amp;
      for (const [, r] of this.rows) if (r.perfect) { r.perfect = Math.max(0, r.perfect - dt * 1.5); r.dm.material.opacity = 0.45 + r.perfect * 0.55; r.dm.scale.setScalar(1 + r.perfect * 1.8); }
      for (const [, r] of this.rows) if (r.sink) { r.sink = Math.max(0, r.sink - dt * 3.2); const q = 1 - r.sink; r.t.position.y = -0.22 * Math.sin(q * Math.PI) * (1 - q * 0.4); if (!r.sink) r.t.position.y = 0; }
      for (const [, r] of this.rows) if (r.flash > 0) { r.flash = Math.max(0, r.flash - dt * 1.6); r.m.material.emissiveIntensity = (r.gold ? 0.9 : 0.7) + r.flash * 2.4; if (!r.gold) r.m.material.emissive.setHex(r.flash > 0.05 ? 0xffb030 : 0x8a4a10); }
      for (let i = this.fx.length - 1; i >= 0; i--) { const f = this.fx[i]; f.t += dt; const k = Math.min(1, f.t / 0.45); f.s.scale.setScalar(0.6 + f.big * k); f.s.material.opacity = 1 - k; if (k >= 1) { this.scene.remove(f.s); f.s.material.dispose(); this.fx.splice(i, 1); } }
      const cz = Math.min(this.bz, 0) + 5; this.cam.position.set(this.bx * 0.6, 2.6, cz); this.cam.lookAt(this.bx * 0.7, 0.2, cz - 11);
      for (const g of this.arches.values()) { const d = cz - g.position.z; g.visible = d > 3.5; const f = clamp((d - 3.5) / 4, 0, 1); g.children.forEach(c => { if (c.material) c.material.opacity = f; }); }
      this.rails.forEach(m => m.position.z = cz - 60); this.floor.position.z = cz - 90;
    }
  }
  customElements.define('bounce-3d', Bounce3D);
})();
