# Phase 9 đợt 32 (luồng P6) — Blur dip đa cấu hình + xác minh D7 autosave — LIMITS

> CHUYỂN HƯỚNG ĐÃ GHI NHẬN: lượt này thực chất là đợt 33, không phải
> 32. Đợt 32 đã có luồng O6 làm đúng mảng này
> (`docs/PHASE9_ROUND32_O6_BLUR_D7_LIMITS.md`). Vì vậy luồng này
> KHÔNG sửa lại D7, KHÔNG claim lại fix của O6, KHÔNG đụng bất kỳ
> file nào của O6. Việc của luồng này chỉ có hai phần: (a) xác minh
> độc lập fix D7 của O6 còn nguyên + test xanh, (b) thực thi lưới
> blur của O6 bằng phương pháp kiểm chứng được ở tầng compositing
> (không có live-browser nên MAD headed vẫn CHƯA ĐO — xem §3.5).
> KHÔNG push, KHÔNG tag/release, KHÔNG binary vào repo. Tên file
> giữ `ROUND32_P6` theo lệnh parent (parent sẽ stage đợt này dưới
> tên đợt 33).

## 0. Kết luận ngắn (đọc trước khi trích)

**D7 — ĐÃ XÁC MINH ĐỘC LẬP, fix O6 còn nguyên.** `loadAutosave()`
trong `apps/web/src/lib/projectRepo.ts` vẫn chứa đúng dòng fix của
O6 (ghi lại spec đã chuẩn hóa khi `textStyleFixes.length > 0`).
Test khóa O6 chạy lại: **6/6**. Hồi quy liên quan: projectRepo
10/10, nested22 7/7, round26J5 15/15, textStyle27K1 6/6,
transitionPreview 31/31, saveToast31 15/15 (xem §1.2 về điểm khác
với ghi chú 14/15 của O6). Luồng này KHÔNG sửa một dòng code sản
phẩm nào.

**Blur — lưới compositing 270 ô, TẤT CẢ KHỚP ở tầng làm tròn.**
Phương pháp: mô phỏng đúng pipeline compositing của app
(`motionBlurBlendPlan` + source-over canvas 8-bit từng bước vẽ +
`singleClipDipPixel` + làm tròn cuối, đều là code/hàm sản phẩm
thật) so với kỳ vọng trung bình có trọng số trực tiếp độc lập,
trên frame FFmpeg thật 270×480, vùng mẫu 15%–85%, step 8.
Kết quả: **270/270 KHỚP**, maxDiff ≤ 1 ở mọi ô, MAD tệ nhất
0,3747 (K19, IN, fadegrays, p=0,5, weights [1,1,2]). Đây là bằng
chứng compositing blend + dip giữ đúng trung bình có trọng số ở
mọi p/mode/weights đã đo — KHÔNG phải MAD browser, KHÔNG phải MAD
app-vs-xfade-FFmpeg, và KHÔNG thay thế đặc tả chạy headed của O6
§3.5 (vẫn cần parent chạy trong main chat).

**Cảnh báo tsc (không phải của luồng này, không giấu):** `tsc`
trong `apps/web` hiện báo **1 lỗi** ở `src/lib/mp4Demux.ts:95`
(biến `view` khai báo không dùng, thuộc file của luồng đợt 32
khác — xem §1.3). Vì vậy không được trích "tsc 0" cho cây hiện
tại; lỗi này nằm ngoài phạm vi P6 và luồng này không tự sửa file
của luồng khác.

## 1. Phần O6 đã làm + phần P6 xác minh (tách rõ, không nhận vơ)

### 1.1 O6 đã làm (tóm tắt từ LIMITS của O6, không phải việc P6)

- D7 autosave: quy kết chắc chắn cho `loadAutosave()` trong
  `projectRepo.ts` (cổng load + lớp ghi đều vô can, chỉ thiếu bước
  ghi lại sau khôi phục); fix 1 dòng có điều kiện
  `textStyleFixes.length > 0`; test khóa `textStyle32O6D7` 6/6.
