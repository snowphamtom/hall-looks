/* CREATE-PART.js: drop-in replacement for create.js (HEAVY IS THE CROWN /create).
   Same DOM hooks: #steps, #sheet, #copy-sheet. Adds a code-drawn figure panel
   (injected before .sheet-wrap if #create-figure is not in the markup).
   No image files: ancestry card art and the figure are drawn on canvas. */
(function () {
  var ancestry = [
    { id: "elf", say: "elf", name: "Elf", gift: "You notice a path others walk past.", lean: "Eye", line: "Tall, keen-eared, and slow to forget a road.", blurb: "Long memory. Keen ears. A path others miss." },
    { id: "dark-wood", say: "dark wood", name: "Dark wood", gift: "You keep your footing where the light fails.", lean: "Eye", line: "Canopy-born, quiet, and used to very little sky.", blurb: "Canopy-born. Quiet step. Little sky." },
    { id: "stonekin", say: "stonekin", name: "Stonekin", gift: "You can hold a doorway when others give ground.", lean: "Weight", line: "Low, dense, and patient as a wall.", blurb: "Low and dense. Holds a door. Patient." },
    { id: "ashborn", say: "ashborn", name: "Ashborn", gift: "Cold rooms do not slow your hands.", lean: "Nerve", line: "Grey-skinned, with a warmth that stays in the pulse.", blurb: "Warm pulse. Grey skin. Unslowed by cold." },
    { id: "reedfolk", say: "reedfolk", name: "Reedfolk", gift: "You slip through a gap a broader fighter would miss.", lean: "Quickness", line: "Slight, quick, and hard to pin in a crowd.", blurb: "Light frame. Quick hands. Hard to pin." },
    { id: "tideborn", say: "tideborn", name: "Tideborn", gift: "You stay steady when the air goes bad.", lean: "Lore", line: "Salt on the skin and a long, even breath.", blurb: "Long breath. Salt voice. Steady air." },
    { id: "cindermark", say: "cindermark", name: "Cindermark", gift: "You can wake a cold camp without a fuss.", lean: "Presence", line: "Coal-dark hair and a spark that shows when you speak.", blurb: "Spark in the voice. Coal hair. Wakes a camp." },
    { id: "kilnfolk", say: "kilnfolk", name: "Kilnfolk", gift: "You can shape what does not want to move.", lean: "Weight", line: "Heat-taught, with soot in the creases of the hands.", blurb: "Heat-taught. Shapes what resists." },
    { id: "marshglass", say: "marshglass", name: "Marshglass", gift: "You wait until the reflection tells the truth.", lean: "Nerve", line: "Still as water, and slow to speak first.", blurb: "Still water. Waits for the true reflection." },
    { id: "stairborn", say: "stairborn", name: "Stairborn", gift: "You know who stands above and who keeps the watch.", lean: "Presence", line: "Raised on a fortress stair worn smooth by boots.", blurb: "Knows the watch. Knows who stands above." },
    { id: "palebloom", say: "palebloom", name: "Palebloom", gift: "You can keep a long quiet watch.", lean: "Quickness", line: "Pale as blossom, and patient on a long round.", blurb: "Long quiet watch. White blossom." },
    { id: "thornling", say: "thornling", name: "Thornling", gift: "You favor one clean point over a wide swing.", lean: "Eye", line: "Narrow, bright, and hard to get a hand on.", blurb: "Narrow and bright. Favors the point." }
  ];
  var origin = [
    { id: "dark-wood", say: "dark wood", name: "Dark wood", gift: "You learned to move where the light fails.", lean: "Eye", line: "Black-green canopy and very little sky." },
    { id: "salt-reach", say: "salt reach", name: "Salt reach", gift: "You read weather before you read a face.", lean: "Lore", line: "Wind, nets, and a bright hard horizon." },
    { id: "high-kiln", say: "high kiln", name: "High kiln", gift: "You can shape what does not want to move.", lean: "Weight", line: "Brick, heat, and a craft that never quite cools." },
    { id: "glass-marsh", say: "glass marsh", name: "Glass marsh", gift: "You wait until the reflection tells the truth.", lean: "Nerve", line: "Still water and a moon cut into pieces." },
    { id: "iron-stair", say: "iron stair", name: "Iron stair", gift: "You know who stands above and who keeps the watch.", lean: "Presence", line: "A fortress stair worn smooth by boots." },
    { id: "pale-orchard", say: "pale orchard", name: "Pale orchard", gift: "You can keep a long quiet watch.", lean: "Quickness", line: "White blossom, low walls, and a patient round." }
  ];
  var build = [
    { id: "swift", say: "swift", name: "Swift", role: "skirmisher", lean: "Quickness", line: "First to move. Light on the feet." },
    { id: "iron", say: "iron", name: "Iron", role: "warden", lean: "Weight", line: "Holds the line. Slow to yield." },
    { id: "keen", say: "keen", name: "Keen", role: "duelist", lean: "Eye", line: "Reads the opening and spends it once." },
    { id: "broad", say: "broad", name: "Broad", role: "breaker", lean: "Weight", line: "Power over reach. A wide stance." },
    { id: "quiet", say: "quiet", name: "Quiet", role: "shade", lean: "Nerve", line: "Unseen until the moment is already gone." },
    { id: "storm", say: "storm", name: "Storm", role: "vanguard", lean: "Presence", line: "Loud, sudden, and hard to ignore." }
  ];
  var weapon = [
    { id: "thornblade", say: "thornblade", name: "Thornblade", lean: "Eye", line: "A narrow sword that favors the point." },
    { id: "oak-maul", say: "oak maul", name: "Oak maul", lean: "Weight", line: "A short heavy head on a straight haft." },
    { id: "dusk-bow", say: "dusk bow", name: "Dusk bow", lean: "Eye", line: "A long bow meant for the dim hour." },
    { id: "hook-spear", say: "hook spear", name: "Hook spear", lean: "Quickness", line: "Reach first, then a pull." },
    { id: "twin-knives", say: "twin knives", name: "Twin knives", lean: "Quickness", line: "Two short blades for close work." },
    { id: "crown-hammer", say: "crown hammer", name: "Crown hammer", lean: "Weight", line: "A weighted head meant to end a guard." }
  ];
  /* The four looks, used as the armor finish. */
  var finish = [
    { id: "black-chrome", say: "black chrome", name: "Black Chrome", line: "Mirror-black plate with amber at the joints.", base: "#15161a", hi: "#8b8f99", lo: "#050506", trim: "#2a2c31", glow: "#e4a15a", mat: "mirror" },
    { id: "white-samurai", say: "white samurai", name: "White Samurai", line: "White crackle plate, laced in black.", base: "#ece8de", hi: "#ffffff", lo: "#b9b3a6", trim: "#0a0a0b", glow: "#0a0a0b", mat: "crackle" },
    { id: "skull-champion", say: "skull champion", name: "Skull Champion", line: "Flat black plate with weathered bone trim.", base: "#1b1b1c", hi: "#2b2b2c", lo: "#0d0d0e", trim: "#e6dfd2", glow: "#e6dfd2", mat: "matte" },
    { id: "titan-gladiator", say: "titan gladiator", name: "Titan Gladiator", line: "Gunmetal arena plate with an amber chest core.", base: "#5a5e66", hi: "#9aa0a8", lo: "#2c2f35", trim: "#b8b2a6", glow: "#ffaa00", mat: "gunmetal" }
  ];

  /* Ancestry looks: skin, hair, eye, ear type, head width/height, extras. */
  var A = {
    "elf":        { skin: "#e6c6a2", hair: "#e8d58f", eye: "#5fae8a", ear: "long", hw: .86, hh: 1.12, style: "long", bg: "#1a2218" },
    "dark-wood":  { skin: "#6e5a44", hair: "#1f3a24", eye: "#9fd08a", ear: "swept", hw: .9, hh: 1.05, style: "hood", bg: "#0e1810" },
    "stonekin":   { skin: "#8d8984", hair: "#4a4642", eye: "#c9b98f", ear: "round", hw: 1.22, hh: .92, style: "beard", bg: "#1a1918" },
    "ashborn":    { skin: "#9b958f", hair: "#2a2624", eye: "#f06a28", ear: "round", hw: 1, hh: 1, style: "crop", mark: "ember", bg: "#1c1412" },
    "reedfolk":   { skin: "#cdb98c", hair: "#7d8a3c", eye: "#3a2a18", ear: "wide", hw: .8, hh: .95, style: "reeds", bg: "#1b1d12" },
    "tideborn":   { skin: "#7fa8aa", hair: "#1d4f5c", eye: "#d6f6ff", ear: "fin", hw: .96, hh: 1.04, style: "slick", mark: "gills", bg: "#0c1618" },
    "cindermark": { skin: "#c08a6a", hair: "#151313", eye: "#ffb14a", ear: "round", hw: 1, hh: 1, style: "spark", bg: "#1a100c" },
    "kilnfolk":   { skin: "#a35f3c", hair: "#2a1a12", eye: "#f0c14b", ear: "round", hw: 1.08, hh: .98, style: "topknot", mark: "soot", bg: "#1c120c" },
    "marshglass": { skin: "#b8cbc2", hair: "#9fb8b0", eye: "#e8fbff", ear: "none", hw: .94, hh: 1.1, style: "bare", mark: "glass", bg: "#101616" },
    "stairborn":  { skin: "#d0a07a", hair: "#3b2c22", eye: "#4d86f0", ear: "round", hw: 1.1, hh: 1, style: "crop", jaw: true, bg: "#14151a" },
    "palebloom":  { skin: "#f3e8e6", hair: "#f2c6d4", eye: "#b06ae0", ear: "short", hw: .92, hh: 1, style: "petals", bg: "#1a1418" },
    "thornling":  { skin: "#9caf7a", hair: "#3f5a22", eye: "#e2c56a", ear: "sharp", hw: .78, hh: 1.16, style: "thorns", bg: "#121a0e" }
  };
  /* Build proportions: shoulder half-width, waist half-width, height, limb, stance, head scale. */
  var B = {
    swift: { sh: 46, wa: 26, ht: .95, li: 11, st: 30, hd: 1, lean: -0.04 },
    iron:  { sh: 66, wa: 44, ht: .98, li: 17, st: 34, hd: 1, lean: 0 },
    keen:  { sh: 50, wa: 30, ht: 1.02, li: 12, st: 22, hd: 1, lean: 0 },
    broad: { sh: 78, wa: 52, ht: .9, li: 20, st: 50, hd: .95, lean: 0 },
    quiet: { sh: 44, wa: 28, ht: .93, li: 11, st: 18, hd: 1, lean: .05, hood: true },
    storm: { sh: 62, wa: 36, ht: 1.06, li: 15, st: 42, hd: 1.04, lean: -0.02, cape: true }
  };

  var pick = { ancestry: null, origin: null, build: null, weapon: null, rank: null, finish: null };
  var stepsEl = document.getElementById("steps");
  var sheetEl = document.getElementById("sheet");

  function ranks() {
    return (window.LOCKER_RANKS || []).map(function (r) {
      return { id: "rank-" + r.n, say: r.name.toLowerCase(), name: r.name, n: r.n, line: r.line, tint: r.tint };
    });
  }
  var rankList = ranks();

  /* ---------- drawing ---------- */
  function shade(hex, amt) {
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    function c(v) { v = Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt); return Math.max(0, Math.min(255, v)); }
    return "rgb(" + c(r) + "," + c(g) + "," + c(b) + ")";
  }
  function poly(ctx, pts, fill, stroke, lw) {
    ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
    for (var i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1.5; ctx.stroke(); }
  }
  function limb(ctx, x1, y1, x2, y2, w, col) {
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  function plateFill(ctx, f, x0, y0, x1, y1) {
    if (!f) return "#3a342c";
    var g = ctx.createLinearGradient(x0, y0, x1, y1);
    if (f.mat === "mirror") { g.addColorStop(0, f.lo); g.addColorStop(.38, f.hi); g.addColorStop(.46, f.base); g.addColorStop(.8, f.lo); g.addColorStop(1, f.hi); }
    else if (f.mat === "gunmetal") { g.addColorStop(0, f.hi); g.addColorStop(.5, f.base); g.addColorStop(1, f.lo); }
    else if (f.mat === "crackle") { g.addColorStop(0, f.hi); g.addColorStop(1, f.lo); }
    else { g.addColorStop(0, f.base); g.addColorStop(1, f.lo); }
    return g;
  }

  function backdrop(ctx, W, H, o, a) {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#121318"); g.addColorStop(1, "#070708");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    var id = o ? o.id : null, i, x;
    ctx.save();
    if (id === "dark-wood") {
      ctx.fillStyle = "#0f1f14"; ctx.fillRect(0, 0, W, H * .5);
      for (i = 0; i < 9; i++) { x = i * 60 + (i % 2) * 18; poly(ctx, [x, H * .9, x + 34, 60 + (i % 3) * 30, x + 68, H * .9], i % 2 ? "#0b1a10" : "#12271a"); }
    } else if (id === "salt-reach") {
      var s = ctx.createLinearGradient(0, 0, 0, H * .62); s.addColorStop(0, "#1b2a36"); s.addColorStop(1, "#c9d8de");
      ctx.fillStyle = s; ctx.fillRect(0, 0, W, H * .62);
      ctx.fillStyle = "#16303c"; ctx.fillRect(0, H * .62, W, H);
      ctx.strokeStyle = "rgba(214,246,255,.35)"; ctx.lineWidth = 2;
      for (i = 0; i < 6; i++) { ctx.beginPath(); for (x = 0; x <= W; x += 20) ctx.lineTo(x, H * .66 + i * 22 + Math.sin(x / 22 + i) * 4); ctx.stroke(); }
    } else if (id === "high-kiln") {
      ctx.fillStyle = "#2a140c"; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(0,0,0,.5)"; ctx.lineWidth = 2;
      for (var r = 0; r < H; r += 22) { ctx.beginPath(); ctx.moveTo(0, r); ctx.lineTo(W, r); ctx.stroke(); for (x = (r / 22 % 2) * 22; x < W; x += 44) { ctx.beginPath(); ctx.moveTo(x, r); ctx.lineTo(x, r + 22); ctx.stroke(); } }
      var k = ctx.createRadialGradient(W / 2, H * .55, 10, W / 2, H * .55, W * .6); k.addColorStop(0, "rgba(240,154,58,.55)"); k.addColorStop(1, "rgba(240,154,58,0)");
      ctx.fillStyle = k; ctx.fillRect(0, 0, W, H);
    } else if (id === "glass-marsh") {
      ctx.fillStyle = "#0b1316"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#dfe9e6"; ctx.beginPath(); ctx.arc(W * .74, H * .16, 34, 0, 7); ctx.fill();
      ctx.fillStyle = "#13222a"; ctx.fillRect(0, H * .7, W, H);
      ctx.fillStyle = "rgba(223,233,230,.55)";
      for (i = 0; i < 5; i++) ctx.fillRect(W * .74 - 30 + (i % 2) * 12, H * .74 + i * 14, 40 - i * 5, 5);
    } else if (id === "iron-stair") {
      ctx.fillStyle = "#121419"; ctx.fillRect(0, 0, W, H);
      for (i = 0; i < 10; i++) { ctx.fillStyle = i % 2 ? "#1c1f26" : "#23262e"; ctx.fillRect(W - (i + 1) * 48, H * .2 + i * 40, (i + 1) * 48, 40); }
    } else if (id === "pale-orchard") {
      ctx.fillStyle = "#1a1418"; ctx.fillRect(0, 0, W, H);
      for (i = 0; i < 5; i++) {
        x = 30 + i * 105;
        limb(ctx, x, H * .78, x, H * .45, 8, "#3a2a26");
        ctx.fillStyle = "rgba(244,230,236,.75)";
        for (var p = 0; p < 7; p++) { ctx.beginPath(); ctx.arc(x + Math.cos(p) * 30, H * .42 + Math.sin(p * 2) * 18, 16, 0, 7); ctx.fill(); }
      }
      ctx.fillStyle = "#2a2226"; ctx.fillRect(0, H * .78, W, 26);
    } else {
      var v = ctx.createRadialGradient(W / 2, H * .45, 20, W / 2, H * .45, W * .7);
      v.addColorStop(0, a ? shade(a.bg, .12) : "#1a1a1d"); v.addColorStop(1, "#070708");
      ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
    ctx.fillStyle = "rgba(7,7,8,.55)"; ctx.fillRect(0, H * .93, W, H);
  }

  function emblem(ctx, o, x, y, s) {
    /* Origin emblem on a small banner. */
    ctx.save(); ctx.translate(x, y);
    poly(ctx, [-s, -s * 1.2, s, -s * 1.2, s, s * .9, 0, s * 1.5, -s, s * .9], "#101114", "#e4a15a", 2);
    ctx.strokeStyle = "#F4F1E8"; ctx.fillStyle = "#F4F1E8"; ctx.lineWidth = 2;
    var id = o.id;
    if (id === "dark-wood") poly(ctx, [0, -s * .8, s * .6, s * .5, -s * .6, s * .5], "#F4F1E8");
    else if (id === "salt-reach") { ctx.beginPath(); for (var i = -s * .7; i <= s * .7; i += 2) ctx.lineTo(i, Math.sin(i / 4) * 4); ctx.stroke(); }
    else if (id === "high-kiln") { ctx.beginPath(); ctx.moveTo(0, s * .6); ctx.quadraticCurveTo(s * .7, 0, 0, -s * .8); ctx.quadraticCurveTo(-s * .7, 0, 0, s * .6); ctx.fill(); }
    else if (id === "glass-marsh") { ctx.beginPath(); ctx.arc(0, -s * .1, s * .5, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-s * .6, s * .5); ctx.lineTo(s * .6, s * .5); ctx.stroke(); }
    else if (id === "iron-stair") poly(ctx, [-s * .6, s * .6, -s * .6, s * .2, -s * .2, s * .2, -s * .2, -s * .2, s * .2, -s * .2, s * .2, -s * .6, s * .6, -s * .6, s * .6, s * .6], "#F4F1E8");
    else if (id === "pale-orchard") { for (var p = 0; p < 5; p++) { ctx.beginPath(); ctx.arc(Math.cos(p * 1.256) * s * .35, Math.sin(p * 1.256) * s * .35, s * .25, 0, 7); ctx.fill(); } }
    ctx.restore();
  }

  function head(ctx, a, x, y, r, f, b) {
    var hw = r * a.hw, hh = r * a.hh;
    ctx.save();
    /* ears behind head */
    ctx.fillStyle = a.skin; ctx.strokeStyle = shade(a.skin, -.35); ctx.lineWidth = 1.5;
    [-1, 1].forEach(function (s) {
      var ex = x + s * hw * .92, ey = y - hh * .05;
      if (a.ear === "long") poly(ctx, [ex, ey - 6, ex + s * r * 1.05, ey - r * .9, ex, ey + 10], a.skin, shade(a.skin, -.35));
      else if (a.ear === "swept") poly(ctx, [ex, ey - 6, ex + s * r * .95, ey - r * .25, ex, ey + 10], a.skin, shade(a.skin, -.35));
      else if (a.ear === "sharp") poly(ctx, [ex, ey - 4, ex + s * r * .6, ey - r * .6, ex, ey + 8], a.skin, shade(a.skin, -.35));
      else if (a.ear === "short") poly(ctx, [ex, ey - 5, ex + s * r * .4, ey - r * .4, ex, ey + 8], a.skin, shade(a.skin, -.35));
      else if (a.ear === "wide") { ctx.beginPath(); ctx.ellipse(ex + s * 6, ey, r * .38, r * .3, 0, 0, 7); ctx.fill(); ctx.stroke(); }
      else if (a.ear === "fin") poly(ctx, [ex, ey - 10, ex + s * r * .55, ey - r * .4, ex + s * r * .45, ey + r * .1, ex + s * r * .6, ey + r * .35, ex, ey + 12], shade(a.skin, -.15), shade(a.skin, -.4));
      else if (a.ear === "round") { ctx.beginPath(); ctx.ellipse(ex + s * 2, ey, r * .2, r * .26, 0, 0, 7); ctx.fill(); ctx.stroke(); }
    });
    /* head */
    ctx.beginPath();
    if (a.jaw) { ctx.moveTo(x - hw, y - hh * .2); ctx.quadraticCurveTo(x - hw, y - hh * 1.05, x, y - hh * 1.05); ctx.quadraticCurveTo(x + hw, y - hh * 1.05, x + hw, y - hh * .2); ctx.lineTo(x + hw * .8, y + hh * .8); ctx.lineTo(x - hw * .8, y + hh * .8); ctx.closePath(); }
    else if (a.style === "thorns" || a.hh > 1.1) { ctx.moveTo(x, y + hh); ctx.quadraticCurveTo(x - hw * 1.2, y + hh * .2, x - hw * .9, y - hh * .5); ctx.quadraticCurveTo(x, y - hh * 1.3, x + hw * .9, y - hh * .5); ctx.quadraticCurveTo(x + hw * 1.2, y + hh * .2, x, y + hh); }
    else ctx.ellipse(x, y, hw, hh, 0, 0, 7);
    var sk = ctx.createLinearGradient(x - hw, y - hh, x + hw, y + hh);
    sk.addColorStop(0, shade(a.skin, .15)); sk.addColorStop(1, shade(a.skin, -.2));
    ctx.fillStyle = sk; ctx.fill(); ctx.strokeStyle = shade(a.skin, -.45); ctx.stroke();
    if (a.mark === "glass") { ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.beginPath(); ctx.ellipse(x - hw * .35, y - hh * .45, hw * .25, hh * .18, -.5, 0, 7); ctx.fill(); }
    /* eyes */
    var eyY = y - hh * .05;
    ctx.fillStyle = a.eye;
    [-1, 1].forEach(function (s) { ctx.beginPath(); ctx.ellipse(x + s * hw * .38, eyY, r * .13, r * (a.ear === "sharp" || a.ear === "long" ? .07 : .09), s * -.15, 0, 7); ctx.fill(); });
    if (a.eye === "#f06a28" || a.eye === "#ffb14a") { ctx.shadowColor = a.eye; ctx.shadowBlur = 8; ctx.fill(); ctx.shadowBlur = 0; }
    limb(ctx, x - r * .12, y + hh * .5, x + r * .12, y + hh * .5, 2, shade(a.skin, -.45));
    /* marks */
    if (a.mark === "ember") { ctx.fillStyle = "#f06a28"; [-1, 1].forEach(function (s) { ctx.fillRect(x + s * hw * .5 - 2, y + hh * .2, 4, r * .3); }); }
    if (a.mark === "gills") { [-1, 1].forEach(function (s) { for (var i = 0; i < 3; i++) limb(ctx, x + s * hw * .7, y + hh * (.25 + i * .13), x + s * hw * .95, y + hh * (.2 + i * .13), 1.5, shade(a.skin, -.4)); }); }
    if (a.mark === "soot") { ctx.fillStyle = "rgba(20,12,8,.55)"; ctx.beginPath(); ctx.ellipse(x + hw * .45, y + hh * .35, r * .22, r * .12, .4, 0, 7); ctx.fill(); }
    /* hair */
    ctx.fillStyle = a.hair;
    var st = a.style, top = y - hh;
    if (b && b.hood) st = "hood";
    if (st === "long") { ctx.beginPath(); ctx.moveTo(x - hw * 1.05, y + hh * 1.5); ctx.quadraticCurveTo(x - hw * 1.2, top - r * .1, x, top - r * .12); ctx.quadraticCurveTo(x + hw * 1.2, top - r * .1, x + hw * 1.05, y + hh * 1.5); ctx.lineTo(x + hw * .8, y + hh * 1.5); ctx.lineTo(x + hw * .85, y - hh * .35); ctx.lineTo(x - hw * .85, y - hh * .35); ctx.lineTo(x - hw * .8, y + hh * 1.5); ctx.fill(); }
    else if (st === "hood") { ctx.fillStyle = b && b.hood ? "#1e2024" : a.hair; ctx.beginPath(); ctx.moveTo(x - hw * 1.3, y + hh * 1.1); ctx.quadraticCurveTo(x - hw * 1.4, top - r * .4, x, top - r * .5); ctx.quadraticCurveTo(x + hw * 1.4, top - r * .4, x + hw * 1.3, y + hh * 1.1); ctx.lineTo(x + hw * .9, y + hh * .9); ctx.quadraticCurveTo(x + hw, top + r * .1, x, top + r * .05); ctx.quadraticCurveTo(x - hw, top + r * .1, x - hw * .9, y + hh * .9); ctx.fill(); }
    else if (st === "beard") { ctx.beginPath(); ctx.ellipse(x, top + hh * .15, hw * .95, hh * .3, 0, Math.PI, 0); ctx.fill(); ctx.beginPath(); ctx.moveTo(x - hw * .85, y + hh * .15); ctx.quadraticCurveTo(x, y + hh * 2, x + hw * .85, y + hh * .15); ctx.quadraticCurveTo(x, y + hh * .75, x - hw * .85, y + hh * .15); ctx.fill(); }
    else if (st === "crop" || st === "spark") { ctx.beginPath(); ctx.ellipse(x, top + hh * .35, hw * 1.02, hh * .45, 0, Math.PI, 0); ctx.fill(); if (st === "spark") { ctx.fillStyle = "#ffb14a"; for (var i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(x - hw * .7 + i * hw * .28, top + (i % 2) * 4, 2.4, 0, 7); ctx.fill(); } } }
    else if (st === "reeds") { for (var j = -3; j <= 3; j++) limb(ctx, x + j * hw * .2, top + hh * .25, x + j * hw * .35, top - r * (.9 - Math.abs(j) * .12), 4, a.hair); }
    else if (st === "slick") { ctx.beginPath(); ctx.moveTo(x - hw, y); ctx.quadraticCurveTo(x - hw, top - r * .1, x + hw * .2, top - r * .05); ctx.quadraticCurveTo(x + hw * 1.6, top + hh * .3, x + hw * 1.1, y + hh * .5); ctx.lineTo(x + hw * .9, y - hh * .3); ctx.lineTo(x - hw * .9, y - hh * .3); ctx.fill(); }
    else if (st === "topknot") { ctx.beginPath(); ctx.arc(x, top - r * .18, r * .25, 0, 7); ctx.fill(); ctx.fillRect(x - r * .1, top - r * .05, r * .2, r * .15); }
    else if (st === "petals") { for (var q = 0; q < 7; q++) { var ang = Math.PI + q * Math.PI / 6; ctx.beginPath(); ctx.ellipse(x + Math.cos(ang) * hw * .9, y - hh * .25 + Math.sin(ang) * hh * .95, r * .3, r * .17, ang, 0, 7); ctx.fill(); } }
    else if (st === "thorns") { for (var t = -2; t <= 2; t++) poly(ctx, [x + t * hw * .3 - 5, top + hh * .3, x + t * hw * .42, top - r * (.55 - Math.abs(t) * .1), x + t * hw * .3 + 5, top + hh * .3], a.hair); }
    ctx.restore();
  }

  function weaponArt(ctx, w, hx, hy, f, side) {
    var metal = f && f.mat === "mirror" ? "#c8ccd4" : "#d9d6cf", wood = "#6b4a2e";
    ctx.save(); ctx.translate(hx, hy);
    var id = w.id;
    if (id === "thornblade") { ctx.rotate(.35); poly(ctx, [-3, 0, 3, 0, 2, -190, 0, -205, -2, -190], metal, "#555", 1); limb(ctx, -16, 0, 16, 0, 5, "#e4a15a"); limb(ctx, 0, 0, 0, 22, 6, "#2a1a10"); }
    else if (id === "oak-maul") { ctx.rotate(.3); limb(ctx, 0, 30, 0, -130, 9, wood); poly(ctx, [-30, -125, 30, -125, 30, -175, -30, -175], "#7d5a36", "#3a2614", 2); limb(ctx, -30, -150, 30, -150, 3, "#3a2614"); }
    else if (id === "dusk-bow") { ctx.strokeStyle = "#3a2a3e"; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-6, -150); ctx.quadraticCurveTo(52, 0, -6, 150); ctx.stroke(); limb(ctx, -6, -150, -6, 150, 1.2, "#d6cfc2"); ctx.fillStyle = "#e4a15a"; ctx.fillRect(14, -10, 8, 20); }
    else if (id === "hook-spear") { ctx.rotate(.1); limb(ctx, 0, 90, 0, -230, 6, wood); poly(ctx, [-8, -228, 8, -228, 0, -270], metal, "#555", 1); ctx.strokeStyle = metal; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, -222); ctx.quadraticCurveTo(22, -222, 20, -200); ctx.stroke(); }
    else if (id === "twin-knives") { ctx.rotate(side < 0 ? -.5 : .5); poly(ctx, [-4, 0, 4, 0, 1, -60, -2, -66], metal, "#555", 1); limb(ctx, 0, 0, 0, 14, 5, "#2a1a10"); }
    else if (id === "crown-hammer") { ctx.rotate(.3); limb(ctx, 0, 30, 0, -140, 7, "#3a3c42"); poly(ctx, [-34, -130, 34, -130, 34, -168, 22, -168, 22, -182, 11, -170, 0, -188, -11, -170, -22, -182, -22, -168, -34, -168], f ? f.trim : "#b8b2a6", "#222", 2); }
    ctx.restore();
  }

  function rankCrest(ctx, r, x, y, s) {
    if (!r) return;
    ctx.save();
    var col = r.tint || "#e4a15a";
    if (r.n === 24) { var g = ctx.createLinearGradient(x - s, y - s, x + s, y + s); ["#ff8a8a", "#ffe08a", "#8affc1", "#8ad4ff", "#c78aff"].forEach(function (c, i) { g.addColorStop(i / 4, c); }); col = g; }
    ctx.shadowColor = r.tint || "#e4a15a"; ctx.shadowBlur = 10;
    poly(ctx, [x, y - s, x + s * .8, y - s * .4, x + s * .8, y + s * .4, x, y + s, x - s * .8, y + s * .4, x - s * .8, y - s * .4], col, "#070708", 2);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#070708"; ctx.font = "700 " + Math.round(s * .9) + "px Outfit, 'Avenir Next', 'Segoe UI', sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String(r.n), x, y + 1);
    /* chevrons above crest show tier band (1-6 marks) */
    var bands = Math.ceil(r.n / 4);
    for (var i = 0; i < bands; i++) limb(ctx, x - s * .5 + i * (s / Math.max(1, bands - 1 || 1)) * (bands > 1 ? 1 : 0), y - s * 1.45, x - s * .5 + i * (s / Math.max(1, bands - 1 || 1)) * (bands > 1 ? 1 : 0), y - s * 1.25, 3, r.tint || "#e4a15a");
    ctx.restore();
  }

  /* spec: { ancestry, origin, build, weapon, rank, finish } (any may be null). opts.portrait = head-and-shoulders crop. */
  function drawFigure(canvas, spec, opts) {
    opts = opts || {};
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    var W = 480, H = 640;
    var a = A[(spec.ancestry || ancestry[0]).id], b = B[(spec.build || build[2]).id], f = spec.finish;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var cx = 240, ground = 600, total = 470 * b.ht, u = total / 7.2;
    if (opts.portrait) {
      var top0 = ground - total;
      var reg = { x: cx - u * 1.7, y: top0 - u * .55, w: u * 3.4, h: u * 3.4 * canvas.height / canvas.width };
      ctx.fillStyle = a.bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
      var sc = canvas.width / reg.w;
      ctx.setTransform(sc, 0, 0, sc, -reg.x * sc, -reg.y * sc);
    } else {
      ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
      backdrop(ctx, W, H, spec.origin, a);
      if (spec.origin) emblem(ctx, spec.origin, 54, 70, 26);
      /* ground shadow */
      ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.beginPath(); ctx.ellipse(cx, ground + 4, b.st + 60, 12, 0, 0, 7); ctx.fill();
    }
    var top = ground - total, r = u * .48 * b.hd;
    var headY = top + r * a.hh, shY = top + u * 1.35, waY = top + u * 3.1, hipY = top + u * 3.6, knY = top + u * 5.3;
    var plate = plateFill(ctx, f, cx - b.sh, shY, cx + b.sh, hipY);
    var under = f ? shade(f.lo, f.mat === "crackle" ? -.55 : .1) : "#2a2620";
    var skin = a.skin;
    ctx.save(); ctx.translate(cx, 0); ctx.transform(1, 0, b.lean, 1, 0, 0); ctx.translate(-cx, 0);
    /* cape */
    if (b.cape) poly(ctx, [cx - b.sh * .9, shY, cx + b.sh * .9, shY, cx + b.sh * 1.4, ground - 20, cx - b.sh * 1.4, ground - 20], "#5a1418");
    /* legs */
    limb(ctx, cx - b.wa * .5, hipY, cx - b.st, knY, b.li * 1.6, under);
    limb(ctx, cx - b.st, knY, cx - b.st - 4, ground - 8, b.li * 1.4, under);
    limb(ctx, cx + b.wa * .5, hipY, cx + b.st, knY, b.li * 1.6, under);
    limb(ctx, cx + b.st, knY, cx + b.st + 4, ground - 8, b.li * 1.4, under);
    [-1, 1].forEach(function (s) {
      poly(ctx, [cx + s * b.st - b.li, knY - 30, cx + s * b.st + b.li, knY - 30, cx + s * (b.st + 4) + b.li, ground - 18, cx + s * (b.st + 4) - b.li, ground - 18], plate, f ? f.trim : null, 1.5);
      poly(ctx, [cx + s * (b.st + 4) - b.li * 1.2, ground - 18, cx + s * (b.st + 4) + b.li * 1.4 * s + (s < 0 ? 0 : 6), ground - 18, cx + s * (b.st + 4) + s * b.li * 2, ground, cx + s * (b.st + 4) - b.li * 1.2 * s, ground], f ? f.lo : "#1a1612");
    });
    /* back arm (viewer left) */
    var lhx = cx - b.sh - 8, lhy = waY + u * .7;
    limb(ctx, cx - b.sh + 6, shY + 8, lhx, lhy - u * .7, b.li * 1.5, under);
    limb(ctx, lhx, lhy - u * .7, lhx + 4, lhy, b.li * 1.3, plate);
    ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(lhx + 4, lhy + 4, b.li * .8, 0, 7); ctx.fill();
    /* torso */
    poly(ctx, [cx - b.sh, shY, cx + b.sh, shY, cx + b.wa, waY, cx + b.wa * .9, hipY, cx - b.wa * .9, hipY, cx - b.wa, waY], plate, f ? f.trim : "#5a4e3c", 2);
    if (f) {
      /* plate seams and material */
      ctx.strokeStyle = f.trim; ctx.lineWidth = 2;
      for (var i = 1; i < 4; i++) { var yy = shY + (hipY - shY) * i / 4, ww = b.sh - (b.sh - b.wa) * i / 4; ctx.beginPath(); ctx.moveTo(cx - ww * .92, yy); ctx.lineTo(cx + ww * .92, yy); ctx.stroke(); }
      if (f.mat === "crackle") { ctx.strokeStyle = "rgba(10,10,11,.55)"; ctx.lineWidth = 1; [[-.6, .1, -.2, .4, -.35, .7], [.5, .05, .2, .3, .4, .55], [-.1, .6, .25, .8, .1, .95]].forEach(function (c) { ctx.beginPath(); ctx.moveTo(cx + c[0] * b.sh, shY + c[1] * (hipY - shY)); ctx.lineTo(cx + c[2] * b.sh, shY + c[3] * (hipY - shY)); ctx.lineTo(cx + c[4] * b.sh, shY + c[5] * (hipY - shY)); ctx.stroke(); }); }
      if (f.mat === "mirror") { ctx.fillStyle = "rgba(255,255,255,.18)"; poly(ctx, [cx - b.sh * .6, shY + 6, cx - b.sh * .35, shY + 6, cx - b.wa * .5, hipY - 8, cx - b.wa * .75, hipY - 8], "rgba(255,255,255,.2)"); }
      if (f.mat === "gunmetal") { ctx.save(); ctx.shadowColor = f.glow; ctx.shadowBlur = 18; ctx.fillStyle = f.glow; ctx.beginPath(); ctx.arc(cx, shY + (waY - shY) * .45, 9, 0, 7); ctx.fill(); ctx.restore(); }
      if (f.mat === "matte") { ctx.fillStyle = f.trim; [-1, 1].forEach(function (s) { ctx.beginPath(); ctx.arc(cx + s * b.wa * .55, hipY - 10, 4, 0, 7); ctx.fill(); }); }
    } else {
      limb(ctx, cx - b.wa * .9, waY + 10, cx + b.wa * .9, waY + 10, 6, "#6b4a2e");
    }
    /* pauldrons */
    [-1, 1].forEach(function (s) {
      ctx.beginPath(); ctx.ellipse(cx + s * b.sh * .92, shY + 6, b.sh * .36, b.li * 1.5, s * .25, Math.PI, 0);
      ctx.fillStyle = f ? plateFill(ctx, f, cx + s * b.sh - 30, shY - 20, cx + s * b.sh + 30, shY + 20) : "#4a3e30"; ctx.fill();
      ctx.strokeStyle = f ? f.trim : "#2a2218"; ctx.lineWidth = 2; ctx.stroke();
    });
    /* joint glow */
    if (f && (f.mat === "mirror")) { ctx.save(); ctx.shadowColor = f.glow; ctx.shadowBlur = 10; ctx.fillStyle = f.glow; [[cx - b.st, knY], [cx + b.st, knY], [cx - b.sh + 6, shY + 10], [cx + b.sh - 6, shY + 10]].forEach(function (p) { ctx.beginPath(); ctx.arc(p[0], p[1], 4, 0, 7); ctx.fill(); }); ctx.restore(); }
    /* neck + head */
    limb(ctx, cx, shY - 2, cx, headY + r * .6, r * .55, shade(skin, -.12));
    head(ctx, a, cx, headY, r, f, b);
    /* rank crest on the chest */
    rankCrest(ctx, spec.rank, cx, shY + (waY - shY) * (f && f.mat === "gunmetal" ? .95 : .5), opts.portrait ? 0 : 14);
    /* front arm (viewer right) + weapon */
    var rhx = cx + b.sh + 18, rhy = waY + 4;
    limb(ctx, cx + b.sh - 6, shY + 8, cx + b.sh + 12, waY - u * .55, b.li * 1.5, under);
    if (spec.weapon && !opts.portrait) {
      if (spec.weapon.id === "twin-knives") weaponArt(ctx, spec.weapon, lhx + 4, lhy + 4, f, -1);
      weaponArt(ctx, spec.weapon, rhx, rhy, f, 1);
    }
    limb(ctx, cx + b.sh + 12, waY - u * .55, rhx, rhy, b.li * 1.3, plate);
    ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(rhx, rhy, b.li * .85, 0, 7); ctx.fill();
    ctx.restore();
  }

  /* ---------- steps (same structure and classes as create.js) ---------- */
  var groups = {};
  function select(key, opt) {
    pick[key] = opt;
    var row = groups[key];
    if (row) row.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x.dataset.id === (opt && opt.id) ? "true" : "false"); });
  }
  function step(key, title, hint, options) {
    var li = document.createElement("li");
    li.className = "create-step";
    var h = document.createElement("h2");
    h.textContent = title;
    var p = document.createElement("p");
    p.textContent = hint;
    var row = document.createElement("div");
    var grid = key === "ancestry";
    row.className = grid ? "ancestry-grid" : "styles";
    row.setAttribute("role", "group");
    row.setAttribute("aria-label", title);
    groups[key] = row;
    options.forEach(function (opt) {
      var b = document.createElement("button");
      b.type = "button";
      b.dataset.id = opt.id;
      if (grid) {
        var art = document.createElement("canvas");
        art.width = 300; art.height = 420;
        art.setAttribute("aria-hidden", "true");
        drawFigure(art, { ancestry: opt }, { portrait: true });
        b = window.HallCard.make({ canvas: art, name: opt.name, line: opt.blurb, size: "sm" });
        b.dataset.id = opt.id;
      } else {
        b.textContent = opt.name;
      }
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", function () {
        select(key, opt);
        if (window.heavyPulse) window.heavyPulse(12);
        render();
      });
      row.appendChild(b);
    });
    li.append(h, p, row);
    return li;
  }

  function level(name) {
    var n = 0;
    ["ancestry", "origin", "build", "weapon"].forEach(function (k) {
      if (pick[k] && pick[k].lean === name) n += 1;
    });
    if (n >= 2) return "high";
    if (n === 1) return "steady";
    return "light";
  }

  function an(w) { return (/^[aeiou]/i.test(w) ? "an " : "a ") + w; }

  function charName() {
    var el = document.getElementById("create-name");
    return el ? el.value.trim().slice(0, 40) : "";
  }

  function markdown() {
    var a = pick.ancestry, o = pick.origin, b = pick.build, w = pick.weapon, r = pick.rank, f = pick.finish;
    var nm = charName();
    if (!a || !o || !b || !w || !r) {
      var missing = [];
      if (!a) missing.push("ancestry");
      if (!o) missing.push("origin");
      if (!b) missing.push("build");
      if (!w) missing.push("weapon");
      if (!r) missing.push("rank");
      var said = [a, o, b, w, r].filter(Boolean).map(function (x) { return x.say; });
      return [
        "# HEAVY IS THE CROWN",
        "",
        nm ? "Name: " + nm + "\n" : null,
        "Say: " + (said.length ? said.join(", ") : "…"),
        "",
        "Still to tap: " + missing.join(", ") + ".",
        "",
        "The finished sheet is short markdown. Eggshell type. Twenty-four ranks. Only Prism is holographic."
      ].filter(function (x) { return x !== null; }).join("\n");
    }
    var leans = ["Weight", "Quickness", "Eye", "Nerve", "Lore", "Presence"].map(function (name) {
      return "- " + name + ": " + level(name);
    });
    var holo = r.n === 24
      ? "Prism is the only holographic rank."
      : "Only Prism is holographic. This rank is not.";
    return [
      "# HEAVY IS THE CROWN",
      "",
      nm ? "Name: " + nm + "\n" : null,
      "Say: " + [a.say, o.say, b.say, w.say, r.say].join(", "),
      "",
      "## Ancestry",
      "**" + a.name + ".** " + a.line + " " + a.gift,
      "",
      "## Origin",
      "**" + o.name + ".** " + o.line + " " + o.gift,
      "",
      "## Build",
      "**" + b.name + ".** " + b.line + " Fights as a " + b.role + ".",
      "",
      "## Weapon",
      "**" + w.name + ".** " + w.line,
      "",
      f ? "## Finish\n**" + f.name + ".** " + f.line + "\n" : null,
      "## Rank",
      "**" + r.name + "** (" + r.n + " of 24). " + r.line + ". " + holo,
      "",
      "## Leans",
      leans.join("\n"),
      "",
      "## Read",
      (nm ? nm + ": " + an(a.name.toLowerCase()) : an(a.name.toLowerCase()).replace(/^a/, "A")) + " out of the " + o.name.toLowerCase() + ", built " + b.name.toLowerCase() + ", carrying " + an(w.name.toLowerCase()) + (f ? ", in " + f.name + " plate" : "") + ". Standing: " + r.name + ", rank " + r.n + " of 24."
    ].filter(function (x) { return x !== null; }).join("\n");
  }

  function summary() {
    var a = pick.ancestry, o = pick.origin, b = pick.build, w = pick.weapon, r = pick.rank, f = pick.finish;
    var nm = charName() || "Unnamed";
    if (!a && !o && !b && !w && !r && !f) return nm + ". Tap a choice at each step and the figure changes with it.";
    var bits = [];
    bits.push(a ? an(a.name.toLowerCase()) : "an unchosen ancestry");
    if (o) bits.push("out of the " + o.name.toLowerCase());
    var s = nm + ": " + bits.join(" ");
    if (b) s += ", built " + b.name.toLowerCase() + " (" + b.role + ")";
    if (w) s += ", carrying " + an(w.name.toLowerCase());
    if (f) s += ", in " + f.name + " plate";
    s += ".";
    if (r) s += " Rank " + r.n + " of 24, " + r.name + ".";
    return s;
  }

  var figCanvas, sumEl, statusEl;
  function render() {
    sheetEl.textContent = markdown();
    if (figCanvas) {
      drawFigure(figCanvas, pick);
      figCanvas.setAttribute("aria-label", "Character figure. " + summary());
    }
    if (sumEl) sumEl.textContent = summary();
  }

  stepsEl.append(
    step("ancestry", "1. Ancestry", "Six across. Tap a card. Elf and Dark wood are both here. The short line is what you say.", ancestry),
    step("origin", "2. Origin", "Where you learned the world. Dark wood is one of the six.", origin),
    step("build", "3. Build", "How you fight. One short word.", build),
    step("weapon", "4. Weapon", "What you carry into the hall.", weapon),
    step("rank", "5. Rank", "Tie the sheet to the ladder. Twenty-four ranks. Only Prism is holographic.", rankList)
  );

  /* ---------- figure panel ---------- */
  function buildPanel() {
    var panel = document.getElementById("create-figure");
    if (!panel) {
      panel = document.createElement("section");
      panel.id = "create-figure";
      panel.className = "create-figure";
      var anchor = document.querySelector(".sheet-wrap");
      if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(panel, anchor);
      else document.body.appendChild(panel);
    }
    panel.setAttribute("aria-label", "Your character");
    panel.innerHTML =
      "<div class=\"figure-stage\"><canvas id=\"figure-canvas\" width=\"480\" height=\"640\" role=\"img\"></canvas></div>" +
      "<div class=\"figure-side\">" +
      "<div class=\"kicker\">Your character</div>" +
      "<label class=\"figure-label\" for=\"create-name\">Name</label>" +
      "<input id=\"create-name\" class=\"figure-name\" type=\"text\" maxlength=\"40\" autocomplete=\"off\" placeholder=\"Say a name\">" +
      "<p class=\"figure-label\" id=\"finish-label\">Finish</p>" +
      "<div class=\"styles\" role=\"group\" aria-labelledby=\"finish-label\" id=\"finish-row\"></div>" +
      "<p id=\"figure-summary\" class=\"figure-summary\" aria-live=\"polite\"></p>" +
      "<div class=\"figure-actions\">" +
      "<button type=\"button\" class=\"go\" id=\"create-random\" aria-label=\"Randomize every choice\">Randomize</button>" +
      "<button type=\"button\" class=\"go\" id=\"create-save\" aria-label=\"Save this character to the locker on this device\">Save to locker</button>" +
      "<button type=\"button\" class=\"go\" id=\"create-png\" aria-label=\"Download the figure as a PNG\">Download PNG</button>" +
      "</div><p id=\"figure-status\" class=\"figure-status\" role=\"status\"></p></div>";
    figCanvas = panel.querySelector("#figure-canvas");
    sumEl = panel.querySelector("#figure-summary");
    statusEl = panel.querySelector("#figure-status");
    var frow = panel.querySelector("#finish-row");
    groups.finish = frow;
    finish.forEach(function (opt) {
      var b = document.createElement("button");
      b.type = "button"; b.dataset.id = opt.id; b.textContent = opt.name;
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", function () { select("finish", opt); if (window.heavyPulse) window.heavyPulse(12); render(); });
      frow.appendChild(b);
    });
    panel.querySelector("#create-name").addEventListener("input", render);
    panel.querySelector("#create-random").addEventListener("click", function () {
      function any(list) { return list[Math.floor(Math.random() * list.length)]; }
      select("ancestry", any(ancestry)); select("origin", any(origin)); select("build", any(build));
      select("weapon", any(weapon)); select("finish", any(finish));
      if (rankList.length) select("rank", any(rankList));
      flash(""); render();
    });
    panel.querySelector("#create-save").addEventListener("click", function () {
      // Shared site locker (same keys as Forge and Locker), cap 24.
      var rec = { name: charName(), saved: new Date().toISOString() };
      ["ancestry", "origin", "build", "weapon", "rank", "finish"].forEach(function (k) { rec[k] = pick[k] ? pick[k].id : null; });
      var L = window.HallLocker;
      if (!L) { flash("The locker did not load on this page. Nothing was saved."); return; }
      var thumb = "";
      try {
        var t = document.createElement("canvas"); t.width = 96; t.height = 128;
        t.getContext("2d").drawImage(figCanvas, 0, 0, 96, 128);
        thumb = t.toDataURL("image/jpeg", 0.72);
        if (thumb.length > 50000) thumb = "";
      } catch (e) { thumb = ""; }
      var finishLook = rec.finish && L.presetIndex(rec.finish) >= 0 ? rec.finish : null;
      var label = (rec.name || "Unnamed") + " · " + [rec.ancestry, rec.origin, rec.build, rec.weapon].filter(Boolean).join(" / ");
      var r = L.add({ label: label, source: "create", state: finishLook ? L.presetState(finishLook) : undefined, thumb: thumb });
      if (!r.ok) { flash(r.reason); return; }
      r.entry.create = rec;
      try {
        var all = L.entries() || [];
        all.forEach(function (e) { if (e.id === r.entry.id) e.create = rec; });
        localStorage.setItem(L.KEY, JSON.stringify(all));
      } catch (e) { /* the entry is saved without the Create picks */ }
      var n = (L.entries() || []).length;
      flash("Saved to the locker in this browser (" + n + " of " + L.CAPACITY + ")." + (r.earned ? " The board gained one line." : ""));
    });
    panel.querySelector("#create-png").addEventListener("click", function () {
      try {
        var url = figCanvas.toDataURL("image/png");
        var link = document.createElement("a");
        link.href = url;
        link.download = ((charName() || "character").replace(/[^a-z0-9-]+/gi, "-").toLowerCase() || "character") + ".png";
        document.body.appendChild(link); link.click(); link.remove();
        flash("PNG ready.");
      } catch (e) { flash("Download did not work in this browser."); }
    });
  }
  function flash(msg) { if (statusEl) statusEl.textContent = msg; }

  /* Restore the newest locker save, if any. */
  function restore() {
    try {
      var all = (window.HallLocker && window.HallLocker.entries()) || [];
      var rec = null;
      for (var i = all.length - 1; i >= 0; i--) { if (all[i].source === "create" && all[i].create) { rec = all[i].create; break; } }
      if (!rec) return;
      var lists = { ancestry: ancestry, origin: origin, build: build, weapon: weapon, rank: rankList, finish: finish };
      Object.keys(lists).forEach(function (k) {
        var hit = lists[k].filter(function (x) { return x.id === rec[k]; })[0];
        if (hit) select(k, hit);
      });
      if (rec.name) document.getElementById("create-name").value = rec.name;
    } catch (e) { /* ignore */ }
  }

  buildPanel();
  restore();
  render();

  document.getElementById("copy-sheet").addEventListener("click", function () {
    var text = sheetEl.textContent;
    var done = function () {
      var btn = document.getElementById("copy-sheet");
      btn.textContent = "Copied";
      setTimeout(function () { btn.textContent = "Copy markdown"; }, 1200);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, done);
    } else {
      done();
    }
  });

  window.HallCreate = { draw: drawFigure, pick: pick };
})();
