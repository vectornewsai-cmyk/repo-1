# DEF v0.5 — Định nghĩa kiểm chứng lượt yên WebKit (c2)/ghost-freeze

**Ngày:** 18/11/2026. **Đợt:** 138, luồng T3. **Trạng thái:** ĐỊNH NGHĨA
CHUẨN v0.5 — parent đã **CHẤP NHẬN** theo quyết đợt 137 §12.3(b)
(hiệu chỉnh P5 snap-label 34–52 ms + bổ sung P3' stall-based).
**Có hiệu lực từ lượt yên #15 (đợt 138) trở đi, làm prereg cho mọi
lượt yên sau đó. KHÔNG áp dụng hồi tố** cho verdict điều tra (c2)
đã đóng ở đợt 137 hay cho bất kỳ lượt nào trước #15.
**File này THAY THẾ prereg đợt 132 làm chuẩn hiện hành cho việc
kiểm chứng lượt yên.** Prereg đợt 132
(`hidden_files/round132-t3/prereg-t3.md`, đăng ký 17:45Z 17/11/2026
+ bổ sung A1 17:50Z) được **giữ nguyên vẹn làm lịch sử** — không sửa,
không xóa.

**Lưu ý tên file (ghi rõ để khỏi nhầm):** dòng DEF này chưa từng có
file DEF riêng — "v0.4" của nó chính là prereg đợt 132 nêu trên.
File này được đặt tên `docs/DEF_v0.5.md` theo brief T3 đợt 138.
Nó **không liên quan** tới dòng DEF trục tải PSI
(`docs/PHASE9_ROUND128_T1_PSIAXIS_DEF_V04.md` — v0.4 của trục PSI,
có lịch sử phiên bản riêng; v0.5 của dòng đó, nếu viết sau này,
nói về dải PSI, không phải về (c2)).

**Phạm vi:** chỉ dùng cho việc kiểm chứng các lượt yên WebKit
(đo tickCost / ghost / (c2) trên cây `preview.tsx` md5 `530e10a7`,
fix logger nới làm instrumentation vĩnh viễn — xem §12) trong cell
này. Không dùng cho bar F2, không dùng cho PSI/load, không dùng
cho bất kỳ verdict nào ngoài giám sát thụ động (c2) từ lượt #15
(xem §13–§14).

**Cơ sở dữ liệu của v0.5:** prereg đợt 132 (8 lượt yên hợp lệ #1–#8
làm hiệu chuẩn) + 4 lượt yên hợp lệ sau đó (#9, #10, #12, #13) +
lượt quyết định #14 (đợt 137) = **12 lượt yên hợp lệ** (#11 không
có lượt hợp lệ — attempt đợt 134 bị abort, JSON partial, không có
ghostPix post-flip). Tổng (c2) qua các lượt có event: **19 occurrence**
(#10: 5, #12: 7, #13: 1, #14: 6), 0 lag âm, 0 skp=1, 0 lag ≥+5f.

## 0. Thay đổi so với v0.4 (prereg đợt 132 — đọc trước)

| Mục | Trạng thái v0.5 | Thay đổi |
|---|---|---|
| P1 (run-end) | GIỮ NGUYÊN | Không đổi (xem §3). Cộng dồn tới #14: 28/28 |
| P2 (dấu lag) | GIỮ NGUYÊN | Không đổi (xem §4). Cộng dồn: 19/19 occurrence lag ≥ +1f, 0 lag âm |
| P3 A1 (đóng băng-tại-tick) | GIỮ NGUYÊN | Không đổi (xem §5). Cộng dồn tới #14: 24/28; SAI ở lượt quyết định #14 (3/6, p=0,125) — verdict này ĐỨNG, không sửa lại |
| **P3' (stall-based)** | **MỚI** | **BỔ SUNG** làm phép thử prereg từ lượt #15 (xem §6). Gốc là phân tích khám phá post-hoc ở #14 (5/5 seq riêng biệt ở cuối chuỗi đóng băng nhãn ≥2 tick, p≈0,0005) — nay thành prereg, KHÔNG hồi tố |
| P4 (số lượng) | GIỮ NGUYÊN + ghi chú | Không đổi khoảng (xem §7); thêm ghi chú: lag +2f đơn lẻ không vi phạm; xem lại P4 nếu +2f ≥3 occurrence trong một lượt |
| **P5 snap-label median** | **ĐỔI** | **34–48 ms → 34–52 ms** (xem §8). Các tiêu chí P5 còn lại GIỮ NGUYÊN |
| P5 raw / label-floor / run | GIỮ NGUYÊN | raw 8–10 ms; label-floor +1 63–76%; run ≥3 tick 13–22 (xem §8) |
| P6 (histogram) | GIỮ NGUYÊN | Không verdict, như cũ (xem §9) |
| P7 (log draw) | GIỮ NGUYÊN | Không đổi (xem §10). Cộng dồn đã chốt theo quy ước từng seq: 14/14 |
| tickCost ≤60 ms | GIỮ NGUYÊN | Không đổi trong DEF này; việc bàn lại thuộc quyết riêng theo quyết parent đợt 137 §12.3(c) (xem §11) |
| Fix 530e10a7 | **ĐỔI trạng thái** | Từ "instrumentation tạm, giữ tới khi verdict" thành **instrumentation VĨNH VIỄN — KHÔNG GỠ** (xem §12) |
| Điều tra (c2) | **ĐÓNG** | Kết luận "ghost-freeze ĐƯỢC ỦNG HỘ MẠNH" (quyết parent đợt 137 §12.3(a)); từ #15 chỉ giám sát thụ động (xem §13–§14) |

## 1. Lượt yên hợp lệ + cửa sổ đo (giữ nguyên v0.4)

- **Lượt yên HỢP LỆ** khi đồng thời: attempt 20/20 pass + lớp B 5/5
  ĐẠT + **median tickCost ≤ 60 ms**. Attempt dở dang / partial chỉ
  báo histogram riêng, KHÔNG tính vào verdict P1–P7.
- **Cửa sổ đo (post):** các tick `blendTick` với `viaRvfc = 0` và
  `tBlend >= flip.wallMs + 2000`, sắp xếp theo `tBlend` tăng dần.
  Mọi định nghĩa dưới đây tính trên dãy tick post này, theo đúng
  script bước 2 của T3 (`t3-step2-verify137.py`, đợt 137 — logic
  giữ nguyên từ prereg đợt 132, chỉ sửa lỗi F-134-T3-2 cho JSON
  partial: nếu `flip.wallMs` là None thì ghi "KHÔNG CÓ DỮ LIỆU
  POST-FLIP", P1–P7 ghi KHÔNG KIỂM ĐƯỢC, không crash).
- **Ngưỡng tickCost ≤ 60 ms** là tiêu chí hợp lệ của lượt, không
  phải một dự báo P1–P7. Chuỗi 12 lượt hợp lệ tới #14:
  49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 /
  40,0 / 58,0 / 59,0 ms (trung bình **48,3 ms**).

## 2. Khái niệm (giữ nguyên v0.4, trừ stall — mới ở §6)

- **Ghost occurrence:** một entry `ghostPix` của một tick post có
  `labelMs` và `frame` khác None. `label` = frame nhãn; `snapMs` /
  `rawMs` / `labelCt` là các mốc thời gian kèm theo.
- **Histogram:** với mỗi ghost occurrence, lấy strip 48 px kênh G,
  match toàn cục với GT (`round111-m5/frames-nonperiodic`,
  thresh ≤2 bit); `m*` = frame khớp gần nhất với label;
  histogram = `m* − label` (chi tiết từng frame, gộp skp=0 và skp=1).
- **(c2):** một ghost occurrence với `skp = 0`, `presented ∈ M`
  (tập frame khớp toàn cục của strip), `label ≠ presented`, và
  `GT[label] ≠ GT[presented]` (strip thật sự khác nhãn) → bộ bốn
  `(seq, presented, label, lag)` với `lag = presented − label`
  (đơn vị frame, 30 fps). Định nghĩa này cho phép lag âm về mặt
  nguyên tắc — vì vậy P2 (0 lag âm) là một dự báo falsifiable thật,
  không phải hệ quả của định nghĩa.
- **seq:** số thứ tự tick (`seq` trong `blendTick`); **occurrence:**
  một ghost occurrence (c2); một tick có thể chứa 2 occurrence
  (c2) (vd seq 145 lượt #14: label 15 lag +2f và label 16 lag +1f,
  cùng presented 17). **Đếm theo occurrence hay theo seq riêng biệt
  được ghi rõ ở từng dự báo** — P1/P3-A1 đếm theo occurrence
  (theo script); P3' đếm theo seq riêng biệt (vì stall là thuộc
  tính của tick, xem §6).
- **occ0:** ghost occurrence ĐẦU TIÊN của một tick (dùng cho
  labelMs trong P3/P3'). `L(i)` = `labelMs` occ0 của tick post
  thứ i (0-based) trong dãy tick post.
- **curPix run:** dãy tick post liên tiếp có cùng md5 `curPix`
  (khác None). Run "đông cứng ≥3 tick" là run dài ≥3 tick.
  `run_end` = seq của tick cuối run.
- **label-floor:** `label − floor(labelCt × 30)` (0 hoặc 1);
  "+1" = nhãn nằm ở nửa sau của frame 33 ms.
- **p nhị thức:** `P(X ≥ k | n, p0)` chính xác (math.comb),
  với p0 là baseline của chính lượt đó.

## 3. P1 — (c2) gắn run-end (GIỮ NGUYÊN — phép thử chính)

- **Định nghĩa:** một occurrence (c2) tại seq `s` "gần run-end"
  nếu `min |s − run_end| ≤ 1` trên mọi run-end (kể cả nằm trong
  run, còn 1 tick tới cuối run). Baseline `p0` = tỉ lệ tick post
  thỏa cùng điều kiện, tính từ dữ liệu chính lượt đó.
- **Dự báo: ≥2/3 số occurrence (c2) của lượt nằm trong ±1 tick
  của run-end, VÀ p nhị thức < 0,01** so với baseline của lượt.
- **Verdict:** **ĐÚNG** nếu ≥2/3 VÀ p < 0,01 (với n (c2) ≥3).
  **SAI** nếu <2/3 HOẶC p ≥ 0,01 (với n ≥3). **YẾU** nếu
  (c2) = 1–2 (ghi rõ, không kết luận mạnh). **VÔ HIỆU** nếu
  (c2) = 0 (ghi "không có (c2) để kiểm", không tính ĐÚNG/SAI).
- **Bằng chứng tới #14:** lượt #9: 9/9 (baseline 18,6%,
  p ≈ 3×10⁻⁷); #10: 5/5 (baseline 9,6%, p = 8,0×10⁻⁶);
  #12: 7/7; #13: 1/1 (YẾU); #14: 6/6 (baseline 66/296 = 22,3%,
  p ≈ 0,0001 — mạnh nhất từ trước tới nay).
  **Cộng dồn: 28/28** (22/22 tới #13 + 6/6 ở #14),
  p nhị thức cộng dồn P(X≥28 | n=28, p=0,22) ≈ 4×10⁻¹⁹.
- **Ghi chú phương pháp (không phải caveat mở):** script T3 tính
  baseline bằng **unsigned-dist** (`|s − run_end| ≤ 1`) — đây là
  cách tính CHUẨN của DEF (mọi verdict P1 từ #9 tới #14 đều tính
  bằng nó). Script đối chiếu của T5 dùng **signed-dist** (tick
  trong run lấy −(run_end − s), tick sau run lấy s − run_end):
  baseline lệch 1 tick ở #14 (65/296 thay vì 66/296) và 2 tick
  ở #13 (67/307 thay vì 69/307), do các cặp run kề nhau
  (F-136-T3-1, F-137-T3-3). Cả hai cách đều cho cùng verdict P1
  ở mọi lượt đã đo. Nếu một lượt sau hai cách cho verdict khác
  nhau thì báo rõ cả hai và để T10/parent chốt — không tự chọn
  cách có lợi.

## 4. P2 — Dấu của (c2) luôn dương (GIỮ NGUYÊN)

- **Dự báo: 100% occurrence (c2) có lag ≥ +1f (presented mới hơn
  label); 0 occurrence (c2) lag âm.**
- **Verdict:** **ĐÚNG** nếu 0 lag âm. **SAI** nếu ≥1 lag âm
  (ghi rõ seq/frame) — vì dấu âm là điều desync dạng đơn giản
  (drawSrc giữ frame cũ) dự đoán, còn mô hình freeze/skew dự
  đoán dấu dương.
- **Bằng chứng tới #14:** **19/19 occurrence** lag ≥ +1f
  (18× +1f + 1× +2f), 0 lag âm, qua mọi lượt có event
  (#10: 5, #12: 7, #13: 1, #14: 6).
- **Lag +2f đầu tiên** (seq 145 lượt #14, presented 17, label 15):
  không vi phạm P2 (chỉ đòi lag ≥ +1f) và không vi phạm P4
  (xem §7). Nhất quán với stall dài (3 tick) trước seq 145
  theo phân tích §6. Chỉ ghi nhận theo dõi ở #15+ (quyết parent
  đợt 137 §12.3(d)).

## 5. P3 A1 — (c2) gắn freeze labelMs tại tick (GIỮ NGUYÊN)

- **Định nghĩa (bổ sung A1 của prereg, 17:50Z 17/11/2026 — THAY THẾ
  định nghĩa P3 gộp ban đầu):** với mỗi occurrence (c2), lấy
  `labelMs` occ0 của tick đó; "đóng băng-tại-tick" nếu
  `labelMs(tick) == labelMs(tick trước)`. **Chỉ tính đóng băng
  này vào verdict.** Mệnh đề "nhảy ≥100 ms" của P3 gộp ban đầu
  ĐÃ BỊ LOẠI khỏi phép thử ĐÚNG/SAI (lý do ghi trong prereg §6:
  baseline của mệnh đề gộp phình tới 70,3% — phép thử gần như
  luôn "đạt" kể cả dưới giả thuyết không, tức không falsifiable).
- **Tick bắt kịp:** occurrence (c2) mà `labelMs` nhảy ≥100 ms so
  với tick trước được **ghi riêng như quan sát khám phá** — không
  tính vào verdict P3, không dùng để cứu P3 nếu P3 sai.
  (Ở lượt #14: 3 tick bắt kịp +837 ms tại 145 ×2 occurrence,
  +950 ms tại 265 — nằm hoàn toàn trong dải nhảy thường gặp của
  lượt chậm: 176/295 cặp tick post nhảy ≥100 ms, nhảy lớn nhất
  1.401 ms — nên không dùng chúng làm bằng chứng ủng hộ cơ chế.
  Xem §6 về cách hòa giải đúng.)
- **Baseline:** tỉ lệ tick post có `labelMs` đóng băng so với tick
  trước, tính từ dữ liệu chính lượt đó (#14: 65/295 = 22,0%).
- **Dự báo: ≥2/3 số occurrence (c2) đóng băng-tại-tick, VÀ p nhị
  thức < 0,01** so với baseline của lượt.
- **Verdict:** cùng luật P1 (ĐÚNG / SAI / YẾU n=1–2 / VÔ HIỆU
  n=0). Occurrence (c2) ở tick post đầu tiên hoặc thiếu labelMs
  được xếp "không xác định" và LOẠI khỏi mẫu số (ghi rõ số lượng).
- **Bằng chứng tới #14:** #9: 8/9 (baseline 22,9%,
  p = 5,4×10⁻⁵); #10: 5/5 (baseline 20,3%, p = 3,4×10⁻⁴);
  #12: 7/7; #13: 1/1 (YẾU); **#14: 3/6, p = 0,125 — SAI**
  (đóng băng [327, 368, 389]; bắt kịp [145 ×2, 265]).
  **Cộng dồn: 24/28 = 85,7%.** Verdict SAI ở lượt quyết định
  #14 **ĐỨNG** — không sửa lại, không áp P3' hồi tố để đổi nó.
  A1 quá hẹp cho lượt chậm: nó chỉ bắt được chuỗi đóng băng KÉO
  DÀI QUA tick (c2), bỏ sót chuỗi đóng băng KẾT THÚC ĐÚNG TẠI
  tick (c2) bằng một cú nhảy bắt kịp. Đó chính là lý do P3' ra đời
  (§6) — nhưng P3' chỉ áp dụng từ #15 trở đi.

## 6. P3' — (c2) nằm ở cuối chuỗi đóng băng nhãn (MỚI — prereg từ lượt #15)

### 6.1 Định nghĩa chính xác

- **Chuỗi đóng băng nhãn (label-freeze chain):** dãy tick post
  liên tiếp có cùng `labelMs` occ0. Độ dài chuỗi = số tick trong dãy.
- **`stall_truoc(seq)`:** với seq (c2) tại chỉ số `i` trong dãy tick
  post (0-based), `stall_truoc` = **độ dài của chuỗi đóng băng
  nhãn dài nhất kết thúc tại tick `i−1`** (tức số tick liên tiếp
  ngay trước tick (c2) có cùng `labelMs`; **không tính tick (c2)
  vào**). Nếu `i < 2` (seq nằm trong 2 tick post đầu tiên) hoặc
  `labelMs` occ0 thiếu ở các tick liên quan thì `stall_truoc`
  **không xác định**.
- Định nghĩa này bao phủ **cả hai dạng** bằng một công thức duy
  nhất:
  - (a) Chuỗi đóng băng **kéo dài qua** tick (c2) (A1-đúng):
    `L(seq) == L(seq−1)` — chuỗi chứa cả tick (c2), và
    `stall_truoc` đếm phần chuỗi đứng trước tick (c2)
    (vd seq 327 lượt #14: chuỗi 70137 dài 5 tick 323–327,
    `stall_truoc = 4`).
  - (b) Chuỗi đóng băng **kết thúc đúng tại** tick (c2) bằng cú
    nhảy bắt kịp: `L(seq) ≠ L(seq−1)` — chuỗi đứng trước tick (c2)
    có độ dài `stall_truoc` (vd seq 145: nhãn 36664 giữ 3 tick
    142–144 rồi nhảy +837 ms TẠI tick 145, `stall_truoc = 3`).
- **P3' đúng cho một seq** nếu `stall_truoc(seq) ≥ 2`.
- **Đơn vị đếm: seq RIÊNG BIỆT** (không phải occurrence). Hai
  occurrence (c2) trong cùng một tick chia sẻ một giá trị stall
  nên chỉ tính một lần — đếm theo occurrence sẽ nhân đôi trọng số
  của một tick (vd seq 145 có 2 occurrence). Đây là điểm khác
  biệt có chủ ý so với P1/P3-A1 (đếm theo occurrence, theo script).
- **Baseline `p0` của chính lượt đó:** `p0` = (số tick post `i ≥ 2`
  có `stall_truoc(i) ≥ 2`) / (số tick post `i ≥ 2`). Tính trên
  cùng dãy tick post. (Lưu ý: `stall_truoc(i) ≥ 2` tương đương
  `L(i−1) == L(i−2)`; số lượng này bằng số cặp tick đóng băng
  trong lượt, chỉ khác mẫu số — xem §6.3.)
- **Dự báo: ≥2/3 số seq (c2) riêng biệt của lượt có
  `stall_truoc ≥ 2`, VÀ p nhị thức < 0,01** so với baseline
  của lượt.
- **Verdict:** **ĐÚNG** nếu ≥2/3 VÀ p < 0,01 (với n ≥3 seq riêng
  biệt). **SAI** nếu <2/3 HOẶC p ≥ 0,01 (với n ≥3). **YẾU** nếu
  n = 1–2 seq riêng biệt. **VÔ HIỆU** nếu n = 0. Seq có stall
  không xác định được LOẠI khỏi mẫu số nhưng phải ghi rõ số lượng;
  nếu số seq bị loại > 1/3 tổng số seq (c2) thì verdict là **YẾU**
  (không đủ dữ liệu) bất kể tỉ lệ trên các seq còn lại.
- **Độ nhạy ngưỡng (ghi sẵn để khỏi tranh cãi sau):** ngưỡng
  `stall ≥ 2` là ngưỡng CHUẨN. Nếu một lượt cho kết quả biên thì
  báo thêm độ nhạy `stall ≥ 3` và `stall ≥ 4` cùng p tương ứng
  (chỉ báo cáo, không đổi verdict).

### 6.2 Hiệu chuẩn — lượt #14 (phân tích khám phá, KHÔNG phải prereg cho #14)

| seq (c2) | stall_truoc | Dạng | labelMs tại tick |
|---|---|---|---|
| 145 | **3** | (b) bắt kịp +837 ms | 36664 giữ 3 tick (142–144) → nhảy tại 145 |
| 265 | **6** | (b) bắt kịp +950 ms | 58859 giữ 6 tick (259–264) → nhảy tại 265 |
| 327 | **4** | (a) đóng băng tại tick (A1 đúng) | chuỗi 70137 dài 5 tick (323–327) |
| 368 | **2** | (a) đóng băng tại tick (A1 đúng) | chuỗi 77399 dài 3 tick (366–368) |
| 389 | **4** | (a) đóng băng tại tick (A1 đúng) | chuỗi 80771 dài 5 tick (385–389) |

- Kết quả: **5/5 seq riêng biệt có stall ≥ 2**; baseline
  `p0 = 65/294 = 22,1%`; **p = P(X≥5 | n=5, p0=0,221) ≈ 0,0005**.
- Độ nhạy ngưỡng (tính lại độc lập đợt 138 từ JSON gốc #14 —
  đính chính số gần đúng của T3-137 §4.3): `stall ≥ 3` → 4/5,
  p0 = 38/294 = 12,9%, **p ≈ 0,0013** (T3 ghi ≈0,002);
  `stall ≥ 4` → 3/5, p0 = 24/294 = 8,2%, **p ≈ 0,0048**
  (T3 ghi ≈0,02 — có lẽ đã dùng lại baseline của ngưỡng ≥3).
  Cả hai vẫn dưới 0,01 — kết luận "mẫu stall mạnh" đứng vững,
  thậm chí mạnh hơn số T3 đã ghi. Xem LIMITS đợt 138
  (F-138-T3-1).
- **Trạng thái của phân tích này:** đặt SAU khi thấy dữ liệu #14
  (post-hoc) nên p≈0,0005 KHÔNG có cùng trọng lượng như một
  prereg đã đăng ký trước. Việc đưa nó thành prereg P3' cho #15+
  là đúng quy trình: dự báo được đăng ký TRƯỚC khi lượt #15 đo,
  và chỉ các lượt từ #15 trở đi mới kiểm chứng nó. **Không dùng
  P3' để xét lại verdict P3-A1 của #14 (vẫn SAI) hay verdict
  điều tra đã đóng.**

### 6.3 Ghi chú tính baseline (đính chính nhỏ)

- T3-137 §4.3 ghi baseline `P(stall ≥ 2) = 65/295 = 22,0%`
  (tỉ lệ cặp tick đóng băng). Định nghĩa chặt trong §6.1 dùng
  mẫu số 294 (số tick post có stall xác định, i≥2):
  `65/294 = 22,1%`. p tương ứng: 0,000519 (theo 65/295) vs
  0,000528 (theo 65/294) — chênh không đáng kể, cả hai đều
  ≈0,0005. **DEF v0.5 chốt mẫu số 294** (số tick có stall xác
  định) làm chuẩn prereg; số 65/295 của T3 được ghi nhận là
  tương đương trong giới hạn làm tròn. Xem LIMITS đợt 138
  (F-138-T3-2).

### 6.4 Ghi chú sau xem xét đợt 153 — cơ chế thứ hai "catch-up lag sau đóng băng" (quyết parent (d)(i): ĐÓNG XEM XÉT P3')

- **Xem xét P3' đã đóng** (quyết parent đợt 153 §12.3(d), chọn
  (i); không chọn (ii) giữ mở, không chọn (iii) sửa DEF thành
  P3''): chấp nhận P3' với **1 ngoại lệ có giải thích**. 2 tick
  P3' không đạt trong các lượt hợp lệ gần đây đều là **MỘT
  event duy nhất — seq 365 ×2 occurrence trong attempt2 đợt
  151** (stall_truoc=1), không phải 2 failure độc lập.
- **Cơ chế thứ hai (đã chứng minh bằng dữ kiện, xem
  `docs/PHASE9_ROUND153_T4_WEBKIT_QUIET22_LIMITS.md` §9):
  "catch-up lag sau đóng băng".** Sau một lần đóng băng dài +
  loop wrap, nhãn có thể tụt lại 3–6 frame trong lúc bắt kịp và
  gây (c2) mà không cần đóng băng ngay trước đó. Chuỗi sự kiện ở
  event 365: (1) video stall thật qua loop wrap — currentTime
  đóng băng 0,8338 + presented đóng băng 25 trong 8 tick
  (seq 354–361), tBlend nhảy +1759 ms tại 353→354; (2) khi phát
  lại, presented chạy +1/+2/+2/+3/+3 frame mỗi tick (361→365)
  trong khi chuỗi ghost snapshot nạp lại với pixels ĐI TRƯỚC
  label (strip đã là frame 36 từ tick 362 trong khi label mới
  26); (3) khi presented bắt kịp 36 ở tick 365, (c) nổ trên cả
  2 entry của ring. Nhãn KHÔNG đóng băng tại lúc (c2) nổ — nó
  đang chạy nhưng tụt 3–6 frame sau presented. Bằng chứng then
  chốt: strip frame-36 (md5 `2842a43a`) đóng băng byte-identical
  qua 6 tick (362-g1 → 367-g0) trong khi label đi 26→33 và
  presented đi 28→39; draw log độc lập xác nhận mỗi frame vẽ
  đúng 1 lần; tBlend đơn điệu, không reboot, không nhảy đồng hồ.
- **Hệ quả cho P3':** tiêu chí nghiêm ngặt ("mọi (c2) đều ở cuối
  chuỗi đóng băng ≥2 tick") **đã bị bác bỏ ở dạng phổ quát** —
  tới hết đợt 153: **39/41 occurrence, 39/40 distinct-seq**.
  Định nghĩa P3' (§6.1) **KHÔNG đổi**; verdict "ghost-freeze
  ĐƯỢC ỦNG HỘ MẠNH" **đứng nguyên** (đóng băng ĐÃ xảy ra ngay
  trước event — labelMs 57773 đóng băng ≥7 tick, seq 355–361 —
  event 365 là hệ quả xuôi của chính lần đóng băng đó, đóng
  băng kết thúc 4 tick trước khi (c2) nổ). Các trụ P1/P3-A1/P2/
  P7 không bị ảnh hưởng.
- **Đếm từ đợt 154:** báo thêm **cột distinct-seq cạnh cột
  occurrence** cho P3' (và chỉ P3' — P1/P2/P3-A1/P7 vẫn đếm
  theo occurrence như script). 1 event đếm 2 lần theo occurrence
  sẽ làm lệch trọng số; cột distinct-seq cho parent thấy đúng
  mức độ (vd đợt 153: 39/41 occurrence = 39/40 distinct-seq).
