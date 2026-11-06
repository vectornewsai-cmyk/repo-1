# Phase 9 đợt 28, luồng L1 — Cơ chế lệch baseline nguồn frame preview của footage K

> Đóng nợ đợt 27 §3.1 (follow-up của K3 §4.4): K3 chứng minh nhánh dip
> KHỚP 18/18 trên browser nhưng sanity footage K (không transition)
> vẫn lệch control (MAD resampled 5,583). Luồng này tìm CƠ CHẾ thật
> của dư số baseline đó. Kết luận đi trước: **không phải lỗi sản
> phẩm — dư số là artefact của chuỗi control trong harness K3, và
> frame app thực tế KHỚP control từng bit khi chuỗi control được tái
> lập đúng.** Không sửa code sản phẩm nào trong luồng này, vì không
> có bug sản phẩm nào được chứng minh (xem §6 về tiêu chí sửa).

## 0. Kết luận ngắn (không vượt số đo)

1. **App KHỚP control từng bit khi chuỗi đo đúng:** ở cả 3 thời điểm
   đo, app-vs-control-1-bước-offset-437,5 cho **MAD = 0,000, ≤8 =
   100%, maxDiff = 0, trên 17.800 mẫu** (probe P2), lặp lại với cả
   hai video element độc lập (P8 cũng 0,000). Chuỗi 1-bước này tái
   lập đúng chuỗi app: `ctx` đã mang viewport transform
   (`setTransform(vp.scale, …, vp.offX, vp.offY)`) rồi
   `drawImage(video, dx, dy, dw, dh)` một lần duy nhất, với
   `letterboxFit` thật `dx = (1280 − 405) / 2 = 437,5`.
2. **Cơ chế lệch của K3 = hai sai khác cộng dồn trong chuỗi control
   của K3, đều vô hình trên nội dung phẳng/gradient nhưng hiện rõ
   trên footage chi tiết:**
   - **(i) Control làm tròn offset letterbox:** K3 dùng
     `cx0 = Math.round((1280 − 405) / 2) = 438` thay vì 437,5 của
     app — lệch 0,5px project (≈ 0,44px device). Đo thuần (không
     liên quan app, probe P4): chỉ riêng lệch 0,5px này đã gây
     MAD 4,11 / 4,18 / 1,89 ở 3 thời điểm.
   - **(ii) Control resample 2 bước, app resample 1 bước:** K3 vẽ
     video → canvas project 1280×720 (1080→405) rồi mới vẽ canvas
     đó dưới viewport transform (405→~356 device); app vẽ video
     thẳng xuống device trong một `drawImage` duy nhất (1080→~356).
     Đo thuần (probe P5, offset đã khớp 437,5 cả hai phía): chỉ
     riêng khác biệt số bước resample đã gây MAD 3,02 / 3,11 / 1,25.
   - Cộng hưởng: tái lập đúng K3 (probe P0: 2 bước + offset 438)
     cho MAD 5,67 / 5,77 / 2,52 — cùng họ số với sanity K3
     (MAD resampled 5,583 tại t = 2,0; số này đo tại 2,0333 nên
     không đồng nhất từng chữ số, nhưng cùng cơ chế và cùng độ
     lớn). Sửa chỉ một trong hai sai khác vẫn còn lệch (P1: chỉ
     sửa offset, còn 2 bước → 3,02 / 3,11 / 1,25); phải sửa cả hai
     mới về 0.
3. **Các giả thuyết còn lại đều bị loại trừ bằng phép đo** (§3):
   timestamp/frame (sweep lưới fps gốc: frame danh nghĩa cho 0,000,
   frame kề cho 3,3–8,0); decode giữa các element (P6 = 0,000);
   hold-frame J4 (hold = 0 suốt phiên, mỗi probe draw tăng đúng 1);
   màu bt709/bt601 và decode browser-vs-FFmpeg (native không
   scale: browser khớp frame FFmpeg 48 ở cả RGB 0,65, bt709 0,39,
   bt601 0,41 — chênh bt709-vs-bt601 chỉ 0,02 MAD, không thể giải
   thích dư số 5,6; frame kề 47/49 lệch ~6,3, khóa độc lập frame
   danh nghĩa).
