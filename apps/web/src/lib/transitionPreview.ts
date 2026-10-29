/**
 * transitionPreview.ts — Mô tả hình học thuần (không DOM, không canvas) của
 * transition xfade tại tiến độ p, để preview canvas vẽ đúng hướng/hình dạng
 * của transition thay vì chỉ fade alpha như trước (xem PREVIEW_LIMITS.md §7).
 *
 * Nguồn gốc hình học: catalog render `server/render/src/transitions.js`
 * (81 type: 58 xfade built-in + 23 custom-expr) + đo thật bằng FFmpeg 8.1.2 trên
 * nguồn màu phẳng/gradient (xem TRANSITION_PREVIEW_LIMITS.md — loại nào
 * đo thật, loại nào xấp xỉ, loại nào fallback fade).
 *
 * MÔ HÌNH QUAN TRỌNG — preview vẽ từng clip riêng lẻ, KHÔNG chồng cặp A/B:
 * timeline preview đặt clip kề nhau (B.start = A.start + A.duration), còn
 * render gộp cặp bằng xfade (B chồng lên T giây cuối của A). Vì vậy mô tả
 * ở đây cho ra cả 2 lớp A (clip cũ) và B (clip mới) của cặp, nhưng khi vẽ
 * 1 clip, preview chỉ dùng lớp của clip đó:
 *   - clip đang transitionIn (mới vào) → dùng lớp B, p = localT / duration
 *   - clip đang transitionOut (sắp ra) → dùng lớp A, p = thời gian đã trôi
 *     trong cửa sổ transitionOut / duration
 * Phần khung còn lại (lớp kia) sẽ là nền đen của canvas — khác render ở chỗ
 * render thấy cả 2 clip cùng lúc. Đây là xấp xỉ có chủ ý, đã ghi trong
 * TRANSITION_PREVIEW_LIMITS.md §1, không claim là crossfade thật.
 *
 * Tất cả hàm đều thuần, test được bằng Node không cần DOM (xem
 * transitionPreview.test.ts). Không import gì từ DOM/store.
 * Chú ý (đợt 14 R2): dissolve KHÔNG import dissolveFrand.ts vào đây
 * để giữ module này không có import tương đối (chạy trực tiếp bằng
 * Node type-stripping; import không đuôi .ts vỡ ở đó, import đuôi
 * .ts vỡ tsc bundler) — vùng dissolve-noise chỉ mang p, còn hàm
 * frand nằm ở dissolveFrand.ts và do preview.tsx / harness gọi.
 */

/** Vùng hiển thị của 1 lớp, trong toạ độ khung hình (0..W, 0..H). */
export type ClipRegion =
  | { kind: "rect"; x: number; y: number; w: number; h: number }
  | { kind: "rects"; rects: Array<{ x: number; y: number; w: number; h: number }> }
  | { kind: "circle"; cx: number; cy: number; r: number }
  /** Toàn khung TRỪ hình tròn (vẽ bằng evenodd: rect khung + arc). */
  | { kind: "circle-inverted"; cx: number; cy: number; r: number }
  | { kind: "polygon"; points: Array<readonly [number, number]> }
  /** Toàn khung TRỪ đa giác (vẽ bằng evenodd: rect khung + polygon). */
  | { kind: "polygon-inverted"; points: Array<readonly [number, number]> }
  /**
   * Gradient alpha xuyên tâm (circleopen/circleclose, đo thật đợt 13
   * + hiệu chuẩn lại đợt 14 R4): alpha tại bán kính chuẩn hoá
   * rho = r/rMax tuân theo đường smoothstep w(rho) = 1-S(clamp(
   * rho-mid+0.5, 0, 1)), S(t)=3t²-2t³ (xem radialGradientWeight);
   * inverted=true thì alpha = 1-w(rho). Tâm và rMax lấy theo
   * phép cắt nguyên của FFmpeg: cx=floor(W/2), cy=floor(H/2),
   * rMax=hypot(cx,cy) — khác tâm (W/2,H/2) khi W hoặc H lẻ
   * (đo thật đợt 14: 72×45 và 73×45 chỉ khớp với tâm cắt nguyên).
   * Canvas vẽ bằng mask alpha (radial gradient), harness raster hoá
   * theo từng pixel — KHÔNG phải vùng biên cứng. mid có thể ngoài
   * [0,1] (dải chưa tới / đã qua khỏi khung).
   */
  | {
      kind: "radial-gradient";
      cx: number;
      cy: number;
      rMax: number;
      mid: number;
      inverted: boolean;
    }
  /**
   * Viền mềm tuyến tính xuyên tâm (circle-soft, đo thật đợt 14 R1 +
   * nối preview đợt 15 T6): trọng số B tại bán kính chuẩn hoá
   * rho = r/rMax là radialSoftWeight(center, width, rho) =
   * clamp((center+width-rho)/width, 0, 1) — B thuần trong đĩa
   * rho <= center, A thuần ngoài rho >= center+width, tuyến tính
   * ở giữa. inverted=true thì alpha = 1-w (lớp A). cx,cy là tâm
   * expr (W/2, H/2) DỊCH +0,5 sang không gian tâm điểm (canvas/
   * harness lấy mẫu tại tâm pixel — xem case circle-soft);
   * rMax = hypot(W/2, H/2) theo expr. KHÁC tâm cắt nguyên của
   * circleopen/circleclose built-in, vì expr custom viết theo W/2.
   * Canvas vẽ bằng mask alpha như radial-gradient (preview.tsx),
   * harness raster hoá theo từng pixel qua radialSoftWeight tại
   * tâm pixel.
   */
  | {
      kind: "radial-soft";
      cx: number;
      cy: number;
      rMax: number;
      center: number;
      width: number;
      inverted: boolean;
    }
  /**
   * Nhiễu ngưỡng dissolve từng pixel (đợt 14 R2, đo thật từ
   * vf_xfade.c): KHÔNG phải danh sách rect — preview.tsx phải vẽ
   * bằng mask ImageData qua ffmpegDissolveFrand (xem
   * drawVideoClipWithDissolveMask), vì 1 khung 1080p sẽ cần tới
   * ~2M rect. applyTransitionLayer không vẽ được kind này (nó chỉ
   * clip theo path); mọi đường vẽ dissolve phải đi qua mask path.
   * p = tiến độ trong cửa sổ (0..1). Vùng này mô tả "pixel mà LỚP
   * NÀY hiện": invert=false → lớp hiện khi
   * ffmpegDissolveFrand(x, y) < p (lớp B); invert=true → lớp hiện
   * khi frand >= p (lớp A). Hai lớp A/B của dissolve có cùng p
   * nhưng invert ngược nhau — không được dùng chung 1 region cho
   * cả 2 lớp (harness composite sẽ vẽ sai).
   */
  | { kind: "dissolve-noise"; p: number; invert: boolean }
  /**
   * Dải dọc + nền crossfade của bars-fade (đợt 15 T2, đo thật từ
   * expr render `if(lt(mod(X,W/8),P*W/8),B,A*(1-P)+B*P)`):
   * KHÔNG biểu diễn được bằng rects thuần với 1 alpha/lớp — nền
   * không phải A thuần mà là crossfade A*(1-p)+B*p, trong khi dải
   * vẫn là B thuần. Vì vậy cả 2 lớp A và B mang cùng 1 kind này
   * (không có invert như dissolve-noise: blend là thuộc tính của
   * CẶP, không của riêng 1 lớp).
   * Quy tắc composite (rasterizer phải tuân theo, theo từng pixel
   * với X là CHỈ SỐ pixel nguyên, mod float như FFmpeg):
   *   bar  (barsFadePixelIsBar(X, bandW, p) đúng) → B thuần
   *   nền  (còn lại) → A*(1-p) + B*p
   * Rasterizer lấy mẫu tại tâm pixel (x+0.5) sẽ lệch 1 cột/dải ở
   * biên (cùng họ lệch nguyên-vs-tâm của blinds-h/bars-v) — phải
   * đánh giá tại chỉ số nguyên X mới khớp FFmpeg (probe đợt 15:
   * W=73, bandW=9.125, p=0.5: X=5 cho nền 127,0,127, X=10 là B).
   * Canvas đơn clip (preview.tsx) không vẽ được crossfade vì chỉ
   * có 1 clip tại 1 thời điểm — nhánh bars-fade ở đó vẽ dải cho
   * lớp B / nền cho lớp A bằng rects (hành vi cũ, giữ nguyên),
   * còn composite đúng chỉ có ở harness/rasterizer hiểu kind này.
   */
  | { kind: "bars-fade"; p: number; bandW: number };

/** Cách vẽ 1 lớp (clip A hoặc B) tại tiến độ p. */
export interface TransitionLayerSpec {
  /** null = toàn khung (không cắt). */
  region: ClipRegion | null;
  /** Offset trượt của nội dung (px, + = sang phải/xuống dưới). */
  dx: number;
  dy: number;
  /** Hệ số scale quanh tâm khung (1 = không đổi). */
  scaleX: number;
  scaleY: number;
  /** Alpha của lớp (0..1). */
  alpha: number;
}

