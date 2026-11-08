// escapeModals59P2.test.ts — Phase 9 đợt 59, luồng P2: khóa sửa nợ
// đợt 58 §6.2 (O1) — phím Escape chưa đóng được TourCard,
// TemplatePackModal, TemplatePicker (chỉ WelcomeModal đã có pattern
// chuẩn ở đợt 58, xem docs/PHASE9_ROUND58_O1_WELCOME_ESCAPE_LIMITS.md).
//
// PHƯƠNG PHÁP (ghi rõ): test TĨNH trên source, không render React —
// repo không có jsdom trong devDeps và cả 3 modal đều kéo store/i18n
// nên không mount được độc lập bằng esbuild (cùng lý do test O1 đợt 58
// dùng phương pháp tĩnh). Test khóa các bất biến mà phép đo headed đã
// chứng minh là nguyên nhân + cách sửa (pattern Escape tự chứa của
// WelcomeModal đợt 58, noi theo SceneModal/BeatSyncModal):
//   (a) mỗi modal tự đăng ký keydown listener trên window (không dựa
//       vào handler toàn cục của App — handler đó chỉ đóng
//       export/caption/silence/load-report, không có nhánh
//       tour/pack/template);
//   (b) handler bắt đúng e.key === "Escape" và đóng theo đúng đường
//       đóng của nút đóng hiện có — TourCard/PackModal: onClose() như
//       nút ✕ (KHÔNG gọi finish() — ✕ cũng không đánh dấu tour xong);
//       TemplatePicker bước 2: quay lại danh sách như nút ✕ của bước 2
//       (setSelected(null) + setError(null)), bước 1: onClose();
//   LƯU Ý ĐỢT 60 Q10: quyết định bước 2 đã ĐỔI — Escape nay ĐÓNG HẲN
//   modal ở cả 2 bước (onClose()), vì nút ← bước 2 là điều hướng chứ
//   không phải nút đóng; đường đóng thật là nút "Hủy"/backdrop. Hai
//   check TemplatePicker dưới đã cập nhật theo Q10; chi tiết xem
//   docs/PHASE9_ROUND60_Q10_ESCAPE_FORMS_LIMITS.md + test
//   escapeForms60Q10.test.ts. Tương tự, PackModal nay chặn đóng khi
//   busy/ttsBusy (Q10) nên check deps + hồi quy ✕/backdrop dưới cũng
//   đã cập nhật theo.
//   (c) listener được gỡ đúng (removeEventListener trong cleanup của
//       cùng useEffect) — không rò listener sau khi modal đóng;
//   (d) guard bỏ qua INPUT/TEXTAREA/SELECT (quy ước O1) nhưng KHÔNG
//       chặn BUTTON — Escape vẫn hoạt động khi focus đang ở nút trong
//       modal (quan trọng với TemplatePicker bước 2: form có input/
//       select nên guard mới có ý nghĩa thật).
// Bằng chứng động (headed thật, trước/sau): xem
// docs/PHASE9_ROUND59_P2_ESCAPE_MODALS_LIMITS.md + harness
// apps/web/scripts/clicktest-59p2-escape-modals.mjs.
//
// Chạy bằng esbuild bundle (mẫu các test lib khác, chạy từ gốc repo):
//   ./node_modules/.bin/esbuild apps/web/src/lib/escapeModals59P2.test.ts \
//     --bundle --platform=node --format=cjs \
//     --outfile=/tmp/round59-p2/escapeModals59P2.test.cjs \
//     && node /tmp/round59-p2/escapeModals59P2.test.cjs
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
    if (existsSync(join(c, "components", "onboarding", "TourCard.tsx"))) return c;
  }
  throw new Error(`không tìm thấy apps/web/src (chạy từ gốc repo; đã thử: ${candidates.join(", ")})`);
}
const SRC_DIR = findSrc();
const TOUR = readFileSync(join(SRC_DIR, "components", "onboarding", "TourCard.tsx"), "utf8");
const PACK = readFileSync(join(SRC_DIR, "components", "onboarding", "TemplatePackModal.tsx"), "utf8");
const PICKER = readFileSync(join(SRC_DIR, "components", "TemplatePicker.tsx"), "utf8");

let pass = 0;
let total = 0;
const failures: string[] = [];
function check(name: string, fn: () => void): void {
  total++;
  try {
    fn();
    pass++;
    console.log(`  ok ${total} - ${name}`);
  } catch (e) {
    failures.push(name);
    console.error(`  FAIL ${total} - ${name}: ${(e as Error).message}`);
  }
}

/**
 * Trích thân nhánh `if (e.key === "Escape") { ... }` bằng đếm ngoặc
 * nhọn cân bằng (nhánh TemplatePicker chứa if/else lồng nhau nên regex
 * `[\s\S]*?}` sẽ cắt sai).
 */
