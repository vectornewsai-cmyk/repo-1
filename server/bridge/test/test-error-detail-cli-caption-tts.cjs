/**
 * Test cho Phase 9 đợt 31 luồng N3: áp mẫu pipe + redact của đợt 30 M3
 * (render không-quiet) cho CLI caption và tts.
 * Chạy bằng: node server/bridge/test/test-error-detail-cli-caption-tts.cjs
 * (cần ffmpeg + CLI đã build ở cli/dist; không cần network)
 *
 * Bao phủ:
 *  (a) Tĩnh: caption.ts/tts.ts không còn stdio inherit cho stderr,
 *      đều qua runStreamed; streamedWorker.ts đúng mẫu M3 (stdout
 *      inherit, stderr pipe, redact theo dòng, StringDecoder, cắt
 *      đuôi 256KB, timeout → SIGKILL); render.ts giữ nguyên
 *      runWorkerStreamed của M3 (luồng này không đụng render).
 *  (b) redactWorkerLine thật (qua dist đã build) trên dòng traceback
 *      kiểu Python: đường dẫn tuyệt đối/home/token → đã redact,
 *      basename còn lại để nhận ra file.
 *  (c) CLI thật, caption hỏng THẬT bằng caption.py thật: project có
 *      clip corrupt.mp4 (file text đội lốt mp4) → ffmpeg trích audio
 *      thất bại, traceback Python in ra stderr qua pipe → exit 1,
 *      stderr KHÔNG chứa đường dẫn tuyệt đối của work dir/home,
 *      vẫn chứa <path>/corrupt.mp4, project không bị thêm track.
 *  (d) CLI thật, mã exit được giữ nguyên trong thông điệp: dùng
 *      VCUT_PYTHON trỏ tới một script "interpreter giả" (chỉ để tạo
 *      tiến trình Python hỏng có kiểm soát: in dòng chứa đường dẫn
 *      tuyệt đối + token rồi exit 3 cho caption, exit 5 cho tts).
 *      Đường CLI → spawn → stream → redact → thông điệp lỗi là thật;
 *      shim chỉ thay interpreter, không mock code redact/stream.
 *      Kết quả: thông điệp giữ đúng "exit 3" / "exit 5" (như định
 *      dạng cũ), process exit 1 qua handler CliError (như trước),
 *      stderr đã redact, không rò home/token.
 *
 * Test chỉ in nhãn pass/fail, KHÔNG in lại giá trị secret mẫu hay
 * đường dẫn tuyệt đối của máy test (chỉ in basename khi cần).
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

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
  console.log("== [a] Tĩnh: caption/tts qua pipe + redact, render giữ nguyên ==");
  {
    const caption = read("cli/src/commands/caption.ts");
    const tts = read("cli/src/commands/tts.ts");
    const worker = read("cli/src/streamedWorker.ts");
    const render = read("cli/src/commands/render.ts");
    for (const [name, src] of [["caption.ts", caption], ["tts.ts", tts]]) {
      // Literal cũ chính xác là ["ignore", "inherit", "inherit"]; comment
      // trong code có nhắc cụm "stdio: inherit" nên không kiểm tra cụm đó.
      ok(!src.includes('stdio: ["ignore", "inherit", "inherit"]'),
        `${name} không còn stdio inherit cho stderr`);
      ok(src.includes("runStreamed") && src.includes("streamedWorker.js"),
        `${name} chạy script qua runStreamed (pipe + redact)`);
    }
    ok(worker.includes('stdio: ["ignore", "inherit", "pipe"]'),
      "streamedWorker: stdout inherit, stderr pipe (đúng mẫu M3)");
    ok(worker.includes("redactWorkerLine") && worker.includes("StringDecoder"),
      "streamedWorker: redact theo dòng + StringDecoder (đúng mẫu M3)");
    ok(worker.includes("SIGKILL") && worker.includes("256 * 1024"),
      "streamedWorker: timeout → SIGKILL, tích lũy cắt đuôi 256KB");
    ok(worker.includes("redactWorkerLine(line)"),
      "streamedWorker: mỗi dòng qua redactWorkerLine trước khi in");
    ok(render.includes("runWorkerStreamed"),
      "render.ts giữ nguyên runWorkerStreamed của M3 (không bị đụng)");
    ok(caption.includes("path.basename(srcAbs)"),
      "caption.ts: dòng thông báo của CLI chỉ in basename, không in srcAbs");
  }

  console.log("== [b] redactWorkerLine thật qua dist: dòng traceback Python ==");
  {
    const dist = path.join(root, "cli", "dist", "cli", "src", "renderErrors.js");
    ok(fs.existsSync(dist), "dist renderErrors.js tồn tại (CLI đã build)");
    if (fs.existsSync(dist)) {
      const home = os.homedir();
      const snippet = [
        "import { redactWorkerLine } from " + JSON.stringify(dist) + ";",
        `const tb = '  File "${home}/secret/work/caption.py", line 12, in main';`,
        "const tok = 'api_key=sk-abcdefghij12345678 và token mờ ' + 'a'.repeat(45);",
        "console.log(JSON.stringify({ tb: redactWorkerLine(tb), tok: redactWorkerLine(tok) }));",
      ].join("\n");
      const r = run("node", ["--input-type=module", "-e", snippet]);
      let out = null;
      try { out = JSON.parse(r.stdout.trim().split("\n").pop()); } catch { /* fail ở dưới */ }
      ok(out && !out.tb.includes(home) && out.tb.includes("<path>/caption.py"),
        "dòng File traceback đã redact (mất home, giữ basename)");
      ok(out && !out.tok.includes("sk-abcdefghij") && !out.tok.includes("a".repeat(45)),
        "dòng chứa token đã redact (mất token thật + token mờ dài)");
    }
  }

  console.log("== [c] CLI thật: caption hỏng thật bằng caption.py thật ==");
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "n3-cli-"));
  const cliJs = path.join(root, "cli", "dist", "cli", "src", "index.js");
  const vcut = (args, opts = {}) => run("node", [cliJs, ...args], { cwd: work, ...opts });
  try {
    vcut(["create", "--name", "N3", "--width", "1280", "--height", "720",
      "--out", path.join(work, "proj.json")]);
    fs.writeFileSync(path.join(work, "corrupt.mp4"), "not a video");
    const before = JSON.parse(fs.readFileSync(path.join(work, "proj.json"), "utf8"));
    const bad = vcut(["caption", "--project", path.join(work, "proj.json"),
      "--src", path.join(work, "corrupt.mp4"), "--lang", "vi"]);
    ok(bad.status === 1, `caption hỏng thật → process exit 1 (nhận ${bad.status})`);
    ok(String(bad.stderr).includes("caption.py thất bại (exit 1)"),
      "caption hỏng thật → thông điệp giữ mã exit 1 như định dạng cũ");
    ok(!String(bad.stderr).includes(work),
      "caption hỏng thật → stderr không chứa đường dẫn tuyệt đối work dir");
    ok(!String(bad.stderr).includes(os.homedir()),
      "caption hỏng thật → stderr không chứa home dir");
    ok(String(bad.stderr).includes("<path>/corrupt.mp4"),
      "caption hỏng thật → stderr vẫn giữ <path>/corrupt.mp4 để nhận ra file");
    const after = JSON.parse(fs.readFileSync(path.join(work, "proj.json"), "utf8"));
    ok(JSON.stringify(after.tracks) === JSON.stringify(before.tracks),
      "caption hỏng thật → project không bị thêm track");
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }

  console.log("== [d] CLI thật: mã exit giữ nguyên qua shim interpreter ==");
  const work2 = fs.mkdtempSync(path.join(os.tmpdir(), "n3-shim-"));
  try {
    // Shim: in một dòng kiểu traceback Python chứa đường dẫn tuyệt đối
    // + home + token rồi thoát với mã cố định. Đây là tiến trình con
    // thật qua spawn của CLI, không phải mock hàm redact/stream.
    const shim = path.join(work2, "fake-python.sh");
    fs.writeFileSync(shim, "#!/bin/sh\n" +
      `echo '  File "${work2}/secret/script.py", line 9, in <module>' >&2\n` +
      `echo 'token sk-abcdefghij12345678 home ${os.homedir()}' >&2\n` +
      "echo 'stdout vẫn inherit, thấy được dòng này'\n" +
      "exit $FAKE_EXIT\n");
    fs.chmodSync(shim, 0o755);
    const cliJs2 = path.join(root, "cli", "dist", "cli", "src", "index.js");
    {
      const proj = path.join(work2, "proj.json");
      run("node", [cliJs2, "create", "--name", "N3s", "--width", "1280",
        "--height", "720", "--out", proj], { cwd: work2 });
      // caption kiểm tra tồn tại src trước khi spawn nên cần file thật.
      fs.writeFileSync(path.join(work2, "x.mp4"), "x");
      const envCap = { ...process.env, VCUT_PYTHON: shim, FAKE_EXIT: "3" };
      const capRun = run("node", [cliJs2, "caption", "--project", proj,
        "--src", path.join(work2, "x.mp4"), "--lang", "vi"],
        { cwd: work2, env: envCap });
      ok(capRun.status === 1, `caption shim exit 3 → process exit 1 (nhận ${capRun.status})`);
      ok(String(capRun.stderr).includes("caption.py thất bại (exit 3)"),
        "caption shim → thông điệp giữ đúng mã exit 3 của tiến trình con");
      ok(!String(capRun.stderr).includes(work2) && !String(capRun.stderr).includes(os.homedir())
        && !String(capRun.stderr).includes("sk-abcdefghij"),
        "caption shim → stderr đã redact (không rò work dir/home/token)");
      ok(String(capRun.stdout).includes("stdout vẫn inherit"),
        "caption shim → stdout tiến trình con vẫn inherit như trước");

      const envTts = { ...process.env, VCUT_PYTHON: shim, FAKE_EXIT: "5" };
      const tts = run("node", [cliJs2, "tts", "--project", proj,
        "--text", "Xin chào", "--start", "0"], { cwd: work2, env: envTts });
      ok(tts.status === 1, `tts shim exit 5 → process exit 1 (nhận ${tts.status})`);
      ok(String(tts.stderr).includes("tts.py thất bại (exit 5)"),
        "tts shim → thông điệp giữ đúng mã exit 5 của tiến trình con");
      ok(!String(tts.stderr).includes(work2) && !String(tts.stderr).includes(os.homedir())
        && !String(tts.stderr).includes("sk-abcdefghij"),
        "tts shim → stderr đã redact (không rò work dir/home/token)");
      ok(String(tts.stdout).includes("stdout vẫn inherit"),
        "tts shim → stdout tiến trình con vẫn inherit như trước");
    }
  } finally {
    fs.rmSync(work2, { recursive: true, force: true });
  }

  console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
  process.exit(fail === 0 ? 0 : 1);
}

main();
