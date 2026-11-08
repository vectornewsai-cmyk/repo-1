// jobNote65S10.test.ts — Phase 9 đợt 65, luồng S10: đổi locale giữa chừng
// lúc jobNote đang hiện (đóng nợ đợt 64 R8 §7.3 / ROUND64_LIMITS §8.10).
//
// Câu hỏi của nợ: khi note "Phục hồi sau khi server restart…" đang hiện
// trong ExportPanel mà user đổi locale vi↔en, text có cập nhật đúng locale
// mới không, có kẹt text cũ không, có crash không?
//
// Cơ chế đã có từ R8 (không sửa): ExportPanel.pollStatus (poll 1s) gọi
// resolveJobNote(data.noteCode, data.note, getLang()) — getLang() đọc
// locale HIỆN TẠI lúc poll, không dùng biến `lang` trong closure của
// interval (closure giữ locale lúc startRender). Test này khóa cơ chế đó
// ở 2 tầng:
//   (1) tầng lib: resolveJobNote là hàm thuần theo locale — cùng một
//       (noteCode, note) cho chuỗi vi với "vi" và chuỗi en với "en",
//       nên poll sau khi đổi locale tất yếu ra chuỗi mới (không kẹt);
//   (2) tầng nối UI (tĩnh, mẫu jobNote64R8): pollStatus gọi đúng
//       getLang() (không phải biến lang), gọi lại mỗi tick poll, và
//       ExportPanel import getLang từ ./i18n.
// Tầng headed (clicktest-65s10-job-note-locale-headed.mjs) đo thật trên
// trình duyệt: note vi → setLang("en") → note en trong ≤1 poll, rồi về vi.
//
// Ghi nhận về đường đổi locale (kiểm chứng tĩnh trong test này, xem §5):
// Đợt 65: nút ngôn ngữ TopBar NẰM DƯỚI .modal-backdrop (z 400 > topbar
// z 30) nên KHÔNG bấm được khi modal Export đang mở — đường đổi locale
// giữa chừng trong web thuần khi đó chỉ qua desktop (menu native).
// Đợt 66 T8: ĐÃ SỬA — .topbar bỏ z-index, nút ngôn ngữ mang class
// .topbar-lang-btn (z 401 > backdrop 400) nên bấm được cả khi modal mở
// (chỉ nút này thoát lên; phần còn lại của TopBar vẫn dưới backdrop).
// Web thuần: đóng modal → mở lại panel NAY RESUME job đang chạy
// (nợ §5.1 đợt 65, đóng ở đợt 66 T8) nên note hiện lại — hành vi R8 §3
// (mở lại không nối) đã bị thay bằng resume, xem LIMITS đợt 66 T8.
//
// Cách chạy (từ gốc repo; bundle ra scratch ngoài repo):
//   ./node_modules/.bin/esbuild apps/web/src/lib/jobNote65S10.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/round65-s10/s10.test.cjs \
//     && node /tmp/round65-s10/s10.test.cjs
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { resolveJobNote, jobNoteLabel } from "./jobNote64R8";

/** Khai báo tối thiểu để không cần @types/node (mẫu M5/R8). */
declare const process: { cwd: () => string; exitCode: number | undefined };

let pass = 0;
const queue: Array<{ name: string; fn: () => void }> = [];
function ok(name: string, fn: () => void): void {
  queue.push({ name, fn });
}
function runAll(): void {
  for (const t of queue) {
    try {
      t.fn();
      pass++;
      console.log(`  ✓ ${t.name}`);
    } catch (e) {
      console.error(`  ✗ ${t.name}: ${(e as Error).message}`);
      process.exitCode = 1;
    }
  }
  console.log(`S10 job note locale-switch round 65: ${pass}/${queue.length} pass`);
}

/** Tìm file từ cwd (gốc repo hoặc apps/web), mẫu modalSheet63R1/R8. */
function resolveFromCwd(...parts: string[]): string {
  const candidates = [
    resolve(process.cwd(), ...parts),
    resolve(process.cwd(), ...parts.slice(2)),
  ];
  for (const c of candidates) if (existsSync(c)) return c;
  return candidates[0];
}

const FRAG_PATH = resolveFromCwd(
  "apps", "web", "src", "i18n", "fragments", "round64-r8.json",
);
const frag = JSON.parse(readFileSync(FRAG_PATH, "utf8")) as {
  vi: { jobNote: Record<string, string> };
  en: { jobNote: Record<string, string> };
};
const EXPECT_VI = frag.vi.jobNote.recoveredRestart;
const EXPECT_EN = frag.en.jobNote.recoveredRestart;

const EXPORT_PANEL_PATH = resolveFromCwd(
  "apps", "web", "src", "ExportPanel.tsx",
);
const exportPanelSrc = readFileSync(EXPORT_PANEL_PATH, "utf8");

