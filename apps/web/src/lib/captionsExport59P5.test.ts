// captionsExport59P5.test.ts — Phase 9 đợt 59, luồng P5: đóng nợ đợt 58 §6.5 (O5).
// Verify xuất SRT/VTT của TRACK DỊCH ("Subtitles (EN)") ở tầng lib, với cùng
// fixture mà headed test dùng (2 câu VI import tay + 2 câu EN dịch, cùng mốc
// thời gian; track title tự do phải bị loại khỏi export).
//
// Chạy bằng esbuild bundle (mẫu M4/M6/O5, chạy từ gốc repo; bundle ra scratch
// ngoài repo, KHÔNG ra dist):
//   ./node_modules/.bin/esbuild apps/web/src/lib/captionsExport59P5.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/round59-p5/p5.test.cjs \
//     && node /tmp/round59-p5/p5.test.cjs
//   VCUT_TEST_LANG=en node /tmp/round59-p5/p5.test.cjs
//
// Khác O5: key captions.translatedTrack ĐÃ merge thật vào vi.json/en.json
// (dòng 2449, parent gộp fragment round58-o5) nên test này assert module t()
// trực tiếp, KHÔNG deep-merge mô phỏng nữa.
//
// Test này khóa:
//  1. translatedTrackLabel("en") qua module t() thật: vi → "Phụ đề (EN)",
//     en → "Subtitles (EN)" (nhãn mà headed test tìm trên timeline).
//  2. collectProjectCaptions (hỗn hợp VI + EN + title): 4 cue, trackLabels
//     đúng thứ tự track, title không captionOf bị loại, cue sắp theo start
//     (ổn định: VI trước EN ở cùng mốc).
//  3. formatSrt: byte-exact toàn bộ chuỗi (số thứ tự, timestamp dấu phẩy,
//     text EN + VI, \n cuối).
//  4. formatVtt: byte-exact (header WEBVTT, timestamp dấu chấm, \n cuối).
//  5. Round-trip: parseSrt(formatSrt(cues)) và parseVtt(formatVtt(cues))
//     trả lại đúng cues, không lỗi.
//  6. Chỉ track EN: SRT chỉ chứa 2 cue EN, không lẫn câu VI.
//  7. Không có caption track: cues rỗng, formatSrt("") rỗng,
//     formatVtt("WEBVTT\n\n") — exportProject đã chặn rỗng ở UI, đây chỉ
//     khóa hành vi formatter.
import assert from "node:assert/strict";
import { setLang } from "../i18n";

/** Khai báo tối thiểu để không cần @types/node (mẫu M7). */
declare const process: {
  exitCode: number | undefined;
  env: Record<string, string | undefined>;
};

const LANG = (process.env.VCUT_TEST_LANG === "en" ? "en" : "vi") as "vi" | "en";
const VI = LANG === "vi";

let pass = 0;
const queue: Array<{ name: string; fn: () => void }> = [];
function ok(name: string, fn: () => void): void {
  queue.push({ name, fn });
}
function runAll(): void {
  for (const t of queue) {
    try {
      t.fn();
      pass++;
      console.log(`  ✓ ${t.name}`);
    } catch (e) {
      console.error(`  ✗ ${t.name}: ${(e as Error).message}`);
      process.exitCode = 1;
    }
  }
  console.log(`P5 captions export round 59 [lang=${LANG}]: ${pass}/${queue.length} pass`);
}

// --- Fixture chung với headed test (cùng câu, cùng mốc) --------------------
const STYLE = {
  fontFamily: "Inter",
  fontSize: 56,
  color: "#ffffff",
  bold: true,
  italic: false,
  x: 0.5,
  y: 0.85,
  animation: "none",
} as const;

function capClip(over: {
  id: string;
  start: number;
  duration: number;
  text: string;
}): Record<string, unknown> {
  return { kind: "text", style: { ...STYLE }, ...over };
}
function track(
  id: string,
  label: string | undefined,
  clips: Record<string, unknown>[],
): Record<string, unknown> {
  return { id, kind: "text", label, clips };
}

/** Project mẫu: track VI import tay + track dịch EN + track title nhiễu. */
function mixedProject(enLabel: string): Record<string, unknown>[] {
  return [
    track("t-vi", "Phụ đề 2", [
      capClip({ id: "v1", start: 0.5, duration: 1.5, text: "Xin chào các bạn" }),
      capClip({ id: "v2", start: 2.5, duration: 1.5, text: "Đây là video thử nghiệm" }),
    ]),
    track("t-en", enLabel, [
      capClip({ id: "e1", start: 0.5, duration: 1.5, text: "Hello everyone" }),
      capClip({ id: "e2", start: 2.5, duration: 1.5, text: "This is a test video" }),
    ]),
    track("t-title", "Tiêu đề", [
      capClip({ id: "x1", start: 0, duration: 3, text: "TIÊU ĐỀ TỰ DO" }),
    ]),
  ];
}

const EXPECTED_SRT =
  "1\n00:00:00,500 --> 00:00:02,000\nXin chào các bạn\n\n" +
  "2\n00:00:00,500 --> 00:00:02,000\nHello everyone\n\n" +
  "3\n00:00:02,500 --> 00:00:04,000\nĐây là video thử nghiệm\n\n" +
  "4\n00:00:02,500 --> 00:00:04,000\nThis is a test video\n";