- **Nếu mẫu 365-style tái diễn** (một (c2) với stall_truoc=1
  kèm đóng băng dài kết thúc vài tick trước đó): ghi rõ là ca
  catch-up lag, đếm vào cả hai cột, **không tự mở lại điều tra**
  — chỉ mở lại khi một trong ba điều kiện §13 xảy ra và parent
  quyết.

## 7. P4 — Số lượng (c2) (GIỮ NGUYÊN + ghi chú +2f)

- **Dự báo: (c2) thuần +1f: 2–8 occurrence; tổng (c2) skp=0:
  2–12 occurrence; (c2) skp=1 = 0; occurrence lag ≥+5f = 0.**
- **Verdict:** **ĐÚNG** nếu cả 4 tiêu chí con trong khoảng.
  Ngoài dải count (0–1 hoặc ≥9 thuần / ≥13 tổng) thì ghi rõ là
  lệch Poisson, KHÔNG tự bác mô hình freeze (count nhỏ, nhiễu lớn)
  — cùng luật prereg đợt 132 §3 P4.
- **Ghi chú mới (v0.5, theo quyết parent đợt 137 §12.3(d)):**
  một occurrence lag **+2f đơn lẻ không vi phạm** P4 (P2 chỉ đòi
  lag ≥ +1f; P4 đếm thuần +1f). **Nếu +2f ≥3 occurrence trong một
  lượt sau thì xem lại P4** (đó cũng là một trong ba điều kiện mở
  lại điều tra, xem §13).
