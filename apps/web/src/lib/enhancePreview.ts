/**
 * enhancePreview.ts — enhance vào preview ở mức XẤP XỈ (Phase 9 đợt 60 Q1,
 * đóng nợ đợt 59 §6.9 + gap E3 phần còn lại).
 *
 * Bối cảnh: EnhancePanel (R2) + render enhance (hqdn3d/yadif/vidstab 2-pass,
 * xem docs/PHASE9_ROUND59_P9_ENHANCE_RENDER_LIMITS.md) đã có, nhưng preview
 * canvas chưa áp enhance — panel ghi "chỉ có tác dụng khi render". Module
 * này là logic THUẦN (không React/store/DOM) để preview.tsx dùng khi vẽ
 * frame, và test khóa được bằng esbuild+node.
 *
 * XẤP XỈ (ghi rõ, không mạo nhận là filter render thật):
 * - denoise (hqdn3d không gian + thời gian) → BLEND với bản mờ: composite
 *   = (1-a)·gốc + a·blur(3.0px), với a = denoiseBlendAlpha(strength)
 *   (HIỆU CHUẨN đợt 63 R3 — xem docs/PHASE9_ROUND63_R3_BLEND_FPS_LIMITS.md
 *   §2: đợt 62 dùng a = strength tuyến tính, vẫn overstate ở đầu thấp
 *   (s=0.3: -28.9% so với hqdn3d -19%, sai +9.9) vì không có mức alpha
 *   nào dưới -10% mà vẫn khác 0 trừ a<0.1. Đợt 63 đổi sang piecewise-
 *   linear qua 4 mốc khớp đúng hqdn3d flat15 720p: s=0.3 → -18.5%
 *   (sai -0.5), s=0.5 → -45.7% (-1.3), s=0.8 → -73.8% (-0.2),
 *   s=1.0 → -82.9% (-0.1); ở khổ preview 488×275 sai tối đa 2.3.
 *   Các biến thể đã thử và LOẠI (probe-blend-r63, cùng metric):
 *   a=s^p (p=1.25: sai tối đa 7.1; p=1.5: sai 13.4 — đầu giữa tụt),
 *   giảm bán kính blur ở a cao (B=3-1.5a: s=1.0 chỉ -67.6%, sai -15.4
 *   dù edge 4→2px), dual-radius (sai 17.1), blend có ngưỡng theo độ
 *   lệch pixel (edge 0px ở mọi mức nhưng khử nhiễu sụp hẳn: tối đa
 *   -16% ở s=1.0 so với mục tiêu -83% — xem LIMITS §2.3).
 *   Step-edge vẫn 4px ở a≥0.8 (bằng blur thuần ở s=1.0) — preview ở
 *   strength cao vẫn mềm hơn render thật (nợ mở, xem LIMITS §6).
 *   Trên footage nhiễu nặng (flat40) vẫn overstate như mọi xấp xỉ
 *   không gian (hqdn3d s=1.0 chỉ -26.7% trên flat40, blend cho -84.4%
 *   — hqdn3d có thành phần thời gian + thích nghi theo mức nhiễu mà
 *   không xấp xỉ không gian nào tái tạo được; xem LIMITS §2.4).
 * - stabilize (vidstab 2-pass: detect chuyển động rồi transform) → zoom
 *   crop gợi ý, smoothing 1..100 → zoom 1.0203..1.05 (mặc định smoothing
 *   10 → 1.023). Zoom chỉ gợi ý "khung hình đang được crop lại", KHÔNG
 *   làm mượt chuyển động thật (không có vector chuyển động, không có pass
 *   detect), KHÔNG giảm jitter đo được như render (redx std 3.507 → 1.55
 *   ở 320x180 — xem LIMITS đợt 59 P9 §4.2).
 *   ĐỢT 62 R3: clip có speedKeyframes thì stabilize bị CHẶN ở preview
 *   (zoom = 1, stabilize vào notApproximated, cờ
 *   stabilizeBlockedBySpeedRamp) — đồng bộ với render (validator + 
 *   render.js chặn hẳn, exit 1) và với panel (đợt 61 R2 chặn preset ở UI):
 *   trạng thái lỗi cũ (tạo trước khi chặn, qua MCP/CLI/file project)
 *   không còn hiện gợi ý zoom mà render từ chối.
 * - deinterlace (yadif) → XẤP XỈ BẰNG TAP DỌC 1 LẦN VẼ (đợt 75 C8,
 *   probe-75c8-deint): vẽ khung lệch dọc +0.5px output (bilinear →
 *   trung bình 2 dòng kề, hạt nhân [1,1]/2) — KHÔNG thêm lần vẽ nào
 *   (cùng 1 drawImage, chỉ đổi offset). Đo thật trên interlaced720
 *   1280×720, 3 mốc: R combing 1.12 → 0.67 (progressive đối chứng
 *   0.69, yadif render thật 0.57); giữ 73% độ sắc nét dọc trên
 *   footage progressive (vgrad 0.677/0.928). Các biến thể đã thử và
 *   LOẠI (cùng metric): tap2 ±0.5px alpha 0.5 (R 0.58 ≈ yadif nhưng
 *   tốn thêm 1 lần vẽ, chỉ giữ 62% vgrad), SVG feGaussianBlur σy
 *   0.8/1.2 (R 0.54 — mờ quá, chỉ giữ 52% vgrad; σ 0.8 vs 1.2 cho
 *   số giống hệt nhau — Chromium lượng tử hoá; chi phí raster của
 *   filter là điểm nghẽn FPS đã biết), ctx.filter blur(0.5px)
 *   (NO-OP hoàn toàn, MAD = 0 — blur <0.8px bị lượng tử hoá, khớp
 *   bài học đợt 61 R3 §2.1).
 *   Đợt 76 D4 — TAP ĐƠN LẺ QUA HALF-RES INTERMEDIATE: đợt 75 C8 đo FPS
 *   deint-only chỉ 0.65–0.71× (FAIL ngưỡng 0.75×) vì tap đi qua
 *   enhanceCanvas (2 lần vẽ full-res thay vì 1). Đợt 76 thử trước
 *   NỘI TUYẾN offset +0.5px vào lần vẽ cuối (deintInlineDy) — FPS
 *   0.99× nhưng R combing KHÔNG giảm ở tỉ lệ vẽ upscale (headed G2:
 *   R 0.74 → 0.74, MAD 0.82; probe-b: shift chỉ có tác dụng ở s≈1.0,
 *   vì ở upscale mỗi hàng đích đã nội suy 2 hàng nguồn với trọng số
 *   thay đổi đều nên lệch pha 0.5 hàng không đổi biên độ combing
 *   trung bình). Phương án CHỐT: vẽ drawSrc xuống canvas trung gian
 *   dw×(dh/2) (downscale dọc 2× — mỗi hàng đích đã là trung bình ~2
 *   hàng nguồn, tức khử xen kẽ — hạt nhân [1,1]/2 như tap) rồi vẽ
 *   canvas đó lên khổ đích (preview.tsx, deintHalfResSource). Vẫn 2
 *   lần vẽ nhưng lần 1 chỉ 1/4 pixel và lần 2 lấy mẫu từ canvas rẻ
 *   hơn video: probe-c ở s=1.13 cho R 0.85 → 0.66 (clean đối chứng
 *   0.63 — về băng progressive) với thông lượng 0.49× chi phí vẽ
 *   thường; ở s=1.0/1.5 R 0.43 (clean 0.45/0.44). Đánh đổi: mềm dọc
 *   hơn tap C8 (vgrad clean giữ 73% ở s=1.13, 37% ở s=1.0 — xem
 *   docs/PHASE9_ROUND76_D4_DEINT_FPS_LIMITS.md §3). Khi tap đi KÈM
 *   denoise/stabilize thì vẫn qua offscreen enhanceCanvas như cũ.
 *   plan.needsOffscreen = false + deinterlaceTap = true là tín hiệu
 *   cho preview.tsx biết phải qua half-res (xem drawVideoClip).
 *   Đợt 77 E1 — INTERMEDIATE THU HẸP DỌC 4× (dw×dh/4 thay dw×dh/2):
 *   FPS half-res headed vẫn 0.72–0.73× (FAIL ngưỡng 0.75×, D4). Probe
 *   E1 (probe-77e1-deint-fast.mjs) chứng minh inline 1 lần vẽ KHÔNG
 *   đạt: shift +0.5px R 0.85 → 0.88 ở s=1.13 (xác nhận probe-b D4);
 *   tap2 (2 lần vẽ từ video, lệch +1 hàng nguồn, alpha 0.5) R 0.58 ở
 *   1.13 nhưng FAIL tiêu chí 1:1 (0.67 > 0.55) và thông lượng 1.66–
 *   2.4×; ctx.filter blur(1px) R 0.52–0.53 nhưng thông lượng 2.3–61×
 *   và vgrad chỉ 20–41% — cả ba LOẠI. Ứng viên chốt: thu hẹp dọc 4×
 *   (lần 1 chỉ 1/2 pixel của half-res): probe R 0.58 ở s=1.13 / 0.54
 *   ở s=1.0 (≤ 0.55 ✓), hgrad giữ 91% như half-res, đổi lại vgrad
 *   38% (half-res 59%). Divisor phải CHẴN: mỗi hàng intermediate lấy
 *   mẫu đúng giữa 2 hàng nguồn kề (một hàng mỗi field) nên triệt tiêu
 *   xen kẽ; divisor lẻ (vd. 3) lấy mẫu đúng trên 1 hàng nguồn và
 *   combing sống lại. Probe cũng chứng minh smoothing "low"/"medium"/
 *   "high" cho pixel Y HỆT nhau ở downscale đúng 2× nên giữ "high".
 *   KẾT QUẢ HEADED (xem docs/PHASE9_ROUND77_E1_DEINT_FPS_LIMITS.md
 *   §3): divisor 4 KHÔNG chứng minh được nhanh hơn half-res — G5 lần
 *   1 0.83× PASS, lần 2 0.64× FAIL (gộp 10 tỉ lệ mean 0.735, không
 *   tách được khỏi half-res 0.72–0.73 của D4 / 0.78 baseline cùng ngày
 *   trong nhiễu tải; baseline chỉ 1.5–2.4 fps, mỗi slot 3s chỉ ~2–8
 *   lần vẽ), và G7b FAIL hệ thống cả 2 lần (mask MAD 0.6396 so với
 *   0.0036 của half-res — intermediate dh/4 phải upscale 2× trong mask
 *   unit 640×360 trong khi dh/2 khớp đúng 1:1). Vì không có lợi FPS đo
 *   được mà chất lượng tệ hơn (vgrad 38% vs 59%, G7b FAIL), E1
 *   QUAY VỀ divisor 2 (half-res D4) — hằng dưới giữ = 2. Tín hiệu plan
 *   không đổi (needsOffscreen=false + tap=true).
 *   CỔNG THEO TỈ LỆ VẼ THẬT: tap chỉ áp khi drawScaleY ≥ 0.9, với
 *   drawScaleY = (dh/mh) × S (dh = chiều cao vẽ theo tọa độ project,
 *   S = tỉ lệ viewport = min(Wc/W, Hc/H) của canvas preview thật —
 *   preview.tsx tính từ canvas thật, KHÔNG phải dh/mh thuần vì dh
 *   là tọa độ project). Sweep probe (chênh R inter−clean theo tỉ lệ):
 *   0.38→0.06, 0.50→0.12, 0.68→0.08, 0.75→0.12, 0.80→0.11, 0.85→0.15,
 *   0.90→0.17, 0.95→0.18, 1.00→0.43 — gap ≤0.18 tới 0.95 rồi nhảy
 *   lên 0.43 ở 1.0 nên tap chỉ bật ở ≥0.9 (nơi răng cưa thấy rõ);
 *   dưới ngưỡng, downscale đã giấu răng cưa nên không áp — và hành vi
 *   letterbox cũ giữ nguyên (Q1 B5 + 61R3 C6 vẫn xanh: clip 360p ở
 *   letterbox có tỉ lệ thật 0.76 < 0.9).
 *
 * QUY TẮC SHAPE (cứng): CHỈ đọc field đã tồn tại trong `ClipEnhance`
 * (packages/video-spec/src/enhance.ts) — deinterlace / stabilize /
 * denoise. KHÔNG thêm field mới vào spec. Toggle "xem trước enhance" là
 * cờ UI trong store (mặc định bật), KHÔNG nằm trong spec nên không ảnh
 * hưởng render/export.
 */
