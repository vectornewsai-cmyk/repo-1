// media.fpsProbe94P2.test.ts — Phase 9 đợt 194, luồng P2: fps nguồn đo lúc
// probe import (MediaItem.fps) cho bob luân phiên mode 1.
//
// Bối cảnh: HTMLVideoElement KHÔNG có sẵn thuộc tính fps nên probe phải đo
// bằng requestVideoFrameCallback trong lúc phát (muted, detached):
// fps = ΔpresentedFrames / ΔmediaTime, snap về tốc độ chuẩn gần nhất
// (sai ≤ 0,6 fps — đo trên ~0,5 s chỉ cho ±1–2 fps). Xem media.ts:
// snapVideoFpsEstimate / fpsFromPresentedFrames / probeVideoFps.
// Không có rVFC / video quá ngắn (<0,4 s) / play() bị từ chối → fps
// undefined, bob giữ top field như cũ (không làm chậm import oan).
//
// Chạy bằng esbuild bundle (mẫu T6, chạy từ gốc repo):
//   ./node_modules/.bin/esbuild apps/web/src/media.fpsProbe94P2.test.ts --bundle --format=esm --platform=node --outfile=/tmp/fps-probe-94p2.test.mjs && node /tmp/fps-probe-94p2.test.mjs
// Hoặc chạy cả 4 test media.* cùng lúc:
//   node apps/web/scripts/run-media-tests.mjs
import { fileToMediaItem, fpsFromPresentedFrames, probeVideoFps, snapVideoFpsEstimate } from "./media";
import { SAMPLE_MEDIA_FPS } from "./sample";

/** Khai báo tối thiểu để không cần @types/node. */
declare const process: { exitCode: number | undefined; exit: (code?: number) => never };

/* --- Shim DOM tối thiểu cho fileToMediaItem() trong Node (mẫu T6) ---
 * Video giả 30fps:
 * - gán src → bắn onloadedmetadata (probeVideo xong, duration theo cờ
 *   fakeDuration, mặc định 70.1);
 * - CHỈ bắn onloadeddata khi cờ fireLoadedData bật (cho captureVideoThumb);
 * - play() → Promise.resolve(); pause() no-op;
 * - requestVideoFrameCallback (khi cờ fakeRvfc bật): mỗi callback tăng
 *   presentedFrames thêm 1 và mediaTime thêm 1/30 (đúng video 30fps) —
 *   probeVideoFps chốt sau ~16 callback (cửa sổ mediaTime 0,5 s).
 * Canvas giả: getContext → proxy no-op, toDataURL → PNG 1x1. */
const PNG_1X1 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
let fireLoadedData = true;
let fakeRvfc = true;
let fakeDuration = 70.1;
class FakeVideo {
  muted = false;
  preload = "";
  duration = 70.1;
  videoWidth = 1280;
  videoHeight = 720;
  currentTime = 0;
  onloadeddata: (() => void) | null = null;
  onloadedmetadata: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onseeked: (() => void) | null = null;
  private _src = "";
  private _pf = 0;
  requestVideoFrameCallback: ((cb: (now: number, md: { presentedFrames: number; mediaTime: number }) => void) => number) | undefined;
  constructor() {
    this.duration = fakeDuration;
    this.requestVideoFrameCallback = fakeRvfc
      ? (cb) => {
          setTimeout(() => {
            this._pf += 1;
            cb(0, { presentedFrames: this._pf, mediaTime: this._pf / 30 });
          }, 0);
          return 1;
        }
      : undefined;
  }
  play(): Promise<void> {
    return Promise.resolve();
  }
  pause(): void {}
  set src(v: string) {
    this._src = v;
    setTimeout(() => {
      if (this.onloadedmetadata) this.onloadedmetadata();
    }, 0);
    if (fireLoadedData) {
      setTimeout(() => {
        if (this.onloadeddata) this.onloadeddata();
      }, 10);
    }
  }
  get src(): string {
    return this._src;
  }
}
const ctxStub = new Proxy(
  {},
  {
    get: (_t, p) => {
      if (p === "createLinearGradient") return () => ({ addColorStop() {} });
      return () => {};
    },
  },
);
const canvasStub = {
  width: 0,
  height: 0,
  getContext: () => ctxStub,
  toDataURL: () => PNG_1X1,
};
(globalThis as Record<string, unknown>).document = {
  createElement: (tag: string) => (tag === "video" ? new FakeVideo() : canvasStub),
};
(globalThis.URL as unknown as Record<string, unknown>).createObjectURL = () => "blob:fake-video";

let pass = 0;
let fail = 0;
const failedNames: string[] = [];

async function test(name: string, fn: () => Promise<void> | void): Promise<void> {
  try {
    await fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    fail++;
    failedNames.push(name);
    console.error(`  ✗ ${name}: ${(e as Error).message}`);
  }
}

function eq(a: unknown, b: unknown, what = ""): void {
  const sa = JSON.stringify(a);
  const sb = JSON.stringify(b);
  if (sa !== sb) throw new Error(`${what} nhận ${sa}, muốn ${sb}`);
}
function approx(a: number, b: number, tol = 1e-9): void {
  if (!(Math.abs(a - b) <= tol)) throw new Error(`nhận ${a}, muốn ${b} ±${tol}`);
}

