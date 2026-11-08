#!/usr/bin/env node
/**
 * measure-65r8-gpu-harness.mjs — Phase 9 đợt 65, luồng S8 (nợ #8 R64 §8):
 * FPS trên máy GPU thật — VM này KHÔNG có GPU nên KHÔNG bịa số.
 *
 * Script này làm 2 việc:
 * 1. PHÁT HIỆN (chạy được ở mọi máy): phân biệt 3 tầng như
 *    benchmarks/render/gpu_encode_harness.sh — (a) encoder có trong
 *    build FFmpeg không, (b) thiết bị phần cứng có mặt không
 *    (nvidia-smi, /dev/dri, lspci), (c) encode/decode thật bằng
 *    encoder đó có chạy không. Chỉ khi cả 3 đều có mới được nói
 *    "đã đo trên GPU thật".
 * 2. ĐO (chỉ khi có GPU): decode long720 bằng hwaccel (vaapi/cuda/
 *    nvdec, tuỳ máy) ×3 lần, ghi fps + so với decode CPU (R64 §4.2:
 *    ffmpeg CPU decode 720p 95.66 fpsCpu) + WebGL UNMASKED_RENDERER
 *    qua Chrome (xem trình duyệt thấy GPU gì).
 *
 * Trên VM không GPU, kết quả đúng là verdict NO_GPU_ON_THIS_VM kèm
 * đầy đủ bằng chứng từng tầng — và file JSON này chính là "manifest
 * chạy sẵn" để đo trên máy có GPU: chép script + fixture long720.mp4
 * sang máy đó rồi chạy lại, không cần sửa gì.
 *
 * Chạy (từ gốc repo, hoặc trên máy GPU):
 *   node apps/web/scripts/measure-65r8-gpu-harness.mjs
 * Env: R8_GPU_CLIP (mặc định long720.mp4 trong scratch media),
 *   R8_GPU_REPS (mặc định 3), R8_GPU_OUT (mặc định
 *   hidden_files/round65-r8/gpu-harness.json).
 * Exit 0 khi probe xong (kể cả NO_GPU — đó là kết quả đúng), 2 khi
 * harness lỗi. KHÔNG sửa code sản phẩm, KHÔNG push/tag/binary.
 */
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const SCRATCH_TXT = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round61-r3-scratch.txt");
const MEDIA_DIR = fs.existsSync(SCRATCH_TXT)
  ? path.join(fs.readFileSync(SCRATCH_TXT, "utf8").trim(), "media")
  : path.join(os.homedir(), "workspace", ".scratch-r61r3-1cOf", "media");
const CLIP = process.env.R8_GPU_CLIP || "long720.mp4";
const REPS = Math.max(1, Number(process.env.R8_GPU_REPS || 3));
const OUT_DIR = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round65-r8");
const OUT = process.env.R8_GPU_OUT || path.join(OUT_DIR, "gpu-harness.json");
const LOG = path.join(OUT_DIR, "gpu-harness.log");
const logLines = [];
function log(...a) { const l = `[${new Date().toISOString()}] ${a.join(" ")}`; logLines.push(l); console.log(l); }
function loadAvg() {
  try { return fs.readFileSync("/proc/loadavg", "utf8").trim().split(" ").slice(0, 3).join(" "); }
  catch { return "?"; }
}
function run(cmd, args, timeoutMs = 60000) {
  try {
    const r = spawnSync(cmd, args, { encoding: "utf8", timeout: timeoutMs });
    return { ok: r.status === 0, code: r.status, out: (r.stdout || "").trim(), err: (r.stderr || "").trim().slice(-500) };
  } catch (e) {
    return { ok: false, code: null, out: "", err: String(e && e.message ? e.message : e).slice(-500) };
  }
}
function findChrome() {
  const dir = path.join(os.homedir(), ".cache/ms-playwright");
  try {
    const cands = fs.readdirSync(dir)
      .filter((d) => /^chromium-\d+$/.test(d))
      .map((d) => path.join(dir, d, "chrome-linux64", "chrome"))
      .filter((p) => fs.existsSync(p))
      .sort().reverse();
    if (cands.length) return cands[0];
  } catch {}
  return null;
}

