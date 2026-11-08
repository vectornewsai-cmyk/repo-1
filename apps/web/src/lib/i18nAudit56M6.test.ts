// i18nAudit56M6.test.ts — Phase 9 đợt 56, luồng M6: audit 396 literal
// UNVERIFIED-lib của đợt 55 L2 (chưa xác minh sink).
//
// Chạy bằng esbuild bundle (mẫu L1/L2, chạy từ gốc repo; bundle ra scratch
// ngoài repo, KHÔNG ra dist). BẮT BUỘC --format=cjs vì react-dom/server
// dùng require động (mẫu L2; test này không render React nhưng giữ cùng
// lệnh cho đồng nhất):
//   ./node_modules/.bin/esbuild apps/web/src/lib/i18nAudit56M6.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/round56-m6/m6.test.cjs \
//     && node /tmp/round56-m6/m6.test.cjs
//
// Test này khóa:
//  1. Fragment round56-m6.json: đủ 15 key, vi/en parity, nội dung đúng
//     từng chữ, vi khác en (15 key nối trực tiếp 15 literal UI-visible
//     trong file không ai sở hữu).
//  2. Hành vi thật với lookup dựng từ fragment: 5 hàm lib trả chuỗi EN
//     khi có lookup, fallback VI từng chữ khi không có lookup.
//  3. Source: 5 file đã sửa dùng trKey() đúng key, không còn literal UI
//     hardcode ngoài fallback của trKey.
//  4. Phân loại toàn bộ 396 literal: đọc verdicts.json (trạng thái làm
//     việc của đợt, ../goals/... — KHÔNG nằm trong repo, không stage)
//     và khóa tổng + bảng theo file: UI-DIRECT 15, UI-PROPOSE 39,
//     WIRED-OWNER 84, NON-UI 256, ARTIFACT 2, UNVERIFIED 0.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import fragment from "../i18n/fragments/round56-m6.json";
import { summarizeDiff } from "./projectHistory";
import { collectProjectCaptions } from "./subtitles";
import { motionBadgeText, type MotionVisual } from "./previewEngine";
import { applyTemplateValues, type TemplateDef } from "./templateEngine";
import { resolvePackSpec } from "./templatePack";
import type { Track, VideoSpec } from "@repo-1/video-spec";

/** Khai báo tối thiểu để không cần @types/node (mẫu M7). */
declare const process: { exitCode: number | undefined };

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
  console.log(`M6 i18n audit round 56: ${pass}/${queue.length} pass`);
}

// --- Lookup dựng từ fragment thật (cùng ngữ nghĩa t(): {var} + key thiếu → key) ---
type Dict = Record<string, unknown>;
function flatten(o: unknown, prefix: string, out: Set<string>): void {
  const rec = o as Record<string, unknown>;
  for (const k of Object.keys(rec)) {
    const q = prefix ? `${prefix}.${k}` : k;
    if (typeof rec[k] === "object" && rec[k] !== null) flatten(rec[k], q, out);
    else out.add(q);
  }
}
function lookupAt(raw: Dict, key: string): string {
  let cur: unknown = raw;
  for (const part of key.split(".")) cur = (cur as Record<string, unknown>)[part];
  return cur as string;
}
function lookupFor(lang: "vi" | "en"): (key: string, vars?: Record<string, string>) => string {
  const dict = (fragment as unknown as Record<string, Dict>)[lang];
  return (key: string, vars?: Record<string, string>) => {
    const raw = lookupAt(dict, key);
    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (_, name: string) => vars[name] ?? `{${name}}`);
  };
}

const M6_KEYS = [
  "projectHistory.firstVersion",
  "projectHistory.renamed",
  "projectHistory.trackCount",
  "projectHistory.addedClips",
  "projectHistory.removedClips",
  "projectHistory.movedClips",
  "projectHistory.trimmedClips",
  "projectHistory.totalDuration",
  "projectHistory.noContentChange",
  "subtitles.untitledTrack",
  "preview.motionInterp",
  "templateEngine.missingValues",
  "templateEngine.invalidSpec",
  "templatePack.missingSampleMedia",
  "templatePack.audioPlaceholderUnsupported",
] as const;

