/**
 * speedramp.js — Speed ramp cho render worker (Phase 7 P3).
 *
 * Toán đường cong MIRROR CHÍNH XÁC packages/video-spec/src/speedcurve.ts:
 * nếu đổi công thức ở đây, PHẢI đổi cả bên kia (test parity: test_p3.js).
 *
 * CÁCH RENDER (segment-based, đã kiểm chứng):
 *   Clip được chia thành các đoạn output ~0.2s. Mỗi đoạn dùng tốc độ hằng
 *   = speedAt tại giữa đoạn, rồi:
 *     video: trim nguồn [in+srcStart, in+srcStart+srcDur) → setpts=PTS/speed
 *     audio: atrim tương tự → atempo (tách factor [0.5, 2.0] như speed.js)
 *   rồi concat các đoạn lại. Tổng thời lượng output = clip.duration đúng
 *   theo thiết kế (tổng outDur), nên A/V đồng bộ theo từng đoạn (sai số
 *   tích lũy ≤ 1 frame video / 1 frame audio mỗi đoạn, không lệch dần).
 *
 * GIỚI HẠN (ghi trong P3_LIMITS.md):
 *   - reverse + speedKeyframes: không hỗ trợ (validator báo lỗi).
 *   - Tốc độ từng đoạn bị kẹp về [0.25, 4] — keyframe ngoài khoảng bị
 *     validator chặn từ đầu nên thực tế không xảy ra.
 *   - Clip ramp trong transition unit: chain ramp cho ra 1 stream chuẩn
 *     WxH/fps nên xfade vẫn làm việc (đã test ở test_p3.js).
 *
 * Phase 9 đợt 8 S3 — RAMP + MOTION (slow-mo mượt / nội suy frame /
 * motion blur, chỉ dùng filter FFmpeg có sẵn, KHÔNG model đóng, KHÔNG cloud):
 *
 * NGỮ NGHĨA CHỐT cho clip ramp (có speedKeyframes) + clip.motion:
 *   Clip ramp được concat các đoạn thành stream CFR ở fps project TRƯỚC,
 *   rồi mới áp motion post-chain (cuối postChain, TRƯỚC mask — mask do
 *   caller áp sau khi buildSpeedRampVideo trả label nên thứ tự này tự đúng).
 *   - motion.interpolation='minterpolate' → `minterpolate=fps=
 *     <projectFps>` với CÙNG fps project (không tăng fps, không tăng số
 *     frame của ramp): mục đích là làm mượt các frame LẶP trong đoạn
 *     slow-mo (speed < 1) bằng ước lượng chuyển động, thay frame lặp bằng
 *     frame nội suy giữa 2 frame kề. KHÔNG claim tăng số frame cho ramp —
 *     số frame vẫn = duration*fps.
 *   - motion.motionBlur { frames, weights? } → `tmix` áp SAU minterpolate,
 *     trên các frame đã nội suy (blur theo thời gian, làm mờ chuyển động
 *     nhanh).
 *   - Ramp + motion nhưng KHÔNG có đoạn nào speed < 1: interpolation vẫn
 *     chạy (không fail-fast vô lý) nhưng hiệu quả ~0 vì không có frame lặp
 *     để nội suy — stream vẫn CFR đúng số frame, chỉ tốn thời gian encode.
 *   - motion.targetFps (shape tạm của S2, xem buildMotionPostChain): với
 *     nhánh ramp BẮT BUỘC bằng fps project hoặc bỏ trống; khác fps project
 *     thì fail-fast (ramp đã CFR ở fps project, upsample ở đây sẽ đổi số
 *     frame và phá đồng bộ concat/mask/xfade phía sau — không lặng lẽ bỏ qua).
 *   - TƯƠNG TÁC ĐÃ CHẶN (giữ nguyên, không nới): ramp + motion + stabilize
 *     (render.js nhánh isRamp + validator), ramp + motion + reverse
 *     (validator chặn reverse + speedKeyframes; nhánh isRamp kiểm tra lại).
 *   - TƯƠNG TÁC ĐÃ KIỂM TRA, KHÔNG VỠ NÊN KHÔNG CHẶN: mask keyframes +
 *     minterpolate — mask animation (buildMaskAnimChain) trim theo đúng
 *     duration*fps và áp SAU postChain; minterpolate cùng fps giữ nguyên
 *     số frame và CFR nên mask vẫn khớp từng frame, không cần fail-fast.
 *   - KHỚP S2 (đã hạ cánh): motion.js của S2 (nhánh clip thường) định
 *     nghĩa shape thật clip.motion, và buildMotionPostChain dưới đây
 *     IMPORT TRỰC TIẾP buildMotionFpsFilter/buildMotionBlurChain/
 *     validateMotion từ motion.js — không còn shape tạm, không có 2 shape
 *     song song. Shape thật (xem motion.js): interpolation 'none' |
 *     'minterpolate', targetFps 1..120, miMode 'mci' | 'blend',
 *     motionBlur { frames 2..8, weights? }. Điểm KHÁC DUY NHẤT của nhánh
 *     ramp so với nhánh thường: targetFps của ramp BẮT BUỘC bằng fps
 *     project (nhánh thường cho phép khác fps khi không dính transition,
 *     rồi output bị -r chuẩn hoá lại — ramp không được phép vì concat/
 *     mask/xfade phía sau đều giả định CFR đúng fps project).
 *   - VỊ TRÍ minterpolate TRONG RAMP (đo thật, không đoán): minterpolate
 *     KHÔNG được áp sau khi stream đã CFR (tức sau fps từng đoạn + fps
 *     sau concat) — ở vị trí đó nó gần như passthrough (frame-diff y hệt
 *     bản không motion) và còn làm ĐEN frame cuối (mean 0.0, đo ngày
 *     26/10 trên testsrc2/smooth). Vì vậy khi interpolation bật,
 *     buildSpeedRampVideo BỎ fps từng đoạn và BỎ fps sau concat, để
 *     minterpolate THAY THẾ bước CFR (đúng như S2: interpolation thay
 *     fps) và nhận stream đã stretch theo tốc độ đoạn — lúc đó các frame
 *     lặp trong đoạn slow-mo mới được nội suy thật. Thứ tự post khi có
 *     interpolation: minterpolate, tmix (nếu có), rồi mới color/LUT/
 *     effects (khớp thứ tự S2: motion ngay sau fps, trước xử lý pixel).
 *     Khi chỉ có motionBlur không interpolation thì giữ nguyên cấu trúc
 *     cũ và tmix nằm cuối postChain. Lệch khỏi ví dụ "cuối postChain"
 *     trong brief S3 ở đúng điểm này là có chủ đích, vì vị trí cuối
 *     chain đã được đo là không có tác dụng thật.
 *   - Phase 9 đợt 9 M1 (vá đuôi đóng băng, chung với nhánh thường):
 *     khi interpolation bật và có duration, buildMotionPostChain chèn
 *     thêm tpad clone-pad TRƯỚC minterpolate và trim đúng slot
 *     (end_frame=duration*fps) SAU tmix, vẫn trước color/LUT/effects;
 *     fps sau minterpolate giữ lại làm lưới an toàn. Đuôi ramp đo trước
 *     M1 vốn chỉ còn ~2 frame diff giảm nhẹ (0.12–0.14, không phải 0)
 *     nên M1 ở nhánh ramp chủ yếu chuẩn hóa số frame bằng trim thay vì
 *     trông cậy fps lấp đuôi — xem MOTION_LIMITS.md mục M1.
 */
