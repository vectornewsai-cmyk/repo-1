// epermRetry.test.cjs — Phase 9 đợt 85, luồng M5.
// Kiểm chứng port JS apps/desktop/src/services/epermRetry.js (đồng bộ với
// helper gốc apps/web/scripts/eperm-retry.mjs) bằng fault-injection +
// đường thật, cả bản sync lẫn async.
// Chạy: node apps/desktop/src/services/epermRetry.test.cjs
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
  writeFileEpermRetryAsync,
} = require("./epermRetry.js");

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

async function main() {
  check("isEpermError code EPERM", isEpermError(epermErr()) === true);
  check("isEpermError ENOENT là false", isEpermError(Object.assign(new Error("no such file"), { code: "ENOENT" })) === false);
  check("hằng số nhịp = helper gốc (5 lần × 20 s)", EPERM_TRIES === 5 && EPERM_DELAY_MS === 20000);

  // --- Sync ---
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
    const r = writeFileEpermRetry("/tmp/m5-desk-fake.json", "x".repeat(100), { tries: 5, delayMs: 1, fsImpl: fakeFs, label: "fake-desk-eperm-x2" });
    check("sync retry EPERM 2 lần rồi OK (attempts=3, bytes=100)", r.attempts === 3 && r.bytes === 100, JSON.stringify(r));
  }
  {
    let calls = 0;
    let storedLen = 0;
    const fakeFs = {
      writeFileSync(_f, data) { calls += 1; storedLen = Buffer.byteLength(data); },
      statSync() { return { size: calls <= 2 ? 0 : storedLen }; },
    };
    const r = writeFileEpermRetry("/tmp/m5-desk-fake0.json", "y".repeat(50), { tries: 5, delayMs: 1, fsImpl: fakeFs, label: "fake-desk-0byte-x2" });
    check("sync ghi 0-byte lặng bị phát hiện + retry (attempts=3, bytes=50)", r.attempts === 3 && r.bytes === 50, JSON.stringify(r));
  }
  {
    let calls = 0;
    const fakeFs = {
      writeFileSync() { calls += 1; throw Object.assign(new Error("no such file or directory"), { code: "ENOENT" }); },
      statSync() { return { size: 0 }; },
    };
    let threw = null;
    try { writeFileEpermRetry("/tmp/m5-desk-noent/x.json", "z", { tries: 5, delayMs: 1, fsImpl: fakeFs, label: "fake-desk-enoent" }); }
    catch (e) { threw = e; }
    check("sync lỗi ENOENT không retry (1 lần, ném ENOENT)", calls === 1 && threw && threw.code === "ENOENT", `calls=${calls}`);
  }
  {
    let calls = 0;
    const fakeFs = {
      writeFileSync() { calls += 1; throw epermErr(); },
      statSync() { return { size: 0 }; },
    };
    let threw = null;
    try { writeFileEpermRetry("/tmp/m5-desk-always.json", "w", { tries: 5, delayMs: 1, fsImpl: fakeFs, label: "fake-desk-eperm-always" }); }
    catch (e) { threw = e; }
    check("sync EPERM mãi: đúng 5 lần rồi ném EPERM", calls === 5 && threw && threw.code === "EPERM", `calls=${calls}`);
  }

  // --- Async ---
  {
    let calls = 0;
    let stored = null;
    const fakeFsp = {
      async writeFile(_f, data) {
        calls += 1;
        if (calls <= 2) throw epermErr();
        stored = Buffer.isBuffer(data) ? data : Buffer.from(data);
      },
      async stat() { return { size: stored ? stored.length : 0 }; },
    };
    const r = await writeFileEpermRetryAsync("/tmp/m5-desk-fake-async.json", "x".repeat(100), { tries: 5, delayMs: 1, fsImpl: fakeFsp, label: "fake-desk-async-eperm-x2" });
    check("async retry EPERM 2 lần rồi OK (attempts=3, bytes=100)", r.attempts === 3 && r.bytes === 100, JSON.stringify(r));
  }
  {
    let calls = 0;
    let storedLen = 0;
    const fakeFsp = {
      async writeFile(_f, data) { calls += 1; storedLen = Buffer.byteLength(data); },
      async stat() { return { size: calls <= 2 ? 0 : storedLen }; },
    };
    const r = await writeFileEpermRetryAsync("/tmp/m5-desk-fake-async0.json", "y".repeat(50), { tries: 5, delayMs: 1, fsImpl: fakeFsp, label: "fake-desk-async-0byte-x2" });
    check("async ghi 0-byte lặng bị phát hiện + retry (attempts=3, bytes=50)", r.attempts === 3 && r.bytes === 50, JSON.stringify(r));
  }
  {
    let calls = 0;
    const fakeFsp = {
      async writeFile() { calls += 1; throw Object.assign(new Error("no such file or directory"), { code: "ENOENT" }); },
      async stat() { return { size: 0 }; },
    };
    let threw = null;
    try { await writeFileEpermRetryAsync("/tmp/m5-desk-noent-async/x.json", "z", { tries: 5, delayMs: 1, fsImpl: fakeFsp, label: "fake-desk-async-enoent" }); }
    catch (e) { threw = e; }
    check("async lỗi ENOENT không retry (1 lần, ném ENOENT)", calls === 1 && threw && threw.code === "ENOENT", `calls=${calls}`);
  }

  // --- Đường thật: sync + async ghi 5 KB ra /tmp + workspace, đọc lại khớp ---
  {
    const payload = "m5-desk-".repeat(700).slice(0, 5000); // 8 ký tự × 700 = 5600 → cắt đúng 5000
    const targets = [
      path.join(os.tmpdir(), "m5-desk-real-tmp.txt"),
      path.join(process.cwd(), "apps/desktop/src/services/.m5-desk-real-ws.txt"),
    ];
    let ok = true;
    for (const t of targets) {
      const r = writeFileEpermRetry(t, payload, { tries: 3, delayMs: 1, label: `real-desk-${t}` });
      if (r.bytes !== 5000 || fs.readFileSync(t, "utf8") !== payload) ok = false;
      fs.unlinkSync(t);
    }
    const r2 = await writeFileEpermRetryAsync(path.join(os.tmpdir(), "m5-desk-real-async.txt"), payload, { tries: 3, delayMs: 1, label: "real-desk-async" });
    if (r2.bytes !== 5000) ok = false;
    fs.unlinkSync(path.join(os.tmpdir(), "m5-desk-real-async.txt"));
    check("ghi thật sync+async 5000 byte /tmp + workspace, đọc lại khớp", ok);
  }

  console.log(`\n${pass}/${total} PASS — ${pass === total ? "ALL PASS" : "CÓ FAIL"}`);
  process.exitCode = pass === total ? 0 : 1;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
