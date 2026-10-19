/**
 * Test cho apps/web/src/lib/commands.ts (R1-050, R1-051).
 * Chạy bằng Node, không cần browser. Được biên dịch & chạy bởi scripts/test-commands.sh.
 */
"use strict";

const { CommandStack, MAX_HISTORY } = require("./out/apps/web/src/lib/commands.js");

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

// Spec giả tối giản — CommandStack không phụ thuộc cấu trúc thật.
const spec0 = { v: 0, tracks: [] };
const addTrack = (id) => ({
  label: `Thêm track ${id}`,
  apply: (s) => ({ ...s, tracks: [...s.tracks, { id, clips: [] }] }),
});
const addClip = (trackId, clipId, start) => ({
  label: "Thêm clip",
  apply: (s) => ({
    ...s,
    tracks: s.tracks.map((t) =>
      t.id === trackId ? { ...t, clips: [...t.clips, { id: clipId, start }] } : t,
    ),
  }),
});
const moveClip = (clipId, start) => ({
  label: "Di chuyển clip",
  apply: (s) => ({
    ...s,
    tracks: s.tracks.map((t) => ({
      ...t,
      clips: t.clips.map((c) => (c.id === clipId ? { ...c, start } : c)),
    })),
  }),
});

function drive(stack, cmd, before, selBefore = [], selAfter = []) {
  const after = stack.execute(cmd, before, selBefore, selAfter);
  if (after === null) throw new Error("execute trả về null ngoài dự kiến");
  return after;
}

console.log("== CommandStack: execute/undo/redo cơ bản ==");
{
  const st = new CommandStack();
  let s = spec0;
  s = drive(st, addTrack("t1"), s);
  ok(st.undoDepth === 1, "execute 1 → undoDepth=1");
  ok(st.redoDepth === 0, "redoDepth=0 sau execute");
  ok(st.undoLabel === "Thêm track t1", "undoLabel đúng");
  ok(s.tracks.length === 1 && s.tracks[0].id === "t1", "spec sau execute đúng");

  const e = st.undo();
  ok(e !== null && e.label === "Thêm track t1", "undo trả về entry");
  ok(st.undoDepth === 0 && st.redoDepth === 1, "depth sau undo");
  ok(st.redoLabel === "Thêm track t1", "redoLabel đúng");
  s = e.before;
  ok(s.tracks.length === 0, "spec khôi phục về before");

  const e2 = st.redo();
  ok(e2 !== null, "redo trả về entry");
  s = e2.after;
  ok(s.tracks.length === 1, "spec tiến lại after sau redo");
  ok(st.undoDepth === 1 && st.redoDepth === 0, "depth sau redo");
}

console.log("== Kịch bản yêu cầu: 3 thao tác → undo 3 → redo 3 ==");
{
  const st = new CommandStack();
  const sel0 = [];
  let s = spec0;
  const snapshots = [JSON.stringify(s)];
  s = drive(st, addTrack("t1"), s, sel0, [{ trackId: "t1", clipId: "" }]);
  snapshots.push(JSON.stringify(s));
  s = drive(st, addClip("t1", "c1", 0), s);
  snapshots.push(JSON.stringify(s));
  s = drive(st, moveClip("c1", 5), s);
  snapshots.push(JSON.stringify(s));
  ok(st.undoDepth === 3, "3 thao tác → undoDepth=3");

  const undone = [];
  for (let i = 0; i < 3; i++) {
    const e = st.undo();
    undone.push(JSON.stringify(e.before));
  }
  ok(st.undo() === null, "undo quá số bước → null");
  ok(
    undone[0] === snapshots[2] && undone[1] === snapshots[1] && undone[2] === snapshots[0],
    "undo 3 lần → state lùi đúng từng bước",
  );

  const redone = [];
  for (let i = 0; i < 3; i++) {
    const e = st.redo();
    redone.push(JSON.stringify(e.after));
  }
  ok(st.redo() === null, "redo quá số bước → null");
  ok(
    redone[0] === snapshots[1] && redone[1] === snapshots[2] && redone[2] === snapshots[3],
    "redo 3 lần → state tiến đúng từng bước",
  );
  // selection khôi phục
  const st2 = new CommandStack();
  let s2 = spec0;
  s2 = drive(st2, addTrack("t1"), s2, [], [{ trackId: "t1", clipId: "x" }]);
  const eu = st2.undo();
  ok(
    JSON.stringify(eu.selBefore) === "[]" &&
      JSON.stringify(eu.selAfter) === JSON.stringify([{ trackId: "t1", clipId: "x" }]),
    "selection before/after được lưu trong entry",
  );
}

console.log("== Execute mới sau undo → xoá redo ==");
{
  const st = new CommandStack();
  let s = drive(st, addTrack("t1"), spec0);
  st.undo();
  ok(st.redoDepth === 1, "redoDepth=1 sau undo");
  s = drive(st, addTrack("t2"), spec0);
  ok(st.redoDepth === 0, "execute mới xoá redo stack");
  ok(s.tracks[0].id === "t2", "spec là của command mới");
}

