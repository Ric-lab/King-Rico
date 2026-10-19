// <clown-ball> — bola de tinta 3D (three.js) desenhada sobre o palco 453×802. API: window.ClownBall.set(x, y, k, op), .setColor(i)
(function () {
  if (customElements.get('clown-ball')) return;
  const SRC = 'https://unpkg.com/three@0.184.0/build/three.module.js', W = 453, H = 802;
  const COLS = [['#ff3b8a', '#ffd0e4'], ['#2fb8ff', '#d4f1ff'], ['#2ec962', '#d6ffe4'], ['#a45cff', '#ecdcff']];
  class CB extends HTMLElement {
    connectedCallback() { if (this._i) return; this._i = 1; this.style.display = 'block'; this.style.pointerEvents = 'none'; import(SRC).then(T => this.setup(T)); }
    disconnectedCallback() { cancelAnimationFrame(this._raf); }
    setup(T) {
      this.T = T; const r = this.r = new T.WebGLRenderer({ antialias: true, alpha: true }); r.setClearColor(0, 0);
      r.setPixelRatio(Math.min(2.5, (window.devicePixelRatio || 1) * (this.getBoundingClientRect().width / W || 1))); r.setSize(W, H, false);
      r.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block'; this.appendChild(r.domElement);
      this.sc = new T.Scene(); this.cam = new T.OrthographicCamera(0, W, 0, -H, -500, 500); this.cam.position.z = 200;
      this.sc.add(new T.HemisphereLight(0xffffff, 0x553366, 1.3)); const dl = new T.DirectionalLight(0xffffff, 2.4); dl.position.set(-150, 220, 300); this.sc.add(dl);
      this.mat = new T.MeshPhysicalMaterial({ name: 'bola-tinta', roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1, transparent: true });
      this.m = new T.Mesh(new T.SphereGeometry(30, 48, 32), this.mat); this.sc.add(this.m); this.texs = COLS.map(c => this.tex(c[0], c[1])); this.setColor(0);
      this.q = { x: 226, y: 670, k: 1, op: 1 }; this.last = null; window.ClownBall = this;
      const tick = () => { const q = this.q; this.m.position.set(q.x, -q.y, 0); this.m.scale.setScalar(Math.max(0.001, q.k)); this.mat.opacity = q.op; this.m.visible = q.op > 0.02;
        if (this.last) { const dx = q.x - this.last.x, dy = q.y - this.last.y, d = Math.hypot(dx, dy); if (d > 0.01) { const ax = new T.Vector3(dy, dx, 0).normalize(); this.m.rotateOnWorldAxis(ax, d / (30 * Math.max(0.2, q.k))); } }
        this.last = { x: q.x, y: q.y }; r.render(this.sc, this.cam); this._raf = requestAnimationFrame(tick); };
      this._raf = requestAnimationFrame(tick);
    }
    tex(c1, c2) { const T = this.T, c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d');
      x.fillStyle = c1; x.fillRect(0, 0, 256, 128); x.strokeStyle = c2; x.lineWidth = 14; x.lineCap = 'round';
      for (let i = 0; i < 3; i++) { x.beginPath(); for (let u = 0; u <= 256; u += 8) { const y = 30 + i * 34 + Math.sin(u / 256 * Math.PI * 4 + i) * 12; u ? x.lineTo(u, y) : x.moveTo(u, y); } x.stroke(); }
      const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; }
    setColor(i) { if (!this.texs) return; this.mat.map = this.texs[i % this.texs.length]; this.mat.needsUpdate = true; }
    set(x, y, k, op) { if (this.q && Math.hypot(x - this.q.x, y - this.q.y) > 80) this.last = null; this.q = { x, y, k, op }; }
  }
  customElements.define('clown-ball', CB); window.ClownBallColors = COLS.map(c => c[0]);
})();
