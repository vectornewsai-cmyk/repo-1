# Phase 9 đợt 76 — luồng D5: gate — theo dõi thêm phiên FN + slow-start

**Ngày:** 09/11/2026 (lượt cron 00:35 +07; đo 17:47–18:28 UTC).
**Trạng thái:** ĐO XONG — VERDICT: **GIỮ NGƯỠNG 30**; **FN chuẩn mới 1/3
phiên (S1, slot 0,58 fps) — re-gate BẮT ĐÚNG (delta 17)**; **FP kiểm duyệt
mới 2/2 phiên khỏe chết ở re-gate (delta 27 ở tải thấp, delta 18 dưới sóng
tải)** — **3/5 lần re-gate giết phiên từ trước tới nay là giết oan**;
**slow-start +2 s ở cả 3 lần diag** (phạm vi gộp vẫn +2..+20 s);
**gate 1a chết 3/6 lần thử** (delta 4, 2, 15) — tệ nhất kể từ B8;
**cold start median 34,3 s tới mount** (trước reboot 38,7 s / sau reboot
17,1 s — chẻ đôi rõ rệt). Không sửa code production, không sửa launcher/
analyzer/harness gốc. Không push (chỉ stage); không release/tag.

## 1. Kết luận (verdict)

| Câu hỏi | Trả lời |
|---|---|
| Có thêm phiên FN chuẩn không? | **CÓ — 1 phiên (S1 = session1-attempt4).** Slot 1 draw **0,58 fps** (presented 8,43 fps) sau gate PASS delta 23. Đây là phiên FN chuẩn thứ 4 (sau Y3-S1, A6-S1, B8-S1). |
| Re-gate có bắt được FN mới không? | **CÓ — BẮT ĐÚNG (delta 17 < 30 → FAIL → phiên chết).** Tỉ lệ bắt nay **3/4 phiên FN chuẩn** (Y3-S1, A6-S1, D5-S1 bắt được; B8-S1 lọt). |
| Re-gate có FP mới không? | **CÓ — 2 FP kiểm duyệt mới (S2 delta 27, S3 delta 18).** Cả hai slot 1 đều khỏe (15,04 / 16,35 fps, presented ~30). FP kiểm duyệt gộp nay **3/3** (C4-S3 + D5-S2 + D5-S3). |
| Ngưỡng 30 còn đúng không? | **GIỮ NGUYÊN.** Cơ sở xem §3: ngưỡng trong (21, 27] nhỉnh hơn trên dữ liệu đã quan sát (cùng bắt FN 3/4, bớt 1 FP) nhưng mức hơn chỉ đúng **1 phiên** (D5-S2 delta 27) trên n(FN)=4 — chưa đủ chứng minh; và FN 17 vs khỏe 18 chỉ cách nhau **1 draw**, chứng tỏ vấn đề là cấu trúc (cửa sổ 6 s đo nhiễu slow-start), không phải ngưỡng. |
| Slow-start đo thêm được gì? | **+2 s ở cả 3 lần diag D5** (rs=4 từ mẫu +2 s, duy trì suốt timeline). Phạm vi gộp nay: +2 s × 4 lần, +15, +18, +20 s. Nhưng **slot 1 vẫn FN ở cả 3 diag** (0,2 / 1,2 / 1,0 fps) — cửa sổ gate khỏe không dự đoán được slot 1. |
| Cold start editor bao nhiêu? | **Median 9 lần chạy D5: vite lên 2,99 s; vite lên → mount 30,28 s; tổng tới mount 34,30 s.** Chẻ đôi theo reboot 18:14 UTC: trước reboot 38,7 s, sau reboot 17,1 s (xem §5). |
| Phiên lạnh thật thì sao? | **CÓ 1 phiên lạnh thật (S2 — Chrome đầu tiên sau reboot 18:14) và nó KHỎE** (slot 15,04 fps, không FN). Phiên lạnh có số đo đầy đủ nay 4 phiên: FN 2/4 (V4-P1, A6-S1 FN; Z3-S1, D5-S2 không FN). |
| Resume-probe dưới tải thì sao? | **Stall đói-decoder kiểu Z3-S1 tái hiện lần 4 (diag3 probe B: 2,13 fps, rs=1 39/50, seeking 39/50)** — nhưng lần này shortPause ĐÃ settle (seeking=false, rs=4, sleeping=true), khác 2 lần C4. Xem §6. |

## 2. Kết quả đo thật — 3 phiên chuẩn + 3 phiên diag + 3 lần chết ở gate

Clip `long1080.mp4` 20 s (h264 1080p 30 fps, GOP ~1,97 s), canvas preview backing
871×275, Chrome headed + Xvfb, VM 2 vCPU/8 GB. Cửa thứ hai BẬT, ngưỡng 30
(mặc định, không đổi). Launcher + analyzer Z3 tái sử dụng NGUYÊN.

