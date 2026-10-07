/* HEAVY IS THE CROWN — interactive 3D hologram (raw WebGL, no dependencies).
   Pointer-tracked rotation, scanlines, luminance-keyed translucency,
   sweep band and flicker for the hologram effect. */
(function () {
  "use strict";
  var canvas = document.getElementById("holoCanvas");
  if (!canvas || !window.HOLO_IMG) return;
  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 2D fallback if WebGL is unavailable.
  function fallback2D() {
    try {
      var c2 = canvas.getContext("2d");
      var img = new Image();
      img.onload = function () {
        var w = canvas.width = canvas.clientWidth || 600;
        var h = canvas.height = canvas.clientHeight || 800;
        var s = Math.min(w / img.width, h / img.height);
        var dw = img.width * s, dh = img.height * s;
        c2.clearRect(0, 0, w, h);
        c2.globalAlpha = 0.92;
        c2.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
      };
      img.src = window.HOLO_IMG;
    } catch (e) { /* leave blank */ }
  }

  var gl = canvas.getContext("webgl", { alpha: true, antialias: true }) ||
           canvas.getContext("experimental-webgl", { alpha: true });
  if (!gl) { fallback2D(); return; }

  var VS =
    "attribute vec2 aPos;\n" +
    "attribute vec2 aUv;\n" +
    "uniform mat4 uP;\n" +
    "uniform mat4 uMV;\n" +
    "varying vec2 vUv;\n" +
    "uniform float uTime;\n" +
    "uniform float uWobble;\n" +
    "uniform float uStill;\n" +
    "void main(){\n" +
    "  vUv = aUv;\n" +
    "  float w = sin(aPos.y*18.0 + uTime*2.6) * uWobble * 0.012 * (1.0-uStill);\n" +
    "  gl_Position = uP * uMV * vec4(aPos.x + w, aPos.y, 0.0, 1.0);\n" +
    "}";
  var FS =
    "precision highp float;\n" +
    "varying vec2 vUv;\n" +
    "uniform sampler2D uTex;\n" +
    "uniform float uTime;\n" +
    "uniform float uStill;\n" +
    "uniform vec3 uTint;\n" +
    "uniform float uTintMix;\n" +
    "uniform float uGlow;\n" +
    "uniform float uScanSharp;\n" +
    "uniform float uAlphaMul;\n" +
    "void main(){\n" +
    "  vec4 tex = texture2D(uTex, vUv);\n" +
    "  float lum = dot(tex.rgb, vec3(0.299, 0.587, 0.114));\n" +
    "  float alpha = smoothstep(0.035, 0.24, lum);\n" +           // key out the dark void
    "  float t = uTime * (1.0 - uStill);\n" +
    "  float bandPos = fract(t * 0.07);\n" +
    "  float band = smoothstep(0.10, 0.0, abs(vUv.y - bandPos)) * (1.0 - uStill);\n" +
    "  float flick = 0.93 + 0.07 * sin(t * 12.0) * sin(t * 7.1 + 1.7);\n" +
    "  vec3 baseTint = mix(vec3(0.82, 1.06, 1.12), uTint * 1.35, uTintMix);\n" +
    "  vec3 col = tex.rgb * baseTint;\n" +
    "  col += vec3(0.10, 0.30, 0.32) * band;\n" +
    "  float rim = alpha * (1.0 - alpha) * 4.0;\n" +               // shell edge of keyed mask
    "  col += vec3(0.35, 0.9, 1.0) * rim * uGlow * 0.55;\n" +
    "  float scan = mix(0.90 + 0.10 * sin(vUv.y * 820.0 + t * 2.2),\n" +
    "                   0.72 + 0.28 * sin(vUv.y * 820.0 + t * 2.2), uScanSharp);\n" +
    "  float a = alpha * mix(scan, 1.0, uStill * 0.5) * mix(flick, 1.0, uStill) * 0.92 * uAlphaMul;\n" +
    "  if (a < 0.012) discard;\n" +
    "  gl_FragColor = vec4(col, a);\n" +
    "}";

  function sh(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
    return s;
  }
  var vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) { fallback2D(); return; }
  var pr = gl.createProgram();
  gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { fallback2D(); return; }
  gl.useProgram(pr);

  var aPos = gl.getAttribLocation(pr, "aPos");
  var aUv = gl.getAttribLocation(pr, "aUv");
  var uP = gl.getUniformLocation(pr, "uP");
  var uMV = gl.getUniformLocation(pr, "uMV");
  var uTex = gl.getUniformLocation(pr, "uTex");
  var uTime = gl.getUniformLocation(pr, "uTime");
  var uStill = gl.getUniformLocation(pr, "uStill");
  var uTint = gl.getUniformLocation(pr, "uTint");
  var uTintMix = gl.getUniformLocation(pr, "uTintMix");
  var uGlow = gl.getUniformLocation(pr, "uGlow");
  var uScanSharp = gl.getUniformLocation(pr, "uScanSharp");
  var uAlphaMul = gl.getUniformLocation(pr, "uAlphaMul");
  var uWobble = gl.getUniformLocation(pr, "uWobble");
  var PROF = window.HOLO_PROFILE || {tint_rgb:[0.6,0.78,0.83],tint_mix:0,
    edge_glow:0.5,scan_sharpness:0.7,translucency:0.92,wobble:0.1};

  // Full quad; aspect-corrected in JS by scaling x.
  var quad = new Float32Array([-1, -1, 0, 0,  1, -1, 1, 0,  -1, 1, 0, 1,  1, 1, 1, 1]);
  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(aUv);
  gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 16, 8);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  // Minimal mat4 helpers.
  function perspective(fovy, aspect, near, far) {
    var f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    return [f / aspect, 0, 0, 0,  0, f, 0, 0,
            0, 0, (far + near) * nf, -1,  0, 0, 2 * far * near * nf, 0];
  }
  function multiply(a, b) {
    var o = new Array(16);
    for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++) {
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] +
                     a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
    return o;
  }
  function rotX(a) {
    var c = Math.cos(a), s = Math.sin(a);
    return [1, 0, 0, 0,  0, c, s, 0,  0, -s, c, 0,  0, 0, 0, 1];
  }
  function rotY(a) {
    var c = Math.cos(a), s = Math.sin(a);
    return [c, 0, -s, 0,  0, 1, 0, 0,  s, 0, c, 0,  0, 0, 0, 1];
  }
  function translate(x, y, z) {
    return [1, 0, 0, 0,  0, 1, 0, 0,  0, 0, 1, 0,  x, y, z, 1];
  }
  function scaleM(x, y) {
    return [x, 0, 0, 0,  0, y, 0, 0,  0, 0, 1, 0,  0, 0, 0, 1];
  }

  var tex = gl.createTexture();
  var texReady = false, texAspect = 0.562;
  var img = new Image();
  img.onload = function () {
    texAspect = img.width / img.height;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    texReady = true;
    if (reduceMotion) drawFrame(0);
  };
  img.src = window.HOLO_IMG;

  function fit() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = canvas.clientWidth || 300, h = canvas.clientHeight || 500;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  window.addEventListener("resize", fit);

  // Pointer-tracked tilt.
  var tRX = 0, tRY = 0, cRX = 0, cRY = 0, lastTouch = 0;
  function point(nx, ny) {
    tRY = nx * 0.55; tRX = -ny * 0.38;
    lastTouch = performance.now();
  }
  canvas.addEventListener("pointermove", function (e) {
    var r = canvas.getBoundingClientRect();
    point((e.clientX - r.left) / r.width - 0.5, (e.clientY - r.top) / r.height - 0.5);
  });
  canvas.addEventListener("pointerleave", function () { tRX = 0; tRY = 0; });
  canvas.addEventListener("touchmove", function (e) {
    var t = e.touches[0], r = canvas.getBoundingClientRect();
    point((t.clientX - r.left) / r.width - 0.5, (t.clientY - r.top) / r.height - 0.5);
  }, { passive: true });

  function drawFrame(time) {
    if (!texReady) return;
    var cw = canvas.width, ch = canvas.height;
    if (!cw || !ch) return;
    var aspect = cw / ch;
    // idle sway when untouched for a while
    if (!reduceMotion && performance.now() - lastTouch > 3500) {
      tRY = Math.sin(time * 0.00035) * 0.14;
      tRX = Math.cos(time * 0.00027) * 0.08;
    } else if (reduceMotion) { tRX = 0; tRY = 0; }
    cRX += (tRX - cRX) * 0.07; cRY += (tRY - cRY) * 0.07;

    var P = perspective(0.7, aspect, 0.1, 10);
    // contain-fit scale, with a small margin so the hat and platform are never cropped
    var sx = 1, sy = 1, fitMargin = 0.92;
    if (aspect > texAspect) sx = texAspect / aspect * fitMargin;
    else sy = aspect / texAspect * fitMargin;
    var MV = multiply(translate(0, 0, -2.35),
             multiply(rotX(cRX), multiply(rotY(cRY), scaleM(sx, sy))));
    gl.uniformMatrix4fv(uP, false, new Float32Array(P));
    gl.uniformMatrix4fv(uMV, false, new Float32Array(MV));
    gl.uniform1i(uTex, 0);
    gl.uniform1f(uTime, time / 1000);
    gl.uniform1f(uStill, reduceMotion ? 1 : 0);
    gl.uniform3f(uTint, PROF.tint_rgb[0], PROF.tint_rgb[1], PROF.tint_rgb[2]);
    gl.uniform1f(uTintMix, PROF.tint_mix);
    gl.uniform1f(uGlow, PROF.edge_glow);
    gl.uniform1f(uScanSharp, PROF.scan_sharpness);
    gl.uniform1f(uAlphaMul, PROF.translucency);
    gl.uniform1f(uWobble, PROF.wobble);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  fit();
  if (reduceMotion) {
    // single static frame once the texture arrives
  } else {
    (function loop(t) { drawFrame(t || 0); requestAnimationFrame(loop); })(0);
  }
  if (window.heavyPulse) { try { window.heavyPulse(8); } catch (e) {} }
})();