/** Mô tả đầy đủ 1 cặp transition tại tiến độ p. */
export interface TransitionVisual {
  type: string;
  /** Tiến độ đã clamp về 0..1. */
  p: number;
  /**
   * true = có hình học riêng (cắt/trượt/scale) cần preview áp dụng;
   * false = chỉ alpha (fade hoặc fallback) — preview giữ đường alpha cũ.
   */
  geometric: boolean;
  /** Ghi chú ngắn cho debug/LIMITS (tiếng Việt, không chứa dữ liệu nhạy cảm). */
  note: string;
  /** Lớp clip cũ (A). */
  a: TransitionLayerSpec;
  /** Lớp clip mới (B). */
  b: TransitionLayerSpec;
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function layer(
  region: ClipRegion | null,
  alpha = 1,
  dx = 0,
  dy = 0,
  scaleX = 1,
  scaleY = 1,
): TransitionLayerSpec {
  return { region, alpha, dx, dy, scaleX, scaleY };
}

function full(alpha = 1): TransitionLayerSpec {
  return layer(null, alpha);
}

/**
 * Trọng số blend smoothstep của circleopen/circleclose tại bán kính
 * chuẩn hoá rho (0 = tâm, 1 = góc khung), theo bán kính giữa dải mid
 * (= 3P-1 cho circleopen, = 3(1-P)-1 cho circleclose — đo thật
 * FFmpeg 8.1.2, đợt 13 + hiệu chuẩn đợt 14 R4):
 *   w(rho) = 1 - S(clamp(rho-mid+0.5, 0, 1)), S(t) = 3t²-2t³.
 * Đợt 13 dùng cosin (1+cos(pi*g))/2 — sai số dư có hệ thống ~0.01
 * trọng số tại p=0.5 (MAD 1.12–1.56). Đo lại đợt 14 R4 trên từng
 * frame transition (320×180, 72×45, 73×45, 1280×720): smoothstep
 * khớp tới sàn lượng tử hoá (rmse trọng số ≤ 0.0012 khi đo trực
 * tiếp w; MAD composite theo thang harness tối đa 0.33 do FFmpeg
 * truncate kênh — cosin lệch tới 0.0103 trọng số); smootherstep và
 * cosin dãn dải đều thua xa (rmse 0.038 / 0.0016). Tại P=0.5
 * (mid=0.5) công thức rút gọn thành 1-(3rho²-2rho³), khớp probe
 * từng bin ±0.002.
 * mid ngoài [0,1] cho dải chưa tới (w_max < 0.5 ở tâm) hoặc đã qua
 * (w_min > 0.5 ở góc) — đúng hành vi hoàn thành sớm (B thuần từ
 * P≈0.8) và bắt đầu muộn (blend từ P≈0.3).
 * Quy ước bán kính: FFmpeg đánh giá tại chỉ số pixel nguyên (x, y)
 * so với tâm CẮT NGUYÊN (floor(W/2), floor(H/2)) và rMax =
 * hypot(cx, cy) — đo thật đợt 14: tại 72×45 và 73×45 (W/H lẻ),
 * tâm (W/2, H/2) cho rmse 0.010–0.018, tâm cắt nguyên cho 0.0012;
 * tại kích thước chẵn hai quy ước trùng nhau. Canvas vẽ mask
 * gradient liên tục nên lệch < 0.5px ở biên, không đáng kể với mắt.
 */
export function radialGradientWeight(mid: number, rho: number): number {
  const g = rho - mid + 0.5;
  const gc = g < 0 ? 0 : g > 1 ? 1 : g;
  return 1 - (3 * gc * gc - 2 * gc * gc * gc);
}

/**
 * Trọng số B của circle-soft tại bán kính chuẩn hoá rho (đo thật
 * đợt 14 R1 §3.4, soft-aware MAD 0,18–0,21): w = 1 - clip(
 * (rho-center)/width, 0, 1 ) = clamp((center+width-rho)/width, 0, 1).
 * center = p (đĩa B thuần), width = 0,15 (viền mềm theo expr render:
 * clip((r-p*R)/(0,15R), 0, 1)). width <= 0 → bậc thang tại center.
 */
export function radialSoftWeight(center: number, width: number, rho: number): number {
  if (!(width > 0)) return rho <= center ? 1 : 0;
  const w = (center + width - rho) / width;
  return w < 0 ? 0 : w > 1 ? 1 : w;
}

function rect(x: number, y: number, w: number, h: number): ClipRegion {
  return { kind: "rect", x, y, w: Math.max(0, w), h: Math.max(0, h) };
}

function rects(
  list: Array<{ x: number; y: number; w: number; h: number }>,
): ClipRegion {
  return {
    kind: "rects",
    rects: list.map((r) => ({ ...r, w: Math.max(0, r.w), h: Math.max(0, r.h) })),
  };
}

/** Cắt đa giác bởi nửa mặt phẳng a*x + b*y <= c (Sutherland–Hodgman). */
function clipHalfPlane(
  pts: Array<readonly [number, number]>,
  a: number,
  b: number,
  c: number,
): Array<readonly [number, number]> {
  if (pts.length === 0) return [];
  const out: Array<readonly [number, number]> = [];
  const inside = (p: readonly [number, number]): boolean =>
    a * p[0] + b * p[1] <= c + 1e-9;
  for (let i = 0; i < pts.length; i++) {
    const cur = pts[i];
    const prev = pts[(i + pts.length - 1) % pts.length];
    const curIn = inside(cur);
    const prevIn = inside(prev);
    if (curIn) {
      if (!prevIn) {
        const t =
          (c - a * prev[0] - b * prev[1]) /
          (a * (cur[0] - prev[0]) + b * (cur[1] - prev[1]));
        out.push([prev[0] + t * (cur[0] - prev[0]), prev[1] + t * (cur[1] - prev[1])]);
      }
      out.push(cur);
    } else if (prevIn) {
      const t =
        (c - a * prev[0] - b * prev[1]) /
        (a * (cur[0] - prev[0]) + b * (cur[1] - prev[1]));
      out.push([prev[0] + t * (cur[0] - prev[0]), prev[1] + t * (cur[1] - prev[1])]);
    }
  }
  return out;
}

/** Cắt đa giác về trong khung hình (giao với 4 nửa mặt phẳng của rect). */
function clipToFrame(
  pts: Array<readonly [number, number]>,
  w: number,
  h: number,
): Array<readonly [number, number]> {
  let out = pts;
  out = clipHalfPlane(out, -1, 0, 0); // x >= 0
  out = clipHalfPlane(out, 1, 0, w); // x <= w
  out = clipHalfPlane(out, 0, -1, 0); // y >= 0
  out = clipHalfPlane(out, 0, 1, h); // y <= h
  return out;
}

/** Đa giác nửa mặt phẳng a*x + b*y <= c cắt với khung hình. */
function halfPlanePolygon(
  w: number,
  h: number,
  a: number,
  b: number,
  c: number,
): ClipRegion {
  const frame: Array<readonly [number, number]> = [
    [0, 0],
    [w, 0],
    [w, h],
    [0, h],
  ];
  const pts = clipHalfPlane(frame, a, b, c);
  if (pts.length === 0) return rect(0, 0, 0, 0);
  return { kind: "polygon", points: pts };
}

/**
 * Hash giả ngẫu nhiên xác định cho ô (i, j) — dùng cho dissolve/pixelize.
 * Cùng ô luôn cho cùng giá trị nên pattern ổn định theo frame (không nhấp
 * nháy); giá trị trải đều 0..1 nên số ô hiện tăng đơn điệu theo p.
 */
export function dissolveHash(i: number, j: number): number {
  const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * Pixel cột X (CHỈ SỐ nguyên, không phải tâm pixel) có thuộc dải B
 * của bars-fade không: `mod(X, bandW) < p*bandW`, đúng expr render
 * (bandW = W/8, có thể phân số — mod float như FFmpeg, probe đợt 15
 * tại W=73: bandW=9.125, p=0.5 cho X=10 là B, X=5 là nền).
 * Dùng sai x+0.5 ở đây sẽ lệch 1 cột/dải (xem comment kind).
 */
export function barsFadePixelIsBar(x: number, bandW: number, p: number): boolean {
  if (!(bandW > 0) || !(p > 0)) return false;
  const m = ((x % bandW) + bandW) % bandW;
  return m < p * bandW;
}

/**
 * Mô tả transition tại tiến độ p (0..1) cho khung W×H.
 * Không bao giờ throw với type lạ, p NaN, hay khung suy biến — type lạ
 * fallback về fade (xem TRANSITION_PREVIEW_LIMITS.md §4).
 */
export function describeTransition(
  type: string,
  pRaw: number,
  frameW: number,
  frameH: number,
): TransitionVisual {
  const p = clamp01(pRaw);
  const W = frameW > 0 && Number.isFinite(frameW) ? frameW : 0;
  const H = frameH > 0 && Number.isFinite(frameH) ? frameH : 0;
  const cx = W / 2;
  const cy = H / 2;
  const rMax = Math.hypot(W / 2, H / 2);
  const base: Omit<TransitionVisual, "a" | "b" | "geometric" | "note"> = {
    type,
    p,
  };

  // Khung suy biến hoặc type "none": không có gì để vẽ ngoài alpha 1.
  if (W <= 0 || H <= 0 || type === "none") {
    return {
      ...base,
      geometric: false,
      note: type === "none" ? "không có transition" : "khung suy biến",
      a: full(1),
      b: full(1),
    };
  }

  const fade = (
    bAlpha: number,
    note: string,
  ): TransitionVisual => ({
    ...base,
    geometric: false,
    note,
    a: full(1 - bAlpha),
    b: full(bAlpha),
  });

  switch (type) {
    // ---- Fade family: chỉ alpha (giữ đúng hành vi fade cũ của preview) ----
    case "fade":
      return fade(p, "crossfade tuyến tính");
    case "fadeblack":
    case "fadewhite":
    case "fadegrays":
      // Mô hình tuần tự của preview không vẽ được màu trung gian (đen/
      // trắng/xám) vì clip kia chưa/không còn active — alpha tuyến tính là
      // xấp xỉ gần nhất, xem LIMITS §3.
      return fade(p, `${type}: alpha tuyến tính, bỏ qua màu trung gian`);
    case "fadefast":
      return fade(1 - (1 - p) * (1 - p), "fadefast: alpha tăng nhanh đầu (xấp xỉ)");
    case "fadeslow":
      return fade(p * p, "fadeslow: alpha tăng chậm (xấp xỉ)");

    // ---- Wipe rect (đo thật: biên cứng, B chiếm đúng phần khung) ----
    case "wipeleft": {
      // Đo thật đợt 13 C6 (1920x1080, p = 0.25/0.5/0.75): cột ngưỡng
      // X = W*(1-p) thuộc về A, B bắt đầu từ cột ngưỡng+1 — biên
      // strict-gt của FFmpeg built-in wipeleft (render B% = preview −
      // đúng 1 cột ở mọi p; lệch>8 đúng 1080 pixel trên đúng 1 cột).
      // Trong không gian tâm điểm, cột ngưỡng ti = floor(W*(1-p))
      // thuộc A ⇔ A rộng ti+1.5, B bắt đầu ti+1.5. Với ngưỡng không
      // nguyên, floor vẫn cho đúng phân hoạch cũ (tâm pixel là nửa
      // nguyên nên dịch biên trong (ti+0.5, ti+1.5) không đổi tập
      // pixel) — chỉ trường hợp ngưỡng nguyên mới đổi, đúng 1 cột.
      // (Chỉ wipeleft được đo/sửa ở đây; wiperight/wipeup/wipedown
      // chưa đo biên nên giữ nguyên, không suy diễn đối xứng.)
      const ti = Math.floor(W * (1 - p));
      return {
        ...base,
        geometric: true,
        note: "B quét từ phải sang (cột ngưỡng thuộc A, đo thật)",
        a: layer(rect(0, 0, ti + 1.5, H)),
        b: layer(rect(ti + 1.5, 0, W - ti - 1.5, H)),
      };
    }
    case "wiperight":
      return {
        ...base,
        geometric: true,
        note: "B quét từ trái sang",
        a: layer(rect(W * p, 0, W * (1 - p), H)),
        b: layer(rect(0, 0, W * p, H)),
      };
    case "wipeup":
      return {
        ...base,
        geometric: true,
        note: "B quét từ dưới lên",
        a: layer(rect(0, 0, W, H * (1 - p))),
        b: layer(rect(0, H * (1 - p), W, H * p)),
      };
    case "wipedown":
      return {
        ...base,
        geometric: true,
        note: "B quét từ trên xuống",
        a: layer(rect(0, H * p, W, H * (1 - p))),
        b: layer(rect(0, 0, W, H * p)),
      };

    // ---- Mở/khép dọc-ngang (đo thật: vert = dải dọc, horz = dải ngang) ----
    case "vertopen": {
      // Đo thật: B = dải dọc giữa, rộng p*W (mở dọc).
      const bandW = p * W;
      const x0 = (W - bandW) / 2;
      return {
        ...base,
        geometric: true,
        note: "B mở ra từ dải dọc giữa",
        a: layer(
          rects([
            { x: 0, y: 0, w: x0, h: H },
            { x: x0 + bandW, y: 0, w: x0, h: H },
          ]),
        ),
        b: layer(rect(x0, 0, bandW, H)),
      };
    }
    case "horzopen": {
      const bandH = p * H;
      const y0 = (H - bandH) / 2;
      return {
        ...base,
        geometric: true,
        note: "B mở ra từ dải ngang giữa",
        a: layer(
          rects([
            { x: 0, y: 0, w: W, h: y0 },
            { x: 0, y: y0 + bandH, w: W, h: y0 },
          ]),
        ),
        b: layer(rect(0, y0, W, bandH)),
      };
    }
    case "vertclose": {
      // Đo thật: A = dải dọc giữa co dần, rộng (1-p)*W; B = 2 bên.
      const bandW = (1 - p) * W;
      const x0 = (W - bandW) / 2;
      return {
        ...base,
        geometric: true,
        note: "A khép thành dải dọc giữa, B lộ 2 bên",
        a: layer(rect(x0, 0, bandW, H)),
        b: layer(
          rects([
            { x: 0, y: 0, w: x0, h: H },
            { x: x0 + bandW, y: 0, w: x0, h: H },
          ]),
        ),
      };
    }
    case "horzclose": {
      const bandH = (1 - p) * H;
      const y0 = (H - bandH) / 2;
      return {
        ...base,
        geometric: true,
        note: "A khép thành dải ngang giữa, B lộ trên-dưới",
        a: layer(rect(0, y0, W, bandH)),
        b: layer(
          rects([
            { x: 0, y: 0, w: W, h: y0 },
            { x: 0, y: y0 + bandH, w: W, h: y0 },
          ]),
        ),
      };
    }

    // ---- Quét chéo (FFmpeg thật là blend gradient chéo — xem LIMITS §3;
    // preview dùng biên cứng nửa mặt phẳng, cùng hướng và cùng tỉ lệ) ----
    case "diagtl":
    case "wipetl":
      return diagPair(base, W, H, 1 / W, 1 / H, 2 * p, `${type}: B từ góc trái-trên`);
    case "diagtr":
    case "wipetr":
      return diagPair(base, W, H, -1 / W, 1 / H, 2 * p - 1, `${type}: B từ góc phải-trên`);
    case "diagbl":
    case "wipebl":
      return diagPair(base, W, H, 1 / W, -1 / H, 2 * p - 1, `${type}: B từ góc trái-dưới`);
    case "diagbr":
    case "wipebr":
      return diagPair(base, W, H, -1 / W, -1 / H, 2 * p - 2, `${type}: B từ góc phải-dưới`);

    // ---- Slide: cả 2 cùng trượt (đo thật: chia nửa khung ở p=0.5) ----
    case "slideleft":
    case "smoothleft":
      return slidePair(base, -p * W, 0, (1 - p) * W, 0, type);
    case "slideright":
    case "smoothright":
      return slidePair(base, p * W, 0, -(1 - p) * W, 0, type);
    case "slideup":
    case "smoothup":
      return slidePair(base, 0, -p * H, 0, (1 - p) * H, type);
    case "slidedown":
    case "smoothdown":
      return slidePair(base, 0, p * H, 0, -(1 - p) * H, type);

    // ---- Cover: chỉ B trượt vào trên nền A tĩnh ----
    case "coverleft":
      return coverPair(base, (1 - p) * W, 0);
    case "coverright":
      return coverPair(base, -(1 - p) * W, 0);
    case "coverup":
      return coverPair(base, 0, (1 - p) * H);
    case "coverdown":
      return coverPair(base, 0, -(1 - p) * H);

    // ---- Reveal: chỉ A trượt ra, B tĩnh bên dưới ----
    // (Đo thật màu phẳng loại trừ "A trượt sang phải" cho revealleft:
    // ở p=0.5, A vẫn ở nửa trái, B ở nửa phải.)
    case "revealleft":
      return revealPair(base, -p * W, 0);
    case "revealright":
      return revealPair(base, p * W, 0);
    case "revealup":
      return revealPair(base, 0, -p * H);
    case "revealdown":
      return revealPair(base, 0, p * H);

    // ---- Gió: B thổi vào từ 1 hướng, kèm dịch chuyển theo hàng (không
    // mô hình hoá) — hình học lấy theo cover cùng hướng. ----
    case "hlwind":
      return coverPair(base, -(1 - p) * W, 0, "hlwind: B thổi từ trái (xấp xỉ cover)");
    case "hrwind":
      return coverPair(base, (1 - p) * W, 0, "hrwind: B thổi từ phải (xấp xỉ cover)");
    case "vuwind":
      return coverPair(base, 0, (1 - p) * H, "vuwind: B thổi từ dưới (xấp xỉ cover)");
    case "vdwind":
      return coverPair(base, 0, -(1 - p) * H, "vdwind: B thổi từ trên (xấp xỉ cover)");

    // ---- Vòng tròn / chữ nhật (đo thật, xem LIMITS §2) ----
    case "circleopen": {
      // Đo thật FFmpeg 8.1.2 (đợt 12 T2 + đợt 13 + hiệu chuẩn đợt 14
      // R4): built-in circleopen là gradient smoothstep xuyên tâm,
      // KHÔNG phải cosin như đợt 13 tưởng và KHÔNG phải vòng tròn
      // biên cứng như đợt 12: w(rho) = 1-S(clamp(rho-mid+0.5)),
      // S(t)=3t²-2t³, mid = 3P-1 (w=0.5 tại rho=mid; B thuần từ
      // P≈0.8, blend từ P≈0.3). Tâm/rMax của vùng lấy theo phép
      // cắt nguyên của FFmpeg (floor(W/2), floor(H/2)) — xem
      // radialGradientWeight. Lớp A = 1-w (inverted), lớp B = w.
      const mid = 3 * p - 1;
      const ccx = Math.floor(W / 2);
      const ccy = Math.floor(H / 2);
      const crMax = Math.hypot(ccx, ccy);
      return {
        ...base,
        geometric: true,
        note: "circleopen: gradient smoothstep xuyên tâm, giữa dải tại rho=3p-1, tâm cắt nguyên (đo thật đợt 14, xem radialGradientWeight)",
        a: layer({ kind: "radial-gradient", cx: ccx, cy: ccy, rMax: crMax, mid, inverted: true }),
        b: layer({ kind: "radial-gradient", cx: ccx, cy: ccy, rMax: crMax, mid, inverted: false }),
      };
    }
    case "circleclose": {
      // Đo thật FFmpeg 8.1.2 (đợt 13 + hiệu chuẩn đợt 14 R4):
      // circleclose là ảnh gương thời gian của circleopen —
      // w_close(rho, P) = 1 - w_open(rho, 1-P), tức cùng đường
      // smoothstep với mid' = 3(1-P)-1 = 2-3P, tâm/rMax cắt nguyên
      // như circleopen. Kiểm chứng đợt 14: gương đúng tới sàn
      // lượng tử hoá (rmse 0.00000 giữa frame close(k) và
      // 1-open(90-k) tại 320×180); P=0.5: w_close = 1-w_open đúng
      // từng bin; P=0.25: B chỉ ló ở góc (w≈0.03 ở rho≈0.84,
      // tâm w=0); P=0.75: tâm A còn 0.85 (1-w_open(0, 0.25)=0.85).
      // Mô hình cũ (vòng tròn biên cứng (1-p)*rMax) sai cùng kiểu
      // như circleopen cũ nên bỏ.
      const mid = 2 - 3 * p;
      const ccx = Math.floor(W / 2);
      const ccy = Math.floor(H / 2);
      const crMax = Math.hypot(ccx, ccy);
      return {
        ...base,
        geometric: true,
        note: "circleclose: gradient smoothstep xuyên tâm, ảnh gương thời gian của circleopen (mid=2-3p, tâm cắt nguyên)",
        a: layer({ kind: "radial-gradient", cx: ccx, cy: ccy, rMax: crMax, mid, inverted: false }),
        b: layer({ kind: "radial-gradient", cx: ccx, cy: ccy, rMax: crMax, mid, inverted: true }),
      };
    }
    case "circlecrop": {
      // Đo thật (khớp TRANSITIONS2_LIMITS.md §2): nửa đầu A co thành
      // vòng tròn rồi biến mất (đen ở giữa), nửa sau B nở ra từ vòng
      // tròn. Bán kính vòng tròn của B tăng đơn điệu theo p (0 ở nửa
      // đầu, rồi nở dần tới rMax).
      const ra = Math.max(0, 1 - 2 * p) * rMax;
      const rb = Math.max(0, 2 * p - 1) * rMax;
      return {
        ...base,
        geometric: true,
        note: "A co thành vòng tròn rồi đen, B nở ra từ vòng tròn",
        a: layer({ kind: "circle", cx, cy, r: ra }),
        b: layer({ kind: "circle", cx, cy, r: rb }),
      };
    }
    case "rectcrop": {
      const sa = Math.max(0, 1 - 2 * p);
      const sb = Math.max(0, 2 * p - 1);
      return {
        ...base,
        geometric: true,
        note: "A co thành chữ nhật rồi đen, B nở ra từ chữ nhật",
        a: layer(
          rect(cx - (sa * W) / 2, cy - (sa * H) / 2, sa * W, sa * H),
        ),
        b: layer(
          rect(cx - (sb * W) / 2, cy - (sb * H) / 2, sb * W, sb * H),
        ),
      };
    }

    // ---- Zoom / ép hình (đo thật, xem LIMITS §3) ----
    case "zoomin":
      // Đo thật: không có vùng không gian — toàn khung blend, muộn
      // (p=0.25 vẫn toàn A, p=0.75 đã blend). Dùng fade ease-in, bỏ qua zoom.
      return fade(p * p, "zoomin: blend muộn toàn khung (xấp xỉ, bỏ qua zoom)");
    case "distance":
      // Đo thật: B đã phủ toàn khung từ p=0.25. Dùng fade nhanh 4p.
      return fade(Math.min(1, 4 * p), "distance: B hiện rất nhanh (xấp xỉ)");
    case "squeezeh":
      // Đo thật (ngược trực giác với tên gọi): A = dải ngang giữa co
      // theo chiều cao, B lộ trên-dưới. Tức A scaleY = 1-p.
      return {
        ...base,
        geometric: true,
        note: "A ép dọc thành dải ngang giữa (đo thật, xem LIMITS §3)",
        a: layer(null, 1, 0, 0, 1, 1 - p),
        b: full(1),
      };
    case "squeezev":
      // Đo thật: A = dải dọc giữa co theo chiều rộng, B lộ 2 bên.
      return {
        ...base,
        geometric: true,
        note: "A ép ngang thành dải dọc giữa (đo thật, xem LIMITS §3)",
        a: layer(null, 1, 0, 0, 1 - p, 1),
        b: full(1),
      };

    // ---- Lát cắt (slices): dải trượt đều, không stagger đo được ----
    case "hlslice":
      return slicePair(base, W, H, "h", -1, "dải ngang trượt sang trái");
    case "hrslice":
      return slicePair(base, W, H, "h", 1, "dải ngang trượt sang phải");
    case "vuslice":
      return slicePair(base, W, H, "v", -1, "dải dọc trượt lên trên");
    case "vdslice":
      return slicePair(base, W, H, "v", 1, "dải dọc trượt xuống dưới");

    // ---- Pattern theo ô / dải (xấp xỉ lưới, xem LIMITS §3) ----
    // Dissolve (đợt 14 R2): KHÔNG còn lưới 20×12 — ngưỡng từng pixel
    // đúng vf_xfade.c qua ffmpegDissolveFrand (x, y nguyên, float32).
    // Vùng dissolve-noise không chứa rect: harness raster hoá theo
    // từng pixel, preview canvas vẽ bằng mask ImageData (preview.tsx).
    // dissolveHash cũ vẫn giữ cho pixelize (không đổi hành vi đó).
    case "dissolve": {
      return {
        ...base,
        geometric: true,
        note: "dissolve: pixel thành B khi ffmpegDissolveFrand(x,y) < p (khớp vf_xfade.c, đợt 14 R2)",
        a: layer({ kind: "dissolve-noise", p, invert: true }),
        b: layer({ kind: "dissolve-noise", p, invert: false }),
      };
    }
    case "pixelize": {
      // Khối pixel chỉ xấp xỉ: lưới thô hơn dissolve, cùng luật hash.
      const cols = 12;
      const rows = 8;
      return cellsPair(base, W, H, cols, rows, (i, j) => dissolveHash(i, j) < p,
        "pixelize: ô lớn hiện theo hash < p (xấp xỉ, không khớp từng pixel)");
    }

    // ---- Custom-expr (map trực tiếp từ expr trong transitions.js) ----
    case "blinds-h": {
      // expr: if(lt(mod(Y,H/8),P*H/8),B,A) — mỗi dải ngang, phần trên cao
      // P*H/8 là B. Đợt 15 T6: dịch +0,5 theo y (không gian chỉ số →
      // tâm điểm, cùng quy ước khối V3): FFmpeg đánh giá tại Y
      // nguyên, còn harness/canvas lấy mẫu tại tâm y+0,5; không
      // dịch thì mỗi dải lệch 1 hàng khi p*bh không nguyên (đo đợt
      // 14 R1: 192x108 lệch đúng 8 hàng, 1920x1080 p=0,5 MAD 1,425).
      // Với phép dịch, tâm y+0,5 ∈ [a+0,5, b+0,5) ⟺ Y nguyên ∈
      // [a, b) — khớp chính xác luật mod nguyên, kể cả khi H/8
      // không nguyên (số hàng/dải luân phiên theo mod).
      const bands = 8;
      const bh = H / bands;
      const bRects = [];
      const aRects = [];
      for (let i = 0; i < bands; i++) {
        bRects.push({ x: 0, y: i * bh + 0.5, w: W, h: p * bh });
        aRects.push({ x: 0, y: i * bh + p * bh + 0.5, w: W, h: (1 - p) * bh });
      }
      return {
        ...base,
        geometric: true,
        note: "blinds-h: 8 dải ngang mở từ trên mỗi dải (map đúng expr)",
        a: layer(rects(aRects)),
        b: layer(rects(bRects)),
      };
    }
    case "bars-v": {
      // expr: if(lt(mod(X,W/8),P*W/8),B,A) — mỗi dải dọc, phần trái rộng
      // P*W/8 là B.
      const bands = 8;
      const bw = W / bands;
      const bRects = [];
      const aRects = [];
      for (let i = 0; i < bands; i++) {
        bRects.push({ x: i * bw, y: 0, w: p * bw, h: H });
        aRects.push({ x: i * bw + p * bw, y: 0, w: (1 - p) * bw, h: H });
      }
      return {
        ...base,
        geometric: true,
        note: "bars-v: 8 dải dọc mở từ trái mỗi dải (map đúng expr)",
        a: layer(rects(aRects)),
        b: layer(rects(bRects)),
      };
    }
    case "bars-fade": {
      // expr: if(lt(mod(X,W/8),P*W/8),B,A*(1-P)+B*P) — dải B thuần
      // trên nền crossfade. Mô hình rects cũ bỏ qua nền nên MAD
      // ~40 (nền render là blend, preview cũ vẽ A thuần) — xem
      // LIMITS đợt 15 T2. Kind bars-fade mang p + bandW để
      // rasterizer composite đúng (dải → B, nền → blend); canvas
      // đơn clip vẫn vẽ dải/nền bằng rects qua nhánh riêng ở
      // preview.tsx (không vẽ được crossfade vì chỉ có 1 clip).
      return {
        ...base,
        geometric: true,
        note: "bars-fade: dải B khi mod(X,W/8) < p*W/8, nền crossfade A*(1-p)+B*p (kind bars-fade)",
        a: layer({ kind: "bars-fade", p, bandW: W / 8 }),
        b: layer({ kind: "bars-fade", p, bandW: W / 8 }),
      };
    }
    case "checker": {
      // expr: if(gt(P*4,mod(floor(X/(W/8))+floor(Y/(H/8)),4)),B,A)
      // Đợt 15 T6: dịch toàn bộ lưới +0,5 cả 2 trục (quy ước V3):
      // FFmpeg lấy floor(X/(W/8)) tại X nguyên; tâm điểm (x+0,5)
      // thuộc ô dịch [i*cw+0,5, (i+1)*cw+0,5) ⟺ x nguyên thuộc ô
      // [i*cw, (i+1)*cw) — khớp chính xác kể cả khi W/8 hay H/8
      // không nguyên (192x108: H/8=13,5 gây XẤP XỈ trước sửa).
      const n = 8;
      const cw = W / n;
      const ch = H / n;
      const bRects = [];
      const aRects = [];
      for (let j = 0; j < n; j++) {
        for (let i = 0; i < n; i++) {
          const r = { x: i * cw + 0.5, y: j * ch + 0.5, w: cw, h: ch };
          if ((i + j) % 4 < 4 * p) bRects.push(r);
          else aRects.push(r);
        }
      }
      return {
        ...base,
        geometric: true,
        note: "checker: ô bàn cờ theo (i+j)%4 < 4p, lưới dịch +0,5 (map đúng expr, đợt 15 T6)",
        a: layer(rects(aRects)),
        b: layer(rects(bRects)),
      };
    }
    case "diamond": {
      // expr: abs(X-W/2)+abs(Y-H/2) <= P*(W+H)/2 — hình thoi tâm.
      // Tâm dịch +0.5 sang tâm điểm như diamondclose (đợt 12 T2):
      // expr đánh giá tại chỉ số nguyên, canvas lấy mẫu tại tâm
      // pixel; không dịch thì biên chéo lệch nửa pixel (đo thật
      // đợt 13 C6: 1501–2160 pixel lệch>8 rải ~2–3 pixel/cột trên
      // biên ở 1920x1080 trước fix).
      const r = (p * (W + H)) / 2;
      const ccx = cx + 0.5;
      const ccy = cy + 0.5;
      const raw: Array<readonly [number, number]> = [
        [ccx - r, ccy],
        [ccx, ccy - r],
        [ccx + r, ccy],
        [ccx, ccy + r],
      ];
      const pts = clipToFrame(raw, W, H);
      return {
        ...base,
        geometric: true,
        note: "diamond: hình thoi nở từ tâm (map đúng expr)",
        a: layer(
          pts.length > 0 ? { kind: "polygon-inverted", points: pts } : null,
        ),
        b: layer(
          pts.length > 0 ? { kind: "polygon", points: pts } : rect(0, 0, 0, 0),
        ),
      };
    }
    case "plus": {
      // expr: min(abs(X-W/2),abs(Y-H/2)) <= P*min(W,H)/2 — dấu cộng.
      // Đợt 15 T6: quy ước V3 nhưng KHÁC blinds-h/checker ở chỗ
      // biên là lte (khoảng ĐÓNG [cx-t, cx+t]) chứ không phải nửa
      // mở: dịch +0,5 thuần với w = 2t sẽ mất cột/hàng biên khi
      // cx+t nguyên (192x108 p=0,5: mất cột X=123 và hàng Y=81,
      // 191 pixel — bắt được bằng test đối chứng toàn khung).
      // Công thức đúng như squareopen: tập nguyên [ceil(lo),
      // floor(hi)] → rect nửa mở trong không gian tâm điểm
      // [ceil(lo)+0,5, floor(hi)+1,5). Chiều phủ đầy khung (dọc: y,
      // ngang: x) giữ nguyên 0..W/H; 4 góc A theo cùng biên để
      // phân hoạch kín và rời nhau trong không gian tâm điểm.
      const t = (p * Math.min(W, H)) / 2;
      const vx = Math.ceil(cx - t) + 0.5;
      const vx1 = Math.floor(cx + t) + 1.5;
      const hy = Math.ceil(cy - t) + 0.5;
      const hy1 = Math.floor(cy + t) + 1.5;
      const bRects = [
        { x: vx, y: 0, w: vx1 - vx, h: H },
        { x: 0, y: hy, w: W, h: hy1 - hy },
      ];
      const aRects = [
        { x: 0, y: 0, w: vx, h: hy },
        { x: vx1, y: 0, w: W - vx1, h: hy },
        { x: 0, y: hy1, w: vx, h: H - hy1 },
        { x: vx1, y: hy1, w: W - vx1, h: H - hy1 },
      ];
      return {
        ...base,
        geometric: true,
        note: "plus: dấu cộng lan ra, biên lte theo ceil/floor+1 (map đúng expr, đợt 15 T6)",
        a: layer(rects(aRects)),
        b: layer(rects(bRects)),
      };
    }
    case "grid": {
      // expr: max(mod(X,s),mod(Y,s)) <= P*s với s = min(W,H)/8.
      // Mô hình cũ vẽ chữ L (dải trên + dải trái) là SAI: max <=
      // thr nghĩa là CẢ 2 mod đều <= thr, tức B là 1 Ô VUÔNG
      // ở góc trên-trái mỗi ô (probe FFmpeg đợt 15: 64x40 p=0.5,
      // pixel (3,3) và (1,3) là A, (2,2) là B — L sẽ cho B).
      // Rect ở đây là "thực thi pixel nguyên" của ô vuông liên tục
      // [x0, x0+p*s] x [y0, y0+p*s]: FFmpeg đánh giá tại CHỈ SỐ
      // pixel nguyên X, Y (không phải tâm pixel), nên trong ô i,
      // B gồm các X nguyên thỏa X <= x0+p*s, tức X ∈ [ceil(x0),
      // floor(x0+p*s)] (cắt theo ô), và tương tự cho Y. Rect
      // nguyên này raster đúng cả bằng luật tâm pixel lẫn scanline
      // (rect nguyên [a, a+w) phủ đúng pixel a..a+w-1), kể cả khi
      // s phân số (320x180: s=22.5, ô 1 cho B là X=23..33, không
      // phải 22..33 như rect liên tục [22.5, 33.75) sẽ cho).
      // Tại p=0, ô có gốc nguyên vẫn có đúng 1 pixel B ở góc
      // (mod <= 0) — đúng render, không phải rỗng.
      const s = Math.min(W, H) / 8;
      const cols = Math.ceil(W / s);
      const rows = Math.ceil(H / s);
      const bRects = [];
      const aRects = [];
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const x0 = i * s;
          const y0 = j * s;
          const cellX1 = Math.min(W, (i + 1) * s);
          const cellY1 = Math.min(H, (j + 1) * s);
          const firstX = Math.ceil(x0);
          const firstY = Math.ceil(y0);
          const lastX = Math.ceil(cellX1) - 1;
          const lastY = Math.ceil(cellY1) - 1;
          if (firstX > lastX || firstY > lastY) continue;
          const bX1 = Math.min(Math.floor(x0 + p * s), lastX);
          const bY1 = Math.min(Math.floor(y0 + p * s), lastY);
          if (bX1 >= firstX && bY1 >= firstY) {
            bRects.push({
              x: firstX,
              y: firstY,
              w: bX1 - firstX + 1,
              h: bY1 - firstY + 1,
            });
          }
          // Phần còn lại của ô = dải phải + dải dưới (không giao nhau).
          if (bX1 < lastX) {
            aRects.push({
              x: bX1 + 1,
              y: firstY,
              w: lastX - bX1,
              h: lastY - firstY + 1,
            });
          }
          if (bY1 < lastY && bX1 >= firstX) {
            aRects.push({
              x: firstX,
              y: bY1 + 1,
              w: bX1 - firstX + 1,
              h: lastY - bY1,
            });
          }
        }
      }
      return {
        ...base,
        geometric: true,
        note: "grid: mỗi ô vuông B ở góc trên-trái ô (thực thi pixel nguyên của max(mod) <= p*s)",
        a: layer(rects(aRects)),
        b: layer(rects(bRects)),
      };
    }
    case "clock":
    case "radial": {
      // expr clock: atan2(Y-H/2,X-W/2) < -PI+2*PI*P — quét góc từ -PI.
      // radial built-in quét tương tự (hướng/gốc chính xác chưa đo —
      // xem LIMITS §3).
      const a0 = -Math.PI;
      const a1 = -Math.PI + 2 * Math.PI * p;
      const steps = 48;
      const pts: Array<readonly [number, number]> = [[cx, cy]];
      for (let k = 0; k <= steps; k++) {
        const ang = a0 + ((a1 - a0) * k) / steps;
        pts.push([cx + rMax * Math.cos(ang), cy + rMax * Math.sin(ang)]);
      }
      const clipped = clipToFrame(pts, W, H);
      return {
        ...base,
        geometric: true,
        note:
          type === "clock"
            ? "clock: quét góc như kim đồng hồ (map đúng expr)"
            : "radial: quét góc như clock (xấp xỉ, gốc/hướng chưa đo)",
        a: layer(
          clipped.length > 0
            ? { kind: "polygon-inverted", points: clipped }
            : null,
        ),
        b: layer(
          clipped.length > 0
            ? { kind: "polygon", points: clipped }
            : rect(0, 0, 0, 0),
        ),
      };
    }
    case "circle-soft": {
      // Đợt 15 T6: nối mô hình soft-aware (thay biên cứng cũ) — expr
      // render sau sửa đợt 14 R1: B weight = 1-clip((r-p*R)/(0,15R)),
      // R = hypot(W/2, H/2), r đánh giá tại chỉ số nguyên so với tâm
      // W/2, H/2 (không phải tâm cắt nguyên như circleopen built-in).
      // Lớp A dùng inverted (1-w), lớp B dùng w — cùng hàm
      // radialSoftWeight, preview.tsx vẽ qua mask alpha như
      // radial-gradient. Biên cứng cũ cho MAD 14–18 so với render;
      // mô hình này đo soft-aware MAD 0,18–0,21 ở đợt 14 R1 §3.4.
      // TÂM TRONG KHÔNG GIAN TÂM ĐIỂM: cx,cy của vùng là tâm expr
      // (W/2, H/2) cộng 0,5 — vì canvas/harness lấy mẫu gradient
      // tại tâm pixel (x+0,5): khoảng cách từ tâm dịch này tới
      // tâm pixel bằng đúng khoảng cách FFmpeg tính tại chỉ số
      // nguyên (|x-W/2|). Không dịch thì viền mềm hẹp (0,15R)
      // lệch 0,5px → ở 192x108 MAD ~0,9, le8 ~90% (đo đợt 15 T6);
      // dịch thì về đúng số soft-aware của R1. rMax giữ nguyên
      // hypot(W/2, H/2) theo expr.
      return {
        ...base,
        geometric: true,
        note: "circle-soft: đĩa mềm, B weight tuyến tính từ p tới p+0.15, tâm dịch +0,5 sang tâm điểm (đo thật đợt 14 R1, nối preview đợt 15 T6)",
        a: layer({ kind: "radial-soft", cx: cx + 0.5, cy: cy + 0.5, rMax, center: p, width: 0.15, inverted: true }),
        b: layer({ kind: "radial-soft", cx: cx + 0.5, cy: cy + 0.5, rMax, center: p, width: 0.15, inverted: false }),
      };
    }

    // ---- 14 type V3 (Phase 9 đợt 10: custom-expr; hình học thêm ở
    // đợt 12 T2 — trước đó fallback fade với MAD ~85, xem LIMITS đợt 12
    // T2). Tất cả map trực tiếp từ expr trong transitions.js.
    //
    // QUY ƯỚC TOẠ ĐỘ RIÊNG CỦA KHỐI V3 (đo thật bằng probe FFmpeg, xem
    // LIMITS đợt 12 T2 §2): expr xfade custom đánh giá tại CHỈ SỐ pixel
    // nguyên (X, Y), còn harness/canvas lấy mẫu tại TÂM pixel
    // (x+0.5, y+0.5). Vì vậy hình học V3 tính trong không gian chỉ số
    // rồi dịch +0.5 sang không gian tâm điểm: rect/polygon V3 = hình
    // trong không gian chỉ số + (0.5, 0.5). Không dịch thì biên lệch 1
    // pixel ở mọi ngưỡng không nguyên (blinds-diag MAD 75, rings MAD
    // 77 ở lần đo đầu). Các type cũ (không phải V3) giữ quy ước liên
    // tục sẵn có — ngoại lệ từ đợt 15 T6: blinds-h/plus/checker (nhóm
    // P5, ở trên khối này) đã chuyển sang quy ước +0,5 này vì lệch
    // biên của chúng đã đo rõ là do lấy mẫu; các type cũ còn lại
    // vẫn là nợ mở, không sửa trong đợt này.
    // Các type có vùng B là hợp rời rạc (blinds-diag, rings, corners)
    // không biểu diễn được bằng 1 polygon/rect duy nhất nên dùng quét
    // hàng (rowScanPair): mỗi hàng 1 tập khoảng B, A là phần bù — vẫn
    // là kind "rects" sẵn có, không thêm kind mới. ----
    case "diamondclose": {
      // expr: lte(|X-W/2|+|Y-H/2|, (1-P)*(W+H)/2) → A là hình thoi,
      // ngược với diamond (B là hình thoi). Tâm không gian chỉ số
      // (cx, cy) → tâm không gian tâm điểm (cx+0.5, cy+0.5).
      const r = ((1 - p) * (W + H)) / 2;
      const ccx = cx + 0.5;
      const ccy = cy + 0.5;
      const raw: Array<readonly [number, number]> = [
        [ccx - r, ccy],
        [ccx, ccy - r],
        [ccx + r, ccy],
        [ccx, ccy + r],
      ];
      const pts = clipToFrame(raw, W, H);
      return {
        ...base,
        geometric: true,
        note: "diamondclose: A co thành hình thoi, B lộ ngoài (ngược diamond)",
        a: layer(
          pts.length > 0 ? { kind: "polygon", points: pts } : rect(0, 0, 0, 0),
        ),
        b: layer(
          pts.length > 0 ? { kind: "polygon-inverted", points: pts } : null,
        ),
      };
    }
    case "squareopen": {
      // expr: lte(max(|X-W/2|,|Y-H/2|), P*max(W,H)/2) → B là hình vuông.
      // Cận lte là ĐÓNG 2 đầu: tập chỉ số là [cx-s/2, cx+s/2] → dạng
      // nửa mở [ceil(lo), floor(hi)+1) rồi dịch +0.5 sang tâm điểm
      // (dùng trực tiếp cạnh s sẽ lệch 1 cột khi cx nguyên mà cy
      // nửa nguyên, như khung 72x45: B thiếu cột 54, MAD 1.89).
      const s = p * Math.max(W, H);
      const x0 = Math.ceil(cx - s / 2) + 0.5;
      const x1 = Math.floor(cx + s / 2) + 1.5;
      const y0 = Math.ceil(cy - s / 2) + 0.5;
      const y1 = Math.floor(cy + s / 2) + 1.5;
      const pts = clipToFrame(
        [
          [x0, y0],
          [x1, y0],
          [x1, y1],
          [x0, y1],
        ],
        W,
        H,
      );
      return {
        ...base,
        geometric: true,
        note: "squareopen: B nở từ hình vuông giữa (map đúng expr)",
        a: layer(
          pts.length > 0 ? { kind: "polygon-inverted", points: pts } : null,
        ),
        b: layer(rect(x0, y0, x1 - x0, y1 - y0)),
      };
    }
    case "squareclose": {
      // expr ngược squareopen: A là hình vuông co dần (cận đóng 2 đầu
      // như squareopen).
      const s = (1 - p) * Math.max(W, H);
      const x0 = Math.ceil(cx - s / 2) + 0.5;
      const x1 = Math.floor(cx + s / 2) + 1.5;
      const y0 = Math.ceil(cy - s / 2) + 0.5;
      const y1 = Math.floor(cy + s / 2) + 1.5;
      const pts = clipToFrame(
        [
          [x0, y0],
          [x1, y0],
          [x1, y1],
          [x0, y1],
        ],
        W,
        H,
      );
      return {
        ...base,
        geometric: true,
        note: "squareclose: A co thành hình vuông giữa, B lộ ngoài",
        a: layer(rect(x0, y0, x1 - x0, y1 - y0)),
        b: layer(
          pts.length > 0 ? { kind: "polygon-inverted", points: pts } : null,
        ),
      };
    }
    case "checker-alt": {
      // expr: ô chẵn (i+j)%2==0 hiện khi P>0.25, ô lẻ hiện khi P>0.75.
      const n = 8;
      const cw = W / n;
      const ch = H / n;
      const bRects = [];
      const aRects = [];
      for (let j = 0; j < n; j++) {
        for (let i = 0; i < n; i++) {
          // Ô trong không gian chỉ số +0.5 sang tâm điểm (xem khối V3).
          const r = { x: i * cw + 0.5, y: j * ch + 0.5, w: cw, h: ch };
          const even = (i + j) % 2 === 0;
          if (even ? p > 0.25 : p > 0.75) bRects.push(r);
          else aRects.push(r);
        }
      }
      return {
        ...base,
        geometric: true,
        note: "checker-alt: ô chẵn hiện khi p>0.25, ô lẻ khi p>0.75 (map đúng expr)",
        a: layer(rects(aRects)),
        b: layer(rects(bRects)),
      };
    }
    case "blinds-diag": {
      // expr: lt(mod(X+Y,H/8), P*H/8) — dải mành chéo, chu kỳ S=H/8.
      // Vùng B là hợp nhiều dải chéo rời rạc → quét hàng theo chỉ số
      // hàng nguyên (rowScanPair dịch +0.5 sang tâm điểm).
      const S = H / 8;
      return rowScanPair(base, W, H, (yIdx) => {
        const out: Array<{ x0: number; x1: number }> = [];
        const kMin = Math.floor((-yIdx - p * S) / S) - 1;
        const kMax = Math.ceil((W + yIdx) / S) + 1;
        for (let k = kMin; k <= kMax; k++) {
          out.push({ x0: k * S - yIdx, x1: k * S + p * S - yIdx });
        }
        return out;
      }, "blinds-diag: dải mành chéo mở dần (quét hàng, map đúng expr)");
    }
    case "split-h": {
      // expr: nửa trên B khi X<P*W, nửa dưới B khi X>W-P*W.
      // Đổi sang tâm điểm: ngưỡng lt giữ nguyên +0.5; ngưỡng gt
      // X>v thành X>=floor(v)+1 rồi +0.5 (xem chú thích khối V3).
      // Nửa trên/dưới tách tại Y<H/2 → hàng [0.5, H/2+0.5) / [H/2+0.5, H+0.5).
      const yMid = H / 2 + 0.5;
      const xBot = Math.floor(W - W * p) + 1.5;
      return {
        ...base,
        geometric: true,
        note: "split-h: nửa trên quét từ trái, nửa dưới quét từ phải (map đúng expr)",
        a: layer(
          rects([
            { x: W * p + 0.5, y: 0.5, w: W - W * p, h: H / 2 },
            { x: 0.5, y: yMid, w: xBot - 0.5, h: H / 2 },
          ]),
        ),
        b: layer(
          rects([
            { x: 0.5, y: 0.5, w: W * p, h: H / 2 },
            { x: xBot, y: yMid, w: W + 0.5 - xBot, h: H / 2 },
          ]),
        ),
      };
    }
    case "split-v": {
      // expr: nửa trái B khi Y<P*H, nửa phải B khi Y>H-P*H.
      // (Quy đổi ngưỡng như split-h.)
      const xMid = W / 2 + 0.5;
      const yBot = Math.floor(H - H * p) + 1.5;
      return {
        ...base,
        geometric: true,
        note: "split-v: nửa trái quét từ trên, nửa phải quét từ dưới (map đúng expr)",
        a: layer(
          rects([
            { x: 0.5, y: H * p + 0.5, w: W / 2, h: H - H * p },
            { x: xMid, y: 0.5, w: W / 2, h: yBot - 0.5 },
          ]),
        ),
        b: layer(
          rects([
            { x: 0.5, y: 0.5, w: W / 2, h: H * p },
            { x: xMid, y: yBot, w: W / 2, h: H + 0.5 - yBot },
          ]),
        ),
      };
    }
    case "barn-h": {
      // expr: lt(min(X,W-X), P*W/2) → B là 2 dải mép trái/phải.
      // Mép phải X>W-e → X>=floor(W-e)+1 rồi +0.5; giữa A:
      // X>=ceil(e) và X<=floor(W-e) → [ceil(e)+0.5, floor(W-e)+1.5).
      const e = (p * W) / 2;
      const xR = Math.floor(W - e) + 1.5;
      const xA0 = Math.ceil(e) + 0.5;
      return {
        ...base,
        geometric: true,
        note: "barn-h: B khép vào từ 2 mép trái-phải (map đúng expr)",
        a: layer(rect(xA0, 0.5, xR - xA0, H)),
        b: layer(
          rects([
            { x: 0.5, y: 0.5, w: e, h: H },
            { x: xR, y: 0.5, w: W + 0.5 - xR, h: H },
          ]),
        ),
      };
    }
    case "barn-v": {
      // expr: lt(min(Y,H-Y), P*H/2) → B là 2 dải mép trên/dưới.
      const e = (p * H) / 2;
      const yB = Math.floor(H - e) + 1.5;
      const yA0 = Math.ceil(e) + 0.5;
      return {
        ...base,
        geometric: true,
        note: "barn-v: B khép vào từ 2 mép trên-dưới (map đúng expr)",
        a: layer(rect(0.5, yA0, W, yB - yA0)),
        b: layer(
          rects([
            { x: 0.5, y: 0.5, w: W, h: e },
            { x: 0.5, y: yB, w: W, h: H + 0.5 - yB },
          ]),
        ),
      };
    }
    case "rings": {
      // expr: lt(mod(dist, rMax/4), P*rMax/4) — 4 vòng đồng tâm.
      // Vùng B là hợp các vành khuyên → quét hàng, mỗi hàng tính giao
      // của các vành với đường ngang y=yIdx (giải tích, không lưới ô).
      // Nhánh đúng: tâm hàng nằm trong vành (dy>=lo) → 1 khoảng xuyên
      // tâm; ngược lại → 2 khoảng 2 bên (bản đầu viết ngược 2 nhánh
      // này nên B phủ gần hết khung, đã sửa ở đợt 12 T2).
      const S = rMax / 4;
      return rowScanPair(base, W, H, (yIdx) => {
        const out: Array<{ x0: number; x1: number }> = [];
        const dy = Math.abs(yIdx - cy);
        for (let k = 0; k < 4; k++) {
          const lo = k * S;
          const hi = k * S + p * S;
          if (hi <= lo || dy >= hi) continue;
          const dxHi = Math.sqrt(hi * hi - dy * dy);
          if (dy >= lo) {
            out.push({ x0: cx - dxHi, x1: cx + dxHi });
          } else {
            const dxLo = Math.sqrt(lo * lo - dy * dy);
            out.push({ x0: cx - dxHi, x1: cx - dxLo });
            out.push({ x0: cx + dxLo, x1: cx + dxHi });
          }
        }
        return out;
      }, "rings: vòng đồng tâm mở dần (quét hàng giải tích, map đúng expr)");
    }
    case "corners": {
      // expr: min khoảng cách bình phương tới 4 góc <= (P*rMax)^2 →
      // B là hợp 4 đĩa góc. Quét hàng: mỗi hàng 2 khoảng (trái/phải).
      const R = p * rMax;
      return rowScanPair(base, W, H, (yIdx) => {
        if (R <= 0) return [];
        let reach = 0;
        for (const dy of [yIdx, H - yIdx]) {
          if (dy < R) reach = Math.max(reach, Math.sqrt(R * R - dy * dy));
        }
        if (reach <= 0) return [];
        return [
          { x0: 0, x1: reach },
          { x0: W - reach, x1: W },
        ];
      }, "corners: B nở từ 4 góc (quét hàng, map đúng expr)");
    }
    case "star": {
      // expr: dist <= P*rMax*(1+0.4*cos(5*theta))/0.6 — sao 5 cánh,
      // bán kính là hàm đơn trị theo góc nên là 1 polygon đơn.
      // Tâm dịch +0.5 sang tâm điểm (xem chú thích khối V3).
      const steps = 96;
      const ccx = cx + 0.5;
      const ccy = cy + 0.5;
      const raw: Array<readonly [number, number]> = [];
      for (let k = 0; k < steps; k++) {
        const th = (2 * Math.PI * k) / steps;
        const rr = (p * rMax * (1 + 0.4 * Math.cos(5 * th))) / 0.6;
        raw.push([ccx + rr * Math.cos(th), ccy + rr * Math.sin(th)]);
      }
      const pts = clipToFrame(raw, W, H);
      return {
        ...base,
        geometric: true,
        note: "star: B nở theo sao 5 cánh, 96 đỉnh (map đúng expr, giữ /0.6)",
        a: layer(
          pts.length > 0 ? { kind: "polygon-inverted", points: pts } : null,
        ),
        b: layer(
          pts.length > 0 ? { kind: "polygon", points: pts } : rect(0, 0, 0, 0),
        ),
      };
    }
    case "clock-ccw": {
      // expr: gt(atan2(Y-H/2,X-W/2), PI-2*PI*P) → B là quạt từ góc
      // PI-2*PI*P tới PI (ngược chiều clock: clock quét từ -PI lên).
      // Tâm dịch +0.5 sang tâm điểm (xem chú thích khối V3).
      const a0 = Math.PI - 2 * Math.PI * p;
      const a1 = Math.PI;
      const steps = 48;
      const ccx = cx + 0.5;
      const ccy = cy + 0.5;
      const raw: Array<readonly [number, number]> = [[ccx, ccy]];
      for (let k = 0; k <= steps; k++) {
        const ang = a0 + ((a1 - a0) * k) / steps;
        raw.push([ccx + rMax * Math.cos(ang), ccy + rMax * Math.sin(ang)]);
      }
      const pts = clipToFrame(raw, W, H);
      return {
        ...base,
        geometric: true,
        note: "clock-ccw: B quét ngược chiều kim đồng hồ từ góc PI-2PI*p tới PI",
        a: layer(
          pts.length > 0 ? { kind: "polygon-inverted", points: pts } : null,
        ),
        b: layer(
          pts.length > 0 ? { kind: "polygon", points: pts } : rect(0, 0, 0, 0),
        ),
      };
    }
    case "spiral": {
      // expr: lt(mod(atan2+PI+dist*0.03, 2*PI), 2*PI*P) — với mỗi bán
      // kính r, B là khoảng góc [−PI−0.03r, −PI−0.03r+2PI*p). Vùng này
      // là 1 dải xoắn đơn liên nên vẽ được bằng 1 polygon, NHƯNG phải
      // đóng dải bằng CUNG TRÒN ngoài (bán kính rMax) chứ không phải
      // dây cung thẳng: 2 đầu dải cách nhau 2PI*p (tại p=0.5 là đối
      // nhau qua tâm) nên dây cung đi xuyên tâm và chẻ dải thành 2
      // thùy hẹp (bản đầu sai lỗi này: B chỉ 15.9% thay vì 51.3%).
      // Tâm dịch +0.5 sang tâm điểm (xem chú thích khối V3).
      if (p <= 0) {
        return {
          ...base,
          geometric: true,
          note: "spiral: chưa bắt đầu (B rỗng)",
          a: full(1),
          b: layer(rect(0, 0, 0, 0)),
        };
      }
      if (p >= 1) {
        return {
          ...base,
          geometric: true,
          note: "spiral: hoàn thành (B toàn khung)",
          a: layer(rect(0, 0, 0, 0)),
          b: full(1),
        };
      }
      const ccx = cx + 0.5;
      const ccy = cy + 0.5;
      const steps = Math.min(400, Math.max(48, Math.ceil(rMax)));
      const raw: Array<readonly [number, number]> = [[ccx, ccy]];
      for (let k = 0; k <= steps; k++) {
        const r = (rMax * k) / steps;
        const th = -Math.PI - 0.03 * r;
        raw.push([ccx + r * Math.cos(th), ccy + r * Math.sin(th)]);
      }
      // Cung tròn ngoài từ góc biên 1 tới góc biên 2 tại r = rMax.
      const th1 = -Math.PI - 0.03 * rMax;
      const nArc = Math.max(8, Math.ceil((2 * Math.PI * p) / 0.05));
      for (let j = 1; j < nArc; j++) {
        const th = th1 + (2 * Math.PI * p * j) / nArc;
        raw.push([ccx + rMax * Math.cos(th), ccy + rMax * Math.sin(th)]);
      }
      for (let k = steps; k >= 0; k--) {
        const r = (rMax * k) / steps;
        const th = -Math.PI - 0.03 * r + 2 * Math.PI * p;
        raw.push([ccx + r * Math.cos(th), ccy + r * Math.sin(th)]);
      }
      const pts = clipToFrame(raw, W, H);
      return {
        ...base,
        geometric: true,
        note: "spiral: B quét xoắn ốc (polygon dải xoắn, map đúng expr)",
        a: layer(
          pts.length > 0 ? { kind: "polygon-inverted", points: pts } : null,
        ),
        b: layer(
          pts.length > 0 ? { kind: "polygon", points: pts } : rect(0, 0, 0, 0),
        ),
      };
    }

    // ---- Không mô hình hoá được bằng hình học thuần ----
    case "hblur":
      // Mờ ngang toàn khung — không có vùng/trượt/scale; fallback fade.
      return fade(p, "hblur: mờ ngang không mô hình hoá được → fallback fade");

    // ---- Type lạ: fallback fade, KHÔNG throw (giữ preview không crash) ----
    default:
      return fade(p, `type lạ "${type}" → fallback fade`);
  }
}

