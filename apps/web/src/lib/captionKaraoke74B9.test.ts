// captionKaraoke74B9.test.ts — Phase 9 đợt 74, luồng B9 (gap A1):
// karaoke highlight + style template karaoke + xuất SRT/VTT.
//
// Chạy bằng esbuild bundle (mẫu P5/O5, chạy từ gốc repo; bundle ra scratch
// ngoài repo, KHÔNG ra dist):
//   ./node_modules/.bin/esbuild apps/web/src/lib/captionKaraoke74B9.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/round74-b9/b9.test.cjs \
//     && node /tmp/round74-b9/b9.test.cjs
//
// Test này khóa (logic thuần, không DOM/store):
//  1. KARAOKE_STYLE_TEMPLATES: đúng 3 template, id/nameKey duy nhất, style
//     hex hợp lệ (#rgb/#rrggbb/#rrggbbaa), highlight khác nhau, template
//     "nen-mo" nền #00000080 (đen 50% — cần validator/render hiểu alpha).
//  2. resolveKaraokeTemplate: id đúng → đúng template; id lạ/undefined/null
//     → template mặc định (Vàng nổi bật).
//  3. karaokeActiveWordIndex (logic preview tô sáng tích lũy): biên trước
//     từ đầu (-1), đúng mốc start, giữa hai từ, sau từ cuối, mảng rỗng.
//  4. segmentsToTextClips + template "nen-mo" + words: clip mang đúng style
//     template (nền mờ + highlight cyan) VÀ karaoke clip-local.
//  5. SRT/VTT round-trip: formatSrt/formatVtt → parseSubtitleFile → cue
//     giữ nguyên start/end/text; timestamp SRT dấu phẩy, VTT dấu chấm +
//     header WEBVTT. (Karaoke KHÔNG round-trip được qua SRT/VTT — file
//     không chứa word timestamps — khóa rõ ở đây.)
//  6. Dict vi/en: đủ 4 key caption.karaokeStyle* mới, cùng tập, không rỗng.
//
// Render thật (ASS \k + MP4) và ffprobe SRT KHÔNG nằm trong file này —
// xem docs/PHASE9_ROUND74_B9_CAPTION_KARAOKE_LIMITS.md §3 (chạy tay bằng
// node server/render/src/render.js + ffprobe, số đo ghi trong LIMITS).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  KARAOKE_DEFAULT_TEMPLATE_ID,
  KARAOKE_STYLE_TEMPLATES,
  karaokeActiveWordIndex,
  resolveKaraokeTemplate,
  segmentsToTextClips,
  validateCaptionWords,
  wordsToKaraoke,
  type CaptionSegment,
} from "./captions.ts";
import {
  formatSrt,
  formatVtt,
  parseSubtitleFile,
} from "./subtitles.ts";

/** Khai báo tối thiểu để không cần @types/node. */
declare const process: { exitCode: number | undefined };

let pass = 0;
let fail = 0;
function ok(name: string, fn: () => void): void {
  try {
    fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    fail++;
    console.error(`  ✗ ${name}: ${(e as Error).message}`);
  }
}

/** Hex màu hợp lệ theo validator mới (validate.js đợt 74 B9). */
function isHex(s: string | undefined): boolean {
  return (
    typeof s === "string" &&
    /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(s)
  );
}

console.log("== caption karaoke 74 B9 (templates + highlight + SRT/VTT) ==");

ok("templates: đúng 3, id/nameKey duy nhất, hex hợp lệ, highlight khác nhau", () => {
  assert.equal(KARAOKE_STYLE_TEMPLATES.length, 3);
  const ids = new Set(KARAOKE_STYLE_TEMPLATES.map((t) => t.id));
  assert.equal(ids.size, 3, "id template phải duy nhất");
  const keys = new Set(KARAOKE_STYLE_TEMPLATES.map((t) => t.nameKey));
  assert.equal(keys.size, 3, "nameKey phải duy nhất");
  const his = new Set<string>();
  for (const tpl of KARAOKE_STYLE_TEMPLATES) {
    assert.ok(tpl.nameKey.startsWith("caption.karaokeStyle"), tpl.nameKey);
    assert.ok(isHex(tpl.style.color), `${tpl.id}: color ${tpl.style.color}`);
    assert.ok(
      isHex(tpl.style.backgroundColor),
      `${tpl.id}: backgroundColor ${tpl.style.backgroundColor}`,
    );
    assert.ok(
      isHex(tpl.style.highlightColor),
      `${tpl.id}: highlightColor ${tpl.style.highlightColor}`,
    );
    assert.equal(tpl.style.bold, true, `${tpl.id}: phải bold`);
    his.add(tpl.style.highlightColor as string);
  }
  assert.equal(his.size, 3, "mỗi template một màu highlight riêng");
});

