// reverseDecodeAheadWiring37T2.test.ts — Nối cửa sổ Q3 vào
// ReversePreviewController SAU cổng opt-in S3 (đợt 37 T2).
//
// Chạy bằng esbuild bundle (cùng lý do R3/S4: reverseWebcodecs.ts import
// "./mp4Demux" không đuôi nên Node strip-types không resolve được):
//   ./node_modules/.bin/esbuild apps/web/src/lib/reverseDecodeAheadWiring37T2.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/r37t2.test.cjs \
//     && node /tmp/r37t2.test.cjs
// (chạy từ gốc repo). Test CHỈ phần nối (cổng + trạng thái + tính đoạn
// prefetch thuần); đường prefetch bất đồng bộ qua VideoDecoder thật
// thuộc probe browser (xem LIMITS T2), không fake ở đây.
//
// Số đo dùng trong test là số thật của probe T2 trên proxy 480p của
// nhiễu 720p (benchmarks/results/v37-t2-paced-q3.json):
// - Phiên A (tải nặng, 17 Chrome ngoài cây + vite/tsc/esbuild):
//   rep1 mean decode 17,62 fps, rep2 mean 48,01 fps — đều DƯỚI ngưỡng
//   dễ 60 fps của cổng → cổng PHẢI chặn (không được nối).
// - Phiên B (tải nhẹ, 2 Chrome ngoài cây, 0 tiến trình nặng):
//   rep1 mean decode 124,27 fps, min GOP 96,17 fps — TRÊN ngưỡng dễ
//   → cổng cho phép THỬ NGHIỆM kèm đúng 3 cảnh báo (thử nghiệm /
//   under-load / chưa có hardware decode).
// Test khóa đúng 2 verdict này để lần sau không ai "nới" cổng bằng
// cách truyền số decode 1 GOP của S3 (61–69 fps) mà quên rằng số đó
// đo trên GOP 249 frame, khác GOP 49–75 frame của probe paced này.
import assert from "node:assert/strict";
import {
  ReversePreviewController,
  disposeReverseWebcodecsControllers,
  getReversePreviewController,
  precedingDecodeRange,
  reverseDecodeAheadWarnings,
} from "./reverseWebcodecs.ts";
import {
  REVERSE_DECODE_AHEAD_EXPERIMENT_WARNING_VI,
  REVERSE_NO_HARDWARE_WARNING_VI,
  REVERSE_UNDER_LOAD_WARNING_VI,
} from "./reversePreviewGate.ts";
import type { Mp4Sample } from "./mp4Demux.ts";

let pass = 0;
const queue: Array<{ name: string; fn: () => void | Promise<void> }> = [];
function ok(name: string, fn: () => void | Promise<void>): void {
  queue.push({ name, fn });
}
async function runAll(): Promise<void> {
  for (const t of queue) {
    try {
      await t.fn();
      pass++;
      console.log(`  ✓ ${t.name}`);
    } catch (e) {
      console.error(`  ✗ ${t.name}: ${(e as Error).message}`);
      process.exitCode = 1;
    }
  }
  console.log(`reverseDecodeAheadWiring37T2: ${pass}/${queue.length} test pass`);
}

const HW_ABSENT = {
  preferHardwareSupported: false,
  hardwareAttemptedFrames: 0,
  hardwareDecodedFrames: 0,
  hardwareDecodeFps: null,
};

function fakeSamples(keys: number[], total: number): Mp4Sample[] {
  return Array.from({ length: total }, (_, i) => ({
    index: i,
    isKey: keys.includes(i),
  })) as unknown as Mp4Sample[];
}

ok("mặc định: decode-ahead TẮT, warnings rỗng", () => {
  const c = new ReversePreviewController("fake://t2-default.mp4");
  assert.equal(c.decodeAheadActive, false);
  assert.deepEqual(c.decodeAheadWarningList, []);
  assert.equal(c.aheadDecodeRange, null);
});

ok("cổng chặn khi opt-in tắt (dù footage dễ)", () => {
  const c = new ReversePreviewController("fake://t2-optoff.mp4");
  const d = c.enableDecodeAheadFromGate({
    optIn: false,
    hardwareProof: null,
    softwareMeasurement: { decodeFps: 124.27, loadLabel: "under-load", resolution: "854x480" },
  });
  assert.equal(d.verdict, "blocked");
  assert.deepEqual(d.reasons, ["opt-in-off"]);
  assert.equal(c.decodeAheadActive, false);
  assert.deepEqual(c.decodeAheadWarningList, []);
});

ok("T2 phiên A rep2 (SW 48,01 fps) → cổng chặn, không nối", () => {
  const c = new ReversePreviewController("fake://t2-sessA-rep2.mp4");
  const d = c.enableDecodeAheadFromGate({
    optIn: true,
    hardwareProof: HW_ABSENT,
    softwareMeasurement: { decodeFps: 48.01, loadLabel: "under-load", resolution: "854x480" },
  });
  assert.equal(d.verdict, "blocked");
  assert.ok(d.reasons.includes("hardware-decode-absent"));
  assert.ok(d.reasons.includes("software-decode-below-easy-threshold"));
  assert.equal(c.decodeAheadActive, false);
  assert.deepEqual(c.decodeAheadWarningList, []);
});

ok("T2 phiên A rep1 (SW 17,62 fps) → cổng chặn, không nối", () => {
  const c = new ReversePreviewController("fake://t2-sessA-rep1.mp4");
  const d = c.enableDecodeAheadFromGate({
    optIn: true,
    hardwareProof: HW_ABSENT,
    softwareMeasurement: { decodeFps: 17.62, loadLabel: "under-load", resolution: "854x480" },
  });
  assert.equal(d.verdict, "blocked");
  assert.equal(c.decodeAheadActive, false);
});