/** Cặp quét chéo: B = nửa mặt phẳng, A = phần bù (cũng là đa giác lồi). */
function diagPair(
  base: Omit<TransitionVisual, "a" | "b" | "geometric" | "note">,
  w: number,
  h: number,
  a: number,
  b: number,
  c: number,
  note: string,
): TransitionVisual {
  return {
    ...base,
    geometric: true,
    note,
    a: layer(halfPlanePolygon(w, h, -a, -b, -c)),
    b: layer(halfPlanePolygon(w, h, a, b, c)),
  };
}

/** Cặp slide: cả A và B cùng trượt (dx/dy theo p, tuyến tính). */
function slidePair(
  base: Omit<TransitionVisual, "a" | "b" | "geometric" | "note">,
  adx: number,
  ady: number,
  bdx: number,
  bdy: number,
  type: string,
): TransitionVisual {
  const smooth = type.startsWith("smooth");
  return {
    ...base,
    geometric: true,
    note: smooth
      ? `${type}: trượt như slide (viền gradient + tăng tốc chưa mô hình hoá)`
      : `${type}: cả 2 cùng trượt tuyến tính theo p`,
    a: layer(null, 1, adx, ady),
    b: layer(null, 1, bdx, bdy),
  };
}

/** Cặp cover: chỉ B trượt vào, A tĩnh. */
function coverPair(
  base: Omit<TransitionVisual, "a" | "b" | "geometric" | "note">,
  bdx: number,
  bdy: number,
  note?: string,
): TransitionVisual {
  return {
    ...base,
    geometric: true,
    note: note ?? "cover: B trượt vào trên nền A tĩnh",
    a: full(1),
    b: layer(null, 1, bdx, bdy),
  };
}

