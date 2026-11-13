/**
 * Test end-to-end cho Phase 9 đợt 62 luồng R5: giao thức mã lỗi bridge→web.
 * Chạy bằng (từ gốc repo):
 *   node server/bridge/test/test-bridge-error-protocol-e2e.cjs
 *  (không cần ffmpeg chạy thật — mọi case lỗi đều dừng trước khi spawn worker,
 *  trừ [8] spawn worker thật nhưng validateSpec fail trước mọi lệnh ffmpeg;
 *  chỉ cần node + bridge; BEATS_PY trỏ tới stub để qua bước avail.)
 *
 * Khởi động 2 bridge thật trên port ngẫu nhiên:
 *  - A: BRIDGE_MAX_QUEUE=0 (case QUEUE_FULL) + BEATS_PY=stub (case BPM).
 *  - B: BRIDGE_RATE_GENERAL=4 (case RATE_LIMITED, bucket đã tách scope
 *    đợt 63 R5 — xem [6]).
 *  - C: BRIDGE_MAX_QUEUE=10 + rate 1000 (case [8]: render thật, spec
 *    fail validation ở worker — không cần ffmpeg vì validateSpec
 *    chạy trước mọi lệnh ffmpeg).
 *  - D: BRIDGE_RATE_GENERAL=4 + BRIDGE_RATE_WINDOW_MS=2000 (case [9]
 *    đợt 64 R7: sliding-window khóa burst biên — cửa sổ ngắn để
 *    test chạy trong ~4s thay vì chờ 60s).
 * Mỗi case assert: HTTP status + error (chuỗi cũ nguyên vẹn) +
 * errorCode + errorParams. Cuối cùng bundle resolver web thật
 * (apps/web/src/lib/bridgeErrors.ts) + fragment round62-r5 và assert
 * chuỗi hiển thị cuối cùng vi/en cho một số payload live.
 */
"use strict";

const { spawn, execFileSync } = require("child_process");
const fs = require("fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const os = require("os");
const path = require("path");

const REPO = path.resolve(__dirname, "..", "..", "..");
const FRAG_PATH =
  "/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round62-r5-fragment.json";

let pass = 0;
let fail = 0;
function ok(cond, label, extra) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.error(`  ✗ FAIL: ${label}${extra !== undefined ? ` — ${JSON.stringify(extra)}` : ""}`); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function tmpWork() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "vcut-r62r5-e2e-"));
}

function startBridge(port, workDir, extraEnv) {
  const logPath = path.join(workDir, "bridge.log");
  const logFd = fs.openSync(logPath, "w");
  const child = spawn("node", [path.join(REPO, "server", "bridge", "src", "index.js")], {
    cwd: REPO,
    env: {
      ...process.env,
      BRIDGE_PORT: String(port),
      BRIDGE_WORK_DIR: workDir,
      ...extraEnv,
    },
    stdio: ["ignore", logFd, logFd],
  });
  return { child, logPath };
}

async function waitHealth(port, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/api/health`);
      if (r.ok) return true;
    } catch { /* chưa lên */ }
    await sleep(250);
  }
  return false;
}

async function stopBridge(b) {
  try { b.child.kill("SIGTERM"); } catch { /* đã chết */ }
  for (let i = 0; i < 20; i++) {
    if (b.child.exitCode !== null) return;
    await sleep(100);
  }
  try { b.child.kill("SIGKILL"); } catch { /* đã chết */ }
}

/** POST multipart (FormData toàn cục của Node 24). */
async function postForm(port, url, fields = {}, files = {}) {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  for (const [k, { buf, name, type }] of Object.entries(files)) {
    form.append(k, new Blob([buf], { type: type || "application/octet-stream" }), name);
  }
  const res = await fetch(`http://127.0.0.1:${port}${url}`, { method: "POST", body: form });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body, headers: res.headers };
}
async function postJson(port, url, obj) {
  const res = await fetch(`http://127.0.0.1:${port}${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(obj),
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}
async function req(port, method, url) {
  const res = await fetch(`http://127.0.0.1:${port}${url}`, { method });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body, headers: res.headers };
}

/** Assert 1 payload lỗi: status + error cũ + code + params (subset). */
function expectErr(got, status, code, error, params, label) {
  ok(got.status === status, `${label}: status ${status}`, got.status);
  ok(got.body.errorCode === code, `${label}: errorCode ${code}`, got.body.errorCode);
  if (error !== undefined) ok(got.body.error === error, `${label}: error cũ nguyên vẹn`, got.body.error);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      ok(String(got.body.errorParams?.[k]) === String(v), `${label}: errorParams.${k}=${v}`, got.body.errorParams);
    }
  }
}

