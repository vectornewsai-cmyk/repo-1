// parity191-run-test.mjs — Runner cho test helper của harness parity đợt 191 P4.
//   node scripts/parity191-run-test.mjs
// Bundle test TS bằng esbuild rồi chạy node (mẫu esbuild+node của repo).
// Không đụng code sản phẩm, không push.
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "parity191-test-"));
const bundled = path.join(tmp, "test.mjs");
const b = spawnSync(
  path.join(REPO, "node_modules/.bin/esbuild"),
  [
    path.join(REPO, "apps/web/src/lib/parityHarness191.test.ts"),
    "--bundle",
    "--format=esm",
    "--platform=node",
    `--outfile=${bundled}`,
    "--log-level=warning",
  ],
  { encoding: "utf8" },
);
if (b.status !== 0) {
  console.error(`esbuild bundle test thất bại:\n${b.stderr}`);
  process.exit(2);
}
const r = spawnSync("node", [bundled], { encoding: "utf8", stdio: "inherit" });
process.exit(r.status ?? 1);
