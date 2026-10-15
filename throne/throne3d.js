/* Throne Room 3D hall. three.js r160 vendored in ./vendor (MIT, see THREE-LICENSE.txt). */
import * as THREE from "./vendor/three-0.160.0.module.min.js";

export function start(statues) {
  const canvas = document.getElementById("hall");
  const stage = document.getElementById("stage");
  const loading = document.getElementById("loading");
  const coarse = matchMedia("(pointer: coarse)").matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !coarse, powerPreference: "high-performance" });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const DPR_MAX = Math.min(window.devicePixelRatio || 1, 1.5);
  // Software GL (no GPU) renders on the CPU: start small and slow.
  let soft = false;
  try { const gl = renderer.getContext(); const ext = gl.getExtension("WEBGL_debug_renderer_info"); const name = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : ""; soft = /swiftshader|llvmpipe|software|basic render/i.test(name); } catch (e) {}
  let dpr = soft ? 0.75 : DPR_MAX;
  renderer.setPixelRatio(dpr);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07060a);
  scene.fog = new THREE.Fog(0x07060a, 14, 46);
  const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 80);

  const N = statues.length;
  const SP = 4.6;                       // spacing between plinth pairs
  const rows = Math.ceil(N / 2);
  const throneZ = -(rows * SP + 6);     // throne sits past the last pair
  const startZ = 6;
  const HALF_W = 6;
  const hallLen = startZ - throneZ + 6;
  const midZ = (startZ + throneZ) / 2;

  // ---------- light ----------
  const hemi = new THREE.HemisphereLight(0xb0a4cc, 0x2a1d10, 0.75);
  scene.add(hemi);
  // Light canon: directional, elevation 31.7175 deg, azimuth 137.508 deg, #fff2d8, intensity 3.0.
  // Compass for the hall: north points down the aisle toward the throne (-z), east is +x; azimuth runs clockwise from north.
  const EL = THREE.MathUtils.degToRad(31.7175), AZ = THREE.MathUtils.degToRad(137.508);
  const toSun = new THREE.Vector3(Math.sin(AZ) * Math.cos(EL), Math.sin(EL), -Math.cos(AZ) * Math.cos(EL)).normalize();
  const SEAT = new THREE.Vector3(0, 1.6, throneZ);
  const sun = new THREE.DirectionalLight(0xfff2d8, 3.0);
  sun.position.copy(SEAT).addScaledVector(toSun, 30); sun.target.position.copy(SEAT);
  scene.add(sun, sun.target);
  // where the beam crosses the east wall (x = HALF_W): that is the breach
  const tWall = (HALF_W - SEAT.x) / toSun.x;
  const BREACH = SEAT.clone().addScaledVector(toSun, tWall);
  const throneLight = new THREE.PointLight(0xffc35a, 9, 14, 2);
  throneLight.position.set(0, 5.5, throneZ + 4);
  scene.add(throneLight);

  // ---------- stone ----------
  function stoneTex(seed, base) {
    const c = document.createElement("canvas"); c.width = c.height = 256;
    const g = c.getContext("2d");
    g.fillStyle = base; g.fillRect(0, 0, 256, 256);
    let s = seed;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 1400; i++) {
      const v = Math.floor(r() * 40);
      g.fillStyle = `rgba(${v + 40},${v + 36},${v + 40},${0.08 + r() * 0.12})`;
      g.fillRect(r() * 256, r() * 256, 1 + r() * 4, 1 + r() * 4);
    }
    g.strokeStyle = "rgba(0,0,0,.45)"; g.lineWidth = 2;
    for (let y = 0; y <= 256; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); }
    for (let y = 0; y < 256; y += 64) for (let x = (y / 64) % 2 ? 32 : 0; x <= 256; x += 64) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 64); g.stroke(); }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }
  const floorTex = stoneTex(7, "#3a3640"); floorTex.repeat.set(HALF_W * 2 / 2.2, hallLen / 2.2);
  const wallTex = stoneTex(13, "#2b2730"); wallTex.repeat.set(hallLen / 3, 3);
  const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.82, metalness: 0.05 });
  const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.95 });
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x3a3540, roughness: 0.9 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xd6a740, metalness: 0.85, roughness: 0.32, emissive: 0x1a1000 });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(HALF_W * 2, hallLen), floorMat);
  floor.rotation.x = -Math.PI / 2; floor.position.z = midZ;
  scene.add(floor);
  const H = 9;
  const OUT_C = new THREE.Color(0xf6dcc8);
  const outMat = new THREE.MeshBasicMaterial({ color: OUT_C.clone(), fog: false });
  {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(hallLen, H), wallMat);
    w.position.set(-HALF_W, H / 2, midZ); w.rotation.y = Math.PI / 2;
    scene.add(w);
    // east wall as a shape with a notch broken out of its top edge
    const uc = BREACH.z - midZ, L2 = hallLen / 2, vb = BREACH.y;
    const sh = new THREE.Shape();
    sh.moveTo(-L2, 0); sh.lineTo(L2, 0); sh.lineTo(L2, H);
    const notch = [[2.9, H], [2.3, H - 0.8], [2.0, vb + 0.4], [1.2, vb - 1.1], [0.3, vb - 1.5], [-0.6, vb - 1.25], [-1.5, vb - 0.6], [-2.1, vb + 0.5], [-2.6, H - 0.5], [-3.1, H]];
    for (const [du, v] of notch) sh.lineTo(uc + du, v);   // local u runs along +z here
    sh.lineTo(-L2, H); sh.lineTo(-L2, 0);
    const geo = new THREE.ShapeGeometry(sh);
    const ewTex = wallTex.clone(); ewTex.repeat.set(1 / 3, 3 / H); ewTex.needsUpdate = true;
    const ew = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: ewTex, roughness: 0.95 }));
    ew.position.set(HALF_W, 0, midZ); ew.rotation.y = -Math.PI / 2;
    ew.material.side = THREE.DoubleSide;
    scene.add(ew);
    // pale evening sky outside the breach
    const out = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), outMat);
    out.position.set(HALF_W + 5, vb + 2, BREACH.z); out.rotation.y = -Math.PI / 2;
    scene.add(out);
  }
  const back = new THREE.Mesh(new THREE.PlaneGeometry(HALF_W * 2, H), wallMat);
  back.position.set(0, H / 2, throneZ - 2.5); scene.add(back);
  const front = back.clone(); front.position.z = startZ + 3; front.rotation.y = Math.PI; scene.add(front);

  // columns (instanced)
  const colGeo = new THREE.CylinderGeometry(0.42, 0.5, H, 12);
  const cols = [];
  for (let z = startZ; z > throneZ - 1; z -= SP) for (const sx of [-1, 1]) cols.push([sx * (HALF_W - 0.6), z]);
  const colMesh = new THREE.InstancedMesh(colGeo, stoneMat, cols.length);
  const m4 = new THREE.Matrix4();
  cols.forEach(([x, z], i) => { m4.makeTranslation(x, H / 2, z); colMesh.setMatrixAt(i, m4); });
  scene.add(colMesh);

  // broken ceiling: slabs with a jagged opening over the middle of the hall
  const holeA = midZ + hallLen * 0.18, holeB = midZ - hallLen * 0.18;
  const slabGeo = new THREE.BoxGeometry(1, 0.6, 1);
  const slabs = [];
  let sd = 3;
  const rr = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
  for (let z = startZ + 2.5; z > throneZ - 2.5; z -= 1.5) {
    for (let x = -HALF_W + 0.75; x < HALF_W; x += 1.5) {
      const inHole = (z < holeA && z > holeB && Math.abs(x) < 3.2 + Math.sin(z * 1.7) * 1.2) || (x > 2.2 + Math.abs(z - BREACH.z) * 0.6 && Math.abs(z - BREACH.z) < 3.4);
      if (inHole) continue;
      slabs.push([x, H + (rr() - 0.5) * 0.25, z, (rr() - 0.5) * 0.12]);
    }
  }
  const slabMesh = new THREE.InstancedMesh(slabGeo, stoneMat, slabs.length);
  const q = new THREE.Quaternion(), e3 = new THREE.Euler(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3(1.52, 1, 1.52);
  slabs.forEach(([x, y, z, rot], i) => { e3.set(rot, 0, rot * 0.7); q.setFromEuler(e3); m4.compose(v3.set(x, y, z), q, s3); slabMesh.setMatrixAt(i, m4); });
  scene.add(slabMesh);
  // fallen rubble on the floor under the hole
  const rub = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.35, 0), stoneMat, 14);
  for (let i = 0; i < 14; i++) {
    const side = rr() < 0.5 ? -1 : 1;
    e3.set(rr() * 3, rr() * 3, rr() * 3); q.setFromEuler(e3);
    const k = 0.5 + rr() * 0.9;
    m4.compose(v3.set(side * (4.3 + rr() * 1.1), 0.15 * k, holeB + rr() * (holeA - holeB)), q, s3.set(k, k * 0.7, k));
    rub.setMatrixAt(i, m4);
  }
  scene.add(rub);
  // light shaft through the hole
  const shaftTex = (() => {
    const c = document.createElement("canvas"); c.width = 4; c.height = 128;
    const g = c.getContext("2d"); const gr = g.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, "rgba(255,228,210,.55)"); gr.addColorStop(1, "rgba(255,228,210,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 4, 128);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  // the canon beam: a soft cone from the breach down onto the throne
  const beamLen = BREACH.distanceTo(SEAT) + 1.2;
  const beamGeo = new THREE.CylinderGeometry(1.25, 1.75, beamLen, 24, 1, true);
  beamGeo.translate(0, -beamLen / 2, 0);
  const beamMat = new THREE.MeshBasicMaterial({ map: shaftTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.5, side: THREE.DoubleSide, fog: false, color: 0xfff2d8, toneMapped: false });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.copy(BREACH).addScaledVector(toSun, 0.6);
  beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), toSun);
  scene.add(beam);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(2.6, 32), new THREE.MeshBasicMaterial({ color: 0xfff2d8, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  pool.rotation.x = -Math.PI / 2; pool.position.set(SEAT.x + 0.4, 0.915, SEAT.z + 0.7); pool.scale.set(0.62, 0.8, 1);
  scene.add(pool);
  // dust motes living inside the beam
  const DUST = coarse ? 90 : 160;
  const dPos = new Float32Array(DUST * 3), dPar = new Float32Array(DUST * 3);
  const perpA = new THREE.Vector3().crossVectors(toSun, new THREE.Vector3(0, 1, 0)).normalize();
  const perpB = new THREE.Vector3().crossVectors(toSun, perpA).normalize();
  for (let i = 0; i < DUST; i++) { dPar[i * 3] = Math.random(); dPar[i * 3 + 1] = Math.random() * Math.PI * 2; dPar[i * 3 + 2] = Math.sqrt(Math.random()); }
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute("position", new THREE.BufferAttribute(dPos, 3));
  const dustMat = new THREE.PointsMaterial({ size: 0.05, color: 0xfff2d8, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const dust = new THREE.Points(dGeo, dustMat); dust.frustumCulled = false; scene.add(dust);
  function updDust(t) {
    for (let i = 0; i < DUST; i++) {
      const j = i * 3;
      const u = (dPar[j] + t * 0.004) % 1, a = dPar[j + 1] + t * 0.15, r = dPar[j + 2] * (1.1 + 0.5 * u);
      const k = beamLen * (0.08 + 0.9 * u);
      dPos[j] = BREACH.x - toSun.x * k + (perpA.x * Math.cos(a) + perpB.x * Math.sin(a)) * r;
      dPos[j + 1] = BREACH.y - toSun.y * k + (perpA.y * Math.cos(a) + perpB.y * Math.sin(a)) * r + Math.sin(t * 0.6 + i) * 0.05;
      dPos[j + 2] = BREACH.z - toSun.z * k + (perpA.z * Math.cos(a) + perpB.z * Math.sin(a)) * r;
    }
    dGeo.attributes.position.needsUpdate = true;
  }
  // sky above the hole
  const SKY_C = new THREE.Color(0xf2d6e0);
  const skyMat = new THREE.MeshBasicMaterial({ color: SKY_C.clone(), fog: false });
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(14, hallLen * 0.5), skyMat);
  sky.rotation.x = Math.PI / 2; sky.position.set(0, H + 2.5, midZ); scene.add(sky);

  // ---------- gold veins ----------
  const veinGroup = new THREE.Group(); scene.add(veinGroup);
  function vein(points, brightness, width) {
    const pos = [], idx = [];
    for (let i = 0; i < points.length; i++) {
      const p = points[i], n = points[Math.min(i + 1, points.length - 1)], pr = points[Math.max(i - 1, 0)];
      const dx = n.x - pr.x, dz = n.z - pr.z, L = Math.hypot(dx, dz) || 1;
      const nx = -dz / L * width / 2, nz = dx / L * width / 2;
      pos.push(p.x + nx, 0.012, p.z + nz, p.x - nx, 0.012, p.z - nz);
      if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
    const c = new THREE.Color(0xffc24a).multiplyScalar(0.45 + 2.4 * brightness);
    const mat = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.55 + 0.45 * brightness, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const mesh = new THREE.Mesh(g, mat);
    mesh.userData.base = 0.55 + 0.45 * brightness; mesh.userData.b = brightness;
    mesh.userData.total = idx.length;
    veinGroup.add(mesh);
    return mesh;
  }
  function wiggle(ax, az, bx, bz, segs, amp, seed) {
    let s = seed; const r = () => ((s = (s * 48271) % 2147483647) / 2147483647 - 0.5);
    const out = [];
    for (let i = 0; i <= segs; i++) {
      const t = i / segs, k = Math.sin(t * Math.PI);
      out.push({ x: ax + (bx - ax) * t + r() * amp * k, z: az + (bz - az) * t + r() * amp * k });
    }
    return out;
  }
  // spine runs from the throne out to the entrance so it can ignite outward
  const spinePts = wiggle(0, throneZ + 2.2, 0, startZ + 2, 60, 0.6, 11);
  const spine = [vein(spinePts, 0.8, 0.22), vein(spinePts, 0.25, 0.9)];
  const plinthVeins = [];
  const lit = [];

  // ---------- plinths + statues ----------
  const loader = new THREE.TextureLoader();
  const pickables = [];
  const plinthGeo = new THREE.CylinderGeometry(1.05, 1.2, 0.9, 8);
  const capGeo = new THREE.CylinderGeometry(1.15, 1.15, 0.12, 8);
  const maxTex = renderer.capabilities.maxTextureSize;
  statues.forEach((s, i) => {
    // index 0 = highest rank, nearest the throne
    const row = Math.floor(i / 2), side = i % 2 ? 1 : -1;
    const z = throneZ + 6 + row * SP;
    const x = side * 3.4;
    const b = Math.max(0, Math.min(1, (s.rank - 1) / 23));
    const g = new THREE.Group(); g.position.set(x, 0, z);
    { const pm = new THREE.Mesh(plinthGeo, stoneMat); pm.position.y = 0.45; g.add(pm); }
    const capMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(s.tint), metalness: 0.7, roughness: 0.35, emissive: new THREE.Color(s.tint).multiplyScalar(0.12 + 0.35 * b) });
    { const cm = new THREE.Mesh(capGeo, capMat); cm.position.y = 0.96; g.add(cm); }
    // panel faces the aisle, turned a little toward the entrance
    const holder = new THREE.Group();
    holder.position.y = 1.02;
    holder.rotation.y = -side * (Math.PI / 2 - 0.35);
    g.add(holder);
    const setSize = (aw, ah) => {
      const ar = aw / ah;
      let h = ar < 1 ? 2.9 : 1.75, w = h * ar;
      if (w > 3.1) { w = 3.1; h = w / ar; }
      return [w, h];
    };
    const [w0, h0] = setSize(s.w || 3, s.h || 4);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.08), new THREE.MeshStandardMaterial({ color: new THREE.Color(s.tint).lerp(new THREE.Color(0xd6a740), 0.5), metalness: 0.8, roughness: 0.35 }));
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0x15121a, toneMapped: false }));
    const fit = (w, h) => {
      frame.scale.set(w + 0.16, h + 0.16, 1); frame.position.set(0, h / 2 + 0.08, -0.05);
      pic.scale.set(w, h, 1); pic.position.set(0, h / 2 + 0.08, 0.002);
    };
    fit(w0, h0);
    holder.add(frame, pic);
    pic.userData.index = i; frame.userData.index = i;
    pickables.push(pic, frame);
    loader.load(s.img, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      const im = tex.image;
      if (im && (im.width > maxTex || im.height > maxTex)) tex.generateMipmaps = true;
      pic.material.map = tex; pic.material.color.set(0xffffff); pic.material.needsUpdate = true;
      if (im && im.width) { const [w, h] = setSize(im.width, im.height); fit(w, h); }
      dirty = true;
    });
    // little rank glow light on the floor
    const glow = new THREE.Mesh(new THREE.CircleGeometry(1.6, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(s.tint).multiplyScalar(0.3 + 0.7 * b), transparent: true, opacity: 0.18 + 0.3 * b, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.rotation.x = -Math.PI / 2; glow.position.y = 0.01;
    g.add(glow);
    scene.add(g);
    // vein from the aisle spine to this plinth
    const vp = wiggle(0, z + 1.6, x - side * 1.1, z, 12, 0.5, 97 + i * 13);
    plinthVeins[i] = [vein(vp, b, 0.12 + 0.14 * b), vein(vp, b * 0.35, 0.5 + 0.5 * b)];
    lit[i] = { pic, capMat, glow, glowBase: glow.material.opacity, emBase: capMat.emissive.clone(), holder, frame, setSize, fit };
  });

  // ---------- throne ----------
  const throne = new THREE.Group(); throne.position.set(0, 0, throneZ);
  const step = (w, d, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, d), stoneMat); m.position.set(0, y, 0); throne.add(m); };
  step(6, 4, 0.15); step(4.8, 3.2, 0.45); step(3.6, 2.4, 0.75);
  const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); throne.add(m); return m; };
  add(new THREE.BoxGeometry(1.8, 0.35, 1.3), goldMat, 0, 1.4, 0);              // seat
  add(new THREE.BoxGeometry(1.8, 3.4, 0.25), goldMat, 0, 2.9, -0.55);          // back
  add(new THREE.BoxGeometry(0.22, 0.7, 1.3), goldMat, -0.95, 1.85, 0);         // arms
  add(new THREE.BoxGeometry(0.22, 0.7, 1.3), goldMat, 0.95, 1.85, 0);
  add(new THREE.BoxGeometry(1.4, 0.9, 1.2), stoneMat, 0, 0.95 + 0.05, 0);     // base
  for (let i = -2; i <= 2; i++) add(new THREE.ConeGeometry(0.13, 0.55, 4), goldMat, i * 0.38, 4.85 - Math.abs(i) * 0.12, -0.55);
  const cushion = add(new THREE.BoxGeometry(1.5, 0.12, 1.05), new THREE.MeshStandardMaterial({ color: 0x5a0f1c, roughness: 0.8 }), 0, 1.63, 0.05);
  cushion.castShadow = false;
  scene.add(throne);

  // ---------- petals ----------
  const petalTex = (() => {
    const c = document.createElement("canvas"); c.width = c.height = 32;
    const g = c.getContext("2d");
    g.translate(16, 16); g.rotate(0.6);
    const gr = g.createRadialGradient(0, 0, 1, 0, 0, 14);
    gr.addColorStop(0, "rgba(255,236,242,1)"); gr.addColorStop(1, "rgba(246,170,196,0)");
    g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, 13, 7, 0, 0, Math.PI * 2); g.fill();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const PMAX = coarse ? 120 : 220;
  let pCount = soft ? 60 : PMAX;
  const pPos = new Float32Array(PMAX * 3), pVel = new Float32Array(PMAX * 3);
  const spawn = (i, anyY) => {
    if (i % 2) {   // half the petals blow in through the breach and ride the beam down
      const k = anyY ? Math.random() * beamLen * 0.9 : Math.random() * 1.5, a = Math.random() * 6.283, r = Math.random() * 1.1;
      pPos[i * 3] = BREACH.x - toSun.x * k + (perpA.x * Math.cos(a) + perpB.x * Math.sin(a)) * r - 0.3;
      pPos[i * 3 + 1] = BREACH.y - toSun.y * k + (perpA.y * Math.cos(a) + perpB.y * Math.sin(a)) * r;
      pPos[i * 3 + 2] = BREACH.z - toSun.z * k + (perpA.z * Math.cos(a) + perpB.z * Math.sin(a)) * r;
      const sp = 0.45 + Math.random() * 0.3;
      pVel[i * 3] = -toSun.x * sp; pVel[i * 3 + 1] = -toSun.y * sp - 0.08; pVel[i * 3 + 2] = -toSun.z * sp;
      return;
    }
    pPos[i * 3] = (Math.random() - 0.5) * 6;
    pPos[i * 3 + 1] = anyY ? Math.random() * H : H + Math.random() * 1.5;
    pPos[i * 3 + 2] = holeB + Math.random() * (holeA - holeB);
    pVel[i * 3] = (Math.random() - 0.5) * 0.25; pVel[i * 3 + 1] = -(0.35 + Math.random() * 0.35); pVel[i * 3 + 2] = (Math.random() - 0.5) * 0.25;
  };
  for (let i = 0; i < PMAX; i++) spawn(i, true);
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  const petals = new THREE.Points(pGeo, new THREE.PointsMaterial({ map: petalTex, size: 0.16, transparent: true, depthWrite: false, opacity: 0.85, color: 0xffb3c8 }));
  petals.frustumCulled = false;
  scene.add(petals);

  // ---------- controls ----------
  const pos = new THREE.Vector3(0, 1.65, startZ);
  let yaw = 0, pitch = -0.04;
  const keys = new Set();
  let target = null;           // tap-to-walk / walk-to-throne goal
  const stick = { x: 0, y: 0 };
  const LIMIT_X = HALF_W - 1.3, MIN_Z = throneZ + 4.6, MAX_Z = startZ + 1.5;

  addEventListener("keydown", (e) => {
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (!document.getElementById("card").hidden) return;
    const k = e.key.toLowerCase();
    if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "q", "e"].includes(k) && inView) { keys.add(k); target = null; if (k.startsWith("arrow")) e.preventDefault(); }
  });
  addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
  addEventListener("blur", () => keys.clear());

  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let drag = null;
  canvas.addEventListener("pointerdown", (e) => {
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.x = e.clientX; drag.y = e.clientY;
    if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 6) drag.moved = true;
    if (drag.moved) {
      const k = coarse ? 0.006 : 0.004;
      yaw -= dx * k; pitch = Math.max(-0.7, Math.min(0.75, pitch - dy * k));
      dirty = true;
    }
  });
  const endDrag = (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    const tap = !drag.moved; drag = null;
    if (swallowTap) { swallowTap = false; return; }
    if (tap && e.type === "pointerup" && !reveal) pick(e.clientX, e.clientY);
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  function pick(cx, cy) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(pickables, false)[0];
    if (hit) { window.ThroneCard.open(hit.object.userData.index, canvas); return; }
    const fh = ray.intersectObject(floor, false)[0];
    if (fh) target = new THREE.Vector3(fh.point.x, 0, fh.point.z);
  }
  // hover cursor (desktop)
  if (!coarse) canvas.addEventListener("pointermove", (e) => {
    if (drag) return;
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    canvas.style.cursor = ray.intersectObjects(pickables, false).length ? "pointer" : "grab";
  });

  // touch joystick
  const stickEl = document.getElementById("stick");
  const knob = stickEl.firstElementChild;
  if (coarse) stickEl.classList.add("on");
  let sp = null;
  stickEl.addEventListener("pointerdown", (e) => { sp = e.pointerId; stickEl.setPointerCapture(e.pointerId); moveStick(e); target = null; });
  stickEl.addEventListener("pointermove", (e) => { if (sp === e.pointerId) moveStick(e); });
  const stopStick = (e) => { if (sp !== e.pointerId) return; sp = null; stick.x = stick.y = 0; knob.style.transform = ""; };
  stickEl.addEventListener("pointerup", stopStick); stickEl.addEventListener("pointercancel", stopStick);
  function moveStick(e) {
    const r = stickEl.getBoundingClientRect();
    let x = (e.clientX - (r.left + r.width / 2)) / (r.width / 2), y = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    const L = Math.hypot(x, y); if (L > 1) { x /= L; y /= L; }
    stick.x = x; stick.y = y;
    knob.style.transform = `translate(${x * 30}px, ${y * 30}px)`;
  }

  document.getElementById("to-throne").addEventListener("click", () => { target = new THREE.Vector3(0, 0, MIN_Z + 0.2); });


  // ---------- crown + glint (for Claim the throne) ----------
  const crown = new THREE.Group();
  {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.3, 0.16, 20, 1, true), goldMat);
    ring.material = goldMat.clone(); ring.material.side = THREE.DoubleSide; ring.material.emissive = new THREE.Color(0x4a3000);
    crown.add(ring);
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2;
      const sp = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.24, 4), ring.material);
      sp.position.set(Math.cos(a) * 0.32, 0.18, Math.sin(a) * 0.32); crown.add(sp);
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.035), new THREE.MeshBasicMaterial({ color: k % 2 ? 0xe23b4a : 0x8fd4f2, toneMapped: false }));
      gem.position.set(Math.cos(a) * 0.335, 0.02, Math.sin(a) * 0.335); crown.add(gem);
    }
  }
  crown.visible = false; scene.add(crown);
  const glintTex = (() => {
    const c = document.createElement("canvas"); c.width = c.height = 128;
    const g = c.getContext("2d"); g.translate(64, 64);
    const rg = g.createRadialGradient(0, 0, 0, 0, 0, 22); rg.addColorStop(0, "rgba(255,250,235,1)"); rg.addColorStop(1, "rgba(255,220,150,0)");
    g.fillStyle = rg; g.beginPath(); g.arc(0, 0, 22, 0, 7); g.fill();
    g.fillStyle = "rgba(255,246,220,.95)";
    for (let k = 0; k < 4; k++) { g.rotate(Math.PI / 2); g.beginPath(); g.moveTo(-3, 0); g.lineTo(0, -62); g.lineTo(3, 0); g.fill(); }
    g.rotate(Math.PI / 4); g.globalAlpha = 0.5;
    for (let k = 0; k < 4; k++) { g.rotate(Math.PI / 2); g.beginPath(); g.moveTo(-2, 0); g.lineTo(0, -34); g.lineTo(2, 0); g.fill(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const glint = new THREE.Sprite(new THREE.SpriteMaterial({ map: glintTex, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0 }));
  glint.renderOrder = 10; scene.add(glint);

  // ---------- cinematic reveal ----------
  const REVEAL_KEY = "throne-reveal-seen-v1";
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const forceReveal = /[?&]reveal=1\b/.test(location.search);
  let seen = false; try { seen = localStorage.getItem(REVEAL_KEY) === "1"; } catch (e) {}
  const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
  const span = (T, a, b) => ease((T - a) / (b - a));
  const STEP = Math.min(0.55, 4.4 / Math.max(1, N));
  const REVEAL_END = 4.0 + N * STEP + 1.8;
  let reveal = null;        // { t0 }
  let swallowTap = false;
  function setScene(T) {    // T = seconds into the reveal; Infinity = fully lit
    const fb = span(T, 0.6, 3.0);
    sun.intensity = 3.0 * fb;
    beamMat.opacity = 0.5 * fb; dustMat.opacity = 0.9 * fb; pool.material.opacity = 0.22 * fb;
    throneLight.intensity = 9 * span(T, 2.0, 3.6);
    const fa = span(T, 3.4, REVEAL_END - 0.6);
    hemi.intensity = 0.03 + 0.72 * fa;
    skyMat.color.copy(SKY_C).multiplyScalar(0.02 + 0.98 * fa);
    outMat.color.copy(OUT_C).multiplyScalar(0.05 + 0.95 * fb);
    goldMat.emissiveIntensity = fa; goldMat.envMapIntensity = 1;
    const fs = span(T, 3.0, 4.4);
    for (const m of spine) m.geometry.setDrawRange(0, Math.floor((m.userData.total * fs) / 6) * 6);
    for (let i = 0; i < N; i++) {
      const a = 4.0 + i * STEP;
      const fv = span(T, a, a + 0.7), fl = span(T, a + 0.45, a + 1.15);
      for (const m of plinthVeins[i] || []) m.geometry.setDrawRange(0, Math.floor((m.userData.total * fv) / 6) * 6);
      const L = lit[i]; if (!L) continue;
      L.pic.material.color.setScalar(0.03 + 0.97 * fl);
      L.capMat.emissive.copy(L.emBase).multiplyScalar(fl);
      L.glow.material.opacity = L.glowBase * fl;
    }
  }
  const hud = document.getElementById("hud"), hint = document.getElementById("hud-hint");
  const hintText = () => (coarse ? "Drag to look · joystick or tap the floor to walk · tap a statue" : "Drag to look · WASD or arrows to walk · click a statue");
  hint.textContent = hintText();
  function startReveal() {
    reveal = { t0: performance.now() };
    pos.set(0, 1.65, startZ + 1); yaw = 0; pitch = 0.1; target = null;
    hud.classList.add("is-reveal"); hint.textContent = "Tap or press any key to skip";
    setScene(0);
    addEventListener("pointerdown", skipReveal, true); addEventListener("keydown", skipReveal, true);
    document.documentElement.dataset.reveal = "on";
  }
  function skipReveal(e) {
    if (!reveal) return;
    if (e && e.type === "pointerdown") swallowTap = true;
    if (e && e.type === "keydown") e.preventDefault();
    endReveal();
  }
  function endReveal() {
    reveal = null; setScene(Infinity);
    for (const m of veinGroup.children) m.geometry.setDrawRange(0, Infinity);
    hud.classList.remove("is-reveal"); hint.textContent = hintText();
    removeEventListener("pointerdown", skipReveal, true); removeEventListener("keydown", skipReveal, true);
    try { localStorage.setItem(REVEAL_KEY, "1"); } catch (e) {}
    document.documentElement.dataset.reveal = "done";
    if (pos.z > startZ - 2.9) pos.z = startZ - 3;
    dirty = true;
  }
  function stepReveal(now) {
    const T = (now - reveal.t0) / 1000;
    setScene(T);
    const k = ease(T / REVEAL_END);
    pos.z = startZ + 1 - 4 * k; pitch = 0.1 - 0.12 * k;
    if (T >= REVEAL_END) endReveal();
  }
  document.getElementById("replay").addEventListener("click", (e) => { e.stopPropagation(); if (claim.state !== "none") return; startReveal(); });

  // ---------- claim the throne ----------
  const claimBtn = document.getElementById("claim");
  const fromLocker = !!window.THRONE_FROM_LOCKER;
  const claim = { state: "none", t0: 0, from: null, fromQ: null, parent: null, to: new THREE.Vector3(), toQ: new THREE.Quaternion(), h: 2 };
  if (!fromLocker) { claimBtn.textContent = "Save a character to claim the throne"; }
  claimBtn.addEventListener("click", () => {
    if (!fromLocker) { location.href = "../locker/"; return; }
    if (reveal) endReveal();
    const L = lit[0]; if (!L || claim.state === "moving" || claim.state === "returning") return;
    if (claim.state === "none") {
      claim.parent = L.holder.parent;
      claim.home = L.holder.matrixWorld.clone();
      scene.attach(L.holder);
      claim.from = L.holder.position.clone(); claim.fromQ = L.holder.quaternion.clone();
      claim.h = L.pic.scale.y;
      claim.to.set(SEAT.x, 1.72, throneZ + 0.62); claim.toQ.identity();
      claim.state = "moving"; claim.t0 = performance.now();
      target = new THREE.Vector3(0, 0, MIN_Z + 4.2); claim.lookUp = true;
      claimBtn.textContent = "Return to plinth"; claimBtn.setAttribute("aria-pressed", "true");
      hint.textContent = statues[0].name + " takes the throne";
    } else {
      claim.from = L.holder.position.clone(); claim.fromQ = L.holder.quaternion.clone();
      const p = new THREE.Vector3(), q2 = new THREE.Quaternion(), sc = new THREE.Vector3();
      claim.home.decompose(p, q2, sc); claim.to.copy(p); claim.toQ.copy(q2);
      claim.state = "returning"; claim.t0 = performance.now();
      crown.visible = false; glint.material.opacity = 0;
      claimBtn.textContent = "Claim the throne"; claimBtn.setAttribute("aria-pressed", "false");
      hint.textContent = hintText();
    }
  });
  function stepClaim(now) {
    const L = lit[0]; if (!L || claim.state === "none") return;
    const T = (now - claim.t0) / 1000;
    if (claim.state === "moving" || claim.state === "returning") {
      const k = ease(T / 2.6);
      L.holder.position.lerpVectors(claim.from, claim.to, k);
      L.holder.position.y += Math.sin(Math.PI * k) * 1.6;
      L.holder.quaternion.slerpQuaternions(claim.fromQ, claim.toQ, k);
      if (k >= 1) {
        if (claim.state === "returning") { claim.parent.attach(L.holder); claim.state = "none"; return; }
        claim.state = "seated"; claim.t0 = now;
      }
      return;
    }
    // seated: crown descends, then a glint, then a slow twinkle
    if (claim.lookUp && !drag) { pitch += (0.1 - pitch) * 0.06; let d = -yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); yaw += d * 0.06; if (T > 3) claim.lookUp = false; }
    const top = claim.to.y + claim.h + 0.16 + 0.14;
    const kc = ease(T / 1.1);
    crown.visible = true;
    crown.position.set(claim.to.x, top + (1 - kc) * 1.4, claim.to.z + 0.08);
    crown.rotation.y = T * 0.6;
    const g1 = T < 1.1 ? 0 : T < 1.5 ? (T - 1.1) / 0.4 : Math.max(0, 1 - (T - 1.5) / 0.9);
    const tw = T > 2.4 ? Math.pow(Math.max(0, Math.sin((T - 2.4) * 1.9)), 24) : 0;
    const gl2 = Math.max(g1, tw * 0.7);
    glint.material.opacity = gl2; glint.material.rotation = T * 0.8;
    glint.scale.setScalar(0.4 + 1.9 * gl2);
    glint.position.set(crown.position.x + 0.22, top + 0.22, crown.position.z + 0.3);
    // the veins answer the crown
    veinBoost = T < 2.2 ? Math.sin(Math.min(1, T / 2.2) * Math.PI) : 0;
  }
  let veinBoost = 0;
  if (!fromLocker) claimBtn.classList.add("is-empty");

  // ---------- loop ----------
  let running = true, dirty = true, inView = true, cardOpen = false;
  let last = performance.now(), acc = 0, frames = 0, lowStreak = 0, highStreak = 0;
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.fov = w < 600 ? 72 : 62; camera.updateProjectionMatrix();
    dirty = true;
  }
  new ResizeObserver(resize).observe(stage);
  resize();
  document.addEventListener("visibilitychange", () => { running = !document.hidden; if (running) { last = performance.now(); requestAnimationFrame(tick); } });
  new IntersectionObserver((en) => { inView = en[0].isIntersecting; if (inView && running) { last = performance.now(); requestAnimationFrame(tick); } }).observe(stage);
  document.addEventListener("throne:card", (e) => { cardOpen = !!e.detail; if (!cardOpen) { last = performance.now(); requestAnimationFrame(tick); } });

  const fwd = new THREE.Vector3(), right = new THREE.Vector3(), mv = new THREE.Vector3();
  let t = 0;
  function tick(now) {
    if (!running || !inView || cardOpen) return;
    // Walking or looking runs at full rate; standing still drops to ~30 fps (petals only). Software GL stays at ~20.
    const busy = keys.size || drag || target || stick.x || stick.y || reveal || (claim.state !== "none" && claim.state !== "seated") || claim.state === "seated";
    const minGap = soft ? 48 : busy ? 0 : 31;
    if (now - last < minGap) { requestAnimationFrame(tick); return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    // movement
    fwd.set(-Math.sin(yaw), 0, -Math.cos(yaw)); right.set(-fwd.z, 0, fwd.x);
    mv.set(0, 0, 0);
    if (keys.has("w") || keys.has("arrowup")) mv.add(fwd);
    if (keys.has("s") || keys.has("arrowdown")) mv.sub(fwd);
    if (keys.has("d")) mv.add(right);
    if (keys.has("a")) mv.sub(right);
    if (keys.has("arrowleft") || keys.has("q")) yaw += 1.8 * dt;
    if (keys.has("arrowright") || keys.has("e")) yaw -= 1.8 * dt;
    if (stick.x || stick.y) { mv.addScaledVector(fwd, -stick.y); mv.addScaledVector(right, stick.x); }
    if (target) {
      const dx = target.x - pos.x, dz = target.z - pos.z, L = Math.hypot(dx, dz);
      if (L < 0.25) target = null;
      else {
        mv.set(dx / L, 0, dz / L).multiplyScalar(Math.min(1, L));
        const want = Math.atan2(-dx, -dz); let d = want - yaw;
        d = Math.atan2(Math.sin(d), Math.cos(d)); yaw += d * Math.min(1, dt * 3);
      }
    }
    if (mv.lengthSq()) {
      if (mv.lengthSq() > 1) mv.normalize();
      pos.addScaledVector(mv, 3.6 * dt);
      pos.x = Math.max(-LIMIT_X, Math.min(LIMIT_X, pos.x));
      pos.z = Math.max(MIN_Z, Math.min(MAX_Z, pos.z));
    }
    camera.position.set(pos.x, pos.y + Math.sin(t * 6) * 0.015 * Math.min(1, mv.length()), pos.z);
    camera.rotation.set(pitch, yaw, 0, "YXZ");
    // petals
    for (let i = 0; i < pCount; i++) {
      const j = i * 3;
      pPos[j] += (pVel[j] + Math.sin(t * 0.9 + i) * 0.18) * dt;
      pPos[j + 1] += pVel[j + 1] * dt;
      pPos[j + 2] += (pVel[j + 2] + Math.cos(t * 0.7 + i * 1.3) * 0.12) * dt;
      if (pPos[j + 1] < 0.02) spawn(i, false);
    }
    pGeo.setDrawRange(0, pCount);
    pGeo.attributes.position.needsUpdate = true;
    if (reveal) stepReveal(now);
    stepClaim(now);
    updDust(t);
    // veins breathe, gently (and flare when a crown lands)
    const br = 0.85 + 0.15 * Math.sin(t * 1.3);
    for (const v of veinGroup.children) v.material.opacity = Math.min(1, v.userData.base * (0.8 + 0.2 * br * (0.5 + v.userData.b)) * (1 + 1.2 * veinBoost));
    renderer.render(scene, camera);
    if (loading && !loading.hidden) loading.hidden = true;
    // adaptive quality: watch ~1s windows of frame time
    acc += dt; frames++;
    if (acc > 1) {
      const ms = (acc / frames) * 1000; acc = 0; frames = 0;
      if (ms > (busy ? 24 : 40)) { lowStreak++; highStreak = 0; } else if (ms < 14) { highStreak++; lowStreak = 0; } else { lowStreak = highStreak = 0; }
      if (lowStreak >= 2) {
        lowStreak = 0;
        if (dpr > 0.75) { dpr = Math.max(0.75, dpr - 0.25); renderer.setPixelRatio(dpr); resize(); }
        else if (pCount > 40) pCount = Math.floor(pCount / 2);
      } else if (highStreak >= 4 && dpr < DPR_MAX) {
        highStreak = 0; dpr = Math.min(DPR_MAX, dpr + 0.25); renderer.setPixelRatio(dpr); resize();
      }
      stage.dataset.q = dpr.toFixed(2) + "/" + pCount;
    }
    requestAnimationFrame(tick);
  }
  if ((!seen || forceReveal) && !reduceMotion) startReveal();
  requestAnimationFrame(tick);
  window.__throne = { skip: () => reveal && endReveal(), state: () => ({ reveal: !!reveal, claim: claim.state }), face: (i) => { const o = pickables[i * 2]; const v = new THREE.Vector3(); o.getWorldPosition(v); pos.x = v.x * 0.15; pos.z = v.z + 3.5; yaw = Math.atan2(-(v.x - pos.x), -(v.z - pos.z)); pitch = 0; }, project: (i) => { const o = pickables[i * 2]; const v = new THREE.Vector3(); o.getWorldPosition(v); v.project(camera); const r = canvas.getBoundingClientRect(); return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height, z: v.z }; }, renderer, scene, camera, pos, set: (x, z, y, p) => { pos.x = x; pos.z = z; if (y != null) yaw = y; if (p != null) pitch = p; } };
}
