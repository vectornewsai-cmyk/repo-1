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

// Mirror của TEXT_ANIMATIONS/TEXT_ANIMATION_META trong
// packages/video-spec/src/textfx.ts — định nghĩa local để component
// build được độc lập. Khi parent tích hợp textfx.ts vào index.ts của
// @repo-1/video-spec, đổi import này thành:
//   import { TEXT_ANIMATION_META, TEXT_ANIMATIONS, type TextAnimation } from "@repo-1/video-spec";
export type TextAnimation =
  | "none" | "fadeUp" | "fadeIn" | "slideInLeft"
  | "slideInRight" | "slideUp" | "bounce" | "typewriter";

const TEXT_ANIMATIONS: readonly TextAnimation[] = [
  "none", "fadeUp", "fadeIn", "slideInLeft",
  "slideInRight", "slideUp", "bounce", "typewriter",
];

const TEXT_ANIMATION_META: Record<TextAnimation, { label: string; description: string }> = {
  none: { label: "Không", description: "Hiện ngay, không hiệu ứng" },
  fadeUp: { label: "Mờ + trồi lên", description: "Hiện dần, trồi lên 30px" },
  fadeIn: { label: "Mờ dần vào", description: "Độ trong suốt 0 → 100% trong 0.8s" },
  slideInLeft: { label: "Trượt từ trái", description: "Chữ trượt từ ngoài mép trái vào" },
  slideInRight: { label: "Trượt từ phải", description: "Chữ trượt từ ngoài mép phải vào" },
  slideUp: { label: "Trượt từ dưới lên", description: "Chữ trượt từ dưới màn hình lên" },
  bounce: { label: "Nảy", description: "Chữ rơi từ trên xuống, nảy nhẹ rồi đứng yên" },
  typewriter: { label: "Gõ từng chữ", description: "Hiện từng ký tự như đang gõ máy" },
};

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
};

export function TextAnimPicker({ value, onChange }: TextAnimPickerProps) {
  return (
    <div className="textfx-picker">
      <div className="textfx-grid">
        {TEXT_ANIMATIONS.map((anim) => {
          const meta = TEXT_ANIMATION_META[anim];
          const selected = value === anim;
          return (
            <button
              key={anim}
              className={`textfx-card${selected ? " selected" : ""}`}
              onClick={() => onChange(anim)}
              title={meta.description}
            >
              <span className={`textfx-demo ${PREVIEW_CLASS[anim]}`}>Chữ</span>
              <span className="textfx-label">{meta.label}</span>
            </button>
          );
        })}
      </div>
      <p className="textfx-note">
        Minh họa CSS — hiệu ứng thật được render bằng FFmpeg khi xuất video.
      </p>
    </div>
  );
}
