"use strict";
/**
 * test-bgremove-ramguard.cjs — test RAM guard birefnet của bridge
 * (Phase 9 đợt 88 P7, nợ N4 đợt 86). Dùng stub Python thay cho bgremove.py
 * thật (qua env BGREMOVE_PY), KHÔNG cần rembg/model.
 *
 * Các case:
 *  1. stub in marker ram_guard_* + session_used=u2net (mô phỏng Python
 *     chặn birefnet từ đầu) -> runBgremove chỉ spawn 1 lần (KHÔNG retry),
 *     sessionUsed = u2net, fallbackFrom = birefnet-general,
 *     fallbackReason nhắc "RAM guard" + số MB thật từ marker.
 *  2. stub ok bình thường (không marker guard) -> không fallback,
 *     fallbackReason = null.
 *  3. parseSessionMarkers đọc được ram_guard_from/avail_mb/min_mb.
 *
 * Chạy: node test/test-bgremove-ramguard.cjs
 */
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const os = require("node:os");

const {
  runBgremove,
  parseSessionMarkers,
} = require("../src/bgremove");

let pass = 0;
function ok(name, cond) {
  assert.ok(cond, name);
  pass++;
  console.log(`  ✓ ${name}`);
}

// Stub Python: đọc --session/--output từ argv, ghi số lần gọi vào file đếm.
// mode ramguard: in marker RAM guard + session_used=u2net, exit 0.
// mode ok: chỉ in session_used=<session yêu cầu>, exit 0.
const STUB = `
import os, sys
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
if mode == "ramguard":
    print("[bgremove] RAM_GUARD session=birefnet-general avail_mb=1405 min_mb=6144 -> u2net (RAM kha dung thap, tranh OOM-kill)", file=sys.stderr)
    print("[bgremove] ram_guard_from=birefnet-general", file=sys.stderr)
    print("[bgremove] ram_guard_avail_mb=1405", file=sys.stderr)
    print("[bgremove] ram_guard_min_mb=6144", file=sys.stderr)
    open(out, "wb").write(b"fake-mov")
    print("[bgremove] session_used=u2net", file=sys.stderr)
    print("[bgremove] fallback_from=birefnet-general", file=sys.stderr)
    sys.exit(0)
open(out, "wb").write(b"fake-mov")
print(f"[bgremove] session_used={session}", file=sys.stderr)
`;

async function withStub(mode, fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bgrg-"));
  const stubPath = path.join(dir, "stub_bgremove.py");
  writeFileEpermRetry(stubPath, STUB);
  const countFile = path.join(dir, "count");
  writeFileEpermRetry(countFile, "0");
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
  console.log("== [1] RAM guard chặn từ đầu -> u2net, chỉ 1 lần spawn ==");
  {
    const { result, count } = await withStub("ramguard", (out) =>
      runBgremove({ inputPath: "/tmp/in.mp4", outputPath: out, session: "birefnet-general" }));
    ok("chỉ spawn 1 lần (guard xử lý trong tiến trình, bridge không retry)", count === 1);
    ok("sessionUsed = u2net", result.sessionUsed === "u2net");
    ok("fallbackFrom = birefnet-general", result.fallbackFrom === "birefnet-general");
    ok("fallbackReason nhắc RAM guard", (result.fallbackReason || "").includes("RAM guard"));
    ok("fallbackReason có số MB từ marker", (result.fallbackReason || "").includes("1405") && (result.fallbackReason || "").includes("6144"));
    ok("fallbackReason nói không thử birefnet", (result.fallbackReason || "").includes("không thử birefnet-general"));
  }

  console.log("== [2] không marker guard -> không fallback ==");
  {
    const { result, count } = await withStub("ok", (out) =>
      runBgremove({ inputPath: "/tmp/in.mp4", outputPath: out, session: "birefnet-general" }));
    ok("chỉ 1 lần", count === 1);
    ok("sessionUsed = birefnet-general", result.sessionUsed === "birefnet-general");
    ok("không fallback", result.fallbackFrom === null && result.fallbackReason === null);
  }

  console.log("== [3] parseSessionMarkers đọc marker ram_guard ==");
  {
    const m = parseSessionMarkers(
      "[bgremove] RAM_GUARD session=birefnet-general avail_mb=1405 min_mb=6144 -> u2net\n" +
      "[bgremove] ram_guard_from=birefnet-general\n" +
      "[bgremove] ram_guard_avail_mb=1405\n" +
      "[bgremove] ram_guard_min_mb=6144\n" +
      "[bgremove] session_used=u2net\n" +
      "[bgremove] fallback_from=birefnet-general\n");
    ok("parse ramGuardFrom", m.ramGuardFrom === "birefnet-general");
    ok("parse ramGuardAvailMb", m.ramGuardAvailMb === 1405);
    ok("parse ramGuardMinMb", m.ramGuardMinMb === 6144);
    ok("parse session_used vẫn đúng", m.sessionUsed === "u2net");
    ok("parse fallback_from vẫn đúng", m.fallbackFrom === "birefnet-general");
    const m2 = parseSessionMarkers("[bgremove] session_used=u2net\n");
    ok("không marker guard -> null", m2.ramGuardFrom === null && m2.ramGuardAvailMb === null && m2.ramGuardMinMb === null);
  }

  console.log(`\n== KẾT QUẢ: ${pass} pass ==`);
})().catch((e) => {
  console.error("FAIL:", e);
  process.exit(1);
});
