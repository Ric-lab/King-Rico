import base64, json, math, os
from PIL import Image, ImageFilter
from playwright.sync_api import sync_playwright

os.makedirs('docs/concepts/shield-wheel-options', exist_ok=True)
os.makedirs('work/shield-previews', exist_ok=True)

sh = Image.open('assets/symbols/shield-defense-rainbow-gold-v1.png').convert('RGBA')
W, H = sh.size
px = sh.load()

# Center of the shield interior (symmetric x=625.5, y=545)
CX, CY = 625.5, 545.0

# Exact measured inner bevel contour of shield-defense-rainbow-gold-v1.png (right half, mirrored to left for 100% symmetry):
def catmull_rom_chain(ctrl, samples_per_seg=40):
    out = []
    n = len(ctrl)
    for i in range(n - 1):
        p0 = ctrl[max(0, i - 1)]
        p1 = ctrl[i]
        p2 = ctrl[i + 1]
        p3 = ctrl[min(n - 1, i + 2)]
        for s in range(samples_per_seg):
            t = s / samples_per_seg
            t2, t3 = t * t, t * t * t
            x = 0.5 * ((2*p1[0]) + (-p0[0] + p2[0])*t + (2*p0[0] - 5*p1[0] + 4*p2[0] - p3[0])*t2 + (-p0[0] + 3*p1[0] - 3*p2[0] + p3[0])*t3)
            y = 0.5 * ((2*p1[1]) + (-p0[1] + p2[1])*t + (2*p0[1] - 5*p1[1] + 4*p2[1] - p3[1])*t2 + (-p0[1] + 3*p1[1] - 3*p2[1] + p3[1])*t3)
            out.append([round(x, 2), round(y, 2)])
    out.append([round(ctrl[-1][0], 2), round(ctrl[-1][1], 2)])
    return out

# Top peak (625.5, 102.5) -> smooth concave arch -> top-right inner corner (1048.5, 221.5)
top_right_ctrl = [
    (625.5, 102.5),
    (662.0, 128.5),
    (700.0, 151.5),
    (750.0, 178.0),
    (800.0, 199.0),
    (860.0, 215.5),
    (925.0, 221.5),
    (995.0, 222.0),
    (1046.0, 221.5),
]
# Top-right inner corner (1046.0, 221.5) -> smooth convex side -> bottom tip (625.5, 1161.5)
side_right_ctrl = [
    (1046.0, 221.5),
    (1055.0, 260.0),
    (1062.5, 350.0),
    (1060.5, 500.0),
    (1033.0, 650.0),
    (980.0, 800.0),
    (880.0, 950.0),
    (740.5, 1080.0),
    (671.0, 1132.0),
    (625.5, 1161.5),
]

right_pts = catmull_rom_chain(top_right_ctrl, 32)[:-1] + catmull_rom_chain(side_right_ctrl, 32)
left_pts = [[round(2 * CX - p[0], 2), p[1]] for p in reversed(right_pts[1:-1])]
pts = right_pts + left_pts
print('Smooth spline contour points:', len(pts), 'top:', pts[0], 'bottom:', right_pts[-1])

with open('assets/symbols/shield-defense-rainbow-gold-v1.png', 'rb') as f:
    shield_b64 = base64.b64encode(f.read()).decode('ascii')

