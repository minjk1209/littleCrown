// Little Crown - 오프라인 서비스 워커
//
// CACHE 이름의 숫자를 올리면 기존 캐시를 버리고 새로 받는다.
// 게임을 수정한 뒤에는 반드시 올려야 폰에 반영된다.
const CACHE = 'littlecrown-v10';

const ASSETS = [
  './index.html',
  './littleCrown.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// 캐시 우선. 비행기모드에서도 캐시에 있으면 바로 뜨고,
// 네트워크가 되면 백그라운드로 최신본을 받아 캐시를 갱신한다.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((res) => {
        if (res && res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => {
        // 오프라인인데 캐시에도 없는 경우: 페이지 이동이면 게임 화면으로 보낸다.
        if (req.mode === 'navigate') return caches.match('./littleCrown.html');
        return undefined;
      });

      return cached || network;
    })
  );
});