- Blur: lưới kỳ vọng + phân tích độ nhạy/suy biến từng ô, chứng
  minh blend plan = trung bình có trọng số (sai số float ~1,4e-14),
  lượng hóa sai số harness nếu tái dùng kỳ vọng /3 cho weights
  không đều; MAD browser thật cho các ô mới: CHƯA ĐO (subagent
  không có live-browser) + đặc tả chạy browser §3.5 cho parent.

### 1.2 P6 xác minh độc lập D7 (chạy lại, không sửa code)

| Kiểm chứng | Kết quả P6 chạy lại |
|---|---|
| `textStyle32O6D7.test.ts` (khóa O6: lớp 1, 2, 3, 3b, không ghi thừa, null) | **6 pass, 0 fail** |
| `projectRepo.test.ts` | 10 pass, 0 fail |
| `projectRepoNested22.test.ts` | 7 pass, 0 fail |
| `projectRepoRound26J5.test.ts` | 15 pass, 0 fail |
| `textStyle27K1.test.ts` | 6 pass, 0 fail |
| `transitionPreview.test.ts` | 31 pass, 0 fail |
| `saveToast31.test.ts` (chạy từ gốc repo) | **15 pass, 0 fail** |
| Đối chiếu code fix O6 (`projectRepo.ts`, quanh dòng ghi lại sau `parseProjectText` trong `loadAutosave`) | Còn nguyên, đúng điều kiện `textStyleFixes.length > 0`, kèm comment giải thích đường App.tsx |

Điểm khác với ghi chú của O6 (ghi rõ, không giấu): O6 báo
saveToast31 14/15 do assertion stale ở test "blob trong nested
không được quét". P6 chạy lại từ gốc repo được **15/15** — tức
assertion đó hiện không còn fail trong cây này (có thể một luồng
đợt 32 khác đã cập nhật test hoặc hành vi quét; P6 không đụng
test đó nên không tự kết luận ai đổi — parent gộp đối chiếu).
Lưu ý chạy test: chạy từ gốc repo, vì chạy từ `apps/web` sẽ
lỗi ENOENT đường dẫn i18n (không phải lỗi test).

### 1.3 tsc hiện tại: 1 lỗi ngoài phạm vi (không sửa, không giấu)

- Lệnh: `npx tsc --noEmit` trong `apps/web` (đúng cách O6 dùng).
- Lỗi duy nhất: `src/lib/mp4Demux.ts(95,3): error TS6133: 'view'
  is declared but its value is never read` (tham số `view` của
  `findBox` không dùng).
- File này thuộc công việc reverse/WebCodecs của luồng đợt 32
  khác (được nhắc trong `PHASE9_ROUND32_P4_STRUCTURED_NOTES_LIMITS.md`,
  import bởi `reverseWebcodecs.ts`), không phải file O6, không
  phải file P6. P6 không sửa vì lệnh chuyển hướng cấm ghi đè việc
  của luồng khác. Hệ quả: parent không được gộp với claim "tsc 0"
  cho tới khi chủ file đó sửa (chỉ cần bỏ tham số thừa hoặc dùng
  `_view` — nhưng đó là việc của chủ file, P6 không làm thay).

## 2. Blur: phương pháp P6 (cái gì được đo, cái gì không)

### 2.1 Pipeline "app" mô phỏng — đúng code sản phẩm, trừ draw canvas

Thứ tự đúng như `preview.tsx`: blur composite trước, dip sau.

1. **Blur:** CHÍNH `motionBlurBlendPlan(weights, frames−1)` từ
   `previewEngine.ts`. Mô phỏng source-over canvas 8-bit: bắt đầu
   từ lớp trống, mỗi bước vẽ `Math.round(a·src + (1−a)·cur)` với
   `a = plan blendAlpha` (bước đầu alpha = 1). Đây là phép làm
   tròn mà canvas thật áp mỗi lần `drawImage` với `globalAlpha`.
2. **Dip:** CHÍNH `singleClipDipPixel` từ `transitionPreview.ts`
   + `Math.round` cuối, đúng vòng dip của `drawVideoClipWithDip`
   (pixel alpha = 0 được bỏ qua trong app thật; vùng mẫu toàn
   frame video đục nên không ảnh hưởng).
