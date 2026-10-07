/* HEAVY IS THE CROWN — baked hologram player.
   Pre-rendered frames (4 angles x 2 tilts), pointer-scrubbed with bilinear
   blending. Pixel-perfect on every GPU: no shaders run on the device. */
(function () {
  "use strict";
  var canvas = document.getElementById("holoCanvas");
  if (!canvas) return;
  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var COLS = 4, ROWS = 2, N = COLS * ROWS;
  var frames = [], loaded = 0;
  for (var i = 0; i < N; i++) {
    (function (idx) {
      var img = new Image();
      img.onload = function () { loaded++; };
      img.src = (window.HOLO_FRAMES || [])[idx] || "";
      frames[idx] = img;
    })(i);
  }

  function fit() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round((canvas.clientWidth || 300) * dpr);
    canvas.height = Math.round((canvas.clientHeight || 500) * dpr);
  }
  window.addEventListener("resize", fit);
  fit();

  var tx = 1.5, ty = 0.5, cx = 1.5, cy = 0.5, lastTouch = 0;
  var spinAngle = 0;
  function point(nx, ny) {
    tx = nx * (COLS - 1); ty = ny * (ROWS - 1);
    lastTouch = performance.now();
  }
  canvas.addEventListener("pointermove", function (e) {
    var r = canvas.getBoundingClientRect();
    point((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  });
  canvas.addEventListener("pointerleave", function () { lastTouch = performance.now(); });
  canvas.addEventListener("touchmove", function (e) {
    var t = e.touches[0], r = canvas.getBoundingClientRect();
    point((t.clientX - r.left) / r.width, (t.clientY - r.top) / r.height);
  }, { passive: true });

  function blit(img, alpha) {
    if (!img.complete || !img.naturalWidth || alpha <= 0.01) return;
    var cw = canvas.width, ch = canvas.height;
    var s = Math.min(cw / img.naturalWidth, ch / img.naturalHeight) * 0.94;
    var dw = img.naturalWidth * s, dh = img.naturalHeight * s;
    // 360° spin: horizontal squash around center (card-turn fake)
    var sx = Math.cos(spinAngle);
    ctx.save();
    ctx.translate(cw / 2, 0);
    ctx.scale(sx || 0.001, 1);
    ctx.translate(-cw / 2, 0);
    ctx.globalAlpha = alpha * (0.35 + 0.65 * Math.abs(sx));
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    ctx.restore();
  }

  function draw() {
    var now = performance.now();
    if (!reduceMotion && now - lastTouch > 2500) {
      // he spins 360° around the vertical axis, centered; ~8s per revolution
      spinAngle += 0.013;
      if (spinAngle > Math.PI * 2) spinAngle -= Math.PI * 2;
      // parallax: tilt frames follow the turn
      tx = 1.5 + 1.5 * Math.sin(spinAngle);
      ty = 0.5 + 0.2 * Math.sin(now * 0.0004);
    } else if (reduceMotion) { tx = 1.5; ty = 0.5; }
    else {
      // user is steering: ease back to facing forward (nearest full turn)
      var target = Math.round(spinAngle / (Math.PI * 2)) * Math.PI * 2;
      spinAngle += (target - spinAngle) * 0.08;
    }
    cx += (tx - cx) * 0.12; cy += (ty - cy) * 0.12;
    var x0 = Math.max(0, Math.min(COLS - 2, Math.floor(cx)));
    var y0 = Math.max(0, Math.min(ROWS - 2, Math.floor(cy)));
    var fx = cx - x0, fy = cy - y0;
    var x1 = x0 + 1, y1 = y0 + 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    blit(frames[y0 * COLS + x0], (1 - fx) * (1 - fy));
    blit(frames[y0 * COLS + x1], fx * (1 - fy));
    blit(frames[y1 * COLS + x0], (1 - fx) * fy);
    blit(frames[y1 * COLS + x1], fx * fy);
    ctx.globalAlpha = 1;
  }

  // gentle life: subtle CSS flicker on the wrap
  try {
    var wrap = canvas.parentElement;
    if (wrap && wrap.classList.contains("holo-wrap") && !reduceMotion)
      wrap.classList.add("holo-alive");
  } catch (e) {}

  if (reduceMotion) {
    var iv = setInterval(function () {
      if (loaded >= N) { draw(); clearInterval(iv); }
    }, 200);
  } else {
    (function loop() { if (loaded >= N) draw(); requestAnimationFrame(loop); })();
  }
})();
