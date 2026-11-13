# PHASE9_ROUND98_Z2_GHOST_RESIDUAL_LIMITS — chẩn đoán mức pixel residual 13,8%

> Luồng Z2, đợt 98, lượt cron 21:35 +07 12/11/2026. Repo `~/workspace/repo-1` (cây làm việc).
> KHÔNG push. KHÔNG release/tag. Không đụng TTS 39, birefnet, `.github/workflows`, 0 binary.
> **Kết quả chính: giả thuyết RACE PIXELS LÚC CAPTURE BỊ BÁC BỎ làm cơ chế chính
> của residual 13,8% — 136/138 snapshot có pixels khớp nhãn, 0 ca lệch −1 thật,
> chỉ 2 ca lệch +1 thật (1,4%, callback trễ ~18 ms). 23 ca "lệch −1" ở lần chạy
> đầu là ẢO: clip gốc có frame trùng nhau (6k+2 == 6k+3) + matcher tie-break sai.
> Cơ chế thay thế có bằng chứng MỘT PHẦN: race FRAME HIỆN TẠI lúc blend (curPix
> lệch ±1 rõ ràng ở 8/23 outlier = 35% so với 9/58 đối chứng = 16%) — gợi ý
> mạnh nhưng chưa kết luận chắc (n nhỏ, chế độ đo THƯA). KHÔNG sửa production.**

## 0. Môi trường đo

- Boot #20 (reboot 13:24:41Z). Lượt chạy 14:49–14:52Z, ngay trước reboot #21 (~15:28Z).
- Baseline cây lúc sửa: `preview.tsx` md5 `a0a078e1` (gộp đợt 97); sau sửa Z2:
  `6cff69f2` (marker "Đợt 98 Z2" ×10). **Probe chạy trên md5 `7238158c`** — luồng
  Z3 sửa xen giữa (marker "Đợt 98 Z3" ×7, vùng detector re-arm dòng 5355–6992,
  không đụng blend/pump/ring; marker Z2 ×10 còn nguyên lúc probe chạy).
- Vite riêng Z2 trên 5173 (pid 21110), đã verify serve code Z2 trước probe
  (grep `Đợt 98 Z2`/`__vcutRvfcBlendTick` trong preview.tsx serve được).
- Probe: `probe91s1-motionblur-rvfc.cdp.mjs --cases a,b,c,d,e --passes 5 --assert
  --cdp-port 9239` (y hệt Y2, chỉ đổi cổng CDP tránh va chạm luồng khác).
- **Tải nặng suốt lượt** (load 8,75 lúc bắt đầu, 10,31 lúc kết thúc — các luồng
  đợt 98 khác chạy probe song song): capture THƯA — case B chỉ 138 capture
  (Y2 dense: 1464), 81 mẫu hợp lệ (Y2: 1565), 181 blend tick. Mọi tỉ lệ
  outlier/phase dưới đây gắn caveat "chế độ thưa", không so trực tiếp được
  với số dense của Y2.

## 1. Instrumentation đã thêm (chỉ đo, không đổi hành vi)

### 1.1 Strip pixels snapshot lúc capture (`pix`, marker "Đợt 98 Z2" ×6)

- Helper `sampleStripeStrip(cv, ctx)`: 48 mẫu kênh G trên hàng giữa canvas,
  từ x = 20% w, trả base64 của 48 byte. 1 `getImageData` 48×1 mỗi lần gọi
  (~chục µs), ngay sau `drawImage` trong `rvfcCaptureFrame` — strip chính là
  pixels snapshot giữ. Tọa độ tương đối nên dùng được cả 2 mode snapshot.
- `RvfcPumpState.lastPixStrip/lastPixW/lastPixH` (đặt trong `rvfcCaptureFrame`);
  `RvfcPumpSample.pix/pixW/pixH` (ghi trong closure `pumpEvent`, CHỈ khi
  decision là capture/reset-capture — strip cũ không được gán nhầm).
