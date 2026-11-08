// i18nOrphans60Q4.test.ts — Phase 9 đợt 60, luồng Q4: dọn 41 key i18n mồ
// côi (đợt 59 P7) + wiring 26 key diagnostic GOP/loadReport (fragment P7).
//
// Quyết định (xem docs/PHASE9_ROUND60_Q4_I18N_ORPHANS_LIMITS.md):
//   - 28 key projectRepo.* CHẾT được NỐI THẬT (không xóa): validateSpecDeep
//     + sanitizeKeyframeArrays + parseProjectText nhận thêm lookup tùy
//     chọn, lỗi/fix đi qua dict cả vi+en (fallback VI cũ khi không lookup).
//   - 13 key lẻ (common.apply/loading, adjustment.* ×5,
//     nestedBoundary.title, loadReport.fix, nativeFiles.* ×3, pack.back)
//     XÓA khỏi dict (0 code đọc, đã xác minh từng key — xem LIMITS §2),
//     CỘNG 1 key mồ côi thứ 42 lộ ra sau P7: enhance.renderOnly (chỉ
//     còn test M3 tham chiếu; EnhancePanel đã bỏ chỗ dùng từ P8 — M3
//     hiện đỏ sẵn 7/13 vì lý do này + stale pre-merge, xem LIMITS §2).
//   - 26 key fragment P7 (gop.* ×25 + loadReport.badCase) được NỐI THẬT
//     vào gopRangeFetch39T3.ts / gopTrialDecode55L8.ts / loadReport.ts rồi
//     GỘP vào dict (vi==en, placeholder khớp).
//   - Số key sau đợt: 1957 − 14 xóa + 26 gộp = 1969 mỗi bên; 0 key mồ côi.
//   - M5 cập nhật 1 assertion (lookup en: inner keyframeFix nay dịch
//     thật sang EN thay vì kẹt VI trong wrapper EN — xem LIMITS §4).
//
// Cách chạy (mẫu P7, từ gốc repo; bundle ra scratch ngoài repo):
//   ./node_modules/.bin/esbuild apps/web/src/lib/i18nOrphans60Q4.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/round60-q4/q4.test.cjs \
//     && node /tmp/round60-q4/q4.test.cjs
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { parseProjectText, sanitizeKeyframeArrays, validateSpecDeep } from "./projectRepo";
import { runTrialDecode } from "./gopTrialDecode55L8";
import {
  fetchSampleRemainderChunked,
  fetchVideoTrackByGopRange,
  type GopRangeFetchFn,
  type GopRangeOutcome,
  type GopRangeResponse,
} from "./gopRangeFetch39T3";
import { formatStructuredNote } from "./loadReport";

/** Khai báo tối thiểu để không cần @types/node (mẫu M5). */
declare const process: { exitCode: number | undefined };

let pass = 0;
const queue: Array<{ name: string; fn: () => void | Promise<void> }> = [];
function ok(name: string, fn: () => void | Promise<void>): void {
  queue.push({ name, fn });
}
async function runAll(): Promise<void> {
  for (const t of queue) {
    try {
      await t.fn();
      pass++;
      console.log(`  ✓ ${t.name}`);
    } catch (e) {
      console.error(`  ✗ ${t.name}: ${(e as Error).message}`);
      process.exitCode = 1;
    }
  }
  console.log(`Q4 i18n orphans round 60: ${pass}/${queue.length} pass`);
}

// --- Dict thật ----------------------------------------------------------
type Dict = Record<string, unknown>;
function readJson(rel: string): Dict {
  return JSON.parse(readFileSync(rel, "utf8")) as Dict;
}
function flatten(d: Dict, prefix = "", out = new Map<string, string>()): Map<string, string> {
  for (const k of Object.keys(d)) {
    const q = prefix ? `${prefix}.${k}` : k;
    const v = d[k];
    if (typeof v === "object" && v !== null) flatten(v as Dict, q, out);
    else out.set(q, v as string);
  }
  return out;
}
const VI = flatten(readJson("apps/web/src/i18n/vi.json"));
const EN = flatten(readJson("apps/web/src/i18n/en.json"));
function placeholders(s: string): string[] {
  return [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
}
function lookupFor(lang: "vi" | "en") {
  const dict = lang === "vi" ? VI : EN;
  return (key: string, vars?: Record<string, string>): string => {
    const raw = dict.get(key) ?? key;
    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (_, name: string) => vars[name] ?? `{${name}}`);
  };
}
const lookupVi = lookupFor("vi");
const lookupEn = lookupFor("en");

