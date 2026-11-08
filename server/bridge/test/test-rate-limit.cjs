// Test đơn vị cho đợt 64 R7: rate limiter sliding-window (rateLimit.js).
// Chạy bằng (từ gốc repo): node server/bridge/test/test-rate-limit.cjs
// Không khởi động bridge, không cần ffmpeg: fake clock nên toàn bộ case
// biên cửa sổ chạy trong vài ms. Khóa 2 quirk đã sửa:
//  (A) fixed-window boundary burst — 7–8 request lọt trong 1 cửa sổ trượt
//      60s khi max=4 (đo thật bằng bridge trước khi sửa, xem LIMITS đợt này).
//  (B) BRIDGE_RATE_GENERAL=abc (NaN) → limiter chết hẳn (130 request đều 200).
// Đồng thời khóa lại ngữ nghĩa đợt 63 R5: bucket tách theo scope.
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { createRateLimiter, parseRateLimitInt, defaultPersistPath } = require("../src/rateLimit");

let pass = 0;
let fail = 0;
function ok(cond, label, extra) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.error(`  ✗ FAIL: ${label}${extra !== undefined ? ` — ${JSON.stringify(extra)}` : ""}`); }
}

function mockRes() {
  const headers = {};
  const res = {
    headers,
    statusCode: null,
    body: null,
    setHeader(k, v) { headers[String(k).toLowerCase()] = String(v); },
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };
  return res;
}
function callMw(mw, ip) {
  const req = ip === undefined ? {} : { ip, socket: { remoteAddress: ip } };
  const res = mockRes();
  let next = false;
  mw(req, res, () => { next = true; });
  return { res, next };
}

console.log("== [1] parseRateLimitInt: env sai rơi về mặc định (quirk B) ==");
ok(parseRateLimitInt("4", 120) === 4, "env hợp lệ '4' → 4");
ok(parseRateLimitInt("20", 20) === 20, "env hợp lệ '20' → 20");
ok(parseRateLimitInt("abc", 120) === 120, "env 'abc' (NaN) → mặc định 120");
ok(parseRateLimitInt("0", 120) === 120, "env '0' → mặc định 120");
ok(parseRateLimitInt("-5", 20) === 20, "env '-5' → mặc định 20");
ok(parseRateLimitInt("", 120) === 120, "env rỗng → mặc định 120");
ok(parseRateLimitInt(undefined, 120) === 120, "env thiếu → mặc định 120");
ok(parseRateLimitInt("4.9", 120) === 4, "env '4.9' → 4 (parseInt như cũ)");
ok(parseRateLimitInt(7, 120) === 7, "số 7 → 7");

console.log("== [2] cơ bản: đúng max thì qua, quá thì 429 + header ==");
{
  let now = 0;
  const { rateLimit, destroy } = createRateLimiter({ windowMs: 60000, now: () => now, sweepIntervalMs: 0 });
  const mw = rateLimit(4, "general");
  const rems = [];
  for (let i = 0; i < 4; i++) {
    const r = callMw(mw, "1.2.3.4");
    ok(r.next && r.res.statusCode === null, `request ${i + 1}/4 qua`, r.res.statusCode);
    rems.push(r.res.headers["x-ratelimit-remaining"]);
  }
  ok(JSON.stringify(rems) === JSON.stringify(["3", "2", "1", "0"]), "Remaining đếm ngược 3,2,1,0", rems);
  const over = callMw(mw, "1.2.3.4");
  ok(!over.next && over.res.statusCode === 429, "request 5/4 → 429");
  ok(over.res.body && over.res.body.errorCode === "RATE_LIMITED", "429 có errorCode RATE_LIMITED", over.res.body);
  ok(over.res.body && over.res.body.error === "Quá nhiều request — thử lại sau 60s.", "message 429 giữ nguyên từng byte", over.res.body && over.res.body.error);
  ok(over.res.body && over.res.body.errorParams && over.res.body.errorParams.retryAfter === "60", "errorParams.retryAfter='60' (normalizeParams string hóa, như cũ)", over.res.body && over.res.body.errorParams);
  ok(over.res.headers["retry-after"] === "60", "header Retry-After=60", over.res.headers["retry-after"]);
  ok(over.res.headers["x-ratelimit-remaining"] === "0", "429 Remaining=0", over.res.headers["x-ratelimit-remaining"]);
  ok(over.res.headers["x-ratelimit-limit"] === "4", "header X-RateLimit-Limit=4", over.res.headers["x-ratelimit-limit"]);
  destroy();
}

