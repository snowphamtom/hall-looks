/* HEAVY IS THE CROWN — Armor measurement atlas.
   Per-chassis, per-piece 3D bounding data. Units in mm (figure = 1900mm).
   x,y,w,h = fractions of figure bounding box. d = depth fraction. */
window.WB_ATLAS = (function () {
  // Standard humanoid template (fractions)
  var T = {
    helm:     { x: 0.41, y: 0.005, w: 0.18, h: 0.125, d: 0.16, name: "HELM", sub: "Cranial housing" },
    gorget:   { x: 0.43, y: 0.125, w: 0.14, h: 0.055, d: 0.12, name: "GORGET", sub: "Neck assembly" },
    pauldron: { x: 0.20, y: 0.150, w: 0.60, h: 0.110, d: 0.13, name: "PAULDRONS", sub: "Shoulder guards ×2" },
    cuirass:  { x: 0.34, y: 0.230, w: 0.32, h: 0.200, d: 0.15, name: "CUIRASS", sub: "Torso shell" },
    fauld:    { x: 0.36, y: 0.420, w: 0.28, h: 0.090, d: 0.13, name: "FAULD", sub: "Waist lame" },
    gauntlet: { x: 0.16, y: 0.300, w: 0.68, h: 0.260, d: 0.10, name: "GAUNTLETS", sub: "Arm harness ×2" },
    cuisse:   { x: 0.36, y: 0.510, w: 0.28, h: 0.170, d: 0.13, name: "CUISSES", sub: "Thigh plates ×2" },
    greave:   { x: 0.37, y: 0.690, w: 0.26, h: 0.210, d: 0.12, name: "GREAVES", sub: "Shin guards ×2" },
    sabaton:  { x: 0.37, y: 0.905, w: 0.26, h: 0.095, d: 0.14, name: "SABATONS", sub: "Foot armor ×2" }
  };

  // Per-chassis adjustments (dx, dy, dw, dh multipliers + depth scale)
  var ADJ = {
    vx19:    {},
    hooded:  { helm: { h: 1.35, y: -0.02 }, pauldron: { w: 0.85 }, cuirass: { w: 0.88 } },
    vx19w:   {},
    wraith:  { helm: { h: 1.25, w: 1.15 }, pauldron: { y: 0.02, h: 1.2 }, cuirass: { d: 1.2 } },
    ronin:   { helm: { w: 0.9 }, pauldron: { h: 0.9 }, gauntlet: { w: 0.92 } },
    chrome:  { helm: { h: 0.92 }, pauldron: { d: 1.1 }, greave: { h: 1.05 } }
  };

  // Material properties per piece type (thickness mm, density factor)
  var PROPS = {
    helm:     { thick: 8,  dense: 1.2, artic: "Fixed" },
    gorget:   { thick: 5,  dense: 1.0, artic: "3-axis" },
    pauldron: { thick: 10, dense: 1.1, artic: "Ball joint" },
    cuirass:  { thick: 12, dense: 1.3, artic: "Segmented" },
    fauld:    { thick: 6,  dense: 0.9, artic: "5 lame" },
    gauntlet: { thick: 7,  dense: 1.0, artic: "Full" },
    cuisse:   { thick: 9,  dense: 1.1, artic: "Sliding" },
    greave:   { thick: 9,  dense: 1.1, artic: "Hinged" },
    sabaton:  { thick: 11, dense: 1.2, artic: "Toed" }
  };

  var FIGURE_MM = 1900;

  function build() {
    var atlas = {};
    ["vx19","hooded","vx19w","wraith","ronin","chrome"].forEach(function (ch) {
      atlas[ch] = {};
      Object.keys(T).forEach(function (pk) {
        var t = T[pk], a = (ADJ[ch] && ADJ[ch][pk]) || {};
        var p = {
          x: t.x * (a.x || 1) + (a.dx || 0),
          y: Math.max(0, t.y + (a.y || 0)),
          w: t.w * (a.w || 1),
          h: t.h * (a.h || 1),
          d: t.d * (a.d || 1),
          name: t.name, sub: t.sub
        };
        // computed measurements
        p.wmm = Math.round(p.w * 620);   // figure width ~620mm
        p.hmm = Math.round(p.h * FIGURE_MM);
        p.dmm = Math.round(p.d * 620);
        var pr = PROPS[pk];
        p.thick = pr.thick; p.artic = pr.artic;
        // estimated mass: volume approx × density
        p.mass = Math.round(p.wmm * p.hmm * pr.thick / 1e6 * pr.dense * 7.8 * 10) / 10;
        p.cover = Math.round(p.w * p.h * 1000) / 10; // % of silhouette
        atlas[ch][pk] = p;
      });
    });
    return atlas;
  }

  return { pieces: build(), order: Object.keys(T), figureMM: FIGURE_MM };
})();
