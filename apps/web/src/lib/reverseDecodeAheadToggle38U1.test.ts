// reverseDecodeAheadToggle38U1.test.ts — Toggle UI decode-ahead Q3
// (đợt 38 U1: nối toggle vào controller qua cổng opt-in S3, badge 3 trạng
// thái, i18n vi=en cho mọi chuỗi mới).
//
// Chạy bằng esbuild bundle (cùng lý do T2: reverseWebcodecs.ts import
// "./mp4Demux" không đuôi nên Node strip-types không resolve được):
//   ./node_modules/.bin/esbuild apps/web/src/lib/reverseDecodeAheadToggle38U1.test.ts \
//     --bundle --platform=node --format=cjs --outfile=<scratch>/u1.test.cjs \
//     && node <scratch>/u1.test.cjs
// (chạy từ gốc repo; KHÔNG bundle ra /tmp vì tmpfs 512M từng đầy ở S3).
// Test CHỈ khóa logic thuần + nối registry (cổng + trạng thái + gộp
// decision). Đường đo decode thật (số đo từ cửa sổ decode trong browser)
// thuộc click-test trên app thật (xem LIMITS U1) — không fake số đo ở
// đây, và không có backdoor đặt số đo giả vào controller.
//
// Số đo dùng trong test là số thật của probe T2 (đợt 37):
// - Phiên B (nhẹ): SW 124,27 fps ≥ ngưỡng dễ 60 → cổng cho phép + đúng 3
//   cảnh báo (thử nghiệm / under-load / chưa có hardware decode).
// - Phiên A lượt 2 (nặng): SW 48,01 fps < 60 → cổng chặn.
import assert from "node:assert/strict";
import {
  ReversePreviewController,
  disposeReverseWebcodecsControllers,
  getReversePreviewController,
  getReverseDecodeAheadWanted,
  reverseDecodeAheadStatus,
  setReverseDecodeAheadWanted,
} from "./reverseWebcodecs.ts";
import {
  REVERSE_DECODE_AHEAD_EXPERIMENT_WARNING_VI,
  REVERSE_NO_HARDWARE_WARNING_VI,
  REVERSE_UNDER_LOAD_WARNING_VI,
} from "./reversePreviewGate.ts";
import {
  aggregateDecodeAheadDecisions,
  decodeAheadGateInputForToggle,
  decodeAheadReasonI18nKey,
  DECODE_AHEAD_REASON_CODES,
  prefetchFrameCount,
  resolveDecodeAheadUiStatus,
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
  console.log(`reverseDecodeAheadToggle38U1: ${pass}/${queue.length} test pass`);
}

function flat(obj: unknown, prefix: string, out: Record<string, string>): void {
  if (typeof obj !== "object" || obj === null) return;
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (v && typeof v === "object") flat(v, `${prefix}${k}.`, out);
    else out[`${prefix}${k}`] = String(v);
  }
}