ok('templates: "nen-mo" nền #00000080 (đen 50%), highlight cyan', () => {
  const tpl = resolveKaraokeTemplate("nen-mo");
  assert.equal(tpl.style.backgroundColor, "#00000080");
  assert.equal(tpl.style.highlightColor, "#00e5ff");
  assert.equal(tpl.nameKey, "caption.karaokeStyleDimBg");
});

ok('templates: mặc định là "vang-noi-bat" (= style cũ R4)', () => {
  assert.equal(KARAOKE_DEFAULT_TEMPLATE_ID, "vang-noi-bat");
  const tpl = resolveKaraokeTemplate(KARAOKE_DEFAULT_TEMPLATE_ID);
  assert.equal(tpl.style.highlightColor, "#ffff00");
  assert.equal(tpl.style.backgroundColor, "#000000");
  assert.equal(tpl.style.color, "#ffffff");
});

ok("resolveKaraokeTemplate: id lạ/undefined/null → mặc định, không null", () => {
  assert.equal(resolveKaraokeTemplate("khong-co").id, "vang-noi-bat");
  assert.equal(resolveKaraokeTemplate(undefined).id, "vang-noi-bat");
  assert.equal(resolveKaraokeTemplate(null).id, "vang-noi-bat");
  assert.equal(resolveKaraokeTemplate("").id, "vang-noi-bat");
});

const WORDS = [
  { start: 0.0, end: 0.4, word: "Xin" },
  { start: 0.5, end: 0.9, word: "chào" },
  { start: 1.0, end: 1.6, word: "các" },
  { start: 1.7, end: 2.2, word: "bạn" },
];

ok("karaokeActiveWordIndex: biên trước/giữa/sau, đúng mốc start", () => {
  assert.equal(karaokeActiveWordIndex([], 1), -1);
  assert.equal(karaokeActiveWordIndex(WORDS, -0.1), -1);
  assert.equal(karaokeActiveWordIndex(WORDS, 0), 0);
  assert.equal(karaokeActiveWordIndex(WORDS, 0.2), 0);
  assert.equal(karaokeActiveWordIndex(WORDS, 0.45), 0, "giữa 2 từ: từ trước vẫn sáng");
  assert.equal(karaokeActiveWordIndex(WORDS, 0.5), 1, "đúng mốc start từ 2");
  assert.equal(karaokeActiveWordIndex(WORDS, 1.65), 2);
  assert.equal(karaokeActiveWordIndex(WORDS, 2.2), 3, "đúng mốc end từ cuối vẫn sáng");
  assert.equal(karaokeActiveWordIndex(WORDS, 99), 3, "sau từ cuối: giữ từ cuối sáng");
});

ok("segmentsToTextClips + template nen-mo + words: style + karaoke clip-local", () => {
  const segments: CaptionSegment[] = [
    { start: 10, end: 12.2, text: "Xin chào các bạn" },
  ];
  const words = validateCaptionWords([
    { start: 10.0, end: 10.4, word: "Xin" },
    { start: 10.5, end: 10.9, word: "chào" },
    { start: 11.0, end: 11.6, word: "các" },
    { start: 11.7, end: 12.2, word: "bạn" },
  ]);
  const tpl = resolveKaraokeTemplate("nen-mo");
  const [clip] = segmentsToTextClips(segments, tpl.style, words);
  assert.equal(clip.style.backgroundColor, "#00000080");
  assert.equal(clip.style.highlightColor, "#00e5ff");
  assert.equal(clip.style.color, "#ffffff");
  assert.ok(Array.isArray(clip.karaoke));
  assert.equal(clip.karaoke!.length, 4);
  assert.deepEqual(clip.karaoke![0], { word: "Xin", start: 0, end: 0.4 });
  assert.deepEqual(clip.karaoke![3], { word: "bạn", start: 1.7, end: 2.2 });
  // wordsToKaraoke gốc clip-local (dùng cho ASS \k): tổng thời lượng khớp.
  const ka = wordsToKaraoke(segments[0], words);
  assert.equal(ka.length, 4);
  assert.ok(Math.abs(ka[3].end - 2.2) < 1e-9);
});

