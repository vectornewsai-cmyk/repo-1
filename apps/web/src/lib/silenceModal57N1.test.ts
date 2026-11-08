// silenceModal57N1.test.ts — Phase 9 đợt 57, luồng N1: khóa sửa tràn
// viewport của SilenceModal (nợ LIMITS đợt 56 §4.1).
//
// PHƯƠNG PHÁP (ghi rõ): test TĨNH trên source, không render React —
// repo không có jsdom trong devDeps và component kéo cả store/i18n nên
// không bundle được độc lập bằng esbuild. Test khóa 3 bất biến mà phép đo
// headed đã chứng minh là nguyên nhân + cách sửa:
//   (a) modal phải dùng class ĐÃ định nghĩa trong styles.css
//       (`modal-backdrop` fixed + căn giữa, `modal` flex column +
//       max-height calc(100vh - 60px)), không dùng `modal-overlay` /
//       `modal-card` (chưa từng được định nghĩa — đo headed trước sửa:
//       overlay position: static, modal 1439x391 top=394 bottom=785,
//       nút Huỷ/Phân tích y 723–753 dưới fold ở viewport 1439x699);
//   (b) footer `.modal-actions` phải là CON TRỰC TIẾP của `.modal`
//       (ngoài `.modal-body` cuộn nội bộ) ở cả 4 bước, để nút luôn thấy;
//   (c) mọi key i18n / literal nối đợt 56 giữ nguyên (không đổi key,
//       không đổi literal).
// Bằng chứng động (headed thật, trước/sau ở 1440x900 + 1280x720):
// xem docs/PHASE9_ROUND57_N1_SILENCE_MODAL_LIMITS.md.
//
// Chạy bằng esbuild bundle (mẫu các test lib khác, chạy từ gốc repo):
//   ./node_modules/.bin/esbuild apps/web/src/lib/silenceModal57N1.test.ts \
//     --bundle --platform=node --format=cjs \
//     --outfile=/tmp/round57-n1/silenceModal57N1.test.cjs \
//     && node /tmp/round57-n1/silenceModal57N1.test.cjs
// (Dùng --format=cjs nên KHÔNG dùng import.meta.url — đường dẫn resolve
// từ process.cwd(), chạy từ gốc repo.)
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

/** Tìm thư mục apps/web/src thật từ cwd (gốc repo hoặc apps/web). */
function findSrc(): string {
  const candidates = [
    resolve(process.cwd(), "apps/web/src"),
    resolve(process.cwd(), "src"),
  ];
  for (const c of candidates) {
    if (existsSync(join(c, "components", "SilenceModal.tsx"))) return c;
  }
  throw new Error(`không tìm thấy apps/web/src (chạy từ gốc repo; đã thử: ${candidates.join(", ")})`);
}
const SRC_DIR = findSrc();
const SRC = readFileSync(join(SRC_DIR, "components", "SilenceModal.tsx"), "utf8");
const CSS = readFileSync(join(SRC_DIR, "styles.css"), "utf8");
const MOBILE_CSS = readFileSync(join(SRC_DIR, "mobile.css"), "utf8");

let pass = 0;
let total = 0;
function check(name: string, fn: () => void): void {
  total++;
  fn();
  pass++;
  console.log(`  ok ${total} - ${name}`);
}

// ---- Quét span của các <div className="..."> (đếm lồng nhau) ----
interface Span { start: number; end: number; cls: string }
function divSpans(src: string, cls: string): Span[] {
  const out: Span[] = [];
  const openRe = /<div\b[^>]*>/g;
  const closeRe = /<\/div>/g;
  // Thu thập mọi token mở/đóng div theo vị trí.
  const tokens: Array<{ pos: number; kind: "open" | "close"; text: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = openRe.exec(src)) !== null) tokens.push({ pos: m.index, kind: "open", text: m[0] });
  while ((m = closeRe.exec(src)) !== null) tokens.push({ pos: m.index, kind: "close", text: m[0] });
  tokens.sort((a, b) => a.pos - b.pos);
  for (const t of tokens) {
    if (t.kind !== "open" || !t.text.includes(`className="${cls}"`)) continue;
    let depth = 0;
    for (const u of tokens) {
      if (u.pos < t.pos) continue;
      if (u.kind === "open") depth++;
      else depth--;
      if (depth === 0) { out.push({ start: t.pos, end: u.pos + u.text.length, cls }); break; }
    }
  }
  return out;
}

