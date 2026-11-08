/**
 * recordPackMedia61R5.test.ts — Phase 9 đợt 61, luồng R5: timeout cho
 * recordPackMedia (đóng nợ đợt 60 §5.5 Q10 §4.4).
 *
 * Vấn đề Q10 để lại: `create()` / `makeTts()` trong TemplatePackModal chặn
 * đóng modal khi busy/ttsBusy, nhưng `recordPackMedia` không có timeout —
 * nếu MediaRecorder `onstop` không bao giờ fire (chưa từng quan sát, nhưng
 * không có gì đảm bảo), `await done` treo vĩnh viễn → modal kẹt tới reload.
 * Đợt này thêm timeout: quá hạn thì dừng recorder (nếu còn ghi), ném
 * `RecordPackTimeoutError` → `generatePackFiles` đổi thành
 * `PackError("RECORD_TIMEOUT")` → modal báo lỗi rõ bằng key mới
 * `pack.recordTimeout` + `finally` mở khóa busy (Escape/✕/backdrop lại
 * hoạt động). Không có code giả: timeout đo bằng mock MediaRecorder thật
 * (onstop không fire) + đồng hồ thật.
 *
 * Chạy (mẫu các test Node khác trong repo):
 *   ./node_modules/.bin/esbuild apps/web/src/lib/recordPackMedia61R5.test.ts \
 *     --bundle --platform=node --format=cjs --outfile=/tmp/round61-r5/r5.test.cjs \
 *     && node /tmp/round61-r5/r5.test.cjs
 * Test KHÔNG cần DOM thật: mock document/MediaRecorder/requestAnimationFrame
 * bằng globalThis trước khi gọi (sampleMedia chỉ chạm các global đó trong
 * thân hàm, không chạm lúc import).
 */
import * as fs from "node:fs";
import * as path from "node:path";
// Namespace import + kiểm tra runtime (để chạy đỏ-trước được: trước sửa,
// recordPackMediaTimeoutMs / RecordPackTimeoutError chưa tồn tại nhưng file
// test vẫn chạy và báo fail từng check thay vì crash lúc import).
import * as sampleMedia from "./sampleMedia";

// KHÔNG dùng __dirname (sau esbuild bundle nó trỏ về thư mục output /tmp).
// Theo quy ước test tĩnh trong repo: giải quyết từ process.cwd(), chạy từ
// gốc repo (ứng cử viên thứ 2 phòng khi cwd đã là apps/web).
function resolveFromCwd(...parts: string[]): string {
  const candidates = [
    path.resolve(process.cwd(), ...parts),
    path.resolve(process.cwd(), ...parts.slice(2)),
  ];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  return candidates[0];
}
const SRC = resolveFromCwd("apps", "web", "src", "lib", "sampleMedia.ts");
const PACK_SRC = resolveFromCwd("apps", "web", "src", "lib", "templatePack.ts");
const MODAL_SRC = resolveFromCwd(
  "apps",
  "web",
  "src",
  "components",
  "onboarding",
  "TemplatePackModal.tsx",
);
const FRAGMENT = path.resolve(
  process.env.HOME || "~",
  "workspace",
  "goals",
  "capcut-clone-video-editor",
  "hidden_files",
  "round61-r5-fragment.json",
);

let passed = 0;
let failed = 0;
const failures: string[] = [];
function check(name: string, ok: boolean, detail = "") {
  if (ok) {
    passed++;
    console.log(`PASS ${name}${detail ? " — " + detail : ""}`);
  } else {
    failed++;
    failures.push(name);
    console.log(`FAIL ${name}${detail ? " — " + detail : ""}`);
  }
}

// ---------- Mock trình duyệt (đủ cho recordPackMedia) ----------
let fireOnStop = true;

class FakeRecorder {
  static instances: FakeRecorder[] = [];
  static isTypeSupported(_m: string) {
    return true;
  }
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  state: "inactive" | "recording" = "inactive";
  stopCalls = 0;
  constructor(
    _stream: unknown,
    _opts?: unknown,
  ) {
    FakeRecorder.instances.push(this);
  }
  start() {
    this.state = "recording";
  }
  stop() {
    // Giống MediaRecorder thật: stop() khi đã inactive thì throw.
    if (this.state !== "recording") {
      throw new DOMException(
        "Failed to execute 'stop' on 'MediaRecorder': The MediaRecorder's recording state is expected to be 'recording'.",
        "InvalidStateError",
      );
    }
    this.stopCalls++;
    this.state = "inactive";
    if (fireOnStop) {
      this.ondataavailable?.({
        data: new Blob(["fake-frame-bytes"], { type: "video/webm" }),
      });
      this.onstop?.();
    }
  }
}

