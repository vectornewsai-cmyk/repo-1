# Phase 9 đợt 63, luồng R10 — Đóng nợ đợt 62 §4 mục 10 + 11 (docs/quyết định): LIMITS

Ngày: 08/11/2026 (lượt cron 09:35 +07).
Phạm vi: CHỈ docs/quyết định còn lại của đợt 62 — xóa nhánh chết
`warnTooShort`, review EN template vòng 2 (N5), ghi rõ N6, cập nhật
ma trận FEATURE_STATUS + kiểm tra link docs, rà lại `ci-security.yml`
local. KHÔNG push, KHÔNG tag/release, KHÔNG binary, KHÔNG sửa
`vi.json`/`en.json` trực tiếp. Mọi số dưới đây đều chạy/đo thật; chỗ
chưa đo được thì ghi rõ, không mạo nhận.

## 0. Kết luận tóm tắt

| Hạng mục (nợ đợt 62) | Quyết định / kết quả |
|---|---|
| (1) `warnTooShort` nhánh chết qua UI | **QUYẾT ĐỊNH: XÓA nhánh + key.** Nhánh đã xóa khỏi `SpeedPanel.tsx`; test hồi quy mới **5/5** (bất biến `newDur >= 0.2` bằng hàm thật + quét 0 tham chiếu). Key `speed.warnTooShort` còn trong dict chờ **parent xóa lúc gộp** (không sửa dict trực tiếp) — test orphan Q4 + P7 đỏ chờ gộp với ĐÚNG 1 key này (xem §1.4). |
| (2) N5: EN template chưa qua người bản ngữ | **Rà soát xong toàn bộ 285 chuỗi EN template + 46 chuỗi EN text preset.** Sửa **3 câu** (fragment mới `round63-r10.json`, đã nối vào helper, test **6/6**; N5 **10/10**, M7 **10/10**). **KHÔNG claim "chuẩn bản ngữ"** — chỉ sửa câu sai/tự nhiên rõ ràng; 4 câu còn nghi ngờ liệt kê ở §2.2. |
| (3) N6: hoán đổi delta stts vẫn lọt | **Giữ nguyên quyết định cũ, không đào lại.** Đã ghi rõ vào LIMITS này (§3) + thêm §8 vào file LIMITS N6 (`docs/PHASE9_ROUND57_N6_SPS_VUI_LIMITS.md`). Không có bằng chứng mới ở các LIMITS đợt 58–62. |
| (4) Docs index + FEATURE_STATUS | **Cập nhật 8 điểm** (Transitions MCP 82/82, Enhance preview xấp xỉ, i18n 1972→2146, M3 13/13, 30 class CSS đã sửa, Save/Load R7 28/28, Proxy R10, Speed warnTooShort). **Link docs: 0 hỏng** (14 link nội bộ kiểu inline + 7 chuỗi ngoặc vuông kiểm tra tay đều không phải link). |
| (5) `ci-security.yml` 403 chưa lên GitHub | **KHÔNG push file.** File local đúng cú pháp, khớp repo — TRỪ 1 lệch: thiếu bước pip-audit cho `server/tracking/requirements.txt` (file thứ 5, đã pin `==`). **Đã thêm bước này vào file local** + cập nhật SECURITY.md §4.1 (4→5). Vẫn chờ user cấp quyền workflows. |
| Kiểm chứng | Test mới + hồi quy liên quan xanh (xem §6); `vite build` pass 66 s; `tsc` repo-wide còn **2 lỗi của 2 luồng đợt 63 khác (R6/R7)** — không phải file của luồng này, không sửa giùm (xem §6.3). |

## 1. `warnTooShort` — QUYẾT ĐỊNH XÓA (không giữ làm phòng thủ)

### 1.1 Vì sao xóa chứ không giữ

Đợt 62 R10 đã chứng minh nhánh chết qua UI bằng đo headed thật (E3):
srcLen 0,5 s → slider max 2,5, preset 4× disabled, kéo slider lên max →
speed 2,5, duration đúng 0,2, KHÔNG warn. Luồng này chứng minh thêm
bằng **chuỗi lập luận đầy đủ + test khóa bằng hàm thật** (không chỉ dựa
vào một lần đo):

1. `applySpeed` kẹp `raw` về `sliderMax` **trước** khi tính duration
   (`SpeedPanel.tsx`: `clampSpeed(Math.min(raw, sliderMax))`).
