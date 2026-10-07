/* HEAVY IS THE CROWN — Workbench engine.
   Blueprint → hyper-real materialization pipeline.
   Chassis + material + detail → rendered character. */
(function () {
  "use strict";
  var canvas = document.getElementById("wbCanvas");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var state = {
    chassis: "vx19",
    material: "onyx",
    detail: 0.7,    // edge definition
    polish: 0.6,    // surface smoothness
    glow: 0.4,      // rim light
    materialize: 0  // 0 = blueprint, 1 = hyper-real
  };

  var chassisImgs = {}, chassisLoaded = {};
  var edgeMaps = {};

  ["vx19", "hooded", "vx19w"].forEach(function (k) {
    var img = new Image();
    img.onload = function () {
      chassisLoaded[k] = true;
      edgeMaps[k] = makeEdgeMap(img);
      if (k === state.chassis) draw();
    };
    img.src = (window.WB_CHASSIS || {})[k] || "";
    chassisImgs[k] = img;
  });

  // Sobel edge detection -> blueprint line art
  function makeEdgeMap(img) {
    var c = document.createElement("canvas");
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    var x = c.getContext("2d");
    x.drawImage(img, 0, 0);
    var d = x.getImageData(0, 0, c.width, c.height);
    var p = d.data, w = c.width, h = c.height;
    var out = x.createImageData(w, h), o = out.data;
    function lum(i) { return (p[i] * 0.299 + p[i+1] * 0.587 + p[i+2] * 0.114) * (p[i+3] / 255); }
    for (var y = 1; y < h - 1; y++) {
      for (var xx = 1; xx < w - 1; xx++) {
        var i = (y * w + xx) * 4;
        var gx = -lum(i-w*4-4) - 2*lum(i-4) - lum(i+w*4-4) + lum(i-w*4+4) + 2*lum(i+4) + lum(i+w*4+4);
        var gy = -lum(i-w*4-4) - 2*lum(i-w*4) - lum(i-w*4+4) + lum(i+w*4-4) + 2*lum(i+w*4) + lum(i+w*4+4);
        var e = Math.min(255, Math.sqrt(gx*gx + gy*gy) * 1.4);
        o[i] = 140; o[i+1] = 210; o[i+2] = 255; o[i+3] = e;
      }
    }
    x.putImageData(out, 0, 0);
    return c;
  }

  var MATERIALS = {
    onyx:  { filter: "contrast(1.12) brightness(0.94) sepia(0.25)", glow: "#d4a843" },
    carbon:{ filter: "contrast(1.25) brightness(0.88) saturate(0.4)", glow: "#8a9bb0" },
    steel: { filter: "contrast(1.08) brightness(1.02) sepia(0.1) hue-rotate(-15deg)", glow: "#a8c8e0" },
    ghost: { filter: "contrast(0.95) brightness(1.12) saturate(0.7)", glow: "#c8f0e8" }
  };

  function fit() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var r = canvas.getBoundingClientRect();
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
  }
  window.addEventListener("resize", function () { fit(); draw(); });

  function drawBlueprint(w, h, img, edge) {
    // blueprint background
    ctx.fillStyle = "#0e2a4a";
    ctx.fillRect(0, 0, w, h);
    // grid
    ctx.strokeStyle = "rgba(140,210,255,0.10)";
    ctx.lineWidth = 1;
    var gs = 32;
    ctx.beginPath();
    for (var x = 0; x < w; x += gs) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    for (var y = 0; y < h; y += gs) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();
    // edge lines
    if (edge) {
      var s = Math.min(w / img.naturalWidth, h / img.naturalHeight) * 0.82;
      var dw = img.naturalWidth * s, dh = img.naturalHeight * s;
      ctx.globalAlpha = 0.55 + 0.45 * state.detail;
      ctx.drawImage(edge, (w - dw) / 2, (h - dh) / 2, dw, dh);
      ctx.globalAlpha = 1;
    }
    // technical annotations
    ctx.fillStyle = "rgba(140,210,255,0.75)";
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillText("FIG. 01 — CHASSIS " + state.chassis.toUpperCase(), 18, 28);
    ctx.fillText("SCALE 1:1    SHEET 01/01", 18, h - 18);
    ctx.fillText("MATERIAL: " + state.material.toUpperCase(), w - 180, 28);
    // dimension lines
    ctx.strokeStyle = "rgba(140,210,255,0.4)";
    ctx.beginPath();
    ctx.moveTo(18, 44); ctx.lineTo(120, 44);
    ctx.moveTo(18, 40); ctx.lineTo(18, 48); ctx.moveTo(120, 40); ctx.lineTo(120, 48);
    ctx.stroke();
  }

  function drawHyperreal(w, h, img) {
    // dark studio background
    var bg = ctx.createRadialGradient(w/2, h*0.35, 10, w/2, h/2, Math.max(w,h)*0.7);
    bg.addColorStop(0, "#1a1d22");
    bg.addColorStop(1, "#070708");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    var mat = MATERIALS[state.material];
    var s = Math.min(w / img.naturalWidth, h / img.naturalHeight) * 0.88;
    var dw = img.naturalWidth * s, dh = img.naturalHeight * s;
    var dx = (w - dw) / 2, dy = (h - dh) / 2;

    // rim glow
    if (state.glow > 0.01) {
      ctx.save();
      ctx.globalAlpha = state.glow * 0.5;
      ctx.filter = "blur(" + Math.round(s * 18) + "px)";
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();
    }
    // hero with material grade
    ctx.save();
    ctx.filter = mat.filter + " saturate(" + (0.9 + state.polish * 0.3) + ")";
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();
    // sharpening pass via overlay
    if (state.detail > 0.5) {
      ctx.save();
      ctx.globalAlpha = (state.detail - 0.5) * 0.9;
      ctx.filter = "contrast(1.6)";
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();
    }
  }

  function draw() {
    var w = canvas.width, h = canvas.height;
    var img = chassisImgs[state.chassis];
    if (!chassisLoaded[state.chassis]) return;
    var m = state.materialize;
    if (m < 0.02) {
      drawBlueprint(w, h, img, edgeMaps[state.chassis]);
    } else if (m > 0.98) {
      drawHyperreal(w, h, img);
    } else {
      // crossfade: render both to offscreen, blend
      drawBlueprint(w, h, img, edgeMaps[state.chassis]);
      var bp = ctx.getImageData(0, 0, w, h);
      drawHyperreal(w, h, img);
      var hr = ctx.getImageData(0, 0, w, h);
      var d1 = bp.data, d2 = hr.data;
      for (var i = 0; i < d1.length; i += 4) {
        d1[i]   = d1[i]   + (d2[i]   - d1[i])   * m;
        d1[i+1] = d1[i+1] + (d2[i+1] - d1[i+1]) * m;
        d1[i+2] = d1[i+2] + (d2[i+2] - d1[i+2]) * m;
        d1[i+3] = 255;
      }
      ctx.putImageData(bp, 0, 0);
    }
    updateReadout();
  }

  function updateReadout() {
    var el = document.getElementById("wbReadout");
    if (el) {
      var pct = Math.round(state.materialize * 100);
      el.textContent = pct < 50 ? "BLUEPRINT — " + pct + "%" : "HYPER-REAL — " + pct + "%";
    }
  }

  // public API
  window.WB = {
    state: state,
    set: function (k, v) { state[k] = v; draw(); },
    draw: draw,
    export: function () {
      var a = document.createElement("a");
      a.download = "workbench-" + state.chassis + "-" + state.material + ".png";
      a.href = canvas.toDataURL("image/png");
      a.click();
    }
  };

  fit();
})();
