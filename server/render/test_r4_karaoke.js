/**
 * test_r4_karaoke.js — Test karaoke render thật (Phase 9 R4).
 * Chạy: node test_r4_karaoke.js (từ server/render).
 * Kiểm chứng: render spec có text clip karaoke → trích frame ở 3 thời điểm
 * → đếm pixel vàng (đã hát) vs trắng (chưa hát) trong vùng dòng chữ:
 *   - t=0.4s (từ 1 đang hát): có cả vàng và trắng
 *   - t=2.0s (từ 1-2 xong, từ 3 đang hát): vàng nhiều hơn trắng
 *   - t=3.6s (hát xong): vàng chiếm đa số, trắng ~0
 * Không mock: render FFmpeg thật + đọc pixel PNG thật bằng Python/PIL.
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync, spawnSync } = require("child_process");

function run(cmd, args) {
  return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

async function main() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-r4-"));
  const mediaDir = path.join(dir, "media");
  fs.mkdirSync(mediaDir, { recursive: true });
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) { pass++; console.log(`  ✓ ${m}`); } else { fail++; console.error(`  ✗ ${m}`); } };

  // Nền đen 4s để vùng chữ sạch (không nhiễu testsrc).
  const bg = path.join(mediaDir, "bg.mp4");
  run("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "color=c=0x000000:s=640x360:d=4:r=30",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p", bg]);

  const spec = {
    version: "0.2.0",
    meta: { name: "r4-karaoke", width: 640, height: 360, fps: 30, duration: 4 },
    tracks: [
      {
        id: "v1", kind: "video", label: "Video",
        clips: [{ kind: "video", id: "bg1", src: "bg.mp4", start: 0, duration: 4, in: 0, out: 4, speed: 1 }],
      },
      {
        id: "t1", kind: "text", label: "Karaoke",
        clips: [{
          kind: "text", id: "ka1", text: "Xin chào Việt Nam",
          start: 0, duration: 4,
          style: {
            fontFamily: "DejaVu Sans", fontSize: 48,
            color: "#ffffff", backgroundColor: "#000000",
            highlightColor: "#ffff00", bold: true,
            x: 0.5, y: 0.5, animation: "none",
          },
          karaoke: [
            { word: "Xin", start: 0, end: 0.8 },
            { word: "chào", start: 0.8, end: 1.6 },
            { word: "Việt", start: 1.6, end: 2.4 },
            { word: "Nam", start: 2.4, end: 3.2 },
          ],
        }],
      },
    ],
  };
  const specPath = path.join(dir, "spec.json");
  fs.writeFileSync(specPath, JSON.stringify(spec));
  const out = path.join(dir, "out.mp4");
  const r = spawnSync("node", ["src/render.js", "--spec", specPath, "--out", out, "--media-dir", mediaDir],
    { cwd: __dirname, encoding: "utf8" });
  if (r.status !== 0) {
    console.error(r.stdout?.slice(-2000));
    console.error(r.stderr?.slice(-2000));
  }
  ok(r.status === 0 && fs.existsSync(out), "render karaoke ra MP4");

  // Trích frame + đếm pixel vàng/trắng bằng PIL (vùng giữa khung hình).
  const py = `
import sys, subprocess
from PIL import Image
for t in [0.4, 2.0, 3.6]:
    png = sys.argv[1] + f"/f{t}.png"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", str(t), "-i", sys.argv[2],
                    "-frames:v", "1", png], check=True)
    im = Image.open(png).convert("RGB")
    w, h = im.size
    # Vùng dòng chữ: giữa khung, bỏ viền (chữ căn giữa, y=0.5).
    yellow = white = 0
    for y in range(int(h*0.35), int(h*0.65)):
        for x in range(int(w*0.1), int(w*0.9)):
            r, g, b = im.getpixel((x, y))
            if r > 180 and g > 180 and b < 120:
                yellow += 1
            elif r > 180 and g > 180 and b > 180:
                white += 1
    print(f"{t} yellow={yellow} white={white}")
`;
  const pyFile = path.join(dir, "count.py");
  fs.writeFileSync(pyFile, py);
  const counts = {};
  try {
    const o = run("python3", [pyFile, dir, out]);
    console.log(o.trim().split("\n").map((l) => "  " + l).join("\n"));
    for (const line of o.trim().split("\n")) {
      const m = /([\d.]+) yellow=(\d+) white=(\d+)/.exec(line);
      if (m) counts[m[1]] = { yellow: Number(m[2]), white: Number(m[3]) };
    }
  } catch (e) {
    console.error("  (không đếm được pixel — PIL/ffmpeg lỗi)", e.message.slice(0, 300));
  }
  const c04 = counts["0.4"] || { yellow: 0, white: 0 };
  const c20 = counts["2"] || counts["2.0"] || { yellow: 0, white: 0 };
  const c36 = counts["3.6"] || { yellow: 0, white: 0 };
  ok(c04.yellow > 50 && c04.white > 50, `t=0.4: có cả vàng (${c04.yellow}) và trắng (${c04.white})`);
  ok(c20.yellow > c20.white, `t=2.0: vàng (${c20.yellow}) nhiều hơn trắng (${c20.white})`);
  ok(c36.yellow > 50 && c36.white < c36.yellow * 0.25,
    `t=3.6: hát xong, vàng (${c36.yellow}) áp đảo trắng (${c36.white})`);

  console.log(`\ntest_r4_karaoke: ${pass} pass, ${fail} fail (WORK=${dir})`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
