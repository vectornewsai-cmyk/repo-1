#!/usr/bin/env node
/**
 * r79g5-merge-noisefix.mjs — Phase 9 đợt 79, luồng G5: gộp snapshot noise
 * đã chụp lại (media v2 tĩnh) vào 3 file snaps gốc.
 *
 * Lý do: media noise v1 (nullsrc + noise temporal) chụp sai khung
 * (preview 12,67 vs render 28,53; D3 đọc nhầm element) nên toàn bộ hàng
 * noise/noise640 trong 3 run đầu là rác. Media v2 (1 khung noise tĩnh,
 * seed 79, faststart) đã chụp lại đúng khung (plain 126,98 vs render
 * 126,37; D3 hash riêng 77c66bef/e099097d, 4/4 pass mỗi run). Script này
 * thay đúng 2 key (snaps.noise[.640] + rawFrames.noise[.640]) trong file
 * gốc bằng bản chụp lại, giữ nguyên mọi nội dung khác; backup file gốc
 * thành *.bak-v1.json trong cùng thư mục headed (hidden_files, không stage).
 * Chạy (từ gốc repo): node apps/web/scripts/r79g5-merge-noisefix.mjs
 * KHÔNG push/tag/binary. Không sửa code production.
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const G5 = path.join(GOAL, "round79-g5");

const JOBS = [
  { orig: "headed-w2560x1440-p1280x720/r79g5-snaps-w2560x1440-p1280x720.json",
    fix: "headed-w2560x1440-p1280x720-noisefix/r79g5-snaps-w2560x1440-p1280x720.json",
    content: "noise" },
  { orig: "headed-w1920x1080-p1280x720/r79g5-snaps-w1920x1080-p1280x720.json",
    fix: "headed-w1920x1080-p1280x720-noisefix/r79g5-snaps-w1920x1080-p1280x720.json",
    content: "noise" },
  { orig: "headed-w2560x1440-p640x360/r79g5-snaps-w2560x1440-p640x360.json",
    fix: "headed-w2560x1440-p640x360-noisefix/r79g5-snaps-w2560x1440-p640x360.json",
    content: "noise640" },
];

function main() {
  for (const j of JOBS) {
    const origPath = path.join(G5, j.orig);
    const fixPath = path.join(G5, j.fix);
    const orig = JSON.parse(fs.readFileSync(origPath, "utf8"));
    const fix = JSON.parse(fs.readFileSync(fixPath, "utf8"));
    if (!orig.snaps[j.content]) throw new Error(`file gốc thiếu snaps.${j.content}: ${j.orig}`);
    if (!fix.snaps[j.content]) throw new Error(`file fix thiếu snaps.${j.content}: ${j.fix}`);
    const before = orig.snaps[j.content].plain.mean;
    const after = fix.snaps[j.content].plain.mean;
    const rawBefore = orig.rawFrames[j.content].plain.hash;
    const rawAfter = fix.rawFrames[j.content].plain.hash;
    fs.copyFileSync(origPath, origPath.replace(/\.json$/, ".bak-v1.json"));
    orig.snaps[j.content] = fix.snaps[j.content];
    orig.rawFrames[j.content] = fix.rawFrames[j.content];
    writeFileEpermRetry(origPath, JSON.stringify(orig, null, 2));
    console.log(`${j.content} @ ${path.basename(j.orig)}: plain mean ${before} → ${after}; rawHash ${rawBefore} → ${rawAfter} (backup *.bak-v1.json)`);
  }
  console.log("XONG — đã gộp 3 file snaps (noise v2).");
}
main();
