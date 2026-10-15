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
  scene.add(new THREE.HemisphereLight(0xb0a4cc, 0x2a1d10, 1.15));
  const sun = new THREE.DirectionalLight(0xffe2c4, 2.2);
  sun.position.set(1.5, 14, midZ + 2); sun.target.position.set(0, 0, midZ);
  scene.add(sun, sun.target);
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
  for (const sx of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(hallLen, H), wallMat);
    w.position.set(sx * HALF_W, H / 2, midZ); w.rotation.y = -sx * Math.PI / 2;
    scene.add(w);
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
      const inHole = z < holeA && z > holeB && Math.abs(x) < 3.2 + Math.sin(z * 1.7) * 1.2;
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
  const shaftMat = new THREE.MeshBasicMaterial({ map: shaftTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.32, side: THREE.DoubleSide, fog: false });
  for (let i = 0; i < 3; i++) {
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(5.5, H), shaftMat);
    sh.position.set(0, H / 2, midZ); sh.rotation.y = (i * Math.PI) / 3;
    scene.add(sh);
  }
  // sky above the hole
  const skyMat = new THREE.MeshBasicMaterial({ color: 0xf2d6e0, fog: false });
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
    veinGroup.add(mesh);
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
  vein(wiggle(0, startZ + 2, 0, throneZ + 2.2, 60, 0.6, 11), 0.8, 0.22);
  vein(wiggle(0, startZ + 2, 0, throneZ + 2.2, 60, 0.6, 11), 0.25, 0.9);

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
    vein(vp, b, 0.12 + 0.14 * b);
    vein(vp, b * 0.35, 0.5 + 0.5 * b);
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
    if (tap && e.type === "pointerup") pick(e.clientX, e.clientY);
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
  document.getElementById("hud-hint").textContent = coarse
    ? "Drag to look · joystick or tap the floor to walk · tap a statue"
    : "Drag to look · WASD or arrows to walk · click a statue";

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
    const busy = keys.size || drag || target || stick.x || stick.y;
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
    // veins breathe, gently
    const br = 0.85 + 0.15 * Math.sin(t * 1.3);
    for (const v of veinGroup.children) v.material.opacity = v.userData.base * (0.8 + 0.2 * br * (0.5 + v.userData.b));
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
  requestAnimationFrame(tick);
  window.__throne = { face: (i) => { const o = pickables[i * 2]; const v = new THREE.Vector3(); o.getWorldPosition(v); pos.x = v.x * 0.15; pos.z = v.z + 3.5; yaw = Math.atan2(-(v.x - pos.x), -(v.z - pos.z)); pitch = 0; }, project: (i) => { const o = pickables[i * 2]; const v = new THREE.Vector3(); o.getWorldPosition(v); v.project(camera); const r = canvas.getBoundingClientRect(); return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height, z: v.z }; }, renderer, scene, camera, pos, set: (x, z, y, p) => { pos.x = x; pos.z = z; if (y != null) yaw = y; if (p != null) pitch = p; } };
}
