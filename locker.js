
const TIERS = window.LOCKER_RANKS;
function tierFor(c) {
  return String(window.rankForCharacter(c));
}
function tierById(id) {
  return TIERS.find((t) => String(t.n) === String(id)) || TIERS[0];
}
function tierClass(tier) {
  return "tier-" + tier.n + (tier.n === 24 ? " tier-apex" : "");
}

const roster = [
  {
    id: "foundation",
    name: "Foundation",
    note: "The earned piece. White mosaic plates over black armor with gold trim, and a see-through cape that shows rainbow light.",
    img: "../images/foundation.webp",
    pos: "55% 50%",
    href: "../foundation/"
  },
  {
    id: "black-chrome",
    name: "Black Chrome",
    note: "Dark chrome armor with amber light, hammer.",
    img: "../images/locker-black-chrome.webp",
    href: "../black-chrome/"
  },
  {
    id: "white-samurai",
    name: "White Samurai",
    note: "White crackle armor, horned helmet, katana drawn. BeO is the costume name.",
    img: "../images/locker-white-samurai.webp",
    href: "../white-samurai/"
  },
  {
    id: "skull-champion",
    name: "Skull Champion",
    note: "Skull helmet, black armor, axe.",
    img: "../images/look-skull-champion-realistic.webp",
    pos: "49% 50%",
    href: "../skull-champion/"
  },
  {
    id: "titan-gladiator",
    name: "Titan Gladiator",
    note: "Gunmetal armor, amber chest glow, war hammer. Halbach and Ti-6Al-4V are costume names.",
    img: "../images/locker-titan-gladiator.webp",
    href: "../titan-gladiator/"
  }
];

const L = window.HallLocker;
const slots = document.getElementById("vault-slots");
const empty = document.getElementById("vault-empty");
const count = document.getElementById("saved-count");
const capacity = document.getElementById("capacity");
const rosterEl = document.getElementById("roster");
const rosterCount = document.getElementById("roster-count");
const rankFilterEmpty = document.getElementById("rank-filter-empty");
let selectedRank = null;

function load() {
  return L.entries();
}

