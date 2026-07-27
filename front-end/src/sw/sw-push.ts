// src/sw/sw-push.ts
/// <reference lib="WebWorker" />
// const sw = self as unknown as ServiceWorkerGlobalScope & typeof globalThis;
declare let self: ServiceWorkerGlobalScope & typeof globalThis;

self.addEventListener("push", onPush);

self.addEventListener("notificationclick", onNotificationClick);

async function onPush(event: PushEvent) {
  if (!event.data) {
    return;
  }
  const data = event.data.json();
  const { title, ...rest } = data;

  // Send the push data to the application
  const clients = await self.clients.matchAll();
  clients.forEach((client) => client.postMessage(data));

  event.waitUntil(
    self.registration.showNotification(title || "New Notification", {
      ...rest,
    }),
  );
}

async function onNotificationClick(event: NotificationEvent) {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there is already a window open
        for (const client of windowClients) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        // Open a new window if none exists
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      }),
  );
}