4. **Hệ quả cho số K3:** verdict dip 18/18 trên phẳng/gradient
   KHÔNG bị ảnh hưởng (nội dung trơn không nhạy với offset nửa
   pixel hay số bước resample — chính vì vậy resampled của K3 về
   0,000 ở đó). Nhưng **mọi số footage-động nào của K3 dùng chuỗi
   control cũ đều mang baseline artefact này** (sanity 5,583 và 2
   case dip footage thật): chúng KHÔNG được dùng làm bằng chứng
   "preview lệch render/control trên footage động" nữa. Muốn số
   dip-trên-footage sạch thì phải đo lại bằng chuỗi 1-bước-437,5
   của harness này (nợ follow-up, §7) — luồng này KHÔNG đo lại dip,
   nên không claim dip-trên-footage nay KHỚP.
5. **KHÔNG sửa code sản phẩm.** App đã vẽ đúng frame, đúng vị trí,
   đúng chuỗi resample của chính nó; "sửa" duy nhất có thể nghĩ tới
   (đổi app sang vẽ 2 bước cho khớp control cũ) sẽ là sửa đúng
   thành sai. Cái cần sửa là phương pháp đo (harness K3), không
   phải sản phẩm — và harness K3 không thuộc phạm vi luồng này nên
   luồng này để nguyên, chỉ ghi rõ quy tắc đo đúng (§7).

## 1. Phương pháp đo (đọc trước khi tranh luận về số)

- Harness mới: `apps/web/scripts/clicktest-footage-baseline-round28-l1.mjs`
  (kế thừa hạ tầng pipe CDP của K3: Xvfb, snapshot dist, seed qua
  autosave, scrub ruler thật, import qua `DOM.setFileInputFiles`;
  display :99, cổng 4199 — tránh đụng các luồng đợt 28 khác).
- Bundle đo: `index-mIzUrd00.js`, sha256[:16] = `ae6342b5876a41c0`
  — **đúng bundle run5 của K3**, nên so sánh với số K3 là cùng bản
  build, không phải artefact đổi build.
- Seed: 1 track, 1 clip K duy nhất [0,10), KHÔNG transition
  (sanity thuần — loại dip khỏi phép đo ngay từ thiết kế).
  Project 1280×720, fps 30. Canvas app đo được: 1352×633,
  viewport scale 0,8792, offX 113,33, offY 0 — khớp công thức
  `computeViewport` của app.
- Footage: `clip-k-dod-iwo.mp4` (Internet Archive, DoD; license
  publicdomain qua `metadata.licenseurl` của chính IA;
  SHA256 khớp đúng J3/K3 `49f33b83…`; ffprobe: h264, 1080×1920,
  24000/1001 ≈ 23,976fps, color bt709 cả 3 trường, duration 64,6s).
- Thời điểm đo: playhead 2,0333 / 3,0333 / 5,0333 (lưới 30fps, nằm
  sâu trong frame nguồn 48 / 72 / 120, cách biên frame ≥ 0,007s —
  tránh mơ hồ biên frame). Mỗi thời điểm: capture frame app MỘT
  lần rồi chạy mọi probe trên đúng frame đó (không scrub lại giữa
  các probe, trừ guard khung tối kiểu K3 — không lần nào kích hoạt:
  `retried = false`, `measurementInvalid = false` ở cả 3 probe).
- Vùng mẫu: trong pillar contain-fit, inset 4px, bước 4px project
  → 17.800 mẫu/thời điểm; so device-vs-device 1:1 (cùng kích thước
  canvas), không qua point-sampled gần đúng kiểu K3.
