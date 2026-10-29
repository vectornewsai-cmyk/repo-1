#!/usr/bin/env node
/**
 * textAnimParity.js — Text animation parity cho nhóm rotate/skew/clip-reveal
 * (Phase 9 đợt 10, luồng V4, gap C5).
 *
 * Vấn đề: drawtext của FFmpeg không xoay, không nghiêng (skew) và không
 * cắt (clip) chữ theo thời gian, nên các CSS preset kiểu rotate/skew/
 * clip-path chỉ đẹp ở preview mà render ra thì mất hiệu ứng (xem
 * TEXT_ANIM_PARITY_LIMITS.md). Các animation này KHÔNG đi qua textfx.js
 * (drawtext x/y/alpha) mà đi qua file ASS + filter `subtitles` (libass),
 * cùng họ với typewriter/karaoke — vì libass THẬT SỰ hỗ trợ:
 *   - \fr (xoay quanh trục Z) + \t(...) nội suy góc theo thời gian,
 *   - \fax (shear ngang = skewX của CSS, hệ số = tan(góc)),
 *   - \clip(x1,y1,x2,y2) + \t(...) nội suy hình chữ nhật cắt,
 *   - \move(...) dịch chuyển + \fad(...) mờ dần vào.
 * Cả 4 đều đã kiểm chứng bằng MP4 thật + đo pixel (xem test
 * test_text_anim_parity.js): góc xoay/nghiêng thay đổi theo thời gian,
 * mép reveal quét đúng hướng, không phải chỉ đổi tên animation.
 *
 * Các animation (định nghĩa khớp CSS preset gốc trong assets/text-presets):
 *   tiltIn      — vcut-tilt-in: xoay -12° + trồi từ dưới 20px + mờ vào, 0.7s.
 *   skewIn      — vcut-skew-in: skewX -25° + trượt từ trái 30px + mờ vào,
 *                 qua trung gian skewX +8° ở 60% (0.36s), xong ở 0.6s.
 *   slideReveal — vcut-slide-reveal: lộ dần từ trái sang phải bằng clip,
 *                 mép cắt quét ngang khung hình trong 1.0s (không mờ).
 *   curtainIn   — vcut-curtain-in: màn kéo mở từ giữa ra hai bên bằng clip
 *                 + mờ vào, 0.8s.
 *
 * TRUNG THỰC — clip quét theo HỘP CHỮ (Phase 9 đợt 11 P4, trước đó quét
 * khung hình): buildParityAss nhận thêm boxById (clip.id → {w,h} đo thật
 * bằng PIL qua measure_text.py, cùng font file/size/metrics với
 * render_text_png.py) rồi đổi \clip sang hình chữ nhật của hộp chữ:
 * slideReveal quét từ mép trái hộp tới mép phải hộp trong 1.0s,
 * curtainIn mở từ tâm hộp ra hai mép hộp trong 0.8s. Chữ ở giữa khung
 * giờ lộ đúng trọn thời lượng hiệu ứng, không còn chờ mép quét khung
 * tới nó. Clip nào đo hộp thất bại (thiếu python3/PIL/font) thì fallback
 * về quét khung hình cũ + render.js log cảnh báo rõ — không fail render.
 * Lệch còn lại: hộp đo bằng PIL (FreeType) trong khi libass vẽ bằng
 * fontconfig/FreeType riêng — cùng font file nên sai số chỉ ở mức làm
 * tròn/antialias (vài px); hộp nền backgroundColor có padding riêng của
 * libass nên mép nền có thể lệch khỏi mép hộp chữ vài px lúc đang quét.
 * \t nội suy \clip tuyến tính, khác CSS ease (cubic-bezier) của preset
 * gốc — thời gian lộ ở giữa hiệu ứng lệch nhẹ so với CSS.
 *
 * Thứ tự thắng (mirror render.js): parity ASS thắng keyframes x/y/opacity
 * và thắng style.animation drawtext — giống typewriter: clip parity bị
 * bỏ qua hoàn toàn ở nhánh drawtext và nhánh PNG SR, chỉ vẽ bằng ASS.
 * Karaoke thắng parity (karaoke đi nhánh ASS riêng, tránh vẽ 1 clip
 * bằng 2 lớp ASS chồng nhau). Track bị bỏ qua cho clip ASS (như
 * typewriter/karaoke — validator cảnh báo).
 *
 * Chạy self-test: node src/textAnimParity.js --self-test
 */
