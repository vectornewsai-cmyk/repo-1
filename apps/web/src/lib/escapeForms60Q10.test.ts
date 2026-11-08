// escapeForms60Q10.test.ts — Phase 9 đợt 60, luồng Q10: khóa sửa nợ
// đợt 59 §6.8 (P2) — Escape ở form Picker + PackModal busy +
// TemplatePicker bước 2, đo headed thật (xem
// docs/PHASE9_ROUND60_Q10_ESCAPE_FORMS_LIMITS.md).
//
// PHƯƠNG PHÁP: test TĨNH trên source, không render React (cùng lý do
// test P2/O1: repo không có jsdom, modal kéo store/i18n). Hành vi thật
// được chứng minh bằng click-test headed
// apps/web/scripts/clicktest-60q10-escape-forms.mjs.
//
// Quyết định đợt này (ghi rõ, khác P2 ở 2 điểm):
//   (a) TemplatePicker bước 2: Escape ĐÓNG HẲN modal (onClose()),
//       không quay lại gallery nữa. Lý do: Escape là phím dismiss
//       toàn cục = nút "Hủy" (common.cancel → onClose()) — đường
//       đóng thật của bước 2; nút ← trên header bước 2 là điều
//       hướng "quay lại danh sách", KHÔNG phải nút đóng (P2 đã đọc
//       nhầm ← thành ✕). Backdrop bước 2 cũng onClose() nên Escape
//       đóng hẳn mới nhất quán. Nút ← vẫn còn nguyên để quay lại
//       gallery bằng chuột.
//   (b) TemplatePackModal đang busy (tạo pack) hoặc ttsBusy (tạo
//       giọng đọc mẫu): Escape KHÔNG làm gì; nút ✕ disabled và
//       backdrop vô hiệu trong lúc đó. Lý do: create()/makeTts()
//       KHÔNG hủy được an toàn (generatePackFiles / recordPackMedia /
//       importFiles không nhận AbortSignal) — đóng modal giữa chừng
//       thì job vẫn chạy nền, replaceProject + import media sau lưng
//       user (user tưởng đã hủy). Chặn đóng lúc busy là pattern
//       modal chuẩn; finally{} luôn reset busy/ttsBusy nên không kẹt
//       modal (job luôn kết thúc, thành công hay lỗi, rồi Escape lại
//       hoạt động).
//
// Chạy bằng esbuild bundle (mẫu test P2, chạy từ gốc repo):
//   ./node_modules/.bin/esbuild apps/web/src/lib/escapeForms60Q10.test.ts \
//     --bundle --platform=node --format=cjs \
//     --outfile=/tmp/round60-q10/escapeForms60Q10.test.cjs \
//     && node /tmp/round60-q10/escapeForms60Q10.test.cjs
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

function findSrc(): string {
  const candidates = [
    resolve(process.cwd(), "apps/web/src"),
    resolve(process.cwd(), "src"),
  ];
  for (const c of candidates) {
    if (existsSync(join(c, "components", "TemplatePicker.tsx"))) return c;
  }
  throw new Error(`không tìm thấy apps/web/src (chạy từ gốc repo; đã thử: ${candidates.join(", ")})`);
}
const SRC_DIR = findSrc();
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

/** Trích thân nhánh `if (e.key === "Escape") { ... }` bằng đếm ngoặc cân bằng. */
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

// ================= TemplatePicker — bước 2 đóng hẳn =================
const PICKER_BODY = PICKER.slice(PICKER.indexOf("export function TemplatePicker"));
check("TemplatePicker: nhánh Escape gọi onClose() (đóng hẳn, cả bước 2)", () => {
  const branch = extractEscapeBranch(PICKER_BODY, "TemplatePicker");
  assert.ok(/onClose\(\)/.test(branch), "nhánh Escape thiếu onClose()");
});
check("TemplatePicker: nhánh Escape KHÔNG quay lại gallery (không setSelected(null)/setError(null))", () => {
  const branch = extractEscapeBranch(PICKER_BODY, "TemplatePicker");
  assert.ok(!/setSelected\(null\)/.test(branch), "nhánh Escape còn setSelected(null) — bước 2 phải đóng hẳn, không về gallery");
  assert.ok(!/setError\(null\)/.test(branch), "nhánh Escape còn setError(null) — bước 2 phải đóng hẳn, không về gallery");
  assert.ok(!/if\s*\(\s*selected\s*\)/.test(branch), "nhánh Escape còn rẽ theo selected — phải đóng hẳn ở cả 2 bước");
});
check("TemplatePicker: effect keydown có deps [onClose] (không còn phụ thuộc selected)", () => {
  assert.ok(/\},\s*\[onClose\]\)/.test(PICKER_BODY), "effect keydown phải có deps [onClose] (nhánh không còn rẽ theo selected)");
});
check("TemplatePicker: nút ← quay lại danh sách còn nguyên (hồi quy — quay lại bằng chuột vẫn được)", () => {
  assert.ok(/onClick=\{\(\) => \{ setSelected\(null\); setError\(null\); \}\}/.test(PICKER_BODY), "nút ← bước 2 phải giữ handler quay lại danh sách");
});
check("TemplatePicker: nút Hủy bước 2 vẫn onClick={onClose} (hồi quy — Escape = Hủy)", () => {
  assert.ok(/<button onClick=\{onClose\}>\{t\("common\.cancel"\)\}<\/button>/.test(PICKER_BODY), "nút Hủy bước 2 phải giữ onClick={onClose}");
});
check("TemplatePicker: guard INPUT/TEXTAREA/SELECT còn nguyên (Escape trong ô nhập không làm gì)", () => {
  assert.ok(/el\.tagName\s*===\s*"INPUT"/.test(PICKER_BODY), "thiếu guard INPUT");
  assert.ok(/el\.tagName\s*===\s*"TEXTAREA"/.test(PICKER_BODY), "thiếu guard TEXTAREA");
  assert.ok(/el\.tagName\s*===\s*"SELECT"/.test(PICKER_BODY), "thiếu guard SELECT");
  assert.ok(!/"BUTTON"/.test(PICKER_BODY), "guard chặn BUTTON — Escape sẽ chết khi focus đang ở nút trong form");
});
check("TemplatePicker: cleanup removeEventListener còn nguyên", () => {
  assert.ok(/return\s*\(\)\s*=>\s*window\.removeEventListener\("keydown",\s*onKey\)/.test(PICKER_BODY), "không thấy cleanup removeEventListener(\"keydown\", onKey)");
});