- Thang V6: KHỚP = MAD ≤ 2 VÀ ≥ 99% ≤ 8; XẤP XỈ = MAD ≤ 20 VÀ
  ≥ 90% ≤ 8; còn lại LỆCH. 0 exception trong phiên; vạch handle
  delta = 0 frame ở cả 3 probe (playhead dự đoán đúng).

## 2. Số đo chính: bảng loại trừ (3 thời điểm, cùng một frame app)

| Probe | Ý nghĩa | t = 2,0333 (f48) | t = 3,0333 (f72) | t = 5,0333 (f120) |
|---|---|---|---|---|
| P0 app vs 2-bước-438 | Tái lập đúng K3 | 5,668 / 78,14% LỆCH (max 123) | 5,773 / 77,94% LỆCH (max 103) | 2,518 / 93,11% XẤP XỈ (max 119) |
| P1 app vs 2-bước-437,5 | Chỉ sửa offset | 3,018 / 88,16% LỆCH | 3,112 / 88,13% LỆCH | 1,254 / 98,81% XẤP XỈ |
| **P2 app vs 1-bước-437,5** | **Chuỗi app thật** | **0,000 / 100% KHỚP (max 0)** | **0,000 / 100% KHỚP (max 0)** | **0,000 / 100% KHỚP (max 0)** |
| P3 app vs 1-bước-438 | 1 bước nhưng offset tròn | 5,367 / 80,06% LỆCH | 5,477 / 79,75% LỆCH | 2,330 / 93,93% XẤP XỈ |
| P4 2-bước-438 vs 2-bước-437,5 | Độ lớn thuần của lệch 0,5px | 4,112 / 84,39% LỆCH | 4,180 / 84,26% LỆCH | 1,890 / 95,64% XẤP XỈ |
| P5 2-bước-437,5 vs 1-bước-437,5 | Độ lớn thuần của 1-vs-2 bước | 3,018 / 88,16% LỆCH | 3,112 / 88,13% LỆCH | 1,254 / 98,81% XẤP XỈ |
| P6 ctlA vs ctlB (2-bước-437,5) | Phương sai giữa 2 element | 0,000 / 100% KHỚP | 0,000 / 100% KHỚP | 0,000 / 100% KHỚP |
| P7 2-bước smooth vs no-smoothing | Độ nhạy kernel resample | 8,235 / 71,24% LỆCH | 8,317 / 70,95% LỆCH | 3,313 / 90,66% XẤP XỈ |
| P8 app vs 1-bước-437,5 (ctlB) | Đối chứng element cho P2 | 0,000 / 100% KHỚP | 0,000 / 100% KHỚP | 0,000 / 100% KHỚP |

Đọc số đúng cách:

- P2 = P8 = 0 tuyệt đối (maxDiff = 0, mean app = mean control tới
  0,1 ở cả 3 thời điểm: ví dụ t = 2,0333 cùng [149,8, 149,3, 148,8])
  nên đây không phải "khớp trong ngưỡng" mà là **đồng nhất từng
  bit** — chuỗi app đã được tái lập đúng hoàn toàn, không còn dư
  số nào để giải thích thêm.
- P1 ≡ P5 tới từng chữ số ở cả 3 thời điểm (3,018 / 3,112 / 1,254):
  hệ quả tất yếu khi app ≡ 1-bước (P2 = 0) — app-vs-2-bước phải bằng
  1-bước-vs-2-bước. Sự trùng khớp này là kiểm tra nhất quán nội bộ
  của bộ probe, không phải hai bằng chứng độc lập.
- Độ lớn dư số phụ thuộc nội dung: t = 5,0333 (cảnh ít chi tiết
  hơn, mean sáng hơn [170,8, 164,6, 153,1]) cho mọi probe lệch đều
  nhỏ hơn hẳn t = 2,0333/3,0333. Đúng dấu hiệu của artefact resample
  (phụ thuộc tần số cao của nội dung), không phải của lỗi hệ thống
  (lệch thời gian hay lệch màu sẽ đều tay hơn).
