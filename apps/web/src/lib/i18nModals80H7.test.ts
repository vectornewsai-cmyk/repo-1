// i18nModals80H7.test.ts — Phase 9 đợt 80, luồng H7: Modals i18n — wire
// phần còn chết + quét chuỗi cứng sub-panel (nợ đợt 79 G9 §5 + gap N2 §2.7).
//
// PHẠM VI FILE NÀY — chỉ khóa phần MỚI của H7 (i18n wiring). Các hạng mục
// đã xác minh là KHÔNG còn rò (không assert lại ở đây, xem LIMITS H7 §2):
//   - EnhancePanel (13 literal) / SpeedPanel (2) / Timeline badge (1):
//     toàn bộ là fallback của enhanceT()/speedT() mà key ĐÃ CÓ trong dict.
//   - Thông báo drop (Timeline onDrop → validateDrop): đã qua key drop.*.
//   - projectRepo warnings blob-URL / missing-media, openProjectFlow
//     archiveHistory*, projectHistory.*, subtitles err*, curveFix
//     summary*/reason*/change*: đều là fallback của key ĐÃ CÓ trong dict.
//   - nestUtils (177 literal): store nuốt lỗi (trả false/null) hoặc map
//     qua reasonCode → key nested.*; panel toast qua i18nT với key nested.*.
//   - safeArea validate (4): validator chỉ test dùng, không tới UI.
//   - syncProtocol (6): module chết — 0 caller production (chỉ test).
//   - curveFix.formatSanitizeSummary (bản không-lookup): mọi caller
//     production đều truyền summary đã dịch; giữ nguyên làm fallback +
//     test cũ khóa, không xóa.
// Phần CÒN THẬT sau khi quét AST toàn src (xem LIMITS H7 §1–§2):
//   - reversePreviewGate: 3/4 chuỗi cảnh báo TỚI UI (toast + title badge
//     decode-ahead trong preview.tsx) bằng nguyên văn VI; nay kèm
//     warningKeys (reverseGate.*) và preview dịch qua key.
//   - rehydrate36S5: 6 lý do skipped chưa có key (hiện không UI nào đọc
//     trường skipped, nhưng thêm reasonKey để caller tương lai dịch được).
//   - serializeProject: tên mặc định "Dự án không tên" khi name rỗng —
//     nay qua lookup tùy chọn (key projectRepo.untitledProject).
//
// Dict: 2425 (baseline đợt 79) + 9 key đợt 80 H10 (social presets) +
// 10 key H7 + 17 key aiJob.* (luồng round-80 khác, nhóm mới — chưa rõ
// tên luồng lúc stage) = 2461 lúc stage đợt 80 H7 (2463 sau đợt 81 I6: +2 key aiJob.*; 2489 sau đợt 84 L8/L9: +2 key L9 +24 key L8; 2507 sau đợt 85 M7/M8: +11 key M7 +7 key M8; 2515 sau đợt 87 O5/closing: +7 key O5 +1 key closing; 2516 sau đợt 88 P6: +1 key validation.TRACK_IMAGE_MASK; 2517 sau đợt 91 S5: +1 key motionTrack.title; 2518 sau đợt 92 T5: +1 key sticker.title; 2767 sau đợt 93 U5: +249 key sticker.cat.*/sticker.item.*). Số đếm khóa theo đĩa lúc stage; parent
// LƯU Ý: check "dict 2463/2463" ở §1 đã stale từ đợt 84 (dict lên 2489 mà
// không ai bump check này — nó đỏ sẵn ở 2515 trước P6); P6 bump nó về 2516; S5 đợt 91 bump lên 2517 (+1 key motionTrack.title); T5 đợt 92 bump lên 2518 (+1 key sticker.title); U5 đợt 93 bump lên 2767 (+249 key sticker.cat.*/sticker.item.*)
// cùng đợt vì nhiệm vụ (a) thêm key mới vào dict.
// đếm lại lúc gộp (xem LIMITS H7 §6).
//
// Chạy bằng esbuild bundle (mẫu G9 — projectRepo import @repo-1/video-spec
// nên Node type-stripping không resolve được; dùng --format=esm):
//   ./node_modules/.bin/esbuild apps/web/src/lib/i18nModals80H7.test.ts \
//     --bundle --platform=node --format=esm --outfile=/tmp/h80/i18n80h7.mjs \
//     && node /tmp/h80/i18n80h7.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  resolveDecodeAheadGate,
  resolveProxyMainDirection,
} from "./reversePreviewGate";
import { aggregateDecodeAheadDecisions } from "./reverseDecodeAheadToggle";
import { planRehydrate, planRehydrateBin } from "./rehydrate36S5";
import { serializeProject, type BinMediaEntry } from "./projectRepo";
import type { AssetManifest } from "./assetStore";
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
  console.log(`i18n modals round 80 H7: ${pass}/${queue.length} pass`);
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

