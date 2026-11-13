// speedWarnTooShortDead63R10.test.ts — Phase 9 đợt 63, luồng R10: khóa
// QUYẾT ĐỊNH XÓA nhánh `speed.warnTooShort` ở SpeedPanel (đóng nợ đợt 62
// R10 §6.1/§10.3 — nhánh chết qua UI, đã chứng minh bằng đo headed E3).
//
// Bằng chứng nhánh chết (đợt 62 R10, đo thật, không phải suy luận):
//   - `applySpeed` kẹp `raw` về `sliderMax` TRƯỚC khi tính duration
//     (`Math.min(raw, sliderMax)`), mà `sliderMax = min(4, srcLen/0.2)`
//     nên `newDur = srcLen/s >= 0.2` với mọi clip thật.
//   - Preset `p > sliderMax` bị `disabled`; slider `max` cũng là
//     `sliderMax` (làm tròn 2 chữ số — có thể nhỉnh hơn sliderMax một
//     chút, nhưng `Math.min` trong `applySpeed` kẹp lại).
//   - Đo headed: srcLen 0.5s → slider max 2.5, preset 4× disabled,
//     kéo slider lên max → speed 2.5, duration đúng 0.2, KHÔNG warn.
//   - Tiền đề: trim kẹp `duration >= 0.2` (store.ts) và speed trong
//     [0.25, 4] nên `srcLen = duration × speed >= 0.05` với mọi clip
//     thật; biên srcLen = 0.05 cho newDur đúng 0.2 (test (4) khóa).
//   - `clampSpeed` là kẹp thuần min/max, không làm tròn lên
//     (packages/video-spec/src/speed.ts:299).
//
// Việc parent còn phải làm lúc gộp (KHÔNG thuộc file test này):
//   - Xóa key `speed.warnTooShort` khỏi `vi.json` + `en.json` (luồng này
//     KHÔNG được sửa dict trực tiếp) + cập nhật test khóa số key
//     (i18nOrphans60Q4.test.ts đang assert 2461 key lá sau đợt 80 H7; 2463 sau đợt 81 I6: +2 key aiJob.*; 2489 sau đợt 84 L8/L9: +2 key L9 +24 key L8; 2507 sau đợt 85 M7/M8: +11 key M7 +7 key M8; 2515 sau đợt 87 O5/closing: +7 key O5 +1 key closing; 2516 sau đợt 88 P6: +1 key validation.TRACK_IMAGE_MASK; 2517 sau đợt 91 S5: +1 key motionTrack.title; 2518 sau đợt 92 T5: +1 key sticker.title; 2767 sau đợt 93 U5: +249 key sticker.cat.*/sticker.item.*).
//   - Cho tới lúc đó, test orphan của Q4 sẽ đỏ với ĐÚNG 1 key mồ côi
//     (`speed.warnTooShort`) — đó là đỏ chờ gộp, không phải bug mới.
//   - Chuỗi `warnTooShort` vẫn còn trong `apps/web/scripts/
//     clicktest-62r10-headed-gaps.mjs` + các file `*_LIMITS.md` — đó là
//     hồ sơ bằng chứng lịch sử, KHÔNG xóa; test (1) chỉ quét
//     `apps/web/src` nên không chạm tới chúng.
//
// Chạy bằng runner chuẩn (từ gốc repo):
//   node scripts/run-node-test.mjs apps/web/src/components/speed/speedWarnTooShortDead63R10.test.ts
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import {
  clampSpeed,
  durationForSpeed,
  SPEED_MAX,
  SPEED_MIN,
  type SpeedableClip,
} from "@repo-1/video-spec";

/** Khai báo tối thiểu để không cần @types/node (mẫu M7/O5). */
declare const process: {
  cwd: () => string;
  exitCode: number | undefined;
};

let pass = 0;
const queue: Array<{ name: string; fn: () => void }> = [];
function ok(name: string, fn: () => void): void {
  queue.push({ name, fn });
}
function runAll(): void {
  for (const t of queue) {
    try {
      t.fn();
      pass++;
      console.log(`  ✓ ${t.name}`);
    } catch (e) {
      console.error(`  ✗ ${t.name}: ${(e as Error).message}`);
      process.exitCode = 1;
    }
  }
  console.log(`warnTooShort dead-branch round 63 R10: ${pass}/${queue.length} pass`);
}

// --- (1) Không còn tham chiếu trong src ---------------------------------
ok("source: 0 tham chiếu warnTooShort trong apps/web/src (trừ dict chờ parent xóa + file test)", () => {
  const hits: string[] = [];
  const walk = (dir: string): void => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = `${dir}/${e.name}`;
      if (e.isDirectory()) {
        if (["node_modules", "dist", "dist-web", "release"].includes(e.name)) continue;
        walk(p);
      } else if (/\.(ts|tsx|js|jsx|mjs|css)$/.test(e.name)) {
        // File test chứa chuỗi này làm từ khóa quét (như file này) nên
        // loại khỏi quét — cùng quy ước với test orphan Q4.
        if (/\.test\.(ts|js)$/.test(e.name)) continue;
        // Dict vi.json/en.json chờ parent xóa key lúc gộp — không quét
        // ở đây (xem header); quét riêng ở test orphan Q4.
        if (p === "apps/web/src/i18n/vi.json" || p === "apps/web/src/i18n/en.json") continue;
        if (readFileSync(p, "utf8").includes("warnTooShort")) hits.push(p);
      }
    }
  };
  walk("apps/web/src");
  assert.deepEqual(hits, [], `còn tham chiếu warnTooShort: ${hits.join(", ")}`);
});

