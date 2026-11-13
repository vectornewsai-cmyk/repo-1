# PHASE9_ROUND100_B2_GHOST_TICK_TIMING_LIMITS — đo thời gian trong-tick: cơ chế đường tick BỊ BÁC ở dạng mạnh

> Luồng B2, đợt 100, lượt cron 03:35 +07 13/11/2026. Repo `~/workspace/repo-1` (cây làm việc).
> Nợ LIMITS gộp đợt 99 §4 mục 3: "Ghost residual đường tick (thiếu đo thời gian
> trong-tick; 6/133 ca không khớp)" — xem LIMITS đợt 99 A2 §4–§5.
> KHÔNG push. KHÔNG release/tag. Không đụng TTS 39, birefnet, `.github/workflows`, 0 binary.
>
> **Kết quả chính — cơ chế "trễ trong-tick gây gán sai nhãn" BỊ BÁC ở dạng mạnh:**
> 1. **Độ trễ trong-tick KHÔNG dự đoán được mislabel.** Cả 3 tiêu chí đăng ký
>    TRƯỚC khi chạy probe đều trượt: P2 (frame thật == floor(rawCt·30)) chỉ
>    49,3% trên snapshot phân biệt (vs 47,9% nếu cứ đoán nhãn) — rawCt không
>    hơn gì nhãn; P1 (mislabel ⟺ inRaw > ms-tới-ranh-giới) accuracy 60,1%
>    (ngưỡng 85%); "sạch-khi-nhanh" vẫn mislabel 37,9% (bucket nhanh nhất
>    [0;16,7ms): 16/28 = 57% trên snapshot phân biệt).
> 2. **Thủ phạm là phase jitter presented-frame ↔ currentTime, độc lập với
>    độ dài tick.** Offset frame thật − frame(rawCt) ∈ {−2..+2} xuất hiện cả ở
>    bucket inRaw nhỏ nhất (offset +2: 6 ca với inRaw < 16,7ms — không thể do
>    video tiến trong tick, vì tiến 2 frame cần ≥ 66ms). rawUnitSource vẽ
>    xong trong trung vị 0,1ms (p90 0,5ms) nên rawCt ≈ đúng thời điểm lấy mẫu
>    — P2 trượt không phải do lag đo. 84,5% tick có media clock đứng yên
>    trong tick (trễ trung vị 56,5ms so với wall-clock) mà vẫn mislabel 50%.
> 3. **6/133 ca không khớp (A2): ghost mislabel KHÔNG phải nguyên nhân.**
>    Chạy lại trên dữ liệu cũ A2 run B: 5 fail / 89 cửa sổ, cả 5 đều có
>    winTrue == winLab (ghost sạch) — dự đoán theo frame THẬT của ghost
>    vẫn trượt y hệt theo nhãn (84/89 = 94,4% cả hai). Run pump-alive mới
>    20 pass: 1 fail / 10 cửa sổ (pass 12, P=72, đo 112,3 ≈ gStd đơn-frame,
>    cùng chữ ký với ca P=44 của A2) — 2 tick mask-direct frameIdx=0 nằm
>    giữa blend tick 108 và 109, ứng viên ghi đè ở biên pass, chưa phân
>    biệt dứt khoát (xem §5.3).
>
> **Hệ quả cho batch fix tương lai (KHÔNG làm ở đây):** fix ứng viên của A2
> ("đọc lại currentTime ngay trước drawImage") sẽ KHÔNG sửa được mislabel,
> vì frame trình chiếu lệch floor(currentTime·30) tới ±2 ngay cả khi độ trễ
> ≈ 0. Fix đúng hướng phải lấy frame TRÌNH CHIẾU thật (metadata rVFC /
> presentedFrameIndex), không phải currentTime tươi hơn.

## 0. Môi trường đo

