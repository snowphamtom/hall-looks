// Phone nav: fold the page links behind a Menu button at narrow widths.
(function () {
  var nav = document.querySelector(".nav");
  var btn = nav && nav.querySelector(".nav-toggle");
  if (!nav || !btn) return;
  nav.setAttribute("data-collapsible", "");
  btn.addEventListener("click", function () {
    var open = !nav.classList.contains("open");
    nav.classList.toggle("open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    btn.textContent = open ? "Close" : "Menu";
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("open")) { btn.click(); btn.focus(); }
  });
})();
// Blossom sky: freeze drift and petals while the tab is hidden (battery).
// Reduced-motion visitors get a static blossom via the CSS media query.
(function () {
  document.addEventListener("visibilitychange", function () {
    document.documentElement.classList.toggle("sky-paused", document.hidden);
  });
})();
// Blossom sky, canvas petals: one requestAnimationFrame loop, paused while the
// tab is hidden; reduced-motion visitors get a single still frame.
(function () {
  var sky = document.getElementById("sky");
  if (sky && !sky.querySelector(".sky-pin")) {
    var pin = document.createElement("div");
    pin.className = "sky-pin";
    while (sky.firstChild) pin.appendChild(sky.firstChild);
    sky.appendChild(pin);
  }
  if (!sky || !window.requestAnimationFrame) return;
  var cv = document.createElement("canvas");
  var ctx = cv.getContext && cv.getContext("2d");
  if (!ctx) return;
  cv.className = "sky-canvas";
  cv.setAttribute("aria-hidden", "true");
  (sky.querySelector(".sky-pin") || sky).appendChild(cv);
  document.documentElement.classList.add("sky-live");
  var mq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  var W = 0, H = 0, dpr = 1, petals = [], raf = 0, last = 0;
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function make(p, anywhere) {
    p.x = rnd(-0.05, 1.05) * W; p.y = anywhere ? rnd(0, H) : rnd(-60, -10);
    p.r = rnd(4, 9) * (W < 700 ? 0.8 : 1); p.vy = rnd(14, 34); p.vx = rnd(6, 20);
    p.sw = rnd(0.4, 1.2); p.ph = rnd(0, 6.28); p.rot = rnd(0, 6.28); p.vr = rnd(-1, 1);
    p.a = rnd(0.45, 0.85); return p;
  }
  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.round(Math.min(46, Math.max(14, W * H / 32000)));
    while (petals.length < n) petals.push(make({}, true));
    petals.length = n;
  }
  function draw(dt, t) {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < petals.length; i++) {
      var p = petals[i];
      p.y += p.vy * dt; p.x += (p.vx + Math.sin(t * p.sw + p.ph) * 18) * dt; p.rot += p.vr * dt;
      if (p.y > H + 20 || p.x > W + 30) make(p, false);
      var flip = 0.35 + 0.65 * Math.abs(Math.cos(t * p.sw * 1.3 + p.ph));
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(1, flip);
      ctx.globalAlpha = p.a;
      ctx.fillStyle = "rgba(255,206,222,1)";
      ctx.beginPath();
      ctx.moveTo(0, -p.r);
      ctx.bezierCurveTo(p.r * 0.9, -p.r * 0.7, p.r * 0.8, p.r * 0.6, 0, p.r);
      ctx.bezierCurveTo(-p.r * 0.8, p.r * 0.6, -p.r * 0.9, -p.r * 0.7, 0, -p.r);
      ctx.fill(); ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
  function frame(now) {
    raf = 0;
    var dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016; last = now;
    draw(dt, now / 1000);
    if (!document.hidden && !(mq && mq.matches)) raf = requestAnimationFrame(frame);
  }
  function start() { if (!raf && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
  size();
  if (mq && mq.matches) draw(0, 0); else start();
  window.addEventListener("resize", function () { size(); if (mq && mq.matches) draw(0, 0); });
  document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
  if (mq && mq.addEventListener) mq.addEventListener("change", function () { mq.matches ? (stop(), draw(0, 0)) : start(); });
})();
// Optional UI sound: a soft synthesized click on card presses. Off by default;
// the visitor turns it on with the Sound button in the nav (kept in this browser).
(function () {
  var KEY = "hc-sound", on = false, ac = null;
  try { on = localStorage.getItem(KEY) === "on"; } catch (e) {}
  window.HallSound = {
    tick: function () {
      if (!on) return;
      try {
        ac = ac || new (window.AudioContext || window.webkitAudioContext)();
        var t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
        o.type = "triangle"; o.frequency.setValueAtTime(880, t); o.frequency.exponentialRampToValueAtTime(420, t + .06);
        g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.06, t + .005); g.gain.exponentialRampToValueAtTime(.0001, t + .09);
        o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + .1);
      } catch (e) {}
    }
  };
  var links = document.querySelector(".nav .nav-links");
  if (!links) return;
  var b = document.createElement("button");
  b.type = "button"; b.className = "nav-sound";
  // Fixed name + pressed state, so a screen reader says "Sound, toggle, pressed" instead of contradicting itself.
  b.setAttribute("aria-label", "Sound"); b.title = "Interface sounds";
  function paint() { b.textContent = on ? "Sound on" : "Sound off"; b.setAttribute("aria-pressed", on ? "true" : "false"); }
  paint();
  b.addEventListener("click", function () {
    on = !on; try { localStorage.setItem(KEY, on ? "on" : "off"); } catch (e) {}
    paint(); window.HallSound.tick();
  });
  links.appendChild(b);
})();
// Offline: a small service worker keeps the pages and pictures you have opened.
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  addEventListener("load", function () {
    var base = document.querySelector('link[rel="manifest"]');
    var url = base ? new URL("sw.js", base.href).href : null;
    if (url) navigator.serviceWorker.register(url, { scope: new URL("./", url).pathname }).catch(function () {});
  });
}
