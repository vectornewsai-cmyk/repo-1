// reversePreviewGate.test.ts — test cổng phát ngược (Phase 9 đợt 36 S3).
// Chạy: node --experimental-strip-types apps/web/src/lib/reversePreviewGate.test.ts
import { strict as assert } from "node:assert";
import {
  isHardwareDecodeProven,
  isEasyDecodeFootage,
  resolveDecodeAheadGate,
  resolveProxyMainDirection,
} from "./reversePreviewGate.ts";

let pass = 0;
function ok(name, fn) {
  fn();
  pass += 1;
  console.log(`ok ${pass} - ${name}`);
}

ok("opt-in tắt -> blocked dù có HW", () => {
  const d = resolveDecodeAheadGate({ optIn: false, hardwareProof: { preferHardwareSupported: true, hardwareDecodedFrames: 300, hardwareAttemptedFrames: 300, hardwareDecodeFps: 120 }, softwareMeasurement: null });
  assert.equal(d.verdict, "blocked");
  assert.ok(d.reasons.includes("opt-in-off"));
});

ok("HW proven: supported + decode > 0 frame -> proven", () => {
  assert.equal(isHardwareDecodeProven({ preferHardwareSupported: true, hardwareDecodedFrames: 300, hardwareAttemptedFrames: 300, hardwareDecodeFps: 120 }), true);
});

ok("R4: supported=false + decode 0/300 -> KHÔNG proven", () => {
  assert.equal(isHardwareDecodeProven({ preferHardwareSupported: false, hardwareDecodedFrames: 0, hardwareAttemptedFrames: 300, hardwareDecodeFps: null }), false);
});

ok("supported=true nhưng decode 0 frame -> KHÔNG proven (bài học R4)", () => {
  assert.equal(isHardwareDecodeProven({ preferHardwareSupported: true, hardwareDecodedFrames: 0, hardwareAttemptedFrames: 300, hardwareDecodeFps: null }), false);
});

ok("opt-in + HW proven -> allowed-experiment kèm cảnh báo", () => {
  const d = resolveDecodeAheadGate({ optIn: true, hardwareProof: { preferHardwareSupported: true, hardwareDecodedFrames: 300, hardwareAttemptedFrames: 300, hardwareDecodeFps: 120 }, softwareMeasurement: null });
  assert.equal(d.verdict, "allowed-experiment");
  assert.ok(d.warnings.length >= 1);
});

ok("opt-in + footage phẳng (decode ~1000fps) -> allowed-experiment", () => {
  const d = resolveDecodeAheadGate({ optIn: true, hardwareProof: { preferHardwareSupported: false, hardwareDecodedFrames: 0, hardwareAttemptedFrames: 300, hardwareDecodeFps: null }, softwareMeasurement: { decodeFps: 1000, loadLabel: "under-load", resolution: "1280x720" } });
  assert.equal(d.verdict, "allowed-experiment");
  assert.ok(d.warnings.some((w) => w.includes("under-load")));
});

ok("opt-in + nhiễu software 36fps under-load -> blocked (dưới ngưỡng dễ 60fps)", () => {
  assert.equal(isEasyDecodeFootage({ decodeFps: 36, loadLabel: "under-load", resolution: "1280x720" }), false);
  const d = resolveDecodeAheadGate({ optIn: true, hardwareProof: { preferHardwareSupported: false, hardwareDecodedFrames: 0, hardwareAttemptedFrames: 300, hardwareDecodeFps: null }, softwareMeasurement: { decodeFps: 36, loadLabel: "under-load", resolution: "1280x720" } });
  assert.equal(d.verdict, "blocked");
});

ok("opt-in + chưa đo gì -> blocked", () => {
  const d = resolveDecodeAheadGate({ optIn: true, hardwareProof: null, softwareMeasurement: null });
  assert.equal(d.verdict, "blocked");
  assert.ok(d.reasons.includes("hardware-not-measured"));
  assert.ok(d.reasons.includes("software-decode-not-measured"));
});

ok("proxy: displayed >= 30, không thua gốc, decode >= 30 -> yes", () => {
  const d = resolveProxyMainDirection({ proxyDisplayedFps: 30, originalDisplayedFps: 12, proxyDecodeFps: 80, playbackFps: 30 });
  assert.equal(d.verdict, "yes");
});

ok("proxy: displayed < 30 -> no", () => {
  const d = resolveProxyMainDirection({ proxyDisplayedFps: 18, originalDisplayedFps: 12, proxyDecodeFps: 80, playbackFps: 30 });
  assert.equal(d.verdict, "no");
  assert.ok(d.reasons.includes("proxy-displayed-below-playback-fps"));
});

ok("proxy: chưa đo displayed -> no (không đoán)", () => {
  const d = resolveProxyMainDirection({ proxyDisplayedFps: null, originalDisplayedFps: 12, proxyDecodeFps: 80, playbackFps: 30 });
  assert.equal(d.verdict, "no");
});

ok("proxy: displayed thua gốc -> no dù vẫn >= 30", () => {
  const d = resolveProxyMainDirection({ proxyDisplayedFps: 31, originalDisplayedFps: 40, proxyDecodeFps: 80, playbackFps: 30 });
  assert.equal(d.verdict, "no");
  assert.ok(d.reasons.includes("proxy-displayed-worse-than-original"));
});

console.log(`\n== reversePreviewGate: ${pass} pass ==`);
