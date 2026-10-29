// gen-transitions-mirror.mjs — Regenerate packages/video-spec/src/transitions.js
// từ transitions.ts (nguồn thật duy nhất).
//
// Bối cảnh (Phase 9 đợt 11, luồng P3): mirror .js là bản viết tay nên đã
// lệch khỏi .ts (trước đợt này: 59 type so với 82 type trong .ts — thiếu
// 9 type P5 của Phase 7 và 14 type V3 của đợt 10; web dùng .ts qua Vite
// nên panel không ảnh hưởng, nhưng đừng dùng .js làm căn cứ). Không có
// script gen nào trước đây (scripts/ ở repo root chỉ có release/install).
//
// Cách chạy (từ repo root):
//   node packages/video-spec/scripts/gen-transitions-mirror.mjs
// Script ghi đè src/transitions.js và in số type/meta đã viết. Chạy lại
// phải cho cùng một nội dung (idempotent) — kiểm tra bằng hash sau khi chạy.
//
// Phạm vi: CHỈ transitions.js. Các mirror .js khác của video-spec là tập
// con viết tay theo thiết kế (vd index.js chỉ re-export một phần, lut.js
// ngắn hơn nhiều so với lut.ts) nên KHÔNG regenerate bừa bằng tsc — xem
// docs/PHASE9_ROUND11_P3_ADJUST_SYNC_LIMITS.md §3. Type/interface của
// .ts (TransitionType, Transition) không tồn tại ở runtime nên mirror
// cố tình bỏ qua chúng; chỉ TRANSITION_TYPES, TRANSITION_META và
// isTransitionType được mirror (isTransitionType giữ đúng ngữ nghĩa cũ).

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = join(here, "..", "src");
const tsPath = join(srcDir, "transitions.ts");
const jsPath = join(srcDir, "transitions.js");

const ts = readFileSync(tsPath, "utf8");

const typesMatch = ts.match(
  /export const TRANSITION_TYPES = \[(.*?)\] as const;/s,
);
if (!typesMatch) throw new Error("không tìm thấy TRANSITION_TYPES trong transitions.ts");
// Quét theo dòng để giữ comment phân đoạn (// R1-073, // P5…) đúng vị trí.
const types = [];
{
  let pendingComment = null;
  for (const line of typesMatch[1].split("\n")) {
    const comment = line.match(/^\s*\/\/(.*)$/);
    if (comment) {
      pendingComment = comment[1].trim();
      continue;
    }
    const str = line.match(/"([^"]+)"/);
    if (str) {
      types.push({ name: str[1], comment: pendingComment });
      pendingComment = null;
    }
  }
}
if (types.length === 0) throw new Error("TRANSITION_TYPES rỗng — parser sai?");

const metaMatch = ts.match(
  /export const TRANSITION_META[^=]*=\s*\{(.*)\n\};/s,
);
if (!metaMatch) throw new Error("không tìm thấy TRANSITION_META trong transitions.ts");
const metaEntries = [];
const entryRe =
  /^\s*(?:"([^"]+)"|([A-Za-z0-9_-]+))\s*:\s*\{\s*label:\s*"((?:[^"\\]|\\.)*)"\s*,\s*description:\s*"((?:[^"\\]|\\.)*)"\s*,\s*category:\s*"([^"]*)"\s*\}/;
{
  let pendingComment = null;
  for (const line of metaMatch[1].split("\n")) {
    const comment = line.match(/^\s*\/\/(.*)$/);
    if (comment) {
      pendingComment = comment[1].trim();
      continue;
    }
    const m = line.match(entryRe);
    if (m) {
      metaEntries.push({
        key: m[1] ?? m[2],
        label: m[3],
        description: m[4],
        category: m[5],
        comment: pendingComment,
      });
      pendingComment = null;
    }
  }
}
if (metaEntries.length !== types.length) {
  throw new Error(
    `TRANSITION_META (${metaEntries.length} entry) không khớp TRANSITION_TYPES (${types.length} type) — sửa .ts trước khi regen`,
  );
}
const metaKeys = new Set(metaEntries.map((e) => e.key));
for (const t of types) {
  if (!metaKeys.has(t.name)) throw new Error(`type "${t.name}" thiếu entry trong TRANSITION_META`);
}

const needsQuotes = (k) => !/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k);
const keyOut = (k) => (needsQuotes(k) ? `"${k}"` : k);
const strOut = (s) => JSON.stringify(s);

const header = `/**
 * transitions.js — JS mirror của transitions.ts (GENERATED, đừng sửa tay).
 *
 * Nguồn thật: transitions.ts trong cùng thư mục. Regenerate bằng:
 *   node packages/video-spec/scripts/gen-transitions-mirror.mjs
 * (chạy từ repo root; script fail fast nếu .ts thiếu meta cho type nào).
 *
 * NGUYÊN TẮC (giống transitions.ts): chỉ đưa vào spec những gì render
 * được THẬT. Mỗi type tương ứng 1 entry trong server/render/src/transitions.js
 * và đã được kiểm chứng bằng MP4 thật.
 */`;

const typesBlock = [
  '/** Tất cả transition types hợp lệ (bao gồm "none" = không hiệu ứng). */',
  "export const TRANSITION_TYPES = [",
  ...types.flatMap((t) => [
    ...(t.comment ? [`    // ${t.comment}`] : []),
    `    ${strOut(t.name)},`,
  ]),
  "];",
].join("\n");

const metaBlock = [
  "/** Metadata hiển thị cho UI (tiếng Việt). */",
  "export const TRANSITION_META = {",
  ...metaEntries.flatMap((e) => [
    ...(e.comment ? [`    // ${e.comment}`] : []),
    `    ${keyOut(e.key)}: { label: ${strOut(e.label)}, description: ${strOut(e.description)}, category: ${strOut(e.category)} },`,
  ]),
  "};",
].join("\n");

const fnBlock = `/** Kiểm tra một giá trị có phải TransitionType hợp lệ không. */
export function isTransitionType(v) {
    return (typeof v === "string" &&
        TRANSITION_TYPES.includes(v));
}
`;

writeFileSync(jsPath, `${header}\n${typesBlock}\n${metaBlock}\n${fnBlock}`);
console.log(`gen-transitions-mirror: ${types.length} types, ${metaEntries.length} meta entries -> ${jsPath}`);
