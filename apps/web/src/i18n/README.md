# i18n — Đa ngôn ngữ cho VCut Studio

Hạ tầng dịch thuật tối giản (R1-107), không dùng thư viện ngoài.

## Cách dùng

```tsx
import { t, useLang, setLang } from "./i18n";

// Trong component: gọi useLang() để re-render khi đổi ngôn ngữ
function MyButton() {
  useLang();
  return <button title={t("topbar.play")}>{t("topbar.playShort")}</button>;
}

// Đổi ngôn ngữ (lưu vào localStorage)
setLang("en");
```

Biến trong chuỗi: `t("topbar.undoWith", { label: "Xoá clip" })`.

## Thêm chuỗi mới

1. Thêm key vào `vi.json` **và** `en.json` (cùng cấu trúc lồng nhau).
2. Dùng `t("section.key")` trong component, nhớ gọi `useLang()` trong component đó.

## Phạm vi hiện tại

Đã dịch: TopBar, màn hình splash, MediaBin, nút đóng modal (`common.*`).
Q2 Phase 8: Inspector chính + Timeline chính đã dịch xong (`inspector.*` 85 keys,
`timeline.*` 28 keys, cả vi lẫn en; xem `Q2_LIMITS.md` trong `src/lib/`).
Chưa dịch (vẫn tiếng Việt hardcode): các sub-panel nhúng trong Inspector
(TransitionPanel, SpeedPanel, KeyframePanel/KeyframeGraph, ChromaPanel,
BgRemovePanel, TextAnimPicker, LutPicker, ColorAdjustPanel, EffectPanel,
StickerPanel, AudioFxPanel, MaskPanel, FontPicker, SceneModal, TtsButton),
lý do từ chối drop trong `lib/drop.ts`, CaptionModal/SilenceModal/ExportPanel
nội dung chi tiết, thông báo lỗi. Hạ tầng đã sẵn — dịch dần theo nhu cầu.
