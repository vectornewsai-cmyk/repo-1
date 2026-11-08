// modalCard58O4.test.ts — Phase 9 đợt 58, luồng O4: khóa sửa nợ LIMITS
// đợt 57 §6.3 — BeatSyncModal.tsx + SceneModal.tsx dùng class `modal-card`
// chưa từng được định nghĩa trong CSS (chỉ card thiếu style, overlay
// `modal-backdrop` đã đúng).
//
// PHƯƠNG PHÁP (ghi rõ): test TĨNH trên source, không render React —
// repo không có jsdom trong devDeps và component kéo cả store/i18n nên
// không bundle được độc lập bằng esbuild. Test khóa 3 bất biến theo đúng
// mẫu N1 (silenceModal57N1.test.ts):
//   (a) modal phải dùng class ĐÃ định nghĩa trong styles.css
//       (`modal-backdrop` fixed + căn giữa, `modal` flex column +
//       max-height calc(100vh - 60px), `.scene-modal` giữ nguyên modifier
//       max-width 520px), không dùng `modal-card` (chưa từng được định
//       nghĩa — trước sửa, card là position: static / display: block,
//       nằm trong luồng tài liệu thường thay vì fixed + căn giữa, cùng
//       lỗi gốc như SilenceModal đợt 57 N1);
//   (b) footer `.modal-actions` phải là CON TRỰC TIẾP của `.modal`
//       (ngoài `.modal-body` cuộn nội bộ) ở mọi bước có nút, để nút luôn
//       thấy; BeatSyncModal bước running không có nút (huỷ bằng unmount)
//       nên không có footer ở bước đó — giữ nguyên hành vi;
//   (c) mọi key i18n giữ nguyên (không đổi key, không đổi literal).
// Bằng chứng động (headed thật, bước config ở 1440x900 + 1280x720):
// xem docs/PHASE9_ROUND58_O4_MODAL_CARD_LIMITS.md.
//
// Chạy bằng esbuild bundle (mẫu các test lib khác, chạy từ gốc repo):
//   ./node_modules/.bin/esbuild apps/web/src/lib/modalCard58O4.test.ts \
//     --bundle --platform=node --format=cjs \
//     --outfile=/tmp/round58-o4/modalCard58O4.test.cjs \
//     && node /tmp/round58-o4/modalCard58O4.test.cjs
// (Dùng --format=cjs nên KHÔNG dùng import.meta.url — đường dẫn resolve
// từ process.cwd(), chạy từ gốc repo.)
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

/** Tìm thư mục apps/web/src thật từ cwd (gốc repo hoặc apps/web). */
function findSrc(): string {
  const candidates = [
    resolve(process.cwd(), "apps/web/src"),
    resolve(process.cwd(), "src"),
  ];
  for (const c of candidates) {
    if (existsSync(join(c, "components", "BeatSyncModal.tsx"))) return c;
  }
  throw new Error(`không tìm thấy apps/web/src (chạy từ gốc repo; đã thử: ${candidates.join(", ")})`);
}
const SRC_DIR = findSrc();
const BEAT = readFileSync(join(SRC_DIR, "components", "BeatSyncModal.tsx"), "utf8");
const SCENE = readFileSync(join(SRC_DIR, "components", "SceneModal.tsx"), "utf8");
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

// ---- Quét span của các <div ...> (đếm lồng nhau) ----
interface Span { start: number; end: number }
function divSpans(src: string, pred: (tag: string) => boolean): Span[] {
  const out: Span[] = [];
  const openRe = /<div\b[^>]*>/g;
  const closeRe = /<\/div>/g;
  const tokens: Array<{ pos: number; kind: "open" | "close"; text: string }> = [];
  let m: RegExpExecArray | null;
  // Div tự đóng (<div ... />) không tạo độ sâu — bỏ qua, nếu không span
  // của div cha sẽ nuốt luôn thẻ đóng kề sau (SceneModal bước running có
  // <div className="spinner" /> trong modal-body).
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
// Lưu ý: mở thẻ <div ...> trong 2 modal này chứa `onClick={(e) => ...}`
// nên regex quét tag bị cắt ở dấu `>` đầu tiên (của `=>`) — vì vậy KHÔNG
// khớp dialog bằng `role="dialog"` (nằm sau onClick trong thẻ). Khớp bằng
// className (đứng đầu thẻ, trước onClick) thay thế.
const isDialog = (tag: string) =>
  tag.includes('className="modal"') || tag.includes('className="modal scene-modal"');

/** Footer phải nằm ngoài body, kề sau body của chính bước đó. */
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
  check(`${label}: mỗi modal-actions kề sau modal-body của bước đó (không lồng thêm div)`, () => {
    for (const a of actions) {
      const prev = bodies.filter((b) => b.end <= a.start).sort((x, y) => y.end - x.end)[0];
      assert.ok(prev, `${label}: modal-actions @${a.start} không có modal-body nào đứng trước`);
      const between = src.slice(prev.end, a.start);
      assert.ok(!/<div\b/.test(between), `${label}: giữa body @${prev.end} và actions @${a.start} có thêm <div>`);
    }
  });
  check(`${label}: mọi modal-actions nằm trong dialog .modal`, () => {
    for (const a of actions) {
      const inside = dialogs.some((d) => a.start > d.start && a.end < d.end);
      assert.ok(inside, `${label}: modal-actions @${a.start} nằm ngoài dialog`);
    }
  });
}