"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

/** Các animation parity (ASS) — KHÔNG thuộc TEXTFX_ANIMATIONS (drawtext). */
const PARITY_ANIMATIONS = ["tiltIn", "skewIn", "slideReveal", "curtainIn"];

function isParityAnimation(anim) {
  return typeof anim === "string" && PARITY_ANIMATIONS.includes(anim);
}

/** Giây → "H:MM:SS.cc" cho file ASS (khớp assTime trong render.js). */
function assTime(t) {
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = Math.floor(t % 60);
  const cs = Math.floor((t % 1) * 100);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

/** #rrggbb → &H00BBGGRR (màu ASS/libass, AA=00 là đục hoàn toàn). */
function hexToAssColor(hex) {
  let h = String(hex).replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const r = h.slice(0, 2), g = h.slice(2, 4), b = h.slice(4, 6);
  return `&H00${b}${g}${r}`.toUpperCase();
}

/** Escape text cho ASS: \ { } rồi \n → \N (xuống dòng của ASS). */
function escapeAssText(s) {
  return String(s)
    .replace(/\\/g, "\\\\")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/\n/g, "\\N");
}

/**
 * Override ASS cho 1 clip parity (phần trong {...} trước text).
 * x, y: tọa độ \pos (tâm chữ, Alignment 5 — khớp typewriter).
 * W, H: kích thước khung.
 * box (tùy chọn, đợt 11 P4): {x0, x1, y0, y1} — hình chữ nhật hộp chữ
 * thật (đo bằng PIL); có box thì \clip quét theo hộp chữ, không có thì
 * fallback quét khung hình như đợt 10 (tương thích ngược self-test cũ).
 */
function parityOverride(anim, x, y, W, H, box) {
  switch (anim) {
    case "tiltIn":
      // CSS vcut-tilt-in: from { opacity 0, rotate(-12deg) translateY(20px) }
      // to { opacity 1, rotate(0) translateY(0) }, 0.7s ease-out.
      // \fad tuyến tính ≈ ease-out ở mức nhận biết được (xem LIMITS §4).
      return `{\\pos(${x},${y})\\fr-12\\move(${x},${y + 20},${x},${y},0,700)\\fad(700,0)\\t(0,700,\\fr0)}`;
    case "skewIn": {
      // CSS vcut-skew-in: 0% { skewX(-25deg) translateX(-30px) }
      // 60% { skewX(8deg) translateX(0) } 100% { skewX(0) }, 0.6s.
      // skewX(θ) → \fax = tan(θ): tan(-25°) = -0.466, tan(8°) = 0.1405.
      // \move kết thúc ở 360ms (60% của 0.6s) rồi giữ nguyên vị trí.
      const fax0 = -0.466, faxMid = 0.1405;
      return `{\\pos(${x},${y})\\fax${fax0}\\move(${x - 30},${y},${x},${y},0,360)\\fad(600,0)\\t(0,360,\\fax${faxMid})\\t(360,600,\\fax0)}`;
    }
    case "slideReveal": {
      // CSS vcut-slide-reveal: clip-path inset(0 100% 0 0) → inset(0 0 0 0), 1s.
      // Có box: \clip từ hình chữ nhật rộng 0 ở mép trái HỘP CHỮ quét tới
      // full hộp. Không box: fallback quét khung hình (đợt 10).
      if (box) return `{\\pos(${x},${y})\\clip(${box.x0},${box.y0},${box.x0},${box.y1})\\t(0,1000,\\clip(${box.x0},${box.y0},${box.x1},${box.y1}))}`;
      return `{\\pos(${x},${y})\\clip(0,0,0,${H})\\t(0,1000,\\clip(0,0,${W},${H}))}`;
    }
    case "curtainIn": {
      // CSS vcut-curtain-in: clip-path inset(0 50% 0 50%) → inset(0 0 0 0)
      // + opacity 0 → 1, 0.8s. Có box: \clip từ khe 0 ở TÂM HỘP CHỮ mở ra
      // full hộp. Không box: fallback khe giữa khung (đợt 10).
      if (box) {
        const bc = Math.round((box.x0 + box.x1) / 2);
        return `{\\pos(${x},${y})\\clip(${bc},${box.y0},${bc},${box.y1})\\fad(800,0)\\t(0,800,\\clip(${box.x0},${box.y0},${box.x1},${box.y1}))}`;
      }
      const cx = Math.round(W / 2);
      return `{\\pos(${x},${y})\\clip(${cx},0,${cx},${H})\\fad(800,0)\\t(0,800,\\clip(0,0,${W},${H}))}`;
    }
    default:
      throw new Error(`text animation parity không hỗ trợ: ${JSON.stringify(anim)}`);
  }
}

