// cssClasses60Q2.test.ts — Phase 9 đợt 60, luồng Q2: dọn 30 class CSS chưa
// định nghĩa còn sót sau đợt 59 P4 (LIMITS đợt 59 P4 §5.1–§5.2, quét lại
// trên đĩa 08/11: vẫn đủ 30 class + 1 dương tính giả `.all`).
//
// PHƯƠNG PHÁP (ghi rõ): test TĨNH trên source, không render React (cùng
// lý do P4: repo không có jsdom, component kéo store/i18n). Quét lại bằng
// đúng phương pháp của sweep.py đợt 59 P4:
//   - Class ĐÃ định nghĩa = token sau dấu `.` trong phần selector của mọi
//     file `.css` dưới `apps/web/src` (styles.css + mobile.css +
//     components/*/*.css). Selector phức hợp vẫn tính (`.modal-body
//     .error` -> error đã định nghĩa, nhưng chỉ có hiệu lực trong
//     `.modal-body` — các check scoped dưới đây khóa đúng tổ tiên).
//   - Class ĐANG DÙNG = mọi chuỗi trong `className="..."` và mọi chuỗi
//     literal trong `className={...}` của mọi `.tsx` (trừ `*.test.ts`).
//   - `className={biến}` (không literal) không quét tĩnh được — liệt kê
//     riêng trong LIMITS, không kết luận.
// Khóa thêm 2 bất biến của đợt này:
//   (a) 9 badge preview: style tĩnh (position/background/padding/...) đã
//       chuyển hẳn sang CSS — trong preview.tsx không còn inline
//       `position: "absolute"` / `zIndex: 5` / `pointerEvents: "none"`
//       nào; style inline còn lại của 7 badge chỉ còn `display: "none"`
//       (JS bật/tắt qua ref), 2 phần tử render có điều kiện không còn
//       prop `style` nào.
//   (b) Không đổi key i18n / literal ở 4 file `.tsx` luồng này đụng
//       (preview.tsx, HistoryPanel, TrackPanel, TtsButton): khóa đúng
//       số call site + tập key đã đếm trước khi sửa.
// Bằng chứng động (headed thật): xem
// docs/PHASE9_ROUND60_Q2_CSS_CLASSES_LIMITS.md.
//
// Chạy bằng esbuild bundle (mẫu P4, chạy từ gốc repo):
//   ./node_modules/.bin/esbuild apps/web/src/lib/cssClasses60Q2.test.ts \
//     --bundle --platform=node --format=cjs \
//     --outfile=/tmp/round60-q2/cssClasses60Q2.test.cjs \
//     && node /tmp/round60-q2/cssClasses60Q2.test.cjs
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

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/** Token class trong phần selector của 1 file CSS (bỏ comment). */
function cssTokens(css: string): Set<string> {
  const out = new Set<string>();
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const m of clean.matchAll(/([^{}]+)\{/g)) {
    const sel = m[1].trim();
    if (!sel || sel.startsWith("@")) continue;
    for (const t of sel.matchAll(/\.([A-Za-z_][\w-]*)/g)) out.add(t[1]);
  }
  return out;
}

/** Mọi class dùng trong 1 file .tsx (className="..." + literal trong className={...}). */
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
  }
  return out;
}

const CSS_FILES = walk(SRC_DIR).filter((p) => p.endsWith(".css"));
const CSS_BY_FILE = new Map<string, string>();
const DEFINED = new Set<string>();
for (const f of CSS_FILES) {
  const text = readFileSync(f, "utf8");
  CSS_BY_FILE.set(f, text);
  for (const t of cssTokens(text)) DEFINED.add(t);
}
function cssText(rel: string): string {
  const f = CSS_FILES.find((p) => p.endsWith(rel));
  assert.ok(f, `không tìm thấy file CSS ${rel}`);
  return CSS_BY_FILE.get(f)!;
}
function tokensOf(rel: string): Set<string> {
  return cssTokens(cssText(rel));
}