- Phủ: 138/138 capture case B có `pix` (100%), `pixW/H = (640, 360)` mọi capture.
  `capMs` trung vị 9,25 ms (p90 67,91, max 102,60 — nhiễm tải).

### 1.2 Strip pixels frame hiện tại lúc blend (`curPix`, marker ×3)

- Map `blendCurrentPixStrip`: đường mask đặt strip của `rawUnit` (chính là
  canvas frame hiện tại mà blend vừa dùng) trước khi gọi
  `recordDrawnBlendWindow`; hàm này đọc rồi xoá (1 tick dùng 1 lần).
  `RvfcBlendTickSample.curPix` — đường thường (không mask) không có canvas
  riêng nên null ở đường đó.
- Phủ: 181/181 tick case B có `curPix` (100%).

### 1.3 Hàng G lõi cho metric pha (`coreRowG`, marker ×1 trong probe)

- `__p3measure()` trả thêm `coreRowG` + `coreRowX0` (cùng `ImageData` với
  gStd, không tốn thêm lần đọc canvas): hàng G trong lõi đo, để tính pha
  sọc offline (xem §4).

## 2. Đính chính hình học Y2 v5 (phát hiện khi lần chạy 1 cho kết quả rác)

- Spec `b-blur.json` meta: `width=1280, height=720` → **project thật là
  1280×720, không phải 512×360 như Y2 v5 giả định**. Snapshot unit:
  s = min(1, 640/1280) = 0,5 → snap **640×360**, video kín khung (khớp
  `pixW/H` đo được). Preview canvas 872×276: s = 0,38333 (khớp log probe),
  video 490,7×276 @ x=190,65; lõi x[387,485], y[115,161].
- Lần chạy 1 của Z2 dùng hình học 512×360: **0/138 strip khớp tốt**
  (hamming 10–14, best hệ thống = label−1) — kết quả rác, đã bỏ. Sau khi
  sửa hình học: 138/138 khớp tốt (hamming ≤ 6, hầu hết = 0).
- Kết luận mức gStd của Y2 vẫn đứng (tỉ lệ cửa sổ/chu kỳ sọc giống nhau ở
  cả 2 hình học nên 2 mức 37/84 không đổi), nhưng **pha tuyệt đối và strip
  snapshot trong Y2 v5 là sai** — không dùng số pha/strip của Y2 v5.
- Không sửa file Y2 (chỉ ghi đính chính ở đây để LIMITS gộp đợt 98 dẫn).

## 3. Verdict 1 — race pixels lúc capture: BÁC BỎ làm cơ chế chính

### 3.1 Phương pháp

- Ground truth: giải mã `stripes-scroll.mp4` (90 frame, dùng lại PNG của Y2),
  mô phỏng snapshot unit (resize BILINEAR 1280×720 → 640×360, strip y=180,
  x=128..175, kênh G, ngưỡng 128 → 48 bit).
- Đối chiếu: strip đo được khớp với frame nguồn nào trong label±3
  (hamming ≤ 2 = khớp tốt). Phân loại theo TẬP khớp, không chọn 1 frame
  "tốt nhất" (xem §3.2 vì sao).

### 3.2 Phát hiện then chốt — clip gốc có frame TRÙNG NHAU

- **15 cặp frame nguồn pixel-identical: (6k+2, 6k+3)** với k=0..14
  (vd 2==3, 8==9, 14==15, …; full-frame max|diff| ≤ 4, mean 0,00 — chỉ nhiễu
  nén). Pattern sọc cuộn theo bước: giữ yên 2 frame rồi nhảy, chu kỳ 6 frame.
- Hệ quả 1: strip của frame 6k+3 GIỐNG HỆT strip của 6k+2 — snapshot nhãn
  6k+3 mà strip khớp 6k+2 là **không phân biệt được với snapshot đúng pixels**,
  không phải bằng chứng race.
- Hệ quả 2: strip chỉ xác định được frame **mod 5** (scroll 4,8 px/frame tại
  snap, chu kỳ sọc 24 px → 5 frame = đúng 1 chu kỳ; đo được h(f,f+5) = 0 ở
  71/85 frame, mean 4,0). Mọi kết luận "lệch ±1" phải đọc theo mod 5; cửa sổ
  lệch đúng 5 frame không phân biệt được bằng strip (hiếm, cần nhãn khác hỗ trợ).
