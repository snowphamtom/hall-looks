// Phone nav: fold the page links behind a Menu button at narrow widths.
(function () {
  var nav = document.querySelector(".nav");
  var btn = nav && nav.querySelector(".nav-toggle");
  if (!nav || !btn) return;
  nav.setAttribute("data-collapsible", "");
  btn.addEventListener("click", function () {
    var open = !nav.classList.contains("open");
    nav.classList.toggle("open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    btn.textContent = open ? "Close" : "Menu";
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("open")) { btn.click(); btn.focus(); }
  });
})();
