/**
 * Test cho apps/web/src/lib/exportPresets.ts (chạy bằng Node, không cần browser).
 * Được biên dịch & chạy bởi scripts/test-export-presets.sh.
 */
"use strict";

const ep = require("./apps/web/src/lib/exportPresets.js");

let pass = 0;
let fail = 0;
function ok(cond, label) {
  if (cond) {
    pass += 1;
    console.log(`  ✓ ${label}`);
  } else {
    fail += 1;
    console.error(`  ✗ FAIL: ${label}`);
  }
}

console.log("== EXPORT_PRESETS ==");
ok(Array.isArray(ep.EXPORT_PRESETS) && ep.EXPORT_PRESETS.length === 7, "có 7 preset (720p/1080p/4k/tiktok/youtube/ig-square/custom)");
const ids = ep.EXPORT_PRESETS.map((p) => p.id);
ok(ids.includes("720p") && ids.includes("1080p") && ids.includes("4k") && ids.includes("custom"), "đủ 4 id cũ");

const p720 = ep.getPreset("720p");
ok(p720.width === 1280 && p720.height === 720 && p720.fps === 30, "720p = 1280x720 @30fps");
ok(p720.crf === 23 && p720.x264Preset === "veryfast", "720p dùng crf 23 + veryfast (nhanh)");

const p1080 = ep.getPreset("1080p");
ok(p1080.width === 1920 && p1080.height === 1080, "1080p = 1920x1080");
ok(p1080.crf === 20 && p1080.x264Preset === "medium", "1080p cân bằng crf 20 + medium");

const p4k = ep.getPreset("4k");
ok(p4k.width === 3840 && p4k.height === 2160, "4k = 3840x2160");
ok(p4k.crf === 18 && p4k.x264Preset === "slow", "4k chất lượng cao crf 18 + slow");

ok(ep.getPreset("khong-co") === undefined, "getPreset id lạ → undefined");

console.log("== validateExportPreset ==");
for (const p of ep.EXPORT_PRESETS) {
  ok(ep.validateExportPreset(p).length === 0, `preset "${p.id}" hợp lệ`);
}
ok(ep.validateExportPreset(null).length > 0, "null bị từ chối");
ok(ep.validateExportPreset("720p").length > 0, "string bị từ chối");
ok(ep.validateExportPreset({ ...p1080, width: 0 }).length > 0, "width=0 bị từ chối");
ok(ep.validateExportPreset({ ...p1080, width: 99999 }).length > 0, "width quá lớn bị từ chối");
ok(ep.validateExportPreset({ ...p1080, height: 1079.5 }).length > 0, "height không nguyên bị từ chối");
ok(ep.validateExportPreset({ ...p1080, fps: 0 }).length > 0, "fps=0 bị từ chối");
ok(ep.validateExportPreset({ ...p1080, fps: 240 }).length > 0, "fps=240 bị từ chối");
ok(ep.validateExportPreset({ ...p1080, crf: -1 }).length > 0, "crf=-1 bị từ chối");
ok(ep.validateExportPreset({ ...p1080, crf: 52 }).length > 0, "crf=52 bị từ chối");
ok(ep.validateExportPreset({ ...p1080, crf: 20.5 }).length > 0, "crf không nguyên bị từ chối");
ok(ep.validateExportPreset({ ...p1080, x264Preset: "evil; rm -rf" }).length > 0, "x264Preset lạ (injection) bị từ chối");
ok(ep.validateExportPreset({ ...p1080, x264Preset: "Medium" }).length > 0, "x264Preset sai case bị từ chối");
ok(ep.validateExportPreset({ ...p1080, audioBitrateKbps: 16 }).length > 0, "audio bitrate quá thấp bị từ chối");
ok(ep.validateExportPreset({ ...p1080, audioBitrateKbps: 1024 }).length > 0, "audio bitrate quá cao bị từ chối");

