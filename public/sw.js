const C = 'sanma-5da9736ec42c';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  // 小さなサーバー（意見・ルール・週間ポイント）と開発者ページは保存しない
  if (url.pathname.startsWith('/api/') || url.pathname.endsWith('/admin.html')) return;
  // 版の確認は必ずネットへ（保存しない）
  if (url.pathname.endsWith('/version.json')) { e.respondWith(fetch(e.request, { cache: 'no-store' })); return; }
  const nav = e.request.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html');
  const req = nav ? new Request(url.origin + url.pathname, { cache: 'no-store' }) : e.request;
  e.respondWith(fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(C).then(c => c.put(nav ? './index.html' : e.request, cp)); } return r; })
    .catch(() => caches.match(nav ? './index.html' : e.request).then(m => m || caches.match('./index.html'))));
});
