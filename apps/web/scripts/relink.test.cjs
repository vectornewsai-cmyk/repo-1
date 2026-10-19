/**
 * Test cho apps/web/src/lib/relink.ts (chạy bằng Node, không cần browser).
 * Được biên dịch & chạy bởi scripts/test-relink.sh.
 */
"use strict";

const { findMissingAssets, relinkAsset } = require("./out/apps/web/src/lib/relink.js");

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

function makeSpec(clipsByTrack) {
  // clipsByTrack: [{ id, kind, label, clips: [{id, kind, src?}] }]
  return {
    version: "0.2.0",
    meta: { name: "test", width: 1280, height: 720, fps: 30 },
    tracks: clipsByTrack.map((t) => ({
      id: t.id,
      kind: t.kind,
      label: t.label,
      clips: t.clips.map((c, i) => ({
        id: c.id,
        kind: c.kind,
        start: i * 2,
        duration: 2,
        in: 0,
        out: 2,
        ...(c.src ? { src: c.src } : {}),
        ...(c.text ? { text: c.text } : {}),
      })),
    })),
  };
}

console.log("== findMissingAssets ==");

{
  const spec = makeSpec([
    {
      id: "t1", kind: "video", label: "Video 1",
      clips: [
        { id: "c1", kind: "video", src: "a.mp4" },
        { id: "c2", kind: "video", src: "b.mp4" },
      ],
    },
    {
      id: "t2", kind: "audio", label: "Âm thanh 1",
      clips: [{ id: "c3", kind: "audio", src: "nhac.mp3" }],
    },
    {
      id: "t3", kind: "text", label: "Chữ 1",
      clips: [{ id: "c4", kind: "text", text: "hello" }],
    },
  ]);
  const missing = findMissingAssets(spec, new Set(["a.mp4"]));
  ok(missing.length === 2, "tìm đúng 2 asset thiếu (b.mp4, nhac.mp3)");
  ok(missing[0].src === "b.mp4", "sắp xếp theo src");
  ok(missing[0].kind === "video", "kind video đúng");
  ok(missing[0].clipCount === 1, "clipCount đúng");
  ok(missing[0].trackLabels[0] === "Video 1", "trackLabels đúng");
  ok(missing[1].src === "nhac.mp3" && missing[1].kind === "audio", "asset audio thiếu");
}

{
  // không thiếu gì
  const spec = makeSpec([
    { id: "t1", kind: "video", label: "V", clips: [{ id: "c1", kind: "video", src: "a.mp4" }] },
  ]);
  ok(findMissingAssets(spec, new Set(["a.mp4"])).length === 0, "không báo thiếu khi đủ media");
}

{
  // cùng 1 file dùng ở 2 clip → gộp 1 dòng, clipCount=2
  const spec = makeSpec([
    {
      id: "t1", kind: "video", label: "V",
      clips: [
        { id: "c1", kind: "video", src: "lap.mp4" },
        { id: "c2", kind: "video", src: "lap.mp4" },
      ],
    },
  ]);
  const missing = findMissingAssets(spec, new Set());
  ok(missing.length === 1 && missing[0].clipCount === 2, "gộp theo src, clipCount=2");
}

{
  // blob: URL coi như thiếu (phiên cũ đã chết)
  const spec = makeSpec([
    { id: "t1", kind: "video", label: "V", clips: [{ id: "c1", kind: "video", src: "blob:abc" }] },
  ]);
  const missing = findMissingAssets(spec, new Set(["blob:abc"]));
  ok(missing.length === 1, "blob: URL vẫn báo thiếu dù tên trùng");
}

{
  // sticker + image cũng được quét
  const spec = makeSpec([
    { id: "t1", kind: "sticker", label: "S", clips: [{ id: "c1", kind: "sticker", src: "sao.png" }] },
    { id: "t2", kind: "image", label: "I", clips: [{ id: "c2", kind: "image", src: "anh.jpg" }] },
  ]);
  const missing = findMissingAssets(spec, new Set(["anh.jpg"]));
  ok(missing.length === 1 && missing[0].kind === "sticker", "sticker thiếu được phát hiện");
}

console.log("== relinkAsset ==");

{
  const spec = makeSpec([
    {
      id: "t1", kind: "video", label: "V",
      clips: [
        { id: "c1", kind: "video", src: "cu.mp4" },
        { id: "c2", kind: "video", src: "cu.mp4" },
        { id: "c3", kind: "video", src: "khac.mp4" },
      ],
    },
  ]);
  const { spec: next, updatedCount } = relinkAsset(spec, "cu.mp4", "moi.mp4");
  ok(updatedCount === 2, "cập nhật đúng 2 clip");
  const srcs = next.tracks[0].clips.map((c) => c.src);
  ok(srcs[0] === "moi.mp4" && srcs[1] === "moi.mp4" && srcs[2] === "khac.mp4",
    "src mới đúng, clip khác không đổi");
  // không mutate input
  ok(spec.tracks[0].clips[0].src === "cu.mp4", "không mutate spec gốc");
  // relink xong thì không còn thiếu
  const missing = findMissingAssets(next, new Set(["moi.mp4", "khac.mp4"]));
  ok(missing.length === 0, "sau relink không còn báo thiếu");
}

{
  // relink src không tồn tại → 0 clip
  const spec = makeSpec([
    { id: "t1", kind: "video", label: "V", clips: [{ id: "c1", kind: "video", src: "a.mp4" }] },
  ]);
  const { updatedCount } = relinkAsset(spec, "khong-co.mp4", "x.mp4");
  ok(updatedCount === 0, "src không tồn tại → updatedCount=0");
}

{
  // oldSrc === newSrc → no-op
  const spec = makeSpec([
    { id: "t1", kind: "video", label: "V", clips: [{ id: "c1", kind: "video", src: "a.mp4" }] },
  ]);
  const { spec: next, updatedCount } = relinkAsset(spec, "a.mp4", "a.mp4");
  ok(updatedCount === 0 && next === spec, "trùng src → trả về spec gốc");
}

console.log(`\nKẾT QUẢ: ${pass} pass, ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
