// Shared character card: builds the markup and adds a light pointer tilt + sheen.
// Tilt is skipped when the visitor prefers reduced motion or has no fine pointer.
(function () {
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches;
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  // o: {tag, href, img, alt, canvas, name, line, action, rank, rankName, tint, pos, size, contain}
  function make(o) {
    var card = el(o.tag || (o.href ? "a" : "button"), "hc-card" + (o.size === "sm" ? " hc-card--sm" : "") + (o.rank === 24 ? " hc-card--prism" : "") + (o.contain ? " hc-card--contain" : ""));
    if (card.tagName === "A") card.href = o.href; else card.type = "button";
    if (o.tint) card.style.setProperty("--tier", o.tint);
    if (o.pos) card.style.setProperty("--pos", o.pos);
    var art = el("span", "hc-card__art");
    if (o.canvas) art.appendChild(o.canvas);
    else if (o.img) { var im = el("img"); im.src = o.img; im.alt = o.alt || ""; im.decoding = "async"; art.appendChild(im); }
    card.appendChild(art);
    var foil = el("span", "hc-card__foil"); foil.setAttribute("aria-hidden", "true"); card.appendChild(foil);
    var sheen = el("span", "hc-card__sheen"); sheen.setAttribute("aria-hidden", "true"); card.appendChild(sheen);
    if (o.rank) {
      var r = el("span", "hc-card__rank");
      r.appendChild(el("b", null, String(o.rank)));
      r.appendChild(el("span", null, o.rankName || ""));
      card.appendChild(r);
    }
    var plate = el("span", "hc-card__plate");
    plate.appendChild(el("strong", null, o.name || ""));
    if (o.line) plate.appendChild(el("em", null, o.line));
    if (o.action) plate.appendChild(el("span", "hc-card__action", o.action));
    card.appendChild(plate);
    return card;
  }
  function onMove(e) {
    var card = e.target.closest && e.target.closest(".hc-card");
    if (!card) return;
    var b = card.getBoundingClientRect();
    var x = (e.clientX - b.left) / b.width, y = (e.clientY - b.top) / b.height;
    card.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
    card.style.setProperty("--my", (y * 100).toFixed(1) + "%");
    if (!reduce && fine) {
      card.style.setProperty("--ry", ((x - 0.5) * 8).toFixed(2) + "deg");
      card.style.setProperty("--rx", ((0.5 - y) * 8).toFixed(2) + "deg");
    }
  }
  function onLeave(e) {
    var card = e.target.closest && e.target.closest(".hc-card");
    if (!card || (e.relatedTarget && card.contains(e.relatedTarget))) return;
    card.style.removeProperty("--rx"); card.style.removeProperty("--ry");
    card.style.removeProperty("--mx"); card.style.removeProperty("--my");
  }
  // Cards that are not real buttons (Forge look cards) still answer Enter and Space.
  document.addEventListener("keydown", function (e) {
    var t = e.target;
    if ((e.key === "Enter" || e.key === " ") && t.classList && t.classList.contains("hc-card") && t.getAttribute("role") === "button") {
      e.preventDefault();
      t.click();
    }
  });
  document.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("pointerout", onLeave, { passive: true });
  window.HallCard = { make: make };
})();