2. `sliderMax = min(4, max(0.25, srcLen / 0.2))` nên với mọi clip thật,
   `s <= srcLen / 0.2` → `newDur = srcLen / s >= 0.2`.
3. `clampSpeed` là kẹp thuần min/max, **không làm tròn lên**
   (`packages/video-spec/src/speed.ts:299-302`).
4. Preset `p > sliderMax` bị `disabled`; slider `max` attr làm tròn 2
   chữ số có thể nhỉnh hơn `sliderMax` một chút, nhưng `Math.min`
   trong `applySpeed` kẹp lại — đường này cũng đã khóa trong test.
5. Tiền đề `srcLen >= 0.05`: trim kẹp `duration >= 0.2` (`store.ts`
   `Math.max(0.2, ...)` ở 2 chỗ) và speed trong [0,25, 4] nên
   `srcLen = duration × speed >= 0.05`. Biên `srcLen = 0.05` cho
   `newDur` đúng 0,2 (test khóa, §1.3). Sai số float ~1e-16, nhỏ hơn
   nhiều so với epsilon 1e-9 của nhánh cũ.
6. Giữ làm "phòng thủ" không có giá trị: nhánh chỉ tới được nếu gọi
   `applySpeed` trực tiếp với giá trị vượt `sliderMax` — không có
   đường UI nào làm vậy (`applySpeed` là hàm nội bộ component, chỉ
   slider onChange + preset onClick gọi). Một cảnh báo không bao giờ
   hiện là code chết + key i18n mồ côi chờ ngày gây nhầm lẫn.

### 1.2 Việc đã làm

- `apps/web/src/components/speed/SpeedPanel.tsx` — xóa khối
  `if (newDur < MIN_CLIP_DURATION - 1e-9) { setWarn(...warnTooShort...); return; }`
  (8 dòng) + cập nhật comment header (bỏ câu "hoặc làm duration < 0.2s")
  + comment quyết định tại `applySpeed` (không nhắc tên key bằng chuỗi
  literal — để test quét 0 tham chiếu không vấp chính comment này).
  `MIN_CLIP_DURATION` vẫn dùng cho `sliderMax`; nhánh `warnOverlap` /
  `warnResetOverlap` (còn sống) không đụng.
- Test hồi quy mới
  `apps/web/src/components/speed/speedWarnTooShortDead63R10.test.ts`
  — **5/5 pass** (runner chuẩn `scripts/run-node-test.mjs`):
  1. Quét `apps/web/src` (trừ file test + dict): **0 tham chiếu**
     `warnTooShort`.
  2. `SpeedPanel.tsx`: nhánh đã xóa, kẹp `Math.min(raw, sliderMax)` +
     `warnOverlap`/`warnResetOverlap` còn nguyên.
  3. Bất biến bằng hàm THẬT (`clampSpeed` + `durationForSpeed` từ
     `@repo-1/video-spec`): 12 giá trị srcLen (0,05–3600) × 11 giá trị
     raw (0,1–10) → mọi `newDur >= 0.2 - 1e-9`.
  4. Biên: `srcLen = 0.05` → `sliderMax = 0.25`, `newDur` đúng 0,2
     (cả raw 4 kẹp về 0,25 lẫn raw 0,25).
  5. Tiền đề: `store.ts` còn kẹp `Math.max(0.2,` ở trim — nếu tiền đề
     này đổi, bất biến phải đánh giá lại.
- Chuỗi `warnTooShort` còn lại trong repo là **cố ý giữ**: dict
  `vi.json`/`en.json` (chờ parent xóa, §1.4), harness headed đợt 62
  R10 (`apps/web/scripts/clicktest-62r10-headed-gaps.mjs` — hồ sơ
  bằng chứng E3) và các file `*_LIMITS.md` (lịch sử quyết định). Test
  (1) chỉ quét `apps/web/src` nên không chạm tới chúng.

### 1.3 Hồi quy speed/sticker/subtitle liên quan — xanh

- Speed cùng thư mục: `speedCurveBlock62R2`, `speedcurveTrim`,
  `speedcurveH3`, `splitPatch` — xanh (chạy chung batch "tất cả xanh",
  xem §6.1).
- Subtitle: `subtitles.test.ts`, `captionsExport59P5` 7/7,
  `captionsTrack58O5` 12/12 — xanh.

