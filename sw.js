// Service worker: lưu toàn bộ phần mềm vào máy để dùng offline.
// Khi sửa phần mềm, tăng số phiên bản VERSION để máy tải bản mới.
const VERSION = 'xlths-v1';
const ASSETS = [
  "./",
  "index.html",
  "tich-chap.html",
  "day-tin-hieu.html",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/maskable-512.png",
  "icons/apple-touch-icon.png",
  "icons/favicon-32.png",
  "fonts/be-vietnam-pro-latin-400-normal.woff2",
  "fonts/be-vietnam-pro-latin-500-normal.woff2",
  "fonts/be-vietnam-pro-latin-600-normal.woff2",
  "fonts/be-vietnam-pro-latin-700-normal.woff2",
  "fonts/be-vietnam-pro-latin-800-normal.woff2",
  "fonts/be-vietnam-pro-latin-ext-400-normal.woff2",
  "fonts/be-vietnam-pro-latin-ext-500-normal.woff2",
  "fonts/be-vietnam-pro-latin-ext-600-normal.woff2",
  "fonts/be-vietnam-pro-latin-ext-700-normal.woff2",
  "fonts/be-vietnam-pro-latin-ext-800-normal.woff2",
  "fonts/be-vietnam-pro-vietnamese-400-normal.woff2",
  "fonts/be-vietnam-pro-vietnamese-500-normal.woff2",
  "fonts/be-vietnam-pro-vietnamese-600-normal.woff2",
  "fonts/be-vietnam-pro-vietnamese-700-normal.woff2",
  "fonts/be-vietnam-pro-vietnamese-800-normal.woff2",
  "fonts/fonts.css",
  "fonts/jetbrains-mono-greek-400-normal.woff2",
  "fonts/jetbrains-mono-greek-600-normal.woff2",
  "fonts/jetbrains-mono-greek-700-normal.woff2",
  "fonts/jetbrains-mono-latin-400-normal.woff2",
  "fonts/jetbrains-mono-latin-600-normal.woff2",
  "fonts/jetbrains-mono-latin-700-normal.woff2",
  "fonts/jetbrains-mono-latin-ext-400-normal.woff2",
  "fonts/jetbrains-mono-latin-ext-600-normal.woff2",
  "fonts/jetbrains-mono-latin-ext-700-normal.woff2",
  "fonts/jetbrains-mono-vietnamese-400-normal.woff2",
  "fonts/jetbrains-mono-vietnamese-600-normal.woff2",
  "fonts/jetbrains-mono-vietnamese-700-normal.woff2"
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Lấy từ bộ nhớ máy trước (chạy được khi mất mạng), đồng thời cập nhật ngầm nếu có mạng.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(async cache => {
    const hit = await cache.match(req, { ignoreSearch: true });
    const net = fetch(req).then(res => {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    const res = await net;
    if (res) return res;
    if (req.mode === 'navigate') return (await cache.match('index.html')) || Response.error();
    return Response.error();
  }));
});