- Boot 66fb273d-6b9f-4fe5-ba13-dc5165a5d6bd. Lượt chạy 20:38–21:05Z 12/11/2026.
- Vite riêng B2 trên 5173 (đã verify serve code B2 trước probe: `tickLabelCtx`
  ×5, `labelMs` có trong file serve; B4 `samplePlainCurrentPixStrip` ×3 cũng
  có mặt — cùng phiên bản file với probe).
- Tải nền CAO suốt các run (load 4,8–11,4 — các luồng đợt 100 khác chạy probe
  song song): chế độ THƯA như A2; tick total trung vị 93,5ms (p90 273,5ms).
  Tỉ lệ mislabel dưới đây gắn caveat "chế độ thưa + tải cao" — nhưng kết luận
  BÁC cơ chế không phụ thuộc tỉ lệ tuyệt đối: nó dựa trên bucket tick NHANH
  (inRaw < 16,7ms) vẫn mislabel đa số.
- Probe B2 (`probe100b2-ghost-tick.cdp.mjs`, copy từ probe91s1 + dump thêm
  slice `__vcutTickCost` theo wallMs đầu case):
  - Run T (đường tick): `--cases b --passes 10 --assert --disable-rvfc
    --cdp-port 9250` (20:48–20:50Z, exit 0, **ASSERT PASS**; 0 pump event,
    118/118 blend tick qua đường tick, tickCost slice 140).
  - Run P10 (pump-alive): `--cases b --passes 10 --assert --cdp-port 9251`
    (20:50–20:53Z, exit 0, **ASSERT PASS**; 85 blend tick, 103 pump event,
    67 capture, 12 late, 0 ticksNoPump; valid samples chỉ 9/133 — xem §5.2).
  - Run P20 (pump-alive): `--cases b --passes 20 --assert --cdp-port 9252`
    (20:57–21:00Z, exit 0, **ASSERT PASS**; 160 blend tick, 188 pump event,
    tickCost slice 179; valid samples 24/217).
- Chromium Playwright 1254 (mỗi probe 1 instance, dọn sau mỗi lượt).
- **WebKit: KHÔNG chạy được.** Không có driver playwright (npm / python /
  global đều không có); chỉ có binary minibrowser webkit-2388 không lái
  được qua CDP. Kết luận nhân quả chỉ đo trên Chromium — độ lớn phase
  jitter có thể khác trên WebKit, nhưng kết luận về code (nhãn currentTime
  ≠ frame trình chiếu) không phụ thuộc trình duyệt (xem §6 mục 5).

## 1. Instrumentation đã thêm (chỉ đo, không đổi hành vi) — marker "Đợt 100 B2" ×6

### 1.1 Ba mốc thời gian trong-tick (xem `MotionBlurSnapshotPix`, `TickLabelCtx`)

Mỗi snapshot đường tick mang theo 7 trường tuỳ chọn (đường rVFC không qua
`drawVideoClip` nên vắng — phân biệt 2 đường ngay trong dữ liệu):

| Trường | Ghi ở đâu | Ý nghĩa |
|---|---|---|
| `labelMs` / `labelCt` | `drawVideoClip`, ngay sau khi tính `frameIdx` từ `srcEl.currentTime` (~3628) | Thời điểm + đồng hồ media lúc GÁN NHÃN |
| `rawMs` / `rawCt` | `drawVideoClip`, ngay sau `rawUnitSource` (~3962) | Lúc `rawUnit` vừa vẽ xong từ video element — **đây mới là lúc pixels snapshot được lấy mẫu thật** ở đường mask (snapshot chỉ copy `rawUnit` sau đó) |
| `snapMs` / `snapCt` | `updateMotionBlurSnapshots`, ngay trước `drawImage` snapshot (~1547) | Lúc copy snapshot; `snapCt` chỉ có khi `drawSrc` là video element sống |
| `srcKind` | cùng chỗ `snapMs` | `"video"` = lấy mẫu thật lúc snapshot; `"canvas"` = pixels đã lấy mẫu trước đó ở `rawUnitSource` (snapMs chỉ là chặn trên) |

