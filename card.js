// Shared character card: builds the markup and adds a light pointer tilt + sheen.
// Tilt is skipped when the visitor prefers reduced motion or has no fine pointer.
(function () {
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches;
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  // o: {tag, href, img, alt, canvas, name, line, action, rank, rankName, tint, pos, size, contain}
  function make(o) {
    var card = el(o.tag || (o.href ? "a" : "button"), "hc-card" + (o.size === "sm" ? " hc-card--sm" : "") + (o.rank === 24 ? " hc-card--prism" : "") + (o.contain ? " hc-card--contain" : ""));
    if (card.tagName === "A") card.href = o.href; else card.type = "button";
    if (o.tint) card.style.setProperty("--tier", o.tint);
    if (o.pos) card.style.setProperty("--pos", o.pos);
    var art = el("span", "hc-card__art");
    if (o.canvas) art.appendChild(o.canvas);
    else if (o.img) { var im = el("img"); im.src = o.img; im.alt = o.alt || ""; im.decoding = "async"; art.appendChild(im);
      if (!(im.complete && im.naturalWidth)) { card.classList.add("is-loading"); var off = function () { card.classList.remove("is-loading"); }; im.addEventListener("load", off, { once: true }); im.addEventListener("error", off, { once: true }); } }
    card.appendChild(art);
    var foil = el("span", "hc-card__foil"); foil.setAttribute("aria-hidden", "true"); card.appendChild(foil);
    var sheen = el("span", "hc-card__sheen"); sheen.setAttribute("aria-hidden", "true"); card.appendChild(sheen);
    if (o.rank) {
      var r = el("span", "hc-card__rank");
      r.appendChild(el("b", null, String(o.rank)));
      r.appendChild(el("span", null, o.rankName || ""));
      card.appendChild(r);
    }
    var plate = el("span", "hc-card__plate");
    plate.appendChild(el("strong", null, o.name || ""));
    if (o.line) plate.appendChild(el("em", null, o.line));
    if (o.action) plate.appendChild(el("span", "hc-card__action", o.action));
    card.appendChild(plate);
    return card;
  }
  // Tilt + specular: pointer (fine pointers) or device gyro (phones), eased with a
  // critically damped spring in one rAF loop so the light glides instead of snapping.
  var active = null, cur = { x: .5, y: .3 }, tgt = { x: .5, y: .3 }, raf = 0;
  function apply(card, x, y, tilt) {
    card.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
    card.style.setProperty("--my", (y * 100).toFixed(1) + "%");
    card.style.setProperty("--spec", Math.min(1, Math.hypot(x - .5, y - .5) * 1.6).toFixed(3));
    if (tilt && !reduce) {
      card.style.setProperty("--ry", ((x - 0.5) * 10).toFixed(2) + "deg");
      card.style.setProperty("--rx", ((0.5 - y) * 10).toFixed(2) + "deg");
    }
  }
  function tick() {
    raf = 0;
    if (!active) return;
    cur.x += (tgt.x - cur.x) * .18; cur.y += (tgt.y - cur.y) * .18;
    apply(active, cur.x, cur.y, fine || gyroOn);
    if (Math.abs(tgt.x - cur.x) + Math.abs(tgt.y - cur.y) > .002) raf = requestAnimationFrame(tick);
  }
  function aim(card, x, y) {
    if (active !== card) { if (active) reset(active); active = card; cur.x = x; cur.y = y; }
    tgt.x = Math.max(0, Math.min(1, x)); tgt.y = Math.max(0, Math.min(1, y));
    if (reduce) { apply(card, tgt.x, tgt.y, false); return; }
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function reset(card) {
    ["--rx", "--ry", "--mx", "--my", "--spec"].forEach(function (k) { card.style.removeProperty(k); });
  }
  function onMove(e) {
    if (e.pointerType === "touch") return;
    var card = e.target.closest && e.target.closest(".hc-card");
    if (!card) return;
    var b = card.getBoundingClientRect();
    aim(card, (e.clientX - b.left) / b.width, (e.clientY - b.top) / b.height);
  }
  function onLeave(e) {
    var card = e.target.closest && e.target.closest(".hc-card");
    if (!card || (e.relatedTarget && card.contains(e.relatedTarget))) return;
    if (active === card) active = null;
    reset(card);
  }
  // Gyro (phones): the card nearest the middle of the screen catches the light.
  var gyroOn = false;
  function onOrient(e) {
    if (e.gamma == null) return;
    var mid = innerHeight / 2, best = null, bd = 1e9;
    document.querySelectorAll(".hc-card").forEach(function (c) {
      var r = c.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      var d = Math.abs(r.top + r.height / 2 - mid); if (d < bd) { bd = d; best = c; }
    });
    if (!best) return;
    aim(best, .5 + Math.max(-30, Math.min(30, e.gamma)) / 60, .5 + Math.max(-30, Math.min(30, (e.beta || 45) - 45)) / 60);
  }
  function startGyro() {
    if (gyroOn || reduce || fine || !window.DeviceOrientationEvent) return;
    var go = function () { gyroOn = true; addEventListener("deviceorientation", onOrient, { passive: true }); };
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      DeviceOrientationEvent.requestPermission().then(function (s) { if (s === "granted") go(); }).catch(function () {});
    } else go();
  }
  // Press feedback: a short haptic tick on phones (needs a real tap, so it is gesture-bound)
  // and an optional soft UI click when the visitor turned sound on (off by default).
  document.addEventListener("pointerdown", function (e) {
    var card = e.target.closest && e.target.closest(".hc-card");
    if (e.pointerType === "touch") startGyro();
    if (!card) return;
    if (e.pointerType === "touch" && navigator.vibrate && !reduce) { try { navigator.vibrate(8); } catch (x) {} }
    if (window.HallSound) window.HallSound.tick();
  }, { passive: true });
  // Skeleton shimmer until a card picture has decoded.
  function skel(root) {
    (root || document).querySelectorAll(".hc-card__art img").forEach(function (im) {
      if (im.complete && im.naturalWidth) return;
      var card = im.closest(".hc-card"); if (!card) return;
      card.classList.add("is-loading");
      var done = function () { card.classList.remove("is-loading"); };
      im.addEventListener("load", done, { once: true }); im.addEventListener("error", done, { once: true });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { skel(); }); else skel();
  // Cards that are not real buttons (Forge look cards) still answer Enter and Space.
  document.addEventListener("keydown", function (e) {
    var t = e.target;
    if ((e.key === "Enter" || e.key === " ") && t.classList && t.classList.contains("hc-card") && t.getAttribute("role") === "button") {
      e.preventDefault();
      t.click();
    }
  });
  document.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("pointerout", onLeave, { passive: true });
  window.HallCard = { make: make, skeleton: skel };
})();