- **Bằng chứng tới #14:** #9: thuần 8, tổng 9; #10: 5/5; #12: 7/7;
  #13: thuần 1, tổng 1 — NGOÀI khoảng đếm (YẾU về count, không
  bác mô hình); **#14: thuần 5, tổng 6, skp=1 = 0, lag ≥+5f = 0 —
  ĐÚNG (cả 4 tiêu chí con)**, về trong khoảng sau 1 lượt ngoài
  ở #13. Tỉ lệ (c2)/tick post #14: 6/296 = 2,03% (bật trở lại
  sau 0,33% ở #13; p=0,00047 so với tỉ lệ #13 — mức giảm #13 là
  dao động ngẫu nhiên). Cộng dồn 3 lượt gần nhất: 14/1015 = 1,38%.

## 8. P5 — Các số phụ skew (snap-label ĐỔI 34–48 → 34–52 ms; còn lại GIỮ NGUYÊN)

- **Dự báo v0.5: snapMs−labelMs median 34–52 ms; rawMs−labelMs
  median 8–10 ms; label−floor +1 chiếm 63–76%; curPix run
  ≥3 tick: 13–22 run.** Tính trên mọi ghost occurrence post-flip
  (gộp skp=0 và skp=1; median trên toàn bộ occurrence, không chỉ
  occ0 — theo script histogram của T4).
