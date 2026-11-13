// eperm-retry.test.cjs — Phase 9 đợt 85, luồng M5.
// Kiểm chứng port CJS server/eperm-retry.cjs (đồng bộ với helper gốc
// apps/web/scripts/eperm-retry.mjs) bằng fault-injection + đường thật.
// Chạy: node server/eperm-retry.test.cjs
// Exit 0 khi ALL PASS, 1 khi có khẳng định trượt. KHÔNG push/tag/binary.
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  EPERM_TRIES,
  EPERM_DELAY_MS,
  isEpermError,
  writeFileEpermRetry,
} = require("./eperm-retry.cjs");

let pass = 0;
let total = 0;
function check(name, cond, extra = "") {
  total += 1;
  if (cond) { pass += 1; console.log(`PASS ${name}`); }
  else console.log(`FAIL ${name}${extra ? ` — ${extra}` : ""}`);
}
function epermErr() {
  return Object.assign(new Error("write error: Operation not permitted"), { code: "EPERM" });
}

check("isEpermError code EPERM", isEpermError(epermErr()) === true);
check("isEpermError ENOENT là false", isEpermError(Object.assign(new Error("no such file"), { code: "ENOENT" })) === false);
check("hằng số nhịp = helper gốc (5 lần × 20 s)", EPERM_TRIES === 5 && EPERM_DELAY_MS === 20000);

// EPERM 2 lần rồi thành công → attempts=3
{
  let calls = 0;
  let stored = null;
  const fakeFs = {
    writeFileSync(_f, data) {
      calls += 1;
      if (calls <= 2) throw epermErr();
      stored = Buffer.isBuffer(data) ? data : Buffer.from(data);
    },
    statSync() { return { size: stored ? stored.length : 0 }; },
  };
  const r = writeFileEpermRetry("/tmp/m5-cjs-fake.json", "x".repeat(100), { tries: 5, delayMs: 1, fsImpl: fakeFs, label: "fake-cjs-eperm-x2" });
  check("write retry EPERM 2 lần rồi OK (attempts=3, bytes=100)", r.attempts === 3 && r.bytes === 100, JSON.stringify(r));
}

// Ghi "thành công" nhưng stat 0 byte 2 lần → retry, rồi OK
{
  let calls = 0;
  let storedLen = 0;
  const fakeFs = {
    writeFileSync(_f, data) { calls += 1; storedLen = Buffer.byteLength(data); },
    statSync() { return { size: calls <= 2 ? 0 : storedLen }; },
  };
  const r = writeFileEpermRetry("/tmp/m5-cjs-fake0.json", "y".repeat(50), { tries: 5, delayMs: 1, fsImpl: fakeFs, label: "fake-cjs-0byte-x2" });
  check("ghi 0-byte lặng bị phát hiện + retry (attempts=3, bytes=50)", r.attempts === 3 && r.bytes === 50, JSON.stringify(r));
}

// Lỗi KHÔNG phải EPERM → ném ngay, đúng 1 lần
{
  let calls = 0;
  const fakeFs = {
    writeFileSync() { calls += 1; throw Object.assign(new Error("no such file or directory"), { code: "ENOENT" }); },
    statSync() { return { size: 0 }; },
  };
  let threw = null;
  try { writeFileEpermRetry("/tmp/m5-cjs-noent/x.json", "z", { tries: 5, delayMs: 1, fsImpl: fakeFs, label: "fake-cjs-enoent" }); }
  catch (e) { threw = e; }
  check("lỗi ENOENT không retry (1 lần, ném ENOENT)", calls === 1 && threw && threw.code === "ENOENT", `calls=${calls}`);
}

// EPERM mãi → hết 5 lần rồi ném
{
  let calls = 0;
  const fakeFs = {
    writeFileSync() { calls += 1; throw epermErr(); },
    statSync() { return { size: 0 }; },
  };
  let threw = null;
  try { writeFileEpermRetry("/tmp/m5-cjs-always.json", "w", { tries: 5, delayMs: 1, fsImpl: fakeFs, label: "fake-cjs-eperm-always" }); }
  catch (e) { threw = e; }
  check("EPERM mãi: đúng 5 lần rồi ném EPERM", calls === 5 && threw && threw.code === "EPERM", `calls=${calls}`);
}

// Đường thật: ghi 5 KB ra /tmp + workspace, đọc lại khớp
{
  const payload = "m5-cjs-".repeat(800).slice(0, 5000); // 7 ký tự × 800 = 5600 → cắt đúng 5000
  const targets = [
    path.join(os.tmpdir(), "m5-cjs-real-tmp.txt"),
    path.join(process.cwd(), "server/.m5-cjs-real-ws.txt"),
  ];
  let ok = true;
  for (const t of targets) {
    const r = writeFileEpermRetry(t, payload, { tries: 3, delayMs: 1, label: `real-cjs-${t}` });
    const back = fs.readFileSync(t, "utf8");
    if (r.bytes !== 5000 || back !== payload) ok = false;
    fs.unlinkSync(t);
  }
  check("ghi thật 5000 byte /tmp + workspace, đọc lại khớp", ok);
}

console.log(`\n${pass}/${total} PASS — ${pass === total ? "ALL PASS" : "CÓ FAIL"}`);
process.exitCode = pass === total ? 0 : 1;