// 14 key lẻ đã XÓA khỏi dict (0 code đọc — xem LIMITS §2).
const DELETED_14 = [
  "adjustment.addFail",
  "adjustment.listTitle",
  "adjustment.saveOk",
  "adjustment.saveFail",
  "adjustment.scopeSingleBlocked",
  "common.apply",
  "common.loading",
  "enhance.renderOnly",
  "loadReport.fix",
  "nativeFiles.readError",
  "nativeFiles.saveDone",
  "nativeFiles.writeError",
  "nestedBoundary.title",
  "pack.back",
];
// 28 key projectRepo.* đã NỐI THẬT (không còn mồ côi).
const WIRED_28 = [
  "projectRepo.validateNotObject",
  "projectRepo.validateMissingId",
  "projectRepo.validateStartRange",
  "projectRepo.validateDurationPositive",
  "projectRepo.validateMissingSrc",
  "projectRepo.validateMissingIn",
  "projectRepo.validateMissingOut",
  "projectRepo.validateMissingText",
  "projectRepo.validateSpeedRange",
  "projectRepo.validateTrimInvalid",
  "projectRepo.validateMissingSubSpec",
  "projectRepo.validateKindUnsupported",
  "projectRepo.validateNotVideoSpec",
  "projectRepo.validateSubSpecCycle",
  "projectRepo.validateMetaName",
  "projectRepo.validateMetaWidth",
  "projectRepo.validateMetaHeight",
  "projectRepo.validateMetaFps",
  "projectRepo.validateTracksArray",
  "projectRepo.validateClipsArray",
  "projectRepo.keyframeFixNotObject",
  "projectRepo.keyframeFixNotArray",
  "projectRepo.keyframeFixEmptyAfterDrop",
  "projectRepo.keyframeFixDroppedEntries",
  "projectRepo.keyframeFixEasingNormalized",
  "projectRepo.keyframeFixKept",
  "projectRepo.invalidJson",
  "projectRepo.untitledProject",
];
// 26 key fragment P7 đã NỐI + GỘP (25 gop.* + 1 loadReport.badCase).
const FRAGMENT_26 = [
  "gop.demux.avccReadFailed",
  "gop.demux.badLayout",
  "gop.demux.badStts",
  "gop.demux.cttsStszMismatch",
  "gop.demux.notAvcc",
  "gop.demux.sampleOutOfFile",
  "gop.demux.sampleOutsideMdat",
  "gop.demux.stssOutOfRange",
  "gop.demux.trialDecodeFailed",
  "gop.range.fetchParamsInvalid",
  "gop.range.fetchUrlInvalid",
  "gop.range.gopOutOfFile",
  "gop.range.gopSampleOutOfRange",
  "gop.range.moovOutOfFile",
  "gop.range.moovTooLarge",
  "gop.range.prefixShortBody",
  "gop.range.prefixStatusNot206",
  "gop.range.sampleChunkLimit",
  "gop.range.sampleRemainderInvalid",
  "gop.range.shortBody",
  "gop.range.statusNot206",
  "gop.trial.decodeFailed",
  "gop.trial.noDecoder",
  "gop.trial.timeout",
  "gop.trial.unsupportedConfig",
  "loadReport.badCase",
];

// --- A. Dict -------------------------------------------------------------
ok("dict: vi==en==2326 key lá (2146 sau đợt 62 + 131 key fragment đợt 63 − 1 key chết speed.warnTooShort − 1 key jobNote chưa có UI + 7 key fragment đợt 64 (R2 6 + R8 1) + 1 key parent projectHistory + 14 key fragment đợt 65 (S2 1 + S4 10 + S6 1 + S8 2) + 29 key fragment đợt 66 (T7 27 + T8 2)), placeholder khớp, không rỗng", () => {
  assert.equal(VI.size, 2326, `vi.json phải có 2326 key lá, nhận ${VI.size}`);
  assert.equal(EN.size, 2326, `en.json phải có 2326 key lá, nhận ${EN.size}`);
  for (const k of VI.keys()) assert.ok(EN.has(k), `en thiếu key ${k}`);
  for (const k of EN.keys()) assert.ok(VI.has(k), `vi thiếu key ${k}`);
  for (const k of VI.keys()) {
    const v = VI.get(k)!;
    const e = EN.get(k)!;
    assert.ok(v.length > 0, `${k}: vi rỗng`);
    assert.ok(e.length > 0, `${k}: en rỗng`);
    assert.deepEqual(placeholders(v), placeholders(e), `${k}: placeholder vi/en lệch`);
  }
  // 52 key vi==en (+1 mẫu định dạng validation.detail từ fragment R5 đợt 63; 14 key xóa + 26 key gộp đều vi khác en; +2 mẫu
  // định dạng gop.cache.belowThreshold / gop.cache.rangeOk từ fragment R6,
  // parent gộp đợt 61; +1 key legacyAdopt.noHash từ fragment T7, parent gộp đợt 66).
  const same = [...VI.keys()].filter((k) => VI.get(k) === EN.get(k));
  assert.equal(same.length, 52, `số key vi==en phải là 52, nhận ${same.length}: ${same.slice(0, 5).join(", ")}`);
});