| Phiên | Gate 1a (delta / load) | Slot draw fps (rep 1/2/3) | Re-gate (delta / load) | Verdict |
|---|---|---|---|---|
| **S1** (session1-attempt4; ấm sau diag) | **23 PASS** (3,83 fps), load 1,97 | **0,58** (chỉ slot 1; presented 8,43) | **17 FAIL** (2,83 fps), load 9,89 → **PHIÊN CHẾT** | **FN, re-gate BẮT ĐÚNG** |
| **S2** (LẠNH THẬT, Chrome đầu tiên sau reboot 18:14) | **31 PASS** (5,17 fps), load 4,05 | **15,04** (chỉ slot 1; presented 29,88) | **27 FAIL** (4,5 fps), load 2,80 → **PHIÊN CHẾT** | **FP re-gate (kiểm duyệt)** — slot 1 khỏe |
| **S3** (ấm, sau S2) | **36 PASS** (6 fps), load 4,40 | **16,35** (chỉ slot 1; presented 29,92) | **18 FAIL** (3 fps), load 7,28 → **PHIÊN CHẾT** | **FP re-gate (kiểm duyệt)** — slot 1 khỏe |
| S1 lần 1 (LẠNH THẬT, Chrome đầu tiên sau reboot 16:03) | **FAIL delta 4**, load 2,95 | — | — | Chết ở gate 1a (exit 2) |
| S1 lần 2 | **FAIL delta 2**, load 0,68 | — | — | Chết ở gate 1a (exit 2) |
| S1 lần 3 | **FAIL delta 15**, load 17,70 | — | — | Chết ở gate 1a (exit 2) |
| diag1 (gate 60 s, KHÔNG chuẩn) | 56/60 s (delta 56) | **0,20** (chỉ slot 1; presented 5,48) | **15 FAIL** (2,5 fps), load 15,07 → **PHIÊN CHẾT** | **FN (quan sát), re-gate BẮT ĐÚNG** |
| diag2 (gate 60 s, KHÔNG chuẩn) | 52/60 s (delta 52) | **1,20** (chỉ slot 1; presented 19,19) | **18 FAIL** (3 fps), load 11,19 → **PHIÊN CHẾT** | **FN (quan sát), re-gate BẮT ĐÚNG** |
| diag3 (gate 60 s, KHÔNG chuẩn) | 86/60 s (delta 86) | **1,00** / 20,45 / 17,51 (presented 21,68 / 30,03 / 29,84) | **87 PASS** (14,5 fps), load 2,09 | **FN (quan sát), re-gate LỌT** |

**Gộp Y3+Z3+A6+B8+C4+D5 (phiên chuẩn):** FN **5/38 slot** (Wilson 95% [6%, 27%]);
phiên FN **4/16**; re-gate bắt được **3/4**; re-gate FP (ground truth đầy đủ)
**0/9** phiên không FN (Wilson [0%, 30%] — không đổi); FP kiểm duyệt (phiên chết ở
re-gate, chỉ slot 1) **3/3**.
**Gộp với dữ liệu cũ (V4 P1/P2 + X2 S4: 9 slot, FN 3/9):** FN **8/47 slot (17%)**,
Wilson 95% **[9%, 30%]** (trước D5: 7/44, 16%, [8%, 29%] — tỉ lệ điểm tăng
nhẹ, khoảng tin cậy hẹp lại chút ít).

**Đọc đúng bảng:**
- **Cả 3 phiên chuẩn D5 đều chết ở re-gate** (1 TP + 2 FP). Đây là đợt đầu
  tiên không có phiên chuẩn nào chạy trọn vẹn tới probe/đối chứng — mọi
  resume-probe + đối chứng của phiên chuẩn đều bị bỏ qua. Chỉ diag3 (lọt
  re-gate) mới có probe/đối chứng.
- **S2 là FP "sạch" nhất từ trước tới nay:** slot 1 khỏe rõ ràng (15,04 fps,
  presented 29,88, gapP50 50 ms, mediaRate 1x), re-gate chạy lúc tải THẤP
  (2,80), delta 27 chỉ thiếu 3 draws so với ngưỡng. Không thể đổ cho sóng
  tải như C4-S3 (delta 4, tải 9,22). Ngưỡng 30 đã giết một phiên khỏe
  trong điều kiện gần như lý tưởng.
- **S3 là FP dưới sóng tải** (delta 18, tải 7,28 lúc re-gate; 12 tiến trình
  chrome của luồng khác đang chạy lúc bắt đầu) — cùng mẫu với C4-S3, nhưng
  delta 18 cao hơn hẳn delta 4: sóng tải không cần đè delta xuống gần 0
  mới gây FP; chỉ cần đè từ ~30 xuống dưới 30 là đủ.
- **S1 (FN) và S3 (FP) có cùng delta re-gate 17–18:** FN delta 17 (S1) vs
  khỏe delta 18 (S3) — cách nhau 1 draw. Không ngưỡng nào phân biệt được
  hai phiên này. Đây là bằng chứng mạnh nhất rằng vấn đề là cấu trúc cửa
  sổ đo, không phải vị trí ngưỡng.
- **Gate 1a chết 3/6 lần thử** (delta 4, 2, 15) — tỉ lệ chết 50%, tệ nhất kể
  từ B8 (4/5 lần đầu chết). Cả 3 lần chết đều có cùng chữ ký: el rs=1,
  paused=true, ct 3,0–7,5 trong khi playhead ~7,5 (element đóng băng sớm,
  playhead chạy trước). Lần 2 chết khi tải chỉ 0,68 — tải không phải
  nguyên nhân duy nhất.