- P7 cho thấy resample trên footage này nhạy tới mức nào: chỉ tắt
  smoothing đã lệch tới 8,3 MAD — nên bất kỳ sai khác chuỗi resample
  nào (số bước, offset nửa pixel) cũng đủ gây dư số cỡ K3.

## 3. Bảng loại trừ từng giả thuyết (theo nhiệm vụ)

### (a) Lệch màu bt709/bt601 giữa chuỗi preview và render — LOẠI TRỪ

Áp tứ giác kiểu H4 đợt 24 cho frame đơn, ở kích thước gốc
(không scale — tách màu khỏi resample): control vẽ ở 1080×1920
gốc, lấy mẫu bước 8 (32.400 pixel), so offline với frame FFmpeg
cùng chỉ số (xem `benchmarks/results/v28-l1-ffmpeg-color.json`):

| So sánh (probe t = 2,0333, frame nguồn 48) | MAD | ≤8 | Verdict |
|---|---|---|---|
| Browser native vs FFmpeg RGB (png) f48 | 0,653 | 100% | KHỚP |
| Browser native vs YUV→RGB bt709 f48 | 0,388 | 100% | KHỚP |
| Browser native vs YUV→RGB bt601 f48 | 0,409 | 99,31% | KHỚP |
| Browser native vs FFmpeg RGB f47 / f49 | 6,320 / 6,252 | 77,28% / 77,54% | LỆCH |
| Browser native vs YUV→RGB bt709 f47 / f49 | 6,279 / 6,207 | 77,46% / 77,71% | LỆCH |

- Chênh bt709-vs-bt601 chỉ 0,021 MAD (0,388 so với 0,409) — nhỏ
  hơn dư số baseline 2 bậc độ lớn, và cả hai đều KHỚP. Lệch màu
  không thể là cơ chế của dư số 5,6.
- Lưu ý trung thực: phép chuyển YUV→RGB dùng limited-range đúng
  (`(Y−16)×1,164383` + hệ số Kr/Kb theo chuẩn); bản đầu quên giãn
  limited-range cho MAD ~12 giả ở mọi ô — đã sửa và chạy lại, số
  trên là sau sửa. Check nội bộ: FFmpeg RGB vs chính phép chuyển
  YUV→bt709 cho MAD 0,267 (f48), chứng tỏ code chuyển đúng.
- Per-channel mean browser − FFmpeg tại f48: [+0,51, +0,81, +0,64]
  — lệch dưới 1 mức, cùng dấu hiệu làm tròn YUV→RGB, không phải
  lệch hệ số chuyển (lệch hệ số kiểu H4 cho MAD ~1,7 kèm lệch kênh
  có cấu trúc, và ở đây không có).
- Quan trọng hơn: cả app lẫn control đều decode bằng browser, nên
  dù có lệch màu browser-vs-FFmpeg thì nó cũng là chung cho hai
  phía và không thể gây ra app-vs-control. Phép đo này chỉ đóng
  thêm cửa "render khác preview vì màu".

### (b) Preview lấy frame ở timestamp khác render — LOẠI TRỪ

Sweep control 1-bước-437,5 theo lưới fps gốc (seek giữa frame
`(k+0,5)/23,976`), so với cùng frame app:

| Thời điểm | dk −2 | dk −1 | dk 0 (danh nghĩa) | dk +1 | dk +2 |
|---|---|---|---|---|---|
| t = 2,0333 (f48) | 5,89 | 3,27 | **0,00** | 3,26 | 5,94 |
| t = 3,0333 (f72) | 5,98 | 3,27 | **0,00** | 3,40 | 6,18 |
| t = 5,0333 (f120) | 7,97 | 4,98 | **0,00** | 4,85 | 7,72 |

- Frame danh nghĩa cho 0,000 tuyệt đối, frame kề gần nhất vẫn
  ≥ 3,26 — app đang hiển thị đúng frame nguồn tại thời gian danh
  nghĩa, không lệch ±1 hay ±2 frame nguồn. Đây là sweep theo lưới
  fps gốc mà K3 §5.3 đã yêu cầu (K3 chỉ quét lưới 30fps nên bước
  quét thô hơn).