- Lần chạy đầu của Z2 (matcher chọn frame nhỏ nhất khi hòa): báo 23 ca
  "content = label−1" — TOÀN BỘ là nhãn ≡3 mod 6, tức đúng các cặp trùng
  (6k+3 vs 6k+2). Sau khi sửa matcher thành phân loại theo tập khớp: 23 ca
  này đều có h(label) = 0 (strip khớp cả nhãn lẫn frame kề) → **không phải race**.

### 3.3 Số liệu quần thể (case B, n=138 capture)

- Pixels **khớp nhãn: 136/138 (98,6%)** — trong đó 52 ca strip còn khớp thêm
  frame kề (do frame trùng / tuần hoàn 5 frame, xem §3.2).
- **Lệch −1 thật: 0/138. Lệch +1 thật: 2/138 (1,4%)** — seq=285 (label 39 →
  content 40, h(label)=24) và seq=292 (label 51 → content 52, h(label)=24):
  cả 2 đều lateMs ~17–20 ms, ctDeltaMs 13,0/26,9 ms — callback bắn trễ ~nửa
  khung, element đã sang frame kế nhưng `currentTime` chạy sau trình chiếu
  nên guard freshness (ngưỡng 1/fps + 0,5 ms theo currentTime) không chặn.
  Đây là mislabel thật nhưng HIẾM (1,4%), không giải thích được residual 13,8%.
- Không capture nào không khớp frame nào gần nhãn (0/138) — hình học mô phỏng đúng.

### 3.4 Kết luận

- **Giả thuyết "snapshot nhãn K chứa pixels K−1 do drawImage đua với element
  chuyển frame" BỊ BÁC làm cơ chế chính của residual 13,8%**: ở quần thể,
  snapshot chứa đúng pixels nhãn của nó (98,6%); lệch −1 thật = 0.
- Không đề xuất/sửa cơ chế đồng bộ capture nào: không có cơ chế nào đủ bằng
  chứng để sửa, và tỉ lệ race đo được (1,4%, hướng +1) quá nhỏ so với residual.
- Nợ nhỏ còn lại: 2 ca +1 thật (callback trễ ~18 ms, guard không chặn) — xem
  lại ngưỡng guard freshness ở đợt sau (có đo dense, xem §6).

## 4. Verdict 2 — race frame HIỆN TẠI lúc blend: có bằng chứng một phần

### 4.1 Phương pháp

- Mỗi mẫu gStd case B được nối với blend tick gần nhất cùng pass (chia pass
  theo biên reset-capture của pump log — cùng đồng hồ `performance.now`),
  khớp nhãn (presented, expected, ringLast, ringPrev, ringSize, skippedLatest)
  + `currentTime` ≤ vt + 5 ms, lấy tick muộn nhất. `curPix` của tick đó đối
  chiếu với frame P như §3 (tập khớp, ngưỡng hamming ≤ 2).
- Outlier = mẫu có |đo − triple(P)| ≥ 10 (dự đoán triple(P) mô phỏng, chuẩn
  hóa baseline như Y2 v6). Chế độ thưa: dự đoán khớp trong ±5 chỉ 54/81
  (66,7%, Y2 dense: 86,2%) — outlier ở đây gồm cả cửa sổ gap do capture thưa,
  không chỉ residual dense của Y2.

### 4.2 Số liệu

- Outlier n=23: ghost snapshot sạch 12, lệch thật 1, không dữ liệu 10;
  **curPix sạch 11, lệch rõ (±1, single-match) 8, đa-khớp mơ hồ 4**.
- Đối chứng (không outlier) n=58: **curPix sạch 42, lệch rõ 9, đa-khớp 7**.
- Tỉ lệ lệch rõ: outlier **8/23 = 35%** vs đối chứng **9/58 = 16%** (giàu
  ~2,2×, Fisher một phía p ≈ 0,07) — **gợi ý mạnh nhưng chưa kết luận chắc**.
