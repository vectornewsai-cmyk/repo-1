# Phase 9 đợt 29, luồng L1 — Đo lại dip-trên-footage K3 bằng chuỗi đo đúng

> Đóng nợ đợt 28 L1 §7 + K3 §4: mọi số footage-động của K3 dùng chuỗi
> control cũ đều mang baseline artefact và không được dùng làm bằng
> chứng nữa. Luồng này đo lại bằng chuỗi đúng và công bố số
> dip-trên-footage SẠCH đầu tiên. Thang V6: KHỚP = MAD ≤ 2 VÀ
> ≥ 99% ≤ 8; XẤP XỈ = MAD ≤ 20 VÀ ≥ 90% ≤ 8; còn lại LỆCH.
> KHÔNG sửa code sản phẩm nào trong luồng này (xem §6 về tiêu chí).

## 0. Kết luận ngắn (không vượt số đo)

1. **Dip-trên-footage SẠCH, lần đầu KHỚP từng bit: 13/15 case footage
   KHỚP với MAD = 0,000, ≤8 = 100%, maxDiff = 0** (so device-vs-device
   1:1, 17.800 mẫu/case) — gồm cả 12 case mới (fadeblack/fadewhite/
   fadegrays × vào/ra × p = 0,1/0,5333) và 1/2 case legacy-p của K3
   (FW-IN p = 0,5: từ resampled cũ 1,167 về 0,000). Nhánh dip của app
   vẽ đúng trên footage động chi tiết, không chỉ trên phẳng/gradient.
2. **Hồi quy K3 không đổi: 18/18 KHỚP, MAD = 0,000 ở mọi case** —
   verdict dip trên phẳng/gradient của K3 tái lập đúng trên bundle
   mới (xem §3; bundle đợt này khác bundle K3/L1, xem §7).
3. **2 case còn lại KHÔNG phải lỗi dip — chúng là frame k0+1, và
   frame đó cũng KHỚP từng bit:** FG-OUT legacy p = 0,5 (XẤP XỈ ở
   playhead danh nghĩa, MAD 2,527) và SANITY (LỆCH ở playhead danh
   nghĩa, MAD 3,303) đều cho **sweep dk+1 = 0,000, maxDiff = 0** — tức
   frame app hiển thị chính xác là frame nguồn kề sau, còn máy móc
   dip/xám/resample/màu đều đúng từng bit với frame đó. Probe run 2
   (§5) chứng minh hiện tượng này PHỤ THUỘC LỊCH SỬ SCRUB, không
   phải lỗi nội dung/playhead: cùng playhead sanity 14,0333 cho frame
   48 (KHỚP) khi tiếp cận xuôi, frame 49 (LỆCH danh nghĩa) khi tiếp
   cận ngược đúng 1 frame 30fps — tái lập 2/2 với sweep đồng nhất
   từng chữ số. FG legacy thì KHỚP cả 3 hướng tiếp cận ở probe run 2,
   nên anomaly main run của nó là một lần bắt frame cũ thoáng qua,
   không tái lập được.
4. **KHÔNG sửa code sản phẩm.** Chưa tách được "app seek chậm/chưa
   xong lúc capture" khỏi "harness settle bằng hash không phát hiện
   seek đang bay" (xem §5.4) — sửa app khi chưa tách được hai cửa
   này là đoán mò, và mọi bằng chứng pixel đều nói máy móc vẽ đúng.
   Nợ follow-up là probe đọc trạng thái seek thật của element
   (seeking/currentTime) thay vì đoán từ hash canvas.

## 1. Chuỗi đo đúng (đọc trước khi tranh luận về số)

Quy tắc đợt 28 L1 §7, áp vào harness K3 — với MỘT điểm sửa quan trọng
so với cách đọc nông của L1 ("1 bước cho mọi case"):

- **R1 — Tọa độ thực, cấm làm tròn:** `letterboxFit` thật cho K là
  `dx = 437,5, dw = 405` (không phải 438 như control K3). Riêng lệch
  0,5px này gây MAD 1,4–4,3 trên các case dip footage (cột oldK3 §2).
