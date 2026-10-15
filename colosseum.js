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

aBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (window.heavyPulse) window.heavyPulse(10);
    fighterA = btn.dataset.look;
    setPressed(aBtns, btn);
    status.textContent = "";
  });
});

bBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (window.heavyPulse) window.heavyPulse(10);
    fighterB = btn.dataset.look;
    setPressed(bBtns, btn);
    status.textContent = "";
  });
});

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