ok("dict: 14 key lẻ đã xóa khỏi cả hai bên; 28 key projectRepo.* còn đủ", () => {
  for (const k of DELETED_14) {
    assert.ok(!VI.has(k), `vi.json vẫn còn key đã xóa ${k}`);
    assert.ok(!EN.has(k), `en.json vẫn còn key đã xóa ${k}`);
  }
  for (const k of WIRED_28) {
    assert.ok(VI.has(k), `vi.json thiếu key đã nối ${k}`);
    assert.ok(EN.has(k), `en.json thiếu key đã nối ${k}`);
    assert.notEqual(VI.get(k), EN.get(k), `${k}: vi phải khác en`);
  }
});

ok("fragment P7: 26 key đã gộp vào dict đúng từng chữ fragment, vi khác en", () => {
  const frag = readJson(
    "../goals/capcut-clone-video-editor/hidden_files/round59-p7-fragment.json",
  ) as { vi: Dict; en: Dict };
  const fVi = flatten(frag.vi);
  const fEn = flatten(frag.en);
  assert.equal(fVi.size, 26, `fragment P7 vi phải có 26 key, nhận ${fVi.size}`);
  assert.equal(fEn.size, 26, `fragment P7 en phải có 26 key, nhận ${fEn.size}`);
  assert.deepEqual([...fVi.keys()].sort(), [...FRAGMENT_26].sort(), "fragment P7 phải đúng 26 key");
  for (const k of FRAGMENT_26) {
    assert.equal(VI.get(k), fVi.get(k), `vi.json lệch giá trị fragment ở ${k}`);
    assert.equal(EN.get(k), fEn.get(k), `en.json lệch giá trị fragment ở ${k}`);
    assert.notEqual(fVi.get(k), fEn.get(k), `${k}: vi phải khác en`);
  }
});

ok("orphan: 0 key mồ côi sau đợt (42 key P7 + enhance.renderOnly đã nối/xóa hết)", () => {
  let srcAll = "";
  const collect = (dir: string, acc: string[]): void => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = `${dir}/${e.name}`;
      if (e.isDirectory()) {
        if (["node_modules", "dist", "dist-web", "release"].includes(e.name)) continue;
        collect(p, acc);
      } else if (/\.(ts|tsx|js|jsx|mjs)$/.test(e.name) && !/\.test\.(ts|js)$/.test(e.name)) {
        acc.push(p);
      }
    }
  };
  const files: string[] = [];
  collect("apps/web/src", files);
  for (const f of files) srcAll += readFileSync(f, "utf8") + "\n";
  for (const f of readdirSync("apps/web/src/i18n/fragments")) {
    srcAll += readFileSync(`apps/web/src/i18n/fragments/${f}`, "utf8") + "\n";
  }
  const DYNAMIC_PREFIXES = [
    "transition.opt.",
    "textanim.opt.",
    "errorDetail.summary.",
    "structuredNotes.",
    // Đợt 62 R5: 91 key bridgeErrors.* truy cập động qua `bridgeErrors.${code}`
    // trong lib/bridgeErrors.ts:168 (mã lỗi server) — scan chuỗi tĩnh không thấy.
    "bridgeErrors.",
    // Đợt 63 R5: 108 key validation.* truy cập động qua `validation.${code}`
    // trong lib/validationErrors.ts (mã lỗi validator spec/media) — scan
    // chuỗi tĩnh không thấy. Đã gộp vào dict lúc parent gộp đợt 63.
    "validation.",
    // Đợt 63 R1/R5: caption.phase.* / scene.phase.* đọc bảng fragment trực
    // tiếp (captionPhase63R1.ts / scenePhase63R5.ts, key theo phase lúc
    // chạy) nên chuỗi key đầy đủ không xuất hiện trong src — scan tĩnh
    // không thấy (R5 từng cho rằng scene.phase "không cần prefix" là sai;
    // test đỏ đã chứng minh).
    "caption.phase.",
    "scene.phase.",
    // Đợt 64 R8: jobNote.* đọc bảng fragment trực tiếp (jobNote64R8.ts,
    // key theo noteCode lúc chạy) nên chuỗi key đầy đủ không xuất hiện
    // trong src — scan tĩnh không thấy. Key vào dict khi parent gộp
    // fragment round64-r8 (đợt 63 §6.7).
    // Đợt 63 R9: desktop.preloadIpcNotBytes dùng trong apps/desktop/src/
    // preload.ts (preload sandbox, chuỗi inline, khóa bằng test preload63R9
    // với fragment) — ngoài phạm vi quét apps/web/src của test này.
    "desktop.preloadIpcNotBytes",
    // Đợt 64 R2: enhance.fastMotion* đọc bảng fragment trực tiếp
    // (fastMotion.ts fastMotionStrings(), key trần fastMotionWarning /
    // fastMotionUnknown / fastMotionMeasuring / fastMotionLevel* — tiền tố
    // enhance. chỉ có trong fragment/dict, không xuất hiện trong src).
    // Key vào dict khi parent gộp fragment round64-r2.
    "enhance.fastMotion",
  ];
  const orphans: string[] = [];
  for (const k of VI.keys()) {
    if (srcAll.includes(`"${k}"`) || srcAll.includes(`'${k}'`) || srcAll.includes(`\`${k}\``)) continue;
    if (DYNAMIC_PREFIXES.some((p) => k.startsWith(p))) continue;
    orphans.push(k);
  }
  assert.deepEqual(orphans, [], `còn key mồ côi: ${orphans.join(", ")}`);
});

