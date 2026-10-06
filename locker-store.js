// Shared locker for every page. Same localStorage keys and entry shape as the Forge page
// (foundation-locker-v2, foundation-locker-crowns-v1, foundation-locker-board-v1), cap 24.
// Saved in this browser only. Nothing is sent anywhere.
(function () {
  var KEY = "foundation-locker-v2";
  var CROWN_KEY = "foundation-locker-crowns-v1";
  var BOARD_KEY = "foundation-locker-board-v1";
  var CAPACITY = 24;
  // Same look settings the Forge page uses for its four presets, so a look saved here loads there.
  var PRESETS = [
    { look: "black-chrome", name: "Black Chrome", finish: "chrome", helmet: "chrome", chest: "tactical", weapon: "hammer", accent: "#0A0A0B" },
    { look: "white-samurai", name: "White Samurai", finish: "white", helmet: "samurai", chest: "samurai", weapon: "katana", accent: "#FFFFFF" },
    { look: "skull-champion", name: "Skull Champion", finish: "black", helmet: "skull", chest: "tactical", weapon: "axe", accent: "#9AA0A8" },
    { look: "titan-gladiator", name: "Titan Gladiator", finish: "chrome", helmet: "titan", chest: "gladiator", weapon: "hammer", accent: "#FFAA00" }
  ];
  function blankState() {
    return { preset: null, desc: "", prompt: "", touched: false, helmet: "none", chest: "light", finish: "white", weapon: "katana", wear: 8, crack: 12, glow: 9, color: "#E8E8E8", wLen: 50, wWear: 40, wGlow: 8, mus: 50, height: 50, baseHelmet: "none", baseChest: "light", baseFinish: "white", baseColor: "#E8E8E8", baseWeapon: "katana", baseWear: 8, baseCrack: 12, baseGlow: 9, baseWLen: 50, baseWWear: 40, baseWGlow: 8, baseMus: 50, baseHeight: 50, basePrompt: "", baseDesc: "" };
  }
  function presetIndex(look) {
    for (var i = 0; i < PRESETS.length; i++) if (PRESETS[i].look === look) return i;
    return -1;
  }
  function presetState(look) {
    var i = presetIndex(look);
    var s = blankState();
    if (i < 0) return s;
    var p = PRESETS[i];
    s.preset = i; s.touched = true;
    s.helmet = s.baseHelmet = p.helmet;
    s.chest = s.baseChest = p.chest;
    s.finish = s.baseFinish = p.finish;
    s.weapon = s.baseWeapon = p.weapon;
    s.color = s.baseColor = p.accent;
    s.mus = s.baseMus = 75;
    s.height = s.baseHeight = 65;
    return s;
  }
  function readList(key) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return [];
      var data = JSON.parse(raw);
      return Array.isArray(data) ? data.slice() : null;
    } catch (e) { return null; }
  }
  function writeList(key, list) {
    try { localStorage.setItem(key, JSON.stringify(list)); return { ok: true }; }
    catch (e) { return { ok: false, reason: "Browser storage is not available or full. Nothing was saved." }; }
  }
  function entries() {
    var list = readList(KEY);
    if (list === null) return null;
    return list.filter(function (x) { return x && x.id && x.state && typeof x.state === "object"; }).slice(0, CAPACITY);
  }
  function earnBoard(list) {
    if (!list || list.length < CAPACITY) return false;
    var crowns = readList(CROWN_KEY), board = readList(BOARD_KEY);
    if (crowns === null || board === null) return false;
    var changed = false;
    crowns.forEach(function (crown) {
      if (!crown || !crown.id) return;
      var exists = board.some(function (b) { return b && b.crownId === crown.id; });
      if (exists) return;
      board.push({ id: "board-" + crown.id, crownId: crown.id, day: crown.day, locker: "full" });
      changed = true;
    });
    return changed ? writeList(BOARD_KEY, board).ok : false;
  }
  function add(fields) {
    var list = entries();
    if (list === null) return { ok: false, reason: "The saved locker could not be read, so nothing was replaced." };
    if (list.length >= CAPACITY) return { ok: false, reason: "The locker is full (" + CAPACITY + "). Remove one to save another." };
    var entry = {
      id: "l-" + Date.now() + "-" + Math.floor(Math.random() * 1e6),
      at: new Date().toISOString(),
      fig: 0,
      label: fields.label,
      residual: null, // nothing on this page measures changed settings
      state: fields.state || blankState(),
      thumb: fields.thumb || "",
      source: fields.source,
      look: fields.look || null
    };
    var next = list.concat([entry]);
    var w = writeList(KEY, next);
    if (!w.ok) return w;
    return { ok: true, entry: entry, earned: earnBoard(next) };
  }
  function remove(test) {
    var list = entries();
    if (list === null) return { ok: false, reason: "The saved locker could not be read, so nothing was removed." };
    var next = list.filter(function (x) { return !test(x); });
    if (next.length === list.length) return { ok: true, missing: true };
    return writeList(KEY, next);
  }
  window.HallLocker = {
    KEY: KEY, CROWN_KEY: CROWN_KEY, BOARD_KEY: BOARD_KEY, CAPACITY: CAPACITY, PRESETS: PRESETS,
    entries: entries,
    crowns: function () { return readList(CROWN_KEY); },
    board: function () { return readList(BOARD_KEY); },
    presetState: presetState,
    presetIndex: presetIndex,
    add: add,
    removeId: function (id) { return remove(function (x) { return x.id === id; }); },
    removeLook: function (look) { return remove(function (x) { return x.look === look; }); },
    clear: function () { var list = entries(); if (list === null) return { ok: false, reason: "The saved locker could not be read, so nothing was cleared." }; return writeList(KEY, []); },
    hasLook: function (look) { var list = entries() || []; return list.some(function (x) { return x.look === look; }); }
  };
})();