- **Phiên lạnh thật S2 khỏe, nhưng phiên lạnh thật S1-lần-1 chết ở gate:**
  cùng là "Chrome đầu tiên sau reboot", một phiên chết ở gate (delta 4),
  một phiên khỏe (slot 15,04). Lạnh không quyết định FN — ngẫu nhiên theo
  lần chạy mới là yếu tố chính.

## 3. Hiệu chuẩn ngưỡng re-gate: 30 GIỮ NGUYÊN — và vì sao lần này suýt đổi

Dữ liệu hiệu chuẩn (delta re-gate, tất cả phiên chuẩn có JSON; kèm tải 1-min
lúc re-gate):

| Nhóm | n | Delta (tải lúc re-gate) |
|---|---|---|
| Phiên FN | 4 | **17 (D5-S1, tải 9,89)**, 18 (Y3-S1, 6,79), 21 (A6-S1, 0,85), 75 (B8-S1, 5,85) |
| Phiên không FN | 12 | **4 (C4-S3, 9,22)**, **18 (D5-S3, 7,28)**, **27 (D5-S2, 2,80)**, 41 (A6-S2, 11,53), 44 (C4-S2, 1,90), 52 (C4-S1, 3,10), 82, 137, 149, 228, 244, 273 |

Bảng hiệu năng ngưỡng trên dữ liệu đã quan sát (TP = bắt FN, FP = giết khỏe):

| Ngưỡng T | Bắt FN | Giết khỏe | Ghi chú |
|---|---|---|---|
| 30 (hiện tại) | **3/4** (17, 18, 21) | **3/12** (4, 18, 27) | |
| 25 | **3/4** (17, 18, 21) | **2/12** (4, 18) | Nhỉnh hơn 30 đúng 1 phiên (D5-S2) |
| 22 | 3/4 | 2/12 | Như 25 |
| 19 | 2/4 (17, 18) | 2/12 | Mất FN 21 |
| 18 | 1/4 (17) | 1/12 (4) | Mất FN 18, 21 |
| 45 | 3/4 | 5/12 (+41, 44) | Tệ hơn rõ |

- **Mọi ngưỡng trong (21, 27] đều Pareto-nhỉnh hơn 30 trên dữ liệu đã quan
  sát** (cùng bắt FN 3/4, bớt 1 FP). Đây là lần đầu tiên một ngưỡng khác
  nhỉnh hơn 30 một cách đo được — nên verdict lần này phải trả lời thẳng
  vì sao KHÔNG đổi.
- **Lý do giữ 30 — ba điểm, đều bằng số:**
  (a) Mức hơn là đúng **1 phiên trên tổng 16 phiên** (D5-S2, delta 27);
  n(FN) chỉ 4 nên một điểm dữ liệu không chứng minh được ngưỡng mới tốt
  hơn nói chung — khoảng tin cậy Wilson của tỉ lệ FP 3/12 [7%, 53%] và
  2/12 [5%, 45%] chồng lấn gần như hoàn toàn.
  (b) Đổi sang 25 vẫn còn **2/3 FP** (delta 4 và 18) — vấn đề FP không được
  sửa, chỉ giảm 1/3. Ngưỡng không sửa được vấn đề mà D5 chứng minh là
  cấu trúc: FN 17 vs khỏe 18 cách nhau 1 draw.
  (c) Tiền lệ B8/C4: cả hai đợt đều giữ 30 trên cùng nguyên tắc "không
  xoay ngưỡng theo nhiễu n nhỏ"; đổi ngưỡng mỗi đợt sẽ biến ngưỡng thành
  biến số đuổi theo dữ liệu, mất tính so sánh giữa các đợt.
- **Kiểm toán giết phiên của re-gate (từ trước tới nay):** 5 lần re-gate giết
  phiên chuẩn — A6-S1 TP (FN 21), C4-S3 FP (khỏe 4), D5-S1 TP (FN 17),
  D5-S2 FP (khỏe 27), D5-S3 FP (khỏe 18). **3/5 (60%) lần giết là giết
  oan.** Cửa thứ hai nay giết khỏe nhiều hơn giết FN. Đây mới là con số
  đáng báo động của đợt này — và nó không sửa được bằng ngưỡng.
- **KHÔNG sửa production.** Mặc định launcher vẫn 30 (không đổi). Không đổi
  ngưỡng, không đổi gate, không đổi harness.
- **Điều kiện để đợt sau ĐỔI ngưỡng (ghi rõ để tránh tranh cãi):** đổi khi có
  ≥ 2 FP sạch mới (tải lúc re-gate < 3, slot khỏe rõ) nằm trong (21, 30]
  mà không có thêm FN nào trong khoảng đó — tức bằng chứng lặp lại, không
  phải 1 điểm; HOẶC có FN lọt mới (delta > 30) kèm khỏe min mới < ngưỡng
  đề xuất. Nếu chỉ có thêm 1 FP nữa trong (21, 30] thì vẫn giữ 30.
- **Hướng sửa đúng (nợ thiết kế, ngoài phạm vi luồng này):** re-gate đo cửa
  sổ 6 s ngay sau slot 1 nên đo đúng pha slow-start/noise — cần thiết kế
  khác (vd re-gate đo 2 cửa sổ, hoặc re-gate ở chế độ quan sát + chỉ giết
  phiên khi cả gate1a lẫn slot đều xấu, hoặc warmup dài hơn trước slot 1).
  B8 §6 và C4 §3 đã nêu; D5 bổ sung bằng chứng rằng ngưỡng không phải
  đáp án.

