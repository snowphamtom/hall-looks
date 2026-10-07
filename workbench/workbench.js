/* HEAVY IS THE CROWN — Workbench engine v2.
   Dual-canvas blueprint → hyper-real materialization.
   Chassis + material + detail → rendered character. */
(function () {
  "use strict";
  var bpCanvas = document.getElementById("wbBlueprint");
  var hrCanvas = document.getElementById("wbHyperreal");
  if (!bpCanvas || !hrCanvas) return;
  var bp = bpCanvas.getContext("2d"), hr = hrCanvas.getContext("2d");
  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var state = {
    chassis: "vx19",
    material: "onyx",
    detail: 0.7,
    polish: 0.6,
    glow: 0.4,
    materialize: 0
  };

  var CHASSIS = ["vx19", "hooded", "vx19w", "wraith", "ronin", "chrome"];
  var chassisImgs = {}, chassisLoaded = {}, edgeMaps = {};

  CHASSIS.forEach(function (k) {
    var img = new Image();
    img.onload = function () {
      chassisLoaded[k] = true;
      edgeMaps[k] = makeEdgeMap(img);
      render();
    };
    img.src = (window.WB_CHASSIS || {})[k] || "";
    chassisImgs[k] = img;
  });

  function makeEdgeMap(img) {
    var c = document.createElement("canvas");
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    var x = c.getContext("2d");
    x.drawImage(img, 0, 0);
    var d = x.getImageData(0, 0, c.width, c.height);
    var p = d.data, w = c.width, h = c.height;
    var out = x.createImageData(w, h), o = out.data;
    function lum(i) { return (p[i]*0.299 + p[i+1]*0.587 + p[i+2]*0.114) * (p[i+3]/255); }
    for (var y = 1; y < h-1; y++) for (var xx = 1; xx < w-1; xx++) {
      var i = (y*w+xx)*4;
      var gx = -lum(i-w*4-4)-2*lum(i-4)-lum(i+w*4-4)+lum(i-w*4+4)+2*lum(i+4)+lum(i+w*4+4);
      var gy = -lum(i-w*4-4)-2*lum(i-w*4)-lum(i-w*4+4)+lum(i+w*4-4)+2*lum(i+w*4)+lum(i+w*4+4);
      var e = Math.min(255, Math.sqrt(gx*gx+gy*gy)*1.5);
      o[i]=150; o[i+1]=215; o[i+2]=255; o[i+3]=e;
    }
    x.putImageData(out, 0, 0);
    return c;
  }

  var MATERIALS = {
    onyx:  { filter: "contrast(1.14) brightness(0.94) sepia(0.28)", glow: "212,168,67",
             brightFilter: "contrast(1.02) brightness(0.98) sepia(0.18)" },
    carbon:{ filter: "contrast(1.28) brightness(0.86) saturate(0.35)", glow: "138,155,176",
             brightFilter: "contrast(1.08) brightness(0.94) saturate(0.5)" },
    steel: { filter: "contrast(1.10) brightness(1.03) sepia(0.08) hue-rotate(-12deg)", glow: "168,200,224",
             brightFilter: "contrast(1.02) brightness(1.0) sepia(0.05)" },
    ghost: { filter: "contrast(0.94) brightness(1.14) saturate(0.65)", glow: "200,240,232",
             brightFilter: "contrast(0.96) brightness(1.04) saturate(0.7)" },
    ember: { filter: "contrast(1.16) brightness(0.96) sepia(0.45) hue-rotate(-18deg)", glow: "255,120,60",
             brightFilter: "contrast(1.04) brightness(0.99) sepia(0.3) hue-rotate(-12deg)" },
    frost: { filter: "contrast(1.12) brightness(1.06) sepia(0.12) hue-rotate(140deg)", glow: "120,220,255",
             brightFilter: "contrast(1.02) brightness(1.02) sepia(0.08) hue-rotate(140deg)" }
  };
  var BRIGHT_CHASSIS = { vx19w: true };

  function fit() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    [bpCanvas, hrCanvas].forEach(function (c) {
      var r = c.parentElement.getBoundingClientRect();
      c.width = Math.round(r.width * dpr);
      c.height = Math.round(r.height * dpr);
    });
  }
  window.addEventListener("resize", function () { fit(); render(); });

  var CALLOUTS = [
    ["HELM", 0.50, 0.08], ["PAULDRON", 0.30, 0.22], ["CUIRASS", 0.50, 0.38],
    ["GAUNTLET", 0.22, 0.55], ["CUISSE", 0.38, 0.68], ["GREAVE", 0.60, 0.85]
  ];

  function renderBlueprint() {
    var w = bpCanvas.width, h = bpCanvas.height;
    var img = chassisImgs[state.chassis];
    bp.fillStyle = "#0d2745";
    bp.fillRect(0, 0, w, h);
    // grid
    bp.strokeStyle = "rgba(150,215,255,0.09)";
    bp.lineWidth = 1;
    var gs = Math.max(24, w / 28);
    bp.beginPath();
    for (var x = 0; x < w; x += gs) { bp.moveTo(x, 0); bp.lineTo(x, h); }
    for (var y = 0; y < h; y += gs) { bp.moveTo(0, y); bp.lineTo(w, y); }
    bp.stroke();
    // major gridlines
    bp.strokeStyle = "rgba(150,215,255,0.16)";
    bp.beginPath();
    for (var x2 = 0; x2 < w; x2 += gs*4) { bp.moveTo(x2, 0); bp.lineTo(x2, h); }
    for (var y2 = 0; y2 < h; y2 += gs*4) { bp.moveTo(0, y2); bp.lineTo(w, y2); }
    bp.stroke();

    if (chassisLoaded[state.chassis]) {
      var s = Math.min(w / img.naturalWidth, h / img.naturalHeight) * 0.80;
      var dw = img.naturalWidth * s, dh = img.naturalHeight * s;
      var dx = (w - dw)/2, dy = (h - dh)/2;
      bp.globalAlpha = 0.5 + 0.5 * state.detail;
      bp.drawImage(edgeMaps[state.chassis], dx, dy, dw, dh);
      bp.globalAlpha = 1;
      // part callouts
      bp.font = Math.max(10, w/90) + "px ui-monospace,monospace";
      bp.fillStyle = "rgba(150,215,255,0.85)";
      bp.strokeStyle = "rgba(150,215,255,0.45)";
      CALLOUTS.forEach(function (c) {
        var px = dx + dw * c[1], py = dy + dh * c[2];
        var lx = px < w/2 ? 24 : w - 24 - bp.measureText(c[0]).width - 8;
        bp.beginPath(); bp.moveTo(px, py); bp.lineTo(lx + (px < w/2 ? -6 : bp.measureText(c[0]).width + 14), py); bp.stroke();
        bp.beginPath(); bp.arc(px, py, 3, 0, Math.PI*2); bp.fill();
        bp.fillText(c[0], lx, py - 6);
      });
    }
    // title block
    bp.fillStyle = "rgba(150,215,255,0.8)";
    bp.font = Math.max(11, w/80) + "px ui-monospace,monospace";
    bp.fillText("FIG. 01 — " + state.chassis.toUpperCase(), 20, 32);
    bp.fillText("SCALE 1:1 · SHEET 01/01", 20, h - 20);
    var mtl = "MATL: " + state.material.toUpperCase();
    bp.fillText(mtl, w - bp.measureText(mtl).width - 20, 32);
  }

  function renderHyperreal() {
    var w = hrCanvas.width, h = hrCanvas.height;
    var img = chassisImgs[state.chassis];
    // studio backdrop
    var bg = hr.createRadialGradient(w/2, h*0.32, 10, w/2, h/2, Math.max(w,h)*0.75);
    bg.addColorStop(0, "#1c2027"); bg.addColorStop(0.6, "#0d0f13"); bg.addColorStop(1, "#060608");
    hr.fillStyle = bg; hr.fillRect(0, 0, w, h);
    if (!chassisLoaded[state.chassis]) return;
    var mat = MATERIALS[state.material];
    var matFilter = BRIGHT_CHASSIS[state.chassis] && mat.brightFilter ? mat.brightFilter : mat.filter;
    var s = Math.min(w / img.naturalWidth, h / img.naturalHeight) * 0.82;
    var dw = img.naturalWidth * s, dh = img.naturalHeight * s;
    var dx = (w - dw)/2, dy = (h - dh)/2;
    // floor reflection
    hr.save();
    hr.globalAlpha = 0.16;
    hr.translate(0, dy*2 + dh*1.94); hr.scale(1, -0.5);
    hr.filter = "blur(" + Math.round(s*4) + "px) brightness(0.7)";
    hr.drawImage(img, dx, dy, dw, dh);
    hr.restore();
    // rim glow
    if (state.glow > 0.01) {
      hr.save();
      hr.globalAlpha = state.glow * 0.55;
      hr.filter = "blur(" + Math.round(s*16) + "px)";
      hr.drawImage(img, dx, dy, dw, dh);
      hr.restore();
      // colored rim tint
      hr.save();
      hr.globalAlpha = state.glow * 0.25;
      hr.filter = "blur(" + Math.round(s*22) + "px)";
      var tint = document.createElement("canvas");
      tint.width = img.naturalWidth; tint.height = img.naturalHeight;
      var tx = tint.getContext("2d");
      tx.fillStyle = "rgb(" + mat.glow + ")"; tx.fillRect(0,0,tint.width,tint.height);
      tx.globalCompositeOperation = "destination-in";
      tx.drawImage(img, 0, 0);
      hr.drawImage(tint, dx, dy, dw, dh);
      hr.restore();
    }
    // hero
    hr.save();
    hr.filter = matFilter + " saturate(" + (0.9 + state.polish*0.35).toFixed(2) + ")";
    hr.drawImage(img, dx, dy, dw, dh);
    hr.restore();
    // micro-contrast for detail
    if (state.detail > 0.45) {
      hr.save();
      hr.globalAlpha = (state.detail - 0.45) * 1.1;
      hr.filter = "contrast(1.7) brightness(1.02)";
      hr.drawImage(img, dx, dy, dw, dh);
      hr.restore();
    }
    // vignette
    var vg = hr.createRadialGradient(w/2, h/2, Math.min(w,h)*0.35, w/2, h/2, Math.max(w,h)*0.72);
    vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,0.42)");
    hr.fillStyle = vg; hr.fillRect(0, 0, w, h);
  }

  function render() {
    renderBlueprint();
    renderHyperreal();
    applyMaterialize();
    var el = document.getElementById("wbReadout");
    if (el) {
      var pct = Math.round(state.materialize * 100);
      el.textContent = (pct < 50 ? "BLUEPRINT — " : "HYPER-REAL — ") + pct + "%";
    }
  }

  function applyMaterialize() {
    var m = state.materialize;
    bpCanvas.style.opacity = (1 - m).toFixed(3);
    hrCanvas.style.opacity = m.toFixed(3);
    // blueprint annotations fade faster for a clean handoff
    bpCanvas.style.filter = m > 0.6 ? "blur(" + ((m-0.6)*14).toFixed(1) + "px)" : "none";
  }

  window.WB = {
    state: state,
    set: function (k, v) {
      var needFull = (k === "chassis" || k === "material" || k === "detail");
      state[k] = v;
      if (k === "materialize") applyMaterialize();
      else render();
      var el = document.getElementById("wbReadout");
      if (el && k === "materialize") {
        var pct = Math.round(v * 100);
        el.textContent = (pct < 50 ? "BLUEPRINT — " : "HYPER-REAL — ") + pct + "%";
      }
    },
    draw: render,
    export: function () {
      // composite at export resolution
      var w = 1200, h = 1600;
      var c = document.createElement("canvas"); c.width = w; c.height = h;
      var x = c.getContext("2d");
      var img = chassisImgs[state.chassis];
      var mat = MATERIALS[state.material];
      var matFilter = BRIGHT_CHASSIS[state.chassis] && mat.brightFilter ? mat.brightFilter : mat.filter;
      var bg = x.createRadialGradient(w/2, h*0.32, 10, w/2, h/2, 1200);
      bg.addColorStop(0, "#1c2027"); bg.addColorStop(1, "#060608");
      x.fillStyle = bg; x.fillRect(0, 0, w, h);
      var s = Math.min(w / img.naturalWidth, h / img.naturalHeight) * 0.86;
      var dw = img.naturalWidth*s, dh = img.naturalHeight*s;
      x.filter = matFilter;
      x.drawImage(img, (w-dw)/2, (h-dh)/2, dw, dh);
      x.filter = "none";
      var vg = x.createRadialGradient(w/2, h/2, 400, w/2, h/2, 1000);
      vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,0.42)");
      x.fillStyle = vg; x.fillRect(0, 0, w, h);
      // watermark
      x.fillStyle = "rgba(255,255,255,0.35)";
      x.font = "22px ui-monospace,monospace";
      x.fillText("HEAVY IS THE CROWN — " + state.chassis.toUpperCase(), 36, h - 36);
      var a = document.createElement("a");
      a.download = "workbench-" + state.chassis + "-" + state.material + ".png";
      a.href = c.toDataURL("image/png");
      a.click();
    }
  };

  fit();
})();
