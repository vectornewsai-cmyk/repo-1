# Phase 9 — Đợt 58, luồng O1: Escape đóng WelcomeModal — LIMITS

Ngày: 07/11/2026 (~18:40–18:45 +07, lượt cron 18:35 +07).
Phạm vi: đóng nợ đợt 57 §6.1(a) — phím Escape không đóng được
WelcomeModal (chỉ nút "Để sau" mới đóng; phát hiện harness của luồng
N9 đợt 57, `docs/PHASE9_ROUND57_N9_CLICKTEST_LIMITS.md` §6).
**Chỉ sửa WelcomeModal**, KHÔNG push, KHÔNG tag/release, KHÔNG binary.

## 0. Kết luận tóm tắt

| Hạng mục | Kết luận |
|---|---|
| Nợ 57 §6.1(a) | **Đóng.** Escape nay đóng WelcomeModal trên app thật. |
| Nguyên nhân gốc | `WelcomeModal` không có keydown listener riêng; handler toàn cục của `App.tsx:355` chỉ đóng export/caption/silence/load-report, không có nhánh welcome. |
| Cách sửa | Thêm `useEffect` keydown tự chứa trong `WelcomeModal`, đúng pattern sẵn có của `SceneModal.tsx:80` / `BeatSyncModal.tsx:91` / `LoadReportPanel.tsx:82`. |
| Test tĩnh mới | **9/9 pass** sau sửa; **2/9 trước sửa** (đỏ-trước, 7 check fail đúng thiết kế). |
| Click-test headed | **3/3 pass** sau sửa; **2/3 trước sửa** (E2 fail: modal vẫn mở, `welcomed=null` — tái hiện đúng bug). |
| Hồi quy | `tsc` apps/web **0 lỗi**; `vite build` **pass 13.25s**; test M8 cũ (render SSR WelcomeModal) **7/7 pass**. |
| Focus trap | **Không có** focus trap trong WelcomeModal (grep `focusTrap|trapFocus|useFocusTrap` = 0) nên không có gì để phá. |

## 1. Cách sửa (1 file sản phẩm)

`apps/web/src/components/onboarding/WelcomeModal.tsx` — thêm
`import { useEffect } from "react"` + effect:

```tsx
useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
    const el = e.target as HTMLElement | null;
    if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT")) return;
    if (e.key === "Escape") {
      markWelcomed();
      onClose();
    }
  };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, [onClose]);
```

Ba điểm quyết định, đều đã kiểm chứng:

1. **Escape đi đúng đường đóng của nút** (`markWelcomed()` rồi
   `onClose()`), không chỉ ẩn modal. Nếu chỉ `setWelcomeOpen(false)`
   mà không đánh dấu, modal sẽ mở lại ở lần mount sau (vì
   `App.tsx:75` khởi tạo `welcomeOpen = !isWelcomed()`). Headed sau
   sửa đo được `localStorage vcut-welcomed === "1"`.
2. **Guard bỏ qua INPUT/TEXTAREA/SELECT nhưng KHÔNG chặn BUTTON**
   (quy ước SceneModal/BeatSyncModal). WelcomeModal hiện không có ô
   nhập nào, nhưng guard giữ đúng quy ước và an toàn nếu sau này thêm
   input; Escape vẫn hoạt động khi focus đang ở nút trong modal —
   headed đã focus nút "Để sau" bằng `.focus()` (không click) rồi
   mới gửi Escape.
3. **Cleanup đúng**: `removeEventListener` trong cùng effect, deps
   `[onClose]` (App truyền inline arrow nên effect đăng ký lại khi
   `onClose` đổi, không giữ closure cũ).

Không đụng `App.tsx`: handler toàn cục của App vẫn chạy trước trên
Escape (đóng export/caption/silence/load-report, toàn no-op khi
WelcomeModal mở) và không `stopPropagation`, nên listener của modal
vẫn nhận phím. Không cần thêm nhánh welcome vào App — sửa tự chứa
trong modal là đủ và khớp pattern 3 modal kia.

## 2. Kiểm chứng

### 2.1 Test tĩnh mới — đỏ-trước / xanh-sau

`apps/web/src/lib/welcomeEscape58O1.test.ts` (9 check, chạy bằng
esbuild bundle + node, theo mẫu N1 đợt 57 — repo không có jsdom nên
không mount React độc lập được; xem §4):

| Thời điểm | Kết quả |
|---|---|
| Trước sửa | **2/9 pass** — 7 check fail: thiếu import `useEffect`, thiếu `addEventListener`, thiếu nhánh Escape, thiếu cleanup, thiếu deps `[onClose]`, thiếu guard INPUT/TEXTAREA/SELECT (2 check hồi quy — không chặn BUTTON, nút đóng còn nguyên — pass sẵn theo thiết kế) |
| Sau sửa | **9/9 pass** |

Test khóa: đăng ký listener + nhánh `e.key === "Escape"` + nhánh gọi
`markWelcomed()` trước `onClose()` + cleanup + deps `[onClose]` +
guard input + không chặn BUTTON + nút đóng cũ còn nguyên.

### 2.2 Click-test headed — đỏ-trước / xanh-sau (app thật)

Harness mới `apps/web/scripts/clicktest-58o1-welcome-escape.mjs`
(vite dev + Chromium headed qua Xvfb + CDP, Node thuần, theo mẫu N9
đợt 57; cổng riêng dev 5410/debug 9510, display riêng `:159`,
config tạm tắt HMR `/tmp/round58-o1/vite.o1.config.mjs`, profile
Chrome mới mỗi lần chạy → localStorage trống → modal hiện lúc mount):

