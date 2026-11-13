#!/usr/bin/env node
/**
 * probe93u7-q5-timing-flake.mjs — Phase 9 đợt 93, luồng U7.
 * Đo độ flake THẬT của 2 test timing Q5 trong seek.test.ts dưới tải CPU
 * nặng (nợ Q5 §6 mục 5):
 *  - T1 "seeked tới muộn trong lần gia hạn": sleep(60ms) rồi assert
 *    promise CHƯA resolve (deadline resolve ~120ms = 40 + 2×40). Biên 60ms.
 *  - T2 "timer cháy mà không còn seeking": sleep(180ms) rồi assert promise
 *    ĐÃ resolve (deadline ~100ms, không gia hạn). Biên 80ms.
 * Timer Node dưới tải có thể trễ hơn biên → assert sai → flake. Probe chạy
 * đúng kịch bản test (không sửa test), đếm số lần flake + ghi phân phối
 * độ trễ thực của sleep và của promise.
 *
 * Chạy: node --experimental-strip-types apps/web/scripts/probe93u7-q5-timing-flake.mjs [--reps N] [--load N]
 *   --load N: bật N tiến trình `yes` trong lúc đo (mặc định 0 = không tải).
 * Kết quả: JSON + tóm tắt ra stdout; file ghi vào
 *   hidden_files/round93-u7/q5-timing-flake-<load>.json
 * KHÔNG push/tag/binary. Chỉ đo, không sửa production.
 */
import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { seekElement } from "../src/lib/seek.ts";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const argv = process.argv.slice(2);
const REPS = argv.includes("--reps") ? Number(argv[argv.indexOf("--reps") + 1]) : 30;
const LOAD = argv.includes("--load") ? Number(argv[argv.indexOf("--load") + 1]) : 0;
const OUT_DIR = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round93-u7");
const F61 = 61 / 30;

class MockEl {
  constructor() { this.reported = 0; this.seeking = false; this.sets = []; this.listeners = []; }
  get currentTime() { return this.reported; }
  set currentTime(v) { this.sets.push(v); }
  setReported(v) { this.reported = v; }
  pause() {}
  addEventListener(_t, fn) { this.listeners.push(fn); }
  removeEventListener(_t, fn) { const i = this.listeners.indexOf(fn); if (i >= 0) this.listeners.splice(i, 1); }
  fireSeeked() { const ls = this.listeners; this.listeners = []; this.seeking = false; for (const fn of ls) fn(); }
}