- `tickLabelCtx: Map<clipId, TickLabelCtx>` — đặt ở đầu tick, đọc + xoá ở
  lúc vẽ snapshot (1 tick dùng 1 lần; tick không snapshot thì tick sau ghi
  đè — không rò nhãn sang tick sau).
- `recordMotionBlurSnapshotPix` nhận thêm tham số `timing?` (tuỳ chọn);
  đường rVFC không truyền → trường vắng. `ghostPix` trong blend-tick log
  mang nguyên timing → probe dump sẵn, không sửa probe (ngoài dump tickCost).
- Chi phí đo: 2 lần đọc `currentTime` + 3 lần `performance.now()` mỗi tick
  có snapshot (bậc µs; `rawUnitSource` vẫn trung vị 0,1ms — xem §3.3).

### 1.2 Bao phủ timing

- Run T: **225/225** ghost snapshot có timing B2 (100%); 225/225 qua đường
  tick (`viaRvfc=0`); `srcKind` 225/225 `"canvas"` (case B đi đường mask →
  `rawUnit` canvas, như dự kiến); w/h 225/225 = 640×360.
- Run P10/P20: ghost đường rVFC không có timing (đúng thiết kế) — kiểm
  chứng ở §5: `ghostTickTimed=0` trong mọi cửa sổ fail.

## 2. Verdict 1 — trễ trong-tick KHÔNG gây gán sai nhãn (phần T)

### 2.1 Phương pháp

- Đối chiếu strip từng ghost snapshot đường tick với ground truth mô phỏng
  (y hệt matcher A2 §2.1: resize BILINEAR → w×h, strip y=h/2, x0=0,2w,
  48 mẫu G, ngưỡng 128, hamming ≤ 2 trong nhãn ±3). Phân loại: `clean`
  (nhãn ∈ tập khớp), `mislabeled` (tập khớp không chứa nhãn, một residue
  mod 5 duy nhất — frame thật xác định), `ambiguous` (tập khớp nhiều
  residue — cặp frame trùng 6k+2 == 6k+3 của clip gốc), `nomatch`.
- 3 kiểm định đăng ký TRƯỚC khi chạy probe (xem `boot.log`):
  - **P2:** frame thật == `floor(rawCt·30)` (mod 5) ở ≥ 90% ca đơn-nghĩa.
  - **P1:** dự đoán mislabel ⟺ `inRawMs > ms-tới-ranh-giới` (tính từ
    `labelCt`); accuracy ≥ 85%.
  - **Sạch-khi-nhanh:** mislabel ~0 khi `inRaw < 33,3ms` VÀ `predRaw == label`.
- De-duplicate: 1 snapshot được blend lại ở nhiều tick liên tiếp (cùng
  `(label, pix)`) — báo cả số entry (225) lẫn snapshot phân biệt (95).

### 2.2 Số liệu — phân loại strip

| | Tất cả entry (n=225) | Snapshot phân biệt (n=95) |
|---|---|---|
| Clean | 99 (44,0%) | 34 (35,8%) |
| Mislabeled | 79 (35,1%) | 37 (38,9%) |
| Ambiguous | 47 (20,9%) | 24 (25,3%) |
| Nomatch | 0 | 0 |

- Tỉ lệ sạch 44,0% ≈ A2 run C 47,4% (n=251) — tái lập được, không phải nhiễu.
  (Số phân biệt sạch thấp hơn vì snapshot sạch bị blend lại ít tick hơn —
  không dùng để so tỉ lệ tuyệt đối.)
- Delta mod 5 của ca mislabeled (tất cả entry): +1: 31, +2: 17, −2/±3: 7,
  −1: 24 — **hai chiều gần đối xứng**, KHÁC hẳn A2 (+1 27,9% vs −1 5,6%).
  Lệch −1 nhiều gấp ~5 lần A2: presented frame tụt sau currentTime cũng
  thường xuyên như vượt trước (xem §3.2 — decoder stall dưới tải cao).