// --- Fixture spec (mẫu projectRepoNested22) ------------------------------
function videoClip(id: string, start = 0, duration = 2, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return { kind: "video", id, src: "a.mp4", start, duration, in: 0, out: 2, ...extra };
}
function specWith(clips: unknown[], metaExtra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    version: "0.2.0",
    meta: { name: "test", width: 640, height: 360, fps: 30, ...metaExtra },
    tracks: [{ id: "v", kind: "video", clips }],
  };
}
function nestedClip(id: string, sub: unknown, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return { kind: "nested", id, start: 0, duration: 2, trim: { in: 0, out: 2 }, subSpec: sub, ...extra };
}
function errsEn(spec: unknown): string[] {
  return validateSpecDeep(spec, new Set(), { lookup: lookupEn });
}
function errsVi(spec: unknown): string[] {
  return validateSpecDeep(spec, new Set(), { lookup: lookupVi });
}
function errsNoLookup(spec: unknown): string[] {
  return validateSpecDeep(spec);
}

// --- B. validateSpecDeep qua dict ---------------------------------------
ok("validate EN: 20 lỗi validate đi qua dict (đường dẫn + fragment EN)", () => {
  const cases: Array<[unknown, string]> = [
    [specWith([null]), "tracks[0].clips[0]: must be an object."],
    [specWith([{ kind: "video", src: "a.mp4", start: 0, duration: 2, in: 0, out: 2 }]), "tracks[0].clips[0]: missing id."],
    [specWith([videoClip("a", -1)]), "tracks[0].clips[0]: start must be a number ≥ 0."],
    [specWith([videoClip("a", 0, 0)]), "tracks[0].clips[0]: duration must be a number > 0."],
    [specWith([{ kind: "video", id: "a", start: 0, duration: 2, in: 0, out: 2 }]), "tracks[0].clips[0]: missing src."],
    [specWith([{ kind: "video", id: "a", src: "a.mp4", start: 0, duration: 2, out: 2 }]), "tracks[0].clips[0]: missing in (source in-point)."],
    [specWith([{ kind: "video", id: "a", src: "a.mp4", start: 0, duration: 2, in: 0 }]), "tracks[0].clips[0]: missing out (source out-point)."],
    [specWith([{ kind: "text", id: "a", start: 0, duration: 2 }]), "tracks[0].clips[0]: missing text."],
    [specWith([nestedClip("n", specWith([videoClip("x")]), { speed: 9 })]), "tracks[0].clips[0]: speed must be within [0.25, 4]."],
    [specWith([nestedClip("n", specWith([videoClip("x")]), { trim: { in: 2, out: 2 } })]), "tracks[0].clips[0]: trim is invalid (needs in < out)."],
    [specWith([{ kind: "nested", id: "n", start: 0, duration: 2 }]), "tracks[0].clips[0]: missing subSpec."],
    [specWith([videoClip("a", 0, 2, { kind: "weird" })]), 'tracks[0].clips[0]: unsupported kind: "weird".'],
    [{ version: "9.9.9" }, 'Not a valid video spec (version="9.9.9", app supports 0.2.0). The file may be corrupt or use an unsupported schema version.'],
    [specWith([videoClip("a")], { name: "" }), "meta.name must be a non-empty string."],
    [specWith([videoClip("a")], { width: 0 }), "meta.width must be a number > 0."],
    [specWith([videoClip("a")], { height: -1 }), "meta.height must be a number > 0."],
    [specWith([videoClip("a")], { fps: 0 }), "meta.fps must be a number > 0."],
    [{ version: "0.2.0", meta: { name: "t", width: 1, height: 1, fps: 1 }, tracks: [{ id: "v", kind: "video" }] }, "tracks[0]: clips must be an array."],
    // tracks không phải mảng thì isVideoSpec đã chặn trước (validateNotVideoSpec),
    // nên validateTracksArray là nhánh phòng thủ không chạm tới được qua API
    // công khai — vẫn nối key để nhất quán, xem LIMITS §1.
    [{ version: "0.2.0", meta: { name: "t", width: 1, height: 1, fps: 1 }, tracks: {} }, 'Not a valid video spec (version="0.2.0", app supports 0.2.0). The file may be corrupt or use an unsupported schema version.'],
  ];
  for (const [spec, expected] of cases) {
    const got = errsEn(spec);
    assert.ok(got.includes(expected), `thiếu lỗi EN "${expected}", nhận ${JSON.stringify(got)}`);
  }
  // Vòng lặp qua subSpec: lookup chảy xuống đệ quy, lỗi lá vẫn dịch.
  const innerBad = specWith([{ kind: "video", id: "bad", start: 0, duration: 2, in: 0, out: 2 }]);
  const outer = specWith([nestedClip("n1", innerBad)]);
  const sub = errsEn(outer);
  assert.ok(
    sub.some((e) => e.includes("subSpec:") && e.includes("missing src.")),
    `lỗi subSpec phải dịch EN, nhận ${JSON.stringify(sub)}`,
  );
  // Vòng lặp cycle qua lookup EN.
  const cycOuter = specWith([]) as Record<string, unknown>;
  const cycInner = specWith([nestedClip("n-cycle", cycOuter)]);
  (cycOuter["tracks"] as Record<string, unknown>[])[0]["clips"] = [nestedClip("n1", cycInner)];
  assert.ok(
    errsEn(cycOuter).some((e) => e.includes("subSpec creates a cycle")),
    `cycle phải dịch EN, nhận ${JSON.stringify(errsEn(cycOuter))}`,
  );
});

