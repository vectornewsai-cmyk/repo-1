"use strict";
/**
 * test-bgremove-fallback.cjs — test retry u2net của bridge khi birefnet chết
 * (Phase 7 P6). Dùng stub Python thay cho bgremove.py thật (qua env
 * BGREMOVE_PY), KHÔNG cần rembg/model.
 *
 * Các case:
 *  1. birefnet exit 1 -> retry u2net thành công, báo fallback rõ.
 *  2. birefnet tự SIGKILL (mô phỏng OOM-kill của kernel) -> retry u2net.
 *  3. birefnet + u2net đều lỗi -> reject, đã thử đúng 2 lần.
 *  4. birefnet thành công ngay -> không retry, sessionUsed đúng.
 *  5. yêu cầu u2net mà lỗi -> không retry (chỉ 1 lần).
 *  6. validateSession chấp nhận "auto", vẫn cấm bria.
 *
 * Chạy: node test/test-bgremove-fallback.cjs
 */
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");

const {
  runBgremove,
  validateSession,
  parseSessionMarkers,
} = require("../src/bgremove");

let pass = 0;
function ok(name, cond) {
  assert.ok(cond, name);
  pass++;
  console.log(`  ✓ ${name}`);
}

// Stub Python: đọc --session/--output từ argv, hành vi theo mode ghi trong
// tên file stub (fail / sigkill / alwaysfail / ok) + ghi số lần gọi vào
// file đếm bên cạnh stub.
const STUB = `
import os, signal, sys
args = sys.argv[1:]
def val(flag):
    return args[args.index(flag) + 1] if flag in args else ""
session = val("--session")
out = val("--output")
mode = os.environ.get("STUB_MODE", "ok")
count_file = os.environ.get("STUB_COUNT", "")
if count_file:
    try:
        n = int(open(count_file).read() or "0")
    except Exception:
        n = 0
    open(count_file, "w").write(str(n + 1))
if mode == "fail" and session.startswith("birefnet"):
    print("[bgremove] gia lap loi birefnet", file=sys.stderr)
    sys.exit(1)
if mode == "sigkill" and session.startswith("birefnet"):
    sys.stdout.flush(); sys.stderr.flush()
    os.kill(os.getpid(), signal.SIGKILL)
if mode == "alwaysfail":
    print("[bgremove] gia lap loi", file=sys.stderr)
    sys.exit(1)
open(out, "wb").write(b"fake-mov")
print(f"[bgremove] session_used={session}", file=sys.stderr)
`;

async function withStub(mode, fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bgfb-"));
  const stubPath = path.join(dir, "stub_bgremove.py");
  fs.writeFileSync(stubPath, STUB);
  const countFile = path.join(dir, "count");
  fs.writeFileSync(countFile, "0");
  const prevPy = process.env.BGREMOVE_PY;
  const prevMode = process.env.STUB_MODE;
  const prevCount = process.env.STUB_COUNT;
  process.env.BGREMOVE_PY = stubPath;
  process.env.STUB_MODE = mode;
  process.env.STUB_COUNT = countFile;
  try {
    const outPath = path.join(dir, "out.mov");
    const result = await fn(outPath);
    const count = parseInt(fs.readFileSync(countFile, "utf8") || "0", 10);
    return { result, count, dir };
  } finally {
    if (prevPy === undefined) delete process.env.BGREMOVE_PY;
    else process.env.BGREMOVE_PY = prevPy;
    if (prevMode === undefined) delete process.env.STUB_MODE;
    else process.env.STUB_MODE = prevMode;
    if (prevCount === undefined) delete process.env.STUB_COUNT;
    else process.env.STUB_COUNT = prevCount;
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

(async () => {
  console.log("== [1] birefnet exit 1 -> retry u2net ==");
  {
    const { result, count } = await withStub("fail", (out) =>
      runBgremove({ inputPath: "/tmp/in.mp4", outputPath: out, session: "birefnet-general" }));
    ok("thử đúng 2 lần", count === 2);
    ok("sessionUsed = u2net", result.sessionUsed === "u2net");
    ok("fallbackFrom = birefnet-general", result.fallbackFrom === "birefnet-general");
    ok("có fallbackReason", typeof result.fallbackReason === "string" && result.fallbackReason.length > 0);
  }

  console.log("== [2] birefnet SIGKILL (mô phỏng OOM) -> retry u2net ==");
  {
    const { result, count } = await withStub("sigkill", (out) =>
      runBgremove({ inputPath: "/tmp/in.mp4", outputPath: out, session: "birefnet-general" }));
    ok("thử đúng 2 lần sau SIGKILL", count === 2);
    ok("sessionUsed = u2net", result.sessionUsed === "u2net");
    ok("fallbackReason nhắc SIGKILL", (result.fallbackReason || "").includes("SIGKILL"));
  }

  console.log("== [3] cả 2 đều lỗi -> reject ==");
  {
    let threw = null;
    const { count } = await withStub("alwaysfail", async (out) => {
      try {
        await runBgremove({ inputPath: "/tmp/in.mp4", outputPath: out, session: "birefnet-general" });
      } catch (e) { threw = e; }
      return null;
    });
    ok("thử đúng 2 lần rồi mới báo lỗi", count === 2);
    ok("lỗi nhắc cả 2 session", threw && /birefnet-general/.test(threw.message) && /u2net/.test(threw.message));
  }

  console.log("== [4] birefnet thành công ngay -> không retry ==");
  {
    const { result, count } = await withStub("ok", (out) =>
      runBgremove({ inputPath: "/tmp/in.mp4", outputPath: out, session: "birefnet-general" }));
    ok("chỉ 1 lần", count === 1);
    ok("sessionUsed = birefnet-general", result.sessionUsed === "birefnet-general");
    ok("không fallback", result.fallbackFrom === null);
  }

  console.log("== [5] yêu cầu u2net mà lỗi -> không retry ==");
  {
    let threw = null;
    const { count } = await withStub("alwaysfail", async (out) => {
      try {
        await runBgremove({ inputPath: "/tmp/in.mp4", outputPath: out, session: "u2net" });
      } catch (e) { threw = e; }
      return null;
    });
    ok("chỉ 1 lần", count === 1);
    ok("có lỗi", threw !== null);
  }

  console.log("== [6] validateSession + parseSessionMarkers ==");
  ok('auto hợp lệ', validateSession("auto") === "auto");
  ok('birefnet hợp lệ', validateSession("birefnet-general") === "birefnet-general");
  let threw = false;
  try { validateSession("bria-rmbg"); } catch { threw = true; }
  ok("bria vẫn bị cấm", threw);
  const m = parseSessionMarkers("[bgremove] xong\n[bgremove] session_used=u2net\n[bgremove] fallback_from=birefnet-general\n");
  ok("parse session_used", m.sessionUsed === "u2net");
  ok("parse fallback_from", m.fallbackFrom === "birefnet-general");

  console.log(`\n== KẾT QUẢ: ${pass} pass ==`);
})().catch((e) => {
  console.error("FAIL:", e);
  process.exit(1);
});
