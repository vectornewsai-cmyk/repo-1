// reverseDecodeAheadToggle39T4.test.ts — Đợt 39 luồng T4: quyết định
// re-gate + dọn prefetch đang bay khi tắt + badge nhiều controller +
// quan sát khóa S4 cho click-test proxy lớn.
//
// Chạy bằng esbuild bundle (cùng lý do U1: reverseWebcodecs.ts import
// "./mp4Demux" không đuôi nên Node strip-types không resolve được):
//   ./node_modules/.bin/esbuild apps/web/src/lib/reverseDecodeAheadToggle39T4.test.ts \
//     --bundle --platform=node --format=cjs --outfile=<scratch>/t4.test.cjs \
//     && node <scratch>/t4.test.cjs
// (chạy từ gốc repo; bundle ra scratch ngoài repo, KHÔNG ra /tmp vì
// tmpfs 512M từng đầy ở đợt 38 S3, KHÔNG ra dist.)
//
// Phạm vi test: logic thuần + nối registry (cổng + trạng thái +
// per-controller). Đường decode thật trong browser (số đo cửa sổ,
// prefetch settle thật, evict frame thật) thuộc click-test trên app
// thật (xem LIMITS T4) — không fake số đo ở đây, và không có backdoor
// đặt số đo giả vào controller. Số đo dùng trong test là số thật của
// probe T2 (đợt 37): phiên B 124,27 fps ≥ ngưỡng dễ 60 → mở cổng;
// phiên A 48,01 fps < 60 → chặn.
import assert from "node:assert/strict";
import {
  ReversePreviewController,
  disposeReverseWebcodecsControllers,
  getReversePreviewController,
  reverseControllerFetchStats,
  reverseDecodeAheadStatus,
  setReverseDecodeAheadWanted,
} from "./reverseWebcodecs.ts";
import {
  blockedReasonsDiffer,
  controllerLabel,
  keepIndicesForWindow,
  shouldAutoApplyDecodeAhead,
  shouldDropSettledPrefetch,
} from "./reverseDecodeAheadToggle.ts";
import viDict from "../i18n/vi.json";
import enDict from "../i18n/en.json";

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
  console.log(`reverseDecodeAheadToggle39T4: ${pass}/${queue.length} test pass`);
}

const EASY = {
  decodeFps: 124.27,
  loadLabel: "under-load" as const,
  resolution: "854x480",
};
const SLOW = {
  decodeFps: 48.01,
  loadLabel: "under-load" as const,
  resolution: "854x480",
};
const HW_ABSENT = {
  preferHardwareSupported: false,
  hardwareAttemptedFrames: 0,
  hardwareDecodedFrames: 0,
  hardwareDecodeFps: null,
};

ok("re-gate: chỉ tự thử lại khi wanted mà CHƯA bật (giữ luật T2)", () => {
  assert.equal(shouldAutoApplyDecodeAhead(true, false), true);
  assert.equal(shouldAutoApplyDecodeAhead(true, true), false);
  assert.equal(shouldAutoApplyDecodeAhead(false, false), false);
  assert.equal(shouldAutoApplyDecodeAhead(false, true), false);
});

ok("settle-drop: chỉ dọn khi đang tắt + không dispose + không decode bay", () => {
  assert.equal(shouldDropSettledPrefetch(false, false, false), true);
  assert.equal(shouldDropSettledPrefetch(true, false, false), false);
  assert.equal(shouldDropSettledPrefetch(false, true, false), false);
  assert.equal(shouldDropSettledPrefetch(false, false, true), false);
  assert.equal(shouldDropSettledPrefetch(true, true, true), false);
});

ok("keepIndicesForWindow: đúng đoạn, null = rỗng, 1 frame = 1 index", () => {
  assert.deepEqual([...keepIndicesForWindow(null)], []);
  assert.deepEqual([...keepIndicesForWindow({ from: 5, to: 5 })], [5]);
  assert.deepEqual([...keepIndicesForWindow({ from: 497, to: 499 })], [497, 498, 499]);
});