const EASY_MEASUREMENT = {
  decodeFps: 124.27,
  loadLabel: "under-load" as const,
  resolution: "854x480",
};
const SLOW_MEASUREMENT = {
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

ok("uiStatus: tắt / bị chặn / đang chạy (active thắng wanted)", () => {
  assert.equal(resolveDecodeAheadUiStatus(false, false), "off");
  assert.equal(resolveDecodeAheadUiStatus(true, false), "blocked");
  assert.equal(resolveDecodeAheadUiStatus(false, true), "running");
  assert.equal(resolveDecodeAheadUiStatus(true, true), "running");
});

ok("prefetchFrameCount: null=0, đoạn T2 497-579=83, ngược=0", () => {
  assert.equal(prefetchFrameCount(null), 0);
  assert.equal(prefetchFrameCount({ from: 497, to: 579 }), 83);
  assert.equal(prefetchFrameCount({ from: 10, to: 5 }), 0);
});

ok("mọi mã lý do cổng đều có key i18n riêng, mã lạ về unknown", () => {
  const keys = DECODE_AHEAD_REASON_CODES.map(decodeAheadReasonI18nKey);
  assert.equal(new Set(keys).size, keys.length);
  for (const k of keys) {
    assert.ok(k.startsWith("decodeahead.reason."), k);
    assert.notEqual(k, "decodeahead.reason.unknown");
  }
  assert.equal(decodeAheadReasonI18nKey("khong-co-ma-nay"), "decodeahead.reason.unknown");
  assert.equal(decodeAheadReasonI18nKey(""), "decodeahead.reason.unknown");
});

ok("i18n: section decodeahead vi=en đủ key, không thừa/thiếu, khác rỗng", () => {
  const expected = [
    "decodeahead.toggleOn",
    "decodeahead.toggleOff",
    "decodeahead.toggleBlocked",
    "decodeahead.toggleAria",
    "decodeahead.toggleHint",
    "decodeahead.badgeRunning",
    "decodeahead.badgeBlocked",
    // Đợt 39 T4: thêm key badgeBlockedMulti (nhiều clip, lý do khác nhau).
    "decodeahead.badgeBlockedMulti",
    "decodeahead.badgeOff",
    "decodeahead.toastBlocked",
    "decodeahead.toastOffNote",
    "decodeahead.reason.unknown",
    ...DECODE_AHEAD_REASON_CODES.map(decodeAheadReasonI18nKey),
  ];
  const fv: Record<string, string> = {};
  const fe: Record<string, string> = {};
  flat((viDict as Record<string, unknown>).decodeahead, "decodeahead.", fv);
  flat((enDict as Record<string, unknown>).decodeahead, "decodeahead.", fe);
  assert.deepEqual(Object.keys(fv).sort(), [...expected].sort());
  assert.deepEqual(Object.keys(fe).sort(), [...expected].sort());
  for (const k of expected) {
    assert.ok(fv[k].length > 0, `vi rỗng: ${k}`);
    assert.ok(fe[k].length > 0, `en rỗng: ${k}`);
  }
});

ok("gate input cho toggle: optIn=wanted, hardware luôn null, giữ số đo", () => {
  const off = decodeAheadGateInputForToggle(false, EASY_MEASUREMENT);
  assert.equal(off.optIn, false);
  assert.equal(off.hardwareProof, null);
  assert.deepEqual(off.softwareMeasurement, EASY_MEASUREMENT);
  const on = decodeAheadGateInputForToggle(true, null);
  assert.equal(on.optIn, true);
  assert.equal(on.softwareMeasurement, null);
});

ok("aggregate: 1 allowed thắng, warnings gộp không trùng, giữ thứ tự", () => {
  const blocked = {
    verdict: "blocked" as const,
    reasons: ["hardware-not-measured", "software-decode-not-measured"],
    warnings: [],
  };
  const allowed = {
    verdict: "allowed-experiment" as const,
    reasons: ["easy-decode-footage"],
    warnings: [
      REVERSE_DECODE_AHEAD_EXPERIMENT_WARNING_VI,
      REVERSE_UNDER_LOAD_WARNING_VI,
    ],
  };
  const agg = aggregateDecodeAheadDecisions([blocked, allowed, allowed]);
  assert.equal(agg.verdict, "allowed-experiment");
  assert.deepEqual(agg.warnings, [
    REVERSE_DECODE_AHEAD_EXPERIMENT_WARNING_VI,
    REVERSE_UNDER_LOAD_WARNING_VI,
  ]);
  const allBlocked = aggregateDecodeAheadDecisions([blocked, {
    verdict: "blocked" as const,
    reasons: ["software-decode-below-easy-threshold", "hardware-not-measured"],
    warnings: [],
  }]);
  assert.equal(allBlocked.verdict, "blocked");
  assert.deepEqual(allBlocked.warnings, []);
  assert.deepEqual(allBlocked.reasons, [
    "hardware-not-measured",
    "software-decode-not-measured",
    "software-decode-below-easy-threshold",
  ]);
});

ok("mặc định registry: wanted=false, status off, decision null", () => {
  disposeReverseWebcodecsControllers();
  setReverseDecodeAheadWanted(false);
  assert.equal(getReverseDecodeAheadWanted(), false);
  const st = reverseDecodeAheadStatus();
  assert.equal(st.uiStatus, "off");
  assert.equal(st.active, false);
  assert.equal(st.prefetchFrames, 0);
  assert.equal(st.decision, null);
  assert.deepEqual(st.warnings, []);
});

ok("toggle bật khi chưa có controller: bị chặn đúng 2 lý do chưa đo", () => {
  disposeReverseWebcodecsControllers();
  const d = setReverseDecodeAheadWanted(true);
  assert.equal(getReverseDecodeAheadWanted(), true);
  assert.equal(d?.verdict, "blocked");
  assert.deepEqual(d?.reasons, [
    "hardware-not-measured",
    "software-decode-not-measured",
  ]);
  const st = reverseDecodeAheadStatus();
  assert.equal(st.uiStatus, "blocked");
  assert.equal(st.active, false);
  assert.deepEqual(st.reasons, [
    "hardware-not-measured",
    "software-decode-not-measured",
  ]);
  setReverseDecodeAheadWanted(false);
});

ok("toggle bật khi controller chưa có số đo: chặn, không bật lén", () => {
  disposeReverseWebcodecsControllers();
  const c = getReversePreviewController("fake://u1-nomeasure.mp4");
  assert.equal(c.lastSoftwareDecodeMeasurement, null);
  const d = setReverseDecodeAheadWanted(true);
  assert.equal(d?.verdict, "blocked");
  assert.equal(c.decodeAheadActive, false);
  assert.equal(reverseDecodeAheadStatus().uiStatus, "blocked");
  setReverseDecodeAheadWanted(false);
  assert.equal(getReverseDecodeAheadWanted(), false);
  disposeReverseWebcodecsControllers();
});

ok("cổng mở bằng số T2 phiên B, chặn bằng số phiên A (không đổi ngưỡng)", () => {
  const c = new ReversePreviewController("fake://u1-gate.mp4");
  const allowed = c.enableDecodeAheadFromGate({
    optIn: true,
    hardwareProof: HW_ABSENT,
    softwareMeasurement: EASY_MEASUREMENT,
  });
  assert.equal(allowed.verdict, "allowed-experiment");
  assert.equal(c.decodeAheadActive, true);
  assert.deepEqual(c.decodeAheadWarningList, [
    REVERSE_DECODE_AHEAD_EXPERIMENT_WARNING_VI,
    REVERSE_UNDER_LOAD_WARNING_VI,
    REVERSE_NO_HARDWARE_WARNING_VI,
  ]);
  const blocked = c.enableDecodeAheadFromGate({
    optIn: true,
    hardwareProof: HW_ABSENT,
    softwareMeasurement: SLOW_MEASUREMENT,
  });
  assert.equal(blocked.verdict, "blocked");
  assert.equal(c.decodeAheadActive, false);
  assert.deepEqual(c.decodeAheadWarningList, []);
});

ok("disableDecodeAhead: tắt + xóa warnings + aheadRange null (không decision)", () => {
  const c = new ReversePreviewController("fake://u1-disable.mp4");
  c.enableDecodeAheadFromGate({
    optIn: true,
    hardwareProof: HW_ABSENT,
    softwareMeasurement: EASY_MEASUREMENT,
  });
  assert.equal(c.decodeAheadActive, true);
  c.disableDecodeAhead();
  assert.equal(c.decodeAheadActive, false);
  assert.deepEqual(c.decodeAheadWarningList, []);
  assert.equal(c.aheadDecodeRange, null);
});

ok("tắt toggle: tắt mọi controller registry + xóa decision chặn cũ", () => {
  disposeReverseWebcodecsControllers();
  const c = getReversePreviewController("fake://u1-off.mp4");
  c.enableDecodeAheadFromGate({
    optIn: true,
    hardwareProof: HW_ABSENT,
    softwareMeasurement: EASY_MEASUREMENT,
  });
  assert.equal(c.decodeAheadActive, true);
  // Tắt trực tiếp từ trạng thái đang chạy (không qua bật): phải tắt
  // được controller đang active, không chỉ xóa decision chặn.
  const off = setReverseDecodeAheadWanted(false);
  assert.equal(off, null);
  assert.equal(c.decodeAheadActive, false);
  assert.equal(reverseDecodeAheadStatus().uiStatus, "off");
  assert.equal(reverseDecodeAheadStatus().decision, null);
  disposeReverseWebcodecsControllers();
  setReverseDecodeAheadWanted(false);
});

void runAll();