"use strict";

const { atempoFactors } = require("./speed");
// Phase 9 đợt 8 S3: tái dùng trực tiếp builder/validator của S2 (motion.js)
// để nhánh ramp và nhánh clip thường dùng đúng một shape motion duy nhất.
const {
  buildMotionFpsFilter, buildMotionBlurChain, buildMotionTailFix, validateMotion,
} = require("./motion");

const SPEED_MIN = 0.25;
const SPEED_MAX = 4;

function ffNum(x) {
  if (!Number.isFinite(x)) throw new Error(`số không hợp lệ cho filter: ${x}`);
  return String(Math.round(x * 1e6) / 1e6);
}

function normalizeSpeedKeyframes(kfs) {
  const sorted = [...kfs].sort((a, b) => a.t - b.t);
  const out = [];
  for (const k of sorted) {
    const last = out[out.length - 1];
    if (last && last.t === k.t) out[out.length - 1] = k;
    else out.push(k);
  }
  return out;
}

function cubicBezierY(x1, y1, x2, y2, x) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (t) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t) => ((ay * t + by) * t + cy) * t;
  const sampleDX = (t) => (3 * ax * t + 2 * bx) * t + cx;
  const c = Math.min(1, Math.max(0, x));
  if (c === 0) return 0;
  if (c === 1) return 1;
  let t = c;
  for (let i = 0; i < 8; i++) {
    const err = sampleX(t) - c;
    if (Math.abs(err) < 1e-6) return sampleY(t);
    const d = sampleDX(t);
    if (Math.abs(d) < 1e-6) break;
    t -= err / d;
  }
  let lo = 0;
  let hi = 1;
  t = c;
  while (hi - lo > 1e-6) {
    if (sampleX(t) < c) lo = t;
    else hi = t;
    t = (lo + hi) / 2;
  }
  return sampleY(t);
}

