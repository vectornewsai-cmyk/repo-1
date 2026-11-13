// proxyAuto.test.ts — test shouldAutoProxy (Phase 9 R3).
// Chạy: node --experimental-strip-types apps/web/src/lib/proxyAuto.test.ts
import assert from "node:assert/strict";
import { proxyPathFromUrl, shouldAutoProxy, checkProxyAlive, parseProxyHeight, autoProxySkipReason, previewUrlFor, isUsingProxy, proxyBadgeLabel, PROXY_RETRY_MAX_ATTEMPTS, proxyRetryDelayMs, proxyRetryExhausted, isBridgeDownError, clampProxyProgress, parseProxyJobStatus, proxyJobDoneResult } from "./proxy.ts";
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

console.log("== shouldAutoProxy + targetHeight (đợt 84 L9) ==");
ok("đích 480: video 1080p -> tạo", () => {
  assert.equal(shouldAutoProxy(video({ height: 1080 }), true, 480), true);
});
ok("đích 480: video 720p (>480) -> tạo", () => {
  assert.equal(shouldAutoProxy(video({ height: 720 }), true, 480), true);
});
ok("đích 480: video 480p -> không tạo", () => {
  assert.equal(shouldAutoProxy(video({ height: 480 }), true, 480), false);
});
ok("mặc định (không truyền đích) vẫn là 720 như cũ", () => {
  assert.equal(shouldAutoProxy(video({ height: 720 }), true), false);
  assert.equal(shouldAutoProxy(video({ height: 1080 }), true), true);
});

console.log("== parseProxyHeight (đợt 84 L9) ==");
ok("480 số/chuỗi -> 480; 720 -> 720", () => {
  assert.equal(parseProxyHeight(480), 480);
  assert.equal(parseProxyHeight("480"), 480);
  assert.equal(parseProxyHeight(720), 720);
  assert.equal(parseProxyHeight("720"), 720);
});
ok("giá trị lạ -> mặc định 720", () => {
  assert.equal(parseProxyHeight(1080), 720);
  assert.equal(parseProxyHeight("abc"), 720);
  assert.equal(parseProxyHeight(undefined), 720);
  assert.equal(parseProxyHeight(null), 720);
});

console.log("== autoProxySkipReason (đợt 84 L9) ==");
ok("nên tạo -> null", () => {
  assert.equal(autoProxySkipReason(video({ height: 1080 }), true, 720), null);
});
ok("tắt -> disabled", () => {
  assert.equal(autoProxySkipReason(video({ height: 1080 }), false), "disabled");
});
ok("ảnh -> not-video", () => {
  assert.equal(autoProxySkipReason(video({ kind: "image", height: 2000 }), true), "not-video");
});
ok("mất File gốc -> no-original-file (trường hợp cần báo user)", () => {
  const v = video({ height: 1080 });
  delete (v as Partial<MediaItem>).file;
  assert.equal(autoProxySkipReason(v, true), "no-original-file");
});
ok("đã có proxy -> already-has-proxy", () => {
  assert.equal(autoProxySkipReason(video({ height: 1080, proxyUrl: "http://x/p.mp4" }), true), "already-has-proxy");
});
ok("đã đủ nhỏ theo đích -> already-small", () => {
  assert.equal(autoProxySkipReason(video({ height: 480 }), true, 720), "already-small");
  assert.equal(autoProxySkipReason(video({ height: 720 }), true, 480), null);
});