console.log("== [3] quirk A — boundary burst: sliding window khóa đúng 4/cửa sổ trượt ==");
{
  let now = 0;
  const { rateLimit, buckets, destroy } = createRateLimiter({ windowMs: 60000, now: () => now, sweepIntervalMs: 0 });
  const mw = rateLimit(4, "general");
  const admitted = [];
  function attempt(label) {
    const r = callMw(mw, "10.0.0.1");
    if (r.next) admitted.push(now);
    return r;
  }
  now = 0; ok(attempt().next, "t=0: #1 qua");
  now = 58500;
  ok(attempt().next, "t=58.5s: #2 qua");
  ok(attempt().next, "t=58.5s: #3 qua");
  ok(attempt().next, "t=58.5s: #4 qua");
  now = 58800;
  const fifth = attempt();
  ok(!fifth.next && fifth.res.statusCode === 429, "t=58.8s: #5 → 429 (đủ 4)");
  ok(fifth.res.headers["retry-after"] === "2", "Retry-After=2 (mốc cũ nhất t=0 hết hạn lúc t=60s)", fifth.res.headers["retry-after"]);
  // Sau reset fixed-window cũ, lẽ ra 4 slot mới mở ra cùng lúc (burst 7–8
  // trong cửa sổ trượt). Sliding-window: chỉ mốc t=0 hết hạn → 1 slot.
  now = 61000;
  ok(attempt().next, "t=61s: #6 qua (1 slot do mốc t=0 hết hạn)");
  const seventh = attempt();
  ok(!seventh.next && seventh.res.statusCode === 429, "t=61s: #7 → 429 (3 mốc t=58.5s vẫn trong cửa sổ)");
  ok(seventh.res.headers["retry-after"] === "58", "Retry-After=58 (mốc t=58.5s hết hạn lúc t=118.5s)", seventh.res.headers["retry-after"]);
  // Bất biến cửa sổ trượt: không cửa sổ 60s nào chứa quá 4 mốc đã chấp nhận.
  let worst = 0;
  for (const t of admitted) {
    const n = admitted.filter((x) => x > t - 60000 && x <= t).length;
    if (n > worst) worst = n;
  }
  ok(worst <= 4, `không cửa sổ trượt 60s nào quá 4 (tệ nhất ${worst}, đã chấp nhận ${admitted.length})`, admitted);
  // Khi lô t=58.5s hết hạn thì slot mở lại hết.
  now = 118600;
  ok(attempt().next, "t=118.6s: qua lại sau khi lô cũ hết hạn");
  ok(attempt().next, "t=118.6s: qua (slot 2)");
  ok(buckets.get("general:10.0.0.1").length === 3, "bucket chỉ giữ mốc còn hạn (3)", buckets.get("general:10.0.0.1"));
  destroy();
}

console.log("== [4] request hợp lệ đúng lúc không bị chặn nhầm ==");
{
  let now = 0;
  const { rateLimit, destroy } = createRateLimiter({ windowMs: 60000, now: () => now, sweepIntervalMs: 0 });
  const mw = rateLimit(4, "general");
  // Cách nhau 20s: trong bất kỳ cửa sổ 60s nào cũng ≤ 3 → tất cả qua.
  for (const t of [0, 20000, 40000, 60000, 80000, 120000]) {
    now = t;
    ok(callMw(mw, "10.0.0.2").next, `t=${t / 1000}s qua`, t);
  }
  destroy();
}

console.log("== [5] bucket tách theo scope (ngữ nghĩa đợt 63 R5, khóa lại) ==");
{
  let now = 0;
  const { rateLimit, destroy } = createRateLimiter({ windowMs: 60000, now: () => now, sweepIntervalMs: 0 });
  const general = rateLimit(4, "general");
  const render = rateLimit(2, "render");
  const silence = rateLimit(4, "silence");
  ok(callMw(render, "10.0.0.3").next, "render #1 qua");
  ok(callMw(render, "10.0.0.3").next, "render #2 qua");
  ok(!callMw(render, "10.0.0.3").next, "render #3 → 429 (hết budget render)");
  ok(callMw(general, "10.0.0.3").next, "general vẫn qua (bucket riêng)");
  ok(callMw(silence, "10.0.0.3").next, "silence vẫn qua (bucket riêng)");
  ok(callMw(general, "10.0.0.4").next, "IP khác có bucket riêng");
  destroy();
}