- **R2 — Số bước resample theo ĐÚNG nhánh app, không theo slogan:**
  đọc code `preview.tsx` cho thấy hai nhánh khác nhau thật:
  - Nhánh thường / fadeblack (`drawVideoClip` trực tiếp lên `ctx`
    đã mang viewport transform): **1 bước** video → device.
  - Nhánh dip white/gray (`drawVideoClipWithDip`: off project →
    vòng lặp ImageData → `ctx.drawImage(off)` dưới viewport
    transform): **2 bước** video → project → device.
  Vì vậy control sạch cho dip KHÔNG phải chuỗi 1 bước của L1-sanity
  mà là chuỗi 2 bước-offset-437,5; còn control sạch cho sanity và
  fadeblack mới là 1 bước. K3 dùng 2 bước cho MỌI case nên: số dip
  cũ sai ở mức artefact offset (bước đúng, tọa độ sai); số sanity
  cũ sai ở cả hai thành phần (bước sai + tọa độ sai — L1 P4 + P5).
  Cột oldK3 trong §2 là diagnostic tái lập đúng cấu trúc K3 (2 bước
  + làm tròn) trên cùng lưới mẫu v29, để đo artefact đã loại — nó
  KHÔNG phải số K3 gốc từng chữ số (lưới mẫu khác K3 một chút:
  x0 = dx+4 = 441,5 thay vì 442; vd FW-IN legacy oldK3 = 1,190 so
  với resampled K3 = 1,167; FG-OUT legacy 4,481 so với 4,186; sanity
  5,839 so với 5,583 — cùng họ số, chênh do lưới mẫu + build).
- **R3 — Sweep theo lưới fps gốc** (K: 24000/1001, seek giữa frame
  `(k+0,5)/fps`), frameLock (control seek giữa frame vs seek tới
  sourceT lưới 30fps phải cùng frame — mọi case đều 0,0000), và
  sweep dk −2..+2 cho mọi case footage. Các target p = 0,5 trên lưới
  30fps (localT 0,5 / 3,5) nằm sát biên frame nguồn (cách biên
  0,0005s / 0,0035s) nên chỉ đo dạng "legacy-p" kèm sweep adjudication;
  các case chính dùng p = 0,1 / 0,5333 nằm sâu trong frame (cách biên
  ≥ 0,008s). Kiểm tra biên được ghi trong JSON từng case
  (`edgeStart`/`edgeEnd`).
- **R4 — So device-vs-device 1:1** (cùng kích thước canvas, cùng tập
  mẫu: pillar inset 4px, bước 4px project → 17.800 mẫu cho K), thay
  cho cột point-sampled project-vs-device của K3.
