// Service worker mínimo — su único propósito por ahora es cumplir el requisito técnico de
// Chrome/Android para poder ofrecer "Instalar app". No intercepta ni cachea nada todavía
// (eso se puede sumar después, para soporte sin conexión real).
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Pasivo por ahora — deja que cada petición siga su curso normal por la red.
});
