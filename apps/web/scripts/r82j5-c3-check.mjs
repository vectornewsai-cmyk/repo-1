#!/usr/bin/env node
/**
 * r82j5-c3-check.mjs — Phase 9 đợt 82, luồng J5: KIỂM CHỨNG BỔ SUNG cho
 * thí nghiệm A (chạy SAU r82j5-resid-mechanism.mjs).
 *
 * Vấn đề phát hiện khi đọc log A: render-1k slovenska KHÔNG phải C2
 * (1-kernel YUV) mà là C3 (trilinear RGB) — xem r72z2-rebuild.json
 * (slovenska winner: C3-tri-rgb). Vì vậy A1 (C2 trên frame đã encode)
 * trộn cả chênh lệch bộ lọc C2-vs-C3 (std 0,62 ở 1280) vào ước lượng
 * làm mượt. Check này tách sạch:
 *  1. C3(native RGB f25) có bằng render-1k không? (phải ~0 — kiểm
 *     chứng lại kết luận winner C3).
 *  2. resid với render = C3(VP9-decode f25 RGB): cùng bộ lọc C3, cùng
 *     frame đã encode — chênh với A0 chỉ còn làm mượt VP9 thuần.
 *  3. resid với render = C3(VP9-decode f24 RGB): xác nhận lại điểm cực
 *     tiểu f24 bằng đúng bộ lọc của render-1k (không còn nghi ngờ do C2).
 *
 * File ra: hidden_files/round82-j5/r82j5-c3-check.json.
 * Chạy (từ gốc repo): node apps/web/scripts/r82j5-c3-check.mjs
 * KHÔNG push/tag/binary/workflow. Không sửa code production, không sửa
 * script lịch sử.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { evalDelta0CaseRaw, b64ToRgb } from "./delta0-harness.mjs";
import { resampleRgb24Trilinear } from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const Z2 = path.join(GOAL, "round72-z2");
const RENDER_NEW = path.join(Z2, "render-1k");
const NATIVE = path.join(Z2, "native");
const F7 = path.join(GOAL, "round78-f7");
const J5 = path.join(GOAL, "round82-j5");
const RENDER = path.join(J5, "render");
const r4 = (x) => +x.toFixed(4);

function diffStats(a, b) {
  const n = a.length / 3, out = { std: [], mad: [] };
  for (let c = 0; c < 3; c++) {
    let m = 0, s2 = 0, sAbs = 0;
    for (let i = c; i < a.length; i += 3) { const d = a[i] - b[i]; m += d; s2 += d * d; sAbs += Math.abs(d); }
    m /= n;
    out.std.push(r4(Math.sqrt(Math.max(0, s2 / n - m * m))));
    out.mad.push(r4(sAbs / n));
  }
  return out;
}
function transferNoise(plainNew, plainOld, noiseOld) {
  const out = Buffer.alloc(plainNew.length);
  let clamped = 0;
  for (let i = 0; i < plainNew.length; i++) {
    const v = plainNew[i] + (noiseOld[i] - plainOld[i]);
    if (v < 0) { out[i] = 0; clamped++; } else if (v > 255) { out[i] = 255; clamped++; } else out[i] = v;
  }
  return { buf: out, clampedFrac: r4(clamped / plainNew.length) };
}

async function main() {
  const f7doc = JSON.parse(fs.readFileSync(path.join(F7, "headed-w1920x1080-slovenska-r2", "r78f7-snaps-w1920x1080.json"), "utf8"));
  const snap = f7doc.snaps.slovenska;
  const prevPlain = b64ToRgb(snap.plain.rgbB64);
  const prevNoise05 = b64ToRgb(snap.noise05.rgbB64);
  const [VW, VH] = [snap.plain.w, snap.plain.h];
  const slovRender1k = fs.readFileSync(path.join(RENDER_NEW, "fullrgb-slovenska-plain.raw"));
  const slovNoise05_1k = fs.readFileSync(path.join(RENDER_NEW, "fullrgb-slovenska-noise05.raw"));
  const nativeRgb = fs.readFileSync(path.join(NATIVE, "slovenska-f25-1920.rgb"));

  // 1. C3(native) vs render-1k.
  const c3native = resampleRgb24Trilinear(nativeRgb, 1920, 1080, 1280, 720);
  const d1 = diffStats(c3native, slovRender1k);
  console.log(`1. C3(native-f25-RGB) vs render-1k: std=${JSON.stringify(d1.std)} mad=${JSON.stringify(d1.mad)} (kỳ vọng ~0 nếu winner đúng là C3)`);

  // 2+3. C3 trên frame VP9-decode f25 / f24.
  const out = { c3nativeVsRender1k: d1, refs: {} };
  for (const f of [25, 24]) {
    const rgb1920 = fs.readFileSync(path.join(RENDER, `webm-f${f}-1920.rgb`));
    const plain1280 = resampleRgb24Trilinear(rgb1920, 1920, 1080, 1280, 720);
    const n05 = transferNoise(plain1280, slovRender1k, slovNoise05_1k);
    const r = evalDelta0CaseRaw({
      name: `J5-C3-vp9dec-f${f}`, regime: "C3 check",
      prevPlain, prevNoise: prevNoise05, plain1280, noise1280: n05.buf, vw: VW, vh: VH,
    });
    console.log(`  C3-vp9dec-f${f}: residStd_R=${r4(r.residStd[0])} residStd=${JSON.stringify(r.residStd.map(r4))} plainMad=${r4(r.plainMad)} d0std_R=${r4(r.d0stdR)} ratio_R=${r4(r.ratioR)} clampFrac=${n05.clampedFrac}`);
    out.refs[`C3-f${f}`] = { residStdR: r4(r.residStd[0]), residStd: r.residStd.map(r4), plainMad: r4(r.plainMad), d0stdR: r4(r.d0stdR), ratioR: r4(r.ratioR) };
  }
  writeFileEpermRetry(path.join(J5, "r82j5-c3-check.json"), JSON.stringify(out, null, 2));
  console.log(`\nJSON: ${path.join(J5, "r82j5-c3-check.json")}`);
  console.log("DONE — C3 check.");
}
main().catch((e) => { console.error(`J5-C3-CHECK LỖI: ${e.stack || e.message}`); process.exitCode = 2; });