- Hướng lệch curPix ở outlier: +1: 6 ca (P→P+1: 9→10, 33→34, 5→6, 11→12,
  39→40, 59→60); −1: 2 ca (49→48, 66→65). +1 chiếm đa số — đúng hướng kỳ
  vọng: tick chạy sau khi element lật sang frame kế nhưng ước lượng
  presented vẫn là P (callback rVFC cho P+1 chưa bắn/kịp cập nhật).
- 1 outlier ghost lệch thật: pass 4, P=59, ghost 51 chứa pixels 52 (chính là
  capture +1 seq=292 ở §3.3) + curPix 60 (+1) — cửa sổ hiệu dụng {50,52,60},
  đo 82,9 vs pred 37,5. Ca này cho thấy cả 2 race (capture +1 và blend +1)
  có thể cùng xuất hiện ở 1 tick, nhưng n=1.
- 10/23 outlier ghost "không dữ liệu": snapshot của ghost do **đường tick**
  nuôi (pump chết/khởi động lại lúc đó dưới tải — `pix` chỉ instrument đường
  rVFC, không phủ đường tick). Đây là lỗ phủ của chẩn đoán, không phải bằng
  chứng sạch/lệch.

### 4.3 Kết luận

- **Cơ chế thay thế có bằng chứng một phần**: frame hiện tại vẽ live từ
  element lúc blend đôi khi là P±1 thay vì P (đặc biệt +1), và hiện tượng này
  giàu hơn ở outlier. Một shift ±1 của frame hiện tại đổi cửa sổ hiệu dụng
  (vd {P−2,P−1,P+1} thay vì {P−2,P−1,P}) và có thể lật mức gStd ở pha nhạy —
  đúng hướng giải thích residual.
- **Chưa đủ để đóng residual**: n nhỏ (23 outlier, chế độ thưa), p ≈ 0,07,
  và 11/23 outlier có curPix sạch (residual còn nguồn khác chưa rõ — có thể
  do cửa sổ gap dưới tải, hoặc do chính phép đo gStd). Cần đo lại ở chế độ
  dense (xem §6) trước khi bàn fix (vd: đợi element chuyển frame / khóa
  presented theo captureTime).
- Không sửa production: chưa có fix nào được chứng minh + chưa có test hồi quy.

## 5. Metric thay gStd: pha sọc — đo thử, chưa đủ bằng chứng thay thế

- Đề xuất: **pha cơ bản của sóng vuông trên hàng G lõi** (`coreRowG`).
  Trung bình 3 frame có trọng số đối xứng giữ nguyên pha của frame giữa
  (hệ số 1+2cos(ω·scroll) ≈ 1,6 > 0 với chu kỳ ~18,4 px, scroll ~3,7 px/frame
  tại canvas), nên pha xác định frame giữa của cửa sổ hiệu dụng — là đại
  lượng liên tục, không nhạy pha như std (std chỉ có 2 mức rời rạc trên
  pattern này).
- Đo thử trên dữ liệu thật (case B, cửa sổ triple liên tiếp, n=17 — nhỏ do
  chế độ thưa): pha → đúng frame giữa P−1 ở **13/17 = 76,5%** (lệch −1: 1,
  +1: 3), so với gStd cùng đợt thưa 66,7% (Y2 dense: gStd 86,2%).
- **Chưa đủ bằng chứng để thay gStd**: n=17 quá nhỏ; pha chỉ xác định frame
  giữa **mod ~5** (chu kỳ 24 px / scroll 4,8 px/frame tại snap → đúng 5 frame
  = 1 chu kỳ; xem §3.2) nên không phân biệt được cửa sổ lệch đúng 5 frame
  (cần nhãn khác hỗ trợ); và pha của frame trùng (6k+2 == 6k+3) cũng trùng nhau.
- Hướng sau: đo lại dense với n lớn; nếu pha đạt ≥90% trong khi gStd vẫn
  ~86% thì đưa pha vào assert song song với gStd (không thay hẳn — gStd vẫn
  là chuẩn chính cho tới khi pha chứng minh hơn hẳn).