console.log("== Gộp theo mergeKey trong cửa sổ thời gian ==");
{
  const st = new CommandStack(60_000); // cửa sổ dài để test chắc chắn gộp
  const patch = (v) => ({
    label: "Chỉnh opacity",
    mergeKey: "patch:t1:c1",
    apply: (s) => ({ ...s, v }),
  });
  let s = spec0;
  s = drive(st, patch(0.5), s);
  s = drive(st, patch(0.7), s);
  s = drive(st, patch(0.9), s);
  ok(st.undoDepth === 1, "3 execute cùng mergeKey → 1 entry");
  ok(s.v === 0.9, "after là giá trị mới nhất");
  const e = st.undo();
  ok(e.before.v === 0, "undo về giá trị gốc (before giữ nguyên)");
  ok(e.after.v === 0.9, "entry.after là giá trị cuối");

  const st2 = new CommandStack(60_000);
  let s2 = spec0;
  s2 = drive(st2, { ...patch(0.5), mergeKey: "a" }, s2);
  s2 = drive(st2, { ...patch(0.7), mergeKey: "b" }, s2);
  ok(st2.undoDepth === 2, "mergeKey khác nhau → không gộp");
}

console.log("== Hết cửa sổ gộp → entry riêng ==");
{
  const st = new CommandStack(1); // cửa sổ 1ms
  const patch = (v) => ({ label: "x", mergeKey: "k", apply: (s) => ({ ...s, v }) });
  let s = drive(st, patch(1), spec0);
  const start = Date.now();
  while (Date.now() - start < 5); // chờ qua cửa sổ
  s = drive(st, patch(2), s);
  ok(st.undoDepth === 2, "qua cửa sổ gộp → 2 entry");
}

console.log("== Group: begin/end → 1 entry ==");
{
  const st = new CommandStack();
  let s = spec0;
  st.beginGroup("Kéo thả", s, []);
  s = drive(st, addTrack("t1"), s);
  s = drive(st, addClip("t1", "c1", 0), s);
  s = drive(st, moveClip("c1", 5), s);
  ok(st.undoDepth === 0, "trong group chưa push entry nào");
  const g = st.endGroup(s, [{ trackId: "t1", clipId: "c1" }]);
  ok(g !== null && g.label === "Kéo thả", "endGroup push 1 entry đúng label");
  ok(st.undoDepth === 1, "cả group = 1 bước undo");
  const e = st.undo();
  ok(e.before === spec0, "undo group → về spec trước group (đúng ref)");
  ok(JSON.stringify(e.selAfter) === JSON.stringify([{ trackId: "t1", clipId: "c1" }]), "selAfter của group đúng");
}

console.log("== endGroup không thay đổi → không push ==");
{
  const st = new CommandStack();
  st.beginGroup("Click không kéo", spec0, []);
  const g = st.endGroup(spec0, []);
  ok(g === null && st.undoDepth === 0, "không có thay đổi → không entry");
}

console.log("== Group lồng nhau: giữ group ngoài ==");
{
  const st = new CommandStack();
  st.beginGroup("ngoài", spec0, []);
  st.beginGroup("trong (bị bỏ qua)", spec0, []);
  const s = drive(st, addTrack("t1"), spec0);
  const g = st.endGroup(s, []);
  ok(g !== null && g.label === "ngoài", "giữ label group ngoài cùng");
}

console.log("== Không undo/redo giữa group ==");
{
  const st = new CommandStack();
  st.beginGroup("đang kéo", spec0, []);
  ok(st.undo() === null && st.redo() === null, "undo/redo trong group → null");
  st.endGroup(spec0, []);
}

console.log("== Giới hạn 100 bước ==");
{
  const st = new CommandStack();
  let s = spec0;
  for (let i = 0; i < 105; i++) {
    s = drive(st, { label: `cmd${i}`, apply: (x) => ({ ...x, v: i }) }, s);
  }
  ok(st.undoDepth === MAX_HISTORY, `undoDepth bị chặn ở ${MAX_HISTORY}`);
  ok(st.undoLabel === "cmd104", "entry mới nhất còn lại");
}

console.log("== clear() ==");
{
  const st = new CommandStack();
  drive(st, addTrack("t1"), spec0);
  st.undo();
  st.clear();
  ok(st.undoDepth === 0 && st.redoDepth === 0, "clear xoá cả 2 stack");
  ok(st.undo() === null, "undo sau clear → null");
}

console.log("== apply() không đổi → không entry ==");
{
  const st = new CommandStack();
  const noop = { label: "noop", apply: (s) => s };
  const r = st.execute(noop, spec0, [], []);
  ok(r === null && st.undoDepth === 0, "apply trả đúng ref cũ → bỏ qua");
}

console.log(`\nKẾT QUẢ: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
