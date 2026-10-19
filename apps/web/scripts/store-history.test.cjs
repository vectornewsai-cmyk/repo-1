/**
 * Integration test: undo/redo qua store thật (R1-051).
 * Dùng store.ts đã biên dịch — thao tác thật (addTrack/addMediaToTrack/moveClip/
 * deleteSelection/splitAtPlayhead...), undo/redo, verify state.
 * Chạy bằng Node, không cần browser. Được chạy bởi scripts/test-commands.sh.
 */
"use strict";

const { useStore } = require("./out/apps/web/src/store.js");

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
const st = () => useStore.getState();
const specJson = () => JSON.stringify(st().spec);

function reset() {
  // newProject: spec trống + xoá history
  st().newProject();
  useStore.setState({
    media: [
      { id: "m1", name: "a.mp4", kind: "video", url: "blob:x", duration: 10, width: 1280, height: 720 },
      { id: "m2", name: "b.mp3", kind: "audio", url: "blob:y", duration: 8 },
    ],
  });
}

console.log("== Store: 3 thao tác → undo 3 → redo 3 ==");
reset();
{
  const trackId = st().addTrack("video");
  ok(st().undoDepth === 1 && st().undoLabel === "Thêm track Video", "addTrack → 1 entry undo");
  st().addMediaToTrack("m1", trackId, 0);
  const clipId = st().spec.tracks[0].clips[0].id;
  ok(st().undoDepth === 2, "addMediaToTrack → entry thứ 2");
  ok(
    JSON.stringify(st().selection) === JSON.stringify([{ trackId, clipId }]),
    "selection trỏ tới clip mới",
  );
  st().moveClip(trackId, clipId, 5);
  ok(st().spec.tracks[0].clips[0].start === 5, "moveClip đổi start=5");
  ok(st().undoDepth === 3, "3 thao tác → undoDepth=3");
  const snapAfter3 = specJson();

  st().undo();
  ok(st().spec.tracks[0].clips[0].start === 0, "undo 1: start về 0");
  ok(st().undoDepth === 2 && st().redoDepth === 1, "depth sau undo 1");
  st().undo();
  ok(st().spec.tracks[0].clips.length === 0, "undo 2: clip biến mất");
  st().undo();
  ok(st().spec.tracks.length === 0, "undo 3: track biến mất");
  ok(st().undoDepth === 0 && st().redoDepth === 3, "hết undo, redoDepth=3");
  st().undo();
  ok(st().spec.tracks.length === 0, "undo quá → không đổi");

  st().redo();
  st().redo();
  st().redo();
  ok(specJson() === snapAfter3, "redo 3 → spec đúng snapshot sau 3 thao tác");
  ok(st().undoDepth === 3 && st().redoDepth === 0, "depth sau redo 3");
}

console.log("== Store: undo xoá clip khôi phục clip + selection ==");
reset();
{
  const trackId = st().addTrack("video");
  st().addMediaToTrack("m1", trackId, 0);
  const clipId = st().spec.tracks[0].clips[0].id;
  st().select({ trackId, clipId });
  st().deleteSelection();
  ok(st().spec.tracks[0].clips.length === 0, "deleteSelection xoá clip");
  ok(st().selection.length === 0, "selection xoá sau delete");
  st().undo();
  ok(st().spec.tracks[0].clips.length === 1, "undo → clip quay lại");
  ok(st().spec.tracks[0].clips[0].id === clipId, "đúng clip đã xoá");
  ok(
    JSON.stringify(st().selection) === JSON.stringify([{ trackId, clipId }]),
    "undo khôi phục selection",
  );
  st().redo();
  ok(st().spec.tracks[0].clips.length === 0, "redo → clip lại mất");
}

console.log("== Store: group kéo-thả = 1 entry ==");
reset();
{
  const trackId = st().addTrack("video");
  st().addMediaToTrack("m1", trackId, 0);
  const clipId = st().spec.tracks[0].clips[0].id;
  const depthBefore = st().undoDepth;
  st().beginHistoryGroup("Di chuyển clip");
  st().moveClip(trackId, clipId, 1);
  st().moveClip(trackId, clipId, 2);
  st().moveClip(trackId, clipId, 3);
  ok(st().undoDepth === depthBefore, "trong group không push entry");
  st().endHistoryGroup();
  ok(st().undoDepth === depthBefore + 1, "thả chuột → đúng 1 entry");
  ok(st().undoLabel === "Di chuyển clip", "label group đúng");
  ok(st().spec.tracks[0].clips[0].start === 3, "vị trí cuối đúng");
  st().undo();
  ok(st().spec.tracks[0].clips[0].start === 0, "undo 1 lần về đầu kéo");
}

console.log("== Store: split + undo ==");
reset();
{
  const trackId = st().addTrack("video");
  st().addMediaToTrack("m1", trackId, 0);
  const clipId = st().spec.tracks[0].clips[0].id;
  st().select({ trackId, clipId });
  st().setPlayhead(4);
  const nBefore = st().spec.tracks[0].clips.length;
  ok(st().splitAtPlayhead() === true, "split thành công");
  ok(st().spec.tracks[0].clips.length === nBefore + 1, "split → 2 clip");
  ok(st().undoLabel === "Tách clip", "label split đúng");
  st().undo();
  ok(st().spec.tracks[0].clips.length === nBefore, "undo split → 1 clip như cũ");
}

console.log("== Store: patchClip gộp slider ==");
reset();
{
  const trackId = st().addTrack("video");
  st().addMediaToTrack("m1", trackId, 0);
  const clipId = st().spec.tracks[0].clips[0].id;
  const depthBefore = st().undoDepth;
  st().patchClip(trackId, clipId, { opacity: 0.5 });
  st().patchClip(trackId, clipId, { opacity: 0.6 });
  st().patchClip(trackId, clipId, { opacity: 0.7 });
  ok(st().undoDepth === depthBefore + 1, "3 lần kéo slider → 1 entry (gộp)");
  ok(st().spec.tracks[0].clips[0].opacity === 0.7, "giá trị cuối đúng");
  st().undo();
  ok(st().spec.tracks[0].clips[0].opacity === 1, "undo → opacity gốc");
}

console.log("== Store: newProject xoá history ==");
reset();
{
  st().addTrack("video");
  ok(st().undoDepth === 1, "có history");
  st().newProject();
  ok(st().undoDepth === 0 && st().redoDepth === 0, "newProject xoá history");
}

console.log(`\nKẾT QUẢ: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
