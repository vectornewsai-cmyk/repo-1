/**
 * silence.test.cjs — test apps/web/src/lib/silence.ts (R1-084).
 * Chạy bằng node sau khi tsc biên dịch (xem test-silence.sh).
 */
"use strict";
const assert = require("node:assert/strict");
const {
  normalizeSilences,
  keepSegments,
  removeSilenceFromClip,
  sourceSilenceToLocal,
} = require("./out/apps/web/src/lib/silence.js");

let n = 0;
function check(name, cond) {
  n++;
  assert.ok(cond, `FAIL: ${name}`);
  console.log(`  ✓ ${name}`);
}

function mkClip(over = {}) {
  return {
    kind: "audio", id: "a1", src: "test.wav",
    start: 0, duration: 10, in: 0, out: 10, speed: 1,
    ...over,
  };
}
function mkSpec(trackOver = {}, clips = [mkClip()]) {
  return {
    version: "0.2.0",
    meta: { name: "t", width: 1280, height: 720, fps: 30 },
    tracks: [{ id: "t1", kind: "audio", label: "A", clips, ...trackOver }],
  };
}

console.log("== [1] normalizeSilences ==");
{
  const r = normalizeSilences(
    [{ start: 2, end: 4 }, { start: 6, end: 8 }], 10);
  check("giữ nguyên 2 khoảng hợp lệ", r.length === 2);
  const r2 = normalizeSilences(
    [{ start: -5, end: 1 }, { start: 9, end: 99 }, { start: 3, end: 3 }], 10);
  check("cắt biên + bỏ khoảng rỗng", r2.length === 2
    && r2[0].start === 0 && r2[0].end === 1 && r2[1].start === 9 && r2[1].end === 10);
  const r3 = normalizeSilences(
    [{ start: 2, end: 5 }, { start: 4, end: 7 }], 10);
  check("gộp khoảng giao nhau", r3.length === 1 && r3[0].start === 2 && r3[0].end === 7);
  const r4 = normalizeSilences([{ start: 20, end: 30 }], 10);
  check("ngoài biên → rỗng", r4.length === 0);
}

console.log("== [2] keepSegments ==");
{
  const k = keepSegments([{ start: 2, end: 4 }, { start: 6, end: 8 }], 10);
  check("3 keep segments", k.length === 3);
  check("segment đúng", k[0].start === 0 && k[0].end === 2
    && k[1].start === 4 && k[1].end === 6 && k[2].start === 8 && k[2].end === 10);
}

console.log("== [3] removeSilenceFromClip: case bắt buộc ==");
{
  // audio 10s: 3 đoạn nói + 2 khoảng lặng [2,4), [6,8)
  const res = removeSilenceFromClip(
    mkSpec(), "t1", "a1", [{ start: 2, end: 4 }, { start: 6, end: 8 }]);
  assert.ok(res, "phải cắt được");
  check("cắt đúng 2 khoảng", res.cutCount === 2);
  check("tổng cắt 4s", Math.abs(res.removedTotal - 4) < 1e-9);
  check("còn 3 keep clips", res.keepCount === 3);
  const clips = res.spec.tracks[0].clips;
  check("3 clips trên track", clips.length === 3);
  // dồn gap: [0,2), [2,4), [4,6)
  check("clip 1 [0,2)", clips[0].start === 0 && Math.abs(clips[0].duration - 2) < 1e-9);
  check("clip 2 dồn về [2,4)", Math.abs(clips[1].start - 2) < 1e-9);
  check("clip 3 dồn về [4,6)", Math.abs(clips[2].start - 4) < 1e-9);
  // in/out nguồn đúng
  check("clip 2 in=4 out=6", clips[1].in === 4 && clips[1].out === 6);
  check("clip 3 in=8 out=10", clips[2].in === 8 && clips[2].out === 10);
  // id mới, không trùng id gốc
  const ids = new Set(clips.map((c) => c.id));
  check("id mới phân biệt", ids.size === 3 && !ids.has("a1"));
}

console.log("== [4] ripple clip đứng sau ==");
{
  const c1 = mkClip({ id: "a1", start: 0, duration: 10, in: 0, out: 10 });
  const c2 = mkClip({ id: "a2", start: 10, duration: 5, in: 0, out: 5 });
  const res = removeSilenceFromClip(
    mkSpec({}, [c1, c2]), "t1", "a1", [{ start: 2, end: 4 }]);
  assert.ok(res);
  const after = res.spec.tracks[0].clips.find((c) => c.id === "a2");
  check("clip sau dồn về 8", Math.abs(after.start - 8) < 1e-9,
    `(nhận ${after.start})`);
}

