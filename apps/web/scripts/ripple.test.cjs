/**
 * Test cho apps/web/src/lib/ripple.ts (chạy bằng Node, không cần browser).
 * Được biên dịch & chạy bởi scripts/test-ripple.sh.
 */
"use strict";

const { rippleDelete, rippleTrimRight, shiftClipsAfter } = require("./out/apps/web/src/lib/ripple.js");

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

function makeSpec(tracks) {
  // tracks: [{ id, kind, clips: [{id, start, duration}] }]
  return {
    version: "0.2.0",
    meta: { name: "test", width: 1280, height: 720, fps: 30 },
    tracks: tracks.map((t) => ({
      id: t.id,
      kind: t.kind,
      label: t.id,
      clips: t.clips.map((c) => vclip(c.id, c.start, c.duration)),
    })),
  };
}

function startsOf(spec, trackId) {
  return spec.tracks.find((t) => t.id === trackId).clips.map((c) => [c.id, c.start, c.duration]);
}

console.log("== rippleDelete ==");

// 1. Case bắt buộc: 3 clip liên tiếp → xóa giữa → 2 clip khít nhau
{
  const spec = makeSpec([{ id: "v1", kind: "video", clips: [
    { id: "c1", start: 0, duration: 2 },
    { id: "c2", start: 2, duration: 2 },
    { id: "c3", start: 4, duration: 2 },
  ]}]);
  const r = rippleDelete(spec, "v1", "c2");
  ok(r !== null, "tìm thấy clip");
  const s = startsOf(r.spec, "v1");
  ok(s.length === 2, "còn 2 clip");
  ok(s[0][0] === "c1" && s[0][1] === 0 && s[0][2] === 2, "c1 giữ nguyên [0,2)");
  ok(s[1][0] === "c3" && s[1][1] === 2 && s[1][2] === 2, "c3 dồn về [2,4) — khít nhau");
  ok(r.closedGap === 2, "closedGap = 2");
  ok(r.shifted.length === 1 && r.shifted[0].clipId === "c3", "shifted ghi nhận c3");
  ok(r.removed.id === "c2", "removed là c2");
}

// 2. Xóa clip đầu → các clip sau dồn hết về trước
{
  const spec = makeSpec([{ id: "v1", kind: "video", clips: [
    { id: "c1", start: 0, duration: 3 },
    { id: "c2", start: 3, duration: 2 },
    { id: "c3", start: 5, duration: 1 },
  ]}]);
  const r = rippleDelete(spec, "v1", "c1");
  const s = startsOf(r.spec, "v1");
  ok(s[0][1] === 0 && s[1][1] === 2, "c2 → 0, c3 → 2");
}

// 3. Xóa clip cuối → không có gì để dồn
{
  const spec = makeSpec([{ id: "v1", kind: "video", clips: [
    { id: "c1", start: 0, duration: 2 },
    { id: "c2", start: 2, duration: 2 },
  ]}]);
  const r = rippleDelete(spec, "v1", "c2");
  const s = startsOf(r.spec, "v1");
  ok(s.length === 1 && s[0][1] === 0, "c1 giữ nguyên, không shift");
  ok(r.shifted.length === 0, "shifted rỗng");
}

// 4. Gap tương đối được giữ: [0,2),[5,7) → xóa đầu → [3,5)
{
  const spec = makeSpec([{ id: "v1", kind: "video", clips: [
    { id: "c1", start: 0, duration: 2 },
    { id: "c2", start: 5, duration: 2 },
  ]}]);
  const r = rippleDelete(spec, "v1", "c1");
  const s = startsOf(r.spec, "v1");
  ok(s.length === 1 && s[0][1] === 3, "c2 → 3 (gap 3s được giữ)");
}

// 5. Không tìm thấy → null
{
  const spec = makeSpec([{ id: "v1", kind: "video", clips: [{ id: "c1", start: 0, duration: 2 }] }]);
  ok(rippleDelete(spec, "nope", "c1") === null, "track lạ → null");
  ok(rippleDelete(spec, "v1", "nope") === null, "clip lạ → null");
}