const NEW_KEYS = [
  "reverseGate.experimentWarning",
  "reverseGate.underLoadWarning",
  "reverseGate.noHardwareWarning",
  "reverseGate.proxyMainNote",
  "rehydrate.reasonAssetGone",
  "rehydrate.reasonBlobStale",
  "rehydrate.reasonSelfSufficient",
  "rehydrate.reasonNoManifest",
  "rehydrate.reasonUnknownSrc",
  "rehydrate.reasonAssetGoneBytes",
];

// --- 1. Dict ------------------------------------------------------------
check("dict 2767/2767, cùng tập key, 10 key mới đủ 2 bên", () => {
  assert.equal(VI.size, 2767, `vi có ${VI.size} key`);
  assert.equal(EN.size, 2767, `en có ${EN.size} key`);
  assert.deepEqual([...VI.keys()].sort(), [...EN.keys()].sort(), "tập key vi/en lệch");
  for (const k of NEW_KEYS) {
    assert.ok(VI.has(k), `thiếu vi:${k}`);
    assert.ok(EN.has(k), `thiếu en:${k}`);
    assert.notEqual(VI.get(k), EN.get(k), `${k} vi==en`);
    assert.deepEqual(placeholders(VI.get(k) ?? ""), placeholders(EN.get(k) ?? ""), `${k} placeholder lệch`);
    assert.ok(!VI_CHARS.test(EN.get(k) ?? ""), `${k} bản en còn dấu tiếng Việt`);
  }
});

// --- 2. reverseGate -----------------------------------------------------
const EASY_QUIET = { decodeFps: 60, loadLabel: "quiet" as const, resolution: "1280x720" };
const EASY_LOAD = { decodeFps: 60, loadLabel: "under-load" as const, resolution: "1280x720" };
const HW = { preferHardwareSupported: true, hardwareDecodedFrames: 10, hardwareAttemptedFrames: 10, hardwareDecodeFps: 60 };

check("gate allowed (easy+quiet, không HW): 2 warnings + 2 keys 1:1, en không VI", () => {
  const d = resolveDecodeAheadGate({ optIn: true, hardwareProof: null, softwareMeasurement: EASY_QUIET });
  assert.equal(d.verdict, "allowed-experiment");
  assert.equal(d.warnings.length, 2);
  assert.deepEqual(d.warningKeys, ["reverseGate.experimentWarning", "reverseGate.noHardwareWarning"]);
  // warningKeys dịch ra đúng chuỗi warnings ở vi, và sang en không còn VI.
  assert.deepEqual(d.warningKeys.map((k) => tVi(k)), d.warnings);
  for (const k of d.warningKeys) assert.ok(!VI_CHARS.test(tEn(k)), `en ${k} còn VI`);
});

check("gate allowed (easy+under-load): có thêm underLoadWarning", () => {
  const d = resolveDecodeAheadGate({ optIn: true, hardwareProof: null, softwareMeasurement: EASY_LOAD });
  assert.deepEqual(d.warningKeys, [
    "reverseGate.experimentWarning",
    "reverseGate.underLoadWarning",
    "reverseGate.noHardwareWarning",
  ]);
  assert.equal(d.warnings.length, d.warningKeys.length);
});

check("gate allowed (HW đã chứng minh): không có noHardwareWarning", () => {
  const d = resolveDecodeAheadGate({ optIn: true, hardwareProof: HW, softwareMeasurement: EASY_QUIET });
  assert.deepEqual(d.warningKeys, ["reverseGate.experimentWarning"]);
});

check("gate blocked (opt-in off): warnings + warningKeys đều rỗng", () => {
  const d = resolveDecodeAheadGate({ optIn: false, hardwareProof: null, softwareMeasurement: null });
  assert.equal(d.verdict, "blocked");
  assert.deepEqual(d.warnings, []);
  assert.deepEqual(d.warningKeys, []);
});

check("proxy main direction: mọi verdict đều mang warningKeys proxyMainNote", () => {
  const no = resolveProxyMainDirection({ proxyDisplayedFps: null, originalDisplayedFps: null, proxyDecodeFps: null });
  assert.equal(no.verdict, "no");
  assert.deepEqual(no.warningKeys, ["reverseGate.proxyMainNote"]);
  assert.deepEqual(no.warningKeys.map((k) => tVi(k)), no.warnings);
  const yes = resolveProxyMainDirection({ proxyDisplayedFps: 30, originalDisplayedFps: 30, proxyDecodeFps: 30 });
  assert.equal(yes.verdict, "yes");
  assert.deepEqual(yes.warningKeys, ["reverseGate.proxyMainNote"]);
});

check("aggregate: gộp warningKeys, khử trùng, giữ thứ tự", () => {
  const a = resolveDecodeAheadGate({ optIn: true, hardwareProof: null, softwareMeasurement: EASY_QUIET });
  const b = resolveDecodeAheadGate({ optIn: true, hardwareProof: null, softwareMeasurement: EASY_LOAD });
  const m = aggregateDecodeAheadDecisions([a, b]);
  assert.equal(m.verdict, "allowed-experiment");
  assert.deepEqual(m.warningKeys, [
    "reverseGate.experimentWarning",
    "reverseGate.noHardwareWarning",
    "reverseGate.underLoadWarning",
  ]);
  assert.equal(m.warnings.length, m.warningKeys.length);
  const blocked = aggregateDecodeAheadDecisions([
    resolveDecodeAheadGate({ optIn: false, hardwareProof: null, softwareMeasurement: null }),
  ]);
  assert.deepEqual(blocked.warningKeys, []);
});