// ================= BeatSyncModal =================
check("BeatSync: dùng modal-backdrop (không dùng modal-overlay)", () => {
  assert.ok(BEAT.includes('className="modal-backdrop"'), "thiếu modal-backdrop");
  assert.ok(!BEAT.includes('className="modal-overlay"'), "còn modal-overlay trong JSX");
});
check("BeatSync: dùng class modal (không dùng modal-card)", () => {
  assert.ok(/className="modal"/.test(BEAT), "thiếu className=\"modal\"");
  assert.ok(!BEAT.includes('className="modal-card"'), "còn modal-card trong JSX");
  assert.equal((BEAT.match(/className="modal"/g) || []).length, 2, "phải có đúng 2 card .modal (early-return + chính)");
});
check("BeatSync: đủ 4 modal-body + 3 modal-actions (running không có nút)", () => {
  assert.equal(divSpans(BEAT, isBody).length, 4, "số modal-body phải = 4 (noClip/config/running/review)");
  assert.equal(divSpans(BEAT, isActions).length, 3, "số modal-actions phải = 3 (noClip/config/review; running không nút)");
});
checkFooterStructure("BeatSync", BEAT);
check("BeatSync: mỗi footer vẫn chứa đúng nút của bước đó (không mất nút khi dời)", () => {
  const actions = divSpans(BEAT, isActions);
  const text = (i: number) => BEAT.slice(actions[i].start, actions[i].end);
  assert.ok(text(0).includes('t("common.close")'), "footer noClip thiếu Đóng");
  assert.ok(text(1).includes('t("beatsync.analyze")') && text(1).includes('t("bgremove.cancel")'), "footer config thiếu Phân tích/Huỷ");
  assert.ok(text(2).includes('t("beatsync.apply")') && text(2).includes('t("bgremove.cancel")'), "footer review thiếu Áp dụng/Huỷ");
});
check("BeatSync: field-row chỉ còn hàng input (không còn làm footer nút)", () => {
  assert.equal((BEAT.match(/className="field-row"/g) || []).length, 1, "chỉ còn đúng 1 field-row");
  const row = BEAT.match(/<div className="field-row">[\s\S]*?<\/div>/)![0];
  assert.ok(row.includes('t("beatsync.minBpm")') && row.includes('t("beatsync.maxBpm")'), "field-row còn lại phải là hàng nhập BPM");
});
check("BeatSync: đủ 26 key i18n, 29 call site — không thêm/bớt key", () => {
  const found = [...BEAT.matchAll(/t\("([a-zA-Z.]+)"/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(found)].sort(), [
    "beatsync.analyze", "beatsync.analyzeFailed", "beatsync.analyzing",
    "beatsync.apply", "beatsync.applyFailed", "beatsync.bridgeError",
    "beatsync.cutTitle", "beatsync.downbeatOnly", "beatsync.found",
    "beatsync.intro", "beatsync.maxBpm", "beatsync.meter",
    "beatsync.meterUnknown", "beatsync.minBpm", "beatsync.noClip",
    "beatsync.noCutPoints", "beatsync.noSource", "beatsync.section",
    "beatsync.sectionNote", "beatsync.sectionPeak", "beatsync.sectionRepeat",
    "beatsync.structure", "beatsync.structureError", "beatsync.title",
    "bgremove.cancel", "common.close",
  ]);
  assert.equal(found.length, 29, "số call site t() phải = 29");
});

// ================= SceneModal =================
check("Scene: dùng modal-backdrop (không dùng modal-overlay)", () => {
  assert.ok(SCENE.includes('className="modal-backdrop"'), "thiếu modal-backdrop");
  assert.ok(!SCENE.includes('className="modal-overlay"'), "còn modal-overlay trong JSX");
});
check("Scene: dùng modal + giữ modifier scene-modal (không dùng modal-card)", () => {
  assert.ok(/className="modal scene-modal"/.test(SCENE), "thiếu className=\"modal scene-modal\"");
  assert.ok(/className="modal"/.test(SCENE), "thiếu className=\"modal\" (early-return)");
  assert.ok(!SCENE.includes('className="modal-card'), "còn modal-card trong JSX");
});
check("Scene: đủ 4 modal-body + 4 modal-actions", () => {
  assert.equal(divSpans(SCENE, isBody).length, 4, "số modal-body phải = 4 (noClip/config/running/review)");
  assert.equal(divSpans(SCENE, isActions).length, 4, "số modal-actions phải = 4");
});
checkFooterStructure("Scene", SCENE);
check("Scene: mỗi footer vẫn chứa đúng nút của bước đó (không mất nút khi dời)", () => {
  const actions = divSpans(SCENE, isActions);
  const text = (i: number) => SCENE.slice(actions[i].start, actions[i].end);
  assert.ok(text(0).includes('i18nT("common.close")'), "footer noClip thiếu Đóng");
  assert.ok(text(1).includes('i18nT("scene.scan")') && text(1).includes('i18nT("common.cancel")'), "footer config thiếu Quét/Huỷ");
  assert.ok(text(2).includes('i18nT("common.cancel")'), "footer running thiếu Huỷ");
  assert.ok(text(3).includes('i18nT("scene.applyBtn"') && text(3).includes('i18nT("scene.rescan")') && text(3).includes('i18nT("common.close")'), "footer review thiếu Áp dụng/Quét lại/Đóng");
});
check("Scene: không còn className=\"row\" chưa định nghĩa", () => {
  assert.ok(!SCENE.includes('className="row"'), "còn dùng class row chưa định nghĩa làm hàng nút");
});
check("Scene: đủ 29 key i18n, 32 call site — không thêm/bớt key", () => {
  const found = [...SCENE.matchAll(/i18nT\("([a-zA-Z.]+)"/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(found)].sort(), [
    "common.bridgeConn", "common.cancel", "common.close",
    "scene.applyBtn", "scene.aria", "scene.ariaAuto", "scene.bridgeErr",
    "scene.clipInfo", "scene.desc", "scene.elapsed", "scene.failed",
    "scene.found", "scene.head", "scene.keepNote", "scene.noCutsSelected",
    "scene.noFile", "scene.noStream", "scene.noValidCuts", "scene.notFound",
    "scene.rescan", "scene.reverseNote", "scene.scan", "scene.sending",
    "scene.sensHigh", "scene.sensLabel", "scene.sensLow", "scene.sensMid",
    "scene.speedNote", "scene.splitFail",
  ]);
  assert.equal(found.length, 32, "số call site i18nT() phải = 32");
});

// ================= Hợp đồng CSS + sweep toàn repo =================
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
check("CSS .modal-body: cuộn nội bộ; .modal-actions đã định nghĩa", () => {
  const b = ruleBlock(CSS, ".modal-body");
  assert.ok(/overflow-y:\s*auto/.test(b), ".modal-body thiếu overflow-y:auto");
  const a = ruleBlock(CSS, ".modal-actions");
  assert.ok(/display:\s*flex/.test(a), ".modal-actions thiếu display:flex");
});
check("CSS .scene-modal: modifier đã định nghĩa (min 420 / max 520)", () => {
  const b = ruleBlock(CSS, ".scene-modal");
  assert.ok(/min-width:\s*420px/.test(b), ".scene-modal thiếu min-width:420px");
  assert.ok(/max-width:\s*520px/.test(b), ".scene-modal thiếu max-width:520px");
});
check("modal-overlay / modal-card thật sự chưa được định nghĩa trong CSS", () => {
  for (const [name, css] of [["styles.css", CSS], ["mobile.css", MOBILE_CSS]] as const) {
    assert.ok(!/\.modal-overlay\s*\{/.test(css), `${name} đã có .modal-overlay (giả định test đổi)`);
    assert.ok(!/\.modal-card\s*\{/.test(css), `${name} đã có .modal-card (giả định test đổi)`);
  }
});
check("sweep: không component nào còn dùng modal-card/modal-overlay trong JSX", () => {
  const dir = join(SRC_DIR, "components");
  const bad: string[] = [];
  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".tsx")) continue;
    const src = readFileSync(join(dir, f), "utf8");
    if (/className="modal-card/.test(src) || /className="modal-overlay"/.test(src)) bad.push(f);
  }
  assert.deepEqual(bad, [], `còn dùng modal-card/modal-overlay: ${bad.join(", ")}`);
});

console.log(`modalCard58O4.test: PASS (${pass}/${total})`);