const EXPECTED: Record<string, [string, string]> = {
  "projectHistory.firstVersion": ["Phiên bản đầu tiên của project.", "First version of the project."],
  "projectHistory.renamed": ['Đổi tên: "{old}" → "{new}"', 'Renamed: "{old}" → "{new}"'],
  "projectHistory.trackCount": ["Số track: {old} → {new}", "Track count: {old} → {new}"],
  "projectHistory.addedClips": ["Thêm {n} clip", "Added {n} clip(s)"],
  "projectHistory.removedClips": ["Xoá {n} clip", "Removed {n} clip(s)"],
  "projectHistory.movedClips": ["Di chuyển {n} clip", "Moved {n} clip(s)"],
  "projectHistory.trimmedClips": ["Cắt/xén {n} clip", "Trimmed {n} clip(s)"],
  "projectHistory.totalDuration": ["Tổng thời lượng: {old} → {new}", "Total duration: {old} → {new}"],
  "projectHistory.noContentChange": [
    "Không thay đổi nội dung (chỉ cập nhật metadata).",
    "No content change (metadata only).",
  ],
  "subtitles.untitledTrack": ["(không tên)", "(unnamed)"],
  "preview.motionInterp": ["NỘI SUY", "INTERP"],
  "templateEngine.missingValues": [
    "Template thiếu giá trị cho: {names}",
    "Template is missing values for: {names}",
  ],
  "templateEngine.invalidSpec": [
    "Spec sau khi áp template không hợp lệ.",
    "Spec is invalid after applying the template.",
  ],
  "templatePack.missingSampleMedia": [
    "Thiếu media mẫu cho placeholder: {id}",
    "Missing sample media for placeholder: {id}",
  ],
  "templatePack.audioPlaceholderUnsupported": [
    "Pack chưa hỗ trợ placeholder audio: {id}",
    "Pack does not support audio placeholders yet: {id}",
  ],
};

// --- 1. Fragment: parity + nội dung 15 key -------------------------------
ok("fragment round56-m6: vi/en parity, đủ 15 key, nội dung đúng từng chữ", () => {
  const viKeys = new Set<string>();
  const enKeys = new Set<string>();
  flatten((fragment as unknown as Record<string, Dict>).vi, "", viKeys);
  flatten((fragment as unknown as Record<string, Dict>).en, "", enKeys);
  assert.equal(viKeys.size, 15);
  assert.equal(enKeys.size, 15);
  for (const k of M6_KEYS) {
    assert.ok(viKeys.has(k), `vi thiếu key ${k}`);
    assert.ok(enKeys.has(k), `en thiếu key ${k}`);
    const [v, e] = EXPECTED[k];
    assert.equal(lookupAt((fragment as unknown as Record<string, Dict>).vi, k), v, `${k} vi`);
    assert.equal(lookupAt((fragment as unknown as Record<string, Dict>).en, k), e, `${k} en`);
    assert.notEqual(v, e, `${k}: vi phải khác en`);
  }
});

// --- Helpers: spec/track/template tối thiểu --------------------------------
function spec(name: string, clips: Array<{ id: string; start: number; duration: number }>): VideoSpec {
  return {
    version: "0.2.0",
    meta: { name, width: 1280, height: 720, fps: 30 },
    tracks: [
      {
        id: "v1",
        kind: "video",
        clips: clips.map((c) => ({
          id: c.id,
          kind: "video",
          src: "a.mp4",
          start: c.start,
          duration: c.duration,
          in: 0,
          out: c.duration,
        })),
      },
    ],
  } as unknown as VideoSpec;
}

function tplWith(
  placeholders: TemplateDef["template"]["placeholders"],
  spec: unknown,
): TemplateDef {
  return {
    template: {
      id: "t",
      name: "T",
      description: "",
      category: "",
      version: "1",
      author: "",
      license: "",
      tags: [],
      aspect: "16:9",
      durationSec: 5,
      placeholders,
    },
    spec: spec as VideoSpec,
  } as unknown as TemplateDef;
}

