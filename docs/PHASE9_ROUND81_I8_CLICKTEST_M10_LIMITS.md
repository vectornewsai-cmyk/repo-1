# Phase 9 — Đợt 81, luồng I8: chạy lại bộ 63r1 M10 sau khi dời pill FPS + kiểm tra install prompt — LIMITS

Ngày: 10/11/2026 (lượt cron 18:35 +07, chạy 11:37–12:37 UTC).
Nhiệm vụ: nợ đợt 80 H9 — chạy lại bộ 63r1 (M10) sau khi pill/panel FPS dời
sang góc dưới-trái ở ≤768px; chạy lại bộ N9 + H9 nếu khả thi; kiểm tra
install prompt PWA ở mức làm được trên VM.
**KHÔNG push, KHÔNG tag/release, KHÔNG binary vào batch.**

## 0. Kết luận tóm tắt

| Hạng mục | Kết luận |
|---|---|
| M10 (mục tiêu chính) | **PASS 2 lần độc lập** (lượt chạy lại 2 và 4 của bộ 63r1) — sau khi sửa 1 bug thật mới do chính lần dời pill H9 gây ra (§2). |
| Bộ 63r1 (16 case) | **Không có lượt nào 16/16 trong một lần chạy duy nhất** — nhưng mọi case đều xanh trong ít nhất một lượt chạy trên cây đã sửa (§1, bảng trung thực). M13 xanh ở probe tập trung (§1.3). |
| Bộ N9 (hồi quy) | **11/11 PASS** (EXIT=0) trên cây hiện tại — không hồi quy thao tác cốt lõi. |
| Install prompt PWA | **5/6 PASS**: `beforeinstallprompt` fire thật, 0 lỗi tiêu chí cài đặt. Phát hiện mới: app **không có UI nào để kích install prompt** (§5, I5). |
| Bug sản phẩm | **1 bug thật mới, đã sửa + kiểm chứng xanh:** panel FPS mobile che nút TopBar "Cắt lặng" (§2). |
| Harness | **1 lỗi harness đã sửa:** `SPEECH_FN` của 63r1 lỗi thời sau khi `/api/tts` đổi sang NDJSON (đợt 80 H8) (§3). Cộng 1 lỗi do chính tay tôi khi sửa nó (§3.2). |
| tsc / vite build | **tsc 0** (sau sửa sản phẩm). **vite build KHÔNG chạy lại** — xem §6. |
| Môi trường | VM quá tải nặng trong lượt này: OOM-kill 1 phiên, CDP timeout 60s hàng loạt, `/tmp` ENOSPC thoáng qua, runtime restart giữa chừng (§7). Các fail M11–M13 ở lượt 3 là do môi trường, không phải sản phẩm. |

## 1. Bộ 63r1 — lịch sử 4 lượt chạy (trung thực, không gộp số)

Harness gốc: `apps/web/scripts/clicktest-63r1-modal-headed.mjs` (vite dev +
Chromium 1254 headed qua Xvfb + CDP, bridge thật, viewport 390×844).
Bằng chứng: `hidden_files/round81-i8/headed/` (lượt 1),
`headed-run2/` (lượt 2), `headed-run3/` (lượt 3), `headed-run4/` (lượt 4),
`headed-m13-standalone/` (probe M13 riêng).

| Case | Lượt 1 (13/16, cây H9 nguyên vẹn) | Lượt 2 (14/16, sau sửa panel) | Lượt 3 (13/16 + lỗi harness, xem §7) | Lượt 4 (14/16 ghi nhận, bị restart giết ở M13) | Probe M13 riêng |
|---|---|---|---|---|---|
| M0 setup | PASS | PASS | PASS | PASS | — |
| M1–M8 (8 modal, pill/panel không đè nút) | PASS ×8 | PASS ×8 | PASS ×8 | PASS ×8 | — |
| M9 toast + tour | PASS (đo đầy đủ) | PASS | PASS | PASS | — |
| **M10 click thật khi panel FPS mở** | **FAIL** (§2) | **PASS** | **PASS** | **PASS** | — |
| M11 Escape lúc translate | FAIL (§3) | FAIL (§3.2) | FAIL (timeout 300s lần 1, CDP timeout lần 2) | **PASS** | — |
| M12 lỗi timeout pack | PASS | PASS | FAIL (CDP timeout, môi trường) | PASS | — |
| M13 phase text en | FAIL (§3) | FAIL (§3.2) | FAIL (CDP timeout, môi trường) | chưa chạy (restart giết) | **PASS** (§1.3) |
| H9 0 lỗi trang | PASS | PASS | (không ghi — harness lỗi trước) | chưa chạy (restart giết) | 0 lỗi (trong probe) |