function applySpeedEasing(easing, p, bezier) {
  const c = Math.min(1, Math.max(0, p));
  if (easing === "linear") return c;
  if (easing === "ease-in") return c * c;
  if (easing === "ease-out") return 1 - (1 - c) * (1 - c);
  if (easing === "bezier") {
    const b = bezier ?? [0.25, 0.1, 0.25, 1];
    return cubicBezierY(b[0], b[1], b[2], b[3], c);
  }
  throw new Error(`easing không hỗ trợ: ${easing}`);
}

function speedAt(curve, t) {
  const ks = normalizeSpeedKeyframes(curve.keyframes);
  if (ks.length === 0) throw new Error("speedAt: mảng keyframes rỗng");
  if (ks.length === 1) return ks[0].v;
  if (t <= ks[0].t) return ks[0].v;
  const last = ks[ks.length - 1];
  if (t >= last.t) return last.v;
  for (let i = 0; i < ks.length - 1; i++) {
    const a = ks[i];
    const b = ks[i + 1];
    if (t >= a.t && t <= b.t) {
      const span = b.t - a.t;
      const p = span <= 0 ? 0 : (t - a.t) / span;
      return a.v + (b.v - a.v) * applySpeedEasing(a.easing, p, a.bezier);
    }
  }
  return last.v;
}

