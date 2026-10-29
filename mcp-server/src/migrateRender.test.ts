/**
 * migrateRender.test.ts — Test THẬT chuỗi MCP → render (Phase 9 đợt 13 C4).
 *
 * Chứng minh đầu-cuối: project cũ (motionBlur weights 0, thiếu frames) đi
 * qua đúng cổng MCP (validateVideoSpec — nơi loadProject/saveProject/
 * render_video đều đi qua) rồi ghi ra file tạm như render_video vẫn làm,
 * render worker render ra MP4 đúng 60 frame / 2s ở 30fps — tức motion cũ
 * không còn bị MCP làm mất trước khi tới cổng render.
 *
 * Chạy: npx tsc -p tsconfig.json && node dist/mcp-server/src/migrateRender.test.js
 * (từ thư mục mcp-server; chạy qua dist — route strip-types không resolve
 * được "./validate.js" trên Node 24.22 ở đây, xem LIMITS).
 */
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { validateVideoSpec } from "./validate.js";
import { SPEC_VERSION } from "../../packages/video-spec/src/index.js";

const HERE = path.dirname(fileURLToPath(import.meta.url)); // src/ khi chạy strip-types, dist/mcp-server/src/ khi chạy qua dist
// Repo root: đi lên từ HERE cho tới khi thấy server/render/src/render.js
// (chạy từ src: lên 2 cấp; chạy từ dist: lên 4 cấp). Không hard-code vì
// layout dist khác layout src — lần đầu hard-code đã làm spawn ENOENT.
function findRepoRoot(): string {
  let dir = HERE;
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(dir, "server", "render", "src", "render.js"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`không tìm thấy repo root từ ${HERE}`);
}
const REPO_ROOT = findRepoRoot();
const RENDER_JS = path.join(REPO_ROOT, "server", "render", "src", "render.js");
const RENDER_CWD = path.join(REPO_ROOT, "server", "render");
const W = 320, H = 180, FPS = 30, DUR = 2;

let failed = 0;
function ok(cond: boolean, msg: string): void {
  if (cond) console.log(`  ✅ ${msg}`);
  else { failed++; console.log(`  ❌ ${msg}`); }
}
function run(cmd: string, args: string[], label: string, cwd?: string) {
  const r = spawnSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"], cwd });
  if (r.error || r.status !== 0) {
    console.error(`❌ bước "${label}" thất bại (mã ${r.status}):\n${(r.stderr || "").toString().slice(-1200)}`);
    process.exit(2);
  }
  return r;
}

const work = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-mcp-migrate-"));
try {
  const mediaDir = path.join(work, "media");
  fs.mkdirSync(mediaDir, { recursive: true });
  run("ffmpeg", ["-f", "lavfi", "-i", `testsrc2=s=${W}x${H}:r=30:d=4`,
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
    "-an", "-y", path.join(mediaDir, "src.mp4")], "tạo src.mp4");

  // Project cũ: weights toàn 0 + thiếu frames — trước đợt này MCP làm mất
  // cả motion nên render ra clip không blur; nay phải migrate rồi render.
  const legacy = {
    version: SPEC_VERSION,
    meta: { name: "mcp-migrate", width: W, height: H, fps: FPS },
    tracks: [{
      id: "v1", kind: "video",
      clips: [{
        kind: "video", id: "c1", src: "src.mp4", start: 0, duration: DUR,
        in: 0, out: DUR, motion: { motionBlur: { weights: [0, 0, 0] } },
      }],
    }],
  };
  const migrated = validateVideoSpec(legacy);
  const blur = (migrated.tracks[0].clips[0] as unknown as Record<string, unknown>)
    .motion as Record<string, unknown>;
  ok(JSON.stringify((blur.motionBlur as Record<string, unknown>).weights) === "[1,1,1]" &&
    (blur.motionBlur as Record<string, unknown>).frames === 3,
    `MCP validate migrate weights 0 → frames=3, weights=[1,1,1] (nhận ${JSON.stringify(blur.motionBlur)})`);

  // Đúng như render_video: ghi spec đã validate ra file tạm rồi gọi worker.
  const specPath = path.join(work, "spec.json");
  fs.writeFileSync(specPath, JSON.stringify(migrated), "utf8");
  const outPath = path.join(work, "out.mp4");
  const r = spawnSync("node", [RENDER_JS, "--spec", specPath, "--out", outPath,
    "--media-dir", mediaDir, "--x264-preset", "veryfast", "--crf", "28", "-y"],
    { stdio: ["ignore", "pipe", "pipe"], cwd: RENDER_CWD });
  ok(r.status === 0, `render worker rc=0 (stderr đuôi: ${(r.stderr || "").toString().slice(-200)})`);
  if (r.status === 0) {
    const probe = run("ffprobe", ["-v", "error", "-count_frames", "-select_streams", "v:0",
      "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", outPath], "đếm frame");
    const n = parseInt(probe.stdout.toString().trim(), 10);
    ok(n === DUR * FPS, `project cũ qua MCP → MP4 ${n} frame / ${DUR}s (muốn ${DUR * FPS})`);
  }
} finally {
  fs.rmSync(work, { recursive: true, force: true });
}

console.log(failed === 0 ? "🎉 TẤT CẢ PASS" : "❌ CÓ TEST FAIL");
process.exit(failed === 0 ? 0 : 1);
