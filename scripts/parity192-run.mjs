// parity192-run.mjs — Runner cho harness parity đợt 192 P4 (node, không browser).
//   node scripts/parity192-run.mjs [--out <dir>]
// Bundle harness TS bằng esbuild (pattern esbuild+node của repo) rồi chạy.
// Exit 1 nếu có case CHƯA ĐẠT, 0 nếu tất cả ĐẠT.
// Không đụng code sản phẩm, không push, không ghi MEMORY/build-loop-log.
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const outIdx = args.indexOf("--out");
const outDir =
  outIdx >= 0 && args[outIdx + 1]
    ? args[outIdx + 1]
    : path.join(os.homedir(), "workspace/goals/capcut-clone-video-editor/hidden_files/parity192");
fs.mkdirSync(outDir, { recursive: true });

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "parity192-run-"));
const bundled = path.join(tmp, "harness.mjs");
const b = spawnSync(
  path.join(REPO, "node_modules/.bin/esbuild"),
  [
    path.join(REPO, "apps/web/src/lib/parityHarness192.ts"),
    "--bundle",
    "--format=esm",
    "--platform=node",
    `--outfile=${bundled}`,
    "--log-level=warning",
  ],
  { encoding: "utf8" },
);
if (b.status !== 0) {
  console.error(`esbuild bundle harness thất bại:\n${b.stderr}`);
  process.exit(2);
}
const r = spawnSync("node", [bundled, "--out", outDir], {
  encoding: "utf8",
  stdio: "inherit",
  env: { ...process.env, PARITY192_RUN_MAIN: "1" },
});
process.exit(r.status ?? 1);
