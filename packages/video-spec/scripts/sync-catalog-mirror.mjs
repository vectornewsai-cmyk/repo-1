// sync-catalog-mirror.mjs — Đồng bộ catalog `.js` viết tay từ `.ts`
// (nguồn thật duy nhất) trong packages/video-spec/src/.
//
// Bối cảnh (Phase 9 đợt 53 J9; nợ mở đợt 52 I7 §7.4): các catalog
// LUT/sticker/textfx tồn tại ở cả hai bản `.ts` (Vite nạp) và `.js` viết
// tay (node --experimental-strip-types nạp qua re-export). Đợt 52 I7 đã
// phải đồng bộ tay 3 lệch thật bằng script tạm rồi xóa (lut.js kẹt 20/174
// LUT, sticker.js kẹt 30/244 sticker, textfx.js giữ 2 mô tả cũ) — từ nay
// việc đồng bộ là công cụ chính thức trong repo, không còn script tạm.
//
// Cơ chế: với mỗi const trong bảng CATALOGS, lấy literal từ `.ts`, bỏ
// cast kiểu TS (` as StickerCategory`, ` as const` — chỉ ngoài chuỗi),
// đổi indent 2 → 4 khoảng trắng (đúng style `.js` hiện tại, gồm cả
// comment phân đoạn `// --- batch ...` trong literal), rồi thay đúng
// khối const đó trong `.js`. Mọi phần khác của `.js` (hàm, header,
// export khác) giữ nguyên — script KHÔNG regenerate cả file.
//
//   node packages/video-spec/scripts/sync-catalog-mirror.mjs          (đồng bộ, ghi file)
//   node packages/video-spec/scripts/sync-catalog-mirror.mjs --check  (chỉ kiểm tra, exit 1 khi lệch)
//
// Sau khi đồng bộ, chạy checker để khóa giá trị:
//   node packages/video-spec/scripts/check-video-spec-mirror.mjs
// (value probe LUT_IDS/LUT_META/STICKER_LIBRARY/TEXT_ANIMATION_META…).
// CI chạy `--check` (mọi phiên bản Node) + checker (Node 22+, vì cần
// type stripping) — xem .github/workflows/ci-build.yml.
//
// Phạm vi: CHỈ các const catalog trong bảng dưới. Transitions có script
// riêng (gen-transitions-mirror.mjs, cùng thư mục) — không gộp vào đây
// vì nó regenerate cả file transitions.js theo mẫu khác. Các mirror `.js`
// còn lại là logic thuần, không phải catalog — đồng bộ chúng bằng tay +
// checker, không dùng script này.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
// Đợt 86 N8: ghi qua helper retry EPERM (5×20 s + verify đủ byte).
import { writeFileEpermRetry } from "../../../apps/web/scripts/eperm-retry.mjs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = join(here, "..", "src");

// Bảng catalog: (file .ts nguồn, file .js đích, các const đồng bộ).
// Thứ tự const trong bảng là thứ tự xử lý (không ảnh hưởng kết quả).
const CATALOGS = [
  { tsFile: "lut.ts", jsFile: "lut.js", consts: ["LUT_IDS", "LUT_META"] },
  {
    tsFile: "sticker.ts",
    jsFile: "sticker.js",
    consts: ["STICKER_LIBRARY", "STICKER_CATEGORIES", "STICKER_DEFAULTS"],
  },
  {
    tsFile: "textfx.ts",
    jsFile: "textfx.js",
    consts: ["TEXT_ANIMATION_META", "TEXT_ANIMATIONS", "DRAWTEXT_ANIMATIONS"],
  },
];

const CHECK_ONLY = process.argv.includes("--check");

// ---------------------------------------------------------------------------
// Quét literal: tìm `export const NAME ... = <literal>` và trả về literal
// + vị trí span để thay thế. Hiểu chuỗi ("...", '...', `...`) và comment
// (// và /* */) để không nhầm dấu ngoặc trong đó.
// ---------------------------------------------------------------------------

function scanLiteral(src, name) {
  const decl = new RegExp(`export const ${name}[^=]*=\\s*(\\[|\\{)`);
  const m = decl.exec(src);
  if (!m) throw new Error(`không tìm thấy export const ${name}`);
  const openIdx = m.index + m[0].length - 1; // ký tự cuối của match = [ hoặc { đầu literal
  const open = src[openIdx];
  const close = open === "[" ? "]" : "}";
  let depth = 0;
  let i = openIdx;
  let str = null; // quote đang mở: ", ', `
  let esc = false;
  let lineComment = false;
  let blockComment = false;
  while (i < src.length) {
    const ch = src[i];
    const next = src[i + 1];
    if (lineComment) {
      if (ch === "\n") lineComment = false;
      i++;
      continue;
    }
    if (blockComment) {
      if (ch === "*" && next === "/") {
        blockComment = false;
        i += 2;
        continue;
      }
      i++;
      continue;
    }
    if (str) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === str) str = null;
      i++;
      continue;
    }
    if (ch === "/" && next === "/") {
      lineComment = true;
      i += 2;
      continue;
    }
    if (ch === "/" && next === "*") {
      blockComment = true;
      i += 2;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      str = ch;
      i++;
      continue;
    }
    if (ch === "[" || ch === "{") depth++;
    else if (ch === "]" || ch === "}") {
      depth--;
      if (depth === 0) {
        return {
          literal: src.slice(openIdx, i + 1),
          declStart: m.index,
          declEnd: i + 1, // ngay sau dấu đóng literal (chưa gồm `;`)
        };
      }
    }
    i++;
  }
  throw new Error(`không tìm được dấu đóng của ${name} (literal không cân bằng?)`);
}

