// proxyAuto.test.ts — test shouldAutoProxy (Phase 9 R3).
// Chạy: node --experimental-strip-types apps/web/src/lib/proxyAuto.test.ts
import assert from "node:assert/strict";
import { proxyPathFromUrl, shouldAutoProxy, checkProxyAlive } from "./proxy.ts";
import type { MediaItem } from "../media.ts";

let pass = 0;
let fail = 0;
function ok(name: string, fn: () => void) {
  try {
    fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    fail++;
    console.error(`  ✗ ${name}: ${e instanceof Error ? e.message : e}`);
  }
}

const video = (over: Partial<MediaItem> = {}): MediaItem => ({
  id: "m1",
  name: "a.mp4",
  kind: "video",
  url: "blob:x",
  duration: 10,
  file: new File(["x"], "a.mp4", { type: "video/mp4" }),
  ...over,
});

console.log("== shouldAutoProxy ==");
ok("video 1080p + bật tự động -> tạo", () => {
  assert.equal(shouldAutoProxy(video({ height: 1080 }), true), true);
});
ok("tắt tự động -> không tạo", () => {
  assert.equal(shouldAutoProxy(video({ height: 1080 }), false), false);
});
ok("video 720p đã đủ nhỏ -> không tạo", () => {
  assert.equal(shouldAutoProxy(video({ height: 720 }), true), false);
});
ok("video 480p -> không tạo", () => {
  assert.equal(shouldAutoProxy(video({ height: 480 }), true), false);
});
ok("chưa biết chiều cao -> vẫn thử (bridge quyết)", () => {
  assert.equal(shouldAutoProxy(video({}), true), true);
});
ok("đã có proxy -> không tạo lại", () => {
  assert.equal(shouldAutoProxy(video({ height: 1080, proxyUrl: "http://x/p.mp4" }), true), false);
});
ok("không có File gốc -> không tạo", () => {
  const v = video({ height: 1080 });
  delete (v as Partial<MediaItem>).file;
  assert.equal(shouldAutoProxy(v, true), false);
});
ok("ảnh/audio -> không tạo", () => {
  assert.equal(shouldAutoProxy(video({ kind: "image", height: 2000 }), true), false);
  assert.equal(shouldAutoProxy(video({ kind: "audio" }), true), false);
});

console.log("== proxyPathFromUrl (đợt 53 J5) ==");
ok("URL đầy đủ (cổng 8787) -> tách path", () => {
  assert.equal(
    proxyPathFromUrl("http://127.0.0.1:8787/api/proxy/file/clip__proxy_720p.mp4"),
    "/api/proxy/file/clip__proxy_720p.mp4",
  );
});
ok("URL đầy đủ (cổng khác 8788) -> tách path (không kẹt cổng cũ)", () => {
  assert.equal(
    proxyPathFromUrl("http://127.0.0.1:8788/api/proxy/file/clip__proxy_720p.mp4"),
    "/api/proxy/file/clip__proxy_720p.mp4",
  );
});
ok("đã là path -> trả nguyên", () => {
  assert.equal(
    proxyPathFromUrl("/api/proxy/file/clip__proxy_720p.mp4"),
    "/api/proxy/file/clip__proxy_720p.mp4",
  );
});
ok("path encode %20 -> giữ nguyên", () => {
  assert.equal(
    proxyPathFromUrl("http://127.0.0.1:8787/api/proxy/file/my%20clip__proxy_480p.mp4"),
    "/api/proxy/file/my%20clip__proxy_480p.mp4",
  );
});
ok("URL gốc / blob / rỗng / undefined -> null", () => {
  assert.equal(proxyPathFromUrl("blob:http://x/abc"), null);
  assert.equal(proxyPathFromUrl("http://127.0.0.1:8787/api/proxy/file/"), null);
  assert.equal(proxyPathFromUrl("/api/proxy/file/../../x.mp4"), null);
  assert.equal(proxyPathFromUrl("/api/proxy/file/clip.webm"), null);
  assert.equal(proxyPathFromUrl(""), null);
  assert.equal(proxyPathFromUrl(undefined), null);
  assert.equal(proxyPathFromUrl(null), null);
});

console.log("== checkProxyAlive (đợt 54 K7) ==");
async function asyncOk(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    fail++;
    console.error(`  ✗ ${name}: ${e instanceof Error ? e.message : e}`);
  }
}
const stubFetch = (status: number) =>
  (async () => ({ status })) as unknown as typeof fetch;
const throwingFetch = (async () => {
  throw new Error("mất mạng");
}) as unknown as typeof fetch;
const PROXY_URL = "http://127.0.0.1:8787/api/proxy/file/clip__proxy_720p.mp4";
await asyncOk("HEAD 200 -> alive", async () => {
  assert.equal(await checkProxyAlive(PROXY_URL, stubFetch(200)), "alive");
});
await asyncOk("HEAD 204/301 -> alive", async () => {
  assert.equal(await checkProxyAlive(PROXY_URL, stubFetch(204)), "alive");
  assert.equal(await checkProxyAlive(PROXY_URL, stubFetch(301)), "alive");
});
await asyncOk("HEAD 404 -> missing (chết chắc)", async () => {
  assert.equal(await checkProxyAlive(PROXY_URL, stubFetch(404)), "missing");
});
await asyncOk("HEAD 500 -> unknown (không kết luận stale)", async () => {
  assert.equal(await checkProxyAlive(PROXY_URL, stubFetch(500)), "unknown");
});
await asyncOk("fetch throw (bridge tắt) -> unknown, không gỡ oan", async () => {
  assert.equal(await checkProxyAlive(PROXY_URL, throwingFetch), "unknown");
});
await asyncOk("fetch không phải hàm -> unknown", async () => {
  assert.equal(
    await checkProxyAlive(PROXY_URL, null as unknown as typeof fetch),
    "unknown",
  );
});
await asyncOk("URL rỗng -> unknown", async () => {
  assert.equal(await checkProxyAlive("", stubFetch(200)), "unknown");
});

console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
process.exit(fail === 0 ? 0 : 1);
