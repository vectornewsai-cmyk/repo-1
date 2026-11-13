/**
 * safeArea.ts — Vùng an toàn (safe area) cho từng nền tảng mạng xã hội
 * (Phase 9 đợt 73 A9 — hướng S4 trong PHASE9_GAP_ANALYSIS.md §2.6).
 *
 * Vấn đề: preset xuất đã có TikTok 9:16 / Instagram 1:1 nhưng chưa có
 * preset 4:5, và preview KHÔNG hề có chỉ dẫn vùng an toàn — user đặt
 * chữ/caption vào đúng chỗ TikTok che bằng nút like, caption, thanh
 * điều hướng thì export ra mới phát hiện. Module này định nghĩa các
 * vùng UI của nền tảng che lên video (thanh trên, ray nút phải, vùng
 * caption dưới, end-screen) + khung title-safe, toàn bộ theo tỉ lệ
 * 0..1 của khung hình nên áp được cho mọi độ phân giải.
 *
 * SỐ LIỆU LÀ XẤP XỈ, KHÔNG PHẢI ĐO PIXEL-EXACT: các tỉ lệ lấy từ bố
 * cục UI công khai của TikTok/Instagram/YouTube, đối chiếu chéo nhiều
 * nguồn công khai tháng 9–10/2026 (đợt 74 B5):
 * - TikTok: thanh trên 11% (đo tay trong app 211px/1920, Uplonic
 *   09/2026; Revid 220px; TikTok Ads template chỉ 130px = 6,8% là mức
 *   tối thiểu, chưa tính notch/Dynamic Island), ray phải 13% rộng
 *   (140px — số của chính TikTok, khớp Muzecmo/Revid), caption dưới
 *   27% (đo tay 518px, Uplonic 09/2026; template TikTok 480px = 25%;
 *   các guide thận trọng dùng 30%).
 * - Instagram 4:5 (post feed thường, KHÔNG phải quảng cáo): Meta
 *   KHÔNG công bố tỉ lệ cho feed 4:5 — chỉ dặn "chừa mép dưới và hai
 *   bên"; con số thực dụng ~250px dưới (soku.ai) = 18,5% của 1350px,
 *   cộng crop grid 3:4 cắt ~34px mỗi bên từ 01/2025.
 * - YouTube 16:9: end-screen do creator tự đặt vị trí (không có UI
 *   cố định) — zone 25%×22% góc dưới-phải là vị trí đặt thường dùng;
 *   element video end-screen ~32% rộng (613px/1920) theo khung tham
 *   chiếu của YouTube Editor.
 * Nền tảng đổi UI thì số lệch theo; overlay ghi rõ "xấp xỉ" và chỉ
 * dùng để căn chữ, không dùng để cắt video. Không có vùng nào được
 * đo từ ảnh chụp màn hình có bản quyền — chỉ ước lượng từ mô tả
 * bố cục chung và các số liệu công khai nêu trên.
 *
 * Đợt 80 H10 (S4): thêm "reels" và "shorts" — trước đây preset TikTok
 * gộp chung cả 3 nền tảng 9:16 nhưng UI mỗi app khác nhau (xem từng
 * platform). platformForAspect với khung 9:16 trả về nền tảng 9:16
 * ĐẦU TIÊN trong danh sách (tiktok) khi hòa tỉ lệ — user đổi tay qua
 * ô select trong overlay; preset xuất thì map chính xác từng nền tảng
 * qua safeAreaPlatformForPreset.
 *
 * Module thuần (không DOM, không dependency) để test được bằng Node
 * strip-types như các test lib khác của repo.
 */

/** Một vùng hình chữ nhật theo tỉ lệ khung hình (0..1). */
export interface SafeAreaZone {
  /** id ổn định: "topBar" | "rightRail" | "bottomCaption" | "endScreen". */
  id: string;
  /** key i18n cho nhãn (nhóm safeArea.zone*). */
  labelKey: string;
  /** Cách mép trên, tỉ lệ chiều cao khung. */
  top: number;
  /** Cách mép trái, tỉ lệ chiều rộng khung. */
  left: number;
  /** Chiều rộng, tỉ lệ chiều rộng khung. */
  width: number;
  /** Chiều cao, tỉ lệ chiều cao khung. */
  height: number;
}