ok("SpeedPanel: nhánh warn đã xóa, kẹp sliderMax + warnOverlap còn nguyên", () => {
  const src = readFileSync("apps/web/src/components/speed/SpeedPanel.tsx", "utf8");
  assert.ok(!src.includes("warnTooShort"), "SpeedPanel.tsx vẫn còn warnTooShort");
  assert.ok(
    src.includes("Math.min(raw, sliderMax)"),
    "SpeedPanel.tsx phải giữ kẹp Math.min(raw, sliderMax) trong applySpeed",
  );
  assert.ok(
    src.includes("srcLen / MIN_CLIP_DURATION"),
    "SpeedPanel.tsx phải giữ sliderMax = srcLen / MIN_CLIP_DURATION",
  );
  assert.ok(src.includes("warnOverlap"), "nhánh warnOverlap (còn sống) không được đụng");
  assert.ok(src.includes("warnResetOverlap"), "nhánh warnResetOverlap (còn sống) không được đụng");
});

// --- (3)+(4) Bất biến newDur >= 0.2 bằng hàm THẬT -----------------------
/** sliderMax y hệt công thức trong SpeedPanel.tsx. */
function sliderMaxFor(srcLen: number): number {
  return Math.min(SPEED_MAX, Math.max(SPEED_MIN, srcLen / 0.2));
}
function clipWithSrcLen(srcLen: number): SpeedableClip {
  return {
    kind: "video",
    id: "x",
    src: "a.mp4",
    start: 0,
    duration: srcLen,
    in: 0,
    out: srcLen,
  } as unknown as SpeedableClip;
}
/** applySpeed y hệt SpeedPanel (đã xóa nhánh warn): kẹp raw rồi tính. */
function applySpeedNewDur(srcLen: number, raw: number): number {
  const s = clampSpeed(Math.min(raw, sliderMaxFor(srcLen)));
  return durationForSpeed(clipWithSrcLen(srcLen), s);
}

ok("bất biến: newDur >= 0.2 - 1e-9 với mọi srcLen >= 0.05, mọi raw hữu hạn", () => {
  const srcLens = [0.05, 0.0500001, 0.06, 0.1, 0.2, 0.5, 1, 2, 4, 10, 60, 3600];
  // Raw UI có thể đưa vào: slider (step 0.05, min 0.25, max attr làm tròn
  // 2 chữ số — có thể nhỉnh hơn sliderMax) + preset [0.25..4] + cả giá trị
  // ngoài miền [0.25, 4] để khóa clamp 2 lớp (Math.min + clampSpeed).
  const raws = [0.1, 0.25, 0.3, 0.5, 1, 1.5, 2, 2.5, 2.51, 4, 10];
  let worst = Infinity;
  let worstCase = "";
  for (const srcLen of srcLens) {
    for (const raw of raws) {
      const d = applySpeedNewDur(srcLen, raw);
      if (d < worst) {
        worst = d;
        worstCase = `srcLen=${srcLen} raw=${raw}`;
      }
      assert.ok(
        d >= 0.2 - 1e-9,
        `newDur=${d} < 0.2 - 1e-9 với srcLen=${srcLen} raw=${raw}`,
      );
    }
  }
  assert.ok(worst >= 0.2 - 1e-9, `newDur nhỏ nhất ${worst} (${worstCase})`);
});

ok("biên: srcLen = 0.05 (nhỏ nhất clip thật) → sliderMax = 0.25, newDur đúng 0.2", () => {
  assert.equal(sliderMaxFor(0.05), 0.25, "sliderMax(0.05) phải là 0.25");
  assert.equal(applySpeedNewDur(0.05, 4), 0.2, "srcLen 0.05 + raw 4 → newDur phải đúng 0.2");
  assert.equal(applySpeedNewDur(0.05, 0.25), 0.2, "srcLen 0.05 + raw 0.25 → newDur phải đúng 0.2");
  assert.equal(applySpeedNewDur(0.5, 4), 0.2, "srcLen 0.5 + raw 4 (kẹp về 2.5) → newDur 0.2");
});

// --- (5) Tiền đề: trim kẹp duration >= 0.2 -------------------------------
ok("tiền đề: trim kẹp duration >= 0.2 (store.ts) — đổi tiền đề này phải đánh giá lại bất biến", () => {
  const store = readFileSync("apps/web/src/store.ts", "utf8");
  assert.ok(
    store.includes("Math.max(0.2,"),
    "store.ts phải còn kẹp duration >= 0.2 ở trim (tiền đề srcLen >= 0.05)",
  );
});

runAll();