// 6. Track khác không bị ảnh hưởng
{
  const spec = makeSpec([
    { id: "v1", kind: "video", clips: [{ id: "c1", start: 0, duration: 2 }, { id: "c2", start: 2, duration: 2 }] },
    { id: "a1", kind: "audio", clips: [{ id: "a1c", start: 0, duration: 4 }] },
  ]);
  const r = rippleDelete(spec, "v1", "c1");
  const sa = startsOf(r.spec, "a1");
  ok(sa.length === 1 && sa[0][1] === 0 && sa[0][2] === 4, "track audio giữ nguyên");
}

// 7. Không mutate input
{
  const spec = makeSpec([{ id: "v1", kind: "video", clips: [
    { id: "c1", start: 0, duration: 2 },
    { id: "c2", start: 2, duration: 2 },
  ]}]);
  rippleDelete(spec, "v1", "c1");
  const s = startsOf(spec, "v1");
  ok(s.length === 2 && s[1][1] === 2, "spec gốc không bị đổi");
}

console.log("== shiftClipsAfter ==");

// 8. Delta dương = đẩy ra sau
{
  const track = makeSpec([{ id: "v1", kind: "video", clips: [
    { id: "c1", start: 0, duration: 2 },
    { id: "c2", start: 2, duration: 2 },
  ]}]).tracks[0];
  const r = shiftClipsAfter(track, 2, 1.5);
  const s = r.track.clips.map((c) => [c.id, c.start]);
  ok(s[0][1] === 0 && s[1][1] === 3.5, "c2 đẩy → 3.5");
  ok(r.shifted.length === 1, "1 clip bị dịch");
}

// 9. Delta 0 = no-op (trả về track gốc)
{
  const track = makeSpec([{ id: "v1", kind: "video", clips: [{ id: "c1", start: 0, duration: 2 }] }]).tracks[0];
  const r = shiftClipsAfter(track, 0, 0);
  ok(r.shifted.length === 0 && r.track === track, "no-op trả về track gốc");
}

// 10. Clip đứng trước fromTime không bị dịch
{
  const track = makeSpec([{ id: "v1", kind: "video", clips: [
    { id: "c1", start: 0, duration: 2 },
    { id: "c2", start: 5, duration: 2 },
  ]}]).tracks[0];
  const r = shiftClipsAfter(track, 5, -1);
  const s = r.track.clips.map((c) => [c.id, c.start]);
  ok(s[0][1] === 0 && s[1][1] === 4, "chỉ c2 dịch");
}

console.log("== rippleTrimRight ==");

// 11. Trim ngắn lại → clip sau dồn
{
  const spec = makeSpec([{ id: "v1", kind: "video", clips: [
    { id: "c1", start: 0, duration: 4 },
    { id: "c2", start: 4, duration: 2 },
  ]}]);
  const patched = { ...spec.tracks[0].clips[0], duration: 2.5 };
  const r = rippleTrimRight(spec, "v1", "c1", patched);
  ok(r !== null, "tìm thấy clip");
  const s = startsOf(r.spec, "v1");
  ok(s[0][2] === 2.5, "c1 duration → 2.5");
  ok(s[1][1] === 2.5, "c2 dồn → 2.5");
  ok(r.delta === -1.5, "delta = -1.5");
}

// 12. Trim dài ra → clip sau bị đẩy
{
  const spec = makeSpec([{ id: "v1", kind: "video", clips: [
    { id: "c1", start: 0, duration: 2 },
    { id: "c2", start: 2, duration: 2 },
  ]}]);
  const patched = { ...spec.tracks[0].clips[0], duration: 3 };
  const r = rippleTrimRight(spec, "v1", "c1", patched);
  const s = startsOf(r.spec, "v1");
  ok(s[1][1] === 3, "c2 đẩy → 3");
  ok(r.delta === 1, "delta = 1");
}

// 13. Không tìm thấy → null
{
  const spec = makeSpec([{ id: "v1", kind: "video", clips: [{ id: "c1", start: 0, duration: 2 }] }]);
  const patched = { ...spec.tracks[0].clips[0], duration: 1 };
  ok(rippleTrimRight(spec, "v1", "nope", patched) === null, "clip lạ → null");
  ok(rippleTrimRight(spec, "nope", "c1", patched) === null, "track lạ → null");
}

console.log(`\nKẾT QUẢ: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
