/**
 * LoadReportPanel — Panel "Báo cáo tải project" (Phase 9 đợt 27, luồng K5).
 *
 * Hiện báo cáo của lần load gần nhất sau khi toast 4.5s của J5 đã
 * đóng: liệt kê warnings speedKeyframes có cấu trúc (loại vi phạm,
 * đường dẫn clip/nested, giá trị sai, gợi ý sửa) + các lưu ý chuỗi
 * khác của lần load đó. Panel bền vững: đóng/mở lại qua strip ở App
 * cho tới khi user bấm "Bỏ qua" hoặc tạo project mới.
 *
 * - Định vị: nút mỗi dòng chọn clip cấp cao chứa vi phạm trên
 *   timeline (store.selectMany) và nhảy playhead tới đầu clip đó.
 *   Clip trong nested → chọn clip ngoài cùng + ghi chú rõ.
 *   Path không còn khớp spec hiện tại → không có nút, chỉ ghi chú.
 * - Sửa: nút "Sửa dòng này" hiện khi App truyền onFixWarning — đợt
 *   29 L4 đổi ngữ nghĩa: handler này chỉ sửa curve của đúng clip ở
 *   dòng vừa bấm (store action fixOneSpeedCurveViolation, 1 bước
 *   undo); nút "Sửa tất cả curve vi phạm" riêng (prop onFixAllWarnings)
 *   giữ hành vi cũ sửa toàn spec (store K2). Đợt 30 M4 thêm nút
 *   "Sửa keyframe này" (prop onFixKeyframe) chỉ hiện ở dòng có
 *   keyframeIndex — chỉ sửa đúng keyframe đó (store action
 *   fixOneKeyframeViolation), keyframe vi phạm khác của cùng clip ở
 *   lại. Dòng không có chỉ số keyframe (shape/rỗng/quá 128) không có
 *   nút này vì không có keyframe đơn lẻ để nhắm tới — dùng nút mức
 *   clip. Panel chỉ gọi handler, không tự sửa.
 * - i18n: toàn bộ chrome của panel qua key `loadReport.*` (vi/en), và
 *   message J5 hiển thị theo locale hiện tại qua messageKey (đợt 28
 *   L4, xem loadReport.resolveWarningMessage) — warning cũ không có
 *   key thì fallback về câu tiếng Việt gốc như trước.
 */
import { useEffect } from "react";
import { useStore } from "../../store";
import { t } from "../../i18n";
import {
  formatOverflowLine,
  formatStructuredNote,
  formatWarningValue,
  resolveTopLevelClip,
  resolveWarningMessage,
  suggestFix,
  type LoadReport,
  type LoadReportFixHandler,
} from "../../lib/loadReport";
import type { SpeedCurveWarning } from "../../lib/projectRepo";

interface Props {
  report: LoadReport;
  onClose: () => void;
  /**
   * Đợt 29 L4: có handler thì mỗi dòng hiện nút "Sửa dòng này" — chỉ
   * sửa curve của đúng clip ở dòng đó (không đụng clip khác).
   */
  onFixWarning?: LoadReportFixHandler;
  /**
   * Đợt 29 L4: có handler thì panel hiện thêm nút "Sửa tất cả curve
   * vi phạm" (một nút duy nhất, trên danh sách) — giữ hành vi sửa
   * toàn spec của đợt 28, nhưng nhãn nay nói rõ là "tất cả" để
   * không ai nhầm với nút sửa từng dòng.
   */
  onFixAllWarnings?: () => void;
  /**
   * Đợt 30 M4: có handler thì mỗi dòng CÓ keyframeIndex hiện thêm nút
   * "Sửa keyframe này" — chỉ sửa đúng keyframe đó (mức keyframe),
   * khác onFixWarning (mức clip: sửa hết vi phạm của clip đó).
   */
  onFixKeyframe?: LoadReportFixHandler;
}

function sourceLabel(source: LoadReport["source"]): string {
  if (source === "autosave") return t("loadReport.sourceAutosave");
  if (source === "archive") return t("loadReport.sourceArchive");
  if (source === "history") return t("loadReport.sourceHistory");
  return t("loadReport.sourceFile");
}

