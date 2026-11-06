#!/usr/bin/env node
/**
 * cpu-gate-quiet-then-u4-41w6.mjs — Nối runner quiet W6 với probe U4
 * Ở MỨC ĐIỀU PHỐI (wrapper), KHÔNG sửa file U4, KHÔNG đổi verdict U4.
 *
 * Vì sao nối kiểu này (xem LIMITS W6 §4): probe U4 có ngữ nghĩa thoát
 * đã ghi trước (0 = allPass, 1 = fail) và LIMITS riêng; chèn cổng từ
 * chối vào trong U4 sẽ đổi nghĩa của một lượt U4 (fail vì ngưỡng vs
 * không-chạy vì máy bận). Wrapper này giữ U4 nguyên vẹn: nó chỉ chạy
 * U4 khi runner --gate-only xác nhận máy yên; khi máy bận thì U4
 * KHÔNG ĐƯỢC CHẠY (không có verdict U4 nào trong lượt đó — đó chính
 * là điểm cần bảo vệ: không tạo dữ liệu under-load rồi đọc như fail
 * ngưỡng). Mã thoát của wrapper = mã của U4 khi U4 chạy, = 2 khi
 * cổng từ chối, = 1 khi runner lỗi.
 *
 * Chạy (từ gốc repo):
 *   node apps/web/scripts/cpu-gate-quiet-then-u4-41w6.mjs [--gate-out <json>]
 * Biến môi trường U4_* (U4_CDP_PORT, U4_CHROME) được truyền thẳng sang U4.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPTS_DIR = path.dirname(fileURLToPath(import.meta.url));
const RUNNER = path.join(SCRIPTS_DIR, "cpu-gate-quiet-runner-41w6.mjs");
const U4 = path.join(SCRIPTS_DIR, "clicktest-u4-round38-cpu-calibration-probe.mjs");

function run(cmd, args) {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { stdio: "inherit", env: process.env });
    p.on("exit", (code) => resolve(code ?? 1));
    p.on("error", () => resolve(1));
  });
}

async function main() {
  const argv = process.argv.slice(2);
  let gateOut = "/tmp/round41-w6/wrapper-gate.json";
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--gate-out") gateOut = argv[++i];
  }
  console.log("[W6 wrapper] bước 1/2: runner quiet --gate-only…");
  const gateCode = await run(process.execPath, [RUNNER, "--gate-only", "--out", gateOut]);
  if (gateCode === 2) {
    // Đợt 42 X6: đọc report cổng để nêu đúng gate trượt đầu tiên
    // (RAM trước CPU load; busy chưa được hỏi) thay vì chỉ in dòng
    // chung chung. Đọc lỗi thì giữ dòng cũ làm fallback.
    let firstLine = "";
    try {
      const gateReport = JSON.parse(fs.readFileSync(gateOut, "utf8"));
      if (gateReport?.gate?.firstFailedGate) {
        firstLine = ` trượt đầu tiên — ${gateReport.gate.firstFailure} (gate: ${gateReport.gate.firstFailedGate}).`;
      }
    } catch {}
    console.log(`[W6 wrapper] CHƯA KHÓA — máy bận/under-load:${firstLine} U4 KHÔNG ĐƯỢC CHẠY trong lượt này (không có verdict U4, không tạo dữ liệu under-load).`);
    process.exit(2);
  }
  if (gateCode !== 0) {
    console.error(`[W6 wrapper] runner lỗi (exit ${gateCode}); U4 không chạy.`);
    process.exit(1);
  }
  console.log("[W6 wrapper] bước 2/2: cổng yên — chạy probe U4 (verdict của U4 giữ nguyên)…");
  const u4Code = await run(process.execPath, [U4]);
  console.log(`[W6 wrapper] U4 exit ${u4Code} (verdict nguyên vẹn của U4; wrapper không sửa, không khóa).`);
  process.exit(u4Code);
}

main().catch((e) => {
  console.error("WRAPPER LỖI:", e.message);
  process.exit(1);
});
