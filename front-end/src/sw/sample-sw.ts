// const sw = self as unknown as ServiceWorkerGlobalScope & typeof globalThis;
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
      ],
    },
  ),
);

import "./sw-push.ts";
