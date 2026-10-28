const C = 'sanma-a52d9b61d65a';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.endsWith('/admin.html')) return;
  if (url.pathname.endsWith('/version.json')) { e.respondWith(fetch(e.request, { cache: 'no-store' })); return; }
  const nav = e.request.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html');
  if (nav) {
    // 本体：保存してある分をすぐ使う（無ければサーバーから取って保存）
    e.respondWith(caches.open(C).then(c => c.match('./index.html').then(m => m || fetch(new Request(url.origin + url.pathname, { cache: 'no-store' })).then(r => { if (r.ok) c.put('./index.html', r.clone()); return r; }))));
    return;
  }
  e.respondWith(caches.match(e.request).then(m => m || fetch(e.request).then(r => { if (r.ok) { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); } return r; })));
});
