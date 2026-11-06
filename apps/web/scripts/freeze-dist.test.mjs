#!/usr/bin/env node
// Phase 9 đợt 44, luồng Z5 — test cho freezeDist (sửa race copy
// frozen-dist của chain script, nợ đợt 43 Y5 §4.2).
// Chạy: node --test apps/web/scripts/freeze-dist.test.mjs
// (không cần browser, không cần dist thật — dùng fake dist trong tmp).
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { freezeDist } from "./freeze-dist.mjs";

function buildFake(dir, n = 60) {
  fs.mkdirSync(path.join(dir, "assets"), { recursive: true });
  fs.mkdirSync(path.join(dir, "stickers"), { recursive: true });
  for (let i = 0; i < n; i++) fs.writeFileSync(path.join(dir, "assets", `f${i}.txt`), `asset ${i}\n`);
  fs.writeFileSync(path.join(dir, "assets", "index-xyz.js"), "console.log(1);\n");
  fs.writeFileSync(path.join(dir, "stickers", "s0.txt"), "sticker\n");
  fs.writeFileSync(path.join(dir, "index.html"), "<html/>\n");
}
function listFiles(dir, rel = "") {
  const out = new Set();
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) for (const x of listFiles(path.join(dir, e.name), p)) out.add(x);
    else out.add(p);
  }
  return out;
}
// Mutator chạy ở TIẾN TRÌNH RIÊNG (churn đồng thời thật — setInterval
// trong cùng tiến trình không xen vào được cpSync đồng bộ).
const MUTATOR = `
import fs from "node:fs";
import path from "node:path";
const dir = process.argv[2];
const end = Date.now() + Number(process.argv[3] ?? 20000);
while (Date.now() < end) {
  try {
    const a = path.join(dir, "stickers", "s0.txt");
    const t = path.join(dir, "stickers", "s0.moving");
    try { fs.renameSync(a, t); } catch {}
    try { fs.renameSync(t, a); } catch {}
    const b = path.join(dir, "assets", "index-xyz.js");
    const bak = path.join(dir, "assets", "index-xyz.js.bak");
    try { fs.renameSync(b, bak); fs.writeFileSync(b, "console.log(1);\\n"); } catch {}
    try { fs.rmSync(bak, { force: true }); } catch {}
  } catch {}
}
`;

test("copy cơ bản: đủ file, không sót tmp/old", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "z5-freeze-basic-"));
  const src = path.join(base, "dist");
  buildFake(src);
  const dest = path.join(base, "frozen-dist");
  const r = freezeDist(src, dest);
  assert.equal(r.attempts, 1);
  assert.deepEqual([...listFiles(dest)].sort(), [...listFiles(src)].sort());
  assert.equal(fs.existsSync(`${dest}.tmp-${process.pid}`), false);
  assert.equal(fs.existsSync(`${dest}.old-${process.pid}`), false);
});

test("đích đã tồn tại: nội dung cũ bị thay hoàn toàn, không sót old", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "z5-freeze-swap-"));
  const src = path.join(base, "dist");
  buildFake(src);
  const dest = path.join(base, "frozen-dist");
  fs.mkdirSync(dest, { recursive: true });
  fs.writeFileSync(path.join(dest, "STALE.txt"), "cu\n");
  freezeDist(src, dest);
  assert.equal(fs.existsSync(path.join(dest, "STALE.txt")), false);
  assert.equal(fs.existsSync(path.join(dest, "index.html")), true);
  assert.equal(fs.existsSync(`${dest}.old-${process.pid}`), false);
});

test("nguồn vắng: ném ENOENT (không nuốt lỗi không retry được)", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "z5-freeze-missing-"));
  assert.throws(() => freezeDist(path.join(base, "khong-co"), path.join(base, "out")), (e) => e.code === "ENOENT");
});

test("race dưới churn tiến trình riêng: 0 lỗi thoát, subset ổn định đủ", { timeout: 60000 }, async () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "z5-freeze-race-"));
  const src = path.join(base, "dist");
  buildFake(src);
  const stable = [...listFiles(src)].filter((f) => f.startsWith("assets/f") || f === "index.html");
  const mut = spawn("node", ["--input-type=module", "-e", MUTATOR, src, "25000"], { stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 300));
  let fails = 0;
  let incomplete = 0;
  for (let i = 0; i < 40; i++) {
    const dest = path.join(base, `frozen-${i}`);
    try {
      freezeDist(src, dest);
      const got = listFiles(dest);
      if (stable.some((f) => !got.has(f))) incomplete++;
    } catch { fails++; }
    try { fs.rmSync(dest, { recursive: true, force: true }); } catch {}
  }
  try { mut.kill("SIGKILL"); } catch {}
  assert.equal(fails, 0, "freezeDist không được ném lỗi dưới churn");
  assert.equal(incomplete, 0, "mọi bản copy đều phải đủ subset file ổn định");
});