HTML = r"""<!doctype html>
<meta charset="utf-8">
<canvas id="gl" width="2508" height="2508"></canvas>
<canvas id="out" width="1254" height="1254"></canvas>
<script>
const PTS = __PTS__;
const SHIELD_SRC = "data:image/png;base64,__SHIELD__";

const VS = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FS = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;

uniform vec2 uCenter;      // in 1254 coords
uniform int uSlices;       // 12, 8, or 10
uniform float uSpokeHalf;  // half-width of golden spoke in 1254 coords
uniform float uSpokeTaper; // extra half-width near hub for tapered solar/wheel rays
uniform float uHubRadius;  // outer radius of central gold collar in 1254 coords
uniform float uGroove;     // dark inner rim groove strength
uniform int uDoubleRing;   // 1 for double gold collar
uniform int uTopPointer;   // 1 for wheel pointer at top peak
uniform vec3 uColors[12];
uniform sampler2D uCavity; // R = inside mask (smooth), G = distance inward from shield frame (0..1 over 120px)

const float PI = 3.141592653589793;

vec3 goldShade(vec3 n, float specPow, float specAmt, float warmShift) {
  vec3 L1 = normalize(vec3(-0.34, -0.72, 0.60));
  vec3 L2 = normalize(vec3(0.25, 0.45, 0.86));
  vec3 V  = vec3(0.0, 0.0, 1.0);
  vec3 H1 = normalize(L1 + V);
  float diff1 = max(dot(n, L1), 0.0);
  float diff2 = max(dot(n, L2), 0.0);
  float spec  = pow(max(dot(n, H1), 0.0), specPow);

  vec3 darkBronze = vec3(0.46, 0.25, 0.03);
  vec3 midGold    = vec3(0.91, 0.65, 0.14);
  vec3 brightGold = vec3(0.99, 0.84, 0.36);
  vec3 creamSpec  = vec3(1.00, 0.96, 0.76);

  float t = clamp(0.18 + 0.78 * diff1 + 0.16 * diff2 + warmShift, 0.0, 1.0);
  vec3 base = t < 0.52
    ? mix(darkBronze, midGold, t / 0.52)
    : mix(midGold, brightGold, (t - 0.52) / 0.48);
  return clamp(base + creamSpec * (spec * specAmt), 0.0, 1.0);
}

void main() {
  // Pixel in 1254x1254 space (y down, matching image coords!)
  vec2 p = vec2(vUv.x * 1254.0, (1.0 - vUv.y) * 1254.0);
  vec4 cav = texture(uCavity, vec2(vUv.x, 1.0 - vUv.y));
  float inside = cav.r;
  if (inside <= 0.001) {
    fragColor = vec4(0.0);
    return;
  }
  float frameDist = cav.g * 140.0; // px inward from inner gold shield bevel

  vec2 d = p - uCenter;
  float r = length(d);
  // Angle clockwise from straight UP (0..2*PI)
  float ang = atan(d.x, -d.y);
  if (ang < 0.0) ang += 2.0 * PI;

  float nSlices = float(uSlices);
  float segAng = 2.0 * PI / nSlices;
  int idx = int(floor(ang / segAng)) % uSlices;
  float localAng = mod(ang, segAng);
  // Perpendicular distance in px to nearest spoke ray!
  float angToSpoke = min(localAng, segAng - localAng);
  float perpDist = r * sin(min(angToSpoke, 1.5707963));

  // 1) Base wheel slice color + satin lighting matching wheel-symbol-v1 & shield
  vec3 sliceCol = uColors[idx];
  // Subtle upper-left satin sheen + gentle radial depth
  float topGlow = clamp((-d.y * 0.72 - d.x * 0.35) / 460.0, -0.35, 0.55);
  sliceCol = mix(sliceCol, vec3(1.0, 0.98, 0.94), max(0.0, topGlow) * 0.18);
  sliceCol *= (1.0 + min(0.0, topGlow) * 0.22);

  // Subtle dark inner track / recess near the outer shield gold border (like the wheel's inner track!)
  if (uGroove > 0.0) {
    float trackWidth = 15.0 * uGroove;
    float trackBand = 1.0 - smoothstep(trackWidth - 3.5, trackWidth + 3.5, frameDist);
    vec3 trackCol = mix(vec3(0.14, 0.10, 0.16), sliceCol * 0.38, 0.35);
    sliceCol = mix(sliceCol, trackCol, trackBand * 0.72);
    // Soft inner shadow right inside the track
    float rimAO = smoothstep(trackWidth, trackWidth + 28.0, frameDist);
    sliceCol *= mix(0.76, 1.0, rimAO);
  } else {
    float rimAO = smoothstep(0.0, 26.0, frameDist);
    sliceCol *= mix(0.74, 1.0, rimAO);
  }

  // Contact AO cast by golden spokes onto the slice
  float rayT = clamp((r - uHubRadius * 0.85) / 430.0, 0.0, 1.0);
  float effSpokeHalf = uSpokeHalf + uSpokeTaper * (1.0 - rayT);
  float spokeAO = smoothstep(effSpokeHalf, effSpokeHalf + 9.0, perpDist);
  // Slight directional shadow on bottom-right side of spoke
  vec2 spokeDir = vec2(sin(round(ang / segAng) * segAng), -cos(round(ang / segAng) * segAng));
  vec2 spokeRight = vec2(-spokeDir.y, spokeDir.x);
  float signedSpoke = dot(d, spokeRight);
  float lightSide = dot(spokeRight, normalize(vec2(0.45, 0.89)));
  float dirShadow = smoothstep(effSpokeHalf + 12.0, effSpokeHalf, perpDist) * max(0.0, sign(signedSpoke) * lightSide);
  sliceCol *= mix(0.72, 1.0, spokeAO) * (1.0 - 0.16 * dirShadow);

  // Contact AO cast by central golden hub onto the slices & spokes
  float hubOuter = uHubRadius;
  float hubShadow = smoothstep(hubOuter - 2.0, hubOuter + 20.0, r);
  vec2 shadowOff = p - (uCenter + vec2(3.5, 6.5));
  float dropShadow = smoothstep(hubOuter - 1.0, hubOuter + 14.0, length(shadowOff));
  sliceCol *= mix(0.55, 1.0, hubShadow) * mix(0.68, 1.0, dropShadow);

  vec3 col = sliceCol;

  // 2) 3D Sculpted Golden Radial Dividing Lines ("raios / linhas douradas")
  // Spokes stop cleanly at the inner track groove (or frame) and emerge from under the central hub collar!
  float spokeMask = 1.0 - smoothstep(effSpokeHalf - 1.1, effSpokeHalf + 1.1, perpDist);
  if (spokeMask > 0.001 && r > hubOuter * 0.75) {
    // Cross-sectional 3D rounded/beveled profile across spoke width
    float sNorm = clamp(signedSpoke / max(1.0, effSpokeHalf), -1.0, 1.0);
    float nz = sqrt(max(0.08, 1.0 - 0.62 * sNorm * sNorm));
    vec3 N = normalize(vec3(spokeRight * (sNorm * 0.78), nz));
    vec3 gCol = goldShade(N, 26.0, 0.42, 0.05);
    // Subtle inner shadow where spoke tucks into the outer gold shield frame
    gCol *= mix(0.76, 1.0, smoothstep(0.0, 14.0, frameDist));
    // Dark thin bronze edge at outer boundary of spoke for crisp cartoon readability
    float edgeDark = smoothstep(effSpokeHalf - 2.2, effSpokeHalf + 0.4, perpDist);
    gCol = mix(gCol, vec3(0.36, 0.18, 0.02), edgeDark * 0.55);
    // Apply hub drop shadow onto spoke where spoke meets hub
    gCol *= mix(0.62, 1.0, dropShadow);
    col = mix(col, gCol, spokeMask);
  }

  // 3) Optional Top Wheel Pointer Notch (Option 3: inspired by wheel-symbol-v1 top teardrop pointer!)
  if (uTopPointer == 1) {
    // Teardrop pointer centered at x = uCenter.x, pointing down from top peak y=102 to y=208
    vec2 tp = p - vec2(uCenter.x, 142.0);
    // Teardrop SDF: wider rounded top, tapering point at bottom (tp.y = +62)
    float ty = clamp((tp.y + 38.0) / 102.0, 0.0, 1.0);
    float halfW = mix(34.0, 2.5, pow(ty, 1.25)) * smoothstep(-0.08, 0.18, ty);
    float pDist = abs(tp.x) - halfW;
    if (tp.y < -38.0) pDist = length(tp - vec2(0.0, -10.0)) - 31.0;
    if (tp.y > 64.0) pDist = length(tp - vec2(0.0, 62.0)) - 3.0;
    // Shadow of pointer
    float ptrShadow = 1.0 - smoothstep(-2.0, 11.0, pDist - 2.0);
    if (tp.y > -42.0 && tp.y < 76.0) {
      col *= mix(1.0, 0.62, ptrShadow * 0.65);
    }
    float ptrMask = 1.0 - smoothstep(-1.2, 1.2, pDist);
    if (ptrMask > 0.001 && tp.y > -42.0 && tp.y < 66.0) {
      float nx = clamp(tp.x / max(4.0, halfW), -1.0, 1.0) * 0.72;
      float ny = clamp((tp.y - 8.0) / 55.0, -0.7, 0.7) * 0.45;
      float nz = sqrt(max(0.1, 1.0 - nx*nx - ny*ny));
      vec3 ptrCol = goldShade(normalize(vec3(nx, ny, nz)), 28.0, 0.45, 0.08);
      // Inner bevel groove on pointer + small rivet stud near top like wheel-symbol-v1!
      float rim = smoothstep(-9.0, -3.0, pDist) - smoothstep(-3.0, 0.0, pDist);
      ptrCol = mix(ptrCol, vec3(0.42, 0.22, 0.02), clamp(rim, 0.0, 1.0) * 0.45);
      float studR = length(tp - vec2(0.0, -14.0));
      if (studR < 11.5) {
        vec2 sd = (tp - vec2(0.0, -14.0)) / 10.5;
        float sm = 1.0 - smoothstep(9.5, 11.2, studR);
        vec3 sN = normalize(vec3(sd * 0.8, sqrt(max(0.1, 1.0 - dot(sd,sd)*0.64))));
        vec3 sCol = goldShade(sN, 32.0, 0.55, 0.1);
        sCol *= mix(1.0, 0.45, smoothstep(8.2, 10.5, studR));
        ptrCol = mix(ptrCol, sCol, sm);
      }
      ptrCol = mix(ptrCol, vec3(0.32, 0.16, 0.02), smoothstep(-2.4, 0.2, pDist) * 0.65);
      col = mix(col, ptrCol, ptrMask);
    }
  }

  // 4) Central Golden Dome Hub ("a bolinha tipo a do meio da roleta") + Raised Gold Collar Ring!
  float hubMask = 1.0 - smoothstep(hubOuter - 1.2, hubOuter + 1.2, r);
  if (hubMask > 0.001) {
    float ringInner = hubOuter * (uDoubleRing == 1 ? 0.79 : 0.835);
    vec3 hubCol;
    if (r >= ringInner - 1.5) {
      // Raised circular gold collar ring (or double collar ring!) around the central dome
      float ringT = (r - ringInner) / max(1.0, hubOuter - ringInner); // 0..1 across collar
      float profile = (ringT - 0.5) * 2.0; // -1 inner edge .. +1 outer edge
      if (uDoubleRing == 1) {
        // Two concentric gold ridges with a fine groove at ringT=0.52
        float sub = ringT < 0.52 ? (ringT / 0.52 * 2.0 - 1.0) : ((ringT - 0.52) / 0.48 * 2.0 - 1.0);
        profile = sub;
      }
      vec2 radDir = r > 0.001 ? d / r : vec2(0.0, -1.0);
      vec3 Nring = normalize(vec3(radDir * (profile * 0.82), sqrt(max(0.08, 1.0 - 0.67 * profile * profile))));
      hubCol = goldShade(Nring, 32.0, 0.52, 0.08);
      // Crisp dark-bronze outer & inner lip matching wheel-symbol-v1
      float outerLip = smoothstep(hubOuter - 2.6, hubOuter, r);
      float innerLip = 1.0 - smoothstep(ringInner, ringInner + 2.4, r);
      hubCol = mix(hubCol, vec3(0.32, 0.17, 0.02), clamp(outerLip * 0.7 + innerLip * 0.55, 0.0, 0.8));
      if (uDoubleRing == 1) {
        float midGroove = 1.0 - smoothstep(0.0, 0.11, abs(ringT - 0.52));
        hubCol = mix(hubCol, vec3(0.36, 0.19, 0.03), midGroove * 0.65);
      }
    }
    if (r < ringInner + 1.5) {
      // Exact satin-brushed convex golden dome ("bolinha") matching wheel-symbol-v1.png's measured profile!
      // Remember wheel-symbol-v1.png: bright cream-gold center/upper-left, warm gold mid, deep golden-bronze recess near ringInner!
      vec2 u = d / ringInner; // length 0..1
      float rr = clamp(length(u), 0.0, 1.0);
      vec3 Ndome = normalize(vec3(u * 0.86, sqrt(max(0.06, 1.0 - 0.74 * rr * rr))));
      // Satin dome with slight offset highlight matching wheel-symbol-v1 (highlight slightly upper-left of center)
      vec2 hOff = u - vec2(-0.10, -0.14);
      float domeGlow = exp(-2.35 * dot(hOff, hOff));
      vec3 edgeBronze = vec3(0.41, 0.24, 0.03);  // exact (105,62,8) at r=51 of wheel-symbol-v1!
      vec3 midSatin   = vec3(0.86, 0.62, 0.15);  // exact (219,158,38) at r=21 of wheel-symbol-v1!
      vec3 centerGlow = vec3(0.97, 0.87, 0.51);  // exact (247,222,130) at center of wheel-symbol-v1!
      vec3 domeCol = mix(edgeBronze, midSatin, smoothstep(1.02, 0.34, rr));
      domeCol = mix(domeCol, centerGlow, domeGlow * 0.92);
      // Add subtle directional 3D normal shading so top-left is slightly warmer/brighter than bottom-right
      float dir = dot(Ndome, normalize(vec3(-0.30, -0.55, 0.78)));
      domeCol *= (0.90 + 0.16 * max(dir, 0.0));
      // Deep recess shadow right where dome tucks under the raised collar ring
      domeCol *= mix(0.62, 1.0, smoothstep(ringInner, ringInner - 11.0, r));

      float blendRing = smoothstep(ringInner - 1.2, ringInner + 1.2, r);
      hubCol = r >= ringInner - 1.5 ? mix(domeCol, hubCol, blendRing) : domeCol;
    }
    col = mix(col, hubCol, hubMask);
  }

  // Feather alpha over 2.5px at the cavity boundary so it blends invisibly into the painted dark bevel groove of the original shield!
  fragColor = vec4(col, inside);
}
`;

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
}

// Build smooth cavity mask + inward distance map at 1254x1254
function buildCavityTexture() {
  const c = document.createElement('canvas');
  c.width = 1254; c.height = 1254;
  const ctx = c.getContext('2d');
  // Draw filled polygon with 2px blur for smooth edge feathering in R, and layered strokes for inward distance in G!
  const maskC = document.createElement('canvas');
  maskC.width = 1254; maskC.height = 1254;
  const mctx = maskC.getContext('2d');
  mctx.filter = 'blur(1.6px)';
  mctx.fillStyle = '#fff';
  mctx.beginPath();
  PTS.forEach((pt, i) => i ? mctx.lineTo(pt[0], pt[1]) : mctx.moveTo(pt[0], pt[1]));
  mctx.closePath();
  mctx.fill();

  // Distance inward (0 at boundary .. 1 at 140px inward) using concentric inner strokes
  const distC = document.createElement('canvas');
  distC.width = 1254; distC.height = 1254;
  const dctx = distC.getContext('2d');
  dctx.fillStyle = '#fff';
  dctx.fillRect(0, 0, 1254, 1254);
  dctx.lineJoin = 'round';
  dctx.beginPath();
  PTS.forEach((pt, i) => i ? dctx.lineTo(pt[0], pt[1]) : dctx.moveTo(pt[0], pt[1]));
  dctx.closePath();
  for (let w = 280; w >= 4; w -= 4) {
    const v = Math.round(Math.max(0, Math.min(255, ((280 - w) / 280) * 255)));
    // Wait: larger lineWidth reaches further inward! So draw from widest (brightish) down to narrowest (0 = black at boundary)!
  }
  dctx.fillStyle = '#fff';
  dctx.fillRect(0, 0, 1254, 1254);
  for (let dist = 140; dist >= 1; dist -= 2) {
    const g = Math.round(((dist - 1) / 140) * 255);
    dctx.strokeStyle = `rgb(${g},${g},${g})`;
    dctx.lineWidth = dist * 2;
    dctx.stroke();
  }

  const mData = mctx.getImageData(0, 0, 1254, 1254).data;
  const dData = dctx.getImageData(0, 0, 1254, 1254).data;
  const out = ctx.createImageData(1254, 1254);
  for (let i = 0; i < mData.length; i += 4) {
    out.data[i]   = mData[i + 3]; // R = inside mask alpha
    out.data[i+1] = dData[i];     // G = inward distance 0..255
    out.data[i+2] = 0;
    out.data[i+3] = 255;
  }
  ctx.putImageData(out, 0, 0);
  return c;
}

window.renderAll = async function() {
  const shieldImg = new Image();
  shieldImg.src = SHIELD_SRC;
  await shieldImg.decode();

  const glCanvas = document.getElementById('gl');
  const gl = glCanvas.getContext('webgl2', {premultipliedAlpha: false, preserveDrawingBuffer: true});
  const compile = (type, src) => {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const cavCanvas = buildCavityTexture();
  const tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cavCanvas);
  gl.uniform1i(gl.getUniformLocation(prog, 'uCavity'), 0);

  const configs = [
    {
      name: '01-roleta-12-fatias',
      center: [625.5, 548.0],
      slices: 12,
      spokeHalf: 4.4,
      spokeTaper: 0.0,
      hubRadius: 146.0,
      groove: 0.85,
      doubleRing: 0,
      topPointer: 0,
      colors: ['#ff1e43','#ff571a','#ff8912','#ffb814','#fadc21','#8bd51f','#18c94e','#00cfac','#00befa','#1f64ff','#6930ff','#fc2487']
    },
    {
      name: '02-roleta-8-partes',
      center: [625.5, 548.0],
      slices: 8,
      spokeHalf: 7.2,
      spokeTaper: 0.0,
      hubRadius: 158.0,
      groove: 0.55,
      doubleRing: 0,
      topPointer: 0,
      colors: ['#ff2047','#ff7b14','#fadc21','#1ad04b','#00c4fa','#245eff','#882cff','#ff2693']
    },
    {
      name: '03-roleta-10-raios',
      center: [625.5, 548.0],
      slices: 10,
      spokeHalf: 3.6,
      spokeTaper: 6.2,
      hubRadius: 152.0,
      groove: 0.70,
      doubleRing: 0,
      topPointer: 0,
      colors: ['#ff1e43','#ff6816','#ffb314','#f6de22','#5cd622','#00cf95','#00b8fa','#265dff','#832aff','#fc2487']
    }
  ];

  const outC = document.getElementById('out');
  const octx = outC.getContext('2d');
  const results = {};

  for (const cfg of configs) {
    gl.viewport(0, 0, 2508, 2508);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(gl.getUniformLocation(prog, 'uCenter'), cfg.center[0], cfg.center[1]);
    gl.uniform1i(gl.getUniformLocation(prog, 'uSlices'), cfg.slices);
    gl.uniform1f(gl.getUniformLocation(prog, 'uSpokeHalf'), cfg.spokeHalf);
    gl.uniform1f(gl.getUniformLocation(prog, 'uSpokeTaper'), cfg.spokeTaper || 0.0);
    gl.uniform1f(gl.getUniformLocation(prog, 'uHubRadius'), cfg.hubRadius);
    gl.uniform1f(gl.getUniformLocation(prog, 'uGroove'), cfg.groove);
    gl.uniform1i(gl.getUniformLocation(prog, 'uDoubleRing'), cfg.doubleRing);
    gl.uniform1i(gl.getUniformLocation(prog, 'uTopPointer'), cfg.topPointer);
    const flat = [];
    for (let i = 0; i < 12; i++) flat.push(...hexToRgb(cfg.colors[i % cfg.colors.length]));
    gl.uniform3fv(gl.getUniformLocation(prog, 'uColors'), new Float32Array(flat));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Composite onto exact shield-defense-rainbow-gold-v1.png gold frame with 2x supersampled downsampling!
    octx.clearRect(0, 0, 1254, 1254);
    octx.imageSmoothingEnabled = true;
    octx.imageSmoothingQuality = 'high';
    octx.drawImage(shieldImg, 0, 0, 1254, 1254);
    octx.drawImage(glCanvas, 0, 0, 2508, 2508, 0, 0, 1254, 1254);
    results[cfg.name] = outC.toDataURL('image/png');
  }
  return results;
};
</script>
""".replace('__PTS__', json.dumps(pts)).replace('__SHIELD__', shield_b64)

with open('work/shield-previews/render.html', 'w') as f:
    f.write(HTML)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox', '--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    page = b.new_page()
    page.goto('file://' + os.path.abspath('work/shield-previews/render.html'))
    res = page.evaluate('window.renderAll()')
    b.close()

for name, data_url in res.items():
    raw = base64.b64decode(data_url.split(',', 1)[1])
    png_path = f'docs/concepts/shield-wheel-options/{name}.png'
    webp_path = f'docs/concepts/shield-wheel-options/{name}.webp'
    with open(png_path, 'wb') as f:
        f.write(raw)
    im = Image.open(png_path).convert('RGBA')
    im.resize((512, 512), Image.Resampling.LANCZOS).save(webp_path, 'WEBP', quality=94, method=6)
    # Also save on soft neutral card for crisp chat preview
    card = Image.new('RGBA', (1024, 1024), (248, 246, 242, 255))
    sh_small = im.resize((920, 920), Image.Resampling.LANCZOS)
    card.alpha_composite(sh_small, (52, 52))
    card.convert('RGB').save(f'work/shield-previews/{name}-card.png', 'PNG')
    print('Saved:', png_path, webp_path)