import {
  DENOISE_DEFAULT_STRENGTH,
  STABILIZE_DEFAULTS,
  type ClipEnhance,
} from "@repo-1/video-spec";
import {
  enhanceActiveFeatures,
  type EnhanceFeature,
} from "../components/enhance/presets";

/** Bán kính blur CỐ ĐỊNH (px) của bản mờ dùng trong phép blend denoise
 * (đợt 62 R3 — xem comment đầu file: blur 3.0px cho -84% ở a=1, khớp
 * hqdn3d s=1.0; alpha mới là biến điều khiển, không phải bán kính). */
export const ENHANCE_PREVIEW_BLUR_RADIUS_PX = 3.0;
/** Tỉ lệ vẽ dọc tối thiểu (tỉ lệ vẽ thật, xem comment đầu file) để áp
 * tap khử răng cưa (đợt 75 C8 — sweep probe-75c8-deint: gap R inter−clean
 * ≤0.18 tới 0.95 rồi nhảy lên 0.43 ở 1.0; dưới 0.9 downscale đã giấu
 * răng cưa). */
export const ENHANCE_PREVIEW_DEINT_MIN_SCALE_Y = 0.9;
/** Độ lệch dọc (px output) của tap khử răng cưa: +0.5px → bilinear
 * trung bình 2 dòng kề (đợt 75 C8 — probe-75c8-deint). */
