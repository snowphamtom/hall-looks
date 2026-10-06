const stage = document.getElementById("stage");
const hero = document.getElementById("hero");
const empty = document.getElementById("empty");
const shown = document.getElementById("shown");
const prompt = document.getElementById("prompt");
const status = document.getElementById("status");
const lookBtns = [...document.querySelectorAll("#looks [data-look]")];
const weaponBtns = [...document.querySelectorAll("#weapons [data-weapon]")];

const weaponSrc = {
  hammer: "../images/weapon-hammer.jpg",
  katana: "../images/weapon-katana.jpg",
  axe: "../images/weapon-axe.jpg",
  warhammer: "../images/weapon-warhammer.jpg"
};
const weaponAlt = {
  hammer: "Black Chrome hammer",
  katana: "White Samurai katana",
  axe: "Skull Champion axe",
  warhammer: "Titan war hammer"
};

let weapon = null;

function front() {
  stage.classList.add("front");
  stage.scrollIntoView({ block: "nearest" });
}

function setPressed(list, active) {
  list.forEach((btn) => {
    btn.setAttribute("aria-pressed", btn === active ? "true" : "false");
  });
}

function showWeapon(id) {
  const text = prompt.value.trim();
  const name = id ? weaponAlt[id] : "";
  shown.hidden = !name && !text;
  shown.textContent = name + (text ? (name ? " · " : "") + "Your note: " + text : "");

  if (!id) {
    hero.hidden = true;
    hero.removeAttribute("src");
    empty.hidden = false;
    empty.textContent = "Pick a look and a weapon. What you set comes to the front.";
    front();
    return;
  }
  hero.onload = () => {
    hero.hidden = false;
    empty.hidden = true;
    front();
  };
  hero.onerror = () => {
    hero.hidden = true;
    empty.hidden = false;
    empty.textContent = "The " + weaponAlt[id] + " picture did not load.";
    front();
  };
  hero.alt = weaponAlt[id];
  hero.src = weaponSrc[id];
  front();
}

function applyWeapon(id) {
  weapon = id;
  const match = weaponBtns.find((b) => b.dataset.weapon === id);
  if (match) setPressed(weaponBtns, match);
  showWeapon(id);
}

lookBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (window.heavyPulse) window.heavyPulse(10);
    setPressed(lookBtns, btn);
    applyWeapon(btn.dataset.weapon);
    status.textContent = "";
  });
});

weaponBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (window.heavyPulse) window.heavyPulse(10);
    applyWeapon(btn.dataset.weapon);
    status.textContent = "";
  });
});

document.getElementById("set").addEventListener("click", () => {
  if (!weapon) {
    status.textContent = "Pick a look or a weapon first.";
    return;
  }
  if (window.heavyPulse) window.heavyPulse(16);
  const text = prompt.value.trim();
  status.textContent = "Showing the " + weaponAlt[weapon] + "." + (text ? " Your note is shown with it." : "");
  showWeapon(weapon);
});

// Weapon thumbs
weaponBtns.forEach((btn) => {
  const slot = btn.querySelector(".weapon-slot");
  const img = document.createElement("img");
  img.alt = "";
  img.decoding = "async";
  img.onerror = () => { slot.textContent = "—"; slot.classList.add("weapon-missing"); };
  img.src = weaponSrc[btn.dataset.weapon];
  slot.replaceChildren(img);
});