**Đọc bảng đúng cách:** không có lượt nào đạt 16/16 trong một lần chạy.
Nhưng trên cây đã sửa (panel + SPEECH_FN), từng case đều đã xanh ít nhất
một lần: M0–M12 xanh ở lượt 4 (14 PASS, 0 FAIL trước khi restart giết),
M13 xanh ở probe tập trung. M12 xanh ở lượt 1/2/4 nên fail lượt 3 là do
môi trường, không phải hồi quy sản phẩm.

Chi tiết đáng ghi ở lượt 1 (cây H9 nguyên vẹn, chưa sửa gì thêm):
- M1–M8: **giao nhau pill∩nút = 0px² ở cả 8 modal** (lượt chạy 4 đợt 63
  còn 1996.8 / 655.2 / 682.5px²). Pill mới tại (12, 538) 70.2×44 —
  lần dời H9 **cải thiện** M1–M8, không làm xấu đi.
- M9: y hệt đợt 63 — tour che trọn nút 6776px², toast che 6776px² ~4.5s
  (phát hiện đã biết, chưa sửa).

### 1.1 M10 — kết quả sau sửa (§2)

Lượt 2 và 4 đều PASS với cùng chi tiết: click tại tâm nút chính
"(không còn giao nhau panel-nút)"; sau click modal sang bước running
("Đang phân tích…"); panel FPS vẫn mở phía dưới (`fpsPanelOpen=true`),
click không rơi vào panel. Số đo lượt 4 (`r1-measure-m10-panel-open.json`):
panel 378×140 tại (12, 442), `panelPrimaryOverlap=0`,
`pillPrimaryOverlap=0`, hit tại tâm nút = "🔍 Phân tích khoảng lặng"
(trong dialog).

### 1.2 M11 — kết quả lượt 4 (PASS)

Lần 1: bấm Start → caption chạy 71s → phase "Translating to English
(long videos may take a few minutes)…" → Escape → modal đóng trong 1.5s
(`captionOpen=false`). Các phase đã thấy: "File received, preparing…" |
"Extracting audio…" | "Đang nạp model nhận diện giọng nói (lần đầu có thể
mất vài phút)…" | "Recognizing speech (long videos may take a few
minutes)…" | "Grouping caption lines…" | "Đang nạp model dịch giọng nói
(lần đầu có thể mất vài phút)…" | "Translating to English (long videos
may take a few minutes)…". File TTS 376.364 byte (WAV thật, xem §3).
Bằng chứng: `headed-run4/r1-measure-m11-escape-translate.json`.

### 1.3 M13 — probe tập trung (PASS, EXIT=0)