export const ENHANCE_PREVIEW_DEINT_TAP_OFFSET_PX = 0.5;
/** Hệ số thu hẹp dọc của canvas trung gian deint-only (đợt 76 D4 = 2;
 * đợt 77 E1 đã THỬ 4 rồi QUAY VỀ 2 — xem comment đầu file + LIMITS E1
 * §3: divisor 4 không chứng minh được nhanh hơn (G5 0.83× rồi 0.64×,
 * gộp 0.735 ≈ half-res 0.72–0.73) mà làm mềm hơn (vgrad 38% vs 59%)
 * và làm FAIL G7b mask (MAD 0.6396 vs 0.0036). PHẢI CHẴN (xem comment
 * đầu file): mỗi hàng intermediate lấy mẫu đúng giữa 2 hàng nguồn kề,
 * một hàng mỗi field. */
export const ENHANCE_PREVIEW_DEINT_INTERMEDIATE_DIVISOR = 2;
/** Zoom tối đa (crop gợi ý) ở stabilize smoothing 100. */
export const ENHANCE_PREVIEW_ZOOM_MAX = 1.05;
/** Zoom tối thiểu (crop gợi ý) ở stabilize smoothing 1. */
export const ENHANCE_PREVIEW_ZOOM_MIN = 1.0203;

