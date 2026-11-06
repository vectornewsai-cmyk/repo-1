/**
 * render.ts — vcut render: validate rồi render project thành MP4 bằng FFmpeg.
 */
import { spawn, spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { StringDecoder } from "node:string_decoder";
import { CliError, numFlag, optFlag, reqFlag, type ParsedArgs } from "../args.js";
import { RENDER_WORKER_JS } from "../paths.js";
import { formatRenderFailure, redactWorkerLine } from "../renderErrors.js";
import { loadProject, projectDuration, validateProject } from "../project.js";

/**
 * Đợt 30 M3 — chạy worker ở chế độ không-quiet mà KHÔNG để stderr thô
 * chạm terminal: stderr worker được pipe, lọc redact theo dòng (cùng
 * chuẩn bridge) rồi mới in ra process.stderr theo thời gian thực, đồng
 * thời tích lũy bản thô (cắt đuôi 256KB, đủ cho lỗi có cấu trúc khi
 * fail — stderr worker vốn chỉ cần tail) để formatRenderFailure dùng.
 * stdout worker giữ inherit như trước (log tiến trình của worker).
 * Dấu phân dòng là \n HOẶC \r (ffmpeg in progress bằng \r) — delimiter
 * gốc được giữ khi in lại để hành vi terminal (ghi đè dòng progress)
 * không đổi; dòng sau redact thành rỗng (stack trace) thì bỏ hẳn,
 * không in dòng trống. Timeout 30 phút như spawnSync trước đây.
 */
interface WorkerRunResult {
  status: number | null;
  signal: NodeJS.Signals | null;
  stderr: string;
  error: Error | null;
}

const WORKER_TIMEOUT_MS = 30 * 60 * 1000;
const CAPTURED_TAIL_CHARS = 256 * 1024;

function runWorkerStreamed(renderArgs: string[]): Promise<WorkerRunResult> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, renderArgs, {
      stdio: ["ignore", "inherit", "pipe"],
    });
    const decoder = new StringDecoder("utf8");
    let pending = "";
    let captured = "";
    let spawnError: Error | null = null;
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      spawnError = new Error("Render worker quá thời gian 30 phút (timeout)");
      child.kill("SIGKILL");
    }, WORKER_TIMEOUT_MS);
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
      // Tách các dòng hoàn chỉnh (kết thúc bằng \n hoặc \r); phần dở
      // dang cuối chunk giữ lại chờ chunk sau (kể cả ký tự UTF-8 đã
      // được StringDecoder xử lý ở trên).
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

/** Preset export → tham số render worker. */
const PRESETS: Record<string, { width: number; height: number; crf: number; preset: string; audioBitrate: string }> = {
  "720p": { width: 1280, height: 720, crf: 20, preset: "medium", audioBitrate: "128k" },
  "1080p": { width: 1920, height: 1080, crf: 20, preset: "medium", audioBitrate: "128k" },
  "4k": { width: 3840, height: 2160, crf: 20, preset: "medium", audioBitrate: "192k" },
  "tiktok": { width: 1080, height: 1920, crf: 20, preset: "medium", audioBitrate: "128k" },
  "youtube": { width: 1920, height: 1080, crf: 18, preset: "slow", audioBitrate: "192k" },
  "ig-square": { width: 1080, height: 1080, crf: 20, preset: "medium", audioBitrate: "128k" },
};

