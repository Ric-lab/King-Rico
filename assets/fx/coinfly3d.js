// 3D coin shower: real procedural coin (same model as the 3D library) flying from the prize to the
// balance pill. One WebGL canvas over the 453×802 stage, orthographic camera mapped 1:1 to stage px.
let S = null;
export async function init(layer) {
  if (S) return S;
  const THREE = await import('https://esm.sh/three@0.184.0');
  const { RoomEnvironment } = await import('https://esm.sh/three@0.184.0/examples/jsm/environments/RoomEnvironment.js');
  const PROC = await import('../models/procedural.js');
  const W = 453, H = 802;
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;left:0;top:0;width:453px;height:802px;pointer-events:none;z-index:6;opacity:0;filter:drop-shadow(0 3px 3px rgba(60,10,20,.45));';
  const r = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  r.setClearColor(0x000000, 0); r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.NeutralToneMapping; r.toneMappingExposure = 1.1;
  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(r).fromScene(new RoomEnvironment(), 0.04).texture;
  const key = new THREE.DirectionalLight(0xfff0d8, 1.6); key.position.set(-120, 260, 420); scene.add(key, key.target);
  scene.add(new THREE.HemisphereLight(0xfff4e0, 0x5a2a10, 0.5));
  const cam = new THREE.OrthographicCamera(0, W, 0, -H, 1, 4000); cam.position.z = 1500;
  const proto = await PROC.coin(THREE);
  const box = new THREE.Box3().setFromObject(proto), R0 = box.getSize(new THREE.Vector3()).x / 2;
  const pool = [];
  for (let i = 0; i < 32; i++) { const g = proto.clone(true); g.visible = false; scene.add(g); pool.push(g); }
  layer.appendChild(canvas);
  const fit = () => { const k = (layer.getBoundingClientRect().width / W) || 1; r.setPixelRatio(Math.min(3, (window.devicePixelRatio || 1) * k)); r.setSize(W, H, false); };
  fit(); r.compile(scene, cam);
  // coins: [{x,y,rad (stage px), rx, ry, rz}]
  S = {
    ready: true, fit, max: pool.length,
    draw(coins) {
      pool.forEach((g, i) => {
        const c = coins[i]; g.visible = !!c; if (!c) return;
        g.position.set(c.x, -c.y, 0); g.rotation.set(c.rx, c.ry, c.rz); g.scale.setScalar(c.rad / R0);
      });
      canvas.style.opacity = coins.length ? '1' : '0';
      r.render(scene, cam);
    }
  };
  return S;
}
