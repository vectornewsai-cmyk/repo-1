// i18nServerLiterals61R6.test.ts — Phase 9 đợt 61, luồng R6: kiểm kê
// literal VI ở server/desktop (đóng nợ đợt 60 §5.6: 253 literal P7).
//
// Phương pháp: tokenizer quét string literal `'...'` / `"..."` / `` `...` ``
// (xử lý đúng `${...}` lồng nhau), BỎ chuỗi nằm trong comment; chỉ đếm
// literal chứa dấu tiếng Việt. Số đếm là snapshot tại lúc viết test —
// luồng khác sửa file thì cập nhật snapshot (mẫu P7 → Q4).
//
// Đếm lại bằng tokenizer này (2026-11-08): 8 file P7 = 246 literal (R5 gộp RECOVER_NOTE về 1 hằng; parent gộp đợt 63 sửa header 247→246).
// (P7: 253 — main.ts −19 nhờ nối dialog/model/about, bridge +5,
// jobQueue +4, motion +4 do các luồng khác thêm log/lỗi từ đó tới nay).
// Toàn production (server + desktop + mcp-server + cli + packages,
// trừ .venv/dist/test/demo/measure và .js trùng .ts): 3217 literal.
//
// Phân loại theo sink (classifier ±2 dòng, xem LIMITS R6 §1): LOG =
// console/log nội bộ; API_ERROR = res.json/throw/_onError/job.error
// (trả về UI qua HTTP/IPC/job); VALIDATION = errs.push (lỗi validate
// render trả về UI); DIALOG = dialog hệ thống. Literal còn lại ở
// desktop đã nối (trKey fallback) hoặc miễn trừ có lý do — xem LIMITS.
//
// Cách chạy (mẫu Q4, từ gốc repo; bundle ra scratch ngoài repo):
//   ./node_modules/.bin/esbuild apps/web/src/lib/i18nServerLiterals61R6.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/round61-r6/r6inv.test.cjs \
//     && node /tmp/round61-r6/r6inv.test.cjs
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";

/** Khai báo tối thiểu để không cần @types/node (mẫu M5). */
declare const process: { exitCode: number | undefined };

let pass = 0;
const queue: Array<{ name: string; fn: () => void | Promise<void> }> = [];
function ok(name: string, fn: () => void | Promise<void>): void {
  queue.push({ name, fn });
}
async function runAll(): Promise<void> {
  for (const t of queue) {
    try {
      await t.fn();
      pass++;
      console.log(`  ✓ ${t.name}`);
    } catch (e) {
      console.error(`  ✗ ${t.name}: ${(e as Error).message}`);
      process.exitCode = 1;
    }
  }
  console.log(`R6 server literals round 61: ${pass}/${queue.length} pass`);
}

const VI = /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđĐ]/;
type Lit = { file: string; line: number; raw: string };
type Frame = { t: string; depth?: number; cur: string; curLine: number };

/** Tokenizer: bỏ comment ngoài chuỗi, trích literal chứa dấu VI. */
function scanFile(file: string): Lit[] {
  const src = readFileSync(file, "utf8");
  const lits: Lit[] = [];
  let i = 0;
  let line = 1;
  const stack: Frame[] = [{ t: "code", cur: "", curLine: 0 }];
  const top = (): Frame => stack[stack.length - 1];
  const pushLit = (fr: Frame): void => {
    if (fr.cur && VI.test(fr.cur)) {
      lits.push({
        file,
        line: fr.curLine,
        raw: fr.cur.length > 220 ? fr.cur.slice(0, 217) + "…" : fr.cur,
      });
    }
  };
  while (i < src.length) {
    const c = src[i];
    const n = src[i + 1] || "";
    const fr = top();
    if (c === "\n") line++;
    if (fr.t === "code") {
      if (c === "/" && n === "/") {
        while (i < src.length && src[i] !== "\n") i++;
        continue;
      }
      if (c === "/" && n === "*") {
        i += 2;
        while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) {
          if (src[i] === "\n") line++;
          i++;
        }
        i += 2;
        continue;
      }
      if (c === "'") { stack.push({ t: "sq", cur: c, curLine: line }); i++; continue; }
      if (c === '"') { stack.push({ t: "dq", cur: c, curLine: line }); i++; continue; }
      if (c === "`") { stack.push({ t: "tpl", cur: c, curLine: line }); i++; continue; }
      i++;
      continue;
    }
    if (fr.t === "sq" || fr.t === "dq") {
      const q = fr.t === "sq" ? "'" : '"';
      fr.cur += c;
      if (c === "\\") { fr.cur += n; i += 2; continue; }
      if (c === q) { stack.pop(); pushLit(fr); }
      i++;
      continue;
    }
    if (fr.t === "tpl") {
      fr.cur += c;
      if (c === "\\") { fr.cur += n; i += 2; continue; }
      if (c === "`") { stack.pop(); pushLit(fr); i++; continue; }
      if (c === "$" && n === "{") {
        fr.cur += "{";
        stack.push({ t: "expr", depth: 1, cur: "", curLine: line });
        i += 2;
        continue;
      }
      i++;
      continue;
    }
    // Trong ${...}: chuỗi lồng nhau là literal riêng; {} theo dõi độ sâu.
    if (fr.t === "expr") {
      if (c === "'") { stack.push({ t: "sq", cur: c, curLine: line }); i++; continue; }
      if (c === '"') { stack.push({ t: "dq", cur: c, curLine: line }); i++; continue; }
      if (c === "`") { stack.push({ t: "tpl", cur: c, curLine: line }); i++; continue; }
      if (c === "{") fr.depth = (fr.depth ?? 1) + 1;
      if (c === "}") {
        fr.depth = (fr.depth ?? 1) - 1;
        if (fr.depth === 0) {
          stack.pop();
          top().cur += "}";
        }
      }
      i++;
      continue;
    }
    i++;
  }
  return lits;
}