function extractEscapeBranch(src: string, label: string): string {
  const key = 'if (e.key === "Escape")';
  const start = src.indexOf(key);
  assert.ok(start >= 0, `${label}: không thấy nhánh ${key}`);
  const open = src.indexOf("{", start + key.length);
  assert.ok(open >= 0, `${label}: không thấy "{" mở nhánh Escape`);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") {
      depth--;
      if (depth === 0) return src.slice(open + 1, i);
    }
  }
  throw new Error(`${label}: nhánh Escape không đóng ngoặc cân bằng`);
}

/** Khóa guard input + không chặn button cho 1 modal (quy ước O1). */
function checkGuard(src: string, label: string): void {
  check(`${label}: guard bỏ qua INPUT/TEXTAREA/SELECT`, () => {
    assert.ok(/el\.tagName\s*===\s*"INPUT"/.test(src), "thiếu guard INPUT");
    assert.ok(/el\.tagName\s*===\s*"TEXTAREA"/.test(src), "thiếu guard TEXTAREA");
    assert.ok(/el\.tagName\s*===\s*"SELECT"/.test(src), "thiếu guard SELECT");
  });
  check(`${label}: guard KHÔNG chặn BUTTON (Escape hoạt động khi focus ở nút trong modal)`, () => {
    assert.ok(!/"BUTTON"/.test(src), "guard chặn BUTTON — Escape sẽ chết khi focus đang ở nút trong modal");
  });
}

// ================= TourCard =================
const TOUR_BODY = TOUR.slice(TOUR.indexOf("export function TourCard"));
check("TourCard: import useEffect từ react", () => {
  assert.ok(/import\s*\{\s*useEffect[^}]*\}\s*from\s*"react"/.test(TOUR), "thiếu import useEffect");
});
check("TourCard: đăng ký window.addEventListener(\"keydown\", ...)", () => {
  assert.ok(/window\.addEventListener\("keydown",\s*onKey\)/.test(TOUR_BODY), "không thấy window.addEventListener(\"keydown\", onKey) trong TourCard");
});
check("TourCard: nhánh Escape gọi onClose() như nút ✕", () => {
  const branch = extractEscapeBranch(TOUR_BODY, "TourCard");
  assert.ok(/onClose\(\)/.test(branch), "nhánh Escape thiếu onClose()");
});
check("TourCard: nhánh Escape KHÔNG gọi finish() (✕ cũng không đánh dấu tour xong)", () => {
  const branch = extractEscapeBranch(TOUR_BODY, "TourCard");
  assert.ok(!/finish\(\)/.test(branch), "nhánh Escape gọi finish() — sai đường đóng của nút ✕ (✕ chỉ onClose, không ghi vcut-tour-done)");
  assert.ok(!/TOUR_DONE_KEY/.test(branch), "nhánh Escape chạm TOUR_DONE_KEY — sai đường đóng của nút ✕");
});
check("TourCard: cleanup removeEventListener(\"keydown\", onKey) trong cùng useEffect", () => {
  assert.ok(/return\s*\(\)\s*=>\s*window\.removeEventListener\("keydown",\s*onKey\)/.test(TOUR_BODY), "không thấy cleanup removeEventListener(\"keydown\", onKey)");
});
check("TourCard: effect keydown có deps [onClose]", () => {
  assert.ok(/\},\s*\[onClose\]\)/.test(TOUR_BODY), "effect keydown phải có deps [onClose]");
});
checkGuard(TOUR_BODY, "TourCard");
check("TourCard: nút ✕ / \"Bỏ qua\" vẫn onClick={onClose} (hồi quy)", () => {
  assert.ok(/onClick=\{onClose\}/.test(TOUR_BODY), "nút ✕ phải giữ onClick={onClose}");
  assert.ok(/<button type="button" onClick=\{onClose\}>/.test(TOUR_BODY), "nút \"Bỏ qua\" phải giữ onClick={onClose}");
});

