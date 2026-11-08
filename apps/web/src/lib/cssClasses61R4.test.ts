// cssClasses61R4.test.ts — Phase 9 đợt 61, luồng R4: đóng nợ Q2 §5.4/§7.6
// (53 class scoped-only còn lại) + §7.1–7.4 (5 rule chỉ đo tổng hợp ở Q2,
// đo EN + 1280×720 + mobile — xem docs/PHASE9_ROUND61_R4_CSS_SCOPED_LIMITS.md).
//
// PHƯƠNG PHÁP: test TĨNH trên source, không render React (cùng lý do P4/Q2:
// repo không có jsdom, component kéo store/i18n). Port của verify61.py
// (~/scratch-round61-r4/verify61.py) sang TS, cùng thuật toán:
//   - Class ĐÃ định nghĩa = token sau dấu `.` trong phần selector của mọi
//     file `.css` dưới `apps/web/src`. `scoped-only` = class chỉ xuất hiện
//     trong selector có tổ tiên bắt buộc mà không có rule top-level.
//   - Mỗi lần dùng class trong JSX được đối chiếu với MỌI selector định
//     nghĩa class đó (không chỉ 1 ví dụ như sweep.py): covered khi tồn tại
//     1 selector mà phần tử mang đủ class của compound đích VÀ tổ tiên
//     JSX thỏa các compound trước (descendant theo thứ tự, child `>` phải
//     kề), hoặc — khi class nằm ở compound tổ tiên — subtree của phần tử
//     chứa cháu thỏa các compound sau.
//   - className={...} được trích tới dấu } cân bằng (không rò literal từ
//     attribute khác, vd role={...} trong Toasts.tsx), kèm phần tĩnh của
//     template literal `...` (R61: sweep Q2 bỏ sót class chỉ có trong
//     backtick) và phần tử void/self-closing (<input>, <img>) vẫn tính
//     là 1 lần dùng (R61: từng bỏ sót `.curve-bezier-input`,
//     `.sticker-thumb`).
// Caveat (kế thừa P4/Q2): regex tag dừng ở `>` đầu tiên nên tag có `>` trong
// attribute expression (vd `n > 0 ? " has" : ""`) bị cắt ngắn — 3 ca biên
// này được khóa bằng check tường minh riêng (§5), không qua matcher chung.
// Chạy bằng esbuild bundle (mẫu P4/Q2, chạy từ gốc repo):
//   ./node_modules/.bin/esbuild apps/web/src/lib/cssClasses61R4.test.ts \
//     --bundle --platform=node --format=cjs \
//     --outfile=/tmp/round61-r4/cssClasses61R4.test.cjs \
//     && node /tmp/round61-r4/cssClasses61R4.test.cjs
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

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
function read(rel: string): string {
  return readFileSync(join(SRC_DIR, rel), "utf8");
}

let pass = 0;
let total = 0;
function check(name: string, fn: () => void): void {
  total++;
  fn();
  pass++;
  console.log(`  ok ${total} - ${name}`);
}

// ============ CSS: class -> selectors ============
interface SelPart { comb: string; classes: Set<string> }
function splitSelector(sel: string): SelPart[] {
  const out: SelPart[] = [];
  const tokens = sel.match(/[>+~]|\s+|[^\s>+~]+/g) ?? [];
  let comb = "";
  for (const tok of tokens) {
    if (tok === ">" || tok === "+" || tok === "~") comb = tok;
    else if (/^\s+$/.test(tok)) { if (comb === "") comb = " "; }
    else {
      const classes = new Set([...tok.matchAll(/\.([A-Za-z_][\w-]*)/g)].map((m) => m[1]));
      out.push({ comb, classes });
      comb = "";
    }
  }
  return out;
}