/** Clamp về [lo, hi]; NaN → lo (giá trị rác không được phá preview). */
function clampNum(v: number, lo: number, hi: number): number {
  if (typeof v !== "number" || Number.isNaN(v)) return lo;
  return Math.min(hi, Math.max(lo, v));
}

/**
 * Strength denoise đã chuẩn hóa (true → 0.5 mặc định render); null = không
 * có denoise / giá trị lỗi (false — render coi là lỗi, xem presets.ts).
 */
export function denoiseStrengthOf(enh: ClipEnhance | undefined): number | null {
  const d = enh?.denoise;
  if (d === undefined) return null;
  if (d === true) return DENOISE_DEFAULT_STRENGTH;
  if (typeof d === "object" && d !== null) return d.strength ?? DENOISE_DEFAULT_STRENGTH;
  return null;
}

/** Các mốc nội suy của đường cong blend (đợt 63 R3 — probe-blend-r63):
 * alpha cần để khớp đúng 4 mốc hqdn3d flat15 720p (B=3.0px), đo thật:
 * s=0.3 → a=0.195, s=0.5 → a=0.486, s=0.8 → a=0.806, s=1.0 → a=0.981
 * (nội suy tuyến tính giữa các mốc; ở khổ preview 488×275 cùng đường
 * cong cho sai tối đa 2.3 điểm — không phải overfit theo 1 fixture:
 * xem LIMITS đợt 63 §2.1). Đợt 62 dùng a = s (sai +9.9 ở s=0.3). */