const stats = (a) => {
  if (!a.length) return { n: 0 };
  const s = [...a].sort((x, y) => x - y);
  const med = s[Math.floor(s.length / 2)];
  return { n: s.length, min: s[0], median: med, p90: s[Math.floor(s.length * 0.9)], max: s[s.length - 1] };
};

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const loadProcs = [];
  if (LOAD > 0) {
    for (let i = 0; i < LOAD; i++) loadProcs.push(spawn("yes", [], { stdio: "ignore" }));
    await sleep(2000);
    console.log(`[u7-flake] tải nền BẬT: ${LOAD}x yes | ${execFileSync("sh", ["-c", "uptime; free -m | head -2 | tail -1"], { encoding: "utf8" }).trim().replace(/\n/g, " | ")}`);
  }
  const res = { reps: REPS, load: LOAD, loadavgStart: execFileSync("sh", ["-c", "uptime"], { encoding: "utf8" }).trim(), t1: [], t2: [] };
  try {
    for (let i = 0; i < REPS; i++) {
      // T1: đúng kịch bản test "seeked tới muộn" — sleep(60) rồi assert !resolved.
      {
        const el = new MockEl();
        el.setReported(0);
        el.seeking = true;
        let resolved = false;
        let resolveElapsed = null;
        const t0 = Date.now();
        const p = seekElement(el, F61, { fps: 30, timeoutMs: 40, timeoutExtensions: 2 }).then((r) => { resolved = true; resolveElapsed = Date.now() - t0; return r; });
        const s0 = Date.now();
        await sleep(60);
        const sleepElapsed = Date.now() - s0;
        const flake = resolved; // test assert resolved===false → flake nếu đã resolve
        const resolvedAtCheck = resolved; // CHỤP NGAY — đọc lại sau `await p` luôn là true (bug probe v1)
        await p; // chờ xong rồi mới ghi — resolveElapsed chỉ có sau khi promise settle
        res.t1.push({ rep: i + 1, sleepElapsed, resolvedAtCheck, resolveElapsed });
        if (flake) console.log(`[u7-flake] T1 rep ${i + 1}: FLAKE — sleep thực ${sleepElapsed}ms, promise đã resolve sau ${resolveElapsed}ms (deadline ~120ms)`);
      }
      // T2: đúng kịch bản test "không còn seeking" — sleep(180) rồi assert resolved.
      {
        const el = new MockEl();
        el.setReported(0);
        el.seeking = false;
        let resolved = false;
        let resolveElapsed = null;
        const t0 = Date.now();
        const p = seekElement(el, F61, { fps: 30, timeoutMs: 100, timeoutExtensions: 2 }).then((r) => { resolved = true; resolveElapsed = Date.now() - t0; return r; });
        const s0 = Date.now();
        await sleep(180);
        const sleepElapsed = Date.now() - s0;
        const flake = !resolved; // test assert resolved===true → flake nếu chưa resolve
        const resolvedAtCheck = resolved; // CHỤP NGAY — đọc lại sau `await p` luôn là true (bug probe v1)
        await p; // chờ xong rồi mới ghi — resolveElapsed chỉ có sau khi promise settle
        res.t2.push({ rep: i + 1, sleepElapsed, resolvedAtCheck, resolveElapsed });
        if (flake) console.log(`[u7-flake] T2 rep ${i + 1}: FLAKE — sleep thực ${sleepElapsed}ms, promise resolve sau ${resolveElapsed}ms (deadline ~100ms)`);
      }
    }
  } finally {
    for (const p of loadProcs) { try { p.kill("SIGKILL"); } catch {} }
  }
  res.loadavgEnd = execFileSync("sh", ["-c", "uptime"], { encoding: "utf8" }).trim();
  const t1Flakes = res.t1.filter((r) => r.resolvedAtCheck).length;
  const t2Flakes = res.t2.filter((r) => !r.resolvedAtCheck).length;
  res.summary = {
    t1Flakes, t1FlakeRate: `${t1Flakes}/${REPS}`,
    t1SleepElapsed: stats(res.t1.map((r) => r.sleepElapsed)),
    t1ResolveElapsed: stats(res.t1.map((r) => r.resolveElapsed).filter((v) => v !== null)),
    t2Flakes, t2FlakeRate: `${t2Flakes}/${REPS}`,
    t2SleepElapsed: stats(res.t2.map((r) => r.sleepElapsed)),
    t2ResolveElapsed: stats(res.t2.map((r) => r.resolveElapsed).filter((v) => v !== null)),
  };
  const outFile = path.join(OUT_DIR, `q5-timing-flake-load${LOAD}.json`);
  fs.writeFileSync(outFile, JSON.stringify(res, null, 2));
  console.log(`[u7-flake] reps=${REPS} load=${LOAD}x yes`);
  console.log(`[u7-flake] T1 (sleep60/assert-chưa-resolve, deadline ~120ms): flake ${t1Flakes}/${REPS}; sleep ${JSON.stringify(res.summary.t1SleepElapsed)}; resolve ${JSON.stringify(res.summary.t1ResolveElapsed)}`);
  console.log(`[u7-flake] T2 (sleep180/assert-đã-resolve, deadline ~100ms): flake ${t2Flakes}/${REPS}; sleep ${JSON.stringify(res.summary.t2SleepElapsed)}; resolve ${JSON.stringify(res.summary.t2ResolveElapsed)}`);
  console.log(`[u7-flake] kết quả: ${outFile}`);
  process.exit(t1Flakes + t2Flakes > 0 ? 1 : 0);
}

main().catch((e) => { console.error("PROBE LỖI: " + (e && e.stack || e)); process.exit(2); });