### 2.3 P2 — frame thật vs frame(rawCt): TRƯỢT

| | Hit | N |
|---|---|---|
| P2 tất cả entry (ca đơn-nghĩa) | 101 (56,7%) | 178 |
| P2 chỉ ca mislabeled | **2 (2,5%)** | 79 |
| P2 snapshot phân biệt | 35 (49,3%) | 71 |
| Baseline "cứ đoán nhãn" (phân biệt) | 34 (47,9%) | 71 |
| P2b — giả định media chạy đều: `floor((labelCt + inRaw/1000)·30)` | 21 (29,6%) | 71 |

- `rawCt` dự đoán frame thật **không hơn gì nhãn** (49,3% vs 47,9%).
  Trong 79 ca mislabeled, chỉ 2 ca frame thật khớp `floor(rawCt·30)`.
- P2b tệ hơn cả (29,6%): giả định "media chạy đều trong tick" SAI —
  media clock thường đứng yên trong tick (xem §3.2).

### 2.4 P1 — dự đoán mislabel theo ranh giới khung: TRƯỢT

- Bảng: TP=56 FP=48 FN=23 TN=51 (n=178). Accuracy **60,1%** (ngưỡng 85%);
  precision 53,8%; recall 70,9%. Fisher một phía p = 0,002 — CÓ liên hệ
  yếu (tick dài hơn thì mislabel nhiều hơn một chút), nhưng xa mức nhân quả.
- Bucket theo `inRawMs` (tất cả entry, ca đơn-nghĩa):
  [0;16,7ms): 33/79 = 41,8% mislabeled; [16,7;33,3): 8/26 = 30,8%;
  [33,3;66,7): 11/19 = 57,9%; [66,7ms+): 27/54 = 50,0%.
  Không đơn điệu, không có ngưỡng sắc.
- Trung vị `inRawMs`: clean 17,5ms vs mislabeled 28,4ms (p90 103,9 vs
  115,2; max 196,7 vs 204,3) — lệch có hướng nhưng phân bố chồng lấn lớn.
  Trung vị ms-tới-ranh-giới: clean 26,1ms vs mislabeled 14,9ms — đúng
  hướng kỳ vọng (nhãn gần ranh giới thì dễ lệch) nhưng không đủ để dự đoán.

### 2.5 Sạch-khi-nhanh: TRƯỢT

- `inRaw < 33,3ms` VÀ `predRaw == label` (n=103): mislabeled **39 (37,9%)**.
- Bucket nhanh nhất [0;16,7ms) trên snapshot phân biệt: mislabeled 16/28
  = **57%**, offset {khớp: 13, +1: 5, +2: 6, −1: 4} — offset +2 xuất hiện
  6 ca trong khi tiến 2 frame cần ≥ 66ms. **Không thể do video tiến
  trong tick.** Đây là bằng chứng trực tiếp nhất bác cơ chế.

### 2.6 Kết luận phần T

Cơ chế A2 §4.3 ở dạng mạnh — "video tiến thêm 1–3 frame giữa lúc đọc
nhãn và lúc vẽ snapshot" — **BỊ BÁC làm nguyên nhân chính**. Nhãn
`frameIndex(currentTime)` sai ngay cả khi tick nhanh và media clock đứng
yên: frame trình chiếu tại thời điểm lấy mẫu lệch `floor(currentTime·30)`
tới ±2 một cách hệ thống (xem §3).

## 3. Verdict 2 — phase jitter presented-frame ↔ currentTime

### 3.1 Offset frame thật − frame(rawCt)

- Snapshot phân biệt (n=71 ca đơn-nghĩa): offset mod 5 {0: 35, +1: 15,
  +2: 8, −2: 4, −1: 9} — chỉ 49% khớp, còn lại rải đều ±1/±2.
