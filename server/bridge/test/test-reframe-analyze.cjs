"use strict";
/**
 * test-reframe-analyze.cjs — test analyzeReframe (Phase 7 P6, trajectory preview).
 * Chạy: node test/test-reframe-analyze.cjs
 * Cần: ffmpeg + python có cv2 (mặc định dùng server/reframe/.venv/bin/python
 * nếu tồn tại, giống reframeConfigFromEnv).
 *
 * Test thật: tạo video 640x360 3s có hộp trắng di chuyển trái -> phải,
 * gọi analyzeReframe, assert trajectory theo hộp di chuyển và crop window
 * đúng 9:16. KHÔNG cần bridge đang chạy.
 */
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const { execFileSync } = require("node:child_process");

const { analyzeReframe, validateAspect } = require("../src/reframe");

let pass = 0;
function ok(name, cond) {
  assert.ok(cond, name);
  pass++;
  console.log(`  ✓ ${name}`);
}

(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rfan-"));
  const venvPy = path.resolve(__dirname, "..", "..", "reframe", ".venv", "bin", "python");
  if (fs.existsSync(venvPy)) process.env.REFRAME_PYTHON = venvPy;
  const src = path.join(dir, "move.mp4");
  // Hộp trắng 90x90 di chuyển từ x=50 -> x=500 trong 3s trên nền đen.
  // Tạo bằng cv2 (ffmpeg drawbox/overlay không đánh giá được x theo t một
  // cách đáng tin cậy trên build này — đã thử và xác minh là không ra hộp).
  const genPy = path.join(dir, "gen.py");
  fs.writeFileSync(genPy, `
import cv2, numpy as np, sys
out = sys.argv[1]
w, h, fps, n = 640, 360, 30, 90
wr = cv2.VideoWriter(out, cv2.VideoWriter_fourcc(*"mp4v"), fps, (w, h))
assert wr.isOpened()
for i in range(n):
    f = np.zeros((h, w, 3), dtype=np.uint8)
    cx = int(50 + 450 * i / (n - 1))
    cv2.rectangle(f, (cx, 135), (cx + 90, 225), (255, 255, 255), -1)
    wr.write(f)
wr.release()
`);
  execFileSync(process.env.REFRAME_PYTHON || "python3", [genPy, src]);

  console.log("== analyzeReframe ==");
  const data = await analyzeReframe({ inputPath: src, aspect: "9:16" });
  ok("source_size 640x360", JSON.stringify(data.source_size) === "[640,360]");
  ok("crop_window 202x360", JSON.stringify(data.crop_window) === "[202,360]");
  ok("có trajectory", Array.isArray(data.trajectory) && data.trajectory.length >= 5);
  for (const p of data.trajectory) {
    assert.ok(p.x0 >= 0 && p.x0 <= 640 - 202, `x0 ngoài biên: ${JSON.stringify(p)}`);
    assert.ok(p.y0 === 0 && p.w === 202 && p.h === 360, `rect sai: ${JSON.stringify(p)}`);
  }
  const half = Math.floor(data.trajectory.length / 2);
  const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const first = mean(data.trajectory.slice(0, half).map((p) => p.x0));
  const second = mean(data.trajectory.slice(half).map((p) => p.x0));
  ok(`x0 tăng theo hộp (${first.toFixed(0)} -> ${second.toFixed(0)})`, second > first);
  ok("detections có motion", (data.detections.motion || 0) >= 1);

  console.log("== validateAspect vẫn chặn aspect lạ ==");
  let threw = false;
  try { validateAspect("16:9"); } catch { threw = true; }
  ok("từ chối 16:9", threw);

  fs.rmSync(dir, { recursive: true, force: true });
  console.log(`\n== KẾT QUẢ: ${pass} pass ==`);
})().catch((e) => {
  console.error("FAIL:", e);
  process.exit(1);
});
