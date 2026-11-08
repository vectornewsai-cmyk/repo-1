// captionsTrack58O5.test.ts — Phase 9 đợt 58, luồng O5: đóng nợ đợt 57 §6.6
// (key captions.translatedTrack CHƯA merge vì recognition token "Phụ đề").
//
// Chạy bằng esbuild bundle (mẫu M4/M6, chạy từ gốc repo; bundle ra scratch
// ngoài repo, KHÔNG ra dist):
//   ./node_modules/.bin/esbuild apps/web/src/lib/captionsTrack58O5.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/round58-o5/o5.test.cjs \
//     && node /tmp/round58-o5/o5.test.cjs
//   VCUT_TEST_LANG=en node /tmp/round58-o5/o5.test.cjs
//
// Hai lần chạy (vi mặc định + en): main() deep-merge fragment round58-o5 vào
// đúng object dict mà i18n/index.ts đang dùng (mẫu M4 — mô phỏng bước merge
// của parent) rồi mới assert nhãn qua module t().
//
// Test này khóa:
//  1. Fragment round58-o5.json: đúng 1 key captions.translatedTrack, vi/en
//     parity, placeholder {code} khớp, nội dung đúng từng chữ.
//  2. translatedTrackLabel: lookup fragment → nhãn theo locale; lookup trả
//     key/undefined (key chưa merge) → fallback VI "Phụ đề (EN)".
//  3. Module t() sau merge: nhãn tự theo locale, CaptionModal KHÔNG cần sửa
//     call-site (đợt này cố tình không đụng CaptionModal.tsx).
//  4. isCaptionTrackLabel: khớp cả hai tiền tố "Phụ đề"/"Subtitles", từ chối
//     "Subtitle" (thiếu s), "Phụ", "", undefined.
//  5. collectProjectCaptions: track "Subtitles (EN)" không captionOf vẫn được
//     xuất phụ đề (BUG ĐÃ SỬA — đỏ trước khi sửa, xem LIMITS); hồi quy track
//     VI vẫn xanh; track title không captionOf vẫn bị loại.
//  6. Hằng cũ không đổi: CAPTION_TRACK_LABEL_PREFIX vẫn "Phụ đề".
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { setLang } from "../i18n";
import viDict from "../i18n/vi.json";
import enDict from "../i18n/en.json";

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
  // +1: test pre-merge chạy inline trong main() trước deepMerge, ngoài queue.
  console.log(`O5 captions track round 58 [lang=${LANG}]: ${pass}/${queue.length + 1} pass`);
}

// --- Fragment của luồng này ----------------------------------------------
const FRAG = JSON.parse(
  readFileSync("apps/web/src/i18n/fragments/round58-o5.json", "utf8"),
) as { vi: Record<string, unknown>; en: Record<string, unknown> };

function flatten(o: unknown, prefix: string, out: Set<string>): void {
  const rec = o as Record<string, unknown>;
  for (const k of Object.keys(rec)) {
    const q = prefix ? `${prefix}.${k}` : k;
    if (typeof rec[k] === "object" && rec[k] !== null) flatten(rec[k], q, out);
    else out.add(q);
  }
}
function lookupAt(raw: Record<string, unknown>, key: string): string {
  let cur: unknown = raw;
  for (const part of key.split(".")) cur = (cur as Record<string, unknown>)[part];
  return cur as string;
}
/** Lookup dựng từ fragment thật (cùng ngữ nghĩa t(): {var} + key thiếu → key). */
function lookupFor(lang: "vi" | "en"): (key: string, vars?: Record<string, string>) => string {
  const dict = FRAG[lang];
  return (key: string, vars?: Record<string, string>) => {
    const raw = lookupAt(dict, key);
    if (typeof raw !== "string") return key;
    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (_, name: string) => vars[name] ?? `{${name}}`);
  };
}

ok("fragment: đúng 1 key, parity vi/en, {code} khớp, nội dung đúng từng chữ", () => {
  const viKeys = new Set<string>();
  const enKeys = new Set<string>();
  flatten(FRAG.vi, "", viKeys);
  flatten(FRAG.en, "", enKeys);
  assert.equal(viKeys.size, 1, `fragment vi phải có đúng 1 key, thực tế ${viKeys.size}`);
  assert.deepEqual([...enKeys].sort(), [...viKeys].sort(), "vi/en trong fragment phải cùng tập key");
  assert.deepEqual([...viKeys], ["captions.translatedTrack"]);
  assert.equal(lookupAt(FRAG.vi, "captions.translatedTrack"), "Phụ đề ({code})");
  assert.equal(lookupAt(FRAG.en, "captions.translatedTrack"), "Subtitles ({code})");
});

