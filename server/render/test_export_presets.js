#!/usr/bin/env node
/**
 * test_export_presets.js — Kiểm chứng R1-042 end-to-end (không cần browser).
 *
 * 1. --dry-run: mỗi preset map đúng vào ffmpeg args (-preset, -crf, -b:a)
 * 2. Render thật với preset 720p/1080p → ffprobe verify resolution đúng
 * 3. Args sai → exit 2
 *
 * Cách dùng: node test_export_presets.js [--out-dir /tmp/preset-demo]
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync, execFileSync } = require("child_process");

const args = process.argv.slice(2);
const outDir = path.resolve(args[args.indexOf("--out-dir") + 1] || "/tmp/preset-demo");
fs.mkdirSync(outDir, { recursive: true });

const RENDER_JS = path.join(__dirname, "src", "render.js");

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.error(`  ✗ FAIL: ${label}`); }
}

/** Spec tối thiểu: 1 text track 2s, không cần media. */
function makeSpec(width, height, fps) {
  return {
    version: "0.2.0",
    meta: { name: "preset-test", width, height, fps },
    tracks: [{
      id: "t1", kind: "text", clips: [{
        kind: "text", id: "c1", text: "Preset test",
        start: 0, duration: 2,
        style: { fontFamily: "DejaVu Sans", fontSize: 48, color: "#ffffff", x: 0.5, y: 0.5, animation: "none" },
      }],
    }],
  };
}

function ffprobe(file) {
  const raw = execFileSync("ffprobe",
    ["-v", "error", "-show_entries", "stream=codec_name,width,height",
     "-show_entries", "format=duration", "-of", "json", file],
    { encoding: "utf8" });
  return JSON.parse(raw);
}

console.log("== [1] dry-run: preset map đúng ffmpeg args ==");
const dryCases = [
  { label: "720p (crf 23, veryfast, 128k)", crf: 23, x264: "veryfast", abitrate: "128k" },
  { label: "1080p (crf 20, medium, 160k)", crf: 20, x264: "medium", abitrate: "160k" },
  { label: "4k (crf 18, slow, 192k)", crf: 18, x264: "slow", abitrate: "192k" },
];
for (const c of dryCases) {
  const specPath = path.join(outDir, "dry-spec.json");
  fs.writeFileSync(specPath, JSON.stringify(makeSpec(1280, 720, 30)));
  const r = spawnSync("node", [RENDER_JS, "--spec", specPath,
    "--out", path.join(outDir, "dry.mp4"),
    "--crf", String(c.crf), "--x264-preset", c.x264, "--audio-bitrate", c.abitrate,
    "--dry-run"], { encoding: "utf8" });
  const cmd = r.stdout || "";
  ok(r.status === 0, `${c.label}: dry-run exit 0`);
  ok(cmd.includes(`-preset ${c.x264}`), `${c.label}: có "-preset ${c.x264}"`);
  ok(cmd.includes(`-crf ${c.crf}`), `${c.label}: có "-crf ${c.crf}"`);
  ok(cmd.includes(`-b:a ${c.abitrate}`), `${c.label}: có "-b:a ${c.abitrate}"`);
}

console.log("== [2] args sai → exit 2 ==");
const badCases = [
  ["--crf", "99"], ["--crf", "-1"], ["--crf", "abc"],
  ["--x264-preset", "evil; rm -rf /"], ["--x264-preset", "Medium"],
  ["--audio-bitrate", "9999k"], ["--audio-bitrate", "16k"], ["--audio-bitrate", "128"],
];
for (const [flag, val] of badCases) {
  const r = spawnSync("node", [RENDER_JS, "--spec", "/dev/null", "--out", "/dev/null", flag, val],
    { encoding: "utf8" });
  ok(r.status === 2, `"${flag} ${val}" → exit 2`);
}

console.log("== [3] render thật: resolution theo preset ==");
const renderCases = [
  { label: "720p", w: 1280, h: 720 },
  { label: "1080p", w: 1920, h: 1080 },
];
for (const c of renderCases) {
  const specPath = path.join(outDir, `spec-${c.label}.json`);
  const outFile = path.join(outDir, `preset-${c.label}.mp4`);
  fs.writeFileSync(specPath, JSON.stringify(makeSpec(c.w, c.h, 30)));
  const r = spawnSync("node", [RENDER_JS, "--spec", specPath, "--out", outFile,
    "-y", "-q", "--crf", "28", "--x264-preset", "veryfast", "--audio-bitrate", "96k"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  if (r.status !== 0) {
    ok(false, `${c.label}: render exit 0 (stderr: ${(r.stderr || "").slice(-300)})`);
    continue;
  }
  const p = ffprobe(outFile);
  const vs = p.streams.find((s) => s.codec_name === "h264");
  ok(vs && vs.width === c.w && vs.height === c.h,
    `${c.label}: ffprobe ${vs ? `${vs.width}x${vs.height}` : "no-video"} = ${c.w}x${c.h}`);
}

console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
process.exit(fail === 0 ? 0 : 1);
