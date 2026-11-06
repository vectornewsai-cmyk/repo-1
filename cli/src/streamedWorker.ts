/**
 * streamedWorker.ts — chạy worker/script con ở chế độ stream có redact
 * (Phase 9 đợt 31, luồng N3).
 *
 * Áp đúng mẫu đợt 30 M3 của `runWorkerStreamed` trong
 * `commands/render.ts` cho các lệnh CLI còn lại (caption, tts) — KHÔNG
 * phát minh mẫu mới, chỉ tách tham số để dùng chung:
 *  - `stdio: ["ignore", "inherit", "pipe"]` — stdout con giữ inherit
 *    như trước (log tiến trình), chỉ stderr bị pipe.
 *  - stderr stream theo thời gian thực: tách dòng theo `\n` HOẶC `\r`
 *    (ffmpeg/progress in bằng `\r`), mỗi dòng qua `redactWorkerLine`
 *    (chuẩn redact canonical của bridge) rồi mới in ra
 *    `process.stderr`, giữ nguyên delimiter gốc để hành vi terminal
 *    (ghi đè dòng progress) không đổi. Dòng sau redact thành rỗng
 *    (stack trace) thì bỏ hẳn, không in dòng trống.
 *  - Chunk UTF-8 bị cắt giữa chừng được `StringDecoder` xử lý; phần
 *    dòng dở dang cuối chunk giữ lại chờ chunk sau.
 *  - Đồng thời tích lũy bản thô, cắt đuôi 256KB (đủ cho lỗi có cấu
 *    trúc khi fail; tránh phình bộ nhớ với log dài) — caller hiện
 *    chưa dùng bản tích lũy này ngoài việc giữ hành vi, vì thông điệp
 *    lỗi của caption/tts vốn chỉ mang mã exit (xem chú thích ở
 *    caller); log đầy đủ đã stream ra terminal theo thời gian thực.
 *  - Timeout: hết giờ → SIGKILL + `error` timeout (status khi đó là
 *    null do bị kill, giống hệt `spawnSync` cũ khi timeout: status
 *    null → caller báo `exit null`).
 *
 * KHÔNG đổi: mã exit/signal của tiến trình con được trả nguyên về
 * caller (caller tự quyết định thông điệp lỗi, giữ nguyên định dạng
 * cũ `… thất bại (exit <status>)` → process exit 1 qua handler
 * CliError ở index.ts, như trước). caption/tts không có cờ -q nên
 * không có nhánh quiet nào cần giữ — toàn bộ stderr của chúng nay
 * đều qua pipe + redact, thay cho `stdio: "inherit"` trước đây.
 * Cố tình KHÔNG chạm render.ts: `runWorkerStreamed` của render giữ
 * nguyên, tránh hồi quy đường render đã kiểm chứng ở đợt 30.
 */
import { spawn } from "node:child_process";
import { StringDecoder } from "node:string_decoder";
import { redactWorkerLine } from "./renderErrors.js";

export interface StreamedRunResult {
  status: number | null;
  signal: NodeJS.Signals | null;
  stderr: string;
  error: Error | null;
}

const CAPTURED_TAIL_CHARS = 256 * 1024;

export function runStreamed(
  command: string,
  args: string[],
  timeoutMs: number,
  timeoutLabel: string
): Promise<StreamedRunResult> {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "inherit", "pipe"],
    });
    const decoder = new StringDecoder("utf8");
    let pending = "";
    let captured = "";
    let spawnError: Error | null = null;
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      spawnError = new Error(`${timeoutLabel} quá thời gian ${Math.round(timeoutMs / 60000)} phút (timeout)`);
      child.kill("SIGKILL");
    }, timeoutMs);
    const pushCaptured = (text: string) => {
      captured += text;
      if (captured.length > CAPTURED_TAIL_CHARS) {
        captured = captured.slice(-CAPTURED_TAIL_CHARS);
      }
    };
    const flushLine = (line: string, delimiter: string) => {
      const redacted = redactWorkerLine(line);
      if (redacted) process.stderr.write(redacted + delimiter);
    };
    child.stderr.on("data", (chunk: Buffer) => {
      const text = decoder.write(chunk);
      pushCaptured(text);
      pending += text;
      let m: RegExpExecArray | null;
      const lineRe = /^([^\r\n]*)([\r\n])/;
      while ((m = lineRe.exec(pending)) !== null) {
        flushLine(m[1], m[2]);
        pending = pending.slice(m[0].length);
      }
    });
    child.on("error", (e: Error) => {
      if (!spawnError) spawnError = e;
    });
    child.on("close", (status, signal) => {
      clearTimeout(timer);
      const tail = decoder.end();
      if (tail) {
        pushCaptured(tail);
        pending += tail;
      }
      if (pending) flushLine(pending, "\n");
      resolve({ status, signal, stderr: captured, error: timedOut ? spawnError : spawnError });
    });
  });
}
