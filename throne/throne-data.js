/* Throne Room: statue list, static gallery, card overlay, lazy 3D hall. */
(function () {
  "use strict";
  var ROSTER = [
    { id: "foundation", name: "Foundation", note: "White mosaic plates over black armor with gold trim, and a see-through cape that shows rainbow light.", img: "../images/foundation.webp", w: 1280, h: 720, href: "../foundation/" },
    { id: "black-chrome", name: "Black Chrome", note: "Dark chrome armor with amber light, hammer.", img: "../images/locker-black-chrome.webp", w: 800, h: 1600, href: "../black-chrome/" },
    { id: "white-samurai", name: "White Samurai", note: "White crackle armor, horned helmet, katana drawn.", img: "../images/locker-white-samurai.webp", w: 800, h: 1600, href: "../white-samurai/" },
    { id: "skull-champion", name: "Skull Champion", note: "Skull helmet, black armor, axe.", img: "../images/look-skull-champion-realistic.webp", w: 1280, h: 720, href: "../skull-champion/" },
    { id: "titan-gladiator", name: "Titan Gladiator", note: "Gunmetal armor, amber chest glow, war hammer.", img: "../images/locker-titan-gladiator.webp", w: 800, h: 1600, href: "../titan-gladiator/" }
  ];
  var PRESET = ["black-chrome", "white-samurai", "skull-champion", "titan-gladiator"];
  function byId(id) { for (var i = 0; i < ROSTER.length; i++) if (ROSTER[i].id === id) return ROSTER[i]; return null; }
  function rosterFor(e) {
    var st = e.state || {};
    return byId(e.look) || byId(e.id) || (typeof st.preset === "number" ? byId(PRESET[st.preset]) : null);
  }
  function b64u(s) { return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  function tier(n) { var R = window.LOCKER_RANKS || []; return R[Math.max(0, Math.min(23, (n || 1) - 1))] || { n: n, name: "Rank " + n, tint: "#e2c56a", line: "" }; }
  function rankOf(x) { return window.rankForCharacter ? window.rankForCharacter(x) : 1; }

  var entries = [];
  try { entries = (window.HallLocker && window.HallLocker.entries && window.HallLocker.entries()) || []; } catch (e) { entries = []; }
  var fromLocker = entries.length > 0;
  var statues = [];
  if (fromLocker) {
    entries.slice(0, 24).forEach(function (e) {
      var c = rosterFor(e);
      var thumb = e.thumb && String(e.thumb).indexOf("data:image/") === 0 ? e.thumb : "";
      var n = rankOf(e), t = tier(n);
      statues.push({
        name: e.label || (c ? c.name : "Saved character"),
        line: t.name + " · " + (t.line || "") + (c ? " · " + c.name : ""),
        img: thumb || (c ? c.img : "../images/foundation.webp"),
        w: thumb ? 0 : (c ? c.w : 1280), h: thumb ? 0 : (c ? c.h : 720),
        rank: n, rankName: t.name, tint: t.tint,
        forge: e.state ? "../forge/#b=" + b64u(JSON.stringify({ v: 1, a: e.fig === 1 ? 1 : 0, f: [e.state] })) : "../forge/",
        look: c ? c.href : ""
      });
    });
  } else {
    ROSTER.forEach(function (c) {
      var n = rankOf({ look: c.id }), t = tier(n);
      statues.push({ name: c.name, line: c.note, img: c.img, w: c.w, h: c.h, rank: n, rankName: t.name, tint: t.tint, forge: "../forge/", look: c.href });
    });
  }
  statues.sort(function (a, b) { return b.rank - a.rank; });
  window.THRONE_STATUES = statues;

  var $ = function (id) { return document.getElementById(id); };
  $("lede").textContent = fromLocker
    ? statues.length + (statues.length === 1 ? " character from your Locker stands" : " characters from your Locker stand") + " here, highest rank nearest the throne. Brighter gold in the floor means higher rank. The throne stays empty."
    : "Your Locker is empty, so the hall's own fighters keep the plinths. Save a character in the Forge or Locker and it takes a plinth here. Brighter gold means higher rank. The throne stays empty.";

  // Static gallery (always present; it is the list view and the no-WebGL / reduced-motion view)
  var list = $("statues");
  statues.forEach(function (s, i) {
    var li = document.createElement("li");
    var b = document.createElement("button");
    b.type = "button"; b.className = "throne-statue";
    b.style.setProperty("--tint", s.tint);
    var img = document.createElement("img");
    img.src = s.img; img.alt = s.name; img.loading = i < 3 ? "eager" : "lazy"; img.decoding = "async";
    if (s.w) { img.width = s.w; img.height = s.h; }
    var cap = document.createElement("span");
    cap.innerHTML = "<small></small><strong></strong>";
    cap.firstChild.textContent = s.rankName + " · rank " + s.rank;
    cap.lastChild.textContent = s.name;
    b.append(img, cap);
    b.addEventListener("click", function () { openCard(i, b); });
    li.appendChild(b); list.appendChild(li);
  });

  // Card overlay
  var card = $("card"), lastFocus = null;
  function openCard(i, from) {
    var s = statues[i]; if (!s) return;
    lastFocus = from || document.activeElement;
    $("card-img").src = s.img; $("card-img").alt = s.name;
    $("card-rank").textContent = s.rankName + " · rank " + s.rank + " of 24";
    $("card-name").textContent = s.name;
    $("card-line").textContent = s.line;
    $("card-forge").href = s.forge;
    card.style.setProperty("--tint", s.tint);
    card.hidden = false;
    $("card-close").focus();
    document.dispatchEvent(new CustomEvent("throne:card", { detail: true }));
  }
  function closeCard() {
    if (card.hidden) return;
    card.hidden = true;
    document.dispatchEvent(new CustomEvent("throne:card", { detail: false }));
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  $("card-close").addEventListener("click", closeCard);
  card.addEventListener("click", function (e) { if (e.target === card) closeCard(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeCard(); });
  window.ThroneCard = { open: openCard, close: closeCard };

  // Decide on the 3D hall
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var gl = false;
  try { var c = document.createElement("canvas"); gl = !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { gl = false; }
  var note = $("mode-note");
  if (!gl) { document.documentElement.classList.remove("t3d"); note.hidden = false; note.textContent = "This browser has no WebGL, so the hall is shown as a gallery."; return; }
  var enter = $("enter-3d");
  function start() {
    enter.hidden = true;
    document.documentElement.classList.add("t3d");
    document.body.classList.add("throne-3d");
    import("./throne3d.js?v=p0l1sh13").then(function (m) { m.start(statues); }).catch(function (err) { if (window.console) console.error("throne3d", err);
      document.documentElement.classList.remove("t3d"); document.body.classList.remove("throne-3d");
      note.hidden = false; note.textContent = "The hall could not load, so it is shown as a gallery.";
    });
  }
  $("leave-3d").addEventListener("click", function () {
    $("gallery").scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  });
  if (reduce) {
    note.hidden = false; note.textContent = "Reduced motion is on, so the hall is shown as a still gallery.";
    enter.hidden = false; enter.textContent = "Enter the hall anyway";
    enter.addEventListener("click", start);
    return;
  }
  // Show the stage now (no layout jump), load the hall once the page has settled.
  document.documentElement.classList.add("t3d"); document.body.classList.add("throne-3d");
  var go = function () { (window.requestIdleCallback || function (f) { setTimeout(f, 60); })(start, { timeout: 1200 }); };
  if (document.readyState === "complete") go(); else addEventListener("load", go, { once: true });
})();
