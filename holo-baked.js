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
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  }

  function draw() {
    var now = performance.now();
    if (!reduceMotion && now - lastTouch > 2500) {
      // constant slow rotation: full sweep every ~14s, ping-pong
      tx = 1.5 + 1.5 * Math.sin(now * 0.00045);
      ty = 0.5 + 0.35 * Math.sin(now * 0.00031 + 1.2);
    } else if (reduceMotion) { tx = 1.5; ty = 0.5; }
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
    drawPlatform(now);
  }

  // 360° spinning hologram platform beneath the figure
  var platAngle = 0;
  function drawPlatform(now) {
    if (reduceMotion) return;
    var cw = canvas.width, ch = canvas.height;
    // platform sits in the bottom ~22% of the drawn frame
    var s = Math.min(cw / 500, ch / 667) * 0.94;
    var dw = 500 * s, dh = 667 * s;
    var ox = (cw - dw) / 2, oy = (ch - dh) / 2;
    var pcx = ox + dw * 0.5, pcy = oy + dh * 0.86;
    var rx = dw * 0.34, ry = rx * 0.30;
    var thick = ry * 0.55; // platform side-wall height
    platAngle += 0.016; // ~6.5s per revolution
    if (platAngle > Math.PI * 2) platAngle -= Math.PI * 2;
    ctx.save();
    // soften (not black out) the baked-in platform
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = "#07070c";
    ctx.beginPath();
    ctx.ellipse(pcx, pcy, rx * 1.12, ry * 1.5 + thick, 0, 0, Math.PI * 2);
    ctx.fill();
    // side wall: gives the disc real thickness
    ctx.globalAlpha = 0.85;
    var grad = ctx.createLinearGradient(0, pcy, 0, pcy + ry + thick);
    grad.addColorStop(0, "rgba(60,110,100,0.0)");
    grad.addColorStop(1, "rgba(40,90,80,0.55)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(pcx, pcy + thick, rx, ry, 0, 0, Math.PI);
    ctx.lineTo(pcx - rx, pcy);
    ctx.ellipse(pcx, pcy, rx, ry, 0, Math.PI, 0, true);
    ctx.closePath();
    ctx.fill();
    // rotating spokes with depth cue (front brighter)
    ctx.lineWidth = Math.max(1, s * 1.2);
    for (var i = 0; i < 16; i++) {
      var a = platAngle + (i / 16) * Math.PI * 2;
      var depth = (Math.sin(a) + 1) / 2; // 0 back, 1 front
      ctx.globalAlpha = 0.25 + 0.45 * depth;
      ctx.strokeStyle = "#7fd4c1";
      ctx.beginPath();
      ctx.moveTo(pcx + Math.cos(a) * rx * 0.18, pcy + Math.sin(a) * ry * 0.18);
      ctx.lineTo(pcx + Math.cos(a) * rx, pcy + Math.sin(a) * ry);
      ctx.stroke();
    }
    // static rings
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = "#7fd4c1";
    [1, 0.66, 0.33].forEach(function (k) {
      ctx.beginPath();
      ctx.ellipse(pcx, pcy, rx * k, ry * k, 0, 0, Math.PI * 2);
      ctx.stroke();
    });
    // bright front rim
    ctx.globalAlpha = 0.9;
    ctx.lineWidth = Math.max(1.5, s * 2);
    ctx.strokeStyle = "#b8f5e6";
    ctx.beginPath();
    ctx.ellipse(pcx, pcy, rx, ry, 0, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    ctx.restore();
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
