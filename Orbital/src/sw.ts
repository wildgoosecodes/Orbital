/// <reference lib="webworker" />
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

// registerType: 'prompt' means a new worker deliberately sits in 'waiting'
// instead of auto-activating — UpdateToast's "Update" button messages this
// worker to skip that wait once the user actually asks for it.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

// App reads/writes live Supabase data — never let the SW serve a stale API response
// for a same-origin path (Supabase itself is a different origin, so this is defensive).
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('index.html'), {
    denylist: [/^\/rest\//, /^\/auth\//, /^\/functions\//],
  }),
);

interface PushPayload {
  title?: string;
  body?: string;
  url?: string;
}

self.addEventListener('push', (event) => {
  const data: PushPayload = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Orbital', {
      body: data.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: { url: data.url ?? '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data as { url?: string } | undefined)?.url ?? '/';
  event.waitUntil(self.clients.openWindow(url));
});