- **Chuỗi control chi tiết:** device canvas lót nền `#000` toàn khung
  + `#0a0c10` đúng vùng project dưới viewport transform (mirror
  `renderFrame`); dip loop bỏ qua pixel alpha = 0 và `Math.round`
  từng kênh như app; fadeblack dùng `globalAlpha = alpha` trên đường
  1 bước (dip đen ≡ nền, đúng thiết kế "fadeblack giữ đường alpha
  cũ" của J3 — không có nhánh dip riêng cho fadeblack).
- **Harness mới:** `apps/web/scripts/clicktest-dip-footage-round29-l1.mjs`
  (pipe CDP + Xvfb + snapshot dist + seed qua autosave + scrub ruler
  thật + import qua `DOM.setFileInputFiles`, mẫu L1/K3; main run:
  display :99, cổng 4199; probe run 2: :95/4195 vì :99 lúc đó đã có
  luồng khác chiếm — xem §7). Bundle đo: `index-B1assKz-.js`,
  sha256[:16] = `7659cc3fb1474449` (dist đã build lại từ sau K3/L1;
  bundle K3/L1 là `mIzUrd00`/`ae6342b5876a41c0` — số đo đợt này là
  của bundle hiện tại, và hồi quy 18/18 tái lập trên bundle mới là
  bằng chứng dip không hồi quy theo build).
- **Footage:** `clip-k-dod-iwo.mp4`, SHA256 khớp đúng J3/K3/L1
  `49f33b83…`; ffprobe h264 1080×1920, 24000/1001, bt709 cả 3 trường,
  duration 64,6s. License xác nhận lại tươi trong luồng này qua API
  metadata Internet Archive: `licenseurl` =
  `https://creativecommons.org/publicdomain/mark/1.0/`, đúng file
  45.788.099 byte. Proxy đã loại trừ trực tiếp như K3 (badge PROXY
  ẩn, toast "Bridge không chạy … proxy tự động thất bại") — app vẽ
  từ file gốc, không phải bản proxy downscale.
- **Seed footage:** 1 track, 3 clip nối tiếp dùng chung file K
  (in = 0 nên sourceT = localT cho mọi clip — cùng đoạn footage 0–4s,
  so sánh được giữa các type): c-fb [0,4) fadeblack vào+ra,
  c-fw [4,8) fadewhite vào+ra, c-fg [8,12) fadegrays vào+ra, cộng
  c-san [12,16) không transition. Tại mỗi thời điểm đo chỉ có đúng
  1 clip được vẽ (các cửa sổ 1s không chồng nhau trong clip).
- **0 exception** trong cả 2 phiên; handleDelta = 0 frame ở mọi case;
  hold = 0 ở mọi case (xem §5.2 về draw/skip của sanity).

## 2. Số đo chính: dip-trên-footage SẠCH (main run)

MAD/≤8/max là app vs control chuỗi đúng (device-vs-device).
`oldK3` = app vs control kiểu K3 (2 bước + làm tròn) trên cùng lưới
mẫu — đo artefact đã loại. `lock` = frameLock (0,0000 ở mọi case:
seek giữa frame và seek sourceT cho cùng frame nguồn).

| Case | Cửa sổ / p | alpha | MAD | ≤8 | max | oldK3 | lock | Sweep dk0 / dk+1 | Verdict |
|---|---|---|---|---|---|---|---|---|---|
| FB-IN-p01 | vào / 0,1000 | 0,0000 | 0,000 | 100% | 0 | 0,000 | 0,0000 | 0,000 / 0,000† | KHỚP |
| FB-IN-p0533 | vào / 0,5333 | 0,3974 | 0,000 | 100% | 0 | 1,889 | 0,0000 | 0,000 / 1,293 | KHỚP |
| FB-OUT-p01 | ra / 0,1000 | 0,4491 | 0,000 | 100% | 0 | 2,677 | 0,0000 | 0,000 / 1,485 | KHỚP |
| FB-OUT-p0533 | ra / 0,5333 | 0,0000 | 0,000 | 100% | 0 | 0,000 | 0,0000 | 0,000 / 0,000† | KHỚP |
| FW-IN-p01 | vào / 0,1000 | 0,0000 | 0,000 | 100% | 0 | 0,000 | 0,0000 | 0,000 / 0,000† | KHỚP |
| FW-IN-p0533 | vào / 0,5333 | 0,3974 | 0,000 | 100% | 0 | 1,385 | 0,0000 | 0,000 / 1,002 | KHỚP |
| FW-OUT-p01 | ra / 0,1000 | 0,4491 | 0,000 | 100% | 0 | 1,954 | 0,0000 | 0,000 / 1,126 | KHỚP |
| FW-OUT-p0533 | ra / 0,5333 | 0,0000 | 0,000 | 100% | 0 | 0,000 | 0,0000 | 0,000 / 0,000† | KHỚP |
| FW-IN-p05-legacyK3 | vào / 0,5000 | 0,3466 | 0,000 | 100% | 0 | 1,190 | 0,0000 | 0,000 / 0,867 | KHỚP |
| FG-IN-p01 | vào / 0,1000 | 0,0000 | 0,000 | 100% | 0 | 3,193 | 0,0000 | 0,000 / 2,367 | KHỚP |
| FG-IN-p0533 | vào / 0,5333 | 0,3974 | 0,000 | 100% | 0 | 3,472 | 0,0000 | 0,000 / 2,491 | KHỚP |
| FG-OUT-p01 | ra / 0,1000 | 0,4491 | 0,000 | 100% | 0 | 4,344 | 0,0000 | 0,000 / 2,495 | KHỚP |
| FG-OUT-p0533 | ra / 0,5333 | 0,0000 | 0,000 | 100% | 0 | 4,334 | 0,0000 | 0,000 / 2,491 | KHỚP |
| FG-OUT-p05-legacyK3 | ra / 0,5000 | 0,0000 | 2,527 | 91,17% | 53 | 4,481 | 0,0000 | 2,527 / **0,000** | XẤP XỈ‡ |
| SANITY-K-mid | — | 1,0000 | 3,303 | 87,18% | 119 | 5,839 | 0,0000 | 3,303 / **0,000** | LỆCH‡ |

† Sweep vô nghĩa (vacuous) ở các case alpha = 0 của fadeblack (đầu ra
là nền `#0a0c10` với mọi frame) và fadewhite (trắng thuần với mọi
frame) — sweep bằng 0 ở mọi dk là hệ quả, không phải bằng chứng
khóa frame. Ngược lại, các case alpha = 0 của fadegrays (xám theo
từng pixel nội dung) có sweep phân biệt thật (dk±1 ≈ 2,4–2,5).

‡ Hai case này KHÔNG được tính vào số dip sạch: frame app hiển thị
là frame k0+1 (sweep dk+1 = 0,000, maxDiff = 0 — khớp từng bit với
frame đó), không phải frame danh nghĩa k0. Xem §5: đây là hiệu ứng
lịch sử scrub, không phải lỗi dip; số dip sạch gồm 13 case KHỚP
(12 mới + FW legacy) — FG legacy và sanity cần probe §5 trước khi
trích dẫn, không được trích thành "dip lệch" hay "sanity lệch" mà
không kèm chú thích frame k0+1.

Đọc số đúng cách:

- Mọi case KHỚP đều là **đồng nhất từng bit** (maxDiff = 0, mean app
  = mean control tới 0,1), không phải "khớp trong ngưỡng" — chuỗi
  dip của app (kể cả vòng lặp ImageData xám từng pixel) đã được tái
  lập đúng hoàn toàn trên footage động.
- Artefact chuỗi cũ đo được trực tiếp: dip white 1,19–1,95; dip gray
  3,19–4,48; fadeblack (chuỗi cũ sai cả bước lẫn tọa độ, giống
  sanity) 1,89–2,68 ở alpha giữa; sanity 5,84. Con số này giải thích
  gọn số K3 cũ: FW-IN resampled 1,167 → 0,000 (chỉ artefact offset);
  FG-OUT resampled 4,186 → 2,527 ở playhead danh nghĩa nhưng 0,000
  ở frame kề (phần còn lại là lệch frame, xem §5, không phải dip);
  sanity resampled 5,583 → 3,303 ở playhead danh nghĩa, 0,000 ở
  frame kề (tương tự).
- Các case alpha = 0 là cửa ải mạnh nhất cho nhánh dip (đầu ra phải
  là dip thuần: nền/trắng/xám từng pixel) — mọi case đều ra đúng,
  nên nhánh dip chắc chắn đang chạy, không phải fallback đường vẽ
  thường (đường thường ở alpha = 0 cho fadeblack cũng ra nền, xem
  caveat §4).
- Sweep các case KHỚP có dk0 = 0,000 duy nhất là nhỏ nhất (dk±1 từ
  ~0,84 tới ~2,53, dk±2 tới ~6,76) — frame danh nghĩa được khóa độc
  lập, không phải may mắn.

## 3. Hồi quy: 18/18 KHỚP (không đổi so với K3)

Phiên hồi quy dùng đúng seed + case K3 (5 clip phẳng/tĩnh, project
1280×720, fps 30). Với nội dung này hình học exact = rounded nên
chuỗi cũ và chuỗi đúng cho cùng số — và số đó là 0,000 ở mọi case:

| Nhóm | Case | MAD | ≤8 | max | oldK3 | lock |
|---|---|---|---|---|---|---|
| Sanity | S1 đỏ, S2 xanh lá | 0,000 | 100% | 0 | 0,000 | 0,0000 |
| FW-OUT đỏ | p = 0,0333 / 0,1 / 0,5 | 0,000 | 100% | 0 | 0,000 | 0,0000 |
| FW-IN xanh lá | p = 0,1 / 0,5 / 0,7333 / 0,9333 | 0,000 | 100% | 0 | 0,000 | 0,0000 |
| FG-OUT xanh lá | p = 0,1 / 0,5 | 0,000 | 100% | 0 | 0,000 | 0,0000 |
| FG-IN magenta | p = 0,1 / 0,5 | 0,000 | 100% | 0 | 0,000 | 0,0000 |
| FG-OUT custom | p = 0,1 / 0,5 | 0,000 | 100% | 0 | 0,000 | 0,0000 |
| GRAD-FW-IN | p = 0,1 / 0,5 | 0,000 | 100% | 0 | 0,000 | 0,0000 |
| GRAD-FG-OUT | p = 0,5 | 0,000 | 100% | 0 | 0,000 | 0,0000 |

Kết luận được phép rút: việc sửa chuỗi đo không làm vỡ verdict dip
đã khóa của K3, và verdict đó tái lập được trên bundle mới
(`B1assKz-`). Không đo lại perf longtask (K3 §3 vẫn đứng: frame dip
luôn 1 longtask 50–118ms điều kiện yên tĩnh, frame thường không có).

## 4. Caveat trung thực: case fadeblack alpha = 0

FB-IN-p01 và FB-OUT-p0533 có alpha = 0 nên đầu ra kỳ vọng là nền
`#0a0c10` — về pixel thì không phân biệt được với "app không vẽ
được clip vì seek chưa xong" (bẫy khung tối của K3). Verdict KHỚP
của 2 case này vì vậy KHÔNG đứng một mình trên pixel, mà dựa thêm
vào: (i) `holdStats`: mỗi case draw tăng đúng 1, skip không tăng
(khác với lần đo sanity bị tối đầu tiên: skip tăng 1 — xem §5);
(ii) 2 case alpha giữa cùng clip (FB-IN-p0533, FB-OUT-p01) KHỚP
từng bit, chứng minh clip vẽ đúng; (iii) các case alpha = 0 của
fadewhite (trắng thuần) và fadegrays (xám từng pixel) phân biệt
được với khung tối và đều KHỚP từng bit. Trích dẫn 2 case FB alpha
= 0 phải kèm caveat này. Guard khung tối của harness (appMean ~ nền
trong khi kỳ vọng xa nền → retry) không kích hoạt ở 2 case này vì
kỳ vọng cũng là nền — đúng theo thiết kế, nhưng đó cũng chính là
lý do caveat tồn tại.

## 5. Hai anomaly: frame k0+1 và probe run 2

### 5.1 Hiện tượng (main run)

- FG-OUT legacy (playhead 11,5; localT 3,5; frame danh nghĩa k0 = 83,
  [3,46183, 3,50355)): app vs control k0 cho MAD 2,527; app vs control
  k0+1 = 84 cho **MAD 0,000, maxDiff 0**. Mean app [145,0 × 3] =
  mean của gray(frame 84), khác mean gray(frame 83) [145,5 × 3].
- SANITY (playhead 14,0333; localT 2,0333; k0 = 48): app vs k0 cho
  MAD 3,303; app vs k0+1 = 49 cho **MAD 0,000, maxDiff 0**.
- Cả hai đều: handleDelta = 0 (vạch playhead đọc độc lập khớp
  playhead dự đoán — playhead/store KHÔNG lệch), hold = 0 (không
  rơi nhánh hold-frame J4), draw tăng đúng 1 cho tick đo (FG legacy;
  sanity tăng 2 do guard retry đo 2 lần, xem §5.2), frameLock =
  0,0000 (control seek nhất quán), 0 exception.
- Điểm chung duy nhất lúc đầu: cả hai đều là bước scrub NGƯỢC đúng
  1 frame 30fps (2px ruler) so với playhead trước đó — FG legacy:
  11,5333 → 11,5; sanity: 14,0667 → 14,0333 (bước lùi của guard
  detour, xem §5.2). Mọi scrub khác trong main run đều xuôi, hoặc
  ngược lớn (FW-IN legacy: 7,5333 → 4,5 ngược 3,03s, vẫn KHỚP dk0).

### 5.2 Sanity main run và guard khung tối (đọc kỹ, dễ hiểu nhầm)

Lần đo sanity đầu tiên cho appMean ~ nền khung (video chưa seek
xong mà canvas đã đứng yên — đúng bẫy K3 §5.4) nên guard kích hoạt:
scrub tới 14,0667 rồi quay lại 14,0333, đo lại. Sau retry, holdStats
đi từ draw 14/skip 1 lên draw 16/skip 2: lần tối đầu tiên là 1 skip
(element chưa sẵn → drawVideoClip skip, canvas giữ nền), detour
14,0667 vẽ frame 49 (+1 draw), lần đo lại vẽ tiếp (+1 draw) nhưng
frame vẫn là 49. Tức là: **bước lùi 14,0667 → 14,0333 không đổi frame
element trước tick đo**, dù playhead/vạch đều chỉ 14,0333. Đây là
manh mối dẫn tới probe run 2, không phải bằng chứng app "seek sai"
nói chung (P4/P5 dưới đây cho cùng playhead ra frame đúng).

### 5.3 Probe run 2: cùng playhead, khác lịch sử scrub → khác frame

Probe run 2 (`R29L1_PROBE=1`, cùng bundle `B1assKz-`, cùng seed
footage, 0 exception, 0 retry ở mọi probe, draw +1/probe, handleDelta
= 0 mọi probe). Mỗi probe prescrub tới một playhead rồi mới scrub
tới target — bước cuối tới target mới là bước quyết định.

| Probe | Tiếp cận | Target | MAD dk0 | Sweep dk0 / dk+1 | Verdict |
|---|---|---|---|---|---|
| P1 FGOUT-legacy-fwd0 | 0 → 11,5 (xuôi xa) | 11,5 | 0,000 | 0,000 / 2,527 | KHỚP |
| P2 FGOUT-legacy-back1f | 11,5333 → 11,5 (ngược 1f, tái lập main run) | 11,5 | 0,000 | 0,000 / 2,527 | KHỚP |
| P3 FGOUT-legacy-fwd1f | 11,4667 → 11,5 (xuôi 1f) | 11,5 | 0,000 | 0,000 / 2,527 | KHỚP |
| P4 SANITY-fwd0 | 0 → 14,0333 (xuôi xa) | 14,0333 | 0,000 | 0,000 / 3,303 | KHỚP |
| P5 SANITY-fwd1f | 14,0 → 14,0333 (xuôi 1f) | 14,0333 | 0,000 | 0,000 / 3,303 | KHỚP |
| P6 SANITY-back1f | 14,0667 → 14,0333 (ngược 1f) | 14,0333 | 3,303 | 3,303 / **0,000** | LỆCH |

Đọc đúng từng dòng:

- **Sanity back1f tái lập DETERMINISTIC 2/2** (main run + P6) với
  sweep đồng nhất từng chữ số (8,021 / 5,933 / 3,303 / 0,000 / 3,210)
  — cùng playhead 14,0333 cho frame 48 khi tiếp cận xuôi (P4/P5)
  và frame 49 khi tiếp cận ngược 1f (P6). Ánh xạ playhead → frame
  vì vậy KHÔNG bị hỏng tổng quát; nó phụ thuộc lịch sử scrub trong
  trường hợp ngược 1f này.
- **FG back1f KHÔNG tái lập** (main run lệch, P2 đúng): anomaly FG
  main run là một lần bắt frame cũ thoáng qua, không phải quy luật
  "ngược 1f luôn sai". Đối xứng kiểm chứng: dk+1 của P1/P2/P3 =
  2,527 đúng bằng MAD dk0 của FG legacy main run; dk+1 của P4/P5 =
  3,303 đúng bằng MAD dk0 của sanity main run — hai frame 83/84 và
  48/49 chỉ đổi vai trò cho nhau, không có frame thứ ba nào xuất
  hiện. Mọi frame thực tế xuất hiện đều khớp control từng bit.
- Vì vậy: **không case nào trong §5 là bằng chứng dip lệch, và cũng
  không case nào là bằng chứng playhead lệch** (vạch khớp, hold = 0).
  Chúng là bằng chứng của một hiệu ứng chọn frame theo lịch sử scrub
  ở đường scrub → capture, cần probe tách bạch (xem §5.4).

### 5.4 Các giả thuyết đã loại trừ và cái còn mở

- **Lệch playhead/store — LOẠI TRỪ:** handleDelta = 0 ở mọi case và
  mọi probe (vạch đọc độc lập từ DOM khớp playhead dự đoán). Nếu
  store ở 11,5333/14,0667 thì vạch đã lệch +1 frame; nó không lệch.
- **Hold-frame J4 — LOẠI TRỪ:** hold = 0 ở mọi case/probe; draw
  tăng đúng 1 mỗi tick đo. Frame đo được là frame draw tươi, không
  phải frame giữ cũ.
- **Lệch màu/decode — LOẠI TRỪ:** frame thực tế (k0+1) khớp control
  từng bit (maxDiff = 0) nên decode, màu, resample, dip đều đúng;
  chỉ có CHỈ SỐ frame là khác. Lệch màu/decode không thể cho
  maxDiff = 0 ở frame kề trong khi lệch ở frame danh nghĩa.
- **Epsilon seek đồng nhất — LOẠI TRỪ:** các case p = 0,5333 nằm
  cách biên frame chỉ 0,0089s mà vẫn KHỚP dk0 — mọi epsilon seek
  > 0,0089s đều đã làm chúng lệch sang frame kề; chúng không lệch.
- **Khoảng cách decode từ keyframe — LOẠI TRỪ (đo GOP):** K chỉ có
  15 keyframe, keyframe đầu 0,0 rồi 4,588, 8,884… — mọi seek đầu
  phiên đều decode từ keyframe 0,0. FG cần decode ~84 frame (tới
  3,5s) mà thường đúng; sanity chỉ ~49 frame (tới 2,03s) mà tái lập
  sai — khoảng cách decode không giải thích được chiều này.
- **Còn mở (giả thuyết mạnh nhất, CHƯA chứng minh):** tick render
  vẽ frame hiện tại của element trước khi seek lùi nhỏ hoàn tất,
  và settle bằng hash canvas không phát hiện được "seek đang bay"
  (canvas tĩnh ở frame cũ cũng "ổn định"). Nó giải thích được cả
  P6 deterministic lẫn FG main-run thoáng qua (tải VM lúc đó khác
  nhau), nhưng P2-vs-P6 bất đối xứng (cùng dạng bước lùi 1f, khác
  clip/đường vẽ) vẫn chưa có lời giải — có thể liên quan đường
  dip vs đường thường, hoặc trạng thái element trước bước lùi, đều
  chưa đo. **Follow-up đề xuất (không làm trong luồng này):** probe
  đọc trực tiếp `seeking`/`currentTime`/`readyState` của element
  app (cần hook đo vào MediaPool, ngoài phạm vi harness CDP hiện
  tại) + settle chờ seeked thật rồi mới capture; lặp lại dạng P6
  với các clip/đường vẽ khác để tách "clip/đường" khỏi "hướng
  scrub". Cho tới lúc đó, mọi claim về scrub ngược 1f phải ghi là
  "hiệu ứng chọn frame theo lịch sử scrub, cơ chế chưa khóa" —
  cấm trích thành bug seek của app, cũng cấm trích thành lỗi
  harness (chưa tách được hai cửa).
- **Hệ quả thực tế cho người dùng:** scrub ngược 1 frame rồi nhìn
  frame ngay có thể thấy frame cũ hơn 1 frame nguồn trong một số
  trường hợp — nhưng đây là đường scrub-pause đo bằng harness, chưa
  phải bằng chứng về phát lại bình thường (phát xuôi seek liên tục,
  không scrub từng frame ngược). Không đổi hành vi app từ bằng
  chứng này.

## 6. Quyết định không sửa code sản phẩm (tiêu chí theo nhiệm vụ)

Nhiệm vụ yêu cầu chỉ sửa code sản phẩm khi phép đo chứng minh được
nguyên nhân VÀ sửa làm số đo tốt lên thật. Ở đây:

- Nguyên nhân của số dip cũ đã chứng minh xong và nằm ở **chuỗi đo**
  (offset làm tròn + số bước resample sai nhánh) — sửa chuỗi đo đã
  đưa 13 case về 0,000. Không còn dư số dip nào để sửa app.
- Hai anomaly còn lại chứng minh được "frame thực tế là k0+1 và
  đúng từng bit", nhưng chưa chứng minh được nguyên nhân nằm ở
  code app (seek) hay ở phương pháp capture (settle không phát hiện
  seek bay). Mọi "sửa" ứng viên (ép seek, đổi settle, thêm epsilon)
  đều chưa có phép đo nào cho thấy làm số tốt lên thật — và sửa
  seek theo phỏng đoán có thể phá đường phát lại bình thường.
- Vì vậy: 0 file `src/` đổi trong luồng này. Harness K3 được vá tối
  thiểu theo §7 (harness, không phải sản phẩm).

## 7. Vá harness K3 + quy tắc cho luồng sau

Trong luồng này, ngoài harness v29 mới, file harness K3
(`apps/web/scripts/clicktest-dip-browser-pipe.mjs`) được vá TỐI
THIỂU đúng 2 điểm đã chứng minh (diff xem ở cuối §7; file đã qua
`node --check`, **CHƯA chạy lại end-to-end bằng browser trong luồng
này** — logic vá là cùng code đã chạy trong harness v29, nhưng ai
chạy lại K3 sau vá phải coi lần chạy đó là lần kiểm chứng đầu tiên
của bản vá, không được trích số cũ):

1. Tọa độ letterbox exact, bỏ `Math.round`: `dw/dh/cx0/cy0` tính
   trực tiếp từ `cs` (K: dx = 437,5). Với video phẳng 1280×720 thì
   exact = rounded nên 18 case K3 không đổi theo lý thuyết.
2. Cột resampled rẽ nhánh theo đường app: case sanity (`mode =
   null`) dùng chuỗi 1 bước (video thẳng lên device dưới viewport
   transform) thay vì 2 bước như trước; case dip white/gray giữ
   chuỗi 2 bước (đúng nhánh dip) nhưng với tọa độ exact. (K3 không
   có case fadeblack; nếu thêm case fadeblack vào K3 sau này thì
   cột resampled của nó phải dùng chuỗi 1 bước + `globalAlpha`
   như harness v29, không được dùng chuỗi 2 bước.)

Quy tắc cho mọi harness đo footage động sau này (bổ sung L1 §7):

1. Control phải mirror đúng nhánh app: tọa độ thực + số lần
   drawImage + transform đang mang của đúng nhánh đó (dip = 2 bước,
   thường/fadeblack = 1 bước). Không có "chuỗi chung" cho mọi case.
2. Sweep theo lưới fps gốc, seek giữa frame; case p nằm sát biên
   frame nguồn (< 0,005s) phải gắn cờ legacy-p và luôn kèm sweep.
3. **Settle bằng hash canvas là CHƯA ĐỦ cho scrub:** canvas tĩnh
   không phân biệt được "seek xong, frame đúng" với "seek đang bay,
   frame cũ". Harness sau nên chờ trạng thái seek thật (seeking /
   currentTime của element app) hoặc settle dài + đo lại sau 2s,
   và phải báo cáo hướng scrub (xuôi/ngược, bước bao nhiêu frame)
   cho mọi case footage — như §5 cho thấy, hướng scrub là biến số
   đo, không phải chi tiết triển khai.
