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
// Phase 9 đợt 10 V4: text animation rotate/skew/clip qua ASS (không phải drawtext).
const { isParityAnimation, buildParityAss } = require("./textAnimParity");
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
const { buildMaskChain, buildMaskChainFor, buildMaskAnimChain, buildMaskPngChain, maskKey, maskAnimKey, hasMaskKeyframes, maskGeometryAt, normalizeMask } = require("./mask");
// Phase 9 D3: motion tracking cho video/text (cùng biểu thức sticker Q5).
const { buildAxisExpr, buildTrackOverlayExprs } = require("./tracking");
// Batch J plugin wiring: nối PluginRegistry vào pipeline (chỉ khi spec có `plugins`).
const { createPluginHost } = require("./plugins");
// Phase 7 P2: clip enhancement (deinterlace/stabilize/denoise) + encode GPU.
const {
  hasStabilize, buildEnhancePreChain, buildEnhancePostChain,
  runStabilizeDetect, probeFilterSupport,
} = require("./enhance");
// Phase 7 P3: speed ramp (đường cong tốc độ) + audio mixer (gain expr, normalize).
const { buildSpeedRampVideo, buildSpeedRampAudio, buildMotionPostChain } = require("./speedramp");
// Phase 9 đợt 8 S2: slow-mo mượt / nội suy frame / motion blur (chỉ nhánh thường).
const { buildMotionChain } = require("./motion");
const { buildGainFilter, buildNormalizeFilter } = require("./audiomix");
const { probeGpuEncoder, buildVideoEncodeArgs, tryEncode } = require("./gpuencode");
// Phase 9 N2: nested sequence — làm phẳng clip lồng nhau thành spec phẳng
// (xem nested.js + NESTED_RENDER_LIMITS.md). Chỉ một điểm nối có cờ ở main().
const { hasNestedClips, flattenSpecForRender } = require("./nested");
// Phase 9 R1: adjustment layer — tách clip theo biên layer, nối chain vào
// đoạn trong layer (xem adjustment.js + ADJUSTMENT_LIMITS.md).
// Phase 9 đợt 7 U2: normalize legacy UI clip + scope tracks (xem U2_LIMITS.md).
const { buildAdjustmentChain, splitClipByLayers, normalizeLegacyAdjustmentLayers } = require("./adjustment");

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
    // Phase 9 R2: đường mask — png (mặc định, vẽ PNG 1 lần) hoặc geq (cũ).
    maskMode: "png",
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
    else if (a === "--mask-mode") {
      const m = need();
      if (!["png", "geq"].includes(m)) {
        console.error(`❌ --mask-mode phải là png|geq (nhận: ${m})`);
        process.exit(2);
      }
      args.maskMode = m;
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
// Dựng file ASS cho các text clip karaoke (Phase 9 R4)
// ---------------------------------------------------------------------------
/**
 * Karaoke THẬT bằng tag \k của ASS (libass hỗ trợ): mỗi từ là một âm tiết
 * với thời lượng tính bằng centisecond. Style dùng PrimaryColour = màu tô
 * sáng (phần đã hát) và SecondaryColour = màu chữ gốc (phần chưa hát);
 * libass tự quét màu theo thời gian. Một dialogue cho một clip: bắt đầu ở
 * clip.start (cộng khoảng trống trước từ đầu tiên bằng âm tiết khoảng
 * trắng vô hình), kết thúc ở clip.start + clip.duration để dòng chữ giữ
 * nguyên sau khi hát xong.
 * Escape: \{ \} và \ trong từ (tránh phá cú pháp override của ASS).
 */
function escapeAssText(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/\{/g, "\\{").replace(/\}/g, "\\}");
}

function buildKaraokeAss(clips, meta) {
  const L = [];
  L.push("[Script Info]", "Title: repo1-karaoke", "ScriptType: v4.00+",
    `PlayResX: ${meta.width}`, `PlayResY: ${meta.height}`, "ScaledBorderAndShadow: yes", "");
  L.push("[V4+ Styles]");
  L.push("Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, " +
    "BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, " +
    "BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding");
  clips.forEach((clip, ci) => {
    const st = clip.style;
    const borderStyle = st.backgroundColor ? 3 : 1; // 3 = hộp nền đục
    const back = st.backgroundColor ? hexToAssColor(st.backgroundColor) : "&H00000000";
    const hi = st.highlightColor || "#ffff00";
    L.push(`Style: KA${ci},${st.fontFamily},${Math.round(st.fontSize)},` +
      `${hexToAssColor(hi)},${hexToAssColor(st.color)},&H80000000,${back},` +
      `${st.bold ? -1 : 0},${st.italic ? -1 : 0},0,0,100,100,0,0,` +
      `${borderStyle},2,0,5,10,10,10,1`);
  });
  L.push("", "[Events]");
  L.push("Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text");
  clips.forEach((clip, ci) => {
    const words = clip.karaoke;
    const x = Math.round(meta.width * (clip.style.x ?? 0.5));
    const y = Math.round(meta.height * (clip.style.y ?? 0.5));
    let body = "";
    // Khoảng trống trước từ đầu tiên: âm tiết khoảng trắng vô hình để dòng
    // chữ hiện từ clip.start bằng màu gốc (chưa hát) thay vì xuất hiện muộn.
    if (words[0].start > 0.05) {
      body += `{\\k${Math.max(1, Math.round(words[0].start * 100))}} `;
    }
    for (const w of words) {
      const cs = Math.max(1, Math.round((w.end - w.start) * 100));
      body += `{\\k${cs}}${escapeAssText(w.word)} `;
    }
    body = body.replace(/ $/, ""); // bỏ khoảng trắng cuối (tránh lệch căn giữa)
    const t0 = clip.start;
    const t1 = clip.start + clip.duration;
    L.push(`Dialogue: 0,${assTime(t0)},${assTime(t1)},KA${ci},,0,0,0,,{\\pos(${x},${y})}${body}`);
  });
  const file = path.join(os.tmpdir(), `repo1-karaoke-${process.pid}.ass`);
  fs.writeFileSync(file, L.join("\n") + "\n", "utf8");
  return file;
}

