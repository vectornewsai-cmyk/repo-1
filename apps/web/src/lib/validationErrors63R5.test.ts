// validationErrors63R5.test.ts — Phase 9 đợt 63, luồng R5: literal server
// (validate.js 159 + taskErrorPayload 11 + scene phase 2 + job note) nối
// vào giao thức mã lỗi.
//
// Khóa:
//  - Fragment round63-r5.json: 123 key (validation 109 = 108 mã classifier
//    + validation.detail, bridgeErrors 11 TASK_*, scene.phase 2, jobNote 1),
//    vi≠en trừ validation.detail (template cấu trúc, 2 locale giống nhau
//    đúng thiết kế), placeholder vi/en khớp, không rỗng, không trùng
//    fragment khác, ĐÃ gộp vào dict 123/123 key (parent gộp đợt 63 đưa
//    122 key; jobNote.recoveredRestart vào dict ở parent gộp đợt 64 —
//    UI tiêu thụ có từ đợt 64 R8, xem LIMITS §7).
//    Đợt 64 R8: key jobNote ĐÃ có UI tiêu thụ (jobNote64R8.ts + ExportPanel
//    .render-note) và được khai LẠI trong fragment round64-r8.json với giá
//    trị Y HỆT (sẽ gộp vào dict lúc parent gộp đợt 64) — test dưới đây cho
//    phép đúng 1 ngoại lệ trùng này, giá trị lệch là đỏ.
//  - 3 chiều validation: bảng classifier server/render/src/validateCodes.js
//    == key validation.* trong fragment (trừ validation.detail).
//  - Resolver validationErrors.ts: mã cụ thể dịch vi/en, generic
//    VALIDATION_DETAIL hiện nguyên văn qua validation.detail, key vắng /
//    sót {var} / entry rỗng → rớt về "[where] detail" / "".
//  - Scene phase (scenePhase63R5.ts): upload/scan vi/en, phase lạ →
//    message bridge, rỗng → "".
//  - TASK_* qua resolveBridgeApiError với fake t() từ fragment.
//
// Cách chạy (mẫu R5/R6, từ gốc repo; bundle ra scratch ngoài repo):
//   ./node_modules/.bin/esbuild apps/web/src/lib/validationErrors63R5.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/r63r5/r5.test.cjs \
//     && node /tmp/r63r5/r5.test.cjs
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import {
  resolveValidationDetail,
  resolveValidationDetails,
  VALIDATION_DETAIL_CODE,
} from "./validationErrors";
import {
  resolveScenePhaseLabel,
  SCENE_PHASE_KEYS,
} from "./scenePhase63R5";
import {
  BRIDGE_ERROR_CODES,
  resolveBridgeApiError,
  type BridgeApiErrorBody,
} from "./bridgeErrors";

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
  console.log(`R5 validation errors round 63: ${pass}/${queue.length} pass`);
}

type Dict = Record<string, unknown>;
function flatten(d: Dict, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();
  for (const [k, v] of Object.entries(d)) {
    if (typeof v === "string") out.set(prefix + k, v);
    else if (v && typeof v === "object") {
      for (const [kk, vv] of flatten(v as Dict, prefix + k + ".")) out.set(kk, vv);
    }
  }
  return out;
}
function placeholders(s: string): string[] {
  return [...new Set([...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))].sort();
}

const FRAG_PATH = "apps/web/src/i18n/fragments/round63-r5.json";
const frag = JSON.parse(readFileSync(FRAG_PATH, "utf8")) as { vi: Dict; en: Dict };
const FRAG_VI = flatten(frag.vi);
const FRAG_EN = flatten(frag.en);

/** t() giả lập đúng quy ước i18n/index.ts, đọc từ fragment (giả lập dict đã gộp). */
function fakeT(lang: "vi" | "en"): (key: string, vars?: Record<string, string>) => string {
  const dict = lang === "vi" ? FRAG_VI : FRAG_EN;
  return (key: string, vars?: Record<string, string>): string => {
    const raw = dict.get(key) ?? key;
    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (_, name: string) => vars[name] ?? `{${name}}`);
  };
}
/** t() giả lập khi fragment CHƯA gộp (dict thiếu key → trả về chính key). */
function missingKeyT(): (key: string, vars?: Record<string, string>) => string {
  return (key: string): string => key;
}