### 1.4 Việc parent CÒN PHẢI làm lúc gộp (luồng này KHÔNG làm)

1. Xóa key `speed.warnTooShort` khỏi **cả hai** dict
   (`apps/web/src/i18n/vi.json:523` và `en.json:523` — giá trị vi
   "Không thể đặt {s}× — clip sẽ ngắn hơn {min}s. Cắt đoạn nguồn dài
   hơn trước." / en "Cannot set {s}× — the clip would be shorter than
   {min}s. Trim a longer source segment first.").
2. Cập nhật test khóa số key: `apps/web/src/lib/i18nOrphans60Q4.test.ts`
   đang assert **2146 key lá** → sau xóa key là **2145** (cả vi lẫn en;
   số key vi==en giữ 50 — key này vi khác en nên không đổi số đó).
3. Sau 2 bước trên, 2 test đang đỏ chờ gộp sẽ xanh lại (xem §6.2):
   - `i18nOrphans60Q4.test.ts`: hiện **15/16** — chỉ case "orphan"
     đỏ với ĐÚNG 1 key mồ côi `speed.warnTooShort` (đã chạy lại sau
     khi xóa nhánh; dict-count 2146 vẫn xanh vì chưa đụng dict).
   - `i18nAudit59P7.test.ts`: hiện **5/8** — case "orphan" đỏ với
     ĐÚNG 1 key `speed.warnTooShort`; 2 case còn lại đỏ do thay đổi
     của luồng R7 đợt 63 (xem §6.3, không phải của luồng này).

## 2. N5 — Review EN template vòng 2 (follow-up đợt 57)

### 2.1 Phạm vi đã rà soát (đọc hết, không mẫu)

| Nhóm chuỗi EN | Nguồn | Số lượng | Kết quả |
|---|---|---|---|
| Tên/mô tả 50 template | Fragment `round56-m7.json` (100 giá trị) + 5 override `round57-n5.json` = giá trị hiệu dụng | 100 | **Sửa 3** (§2.2) |
| Nhãn placeholder form | Fragment `round57-n5.json` (180 key `.label`) | 180 | **0 sửa** — đọc hết 180 nhãn, đều tự nhiên |
| Text preset (text animation picker) | Dict `textanim.opt.*` label/desc (22 animation × 2) + `textanim.demo`/`textanim.note` trong `vi.json`/`en.json` | 46 | **0 sửa** — 46/46 tự nhiên, đúng ngữ pháp |
| File CSS `assets/text-presets/` (96 file) | — | 0 chuỗi EN | Không có chuỗi EN hiển thị nào trong UI web (không file nào trong `apps/web/src` tham chiếu tới thư mục này; chỉ `server/render/src/textAnimParity.js` + docs nhắc tới). Chuỗi EN của text preset chính là nhóm `textanim.*` ở trên. |

Tổng: **326 chuỗi EN hiệu dụng đã đọc** (100 tên/mô tả + 180 nhãn +
46 textanim; 5 override N5 đã tính trong 100 hiệu dụng). Không dùng
máy dịch, không claim "chuẩn bản ngữ": chỉ sửa câu sai/tự nhiên rõ ràng.

### 2.2 Ba câu đã sửa (fragment mới `round63-r10.json`)

| Key | Trước (M7/N5) | Sau (R10) | Lý do |
|---|---|---|---|
| `templatePack.album-teaser.description` | "Square cover art + album name + release date." | "Square video: cover art + album name + release date." | Mảnh câu thiếu danh từ chính ("Square cover art + ...") — 48/50 mô tả còn lại mở đầu bằng cụm danh từ ("Square video...", "Landscape..."); thêm "video:" cho song song. VI gốc cũng là mảnh câu nhưng VI ngoài phạm vi đợt này. |
| `templatePack.audiobook-promo.description` | "Square cover art + book title + narrator." | "Square video: cover art + book title + narrator." | Cùng mẫu mảnh câu như trên. |
| `templatePack.tiktok-viral.name` | "Vertical TikTok" | "Vertical TikTok Video" | "TikTok" là tên nền tảng, không phải video — "Vertical TikTok" đọc như tên chuyên mục/tài khoản; thêm "Video" cho rõ nghĩa. VI gốc "TikTok dọc" dịch sát nghĩa nên EN cũ trung thành với VI, nhưng EN tự nhiên hơn khi có "Video". |

Cách triển khai (theo đúng mẫu N5):
- Fragment mới `apps/web/src/i18n/fragments/round63-r10.json` —
  `{meta, vi: {}, en: {3 key}}`; chỉ đè 3 key en, **không thêm key
  mới** (dict vẫn 2146), không sửa vi, không đụng `round56-m7.json` /
  `round57-n5.json`.
- `apps/web/src/lib/templateContentLocale.ts` — import fragment R10,
  TABLE merge theo thứ tự m7 < n5 < r10 (r10.en thắng khi trùng key)
  + ghi chú header. Không đổi logic helper.
- Test N5 (`templateContentLocale57N5.test.ts`) cập nhật theo đúng thay
  đổi có chủ đích: thêm `CORRECTED_EN_R10` + case (a2) khóa 3 giá trị
  mới, case "95 giá trị không đổi" → **"92 giá trị"** (100 − 5 N5 − 3
  R10). Không sửa test M7 (6 pack của M7 không chứa template nào trong
  3 template sửa nên không ảnh hưởng).
- Test mới `apps/web/src/lib/templateEnReview63R10.test.ts` — **6/6**:
  fragment đúng 3 key en/0 key vi/đúng từng chữ/đều là override key cũ;
  helper en trả đúng 3 bản sửa; helper vi không đổi; 5 giá trị N5 +
  mẫu 10 giá trị M7 không drift; mẫu nhãn placeholder không đổi;
  TEMPLATES không đột biến. N5 **10/10**, M7 **10/10** (chạy lại sau
  nối fragment).

### 2.3 Câu còn nghi ngờ — KHÔNG sửa (ghi để đợt sau / chủ nội dung quyết)

1. `templatePack.charity-appeal.description` — "… + bank account
   number." Trung thành với VI gốc ("số tài khoản") nhưng template
   không có placeholder nào cho số tài khoản (chỉ field/message/cta)
   → mô tả có thể gây hiểu lầm ở cả hai ngôn ngữ. Đây là vấn đề nội
   dung VI, không phải lỗi dịch — cần chủ nội dung quyết, không tự sửa.
2. Nhãn `food-reel.placeholder.clip3` "Scene 3 (closing)" vs
   `tiktok-viral.placeholder.clip3` "Scene 3 (ending)" — không nhất
   quán, nhưng VI gốc cũng khác nhau ("chốt" vs "kết") nên EN trung
   thành; thống nhất là quyết định nội dung VI.
3. `templatePack.gym-transformation.placeholder.result.label` =
   "Result" — mơ hồ ở cả hai ngôn ngữ (VI "Kết quả"); dịch trung
   thành, không phải lỗi dịch.
4. `templatePack.lofi-visual.name` = "Relaxing Lofi Music" — "Lofi"
   (vs "Lo-Fi") là cách viết stylized phổ biến của tên thể loại; giữ.
5. (Đã kiểm tra lại 5 giá trị N5 đã sửa: "Audiobook Promo",
   "Product Unboxing", "Vertical 3-step tutorial: one scene and step
   text per step.", "Landscape video inviting viewers to a webinar:
   speaker + topic + time.", charity-appeal desc — đều ổn, không sửa
   thêm.)

## 3. N6 — Hoán đổi delta stts vẫn lọt (giữ nguyên, không đào lại)

Quyết định gốc ở `docs/PHASE9_ROUND57_N6_SPS_VUI_LIMITS.md` §3 (đợt 57,
luồng N6) vẫn đứng nguyên, không có gì mới để đổi:

- Hoán đổi delta giữ nguyên multiset nên giữ nguyên tổng thời lượng,
  median, mode, trung bình — mọi thống kê mà guard (a)–(d) dùng
  (kể cả fps VUI, một số vô hướng cho cả file) đều không đổi; test
  khóa cả hai dạng (hoán đổi khối `[[30,1500],[30,500]]` và hoán đổi
  xen kẽ `[1500,500]×30`) đều `validateSampleTimestamps → ok`.
- Kiểm hình dạng delta đã đánh giá kỹ và KHÔNG thêm: không có cơ sở
  hiệu chuẩn (trong repo không có file VFR thật nào — 17/17 CFR,
  `maxAdjRatio = 1,00`); mẫu pulldown 3:2 hợp lệ `[500,750]×30` cũng
  xen kẽ 100% ở tỉ lệ 1,5× nên ngưỡng naive sẽ chặn oan; chỉ bắt được
  MỘT dạng con của nợ (không bắt được hoán đổi khối).
- Các LIMITS đợt 58–62 nhắc lại nợ này nguyên văn ("Nợ cũ chưa đụng")
  mà không ghi thêm bằng chứng mới; không có thay đổi nào ở
  `validateSampleTimestamps` / `parseSpsVuiTiming` làm quyết định cũ
  lỗi thời. (Luồng này không quét lại toàn bộ file video trong repo —
  chỉ đối chiếu các LIMITS đợt 58–62.)
- Hướng bắt được trong tương lai (vẫn chưa làm): đối chiếu SEI
  `pic_timing` từng frame với stts (§3.2 của LIMITS N6) — cần đọc NAL
  SEI từ byte sample + xử lý khi SEI vắng (fail-open).
- Đã thêm §8 vào `docs/PHASE9_ROUND57_N6_SPS_VUI_LIMITS.md` (ghi chú
  đợt 63 R10, trỏ về LIMITS này) để các đợt sau không đào lại.

## 4. Docs index + FEATURE_STATUS

### 4.1 Ma trận FEATURE_STATUS — 8 điểm đã cập nhật

Đối chiếu LIMITS đợt 62 (§4) + quyết định đợt 63 R10 với
`docs/FEATURE_STATUS.md` (mốc cũ: đợt 61 R10):

| Hàng | Trước (sai/trễ) | Sau | Nguồn |
|---|---|---|---|
| Transitions — MCP | "⚠️ apply_transition (chưa kiểm tra lại tập type mới 81)" | "✅ apply_transition 82/82 qua tool thật (81 type + none)" + Tests "MCP R8 19/19" | Đợt 62 R8: schema đủ 82 entry, 82/82 apply pass, 8/8 từ chối type lạ |
| Video effects — Preview | "sharpen/noise chưa kiểm chứng lại parity" | "sharpen XẤP XỈ (công thức đúng ở full-res); noise LỆCH-THỐNG-KÊ (render YUV vs preview RGB)" | Đợt 62 R8 (đính chính kết luận "KHỚP" cũ) |
| Enhance — Preview | "❌ render-only, preview chưa áp" | "✅ xấp xỉ ở preview (denoise→blend/blur, stabilize→zoom crop, bật mặc định)" + Tests "Q1 16/16 vi+en" | Đợt 60 Q1 (`preview.tsx` `enhancePreviewSource`, `lib/enhancePreview.ts`); đợt 62 R3 chuyển denoise sang blend |
| Enhance — ghi chú 9 | "Còn thiếu: preview chưa áp enhance." | "Preview nay ÁP enhance ở mức xấp xỉ… Còn thiếu: preview enhance chỉ là xấp xỉ" | Như trên |
| i18n — ghi chú 10 + mục đếm | "1972 key lá"; "M3 đỏ sẵn 7/13" | "**2146 key lá** (2044 + 102 fragment đợt 62: R2 2 + R5 91 + R7 9)"; "M3 nay xanh **13/13** (chạy lại đợt 63 R10)" | Đếm lại trên đĩa 08/11 (2146); M3 chạy lại 13/13 (§6.1) |
| Modal/Escape — ghi chú 12 | "còn 30 class thật chưa định nghĩa ngoài phạm vi" | "30 class CSS thật chưa định nghĩa đã SỬA ở đợt 60 Q2 (bắt 1 bug cascade `.tts-box`)"; "53 class scoped-only kiểm chứng xong ở đợt 61 R4"; "`.tbtn-label` đo headed đợt 62 R10: 1280 ẩn 9/9, 1440 hiện 9/9, biên 1360 ẩn / 1361 hiện" | Đợt 60 Q2, đợt 61 R4, đợt 62 R10 |
| Save/Load — Tests | "projectRepo 10/10, rehydrate 27/27, loadProject K1" | Thêm "sổ tham chiếu liên project R7 28/28 (lib) + headed 5/5" | Đợt 62 R7 |
| Proxy — Tests | "Q8 + R3 §8.3, I9" | Thêm "nút proxy bấm thật headed (đợt 62 R10: tạo proxy 720p sau 2509 ms, ffprobe 1280×720 đúng)" | Đợt 62 R10 §5.2 |
| Speed — Tests | "speed-demo.js 7/7" | Thêm "R10 E1–E6 headed vi/en…; nhánh cảnh báo 'clip quá ngắn' đã XÓA ở đợt 63 R10 vì chết qua UI" | Đợt 62 R10 §6 + §1 ở trên |
| Header mốc | Mốc đợt 61 R10 | Thêm khối "Cập nhật 08/11/2026 — đợt 62 closing + đợt 63 R10 (docs)" tóm tắt toàn bộ đổi trên | — |
| CI/CD (mục "Những gì CHƯA có") | "5 file workflow… chưa lên được GitHub (403)" | Thêm: R10 rà lại `ci-security.yml` local + lệch tracking đã sửa local, vẫn chờ cấp quyền | §5 |

Không đổi: số kho khác (template 50, text preset 96, sticker 244,
font 59, sound 1043, LUT 174, transitions 81, MCP 29 tools) — đã đối
chiếu, vẫn đúng. Nợ "nút text CaptionModal dùng `.tbtn` tràn/chồng chữ
(ROUND59 §6.2)" giữ nguyên là nợ mở — chưa đo lại ở đợt 62–63, không
mạo nhận đã hết (phép đo `.tbtn-label` của R10 là nhãn nút toolbar,
không phải nút CaptionModal).

### 4.2 Kiểm tra link docs — 0 hỏng

- Phương pháp: script Python quét link inline kiểu `[text](url)` trong
  `docs/*.md` + `README.md`/`ARCHITECTURE.md`/`INSTALL.md`/`SECURITY.md`,
  đối chiếu file đích tồn tại trên đĩa (bỏ qua http/mailto/anchor).
- Kết quả: **14 link nội bộ, 0 hỏng** (README 12 link đều OK).
- Kiểm tra thêm link kiểu tham chiếu `[text][ref]`: 7 chuỗi ngoặc vuông
  trong các LIMITS cũ (`[A][B]`, `[NAL bytes]`, `[Ok][Cancel]`,
  `["fetchImpl"]`) — kiểm tra tay từng chỗ, tất cả đều là ký hiệu
  filter FFmpeg / bố cục byte / nút dialog X11 / cú pháp TypeScript,
  KHÔNG phải link. Không có file docs index riêng (`docs/INDEX.md`
  không tồn tại) — "docs index" thực tế là các link docs trong README
  + LIMITS docs-index của đợt 61 R10; README trỏ đủ 5 file docs chính
  (USER_GUIDE, DEVELOPER, ROADMAP, FEATURE_STATUS).
- Không sửa link nào (không có link hỏng để sửa).

## 5. `ci-security.yml` — rà lại local (KHÔNG push)

File local `~/workspace/repo-1/.github/workflows/ci-security.yml` vẫn
chưa lên GitHub (403 "Resource not accessible by integration" — App
thiếu quyền workflows:write; xem MEMORY/đợt 62 §4.11). Luồng này KHÔNG
push file, chỉ kiểm tra:

- **YAML parse: OK** (PyYAML; key `on:` parse thành `True` theo YAML
  1.1 — quirk của parser, không phải lỗi file). Trigger: push main,
  PR, cron thứ 2 03:00 UTC.
- **npm-audit job khớp repo:** root workspaces (`package-lock.json`
  có) + `mcp-server` + `cli` (cả hai `package-lock.json` đều có);
  workspaces root là `apps/*, packages/*, server/*` nên mcp-server/cli
  ngoài workspaces — quét riêng là đúng. Node 20 khớp `engines >= 20`.
- **pip-audit job — PHÁT HIỆN 1 LỆCH:** workflow cũ chỉ quét **4**
  requirements (caption, tts, reframe, bgremove) nhưng repo có **5**
  file requirements thật: thêm `server/tracking/requirements.txt`
  (numpy==2.5.4, opencv-python-headless==5.0.0.93 — đều pin `==`,
  dùng cho `server/tracking/track.py`, motion tracking Phase 8 Q5).
  File này tồn tại từ Phase 8 Q5 nhưng workflow (viết ở Phase 6 K4)
  không được cập nhật theo.
- **Đã sửa file local:** thêm bước `pip-audit — tracking` vào job
  `pip-audit` + cập nhật comment header (4→5 requirements). Verify
  lại bằng script: YAML parse OK, cả 5 requirements + 3 lockfile đều
  tồn tại, pin tracking đều có `==`.
- **Không lệch khác:** Python 3.12 trong workflow vẫn hợp lệ cho audit
  (numpy 2.2.6 / rembg 2.0.60 đều hỗ trợ 3.12; ghi chú "bgremove chạy
  venv Python 3.10" chỉ áp dụng lúc CHẠY code, không áp dụng lúc audit
  pin). Action versions checkout@v4 / setup-node@v4 / setup-python@v5
  là major hiện hành.
- `SECURITY.md` §4.1 cập nhật theo (4→5 requirements + ghi chú tracking
  thêm ở đợt 63 R10; viết lại câu cho đúng ngoặc).
- **Vẫn chờ user cấp quyền workflows** cho App rồi mới lên được GitHub;
  repo vẫn không có CI nào chạy thật. Lần push đầu cần theo dõi log
  (ghi chú cũ trong SECURITY.md vẫn đúng).

## 6. Kiểm chứng tổng hợp

### 6.1 Test xanh (chạy bằng `scripts/run-node-test.mjs`, từ gốc repo)

| Suite | Kết quả |
|---|---|
| Mới `speedWarnTooShortDead63R10.test.ts` | **5/5** |
| Mới `templateEnReview63R10.test.ts` | **6/6** |
| `templateContentLocale57N5.test.ts` (đã cập nhật 92 + a2) | **10/10** |
| `templateContentLocale56M7.test.ts` | **10/10** |
| `i18nAudit56M3.test.ts` (M3) | **13/13** |
| Speed hồi quy: `speedCurveBlock62R2`, `speedcurveTrim`, `speedcurveH3`, `splitPatch` | xanh (batch "tất cả xanh") |
| Subtitle: `subtitles.test.ts`, `captionsExport59P5` 7/7, `captionsTrack58O5` 12/12 | xanh |
| i18n count: `i18nRound57N4` 14/14, `structuredNotes32` 12/12 | xanh |
| `vite build` (apps/web) | **pass, 66 s** (chỉ cảnh báo chunk >500 kB có sẵn + dynamic-import userLut có sẵn) |

### 6.2 Test đỏ CHỜ GỘP (do thay đổi của luồng này — đã nêu ở §1.4)

| Suite | Kết quả | Nguyên nhân (đúng 1 key) |
|---|---|---|
| `i18nOrphans60Q4.test.ts` | **15/16** | Case "orphan" đỏ: `['speed.warnTooShort']` — key còn trong dict chờ parent xóa. Dict-count 2146 vẫn xanh. |
| `i18nAudit59P7.test.ts` | **5/8** | Case "orphan" đỏ: `['speed.warnTooShort']` (như trên). 2 case còn lại đỏ do R7 — xem §6.3. |

### 6.3 Test / tsc đỏ do LUỒNG ĐỢT 63 KHÁC (không phải file của luồng này — không sửa giùm)

- `tsc --noEmit -p apps/web/tsconfig.json`: exit 2, **2 lỗi** —
  `apps/web/src/lib/decoderPlayback63R6.test.ts:130` (R6, TS2353
  `'src' does not exist in type 'PreviewClipKeyLike'`) và
  `apps/web/src/lib/projectRepo.ts:28` (R7, TS5097 import
  `"./projectId63R7.ts"` — thiếu `allowImportingTsExtensions`).
  Cả hai file đều do luồng song song đợt 63 sửa trong lúc luồng này
  chạy (mtime 02:48–02:56 UTC 08/11). **0 lỗi trong file của luồng
  này** (không lỗi nào nhắc tới SpeedPanel / templateContentLocale /
  test mới / fragment). Lỗi TS6133 ở `bridgeErrors62R5.test.ts` mà đợt
  62 R10 ghi nhận đã hết (parent sửa ở bước gộp đợt 62).
- `i18nAudit59P7.test.ts` 2 case còn lại (scan + trKey): đỏ vì R7 thêm
  literal VI "File chưa có mã project ổn định — đã tạo mã mới, lưu lại
  file để giữ mã này." + key mới `projectRepo.projectIdMigrated` chưa
  vào dict trong `lib/projectRepo.ts`.
- `saveToast31.test.ts`: **14 pass, 1 fail** — case `buildLoadReport`
  đỏ vì cùng literal R7 trên lọt vào `otherWarnings`.
- Hệ quả: `npm run build` của apps/web (`tsc && vite build`) hiện bị
  chặn ở bước tsc bởi 2 lỗi trên; `npx vite build` chạy riêng vẫn pass
  (§6.1). Parent gộp cần xử lý R6/R7 trước khi claim tsc 0.

## 7. File đổi/thêm (text, không binary — parent gộp batch, KHÔNG push)

ĐỔI (production):

- `apps/web/src/components/speed/SpeedPanel.tsx` — xóa nhánh cảnh báo
  "clip quá ngắn" (8 dòng) + cập nhật comment header/`applySpeed`.
- `apps/web/src/lib/templateContentLocale.ts` — import + merge fragment
  R10 vào TABLE (m7 < n5 < r10) + ghi chú header.
- `apps/web/src/lib/templateContentLocale57N5.test.ts` — thêm
  `CORRECTED_EN_R10` + case (a2), case "95 giá trị" → "92 giá trị".

ĐỔI (docs/workflow):

- `docs/FEATURE_STATUS.md` — 8 điểm §4.1.
- `docs/PHASE9_ROUND57_N6_SPS_VUI_LIMITS.md` — thêm §8 (ghi chú R10).
- `.github/workflows/ci-security.yml` — thêm bước pip-audit tracking.
- `SECURITY.md` — §4.1: 4→5 requirements + viết lại câu.

MỚI:

- `apps/web/src/components/speed/speedWarnTooShortDead63R10.test.ts` — 5 test (§1.2).
- `apps/web/src/i18n/fragments/round63-r10.json` — 3 key en sửa (§2.2).
- `apps/web/src/lib/templateEnReview63R10.test.ts` — 6 test (§2.2).
- `docs/PHASE9_ROUND63_R10_DOCS_DEAD_BRANCH_LIMITS.md` — LIMITS này.

KHÔNG ĐỔI: `apps/web/src/i18n/vi.json` / `en.json` (chờ parent xóa
key lúc gộp — §1.4), `round56-m7.json` / `round57-n5.json`,
`apps/web/scripts/clicktest-62r10-headed-gaps.mjs` (hồ sơ E3),
`dist/` (vite build kiểm chứng) không stage. Không sửa file của luồng
đợt 63 khác (R6/R7) dù chúng đang đỏ.

## 8. Nợ mở / rủi ro dư (không mạo nhận đã xong)

1. **Parent gộp:** xóa key `speed.warnTooShort` khỏi cả hai dict +
   cập nhật test khóa số key 2146→2145 (§1.4); kiểm tra xung đột file
   chung với các luồng đợt 63 khác đang chạy song song (R1/R3/R6/R7 —
   luồng này không chạm file của họ, nhưng họ có thể chạm file chung
   như `projectRepo.ts`, `preview.tsx`).
2. **tsc 2 lỗi + 3 test case đỏ của R6/R7** (§6.3) — thuộc luồng khác,
   parent gộp xử lý; không claim tsc 0 cho tới khi chúng được sửa.
3. **N5 vẫn chưa qua người bản ngữ:** vòng review 2 này là review của
   một agent (đọc kỹ 326 chuỗi), không phải người bản ngữ; 4 câu nghi
   ngờ ở §2.3 vẫn mở. Muốn "chuẩn bản ngữ" thật cần người bản ngữ đọc
   lại — không claim đã đạt.
4. **N6 vẫn lọt khi SPS không có VUI timing** (fail-open) + hoán đổi
   delta vẫn lọt hoàn toàn (§3) — hướng SEI `pic_timing` vẫn chưa làm.
5. **`ci-security.yml` vẫn chờ cấp quyền workflows** (§5) — repo vẫn
   không có CI chạy thật; bước tracking mới thêm cũng chưa chạy thật
   trên GitHub.
6. **Nợ đợt 62 chưa đụng trong luồng này** (giữ nguyên từ LIMITS đợt
   62 §4): FPS blend đo lại lúc VM yên (R3); trần worker 30 s cho
   keyframe 42–64 MiB (R4); sổ tham chiếu trùng tên project (R7);
   Escape lúc CaptionModal running ở bước translate chưa đo (R10);
   phase text caption chưa localize theo locale; lỗi timeout pack nằm
   dưới fold modal.