// --- 3. rehydrate -------------------------------------------------------
function manifest(partial: Partial<AssetManifest> & { assetId: string; originalName: string }): AssetManifest {
  return {
    sha256: "0".repeat(64),
    size: 100,
    mimeType: "video/webm",
    kind: "video",
    ingestedAt: "2026-11-02T00:00:00.000Z",
    refCount: 0,
    ...partial,
  };
}
const MANIFESTS: AssetManifest[] = [
  manifest({ assetId: "a_1111111111111111", originalName: "mau-1.webm" }),
];

check("rehydrate plan: 5 lý do skipped đều có reasonKey, vi khớp reason", () => {
  const p = planRehydrate(
    ["asset:a_deadbeefdeadbeef", "blob:http://x/abc", "https://cdn.example.com/v.mp4", "khong-co.mp4", "ftp://x/y"],
    MANIFESTS,
  );
  assert.equal(p.skipped.length, 5);
  const bySrc = new Map(p.skipped.map((s) => [s.src, s]));
  const expect: Array<[string, string]> = [
    ["asset:a_deadbeefdeadbeef", "rehydrate.reasonAssetGone"],
    ["blob:http://x/abc", "rehydrate.reasonBlobStale"],
    ["https://cdn.example.com/v.mp4", "rehydrate.reasonSelfSufficient"],
    ["khong-co.mp4", "rehydrate.reasonNoManifest"],
    ["ftp://x/y", "rehydrate.reasonUnknownSrc"],
  ];
  for (const [src, key] of expect) {
    const s = bySrc.get(src);
    assert.ok(s, `thiếu skipped ${src}`);
    assert.equal(s?.reasonKey, key, `${src} reasonKey`);
    assert.equal(tVi(key), s?.reason, `${key} vi phải khớp reason gốc từng chữ`);
    assert.ok(!VI_CHARS.test(tEn(key)), `en ${key} còn VI`);
  }
});

check("rehydrate bin: entry không còn manifest → reasonAssetGoneBytes", () => {
  const entries: BinMediaEntry[] = [{ assetId: "a_deadbeefdeadbeef", name: "cu.mp4" }];
  const bp = planRehydrateBin(entries, MANIFESTS, []);
  assert.equal(bp.skipped.length, 1);
  assert.equal(bp.skipped[0].reasonKey, "rehydrate.reasonAssetGoneBytes");
  assert.equal(tVi("rehydrate.reasonAssetGoneBytes"), bp.skipped[0].reason);
});

// --- 4. serializeProject ------------------------------------------------
function emptySpec(): VideoSpec {
  return {
    version: "0.2.0",
    meta: { name: "test", width: 1280, height: 720, fps: 30 },
    tracks: [],
  } as unknown as VideoSpec;
}

check("serializeProject: name rỗng + lookup en → 'Untitled project'", () => {
  const r = serializeProject(emptySpec(), "   ", undefined, undefined, undefined, tEn);
  assert.equal(r.envelope.name, "Untitled project");
  const rVi = serializeProject(emptySpec(), "", undefined, undefined, undefined, tVi);
  assert.equal(rVi.envelope.name, "Dự án không tên");
});

check("serializeProject: không lookup → fallback VI cũ; tên có sẵn giữ nguyên", () => {
  const r = serializeProject(emptySpec(), "");
  assert.equal(r.envelope.name, "Dự án không tên");
  const kept = serializeProject(emptySpec(), "Tên cũ", undefined, undefined, undefined, tEn);
  assert.equal(kept.envelope.name, "Tên cũ");
});

// --- 5. Hồi quy tĩnh: preview không còn toast/title warnings thô -------
check("preview.tsx: toast/title decode-ahead dùng warningLines đã dịch", () => {
  const src = readFileSync("apps/web/src/preview.tsx", "utf8");
  assert.ok(!src.includes("for (const w of st.warnings)"), "preview còn toast st.warnings thô");
  assert.ok(!src.includes("st.warnings.join"), "preview còn join st.warnings thô");
  assert.ok(src.includes("warningLines"), "preview thiếu biến warningLines");
  assert.ok(src.includes("st.warningKeys"), "preview chưa đọc st.warningKeys");
});

check("reverseWebcodecs: status mang warningKeys song song warnings", () => {
  const src = readFileSync("apps/web/src/lib/reverseWebcodecs.ts", "utf8");
  assert.ok(src.includes("warningKeys: reverseDecodeAheadWarningKeys()"), "status thiếu warningKeys");
  assert.ok(src.includes("export function reverseDecodeAheadWarningKeys"), "thiếu hàm reverseDecodeAheadWarningKeys");
  assert.ok(src.includes("get decodeAheadWarningKeyList"), "thiếu getter decodeAheadWarningKeyList");
});

await runAll();