## 4. Slow-start / cold start của preview — đo thật bằng diag 60 s (3 lần D5)

Ba lần diag D5 (lấy mẫu mỗi 2 s sau seek-0, cửa sổ 60 s; timeline chỉ 24 s
nên mẫu sau +24 s là phẳng — như C4 §7):

| Lần diag | Tải trong cửa sổ | rs theo thời gian | Thời gian tới rs≥2 duy trì | Draw-rate |
|---|---|---|---|---|
| diag1 | 0,93–1,69 (thấp) | rs=4 ngay từ +2 s, giữ tới +18 s; rs=2 từ +20 s (sau khi hết timeline) | **+2 s** | ~3–5 fps trong cửa sổ (draw 10→58); phẳng sau +18 s |
| diag2 | 18,70–20,47 (rất cao) | rs=4 ngay từ +2 s, giữ tới +16 s; rs=2 từ +18 s | **+2 s** | ~3 fps trong cửa sổ (draw 8→54) |
| diag3 | 3,98–7,08 (vừa) | rs=4 ngay từ +2 s, giữ suốt tới +60 s (blip rs=2 duy nhất ở +22 s, sau khi hết timeline) | **+2 s** | ~4,4 fps trong cửa sổ (draw 12→88); khỏe nhất trong 3 lần |
| C4 diag2 (đợt 75) | 1,0–1,7 | rs=4 từ +2 s | +2 s | 4–6,5 fps |
| C4 diag3 (đợt 75) | 1,3–3,1 | rs tụt 4→1 giữa chừng, ct đóng băng | +18 s | ~0–1,5 fps |
| C4 diag1 (đợt 75) | 5,7–7,9 | rs=1 tới +18 s | +20 s | ~1 fps tới +18 s |
| B8 diag (đợt 74) | 1,3–3,1 | rs=1 tới +10 s, rs=4 từ +15 s | ~+15 s | ~1 fps tới +10 s |

**Kết luận đo được:**
1. **Phân phối gộp nay: +2 s × 4 lần, +15, +18, +20 s (7 lần diag).**
   +2 s nay là mode (4/7), nhưng đuôi chậm (+15..+20 s) vẫn tồn tại — slow-start
   vẫn là phân phối, không phải hằng số. D5 không thu hẹp được đuôi chậm,
   chỉ cho thấy đầu nhanh (+2 s) phổ biến hơn tưởng.
2. **Tải cao KHÔNG làm chậm rs trong cửa sổ gate:** diag2 chạy dưới tải
   19–20 mà rs vẫn =4 từ +2 s — bằng chứng mạnh nhất từ trước tới nay rằng
   rs trong cửa sổ gate không gắn với tải. (Trái lại, tải cao đè draw-rate
   và slot fps — xem mục 3.)
3. **Slot 1 FN ở CẢ 3 diag D5 (0,2 / 1,2 / 1,0 fps) dù cửa sổ gate khỏe:**
   diag3 là bằng chứng sạch nhất — gate khỏe nhất (rs=4 suốt, draw 88,
   delta 86), tải thấp (2,09–2,69), vậy mà slot 1 ngay sau đó vẫn FN 1,0
   fps rồi slot 2–3 hồi phục 20,45 / 17,51 fps. **Mỗi lần seek-0 là một lần
   khởi động lại, và cửa sổ gate không dự đoán được slot 1** — củng cố C4
   §4.4 bằng lần lặp thứ ba, lần này ở tải thấp và gate khỏe nhất.
4. **Re-gate bắt/lọt diag:** diag1 FN bị bắt (delta 15), diag2 FN bị bắt
   (delta 18), diag3 FN LỌT (delta 87). Gộp với C4-diag2 (lọt, delta 36)
   và C4-diag3 (bắt, delta 14): diag FN bắt 3/5, lọt 2/5 — đúng mẫu B8:
   stall kéo dài → bắt; slow-start tự lành → lọt. (Diag không gộp thống
   kê chuẩn; chỉ là quan sát cơ chế.)
5. **Draw-rate trong cửa sổ gate luôn thấp hơn nhiều so với slot khỏe:**
   diag3 rs=4 suốt mà draw chỉ ~4,4 fps trong cửa sổ (slot khỏe cùng phiên
   đạt 17–20 fps). Củng cố C4 §4.5: ngưỡng re-gate thực chất đang hiệu
   chuẩn trên "độ chậm khởi động", không phải "độ khỏe ổn định" — đó là
   lý do FN 17 và khỏe 18 chỉ cách nhau 1 draw.

## 5. Cold start editor — breakdown đo thật (9 lần chạy D5)

Trích timestamp ISO từ `presented-fps.log` (vite spawn → vite lên → app mount
→ modal đóng → project mẫu → GATE xong). Median trên 9 lần chạy D5:

