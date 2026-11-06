#!/usr/bin/env node
// Test thuần Node T6 đợt 37 — xác minh ctts/present-order của demux trên
// file proxy thật mà KHÔNG cần browser, KHÔNG cần chạm tsconfig (bundle
// mp4Demux.ts bằng esbuild ra scratch rồi import; không dùng .test.ts).
// Chạy: node apps/web/scripts/probe-round37-t6-ctts-node.mjs <proxy.mp4>
//   [T6_SCRATCH] — mặc định ~/workspace/tmp-round37-t6/wc-node
// Assert (FAIL -> exit 1, in rõ từng check):
//   1. presentOrderFor là hoán vị của decode-index.
//   2. presentOrderFor đơn điệu không giảm theo presentationTimestamp.
//   3. Có sample ctts khác 0 (proxy có B-frame thì presentation != decode
//      ở ít nhất 1 sample) VÀ present giảm trong thứ tự decode (> 0).
//   4. presentOrder khác thứ tự index giảm dần mù (reorder thật, không
//      phải fallback).
//   5. sampleIndexForPresentationTime tra đúng: với mỗi mốc present của
//      sample giữa file, tra ra sample có display time <= mốc và lớn nhất.
// LƯU Ý: check 3 chỉ có nghĩa khi file đầu vào thật sự có B-frame
// (ffprobe has_b_frames > 0); script KHÔNG tự claim B-frame mà đọc từ
// file đã parse — nếu file không có B-frame thì check 3 FAIL đúng nghĩa
// (fixture sai), không được sửa ngưỡng cho qua.
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..", "..", "..");
const file = process.argv[2];
if (!file || !fs.existsSync(file)) { console.error(`dùng: node probe-round37-t6-ctts-node.mjs <proxy.mp4> (thiếu file: ${file})`); process.exit(2); }
const SCRATCH = process.env.T6_SCRATCH || path.join(os.homedir(), "workspace", "tmp-round37-t6", "wc-node");
fs.mkdirSync(SCRATCH, { recursive: true });
const ESBUILD = path.join(REPO, "node_modules", ".bin", "esbuild");
const out = path.join(SCRATCH, "mp4Demux.mjs");
execSync(`"${ESBUILD}" "${path.join(REPO, "apps/web/src/lib/mp4Demux.ts")}" --format=esm --target=es2022 --outfile="${out}"`, { stdio: "pipe" });
const { parseMp4VideoTrack, presentOrderFor, sampleIndexForPresentationTime, displayTimestampUnits } = await import(pathToFileURL(out).href);
const bytes = fs.readFileSync(file);
const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
const track = parseMp4VideoTrack(buf);
const s = track.samples;
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log(`  PASS: ${m}`); } else { fail++; console.error(`  FAIL: ${m}`); } };
console.log(`file: ${file} (${bytes.length} byte) ${track.width}x${track.height} ${track.codec} samples=${s.length} timescale=${track.timescale}`);
const order = presentOrderFor(s);
ok(new Set(order).size === s.length && order.every((i) => i >= 0 && i < s.length), `presentOrder là hoán vị (n=${order.length}, unique=${new Set(order).size})`);
let mono = true;
for (let i = 0; i + 1 < order.length; i++) if (s[order[i + 1]].presentationTimestamp < s[order[i]].presentationTimestamp) mono = false;
ok(mono, "presentOrder đơn điệu không giảm theo presentationTimestamp");
let nonzero = 0, decreases = 0;
for (let i = 0; i < s.length; i++) if (s[i].presentationTimestamp !== s[i].timestamp) nonzero++;
for (let i = 0; i + 1 < s.length; i++) if (s[i + 1].presentationTimestamp < s[i].presentationTimestamp) decreases++;
console.log(`  cttsNonzero=${nonzero} presentDecreasesInDecodeOrder=${decreases}`);
ok(nonzero > 0, `có sample ctts khác 0 (nonzero=${nonzero})`);
ok(decreases > 0, `present giảm trong thứ tự decode (decreases=${decreases}, bằng chứng B-frame reorder)`);
const naiveDesc = s.map((_, i) => s.length - 1 - i);
ok(order.some((v, i) => v !== naiveDesc[i]), "presentOrder khác thứ tự index giảm dần mù");
const toSec = (u) => track.timescale > 0 ? u / track.timescale : 0;
let lookupOk = 0, lookupTotal = 0;
for (const idx of [Math.floor(s.length / 4), Math.floor(s.length / 2), s.length - 2]) {
  const t = toSec(displayTimestampUnits(track, s[idx]));
  const got = sampleIndexForPresentationTime(track, t);
  lookupTotal++;
  if (got === idx) lookupOk++;
  else console.error(`  lookup lệch: mốc của sample ${idx} (${t.toFixed(4)}s) -> ${got}`);
}
ok(lookupOk === lookupTotal, `sampleIndexForPresentationTime đúng ${lookupOk}/${lookupTotal} mốc giữa file`);
console.log(`KẾT QUẢ: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