function fakeCtx(): Record<string, unknown> {
  const grad = { addColorStop() {} };
  return new Proxy(
    {},
    {
      get(_t, prop) {
        if (prop === "createLinearGradient") return () => grad;
        return () => {};
      },
      set() {
        return true;
      },
    },
  );
}

function installBrowserMocks() {
  (globalThis as Record<string, unknown>).document = {
    createElement: (tag: string) => {
      if (tag !== "canvas") return {};
      return {
        width: 0,
        height: 0,
        getContext: () => fakeCtx(),
        toDataURL: () => "data:image/jpeg;base64,AAAA",
        captureStream: () => ({ id: "fake-stream" }),
      };
    },
  };
  (globalThis as Record<string, unknown>).MediaRecorder =
    FakeRecorder as unknown as typeof MediaRecorder;
  (globalThis as Record<string, unknown>).requestAnimationFrame = (
    cb: (t: number) => void,
  ) => setTimeout(() => cb(performance.now()), 16) as unknown as number;
}

function resetMocks() {
  FakeRecorder.instances = [];
  fireOnStop = true;
}

/** Chạy 1 promise với giới hạn test-level: không settle trong hạn → fail. */
async function withGuard<T>(
  p: Promise<T>,
  ms: number,
  label: string,
): Promise<
  | { settled: true; value: T }
  | { settled: true; error: unknown }
  | { settled: false }
> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const guard = new Promise<{ settled: false }>((resolve) => {
    timer = setTimeout(() => resolve({ settled: false as const }), ms);
  });
  const out = await Promise.race([
    p.then(
      (value) => ({ settled: true as const, value }),
      (error: unknown) => ({ settled: true as const, error }),
    ),
    guard,
  ]);
  if (timer !== undefined) clearTimeout(timer);
  if (!out.settled) console.log(`  (guard: ${label} không settle trong ${ms}ms)`);
  return out;
}