// --- 2. Hành vi thật: lookup EN vs fallback VI ----------------------------
ok("summarizeDiff: lookup EN dịch đủ 9 dòng, không lookup fallback VI", () => {
  const en = lookupFor("en");
  assert.deepEqual(summarizeDiff(null, spec("P", []), en), ["First version of the project."]);
  assert.deepEqual(summarizeDiff(null, spec("P", [])), ["Phiên bản đầu tiên của project."]);
  const oldS = spec("A", [{ id: "c1", start: 0, duration: 5 }]);
  const newS = spec("B", [
    { id: "c1", start: 1, duration: 6 },
    { id: "c2", start: 0, duration: 2 },
  ]);
  const out = summarizeDiff(oldS, newS, en);
  assert.ok(out.includes('Renamed: "A" → "B"'), `thiếu renamed EN: ${JSON.stringify(out)}`);
  assert.ok(out.includes("Track count: 1 → 1") === false, "track count không đổi thì không có dòng");
  assert.ok(out.includes("Added 1 clip(s)"), `thiếu added EN: ${JSON.stringify(out)}`);
  assert.ok(out.includes("Moved 1 clip(s)"), `thiếu moved EN: ${JSON.stringify(out)}`);
  assert.ok(out.includes("Trimmed 1 clip(s)"), `thiếu trimmed EN: ${JSON.stringify(out)}`);
  assert.ok(out.includes("Total duration: 5.0s → 7.0s"), `thiếu duration EN: ${JSON.stringify(out)}`);
  assert.ok(!out.some((s) => /[àáâãèéêìíòóôõùúýỳỹỷỵựửữừứưụủũợởỡờớơộồổỗơởỡợàảãạăắằẳẵặâấầẩẫậđèẻẽẹêếềểễệìỉĩịòỏõọôốồổỗộơớờởỡợùủũụưứừửữựỳỷỹỵ]/.test(s)), "EN lẫn tiếng Việt");
  const vi = summarizeDiff(oldS, newS);
  assert.ok(vi.includes('Đổi tên: "A" → "B"'), `thiếu renamed VI: ${JSON.stringify(vi)}`);
  assert.ok(vi.includes("Thêm 1 clip"), `thiếu added VI: ${JSON.stringify(vi)}`);
  const same = summarizeDiff(oldS, spec("A", [{ id: "c1", start: 0, duration: 5 }]), en);
  assert.deepEqual(same, ["No content change (metadata only)."]);
});

ok("collectProjectCaptions: lookup EN ra (unnamed), không lookup ra (không tên)", () => {
  const tracks = [
    {
      id: "t1",
      kind: "video",
      clips: [{ id: "c1", kind: "text", start: 0, duration: 1, text: "hello", captionOf: "v1" }],
    },
  ] as unknown as Track[];
  assert.deepEqual(collectProjectCaptions(tracks, lookupFor("en")).trackLabels, ["(unnamed)"]);
  assert.deepEqual(collectProjectCaptions(tracks).trackLabels, ["(không tên)"]);
});

ok("motionBadgeText: lookup EN ra INTERP, không lookup ra NỘI SUY, BLUR≈ giữ nguyên", () => {
  const interp = {
    interpolation: "minterpolate",
    targetFps: null,
    miMode: null,
    motionBlur: false,
    hasMotion: true,
    blurGhost: null,
  } as unknown as MotionVisual;
  const blur = { ...interp, interpolation: null, motionBlur: true } as unknown as MotionVisual;
  const none = { ...interp, interpolation: null, motionBlur: false } as unknown as MotionVisual;
  assert.equal(motionBadgeText(interp, lookupFor("en")), "INTERP");
  assert.equal(motionBadgeText(interp), "NỘI SUY");
  assert.equal(motionBadgeText(blur, lookupFor("en")), "BLUR≈");
  assert.equal(motionBadgeText(none, lookupFor("en")), "");
});