/** Cặp reveal: chỉ A trượt ra, B tĩnh. */
function revealPair(
  base: Omit<TransitionVisual, "a" | "b" | "geometric" | "note">,
  adx: number,
  ady: number,
): TransitionVisual {
  return {
    ...base,
    geometric: true,
    note: "reveal: A trượt ra, B tĩnh bên dưới",
    a: layer(null, 1, adx, ady),
    b: full(1),
  };
}

/** Cặp lát cắt: 8 dải trượt đều cùng hướng (không stagger đo được). */
function slicePair(
  base: Omit<TransitionVisual, "a" | "b" | "geometric" | "note">,
  w: number,
  h: number,
  axis: "h" | "v",
  dir: -1 | 1,
  note: string,
): TransitionVisual {
  // p nằm trong base.p — lấy từ đó để khỏi truyền thêm tham số.
  const p = base.p;
  const n = 8;
  const bRects: Array<{ x: number; y: number; w: number; h: number }> = [];
  const aRects: Array<{ x: number; y: number; w: number; h: number }> = [];
  if (axis === "h") {
    const bh = h / n;
    for (let i = 0; i < n; i++) {
      const y = i * bh;
      if (dir === -1) {
        // Trượt sang trái: B chiếm phần phải.
        bRects.push({ x: w * (1 - p), y, w: w * p, h: bh });
        aRects.push({ x: 0, y, w: w * (1 - p), h: bh });
      } else {
        // Trượt sang phải: B chiếm phần trái.
        bRects.push({ x: 0, y, w: w * p, h: bh });
        aRects.push({ x: w * p, y, w: w * (1 - p), h: bh });
      }
    }
  } else {
    const bw = w / n;
    for (let i = 0; i < n; i++) {
      const x = i * bw;
      if (dir === -1) {
        // Trượt lên trên: B chiếm phần dưới.
        bRects.push({ x, y: h * (1 - p), w: bw, h: h * p });
        aRects.push({ x, y: 0, w: bw, h: h * (1 - p) });
      } else {
        // Trượt xuống dưới: B chiếm phần trên.
        bRects.push({ x, y: 0, w: bw, h: h * p });
        aRects.push({ x, y: h * p, w: bw, h: h * (1 - p) });
      }
    }
  }
  return {
    ...base,
    geometric: true,
    note: `${note} (8 dải trượt đều, răng cưa/viền mềm chưa mô hình hoá)`,
    a: layer(rects(aRects)),
    b: layer(rects(bRects)),
  };
}

