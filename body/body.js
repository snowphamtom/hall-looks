/* Inner Body: the active character's Elemental makeup (engraved periodic ring) and Inner body
   (twelve anatomical plates in the Tessera crown-layer style). Light canon: one directional light,
   #fff2d8, elevation 31.7175 deg, azimuth 137.508 deg (on the page, north is up). */
(function () {
  "use strict";
  var D = window.CrownData, CW = window.CrownWorld;
  if (!D) return;
  var NS = "http://www.w3.org/2000/svg";
  var $ = function (id) { return document.getElementById(id); };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var LIGHT = { color: "#fff2d8", el: 31.7175, az: 137.508 };
  // compass azimuth (clockwise from north/up) -> SVG azimuth (clockwise from +x, y down)
  var svgAz = (LIGHT.az - 90 + 360) % 360;

  var ch = null;
  try { ch = CW && CW.character.active(); } catch (e) { ch = null; }
  var st = (ch && ch.forge) || {};
  var spec = (ch && ch.create) || {};
  var num = function (v, d) { v = +v; return isFinite(v) ? v : d; };
  var height = num(st.height, 50), mus = num(st.mus, 50);
  var massKg = Math.round(70 * (0.85 + 0.3 * height / 100) * (0.9 + 0.2 * mus / 100));
  $("bd-who").textContent = ch
    ? ch.name + ", your active character, read two ways: what the body is made of, and the twelve layers inside it."
    : "No active character yet, so this shows an average adult. Save one in Create, Forge or the Locker and it appears here.";
  $("bd-mass").textContent = massKg + " kg";

  var BY = {}; D.PERIODIC.forEach(function (r) { BY[r[1]] = r; });
  var IN_BODY = {}; D.COMPOSITION.forEach(function (c) { IN_BODY[c[0]] = c[1]; });
  var ARMOR = {};
  var fin = st.finish || "", wpn = st.weapon || "";
  ({ chrome: ["Cr", "Ni", "Fe"], black: ["Fe", "C"], white: ["Ti", "Zr"] }[fin] || []).forEach(function (s) { ARMOR[s] = 1; });
  ({ katana: ["Fe", "C"], hammer: ["Fe", "W"], axe: ["Fe", "Mn"], warhammer: ["Fe", "W", "V"] }[wpn] || []).forEach(function (s) { ARMOR[s] = 1; });
  var armorList = Object.keys(ARMOR);
  $("bd-armor").textContent = armorList.length
    ? "Not part of the body: the build's " + (fin ? fin + " finish" : "armor") + (wpn ? " and " + wpn : "") + " bring " + armorList.map(function (s) { return BY[s] ? BY[s][2] : s; }).join(", ") + ". They are ringed in silver on the outer band."
    : "This build carries no listed armor metals.";

  function el(tag, attrs, parent) { var n = document.createElementNS(NS, tag); for (var k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; }
  function pol(r, a) { a = (a - 90) * Math.PI / 180; return [400 + r * Math.cos(a), 400 + r * Math.sin(a)]; }
  function wedge(r0, r1, a0, a1) {
    var p0 = pol(r1, a0), p1 = pol(r1, a1), p2 = pol(r0, a1), p3 = pol(r0, a0), big = a1 - a0 > 180 ? 1 : 0;
    return "M" + p0 + "A" + r1 + "," + r1 + " 0 " + big + " 1 " + p1 + "L" + p2 + "A" + r0 + "," + r0 + " 0 " + big + " 0 " + p3 + "Z";
  }

  // ---------- Elemental makeup: the engraved ring ----------
  var svg = $("ring");
  var defs = el("defs", {}, svg);
  var f = el("filter", { id: "engrave", x: "-5%", y: "-5%", width: "110%", height: "110%" }, defs);
  el("feGaussianBlur", { "in": "SourceAlpha", stdDeviation: "1.6", result: "b" }, f);
  var sp = el("feSpecularLighting", { "in": "b", surfaceScale: "3.2", specularConstant: ".9", specularExponent: "22", "lighting-color": LIGHT.color, result: "s" }, f);
  el("feDistantLight", { azimuth: svgAz.toFixed(3), elevation: String(LIGHT.el) }, sp);
  el("feComposite", { "in": "s", in2: "SourceAlpha", operator: "in", result: "s2" }, f);
  el("feComposite", { "in": "SourceGraphic", in2: "s2", operator: "arithmetic", k1: "0", k2: "1", k3: ".75", k4: "0" }, f);
  var lx = 400 + Math.cos(svgAz * Math.PI / 180) * 260, ly = 400 + Math.sin(svgAz * Math.PI / 180) * 260;
  var sheen = el("radialGradient", { id: "sheen", gradientUnits: "userSpaceOnUse", cx: lx, cy: ly, r: "620" }, defs);
  el("stop", { offset: "0", "stop-color": LIGHT.color, "stop-opacity": ".22" }, sheen);
  el("stop", { offset: ".55", "stop-color": LIGHT.color, "stop-opacity": ".04" }, sheen);
  el("stop", { offset: "1", "stop-color": "#000", "stop-opacity": ".35" }, sheen);
  var gold = el("linearGradient", { id: "gold", gradientUnits: "userSpaceOnUse", x1: 800 - lx, y1: 800 - ly, x2: lx, y2: ly }, defs);
  el("stop", { offset: "0", "stop-color": "#6b4a12" }, gold); el("stop", { offset: ".55", "stop-color": "#d6a740" }, gold); el("stop", { offset: "1", "stop-color": "#fff2d8" }, gold);

  var CAT = { "Alkali": "#3a2a1c", "Alkaline": "#33291e", "Transition": "#262330", "Lanthanide/Actinide": "#2c2236", "Metalloid/Post-transition": "#1f2a2a", "Halogen": "#2a1f26", "Noble": "#1c2433" };
  var plate = el("g", { filter: "url(#engrave)" }, svg);
  el("circle", { cx: 400, cy: 400, r: 396, fill: "#0b0a0f", stroke: "url(#gold)", "stroke-width": "3" }, plate);
  // filigree: fine engraved rings and ticks
  [392, 384, 302, 296, 214, 208].forEach(function (r, i) { el("circle", { cx: 400, cy: 400, r: r, fill: "none", stroke: "#d6a740", "stroke-opacity": i % 2 ? ".35" : ".7", "stroke-width": i % 2 ? ".6" : "1.2" }, plate); });
  for (var t = 0; t < 360; t += 2.5) { var a = pol(384, t), b = pol(t % 15 === 0 ? 376 : 380, t); el("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: "#d6a740", "stroke-opacity": ".45", "stroke-width": ".6" }, plate); }
  // 17 beacons (the twelfth Tessera layer) as small engraved stars on the rim
  for (var k = 0; k < 17; k++) { var c = pol(392, k * 360 / 17); el("path", { d: "M" + c[0] + "," + (c[1] - 4) + "l1.4,2.6 2.6,1.4 -2.6,1.4 -1.4,2.6 -1.4,-2.6 -2.6,-1.4 2.6,-1.4z", fill: "#fff2d8", "fill-opacity": ".85" }, plate); }

  var step = 360 / 118, outer = el("g", {}, svg);
  D.PERIODIC.forEach(function (r, i) {
    var a0 = i * step + 0.25, a1 = (i + 1) * step - 0.25, sym = r[1], body = IN_BODY[sym], arm = ARMOR[sym];
    var g = el("g", { "class": "pt" + (body ? " is-body" : "") + (arm ? " is-armor" : "") }, outer);
    var t2 = el("title", {}, g); t2.textContent = r[0] + " " + r[2] + " · period " + r[4] + ", group " + r[5] + " · " + r[9] + (r[7] ? " · Fibonacci" : "") + (r[8] ? " · vault note: " + r[8] : "") + (body ? " · " + body + "% of body mass" : "") + (arm ? " · in the armor" : "");
    el("path", { d: wedge(304, 382, a0, a1), fill: body ? "url(#gold)" : (CAT[r[9]] || "#221f29"), stroke: arm ? "#e8eef5" : "#d6a740", "stroke-width": arm ? "1.6" : ".5", "stroke-opacity": arm ? "1" : ".55" }, g);
    var mid = (a0 + a1) / 2, p = pol(343, mid);
    var tx = el("text", { x: p[0], y: p[1], transform: "rotate(" + (mid > 180 ? mid + 90 : mid - 90) + " " + p[0] + " " + p[1] + ")", "class": "pt-sym", fill: body ? "#1a1206" : "#e9dcc0", "text-anchor": "middle", "dominant-baseline": "middle" }, g);
    tx.textContent = sym;
    if (r[7]) { var q = pol(375, mid); el("circle", { cx: q[0], cy: q[1], r: 1.6, fill: "#fff2d8", "fill-opacity": ".8" }, g); }
  });
  // inner ring: real share of body mass
  var majors = D.COMPOSITION.filter(function (c) { return c[1] >= 0.1; }), sum = 0;
  majors.forEach(function (c) { sum += c[1]; });
  var trace = Math.max(0, 100 - sum), acc = 0, inner = el("g", { filter: "url(#engrave)" }, svg);
  var tones = ["#d6a740", "#8fb4d8", "#e9dcc0", "#9bc49a", "#e2c56a", "#c98a5a", "#b48ad6", "#e8d36a", "#7fc6c0", "#9fd27a", "#d88aa8"];
  majors.concat([["trace", trace]]).forEach(function (c, i) {
    var a0 = acc / 100 * 360, a1 = (acc + c[1]) / 100 * 360; acc += c[1];
    var g = el("g", {}, inner), tt = el("title", {}, g);
    tt.textContent = c[0] === "trace" ? "Trace elements, about " + c[1].toFixed(1) + "%" : (BY[c[0]] ? BY[c[0]][2] : c[0]) + ": " + c[1] + "% of body mass";
    el("path", { d: wedge(218, 292, a0 + 0.3, Math.max(a0 + 0.6, a1 - 0.3)), fill: c[0] === "trace" ? "#3a3440" : tones[i % tones.length], "fill-opacity": ".9", stroke: "#0b0a0f", "stroke-width": "1" }, g);
    if (a1 - a0 > 9) { var m = (a0 + a1) / 2, p = pol(255, m); var tx = el("text", { x: p[0], y: p[1], "class": "pt-major", "text-anchor": "middle", "dominant-baseline": "middle" }, g); tx.textContent = c[0] + " " + c[1] + "%"; }
  });
  el("circle", { cx: 400, cy: 400, r: 396, fill: "url(#sheen)", "pointer-events": "none" }, svg);
  // the character, whole (meet = never cropped), in an engraved frame
  var fw = 230, fh = 300, fr = el("g", {}, svg);
  el("rect", { x: 400 - fw / 2 - 6, y: 400 - fh / 2 - 6, width: fw + 12, height: fh + 12, rx: 10, fill: "#050506", stroke: "url(#gold)", "stroke-width": "3", filter: "url(#engrave)" }, fr);
  var pic = el("image", { x: 400 - fw / 2, y: 400 - fh / 2, width: fw, height: fh, preserveAspectRatio: "xMidYMid meet" }, fr);
  pic.setAttribute("href", CW ? CW.character.picture(ch) : "../images/look-black-chrome-realistic.webp");
  var cap = el("text", { x: 400, y: 400 + fh / 2 + 34, "class": "pt-name", "text-anchor": "middle" }, fr);
  cap.textContent = ch ? ch.name.split(" · ")[0] : "An average adult";

  // table
  var tb = $("bd-table").querySelector("tbody");
  D.COMPOSITION.forEach(function (c) {
    var r = BY[c[0]] || [0, c[0], c[0], "", "", "", "", 0, "", ""], g = massKg * 1000 * c[1] / 100;
    var tr = document.createElement("tr");
    var grams = g >= 1000 ? (g / 1000).toFixed(g >= 10000 ? 0 : 1) + " kg" : g >= 1 ? Math.round(g) + " g" : g >= 0.001 ? (g * 1000).toFixed(g * 1000 >= 10 ? 0 : 1) + " mg" : (g * 1e6).toFixed(0) + " µg";
    [r[2] + " (" + c[0] + ")", c[1] + "%", grams, "P" + r[4] + " · G" + r[5] + " · " + r[9] + (r[7] ? " · Fibonacci" : "")].forEach(function (v, i) { var td = document.createElement(i ? "td" : "th"); if (!i) td.scope = "row"; td.textContent = v; tr.appendChild(td); });
    tb.appendChild(tr);
  });

  // ---------- Inner body: twelve plates ----------
  var stats = CW ? CW.ledger.stats() : { rooms: [], total: 0, days: 0 };
  var nRooms = CW ? CW.rooms.length : 1;
  var V = {
    height: height / 100, wear: Math.min(1, num(st.wear, 8) / 60), finish: { chrome: .85, white: .65, black: .45 }[fin] || .5,
    mus: mus / 100, rank: spec.rank ? .75 : .5, makeup: .96, glow: Math.min(1, num(st.glow, 9) / 40), crack: 1 - Math.min(1, num(st.crack, 12) / 100),
    origin: spec.origin ? .7 : .5, days: Math.min(1, stats.days / 7), armor: (st.helmet && st.helmet !== "none" ? .5 : .15) + (st.chest && st.chest !== "light" ? .5 : .15),
    ledger: Math.min(1, stats.rooms.length / nRooms)
  };
  var stack = $("stack"), plates = $("plates"), hue = function (i) { return 30 + i * 27; };
  var figure = document.createElement("img");
  figure.className = "bd-figure"; figure.alt = ""; figure.decoding = "async";
  figure.src = CW ? CW.character.picture(ch) : "../images/look-black-chrome-realistic.webp";
  stack.appendChild(figure);
  var plateEls = [];
  D.LAYERS.forEach(function (L, i) {
    var p = document.createElement("div");
    p.className = "bd-plate"; p.style.setProperty("--i", String(i)); p.style.setProperty("--h", String(hue(i)));
    p.innerHTML = "<span class='bd-plate-n'></span>";
    p.firstChild.textContent = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][i];
    stack.appendChild(p); plateEls.push(p);
    var v = V[L.input] == null ? .5 : V[L.input];
    var li = document.createElement("li");
    li.className = "bd-layer"; li.style.setProperty("--h", String(hue(i)));
    li.innerHTML = "<button type='button' class='bd-layer-h' aria-pressed='false'><span class='bd-num'></span><span><small></small><strong></strong><em></em></span></button>" +
      "<p><b>The book teaches:</b> <span class='t'></span></p><p><b>Measured:</b> <span class='m'></span></p>" +
      "<div class='bd-bar' role='meter' aria-valuemin='0' aria-valuemax='100'><i></i></div>";
    li.querySelector(".bd-num").textContent = p.firstChild.textContent;
    li.querySelector("small").textContent = L.tessera;
    li.querySelector("strong").textContent = L.crown;
    li.querySelector("em").textContent = "Chapter " + L.n + ": " + L.chapter;
    li.querySelector(".t").textContent = L.teach;
    li.querySelector(".m").textContent = L.input === "ledger" ? stats.rooms.length + " of " + nRooms + " rooms visited, " + stats.total + " moments kept." : L.fact;
    var bar = li.querySelector(".bd-bar"); bar.setAttribute("aria-valuenow", String(Math.round(v * 100)));
    bar.setAttribute("aria-label", (ch ? "Your champion" : "Average") + ", " + L.crown + ": " + Math.round(v * 100) + "%");
    bar.firstChild.style.width = Math.round(v * 100) + "%";
    p.style.setProperty("--v", v.toFixed(2));
    li.querySelector("button").addEventListener("click", function () { solo(i); });
    plates.appendChild(li);
  });
  var soloI = -1;
  function solo(i) {
    soloI = soloI === i ? -1 : i;
    plateEls.forEach(function (p, j) { p.classList.toggle("is-dim", soloI >= 0 && j !== soloI); p.classList.toggle("is-on", j === soloI); });
    [].forEach.call(plates.children, function (li, j) { li.classList.toggle("is-on", j === soloI); li.querySelector("button").setAttribute("aria-pressed", j === soloI ? "true" : "false"); });
  }
  $("all-layers").addEventListener("click", function () { soloI = -2; solo(-1); });
  $("breathe").addEventListener("click", function () { var on = !stack.classList.contains("is-breathing"); stack.classList.toggle("is-breathing", on); this.setAttribute("aria-pressed", on ? "true" : "false"); });

  // tabs
  function show(which) {
    ["makeup", "inner"].forEach(function (k) { var on = k === which; $("view-" + k).hidden = !on; $("tab-" + k).setAttribute("aria-selected", on ? "true" : "false"); });
    try { history.replaceState(null, "", "#" + which); } catch (e) {}
    if (CW) CW.ledger.add("body", { name: which === "inner" ? "Inner body" : "Elemental makeup" });
  }
  $("tab-makeup").addEventListener("click", function () { show("makeup"); });
  $("tab-inner").addEventListener("click", function () { show("inner"); });
  $("tab-makeup").addEventListener("keydown", function (e) { if (e.key === "ArrowRight") { $("tab-inner").focus(); show("inner"); } });
  $("tab-inner").addEventListener("keydown", function (e) { if (e.key === "ArrowLeft") { $("tab-makeup").focus(); show("makeup"); } });
  if (location.hash === "#inner") { $("view-makeup").hidden = true; $("view-inner").hidden = false; $("tab-inner").setAttribute("aria-selected", "true"); $("tab-makeup").setAttribute("aria-selected", "false"); }
  if (reduce) stack.classList.add("is-still");
})();