/** Khung title-safe: chữ quan trọng nên nằm gọn trong khung này. */
export interface SafeAreaTitleSafe {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SafeAreaPlatform {
  /** id ổn định, dùng làm value cho <select> và localStorage. */
  id: string;
  /** key i18n cho nhãn (nhóm safeArea.platform*). */
  labelKey: string;
  /** Tỉ lệ khung chuẩn của nền tảng (rộng / cao). */
  aspectW: number;
  aspectH: number;
  /** Các vùng UI của nền tảng che lên video (có thể rỗng). */
  zones: SafeAreaZone[];
  /** Khung title-safe (không giao với các zone). */
  titleSafe: SafeAreaTitleSafe;
}

export const SAFE_AREA_PLATFORMS: SafeAreaPlatform[] = [
  {
    id: "tiktok",
    labelKey: "safeArea.platformTiktok",
    aspectW: 9,
    aspectH: 16,
    zones: [
      // Thanh trên (logo + nút Follow/For You) ~11% chiều cao (đo tay
      // 211px/1920, Uplonic 09/2026; template TikTok 130px là mức tối thiểu).
      { id: "topBar", labelKey: "safeArea.zoneTopBar", top: 0, left: 0, width: 1, height: 0.11 },
      // Ray nút phải (like/comment/share) ~13% chiều rộng, đoạn giữa-dưới.
      { id: "rightRail", labelKey: "safeArea.zoneRightRail", top: 0.32, left: 0.87, width: 0.13, height: 0.46 },
      // Caption + nhạc + thanh điều hướng dưới ~27% chiều cao (đo tay
      // 518px/1920, Uplonic 09/2026; template TikTok 480px = 25%).
      { id: "bottomCaption", labelKey: "safeArea.zoneBottomCaption", top: 0.73, left: 0, width: 1, height: 0.27 },
    ],
    // Tránh cả 3 zone: chừa phải 13% + trên 11% + dưới 27%.
    // Khớp khung an toàn công bố (Revid: x 5,6%–87%, y 11,5%–75%).
    titleSafe: { x: 0.05, y: 0.12, w: 0.79, h: 0.61 },
  },
  {
    // Đợt 80 H10 (S4): Instagram Reels — tách khỏi TikTok (trước đây
    // preset TikTok gộp chung Reels nhưng UI 2 app khác nhau).
    // Số liệu XẤP XỈ từ mô tả bố cục công khai (postlabs 09/2026:
    // vùng an toàn chính của Reels ~ khung 4:5 giữa 1080×1350):
    // Reels có thanh trên (tiêu đề "Reels" + camera) hẹp hơn TikTok
    // (~9%), ray phải tương tự (~13%), caption + tên user + audio +
    // ô bình luận dưới ~25% (Reels không có thanh điều hướng dưới dày
    // như TikTok). Title-safe chừa phải 13% + trên 9% + dưới 25%.
    id: "reels",
    labelKey: "safeArea.platformReels",
    aspectW: 9,
    aspectH: 16,
    zones: [
      { id: "topBar", labelKey: "safeArea.zoneTopBar", top: 0, left: 0, width: 1, height: 0.09 },
      { id: "rightRail", labelKey: "safeArea.zoneRightRail", top: 0.3, left: 0.87, width: 0.13, height: 0.44 },
      { id: "bottomCaption", labelKey: "safeArea.zoneBottomCaption", top: 0.75, left: 0, width: 1, height: 0.25 },
    ],
    titleSafe: { x: 0.05, y: 0.11, w: 0.79, h: 0.61 },
  },
  {
    // Đợt 80 H10 (S4): YouTube Shorts — UI khác hẳn TikTok/Reels.
    // Số liệu XẤP XỈ từ mô tả bố cục công khai (capcutguide 10/2026:
    // YouTube KHÔNG công bố safe-zone cho Shorts thường; margin tham
    // chiếu từ Google Ads Help cho video dọc): thanh trên (logo Shorts
    // + tìm kiếm) ~8%, ray phải (like/dislike/bình luận/chia sẻ/remix)
    // ~12% rộng đoạn giữa, tiêu đề + kênh + nút Subscribe dưới ~20%
    // (ngắn hơn TikTok vì Shorts không có thanh điều hướng dày + ô
    // caption dài). Title-safe chừa phải 12% + trên 8% + dưới 20%.
    id: "shorts",
    labelKey: "safeArea.platformShorts",
    aspectW: 9,
    aspectH: 16,
    zones: [
      { id: "topBar", labelKey: "safeArea.zoneTopBar", top: 0, left: 0, width: 1, height: 0.08 },
      { id: "rightRail", labelKey: "safeArea.zoneRightRail", top: 0.28, left: 0.88, width: 0.12, height: 0.48 },
      { id: "bottomCaption", labelKey: "safeArea.zoneBottomCaption", top: 0.8, left: 0, width: 1, height: 0.2 },
    ],
    titleSafe: { x: 0.05, y: 0.1, w: 0.8, h: 0.67 },
  },
  {
    id: "youtube",
    labelKey: "safeArea.platformYoutube",
    aspectW: 16,
    aspectH: 9,
    zones: [
      // End-screen YouTube chiếm góc dưới-phải ~25% rộng × 22% cao.
      { id: "endScreen", labelKey: "safeArea.zoneEndScreen", top: 0.78, left: 0.75, width: 0.25, height: 0.22 },
    ],
    // Title-safe 5% ba phía trên/trái/phải, dưới chừa end-screen
    // (kết thúc ở y = 0.76, trước zone endScreen ở 0.78).
    titleSafe: { x: 0.05, y: 0.05, w: 0.9, h: 0.71 },
  },
  {
    id: "instagram-square",
    labelKey: "safeArea.platformInstagramSquare",
    aspectW: 1,
    aspectH: 1,
    zones: [
      { id: "topBar", labelKey: "safeArea.zoneTopBar", top: 0, left: 0, width: 1, height: 0.06 },
      // Caption feed che phần dưới ~13%.
      { id: "bottomCaption", labelKey: "safeArea.zoneBottomCaption", top: 0.87, left: 0, width: 1, height: 0.13 },
    ],
    titleSafe: { x: 0.05, y: 0.08, w: 0.9, h: 0.77 },
  },
  {
    id: "instagram-portrait",
    labelKey: "safeArea.platformInstagramPortrait",
    aspectW: 4,
    aspectH: 5,
    zones: [
      { id: "topBar", labelKey: "safeArea.zoneTopBar", top: 0, left: 0, width: 1, height: 0.06 },
      // Feed dọc 4:5: chừa dưới ~18% (≈243px/1350, gần mức ~250px mà
      // các guide post thường khuyên) cho caption/preview + Explore.
      { id: "bottomCaption", labelKey: "safeArea.zoneBottomCaption", top: 0.82, left: 0, width: 1, height: 0.18 },
    ],
    titleSafe: { x: 0.05, y: 0.08, w: 0.9, h: 0.74 },
  },
];

export function getSafeAreaPlatform(id: string): SafeAreaPlatform | undefined {
  return SAFE_AREA_PLATFORMS.find((p) => p.id === id);
}

/**
 * Nền tảng safe-area tương ứng với 1 preset xuất (exportPresets.ts).
 * - "tiktok" → tiktok (9:16); "ig-square" → instagram-square (1:1);
 *   "ig-portrait" → instagram-portrait (4:5).
 * - Các preset 16:9 (720p/1080p/4k/youtube) → youtube (title-safe 5%).
 * - "custom" hoặc id lạ → null: caller tự suy từ tỉ lệ project.
 */
export function safeAreaPlatformForPreset(presetId: string): SafeAreaPlatform | null {
  switch (presetId) {
    case "tiktok":
      return getSafeAreaPlatform("tiktok") ?? null;
    // Đợt 80 H10: Reels/Shorts nay có preset + safe-area riêng (trước
    // đây preset "tiktok" gộp chung cả 3 nền tảng 9:16).
    case "reels":
      return getSafeAreaPlatform("reels") ?? null;
    case "shorts":
      return getSafeAreaPlatform("shorts") ?? null;
    case "ig-square":
      return getSafeAreaPlatform("instagram-square") ?? null;
    case "ig-portrait":
      return getSafeAreaPlatform("instagram-portrait") ?? null;
    case "720p":
    case "1080p":
    case "4k":
    case "youtube":
      return getSafeAreaPlatform("youtube") ?? null;
    default:
      return null;
  }
}

/**
 * Đoán nền tảng theo tỉ lệ khung project. Khớp khi tỉ lệ lệch ≤ 6%
 * so với tỉ lệ chuẩn (cho phép project 1080×1920 vs 9:16 chuẩn,
 * 1080×1350 vs 4:5, ...). Lệch hơn → null (không đoán mò).
 */
export function platformForAspect(width: number, height: number): SafeAreaPlatform | null {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
  const ratio = width / height;
  let best: SafeAreaPlatform | null = null;
  let bestErr = Infinity;
  for (const p of SAFE_AREA_PLATFORMS) {
    const err = Math.abs(ratio - p.aspectW / p.aspectH) / (p.aspectW / p.aspectH);
    if (err < bestErr) {
      bestErr = err;
      best = p;
    }
  }
  return bestErr <= 0.06 ? best : null;
}

/** Style CSS (px, làm tròn 1 chữ số) cho 1 zone trên khung video đã biết kích thước. */
export function zoneStyle(
  zone: SafeAreaZone,
  videoRect: { x: number; y: number; w: number; h: number },
): { left: number; top: number; width: number; height: number } {
  const r1 = (n: number) => Math.round(n * 10) / 10;
  return {
    left: r1(videoRect.x + zone.left * videoRect.w),
    top: r1(videoRect.y + zone.top * videoRect.h),
    width: r1(zone.width * videoRect.w),
    height: r1(zone.height * videoRect.h),
  };
}

/** Style CSS (px) cho khung title-safe trên khung video đã biết kích thước. */
export function titleSafeStyle(
  platform: SafeAreaPlatform,
  videoRect: { x: number; y: number; w: number; h: number },
): { left: number; top: number; width: number; height: number } {
  const r1 = (n: number) => Math.round(n * 10) / 10;
  const ts = platform.titleSafe;
  return {
    left: r1(videoRect.x + ts.x * videoRect.w),
    top: r1(videoRect.y + ts.y * videoRect.h),
    width: r1(ts.w * videoRect.w),
    height: r1(ts.h * videoRect.h),
  };
}

/**
 * Khung video (letterbox) bên trong khung chứa, cùng công thức với
 * preview.tsx (scale = min(cw/W, ch/H), căn giữa). Trả về {x, y, w, h}
 * theo px CSS của khung chứa.
 */
export function letterboxRect(
  containerW: number,
  containerH: number,
  videoW: number,
  videoH: number,
): { x: number; y: number; w: number; h: number } {
  if (
    !Number.isFinite(containerW) || !Number.isFinite(containerH) ||
    !Number.isFinite(videoW) || !Number.isFinite(videoH) ||
    containerW <= 0 || containerH <= 0 || videoW <= 0 || videoH <= 0
  ) {
    return { x: 0, y: 0, w: 0, h: 0 };
  }
  const scale = Math.min(containerW / videoW, containerH / videoH);
  const w = videoW * scale;
  const h = videoH * scale;
  return { x: (containerW - w) / 2, y: (containerH - h) / 2, w, h };
}

/**
 * Validate 1 platform: mọi zone nằm gọn trong [0,1], title-safe nằm
 * gọn trong khung và KHÔNG giao với bất kỳ zone nào (chữ trong
 * title-safe không bị UI nền tảng che). Trả về danh sách lỗi (rỗng =
 * hợp lệ). Dùng trong test + tự kiểm tra khi thêm nền tảng mới.
 */
export function validateSafeAreaPlatform(p: SafeAreaPlatform): string[] {
  const errs: string[] = [];
  const in01 = (n: number) => Number.isFinite(n) && n >= 0 && n <= 1;
  for (const z of p.zones) {
    if (!in01(z.top) || !in01(z.left) || !in01(z.width) || !in01(z.height)) {
      errs.push(`${p.id}: zone ${z.id} có giá trị ngoài [0,1]`);
    } else if (z.top + z.height > 1 + 1e-9 || z.left + z.width > 1 + 1e-9) {
      errs.push(`${p.id}: zone ${z.id} tràn khỏi khung hình`);
    }
  }
  const ts = p.titleSafe;
  if (!in01(ts.x) || !in01(ts.y) || !in01(ts.w) || !in01(ts.h) || ts.x + ts.w > 1 + 1e-9 || ts.y + ts.h > 1 + 1e-9) {
    errs.push(`${p.id}: titleSafe tràn khỏi khung hình`);
  } else {
    for (const z of p.zones) {
      const overlap =
        ts.x < z.left + z.width && ts.x + ts.w > z.left &&
        ts.y < z.top + z.height && ts.y + ts.h > z.top;
      if (overlap) errs.push(`${p.id}: titleSafe giao với zone ${z.id}`);
    }
  }
  return errs;
}