## 6. Kiểm chứng

- tsc web **0** (apps/web, sau sửa Z2). Vite build **PASS 17,68 s**.
- ghostBlend probe **15/15** (`node --experimental-strip-types
  apps/web/src/lib/ghostBlend.probe.test.ts`, exit 0).
- Probe parity assert: **exit=1, chỉ 1 fail** — case b gStd spread median
  33,9 > 15 (max 46,5, nGroups=5, skipped=101): cùng bệnh nhạy pha đã biết
  từ X2/Y2, không phải hồi quy do Z2 (Z2 chỉ thêm log đo, không đổi toán blend).
- O8 / các test khác **không chạy lại** trong luồng này (Z2 không đụng toán
  blend/render; Y10 đã xanh toàn bộ trên cây gộp đợt 97). Riêng
  previewEngine chạy lại: **25/25 PASS** (node --experimental-strip-types,
  exit 0).

## 7. Nợ mở (cho đợt sau)

1. **Residual 13,8% — CHƯA ĐÓNG, đã thu hẹp.** Race capture bị bác (0% −1
   thật). Ứng viên còn lại: race frame hiện tại lúc blend (bằng chứng một
   phần §4). Cần **đo lại ở chế độ dense** (cửa sổ yên load<2, như Y2 lần 2)
   để xác nhận tỉ lệ curPix lệch ở outlier vs đối chứng với n lớn + đánh giá
   metric pha (§5). Không sửa production cho tới khi có số dense.
2. **Phủ pix cho snapshot đường tick**: `pix` hiện chỉ có ở đường rVFC
   (`rvfcCaptureFrame`); snapshot đường tick (`updateMotionBlurSnapshots`,
   nuôi ring khi pump chết) không có fingerprint → 10/23 outlier ghost không
   đối chiếu được. Thêm strip vào đường tick ở đợt sau.
3. **2 ca capture +1 thật** (callback trễ ~18 ms, guard freshness không chặn
   vì currentTime chạy sau trình chiếu): xem lại ngưỡng guard (có nên dùng
   captureTime/expectedDisplayTime thay cho currentTime?).
4. **Đính chính Y2 v5**: project 1280×720 (không phải 512×360) — ghi vào
   LIMITS gộp đợt 98; số mức gStd của Y2 không đổi, chỉ pha/strip tuyệt đối sai.
5. **Đứng yên theo LIMITS gộp đợt 97 §4**: 2 MiB; re-arm (Z3 đang làm);
   watchdog freeze; blur D fix-3 ~1%; zombie pump 2 tàn dư; EPERM probe #17 +
   khoảng mù #16 (reboot #21 dự kiến ~15:28Z); harness; G1 chờ user quyết;
   TTS 39 cấm; birefnet chờ RAM; ci-security.yml 403; release gate không đổi.

## 8. File Z2 tạo/sửa (batch stage)

- `apps/web/src/preview.tsx` — `pix` (pump event) + `curPix` (blend tick) +
  helper `sampleStripeStrip` (10 marker "Đợt 98 Z2"; chỉ vùng ring/blend;
  không chạm drift Y4 / watchdog Y5 / clip-change Y7 / re-arm Z3).
- `apps/web/scripts/probe91s1-motionblur-rvfc.cdp.mjs` — `coreRowG`/`coreRowX0`
  trong `__p3measure` (1 marker "Đợt 98 Z2"; assert cũ giữ nguyên).
- `docs/PHASE9_ROUND98_Z2_GHOST_RESIDUAL_LIMITS.md` — file này.
- Scratch đo (không vào batch): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round98-z2/`
  (`preview-abcde-assert98z2.json`, `assert98z2.log`, `analyze-z2.py`,
  `analyze-z2.txt`, `vite-5173-z2.log`, `ghostblend-z2.log`).
- Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round98-z2-ghost-residual.txt`
  (NUL-delimited). KHÔNG push GitHub; user tự push sau từ main chat.
