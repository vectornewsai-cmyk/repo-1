#!/usr/bin/env node
/**
 * test_export_preset45_74b5.js — Kiểm chứng preset xuất 4:5 end-to-end
 * (Phase 9 đợt 74 B5 — đóng nợ đợt 73 §4 mục 9 / A9).
 *
 * A9 đã thêm preset `ig-portrait` 1080×1350 @30fps vào EXPORT_PRESETS
 * nhưng CHƯA render MP4 thật end-to-end. File này đóng nợ đó:
 *
 * 1. [source] exportPresets.ts chứa entry ig-portrait đúng số
 *    (1080×1350, 30fps, crf 21, medium, 128k) — guard chống drift.
 * 2. [dry-run] render.js với đúng tham số preset → ffmpeg args
 *    "-preset medium -crf 21 -b:a 128k".
 * 3. [render thật] spec project 1080×1350 @30fps, clip text 3s →
 *    MP4 qua pipeline render.js thật → ffprobe verify:
 *    width/height đúng 1080×1350, fps đúng 30, đủ 90 frame,
 *    duration ≈ 3.0s, codec h264.
 *
 * Cách dùng: node test_export_preset45_74b5.js [--out-dir /tmp/preset45-74b5]
 * Yêu cầu: node, ffmpeg, ffprobe. Không cần browser, không cần bridge.
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../eperm-retry.cjs");
const path = require("path");
const { spawnSync, execFileSync } = require("child_process");

const args = process.argv.slice(2);
const outDir = path.resolve(args[args.indexOf("--out-dir") + 1] || "/tmp/preset45-74b5");
fs.mkdirSync(outDir, { recursive: true });

const RENDER_JS = path.join(__dirname, "src", "render.js");
const PRESETS_TS = path.join(__dirname, "..", "..", "apps", "web", "src", "lib", "exportPresets.ts");

// Tham số preset ig-portrait theo exportPresets.ts (A9).
const PRESET = { id: "ig-portrait", width: 1080, height: 1350, fps: 30, crf: 21, x264: "medium", abitrate: "128k" };
const DURATION = 3; // giây
const EXPECTED_FRAMES = PRESET.fps * DURATION;

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.error(`  ✗ FAIL: ${label}`); }
}

/** Spec tối thiểu: 1 text track, đúng khổ preset 4:5. */
function makeSpec() {
  return {
    version: "0.2.0",
    meta: { name: "preset45-test", width: PRESET.width, height: PRESET.height, fps: PRESET.fps },
    tracks: [{
      id: "t1", kind: "text", clips: [{
        kind: "text", id: "c1", text: "Preset 4:5 test",
        start: 0, duration: DURATION,
        style: { fontFamily: "DejaVu Sans", fontSize: 56, color: "#ffffff", x: 0.5, y: 0.5, animation: "none" },
      }],
    }],
  };
}

function ffprobe(file) {
  const raw = execFileSync("ffprobe",
    ["-v", "error", "-count_frames",
     "-show_entries", "stream=codec_name,width,height,r_frame_rate,avg_frame_rate,nb_read_frames",
     "-show_entries", "format=duration", "-of", "json", file],
    { encoding: "utf8" });
  return JSON.parse(raw);
}

console.log("== [1] source: exportPresets.ts có entry ig-portrait đúng số ==");
const src = fs.readFileSync(PRESETS_TS, "utf8");
const block = src.slice(src.indexOf('id: "ig-portrait"'));
ok(block.length > 20, "tìm thấy entry ig-portrait trong exportPresets.ts");
ok(/width:\s*1080/.test(block.slice(0, 400)), "ig-portrait width 1080");
ok(/height:\s*1350/.test(block.slice(0, 400)), "ig-portrait height 1350");
ok(/fps:\s*30/.test(block.slice(0, 400)), "ig-portrait fps 30");
ok(/crf:\s*21/.test(block.slice(0, 400)), "ig-portrait crf 21");
ok(/x264Preset:\s*"medium"/.test(block.slice(0, 400)), 'ig-portrait x264Preset "medium"');
ok(/audioBitrateKbps:\s*128/.test(block.slice(0, 400)), "ig-portrait audioBitrateKbps 128");

console.log("== [2] dry-run: render.js map đúng tham số preset 4:5 ==");
const drySpec = path.join(outDir, "dry-spec.json");
writeFileEpermRetry(drySpec, JSON.stringify(makeSpec()));
const dry = spawnSync("node", [RENDER_JS, "--spec", drySpec,
  "--out", path.join(outDir, "dry.mp4"),
  "--crf", String(PRESET.crf), "--x264-preset", PRESET.x264, "--audio-bitrate", PRESET.abitrate,
  "--dry-run"], { encoding: "utf8" });
const cmd = dry.stdout || "";
ok(dry.status === 0, "dry-run exit 0");
ok(cmd.includes(`-preset ${PRESET.x264}`), `có "-preset ${PRESET.x264}"`);
ok(cmd.includes(`-crf ${PRESET.crf}`), `có "-crf ${PRESET.crf}"`);
ok(cmd.includes(`-b:a ${PRESET.abitrate}`), `có "-b:a ${PRESET.abitrate}"`);

console.log("== [3] render thật: MP4 1080x1350 @30fps, 3s ==");
const specPath = path.join(outDir, "spec-ig-portrait.json");
const outFile = path.join(outDir, "preset-ig-portrait.mp4");
writeFileEpermRetry(specPath, JSON.stringify(makeSpec()));
const t0 = Date.now();
const r = spawnSync("node", [RENDER_JS, "--spec", specPath, "--out", outFile,
  "-y", "-q", "--crf", String(PRESET.crf), "--x264-preset", PRESET.x264,
  "--audio-bitrate", PRESET.abitrate],
  { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const renderMs = Date.now() - t0;
if (r.status !== 0) {
  ok(false, `render exit 0 (stderr: ${(r.stderr || "").slice(-400)})`);
} else {
  console.log(`  (render mất ${(renderMs / 1000).toFixed(1)}s cho ${DURATION}s video → ${(DURATION / (renderMs / 1000)).toFixed(2)}x realtime)`);
  const stat = fs.statSync(outFile);
  ok(stat.size > 10000, `file MP4 ${stat.size} byte (>10KB)`);
  const p = ffprobe(outFile);
  const vs = p.streams.find((s) => s.codec_name === "h264");
  ok(!!vs, "có stream video h264");
  if (vs) {
    ok(vs.width === PRESET.width && vs.height === PRESET.height,
      `ffprobe ${vs.width}x${vs.height} = ${PRESET.width}x${PRESET.height}`);
    ok(vs.r_frame_rate === "30/1" && vs.avg_frame_rate === "30/1",
      `fps r=${vs.r_frame_rate} avg=${vs.avg_frame_rate} = 30/1`);
    const frames = parseInt(vs.nb_read_frames, 10);
    ok(frames === EXPECTED_FRAMES,
      `đủ frame: nb_read_frames=${frames} (kỳ vọng ${EXPECTED_FRAMES} = 30fps × 3s)`);
  }
  const dur = parseFloat(p.format.duration);
  ok(Math.abs(dur - DURATION) < 0.15,
    `duration ${dur.toFixed(3)}s ≈ ${DURATION}s (lệch ${Math.abs(dur - DURATION).toFixed(3)}s)`);
}

console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
process.exit(fail === 0 ? 0 : 1);
