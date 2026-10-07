/* HEAVY IS THE CROWN — Cape system.
   Procedural draped cape with fabric material treatments.
   Renders behind the figure, flows with subtle animation. */
(function () {
  "use strict";

  var FABRICS = {
    wool:   { name: "HEAVY WOOL",   base: "#2a2320", hi: "#4a3f36", sheen: 0.15, rough: 0.9 },
    velvet: { name: "ROYAL VELVET", base: "#3d0f1e", hi: "#7a1f3a", sheen: 0.45, rough: 0.5 },
    leather:{ name: "WORN LEATHER", base: "#4a2f1a", hi: "#7a5230", sheen: 0.3,  rough: 0.7 },
    silk:   { name: "SHADOW SILK",  base: "#0d0d12", hi: "#2a2a35", sheen: 0.7,  rough: 0.3 },
    mail:   { name: "CHAINMAIL",    base: "#3a3f45", hi: "#6a7078", sheen: 0.6,  rough: 0.4 },
    canvas: { name: "BATTLE CANVAS",base: "#5a5240", hi: "#8a8068", sheen: 0.2,  rough: 0.85 }
  };

  var state = { on: false, fabric: "velvet", sway: 0 };

  // Draw procedural cape: draped from shoulders, flowing down
  // ctx: canvas context, rect: {x,y,w,h} figure rect, t: time for sway
  function drawCape(ctx, rect, t) {
    if (!state.on) return;
    var f = FABRICS[state.fabric];
    var w = rect.w, h = rect.h, x = rect.x, y = rect.y;

    // Cape shape: from shoulders (y+0.12h) flowing to (y+0.95h), wider at bottom
    var topY = y + h * 0.14, botY = y + h * 0.96;
    var topW = w * 0.42, botW = w * 0.72;
    var sway = Math.sin(t * 0.0012) * w * 0.02 * (1 + state.sway);

    ctx.save();
    // main drape
    var g = ctx.createLinearGradient(x, topY, x, botY);
    g.addColorStop(0, f.hi);
    g.addColorStop(0.4, f.base);
    g.addColorStop(1, shade(f.base, -25));
    ctx.fillStyle = g;
    ctx.beginPath();
    var cx = x + w / 2;
    ctx.moveTo(cx - topW / 2, topY);
    // left edge with folds
    for (var i = 0; i <= 8; i++) {
      var yy = topY + (botY - topY) * i / 8;
      var ww = topW / 2 + (botW / 2 - topW / 2) * (i / 8);
      var fold = Math.sin(i * 2.1 + t * 0.0008) * w * 0.015 * (i / 8);
      var sx = sway * (i / 8);
      ctx.lineTo(cx - ww + fold + sx, yy);
    }
    // bottom edge (wavy hem)
    for (var j = 8; j >= 0; j--) {
      var yy2 = topY + (botY - topY) * j / 8;
      var ww2 = topW / 2 + (botW / 2 - topW / 2) * (j / 8);
      var hem = Math.sin(j * 3.3) * h * 0.012;
      var sx2 = sway * (j / 8);
      if (j < 8) ctx.lineTo(cx + ww2 + hem + sx2, yy2 + hem);
    }
    // right edge back up
    for (var k = 8; k >= 0; k--) {
      var yy3 = topY + (botY - topY) * k / 8;
      var ww3 = topW / 2 + (botW / 2 - topW / 2) * (k / 8);
      var fold3 = Math.sin(k * 2.1 + 1.5 + t * 0.0008) * w * 0.015 * (k / 8);
      var sx3 = sway * (k / 8);
      ctx.lineTo(cx + ww3 + fold3 + sx3, yy3);
    }
    ctx.closePath();
    ctx.fill();

    // fold shadows (vertical darker streaks)
    ctx.globalAlpha = 0.35 * f.rough;
    for (var s = 0; s < 5; s++) {
      var fx = cx - botW / 2 + (botW * s / 4);
      var fg = ctx.createLinearGradient(fx - w*0.03, 0, fx + w*0.03, 0);
      fg.addColorStop(0, "rgba(0,0,0,0)");
      fg.addColorStop(0.5, "rgba(0,0,0,0.55)");
      fg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = fg;
      ctx.fillRect(fx - w*0.03, topY, w*0.06, botY - topY);
    }
    ctx.globalAlpha = 1;

    // sheen highlight
    if (f.sheen > 0.1) {
      ctx.globalAlpha = f.sheen * 0.5;
      var sg = ctx.createLinearGradient(cx - topW/2, 0, cx - topW/4, 0);
      sg.addColorStop(0, "rgba(255,255,255,0)");
      sg.addColorStop(0.5, "rgba(255,255,255,0.35)");
      sg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.moveTo(cx - topW/2, topY);
      ctx.lineTo(cx - topW/4, topY);
      ctx.lineTo(cx - botW/3, botY);
      ctx.lineTo(cx - botW/2, botY);
      ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
    }

    // clasp at neck
    ctx.fillStyle = "#c8a84a";
    ctx.beginPath();
    ctx.arc(cx - topW*0.28, topY + h*0.02, w*0.022, 0, Math.PI*2);
    ctx.arc(cx + topW*0.28, topY + h*0.02, w*0.022, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }

  function shade(hex, amt) {
    var n = parseInt(hex.slice(1), 16);
    var r = Math.max(0, Math.min(255, (n >> 16) + amt));
    var g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
    var b = Math.max(0, Math.min(255, (n & 255) + amt));
    return "rgb(" + r + "," + g + "," + b + ")";
  }

  window.WB_CAPE = {
    FABRICS: FABRICS, state: state, drawCape: drawCape,
    toggle: function () { state.on = !state.on; return state.on; },
    setFabric: function (f) { if (FABRICS[f]) state.fabric = f; }
  };
})();