| Mốc | S1-l1 | S1-l2 | S1-l3 | S1-l4 | S2 | S3 | diag1 | diag2 | diag3 | Median |
|---|---|---|---|---|---|---|---|---|---|---|
| vite spawn → vite lên | 3,80 s | 5,32 s | 4,19 s | 2,32 s | 1,15 s | 1,18 s | 4,01 s | 2,99 s | 1,16 s | **2,99 s** |
| vite lên → app mount | 56,61 s | 51,60 s | 38,91 s | 29,70 s | 16,19 s | 15,93 s | 30,28 s | 31,32 s | 15,81 s | **30,28 s** |
| app mount → modal đóng | 4,20 s | 5,68 s | 3,69 s | 2,71 s | 1,81 s | 1,89 s | 3,31 s | 2,91 s | 1,99 s | 2,91 s |
| modal đóng → project mẫu sẵn | 0,08 s | 0,10 s | 0,13 s | 0,07 s | 0,00 s | 0,00 s | 0,07 s | 0,09 s | 0,01 s | 0,07 s |
| **TỔNG vite spawn → app mount** | **60,41 s** | **56,92 s** | **43,10 s** | **32,01 s** | **17,34 s** | **17,11 s** | **34,30 s** | **34,31 s** | **16,98 s** | **34,30 s** |

**Chẻ đôi theo reboot 18:14 UTC (VM reboot giữa S1-l4 và S2):**
- Trước reboot (6 lần: S1-l1..l4, diag1, diag2): tổng tới mount 32,01–60,41 s,
  median **38,7 s**; mảnh mount 29,70–56,61 s, median **35,1 s**.
- Sau reboot (3 lần: S2, S3, diag3): tổng tới mount 16,98–17,34 s, median
  **17,1 s**; mảnh mount 15,81–16,19 s, median **15,9 s** — gần như bằng
  median C4 (19,3 s tổng / 17,6 s mount).
- **Đọc đúng:** reboot không làm chậm cold start — ngược lại, các lần chạy
  SAU reboot nhanh gấp đôi. Chậm trước reboot tương quan với (a) các luồng
  đợt 76 khác sửa code trực tiếp trong ngày (preview.tsx, enhancePreview.ts,
  store.ts, Timeline.tsx, i18n — xem §7), khiến vite dev biên dịch lại
  bundle lớn hơn / khác nhau giữa các lần chạy; (b) sóng tải 0,25 → 17,70
  trong buổi. Không có bằng chứng cold cache gây chậm — S2 lạnh thật sau
  reboot vẫn mount nhanh nhất (16,19 s).
- **Mảnh tốn nhất vẫn là "vite lên → app mount"** (median 30,28 s, ~88% tổng
  tới mount) — như C4. Vite lên nhanh (median 2,99 s; sau reboot chỉ
  ~1,15 s). Modal đóng ~2–3 s, project mẫu ~0 s — không phải bottleneck.
- **Số này là của vite DEV (chưa build production) trên VM 2 vCPU/8 GB,
  lần tải đầu sau mỗi lần spawn vite mới (profile Chrome mới).** Bản
  production build sẵn + máy thật sẽ nhanh hơn — nhưng thứ tự bottleneck
  (mount/bundle ≫ vite lên ≫ modal/project) vẫn có giá trị chỉ hướng tối
  ưu: muốn preview sẵn sàng nhanh hơn thì phải rút ngắn thời gian tới app
  mount, không phải thời gian khởi động vite.

## 6. Resume-probe — stall đói-decoder tái hiện lần 4 (diag3)

Chỉ diag3 chạy trọn vẹn tới probe (cả 3 phiên chuẩn đều chết ở re-gate nên
không có probe chuẩn trong đợt này).

| Probe (diag3) | Draw fps | Presented fps | rs chủ đạo | Seeking | shortPause |
|---|---|---|---|---|---|
| A (pause dài) | 7,46 | 25,04 | 4 (50/50) | 0/50 | — |
| B (pause ngắn ~1 s) | **2,13** | **42,24** | **1 (39/50)** | **39/50** | seeking=false, rs=4, pendingSeek=false, sleeping=true, lastDrawn=6,63 |

- **Probe B stall tái hiện lần 4** (sau Z3-S1, C4-S1, C4-S2): draw 2,13 fps,
  hold 7,61 fps, rs=1 39/50, seeking 39/50, ct 6,63 → 18,63, syncReseeksVideo
  22 → 35 (+13 lần reseek trong cửa sổ) — đúng chữ ký stall đói-decoder.
  Presented 42,24 fps (> 30 — qTotal tăng nhanh, có thể do element bắt kịp
  sau stall) càng cho thấy element phát thật trong khi draw đóng băng.
- **Điểm khác với 2 lần C4: shortPause lần này ĐÃ settle** (seeking=false,
  rs=4, sleeping=true, lastDrawn có giá trị) mà resume vẫn stall. Giả thuyết
  C4 ("resume cắt ngang pause-seek chưa settle") không giải thích được lần
  này — hoặc có trigger thứ hai (seek element bị recreate? syncReseeksVideo
  +13 gợi ý pool element đổi trong cửa sổ), hoặc stall là ngẫu nhiên theo
  lần chạy như slow-start. Chưa phân biệt được; cần thêm dữ liệu probe B.
- Probe A (pause dài) chậm vừa (7,46 fps, ticks 8,19/s, paused 10/50) —
  không stall hẳn nhưng cũng không khỏe (so với probe A khỏe 16–17 fps ở
  C4-diag2). Cả phiên diag3 có vẻ "nửa chậm" sau slot 1 FN.
