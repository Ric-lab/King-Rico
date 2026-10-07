// Real-3D Happeach for the Special Round jump. One WebGL canvas over the stage (453×802 stage px),
// orthographic camera mapped 1:1 to stage coordinates, so poses use the same x/y as the 2D layer.
let S = null;
export async function init(layer, url = 'assets/models/sym-peach-game.glb') {
  if (S) return S;
  const THREE = await import('https://esm.sh/three@0.184.0');
  const { GLTFLoader } = await import('https://esm.sh/three@0.184.0/examples/jsm/loaders/GLTFLoader.js');
  const { RoomEnvironment } = await import('https://esm.sh/three@0.184.0/examples/jsm/environments/RoomEnvironment.js');
  const W = 453, H = 802, HEIGHT = 80; // character height on screen, stage px
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;left:0;top:0;width:453px;height:802px;pointer-events:none;z-index:3;opacity:0;filter:drop-shadow(0 0 8px rgba(255,200,120,.9)) drop-shadow(0 3px 3px rgba(60,10,40,.5));';
  const r = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  r.setClearColor(0x000000, 0);
  r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.NeutralToneMapping; r.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(r).fromScene(new RoomEnvironment(), 0.04).texture;
  const key = new THREE.DirectionalLight(0xfff0dc, 1.7); key.position.set(-150, 300, 400); scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0xffd0e8, 0.9); rim.position.set(260, 120, -300); scene.add(rim);
  scene.add(new THREE.HemisphereLight(0xfff4e6, 0x6a2a40, 0.45));
  const cam = new THREE.OrthographicCamera(0, W, 0, -H, 1, 4000); cam.position.z = 1500;
  const gltf = await new GLTFLoader().loadAsync(url);
  const root = gltf.scene, box = new THREE.Box3().setFromObject(root), size = box.getSize(new THREE.Vector3());
  // pivot at 55% from the top (same as the 2D puppet's transform-origin), centred in x/z
  root.position.set(-(box.min.x + size.x / 2), -(box.max.y - 0.55 * size.y), -(box.min.z + size.z / 2));
  const holder = new THREE.Group(); holder.add(root); scene.add(holder);
  const base = HEIGHT / size.y;
  layer.appendChild(canvas);
  const fit = () => { const k = (layer.getBoundingClientRect().width / W) || 1; r.setPixelRatio(Math.min(3, (window.devicePixelRatio || 1) * k)); r.setSize(W, H, false); };
  fit(); r.compile(scene, cam);
  S = {
    ready: true, fit,
    show(p) {
      holder.position.set(p.x, -p.y, 0);
      holder.rotation.set(p.rx || 0, p.ry || 0, p.rz || 0);
      holder.scale.set(base * p.a, base * p.b, base * p.a);
      canvas.style.opacity = String(p.o == null ? 1 : p.o);
      r.render(scene, cam);
    },
    hide() { canvas.style.opacity = '0'; r.clear(); }
  };
  return S;
}