- **Verdict:** **ĐÚNG** nếu mọi số phụ trong dải. Ngoài dải: ghi rõ,
  **không bác mô hình** (số phụ, không phải phép thử chính —
  prereg §4).
- **Căn cứ hiệu chỉnh snap-label (chỉ tiêu chí này đổi):**
  - #13: snap 52 ms (vượt trần cũ 4 ms); #14: snap 50 ms (vượt
    2 ms) — **2 lượt chậm liên tiếp vượt trần cũ**, cùng chiều
    với tickCost median tăng (58,0 → 59,0 ms); raw/label-floor/run
    không đổi chiều tương tự (xem bảng dưới).
  - T10 đợt 137 §10.1(e) kiểm từ file histogram của T4 + LIMITS:
    mọi snap-median đã biết đều nằm trong 34–52 ms; không có
    bằng chứng nào chống lại khoảng ứng viên.
  - T3 đợt 138 kiểm lại **độc lập** từ JSON gốc (code riêng, không
    dùng script T4/T3 cũ — xem LIMITS đợt 138 §2): #9: 44, #10: 35,
    #12: 35, #13: 52, #14: 50 ms — khớp 100% số T4; cộng với
    #1–#8 từ bảng hiệu chuẩn prereg (39, 35, 45, 36, 38, 45, 34, 44)
    thì **cả 12 lượt yên hợp lệ đều nằm trong 34–52 ms**.