- Theo bucket `inRawMs` (phân biệt): [0;16,7): {0: 13, +1: 5, +2: 6, −1: 4};
  [16,7;33,3): {0: 7, +1: 1, −2: 1, −1: 1}; [33,3;66,7): {0: 3, +1: 1,
  +2: 1, −2: 1, −1: 1}; [66,7+): {0: 12, +1: 8, +2: 1, −2: 2, −1: 3}.
  Offset ±1/±2 **không tăng theo inRaw** — không phải advance-trong-tick.

### 3.2 Media stall trong tick

- 60/71 (84,5%) tick phân biệt có `mediaAdvMs < inRawMs − 5ms` (media clock
  tiến chậm hơn wall-clock trong tick): trễ trung vị 56,5ms, max 204,3ms.
  Trong các tick stall: mislabeled 30/60 = 50,0%.
- Diễn giải: dưới tải cao, decoder stall làm `currentTime` đứng yên trong
  khi wall-clock trôi — nhưng mislabel vẫn xảy ra với tỉ lệ cao, vì
  **presented frame và currentTime là 2 đồng hồ lệch pha nhau** (compositor
  trình chiếu frame theo nhịp riêng; W4 đã thấy presented vượt trước
  currentTime +1 — nay thấy cả tụt sau −1/−2 dưới tải stall).
- Caveat: số stall đo được gắn với tải cao của đợt này (load 4,8–11,4);
  dưới tải yên, stall ít hơn nhưng phase jitter ±1 (W4) vẫn tồn tại — cần
  1 run DENSE để tách 2 thành phần (xem §6 mục 4).

### 3.3 rawCt là mốc lấy mẫu đúng (loại trừ sai số đo)

- TickCost đường mask-blend (n=118): `rawMs` trung vị **0,1ms**, p90
  **0,5ms**, max 57,6ms; `totalMs` trung vị 93,5ms, p90 273,5ms, max 604,6ms.
- `rawCt` đọc sau `drawImage` ≤ ~0,5ms (p90) nên gần như đúng thời điểm
  lấy mẫu — P2 trượt không phải do lag đo. Phần lớn tick (93,5ms trung vị)
  tiêu SAU `rawUnit` (blend/mask/draw) — không liên quan tới pixels snapshot.

### 3.4 Kết luận phần T-tinh-chế

Nhãn snapshot đường tick sai vì **frame trình chiếu lúc lấy mẫu ≠
`floor(currentTime·30)`** — lệch pha ±1 (thỉnh thoảng ±2) tồn tại độc lập
với độ dài tick. Trễ trong-tick chỉ đóng góp phần nhỏ (P1 Fisher p=0,002;
trung vị inRaw mislabeled 28,4 vs clean 17,5ms). Cơ chế đúng cần viết lại:
"nhãn từ media clock, pixels từ presented frame; 2 đồng hồ lệch pha nhau".

## 4. Verdict 3 — 6/133 ca không khớp cửa sổ thật: ghost mislabel KHÔNG phải nguyên nhân

### 4.1 Phương pháp

- Chạy lại matcher v3 của A2 trên (a) dữ liệu CŨ A2 run B
  (`preview-b-assert99a2.json`) và (b) dữ liệu MỚI B2 pump-alive
  (10 pass + 20 pass), nhưng dự đoán gStd theo **cửa sổ frame THẬT của
  ghost** (strip-match từng ghost, thay cho nhãn `ghostPix[].frame`) rồi so
  với dự đoán theo nhãn. Nếu ghost mislabel gây ra fail thì dự đoán theo
  frame thật phải khớp.
- Kiểm tra thêm: fail có khớp gStd đơn-frame gần P không (chữ ký ghi đè
  1 frame), ghost trong cửa sổ fail có timing đường tick không, có ghost
  nào mislabel không.

