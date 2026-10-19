"use strict";
/**
 * Unit test cho server/bridge/src/scene.js.
 * Chạy: node test/test-scene.cjs  (từ thư mục server/bridge)
 * KHÔNG cần python/ffmpeg — runSceneDetect được test với script stub.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
  DEFAULT_THRESHOLD,
  validateThreshold,
  validateRange,
  validateCuts,
  sceneAvailable,
  runSceneDetect,
} = require("../src/scene.js");

let pass = 0;
function check(name, fn) {
  try {
    const r = fn();
    if (r && typeof r.then === "function") {
      return r.then(
        () => { pass++; console.log(`  PASS ${name}`); },
        (e) => { console.log(`  FAIL ${name}: ${e.message}`); process.exitCode = 1; }
      );
    }
    pass++;
    console.log(`  PASS ${name}`);
  } catch (e) {
    console.log(`  FAIL ${name}: ${e.message}`);
    process.exitCode = 1;
  }
}

async function main() {
  console.log("== [1] validateThreshold ==");
  check("mặc định 0.4", () => assert.equal(validateThreshold(undefined), 0.4));
  check("chuỗi rỗng -> mặc định", () => assert.equal(validateThreshold(""), 0.4));
  check("0.05 ok", () => assert.equal(validateThreshold("0.05"), 0.05));
  check("0.95 ok", () => assert.equal(validateThreshold(0.95), 0.95));
  check("0 -> throw", () => assert.throws(() => validateThreshold(0)));
  check("1 -> throw", () => assert.throws(() => validateThreshold(1)));
  check("chữ -> throw", () => assert.throws(() => validateThreshold("abc")));
  check("âm -> throw", () => assert.throws(() => validateThreshold(-0.1)));

  console.log("== [2] validateRange ==");
  check("trống -> null/null", () => assert.deepEqual(validateRange("", ""), { start: null, end: null }));
  check("10/60 ok", () => assert.deepEqual(validateRange("10", "60"), { start: 10, end: 60 }));
  check("end <= start -> throw", () => assert.throws(() => validateRange("60", "10")));
  check("start âm -> throw", () => assert.throws(() => validateRange("-5", "60")));

  console.log("== [3] validateCuts ==");
  check("sắp xếp + làm tròn", () =>
    assert.deepEqual(validateCuts([3.0009, 1.5, "2"]), [1.5, 2, 3.001]));
  check("bỏ giá trị hỏng", () =>
    assert.deepEqual(validateCuts([1, -2, NaN, "x", 5]), [1, 5]));
  check("không phải mảng -> throw", () =>
    assert.throws(() => validateCuts("nope")));

  console.log("== [4] sceneAvailable ==");
  check("script thật tồn tại", () => {
    const a = sceneAvailable();
    assert.equal(a.available, true);
  });
  check("script giả -> unavailable", () => {
    const a = sceneAvailable({ scenePy: "/nope/scene.py", pythonBin: "python3", timeoutMs: 60000 });
    assert.equal(a.available, false);
    assert.match(a.reason, /Không tìm thấy/);
  });

  console.log("== [5] runSceneDetect với stub ==");
  await check("stub trả cuts đúng", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "scene-stub-"));
    const stub = path.join(dir, "stub.py");
    // Stub: nhận argv như scene.py thật, ghi JSON hợp lệ.
    fs.writeFileSync(stub, `import json, sys
out = sys.argv[sys.argv.index("--out") + 1]
print("[scene] quét scene (threshold=0.4)...", flush=True)
json.dump({"cuts": [2.0, 4.0], "duration": 6.0, "threshold": 0.4, "cut_candidates": 2}, open(out, "w"))
`);
    const inputPath = path.join(dir, "in.mp4");
    fs.writeFileSync(inputPath, "fake");
    const phases = [];
    const res = await runSceneDetect({
      inputPath,
      threshold: 0.4,
      start: null,
      end: null,
      onPhase: (p) => phases.push(p),
      config: { pythonBin: "python3", scenePy: stub, timeoutMs: 30000 },
    });
    assert.deepEqual(res.cuts, [2, 4]);
    assert.equal(res.duration, 6);
    assert.deepEqual(phases, ["scan"]);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  await check("stub exit != 0 -> lỗi rõ", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "scene-stub-"));
    const stub = path.join(dir, "stub.py");
    fs.writeFileSync(stub, `import sys
print("[scene] LỖI: boom", file=sys.stderr)
sys.exit(1)
`);
    const inputPath = path.join(dir, "in.mp4");
    fs.writeFileSync(inputPath, "fake");
    await assert.rejects(
      () => runSceneDetect({
        inputPath, threshold: 0.4, start: null, end: null,
        config: { pythonBin: "python3", scenePy: stub, timeoutMs: 30000 },
      }),
      /boom/
    );
    fs.rmSync(dir, { recursive: true, force: true });
  });

  console.log(`\n==========================================\nSCENE UNIT PASS: ${pass} assertions\n==========================================`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