- Đối chứng tab trắng diag3: presented 30,8 fps, mediaRate 0,997x — element
  phát tốt khi visible, như mọi lần trước.

## 7. Sự cố trong đợt (ghi trung thực)

1. **VM reboot 2 lần trong đợt (16:03 và 18:14 UTC):** reboot 16:03 xóa /tmp
   (config vite, variant dry-run/diag, bản copy analyzer, script gen config
   + parser của D5 lần 1 — phải tái tạo toàn bộ, md5 config + dry-run vẫn
   khớp sau mỗi lần tạo lại); reboot 18:14 xóa /tmp lần nữa, đúng giữa S2
   và S3 (launcher S2 tự ghi lại config vite bằng writeConfigBestEffort,
   md5 vẫn khớp ca5b3c48… — không dính EPERM lần này). Reboot 18:14 vô tình
   tạo ra phiên lạnh thật S2 (Chrome đầu tiên sau reboot) — và nó khỏe.
2. **3 lần chết ở gate 1a liên tiếp đầu đợt (delta 4, 2, 15):** xem §2. Lần 1
   là phiên lạnh thật (Chrome đầu tiên sau reboot 16:03). Lần 2 chết khi
   tải chỉ 0,68. Lần 3 chết đúng lúc sóng tải vọt lên 17,70.
3. **Luồng đợt 76 khác sửa code trực tiếp trong cửa sổ đo** (như B8/C4 đã
   gặp): preview.tsx, enhancePreview.ts, store.ts, Timeline.tsx, i18n
   vi/en.json sửa sau 16:00 UTC (trong lúc D5 đo); server/render + bridge
   cũng sửa cùng buổi. Vì vite dev phục vụ module theo yêu cầu, các phiên
   chạy sau mỗi lần sửa có thể đã đo trên code khác nhau — số cold-start
   mang nhiễu này (chẻ đôi trước/sau reboot ở §5 có thể một phần do code
   đổi, không chỉ do reboot); verdict về re-gate (harness không đổi) thì
   không bị ảnh hưởng.
4. **Sóng tải từ 8–10 luồng song song:** tải 1-min dao động 0,25 → 20,47
   trong đợt; S1 re-gate trúng sóng 9,89 (FN bắt đúng), S3 re-gate trúng
   sóng 7,28 (FP), diag2 chạy dưới tải 19–20 suốt cửa sổ gate. Mỗi phiên
   đều ghi tải từng mốc trong JSON/log nên có thể đối chiếu.
5. **Diag v2 ghi log kiểm tra gate gây hiểu lầm:** dòng "DIAG-GATE: kiểm tra
   gate KHÔNG đạt (delta 52/86)" xuất hiện ở diag2/diag3 dù delta ≥ 20 —
   vì điều kiện kiểm tra còn gồm `el.ct <= 0` (element vừa seek-0 nên ct=0
   lúc kiểm tra). Chỉ là câu log gây hiểu lầm, không ảnh hưởng đo (v2 cố
   tình chỉ ghi log thay vì throw); diag1 C4 gặp đúng vấn đề này ở dạng
   throw. Đợt sau nên sửa điều kiện kiểm tra diag thành chỉ xét delta
   (ngoài phạm vi D5 — không sửa variant giữa chừng).
6. **Diag1/diag2 gate1a.rateFps SAI như B8 đã ghi:** delta 56/52 chia cho 6
   trong khi cửa sổ là 60 s (đúng là 0,93 / 0,87 fps). Chỉ là số ghi trong
   JSON diag, không dùng để kết luận; diag không gộp thống kê.
7. **Sau khi hết timeline (playhead 24), element có hành vi lạ (diag1):**
   qTotal tiếp tục tăng 234 → 600 trong khi draw đứng yên ở 58 và dropped
   vọt lên 323 — như C4-diag2 đã ghi. Diag3 qTotal đứng yên ở 600 sau khi
   hết timeline. Khác nhau chưa rõ nguyên nhân; không ảnh hưởng kết luận
   chính (cửa sổ đo slow-start là +0–24 s).

## 8. Thiết kế thử nghiệm D5 (để đợt sau tái hiện hoặc bác bỏ)

- Tái sử dụng launcher Z3 NGUYÊN (`apps/web/scripts/measure-72z3-gate-fn2-launcher.mjs`,
  ngưỡng mặc định 30, re-gate BẬT) + analyzer Z3 NGUYÊN
  (`apps/web/scripts/analyze-72z3-gate-fn2.mjs`): KHÔNG sửa file nào trong
  repo ngoài doc LIMITS này. Config vite pre-create bằng script trích đúng
  template harness gốc (`/tmp/round76-d5/gen-vite-config.mjs`, eval template
  literal — 1.726 byte, **md5 ca5b3c48afd54171d995e74cbadf7215, KHỚP A6/B8/C4**);
  launcher ghi log "config vite đã có sẵn đúng nội dung, bỏ qua ghi" ở mọi
  lần chạy (trừ S2 sau reboot: launcher tự ghi lại config, md5 vẫn khớp).
  Lưu ý làm rõ ở D5: template đã có newline cuối sẵn nên KHÔNG cộng thêm
  newline (cộng thêm ra 1727 byte, md5 sai).
