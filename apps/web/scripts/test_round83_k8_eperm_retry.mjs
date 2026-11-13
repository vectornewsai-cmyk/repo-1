// test_round83_k8_eperm_retry.mjs — Phase 9 đợt 83, luồng K8.
// Kiểm chứng helper eperm-retry.mjs bằng fault-injection (fs/spawn giả)
// + đường thật (ghi 5 KB ra /tmp + workspace, chạy lệnh thật).
// Chạy: node apps/web/scripts/test_round83_k8_eperm_retry.mjs
// Exit 0 khi ALL PASS, 1 khi có khẳng định trượt. KHÔNG push/tag/binary.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  EPERM_TRIES,
  EPERM_DELAY_MS,
  isEpermError,
  isEpermText,
  writeFileEpermRetry,
  writeFileEpermRetryAsync,
  runSyncEpermRetry,
} from "./eperm-retry.mjs";

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

// --- 1. isEpermError / isEpermText ---------------------------------------
check("isEpermError code EPERM", isEpermError(epermErr()) === true);
check("isEpermError message chứa cụm", isEpermError(new Error("Could not write header … Operation not permitted")) === true);
check("isEpermError ENOENT là false", isEpermError(Object.assign(new Error("no such file"), { code: "ENOENT" })) === false);
check("isEpermError null là false", isEpermError(null) === false);
check("isEpermText true/false", isEpermText("x Operation not permitted y") === true && isEpermText("Invalid argument") === false);
check("hằng số nhịp = pattern package-ship (5 lần × 20 s)", EPERM_TRIES === 5 && EPERM_DELAY_MS === 20000);

// --- 2. write: fail EPERM 2 lần rồi thành công → attempts=3 --------------
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
  const r = writeFileEpermRetry("/tmp/k8-fake.json", "x".repeat(100), { tries: 5, delayMs: 1, fsImpl: fakeFs, label: "fake-eperm-x2" });
  check("write retry EPERM 2 lần rồi OK (attempts=3, bytes=100)", r.attempts === 3 && r.bytes === 100, JSON.stringify(r));
  check("write retry gọi đúng 3 lần", calls === 3, `calls=${calls}`);
}

// --- 3. write: ghi "thành công" nhưng stat 0 byte 2 lần → retry, rồi OK --
{
  let calls = 0;
  let storedLen = 0;
  const fakeFs = {
    writeFileSync(_f, data) { calls += 1; storedLen = Buffer.byteLength(data); },
    statSync() { return { size: calls <= 2 ? 0 : storedLen }; },
  };
  const r = writeFileEpermRetry("/tmp/k8-fake0.json", "y".repeat(50), { tries: 5, delayMs: 1, fsImpl: fakeFs, label: "fake-0byte-x2" });
  check("ghi 0-byte lặng bị phát hiện + retry (attempts=3, bytes=50)", r.attempts === 3 && r.bytes === 50, JSON.stringify(r));
}

// --- 4. write: lỗi KHÔNG phải EPERM → ném ngay, đúng 1 lần -------------
{
  let calls = 0;
  const fakeFs = {
    writeFileSync() { calls += 1; throw Object.assign(new Error("no such file or directory"), { code: "ENOENT" }); },
    statSync() { return { size: 0 }; },
  };
  let threw = null;
  try { writeFileEpermRetry("/tmp/k8-noent/x.json", "z", { tries: 5, delayMs: 1, fsImpl: fakeFs, label: "fake-enoent" }); }
  catch (e) { threw = e; }
  check("lỗi ENOENT không retry (1 lần, ném ENOENT)", calls === 1 && threw && threw.code === "ENOENT", `calls=${calls}`);
}

// --- 5. write: EPERM mãi → hết 5 lần rồi ném -----------------------------
{
  let calls = 0;
  const fakeFs = {
    writeFileSync() { calls += 1; throw epermErr(); },
    statSync() { return { size: 0 }; },
  };
  let threw = null;
  try { writeFileEpermRetry("/tmp/k8-always.json", "w", { tries: 5, delayMs: 1, fsImpl: fakeFs, label: "fake-eperm-always" }); }
  catch (e) { threw = e; }
  check("EPERM mãi: đúng 5 lần rồi ném EPERM", calls === 5 && threw && threw.code === "EPERM", `calls=${calls}`);
}

// --- 6. runSync: ffmpeg fail EPERM 2 lần rồi exit 0 ----------------------
{
  let calls = 0;
  const fakeSpawn = (_cmd, _args, _opts) => {
    calls += 1;
    if (calls <= 2) return { status: 1, stderr: "Could not write header for output file: Operation not permitted\n", error: null };
    return { status: 0, stderr: "", error: null };
  };
  const r = runSyncEpermRetry("ffmpeg", ["-i", "in.mp4", "out.mp4"], { tries: 5, delayMs: 1, spawnImpl: fakeSpawn, label: "fake-ffmpeg-eperm" });
  check("runSync retry EPERM 2 lần rồi OK (status 0, 3 lần gọi)", r.status === 0 && calls === 3, `calls=${calls}`);
}

// --- 7. runSync: lỗi không phải EPERM → 1 lần, ném ngay -----------------
{
  let calls = 0;
  const fakeSpawn = () => { calls += 1; return { status: 1, stderr: "Invalid argument\n", error: null }; };
  let threw = null;
  try { runSyncEpermRetry("ffmpeg", ["-bad", "x"], { tries: 5, delayMs: 1, spawnImpl: fakeSpawn, label: "fake-ffmpeg-badarg" }); }
  catch (e) { threw = e; }
  check("runSync lỗi thường không retry (1 lần, ném)", calls === 1 && !!threw, `calls=${calls}`);
}