console.log("== [6] request bị 429 không ghi mốc, không phình bucket ==");
{
  let now = 0;
  const { rateLimit, buckets, destroy } = createRateLimiter({ windowMs: 60000, now: () => now, sweepIntervalMs: 0 });
  const mw = rateLimit(2, "general");
  ok(callMw(mw, "10.0.0.5").next, "admit #1");
  ok(callMw(mw, "10.0.0.5").next, "admit #2");
  now = 1000;
  let rejected = 0;
  for (let i = 0; i < 100; i++) if (!callMw(mw, "10.0.0.5").next) rejected++;
  ok(rejected === 100, "hammer 100 lần đều 429", rejected);
  ok(buckets.get("general:10.0.0.5").length === 2, "bucket vẫn chỉ 2 mốc (429 không ghi)", buckets.get("general:10.0.0.5"));
  now = 61000;
  ok(callMw(mw, "10.0.0.5").next, "sau khi mốc cũ hết hạn: qua lại #1");
  ok(callMw(mw, "10.0.0.5").next, "sau khi mốc cũ hết hạn: qua lại #2");
  ok(!callMw(mw, "10.0.0.5").next, "sau khi mốc cũ hết hạn: #3 → 429");
  destroy();
}

console.log("== [7] không rò rỉ bucket: hết hạn + prune → Map rỗng; IP lạ ==");
{
  let now = 0;
  const { rateLimit, buckets, prune, destroy } = createRateLimiter({ windowMs: 60000, now: () => now, sweepIntervalMs: 0 });
  const mw = rateLimit(4, "general");
  callMw(mw, "10.0.0.6");
  callMw(mw, "10.0.0.7");
  callMw(mw, undefined); // req không có ip/socket → "unknown"
  ok(buckets.size === 3, "3 bucket (2 IP + unknown)", buckets.size);
  ok(buckets.has("general:unknown"), "IP lạ key 'general:unknown'");
  now = 61000;
  ok(prune() === 0, "prune sau khi hết hạn → 0 bucket", buckets.size);
  ok(buckets.size === 0, "Map rỗng, không rò rỉ", buckets.size);
  destroy();
  ok(buckets.size === 0, "destroy() dọn sạch", buckets.size);
}

console.log("== [8] S5 — global cap: tổng mọi bucket/IP, không chỉ per-IP ==");
{
  let now = 0;
  const { rateLimit, buckets, globalMarks, destroy } = createRateLimiter({
    windowMs: 60000, now: () => now, sweepIntervalMs: 0, globalMax: 5,
  });
  const mw = rateLimit(100, "general");
  // 5 IP khác nhau, mỗi IP 1 request: per-IP còn xa budget nhưng global đầy.
  for (let i = 1; i <= 5; i++) {
    const r = callMw(mw, `10.1.0.${i}`);
    ok(r.next, `IP 10.1.0.${i}: request ${i}/5 global qua`, r.res.statusCode);
    ok(r.res.headers["x-ratelimit-global-remaining"] === String(5 - i),
      `IP 10.1.0.${i}: Global-Remaining=${5 - i}`, r.res.headers["x-ratelimit-global-remaining"]);
  }
  ok(globalMarks.length === 5, "globalMarks = 5 sau 5 request", globalMarks.length);
  const sixth = callMw(mw, "10.9.9.9");
  ok(!sixth.next && sixth.res.statusCode === 429, "IP thứ 6 (bucket riêng còn trống) → 429 do global cap", sixth.res.statusCode);
  ok(sixth.res.body && sixth.res.body.errorCode === "RATE_LIMITED", "429 global có errorCode RATE_LIMITED", sixth.res.body);
  ok(sixth.res.headers["x-ratelimit-global-remaining"] === "0", "429 global: Global-Remaining=0", sixth.res.headers["x-ratelimit-global-remaining"]);
  ok(sixth.res.headers["retry-after"] === "60", "429 global: Retry-After=60 (mốc cũ nhất hết hạn lúc t=60s)", sixth.res.headers["retry-after"]);
  ok(buckets.get("general:10.9.9.9").length === 0, "request bị chặn bởi global KHÔNG ghi mốc vào bucket của nó", buckets.get("general:10.9.9.9"));
  ok(globalMarks.length === 5, "globalMarks vẫn 5 (429 không ghi)", globalMarks.length);
  destroy();
}

