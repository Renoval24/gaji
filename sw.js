// Service worker: cache aplikasi agar bisa dibuka offline.
// Naikkan nomor VERSI setiap kali file aplikasi diperbarui.
const VERSI = 'rekap-gaji-v1';
const FILE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSI).then(c => c.addAll(FILE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== VERSI).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Jangan cache panggilan ke Gemini / domain lain
  if (url.origin !== location.origin) return;

  // Halaman: coba jaringan dulu (agar update cepat), jatuh ke cache bila offline
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(res => {
        const salin = res.clone();
        caches.open(VERSI).then(c => c.put('./index.html', salin));
        return res;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }
  // File lain: cache dulu
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      const salin = res.clone();
      caches.open(VERSI).then(c => c.put(req, salin));
      return res;
    }))
  );
});
