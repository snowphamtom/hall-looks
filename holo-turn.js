/* HEAVY IS THE CROWN — turntable hologram player.
   8 true 3D rotation frames, crossfaded for smooth 360° spin.
   Pointer drag scrubs the angle; release resumes auto-rotation. */
(function () {
  "use strict";
  var canvas = document.getElementById("holoCanvas");
  if (!canvas) return;
  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var N = 8, frames = [], loaded = 0;
  for (var i = 0; i < N; i++) {
    (function (idx) {
      var img = new Image();
      img.onload = function () { loaded++; };
      img.src = (window.HOLO_TURN || [])[idx] || "";
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

  var angle = 0, lastTouch = 0; // angle in frame units, 0..N
  function point(nx) {
    angle = nx * N;
    lastTouch = performance.now();
  }
  canvas.addEventListener("pointermove", function (e) {
    var r = canvas.getBoundingClientRect();
    point((e.clientX - r.left) / r.width);
  });
  canvas.addEventListener("touchmove", function (e) {
    var r = canvas.getBoundingClientRect();
    point((e.touches[0].clientX - r.left) / r.width);
  }, { passive: true });

  function blit(img, alpha) {
    if (!img.complete || !img.naturalWidth || alpha <= 0.01) return;
    var cw = canvas.width, ch = canvas.height;
    var s = Math.min(cw / img.naturalWidth, ch / img.naturalHeight) * 0.96;
    var dw = img.naturalWidth * s, dh = img.naturalHeight * s;
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  }

  function draw() {
    var now = performance.now();
    if (!reduceMotion && now - lastTouch > 2500) {
      angle += 0.022; // ~7s per revolution
      if (angle >= N) angle -= N;
    } else if (reduceMotion) {
      angle = 0;
    }
    var i0 = Math.floor(angle) % N;
    var i1 = (i0 + 1) % N;
    var f = angle - Math.floor(angle);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    blit(frames[i0], 1 - f);
    blit(frames[i1], f);
    ctx.globalAlpha = 1;
  }

  if (reduceMotion) {
    var iv = setInterval(function () {
      if (loaded >= N) { draw(); clearInterval(iv); }
    }, 200);
  } else {
    (function loop() { if (loaded >= N) draw(); requestAnimationFrame(loop); })();
  }
})();