// (a1) Dùng đúng class đã định nghĩa, không dùng class chưa định nghĩa.
check("dùng modal-backdrop (không dùng modal-overlay)", () => {
  assert.ok(SRC.includes('className="modal-backdrop"'), "thiếu modal-backdrop");
  assert.ok(!SRC.includes('className="modal-overlay"'), "còn modal-overlay trong JSX");
});
check("dùng class modal (không dùng modal-card)", () => {
  assert.ok(/className="modal"/.test(SRC), "thiếu className=\"modal\"");
  assert.ok(!SRC.includes('className="modal-card"'), "còn modal-card trong JSX");
  assert.ok(!/className="modal [^"]*"/.test(SRC), "card mang thêm class lạ");
});
check("modal-overlay / modal-card thật sự chưa được định nghĩa trong CSS", () => {
  for (const [name, css] of [["styles.css", CSS], ["mobile.css", MOBILE_CSS]] as const) {
    assert.ok(!/\.modal-overlay\s*\{/.test(css), `${name} đã có .modal-overlay (giả định test đổi)`);
    assert.ok(!/\.modal-card\s*\{/.test(css), `${name} đã có .modal-card (giả định test đổi)`);
  }
});

// (a2) Hợp đồng CSS: các rule mà phép sửa dựa vào phải tồn tại đúng dạng.
function ruleBlock(css: string, selector: string): string {
  const m = css.match(new RegExp(`\\${selector}\\s*\\{([^}]*)\\}`, "s"));
  assert.ok(m, `không tìm thấy rule ${selector} trong styles.css`);
  return m![1];
}
check("CSS .modal: flex column + max-height theo viewport", () => {
  const b = ruleBlock(CSS, ".modal");
  assert.ok(/display:\s*flex/.test(b), ".modal thiếu display:flex");
  assert.ok(/flex-direction:\s*column/.test(b), ".modal thiếu flex-direction:column");
  assert.ok(/max-height:\s*calc\(100vh - 60px\)/.test(b), ".modal thiếu max-height: calc(100vh - 60px)");
  assert.ok(/overflow:\s*hidden/.test(b), ".modal thiếu overflow:hidden");
});
check("CSS .modal-backdrop: fixed + căn giữa", () => {
  const b = ruleBlock(CSS, ".modal-backdrop");
  assert.ok(/position:\s*fixed/.test(b), ".modal-backdrop thiếu position:fixed");
  assert.ok(/align-items:\s*center/.test(b), ".modal-backdrop thiếu align-items:center");
  assert.ok(/justify-content:\s*center/.test(b), ".modal-backdrop thiếu justify-content:center");
});
check("CSS .modal-body: cuộn nội bộ", () => {
  const b = ruleBlock(CSS, ".modal-body");
  assert.ok(/overflow-y:\s*auto/.test(b), ".modal-body thiếu overflow-y:auto");
});

// (b) Footer nút nằm ngoài body cuộn, ở cả 4 bước.
check("đủ 4 modal-body + 4 modal-actions (1 cặp mỗi bước)", () => {
  assert.equal(divSpans(SRC, "modal-body").length, 4, "số modal-body phải = 4");
  assert.equal(divSpans(SRC, "modal-actions").length, 4, "số modal-actions phải = 4");
});
check("không modal-actions nào nằm trong modal-body", () => {
  const bodies = divSpans(SRC, "modal-body");
  const actions = divSpans(SRC, "modal-actions");
  for (const a of actions) {
    const inside = bodies.some((b) => a.start > b.start && a.end < b.end);
    assert.ok(!inside, `modal-actions @${a.start} còn nằm trong modal-body`);
  }
});
check("modal-actions là con trực tiếp của .modal (sau modal-body cùng bước)", () => {
  const bodies = divSpans(SRC, "modal-body");
  const actions = divSpans(SRC, "modal-actions");
  assert.equal(actions.length, bodies.length, "mỗi body phải có đúng 1 actions kề sau");
  for (let i = 0; i < bodies.length; i++) {
    assert.ok(actions[i].start > bodies[i].end, `actions #${i} không nằm sau body #${i}`);
    const between = SRC.slice(bodies[i].end, actions[i].start);
    // Giữa body và actions chỉ được có khoảng trắng / đóng fragment — không
    // được có thêm thẻ div (footer phải là sibling, không lồng thêm lớp).
    assert.ok(!/<div\b/.test(between), `giữa body #${i} và actions #${i} có thêm <div>`);
  }
});
check("mỗi footer vẫn chứa đúng nút của bước đó (không mất nút khi dời)", () => {
  const actions = divSpans(SRC, "modal-actions");
  const text = (i: number) => SRC.slice(actions[i].start, actions[i].end);
  assert.ok(text(0).includes('t("bgremove.cancel")') && text(0).includes('t("silence.analyze")'), "footer config thiếu Huỷ/Phân tích");
  assert.ok(text(1).includes('t("bgremove.cancel")'), "footer running thiếu Huỷ");
  assert.ok(text(2).includes('t("silence.backToParams")') && text(2).includes('t("silence.cut"'), "footer review thiếu Quay lại/Cắt");
  assert.ok(text(3).includes('t("common.close")'), "footer done thiếu Đóng");
});

// (c) i18n: đúng 25 key đợt 56, không thêm không bớt, không đổi literal.
const EXPECTED_KEYS = [
  "bgremove.bridgeHttp", "bgremove.cancel",
  "common.bridgeConn", "common.close",
  "silence.analyze", "silence.analyzing", "silence.applyFailed",
  "silence.backToParams", "silence.cancelled", "silence.clipLabel",
  "silence.cut", "silence.cutDone", "silence.foundAll",
  "silence.foundPartial", "silence.intro", "silence.minDuration",
  "silence.noClip", "silence.noClipInTimeline", "silence.noSilenceFound",
  "silence.noSilenceInRange", "silence.noSource", "silence.threshold",
  "silence.thresholdHint", "silence.title", "silence.titleIcon",
];
check("đủ 25 key i18n đợt 56, không thêm/bớt key", () => {
  const found = [...SRC.matchAll(/t\("([a-zA-Z.]+)"/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(found)].sort(), [...EXPECTED_KEYS].sort());
  assert.equal(found.length, 28, "số call site t() phải = 28 (25 key; common.close ×2 title+aria-label, bgremove.cancel ×2 config+running)");
});

console.log(`silenceModal57N1.test: PASS (${pass}/${total})`);
