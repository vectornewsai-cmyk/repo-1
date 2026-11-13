# PHASE9_ROUND97_Y2_GHOST_DOUBLECOUNT_LIMITS — pump event log + chẩn đoán cụm double-count 84

> Luồng Y2, đợt 97, lượt cron 18:35 +07 12/11/2026. Repo `~/workspace/repo-1` (cây làm việc).
> KHÔNG push. KHÔNG release/tag. Không đụng TTS 39, birefnet, `.github/workflows`, 0 binary.
> **Kết quả chính (ĐÃ PHÁN QUYẾT, 2 lượt đo + mô phỏng pixels thật): cụm 84
> KHÔNG phải double-count — nó là triple ĐÚNG {K−2,K−1,K} đo ở pha sọc
> K mod 6 ∈ {3,4}, nơi trung bình 3 khung của sóng vuông này có std ~84
> thay vì ~37. Chữ ký mislabel TRỄ-callback gần như không tồn tại ở chế
> độ sạch (1/1257 capture, 0,08%, biên seek); callback bắn SỚM −1 khung
> thường xuyên nhưng snapshot chứa đúng pixels nhãn của nó (mô hình
> "nội dung = nhãn−1" SAI: dự đoán 79,8% so với 86,2% của mô hình nhãn).
> Còn lại 71/515 mẫu case B (13,8%) đo mức ngược với triple(P) trong khi
> cửa sổ NHÃN là triple liên tiếp hoàn hảo (ring liên tiếp, toàn capture,
> không skip) — không cơ chế metadata nào giải thích được; ứng viên duy
> nhất còn lại là race pixels lúc capture (drawImage chạy trước/sau khi
> element chuyển frame), cần chẩn đoán mức pixel để xác nhận. KHÔNG sửa
> production trong luồng này (không có cơ chế nào được chứng minh + không
> có test hồi quy cho nó).**

## 0. Môi trường đo