4. Mọi số footage-động cũ dùng chuỗi K3 (sanity 5,583; FW-IN 1,167;
   FG-OUT 4,186) từ nay phải gắn nhãn "mang baseline artefact chuỗi
   đo cũ" khi trích dẫn; số thay thế là §2 của file này (và probe
   §5 cho 2 case anomaly).

## 8. Kiểm chứng và file đổi/thêm

- `node --check apps/web/scripts/clicktest-dip-footage-round29-l1.mjs`:
  pass (trước cả 2 phiên). `node --check` harness K3 sau vá: pass.
- Main run exit = 1 theo đúng thiết kế gating (13/15 footage KHỚP
  + 18/18 hồi quy; 2 case anomaly không KHỚP ở playhead danh nghĩa
  nên exit 1 — exit này là TÍN HIỆU, không phải lỗi harness: mọi
  probe đều hoàn thành, 0 exception, JSON đầy đủ).
- Probe run 2 exit = 0 (diagnostic, không gating verdict: 6/6 probe
  có verdict, 0 ERROR, 0 exception).
- JSON kết quả đã kiểm tra đọc lại được bằng Python (bundle, canvas,
  sweep, holdStats, means đều khớp log trong lúc chạy); sweep dk+1
  của các case anomaly có maxDiff = 0 (đối chứng bit-exact, không
  chỉ MAD trung bình).
