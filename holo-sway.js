/* HEAVY IS THE CROWN — sway hologram player.
   3 true 3D frames (45°L, front, 45°R), ping-pong crossfade.
   Locked framing: all frames share identical dimensions. */
(function () {
  "use strict";
  var canvas = document.getElementById("holoCanvas");
  if (!canvas) return;
  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var N = 3, frames = [], loaded = 0;
  for (var i = 0; i < N; i++) {
    (function (idx) {
      var img = new Image();
      img.onload = function () { loaded++; };
      img.src = (window.HOLO_SWAY || [])[idx] || "";
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

  var t = 0, lastTouch = 0, manual = 0;
  canvas.addEventListener("pointermove", function (e) {
    var r = canvas.getBoundingClientRect();
    manual = ((e.clientX - r.left) / r.width) * 2; // 0..2
    lastTouch = performance.now();
  });
  canvas.addEventListener("touchmove", function (e) {
    var r = canvas.getBoundingClientRect();
    manual = ((e.touches[0].clientX - r.left) / r.width) * 2;
    lastTouch = performance.now();
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
    var now = performance.now(), pos;
    if (reduceMotion) {
      pos = 1;
    } else if (now - lastTouch < 2500) {
      pos = manual;
    } else {
      t += 0.008; // ~13s per full back-and-forth
      pos = 1 + Math.sin(t); // 0..2 ping-pong
    }
    pos = Math.max(0, Math.min(2, pos));
    var i0 = Math.floor(pos), f = pos - i0;
    if (i0 >= 2) { i0 = 1; f = 1; }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    blit(frames[i0], 1 - f);
    blit(frames[i0 + 1], f);
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
