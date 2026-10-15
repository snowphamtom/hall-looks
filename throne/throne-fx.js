// Throne Room rendering and detail pass: PBR materials, procedural PMREM environment, soft canon
// shadows + contact shadows, polished reflective floor, volumetric beam, SSAO, gilt bloom, reveal
// depth of field, carved relief, worn gilt, dais inscription, settling petals, banners, candles, motes.
// Quality tiers (low / med / high) from GPU detection; ?q=low|med|high overrides. Nothing is downloaded.
import * as THREE from "./vendor/three-0.160.0.module.min.js";
import { Reflector } from "./vendor/addons/objects/Reflector.js";
import { EffectComposer } from "./vendor/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "./vendor/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "./vendor/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "./vendor/addons/postprocessing/OutputPass.js";
import { BokehPass } from "./vendor/addons/postprocessing/BokehPass.js";
import { SSAOPass } from "./vendor/addons/postprocessing/SSAOPass.js";

export function tierFor(renderer, soft, coarse) {
  const q = new URLSearchParams(location.search).get("q");
  if (q === "low" || q === "med" || q === "high") return q;
  if (soft) return "low";
  let name = "";
  try { const gl = renderer.getContext(), ext = gl.getExtension("WEBGL_debug_renderer_info"); name = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : ""; } catch (e) {}
  const mem = navigator.deviceMemory || 8, cores = navigator.hardwareConcurrency || 8;
  if (coarse) {
    if (/Adreno \(TM\) [2-5]\d\d|Mali-[GT][0-5]\d\b|Mali-4|PowerVR|SGX/i.test(name) || mem <= 3 || cores <= 4) return "low";
    return "med";   // modern phones (Apple GPU, Adreno 6xx/7xx, Mali-G7x): shadows + bloom, no SSAO
  }
  if (/Intel\(R\) (HD|UHD) Graphics [1-6]\d\d\b|Intel.*HD Graphics$/i.test(name) || mem <= 4) return "med";
  return "high";
}

function rng(seed) { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }
// value noise (3D, so textures wrap seamlessly around lathe surfaces) + fbm
function hash3(x, y, z) { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(z | 0, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
function vnoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf), L = (a, b, t) => a + (b - a) * t, Q = hash3;
  return L(L(L(Q(xi, yi, zi), Q(xi + 1, yi, zi), u), L(Q(xi, yi + 1, zi), Q(xi + 1, yi + 1, zi), u), v),
           L(L(Q(xi, yi, zi + 1), Q(xi + 1, yi, zi + 1), u), L(Q(xi, yi + 1, zi + 1), Q(xi + 1, yi + 1, zi + 1), u), v), w);
}
function fbm(x, y, z, o) { let a = 0.5, f = 1, t = 0; for (let i = 0; i < (o || 5); i++) { t += a * vnoise(x * f, y * f, z * f); f *= 2.03; a *= 0.5; } return t; }
function chunkGeo(rad, seed) {
  const g = new THREE.IcosahedronGeometry(rad, 4), p = g.attributes.position, v = new THREE.Vector3();
  const cut = -0.25 + hash3(seed, 3, 7) * 0.3, tilt = new THREE.Vector3(hash3(seed, 1, 1) - 0.5, 1, hash3(seed, 2, 2) - 0.5).normalize();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    v.multiplyScalar(rad * (0.72 + 0.55 * fbm(v.x * 1.7 + seed, v.y * 1.7, v.z * 1.7, 4)));
    const d = v.dot(tilt) / rad; if (d < cut) v.addScaledVector(tilt, (cut - d) * rad);   // sheared, broken face
    p.setXYZ(i, v.x, v.y * 0.75, v.z);
  }
  g.computeVertexNormals(); return g;
}
function canvas(n) { const c = document.createElement("canvas"); c.width = c.height = n; return c; }
// height canvas (grey) -> tangent-space normal map
function normalFrom(hc, strength) {
  const w = hc.width, h = hc.height, src = hc.getContext("2d").getImageData(0, 0, w, h).data;
  const out = canvas(w), g = out.getContext("2d"), img = g.createImageData(w, h), d = img.data;
  const H = (x, y) => src[(((y + h) % h) * w + ((x + w) % w)) * 4];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (H(x + 1, y) - H(x - 1, y)) / 255 * strength, dy = (H(x, y + 1) - H(x, y - 1)) / 255 * strength;
    const L = Math.hypot(dx, dy, 1), i = (y * w + x) * 4;
    d[i] = (-dx / L * 0.5 + 0.5) * 255; d[i + 1] = (dy / L * 0.5 + 0.5) * 255; d[i + 2] = (1 / L * 0.5 + 0.5) * 255; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0); return out;
}
function tex(c, repeat, srgb) {
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  if (repeat) t.repeat.copy(repeat); if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t;
}
// carved stone: blocks, chisel marks, worn hollows; relief adds rosettes and a vine scroll band
function stoneHeight(n, seed, relief) {
  const c = canvas(n), g = c.getContext("2d"), r = rng(seed), u = n / 256;
  g.fillStyle = "#808080"; g.fillRect(0, 0, n, n);
  for (let i = 0; i < 2600; i++) { const v = 100 + r() * 60; g.fillStyle = `rgba(${v},${v},${v},${0.10 + r() * 0.15})`; g.beginPath(); g.arc(r() * n, r() * n, (0.6 + r() * 3) * u, 0, 6.283); g.fill(); }
  for (let i = 0; i < 180; i++) { g.strokeStyle = `rgba(60,60,60,${0.15 + r() * 0.2})`; g.lineWidth = u; const x = r() * n, y = r() * n, a = r() * 6.283, L = (4 + r() * 10) * u; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }
  if (relief) {
    g.save();
    for (let k = 0; k < 4; k++) {   // one carved panel per block
      const cx = (k % 2 ? 160 : 32) * u + 32 * u, cy = (k < 2 ? 0 : 128) * u + 64 * u + (k % 2 ? 0 : 0);
      const gr = g.createRadialGradient(cx, cy - 2 * u, 2 * u, cx, cy, 22 * u);
      gr.addColorStop(0, "#d8d8d8"); gr.addColorStop(0.55, "#a8a8a8"); gr.addColorStop(0.62, "#505050"); gr.addColorStop(1, "rgba(128,128,128,0)");
      g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, 22 * u, 0, 6.283); g.fill();
      g.strokeStyle = "#c8c8c8"; g.lineWidth = 2 * u;
      for (let p = 0; p < 8; p++) { const a = p / 8 * 6.283; g.beginPath(); g.ellipse(cx + Math.cos(a) * 9 * u, cy + Math.sin(a) * 9 * u, 7 * u, 3 * u, a, 0, 6.283); g.stroke(); }
    }
    g.strokeStyle = "#bdbdbd"; g.lineWidth = 3 * u; g.beginPath();   // vine scroll along the band
    for (let x = 0; x <= n; x += 2) { const y = 120 * u + Math.sin(x / n * 6.283 * 3) * 5 * u; x ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke(); g.restore();
  }
  g.strokeStyle = "#202020"; g.lineWidth = 5 * u;   // mortar joints, sunk
  for (let y = 0; y <= 256; y += 64) { g.beginPath(); g.moveTo(0, y * u); g.lineTo(n, y * u); g.stroke(); }
  for (let y = 0; y < 256; y += 64) for (let x = (y / 64) % 2 ? 32 : 0; x <= 256; x += 64) { g.beginPath(); g.moveTo(x * u, y * u); g.lineTo(x * u, (y + 64) * u); g.stroke(); }
  return c;
}
function roughFrom(n, seed, lo, hi) {
  const c = canvas(n), g = c.getContext("2d"), r = rng(seed);
  const mid = Math.round((lo + hi) / 2 * 255); g.fillStyle = `rgb(${mid},${mid},${mid})`; g.fillRect(0, 0, n, n);
  for (let i = 0; i < 900; i++) { const v = Math.round((lo + r() * (hi - lo)) * 255); g.fillStyle = `rgba(${v},${v},${v},.35)`; g.beginPath(); g.arc(r() * n, r() * n, (4 + r() * 26) * n / 256, 0, 6.283); g.fill(); }
  return c;
}