let saved = load();
const readOk = () => saved !== null;
function list() { return saved || []; }
// Saved times are ISO (UTC); show the visitor's own calendar day, as Forge does.
function localDay(at) {
  const d = new Date(at);
  if (isNaN(d)) return String(at).slice(0, 10);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function rosterFor(entry) {
  return roster.find((c) => c.id === entry.look) || null;
}

function paintComb() {
  if (window.applyLockerField) window.applyLockerField();
}

// Collection view (borrowed from Genshin's archive filters and Hearthstone's "new" tags):
// filter saves by where they were made, sort them, and mark the ones saved since your last visit.
let vaultSrc = "all";
const SEEN_KEY = "hall-locker-seen-v1";
let seenAt = 0;
try { seenAt = +localStorage.getItem(SEEN_KEY) || 0; localStorage.setItem(SEEN_KEY, String(Date.now())); } catch (e) {}
function srcOf(entry) { return !entry.source ? "forge" : entry.source; }
function shownList() {
  const sortEl = document.getElementById("vault-sort");
  const mode = sortEl ? sortEl.value : "new";
  const out = list().filter((e) => vaultSrc === "all" || srcOf(e) === vaultSrc);
  const t = (e) => +new Date(e.at) || 0;
  if (mode === "new") out.sort((a, b) => t(b) - t(a));
  else if (mode === "old") out.sort((a, b) => t(a) - t(b));
  else if (mode === "rank") out.sort((a, b) => tierById(tierFor(b)).n - tierById(tierFor(a)).n);
  else out.sort((a, b) => String(a.label || "").localeCompare(String(b.label || "")));
  return out;
}
function render() {
  saved = load();
  slots.innerHTML = "";
  const tools = document.getElementById("vault-tools");
  if (tools) tools.hidden = false;
  const shown = shownList();
  const shownEl = document.getElementById("vault-shown");
  if (shownEl) shownEl.textContent = vaultSrc === "all" ? "" : "Showing " + shown.length + " of " + list().length;
  shown.forEach((entry) => {
    const c = rosterFor(entry);
    const tier = tierById(tierFor(entry));
    const thumb = entry.thumb && String(entry.thumb).indexOf("data:image/") === 0 ? entry.thumb : (c ? c.img : "");
    const from = entry.source === "forge" || !entry.source ? "Saved on Forge" : entry.source === "smith" ? "Saved on Smith" : entry.source === "foundation" ? "Saved on Foundation" : "Saved here";
    const card = window.HallCard.make({
      img: thumb, alt: entry.label || "", pos: thumb === (c && c.img) ? c.pos : "",
      name: entry.label || (c ? c.name : "Saved character"),
      line: from + (entry.at ? " · " + localDay(entry.at) : ""),
      action: "Remove", rank: tier.n, rankName: tier.name, tint: tier.tint, size: "sm"
    });
    card.dataset.tier = String(tier.n);
    card.dataset.id = entry.id;
    if (seenAt && (+new Date(entry.at) || 0) > seenAt) { card.classList.add("is-new"); card.setAttribute("aria-description", "New since your last visit"); }
    card.addEventListener("click", () => removeEntry(entry));
    const wrap = document.createElement("div");
    wrap.className = "vault-slot";
    wrap.appendChild(card);
    const share = document.createElement("a");
    share.className = "slot-share";
    share.href = shareHref(entry);
    share.textContent = "Open in Forge";
    share.title = "Opens this save on Forge; the link itself holds the build, so you can send it";
    wrap.appendChild(share);
    slots.appendChild(wrap);
  });
  empty.hidden = list().length > 0;
  empty.textContent = readOk() ? "Locker empty. Save a character from the roster below, or from Forge." : "The saved locker could not be read. It was left as it is.";
  count.textContent = list().length + " / " + L.CAPACITY;
  capacity.textContent = "Capacity " + L.CAPACITY;
  rosterCount.textContent = roster.length + " characters";
  paintComb();
  paintCrowns();
  applyRankFilter();
  [...rosterEl.querySelectorAll(".hc-card")].forEach((btn) => {
    const on = list().some((e) => e.look === btn.dataset.id);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.querySelector(".hc-card__action").textContent = on ? "Saved · tap to remove" : (list().length >= L.CAPACITY ? "Locker full" : "Save to locker");
  });
}

function say(text) {
  const el = document.getElementById("locker-note");
  if (el) el.textContent = text;
}

function removeEntry(entry) {
  if (!window.confirm("Remove this character from your locker?")) return;
  const r = L.removeId(entry.id);
  say(r.ok ? "Removed " + (entry.label || "that character") + "." : r.reason);
  if (window.heavyPulse) window.heavyPulse(10);
  render();
}

function toggle(id) {
  const c = roster.find((x) => x.id === id);
  const on = list().some((e) => e.look === id);
  let r;
  if (on) {
    if (!window.confirm("Remove " + c.name + " from your locker?")) return;
    r = L.removeLook(id);
    say(r.ok ? "Removed " + c.name + "." : r.reason);
  } else {
    r = L.add({ label: c.name, look: id, source: "locker", state: L.presetState(id) });
    say(r.ok ? "Saved " + c.name + " to the locker." + (r.earned ? " The board gained one line." : "") : r.reason);
  }
  if (window.heavyPulse) window.heavyPulse(on ? 10 : 18);
  render();
  document.getElementById("vault").scrollIntoView({ block: "nearest" });
}

function paintCrowns() {
  const crownsEl = document.getElementById("crowns");
  const boardEl = document.getElementById("board");
  if (!crownsEl || !boardEl) return;
  const crowns = L.crowns();
  const board = L.board();
  crownsEl.textContent = crowns === null ? "Saved crowns could not be read. They were left as they are."
    : crowns.length ? crowns.filter(Boolean).map((c) => (c.day || "Undated") + " crown").join(" · ") : "No crown kept yet. Crowns are kept on the Forge page, one a day, and stay.";
  boardEl.textContent = board === null ? "The board could not be read. It was left as it is."
    : board.length ? board.filter(Boolean).map((b) => (b.day || "Undated") + " crown, full locker").join(" · ") : "No line yet.";
}

function applyRankFilter() {
  const blocks = [...rosterEl.querySelectorAll(".tier-block")];
  blocks.forEach((block) => {
    block.hidden = selectedRank !== null && block.dataset.tier !== String(selectedRank);
  });
  if (rankFilterEmpty) {
    rankFilterEmpty.hidden = selectedRank === null || blocks.some((block) => !block.hidden);
  }
  if (selectedRank === null) rosterCount.textContent = roster.length + " characters";
  else {
    const meta = tierById(selectedRank);
    const shown = blocks.some((block) => !block.hidden);
    rosterCount.textContent = (shown ? "Showing " : "No ") + meta.name + " · rank " + selectedRank;
  }
}

function chooseRank(n, item) {
  selectedRank = selectedRank === n ? null : n;
  [...ladder.querySelectorAll("[role=button]")].forEach((rank) => {
    rank.setAttribute("aria-pressed", rank === item && selectedRank !== null ? "true" : "false");
  });
  if (window.heavyPulse) window.heavyPulse(12);
  applyRankFilter();
}

const ladder = document.getElementById("rank-ladder");
if (ladder) {
  TIERS.forEach((tier) => {
    const li = document.createElement("div");
    li.className = "rk " + tierClass(tier);
    li.dataset.tier = String(tier.n);
    li.setAttribute("role", "button");
    li.setAttribute("tabindex", "0");
    li.setAttribute("aria-pressed", "false");
    li.title = "Show only " + tier.name + " in the roster";
    li.style.setProperty("--tier", tier.tint);
    li.innerHTML = "<i class='tier-pip' aria-hidden='true'></i><span class='rank-no'></span><strong></strong><em></em>";
    li.querySelector(".rank-no").textContent = tier.n === 24 ? "1st" : String(tier.n).padStart(2, "0");
    li.querySelector("strong").textContent = tier.name;
    li.querySelector("em").textContent = tier.line;
    li.addEventListener("click", () => chooseRank(tier.n, li));
    li.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        chooseRank(tier.n, li);
      }
    });
    ladder.appendChild(li);
  });
}
TIERS.forEach((tier) => {
  const mine = roster.filter((c) => tierFor(c) === String(tier.n));
  if (!mine.length) return;
  const block = document.createElement("section");
  block.className = "tier-block " + tierClass(tier);
  block.dataset.tier = String(tier.n);
  block.style.setProperty("--tier", tier.tint);
  block.innerHTML = "<h2 class='tier-heading'><i class='tier-pip' aria-hidden='true'></i> <span></span></h2><div class='tier-grid'></div>";
  block.querySelector("h2 span").textContent = (tier.n === 24 ? "1st" : String(tier.n).padStart(2, "0")) + "  " + tier.name;
  const grid = block.querySelector(".tier-grid");
  mine.forEach((c) => {
    const btn = window.HallCard.make({
      img: c.img, alt: c.name, pos: c.pos, name: c.name, line: c.note, action: "Save to locker",
      rank: tier.n, rankName: tier.name, tint: tier.tint
    });
    btn.dataset.id = c.id;
    btn.dataset.tier = String(tier.n);
    btn.addEventListener("click", () => toggle(c.id));
    grid.appendChild(btn);
  });
  rosterEl.appendChild(block);
});