3. **Kỳ vọng độc lập:** trung bình có trọng số TRỰC TIẾP (không
   qua plan, không qua bước vẽ trung gian) rồi cùng
   `singleClipDipPixel`, làm tròn một lần cuối.
4. **Alpha dip:** IN dùng `bAlpha(p)`, OUT dùng `aAlpha(p)`, lấy
   từ nút `FADE_DIP_KNOTS_A/B` parse trực tiếp từ source hiện
   tại (không hardcode số N6). OUT chỉ đo p = 0,1 / 0,15 vì
   p ≥ 0,25 suy biến (`aAlpha = 0` → kỳ vọng = màu dip thuần,
   theo phân tích O6 §3.2).
5. **fadeblack:** app thật không đi qua vòng dip mà vẽ với
   `tv.alpha` trên nền đen; về toán pixel ≡
   `singleClipDipPixel` mode "black" (`alpha·clip`), nên script
   dùng chung hàm đó. Đường đi khác nhau nhưng công thức cuối
   giống nhau — ghi rõ để không ai trích sai rằng "fadeblack đã
   qua vòng dip".
6. **Thang M6:** KHỚP = MAD ≤ 2 và ≥ 99% pixel có maxDiff ≤ 8;
   XẤP XỈ = MAD ≤ 20 và ≥ 90% ≤ 8; còn lại LỆCH. Mỗi ô 1008 mẫu
   (vùng 15%–85%, step 8, khung 270×480).

### 2.2 Lưới đã chạy (270 ô = 3 footage × 90 ô)

- Cửa sổ: IN p = 0,25 / 0,5 / 0,75 (current t = p, clip 0–4s,
  cửa sổ vào 1s như M6); OUT p = 0,1 / 0,15 (current t = 3 + p,
  cửa sổ ra 3–4s).
- Mode: fadewhite / fadegrays / fadeblack.
- Weights: [1,1,1], [2,1,1], [1,1,2] (frames 3); [1,1] (frames 2);
  [1,1,1,1], [3,1,1,1] (frames 4). Bóng = current − k/30.
- Footage: K19 (motion mạnh) + K11 (motion vừa) của M6
  (23,976fps) và synth testsrc2 30fps của M6
  (`complex-synth.mp4`). Tổng 40 frame trích (cache theo thời
  gian), frame trung gian chỉ ở /tmp, script tự xóa.

### 2.3 Phát hiện trong lúc đo: cửa sổ trùng frame ở footage 23,976fps

Khi kiểm tra ô [1,1] cho MAD đúng 0,0000 ở mọi hàng K, P6 phát
hiện nguyên nhân hệ thống (không phải blend hoàn hảo): nguồn K
là 23,976fps (khung dài 0,0417s) trong khi bước lấy mẫu là 1/30s
(0,0333s). Với current t = 0,25 / 0,5 / 0,75, cả hai thời điểm
`t` và `t − 1/30` rơi vào CÙNG một khung nguồn (ví dụ 0,4667 và
0,5 đều thuộc khung 11: 0,4588–0,5005) nên hai frame trích ra
giống hệt nhau ở mọi mẫu — blend của hai frame giống nhau thì
đương nhiên MAD = 0. Bằng chứng: trích bằng cả `-ss` trước và
sau `-i` đều cho diff 0 pixel; script ghi cờ `dupWindow` cho
mọi ô (đầu–cuối cửa sổ trùng nhau ở mọi mẫu).

Hệ quả xử lý (trung thực, không giấu ô yếu):

- **18 ô dupWindow** (K19 + K11, chỉ weights [1,1], chỉ cửa sổ
  IN: 2 footage × 3 mode × 3 p) có MAD = 0,0000 ĐÚNG LÀ 18 ô
  MAD = 0 duy nhất trong lưới — tức mọi ô MAD = 0 đều là ô
  trùng, không ô nào là blend hoàn hảo thật. Các ô này KHÔNG
  được trích làm bằng chứng blend; chúng chỉ chứng minh dip
  (hai phía dùng cùng một frame nên dip triệt tiêu sai khác).
- **Bằng chứng [1,1] thật** lấy từ synth 30fps (bước 1/30 khớp
  đúng khung nguồn, windowMotion 1,90–3,83) và từ các ô OUT
  [1,1] của footage K (không trùng): xem §3.2.
