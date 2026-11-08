// i18nAudit59P7.test.ts — Phase 9 đợt 59, luồng P7: kiểm toán i18n hậu-gộp
// đợt 58 (test-only, KHÔNG sửa code sản phẩm, KHÔNG sửa vi.json/en.json).
//
// Sau đợt 58 dict vi.json == en.json == 1942 key lá; sau parent gộp đợt 59 là 1957 key lá (parent gộp fragment
// O3 4 key + O5 1 key vào dict 1937 key; xem docs/PHASE9_ROUND58_LIMITS.md
// §0-§1). Đợt 60 Q4 dọn tiếp: nối thật 28 key projectRepo.* + 26 key
// fragment P7 (gop.*/loadReport.badCase), xóa 14 key lẻ mồ côi
// (13 key P7 + enhance.renderOnly lộ sau P7) → dict 1972 key lá mỗi bên (1969 sau đợt 60 Q4, +3 key Q1),
// 0 key mồ côi, 0 literal tồn đọng (xem docs/PHASE9_ROUND60_Q4_I18N_ORPHANS_LIMITS.md).
// Parent gộp đợt 61: +72 key (R2 3 enhance.* + R5 1 pack.recordTimeout + R6 50 gop.*
// + R9 18 storageCleanup.*) → dict 2044 key lá mỗi bên; parent gộp đợt 62: +102 key (R2 2 + R5 91 + R7 9) → 2146 mỗi bên.
// Parent gộp đợt 63: +131 key fragment (R1 5 + R5 123 + R7 2 + R9 1) − 1 key chết speed.warnTooShort − 1 key jobNote chưa có UI → 2283 mỗi bên; parent gộp đợt 64: +7 key fragment (R2 6 + R8 1) + 1 key parent (projectHistory.migrateVersionsNeedsProjectId) → 2283 mỗi bên.
// Test này khóa trạng thái đó + quét literal tiếng Việt còn sót
// trong các file đã migrate ở đợt 56–58:
//
//   A. Dict: 2283 key lá mỗi bên sau parent gộp đợt 64 (2275 sau đợt 63, 2146 sau đợt 62, 2044 sau đợt 61, 1972 sau đợt 60), cùng tập key, placeholder {…} khớp từng
//      key, không giá trị rỗng; 0 key mồ côi (41 key P7 đã nối/xóa hết
//      + enhance.renderOnly); 0 key mồ côi trong 5 key mới đợt 58;
//      fragment O3/O5 đã gộp đúng từng chữ;
//      key của luồng song song P8 (enhance.*) nếu đã vào dict thì phải
//      đúng giá trị fragment P8.
//   B. Quét literal: mọi literal VI trong 36 file (29 file đổi đợt 58 +
//      7 file migrate đợt 56–57) phải thuộc 1 trong: giá trị dict,
//      fallback trKey đã nối, phần của giá trị dict, inventory M6/N8,
//      hoặc danh sách tồn đọng khóa (đợt 60 Q4: 0 mẫu — 29 literal
//      diagnostic GOP/loadReport + literal validate/keyframeFix mới đều
//      đã nối qua trKey nên khớp giá trị dict; toàn bộ là
//      diagnostic NON-UI, chưa tới UI — xem LIMITS P7). Không còn
//      JSX-text tiếng Việt nào trong 36 file (0). Mọi trKey() phải trỏ
//      tới key có trong dict. 4 fallback "lệch tĩnh" là benign (fallback
//      ghi cứng giá trị mà dict diễn đạt bằng {var} — runtime đã được
//      M5 kiểm chứng, xem §B4).
//   C. Runtime: resolveNestedRampCurve v-ngoài-khoảng + flattenForPreview
//      chu trình trả đúng chuỗi EN của dict khi có lookup.
//
// Cách chạy (mẫu M2/N4/N8, từ gốc repo; bundle ra scratch ngoài repo):
//   ./node_modules/.bin/esbuild apps/web/src/lib/i18nAudit59P7.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/round59-p7/p7.test.cjs \
//     && node /tmp/round59-p7/p7.test.cjs
//
// LƯU Ý ĐỒNG THỜI: đợt 59 có nhiều luồng song song (P3 sửa nestedPreview,
// P6 sửa gopTrialDecode, P8 sửa enhance/Timeline). Test này là ảnh chụp
// (snapshot) tại thời điểm chạy: nếu một luồng khác thêm literal mới vào
// 1 trong 36 file thì test đỏ đúng chức năng — chạy lại scan để cập nhật
// danh sách tồn đọng, đừng sửa test cho xanh bằng cách nới lỏng.
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import {
  flattenForPreview,
  resolveNestedRampCurve,
  skippedEffectReason,
} from "./nestedPreview";