function integrateSpeed(curve, a, b) {
  if (b <= a) return 0;
  const ks = normalizeSpeedKeyframes(curve.keyframes);
  if (ks.length === 0) throw new Error("integrateSpeed: mảng keyframes rỗng");
  if (ks.length === 1) return ks[0].v * (b - a);
  const cuts = [a];
  for (const k of ks) if (k.t > a && k.t < b) cuts.push(k.t);
  cuts.push(b);
  let total = 0;
  for (let i = 0; i < cuts.length - 1; i++) {
    const x0 = cuts[i];
    const x1 = cuts[i + 1];
    const span = x1 - x0;
    let seg = null;
    for (let j = 0; j < ks.length - 1; j++) {
      if (x0 >= ks[j].t - 1e-12 && x1 <= ks[j + 1].t + 1e-12) {
        seg = { v0: ks[j].v, v1: ks[j + 1].v, easing: ks[j].easing, bezier: ks[j].bezier, t0: ks[j].t, segSpan: ks[j + 1].t - ks[j].t };
        break;
      }
    }
    if (!seg) {
      total += speedAt(curve, (x0 + x1) / 2) * span;
      continue;
    }
    if (seg.easing === "linear" || seg.easing === "ease-in" || seg.easing === "ease-out") {
      // SỬA Phase 8 Q3 (mirror speedcurve.ts): tích phân ĐÚNG trên đoạn con
      // bằng nguyên hàm theo easing; đoạn đầy đủ cho kết quả y hệt bản cũ.
      const { v0, v1, easing } = seg;
      const S = seg.segSpan;
      const p0 = S <= 0 ? 0 : (x0 - seg.t0) / S;
      const p1 = S <= 0 ? 0 : (x1 - seg.t0) / S;
      const anti = (p) =>
        easing === "linear" ? (p * p) / 2
        : easing === "ease-in" ? (p * p * p) / 3
        : p + Math.pow(1 - p, 3) / 3;
      total += v0 * span + (v1 - v0) * S * (anti(p1) - anti(p0));
    } else {
      const n = 64;
      const h = span / n;
      let s = speedAt(curve, x0) + speedAt(curve, x1);
      for (let k = 1; k < n; k++) {
        s += (k % 2 === 0 ? 2 : 4) * speedAt(curve, x0 + k * h);
      }
      total += (s * h) / 3;
    }
  }
  return total;
}

function sourcePosAt(curve, t) {
  if (t <= 0) return 0;
  return integrateSpeed(curve, 0, t);
}

function sourceConsumed(curve, duration) {
  return sourcePosAt(curve, duration);
}

function planSpeedSegments(curve, duration) {
  if (duration <= 0) throw new Error("planSpeedSegments: duration phải > 0");
  const MAX_SEGMENTS = 240;
  let segOut = 0.2;
  if (duration / segOut > MAX_SEGMENTS) segOut = duration / MAX_SEGMENTS;
  if (segOut < 0.05) segOut = 0.05;
  const segs = [];
  let out = 0;
  let src = 0;
  while (out < duration - 1e-9) {
    const d = Math.min(segOut, duration - out);
    const speed = speedAt(curve, out + d / 2);
    const srcDur = d * speed;
    segs.push({ outStart: out, outDur: d, speed, srcStart: src, srcDur });
    out += d;
    src += srcDur;
  }
  return segs;
}

/**
 * Phase 9 đợt 8 S3 — dựng motion post-chain cho nhánh RAMP.
 *
 * Shape thật của S2 (motion.js): clip.motion = { interpolation?: 'none' |
 * 'minterpolate', targetFps?: number (1..120), miMode?: 'mci' | 'blend',
 * motionBlur?: { frames: 2..8, weights?: number[] } }.
 *   - interpolation='minterpolate' → minterpolate cùng fps project (xem
 *     header): chuỗi filter lấy NGUYÊN từ buildMotionFpsFilter của S2
 *     (mci: mc_mode=aobmc, me_mode=bidir, vsbmc=1; blend: chỉ mi_mode).
 *   - targetFps: bỏ trống hoặc === fps project; khác thì throw — đây là
 *     điểm khác duy nhất so với nhánh thường (xem header).
 *   - motionBlur → tmix lấy nguyên từ buildMotionBlurChain của S2
 *     (frames + weights, mặc định weights cân bằng), áp SAU minterpolate.
 *   - Giá trị field sai (miMode lạ, frames ngoài 2..8, weights lệch...)
 *     thì validateMotion của S2 báo lỗi và hàm này throw gộp các lỗi đó
 *     (builder throw, khác validate.js gom lỗi — ngữ cảnh khác nhau).
 * Trả về chuỗi filter bắt đầu bằng "," ("" khi motion rỗng/không có hiệu
 * ứng nào bật), để caller nối vào cuối postChain. motion null/undefined
 * → "" (clip ramp không motion giữ nguyên hành vi cũ 100%).
 */