async function main() {
  installBrowserMocks();
  const sampleSrc = fs.readFileSync(SRC, "utf8");
  const packSrc = fs.readFileSync(PACK_SRC, "utf8");
  const modalSrc = fs.readFileSync(MODAL_SRC, "utf8");

  // T1 — công thức timeout mặc định: đủ lâu cho ghi realtime + onstop,
  // nhưng có chặn trên (pack 5s → 20s, 6s → 21s, 30s → 45s).
  {
    const fn = (sampleMedia as Record<string, unknown>)
      .recordPackMediaTimeoutMs as
      | ((seconds: number) => number)
      | undefined;
    if (typeof fn !== "function") {
      check("T1 timeout mặc định = max(20s, (seconds+15)s)", false, "recordPackMediaTimeoutMs chưa tồn tại");
    } else {
      const got = [fn(5), fn(6), fn(30), fn(0)];
      check(
        "T1 timeout mặc định = max(20s, (seconds+15)s)",
        got[0] === 20000 && got[1] === 21000 && got[2] === 45000 && got[3] === 20000,
        `5s→${got[0]}ms, 6s→${got[1]}ms, 30s→${got[2]}ms, 0s→${got[3]}ms`,
      );
    }
  }

  // T2 — onstop KHÔNG fire → recordPackMedia ném RecordPackTimeoutError
  // trong thời gian có chặn (không treo vĩnh viễn như trước sửa).
  {
    resetMocks();
    fireOnStop = false;
    const t0 = Date.now();
    const r = await withGuard(
      sampleMedia.recordPackMedia("t.webm", "16:9", 5, 0, "L", {
        timeoutMs: 300,
      }),
      5000,
      "recordPackMedia timeout 300ms",
    );
    const wall = Date.now() - t0;
    const Cls = (sampleMedia as Record<string, unknown>).RecordPackTimeoutError as
      | (new (ms: number) => Error & { timeoutMs?: number })
      | undefined;
    const err = r.settled && "error" in r ? r.error : undefined;
    const isTimeoutErr =
      err instanceof Error &&
      (err.name === "RecordPackTimeoutError" ||
        (typeof Cls === "function" && err instanceof Cls));
    const timeoutMsOk =
      err instanceof Error &&
      ((err as { timeoutMs?: number }).timeoutMs === 300 ||
        /300/.test(err.message));
    const stopAttempted =
      FakeRecorder.instances.length > 0 &&
      FakeRecorder.instances[0].stopCalls >= 1;
    check(
      "T2 onstop không fire → ném RecordPackTimeoutError(timeoutMs=300) trong <3s + đã thử rec.stop()",
      r.settled && "error" in r && isTimeoutErr && timeoutMsOk && wall < 3000 && stopAttempted,
      !r.settled
        ? "treo quá 5000ms (trước sửa: await done không timeout)"
        : "error" in r
          ? `name=${err instanceof Error ? err.name : String(err)}, wall=${wall}ms, stopCalls=${FakeRecorder.instances[0]?.stopCalls ?? "?"}`
          : `resolve thay vì reject (cần throw, không return null), value=${JSON.stringify("value" in r ? r.value : undefined)?.slice(0, 80)}`,
    );
  }

  // T3 — đường bình thường không đổi: onstop fire → trả File webm có dữ liệu.
  {
    resetMocks();
    fireOnStop = true;
    const r = await withGuard(
      sampleMedia.recordPackMedia("ok.webm", "16:9", 0.2, 0, "L", { timeoutMs: 10000 }),
      8000,
      "recordPackMedia bình thường 0.2s",
    );
    if (!r.settled) {
      check("T3 onstop fire → trả File webm (đường bình thường không đổi)", false, "không settle trong 8000ms");
    } else {
      const v = ("value" in r ? r.value : undefined) as { file?: File; thumb?: string } | null | undefined;
      check(
        "T3 onstop fire → trả File webm (đường bình thường không đổi)",
        !!v && v.file instanceof File && v.file.name === "ok.webm" && v.file.type === "video/webm" && v.file.size > 0 && typeof v.thumb === "string",
        v ? `name=${v.file?.name} type=${v.file?.type} size=${v.file?.size}` : "null",
      );
    }
  }

  // T4 — thiếu MediaRecorder → vẫn null như cũ (không throw timeout).
  {
    resetMocks();
    const saved = (globalThis as Record<string, unknown>).MediaRecorder;
    (globalThis as Record<string, unknown>).MediaRecorder = undefined;
    const r = await withGuard(
      sampleMedia.recordPackMedia("n.webm", "16:9", 1, 0, "L", { timeoutMs: 2000 }),
      5000,
      "recordPackMedia thiếu MediaRecorder",
    );
    (globalThis as Record<string, unknown>).MediaRecorder = saved;
    const v4 = "value" in r ? r.value : undefined;
    check(
      "T4 thiếu MediaRecorder → null (không throw timeout)",
      r.settled && v4 === null,
      r.settled ? `value=${String(v4)}` : "treo",
    );
  }

  // T5 — tĩnh: sampleMedia.ts đua timeout với done + thử stop() khi timeout.
  check(
    "T5 sampleMedia.ts: Promise.race(done, timeout) + stop() khi timeout",
    /Promise\.race/.test(sampleSrc) &&
      /RecordPackTimeoutError/.test(sampleSrc) &&
      /rec\.state === "recording"/.test(sampleSrc) &&
      /timeoutMs/.test(sampleSrc),
    "thiếu race/timeout/stop-guard thì fail",
  );

  // T6 — tĩnh: generatePackFiles đổi timeout thành PackError RECORD_TIMEOUT.
  check(
    "T6 templatePack.ts: RecordPackTimeoutError → PackError(\"RECORD_TIMEOUT\")",
    /RecordPackTimeoutError/.test(packSrc) && /RECORD_TIMEOUT/.test(packSrc),
    "thiếu mapping thì fail",
  );

  // T7 — tĩnh: modal báo lỗi timeout bằng key mới + finally vẫn mở khóa busy.
  check(
    "T7 TemplatePackModal: RECORD_TIMEOUT → ot(\"pack.recordTimeout\"), finally reset busy",
    /RECORD_TIMEOUT/.test(modalSrc) &&
      /pack\.recordTimeout/.test(modalSrc) &&
      /finally\s*\{[\s\S]*?setBusy\(false\)/.test(modalSrc),
    "thiếu nhánh lỗi timeout thì fail",
  );

  // T8 — fragment i18n: key pack.recordTimeout có cả vi + en, khác nhau, không rỗng.
  {
    let ok = false;
    let detail = "";
    try {
      const frag = JSON.parse(fs.readFileSync(FRAGMENT, "utf8")) as Record<
        string,
        Record<string, Record<string, string>>
      >;
      const vi = frag?.vi?.pack?.recordTimeout;
      const en = frag?.en?.pack?.recordTimeout;
      ok =
        typeof vi === "string" && vi.trim().length > 0 &&
        typeof en === "string" && en.trim().length > 0 && vi !== en;
      detail = `vi=${JSON.stringify(vi)} en=${JSON.stringify(en)}`;
    } catch (e) {
      detail = `không đọc được fragment: ${(e as Error).message}`;
    }
    check("T8 fragment: pack.recordTimeout có vi + en, khác nhau, không rỗng", ok, detail);
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) console.log(`FAILED: ${failures.join("; ")}`);
  process.exitCode = failed > 0 ? 1 : 0;
}

main().catch((e) => {
  console.error("HARNESS LỖI:", e);
  process.exitCode = 2;
});
