// seek-p2-retry-probe.ts — Phase 9 đợt 32, luồng P2 (thực chất đợt 33).
// Mở rộng probe retry của O3 (seek-o3-retry-probe.ts, 120s) lên 300s:
// O3 đã chứng minh nhịp ~1,29s, CPU không đáng kể, và vá listener mồ
// côi (93 → 0 sau 120s). Lượt này kiểm chứng ĐỘC LẬP lại trên cây
// hiện tại (đã có vá O3) với cửa sổ dài hơn 2,5×, và ghi thêm số
// listener TỐI ĐA quan sát được trong suốt lượt (O3 chỉ ghi số cuối).
// Chạy từ gốc repo:
//   node --experimental-strip-types apps/web/scripts/seek-p2-retry-probe.ts
// Kết quả JSON: benchmarks/results/v32-p2-retry-longrun.json
// KHÔNG ghi đè file bằng chứng của O3. KHÔNG push, KHÔNG sửa code sản phẩm.
import fs from "node:fs";
import path from "node:path";
import { seekElement, Seeker, type Seekable } from "../src/lib/seek.ts";

const DURATION_MS = 300_000;
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
let maxListenersSeen = 0;

async function runLoop(): Promise<void> {
  while (Date.now() - t0 < DURATION_MS) {
    const outcome = await seeker.request(TARGET, async () => {
      attempts.push(Date.now() - t0);
      const r = await seekElement(el, TARGET, { fps: 30, timeoutMs: 1200 });
      return { done: r.seeked ? 1 : 0, timedOut: r.timedOut ? 1 : 0, failed: !r.seeked && !r.timedOut ? 1 : 0 };
    });
    if (el.listeners.length > maxListenersSeen) maxListenersSeen = el.listeners.length;
    if (!outcome.cancelled && outcome.ok && outcome.timedOut === 0) {
      draws++;
    } else if (!outcome.cancelled) {
      lastRequestedReset++;
    }
  }
}

await runLoop();
const wallMs = Date.now() - t0;
const cpu = process.cpuUsage(cpu0);
const gaps: number[] = [];
for (let i = 1; i < attempts.length; i++) gaps.push(attempts[i] - attempts[i - 1]);
const meanGap = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;
const result = {
  run: "v32-p2-retry-longrun",
  date: new Date().toISOString(),
  durationTargetMs: DURATION_MS,
  wallMs,
  attempts: attempts.length,
  sets: el.sets.length,
  orphanSeekedListenersOnElement: el.listeners.length,
  maxListenersSeenDuringRun: maxListenersSeen,
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
  note: "Mock Node: không có rAF/decode thật; nhịp = debounce 80ms + timeout 1200ms + overhead promise. So với O3 (120s): cùng mock, cùng cây đã có vá gỡ listener.",
};
const outPath = path.resolve("benchmarks/results/v32-p2-retry-longrun.json");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
console.log(`JSON: ${outPath}`);