/** Khai báo tối thiểu để không cần @types/node (mẫu M5). */
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
  console.log(`P7 i18n audit round 59: ${pass}/${queue.length} pass`);
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

// --- Fragment đợt 61 R6 (ĐÃ GỘP ở parent đợt 61) -------------------------
// 50 key gop.* diagnostic đã gộp vào dict (parent đợt 61, như fragment P8
// đợt 59) — trKey tới các key này có bản dịch vi/en đầy đủ, không phải key
// lạ. Đọc fragment nếu có; thiếu file thì
// coi như rỗng để test vẫn đỏ đúng khi code trỏ key không có ở đâu cả.
const R6_FRAG_VI = new Map<string, string>();
const R6_FRAG_EN = new Map<string, string>();
const R6_FRAG_PATH =
  "../goals/capcut-clone-video-editor/hidden_files/round61-r6-fragment.json";
if (existsSync(R6_FRAG_PATH)) {
  const frag = JSON.parse(readFileSync(R6_FRAG_PATH, "utf8")) as {
    vi: Dict;
    en: Dict;
  };
  for (const [k, v] of flatten(frag.vi)) R6_FRAG_VI.set(k, v);
  for (const [k, v] of flatten(frag.en)) R6_FRAG_EN.set(k, v);
}
function placeholders(s: string): string[] {
  return [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
}

// --- Scanner literal (mẫu M6/N8: tách comment + string-literal) --------
const VI_RE =
  /[đĐàáảãạăắằẳẵặâấầẩẫậèẻẽẹêếềểễệìỉĩịòỏõọôốồổỗộơớờởỡợùủũụưứừửữựỳỷỹỵ]/;
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:"'\\])\/\/.*$/gm, "$1");
}
/** Thay ${...} bằng {X}, xử lý đúng ngoặc lồng nhau (${(x as {a: string}).b}). */
function stripInterp(s: string): string {
  let out = "";
  let i = 0;
  while (i < s.length) {
    if (s[i] === "$" && s[i + 1] === "{") {
      let depth = 1;
      let j = i + 2;
      let quote: string | null = null;
      while (j < s.length && depth > 0) {
        const c = s[j];
        if (quote) {
          if (c === "\\") j++;
          else if (c === quote) quote = null;
        } else if (c === '"' || c === "'" || c === "`") quote = c;
        else if (c === "{") depth++;
        else if (c === "}") depth--;
        j++;
      }
      out += "{X}";
      i = j;
    } else {
      out += s[i];
      i++;
    }
  }
  return out;
}
function norm(s: string): string {
  return stripInterp(s.replace(/\\"/g, '"').replace(/\\'/g, "'"))
    .replace(/\{[A-Za-z0-9_]+\}/g, "{X}")
    .replace(/\s+/g, " ")
    .trim();
}
interface Lit {
  file: string;
  line: number;
  kind: "string" | "jsx-text";
  value: string;
}
function extractLiterals(file: string, src: string): Lit[] {
  const out: Lit[] = [];
  const re = /'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/gs;
  let m: RegExpExecArray | null;
  const masked = src.split("");
  while ((m = re.exec(src)) !== null) {
    const raw = m[0];
    const inner = raw.slice(1, -1);
    if (VI_RE.test(inner)) {
      out.push({ file, line: src.slice(0, m.index).split("\n").length, kind: "string", value: inner });
    }
    for (let i = m.index; i < m.index + raw.length; i++) {
      if (masked[i] !== "\n") masked[i] = " ";
    }
  }
  const maskedSrc = masked.join("");
  const jsxRe = />([^<>{}]+)</g;
  while ((m = jsxRe.exec(maskedSrc)) !== null) {
    const text = m[1];
    if (!VI_RE.test(text)) continue;
    const t = text.trim();
    if (!t) continue;
    if (/^[A-Za-z0-9_.$()[\],:;+\-*/= ]+$/.test(t)) continue;
    out.push({ file, line: maskedSrc.slice(0, m.index).split("\n").length, kind: "jsx-text", value: t });
  }
  const seen = new Set<string>();
  return out.filter((o) => {
    const k = `${o.line}:${o.value}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
function readSrc(rel: string): string {
  return readFileSync(`apps/web/src/${rel}`, "utf8");
}

// --- Inventory M6/N8 (đọc như N8 §4 — file làm việc ngoài repo) ---------
interface Verdict {
  file: string;
  value: string;
}
function loadVerdicts(rel: string): Verdict[] {
  const j = JSON.parse(readFileSync(rel, "utf8")) as { verdicts: Verdict[] };
  return j.verdicts;
}
const VERDICT_NORM = new Set<string>();
for (const v of [
  ...loadVerdicts("../goals/capcut-clone-video-editor/hidden_files/round57-n8/verdicts.json"),
  ...loadVerdicts("../goals/capcut-clone-video-editor/hidden_files/round56-m6/verdicts.json"),
]) {
  VERDICT_NORM.add(`${v.file.replace(/^apps\/web\/src\//, "")}::${norm(v.value)}`);
}
const VI_VALUES_NORM = new Set([...VI.values()].map(norm));

// --- Danh sách file quét: 29 file đổi đợt 58 + 7 file migrate 56–57 ----
const SCAN_FILES = [
  "components/BeatSyncModal.tsx",
  "components/CaptionModal.tsx",
  "components/SceneModal.tsx",
  "components/SilenceModal.tsx",
  "components/nested/nestUtils.ts",
  "components/onboarding/WelcomeModal.tsx",
  "components/project/ProjectMenu.tsx",
  "components/project/RenameProjectDialog.tsx",
  "ExportPanel.tsx",
  "Timeline.tsx",
  "desktop.ts",
  "i18n/index.ts",
  "lib/captionFollow.ts",
  "lib/captions.ts",
  "lib/curveFix.ts",
  "lib/gopCache40V2.ts",
  "lib/gopRangeFetch39T3.ts",
  "lib/gopSizeProbe41W4.ts",
  "lib/gopTrialDecode55L8.ts",
  "lib/loadReport.ts",
  "lib/nativeFiles.ts",
  "lib/nestedPreview.ts",
  "lib/pauseSeekCap42X2.ts",
  "lib/projectHistory.ts",
  "lib/projectRepo.ts",
  "lib/reverseDecodeAheadToggle.ts",
  "lib/reverseWebcodecs.ts",
  "lib/seek.ts",
  "lib/subtitles.ts",
  "lib/toast.ts",
  "lib/twoLevelCurve.ts",
  "lib/userLut.ts",
  "media.ts",
  "preview.tsx",
  "sample.ts",
  "store.ts",
];

// --- Danh sách khóa ------------------------------------------------------
// Đợt 60 Q4: 0 key mồ côi — 41 key P7 đã nối thật (28 projectRepo.* +
// 26 key fragment P7 đã gộp) hoặc xóa khỏi dict (13 key lẻ +
// enhance.renderOnly). Danh sách rỗng này là khóa: key mồ côi mới
// xuất hiện sẽ đỏ ở đây. (Trước Q4: ORPHAN_41, 41 key — xem LIMITS P7.)
const ORPHAN_41: string[] = [];
// Họ key truy cập động (template `prefix.${var}.suffix`) — không mồ côi.
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
// Đợt 60 Q4: 0 mẫu tồn đọng — 29 literal diagnostic GOP/loadReport
// (24 lý do GOP + 4 lý do trial-decode + "case xấu") đã nối qua trKey
// nên nay khớp giá trị dict (DICT_VALUE) thay vì CANDIDATE_NEW; các
// literal validate/keyframeFix mới trong projectRepo.ts cũng khớp dict.
// Danh sách rỗng này là khóa: literal tồn đọng mới sẽ đỏ ở test scan.
// (Trước Q4: RESIDUAL 26 mẫu / 29 lần — xem LIMITS P7 §2.1.)
const RESIDUAL: Array<[string, string]> = [];
// 4 fallback trKey "lệch tĩnh" benign: fallback ghi cứng giá trị mà dict
// diễn đạt bằng {var} (vd 128 thay cho {value}, 0.25..4 thay cho
// {min}..{max}) — runtime đã được M5 kiểm chứng (M5 21/21), không phải
// lỗi nối key. Khóa đúng 4 site này; site lệch mới phải đỏ.
const BENIGN_TRKEY_MISMATCH: Array<[string, string]> = [
  ["lib/curveFix.ts", "speedCurve.keyframesTooMany"],
  ["lib/curveFix.ts", "curveFix.moreViolations"],
  ["lib/nestedPreview.ts", "curveErr.kfVRangeDots"],
  ["lib/projectRepo.ts", "projectRepo.keyframeDropped"],
];
// Key luồng P8 (đợt 59 song song) sở hữu — không đề xuất trùng.
const P8_KEYS = [
  "enhance.activeSummary",
  "enhance.badgeTitle",
  "enhance.presetBalanced",
  "enhance.presetCustom",
  "enhance.presetLabel",
  "enhance.presetLight",
  "enhance.presetOff",
  "enhance.presetStrong",
  "enhance.sumDeinterlace",
  "enhance.sumDenoise",
  "enhance.sumStabilize",
];

// --- A. Dict -------------------------------------------------------------
ok("dict: vi==en==2326 key lá, cùng tập key, placeholder khớp, không rỗng", () => {
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
  // 52 key vi==en là hợp lệ (tên riêng, nhãn emoji, mẫu định dạng) — khóa
  // con số để key mới giống hệt hai bên không lọt âm thầm. 48 sau đợt 60;
  // +2 mẫu định dạng gop.cache.belowThreshold / gop.cache.rangeOk từ fragment
  // R6 (parent gộp đợt 61) + 1 mẫu định dạng validation.detail từ fragment
  // R5 (parent gộp đợt 63) — giá trị là chuỗi kỹ thuật {size}/{threshold} / template [{where}] {detail}.
  // +1 key legacyAdopt.noHash từ fragment T7 (parent gộp đợt 66).
  const same = [...VI.keys()].filter((k) => VI.get(k) === EN.get(k));
  assert.equal(same.length, 52, `số key vi==en phải là 52, nhận ${same.length}: ${same.slice(0, 5).join(", ")}`);
});

ok("orphan: 0 key mồ côi (khóa danh sách rỗng), 0 key mới đợt 58", () => {
  let srcAll = "";
  // Quét toàn bộ apps/web/src (không test) + fragments bằng đọc thư mục.
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
  const orphans: string[] = [];
  for (const k of VI.keys()) {
    if (
      srcAll.includes(`"${k}"`) ||
      srcAll.includes(`'${k}'`) ||
      srcAll.includes(`\`${k}\``)
    ) {
      continue;
    }
    if (DYNAMIC_PREFIXES.some((p) => k.startsWith(p))) continue;
    orphans.push(k);
  }
  assert.deepEqual(orphans.sort(), [...ORPHAN_41].sort(), "danh sách key mồ côi lệch");
  const round58Keys = [
    "preview.effectSkippedBadge",
    "preview.effectSkippedToast",
    "preview.nestedSkippedBadge",
    "preview.nestedSkippedToast",
    "captions.translatedTrack",
  ];
  for (const k of round58Keys) {
    assert.ok(!orphans.includes(k), `key mới đợt 58 ${k} không được mồ côi`);
  }
});

ok("fragment O3+O5: 5 key đã gộp vào dict đúng từng chữ, không trùng fragment khác", () => {
  const check = (fragFile: string, expected: number): void => {
    const frag = readJson(`apps/web/src/i18n/fragments/${fragFile}`) as {
      vi: Dict;
      en: Dict;
    };
    const fVi = flatten(frag.vi);
    const fEn = flatten(frag.en);
    assert.equal(fVi.size, expected, `${fragFile} vi phải có ${expected} key`);
    assert.equal(fEn.size, expected, `${fragFile} en phải có ${expected} key`);
    for (const k of fVi.keys()) {
      assert.ok(fEn.has(k), `${fragFile}: en thiếu ${k}`);
      assert.equal(VI.get(k), fVi.get(k), `vi.json lệch giá trị fragment ở ${k}`);
      assert.equal(EN.get(k), fEn.get(k), `en.json lệch giá trị fragment ở ${k}`);
      assert.notEqual(fVi.get(k), fEn.get(k), `${k}: vi phải khác en`);
      assert.deepEqual(placeholders(fVi.get(k)!), placeholders(fEn.get(k)!), `${k}: placeholder lệch`);
    }
  };
  check("round58-o3.json", 4);
  check("round58-o5.json", 1);
  // 5 key đợt 58 không trùng key của fragment khác (các fragment cũ hơn
  // được phép trùng nhau — vd caption.title có ở cả round56-m2 và
  // round56-m4 — nên chỉ khóa riêng 5 key này).
  const o3o5 = new Set([
    "preview.effectSkippedBadge",
    "preview.effectSkippedToast",
    "preview.nestedSkippedBadge",
    "preview.nestedSkippedToast",
    "captions.translatedTrack",
  ]);
  for (const f of readdirSync("apps/web/src/i18n/fragments")) {
    if (f === "round58-o3.json" || f === "round58-o5.json") continue;
    const frag = readJson(`apps/web/src/i18n/fragments/${f}`) as { vi: Dict; en: Dict };
    for (const k of flatten(frag.vi).keys()) {
      assert.ok(!o3o5.has(k), `key đợt 58 ${k} trùng trong fragment ${f}`);
    }
  }
});

ok("P8: 11 key enhance.* nếu đã vào dict thì phải đúng giá trị fragment P8", () => {
  const frag = JSON.parse(
    readFileSync(
      "../goals/capcut-clone-video-editor/hidden_files/round59-p8-fragment.json",
      "utf8",
    ),
  ) as { vi: Dict; en: Dict };
  const fVi = flatten(frag.vi);
  const fEn = flatten(frag.en);
  assert.equal(fVi.size, 11, `fragment P8 vi phải có 11 key, nhận ${fVi.size}`);
  assert.deepEqual([...fVi.keys()].sort(), [...P8_KEYS].sort(), "fragment P8 phải đúng 12 key enhance.*");
  for (const k of P8_KEYS) {
    if (VI.has(k)) assert.equal(VI.get(k), fVi.get(k), `vi.json lệch fragment P8 ở ${k}`);
    if (EN.has(k)) assert.equal(EN.get(k), fEn.get(k), `en.json lệch fragment P8 ở ${k}`);
  }
  // Trạng thái tại lúc viết test (đợt 59, pre-merge): cả 11 key đều chưa vào
  // dict nên enhanceT trả fallback VI ở cả hai locale. Parent đã gộp fragment
  // P8 cuối đợt 59 nên nay key phải CÓ trong dict đúng giá trị fragment
  // (vòng lặp trên đã khóa giá trị từng key).
  assert.ok(VI.has("enhance.badgeTitle"), "enhance.badgeTitle phải có trong dict sau khi parent gộp fragment P8");
});

ok("R6: fragment 50 key gop.* vi/en khớp nhau, placeholder khớp (đã gộp ở parent đợt 61)", () => {
  assert.equal(R6_FRAG_VI.size, 50, `fragment R6 vi phải có 50 key, nhận ${R6_FRAG_VI.size}`);
  assert.equal(R6_FRAG_EN.size, 50, `fragment R6 en phải có 50 key, nhận ${R6_FRAG_EN.size}`);
  for (const k of R6_FRAG_VI.keys()) assert.ok(R6_FRAG_EN.has(k), `fragment R6 en thiếu key ${k}`);
  for (const k of R6_FRAG_EN.keys()) assert.ok(R6_FRAG_VI.has(k), `fragment R6 vi thiếu key ${k}`);
  for (const k of R6_FRAG_VI.keys()) {
    assert.ok(R6_FRAG_VI.get(k)!.length > 0, `${k}: fragment vi rỗng`);
    assert.ok(R6_FRAG_EN.get(k)!.length > 0, `${k}: fragment en rỗng`);
    assert.deepEqual(
      placeholders(R6_FRAG_VI.get(k)!),
      placeholders(R6_FRAG_EN.get(k)!),
      `${k}: placeholder fragment vi/en lệch`,
    );
    // Đã gộp ở parent đợt 61: key PHẢI có trong dict đúng giá trị fragment.
    assert.ok(VI.has(k), `${k}: thiếu trong dict sau khi parent gộp fragment R6`);
    assert.ok(EN.has(k), `${k}: thiếu trong en dict sau khi parent gộp fragment R6`);
    assert.equal(VI.get(k), R6_FRAG_VI.get(k), `${k}: vi.json lệch fragment R6`);
    assert.equal(EN.get(k), R6_FRAG_EN.get(k), `${k}: en.json lệch fragment R6`);
  }
  // Sau khi parent gộp fragment R6 vào dict, các key này phải có trong
  // dict đúng giá trị fragment (vòng lặp kiểm tra giá trị từng key).
  for (const k of R6_FRAG_VI.keys()) {
    if (VI.has(k)) assert.equal(VI.get(k), R6_FRAG_VI.get(k), `vi.json lệch fragment R6 ở ${k}`);
    if (EN.has(k)) assert.equal(EN.get(k), R6_FRAG_EN.get(k), `en.json lệch fragment R6 ở ${k}`);
  }
});

// --- B. Quét literal -----------------------------------------------------
function classifyLit(lit: Lit, srcLines: string[]): string {
  const n = norm(lit.value);
  if (VI_VALUES_NORM.has(n)) return "DICT_VALUE";
  // Fallback trKey(): đuôi tĩnh khớp giá trị dict của key (xét trước
  // DICT_VALUE-PART để template nhiều dòng không nuốt mất phân loại).
  const ctx = srcLines.slice(Math.max(0, lit.line - 4), lit.line).join("\n");
  const trKeyAt = ctx.lastIndexOf("trKey(");
  if (trKeyAt >= 0) {
    // Đợt 61 R6: arg đầu có thể là `lookup` hoặc `this.gopI18nLookup`
    // (reverseWebcodecs) — khớp mọi biểu thức lookup, không chỉ tên biến.
    const keyMatch = ctx.slice(trKeyAt).match(/trKey\(\s*[^,]+,\s*"([^"]+)"/);
    if (keyMatch && VI.has(keyMatch[1])) {
      const tail = n.replace(/^(\{X\}[:.\s>-]*)+/, "");
      if (tail.length >= 6 && norm(VI.get(keyMatch[1])!).includes(tail)) return "WIRED-FALLBACK";
      return `TRKEY-MISMATCH:${keyMatch[1]}`;
    }
    // Key chỉ có trong fragment R6 (phòng thủ: fragment đã gộp vào dict ở
    // parent đợt 61 nên nhánh VI.has ở trên bắt trước; nhánh này chỉ còn tác
    // dụng nếu dict thiếu key): so fallback với giá trị VI của fragment, cùng
    // luật tail như dict.
    if (keyMatch && R6_FRAG_VI.has(keyMatch[1])) {
      const tail = n.replace(/^(\{X\}[:.\s>-]*)+/, "");
      if (tail.length >= 6 && norm(R6_FRAG_VI.get(keyMatch[1])!).includes(tail)) return "WIRED-FALLBACK";
      return `TRKEY-MISMATCH:${keyMatch[1]}`;
    }
    if (keyMatch) return `TRKEY-UNKNOWN-KEY:${keyMatch[1]}`;
  }
  for (const dv of VI_VALUES_NORM) {
    if (dv.length >= 6 && dv.includes(n) && n.length >= 4) return "DICT_VALUE-PART";
  }
  if (VERDICT_NORM.has(`${lit.file}::${n}`)) return "PRE_EXISTING";
  return "CANDIDATE_NEW";
}

ok("scan: 36 file — tồn đọng 0 mẫu/0 lần, 0 jsx-text, mismatch đúng 4 site benign", () => {
  const counts: Record<string, number> = {};
  const residualsFound: Array<[string, string]> = [];
  const mismatchesFound: Array<[string, string]> = [];
  let jsxText = 0;
  let total = 0;
  for (const file of SCAN_FILES) {
    const src = stripComments(readSrc(file));
    const lines = src.split("\n");
    for (const lit of extractLiterals(file, src)) {
      total++;
      if (lit.kind === "jsx-text") jsxText++;
      const cls = classifyLit(lit, lines);
      counts[cls] = (counts[cls] || 0) + 1;
      if (cls === "CANDIDATE_NEW") residualsFound.push([file, norm(lit.value)]);
      if (cls.startsWith("TRKEY-MISMATCH:")) {
        mismatchesFound.push([file, cls.slice("TRKEY-MISMATCH:".length)]);
      }
      if (cls.startsWith("TRKEY-UNKNOWN-KEY:")) {
        assert.fail(`trKey tới key không có trong dict: ${file}:${lit.line} ${cls}`);
      }
    }
  }
  console.log(`    scan: ${total} literal trong ${SCAN_FILES.length} file — ${JSON.stringify(counts)}`);
  assert.equal(jsxText, 0, `còn ${jsxText} JSX-text tiếng Việt trong file đã migrate`);
  // Tồn đọng: literal fallback của P8 (enhance.badgeTitle, Timeline.tsx) tách
  // riêng; sau khi parent gộp fragment P8 cuối đợt 59, literal này khớp giá trị
  // dict nên được xếp DICT_VALUE, không còn là tồn đọng (p8Count phải = 0).
  // Chuỗi fallback vẫn nằm trong source (đúng thiết kế fallback) nhưng không
  // còn đếm vào residualsFound.
  const P8_LIT = "Timeline.tsx::Clip có tăng cường — xem mục Tăng cường video trong Inspector";
  const p8Count = residualsFound.filter(([f, v]) => `${f}::${v}` === P8_LIT).length;
  assert.equal(p8Count, 0, `literal P8 enhance.badgeTitle đã gộp vào dict, không còn là tồn đọng, nhận ${p8Count}`);
  const rest = residualsFound.filter(([f, v]) => `${f}::${v}` !== P8_LIT);
  const residualSet = new Set(rest.map(([f, v]) => `${f}::${v}`));
  const lockedSet = new Set(RESIDUAL.map(([f, v]) => `${f}::${norm(v)}`));
  assert.equal(rest.length, 0, `tồn đọng (trừ P8) phải xuất hiện 0 lần, nhận ${rest.length}: ${rest.slice(0, 3).map(([f, v]) => `${f}::${v}`).join(" | ")}`);
  assert.equal(residualSet.size, 0, `tồn đọng phải có 0 mẫu duy nhất, nhận ${residualSet.size}`);
  for (const k of residualSet) assert.ok(lockedSet.has(k), `tồn đọng lạ chưa khóa: ${k}`);
  for (const k of lockedSet) assert.ok(residualSet.has(k), `tồn đọng đã khóa nhưng không còn thấy: ${k}`);
  assert.deepEqual(
    mismatchesFound.sort(),
    [...BENIGN_TRKEY_MISMATCH].sort(),
    "danh sách fallback trKey lệch tĩnh lệch (chỉ 4 site benign được phép)",
  );
});

ok("source: mọi trKey() trong 36 file đều trỏ tới key có trong dict hoặc fragment R6", () => {
  for (const file of SCAN_FILES) {
    const src = readSrc(file);
    for (const m of src.matchAll(/trKey\(\s*[^,]+,\s*"([^"]+)"/g)) {
      assert.ok(
        VI.has(m[1]) || R6_FRAG_VI.has(m[1]),
        `${file}: trKey tới key không có trong dict lẫn fragment R6: ${m[1]}`,
      );
      assert.ok(
        EN.has(m[1]) || R6_FRAG_EN.has(m[1]),
        `${file}: trKey tới key không có trong en.json lẫn fragment R6: ${m[1]}`,
      );
    }
  }
  // P3 đã sửa skippedEffectReason (truyền {type}); parent gộp fragment P3
  // cuối đợt 59 và đổi fallback không-lookup thành chuỗi nêu tên type.
  const src = readSrc("lib/nestedPreview.ts");
  assert.ok(src.includes(`trKey(lookup, "nested.failsoft.unknownEffectType", { type },`));
  assert.equal(
    skippedEffectReason("sharpen"),
    'type "sharpen" chưa biết, không có đường vẽ trong preview',
  );
});

// --- C. Runtime ------------------------------------------------------------
ok("runtime: kfVRangeDots + cycle trả đúng chuỗi EN của dict khi có lookup", () => {
  const lookupEn = (key: string, vars?: Record<string, string>): string => {
    const raw = EN.get(key) ?? key;
    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (_, name: string) => vars[name] ?? `{${name}}`);
  };
  const throwsMsg = (fn: () => void): string => {
    try {
      fn();
    } catch (e) {
      return (e as Error).message;
    }
    throw new Error("không throw như kỳ vọng");
  };
  // curveErr.kfVRangeDots — dict diễn đạt min/max bằng {var}, fallback ghi
  // cứng 0.25/4; runtime mới là căn cứ đúng (M5 kiểm chứng tương tự).
  // path thực tế là "clipX: speedKeyframes.keyframes[0]" (w trong source).
  assert.equal(
    throwsMsg(() =>
      resolveNestedRampCurve(
        { keyframes: [{ t: 0, v: 9, easing: "linear" }] },
        4,
        "clipX",
        lookupEn,
      ),
    ),
    "clipX: speedKeyframes.keyframes[0].v must be in 0.25..4 (got: 9)",
  );
  assert.equal(EN.get("curveErr.kfVRangeDots"), "{path}.v must be in {min}..{max} (got: {value})");
  // nested.failsoft.cycle — N4 đã khóa chuỗi cứng; ở đây khóa theo dict.
  const nestedPlain = (id: string, inner: unknown[]): Record<string, unknown> => ({
    kind: "nested",
    id,
    start: 0,
    duration: 4,
    in: 0,
    tracks: [{ kind: "video", clips: inner }],
  });
  const video = { kind: "video", id: "x", start: 0, duration: 1, in: 0, out: 1 };
  const skipped = flattenForPreview(
    { tracks: [{ kind: "video", clips: [nestedPlain("n1", [nestedPlain("n1", [video])])] }] },
    lookupEn,
  ).skipped;
  assert.deepEqual(skipped, [`nested "n1" creates a cycle (id already in n1), skipping`]);
  assert.equal(EN.get("nested.failsoft.cycle"), 'nested "{id}" creates a cycle (id already in {path}), skipping');
});

runAll();