function buildMotionPostChain(motion, fps, duration) {
  if (motion === undefined || motion === null) return "";
  const errs = validateMotion(motion, { projectFps: fps });
  if (errs.length) {
    throw new Error(`clip.motion không hợp lệ (nhánh ramp): ${errs.join("; ")}`);
  }
  // Quy tắc riêng của nhánh ramp (validator của S2 không cấm vì nhánh
  // thường cho phép targetFps khác fps khi không dính transition):
  if (motion.interpolation === "minterpolate" &&
      motion.targetFps !== undefined && motion.targetFps !== fps) {
    throw new Error(`clip ramp + motion: motion.targetFps (${motion.targetFps}) khác fps project (${fps}) — ` +
      `nhánh ramp đã CFR ở fps project nên minterpolate chỉ chạy cùng fps project; ` +
      `đặt targetFps = ${fps} hoặc bỏ trống (không upsample số frame cho ramp)`);
  }
  const parts = [];
  if (motion.interpolation === "minterpolate") {
    // targetFps đã bị ép === fps (hoặc bỏ trống) ở trên nên chuỗi này luôn
    // là minterpolate=fps=<projectFps> — không tăng số frame cho ramp.
    // Phase 9 đợt 9 M1: cặp vá đuôi của motion.js đi cùng nhau — tpad
    // clone-pad TRƯỚC minterpolate, trim đúng slot SAU tmix; chỉ bật
    // khi có duration (caller render.js luôn truyền clip.duration, và
    // buildSpeedRampVideo tự suy ra từ clip.motion cũng có duration).
    // Thiếu duration thì giữ hành vi đợt 8 (fps lấp đuôi) như nhánh thường.
    const tailFix = buildMotionTailFix(motion, fps, duration);
    if (tailFix.preFilter) parts.push(tailFix.preFilter);
    parts.push(buildMotionFpsFilter(motion, fps));
    const blurChain = buildMotionBlurChain(motion);
    if (blurChain) parts.push(blurChain.replace(/^,/, ""));
    if (tailFix.tailFilter) parts.push(tailFix.tailFilter.replace(/^,/, ""));
  } else {
    const blurChain = buildMotionBlurChain(motion);
    if (blurChain) parts.push(blurChain.replace(/^,/, ""));
  }
  return parts.length ? `,${parts.join(",")}` : "";
}

/**
 * Dựng chain video ramp: mỗi đoạn trim+setpts+chuẩn hoá WxH/fps/format,
 * rồi concat thành 1 stream. `postChain` là chuỗi filter áp sau concat
 * (chroma/color/LUT/effects/plugin — KHÔNG gồm format, vì format đã nằm
 * trong từng đoạn). Trả về { lines: string[], label } để caller push vào fc
 * và dùng label như stream clip bình thường.
 *
 * @param {string} streamRef ví dụ "[0:v]"
 * @param {object} clip clip có { in, duration, speedKeyframes }
 * @param {object} opts { W, H, fps, outFormat, padColor, enhPreChain, preScaleChain, postChain, motionPostChain, lbl }
 *   enhPreChain: chuỗi bắt đầu bằng "," áp sau setpts=PTS-STARTPTS, TRƯỚC
 *     setpts=PTS/speed (giữ đúng thứ tự gốc: enhance → speed).
 *   preScaleChain: chuỗi bắt đầu bằng "," áp sau setpts/speed, trước scale (chroma key).
 *   postChain: chuỗi bắt đầu bằng "," áp sau concat (color/LUT/effects/plugin).
 *   motionPostChain (S3): chuỗi bắt đầu bằng "," từ buildMotionPostChain.
 *     Nếu bỏ trống mà clip.motion có mặt thì TỰ suy ra từ clip.motion
 *     (tránh lặng lẽ bỏ qua motion); motionPostChain truyền tường minh
 *     (kể cả "") thì thắng — caller đã chịu trách nhiệm.
 *     Vị trí áp dụng (xem header S3): nếu chuỗi motion chứa minterpolate
 *     thì minterpolate (+tmix kèm theo) THAY THẾ bước fps — tức bỏ fps
 *     từng đoạn, bỏ fps sau concat, và motion đứng TRƯỚC các filter
 *     postChain khác; nếu chỉ có tmix thì tmix nằm CUỐI postChain
 *     (sau effects/plugin). Trong cả hai trường hợp mask vẫn áp sau cùng
 *     do caller áp sau khi hàm này trả label.
 */
