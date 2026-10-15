// Crown World: one character carried across the Hall, and a crown ledger that remembers.
// Saved in this browser only (localStorage). Nothing is sent anywhere.
(function () {
  "use strict";
  if (window.CrownWorld) return;
  var LEDGER_KEY = "crown-ledger-v1", ACTIVE_KEY = "crown-world-active-v1", MAX = 500;
  var LOOKS = ["black-chrome", "white-samurai", "skull-champion", "titan-gladiator"];
  // Every room in the Hall (inferno/ is deliberately not listed). g = group for the Throne doorways.
  var ROOMS = [
    ["home", "", "Home", "Hall"], ["throne", "throne/", "Throne Room", "Hall"], ["forge", "forge/", "Forge", "Hall"], ["locker", "locker/", "Locker", "Hall"],
    ["create", "create/", "Create", "Hall"], ["smith", "smith/", "Smith", "Hall"], ["colosseum", "colosseum/", "Colosseum", "Hall"],
    ["gallery", "gallery/", "Gallery", "Hall"], ["workbench", "workbench/", "Workbench", "Hall"], ["help", "help/", "Help", "Hall"],
    ["foundation", "foundation/", "Foundation", "Looks"], ["black-chrome", "black-chrome/", "Black Chrome", "Looks"],
    ["white-samurai", "white-samurai/", "White Samurai", "Looks"], ["skull-champion", "skull-champion/", "Skull Champion", "Looks"],
    ["titan-gladiator", "titan-gladiator/", "Titan Gladiator", "Looks"],
    ["cathedral", "cathedral/", "Cathedral", "Exhibits"], ["core", "core/", "Core", "Exhibits"], ["the-core", "the-core/", "The Core", "Exhibits"],
    ["lab", "lab/", "Lab", "Lab"], ["elemental", "elemental/", "Elemental", "Lab"], ["tessera-bridge", "tessera-bridge/", "Tessera Bridge", "Lab"],
    ["supreme-quad", "supreme-quad/", "Supreme Quad", "Lab"], ["fault-constellation", "fault-constellation/", "Fault Constellation", "Lab"],
    ["genesis-forest", "genesis-forest/", "Genesis Forest", "Lab"], ["genesis-marvel", "genesis-marvel/", "Genesis Marvel", "Lab"],
    ["seraphim", "seraphim/", "Seraphim", "Lab"],
    ["ar_lasers", "ar_lasers.html", "AR Lasers", "Demos"], ["ar_lasers_kid", "ar_lasers_kid.html", "AR Lasers Kid", "Demos"],
    ["ball_room", "ball_room.html", "Ball Room", "Demos"], ["bird_swarms", "bird_swarms.html", "Five Lasers", "Demos"],
    ["finger_haptics", "finger_haptics.html", "Finger Nodes", "Demos"], ["finger_holo", "finger_holo.html", "Full Plate", "Demos"],
    ["retina", "retina.html", "Retina", "Demos"]
  ].map(function (r) { return { id: r[0], href: r[1], title: r[2], group: r[3] }; });
  var OG = { "home": 1, "black-chrome": 1, "cathedral": 1, "colosseum": 1, "core": 1, "create": 1, "elemental": 1, "fault-constellation": 1, "forge": 1, "foundation": 1, "gallery": 1, "genesis-forest": 1, "genesis-marvel": 1, "help": 1, "locker": 1, "skull-champion": 1, "smith": 1, "supreme-quad": 1, "tessera-bridge": 1, "throne": 1, "titan-gladiator": 1, "white-samurai": 1, "workbench": 1 };
  ROOMS.forEach(function (r) { r.og = OG[r.id] ? "images/og/" + r.id + ".jpg" : ""; });
  var LABEL = { visit: "Visited", build: "Built", save: "Saved", forge: "Forged", fight: "Fought", smith: "Chose weapon", active: "Crowned", share: "Shared", door: "Walked through" };

  function read(key, dflt) { try { var v = JSON.parse(localStorage.getItem(key)); return v == null ? dflt : v; } catch (e) { return dflt; } }
  function write(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function base() {
    var s = document.querySelector("script[src*='crown-world.js']");
    return s ? new URL("..", s.src).href : new URL("./", location.href).href;
  }
  function roomId() {
    var p = location.href.replace(/[?#].*$/, ""), b = base();
    if (p.indexOf(b) !== 0) return "page";
    var rest = p.slice(b.length).replace(/index\.html$/, "");
    return rest === "" ? "home" : rest.split("/")[0].replace(/\.html$/, "");
  }
  var subs = [], openCrown = function () {};
  function emit() { var l = list(); subs.forEach(function (f) { try { f(l); } catch (e) {} }); }
  function list(o) {
    o = o || {};
    var l = read(LEDGER_KEY, []); if (!Array.isArray(l)) l = [];
    if (o.type) l = l.filter(function (e) { return e.type === o.type; });
    if (o.since) l = l.filter(function (e) { return e.t >= o.since; });
    return o.limit ? l.slice(-o.limit) : l;
  }
  function add(type, data) {
    var l = list();
    var ev = { t: Date.now(), type: String(type), page: roomId(), data: data || {} };
    l.push(ev); if (l.length > MAX) l = l.slice(-MAX);
    var ok = write(LEDGER_KEY, l); if (ok) emit();
    return ok ? ev : null;
  }
  function stats() {
    var l = list(), by = {}, rooms = {}, days = {};
    l.forEach(function (e) { by[e.type] = (by[e.type] || 0) + 1; if (e.type === "visit") rooms[e.page] = 1; days[new Date(e.t).toDateString()] = 1; });
    return { total: l.length, byType: by, rooms: Object.keys(rooms), days: Object.keys(days).length };
  }

  function entries() {
    try {
      if (window.HallLocker) return window.HallLocker.entries() || [];
      var l = read("foundation-locker-v2", []); // pages without locker-store.js (Forge) read the same key
      return Array.isArray(l) ? l.filter(function (x) { return x && x.id && x.state; }).slice(0, 24) : [];
    } catch (e) { return []; }
  }
  function fromEntry(e) {
    if (!e) return null;
    var st = e.state || {};
    return { v: 1, id: e.id, name: e.label || "Saved character", origin: e.source === "create" ? "create" : (e.look ? "preset" : "forge"),
      create: e.spec || null, forge: st, look: e.look || (typeof st.preset === "number" ? LOOKS[st.preset] : null), thumb: e.thumb || "", at: e.at };
  }
  function newest(l) { return l.slice().sort(function (a, b) { return (+new Date(b.at) || 0) - (+new Date(a.at) || 0); })[0]; }
  function active() {
    var l = entries(), id = read(ACTIVE_KEY, null), pick = null;
    for (var i = 0; i < l.length; i++) if (l[i].id === id) pick = l[i];
    return fromEntry(pick || newest(l));
  }
  function setActive(id, quiet) {
    write(ACTIVE_KEY, id);
    if (!quiet) { var c = active(); add("active", { id: id, name: c && c.name }); } else emit();
  }
  function nearestLook(c) {
    if (!c) return null; if (c.look) return c.look;
    var s = c.forge || {};
    if (s.helmet === "skull") return "skull-champion";
    if (s.helmet === "samurai" || s.finish === "white") return "white-samurai";
    if (s.helmet === "titan" || s.chest === "gladiator") return "titan-gladiator";
    return "black-chrome";
  }
  // The character's picture: its saved card thumbnail, else the nearest look's full picture (never cropped by us).
  function picture(c) {
    if (c && c.thumb && String(c.thumb).indexOf("data:image/") === 0) return c.thumb;
    return base() + "images/look-" + (nearestLook(c) || "black-chrome") + "-realistic.webp";
  }
  function gems() {
    var s = stats();
    return ROOMS.map(function (r) { return { id: r.id, title: r.title, on: s.rooms.indexOf(r.id) >= 0, color: gemColor(r.id) }; });
  }
  function fromHash(h) {
    h = h || "";
    var m = /^#c=([^~]*)(?:~(.*))?$/.exec(h);
    if (m) { var k = ["ancestry", "origin", "build", "weapon", "rank", "finish"], p = m[1].split("."), spec = {};
      k.forEach(function (x, i) { spec[x] = p[i] ? decodeURIComponent(p[i]) : null; });
      return { v: 1, id: null, name: m[2] ? decodeURIComponent(m[2]) : "Created character", origin: "create", create: spec, forge: null, look: null, thumb: "" }; }
    if (/^#b=/.test(h)) return { v: 1, id: null, name: "Forge build", origin: "forge", create: null, forge: null, look: null, thumb: "", hash: h };
    return null;
  }

  // ---- The crown: gems for rooms visited, plus a readable log. A small fixed crown button on pages with the site nav.
  function gemColor(id) { var h = 0; for (var i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360; return "hsl(" + h + ", 70%, 62%)"; }
  function when(t) { var d = new Date(t); return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }); }
  function describe(e) {
    var d = e.data || {}, r = ROOMS.filter(function (x) { return x.id === e.page; })[0], room = r ? r.title : e.page;
    var what = d.name || d.label || (d.a && d.b ? d.a + " vs " + d.b : "") || d.weapon || "";
    return (LABEL[e.type] || e.type) + (e.type === "visit" ? " " + room : (what ? " " + what : "") + " · " + room);
  }
  var css = ".cw-chip{position:fixed;z-index:61;right:max(12px,env(safe-area-inset-right));bottom:max(12px,env(safe-area-inset-bottom));display:inline-flex;align-items:center;gap:6px;backdrop-filter:blur(4px);padding:4px 10px;border-radius:999px;border:1px solid rgba(226,197,106,.45);background:rgba(10,10,14,.6);color:#e2c56a;font:inherit;font-size:13px;cursor:pointer;white-space:nowrap}" +
    ".cw-chip:focus-visible{outline:2px solid #e2c56a;outline-offset:2px}" +
    ".cw-panel{position:fixed;z-index:60;right:12px;bottom:58px;width:min(360px,calc(100vw - 24px));max-height:min(70vh,560px);overflow:auto;padding:16px;border-radius:14px;background:rgba(8,8,12,.94);border:1px solid rgba(226,197,106,.35);color:#eee;box-shadow:0 20px 60px rgba(0,0,0,.6);box-sizing:border-box}" +
    ".cw-panel[hidden]{display:none}.cw-panel h2{font-family:'Cormorant Garamond',serif;font-weight:600;font-size:24px;margin:0 0 4px;color:#e2c56a}" +
    ".cw-who{margin:0 0 10px;font-size:14px;opacity:.9}.cw-gems{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 12px;padding:0;list-style:none}" +
    ".cw-gems li{width:14px;height:14px;transform:rotate(45deg);border-radius:3px;box-shadow:0 0 8px currentColor}" +
    ".cw-gems li.off{background:transparent!important;border:1px solid rgba(255,255,255,.18);box-shadow:none}" +
    ".cw-log{list-style:none;padding:0;margin:0;font-size:13px;line-height:1.45}.cw-log li{padding:4px 0;border-top:1px solid rgba(255,255,255,.08);display:flex;justify-content:space-between;gap:10px}" +
    ".cw-log time{opacity:.6;white-space:nowrap}.cw-sum{font-size:12px;opacity:.75;margin:0 0 6px}.cw-x{float:right;background:none;border:0;color:#ccc;font-size:20px;cursor:pointer}";
  function mountCrown() {
    var nav = document.querySelector(".nav");
    if (!nav || nav.querySelector(".cw-chip")) return;
    var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    var chip = document.createElement("button");
    chip.type = "button"; chip.className = "cw-chip"; chip.setAttribute("aria-expanded", "false"); chip.setAttribute("aria-controls", "cw-panel");
    chip.title = "The crown remembers: your builds, fights and visits";
    var panel = document.createElement("section");
    panel.id = "cw-panel"; panel.className = "cw-panel"; panel.hidden = true; panel.setAttribute("aria-label", "Crown ledger");
    document.body.appendChild(chip);
    document.body.appendChild(panel);
    function paint() {
      var s = stats(); chip.textContent = "♛ " + s.total;
      chip.setAttribute("aria-label", "Crown ledger, " + s.total + " events");
      if (panel.hidden) return;
      var c = active(), log = list({ limit: 40 }).reverse();
      panel.innerHTML = "<button class='cw-x' type='button' aria-label='Close'>×</button><h2>The crown remembers</h2><p class='cw-who'></p><p class='cw-sum'></p><ul class='cw-gems' aria-label='Rooms visited'></ul><ul class='cw-log'></ul>";
      panel.querySelector(".cw-who").textContent = c ? "Wearing it: " + c.name : "No character yet. Build one in Create or Forge.";
      panel.querySelector(".cw-sum").textContent = s.rooms.length + " of " + ROOMS.length + " rooms · " + (s.byType.build || 0) + " builds · " + (s.byType.save || 0) + " saves · " + (s.byType.fight || 0) + " fights · " + s.days + " day" + (s.days === 1 ? "" : "s");
      var g = panel.querySelector(".cw-gems");
      ROOMS.forEach(function (r) { var li = document.createElement("li"), on = s.rooms.indexOf(r.id) >= 0; li.title = r.title + (on ? "" : " (not yet)"); if (on) { li.style.background = gemColor(r.id); li.style.color = gemColor(r.id); } else li.className = "off"; g.appendChild(li); });
      var ul = panel.querySelector(".cw-log");
      if (!log.length) { var li0 = document.createElement("li"); li0.textContent = "Nothing yet."; ul.appendChild(li0); }
      log.forEach(function (e) { var li = document.createElement("li"), sp = document.createElement("span"), tm = document.createElement("time"); sp.textContent = describe(e); tm.textContent = when(e.t); li.appendChild(sp); li.appendChild(tm); ul.appendChild(li); });
      panel.querySelector(".cw-x").addEventListener("click", function () { toggle(false); chip.focus(); });
    }
    openCrown = function () { toggle(true); };
    function toggle(open) { panel.hidden = !open; chip.setAttribute("aria-expanded", open ? "true" : "false"); paint(); }
    chip.addEventListener("click", function () { toggle(panel.hidden); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) { toggle(false); chip.focus(); } });
    subs.push(paint); paint();
  }
  window.addEventListener("storage", function (e) { if (e.key === LEDGER_KEY || e.key === ACTIVE_KEY) emit(); });

  function visit() {
    var room = roomId(), last = list({ type: "visit", limit: 30 }).filter(function (e) { return e.page === room; }).pop();
    if (last && Date.now() - last.t < 10 * 60 * 1000) return null;
    return add("visit", { room: room });
  }

  window.CrownWorld = {
    ledger: { KEY: LEDGER_KEY, add: add, list: list, stats: stats, clear: function () { write(LEDGER_KEY, []); emit(); }, on: function (f) { subs.push(f); } },
    character: { KEY: ACTIVE_KEY, active: active, setActive: setActive, all: function () { return entries().map(fromEntry); }, fromEntry: fromEntry, fromHash: fromHash, nearestLook: nearestLook, picture: picture },
    rooms: ROOMS, room: roomId, visit: visit, base: base, gems: gems, openCrown: function () { openCrown(); }
  };
  function boot() { visit(); mountCrown(); try { document.dispatchEvent(new CustomEvent("crownworld:ready")); } catch (e) {} }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