async function main() {
  const report = { clip: CLIP, measuredAt: new Date().toISOString(), loadavg: loadAvg(), env: {}, ffmpeg: {}, webgl: null, attempts: [], verdict: null, runOnGpuMachine: null };
  try {
    // ---- Tầng thiết bị: GPU có mặt không? ----
    const nvidia = run("nvidia-smi", ["-L"]);
    const lspci = run("lspci", []);
    const vgaLines = lspci.ok ? lspci.out.split("\n").filter((l) => /vga|3d|display/i.test(l)) : [];
    let dri = [];
    try { dri = fs.readdirSync("/dev/dri"); } catch { dri = []; }
    const nvidiaDev = fs.existsSync("/proc/driver/nvidia");
    report.env = {
      nvidiaSmi: nvidia.ok ? nvidia.out.split("\n")[0] : null,
      nvidiaSmiError: nvidia.ok ? null : (nvidia.err || "không có nvidia-smi").slice(0, 200),
      lspciVga: vgaLines,
      driNodes: dri,
      procDriverNvidia: nvidiaDev,
      cpu: os.cpus()[0]?.model || null,
      cpus: os.cpus().length,
      memGb: +(os.totalmem() / 2 ** 30).toFixed(1),
    };
    log(`thiết bị: nvidia-smi=${report.env.nvidiaSmi || "KHÔNG CÓ"}; lspci VGA=${JSON.stringify(vgaLines)}; /dev/dri=${JSON.stringify(dri)}; /proc/driver/nvidia=${nvidiaDev}`);

    // ---- Tầng build FFmpeg: encoder/hwaccel nào có trong build? ----
    const ffver = run("ffmpeg", ["-hide_banner", "-version"]);
    const hwaccels = run("ffmpeg", ["-hide_banner", "-hwaccels"]);
    const encoders = run("ffmpeg", ["-hide_banner", "-encoders"]);
    const decoders = run("ffmpeg", ["-hide_banner", "-decoders"]);
    const HW_ENCS = ["h264_nvenc", "hevc_nvenc", "h264_vaapi", "hevc_vaapi", "h264_qsv", "hevc_qsv", "h264_videotoolbox", "h264_amf", "av1_nvenc"];
    const HW_DECS = ["h264_cuvid", "hevc_cuvid", "h264_vaapi", "h264_qsv"];
    report.ffmpeg = {
      version: ffver.ok ? ffver.out.split("\n")[0] : null,
      hwaccels: hwaccels.ok ? hwaccels.out.split("\n").map((s) => s.trim()).filter(Boolean).filter((s) => s !== "Hardware acceleration methods:") : [],
      hwEncodersInBuild: HW_ENCS.filter((e) => encoders.ok && new RegExp(`\\b${e}\\b`).test(encoders.out)),
      hwDecodersInBuild: HW_DECS.filter((e) => decoders.ok && new RegExp(`\\b${e}\\b`).test(decoders.out)),
    };
    log(`ffmpeg: ${report.ffmpeg.version}; hwaccels=${JSON.stringify(report.ffmpeg.hwaccels)}; hw encoders trong build=${JSON.stringify(report.ffmpeg.hwEncodersInBuild)}; hw decoders trong build=${JSON.stringify(report.ffmpeg.hwDecodersInBuild)}`);

    // ---- WebGL: trình duyệt thấy GPU gì? (headless mới, KHÔNG --disable-gpu) ----
    const chrome = findChrome();
    if (chrome) {
      const probe = `data:text/html,<canvas id=c></canvas><script>
const gl = document.getElementById("c").getContext("webgl2") || document.getElementById("c").getContext("webgl");
let out = { webgl: !!gl, renderer: null, vendor: null };
if (gl) { const ext = gl.getExtension("WEBGL_debug_renderer_info");
  if (ext) { out.renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL); out.vendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL); } }
document.title = JSON.stringify(out);
</script>`;
      const r = run(chrome, ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--dump-dom", probe], 60000);
      const m = r.out.match(/<title>(.*?)<\/title>/);
      try { report.webgl = m ? JSON.parse(m[1]) : { webgl: null, parseError: "không đọc được title" }; }
      catch { report.webgl = { webgl: null, parseError: "title không phải JSON" }; }
      log(`WebGL: ${JSON.stringify(report.webgl)}`);
    } else {
      report.webgl = { webgl: null, parseError: "không thấy chrome" };
      log("WebGL: không thấy chrome — bỏ qua");
    }

    // ---- Tầng đo thật: thử hw decode/encode (chỉ chạy khi có thiết bị) ----
    const clipPath = path.join(MEDIA_DIR, CLIP);
    const hasDevice = !!report.env.nvidiaSmi || report.env.driNodes.length > 0 || report.env.procDriverNvidia
      || (report.webgl?.renderer && !/swiftshader|llvmpipe|software|basic render/i.test(report.webgl.renderer));
    const attempts = [];
    if (!fs.existsSync(clipPath)) {
      attempts.push({ kind: "skip", reason: `không thấy fixture ${clipPath}` });
      log(`fixture: KHÔNG thấy ${clipPath} — bỏ qua phần đo thật`);
    } else if (!hasDevice) {
      // Không thiết bị → thử các hwaccel EXPLICIT (vaapi/cuda) để ghi
      // BẰNG CHỨNG thất bại vì thiếu thiết bị (đúng như
      // gpu_encode_harness.sh). LƯU Ý: `-hwaccel auto` KHÔNG được dùng
      // làm bằng chứng HW — nó tự fallback software lặng lẽ (đã kiểm
      // chứng: auto chạy "ok" 33 fps wall trên VM này dù không có GPU);
      // vẫn chạy 1 lần để ghi rõ hành vi fallback đó, gắn cờ hwUsed=false.
      const explicit = ["vaapi", "cuda"];
      for (const hw of explicit) {
        const t0 = Date.now();
        const r = run("ffmpeg", ["-hide_banner", "-y", "-hwaccel", hw, "-i", clipPath, "-f", "null", "-"], 120000);
        attempts.push({
          kind: "hwaccel-explicit", hwaccel: hw, cmd: `ffmpeg -hwaccel ${hw} -i long720.mp4 -f null -`,
          ok: r.ok, ms: Date.now() - t0,
          tail: (r.err || r.out).split("\n").filter((l) => /error|fail|cannot|no such|not found|invalid|device/i.test(l)).slice(-3).join(" | ").slice(0, 300) || (r.err || r.out).split("\n").slice(-2).join(" | ").slice(0, 300),
        });
        log(`thử hwaccel ${hw} (dự kiến FAIL vì không có thiết bị): ok=${r.ok}`);
      }
      const t0 = Date.now();
      const r = run("ffmpeg", ["-hide_banner", "-y", "-hwaccel", "auto", "-i", clipPath, "-f", "null", "-"], 120000);
      const mFps = (r.err || "").match(/frame=\s*(\d+)\s+fps=\s*([\d.]+)/g);
      attempts.push({
        kind: "hwaccel-auto-decode", cmd: "ffmpeg -hwaccel auto -i long720.mp4 -f null -",
        ok: r.ok, ms: Date.now() - t0, hwUsed: false,
        note: "auto tự fallback software khi không có thiết bị — ok=true KHÔNG chứng minh HW decode; chỉ ghi để đối chiếu tốc độ software fallback",
        tailFps: mFps ? mFps[mFps.length - 1] : null,
        tail: (r.err || r.out).split("\n").slice(-3).join(" | ").slice(0, 300),
      });
      log(`thử hwaccel auto (fallback software, KHÔNG phải bằng chứng HW): ok=${r.ok} — ${mFps ? mFps[mFps.length - 1] : "?"}`);
    } else {
      // Có thiết bị: thử từng hwaccel EXPLICIT (không tin `auto` — nó
      // có thể fallback software lặng lẽ); hwaccel nào ok mới đo fps ×REPS.
      const candidates = ["cuda", "vaapi", "qsv", "vdpau"].filter((h) => report.ffmpeg.hwaccels.includes(h));
      let measured = null;
      for (const hw of candidates) {
        const t0 = Date.now();
        const r = run("ffmpeg", ["-hide_banner", "-y", "-hwaccel", hw, "-i", clipPath, "-f", "null", "-"], 120000);
        const mFps = (r.err || "").match(/frame=\s*(\d+)\s+fps=\s*([\d.]+)/g);
        attempts.push({ kind: "hwaccel-explicit", hwaccel: hw, cmd: `ffmpeg -hwaccel ${hw} -i long720.mp4 -f null -`,
          ok: r.ok, ms: Date.now() - t0, tailFps: mFps ? mFps[mFps.length - 1] : null,
          tail: (r.err || "").split("\n").filter((l) => /error|fail|cannot|no such|not found|invalid|device/i.test(l)).slice(-3).join(" | ").slice(0, 300) });
        log(`hwaccel ${hw}: ok=${r.ok} ${mFps ? mFps[mFps.length - 1] : ""}`);
        if (r.ok && !measured) measured = hw;
      }
      if (measured) {
        for (let i = 1; i <= REPS; i++) {
          const t0 = Date.now();
          const r = run("ffmpeg", ["-hide_banner", "-benchmark", "-y", "-hwaccel", measured, "-i", clipPath, "-f", "null", "-"], 120000);
          const bench = (r.err || "").match(/bench: utime=([\d.]+)s/);
          const mFps = (r.err || "").match(/frame=\s*(\d+)\s+fps=\s*([\d.]+)/g);
          attempts.push({ kind: "hw-decode-measure", hwaccel: measured, rep: i, ok: r.ok, ms: Date.now() - t0, utimeS: bench ? Number(bench[1]) : null, tailFps: mFps ? mFps[mFps.length - 1] : null });
          log(`hw decode ${measured} rep ${i}: ok=${r.ok}, ${Date.now() - t0}ms, utime=${bench ? bench[1] : "?"}s`);
        }
      } else {
        attempts.push({ kind: "skip", reason: "có thiết bị nhưng không hwaccel explicit nào chạy được — xem tail từng attempt" });
      }
    }
    report.attempts = attempts;

    // ---- Verdict ----
    if (hasDevice) {
      const okRuns = attempts.filter((a) => a.kind === "hw-decode-measure" && a.ok).length;
      const okExplicit = attempts.filter((a) => a.kind === "hwaccel-explicit" && a.ok).map((a) => a.hwaccel);
      report.verdict = okRuns > 0
        ? "GPU_PRESENT_HW_DECODE_OK"
        : "GPU_DEVICE_SEEN_BUT_HW_DECODE_FAILED";
      report.hwDecodersWorking = okExplicit;
      report.runOnGpuMachine = "đã có GPU trên máy này — xem attempts để lấy fps hw decode; so với CPU decode R64 §4.2 (720p 95.66 fpsCpu).";
    } else {
      report.verdict = "NO_GPU_ON_THIS_VM";
      report.runOnGpuMachine = "VM này không có GPU (không nvidia-smi, không /dev/dri, WebGL SwiftShader) — CHƯA đo được FPS máy GPU thật. Để đo: chép script này + fixture long720.mp4 sang máy có GPU (NVIDIA/VAAPI/QSV) rồi chạy `node apps/web/scripts/measure-65r8-gpu-harness.mjs`; script tự phát hiện thiết bị và đo hw decode ×3, ghi cùng file JSON này.";
    }
    log(`VERDICT: ${report.verdict}`);
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
    fs.writeFileSync(LOG, logLines.join("\n") + "\n");
    log(`đã ghi ${OUT} + ${LOG}`);
    process.exitCode = 0;
  } catch (e) {
    log(`HARNESS LỖI: ${e && e.message ? e.message : e}`);
    try { fs.mkdirSync(OUT_DIR, { recursive: true }); fs.writeFileSync(LOG, logLines.join("\n") + "\n"); } catch {}
    process.exitCode = 2;
  }
}

main();
