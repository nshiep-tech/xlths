// Service worker: lưu toàn bộ phần mềm vào máy để dùng offline.
// Khi sửa phần mềm, tăng số phiên bản VERSION để máy tải bản mới.
const VERSION = 'xlths-v6';
const ASSETS = [
  "./",
  "index.html",
  "tich-chap.html",
  "day-tin-hieu.html",
  "bien-doi-z.html",
  "he-thong-z.html",
  "assets/zcore.js",
  "assets/theme.css",
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

// Trang HTML: lấy bản mới trên mạng trước (để thấy cập nhật ngay), mất mạng thì dùng bản đã lưu.
// Tệp khác (phông, ảnh, script): lấy từ bộ nhớ máy trước, cập nhật ngầm khi có mạng.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const isPage = req.mode === 'navigate' || req.destination === 'document';
  e.respondWith(caches.open(VERSION).then(async cache => {
    const net = fetch(req).then(res => {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    }).catch(() => null);
    if (isPage) {
      const res = await net;
      if (res) return res;
      return (await cache.match(req, { ignoreSearch: true })) || (await cache.match('index.html')) || Response.error();
    }
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) { e.waitUntil(net); return hit; }
    return (await net) || Response.error();
  }));
});