### 4.2 Dữ liệu cũ A2 run B — 5 fail, không ca nào do ghost mislabel

- Mẫu hợp lệ 118, khớp tick 103/118, cửa sổ thật tính được 89.
- Khớp ±5: theo nhãn **84/89 (94,4%)**; theo frame THẬT của ghost
  **84/89 (94,4%)** — y hệt nhau.
- 5 fail (đo vs dự đoán): pass 1 P=9 đo 82,8 vs 37,4; pass 7 P=13 đo 83,0
  vs 37,4; pass 7 P=61 đo 36,7 vs 82,6; pass 9 P=44 đo 111,8 vs 37,5
  (**khớp gStd đơn-frame 111,5–112,2** — chữ ký ghi đè 1 frame, như A2
  đã nêu); pass 12 P=23 đo 84,1 vs 37,3.
- Cả 5 fail: `winTrue == winLab` (ghost sạch, không ghost nào mislabel),
  `ghostTickTimed=0`, `ghostMislabeled=[]`, `viaRvfc=1`. 4/5 fail là **lật
  mức 37↔84** (đo mức kia, dự đoán mức này) — không phải sai số nhỏ; 1/5
  là đơn-frame.
- Lưu ý: A2 báo 6/133 trên gộp run A+B; chạy lại chỉ trên run B được 5/89.
  1 ca còn lại thuộc run A (không chạy lại ở đây — cùng phương pháp, cùng
  kết luận dự kiến; xem §6 mục 2).

### 4.3 Dữ liệu mới B2 pump-alive — 1 fail / 10 cửa sổ, chữ ký ghi đè ở biên pass

- Run P10: 9 mẫu hợp lệ, 3 cửa sổ tính được, **3/3 khớp**, 0 fail.
- Run P20: 24 mẫu hợp lệ, 24/24 khớp tick, 10 cửa sổ tính được, 9/10 khớp;
  1 fail: pass 12, P=72, đo **112,3** vs dự đoán 37,3, winTrue==winLab
  [60,70,72], `ghostTickTimed=0`, không ghost mislabel — đo khớp gStd
  đơn-frame (111,5–112,2), cùng chữ ký với ca P=44 của A2.
- Điều tra fail P=72 bằng slice `__vcutTickCost`: giữa blend tick 108
  (tBlend 79113,3; P=72; `currentTime` 2,4001) và blend tick 109
  (tBlend 80620,8) có **2 tick mask-direct `frameIdx=0`** (wallMs 79724,0
  và 80058,6; total 101,9 / 254,6ms). Đường mask-direct KHÔNG gọi
  `recordDrawnBlendWindow` nên không cập nhật nhãn `lastDrawn*` — mẫu
  probe vẫn mang nhãn tick 108 trong khi canvas đã bị vẽ trực tiếp 1 frame.
- NHƯNG chưa kết luận dứt khoát được: 2 tick mask-direct đó nhiều khả năng
  thuộc **đầu pass 13** (setPlayhead(0) → seek → refill ring: blend thất
  bại 2 tick rồi resume ở frame 18), không phải giữa chừng pass 12 — mẫu
  fail là mẫu CUỐI pass 12 (ph=2,3; vt=2,4279; frameIdx=72) và vt đọc từ
  element đang phát (2,4279) trong khi mask-direct vẽ từ element đã seek
  về 0 — khớp với giả thuyết "probe đọc vt từ element cũ (paused 2,4279)
  trong khi app vẽ từ element mới (0)" hơn là "ghi đè giữa chừng". Cần
  wallMs + element id ở mẫu probe để phân biệt (xem §6 mục 3).
- Tỉ lệ fail mới 1/10 (10%) vs cũ 5/89 (5,6%) — cùng bậc; không có bằng
  chứng fail tăng hay giảm. Cả hai run mới đều quá thưa để ước tỉ lệ
  chính xác (n=3 và n=10 cửa sổ).