/** Gộp các khoảng 1 chiều chồng nhau/liền nhau, bỏ khoảng rỗng. */
function mergeIntervals(
  list: Array<{ x0: number; x1: number }>,
): Array<{ x0: number; x1: number }> {
  const sorted = list
    .filter((q) => q.x1 > q.x0)
    .sort((a, b) => a.x0 - b.x0);
  const out: Array<{ x0: number; x1: number }> = [];
  for (const q of sorted) {
    const last = out[out.length - 1];
    if (last && q.x0 <= last.x1) {
      if (q.x1 > last.x1) last.x1 = q.x1;
    } else {
      out.push({ ...q });
    }
  }
  return out;
}

/**
 * Cặp quét hàng: B trong mỗi hàng là hợp các khoảng do intervalsAt(yIdx)
 * cho ra; A là phần bù trong hàng. Dùng cho các type V3 mà vùng B là
 * hợp rời rạc không vẽ được bằng 1 polygon/rect (blinds-diag, rings,
 * corners).
 *
 * intervalsAt nhận CHỈ SỐ hàng pixel nguyên yIdx (không gian chỉ số
 * FFmpeg) và trả về khoảng theo X chỉ số; rowScanPair dịch +0.5 sang
 * không gian tâm điểm rồi cắt về [0,W] (xem chú thích khối V3). Mỗi
 * dải quét rộng đúng 1 hàng pixel (rowH = 1) nên yIdx = chỉ số hàng đó,
 * không còn xấp xỉ theo hàng giữa: bản cũ dùng rowH = max(0.5, h/160)
 * (tối đa 160 dải) nên ở 1080p mỗi dải rộng 6.75px, lệch tới nửa dải
 * ở biên chéo/cong — đo thật đợt 13 C6: blinds-diag MAD 4.27–4.44 ở
 * 1920x1080 trước fix (XẤP XỈ), sau fix về sàn làm tròn (xem LIMITS
 * đợt 13 C6 §2). Giá phải trả: số rect tăng từ ≤160 dải lên H dải
 * (1080 dải ở 1080p); preview gom tất cả rect vào 1 path rồi clip 1
 * lần (preview.tsx: clipRegion), nên chi phí chỉ tăng tuyến tính ở
 * bước dựng path, không phải số lần vẽ.
 */
