/**
 * Test cho apps/web/src/lib/multiselect.ts (chạy bằng Node, không cần browser).
 * Được biên dịch & chạy bởi scripts/test-multiselect.sh.
 */
"use strict";

const {
  dedupeSelections,
  toggleSelection,
  primarySelection,
  deleteClips,
  restoreClips,
  moveClipsBy,
} = require("./out/apps/web/src/lib/multiselect.js");

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

function vclip(id, start, duration) {
  return { kind: "video", id, src: "a.mp4", start, duration, in: 0, out: duration, opacity: 1 };
}
function tclip(id, start, duration) {
  return { kind: "text", id, text: "hi", start, duration, style: {} };
}
function makeSpec() {
  return {
    version: "0.2.0",
    meta: { name: "test", width: 1280, height: 720, fps: 30 },
    tracks: [
      { id: "t1", kind: "video", label: "V1", clips: [vclip("c1", 0, 2), vclip("c2", 3, 2), vclip("c3", 6, 2)] },
      { id: "t2", kind: "text", label: "T1", clips: [tclip("c4", 1, 2)] },
    ],
  };
}
const sel = (trackId, clipId) => ({ trackId, clipId });
const starts = (spec) => spec.tracks.flatMap((t) => t.clips.map((c) => `${t.id}:${c.id}@${c.start}`)).sort();

console.log("== dedupeSelections ==");
{
  const d = dedupeSelections([sel("t1", "c1"), sel("t1", "c2"), sel("t1", "c1"), sel("t2", "c4")]);
  ok(d.length === 3, "loại trùng, giữ 3 mục duy nhất");
  ok(d[0].clipId === "c1" && d[1].clipId === "c2" && d[2].clipId === "c4", "giữ thứ tự xuất hiện");
}

console.log("== toggleSelection ==");
{
  let s = [];
  s = toggleSelection(s, sel("t1", "c1"));
  ok(s.length === 1, "toggle thêm khi chưa có");
  s = toggleSelection(s, sel("t1", "c1"));
  ok(s.length === 0, "toggle bớt khi đã có");
  s = toggleSelection([sel("t1", "c1"), sel("t1", "c2")], sel("t1", "c1"));
  ok(s.length === 1 && s[0].clipId === "c2", "chỉ gỡ đúng mục");
}

console.log("== primarySelection ==");
{
  ok(primarySelection([]) === null, "rỗng -> null");
  ok(primarySelection([sel("t1", "c2"), sel("t1", "c1")]).clipId === "c2", "lấy mục đầu tiên");
}

console.log("== deleteClips: chọn 3 clip -> xoá -> undo -> về đúng vị trí ==");
{
  const spec = makeSpec();
  const sels = [sel("t1", "c1"), sel("t1", "c2"), sel("t1", "c3")];
  const { spec: after, deleted } = deleteClips(spec, sels);
  ok(after.tracks[0].clips.length === 0, "3 clip trên t1 bị xoá hết");
  ok(after.tracks[1].clips.length === 1, "clip trên t2 không bị ảnh hưởng");
  ok(deleted.length === 1 && deleted[0].clips.length === 3, "buffer ghi 1 nhóm 3 clip");
  ok(spec.tracks[0].clips.length === 3, "không mutate spec gốc");
  const restored = restoreClips(after, deleted);
  ok(JSON.stringify(starts(restored)) === JSON.stringify(starts(spec)), "undo: 3 clip về đúng vị trí");
  const rc = restored.tracks[0].clips;
  ok(rc[0].in === 0 && rc[0].out === 2 && rc[0].id === "c1", "undo giữ nguyên in/out/id");
}

console.log("== deleteClips: xoá một phần ==");
{
  const spec = makeSpec();
  const { spec: after } = deleteClips(spec, [sel("t1", "c2"), sel("t2", "c4")]);
  ok(after.tracks[0].clips.map((c) => c.id).join(",") === "c1,c3", "chỉ xoá clip được chọn trên t1");
  ok(after.tracks[1].clips.length === 0, "xoá clip trên t2");
}

console.log("== moveClipsBy: giữ offset tương đối ==");
{
  const spec = makeSpec();
  const items = [
    { trackId: "t1", clipId: "c1", origStart: 0 },
    { trackId: "t1", clipId: "c2", origStart: 3 },
    { trackId: "t2", clipId: "c4", origStart: 1 },
  ];
  const moved = moveClipsBy(spec, items, 1);
  const m1 = moved.tracks[0].clips.find((c) => c.id === "c1");
  const m2 = moved.tracks[0].clips.find((c) => c.id === "c2");
  const m4 = moved.tracks[1].clips.find((c) => c.id === "c4");
  ok(m1.start === 1 && m2.start === 4 && m4.start === 2, "cả 3 clip dịch +1s");
  ok(m2.start - m1.start === 3, "offset tương đối giữa c1/c2 được giữ");
}

console.log("== moveClipsBy: clip bị chặn đứng yên, clip khác vẫn đi ==");
{
  const spec = makeSpec();
  // thêm clip c5 (không chọn) chắn đường c2 khi dịch +2.5 (c2: 3->5.5 sẽ đè c5 ở 5..7)
  spec.tracks[0].clips.push(vclip("c5", 5, 2));
  const items = [
    { trackId: "t1", clipId: "c1", origStart: 0 },
    { trackId: "t1", clipId: "c2", origStart: 3 },
  ];
  const moved = moveClipsBy(spec, items, 2.5);
  const m1 = moved.tracks[0].clips.find((c) => c.id === "c1");
  const m2 = moved.tracks[0].clips.find((c) => c.id === "c2");
  ok(m1.start === 2.5, "c1 không bị chặn -> dịch bình thường");
  ok(m2.start === 3, "c2 bị c5 chặn -> đứng yên");
}

console.log("== moveClipsBy: biên và snap ==");
{
  const spec = makeSpec();
  const items = [{ trackId: "t1", clipId: "c1", origStart: 0 }];
  const neg = moveClipsBy(spec, items, -5);
  ok(neg.tracks[0].clips.find((c) => c.id === "c1").start === 0, "không đi âm (clamp 0)");
  const same = moveClipsBy(spec, items, 0);
  ok(same === spec, "dx=0 -> trả về spec gốc (không tạo object mới)");
  const snapped = moveClipsBy(spec, items, 0.56, (t) => Math.round(t * 10) / 10);
  ok(snapped.tracks[0].clips.find((c) => c.id === "c1").start === 0.6, "snap được áp dụng");
  const empty = moveClipsBy(spec, [], 5);
  ok(empty === spec, "items rỗng -> trả về spec gốc");
}

console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
process.exit(fail === 0 ? 0 : 1);