// ================= TemplatePackModal — busy chặn đóng =================
const PACK_BODY = PACK.slice(PACK.indexOf("export function TemplatePackModal"));
check("TemplatePackModal: nhánh Escape chặn khi đang tạo (busy)", () => {
  const branch = extractEscapeBranch(PACK_BODY, "TemplatePackModal");
  assert.ok(/busy/.test(branch), "nhánh Escape phải kiểm tra busy trước khi đóng");
  assert.ok(/onClose\(\)/.test(branch), "nhánh Escape thiếu onClose() cho lúc rảnh");
});
check("TemplatePackModal: nhánh Escape chặn khi đang tạo giọng đọc (ttsBusy)", () => {
  const branch = extractEscapeBranch(PACK_BODY, "TemplatePackModal");
  assert.ok(/ttsBusy/.test(branch), "nhánh Escape phải kiểm tra ttsBusy (job TTS cũng import file, không hủy được)");
});
check("TemplatePackModal: nút ✕ disabled khi busy/ttsBusy (đóng bằng chuột cũng bị chặn như Escape)", () => {
  assert.ok(/<button type="button" className="icon-btn" onClick=\{onClose\}[^>]*disabled=\{busy \|\| ttsBusy\}/.test(PACK_BODY), "nút ✕ phải có disabled={busy || ttsBusy}");
});
check("TemplatePackModal: backdrop vô hiệu khi busy/ttsBusy (click backdrop không đóng lúc đang tạo)", () => {
  assert.ok(/<div className="modal-backdrop" onClick=\{busy \|\| ttsBusy \? undefined : onClose\}>/.test(PACK_BODY), "backdrop phải có onClick={busy || ttsBusy ? undefined : onClose}");
});
check("TemplatePackModal: effect keydown có deps theo busy/ttsBusy (closure phải tươi)", () => {
  assert.ok(/\},\s*\[onClose,\s*busy,\s*ttsBusy\]\)/.test(PACK_BODY), "effect keydown phải có deps [onClose, busy, ttsBusy]");
});
check("TemplatePackModal: create()/makeTts() vẫn reset busy/ttsBusy trong finally (không kẹt modal)", () => {
  assert.ok(/finally\s*\{\s*setBusy\(false\);/.test(PACK_BODY), "create() phải reset busy trong finally");
  assert.ok(/finally\s*\{\s*setTtsBusy\(false\);/.test(PACK_BODY), "makeTts() phải reset ttsBusy trong finally");
});
check("TemplatePackModal: guard INPUT/TEXTAREA/SELECT còn nguyên", () => {
  assert.ok(/el\.tagName\s*===\s*"INPUT"/.test(PACK_BODY), "thiếu guard INPUT");
  assert.ok(/el\.tagName\s*===\s*"TEXTAREA"/.test(PACK_BODY), "thiếu guard TEXTAREA");
  assert.ok(/el\.tagName\s*===\s*"SELECT"/.test(PACK_BODY), "thiếu guard SELECT");
});
check("TemplatePackModal: cleanup removeEventListener còn nguyên", () => {
  assert.ok(/return\s*\(\)\s*=>\s*window\.removeEventListener\("keydown",\s*onKey\)/.test(PACK_BODY), "không thấy cleanup removeEventListener(\"keydown\", onKey)");
});

console.log(`Q10 Escape forms (đợt 60): ${pass}/${total} pass`);
if (failures.length > 0) {
  console.error(`FAIL: ${failures.length} check đỏ — ${failures.join("; ")}`);
  process.exitCode = 1;
}
