#!/usr/bin/env node
/**
 * cdpRendererWatchdog67U5.mjs — Watchdog cho probe headed dùng CDP
 * (Phase 9 đợt 67, luồng U5; nợ docs/PHASE9_ROUND66_LIMITS.md §8 mục 5).
 *
 * Bối cảnh: probe headed đợt 66 T6 lần 1 TREO sau phase A — renderer của
 * trang probe không đáp CDP (kể cả `Runtime.evaluate 1+1` sau 60 s),
 * CPU ~0, thread chờ ở `futex_do_wait`; runner vẫn poll vô hạn (tới khi
 * luồng bị kill tay ở t≈1277 s+) mà không ghi chẩn đoán nào, và file
 * partial lần 1 còn bị lần 2 ghi đè (cùng tên file trong cùng scratch).
 * Runner mới (runHeaded67U5.mjs) dùng module này để:
 *   1. Heartbeat CDP mỗi lần poll (`Runtime.evaluate("1+1")`, timeout
 *      60 s): 3 lần lỗi LIÊN TIẾP → coi renderer đã đóng băng.
 *   2. Khi đóng băng: thu thập chẩn đoán (trạng thái /proc của Chrome +
 *      renderer, wchan từng thread, cây tiến trình, loadavg, bộ nhớ,
 *      dmesg OOM) rồi gọi onFrozen — runner kill Chrome + exit 3 thay
 *      vì poll treo vô hạn.
 *   3. Phân biệt "renderer đóng băng" với "cả Chrome chết": kiểm tra
 *      browser-level `http://127.0.0.1:<debugPort>/json/list` — còn đáp
 *      mà page không đáp → renderer-frozen; cả hai đều chết → browser-dead.
 *
 * Module thuần Node, không phụ thuộc repo: phần lõi
 * (`createRendererWatchdog`) nhận heartbeat/collect/onFrozen inject được
 * nên test bằng `node --test` không cần Chrome thật.
 *
 * Chạy test: node --test apps/web/scripts/cdpRendererWatchdog67U5.test.mjs
 */
import fs from "node:fs";
import { spawnSync } from "node:child_process";

/** Số lần heartbeat lỗi liên tiếp thì kết luận renderer đóng băng. */
export const DEFAULT_MAX_CONSECUTIVE_HEARTBEAT_FAILURES = 3;
/** Timeout 1 lần heartbeat CDP (đợt 66: `1+1` sau 60 s vẫn không đáp). */
export const DEFAULT_HEARTBEAT_TIMEOUT_MS = 60_000;

/**
 * Watchdog đếm lỗi heartbeat liên tiếp. `onFrozen(report)` chỉ gọi đúng
 * 1 lần (lần đầu chạm ngưỡng); các lần lỗi sau đó không gọi lại.
 * `collectDiagnostics` có thể ném lỗi — watchdog vẫn báo frozen với
 * `diagnosticsError` thay vì throw (runner phải thoát có chẩn đoán).
 */
export function createRendererWatchdog(opts = {}) {
  const maxFailures = opts.maxConsecutiveFailures ?? DEFAULT_MAX_CONSECUTIVE_HEARTBEAT_FAILURES;
  const collect = opts.collectDiagnostics ?? (() => ({}));
  const onFrozen = opts.onFrozen ?? (() => {});
  let consecutiveFailures = 0;
  let frozen = false;
  let frozenReport = null;
  let lastFailureAt = null;
  let lastFailureError = null;
  return {
    recordSuccess() {
      consecutiveFailures = 0;
      lastFailureError = null;
      return { frozen, consecutiveFailures };
    },
    recordFailure(error) {
      if (frozen) return { frozen: true, report: frozenReport };
      consecutiveFailures += 1;
      lastFailureAt = new Date().toISOString();
      lastFailureError = error instanceof Error ? error.message : String(error ?? "unknown");
      if (consecutiveFailures < maxFailures) {
        return { frozen: false, consecutiveFailures };
      }
      frozen = true;
      let diagnostics = null;
      let diagnosticsError = null;
      try {
        diagnostics = collect();
      } catch (e) {
        diagnosticsError = e instanceof Error ? e.message : String(e ?? "unknown");
      }
      frozenReport = {
        verdict: "renderer-frozen",
        consecutiveFailures,
        maxFailures,
        lastFailureAt,
        lastFailureError,
        diagnostics,
        diagnosticsError,
      };
      try {
        onFrozen(frozenReport);
      } catch {
        // onFrozen lỗi không được làm hỏng đường thoát của runner.
      }
      return { frozen: true, report: frozenReport };
    },
    state() {
      return { frozen, consecutiveFailures, maxFailures, lastFailureAt, lastFailureError };
    },
  };
}

