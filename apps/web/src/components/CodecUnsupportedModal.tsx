/**
 * CodecUnsupportedModal.tsx — Phase 9 đợt 75, luồng C6 (đóng nợ đợt 74
 * §4: nối codecProbe vào UI).
 *
 * Vấn đề: đợt 74 B3 chỉ báo codec không hỗ trợ bằng 1 toast lúc import
 * (tự đóng sau 4,5 s) + cờ `unsupportedCodec` trên MediaItem mà KHÔNG
 * chỗ nào trong UI render — toast trôi qua là user mất dấu vết, không
 * biết phải làm gì với file đó (đổi định dạng? dùng bản desktop? xuất
 * có được không?).
 *
 * Modal này mở từ badge cảnh báo trên thẻ media (MediaBin): giải thích
 * bằng tiếng người (không nói "codec" suông), nêu 2 cách xử lý thật —
 * đổi định dạng sang MP4/H.264, hoặc tạo proxy 720p để xem trước
 * (proxy chuyển mã sang H.264 nên trình duyệt phát được; export vẫn
 * dùng file gốc) — và ghi rõ xuất file vẫn dùng được (FFmpeg đọc được
 * codec này). Không tự làm gì thêm: chỉ thông tin + đóng.
 *
 * Chỉ dùng class CSS đã có (modal-backdrop / modal / modal-head /
 * modal-body / modal-actions / mini-btn / icon-btn) nên không cần thêm
 * CSS; backdrop click + nút ✕ để đóng. Đợt 76 D8 thêm Escape đóng
 * modal (đóng nợ đợt 75 C6 §4 mục 6 — lúc đó cố tình chưa thêm vì
 * Escape cho modal là phần luồng C9; nay theo đúng pattern tự chứa
 * của SceneModal/BeatSyncModal/WelcomeModal, đợt 58 O1).
 */
import { useEffect } from "react";
import { t } from "../i18n";

export function CodecUnsupportedModal({
  name,
  codecLabel,
  onClose,
}: {
  name: string;
  codecLabel: string;
  onClose: () => void;
}) {
  // Đợt 76 D8 — Escape đóng modal, cùng pattern tự chứa của
  // SceneModal/BeatSyncModal/WelcomeModal (đợt 58 O1): listener keydown
  // trên window, bỏ qua INPUT/TEXTAREA/SELECT, gọi đúng đường đóng của
  // nút ✕ (onClose). Handler Escape toàn cục ở App.tsx chỉ đóng các
  // modal của App (export/caption/silence/loadReport) nên không xung
  // đột — modal này render trong MediaBin, không thuộc App.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT")) return;
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-label={t("mediabin.codecDetailTitle")}
        data-testid="codec-unsupported-modal"
      >
        <div className="modal-head">
          <span>⚠️ {t("mediabin.codecDetailTitle")}</span>
          <button
            className="icon-btn"
            onClick={onClose}
            aria-label={t("common.close")}
            data-testid="codec-unsupported-close"
          >
            ✕
          </button>
        </div>
        <div className="modal-body">
          <p className="warn" style={{ margin: "0 0 10px", lineHeight: 1.5 }}>
            {t("mediabin.codecDetailBody", { name, codec: codecLabel })}
          </p>
          <ul style={{ margin: "0 0 10px", paddingLeft: 18, lineHeight: 1.6 }}>
            <li>{t("mediabin.codecDetailConvert")}</li>
            <li>{t("mediabin.codecDetailProxy")}</li>
          </ul>
          <p className="muted" style={{ margin: 0, lineHeight: 1.5 }}>
            {t("mediabin.codecDetailExportNote")}
          </p>
        </div>
        <div className="modal-actions">
          <button className="mini-btn" onClick={onClose} data-testid="codec-unsupported-ok">
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
