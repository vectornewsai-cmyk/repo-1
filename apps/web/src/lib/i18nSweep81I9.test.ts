// i18nSweep81I9.test.ts — Phase 9 đợt 81, luồng I9: quét nốt literal
// tiếng Việt còn lại sau H7 (nợ N2 thu hẹp).
//
// KẾT LUẬN (xem docs/PHASE9_ROUND81_I9_I18N_SWEEP_LIMITS.md): quét AST
// toàn apps/web/src cho 2069 literal VI / 65 file (script /tmp/i9-scan.mjs,
// TS compiler API, không tính test/comment) — KHÔNG còn chuỗi UI thật nào
// chưa wire. Mọi nhóm đều đã xác minh bằng grep/test là một trong: fallback
// chết của key ĐÃ CÓ trong dict, chẩn đoán/dev-only không tới UI, dữ liệu
// nội dung/khóa, hoặc module chết giữ theo lệnh (xem §4). File này KHÓA
// các xác minh đó để hồi quy sau này bắt được nếu một nhóm đổi trạng thái.
//
// Dict: 2461 lúc gộp đợt 80 + 2 key đợt 81 I6 (aiJob.etaHours +
// aiJob.etaEstimating, luồng round-81 khác, đã bump toàn bộ test khóa số
// key) = 2463 lúc stage I9. I9 thêm 0 key. + 2 key đợt 84 L9 + 24 key đợt 84 L8 = 2489 lúc stage L8/L9. + 11 key đợt 85 M7 + 7 key đợt 85 M8 = 2507 lúc stage M7/M8. + 7 key đợt 87 O5 + 1 key closing = 2515 lúc stage O5/closing. + 1 key đợt 88 P6 (validation.TRACK_IMAGE_MASK) = 2516 lúc stage P6; + 1 key đợt 91 S5 (motionTrack.title) = 2517 lúc stage S5; + 1 key đợt 92 T5 (sticker.title) = 2518 lúc stage T5; +249 key đợt 93 U5 (5 sticker.cat.* + 244 sticker.item.*) = 2767 lúc stage U5. Số đếm khóa theo đĩa lúc stage;
// LƯU Ý: check "dict 2463/2463" ở §1 đã stale từ đợt 84 (dict lên 2489 mà
// không ai bump check này — nó đỏ sẵn ở 2515 trước P6); P6 bump nó về 2516; S5 đợt 91 bump lên 2517 (+1 key motionTrack.title); T5 đợt 92 bump lên 2518 (+1 key sticker.title); U5 đợt 93 bump lên 2767 (+249 key sticker.cat.*/sticker.item.*)
// cùng đợt vì nhiệm vụ (a) thêm key mới vào dict.
// parent đếm lại lúc gộp.
//
// Chạy bằng esbuild bundle (mẫu H7 — projectHistory import
// @repo-1/video-spec nên Node type-stripping không resolve được; dùng
// --format=esm):
//   ./node_modules/.bin/esbuild apps/web/src/lib/i18nSweep81I9.test.ts \
//     --bundle --platform=node --format=esm --outfile=/tmp/i9/i18n81i9.mjs \
//     && node /tmp/i9/i18n81i9.mjs
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { summarizeDiff } from "./projectHistory";
import { scanAvccZeroRun } from "./gopTrialDecode55L8";
import { fastMotionStrings } from "../components/enhance/fastMotion";
import { parseCube } from "./userLut";
import type { VideoSpec } from "@repo-1/video-spec";

/** Khai báo tối thiểu để không cần @types/node. */
declare const process: { exitCode: number | undefined };

let pass = 0;
const failures: string[] = [];
const queue: Array<{ name: string; fn: () => void | Promise<void> }> = [];
function check(name: string, fn: () => void | Promise<void>): void {
  queue.push({ name, fn });
}
async function runAll(): Promise<void> {
  for (const q of queue) {
    try {
      await q.fn();
      pass++;
      console.log(`  ✓ ${q.name}`);
    } catch (e) {
      failures.push(q.name);
      console.error(`  ✗ ${q.name}: ${(e as Error).message}`);
    }
  }
  console.log(`i18n sweep round 81 I9: ${pass}/${queue.length} pass`);
  if (failures.length > 0) process.exitCode = 1;
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
const tVi = lookupFor("vi");
const tEn = lookupFor("en");
const VI_CHARS = /[àáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/;

function readSrc(rel: string): string {
  return readFileSync(`apps/web/src/${rel}`, "utf8");
}
function* walkSrc(dir: string): Generator<string> {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) yield* walkSrc(p);
    else if (/\.(ts|tsx)$/.test(e)) yield p;
  }
}
function prodFiles(): string[] {
  return [...walkSrc("apps/web/src")].filter((f) => !/\.test\.(ts|tsx)$/.test(f));
}

