#!/usr/bin/env node
/**
 * r82j5-resid-mechanism.mjs — Phase 9 đợt 82, luồng J5: PHÂN BIỆT CƠ CHẾ
 * Q4 resid — "làm mượt x264" (i) vs "motion mismatch" (ii).
 *
 * BỐI CẢNH (đọc docs/PHASE9_ROUND81_I4_G1G2_UNROUNDED_LIMITS.md §4.4 trước):
 *  - resid video thật slovenska (F7, w1920): 2,95; still slovenska (I4,
 *    x264 crf 18, w1920): 0,74; test-pattern still: 4,46 (giữ nguyên).
 *  - HAI cơ chế ứng viên CHƯA phân biệt được: (i) x264 làm mượt chi tiết
 *    mịn; (ii) motion mismatch làm phồng resid video thật.
 *  - PHÁT HIỆN MỚI khi đọc lại chuỗi đo (xem LIMITS J5 §1): hai số này
 *    KHÔNG cùng chuỗi đo — F7 so preview (browser decode VP9 webm 1920,
 *    frame 25 @1,0 s) với render THAM CHIẾU LÀ FRAME GỐC 1920 (native
 *    f25 → C2 1920→1280 → trilinear), còn I4 so preview với render LÀ
 *    CÙNG FRAME ĐÃ ENCODE (ffmpeg decode still mp4 frame 30). Vì vậy
 *    "motion mismatch" phải tách thành 2 giả thuyết con:
 *      (ii-a) lệch CHỈ SỐ FRAME (preview frame N vs render frame M ≠ N);
 *      (ii-b) motion thật trong nội dung (frame khác nhau theo thời gian).
 *    Thí nghiệm A phân rã F7 2,95 thành: làm mượt encode + bước
 *    1920→1280 + lệch frame, bằng cách đổi render tham chiếu trong khi
 *    GIỮ NGUYÊN snapshot preview F7.
 *
 * THÍ NGHIỆM (không cần browser — chỉ node + ffmpeg; xem LIMITS §2–§4):
 *  A. Phân rã F7: prevPlain = snapshot F7 slovenska w1920 (809×455),
 *     đổi render tham chiếu: A0 native f25 (tái lập 2,95); A1 VP9 decode
 *     f25 (cùng frame đã encode); A2 VP9 decode f20/22/24/26/28/30
 *     (đường cong lệch frame = motion); A3 native f25 → trilinear
 *     TRỰC TIẾP 1920→viewport (bỏ bước 1280); A4 VP9 f25 → ffmpeg
 *     bicubic 1920→1280 (nhạy bộ lọc); A5 h264-720p f30 (khác codec).
 *  B. Sweep làm mượt (i): still slovenska + test-pattern qua x264
 *     crf 0/10/18/23/28/35, VP9 crf 0/18/30, x265 crf 18, AV1 crf 18/30;
 *     đo sai số làm mượt std/MAD của frame decode so với frame gốc.
 *  C. (script riêng r82j5-pan-build.mjs + capture headed): still
 *     slovenska có motion giả (pan 0/2/8 px/frame), đo resid khi render
 *     KHỚP frame vs LỆCH 5 frame — xem LIMITS J5 §5.
 *  D. Đối chứng test-pattern: D1 MAD f25 vs f30 của test-pattern.mp4
 *     (still-loop?); D2 sai khác giữa 2 kernel resample trên cùng
 *     frame (trilinear vs 1-kernel) — tp resid 4,46 có phải do kernel?
 *
 * File ra (KHÔNG stage — binary + JSON thô; script này tái lập được):
 *   hidden_files/round82-j5/render/*.{rgb,yuv,raw} (frame decode/encode)
 *   hidden_files/round82-j5/r82j5-resid-mechanism.json (mọi số đo)
 * Chạy (từ gốc repo): node apps/web/scripts/r82j5-resid-mechanism.mjs
 * KHÔNG push/tag/binary/workflow. Không sửa code production, không sửa
 * script lịch sử (chỉ import delta0-harness + chrome-resample).
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import {
  evalDelta0CaseRaw, channelStatsRaw, absMadRaw, b64ToRgb,
  delta0Viewport_70x6,
} from "./delta0-harness.mjs";
import {
  resampleRgb24Trilinear, resampleRgb24, resampleYuv420p,
} from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const Z2 = path.join(GOAL, "round72-z2");
const RENDER_NEW = path.join(Z2, "render-1k");
const NATIVE = path.join(Z2, "native");
const R66T3 = path.join(GOAL, "round66-t3", "render");
const R65 = path.join(GOAL, "round65-s7");
const U3 = path.join(GOAL, "round67-u3");
const F7 = path.join(GOAL, "round78-f7");
const I4 = path.join(GOAL, "round81-i4");
const J5 = path.join(GOAL, "round82-j5");
const RENDER = path.join(J5, "render");
const MEDIA = path.join(J5, "media");
fs.mkdirSync(RENDER, { recursive: true });
fs.mkdirSync(MEDIA, { recursive: true });

const r4 = (x) => +x.toFixed(4);
const r2 = (x) => +x.toFixed(2);
const report = { generated: new Date().toISOString(), A: {}, B: {}, D: {} };

function ff(args, timeoutMs = 300000) {
  execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { timeout: timeoutMs });
}
function ffTimed(args, timeoutMs = 300000) {
  const t0 = Date.now();
  execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { timeout: timeoutMs });
  return (Date.now() - t0) / 1000;
}
function statsPerChannel(buf) {
  // std + mean từng kênh R/G/B của một frame RGB (Buffer).
  const n = buf.length / 3, out = { std: [], mean: [] };
  for (let c = 0; c < 3; c++) {
    let m = 0; for (let i = c; i < buf.length; i += 3) m += buf[i]; m /= n;
    let s2 = 0; for (let i = c; i < buf.length; i += 3) { const v = buf[i] - m; s2 += v * v; }
    out.mean.push(r2(m)); out.std.push(r2(Math.sqrt(s2 / n)));
  }
  return out;
}
function diffStats(a, b) {
  // std + MAD từng kênh của (a - b); a, b cùng kích thước.
  if (a.length !== b.length) throw new Error(`diffStats: độ dài ${a.length} ≠ ${b.length}`);
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
  // Z2: noiseMới = plainMới + (noiseCũ − plainCũ), kẹp 0..255, đếm pixel kẹp.
  const out = Buffer.alloc(plainNew.length);
  let clamped = 0;
  for (let i = 0; i < plainNew.length; i++) {
    const v = plainNew[i] + (noiseOld[i] - plainOld[i]);
    if (v < 0) { out[i] = 0; clamped++; } else if (v > 255) { out[i] = 255; clamped++; } else out[i] = v;
  }
  return { buf: out, clampedFrac: r4(clamped / plainNew.length) };
}
function residStd(prevPlain, render1280, vw, vh) {
  const tri = resampleRgb24Trilinear(render1280, 1280, 720, vw, vh);
  const resid = new Float64Array(vw * vh * 3);
  for (let i = 0; i < vw * vh * 3; i++) resid[i] = prevPlain[i] - tri[i];
  return { residStd: channelStatsRaw(resid).std.map(r4), plainMad: r4(absMadRaw(prevPlain, tri)) };
}

async function main() {
  console.log("== J5: phân biệt cơ chế Q4 resid (i) làm mượt x264 vs (ii) motion mismatch ==\n");

  // ---------- tải snapshot + frame gốc ----------
  const f7doc = JSON.parse(fs.readFileSync(path.join(F7, "headed-w1920x1080-slovenska-r2", "r78f7-snaps-w1920x1080.json"), "utf8"));
  const f7snap = f7doc.snaps.slovenska;
  const prevPlainF7 = b64ToRgb(f7snap.plain.rgbB64);
  const prevNoise05F7 = b64ToRgb(f7snap.noise05.rgbB64);
  const [VW, VH] = [f7snap.plain.w, f7snap.plain.h];
  console.log(`F7 snapshot slovenska: rect ${VW}x${VH}, D3 same-frame=${f7doc.rawFrames?.slovenska?.plain?.hash === f7doc.rawFrames?.slovenska?.noise05?.hash}`);
  const i4doc = JSON.parse(fs.readFileSync(path.join(I4, "headed-w1920x1080", "r81i4-snaps-w1920x1080.json"), "utf8"));
  const i4snap = i4doc.snaps["plain-slovenska"];
  const prevPlainI4 = b64ToRgb(i4snap.plain.rgbB64);
  const prevNoise05I4 = b64ToRgb(i4snap.noise05.rgbB64);
  console.log(`I4 snapshot plain-slovenska: rect ${i4snap.plain.w}x${i4snap.plain.h}`);

  const slovNativeRgb = fs.readFileSync(path.join(NATIVE, "slovenska-f25-1920.rgb"));
  const slovNativeYuv = fs.readFileSync(path.join(NATIVE, "slovenska-f25-1920.yuv"));
  const slovRender1k = fs.readFileSync(path.join(RENDER_NEW, "fullrgb-slovenska-plain.raw"));
  const slovNoise05_1k = fs.readFileSync(path.join(RENDER_NEW, "fullrgb-slovenska-noise05.raw"));
  const slovNoise10_1k = fs.readFileSync(path.join(RENDER_NEW, "fullrgb-slovenska-noise10.raw"));
  const tpPlain = fs.readFileSync(path.join(R66T3, "fullrgb-plain.raw"));
  const tpNoise05 = fs.readFileSync(path.join(R66T3, "fullrgb-noise05.raw"));
  const webm = path.join(U3, "media", "slovenska.webm");
  const mp4720 = path.join(U3, "media", "slovenska-720p.mp4");
  const tpMp4 = path.join(R65, "media", "test-pattern.mp4");

  // ---------- BƯỚC 0: tái lập I4 + F7 (sanity) ----------
  console.log("\n== 0. Tái lập (sanity check chuỗi đo) ==");
  const repI4 = evalDelta0CaseRaw({
    name: "J5-repro-I4-still-slov-w1920-n05", regime: "tái lập I4",
    prevPlain: prevPlainI4, prevNoise: prevNoise05I4,
    plain1280: fs.readFileSync(path.join(I4, "render", "plain-slovenska-plain.raw")),
    noise1280: fs.readFileSync(path.join(I4, "render", "plain-slovenska-noise05.raw")),
    vw: VW, vh: VH,
  });
  console.log(`  I4 still slovenska: residStd_R=${r4(repI4.residStd[0])} (I4 báo 0,74) plainMad=${r4(repI4.plainMad)} (I4 báo 0,65) d0std_R=${r4(repI4.d0stdR)}`);
  const repF7 = evalDelta0CaseRaw({
    name: "J5-repro-F7-real-slov-w1920-n05", regime: "tái lập F7",
    prevPlain: prevPlainF7, prevNoise: prevNoise05F7,
    plain1280: slovRender1k, noise1280: slovNoise05_1k, vw: VW, vh: VH,
  });
  console.log(`  F7 real slovenska: residStd_R=${r4(repF7.residStd[0])} (F7 báo 2,95) plainMad=${r4(repF7.plainMad)} (F7 báo 1,82) d0std_R=${r4(repF7.d0stdR)}`);
  report.repro = {
    i4: { residStdR: r4(repI4.residStd[0]), plainMad: r4(repI4.plainMad), d0stdR: r4(repI4.d0stdR) },
    f7: { residStdR: r4(repF7.residStd[0]), plainMad: r4(repF7.plainMad), d0stdR: r4(repF7.d0stdR) },
  };

  // ---------- A: decode các frame webm ----------
  console.log("\n== A. Decode frame webm VP9 1920 (slovenska.webm, 25fps) ==");
  const webmFrames = {};
  for (const f of [20, 22, 24, 25, 26, 28, 30]) {
    const rgbP = path.join(RENDER, `webm-f${f}-1920.rgb`);
    const yuvP = path.join(RENDER, `webm-f${f}-1920.yuv`);
    if (!fs.existsSync(rgbP)) {
      ff(["-i", webm, "-vf", `select=eq(n\\,${f}),scale=1920:1080:in_color_matrix=bt709:out_color_matrix=bt709`,
        "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", rgbP]);
      ff(["-i", webm, "-vf", `select=eq(n\\,${f}),scale=1920:1080`, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "yuv420p", yuvP]);
    }
    webmFrames[f] = { rgb: fs.readFileSync(rgbP), yuv: fs.readFileSync(yuvP) };
    console.log(`  f${f}: rgb ${fs.statSync(rgbP).size} B, yuv ${fs.statSync(yuvP).size} B`);
  }
  // Kiểm tra native f25 có đúng là webm f25 decode không (MAD).
  const natVsWebm = diffStats(slovNativeRgb, webmFrames[25].rgb);
  console.log(`  native-f25-rgb vs webm-f25-decode: std=${JSON.stringify(natVsWebm.std)} mad=${JSON.stringify(natVsWebm.mad)} (kỳ vọng ~0 nếu cùng nguồn)`);

  // C2: 1920->1280 qua resampleYuv420p (bộ lọc thắng Z2).
  const c2 = (yuv) => resampleYuv420p(yuv, 1920, 1080, 1280, 720);
  const c2f25 = c2(webmFrames[25].yuv);
  const c2vsRender1k = diffStats(c2f25, slovRender1k);
  console.log(`  C2(webm-f25-yuv) vs render-1k fullrgb-slovenska-plain: std=${JSON.stringify(c2vsRender1k.std)} mad=${JSON.stringify(c2vsRender1k.mad)}`);

  // ---------- A: phân rã resid F7 ----------
  console.log("\n== A. Phân rã resid F7 (prevPlain F7 cố định, đổi render tham chiếu) ==");
  const aRows = [];
  function evalRef(tag, plain1280, note) {
    const n05 = transferNoise(plain1280, slovRender1k, slovNoise05_1k);
    const r = evalDelta0CaseRaw({
      name: `J5-A-${tag}`, regime: "phân rã F7",
      prevPlain: prevPlainF7, prevNoise: prevNoise05F7,
      plain1280, noise1280: n05.buf, vw: VW, vh: VH,
    });
    const row = { tag, note, residStdR: r4(r.residStd[0]), residStd: r.residStd.map(r4), plainMad: r4(r.plainMad), d0stdR: r4(r.d0stdR), ratioR: r4(r.ratioR), clampFrac: n05.clampedFrac };
    aRows.push(row);
    console.log(`  ${tag}: residStd_R=${row.residStdR} plainMad=${row.plainMad} d0std_R=${row.d0stdR} ratio_R=${row.ratioR} | ${note}`);
    return row;
  }
  evalRef("A0-native-f25-C2", slovRender1k, "tái lập F7: native f25 → C2 1920→1280");
  evalRef("A1-vp9dec-f25-C2", c2f25, "cùng frame đã encode: VP9 decode f25 → C2 (bỏ làm mượt + native-vs-encode)");
  for (const f of [20, 22, 24, 26, 28, 30]) {
    evalRef(`A2-vp9dec-f${f}-C2`, c2(webmFrames[f].yuv), `lệch frame ${f - 25 > 0 ? "+" : ""}${f - 25} (motion)`);
  }
  // A4: VP9 f25 qua ffmpeg bicubic 1920->1280 (C0 cũ).
  const bicP = path.join(RENDER, "webm-f25-1280-bicubic.rgb");
  if (!fs.existsSync(bicP)) {
    ff(["-f", "rawvideo", "-s", "1920x1080", "-pix_fmt", "yuv420p", "-i", path.join(RENDER, "webm-f25-1920.yuv"),
      "-vf", "scale=1280:720:in_color_matrix=bt709:out_color_matrix=bt709", "-f", "rawvideo", "-pix_fmt", "rgb24", bicP]);
  }
  evalRef("A4-vp9dec-f25-bicubic", fs.readFileSync(bicP), "cùng frame đã encode, nhưng 1920→1280 bằng ffmpeg bicubic (C0)");
  // A5: h264 720p f30 (30fps, 1,0 s — cùng timestamp, khác codec/độ phân giải).
  const h264P = path.join(RENDER, "h264-720p-f30-1280.rgb");
  if (!fs.existsSync(h264P)) {
    ff(["-i", mp4720, "-vf", "select=eq(n\\,30),scale=1280:720:in_color_matrix=bt709:out_color_matrix=bt709",
      "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", h264P]);
  }
  evalRef("A5-h264-720p-f30", fs.readFileSync(h264P), "h264 720p f30 @1,0 s (khác codec, cùng timestamp)");
  report.A.refs = aRows;

  // A3: native f25 → trilinear TRỰC TIẾP 1920→viewport (không qua 1280).
  const tri1920 = resampleRgb24Trilinear(slovNativeRgb, 1920, 1080, VW, VH);
  const residA3 = new Float64Array(VW * VH * 3);
  for (let i = 0; i < VW * VH * 3; i++) residA3[i] = prevPlainF7[i] - tri1920[i];
  const a3std = channelStatsRaw(residA3).std.map(r4);
  const a3mad = r4(absMadRaw(prevPlainF7, tri1920));
  console.log(`  A3-native-f25-tri1920-direct: residStd_R=${a3std[0]} residStd=${JSON.stringify(a3std)} plainMad=${a3mad} | native → trilinear thẳng 1920→viewport (bỏ bước 1280)`);
  // A3b: cùng nhưng bằng 1-kernel (resampleRgb24) 1920→viewport.
  const one1920 = resampleRgb24(slovNativeRgb, 1920, 1080, VW, VH);
  const residA3b = new Float64Array(VW * VH * 3);
  for (let i = 0; i < VW * VH * 3; i++) residA3b[i] = prevPlainF7[i] - one1920[i];
  const a3bstd = channelStatsRaw(residA3b).std.map(r4);
  console.log(`  A3b-native-f25-1kernel1920: residStd_R=${a3bstd[0]} residStd=${JSON.stringify(a3bstd)} plainMad=${r4(absMadRaw(prevPlainF7, one1920))} | native → 1-kernel thẳng 1920→viewport`);
  report.A.direct1920 = { A3_trilinear: { residStd: a3std, plainMad: a3mad }, A3b_1kernel: { residStd: a3bstd, plainMad: r4(absMadRaw(prevPlainF7, one1920)) } };

  // Đóng góp làm mượt (ước lượng theo phương sai, giả định độc lập):
  // resid²(A0) − resid²(A1) ≈ phần do (native − encoded) gây ra.
  const a0 = aRows.find((r) => r.tag === "A0-native-f25-C2");
  const a1 = aRows.find((r) => r.tag === "A1-vp9dec-f25-C2");
  const smoothVar = Math.max(0, a0.residStdR ** 2 - a1.residStdR ** 2);
  console.log(`\n  Ước lượng phương sai: resid²(A0)−resid²(A1) = ${r4(smoothVar)} → làm mượt VP9 ≈ std ${r4(Math.sqrt(smoothVar))} (nếu độc lập với phần dư còn lại)`);
  report.A.smoothVarEstimate = { var: r4(smoothVar), std: r4(Math.sqrt(smoothVar)) };

  // ---------- B: sweep làm mượt still encode ----------
  console.log("\n== B. Sweep làm mượt: still encode → decode f30 vs frame gốc ==");
  const sweepSpecs = [
    ["x264", "crf0", ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "0"]],
    ["x264", "crf10", ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "10"]],
    ["x264", "crf18", ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18"]],
    ["x264", "crf23", ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "23"]],
    ["x264", "crf28", ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "28"]],
    ["x264", "crf35", ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "35"]],
    ["vp9", "crf0", ["-c:v", "libvpx-vp9", "-pix_fmt", "yuv420p", "-crf", "0", "-b:v", "0", "-cpu-used", "4", "-deadline", "good"]],
    ["vp9", "crf18", ["-c:v", "libvpx-vp9", "-pix_fmt", "yuv420p", "-crf", "18", "-b:v", "0", "-cpu-used", "4", "-deadline", "good"]],
    ["vp9", "crf30", ["-c:v", "libvpx-vp9", "-pix_fmt", "yuv420p", "-crf", "30", "-b:v", "0", "-cpu-used", "4", "-deadline", "good"]],
    ["x265", "crf18", ["-c:v", "libx265", "-pix_fmt", "yuv420p", "-crf", "18"]],
    ["av1", "crf18", ["-c:v", "libaom-av1", "-pix_fmt", "yuv420p", "-crf", "18", "-cpu-used", "8"]],
    ["av1", "crf30", ["-c:v", "libaom-av1", "-pix_fmt", "yuv420p", "-crf", "30", "-cpu-used", "8"]],
  ];
  for (const [srcName, orig] of [["slov", slovRender1k], ["tp", tpPlain]]) {
    console.log(`  -- nguồn ${srcName} --`);
    report.B[srcName] = [];
    const srcRgb = path.join(RENDER, `sweep-${srcName}-orig.rgb`);
    writeFileEpermRetry(srcRgb, orig);
    for (const [codec, crf, encArgs] of sweepSpecs) {
      const tag = `${srcName}-${codec}-${crf}`;
      const mp4 = path.join(MEDIA, `sweep-${tag}.mp4`);
      const decP = path.join(RENDER, `sweep-${tag}-dec30.raw`);
      try {
        let encSec = null;
        if (!fs.existsSync(mp4)) {
          encSec = ffTimed(["-stream_loop", "-1", "-f", "rawvideo", "-s", "1280x720", "-pix_fmt", "rgb24", "-framerate", "30", "-i", srcRgb,
            "-t", "4", ...encArgs, "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-g", "30", mp4], 900000);
        }
        if (!fs.existsSync(decP)) {
          ff(["-i", mp4, "-vf", "select=eq(n\\,30),scale=1280:720:in_color_matrix=bt709:out_color_matrix=bt709",
            "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", decP]);
        }
        const dec = fs.readFileSync(decP);
        const d = diffStats(dec, orig);
        const row = { tag, codec, crf, encSec, bytes: fs.statSync(mp4).size, smoothStd: d.std, smoothMad: d.mad, smoothStdR: d.std[0] };
        report.B[srcName].push(row);
        console.log(`  ${tag}: smoothStd_R=${d.std[0]} std=${JSON.stringify(d.std)} mad=${JSON.stringify(d.mad)} size=${row.bytes}B enc=${encSec === null ? "cache" : encSec.toFixed(1) + "s"}`);
      } catch (e) {
        console.log(`  ${tag}: LỖI/KHÔNG ĐO ĐƯỢC — ${String(e.message || e).slice(0, 160)}`);
        report.B[srcName].push({ tag, codec, crf, error: String(e.message || e).slice(0, 200) });
      }
    }
  }

  // ---------- D: đối chứng test-pattern ----------
  console.log("\n== D. Đối chứng test-pattern ==");
  // D1: f25 vs f30 của test-pattern.mp4 (still-loop thật không?).
  const tpF25 = path.join(RENDER, "tp-f25.raw");
  const tpF30 = path.join(RENDER, "tp-f30.raw");
  for (const [f, p] of [[25, tpF25], [30, tpF30]]) {
    if (!fs.existsSync(p)) {
      ff(["-i", tpMp4, "-vf", `select=eq(n\\,${f}),scale=1280:720:in_color_matrix=bt709:out_color_matrix=bt709`,
        "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", p]);
    }
  }
  const d1 = diffStats(fs.readFileSync(tpF25), fs.readFileSync(tpF30));
  console.log(`  D1 tp.mp4 f25 vs f30: std=${JSON.stringify(d1.std)} mad=${JSON.stringify(d1.mad)} (still-loop ⟺ ~0)`);
  const d1s = diffStats(fs.readFileSync(tpF25), tpPlain);
  console.log(`  D1b tp.mp4 f25 vs fullrgb-plain.raw: std=${JSON.stringify(d1s.std)} mad=${JSON.stringify(d1s.mad)}`);
  // D2: 2 kernel resample trên cùng frame (trilinear vs 1-kernel) — tp resid 4,46 có phải do kernel?
  for (const [vw, vh] of [[809, 455], [311, 175]]) {
    for (const [nm, frame] of [["tp", tpPlain], ["slov", slovRender1k]]) {
      const tri = resampleRgb24Trilinear(frame, 1280, 720, vw, vh);
      const one = resampleRgb24(frame, 1280, 720, vw, vh);
      const d = diffStats(tri, one);
      console.log(`  D2 ${nm} ${vw}x${vh}: trilinear-vs-1kernel std=${JSON.stringify(d.std)} mad=${JSON.stringify(d.mad)}`);
      report.D[`${nm}-${vw}x${vh}`] = { kernelDiffStd: d.std, kernelDiffMad: d.mad };
    }
  }
  report.D.tpFrameOffset = { f25vsf30: { std: d1.std, mad: d1.mad }, f25vsOrig: { std: d1s.std, mad: d1s.mad } };

  writeFileEpermRetry(path.join(J5, "r82j5-resid-mechanism.json"), JSON.stringify(report, null, 2));
  console.log(`\nJSON: ${path.join(J5, "r82j5-resid-mechanism.json")}`);
  console.log("DONE — thí nghiệm A/B/D (node-only).");
}
main().catch((e) => { console.error(`J5-MECHANISM LỖI: ${e.stack || e.message}`); process.exitCode = 2; });
