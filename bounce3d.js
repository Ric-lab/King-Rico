// <bounce-3d> — Fortune Bounce: bola neon quicando por placas num corredor de luzes douradas (three.js).
// 3 pistas. A bola segue o dedo na hora (sem limite). Toda queda é erro de movimento.
// A sorte só escolhe a dificuldade das próximas placas (distância, tamanho, placa que anda), sempre visível de longe.
// Ganchos: window.bounceHooks = { onStart() → bool, decide(n) → 'ok'|'fail', onLand(n, gold), onStopped(), onFall() }
(function () {
  if (customElements.get('bounce-3d')) return;
  const SRC = 'https://unpkg.com/three@0.184.0/build/three.module.js';
  const SAVE = 10, DZ = 4, BR = 0.32, HOP = 1.5, L = 1.6, XMAX = 2.3, PAD = 0.05;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const hook = (n, ...a) => { const h = window.bounceHooks; return h && h[n] ? h[n](...a) : n === 'onStart' ? true : n === 'decide' ? 'ok' : undefined; };
  // plateia de circo (código, sem créditos): arquibancada em degraus, cadeiras vermelhas, público em silhueta colorida, guarda-corpo dourado
  function crowdTex(T) { const W = 512, H = 256, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
    x.fillStyle = '#3a0d22'; x.fillRect(0, 0, W, H); const rows = 5, rh = H / rows, SK = ['#f2c9a0', '#d9a77a', '#a8714a', '#7a4a2a'], SH = ['#e8352b', '#2e7fe0', '#ffd257', '#2ec962', '#c86bff', '#ff8a3a', '#f4f0e6'];
    for (let r = 0; r < rows; r++) { const y0 = r * rh; x.fillStyle = r % 2 ? '#6a1530' : '#7a1a38'; x.fillRect(0, y0, W, rh); x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(0, y0 + rh - 6, W, 6);
      for (let i = 0; i < 14; i++) { const cx = (i + 0.5) * W / 14 + (r % 2 ? 9 : -9) + (Math.random() - 0.5) * 6, by = y0 + rh - 8; if (Math.random() < 0.12) continue;
        x.fillStyle = SH[(i * 3 + r * 5) % SH.length]; x.beginPath(); x.ellipse(cx, by - 6, 13, 14, 0, Math.PI, 0); x.fill(); x.fillRect(cx - 13, by - 6, 26, 6);
        x.fillStyle = SK[(i + r) % SK.length]; x.beginPath(); x.arc(cx, by - 27, 8.5, 0, 7); x.fill(); } }
    x.fillStyle = '#ffd257'; x.fillRect(0, H - 10, W, 4); for (let i = 0; i < 16; i++) x.fillRect(i * W / 16, H - 22, 3, 14); x.fillStyle = '#b8860b'; x.fillRect(0, H - 6, W, 6);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.wrapS = T.RepeatWrapping; t.anisotropy = 8; return t; }
  // lava (código): crosta escura rachada sobre magma laranja/amarelo; anima rolando a textura
  function lavaTex(T) { const S = 512, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, S, S);
    g.addColorStop(0, '#ff5a0a'); g.addColorStop(0.5, '#ffb020'); g.addColorStop(1, '#ff6a10'); x.fillStyle = g; x.fillRect(0, 0, S, S);
    const pts = Array.from({ length: 34 }, () => [Math.random() * S, Math.random() * S]);
    for (const [px, py] of pts) for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { const r = 30 + Math.random() * 34, X = px + ox, Y = py + oy;
      const gr = x.createRadialGradient(X, Y, r * 0.2, X, Y, r); gr.addColorStop(0, '#2a0c06'); gr.addColorStop(0.75, '#4a1606'); gr.addColorStop(0.92, 'rgba(120,30,5,.6)'); gr.addColorStop(1, 'rgba(120,30,5,0)');
      x.fillStyle = gr; x.beginPath(); x.ellipse(X, Y, r, r * (0.7 + Math.random() * 0.4), Math.random() * 3, 0, 7); x.fill(); }
    for (let i = 0; i < 60; i++) { const X = Math.random() * S, Y = Math.random() * S, r = 2 + Math.random() * 4, gr = x.createRadialGradient(X, Y, 0, X, Y, r * 3); gr.addColorStop(0, 'rgba(255,240,150,.9)'); gr.addColorStop(1, 'rgba(255,200,60,0)'); x.fillStyle = gr; x.fillRect(X - r * 3, Y - r * 3, r * 6, r * 6); }
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(10, 12.5); t.anisotropy = 8; return t; }
  function stoneTex(T) { const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'); x.fillStyle = '#9a8c84'; x.fillRect(0, 0, S, S);
    for (let i = 0; i < 900; i++) { const v = 90 + Math.random() * 90; x.fillStyle = 'rgba(' + v + ',' + (v - 8) + ',' + (v - 14) + ',.5)'; const r = 2 + Math.random() * 9; x.beginPath(); x.arc(Math.random() * S, Math.random() * S, r, 0, 7); x.fill(); }
    x.strokeStyle = 'rgba(40,30,28,.55)'; x.lineWidth = 2; for (let i = 0; i < 6; i++) { x.beginPath(); let X = Math.random() * S, Y = Math.random() * S; x.moveTo(X, Y); for (let k = 0; k < 5; k++) { X += (Math.random() - 0.5) * 60; Y += (Math.random() - 0.5) * 60; x.lineTo(X, Y); } x.stroke(); }
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; }
  function groundAlpha(s) { const W = 256, H = 512, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'), img = x.createImageData(W, H), d = img.data;
    const blobs = Array.from({ length: 140 }, () => [Math.random() * W, Math.random() * H, 6 + Math.random() * 22]);
    const n = (u, v) => { let a = 0; for (const [bx, by, r] of blobs) for (const oy of [-H, 0, H]) { const dx = u - bx, dy = v - by - oy; a += Math.exp(-(dx * dx + dy * dy) / (r * r)); } return a; };
    for (let j = 0; j < H; j += 2) for (let i = 0; i < W; i += 2) { const u = s > 0 ? i / W : 1 - i / W, edge = Math.min(1, u / 0.35), v = n(i, j) * 0.55 + edge * 0.9 - 0.35 + Math.sin(j * 0.05 + i * 0.02) * 0.08, a = v > 0.5 ? 255 : 0;
      for (const [di, dj] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const o = ((j + dj) * W + i + di) * 4; d[o] = d[o + 1] = d[o + 2] = a; d[o + 3] = 255; } }
    x.putImageData(img, 0, 0); return c; }
  function glowTex(T, ring) { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    if (ring) { g.addColorStop(0.6, 'rgba(255,220,120,0)'); g.addColorStop(0.78, 'rgba(255,230,150,1)'); g.addColorStop(1, 'rgba(255,210,87,0)'); }
    else { g.addColorStop(0, 'rgba(255,255,235,1)'); g.addColorStop(0.25, 'rgba(255,220,120,.85)'); g.addColorStop(1, 'rgba(255,170,40,0)'); }
    x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new T.CanvasTexture(c); }
  class Bounce3D extends HTMLElement {
    connectedCallback() { if (this._init) return; this._init = true; Object.assign(this.style, { display: 'block', position: 'relative', width: '100%', height: '100%', touchAction: 'none', cursor: 'grab' }); import(SRC).then(T => this.setup(T)); }
    disconnectedCallback() { cancelAnimationFrame(this._raf); if (this._ro) this._ro.disconnect(); }
    setup(T) {
      this.T = T; const r = this.renderer = new T.WebGLRenderer({ antialias: true }); r.setClearColor(0x0c0318, 1);
      r.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block'; r.transmissionResolutionScale = 0.5; this.appendChild(r.domElement);
      const sc = this.scene = new T.Scene(); sc.fog = new T.Fog(0xfcb49a, 22, 66);
      const bg = document.createElement('canvas'); bg.width = 512; bg.height = 900; const bx = bg.getContext('2d'), bgg = bx.createLinearGradient(0, 0, 0, 900);
      bgg.addColorStop(0, '#2a3a8c'); bgg.addColorStop(0.14, '#5a3aa8'); bgg.addColorStop(0.24, '#c0559a'); bgg.addColorStop(0.31, '#f6a070'); bgg.addColorStop(0.4, '#d77aa8'); bgg.addColorStop(0.65, '#7a5ac0'); bgg.addColorStop(1, '#2a3a8c'); bx.fillStyle = bgg; bx.fillRect(0, 0, 512, 900);
      for (let i = 0; i < 90; i++) { const y = Math.random() * 200; bx.fillStyle = 'rgba(255,250,230,' + (0.3 + Math.random() * 0.6) * (1 - y / 230) + ')'; bx.beginPath(); bx.arc(Math.random() * 512, y, Math.random() < 0.1 ? 1.8 : 1, 0, 7); bx.fill(); }
      for (let i = 0; i < 26; i++) { const cy = 360 + Math.random() * 520, cx = Math.random() * 512, s = 30 + (cy - 360) / 520 * 90, g = bx.createRadialGradient(cx, cy, 0, cx, cy, s); g.addColorStop(0, 'rgba(255,225,240,.32)'); g.addColorStop(1, 'rgba(255,225,240,0)'); bx.fillStyle = g; bx.fillRect(cx - s, cy - s, s * 2, s * 2); }
      const bt = new T.TextureLoader().load('assets/bounce/bg.webp'); bt.colorSpace = T.SRGBColorSpace; bt.repeat.set(0.8, 0.8); bt.offset.set(0.1, 0.075); sc.background = bt;
      this.cam = new T.PerspectiveCamera(60, 1, 0.1, 80);
      this.floor = new T.Mesh(new T.PlaneGeometry(10, 200), new T.MeshBasicMaterial({ color: 0x1a0830, transparent: true, opacity: 0.6 })); this.floor.rotation.x = -Math.PI / 2; this.floor.visible = false; this.floor.position.y = -0.4; sc.add(this.floor);
      sc.add(new T.HemisphereLight(0xd0b0ff, 0xff6a20, 1.5)); const dl = new T.DirectionalLight(0xfff0d0, 1.2); dl.position.set(2, 8, 4); sc.add(dl);
      this.light = new T.PointLight(0x7fd8ff, 14, 8, 1.6); sc.add(this.light);
      this.gTex = glowTex(T, false); this.rTex = glowTex(T, true);
      { // ambiente para reflexos (ouro acetinado, esmalte): cúpula roxa + 2 painéis creme (holofotes)
        const es = new T.Scene(), dome = new T.Mesh(new T.SphereGeometry(20, 32, 16), new T.MeshBasicMaterial({ side: T.BackSide, vertexColors: true })), pos = dome.geometry.attributes.position, col = [];
        for (let i = 0; i < pos.count; i++) { const y = pos.getY(i) / 20, c = new T.Color(y > 0 ? 0x5a2a8a : 0x3a1a5a).lerp(new T.Color(0x2a0a48), 1 - Math.abs(y)); col.push(c.r, c.g, c.b); } dome.geometry.setAttribute('color', new T.Float32BufferAttribute(col, 3)); es.add(dome);
        for (const [x, y, z, w] of [[6, 10, 6, 7], [-8, 6, -4, 4]]) { const p = new T.Mesh(new T.PlaneGeometry(w, w * 0.6), new T.MeshBasicMaterial({ color: 0xfff1d0, side: T.DoubleSide })); p.position.set(x, y, z); p.lookAt(0, 0, 0); es.add(p); }
        const pm = new T.PMREMGenerator(r); sc.environment = pm.fromScene(es, 0.04).texture; sc.environmentIntensity = 1.15; pm.dispose(); }
      this.stoneTop = new T.TextureLoader().load('assets/bounce/stone.webp'); this.stoneTop.colorSpace = T.SRGBColorSpace; this.stoneTop.anisotropy = 8;
      this.topM = new T.MeshStandardMaterial({ name: 'pedra-topo', map: this.stoneTop, transparent: true, alphaTest: 0.5, emissive: 0x3ab0ff, emissiveIntensity: 0, roughness: 0.85 });
      this.tileM = new T.MeshStandardMaterial({ name: 'pedra', color: 0x3a2c30, map: stoneTex(T), emissive: 0x3ab0ff, emissiveIntensity: 0, roughness: 0.92, metalness: 0 });
      this.goldM = new T.MeshPhysicalMaterial({ name: 'placa-ouro', color: 0xffc23a, emissive: 0xb86a00, emissiveIntensity: 0.55, roughness: 0.25, metalness: 0.75, clearcoat: 0.6 });
      this.edgeM = new T.LineBasicMaterial({ color: 0x2a1c18, transparent: true, opacity: 0.55 });
      { const s = new T.Shape(), a = 0.5, rr = 0.16; s.moveTo(-a + rr, -a); s.lineTo(a - rr, -a); s.quadraticCurveTo(a, -a, a, -a + rr); s.lineTo(a, a - rr); s.quadraticCurveTo(a, a, a - rr, a); s.lineTo(-a + rr, a); s.quadraticCurveTo(-a, a, -a, a - rr); s.lineTo(-a, -a + rr); s.quadraticCurveTo(-a, -a, -a + rr, -a);
        const g = new T.ExtrudeGeometry(s, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 4, curveSegments: 8 }); g.rotateX(Math.PI / 2); g.translate(0, 0.075, 0); g.computeVertexNormals(); this.boxG = g; }
      this.edgeG = new T.EdgesGeometry(this.boxG, 30);
      const railM = new T.MeshBasicMaterial({ color: 0xffd257 }); this.rails = [-1, 1].map(s => { const m = new T.Mesh(new T.BoxGeometry(0.06, 0.06, 140), railM); m.position.set(s * 3.4, -0.35, 0); sc.add(m); return m; });
      this.stands = []; this.rails.forEach(m => m.visible = false);
      { const ctx = new T.TextureLoader().load('assets/bounce/bank.webp'); ctx.colorSpace = T.SRGBColorSpace; ctx.wrapS = T.RepeatWrapping; ctx.repeat.set(16, 1); const gt = new T.TextureLoader().load('assets/bounce/ground.webp'); gt.colorSpace = T.SRGBColorSpace; gt.wrapS = gt.wrapT = T.RepeatWrapping; gt.repeat.set(10, 16); gt.anisotropy = 8; ctx.anisotropy = 8;
        this.stands = [-1, 1].map(s => { const g = new T.Group(), m = new T.Mesh(new T.PlaneGeometry(128, 2.8), new T.MeshBasicMaterial({ name: 'margem-lava', map: ctx, transparent: true, alphaTest: 0.4, side: T.DoubleSide, fog: true }));
          m.rotation.y = -s * Math.PI / 2; g.add(m); m.visible = false; g.visible = false; const am = new T.CanvasTexture(groundAlpha(s)); am.wrapT = T.RepeatWrapping; am.repeat.set(1, 3);
            const gr = new T.Mesh(new T.PlaneGeometry(80, 128), new T.MeshStandardMaterial({ name: 'chao-pedra', map: gt, alphaMap: am, alphaTest: 0.5, roughness: 0.9, color: 0xb8a8b0 })); gr.rotation.x = -Math.PI / 2; gr.position.set(s * 42, -8.9, 0); g.add(gr); g.position.set(0, 0, 0); sc.add(g); return g; }); }
      { const hc = document.createElement('canvas'); hc.width = 4; hc.height = 256; const hx = hc.getContext('2d'), hg = hx.createLinearGradient(0, 0, 0, 256);
        [[0, 'rgba(250,192,178,0)'], [0.14, 'rgba(250,190,172,.1)'], [0.26, 'rgba(251,184,160,.3)'], [0.36, 'rgba(252,180,154,.6)'], [0.44, 'rgba(252,180,154,.88)'], [0.5, 'rgba(252,180,154,1)'], [0.62, 'rgba(252,174,146,1)'], [0.7, 'rgba(252,166,134,.8)'], [0.8, 'rgba(252,158,124,.45)'], [0.9, 'rgba(252,150,115,.15)'], [1, 'rgba(252,150,115,0)']].forEach(([o, c]) => hg.addColorStop(o, c)); hx.fillStyle = hg; hx.fillRect(0, 0, 4, 256);
        this.haze = new T.Mesh(new T.PlaneGeometry(600, 60), new T.MeshBasicMaterial({ map: (() => { const tx = new T.CanvasTexture(hc); tx.colorSpace = T.SRGBColorSpace; return tx; })(), transparent: true, depthWrite: false, fog: false })); this.haze.renderOrder = 0; sc.add(this.haze); }
      this.lavaT = new T.TextureLoader().load('assets/bounce/lava.webp'); this.lavaT.colorSpace = T.SRGBColorSpace; this.lavaT.wrapS = this.lavaT.wrapT = T.RepeatWrapping; this.lavaT.repeat.set(8, 10); this.lavaT.anisotropy = 8; this.lava = new T.Mesh(new T.PlaneGeometry(160, 200), new T.MeshBasicMaterial({ name: 'lava', map: this.lavaT, fog: true })); this.lava.rotation.x = -Math.PI / 2; this.lava.position.y = -9; sc.add(this.lava);
      this.archM = new T.MeshBasicMaterial({ color: 0xffd257, transparent: true }); this.archG = new T.TorusGeometry(4, 0.07, 8, 48, Math.PI); this.arches = new Map();
      this.ball = new T.Mesh(new T.SphereGeometry(BR, 40, 24), new T.MeshPhysicalMaterial({ name: 'bola-agua', color: 0x9ae6ff, emissive: 0x1a8ad0, emissiveIntensity: 0.35, roughness: 0.04, metalness: 0, transmission: 0.85, thickness: 0.6, ior: 1.33, clearcoat: 1, clearcoatRoughness: 0.02, transparent: true, opacity: 0.95 })); sc.add(this.ball);
      // água de verdade: metaballs (MarchingCubes). Núcleo + 6 gotas presas por molas que atrasam, esticam, fundem e espalham.
      if (this.MC) { const wm = this.ball.material; Object.assign(wm, { roughness: 0.02, metalness: 0, transmission: 1, thickness: 0.6, ior: 1.33, specularIntensity: 1, clearcoat: 1, clearcoatRoughness: 0.03 }); wm.color.setHex(0xe8f8ff); wm.attenuationColor.setHex(0x5cc8ff); wm.attenuationDistance = 1.6; wm.emissive.setHex(0x1a8ae8); wm.needsUpdate = true;
        const S = this.liqS = BR / 0.24, mc = this.mc = new this.MC(26, this.ball.material, false, false, 12000); mc.isolation = 80; mc.scale.setScalar(S); sc.add(mc); this.ball.layers.set(1);
        this.sats = Array.from({ length: 6 }, (_, i) => { const y = 1 - (i + 0.5) / 6 * 2, r = Math.sqrt(1 - y * y), a = i * 2.399; return { b: [Math.cos(a) * r, y * 0.7, Math.sin(a) * r], p: null, v: [0, 0, 0] }; }); }
      this.halo = this.sprite(0.8, 0.18); this.halo.material.color.setHex(0x7fd8ff);
      this.ball.geometry = new T.SphereGeometry(BR, 44, 30); this.ballBase = this.ball.geometry.attributes.position.array.slice(); this.wob = 0;
      Object.assign(this.ball.material, { color: new T.Color(0xb4e8ff), emissive: new T.Color(0x0a6ad0), emissiveIntensity: 0.22, roughness: 0.04, metalness: 0, transmission: 0.85, transparent: false, opacity: 1, thickness: 0.35, ior: 1.33, clearcoat: 1, clearcoatRoughness: 0, attenuationColor: new T.Color(0x3aa8ff), attenuationDistance: 0.8, specularIntensity: 1 });
      { const rimM = new T.ShaderMaterial({ transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.FrontSide, uniforms: { u: { value: 0 } }, vertexShader: 'varying vec3 vN; varying vec3 vV; varying vec3 vP; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); vP = position; gl_Position = projectionMatrix*mv; }', fragmentShader: 'uniform float u; varying vec3 vN; varying vec3 vV; varying vec3 vP; void main(){ float f = pow(1.0 - max(dot(vN, vV), 0.0), 3.2); float n = 0.5 + 0.5*sin(vP.x*38.0 + u*3.0) * sin(vP.y*31.0 - u*4.0) * sin(vP.z*27.0 + u*2.0); n = smoothstep(0.25, 0.85, n); gl_FragColor = vec4(vec3(0.6,0.88,1.0)*f*n*0.9, f*n); }' });
        this.rim = new T.Mesh(this.ball.geometry, rimM); this.rim.scale.setScalar(1.02); this.ball.add(this.rim); }
      { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,.6)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
        this.spec = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(c), transparent: true, depthWrite: false })); this.spec.scale.set(0.16, 0.11, 1); this.scene.add(this.spec); }
      this.dropG = new T.SphereGeometry(0.06, 12, 8); this.dropM = new T.MeshBasicMaterial({ name: 'gota', color: 0xbfefff, transparent: true, opacity: 0.85 }); this.drops = [];
      { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); x.fillStyle = 'rgba(20,60,110,.55)'; for (let i = 0; i < 9; i++) { x.beginPath(); x.ellipse(64 + (Math.random() - .5) * 60, 64 + (Math.random() - .5) * 60, 14 + Math.random() * 18, 10 + Math.random() * 14, Math.random() * 3, 0, 7); x.fill(); } x.beginPath(); x.arc(64, 64, 34, 0, 7); x.fill(); this.wetTex = new T.CanvasTexture(c); }
      { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(0,0,0,.9)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
        this.shadow = new T.Mesh(new T.PlaneGeometry(0.75, 0.75), new T.MeshBasicMaterial({ map: new T.CanvasTexture(c), transparent: true, depthWrite: false })); this.shadow.rotation.x = -Math.PI / 2; this.shadow.renderOrder = 1; sc.add(this.shadow); } this.trail = Array.from({ length: 7 }, (_, i) => this.sprite(0.6 - i * 0.06, 0.28 - i * 0.035));
      this.caustic = new T.Mesh(new T.PlaneGeometry(0.42, 0.42), new T.MeshBasicMaterial({ map: this.gTex, color: 0xbff0ff, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending })); this.caustic.rotation.x = -Math.PI / 2; sc.add(this.caustic);
      this.fx = []; this.rows = new Map();
      const fit = () => { const w = this.clientWidth || 453, h = this.clientHeight || 802, s = this.getBoundingClientRect().width / w || 1;
        r.setPixelRatio(Math.min(2.5, (window.devicePixelRatio || 1) * s)); r.setSize(w, h, false); this.cam.aspect = w / h; this.cam.updateProjectionMatrix(); this.W = w; };
      fit(); this._ro = new ResizeObserver(fit); this._ro.observe(this);
      this.addEventListener('pointerdown', e => this.down(e)); this.addEventListener('pointermove', e => this.move(e)); this.addEventListener('pointerup', e => { if (this.drag && e.pointerId === this.drag.id) this.drag = null; }); this.addEventListener('pointercancel', e => { if (this.drag && e.pointerId === this.drag.id) this.drag = null; });
      this.reset(); let last = performance.now();
      const tick = now => { const dt = Math.min(0.05, (now - last) / 1000); last = now; try { this.update(dt, now / 1000); } catch (e) { if (!this._errd) { this._errd = 1; console.error('bounce update', e); window.__bErr = e.stack; } } r.render(sc, this.cam); this._raf = requestAnimationFrame(tick); };
      this._raf = requestAnimationFrame(tick); window.Bounce3D = this;
    }
    sprite(s, op) { const T = this.T, m = new T.Sprite(new T.SpriteMaterial({ map: this.gTex, blending: T.AdditiveBlending, transparent: true, depthWrite: false, opacity: op })); m.scale.setScalar(s); m.userData.op = op; this.scene.add(m); return m; }
    local(e) { const rc = this.getBoundingClientRect(); return (e.clientX - rc.left) * (this.W || 453) / rc.width; }
    // arrasto relativo e incremental: sem teleporte ao tocar, sem tranco ao recolocar o dedo, inversão imediata na borda; ~1:1 com a pista na tela
    down(e) { if (this.drag) return; try { this.setPointerCapture(e.pointerId); } catch (x) {} this.drag = { id: e.pointerId, lx: this.local(e) };
      if (this.state === 'idle' && hook('onStart')) { this.state = 'run'; this.startHop(0); } }
    move(e) { const d = this.drag; if (!d || e.pointerId !== d.id) return; const x = this.local(e), dx = x - d.lx; d.lx = x; if (this.state !== 'run') return; this.tx = clamp(this.tx + dx * 0.016, -XMAX, XMAX); if (Math.abs(dx) > 2 && !this._dragged) { this._dragged = true; hook('onDrag'); } }
    // DIFICULDADE SOB DEMANDA (visível de longe): cada fileira sorteia fácil/médio/difícil; difícil fica mais comum e mais duro com a distância (quase impossível ~35ª).
    // assinatura: coroa gravada no centro da placa, acende no impacto
    crownTex() { if (this._crown) return this._crown; const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); x.strokeStyle = '#fff'; x.fillStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 7; x.lineJoin = 'round';
      x.beginPath(); x.moveTo(24, 92); x.lineTo(18, 40); x.lineTo(44, 64); x.lineTo(64, 30); x.lineTo(84, 64); x.lineTo(110, 40); x.lineTo(104, 92); x.closePath(); x.fill(); x.stroke(); x.beginPath(); x.moveTo(26, 104); x.lineTo(102, 104); x.stroke();
      for (const [px, py] of [[18, 40], [64, 30], [110, 40]]) { x.beginPath(); x.arc(px, py, 7, 0, 7); x.fillStyle = '#fff'; x.fill(); }
      return this._crown = new this.T.CanvasTexture(c); }
    makeRow(k) { const T = this.T, g = new T.Group(); g.position.z = -k * DZ; this.scene.add(g);
      // PROGRESSÃO ORGANIZADA: 2 faixas → 5 (a cada 10 placas +1); placas grandes até a 25ª; móveis (azuis) a partir da 26ª; menores só nas normais a partir da 41ª
      const nL = k < 20 ? 2 : k < 50 ? 3 : k < 90 ? 4 : 5, sp = [0, 0, 1.7, 1.7, 1.3, 1.1][nL], LX = i => (i - (nL - 1) / 2) * sp;
      const prev = this.rows.get(k - 1), px = prev ? prev.cx : 0; let pl = 0, bd = 1e9; for (let i = 0; i < nL; i++) { const d = Math.abs(LX(i) - px); if (d < bd) { bd = d; pl = i; } }
      const far = k >= 70 && Math.random() < clamp(0.1 + (k - 70) * 0.003, 0, 0.4), step = far ? (nL >= 5 && k >= 160 && Math.random() < 0.3 ? 3 : 2) : Math.random() < (k < 20 ? 0.45 : clamp(0.32 - k * 0.0012, 0.05, 0.32)) ? 0 : 1, opts = [pl - step, pl + step].filter(l => l >= 0 && l < nL), lane = k === 0 ? 0 : opts.length ? opts[Math.floor(Math.random() * opts.length)] : pl;
      let cx = k === 0 ? 0 : LX(lane);
      const lv = k < 40 ? -1 : k < 120 ? 0 : k < 200 ? 1 : 2, slide = lv >= 0 && Math.random() < [0.15, 0.28, 0.4][lv] ? { amp: sp * [0.5, 0.6, 1][lv], w: [0.8, 1.4, 1.8][lv], ph: Math.random() * 6.28 } : null;
      const sl = k < 110 ? -1 : k < 180 ? 0 : k < 260 ? 1 : 2, small = sl >= 0 && !slide && Math.random() < [0.25, 0.45, 0.7][sl], ts = small ? [1.1, 0.9, 0.7][sl] : 1.5;
      const save = k > 0 && k % SAVE === 0; if (save && slide) slide.amp = 0; const gold = !save && !small && !(slide && slide.amp > 0) && k >= 3 && Math.random() < 1 / 25, size = k === 0 ? 2.4 : (save || gold || (slide && slide.amp > 0)) ? 1.5 : ts;
      const TINT = gold ? [0xffcf40, 0xffb020, 0.85] : save ? [0x5cff9e, 0x12b060, 0.45] : (slide && slide.amp > 0) ? [0x86c0ff, 0x2a6ad8, 0.4] : null, tint = TINT && TINT[0], t = new T.Group(), m = new T.Mesh(this.boxG, this.tileM.clone()); if (tint) { m.material.color.setHex(tint).multiplyScalar(0.7); m.material.emissive.setHex(TINT[1]); m.material.emissiveIntensity = TINT[2] * 0.6; } m.position.y = -0.125; t.add(m);
      const ed = new T.LineSegments(this.edgeG, this.edgeM); ed.position.y = -0.125; ed.visible = false; t.add(ed);
      let top = null; { top = new T.Mesh(this.topG || (this.topG = new T.PlaneGeometry(1.1, 1.1)), this.topM.clone()); top.rotation.x = -Math.PI / 2; top.position.y = 0.006; if (tint) { top.material.color.setHex(tint); top.material.emissive.setHex(TINT[1]); top.material.emissiveIntensity = TINT[2]; if (gold) { top.material.color.setRGB(2.6, 2.0, 0.6); top.material.metalness = 0.2; top.material.roughness = 0.22; m.material.color.setRGB(2.0, 1.45, 0.35);
        const gl = new T.Sprite(new T.SpriteMaterial({ map: this.gTex, color: 0xffd257, blending: T.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.55 })); gl.scale.set(1.8, 0.9, 1); gl.position.y = 0.25; gl.userData.goldGlow = true; t.add(gl); } } t.add(top); }
      const dm = new T.Mesh(this.diaG || (this.diaG = new T.PlaneGeometry(0.5, 0.5)), new T.MeshBasicMaterial({ map: this.crownTex(), color: 0xe8c98a, transparent: true, opacity: 0.32, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 })); dm.rotation.set(-Math.PI / 2, 0, 0); dm.position.y = 0.03; dm.renderOrder = 2; t.add(dm); t.scale.set(size, 1, size); t.position.x = cx; g.add(t);
      let arrows = null; if (slide && slide.amp > 0) { if (!this.arrTex) { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const gr = x.createLinearGradient(0, 0, 128, 0); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, 'rgba(255,226,122,.55)'); x.lineCap = 'round'; x.lineJoin = 'round'; x.shadowColor = 'rgba(255,220,120,.95)'; x.shadowBlur = 16; x.strokeStyle = gr; x.lineWidth = 15;
          for (const ox of [0, 40]) { x.beginPath(); x.moveTo(58 + ox, 24); x.lineTo(20 + ox, 64); x.lineTo(58 + ox, 104); x.stroke(); } this.arrTex = new T.CanvasTexture(c); this.arrTex.colorSpace = T.SRGBColorSpace; }
        arrows = [-1, 1].map(sd => { const s = new T.Mesh(this.arrG || (this.arrG = new T.PlaneGeometry(0.8, 0.8)), new T.MeshBasicMaterial({ map: this.arrTex, transparent: true, depthWrite: false, fog: false })); s.rotation.x = -Math.PI / 2; s.scale.x = -sd; s.position.y = 0.03; s.renderOrder = 2; g.add(s); s.userData.sd = sd; return s; }); }
      const row = { k, g, t, m, top, dm, cx, arrows, save, tintE: TINT ? TINT[2] : 0, lane, ts: size, gold, flash: 0, slide }; this.rows.set(k, row); return row; }
    ensure(k) { for (let i = Math.max(0, k - 2); i <= k + 14; i++) if (!this.rows.has(i)) this.makeRow(i);
      for (const [i, r] of this.rows) if (i < k - 2) { this.scene.remove(r.g); r.m.material.dispose(); if (r.top) r.top.material.dispose(); this.rows.delete(i); }
      const a0 = Math.floor(k / 3); if (false) for (let a = a0 - 1; a <= a0 + 6; a++) if (!this.arches.has(a)) { const T = this.T, g = new T.Group(); g.position.set(0, -0.35, -a * 12 - 2); g.add(new T.Mesh(this.archG, this.archM.clone()));
          for (let i = 0; i <= 10; i++) { const an = i / 10 * Math.PI, s = new T.Sprite(new T.SpriteMaterial({ map: this.gTex, blending: T.AdditiveBlending, transparent: true, depthWrite: false })); s.scale.setScalar(0.55); s.position.set(Math.cos(an) * 4, Math.sin(an) * 4, 0); g.add(s); }
          this.scene.add(g); this.arches.set(a, g); }
      for (const [a, g] of this.arches) if (a < a0 - 1) { this.scene.remove(g); this.arches.delete(a); } }
    reset() { for (const [, r] of this.rows) this.scene.remove(r.g); this.rows.clear(); for (const [, g] of this.arches) this.scene.remove(g); this.arches.clear();
      this.k = 0; this.streak = 0; if (this.ball) this.ball.visible = true; this.bx = this.tx = 0; this.bz = 0; this.by = BR; this.vy = 0; this.state = 'idle'; this.hop = null; this.idleT = 0; this.stopReq = false; this.ensure(0); this.ball.visible = true; }
    stop() { if (this.state === 'run') this.stopReq = true; }
    startHop(k) { const dur = Math.max(0.36, 0.72 - k * 0.0012); this.hop = { k, t: 0, dur }; this.ensure(k + 1); }
    splash(row, noPud) { const T = this.T, n = 18; this.wob = 1; this.wobT = 0;
      if (!noPud) { if (!this.pudG) { const g = new T.CircleGeometry(0.34, 48), p = g.attributes.position; for (let i = 1; i < p.count; i++) { const a = Math.atan2(p.getY(i), p.getX(i)), r = 1 + 0.16 * Math.sin(a * 3 + 1) + 0.1 * Math.sin(a * 5 + 2) + 0.06 * Math.sin(a * 9); p.setXY(i, p.getX(i) * r, p.getY(i) * r); } g.rotateX(-Math.PI / 2); this.pudG = g; this.puddles = []; }
        const m = new T.Mesh(this.pudG, new T.MeshPhysicalMaterial({ color: 0xb4e8ff, emissive: 0x0a6ad0, emissiveIntensity: 0.25, roughness: 0.05, transparent: true, opacity: 0.45, depthWrite: false })); m.rotation.y = Math.random() * 6.28; m.position.set(this.bx - row.g.position.x, row.t.position.y + 0.015, 0); row.g.add(m); this.puddles.push({ m, row, t: 0 }); }
      { const cm = new T.Mesh(this.crownG || (this.crownG = new T.CylinderGeometry(1, 0.8, 1, 40, 1, true)), new T.MeshBasicMaterial({ color: 0xcff4ff, transparent: true, opacity: 0.75, side: T.DoubleSide, depthWrite: false })); cm.position.set(this.bx, 0, -(this.hop.k + 1) * DZ); this.scene.add(cm); this.crowns = this.crowns || []; this.crowns.push({ m: cm, t: 0 }); }
      for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + Math.random() * 0.4, sp = 1.6 + Math.random() * 1.8, m = new T.Mesh(this.dropG, this.dropM); m.scale.setScalar(0.5 + Math.random() * 0.9);
        m.position.set(this.bx, 0.1, -(this.hop.k + 1) * DZ); this.scene.add(m); this.drops.push({ m, vx: Math.cos(a) * sp, vz: Math.sin(a) * sp * 0.7, vy: 2.6 + Math.random() * 2.6, t: 0, s: m.scale.x }); }
      if (row.wet) { row.t.remove(row.wet.m); row.wet.m.material.dispose(); } const wet = new T.Mesh(this.wetG || (this.wetG = new T.PlaneGeometry(0.9, 0.9)), new T.MeshBasicMaterial({ map: this.wetTex, transparent: true, depthWrite: false, opacity: 0.8 })); wet.rotation.set(-Math.PI / 2, 0, Math.random() * 6); wet.position.set((this.bx - row.t.position.x), 0.008, 0); row.t.add(wet); row.wet = { m: wet, t: 0 };
      hook('sfx', 'splash'); }
    land() { const k = this.hop.k + 1, row = this.rows.get(k); this.bz = -k * DZ; const hit = Math.abs(this.bx - row.t.position.x) < row.ts / 2 + BR * 0.85 + PAD;
      if (!hit) return this.fall();
      this.k = k; this.splash(row); row.flash = 1; row.crown = 1; row.sink = 1; row.lit = true; row.tilt = clamp((this.bx - row.t.position.x) / (row.ts / 2), -1, 1); const perfect = Math.abs(this.bx - row.t.position.x) < row.ts * 0.16; if (perfect) { this.streak = (this.streak || 0) + 1; row.perfect = 1; } else this.streak = 0; row.lit = true; this.squash = 1; this.ring(row); if (perfect) this.ring(row, true);
      hook('onLand', k, row.gold, perfect, this.streak, row.save);
      if (this.stopReq) { this.state = 'stopped'; this.hop = null; hook('onStopped'); return; }
      this.startHop(k); }
    ring(row, white) { const T = this.T, s = new T.Sprite(new T.SpriteMaterial({ map: this.rTex, blending: T.AdditiveBlending, transparent: true, depthWrite: false, color: white ? 0xffffff : row.gold ? 0xffe680 : 0x8ae0ff }));
      s.position.set(row.t.position.x, 0.05, row.g.position.z); this.scene.add(s); this.fx.push({ s, t: 0, big: white ? 1.6 : row.gold ? 4 : 2.6 }); }
    fall() { this.state = 'fall'; this.hop = null; this.vy = 0; this.fallT = 0; this.stopReq = false; this.steamed = false; }
    steam() { const T = this.T; for (let i = 0; i < 9; i++) { const s = new T.Sprite(new T.SpriteMaterial({ map: this.gTex, color: 0xe8e4f0, transparent: true, depthWrite: false, opacity: 0.8 })); s.position.set(this.bx + (Math.random() - 0.5) * 0.6, -8.7, this.bz + (Math.random() - 0.5) * 0.6); this.scene.add(s); this.fx.push({ s, t: -i * 0.04, big: 2 + Math.random() * 1.5, rise: 1.5 + Math.random() }); } hook('sfx', 'sizzle'); }
    updateLiquid(dt, t) { const mc = this.mc; if (!mc) return; const B = this.ball; mc.visible = B.visible; if (this.rim) this.rim.visible = false; if (!B.visible) return;
      const S = this.liqS, sx = S * B.scale.x, sy = S * B.scale.y, sz = S * B.scale.z, c = B.position; mc.position.copy(c); mc.scale.set(sx, sy, sz);
      const air = (this.tailL || 0) > 0.12, wob = this.wob || 0, splat = wob > (this._pw || 0) + 0.3; this._pw = wob; const floorY = c.y - BR * 0.9 * B.scale.y;
      mc.reset(); mc.addBall(0.5, 0.5, 0.5, 0.78, 12); if (splat) this._spT = 0.5; this._spT = Math.max(0, (this._spT || 0) - dt); const kk = air ? 140 : 55, h = Math.min(dt, 0.033);
      this.sats.forEach((s, i) => { const a = t * (0.25 + i * 0.04), ca = Math.cos(a), sa = Math.sin(a); let dx = s.b[0] * ca - s.b[2] * sa, dz = s.b[0] * sa + s.b[2] * ca, dy = s.b[1] + 0.25 * Math.sin(t * 0.5 + i * 1.7);
        const L = Math.hypot(dx, dy, dz) || 1, dist = BR * (air ? 0.35 : 0.72 + 0.22 * Math.sin(t * 0.9 + i * 1.3)), T0 = [c.x + dx / L * dist, c.y + dy / L * dist, c.z + dz / L * dist];
        if (!s.p) s.p = T0.slice(); if (splat) { const hz = Math.hypot(dx, dz) || 1; s.v[0] += dx / hz * 2.2; s.v[2] += dz / hz * 2.2; s.v[1] -= 1.2; }
        for (let j = 0; j < 3; j++) { s.v[j] += (kk * (T0[j] - s.p[j]) - 7 * s.v[j]) * h; s.p[j] += s.v[j] * h; }
        if (!air && this._spT > 0 && s.p[1] < floorY) { s.p[1] = floorY; s.v[1] = Math.max(0, s.v[1]); }
        const ox = s.p[0] - c.x, oy = s.p[1] - c.y, oz = s.p[2] - c.z, od = Math.hypot(ox, oy, oz), mx = 2.5 * BR; if (od > mx) { const f = mx / od; s.p[0] = c.x + ox * f; s.p[1] = c.y + oy * f; s.p[2] = c.z + oz * f; }
        const n = v => clamp(v, 0.05, 0.95); mc.addBall(n(0.5 + (s.p[0] - c.x) / sx / 2), n(0.5 + (s.p[1] - c.y) / sy / 2), n(0.5 + (s.p[2] - c.z) / sz / 2), 0.26 + 0.06 * Math.sin(t * 1.1 + i * 2.1), 12); });
      mc.update(); }
    update(dt, t) {
      this.bx += (this.tx - this.bx) * Math.min(1, dt * 45);
      if (this.state === 'idle') { const P = 1.7, p0 = this.idleT % P; this.idleT += dt; const u = (this.idleT % P) / P; this.by = BR + (u < 0.42 ? Math.sin(u / 0.42 * Math.PI) * 0.22 : 0); this.bz = 0;
        if (p0 / P < 0.42 && u >= 0.42) { this.squash = 1; const r0 = this.rows.get(0); if (r0) this.splash(r0, true); else { this.wob = 1; this.wobT = 0; } } }
      else if (this.hop) { const h = this.hop; h.t += dt; const u = Math.min(1, h.t / h.dur); this.bz = -(h.k + u) * DZ; this.by = BR + Math.sin(u * Math.PI) * HOP;
        if (u >= 1) { this.by = BR; this.land(); } }
      else if (this.state === 'stopped') this.by += (BR + 0.9 - this.by) * Math.min(1, dt * 4);
      else if (this.state === 'fall') { this.fallT += dt; this.vy -= 22 * dt; this.by += this.vy * dt; this.bz -= dt * 0.8; if (!this.steamed && this.by < -8.6) { this.steamed = true; this.steam(); this.shakeT = 0.5; hook('onSteam'); this.ball.visible = false; } if (this.fallT > 1.4 && !this.fallDone) { this.fallDone = true; hook('onFall'); } }
      if (this.state !== 'fall') this.fallDone = false;
      this.squash = Math.max(0, (this.squash || 0) - dt * 4.2); { const raw = clamp((this.by - (this._pby ?? this.by)) / Math.max(dt, 1e-3), -12, 12); this.vyb = (this.vyb || 0) + (raw - (this.vyb || 0)) * Math.min(1, dt * 12); } this._pby = this.by; this.wobT = (this.wobT ?? 9) + dt;
      const st = 1 + clamp(Math.abs(this.vyb) * 0.025, 0, 0.2), jig = 0.3 * Math.exp(-this.wobT * 3.2) * Math.cos(this.wobT * 17), sq = (1 - 0.52 * Math.sin(Math.min(1, this.squash) * Math.PI / 2)) * st * (1 + jig), wq = 1 / Math.sqrt(sq); this.ball.scale.set(wq, sq, wq);
      { const T = this.T, air = this.hop && this.state === 'run' && this.by > BR + 0.05, vz = this.hop ? -DZ / this.hop.dur : 0, vy = this.vyb || 0, lx = clamp((this.tx - this.bx) * 3, -3, 3), bzv = vz * 0.15, sp = Math.hypot(lx, vy, bzv) || 1;
        this.back = [-lx / sp, -vy / sp, -bzv / sp]; this.tailL = (this.tailL || 0) + ((air ? clamp(sp * 0.07, 0, 0.9) : 0) - (this.tailL || 0)) * Math.min(1, dt * 10); const tl = this.tailL;
        if (!this.drips) { this.drips = []; this.dripG = new T.SphereGeometry(0.07, 10, 8); this.dripM = new T.MeshPhysicalMaterial({ color: 0xcdeeff, emissive: 0x3aa8ff, emissiveIntensity: 0.25, roughness: 0.05, transparent: true, opacity: 0.55, depthWrite: false }); }
        this.dripT = (this.dripT || 0) - dt; if (false && air && this.dripT <= 0) { this.dripT = 0.12 + Math.random() * 0.1; const m = new T.Mesh(this.dripG, this.dripM), o = BR * (1 + tl * 0.8);
          m.position.set(this.bx + (Math.random() - 0.5) * 0.12, this.by + this.back[1] * o, this.bz + this.back[2] * o); m.scale.setScalar(0.5 + Math.random() * 0.7); this.scene.add(m); this.drips.push({ m, t: 0, vy: vy * 0.3, vz: vz * 0.15, s: m.scale.x }); }
        if (!this.beads) this.beads = [0, 1, 2].map(i => { const m = new T.Mesh(this.dripG, this.dripM); m.scale.setScalar(0.9 - i * 0.25); this.scene.add(m); return m; });
        this.beads.forEach((m, i) => { const o = BR * (1.05 + i * 0.55), w = Math.sin(t * 6 + i) * 0.03; m.visible = false; m.position.set(this.bx + this.back[0] * o + w, this.by + this.back[1] * o, this.bz + this.back[2] * o); m.scale.setScalar((0.95 - i * 0.25) * clamp(tl * 2, 0, 1)); });
        for (let i = this.drips.length - 1; i >= 0; i--) { const q = this.drips[i]; q.t += dt; q.vy -= 14 * dt; q.m.position.y += q.vy * dt; q.m.position.z += q.vz * dt; q.m.scale.setScalar(q.s * Math.max(0, 1 - q.t / 0.45)); q.m.scale.y *= 1 + Math.min(0.8, Math.abs(q.vy) * 0.08); if (q.t > 0.45) { this.scene.remove(q.m); this.drips.splice(i, 1); } } }
      if (this.shadow) { const h = Math.max(0, this.by - BR), a = this.state === 'fall' ? 0 : 1; this.shadow.position.set(this.bx, 0.02 + (this.rows.get(this.hop ? this.hop.k + (this.by < BR + 0.4 && (this.hop.t / this.hop.dur) > 0.5 ? 1 : 0) : this.k)?.t.position.y || 0), this.bz); this.shadow.scale.setScalar(0.9 + h * 0.35); this.shadow.material.opacity = a * clamp(0.6 - h * 0.28, 0.12, 0.6); }
      this.ball.rotation.set(0, 0, 0);
      // gota em superfície hidrorrepelente: assentada, achatada, base plana, topo balança como gelatina
      { const on = this.state === 'idle' || this.state === 'stopped' || (this.state !== 'fall' && this.by < BR + 0.04); this.rs = (this.rs ?? 1) + ((on ? 1 : 0) - (this.rs ?? 1)) * Math.min(1, dt * 12); }
      const rs = this.rs, bsy = 1, bsx = 1, bBase = -BR, sway = 0, swz = 0;
      { this.wob = Math.max(0, this.wob - dt * 1.8); const p = this.ball.geometry.attributes.position, b = this.ballBase, A = 0.04 * this.wob;
        // lóbulos que passeiam pela superfície: uns estufam, outros afundam (gelatina viva)
        const airK = 1 - 0.7 * clamp(((this.tailL || 0) - 0.05) * 4, 0, 1) || 1, BL = [0, 1, 2, 3, 4, 5, 6].map(k => { const a = t * (0.22 + k * 0.06) + k * 1.9, c = Math.cos(t * (0.17 + k * 0.05) + k * 2.7); return [Math.sin(a) * Math.sqrt(1 - c * c), c, Math.cos(a) * Math.sqrt(1 - c * c), 0]; });
        for (let i = 0; i < p.count; i++) { const x = b[i * 3], y = b[i * 3 + 1], z = b[i * 3 + 2], nx = x / BR, ny = y / BR, nz = z / BR, f = 1 + A * (0.55 * Math.sin(t * 2.6) * (1.5 * ny * ny - 0.5) + 0.45 * Math.sin(t * 3.2 + 1) * 2 * nx * nz + 0.3 * Math.sin(t * 2.1 + 2) * (nx * nx - nz * nz) + 0.18 * Math.sin(t * 4.3 + 3) * ny * (2.5 * ny * ny - 1.5)) - (ny < 0 ? 0.12 * ny * ny * ny * ny : 0) + BL.reduce((s, q) => s + q[3] * Math.exp(-(1 - (nx * q[0] + ny * q[1] + nz * q[2])) * 7), 0)
            + 0, Bk = this.back || [0, 0, 0], tl = this.tailL || 0, d = Math.max(0, nx * Bk[0] + ny * Bk[1] + nz * Bk[2]), pull = 0, pin = 1;
          const px = x * f, py = y * f, pz = z * f, dd = px * Bk[0] + py * Bk[1] + pz * Bk[2]; let X = (px - dd * Bk[0]) * pin + dd * Bk[0] + Bk[0] * pull, Y = (py - dd * Bk[1]) * pin + dd * Bk[1] + Bk[1] * pull, Z = (pz - dd * Bk[2]) * pin + dd * Bk[2] + Bk[2] * pull;
          const hgt = clamp((Y + BR) / (2 * BR), 0, 1.3), flat = Math.min(1, (this.squash || 0) * 1.4); if (flat > 0 && ny < -0.25) { const k = (-0.25 - ny) / 0.75; Y = Y + (-BR * 0.82 - Y) * flat * k; X *= 1 + 0.22 * flat * k; Z *= 1 + 0.22 * flat * k; } X += sway * hgt * hgt; Z += swz * hgt * hgt; p.setXYZ(i, X, Y, Z); } p.needsUpdate = true; this.ball.geometry.computeVertexNormals(); this.ball.position.set(this.bx, this.by - BR - bBase * this.ball.scale.y, this.bz);
        if (this.caustic) { this.caustic.position.set(this.bx + 0.04, (this.shadow ? this.shadow.position.y : 0) + 0.006, this.bz + 0.03); this.caustic.material.opacity = 0.75 * rs * (this.ball.visible ? 1 : 0); this.caustic.scale.setScalar(0.85 + 0.1 * Math.sin(t * 3.1)); } }
      if (this.puddles) for (let i = this.puddles.length - 1; i >= 0; i--) { const q = this.puddles[i]; q.t += dt; const k = q.t; q.m.position.y = q.row.t.position.y + 0.015; const s = k < 0.12 ? 0.4 + 0.8 * (k / 0.12) : 1.2 - 0.4 * (k - 0.12) / 0.8; q.m.scale.set(s, 1, s); q.m.material.opacity = 0.45 * Math.max(0, 1 - Math.max(0, k - 0.25) / 0.65);
        if (k > 0.9) { q.row.g.remove(q.m); q.m.material.dispose(); this.puddles.splice(i, 1); } }
      if (this.rim) this.rim.material.uniforms.u.value = t; this.spec.position.set(this.bx - BR * 0.35, this.by + BR * 0.45, this.bz + BR * 0.9); this.spec.visible = this.ball.visible;
      if (this.crowns) for (let i = this.crowns.length - 1; i >= 0; i--) { const c = this.crowns[i]; c.t += dt; const k = Math.min(1, c.t / 0.42), r = 0.18 + 0.5 * Math.sqrt(k), h = 0.32 * Math.sin(k * Math.PI); c.m.scale.set(r, Math.max(0.01, h), r); c.m.position.y = h / 2; c.m.material.opacity = 0.75 * (1 - k); if (k >= 1) { this.scene.remove(c.m); c.m.material.dispose(); this.crowns.splice(i, 1); } }
      for (let i = this.drops.length - 1; i >= 0; i--) { const d = this.drops[i]; d.t += dt; d.vy -= 14 * dt; d.m.position.x += d.vx * dt; d.m.position.y += d.vy * dt; d.m.position.z += d.vz * dt;
        { const v = this._dv || (this._dv = new this.T.Vector3()), up = this._up || (this._up = new this.T.Vector3(0, 1, 0)); v.set(d.vx, d.vy, d.vz); const L = v.length(); v.divideScalar(L || 1); d.m.quaternion.setFromUnitVectors(up, v); d.m.scale.set(d.s, d.s * (1 + L * 0.35), d.s); }
        if (d.m.position.y < -0.05 && d.t > 0.25 || d.t > 1.6) { this.scene.remove(d.m); this.drops.splice(i, 1); } }
      for (const [, r] of this.rows) if (r.wet) { r.wet.t += dt; r.wet.m.material.opacity = Math.max(0, 0.8 - r.wet.t * 0.35); if (r.wet.t > 2.4) { r.t.remove(r.wet.m); r.wet.m.material.dispose(); r.wet = null; } } this.halo.position.copy(this.ball.position); this.light.position.set(this.bx, this.by + 0.6, this.bz);
      const pulse = this.state === 'stopped' ? 1 + Math.sin(t * 6) * 0.15 : 1; this.halo.scale.setScalar(1.1 * pulse);
      for (let i = this.trail.length - 1; i > 0; i--) this.trail[i].position.copy(this.trail[i - 1].position); this.trail[0].position.copy(this.ball.position);
      const fv = this.state === 'fall' ? Math.max(0, 1 - this.fallT * 1.4) : 1; [this.halo, ...this.trail].forEach(s => s.material.opacity = s.userData.op * fv); this.ball.material.emissiveIntensity = 0.12 * Math.max(0.2, fv);
      for (const [, r] of this.rows) if (r.slide && !(r.k === this.k && this.state === 'stopped')) r.t.position.x = r.cx + Math.sin(t * r.slide.w + r.slide.ph) * r.slide.amp;
      for (const [, r] of this.rows) if (r.arrows) { const vis = !r.lit; r.arrows.forEach(s => { s.visible = vis; s.position.x = r.t.position.x + s.userData.sd * (r.ts / 2 + 0.5 + 0.1 * Math.sin(t * 6)); s.position.y = r.t.position.y + 0.03; s.material.opacity = 0.65 + 0.35 * Math.sin(t * 6); }); }
      for (const [, r] of this.rows) if (r.perfect || r.crown) { r.perfect = Math.max(0, (r.perfect || 0) - dt * 1.5); r.crown = Math.max(0, (r.crown || 0) - dt * 2.2); r.dm.material.opacity = Math.min(1, 0.32 + r.crown * 0.45 + r.perfect * 0.5); r.dm.material.color.setHex(r.crown > 0.05 || r.perfect > 0.05 ? 0xfff3c4 : 0xe8c98a); r.dm.scale.setScalar(1 + r.perfect * 0.9); }
      for (const [, r] of this.rows) if (r.k < this.k && r.lit && !r.drop) r.drop = { v: 0, t: 0 };
      for (const [, r] of this.rows) if (r.drop) { const d = r.drop; d.t += dt; if (d.t > 0.15) { d.v -= 14 * dt; r.t.position.y += d.v * dt; r.t.rotation.x += dt * 1.2; r.m.material.transparent = true; r.m.material.opacity = Math.max(0, 1 - (d.t - 0.15) * 1.6); } }
      for (const [, r] of this.rows) if (r.sink) { r.sink = Math.max(0, r.sink - dt * 3.2); const q = 1 - r.sink; r.t.position.y = -0.22 * Math.sin(q * Math.PI) * (1 - q * 0.4); r.t.rotation.z = -(r.tilt || 0) * 0.16 * Math.sin(q * Math.PI) * (1 - q * 0.5); if (!r.sink) { r.t.position.y = 0; r.t.rotation.z = 0; } }
      for (const [, r] of this.rows) if (r.flash > 0) { r.flash = Math.max(0, r.flash - dt * 1.6); r.m.material.emissiveIntensity = r.tintE * 0.6 + r.flash * 1.2; if (r.top) r.top.material.emissiveIntensity = r.tintE + r.flash * 0.9; if (!r.gold) r.m.material.emissive.setHex(0x3ab0ff); }
      for (let i = this.fx.length - 1; i >= 0; i--) { const f = this.fx[i]; f.t += dt; if (f.rise && f.t > 0) f.s.position.y += f.rise * dt; const k = Math.min(1, f.t / 0.45); f.s.scale.setScalar(0.6 + f.big * k); f.s.material.opacity = 1 - k; if (k >= 1) { this.scene.remove(f.s); f.s.material.dispose(); this.fx.splice(i, 1); } }
      this.updateLiquid(dt, t); if (this.state !== 'fall') this._camZ = Math.min(this.bz, 0) + 5; const cz = this._camZ ?? 5; this.lookY = (this.lookY ?? 0.2) + (((this.state === 'fall' ? Math.max(-1.2, this.by * 0.25) : 0.2)) - (this.lookY ?? 0.2)) * Math.min(1, dt * 4); this.shakeT = Math.max(0, (this.shakeT || 0) - dt); const sk = this.shakeT * 0.35; this.cam.position.set(this.bx * 0.6 + (Math.random() - 0.5) * sk, 2.6 + (Math.random() - 0.5) * sk, cz); this.cam.lookAt(this.bx * 0.6, this.lookY, cz - 11);
      for (const g of this.arches.values()) { const d = cz - g.position.z; g.visible = d > 3.5; const f = clamp((d - 3.5) / 4, 0, 1); g.children.forEach(c => { if (c.material) c.material.opacity = f; }); }
      this.rails.forEach(m => m.position.z = cz - 60); if (this.stands) this.stands.forEach(g => g.position.z = Math.round((cz - 60) / 16) * 16); this.floor.position.z = cz - 90; if (this.haze) this.haze.position.set(this.bx * 0.6, -6, cz - 72); if (this.lava) { this.lava.position.set(this.bx * 0.6, -9, cz - 50); this.lavaT.offset.set(this.bx * 0.6 / 16 + t * 0.01, -(cz - 50) / 16 + Math.sin(t * 0.4) * 0.02); }
    }
  }
  customElements.define('bounce-3d', Bounce3D);
})();