- Dry-run launcher trước đo: 27 thay thế OK, variant 53.246 byte (khớp Z3/A6/B8/C4).
- Analyzer: chạy bản copy trong /tmp có thêm thư mục A6/B8/C4/D5
  (`/tmp/round76-d5/analyze-76d5.mjs`, chỉ đổi hằng DIR + nhãn + đọc
  notes `a6/b8/c4/d5-notes.txt`, logic giữ nguyên; probe in thêm cho D5).
  Chạy baseline trước khi có phiên D5 đã tái hiện đúng số C4 (FN 4/35, FP 0/9,
  bắt 2/3, FP kiểm duyệt 1/1) rồi chạy lại sau khi có phiên D5 cho số gộp mới.
- Mỗi phiên chờ load 1-min < 3,0 trước khi chạy (luật Y3, tối đa 10 phút)
  — ngoại lệ: S1-lần-1 chạy ngay để giữ trạng thái lạnh (phiên Chrome đầu
  tiên sau reboot 16:03); S1-lần-3 chạy ngay khi load 0,25 (đã đủ thấp);
  S2 chạy ngay sau reboot 18:14 để giữ trạng thái lạnh. Các lần chờ: ~4 phút
  trước S1-lần-2 (15,74 → 2,47); ~5 phút trước S1-lần-4 (15,54 → 2,42);
  ~10 phút trước S2 (14,58 → 2,71).
- **Variant diag v2** (`/tmp/round76-d5/variant-diag.mjs`, 53.601 byte, từ variant
  Z3 dry-run): chỉ đổi `sleep(6000)` ở khối gate thành vòng lấy mẫu 2 s × 30
  (= 60 s), ghi `DIAG-GATE +Xs` (rs/ct/qTotal/draw/playhead/load); kiểm tra
  gate KHÔNG đạt thì ghi log thay vì throw (vì cửa sổ 60 s vượt timeline
  24 s). Mọi bước khác (slot, re-gate, probe, đối chứng) giữ nguyên. Diag
  KHÔNG phải phiên chuẩn — không gộp thống kê. (Lần 1 của variant này mất
  do reboot 18:14; đã tái tạo từ cùng build script, cùng 53.601 byte.)
- **Parser cold-start** (`/tmp/round76-d5/parse-coldstart.mjs`): trích
  timestamp ISO từ `presented-fps.log` (vite lên / app mount / modal đóng /
  project mẫu / GATE xong) + chuỗi DIAG-GATE (thời gian tới rs≥2 lần đầu
  và duy trì, tới draw-rate ≥ 10/20 fps) — chạy lại được trên mọi phiên
  trong `hidden_files/round76-d5/`.
- FN = gate1a PASS + slot draw < 2 fps (tiêu chí Y3/Z3, analyzer tự tính).
  Phiên chết ở gate không có JSON → không gộp (3 lần trong đợt này). Phiên
  chết ở re-gate chỉ còn slot 1 làm ground truth (kiểm duyệt, không gộp mù);
  FP kiểm duyệt tách riêng khỏi FP ground-truth đầy đủ.

## 9. Giới hạn (trung thực)

- **n vẫn nhỏ:** chỉ **3 phiên chuẩn** trong đợt này (1 FN + 2 khỏe, cả 3 đều
  chết ở re-gate) + 3 phiên diag (không chuẩn) + 3 lần chết ở gate (không số
  đo). Bắt FN nay 3/4 phiên chuẩn; FP đầy đủ 0/9, Wilson [0%, 30%] — không
  đổi; FP kiểm duyệt 3/3 là dữ liệu mới nhưng mỗi FP chỉ dựa trên 1 slot
  duy nhất (slot 2–3 bị bỏ qua vì phiên chết).
- **Ngưỡng 30 nay đứng trên dữ liệu chồng lấn cả hai phía, và FP đã thành
  đa số trong các lần giết phiên (3/5):** 30 chỉ còn là "điểm cân bằng tốt
  nhất" chứ không phải "điểm giữa gap". Mọi kết luận về ngưỡng đều tạm thời
  cho đến khi có thêm phiên — đặc biệt cần thêm phiên FN kiểu stall kéo dài
  (để xem 30 còn bắt được không) và phiên khỏe delta trong (21, 30] (để xem
  biên khỏe có sụt nữa không — D5-S2 delta 27 đã là điểm khỏe thứ hai trong
  vùng này sau A6-S2 delta 41).
- **Không có phiên chuẩn nào chạy trọn vẹn** nên không có thêm dữ liệu
  resume-probe / đối chứng chuẩn trong đợt này; probe B stall lần 4 chỉ có
  từ diag3 (không chuẩn).
- **Slow-start chưa có nguyên nhân gốc:** đo được phân phối +2 s (×4) →
  +20 s và 2 cơ chế khác nhau (rs=1 từ đầu; rs tụt 4→1 giữa chừng + ct đóng
  băng — C4-diag3), nhưng chưa biết tại sao cùng một clip/cùng một máy lần
  thì +2 s lần thì +20 s. Nghi vấn còn mở: trạng thái decoder/cache của
  Chrome, code preview bị sửa giữa chừng, sóng tải — chưa phân biệt được.
  D5 bổ sung: tải cao (19–20) không làm chậm rs trong cửa sổ gate, và gate
  khỏe không dự đoán được slot 1 — hai manh mối mới cho đợt sau.
