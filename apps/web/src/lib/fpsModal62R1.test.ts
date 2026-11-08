/**
 * fpsModal62R1.test.ts — Phase 9 đợt 62, luồng R1: khóa thứ tự z-index
 * modal > FPS overlay (đóng nợ đợt 61 §5.1).
 *
 * Bug: PerfOverlay pill "📈 FPS" (position: fixed, z-index 300, luôn mount
 * trong App) cao hơn .modal-backdrop (z-index 100). Ở mobile modal là
 * bottom-sheet (đáy = đáy viewport) nên pill đè lên góc phải footer,
 * che đuôi nút chính — đo headed thật trước sửa: pill đè nút chính
 * 1996.8px² (vi + en @390×844), panel FPS mở đè trọn nút 6776px², click
 * chuột thật vào đuôi nút mở panel FPS thay vì bấm nút.
 *
 * Hướng sửa (quyết bằng đo + lý do, xem LIMITS R1): NÂNG .modal-backdrop
 * lên trên 300 thay vì ẩn pill FPS — modal theo định nghĩa phải là lớp
 * trên cùng và nhận mọi pointer input khi mở; ẩn pill đòi nối trạng thái
 * "có modal mở" qua App + ~12 modal (xâm lấn, mà panel FPS mở cũng cần
 * xử lý y hệt). Nâng backdrop kéo theo 2 hệ quả phải giữ nguyên thứ tự
 * cũ: .toasts (200) và .tour-card (120) vốn đang TRÊN backdrop (100) —
 * nếu chỉ nâng backdrop thì toast hiện lúc modal mở sẽ chìm dưới lớp mờ
 * và tour card mất click; nên nâng cả 2 lên trên backdrop mới.
 * Thứ tự cuối: splash 200 < pill/panel FPS 300 < backdrop 400 <
 * tour-card 450 < toasts 500.
 * Hệ quả có chủ đích (ghi rõ trong LIMITS): toast hiện trong lúc modal
 * mở vẫn nổi trên modal; toast cũng che pill FPS trong vài giây nó hiện
 * (toast là UI transient ưu tiên cao nhất, chấp nhận được).
 *
 * Chạy (mẫu các test Node khác trong repo):
 *   ./node_modules/.bin/esbuild apps/web/src/lib/fpsModal62R1.test.ts \
 *     --bundle --platform=node --format=cjs --outfile=/tmp/round62-r1/r1.test.cjs \
 *     && node /tmp/round62-r1/r1.test.cjs
 * Test tĩnh thuần: chỉ đọc file text (styles.css, mobile.css,
 * PerfOverlay.tsx), không cần DOM.
 */
import * as fs from "node:fs";
import * as path from "node:path";

// KHÔNG dùng __dirname (sau esbuild bundle nó trỏ về thư mục output /tmp).
// Theo quy ước test tĩnh trong repo: giải quyết từ process.cwd(), chạy từ
// gốc repo (ứng cử viên thứ 2 phòng khi cwd đã là apps/web).
function resolveFromCwd(...parts: string[]): string {
  const candidates = [
    path.resolve(process.cwd(), ...parts),
    path.resolve(process.cwd(), ...parts.slice(2)),
  ];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  return candidates[0];
}
const STYLES = resolveFromCwd("apps", "web", "src", "styles.css");
const MOBILE = resolveFromCwd("apps", "web", "src", "mobile.css");
const PERF = resolveFromCwd(
  "apps",
  "web",
  "src",
  "components",
  "PerfOverlay.tsx",
);

/** z-index trong rule `.sel { ... }` đầu tiên khớp; null nếu không có. */
function ruleZ(css: string, sel: string): number | null {
  const esc = sel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = css.match(new RegExp(esc + "\\s*\\{([^}]*)\\}", "s"));
  if (!m) return null;
  const z = m[1].match(/z-index\s*:\s*(\d+)/);
  return z ? Number(z[1]) : null;
}

let passed = 0;
let failed = 0;
const failures: string[] = [];
function check(name: string, ok: boolean, detail: string) {
  if (ok) {
    passed++;
    console.log(`PASS ${name} — ${detail}`);
  } else {
    failed++;
    failures.push(name);
    console.log(`FAIL ${name} — ${detail}`);
  }
}

async function main() {
  const css = fs.readFileSync(STYLES, "utf8");
  const mobile = fs.readFileSync(MOBILE, "utf8");
  const perf = fs.readFileSync(PERF, "utf8");

  const backdropZ = ruleZ(css, ".modal-backdrop");
  const toastsZ = ruleZ(css, ".toasts");
  const tourZ = ruleZ(css, ".tour-card");
  const splashZ = ruleZ(css, ".splash");
  const pillZs = [...perf.matchAll(/zIndex:\s*(\d+)/g)].map((m) => Number(m[1]));
  const mobileBackdropZ = ruleZ(mobile, ".modal-backdrop");

  check(
    "T1 backdrop trên FPS (400 > 300)",
    backdropZ !== null && backdropZ === 400,
    `backdrop z=${backdropZ} (cần đúng 400 — giá trị đã chọn, trên pill/panel 300)`,
  );
  check(
    "T2 PerfOverlay pill + panel đều 300, đều dưới backdrop",
    pillZs.length === 2 &&
      pillZs.every((z) => z === 300) &&
      backdropZ !== null &&
      pillZs.every((z) => z < backdropZ),
    `pill/panel z=[${pillZs.join(", ")}], backdrop z=${backdropZ}`,
  );
  check(
    "T3 toasts vẫn trên backdrop (500 > 400)",
    toastsZ !== null && backdropZ !== null && toastsZ > backdropZ,
    `toasts z=${toastsZ}, backdrop z=${backdropZ} — toast hiện lúc modal mở vẫn thấy được`,
  );
  check(
    "T4 tour-card vẫn trên backdrop (450 > 400)",
    tourZ !== null && backdropZ !== null && tourZ > backdropZ,
    `tour-card z=${tourZ}, backdrop z=${backdropZ} — giữ thứ tự cũ (tour vốn trên modal)`,
  );
  check(
    "T5 splash dưới backdrop (200 < 400)",
    splashZ !== null && backdropZ !== null && splashZ < backdropZ,
    `splash z=${splashZ}, backdrop z=${backdropZ} — splash chỉ hiện lúc !ready, không modal nào mở lúc đó`,
  );
  check(
    "T6 mobile.css không override z-index của .modal-backdrop",
    mobileBackdropZ === null,
    mobileBackdropZ === null
      ? "mobile.css .modal-backdrop không đặt z-index — sửa ở styles.css có hiệu lực cả mobile"
      : `mobile.css đặt backdrop z=${mobileBackdropZ} — sẽ lấn sửa ở styles.css`,
  );

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) console.log(`FAILED: ${failures.join("; ")}`);
  process.exitCode = failed > 0 ? 1 : 0;
}

main().catch((e) => {
  console.error("HARNESS LỖI:", e);
  process.exitCode = 2;
});