function rowScanPair(
  base: Omit<TransitionVisual, "a" | "b" | "geometric" | "note">,
  w: number,
  h: number,
  intervalsAt: (yIdx: number) => Array<{ x0: number; x1: number }>,
  note: string,
): TransitionVisual {
  const rowH = 1;
  const bRects: Array<{ x: number; y: number; w: number; h: number }> = [];
  const aRects: Array<{ x: number; y: number; w: number; h: number }> = [];
  for (let y0 = 0; y0 < h; y0 += rowH) {
    const y1 = Math.min(h, y0 + rowH);
    const yIdx = Math.min(
      Math.max(0, Math.floor((y0 + y1) / 2)),
      Math.max(0, h - 1),
    );
    const iv = mergeIntervals(
      intervalsAt(yIdx).map((q) => ({
        x0: Math.max(0, q.x0 + 0.5),
        x1: Math.min(w, q.x1 + 0.5),
      })),
    );
    let cur = 0;
    for (const q of iv) {
      if (q.x0 > cur) {
        aRects.push({ x: cur, y: y0, w: q.x0 - cur, h: y1 - y0 });
      }
      bRects.push({ x: q.x0, y: y0, w: q.x1 - q.x0, h: y1 - y0 });
      cur = Math.max(cur, q.x1);
    }
    if (cur < w) {
      aRects.push({ x: cur, y: y0, w: w - cur, h: y1 - y0 });
    }
  }
  return {
    ...base,
    geometric: true,
    note,
    a: layer(rects(aRects)),
    b: layer(rects(bRects)),
  };
}