- Các ô frames 3/4 không dính vấn đề này (cửa sổ dài 0,0667–
  0,1s, luôn vượt ít nhất một biên khung nguồn).
- Lưu ý cho harness browser sau (O6 §3.5): nếu giữ bước scrub
  1/30 trên footage 23,976fps thì ô [1,1] IN cũng sẽ trùng frame
  ở tầng seek — muốn đo blend 2 frame thật trên footage K thì
  phải chọn current t sao cho `t` và `t − 1/30` khác khung nguồn
  (ví dụ t = 0,52 thay vì 0,5), hoặc dùng footage 30fps.

### 2.4 Khác biệt nút dip so với O6 (không ảnh hưởng tier)

O6 ghi neo N6 `bAlpha(0,5) = 0,3435`, nhưng source hiện tại đã
mang nút strict của luồng O1 đợt 32 (`bAlpha(0,5) = 0,3450`,
cùng 10 nút B đổi nhẹ: 0,35: 0,1427→0,1441; 0,4: 0,2004→0,2016;
0,55: 0,4191→0,4216; 0,6: 0,5059→0,5016; 0,65: 0,5884→0,5934;
0,8: 0,8007→0,7982; 0,9: 0,8989→0,9039; 0,95: 0,9476→0,9523).
Script P6 parse nút từ source hiện tại nên alpha trong JSON
P6 là alpha O1, không phải alpha N6 mà bảng O6 §3.2 dùng. Chênh
lệch tối đa ~0,005 trọng số — nhỏ hơn rất nhiều so với biên
tier (MAD tệ nhất 0,3747 so với ngưỡng KHỚP 2), nên không đổi
kết luận nào; chỉ ghi rõ để ai đối chiếu số O6 với số P6 khỏi
lạc nhau ở chữ số thứ ba.

## 3. Kết quả lưới (MAD = sai số làm tròn compositing, không phải MAD browser)

### 3.1 Tổng hợp

| Tập | Số ô | KHỚP | maxDiff lớn nhất | MAD tệ nhất |
|---|---|---|---|---|
| Toàn lưới | 270 | 270 | 1 | 0,3747 |
| K19 (motion mạnh) | 90 | 90 | 1 | 0,3747 |
| K11 (motion vừa) | 90 | 90 | 1 | 0,3148 |
| SYNTH 30fps | 90 | 90 | 1 | 0,0694 |

Không ô nào maxDiff > 1: đúng bản chất sai số làm tròn tích lũy
(mỗi bước vẽ làm tròn tối đa 0,5 mức, dip nén thêm theo alpha
≤ 0,7419 nên tổng không vượt 1 mức ở bất kỳ pixel nào đã mẫu).
MAD tệ nhất theo weights: [1,1,2] 0,3747; [3,1,1,1] 0,3128;
[1,1,1,1] 0,2956; [1,1,1] 0,2378; [2,1,1] 0,2229; [1,1] 0,2159
([1,1] tính trên ô không trùng; ô trùng MAD = 0 đã tách riêng
ở §2.3). Theo mode: fadegrays tệ nhất (0,3747) — gray-mean của
pixel đã làm tròn tương tác thêm một lần làm tròn, vẫn ≤ 1 mức.

### 3.2 Các ô đáng đọc riêng

- **Ô tệ nhất lưới:** K19 IN fadegrays p=0,5 weights [1,1,2]:
  MAD 0,3747, le8 100%, max 1, KHỚP. Tiếp theo: K19 IN fadegrays
  p=0,75 [1,1,2] 0,3654; K19 OUT fadegrays p=0,1 [1,1,2] 0,3634;
  K19 IN fadegrays p=0,25 [1,1,2] 0,3562 — cùng họ: frame mới
  nhất nặng nhất + gray-mean. Vẫn cách ngưỡng KHỚP (MAD ≤ 2)
  hơn 5×, không phải dấu hiệu lỗi.
- **Ô gốc M6 (IN fadewhite p=0,5 [1,1,1]) ở tầng compositing:**
  K19 MAD 0,0876, K11 MAD 0,0794 — nhỏ hơn nhiều so với
  MAD browser 0,624/0,487 của M6, đúng kỳ vọng vì phần lớn MAD
  browser đến từ draw/resample/seek, không phải từ blend.
