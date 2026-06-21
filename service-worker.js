// ============================================================
// SERVICE WORKER - Planning des conseillers SHH
// Rend l'application installable et prépare les notifications push
// ============================================================

const CACHE_NAME = "planning-shh-v1";
const FILES_TO_CACHE = [
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// Installation : met en cache les fichiers essentiels
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activation : nettoie les anciens caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Interception réseau : sert depuis le cache si hors-ligne, sinon réseau
self.addEventListener("fetch", (event) => {
  // Ne jamais mettre en cache les appels à l'API Google (toujours du direct)
  if (event.request.url.includes("script.google.com")) {
    return;
  }
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// ============================================================
// NOTIFICATIONS PUSH (prêt pour la prochaine étape avec Firebase)
// ============================================================
self.addEventListener("push", (event) => {
  let data = { title: "Planning SHH", body: "Nouvel événement ajouté !" };
  try {
    if (event.data) data = event.data.json();
  } catch (e) {}

  const options = {
    body: data.body,
    icon: "./icons/icon-192.png",
    badge: "./icons/icon-192.png",
    vibrate: [100, 50, 100],
    data: { url: data.url || "./index.html" }
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Clic sur la notification : ouvre l'application
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("index.html") && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url || "./index.html");
      }
    })
  );
});