function buildSpeedRampVideo(streamRef, clip, opts) {
  // S3 fail-fast (defense in depth — validator đã chặn reverse + ramp):
  // reverse đảo thứ tự frame nguồn nên minterpolate/tmix trên ramp đảo
  // sẽ nội suy sai hướng chuyển động; chặn thay vì render sai lặng lẽ.
  if (clip.motion !== undefined && clip.motion !== null && clip.reverse === true) {
    throw new Error(`clip "${clip.id}": speedKeyframes + motion không dùng chung được với reverse=true (validator đã chặn reverse + speedKeyframes)`);
  }
  // S3: tính motion chain TRƯỚC vòng đoạn vì quyết định có minterpolate
  // hay không sẽ đổi cả fps từng đoạn (xem header S3 — minterpolate thay
  // bước fps, không áp sau stream đã CFR).
  const postBase = opts.postChain ? opts.postChain.replace(/^,/, "") : "";
  const motionChain = opts.motionPostChain !== undefined
    ? opts.motionPostChain
    : (clip.motion !== undefined && clip.motion !== null
      ? buildMotionPostChain(clip.motion, opts.fps, clip.duration)
      : "");
  if (typeof motionChain !== "string") {
    throw new Error(`motionPostChain phải là chuỗi filter, nhận được: ${JSON.stringify(motionChain)}`);
  }
  const motionFilters = motionChain.replace(/^,/, "");
  const hasInterp = motionFilters.includes("minterpolate");
  // Có interpolation: motion (minterpolate + tmix kèm theo) đứng TRƯỚC
  // postChain khác; chỉ có tmix: tmix đứng CUỐI postChain (xem header S3).
  const post = hasInterp
    ? [motionFilters, postBase].filter(Boolean).join(",")
    : [postBase, motionFilters].filter(Boolean).join(",");
  const segs = planSpeedSegments(clip.speedKeyframes, clip.duration);
  const enh = opts.enhPreChain || "";
  const pre = opts.preScaleChain || "";
  // Có interpolation: BỎ fps từng đoạn — stream sau concat vẫn mang nhịp
  // stretch theo tốc độ đoạn để minterpolate nội suy thật; fps sẽ do
  // minterpolate quyết ở bước sau concat. Không interpolation: giữ fps
  // từng đoạn như cũ (chuẩn hoá trước concat).
  const fpsPart = hasInterp ? "" : `,fps=${opts.fps}`;
  const lines = [];
  const labels = [];
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    const lab = opts.lbl("sr");
    const sStart = clip.in + s.srcStart;
    const sEnd = sStart + s.srcDur;
    lines.push(
      `${streamRef}trim=start=${ffNum(sStart)}:end=${ffNum(sEnd)},` +
        `setpts=PTS-STARTPTS${enh},setpts=PTS/${ffNum(s.speed)}${pre},` +
        `scale=${opts.W}:${opts.H}:force_original_aspect_ratio=decrease,` +
        `pad=${opts.W}:${opts.H}:(ow-iw)/2:(oh-ih)/2:color=${opts.padColor},` +
        `setsar=1${fpsPart},format=${opts.outFormat}[${lab}]`
    );
    labels.push(`[${lab}]`);
  }
  if (segs.length === 1) {
    // Chỉ 1 đoạn: không cần concat, label đoạn chính là output.
    const segLabel = labels[0];
    if (post) {
      const postLab = opts.lbl("srpost");
      lines.push(`${segLabel}${post}[${postLab}]`);
      return { lines, label: `[${postLab}]` };
    }
    return { lines, label: segLabel };
  }
  const out = opts.lbl("srout");
  lines.push(`${labels.join("")}concat=n=${segs.length}:v=1:a=0[${out}]`);
  // Không interpolation: concat làm mất timebase 1/fps của các đoạn (về
  // 1/1000000) → xfade từ chối vì 2 đầu vào lệch timebase. fps sau concat
  // khôi phục CFR 1/fps.
  // Có interpolation: KHÔNG thêm fps sau concat — minterpolate (đầu post)
  // chính là bước quyết CFR ở fps project; thêm fps nữa sẽ hủy tác dụng
  // nội suy (và gây đen frame cuối như đã đo ở vị trí cuối chain).
  let cfrLabel;
  if (hasInterp) {
    cfrLabel = `[${out}]`;
  } else {
    const cfr = opts.lbl("srcfr");
    lines.push(`[${out}]fps=${opts.fps}[${cfr}]`);
    cfrLabel = `[${cfr}]`;
  }
  if (post) {
    const postLab = opts.lbl("srpost");
    lines.push(`${cfrLabel}${post}[${postLab}]`);
    return { lines, label: `[${postLab}]` };
  }
  return { lines, label: cfrLabel };
}

