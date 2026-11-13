/**
 * SafeAreaOverlay.tsx — Lớp phủ vùng an toàn lên preview
 * (Phase 9 đợt 73 A9, hướng S4 trong PHASE9_GAP_ANALYSIS.md §2.6).
 *
 * Vẽ các vùng UI của nền tảng (thanh trên, ray nút phải, caption dưới,
 * end-screen) thành vệt mờ có nhãn + khung title-safe nét đứt, đè lên
 * đúng khung video đã letterbox (không đè lên cả khung chứa khi có viền
 * đen hai bên). Overlay KHÔNG chặn thao tác: pointer-events none, trừ
 * ô <select> chọn nền tảng (đặt góc trên-trái khung video).
 *
 * Nền tảng hiển thị do cha quyết (đã phân giải từ preset xuất hoặc tỉ
 * lệ project); prop platformId = "auto" thì tự đoán theo tỉ lệ khung.
 * Mọi số vùng đều là xấp xỉ — xem safeArea.ts, overlay ghi rõ điều đó
 * ở title của lớp phủ.
 */
import { useMemo } from "react";
import { t as i18nT } from "../i18n";
import {
  SAFE_AREA_PLATFORMS,
  getSafeAreaPlatform,
  platformForAspect,
  titleSafeStyle,
  zoneStyle,
  type SafeAreaPlatform,
} from "../lib/safeArea";

export interface SafeAreaOverlayProps {
  /** Bật/tắt lớp phủ. */
  enabled: boolean;
  /** id nền tảng ("tiktok" | "reels" | "shorts" | "youtube" |
   *  "instagram-square" | "instagram-portrait") hoặc "auto" (đoán theo
   *  tỉ lệ khung). */
  platformId: string;
  /** Khung video đã letterbox trong khung chứa (px CSS). */
  videoRect: { x: number; y: number; w: number; h: number };
  /** Kích thước khung video gốc (để đoán nền tảng khi platformId="auto"). */
  videoW: number;
  videoH: number;
  /** User đổi nền tảng bằng ô select trong overlay. */
  onPlatformChange: (id: string) => void;
}

export function resolveSafeAreaPlatform(
  platformId: string,
  videoW: number,
  videoH: number,
): SafeAreaPlatform | null {
  if (platformId !== "auto") return getSafeAreaPlatform(platformId) ?? null;
  return platformForAspect(videoW, videoH);
}

export function SafeAreaOverlay({
  enabled,
  platformId,
  videoRect,
  videoW,
  videoH,
  onPlatformChange,
}: SafeAreaOverlayProps) {
  const platform = useMemo(
    () => resolveSafeAreaPlatform(platformId, videoW, videoH),
    [platformId, videoW, videoH],
  );
  if (!enabled || !platform || videoRect.w <= 0 || videoRect.h <= 0) return null;

  const ts = titleSafeStyle(platform, videoRect);
  return (
    <div
      className="safe-area-overlay"
      title={i18nT("safeArea.overlayTitle")}
    >
      {platform.zones.map((z) => {
        const s = zoneStyle(z, videoRect);
        return (
          <div
            key={z.id}
            className="safe-area-zone"
            aria-hidden="true"
            style={{ left: s.left, top: s.top, width: s.width, height: s.height }}
          >
            <span className="safe-area-zone-label">{i18nT(z.labelKey)}</span>
          </div>
        );
      })}
      <div
        className="safe-area-title-safe"
        aria-hidden="true"
        style={{ left: ts.left, top: ts.top, width: ts.width, height: ts.height }}
      >
        <span className="safe-area-title-safe-label">{i18nT("safeArea.titleSafeLabel")}</span>
      </div>
      <select
        className="safe-area-select"
        aria-label={i18nT("safeArea.platformAria")}
        value={platformId}
        onChange={(e) => onPlatformChange(e.target.value)}
        onPointerDown={(e) => e.stopPropagation()}
        title={i18nT("safeArea.platformTitle")}
      >
        <option value="auto">{i18nT("safeArea.platformAuto")}</option>
        {SAFE_AREA_PLATFORMS.map((p) => (
          <option key={p.id} value={p.id}>
            {i18nT(p.labelKey)}
          </option>
        ))}
      </select>
    </div>
  );
}
