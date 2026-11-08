import { fileToMediaItem } from "./media";

/** Khai báo tối thiểu để không cần @types/node. */
declare const process: { exitCode: number | undefined };

/* --- Shim DOM tối thiểu cho fileToMediaItem() trong Node ---
 * captureVideoThumb() tạo <video> + <canvas>. Video giả:
 * - gán src → bắn onloadedmetadata (probeVideo xong, duration 70.1);
 * - CHỈ bắn onloadeddata khi cờ fireLoadedData bật (mô phỏng decode
 *   frame đầu xong); tắt cờ = keyframe khổng lồ decode mãi không xong
 *   (đo được >175 s chưa xong với keyframe 64,0 MiB 8K trên VM này).
 * - currentTime gán thường (onseeked không bắn → fallback 800 ms).
 * Canvas giả: getContext → proxy no-op, toDataURL → PNG 1x1. */
const PNG_1X1 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
let fireLoadedData = false;
class FakeVideo {
  muted = false;
  preload = "";
  duration = 70.1;
  videoWidth = 8192;
  videoHeight = 4320;
  currentTime = 0;
  onloadeddata: (() => void) | null = null;
  onloadedmetadata: (() => void) | null = null;
  onerror: (() => void) | null = null;
  private _src = "";
  set src(v: string) {
    this._src = v;
    // mô phỏng demuxer: metadata có ngay, frame đầu chỉ có khi decode xong
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
// URL.createObjectURL cần Blob thật trong Node → stub trả blob: giả.
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

async function main(): Promise<void> {
  const fakeFile = {
    type: "video/mp4",
    name: "bigkey-64mib-70s.mp4",
  } as unknown as File;

  console.log("== T6a: thumbnail treo (loadeddata không bao giờ bắn) → import vẫn xong ==");
  await test("T6a: fileToMediaItem resolve trong <15 s dù loadeddata treo", async () => {
    fireLoadedData = false;
    const t0 = Date.now();
    const item = await fileToMediaItem(fakeFile);
    const dt = Date.now() - t0;
    if (dt >= 15000) throw new Error(`mất ${dt} ms — timeout 5 s không hoạt động, import treo`);
    if (dt < 4500) throw new Error(`chỉ mất ${dt} ms — timeout chưa đủ 5 s?`);
    eq(item.duration, 70.1, "duration");
    eq(item.thumbnail, undefined, "thumbnail (bỏ qua khi timeout)");
    eq(item.name, "bigkey-64mib-70s.mp4", "name");
  });

  console.log("== T6b: thumbnail load được → vẫn có thumbnail (không hồi quy) ==");
  await test("T6b: fileToMediaItem có thumbnail khi loadeddata bắn", async () => {
    fireLoadedData = true;
    const item = await fileToMediaItem(fakeFile);
    if (typeof item.thumbnail !== "string" || !item.thumbnail.startsWith("data:image/")) {
      throw new Error(`thumbnail lạ: ${String(item.thumbnail).slice(0, 40)}`);
    }
    eq(item.duration, 70.1, "duration");
  });

  console.log(`\nPASS ${pass} FAIL ${fail}`);
  if (fail > 0) {
    console.error("FAILED:", failedNames.join(", "));
    process.exitCode = 1;
  }
  // Thoát tường minh: chuỗi import media → i18n → react giữ event loop
  // sống sau khi main() xong (không có timer nào của test còn chạy).
  process.exit(process.exitCode ?? 0);
}

void main();