/**
 * Dựng chain audio ramp: mỗi đoạn atrim+atempo rồi concat thành 1 stream.
 * Trả về { lines, label } (label là stream sau concat, CHƯA qua
 * resample/aformat/effects/volume — caller nối tiếp như chain thường).
 */
function buildSpeedRampAudio(streamRef, clip, opts) {
  const segs = planSpeedSegments(clip.speedKeyframes, clip.duration);
  const lines = [];
  const labels = [];
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    const lab = opts.lbl("sa");
    const sStart = clip.in + s.srcStart;
    const sEnd = sStart + s.srcDur;
    const tempo = atempoFactors(s.speed).map((f) => `atempo=${ffNum(f)}`).join(",");
    lines.push(
      `${streamRef}atrim=start=${ffNum(sStart)}:end=${ffNum(sEnd)},` +
        `asetpts=PTS-STARTPTS${tempo ? `,${tempo}` : ""}[${lab}]`
    );
    labels.push(`[${lab}]`);
  }
  if (segs.length === 1) {
    // Chỉ 1 đoạn: không cần concat, label đoạn chính là output.
    return { lines, label: labels[0] };
  }
  const out = opts.lbl("saout");
  lines.push(`${labels.join("")}concat=n=${segs.length}:v=0:a=1[${out}]`);
  return { lines, label: `[${out}]` };
}

module.exports = {
  SPEED_MIN,
  SPEED_MAX,
  normalizeSpeedKeyframes,
  cubicBezierY,
  applySpeedEasing,
  speedAt,
  integrateSpeed,
  sourcePosAt,
  sourceConsumed,
  planSpeedSegments,
  buildSpeedRampVideo,
  buildSpeedRampAudio,
  buildMotionPostChain,
};

// Tự test nhanh khi chạy trực tiếp: node src/speedramp.js
if (require.main === module) {
  const curve = { keyframes: [
    { t: 0, v: 1, easing: "linear" },
    { t: 4, v: 2, easing: "linear" },
  ] };
  console.log("speedAt(2) =", speedAt(curve, 2), "(muốn 1.5)");
  console.log("consumed(4) =", sourceConsumed(curve, 4), "(muốn 6)");
  const segs = planSpeedSegments(curve, 4);
  console.log(`segments: ${segs.length}, sum outDur = ${segs.reduce((a, s) => a + s.outDur, 0)}`);
  console.log("sum srcDur =", segs.reduce((a, s) => a + s.srcDur, 0), "(≈ 6, sai số do tốc độ giữa đoạn)");
}
