const styles = {
  realistic: "Seen as a photoreal figure in a dark hall.",
  anime: "Seen as a stylized full-body design on a dark ground.",
  "8bit": "Seen as a pixel-art sprite on black.",
  painterly: "Seen as a painterly study in the arena.",
  ink: "Seen as a dark ink-and-wash study.",
  clay: "Seen as a clay figure, matte and sculpted."
};
const figure = document.querySelector("[data-figure]");
const box = document.querySelector("#direction-text");
const out = document.querySelector("[data-direction]");
const buttons = [...document.querySelectorAll("[data-style]")];
const look = document.body.dataset.look;
const base = document.body.dataset.base;
let style = "realistic";

// Realistic pictures are JPEG photos; the other styles are small PNGs.
function srcFor() {
  return `../images/look-${look}-${style}.${style === "realistic" ? "jpg" : "png"}`;
}

function fillText() {
  box.value = base + " " + styles[style];
}

function show() {
  figure.src = srcFor();
  figure.alt = document.body.dataset.title + ", " + style;
  const wrap = figure.closest(".figure-wrap");
  if (!wrap) return;
  wrap.classList.add("front");
  wrap.scrollIntoView({ block: "nearest", inline: "nearest" });
}

buttons.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (window.heavyPulse) window.heavyPulse(10);
    style = btn.dataset.style;
    buttons.forEach((b) => b.setAttribute("aria-pressed", b === btn ? "true" : "false"));
    fillText();
    show();
    out.textContent = "";
  });
});

document.querySelector("[data-generate]").addEventListener("click", () => {
  if (window.heavyPulse) window.heavyPulse(16);
  const text = box.value.trim();
  out.textContent = "Imagine prompt. Combine " + document.body.dataset.title + " as " + style + ". " + text +
    " (This page writes the prompt only. It does not draw a new picture.)";
});

fillText();
show();
