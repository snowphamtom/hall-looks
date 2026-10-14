// HEAVY IS THE CROWN: offline support. Network first for pages (always fresh when online),
// cache first for pictures, fonts, scripts and styles that carry a version tag.
// inferno/ is left to the network untouched.
var CACHE = "hic-v4";
var SHELL = ["./", "./index.html", "./styles.css?v=p0l1sh04", "./card.css?v=p0l1sh04", "./nav.js", "./card.js", "./favicon.svg"];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).catch(function () {}).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var r = e.request, u = new URL(r.url);
  if (r.method !== "GET") return;
  var scope = new URL(self.registration.scope);
  if (u.origin === scope.origin && u.pathname.indexOf(scope.pathname + "inferno/") === 0) return;
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
  e.respondWith(fetch(r).then(function (res) {
    if (res.ok) { var cp = res.clone(); caches.open(CACHE).then(function (c) { c.put(r, cp); }); }
    return res;
  }).catch(function () { return caches.match(r).then(function (hit) { return hit || caches.match("./"); }); }));
});