console.log("== [9] S5 — global cap đếm chéo scope; slot mở lại khi mốc hết hạn ==");
{
  let now = 0;
  const { rateLimit, globalMarks, destroy } = createRateLimiter({
    windowMs: 60000, now: () => now, sweepIntervalMs: 0, globalMax: 3,
  });
  const general = rateLimit(100, "general");
  const render = rateLimit(100, "render");
  ok(callMw(general, "10.2.0.1").next, "general #1 qua (global 1/3)");
  ok(callMw(render, "10.2.0.1").next, "render #1 qua (global 2/3, đếm chéo scope)");
  ok(callMw(general, "10.2.0.2").next, "general #2 qua (global 3/3)");
  const over = callMw(render, "10.2.0.2");
  ok(!over.next && over.res.statusCode === 429, "render #2 → 429 dù bucket render mới 1/100 (global đầy)", over.res.statusCode);
  ok(over.res.headers["retry-after"] === "60", "429 global: Retry-After=60", over.res.headers["retry-after"]);
  // Slot mở lại khi mốc cũ nhất hết hạn (cả 3 mốc đều ở t=0 nên cùng hết hạn lúc t=60s).
  now = 61000;
  const after = callMw(render, "10.2.0.2");
  ok(after.next, "t=61s: qua lại (3 mốc t=0 đều hết hạn)", after.res.statusCode);
  ok(globalMarks.length === 1, "globalMarks = 1 (chỉ mốc mới t=61s)", globalMarks.length);
  ok(after.res.headers["x-ratelimit-global-remaining"] === "2", "sau khi qua lại: Global-Remaining=2", after.res.headers["x-ratelimit-global-remaining"]);
  destroy();
}