// ================= TemplatePackModal =================
const PACK_BODY = PACK.slice(PACK.indexOf("export function TemplatePackModal"));
check("TemplatePackModal: import useEffect từ react", () => {
  assert.ok(/import\s*\{\s*useEffect[^}]*\}\s*from\s*"react"/.test(PACK), "thiếu import useEffect");
});
check("TemplatePackModal: đăng ký window.addEventListener(\"keydown\", ...)", () => {
  assert.ok(/window\.addEventListener\("keydown",\s*onKey\)/.test(PACK_BODY), "không thấy window.addEventListener(\"keydown\", onKey) trong TemplatePackModal");
});
check("TemplatePackModal: nhánh Escape gọi onClose() như nút ✕ / backdrop", () => {
  const branch = extractEscapeBranch(PACK_BODY, "TemplatePackModal");
  assert.ok(/onClose\(\)/.test(branch), "nhánh Escape thiếu onClose()");
});
check("TemplatePackModal: cleanup removeEventListener(\"keydown\", onKey) trong cùng useEffect", () => {
  assert.ok(/return\s*\(\)\s*=>\s*window\.removeEventListener\("keydown",\s*onKey\)/.test(PACK_BODY), "không thấy cleanup removeEventListener(\"keydown\", onKey)");
});
check("TemplatePackModal: effect keydown có deps [onClose, busy, ttsBusy]", () => {
  assert.ok(/\},\s*\[onClose,\s*busy,\s*ttsBusy\]\)/.test(PACK_BODY), "effect keydown phải có deps [onClose, busy, ttsBusy] (Q10: nhánh Escape chặn khi busy/ttsBusy nên closure phải tươi)");
});
checkGuard(PACK_BODY, "TemplatePackModal");
check("TemplatePackModal: nút ✕ / backdrop vẫn đóng qua onClose khi rảnh (hồi quy, Q10: chặn chỉ lúc busy/ttsBusy)", () => {
  assert.ok(/onClick=\{onClose\}/.test(PACK_BODY), "nút ✕ phải giữ onClick={onClose}");
  assert.ok(/disabled=\{busy \|\| ttsBusy\}/.test(PACK_BODY), "nút ✕ phải disabled khi busy/ttsBusy (Q10)");
  assert.ok(/onClick=\{busy \|\| ttsBusy \? undefined : onClose\}/.test(PACK_BODY), "backdrop phải vô hiệu khi busy/ttsBusy, còn onClose khi rảnh (Q10)");
});

// ================= TemplatePicker =================
const PICKER_BODY = PICKER.slice(PICKER.indexOf("export function TemplatePicker"));
check("TemplatePicker: import useEffect từ react", () => {
  assert.ok(/import\s*\{\s*useEffect[^}]*\}\s*from\s*"react"/.test(PICKER), "thiếu import useEffect");
});
check("TemplatePicker: đăng ký window.addEventListener(\"keydown\", ...)", () => {
  assert.ok(/window\.addEventListener\("keydown",\s*onKey\)/.test(PICKER_BODY), "không thấy window.addEventListener(\"keydown\", onKey) trong TemplatePicker");
});
check("TemplatePicker: nhánh Escape bước 2 ĐÓNG HẲN modal như nút Hủy (Q10 đổi quyết định P2)", () => {
  const branch = extractEscapeBranch(PICKER_BODY, "TemplatePicker");
  assert.ok(/onClose\(\)/.test(branch), "nhánh Escape thiếu onClose()");
  assert.ok(!/setSelected\(null\)/.test(branch), "Q10: nhánh Escape không còn setSelected(null) — bước 2 đóng hẳn, không về gallery (nút ← vẫn quay lại bằng chuột)");
  assert.ok(!/if\s*\(\s*selected\s*\)/.test(branch), "Q10: nhánh Escape không còn rẽ theo selected");
});
check("TemplatePicker: nhánh Escape bước 1 (gallery) gọi onClose()", () => {
  const branch = extractEscapeBranch(PICKER_BODY, "TemplatePicker");
  assert.ok(/onClose\(\)/.test(branch), "nhánh Escape thiếu onClose() cho bước 1");
});
check("TemplatePicker: cleanup removeEventListener(\"keydown\", onKey) trong cùng useEffect", () => {
  assert.ok(/return\s*\(\)\s*=>\s*window\.removeEventListener\("keydown",\s*onKey\)/.test(PICKER_BODY), "không thấy cleanup removeEventListener(\"keydown\", onKey)");
});
check("TemplatePicker: effect keydown có deps [onClose]", () => {
  assert.ok(/\},\s*\[onClose\]\)/.test(PICKER_BODY), "effect keydown phải có deps [onClose] (Q10: nhánh không còn rẽ theo selected)");
});
checkGuard(PICKER_BODY, "TemplatePicker");
check("TemplatePicker: nút ✕ 2 bước còn nguyên (hồi quy)", () => {
  assert.ok(/onClick=\{onClose\}/.test(PICKER_BODY), "nút ✕ bước 1 phải giữ onClick={onClose}");
  assert.ok(/onClick=\{\(\) => \{ setSelected\(null\); setError\(null\); \}\}/.test(PICKER_BODY), "nút ✕ bước 2 phải giữ handler quay lại danh sách");
});

console.log(`P2 Escape modals (đợt 59): ${pass}/${total} pass`);
if (failures.length > 0) {
  console.error(`FAIL: ${failures.length} check đỏ — ${failures.join("; ")}`);
  process.exitCode = 1;
}