ok("validate VI: lookup vi + không lookup đều bằng đúng fallback VI cũ", () => {
  const bads: unknown[] = [
    specWith([null]),
    specWith([videoClip("a", -1)]),
    specWith([{ kind: "text", id: "a", start: 0, duration: 2 }]),
    specWith([nestedClip("n", specWith([videoClip("x")]), { speed: 9 })]),
    specWith([videoClip("a", 0, 2, { kind: "weird" })]),
    { version: "9.9.9" },
    specWith([videoClip("a")], { name: "" }),
    { version: "0.2.0", meta: { name: "t", width: 1, height: 1, fps: 1 }, tracks: {} },
  ];
  for (const spec of bads) {
    assert.deepEqual(errsVi(spec), errsNoLookup(spec), `lookup vi phải bằng fallback: ${JSON.stringify(errsNoLookup(spec))}`);
    assert.ok(errsNoLookup(spec).length > 0, "spec hỏng phải có lỗi");
  }
  assert.deepEqual(errsEn(specWith([videoClip("ok")])), [], "spec lành phải 0 lỗi cả EN");
  assert.deepEqual(errsNoLookup(specWith([videoClip("ok")])), [], "spec lành phải 0 lỗi không lookup");
});

ok("parseProjectText EN: invalidJson + untitledProject đi qua dict", () => {
  const bad = parseProjectText("{không phải json", lookupEn);
  assert.equal(bad.ok, false);
  assert.deepEqual(bad.errors, ["File is not valid JSON."]);
  const badVi = parseProjectText("{không phải json", lookupVi);
  assert.deepEqual(badVi.errors, ["File không phải JSON hợp lệ."]);
  const badNo = parseProjectText("{không phải json");
  assert.deepEqual(badNo.errors, ["File không phải JSON hợp lệ."]);
  // Envelope không tên → name dịch EN; VI/không lookup giữ "Dự án không tên".
  const env = JSON.stringify({
    format: "vcut-project",
    formatVersion: 1,
    spec: specWith([videoClip("a")]),
  });
  assert.equal(parseProjectText(env, lookupEn).name, "Untitled project");
  assert.equal(parseProjectText(env, lookupVi).name, "Dự án không tên");
  assert.equal(parseProjectText(env).name, "Dự án không tên");
});