ok("controllerLabel: basename URL, cắt 40 ký tự, fallback clip N", () => {
  assert.equal(controllerLabel("http://127.0.0.1:8787/api/proxy/file/noise-4k-6s__proxy_720p.mp4", 0), "noise-4k-6s__proxy_720p.mp4");
  assert.equal(controllerLabel("blob:http://localhost:5179/550e8400-e29b-41d4-a716-446655440000", 1), "550e8400-e29b-41d4-a716-446655440000");
  assert.equal(controllerLabel("", 2), "clip 3");
  const long = controllerLabel(`http://x/${"a".repeat(50)}.mp4`, 0);
  assert.equal(long.length, 38);
  assert.ok(long.endsWith("…"));
});

ok("blockedReasonsDiffer: 0-1 clip = false, cùng lý do = false, khác = true", () => {
  const mk = (label: string, active: boolean, reasons: string[]) => ({
    label, active, prefetchFrames: 0, measurementFps: null,
    measurementResolution: null, reasons,
  });
  assert.equal(blockedReasonsDiffer([]), false);
  assert.equal(blockedReasonsDiffer([mk("a", false, ["x"])]), false);
  assert.equal(blockedReasonsDiffer([mk("a", false, ["x"]), mk("b", false, ["x"])]), false);
  assert.equal(blockedReasonsDiffer([mk("a", false, ["x"]), mk("b", false, ["y"])]), true);
  // Thứ tự lý do không làm khác nhau; controller đang chạy không tính.
  assert.equal(blockedReasonsDiffer([mk("a", false, ["x", "y"]), mk("b", false, ["y", "x"])]), false);
  assert.equal(blockedReasonsDiffer([mk("a", true, ["z"]), mk("b", false, ["x"])]), false);
});

ok("i18n: badgeBlockedMulti có ở cả vi+en, khác rỗng, chứa {n}", () => {
  const vi = (viDict as unknown as { decodeahead: Record<string, unknown> }).decodeahead;
  const en = (enDict as unknown as { decodeahead: Record<string, unknown> }).decodeahead;
  assert.ok(typeof vi.badgeBlockedMulti === "string" && (vi.badgeBlockedMulti as string).includes("{n}"));
  assert.ok(typeof en.badgeBlockedMulti === "string" && (en.badgeBlockedMulti as string).includes("{n}"));
});

ok("status nhiều controller: mỗi clip mang decision riêng, không hợp nhầm", () => {
  disposeReverseWebcodecsControllers();
  setReverseDecodeAheadWanted(false);
  const easy = getReversePreviewController("fake://t4-easy.mp4");
  const slow = getReversePreviewController("fake://t4-slow.mp4");
  easy.enableDecodeAheadFromGate({ optIn: true, hardwareProof: HW_ABSENT, softwareMeasurement: EASY });
  slow.enableDecodeAheadFromGate({ optIn: true, hardwareProof: HW_ABSENT, softwareMeasurement: SLOW });
  assert.equal(easy.decodeAheadActive, true);
  assert.equal(slow.decodeAheadActive, false);
  const st = reverseDecodeAheadStatus();
  assert.equal(st.controllers.length, 2);
  assert.equal(st.controllers[0].label, "t4-easy.mp4");
  assert.equal(st.controllers[0].active, true);
  assert.equal(st.controllers[1].label, "t4-slow.mp4");
  assert.equal(st.controllers[1].active, false);
  // Clip chậm mang đúng lý do dưới ngưỡng của nó (không bị decision
  // của clip dễ ghi đè — bug badge U1 §5.4 nếu dùng decision toàn cục).
  // HW_ABSENT (prefer-hardware false) → mã hardware-decode-absent.
  assert.ok(st.controllers[1].reasons.includes("software-decode-below-easy-threshold"));
  assert.ok(st.controllers[1].reasons.includes("hardware-decode-absent"));
  // Đang chạy (1 clip active) thì reasons gộp rỗng như cũ (toast không
  // bắn trong lúc chạy); lý do clip bị chặn đọc ở controllers[1].
  assert.deepEqual(st.reasons, []);
  assert.equal(st.uiStatus, "running");
  // Hai clip bị chặn với lý do khác nhau → badge multi phải bật.
  const st2entries = [
    { ...st.controllers[1], active: false },
    { label: "t4-nomeasure.mp4", active: false, prefetchFrames: 0, measurementFps: null, measurementResolution: null, reasons: ["hardware-decode-absent", "software-decode-not-measured"] },
  ];
  assert.equal(blockedReasonsDiffer(st2entries), true);
  disposeReverseWebcodecsControllers();
  setReverseDecodeAheadWanted(false);
});