export function upgrade(o) {
  const { renderer, scene, camera, H, HALF_W, hallLen, midZ, throneZ, startZ, SEAT, toSun, sun, N, SP, BREACH, coarse } = o;
  let tier = o.tier;
  const hi = tier === "high", lo = tier === "low", TS = lo ? 256 : 512;
  const fx = { tier };

  // ---------- environment: procedural warm hall, through PMREM ----------
  {
    const env = new THREE.Scene();
    const box = new THREE.Mesh(new THREE.BoxGeometry(40, 20, 60), new THREE.MeshBasicMaterial({ color: 0x1a130e, side: THREE.BackSide }));
    env.add(box);
    const lamp = (color, w, h, p, k) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide })); m.position.copy(p); m.lookAt(0, 2, 0); env.add(m); };
    lamp(0xfff2d8, 6, 6, toSun.clone().multiplyScalar(9).add(new THREE.Vector3(0, 2, 0)), 14);   // the canon
    lamp(0xf2d6e0, 10, 14, new THREE.Vector3(0, 9.5, 0), 1.6);                                    // sky through the broken roof
    for (let i = -2; i <= 2; i++) { lamp(0xffa64a, 1.2, 1.2, new THREE.Vector3(-9, 3, i * 8), 6); lamp(0xffa64a, 1.2, 1.2, new THREE.Vector3(9, 3, i * 8), 6); }   // candle rows
    lamp(0xd6a740, 8, 2, new THREE.Vector3(0, -6, 0), 0.9);
    lamp(0xff2fb3, 6, 8, new THREE.Vector3(12, 4, 14), 2.2);   // neon key
    lamp(0x19d3d3, 6, 8, new THREE.Vector3(-14, 4, -10), 2.0); // neon rim                                       // gold bounce off the floor veins
    lamp(0xff2bd6, 30, 0.6, new THREE.Vector3(0, 7, 18), 4); lamp(0xff2bd6, 0.6, 14, new THREE.Vector3(16, 4, 4), 3.5);   // neon strips the gold can reflect
    lamp(0x19e6d2, 30, 0.6, new THREE.Vector3(0, 7, -24), 3); lamp(0x19e6d2, 0.6, 14, new THREE.Vector3(-16, 4, -4), 3);
    const pm = new THREE.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(env, 0.035).texture;
    pm.dispose();
  }

  // ---------- materials (PBR) ----------
  const nWall = tex(normalFrom(stoneHeight(TS, 13, true), 3.2)), rWall = tex(roughFrom(TS, 5, 0.72, 1));
  const nFloor = tex(normalFrom(stoneHeight(TS, 7, false), 2.2)), rFloor = tex(roughFrom(TS, 9, 0.12, 0.55));
  const nStone = tex(normalFrom(stoneHeight(TS, 21, true), 2.6)), rStone = tex(roughFrom(TS, 3, 0.6, 0.95));
  const fit = (t, m) => { if (m && m.map) t.repeat.copy(m.map.repeat); return t; };
  const M = o.mats;
  const floorMat = new THREE.MeshPhysicalMaterial({ map: M.floorMat.map, normalMap: fit(nFloor, M.floorMat), roughnessMap: fit(rFloor, M.floorMat), roughness: 1, metalness: 0.02,
    clearcoat: 0.35, clearcoatRoughness: 0.18, envMapIntensity: 0.9, transparent: !lo, opacity: lo ? 1 : 0.84 });
  floorMat.normalScale.set(0.6, 0.6);
  const wallMat = new THREE.MeshPhysicalMaterial({ map: M.wallMat.map, normalMap: fit(nWall, M.wallMat), roughnessMap: fit(rWall, M.wallMat), roughness: 1, metalness: 0, envMapIntensity: 0.55, side: M.wallMat.side });
  const ewMat = o.eastWall ? new THREE.MeshPhysicalMaterial({ map: o.eastWall.material.map, normalMap: nWall.clone(), roughnessMap: rWall.clone(), roughness: 1, envMapIntensity: 0.55, side: THREE.DoubleSide }) : null;
  if (ewMat) { ewMat.normalMap.repeat.copy(o.eastWall.material.map.repeat); ewMat.roughnessMap.repeat.copy(o.eastWall.material.map.repeat); }
  nStone.repeat.set(1.5, 1); rStone.repeat.set(1.5, 1);
  const stoneMat = new THREE.MeshPhysicalMaterial({ color: 0x4a4450, normalMap: nStone, roughnessMap: rStone, roughness: 1, envMapIntensity: 0.6 });
  const goldMat = new THREE.MeshPhysicalMaterial({ color: 0xffc356, metalness: 1, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.5 });
  const brushed = new THREE.MeshPhysicalMaterial({ color: 0xd6a740, metalness: 1, roughness: 0.38, anisotropy: 0.8, envMapIntensity: 1.2 });
  const wornGold = new THREE.MeshPhysicalMaterial({ color: 0xffc356, metalness: 1, roughness: 0.28, roughnessMap: tex(roughFrom(256, 41, 0.15, 0.85)), clearcoat: 0.6, clearcoatRoughness: 0.25, envMapIntensity: 1.5 });
  const wood = new THREE.MeshPhysicalMaterial({ color: 0x2a140c, roughness: 0.55, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 0.8 });
  { // lacquered wood grain
    const c = canvas(256), g = c.getContext("2d"), r = rng(77); g.fillStyle = "#3a1d10"; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 90; i++) { g.strokeStyle = `rgba(${20 + r() * 30},${8 + r() * 10},4,${0.3 + r() * 0.4})`; g.lineWidth = 1 + r() * 2; g.beginPath(); const y0 = r() * 256; for (let x = 0; x <= 256; x += 8) g.lineTo(x, y0 + Math.sin(x / 40 + i) * 4); g.stroke(); }
    wood.map = tex(c, null, true);
  }
  const swap = new Map([[M.floorMat, floorMat], [M.wallMat, wallMat], [M.stoneMat, stoneMat], [M.goldMat, goldMat]]);
  scene.traverse((m) => {
    if (!m.isMesh) return;
    if (swap.has(m.material)) m.material = swap.get(m.material);
    else if (m.material && m.material.isMeshStandardMaterial && m.material.metalness >= 0.7) { m.material.envMapIntensity = 1.2; m.material.roughness = Math.min(m.material.roughness, 0.3); }
  });
  if (o.eastWall && ewMat) o.eastWall.material = ewMat;
  // statue frames: brushed gold
  if (o.frames) o.frames.forEach((f) => { const c = f.material.color.clone(); f.material = brushed.clone(); f.material.color.copy(c); });

  // ---------- shadows ----------
  const contactTex = (() => { const c = canvas(128), g = c.getContext("2d"), gr = g.createRadialGradient(64, 64, 8, 64, 64, 64); gr.addColorStop(0, "rgba(0,0,0,.75)"); gr.addColorStop(.6, "rgba(0,0,0,.35)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
  const contact = (x, z, sx, sz) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(sx, sz), new THREE.MeshBasicMaterial({ map: contactTex, transparent: true, depthWrite: false, opacity: 0.9 })); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.006, z); m.renderOrder = 1; scene.add(m); };
  const plinths = [];
  for (let i = 0; i < N; i++) { const row = Math.floor(i / 2), side = i % 2 ? 1 : -1; plinths.push([side * 3.4, throneZ + 6 + row * SP]); }
  plinths.forEach(([x, z]) => contact(x, z, 3.2, 3.2));
  contact(0, throneZ, 8, 6);
  function setShadows(on, size) {
    renderer.shadowMap.enabled = on; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sun.castShadow = on;
    if (on) {
      sun.target.position.set(0, 0, midZ); sun.position.copy(sun.target.position).addScaledVector(toSun, 40);
      const s = sun.shadow, R = Math.max(HALF_W + 4, hallLen / 2 + 3);
      s.mapSize.set(size, size); s.camera.left = -R; s.camera.right = R; s.camera.top = R; s.camera.bottom = -R; s.camera.near = 5; s.camera.far = 90;
      s.bias = -0.00035; s.normalBias = 0.035; s.radius = 3; s.camera.updateProjectionMatrix();
      if (s.map) { s.map.dispose(); s.map = null; }
    }
    scene.traverse((m) => { if (m.isMesh || m.isInstancedMesh) { const tr = m.material && (m.material.transparent || m.material.isMeshBasicMaterial); m.castShadow = on && !tr && m !== o.floor; m.receiveShadow = on && !m.material.isMeshBasicMaterial; } });
    renderer.shadowMap.needsUpdate = true;
  }

  // ---------- reflective floor ----------
  let mirror = null;
  function setMirror(on, scale) {
    if (mirror) { scene.remove(mirror); mirror.getRenderTarget().dispose(); mirror = null; }
    if (!on) { floorMat.transparent = false; floorMat.opacity = 1; floorMat.needsUpdate = true; return; }
    const w = renderer.domElement.width * scale, h = renderer.domElement.height * scale;
    mirror = new Reflector(new THREE.PlaneGeometry(HALF_W * 2, hallLen), { textureWidth: Math.max(128, w | 0), textureHeight: Math.max(128, h | 0), color: 0x77707a, clipBias: 0.003 });
    mirror.rotation.x = -Math.PI / 2; mirror.position.set(0, -0.004, midZ);
    mirror.getRenderTarget().texture.minFilter = THREE.LinearFilter;   // low resolution = soft, rough-looking reflection
    scene.add(mirror);
    floorMat.transparent = true; floorMat.opacity = 0.84; floorMat.needsUpdate = true;
  }

  // ---------- volumetric canon beam ----------
  if (o.beam) {
    const bm = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(0xfff2d8) }, uK: { value: 0.55 } },
      vertexShader: "varying vec3 vN; varying vec3 vV; varying vec2 vUv; varying vec3 vW; void main(){ vUv=uv; vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; vN=normalize(mat3(modelMatrix)*normal); vV=normalize(cameraPosition-w.xyz); gl_Position=projectionMatrix*viewMatrix*w; }",
      fragmentShader: "uniform float uTime; uniform vec3 uColor; uniform float uK; varying vec3 vN; varying vec3 vV; varying vec2 vUv; varying vec3 vW;" +
        "float h(vec3 p){ return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453); }" +
        "float n3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z); }" +
        "void main(){ float core=pow(abs(dot(normalize(vN),vV)),2.2); float along=smoothstep(0.,.15,vUv.y)*smoothstep(1.,.55,vUv.y);" +
        " float n=.55+.45*n3(vW*1.6+vec3(0.,-uTime*.25,uTime*.12)); float a=core*along*n*uK; gl_FragColor=vec4(uColor*a,a); }"
    });
    o.beam.material = bm; fx.beamMat = bm;
    const outer = o.beam.clone(); outer.scale.set(1.35, 1, 1.35); outer.material = bm.clone(); outer.material.uniforms = THREE.UniformsUtils.clone(bm.uniforms); outer.material.uniforms.uK.value = 0.22;
    o.beam.parent.add(outer); fx.beamOuter = outer.material;
  }

  // ---------- worn gilt + carved plinth rings ----------
  plinths.forEach(([x, z]) => {
    const top = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.026, 10, 72), wornGold); top.rotation.x = Math.PI / 2; top.position.set(x, 0.89, z); scene.add(top);
  });

  // ---------- engraved inscription band around the dais ----------
  {
    const c = document.createElement("canvas"); c.width = 2048; c.height = 96; const g = c.getContext("2d");
    g.fillStyle = "#2a2530"; g.fillRect(0, 0, 2048, 96);
    g.font = "600 52px 'Cormorant Garamond', Georgia, serif"; g.textBaseline = "middle";
    const line = "HEAVY IS THE CROWN \u2726 THE CROWN REMEMBERS \u2726 ";
    let x = 10; while (x < 2048) { g.fillStyle = "rgba(0,0,0,.8)"; g.fillText(line, x + 2, 50); g.fillStyle = "#e2c56a"; g.fillText(line, x, 48); x += g.measureText(line).width; }
    g.strokeStyle = "#d6a740"; g.lineWidth = 3; g.strokeRect(2, 6, 2044, 84);
    const hc = document.createElement("canvas"); hc.width = 2048; hc.height = 96; const hg = hc.getContext("2d");
    hg.fillStyle = "#808080"; hg.fillRect(0, 0, 2048, 96); hg.font = g.font; hg.textBaseline = "middle"; hg.fillStyle = "#303030";
    x = 10; while (x < 2048) { hg.fillText(line, x, 48); x += hg.measureText(line).width; }
    const m = new THREE.MeshPhysicalMaterial({ map: tex(c, null, true), normalMap: tex(normalFrom(hc, 4)), roughness: 0.55, metalness: 0.35, envMapIntensity: 1 });
    const band = (w, rotY, px, pz) => { const mm = m.clone(); mm.map = m.map.clone(); mm.map.repeat.set(w / 3.6, 1); mm.map.needsUpdate = true; mm.normalMap = m.normalMap.clone(); mm.normalMap.repeat.set(w / 3.6, 1); mm.normalMap.needsUpdate = true;
      const p = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.22), mm); p.rotation.y = rotY; p.position.set(px, 0.45, throneZ + pz); scene.add(p); };
    band(4.8, 0, 0, 1.605); band(4.8, Math.PI, 0, -1.605); band(3.2, Math.PI / 2, 2.405, 0); band(3.2, -Math.PI / 2, -2.405, 0);
  }

  // ---------- banners (cloth) on lacquered poles ----------
  const banners = [];
  {
    const c = canvas(256); c.height = 512; const g = c.getContext("2d");
    const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#5a0f1c"); gr.addColorStop(1, "#2e0710"); g.fillStyle = gr; g.fillRect(0, 0, 256, 512);
    g.strokeStyle = "#d6a740"; g.lineWidth = 6; g.strokeRect(14, 10, 228, 450);
    g.fillStyle = "#e2c56a"; g.beginPath(); g.moveTo(68, 250); g.lineTo(68, 190); g.lineTo(98, 220); g.lineTo(128, 170); g.lineTo(158, 220); g.lineTo(188, 190); g.lineTo(188, 250); g.closePath(); g.fill();
    g.fillRect(64, 255, 128, 16);
    g.font = "600 30px 'Cormorant Garamond', Georgia, serif"; g.textAlign = "center"; g.fillText("HEAVY IS", 128, 330); g.fillText("THE CROWN", 128, 365);
    for (let x = 14; x < 242; x += 12) { g.fillRect(x, 460, 6, 40); }   // fringe
    const bt = tex(c, null, true);
    const segX = lo ? 4 : 10, segY = lo ? 8 : 18;
    const cloth = new THREE.MeshPhysicalMaterial({ map: bt, roughness: 0.85, sheen: 1, sheenColor: new THREE.Color(0x9a2a3a), sheenRoughness: 0.5, side: THREE.DoubleSide, alphaTest: 0.5 });
    { const g2 = c.getContext("2d"); g2.clearRect(0, 500, 256, 12); for (let x = 14; x < 242; x += 12) g2.clearRect(x + 6, 460, 6, 52); bt.needsUpdate = true; }
    for (let z = startZ - 1.6; z > throneZ + 2; z -= SP * 1.5) for (const side of [-1, 1]) {
      if (side > 0 && Math.abs(z - BREACH.z) < 3.6) continue;
      const geo = new THREE.PlaneGeometry(1.1, 2.6, segX, segY);
      const m = new THREE.Mesh(geo, cloth); m.position.set(side * (HALF_W - 0.12), 6.6, z); m.rotation.y = -side * Math.PI / 2; scene.add(m);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.4, 8), wood); pole.rotation.z = Math.PI / 2; pole.rotation.y = -side * Math.PI / 2; pole.position.set(side * (HALF_W - 0.12), 7.92, z); scene.add(pole);
      for (const e of [-1, 1]) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), goldMat); f.position.set(side * (HALF_W - 0.12), 7.92, z + e * 0.72); scene.add(f); }
      banners.push({ geo, base: Float32Array.from(geo.attributes.position.array), ph: Math.random() * 6 });
    }
  }

  // ---------- candle sconces with flicker ----------
  const flames = [], flameLights = [];
  {
    const fc = canvas(64), g = fc.getContext("2d"), gr = g.createRadialGradient(32, 40, 2, 32, 34, 30);
    gr.addColorStop(0, "rgba(255,250,230,1)"); gr.addColorStop(.25, "rgba(255,200,110,.9)"); gr.addColorStop(1, "rgba(255,120,30,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    const flameMat = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(fc), blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, color: 0xffd9a0 });
    const wax = new THREE.MeshPhysicalMaterial({ color: 0xf3e8d2, roughness: 0.45, transmission: lo ? 0 : 0.25, thickness: 0.1 });
    const spots = [];
    for (let z = startZ; z > throneZ - 1; z -= SP) for (const sx of [-1, 1]) spots.push([sx * (HALF_W - 0.6) - sx * 0.52, z]);
    const lit = hi ? 6 : lo ? 0 : 2;
    spots.forEach(([x, z], i) => {
      const br = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.34), wood); br.position.set(x + Math.sign(x) * 0.05, 2.75, z); br.rotation.y = Math.PI / 2; scene.add(br);
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.06, 0.08, 16), goldMat); cup.position.set(x, 2.82, z); scene.add(cup);
      const cnd = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.32, 12), wax); cnd.position.set(x, 3.02, z); scene.add(cnd);
      const fl = new THREE.Sprite(flameMat); fl.position.set(x, 3.25, z); fl.scale.set(0.16, 0.26, 1); scene.add(fl);
      flames.push({ s: fl, ph: Math.random() * 100 });
      if (i >= spots.length - lit) { const L = new THREE.PointLight(0xffb060, 2.2, 7, 2); L.position.set(x - Math.sign(x) * 0.2, 3.3, z); scene.add(L); flameLights.push({ L, ph: Math.random() * 100 }); }
    });
  }

  // ---------- hall dust motes ----------
  const MOTES = hi ? 500 : lo ? 120 : 260;
  const mPos = new Float32Array(MOTES * 3), mSeed = new Float32Array(MOTES);
  for (let i = 0; i < MOTES; i++) { mPos[i * 3] = (Math.random() - 0.5) * HALF_W * 2; mPos[i * 3 + 1] = Math.random() * 6; mPos[i * 3 + 2] = throneZ + Math.random() * (startZ - throneZ + 3); mSeed[i] = Math.random() * 100; }
  const mGeo = new THREE.BufferGeometry(); mGeo.setAttribute("position", new THREE.BufferAttribute(mPos, 3));
  const motes = new THREE.Points(mGeo, new THREE.PointsMaterial({ size: 0.022, color: 0xffe6c0, transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending })); motes.frustumCulled = false; scene.add(motes);

  // ---------- petals settle into the floor cracks ----------
  const SET = lo ? 60 : 180;
  const pg = new THREE.PlaneGeometry(0.11, 0.06); pg.rotateX(-Math.PI / 2);
  const settled = new THREE.InstancedMesh(pg, new THREE.MeshStandardMaterial({ color: 0xf6b8ca, roughness: 0.7, side: THREE.DoubleSide, transparent: true, opacity: 0.9 }), SET);
  settled.count = 0; scene.add(settled);
  let sNext = 0; const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e4 = new THREE.Euler(), v4 = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
  const seam = 2.2 / 4;   // floor tile joints (the stone texture's 64 px blocks, repeated every 2.2 m)
  fx.settle = (x, z) => {
    if (Math.abs(x) > HALF_W - 0.2 || z > startZ + 2.5 || z < throneZ - 2) return;
    const zr = midZ + Math.round((z - midZ) / seam) * seam + (Math.random() - 0.5) * 0.04;
    e4.set(0, Math.random() * 6.283, 0); q4.setFromEuler(e4);
    m4.compose(v4.set(x, 0.008, zr), q4, one.set(0.8 + Math.random() * 0.5, 1, 0.8 + Math.random() * 0.5));
    settled.setMatrixAt(sNext, m4); sNext = (sNext + 1) % SET; settled.count = Math.max(settled.count, sNext || SET);
    settled.instanceMatrix.needsUpdate = true;
  };

  // ---------- neon marble (style reference: carved marble bust, magenta key, teal rim, purple starfield, embers) ----------
  const MAG = 0xff2fb3, TEAL = 0x19d3d3;
  // Procedural marble: white/grey base, strong dark noise veins, finer secondary veins, hairline cracks.
  // Low saturation, so the magenta/teal comes only from the lights. u wraps around (sampled on a cylinder).
  function marbleMaps(n, seed, b0, dark) {
    b0 = b0 || [232, 229, 225];
    const W = n, Hh = n / 2, mk = () => { const c = canvas(W); c.height = Hh; const g = c.getContext("2d"); return [c, g, g.createImageData(W, Hh)]; };
    const [ec, eg, eim] = mk(), ed = eim.data;
    const [c, g, img] = mk(), [hc, hg, him] = mk(), [rc, rg, rim] = mk(), d = img.data, hd = him.data, rd = rim.data;
    for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
      const a = x / W * 6.2832, cx = Math.cos(a) * 1.6, cz = Math.sin(a) * 1.6, cy = y / Hh * 2.2 + seed;
      const t = fbm(cx + seed, cy, cz, 5) * 7.5;
      const v1 = Math.pow(Math.abs(Math.sin((cx * 1.3 + cy * 2.1 + t) * 1.7)), 0.22);
      const v2 = Math.pow(Math.abs(Math.sin((cz * 2.6 - cy * 1.4 + t * 1.6) * 2.9)), 0.12);
      const cloud = fbm(cx * 3 + 9, cy * 3, cz * 3, 3);
      const k = Math.min(v1, 0.35 + 0.65 * v2) * (0.86 + 0.18 * cloud), i = (y * W + x) * 4, tone = 0.25 + 0.75 * k;
      if (dark) { const vv = Math.pow(1 - k, 1.6); d[i] = b0[0] + vv * 150; d[i + 1] = b0[1] + vv * 120; d[i + 2] = b0[2] + vv * 150; ed[i] = vv * 255; ed[i + 1] = vv * 90; ed[i + 2] = vv * 230; }
      else { d[i] = b0[0] * tone; d[i + 1] = b0[1] * tone; d[i + 2] = b0[2] * tone + (1 - k) * 6; }
      d[i + 3] = 255; ed[i + 3] = 255;
      hd[i] = hd[i + 1] = hd[i + 2] = 128 + (k - 1) * 40 + cloud * 14; hd[i + 3] = 255;
      rd[i] = rd[i + 1] = rd[i + 2] = (0.14 + (1 - k) * 0.35 + cloud * 0.12) * 255; rd[i + 3] = 255;
    }
    g.putImageData(img, 0, 0); eg.putImageData(eim, 0, 0); hg.putImageData(him, 0, 0); rg.putImageData(rim, 0, 0);
    const r = rng(seed * 977 + 13);
    for (let k = 0; k < 6; k++) {
      let x = r() * W, y = r() * Hh, dd = r() * 6.283;
      g.strokeStyle = "rgba(30,26,30,.85)"; hg.strokeStyle = "#1a1a1a"; rg.strokeStyle = "#e0e0e0"; g.lineWidth = hg.lineWidth = rg.lineWidth = 1 + r();
      [g, hg, rg].forEach((q) => { q.beginPath(); q.moveTo(x, y); });
      for (let j = 0; j < 30; j++) { dd += (r() - 0.5) * 1.1; x += Math.cos(dd) * 5; y += Math.sin(dd) * 5; [g, hg, rg].forEach((q) => q.lineTo(x, y)); }
      [g, hg, rg].forEach((q) => q.stroke());
    }
    return { map: tex(c, null, true), normal: tex(normalFrom(hc, 3)), rough: tex(rc), emissive: dark ? tex(ec, null, true) : null };
  }
  const MB = marbleMaps(lo ? 256 : 512, 3, [18, 10, 26], true), MG = marbleMaps(lo ? 256 : 512, 7, [178, 174, 172]);
  const marble = new THREE.MeshPhysicalMaterial({ map: MB.map, normalMap: MB.normal, roughnessMap: MB.rough, roughness: 1, metalness: 0,
    emissiveMap: MB.emissive, emissive: 0xffffff, emissiveIntensity: 1.25, clearcoat: 1, clearcoatRoughness: 0.05, sheen: 0.3, sheenColor: new THREE.Color(0xffffff), sheenRoughness: 0.7, envMapIntensity: 0.9 });
  marble.normalScale.set(0.8, 0.8);
  const marbleGrey = marble.clone(); marbleGrey.map = MG.map; marbleGrey.normalMap = MG.normal; marbleGrey.roughnessMap = MG.rough; marbleGrey.emissiveMap = null; marbleGrey.emissive = new THREE.Color(0); marbleGrey.clearcoatRoughness = 0.1; marbleGrey.clearcoat = 0.2;
  // chipped plinths: a finer cylinder with broken rims and a few gouges, one per plinth (seeded)
  let pk = 0;
  scene.traverse((m) => {
    if (!m.isMesh || m.geometry !== o.plinthGeo) return;
    const r = rng(101 + pk), seed = pk++;
    const prof = [], P = (x, y) => prof.push(new THREE.Vector2(x, y)), arc = (r0, y0, rad, a0, a1, n) => { for (let k = 0; k <= n; k++) { const t = a0 + (a1 - a0) * k / n; P(r0 + Math.cos(t) * rad, y0 + Math.sin(t) * rad); } };
    P(0.001, -0.45); P(1.25, -0.45); P(1.25, -0.37);                          // plinth block
    arc(1.22, -0.315, 0.055, -Math.PI / 2, Math.PI / 2, 8);                   // lower torus
    P(1.16, -0.255); arc(1.16, -0.19, 0.06, -Math.PI / 2, -Math.PI * 1.5, 8); // fillet, scotia (concave)
    P(1.15, -0.135); arc(1.13, -0.095, 0.04, -Math.PI / 2, Math.PI / 2, 6);   // upper torus
    P(1.06, -0.05); P(1.04, 0.3);                                             // die
    arc(1.06, 0.33, 0.03, -Math.PI / 2, Math.PI / 2, 6);                      // astragal
    arc(1.16, 0.36, 0.09, Math.PI, Math.PI * 1.5, 6);                         // cavetto
    P(1.17, 0.4); P(1.17, 0.45); P(0.001, 0.45);                              // cornice
    const geo = new THREE.LatheGeometry(prof, 72), p = geo.attributes.position;
    const gouges = [0, 1, 2, 3].map(() => [r() * 6.283, -0.4 + r() * 0.85, 0.12 + r() * 0.3]);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.atan2(z, x), rad = Math.hypot(x, z);
      if (rad < 0.01) continue;
      let k = 1 - (Math.abs(y) > 0.36 ? 0.025 * vnoise(Math.cos(a) * 4 + seed * 9, y * 9, Math.sin(a) * 4) : 0) - 0.006 * vnoise(Math.cos(a) * 9, y * 14, Math.sin(a) * 9 + seed);
      for (const [ga, gy, gw] of gouges) { const da = Math.abs(Math.atan2(Math.sin(a - ga), Math.cos(a - ga))); if (da < gw && Math.abs(y - gy) < 0.12) k -= 0.07 * Math.pow((1 - da / gw) * (1 - Math.abs(y - gy) / 0.12), 0.6); }
      p.setX(i, x * k); p.setZ(i, z * k); if (y > 0.44 && rad > 1.1) p.setY(i, y - vnoise(Math.cos(a) * 6, 1, Math.sin(a) * 6 + seed) * 0.05);
    }
    geo.computeVertexNormals(); m.geometry = geo; m.material = marble;
    for (let c = 0; c < 4; c++) {   // broken chips at the foot
      const ch = new THREE.Mesh(chunkGeo(0.05 + r() * 0.07, 40 + pk * 4 + c), marble);
      const a = r() * 6.283; ch.position.set(Math.cos(a) * (1.3 + r() * 0.4), 0.04, Math.sin(a) * (1.3 + r() * 0.4)); ch.rotation.set(r() * 3, r() * 3, r() * 3);
      m.parent.add(ch);
    }
  });
  // marble framing around each statue picture (the picture itself is untouched, uncropped)
  const darkGold = new THREE.MeshPhysicalMaterial({ color: 0x7a5418, metalness: 1, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.15, envMapIntensity: 1.5 });
  if (o.frames) o.frames.forEach((f) => { f.material = darkGold; });
  // two-tone neon rim: magenta key from the front-right, teal fill/rim from the left; the canon stays the hero light
  const key = new THREE.SpotLight(0xff2bd6, 3.2, 0, 0.9, 0.6, 0); key.position.set(HALF_W + 2, 7, midZ + 2); key.target.position.set(-1, 1, midZ - 3);   // raking from the side, so its highlight stays off the floor in front of the camera
  const rim = new THREE.DirectionalLight(0x19e6d2, 3.2 * 0.25); rim.position.set(-8, 4, -6); rim.target.position.set(0, 1.5, 0);
  const throneRim = new THREE.SpotLight(0xff2bd6, 5, 0, 0.45, 0.6, 0); throneRim.position.set(0, 5, throneZ - 3.5); throneRim.target.position.set(0, 1.4, throneZ + 0.5);
  scene.add(key, key.target, rim, rim.target, throneRim, throneRim.target);
  // no purple fill: the magenta/teal live only in the two neon lights, the stone albedo stays neutral
  // night sky through the broken ceiling: deep purple nebula and stars
  if (o.skyMat) {
    const c = document.createElement("canvas"); c.width = 1024; c.height = 1024; const g = c.getContext("2d"), r = rng(2024);
    g.fillStyle = "#0b0518"; g.fillRect(0, 0, 1024, 1024);
    const blob = (x, y, rad, col) => { const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, col); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); };
    g.globalCompositeOperation = "lighter";
    for (let i = 0; i < 26; i++) blob(r() * 1024, r() * 1024, 80 + r() * 260, i % 3 ? `rgba(${90 + r() * 80},${20 + r() * 30},${150 + r() * 80},.18)` : `rgba(255,47,179,${0.08 + r() * 0.08})`);
    for (let i = 0; i < 8; i++) blob(r() * 1024, r() * 1024, 60 + r() * 140, `rgba(25,211,211,${0.05 + r() * 0.06})`);
    for (let i = 0; i < 2600; i++) { const s = r() < 0.06 ? 2.6 + r() * 1.6 : 0.6 + r() * 1.3; g.fillStyle = `rgba(${220 + r() * 35},${210 + r() * 45},255,${0.4 + r() * 0.6})`; g.beginPath(); g.arc(r() * 1024, r() * 1024, s, 0, 6.283); g.fill(); }
    g.globalCompositeOperation = "source-over";
    const st = new THREE.CanvasTexture(c); st.colorSpace = THREE.SRGBColorSpace;
    o.skyMat.map = st; o.skyMat.toneMapped = false; o.skyMat.needsUpdate = true;
    if (o.sky) o.sky.scale.set(2.2, 2.2, 1);
    // bright stars well above the break, so the night reads clearly through it
    const SN = lo ? 4000 : 7000, sp = new Float32Array(SN * 3);
    for (let i = 0; i < SN; i++) { sp[i * 3] = (Math.random() - 0.5) * 60; sp[i * 3 + 1] = H + 12 + Math.random() * 20; sp[i * 3 + 2] = midZ + (Math.random() - 0.5) * hallLen * 2; }
    const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(sp, 3));
    const stars = new THREE.Points(sg, new THREE.PointsMaterial({ size: 0.11, color: 0xf2eaff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false }));
    stars.frustumCulled = false; scene.add(stars);
  }
  // ---------- stone realism: varied floor slabs, stone walls, fluted marble columns with carved capitals, broken marble rubble ----------
  {
    const n = lo ? 512 : 1024, r = rng(55), c = canvas(n), g = c.getContext("2d"), hc = canvas(n), hg = hc.getContext("2d"), rc = canvas(n), rg = rc.getContext("2d"), s4 = n / 4;
    g.fillStyle = "#151316"; g.fillRect(0, 0, n, n); hg.fillStyle = "#202020"; hg.fillRect(0, 0, n, n); rg.fillStyle = "#e6e6e6"; rg.fillRect(0, 0, n, n);
    for (let ty = 0; ty < 4; ty++) for (let tx = 0; tx < 4; tx++) {
      const j = 2 + r() * 5, x0 = tx * s4 + j / 2, y0 = ty * s4 + j / 2, w = s4 - j, l = 44 + r() * 30, warm = r() * 6;
      g.fillStyle = `rgb(${l + warm},${l + warm * 0.6},${l})`; g.fillRect(x0, y0, w, w);
      for (let k = 0; k < 160; k++) { const v = l + (r() - 0.5) * 26; g.fillStyle = `rgba(${v},${v - 1},${v - 2},.35)`; g.beginPath(); g.arc(x0 + r() * w, y0 + r() * w, 2 + r() * s4 * 0.12, 0, 6.283); g.fill(); }
      g.strokeStyle = `rgba(${l + 40},${l + 38},${l + 36},.25)`; g.lineWidth = 1 + r(); g.beginPath(); let vx = x0 + r() * w, vy = y0; g.moveTo(vx, vy);
      while (vy < y0 + w) { vx += (r() - 0.5) * 18; vy += 8; g.lineTo(Math.max(x0, Math.min(x0 + w, vx)), vy); } g.stroke();
      const hv = 120 + r() * 30; hg.fillStyle = `rgb(${hv},${hv},${hv})`; hg.fillRect(x0, y0, w, w);
      const rv = (0.12 + r() * 0.35) * 255; rg.fillStyle = `rgb(${rv},${rv},${rv})`; rg.fillRect(x0, y0, w, w);
      for (let k = 0; k < 4; k++) { const wx = x0 + r() * w, wy = y0 + r() * w, wr = s4 * (0.08 + r() * 0.2), gr = rg.createRadialGradient(wx, wy, 0, wx, wy, wr); gr.addColorStop(0, "rgba(200,200,200,.55)"); gr.addColorStop(1, "rgba(200,200,200,0)"); rg.fillStyle = gr; rg.fillRect(wx - wr, wy - wr, wr * 2, wr * 2); }
      if (r() < 0.5) { const cx = r() < 0.5 ? x0 : x0 + w, cy = r() < 0.5 ? y0 : y0 + w, cr = 3 + r() * 9; [g, hg].forEach((q, qi) => { q.fillStyle = qi ? "#303030" : "#141215"; q.beginPath(); q.arc(cx, cy, cr, 0, 6.283); q.fill(); }); }
    }
    const rep = M.floorMat.map.repeat;
    floorMat.map = tex(c, rep, true); floorMat.normalMap = tex(normalFrom(hc, 3), rep); floorMat.roughnessMap = tex(rc, rep); floorMat.needsUpdate = true;
    const wn = lo ? 256 : 512, wc = canvas(wn), wg = wc.getContext("2d"), u = wn / 256, wr = rng(66);
    wg.fillStyle = "#121112"; wg.fillRect(0, 0, wn, wn);
    for (let y = 0; y < 256; y += 64) for (let x = (y / 64) % 2 ? -32 : 0; x < 256; x += 64) {
      const l = 52 + wr() * 34; wg.fillStyle = `rgb(${l + 4},${l + 2},${l})`; wg.fillRect((x + 2) * u, (y + 2) * u, 60 * u, 60 * u);
      for (let k = 0; k < 40; k++) { const v = l + (wr() - 0.5) * 30; wg.fillStyle = `rgba(${v},${v},${v - 2},.3)`; wg.beginPath(); wg.arc((x + 2 + wr() * 60) * u, (y + 2 + wr() * 60) * u, (1 + wr() * 8) * u, 0, 6.283); wg.fill(); }
    }
    if (M.wallMat.map) { wallMat.map = tex(wc, M.wallMat.map.repeat, true); wallMat.color.set(0xffffff); wallMat.needsUpdate = true; }
    if (ewMat && ewMat.map) { ewMat.map = tex(wc, ewMat.map.repeat, true); ewMat.color.set(0xffffff); ewMat.needsUpdate = true; }
    if (o.colMesh) {
      const CH = H - 1.3, cg = new THREE.CylinderGeometry(0.4, 0.46, CH, 96, 8, true), cp = cg.attributes.position;
      for (let i = 0; i < cp.count; i++) { const x = cp.getX(i), z = cp.getZ(i), f = 1 - 0.075 * Math.pow(0.5 + 0.5 * Math.cos(Math.atan2(z, x) * 24), 2); cp.setX(i, x * f); cp.setZ(i, z * f); }
      cg.computeVertexNormals(); cg.translate(0, -H / 2 + 0.55 + CH / 2, 0);
      o.colMesh.geometry = cg; o.colMesh.material = marbleGrey;
      const lathe = (pts, y0) => { const gg = new THREE.LatheGeometry(pts.map(([a, b]) => new THREE.Vector2(a, b)), 48); gg.translate(0, y0, 0); return gg; };
      const baseG = lathe([[0.001, 0], [0.62, 0], [0.62, 0.16], [0.6, 0.2], [0.58, 0.26], [0.53, 0.3], [0.5, 0.33], [0.47, 0.37], [0.5, 0.41], [0.52, 0.45], [0.49, 0.5], [0.46, 0.55], [0.001, 0.55]], -H / 2);
      const capG = lathe([[0.001, 0], [0.4, 0], [0.43, 0.03], [0.43, 0.07], [0.41, 0.1], [0.45, 0.16], [0.53, 0.26], [0.6, 0.33], [0.62, 0.36], [0.001, 0.36]], H / 2 - 0.75);
      const abG = new THREE.BoxGeometry(1.3, 0.18, 1.3); abG.translate(0, H / 2 - 0.3, 0);
      const mm = new THREE.Matrix4();
      for (const geo of [baseG, capG, abG]) { const im = new THREE.InstancedMesh(geo, marbleGrey, o.colMesh.count); im.castShadow = im.receiveShadow = true; for (let i = 0; i < o.colMesh.count; i++) { o.colMesh.getMatrixAt(i, mm); im.setMatrixAt(i, mm); } scene.add(im); }
    }
    if (o.rub) { o.rub.geometry = chunkGeo(0.35, 9); o.rub.material = marbleGrey; }
  }
  scene.background = new THREE.Color(0x0c0518); if (scene.fog) scene.fog.color.set(0x140828);
  // embers drifting up alongside the petals
  const EMB = hi ? 220 : lo ? 50 : 120;
  const ePos = new Float32Array(EMB * 3), eVel = new Float32Array(EMB);
  const eReset = (i, anyY) => { ePos[i * 3] = (Math.random() - 0.5) * HALF_W * 1.8; ePos[i * 3 + 1] = anyY ? Math.random() * H : 0.2; ePos[i * 3 + 2] = throneZ + Math.random() * (startZ - throneZ + 2); eVel[i] = 0.12 + Math.random() * 0.3; };
  for (let i = 0; i < EMB; i++) eReset(i, true);
  const eGeo = new THREE.BufferGeometry(); eGeo.setAttribute("position", new THREE.BufferAttribute(ePos, 3));
  const eTex = (() => { const c = canvas(32), g = c.getContext("2d"), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, "rgba(255,240,220,1)"); gr.addColorStop(.3, "rgba(255,120,90,.9)"); gr.addColorStop(1, "rgba(255,47,179,0)"); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); return new THREE.CanvasTexture(c); })();
  const embers = new THREE.Points(eGeo, new THREE.PointsMaterial({ map: eTex, size: 0.07, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, color: 0xffa080 }));
  embers.frustumCulled = false; scene.add(embers);
  fx.embers = (dt, t) => {
    for (let i = 0; i < EMB; i++) { const j = i * 3; ePos[j + 1] += eVel[i] * dt; ePos[j] += Math.sin(t * 1.3 + i) * 0.004; ePos[j + 2] += Math.cos(t * 1.1 + i * 0.7) * 0.004; if (ePos[j + 1] > H + 1) eReset(i, false); }
    eGeo.attributes.position.needsUpdate = true;
    embers.material.opacity = 0.7 + 0.3 * Math.sin(t * 9);
  };

  // ---------- post: SSAO (high), gilt bloom, reveal depth of field ----------
  let composer = null, ssao = null, bokeh = null, bloom = null;
  function buildComposer() {
    if (composer) { composer.dispose && composer.dispose(); composer = null; }
    const w = renderer.domElement.width, h = renderer.domElement.height;
    if (tier === "low") {   // cheap half-res bloom so the neon still glows
      composer = new EffectComposer(renderer); composer.setPixelRatio(1); composer.setSize(w, h); composer.addPass(new RenderPass(scene, camera));
      bloom = new UnrealBloomPass(new THREE.Vector2(w / 2, h / 2), 0.7, 0.4, 0.85); composer.addPass(bloom); composer.addPass(new OutputPass()); ssao = null; bokeh = null; return;
    }
    composer = new EffectComposer(renderer); composer.setPixelRatio(1); composer.setSize(w, h);
    composer.addPass(new RenderPass(scene, camera));
    if (tier === "high") { ssao = new SSAOPass(scene, camera, w, h); ssao.kernelRadius = 0.5; ssao.minDistance = 0.0015; ssao.maxDistance = 0.06; composer.addPass(ssao); } else ssao = null;
    bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.7, 0.45, 0.85); composer.addPass(bloom);   // high threshold: only gilt highlights and flames
    bokeh = new BokehPass(scene, camera, { focus: 10, aperture: 0.0018, maxblur: 0.009 }); bokeh.enabled = false; composer.addPass(bokeh);
    composer.addPass(new OutputPass());
  }
  function applyTier() {
    const h = tier === "high", m = tier === "med";
    setShadows(h || m, h ? 2048 : 1024);
    setMirror(h || m, h ? 0.5 : 0.3);
    buildComposer();
    flameLights.forEach((f) => { f.L.visible = h || (m && f === flameLights[flameLights.length - 1]) || (m && f === flameLights[flameLights.length - 2]); });
    fx.tier = tier; if (o.stage) o.stage.dataset.tier = tier;
  }
  applyTier();
  fx.setSize = () => { if (composer) composer.setSize(renderer.domElement.width, renderer.domElement.height); if (ssao) ssao.setSize(renderer.domElement.width, renderer.domElement.height); if (mirror) setMirror(true, tier === "high" ? 0.5 : 0.3); };
  fx.degrade = () => { if (tier === "high") tier = "med"; else if (tier === "med") tier = "low"; else return false; applyTier(); return true; };

  fx.render = (dt, t, reveal, camPos) => {
    if (fx.beamMat) { fx.beamMat.uniforms.uTime.value = t; fx.beamOuter.uniforms.uTime.value = t; }
    // cloth
    if (!lo || (t * 10 | 0) % 3 === 0) for (const b of banners) {
      const p = b.geo.attributes.position, a = p.array, B = b.base;
      for (let i = 0; i < a.length; i += 3) { const y = B[i + 1], hang = (1.3 - y) / 2.6; a[i + 2] = B[i + 2] + Math.sin(t * 1.4 + b.ph + B[i] * 3 + y * 1.7) * 0.05 * hang + Math.sin(t * 0.6 + b.ph) * 0.03 * hang; }
      p.needsUpdate = true; b.geo.computeVertexNormals();
    }
    // flicker
    for (const f of flames) { const k = 0.85 + 0.15 * Math.sin(t * 13 + f.ph) * Math.sin(t * 7.3 + f.ph * 2); f.s.scale.set(0.16 * k, 0.26 * (0.9 + 0.2 * k), 1); }
    for (const f of flameLights) f.L.intensity = 2.2 * (0.82 + 0.18 * Math.sin(t * 11 + f.ph) * Math.sin(t * 6.1 + f.ph));
    // motes
    for (let i = 0; i < MOTES; i++) { const j = i * 3, s = mSeed[i]; mPos[j] += Math.sin(t * 0.21 + s) * 0.0015; mPos[j + 1] += Math.sin(t * 0.17 + s * 1.3) * 0.0012; mPos[j + 2] += Math.cos(t * 0.19 + s) * 0.0015; }
    mGeo.attributes.position.needsUpdate = true;
    fx.embers(dt, t);
    if (composer) {
      if (bokeh) { bokeh.enabled = !!reveal; if (reveal) bokeh.uniforms.focus.value = Math.max(2, camPos.distanceTo(SEAT)); }
      composer.render(dt);
    } else renderer.render(scene, camera);
  };
  return fx;
}