- **Cold-start breakdown chưa tách được mảnh "vite lên → app mount":**
  30,28 s median gồm Chrome khởi động + tải trang + biên dịch bundle +
  mount + tải project mẫu, nhưng harness không ghi mốc tải trang riêng
  nên chưa biết trong 30,28 s đó phần nào tốn nhất. Cần ghi performance
  timing ở đợt sau nếu muốn tối ưu mảnh này. Chẻ đôi trước/sau reboot
  (38,7 s vs 17,1 s) chưa phân biệt được reboot vs code đổi vs tải.
- **Nhiễu từ luồng đợt 76 khác:** code preview/media bị sửa trong cửa sổ
  đo (xem §7 mục 3); sóng tải 0,25 → 20,47; Chrome của luồng khác chạy
  song song (12–13 tiến trình lúc S1-lần-4/S3). Số slow-start/cold-start
  mang nhiễu này; số re-gate/FN/FP (harness không đổi) thì không.
- **Chỉ đo trên VM này** (2 vCPU/8 GB, không GPU, Chrome headed + Xvfb,
  clip long1080 20 s, canvas 871×275) trong buổi có sóng load từ 8–10
  luồng song song + 2 lần reboot + các luồng khác sửa code trực tiếp. Số
  trên máy thật/khác clip sẽ khác — nhưng verdict về điểm mù re-gate, về
  tính ngẫu nhiên của slow-start, và về tỉ lệ FP của cửa thứ hai là về
  THIẾT KẾ / HÀNH VI, không phải về con số tuyệt đối.
- **Không sửa gì trong production:** harness gốc không đổi; launcher +
  analyzer Z3 không đổi; gate 6 s không đổi; ngưỡng mặc định vẫn 30; không
  push (chỉ stage); không release/tag. Không thêm key i18n (dict không đụng
  code nên không cần cập nhật vi/en.json hay test khóa số key). Không chạy
  tsc (không đụng code). File `.cjs` config vite, variant dry-run/diag,
  script gen config + parser + bản copy analyzer trong /tmp (mất khi reboot
  — không stage, không phải deliverable; bản sao lưu trong
  `hidden_files/round76-d5/tools/` để chống mất khi reboot); ảnh
  `r8-presented-done.png` (binary) không stage.

## 10. File và log

- Doc này: `docs/PHASE9_ROUND76_D5_GATE_FN_LIMITS.md`.
- Launcher (tái sử dụng, không sửa): `apps/web/scripts/measure-72z3-gate-fn2-launcher.mjs`
  — dry-run 27 thay thế OK, variant 53.246 byte; chạy 6 lần chuẩn (3 lần
  chết ở gate + 3 phiên có JSON, cả 3 chết ở re-gate).
- Variant diag v2 (mới, trong /tmp, không stage):
  `/tmp/round76-d5/variant-diag.mjs` (53.601 byte) — chạy 3 lần (diag1 exit 1
  chết ở re-gate; diag2 exit 1 chết ở re-gate; diag3 exit 0 hoàn chỉnh).
- Script phân tích (tái sử dụng, không sửa): `apps/web/scripts/analyze-72z3-gate-fn2.mjs`
  — bản copy có thêm A6/B8/C4/D5 trong `/tmp/round76-d5/analyze-76d5.mjs`
  (không stage); baseline tái hiện đúng số C4; pooled mới trong
  `/tmp/round76-d5/analyze-pooled.txt` (tmpfs, mất khi reboot); bản sao
  script trong `hidden_files/round76-d5/tools/`.
- Parser cold-start (mới, trong /tmp, không stage):
  `/tmp/round76-d5/parse-coldstart.mjs` — trích breakdown từ log + chuỗi
  DIAG-GATE (bản sao trong `hidden_files/round76-d5/tools/`).
- Log luồng: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round76-d5.md`.
- Log đo: `hidden_files/round76-d5/session1/` (chết ở gate: log, không JSON),
  `session1-attempt2/` (chết ở gate), `session1-attempt3/` (chết ở gate),
  `session1-attempt4/` (phiên chuẩn S1: `presented-fps.json` 2.552 byte +
  đủ log/png/notes — FN, re-gate bắt đúng),
  `session2/` (phiên chuẩn S2 lạnh thật: JSON 2.537 byte — khỏe, FP re-gate),
  `session3/` (phiên chuẩn S3: JSON 2.537 byte — khỏe, FP re-gate),
  `diag1/` (JSON 2.545 byte, FN quan sát, re-gate bắt đúng),
  `diag2/` (JSON 2.558 byte, FN quan sát, re-gate bắt đúng),
  `diag3/` (hoàn chỉnh: `presented-fps.json` 148.828 byte + đủ log/png/notes —
  FN quan sát, re-gate LỌT, probe B stall).
  Kết quả phân tích gộp: `/tmp/round76-d5/analyze-pooled.txt` (tmpfs, mất
  khi reboot); baseline C4: `/tmp/round76-d5/analyze-baseline.txt`.
- Không stage: config vite `.cjs` trong /tmp (file sinh ra), ảnh
  `r8-presented-done.png` (binary), log luồng + log đo (goal workspace, không
  phải repo), script gen config + variant diag + parser + bản copy analyzer
  trong /tmp (bản sao lưu trong `hidden_files/round76-d5/tools/` cũng không
  stage — ngoài repo).