ok("applyTemplateValues: lookup EN dịch 2 lỗi, không lookup fallback VI", () => {
  const en = lookupFor("en");
  const ghost = tplWith([], {
    meta: { name: "P", width: 1280, height: 720, fps: 30 },
    tracks: [
      {
        id: "tr",
        kind: "video",
        clips: [{ id: "c", kind: "text", start: 0, duration: 1, text: "{{ghost}}" }],
      },
    ],
  });
  const r1 = applyTemplateValues(ghost, {}, en);
  assert.equal(r1.ok, false);
  if (!r1.ok) assert.equal(r1.error, "Template is missing values for: ghost");
  const r1vi = applyTemplateValues(ghost, {});
  assert.equal(r1vi.ok, false);
  if (!r1vi.ok) assert.equal(r1vi.error, "Template thiếu giá trị cho: ghost");
  const bad = tplWith([], {});
  const r2 = applyTemplateValues(bad, {}, en);
  assert.equal(r2.ok, false);
  if (!r2.ok) assert.equal(r2.error, "Spec is invalid after applying the template.");
  const r2vi = applyTemplateValues(bad, {});
  assert.equal(r2vi.ok, false);
  if (!r2vi.ok) assert.equal(r2vi.error, "Spec sau khi áp template không hợp lệ.");
});

ok("resolvePackSpec: lookup EN dịch 2 lỗi + truyền lookup xuống applyTemplateValues", () => {
  const en = lookupFor("en");
  const videoTpl = tplWith(
    [{ id: "v1", kind: "video", label: "V", default: "v.mp4" }],
    { meta: { name: "P", width: 1280, height: 720, fps: 30 }, tracks: [] },
  );
  const r1 = resolvePackSpec(videoTpl, {}, en);
  assert.equal(r1.ok, false);
  if (!r1.ok) assert.equal(r1.error, "Missing sample media for placeholder: v1");
  const r1vi = resolvePackSpec(videoTpl, {});
  assert.equal(r1vi.ok, false);
  if (!r1vi.ok) assert.equal(r1vi.error, "Thiếu media mẫu cho placeholder: v1");
  const audioTpl = tplWith(
    [{ id: "a1", kind: "audio", label: "A", default: "a.mp3" }],
    { meta: { name: "P", width: 1280, height: 720, fps: 30 }, tracks: [] },
  );
  const r2 = resolvePackSpec(audioTpl, {}, en);
  assert.equal(r2.ok, false);
  if (!r2.ok) assert.equal(r2.error, "Pack does not support audio placeholders yet: a1");
  // Lỗi từ applyTemplateValues (qua resolvePackSpec) cũng dịch: template
  // có marker {{ghost}} nhưng không placeholder nào khớp.
  const ghostTpl = tplWith(
    [{ id: "v1", kind: "video", label: "V", default: "v.mp4" }],
    {
      meta: { name: "P", width: 1280, height: 720, fps: 30 },
      tracks: [
        {
          id: "tr",
          kind: "video",
          clips: [{ id: "c", kind: "text", start: 0, duration: 1, text: "{{ghost}}" }],
        },
      ],
    },
  );
  const r3 = resolvePackSpec(ghostTpl, { v1: "v.mp4" }, en);
  assert.equal(r3.ok, false);
  if (!r3.ok) assert.equal(r3.error, "Template is missing values for: ghost");
});

// --- 3. Source: 5 file dùng trKey() đúng key ------------------------------
function readSrc(rel: string): string {
  return readFileSync(`apps/web/src/${rel}`, "utf8");
}