- Đối chứng độc lập offline: browser native khớp FFmpeg f48 nhưng
  lệch f47/f49 (~6,3) — cùng kết luận từ phía FFmpeg, không qua
  chuỗi resample nào.

### (c) Khác biệt decode (browser `<video>` vs FFmpeg) ở cùng timestamp — LOẠI TRỪ

- Browser native vs FFmpeg RGB f48: MAD 0,653, ≤8 = 100%, max 3
  (§3a) — decode browser và FFmpeg khớp trong ngưỡng KHỚP ở cùng
  frame, cùng kích thước gốc. Dư số còn lại (< 1 mức) là làm tròn
  YUV→RGB, không phải decode khác frame hay khác nội dung.
- Browser-vs-browser cũng khớp tuyệt đối: P6 (hai element độc lập,
  cùng chuỗi) = 0,000 ở cả 3 thời điểm — không có phương sai
  decode/seek giữa các element. Nếu decode browser là không xác
  định theo element thì P6 đã lệch; nó bằng 0 nên cửa này đóng cả
  hai chiều.

### (d) Resize/scaling path khác nhau — XÁC NHẬN LÀ CƠ CHẾ (cùng offset)

Đây là cơ chế duy nhất sống sót, gồm đúng hai thành phần đã tách ở
§2 (P4 + P5). Tóm tắt lại dưới dạng quy kết:

- **Offset:** app `letterboxFit` trả `dx = 437,5` (số thực, không
  làm tròn — xem `previewEngine.ts`); control K3 làm tròn thành
  438. Một mình nó: MAD ~4,1 (P4).
- **Số bước resample:** app 1 bước (video → device, hệ số tổng
  ~0,330), control K3 2 bước (video → project 405 rồi → device
  ~356, qua 2 lần làm mịn). Một mình nó (offset đã khớp): MAD
  ~3,0 (P5).
- Hai thành phần không cộng tuyến tính thành P0 (5,67) vì cùng
  tác động lên cùng một trường resample — nhưng mỗi thành phần
  riêng đã đủ lớn để tự nó giải thích phần lớn dư số, và sửa cả
  hai thì dư số về đúng 0 (P2). Không còn thành phần thứ ba: nếu
  còn, P2 đã không thể bằng 0 tuyệt đối.

### Các cửa phụ khác (đo kèm, đều loại trừ)

- **Hold-frame J4:** `window.__vcutHoldStats` đọc trước/sau mỗi
  probe: `hold = 0` suốt phiên; `draw` tăng đúng 1 mỗi probe
  (0→1→2→3), `skip = 1` không đổi (skip từ lúc load). Frame app đo
  được là frame draw tươi, không phải frame giữ cũ.
- **Khung tối / seek chưa tới (bẫy K3 §5.4):** không kích hoạt lần
  nào; appMean sáng và bằng mean control tới 0,1 ở mọi probe.
- **Proxy:** không đo lại trong luồng này vì K3 đã loại trừ trực
  tiếp (bridge không chạy, badge ẩn) và P2 = 0 đã khóa: nếu app
  dùng bản proxy downscale thì app không thể đồng nhất từng bit
  với control vẽ từ file gốc.

## 4. Vì sao K3 không phát hiện ra (trung thực, không đổ lỗi)

- K3 thiết kế control cho mục tiêu dip: phẳng + gradient tĩnh là
  nội dung trơn, bất biến dưới dịch nửa pixel và dưới số bước
  resample (chính vì vậy resampled của K3 về 0,000 ở 18/18 case
  chính). Sai khác chuỗi chỉ hiện trên nội dung có tần số cao —
  đúng thứ mà sanity footage K mang theo.
