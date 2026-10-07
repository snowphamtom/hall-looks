/* HEAVY IS THE CROWN — spatial hologram player.
   Mimics the iPhone spatial-photo effect: device tilt drives parallax
   depth. The figure floats over a blurred depth-echo that shifts further,
   selling real dimensionality from a single cutout. */
(function () {
  "use strict";
  var canvas = document.getElementById("holoCanvas");
  if (!canvas) return;
  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var img = new Image(), loaded = false;
  img.onload = function () { loaded = true; };
  img.src = window.HOLO_SPATIAL || "";

  function fit() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round((canvas.clientWidth || 300) * dpr);
    canvas.height = Math.round((canvas.clientHeight || 500) * dpr);
  }
  window.addEventListener("resize", fit);
  fit();

  // tilt state: -1..1 on each axis (spring physics)
  var tiltX = 0, tiltY = 0, tTX = 0, tTY = 0, vX = 0, vY = 0;
  var gyroOK = false, lastTouch = 0;

  function enableGyro() {
    if (gyroOK || reduceMotion) return;
    var DOE = window.DeviceOrientationEvent;
    if (DOE && typeof DOE.requestPermission === "function") {
      DOE.requestPermission().then(function (res) {
        if (res === "granted") { gyroOK = true; listenGyro(); }
      }).catch(function () {});
    } else if (window.DeviceOrientationEvent) {
      gyroOK = true; listenGyro();
    }
  }
  function listenGyro() {
    window.addEventListener("deviceorientation", function (e) {
      if (e.beta == null || e.gamma == null) return;
      // portrait: gamma = left/right, beta = front/back
      tTX = Math.max(-1, Math.min(1, e.gamma / 25));
      tTY = Math.max(-1, Math.min(1, (e.beta - 45) / 25));
      lastTouch = performance.now();
    });
  }
  // iOS needs a gesture; try on first touch
  canvas.addEventListener("touchstart", enableGyro, { once: true, passive: true });
  canvas.addEventListener("pointerdown", enableGyro, { once: true });

  // pointer fallback parallax
  canvas.addEventListener("pointermove", function (e) {
    if (gyroOK && performance.now() - lastTouch < 3000) return;
    var r = canvas.getBoundingClientRect();
    tTX = ((e.clientX - r.left) / r.width) * 2 - 1;
    tTY = ((e.clientY - r.top) / r.height) * 2 - 1;
  });

  function draw(now) {
    // spring toward target tilt (iOS-like physics)
    var stiff = 0.045, damp = 0.82;
    vX = (vX + (tTX - tiltX) * stiff) * damp;
    vY = (vY + (tTY - tiltY) * stiff) * damp;
    tiltX += vX; tiltY += vY;
    // decay to center when idle and no gyro
    if (!gyroOK && performance.now() - lastTouch > 4000) {
      tTX *= 0.98; tTY *= 0.98;
    }

    var cw = canvas.width, ch = canvas.height;
    ctx.clearRect(0, 0, cw, ch);
    if (!loaded) { requestAnimationFrame(draw); return; }

    var s = Math.min(cw / img.naturalWidth, ch / img.naturalHeight) * 0.96;
    var dw = img.naturalWidth * s, dh = img.naturalHeight * s;
    var cx = cw / 2, cy = ch / 2;
    var px = tiltX * cw * 0.030, py = tiltY * ch * 0.030;

    // hologram breath: barely-there flicker, 25% translucent
    var breath = (reduceMotion ? 1 : 0.985 + 0.015 * Math.sin(now * 0.003)) * 0.75;

    // depth echo: soft, dark, shifted further — the "behind" layer
    ctx.save();
    ctx.globalAlpha = 0.30;
    ctx.filter = "blur(" + Math.max(2, s * 5) + "px) brightness(0.6)";
    ctx.drawImage(img, cx - dw / 2 + px * 2.0, cy - dh / 2 + py * 2.0, dw, dh);
    ctx.restore();

    // ground shadow: soft, shifts opposite
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = "#000";
    ctx.filter = "blur(" + Math.max(4, s * 12) + "px)";
    ctx.beginPath();
    ctx.ellipse(cx - px * 1.2, cy + dh * 0.47 - py * 0.8, dw * 0.38, dh * 0.030, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // hero
    ctx.filter = "none";
    ctx.globalAlpha = breath;
    ctx.drawImage(img, cx - dw / 2 + px, cy - dh / 2 + py, dw, dh);
    ctx.globalAlpha = 1;

    // tilt-following sheen, whisper-subtle
    var g = ctx.createLinearGradient(0, 0, cw, ch);
    var li = 0.045 + 0.035 * tiltX;
    g.addColorStop(0, "rgba(184,245,230," + Math.max(0, li).toFixed(3) + ")");
    g.addColorStop(0.5, "rgba(184,245,230,0)");
    g.addColorStop(1, "rgba(184,245,230," + Math.max(0, -li).toFixed(3) + ")");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, cw, ch);

    requestAnimationFrame(draw);
  }

  if (reduceMotion) {
    var iv = setInterval(function () {
      if (loaded) { tiltX = tiltY = 0; drawOnce(); clearInterval(iv); }
    }, 200);
    function drawOnce() {
      var cw = canvas.width, ch = canvas.height;
      var s = Math.min(cw / img.naturalWidth, ch / img.naturalHeight) * 0.96;
      ctx.drawImage(img, (cw - img.naturalWidth * s) / 2, (ch - img.naturalHeight * s) / 2,
        img.naturalWidth * s, img.naturalHeight * s);
    }
  } else {
    // gentle idle drift so it feels alive before first tilt
    var idle = 0;
    (function idleLoop() {
      if (performance.now() - lastTouch > 5000 && !gyroOK) {
        idle += 0.01;
        tTX = Math.sin(idle) * 0.25;
        tTY = Math.cos(idle * 0.7) * 0.18;
      }
      requestAnimationFrame(idleLoop);
    })();
    draw();
  }
})();
