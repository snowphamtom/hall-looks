// HEAVY IS THE CROWN: offline support. Network first for pages (always fresh when online),
// cache first for pictures, fonts, scripts and styles that carry a version tag.
// inferno/ is left to the network untouched.
var CACHE = "hic-v7";
var SHELL = ["./", "./index.html", "./styles.css?v=p0l1sh06", "./card.css?v=p0l1sh06", "./nav.js", "./card.js", "./favicon.svg"];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).catch(function () {}).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  // Upgrade: drop every older cache, take control at once, and reload open
  // windows one time so a page served by the previous worker picks up new CSS.
  e.waitUntil(caches.keys().then(function (ks) {
    var old = ks.filter(function (k) { return k !== CACHE; });
    return Promise.all(old.map(function (k) { return caches.delete(k); })).then(function () { return old.length; });
  }).then(function (upgraded) {
    return self.clients.claim().then(function () {
      if (!upgraded) return;
      return self.clients.matchAll({ type: "window" }).then(function (cs) {
        cs.forEach(function (c) { if (c.navigate) c.navigate(c.url).catch(function () {}); });
      });
    });
  }));
});
self.addEventListener("fetch", function (e) {
  var r = e.request, u = new URL(r.url);
  if (r.method !== "GET") return;
  var scope = new URL(self.registration.scope);
  if (u.origin === scope.origin && u.pathname.indexOf(scope.pathname + "inferno/") === 0) return;
  if (/\.(webm|mp4)$/.test(u.pathname)) return; // video: leave range requests to the network
  var media = /\.(png|jpe?g|webp|avif|svg|woff2?|mp3)$/.test(u.pathname) || u.host.indexOf("fonts.g") === 0 || /[?&]v=/.test(u.search);
  if (media) {
    e.respondWith(caches.match(r).then(function (hit) {
      return hit || fetch(r).then(function (res) {
        if (res.ok || res.type === "opaque") { var cp = res.clone(); caches.open(CACHE).then(function (c) { c.put(r, cp); }); }
        return res;
      });
    }));
    return;
  }
  if (u.origin !== scope.origin) return;
  // Pages and unversioned scripts revalidate with the server, never the HTTP cache.
  e.respondWith(fetch(r, { cache: "no-cache" }).then(function (res) {
    if (res.ok) { var cp = res.clone(); caches.open(CACHE).then(function (c) { c.put(r, cp); }); }
    return res;
  }).catch(function () { return caches.match(r).then(function (hit) { return hit || caches.match("./"); }); }));
});
