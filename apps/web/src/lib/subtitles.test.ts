/**
 * subtitles.test.ts — test SRT/VTT bằng Node type-stripping (Phase 9 R4).
 * Chạy: node --experimental-strip-types src/lib/subtitles.test.ts
 * (tsconfig exclude file này theo mẫu các test .ts khác.)
 */
import assert from "node:assert/strict";
import {
  clipsToCues,
  formatSrt,
  formatVtt,
  parseSubtitleFile,
  parseSrt,
  parseTimestamp,
  parseVtt,
} from "./subtitles.ts";

let pass = 0;
let fail = 0;
function ok(name: string, fn: () => void) {
  try {
    fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    fail++;
    console.error(`  ✗ ${name}: ${(e as Error).message}`);
  }
}

console.log("== subtitles (SRT/VTT) ==");

ok("parse SRT cơ bản + nhiều dòng", () => {
  const r = parseSrt(
    "1\n00:00:01,000 --> 00:00:03,500\nXin chào\nViệt Nam\n\n2\n00:00:04,000 --> 00:00:05,250\nTạm biệt\n"
  );
  assert.equal(r.errors.length, 0);
  assert.equal(r.cues.length, 2);
  assert.equal(r.cues[0].start, 1);
  assert.equal(r.cues[0].end, 3.5);
  assert.equal(r.cues[0].text, "Xin chào\nViệt Nam");
  assert.equal(r.cues[1].end, 5.25);
});

ok("parse SRT không cần số thứ tự liên tục", () => {
  const r = parseSrt("7\n00:00:01,000 --> 00:00:02,000\nA\n\n99\n00:00:03,000 --> 00:00:04,000\nB\n");
  assert.equal(r.errors.length, 0);
  assert.equal(r.cues.length, 2);
});

ok("parse SRT: cue hỏng bị bỏ + báo lỗi rõ, cue tốt vẫn giữ", () => {
  const r = parseSrt(
    "1\n00:00:01,000 --> 00:00:02,000\nTốt\n\n2\nkhông phải timestamp\nHỏng\n\n3\n00:00:05,000 --> 00:00:04,000\nNgược thời gian\n\n4\n00:00:06,000 --> 00:00:07,000\nTốt 2\n"
  );
  assert.equal(r.cues.length, 2);
  assert.equal(r.cues[0].text, "Tốt");
  assert.equal(r.cues[1].text, "Tốt 2");
  assert.equal(r.errors.length, 2);
  assert.equal(r.errors[0].block, 2);
  assert.equal(r.errors[1].block, 3);
});

ok("parse SRT: timestamp phút/giây sai (>60) bị báo lỗi", () => {
  const r = parseSrt("1\n00:00:61,000 --> 00:00:62,000\nSai\n");
  assert.equal(r.cues.length, 0);
  assert.equal(r.errors.length, 1);
});

ok("parse VTT: header + id cue + MM:SS.mmm", () => {
  const r = parseVtt(
    "WEBVTT\n\ncue-1\n01:02.500 --> 01:04.000\nMột phút sau\n\n00:00:05.000 --> 00:00:06.500\nKhông id\n"
  );
  assert.equal(r.errors.length, 0);
  assert.equal(r.cues.length, 2);
  // Cues được sắp xếp theo start nên cue 5s đứng trước cue 62.5s.
  assert.equal(r.cues[0].start, 5);
  assert.equal(r.cues[1].start, 62.5);
  assert.equal(r.cues[1].end, 64);
});

ok("parse VTT: thiếu header → lỗi toàn file, không cue", () => {
  const r = parseVtt("00:00:01.000 --> 00:00:02.000\nKhông header\n");
  assert.equal(r.cues.length, 0);
  assert.equal(r.errors.length, 1);
});

ok("parse VTT: settings sau timestamp (align:start) vẫn đọc được", () => {
  const r = parseVtt("WEBVTT\n\n00:00:01.000 --> 00:00:02.000 align:start\nCó settings\n");
  assert.equal(r.errors.length, 0);
  assert.equal(r.cues.length, 1);
});

ok("format SRT round-trip giữ nguyên thời gian + text", () => {
  const src = "1\n00:00:01,250 --> 00:00:03,750\nDòng một\nDòng hai\n\n2\n00:01:00,000 --> 00:01:02,500\nSau một phút\n";
  const r = parseSrt(src);
  const out = formatSrt(r.cues);
  const r2 = parseSrt(out);
  assert.deepEqual(r2.cues, r.cues);
  assert.equal(r2.errors.length, 0);
});

ok("format VTT round-trip giữ nguyên thời gian + text", () => {
  const src = "WEBVTT\n\n00:00:01.250 --> 00:00:03.750\nDòng một\n\n00:01:00.000 --> 00:01:02.500\nSau một phút\n";
  const r = parseVtt(src);
  const out = formatVtt(r.cues);
  const r2 = parseVtt(out);
  assert.deepEqual(r2.cues, r.cues);
  assert.ok(out.startsWith("WEBVTT"));
});

ok("SRT ↔ VTT: cùng cues, chỉ khác dấu phân cách ms", () => {
  const cues = [
    { start: 1.25, end: 3.75, text: "A" },
    { start: 60, end: 62.5, text: "B" },
  ];
  const fromSrt = parseSrt(formatSrt(cues)).cues;
  const fromVtt = parseVtt(formatVtt(cues)).cues;
  assert.deepEqual(fromSrt, fromVtt);
  assert.ok(formatSrt(cues).includes("00:00:01,250"));
  assert.ok(formatVtt(cues).includes("00:00:01.250"));
});

ok("parseSubtitleFile tự nhận VTT theo header, còn lại là SRT", () => {
  const vtt = parseSubtitleFile("WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nV\n");
  assert.equal(vtt.cues.length, 1);
  const srt = parseSubtitleFile("1\n00:00:01,000 --> 00:00:02,000\nS\n");
  assert.equal(srt.cues.length, 1);
});

ok("parseTimestamp: giờ 1 chữ số + ms 1-3 chữ số", () => {
  assert.equal(parseTimestamp("1:02:03,4"), 3723.4);
  assert.equal(parseTimestamp("01:02:03,45"), 3723.45);
  assert.equal(parseTimestamp("01:02:03.456"), 3723.456);
  assert.equal(parseTimestamp("01:02:03"), null);
  assert.equal(parseTimestamp("abc"), null);
});

ok("clipsToCues: bỏ clip rỗng/duration 0, sắp xếp theo start", () => {
  const cues = clipsToCues([
    { start: 5, duration: 1, text: "Sau" },
    { start: 1, duration: 2, text: "Trước" },
    { start: 3, duration: 0, text: "Rỗng" },
    { start: 4, duration: 1, text: "   " },
  ]);
  assert.equal(cues.length, 2);
  assert.equal(cues[0].text, "Trước");
  assert.equal(cues[0].end, 3);
  assert.equal(cues[1].start, 5);
});

ok("cue rỗng text / thiếu text bị báo lỗi, không tạo cue ma", () => {
  const r = parseSrt("1\n00:00:01,000 --> 00:00:02,000\n");
  // Khối chỉ có timestamp mà không có text → block chỉ còn 1-2 dòng;
  // parser coi dòng timestamp là đủ, text rỗng → lỗi.
  assert.equal(r.cues.length, 0);
  assert.equal(r.errors.length, 1);
});

console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
process.exit(fail > 0 ? 1 : 0);
