// const sw = self as unknown as ServiceWorkerGlobalScope & typeof globalThis;
/// <reference lib="WebWorker" />
declare let self: ServiceWorkerGlobalScope & typeof globalThis;

import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import { clientsClaim } from "workbox-core";
// Helper for NavigationRoute
import { createHandlerBoundToURL } from "workbox-precaching";

// 1. Skip waiting and claim clients immediately
self.skipWaiting();
clientsClaim();

// 2. Precache all assets injected by vite-plugin-pwa
// sw.__WB_MANIFEST is automatically populated by the plugin
precacheAndRoute(self.__WB_MANIFEST);

// 3. Cleanup old caches
cleanupOutdatedCaches();

// 4. Handle navigation requests (SPA fallback)
// This ensures deep links and page refreshes work offline
registerRoute(
  new NavigationRoute(
    createHandlerBoundToURL("index.html"), // Adjust if your entry point is different
    {
      // Exclude API routes or other non-HTML resources from fallback
      denylist: [
        new RegExp("/api/"), // Example: exclude API calls
        /workbox-.*\.js$/, // Exclude Workbox scripts
        /^\/manifest\.webmanifest$/,
      ],
    },
  ),
);

self.addEventListener("push", onPush);

self.addEventListener("notificationclick", onNotificationClick);
const options = {
  icon: "/icon.svg",
  badge: "/icon.svg",
};
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
      ...options,
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