/** Parse bảng classifier từ validateCodes.js (mỗi entry 1 dòng). */
function parseClassifier(): Map<string, string[]> {
  const src = readFileSync("server/render/src/validateCodes.js", "utf8");
  const out = new Map<string, string[]>();
  for (const line of src.split("\n")) {
    const m = line.match(/^\s*\{\s*code: "([A-Z][A-Z0-9_]*)",\s*re: .*,\s*params: \[([^\]]*)\]\s*\},?$/);
    if (!m) continue;
    const params = m[2].split(",").map((s) => s.trim().replace(/["']/g, "")).filter(Boolean);
    assert.ok(!out.has(m[1]), `classifier trùng mã ${m[1]}`);
    out.set(m[1], params);
  }
  return out;
}
const CLASSIFIER = parseClassifier();

ok("fragment: 123 key, vi≠en trừ validation.detail, placeholder khớp, không rỗng", () => {
  assert.equal(FRAG_VI.size, 123, `fragment vi phải có 123 key, nhận ${FRAG_VI.size}`);
  assert.equal(FRAG_EN.size, 123, `fragment en phải có 123 key, nhận ${FRAG_EN.size}`);
  const counts: Record<string, number> = {};
  for (const k of FRAG_VI.keys()) counts[k.split(".")[0]] = (counts[k.split(".")[0]] ?? 0) + 1;
  assert.deepEqual(counts, { validation: 109, bridgeErrors: 11, scene: 2, jobNote: 1 },
    `phân bổ key theo namespace lệch: ${JSON.stringify(counts)}`);
  for (const k of FRAG_VI.keys()) {
    assert.ok(FRAG_EN.has(k), `fragment en thiếu key ${k}`);
    const v = FRAG_VI.get(k)!;
    const e = FRAG_EN.get(k)!;
    assert.ok(v.length > 0, `${k}: vi rỗng`);
    assert.ok(e.length > 0, `${k}: en rỗng`);
    // Ngoại lệ duy nhất: validation.detail là template cấu trúc
    // "[{where}] {detail}" — 2 locale giống nhau đúng thiết kế.
    if (k === "validation.detail") {
      assert.equal(v, e, `${k}: template cấu trúc phải giống nhau 2 locale`);
    } else {
      assert.notEqual(v, e, `${k}: vi phải khác en`);
    }
    assert.deepEqual(placeholders(v), placeholders(e), `${k}: placeholder vi/en lệch`);
  }
  for (const k of FRAG_EN.keys()) assert.ok(FRAG_VI.has(k), `fragment vi thiếu key ${k}`);
  // Mọi template validation đều bắt đầu bằng tiền tố "[{where}] " (giữ
  // định dạng chuỗi cũ "[where] detail" mà web/export đã quen).
  for (const k of FRAG_VI.keys()) {
    if (!k.startsWith("validation.")) continue;
    assert.ok(FRAG_VI.get(k)!.startsWith("[{where}] "), `${k}: template validation phải bắt đầu "[{where}] "`);
    assert.ok(placeholders(FRAG_VI.get(k)!).includes("where"), `${k}: template validation thiếu {where}`);
  }
});

ok("fragment: 123/123 key ĐÃ gộp vào dict (post-merge đợt 63 + parent gộp đợt 64 đưa jobNote vào dict; UI tiêu thụ có từ đợt 64 R8), không trùng fragment khác trừ jobNote ở round64-r8", () => {
  const viDict = flatten(JSON.parse(readFileSync("apps/web/src/i18n/vi.json", "utf8")) as Dict);
  const enDict = flatten(JSON.parse(readFileSync("apps/web/src/i18n/en.json", "utf8")) as Dict);
  for (const k of FRAG_VI.keys()) {
    // jobNote.recoveredRestart: parent gộp đợt 63 KHÔNG đưa vào dict (chưa
    // có UI tiêu thụ — R5 LIMITS §6; fragment vẫn giữ key cho đợt sau).
    // Đợt 64 R8 ĐÃ làm UI tiêu thụ (jobNote64R8.ts + ExportPanel) nên key
    // được khai lại trong fragment round64-r8.json và parent gộp đợt 64
    // ĐÃ đưa vào dict — assert "đã có" + đúng giá trị fragment.
    if (k === "jobNote.recoveredRestart") {
      assert.ok(viDict.has(k), `${k}: thiếu trong vi.json (parent gộp đợt 64 phải đưa key này vào dict)`);
      assert.ok(enDict.has(k), `${k}: thiếu trong en.json`);
      assert.equal(viDict.get(k), FRAG_VI.get(k), `${k}: giá trị vi.json lệch fragment`);
      assert.equal(enDict.get(k), FRAG_EN.get(k), `${k}: giá trị en.json lệch fragment`);
      continue;
    }
    assert.ok(viDict.has(k), `${k}: thiếu trong vi.json (parent gộp đợt 63 phải đưa key này vào dict)`);
    assert.ok(enDict.has(k), `${k}: thiếu trong en.json`);
    assert.equal(viDict.get(k), FRAG_VI.get(k), `${k}: giá trị vi.json lệch fragment`);
    assert.equal(enDict.get(k), FRAG_EN.get(k), `${k}: giá trị en.json lệch fragment`);
  }
  // Không trùng bất kỳ fragment nào khác trong apps/web/src/i18n/fragments/,
  // TRỪ jobNote.recoveredRestart ở round64-r8.json (đợt 64 R8 khai lại để
  // parent gộp vào dict — giá trị vi/en phải Y HỆT round63-r5, lệch là đỏ).
  const dir = "apps/web/src/i18n/fragments";
  for (const f of readdirSync(dir)) {
    if (f === "round63-r5.json") continue;
    const other = JSON.parse(readFileSync(`${dir}/${f}`, "utf8")) as { vi?: Dict; en?: Dict };
    for (const lang of ["vi", "en"] as const) {
      if (!other[lang]) continue;
      const otherFlat = flatten(other[lang] as Dict);
      for (const k of otherFlat.keys()) {
        if (f === "round64-r8.json" && k === "jobNote.recoveredRestart") {
          const mine = lang === "vi" ? FRAG_VI.get(k) : FRAG_EN.get(k);
          assert.equal(otherFlat.get(k), mine, `key ${k} ở ${f} lệch giá trị round63-r5 (trùng key phải đồng giá trị)`);
          continue;
        }
        assert.ok(!FRAG_VI.has(k), `key ${k} trùng trong fragment ${f}`);
      }
    }
  }
});

ok("3 chiều validation: classifier server == key validation.* fragment == template param", () => {
  assert.equal(CLASSIFIER.size, 108, `classifier phải có 108 mã, nhận ${CLASSIFIER.size}`);
  for (const [code, params] of CLASSIFIER) {
    const key = `validation.${code}`;
    assert.ok(FRAG_VI.has(key), `fragment thiếu mã classifier ${code}`);
    assert.ok(FRAG_EN.has(key), `fragment en thiếu mã classifier ${code}`);
    // Template phải dùng HẾT param classifier, chỉ dùng placeholder
    // trong {where} ∪ params ∪ {detail} (detail có trong mọi entry).
    const ph = placeholders(FRAG_VI.get(key)!);
    for (const p of params) assert.ok(ph.includes(p), `${code}: template thiếu param ${p}`);
    for (const p of ph) {
      assert.ok(p === "where" || params.includes(p) || p === "detail", `${code}: placeholder ${p} không thuộc where/params/detail`);
    }
  }
  for (const k of FRAG_VI.keys()) {
    if (!k.startsWith("validation.") || k === "validation.detail") continue;
    assert.ok(CLASSIFIER.has(k.slice("validation.".length)), `fragment có mã ${k} nhưng classifier không có`);
  }
});

ok("resolver validation: mã cụ thể dịch vi/en, đủ tham số", () => {
  const tVi = fakeT("vi");
  const tEn = fakeT("en");
  const cases: Array<[Record<string, unknown>, string, string]> = [
    [
      { where: "tracks[0].clips[0]", code: "NUMBER_MIN_0", params: { detail: 'start phải là số >= 0, nhận được: -1', field: "start", value: "-1" } },
      "[tracks[0].clips[0]] start phải là số >= 0, nhận được: -1",
      "[tracks[0].clips[0]] start must be a number >= 0, got: -1",
    ],
    [
      { where: "tracks[0].clips[0]", code: "SPEED_RANGE", params: { detail: "speed phải trong khoảng 0.25–4, nhận được: 5", min: "0.25", max: "4", value: "5" } },
      "[tracks[0].clips[0]] speed phải trong khoảng 0.25–4, nhận được: 5",
      "[tracks[0].clips[0]] speed must be in range 0.25–4, got: 5",
    ],
    [
      { where: "tracks[0]", code: "TRACKS_EMPTY", params: { detail: "tracks phải có ít nhất 1 track" } },
      "[tracks[0]] mảng rỗng — không có gì để render",
      "[tracks[0]] empty array — nothing to render",
    ],
  ];
  for (const [entry, wantVi, wantEn] of cases) {
    assert.equal(resolveValidationDetail(entry, tVi), wantVi, `${(entry as { code: string }).code} vi`);
    assert.equal(resolveValidationDetail(entry, tEn), wantEn, `${(entry as { code: string }).code} en`);
  }
});

ok("resolver validation: generic / key vắng / sót {var} / entry rỗng → fallback", () => {
  const tVi = fakeT("vi");
  const tEn = fakeT("en");
  // Generic VALIDATION_DETAIL (sub-validator chưa tách) → template
  // validation.detail, hiện nguyên văn chuỗi VI cũ.
  const generic = { where: "clip \"c1\"", code: VALIDATION_DETAIL_CODE, params: { detail: 'mask "m" không hợp lệ' } };
  assert.equal(resolveValidationDetail(generic, tVi), '[clip "c1"] mask "m" không hợp lệ');
  assert.equal(resolveValidationDetail(generic, tEn), '[clip "c1"] mask "m" không hợp lệ');
  // Mã cụ thể nhưng key chưa gộp (t trả key) → rớt về "[where] detail".
  const missing = { where: "tracks[0]", code: "TRACKS_EMPTY", params: { detail: "tracks phải có ít nhất 1 track" } };
  assert.equal(resolveValidationDetail(missing, missingKeyT()), "[tracks[0]] tracks phải có ít nhất 1 track");
  // Thiếu param → template còn {var} → rớt về "[where] detail".
  const shortParams = { where: "tracks[0].clips[0]", code: "NUMBER_MIN_0", params: { detail: "x", field: "start" } };
  assert.equal(resolveValidationDetail(shortParams, tVi), "[tracks[0].clips[0]] x");
  // Entry rỗng / null → "" (caller lọc).
  assert.equal(resolveValidationDetail(null, tVi), "");
  assert.equal(resolveValidationDetail({}, tVi), "");
  assert.equal(resolveValidationDetail({ where: "", code: VALIDATION_DETAIL_CODE, params: { detail: "   " } }, tVi), "");
  // Mã cụ thể + where, dù detail rỗng: template vẫn có nội dung tĩnh
  // nên trả chuỗi dịch (không phải "").
  assert.equal(resolveValidationDetail({ where: "w", code: "TRACKS_EMPTY", params: { detail: "   " } }, tVi), "[w] mảng rỗng — không có gì để render");
  // Danh sách: giữ thứ tự server, bỏ dòng rỗng.
  const lines = resolveValidationDetails(
    [
      { where: "a", code: "TRACKS_EMPTY", params: { detail: "d1" } },
      null as never,
      { where: "b", code: VALIDATION_DETAIL_CODE, params: { detail: "d2" } },
    ],
    tVi,
  );
  assert.deepEqual(lines, ["[a] mảng rỗng — không có gì để render", "[b] d2"]);
  assert.deepEqual(resolveValidationDetails(null, tVi), []);
  assert.deepEqual(resolveValidationDetails("không phải mảng" as never, tVi), []);
});

ok("resolver validation: mọi mã đều render được ở cả 2 locale (param giả từ template)", () => {
  for (const lang of ["vi", "en"] as const) {
    const t = fakeT(lang);
    for (const [code, params] of CLASSIFIER) {
      const entry = {
        where: "W",
        code,
        params: Object.fromEntries([...params, "detail"].map((p) => [p, "X"])),
      };
      const out = resolveValidationDetail(entry, t);
      assert.ok(!out.includes("{"), `${code} ${lang}: còn sót placeholder trong "${out}"`);
      assert.ok(!out.includes(`validation.${code}`), `${code} ${lang}: lộ key`);
      assert.ok(out.startsWith("[W] "), `${code} ${lang}: thiếu tiền tố "[W] " trong "${out}"`);
    }
  }
});

ok("scene phase: upload/scan vi/en, phase lạ → message bridge, rỗng → \"\"", () => {
  assert.deepEqual([...SCENE_PHASE_KEYS], ["upload", "scan"], "SCENE_PHASE_KEYS phải khớp SCENE_PHASE_LABELS của bridge");
  assert.equal(resolveScenePhaseLabel("upload", "Đã nhận file, chuẩn bị…", "vi"), "Đã nhận file, chuẩn bị…");
  assert.equal(resolveScenePhaseLabel("upload", "Đã nhận file, chuẩn bị…", "en"), "File received, preparing…");
  assert.equal(resolveScenePhaseLabel("scan", "Đang quét chuyển cảnh…", "vi"), "Đang quét chuyển cảnh (video dài có thể mất vài phút)…");
  assert.equal(resolveScenePhaseLabel("scan", "Đang quét chuyển cảnh…", "en"), "Scanning for scene cuts (long videos may take a few minutes)…");
  // Phase lạ → message bridge gửi kèm; không có message → "".
  assert.equal(resolveScenePhaseLabel("weird", "Chuỗi bridge gửi kèm.", "en"), "Chuỗi bridge gửi kèm.");
  assert.equal(resolveScenePhaseLabel("weird", undefined, "en"), "");
  assert.equal(resolveScenePhaseLabel(undefined, "Chuỗi bridge.", "en"), "Chuỗi bridge.");
  assert.equal(resolveScenePhaseLabel(undefined, undefined, "en"), "");
  assert.equal(resolveScenePhaseLabel("upload", "   ", "en"), "File received, preparing…");
  // En thiếu key → fallback vi (đúng quy ước i18n/index.ts).
  const table = { vi: { upload: "VI upload" }, en: {} as Record<string, string> };
  assert.equal(resolveScenePhaseLabel("upload", "msg", "en", table), "VI upload");
});

ok("TASK_*: 11 mã trong fragment + tập mã web, resolver dịch vi/en", () => {
  const taskCodes = [
    "TASK_CAPTION_FAILED", "TASK_REFRAME_FAILED", "TASK_REFRAME_ANALYZE_FAILED",
    "TASK_BEATS_FAILED", "TASK_BGREMOVE_FAILED", "TASK_SILENCE_FAILED",
    "TASK_SCENE_FAILED", "TASK_TRANSLATE_FAILED", "TASK_TTS_FAILED",
    "TASK_TTS_CLONE_FAILED", "TASK_PROXY_FAILED",
  ];
  for (const code of taskCodes) {
    assert.ok(BRIDGE_ERROR_CODES.has(code), `tập mã web thiếu ${code}`);
    assert.ok(FRAG_VI.has(`bridgeErrors.${code}`), `fragment thiếu ${code}`);
  }
  const tVi = fakeT("vi");
  const tEn = fakeT("en");
  const cases: Array<[BridgeApiErrorBody, string, string]> = [
    [{ error: "Caption thất bại.", errorCode: "TASK_CAPTION_FAILED" }, "Caption thất bại.", "Caption failed."],
    [{ error: "Tạo proxy thất bại.", errorCode: "TASK_PROXY_FAILED" }, "Tạo proxy thất bại.", "Proxy creation failed."],
    [{ error: "TTS thất bại.", errorCode: "TASK_TTS_FAILED" }, "TTS thất bại.", "TTS failed."],
    [{ error: "Tách cảnh thất bại.", errorCode: "TASK_SCENE_FAILED" }, "Tách cảnh thất bại.", "Scene detection failed."],
  ];
  for (const [body, wantVi, wantEn] of cases) {
    assert.equal(resolveBridgeApiError(body, tVi, "FALLBACK"), wantVi, `${body.errorCode} vi`);
    assert.equal(resolveBridgeApiError(body, tEn, "FALLBACK"), wantEn, `${body.errorCode} en`);
  }
  // Mọi TASK_* đều render được ở cả 2 locale, không lộ key.
  for (const lang of ["vi", "en"] as const) {
    const t = fakeT(lang);
    for (const code of taskCodes) {
      const out = resolveBridgeApiError({ error: "chuỗi cũ", errorCode: code }, t, "FALLBACK");
      assert.ok(!out.includes("{"), `${code} ${lang}: còn sót placeholder`);
      assert.ok(!out.includes(`bridgeErrors.${code}`), `${code} ${lang}: lộ key`);
      assert.notEqual(out, "FALLBACK", `${code} ${lang}: rớt về fallback`);
    }
  }
});

runAll();