async function main(): Promise<void> {
  const fakeFile = { type: "video/mp4", name: "clip30.mp4" } as unknown as File;

  console.log("== P2a: snap fps về tốc độ chuẩn ==");
  await test("snap: 29.7 → 29.97; 30.4 → 30; 25.2 → 25; 59.5 → 59.94; 22.0 giữ nguyên", () => {
    eq(snapVideoFpsEstimate(29.7), 29.97, "29.7");
    eq(snapVideoFpsEstimate(30.4), 30, "30.4");
    eq(snapVideoFpsEstimate(25.2), 25, "25.2");
    eq(snapVideoFpsEstimate(59.5), 59.94, "59.5");
    eq(snapVideoFpsEstimate(47.9), 47.952, "47.9");
    eq(snapVideoFpsEstimate(22.0), 22, "22.0 (không gần tốc độ chuẩn nào)");
    eq(snapVideoFpsEstimate(60.05), 60, "60.05");
    eq(snapVideoFpsEstimate(NaN), undefined, "NaN");
    eq(snapVideoFpsEstimate(0), undefined, "0");
    eq(snapVideoFpsEstimate(300), undefined, "300");
  });
  await test("snap: lấy GẦN NHẤT — 30.0 → 30 (không nhầm 29.97); 29.9 → 29.97", () => {
    // 29.97 và 30 chỉ cách nhau 0,03: lấy đầu tiên trong dung sai ±0,6
    // sẽ nhầm 30,0 thành 29.97 (lỗi đã bắt được khi chạy test lần đầu).
    eq(snapVideoFpsEstimate(30.0), 30, "30.0");
    eq(snapVideoFpsEstimate(29.9), 29.97, "29.9");
    eq(snapVideoFpsEstimate(29.99), 30, "29.99");
  });

  console.log("== P2b: fps từ 2 mẫu rVFC ==");
  await test("fpsFromPresentedFrames: (0,0)→(15,0.5) = 30; không đủ mẫu → undefined", () => {
    approx(fpsFromPresentedFrames({ presentedFrames: 0, mediaTime: 0 }, { presentedFrames: 15, mediaTime: 0.5 }) ?? -1, 30);
    approx(fpsFromPresentedFrames({ presentedFrames: 10, mediaTime: 1 }, { presentedFrames: 40, mediaTime: 2 }) ?? -1, 30);
    eq(fpsFromPresentedFrames({ presentedFrames: 5, mediaTime: 0 }, { presentedFrames: 5, mediaTime: 0.5 }), undefined, "Δframe = 0");
    eq(fpsFromPresentedFrames({ presentedFrames: 5, mediaTime: 0.5 }, { presentedFrames: 6, mediaTime: 0.5 }), undefined, "Δt = 0");
  });

  console.log("== P2c: probeVideoFps trên FakeVideo 30fps ==");
  await test("probeVideoFps: video 30fps → 30 (chốt trong <900 ms)", async () => {
    fakeRvfc = true;
    fakeDuration = 70.1;
    const v = new FakeVideo() as unknown as HTMLVideoElement;
    const t0 = Date.now();
    const fps = await probeVideoFps(v);
    const dt = Date.now() - t0;
    eq(fps, 30, "fps");
    if (dt >= 900) throw new Error(`mất ${dt} ms — phải chốt sớm khi đủ cửa sổ 0,5 s`);
  });
  await test("probeVideoFps: không có rVFC → undefined ngay (không chờ timeout)", async () => {
    fakeRvfc = false;
    const v = new FakeVideo() as unknown as HTMLVideoElement;
    const t0 = Date.now();
    const fps = await probeVideoFps(v);
    if (Date.now() - t0 >= 500) throw new Error("chờ quá lâu khi không có rVFC");
    eq(fps, undefined, "fps");
    fakeRvfc = true;
  });
  await test("probeVideoFps: video 0,2 s → undefined (quá ngắn để đo)", async () => {
    fakeDuration = 0.2;
    const v = new FakeVideo() as unknown as HTMLVideoElement;
    eq(await probeVideoFps(v), undefined, "fps");
    fakeDuration = 70.1;
  });

  console.log("== P2d: fileToMediaItem ghi fps vào item ==");
  await test("fileToMediaItem: video 30fps → item.fps = 30, duration/thumbnail không đổi", async () => {
    fakeRvfc = true;
    fakeDuration = 70.1;
    fireLoadedData = true;
    const item = await fileToMediaItem(fakeFile);
    eq(item.fps, 30, "fps");
    eq(item.duration, 70.1, "duration");
    eq(item.width, 1280, "width");
    if (typeof item.thumbnail !== "string") throw new Error("thiếu thumbnail (hồi quy T6b)");
  });
  await test("fileToMediaItem: không có rVFC → item.fps undefined, import vẫn xong", async () => {
    fakeRvfc = false;
    const item = await fileToMediaItem(fakeFile);
    eq(item.fps, undefined, "fps");
    eq(item.duration, 70.1, "duration");
    fakeRvfc = true;
  });

  console.log("== P2e (đợt 196 P2): fps ghi sẵn cho media mẫu = 30 ==");
  await test("SAMPLE_MEDIA_FPS = 30 và snap về đúng 30 (nguồn đo: P2-195 §3)", () => {
    // Nguồn đo: 5 mp4 public ffprobe avg = r = 30/1; clip ghi thật bằng
    // recordPackMedia đo headed bằng probeVideoFps: 30 / 29,97 / 30.
    eq(SAMPLE_MEDIA_FPS, 30, "SAMPLE_MEDIA_FPS");
    eq(snapVideoFpsEstimate(SAMPLE_MEDIA_FPS), 30, "snap(30)");
  });

  console.log(`\nPASS ${pass} FAIL ${fail}`);
  if (fail > 0) {
    console.error("FAILED:", failedNames.join(", "));
    process.exitCode = 1;
  }
  process.exit(process.exitCode ?? 0);
}

void main();
