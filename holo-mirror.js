/* HEAVY IS THE CROWN — mirror-crossfade hologram player.
   Original + mirrored figure, perfectly center-aligned.
   Sliding opacity between them mimics a 90° left-right turn. */
(function () {
  "use strict";
  var canvas = document.getElementById("holoCanvas");
  if (!canvas) return;
  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var M = window.HOLO_MIRROR || {};
  var imgA = new Image(), imgB = new Image(), loaded = 0;
  imgA.onload = imgB.onload = function () { loaded++; };
  imgA.src = M.orig || "";
  imgB.src = M.mir || "";

  function fit() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round((canvas.clientWidth || 300) * dpr);
    canvas.height = Math.round((canvas.clientHeight || 500) * dpr);
  }
  window.addEventListener("resize", fit);
  fit();

  // pointer nudges the turn; otherwise it sways on its own
  var manual = 0, lastTouch = 0;
  function point(nx) {
    manual = nx * 2 - 1; // -1..1
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

  function layer(img, alpha, dx) {
    if (!img.complete || !img.naturalWidth || alpha <= 0.01) return;
    var cw = canvas.width, ch = canvas.height;
    var s = Math.min(cw / img.naturalWidth, ch / img.naturalHeight) * 0.96;
    var dw = img.naturalWidth * s, dh = img.naturalHeight * s;
    // subtle turn squash synced to the crossfade
    var squash = 1 - 0.12 * (1 - Math.abs(alpha * 2 - 1));
    ctx.save();
    ctx.translate(cw / 2 + dx, 0);
    ctx.scale(squash, 1);
    ctx.translate(-cw / 2, 0);
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    ctx.restore();
  }

  function draw() {
    var now = performance.now();
    var phase;
    if (reduceMotion) {
      phase = 0;
    } else if (now - lastTouch < 2500) {
      phase = manual; // user steering
    } else {
      phase = Math.sin(now * 0.00055); // ~11s back-and-forth
    }
    // sliding opacity: A fades as B rises — mimics the turn
    var aA = (1 - phase) / 2, aB = (1 + phase) / 2;
    var shift = phase * canvas.width * 0.02; // parallax nudge
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    layer(imgA, aA, -shift);
    layer(imgB, aB, shift);
    ctx.globalAlpha = 1;
  }

  if (reduceMotion) {
    var iv = setInterval(function () {
      if (loaded >= 2) { draw(); clearInterval(iv); }
    }, 200);
  } else {
    (function loop() { if (loaded >= 2) draw(); requestAnimationFrame(loop); })();
  }
})();