console.log("== preview dùng proxy / export dùng gốc (đợt 84 L9) ==");
ok("chưa có proxy -> preview phát file gốc", () => {
  assert.equal(previewUrlFor(video({ height: 1080 })), "blob:x");
  assert.equal(isUsingProxy(video({ height: 1080 })), false);
  assert.equal(proxyBadgeLabel(video({ height: 1080 })), "");
});
ok("đã gắn proxy -> preview phát proxy, badge đúng chiều cao", () => {
  const v = video({ height: 1080, proxyUrl: "http://127.0.0.1:8787/api/proxy/file/a__proxy_720p.mp4", proxyHeight: 720 });
  assert.equal(previewUrlFor(v), "http://127.0.0.1:8787/api/proxy/file/a__proxy_720p.mp4");
  assert.equal(isUsingProxy(v), true);
  assert.equal(proxyBadgeLabel(v), "PROXY 720p");
});
ok("proxy 480 -> badge 480p", () => {
  assert.equal(proxyBadgeLabel(video({ height: 1080, proxyUrl: "http://x/p.mp4", proxyHeight: 480 })), "PROXY 480p");
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

console.log("== proxy retry backoff + bridge-down (đợt 85 M8) ==");
ok("MAX_ATTEMPTS = 5 (lần đầu + 4 lần thử lại)", () => {
  assert.equal(PROXY_RETRY_MAX_ATTEMPTS, 5);
});
ok("backoff 5s, 10s, 20s, 40s, 80s — nhân đôi, kẹp 120s", () => {
  assert.equal(proxyRetryDelayMs(1), 5000);
  assert.equal(proxyRetryDelayMs(2), 10000);
  assert.equal(proxyRetryDelayMs(3), 20000);
  assert.equal(proxyRetryDelayMs(4), 40000);
  assert.equal(proxyRetryDelayMs(5), 80000);
  assert.equal(proxyRetryDelayMs(6), 120000);
  assert.equal(proxyRetryDelayMs(99), 120000);
  assert.equal(proxyRetryDelayMs(0), 5000);
  assert.equal(proxyRetryDelayMs(-3), 5000);
});
ok("exhausted khi attempts >= 5, chưa đủ thì chưa", () => {
  assert.equal(proxyRetryExhausted(4), false);
  assert.equal(proxyRetryExhausted(5), true);
  assert.equal(proxyRetryExhausted(6), true);
  assert.equal(proxyRetryExhausted(0), false);
});
ok("fetch TypeError / Failed to fetch / NetworkError -> bridge tắt", () => {
  assert.equal(isBridgeDownError(new TypeError("Failed to fetch")), true);
  assert.equal(isBridgeDownError(new Error("NetworkError when attempting to fetch resource.")), true);
  assert.equal(isBridgeDownError(new Error("Load failed")), true);
  assert.equal(isBridgeDownError(new Error("Network request failed")), true);
});
ok("502/503/504 -> bridge tắt; 400/404/500 encode -> KHÔNG retry", () => {
  assert.equal(isBridgeDownError({ status: 502 }), true);
  assert.equal(isBridgeDownError({ status: 503 }), true);
  assert.equal(isBridgeDownError({ status: 504 }), true);
  assert.equal(isBridgeDownError({ status: 400 }), false);
  assert.equal(isBridgeDownError({ status: 404 }), false);
  assert.equal(isBridgeDownError({ status: 500 }), false);
  assert.equal(isBridgeDownError(new Error("Tạo proxy thất bại: ffmpeg exit 1")), false);
});
ok("lỗi encode / lỗi thường -> không retry", () => {
  assert.equal(isBridgeDownError(new Error("Proxy height phải là 480 hoặc 720.")), false);
  assert.equal(isBridgeDownError("chuỗi lạ"), false);
  assert.equal(isBridgeDownError(null), false);
  assert.equal(isBridgeDownError(undefined), false);
});

console.log("== proxy job progress parse (đợt 85 M8) ==");
ok("clamp %: 0..100, làm tròn xuống, lạ -> 0", () => {
  assert.equal(clampProxyProgress(42.7), 42);
  assert.equal(clampProxyProgress(0), 0);
  assert.equal(clampProxyProgress(100), 100);
  assert.equal(clampProxyProgress(150), 100);
  assert.equal(clampProxyProgress(-5), 0);
  assert.equal(clampProxyProgress("37"), 37);
  assert.equal(clampProxyProgress(NaN), 0);
  assert.equal(clampProxyProgress(undefined), 0);
  assert.equal(clampProxyProgress(null), 0);
});
ok("parse job processing/done/skipped/failed + progress", () => {
  assert.deepEqual(parseProxyJobStatus({ jobId: "j1", status: "processing", progress: 42 }), { jobId: "j1", status: "processing", progress: 42 });
  assert.deepEqual(parseProxyJobStatus({ jobId: "j1", status: "done" }), { jobId: "j1", status: "done", progress: 100 });
  assert.deepEqual(parseProxyJobStatus({ jobId: "j1", status: "skipped", progress: 0 }), { jobId: "j1", status: "skipped", progress: 0 });
  assert.deepEqual(parseProxyJobStatus({ jobId: "j1", status: "failed", progress: 99 }), { jobId: "j1", status: "failed", progress: 99 });
  assert.deepEqual(parseProxyJobStatus({ jobId: "j1", status: "processing", progress: 250 }), { jobId: "j1", status: "processing", progress: 100 });
});
ok("parse job lạ -> null (bridge cũ / sai shape)", () => {
  assert.equal(parseProxyJobStatus(null), null);
  assert.equal(parseProxyJobStatus({}), null);
  assert.equal(parseProxyJobStatus({ jobId: "j1", status: "queued", progress: 10 }), null);
  assert.equal(parseProxyJobStatus({ status: "processing", progress: 10 }), null);
  assert.equal(parseProxyJobStatus({ jobId: "", status: "processing" }), null);
  assert.equal(parseProxyJobStatus("j1"), null);
});
ok("proxyJobDoneResult: done + proxyUrl -> đủ gắn vào store", () => {
  assert.deepEqual(
    proxyJobDoneResult({ jobId: "j1", status: "done", progress: 100, proxyUrl: "/api/proxy/file/a__proxy_720p.mp4", proxyHeight: 720, proxySizeBytes: 123 }),
    { proxyUrl: "/api/proxy/file/a__proxy_720p.mp4", proxyHeight: 720, proxySizeBytes: 123 },
  );
  assert.deepEqual(
    proxyJobDoneResult({ jobId: "j1", status: "done", proxyUrl: "/api/proxy/file/a.mp4" }),
    { proxyUrl: "/api/proxy/file/a.mp4", proxyHeight: 720 },
  );
});
ok("proxyJobDoneResult: processing/skipped/thiếu proxyUrl -> null", () => {
  assert.equal(proxyJobDoneResult({ jobId: "j1", status: "processing", proxyUrl: "/x.mp4" }), null);
  assert.equal(proxyJobDoneResult({ jobId: "j1", status: "skipped" }), null);
  assert.equal(proxyJobDoneResult({ jobId: "j1", status: "done" }), null);
  assert.equal(proxyJobDoneResult(null), null);
});

console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
process.exit(fail === 0 ? 0 : 1);
