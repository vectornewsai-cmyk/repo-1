/**
 * TextAnimPicker — Grid chọn hiệu ứng chữ cho text clip.
 *
 * Controlled component: { value, onChange }.
 * Mỗi ô có preview CSS minh họa (ghi rõ "minh họa" — preview thật
 * cần parent cập nhật preview.tsx).
 *
 * Tích hợp vào Inspector (1 dòng, parent agent làm):
 *   import { TextAnimPicker } from "./components/textfx";
 *   <TextAnimPicker value={clip.style.animation ?? "none"}
 *     onChange={(v) => st.patchTextStyle(track.id, clip.id, { animation: v })} />
 */
import "./textfx.css";
import { t as i18nT, useLang } from "../../i18n";

// Mirror của TEXT_ANIMATIONS/TEXT_ANIMATION_META trong
// packages/video-spec/src/textfx.ts — định nghĩa local để component
// build được độc lập. Khi parent tích hợp textfx.ts vào index.ts của
// @repo-1/video-spec, đổi import này thành:
//   import { TEXT_ANIMATION_META, TEXT_ANIMATIONS, type TextAnimation } from "@repo-1/video-spec";
export type TextAnimation =
  | "none" | "fadeUp" | "fadeIn" | "slideInLeft"
  | "slideInRight" | "slideUp" | "bounce" | "typewriter"
  | "slideInDown" | "popIn"
  | "fadeOut" | "fadeOutUp" | "slideOutRight" | "slideOutDown"
  | "wave" | "blink" | "shake" | "fadeInOut"
  | "tiltIn" | "skewIn" | "slideReveal" | "curtainIn";

const TEXT_ANIMATIONS: readonly TextAnimation[] = [
  "none", "fadeUp", "fadeIn", "slideInLeft",
  "slideInRight", "slideUp", "bounce", "typewriter",
  "slideInDown", "popIn",
  "fadeOut", "fadeOutUp", "slideOutRight", "slideOutDown",
  "wave", "blink", "shake", "fadeInOut",
  // Phase 9 đợt 10 V4 (render ASS) — đợt 11 P4 đưa vào picker + i18n.
  "tiltIn", "skewIn", "slideReveal", "curtainIn",
];

// R6: nhãn + mô tả chuyển qua i18n (textanim.opt.<anim>.label/.desc)
// để đổi ngôn ngữ — dữ liệu cũ hardcode tiếng Việt đã dời vào vi/en.json.


export interface TextAnimPickerProps {
  /** animation đang chọn */
  value: string;
  /** (animation) => void */
  onChange: (anim: TextAnimation) => void;
}

/** Class CSS preview cho từng animation. */
const PREVIEW_CLASS: Record<TextAnimation, string> = {
  none: "tx-prev-none",
  fadeUp: "tx-prev-fadeUp",
  fadeIn: "tx-prev-fadeIn",
  slideInLeft: "tx-prev-slideInLeft",
  slideInRight: "tx-prev-slideInRight",
  slideUp: "tx-prev-slideUp",
  bounce: "tx-prev-bounce",
  typewriter: "tx-prev-typewriter",
  slideInDown: "tx-prev-slideInDown",
  popIn: "tx-prev-popIn",
  fadeOut: "tx-prev-fadeOut",
  fadeOutUp: "tx-prev-fadeOutUp",
  slideOutRight: "tx-prev-slideOutRight",
  slideOutDown: "tx-prev-slideOutDown",
  wave: "tx-prev-wave",
  blink: "tx-prev-blink",
  shake: "tx-prev-shake",
  fadeInOut: "tx-prev-fadeInOut",
  tiltIn: "tx-prev-tiltIn",
  skewIn: "tx-prev-skewIn",
  slideReveal: "tx-prev-slideReveal",
  curtainIn: "tx-prev-curtainIn",
};

export function TextAnimPicker({ value, onChange }: TextAnimPickerProps) {
  useLang();
  return (
    <div className="textfx-picker">
      <div className="textfx-grid">
        {TEXT_ANIMATIONS.map((anim) => {
          const selected = value === anim;
          return (
            <button
              key={anim}
              className={`textfx-card${selected ? " selected" : ""}`}
              onClick={() => onChange(anim)}
              title={i18nT(`textanim.opt.${anim}.desc`)}
            >
              <span className={`textfx-demo ${PREVIEW_CLASS[anim]}`}>{i18nT("textanim.demo")}</span>
              <span className="textfx-label">{i18nT(`textanim.opt.${anim}.label`)}</span>
            </button>
          );
        })}
      </div>
      <p className="textfx-note">
        {i18nT("textanim.note")}
      </p>
    </div>
  );
}
