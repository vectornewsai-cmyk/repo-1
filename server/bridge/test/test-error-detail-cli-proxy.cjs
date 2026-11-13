/**
 * Test cho Phase 9 đợt 30 luồng M3: dọn nốt phần thô của errorDetail.
 * Chạy bằng: node server/bridge/test/test-error-detail-cli-proxy.cjs
 * (cần ffmpeg/ffprobe/curl + CLI đã build ở cli/dist; không cần network)
 *
 * Bao phủ:
 *  (a) Tĩnh: cli/src/commands/render.ts không còn stdio "inherit" cho
 *      worker, dùng pipe + redactWorkerLine; renderErrors.ts export
 *      redactWorkerLine; server/bridge/src/index.js: /api/proxy dùng
 *      taskErrorPayload và chỉ kèm errorDetail khi ?detail=1.
 *  (b) redactWorkerLine thật (qua dist đã build): dòng chứa đường dẫn
 *      tuyệt đối/home/token → đã redact; dòng stack trace → rỗng.
 *  (c) CLI thật (không-quiet): render project có clip corrupt.mp4 →
 *      exit != 0, stderr KHÔNG chứa đường dẫn tuyệt đối của file đầu
 *      vào, có lỗi có cấu trúc [FFMPEG_ERROR] + <path>/corrupt.mp4.
 *      Chế độ -q giữ nguyên: exit != 0 + lỗi có cấu trúc, không rò.
 *      Render thành công không-quiet (video testsrc thật) vẫn exit 0
 *      và tạo được MP4 (streaming không phá đường success).
 *  (d) Bridge thật qua HTTP: POST /api/proxy với file hỏng →
 *      500 có error đã redact + errorCode, KHÔNG có errorDetail khi
 *      không xin detail; ?detail=1 → có errorDetail canonical, vẫn
 *      không rò đường dẫn tuyệt đối. File video nhỏ hợp lệ vẫn trả
 *      skipped:true (route không bị phá).
 *
 * Test chỉ in nhãn pass/fail, KHÔNG in lại giá trị secret mẫu hay
 * đường dẫn tuyệt đối của máy test (chỉ in basename khi cần đối chiếu).
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const os = require("os");
const path = require("path");
const { execFileSync, spawn, spawnSync } = require("child_process");

let pass = 0;
let fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.error(`  ✗ FAIL: ${label}`); }
}
const root = path.join(__dirname, "..", "..", "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const run = (cmd, args, opts = {}) =>
  spawnSync(cmd, args, { encoding: "utf8", timeout: 180000, ...opts });

function main() {
  console.log("== [a] Tĩnh: CLI pipe + redact theo dòng, proxy bọc canonical ==");
  {
    const render = read("cli/src/commands/render.ts");
    ok(!render.includes('stdio: "inherit"') && !render.includes("stdio: quiet"),
      "render.ts không còn stdio inherit cho worker");
    ok(render.includes("runWorkerStreamed") && render.includes("redactWorkerLine"),
      "render.ts chạy worker qua pipe + lọc redact theo dòng");
    ok(render.includes('stdio: "pipe"'), "chế độ quiet vẫn giữ spawnSync pipe");
    const adapter = read("cli/src/renderErrors.ts");
    ok(adapter.includes("export function redactWorkerLine"),
      "renderErrors.ts export redactWorkerLine");
    const idx = read("server/bridge/src/index.js");
    // Đợt 66 T9 — literal cũ 2 đối số đã lệch từ đợt 63 R5 (taskError tách
    // module, call nay có thêm mã TASK_PROXY_FAILED); hành vi vẫn đúng
    // (proxy dùng taskErrorPayload), chỉ cập nhật literal cho khớp code.
    ok(idx.includes('taskErrorPayload(e, "Tạo proxy thất bại.", "TASK_PROXY_FAILED")'),
      "index.js: /api/proxy dùng taskErrorPayload");
    ok(!idx.includes('return res.status(500).json({ error: e.message || "Tạo proxy thất bại." })'),
      "index.js: /api/proxy không còn trả e.message thô");
    const proxyCatch = idx.slice(idx.indexOf("/api/proxy"));
    ok(proxyCatch.includes('req.query.detail === "1"'),
      "/api/proxy chỉ kèm errorDetail khi ?detail=1");
  }

  console.log("== [b] redactWorkerLine thật qua dist đã build ==");
  {
    const dist = path.join(root, "cli", "dist", "cli", "src", "renderErrors.js");
    ok(fs.existsSync(dist), "dist renderErrors.js tồn tại (CLI đã build)");
    if (fs.existsSync(dist)) {
      const snippet = [
        "import { redactWorkerLine } from " + JSON.stringify(dist) + ";",
        "const hostile = 'ffmpeg đọc /home/testuser/secret/clip.mp4 thất bại api_key=sk-abcdefghij12345678';",
        "const stack = '    at validateSpec (/home/testuser/work/validate.js:1:2)';",
        "console.log(JSON.stringify({",
        "  hostile: redactWorkerLine(hostile),",
        "  stack: redactWorkerLine(stack),",
        "}));",
      ].join("\n");
      const r = run("node", ["--input-type=module", "-e", snippet]);
      let out = null;
      try { out = JSON.parse(r.stdout.trim().split("\n").pop()); } catch { /* fail ở dưới */ }
      ok(out && !out.hostile.includes("/home/testuser") && !out.hostile.includes("sk-abcdefghij"),
        "dòng độc hại đã redact (mất home/token)");
      ok(out && out.hostile.includes("<path>/clip.mp4"),
        "dòng đã redact vẫn giữ basename để nhận ra file");
      ok(out && out.stack === "", "dòng stack trace → rỗng (bị bỏ khi stream)");
    }
  }

  console.log("== [c] CLI thật: không-quiet + quiet + success ==");
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "m3-cli-"));
  const cliJs = path.join(root, "cli", "dist", "cli", "src", "index.js");
  const vcut = (args, opts = {}) => run("node", [cliJs, ...args], { cwd: work, ...opts });
  try {
    vcut(["create", "--name", "M3", "--width", "1280", "--height", "720",
      "--out", path.join(work, "bad.json")]);
    writeFileEpermRetry(path.join(work, "corrupt.mp4"), "not a video");
    vcut(["add-clip", "--project", path.join(work, "bad.json"),
      "--src", "corrupt.mp4", "--start", "0", "--duration", "2"]);
    const badAbs = path.join(work, "corrupt.mp4");
    // Không-quiet: worker fail, stderr phải sạch đường dẫn tuyệt đối.
    const nq = vcut(["render", "--project", path.join(work, "bad.json"),
      "--preset", "720p", "--output", path.join(work, "out.mp4"),
      "--media-dir", work, "-y"]);
    ok(nq.status !== 0, `không-quiet render hỏng → exit != 0 (nhận ${nq.status})`);
    ok(!String(nq.stderr).includes(badAbs),
      "không-quiet: stderr không chứa đường dẫn tuyệt đối của file đầu vào");
    ok(String(nq.stderr).includes("[FFMPEG_ERROR]") && String(nq.stderr).includes("<path>/corrupt.mp4"),
      "không-quiet: có lỗi có cấu trúc đã redact");
    // Quiet: hành vi cũ giữ nguyên.
    const q = vcut(["render", "--project", path.join(work, "bad.json"),
      "--preset", "720p", "--output", path.join(work, "outq.mp4"),
      "--media-dir", work, "-y", "-q"]);
    ok(q.status !== 0, `quiet render hỏng → exit != 0 (nhận ${q.status})`);
    ok(!String(q.stderr).includes(badAbs) && String(q.stderr).includes("[FFMPEG_ERROR]"),
      "quiet: lỗi có cấu trúc, không rò đường dẫn tuyệt đối");
    // Success không-quiet: video testsrc thật.
    run("ffmpeg", ["-y", "-v", "warning", "-f", "lavfi",
      "-i", "testsrc=duration=2:size=320x240:rate=30", "-pix_fmt", "yuv420p",
      path.join(work, "sample.mp4")]);
    vcut(["create", "--name", "M3ok", "--width", "1280", "--height", "720",
      "--out", path.join(work, "ok.json")]);
    vcut(["add-clip", "--project", path.join(work, "ok.json"),
      "--src", "sample.mp4", "--start", "0", "--duration", "2"]);
    const good = vcut(["render", "--project", path.join(work, "ok.json"),
      "--preset", "720p", "--output", path.join(work, "ok.mp4"),
      "--media-dir", work, "-y"]);
    ok(good.status === 0, `không-quiet render tốt → exit 0 (nhận ${good.status})`);
    ok(fs.existsSync(path.join(work, "ok.mp4")) &&
      fs.statSync(path.join(work, "ok.mp4")).size > 0,
      "không-quiet render tốt → tạo được MP4");
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }

  console.log("== [d] Bridge thật qua HTTP: /api/proxy ==");
  const bwork = fs.mkdtempSync(path.join(os.tmpdir(), "m3-bridge-"));
  const port = 8931;
  // Đợt 66 T9 — persist riêng (bwork): không dùng file mặc định ~/.cache/vcut/rate-limit.json,
  // tránh rò mốc limiter sang test khác (bài học đợt 65 §3b).
  const server = spawn("node", [path.join(root, "server", "bridge", "src", "index.js")], {
    env: { ...process.env, BRIDGE_PORT: String(port), BRIDGE_WORK_DIR: bwork, BRIDGE_RATE_PERSIST_PATH: path.join(bwork, "rate-limit.json") },
    stdio: "ignore",
  });
  try {
    let ready = false;
    for (let i = 0; i < 50 && !ready; i++) {
      const r = run("curl", ["-s", "-o", "/dev/null", "-w", "%{http_code}",
        `http://127.0.0.1:${port}/api/health`]);
      if (r.stdout.trim() === "200") ready = true;
      else Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200);
    }
    ok(ready, "bridge server thật khởi động được (health 200)");
    if (ready) {
      const badFile = path.join(bwork, "upload-bad.mp4");
      writeFileEpermRetry(badFile, "not a video");
      const post = (url, file) => run("curl", ["-s", "-F", `file=@${file || badFile}`, url]);
      const noDetail = JSON.parse(post(`http://127.0.0.1:${port}/api/proxy`).stdout || "{}");
      ok(noDetail.errorCode !== undefined, "proxy lỗi (không detail) có errorCode");
      ok(!("errorDetail" in noDetail), "proxy lỗi (không detail) KHÔNG kèm errorDetail");
      ok(!String(noDetail.error || "").includes(bwork),
        "proxy lỗi (không detail): error không rò đường dẫn tuyệt đối");
      const withDetail = JSON.parse(
        post(`http://127.0.0.1:${port}/api/proxy?detail=1`).stdout || "{}");
      ok(withDetail.errorDetail && withDetail.errorDetail.code !== undefined,
        "proxy lỗi (?detail=1) có errorDetail canonical");
      ok(!JSON.stringify(withDetail).includes(bwork),
        "proxy lỗi (?detail=1): payload không rò đường dẫn tuyệt đối");
      // Route vẫn hoạt động bình thường với file hợp lệ nhỏ (skipped).
      const small = path.join(bwork, "small.mp4");
      run("ffmpeg", ["-y", "-v", "warning", "-f", "lavfi",
        "-i", "testsrc=duration=1:size=320x240:rate=30", "-pix_fmt", "yuv420p", small]);
      const okRes = JSON.parse(post(`http://127.0.0.1:${port}/api/proxy`, small).stdout || "{}");
      ok(okRes.skipped === true, "proxy file nhỏ hợp lệ vẫn trả skipped:true (route không bị phá)");
    }
  } finally {
    server.kill("SIGKILL");
    fs.rmSync(bwork, { recursive: true, force: true });
  }

  console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
  process.exit(fail === 0 ? 0 : 1);
}

main();