/** Phân loại theo sink: cửa sổ ±2 dòng quanh literal. */
type Category = "LOG" | "API_ERROR" | "VALIDATION" | "DIALOG" | "OTHER";
function classify(file: string, ln: number): Category {
  const lines = readFileSync(file, "utf8").split("\n");
  const win = lines.slice(Math.max(0, ln - 3), ln + 2).join(" ");
  if (/dialog\.|showMessageBox|showOpenDialog|showSaveDialog/.test(win)) return "DIALOG";
  if (/console\.\w+\(|[^a-zA-Z]log\(|console\.error/.test(win)) return "LOG";
  if (/errs\.push|warnings\.push|notes\.push/.test(win)) return "VALIDATION";
  // Đợt 62 R5: apiError(/codedError( là tín hiệu API_ERROR (giao thức mã
  // lỗi bridge→web — literal VI nằm trong lời gọi apiError/codedError).
  if (/res\.(status|json)|error:|throw new Error|codedError\(|apiError\(|taskErrorPayload|_onError\(|job\.error|\{ ok: false, error|return \{[^}]*error/.test(win)) return "API_ERROR";
  return "OTHER";
}

function countsByCategory(file: string): Record<Category, number> {
  const out: Record<Category, number> = { LOG: 0, API_ERROR: 0, VALIDATION: 0, DIALOG: 0, OTHER: 0 };
  for (const lit of scanFile(file)) out[classify(file, lit.line)]++;
  return out;
}

// Snapshot đếm lại 2026-11-08 (tokenizer trên). Đổi file thì cập nhật.
const EIGHT_FILES: Record<string, { total: number; cats: Partial<Record<Category, number>> }> = {
  // Đợt 62 R5: index.js API_ERROR 85→86 / OTHER 6→5 — multer LIMIT_FILE_SIZE
  // ("File vượt quá giới hạn …MB.") trước đây classifier đếm OTHER (nằm
  // trong ternary, xa res.status); sau khi nối mã lỗi bằng if/else thì
  // literal nằm cùng dòng res.status nên phân loại đúng là API_ERROR.
  // Tổng 139 không đổi (không thêm/bớt literal).
  "server/bridge/src/index.js": { total: 139, cats: { OTHER: 5, API_ERROR: 86, LOG: 48 } },
  // Đợt 63 R5: total 26→25 / OTHER 10→9 — chuỗi note recover
  // ("Phục hồi sau khi server restart…") trước đây lặp 4 chỗ, nay gom
  // về 1 hằng RECOVER_NOTE trong jobQueue.js (đỡ lệch note/noteCode).
  "server/bridge/src/jobQueue.js": { total: 25, cats: { LOG: 4, API_ERROR: 12, OTHER: 9 } },
  "apps/desktop/src/main.ts": { total: 23, cats: { API_ERROR: 2, LOG: 19, OTHER: 1, DIALOG: 1 } },
  // Đợt 63 R9: preload.ts API_ERROR 1→0 / OTHER 0→1 — literal duy nhất
  // ("Dữ liệu file qua IPC không phải bytes.") chuyển từ `throw new
  // Error(...)` trực tiếp vào dict IPC_NOT_BYTES_TEXT (để setLanguage
  // chọn vi/en); classifier ±2 dòng không thấy sink từ trong dict nên
  // đếm OTHER, nhưng chuỗi vẫn tới UI thật (error -> toast ở
  // desktop.ts). Tổng vẫn 1, không thêm/bớt literal.
  "apps/desktop/src/preload.ts": { total: 1, cats: { OTHER: 1 } },
  "apps/desktop/src/services/modelDownloader.js": { total: 21, cats: { API_ERROR: 14, LOG: 1, OTHER: 6 } },
  "server/render/src/motion.js": { total: 23, cats: { API_ERROR: 3, VALIDATION: 20 } },
  "server/render/src/speedramp.js": { total: 14, cats: { API_ERROR: 11, LOG: 3 } },
};

ok("kiểm kê 8 file P7: 246 literal (P7: 253), đúng từng file + phân loại sink", () => {
  let total = 0;
  for (const [file, snap] of Object.entries(EIGHT_FILES)) {
    const lits = scanFile(file);
    assert.equal(lits.length, snap.total, `${file}: phải có ${snap.total} literal, nhận ${lits.length}`);
    total += lits.length;
    const cats = countsByCategory(file);
    for (const [cat, n] of Object.entries(snap.cats)) {
      assert.equal(cats[cat as Category], n, `${file}: ${cat} phải là ${n}, nhận ${cats[cat as Category]}`);
    }
    const sumCats = (Object.values(cats) as number[]).reduce((a, b) => a + b, 0);
    assert.equal(sumCats, snap.total, `${file}: tổng phân loại phải bằng tổng literal`);
  }
  assert.equal(total, 246, `8 file phải có tổng 246 literal, nhận ${total}`);
});

ok("desktop đã nối: about/crash 0 literal; menu chỉ còn 2 miễn trừ", () => {
  assert.equal(scanFile("apps/desktop/src/about.ts").length, 0, "about.ts phải hết literal VI thô (đã nối vào labels)");
  assert.equal(scanFile("apps/desktop/src/crash.ts").length, 0, "crash.ts phải hết literal VI thô (đã nối vào labels)");
  const menu = scanFile("apps/desktop/src/menu.ts").map((l) => l.raw).sort();
  assert.deepEqual(menu, [
    '"Không tìm thấy file dự án này nữa."',
    '"Tiếng Việt"',
  ]);
  // menu.ts:169 đã song ngữ bằng ternary (VI/EN tại chỗ), "Tiếng Việt"
  // là tên ngôn ngữ — cả hai đều miễn trừ có lý do (xem LIMITS §1.3).
});

ok("desktop đã nối: file-io/native-files chỉ còn fallback trKey (đã nối thật)", () => {
  const fileIo = scanFile("apps/desktop/src/file-io.ts").map((l) => l.raw).sort();
  assert.deepEqual(fileIo, [
    "`Chỉ ghi được file dự án (.vcut/.vcut.json): ${}`",
    "`File quá lớn để mở qua Electron (${} > 2 GB): ${}`",
    "`Không ghi được file: ${}`",
    "`Không mở được file này trong VCut: ${}`",
    "`Không đọc được file: ${}`",
    "`Không đọc được file: ${}`",
  ]);
  const native = scanFile("apps/desktop/src/native-files.ts").map((l) => l.raw).sort();
  assert.deepEqual(native, [
    '"Thiếu jobId render."',
    '"Thiếu đường dẫn đích."',
    '"desktop:save-export-file: tham số không hợp lệ."',
    "`Không tải được video đã render (bridge trả ${}).`",
    "`Đường dẫn đích phải là file .mp4: ${}`",
  ]);
  // ffmpeg-check: 1 literal còn lại là error log nội bộ (không tới UI).
  assert.deepEqual(
    scanFile("apps/desktop/src/ffmpeg-check.ts").map((l) => l.raw),
    ["`ffmpeg thoát mã ${}: ${}`"],
  );
});

ok("quét production: tokenizer chạy hết 127 file, tổng > 1000 literal (snapshot chi tiết trong LIMITS)", () => {
  const roots = [
    "server",
    "apps/desktop/src",
    "mcp-server/src",
    "cli/src",
    "packages/plugin-api/src",
    "packages/video-spec/src",
  ];
  const skipDir = (p: string): boolean =>
    p.includes("node_modules") || p.includes("/dist/") || p.includes(".venv") ||
    p.includes("__pycache__") || p.includes("/release");
  const files: string[] = [];
  const walk = (dir: string): void => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = `${dir}/${e.name}`;
      if (e.isDirectory()) {
        if (!skipDir(p + "/")) walk(p);
      } else if (/\.(ts|js|tsx)$/.test(e.name) && !/\.test\./.test(e.name) && !e.name.startsWith("test_") && !e.name.startsWith("measure_") && !e.name.startsWith("demo_")) {
        if (e.name.endsWith(".js") && existsSync(p.replace(/\.js$/, ".ts"))) continue;
        files.push(p);
      }
    }
  };
  for (const r of roots) walk(r);
  assert.ok(files.length >= 120, `phải quét được ≥120 file, nhận ${files.length}`);
  let total = 0;
  for (const f of files) total += scanFile(f).length;
  assert.ok(total > 1000, `tổng literal production phải > 1000, nhận ${total}`);
  // Khóa mềm: tổng snapshot 3217 (2026-11-08); lệch > 5% thì xem lại
  // scanner hoặc ghi chú thay đổi lớn trong LIMITS, không sửa lặng.
  assert.ok(
    Math.abs(total - 3217) / 3217 < 0.05,
    `tổng literal production lệch snapshot 3217 quá 5%: nhận ${total}`,
  );
});

runAll();
