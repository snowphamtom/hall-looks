/* HEAVY IS THE CROWN — Putty sculpt engine.
   Mesh-warp image deformation: drag control points to mold armor like clay.
   Triangle-based affine warp for smooth deformation. */
(function () {
  "use strict";

  // Sculpt state per chassis+piece: grid of offsets
  var sculpts = {};

  function key(chassis, piece) { return chassis + ":" + piece; }

  function getGrid(chassis, piece, cols, rows) {
    var k = key(chassis, piece);
    if (!sculpts[k]) {
      sculpts[k] = { cols: cols || 6, rows: rows || 6, pts: {} };
    }
    return sculpts[k];
  }

  function setOffset(chassis, piece, ci, ri, dx, dy) {
    var g = getGrid(chassis, piece);
    g.pts[ci + "," + ri] = [dx, dy];
  }

  function getOffset(chassis, piece, ci, ri) {
    var g = sculpts[key(chassis, piece)];
    if (!g) return [0, 0];
    return g.pts[ci + "," + ri] || [0, 0];
  }

  function reset(chassis, piece) {
    delete sculpts[key(chassis, piece)];
  }

  function resetAll(chassis) {
    Object.keys(sculpts).forEach(function (k) {
      if (k.indexOf(chassis + ":") === 0) delete sculpts[k];
    });
  }

  function hasSculpt(chassis, piece) {
    var g = sculpts[key(chassis, piece)];
    return g && Object.keys(g.pts).length > 0;
  }

  // Draw triangle of src image mapped to dst triangle (robust version)
  function drawTriangle(ctx, img, sx0, sy0, sx1, sy1, sx2, sy2, dx0, dy0, dx1, dy1, dx2, dy2) {
    // Compute affine: [a c e; b d f] mapping src->dst
    // Solve via matrix inverse
    var m00 = sx1 - sx0, m01 = sx2 - sx0;
    var m10 = sy1 - sy0, m11 = sy2 - sy0;
    var det = m00 * m11 - m01 * m10;
    if (Math.abs(det) < 1e-8) return;
    var inv00 = m11 / det, inv01 = -m01 / det;
    var inv10 = -m10 / det, inv11 = m00 / det;
    // dst deltas
    var d0x = dx1 - dx0, d0y = dy1 - dy0;
    var d1x = dx2 - dx0, d1y = dy2 - dy0;
    // affine coefficients: x' = a*x + c*y + e, y' = b*x + d*y + f
    var a = d0x * inv00 + d1x * inv10;
    var c = d0x * inv01 + d1x * inv11;
    var e = dx0 - a * sx0 - c * sy0;
    var b = d0y * inv00 + d1y * inv10;
    var d = d0y * inv01 + d1y * inv11;
    var f = dy0 - b * sx0 - d * sy0;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(dx0, dy0);
    ctx.lineTo(dx1, dy1);
    ctx.lineTo(dx2, dy2);
    ctx.closePath();
    ctx.clip();
    ctx.transform(a, b, c, d, e, f);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  }

  // Render sculpted piece: warp the piece region of the image
  // img: full chassis image, pieceRect: {x,y,w,h} in image pixels
  // dstRect: where to draw on canvas, mirror: also mirror offsets horizontally
  function renderSculpted(ctx, img, pieceRect, dstRect, chassis, piece, mirrorH) {
    var g = sculpts[key(chassis, piece)];
    if (!g || Object.keys(g.pts).length === 0) {
      ctx.drawImage(img,
        pieceRect.x, pieceRect.y, pieceRect.w, pieceRect.h,
        dstRect.x, dstRect.y, dstRect.w, dstRect.h);
      return;
    }
    var cols = g.cols, rows = g.rows;
    var sx = pieceRect.w / cols, sy = pieceRect.h / rows;
    var dx = dstRect.w / cols, dy = dstRect.h / rows;

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        // source quad corners
        var s00 = [pieceRect.x + c*sx, pieceRect.y + r*sy];
        var s10 = [pieceRect.x + (c+1)*sx, pieceRect.y + r*sy];
        var s01 = [pieceRect.x + c*sx, pieceRect.y + (r+1)*sy];
        var s11 = [pieceRect.x + (c+1)*sx, pieceRect.y + (r+1)*sy];
        // dest quad corners with offsets
        function off(ci, ri) {
          var o = getOffset(chassis, piece, ci, ri);
          var ox = o[0] * dstRect.w, oy = o[1] * dstRect.h;
          if (mirrorH) ox = -ox;
          return [ox, oy];
        }
        var o00 = off(c, r), o10 = off(c+1, r), o01 = off(c, r+1), o11 = off(c+1, r+1);
        var d00 = [dstRect.x + c*dx + o00[0], dstRect.y + r*dy + o00[1]];
        var d10 = [dstRect.x + (c+1)*dx + o10[0], dstRect.y + r*dy + o10[1]];
        var d01 = [dstRect.x + c*dx + o01[0], dstRect.y + (r+1)*dy + o01[1]];
        var d11 = [dstRect.x + (c+1)*dx + o11[0], dstRect.y + (r+1)*dy + o11[1]];
        // two triangles
        drawTriangle(ctx, img,
          s00[0],s00[1], s10[0],s10[1], s11[0],s11[1],
          d00[0],d00[1], d10[0],d10[1], d11[0],d11[1]);
        drawTriangle(ctx, img,
          s00[0],s00[1], s11[0],s11[1], s01[0],s01[1],
          d00[0],d00[1], d11[0],d11[1], d01[0],d01[1]);
      }
    }
  }

  // Get mirror counterpart piece (for symmetry)
  var MIRROR_PAIRS = {
    pauldron: true, gauntlet: true, cuisse: true, greave: true, sabaton: true
  };

  window.WB_SCULPT = {
    getGrid: getGrid, setOffset: setOffset, getOffset: getOffset,
    reset: reset, resetAll: resetAll, hasSculpt: hasSculpt,
    renderSculpted: renderSculpted, MIRROR_PAIRS: MIRROR_PAIRS,
    // Apply mirrored sculpt from one side to conceptual counterpart
    // (for pieces defined as ×2, the single zone covers both, so mirror = flip offsets)
    mirrorOffsets: function (chassis, piece) {
      var g = sculpts[key(chassis, piece)];
      if (!g) return;
      var mg = getGrid(chassis, piece + "_mir");
      mg.cols = g.cols; mg.rows = g.rows; mg.pts = {};
      Object.keys(g.pts).forEach(function (k) {
        var parts = k.split(",");
        var ci = parseInt(parts[0]), ri = parseInt(parts[1]);
        var mci = g.cols - ci;
        var o = g.pts[k];
        mg.pts[mci + "," + ri] = [-o[0], o[1]];
      });
    }
  };
})();