// --- 1. Dict ------------------------------------------------------------
check("dict 2767/2767, cùng tập key, vi==en=72, placeholder khớp", () => {
  assert.equal(VI.size, 2767, `vi có ${VI.size} key`);
  assert.equal(EN.size, 2767, `en có ${EN.size} key`);
  assert.deepEqual([...VI.keys()].sort(), [...EN.keys()].sort(), "tập key vi/en lệch");
  for (const k of VI.keys()) {
    const v = VI.get(k)!;
    const e = EN.get(k)!;
    assert.ok(v.length > 0, `${k}: vi rỗng`);
    assert.ok(e.length > 0, `${k}: en rỗng`);
    assert.deepEqual(placeholders(v), placeholders(e), `${k}: placeholder vi/en lệch`);
  }
  // +1 key đợt 92 T5: sticker.title ("🌟 Sticker" giống hệt 2 bên — loanword Sticker đã dùng khắp panel sticker) → 60 thành 61; +11 key đợt 93 U5 (sticker.cat.emoji + 10 sticker.item.* loanword) → 61 thành 72.
  const same = [...VI.keys()].filter((k) => VI.get(k) === EN.get(k));
  assert.equal(same.length, 72, `số key vi==en phải là 72, nhận ${same.length}`);
});

// --- 2. 80 key fallback-chết đã xác minh: key có đủ, vi khác en --------
const DEAD_FALLBACK_KEYS = [
  // EnhancePanel (13) + SpeedPanel (2) — fallback của enhanceT/speedT.
  "enhance.previewApprox", "enhance.presetSpeedBlocked", "enhance.previewOffNote",
  "enhance.stabilizeSpeedTitle", "enhance.badgeTitle", "enhance.presetLabel",
  "enhance.presetOff", "enhance.presetLight", "enhance.presetBalanced",
  "enhance.presetStrong", "enhance.presetCustom", "enhance.activeSummary",
  "enhance.previewToggle", "speed.curveStabTitle", "speed.curveStabBlocked",
  // Captions / template — fallback của trKey.
  "captions.trackLabel", "captions.translatedTrack",
  "templateEngine.missingValues", "templateEngine.invalidSpec",
  "templatePack.missingSampleMedia", "templatePack.audioPlaceholderUnsupported",
  // projectHistory summarizeDiff (9) + validateImport/openDb (7).
  "projectHistory.firstVersion", "projectHistory.renamed", "projectHistory.trackCount",
  "projectHistory.addedClips", "projectHistory.removedClips", "projectHistory.movedClips",
  "projectHistory.trimmedClips", "projectHistory.totalDuration",
  "projectHistory.noContentChange", "projectHistory.historyNotJsonObject",
  "projectHistory.historyBadFormat", "projectHistory.historyMissingFields",
  "projectHistory.historyBadVersion", "projectHistory.historyBadHash",
  "projectHistory.noIndexedDb", "projectHistory.indexedDbOpenFailed",
  // curveFix reasonKey (2) + speedCurve warnings (2).
  "curveFix.reasonShape", "curveFix.reasonEmpty",
  "speedCurve.shape", "speedCurve.keyframesEmpty",
  // GOP trial/demux/range/cache (9) — fallback của trKey trong throw/reason.
  "gop.trial.decodeFailed", "gop.trial.timeout", "gop.trial.unsupportedConfig",
  "gop.demux.trialDecodeFailed", "gop.demux.parserAvccTooShort",
  "gop.demux.parserMoovMissing", "gop.demux.avccReadFailed",
  "gop.range.statusNot206", "gop.cache.statusNot206",
  // nested scope validate (2) + subtitles err (3) + motion badge (1).
  "nested.scopeTracksNotArray", "nested.scopeTracksBadIndex",
  "subtitles.errBadTimestamp", "subtitles.errEndNotAfterStart", "subtitles.errEmptyCue",
  "preview.motionInterp",
  // userLut (11) — fragment round57-n8 đã gộp, LutPicker truyền lookup.
  "userLut.cubeEmpty", "userLut.cubeMissingSize", "userLut.cubeOnly3d",
  "userLut.cubeRowCount", "userLut.cubeRowInvalid", "userLut.cubeSizeDuplicate",
  "userLut.cubeSizeInvalid", "userLut.cubeTooLarge", "userLut.cubeTripleExpected",
  "userLut.cubeTripleInvalid", "userLut.cubeValueRange",
  // projectRepo / notes / archive (6).
  "projectRepo.moreWarnings", "projectRepo.untitledProject",
  "structuredNotes.archiveHistorySkipped", "structuredNotes.archiveHistoryImported",
  "openProject.archiveHistoryNotObject", "openProject.archiveHistoryBadJson",
  // fastMotion (7) — fragment round64-r2 + round65-s2 đã gộp.
  "enhance.fastMotionWarning", "enhance.fastMotionWarningSlow",
  "enhance.fastMotionUnknown", "enhance.fastMotionMeasuring",
  "enhance.fastMotionLevelFast", "enhance.fastMotionLevelMedium",
  "enhance.fastMotionLevelSlow",
];
check("80 key fallback-chết: đủ 2 bên, vi khác en, placeholder khớp", () => {
  assert.equal(DEAD_FALLBACK_KEYS.length, 80, `danh sách phải có 80 key, nhận ${DEAD_FALLBACK_KEYS.length}`);
  for (const k of DEAD_FALLBACK_KEYS) {
    assert.ok(VI.has(k), `thiếu vi:${k}`);
    assert.ok(EN.has(k), `thiếu en:${k}`);
    assert.notEqual(VI.get(k), EN.get(k), `${k} vi==en`);
    assert.deepEqual(placeholders(VI.get(k) ?? ""), placeholders(EN.get(k) ?? ""), `${k} placeholder lệch`);
    assert.ok(!VI_CHARS.test(EN.get(k) ?? ""), `${k} bản en còn dấu tiếng Việt`);
  }
});

