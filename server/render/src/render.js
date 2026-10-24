#!/usr/bin/env node
/**
 * render.js — Render worker: đọc video-spec JSON v0.1.0, render MP4 thật bằng FFmpeg.
 *
 * Cách dùng:
 *   node src/render.js --spec project.json --out video.mp4 [--media-dir ./media] [-y] [-q] [--dry-run]
 *
 * Luồng xử lý:
 *   1. Đọc + parse JSON spec.
 *   2. validateSpec() — sai thì in lỗi chi tiết và thoát (không render bừa).
 *   3. validateMedia() — kiểm tra file media tồn tại, đúng loại stream, đủ dài.
 *   4. Dựng filter_complex FFmpeg (1 lần chạy duy nhất):
 *        video: trim/setpts → scale+pad về đúng WxH → fps chuẩn → xfade (nếu có transition)
 *               → đặt lên timeline bằng setpts=PTS+S/TB + overlay eof_action=pass trên nền đen
 *               (opacity: format=rgba + colorchannelmixer nhân alpha trước overlay)
 *               → drawtext (none/fadeUp) → subtitles ASS (typewriter)
 *        audio: atrim/asetpts → aresample 48k → volume → afade → adelay tới vị trí timeline
 *               → amix (nhiều clip) → apad cho đủ tổng thời lượng
 *   5. Chạy ffmpeg → MP4 H.264 + AAC, đúng meta.width/height/fps.
 *
 * Zero dependency. Yêu cầu: ffmpeg + ffprobe trên PATH (hoặc --ffmpeg/--ffprobe), Node >= 20.
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const {
  SPEC_VERSION,
  EPS,
  isVideoSpec,
  validateSpec,
  validateMedia,
  resolveFontFile,
  resolveSrc,
} = require("./validate");
// Phase 3 modules: transitions (13 hiệu ứng xfade), speed/reverse, keyframes.
const { buildXfadeFilter } = require("./transitions");
const { buildSpeedFilter } = require("./speed");
const {
  buildTextExprs, buildOverlayExprs, buildKeyframeTransform, hasScaleRotation,
} = require("./keyframes");
// Phase 3b: chroma key, text animations.
const { buildChromaFilter } = require("./chroma");
const { buildTextAnimExpr, isTextFxAnimation } = require("./textfx");
// Phase 3c: LUT filters, video effects, stickers.
const { buildLutFilter, buildColorAdjustFilter } = require("./lut");
const { buildEffectsChain } = require("./effects");
const { buildStickerOverlay } = require("./sticker");
// Batch G (R1-076): audio effects — dựng chuỗi filter cho AudioEffects.
const { buildAudioEffectsFilters } = require("./audioroute");
// P0-03: image clip (ảnh tĩnh thành media type chính thức).
const { buildImageChain } = require("./image");
// R1-011: opacity/alpha cho video clip.
const { buildOpacityFilter, buildOpacityKeyframesChain } = require("./opacity");
// Phase 7 P4: mask cho clip video/image.
const { buildMaskChain } = require("./mask");
// Batch J plugin wiring: nối PluginRegistry vào pipeline (chỉ khi spec có `plugins`).
const { createPluginHost } = require("./plugins");
// Phase 7 P2: clip enhancement (deinterlace/stabilize/denoise) + encode GPU.
const {
  hasStabilize, buildEnhancePreChain, buildEnhancePostChain,
  runStabilizeDetect, probeFilterSupport,
} = require("./enhance");
// Phase 7 P3: speed ramp (đường cong tốc độ) + audio mixer (gain expr, normalize).
const { buildSpeedRampVideo, buildSpeedRampAudio } = require("./speedramp");
const { buildGainFilter, buildNormalizeFilter } = require("./audiomix");
const { probeGpuEncoder, buildVideoEncodeArgs, tryEncode } = require("./gpuencode");

// ---------------------------------------------------------------------------
// Tiện ích
// ---------------------------------------------------------------------------

/** Format số cho filter FFmpeg: tránh ký hiệu khoa học, giữ tối đa 6 chữ số thập phân. */
function num(x) {
  if (!Number.isFinite(x)) throw new Error(`số không hợp lệ cho filter: ${x}`);
  return String(Math.round(x * 1e6) / 1e6);
}

/** Escape text cho drawtext (text='...'): escape \ ' : và %{ (cú pháp expansion của drawtext). */
function escapeDrawtext(s) {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/:/g, "\\:")
    .replace(/%\{/g, "\\%{")
    .replace(/\n/g, "\\n");
}

/** Escape đường dẫn file cho filter (subtitles=..., fontfile='...'). */
function escapeFilterPath(p) {
  return p.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/:/g, "\\:");
}

/** #rrggbb → &H00BBGGRR (màu ASS/libass, AA=00 là đục hoàn toàn). */
function hexToAssColor(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const r = h.slice(0, 2), g = h.slice(2, 4), b = h.slice(4, 6);
  return `&H00${b}${g}${r}`.toUpperCase();
}