const TSX_FILES = walk(SRC_DIR).filter(
  (p) => (p.endsWith(".tsx") || p.endsWith(".ts")) && !p.endsWith(".test.ts"),
);
const USED = new Map<string, string[]>(); // rel -> class dùng
for (const f of TSX_FILES) {
  USED.set(f.slice(SRC_DIR.length + 1), usedClasses(readFileSync(f, "utf8")));
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

// ============ Span lồng nhau cho mọi thẻ (mẫu context-check.py P4) ============
const VOID_TAGS = new Set(["input", "br", "img", "hr", "meta", "link", "source", "wbr", "col"]);
interface Span { start: number; end: number }
function tagSpans(src: string, pred: (classes: string[]) => boolean): Span[] {
  const stack: Array<{ name: string; start: number; classes: string[] }> = [];
  const out: Span[] = [];
  const re = /<(\/?)([A-Za-z][\w.-]*)\b[^>]*?(\/?)>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    const closing = m[1] === "/";
    const name = m[2];
    const selfClose = m[3] === "/";
    if (closing) {
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].name === name) {
          const el = stack.splice(i, 1)[0];
          if (pred(el.classes)) out.push({ start: el.start, end: m.index + m[0].length });
          break;
        }
      }
    } else {
      if (VOID_TAGS.has(name) || selfClose) continue;
      const cm = m[0].match(/className=(["'])(.*?)\1/);
      stack.push({ name, start: m.index, classes: cm ? cm[2].split(/\s+/) : [] });
    }
  }
  return out;
}
const hasCls = (c: string) => (classes: string[]) => classes.includes(c);
/** Mọi lần dùng `className="X"` (literal) phải nằm trong span tổ tiên cho trước. */
function checkScoped(label: string, rel: string, cls: string, ancestorCls: string): void {
  const src = read(rel);
  const spans = tagSpans(src, hasCls(ancestorCls));
  const positions = [...src.matchAll(new RegExp(`className="${cls}"`, "g"))].map((m) => m.index ?? -1);
  check(`${label}: mọi className="${cls}" nằm trong .${ancestorCls}`, () => {
    assert.ok(positions.length > 0, `${label}: không tìm thấy className="${cls}" nào`);
    for (const p of positions) {
      assert.ok(spans.some((b) => p > b.start && p < b.end),
        `${label}: className="${cls}" @${p} nằm ngoài .${ancestorCls} (không có style)`);
    }
  });
}

// ============ 1. SpeedPanel — 12 class (đợt 59 P4 §5.1) ============
const SPEED12 = [
  "speed-curve", "curve-enable-btn", "curve-disable-btn", "curve-add-btn",
  "curve-preset", "curve-kf", "curve-kf-label", "curve-kf-remove",
  "curve-kf-t", "curve-kf-v", "curve-kf-easing", "curve-bezier-input",
];
for (const c of SPEED12) {
  check(`SpeedPanel: .${c} đã định nghĩa trong speed.css`, () => {
    assert.ok(tokensOf("components/speed/speed.css").has(c), `.${c} chưa có trong speed.css`);
    assert.ok(DEFINED.has(c), `.${c} chưa có trong tập CSS toàn repo`);
  });
}
check("SpeedPanel: .muted/.warn trong .speed-panel (rule riêng, không cần .modal-body)", () => {
  const css = cssText("components/speed/speed.css");
  assert.ok(css.includes(".speed-panel .muted"), "thiếu rule .speed-panel .muted");
  assert.ok(css.includes(".speed-panel .warn"), "thiếu rule .speed-panel .warn");
});
checkScoped("SpeedPanel", "components/speed/SpeedPanel.tsx", "muted", "speed-panel");
checkScoped("SpeedPanel", "components/speed/SpeedPanel.tsx", "warn", "speed-panel");

// ============ 2. preview.tsx — 9 badge ============
const PREVIEW9 = [
  "preview-proxy-badge", "preview-lut-badge", "preview-motion-badge",
  "preview-reverse-badge", "preview-hold-badge",
  "preview-reverse-engine-badge", "preview-curve-warn-badge",
  "preview-decodeahead-warn-badge", "preview-decodeahead-toggle",
];
const PREVIEW = read("preview.tsx");
for (const c of PREVIEW9) {
  check(`preview: .${c} đã định nghĩa trong styles.css`, () => {
    assert.ok(tokensOf("styles.css").has(c), `.${c} chưa có trong styles.css`);
    assert.ok(DEFINED.has(c), `.${c} chưa có trong tập CSS toàn repo`);
  });
}
check("preview: styles.css có position:absolute cho từng badge", () => {
  const css = cssText("styles.css");
  for (const c of PREVIEW9) {
    const re = new RegExp(`\\.${c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^{]*\\{[^}]*position:\\s*absolute`, "s");
    assert.ok(re.test(css), `.${c} thiếu position:absolute trong styles.css`);
  }
});
check("preview: không còn inline position:absolute nào trong preview.tsx", () => {
  assert.equal((PREVIEW.match(/position: "absolute"/g) || []).length, 0,
    "còn inline position:absolute — style tĩnh chưa chuyển hết sang CSS");
});
check("preview: không còn inline zIndex: 5 nào trong preview.tsx", () => {
  assert.equal((PREVIEW.match(/zIndex: 5/g) || []).length, 0,
    "còn inline zIndex: 5 — style tĩnh chưa chuyển hết sang CSS");
});
check("preview: không còn inline pointerEvents none nào trong preview.tsx", () => {
  assert.equal((PREVIEW.match(/pointerEvents: "none"/g) || []).length, 0,
    "còn inline pointerEvents — style tĩnh chưa chuyển hết sang CSS");
});
check("preview: 7 badge ref chỉ còn inline display:none", () => {
  const refBadges = [
    "preview-proxy-badge", "preview-lut-badge", "preview-motion-badge",
    "preview-hold-badge", "preview-reverse-engine-badge",
    "preview-curve-warn-badge", "preview-decodeahead-warn-badge",
  ];
  for (const c of refBadges) {
    const at = PREVIEW.indexOf(`className="${c}"`);
    assert.ok(at >= 0, `không tìm thấy className="${c}"`);
    const styleAt = PREVIEW.indexOf("style={{", at);
    assert.ok(styleAt >= 0 && styleAt - at < 600, `${c}: không tìm thấy style={{ gần className`);
    const end = PREVIEW.indexOf("}}", styleAt);
    const body = PREVIEW.slice(styleAt + "style={{".length, end);
    assert.equal(body.trim(), `display: "none"`,
      `${c}: inline style còn hơn display:none: ${body.trim()}`);
  }
});
check("preview: badge reverse + toggle render có điều kiện không còn prop style", () => {
  for (const c of ["preview-reverse-badge", "preview-decodeahead-toggle"]) {
    const at = PREVIEW.indexOf(`className="${c}"`);
    assert.ok(at >= 0, `không tìm thấy className="${c}"`);
    const tagEnd = PREVIEW.indexOf(">", at);
    const tag = PREVIEW.slice(at, tagEnd);
    assert.ok(!tag.includes("style="), `${c}: còn prop style trong thẻ mở: ${tag.slice(0, 120)}`);
  }
});

// ============ 3. Timeline — 3 class ============
for (const c of ["tl-markers", "tl-nested", "tl-marker-editor-title"]) {
  check(`Timeline: .${c} đã định nghĩa trong styles.css`, () => {
    assert.ok(tokensOf("styles.css").has(c), `.${c} chưa có trong styles.css`);
  });
}
check("Timeline: nút nested active có style (.tl-nested button.active)", () => {
  assert.ok(cssText("styles.css").includes(".tl-nested button.active"),
    "thiếu rule .tl-nested button.active — nút Nested/Adjustment bật không đổi diện mạo");
});

// ============ 4. HistoryPanel / MediaBin / ExportPanel / TrackPanel ============
check("HistoryPanel: .history-panel đã định nghĩa (inline style đã chuyển sang CSS)", () => {
  assert.ok(tokensOf("styles.css").has("history-panel"), ".history-panel chưa có trong styles.css");
  const line = read("components/project/HistoryPanel.tsx")
    .split("\n").find((l) => l.includes('className="history-panel"')) ?? "";
  assert.ok(!line.includes("style="), "thẻ .history-panel còn inline style — chưa chuyển sang class");
});
check("MediaBin: .media-proxy đã định nghĩa trong styles.css", () => {
  assert.ok(tokensOf("styles.css").has("media-proxy"), ".media-proxy chưa có trong styles.css");
});
check("ExportPanel: .reframe-section đã định nghĩa trong styles.css", () => {
  assert.ok(tokensOf("styles.css").has("reframe-section"), ".reframe-section chưa có trong styles.css");
});
check("TrackPanel: .track-panel + .track-panel .error trong sticker.css, đã import", () => {
  const css = cssText("components/sticker/sticker.css");
  assert.ok(tokensOf("components/sticker/sticker.css").has("track-panel"),
    ".track-panel chưa có trong sticker.css");
  assert.ok(css.includes(".track-panel .error"), "thiếu rule .track-panel .error");
  assert.ok(read("components/sticker/TrackPanel.tsx").includes('import "./sticker.css"'),
    "TrackPanel.tsx chưa import sticker.css");
});

// ============ 5. TtsButton — 2 class + scoped .muted/.small ============
check("TtsButton: TtsButton.css tồn tại, định nghĩa tts-box + tts-msg", () => {
  assert.ok(existsSync(join(SRC_DIR, "components", "TtsButton.css")), "thiếu file components/TtsButton.css");
  const toks = tokensOf("components/TtsButton.css");
  assert.ok(toks.has("tts-box"), ".tts-box chưa có trong TtsButton.css");
  assert.ok(toks.has("tts-msg"), ".tts-msg chưa có trong TtsButton.css");
  assert.ok(read("components/TtsButton.tsx").includes('import "./TtsButton.css"'),
    "TtsButton.tsx chưa import TtsButton.css");
});
check("TtsButton: display:flex phải thắng .field bằng .field.tts-box (không phải .tts-box trần)", () => {
  // .field { display:block } và .tts-box { display:flex } cùng specificity
  // (0,1,0) nên thắng/thua tùy thứ tự import — đo headed đợt này đã bắt
  // được computed ra block. Khóa selector (0,2,0) để không tái phát.
  const css = cssText("components/TtsButton.css");
  assert.ok(/\.field\.tts-box\s*\{[^}]*display:\s*flex/s.test(css),
    "thiếu rule .field.tts-box { display:flex } — .tts-box trần thua .field theo cascade");
});
check("TtsButton: .tts-box .muted + .tts-box .muted.small có màu + cỡ chữ", () => {
  const css = cssText("components/TtsButton.css");
  assert.ok(/\.tts-box \.muted\s*\{[^}]*color:/s.test(css), "thiếu rule .tts-box .muted có color");
  assert.ok(/\.tts-box \.muted\.small\s*\{[^}]*font-size:/s.test(css),
    "thiếu rule .tts-box .muted.small có font-size");
});

// ============ 6. Class scoped-only dùng ngoài tổ tiên — các ca còn lại ============
check("StickerPanel: .sticker-panel .warn + .sticker-editor .muted đã có rule", () => {
  const css = cssText("components/sticker/sticker.css");
  assert.ok(css.includes(".sticker-panel .warn"), "thiếu rule .sticker-panel .warn");
  assert.ok(css.includes(".sticker-editor .muted"), "thiếu rule .sticker-editor .muted");
});
checkScoped("StickerPanel", "components/sticker/StickerPanel.tsx", "warn", "sticker-panel");
check("StickerPanel: .muted ở nhánh editor nằm trong .sticker-editor (rule mới)", () => {
  const src = read("components/sticker/StickerPanel.tsx");
  const spans = tagSpans(src, hasCls("sticker-editor"));
  const positions = [...src.matchAll(/className="muted"/g)].map((m) => m.index ?? -1);
  assert.ok(positions.length >= 2, "StickerPanel phải có ≥2 className=\"muted\"");
  const outsidePanel = positions.filter(
    (p) => !tagSpans(src, hasCls("sticker-panel")).some((b) => p > b.start && p < b.end),
  );
  assert.ok(outsidePanel.length >= 1, "không tìm thấy .muted ngoài .sticker-panel (nhánh editor)");
  for (const p of outsidePanel) {
    assert.ok(spans.some((b) => p > b.start && p < b.end),
      `.muted @${p} ngoài cả .sticker-panel lẫn .sticker-editor`);
  }
});
check("TourCard: .tour-body .muted/.warn đã có màu (trước đây chỉ margin:0)", () => {
  const css = cssText("styles.css");
  assert.ok(/\.tour-body \.muted[^{]*\{[^}]*color:/s.test(css) ||
    /\.tour-body \.muted,\s*\.tour-body \.warn\s*\{[^}]*color:/s.test(css) ||
    css.includes(".tour-body .muted {"),
    "thiếu màu cho .tour-body .muted");
  assert.ok(/\.tour-body \.warn[^{]*\{[^}]*color:/s.test(css) ||
    css.includes(".tour-body .warn {"),
    "thiếu màu cho .tour-body .warn");
});
checkScoped("TourCard", "components/onboarding/TourCard.tsx", "muted", "tour-body");
checkScoped("TourCard", "components/onboarding/TourCard.tsx", "warn", "tour-body");
check("KeyframePanel: .dim là hook của rule .kf-live-row.dim b (đã có style)", () => {
  assert.ok(cssText("components/keyframes/keyframes.css").includes(".kf-live-row.dim b"),
    "thiếu rule .kf-live-row.dim b — .dim ở KeyframePanel mất tác dụng");
  const src = read("components/keyframes/KeyframePanel.tsx");
  assert.ok(src.includes('className="kf-live-row dim"'), "không tìm thấy kf-live-row dim");
});
checkScoped("TemplatePicker", "components/TemplatePicker.tsx", "error", "template-modal");
checkScoped("TemplatePicker", "components/TemplatePicker.tsx", "muted", "template-modal");
checkScoped("ChromaPanel", "components/chroma/ChromaPanel.tsx", "warn", "chroma-panel");
checkScoped("EffectPanel", "components/effects/EffectPanel.tsx", "warn", "effects-panel");
check("ExportPanel: \"error\" chỉ là literal so sánh trạng thái, không phải class", () => {
  const src = read("ExportPanel.tsx");
  assert.ok(!/className="error"/.test(src), "ExportPanel có className=\"error\" thật");
  const inClassName = [...src.matchAll(/className=\{[^}]*"error"/g)];
  assert.equal(inClassName.length, 1,
    `số className chứa literal "error" phải = 1 (shareStatus), nhận ${inClassName.length}`);
  assert.ok(inClassName[0][0].includes('=== "error"'),
    "className chứa \"error\" phải là phép so sánh shareStatus === \"error\"");
});

// ============ 7. Quét toàn repo: chỉ còn dương tính giả `.all` ============
check("Quét toàn repo: không còn class chưa định nghĩa ngoài `.all` (dương tính giả)", () => {
  const undef = new Map<string, string[]>();
  for (const [rel, classes] of USED) {
    for (const c of new Set(classes)) {
      if (!DEFINED.has(c)) {
        if (!undef.has(c)) undef.set(c, []);
        undef.get(c)!.push(rel);
      }
    }
  }
  const rest = [...undef.keys()].filter((c) => c !== "all");
  assert.deepEqual(rest, [], `còn class chưa định nghĩa: ${rest.map((c) => `.${c} (${undef.get(c)!.join(", ")})`).join("; ")}`);
  assert.ok(undef.has("all"), "`.all` phải vẫn xuất hiện (để khóa nó là dương tính giả, không phải đã xóa nhầm code)");
});
check("`.all` chỉ là literal so sánh cat === \"all\", không phải class", () => {
  for (const rel of ["components/TemplatePicker.tsx", "components/sticker/StickerPanel.tsx"]) {
    const src = read(rel);
    assert.ok(!/className="all"/.test(src) && !/className='all'/.test(src),
      `${rel}: có className="all" thật`);
    assert.ok(src.includes('=== "all"'), `${rel}: không tìm thấy phép so sánh === "all"`);
  }
});

// ============ 8. i18n không đổi ở 4 file .tsx đụng tới ============
function checkI18n(rel: string, fnName: string, keys: string[], calls: number): void {
  check(`${rel}: đủ ${keys.length} key i18n, ${calls} call site — không thêm/bớt`, () => {
    const src = read(rel);
    const found = [...src.matchAll(new RegExp(`\\b${fnName}\\("([a-zA-Z.]+)"`, "g"))].map((m) => m[1]);
    assert.deepEqual([...new Set(found)].sort(), [...keys].sort());
    assert.equal(found.length, calls, `số call site ${fnName}() phải = ${calls}, nhận ${found.length}`);
  });
}
checkI18n("preview.tsx", "i18nT", [
  "decodeahead.badgeBlocked", "decodeahead.badgeBlockedMulti", "decodeahead.badgeOff",
  "decodeahead.badgeRunning", "decodeahead.reason.unknown", "decodeahead.toastBlocked",
  "decodeahead.toastOffNote", "decodeahead.toggleAria", "decodeahead.toggleBlocked",
  "decodeahead.toggleHint", "decodeahead.toggleOff", "decodeahead.toggleOn",
  "preview.curveFallbackHidden", "preview.curveFallbackLinear", "preview.curveFallbackLinearShort",
  "preview.curveToast", "preview.curveWarnFallback", "preview.curveWarnHidden",
  "preview.effectSkippedBadge", "preview.effectSkippedToast", "preview.emptyHint",
  "preview.emptyTitle", "preview.flattenToast", "preview.flattenWarn",
  "preview.flattenWarnDetail", "preview.fsEnter", "preview.fsEnterTitle", "preview.fsExit",
  "preview.fsExitTitle", "preview.hold", "preview.holdBadge", "preview.holdStale",
  "preview.lutBadge", "preview.missingMedia", "preview.motionBadge",
  "preview.nestedSkippedBadge", "preview.nestedSkippedToast", "preview.proxyBadge",
  "preview.reverseBadge", "preview.reverseLabel", "preview.volumeTitle",
], 47);
checkI18n("components/project/HistoryPanel.tsx", "t", [
  "history.beforeRestore", "history.colChanges", "history.colLabel", "history.colTime",
  "history.deleteConfirm", "history.duplicate", "history.empty", "history.export",
  "history.import", "history.importFailed", "history.imported", "history.labelPlaceholder",
  "history.notFound", "history.note", "history.readFailed", "history.restore",
  "history.restoreConfirm", "history.restoreFailed", "history.restored", "history.saveFailed",
  "history.saved", "history.snapshot", "history.title", "topbar.deleteShort",
], 24);
checkI18n("components/sticker/TrackPanel.tsx", "t", [
  "motionTrack.attached", "motionTrack.detach", "motionTrack.followNote", "motionTrack.intro",
  "motionTrack.invalid", "motionTrack.loadJson", "motionTrack.loadOther", "motionTrack.lost",
  "motionTrack.readFailed",
], 9);
checkI18n("components/TtsButton.tsx", "i18nT", [
  "common.bridgeConn", "tts.boxTitle", "tts.bridgeEmpty", "tts.bridgeErrorHttp", "tts.busy",
  "tts.busyBtn", "tts.cloneFromSample", "tts.cloneHint", "tts.done", "tts.emptyText",
  "tts.label", "tts.mediaErr", "tts.noRefFile", "tts.refFileLabel", "tts.speakBtn",
  "tts.speakTitle", "tts.voiceTitle",
], 20);

console.log(`\nPASS (${pass}/${total})`);
