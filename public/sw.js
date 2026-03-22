// public/sw.js
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
});

// Wajib ada event fetch minimal seperti ini agar PWA dianggap valid
self.addEventListener('fetch', (event) => {
  // Biarkan request lewat begitu saja (Online-only)
  return;
});