// File giả lập: mp4 sai magic (không có ftyp), wav RIFF/WAVE tối thiểu,
// PNG 1x1 thật (đủ qua magic check cho case QUEUE_FULL).
const BAD_MP4 = Buffer.from("day la file text, khong phai mp4 that dau!", "utf8");
const GOOD_WAV = Buffer.concat([
  Buffer.from("RIFF", "ascii"), Buffer.from([36, 0, 0, 0]),
  Buffer.from("WAVEfmt ", "ascii"), Buffer.alloc(28, 0),
]);
const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);
const SPEC_MIN = JSON.stringify({ version: "0.2.0", tracks: [] });

async function main() {
  const work = tmpWork();
  const workA = path.join(work, "a");
  const workB = path.join(work, "b");
  fs.mkdirSync(workA, { recursive: true });
  fs.mkdirSync(workB, { recursive: true });
  // Stub beat.py: chỉ cần TỒN TẠI để qua avail; BPM validate throw trước
  // khi beat.py chạy nên nội dung không quan trọng (vẫn in JSON hợp lệ).
  const beatStub = path.join(work, "beat-stub.py");
  writeFileEpermRetry(beatStub, "#!/usr/bin/env python3\nimport json\nprint(json.dumps({'bpm': 120.0, 'beats': [0.5], 'duration': 1.0, 'structure': None}))\n");

  const portA = 18787 + Math.floor(Math.random() * 200);
  const portB = 18987 + Math.floor(Math.random() * 200);
  const portC = 19187 + Math.floor(Math.random() * 200);
  const workC = path.join(work, "c");
  fs.mkdirSync(workC, { recursive: true });
  const portD = 19387 + Math.floor(Math.random() * 200);
  const workD = path.join(work, "d");
  fs.mkdirSync(workD, { recursive: true });
  const bridgeA = startBridge(portA, workA, {
    BRIDGE_MAX_QUEUE: "0",
    BEATS_PY: beatStub,
    // Parent gộp đợt 65: persist riêng từng instance — từ đợt 65 S5
    // bridge lưu trạng thái limiter ra đĩa, không cách ly thì mốc của
    // instance trước rò sang instance sau (cùng IP) làm sai budget.
    BRIDGE_RATE_PERSIST_PATH: path.join(workA, "rate-limit.json"),
    // E2E gọi ~35 request tới các route rate-limit render (20/phút mặc
    // định) — nới limiter để test không tự trip (không phải hành vi test).
    BRIDGE_RATE_RENDER: "1000",
    BRIDGE_RATE_GENERAL: "1000",
  });
  // B: BEATS_PY trỏ đường dẫn không tồn tại → beats 503 NOT_READY.
  // Đợt 63 R5 — quirk R1-040 ĐÃ SỬA: bucket tách theo scope
  // (`${scope}:${ip}`) nên 1 request qua 2 middleware chỉ đếm 1 lần
  // vào MỖI bucket riêng (không đếm 2 lần vào general nữa).
  // Budget general = 4: health poll #1 (1) + beats POST (2, render
  // bucket riêng = 1) + health h2 (3) OK + health h3 (4) OK +
  // health h4 (5) → 429.
  const bridgeB = startBridge(portB, workB, {
    BRIDGE_RATE_GENERAL: "4",
    BEATS_PY: path.join(work, "khong-co-beat.py"),
    BRIDGE_RATE_PERSIST_PATH: path.join(workB, "rate-limit.json"),
  });
  // C: hàng đợi thường + rate nới — chạy worker thật cho section [8].
  const bridgeC = startBridge(portC, workC, {
    BRIDGE_MAX_QUEUE: "10",
    BRIDGE_RATE_RENDER: "1000",
    BRIDGE_RATE_GENERAL: "1000",
    BRIDGE_RATE_PERSIST_PATH: path.join(workC, "rate-limit.json"),
  });
  // D: đợt 64 R7 — cửa sổ trượt 2s để khóa hành vi biên mà không chờ 60s.
  const bridgeD = startBridge(portD, workD, {
    BRIDGE_RATE_GENERAL: "4",
    BRIDGE_RATE_WINDOW_MS: "2000",
    BRIDGE_RATE_PERSIST_PATH: path.join(workD, "rate-limit.json"),
  });
  try {
    ok(await waitHealth(portA), "bridge A lên (health ok)");
    ok(await waitHealth(portB), "bridge B lên (health ok)");
    ok(await waitHealth(portC), "bridge C lên (health ok)");
    ok(await waitHealth(portD), "bridge D lên (health ok)");

    console.log("== [1] job id / tra cứu ==");
    expectErr(await req(portA, "GET", "/api/render/bad-id"), 400, "INVALID_JOB_ID", "Job id không hợp lệ.", null, "GET job id sai");
    expectErr(await req(portA, "GET", "/api/render/0123456789abcdef"), 404, "JOB_NOT_FOUND", "Không tìm thấy job.", null, "GET job lạ");
    expectErr(await req(portA, "GET", "/api/render/0123456789abcdef/download"), 404, "JOB_NOT_FOUND", "Không tìm thấy job.", null, "GET download job lạ");
    expectErr(await req(portA, "DELETE", "/api/render/0123456789abcdef"), 404, "JOB_NOT_FOUND", "Không tìm thấy job.", null, "DELETE job lạ");
    expectErr(await req(portA, "POST", "/api/render/0123456789abcdef/retry"), 404, "JOB_NOT_FOUND", "Không tìm thấy job.", null, "POST retry job lạ");
    expectErr(await req(portA, "GET", "/api/nope"), 404, "API_NOT_FOUND", "API không tồn tại.", null, "GET API lạ");

    console.log("== [2] proxy / LUT ==");
    expectErr(await req(portA, "GET", "/api/proxy/file/bad%20name.mp4"), 400, "PROXY_INVALID_NAME", "Tên file proxy không hợp lệ.", null, "GET proxy tên sai");
    expectErr(await req(portA, "GET", "/api/proxy/file/nonexistent.mp4"), 404, "PROXY_NOT_FOUND", "Không tìm thấy file proxy.", null, "GET proxy không có");
    expectErr(await req(portA, "GET", "/api/luts/bad!id"), 400, "INVALID_LUT_ID", "Id LUT không hợp lệ.", null, "GET LUT id sai");
    expectErr(await req(portA, "GET", "/api/luts/nonexistent123"), 404, "LUT_NOT_FOUND", "Không tìm thấy LUT.", null, "GET LUT không có");

    console.log("== [3] POST /api/render: spec / preset / assetMap / magic / queue ==");
    expectErr(await postForm(portA, "/api/render", {}), 400, "MISSING_SPEC", "Thiếu field 'spec'.", null, "render thiếu spec");
    expectErr(await postForm(portA, "/api/render", { spec: "not json" }), 400, "SPEC_NOT_JSON", "Field 'spec' phải là JSON hợp lệ.", null, "render spec sai JSON");
    expectErr(await postForm(portA, "/api/render", { spec: '{"version":"0.2.0"}' }), 400, "SPEC_NO_TRACKS", "Spec thiếu tracks hoặc sai định dạng.", null, "render spec thiếu tracks");
    expectErr(await postForm(portA, "/api/render", { spec: SPEC_MIN, preset: '{"crf":99}' }), 400, "PRESET_CRF_RANGE", "preset.crf phải là số nguyên 0..51.", null, "render preset crf sai");
    expectErr(await postForm(portA, "/api/render", { spec: SPEC_MIN, preset: '{"x264Preset":"nope"}' }), 400, "PRESET_X264_INVALID", 'preset.x264Preset phải thuộc: ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow.', { allowed: "ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow" }, "render preset x264 sai");
    const amBad = await postForm(portA, "/api/render", { spec: SPEC_MIN, assetMap: '{"k":123}' });
    expectErr(amBad, 400, "ASSETMAP_BAD_VALUE", undefined, { key: "k" }, "render assetMap value sai");
    ok(String(amBad.body.error).startsWith("assetMap không hợp lệ: "), "render assetMap giữ tiền tố cũ", amBad.body.error);
    const amJson = await postForm(portA, "/api/render", { spec: SPEC_MIN, assetMap: "not json{{{ " });
    expectErr(amJson, 400, "ASSETMAP_INVALID", undefined, null, "render assetMap sai JSON");
    ok(String(amJson.body.error).startsWith("assetMap không hợp lệ: "), "render assetMap JSON giữ tiền tố cũ", amJson.body.error);
    ok(typeof amJson.body.errorParams?.detail === "string" && amJson.body.errorParams.detail.length > 0, "render assetMap detail param", amJson.body.errorParams);
    expectErr(
      await postForm(portA, "/api/render", { spec: SPEC_MIN }, { media: { buf: BAD_MP4, name: "bad.mp4", type: "video/mp4" } }),
      400, "MAGIC_MISMATCH", undefined, { name: "bad.mp4", ext: ".mp4" }, "render magic mismatch",
    );
    expectErr(
      await postForm(portA, "/api/render", { spec: SPEC_MIN }, { media: { buf: PNG_1X1, name: "tiny.png", type: "image/png" } }),
      429, "QUEUE_FULL", "Hàng đợi đầy (0 job đang chờ) — thử lại sau.", { maxQueue: "0" }, "render queue đầy (MAX_QUEUE=0)",
    );

    console.log("== [4] caption / translate / tts / reframe / beats validate ==");
    expectErr(await postForm(portA, "/api/caption", { lang: "xx" }), 400, "UNSUPPORTED_LANG", undefined, { lang: "xx" }, "caption lang sai");
    expectErr(await postForm(portA, "/api/caption/translate", { target: "vi" }), 400, "UNSUPPORTED_TARGET_LANG", undefined, { lang: "vi" }, "translate target sai");
    expectErr(await postJson(portA, "/api/tts", {}), 400, "TTS_TEXT_EMPTY", "Text rỗng — nhập nội dung cần đọc.", null, "tts text rỗng");
    expectErr(await postJson(portA, "/api/tts", { text: "xin chào", voice: "Nope" }), 400, "UNSUPPORTED_VOICE", undefined, { voice: "Nope" }, "tts voice sai");
    expectErr(await postForm(portA, "/api/tts/clone", { text: "xin chào" }), 400, "TTS_REF_AUDIO_MISSING", "Thiếu file giọng mẫu (field 'refAudio').", null, "tts clone thiếu refAudio");
    expectErr(await postForm(portA, "/api/reframe/analyze", { aspect: "16:9" }), 400, "UNSUPPORTED_ASPECT", undefined, { aspect: "16:9" }, "reframe aspect sai");
    expectErr(
      await postForm(portA, "/api/beats/analyze", { minBpm: "abc" }, { media: { buf: GOOD_WAV, name: "a.wav", type: "audio/wav" } }),
      400, "BPM_INVALID", 'BPM không hợp lệ: "abc" (30–300).', { value: "abc" }, "beats BPM sai",
    );
    expectErr(
      await postForm(portA, "/api/beats/analyze", { minBpm: "200", maxBpm: "100" }, { media: { buf: GOOD_WAV, name: "a.wav", type: "audio/wav" } }),
      400, "BPM_RANGE_INVALID", "BPM tối thiểu phải nhỏ hơn BPM tối đa.", null, "beats BPM min>=max",
    );

    console.log("== [5] bgremove / silence / scene validate ==");
    expectErr(await postForm(portA, "/api/bgremove", { session: "bria-rmbg" }), 400, "BGREMOVE_SESSION_FORBIDDEN", undefined, { session: "bria-rmbg", fallback: "birefnet-general" }, "bgremove session bị cấm");
    expectErr(await postForm(portA, "/api/bgremove", { temporal: "5" }), 400, "BGREMOVE_TEMPORAL_INVALID", undefined, { value: "5" }, "bgremove temporal sai");
    expectErr(await postForm(portA, "/api/bgremove", { feather: "9" }), 400, "BGREMOVE_FEATHER_INVALID", undefined, { value: "9" }, "bgremove feather sai");
    expectErr(await postForm(portA, "/api/silence", { noiseDb: "5" }), 400, "SILENCE_NOISE_INVALID", undefined, { min: "-80", max: "0", value: "5" }, "silence noiseDb sai");
    expectErr(await postForm(portA, "/api/silence", { minDur: "99" }), 400, "SILENCE_MINDUR_INVALID", undefined, { min: "0.1", max: "10", value: "99" }, "silence minDur sai");
    expectErr(await postForm(portA, "/api/scene", { threshold: "2" }), 400, "SCENE_THRESHOLD_INVALID", undefined, { value: "2", min: "0.05", max: "0.95", def: "0.4" }, "scene threshold sai");
    expectErr(await postForm(portA, "/api/scene", { start: "-1", end: "5" }), 400, "SCENE_START_INVALID", undefined, { value: "-1" }, "scene start sai");
    expectErr(await postForm(portA, "/api/scene", { start: "5", end: "2" }), 400, "SCENE_RANGE_INVALID", "end phải lớn hơn start.", null, "scene end<=start");

    console.log("== [6] beats chưa sẵn sàng (B) + rate limit (B) ==");
    // Instance B: BEATS_PY mặc định (server/beats/beat.py không tồn tại)
    // → 503 BEATS_NOT_READY. Đây là request #2 trên B (sau health poll);
    // nó đếm 2 lần vào budget general (quirk bucket chung, xem trên).
    const notReady = await postForm(portB, "/api/beats/analyze", {}, { media: { buf: GOOD_WAV, name: "a.wav", type: "audio/wav" } });
    expectErr(notReady, 503, "BEATS_NOT_READY", undefined, null, "beats chưa sẵn sàng");
    ok(String(notReady.body.error).startsWith("Beat detection chưa sẵn sàng: "), "beats not-ready giữ tiền tố cũ", notReady.body.error);
    ok(String(notReady.body.errorParams?.reason).includes("beat.py"), "beats not-ready reason có tên script", notReady.body.errorParams);
    // General #3: health OK; general #4: health OK; general #5: 429.
    // (Số học cũ — beats đếm 2, h2 là #4, h3 là #5 — đã sai sau khi
    // sửa quirk; đây là khóa mới cho bucket tách scope.)
    const h2 = await req(portB, "GET", "/api/health");
    ok(h2.status === 200, "rate limit: general #3 vẫn 200", h2.status);
    const h3 = await req(portB, "GET", "/api/health");
    ok(h3.status === 200, "rate limit: general #4 vẫn 200 (quirk đếm 2 đã hết)", h3.status);
    const h4 = await req(portB, "GET", "/api/health");
    expectErr(h4, 429, "RATE_LIMITED", undefined, null, "rate limit: general #5 → 429");
    ok(h4.headers.get("retry-after") !== null, "rate limit: có header Retry-After", h4.headers.get("retry-after"));
    ok(/thử lại sau \d+s/.test(String(h4.body.error)), "rate limit: error cũ có số giây", h4.body.error);

    console.log("== [7] resolver web thật trên payload live ==");
    // Bundle resolver web thật + dịch bằng fragment (giả lập dict đã gộp).
    const bundleOut = path.join(work, "bridge-errors.e2e.cjs");
    execFileSync(path.join(REPO, "node_modules", ".bin", "esbuild"), [
      path.join(REPO, "apps", "web", "src", "lib", "bridgeErrors.ts"),
      "--bundle", "--platform=node", "--format=cjs", `--outfile=${bundleOut}`,
    ], { stdio: "pipe" });
    const { resolveBridgeApiError } = require(bundleOut);
    const frag = JSON.parse(fs.readFileSync(FRAG_PATH, "utf8"));
    const makeT = (lang) => (key, vars) => {
      const dict = lang === "vi" ? frag.vi.bridgeErrors : frag.en.bridgeErrors;
      const raw = dict[key.replace("bridgeErrors.", "")] ?? key;
      if (!vars) return raw;
      return raw.replace(/\{(\w+)\}/g, (_, n) => vars[n] ?? `{${n}}`);
    };
    const liveCases = [
      ["/api/render/bad-id", "GET", "Job id không hợp lệ.", "Invalid job id."],
      ["/api/render/0123456789abcdef", "GET", "Không tìm thấy job.", "Job not found."],
    ];
    for (const [url, method, wantVi, wantEn] of liveCases) {
      const got = await req(portA, method, url);
      eqLive(resolveBridgeApiError(got.body, makeT("vi"), "FALLBACK"), wantVi, `${url} vi`);
      eqLive(resolveBridgeApiError(got.body, makeT("en"), "FALLBACK"), wantEn, `${url} en`);
    }
    const langLive = await postForm(portA, "/api/caption", { lang: "xx" });
    eqLive(
      resolveBridgeApiError(langLive.body, makeT("vi"), "FALLBACK"),
      'Ngôn ngữ không hỗ trợ: "xx". Chọn một trong: vi, en, auto, zh, ja, ko, th, id, ms, fr, de, es.',
      "caption lang xx vi",
    );
    eqLive(
      resolveBridgeApiError(langLive.body, makeT("en"), "FALLBACK"),
      'Unsupported language: "xx". Choose one of: vi, en, auto, zh, ja, ko, th, id, ms, fr, de, es.',
      "caption lang xx en",
    );
    const magicLive = await postForm(portA, "/api/render", { spec: SPEC_MIN }, { media: { buf: BAD_MP4, name: "bad.mp4", type: "video/mp4" } });
    eqLive(
      resolveBridgeApiError(magicLive.body, makeT("vi"), "FALLBACK"),
      'File "bad.mp4" có đuôi .mp4 nhưng nội dung không khớp định dạng (có thể là file giả mạo).',
      "magic mismatch vi",
    );
    eqLive(
      resolveBridgeApiError(magicLive.body, makeT("en"), "FALLBACK"),
      'File "bad.mp4" has a .mp4 extension but its content does not match the format (it may be a fake file).',
      "magic mismatch en",
    );
    console.log("== [8] Đợt 63 R5: render thật, spec fail validation → validationDetails ==");
    // Spec qua được kiểm tra bridge (JSON hợp lệ, có tracks) nhưng
    // worker validateSpec fail (clip start:-1) → job error, poll
    // ?detail=1 phải thấy validationDetails có mã NUMBER_MIN_0, và
    // resolver web thật dịch được sang vi/en.
    const SPEC_BAD_VALIDATION = JSON.stringify({
      version: "0.2.0",
      meta: { name: "t", width: 640, height: 360, fps: 30 },
      tracks: [{ id: "t", kind: "video", clips: [{ id: "c1", kind: "video", start: -1, duration: 2, src: "a.mp4", in: 0, out: 2 }] }],
    });
    const created = await postForm(portC, "/api/render", { spec: SPEC_BAD_VALIDATION });
    ok(created.status === 201, "render spec lỗi validation: job được tạo (201)", created.status);
    const jobId8 = created.body.jobId;
    ok(typeof jobId8 === "string" && /^[0-9a-f]{16}$/.test(jobId8), "render spec lỗi validation: jobId hợp lệ", jobId8);
    let detail8 = null;
    for (let i = 0; i < 40; i++) {
      const g = await req(portC, "GET", `/api/render/${jobId8}?detail=1`);
      if (g.body.status === "error") { detail8 = g.body; break; }
      await sleep(250);
    }
    ok(detail8 !== null, "render spec lỗi validation: job về error (poll ≤10s)", detail8 && detail8.status);
    if (detail8) {
      eqLive(detail8.errorCode, "SPEC_VALIDATION", "validationDetails: errorCode SPEC_VALIDATION");
      eqLive(detail8.errorDetail && detail8.errorDetail.summaryKey, "specValidation", "validationDetails: summaryKey specValidation");
      const vd = detail8.errorDetail && detail8.errorDetail.validationDetails;
      ok(Array.isArray(vd) && vd.length === 1, "validationDetails: đúng 1 entry (chỉ lỗi spec, media chưa chạy tới)", vd && vd.length);
      if (Array.isArray(vd) && vd.length === 1) {
        eqLive(vd[0].code, "NUMBER_MIN_0", "validationDetails: code NUMBER_MIN_0");
        eqLive(vd[0].where, "tracks[0].clips[0]", "validationDetails: where");
        eqLive(vd[0].params && vd[0].params.field, "start", "validationDetails: param field=start");
        eqLive(vd[0].params && vd[0].params.value, "-1", "validationDetails: param value=-1");
        eqLive(detail8.errorDetail.validationDetailsOmitted, 0, "validationDetails: omitted 0");
      }
      // Resolver web thật (validationErrors.ts) + fragment round63-r5.
      const valBundleOut = path.join(work, "validation-errors.e2e.cjs");
      execFileSync(path.join(REPO, "node_modules", ".bin", "esbuild"), [
        path.join(REPO, "apps", "web", "src", "lib", "validationErrors.ts"),
        "--bundle", "--platform=node", "--format=cjs", `--outfile=${valBundleOut}`,
      ], { stdio: "pipe" });
      const { resolveValidationDetails } = require(valBundleOut);
      const fragR5 = JSON.parse(fs.readFileSync(path.join(REPO, "apps", "web", "src", "i18n", "fragments", "round63-r5.json"), "utf8"));
      const makeTVal = (lang) => (key, vars) => {
        const dict = lang === "vi" ? fragR5.vi.validation : fragR5.en.validation;
        const raw = dict[key.replace("validation.", "")] ?? key;
        if (!vars) return raw;
        return raw.replace(/\{(\w+)\}/g, (_, n) => vars[n] ?? `{${n}}`);
      };
      eqLive(
        resolveValidationDetails(vd, makeTVal("vi"))[0],
        "[tracks[0].clips[0]] start phải là số >= 0, nhận được: -1",
        "validationDetails: resolver vi",
      );
      eqLive(
        resolveValidationDetails(vd, makeTVal("en"))[0],
        "[tracks[0].clips[0]] start must be a number >= 0, got: -1",
        "validationDetails: resolver en",
      );
    }

    console.log("== [9] Đợt 64 R7: sliding-window khóa burst biên (bridge D, cửa sổ 2s) ==");
    // D: BRIDGE_RATE_GENERAL=4, window 2000ms. Lưu ý: poll waitHealth đầu
    // lượt đã hết hạn từ lâu (các section [1]–[8] chạy ~15s ≫ 2s) nên
    // bucket D rỗng lúc vào section — #1 dưới đây mới là mốc đầu tiên.
    // #1 lúc t≈0, #2–#4 lúc t≈1.5s (đủ 4), #5 → 429. Fixed-window cũ
    // sau reset (t=2s) mở 4 slot cùng lúc → #6–#9 đều 200 (burst 7 trong
    // cửa sổ trượt). Sliding-window: chỉ mốc t≈0 hết hạn → #6 qua, #7 →
    // 429 (3 mốc t≈1.5s còn hạn tới t≈3.5s); #8 qua lúc t≈3.8s.
    const d1 = await req(portD, "GET", "/api/health");
    ok(d1.status === 200, "sliding: D #1 vẫn 200", d1.status);
    await sleep(1500);
    const d2 = await req(portD, "GET", "/api/health");
    ok(d2.status === 200, "sliding: D #2 vẫn 200", d2.status);
    const d3 = await req(portD, "GET", "/api/health");
    ok(d3.status === 200, "sliding: D #3 vẫn 200", d3.status);
    const d4 = await req(portD, "GET", "/api/health");
    ok(d4.status === 200, "sliding: D #4 vẫn 200", d4.status);
    const d5 = await req(portD, "GET", "/api/health");
    expectErr(d5, 429, "RATE_LIMITED", undefined, null, "sliding: D #5 → 429");
    ok(d5.headers.get("retry-after") === "1", "sliding: D #5 Retry-After=1 (mốc t≈0 hết hạn lúc t=2s)", d5.headers.get("retry-after"));
    await sleep(700); // t≈2.2s: mốc t≈0 đã hết hạn, lô t≈1.5s còn hạn
    const d6 = await req(portD, "GET", "/api/health");
    ok(d6.status === 200, "sliding: D #6 qua (1 slot do mốc cũ nhất hết hạn)", d6.status);
    const d7 = await req(portD, "GET", "/api/health");
    expectErr(d7, 429, "RATE_LIMITED", undefined, null, "sliding: D #7 → 429 (không burst 4 slot sau reset)");
    await sleep(1600); // t≈3.8s: lô t≈1.5s đã hết hạn
    const d8 = await req(portD, "GET", "/api/health");
    ok(d8.status === 200, "sliding: D #8 qua lại sau khi lô cũ hết hạn", d8.status);

    function eqLive(a, b, label) {
      ok(a === b, `${label} (nhận ${JSON.stringify(a)})`);
    }
  } finally {
    await stopBridge(bridgeA);
    await stopBridge(bridgeB);
    await stopBridge(bridgeC);
    await stopBridge(bridgeD);
    fs.rmSync(work, { recursive: true, force: true });
  }

  console.log(`R5 bridge error protocol (e2e HTTP): ${pass} pass, ${fail} fail`);
  if (fail > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exitCode = 1;
});