// --- C. sanitizeKeyframeArrays qua dict ----------------------------------
function audioSpecWith(volumeKeyframes: unknown): Record<string, unknown> {
  return specWith([
    {
      kind: "audio", id: "a1", src: "a.mp3", start: 0, duration: 4, in: 0, out: 4, volume: 0.5,
      volumeKeyframes,
    },
  ]) as Record<string, unknown>;
}
ok("keyframeFix EN: 4 dạng fix đi qua dict (notObject/notArray/empty/kept)", () => {
  const W = 'tracks[0].clips[0] (clip "a1").volumeKeyframes';
  assert.deepEqual(
    sanitizeKeyframeArrays(audioSpecWith("x") as never, lookupEn),
    [`${W}: keyframes is not an object { keyframes: [...] } — field removed.`],
  );
  assert.deepEqual(
    sanitizeKeyframeArrays(audioSpecWith({ keyframes: "x" }) as never, lookupEn),
    [`${W}.keyframes is not an array — field removed.`],
  );
  assert.deepEqual(
    sanitizeKeyframeArrays(audioSpecWith({ keyframes: [null, null] }) as never, lookupEn),
    [`${W}.keyframes is empty after dropping 2 invalid entries — field removed.`],
  );
  assert.deepEqual(
    sanitizeKeyframeArrays(
      audioSpecWith({ keyframes: [{ t: 0, v: 1, easing: "weird" }, null, { t: 1, v: 0.5, easing: "linear" }] }) as never,
      lookupEn,
    ),
    [
      `${W}.keyframes: dropped 1 invalid entries (null/invalid), normalized 1 unknown easings to linear — kept 2/3 entries.`,
    ],
  );
});

ok("keyframeFix VI: lookup vi + không lookup bằng đúng chuỗi VI cũ", () => {
  const W = 'tracks[0].clips[0] (clip "a1").volumeKeyframes';
  const cases: Array<[unknown, string[]]> = [
    ["x", [`${W}: keyframes không phải object { keyframes: [...] } — đã xóa field.`]],
    [{ keyframes: "x" }, [`${W}.keyframes không phải mảng — đã xóa field.`]],
    [{ keyframes: [null, null] }, [`${W}.keyframes rỗng sau khi loại 2 entry lỗi — đã xóa field.`]],
  ];
  for (const [kv, expected] of cases) {
    assert.deepEqual(sanitizeKeyframeArrays(audioSpecWith(kv) as never, lookupVi), expected);
    assert.deepEqual(sanitizeKeyframeArrays(audioSpecWith(kv) as never), expected);
  }
});

// --- D. GOP trial-decode + range qua dict --------------------------------
const TRIAL_CONFIG = {
  codec: "avc1.64001F",
  codedWidth: 320,
  codedHeight: 240,
  description: new Uint8Array([0]),
};
ok("trial EN: 4 lý do trial-decode đi qua dict", async () => {
  const sample = new Uint8Array([0, 0, 0, 1]);
  assert.equal(
    (await runTrialDecode(null, sample, TRIAL_CONFIG, 200, lookupEn)).reason,
    "no-decoder: no trial-decode probe",
  );
  assert.equal(
    (await runTrialDecode(async () => false, sample, TRIAL_CONFIG, 200, lookupEn)).reason,
    "decode-failed: VideoDecoder could not decode sample 0",
  );
  assert.equal(
    (await runTrialDecode(async () => "unsupported-config", sample, TRIAL_CONFIG, 200, lookupEn)).reason,
    "unsupported-config: decoder does not support this codec/profile — skipping (fail-open)",
  );
  assert.equal(
    (await runTrialDecode(() => new Promise<never>(() => {}), sample, TRIAL_CONFIG, 5, lookupEn)).reason,
    "timeout-5ms: trial-decode did not finish, skipping (fail-open)",
  );
});

