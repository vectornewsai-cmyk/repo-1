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
const { buildTextExprs, buildOverlayExprs } = require("./keyframes");
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
const { buildOpacityFilter } = require("./opacity");

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
  --ffmpeg <path>     Đường dẫn ffmpeg (mặc định: ffmpeg trên PATH)
  --ffprobe <path>    Đường dẫn ffprobe (mặc định: ffprobe trên PATH)
  --crf <0..51>       Chất lượng H.264 (CRF; số càng nhỏ càng đẹp, mặc định 20)
  --x264-preset <p>   ultrafast|superfast|veryfast|faster|fast|medium|slow|slower|veryslow
                      (mặc định medium)
  --audio-bitrate <b> Bitrate audio AAC, vd 128k (32k..512k, mặc định 128k)
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
  const args = {
    spec: null, out: null, mediaDir: null,
    ffmpeg: "ffmpeg", ffprobe: "ffprobe",
    crf: 20, x264Preset: "medium", audioBitrate: "128k",
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
    else if (a === "--ffmpeg") args.ffmpeg = need();
    else if (a === "--ffprobe") args.ffprobe = need();
    else if (a === "--crf") args.crf = needInt("--crf", need(), 0, 51);
    else if (a === "--x264-preset") args.x264Preset = needX264Preset(need());
    else if (a === "--audio-bitrate") args.audioBitrate = needAudioBitrate(need());
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

  // ===== VIDEO: chuẩn hoá từng clip rồi nối bằng xfade khi có transition =====
  // Mỗi "unit" là một stream video hoàn chỉnh, sẽ được đặt lên timeline ở bước sau.
  const units = [];

  // R1-054: track video bị hidden → bỏ qua (không render hình);
  // track video bị muted → vẫn render hình nhưng bỏ audio kế thừa (xử lý ở phần AUDIO).
  for (const track of spec.tracks.filter((t) => t.kind === "video" && !t.hidden)) {
    const clips = [...track.clips].sort((a, b) => a.start - b.start);

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
      const colorFilter = buildColorAdjustFilter(clip.filter?.color);
      const colorChain = colorFilter ? `,${colorFilter}` : "";
      const lutChain = clip.filter?.lut ? `,${buildLutFilter(clip.filter.lut, ctx.assetsDir)}` : "";
      const fxChain = buildEffectsChain(clip.effects);
      const effectsChain = fxChain ? `,${fxChain}` : "";
      // P0-05/R1-012: khi có chroma key, GIỮ alpha xuyên suốt chain.
      // - buildChromaFilter đã output yuva420p (có alpha từ chromakey)
      // - pad phải dùng màu trong suốt (black@0), không phải black đục
      // - format cuối phải là yuva420p, KHÔNG được convert về yuv420p (sẽ mất alpha)
      // - overlay filter tự composite bằng alpha channel
      const hasChroma = !!clip.chromaKey;
      const padColor = hasChroma ? "black@0" : "black";
      const outFormat = hasChroma ? "yuva420p" : "yuv420p";
      fc.push(
        `[${idx}:v]` +
        `trim=start=${num(clip.in)}:end=${num(clip.in + clip.duration * (clip.speed ?? 1))},` +
        `setpts=PTS-STARTPTS${speedChain}${chromaChain},` +
        // Giữ tỉ lệ gốc, letterbox bằng nền đen (hoặc trong suốt nếu chroma) cho vừa khít khung hình output.
        `scale=${W}:${H}:force_original_aspect_ratio=decrease,` +
        `pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=${padColor},` +
        `setsar=1,fps=${fps},format=${outFormat}${colorChain}${lutChain}${effectsChain}` +
        `[${v}]`
      );
      return {
        label: `[${v}]`, clip,
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
    // R1-011: opacity — áp sau khi unit đã hoàn chỉnh (kể cả xfade merge):
    // format=rgba + colorchannelmixer nhân alpha, overlay composite bằng alpha.
    // opacity ≈ 1 → không thêm filter (giữ nguyên pipeline cũ, không tốn hiệu năng).
    const opFilter = buildOpacityFilter(u.clip.opacity);
    const opChain = opFilter ? `${opFilter},` : "";
    fc.push(`${u.label}${opChain}setpts=PTS+${num(u.start)}/TB[${p}]`);
    let ox = "0", oy = "0";
    if (!u.merged && u.clip.animations && (u.clip.animations.x || u.clip.animations.y)) {
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
      const p = lbl("imgp"), b = lbl("imgb");
      fc.push(`[${v}]setpts=PTS+${num(clip.start)}/TB[${p}]`);
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
      const { filter, x, y } = buildStickerOverlay(clip, W, H);
      const idx = mediaIndex.get(absOf(clip.src));
      const s = lbl("stk");
      // filter đã bao gồm loop/scale/rotate/opacity; overlay với enable theo thời gian
      const S = clip.start, E = clip.start + clip.duration;
      fc.push(`[${idx}:v]${filter}[${s}]`);
      const o = lbl("stko");
      fc.push(`${vcur_sticker}[${s}]overlay=${x}:${y}:enable='between(t,${num(S)},${num(E)})':eof_action=pass[${o}]`);
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
  //
  // R1-015: audio của VIDEO clip được xử lý theo `sourceAudioMode`:
  // - "inherit" (mặc định): trích audio từ video source, áp cùng trim/speed/reverse.
  // - "mute": bỏ qua. - "detach": chưa hỗ trợ (validate.js báo lỗi).
  const aseg = [];
  // Helper dựng chain audio cho 1 clip (dùng chung cho audio clip và video inherit).
  // streamRef: `[idx:a]` — audio stream của file nguồn.
  const buildAudioChain = (streamRef, clip, label) => {
    const a = lbl(label);
    const spd = clip.speed ?? 1;
    const spdF = buildSpeedFilter(spd, clip.reverse ?? false);
    const speedChain = spdF.audio ? `,${spdF.audio}` : "";
    let chain =
      `${streamRef}` +
      `atrim=start=${num(clip.in)}:end=${num(clip.in + clip.duration * spd)},` +
      `asetpts=PTS-STARTPTS${speedChain},aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo`;
    // R1-076: audio effects (bass → treble → noiseReduction → compressor → reverb),
    // áp dụng sau aformat, trước volume.
    chain += buildAudioEffectsFilters(clip.audioEffects);
    const vol = clip.volume ?? 1;
    if (Math.abs(vol - 1) > EPS) chain += `,volume=${num(vol)}`;
    if ((clip.fadeIn ?? 0) > EPS) chain += `,afade=t=in:st=0:d=${num(clip.fadeIn)}`;
    if ((clip.fadeOut ?? 0) > EPS)
      chain += `,afade=t=out:st=${num(clip.duration - clip.fadeOut)}:d=${num(clip.fadeOut)}`;
    chain += `,adelay=${Math.round(clip.start * 1000)}:all=1[${a}]`;
    fc.push(chain);
    aseg.push(`[${a}]`);
  };
  // R1-054: track audio bị muted → bỏ qua toàn bộ (câm).
  for (const track of spec.tracks.filter((t) => t.kind === "audio" && !t.muted)) {
    for (const clip of track.clips) {
      const idx = mediaIndex.get(absOf(clip.src));
      buildAudioChain(`[${idx}:a]`, clip, "ac");
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
      buildAudioChain(`[${idx}:a]`, clip, "va");
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
    fc.push(
      `${aseg.join("")}amix=inputs=${aseg.length}:duration=longest:dropout_transition=0,` +
      `apad=whole_dur=${num(D)},atrim=0:${num(D)}[${mixed}]`
    );
    aout = `[${mixed}]`;
  }

  return { filterComplex: fc.join(";"), vout: vcur, aout, assFile };
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

  // 2. Validate cấu trúc
  const v = validateSpec(spec);
  for (const w of v.warnings) console.error(`⚠️  ${w}`);
  if (!v.ok) {
    console.error(`\n❌ Spec không hợp lệ (${v.errors.length} lỗi):`);
    v.errors.forEach((e, i) => console.error(`  ${i + 1}. ${e}`));
    process.exit(1);
  }

  const meta = spec.meta;
  const D = projectDuration(spec);
  const mediaDir = args.mediaDir
    ? path.resolve(args.mediaDir)
    : path.join(path.dirname(path.resolve(args.spec)), "media");
  const absOf = (src) => resolveSrc(src, mediaDir);

  // 3. Validate media
  const mv = validateMedia(spec, mediaDir, args.ffprobe);
  for (const w of mv.warnings) console.error(`⚠️  ${w}`);
  if (!mv.ok) {
    console.error(`\n❌ Media không hợp lệ (${mv.errors.length} lỗi):`);
    mv.errors.forEach((e, i) => console.error(`  ${i + 1}. ${e}`));
    process.exit(1);
  }

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

  // 6. Dựng filter graph
  const { filterComplex, vout, aout, assFile } = buildFilterGraph(spec, {
    W: meta.width, H: meta.height, fps: meta.fps, D,
    mediaIndex, absOf, transitions: v.transitions, fontFiles,
    assetsDir: path.join(__dirname, "..", "..", "..", "assets"),
    mediaProbes: mv.probes, // R1-015 fix: check audio stream trước khi inherit
  });

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
  for (const m of orderedMedia) ffArgs.push("-i", m);
  ffArgs.push(
    "-filter_complex", filterComplex,
    "-map", vout, "-map", aout,
    "-c:v", "libx264", "-preset", args.x264Preset, "-crf", String(args.crf),
    "-pix_fmt", "yuv420p", "-r", String(meta.fps),
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
    `crf=${args.crf} preset=${args.x264Preset} audio=${args.audioBitrate}`);
  const t0 = Date.now();
  const r = spawnSync(args.ffmpeg, ffArgs, {
    stdio: ["ignore", "ignore", args.quiet ? "ignore" : "inherit"],
  });
  const dt = ((Date.now() - t0) / 1000).toFixed(1);

  // Dọn file ASS tạm (giữ lại khi lỗi để debug)
  if (assFile && r.status === 0) {
    try { fs.unlinkSync(assFile); } catch { /* bỏ qua */ }
  } else if (assFile) {
    console.error(`   (giữ file ASS tạm để debug: ${assFile})`);
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
