const stage = document.getElementById("stage");
const hero = document.getElementById("hero");
const empty = document.getElementById("empty");
const caption = document.getElementById("caption");
const status = document.getElementById("status");
const aBtns = [...document.querySelectorAll("#fighter-a [data-look]")];
const bBtns = [...document.querySelectorAll("#fighter-b [data-look]")];

const titles = {
  "black-chrome": "Black Chrome",
  "white-samurai": "White Samurai",
  "skull-champion": "Skull Champion",
  "titan-gladiator": "Titan Gladiator"
};

let fighterA = null;
let fighterB = null;

function front() {
  stage.classList.add("front");
  stage.scrollIntoView({ block: "nearest" });
}

function setPressed(list, active) {
  list.forEach((btn) => {
    btn.setAttribute("aria-pressed", btn === active ? "true" : "false");
  });
}

function fightSrc(a, b) {
  const pair = [a, b].sort();
  return "../images/fight-" + pair[0] + "-" + pair[1] + ".webp";
}

function bindA(btn) {
  btn.addEventListener("click", () => {
    if (window.heavyPulse) window.heavyPulse(10);
    fighterA = btn.dataset.look;
    setPressed(aBtns, btn);
    status.textContent = "";
  });
}
aBtns.forEach(bindA);

function bindB(btn) {
  btn.addEventListener("click", () => {
    if (window.heavyPulse) window.heavyPulse(10);
    fighterB = btn.dataset.look;
    setPressed(bBtns, btn);
    status.textContent = "";
  });
}
bBtns.forEach(bindB);

// Crown World: the active character joins as "Your champion" (its own uncropped card picture).
// No fight picture exists for a saved build, so a champion bout is shown as a face-off.
let champion = null;
function addChampion() {
  if (champion || !window.CrownWorld) return;
  const c = window.CrownWorld.character.active();
  if (!c) return;
  champion = { name: c.name, img: window.CrownWorld.character.picture(c) };
  titles.champion = "Your champion";
  [["fighter-a", aBtns, bindA], ["fighter-b", bBtns, bindB]].forEach(([id, list, bind]) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "hc-card hc-card--sm hc-card--contain"; b.dataset.look = "champion";
    b.setAttribute("aria-pressed", "false"); b.style.setProperty("--tier", "#e2c56a");
    b.innerHTML = "<span class='hc-card__art'><img alt='' decoding='async'></span><span class='hc-card__foil' aria-hidden='true'></span><span class='hc-card__sheen' aria-hidden='true'></span><span class='hc-card__plate'><strong>Your champion</strong><em></em></span>";
    b.querySelector("img").src = champion.img;
    b.querySelector("em").textContent = c.name;
    document.getElementById(id).appendChild(b);
    list.push(b); bind(b);
  });
}
if (window.CrownWorld) addChampion(); else document.addEventListener("crownworld:ready", addChampion);
function faceOff(a, b) {
  const old = stage.querySelector(".champ-faceoff"); if (old) old.remove();
  const f = document.createElement("div");
  f.className = "champ-faceoff";
  f.innerHTML = "<figure><img alt=''><figcaption></figcaption></figure><i>VS</i><figure><img alt=''><figcaption></figcaption></figure>";
  const imgs = f.querySelectorAll("img"), caps = f.querySelectorAll("figcaption");
  [a, b].forEach((x, i) => {
    imgs[i].src = portrait(x);
    imgs[i].alt = x === "champion" ? champion.name : titles[x];
    caps[i].textContent = x === "champion" ? champion.name : titles[x];
  });
  stage.appendChild(f);
}

document.getElementById("start").addEventListener("click", () => {
  if (!fighterA || !fighterB) {
    status.textContent = "Pick Fighter A and Fighter B first.";
    return;
  }
  if (fighterA === fighterB) {
    status.textContent = "Same look on both sides. Pick two different fighters.";
    hero.hidden = true;
    hero.removeAttribute("src");
    caption.hidden = true;
    empty.hidden = false;
    empty.textContent = "Pick two different looks, then start the fight.";
    return;
  }

  if (window.heavyPulse) window.heavyPulse(16);
  const oldF = stage.querySelector(".champ-faceoff"); if (oldF) oldF.remove();
  if (fighterA === "champion" || fighterB === "champion") {
    const other = fighterA === "champion" ? fighterB : fighterA;
    hero.hidden = true; hero.style.display = "none"; empty.hidden = true;
    faceOff(fighterA, fighterB);
    caption.hidden = false;
    caption.textContent = champion.name + " vs " + titles[other] + ". Your champion is a saved build, so there is no fight picture; they stand face to face.";
    if (window.CrownWorld) window.CrownWorld.ledger.add("fight", { a: fighterA === "champion" ? champion.name : titles[fighterA], b: fighterB === "champion" ? champion.name : titles[fighterB] });
    front(); reveal(fighterA, fighterB);
    return;
  }
  hero.style.display = "";
  const src = fightSrc(fighterA, fighterB);
  const line = titles[fighterA] + " vs " + titles[fighterB];
  status.textContent = "";
  caption.hidden = false;
  caption.textContent = line + ". One picture made ahead of time for this pairing; the fight is not simulated.";

  hero.onerror = () => {
    hero.hidden = true;
    empty.hidden = false;
    empty.textContent = "The picture for " + line + " did not load.";
    caption.hidden = true;
  };
  hero.onload = () => {
    hero.hidden = false;
    empty.hidden = true;
    front();
    reveal(fighterA, fighterB);
  };
  hero.alt = line;
  hero.src = src;
  if (window.CrownWorld) window.CrownWorld.ledger.add("fight", { a: titles[fighterA], b: titles[fighterB] });
  front();
});

// Matchup reveal (fighting-game "VS" beat): both portraits slide in, VS stamps,
// then the fight picture settles in. Sound stays off unless the visitor turned it on.
const reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
function portrait(look) {
  const btn = aBtns.find((b) => b.dataset.look === look);
  const img = btn && btn.querySelector("img");
  return img ? (img.currentSrc || img.src) : "";
}
function reveal(a, b) {
  stage.classList.remove("is-revealing");
  const old = stage.querySelector(".vs-banner");
  if (old) old.remove();
  if (reduceMotion) return;
  const v = document.createElement("div");
  v.className = "vs-banner";
  v.setAttribute("aria-hidden", "true");
  v.innerHTML = "<span class='vs-side vs-a'><img alt=''><b></b></span><i class='vs-mark'>VS</i><span class='vs-side vs-b'><img alt=''><b></b></span>";
  v.querySelector(".vs-a img").src = portrait(a); v.querySelector(".vs-a b").textContent = titles[a];
  v.querySelector(".vs-b img").src = portrait(b); v.querySelector(".vs-b b").textContent = titles[b];
  stage.appendChild(v);
  void stage.offsetWidth;
  stage.classList.add("is-revealing");
  setTimeout(() => { if (window.HallSound) window.HallSound.tick(); if (window.heavyPulse) window.heavyPulse(22); }, 420);
  setTimeout(() => { v.classList.add("is-out"); }, 1250);
  setTimeout(() => { v.remove(); stage.classList.remove("is-revealing"); }, 1800);
}