export async function cmdRender(args: ParsedArgs): Promise<void> {
  const projectPath = reqFlag(args.flags, "project", ["p"]);
  const output = reqFlag(args.flags, "output", ["o"]);
  const presetName = optFlag(args.flags, "preset", "1080p").toLowerCase();
  const mediaDir = args.flags["media-dir"] !== undefined ? String(args.flags["media-dir"]) : undefined;
  const overwrite = args.flags["y"] === true || args.flags["overwrite"] === true;
  const quiet = args.flags["q"] === true || args.flags["quiet"] === true;
  const crfOverride = args.flags["crf"] !== undefined ? numFlag(args.flags, "crf", 20) : undefined;

  const preset = PRESETS[presetName];
  if (!preset) throw new CliError(`--preset không hợp lệ. Chọn: ${Object.keys(PRESETS).join(", ")}`);

  if (!output.toLowerCase().endsWith(".mp4"))
    throw new CliError("--output phải có đuôi .mp4");

  const { spec } = await loadProject(projectPath);

  // Validate trước khi render
  const { errors, warnings } = validateProject(spec);
  if (errors.length > 0) {
    console.error("Project không hợp lệ, từ chối render:");
    for (const e of errors) console.error(`  ✗ ${e}`);
    throw new CliError(`Có ${errors.length} lỗi validation`);
  }
  for (const w of warnings) console.error(`  ⚠ ${w}`);

  if (projectDuration(spec) <= 0)
    throw new CliError("Project đang trống (chưa có clip nào) — thêm clip trước khi render");

  // Ghi spec ra file tạm (render worker đọc từ file)
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "vcut-render-"));
  const tmpSpec = path.join(tmpDir, "spec.json");
  const outAbs = path.resolve(output);

  try {
    await fs.writeFile(tmpSpec, JSON.stringify(spec), "utf8");
    await fs.mkdir(path.dirname(outAbs), { recursive: true });

    const renderArgs = [RENDER_WORKER_JS, "--spec", tmpSpec, "--out", outAbs];
    if (mediaDir) renderArgs.push("--media-dir", path.resolve(mediaDir));
    renderArgs.push("--crf", String(crfOverride ?? preset.crf));
    renderArgs.push("--x264-preset", preset.preset);
    renderArgs.push("--audio-bitrate", preset.audioBitrate);
    if (overwrite) renderArgs.push("-y");
    if (quiet) renderArgs.push("-q");

    console.error(`[vcut] render preset=${presetName} (${preset.width}x${preset.height}) → ${outAbs}`);
    // Quiet: giữ nguyên spawnSync pipe như trước (không đổi hành vi).
    // Không-quiet (đợt 30 M3): pipe + lọc redact theo dòng, KHÔNG còn
    // stdio inherit — stderr worker không bao giờ chạm terminal ở dạng thô.
    let status: number | null;
    let signal: NodeJS.Signals | null;
    let captured: string;
    let spawnError: Error | null;
    if (quiet) {
      const r = spawnSync(process.execPath, renderArgs, {
        encoding: "utf8",
        timeout: WORKER_TIMEOUT_MS,
        maxBuffer: 32 * 1024 * 1024,
        stdio: "pipe",
      });
      status = r.status;
      signal = r.signal;
      captured = String(r.stderr ?? r.stdout ?? "");
      spawnError = r.error ?? null;
    } else {
      const run = await runWorkerStreamed(renderArgs);
      status = run.status;
      signal = run.signal;
      captured = run.stderr;
      spawnError = run.error;
    }
    if (status !== 0) {
      // L3 (đợt 28) + M3 (đợt 30): KHÔNG in stderr thô (từng lộ đường dẫn
      // tuyệt đối qua slice(-2000)). Dùng lỗi có cấu trúc đã redact từ
      // bridge. Từ đợt 30, cả hai chế độ đều bắt được stderr nên nhánh
      // "không bắt được gì" chỉ còn cho lỗi spawn/timeout thật sự rỗng.
      if (captured.trim()) {
        throw new CliError(formatRenderFailure(captured, status, signal));
      }
      if (spawnError) {
        throw new CliError(formatRenderFailure(String(spawnError), status, signal));
      }
      throw new CliError(
        `Render thất bại [WORKER_EXIT]: Render worker thoát với mã ${status} ` +
          `(không bắt được log worker — chạy lại với -q để nhận lỗi có cấu trúc đã redact).`
      );
    }
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }

  const st = await fs.stat(outAbs);
  console.log(
    JSON.stringify(
      { ok: true, output: outAbs, size_bytes: st.size, preset: presetName, warnings },
      null,
      2
    )
  );
}

export { PRESETS };