// ---------------------------------------------------------------------------
// Dựng filter_complex
// ---------------------------------------------------------------------------

// Phase 9 D4: chọn đường mask cho 1 site (video thường / video ramp / image).
// - Mask tĩnh → hành vi cũ (PNG nhanh, fallback geq).
// - Mask có keyframes → video animation (đường nhanh, không geq); nếu vẽ
//   video thất bại → PNG tĩnh tại t=0; nếu cả PNG cũng thất bại hoặc
//   --mask-mode geq → geq tĩnh tại t=0. Không fail job vì mask animation.
function maskChainForSite(unitLabel, mask, W, H, fps, duration, lbl, ctx) {
  if (hasMaskKeyframes(mask)) {
    const aKey = maskAnimKey(mask, W, H, fps, duration);
    if (ctx.maskAnim && ctx.maskAnim.has(aKey)) {
      return buildMaskAnimChain(unitLabel, ctx.maskAnim.get(aKey), duration * fps, lbl);
    }
    if (ctx.maskAnimFallback && ctx.maskAnimFallback.has(aKey)) {
      return buildMaskPngChain(unitLabel, ctx.maskAnimFallback.get(aKey), lbl);
    }
    return buildMaskChain(unitLabel, maskGeometryAt(mask, 0), W, H, lbl);
  }
  return buildMaskChainFor(unitLabel, mask, W, H, lbl,
    ctx.maskPng ? ctx.maskPng.get(maskKey(mask, W, H)) : undefined);
}

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
  // Đợt 7 U2: lặp theo chỉ số track gốc (không filter trước) vì scope
  // tracks của adjustment layer là chỉ số trong spec.tracks đã flatten.
  for (let trackIndex = 0; trackIndex < spec.tracks.length; trackIndex++) {
    const track = spec.tracks[trackIndex];
    if (track.kind !== "video" || track.hidden) continue;
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

    // Phase 9 R1: adjustment layer — tách mỗi clip theo biên layer TRƯỚC
    // khi chuẩn hoá (xem adjustment.js + ADJUSTMENT_LIMITS.md). Các đoạn
    // lát kín đúng [start, start+duration) nên tổng thời lượng không đổi;
    // audio kế thừa ở phần AUDIO vẫn đọc clip gốc nên tiếng không bị tách.
    // Mỗi đoạn mang _adjLayers (layer giao với đoạn) để bước chuẩn hoá nối
    // adjChain vào cuối chuỗi pixel của chính đoạn đó; đoạn ngoài layer có
    // danh sách rỗng nên chuỗi pixel giữ nguyên 100%.
    const adjLayers = Array.isArray(spec.adjustmentLayers) ? spec.adjustmentLayers : [];
    const expandedClips = [];
    for (const clip of clips) {
      // Đợt 7 U2: truyền trackIndex để split chỉ xét layer trong scope;
      // clip ngoài scope trả về 1 đoạn nguyên vẹn, không dính cổng fail fast.
      const parts = splitClipByLayers(clip, adjLayers, trackIndex);
      const overlapsAdj = parts.some((p) => p.layers.length > 0);
      // Cổng 1 — transition: clip dính xfade mà giao layer thì fail fast.
      // Xfade gộp 2 clip thành 1 unit; tách sẽ phá cặp transition, còn áp
      // adj cho cả unit thì sai ở vùng crossfade (vùng đó chứa nội dung
      // của cả 2 clip nhưng chưa chắc cả 2 đều giao layer).
      if (overlapsAdj && mergeInvolved.has(clip.id)) {
        throw new Error(`clip "${clip.id}": adjustment layer giao với clip dính transition ` +
          `(xfade) — chưa hỗ trợ; tách clip hoặc dời layer khỏi vùng transition`);
      }
      if (parts.length > 1) {
        // Cổng 2 — các thứ gắn theo thời gian cục bộ của clip: tách sẽ làm
        // chúng chạy lại từ đầu đoạn / lệch trf detect, nên fail fast thay
        // vì render sai lặng lẽ. Layer bao trọn clip (parts == 1) không bị
        // cổng này vì không tách.
        if (clip.speedKeyframes !== undefined) {
          throw new Error(`clip "${clip.id}": adjustment layer cắt giữa clip có speedKeyframes ` +
            `(keyframe tốc độ gắn theo thời gian clip — chưa hỗ trợ tách)`);
        }
        if (clip.animations !== undefined) {
          throw new Error(`clip "${clip.id}": adjustment layer cắt giữa clip có animations keyframes ` +
            `(keyframe gắn theo thời gian clip — chưa hỗ trợ tách)`);
        }
        if (clip.track !== undefined) {
          throw new Error(`clip "${clip.id}": adjustment layer cắt giữa clip có motion track ` +
            `(điểm track gắn theo thời gian clip — chưa hỗ trợ tách)`);
        }
        if (hasStabilize(clip.enhance)) {
          throw new Error(`clip "${clip.id}": adjustment layer cắt giữa clip có enhance.stabilize ` +
            `(vidstab detect theo trim gốc — chưa hỗ trợ tách)`);
        }
        if (clip.mask && hasMaskKeyframes(clip.mask)) {
          throw new Error(`clip "${clip.id}": adjustment layer cắt giữa clip có mask keyframes ` +
            `(mask animation gắn theo thời gian clip — chưa hỗ trợ tách)`);
        }
      }
      const spd = clip.speed ?? 1;
      for (const p of parts) {
        expandedClips.push({
          ...clip,
          start: p.start,
          duration: p.duration,
          in: p.in,
          out: p.in + p.duration * spd,
          _adjLayers: p.layers,
        });
      }
    }

    // Bước 1: chuẩn hoá từng clip — cắt đúng [in, in+duration*speed), speed/reverse,
    // scale/pad về đúng WxH, fps hằng số (xfade bắt buộc CFR), format yuv420p.
    const segs = expandedClips.map((clip) => {
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
      // Phase 9 R1: adjustment chain của đoạn này (rỗng khi đoạn ngoài
      // layer). Vị trí: SAU plugin — adjustment là lớp phủ trên clip nên
      // áp sau toàn bộ pipeline pixel của chính clip.
      const adjChain = buildAdjustmentChain(clip._adjLayers || [], ctx.assetsDir, ctx.userLutsDir);
      const adjSuffix = adjChain ? `,${adjChain}` : "";
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
        // Phase 9 đợt 8 S3 — ramp + motion (chỉ nhánh isRamp này; nhánh clip
        // thường bên dưới thuộc S2, không đụng vào): reverse + motion chặn
        // lại ở đây dù validator đã chặn reverse + speedKeyframes (defense
        // in depth — buildSpeedRampVideo cũng kiểm tra). motionPostChain
        // do buildSpeedRampVideo sắp xếp: có interpolation thì minterpolate
        // THAY bước fps (bỏ fps từng đoạn + sau concat, đứng trước các
        // filter postChain khác); chỉ có tmix thì tmix nằm cuối postChain.
        // Mask áp ngay sau đây nên luôn sau motion. Mask keyframes +
        // minterpolate KHÔNG chặn: minterpolate cùng fps giữ nguyên số
        // frame/CFR nên mask animation (trim theo duration*fps) vẫn khớp
        // từng frame — xem header speedramp.js.
        if (clip.motion !== undefined && clip.motion !== null && clip.reverse === true) {
          throw new Error(`clip "${clip.id}": speedKeyframes + motion không dùng chung được với reverse=true`);
        }
        const motionPostChain = clip.motion !== undefined && clip.motion !== null
          ? buildMotionPostChain(clip.motion, fps, clip.duration)
          : "";
        const { lines, label } = buildSpeedRampVideo(`[${idx}:v]`, clip, {
          W, H, fps, outFormat, padColor, lbl,
          enhPreChain: enhPre,
          preScaleChain: chromaChain,
          postChain: `${colorChain}${lutChain}${effectsChain}${enhPost}${pluginChain}${adjSuffix}`,
          motionPostChain,
        });
        fc.push(...lines);
        let unitLabel = label;
        if (clip.mask) {
          const mc = maskChainForSite(unitLabel, clip.mask, W, H, fps, clip.duration, lbl, ctx);
          fc.push(...mc.entries);
          unitLabel = mc.outLabel;
        }
        return {
          label: unitLabel, clip,
          start: clip.start, duration: clip.duration,
          declaredEnd: clip.start + clip.duration,
        };
      }
      // Phase 9 đợt 8 S2: motion (chỉ nhánh thường — nhánh ramp dùng
      // buildMotionPostChain của S3). interpolation THAY fps=<fps> (xem
      // motion.js); tmix đi ngay sau, trước format. Không motion = chain
      // cũ nguyên vẹn (fpsFilter = fps=<fps>, blurChain = "").
      // Phase 9 đợt 9 M1: preFilter (tpad clone-pad) đứng trước
      // minterpolate, tailFilter (trim đúng slot) đứng sau tmix, trước
      // format — cả hai chỉ có khi clip.motion bật interpolation.
      const motionChain = buildMotionChain(clip.motion, fps, clip.duration);
      fc.push(
        `[${idx}:v]` +
        `trim=start=${num(clip.in)}:end=${num(clip.in + clip.duration * (clip.speed ?? 1))},` +
        `setpts=PTS-STARTPTS${enhPre}${speedChain}${chromaChain},` +
        // Giữ tỉ lệ gốc, letterbox bằng nền đen (hoặc trong suốt nếu chroma) cho vừa khít khung hình output.
        `scale=${W}:${H}:force_original_aspect_ratio=decrease,` +
        `pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=${padColor},` +
        `setsar=1,${motionChain.preFilter ? `${motionChain.preFilter},` : ""}${motionChain.fpsFilter}${motionChain.blurChain}${motionChain.tailFilter},format=${outFormat}${colorChain}${lutChain}${effectsChain}${enhPost}${pluginChain}${adjSuffix}` +
        `[${v}]`
      );
      // Phase 7 P4: mask — áp SAU effects/plugin, trên pixel WxH đã chuẩn hoá,
      // trước xfade/timeline, nên mask là thuộc tính của clip và đi qua
      // transition cùng clip. Mask chain xuất yuva420p (cần alpha để overlay
      // composite đúng); alpha gốc được giữ, không ghi đè.
      let unitLabel = `[${v}]`;
      if (clip.mask) {
        const mc = maskChainForSite(unitLabel, clip.mask, W, H, fps, clip.duration, lbl, ctx);
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
    // Phase 9 D3: clip video có track → TÂM unit bám quỹ đạo (cùng biểu thức
    // sticker: x = main_w*frac - overlay_w/2). Unit full-frame không SR thì
    // overlay_w = main_w nên khung hình dịch chuyển để tâm bám điểm track;
    // có SR thì tâm hình bao đã biến đổi bám điểm track. Track thắng
    // keyframes x/y về vị trí; SR/opacity vẫn áp dụng bình thường. Unit đã
    // merge (dính transition) thì bỏ qua track (validator đã cảnh báo).
    if (!u.merged && u.clip.track) {
      const te = buildTrackOverlayExprs(u.clip.track, u.clip.start);
      ox = te.x; oy = te.y;
    } else if (!u.merged && u.clip.animations &&
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
        const mc = maskChainForSite(imgLabel, clip.mask, W, H, fps, clip.duration, lbl, ctx);
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
      if (isParityAnimation(clip.style.animation)) continue; // V4: ASS parity bên dưới
      if (Array.isArray(clip.karaoke) && clip.karaoke.length > 0) continue; // R4: ASS karaoke bên dưới
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
        // Phase 9 D3: text SR có track → tâm PNG bám quỹ đạo (cùng biểu thức
        // sticker), thắng overlay keyframes x/y; opacity keyframes vẫn giữ
        // (đã áp ở chain trên). Overlay đã quote sẵn nên biểu thức chứa
        // dấu phẩy vẫn an toàn.
        const oe = clip.track
          ? buildTrackOverlayExprs(clip.track, S)
          : buildOverlayExprs(clip.animations, S);
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
      // Phase 9 D3: text drawtext có track → TÂM dòng chữ bám quỹ đạo
      // (x = w*frac - text_w/2, cùng ngữ nghĩa sticker). Track thắng vị trí
      // tĩnh/keyframes x/y/textfx nhưng GIỮ alpha đã tính ở trên (fadeUp,
      // keyframes opacity, textfx alpha vẫn có tác dụng). drawtext đã quote
      // x/y bằng nháy đơn nên biểu thức chứa dấu phẩy vẫn an toàn.
      // Typewriter/karaoke không qua nhánh này (vẽ bằng ASS, validator cảnh
      // báo track bị bỏ qua).
      if (clip.track) {
        const lt = `(t-${num(S)})`;
        const fracX = buildAxisExpr(clip.track.points, "x", lt);
        const fracY = buildAxisExpr(clip.track.points, "y", lt);
        fx = `(w*(${fracX})-text_w/2)`;
        fy = `(h*(${fracY})-text_h/2)`;
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

  // ===== TEXT: karaoke qua file ASS + filter subtitles (Phase 9 R4) =====
  // Nối sau typewriter (nếu có): 2 lớp subtitles chồng nhau, mỗi lớp vẽ
  // đúng clip của mình (dialogue có Start/End riêng nên không đè nhau).
  const kaClips = [];
  for (const track of spec.tracks.filter((t) => t.kind === "text" && !t.hidden))
    for (const clip of track.clips)
      // Typewriter thắng khi cả hai cùng có (drawtext đã skip typewriter
      // trước karaoke) — tránh vẽ 1 clip bằng cả 2 lớp ASS.
      if (clip.style.animation !== "typewriter" &&
          Array.isArray(clip.karaoke) && clip.karaoke.length > 0) kaClips.push(clip);
  let karaokeAssFile = null;
  if (kaClips.length > 0) {
    karaokeAssFile = buildKaraokeAss(kaClips, { width: W, height: H });
    const s = lbl("ksub");
    fc.push(`${vcur}subtitles='${escapeFilterPath(karaokeAssFile)}'[${s}]`);
    vcur = `[${s}]`;
  }

  // ===== TEXT: parity (tiltIn/skewIn/slideReveal/curtainIn) qua ASS (Phase 9 đợt 10 V4) =====
  // Nối sau karaoke: karaoke thắng parity khi 1 clip có cả hai (tránh vẽ 1 clip
  // bằng 2 lớp ASS). Clip parity đã bị bỏ qua ở nhánh drawtext + PNG SR ở trên
  // nên chỉ lớp ASS này vẽ chúng — keyframes x/y/opacity của clip parity
  // bị bỏ qua (giống typewriter; validator cảnh báo cho SR).
  const paClips = [];
  for (const track of spec.tracks.filter((t) => t.kind === "text" && !t.hidden))
    for (const clip of track.clips)
      if (isParityAnimation(clip.style.animation) &&
          !(Array.isArray(clip.karaoke) && clip.karaoke.length > 0)) paClips.push(clip);
  let parityAssFile = null;
  if (paClips.length > 0) {
    // Đợt 11 P4: đo hộp chữ thật bằng PIL (measure_text.py, cùng font
    // file/size/metrics với render_text_png.py) để \clip quét theo hộp
    // chữ thay vì khung hình. Clip nào đo thất bại (thiếu python3/PIL/
    // font) → không có entry trong boxById → textAnimParity fallback
    // quét khung hình cũ + cảnh báo rõ, không fail render.
    const boxById = new Map();
    for (const clip of paClips) {
      const fontFile = resolveFontFile(clip.style.fontFamily, clip.style);
      if (!fontFile) {
        console.error(`   ⚠️ parity "${clip.id}": không tìm được font "${clip.style.fontFamily}" để đo hộp chữ — fallback quét khung hình`);
        continue;
      }
      const mr = spawnSync("python3", [
        path.join(__dirname, "measure_text.py"),
        "--font", fontFile,
        "--size", String(clip.style.fontSize),
        "--text", clip.text,
      ], { stdio: ["ignore", "pipe", "pipe"] });
      try {
        const box = JSON.parse((mr.stdout || "").toString());
        if (box && box.width > 0 && box.height > 0) boxById.set(clip.id, { w: box.width, h: box.height });
        else console.error(`   ⚠️ parity "${clip.id}": đo hộp chữ trả về rỗng — fallback quét khung hình`);
      } catch {
        console.error(`   ⚠️ parity "${clip.id}": đo hộp chữ thất bại (${(mr.stderr || "").toString().trim().slice(0, 120)}) — fallback quét khung hình`);
      }
    }
    parityAssFile = buildParityAss(paClips, { width: W, height: H }, boxById);
    const s = lbl("psub");
    fc.push(`${vcur}subtitles='${escapeFilterPath(parityAssFile)}'[${s}]`);
    vcur = `[${s}]`;
  }

  // ===== AUDIO =====
  // Mỗi clip: cắt [in, in+duration*speed) → speed/reverse → chuẩn 48kHz stereo
  // → volume → afade → adelay tới vị trí start trên timeline. Rồi trộn bằng amix.
  // Audio ducking (spec.ducking, xem DUCKING_LIMITS.md): khi bật, mix tách
  // thành nhánh voice + nhánh music, sidechaincompress rồi amix lại.
  // Phase 7 P3: clip có speedKeyframes → chia đoạn concat (không dùng speed hằng);
  // clip có volumeKeyframes hoặc fade cong → 1 filter volume eval=frame thay cho
  // volume + afade; track.volume nhân vào gain; normalize áp sau amix.
  //
  // R1-015: audio của VIDEO clip được xử lý theo `sourceAudioMode`:
  // - "inherit" (mặc định): trích audio từ video source, áp cùng trim/speed/reverse.
  // - "mute": bỏ qua. - "detach": chưa hỗ trợ (validate.js báo lỗi).
  //
  // ===== AUDIO DUCKING (cấp project, xem DUCKING_LIMITS.md) =====
  // Khi enabled và voiceTrackId hợp lệ: tách mix thành 2 nhánh (voice mix
  // từ track giọng, music mix từ các track audio còn lại + audio kế thừa
  // video), áp sidechaincompress rồi amix lại. Mọi trường hợp còn lại
  // (tắt / track giọng không tìm thấy / không phải audio / bị muted / trống
  // / không có nhánh nhạc) → filtergraph Y HỆT cũ, chỉ khác 1 cảnh báo stderr.
  // Param sai khoảng → fail fast (throw), không im lặng render sai.
  const ducking = spec.ducking;
  let duckingActive = false;
  const voiceSeg = [];
  const musicSeg = [];
  if (ducking && ducking.enabled === true) {
    const dkErrs = [];
    const dkNum = (key, min, max) => {
      const v = ducking[key];
      if (v === undefined) return;
      if (typeof v !== "number" || !Number.isFinite(v) || v < min || v > max)
        dkErrs.push(`ducking.${key} phải là số trong [${min}, ${max}], nhận được: ${JSON.stringify(v)}`);
    };
    if (typeof ducking.voiceTrackId !== "string" || ducking.voiceTrackId.length === 0)
      dkErrs.push(`ducking.enabled=true nhưng voiceTrackId không hợp lệ: ${JSON.stringify(ducking.voiceTrackId)}`);
    dkNum("thresholdDb", -60, 0);
    dkNum("ratio", 1, 20);
    dkNum("attackMs", 0.1, 2000);
    dkNum("releaseMs", 10, 9000);
    dkNum("duckAmountDb", 0, 24);
    if (dkErrs.length > 0)
      throw new Error(`audio ducking không hợp lệ:\n  - ${dkErrs.join("\n  - ")}`);
    const vt = spec.tracks.find((t) => t.id === ducking.voiceTrackId);
    if (!vt) console.error(`⚠️  ducking: không tìm thấy track giọng "${ducking.voiceTrackId}" → bỏ qua ducking, render mix cũ`);
    else if (vt.kind !== "audio") console.error(`⚠️  ducking: track giọng "${ducking.voiceTrackId}" không phải track audio (kind="${vt.kind}") → bỏ qua ducking, render mix cũ`);
    else if (vt.muted) console.error(`⚠️  ducking: track giọng "${ducking.voiceTrackId}" đang bị muted → bỏ qua ducking, render mix cũ`);
    else if (!vt.clips || vt.clips.length === 0) console.error(`⚠️  ducking: track giọng "${ducking.voiceTrackId}" không có clip → bỏ qua ducking, render mix cũ`);
    else duckingActive = true;
  }
  const aseg = [];
  // Helper dựng chain audio cho 1 clip (dùng chung cho audio clip và video inherit).
  // streamRef: `[idx:a]` — audio stream của file nguồn.
  // Phase 7 P3: thêm trackVolume (nhân vào gain) + speed ramp (segment concat)
  // + gain expression (volumeKeyframes / fade cong). Không ramp, không keyframes,
  // không fade cong → chain cũ 100% (volume + afade tĩnh).
  const buildAudioChain = (streamRef, clip, label, trackVolume = 1, branchSeg) => {
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
    // Ducking: ghi thêm label vào nhánh voice/music (aseg vẫn giữ đủ để
    // fallback về mix cũ khi ducking không kích hoạt được).
    if (branchSeg) branchSeg.push(`[${a}]`);
  };
  // R1-054: track audio bị muted → bỏ qua toàn bộ (câm).
  // Ducking: track giọng → voiceSeg, các track audio còn lại → musicSeg.
  for (const track of spec.tracks.filter((t) => t.kind === "audio" && !t.muted)) {
    for (const clip of track.clips) {
      const idx = mediaIndex.get(absOf(clip.src));
      buildAudioChain(`[${idx}:a]`, clip, "ac", track.volume ?? 1,
        duckingActive ? (track.id === ducking.voiceTrackId ? voiceSeg : musicSeg) : undefined);
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
      // Ducking: audio kế thừa của video luôn thuộc nhánh nhạc.
      buildAudioChain(`[${idx}:a]`, clip, "va", track.volume ?? 1, duckingActive ? musicSeg : undefined);
    }
  }
  let aout;
  if (aseg.length === 0) {
    // Không có track audio: tạo track câm để output luôn có audio stream (đúng hợp đồng H.264+AAC).
    fc.push(`anullsrc=r=48000:cl=stereo:d=${num(D)}[aout0]`);
    aout = "[aout0]";
  } else if (duckingActive && voiceSeg.length > 0 && musicSeg.length > 0) {
    // DUCKING: music mix + voice mix → sidechaincompress → amix lại với voice.
    // Cả 2 nhánh đều apad tới D: nếu 1 nhánh hết sớm, sidechain sẽ EOF và
    // cắt luôn đầu ra — apad giữ cả 2 nhánh dài đúng D như mix cũ.
    const mus = lbl("dmus");
    const voi = lbl("dvoi");
    const dk = lbl("ddk");
    const mixed = lbl("amx");
    // Phase 7 P3: normalize (export option) áp SAU apad/atrim, trên stream đã mix.
    const normFilter = buildNormalizeFilter(ctx.normalize || null);
    const normChain = normFilter ? `,${normFilter}` : "";
    // threshold dB → linear cho sidechaincompress (giới hạn 0.000976563..1).
    const th = Math.max(0.000976563, Math.pow(10, (ducking.thresholdDb ?? -20) / 20));
    const ratio = ducking.ratio ?? 4;
    const atk = ducking.attackMs ?? 20;
    const rel = ducking.releaseMs ?? 250;
    // duckAmountDb = mức giảm TỐI ĐA, map sang `mix` (dry/wet blend):
    // mix = 1 - 10^(-duckAmountDb/20). Khi compressor nén hết, đầu ra còn
    // (1-mix) phần dry → giảm đúng duckAmountDb. Đây là mức trần xấp xỉ,
    // không phải knee cứng — xem DUCKING_LIMITS.md.
    const mix = 1 - Math.pow(10, -(ducking.duckAmountDb ?? 12) / 20);
    const branch = (seg, label) => {
      fc.push(
        `${seg.join("")}amix=inputs=${seg.length}:duration=longest:dropout_transition=0,` +
        `apad=whole_dur=${num(D)},atrim=0:${num(D)},aresample=48000,` +
        `aformat=sample_fmts=fltp:channel_layouts=stereo[${label}]`
      );
      return `[${label}]`;
    };
    const musRef = branch(musicSeg, mus);
    const voiRef = branch(voiceSeg, voi);
    // Nhánh giọng dùng 2 lần (sidechain + mix cuối) → bắt buộc asplit,
    // vì 1 label output của FFmpeg chỉ được tiêu thụ 1 lần.
    const voiSc = lbl("dvs");
    const voiOut = lbl("dvo");
    fc.push(`${voiRef}asplit=2[${voiSc}][${voiOut}]`);
    fc.push(
      `${musRef}[${voiSc}]sidechaincompress=threshold=${num(th)}:ratio=${num(ratio)}:` +
      `attack=${num(atk)}:release=${num(rel)}:mix=${num(mix)}[${dk}]`
    );
    fc.push(
      `[${dk}][${voiOut}]amix=inputs=2:duration=longest:dropout_transition=0,` +
      `apad=whole_dur=${num(D)},atrim=0:${num(D)}${normChain}[${mixed}]`
    );
    aout = `[${mixed}]`;
  } else {
    if (duckingActive)
      console.error("⚠️  ducking: thiếu nhánh nhạc hoặc nhánh giọng sau khi dựng chain → bỏ qua ducking, render mix cũ");
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

  return { filterComplex: fc.join(";"), vout: vfinal, aout, assFile, karaokeAssFile, parityAssFile };
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

  // Phase 9 đợt 7 U2: normalize legacy UI adjustment clip THÀNH project
  // layer TRƯỚC flatten và TRƯỚC validate — legacy clip kind "adjustment"
  // trong track.clips không có src nên validator phẳng sẽ từ chối nó, và
  // flatten sẽ coi nó là clip phẳng thường. Normalize gỡ nó khỏi track,
  // nối thành spec.adjustmentLayers với tracks=[track chứa nó]; legacy
  // trong project con cũng được normalize đệ quy nên flatten của nested.js
  // thu thập được nó như layer của project con (xem U2_LIMITS.md).
  // Normalize lỗi (filterType lạ, trùng id) → fail fast, không render sai.
  try {
    const nz = normalizeLegacyAdjustmentLayers(spec);
    if (nz.converted > 0)
      log(`   legacy adjustment: ${nz.converted} clip kind "adjustment" đã ` +
        `chuyển thành project layer (tracks = track chứa nó)`);
  } catch (e) {
    console.error(`❌ Legacy adjustment layer không normalize được: ${e.message}`);
    process.exit(1);
  }

  // Phase 9 N2: nested sequence — làm phẳng TRƯỚC validate. Clip lồng nhau
  // không có src nên validator phẳng sẽ từ chối nó; flatten thay nó bằng
  // các clip phẳng tương đương trên track mới, còn spec phẳng cũ đi qua
  // nhánh này với hasNestedClips === false nên không đổi gì cả.
  if (hasNestedClips(spec)) {
    try {
      const flat = flattenSpecForRender(spec);
      for (const w of flat.warnings) console.error(`⚠️  nested: ${w}`);
      log(`   nested: ${flat.stats.nestedClips} clip lồng nhau → ` +
        `${flat.stats.outputClips} clip phẳng, ${flat.stats.newTracks} track mới` +
        (flat.stats.droppedClips > 0 ? `, ${flat.stats.droppedClips} clip ngoài cửa sổ đã bỏ` : ""));
      spec = flat.spec;
    } catch (e) {
      console.error(`❌ Nested sequence không làm phẳng được: ${e.message}`);
      process.exit(1);
    }
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
      if (isParityAnimation(clip.style.animation)) continue; // V4: ASS parity, libass tự resolve qua fontconfig
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
      if (isParityAnimation(clip.style.animation)) continue; // V4: parity đi ASS, không PNG SR
      if (Array.isArray(clip.karaoke) && clip.karaoke.length > 0) continue; // R4: karaoke đi ASS, không PNG SR
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

  // Phase 9 R2: mask đường PNG nhanh — vẽ mỗi mask phân biệt 1 lần ra PNG
  // W×H (dedup theo maskKey), buildFilterGraph dùng movie+blend thay geq.
  // Vẽ thất bại (thiếu python3/Pillow/numpy) → clip đó fallback về geq cũ,
  // không fail job (giống pattern text SR PNG). --mask-mode geq → bỏ qua.
  const maskPng = new Map(); // maskKey -> pngPath
  const maskPngPaths = [];
  if (args.maskMode === "png") {
    const seen = new Set();
    for (const track of spec.tracks.filter((t) => (t.kind === "video" || t.kind === "image") && !t.hidden)) {
      for (const clip of track.clips) {
        if (!clip.mask) continue;
        const key = maskKey(clip.mask, meta.width, meta.height);
        if (seen.has(key)) continue;
        seen.add(key);
        const pngPath = path.join(os.tmpdir(), `repo1-mask-${process.pid}-${seen.size}.png`);
        const m = clip.mask;
        const pyArgs = [
          path.join(__dirname, "mask_png.py"),
          "--shape", m.shape,
          "--x", String(m.x ?? 0.5), "--y", String(m.y ?? 0.5),
          "--w", String(m.w ?? 1), "--h", String(m.h ?? 1),
          "--feather", String(m.feather ?? 0),
          "--width", String(meta.width), "--height", String(meta.height),
          "--out", pngPath,
        ];
        if (m.invert) pyArgs.push("--invert");
        const pr = spawnSync("python3", pyArgs, { stdio: ["ignore", "pipe", "pipe"] });
        if (pr.error || pr.status !== 0) {
          console.error(`⚠️  mask "${clip.id}": không vẽ được PNG mask ` +
            `(${(pr.stderr || "").toString().trim().slice(-200) || (pr.error && pr.error.message) || "lỗi không rõ"}) → fallback về geq`);
          continue;
        }
        maskPng.set(key, pngPath);
        maskPngPaths.push(pngPath);
        log(`   mask PNG "${clip.id}" → ${pngPath}`);
      }
    }
  }

  // Phase 9 D4: mask animation — vẽ video mask (ffv1 gray) cho clip có
  // keyframes, dedup theo maskAnimKey (khung + fps + duration + keyframe).
  // Vẽ thất bại → fallback PNG tĩnh tại t=0 (hình học nội suy); cả 2 thất
  // bại → site dùng geq tĩnh tại t=0, không fail job. --mask-mode geq →
  // bỏ qua cả 2 (site dùng geq t=0 trực tiếp).
  const maskAnim = new Map(); // maskAnimKey -> videoPath
  const maskAnimFallback = new Map(); // maskAnimKey -> pngPath (t=0)
  const maskAnimPaths = [];
  if (args.maskMode === "png") {
    const seenAnim = new Set();
    for (const track of spec.tracks.filter((t) => (t.kind === "video" || t.kind === "image") && !t.hidden)) {
      for (const clip of track.clips) {
        if (!clip.mask || !hasMaskKeyframes(clip.mask)) continue;
        const aKey = maskAnimKey(clip.mask, meta.width, meta.height, meta.fps, clip.duration);
        if (seenAnim.has(aKey)) continue;
        seenAnim.add(aKey);
        const m = clip.mask;
        const vidPath = path.join(os.tmpdir(), `repo1-maskan-${process.pid}-${seenAnim.size}.mkv`);
        const pyArgs = [
          path.join(__dirname, "mask_anim.py"),
          "--shape", m.shape,
          "--feather", String(m.feather ?? 0),
          "--width", String(meta.width), "--height", String(meta.height),
          "--fps", String(meta.fps), "--duration", String(clip.duration),
          "--keyframes", JSON.stringify(normalizeMask(m).keyframes),
          "--out", vidPath,
        ];
        if (m.invert) pyArgs.push("--invert");
        const pr = spawnSync("python3", pyArgs, { stdio: ["ignore", "pipe", "pipe"] });
        if (pr.error || pr.status !== 0) {
          console.error(`⚠️  mask anim "${clip.id}": không vẽ được video mask ` +
            `(${(pr.stderr || "").toString().trim().slice(-200) || (pr.error && pr.error.message) || "lỗi không rõ"}) → thử PNG tĩnh tại t=0`);
          const g0 = maskGeometryAt(m, 0);
          const fbPath = path.join(os.tmpdir(), `repo1-maskfb-${process.pid}-${seenAnim.size}.png`);
          const fbArgs = [
            path.join(__dirname, "mask_png.py"),
            "--shape", m.shape,
            "--x", String(g0.x), "--y", String(g0.y),
            "--w", String(g0.w), "--h", String(g0.h),
            "--feather", String(m.feather ?? 0),
            "--width", String(meta.width), "--height", String(meta.height),
            "--out", fbPath,
          ];
          if (m.invert) fbArgs.push("--invert");
          const fb = spawnSync("python3", fbArgs, { stdio: ["ignore", "pipe", "pipe"] });
          if (fb.error || fb.status !== 0) {
            console.error(`⚠️  mask anim "${clip.id}": PNG fallback cũng thất bại → geq tĩnh tại t=0`);
            continue;
          }
          maskAnimFallback.set(aKey, fbPath);
          maskAnimPaths.push(fbPath);
          log(`   mask anim fallback PNG t=0 "${clip.id}" → ${fbPath}`);
          continue;
        }
        maskAnim.set(aKey, vidPath);
        maskAnimPaths.push(vidPath);
        log(`   mask anim "${clip.id}" → ${vidPath}`);
      }
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
  const { filterComplex, vout, aout, assFile, karaokeAssFile, parityAssFile } = buildFilterGraph(spec, {
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
    // Phase 9 R2: map maskKey -> PNG mask (rỗng khi --mask-mode geq).
    maskPng,
    // Phase 9 D4: map maskAnimKey -> video mask / PNG fallback t=0.
    maskAnim,
    maskAnimFallback,
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
  if (karaokeAssFile && r.status === 0) {
    try { fs.unlinkSync(karaokeAssFile); } catch { /* bỏ qua */ }
  } else if (karaokeAssFile) {
    console.error(`   (giữ file ASS karaoke tạm để debug: ${karaokeAssFile})`);
  }
  if (parityAssFile && r.status === 0) {
    try { fs.unlinkSync(parityAssFile); } catch { /* bỏ qua */ }
  } else if (parityAssFile) {
    console.error(`   (giữ file ASS parity tạm để debug: ${parityAssFile})`);
  }
  // Dọn PNG text SR tạm (giữ lại khi lỗi để debug, giống ASS).
  if (r.status === 0) {
    for (const p of textSrPngPaths) { try { fs.unlinkSync(p); } catch { /* bỏ qua */ } }
  } else if (textSrPngPaths.length > 0) {
    console.error(`   (giữ PNG text SR tạm để debug: ${textSrPngPaths.join(", ")})`);
  }
  // Phase 9 R2: dọn PNG mask tạm (giữ lại khi lỗi để debug, giống text SR).
  if (r.status === 0) {
    for (const p of maskPngPaths) { try { fs.unlinkSync(p); } catch { /* bỏ qua */ } }
  } else if (maskPngPaths.length > 0) {
    console.error(`   (giữ PNG mask tạm để debug: ${maskPngPaths.join(", ")})`);
  }
  // Phase 9 D4: dọn video mask animation + PNG fallback t=0 tạm (giữ khi lỗi).
  if (r.status === 0) {
    for (const p of maskAnimPaths) { try { fs.unlinkSync(p); } catch { /* bỏ qua */ } }
  } else if (maskAnimPaths.length > 0) {
    console.error(`   (giữ video/PNG mask anim tạm để debug: ${maskAnimPaths.join(", ")})`);
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