/** Giây → "H:MM:SS.cc" cho file ASS. */
function assTime(t) {
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = Math.floor(t % 60);
  const cs = Math.floor((t % 1) * 100);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

/** Tổng thời lượng project = clip kết thúc muộn nhất (mirror projectDuration của video-spec). */
function projectDuration(spec) {
  let max = 0;
  for (const t of spec.tracks)
    for (const c of t.clips) max = Math.max(max, c.start + c.duration);
  return max;
}

function printHelp() {
  console.log(`render.js — video-spec v${SPEC_VERSION} → MP4 (H.264 + AAC)

Cách dùng:
  node src/render.js --spec <file.json> --out <video.mp4> [tùy chọn]

Tùy chọn:
  --media-dir <dir>   Thư mục chứa file media; src tương đối trong spec được
                      giải quyết từ đây (mặc định: <thư-mục-chứa-spec>/media)
  --asset-map <json>  P7: map asset id → file (JSON object) để resolve src
                      dạng "asset:<id>"; không có map thì fallback file cùng
                      tên trong --media-dir
  --ffmpeg <path>     Đường dẫn ffmpeg (mặc định: ffmpeg trên PATH)
  --ffprobe <path>    Đường dẫn ffprobe (mặc định: ffprobe trên PATH)
  --crf <0..51>       Chất lượng H.264 (CRF; số càng nhỏ càng đẹp, mặc định 20)
  --x264-preset <p>   ultrafast|superfast|veryfast|faster|fast|medium|slow|slower|veryslow
                      (mặc định medium)
  --audio-bitrate <b> Bitrate audio AAC, vd 128k (32k..512k, mặc định 128k)
  --encoder <e>     auto|libx264|h264_nvenc|h264_qsv|h264_vaapi (mặc định auto:
                      probe encode GPU thật, fail → fallback libx264, không fail job)
  --normalize <m>   P3: off|loudnorm|dynaudnorm (mặc định off) — chuẩn hoá loudness
                      toàn bộ audio đã mix, áp sau amix (không áp khi không có audio)
  --normalize-target <dB>  P3: target LUFS cho loudnorm (mặc định -14)
  --normalize-tp <dB>      P3: true peak ceiling cho loudnorm (mặc định -1.5)
  --normalize-lra <dB>     P3: loudness range cho loudnorm (mặc định 11)
  -y, --overwrite     Ghi đè file output nếu đã tồn tại
  -q, --quiet         Ẩn log chi tiết của ffmpeg
  --dry-run           Chỉ in câu lệnh ffmpeg, không chạy
  -h, --help          Hiện trợ giúp này

Mã thoát: 0 = thành công, 1 = spec/media không hợp lệ, 2 = lỗi tham số hoặc lỗi render.`);
}

/** x264 preset hợp lệ cho --x264-preset (whitelist chống injection). */
const X264_PRESETS = [
  "ultrafast", "superfast", "veryfast", "faster", "fast",
  "medium", "slow", "slower", "veryslow",
];

function parseArgs(argv) {
  const ENCODERS = ["auto", "libx264", "h264_nvenc", "h264_qsv", "h264_vaapi"];
  const args = {
    spec: null, out: null, mediaDir: null, assetMapPath: null,
    ffmpeg: "ffmpeg", ffprobe: "ffprobe",
    crf: 20, x264Preset: "medium", audioBitrate: "128k",
    encoder: "auto",
    // Phase 7 P3: normalize export (mặc định off).
    normalize: "off", normalizeTarget: -14, normalizeTp: -1.5, normalizeLra: 11,
    overwrite: false, quiet: false, dryRun: false,
  };
  const needInt = (name, raw, min, max) => {
    const n = Number(raw);
    if (!Number.isInteger(n) || n < min || n > max) {
      console.error(`❌ ${name} phải là số nguyên ${min}..${max} (nhận: ${raw})`);
      process.exit(2);
    }
    return n;
  };
  const needX264Preset = (raw) => {
    if (!X264_PRESETS.includes(raw)) {
      console.error(`❌ --x264-preset phải thuộc: ${X264_PRESETS.join(", ")} (nhận: ${raw})`);
      process.exit(2);
    }
    return raw;
  };
  const needAudioBitrate = (raw) => {
    const m = /^(\d+)k$/.exec(String(raw || ""));
    const kbps = m ? Number(m[1]) : NaN;
    if (!m || !Number.isInteger(kbps) || kbps < 32 || kbps > 512) {
      console.error(`❌ --audio-bitrate phải dạng <số>k, 32k..512k (nhận: ${raw})`);
      process.exit(2);
    }
    return `${kbps}k`;
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const need = () => {
      const v = argv[++i];
      if (v === undefined) { console.error(`Thiếu giá trị cho ${a}`); process.exit(2); }
      return v;
    };
    if (a === "--spec") args.spec = need();
    else if (a === "--out") args.out = need();
    else if (a === "--media-dir") args.mediaDir = need();
    else if (a === "--asset-map") args.assetMapPath = need(); // P7: map asset id → file
    else if (a === "--ffmpeg") args.ffmpeg = need();
    else if (a === "--ffprobe") args.ffprobe = need();
    else if (a === "--crf") args.crf = needInt("--crf", need(), 0, 51);
    else if (a === "--x264-preset") args.x264Preset = needX264Preset(need());
    else if (a === "--audio-bitrate") args.audioBitrate = needAudioBitrate(need());
    else if (a === "--encoder") {
      const e = need();
      if (!ENCODERS.includes(e)) {
        console.error(`❌ --encoder phải thuộc: ${ENCODERS.join(", ")} (nhận: ${e})`);
        process.exit(2);
      }
      args.encoder = e;
    }
    else if (a === "--normalize") {
      const m = need();
      if (!["off", "loudnorm", "dynaudnorm"].includes(m)) {
        console.error(`❌ --normalize phải thuộc: off|loudnorm|dynaudnorm (nhận: ${m})`);
        process.exit(2);
      }
      args.normalize = m;
    }
    else if (a === "--normalize-target") {
      const n = Number(need());
      if (!Number.isFinite(n) || n < -70 || n > 0) {
        console.error(`❌ --normalize-target phải trong -70..0 LUFS`);
        process.exit(2);
      }
      args.normalizeTarget = n;
    }
    else if (a === "--normalize-tp") {
      const n = Number(need());
      if (!Number.isFinite(n) || n < -9 || n > 0) {
        console.error(`❌ --normalize-tp phải trong -9..0 dB`);
        process.exit(2);
      }
      args.normalizeTp = n;
    }
    else if (a === "--normalize-lra") {
      const n = Number(need());
      if (!Number.isFinite(n) || n < 1 || n > 20) {
        console.error(`❌ --normalize-lra phải trong 1..20`);
        process.exit(2);
      }
      args.normalizeLra = n;
    }
    else if (a === "-y" || a === "--overwrite") args.overwrite = true;
    else if (a === "-q" || a === "--quiet") args.quiet = true;
    else if (a === "--dry-run") args.dryRun = true;
    else if (a === "-h" || a === "--help") { printHelp(); process.exit(0); }
    else { console.error(`Tham số không rõ: ${a} (dùng --help để xem)`); process.exit(2); }
  }
  if (!args.spec || !args.out) {
    console.error("Thiếu --spec <file.json> hoặc --out <video.mp4> (dùng --help để xem)");
    process.exit(2);
  }
  return args;
}

// ---------------------------------------------------------------------------
// Dựng file ASS cho các text clip animation="typewriter"
// ---------------------------------------------------------------------------
/**
 * Typewriter THẬT bằng karaoke-style ASS: mỗi ký tự là một dialogue riêng,
 * dialogue thứ i hiện i+1 ký tự đầu, nối tiếp nhau theo thời gian.
 * Không dùng drawtext vì drawtext không làm được reveal từng ký tự.
 */
function buildTypewriterAss(clips, meta) {
  const L = [];
  L.push("[Script Info]", "Title: repo1-typewriter", "ScriptType: v4.00+",
    `PlayResX: ${meta.width}`, `PlayResY: ${meta.height}`, "ScaledBorderAndShadow: yes", "");
  L.push("[V4+ Styles]");
  L.push("Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, " +
    "BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, " +
    "BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding");
  clips.forEach((clip, ci) => {
    const st = clip.style;
    const borderStyle = st.backgroundColor ? 3 : 1; // 3 = hộp nền đục
    const back = st.backgroundColor ? hexToAssColor(st.backgroundColor) : "&H00000000";
    L.push(`Style: TW${ci},${st.fontFamily},${Math.round(st.fontSize)},` +
      `${hexToAssColor(st.color)},&H000000FF,&H80000000,${back},` +
      `${st.bold ? -1 : 0},${st.italic ? -1 : 0},0,0,100,100,0,0,` +
      `${borderStyle},2,0,5,10,10,10,1`);
  });
  L.push("", "[Events]");
  L.push("Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text");
  clips.forEach((clip, ci) => {
    const chars = [...clip.text]; // tách theo code point (đúng với emoji/tiếng Việt)
    const n = Math.max(chars.length, 1);
    const dt = clip.duration / n;
    const x = Math.round(meta.width * (clip.style.x ?? 0.5));
    const y = Math.round(meta.height * (clip.style.y ?? 0.5));
    for (let i = 0; i < n; i++) {
      const t0 = clip.start + i * dt;
      const t1 = i === n - 1 ? clip.start + clip.duration : clip.start + (i + 1) * dt;
      const visible = chars.slice(0, i + 1).join("")
        .replace(/\{/g, "\\{").replace(/\}/g, "\\}"); // escape cú pháp ASS
      L.push(`Dialogue: 0,${assTime(t0)},${assTime(t1)},TW${ci},,0,0,0,,{\\pos(${x},${y})}${visible}`);
    }
  });
  const file = path.join(os.tmpdir(), `repo1-typewriter-${process.pid}.ass`);
  fs.writeFileSync(file, L.join("\n") + "\n", "utf8");
  return file;
}

// ---------------------------------------------------------------------------
// Dựng filter_complex
// ---------------------------------------------------------------------------
function buildFilterGraph(spec, ctx) {
  const { W, H, fps, D, mediaIndex, absOf, transitions, fontFiles, assetsDir, mediaProbes } = ctx;
  const fc = [];
  let n = 0;
  const lbl = (p) => `${p}${n++}`;

  // Bản đồ transition: "trackId:fromClipId" -> { to, duration } (đã validate ở validateSpec)
  const transMap = new Map();
  for (const t of transitions) transMap.set(`${t.trackId}:${t.from}`, t);

  // R1-084: phát hiện video nguồn đã có kênh alpha (VD: output của bgremove.py).
  // Dựa trên pix_fmt từ ffprobe (validateMedia đã lưu vào mediaProbes).
  const hasAlphaVideo = (abs) => {
    if (!mediaProbes) return false; // không có probe data → giữ hành vi cũ
    const probe = mediaProbes.get(abs);
    const vs = probe && probe.streams &&
      probe.streams.find((s) => s.codec_type === "video");
    const fmt = (vs && vs.pix_fmt) || "";
    // Các pix_fmt có alpha: rgba, argb, bgra, abgr, yuva420p/422p/444p, ya8...
    return /(^|_)a(rgba?|bgr|yuv|rgbf|bgrf)|rgba|argb|bgra|abgr|yuva|ya8|ya16/.test(fmt);
  };

  // ===== VIDEO: chuẩn hoá từng clip rồi nối bằng xfade khi có transition =====
  // Mỗi "unit" là một stream video hoàn chỉnh, sẽ được đặt lên timeline ở bước sau.
  const units = [];

  // R1-054: track video bị hidden → bỏ qua (không render hình);
  // track video bị muted → vẫn render hình nhưng bỏ audio kế thừa (xử lý ở phần AUDIO).
  for (const track of spec.tracks.filter((t) => t.kind === "video" && !t.hidden)) {
    const clips = [...track.clips].sort((a, b) => a.start - b.start);

    // Clip dính transition (kề trước hoặc kề sau trong một cặp xfade) sẽ bị gộp
    // thành unit đã merge ở bước 2 — keyframes scale/rotation KHÔNG áp dụng cho
    // các clip đó (validate.js đã cảnh báo). Cần biết trước từ bước 1 vì quyết
    // định giữ kênh alpha (phục vụ scale/rotate) nằm ở chuỗi chuẩn hoá clip.
    const mergeInvolved = new Set();
    for (let i = 0; i + 1 < clips.length; i++) {
      const tr = transMap.get(`${track.id}:${clips[i].id}`);
      if (tr && tr.to === clips[i + 1].id && tr.duration > EPS) {
        mergeInvolved.add(clips[i].id);
        mergeInvolved.add(clips[i + 1].id);
      }
    }

    // Bước 1: chuẩn hoá từng clip — cắt đúng [in, in+duration*speed), speed/reverse,
    // scale/pad về đúng WxH, fps hằng số (xfade bắt buộc CFR), format yuv420p.
    const segs = clips.map((clip) => {
      const idx = mediaIndex.get(absOf(clip.src));
      const v = lbl("cv");
      // Speed/reverse: chèn sau trim + setpts=PTS-STARTPTS (ngữ nghĩa: đoạn nguồn
      // [in, out) bị đảo (nếu reverse) rồi đổi tốc độ; duration hiệu dụng = (out-in)/speed).
      const spd = buildSpeedFilter(clip.speed ?? 1, clip.reverse ?? false);
      const speedChain = spd.video ? `,${spd.video}` : "";
      // Chroma key: áp sau speed, trước scale (key trên pixel gốc cho chính xác).
      const chromaChain = clip.chromaKey ? `,${buildChromaFilter(clip.chromaKey)}` : "";
      // LUT filter + video effects: áp sau scale/pad (trên pixel output).
      // R1-075: chỉnh màu thủ công áp TRƯỚC LUT (correction → look).
      // buildLutFilter cần assetsDir — lấy từ ctx.
      // K3: LUT user (`user-...`) resolve từ mediaDir của job (ctx.userLutsDir),
      // nơi bridge đã lưu file `__lut_<id>.cube` upload kèm spec.
      const colorFilter = buildColorAdjustFilter(clip.filter?.color);
      const colorChain = colorFilter ? `,${colorFilter}` : "";
      const lutChain = clip.filter?.lut ? `,${buildLutFilter(clip.filter.lut, ctx.assetsDir, ctx.userLutsDir)}` : "";
      const fxChain = buildEffectsChain(clip.effects);
      const effectsChain = fxChain ? `,${fxChain}` : "";
      // Phase 7 P2: enhancement — deinterlace + vidstabtransform áp TRƯỚC
      // speed (cùng đoạn nguồn đã phân tích ở pass detect), denoise áp SAU
      // scale/pad cùng vị trí effects (trên pixel output).
      const enhPre = buildEnhancePreChain(
        clip.enhance, ctx.stabTrf ? ctx.stabTrf.get(clip.id) : undefined);
      const enhPost = buildEnhancePostChain(clip.enhance);
      // Plugin (Batch J wiring): filters từ hook onClipRender của các plugin
      // trong spec.plugins. Vị trí: SAU effects — tức sau toàn bộ pipeline
      // pixel của chính clip (speed → chroma → scale/pad → color → LUT →
      // effects), để plugin thấy hình cuối của clip; nhưng TRƯỚC xfade và
      // opacity vì hai thứ đó thuộc tầng timeline (gộp các clip / đặt unit
      // lên nền), không thuộc tầng clip. Tại điểm này frame đã scale/pad về
      // đúng WxH nên biểu thức theo w/h của plugin (vd drawtext watermark ở
      // góc dưới-phải) khớp khung hình output. ctx.pluginFiltersFor === null
      // khi spec không khai plugin → chain giữ nguyên như cũ.
      const pluginFilters = ctx.pluginFiltersFor ? ctx.pluginFiltersFor(clip) : [];
      const pluginChain = pluginFilters.length ? `,${pluginFilters.join(",")}` : "";
      // P0-05/R1-012: khi có chroma key, GIỮ alpha xuyên suốt chain.
      // - buildChromaFilter đã output yuva420p (có alpha từ chromakey)
      // - pad phải dùng màu trong suốt (black@0), không phải black đục
      // - format cuối phải là yuva420p, KHÔNG được convert về yuv420p (sẽ mất alpha)
      // - overlay filter tự composite bằng alpha channel
      // R1-084: video nguồn đã có alpha (VD: output của bgremove.py — MOV PNG rgba)
      // được tự động phát hiện qua probe pix_fmt, xử lý giống chromaKey.
      // Keyframes scale/rotation: cũng cần giữ alpha — khi element thu nhỏ/xoay,
      // vùng letterbox và góc xoay phải TRONG SUỐT để lộ nội dung bên dưới thay
      // vì vẽ đè hình chữ nhật đen (transform áp ở bước đặt timeline bên dưới).
      const hasChroma = !!clip.chromaKey;
      const hasSrcAlpha = hasAlphaVideo(absOf(clip.src));
      const keepAlpha = hasChroma || hasSrcAlpha ||
        (hasScaleRotation(clip.animations) && !mergeInvolved.has(clip.id));
      const padColor = keepAlpha ? "black@0" : "black";
      const outFormat = keepAlpha ? "yuva420p" : "yuv420p";
      // Phase 7 P3: speed ramp — clip chia thành đoạn ~0.2s, mỗi đoạn tốc độ hằng
      // rồi concat. Đường thường (không ramp) giữ nguyên 100% bên dưới.
      const isRamp = clip.speedKeyframes && clip.speedKeyframes.keyframes &&
        clip.speedKeyframes.keyframes.length > 0;
      if (isRamp) {
        // enhance pre-chain vẫn áp trước speed trong từng đoạn (giống thứ tự gốc).
        // stabilize + ramp bị chặn ở cả validator và đây (trf detect không khớp đoạn ramp).
        if (hasStabilize(clip.enhance)) {
          throw new Error(`clip "${clip.id}": speedKeyframes không dùng chung được với enhance.stabilize (vidstab detect theo trim gốc, không khớp các đoạn ramp)`);
        }
        const { lines, label } = buildSpeedRampVideo(`[${idx}:v]`, clip, {
          W, H, fps, outFormat, padColor, lbl,
          enhPreChain: enhPre,
          preScaleChain: chromaChain,
          postChain: `${colorChain}${lutChain}${effectsChain}${enhPost}${pluginChain}`,
        });
        fc.push(...lines);
        let unitLabel = label;
        if (clip.mask) {
          const mc = buildMaskChain(unitLabel, clip.mask, W, H, lbl);
          fc.push(...mc.entries);
          unitLabel = mc.outLabel;
        }
        return {
          label: unitLabel, clip,
          start: clip.start, duration: clip.duration,
          declaredEnd: clip.start + clip.duration,
        };
      }
      fc.push(
        `[${idx}:v]` +
        `trim=start=${num(clip.in)}:end=${num(clip.in + clip.duration * (clip.speed ?? 1))},` +
        `setpts=PTS-STARTPTS${enhPre}${speedChain}${chromaChain},` +
        // Giữ tỉ lệ gốc, letterbox bằng nền đen (hoặc trong suốt nếu chroma) cho vừa khít khung hình output.
        `scale=${W}:${H}:force_original_aspect_ratio=decrease,` +
        `pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=${padColor},` +
        `setsar=1,fps=${fps},format=${outFormat}${colorChain}${lutChain}${effectsChain}${enhPost}${pluginChain}` +
        `[${v}]`
      );
      // Phase 7 P4: mask — áp SAU effects/plugin, trên pixel WxH đã chuẩn hoá,
      // trước xfade/timeline, nên mask là thuộc tính của clip và đi qua
      // transition cùng clip. Mask chain xuất yuva420p (cần alpha để overlay
      // composite đúng); alpha gốc được giữ, không ghi đè.
      let unitLabel = `[${v}]`;
      if (clip.mask) {
        const mc = buildMaskChain(unitLabel, clip.mask, W, H, lbl);
        fc.push(...mc.entries);
        unitLabel = mc.outLabel;
      }
      return {
        label: unitLabel, clip,
        start: clip.start, duration: clip.duration,
        declaredEnd: clip.start + clip.duration, // vị trí kết thúc theo spec (để kiểm tra kề nhau)
      };
    });

    // Bước 2: gộp các cặp clip kề nhau có transition bằng xfade.
    // Ngữ nghĩa (đã ghi trong README): T giây cuối của clip A crossfade với T giây đầu
    // của clip B — nội dung B bắt đầu sớm hơn T giây so với start đã khai báo.
    // xfade([A],[B], duration=T, offset=dA-T) cho ra stream dài dA+dB-T.
    // Phase 3: dùng buildXfadeFilter để hỗ trợ 13 loại transition (fade, wipe, slide, fx...).
    const trackUnits = [];
    let cur = null;
    for (const seg of segs) {
      let merged = false;
      if (cur) {
        const tr = transMap.get(`${track.id}:${cur.clip.id}`);
        if (tr && tr.to === seg.clip.id && tr.duration > EPS) {
          const T = tr.duration;
          const x = lbl("x");
          fc.push(
            `${cur.label}${seg.label}` +
            buildXfadeFilter(tr.type, T, cur.duration - T) +
            `[${x}]`
          );
          cur = {
            label: `[${x}]`, clip: seg.clip,
            start: cur.start,
            duration: cur.duration + seg.duration - T,
            declaredEnd: seg.declaredEnd,
            merged: true, // đánh dấu đã qua xfade (keyframes video không áp dụng cho unit đã merge)
          };
          merged = true;
        }
      }
      if (!merged) {
        if (cur) trackUnits.push(cur);
        cur = seg;
      }
    }
    if (cur) trackUnits.push(cur);
    units.push(...trackUnits);
  }

  // ===== VIDEO: đặt từng unit lên timeline =====
  // Công thức đã kiểm chứng thực tế (test với color source):
  //   setpts=PTS+S/TB  → dời timestamp của unit tới vị trí S trên timeline,
  //   overlay=eof_action=pass → trước S hiện nền, trong [S, S+dur) hiện unit, sau đó trả về nền.
  // overlay đồng bộ frame theo timestamp nên KHÔNG dùng enable=... (tránh lệch frame).
  // Phase 3: keyframes x/y cho video clip (chỉ unit đơn, không qua xfade) — biểu thức
  // overlay theo thời gian timeline t; thời gian cục bộ = (t - start).
  fc.push(`color=c=black:s=${W}x${H}:r=${fps}:d=${num(D)},format=yuv420p[base0]`);
  let base = "[base0]";
  for (const u of units) {
    const p = lbl("pl"), b = lbl("base");
    // Opacity — áp sau khi unit đã hoàn chỉnh (kể cả xfade merge):
    // - Tĩnh (R1-011): format=rgba + colorchannelmixer nhân alpha, overlay
    //   composite bằng alpha. opacity ≈ 1 → không thêm filter (giữ nguyên
    //   pipeline cũ, không tốn hiệu năng).
    // - Keyframes (K1, Phase 6, chỉ unit đơn — unit đã merge thì validator
    //   đã cảnh báo và rơi về nhánh tĩnh bên dưới): chuỗi tách nhánh qua
    //   alphamerge (xem opacity.js — colorchannelmixer không nhận biến t,
    //   geq không đọc được alpha gốc). Chuỗi này KHÔNG tuyến tính nên phải
    //   push fc entry riêng và đổi label đầu vào của bước sau.
    let head = u.label;
    let headChain = "";
    const hasOpKf = !u.merged && u.clip.animations && u.clip.animations.opacity;
    if (hasOpKf) {
      const ch = buildOpacityKeyframesChain(u.label, u.clip.animations.opacity, lbl);
      for (const e of ch.entries) fc.push(e);
      head = ch.outLabel;
    } else {
      const opFilter = buildOpacityFilter(u.clip.opacity);
      headChain = opFilter ? `${opFilter},` : "";
    }
    // Keyframes scale/rotation (chỉ unit đơn, không qua xfade): chuỗi scale
    // eval=frame + rotate theo biểu thức nội suy, chèn SAU opacity và TRƯỚC
    // setpts lên timeline — tại điểm này timestamp của frame là thời gian cục
    // bộ của clip nên biểu thức dùng t trực tiếp (xem buildKeyframeTransform).
    const srChain = !u.merged && hasScaleRotation(u.clip.animations)
      ? `${buildKeyframeTransform(u.clip.animations)},`
      : "";
    fc.push(`${head}${headChain}${srChain}setpts=PTS+${num(u.start)}/TB[${p}]`);
    let ox = "0", oy = "0";
    // Khi có scale/rotation, unit không còn đúng kích thước khung hình nữa:
    // overlay_w/overlay_h thay đổi theo từng frame và biểu thức overlay (kể cả
    // mặc định căn giữa của buildOverlayExprs) mới có tác dụng thật — đây cũng
    // là lúc keyframes x/y bắt đầu nhìn thấy được (trước đây unit luôn full
    // khung nên (main_w-overlay_w) = 0). Xem KEYFRAMES_LIMITS.md.
    if (!u.merged && u.clip.animations &&
        (u.clip.animations.x || u.clip.animations.y ||
         u.clip.animations.scale || u.clip.animations.rotation)) {
      const oe = buildOverlayExprs(u.clip.animations, u.start);
      ox = oe.x; oy = oe.y;
    }
    // Biểu thức x/y chứa dấu phẩy (if(lt(...),...)) nên PHẢI bọc trong nháy đơn,
    // nếu không FFmpeg tách nhầm filter và render crash (đã kiểm chứng).
    // Demo keyframes-video.mp4 dùng cách quote này và chạy đúng.
    fc.push(`${base}[${p}]overlay=x='${ox}':y='${oy}':eof_action=pass[${b}]`);
    base = `[${b}]`;
  }

  // ===== IMAGE: ảnh tĩnh thành clip full-frame (sau video, trước sticker) =====
  // P0-03: mỗi image clip được loop thành stream đúng duration (buildImageChain)
  // rồi đặt lên timeline bằng setpts + overlay — giống hệt pattern video unit.
  // Thứ tự composite: video → image → sticker → text.
  // R1-054: track image bị hidden → bỏ qua.
  for (const track of spec.tracks.filter((t) => t.kind === "image" && !t.hidden)) {
    const clips = [...track.clips].sort((a, b) => a.start - b.start);
    for (const clip of clips) {
      const idx = mediaIndex.get(absOf(clip.src));
      const v = lbl("img");
      fc.push(`[${idx}:v]${buildImageChain(clip, W, H, fps)}[${v}]`);
      // Phase 7 P4: mask cho image — áp sau khi ảnh đã lấp đầy khung hình,
      // trước setpts/overlay (giống pattern video unit).
      let imgLabel = `[${v}]`;
      if (clip.mask) {
        const mc = buildMaskChain(imgLabel, clip.mask, W, H, lbl);
        fc.push(...mc.entries);
        imgLabel = mc.outLabel;
      }
      const p = lbl("imgp"), b = lbl("imgb");
      fc.push(`${imgLabel}setpts=PTS+${num(clip.start)}/TB[${p}]`);
      fc.push(`${base}[${p}]overlay=0:0:eof_action=pass[${b}]`);
      base = `[${b}]`;
    }
  }

  // ===== STICKER: overlay PNG lên timeline (sau video, trước text) =====
  // Phase 3c: mỗi sticker clip được load, scale/rotate/opacity rồi overlay tại (x,y).
  let vcur_sticker = base;
  const stickerClips = [];
  // R1-054: track sticker bị hidden → bỏ qua.
  for (const track of spec.tracks.filter((t) => t.kind === "sticker" && !t.hidden))
    for (const clip of track.clips) stickerClips.push(clip);
  if (stickerClips.length > 0) {
    // Register sticker PNG files as inputs (cần absOf + mediaIndex — dùng register pattern)
    // Lưu ý: sticker src được resolve qua absOf (mediaDir). Đảm bảo file đã register ở main.
    for (const clip of stickerClips) {
      const { filter, x, y, tracked } = buildStickerOverlay(clip, W, H);
      const idx = mediaIndex.get(absOf(clip.src));
      const s = lbl("stk");
      // filter đã bao gồm loop/scale/rotate/opacity; overlay với enable theo thời gian
      const S = clip.start, E = clip.start + clip.duration;
      fc.push(`[${idx}:v]${filter}[${s}]`);
      const o = lbl("stko");
      // Phase 8 Q5: biểu thức track chứa dấu phẩy nên phải quote x/y; sticker
      // thường giữ dạng cũ không quote để không regression.
      if (tracked) {
        fc.push(`${vcur_sticker}[${s}]overlay=x='${x}':y='${y}':enable='between(t,${num(S)},${num(E)})':eof_action=pass[${o}]`);
      } else {
        fc.push(`${vcur_sticker}[${s}]overlay=${x}:${y}:enable='between(t,${num(S)},${num(E)})':eof_action=pass[${o}]`);
      }
      vcur_sticker = `[${o}]`;
    }
  }
  base = vcur_sticker;

  // ===== TEXT: drawtext cho animation "none" / "fadeUp" / keyframes / textfx =====
  // Phase 3: nếu clip có `animations`, dùng buildTextExprs (keyframes x/y/opacity)
  // và keyframes được ưu tiên hơn `fadeUp`.
  // Phase 3b: các animation mới (fadeIn, slideInLeft, ...) dùng buildTextAnimExpr.
  let vcur = base;
  // R1-054: track text bị hidden → bỏ qua (cả drawtext lẫn typewriter).
  for (const track of spec.tracks.filter((t) => t.kind === "text" && !t.hidden)) {
    for (const clip of track.clips) {
      if (clip.style.animation === "typewriter") continue; // xử lý riêng bằng ASS bên dưới
      const st = clip.style;
      const S = clip.start, E = clip.start + clip.duration;
      // K1 (Phase 6): text clip có keyframes scale/rotation — drawtext không
      // làm được nên chữ đã được vẽ trước ra PNG trong suốt (main() +
      // render_text_png.py; clip nào fallback vì thiếu PIL thì không có trong
      // ctx.textSrPng và đi nhánh drawtext cũ bên dưới).
      // Chain PNG mirror pattern video unit: loop → fps cố định → setpts về 0
      // (để t = thời gian cục bộ) → opacity keyframes (nếu có, qua alphamerge)
      // → SR transform → trim về đúng duration → setpts lên timeline →
      // overlay với x/y expressions (giống SR video: x/y là phần của khoảng
      // trống còn lại, khớp ngữ nghĩa drawtext x=(w-text_w)*sx).
      if (ctx.textSrPng && ctx.textSrPng.has(clip.id)) {
        const idx = ctx.textSrPng.get(clip.id);
        const t0 = lbl("txt0");
        fc.push(`[${idx}:v]loop=loop=-1:size=32767,fps=${fps},setpts=PTS-STARTPTS[${t0}]`);
        let cur = `[${t0}]`;
        if (clip.animations.opacity) {
          const ch = buildOpacityKeyframesChain(cur, clip.animations.opacity, lbl);
          for (const e of ch.entries) fc.push(e);
          cur = ch.outLabel;
        }
        // rotateExpand: PNG text crop sát nên rotate phải mở output ra hình
        // vuông đường chéo, nếu không chữ bị cắt khi xoay (rotate mặc định
        // giữ iw/ih — đúng cho video full-frame nhưng sai cho PNG text).
        const srT = buildKeyframeTransform(clip.animations, { rotateExpand: true });
        const srChainTxt = srT ? `${srT},` : "";
        const tp = lbl("txtp");
        fc.push(`${cur}${srChainTxt}trim=end=${num(clip.duration)},setpts=PTS+${num(S)}/TB[${tp}]`);
        const oe = buildOverlayExprs(clip.animations, S);
        const tb = lbl("txtb");
        fc.push(`${vcur}[${tp}]overlay=x='${oe.x}':y='${oe.y}':eof_action=pass[${tb}]`);
        vcur = `[${tb}]`;
        continue;
      }
      let fx, fy, extra = "";
      if (clip.animations && (clip.animations.x || clip.animations.y || clip.animations.opacity)) {
        const te = buildTextExprs(clip.animations, st, S);
        fx = te.x; fy = te.y;
        extra += `:alpha='${te.alpha}'`;
      } else if (isTextFxAnimation(st.animation) && st.animation !== "none" && st.animation !== "fadeUp") {
        // Batch G (R1-070): truyền clipEnd cho exit animations (fadeOut, slideOutRight...).
        const te = buildTextAnimExpr(st.animation, st, S, E);
        fx = te.x; fy = te.y;
        extra += `:alpha='${te.alpha}'`;
      } else {
        fx = `(w-text_w)*${st.x ?? 0.5}`;
        fy = `(h-text_h)*${st.y ?? 0.5}`;
        if (st.animation === "fadeUp") {
          // Hiện dần + trồi lên 30px trong 0.6 giây đầu — alpha và y đều là biểu thức theo t.
          const k = `min(1,(t-${num(S)})/0.6)`;
          fy = `(h-text_h)*${st.y ?? 0.5}-30*(1-${k})`;
          extra += `:alpha='${k}'`;
        }
      }
      if (st.backgroundColor) {
        extra += `:box=1:boxcolor=${st.backgroundColor}:boxborderw=${Math.max(4, Math.round(st.fontSize / 4))}`;
      }
      const d = lbl("dt");
      fc.push(
        `${vcur}drawtext=` +
        `fontfile='${escapeFilterPath(fontFiles.get(clip.id))}':` +
        `text='${escapeDrawtext(clip.text)}':` +
        `fontsize=${st.fontSize}:fontcolor=${st.color}:` +
        `x='${fx}':y='${fy}':` +
        `enable='between(t,${num(S)},${num(E)})'${extra}` +
        `[${d}]`
      );
      vcur = `[${d}]`;
    }
  }

  // ===== TEXT: typewriter qua file ASS + filter subtitles (libass) =====
  const twClips = [];
  for (const track of spec.tracks.filter((t) => t.kind === "text" && !t.hidden))
    for (const clip of track.clips)
      if (clip.style.animation === "typewriter") twClips.push(clip);
  let assFile = null;
  if (twClips.length > 0) {
    assFile = buildTypewriterAss(twClips, { width: W, height: H });
    const s = lbl("sub");
    fc.push(`${vcur}subtitles='${escapeFilterPath(assFile)}'[${s}]`);
    vcur = `[${s}]`;
  }

  // ===== AUDIO =====
  // Mỗi clip: cắt [in, in+duration*speed) → speed/reverse → chuẩn 48kHz stereo
  // → volume → afade → adelay tới vị trí start trên timeline. Rồi trộn bằng amix.
  // Phase 7 P3: clip có speedKeyframes → chia đoạn concat (không dùng speed hằng);
  // clip có volumeKeyframes hoặc fade cong → 1 filter volume eval=frame thay cho
  // volume + afade; track.volume nhân vào gain; normalize áp sau amix.
  //
  // R1-015: audio của VIDEO clip được xử lý theo `sourceAudioMode`:
  // - "inherit" (mặc định): trích audio từ video source, áp cùng trim/speed/reverse.
  // - "mute": bỏ qua. - "detach": chưa hỗ trợ (validate.js báo lỗi).
  const aseg = [];
  // Helper dựng chain audio cho 1 clip (dùng chung cho audio clip và video inherit).
  // streamRef: `[idx:a]` — audio stream của file nguồn.
  // Phase 7 P3: thêm trackVolume (nhân vào gain) + speed ramp (segment concat)
  // + gain expression (volumeKeyframes / fade cong). Không ramp, không keyframes,
  // không fade cong → chain cũ 100% (volume + afade tĩnh).
  const buildAudioChain = (streamRef, clip, label, trackVolume = 1) => {
    const a = lbl(label);
    const isRamp = clip.speedKeyframes && clip.speedKeyframes.keyframes &&
      clip.speedKeyframes.keyframes.length > 0;
    let chain;
    if (isRamp) {
      const { lines, label: rlab } = buildSpeedRampAudio(streamRef, clip, { lbl });
      fc.push(...lines);
      chain = `${rlab}aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo`;
    } else {
      const spd = clip.speed ?? 1;
      const spdF = buildSpeedFilter(spd, clip.reverse ?? false);
      const speedChain = spdF.audio ? `,${spdF.audio}` : "";
      chain =
        `${streamRef}` +
        `atrim=start=${num(clip.in)}:end=${num(clip.in + clip.duration * spd)},` +
        `asetpts=PTS-STARTPTS${speedChain},aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo`;
    }
    // R1-076: audio effects (bass → treble → noiseReduction → compressor → reverb),
    // áp dụng sau aformat, trước volume.
    chain += buildAudioEffectsFilters(clip.audioEffects);
    const gainFilter = buildGainFilter(clip, trackVolume);
    if (gainFilter) {
      // Đường expression thay thế HOÀN TOÀN volume + afade tĩnh (đã gộp trong expr).
      chain += `,${gainFilter}`;
    } else {
      const vol = (clip.volume ?? 1) * trackVolume;
      if (Math.abs(vol - 1) > EPS) chain += `,volume=${num(vol)}`;
      if ((clip.fadeIn ?? 0) > EPS) chain += `,afade=t=in:st=0:d=${num(clip.fadeIn)}`;
      if ((clip.fadeOut ?? 0) > EPS)
        chain += `,afade=t=out:st=${num(clip.duration - clip.fadeOut)}:d=${num(clip.fadeOut)}`;
    }
    chain += `,adelay=${Math.round(clip.start * 1000)}:all=1[${a}]`;
    fc.push(chain);
    aseg.push(`[${a}]`);
  };
  // R1-054: track audio bị muted → bỏ qua toàn bộ (câm).
  for (const track of spec.tracks.filter((t) => t.kind === "audio" && !t.muted)) {
    for (const clip of track.clips) {
      const idx = mediaIndex.get(absOf(clip.src));
      buildAudioChain(`[${idx}:a]`, clip, "ac", track.volume ?? 1);
    }
  }
  // Audio inherit từ video clip (R1-015).
  // R1-054: track video bị muted → bỏ qua audio kế thừa (vẫn render hình).
  // FIX: chỉ inherit khi file thật sự có audio stream (kiểm tra qua mediaProbes
  // từ validateMedia). Nếu không, bỏ qua lặng lẽ — validator đã warn.
  const hasAudioStream = (abs) => {
    if (!mediaProbes) return true; // không có probe data → giữ hành vi cũ
    const probe = mediaProbes.get(abs);
    if (!probe || !probe.streams) return false;
    return probe.streams.some((s) => s.codec_type === "audio");
  };
  // R1-054: track video bị muted → bỏ qua audio kế thừa (vẫn render hình ở trên).
  for (const track of spec.tracks.filter((t) => t.kind === "video" && !t.muted)) {
    for (const clip of track.clips) {
      const mode = clip.sourceAudioMode ?? "inherit";
      if (mode === "mute") continue;
      if (mode === "detach") {
        // validate.js đã chặn — tới đây nghĩa là validator bị bypass; fail fast.
        throw new Error(
          `clip "${clip.id}": sourceAudioMode="detach" chưa được hỗ trợ ` +
          `(render worker chỉ hỗ trợ "inherit" | "mute")`
        );
      }
      const abs = absOf(clip.src);
      if (!hasAudioStream(abs)) continue; // file câm → không add [idx:a]
      const idx = mediaIndex.get(abs);
      buildAudioChain(`[${idx}:a]`, clip, "va", track.volume ?? 1);
    }
  }
  let aout;
  if (aseg.length === 0) {
    // Không có track audio: tạo track câm để output luôn có audio stream (đúng hợp đồng H.264+AAC).
    fc.push(`anullsrc=r=48000:cl=stereo:d=${num(D)}[aout0]`);
    aout = "[aout0]";
  } else {
    const mixed = lbl("amx");
    // amix duration=longest: output dài bằng clip kết thúc muộn nhất; apad bù câm tới D.
    // Phase 7 P3: normalize (export option) áp SAU apad/atrim, trên stream đã mix.
    const normFilter = buildNormalizeFilter(ctx.normalize || null);
    const normChain = normFilter ? `,${normFilter}` : "";
    fc.push(
      `${aseg.join("")}amix=inputs=${aseg.length}:duration=longest:dropout_transition=0,` +
      `apad=whole_dur=${num(D)},atrim=0:${num(D)}${normChain}[${mixed}]`
    );
    aout = `[${mixed}]`;
  }

  // Phase 7 P2: VA-API cần upload frame lên hardware ở cuối graph (sau mọi
  // xử lý pixel, trước encoder). Chỉ khi ctx.vaapi (encoder h264_vaapi).
  let vfinal = vcur;
  if (ctx.vaapi) {
    const hv = lbl("hw");
    fc.push(`${vcur}format=nv12,hwupload[${hv}]`);
    vfinal = `[${hv}]`;
  }

  return { filterComplex: fc.join(";"), vout: vfinal, aout, assFile };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  const args = parseArgs(process.argv);
  const log = (...m) => { if (!args.quiet) console.log(...m); };

  // 1. Đọc spec
  let raw;
  try {
    raw = fs.readFileSync(args.spec, "utf8");
  } catch {
    console.error(`❌ Không đọc được file spec: ${args.spec}`);
    process.exit(2);
  }
  let spec;
  try {
    spec = JSON.parse(raw);
  } catch (e) {
    console.error(`❌ File spec không phải JSON hợp lệ: ${e.message}`);
    process.exit(1);
  }
  if (!isVideoSpec(spec)) {
    console.error(
      `❌ Spec không qua kiểm tra tối thiểu (isVideoSpec): ` +
      `cần { version: "${SPEC_VERSION}", meta: {...}, tracks: [...] }`
    );
    process.exit(1);
  }

  // 2a. P7: nạp asset map nếu có (map asset id → file, do bridge/export
  // truyền kèm). File hỏng / không phải object → fail fast, không đoán.
  let assetMap = null;
  if (args.assetMapPath) {
    try {
      const parsed = JSON.parse(fs.readFileSync(args.assetMapPath, "utf8"));
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("asset map phải là JSON object { assetId: file }");
      }
      for (const [k, val] of Object.entries(parsed)) {
        if (typeof val !== "string" || !val) {
          throw new Error(`asset map: giá trị của "${k}" phải là chuỗi đường dẫn khác rỗng`);
        }
      }
      assetMap = parsed;
    } catch (e) {
      console.error(`❌ Không nạp được asset map (${args.assetMapPath}): ${e.message}`);
      process.exit(2);
    }
  }

  // 2. Validate cấu trúc
  const v = validateSpec(spec);
  for (const w of v.warnings) console.error(`⚠️  ${w}`);
  if (!v.ok) {
    console.error(`\n❌ Spec không hợp lệ (${v.errors.length} lỗi):`);
    v.errors.forEach((e, i) => console.error(`  ${i + 1}. ${e}`));
    process.exit(1);
  }

  // 2b. Plugin host (Batch J wiring) — chỉ khi spec khai `plugins`.
  // Nạp plugin thất bại → fail fast (không lặng lẽ render thiếu thứ user
  // đã khai). onProjectValidate của plugin: errors chặn render như lỗi
  // validate thường, warnings in ra stderr (vào job log của bridge).
  let pluginHost = null;
  if (Array.isArray(spec.plugins) && spec.plugins.length > 0) {
    try {
      pluginHost = createPluginHost(spec, path.dirname(path.resolve(args.spec)));
    } catch (e) {
      console.error(`❌ Plugin: ${e.message}`);
      process.exit(1);
    }
    log(`   plugin đã nạp: ${pluginHost.loaded.map((p) => p.name).join(", ")}`);
    const pv = pluginHost.validateProject(spec);
    for (const w of pv.warnings) console.error(`⚠️  ${w}`);
    if (pv.errors.length > 0) {
      console.error(`\n❌ Plugin chặn render (${pv.errors.length} lỗi):`);
      pv.errors.forEach((e, i) => console.error(`  ${i + 1}. ${e}`));
      process.exit(1);
    }
  }

  const meta = spec.meta;
  const D = projectDuration(spec);
  const mediaDir = args.mediaDir
    ? path.resolve(args.mediaDir)
    : path.join(path.dirname(path.resolve(args.spec)), "media");
  const absOf = (src) => resolveSrc(src, mediaDir, assetMap);

  // 3. Validate media
  const mv = validateMedia(spec, mediaDir, args.ffprobe, assetMap);
  for (const w of mv.warnings) console.error(`⚠️  ${w}`);
  if (!mv.ok) {
    console.error(`\n❌ Media không hợp lệ (${mv.errors.length} lỗi):`);
    mv.errors.forEach((e, i) => console.error(`  ${i + 1}. ${e}`));
    process.exit(1);
  }

  // 3b. Phase 7 P2: enhancement — kiểm tra filter có sẵn + pass 1 vidstabdetect.
  // Detect phân tích đúng đoạn nguồn mà graph chính sẽ dùng (cùng trim), nên
  // phải chạy TRƯỚC khi dựng graph. Fail fast (không lặng lẽ bỏ stabilize):
  // user đã khai stabilize thì render thiếu nó là sai hợp đồng.
  const stabTrf = new Map(); // clipId -> trfPath
  const stabTrfPaths = [];
  {
    const videoClips = [];
    for (const track of spec.tracks.filter((t) => t.kind === "video" && !t.hidden))
      for (const clip of track.clips) videoClips.push(clip);
    const needsStab = videoClips.filter((c) => hasStabilize(c.enhance));
    const needsYadif = videoClips.some((c) => c.enhance && c.enhance.deinterlace !== undefined);
    const needsDenoise = videoClips.some((c) => c.enhance && c.enhance.denoise !== undefined);
    if (needsStab.length > 0 || needsYadif || needsDenoise) {
      const sup = probeFilterSupport(args.ffmpeg);
      if (needsYadif && !sup.yadif) {
        console.error("❌ FFmpeg build này thiếu filter yadif — không render được deinterlace");
        process.exit(1);
      }
      if (needsDenoise && !sup.hqdn3d) {
        console.error("❌ FFmpeg build này thiếu filter hqdn3d — không render được denoise");
        process.exit(1);
      }
      if (needsStab.length > 0) {
        if (!sup.vidstabdetect || !sup.vidstabtransform) {
          console.error(`❌ FFmpeg build này thiếu filter vidstab (detect=${sup.vidstabdetect}, transform=${sup.vidstabtransform}) — không render được stabilize`);
          process.exit(1);
        }
        for (const clip of needsStab) {
          const safeId = clip.id.replace(/[^A-Za-z0-9_-]/g, "_");
          const trfPath = path.join(os.tmpdir(), `repo1-vidstab-${process.pid}-${safeId}.trf`);
          if (args.dryRun) {
            // Dry-run chỉ in câu lệnh: không chạy detect thật, graph vẫn
            // hiện vidstabtransform với đường dẫn placeholder.
            stabTrf.set(clip.id, trfPath);
            stabTrfPaths.push(trfPath);
            continue;
          }
          const r = runStabilizeDetect(args.ffmpeg, absOf(clip.src), clip, trfPath);
          if (!r.ok) {
            console.error(`❌ vidstabdetect cho clip "${clip.id}" thất bại: ${r.error}`);
            process.exit(1);
          }
          stabTrf.set(clip.id, trfPath);
          stabTrfPaths.push(trfPath);
          log(`   stabilize "${clip.id}" → ${trfPath}`);
        }
      }
    }
  }

  // 3c. Phase 7 P2: chọn encoder video — auto probe GPU thật, fail → libx264.
  // Ép tay encoder mà probe fail → cảnh báo + fallback libx264 (KHÔNG fail job).
  let videoEncoder = "libx264";
  let encoderNote = "libx264 (CPU)";
  if (args.encoder === "auto") {
    const gp = probeGpuEncoder(args.ffmpeg);
    if (gp.encoder) {
      videoEncoder = gp.encoder;
      encoderNote = `${gp.encoder} (GPU auto-detect: ${gp.detail})`;
    } else {
      encoderNote = `libx264 (CPU — ${gp.detail})`;
    }
  } else if (args.encoder !== "libx264") {
    if (tryEncode(args.ffmpeg, args.encoder)) {
      videoEncoder = args.encoder;
      encoderNote = `${args.encoder} (ép tay, probe OK)`;
    } else {
      console.error(`⚠️  encoder ép tay ${args.encoder} probe thất bại → fallback libx264 (không fail job)`);
      encoderNote = `libx264 (CPU — ${args.encoder} probe thất bại, fallback)`;
    }
  }
  const encArgs = buildVideoEncodeArgs(videoEncoder, { crf: args.crf, preset: args.x264Preset });
  log(`   🎥 encoder video: ${encoderNote}`);

  // 4. Resolve font cho các text clip dùng drawtext (fail fast trước khi render)
  // R1-054: bỏ qua text track bị hidden (không render nên không cần font).
  const fontFiles = new Map();
  for (const track of spec.tracks.filter((t) => t.kind === "text" && !t.hidden)) {
    for (const clip of track.clips) {
      if (clip.style.animation === "typewriter") continue; // libass tự resolve qua fontconfig
      const f = resolveFontFile(clip.style.fontFamily, clip.style);
      if (!f) {
        console.error(`❌ Không tìm được font "${clip.style.fontFamily}" cho text clip "${clip.id}"`);
        process.exit(1);
      }
      fontFiles.set(clip.id, f);
      log(`   font "${clip.style.fontFamily}" → ${f}`);
    }
  }

  // K1 (Phase 6): text clip có keyframes scale/rotation — vẽ trước ra PNG
  // trong suốt bằng PIL (render_text_png.py). Clip nào vẽ thất bại (thiếu
  // python3/PIL/font) thì fallback về nhánh drawtext cũ + cảnh báo rõ
  // (không fail cả render vì 1 clip chữ — hành vi cũ vốn đã cảnh báo).
  const textSrPng = new Map(); // clipId -> pngPath (chỉ clip vẽ thành công)
  const textSrPngPaths = [];
  for (const track of spec.tracks.filter((t) => t.kind === "text" && !t.hidden)) {
    for (const clip of track.clips) {
      if (clip.style.animation === "typewriter") continue;
      if (!(clip.animations && (clip.animations.scale || clip.animations.rotation))) continue;
      const fontFile = fontFiles.get(clip.id);
      if (!fontFile) continue; // font đã fail fast ở bước trên nên không tới đây
      const pngPath = path.join(os.tmpdir(), `repo1-textsr-${process.pid}-${clip.id}.png`);
      const pad = Math.max(4, Math.round(clip.style.fontSize / 4)); // khớp boxborderw của drawtext
      const pyArgs = [
        path.join(__dirname, "render_text_png.py"),
        "--font", fontFile,
        "--size", String(clip.style.fontSize),
        "--color", clip.style.color,
        "--text", clip.text,
        "--out", pngPath,
        "--pad", String(pad),
      ];
      if (clip.style.backgroundColor) pyArgs.push("--bg", clip.style.backgroundColor);
      const pr = spawnSync("python3", pyArgs, { stdio: ["ignore", "pipe", "pipe"] });
      if (pr.error || pr.status !== 0) {
        console.error(`⚠️  text clip "${clip.id}": không vẽ được PNG cho scale/rotation ` +
          `(${(pr.stderr || "").toString().trim().slice(-200) || (pr.error && pr.error.message) || "lỗi không rõ"} — ` +
          `cần python3 + Pillow) → fallback về drawtext, scale/rotation bị bỏ qua`);
        continue;
      }
      textSrPng.set(clip.id, pngPath);
      textSrPngPaths.push(pngPath);
      log(`   text SR "${clip.id}" → ${pngPath}`);
    }
  }

  // 5. Đánh chỉ số input cho từng file media (mỗi file chỉ -i một lần)
  const mediaIndex = new Map();
  const orderedMedia = [];
  const register = (src) => {
    const abs = absOf(src);
    if (!mediaIndex.has(abs)) {
      mediaIndex.set(abs, orderedMedia.length);
      orderedMedia.push(abs);
    }
  };
  for (const track of spec.tracks)
    for (const clip of track.clips)
      if (clip.src) register(clip.src);
  // Đăng ký PNG text SR làm input (đường dẫn tuyệt đối, không qua absOf).
  const textSrPngIdx = new Map();
  for (const [clipId, pngPath] of textSrPng) {
    if (!mediaIndex.has(pngPath)) {
      mediaIndex.set(pngPath, orderedMedia.length);
      orderedMedia.push(pngPath);
    }
    textSrPngIdx.set(clipId, mediaIndex.get(pngPath));
  }

  // 6. Dựng filter graph
  const { filterComplex, vout, aout, assFile } = buildFilterGraph(spec, {
    W: meta.width, H: meta.height, fps: meta.fps, D,
    mediaIndex, absOf, transitions: v.transitions, fontFiles,
    assetsDir: path.join(__dirname, "..", "..", "..", "assets"),
    // K3: LUT user resolve từ mediaDir (file __lut_<id>.cube upload kèm spec).
    userLutsDir: mediaDir,
    mediaProbes: mv.probes, // R1-015 fix: check audio stream trước khi inherit
    // Plugin wiring: null khi spec không khai plugin (hành vi cũ 100%).
    pluginFiltersFor: pluginHost
      ? (clip) => pluginHost.filtersForClip(clip, { width: meta.width, height: meta.height, fps: meta.fps })
      : null,
    // K1: map clipId -> input index của PNG text SR (rỗng nếu không có clip SR).
    textSrPng: textSrPngIdx,
    // Phase 7 P2: map clipId -> file .trf vidstabdetect + cờ VA-API.
    stabTrf,
    vaapi: videoEncoder === "h264_vaapi",
    // Phase 7 P3: normalize export (áp sau amix; off = không đổi).
    normalize: {
      mode: args.normalize,
      target: args.normalizeTarget,
      tp: args.normalizeTp,
      lra: args.normalizeLra,
    },
  });

  // Plugin: lỗi hook onClipRender gom được khi dựng graph — in ra stderr
  // để bridge gom vào job log (hook lỗi KHÔNG chặn render, theo thiết kế registry).
  if (pluginHost) {
    for (const [name, msg] of Object.entries(pluginHost.hookErrors))
      console.error(`⚠️  plugin "${name}": ${msg}`);
  }

  const outAbs = path.resolve(args.out);
  if (fs.existsSync(outAbs) && !args.overwrite) {
    console.error(`❌ File output đã tồn tại: ${outAbs} (dùng -y để ghi đè)`);
    process.exit(2);
  }

  const ffArgs = [];
  // R1-065: "-stats" bật tường minh (dù là mặc định của ffmpeg) để bridge
  // server luôn parse được tiến trình (time=/frame=) từ stderr — ai đó thêm
  // "-v error" sau này cũng không làm mất progress.
  ffArgs.push("-stats");
  // Phase 7 P2: VA-API cần device trước inputs.
  if (videoEncoder === "h264_vaapi") ffArgs.push("-vaapi_device", "/dev/dri/renderD128");
  for (const m of orderedMedia) ffArgs.push("-i", m);
  ffArgs.push(
    "-filter_complex", filterComplex,
    "-map", vout, "-map", aout,
    ...encArgs.args,
  );
  // VA-API tự quản lý surface (pixFmt null) — không ép -pix_fmt.
  if (encArgs.pixFmt) ffArgs.push("-pix_fmt", encArgs.pixFmt);
  ffArgs.push(
    "-r", String(meta.fps),
    "-c:a", "aac", "-b:a", args.audioBitrate, "-ar", "48000", "-ac", "2",
    "-movflags", "+faststart",
    "-t", num(D),
    "-y", outAbs
  );

  if (args.dryRun) {
    console.log([args.ffmpeg, ...ffArgs.map((a) => (/\s/.test(a) ? `'${a}'` : a))].join(" "));
    return;
  }

  // 7. Chạy ffmpeg
  log(`🎬 Render "${meta.name}" → ${outAbs}`);
  log(`   ${meta.width}x${meta.height} @ ${meta.fps}fps, thời lượng ${num(D)}s, ` +
    `${orderedMedia.length} file media, ${v.transitions.length} transition, ` +
    `encoder=${videoEncoder} crf=${args.crf} preset=${args.x264Preset} audio=${args.audioBitrate}`);
  const t0 = Date.now();
  // Plugin: onExportStart (quan sát, ngay trước khi ffmpeg chạy; dry-run đã
  // return ở trên nên hook không cháy khi không export thật). Lỗi hook chỉ
  // log ra stderr, không chặn render.
  const pluginExportCtx = {
    projectName: meta.name,
    preset: { id: "cli", width: meta.width, height: meta.height },
    outputPath: outAbs,
  };
  if (pluginHost) {
    const rep = pluginHost.exportStart(pluginExportCtx);
    for (const [name, msg] of Object.entries(rep.hookErrors))
      console.error(`⚠️  plugin "${name}" (onExportStart): ${msg}`);
  }
  const r = spawnSync(args.ffmpeg, ffArgs, {
    stdio: ["ignore", "ignore", args.quiet ? "ignore" : "inherit"],
  });
  const dt = ((Date.now() - t0) / 1000).toFixed(1);

  // Plugin: onExportFinish — chạy cả khi render thất bại (success=false).
  // Warnings plugin trả về in ra stderr để bridge gom vào kết quả job
  // (job._stderrTail); lỗi hook cũng vậy, không đổi mã thoát của render.
  if (pluginHost) {
    const rep = pluginHost.exportFinish({
      ...pluginExportCtx,
      success: !r.error && r.status === 0,
      durationMs: Date.now() - t0,
    });
    for (const w of rep.warnings) console.error(`⚠️  ${w}`);
    for (const [name, msg] of Object.entries(rep.hookErrors))
      console.error(`⚠️  plugin "${name}" (onExportFinish): ${msg}`);
  }

  // Dọn file ASS tạm (giữ lại khi lỗi để debug)
  if (assFile && r.status === 0) {
    try { fs.unlinkSync(assFile); } catch { /* bỏ qua */ }
  } else if (assFile) {
    console.error(`   (giữ file ASS tạm để debug: ${assFile})`);
  }
  // Dọn PNG text SR tạm (giữ lại khi lỗi để debug, giống ASS).
  if (r.status === 0) {
    for (const p of textSrPngPaths) { try { fs.unlinkSync(p); } catch { /* bỏ qua */ } }
  } else if (textSrPngPaths.length > 0) {
    console.error(`   (giữ PNG text SR tạm để debug: ${textSrPngPaths.join(", ")})`);
  }
  // Phase 7 P2: dọn file .trf vidstab tạm (giữ lại khi lỗi để debug).
  // Dry-run return sớm ở trên nên không tới đây — file trf dry-run chỉ là
  // placeholder, không tồn tại thật nên không cần dọn.
  if (r.status === 0) {
    for (const p of stabTrfPaths) { try { fs.unlinkSync(p); } catch { /* bỏ qua */ } }
  } else if (stabTrfPaths.length > 0) {
    console.error(`   (giữ file .trf vidstab tạm để debug: ${stabTrfPaths.join(", ")})`);
  }

  if (r.error) {
    console.error(`\n❌ Không chạy được ffmpeg: ${r.error.message}`);
    process.exit(2);
  }
  if (r.status !== 0) {
    console.error(`\n❌ ffmpeg thoát với mã ${r.status} — render thất bại`);
    process.exit(2);
  }
  log(`\n✅ Xong trong ${dt}s → ${outAbs}`);
}

main();