// --- 3. Fragment đã gộp đúng từng chữ vào dict --------------------------
check("fragment fastMotion (round64-r2 + round65-s2) == dict từng chữ", () => {
  const f64 = readJson("apps/web/src/i18n/fragments/round64-r2.json") as Dict;
  const f65 = readJson("apps/web/src/i18n/fragments/round65-s2.json") as Dict;
  const fragVi = new Map<string, string>();
  const fragEn = new Map<string, string>();
  for (const f of [f64, f65]) {
    for (const [k, v] of Object.entries(((f.vi as Dict).enhance ?? {}) as Record<string, string>)) {
      if (k.startsWith("fastMotion")) fragVi.set(k, v);
    }
    for (const [k, v] of Object.entries(((f.en as Dict).enhance ?? {}) as Record<string, string>)) {
      if (k.startsWith("fastMotion")) fragEn.set(k, v);
    }
  }
  assert.equal(fragVi.size, 7, `fragment fastMotion vi phải có 7 key, nhận ${fragVi.size}`);
  assert.equal(fragEn.size, 7, `fragment fastMotion en phải có 7 key, nhận ${fragEn.size}`);
  for (const k of fragVi.keys()) {
    assert.equal(VI.get(`enhance.${k}`), fragVi.get(k), `dict vi enhance.${k} lệch fragment`);
    assert.equal(EN.get(`enhance.${k}`), fragEn.get(k), `dict en enhance.${k} lệch fragment`);
  }
});
check("fragment userLut (round57-n8) == dict từng chữ", () => {
  const f = readJson("apps/web/src/i18n/fragments/round57-n8.json") as Dict;
  const fVi = (f.vi as Dict).userLut as Record<string, string>;
  const fEn = (f.en as Dict).userLut as Record<string, string>;
  assert.equal(Object.keys(fVi).length, 11, `fragment userLut vi phải có 11 key`);
  assert.equal(Object.keys(fEn).length, 11, `fragment userLut en phải có 11 key`);
  for (const k of Object.keys(fVi)) {
    assert.equal(VI.get(`userLut.${k}`), fVi[k], `dict vi userLut.${k} lệch fragment`);
    assert.equal(EN.get(`userLut.${k}`), fEn[k], `dict en userLut.${k} lệch fragment`);
  }
});