### 4.4 Kết luận phần W

- **Ghost mislabel bị loại trừ làm nguyên nhân của 6/133 ca**: dự đoán theo
  frame thật không cứu được ca nào (5/5 cũ + 1/1 mới đều winTrue==winLab).
- Các fail còn lại chia 2 chữ ký: (a) lật mức 37↔84 (4/5 cũ) — cửa sổ blend
  thật lệch ±1 frame so với cửa sổ nhãn (phù hợp với phase jitter §3:
  presented frame của tick blend lệch ±1); (b) đơn-frame ~112 (1/5 cũ +
  1/1 mới) — khả năng cao là artifact biên pass / vẽ trực tiếp sau blend,
  chưa phân biệt dứt khoát (xem §4.3).

## 5. Kiểm chứng

- `tsc` apps/web: **0**.
- `vite build`: **PASS 15,58 s**.
- `ghostBlend.probe.test.ts`: **15/15 PASS** (spec reporter).
- `previewEngine` test (`node --experimental-strip-types`): **25/25 PASS**.
- Probe assert: run T / P10 / P20 đều **ASSERT PASS** (exit 0).
- Blend math không đổi: không sửa `compositeMotionBlurLayer`,
  `drawMotionBlurBlended`, weights, gate hay thứ tự vẽ — chỉ thêm đọc
  `currentTime`/`performance.now()` và trường tuỳ chọn vào interface đo.
- Không sửa file Y2/Z2/A2; không đụng production logic ngoài instrumentation
  chỉ-đo (xem §1).

## 6. Nợ mở (cho đợt sau)

1. **Cơ chế đường tick — đã chẩn đoán xong, chưa sửa, và fix ứng viên cũ
   BỊ BÁC.** "Đọc lại currentTime ngay trước drawImage" sẽ không sửa được
   mislabel (phase jitter ±1/±2 tồn tại ở độ trễ ≈ 0). Fix đúng hướng: gán
   nhãn snapshot theo frame TRÌNH CHIẾU thật (metadata rVFC /
   `presentedFrameIndex` / `requestVideoFrameCallback` cho cả đường tick,
   hoặc đọc presented frame từ video element nếu trình duyệt phơi) — cần
   batch riêng + test hồi quy. Lưu ý: fix chỉ có ý nghĩa khi pump chết
   (đường fallback), không phải đường chính.
2. **6/133 ca không khớp — thu hẹp còn 2 chữ ký, chưa đóng hẳn.**
   (a) Lật mức 37↔84 (4/5 cũ): kiểm tra giả thuyết "cửa sổ blend thật
   lệch ±1 do presented jitter" bằng cách dự đoán gStd theo cửa sổ dịch
   ±1 (thay vì cửa sổ nhãn) trên dữ liệu cũ + mới. (b) Đơn-frame ~112
   (1/5 cũ + 1/1 mới): thêm wallMs + element id vào mẫu probe để phân
   biệt ghi đè giữa chừng vs artifact biên pass; 1 ca run A của A2 chưa
   chạy lại (dữ liệu cũ còn nguyên, chạy lại bằng `analyze-b2.py` với
   `preview-abcde-assert99a2.json`).
3. **Run pump-alive quá thưa để ước tỉ lệ fail chính xác** (P10: 9 mẫu
   hợp lệ / 133 khung; P20: 24/217 — bottleneck là `lastDrawnFrameIdx !=
   frameIdx` dưới tải: 101 drawnStable nhưng chỉ 9 khớp frameIdx ở P10).
   Cần 1 run DENSE đúng nghĩa (load < 2, không chạy song song) để đo lại
   tỉ lệ fail + tách phase jitter khỏi stall (xem §3.2).
4. **WebKit chưa đo** — không có driver playwright trong môi trường này;
   cần cài playwright (ngoài phạm vi luồng B2) hoặc probe WebKit riêng.
   Độ lớn phase jitter trên WebKit có thể khác Chromium.
