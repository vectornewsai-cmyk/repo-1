// modalClasses59P4.test.ts — Phase 9 đợt 59, luồng P4: đóng nợ LIMITS
// đợt 58 O4 §5–§6.5 — còn class CSS chưa định nghĩa:
//   `caption-modal` (CaptionModal), `modal-x` / `modal-label` /
//   `modal-hint` / `modal-err` (SilenceModal), và `<p className="error">`
//   top-level của BeatSyncModal (ngoài mọi `.modal-body`, chỉ có rule
//   scoped `.modal-body .error` nên không đỏ).
//
// PHƯƠNG PHÁP (ghi rõ): test TĨNH trên source, không render React —
// repo không có jsdom trong devDeps và component kéo cả store/i18n nên
// không bundle được độc lập bằng esbuild. Khóa 3 bất biến theo đúng mẫu
// O4 (modalCard58O4.test.ts) + N1 (silenceModal57N1.test.ts):
//   (a) 3 modal trong phạm vi chỉ dùng class ĐÃ định nghĩa trong CSS của
//       repo (styles.css + mobile.css + components/*/*.css), đối chiếu
//       bằng tập token class trích từ selector; class scoped
//       (`.modal-body .muted/.error/.warn`, `.silence-list .mono/.dim`)
//       chỉ tính là "đã định nghĩa" khi lần dùng nằm trong đúng tổ tiên
//       (kiểm tra bằng span lồng nhau, cùng helper divSpans của O4);
//   (b) footer `.modal-actions` vẫn là CON TRỰC TIẾP của `.modal`,
//       ngoài `.modal-body` (không đổi cấu trúc khi sửa class);
//   (c) mọi key i18n giữ nguyên (không đổi key, không đổi literal):
//       Caption 49 key / 55 call site, Silence 25 key / 28 call site,
//       BeatSync 26 key / 29 call site (khớp O4).
// Bằng chứng động (headed thật, bước config ở 1440x900 + 1280x720):
// xem docs/PHASE9_ROUND59_P4_MODAL_CLASSES_LIMITS.md.
//
// Chạy bằng esbuild bundle (mẫu các test lib khác, chạy từ gốc repo):
//   ./node_modules/.bin/esbuild apps/web/src/lib/modalClasses59P4.test.ts \
//     --bundle --platform=node --format=cjs \
//     --outfile=/tmp/round59-p4/modalClasses59P4.test.cjs \
//     && node /tmp/round59-p4/modalClasses59P4.test.cjs
// (Dùng --format=cjs nên KHÔNG dùng import.meta.url — đường dẫn resolve
// từ process.cwd(), chạy từ gốc repo.)
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

/** Tìm thư mục apps/web/src thật từ cwd (gốc repo hoặc apps/web). */
function findSrc(): string {
  const candidates = [
    resolve(process.cwd(), "apps/web/src"),
    resolve(process.cwd(), "src"),
  ];
  for (const c of candidates) {
    if (existsSync(join(c, "components", "CaptionModal.tsx"))) return c;
  }
  throw new Error(`không tìm thấy apps/web/src (chạy từ gốc repo; đã thử: ${candidates.join(", ")})`);
}
const SRC_DIR = findSrc();
const CAPTION = readFileSync(join(SRC_DIR, "components", "CaptionModal.tsx"), "utf8");
const SILENCE = readFileSync(join(SRC_DIR, "components", "SilenceModal.tsx"), "utf8");
const BEAT = readFileSync(join(SRC_DIR, "components", "BeatSyncModal.tsx"), "utf8");

let pass = 0;
let total = 0;
function check(name: string, fn: () => void): void {
  total++;
  fn();
  pass++;
  console.log(`  ok ${total} - ${name}`);
}

// ---- Tập class đã định nghĩa: token sau '.' trong selector của mọi .css ----
function definedClasses(dir: string): Set<string> {
  const out = new Set<string>();
  const walk = (d: string) => {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) { walk(p); continue; }
      if (!f.endsWith(".css")) continue;
      const css = readFileSync(p, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
      for (const m of css.matchAll(/([^{}]+)\{/g)) {
        const sel = m[1].trim();
        if (!sel || sel.startsWith("@")) continue;
        for (const t of sel.matchAll(/\.([A-Za-z_][\w-]*)/g)) out.add(t[1]);
      }
    }
  };
  walk(dir);
  return out;
}
const DEFINED = definedClasses(SRC_DIR);