- K3 có đo resampled (chuỗi 2 bước của chính control) nhưng
  `dipOff` của nó được dựng từ canvas off đã mang offset tròn 438,
  nên resampled vẫn mang cả hai sai khác — phép "mirror đúng thứ
  tự của app" của K3 chỉ mirror thứ tự (dip → resample), không
  mirror tọa độ letterbox và số bước drawImage gốc của app
  (app không hề có canvas project trung gian cho đường video
  thường: `drawVideoClip` vẽ thẳng lên `ctx` đã mang viewport
  transform — xem `preview.tsx` `renderFrame` dòng ~1549 và nhánh
  vẽ thường cuối `drawVideoClip`).
- Bài học phương pháp (ghi để luồng sau khỏi vấp): **control phải
  tái lập đúng chuỗi drawImage của app tới từng tham số** (tọa độ
  thực không làm tròn + số lần drawImage + transform đang mang),
  không chỉ "cùng contain-fit, cùng kích thước đích". Với nội dung
  chi tiết, nửa pixel và một lần resample thừa đều là sai số cỡ
  MAD, không phải nhiễu làm tròn.

## 5. Chưa đo / giới hạn (không mạo nhận)

- **Chưa đo lại dip trên footage bằng chuỗi đúng:** kết luận này
  khóa baseline sanity, chưa khóa dip-trên-footage. Số dip footage
  của K3 (§4: fadewhite vào XẤP XỈ, fadegrays ra LỆCH) cần đo lại
  bằng chuỗi 1-bước-437,5 trước khi kết luận gì về dip trên footage
  động — nhưng theo cơ chế đã tìm, kỳ vọng là chúng sẽ cải thiện
  mạnh (dư số baseline ~5,6 sẽ biến mất, chỉ còn dư số dip thật nếu
  có). Luồng này không đo nên không claim.
- **Chưa đo:** 1080p/4K, dpr > 1, viewport khác (toàn bộ đo là
  Chromium headed dưới Xvfb, raster phần mềm, dpr = 1, canvas
  1352×633, bundle `mIzUrd00`); clip dọc khác K; nội dung cực đoan
  (nhiễu trắng, text nhỏ) nơi resample còn nhạy hơn; đường
  mask/SR/track trên footage (đường vẽ khác, có thể mang thêm sai
  khác chuỗi riêng).
- **Giới hạn của phép so FFmpeg:** mẫu native bước 8 (32.400
  pixel), không phải toàn khung; so ở kích thước gốc nên không nói
  gì về chuỗi scale của render (render scale+pad dùng filter
  FFmpeg, kernel khác browser — đó là parity preview-vs-render,
  ngoài phạm vi luồng này; luồng này chỉ khóa preview-vs-control).
- **Harness K3 chưa được sửa:** luồng này không sửa file harness
  của luồng khác. Quy tắc đo đúng (§7) cần một luồng riêng áp vào
  harness K3 (hoặc harness đo footage sau này dùng thẳng harness
  L1 này làm mẫu) và chạy hồi quy phẳng/gradient để chắc không
  làm vỡ verdict dip đã khóa.

## 6. Quyết định không sửa code sản phẩm (tiêu chí theo nhiệm vụ)

Nhiệm vụ yêu cầu chỉ sửa code sản phẩm khi phép đo chứng minh
được nguyên nhân VÀ sửa làm số đo tốt lên thật. Ở đây:

- Nguyên nhân được chứng minh nằm ở **chuỗi đo**, không ở code
  app: app đã cho frame đúng (sweep 0,000), đúng vị trí (P2 = 0
  tuyệt đối chứng tỏ cả tọa độ lẫn kernel của app đều được tái
  lập), đúng decode (khớp FFmpeg 0,65).
- Không tồn tại sửa app nào làm số đo tốt lên: mọi "sửa" ứng viên
  (làm tròn dx về 438 trong app, hoặc vẽ 2 bước) đều đi ngược
  chuỗi đúng hiện tại — app hiện đã đồng nhất từng bit với control
  tái lập đúng, nên bất kỳ thay đổi nào cũng chỉ làm số đo tệ đi
  (P3 cho thấy riêng việc tròn offset trong chuỗi 1 bước đã đẩy
  MAD từ 0 lên 5,37). Parity app-vs-render là câu hỏi riêng (kernel
  scale của FFmpeg khác browser) và không thuộc phạm vi luồng này
  — nên không sửa.