- KHÔNG push GitHub, KHÔNG ghi qua GitHub connector, KHÔNG
  release/tag, KHÔNG binary vào repo (video đo + snapshot dist +
  grad.png chỉ ở `~/workspace/tmp-round29-l1/`, ngoài repo; trong
  repo không có file .mp4/.png/.raw nào mới). KHÔNG tự ghi file
  paths-loop, KHÔNG ghi build-loop-log (parent lo, theo tiền lệ).
  KHÔNG sửa file `src/` nào.

File đổi/thêm (text, không binary — parent gộp batch):

- Mới: `apps/web/scripts/clicktest-dip-footage-round29-l1.mjs` —
  harness v29 (2 phiên: hồi quy 18 case K3 + footage 15 case bằng
  chuỗi đúng; diagnostic oldK3 + frameLock + sweep lưới fps gốc +
  guard khung tối; chế độ probe `R29L1_PROBE=1` với prescrub theo
  hướng tiếp cận; cổng/display qua env, mặc định :99/4199).
- Mới: `benchmarks/results/v29-l1-dip-footage.json` — main run
  (18 hồi quy + 15 footage + proxy diag + exceptions + log đầy đủ).
- Mới: `benchmarks/results/v29-l1-dip-footage-probe2.json` — probe
  run 2 (6 probe P1–P6 + proxy diag + log đầy đủ; cùng bundle với
  main run).
- Mới: `docs/PHASE9_ROUND29_L1_DIP_FOOTAGE_LIMITS.md` — file này.
- Sửa (tối thiểu, xem diff): `apps/web/scripts/clicktest-dip-browser-pipe.mjs`
  — (1) bỏ `Math.round` ở `dw/dh/cx0/cy0` trong `pageMeasureCase`;
  (2) cột resampled rẽ nhánh: sanity (`mode = null`) dùng chuỗi
  1 bước video → device dưới viewport transform, dip white/gray
  giữ chuỗi 2 bước với tọa độ exact. Cột point-sampled, case, seed,
  perf probe giữ nguyên. **Lưu ý: bản vá chưa chạy lại end-to-end
  bằng browser trong luồng này.**

Không sửa code sản phẩm (không file `src/` nào đổi trong luồng này).