/** Mọi class token dùng trong file (className="..." + literal trong className={...}). */
function usedClasses(src: string): string[] {
  const out: string[] = [];
  for (const m of src.matchAll(/className=(["'])(.*?)\1/gs)) out.push(...m[2].split(/\s+/).filter(Boolean));
  for (const m of src.matchAll(/className=\{([^{}]*)\}/g)) {
    for (const lit of m[1].matchAll(/"([^"]*)"|'([^']*)'/g)) {
      out.push(...(lit[1] ?? lit[2]).split(/\s+/).filter(Boolean));
    }
  }
  return out;
}

// ---- Quét span của các <div ...> (đếm lồng nhau) — y hệt helper O4 ----
interface Span { start: number; end: number }
function divSpans(src: string, pred: (tag: string) => boolean): Span[] {
  const out: Span[] = [];
  const openRe = /<div\b[^>]*>/g;
  const closeRe = /<\/div>/g;
  const tokens: Array<{ pos: number; kind: "open" | "close"; text: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = openRe.exec(src)) !== null) {
    if (!/\/>$/.test(m[0])) tokens.push({ pos: m.index, kind: "open", text: m[0] });
  }
  while ((m = closeRe.exec(src)) !== null) tokens.push({ pos: m.index, kind: "close", text: m[0] });
  tokens.sort((a, b) => a.pos - b.pos);
  for (const t of tokens) {
    if (t.kind !== "open" || !pred(t.text)) continue;
    let depth = 0;
    for (const u of tokens) {
      if (u.pos < t.pos) continue;
      if (u.kind === "open") depth++;
      else depth--;
      if (depth === 0) { out.push({ start: t.pos, end: u.pos + u.text.length }); break; }
    }
  }
  return out;
}
const isBody = (tag: string) => tag.includes('className="modal-body"');
const isActions = (tag: string) => tag.includes('className="modal-actions"');
const isDialog = (tag: string) =>
  tag.includes('className="modal"') || tag.includes('className="modal caption-modal"');

/** Mọi lần dùng class scoped phải nằm trong đúng tổ tiên (span). */
function checkScopedInBody(label: string, src: string, cls: string): void {
  const bodies = divSpans(src, isBody);
  const positions = [...src.matchAll(new RegExp(`className="${cls}"`, "g"))].map((m) => m.index ?? -1);
  check(`${label}: mọi className="${cls}" nằm trong .modal-body`, () => {
    assert.ok(positions.length > 0, `${label}: không tìm thấy className="${cls}" nào`);
    for (const p of positions) {
      const inside = bodies.some((b) => p > b.start && p < b.end);
      assert.ok(inside, `${label}: className="${cls}" @${p} nằm ngoài .modal-body (không có style)`);
    }
  });
}

function checkFooterStructure(label: string, src: string): void {
  const bodies = divSpans(src, isBody);
  const actions = divSpans(src, isActions);
  const dialogs = divSpans(src, isDialog);
  check(`${label}: không modal-actions nào nằm trong modal-body`, () => {
    for (const a of actions) {
      const inside = bodies.some((b) => a.start > b.start && a.end < b.end);
      assert.ok(!inside, `${label}: modal-actions @${a.start} còn nằm trong modal-body`);
    }
  });
  check(`${label}: mọi modal-actions nằm trong dialog .modal`, () => {
    for (const a of actions) {
      const inside = dialogs.some((d) => a.start > d.start && a.end < d.end);
      assert.ok(inside, `${label}: modal-actions @${a.start} nằm ngoài dialog`);
    }
  });
}

function checkI18n(label: string, src: string, expectedKeys: string[], expectedCalls: number): void {
  check(`${label}: đủ ${expectedKeys.length} key i18n, ${expectedCalls} call site — không thêm/bớt key`, () => {
    const found = [...src.matchAll(/\bt\("([a-zA-Z.]+)"/g)].map((m) => m[1]);
    assert.deepEqual([...new Set(found)].sort(), [...expectedKeys].sort());
    assert.equal(found.length, expectedCalls, `số call site t() phải = ${expectedCalls}`);
  });
}

// ================= CaptionModal =================
check("Caption: không còn caption-modal trong JSX; card là class modal đã định nghĩa", () => {
  assert.ok(!CAPTION.includes("caption-modal"), "còn dùng caption-modal chưa định nghĩa");
  assert.equal((CAPTION.match(/className="modal"/g) || []).length, 1, "phải có đúng 1 card .modal");
});
check("Caption: mọi class dùng trong file đều đã định nghĩa trong CSS", () => {
  const bad = [...new Set(usedClasses(CAPTION))].filter((c) => !DEFINED.has(c));
  assert.deepEqual(bad, [], `class chưa định nghĩa: ${bad.join(", ")}`);
});
checkScopedInBody("Caption", CAPTION, "muted");
checkScopedInBody("Caption", CAPTION, "warn");
checkScopedInBody("Caption", CAPTION, "error");
check("Caption: muted small vẫn trong .modal-body", () => {
  const bodies = divSpans(CAPTION, isBody);
  const positions = [...CAPTION.matchAll(/className="muted small"/g)].map((m) => m.index ?? -1);
  assert.ok(positions.length > 0, "không tìm thấy muted small");
  for (const p of positions) {
    assert.ok(bodies.some((b) => p > b.start && p < b.end), `muted small @${p} ngoài .modal-body`);
  }
});
checkFooterStructure("Caption", CAPTION);
checkI18n("Caption", CAPTION, [
  "bgremove.bridgeHttp", "bgremove.cancel", "caption.alignNote",
  "caption.apply", "caption.applyExtra", "caption.bridgeDropped",
  "caption.cancelled", "caption.cueError", "caption.dropSentence",
  "caption.exportEmpty", "caption.exportIncludes", "caption.exportProject",
  "caption.exportSrt", "caption.exportVtt", "caption.failed",
  "caption.found", "caption.foundPlain", "caption.highlightColor",
  "caption.importFile", "caption.imported", "caption.importedWithErrors",
  "caption.karaokeHint", "caption.keepSentence", "caption.mediaGone",
  "caption.noCues", "caption.noCuesInFile", "caption.noMedia",
  "caption.noMediaInLibrary", "caption.noTranslate",
  "caption.noWordTimestamps", "caption.orImport", "caption.processing",
  "caption.readFileFailed", "caption.recognizeWith", "caption.redo",
  "caption.running", "caption.spokenLang", "caption.start", "caption.title",
  "caption.titleIcon", "caption.translateTo", "caption.translateToLabel",
  "caption.translateWith", "caption.translated", "caption.translatedPlain",
  "caption.translating", "caption.uploading", "common.bridgeConn",
  "common.close",
], 55);

// ================= SilenceModal =================
check("Silence: không còn modal-x / modal-label / modal-hint / modal-err trong JSX", () => {
  for (const c of ["modal-x", "modal-label", "modal-hint", "modal-err"]) {
    assert.ok(!SILENCE.includes(c), `còn dùng ${c} chưa định nghĩa`);
  }
});
check("Silence: nút ✕ dùng icon-btn (đã định nghĩa, cùng mẫu CaptionModal)", () => {
  const m = SILENCE.match(/<button className="icon-btn"[^>]*>✕<\/button>/);
  assert.ok(m, "nút đóng phải là <button className=\"icon-btn\">✕</button>");
});
check("Silence: đúng 3 label dùng field (đã định nghĩa)", () => {
  assert.equal((SILENCE.match(/<label className="field">/g) || []).length, 3, "phải có đúng 3 <label className=\"field\">");
});
check("Silence: đúng 3 hint dùng muted, đúng 3 lỗi dùng error", () => {
  assert.equal((SILENCE.match(/<p className="muted">/g) || []).length, 3, "phải có đúng 3 <p className=\"muted\">");
  assert.equal((SILENCE.match(/<p className="error">/g) || []).length, 3, "phải có đúng 3 <p className=\"error\">");
});
check("Silence: mọi class dùng trong file đều đã định nghĩa trong CSS", () => {
  const bad = [...new Set(usedClasses(SILENCE))].filter((c) => !DEFINED.has(c));
  assert.deepEqual(bad, [], `class chưa định nghĩa: ${bad.join(", ")}`);
});
checkScopedInBody("Silence", SILENCE, "muted");
checkScopedInBody("Silence", SILENCE, "error");
check("Silence: đủ 4 modal-body + 4 modal-actions (config/running/review/done)", () => {
  assert.equal(divSpans(SILENCE, isBody).length, 4, "số modal-body phải = 4");
  assert.equal(divSpans(SILENCE, isActions).length, 4, "số modal-actions phải = 4");
});
checkFooterStructure("Silence", SILENCE);
check("Silence: modal-ok giữ nguyên (đã định nghĩa, không đụng)", () => {
  assert.ok(SILENCE.includes('className="modal-ok"'), "mất modal-ok");
});
checkI18n("Silence", SILENCE, [
  "bgremove.bridgeHttp", "bgremove.cancel", "common.bridgeConn",
  "common.close", "silence.analyze", "silence.analyzing",
  "silence.applyFailed", "silence.backToParams", "silence.cancelled",
  "silence.clipLabel", "silence.cut", "silence.cutDone", "silence.foundAll",
  "silence.foundPartial", "silence.intro", "silence.minDuration",
  "silence.noClip", "silence.noClipInTimeline", "silence.noSilenceFound",
  "silence.noSilenceInRange", "silence.noSource", "silence.threshold",
  "silence.thresholdHint", "silence.title", "silence.titleIcon",
], 28);

// ================= BeatSyncModal =================
check("BeatSync: không còn <p className=\"error\"> top-level (ngoài .modal-body)", () => {
  const bodies = divSpans(BEAT, isBody);
  const positions = [...BEAT.matchAll(/<p className="error">/g)].map((m) => m.index ?? -1);
  assert.ok(positions.length > 0, "không tìm thấy <p className=\"error\"> nào (mất báo lỗi?)");
  for (const p of positions) {
    const inside = bodies.some((b) => p > b.start && p < b.end);
    assert.ok(inside, `error @${p} còn nằm ngoài .modal-body (không đỏ)`);
  }
});
check("BeatSync: mỗi bước config/running/review đều có error trong body, là con đầu của body", () => {
  const bodies = divSpans(BEAT, isBody);
  // 4 body: noClip (không có error) + config/running/review (có error đầu body).
  const withErr = bodies.filter((b) => BEAT.slice(b.start, b.end).includes('className="error"'));
  assert.equal(withErr.length, 3, "phải có đúng 3 body chứa error (config/running/review; noClip không có)");
  for (const b of withErr) {
    const inner = BEAT.slice(b.start, b.end);
    const openEnd = inner.indexOf(">") + 1;
    const firstTag = inner.slice(openEnd).match(/<(p|div|label|button|ul|span)\b[^>]*>/)!;
    assert.ok(firstTag[0].includes('className="error"'), `error không phải con đầu của body @${b.start}: thẻ đầu là ${firstTag[0].slice(0, 60)}`);
  }
});
check("BeatSync: mọi class dùng trong file đều đã định nghĩa trong CSS", () => {
  const bad = [...new Set(usedClasses(BEAT))].filter((c) => !DEFINED.has(c));
  assert.deepEqual(bad, [], `class chưa định nghĩa: ${bad.join(", ")}`);
});
check("BeatSync: đủ 4 modal-body + 3 modal-actions (như O4, không đổi cấu trúc)", () => {
  assert.equal(divSpans(BEAT, isBody).length, 4, "số modal-body phải = 4");
  assert.equal(divSpans(BEAT, isActions).length, 3, "số modal-actions phải = 3");
});
checkFooterStructure("BeatSync", BEAT);
checkI18n("BeatSync", BEAT, [
  "beatsync.analyze", "beatsync.analyzeFailed", "beatsync.analyzing",
  "beatsync.apply", "beatsync.applyFailed", "beatsync.bridgeError",
  "beatsync.cutTitle", "beatsync.downbeatOnly", "beatsync.found",
  "beatsync.intro", "beatsync.maxBpm", "beatsync.meter",
  "beatsync.meterUnknown", "beatsync.minBpm", "beatsync.noClip",
  "beatsync.noCutPoints", "beatsync.noSource", "beatsync.section",
  "beatsync.sectionNote", "beatsync.sectionPeak", "beatsync.sectionRepeat",
  "beatsync.structure", "beatsync.structureError", "beatsync.title",
  "bgremove.cancel", "common.close",
], 29);

// ================= Hợp đồng CSS =================
function ruleBlock(css: string, selector: string): string {
  const m = css.match(new RegExp(`\\${selector}\\s*\\{([^}]*)\\}`, "s"));
  assert.ok(m, `không tìm thấy rule ${selector} trong styles.css`);
  return m![1];
}
const CSS = readFileSync(join(SRC_DIR, "styles.css"), "utf8");
check("CSS .icon-btn: nút tròn 30px (đủ cho nút ✕ của SilenceModal)", () => {
  const b = ruleBlock(CSS, ".icon-btn");
  assert.ok(/width:\s*30px/.test(b), ".icon-btn thiếu width:30px");
  assert.ok(/border-radius:\s*50%/.test(b), ".icon-btn thiếu border-radius:50%");
});
check("CSS .field: block label (đủ cho label của SilenceModal)", () => {
  const b = ruleBlock(CSS, ".field");
  assert.ok(/display:\s*block/.test(b), ".field thiếu display:block");
});
check("CSS .modal-body .muted / .error: đã định nghĩa (đỏ #ff7b7b cho lỗi)", () => {
  const css = CSS;
  assert.ok(/\.modal-body\s+\.muted\s*\{[^}]*color:\s*var\(--muted\)/.test(css), "thiếu .modal-body .muted");
  assert.ok(/\.modal-body\s+\.error\s*\{[^}]*color:\s*#ff7b7b/.test(css), "thiếu .modal-body .error (color #ff7b7b)");
  assert.ok(/\.modal-body\s+\.warn\s*\{/.test(css), "thiếu .modal-body .warn");
});
check("CSS: caption-modal / modal-x / modal-label / modal-hint / modal-err thật sự chưa từng được định nghĩa (không thêm CSS lén)", () => {
  const cssFiles: string[] = [];
  const walk = (d: string) => {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) { walk(p); continue; }
      if (f.endsWith(".css")) cssFiles.push(p);
    }
  };
  walk(SRC_DIR);
  assert.ok(cssFiles.length >= 3, `chỉ thấy ${cssFiles.length} file css (kỳ vọng >= 3)`);
  for (const cls of ["caption-modal", "modal-x", "modal-label", "modal-hint", "modal-err"]) {
    for (const p of cssFiles) {
      const css = readFileSync(p, "utf8");
      assert.ok(!new RegExp(`\\.${cls}\\b`).test(css), `${p} đã có .${cls} (sửa phải dùng class sẵn, không thêm CSS mới)`);
    }
  }
});
check("sweep repo: 5 class đã sửa không còn xuất hiện trong bất cứ .tsx nào (trừ file test)", () => {
  const bad: string[] = [];
  const walk = (d: string) => {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) { walk(p); continue; }
      if (!f.endsWith(".tsx") || f.endsWith(".test.ts")) continue;
      const src = readFileSync(p, "utf8");
      for (const cls of ["caption-modal", "modal-x", "modal-label", "modal-hint", "modal-err"]) {
        if (new RegExp(`className="[^"]*\\b${cls}\\b`).test(src) || src.includes(`"${cls}"`)) bad.push(`${p.split("src/")[1]}: ${cls}`);
      }
    }
  };
  walk(SRC_DIR);
  assert.deepEqual(bad, [], `5 class đã sửa còn xuất hiện: ${bad.join("; ")}`);
});

console.log(`modalClasses59P4.test: PASS (${pass}/${total})`);
