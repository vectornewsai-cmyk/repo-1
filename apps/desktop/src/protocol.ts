/**
 * protocol.ts — phục vụ UI web đã build (apps/desktop/dist-web) qua scheme
 * riêng `app://vcut/...` thay vì file://.
 *
 * Vì sao không loadFile thẳng apps/web/dist/index.html: bản build của Vite
 * dùng đường dẫn asset tuyệt đối (/assets/...) nên file:// sẽ gãy; scheme
 * `app` đăng ký dạng standard + secure nên UI vẫn là secure context
 * (crypto.subtle, IndexedDB, localStorage đều chạy) và origin `app://vcut`
 * được bridge chấp nhận ở CORS (xem server/bridge/src/index.js).
 */
import { protocol } from "electron";
import * as fs from "node:fs";
import * as path from "node:path";

export const APP_SCHEME = "app";
export const APP_HOST = "vcut";
export const APP_ORIGIN = `${APP_SCHEME}://${APP_HOST}`;

/** Gọi TRƯỚC app.whenReady() (đầu main.ts). */
export function registerAppSchemePrivileges(): void {
  protocol.registerSchemesAsPrivileged([
    {
      privileges: {
        allowServiceWorkers: false,
        corsEnabled: true,
        standard: true,
        secure: true,
        supportFetchAPI: true,
      },
      scheme: APP_SCHEME,
    },
  ]);
}

const MIME: Record<string, string> = {
  ".css": "text/css",
  ".gif": "image/gif",
  ".html": "text/html",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript",
  ".json": "application/json",
  ".mjs": "text/javascript",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".wasm": "application/wasm",
  ".webmanifest": "application/manifest+json",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

/** Thư mục chứa UI web đã build, phục vụ qua app:// (bản sao của apps/web/dist). */
export function webDistDir(): string {
  return path.join(__dirname, "..", "dist-web");
}

export function registerAppProtocol(): void {
  const root = webDistDir();
  protocol.handle(APP_SCHEME, async (request) => {
    try {
      const url = new URL(request.url);
      let rel = decodeURIComponent(url.pathname);
      if (rel === "/" || rel === "") rel = "/index.html";
      // Chặn path traversal: file yêu cầu phải nằm trong dist-web.
      const filePath = path.normalize(path.join(root, rel));
      if (!filePath.startsWith(root + path.sep) && filePath !== root) {
        return new Response("Forbidden", { status: 403 });
      }
      const data = await fs.promises.readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      return new Response(data, {
        headers: { "content-type": MIME[ext] ?? "application/octet-stream" },
        status: 200,
      });
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === "ENOENT" || code === "EISDIR") {
        return new Response("Not found", { status: 404 });
      }
      return new Response("Internal error", { status: 500 });
    }
  });
}