ok("trial VI: không lookup giữ đúng chuỗi VI cũ", async () => {
  const sample = new Uint8Array([0, 0, 0, 1]);
  assert.equal(
    (await runTrialDecode(null, sample, TRIAL_CONFIG)).reason,
    "no-decoder: không có probe trial-decode",
  );
  assert.equal(
    (await runTrialDecode(async () => false, sample, TRIAL_CONFIG)).reason,
    "decode-failed: VideoDecoder không decode được sample 0",
  );
});

// Stub fetch: total 100000; HEAD 200; probe 206 khớp; prefix theo chế độ.
function stubFetch(mode: "probe404" | "probeShort" | "prefix404" | "prefixShort"): GopRangeFetchFn {
  return async (_url: string, init?: { method?: string; headers?: Record<string, string> }): Promise<GopRangeResponse> => {
    if (init?.method === "HEAD") {
      return {
        status: 200,
        headers: { get: (n: string) => (n.toLowerCase() === "content-length" ? "100000" : null) },
        arrayBuffer: async () => new ArrayBuffer(0),
      };
    }
    const range = init?.headers?.["Range"] ?? "";
    const m = /^bytes=(\d+)-(\d+)$/.exec(range);
    const start = m ? Number(m[1]) : 0;
    const end = m ? Number(m[2]) : 0;
    const total = 100000;
    const ok206 = (bytes: number): GopRangeResponse => ({
      status: 206,
      // Tổng động cho chunk remainder (range vượt 100000): total phải > end
      // thì parseContentRange mới hợp lệ; probe/prefix vẫn dùng 100000.
      headers: { get: (n: string) => (n.toLowerCase() === "content-range" ? `bytes ${start}-${end}/${Math.max(total, end + 1)}` : null) },
      arrayBuffer: async () => new Uint8Array(bytes).buffer as ArrayBuffer,
    });
    if (mode === "probe404" && start === 0 && end === 1023) {
      return { status: 404, headers: { get: () => null }, arrayBuffer: async () => new ArrayBuffer(0) };
    }
    if (mode === "probeShort" && start === 0 && end === 1023) return ok206(10);
    if ((mode === "prefix404" || mode === "prefixShort") && end === total - 1 && start === 0) {
      if (mode === "prefix404") {
        return { status: 404, headers: { get: () => null }, arrayBuffer: async () => new ArrayBuffer(0) };
      }
      return ok206(10);
    }
    return ok206(end - start + 1);
  };
}
// GopRangeOutcome là union (mode gop-range không có reason) — helper
// này vừa thu hẹp kiểu cho tsc vừa khóa mode phải là full-file.
function fullFileReason(o: GopRangeOutcome): string {
  if (o.mode !== "full-file") throw new Error(`muốn full-file, nhận ${o.mode}`);
  return o.reason;
}
ok("range EN: statusNot206/shortBody/prefixStatus/prefixShort/fetchUrl/fetchParams qua dict", async () => {
  const r1 = await fetchVideoTrackByGopRange("http://x/f.mp4", { fetchImpl: stubFetch("probe404"), lookup: lookupEn });
  assert.equal(fullFileReason(r1), "probe-status-404: server did not return 206 for Range 0-1023");
  const r2 = await fetchVideoTrackByGopRange("http://x/f.mp4", { fetchImpl: stubFetch("probeShort"), lookup: lookupEn });
  assert.equal(fullFileReason(r2), "probe-short-body: requested 1024 bytes, got 10");
  const r3 = await fetchVideoTrackByGopRange("http://x/f.mp4", { fetchImpl: stubFetch("prefix404"), lookup: lookupEn });
  assert.equal(fullFileReason(r3), "prefix-status-404: server did not return 206 for the prefix Range");
  const r4 = await fetchVideoTrackByGopRange("http://x/f.mp4", { fetchImpl: stubFetch("prefixShort"), lookup: lookupEn });
  assert.equal(fullFileReason(r4), "prefix-short-body: requested 100000 bytes, got 10");
  await assert.rejects(
    fetchVideoTrackByGopRange("", { lookup: lookupEn }),
    (e: unknown) => (e as Error) instanceof TypeError && (e as Error).message === "fetchVideoTrackByGopRange: url must be a non-empty string",
  );
  await assert.rejects(
    fetchVideoTrackByGopRange("http://x/f.mp4", { prefixBytes: 0, lookup: lookupEn }),
    (e: unknown) =>
      (e as Error) instanceof TypeError &&
      (e as Error).message === "fetchVideoTrackByGopRange: prefixBytes/maxMoovBytes/tailScanBytes/tailInitialChunkBytes must be > 0",
  );
});

