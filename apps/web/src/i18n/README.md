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
Chưa dịch (vẫn tiếng Việt hardcode): Inspector panels, Timeline labels, CaptionModal/SilenceModal/SceneModal/ExportPanel nội dung chi tiết, thông báo lỗi. Hạ tầng đã sẵn — dịch dần theo nhu cầu.