const DENOISE_BLEND_ALPHA_KNOTS: Array<[number, number]> = [
  [0, 0],
  [0.3, 0.195],
  [0.5, 0.486],
  [0.8, 0.806],
  [1, 0.981],
];

/** Alpha blend cho denoise strength 0..1: composite = (1-a)·gốc +
 * a·blur(3.0px) (đợt 63 R3 — piecewise-linear qua 4 mốc khớp hqdn3d,
 * xem comment đầu file + DENOISE_BLEND_ALPHA_KNOTS; đợt 62 R3 dùng
 * a = strength tuyến tính, sai +9.9 ở đầu thấp). a đơn điệu tăng theo
 * strength, a>0 luôn đổi pixel thật (không vùng chết), a(0)=0, a(1)=0.981
 * (không bao giờ 1.0 — hqdn3d s=1.0 cũng chỉ -83%, không phải blur toàn
 * phần). Clamp ngoài [0,1] về biên; NaN → 0. */
export function denoiseBlendAlpha(strength: number): number {
  const s = clampNum(strength, 0, 1);
  if (s <= 0) return 0;
  for (let i = 1; i < DENOISE_BLEND_ALPHA_KNOTS.length; i++) {
    const [x0, y0] = DENOISE_BLEND_ALPHA_KNOTS[i - 1];
    const [x1, y1] = DENOISE_BLEND_ALPHA_KNOTS[i];
    if (s <= x1) return y0 + ((s - x0) / (x1 - x0)) * (y1 - y0);
  }
  return DENOISE_BLEND_ALPHA_KNOTS[DENOISE_BLEND_ALPHA_KNOTS.length - 1][1];
}

/**
 * Bán kính blur (px) của bản mờ trong phép blend: 3.0 khi denoise có
 * strength > 0, 0 khi không denoise (giữ ngữ nghĩa cũ của field
 * denoiseBlurPx trong plan/hook: 0 = không mờ). Đợt 61 R3 dùng hàm này
 * làm thang tuyến tính strength × 3.0px; đợt 62 R3 đổi ngữ nghĩa: bán
 * kính cố định, alpha mới mang strength (xem denoiseBlendAlpha).
 */
export function denoiseBlurPx(strength: number): number {
  return clampNum(strength, 0, 1) > 0 ? ENHANCE_PREVIEW_BLUR_RADIUS_PX : 0;
}

/**
 * Smoothing stabilize đã chuẩn hóa (mặc định 10); null = không stabilize.
 * Chỉ smoothing tham gia zoom gợi ý — shakiness/accuracy/stepsize/
 * mincontrast là option của pass vidstabdetect, preview không có pass đó.
 */
export function stabilizeSmoothingOf(enh: ClipEnhance | undefined): number | null {
  const s = enh?.stabilize;
  if (s === undefined) return null;
  return s.smoothing ?? STABILIZE_DEFAULTS.smoothing;
}

/**
 * Zoom crop gợi ý cho stabilize: 1 khi không stabilize, còn lại
 * 1.02 + smoothing/100 * 0.03 (smoothing 10 → 1.023, 100 → 1.05).
 * Smoothing clamp về [1,100] (khoảng render chấp nhận).
 */
export function stabilizeZoomOf(enh: ClipEnhance | undefined): number {
  const sm = stabilizeSmoothingOf(enh);
  if (sm === null) return 1;
  const clamped = clampNum(sm, 1, 100);
  return 1.02 + (clamped / 100) * 0.03;
}

/**
 * Clip có bật deinterlace không (đợt 75 C8 — true/false/object đều tính
 * là bật; render coi `false` là lỗi nên không xuất hiện ở trạng thái hợp lệ).
 */
export function deinterlaceOf(enh: ClipEnhance | undefined): boolean {
  return enh?.deinterlace !== undefined;
}