Vì lượt 4 bị runtime restart giết đúng lúc M13 đang chạy, luồng này chạy
thêm probe chỉ-M13 (`/tmp/round81-i8-m13/m13-only.mjs`, không stage —
script tạm như diag H9): bridge + vite dev + Chrome headed riêng.
Kết quả: caption job tới bước **review sau 73s**, 4 chuỗi en hợp lệ
("File received, preparing…" | "Extracting audio…" | "Recognizing speech
(long videos may take a few minutes)…" | "Grouping caption lines…"),
**0 chuỗi vi bridge** (theo danh sách M13), **0 key thô**,
0 lỗi trang. TTS 376.364 byte. Bằng chứng:
`hidden_files/round81-i8/headed-m13-standalone/m13-standalone-report.json`
+ log `round81-i8/m13-standalone.log`.
Lưu ý trung thực: 2 chuỗi "Đang nạp model…" (tiếng Việt) vẫn xuất hiện
trong lúc job chạy ở locale en — xem nợ mở §8.4 (không nằm trong danh
sách VI_PHASES của M13 nên verdict vẫn PASS, nhưng user en vẫn thấy
tiếng Việt lúc nạp model).

## 2. Bug thật mới #1 — Panel FPS mobile che nút TopBar "Cắt lặng" (ĐÃ SỬA)

- **Triệu chứng (lượt 1, M10 FAIL):** mở panel FPS rồi bấm nút TopBar
  "Cắt lặng" 3 lần, modal "Cắt khoảng lặng" không mở lần nào
  (`openModalTopBar`: "timeout chờ modal mở … sau 3 lần bấm").
- **Chẩn đoán (diag tạm `/tmp/round81-i8/diag-m10.mjs`, đã chạy xong,
  không stage; bằng chứng JSON/screenshot/log đã copy vào
  `hidden_files/round81-i8/diag-m10*.json|png|log`):** panel FPS khi mở
  ở 390px có rect **(12, 289.5)–(390, 582), 378×292.5px** — 10 hàng số
  liệu + 2 ghi chú dài, không giới hạn chiều cao. Mép trên (y≈289.5)
  vắt vào dải nút TopBar (topbar cao 437px ở 390px): giao nhau
  panel∩nút "Cắt lặng" = **2837.3px²** (nút 87.3×44 = 3841px², ~74% bị
  che); tâm nút (267.4, 300) nằm TRONG panel → `elementFromPoint` trả
  về div panel ("📈 FPS preview✕", `inPanel=true`). Click thật tại tâm
  nút → modal không mở (`modalOpen: false`) — tái hiện đúng fail M10.
  Đây là **hệ quả trực tiếp của lần dời H9**: panel ở góc dưới-phải
  (đợt 63) nằm xa TopBar nên M10 xanh; dời sang góc dưới-trái +
  `bottom: 262px` đẩy mép trên panel lên tới y≈290, đúng tầm các hàng
  nút TopBar đã wrap xuống ở màn hẹp. (Bài học: diag lượt đầu của tôi
  còn quên đóng WelcomeModal nên đo sai lần 1 — backdrop che cả pill
  lẫn nút; đã sửa diag rồi đo lại mới ra kết luận trên.)
- **Cách sửa (sản phẩm, tối thiểu):**
  `apps/web/src/components/PerfOverlay.tsx` — panel mobile thêm
  `maxHeight: "140px", overflowY: "auto"` (giữ nguyên `bottom: 262px`
  để không chạm lại tay cầm trim như H9). Mép trên panel nay ≈442
  (dưới đáy topbar 437px ở 390px, hở 5px), chỉ che vùng preview —
  đúng ý đồ H9 ("chỉ che video/letterbox"). Panel vẫn cuộn được trong
  khi mở (overlay chẩn đoán do user mở chủ đích).
- **Kiểm chứng sửa:** diag chạy lại sau sửa — panel 378×140 tại
  (12, 442), click nút "Cắt lặng" → modal mở (`modalOpen: true`,
  backdrop chứa "🔇 Cắt khoảng lặng"); M10 PASS ở lượt 2 và lượt 4
  (xem §1.1). N9 11/11 sau sửa (§4) — không hồi quy desktop.
- **Rủi ro còn lại:** hở chỉ 5px và topbar cao 437px là số đo ở locale
  vi, viewport 390×844. Locale khác / viewport khác có topbar cao hơn
  thì panel có thể chạm lại hàng nút dưới cùng — chưa đo (xem §8.2).
  Hướng chắc hơn cho đợt sau: layout panel mobile gọn lại (bỏ/hide 2
  hàng ghi chú, xếp stat 2 cột) thay vì cuộn trong 140px.

## 3. Lỗi harness — `SPEECH_FN` của 63r1 lỗi thời sau khi `/api/tts` đổi sang NDJSON (ĐÃ SỬA)

- **Triệu chứng (lượt 1, M11 + M13 FAIL cùng một lỗi):** caption báo
  `File "r63-speech.wav" has a .wav extension but its content does not
  match the format (it may be a fake file).` (mã `MAGIC_MISMATCH` —
  validator làm đúng). File TTS chỉ **640 byte** (`reused=false`,
  tạo mới qua bridge).
- **Nguyên nhân:** đợt 80 H8 đổi `POST /api/tts` sang **NDJSON stream**
  (progress thật + `done {downloadUrl}`, `server/bridge/src/index.js:38`
  + `streamTtsResponse`), client phải fetch `downloadUrl`
  (`GET /api/ai-download/:token`) mới lấy được WAV. `SPEECH_FN` của
  63r1 (viết trước H8) vẫn `res.blob()` trực tiếp trên response POST —
  blob thu được là NDJSON text (~640 byte) rồi đặt tên `.wav` → caption
  từ chối đúng. Đây là **lỗi harness lỗi thời, không phải bug sản phẩm**
  (caption validator + bridge đều làm đúng).
- **Cách sửa (harness):** `SPEECH_FN` trong
  `clicktest-63r1-modal-headed.mjs` đọc NDJSON (`res.text()`, tách dòng,
  tìm `type:"done"`), fetch `bridgeUrl + done.downloadUrl`, rồi mới lấy
  blob WAV → `importFiles`. Cập nhật cả comment đầu file.
- **Kiểm chứng sửa:** lượt 3/4 + probe M13 đều tạo file **376.364–
  384.044 byte** (WAV thật); caption job chạy trọn các phase
  (extract → whisper → group → translate-model load); M11 PASS lượt 4,
  M13 PASS probe riêng.
- **§3.2 Lỗi do chính tay tôi khi sửa (§3):** lần sửa đầu dùng
  `ndjson.split("\n")` trong template literal — `"\n"` thành newline
  thật trong code sinh ra → `SyntaxError: Invalid or unexpected token`
  ở cả M11 lẫn M13 lượt 2 (14/16, 2 FAIL đều `HARNESS:`). Đã sửa thành
  `split("\\n")` + kiểm tra cú pháp chuỗi sinh ra bằng `new Function`
  trước khi chạy lượt 3. Bài học: mọi chuỗi JS sinh ra trong harness
  phải kiểm tra cú pháp trước khi chạy lại cả bộ.

## 4. Bộ N9 chạy lại (hồi quy) — 11/11 PASS

`clicktest-57n9-timeline-core-ops.mjs` chạy nguyên vẹn trên cây hiện tại
(display :157, vite dev riêng, không cần bridge): H0 + N1 trim phải
(4→3s) + N2 trim trái + N3 split 6s + N4 delete + N5 box-select (3 clip)
+ N6 undo/redo + N7 multiselect+delete + N8 split rồi undo + N9 split
clip chữ + H9 0 lỗi trang. EXIT=0. Bằng chứng:
`hidden_files/round81-i8/n9-headed/n9-headed-report.json` + log
`round81-i8/n9-harness-run81.log`.
Lưu ý: config vite tắt HMR `/tmp/round57-n9/vite.n9.config.mjs` đã mất
sau reboot (như H9 đã ghi) — đã tạo lại đúng nội dung ở N9 LIMITS §5
trước khi chạy (file `/tmp`, không stage). Script N9 không cần sửa gì
(đường dẫn chromium-1254 từ H9 vẫn đúng).

## 5. Install prompt PWA — 5/6 PASS (probe mới)

Harness mới: `apps/web/scripts/clicktest-81i8-install-prompt.mjs`
(vite preview PROD dist + Chromium 1254 headed qua Xvfb + CDP, viewport
390×844; listener `beforeinstallprompt` đăng ký qua
`Page.addScriptToEvaluateOnNewDocument` TRƯỚC khi navigate để không bỏ
lỡ event; `Page.getInstallabilityErrors` làm căn cứ chéo).
Bằng chứng: `hidden_files/round81-i8/headed-install/i8-install-prompt-report.json`
+ log `round81-i8/i8-install-prompt.log`.

| Case | Kết quả | Chi tiết |
|---|---|---|
| I1 manifest PWA hợp lệ ở PROD | PASS | name="VCut Studio", short_name="VCut", display="standalone", start_url=".", icons 192/512/maskable-512 đều HTTP 200 |
| I2 SW đăng ký + điều khiển trang (PROD) | PASS | scope=http://127.0.0.1:4390/, active=activated, controller=true (đăng ký hơi chậm ~60s dưới tải, vẫn pass) |
| I3 `beforeinstallprompt` fire | PASS | fire lúc 12:20:54Z, gần như ngay khi tải trang, `platforms=["web"]` — Chrome coi app là installable; event đã `preventDefault` nên không hiện mini-infobar trong lúc đo |
| I4 `Page.getInstallabilityErrors` | PASS | **0 lỗi** tiêu chí cài đặt |
| I5 app có đường UI kích install prompt | **FAIL (phát hiện)** | Không có nút/link nào nhắc "Cài đặt/Install/Add to Home Screen" trong DOM lúc mount (0 khớp); grep tĩnh: không có `beforeinstallprompt`/`appinstalled` nào trong `apps/web/src`. App đủ tiêu chí cài đặt nhưng **không có UI tự giới thiệu cài đặt** — user chỉ cài được qua menu trình duyệt (Chrome ⋮ → "Install VCut…" / biểu tượng cài đặt ở omnibox) |
| H9 0 lỗi trang | PASS | Không có `window.onerror`/`unhandledrejection` trong phiên PROD |

**Giới hạn của probe này (ghi rõ, không bịa):** chỉ đo trên Chromium
desktop giả lập viewport 390×844 (`mobile: true` nhưng vẫn là Chrome
desktop) — **máy thật chưa test**: "Add to Home Screen" trên
iOS/Android thật, chạm vào prompt thật, prompt sau khi user đã từ chối,
và mini-infobar sau khi tương tác đều CHƯA test. Dist dùng cho probe
build 09:50 UTC (trước fix panel I8) nhưng manifest/SW/icons không đổi
từ H9 nên kết luận installability không bị ảnh hưởng. Nợ H9 §6.2
"install prompt chưa test" nay đã đóng ở mức VM; phần máy thật vẫn mở.

## 6. Kiểm chứng khác

- `tsc --noEmit -p apps/web/tsconfig.json`: **0 lỗi** (sau sửa
  `PerfOverlay.tsx`; chạy 210s do VM tải nặng; không in lỗi nào).
- `vite build`: **KHÔNG chạy lại** trong luồng này — cố ý: dist đang
  được các luồng đợt 81 khác build/preview song song, build chen vào
  có thể làm nhiễu dist của họ; thay đổi duy nhất là 1 dòng inline
  style (không import mới, không đổi type) và tsc đã xanh. Ghi rõ để
  đợt gộp quyết: nên build lại trước khi push.
- `r6-i18n-check` / P7 / css60 / css61: **không chạy** — luồng này
  không đổi i18n key, class CSS hay dict (chỉ inline style
  `maxHeight`/`overflowY` trong component đã có class
  `perf-fps-panel`); không có cơ sở để các suite đó đỏ vì luồng này.
- Không kiểm lại TTS 39 / pip-audit / Gradio (cấm, theo lệ).

## 7. Môi trường chạy + sự cố (trung thực)

- VM 4 vCPU, không GPU; Chromium `~/.cache/ms-playwright/chromium-1254`
  (Chrome for Testing 158.0.8127.18), headed qua Xvfb, display riêng
  mỗi lượt (63r1 tự chọn :176–:195; N9 :157; install :210; diag :220;
  M13 riêng :176).
- **Lượt 3 (12:02–12:16 UTC):** M11 lần 1 timeout 300s đúng lúc đang
  nạp model dịch (đã thấy đủ phase tới "Original captions done —
  starting translation…"); sau đó M11 lần 2, M12, M13, H9 lần lượt
  `CDP.send timeout 60s: Runtime.evaluate` — renderer không phản hồi
  >60s; phiên exec của tôi bị **OOM-kill** (`oom_kills: 1`, cgroup
  6GB) — bridge + vite + Chrome + model TTS (~0.86GB) + whisper +
  translate cùng lúc, đúng lúc các luồng đợt 81 khác (I1 stress
  vidstab, I4 sweep, I7 webkit…) cũng chạy nặng. Harness ghi EXIT=2,
  không có report JSON. Các fail này là **môi trường, không phải sản
  phẩm**: M12 xanh ở lượt 1/2/4 với cùng code; M11 xanh ở lượt 4.
- **`/tmp` ENOSPC thoáng qua** trong lượt 3: bridge log nhiều dòng
  `[rate-limit] … ENOSPC: no space left on device` (chỉ ảnh hưởng
  persist rate-limit, không chặn job). Lúc kiểm tra `/tmp` (tmpfs
  512MB) còn 361MB trống — có luồng khác đã lấp đầy rồi giải phóng.
- **Runtime restart giữa lượt 4** (VM reboot, uptime về 1 phút lúc
  12:32 UTC): giết harness đúng lúc M13 đang chạy (đã tới bước file
  TTS sẵn sàng, `reused=true`); `/tmp` bị xóa sạch (cả config N9,
  diag, vite config — harness 63r1 tự tạo lại config của nó nên không
  sao; bằng chứng đã copy sang `hidden_files` nên còn nguyên). Lượt 4
  ghi nhận 14 PASS / 0 FAIL trước khi chết; M13 hoàn tất bằng probe
  riêng §1.3.
- Tải VM lúc chạy: load 0.76–14.82 dao động mạnh theo các luồng khác;
  RAM trống 0.9–2.4GB. Các lượt chạy lại tốn thời gian chủ yếu ở nạp
  model (TTS ~65–110s, caption whisper + translate ~70–300s).

## 8. Giới hạn trung thực / nợ mở

1. **Không có lượt 63r1 nào 16/16 trong một lần chạy** trên cây cuối —
   xem bảng §1. Mọi case đều xanh ít nhất một lần, nhưng parent/đợt
   sau muốn một report 16/16 duy nhất thì cần chạy lại cả bộ lúc VM
   rảnh (ít luồng song song).
2. **Panel FPS mobile chỉ đo ở 390×844, locale vi** — hở 5px dưới đáy
   topbar; locale khác / viewport khác (360px, 430px, landscape) chưa
   đo; panel ở desktop không đổi (không đo lại desktop cho panel).
3. **Install prompt chưa test máy thật** (§5): iOS/Android thật, chạm
   vào prompt thật, prompt sau từ chối, mini-infobar — đều chưa test.
4. **Phát hiện mới (chưa sửa): app không có UI cài đặt PWA** (I5) —
   cần quyết product: có nên thêm nút/banner "Cài đặt app" dùng
   `beforeinstallprompt` đã bắt được hay không. Ngoài phạm vi luồng
   này (chỉ đo, không thêm tính năng).
5. **Phát hiện mới (chưa sửa): chuỗi phase "Đang nạp model…" vẫn là
   tiếng Việt ở locale en** — M11/M13 đều thấy "Đang nạp model nhận
   diện/dịch giọng nói (lần đầu có thể mất vài phút)…" trong lúc locale
   en. Không nằm trong danh sách VI_PHASES của M13 nên verdict M13
   vẫn PASS, nhưng user en vẫn thấy tiếng Việt lúc nạp model — cần
   localize phase nạp model ở bridge (ngoài phạm vi luồng này).
6. **Nợ cũ còn nguyên (đã biết từ đợt 63):** tour-card che trọn nút
   chính modal 6776px² trong lúc tour mở (M9 tái hiện y hệt); TemplatePicker
   thiếu `role="dialog"`; SceneModal có phase chưa localize; file mẫu
   mau-1.webm không có track audio.
7. **Chưa test cảm ứng thật / Safari iOS / Chrome Android thật** —
   mọi case đều là chuột CDP trên Chromium desktop giả lập viewport.

## 9. File đổi/mới (stage, KHÔNG push)

| File | Đổi/mới | Nội dung |
|---|---|---|
| `apps/web/src/components/PerfOverlay.tsx` | Sửa | Panel mobile kẹp `maxHeight: 140px` + `overflowY: auto` (§2) + comment ghi lại bug |
| `apps/web/scripts/clicktest-63r1-modal-headed.mjs` | Sửa | `SPEECH_FN` đọc NDJSON `/api/tts` + fetch WAV qua `downloadUrl` (§3); sửa escape `\\n` (§3.2); cập nhật comment đầu file |
| `apps/web/scripts/clicktest-81i8-install-prompt.mjs` | Mới | Harness headed probe install prompt: I1–I5 + H9 (§5) |
| `docs/PHASE9_ROUND81_I8_CLICKTEST_M10_LIMITS.md` | Mới | Tài liệu này |

Stage: `paths-loop/phase9-round81-i8-clicktest-m10.txt` — 4 entry,
NUL cuối, toàn text, verify read-back 4/4. KHÔNG push, KHÔNG release/tag.
Không stage: `dist/` (build artifact), bằng chứng trong
`hidden_files/round81-i8/` (report JSON, log, screenshot), script diag
tạm + probe M13 riêng trong `/tmp` (đã mất sau reboot; evidence JSON
đã ở `hidden_files`), config vite N9 trong `/tmp` (tạo lại được từ
N9 LIMITS §5).
