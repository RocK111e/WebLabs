const CACHE_NAME = "pwa-cache-v2";
const ASSETS = [
    "/index.html",
    "/dashboard.html",
    "/task.html",
    "/message.html",
    "/css/style.css",
    "/css/modals.css",
    "/icons/bell.png",
    "/icons/delete.png",
    "/icons/pencil.png",
    "/icons/user.png",
    "/icons/icon512.png",
    "/js/app.js",
    "/js/button.js",
    "/js/checkbox.js",
    "/js/sw.js",
    "/json/manifest.json",
];

// Встановлення Service Worker та кешування файлів
self.addEventListener("install", (event) => {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        console.log('Caching files');
        return Promise.all(
          ASSETS.map((asset) => {
            return fetch(asset)
              .then((response) => {
                if (!response.ok) {
                  console.warn(`Failed to fetch ${asset}: ${response.status}`);
                  return; // Skip caching this asset
                }
                return cache.put(asset, response);
              })
              .catch((err) => {
                console.error(`Error caching ${asset}: ${err}`);
              });
          })
        ).then(() => console.log('Caching complete'));
      }).catch((err) => console.error('Install failed:', err))
    );
  });
  
  // Перехоплення запитів і завантаження з кешу
  self.addEventListener('fetch', event => {
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
        .catch(() => caches.match('/offline.html'))
    );
  });
  
  // Оновлення Service Worker і видалення старого кешу
  self.addEventListener("activate", (event) => {
    console.log('Updating cache');
    event.waitUntil(
      caches
        .keys()
        .then((keys) => {
          return Promise.all(
            keys
              .filter((key) => key !== CACHE_NAME)
              .map((key) => caches.delete(key))
          );
        })
        .then(() => {
          return self.clients.claim(); // Підключаємо новий SW до всіх вкладок
        })
    );
  });