/** Kế hoạch áp enhance lên 1 frame preview (đã tính xong, preview.tsx chỉ việc vẽ theo). */
export interface EnhancePreviewPlan {
  /** Toggle UI "xem trước enhance" có bật không. */
  enabled: boolean;
  /** Clip có enhance nào đang bật không. */
  hasEnhance: boolean;
  /** Bán kính blur (px) của bản mờ trong phép blend denoise (3.0 khi
   * denoise có strength > 0, 0 = không mờ — đợt 62 R3: bán kính cố định,
   * alpha mới mang strength). */
  denoiseBlurPx: number;
  /** Alpha blend denoise (0..1 = denoiseBlendAlpha(strength), đợt 63 R3
   * piecewise qua 4 mốc khớp hqdn3d — KHÔNG còn bằng strength):
   * composite = (1-a)·gốc + a·blur(3.0px). 0 = không khử nhiễu. */
  denoiseBlendAlpha: number;
  /** Zoom crop gợi ý stabilize (1 = không zoom). */
  stabilizeZoom: number;
  /** true khi tap khử răng cưa được áp (đợt 75 C8 — deinterlace bật
   * và drawScaleY ≥ ENHANCE_PREVIEW_DEINT_MIN_SCALE_Y = 0.9; vẽ lệch dọc
   * +0.5px, không thêm lần vẽ). */
  deinterlaceTap: boolean;
  /** true khi stabilize bị chặn vì clip có speedKeyframes (đợt 62 R3 —
   * đồng bộ với render chặn hẳn + panel chặn preset ở UI). */
  stabilizeBlockedBySpeedRamp: boolean;
  /** true khi cần vẽ qua offscreen (blend alpha > 0 hoặc zoom != 1
   * — đợt 76 D4: tap đơn lẻ KHÔNG cần offscreen enhanceCanvas nữa,
   * preview.tsx đưa qua intermediate thu hẹp dọc dw×dh/2 (xem
   * deintIntermediateSource; đợt 77 E1 đã thử dw×dh/4 rồi quay về);
   * tap kèm alpha/zoom vẫn qua offscreen). */
  needsOffscreen: boolean;
  /** Tính năng enhance ĐÃ được xấp xỉ trong preview (denoise/stabilize,
   * và deinterlace khi tap được áp — đợt 75 C8). */
  applied: EnhanceFeature[];
  /** Tính năng enhance KHÔNG thể hiện trong preview (deinterlace khi
   * tap không áp — toggle tắt hoặc vẽ ở tỉ lệ nhỏ; toggle tắt thì tất cả). */
  notApproximated: EnhanceFeature[];
}

/**
 * Tính kế hoạch preview cho 1 clip.enhance + toggle UI.
 * - enabled=false → không áp gì (blur 0, alpha 0, zoom 1, tap false),
 *   mọi tính năng đang bật đều vào notApproximated (preview hiện khung gốc).
 * - enabled=true → denoise/stabilize vào applied; deinterlace vào
 *   applied CHỈ khi tap được áp (đợt 75 C8: deinterlace bật và
 *   drawScaleY ≥ ENHANCE_PREVIEW_DEINT_MIN_SCALE_Y = 0.9 — dưới ngưỡng
 *   này downscale đã giấu răng cưa nên không áp; mặc định drawScaleY=0
 *   để lời gọi cũ (không truyền tỉ lệ) giữ hành vi cũ: deinterlace ở
 *   notApproximated).
 * - hasSpeedKeyframes=true (đợt 62 R3) → stabilize bị chặn: zoom 1,
 *   stabilize vào notApproximated, cờ stabilizeBlockedBySpeedRamp = true
 *   (đồng bộ với render chặn hẳn + panel chặn preset ở UI — clip có cả
 *   hai chỉ còn qua đường tạo cũ/MCP/CLI/file project; denoise vẫn áp
 *   bình thường).
 * Thứ tự applied/notApproximated theo enhanceActiveFeatures
 * (deinterlace → stabilize → denoise).
 */