// --- 8. runSync: spawn error code EPERM → retry ---------------------------
{
  let calls = 0;
  const fakeSpawn = () => {
    calls += 1;
    if (calls <= 1) return { status: null, stderr: "", error: Object.assign(new Error("spawn EPERM"), { code: "EPERM" }) };
    return { status: 0, stderr: "", error: null };
  };
  const r = runSyncEpermRetry("ffmpeg", ["-i", "a", "b"], { tries: 5, delayMs: 1, spawnImpl: fakeSpawn, label: "fake-spawn-eperm" });
  check("runSync spawn EPERM retry rồi OK (2 lần gọi)", r.status === 0 && calls === 2, `calls=${calls}`);
}

// --- 9. Đường thật: ghi 5 KB ra /tmp + workspace, verify đủ byte --------
{
  const payload = "k8-probe-".repeat(600).slice(0, 5000); // 9 ký tự × 600 = 5400 → cắt đúng 5000
  const targets = [
    path.join(os.tmpdir(), "k8-eperm-real-tmp.txt"),
    path.join(process.cwd(), "apps/web/scripts/.k8-eperm-real-ws.txt"),
  ];
  let ok = true;
  for (const t of targets) {
    const r = writeFileEpermRetry(t, payload, { tries: 3, delayMs: 1, label: `real-${t}` });
    const back = fs.readFileSync(t, "utf8");
    if (r.bytes !== 5000 || back !== payload) ok = false;
    fs.unlinkSync(t);
  }
  check("ghi thật 5000 byte /tmp + workspace, đọc lại khớp", ok);
}

// --- 10. Đường thật: runSync lệnh thật ------------------------------------
{
  const r = runSyncEpermRetry("true", [], { tries: 3, delayMs: 1, label: "real-true" });
  check("runSync thật: `true` exit 0", r.status === 0);
}

// --- 11. Async (đợt 85 M5): cùng hợp đồng, ngủ không block -------------
{
  // 11a. EPERM 2 lần rồi OK
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
  const r = await writeFileEpermRetryAsync("/tmp/k8-fake-async.json", "x".repeat(100), { tries: 5, delayMs: 1, fsImpl: fakeFsp, label: "fake-async-eperm-x2" });
  check("async retry EPERM 2 lần rồi OK (attempts=3, bytes=100)", r.attempts === 3 && r.bytes === 100, JSON.stringify(r));
  check("async retry gọi đúng 3 lần", calls === 3, `calls=${calls}`);

  // 11b. Ghi 0-byte lặng 2 lần rồi OK
  let calls0 = 0;
  let storedLen0 = 0;
  const fakeFsp0 = {
    async writeFile(_f, data) { calls0 += 1; storedLen0 = Buffer.byteLength(data); },
    async stat() { return { size: calls0 <= 2 ? 0 : storedLen0 }; },
  };
  const r0 = await writeFileEpermRetryAsync("/tmp/k8-fake-async0.json", "y".repeat(50), { tries: 5, delayMs: 1, fsImpl: fakeFsp0, label: "fake-async-0byte-x2" });
  check("async ghi 0-byte lặng bị phát hiện + retry (attempts=3, bytes=50)", r0.attempts === 3 && r0.bytes === 50, JSON.stringify(r0));

  // 11c. ENOENT → không retry
  let callsE = 0;
  const fakeFspE = {
    async writeFile() { callsE += 1; throw Object.assign(new Error("no such file or directory"), { code: "ENOENT" }); },
    async stat() { return { size: 0 }; },
  };
  let threwE = null;
  try { await writeFileEpermRetryAsync("/tmp/k8-noent-async/x.json", "z", { tries: 5, delayMs: 1, fsImpl: fakeFspE, label: "fake-async-enoent" }); }
  catch (e) { threwE = e; }
  check("async lỗi ENOENT không retry (1 lần, ném ENOENT)", callsE === 1 && threwE && threwE.code === "ENOENT", `calls=${callsE}`);

  // 11d. EPERM mãi → 5 lần rồi ném (delay 1 ms nên không chờ lâu)
  let callsA = 0;
  const fakeFspA = {
    async writeFile() { callsA += 1; throw epermErr(); },
    async stat() { return { size: 0 }; },
  };
  let threwA = null;
  try { await writeFileEpermRetryAsync("/tmp/k8-always-async.json", "w", { tries: 5, delayMs: 1, fsImpl: fakeFspA, label: "fake-async-eperm-always" }); }
  catch (e) { threwA = e; }
  check("async EPERM mãi: đúng 5 lần rồi ném EPERM", callsA === 5 && threwA && threwA.code === "EPERM", `calls=${callsA}`);

  // 11e. Đường thật: ghi 5000 byte ra /tmp + workspace, đọc lại khớp
  const payload = "m5-probe-".repeat(600).slice(0, 5000);
  const targets = [
    path.join(os.tmpdir(), "m5-eperm-real-tmp.txt"),
    path.join(process.cwd(), "apps/web/scripts/.m5-eperm-real-ws.txt"),
  ];
  let ok = true;
  for (const t of targets) {
    const rr = await writeFileEpermRetryAsync(t, payload, { tries: 3, delayMs: 1, label: `real-async-${t}` });
    const back = fs.readFileSync(t, "utf8");
    if (rr.bytes !== 5000 || back !== payload) ok = false;
    fs.unlinkSync(t);
  }
  check("async ghi thật 5000 byte /tmp + workspace, đọc lại khớp", ok);
}

console.log(`\n${pass}/${total} PASS — ${pass === total ? "ALL PASS" : "CÓ FAIL"}`);
process.exitCode = pass === total ? 0 : 1;
