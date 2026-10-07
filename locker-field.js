
(function () {
  const RANKS = [
    { n: 1, name: "Ashen", line: "Cold soot", tint: "#9a9691", deep: "#121211", glow: "rgba(168,164,158,.42)" },
    { n: 2, name: "Cinder", line: "Cooled fire", tint: "#b3a59a", deep: "#161310", glow: "rgba(186,164,148,.4)" },
    { n: 3, name: "Pewter", line: "Soft metal", tint: "#a7b0ba", deep: "#101316", glow: "rgba(168,180,194,.4)" },
    { n: 4, name: "Flint", line: "Struck stone", tint: "#8ea0b0", deep: "#0e1418", glow: "rgba(130,156,176,.42)" },
    { n: 5, name: "Moss", line: "Low green", tint: "#8aa56e", deep: "#10140e", glow: "rgba(120,150,80,.4)" },
    { n: 6, name: "Fern", line: "Unfurling", tint: "#5eae72", deep: "#0c1610", glow: "rgba(70,170,100,.4)" },
    { n: 7, name: "Verdigris", line: "Old copper", tint: "#3fbfa4", deep: "#0c1614", glow: "rgba(50,180,150,.4)" },
    { n: 8, name: "Jade", line: "Cut green", tint: "#2fce86", deep: "#0a1610", glow: "rgba(40,200,120,.42)" },
    { n: 9, name: "Tide", line: "Pull of water", tint: "#2aabb8", deep: "#0c1518", glow: "rgba(40,170,185,.42)" },
    { n: 10, name: "Glacier", line: "Pale ice", tint: "#8fd4f2", deep: "#10161a", glow: "rgba(140,210,240,.45)" },
    { n: 11, name: "Azure", line: "Open sky", tint: "#5eb6ee", deep: "#0e1520", glow: "rgba(80,170,230,.42)" },
    { n: 12, name: "Cobalt", line: "Deep pigment", tint: "#4d86f0", deep: "#0c1220", glow: "rgba(60,110,230,.45)" },
    { n: 13, name: "Indigo", line: "Night blue", tint: "#6d74e6", deep: "#10101c", glow: "rgba(90,100,220,.45)" },
    { n: 14, name: "Royal", line: "Court color", tint: "#8a78e8", deep: "#120f1c", glow: "rgba(120,100,220,.45)" },
    { n: 15, name: "Violet", line: "Full purple", tint: "#b06ae0", deep: "#160e18", glow: "rgba(170,90,210,.42)" },
    { n: 16, name: "Amethyst", line: "Cut crystal", tint: "#d07cff", deep: "#160e1a", glow: "rgba(200,110,255,.42)" },
    { n: 17, name: "Gilt", line: "Thin gold", tint: "#e2c56a", deep: "#16140e", glow: "rgba(220,180,80,.4)" },
    { n: 18, name: "Aureate", line: "Worked gold", tint: "#f0c14b", deep: "#18140c", glow: "rgba(240,180,50,.42)" },
    { n: 19, name: "Solar", line: "High noon", tint: "#ffd15a", deep: "#18160c", glow: "rgba(255,200,70,.4)" },
    { n: 20, name: "Amber", line: "Held light", tint: "#f09a3a", deep: "#18110c", glow: "rgba(230,130,40,.45)" },
    { n: 21, name: "Ember", line: "Living coal", tint: "#f06a28", deep: "#180e0c", glow: "rgba(230,80,30,.48)" },
    { n: 22, name: "Crimson", line: "Dark red", tint: "#e23b4a", deep: "#180c10", glow: "rgba(200,40,55,.48)" },
    { n: 23, name: "Scarlet", line: "Last fire", tint: "#ff4d4d", deep: "#1a0c0c", glow: "rgba(255,50,50,.46)" },
    { n: 24, name: "Prism", line: "First place", tint: "#d6f6ff", deep: "#100c18", glow: "rgba(180,220,255,.5)" }
  ];
  const CHAR_RANK = {
    "skull-champion": 8,
    "titan-gladiator": 11,
    "black-chrome": 14,
    "white-samurai": 21,
    "foundation": 24
  };
  const PRESET_LOOKS = ["black-chrome", "white-samurai", "skull-champion", "titan-gladiator"];
  // Rank of a saved entry, from the shared locker (same keys as the Forge page).
  // A saved look keeps its look's rank. A Forge save that starts from a look takes that look's rank.
  // A blank Forge figure starts at Ashen (1) and moves up one rank per changed setting, up to Scarlet (23).
  // Only Foundation reaches Prism (24).
  function rankForCharacter(c) {
    if (!c) return 1;
    if (c.look && CHAR_RANK[c.look]) return CHAR_RANK[c.look];
    if (c.id && CHAR_RANK[c.id]) return CHAR_RANK[c.id];
    const st = c.state || {};
    if (typeof st.preset === "number" && PRESET_LOOKS[st.preset]) return CHAR_RANK[PRESET_LOOKS[st.preset]];
    const changed = typeof c.residual === "number" && isFinite(c.residual) ? c.residual : 0;
    return Math.max(1, Math.min(23, 1 + changed));
  }
  function rankMeta(n) {
    return RANKS[Math.max(0, Math.min(23, (n || 1) - 1))];
  }
  function contenders() {
    const list = window.HallLocker ? window.HallLocker.entries() : [];
    return (list || []).map((e) => Object.assign({}, e, { name: e.label || "Saved character" }));
  }
  function sky() {
    let el = document.getElementById("sky");
    if (!el) {
      el = document.createElement("div");
      el.id = "sky";
      document.body.prepend(el);
    }
    return el;
  }
  function applyLockerField() {
    const body = document.body;
    const list = contenders();
    // #sky holds the static blossom composition in markup; never wipe it.
    // (Rank color arrives as a translucent wash on body[data-rank], over the blossom.)
    sky();
    if (!list.length) {
      body.dataset.rank = "0";
      body.style.removeProperty("--rank-glow");
      body.style.removeProperty("--rank-deep");
      paintScale(null);
      return;
    }
    const lead = list.slice().sort((a, b) => rankForCharacter(b) - rankForCharacter(a) || 0)[0];
    const n = rankForCharacter(lead);
    const meta = rankMeta(n);
    body.dataset.rank = String(n);
    body.style.setProperty("--rank-glow", meta.glow);
    body.style.setProperty("--rank-deep", meta.deep);
    paintScale(lead);
  }
  function paintScale(lead) {
    document.querySelectorAll("[data-scale]").forEach((el) => {
      el.innerHTML = "";
      const n = lead ? rankForCharacter(lead) : 0;
      const meta = n ? rankMeta(n) : null;
      const word = document.createElement("strong");
      word.className = "rank-word";
      word.textContent = meta ? meta.name : "Unranked";
      const bar = document.createElement("div");
      bar.className = "scale-bar";
      const mid = document.createElement("i");
      mid.className = "scale-mid";
      const you = document.createElement("i");
      you.className = "scale-you";
      you.style.left = (n ? (n / 24) * 100 : 0) + "%";
      bar.append(mid, you);
      const cap = document.createElement("p");
      if (!lead) {
        cap.textContent = "Nothing is in the locker, so the hall rests on blossom. Save a character and the page takes on the color wash of the single highest one here. Only Prism, rank 24, is holographic.";
      } else {
        cap.textContent = lead.name + " is the highest in the locker: " + meta.name + ", rank " + n + " of 24. The page wears that color over the blossom." + (n === 24 ? " This is first place, the only holographic rank." : " Holographic stays at Prism, rank 24.");
      }
      el.append(word, bar, cap);
    });
  }
  window.LOCKER_RANKS = RANKS;
  window.addEventListener("storage", (e) => { if (e.key === null || (e.key || "").indexOf("foundation-locker") === 0) applyLockerField(); });
  window.rankForCharacter = rankForCharacter;
  window.applyLockerField = applyLockerField;
  applyLockerField();
})();
