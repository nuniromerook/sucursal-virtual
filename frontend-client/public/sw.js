// frontend-client/public/sw.js
// Service Worker para Web Push Notifications en segundo plano

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Listener de eventos Push enviados desde el servidor (VAPID)
self.addEventListener("push", (event) => {
  console.log("🔔 [Service Worker] Evento Push recibido:", event);

  let data = {
    title: "Abastecedora Valette",
    body: "Tenés una nueva actualización de tu pedido.",
    url: "/",
    icon: "/favicon.svg",
    badge: "/favicon.svg",
  };

  if (event.data) {
    try {
      const json = event.data.json();
      data = { ...data, ...json };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || "/favicon.svg",
    badge: data.badge || "/favicon.svg",
    vibrate: [200, 100, 200],
    data: {
      url: data.url || "/",
    },
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Listener al hacer clic en la notificación
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Si ya hay una ventana abierta de la app, enfocarla y navegar
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // Si no hay ventana abierta, abrir una nueva
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