document.getElementById("clear").addEventListener("click", () => {
  if (!list().length) { say("The locker is already empty."); return; }
  if (!window.confirm("Remove all " + list().length + " characters from your locker? Crowns and the board stay.")) return;
  if (window.heavyPulse) window.heavyPulse(14);
  const r = L.clear();
  say(r.ok ? "Locker cleared. Crowns and the board stay." : r.reason);
  render();
});
document.querySelectorAll("#vault-tools .chip").forEach((chip) => chip.addEventListener("click", () => {
  vaultSrc = chip.dataset.src;
  document.querySelectorAll("#vault-tools .chip").forEach((c) => c.setAttribute("aria-pressed", c === chip ? "true" : "false"));
  render();
}));
const vaultSort = document.getElementById("vault-sort");
if (vaultSort) vaultSort.addEventListener("change", render);
window.addEventListener("storage", (e) => { if (e.key === null || (e.key || "").indexOf("foundation-locker") === 0) render(); });

render();

// Share, export and import (HeroForge-style share links; a portable backup file).
function b64u(str) { return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
function shareHref(entry) {
  const fig = entry.fig === 1 ? 1 : 0;
  return "../forge/#b=" + b64u(JSON.stringify({ v: 1, a: fig, f: [entry.state] }));
}
document.getElementById("export").addEventListener("click", () => {
  const data = { kind: "heavy-is-the-crown-locker", v: 1, at: new Date().toISOString(), entries: list(), crowns: L.crowns() || [], board: L.board() || [] };
  const blob = new Blob([JSON.stringify(data, null, 1)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "locker-" + localDay(data.at) + ".json";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  say("Exported " + list().length + " saves to a file.");
});
document.getElementById("import").addEventListener("change", (ev) => {
  const file = ev.target.files && ev.target.files[0];
  ev.target.value = "";
  if (!file) return;
  if (file.size > 8e6) { say("That file is too large to be a locker export."); return; }
  file.text().then((txt) => {
    let data;
    try { data = JSON.parse(txt); } catch (e) { say("That file is not a locker export."); return; }
    const incoming = Array.isArray(data) ? data : data && Array.isArray(data.entries) ? data.entries : null;
    if (!incoming) { say("That file is not a locker export."); return; }
    const cur = L.entries();
    if (cur === null) { say("The saved locker could not be read, so nothing was imported."); return; }
    const have = new Set(cur.map((e) => e.id));
    const ok = incoming.filter((e) => e && typeof e.id === "string" && e.state && typeof e.state === "object" && !have.has(e.id))
      .map((e) => ({ id: e.id.slice(0, 80), at: String(e.at || new Date().toISOString()).slice(0, 40), fig: e.fig === 1 ? 1 : 0,
        label: String(e.label || "").slice(0, 120), residual: null, state: e.state,
        thumb: typeof e.thumb === "string" && e.thumb.indexOf("data:image/") === 0 ? e.thumb : "",
        source: typeof e.source === "string" ? e.source.slice(0, 20) : undefined, look: typeof e.look === "string" ? e.look.slice(0, 40) : null }));
    const room = L.CAPACITY - cur.length;
    const take = ok.slice(0, Math.max(0, room));
    try { localStorage.setItem(L.KEY, JSON.stringify(cur.concat(take))); }
    catch (e) { say("Browser storage is full, so nothing was imported."); return; }
    say("Imported " + take.length + (ok.length > take.length ? " (" + (ok.length - take.length) + " left out: the locker holds " + L.CAPACITY + ")" : "") + (incoming.length > ok.length ? "; " + (incoming.length - ok.length) + " already here or unreadable" : "") + ".");
    render();
  });
});