/** Cặp theo ô lưới: ô hiện khi pred(i, j) đúng; A = các ô còn lại. */
function cellsPair(
  base: Omit<TransitionVisual, "a" | "b" | "geometric" | "note">,
  w: number,
  h: number,
  cols: number,
  rows: number,
  pred: (i: number, j: number) => boolean,
  note: string,
): TransitionVisual {
  const cw = w / cols;
  const ch = h / rows;
  const bRects = [];
  const aRects = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const r = { x: i * cw, y: j * ch, w: cw, h: ch };
      if (pred(i, j)) bRects.push(r);
      else aRects.push(r);
    }
  }
  return {
    ...base,
    geometric: true,
    note,
    a: layer(rects(aRects)),
    b: layer(rects(bRects)),
  };
}
// ---------------------------------------------------------------------------
// Transition preview (Phase 9 đợt 10, luồng V1) — mô tả transition cho 1
// clip đang chuyển, định nghĩa trong module này (dời từ previewEngine.ts ở bước tích hợp đợt 10: tránh import .ts trong file tsc-include, xem docs/PHASE9_ROUND10_PREVIEW_PARITY_LIMITS.md).
// Xem TRANSITION_PREVIEW_LIMITS.md: preview vẽ từng clip riêng lẻ nên chỉ
// dùng lớp của clip đó (B khi vào, A khi ra); phần khung còn lại là nền
// đen, khác render xfade (thấy cả 2 clip cùng lúc).
// ---------------------------------------------------------------------------

