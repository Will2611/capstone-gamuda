// src/sw/sw-push.ts
// const sw = self as unknown as ServiceWorkerGlobalScope & typeof globalThis;
declare let self: ServiceWorkerGlobalScope & typeof globalThis;

self.addEventListener("push", onPush);

async function onPush(event: PushEvent) {
  if (event.data) {
    const data = event.data.json();
    const { title, ...rest } = data;

    // Send the push data to the application
    const clients = await self.clients.matchAll();
    clients.forEach((client) => client.postMessage(data));

    await event.waitUntil(
      self.registration.showNotification(title, {
        ...rest,
      }),
    );
  }
}
