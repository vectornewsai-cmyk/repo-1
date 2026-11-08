// welcomeEscape58O1.test.ts — Phase 9 đợt 58, luồng O1: khóa sửa nợ
// đợt 57 §6.1(a) — phím Escape không đóng được WelcomeModal (chỉ nút
// "Để sau" mới đóng; phát hiện headed của luồng N9 đợt 57).
//
// PHƯƠNG PHÁP (ghi rõ): test TĨNH trên source, không render React —
// repo không có jsdom trong devDeps và WelcomeModal kéo cả store/i18n
// nên không mount được độc lập bằng esbuild (cùng lý do test N1 đợt 57
// dùng phương pháp tĩnh). Test khóa 4 bất biến mà phép đo headed đã
// chứng minh là nguyên nhân + cách sửa (theo đúng pattern Escape tự
// chứa sẵn có của SceneModal.tsx:80 / BeatSyncModal.tsx:91 /
// LoadReportPanel.tsx:82):
//   (a) WelcomeModal tự đăng ký keydown listener trên window (không
//       dựa vào handler toàn cục của App — handler đó chỉ đóng
//       export/caption/silence/load-report, không có nhánh welcome);
//   (b) handler bắt đúng e.key === "Escape" và đóng theo đúng đường
//       đóng của các nút (markWelcomed() + onClose()) — Escape phải
//       đánh dấu đã chào, nếu không modal sẽ mở lại ở lần mount sau;
//   (c) listener được gỡ đúng (removeEventListener trong cleanup của
//       cùng useEffect) — không rò listener sau khi modal đóng;
//   (d) guard bỏ qua INPUT/TEXTAREA/SELECT (quy ước SceneModal/
//       BeatSyncModal) nhưng KHÔNG chặn BUTTON — Escape vẫn hoạt động
//       khi focus đang ở nút trong modal.
// Bằng chứng động (headed thật, trước/sau): xem
// docs/PHASE9_ROUND58_O1_WELCOME_ESCAPE_LIMITS.md + harness
// apps/web/scripts/clicktest-58o1-welcome-escape.mjs.
//
// Chạy bằng esbuild bundle (mẫu các test lib khác, chạy từ gốc repo):
//   ./node_modules/.bin/esbuild apps/web/src/lib/welcomeEscape58O1.test.ts \
//     --bundle --platform=node --format=cjs \
//     --outfile=/tmp/round58-o1/welcomeEscape58O1.test.cjs \
//     && node /tmp/round58-o1/welcomeEscape58O1.test.cjs
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
    if (existsSync(join(c, "components", "onboarding", "WelcomeModal.tsx"))) return c;
  }
  throw new Error(`không tìm thấy apps/web/src (chạy từ gốc repo; đã thử: ${candidates.join(", ")})`);
}
const SRC_DIR = findSrc();
const SRC = readFileSync(join(SRC_DIR, "components", "onboarding", "WelcomeModal.tsx"), "utf8");

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

// ---- Trích span thân component WelcomeModal (từ "export function
// WelcomeModal" tới cuối file — component là export cuối file) ----
const compStart = SRC.indexOf("export function WelcomeModal");
assert.ok(compStart >= 0, "không tìm thấy export function WelcomeModal");
const BODY = SRC.slice(compStart);

// ---- (a) useEffect + đăng ký keydown trên window ------------------
check("import useEffect từ react", () => {
  assert.ok(/import\s*\{\s*useEffect\s*\}\s*from\s*"react"/.test(SRC), "thiếu import { useEffect } from \"react\"");
});
check("đăng ký window.addEventListener(\"keydown\", ...)", () => {
  assert.ok(/window\.addEventListener\("keydown",\s*onKey\)/.test(BODY), "không thấy window.addEventListener(\"keydown\", onKey) trong WelcomeModal");
});

// ---- (b) nhánh Escape đóng theo đúng đường đóng của nút -----------
check("handler bắt e.key === \"Escape\"", () => {
  assert.ok(/if\s*\(\s*e\.key\s*===\s*"Escape"\s*\)/.test(BODY), "không thấy nhánh if (e.key === \"Escape\")");
});
check("nhánh Escape gọi markWelcomed() rồi onClose() (đánh dấu đã chào)", () => {
  const m = BODY.match(/if\s*\(\s*e\.key\s*===\s*"Escape"\s*\)\s*\{([\s\S]*?)\}/);
  assert.ok(m, "không trích được thân nhánh Escape");
  const branch = m[1];
  assert.ok(/markWelcomed\(\)/.test(branch), "nhánh Escape thiếu markWelcomed() — modal sẽ mở lại ở lần mount sau");
  assert.ok(/onClose\(\)/.test(branch), "nhánh Escape thiếu onClose()");
  assert.ok(
    branch.indexOf("markWelcomed()") < branch.indexOf("onClose()"),
    "nhánh Escape phải markWelcomed() trước onClose()",
  );
});

// ---- (c) cleanup gỡ đúng listener ---------------------------------
check("cleanup removeEventListener(\"keydown\", onKey) trong cùng useEffect", () => {
  assert.ok(
    /return\s*\(\)\s*=>\s*window\.removeEventListener\("keydown",\s*onKey\)/.test(BODY),
    "không thấy cleanup removeEventListener(\"keydown\", onKey)",
  );
});
check("effect phụ thuộc [onClose] (đăng ký lại khi onClose đổi)", () => {
  assert.ok(/\},\s*\[onClose\]\)/.test(BODY), "effect keydown phải có deps [onClose] (quy ước SceneModal/BeatSyncModal)");
});

// ---- (d) guard input nhưng không chặn button ----------------------
check("guard bỏ qua INPUT/TEXTAREA/SELECT", () => {
  assert.ok(/el\.tagName\s*===\s*"INPUT"/.test(BODY), "thiếu guard INPUT");
  assert.ok(/el\.tagName\s*===\s*"TEXTAREA"/.test(BODY), "thiếu guard TEXTAREA");
  assert.ok(/el\.tagName\s*===\s*"SELECT"/.test(BODY), "thiếu guard SELECT");
});
check("guard KHÔNG chặn BUTTON (Escape hoạt động khi focus ở nút trong modal)", () => {
  assert.ok(!/"BUTTON"/.test(BODY), "guard chặn BUTTON — Escape sẽ chết khi focus đang ở nút trong modal");
});

// ---- Hồi quy: nút đóng cũ còn nguyên ------------------------------
check("nút ✕ / \"Để sau\" vẫn đóng qua close()", () => {
  assert.ok(/onClick=\{close\}/.test(BODY), "nút đóng phải giữ onClick={close}");
  assert.ok(/const close = \(\) => \{\s*markWelcomed\(\);\s*onClose\(\);?\s*\}/.test(BODY), "hàm close() phải giữ markWelcomed() + onClose()");
});

console.log(`O1 WelcomeModal Escape (đợt 58): ${pass}/${total} pass`);
if (failures.length > 0) {
  console.error(`FAIL: ${failures.length} check đỏ — ${failures.join("; ")}`);
  process.exitCode = 1;
}