ok("reasons gộp = hợp lý do từng clip, giữ thứ tự registry, không trùng", () => {
  disposeReverseWebcodecsControllers();
  setReverseDecodeAheadWanted(false);
  const a = getReversePreviewController("fake://t4-a.mp4");
  const b = getReversePreviewController("fake://t4-b.mp4");
  a.enableDecodeAheadFromGate({ optIn: true, hardwareProof: HW_ABSENT, softwareMeasurement: SLOW });
  b.enableDecodeAheadFromGate({ optIn: true, hardwareProof: HW_ABSENT, softwareMeasurement: null });
  const st = reverseDecodeAheadStatus();
  assert.equal(st.active, false);
  assert.equal(st.uiStatus, "off");
  // wanted=false nên uiStatus off (resolve theo wanted); reasons gộp
  // vẫn là hợp — kiểm tra hợp không trùng, giữ thứ tự registry.
  // (HW_ABSENT → hardware-decode-absent, xem ghi chú test trên.)
  assert.deepEqual(st.reasons, [
    "hardware-decode-absent",
    "software-decode-below-easy-threshold",
    "software-decode-not-measured",
  ]);
  disposeReverseWebcodecsControllers();
  setReverseDecodeAheadWanted(false);
});

ok("toggle bật khi 2 controller chưa có số đo: cả 2 bị chặn, per-controller mang lý do chưa đo", () => {
  disposeReverseWebcodecsControllers();
  const easy = getReversePreviewController("fake://t4-on-easy.mp4");
  const slow = getReversePreviewController("fake://t4-on-slow.mp4");
  // Bật trực tiếp trước bằng số T2 (chỉ để có trạng thái active ban
  // đầu); toggle bật sau đó CHẠY LẠI cổng với số đo thật của controller
  // — mà controller chưa decode cửa sổ nào nên số đo là null → cả 2
  // phải bị chặn (không mượn số của lần bật trực tiếp trước đó).
  easy.enableDecodeAheadFromGate({ optIn: true, hardwareProof: HW_ABSENT, softwareMeasurement: EASY });
  slow.enableDecodeAheadFromGate({ optIn: true, hardwareProof: HW_ABSENT, softwareMeasurement: SLOW });
  assert.equal(easy.decodeAheadActive, true);
  const d = setReverseDecodeAheadWanted(true);
  assert.equal(d?.verdict, "blocked");
  assert.equal(easy.decodeAheadActive, false);
  assert.equal(slow.decodeAheadActive, false);
  const st = reverseDecodeAheadStatus();
  assert.equal(st.active, false);
  assert.equal(st.uiStatus, "blocked");
  for (const e of st.controllers) {
    assert.ok(e.reasons.includes("software-decode-not-measured"), e.label);
  }
  disposeReverseWebcodecsControllers();
  setReverseDecodeAheadWanted(false);
});

ok("S4: controller khóa từ constructor với proxySize > 128 MiB, 0 fetch", () => {
  disposeReverseWebcodecsControllers();
  const before = reverseControllerFetchStats.fetches;
  const c = new ReversePreviewController("fake://t4-big-proxy.mp4", undefined, {
    knownFileSizeBytes: 150 * 1024 * 1024,
  });
  assert.equal(c.largeFileFallback, true);
  assert.equal(c.failed, true);
  // Chỉ tạo controller (chưa gọi load) thì chưa fetch — khóa xảy ra ở
  // constructor, trước cả HEAD. Counter không tăng vì tạo controller.
  assert.equal(reverseControllerFetchStats.fetches, before);
  disposeReverseWebcodecsControllers();
});

ok("disable xóa decision riêng + settled counter reset ở dispose", () => {
  disposeReverseWebcodecsControllers();
  const c = getReversePreviewController("fake://t4-disable.mp4");
  c.enableDecodeAheadFromGate({ optIn: true, hardwareProof: HW_ABSENT, softwareMeasurement: EASY });
  assert.notEqual(c.lastGateDecisionForController, null);
  c.disableDecodeAhead();
  assert.equal(c.lastGateDecisionForController, null);
  assert.equal(c.decodeAheadActive, false);
  assert.equal(reverseDecodeAheadStatus().controllers[0].reasons.length, 0);
  disposeReverseWebcodecsControllers();
  setReverseDecodeAheadWanted(false);
});

void runAll();