const SEGS: CaptionSegment[] = [
  { start: 1.5, end: 3.25, text: "Xin chào các bạn" },
  { start: 4.0, end: 6.0, text: "Hôm nay trời đẹp" },
];

ok("SRT round-trip: format → parse giữ nguyên cue, timestamp dấu phẩy", () => {
  const srt = formatSrt(SEGS);
  assert.ok(srt.includes("00:00:01,500 --> 00:00:03,250"), srt);
  assert.ok(srt.startsWith("1\n"), "cue đầu đánh số 1");
  const { cues, errors } = parseSubtitleFile(srt);
  assert.equal(errors.length, 0, JSON.stringify(errors));
  assert.equal(cues.length, 2);
  assert.equal(cues[0].start, 1.5);
  assert.equal(cues[0].end, 3.25);
  assert.equal(cues[0].text, "Xin chào các bạn");
  assert.equal(cues[1].start, 4.0);
  assert.equal(cues[1].end, 6.0);
  assert.equal(cues[1].text, "Hôm nay trời đẹp");
});

ok("VTT round-trip: header WEBVTT, timestamp dấu chấm, parse giữ nguyên cue", () => {
  const vtt = formatVtt(SEGS);
  assert.ok(vtt.startsWith("WEBVTT\n"), vtt.slice(0, 20));
  assert.ok(vtt.includes("00:00:01.500 --> 00:00:03.250"), vtt);
  const { cues, errors } = parseSubtitleFile(vtt);
  assert.equal(errors.length, 0, JSON.stringify(errors));
  assert.equal(cues.length, 2);
  assert.equal(cues[0].start, 1.5);
  assert.equal(cues[0].end, 3.25);
  assert.equal(cues[0].text, "Xin chào các bạn");
  assert.equal(cues[1].text, "Hôm nay trời đẹp");
});

ok("SRT/VTT KHÔNG mang karaoke: parse lại không có word timestamps", () => {
  // Thiết kế: file SRT/VTT không chứa word timestamps nên caption nhập từ
  // SRT/VTT không karaoke được (CaptionModal đã setWords([]) — xem R4).
  // Khóa ở đây: cue parse ra chỉ có start/end/text, không trường word nào.
  const { cues } = parseSubtitleFile(formatSrt(SEGS));
  for (const c of cues) {
    assert.equal((c as unknown as Record<string, unknown>)["words"], undefined);
    assert.equal((c as unknown as Record<string, unknown>)["karaoke"], undefined);
  }
});

ok("dict vi/en: đủ 4 key caption.karaokeStyle* mới, cùng tập, không rỗng", () => {
  const vi = JSON.parse(readFileSync("apps/web/src/i18n/vi.json", "utf8")) as Record<string, unknown>;
  const en = JSON.parse(readFileSync("apps/web/src/i18n/en.json", "utf8")) as Record<string, unknown>;
  const capVi = vi["caption"] as Record<string, string>;
  const capEn = en["caption"] as Record<string, string>;
  for (const k of [
    "karaokeStyleLabel",
    "karaokeStyleYellow",
    "karaokeStyleDimBg",
    "karaokeStyleNeonPink",
  ]) {
    assert.ok(typeof capVi[k] === "string" && capVi[k].length > 0, `vi thiếu ${k}`);
    assert.ok(typeof capEn[k] === "string" && capEn[k].length > 0, `en thiếu ${k}`);
    assert.notEqual(capVi[k], capEn[k], `${k}: vi/en phải khác nhau`);
  }
  assert.equal(capVi["karaokeStyleYellow"], "Vàng nổi bật");
  assert.equal(capVi["karaokeStyleDimBg"], "Nền mờ");
  assert.equal(capEn["karaokeStyleDimBg"], "Dim background");
});

console.log(`\ncaption karaoke 74 B9: ${pass} pass, ${fail} fail`);
process.exitCode = fail > 0 ? 1 : 0;