const CSS_FILES = walk(SRC_DIR).filter((p) => p.endsWith(".css"));
const DEFS = new Map<string, string[]>(); // cls -> selectors định nghĩa nó
const TOP_LEVEL = new Set<string>();
for (const f of CSS_FILES) {
  const clean = readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  for (const m of clean.matchAll(/([^{}]+)\{/g)) {
    const sel = m[1].trim();
    if (!sel || sel.startsWith("@")) continue;
    for (const rawPart of sel.split(",")) {
      const part = rawPart.trim();
      if (!part) continue;
      for (const t of part.matchAll(/\.([A-Za-z_][\w-]*)/g)) {
        const list = DEFS.get(t[1]) ?? [];
        list.push(part);
        DEFS.set(t[1], list);
      }
      // rule top-level cho class đầu selector đơn (mẫu sweep.py)
      const first = part.match(/^\.([A-Za-z_][\w-]*)/);
      if (first && /^\.[A-Za-z_][\w-]*(\s*\{|[\s.:#\[]|$)/.test(part)) TOP_LEVEL.add(first[1]);
    }
  }
}
const SCOPED_ONLY = new Set<string>();
for (const [cls, sels] of DEFS) {
  // scoped = selector chứa >1 token class (kể cả cùng compound,
  // vd .valid-banner.bad) hoặc có khoảng trắng — đúng mẫu sweep.py
  // (len(toks) > 1 or whitespace), không phải số compound.
  const scoped = sels.some((s) => {
    const parts = splitSelector(s);
    const nTokens = parts.reduce((n, p) => n + p.classes.size, 0);
    return nTokens > 1 || /\s/.test(s);
  });
  if (scoped && !TOP_LEVEL.has(cls)) SCOPED_ONLY.add(cls);
}
function cssText(rel: string): string {
  const f = CSS_FILES.find((p) => p.endsWith(rel));
  assert.ok(f, `không tìm thấy file CSS ${rel}`);
  return readFileSync(f, "utf8");
}

// ============ TSX: phần tử + tổ tiên (mẫu context-check.py P4, mở rộng) ============
const VOID_TAGS = new Set(["input", "br", "img", "hr", "meta", "link", "source", "wbr", "col"]);
interface El {
  tag: string; classes: Set<string>; start: number; end: number; raw: string;
  ancestors: Array<{ tag: string; classes: Set<string> }>;
}

/** Class trong 1 tag: className="..." hoặc literal + phần tĩnh template
 *  trong className={...} (tới dấu } cân bằng). */
function tagClasses(tagText: string): Set<string> {
  const classes = new Set<string>();
  const m = tagText.match(/className=(["'])(.*?)\1/s);
  if (m) {
    for (const c of m[2].split(/\s+/)) if (c) classes.add(c);
    return classes;
  }
  const open = tagText.search(/className=\{/);
  if (open < 0) return classes;
  let inner = tagText.slice(open + "className={".length);
  let depth = 1;
  let j = 0;
  let instr: string | null = null;
  while (j < inner.length && depth > 0) {
    const ch = inner[j];
    if (instr) {
      if (ch === "\\") { j += 2; continue; }
      if (ch === instr) instr = null;
    } else if (ch === "'" || ch === '"' || ch === "`") instr = ch;
    else if (ch === "{") depth++;
    else if (ch === "}") depth--;
    j++;
  }
  if (depth === 0) inner = inner.slice(0, j - 1);
  for (const l of inner.matchAll(/"([^"]*)"|'([^']*)'/g)) {
    for (const c of (l[1] ?? l[2]).split(/\s+/)) if (c) classes.add(c);
  }
  for (const tpl of inner.matchAll(/`([^`]*)`/g)) {
    const stat = tpl[1].replace(/\$\{[^}]*\}/g, " ");
    for (const c of stat.split(/\s+/)) if (c) classes.add(c);
  }
  return classes;
}

function parseTsx(src: string): El[] {
  const elems: El[] = [];
  const stack: number[] = [];
  const re = /<(\/?)([A-Za-z][\w.-]*)\b[^>]*?(\/?)>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    const closing = m[1] === "/";
    const name = m[2];
    const selfClose = m[3] === "/";
    if (closing) {
      for (let i = stack.length - 1; i >= 0; i--) {
        if (elems[stack[i]].tag === name) {
          elems[stack[i]].end = m.index + m[0].length;
          stack.splice(i, 1);
          break;
        }
      }
      continue;
    }
    const ancestors = stack.map((i) => ({ tag: elems[i].tag, classes: new Set(elems[i].classes) }));
    if (VOID_TAGS.has(name) || selfClose) {
      // Lá void/self-closing vẫn là 1 lần dùng class (không push stack).
      const classes = tagClasses(m[0]);
      if (classes.size > 0) {
        elems.push({ tag: name, classes, start: m.index, end: m.index + m[0].length, raw: m[0], ancestors });
      }
      continue;
    }
    const el: El = {
      tag: name, classes: tagClasses(m[0]), start: m.index, end: src.length,
      raw: m[0], ancestors,
    };
    elems.push(el);
    stack.push(elems.length - 1);
  }
  return elems;
}

function ancestorsMatch(
  ancestors: Array<{ classes: Set<string> }>, before: SelPart[],
): boolean {
  let ai = ancestors.length - 1;
  for (let ci = before.length - 1; ci >= 0; ci--) {
    const { comb, classes } = before[ci];
    const hasAll = (set: Set<string>) => [...classes].every((c) => set.has(c));
    if (comb === ">") {
      if (ai < 0 || !hasAll(ancestors[ai].classes)) return false;
      ai--;
    } else {
      let found = false;
      while (ai >= 0) {
        if (hasAll(ancestors[ai].classes)) { found = true; ai--; break; }
        ai--;
      }
      if (!found) return false;
    }
  }
  return true;
}

function subtreeMatch(elems: El[], parent: El, after: SelPart[]): boolean {
  let pos = parent.start;
  for (const part of after) {
    const hit = elems.find((e) =>
      e.start > pos && e.start < parent.end &&
      [...part.classes].every((c) => e.classes.has(c)));
    if (!hit) return false;
    pos = hit.start;
  }
  return true;
}

type Verdict = "covered" | "gap" | "uncertain";
function checkUsage(el: El, cls: string, selectors: string[], elems: El[]): { verdict: Verdict; detail: string } {
  const isCustom = /^[A-Z]/.test(el.tag);
  const notes: string[] = [];
  for (const sel of selectors) {
    const parts = splitSelector(sel);
    if (parts.some((p) => p.comb === "+" || p.comb === "~")) { notes.push(`sibling ${sel}`); continue; }
    for (let i = 0; i < parts.length; i++) {
      if (!parts[i].classes.has(cls)) continue;
      const before = parts.slice(0, i);
      if (i === parts.length - 1) {
        const extra = [...parts[i].classes].filter((c) => !el.classes.has(c));
        if (extra.length > 0 && isCustom) { notes.push(`custom-component, cần thêm ${extra} ở ${sel}`); continue; }
        if (extra.length > 0) continue;
        if (ancestorsMatch(el.ancestors, before)) return { verdict: "covered", detail: sel };
      } else {
        if (![...parts[i].classes].every((c) => el.classes.has(c))) continue;
        if (!ancestorsMatch(el.ancestors, before)) continue;
        if (subtreeMatch(elems, el, parts.slice(i + 1))) return { verdict: "covered", detail: sel };
      }
    }
  }
  if (notes.length > 0) return { verdict: "uncertain", detail: notes.join("; ") };
  return { verdict: "gap", detail: `own=[${[...el.classes].sort().join(" ")}]` };
}

// ============ Kho dữ liệu dùng chung ============
const TSX_FILES = walk(SRC_DIR).filter(
  (p) => (p.endsWith(".tsx") || p.endsWith(".ts")) && !p.endsWith(".test.ts"),
);
const ELEMS_BY_FILE = new Map<string, El[]>();
for (const f of TSX_FILES) {
  ELEMS_BY_FILE.set(f.slice(SRC_DIR.length + 1), parseTsx(readFileSync(f, "utf8")));
}
/** Mọi class dùng (sweep: literal + template tĩnh) — cho check undefined. */
function usedClasses(src: string): string[] {
  const out: string[] = [];
  for (const m of src.matchAll(/className=(["'])(.*?)\1/gs)) {
    out.push(...m[2].split(/\s+/).filter(Boolean));
  }
  for (const m of src.matchAll(/className=\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g)) {
    const inner = m[1];
    for (const l of inner.matchAll(/"([^"]*)"|'([^']*)'/g)) {
      out.push(...(l[1] ?? l[2]).split(/\s+/).filter(Boolean));
    }
    for (const tpl of inner.matchAll(/`([^`]*)`/g)) {
      const stat = tpl[1].replace(/\$\{[^}]*\}/g, " ");
      out.push(...stat.split(/\s+/).filter(Boolean));
    }
  }
  return out;
}
const USED = new Map<string, string[]>();
for (const f of TSX_FILES) {
  USED.set(f.slice(SRC_DIR.length + 1), usedClasses(readFileSync(f, "utf8")));
}

// ============ §1. Danh sách 54 class scoped-only (53 baseline Q2 + 1 của parent gộp) ============
// Parent gộp đợt 61 thêm `.modal.storage-cleanup` (panel dọn kho R9) nên
// "storage-cleanup" nay là class scoped-only thứ 54 (chỉ định nghĩa trong .modal).
const SCOPED54 = [
  "active", "bad", "bezier-field", "bezier-row", "chip", "confirm-box",
  "curve-add-btn", "curve-bezier", "curve-bezier-input", "curve-disable-btn",
  "curve-enable-btn", "curve-kf", "curve-kf-easing", "curve-kf-label",
  "curve-kf-remove", "curve-kf-t", "curve-kf-v", "curve-preset", "dim",
  "dirty", "dropped", "error", "has", "is-active", "is-hidden", "is-locked",
  "is-selected", "left", "lut-none", "mask-check", "mono", "muted", "ok",
  "on", "play", "primary", "right", "sel", "selected", "sm", "small",
  "speed-curve", "sticker-grid", "sticker-preview-row", "sticker-thumb",
  "storage-cleanup", "tbtn-label", "template-aspect", "template-desc", "template-form",
  "template-meta", "template-name", "warn", "wide",
];
check("scoped-only đang dùng đúng 54 tên (53 baseline Q2 + storage-cleanup của parent gộp)", () => {
  const scopedUsed = new Set<string>();
  for (const [rel, classes] of USED) {
    for (const c of classes) if (SCOPED_ONLY.has(c)) scopedUsed.add(c);
  }
  assert.deepEqual([...scopedUsed].sort(), [...SCOPED54].sort(),
    `scoped-only lệch baseline: thêm ${[...scopedUsed].filter((c) => !SCOPED54.includes(c))}, mất ${SCOPED54.filter((c) => !scopedUsed.has(c))}`);
});

// ============ §2. Chưa định nghĩa: chỉ còn 3 dương tính giả đã biết ============
check("chưa định nghĩa chỉ còn .all / .lane- / .toast- (mảnh template)", () => {
  const undef = new Set<string>();
  for (const classes of USED.values()) {
    for (const c of classes) if (!DEFS.has(c)) undef.add(c);
  }
  assert.deepEqual([...undef].sort(), ["all", "lane-", "toast-"],
    `có class chưa định nghĩa mới: ${[...undef].sort()}`);
  const tp = read("components/TemplatePicker.tsx");
  assert.ok(tp.includes('cat === "all"'), ".all phải chỉ là literal so sánh cat === \"all\"");
  const tl = read("Timeline.tsx");
  assert.ok(tl.includes("lane-${track.kind}"), ".lane- phải chỉ là tiền tố template lane-${track.kind}");
  const toasts = read("components/Toasts.tsx");
  assert.ok(toasts.includes("toast-${"), ".toast- phải chỉ là tiền tố template toast-${...}");
  assert.ok(!usedClasses(toasts).includes("error"),
    "Toasts.tsx không được dùng class error (role={t.kind === \"error\"...} không phải class)");
  // Parent gộp đợt 61: `.storage-cleanup` (luồng R9) nay đã có rule thật
  // `.modal.storage-cleanup { width: 720px }` trong styles.css (width chuyển
  // từ inline style sang CSS) nên không còn nằm trong tập chưa định nghĩa.
  assert.ok(cssText("styles.css").includes(".modal.storage-cleanup"),
    "styles.css phải định nghĩa .modal.storage-cleanup (panel dọn kho R9)");
});

// ============ §3. Sửa thật duy nhất của đợt: .fx-toggle.on ============
check("R4 fix: .fx-toggle.on .fx-name có rule trong effects.css (nút effect đang bật đổi màu tên)", () => {
  const css = cssText("components/effects/effects.css");
  assert.ok(/\.fx-toggle\.on\s+\.fx-name\s*\{[^}]*color:\s*#fff/.test(css),
    "thiếu rule .fx-toggle.on .fx-name { color: #fff } (mirror .fx-toggle:hover .fx-name)");
});

// ============ §4. Mọi lần dùng của 54 class đều covered (53 Q2 + storage-cleanup) ============
for (const cls of SCOPED54) {
  check(`.${cls}: mọi lần dùng đều khớp ≥1 selector định nghĩa nó`, () => {
    const selectors = DEFS.get(cls) ?? [];
    assert.ok(selectors.length > 0, `.${cls} không còn selector nào`);
    let usages = 0;
    let skippedKnown = 0; // ca biên §5: đã đếm riêng, không qua matcher chung
    const gaps: string[] = [];
    for (const [rel, elems] of ELEMS_BY_FILE) {
      for (const el of elems) {
        if (!el.classes.has(cls)) continue;
        // Ngoại lệ có chủ đích (xem §5): literal so sánh, không phải class.
        if (cls === "error" && rel === "ExportPanel.tsx" && /shareStatus === "error"/.test(el.raw)) { skippedKnown++; continue; }
        // Ngoại lệ có chủ đích (xem §5): span trong component con ShortLabel.
        if (cls === "tbtn-label" && rel === "TopBar.tsx") { skippedKnown++; continue; }
        usages++;
        const r = checkUsage(el, cls, selectors, elems);
        if (r.verdict !== "covered") gaps.push(`${rel}@${el.start} <${el.tag}> [${r.verdict}] ${r.detail}`);
      }
    }
    // `.has` không tìm được qua matcher chung (tag bị cắt ở `n > 0`) — khóa riêng ở §5.
    if (cls === "has") {
      assert.equal(usages, 0, ".has qua matcher phải là 0 (ca cắt tag đã biết, xem §5)");
      return;
    }
    assert.ok(usages + skippedKnown > 0, `.${cls} không tìm thấy lần dùng nào (matcher lệch?)`);
    if (cls === "tbtn-label") assert.equal(skippedKnown, 1, ".tbtn-label phải có đúng 1 lần dùng ở ShortLabel (xem §5)");
    if (cls === "error") assert.equal(skippedKnown, 1, ".error phải có đúng 1 literal so sánh bị bỏ qua ở ExportPanel (xem §5)");
    assert.deepEqual(gaps, [], `.${cls} còn ${gaps.length} lần dùng ngoài tổ tiên:\n${gaps.join("\n")}`);
  });
}

// ============ §5. Ba ca biên ngoài matcher chung ============
check("ca biên .has: nút kf-tab mang \"has\" cùng phần tử, khớp .kf-tab.has", () => {
  const src = read("components/keyframes/KeyframePanel.tsx");
  assert.ok(src.includes('className={"kf-tab" + (p === activeProp ? " active" : "") + (n > 0 ? " has" : "")}'),
    "không tìm thấy dòng nút kf-tab/has (matcher regex cắt tag ở `n > 0` nên ca này khóa tay)");
  const css = cssText("components/keyframes/keyframes.css");
  assert.ok(css.includes(".kf-tab.has"), "thiếu selector .kf-tab.has");
});
check("ca biên .tbtn-label: ShortLabel chỉ được dùng trong .topbar-actions", () => {
  const src = read("TopBar.tsx");
  // Span của <div className="topbar-actions"> qua parser (không đoán thụt đầu dòng).
  const top = (ELEMS_BY_FILE.get("TopBar.tsx") ?? []).find((e) => e.classes.has("topbar-actions"));
  assert.ok(top, "không tìm thấy phần tử .topbar-actions trong TopBar.tsx");
  const calls = [...src.matchAll(/<ShortLabel /g)].map((m) => m.index ?? -1);
  assert.ok(calls.length > 0, "không tìm thấy <ShortLabel ...> nào");
  for (const p of calls) {
    assert.ok(p > top.start && p < top.end, `<ShortLabel @${p} nằm ngoài .topbar-actions`);
  }
  assert.ok(cssText("styles.css").includes(".topbar-actions .tbtn-label"),
    "thiếu selector .topbar-actions .tbtn-label");
});
check("ca biên .error: literal \"error\" duy nhất trong className ở ExportPanel là phép so sánh trạng thái", () => {
  const src = read("ExportPanel.tsx");
  // Chỉ đếm literal "error" BÊN TRONG className={...} (file có 17 literal
  // "error" khác: type union, setStatus("error"), ... — không phải class).
  const inClassName = [...src.matchAll(/className=\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g)]
    .flatMap((m) => [...m[1].matchAll(/"error"/g)]);
  assert.equal(inClassName.length, 1, `ExportPanel phải có đúng 1 literal "error" trong className, thấy ${inClassName.length}`);
  assert.ok(src.includes('shareStatus === "error" ? "valid-banner bad" : "tips"'),
    "literal \"error\" phải nằm trong phép so sánh shareStatus (không phải class)");
});

console.log(`\nPASS (${pass}/${total}) — 54 class scoped-only (53 Q2 + storage-cleanup) đã kiểm chứng ngữ cảnh xong.`);
