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
ok(Array.isArray(ep.EXPORT_PRESETS) && ep.EXPORT_PRESETS.length === 4, "có 4 preset (720p/1080p/4k/custom)");
const ids = ep.EXPORT_PRESETS.map((p) => p.id);
ok(ids.includes("720p") && ids.includes("1080p") && ids.includes("4k") && ids.includes("custom"), "đủ 4 id");

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