/**
 * Hệ số scale libass/PIL (đo thật, đợt 11 P4): cùng font file, cùng size,
 * libass qua filter `subtitles` (PlayRes = kích thước khung) vẽ chữ hẹp
 * hơn PIL/FreeType khoảng 0.84 lần — đo trên 5 probe: DejaVu Sans 48/64/
 * 76/96 (0.837–0.841), DejaVu Serif 720p (0.846), DejaVu Sans Bold
 * "XIN CHÀO" (0.849); chiều dọc caps cũng 0.851. Nguyên nhân gốc chưa
 * xác định (nghi scale nội bộ của libass/subtitles), nên hệ số này là
 * hiệu chuẩn thực nghiệm cho đúng pipeline này (subtitles + PlayRes =
 * khung), không phải hằng số phổ quát — test render pixel cuối đợt sẽ
 * bắt nó nếu FFmpeg/libass đổi hành vi. Áp đều cho w và h.
 */
const LIBASS_SCALE = 0.84;

/**
 * Hình chữ nhật hộp chữ (tọa độ khung, số nguyên) cho 1 clip từ hộp đo
 * PIL {w, h} — nhân LIBASS_SCALE rồi đặt tâm hộp = tâm \pos của clip.
 * Trả về null khi không đo được (w/h ≤ 0, hộp suy biến sau clamp) để
 * caller fallback quét khung hình. Y mở rộng ±2px chống cắt descender
 * do làm tròn.
 */
function textBoxRect(clip, meta, box) {
  if (!box || !(box.w > 0) || !(box.h > 0)) return null;
  const w = box.w * LIBASS_SCALE, h = box.h * LIBASS_SCALE;
  const cx = Math.round(meta.width * (clip.style.x ?? 0.5));
  const cy = Math.round(meta.height * (clip.style.y ?? 0.5));
  const x0 = Math.max(0, Math.round(cx - w / 2));
  const x1 = Math.min(meta.width, Math.round(cx + w / 2));
  const y0 = Math.max(0, Math.round(cy - h / 2) - 2);
  const y1 = Math.min(meta.height, Math.round(cy + h / 2) + 2);
  if (x1 <= x0 || y1 <= y0) return null;
  return { x0, x1, y0, y1 };
}

/**
 * Dựng file ASS cho các text clip parity (1 dialogue / 1 clip, suốt clip).
 * @param {Array} clips  text clip có style.animation thuộc PARITY_ANIMATIONS
 * @param {{width: number, height: number}} meta  kích thước khung
 * @param {Map|Object} [boxById]  clip.id → {w, h} đo thật bằng PIL
 *   (đợt 11 P4); thiếu entry / hộp suy biến → clip đó fallback quét khung
 * @returns {string} đường dẫn file ASS tạm (caller dọn như assFile/karaokeAssFile)
 */
function buildParityAss(clips, meta, boxById) {
  const boxOf = (clip) => {
    if (!boxById) return undefined;
    if (boxById instanceof Map) return boxById.get(clip.id);
    return boxById[clip.id];
  };
  const L = [];
  L.push("[Script Info]", "Title: repo1-text-parity", "ScriptType: v4.00+",
    `PlayResX: ${meta.width}`, `PlayResY: ${meta.height}`, "ScaledBorderAndShadow: yes", "");
  L.push("[V4+ Styles]");
  L.push("Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, " +
    "BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, " +
    "BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding");
  clips.forEach((clip, ci) => {
    const st = clip.style;
    const borderStyle = st.backgroundColor ? 3 : 1; // 3 = hộp nền đục
    const back = st.backgroundColor ? hexToAssColor(st.backgroundColor) : "&H00000000";
    L.push(`Style: PA${ci},${st.fontFamily},${Math.round(st.fontSize)},` +
      `${hexToAssColor(st.color)},&H000000FF,&H80000000,${back},` +
      `${st.bold ? -1 : 0},${st.italic ? -1 : 0},0,0,100,100,0,0,` +
      `${borderStyle},2,0,5,10,10,10,1`);
  });
  L.push("", "[Events]");
  L.push("Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text");
  clips.forEach((clip, ci) => {
    const st = clip.style;
    const x = Math.round(meta.width * (st.x ?? 0.5));
    const y = Math.round(meta.height * (st.y ?? 0.5));
    const ov = parityOverride(st.animation, x, y, meta.width, meta.height,
      textBoxRect(clip, meta, boxOf(clip)));
    const t0 = clip.start, t1 = clip.start + clip.duration;
    L.push(`Dialogue: 0,${assTime(t0)},${assTime(t1)},PA${ci},,0,0,0,,${ov}${escapeAssText(clip.text)}`);
  });
  const file = path.join(os.tmpdir(), `repo1-text-parity-${process.pid}.ass`);
  fs.writeFileSync(file, L.join("\n") + "\n", "utf8");
  return file;
}