ok("range VI: không lookup giữ đúng chuỗi VI cũ (probe 404)", async () => {
  const r = await fetchVideoTrackByGopRange("http://x/f.mp4", { fetchImpl: stubFetch("probe404") });
  assert.equal(fullFileReason(r), "probe-status-404: server không trả 206 cho Range 0-1023");
});

ok("range EN: sampleRemainderInvalid + sampleChunkLimit qua dict", async () => {
  await assert.rejects(
    fetchSampleRemainderChunked(stubFetch("probe404"), "http://x/f.mp4", 0, 0, new Uint8Array(0), 100000, [], lookupEn),
    (e: unknown) =>
      (e as Error) instanceof TypeError &&
      (e as Error).message === "fetchSampleRemainderChunked: sampleSize 0 / prefix 0 is invalid",
  );
  // Đợt 60 Q5 nâng cap 32 MiB → 64 MiB, tối đa 128 chunk: cần chunk
  // thứ 129 mới vượt trần (sample 129×512 KiB + 1 byte). knownSize null
  // để gate không so tổng (chunk range vượt xa total 100000 của stub).
  const sampleSize = 129 * 512 * 1024 + 1;
  await assert.rejects(
    fetchSampleRemainderChunked(stubFetch("probe404"), "http://x/f.mp4", 0, sampleSize, new Uint8Array(10), null, [], lookupEn),
    (e: unknown) =>
      (e as Error).message ===
      "sample-chunk-limit: sample 0 needs more than 128 512 KiB chunks (size 67633153)",
  );
});

// --- E. Source: 26 key fragment đã nối bằng trKey ------------------------
// (regex \s* vì có site viết trKey nhiều dòng: trKey(\n  lookup,\n  "key".)
ok("source: 26 key fragment P7 + 28 key projectRepo.* đều nối bằng trKey(lookup, ...)", () => {
  const readSrc = (rel: string): string => readFileSync(`apps/web/src/${rel}`, "utf8");
  const hasTrKey = (src: string, key: string): boolean =>
    new RegExp(`trKey\\(\\s*lookup,\\s*"${key.replace(/\./g, "\\.")}"`).test(src);
  const projectRepo = readSrc("lib/projectRepo.ts");
  for (const k of WIRED_28) {
    assert.ok(hasTrKey(projectRepo, k), `projectRepo.ts thiếu trKey("${k}")`);
  }
  const trial = readSrc("lib/gopTrialDecode55L8.ts");
  for (const k of ["gop.trial.noDecoder", "gop.trial.timeout", "gop.trial.unsupportedConfig", "gop.trial.decodeFailed"]) {
    assert.ok(hasTrKey(trial, k), `gopTrialDecode55L8.ts thiếu trKey("${k}")`);
  }
  const range = readSrc("lib/gopRangeFetch39T3.ts");
  const rangeKeys = FRAGMENT_26.filter((k) => k.startsWith("gop.range.") || k.startsWith("gop.demux."));
  assert.equal(rangeKeys.length, 21, `phải có 21 key gop.range/demux, nhận ${rangeKeys.length}`);
  for (const k of rangeKeys) {
    assert.ok(hasTrKey(range, k), `gopRangeFetch39T3.ts thiếu trKey("${k}")`);
  }
  const loadReport = readSrc("lib/loadReport.ts");
  assert.ok(hasTrKey(loadReport, "loadReport.badCase"), "loadReport.ts thiếu trKey(loadReport.badCase)");
});

// --- F. loadReport.badCase: sentinel nội bộ, không thoát ra ngoài -------
ok("loadReport.badCase: case xấu vẫn rơi về đường chung, không throw ra ngoài", () => {
  const note = {
    code: "motionMigrated",
    params: { cases: JSON.stringify([{ code: 123, vars: {} }]), notes: "x" },
    fallback: "FB",
  };
  // Không throw dù case xấu; đường chung dịch template qua lookup.
  const out = formatStructuredNote(note as never, lookupEn);
  assert.equal(typeof out, "string");
  assert.ok(out.length > 0, "phải trả chuỗi, không rỗng");
  assert.ok(!out.includes("case xấu") && !out.includes("bad case"), "message sentinel không được lộ ra ngoài");
});

runAll();