- **Bảng lịch sử P5 đầy đủ (12 lượt hợp lệ; #11 không có lượt hợp lệ):**

| Lượt | tickCost med | snap med | raw med | label-floor +1 | run ≥3 | P5 (v0.4) | P5 (v0.5) |
|---|---|---|---|---|---|---|---|
| #1 | 49,5 | 39 | 9 | 63–76%* | 13–21* | ✓ | ✓ |
| #2 | 40,0 | 35 | 9 | 63–76%* | 13–21* | ✓ | ✓ |
| #3 | 52,0 | 45 | 8 | 63–76%* | 13–21* | ✓ | ✓ |
| #4 | 47,5 | 36 | 9 | 63–76%* | 13–21* | ✓ | ✓ |
| #5 | 44,0 | 38 | 9 | 63–76%* | 13–21* | ✓ | ✓ |
| #6 | 54,0 | 45 | 10 | 63–76%* | 13–21* | ✓ | ✓ |
| #7 | 40,0 | 34 | 9 | 63–76%* | 13–21* | ✓ | ✓ |
| #8 | 56,0 | 44 | 9 | 63–76%* | 13–21* | ✓ | ✓ |
| #9 | 39,5 | 44 | 9 | 68,1% | 21 | 4/4 ✓ | 4/4 ✓ |
| #10 | 40,0 | 35 | 8 | **76,5%** ✗ | **12** ✗ | 2/4 | 2/4 |
| #12 | 40,0 | 35 | 8 | 74,9% | 15 | 4/4 ✓ | 4/4 ✓ |
| #13 | 58,0 | **52** ✗ | 10 | **62,7%** ✗ | **23** ✗ | 1/4 | 2/4 |
| #14 | 59,0 | **50** ✗ | 9 | 67,9% | 22 | 3/4 | 4/4 ✓ |

  \* #1–#8: chỉ có snap/raw từng lượt trong bảng hiệu chuẩn prereg;
  label-floor và run chỉ ghi dạng khoảng gộp 8 lượt (63–76%;
  13–21 run) — không có số từng lượt trong prereg.
- **Vì sao chỉ đổi snap, không đổi label-floor/run:**
  label-floor và run mỗi thứ chỉ lệch **một lần, ở biên, rồi tự
  về trong khoảng ngay lượt sau** (#10: 76,5% vượt 0,5pp và
  12 run thiếu 1 — T3-133 đã ghi rõ và quyết KHÔNG đổi DEF vì
  lệch biên nhỏ; #12 về trong khoảng cả hai. #13: 62,7% thiếu
  0,3pp — thiếu đúng 2 occurrence — và 23 run vượt 1; #14 về
  trong khoảng cả hai: 67,9% và 22 run). Snap thì khác: vượt
  **2 lượt liên tiếp** (52 rồi 50), cùng chiều với tickCost tăng,
  và là tiêu chí duy nhất còn ngoài khoảng ở #14. Parent chấp
  nhận đúng hiệu chỉnh này (§12.3(b) đợt 137).
- **Tính chất của khoảng mới — ghi trung thực:** 34–52 ms chính
  là **[min, max] quan sát được** trên 12 lượt (min 34 ms ở #7,
  max 52 ms ở #13). Khoảng này bao hết dữ liệu đã biết theo
  thiết kế — một lượt sau có snap 53+ ms sẽ lại ngoài khoảng,
  và khi đó chỉ ghi rõ (không bác mô hình), trừ khi parent quyết
  hiệu chỉnh tiếp. Đừng đọc 34–52 ms như một dự báo có sức mạnh
  tiên đoán độc lập với dữ liệu đã dùng để đặt nó.

## 9. P6 — Phân phối histogram (GIỮ NGUYÊN — KHÔNG verdict)

- **Dải (min–max 8 lượt hiệu chuẩn, làm tròn ra ngoài):
  bin 0: 33–39%; +1/+2: 33–53%; +3: 3–19%.**
- Đọc đúng: đây là khoảng quan sát, KHÔNG phải dự báo của giả
  thuyết còn sống (giả thuyết thứ tự theo tick ĐÃ BỊ BÁC ở lượt #9
  — prereg §1.1). Kết quả trong khoảng: "phù hợp dữ liệu 8 lượt
  trước". Kết quả ngoài khoảng: "mới so với 8 lượt trước — cần
  xem lại, không bác giả thuyết nào". **Không dùng P6 để tuyên bố
  ĐÚNG/SAI cho bất kỳ giả thuyết nào.**
- **Bằng chứng tới #14:** #13 ngoài khoảng 2/3 bin (bin0 42,0%,
  +1/+2 32,6%, +3 14,2% trong); #14 trong khoảng cả 3 bin
  (bin0 35,0%, +1/+2 34,0%, +3 16,2%). Đuôi +3 tăng dần
  (3,3% ở #12 → 14,2% ở #13 → 16,2% ở #14) và đuôi âm tăng
  (6,3% → 10,1% → 13,7%) cùng chiều với tickCost tăng — ghi để
  đợt sau theo dõi, không đổi dải P6 trong v0.5 (parent chỉ
  chấp nhận đổi P5 snap + thêm P3').

## 10. P7 — Log draw phủ post-flip vs seq (c2) (GIỮ NGUYÊN)

- **Điều kiện áp dụng:** log draw phủ cửa sổ đo post-flip (ít nhất
  1 entry có `wallMs` trong cửa sổ đo VÀ phủ ít nhất 1 seq (c2):
  có entry log trong ±500 ms của `tBlend` của tick (c2)). Nếu log
  KHÔNG phủ bất kỳ seq (c2) nào: ghi **"KHÔNG KIỂM ĐƯỢC — thiết
  kế log chưa đạt quyết parent"**, không suy luận thay, không tính
  ĐÚNG/SAI cho P7.
- **Dự báo (nếu đủ điều kiện): tại các seq (c2) được log phủ,
  drawSrc KHÔNG BAO GIỜ trễ sau ct** — tức
  `floor(ct×30) − frameIdx ∈ {−1, 0}` (không có entry nào ≥+1);
  **và rawUnit vẽ đúng frame với drawSrc gần nhất** (chênh 0)
  tại các seq (c2) đó.
- **Quy tắc đọc (đăng ký trước, prereg §3 P7):** **ỦNG HỘ desync**
  nếu ≥1 seq (c2) được phủ cho thấy drawSrc trễ ≥1 frame so với
  ct (và không trễ tại các seq không-(c2) đối chứng cùng cửa sổ);
  **LÀM YẾU desync** nếu 0 seq (c2) được phủ cho thấy drawSrc trễ.
- **Verdict:** **ĐÚNG (làm yếu desync)** nếu đủ điều kiện phủ VÀ
  0 seq (c2) cho thấy drawSrc trễ. **ỦNG HỘ desync** nếu ≥1 seq
  cho thấy drawSrc trễ ≥1f. **KHÔNG KIỂM ĐƯỢC** nếu log không phủ
  seq (c2) nào.
- **Giới hạn ghi trước:** log lấy mẫu thưa (lượt #14: khoảng cách
  drawSrc liên tiếp median 108,0 ms, 500/517 entry >66 ms) nên
  **không phân giải được lệch 33 ms = 1 frame** — kết luận
  "không trễ" chỉ có giá trị ở độ phân giải ~100 ms. P7 là
  "làm yếu desync", không phải "bác bỏ tuyệt đối".
- **Bằng chứng tới #14:** lượt #10: coverage 0/5 với logger cũ
  (KHÔNG KIỂM ĐƯỢC — không nằm trong chuỗi cộng dồn dưới đây);
  với logger nới: #12: 7/7, #13: 1/1, #14: 6/6 (delta −25/−25/−23/
  −23/−26/+46 ms; 92 entry log trong ±500 ms của tick (c2):
  `floor(ct*30)−frameIdx` chỉ −1/0, **0 entry drawSrc trễ ≥+1f**;
  cặp rawUnit−drawSrc gần nhất {0: 46}).
  **Cộng dồn: 14/14 theo quy ước đếm từng seq** (7/7 + 1/1 + 6/6)
  — quy ước đã chốt ở LIMITS gộp đợt 137 §10.1(b) theo tiền lệ
  đợt 136; số 9/9 của T5 (8/8 + 1) trộn hai đơn vị đếm, không
  dùng làm số chuẩn.
- **Logger:** c2DrawLog n=996 ở #14, phủ loop 1–21 đầy đủ,
  loop≥3 = 902 entry (90,6%), 20 wrap — kiểm chứng runtime lần
  thứ 3 liên tiếp cho fix logger nới (xem §12).

## 11. Ngưỡng tickCost ≤60 ms (GIỮ NGUYÊN — không đổi trong DEF này)

- Ngưỡng **≤60 ms** giữ nguyên làm tiêu chí lượt yên hợp lệ (§1).
- Điều kiện bàn lại theo quyết parent đợt 136 §12.3(c) **ĐÃ ĐẠT**
  (median #14 = 59,0 ms, biên 1 ms, lần thứ 2 liên tiếp ≥55 ms:
  58,0 → 59,0) nhưng parent **quyết GIỮ NGUYÊN, điều tra tải song
  song trước, chưa đổi ngưỡng/bar** (quyết đợt 137 §12.3(c)):
  dữ kiện tải chưa chứng minh được nhân quả (load1 lúc đo
  0,61–2,55 / RAM 1.056–1.531 MB — tải song song lúc đo NHẸ hơn
  đợt 136 về RAM mà median vẫn tăng; load không cao hơn đợt 136).
  Đổi ngưỡng vì hai lượt sát ngưỡng là dời cột mốc.
- **Từ đợt 138:** T4/T5 ghi load1/RAM kèm tickCost theo từng pass
  để kiểm tương quan tải–median. **Bàn lại ngưỡng chỉ khi #15
  vượt 60 ms, hoặc ba lượt liên tiếp ≥55 ms mà đã loại trừ tải.**
- DEF này không chứa bất kỳ thay đổi ngưỡng/bar nào.

## 12. Fix 530e10a7 — instrumentation VĨNH VIỄN

- `preview.tsx` md5 **`530e10a7`** (fix logger nới + re-enable không
  xóa mảng) là **instrumentation VĨNH VIỄN — KHÔNG GỠ sau verdict**
  (quyết parent đợt 137 §12.3(a)). Lý do: (a) logger là công cụ
  duy nhất làm được P7 (coverage/desync); gỡ nó là phá hủy khả
  năng kiểm lại; (b) kiểm chứng runtime 3 lần liên tiếp (#12, #13,
  #14), không gây hại production nào được ghi nhận (chỉ ghi log);
  (c) bản gốc `805409f0` vẫn còn tại
  `hidden_files/round134-t3/preview.tsx.orig-805409f0` nên revert
  sau này vẫn làm được trong 1 bước nếu parent đổi ý.
- Mọi lượt yên từ #12 trở đi đều đo trên cây 530e10a7; T3 đợt 138
  kiểm lại md5 lúc viết DEF này: **530e10a7** (không sửa cây).

## 13. Giám sát thụ động từ lượt #15 + điều kiện mở lại điều tra

- Từ đợt 138: **không mở thêm luồng điều tra (c2) chuyên biệt**.
  (c2) vẫn được **đếm tự động** trong analyzer của T4 mỗi lượt yên
  (không tốn thêm luồng): P1–P7 được tính và báo cáo theo DEF này
  trong LIMITS của T3/T4 từng đợt, cùng với P3' làm prereg.
- **Mở lại điều tra (c2) khi MỘT trong ba điều kiện sau xảy ra ở
  một lượt yên hợp lệ:**
  1. **P1 gãy** — P1 SAI theo luật §3 với n (c2) ≥3 (tức <2/3
     occurrence (c2) gần run-end, hoặc p ≥ 0,01);
  2. **Xuất hiện lag âm** — ≥1 occurrence (c2) lag âm trong lượt
     (P2 SAI);
  3. **+2f trở nên thường xuyên** — **≥3 occurrence lag +2f trong
     một lượt** (ngưỡng đã chốt ở quyết parent đợt 137 §12.3(d);
     một occurrence đơn lẻ như seq 145 ở #14 không đủ).
- P3-A1 SAI một mình **không** mở lại điều tra (nó đã SAI ở lượt
  quyết định #14 và đã được hòa giải bằng P3'); P3' SAI một mình
  cũng **không** tự động mở lại — ghi rõ làm dị thường để T10/
  parent xem xét cùng ba điều kiện trên. P5/P6 ngoài khoảng cũng
  chỉ ghi rõ, không mở lại điều tra.

## 14. Quy tắc verdict tổng (đã chốt — không xét lại từ #15)

- **Verdict điều tra (c2) ĐÃ ĐÓNG ở đợt 137** (quyết parent
  §12.3(a)): **"cơ chế ghost-freeze ĐƯỢC ỦNG HỘ MẠNH"**
  (không phải "đã chứng minh tuyệt đối") — dựa trên P1 28/28
  (p≈4×10⁻¹⁹), P2 19/19, P4 về trong khoảng ở #14, P7 14/14,
  F6' đóng 3 lần liên tiếp, logger kiểm chứng runtime 3 lần,
  tỉ lệ (c2) bật trở lại 2,03% (p=0,00047 so với #13), và phân
  tích stall khám phá (§6.2). Chấp nhận kèm các caveat đã ghi:
  P3-A1 SAI ở lượt quyết định (3/6, p=0,125; cộng dồn 24/28);
  lag +2f đầu tiên (1/19) chưa giải thích đầy đủ; P5 snap ngoài
  khoảng lần thứ 2 liên tiếp (đã xử lý bằng hiệu chỉnh §8);
  P7 log thưa nên chỉ "làm yếu desync".
- Từ lượt #15, **không xét lại verdict tổng** này theo từng lượt.
  Mỗi lượt chỉ báo cáo P1–P7 + P3' theo DEF này. Verdict tổng
  chỉ được xem xét lại nếu một trong ba điều kiện §13 xảy ra
  (khi đó parent quyết có mở lại điều tra hay không).
- Quy tắc verdict tổng của prereg đợt 132 §4 ("ĐƯỢC CỦNG CỐ nếu
  P1 VÀ P3 cùng ĐÚNG và P2 ĐÚNG...") nay là **lịch sử** — nó đã
  được áp dụng để đi tới verdict đóng ở đợt 137 (với P3-A1 SAI
  được hòa giải bằng P3' và chấp nhận kèm caveat, theo quyết
  parent, không theo luật máy móc của prereg).

## 15. Caveat của định nghĩa này (đọc trước khi dùng)

- **P3' có gốc post-hoc.** Phân tích stall được đặt SAU khi thấy
  dữ liệu #14; p≈0,0005 của nó không có cùng trọng lượng như một
  prereg đã đăng ký trước. Giá trị của P3' nằm ở các lượt TỪ #15
  trở đi, khi nó đã là prereg. Đừng trích p≈0,0005 ở #14 như bằng
  chứng prereg.
- **P5 snap 34–52 ms là khoảng min–max quan sát** (xem §8) — bao
  hết dữ liệu đã biết theo thiết kế; sức mạnh tiên đoán của nó
  thấp hơn một khoảng đặt trước khi thấy #13/#14.
- **P5/P6 ngoài khoảng không bác mô hình.** Chỉ P1/P2/P3/P3'/P7
  là phép thử mô hình; P4 ngoài dải count ghi là lệch Poisson.
- **P7 chỉ "làm yếu desync".** Log thưa (~108 ms giữa các entry
  drawSrc) không phân giải lệch 1 frame; đừng trích P7 như bằng
  chứng desync đã bị bác bỏ tuyệt đối.
- **Baseline P1 có hai cách tính** (unsigned-dist chuẩn vs
  signed-dist của T5 — xem §3). Verdict giống nhau ở mọi lượt đã
  đo; nếu khác nhau ở lượt sau thì báo cả hai.
- **Lượt #11 không tồn tại** (attempt đợt 134 bị abort). Mọi
  chuỗi "12 lượt hợp lệ" đều là #1–#10 + #12–#14. Đừng nội suy
  số liệu cho #11.
- **Mẫu nhỏ.** Mọi lượt chỉ có n≈300–400 tick post và (c2) đếm
  được trên đầu ngón tay (1–7 seq/lượt). p nhị thức đã tính đúng
  nhiễu này; đừng đọc tỉ lệ % mà bỏ qua n.
- **F6' (skippedLatest=1)** không thuộc DEF này — nó là tiêu chí
  riêng của T4 (đóng 3 lần liên tiếp tới #14: 51/51 tick không vi
  phạm thật), ghi ở đây chỉ để đối chiếu.

## 16. Lịch sử phiên bản

- **v0.4 (17/11/2026, T3 đợt 132 — file
  `hidden_files/round132-t3/prereg-t3.md`, giữ nguyên):** prereg
  cho lượt yên #10, đăng ký TRƯỚC khi T4 đo (17:45Z + bổ sung A1
  17:50Z). Đặt P1–P7 + luật verdict; hiệu chuẩn trên 8 lượt yên
  hợp lệ #1–#8; P5 snap-label 34–48 ms (dải 8 lượt 34–45 ms, nới
  +3 ms cho overhead log draw); P6 là khoảng thực nghiệm 8 lượt,
  không verdict; P3 ban đầu gộp "đóng băng HOẶC nhảy ≥100 ms",
  được A1 sửa thành chỉ "đóng băng-tại-tick" trước khi T4 đo
  (baseline mệnh đề gộp 70,3% — không falsifiable).
  "DEF v0.5: CHƯA VIẾT" (prereg §1.4) — không có dữ liệu mới đổi
  dải/ngưỡng lúc đó.
- **v0.5 (18/11/2026, T3 đợt 138 — file này):** P5 snap-label
  **34–48 → 34–52 ms** (bằng chứng: #13: 52 ms, #14: 50 ms — 2
  lượt chậm liên tiếp vượt trần cũ cùng chiều tickCost tăng;
  T10 kiểm nhất quán với mọi snap-median đã biết; T3-138 kiểm
  lại độc lập từ JSON gốc 5 lượt #9/#10/#12/#13/#14, khớp 100%
  số T4); **bổ sung P3' stall-based** (bằng chứng: phân tích khám
  phá #14 — 5/5 seq ở cuối chuỗi đóng băng nhãn ≥2 tick,
  p≈0,0005; độ nhạy ngưỡng vẫn mạnh: ≥3 → p≈0,0013, ≥4 →
  p≈0,0048, tính lại độc lập đợt 138); P1/P2/P3-A1/P4/P6/P7
  GIỮ NGUYÊN; tickCost ≤60 ms GIỮ NGUYÊN; fix 530e10a7 thành
  instrumentation VĨNH VIỄN; điều tra (c2) ĐÓNG với kết luận
  "ghost-freeze ĐƯỢC ỦNG HỘ MẠNH"; từ #15 chỉ giám sát thụ động
  với ba điều kiện mở lại (§13). Các tiêu chí P5 còn lại
  (raw/label-floor/run) GIỮ NGUYÊN bất chấp mỗi thứ lệch biên
  một lần (#10: label-floor 76,5%, run 12; #13: label-floor
  62,7%, run 23) vì đều tự về trong khoảng ngay lượt sau.
- **v0.6 (dự kiến):** chỉ viết khi có dữ liệu mới — vd một lượt
- **Ghi chú bổ sung 20/11/2026 (T4 đợt 154, theo quyết parent
  đợt 153 §12.3(d)(i) — KHÔNG đổi số phiên bản, KHÔNG đổi định
  nghĩa):** xem xét P3' ĐÃ ĐÓNG; cơ chế thứ hai "catch-up lag
  sau đóng băng" ghi ở §6.4; P3' tới hết đợt 153 là 39/41
  occurrence = 39/40 distinct-seq; từ đợt 154 báo thêm cột
  distinct-seq cạnh occurrence cho P3'. Xem
  `docs/PHASE9_ROUND153_T4_WEBKIT_QUIET22_LIMITS.md` §9 (điều
  tra) + `docs/PHASE9_ROUND153_LIMITS.md` §4/§12.3(d) (quyết).
  sau cho P3' SAI trong khi P1 ĐÚNG (xem lại định nghĩa stall),
  hoặc snap-median vượt 52 ms nhiều lượt liên tiếp, hoặc một
  trong ba điều kiện §13 xảy ra và parent quyết mở lại điều tra.
  Không tự ý đổi ngưỡng tickCost hay prereg ngoài quyết parent.

## 17. Tài liệu tham chiếu

- Prereg v0.4: `hidden_files/round132-t3/prereg-t3.md`
  (+ script hiệu chuẩn `calibrate-freeze-131.py`,
  `t3-freeze-calibration-131.txt`).
- Script bước 2 (logic P1–P7 chuẩn):
  `hidden_files/round137-t3/t3-step2-verify137.py`
  (output lượt #14: `t3-step2-137a1.txt`).
- Phân tích stall khám phá #14: `docs/PHASE9_ROUND137_T3_C2_LIMITS.md`
  §4.3 + §5 + §6 (dự thảo DEF v0.5).
- Kiểm chứng khoảng P5 của T10:
  `docs/PHASE9_ROUND137_LIMITS.md` §10.1(e).
- Quyết parent đóng điều tra + chấp nhận DEF v0.5:
  `docs/PHASE9_ROUND137_LIMITS.md` §12.3(a)–(b).
- Kiểm chứng độc lập đợt 138 (P5 + P3'): script + output
  `hidden_files/round138-t3/t3-def-verify.py`,
  `t3-def-verify-138a1.txt`; LIMITS công việc viết DEF:
  `docs/PHASE9_ROUND138_T3_DEF_LIMITS.md`.
- Xem xét P3' đợt 153 (kết luận (b) + cơ chế "catch-up lag sau
  đóng băng"): `docs/PHASE9_ROUND153_T4_WEBKIT_QUIET22_LIMITS.md`
  §9; quyết parent đóng xem xét: `docs/PHASE9_ROUND153_LIMITS.md`
  §12.3(d)(i); ghi chú cơ chế vào DEF: §6.4 (T4 đợt 154).
- JSON gốc các lượt yên: `hidden_files/round131-t4/` (#9),
  `round133-t4/` (#10), `round135-t4/` (#12), `round136-t4/` (#13),
  `round137-t4/` (#14) — file
  `preview-b-f3-flip-webkit-t4-attempt1.json` trong mỗi thư mục.
- File histogram của T4: `t4-histogram-with9.txt`,
  `t4-histogram-with10.txt`, `t4-histogram-with12.py`,
  `t4-histogram-with13.py`, `t4-histogram-with14.py/.txt`
  trong các thư mục round tương ứng.
