/**
 * modalSheet63R1.test.ts — Phase 9 đợt 63, luồng R1: khóa thứ tự z-index
 * của mobile sheet + modal mở từ trong sheet (đóng nợ đo headed đợt 62).
 *
 * Bug (đo headed thật M6/M7/M8 @390×844, lần chạy 2–3): modal mở TỪ TRONG
 * bottom-sheet mobile (SceneModal/BeatSyncModal/StorageCleanupPanel — mở qua
 * fab MediaBin/Inspector) render .modal-backdrop (z 400) BÊN TRONG stacking
 * context của .m-sheet-backdrop (position:fixed + z-index 80), nên ở root
 * nó chỉ cao bằng 80 < pill FPS 300: pill hiện xuyên qua lớp mờ của modal
 * và nhận click — M6: pill đè đuôi nút "Quét chuyển cảnh" 682.5px²,
 * elementFromPoint tại tâm vùng giao nhau trúng pill; M7/M8: pill là phần tử
 * trên cùng tại tâm của nó khi modal mở (nút chính không bị che trực tiếp
 * nhưng pill vẫn thấy được + bấm được trên nền modal).
 *
 * Hướng sửa (1 dòng mobile.css): nâng .m-sheet-backdrop 80 → 350 (giữa
 * pill 300 và backdrop 400). Không đụng .modal-backdrop (nó đã đúng 400 —
 * chỉ bị "nhốt" trong context của sheet), không portal modal ra body
 * (xâm lấn 3 component). Thứ tự cuối trên mobile: splash 200 < pill/panel
 * FPS 300 < sheet-backdrop 350 < modal-backdrop 400 < tour-card 450 <
 * toasts 500. Hệ quả có chủ đích: pill/panel FPS bị lớp mờ của sheet che
 * trong lúc sheet mở (không bấm được) — chấp nhận vì pill là công cụ đo,
 * sheet chỉ mở khi user chủ động mở MediaBin/Inspector.
 *
 * Chạy (mẫu fpsModal62R1.test.ts):
 *   ./node_modules/.bin/esbuild apps/web/src/lib/modalSheet63R1.test.ts \
 *     --bundle --platform=node --format=cjs --outfile=/tmp/round63-r1/r1.sheet.test.cjs \
 *     && node /tmp/round63-r1/r1.sheet.test.cjs
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

/** Nội dung rule `.sel { ... }` đầu tiên khớp; "" nếu không có. */
function ruleBody(css: string, sel: string): string {
  const esc = sel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = css.match(new RegExp(esc + "\\s*\\{([^}]*)\\}", "s"));
  return m ? m[1] : "";
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
  const sheetZ = ruleZ(mobile, ".m-sheet-backdrop");
  const fabbarZ = ruleZ(mobile, ".m-fabbar");
  const sheetBody = ruleBody(mobile, ".m-sheet-backdrop");
  const pillZs = [...perf.matchAll(/zIndex:\s*(\d+)/g)].map((m) => Number(m[1]));

  check(
    "T1 sheet-backdrop đúng 350 (giữa pill 300 và backdrop 400)",
    sheetZ !== null && sheetZ === 350,
    `sheet-backdrop z=${sheetZ} (cần đúng 350 — giá trị đã chọn)`,
  );
  check(
    "T2 thứ tự đầy đủ: pill 300 < sheet 350 < backdrop 400",
    pillZs.length === 2 &&
      pillZs.every((z) => z === 300) &&
      sheetZ !== null &&
      backdropZ !== null &&
      pillZs.every((z) => z < sheetZ) &&
      sheetZ < backdropZ,
    `pill/panel z=[${pillZs.join(", ")}], sheet z=${sheetZ}, backdrop z=${backdropZ} — modal trong sheet lại trên pill`,
  );
  check(
    "T3 tour-card + toasts vẫn trên backdrop (450/500 > 400)",
    tourZ !== null &&
      toastsZ !== null &&
      backdropZ !== null &&
      tourZ > backdropZ &&
      toastsZ > backdropZ,
    `tour z=${tourZ}, toasts z=${toastsZ}, backdrop z=${backdropZ}`,
  );
  check(
    "T4 splash vẫn dưới sheet (200 < 350)",
    splashZ !== null && sheetZ !== null && splashZ < sheetZ,
    `splash z=${splashZ}, sheet z=${sheetZ}`,
  );
  check(
    "T5 fabbar vẫn dưới sheet-backdrop (60 < 350, không đổi)",
    fabbarZ !== null && sheetZ !== null && fabbarZ < sheetZ,
    `fabbar z=${fabbarZ}, sheet z=${sheetZ} — fab đã bị lớp mờ sheet che từ trước`,
  );
  check(
    "T6 sheet-backdrop tạo stacking context (position:fixed + z-index)",
    /position\s*:\s*fixed/.test(sheetBody) && sheetZ !== null,
    "position:fixed + z-index khiến mọi modal con (backdrop 400) lấy z hiệu dụng bằng z của sheet ở root — đó chính là cơ chế bug đã đo",
  );

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) console.log(`FAILED: ${failures.join("; ")}`);
  process.exitCode = failed > 0 ? 1 : 0;
}

main().catch((e) => {
  console.error("HARNESS LỖI:", e);
  process.exitCode = 2;
});
