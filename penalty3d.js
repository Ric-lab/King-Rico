// <penalty-3d> — cena 3D do Fortune Penalty (three.js). Física real: swipe → velocidade; traves, rede, chão e goleira-robô colidem de verdade.
// O "roubo" só escolhe a pose da goleira (e, em erro de sorte perto do aro, empurra a bola alguns cm para a trave). Mira do jogador manda.
// Ganchos (definidos pela página): window.penHooks = { onSwipe() → p|null, onResult(goal), sfx(tipo) }
(function () {
  if (customElements.get('penalty-3d')) return;
  const SRC = 'https://unpkg.com/three@0.184.0/build/three.module.js';
  const GW = 4.345, GH = 3.845, PR = 0.11, D = 2.0, BH = 2.0, R = 0.19, BZ = 9.965, KH = 3.13, KL = 2.70, KR = 0.42, KZ = 1.465, GRAV = -9.8;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const back = k => { const c = 1.7; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
  const hook = (n, ...a) => { const h = window.penHooks; return h && h[n] ? h[n](...a) : n === 'onSwipe' ? 0.5 : undefined; };

  function ballTexture(T) {
    const W = 768, H = 384, c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d'), img = x.createImageData(W, H), d = img.data, p = (1 + Math.sqrt(5)) / 2, q = 1 / p;
    const nrm = v => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
    const cyc = (a, b, c2, out) => { for (const s1 of [-1, 1]) for (const s2 of [-1, 1]) { const v = [a, b * s1, c2 * s2]; out.push(nrm(v), nrm([v[2], v[0], v[1]]), nrm([v[1], v[2], v[0]])); } };
    const pent = []; cyc(0, 1, p, pent);
    const hex = []; for (const a of [-1, 1]) for (const b of [-1, 1]) for (const e of [-1, 1]) hex.push(nrm([a, b, e])); cyc(0, p, q, hex);
    const C = pent.map(v => [v, 1]).concat(hex.map(v => [v, 0]));
    for (let j = 0; j < H; j++) { const lat = Math.PI / 2 - (j + 0.5) / H * Math.PI, cl = Math.cos(lat), sl = Math.sin(lat);
      for (let i = 0; i < W; i++) { const lon = (i + 0.5) / W * Math.PI * 2, dx = cl * Math.sin(lon), dy = sl, dz = cl * Math.cos(lon);
        let a1 = 9, a2 = 9, k1 = 0;
        for (let n = 0; n < 32; n++) { const v = C[n][0], a = Math.acos(clamp(v[0] * dx + v[1] * dy + v[2] * dz, -1, 1)) - (C[n][1] ? 0.035 : 0); if (a < a1) { a2 = a1; a1 = a; k1 = n; } else if (a < a2) a2 = a; }
        const o = (j * W + i) * 4, seam = a2 - a1 < 0.02, isP = C[k1][1];
        const col = seam ? (isP ? 40 : 120) : isP ? 22 : 246; d[o] = col; d[o + 1] = col; d[o + 2] = seam ? col + 4 : isP ? 30 : 240; d[o + 3] = 255; } }
    x.putImageData(img, 0, 0); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t;
  }
  // gramado com faixas e linhas na MESMA perspectiva do gol (x -13..13, z -6..16)
  function grassTexture(T) {
    const W = 1024, H = 866, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
    const X = v => (v + 13) / 26 * W, Z = v => (v + 6) / 22 * H;
    for (let z = -6, i = 0; z < 16; z += 1.4, i++) { x.fillStyle = i % 2 ? '#378f27' : '#4db23a'; x.fillRect(0, Z(z), W, Z(z + 1.4) - Z(z) + 1); }
    for (let i = 0; i < 9000; i++) { x.fillStyle = i % 2 ? 'rgba(255,255,255,.035)' : 'rgba(0,40,0,.06)'; x.fillRect(Math.random() * W, Math.random() * H, 2, 3); }
    x.strokeStyle = 'rgba(255,255,255,.92)'; x.lineWidth = 0.12 / 26 * W;
    const box = (hw, d) => { x.beginPath(); x.moveTo(X(-hw), Z(0)); x.lineTo(X(-hw), Z(d)); x.lineTo(X(hw), Z(d)); x.lineTo(X(hw), Z(0)); x.stroke(); };
    x.beginPath(); x.moveTo(0, Z(0)); x.lineTo(W, Z(0)); x.stroke(); box(GW + 5.5, 5.5); box(GW + 16.5, 16.5);
    x.fillStyle = '#fff'; x.beginPath(); x.ellipse(X(0), Z(BZ), 0.13 / 26 * W, 0.13 / 22 * H, 0, 0, Math.PI * 2); x.fill();
    const f = x.createLinearGradient(0, 0, 0, Z(-3)); f.addColorStop(0, 'rgba(0,0,0,1)'); f.addColorStop(1, 'rgba(0,0,0,0)');
    x.globalCompositeOperation = 'destination-out'; x.fillStyle = f; x.fillRect(0, 0, W, Z(-3)); x.globalCompositeOperation = 'source-over';
    const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace; tx.anisotropy = 8; return tx;
  }
  function radialTex(T, ring) {
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    if (ring) { g.addColorStop(0.55, 'rgba(255,255,255,0)'); g.addColorStop(0.75, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); }
    else { g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,240,170,.9)'); g.addColorStop(1, 'rgba(255,210,87,0)'); }
    x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new T.CanvasTexture(c);
  }

  class Penalty3D extends HTMLElement {
    connectedCallback() {
      if (this._init) return; this._init = true;
      Object.assign(this.style, { display: 'block', position: 'relative', width: '100%', height: '100%', touchAction: 'none', cursor: 'grab' });
      import(SRC).then(T => this.setup(T));
    }
    disconnectedCallback() { cancelAnimationFrame(this._raf); if (this._ro) this._ro.disconnect(); }
    setup(T) {
      this.T = T; const W = this.clientWidth || 453, H = this.clientHeight || 600;
      const r = this.renderer = new T.WebGLRenderer({ antialias: true, alpha: true }); r.setClearColor(0x000000, 0);
      r.shadowMap.enabled = true; r.shadowMap.type = T.PCFShadowMap; r.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
      this.appendChild(r.domElement); const tc = this.tc = document.createElement('canvas'); tc.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none'; this.appendChild(tc);
      const cam = this.cam = new T.PerspectiveCamera(56, W / H, 0.1, 80); this.camBase = new T.Vector3(0, 1.56, 13.465); cam.position.copy(this.camBase); cam.lookAt(0, 2.35, 1.215); // enquadrado p/ bater com o gol 2D da página this.camQ = cam.quaternion.clone();
      const sc = this.scene = new T.Scene();
      sc.add(new T.HemisphereLight(0xffffff, 0x3a5a2a, 1.5));
      const sun = new T.DirectionalLight(0xfff0d8, 2.3); sun.position.set(3, 9, 7); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
      Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 30 }); sun.shadow.bias = -0.0005; sc.add(sun);
      const ground = new T.Mesh(new T.PlaneGeometry(40, 40), new T.ShadowMaterial({ opacity: 0.32 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; sc.add(ground);
      // gol: traves, travessão, estrutura de trás e rede
      const white = new T.MeshStandardMaterial({ name: 'trave', color: 0xffffff, roughness: 0.18, metalness: 0.05, emissive: 0x5a5f6a, emissiveIntensity: 0.35 }), grey = new T.MeshStandardMaterial({ name: 'estrutura', color: 0xc9ced8, roughness: 0.5 });
      const goal = this.goal = new T.Group(); goal.visible = false; sc.add(goal); // o gol visível é o 2D da página; aqui só a física
      const cyl = (a, b, rad, m) => { const v = new T.Vector3().subVectors(b, a), me = new T.Mesh(new T.CylinderGeometry(rad, rad, v.length(), 24), m);
        me.position.copy(a).addScaledVector(v, 0.5); me.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), v.clone().normalize()); me.castShadow = true; goal.add(me); return me; };
      const V = (x, y, z) => new T.Vector3(x, y, z);
      this.posts = { l: cyl(V(-GW, 0, 0), V(-GW, GH + PR, 0), PR, white), r: cyl(V(GW, 0, 0), V(GW, GH + PR, 0), PR, white), t: cyl(V(-GW - PR, GH, 0), V(GW + PR, GH, 0), PR, white) };
      for (const s of [-1, 1]) { cyl(V(s * GW, GH, 0), V(s * GW, BH, -D), 0.025, grey); cyl(V(s * GW, BH, -D), V(s * GW, 0, -D), 0.025, grey); cyl(V(s * GW, 0.02, 0), V(s * GW, 0.02, -D), 0.02, grey); }
      cyl(V(-GW, BH, -D), V(GW, BH, -D), 0.025, grey); cyl(V(-GW, 0.02, -D), V(GW, 0.02, -D), 0.02, grey);
      const nc = document.createElement('canvas'); nc.width = nc.height = 64; const nx = nc.getContext('2d'); nx.strokeStyle = 'rgba(255,255,255,.9)'; nx.lineWidth = 2.5; nx.strokeRect(0, 0, 64, 64);
      const ntex = new T.CanvasTexture(nc); ntex.wrapS = ntex.wrapT = T.RepeatWrapping; ntex.anisotropy = 4;
      const netM = new T.MeshBasicMaterial({ name: 'rede', map: ntex, transparent: true, opacity: 0.7, side: T.DoubleSide, depthWrite: false });
      const quad = (p00, p10, p11, p01, su, sv, m) => { const g = new T.PlaneGeometry(1, 1, su, sv), pos = g.attributes.position, uv = g.attributes.uv, lu = p00.distanceTo(p10), lv = p00.distanceTo(p01), a = new T.Vector3(), b = new T.Vector3();
        for (let i = 0; i < pos.count; i++) { const u = uv.getX(i), v = uv.getY(i); a.lerpVectors(p00, p10, u); b.lerpVectors(p01, p11, u); a.lerp(b, v); pos.setXYZ(i, a.x, a.y, a.z); uv.setXY(i, u * lu / 0.13, v * lv / 0.13); }
        g.computeVertexNormals(); const me = new T.Mesh(g, m); goal.add(me); return me; };
      this.backNet = quad(V(-GW, 0, -D), V(GW, 0, -D), V(GW, BH, -D), V(-GW, BH, -D), 40, 10, netM); this.netBase = this.backNet.geometry.attributes.position.array.slice();
      quad(V(-GW, GH, 0), V(GW, GH, 0), V(GW, BH, -D), V(-GW, BH, -D), 40, 4, netM);
      quad(V(-GW, 0, 0), V(-GW, 0, -D), V(-GW, BH, -D), V(-GW, GH, 0), 6, 8, netM); quad(V(GW, 0, -D), V(GW, 0, 0), V(GW, GH, 0), V(GW, BH, -D), 6, 8, netM);
      const shM = new T.MeshBasicMaterial({ color: 0x10041e, transparent: true, opacity: 0.42, side: T.DoubleSide, depthWrite: false });
      const shade = new T.Mesh(new T.PlaneGeometry(GW * 2, BH), shM); shade.position.set(0, BH / 2, -D - 0.02); goal.add(shade);
      quad(V(-GW, GH, -0.01), V(GW, GH, -0.01), V(GW, BH, -D), V(-GW, BH, -D), 1, 1, shM); quad(V(-GW, 0, -0.01), V(-GW, 0, -D), V(-GW, BH, -D), V(-GW, GH, -0.01), 1, 1, shM); quad(V(GW, 0, -D), V(GW, 0, -0.01), V(GW, GH, -0.01), V(GW, BH, -D), 1, 1, shM);
      // bola
      this.ball = new T.Mesh(new T.SphereGeometry(R, 48, 32), new T.MeshStandardMaterial({ name: 'bola', map: ballTexture(T), roughness: 0.45 })); this.ball.castShadow = true; sc.add(this.ball);
      this.pos = V(0, R, BZ); this.vel = V(0, 0, 0); this.ball.position.copy(this.pos);
      // goleira-robô: placa da girafa num trilho na linha do gol; desliza (x) e gira (θ) como ponteiro
      this.kg = new T.Group(); this.kg.position.set(0, 0, KZ); sc.add(this.kg); this.kx = 0; this.kth = 0;
      new T.TextureLoader().load('assets/penalty/jump.webp', tex => { tex.colorSpace = T.SRGBColorSpace; const kw = KH * 180 / 367;
        const m = this.kMat = new T.MeshBasicMaterial({ name: 'girafa', map: tex, transparent: true, alphaTest: 0.5, side: T.DoubleSide }), me = new T.Mesh(new T.PlaneGeometry(kw, KH), m);
        me.position.y = KH / 2; me.castShadow = true; me.customDepthMaterial = new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking, map: tex, alphaTest: 0.5 }); this.kg.add(me); });
      this.fxTex = radialTex(T, false); this.ringTex = radialTex(T, true); this.fx = [];
      this.ray = new T.Raycaster(); this.plane = new T.Plane(V(0, 0, 1), 0);
      this.state = 'ready'; this.bulge = { a: 0, v: 0, x: 0, y: 0 }; this.shake = 0; this.stop = 0;
      const fit = () => { const w = this.clientWidth || 453, h = this.clientHeight || 600, rc = this.getBoundingClientRect(), s = rc.width / w || 1;
        r.setPixelRatio(Math.min(2.5, (window.devicePixelRatio || 1) * s)); r.setSize(w, h, false); this.tc.width = w * 2; this.tc.height = h * 2; cam.aspect = w / 600; cam.setViewOffset(w, 600, 0, 0, w, h); cam.updateProjectionMatrix(); this.W = w; this.H = h; };
      fit(); this._ro = new ResizeObserver(fit); this._ro.observe(this); window.addEventListener('resize', fit);
      this.addEventListener('pointerdown', e => this.down(e)); this.addEventListener('pointermove', e => this.move(e)); this.addEventListener('pointerup', e => this.up(e)); this.addEventListener('pointercancel', e => this.up(e));
      let last = performance.now(); const tick = now => { const dt = Math.min(0.05, (now - last) / 1000); last = now; this.update(dt, now / 1000); r.render(sc, cam); this._raf = requestAnimationFrame(tick); };
      this._raf = requestAnimationFrame(tick); window.Pen3D = this;
    }
    local(e) { const rc = this.getBoundingClientRect(), s = rc.width / (this.clientWidth || rc.width); return { x: (e.clientX - rc.left) / s, y: (e.clientY - rc.top) / s }; }
    down(e) { if (this.state !== 'ready') return; try { this.setPointerCapture(e.pointerId); } catch (x) {} const p = this.local(e), n = performance.now(); this.drag = { x: p.x, y: p.y, t: n, dx: 0, dy: 0, pts: [{ x: p.x, y: p.y, t: n }] }; this.trail = this.drag.pts; }
    move(e) { const d = this.drag; if (!d) return; const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      for (const ev of (evs.length ? evs : [e])) { const p = this.local(ev); d.pts.push({ x: p.x, y: p.y, t: performance.now() }); d.dx = p.x - d.x; d.dy = p.y - d.y; } if (d.pts.length > 80) d.pts.splice(1, d.pts.length - 80); }
    up(e) { const d = this.drag; if (d && e) { const p = this.local(e); d.dx = p.x - d.x; d.dy = p.y - d.y; } this.drag = null; if (!d || this.state !== 'ready') return;
      if (!(d.dy < -40 && Math.hypot(d.dx, d.dy) > 50)) return; const p = hook('onSwipe'); if (p == null) return; this.shoot(d, p); }
    // pose da goleira p/ cobrir o ponto (tx, ty) da linha do gol: inclina e desliza no trilho
    poseFor(tx, ty) { let th = clamp(tx * 0.25, -0.95, 0.95); const mx = Math.acos(clamp(ty / (KL + KR * 0.6), 0, 1)); th = Math.sign(th) * Math.min(Math.abs(th), mx);
      return { x: clamp(tx - ty * Math.tan(th), -GW + 0.4, GW - 0.4), th }; }
    segDist(q, bx, by) { const s = Math.sin(q.th), c = Math.cos(q.th), ax = q.x + s * 0.25, ay = c * 0.25, ex = q.x + s * KL, ey = c * KL, dx = ex - ax, dy = ey - ay;
      const u = clamp(((bx - ax) * dx + (by - ay) * dy) / (dx * dx + dy * dy), 0, 1); return Math.hypot(bx - ax - dx * u, by - ay - dy * u); }
    // gol: goleira reage como real — quase sempre pula pro lado certo mas não alcança (curta / altura errada); às vezes erra o lado ou fica
    missPose(Tg) { const bx = Tg.x + (this.pos.x - Tg.x) * KZ / BZ, by = Tg.y + (this.pos.y - Tg.y) * KZ / BZ, sg = Math.sign(bx) || (Math.random() < 0.5 ? -1 : 1);
      const ok = q => this.segDist(q, bx, by) > KR + R + 0.3, sh = a => a.sort(() => Math.random() - 0.5);
      const same = sh([this.poseFor(bx * 0.4, by < 1.4 ? 2.3 : 0.5), this.poseFor(bx - sg * 1.4, by), this.poseFor(bx * 0.65, by < 1.4 ? 2.6 : 0.35), this.poseFor(bx - sg * 1.1, by < 1.4 ? 2.0 : 0.6)]);
      const other = sh([this.poseFor(-sg * 2.6, 0.9 + Math.random() * 0.8), { x: 0, th: 0 }, { x: -sg * 0.4, th: -sg * 0.15 }]);
      const order = Math.random() < (Math.abs(bx) > 1 ? 0.75 : 0.3) ? same.concat(other) : other.concat(same);
      return order.find(ok) || this.poseFor(-sg * 3, 1.2); }
    // gol: ela SEMPRE pula na bola, mas atrasada — quando a bola passa ela ainda está a caminho; termina o pulo depois
    lateDive(Tg, tf) { const bx = this.pred.x, by = this.pred.y, tc = tf * (BZ - KZ) / BZ, full = this.poseFor(bx, by), x0 = this.kx, t0 = this.kth;
      const at = f => ({ x: x0 + (full.x - x0) * f, th: t0 + (full.th - t0) * f }), ok = f => this.segDist(at(f), bx, by) > KR + R + 0.3 && this.segDist(at(Math.min(1, f * 1.12)), bx, by) > KR + R + 0.25;
      let f = 0.8; while (f > 0 && !ok(f)) f -= 0.05; f = Math.max(0, f);
      // um movimento só, contínuo e mais lento: no instante em que a bola passa ela está em f do caminho
      const kk = f > 0.02 ? Math.acos(1 - 2 * f) / Math.PI : 0.05; this.moveKeeper(full, Math.min(1.6, tc / kk), 'smooth'); }
    moveKeeper(to, dur, ease) { this.kAnim = { t0: performance.now() / 1000, dur, ease, fx: this.kx, fth: this.kth, tx: to.x, tth: to.th }; }
    shoot(d, p) {
      const T = this.T, P = d.pts || [{ x: d.x, y: d.y, t: d.t }, { x: d.x + d.dx, y: d.y + d.dy, t: performance.now() }], last = P[P.length - 1], now = last.t; let k = P.length - 1; while (k > 0 && now - P[k - 1].t < 90) k--;
      const a0 = P[Math.max(0, Math.min(k, P.length - 2))], fx = last.x - a0.x, fy = last.y - a0.y, fl = Math.hypot(fx, fy);
      const L = Math.hypot(d.dx, d.dy), dirx = d.dx / L, diry = d.dy / L, sp = Math.min(fl / Math.max(16, now - a0.t), L / Math.max(60, now - (P.find(q => Math.hypot(q.x - d.x, q.y - d.y) > 10) || P[0]).t)); // as duas: o gesto todo E o final têm que ser rápidos
      let dev = 0; for (const q of P) { const c = ((q.x - d.x) * d.dy - (q.y - d.y) * d.dx) / L; if (Math.abs(c) > Math.abs(dev)) dev = c; }
      // caminho do dedo: desvio lateral (px) em relação à reta início→fim, amostrado por progresso vertical do gesto
      this.ax = 0; const y0 = P[0].y, y1 = last.y, x0 = P[0].x, x1 = last.x, off = [];
      for (let i = 0; i <= 20; i++) { const s = i / 20, yy = y0 + (y1 - y0) * s; let fxp = x0; for (let j = 1; j < P.length; j++) { const a = P[j - 1], c = P[j]; if ((a.y - yy) * (c.y - yy) <= 0 && a.y !== c.y) { fxp = a.x + (c.x - a.x) * (yy - a.y) / (c.y - a.y); } } off.push(fxp - (x0 + (x1 - x0) * s)); }
      const big = off.reduce((m, v) => Math.max(m, Math.abs(v)), 0) > 8;
      const scr = v => { const q = v.clone().project(this.cam); return { x: (q.x + 1) / 2 * this.W, y: (1 - q.y) / 2 * this.H }; };
      const b = scr(this.pos), yBase = scr(new T.Vector3(0, 0, 0)).y, yTop = scr(new T.Vector3(0, GH, 0)).y;
      // mira = onde o dedo PAROU. Parou abaixo da linha do gol = rasteiro (na direção do gesto). Acima do travessão = por cima.
      let sx = last.x, sy = last.y; if (sy > yBase) { const kk = (b.y - yBase) / Math.max(0.05, -diry); sx = b.x + dirx * kk; sy = yBase; }
      this.ray.setFromCamera(new T.Vector2(sx / this.W * 2 - 1, -(sy / this.H * 2 - 1)), this.cam); const Tg = new T.Vector3(); this.ray.ray.intersectPlane(this.plane, Tg);
      Tg.x = clamp(Tg.x, -12, 12); Tg.y = clamp(Tg.y, R * 0.9, 7);
      const ax = Math.abs(Tg.x), inside = ax < GW - PR - R * 0.6 && Tg.y < GH - PR - R * 0.6, nearSide = Math.abs(ax - GW) < PR + R + 0.02 && Tg.y < GH + PR + R, nearBar = Math.abs(Tg.y - GH) < PR + R + 0.02 && ax < GW + PR + R;
      // HABILIDADE = regras que se veem: (1) não chutar no meio (lá está a girafa), (2) não arrastar devagar. Acertou as duas → só a sorte decide (RTP cheio).
      // Progressão: a "zona da girafa" alarga e o mínimo de força sobe a cada pênalti. Nada escondido (sem penalidade por repetir canto etc.).
      const dk = clamp((hook('getStep') || 0) / 4, 0, 1), lerp = (a, b) => a + (b - a) * dk;
      const zone = lerp(0.3, 0.45), qPos = Math.abs(Tg.x - this.kx) / GW > zone || Tg.y > GH * lerp(0.86, 0.92) ? 1 : 0, qs = clamp((sp - lerp(0.25, 0.42)) / 0.15, 0, 1), q = qPos * qs;
      this.quality = q; const lucky = Math.random() < p * q, side = Math.sign(Tg.x) || (Math.random() < 0.5 ? -1 : 1);
      // perto do aro sem sorte: alguns cm p/ fora → bate e espirra p/ fora (o jogador já mirou na trave)
      const toFrame = () => { if (GW - ax < GH - Tg.y || Tg.y < 1) Tg.x = side * (GW + PR * 0.4); else Tg.y = GH + PR * 0.5; };
      let kTarget;
      if (inside && lucky) kTarget = 'late';
      else if (inside) { const edge = Math.min(GW - ax, GH - Tg.y); if (edge < 0.45 && Math.random() < 0.5) { toFrame(); kTarget = this.poseFor(Tg.x * 0.5, Math.min(Tg.y, 1.5)); } else kTarget = 'save'; }
      else { if ((nearSide || nearBar) && !lucky) toFrame(); kTarget = this.poseFor(clamp(Tg.x, -GW, GW) * 0.5, Math.min(Tg.y, 1.5)); }
      const tf = clamp(0.75 - sp * 0.18, 0.38, 0.7), g = new T.Vector3(0, GRAV, 0);
      this.vel.copy(Tg).sub(this.pos).addScaledVector(g, -0.5 * tf * tf).divideScalar(tf);
      const fpx = 300 / Math.tan(28 * Math.PI / 180); this.curve = big ? { off, bx: this.pos.x, tx: Tg.x, fpx } : null;
      // onde a bola REALMENTE passa na linha da goleira (inclui a curva do arco e a gravidade)
      const s = (BZ - KZ) / BZ, tk = tf * s, cvv = this.curve; let px = this.pos.x + (Tg.x - this.pos.x) * s;
      if (cvv) { const i = Math.min(19, Math.floor(s * 20)), fr = s * 20 - i; px += (cvv.off[i] + (cvv.off[i + 1] - cvv.off[i]) * fr) * (this.camBase.z - KZ) / cvv.fpx; }
      this.pred = { x: px, y: Math.max(R, this.pos.y + this.vel.y * tk + 0.5 * GRAV * tk * tk) };
      if (kTarget === 'save') kTarget = this.poseFor(this.pred.x, this.pred.y);
      if (kTarget === 'late') this.lateDive(Tg, tf); else this.moveKeeper(kTarget, Math.min(0.26, tf * 0.55)); hook('sfx', 'kick'); setTimeout(() => hook('sfx', 'turn'), 40);
      this.state = 'flying'; this.tShot = performance.now() / 1000; this.crossed = null; this.contact = 0; this.done = false; this.netHit = false;
    }
    flash(p, size, ring) { const T = this.T, s = new T.Sprite(new T.SpriteMaterial({ map: ring ? this.ringTex : this.fxTex, blending: T.AdditiveBlending, depthTest: false, transparent: true }));
      s.position.copy(p); s.renderOrder = 10; this.scene.add(s); this.fx.push({ s, t: 0, dur: ring ? 0.38 : 0.42, a: size * 0.25, b: size * (ring ? 1.4 : 1.2) }); }
    finish(goal, delay) { if (this.done) return; this.done = true; setTimeout(() => { hook('onResult', goal); setTimeout(() => this.reset(), 900); }, delay); }
    reset() { this.state = 'resetting'; this.pos.set(0, R, BZ); this.vel.set(0, 0, 0); this.ball.position.copy(this.pos); this.ball.scale.setScalar(0.01); this.bAppear = 0;
      clearTimeout(this._ld1); clearTimeout(this._ld2); this.moveKeeper({ x: 0, th: 0 }, 0.38); setTimeout(() => { this.swayT0 = null; this.state = 'ready'; }, 400); }
    collideSeg(a, b, rad, kind) { // esfera x segmento (trave/goleira)
      const T = this.T, ab = this._ab || (this._ab = new T.Vector3()), ap = this._ap || (this._ap = new T.Vector3()), c = this._c || (this._c = new T.Vector3());
      ab.subVectors(b, a); const t = clamp(ap.subVectors(this.pos, a).dot(ab) / ab.lengthSq(), 0, 1); c.copy(a).addScaledVector(ab, t);
      const n = ap.subVectors(this.pos, c), dist = n.length(), min = rad + R; if (dist >= min || dist < 1e-6) return false;
      n.divideScalar(dist); this.pos.copy(c).addScaledVector(n, min); const vn = this.vel.dot(n); if (vn < 0) this.vel.addScaledVector(n, -(1 + (kind === 'keeper' ? 0.55 : 0.7)) * vn);
      if (!this.contact) { this.contact = performance.now() / 1000; const hit = this.pos.clone().addScaledVector(n, -R);
        if (kind === 'keeper') { if (this.vel.z < 3.5) this.vel.z = 3.5 + Math.random(); this.vel.y = Math.max(this.vel.y, 1.5); this.stop = 0.12; this.shake = 0.3; this.glow = 0.45;
          this.flash(hit, 1.6, false); this.flash(hit, 2.0, true); hook('sfx', 'save'); }
        else { this.flash(hit, 0.9, false); this.shake = 0.15; hook('sfx', 'post', kind); } }
      return true;
    }
    step(h) {
      const T = this.T, p = this.pos, v = this.vel, z0 = p.z; v.y += GRAV * h; const cv = this.curve; if (cv && !this.contact && p.z > 0.15) { const s = clamp((BZ - p.z) / BZ, 0, 1), i = Math.min(19, Math.floor(s * 20)), f = s * 20 - i, o = cv.off[i] + (cv.off[i + 1] - cv.off[i]) * f;
        const nx = cv.bx + (cv.tx - cv.bx) * s + o * (this.camBase.z - p.z) / cv.fpx; v.x = (nx - (p.x - v.x * h)) / h; p.x = nx; } p.addScaledVector(v, h);
      if (p.y < R) { p.y = R; if (v.y < 0) v.y = -v.y * 0.5; v.x *= 0.985; v.z *= 0.985; }
      if (Math.abs(p.z) < R + PR + 0.05) {
        this._a = this._a || new T.Vector3(); this._b = this._b || new T.Vector3();
        this.collideSeg(this._a.set(-GW, 0, 0), this._b.set(-GW, GH, 0), PR, 'l'); this.collideSeg(this._a.set(GW, 0, 0), this._b.set(GW, GH, 0), PR, 'r'); this.collideSeg(this._a.set(-GW, GH, 0), this._b.set(GW, GH, 0), PR, 't');
      }
      if (Math.abs(p.z - KZ) < KR + R && this.kMat) { const s = Math.sin(this.kth), c = Math.cos(this.kth); this._a = this._a || new T.Vector3(); this._b = this._b || new T.Vector3();
        this.collideSeg(this._a.set(this.kx + s * 0.25, c * 0.25, KZ), this._b.set(this.kx + s * KL, c * KL, KZ), KR, 'keeper'); }
      if (z0 >= 0 && p.z < 0 && this.crossed == null) this.crossed = Math.abs(p.x) < GW - R * 0.3 && p.y < GH - R * 0.3 ? 'in' : 'out';
      if (this.crossed === 'in') { // dentro do gol: rede segura
        if (p.z < -D + R) { p.z = -D + R; if (!this.netHit) { this.netHit = true; this.bulge.v = -6; this.bulge.x = p.x; this.bulge.y = p.y; hook('sfx', 'net', p.x, p.y); } v.z = Math.abs(v.z) * 0.12; v.x *= 0.3; v.y *= 0.4; }
        if (Math.abs(p.x) > GW - R) { p.x = Math.sign(p.x) * (GW - R); v.x *= -0.2; }
        const roof = GH + (GH - BH) * p.z / D - R; if (p.y > roof) { p.y = roof; v.y = Math.min(0, v.y) * 0.3; }
        if (p.z < -0.35) this.finish(true, 450);
      }
      if (this.crossed === 'out' && p.z < -0.6) this.finish(false, 250);
      return Math.hypot(v.x, v.z);
    }
    drawTrail(dt) { const c = this.tc, x = c.getContext('2d'); x.setTransform(2, 0, 0, 2, 0, 0); x.clearRect(0, 0, c.width, c.height); const P = this.trail; if (!P || P.length < 2) return;
      if (!this.drag) { this.trailFade = Math.max(0, (this.trailFade ?? 1) - dt * 3.5); if (!this.trailFade) { this.trail = null; return; } } else this.trailFade = 1;
      const n = P.length; x.lineCap = 'round'; x.lineJoin = 'round';
      for (let i = 1; i < n; i++) { const f = i / n; x.strokeStyle = 'rgba(255,236,170,' + (0.85 * f * this.trailFade) + ')'; x.lineWidth = 4 + 10 * f; x.beginPath(); x.moveTo(P[i - 1].x, P[i - 1].y); x.lineTo(P[i].x, P[i].y); x.stroke(); } }
    update(dt, t) {
      const T = this.T; this.drawTrail(dt);
      if (this.kAnim) { const a = this.kAnim, k = clamp((performance.now() / 1000 - a.t0) / a.dur, 0, 1), e = a.ease === 'smooth' ? 0.5 - 0.5 * Math.cos(Math.PI * k) : back(k); this.kx = a.fx + (a.tx - a.fx) * e; this.kth = a.fth + (a.tth - a.fth) * e; if (k >= 1) this.kAnim = null; }
      else if (this.state === 'ready') { // girafa balança na linha; amplitude cresce a cada pênalti (1º parada → 5º ±1,1 m). Chutar LONGE dela é a habilidade.
        if (this.swayT0 == null) { this.swayT0 = t; this.swayS = Math.random() < 0.5 ? -1 : 1; } const st = clamp((hook('getStep') || 0) / 4, 0, 1), amp = 0.25 + 0.85 * st, ph = (t - this.swayT0) * (1.1 + 0.5 * st);
        this.kx = this.swayS * amp * Math.sin(ph); this.kth = -0.06 * Math.cos(ph) * Math.sign(amp); }
      this.kg.position.x = this.kx; this.kg.rotation.z = -this.kth;
      if (this.kMat) { this.glow = Math.max(0, (this.glow || 0) - dt); this.kMat.color.setScalar(1 + this.glow * 3); }
      if (this.state === 'flying') {
        if (this.stop > 0) this.stop -= dt; else { const n = Math.ceil(dt / (1 / 240)), h = dt / n; let spd = 0; for (let i = 0; i < n; i++) spd = this.step(h);
          const v = this.vel, ax = this._ax || (this._ax = new T.Vector3()); ax.set(-v.z, 0, v.x); const l = ax.length(); if (l > 1e-4) this.ball.rotateOnWorldAxis(ax.divideScalar(l), Math.hypot(v.x, v.y, v.z) / R * dt * 0.9); }
        this.ball.position.copy(this.pos); const now = performance.now() / 1000;
        if (!this.done && this.contact && this.crossed !== 'in' && now - this.contact > 0.7) this.finish(false, 0);
        if (!this.done && now - this.tShot > 2.4) this.finish(false, 0);
      }
      if (this.bAppear != null) { this.bAppear = Math.min(1, this.bAppear + dt * 4); this.ball.scale.setScalar(back(this.bAppear)); if (this.bAppear >= 1) this.bAppear = null; }
      // rede estufa e volta (mola)
      const bu = this.bulge; if (bu.v || bu.a) { bu.v += (-bu.a * 120 - bu.v * 9) * dt; bu.a += bu.v * dt; if (Math.abs(bu.a) < 1e-3 && Math.abs(bu.v) < 1e-2) { bu.a = 0; bu.v = 0; }
        const pos = this.backNet.geometry.attributes.position, base = this.netBase; for (let i = 0; i < pos.count; i++) { const x = base[i * 3], y = base[i * 3 + 1], f = Math.exp(-((x - bu.x) ** 2 + (y - bu.y) ** 2) / 0.8); pos.setZ(i, base[i * 3 + 2] + bu.a * f); } pos.needsUpdate = true; }
      if (this.wobble) { const w = this.wobble; w.t += dt; const o = Math.sin(w.t * 60) * 0.03 * Math.max(0, 1 - w.t / 0.4), m = this.posts[w.k]; if (m) { if (w.k === 't') m.position.y = GH + o; else m.position.x = (w.k === 'l' ? -GW : GW) + o; } if (w.t > 0.4) this.wobble = null; }
      for (let i = this.fx.length - 1; i >= 0; i--) { const f = this.fx[i]; f.t += dt; const k = Math.min(1, f.t / f.dur); f.s.scale.setScalar(f.a + (f.b - f.a) * (1 - (1 - k) * (1 - k))); f.s.material.opacity = 1 - k; if (k >= 1) { this.scene.remove(f.s); f.s.material.dispose(); this.fx.splice(i, 1); } }
      if (this.shake > 0) { this.shake -= dt; const a = Math.max(0, this.shake) * 0.25; this.cam.position.set(this.camBase.x + (Math.random() - 0.5) * a, this.camBase.y + (Math.random() - 0.5) * a, this.camBase.z); } else this.cam.position.copy(this.camBase);
    }
  }
  customElements.define('penalty-3d', Penalty3D);
})();