5. **Đứng yên theo LIMITS gộp đợt 99 §4:** 2 MiB điểm nối chính xác;
   re-arm (B3 đang làm song song — xem §7); watchdog freeze; blur B-band;
   zombie straggler; G1 chờ user quyết metric G5/M2; EPERM probe; harness
   O8; TTS 39 cấm kiểm lại; birefnet chờ RAM; ci-security.yml 403;
   release gate không đổi.
6. **Quirk nhãn tick đường tick (A2 §1.3)** vẫn còn: `ringLast`/`ringPrev`
   của tick ở đường tick là ring SAU KHI snapshot frame hiện tại — batch
   harness riêng, không làm ở đây.

## 7. Xung đột luồng (preview.tsx sửa song song trong đợt 100)

- Baseline đầu lượt: md5 `efce65ddfb3f0dca2b2a44a2250f5f90` (khớp cuối A2).
- 20:43:31Z — luồng **B4** sửa: marker "Đợt 100 B4" ×3
  (`samplePlainCurrentPixStrip`, plain-path curPix strip + 2 call site
  ~4031/~4100). Chỉ-đo, không đụng blend math / ring / snapshot tick.
  md5 sau B4: `2efb80d355e655dffa3f04b3a44efbf5`.
- ~20:44–20:46Z — B2 sửa (6 marker, xem §1). md5 sau B2:
  `ca9ea4bbe233d1d74a10db24c1fc563f`.
- 20:46:39Z — luồng **B3** sửa: marker "Đợt 100 B3" ×5 (burst-rate đuôi
  re-arm, dòng ~5699/~5900/~6111/~6143/~7350 — vùng re-arm tail, không
  đụng blend/ring/snapshot). md5 cuối: `94ee64c0525c8d34f14ba9a579d516ef`.
- **Cả 3 probe B2 chạy SAU 20:46:39** (vite B2 start 20:47:18, probe
  20:48–21:00) nên cùng 1 phiên bản code (B2+B3+B4); đã verify code serve
  chứa `tickLabelCtx` ×5 và vùng B2 nguyên vẹn sau cùng (B2 ×6, B4 ×3,
  B3 ×5). Blend math không đổi qua các lần sửa (chỉ thêm instrumentation
  chỉ-đo ở vùng khác nhau).

## 8. File B2 tạo/sửa (batch stage)

- `apps/web/src/preview.tsx` — `MotionBlurSnapshotPix` + 7 trường timing
  tuỳ chọn + `TickLabelCtx`/`tickLabelCtx` + tham số `timing?` ở
  `recordMotionBlurSnapshotPix` + mốc snap ở `updateMotionBlurSnapshots` +
  mốc nhãn ở `drawVideoClip` (sau `frameIdx`) + mốc raw ở `rawUnitSource`
  (6 marker "Đợt 100 B2"; chỉ vùng đo; không chạm drift Y4 / watchdog Y5 /
  clip-change Y7 / re-arm Z3 / A6 / B3 / B4).
- `docs/PHASE9_ROUND100_B2_GHOST_TICK_TIMING_LIMITS.md` — file này.
- Scratch đo (không vào batch):
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/round100-b2/`
  (`boot.log`, `probe100b2-ghost-tick.cdp.mjs` (bản sao probe91s1 + dump
  tickCost), `preview-b-norvfc-b2.json`, `preview-b-pumpalive-b2.json`,
  `preview-b-pumpalive-b2b.json`, `assert100b2-*.log`, `analyze-b2.py`
  (phần T + W), `analyze-b2b.py` (phần T tinh-chế), `analyze-b2*.txt`,
  `vite-5173-b2.log`).
- Batch stage:
  `~/workspace/repo-1-push/paths-loop/phase9-round100-b2-ghost-tick.txt`
  (NUL-delimited). KHÔNG push GitHub; user tự push sau từ main chat.
