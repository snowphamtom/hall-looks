// Small, real device feedback only. Desktop browsers stay silent.
(function () {
  function canPulse() {
    if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return false;
    const coarse = typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
    return Boolean(navigator.maxTouchPoints > 0 || coarse);
  }
  window.heavyPulse = function (duration) {
    if (!canPulse()) return false;
    try { return navigator.vibrate(duration || 12); } catch (e) { return false; }
  };
})();