// ---------------------------------------------------------------------------
// Self-test: node src/textAnimParity.js --self-test
// ---------------------------------------------------------------------------
function selfTest() {
  assert.deepStrictEqual(PARITY_ANIMATIONS, ["tiltIn", "skewIn", "slideReveal", "curtainIn"]);
  assert.ok(isParityAnimation("tiltIn") && isParityAnimation("curtainIn"));
  assert.ok(!isParityAnimation("fadeUp") && !isParityAnimation("typewriter") && !isParityAnimation("zoomIn"));

  // tiltIn: xoay -12° về 0, trồi từ +20px, mờ vào 700ms.
  let ov = parityOverride("tiltIn", 320, 180, 640, 360);
  assert.ok(ov.includes("\\fr-12"), `tiltIn thiếu \\fr-12: ${ov}`);
  assert.ok(ov.includes("\\move(320,200,320,180,0,700)"), `tiltIn move sai: ${ov}`);
  assert.ok(ov.includes("\\fad(700,0)"), `tiltIn thiếu fad: ${ov}`);
  assert.ok(ov.includes("\\t(0,700,\\fr0)"), `tiltIn thiếu \\t fr: ${ov}`);

  // skewIn: fax = tan(góc CSS), qua trung gian +8° ở 360ms.
  ov = parityOverride("skewIn", 320, 180, 640, 360);
  assert.ok(ov.includes("\\fax-0.466"), `skewIn thiếu fax -0.466 (=tan -25°): ${ov}`);
  assert.ok(ov.includes("\\move(290,180,320,180,0,360)"), `skewIn move sai: ${ov}`);
  assert.ok(ov.includes("\\t(0,360,\\fax0.1405)"), `skewIn thiếu fax trung gian: ${ov}`);
  assert.ok(ov.includes("\\t(360,600,\\fax0)"), `skewIn thiếu fax cuối: ${ov}`);

  // slideReveal: clip 0 → full khung trong 1000ms, không fad.
  ov = parityOverride("slideReveal", 320, 180, 640, 360);
  assert.ok(ov.includes("\\clip(0,0,0,360)"), `slideReveal clip đầu sai: ${ov}`);
  assert.ok(ov.includes("\\t(0,1000,\\clip(0,0,640,360))"), `slideReveal clip cuối sai: ${ov}`);
  assert.ok(!ov.includes("\\fad"), `slideReveal không được fad: ${ov}`);

  // curtainIn: clip khe giữa → full khung trong 800ms + fad.
  ov = parityOverride("curtainIn", 320, 180, 640, 360);
  assert.ok(ov.includes("\\clip(320,0,320,360)"), `curtainIn clip đầu sai: ${ov}`);
  assert.ok(ov.includes("\\t(0,800,\\clip(0,0,640,360))"), `curtainIn clip cuối sai: ${ov}`);
  assert.ok(ov.includes("\\fad(800,0)"), `curtainIn thiếu fad: ${ov}`);

  assert.throws(() => parityOverride("rotateIn", 0, 0, 640, 360), /không hỗ trợ/);

  // Đợt 11 P4: có box hộp chữ thì \clip quét theo hộp, không quét khung.
  // Hộp [220,420]×[198,262] (chữ 200×64 tâm 320,230): slideReveal quét
  // từ x=220 tới 420; curtainIn mở từ tâm hộp 320 ra hai mép hộp.
  const box = { x0: 220, x1: 420, y0: 198, y1: 262 };
  ov = parityOverride("slideReveal", 320, 230, 640, 360, box);
  assert.ok(ov.includes("\\clip(220,198,220,262)"), `slideReveal hộp: clip đầu sai: ${ov}`);
  assert.ok(ov.includes("\\t(0,1000,\\clip(220,198,420,262))"), `slideReveal hộp: clip cuối sai: ${ov}`);
  ov = parityOverride("curtainIn", 320, 230, 640, 360, box);
  assert.ok(ov.includes("\\clip(320,198,320,262)"), `curtainIn hộp: clip đầu sai: ${ov}`);
  assert.ok(ov.includes("\\t(0,800,\\clip(220,198,420,262))"), `curtainIn hộp: clip cuối sai: ${ov}`);
  // tiltIn/skewIn không dùng \clip nên box không đổi override của chúng.
  ov = parityOverride("tiltIn", 320, 180, 640, 360, box);
  assert.ok(ov.includes("\\fr-12") && !ov.includes("\\clip"), `tiltIn không được có \\clip: ${ov}`);
  // textBoxRect: tâm clip → hộp PIL nhân LIBASS_SCALE 0.84, clamp mép
  // khung, null khi hộp suy biến. w=200,h=64 → w_eff=168, h_eff=53.76.
  const rect = textBoxRect(
    { style: { x: 0.5, y: 0.64, animation: "slideReveal" } },
    { width: 640, height: 360 }, { w: 200, h: 64 });
  assert.deepStrictEqual(rect, { x0: 236, x1: 404, y0: 201, y1: 259 },
    `textBoxRect sai: ${JSON.stringify(rect)}`);
  assert.strictEqual(textBoxRect({ style: {} }, { width: 640, height: 360 }, { w: 0, h: 64 }), null);
  assert.strictEqual(textBoxRect({ style: {} }, { width: 640, height: 360 }, undefined), null);
  // buildParityAss với boxById: dialogue slideReveal dùng clip hộp chữ
  // (PIL w=208,h=75 → libass w_eff=174.72, h_eff=63, tâm 320,230).
  const boxClips = [
    { id: "r1", start: 0, duration: 2, text: "REVEAL",
      style: { animation: "slideReveal", fontFamily: "DejaVu Sans", fontSize: 64, color: "#ffffff", x: 0.5, y: 0.64 } },
  ];
  const boxFile = buildParityAss(boxClips, { width: 640, height: 360 },
    new Map([["r1", { w: 208, h: 75 }]]));
  const boxBody = fs.readFileSync(boxFile, "utf8");
  assert.ok(boxBody.includes("\\clip(233,197,233,264)"),
    `buildParityAss hộp: clip đầu sai: ${boxBody.split("\n").find((l) => l.startsWith("Dialogue"))}`);
  assert.ok(boxBody.includes("\\t(0,1000,\\clip(233,197,407,264))"),
    `buildParityAss hộp: clip cuối sai`);
  fs.unlinkSync(boxFile);

  // buildParityAss: 1 file, đủ dialogue, escape { } và xuống dòng \N.
  const clips = [
    { id: "p1", start: 0.5, duration: 4, text: "A{B}\nC",
      style: { animation: "tiltIn", fontFamily: "DejaVu Sans", fontSize: 48, color: "#ffffff", x: 0.5, y: 0.5 } },
  ];
  const file = buildParityAss(clips, { width: 640, height: 360 });
  const body = fs.readFileSync(file, "utf8");
  assert.ok(body.includes("PlayResX: 640"), "thiếu PlayResX");
  assert.ok(body.includes("Dialogue: 0,0:00:00.50,0:00:04.50,PA0"), `dialogue sai: ${body.split("\n").find((l) => l.startsWith("Dialogue"))}`);
  assert.ok(body.includes("A\\{B\\}\\NC"), "escape ASS sai");
  fs.unlinkSync(file);

  console.log("✅ textAnimParity.js self-test: tất cả assertion pass");
}

if (require.main === module) {
  if (process.argv.includes("--self-test")) selfTest();
  else {
    console.log("textAnimParity.js — module ASS cho text animation rotate/skew/clip. Chạy với --self-test để kiểm tra.");
    process.exit(2);
  }
}

module.exports = {
  PARITY_ANIMATIONS,
  isParityAnimation,
  buildParityAss,
  parityOverride,
  textBoxRect,
  LIBASS_SCALE,
};
