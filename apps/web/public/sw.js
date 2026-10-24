/**
 * Q6 (Phase 8) — Service worker cho VCut Studio (PWA).
 *
 * Phạm vi trung thực:
 * - Chỉ cache VỎ GIAO DIỆN cùng origin (HTML/JS/CSS/asset tĩnh) để mở lại app
 *   khi mất mạng sau lần tải đầu. Không cache, không can thiệp:
 *   + bridge local (origin khác, localhost:8787) — render/AI vẫn cần bridge;
 *   + media blob:/data: URL, IndexedDB, API bên ngoài.
 * - Navigation: network-first, rớt mạng thì trả index.html đã cache.
 * - Asset tĩnh /assets/*: cache-first + cập nhật nền (stale-while-revalidate).
 * - Đổi CACHE_NAME mỗi khi đổi chiến lược cache để bản cũ tự dọn.
 */

const CACHE_NAME = "vcut-shell-v1";
const SHELL_URLS = ["./", "./index.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_URLS))
      .catch(() => {
        /* precache thất bại (vd: chạy dev) thì vẫn cài SW, không chặn app */
      })
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

function isSameOrigin(request) {
  try {
    return new URL(request.url).origin === self.location.origin;
  } catch {
    return false;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  // Chỉ xử lý GET cùng origin; mọi thứ khác (bridge, blob, POST) đi thẳng mạng.
  if (request.method !== "GET" || !isSameOrigin(request)) return;

  // Điều hướng trang: mạng trước, rớt mạng trả index.html đã cache.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("./index.html", { ignoreSearch: true })),
    );
    return;
  }

  const url = new URL(request.url);
  const isStaticAsset =
    url.pathname.startsWith("/assets/") ||
    /\.(js|css|woff2?|ttf|png|svg|webp|json)$/.test(url.pathname);

  if (isStaticAsset) {
    // Cache-first + cập nhật nền; mạng lỗi thì dùng cache, hết cách thì lỗi thật.
    event.respondWith(
      caches.match(request, { ignoreSearch: true }).then((cached) => {
        const network = fetch(request)
          .then((res) => {
            if (res && res.ok) {
              const copy = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return res;
          })
          .catch(() => null);
        return cached || network.then((res) => {
          if (!res) throw new Error("offline and not cached: " + url.pathname);
          return res;
        });
      }),
    );
    return;
  }

  // Còn lại (vd: manifest, icon): mạng trước, rớt mạng dùng cache.
  event.respondWith(
    fetch(request).catch(() => caches.match(request, { ignoreSearch: true })),
  );
});
