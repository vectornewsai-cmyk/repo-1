/**
 * WelcomeModal — màn chào lần đầu mở app (R1, Phase 9).
 *
 * Hiện khi: App thấy localStorage chưa có `vcut-welcomed`. Đóng bằng bất kỳ nút
 * nào cũng đánh dấu đã chào (mở lại bằng nút “👋 Bắt đầu” trên TopBar).
 * Chuỗi lấy từ lib/onboardingCopy (không động vào i18n/vi.json, en.json).
 */
import { useStore } from "../../store";
import { ot } from "../../lib/onboardingCopy";

export const WELCOMED_KEY = "vcut-welcomed";

export function isWelcomed(): boolean {
  try {
    return localStorage.getItem(WELCOMED_KEY) === "1";
  } catch {
    return true; // không có localStorage → không chặn user bằng màn chào
  }
}

export function markWelcomed(): void {
  try {
    localStorage.setItem(WELCOMED_KEY, "1");
  } catch {
    /* bỏ qua */
  }
}

interface Props {
  onClose: () => void;
  onOpenTour: () => void;
  onOpenPack: () => void;
}

export function WelcomeModal({ onClose, onOpenTour, onOpenPack }: Props) {
  const st = useStore.getState();
  const close = () => {
    markWelcomed();
    onClose();
  };
  return (
    <div className="modal-backdrop" onClick={close}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={ot("welcome.title")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h3>{ot("welcome.title")}</h3>
          <button type="button" className="icon-btn" onClick={close} aria-label={ot("pack.close")}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <p className="muted">{ot("welcome.lead")}</p>
          <div>
            <b>{ot("welcome.step1Title")}</b>
            <p className="muted">{ot("welcome.step1Body")}</p>
          </div>
          <div>
            <b>{ot("welcome.step2Title")}</b>
            <p className="muted">{ot("welcome.step2Body")}</p>
          </div>
          <div>
            <b>{ot("welcome.step3Title")}</b>
            <p className="muted">{ot("welcome.step3Body")}</p>
          </div>
          <div className="btn-row" style={{ flexWrap: "wrap" }}>
            <button
              type="button"
              className="primary"
              onClick={() => {
                close();
                void st.loadSample();
              }}
            >
              {ot("welcome.sample")}
            </button>
            <button
              type="button"
              onClick={() => {
                markWelcomed();
                onOpenPack();
              }}
            >
              {ot("welcome.pack")}
            </button>
            <button
              type="button"
              onClick={() => {
                markWelcomed();
                onOpenTour();
              }}
            >
              {ot("welcome.tour")}
            </button>
            <button
              type="button"
              onClick={() => {
                close();
                st.newProject();
              }}
            >
              {ot("welcome.blank")}
            </button>
            <button type="button" onClick={close}>
              {ot("welcome.later")}
            </button>
          </div>
          <p className="muted small">{ot("welcome.reopen")}</p>
        </div>
      </div>
    </div>
  );
}
