// Procedural reel symbols — exact geometry, correct from every angle, tiny footprint.
// Each builder takes the THREE namespace and returns a Group facing +Z (front = reel view).

function outward(THREE, tris) {
  const pos = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), n = new THREE.Vector3(), c = new THREE.Vector3();
  for (const [p, q, r] of tris) {
    a.subVectors(q, p); b.subVectors(r, p); n.crossVectors(a, b);
    c.copy(p).add(q).add(r).multiplyScalar(1 / 3);
    const t = n.dot(c) < 0 ? [p, r, q] : [p, q, r];
    t.forEach(v => pos.push(v.x, v.y, v.z));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

// Diamond: exact faceted geometry, textured by projecting the original Canva art
// (front) and its mirror (back). No light is baked into the asset — the render rig decides.
export async function gem(THREE) {
  const D = Math.PI / 180, P = (r, a, z) => new THREE.Vector3(r * Math.cos(a * D), r * Math.sin(a * D), z);
  const Ot = [], Ob = [], Mt = [], Mb = [], T = [], R = [];
  for (let i = 0; i < 8; i++) {
    const a = 90 + i * 45;
    Ot[i] = P(1, a, 0.03); Ob[i] = P(1, a, -0.03);
    Mt[i] = P(0.932, a + 22.5, 0.03); Mb[i] = P(0.932, a + 22.5, -0.03);
    T[i] = P(0.6, a + 22.5, 0.34); R[i] = P(0.5, a, -0.46);
  }
  const C = new THREE.Vector3(0, 0, 0.37), culet = new THREE.Vector3(0, 0, -0.9);
  const tris = [];
  for (let i = 0; i < 8; i++) {
    const j = (i + 1) % 8;
    tris.push([C, T[i], T[j]], [T[i], T[j], Ot[j]], [T[i], Ot[i], Mt[i]], [T[i], Mt[i], Ot[j]]);
    tris.push([Ot[i], Ob[i], Mb[i]], [Ot[i], Mb[i], Mt[i]], [Mt[i], Mb[i], Ob[j]], [Mt[i], Ob[j], Ot[j]]);
    tris.push([Ob[i], Mb[i], R[i]], [Mb[i], R[j], R[i]], [Mb[i], Ob[j], R[j]], [R[i], R[j], culet]);
  }
  // art octagon in the 1024 texture: centre (510,495), radius ~415px
  const CX = 510, CY = 495, RAD = 415, S = 1024;
  const pos = [], uv = [], e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), n = new THREE.Vector3(), cen = new THREE.Vector3();
  for (const [p, q, r] of tris) {
    e1.subVectors(q, p); e2.subVectors(r, p); n.crossVectors(e1, e2); cen.copy(p).add(q).add(r).multiplyScalar(1 / 3);
    const t = n.dot(cen) < 0 ? [p, r, q] : [p, q, r];
    const back = cen.z < -0.01;
    t.forEach(v => { pos.push(v.x, v.y, v.z); uv.push((CX + (back ? -v.x : v.x) * RAD) / S, 1 - (CY - v.y * RAD) / S); });
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.computeVertexNormals();
  const map = await new THREE.TextureLoader().loadAsync(new URL('./tex/gem-art.png?v=2', import.meta.url).href);
  map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8;
  const mat = new THREE.MeshStandardMaterial({ map, emissiveMap: map, emissive: '#ffffff', emissiveIntensity: 0.4, flatShading: true, roughness: 0.2, metalness: 0 });
  mat.name = 'gem-art';
  const g = new THREE.Group(); g.name = 'sym-gem';
  const m = new THREE.Mesh(geo, mat); m.name = 'gem'; g.add(m);
  return g;
}

function heartShape(THREE, s) {
  const h = new THREE.Shape();
  h.moveTo(0, 0);
  h.bezierCurveTo(-0.16 * s, 0.2 * s, -0.56 * s, 0.4 * s, -0.5 * s, 0.73 * s);
  h.bezierCurveTo(-0.45 * s, 1.0 * s, -0.12 * s, 1.04 * s, 0, 0.8 * s);
  h.bezierCurveTo(0.12 * s, 1.04 * s, 0.45 * s, 1.0 * s, 0.5 * s, 0.73 * s);
  h.bezierCurveTo(0.56 * s, 0.4 * s, 0.16 * s, 0.2 * s, 0, 0);
  return h;
}

// Four heart leaves (tips to centre, lobes on the diagonals) + a stem curling down-left.
function cloverGroup(THREE, mat, o) {
  const s = o.scale, grp = new THREE.Group();
  const geo = new THREE.ExtrudeGeometry(heartShape(THREE, s), {
    depth: o.depth, bevelEnabled: true, bevelThickness: o.bevelT, bevelSize: o.bevelS,
    bevelSegments: 10, curveSegments: 48
  });
  geo.translate(0, o.gap, -o.depth / 2);
  for (let k = 0; k < 4; k++) {
    const leaf = new THREE.Mesh(geo, mat); leaf.name = 'leaf-' + k;
    leaf.rotation.z = Math.PI / 4 + k * Math.PI / 2; grp.add(leaf);
  }
  const hub = new THREE.Mesh(new THREE.SphereGeometry(o.gap * 1.9 + o.bevelS, 32, 16), mat);
  hub.scale.z = (o.depth / 2 + o.bevelT) / (o.gap * 1.9 + o.bevelS); hub.name = 'hub'; grp.add(hub);
  const V = (x, y) => new THREE.Vector3(x * s, y * s, 0);
  const curve = new THREE.CatmullRomCurve3([V(0, -0.05), V(0.03, -0.55), V(-0.04, -0.95), V(-0.2, -1.2)]);
  const r = o.stem;
  const stem = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, r, 20, false), mat); stem.name = 'stem'; grp.add(stem);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 12), mat); cap.position.copy(curve.getPoint(1)); cap.name = 'stem-tip'; grp.add(cap);
  return grp;
}