const EXPECTED_VTT =
  "WEBVTT\n\n" +
  "00:00:00.500 --> 00:00:02.000\nXin chào các bạn\n\n" +
  "00:00:00.500 --> 00:00:02.000\nHello everyone\n\n" +
  "00:00:02.500 --> 00:00:04.000\nĐây là video thử nghiệm\n\n" +
  "00:00:02.500 --> 00:00:04.000\nThis is a test video\n";

async function main(): Promise<void> {
  setLang(LANG);
  // Import ĐỘNG sau setLang (mẫu M4/O5).
  const captions = await import("./captions");
  const subtitles = await import("./subtitles");

  ok("translatedTrackLabel('en') qua module t() thật (key đã merge)", () => {
    assert.equal(
      captions.translatedTrackLabel("en"),
      VI ? "Phụ đề (EN)" : "Subtitles (EN)",
    );
    assert.equal(
      captions.translatedTrackLabel("en"),
      VI ? "Phụ đề (EN)" : "Subtitles (EN)",
    );
  });

  ok("collectProjectCaptions: hỗn hợp VI + EN + title → 4 cue, title bị loại", () => {
    const enLabel = captions.translatedTrackLabel("en");
    const tracks = mixedProject(enLabel) as unknown as Parameters<
      typeof subtitles.collectProjectCaptions
    >[0];
    const { cues, trackLabels } = subtitles.collectProjectCaptions(tracks);
    assert.equal(cues.length, 4, `muốn 4 cue, nhận ${cues.length}`);
    assert.deepEqual(trackLabels, ["Phụ đề 2", enLabel]);
    assert.deepEqual(
      cues.map((c) => c.text),
      ["Xin chào các bạn", "Hello everyone", "Đây là video thử nghiệm", "This is a test video"],
      "cue sắp theo start, ổn định VI trước EN ở cùng mốc",
    );
    assert.deepEqual(
      cues.map((c) => [c.start, c.end]),
      [[0.5, 2], [0.5, 2], [2.5, 4], [2.5, 4]],
    );
  });

  ok("formatSrt: byte-exact cho project hỗn hợp (EN + VI)", () => {
    const enLabel = captions.translatedTrackLabel("en");
    const tracks = mixedProject(enLabel) as unknown as Parameters<
      typeof subtitles.collectProjectCaptions
    >[0];
    const { cues } = subtitles.collectProjectCaptions(tracks);
    assert.equal(subtitles.formatSrt(cues), EXPECTED_SRT);
  });

  ok("formatVtt: byte-exact cho project hỗn hợp (EN + VI)", () => {
    const enLabel = captions.translatedTrackLabel("en");
    const tracks = mixedProject(enLabel) as unknown as Parameters<
      typeof subtitles.collectProjectCaptions
    >[0];
    const { cues } = subtitles.collectProjectCaptions(tracks);
    assert.equal(subtitles.formatVtt(cues), EXPECTED_VTT);
  });

  ok("round-trip: parseSrt(formatSrt) + parseVtt(formatVtt) giữ nguyên cues", () => {
    const enLabel = captions.translatedTrackLabel("en");
    const tracks = mixedProject(enLabel) as unknown as Parameters<
      typeof subtitles.collectProjectCaptions
    >[0];
    const { cues } = subtitles.collectProjectCaptions(tracks);
    const backSrt = subtitles.parseSrt(subtitles.formatSrt(cues));
    assert.deepEqual(backSrt.errors, []);
    assert.deepEqual(backSrt.cues, cues);
    const backVtt = subtitles.parseVtt(subtitles.formatVtt(cues));
    assert.deepEqual(backVtt.errors, []);
    assert.deepEqual(backVtt.cues, cues);
  });

  ok("chỉ track EN: SRT chỉ chứa 2 cue EN, không lẫn câu VI", () => {
    const tracks = [
      track("t-en", "Subtitles (EN)", [
        capClip({ id: "e1", start: 0.5, duration: 1.5, text: "Hello everyone" }),
        capClip({ id: "e2", start: 2.5, duration: 1.5, text: "This is a test video" }),
      ]),
    ] as unknown as Parameters<typeof subtitles.collectProjectCaptions>[0];
    const { cues, trackLabels } = subtitles.collectProjectCaptions(tracks);
    assert.equal(cues.length, 2);
    assert.deepEqual(trackLabels, ["Subtitles (EN)"]);
    assert.equal(
      subtitles.formatSrt(cues),
      "1\n00:00:00,500 --> 00:00:02,000\nHello everyone\n\n" +
        "2\n00:00:02,500 --> 00:00:04,000\nThis is a test video\n",
    );
  });

  ok("không caption track: cues rỗng, formatter rỗng/WEBVTT trần", () => {
    const tracks = [
      track("t-title", "Tiêu đề", [
        capClip({ id: "x1", start: 0, duration: 3, text: "TIÊU ĐỀ TỰ DO" }),
      ]),
    ] as unknown as Parameters<typeof subtitles.collectProjectCaptions>[0];
    const { cues, trackLabels } = subtitles.collectProjectCaptions(tracks);
    assert.equal(cues.length, 0);
    assert.deepEqual(trackLabels, []);
    assert.equal(subtitles.formatSrt(cues), "");
    assert.equal(subtitles.formatVtt(cues), "WEBVTT\n\n");
  });

  runAll();
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