ok("source: 5 file đã sửa dùng trKey() đúng key + export I18nLookup", () => {
  const checks: Array<[string, string[]]> = [
    [
      "lib/projectHistory.ts",
      [
        'trKey(lookup, "projectHistory.firstVersion"',
        'trKey(lookup, "projectHistory.renamed"',
        'trKey(lookup, "projectHistory.trackCount"',
        'trKey(lookup, "projectHistory.addedClips"',
        'trKey(lookup, "projectHistory.removedClips"',
        'trKey(lookup, "projectHistory.movedClips"',
        'trKey(lookup, "projectHistory.trimmedClips"',
        'trKey(lookup, "projectHistory.totalDuration"',
        'trKey(lookup, "projectHistory.noContentChange"',
      ],
    ],
    ["lib/subtitles.ts", ['trKey(lookup, "subtitles.untitledTrack"']],
    ["lib/previewEngine.ts", ['trKey(lookup, "preview.motionInterp"']],
    [
      "lib/templateEngine.ts",
      ['trKey(lookup, "templateEngine.missingValues"', 'trKey(lookup, "templateEngine.invalidSpec"'],
    ],
    [
      "lib/templatePack.ts",
      [
        'trKey(lookup, "templatePack.missingSampleMedia"',
        'trKey(lookup, "templatePack.audioPlaceholderUnsupported"',
      ],
    ],
  ];
  for (const [rel, keys] of checks) {
    const src = readSrc(rel).replace(/\s+/g, " ").replace(/\(\s+/g, "(");
    assert.ok(src.includes("export type I18nLookup"), `${rel} phải export I18nLookup`);
    assert.ok(src.includes("lookup?: I18nLookup"), `${rel} phải có tham số lookup tùy chọn`);
    for (const k of keys) assert.ok(src.includes(k), `${rel} phải gọi ${k}`);
  }
  // Không file nào import ../i18n trực tiếp (giữ tương thích Node
  // type-stripping như M5): lookup chỉ đi qua tham số.
  for (const rel of ["lib/projectHistory.ts", "lib/subtitles.ts", "lib/previewEngine.ts", "lib/templateEngine.ts", "lib/templatePack.ts"]) {
    const src = readSrc(rel);
    assert.ok(!src.includes('from "../i18n"') && !src.includes("from './i18n'"), `${rel} không được import ../i18n trực tiếp`);
  }
});

// --- 4. Phân loại 396 literal: khóa tổng + bảng theo file -----------------
ok("classification: verdicts.json tổng 396, 0 UNVERIFIED", () => {
  const v = JSON.parse(
    readFileSync(
      "../goals/capcut-clone-video-editor/hidden_files/round56-m6/verdicts.json",
      "utf8",
    ),
  ) as {
    summary: Record<string, number>;
    by_file: Record<string, Record<string, number>>;
  };
  const total = Object.values(v.summary).reduce((a, b) => a + b, 0);
  assert.equal(total, 396);
  assert.equal(v.summary["UI-DIRECT"], 15);
  assert.equal(v.summary["UI-PROPOSE"], 39);
  assert.equal(v.summary["WIRED-OWNER"], 84);
  assert.equal(v.summary["NON-UI"], 256);
  assert.equal(v.summary["ARTIFACT"], 2);
  assert.equal(v.summary["UNVERIFIED"] ?? 0, 0);
  const expectedByFile: Record<string, Record<string, number>> = {
    "components/nested/nestUtils.ts": { "NON-UI": 55, ARTIFACT: 2 },
    "lib/cpuGate39T6.ts": { "NON-UI": 6 },
    "lib/cpuGateNodeDiag40V6.ts": { "NON-UI": 14 },
    "lib/curveFix.ts": { "WIRED-OWNER": 30, "NON-UI": 4 },
    "lib/discardRestore35R6.ts": { "NON-UI": 14 },
    "lib/gopRangeFetch39T3.ts": { "NON-UI": 23 },
    "lib/nestedPreview.ts": { "WIRED-OWNER": 38, "NON-UI": 12 },
    "lib/previewEngine.ts": { "UI-DIRECT": 1 },
    "lib/projectHistory.ts": { "UI-DIRECT": 9 },
    "lib/projectRepo.ts": { "WIRED-OWNER": 10, "UI-PROPOSE": 35 },
    "lib/reversePreviewGate.ts": { "UI-PROPOSE": 4 },
    "lib/reverseRangeGate38U2.ts": { "NON-UI": 7 },
    "lib/reverseWebcodecs.ts": { "NON-UI": 2 },
    "lib/settle45A1.ts": { "NON-UI": 28 },
    "lib/settle46B1.ts": { "NON-UI": 19 },
    "lib/settle47C2.ts": { "NON-UI": 15 },
    "lib/settle48D2.ts": { "NON-UI": 27 },
    "lib/settle49E3Early.ts": { "NON-UI": 13 },
    "lib/settleAsset44Z1.ts": { "NON-UI": 12 },
    "lib/subtitles.ts": { "NON-UI": 1, "UI-DIRECT": 1 },
    "lib/syncProtocol.ts": { "NON-UI": 4 },
    "lib/templateEngine.ts": { "UI-DIRECT": 2 },
    "lib/templatePack.ts": { "UI-DIRECT": 2 },
    "lib/twoLevelCurve.ts": { "WIRED-OWNER": 6 },
  };
  for (const [f, counts] of Object.entries(expectedByFile)) {
    assert.deepEqual(v.by_file[f], counts, `bảng phân loại sai ở ${f}`);
  }
});

runAll();