/** Đầu vào tối thiểu cho transitionClipVisual (VideoClip thỏa mãn). */
export interface TransitionClipInput {
  transitionIn?: { type: string; duration: number } | null;
  transitionOut?: { type: string; duration: number } | null;
  duration: number;
}

/** Visual transition của 1 clip tại localT (giây từ đầu clip). */
export interface TransitionClipVisual {
  /** Cửa sổ transition đang active: vào / ra / không có. */
  window: "in" | "out" | null;
  type: string;
  /** Tiến độ trong cửa sổ (0..1), 0 khi không có cửa sổ. */
  p: number;
  /** true = có hình học riêng cần clip/trượt/scale (xem layer). */
  geometric: boolean;
  /** Alpha hiệu dụng của clip (đã gồm cả 2 cửa sổ nếu cùng active). */
  alpha: number;
  /** Lớp hình học của clip này (null khi không có cửa sổ / chỉ alpha). */
  layer: TransitionLayerSpec | null;
  note: string;
}

const NO_TRANSITION: TransitionClipVisual = {
  window: null,
  type: "none",
  p: 0,
  geometric: false,
  alpha: 1,
  layer: null,
  note: "không có transition",
};

/**
 * Tính transition visual cho 1 clip tại localT.
 * - transitionIn active khi 0 <= localT < duration (p = localT / duration).
 * - transitionOut active khi localT > clip.duration - duration
 *   (p = thời gian đã trôi trong cửa sổ / duration).
 * - type "none" hoặc duration <= 0 → coi như không có transition.
 * - Cả 2 cửa sổ cùng active (clip ngắn hơn tổng 2 duration): alpha nhân
 *   nhau, hình học lấy theo cửa sổ vào (ưu tiên clip mới).
 * - Type lạ → fallback fade qua describeTransition, không throw.
 * Hành vi fade cũ được giữ nguyên: fade vào alpha = localT/duration,
 * fade ra alpha = (clip.duration - localT)/duration.
 */
export function transitionClipVisual(
  clip: TransitionClipInput,
  localT: number,
  frameW: number,
  frameH: number,
): TransitionClipVisual {
  const dur = clip.duration;
  if (!(dur > 0) || !Number.isFinite(localT)) return NO_TRANSITION;
  const tin = clip.transitionIn;
  const tout = clip.transitionOut;
  const inActive =
    !!tin &&
    tin.type !== "none" &&
    tin.duration > 0 &&
    localT >= 0 &&
    localT < tin.duration;
  const outActive =
    !!tout &&
    tout.type !== "none" &&
    tout.duration > 0 &&
    localT > dur - tout.duration &&
    localT < dur;
  if (!inActive && !outActive) return NO_TRANSITION;

  const inVis = inActive
    ? describeTransition(tin!.type, localT / tin!.duration, frameW, frameH)
    : null;
  const outVis = outActive
    ? describeTransition(
        tout!.type,
        (localT - (dur - tout!.duration)) / tout!.duration,
        frameW,
        frameH,
      )
    : null;

  if (inVis && outVis) {
    // Cả 2 cửa sổ: alpha nhân nhau; hình học lấy lớp B (clip đang vào).
    return {
      window: "in",
      type: inVis.type,
      p: inVis.p,
      geometric: inVis.geometric,
      alpha: Math.min(1, Math.max(0, inVis.b.alpha * outVis.a.alpha)),
      layer: inVis.geometric ? inVis.b : null,
      note: `cả 2 cửa sổ transition cùng active; hình học theo vào (${inVis.type})`,
    };
  }
  if (inVis) {
    return {
      window: "in",
      type: inVis.type,
      p: inVis.p,
      geometric: inVis.geometric,
      alpha: inVis.b.alpha,
      layer: inVis.geometric ? inVis.b : null,
      note: inVis.note,
    };
  }
  // Chỉ còn outVis.
  return {
    window: "out",
    type: outVis!.type,
    p: outVis!.p,
    geometric: outVis!.geometric,
    alpha: outVis!.a.alpha,
    layer: outVis!.geometric ? outVis!.a : null,
    note: outVis!.note,
  };
}