- **[1,1] thật (không trùng):** synth IN/OUT mọi mode/p:
  MAD 0,0013–0,0423, le8 100%, max 1, KHỚP (windowMotion
  1,90–3,83); K OUT [1,1]: MAD 0,0215–0,2159, KHỚP.
- **Màu phẳng (đối chứng nội bộ):** mọi bộ weights cho
  maxDiff = 0 — blend của các frame giống nhau trả đúng màu
  đó qua cả plan lẫn dip, pipeline không tự sinh sai số.

### 3.3 Đối chứng độ nhạy: đảo thứ tự weights (lưới có bắt lỗi không?)

Control: app dùng weights [1,1,2] so với kỳ vọng tính bằng
weights đảo [2,1,1], cùng cửa sổ K19 IN fadewhite p=0,5:
**MAD 1,7272, le8 97,52%, maxDiff 12, tier XẤP XỈ** — so với
baseline đúng thứ tự cùng ô (MAD 0,1323, max 1) thì MAD tăng
~13× và maxDiff tăng 12×: lưới PHẢN ỨNG rõ với lỗi đảo thứ tự.
Nhưng đọc đúng giới hạn: tier chỉ là XẤP XỈ chứ không LỆCH,
vì dip alpha 0,345 nén sai số blend (sai số blend × alpha mới
vào MAD). Vì vậy khi chạy headed sau này, không được chỉ đọc
tier: phải so MAD ô mới với baseline compositing ở §3.1 (ví dụ
ô IN trắng p=0,5 [1,1,2] đúng thứ tự chỉ ~0,13) thì mới kết
luận thứ tự đúng/sai. Đây cũng là lý do O6 dặn không tái dùng
kỳ vọng /3 cho weights không đều — sai số kỳ vọng (bias tới
1,15 ở K19 p=0,5 [2,1,1] theo O6) đã lớn hơn cả sai số blend
thật.

### 3.4 Ô suy biến / yếu (theo O6, P6 giữ nguyên, không đo thêm)

- OUT p ≥ 0,25: suy biến (`aAlpha = 0`), không đo, không trích.
- IN p = 0,25: alpha `bAlpha = 0,0562` — sai số blend bị nén
  ~18× qua dip nên MAD rất nhỏ (K19 IN trắng [1,1,1]: 0,0202)
  dù blend đúng/sai; chỉ là ô phụ, không dùng làm bằng chứng
  chính. Bằng chứng chính là p = 0,5 / 0,75 và OUT p = 0,1.

### 3.5 Cái gì vẫn CHƯA ĐO (không mạo nhận)

- **MAD headed browser cho mọi ô lưới vẫn CHƯA ĐO.** Số P6 chỉ
  tách được tầng compositing; draw/resample/seek/canvas thật
  vẫn là phần M6 đo ở ô gốc và O6 đặc tả ở §3.5 (vá
  `pageMeasureBlur` thêm weights + mode, kỳ vọng có trọng số
  rồi `singleClipDipPixel`, scrub thêm cho frames 4, neo hồi
  quy ô M6 gốc trên bundle mới trước khi đọc ô mới). Badge
  motion-blur giữ `≈` như M6 đã quyết.
- Safari / máy thật / dpr > 1 / viewport khác: chưa đo (nợ đứng
  từ M6, O6 §5.6).
- Khung đầy đủ 1080×1920 thay vì 270×480, và lấy mẫu toàn khung
  thay vì step 8: chưa đo (MAD làm tròn không phụ thuộc độ phân
  giải về lý thuyết, nhưng resample canvas thật thì có — đó lại
  là phần headed).
- fadeblack trên browser: kỳ vọng P6 dùng công thức
  `alpha·clip` (đường nền đen); O6 §5.5 đã dặn phải đối chiếu
  lại đường nền/dip-behind của preview cho fadeblack trước khi
  chạy headed — P6 không đối chiếu thêm vì không có browser.

## 4. D7: nợ còn lại sau xác minh (không phải việc P6 làm thêm)

