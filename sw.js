const CACHE_NAME = "pwa-cache-v4";
const ASSETS = [
    "/WebLabs/index.html",
    "/WebLabs/dashboard.html",
    "/WebLabs/task.html",
    "/WebLabs/message.html",
    "/WebLabs/css/style.css",
    "/WebLabs/css/modals.css",
    "/WebLabs/icons/bell.png",
    "/WebLabs/icons/delete.png",
    "/WebLabs/icons/pencil.png",
    "/WebLabs/icons/user.png",
    "/WebLabs/icons/icon192.png",
    "/WebLabs/app.js",
    "/WebLabs/js/button.js",
    "/WebLabs/js/checkbox.js",
    "/WebLabs/js/validation.js",
    "/WebLabs/sw.js",
    "/WebLabs/json/manifest.json"
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