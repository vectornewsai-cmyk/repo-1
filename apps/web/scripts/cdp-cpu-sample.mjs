#!/usr/bin/env node
/**
 * cdp-cpu-sample.mjs — Chữ ký CPU treo bằng /proc tick-delta
 * (Phase 9 đợt 37, luồng T4; nợ §3.6 đợt 36 của S6).
 *
 * Vấn đề của S6: %cpu trong snapshot treo là ps lifetime-average —
 * tổng CPU từ lúc tiến trình sinh ra chia cho thời gian sống, nên bị
 * pha loãng bởi thời gian page load trước đó và không phân biệt được
 * H1 (promise không settle, renderer rảnh) với H2 (while(true),
 * renderer spin). Lần đo S6: H1 maxCpu 26,2 vs H2 24,3 (lần đầu),
 * 15,5 vs 9,7 (lần xanh) — H2 thậm chí thấp hơn H1.
 *
 * Module này đo ĐÚNG CỬA SỔ TREO: đọc utime+stime của cây tiến trình
 * Chrome (browser pid + mọi descendant qua ppid) từ /proc/<pid>/stat
 * ở đầu và cuối cửa sổ, lấy delta tick chia cho thời gian cửa sổ.
 * Đây là tốc độ CPU tức thời trong cửa sổ, không phải trung bình đời
 * tiến trình. Đơn vị: % của MỘT core (máy nhiều core có thể >100%
 * nếu nhiều tiến trình trong cây cùng chạy; busy-loop một thread cho
 * ~100% của một core).
 *
 * Chỉ đọc /proc, không kill, không sửa gì. Chạy được trên Linux;
 * trên hệ khác readProcStat trả null và sampleCpuTree trả
 * { ok: false, reason } thay vì bịa số.
 *
 * CLK_TCK: lấy bằng `getconf CLK_TCK`, fallback 100 (Linux x86_64).
 * Định dạng /proc/<pid>/stat: pid (comm) state ppid ... utime stime
 * là field 14/15 (đếm từ pid=1, comm=2). Vì comm có thể chứa khoảng
 * trắng/dấu ngoặc nên parse bằng cách cắt ở dấu ')' CUỐI CÙNG, rồi
 * đếm field từ state=3: ppid là token thứ 2 sau ')', utime token
 * thứ 12, stime token thứ 13.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";

export function clkTck() {
  try {
    const r = spawnSync("getconf", ["CLK_TCK"], { encoding: "utf8", timeout: 5000 });
    const v = Number((r.stdout || "").trim());
    if (Number.isFinite(v) && v > 0) return v;
  } catch { /* fallback */ }
  return 100;
}

/** Đọc một /proc/<pid>/stat → { pid, ppid, utime, stime } | null. */
export function readProcStat(pid) {
  let raw;
  try {
    raw = fs.readFileSync(`/proc/${pid}/stat`, "utf8");
  } catch {
    return null;
  }
  const close = raw.lastIndexOf(")");
  if (close < 0) return null;
  const rest = raw.slice(close + 2).trim().split(/\s+/);
  // rest[0]=state(3), rest[1]=ppid(4), ..., rest[11]=utime(14), rest[12]=stime(15)
  if (rest.length < 13) return null;
  const ppid = Number(rest[1]);
  const utime = Number(rest[11]);
  const stime = Number(rest[12]);
  if (!Number.isFinite(ppid) || !Number.isFinite(utime) || !Number.isFinite(stime)) return null;
  return { pid: Number(pid), ppid, utime, stime, ticks: utime + stime };
}

function listProcPids() {
  try {
    return fs.readdirSync("/proc").filter((d) => /^\d+$/.test(d)).map(Number);
  } catch {
    return [];
  }
}

/**
 * Cây tiến trình dưới rootPid (gồm chính nó), qua ppid.
 * @returns {{pids: number[], perPid: Map<number, number>}} perPid: pid → ticks
 */
export function readTreeTicks(rootPid) {
  const stats = new Map();
  for (const pid of listProcPids()) {
    const s = readProcStat(pid);
    if (s) stats.set(pid, s);
  }
  const children = new Map();
  for (const s of stats.values()) {
    if (!children.has(s.ppid)) children.set(s.ppid, []);
    children.get(s.ppid).push(s.pid);
  }
  const pids = [];
  const perPid = new Map();
  const queue = [Number(rootPid)];
  const seen = new Set();
  while (queue.length) {
    const pid = queue.shift();
    if (seen.has(pid)) continue;
    seen.add(pid);
    const s = stats.get(pid);
    if (!s) continue; // tiến trình đã chết giữa chừng → bỏ qua, không throw
    pids.push(pid);
    perPid.set(pid, s.ticks);
    for (const c of children.get(pid) || []) queue.push(c);
  }
  return { pids, perPid };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Lấy mẫu CPU của cây tiến trình trong cửa sổ windowMs.
 * @returns {Promise<{ok: boolean, rootPid, windowMs, windowSec, clkTck,
 *   deltaTicks, cpuPctOneCore, pidsBefore, pidsAfter, topPid: {pid, deltaTicks, cpuPctOneCore}|null,
 *   perPidDelta: Array<{pid, deltaTicks}>, reason?: string}>}
 */
export async function sampleCpuTree(rootPid, windowMs) {
  const tck = clkTck();
  const before = readTreeTicks(rootPid);
  if (before.pids.length === 0) {
    return { ok: false, rootPid, windowMs, reason: `không đọc được cây tiến trình của pid ${rootPid} (đã chết hoặc không phải Linux)` };
  }
  const t0 = Date.now();
  await sleep(windowMs);
  const after = readTreeTicks(rootPid);
  const wallSec = (Date.now() - t0) / 1000;
  let deltaTicks = 0;
  const perPidDelta = [];
  for (const [pid, ticksAfter] of after.perPid) {
    const ticksBefore = before.perPid.get(pid) ?? 0;
    const d = ticksAfter - ticksBefore;
    if (d > 0) {
      deltaTicks += d;
      perPidDelta.push({ pid, deltaTicks: d });
    }
  }
  perPidDelta.sort((a, b) => b.deltaTicks - a.deltaTicks);
  const cpuPctOneCore = wallSec > 0 ? (deltaTicks / tck / wallSec) * 100 : 0;
  const top = perPidDelta.length
    ? { pid: perPidDelta[0].pid, deltaTicks: perPidDelta[0].deltaTicks, cpuPctOneCore: (perPidDelta[0].deltaTicks / tck / wallSec) * 100 }
    : null;
  return {
    ok: true, rootPid, windowMs, windowSec: wallSec, clkTck: tck,
    deltaTicks, cpuPctOneCore, pidsBefore: before.pids, pidsAfter: after.pids,
    topPid: top, perPidDelta,
  };
}