| Case | Trước sửa | Sau sửa |
|---|---|---|
| E1 modal hiện trên profile mới | PASS — title "👋 Chào mừng tới VCut Studio", `welcomed=null` | PASS — như trước |
| E2 Escape đóng modal khi focus trong modal + đánh dấu đã chào | **FAIL** — sau Escape: `open=true`, `welcomed=null`, focus vẫn ở BUTTON "Để sau" | **PASS** — sau Escape: `open=false`, `welcomed="1"` |
| E3 0 lỗi trang trong phiên | PASS | PASS |
| **Tổng** | **2/3 (exit 1)** | **3/3 (exit 0)** |

Bằng chứng chạy: `hidden_files/round58-o1/headed/o1-headed-report.json`
+ `o1-before-escape.png` / `o1-after-escape.png` + `o1-vite.log` /
`o1-chrome.log`. Lần chạy sau sửa dọn 1 socket X mồ côi `:159`
(Xvfb cũ đã chết) — harness tự xử lý, không ảnh hưởng kết quả.

### 2.3 Hồi quy

- `tsc --noEmit -p apps/web/tsconfig.json`: **0 lỗi** (log
  `/tmp/round58-o1/tsc.log`, 0 byte).
- `vite build` apps/web: **pass, 13.25s** (cảnh báo chunk >500kB có
  sẵn, không phải do đợt này).
- Test M8 đợt 56 (`onboardingOt56M8.test.ts`, render SSR cả 3 caller
  onboarding): **7/7 pass**.

## 3. Khảo sát modal khác (chỉ ghi nhận, KHÔNG sửa — theo nhiệm vụ)

| Modal | Escape hiện tại |
|---|---|
| `SceneModal.tsx`, `BeatSyncModal.tsx`, `LoadReportPanel.tsx` | Có listener riêng (pattern O1 noi theo) |
| `CaptionModal.tsx`, `SilenceModal.tsx`, `ExportPanel.tsx` | Không có listener riêng, nhưng handler toàn cục của App đóng được (`App.tsx:355-361`) |
| `WelcomeModal.tsx` | **Đã sửa ở đợt này** (trước đây không có đường Escape nào) |
| `TourCard.tsx`, `TemplatePackModal.tsx`, `TemplatePicker.tsx` | **Không có đường Escape nào** — cùng khiếm khuyết như WelcomeModal trước sửa. Ngoài phạm vi O1; nếu đợt sau thống nhất thì làm 3 modal này (TourCard/TemplatePackModal mở từ WelcomeModal nên user gặp ngay sau khi đóng màn chào bằng Escape). |

## 4. Giới hạn trung thực

1. **Test tĩnh, không mount React thật.** Repo không có jsdom trong
   devDeps và `WelcomeModal` kéo cả store/i18n nên không bundle/mount
   độc lập bằng esbuild (cùng lý do test N1 đợt 57 dùng phương pháp
   tĩnh). Hành vi thật được chứng minh bằng click-test headed §2.2
   (Escape thật qua CDP trên app thật), không phải bằng test tĩnh.
2. **Chưa đo Escape khi focus ở backdrop / ngoài modal.** Modal chỉ
   mở khi user ở trong app; focus ngoài modal trong lúc modal mở là
   trường hợp hiếm (backdrop chặn pointer, không có focus trap).
   Listener đăng ký trên `window` nên về lý thuyết vẫn bắt được,
   nhưng chưa có case headed cho trường hợp này.
3. **Chưa click-test nút ✕ / "Để sau" sau sửa** (chỉ khóa bằng test
   tĩnh §2.1 + M8 SSR). Các nút này không đụng tới trong đợt này
   (hàm `close()` giữ nguyên từng byte), rủi ro thấp.
4. **`vite build` tạo `dist/`** trong lúc kiểm chứng — không đưa vào
   batch (chỉ stage file text liệt kê ở §5).

## 5. Nợ mở (cho đợt sau)

1. **TourCard / TemplatePackModal / TemplatePicker chưa đóng bằng
   Escape** (xem §3) — thống nhất pattern cho 3 modal này.
2. **Nợ đợt 57 §6.1(b) vẫn mở:** sau reload, autosave khôi phục spec
   nhưng mất media mẫu (quan sát chưa kết luận của N9) — cần đợt
   riêng verify bằng reload sạch có chủ đích; O1 không đụng tới.
3. Các nợ khác của đợt 57 §6 giữ nguyên (N4 surface skippedReasons,
   N10 timeout keyframe 4K nhiễu, N8 key `captions.translatedTrack`,
   `webglLut.test.ts` lỗi runner có sẵn).

## 6. File đổi/mới (stage, KHÔNG push)

| File | Đổi/mới | Nội dung |
|---|---|---|
| `apps/web/src/components/onboarding/WelcomeModal.tsx` | Sửa | `useEffect` keydown Escape (markWelcomed + onClose), guard input, cleanup |
| `apps/web/src/lib/welcomeEscape58O1.test.ts` | Mới | Test tĩnh 9 check (đỏ-trước 2/9, xanh-sau 9/9) |
| `apps/web/tsconfig.json` | Sửa | Thêm 1 dòng exclude cho test mới (quy ước repo; tổng 146 entry) |
| `apps/web/scripts/clicktest-58o1-welcome-escape.mjs` | Mới | Harness headed E1–E3 (đỏ-trước 2/3, xanh-sau 3/3) |
| `docs/PHASE9_ROUND58_O1_WELCOME_ESCAPE_LIMITS.md` | Mới | Tài liệu này |

Stage: `paths-loop/phase9-round58-o1-welcome-escape.txt` — 5 entry,
NUL cuối, toàn text. KHÔNG push, KHÔNG release/tag. `dist/` (vite
build kiểm chứng) và bằng chứng headed (`hidden_files/round58-o1/`)
không stage theo quy ước.