// Bỏ cast kiểu TS (` as Foo`, ` as const`) — CHỈ ngoài chuỗi/comment.
// Quét ký tự như scanLiteral nhưng giữ lại mọi thứ trừ các cast đó.
function stripCasts(literal) {
  let out = "";
  let i = 0;
  let str = null;
  let esc = false;
  let lineComment = false;
  let blockComment = false;
  while (i < literal.length) {
    const ch = literal[i];
    const next = literal[i + 1];
    if (lineComment) {
      out += ch;
      if (ch === "\n") lineComment = false;
      i++;
      continue;
    }
    if (blockComment) {
      out += ch;
      if (ch === "*" && next === "/") {
        out += next;
        blockComment = false;
        i += 2;
        continue;
      }
      i++;
      continue;
    }
    if (str) {
      out += ch;
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === str) str = null;
      i++;
      continue;
    }
    if (ch === "/" && next === "/") {
      out += ch + next;
      lineComment = true;
      i += 2;
      continue;
    }
    if (ch === "/" && next === "*") {
      out += ch + next;
      blockComment = true;
      i += 2;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      out += ch;
      str = ch;
      i++;
      continue;
    }
    // Cast ngoài chuỗi: ` as <Ident>` — xóa cả khoảng trắng trước nó.
    if (ch === " " || ch === "\t" || ch === "\n") {
      const rest = literal.slice(i);
      const cast = rest.match(/^[ \t]*\n?[ \t]*as\s+[A-Za-z_$][\w$]*/);
      if (cast) {
        i += cast[0].length;
        continue;
      }
    }
    out += ch;
    i++;
  }
  return out;
}

// Đổi indent 2 → 4 khoảng trắng (`.ts` 2 space, `.js` 4 space).
function reindent2to4(literal) {
  return literal
    .split("\n")
    .map((line) => {
      const leading = line.match(/^ */)[0].length;
      return leading === 0 ? line : " ".repeat(leading * 2) + line.slice(leading);
    })
    .join("\n");
}

// Kiểm tra literal parse được thành JS (bắt lỗi quét/cast trước khi ghi).
function assertParses(literal, label) {
  try {
    new Function(`return (${literal})`);
  } catch (e) {
    throw new Error(`${label}: literal sinh ra không parse được: ${e.message}`);
  }
}

// ---------------------------------------------------------------------------

function main() {
  let changed = 0;
  let synced = 0;
  let alreadyOk = 0;
  for (const { tsFile, jsFile, consts } of CATALOGS) {
    const tsPath = join(srcDir, tsFile);
    const jsPath = join(srcDir, jsFile);
    const tsSrc = readFileSync(tsPath, "utf8");
    let jsSrc = readFileSync(jsPath, "utf8");
    let fileChanged = false;
    for (const name of consts) {
      const { literal: tsLit } = scanLiteral(tsSrc, name);
      const generated = `export const ${name} = ${reindent2to4(stripCasts(tsLit))};`;
      const generatedLit = generated.slice(generated.indexOf("=") + 1).replace(/;\s*$/, "");
      assertParses(generatedLit, `${tsFile}:${name}`);
      const { declStart, declEnd } = scanLiteral(jsSrc, name);
      const semiLen = jsSrc[declEnd] === ";" ? 1 : 0;
      const current = jsSrc.slice(declStart, declEnd + semiLen) + (semiLen === 0 ? ";" : "");
      if (current === generated) {
        alreadyOk++;
        console.log(`  ✓ ${jsFile}:${name} — khớp, không đổi`);
        continue;
      }
      if (CHECK_ONLY) {
        changed++;
        console.log(`  ✗ ${jsFile}:${name} — LỆCH so với ${tsFile} (chạy không có --check để đồng bộ)`);
        continue;
      }
      jsSrc = jsSrc.slice(0, declStart) + generated + jsSrc.slice(declEnd + semiLen);
      fileChanged = true;
      synced++;
      console.log(`  ↻ ${jsFile}:${name} — đã đồng bộ từ ${tsFile}`);
    }
    if (fileChanged) {
      // Kiểm tra cả file `.js` parse được trước khi ghi đè (tránh ghi
      // file hỏng khi logic thay thế sai).
      const tmp = join(tmpdir(), `vcut-sync-catalog-${jsFile}.mjs`);
      writeFileEpermRetry(tmp, jsSrc, "utf8");
      try {
        execFileSync(process.execPath, ["--check", tmp], { stdio: "pipe" });
      } catch (e) {
        throw new Error(`${jsFile}: file sau đồng bộ không parse được — KHÔNG ghi (lỗi: ${e.message})`);
      }
      writeFileEpermRetry(jsPath, jsSrc, "utf8");
    }
  }
  console.log(
    `\nTổng: ${alreadyOk} khớp, ${synced} đã đồng bộ, ${changed} lệch (chế độ --check).`,
  );
  if (CHECK_ONLY && changed > 0) {
    console.log("KẾT LUẬN: catalog .js lệch khỏi .ts — chạy sync-catalog-mirror.mjs (không --check) rồi chạy lại checker.");
    process.exit(1);
  }
  if (!CHECK_ONLY && synced > 0) {
    console.log("Đã ghi file. Chạy lại checker để khóa giá trị: node packages/video-spec/scripts/check-video-spec-mirror.mjs");
  }
}

main();