console.log("== [5] speed/reverse ==");
{
  // clip speed=2: source [0,20) → timeline 10s; lặng local [2,4) ↔ source [4,8)
  const c = mkClip({ start: 0, duration: 10, in: 0, out: 20, speed: 2 });
  const res = removeSilenceFromClip(mkSpec({}, [c]), "t1", "a1",
    [{ start: 2, end: 4 }]);
  assert.ok(res);
  const clips = res.spec.tracks[0].clips;
  check("keep 2 clips", clips.length === 2);
  check("clip 1 source [0,4)", clips[0].in === 0 && clips[0].out === 4);
  check("clip 2 source [8,20)", clips[1].in === 8 && clips[1].out === 20);
  check("clip 2 duration 6s", Math.abs(clips[1].duration - 6) < 1e-9);
  check("clip 2 start dồn về 2", Math.abs(clips[1].start - 2) < 1e-9);

  // reverse: source [0,10), phát ngược; lặng local [2,4) ↔ source (6,8]
  const cr = mkClip({ start: 5, duration: 10, in: 0, out: 10, speed: 1, reverse: true });
  const resR = removeSilenceFromClip(mkSpec({}, [cr]), "t1", "a1",
    [{ start: 2, end: 4 }]);
  assert.ok(resR);
  const rc = resR.spec.tracks[0].clips;
  check("reverse: keep 2 clips", rc.length === 2);
  check("reverse: segment đầu source [8,10)",
    rc[0].in === 8 && rc[0].out === 10, `(nhận ${rc[0].in},${rc[0].out})`);
  check("reverse: segment sau source [0,6)",
    rc[1].in === 0 && rc[1].out === 6, `(nhận ${rc[1].in},${rc[1].out})`);
  check("reverse: giữ flag reverse", rc[0].reverse === true && rc[1].reverse === true);
}

console.log("== [6] từ chối hợp lệ ==");
{
  check("track khóa → null",
    removeSilenceFromClip(mkSpec({ locked: true }), "t1", "a1",
      [{ start: 2, end: 4 }]) === null);
  check("clip text → null",
    removeSilenceFromClip(
      mkSpec({}, [mkClip({ kind: "text", id: "x1" })]), "t1", "x1",
      [{ start: 2, end: 4 }]) === null);
  check("không có silence → null",
    removeSilenceFromClip(mkSpec(), "t1", "a1", []) === null);
  check("cả clip là lặng → null (không xóa hết)",
    removeSilenceFromClip(mkSpec(), "t1", "a1",
      [{ start: 0, end: 10 }]) === null);
  check("clip không tồn tại → null",
    removeSilenceFromClip(mkSpec(), "t1", "nope",
      [{ start: 2, end: 4 }]) === null);
}

console.log("== [7] không mutate input ==");
{
  const spec = mkSpec();
  const before = JSON.stringify(spec);
  removeSilenceFromClip(spec, "t1", "a1", [{ start: 2, end: 4 }]);
  check("spec gốc nguyên vẹn", JSON.stringify(spec) === before);
}

console.log("== [8] sourceSilenceToLocal ==");
{
  // clip audio: in=10, out=20, speed=1 → lặng nguồn [12,14) ↔ local [2,4)
  const c = mkClip({ start: 5, duration: 10, in: 10, out: 20, speed: 1 });
  const l = sourceSilenceToLocal(c, 12, 14);
  check("map xuôi đúng", l && Math.abs(l.start - 2) < 1e-9 && Math.abs(l.end - 4) < 1e-9);
  // cắt biên: lặng [5,12) chỉ giao [10,12)
  const l2 = sourceSilenceToLocal(c, 5, 12);
  check("cắt theo [in,out)", l2 && Math.abs(l2.start - 0) < 1e-9 && Math.abs(l2.end - 2) < 1e-9);
  // ngoài biên → null
  check("ngoài biên → null", sourceSilenceToLocal(c, 30, 32) === null);
  // speed=2: lặng [14,18) ↔ local [2,4)
  const cs = mkClip({ start: 0, duration: 5, in: 10, out: 20, speed: 2 });
  const l3 = sourceSilenceToLocal(cs, 14, 18);
  check("speed=2 map đúng", l3 && Math.abs(l3.start - 2) < 1e-9 && Math.abs(l3.end - 4) < 1e-9);
  // reverse: in=10,out=20 → lặng [12,14) ↔ local [6,8)
  const cr = mkClip({ start: 0, duration: 10, in: 10, out: 20, speed: 1, reverse: true });
  const l4 = sourceSilenceToLocal(cr, 12, 14);
  check("reverse map đúng", l4 && Math.abs(l4.start - 6) < 1e-9 && Math.abs(l4.end - 8) < 1e-9,
    `(nhận ${l4 && l4.start},${l4 && l4.end})`);
  // clip text → null
  check("clip text → null",
    sourceSilenceToLocal(mkClip({ kind: "text" }), 12, 14) === null);
}

console.log();
console.log("=".repeat(42));
console.log(`🎉 SILENCE TS PASS: ${n} assertions`);