ok("T2 phiên B rep1 (SW 124,27 fps) → allowed-experiment + đúng 3 cảnh báo cổng", () => {
  const c = new ReversePreviewController("fake://t2-sessB-rep1.mp4");
  const d = c.enableDecodeAheadFromGate({
    optIn: true,
    hardwareProof: HW_ABSENT,
    softwareMeasurement: { decodeFps: 124.27, loadLabel: "under-load", resolution: "854x480" },
  });
  assert.equal(d.verdict, "allowed-experiment");
  assert.equal(c.decodeAheadActive, true);
  // Thứ tự đúng như module cổng: thử nghiệm, under-load, chưa có HW.
  assert.deepEqual(c.decodeAheadWarningList, [
    REVERSE_DECODE_AHEAD_EXPERIMENT_WARNING_VI,
    REVERSE_UNDER_LOAD_WARNING_VI,
    REVERSE_NO_HARDWARE_WARNING_VI,
  ]);
});

ok("HW proven, không đo SW → allowed, chỉ 1 cảnh báo thử nghiệm", () => {
  const c = new ReversePreviewController("fake://t2-hw.mp4");
  const d = c.enableDecodeAheadFromGate({
    optIn: true,
    hardwareProof: {
      preferHardwareSupported: true,
      hardwareAttemptedFrames: 60,
      hardwareDecodedFrames: 60,
      hardwareDecodeFps: 120,
    },
    softwareMeasurement: null,
  });
  assert.equal(d.verdict, "allowed-experiment");
  assert.equal(c.decodeAheadActive, true);
  assert.deepEqual(c.decodeAheadWarningList, [
    REVERSE_DECODE_AHEAD_EXPERIMENT_WARNING_VI,
  ]);
});

ok("gọi chặn sau khi đã bật → tắt lại + xóa warnings (không treo cảnh báo cũ)", () => {
  const c = new ReversePreviewController("fake://t2-toggle.mp4");
  c.enableDecodeAheadFromGate({
    optIn: true,
    hardwareProof: HW_ABSENT,
    softwareMeasurement: { decodeFps: 124.27, loadLabel: "under-load", resolution: "854x480" },
  });
  assert.equal(c.decodeAheadActive, true);
  c.enableDecodeAheadFromGate({
    optIn: true,
    hardwareProof: HW_ABSENT,
    softwareMeasurement: { decodeFps: 48.01, loadLabel: "under-load", resolution: "854x480" },
  });
  assert.equal(c.decodeAheadActive, false);
  assert.deepEqual(c.decodeAheadWarningList, []);
});

ok("dispose → tắt + xóa warnings", () => {
  const c = new ReversePreviewController("fake://t2-dispose.mp4");
  c.enableDecodeAheadFromGate({
    optIn: true,
    hardwareProof: HW_ABSENT,
    softwareMeasurement: { decodeFps: 124.27, loadLabel: "under-load", resolution: "854x480" },
  });
  assert.equal(c.decodeAheadActive, true);
  c.dispose();
  assert.equal(c.decodeAheadActive, false);
  assert.deepEqual(c.decodeAheadWarningList, []);
});

ok("registry accessor: warnings của controller đã bật đọc được từ preview", () => {
  disposeReverseWebcodecsControllers();
  const c = getReversePreviewController("fake://t2-registry.mp4");
  assert.deepEqual(reverseDecodeAheadWarnings(), []);
  c.enableDecodeAheadFromGate({
    optIn: true,
    hardwareProof: HW_ABSENT,
    softwareMeasurement: { decodeFps: 159.28, loadLabel: "under-load", resolution: "854x480" },
  });
  assert.deepEqual(reverseDecodeAheadWarnings(), [
    REVERSE_DECODE_AHEAD_EXPERIMENT_WARNING_VI,
    REVERSE_UNDER_LOAD_WARNING_VI,
    REVERSE_NO_HARDWARE_WARNING_VI,
  ]);
  disposeReverseWebcodecsControllers();
  assert.deepEqual(reverseDecodeAheadWarnings(), []);
});

ok("precedingDecodeRange: cửa sổ identity, GOP-align về keyframe", () => {
  const samples = fakeSamples([0, 90, 180], 300);
  const order = Array.from({ length: 300 }, (_, i) => i);
  // Cửa sổ hiện tại bắt đầu ở present position 150; 75 sample trước
  // là 75..149, keyframe <= 75 là 0 → đoạn decode {0, 149}.
  assert.deepEqual(precedingDecodeRange(order, 150, 75, samples), { from: 0, to: 149 });
});

ok("precedingDecodeRange: present order lệch B-frame vẫn bao đúng đoạn decode", () => {
  const samples = fakeSamples([0, 90, 180], 300);
  const order = Array.from({ length: 300 }, (_, i) => i);
  // Reorder window ở biên: present position 149 là decode 152, các
  // position 150..152 là decode 149..151 (trình bày sau nhưng decode
  // trước — đúng bản chất B-frame).
  order[149] = 152; order[150] = 149; order[151] = 150; order[152] = 151;
  // Cửa sổ hiện tại bắt đầu ở position 150 → 75 position trước là
  // 75..149, chứa decode 152 → đoạn {0, 152} (GOP-align về key 0).
  assert.deepEqual(precedingDecodeRange(order, 150, 75, samples), { from: 0, to: 152 });
});

ok("precedingDecodeRange: đầu video / window 0 → null", () => {
  const samples = fakeSamples([0], 300);
  const order = Array.from({ length: 300 }, (_, i) => i);
  assert.equal(precedingDecodeRange(order, 0, 75, samples), null);
  assert.equal(precedingDecodeRange(order, 150, 0, samples), null);
});

void runAll();