console.log("== preset mạng xã hội (R1-064) ==");
const tiktok = ep.getPreset("tiktok");
ok(tiktok && tiktok.width === 1080 && tiktok.height === 1920 && tiktok.fps === 30, "tiktok = 1080x1920 @30fps (9:16)");
const youtube = ep.getPreset("youtube");
ok(youtube && youtube.width === 1920 && youtube.height === 1080, "youtube = 1920x1080");
ok(youtube.crf === 18 && youtube.audioBitrateKbps === 192, "youtube crf 18 + audio 192k (bitrate cao)");
const igsq = ep.getPreset("ig-square");
ok(igsq && igsq.width === 1080 && igsq.height === 1080, "ig-square = 1080x1080 (1:1)");
for (const id of ["tiktok", "youtube", "ig-square"]) {
  const p = ep.getPreset(id);
  ok(ep.validateExportPreset(p).length === 0, `preset "${id}" hợp lệ`);
}
ok(ep.estimateVideoBitrateKbps(ep.getPreset("youtube")) > ep.estimateVideoBitrateKbps(ep.getPreset("1080p")),
  "crf thấp hơn (youtube 18 < 1080p 20) → ước tính bitrate video cao hơn");

console.log("== estimateSize (R1-064) ==");
// Công thức: bpppf = 0.1 * 2^((23-20)/6) ≈ 0.1414; 1920*1080*30*0.1414/1000 ≈ 8796 kbps
const est60 = ep.estimateSize(ep.getPreset("1080p"), 60);
ok(Math.abs(est60 / (1024 * 1024) - 67.2) < 5, `1080p 60s → ≈ 67 MB (thực: ${(est60 / (1024 * 1024)).toFixed(1)} MB)`);
ok(ep.estimateSize(ep.getPreset("4k"), 60) > ep.estimateSize(ep.getPreset("720p"), 60),
  "4k 60s ước tính lớn hơn 720p 60s");
ok(Math.abs(ep.estimateSize(ep.getPreset("1080p"), 120) - 2 * ep.estimateSize(ep.getPreset("1080p"), 60)) < 10,
  "dung lượng tuyến tính theo thời lượng (sai số làm tròn < 10 bytes)");
ok(ep.estimateSize(ep.getPreset("1080p"), 0) === 0, "duration 0 → 0 bytes");
ok(ep.estimateSize(ep.getPreset("1080p"), -5) === 0, "duration âm → 0 bytes");

console.log("== formatBytes / sizeEstimateLabel ==");
ok(ep.formatBytes(0) === "0 B", 'formatBytes(0) = "0 B"');
ok(ep.formatBytes(845 * 1024) === "845 KB", 'formatBytes → KB');
ok(ep.formatBytes(est60).endsWith("MB"), "est60 format → MB");
ok(ep.formatBytes(3 * 1024 * 1024 * 1024) === "3.00 GB", "format → GB");
ok(ep.sizeEstimateLabel(ep.getPreset("1080p"), 60).startsWith("≈ "), "label bắt đầu bằng ≈");
ok(ep.sizeEstimateLabel(ep.getPreset("1080p"), 60).includes("ước tính"), "label ghi rõ là ước tính");

console.log("== helpers ==");
ok(ep.audioBitrateArg(160) === "160k", 'audioBitrateArg(160) = "160k"');
ok(ep.isX264Preset("slow") === true, 'isX264Preset("slow") = true');
ok(ep.isX264Preset("slow;evil") === false, "isX264Preset chặn injection");
const custom = ep.defaultCustomPreset();
ok(custom.id === "custom" && custom.width === 1920, "defaultCustomPreset lấy từ 1080p");
ok(ep.presetSummary(p1080).includes("1920×1080"), "presetSummary có resolution");
ok(ep.presetSummary(p1080).includes("CRF 20"), "presetSummary có CRF");

console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
process.exit(fail === 0 ? 0 : 1);
