/* HEAVY IS THE CROWN — Design gallery.
   Save/load/delete custom designs with thumbnails (localStorage). */
(function () {
  "use strict";
  var KEY = "hitc-workbench-designs-v1";

  function all() {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
    catch (e) { return []; }
  }
  function persist(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {}
  }

  function capture() {
    var design = {
      id: "d" + Date.now().toString(36),
      name: "Design " + (all().length + 1),
      ts: Date.now(),
      chassis: WB.state.chassis,
      material: WB.state.material,
      detail: WB.state.detail,
      polish: WB.state.polish,
      glow: WB.state.glow,
      cape: { on: WB_CAPE.state.on, fabric: WB_CAPE.state.fabric },
      pieceMats: {},
      sculpt: null,
      thumb: null
    };
    // piece materials
    Object.keys(WB._pieceMats || {}).forEach(function (k) {
      if (k.indexOf(design.chassis + ":") === 0) design.pieceMats[k] = WB._pieceMats[k];
    });
    // sculpt offsets
    var g = WB_SCULPT._get(WB.state.chassis, "full");
    if (g && Object.keys(g.pts).length) {
      design.sculpt = { cols: g.cols, rows: g.rows, pts: g.pts };
    }
    // thumbnail from hyperreal canvas
    try {
      var src = document.getElementById("wbHyperreal");
      var t = document.createElement("canvas");
      t.width = 120; t.height = 160;
      var tx = t.getContext("2d");
      // draw current composite (respect materialize by drawing hyperreal)
      tx.drawImage(src, 0, 0, 120, 160);
      design.thumb = t.toDataURL("image/jpeg", 0.7);
    } catch (e) {}
    return design;
  }

  function save(design) {
    var list = all();
    list.unshift(design);
    if (list.length > 24) list = list.slice(0, 24);
    persist(list);
    return list;
  }

  function remove(id) {
    persist(all().filter(function (d) { return d.id !== id; }));
  }

  function apply(design) {
    // chassis + material
    WB.set("chassis", design.chassis);
    document.querySelectorAll("#chassisPick button").forEach(function (b) {
      b.classList.toggle("active", b.dataset.c === design.chassis);
    });
    WB.set("material", design.material);
    document.querySelectorAll("#matPick button").forEach(function (b) {
      b.classList.toggle("active", b.dataset.m === design.material);
    });
    // sliders
    ["detail", "polish", "glow"].forEach(function (k) {
      WB.state[k] = design[k];
    });
    var map = { detail: "rDetail", polish: "rPolish", glow: "rGlow" };
    Object.keys(map).forEach(function (k) {
      var el = document.getElementById(map[k]);
      if (el) {
        el.value = Math.round(design[k] * 100);
        var lbl = document.getElementById("v" + k.charAt(0).toUpperCase() + k.slice(1));
        if (lbl) lbl.textContent = Math.round(design[k] * 100) + "%";
      }
    });
    // cape
    if (design.cape.on !== WB_CAPE.state.on) document.getElementById("capeToggle").click();
    if (design.cape.fabric) {
      WB_CAPE.setFabric(design.cape.fabric);
      document.querySelectorAll("#capePick button").forEach(function (b) {
        b.classList.toggle("active", b.dataset.f === design.cape.fabric);
      });
    }
    // piece materials
    WB._clearPieceMats(design.chassis);
    Object.keys(design.pieceMats || {}).forEach(function (k) {
      var pk = k.split(":")[1];
      WB.setPieceMaterial(design.chassis, pk, design.pieceMats[k]);
    });
    // sculpt
    WB_SCULPT.reset(WB.state.chassis, "full");
    WB._clearBake(WB.state.chassis);
    if (design.sculpt) {
      var g = WB_SCULPT.getGrid(design.chassis, "full", design.sculpt.cols, design.sculpt.rows);
      g.pts = JSON.parse(JSON.stringify(design.sculpt.pts));
      WB._bakeSculpt(design.chassis);
    }
    WB.draw();
  }

  // expose internals needed
  window.WB_GALLERY = {
    all: all, capture: capture, save: save, remove: remove, apply: apply
  };
})();
