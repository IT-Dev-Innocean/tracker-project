self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Membiarkan browser menangani cache secara dinamis.
  // Ini hanya sebagai syarat minimal (dummy) agar browser mengenali aplikasi sebagai PWA Installable.
});
