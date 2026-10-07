/* HEAVY IS THE CROWN — 3D Measurement Grid.
   Perspective grid with X/Y/Z axes, piece bounding boxes,
   dimension lines. CAD-grade measurement overlay. */
(function () {
  "use strict";

  // Project 3D point to 2D (one-point perspective)
  function projector(w, h) {
    var vpx = w / 2, vpy = h * 0.34;  // vanishing point
    var scale = Math.min(w, h) * 1.1;
    return function (x, y, z) {
      // x: -1..1 (width), y: 0..1 (height, 0=bottom), z: 0..1 (depth)
      var depth = 1 + z * 0.9;
      var sx = vpx + (x * scale) / depth;
      var sy = vpy + ((0.5 - y) * scale * 1.35) / depth;
      return [sx, sy];
    };
  }

  function drawGrid(ctx, w, h, alpha) {
    var P = projector(w, h);
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;

    // Floor grid (X-Z plane at y=0)
    ctx.strokeStyle = "rgba(140,210,255,0.28)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var gx = -1; gx <= 1.001; gx += 0.125) {
      var a = P(gx, 0, 0), b = P(gx, 0, 1);
      ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
    }
    for (var gz = 0; gz <= 1.001; gz += 0.125) {
      var c = P(-1, 0, gz), d = P(1, 0, gz);
      ctx.moveTo(c[0], c[1]); ctx.lineTo(d[0], d[1]);
    }
    ctx.stroke();

    // Back wall grid (X-Y plane at z=1)
    ctx.strokeStyle = "rgba(140,210,255,0.14)";
    ctx.beginPath();
    for (var wx = -1; wx <= 1.001; wx += 0.25) {
      var e = P(wx, 0, 1), f = P(wx, 1, 1);
      ctx.moveTo(e[0], e[1]); ctx.lineTo(f[0], f[1]);
    }
    for (var wy = 0; wy <= 1.001; wy += 0.125) {
      var g = P(-1, wy, 1), hh = P(1, wy, 1);
      ctx.moveTo(g[0], g[1]); ctx.lineTo(hh[0], hh[1]);
    }
    ctx.stroke();

    // Axes (CAD colors)
    function axis(x1,y1,z1, x2,y2,z2, color, label) {
      var p1 = P(x1,y1,z1), p2 = P(x2,y2,z2);
      ctx.strokeStyle = color; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(p1[0],p1[1]); ctx.lineTo(p2[0],p2[1]); ctx.stroke();
      // arrowhead
      var ang = Math.atan2(p2[1]-p1[1], p2[0]-p1[0]);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(p2[0], p2[1]);
      ctx.lineTo(p2[0]-12*Math.cos(ang-0.4), p2[1]-12*Math.sin(ang-0.4));
      ctx.lineTo(p2[0]-12*Math.cos(ang+0.4), p2[1]-12*Math.sin(ang+0.4));
      ctx.closePath(); ctx.fill();
      ctx.font = "bold 13px ui-monospace,monospace";
      ctx.fillText(label, p2[0]+8, p2[1]-8);
    }
    axis(-1, 0.02, 0, 1.15, 0.02, 0, "rgba(255,90,90,0.85)", "X");
    axis(-0.95, 0, 0.02, -0.95, 1.05, 0.02, "rgba(110,255,130,0.85)", "Y");
    axis(0.9, 0.02, 0, 0.9, 0.02, 1.05, "rgba(110,160,255,0.85)", "Z");

    // Unit markers on floor (every 0.25 = ~475mm at figure scale)
    ctx.font = "9px ui-monospace,monospace";
    ctx.fillStyle = "rgba(140,210,255,0.4)";
    for (var ux = -1; ux <= 1; ux += 0.5) {
      var up = P(ux, 0, -0.02);
      ctx.fillText(Math.round((ux+1)*310) + "", up[0]-10, up[1]+14);
    }
    ctx.restore();
    return P;
  }

  // Draw a 3D bounding box for a piece
  // box: {x,y,w,h} fractions of figure rect, d = depth fraction
  // figRect: {x,y,w,h} figure position on canvas
  function drawPieceBox(ctx, P, box, figRect, color, showDims) {
    // Convert figure fractions to grid coords
    // Figure occupies x: -0.32..0.32, y: 0.06..0.94, centered
    function fx(f) { return -0.32 + f * 0.64; }
    function fy(f) { return 0.94 - f * 0.88; }  // figure y=0 (top) -> grid y high
    var x0 = fx(box.x), x1 = fx(box.x + box.w);
    var y1 = fy(box.y), y0 = fy(box.y + box.h);  // y0 < y1
    var z0 = 0.42, z1 = 0.42 + box.d * 0.5;

    var corners = [
      P(x0,y0,z0), P(x1,y0,z0), P(x1,y1,z0), P(x0,y1,z0),
      P(x0,y0,z1), P(x1,y0,z1), P(x1,y1,z1), P(x0,y1,z1)
    ];
    ctx.save();
    ctx.strokeStyle = color || "rgba(255,200,90,0.95)";
    ctx.lineWidth = 2;
    // front face
    ctx.beginPath();
    ctx.moveTo(corners[0][0],corners[0][1]);
    for (var i = 1; i < 4; i++) ctx.lineTo(corners[i][0],corners[i][1]);
    ctx.closePath(); ctx.stroke();
    // back face
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    ctx.moveTo(corners[4][0],corners[4][1]);
    for (var j = 5; j < 8; j++) ctx.lineTo(corners[j][0],corners[j][1]);
    ctx.closePath(); ctx.stroke();
    // depth edges
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    for (var k = 0; k < 4; k++) {
      ctx.moveTo(corners[k][0],corners[k][1]);
      ctx.lineTo(corners[k+4][0],corners[k+4][1]);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    if (showDims) {
      ctx.font = "11px ui-monospace,monospace";
      ctx.fillStyle = color || "rgba(255,200,90,0.95)";
      // width dim (bottom edge, offset down)
      var wa = corners[0], wb = corners[1];
      var wmx = (wa[0]+wb[0])/2, wmy = (wa[1]+wb[1])/2 + 18;
      ctx.fillText(showDims.w, wmx - 20, wmy);
      ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(wa[0],wa[1]+6); ctx.lineTo(wa[0],wmy+4);
      ctx.moveTo(wb[0],wb[1]+6); ctx.lineTo(wb[0],wmy+4);
      ctx.moveTo(wa[0],wmy); ctx.lineTo(wb[0],wmy); ctx.stroke();
      // height dim (right edge)
      var ha = corners[1], hb = corners[2];
      var hmx = (ha[0]+hb[0])/2 + 10, hmy = (ha[1]+hb[1])/2;
      ctx.save(); ctx.translate(hmx+8, hmy); ctx.rotate(-Math.PI/2);
      ctx.fillText(showDims.h, -20, 0); ctx.restore();
      // depth dim (top depth edge)
      var da = corners[2], db = corners[6];
      ctx.fillText(showDims.d, (da[0]+db[0])/2 + 6, (da[1]+db[1])/2 - 6);
    }
    ctx.restore();
  }

  window.WB_GRID = { drawGrid: drawGrid, drawPieceBox: drawPieceBox, projector: projector };
})();