// --- Helper dựng track (mẫu d6.test.ts, rút gọn) --------------------------
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
  captionOf?: unknown;
}): Record<string, unknown> {
  const { captionOf, ...rest } = over;
  return {
    kind: "text",
    style: { ...STYLE },
    ...(captionOf !== undefined ? { captionOf } : {}),
    ...rest,
  };
}
function track(
  id: string,
  label: string | undefined,
  clips: Record<string, unknown>[],
): Record<string, unknown> {
  return { id, kind: "text", label, clips };
}

async function main(): Promise<void> {
  setLang(LANG);
  // Import ĐỘNG sau setLang (mẫu M4): captions.ts gọi t() tại thời điểm gọi
  // nên import trước/sau đều được, nhưng giữ cùng mẫu cho an toàn.
  const captions = await import("./captions");
  const subtitles = await import("./subtitles");

  // --- Post-merge: key đã có thật trong dict → nhãn theo locale --------
  // Đợt 59 P5: parent đã gộp fragment round58-o5 vào vi.json/en.json nên
  // "pre-merge" không còn tồn tại trong dict thật — khối này giờ khóa
  // hành vi SAU merge (giống assert của test P5 captionsExport59P5).
  // deepMerge bên dưới thành no-op với key này (giá trị đã giống hệt).
  try {
    assert.equal(
      captions.translatedTrackLabel("en"),
      VI ? "Phụ đề (EN)" : "Subtitles (EN)",
    );
    pass++;
    console.log("  ✓ post-merge: translatedTrackLabel('en') theo locale (key đã merge thật)");
  } catch (e) {
    console.error(`  ✗ post-merge: ${(e as Error).message}`);
    process.exitCode = 1;
  }

  // Mô phỏng bước merge của parent: deep-merge fragment vào đúng object dict
  // mà i18n/index.ts đang dùng (cùng module instance trong bundle).
  const deepMerge = (dst: Record<string, unknown>, src: Record<string, unknown>): void => {
    for (const [k, v] of Object.entries(src)) {
      if (v !== null && typeof v === "object" && !Array.isArray(v)) {
        const cur = dst[k];
        if (cur !== null && typeof cur === "object" && !Array.isArray(cur)) {
          deepMerge(cur as Record<string, unknown>, v as Record<string, unknown>);
          continue;
        }
        dst[k] = {};
        deepMerge(dst[k] as Record<string, unknown>, v as Record<string, unknown>);
      } else {
        dst[k] = v;
      }
    }
  };
  deepMerge(viDict as unknown as Record<string, unknown>, FRAG.vi);
  deepMerge(enDict as unknown as Record<string, unknown>, FRAG.en);

  ok("translatedTrackLabel: lookup fragment → nhãn theo locale, code upper", () => {
    assert.equal(captions.translatedTrackLabel("en", lookupFor("en")), "Subtitles (EN)");
    assert.equal(captions.translatedTrackLabel("en", lookupFor("vi")), "Phụ đề (EN)");
    assert.equal(captions.translatedTrackLabel("EN", lookupFor("en")), "Subtitles (EN)");
  });

  ok("translatedTrackLabel: lookup thiếu key/undefined → fallback VI", () => {
    const missingKey = (_k: string, _v?: Record<string, string>): string =>
      "captions.translatedTrack";
    assert.equal(captions.translatedTrackLabel("en", missingKey), "Phụ đề (EN)");
    const missingUndef = (_k: string, _v?: Record<string, string>): string =>
      undefined as unknown as string;
    assert.equal(captions.translatedTrackLabel("en", missingUndef), "Phụ đề (EN)");
  });

  ok("translatedTrackLabel: module t() sau merge tự theo locale", () => {
    assert.equal(
      captions.translatedTrackLabel("en"),
      VI ? "Phụ đề (EN)" : "Subtitles (EN)",
    );
  });

  ok("isCaptionTrackLabel: khớp cả hai tiền tố, từ chối gần đúng", () => {
    for (const label of [
      "Phụ đề",
      "Phụ đề 1",
      "Phụ đề (EN)",
      "Subtitles",
      "Subtitles (EN)",
      "Subtitles 1",
    ]) {
      assert.equal(subtitles.isCaptionTrackLabel(label), true, `${label} phải là caption track`);
    }
    for (const label of ["Title", "Tiêu đề", "Subtitle", "Phụ", "", undefined]) {
      assert.equal(
        subtitles.isCaptionTrackLabel(label),
        false,
        `${String(label)} không được là caption track`,
      );
    }
  });

  ok("hằng prefix cũ không đổi", () => {
    assert.equal(subtitles.CAPTION_TRACK_LABEL_PREFIX, "Phụ đề");
    assert.equal(subtitles.CAPTION_TRACK_LABEL_PREFIX_EN, "Subtitles");
  });

  ok("collectProjectCaptions: track 'Subtitles (EN)' không captionOf vẫn xuất (BUG ĐÃ SỬA)", () => {
    const tracks = [
      track("t1", "Subtitles (EN)", [
        capClip({ id: "c1", start: 1, duration: 2, text: "hello world" }),
        capClip({ id: "c2", start: 4, duration: 1.5, text: "second line" }),
      ]),
    ] as unknown as Parameters<typeof subtitles.collectProjectCaptions>[0];
    const { cues, trackLabels } = subtitles.collectProjectCaptions(tracks);
    assert.equal(cues.length, 2, `muốn 2 cue, nhận ${cues.length}`);
    assert.equal(cues[0].text, "hello world");
    assert.equal(cues[0].start, 1);
    assert.equal(cues[1].text, "second line");
    assert.deepEqual(trackLabels, ["Subtitles (EN)"]);
  });

  ok("collectProjectCaptions: hồi quy track VI 'Phụ đề (EN)' + 'Phụ đề 1' vẫn xuất", () => {
    const tracks = [
      track("t1", "Phụ đề (EN)", [
        capClip({ id: "c1", start: 5, duration: 2, text: "câu sau" }),
      ]),
      track("t2", "Phụ đề 1", [
        capClip({ id: "c2", start: 1, duration: 2, text: "câu trước" }),
      ]),
    ] as unknown as Parameters<typeof subtitles.collectProjectCaptions>[0];
    const { cues, trackLabels } = subtitles.collectProjectCaptions(tracks);
    assert.equal(cues.length, 2);
    assert.equal(cues[0].text, "câu trước", "sắp theo start");
    assert.equal(cues[1].text, "câu sau");
    assert.deepEqual(trackLabels, ["Phụ đề (EN)", "Phụ đề 1"]);
  });

  ok("collectProjectCaptions: track title không captionOf bị loại, có captionOf vẫn xuất", () => {
    const tracks = [
      track("t1", "Title", [
        capClip({ id: "c1", start: 0, duration: 3, text: "TIÊU ĐỀ PHIM" }),
      ]),
      track("t2", "Tiêu đề", [
        capClip({
          id: "c2",
          start: 4,
          duration: 2,
          text: "câu bám nguồn",
          captionOf: { clipId: "src", mediaStart: 4, mediaEnd: 6 },
        }),
      ]),
    ] as unknown as Parameters<typeof subtitles.collectProjectCaptions>[0];
    const { cues, trackLabels } = subtitles.collectProjectCaptions(tracks);
    assert.equal(cues.length, 1, "chỉ clip có captionOf được xuất");
    assert.equal(cues[0].text, "câu bám nguồn");
    assert.deepEqual(trackLabels, ["Tiêu đề"]);
  });

  ok("collectProjectCaptions: hỗn hợp EN + VI + title, cues gộp sắp theo start", () => {
    const tracks = [
      track("t1", "Subtitles (EN)", [
        capClip({ id: "c1", start: 6, duration: 1, text: "en late" }),
      ]),
      track("t2", "Phụ đề 1", [
        capClip({ id: "c2", start: 2, duration: 1, text: "vi early" }),
      ]),
      track("t3", "Title", [
        capClip({ id: "c3", start: 0, duration: 1, text: "NOISE" }),
      ]),
    ] as unknown as Parameters<typeof subtitles.collectProjectCaptions>[0];
    const { cues, trackLabels } = subtitles.collectProjectCaptions(tracks);
    assert.equal(cues.length, 2);
    assert.deepEqual(
      cues.map((c) => c.text),
      ["vi early", "en late"],
    );
    assert.deepEqual(trackLabels, ["Subtitles (EN)", "Phụ đề 1"]);
  });

  ok("collectProjectCaptions: round-trip SRT từ cues track EN giữ nguyên", () => {
    const tracks = [
      track("t1", "Subtitles (EN)", [
        capClip({ id: "c1", start: 0.5, duration: 1.5, text: "dòng một\ndòng hai" }),
        capClip({ id: "c2", start: 3, duration: 2, text: "câu hai" }),
      ]),
    ] as unknown as Parameters<typeof subtitles.collectProjectCaptions>[0];
    const { cues } = subtitles.collectProjectCaptions(tracks);
    const back = subtitles.parseSrt(subtitles.formatSrt(cues));
    assert.deepEqual(back.errors, []);
    assert.deepEqual(back.cues, cues);
  });

  runAll();
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
