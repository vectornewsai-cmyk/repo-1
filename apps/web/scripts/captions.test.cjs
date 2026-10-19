// captions.test.cjs — test apps/web/src/lib/captions.ts (R1-072) bằng Node.
// Biên dịch module thật sang CommonJS trong /tmp rồi chạy assertions.
"use strict";

const assert = require("node:assert/strict");
const {
  CAPTION_TRACK_LABEL,
  CAPTION_DEFAULT_STYLE,
  CAPTION_LANGS,
  TRANSLATE_TARGET_LANGS,
  translatedTrackLabel,
  validateCaptionSegments,
  segmentsToTextClips,
} = require("./out/apps/web/src/lib/captions.js");

let pass = 0;
function ok(name, fn) {
  try {
    fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}\n    ${e.message}`);
    process.exitCode = 1;
  }
}

console.log("== [1] validateCaptionSegments ==");
ok("segments hợp lệ → giữ nguyên, làm tròn, trim", () => {
  const out = validateCaptionSegments([
    { start: 0.005, end: 2.345, text: "  Xin chào  " },
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0].start, 0.01);
  assert.equal(out[0].end, 2.35);
  assert.equal(out[0].text, "Xin chào");
});
ok("sắp xếp theo start", () => {
  const out = validateCaptionSegments([
    { start: 5, end: 6, text: "b" },
    { start: 1, end: 2, text: "a" },
  ]);
  assert.equal(out[0].text, "a");
});
ok("bỏ câu hỏng, throw khi không còn câu nào", () => {
  assert.throws(() => validateCaptionSegments([{ start: 1, end: 1, text: "x" }]), /hợp lệ/);
  assert.throws(() => validateCaptionSegments("nope"), /không hợp lệ/);
  assert.throws(() => validateCaptionSegments([]), /hợp lệ/);
});

console.log("== [2] segmentsToTextClips ==");
ok("mỗi segment → 1 TextClip đúng kind/start/duration", () => {
  const clips = segmentsToTextClips([
    { start: 0.5, end: 2.3, text: "Xin chào các bạn" },
    { start: 2.8, end: 5.1, text: "Tạm biệt" },
  ]);
  assert.equal(clips.length, 2);
  assert.equal(clips[0].kind, "text");
  assert.equal(clips[0].text, "Xin chào các bạn");
  assert.equal(clips[0].start, 0.5);
  assert.equal(clips[0].duration, 1.8);
  assert.notEqual(clips[0].id, clips[1].id);
});
ok("duration tối thiểu 0.2s (không clip 0 giây)", () => {
  const clips = segmentsToTextClips([{ start: 1, end: 1.05, text: "ừ" }]);
  assert.equal(clips[0].duration, 0.2);
});
ok("style mặc định khớp caption.py (trắng, nền đen, dưới giữa)", () => {
  const clips = segmentsToTextClips([{ start: 0, end: 1, text: "a" }]);
  const st = clips[0].style;
  assert.equal(st.color, "#ffffff");
  assert.equal(st.backgroundColor, "#000000");
  assert.equal(st.x, 0.5);
  assert.equal(st.y, 0.85);
  assert.equal(st.animation, "none");
  assert.equal(st.bold, true);
  // so với hằng số export
  assert.deepEqual(
    { color: st.color, backgroundColor: st.backgroundColor, x: st.x, y: st.y },
    { color: CAPTION_DEFAULT_STYLE.color, backgroundColor: CAPTION_DEFAULT_STYLE.backgroundColor, x: CAPTION_DEFAULT_STYLE.x, y: CAPTION_DEFAULT_STYLE.y }
  );
});
ok("style tùy chọn ghi đè được", () => {
  const clips = segmentsToTextClips([{ start: 0, end: 1, text: "a" }], { fontSize: 72 });
  assert.equal(clips[0].style.fontSize, 72);
  assert.equal(clips[0].style.color, "#ffffff");
});
ok("không mutate mảng đầu vào", () => {
  const segs = [
    { start: 5, end: 6, text: "b" },
    { start: 1, end: 2, text: "a" },
  ];
  segmentsToTextClips(segs);
  assert.equal(segs[0].text, "b");
});

console.log("== [3] hằng số ==");
ok("CAPTION_TRACK_LABEL + CAPTION_LANGS", () => {
  assert.equal(typeof CAPTION_TRACK_LABEL, "string");
  assert.ok(CAPTION_TRACK_LABEL.length > 0);
  const codes = CAPTION_LANGS.map((l) => l.code);
  assert.ok(codes.includes("vi"));
  assert.ok(codes.includes("en"));
  assert.ok(codes.includes("auto"));
});

console.log("== [4] R1-080 dịch phụ đề ==");
ok("TRANSLATE_TARGET_LANGS hiện chỉ có en", () => {
  const codes = TRANSLATE_TARGET_LANGS.map((l) => l.code);
  assert.deepEqual(codes, ["en"]);
});
ok("translatedTrackLabel('en') → 'Phụ đề (EN)'", () => {
  assert.equal(translatedTrackLabel("en"), "Phụ đề (EN)");
});
ok("translatedTrackLabel viết hoa mã", () => {
  assert.equal(translatedTrackLabel("EN"), "Phụ đề (EN)");
});
ok("segments bản dịch validate như caption gốc (giữ timing, đổi text)", () => {
  const out = validateCaptionSegments([
    { start: 0.5, end: 2.3, text: "Hello everyone" },
    { start: 2.8, end: 5.1, text: "This is a subtitle test video" },
  ]);
  assert.equal(out.length, 2);
  assert.equal(out[0].start, 0.5);
  assert.equal(out[1].text, "This is a subtitle test video");
  const clips = segmentsToTextClips(out);
  assert.equal(clips[0].text, "Hello everyone");
  assert.equal(clips[1].duration, 2.3);
});

console.log(`\n==========================================\n🎉 CAPTIONS UI PASS: ${pass} assertions\n==========================================`);