export function clover(THREE) {
  const mat = new THREE.MeshPhysicalMaterial({
    color: '#7a12e8', emissive: '#2a0668', emissiveIntensity: 0.15, roughness: 0.3, metalness: 0,
    clearcoat: 0.6, clearcoatRoughness: 0.08, envMapIntensity: 0.75
  });
  mat.name = 'clover-purple';
  const g = cloverGroup(THREE, mat, { scale: 1, depth: 0.12, bevelT: 0.16, bevelS: 0.1, gap: 0.09, stem: 0.075 });
  g.name = 'sym-clover';
  return g;
}

// Coin: same recipe as the diamond — exact disc geometry, textured by projecting the
// reel art (front) and the clover art (back); thin reeded edge band between them.
export async function coin(THREE) {
  const N = 256, RT = 0.47, TH = 0.1259, REEDS = 96; // TH measured from the Meshy side view
  const loader = new THREE.TextureLoader(), url = n => new URL('./tex/' + n + '.png?v=9', import.meta.url).href;
  const load = async n => { const t = await loader.loadAsync(url(n)); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  // Unlit art + real metal: the texture is albedo only (painted light removed); gold metal
// reflects the scene/environment, and a bump derived from the art makes the relief catch it.
// Art color is held by self-light (no env tint on the albedo); a glossy clearcoat carries the
// real environment reflection (fresnel: subtle head-on, strong at 3/4), and the bump from the
// art makes the relief catch the light.
const mk = (map, bumpMap) => new THREE.MeshPhysicalMaterial({ map, color: '#6a6a6a', emissiveMap: map, emissive: '#ffffff', emissiveIntensity: 0.72,
  bumpMap: bumpMap || null, bumpScale: bumpMap ? 4 : 0, metalness: 0, roughness: 0.35, specularIntensity: 0.35,
  clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.4 });
  const g = new THREE.Group(); g.name = 'sym-coin';
  for (const [s, file] of [[1, 'coin-front'], [-1, 'coin-back']]) {
    // Real relief: displace a dense polar mesh. Height = analytic rim/ring profile + raised
    // emblem (crown/clover) segmented from the art (lighter than the field) and rounded by blur.
    const map = await load(file), HS = 384, hc = document.createElement('canvas'); hc.width = hc.height = HS;
    const hx = hc.getContext('2d'); hx.drawImage(map.image, 0, 0, HS, HS);
    const px = hx.getImageData(0, 0, HS, HS).data, lum = i => 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
    const ctr = (HS / 2 * HS + HS / 2) * 4, fl = []; // field luminance, sampled on a ring inside the field
    for (let q = 0; q < 64; q++) { const t = q / 64 * Math.PI * 2, X = Math.round(HS / 2 + Math.cos(t) * HS * RT * 0.66), Y = Math.round(HS / 2 + Math.sin(t) * HS * RT * 0.66); fl.push(lum((Y * HS + X) * 4)); }
    fl.sort((p, q) => p - q); const FL = fl[32];
    const mc = document.createElement('canvas'); mc.width = mc.height = HS; const mx = mc.getContext('2d'); const md = mx.createImageData(HS, HS);
    for (let Y = 0; Y < HS; Y++) for (let X = 0; X < HS; X++) { const i = (Y * HS + X) * 4, rr = Math.hypot(X - HS / 2, Y - HS / 2) / (HS * RT); const on = rr < 0.655 && lum(i) > FL + 14 ? 255 : 0; md.data[i] = md.data[i + 1] = md.data[i + 2] = on; md.data[i + 3] = 255; }
    // fill holes: flood the field from r≈0.66; any unreached pixel inside r<0.69 is emblem
    const seen = new Uint8Array(HS * HS), st = [];
    for (let q = 0; q < 64; q++) { const t = q / 64 * Math.PI * 2, X = Math.round(HS / 2 + Math.cos(t) * HS * RT * 0.66), Y = Math.round(HS / 2 + Math.sin(t) * HS * RT * 0.66); if (!md.data[(Y * HS + X) * 4]) st.push(Y * HS + X); }
    while (st.length) { const p = st.pop(); if (seen[p]) continue; seen[p] = 1; const X = p % HS, Y = (p / HS) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = X + dx, ny = Y + dy; if (nx < 0 || ny < 0 || nx >= HS || ny >= HS) continue; const n = ny * HS + nx; if (!seen[n] && !md.data[n * 4] && Math.hypot(nx - HS / 2, ny - HS / 2) / (HS * RT) < 0.655) st.push(n); } }
    for (let p = 0; p < HS * HS; p++) { const X = p % HS, Y = (p / HS) | 0; if (!seen[p] && Math.hypot(X - HS / 2, Y - HS / 2) / (HS * RT) < 0.655) { const i = p * 4; md.data[i] = md.data[i + 1] = md.data[i + 2] = 255; } }
    mx.putImageData(md, 0, 0);
    // erode ~2px so the raised edge sits on the painted outline, then round the bevel
    const ec = document.createElement('canvas'); ec.width = ec.height = HS; const ex = ec.getContext('2d'); ex.filter = 'blur(1.5px)'; ex.drawImage(mc, 0, 0);
    const ed = ex.getImageData(0, 0, HS, HS); for (let i = 0; i < ed.data.length; i += 4) { const v = ed.data[i] > 215 ? 255 : 0; ed.data[i] = ed.data[i + 1] = ed.data[i + 2] = v; } ex.filter = 'none'; ex.putImageData(ed, 0, 0);
    const sc = document.createElement('canvas'); sc.width = sc.height = HS; const sx = sc.getContext('2d'); sx.filter = 'blur(3.5px)'; sx.drawImage(ec, 0, 0);
    const em = sx.getImageData(0, 0, HS, HS).data;
    const emb = (u, v) => { const X = Math.min(HS - 1, Math.max(0, Math.round(u * HS))), Y = Math.min(HS - 1, Math.max(0, Math.round((1 - v) * HS))); const e = em[(Y * HS + X) * 4] / 255; return Math.min(1, e * 1.6); };
    const sm = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
    const RH = 0.07, EH = 0.075;
    // radii measured from the art: field <0.665, bevel to 0.735, ring to 0.905, step down, outer rim rounds off
    const prof = r => RH * (sm(0.665, 0.735, r) - 0.3 * sm(0.905, 0.93, r) - 0.55 * sm(0.975, 1.0, r));
    const RINGS = 150, SEGS = 420, pos = [], uv = [], idx = [];
    for (let k = 0; k <= RINGS; k++) {
      const r = k / RINGS, cnt = k === 0 ? 1 : SEGS;
      for (let i = 0; i < cnt; i++) {
        const th = i / SEGS * Math.PI * 2, x = r * Math.cos(th), y = r * Math.sin(th);
        const u = 0.5 + x * RT * s, v = 0.5 + y * RT;
        const h = prof(r) + (r < 0.665 ? EH * emb(u, v) : 0);
        pos.push(x, y, (TH + h) * s); uv.push(u, v);
      }
    }
    const at = (k, i) => (k === 0 ? 0 : 1 + (k - 1) * SEGS + (i % SEGS));
    for (let i = 0; i < SEGS; i++) { const p = at(1, i), q = at(1, i + 1); if (s > 0) idx.push(0, p, q); else idx.push(0, q, p); }
    for (let k = 1; k < RINGS; k++) for (let i = 0; i < SEGS; i++) {
      const A = at(k, i), B = at(k, i + 1), C = at(k + 1, i), D = at(k + 1, i + 1);
      if (s > 0) idx.push(A, C, B, B, C, D); else idx.push(A, B, C, B, D, C);
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    const mat = mk(map, null); mat.name = file;
    const m = new THREE.Mesh(geo, mat); m.name = file; g.add(m);
  }
  const et = await load('coin-edge'); et.wrapS = THREE.RepeatWrapping; et.repeat.set(Math.round(2 * Math.PI / (0.4 * 2)), 1); // strip = 40% of the diameter
  const edge = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, TH * 2, N, 1, true), mk(et));
  edge.material.name = 'coin-edge'; edge.rotation.x = Math.PI / 2; edge.name = 'coin-edge'; g.add(edge);
  return g;
}
