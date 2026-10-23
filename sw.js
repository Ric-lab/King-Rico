/* Installation support without an offline copy of the wallet or game pages. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.mode !== 'navigate' || url.origin !== self.location.origin || url.pathname.startsWith('/__/')) return;
  event.respondWith(fetch(event.request).catch(() => new Response(`<!doctype html>
    <html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Fortune Circus</title><style>body{margin:0;min-height:100dvh;display:grid;place-content:center;padding:24px;box-sizing:border-box;background:#1d0733;color:#fff3c4;text-align:center;font:20px/1.5 system-ui}button{padding:16px 24px;border:0;border-radius:16px;background:#ffd257;color:#4a1a00;font:700 20px system-ui}</style></head>
    <body><main><h1>Fortune Circus</h1><p>Conecte-se à internet para abrir o jogo<br>e recuperar suas moedas.</p><button onclick="location.reload()">Tentar novamente</button></main></body></html>`, {status:503, headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}})));
});