/** Đọc file best-effort: lỗi → null (không throw). */
function readFileOrNull(path) {
  try {
    return fs.readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

/**
 * Chẩn đoán Chrome đang chạy (best-effort, không throw):
 *   - chrome: /proc/<pid>/{stat,status,wchan} + cmdline.
 *   - renderer: CHỈ các tiến trình con/cháu của chromePid có cmdline
 *     chứa `--type=renderer` (lấy từ `ps`, đối chiếu ppid) — KHÔNG quét
 *     toàn hệ thống vì nhiều probe có thể chạy song song (mỗi cái 1
 *     Chrome riêng; quét chung sẽ trộn renderer của luồng khác).
 *     chromePid null → renderers rỗng (không quy được về Chrome nào).
 *     Mỗi renderer: stat/status/wchan + wchan từng thread
 *     (/proc/<pid>/task/<tid>/wchan) — thread nào đang futex_wait là lộ.
 *     LƯU Ý: `futex_do_wait` cũng là wchan BÌNH THƯỜNG của thread
 *     renderer đang chờ việc (quan sát trên probe khác đang chạy) —
 *     một mình nó KHÔNG chứng minh đóng băng; phải kết hợp với CDP
 *     không đáp + CPU ~0.
 *   - loadavg, meminfo, dmesg tail (OOM/killed).
 */
export function collectChromeDiagnostics({ chromePid = null, debugPort = null } = {}) {
  const out = {
    at: new Date().toISOString(),
    loadavg: readFileOrNull("/proc/loadavg")?.trim() ?? null,
    meminfo: null,
    chrome: null,
    renderers: [],
    psTree: null,
    dmesgTail: null,
  };
  const mem = readFileOrNull("/proc/meminfo");
  if (mem) {
    out.meminfo = Object.fromEntries(
      mem.split("\n").filter((l) => /^(MemTotal|MemFree|MemAvailable|SwapTotal|SwapFree):/.test(l))
        .map((l) => {
          const [k, v] = l.split(":");
          return [k, v?.trim() ?? null];
        }),
    );
  }
  const procOf = (pid) => {
    if (pid === null || pid === undefined) return null;
    return {
      pid,
      stat: readFileOrNull(`/proc/${pid}/stat`),
      status: readFileOrNull(`/proc/${pid}/status`),
      wchan: readFileOrNull(`/proc/${pid}/wchan`),
      cmdline: readFileOrNull(`/proc/${pid}/cmdline`)?.replace(/\0/g, " ").trim() ?? null,
      threads: (() => {
        try {
          return fs.readdirSync(`/proc/${pid}/task`).map((tid) => ({
            tid: Number(tid),
            wchan: readFileOrNull(`/proc/${pid}/task/${tid}/wchan`),
            stat: readFileOrNull(`/proc/${pid}/task/${tid}/stat`),
          }));
        } catch {
          return [];
        }
      })(),
    };
  };
  out.chrome = procOf(chromePid);
  try {
    const ps = spawnSync("ps", ["-eo", "pid,ppid,pcpu,pmem,etime,comm,args"], { encoding: "utf8" });
    out.psTree = ps.status === 0 ? ps.stdout : null;
    if (ps.stdout && chromePid !== null) {
      // Chỉ lấy hậu duệ của chromePid (BFS theo ppid), tránh trộn
      // renderer của probe khác đang chạy song song.
      const rows = ps.stdout.split("\n").slice(1)
        .map((line) => {
          const m = /^\s*(\d+)\s+(\d+)\s+(.*)$/.exec(line);
          return m ? { pid: Number(m[1]), ppid: Number(m[2]), rest: m[3] } : null;
        })
        .filter(Boolean);
      const childrenOf = new Map();
      for (const r of rows) {
        if (!childrenOf.has(r.ppid)) childrenOf.set(r.ppid, []);
        childrenOf.get(r.ppid).push(r.pid);
      }
      const descendants = new Set();
      const queue = [chromePid];
      while (queue.length > 0) {
        const cur = queue.shift();
        for (const ch of childrenOf.get(cur) ?? []) {
          if (!descendants.has(ch)) {
            descendants.add(ch);
            queue.push(ch);
          }
        }
      }
      for (const r of rows) {
        if (descendants.has(r.pid) && r.rest.includes("--type=renderer")) {
          out.renderers.push(procOf(r.pid));
        }
      }
    }
  } catch {
    out.psTree = null;
  }
  try {
    const d = spawnSync("dmesg", ["--time-format=iso", "-T"], { encoding: "utf8" });
    if (d.status === 0 && d.stdout) {
      const lines = d.stdout.split("\n").filter((l) => /oom|killed process|Out of memory/i.test(l));
      out.dmesgTail = lines.slice(-20);
    }
  } catch {
    out.dmesgTail = null;
  }
  void debugPort;
  return out;
}

/**
 * Kiểm tra browser-level CDP còn sống không (phân biệt renderer-frozen
 * với browser-dead): GET /json/list với timeout. Trả
 * `{ alive: true, targets }` hoặc `{ alive: false, error }`.
 */
export async function probeBrowserAlive(debugPort, timeoutMs = 10_000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`, { signal: ctrl.signal });
    const list = await res.json();
    return { alive: true, targets: Array.isArray(list) ? list.length : null };
  } catch (e) {
    return { alive: false, error: e instanceof Error ? e.message : String(e ?? "unknown") };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 1 lần heartbeat CDP: `Runtime.evaluate("1+1")` qua hàm send của caller,
 * race với timeout. Trả `{ ok: true, value }` hoặc `{ ok: false, error }`.
 * Không throw — caller đưa kết quả vào `watchdog.recordSuccess/Failure`.
 */
export async function heartbeatEval(send, timeoutMs = DEFAULT_HEARTBEAT_TIMEOUT_MS) {
  try {
    const value = await Promise.race([
      send("Runtime.evaluate", { expression: "1+1", returnByValue: true }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`heartbeat timeout ${timeoutMs}ms`)), timeoutMs),
      ),
    ]);
    return { ok: true, value: value?.result?.value ?? value };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e ?? "unknown") };
  }
}