export function LoadReportPanel({ report, onClose, onFixWarning, onFixAllWarnings, onFixKeyframe }: Props) {
  // Subscribe spec để nút định vị luôn khớp project hiện tại (user có
  // thể sửa project rồi mở lại panel — snapshot lúc mở sẽ lỗi thời).
  const spec = useStore((s) => s.spec);
  // Esc đóng panel (cùng quy ước các modal khác trong App).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const locate = (w: SpeedCurveWarning): void => {
    const st = useStore.getState();
    const target = resolveTopLevelClip(w.path, spec);
    if (!target) return;
    st.selectMany([{ trackId: target.trackId, clipId: target.clipId }]);
    st.setPlayhead(target.start);
  };

  const loadedAt = (() => {
    try {
      return new Date(report.loadedAt).toLocaleString();
    } catch {
      return report.loadedAt;
    }
  })();

  return (
    <div className="modal-backdrop">
      <div className="modal" role="dialog" aria-label={t("loadReport.title")}>
        <div className="modal-head">
          <span>
            ⚠️ {t("loadReport.title")} ({report.warnings.length})
          </span>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            title={t("loadReport.close")}
            aria-label={t("loadReport.closeAria")}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: "12px 18px", fontSize: 13, color: "var(--muted)" }}>
          <div>
            {sourceLabel(report.source)} · {t("loadReport.project", { name: report.projectName })} ·{" "}
            {t("loadReport.loadedAt", { at: loadedAt })}
          </div>
          <div style={{ marginTop: 6 }}>{t("loadReport.note")}</div>
          {report.atCap && (
            <div style={{ marginTop: 6 }}>
              {report.overflowCount != null
                ? formatOverflowLine(report.overflowCount, t)
                : t("loadReport.atCap")}
            </div>
          )}
          {onFixAllWarnings && report.warnings.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <button type="button" onClick={onFixAllWarnings}>
                🔧 {t("loadReport.fixAll")}
              </button>
            </div>
          )}
        </div>
        {report.warnings.length === 0 ? (
          <div style={{ padding: "12px 18px", fontSize: 13 }}>
            {t("loadReport.noWarnings")}
          </div>
        ) : (
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: "0 18px 18px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              overflowY: "auto",
            }}
          >
            {report.warnings.map((w, i) => {
              const target = resolveTopLevelClip(w.path, spec);
              const fix = suggestFix(w);
              return (
                <li
                  key={`${w.path}:${w.field}:${w.keyframeIndex ?? "curve"}:${i}`}
                  style={{
                    border: "1px solid var(--border-soft)",
                    borderRadius: 10,
                    padding: "10px 12px",
                    fontSize: 13,
                  }}
                >
                  <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                    <code>{w.field}</code>
                    <strong>
                      {t("loadReport.clip")}: {w.clipId}
                    </strong>
                    {w.keyframeIndex !== null && <span>#{w.keyframeIndex}</span>}
                  </div>
                  <div style={{ marginTop: 4, wordBreak: "break-all" }}>
                    {t("loadReport.path")}: <code>{w.path}</code>
                  </div>
                  <div style={{ marginTop: 4 }}>{resolveWarningMessage(w, (k, vars) => t(k, vars))}</div>
                  <div style={{ marginTop: 4 }}>
                    {t("loadReport.value")}: <code>{formatWarningValue(w.value)}</code>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    {t("loadReport.suggestion")}: {t(fix.key, fix.vars)}
                  </div>
                  <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {target ? (
                      <button type="button" onClick={() => locate(w)}>
                        📍 {t("loadReport.locate")}
                      </button>
                    ) : (
                      <span style={{ color: "var(--muted)" }}>
                        {t("loadReport.locateUnavailable")}
                      </span>
                    )}
                    {onFixWarning && (
                      <button type="button" onClick={() => onFixWarning(w)}>
                        🔧 {t("loadReport.fixLine")}
                      </button>
                    )}
                    {onFixKeyframe && w.keyframeIndex !== null && (
                      <button type="button" onClick={() => onFixKeyframe(w)}>
                        🔧 {t("loadReport.fixKeyframe")}
                      </button>
                    )}
                  </div>
                  {target && target.nestedDepth > 0 && (
                    <div style={{ marginTop: 4, color: "var(--muted)" }}>
                      {t("loadReport.locateNested")}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {(report.structuredNotes.length > 0 || report.otherWarnings.length > 0) && (
          <div style={{ padding: "0 18px 18px", fontSize: 13 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>
              {t("loadReport.otherNotes")}
            </div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {/* Đợt 31 N4: lưu ý có cấu trúc hiện bản dịch theo locale
                  hiện tại (nhóm key `structuredNotes.*`); chuỗi lẻ chưa
                  có dạng cấu trúc giữ nguyên như trước. */}
              {report.structuredNotes.map((n, i) => (
                <li key={`n${i}`}>{formatStructuredNote(n, (k, vars) => t(k, vars))}</li>
              ))}
              {report.otherWarnings.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
