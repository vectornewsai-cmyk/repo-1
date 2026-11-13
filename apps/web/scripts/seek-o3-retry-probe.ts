// seek-o3-retry-probe.ts — Phase 9 đợt 32, luồng O3 (item 3).
// Đo hành vi seek KHÔNG BAO GIỜ XONG ở tầng seek.ts + vòng retry của
// preview, bằng mock element (không dùng browser thật cho phần này):
//  - element không bao giờ bắn `seeked`, seeking giữ true sau lần gán
//    đầu (mô phỏng media hỏng / decode kẹt mà Chrome không báo lỗi).
//  - vòng lặp mô phỏng đúng nhánh preview sau sửa N1: Seeker debounce
//    80ms -> seekAll -> nếu timedOut > 0 thì reset lastRequested và
//    request lại (không vẽ, không đánh dấu đã vẽ).
// Đo: số attempt trong 120s, nhịp trung bình, listener `seeked` tồn
// đọng trên element (listener once không bao giờ bắn thì trình duyệt
// thật vẫn giữ lại — mock đếm đúng số đó), CPU process.
// Chạy từ gốc repo (để alias @repo-1/video-spec resolve):
//   node --experimental-strip-types apps/web/scripts/seek-o3-retry-probe.ts
// Kết quả JSON: benchmarks/results/v32-o3-retry-longrun.json
// KHÔNG push, KHÔNG sửa code sản phẩm (script đo thuần túy).
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import path from "node:path";
import { seekElement, Seeker, type Seekable } from "../src/lib/seek.ts";

const DURATION_MS = 120_000;
const TARGET = 61 / 30;

class NeverSeekedEl implements Seekable {
  seeking = false;
  reported = 0;
  sets: number[] = [];
  listeners: Array<() => void> = [];
  get currentTime(): number {
    return this.reported;
  }
  set currentTime(v: number) {
    this.sets.push(v);
    // Seek bắt đầu bay và không bao giờ tới: seeking giữ true.
    this.seeking = true;
  }
  pause(): void {}
  addEventListener(_type: "seeked", fn: () => void): void {
    this.listeners.push(fn);
  }
  removeEventListener(_type: "seeked", fn: () => void): void {
    const i = this.listeners.indexOf(fn);
    if (i >= 0) this.listeners.splice(i, 1);
  }
}

const el = new NeverSeekedEl();
const seeker = new Seeker(80);
const attempts: number[] = [];
const t0 = Date.now();
const cpu0 = process.cpuUsage();
let draws = 0;
let lastRequestedReset = 0;

// Mô phỏng nhánh preview: request seek; timedOut -> reset + retry;
// failed/ok-không-timeout -> vẽ (không xảy ra ở probe này).
async function runLoop(): Promise<void> {
  while (Date.now() - t0 < DURATION_MS) {
    const outcome = await seeker.request(TARGET, async () => {
      attempts.push(Date.now() - t0);
      const r = await seekElement(el, TARGET, { fps: 30, timeoutMs: 1200 });
      return { done: r.seeked ? 1 : 0, timedOut: r.timedOut ? 1 : 0, failed: !r.seeked && !r.timedOut ? 1 : 0 };
    });
    if (!outcome.cancelled && outcome.ok && outcome.timedOut === 0) {
      draws++;
    } else if (!outcome.cancelled) {
      lastRequestedReset++;
    }
    // Tick rAF tiếp theo của preview sẽ request lại ngay (không sleep
    // thêm ngoài debounce 80ms của Seeker).
  }
}

await runLoop();
const wallMs = Date.now() - t0;
const cpu = process.cpuUsage(cpu0);
const gaps: number[] = [];
for (let i = 1; i < attempts.length; i++) gaps.push(attempts[i] - attempts[i - 1]);
const meanGap = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;
const result = {
  run: "v32-o3-retry-longrun",
  date: new Date().toISOString(),
  durationTargetMs: DURATION_MS,
  wallMs,
  attempts: attempts.length,
  sets: el.sets.length,
  orphanSeekedListenersOnElement: el.listeners.length,
  drawsWhileNeverSeeked: draws,
  retriesAfterTimeout: lastRequestedReset,
  gapMs: {
    mean: Math.round(meanGap * 10) / 10,
    min: gaps.length ? Math.min(...gaps) : null,
    max: gaps.length ? Math.max(...gaps) : null,
  },
  cpuUserMs: Math.round(cpu.user / 1000),
  cpuSystemMs: Math.round(cpu.system / 1000),
  seekingAtEnd: el.seeking,
  note: "Mock Node: không có rAF/decode thật; nhịp = debounce 80ms + timeout 1200ms + overhead promise.",
};
const outPath = path.resolve("benchmarks/results/v32-o3-retry-longrun.json");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
writeFileEpermRetry(outPath, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
console.log(`JSON: ${outPath}`);