export function enhancePreviewPlan(
  enh: ClipEnhance | undefined,
  enabled: boolean,
  hasSpeedKeyframes = false,
  drawScaleY = 0,
): EnhancePreviewPlan {
  const active = enhanceActiveFeatures(enh);
  if (!enabled) {
    return {
      enabled: false,
      hasEnhance: active.length > 0,
      denoiseBlurPx: 0,
      denoiseBlendAlpha: 0,
      stabilizeZoom: 1,
      deinterlaceTap: false,
      stabilizeBlockedBySpeedRamp: false,
      needsOffscreen: false,
      applied: [],
      notApproximated: active,
    };
  }
  const strength = denoiseStrengthOf(enh) ?? 0;
  const blur = denoiseBlurPx(strength);
  const alpha = denoiseBlendAlpha(strength);
  const stabBlocked = hasSpeedKeyframes && stabilizeSmoothingOf(enh) !== null;
  const zoom = stabBlocked ? 1 : stabilizeZoomOf(enh);
  const deintTap =
    deinterlaceOf(enh) && clampNum(drawScaleY, 0, Number.POSITIVE_INFINITY) >= ENHANCE_PREVIEW_DEINT_MIN_SCALE_Y;
  const applied: EnhanceFeature[] = [];
  const notApproximated: EnhanceFeature[] = [];
  for (const f of active) {
    if (f === "deinterlace" && !deintTap) notApproximated.push(f);
    else if (f === "stabilize" && stabBlocked) notApproximated.push(f);
    else applied.push(f);
  }
  // Đợt 76 D4: tap đơn lẻ qua intermediate thu hẹp dọc ở preview.tsx
  // (deintIntermediateSource: downscale dọc ENHANCE_PREVIEW_DEINT_
  // INTERMEDIATE_DIVISOR lần rồi vẽ lên khổ đích — 2× từ D4, 4× từ
  // đợt 77 E1) nên không cần offscreen enhanceCanvas; chỉ blend alpha
  // hoặc zoom mới cần offscreen (tap đi kèm đã nằm trong lần vẽ gốc
  // của enhanceCanvas). needsOffscreen=false + deinterlaceTap=true là
  // tín hiệu cho preview.tsx biết phải qua intermediate (xem drawVideoClip).
  const needsOffscreen = alpha > 0 || zoom !== 1;
  return {
    enabled: true,
    hasEnhance: active.length > 0,
    denoiseBlurPx: blur,
    denoiseBlendAlpha: alpha,
    stabilizeZoom: zoom,
    deinterlaceTap: deintTap,
    stabilizeBlockedBySpeedRamp: stabBlocked,
    needsOffscreen,
    applied,
    notApproximated,
  };
}

/**
 * Trạng thái enhance của frame vừa vẽ — preview.tsx ghi lên
 * `window.__vcutPreviewEnhance` (hook đo cho harness/click-test, cùng mẫu
 * `window.__vcutHoldStats`). Chỉ phục vụ đo, không phải state React.
 */
export interface EnhancePreviewDebug {
  clipId: string;
  hasEnhance: boolean;
  enabled: boolean;
  denoiseBlurPx: number;
  /** Alpha blend denoise (0..1) của frame vừa vẽ (đợt 62 R3). */
  denoiseBlendAlpha: number;
  stabilizeZoom: number;
  /** true khi tap khử răng cưa được áp ở frame vừa vẽ (đợt 75 C8). */
  deinterlaceTap: boolean;
  /** true khi stabilize bị chặn vì clip có speedKeyframes (đợt 62 R3). */
  stabilizeBlockedBySpeedRamp: boolean;
  applied: EnhanceFeature[];
  notApproximated: EnhanceFeature[];
  /** true khi frame vừa vẽ đã qua offscreen enhance (blur/zoom/tap đã áp). */
  offscreenApplied: boolean;
}

/** Dựng object hook đo từ plan + clipId + kết quả vẽ offscreen thật. */
export function enhancePreviewDebug(
  clipId: string,
  plan: EnhancePreviewPlan,
  offscreenApplied: boolean,
): EnhancePreviewDebug {
  return {
    clipId,
    hasEnhance: plan.hasEnhance,
    enabled: plan.enabled,
    denoiseBlurPx: plan.denoiseBlurPx,
    denoiseBlendAlpha: plan.denoiseBlendAlpha,
    stabilizeZoom: plan.stabilizeZoom,
    deinterlaceTap: plan.deinterlaceTap,
    stabilizeBlockedBySpeedRamp: plan.stabilizeBlockedBySpeedRamp,
    applied: [...plan.applied],
    notApproximated: [...plan.notApproximated],
    offscreenApplied,
  };
}