const STYLES_PATH = resolveFromCwd("apps", "web", "src", "styles.css");
const stylesSrc = readFileSync(STYLES_PATH, "utf8");

const TOPBAR_PATH = resolveFromCwd("apps", "web", "src", "TopBar.tsx");
const topbarSrc = readFileSync(TOPBAR_PATH, "utf8");

const DESKTOP_TS_PATH = resolveFromCwd("apps", "web", "src", "desktop.ts");
const desktopTsSrc = readFileSync(DESKTOP_TS_PATH, "utf8");

const BRIDGE_RECOVER_NOTE = EXPECT_VI; // vi fragment khớp từng byte RECOVER_NOTE (R8 khóa)

// --- 1. Tầng lib: resolveJobNote thuần theo locale — đổi locale là đổi text ---
ok("resolveJobNote: cùng job recovered → vi với 'vi', en với 'en' (không kẹt)", () => {
  assert.equal(resolveJobNote("JOB_RECOVERED_RESTART", BRIDGE_RECOVER_NOTE, "vi"), EXPECT_VI);
  assert.equal(resolveJobNote("JOB_RECOVERED_RESTART", BRIDGE_RECOVER_NOTE, "en"), EXPECT_EN);
  assert.notEqual(EXPECT_VI, EXPECT_EN);
});

ok("resolveJobNote: mô phỏng đổi locale giữa chừng vi→en→vi ra đúng chuỗi mỗi lần", () => {
  const seq: Array<"vi" | "en"> = ["vi", "en", "vi", "en"];
  const want = [EXPECT_VI, EXPECT_EN, EXPECT_VI, EXPECT_EN];
  seq.forEach((lang, i) => {
    assert.equal(
      resolveJobNote("JOB_RECOVERED_RESTART", BRIDGE_RECOVER_NOTE, lang),
      want[i],
      `lượt ${i} locale ${lang} phải ra đúng chuỗi`,
    );
  });
});

ok("jobNoteLabel: đổi locale không dính chuỗi locale cũ (không cache theo mã)", () => {
  // Gọi en trước rồi vi: nếu lib cache theo noteCode thì lần 2 sẽ sai.
  assert.equal(jobNoteLabel("JOB_RECOVERED_RESTART", "en"), EXPECT_EN);
  assert.equal(jobNoteLabel("JOB_RECOVERED_RESTART", "vi"), EXPECT_VI);
  assert.equal(jobNoteLabel("JOB_RECOVERED_RESTART", "en"), EXPECT_EN);
});

ok("resolveJobNote: note thô (mã lạ) không bị dịch sai khi đổi locale — giữ nguyên", () => {
  // Mã lạ thì fallback chuỗi thô bridge gửi (tiếng Việt gốc); đổi locale
  // không được biến nó thành chuỗi khác hay mã thô.
  assert.equal(resolveJobNote("JOB_FUTURE_CODE", BRIDGE_RECOVER_NOTE, "en"), BRIDGE_RECOVER_NOTE);
  assert.equal(resolveJobNote("JOB_FUTURE_CODE", BRIDGE_RECOVER_NOTE, "vi"), BRIDGE_RECOVER_NOTE);
});

// --- 2. Tầng nối UI: pollStatus dùng getLang() live, không kẹt closure ---
ok("ExportPanel import getLang từ ./i18n (để poll đọc locale hiện tại)", () => {
  assert.ok(
    /import \{[^}]*\bgetLang\b[^}]*\} from "\.\/i18n"/.test(exportPanelSrc),
    "ExportPanel phải import getLang từ ./i18n",
  );
});

ok("pollStatus resolve note bằng getLang() — KHÔNG dùng biến lang trong closure", () => {
  assert.ok(
    exportPanelSrc.includes("resolveJobNote(data.noteCode, data.note, getLang())"),
    "pollStatus phải gọi resolveJobNote(data.noteCode, data.note, getLang())",
  );
  assert.ok(
    !exportPanelSrc.includes("resolveJobNote(data.noteCode, data.note, lang)"),
    "CẤM dùng biến lang trong closure (sẽ kẹt locale lúc startRender)",
  );
});

ok("resolve note nằm trong tick poll 1s (setRenderNote gọi lại mỗi lần poll)", () => {
  const pollIdx = exportPanelSrc.indexOf("const pollStatus");
  assert.ok(pollIdx >= 0, "thiếu pollStatus");
  const intervalIdx = exportPanelSrc.indexOf("setInterval(async () => {", pollIdx);
  const noteIdx = exportPanelSrc.indexOf("setRenderNote(resolveJobNote(", pollIdx);
  const intervalEnd = exportPanelSrc.indexOf("}, 1000);", noteIdx);
  assert.ok(intervalIdx >= 0 && noteIdx > intervalIdx, "setRenderNote phải nằm trong setInterval của pollStatus");
  assert.ok(intervalEnd > noteIdx, "tick poll phải đóng sau lệnh setRenderNote (poll 1s)");
});