- Boot d8dc09fe (reboot #19, 11:30:25Z). Không có `round-in-progress.md`.
- Baseline cây: `preview.tsx` md5 6cac637d (đúng build fix-3 X2+X4 của X5b),
  `probe91s1-motionblur-rvfc.cdp.mjs` md5 22336d46.
- Vite riêng Y2 trên 5173 (pid 15903), đã verify serve code Y2 trước mỗi lượt
  (grep `__vcutRvfcBlendTick` / `recordRvfcBlendTick` / `ctAtInvoke` / `lateMs`).
- 8–10 luồng Y đợt 97 chạy song song (Y1/Y3/Y5/Y6/Y7/Y8/Y10): cửa sổ yên hiếm,
  tải biến động mạnh trong lượt (xem §1).
- Harness: `probe91s1-motionblur-rvfc.cdp.mjs --cases a,b,c,d,e --passes 5 --assert`
  (y hệt X2) + dump Y2 theo case. Phân tích offline:
  `hidden_files/round97-y2/analyze-y2.py` (v1), `analyze-y2b.py` (v2,
  phân loại theo nội dung thật của cửa sổ blend), `analyze-y2c.py` (v3,
  quét feature), `analyze-y2d.py` (v4, cụm theo pha tuyệt đối),
  `analyze-y2e.py` (v5, mô phỏng gStd trên pixels thật của clip bằng
  ffmpeg+numpy — không qua browser), `analyze-y2f.py` (v6, dự đoán mức
  từ triple(P)), `analyze-y2g.py` (v7, cửa sổ thật từ tick — DÙNG SAI
  ghost khi skp=1, xem §3.7), `analyze-y2h.py` (v8, cửa sổ nội dung),
  `analyze-y2i.py` (v9, outlier khớp cửa sổ nào), `analyze-y2j.py`
  (v10, nhãn ghost thật của outlier).

## 1. Pump event log (đã cài — phần việc chính của luồng)

### 1.1 Thiết kế (chỉ đo, không đổi hành vi production)

- Mở rộng `RvfcPumpSample` (`__vcutRvfcPump`, đã có từ U1 đợt 93) với 7 trường
  Y2, ghi trong `rvfcCallback` (marker "Đợt 97 Y2" ×13 trong `preview.tsx`):
  `ctAtInvoke` (currentTime lúc callback chạy), `ctFrameIdx`
  (videoFrameIndex của nó), `lateMs` = tInvoke − expectedDisplayTime
  (callback delay), `presentedAtInvoke` (ước lượng presented NGAY TRƯỚC khi
  callback này cập nhật lastPresented), `ringSize`/`ringLast`/`ringPrev`
  (nhãn ring lúc ghi event).
- Thêm `RvfcBlendTickSample` (`__vcutRvfcBlendTick`, ghi trong
  `recordDrawnBlendWindow`, mỗi tick blend thành công): `tBlend, clipId,
  presented, expected (frameIdx), currentTime, skippedLatest, ringSize,
  ringLast, ringPrev, viaRvfc, lastPumpSeq, lastPumpLateMs, lastPumpCtDeltaMs`.
  `currentTime` truyền từ 3 call site trong drawVideoClip
  (srcEl.currentTime khi là video, null khi held canvas); `lastPump*` đọc
  từ 3 trường mới của `RvfcPumpState`, cập nhật trong closure `pumpEvent`.
- Cap cả hai log 2000 → 4000 entry (1 lượt probe ≈ 1750 pump event +
  ≈ 1650 blend tick — sát cap cũ, trim giữa lượt sẽ đứt mắt xích nối
  mẫu 84 với pump event theo seq).
- Probe dump slice theo case (lọc seq > mốc đầu case) vào JSON out +
  in tóm tắt chẩn đoán Y2 mỗi case (không đổi assert cũ, không khóa thêm).
- Kiểm chứng code: tsc web 0, vite build PASS (34,63 s), ghostBlend 15/15,
  previewEngine 25/25 (route `node --experimental-strip-types` như X9b).

### 1.2 Tính toàn vẹn log (đo lần 1)

- Seq pump/blend liên tục, 0 gaps mọi case (a 97, b 114, c 87, d 74, e 70
  pump event; blend tick 97/114/86/69/66). Không trim (tổng < cap 4000).
- Nối mẫu gStd → blend tick theo nhãn đầy đủ (expected, presented,
  ringSize, skippedLatest, ringLast, ringPrev) + currentTime gần vt nhất:
  100% (76/76 mẫu 37/84 hợp lệ). Nối tick → pump event theo lastPumpSeq:
  100% (0 tick no-pump — lượt này thuần đường pump).

## 2. Đo lần 1 — NHIỄM TẢI (assert97y2, 11:49–11:51Z)

- Waiter bắt load1=2,94 lúc khởi động; giữa lượt load vọt 13,7 (luồng Y
  khác chạy probe nặng) → capture thưa: 9–39 khung rAF/pass (X2: 55–98),
  capture gap 2–9 khung (X2: gap 1), chỉ 95 mẫu hợp lệ (X2: ~2200).
- Assert exit=1, chỉ 1 fail: E t=1 nG=1 < 2 (mẫu mỏng — cùng bệnh mẫu nhỏ
  như X2 §3.5). Median gStd các điểm đo vẫn ~37,5 (B 37,4/83,4/37,5;
  C 37,4/60,1/37,6; D 83,3/37,6/37,4; E 37,4/37,6/58,8) — median không
  lật dù tải nặng, nhưng nG nhỏ (1–6) nên từng điểm không tin được.

### 2.1 H1a — chữ ký mislabel TRỄ-callback: HIẾM

- lateMs > 33,3 ms mà decision vẫn "capture": 8/260 captures B–E
  (3,1%): B 1/82, C 3/65, D 2/57, E 2/56. lateMs median −3,9…+3,4 ms,
  p90 7,7–18,1 ms, max 76–150 ms.
- 7/8 late capture là label 0 đầu pass sau seek (callback frame 0 bắn
  trễ 43–96 ms, ctDeltaMs=0 — currentTime vừa seek về 0 nên guard
  freshness không chặn; presentedTrue=2: snapshot nhãn 0 chứa pixels
  frame ~2). Đây là mislabel THẬT nhưng chỉ ở biên seek: snapshot đó
  nằm trong ring ~3 capture đầu pass (≈100 ms), sau đó bị đẩy ra.
- 1 late capture còn lại (D seq=312, label 73, lateMs=149,7 ms,
  presentedTrue=77, ringSize=3, ringLast=73, ringPrev=58): callback trễ
  ~4,5 khung giữa pass — mislabel thật ngoài biên seek, nhưng chỉ 1 ca.

### 2.2 H1b — callback bắn SỚM ~10 ms: THƯỜNG XUYÊN (35–65% capture)

- presentedTrue(tInvoke) tái hiện từ luồng expectedDisplayTime (chia đoạn
  theo seek, lọc trusted bằng currentTime ±2 khung — chỉ 2–3 capture/case
  untrusted, 0–1 unknown): label==presentedTrue: B 48/78 (62%),
  C 22/62 (35%), D 43/55 (78%), E 30/53 (57%). Lệch chủ yếu −1
  (B 27, C 35, D 9, E 18): callback bắn ~10 ms TRƯỚC khi frame bắt đầu
  trình chiếu (lateMs ≈ −8…−13 ms) → drawImage vẽ frame đang trình chiếu
  lúc đó (K−1) nhưng gán nhãn K. Snapshot nhãn K chứa pixels K−1 là
  hiện tượng thường xuyên, không phải ca lạ.
- ctFrameIdx != label ở 8–20 capture/case (12–36%): PHẦN LỚN là nhiễu
  biên khung (currentTime và mediaTime kẹp hai bên mốc khung, ctDeltaMs
  chỉ vài ms) — KHÔNG phải chữ ký mislabel, đã xác nhận bằng lateMs
  (đa số |lateMs| < 15 ms). Chỉ dùng ctMismatch kèm lateMs/presentedTrue.

### 2.3 V2 — đối chiếu nội dung thật ↔ bucket: KHÔNG TÁCH ĐƯỢC (chế độ thưa)

- Nội dung ghost = presentedTrue(tInvoke của capture tạo nó); nội dung
  frame hiện tại = presentedTrue(tBlend). Phân lớp cửa sổ nội dung:
  triple-consec / double-count / gapped-triple / direct / pair+dup.
- Kết quả (76 mẫu 37/84 hợp lệ, đã sửa bug so sánh nhãn khi skp=1 —
  bản đầu mất 27+17 mẫu do so ghost cuối với ringLast thay vì ringPrev):
  - triple~37 (n=49): 41 gapped-triple, 2 pair+dup-nonconsec, 6 untrusted.
  - double-count~84 (n=27): 23 gapped-triple, 1 pair+dup-nonconsec,
    1 untrusted-content, 2 untrusted-current.
  - KHÔNG mẫu nào có nội dung double-count hay triple-consec: capture
    thưa (gap 2–9) nên ring hiếm khi giữ 3 frame liên tiếp.
- Kết luận lần 1: trong chế độ capture thưa, cả hai bucket đều là
  gapped-triple nội dung — lớp nội dung KHÔNG tách được 37 khỏi 84.
  Cụm 84 ở đây sinh ra do mẫu gap/pha (aliasing chu kỳ sọc ~4,46 khung),
  không phải do content-shift ±1. Số liệu này KHÔNG trả lời được chế độ
  dense-capture của X2 (gap 1) — nơi cửa sổ nhãn là triple liên tiếp và
  content-shift ±1 mới đổi được bucket.

### 2.4 H2 — presented ước lượng lệch ở blend: ĐI SAU 1–2 KHUNG DƯỚI TẢI

- presentedTrue(tBlend) − presented (ước lượng blend dùng): B 0:79 /
  +1:18 / +2:13 / +3:1 / −1:3; C 0:45 / +1:24 / +2:8 / +3:7; D 0:50 /
  +1:10 / +2:6; E 0:45 / +1:7 / +2:10 / +3:3. Tức 25–48% tick có
  presented thật ĐI TRƯỚC ước lượng 1–3 khung (callback thưa → ngoại
  suy floor((now−E)/33,3) chạy trước trình chiếu thật; đã lọc trusted
  bằng currentTime ±2 nên số này là cận dưới tin cậy được).
- Ở cấp mẫu (H1c v1): presOff (P != presentedTrue(tBlend)) ở mẫu 37
  vs 84: B 1/24 vs 2/17; C 5/16 vs 0/3; E 0/6 vs 2/4 — n nhỏ, KHÔNG
  tách được (C còn ngược: presOff nhiều hơn ở mẫu 37). H2 một mình
  không giải thích được cụm 84 trong dữ liệu lần 1.

## 3. Đo lần 2 — SẠCH, ASSERT PASS (assert97y2b, ~12:07–12:10Z)

- Waiter2 chờ load1<2,0 và load5<3,0 (tối đa 30 poll), bắn ở load1=1,28.
  JSON 5.460.303 B (`preview-abcde-assert97y2b.json`), assert exit=0.
  Dense-capture đúng chế độ X2: pump event/case 278–343, blend tick
  459–657, tới 127 khung rAF/pass (case E pass 3), tổng 1464 capture.
  Tính toàn vẹn log: seq pump/blend liên tục, 0 gaps mọi case
  (a 340, b 343, c 332, d 318, e 278 pump event); nối mẫu→tick 100%
  (1565/1565 mẫu 37/84 hợp lệ, 0 unmatched, 3 untrusted). 84-share
  tổng 327/1565 = 20,9% (B 21,4%, C 24,9%, D 16,4%, E 21,3%) — đúng
  dải 19–25% của X2.
- Histogram gStd lưỡng đỉnh rõ: bin ~35: 1238 mẫu, bin ~80: 327 mẫu,
  vùng giữa (45–79 hoặc 90–100): chỉ 14/1594 (0,9%) — hai mức rời rạc,
  không phải continuum.

### 3.1 H1a — late-callback: GẦN NHƯ KHÔNG TỒN TẠI (BÁC BỎ nguyên nhân chính)

- lateMs > 33,3 ms mà vẫn capture: **1/1257 captures (0,08%)** — lại là
  label 0 sau seek (D seq=1279, lateMs 49,9 ms, ringSize 1). lateMs
  median 0,3 ms, p90 1–3,7 ms, max 16,6–49,9 ms. Callback chạy đúng giờ.
- H1b (trusted, presentedTrue chia đoạn theo seek, lọc currentTime ±2):
  label==presentedTrue: B 290/343, C 197/326, D 225/316, E 189/272; lệch
  −1 vẫn thường xuyên (B 53, C 128, D 88, E 81 — 15–40% capture):
  callback bắn ~10 ms TRƯỚC mốc trình chiếu của frame mình. Nhưng lệch
  này KHÔNG tách được bucket (xem §3.3–3.4).

### 3.2 H2 — presented ước lượng ở blend: GẦN ĐÚNG ở chế độ sạch

- presented == expected ở ~95% tick (tickPresentedOffset: B 0:623/+1:33/
  −1:1; C 0:431/+1:112/−1:56; D 0:415/+1:136; E 0:348/+1:85). Trái với
  lần 1 (lệch tới +6 dưới tải), ở chế độ sạch ước lượng presented gần
  như đúng. H2 không giải thích được cụm 84 (presOff không tách bucket
  ở cấp mẫu, như lần 1).

### 3.3 V2 — nội dung cửa sổ KHÔNG tách được bucket (chế độ dense)

- Tái hiện nội dung từ presentedTrue (như lần 1, đã sửa bug nhãn skp=1):
  - triple~37 (n=1238): triple-consec 635 (51%), gapped-triple 382 (31%),
    pair+dup-nonconsec 183 (15%), double-count 36 (3%).
  - double-count~84 (n=327): triple-consec **165 (50%)**, gapped-triple
    75 (23%), pair+dup-nonconsec 55 (17%), double-count 24 (7%),
    pair-2win 6 (2%).
- **50% mẫu 84 có nội dung triple liên tiếp HOÀN HẢO {K−2,K−1,K}** (vd
  case b frameIdx=3 → 84,5 với nội dung [1,2,3]; frameIdx=9 → 82,9 với
  [7,8,9]; frameIdx=15 → 84,6 với [13,14,15]) trong khi mẫu 37 cùng cấu
  trúc tồn tại (frameIdx=6 → 37,7 với [4,5,6]). Lớp nội dung KHÔNG phân
  biệt được hai bucket. Chiều ngược cũng có: mẫu 37 mang nội dung
  double-count thật (case b frameIdx=5 → 37,7 với nội dung [4,5,5];
  frameIdx=36 → 37,5 với [34,35,35]) — mức 84 KHÔNG nhận diện được
  cửa sổ double-count, và mức 37 KHÔNG nhận diện được triple.

### 3.4 V3 — quét feature: KHÔNG feature nào tách được bucket

- So sánh 8 feature giữa bucket 37 (n=1238) và 84 (n=327): dt (median
  11,6 vs 9,2 ms), lateMs_last (0,3 vs 0,3 ms), frac (0,5 vs 0,4),
  P−exp (0 chiếm 1094/1238 vs 282/327), skp=1 (1221 vs 316), ringGap=1
  (1174 vs 312), tBlend−tInvoke_last (15,5 vs 10,5 ms), presTrue−P
  (0 chiếm 1134 vs 280) — mọi phân phối đều chồng lấn. H3 (tick chạy
  trong cửa sổ sớm, dt<0): dt<0 ở 14% mẫu 84 vs 7% mẫu 37 — giàu gấp
  2× nhưng 86% mẫu 84 có dt≥0 → **H3 BỊ BÁC làm cơ chế chính**.

### 3.5 V4 — cụm 84 theo PHA TUYỆT ĐỐI của frame (phát hiện then chốt)

- 84-share theo frameIdx mod 6: {3,4} mod 6 ≈ 48–60% (vd frame 3: 50%,
  9: 48%, 15: 58%, 21: 56%, 27: 60%, 33: 55%, 39: 58%, 45: 58%, 51: 50%,
  57: 54%, 63: 58%); các frame còn lại ≈ 0–9% (frame 6,7,11,13,17,18,
  24,36,37,41–43,48,49,54,55,61,67: 0–5%). mod 3: {0,1} → 27–28%,
  {2} → 7%; mod 9: {2,5,8} → 5–9%, còn lại 23–34%. mod 2/4/5: phẳng
  (~20–22%). Theo case: B 21,4%, C 24,9%, D 16,4%, E 21,3%. Theo pass:
  18,5–26,6% (không drift). Theo frac: 84-share cao nhất ở frac
  0,1–0,3 (32–33%), thấp nhất ở 0,7–0,8 (9%).
- Kết luận v4: **mức gStd được quyết định bởi frameIdx (pha tuyệt đối
  của pattern sọc), không phải bởi timing pump/blend.** Nhưng cùng một
  frame vẫn cho cả hai mức ở các pass khác nhau (vd frame 3: 11×37 +
  11×84) — trong nhóm frame "cao" là tung đồng xu ~50/50, nhóm "thấp"
  gần như luôn 37. Cần mô phỏng pixels để biết mức "đúng" của mỗi pha
  là gì (xem §3.6).

### 3.6 V5 — mô phỏng pixels thật: triple ĐÚNG cũng ra 84 ở pha cao (CHỨNG MINH)

- Giải mã `stripes-scroll.mp4` (1280×720, 30 fps, 90 frame) bằng ffmpeg,
  dựng lại pipeline preview ở độ phân giải canvas (872×276, project
  512×360, video letterbox 393×221, mask case B tâm 0,5) và tính
  gStd_core y hệt `__p3measure` (lõi ±10% dw, ±23 px). Kết quả trên
  pixels thật, không qua browser:
  - Frame đơn: 118,5–119,6 (ổn định, baseline probe ~112 — chênh ~7% do
    hình học mô phỏng xấp xỉ; TỶ LỆ mới là thứ so sánh được).
  - **Triple {K−2,K−1,K}: 39,6–40,0 ở K mod 6 ∈ {0,1,2,5} và 87,8–89,8
    ở K mod 6 ∈ {3,4}** — đúng pattern mod-6 của probe (37,5 vs 82,9–
    84,6; tỷ lệ 0,335 và 0,751 khớp hệt probe: 37,5/112=0,335,
    84/112=0,75).
  - Double-count {K−1,K,K}: 87,8–89,8 ở pha thấp, 118,5–119,6 ở pha cao.
    Pair {K−1,K}: 83–85 ở pha thấp, ~119 ở pha cao.
  - Sọc: chu kỳ ~14,6 px (canvas), scroll 4 px/khung.
- So sánh từng K (case B, median probe): K thấp — sim-triple 39,7 vs
  probe 37,5, range probe hẹp [36,5, 37,7]; K cao — sim-triple 88–90 vs
  probe median 82,9–84,6, range probe [36,5, 84,6] (có cả mức 37 xen
  vào, xem §3.8). **Triple đúng cho ra cả hai mức tùy pha — mức 84 là
  giá trị ĐÚNG của tmix ở pha cao, không phải lỗi blend.** Sóng vuông +
  cửa sổ lõi hữu hạn (~79 px, không nguyên chu kỳ) làm std của trung
  bình 3 khung nhạy pha tuyệt đối. Mô hình harmonic (1/h²) của X5 cho
  triple một giá trị duy nhất 0,446 là SAI ở đây: nó giả định cửa sổ
  vô hạn / sóng sin thuần, không tính được hiệu ứng pha của sóng vuông
  trên cửa sổ hữu hạn.

### 3.7 V6 — dự đoán mức từ triple(P, nhãn): 86,2% — double-count chỉ 10,5%

- Với mỗi mẫu case B (n=524): pred = sim-triple[P] × 112/119,4 (chuẩn
  hoá baseline), P = presented của tick. **|pred − đo| < 5 ở 444/515
  (86,2%)**; confusion bucket: (37,37): 335, (37,84): 70, (84,37): 1,
  (84,84): 109. Đối chứng: pred=triple(expected) 85,6% (P≈expected hầu
  hết tick); triple(P−1) 65,2%; triple(P+1) 67,2%; **pred=dbl(P) chỉ
  10,5%** (bucket đúng 21,4%). Sai lệch meas − triple(P): median +0,1,
  p10 −45,8, p90 +0,3 — phân phối hai cực: đúng hoặc lệch đúng một mức
  (~−46). **Giả thuyết "84 = cửa sổ double-count" BỊ BÁC làm cơ chế
  chính: cửa sổ đo được đi theo triple(P), không đi theo dbl(P).**
- V7 (thử cửa sổ thật từ tick): bản đầu DÙNG SAI ghost khi skp=1 —
  lấy (ringPrev, ringLast, ctFrame) = {P−1,P,P} tức double-count, chỉ
  đúng 11,2% — thực ra là phép kiểm độc lập thứ hai BÁC BỎ double-count
  (với skp=1, ghost dùng là ring[-3], ring[-2], không phải ring[-2],
  ring[-1]; xem §1.1). Không dùng kết quả v7 làm kết luận về cửa sổ thật.

### 3.8 V8 — mô hình "nội dung = nhãn−1 với callback sớm": SAI

- Giả thuyết: callback bắn sớm ~10 ms → drawImage vẽ frame K−1 nhưng
  gán nhãn K, nên nội dung cửa sổ = {P−3,P−2,P−1} (hoặc lệch tương tự)
  và mức đi theo nội dung đó. Kiểm bằng presentedTrue (chia đoạn theo
  seek, lọc trusted) + mô phỏng đúng cửa sổ nội dung: chỉ đúng
  **79,8%** (415/520), thấp hơn mô hình nhãn v6 (86,2%); riêng 71
  outlier của v6 chỉ giải thích được 12/71 (16,9%). **Snapshot chứa
  đúng pixels nhãn của nó** — drawImage trong rVFC callback vẽ frame
  mới đã được decoder sản xuất (dù chưa tới expectedDisplayTime), nên
  "nội dung = nhãn−1" là mô hình sai. Lệch −1 ở H1b chỉ là đồng hồ
  trình chiếu (expectedDisplayTime) chạy sau frame khả dụng, không phải
  nội dung snapshot chạy sau nhãn.

### 3.9 V9 — outlier v6 khớp cửa sổ nào: KHÔNG PHÂN BIỆT ĐƯỢC (metric chỉ có 2 mức)

- 71 outlier (|đo − triple(P)| ≥ 10): 37 khớp triple(P+1)+gap(P−3,P−2,P)+
  gap(P−2,P−1,P+1)+triple(P−2), 29 khớp triple(P−1)+cùng các gap, 4 khớp
  triple(P−1)+gap, 1 khớp triple(P+1)+dbl(P)+dbl(P−1)+pair(P). Nhiều ứng
  viên trùng mức (đều ≈37 hoặc ≈84) nên gStd một mình KHÔNG xác định
  được cửa sổ thật của outlier. Cần đọc nhãn ghost trực tiếp từ log
  (xem §3.10).

### 3.10 V10 — nhãn ghost thật của outlier: CỬA SỔ NHÃN HOÀN HẢO (kết luận phụ)

- Tái hiện ring từ pump event (như v2) cho 71 outlier case B:
  - **69/71 có ghost dùng {P−2,P−1}, ring liên tiếp {P−2,P−1,P},
    skp=1, ctFrame=P** — cửa sổ NHÃN là triple liên tiếp hoàn hảo, vậy
    mà đo ra mức ngược (vd exp=3 P=3 đo 37,6; exp=9 P=9 đo 37,4;
    exp=15 P=15 đo 37,7 — trong khi triple(3/9/15) mô phỏng ra 84).
  - 1 mẫu: ringSize 2, chỉ 1 ghost {1} + current 2 → cửa sổ pair {1,2}
    → đo 80,0 (đúng mức pair ở pha thấp, giải thích được).
  - 1 mẫu: ctFrame=P+1 (35 vs P=34) → cửa sổ gap {32,33,35} → đo 36,6.
  - Decisions pump case B: capture 339, reset-capture 4, **0 skip** —
    không có skip-stale-frame, không lỗ ring, không callback trễ.
  - 3 pump event gần nhất trước mỗi tick outlier đều là capture.
- **Không cơ chế metadata nào giải thích được 69 outlier này** (không
  late, không skip, không lỗ, không lệch presented, không lệch ct).
  Bậc tự do duy nhất còn lại là PIXELS trong snapshot: drawImage lúc
  callback chạy đua với việc element chuyển frame — nếu callback chạy
  ngay trước khi element chuyển sang frame nhãn, snapshot nhãn K chứa
  pixels K−1; nếu chạy sau, chứa đúng pixels K. Cuộc đua này quyết
  định ở thang dưới-mili-giây mà log không ghi (lateMs đo theo
  expectedDisplayTime, không phải theo thời điểm element chuyển frame
  thật). Đây là ứng viên duy nhất còn lại cho 13,8% residual — CHƯA
  ĐƯỢC CHỨNG MINH (cần đọc pixels snapshot, xem §5.1).

## 4. Verdict (sau cả 2 lượt đo + mô phỏng pixels)

### 4.1 Phán quyết chính — cụm 84 KHÔNG phải lỗi blend

1. **Cụm double-count 84 ở ~19–25% mẫu là HÀNH VI ĐÚNG của blend, không
   phải bug.** Mô phỏng trực tiếp trên pixels thật của clip chứng minh
   triple ĐÚNG {K−2,K−1,K} cho gStd ~37 ở K mod 6 ∈ {0,1,2,5} và ~84 ở
   K mod 6 ∈ {3,4} (v5). Dự đoán triple(P) khớp 86,2% mẫu case B trong
   ±5 (v6); dự đoán double-count chỉ khớp 10,5%. Blend đang vẽ đúng
   cửa sổ tmix mà X2 đã sửa — median 37,5 là median của phân phối hai
   mức (79% ở 37, 21% ở 84), không phải "37 đúng, 84 sai".
2. **H1 (capture gán nhầm nhãn khi callback trễ): BÁC BỎ làm nguyên nhân
   chính.** Chế độ sạch: 1/1257 capture trễ (0,08%), toàn bộ ở biên
   seek. Chế độ nhiễm tải lần 1: 8/260 (3,1%), 7/8 ở biên seek.
3. **H1b (callback bắn sớm −1 khung): thường xuyên (15–40% capture) nhưng
   VÔ HẠI với nội dung snapshot.** Mô hình "snapshot nhãn K chứa pixels
   K−1" dự đoán TỆ HƠN mô hình nhãn (79,8% vs 86,2%, v8) — snapshot
   chứa đúng pixels nhãn của nó.
4. **H2 (presented lệch): không tách được bucket.** Ở chế độ sạch
   presented == expected ~95% tick; lệch không dự đoán được mức.
5. **H3 (tick chạy trong cửa sổ sớm, dt<0): BÁC BỎ làm cơ chế chính.**
   dt<0 chỉ ở 14% mẫu 84 (vs 7% mẫu 37); 86% mẫu 84 có dt≥0.
6. **Đính chính X2 §3.3/§3.5:** X2 gọi cụm 84 là "double-count" và cho
   rằng nó đến từ capture gán nhầm nhãn (U1 §7). Y2 chứng minh mức 84
   không nhận diện được cửa sổ: triple đúng cũng ra 84 (pha cao),
   double-count cũng ra ~84 (pha thấp), pair cũng ra ~84 (pha thấp).
   Mức gStd là hàm của PHA pattern, không phải của lớp cửa sổ. Bản thân
   FIX X2 (skipLatest → blend đúng tmix {K−2,K−1,K}) được xác nhận đúng:
   cửa sổ nhãn là triple liên tiếp ở ~100% tick (v10: ring liên tiếp,
   0 skip ở case B). Sai lầm của X2 nằm ở DIỄN GIẢI mức 84, không nằm
   ở bản fix. Hệ quả: probe assert dùng gStd để phân biệt cửa sổ blend
   là KHÔNG ĐỦ trên pattern sọc này — cần metric khác (xem §5.1).

### 4.2 Residual 13,8% — mở, ứng viên duy nhất: race pixels lúc capture

- 71/515 mẫu case B đo mức ngược với triple(P) trong khi cửa sổ nhãn
  hoàn hảo (v10). Không cơ chế metadata nào chạm được tới chúng. Ứng
  viên còn lại: race giữa drawImage trong rVFC callback và thời điểm
  element chuyển frame (snapshot nhãn K đôi khi chứa pixels K−1) —
  CHƯA CHỨNG MINH, cần chẩn đoán mức pixel (đọc snapshot thật). Đây là
  nợ mở duy nhất còn lại của cụm 84, và nó KHÔNG phải là lỗi blend
  logic (blend vẽ đúng thứ ring giữ; vấn đề — nếu có — nằm ở pixels
  snapshot được capture vào ring).
- **KHÔNG sửa production.** Không có cơ chế nào được chứng minh, không
  có test hồi quy cho cơ chế đó. Mọi "fix" dựa trên mức gStd (đổi
  weights, đổi skipLatest, đổi guard) đều là bắn vào metric đã chứng
  minh là nhạy pha — cấm.

## 5. Nợ mở

1. **Cụm 84 — PHÁN QUYẾT XONG PHẦN LỚN, còn residual 13,8% (mới).**
   (a) ĐÃ ĐÓNG: cụm 84 là triple đúng ở pha cao — không phải bug blend,
   không sửa production. (b) CÒN MỞ: 71/515 mẫu case B đo mức ngược
   với triple(P) dù cửa sổ nhãn hoàn hảo; ứng viên race pixels lúc
   capture chưa được chứng minh. Chẩn đoán tiếp theo (đợt sau, KHÔNG
   làm trong luồng này): expose ring snapshot canvases ra
   `__vcutRvfcRingPixels` để probe đọc pixels thật của từng snapshot và
   so với frame nguồn tương ứng (ground truth pixel-level); nếu snapshot
   nhãn K chứa pixels K−1 ở đúng các tick outlier thì cơ chế được chứng
   minh, khi đó mới bàn fix (vd: capture 2 lần / đợi element chuyển
   frame / dùng captureTime để loại snapshot đua). Nếu snapshot luôn
   đúng pixels thì residual đến từ chỗ khác (vd: current frame vẽ live
   từ element — cần log thêm frame thật mà drawImage của current đã vẽ,
   hiện tick chỉ ghi currentTime). (c) Metric gStd trên pattern sọc
   vuông đã chứng minh là nhạy pha — assert motion-blur sau này nên
   dùng thêm metric không nhạy pha (vd: so sánh trực tiếp pixels
   preview vs render cùng K, hoặc pattern test có chu kỳ nguyên với cửa
   sổ đo).
2. **Harness — test-preview-engine.sh (route .cjs) fail tiền tồn, KHÔNG
   do Y2 (phát hiện khi kiểm chứng):** (a) /tmp/vcut-test-preview-engine
   dùng chung — luồng Y khác chạy cùng lúc làm order.txt nhân đôi dòng
   → assert thứ tự transform render.js fail giả (chạy riêng thì ✅);
   (b) previewEngine.ts import "./previewClipKey62R6.ts" (đuôi .ts tường
   minh, có từ 00:37Z) → tsc CJS emit require("./previewClipKey62R6.ts")
   mà node không resolve (file .js đã biên dịch sẵn trong out nhưng
   require đòi .ts). Route đúng là `node --experimental-strip-types
   apps/web/src/lib/previewEngine.test.ts` (25/25 như X9b). Sửa runner
   .sh (OUT riêng theo luồng + vá require .ts → .js) để đợt sau.
3. **Probe summary Y2 có nhiễu biên seek:** `presentedAtInvokeMinusLabel`
   chứa giá trị ±70 (ước lượng stale từ pass trước sau seek về 0) và
   `tickPresentedOffset` tới +6 (ngoại suy khi callback thưa) — phân
   tích Python đã dùng presentedTrue chia đoạn theo seek thay cho 2
   trường này; lần sau cân nhắc bỏ 2 histogram đó khỏi summary probe
   hoặc ghi chú biên seek.
4. **Đứng yên theo LIMITS gộp đợt 96 §4:** TTS 39 CẤM kiểm lại;
   birefnet chỉ thử lại khi RAM đổi; ci-security.yml 403 chờ user;
   G1 vẫn MỞ chờ user quyết; EPERM probe #16+; blob 2 MiB; retry-play
   lỗi muộn >3 s; re-arm; blur D fix-3; watchdog đóng băng; memo c2
   blind; zombie pump; release gate không đổi.

## 6. File Y2 tạo/sửa (batch stage)

- `apps/web/src/preview.tsx` — pump event log mở rộng + blend-tick log
  (13 marker "Đợt 97 Y2"; chỉ vùng pump/blend; không chạm drift Y4 /
  watchdog Y5 / clip-change Y7).
- `apps/web/scripts/probe91s1-motionblur-rvfc.cdp.mjs` — dump slice Y2
  theo case + tóm tắt chẩn đoán (2 marker "Đợt 97 Y2"; assert cũ giữ nguyên).
- `docs/PHASE9_ROUND97_Y2_GHOST_DOUBLECOUNT_LIMITS.md` — file này.
- Scratch đo (không vào batch): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round97-y2/`
  (`preview-abcde-assert97y2*.json`, `assert97y2*.log`, `analyze-y2*.py`,
  `analyze-y2*.txt`, waiter scripts, `vite-5173-y2.log`).
- Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round97-y2-ghost-doublecount.txt`
  (NUL-delimited). KHÔNG push GitHub; user tự push sau từ main chat.
