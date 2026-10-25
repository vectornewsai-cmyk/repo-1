/**
 * TourCard — tour 5 bước trong editor (R1, Phase 9).
 *
 * Nhẹ, không chặn user: 1 thẻ nổi góc dưới phải, bấm Tiếp/Bỏ qua bất kỳ lúc
 * nào. Mỗi bước highlight khu vực tương ứng bằng [data-tour] (media, timeline,
 * add-text, inspector, export); nếu panel đang đóng (vd: mobile chưa mở sheet)
 * thì chỉ hiện hướng dẫn, không lỗi, không kẹt.
 * Hoàn thành tour → ghi `vcut-tour-done` (chỉ để thống kê, không dùng để chặn).
 */
import { useEffect, useState } from "react";
import { ot } from "../../lib/onboardingCopy";

export const TOUR_DONE_KEY = "vcut-tour-done";

const STEPS = [
  { target: "media", titleKey: "tour.step1Title", bodyKey: "tour.step1Body" },
  { target: "timeline", titleKey: "tour.step2Title", bodyKey: "tour.step2Body" },
  { target: "add-text", titleKey: "tour.step3Title", bodyKey: "tour.step3Body" },
  { target: "inspector", titleKey: "tour.step4Title", bodyKey: "tour.step4Body" },
  { target: "export", titleKey: "tour.step5Title", bodyKey: "tour.step5Body" },
] as const;

export function TourCard({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [targetFound, setTargetFound] = useState(true);

  useEffect(() => {
    // dọn highlight cũ rồi highlight mục tiêu của bước hiện tại
    document.querySelectorAll(".tour-highlight").forEach((el) => el.classList.remove("tour-highlight"));
    const target = document.querySelector(`[data-tour="${STEPS[step].target}"]`);
    if (target) {
      target.classList.add("tour-highlight");
      target.scrollIntoView({ block: "nearest", behavior: "smooth" });
      setTargetFound(true);
    } else {
      setTargetFound(false);
    }
    return () => {
      document.querySelectorAll(".tour-highlight").forEach((el) => el.classList.remove("tour-highlight"));
    };
  }, [step]);

  const finish = () => {
    try {
      localStorage.setItem(TOUR_DONE_KEY, "1");
    } catch {
      /* bỏ qua */
    }
    onClose();
  };

  const cur = STEPS[step];
  const last = step === STEPS.length - 1;
  return (
    <div className="tour-card" role="dialog" aria-label={ot("tour.title")}>
      <div className="tour-head">
        <b>
          {ot("tour.title")} · {step + 1}/{STEPS.length}
        </b>
        <button type="button" className="icon-btn" onClick={onClose} aria-label={ot("pack.close")}>
          ✕
        </button>
      </div>
      <div className="tour-body">
        <b>{ot(cur.titleKey)}</b>
        <p className="muted">{ot(cur.bodyKey)}</p>
        {!targetFound && <p className="warn">{ot("tour.targetMissing")}</p>}
      </div>
      <div className="btn-row">
        {step > 0 && (
          <button type="button" onClick={() => setStep(step - 1)}>
            {ot("tour.prev")}
          </button>
        )}
        {!last && (
          <button type="button" className="primary" onClick={() => setStep(step + 1)}>
            {ot("tour.next")}
          </button>
        )}
        {last && (
          <button type="button" className="primary" onClick={finish}>
            {ot("tour.done")}
          </button>
        )}
        <button type="button" onClick={onClose}>
          {ot("tour.skip")}
        </button>
      </div>
    </div>
  );
}
