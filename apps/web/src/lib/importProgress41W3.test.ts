/**
 * importProgress41W3.test.ts — Phase 9 đợt 41, luồng W3.
 * Unit test cho helper định dạng tiến trình importFiles dùng chung +
 * kiểm toán tĩnh: mọi call site importFiles trong UI (trừ MediaBin đã
 * có từ đợt 40 V5) đều truyền callback tiến trình và render phần tử
 * [data-import-progress]. Kiểm toán tĩnh đọc source thật trên đĩa nên
 * nếu một panel sau này bỏ callback, test này vỡ thay vì im lặng.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  formatImportProgressText,
  type ImportProgressTranslator,
} from "./importProgressText41W3";
import type { ImportFileProgressEvent } from "./ingestProgress39T5";

const HERE = path.dirname(fileURLToPath(import.meta.url));
/**
 * Tìm thư mục src thật: bundle test có thể nằm ở /tmp (import.meta.url
 * khi đó không trỏ về repo) nên thử theo thứ tự: cwd của lần chạy
 * (repo root → apps/web/src, hoặc apps/web → src), rồi đi lên từ vị
 * trí file bundle. Không tìm thấy → fail rõ ràng thay vì ENOENT khó hiểu.
 */
function findSrc(): string {
  const candidates: string[] = [
    path.resolve(process.cwd(), "apps/web/src"),
    path.resolve(process.cwd(), "src"),
  ];
  let dir = HERE;
  for (let i = 0; i < 8; i++) {
    candidates.push(path.join(dir, "src"), dir);
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, "MediaBin.tsx"))) return c;
  }
  throw new Error(`không tìm thấy thư mục src của app (đã thử: ${candidates.join(", ")})`);
}
const SRC = findSrc();

/** Translator giả: trả về "key|k=v|..." để assert đúng key + đúng vars. */
const fakeTr: ImportProgressTranslator = (key, vars) =>
  [key, ...Object.entries(vars ?? {}).map(([k, v]) => `${k}=${v}`)].join("|");

const base: Omit<ImportFileProgressEvent, "phase" | "bytesDone"> = {
  totalBytes: 100 * 1024 * 1024,
  fileIndex: 1,
  fileCount: 3,
  fileName: "clip.mp4",
};

test("hashing: đúng key, index 1-based, % = floor(bytesDone/total)", () => {
  const ev: ImportFileProgressEvent = { ...base, phase: "hashing", bytesDone: 25 * 1024 * 1024 };
  const out = formatImportProgressText(ev, fakeTr);
  assert.match(out, /^importProgress\.hashing\|/);
  assert.match(out, /\bindex=2\b/);
  assert.match(out, /\bcount=3\b/);
  assert.match(out, /\bpercent=25\b/);
  assert.match(out, /\bname=clip\.mp4\b/);
});

test("storing: đúng key, KHÔNG có biến percent (không bịa %)", () => {
  const ev: ImportFileProgressEvent = { ...base, phase: "storing", bytesDone: 100 * 1024 * 1024 };
  const out = formatImportProgressText(ev, fakeTr);
  assert.match(out, /^importProgress\.storing\|/);
  assert.doesNotMatch(out, /\bpercent=/);
});

test("done: đúng key, không percent", () => {
  const ev: ImportFileProgressEvent = { ...base, phase: "done", bytesDone: 100 * 1024 * 1024 };
  const out = formatImportProgressText(ev, fakeTr);
  assert.match(out, /^importProgress\.done\|/);
  assert.doesNotMatch(out, /\bpercent=/);
});

test("kiểm toán tĩnh: mọi call site UI của importFiles đều truyền callback + render banner", () => {
  // Mỗi entry: file panel + chuỗi callback bắt buộc phải có cạnh importFiles.
  const sites: Array<{ file: string; callback: string }> = [
    { file: "MediaBin.tsx", callback: "(ev) => setImportProgress(ev)" },
    { file: "ExportPanel.tsx", callback: "(ev) => setImportProgress(ev)" },
    { file: "components/sticker/StickerPanel.tsx", callback: "(ev) => setImportProgress(ev)" },
    { file: "components/project/ProjectMenu.tsx", callback: "(ev) => setImportProgress(ev)" },
    { file: "components/TtsButton.tsx", callback: "(ev) => setImportProgress(ev)" },
    { file: "components/BgRemovePanel.tsx", callback: "(ev) => setImportProgress(ev)" },
    { file: "components/onboarding/TemplatePackModal.tsx", callback: "(ev) => setImportProgress(ev)" },
  ];
  for (const s of sites) {
    const src = fs.readFileSync(path.join(SRC, s.file), "utf8");
    assert.ok(src.includes("importFiles("), `${s.file} phải gọi importFiles`);
    assert.ok(src.includes(s.callback), `${s.file} phải truyền callback tiến trình vào importFiles`);
    assert.ok(src.includes("data-import-progress"), `${s.file} phải render phần tử data-import-progress`);
  }
  // TemplatePackModal có 2 call site (create + makeTts) — cả 2 đều phải nối.
  const tpl = fs.readFileSync(path.join(SRC, "components/onboarding/TemplatePackModal.tsx"), "utf8");
  const wired = tpl.split("importFiles(").length - 1;
  const callbacks = (tpl.match(/\(ev\) => setImportProgress\(ev\)/g) ?? []).length;
  assert.equal(wired, 2, "TemplatePackModal phải có đúng 2 call site importFiles");
  assert.equal(callbacks, 2, "cả 2 call site TemplatePackModal đều phải truyền callback");
});
