# PHASE9_ROUND99_A2_GHOST_LIMITS — expose ring snapshots + chẩn đoán mức pixel residual 13,8%

> Luồng A2, đợt 99, lượt cron 00:35 +07 13/11/2026. Repo `~/workspace/repo-1` (cây làm việc).
> Nợ LIMITS gộp đợt 98 §4 mục 3: "Ghost residual 13,8% — race pixels bị bác làm
> cơ chế chính; cơ chế còn lại chưa rõ (n nhỏ, chế độ đo thưa); cần chẩn đoán
> mức pixel (expose ring snapshots)".
> KHÔNG push. KHÔNG release/tag. Không đụng TTS 39, birefnet, `.github/workflows`, 0 binary.
>
> **Kết quả chính (3 ý, xem §5):**
> 1. **Snapshot trong ring CHỨA ĐÚNG pixels nhãn của nó — ở đường rVFC
>    (99,4%, n=872).** Z2 bị bác race capture được xác nhận lại với n gấp
>    ~6 lần; race +1 thật chỉ 0,8% (callback trễ ~17–20 ms), quá hiếm để
>    giải thích residual.
> 2. **Residual được giải thích bởi THÀNH PHẦN CỬA SỔ, không phải nội dung
>    pixels:** dự đoán gStd theo cửa sổ THẬT (ghostPix + curPix) khớp
>    trong ±5 ở **127/133 = 95,5%**, trong khi dự đoán theo triple(P) nhãn
>    chỉ 85/174 = 48,9% (chế độ thưa). 96,6% cửa sổ thật khác triple(P) —
>    cửa sổ gap do capture thưa + frame hiện tại lệch ±1 lúc blend.
>    Lệch curPix giàu hơn có ý nghĩa ở outlier (gộp Z2+A2: 41,5% vs
>    24,1%, Fisher một phía p = 0,0031).
> 3. **Cơ chế MỚI, chỉ ở đường tick (fallback khi pump chết): snapshot
>    đường tick bị GÁN SAI NHÃN một cách hệ thống — chỉ 47,4% sạch**
>    (n=251): lệch +1 mod 5: 27,9%, ±2/±3 mod 5: 19,1%, −1 mod 5: 5,6%.
>    Đúng vào trường hợp Z2 mất dữ liệu (10/23 outlier ghost "không dữ
>    liệu" là snapshot đường tick). **KHÔNG sửa production trong luồng này**
>    (xem §6).

## 0. Môi trường đo

- Boot 99338d31 (reboot ~17:26Z). Lượt chạy 17:39–18:15Z.
- Vite riêng A2 trên 5173 (đã verify serve code A2 trước probe: `ghostPix`/
  `blendGhostPixStrip`/`recordMotionBlurSnapshotPix` có trong file serve;
  comment "Đợt 99 A2" bị esbuild lược khi serve — chỉ mã mới được kiểm).
- Probe: `probe91s1-motionblur-rvfc.cdp.mjs` (y hệt Z2, chỉ đổi cổng CDP):
  - Run A: `--cases a,b,c,d,e --passes 10 --assert --cdp-port 9239`
    (17:47–17:51Z, exit 0, **ASSERT PASS toàn bộ** — khác Z2: assert
    spread case B lần này xanh).
  - Run B: `--cases b --passes 15 --assert --cdp-port 9240` (17:53–17:57Z,
    exit 0, ASSERT PASS; load lúc chạy ~1,0 — cửa sổ yên hiếm hoi).
  - Run C (no-RVFC): `--cases b --passes 5 --assert --disable-rvfc
    --cdp-port 9241` (18:09–18:11Z, exit 0, ASSERT PASS; 0 pump event,
    128/128 blend tick qua đường tick).
- Chromium Playwright 1254 (mỗi probe 1 instance, dọn sau mỗi lượt).
- **Tải nền cao suốt run A** (load 6,9–15,7 — các luồng đợt 99 khác chạy
  probe song song, vd A7): capture THƯA như Z2 (case B run A: 142 capture /
  10 pass ≈ 14/pass; mẫu hợp lệ chỉ 56 so với 81 của Z2). Run B yên hơn
  nhưng vẫn thưa (219 capture / 15 pass, 118 mẫu hợp lệ). Mọi tỉ lệ
  outlier dưới đây gắn caveat "chế độ thưa" — KHÔNG so trực tiếp tỉ lệ
  outlier với Y2 dense 13,8% (xem §5.4).

## 1. Instrumentation đã thêm (chỉ đo, không đổi hành vi) — marker "Đợt 99 A2" ×8

### 1.1 Gắn strip lên canvas snapshot (`MotionBlurSnapshotPix` + WeakMap)

- `motionBlurSnapshotPix: WeakMap<HTMLCanvasElement, {frame, pix, w, h}>`
  + helper `recordMotionBlurSnapshotPix(snap, ctx, frame, preStrip?)`.
  Gắn TRÊN canvas snapshot (không mảng song song — canvas tái dùng thì
  entry bị ghi đè lúc vẽ lại, ring xoá thì entry tự GC theo canvas).
- Ghi ở CẢ 2 điểm capture (sau `drawImage`, cùng tick):
  - `updateMotionBlurSnapshots` (đường tick) — frameIndex của tick.
  - `rvfcCaptureFrame` (đường rVFC) — dùng lại `pump.lastPixStrip` đã đọc,
    không `getImageData` lần 2.
- `frame` = nhãn frame video lúc capture; `pix` = strip 48 mẫu G
  (`sampleStripeStrip` của Z2, cùng tọa độ); `w/h` = kích thước snapshot
  lúc capture (để mô phỏng ground truth đúng hình học khi đối chiếu).

### 1.2 Stash ghost đã blend (`blendGhostPixStrip`) + trường `ghostPix` ở blend tick

- `compositeMotionBlurLayer`: sau khi tính `snaps` (ĐÚNG các ghost snapshot
  sắp blend — đã loại snapshot trùng frame hiện tại khi skipLatest),
  stash strip của chúng: `blendGhostPixStrip.set(clipId, snaps.map(...))`.
- `recordDrawnBlendWindow` đọc rồi xoá stash trong cùng tick (cùng mẫu
  stash 1-tick như `blendCurrentPixStrip`), ghi vào `RvfcBlendTickSample`
  mới: `ghostPix: (MotionBlurSnapshotPix | null)[] | null`.
- Probe dump nguyên object `__vcutRvfcBlendTick` nên không cần sửa probe.
- Phủ: ghostPix null = **0** ở cả 3 run (run A: 183/183 tick; run B:
  276/276; run C: 128/128). Mọi snapshot đều 640×360 (rVFC unit và tick
  rawUnit cùng MASK_MAX_W=640, s=0,5 — cùng hình học mô phỏng của Z2).

### 1.3 Căn nhãn ghostPix với nhãn ring (kiểm tra nội bộ §4)

- Run A: căn đúng **162/162** tick (0 sai). Run B: **251/251** tick.
- Run C (đường tick): "sai" 111/123 — KHÔNG phải lỗi A2, xem §4.3:
  nhãn `ringLast`/`ringPrev` của tick ở đường tick là ring SAU KHI đã
  snapshot frame hiện tại (snapshot đường tick chạy SAU composite trong
  cùng tick, `preview.tsx` ~3748), trong khi blend dùng ring TRƯỚC đó —
  nhãn tick lệch đúng 1 snapshot so với ghost thật. Ở đường rVFC không
  có snapshot sau blend nên nhãn đúng. Đây là quirk gán nhãn harness có
  từ trước (xem §6 mục 4), không phải hồi quy do A2: ghostPix[].frame
  vẫn là ghost thật đã blend (đối chiếu §2.1 độc lập với nhãn tick).

## 2. Verdict 1 — snapshot trong ring chứa đúng pixels nhãn (đường rVFC)

### 2.1 Phương pháp

- Đối chiếu trực tiếp từng entry `ghostPix` của blend tick case B với
  ground truth mô phỏng từ frame nguồn (resize BILINEAR → 640×360, strip
  y=180, x0=128, 48 mẫu G, ngưỡng 128 → 48 bit; khớp = hamming ≤ 2 trong
  nhãn ±3, phân loại theo TẬP khớp như Z2 — clip gốc có frame trùng
  (6k+2 == 6k+3) và tuần hoàn 5 frame nên không kết luận lệch khi nhãn
  nằm trong tập khớp).
- Đối chiếu chéo: nhãn ghostPix với nhãn ring (xem §1.3).

### 2.2 Số liệu (đường rVFC, pump sống)

| | Run A (10 pass) | Run B (15 pass) | Gộp |
|---|---|---|---|
| Ghost snapshot (ghostPix) | 345 | 527 | 872 |
| Khớp nhãn | **345 (100%)** | **522 (99,1%)** | **867 (99,4%)** |
| Lệch −1 thật | 0 | 0 | **0** |
| Lệch +1 thật | 0 | 5 (0,9%) | 5 (0,6%) |
| Không khớp frame nào gần nhãn | 0 | 0 | 0 |
| Entry null / không strip | 0 | 0 | 0 |

- 5 ca +1 ở run B thực chất chỉ là **2 snapshot** (nhãn 3 chứa pixels 4;
  nhãn 5 chứa pixels 6) được blend lại ở nhiều tick liên tiếp
  (seq 47–48 dùng snapshot 3; seq 126–128 dùng snapshot 5). Cùng 2 ca
  capture +1 ở §3 (seq pump 45 nhãn 3, seq 131 nhãn 5) — snapshot gán
  sai nhãn ở lại trong ring và bị blend lại nhiều tick.
- (D) căn nhãn: run A 162/162, run B 251/251 — strip gắn đúng canvas,
  không có chuyện gán nhầm strip giữa các snapshot (kể cả khi canvas
  tái dùng).

### 2.3 Kết luận

- **Snapshot trong ring chứa đúng pixels nhãn của nó (đường rVFC)** với
  n=872 (gấp ~6 lần Z2) — kết luận "race pixels lúc capture bị bác làm
  cơ chế chính" của Z2 được xác nhận lại mạnh hơn. Không có lệch −1 thật
  nào ở cả 3 tập dữ liệu (Z2 + A + B).
- Race +1 thật tồn tại nhưng hiếm (0,6–0,9%): callback trễ ~17–20 ms,
  guard freshness không chặn (xem §3). Không giải thích được residual.

## 3. Kiểm lại Z2 (A) trên dữ liệu mới — pump pix

| | Z2 (5 pass) | Run A (10 pass) | Run B (15 pass) | Gộp |
|---|---|---|---|---|
| Capture có pix | 138 | 142 | 219 | 499 |
| Khớp nhãn | 136 (98,6%) | 142 (100%) | 217 (99,1%) | **495 (99,2%)** |
| Lệch −1 thật | 0 | 0 | 0 | **0** |
| Lệch +1 thật | 2 (1,4%) | 0 | 2 (0,9%) | 4 (0,8%) |

- 2 ca +1 run B: seq=45 nhãn 3 → pixels 4 (lateMs 17,1, ctDeltaMs 10,3),
  seq=131 nhãn 5 → pixels 6 (lateMs −1,7, ctDeltaMs 22,3) — cùng chữ ký
  callback trễ / currentTime chạy sau trình chiếu như Z2.
- `capMs` trung vị 17,2 ms (run A) / 13,7 ms (run B); p90 89,0 / 78,9 —
  nhiễm tải như Z2.

## 4. Verdict 2 — cơ chế MỚI: snapshot đường tick bị gán sai nhãn hệ thống

### 4.1 Phương pháp

- Ép đường tick bằng `--disable-rvfc` (run C, 5 pass case B): 0 pump
  event, 128/128 blend tick qua đường tick (`ticksNoPump=128`).
  Đối chiếu `ghostPix` y hệt §2.1.

### 4.2 Số liệu (đường tick, n=251 ghost snapshot)

- Khớp nhãn: **119 (47,4%)** — trong đó trùng lặp với frame kề: 68.
- Lệch +1 (mod 5): **70 (27,9%)**; lệch −1 (mod 5): **14 (5,6%)**;
  lệch ±2/±3 (mod 5): **48 (19,1%)** ("OTHER" ở matcher ±3 — strip
  khớp frame cách nhãn 2–3, hoặc tương đương mod 5 xa hơn).
- Mọi strip (251/251) đều khớp CHÍNH XÁC (hamming 0) một frame nguồn
  nào đó — nội dung là pixels của 1 frame thật duy nhất, chỉ NHÃN sai.
  (Lưu ý: strip tuần hoàn 5 frame nên "lệch" chỉ xác định được mod 5;
  phân loại ±1/±2/±3 đọc theo mod 5 như Z2 §3.2.)
- Ở cấp mẫu (v3, §5.3): ghost của tick đã khớp — outlier: lệch 12/15,
  sạch 3/15; đối chứng: lệch 17/24, sạch 7/24. Tỉ lệ lệch ở mẫu cao hơn
  ở cấp snapshot (1 tick lệch nếu BẤT KỲ ghost nào lệch: 1−0,47² ≈ 78%).
- Chế độ đo: run C cũng thưa (26 tick/pass, clip 90 frame/pass → element
  tiến ~3,5 frame/tick).

### 4.3 Cơ chế (phù hợp với thứ tự code + phân bố lệch)

- Nhãn snapshot đường tick = `frameIndex` từ `srcEl.currentTime` đọc
  ở ĐẦU `drawVideoClip` (`preview.tsx:3519–3525`); pixels = frame element
  ĐANG TRÌNH CHIẾU lúc `drawImage` về sau trong cùng tick — sau các bước
  pipeline/LUT/mask (đắt CPU). Dưới tải, tick dài hàng chục ms → video
  tiến thêm 1–3 frame giữa lúc đọc nhãn và lúc vẽ snapshot. Đường rVFC
  miễn nhiễm: nhãn lấy từ `metadata.mediaTime` của chính callback +
  vẽ ngay trong callback.
- Phân bố lệch bất đối xứng ủng hộ cơ chế này: lệch + (hiển thị chạy
  trước nhãn): +1/+2/+3 = 47% so với lệch −1: 6% (phần còn lại sạch 47%
  — tick nhanh thì Δ < 33 ms, chưa sang frame mới).
- Kiểm tra tương quan với khoảng cách giữa các tick: KHÔNG kết luận
  được (clean 41% / 27% / 54% / 50% ở các bucket gap <40 / 40–80 /
  80–150 / >150 ms — không đơn điệu). Đúng ra vì gap giữa các tick
  ≠ thời gian làm việc TRONG tick (cái quyết định lệch là Δ từ lúc đọc
  `currentTime` đến lúc `drawImage`, không đo trực tiếp được từ log
  hiện tại — JSON probe không chứa tick-cost). **Cơ chế ở mức "phù hợp
  với bằng chứng", chưa chứng minh nhân quả trực tiếp** (xem §6 mục 2).
- Hệ quả: cơ chế này CHỈ cắn khi pump chết/fallback (đúng lúc tải nặng
  — đúng lúc Z2 mất dữ liệu 10/23 outlier). Ở chế độ pump sống, nó
  không xuất hiện (0 snapshot đường tick ở run A/B).

## 5. Verdict 3 — residual được giải thích bởi thành phần cửa sổ (không phải pixels)

### 5.1 Phương pháp (phân tích v3 — gán pass đúng)

- Matcher v1 (chia tick theo biên reset-capture) vỡ ở run B: pump log
  chỉ có 12 biên cho 15 pass (2 pass bắt đầu không reset ring) → 50/54
  outlier "không dữ liệu". Matcher v2 (quét đơn điệu theo tBlend) vỡ
  vì frame trong 1 pass không theo thứ tự thời gian (pass warmup 0–1
  có 1500 frame/loop nhiều vòng, vt không đơn điệu) + mẫu warmup/seek
  mang nhãn dbg cũ (frame 0 nhưng P=5).
- V3: gán mỗi sample-pass vào tick-nhóm có nhiều mẫu khớp nhất (khớp
  full key + `currentTime ≤ vt+5ms`), rồi khớp trong nhóm theo luật Z2
  (currentTime lớn nhất). Ma trận gán sạch: run B pass 2–14 → nhóm
  0–12 (lệch đúng 2 — pass 0–1 warmup không có tick trong log, khớp
  0/10 và 2/5 lẻ); run A pass 0–9 → nhóm 0–9. Khớp được tick: run A
  56/56, run B 103/118.
- Dự đoán "cửa sổ THẬT": cửa sổ = {ghost frames từ ghostPix} ∪
  {frame hiện tại thật từ curPix (đơn-khớp) — nếu không thì P};
  mô phỏng gStd = std lõi của trung bình 3 frame đó (trọng số bằng
  nhau, như sim triple của Z2/Y2). So với dự đoán triple(P) nhãn.

### 5.2 Số liệu — dự đoán theo cửa sổ thật vs triple(P)

| | Run A | Run B | Gộp |
|---|---|---|---|
| Mẫu hợp lệ | 56 | 118 | 174 |
| triple(P) khớp ±5 | 22 (39,3%) | 63 (53,4%) | 85 (48,9%) |
| Cửa sổ thật: tính được | 44 | 89 | 133 |
| Cửa sổ thật KHÁC triple(P) | 40 (90,9%) | 86 (96,6%) | 126 (94,7%) |
| Cửa sổ thật khớp ±5 | **43/44 (97,7%)** | **84/89 (94,4%)** | **127/133 (95,5%)** |
| Sai số trung vị / p90 | 0,2 / 0,6 | 0,3 / 0,8 | — |

- 6/133 ca cửa sổ thật KHÔNG khớp (4,5%): đều là lật mức 37↔84, trừ 1 ca
  đo 111,8 (≈ mức 1 frame — như không blend). Kiểm tra 1 ca (run B pass 9
  P=44, đo 111,8, cửa sổ [37,42,44] dự đoán 37,5): tick khớp duy nhất
  trong nhóm có nhãn đó (seq=159, P=44, exp=45, ghosts [37,42]); frame
  44≡45 pixel-identical nên cửa sổ [37,42,45] cũng cho 37,5 — pixels đo
  được KHÔNG phải từ blend này (khả năng cao: sau blend, 1 lần vẽ trực
  tiếp 1 frame đã ghi đè lên canvas trước lúc đo — giới hạn gán
  mẫu↔tick của harness, không phải cơ chế sản phẩm mới).
- Kết luận: **ở chế độ pump sống, residual gần như hoàn toàn là do cửa
  sổ blend THẬT khác cửa sổ nhãn triple(P)** — cửa sổ gap do capture
  thưa (ghost cách P nhiều frame) + frame hiện tại lệch ±1 lúc blend
  (curPix). Nội dung pixels của ghost KHÔNG đóng góp (ghost sạch 102/102
  ở mẫu đã khớp cả 2 run).

### 5.3 curPix lệch giàu hơn ở outlier — nay CÓ ý nghĩa thống kê (gộp)

- Lệch rõ (đơn-khớp) curPix: run A outlier 7/25 vs đối chứng 2/21
  (p=0,114); run B 7/40 vs 6/46 (p=0,391); Z2 8/19 vs 9/51 (p≈0,07).
- Gộp 3 tập (cùng định nghĩa, bỏ "trộn lẫn" khỏi mẫu số): outlier
  22/84 = 26,2% vs đối chứng 17/118 = 14,4%, **Fisher một phía p = 0,0286**.
- Tính cả "trộn lẫn" (đa-khớp nhưng không chứa P — strip khớp P±1 mod 5
  và bản sao chu kỳ của nó, vẫn là bằng chứng lệch): outlier 44/106 =
  41,5% vs đối chứng 32/133 = 24,1%, **Fisher một phía p = 0,0031**.
- Z2 kết "gợi ý mạnh nhưng chưa kết luận chắc (p≈0,07)" nay được nâng
  lên **có ý nghĩa thống kê ở n gộp 239**. Hướng lệch vẫn là +1 chiếm
  đa số (đúng kỳ vọng: tick chạy sau khi element lật sang frame kế
  nhưng presented vẫn là P).

### 5.4 Caveat về tỉ lệ outlier "thưa" vs Y2 dense 13,8%

- Tỉ lệ outlier (|đo − triple(P)| ≥ 10) ở các run thưa: run A 60,7%,
  run B 45,8%, run C 38,5% — CAO HƠN NHIỀU so với Y2 dense 13,8%.
  Đây là HỆ QUẢ của chế độ thưa (cửa sổ gap), không phải residual tăng:
  khi cửa sổ thật khác triple(P) ở 95% mẫu thì "outlier theo triple(P)"
  gần như đo tỉ lệ gap, không đo residual dense. **Không dùng các tỉ lệ
  này để cập nhật con số 13,8% của Y2.** Residual dense (pump sống,
  cửa sổ liên tiếp) vẫn là câu hỏi mở riêng — xem §6 mục 3.

### 5.5 Metric pha sọc — KHÔNG vượt gStd, không thay thế

- Trên CÙNG tập cửa sổ triple liên tiếp: run A pha 4/6 = gStd 4/6;
  run B pha 5/13 (38,5%) vs gStd 8/13 (61,5%); run C n=0 (không có
  cửa sổ liên tiếp nào — đường tick KHÔNG BAO GIỜ blend triple liên
  tiếp trong run này).
- Gộp: pha 22/36 = 61,1% (thêm Z2: 13/17) vs gStd 12/19 = 63,2%
  (run A+B, cùng tập). Điều kiện Z2 đặt ra ("pha ≥90% trong khi gStd
  vẫn ~86%") KHÔNG đạt. **Giữ gStd làm chuẩn chính; không đưa pha vào
  assert.** (Lưu ý: pha lệch +1 chiếm đa số ở run B — phù hợp với
  curPix +1: frame giữa thật của cửa sổ lệch +1 so với nhãn.)

## 6. Kiểm chứng

- `tsc` apps/web: **0**.
- `vite build`: **PASS 19,73 s**.
- `ghostBlend.probe.test.ts`: **15/15 PASS**.
- `previewEngine` test (`node --experimental-strip-types`): **25/25 PASS**.
- Probe assert: run A / B / C đều **ASSERT PASS** (exit 0).
- Không sửa file Y2/Z2; không đụng production logic ngoài instrumentation
  chỉ-đo (1 `getImageData` 48×1 mỗi snapshot + 1 WeakMap set; không đổi
  thứ tự vẽ, không đổi weights, không đổi gate).

## 7. Nợ mở (cho đợt sau)

1. **Residual 13,8% (Y2 dense) — THU HẸP ĐÁNG KỂ, chưa đóng hẳn.**
   - Đã loại trừ: nội dung pixels snapshot (rVFC 99,4% sạch, n=872).
   - Đã giải thích ở chế độ thưa: thành phần cửa sổ (95,5% dự đoán khớp).
   - Còn lại: (a) residual dense thật (pump sống + cửa sổ liên tiếp) —
     cần 1 run DENSE đúng nghĩa (load < 2, không chạy song song) để đo
     lại tỉ lệ outlier và kiểm tra mô hình cửa sổ thật trên đó; (b) 6/133
     ca cửa sổ thật không khớp (giới hạn gán mẫu↔tick, §5.2).
2. **Cơ chế đường tick (§4) — đã chẩn đoán, chưa sửa, chưa chứng minh
   nhân quả trực tiếp.** Cần đo thời gian trong-tick (từ lúc đọc
   `currentTime` ở `drawVideoClip` đến lúc `drawImage` snapshot) để
   khẳng định; fix ứng viên (nhãn snapshot theo presented frame /
   đọc lại `currentTime` ngay trước `drawImage` / guard freshness cho
   đường tick) cần batch riêng + test hồi quy, KHÔNG làm trong luồng
   chẩn đoán này. Lưu ý: fix chỉ có ý nghĩa khi pump chết — chế độ
   fallback, không phải đường chính.
3. **2 ca capture +1 thật / run (0,8%)** — xem lại ngưỡng guard
   freshness (dùng `captureTime`/`expectedDisplayTime` thay cho
   `currentTime`?) — nợ từ Z2, chưa làm.
4. **Quirk nhãn tick đường tick (§1.3):** `ringLast`/`ringPrev` của tick
   là ring SAU KHI snapshot frame hiện tại (snapshot chạy sau composite)
   — harness nhóm theo cửa sổ đã vẽ ở đường tick đang lệch 1 snapshot.
   Cân nhắc ghi nhãn ring TRƯỚC snapshot (đọc từ stash lúc composite)
   thay vì đọc dbg sau — batch harness riêng, không làm ở đây.
5. **Metric pha:** giữ làm công cụ chẩn đoán phụ, không đưa vào assert
   (§5.5).
6. **Đứng yên theo LIMITS gộp đợt 98 §4:** 2 MiB; re-arm CANCELLED;
   watchdog freeze; blur B-band; zombie straggler; G1 chờ user quyết;
   EPERM probe; harness O8; TTS 39 cấm; birefnet chờ RAM;
   ci-security.yml 403; release gate không đổi.
7. **Xung đột luồng:** luồng A6 (đợt 99) cũng sửa `preview.tsx` cùng
   thời điểm (marker "Đợt 99 A6" ×5, vùng rvfcCallback/clip-active —
   không đụng vùng ring/blend/pump của A2). Không phát hiện revert hay
   xung đột marker lúc A2 probe chạy (md5 cuối `efce65ddfb3f0dca2b2a44a2250f5f90`,
   8 marker A2 còn nguyên). Nếu A6 sửa cùng hàm sau đó, cần kiểm tra
   lại md5 trước khi dùng số đo này làm baseline.

## 8. File A2 tạo/sửa (batch stage)

- `apps/web/src/preview.tsx` — `MotionBlurSnapshotPix` + WeakMap +
  `recordMotionBlurSnapshotPix` (2 điểm capture) + stash `blendGhostPixStrip`
  trong `compositeMotionBlurLayer` + trường `ghostPix` ở `RvfcBlendTickSample`
  / `recordDrawnBlendWindow` (8 marker "Đợt 99 A2"; chỉ vùng ring/blend;
  không chạm drift Y4 / watchdog Y5 / clip-change Y7 / re-arm Z3 / A6).
- `docs/PHASE9_ROUND99_A2_GHOST_LIMITS.md` — file này.
- Scratch đo (không vào batch):
  `~/workspace/goals/capcut-clone-video-editor/hidden_files/round99-a2/`
  (`preview-abcde-assert99a2.json`, `preview-b-assert99a2.json`,
  `preview-b-norvfc-assert99a2.json`, `assert99a2*.log`,
  `analyze-a2.py`, `analyze-a2b.py` (sweep matcher — vỡ, xem §5.1),
  `analyze-a2c.py` (v3 — gán pass đúng, dùng cho §5),
  `analyze-a2*.txt`, `vite-5173-a2.log`).
- Batch stage:
  `~/workspace/repo-1-push/paths-loop/phase9-round99-a2-ghost.txt`
  (NUL-delimited). KHÔNG push GitHub; user tự push sau từ main chat.