console.log("== [10] S5 — persist: save → limiter mới cùng file → khôi phục đúng ==");
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-r65s5-persist-"));
  const file = path.join(tmp, "rate-limit.json");
  let now = 0;
  const a = createRateLimiter({
    windowMs: 60000, now: () => now, sweepIntervalMs: 0,
    globalMax: 5, persistPath: file, persistIntervalMs: 0,
  });
  const genA = a.rateLimit(4, "general");
  const renA = a.rateLimit(2, "render");
  ok(callMw(genA, "10.3.0.1").next, "A: general #1 qua (t=0)");
  ok(callMw(genA, "10.3.0.1").next, "A: general #2 qua (t=0)");
  now = 10000;
  ok(callMw(renA, "10.3.0.2").next, "A: render #1 qua (t=10s)");
  ok(a.flush() === true, "A: flush() → true (đã lưu đĩa)");
  ok(fs.existsSync(file), "file persist tồn tại sau flush", file);
  const saved = JSON.parse(fs.readFileSync(file, "utf8"));
  ok(saved.version === 1 && saved.windowMs === 60000, "file persist: version=1, windowMs=60000", saved);
  ok(JSON.stringify(Object.keys(saved.buckets).sort()) === JSON.stringify(["general:10.3.0.1", "render:10.3.0.2"]),
    "file persist: đủ 2 bucket", Object.keys(saved.buckets));
  ok(saved.buckets["general:10.3.0.1"].length === 2, "file persist: bucket general giữ 2 mốc", saved.buckets["general:10.3.0.1"]);
  ok(saved.global.length === 3, "file persist: global giữ 3 mốc", saved.global);
  a.destroy();

  // Limiter B = "restart": cùng file, cùng đồng hồ (t=10s).
  const b = createRateLimiter({
    windowMs: 60000, now: () => now, sweepIntervalMs: 0,
    globalMax: 5, persistPath: file, persistIntervalMs: 0,
  });
  ok(b.buckets.get("general:10.3.0.1").length === 2, "B sau restart: bucket general khôi phục 2 mốc", b.buckets.get("general:10.3.0.1"));
  ok(b.buckets.get("render:10.3.0.2").length === 1, "B sau restart: bucket render khôi phục 1 mốc", b.buckets.get("render:10.3.0.2"));
  ok(b.globalMarks.length === 3, "B sau restart: global khôi phục 3 mốc", b.globalMarks.length);
  const genB = b.rateLimit(4, "general");
  const renB = b.rateLimit(2, "render");
  ok(callMw(genB, "10.3.0.1").next, "B: general #3 qua (bucket còn slot, global 4/5)");
  ok(callMw(renB, "10.3.0.2").next, "B: render #2 qua (bucket còn slot, global 5/5)");
  const overB = callMw(genB, "10.3.0.9");
  ok(!overB.next && overB.res.statusCode === 429, "B: request tiếp theo → 429 (global đã đầy 5/5 sau restart)", overB.res.statusCode);
  b.destroy();

  // Limiter C = restart muộn: đồng hồ đã qua cửa sổ → mốc cũ không hồi sinh.
  now = 70000;
  const c = createRateLimiter({
    windowMs: 60000, now: () => now, sweepIntervalMs: 0,
    globalMax: 5, persistPath: file, persistIntervalMs: 0,
  });
  ok(c.buckets.size === 0, "C restart lúc t=70s: không bucket nào hồi sinh (mốc t=0/t=10s đã hết hạn)", c.buckets.size);
  ok(c.globalMarks.length === 0, "C restart lúc t=70s: global rỗng", c.globalMarks.length);
  ok(callMw(c.rateLimit(4, "general"), "10.3.0.1").next, "C: request mới qua bình thường sau khi mốc cũ hết hạn");
  c.destroy();
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log("== [11] S5 — persist edge case: file hỏng, không persist, đường dẫn mặc định ==");
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-r65s5-persist-"));
  const badFile = path.join(tmp, "bad.json");
  fs.writeFileSync(badFile, "khong phai json {{{", "utf8");
  let now = 0;
  const bad = createRateLimiter({
    windowMs: 60000, now: () => now, sweepIntervalMs: 0,
    globalMax: 5, persistPath: badFile, persistIntervalMs: 0,
  });
  ok(bad.buckets.size === 0, "file hỏng (không phải JSON): nạp rỗng, không throw", bad.buckets.size);
  ok(callMw(bad.rateLimit(4, "general"), "10.4.0.1").next, "file hỏng: limiter vẫn chạy bình thường từ trạng thái rỗng");
  bad.destroy();
  // Sai định dạng (version khác / thiếu global) cũng bỏ qua.
  fs.writeFileSync(badFile, JSON.stringify({ version: 99, buckets: {}, global: [] }), "utf8");
  const wrongVer = createRateLimiter({
    windowMs: 60000, now: () => now, sweepIntervalMs: 0,
    persistPath: badFile, persistIntervalMs: 0,
  });
  ok(wrongVer.buckets.size === 0, "file sai version: nạp rỗng, không throw", wrongVer.buckets.size);
  wrongVer.destroy();
  fs.rmSync(tmp, { recursive: true, force: true });

  // Không đặt persistPath → không lưu đĩa.
  const noPersist = createRateLimiter({ windowMs: 60000, now: () => now, sweepIntervalMs: 0 });
  ok(noPersist.save() === false, "không có persistPath: save() → false");
  ok(noPersist.flush() === false, "không có persistPath: flush() → false");
  noPersist.destroy();

  // Đường dẫn mặc định.
  const def = defaultPersistPath();
  ok(def.endsWith(`${path.sep}rate-limit.json`) || def.endsWith("rate-limit.json"),
    `defaultPersistPath() kết thúc bằng rate-limit.json (${def})`, def);
  ok(def.includes(`${path.sep}.cache${path.sep}vcut${path.sep}`) || def.includes(os.tmpdir()),
    `defaultPersistPath() nằm dưới ~/.cache/vcut (hoặc tmpdir khi không có HOME): ${def}`, def);
}

console.log(`\nR7 rate limiter (unit, fake clock): ${pass} pass, ${fail} fail`);
if (fail > 0) process.exitCode = 1;
