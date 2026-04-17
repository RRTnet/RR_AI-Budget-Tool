// This service worker exists only to unregister itself.
// It replaces the stale Vite dev-mode service worker that was
// left behind when switching from dev server to production.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.registration.unregister());