- Vì vậy: 0 file `src/` đổi trong luồng này. Đây là kết luận có
  chủ ý, không phải thiếu việc làm.

## 7. Quy tắc đo đúng cho luồng sau (để đóng nợ K3 §4 triệt để)

1. Control footage động phải dùng **chuỗi 1 bước**: canvas device
   mang đúng viewport transform của app (`scale/offX/offY` đọc từ
   canvas app thật), `drawImage(video, dx, dy, dw, dh)` với
   `dx/dy/dw/dh` là số thực từ `letterboxFit`, **cấm `Math.round`
   tọa độ**.
2. Sweep thời gian phải theo **lưới fps gốc của file**
   (24000/1001 cho K), seek giữa frame, không theo lưới 30fps.
3. Mọi số footage-động cũ dùng chuỗi K3 (sanity 5,583; dip footage
   K3 §4) phải được gắn nhãn "mang baseline artefact chuỗi đo cũ"
   khi trích dẫn, cho tới khi đo lại bằng chuỗi đúng.
4. Follow-up đề xuất (không làm trong luồng này): chạy lại 2 case
   dip footage của K3 + sanity bằng harness L1 mở rộng (thêm dip
   model lên control 1-bước) để có số dip-trên-footage sạch đầu
   tiên; và áp quy tắc 1 vào harness K3 kèm hồi quy 18/18 phẳng.

## 8. Kiểm chứng và file đổi/thêm

- `node --check apps/web/scripts/clicktest-footage-baseline-round28-l1.mjs`: pass.
- Harness exit = 0 (3/3 probe hoàn thành, 0 exception, 0 lần guard
  khung tối kích hoạt, handleDelta = 0 ở mọi probe).
- JSON kết quả đã kiểm tra đọc lại được bằng Python (không chỉ
  "ghi xong"): bundle, canvas, sweep, holdStats, means đều khớp
  log in ra trong lúc chạy.
- So FFmpeg offline: script `/tmp/l1_ffmpeg_compare.py` (scratch,
  không đưa vào repo — logic đã ghi đủ ở §3a để tái lập: select
  frame k, png RGB + raw yuv420p, chuyển limited-range bt601/bt709,
  lấy mẫu bước 8).
- KHÔNG push GitHub, KHÔNG ghi qua GitHub connector, KHÔNG
  release/tag, KHÔNG binary vào repo (footage K + snapshot dist +
  frame FFmpeg chỉ ở `~/workspace/tmp-round28-l1/`, đã dọn cuối
  luồng; mẫu native cần cho tái lập nằm trong JSON kết quả).
  KHÔNG tự ghi file paths-loop, KHÔNG ghi build-loop-log (parent
  lo, theo tiền lệ). KHÔNG sửa file `src/` nào, KHÔNG sửa harness
  K3 (xem §5–§6).

File đổi/thêm (text, không binary — parent gộp batch):

- Mới: `apps/web/scripts/clicktest-footage-baseline-round28-l1.mjs`
  — harness baseline L1 (pipe CDP + seed K sanity + 9 probe P0–P8 +
  sweep lưới fps gốc + mẫu native + đọc holdStats; cổng 4199,
  display :99).
- Mới: `benchmarks/results/v28-l1-footage-baseline.json` — toàn bộ
  số đo §2–§3 (3 probe × 9 probe + sweep + means + holdStats +
  mẫu native probe đầu, 32.400 pixel bước 8).
- Mới: `benchmarks/results/v28-l1-ffmpeg-color.json` — số so
  FFmpeg §3a (RGB + bt601/bt709, frame 47/48/49).
- Mới: `docs/PHASE9_ROUND28_L1_FOOTAGE_BASELINE_LIMITS.md` — file này.