1. **Kiểm chứng D7 đầu-cuối trên browser thật chưa làm** (nợ O6
   §5.2): fix đã khóa bằng test Node + đối chiếu đường code
   App, nhưng probe M5 (đọc localStorage sau reload, kỳ vọng
   `topHasStyle=true`) cần chạy lại trên bundle mới. P6 không
   có live-browser nên không chạy được — parent chạy trong
   main chat.
2. **Motion migration chịu cùng mẫu "không ghi lại sau khôi
   phục"** (nợ O6 §5.3): `migrateProjectMotion` ở cổng load sửa
   spec trong bộ nhớ nhưng file autosave bền vững vẫn cũ cho
   tới lần sửa tiếp theo. Muốn đóng thì mở rộng điều kiện ghi
   lại trong `loadAutosave` sang "có sửa nào từ load", kèm test
   tương ứng — đây là quyết định của parent, P6 không tự mở
   rộng fix O6 (lệnh chuyển hướng cấm sửa lại hướng khác).
3. **Lỗi tsc `mp4Demux.ts:95`** (§1.3): chủ file đợt 32 khác sửa;
   tới lúc đó không claim "tsc 0" cho cây này.

## 5. Kiểm chứng và file đổi/thêm (CHỈ file của P6)

Lệnh chạy (từ gốc repo; FFmpeg 8.1.2, Node 24):

- `node --check server/render/src/measure_r32_p6_blur_dip_grid.js`:
  pass.
- `node server/render/src/measure_r32_p6_blur_dip_grid.js --json
  benchmarks/results/v32-p6-blur-dip-grid.json`: 270 ô, 40 frame
  trích, exit 0 (lần chạy đầu với 180 ô đã bị thay bằng lần chạy
  đủ 270 ô sau khi thêm synth + cờ dupWindow; JSON hiện tại là
  bản 270 ô).
- `node apps/web/src/lib/textStyle32O6D7.test.ts`: 6 pass, 0 fail
  (test của O6, P6 chỉ chạy lại — không liệt kê là file P6).
- Hồi quy từ gốc repo: projectRepo 10/10, nested22 7/7,
  round26J5 15/15, textStyle27K1 6/6, transitionPreview 31/31,
  saveToast31 15/15.
- `npx tsc --noEmit` trong `apps/web`: 1 lỗi duy nhất
  `mp4Demux.ts:95` (của luồng khác, §1.3).
- KHÔNG push GitHub, KHÔNG ghi qua GitHub connector, KHÔNG
  release/tag, KHÔNG binary vào repo (frame trung gian chỉ ở
  /tmp, script tự xóa; footage đọc từ
  `~/workspace/tmp-round30-m6/videos-blur/` ngoài repo, không
  copy vào repo). KHÔNG tự ghi file paths-loop, KHÔNG ghi
  build-loop-log (parent lo). KHÔNG sửa `projectRepo.ts`,
  `tsconfig.json`, test O6, hay bất kỳ file nào của luồng khác.

File đổi/thêm của P6 (text, không binary — parent gộp batch đợt 33):

- Mới: `server/render/src/measure_r32_p6_blur_dip_grid.js` — lưới
  blur dip compositing (plan sản phẩm + mô phỏng source-over
  8-bit + dip sản phẩm, so với kỳ vọng trung bình trực tiếp;
  kèm đối chứng màu phẳng, đối chứng đảo weights, cờ dupWindow).
- Mới: `benchmarks/results/v32-p6-blur-dip-grid.json` — 270 ô
  (MAD/le8/maxDiff/tier/motionMean/windowMotion/dupWindow từng
  ô) + đối chứng + neo dip.
- Mới: `docs/PHASE9_ROUND32_P6_BLUR_D7_LIMITS.md` — file này.

KHÔNG đụng (để parent đối chiếu): mọi file O6
(`projectRepo.ts` fix D7, `textStyle32O6D7.test.ts`,
`measure_r32_o6_blur_coverage.js`,
`v32-o6-blur-coverage.json`, `PHASE9_ROUND32_O6_BLUR_D7_LIMITS.md`),
mọi file luồng khác, preview/seek/CLI/toast/cdp-snapshot/
WebCodecs, và `fadeDipWeights` (P6 chỉ đọc nút, không sửa).
