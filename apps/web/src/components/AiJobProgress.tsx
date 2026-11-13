/**
 * AiJobProgress — Thanh tiến trình dùng chung cho job AI dài (đợt 80 H8,
 * gap N4; đợt 81 I6 thêm trạng thái "đang ước lượng").
 *
 * Hiển thị: nhãn phase + % thật (khi biết) + ETA ước lượng + nút Hủy.
 * Khi progress = null (chưa biết tổng — vd TTS chưa đọc được số chunk)
 * thì hiện spinner + phase thay vì % bịa. Nút Hủy chỉ hiện khi caller
 * truyền onCancel (bấm → caller abort AbortController → bridge kill
 * subprocess thật).
 *
 * ETA (đợt 81 I6): khi bridge chưa đủ dữ liệu để ước lượng (etaText rỗng
 * — job mới chạy, < 2 sample trong cửa sổ 8s, hoặc tốc độ = 0) thì hiện
 * "Đang ước lượng thời gian còn lại…" thay vì để trống — user biết ETA
 * sắp có chứ không tưởng ETA bị hỏng. Component này chỉ render khi job
 * đang chạy (mọi caller đều render có điều kiện theo busy/running/
 * working) nên nhãn ước lượng không bao giờ hiện khi job không chạy.
 */
import { t as i18nT } from "../i18n";

export interface AiJobProgressProps {
  /** Nhãn phase đã localize (caller resolve qua resolveAiJobPhaseLabel / captionPhase63R1 / scenePhase63R5). Bỏ trống khi caller đã hiện phase ở trên (tránh lặp) — khi đó chỉ hiện % + ETA. */
  phaseLabel?: string;
  /** Tiến trình 0..1, null khi chưa biết tổng. */
  progress: number | null;
  /** Chuỗi ETA đã format ("còn ~2 phút 10 giây"), "" khi chưa ước lượng được. */
  etaText: string;
  /** Callback nút Hủy; không truyền thì không hiện nút. */
  onCancel?: () => void;
}

export function AiJobProgress({ phaseLabel, progress, etaText, onCancel }: AiJobProgressProps) {
  const pct = progress === null ? null : Math.round(Math.min(1, Math.max(0, progress)) * 100);
  const label = phaseLabel || "";
  // Đợt 81 I6: chưa có ETA (etaText rỗng) → hiện "Đang ước lượng…" thay vì
  // để trống. Job đang chạy nên ETA sẽ có sau ≥2 sample tiến trình.
  const etaLabel = etaText || i18nT("aiJob.etaEstimating");
  const statusText = [label, pct !== null ? `${pct}%` : "", etaLabel].filter(Boolean).join(" · ");
  return (
    <div role="status" aria-label={label || "AI job progress"}>
      {statusText && (
        <p style={{ fontSize: 12, margin: "0 0 4px" }}>{statusText}</p>
      )}
      {pct !== null ? (
        <div
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={phaseLabel}
          style={{
            height: 8,
            borderRadius: 4,
            background: "rgba(128,128,128,0.3)",
            overflow: "hidden",
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              borderRadius: 4,
              background: "#30a46c",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      ) : (
        <div className="spinner" aria-hidden />
      )}
      {onCancel && (
        <button type="button" onClick={onCancel}>
          {i18nT("aiJob.cancel")}
        </button>
      )}
    </div>
  );
}