// --- 4. Module chết / hàm chết: xác minh bằng grep tĩnh -----------------
check("syncProtocol: 0 importer production (chỉ test) — KHÔNG xóa theo lệnh", () => {
  const users = prodFiles().filter((f) => {
    if (f.endsWith("lib/syncProtocol.ts")) return false;
    return readFileSync(f, "utf8").includes("syncProtocol");
  });
  assert.deepEqual(users, [], `syncProtocol còn được import ở production: ${users.join(", ")}`);
});
check("formatSanitizeSummary: chỉ còn 3 fallback trong store.ts — KHÔNG xóa theo lệnh", () => {
  const hits: string[] = [];
  for (const f of prodFiles()) {
    const src = readFileSync(f, "utf8");
    for (const line of src.split("\n")) {
      if (/formatSanitizeSummary\s*\(/.test(line) && !line.includes("Localized")) {
        hits.push(`${f.split("apps/web/src/")[1]}: ${line.trim().slice(0, 80)}`);
      }
    }
  }
  // Định nghĩa trong curveFix.ts + 3 fallback store.ts (summary ?? ...).
  assert.equal(hits.length, 4, `formatSanitizeSummary production phải có đúng 4 điểm chạm, nhận ${hits.length}: ${hits.join(" | ")}`);
  assert.ok(hits.filter((h) => h.startsWith("store.ts")).length === 3, `store.ts phải có đúng 3 fallback: ${hits.join(" | ")}`);
});
check("discardRestore35R6: 0 importer production (chỉ test) — giữ, xem LIMITS", () => {
  const users = prodFiles().filter((f) => {
    if (f.endsWith("lib/discardRestore35R6.ts")) return false;
    return readFileSync(f, "utf8").includes("discardRestore");
  });
  assert.deepEqual(users, [], `discardRestore còn được import ở production: ${users.join(", ")}`);
});
check("sample-nested: 0 importer production (chỉ test) — giữ làm demo", () => {
  const users = prodFiles().filter((f) => {
    if (f.endsWith("sample-nested.ts")) return false;
    return readFileSync(f, "utf8").includes("sample-nested");
  });
  assert.deepEqual(users, [], `sample-nested còn được import ở production: ${users.join(", ")}`);
});
check("summarizeDiff CÓ caller production (saveVersion) — đính chính H7", () => {
  const src = readSrc("lib/projectHistory.ts");
  assert.ok(
    src.includes("summary: summarizeDiff(latest ? latest.spec : null, spec, lookup)"),
    "saveVersion phải gọi summarizeDiff với lookup",
  );
});

// --- 5. Store nuốt lỗi / map qua key ------------------------------------
check("store nuốt lỗi nest (error in res -> false) ở 11 action nested", () => {
  const src = readSrc("store.ts");
  const n = (src.match(/if \("error" in res\) return false;/g) ?? []).length;
  assert.equal(n, 11, `store.ts phải có 11 lần nuốt lỗi nest, nhận ${n}`);
  // Ba action chính (nestSelection / unnestClip / addAdjustmentLayer) đều nuốt.
  for (const head of ["nestSelection: (name) => {", "unnestClip: (trackId, clipId) => {", "addAdjustmentLayer: (filterType, intensity, start, duration) => {"]) {
    const i = src.indexOf(head);
    assert.ok(i >= 0, `store.ts thiếu action ${head}`);
    assert.ok(
      src.slice(i, i + 600).includes('if ("error" in res) return false;'),
      `action ${head} không nuốt lỗi`,
    );
  }
});
check("store giấu message gốc của nestedSplitOffset (không lộ VI ra toast)", () => {
  const src = readSrc("store.ts");
  assert.ok(
    src.includes('return blocked("nested.splitOffsetCurveInvalid", true);'),
    "store phải map lỗi nestedSplitOffset sang key chung, không toast message gốc",
  );
});
check("preview failsoft + decode-ahead đi qua lookup/key, không chuỗi thô", () => {
  const preview = readSrc("preview.tsx");
  assert.ok(
    preview.includes("buildPreviewSpecFailsoft(rawSpec, i18nT)"),
    "preview phải truyền i18nT vào buildPreviewSpecFailsoft",
  );
  const toggle = readSrc("lib/reverseDecodeAheadToggle.ts");
  for (const k of [
    "decodeahead.reason.optInOff",
    "decodeahead.reason.hardwareProven",
    "decodeahead.reason.easyFootage",
    "decodeahead.reason.hardwareNotMeasured",
    "decodeahead.reason.hardwareAbsent",
  ]) {
    assert.ok(toggle.includes(k), `reverseDecodeAheadToggle thiếu key ${k}`);
  }
});

// --- 6. Động: dịch thật qua lookup en -----------------------------------
check("userLut.parseCube lỗi dịch sang en (không còn VI)", () => {
  assert.throws(
    () => parseCube("x", 11 * 1024 * 1024, tEn),
    (e: unknown) =>
      e instanceof Error &&
      e.message === "Cube file too large (11.0MB, max 10MB)." &&
      !VI_CHARS.test(e.message),
  );
  assert.throws(
    () => parseCube("", 0, tEn),
    (e: unknown) => e instanceof Error && e.message === "Cube file is empty." && !VI_CHARS.test(e.message),
  );
  // Không lookup -> fallback VI cũ (hành vi cũ giữ nguyên).
  assert.throws(() => parseCube("", 0), (e: unknown) => e instanceof Error && e.message === "File .cube rỗng.");
});
check("summarizeDiff dịch sang en qua lookup (toast + bảng HistoryPanel)", () => {
  const spec = (name: string, clips: Array<{ id: string; start: number; duration: number }>): VideoSpec =>
    ({
      meta: { name, width: 1280, height: 720, fps: 30 },
      duration: 10,
      tracks: [{ id: "v1", kind: "video", clips: clips.map((c) => ({ ...c, in: 0, out: c.duration })) }],
    }) as unknown as VideoSpec;
  assert.deepEqual(summarizeDiff(null, spec("P", []), tEn), ["First version of the project."]);
  const renamed = summarizeDiff(spec("A", []), spec("B", []), tEn);
  assert.deepEqual(renamed, ['Renamed: "A" → "B"']);
  const added = summarizeDiff(spec("P", []), spec("P", [{ id: "c1", start: 0, duration: 5 }]), tEn);
  assert.ok(added.some((s) => s === "Added 1 clip(s)"), `thiếu dòng Added: ${added.join("; ")}`);
  for (const s of added) assert.ok(!VI_CHARS.test(s), `dòng added còn VI: ${s}`);
  assert.deepEqual(summarizeDiff(spec("P", []), spec("P", []), tEn), ["No content change (metadata only)."]);
  assert.deepEqual(summarizeDiff(null, spec("P", []), tVi), ["Phiên bản đầu tiên của project."]);
});
check("scanAvccZeroRun lý do bằng tiếng Anh (mã chẩn đoán, không dịch)", () => {
  const short = scanAvccZeroRun(new Uint8Array([1, 2, 3]), "avc1.640028");
  assert.equal(short.violation, false);
  assert.equal(short.reason, "sample too short (3 bytes) — zero-run scan skipped");
  const nonAvc = scanAvccZeroRun(new Uint8Array(10), "hev1.1.6.L93.B0");
  assert.equal(nonAvc.violation, false);
  assert.ok(nonAvc.reason.startsWith("not-avc1 (codec hev1.1.6.L93.B0)"), `reason lạ: ${nonAvc.reason}`);
  // NAL dài 10, payload có 3 byte 0 liên tiếp (> ngưỡng 2) -> vi phạm.
  const bad = new Uint8Array([0, 0, 0, 10, 0x65, 0, 0, 0, 1, 2, 3, 4, 5, 6]);
  const v = scanAvccZeroRun(bad, "avc1.640028");
  assert.equal(v.violation, true, `phải vi phạm, nhận ${JSON.stringify(v)}`);
  assert.ok(v.reason.includes("zero-run 3 bytes"), `reason vi phạm lạ: ${v.reason}`);
  assert.ok(!VI_CHARS.test(v.reason), `reason vi phạm còn VI: ${v.reason}`);
  const clean = new Uint8Array([0, 0, 0, 10, 0x65, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const ok = scanAvccZeroRun(clean, "avc1.640028");
  assert.equal(ok.violation, false);
  assert.ok(ok.reason.startsWith("no illegal zero-run"), `reason sạch lạ: ${ok.reason}`);
  assert.ok(!VI_CHARS.test(ok.reason), `reason sạch còn VI: ${ok.reason}`);
});
check("fastMotionStrings en/vi qua fragment (không rơi về fallback cứng)", () => {
  const en = fastMotionStrings("en");
  const vi = fastMotionStrings("vi");
  assert.equal(en.measuring, "Measuring clip motion…");
  assert.equal(en.levelFast, "fast");
  assert.equal(en.levelMedium, "moderate");
  assert.equal(en.levelSlow, "slow");
  assert.ok(en.warning.startsWith("⚠️ Fast-moving clip"), `warning en lạ: ${en.warning}`);
  assert.ok(en.unknown.startsWith("⚠️ Could not measure"), `unknown en lạ: ${en.unknown}`);
  for (const s of [en.warning, en.warningSlow, en.unknown, en.measuring, en.levelFast, en.levelMedium, en.levelSlow]) {
    assert.ok(!VI_CHARS.test(s), `chuỗi fastMotion en còn VI: ${s}`);
  }
  assert.equal(vi.measuring, tVi("enhance.fastMotionMeasuring"));
  assert.equal(en.measuring, tEn("enhance.fastMotionMeasuring"));
  assert.equal(vi.warning, tVi("enhance.fastMotionWarning"));
  assert.equal(en.warning, tEn("enhance.fastMotionWarning"));
});

runAll();