ok("ExportPanel không cache chuỗi note đã resolve (không có biến note thô riêng)", () => {
  // renderNote chỉ là state chuỗi đã resolve; không có state nào giữ
  // noteCode/note gốc để rồi quên dịch lại. Nếu sau này có cache thì
  // test này phải được cập nhật kèm cơ chế live-update của cache đó.
  assert.ok(!/const \[lastNoteCode|const \[lastNote\b/.test(exportPanelSrc), "không được cache noteCode/note gốc mà không có live-update");
});

// --- 3. Đường đổi locale khi note đang hiện: desktop menu là đường duy nhất ---
ok("TopBar có nút đổi ngôn ngữ (vi↔en) qua setLang", () => {
  assert.ok(
    topbarSrc.includes('setLang(getLang() === "vi" ? "en" : "vi")'),
    "TopBar phải có nút toggle setLang vi↔en",
  );
});

ok(".modal-backdrop vẫn phủ toàn màn hình z 400; .topbar KHÔNG còn z-index (đợt 66 T8 sửa nút ngôn ngữ)", () => {
  const backdropZ = stylesSrc.match(/\.modal-backdrop \{[^}]*z-index:\s*(\d+)/s);
  assert.ok(backdropZ, "thiếu z-index .modal-backdrop");
  assert.equal(
    Number(backdropZ[1]),
    400,
    ".modal-backdrop phải giữ z 400 (thứ tự R62: trên FPS 300, dưới tour 450/toast 500)",
  );
  const topbarRule = stylesSrc.match(/\.topbar \{[^}]*\}/s);
  assert.ok(topbarRule, "thiếu rule .topbar");
  // Bỏ comment trong rule trước khi kiểm (comment giải thích có nhắc
  // "z-index: 30" cũ — đó không phải khai báo).
  const topbarDecls = topbarRule[0].replace(/\/\*[\s\S]*?\*\//g, "");
  assert.ok(
    !/z-index\s*:/.test(topbarDecls),
    ".topbar KHÔNG được có z-index — z-index tạo stacking context kẹt nút ngôn ngữ dưới backdrop (nợ S10, sửa đợt 66 T8)",
  );
  assert.ok(
    /\.modal-backdrop \{[^}]*position:\s*fixed;[^}]*inset:\s*0;/s.test(stylesSrc),
    ".modal-backdrop phải fixed inset 0 (phủ cả TopBar — chỉ nút ngôn ngữ được ngoại lệ)",
  );
});

ok("nút ngôn ngữ TopBar thoát lên trên backdrop (.topbar-lang-btn z 401 > 400)", () => {
  const langZ = stylesSrc.match(/\.topbar-lang-btn \{[^}]*z-index:\s*(\d+)/s);
  assert.ok(langZ, "thiếu rule .topbar-lang-btn trong styles.css");
  assert.equal(
    Number(langZ[1]),
    401,
    ".topbar-lang-btn phải z 401 (trên backdrop 400, dưới tour-card 450)",
  );
  assert.ok(
    /\.topbar-lang-btn \{[^}]*position:\s*relative;/s.test(stylesSrc),
    ".topbar-lang-btn phải position: relative để z-index có hiệu lực",
  );
  assert.ok(
    topbarSrc.includes("topbar-lang-btn"),
    "TopBar.tsx: nút ngôn ngữ phải mang class topbar-lang-btn",
  );
});

ok("ExportPanel đóng modal thì dừng polling (mở lại resume job — đợt 66 T8)", () => {
  assert.ok(
    exportPanelSrc.includes('className="modal-backdrop" onClick={handleClose}'),
    "backdrop phải đóng modal khi bấm",
  );
  assert.ok(
    exportPanelSrc.includes("const handleClose = () => { stopPolling(); onClose(); }"),
    "handleClose phải stopPolling rồi onClose",
  );
  // Đợt 66 T8: đóng modal chỉ dừng polling của phiên mở này — mở lại
  // panel resume job qua GET /api/render (không còn mất note như R8 §3).
  assert.ok(
    exportPanelSrc.includes("pickResumeCandidate("),
    "ExportPanel phải nối lại job khi mount (pickResumeCandidate)",
  );
});

ok("desktop.ts nối menu Ngôn ngữ native → setLang (đường đổi locale khi modal đang mở)", () => {
  assert.ok(
    desktopTsSrc.includes("api.onLanguageChanged((lang) => setLang(lang))"),
    "desktop.ts phải nối onLanguageChanged → setLang",
  );
});

runAll();
