# PHASE9 — Đợt 181, T1: Verify đợt 180 (lượt cron 06:35 +07 24/11/2026)

**Verdict: PASS — mọi số quyết parent đợt 180 (§12.3 (q)) đều KHỚP từng số
khi tái kiểm độc lập bằng hai phương pháp; 0 file thiếu; chuỗi khớp nối dài
lần thứ 82.**

Phạm vi nhiệm vụ T1-181 (theo task giao): tái kiểm độc lập các số đếm của đợt
180 — KHÔNG chạy lại suite 28 mục, KHÔNG xác minh lại O8/lượt yên (không nằm
trong các số quyết (q) cần tái kiểm). Script dedup viết mới hoàn toàn
(`recount-181-t1.py`), không dùng script cũ (`recount-180-t1.py`,
`count-final-180-t10.py`) và không dùng bất kỳ script nào mang nhãn parent.
Ghi nhận 1 lệch prose mới (F-181-T1-1) — KHÔNG tự sửa aggregate, giao parent
quyết — xem §4.

## §1. Đếm: KHỚP lần thứ 82 liên tiếp

- Script `recount-181-t1.py` (VIẾT MỚI, `hidden_files/round181-t1/`): quét
  **1.336 file** `phase9-round*.txt` (round 1–180, đủ 180 round, sắp xếp theo
  số round tăng dần — bài học F-173-T1-3). Purity 0 cảnh báo: 0 entry rỗng/
  newline/trùng trong file, 0 file thiếu NUL cuối, 0 entry không giải mã
  được. Chỉ đếm round ≤180 theo số trong tên file — lúc quét (23:55Z) chưa
  có file `phase9-round181-*.txt` nào được stage, và file đợt 181 stage
  sau đó cũng không lọt vào đếm. **Chuẩn hóa đường dẫn tuyệt đối:** paths
  T2-180 ghi đường dẫn tuyệt đối (`/home/hatch/workspace/repo-1/docs/...`)
  — cùng mẫu T2-176/177/178/179/180; script cắt tiền tố về tương đối trước
  khi dedup.
- **Đợt 180 = 10 batch / 16 entry / 16 đường dẫn khác nhau / 14 file mới** —
  KHỚP quyết parent (q). Trước closing: 9/14/14/13 — KHỚP §10.3 aggregate
  180 (closing +1 batch, +2 entry, +2 đường dẫn, +1 file mới).
- **Lũy kế 111–180 = 688/1.196/1.040/862** — KHỚP (q).
- **Chờ push 166–180 = 150/217/201/198** — KHỚP (q)/(r).
- **Tái kiểm 111–179 = 678/1.180/1.026/848** — KHỚP (q);
  **111–178 = 668/1.165/1.012/834** — KHỚP;
  **111–177 = 658/1.149/998/820** — KHỚP;
  **111–176 = 648/1.135/985/807** — KHỚP;
  **111–175 = 638/1.120/972/794** — KHỚP các số parent đã kiểm đợt 180.
- **Tổng 1–180 = 1.336 batch / 7.066 entry / 3.845 đường dẫn duy nhất /
  3.845 file mới** — KHỚP §10.3/§12.3 (q). Tổng 1–179 = 1.326/7.050/3.831
  — KHỚP quyết (q) đợt 179.
- **0 file thiếu trên đĩa** (kiểm trực tiếp 3.845 đường dẫn duy nhất, chuẩn
  hóa tương đối theo repo `~/workspace/repo-1`).
- 2/16 đường dẫn đợt 180 KHÔNG phải file mới: `PHASE9_GAP_ANALYSIS.md`
  (lần đầu round 59) + `docs/PHASE9_ROUND178_LIMITS.md` (lần đầu round
  178, T1-180 sửa prose đợt này) — KHỚP §10.3, giải thích đúng 16 − 14 = 2.
  File mới đợt 180 (13 trước closing + aggregate): 9 LIMITS + 4 script T4
  (`poll-wait-t4-180.sh`, `run-attempt-180.sh`, `run-analyzers-180.sh`,
  `distinct-seq-180.py`) + aggregate 180.
- Kiểm chéo lần 2 (`crosscheck-181-t1.sh`, shell union-trừ qua `tr/sort
  -u/comm`, lọc round bằng số trong tên file, bao gồm file `*-closing.txt`
  MỘT LẦN đúng quy ước đứng): **KHỚP từng số** với phương pháp python —
  đợt 180 10/16/16/14; trước closing 9/14/14/13; 111–180 688/1.196/1.040/
  862; 166–180 150/217/201/198; 111–179 678/1.180/1.026/848; 111–178
  668/1.165/1.012/834; 111–177 658/1.149/998/820; 111–176 648/1.135/985/
  807; 111–175 638/1.120/972/794; tổng 1–180 1.336/7.066/3.845; tổng 1–179
  1.326/7.050/3.831; GAP lần đầu round 59; 0 thiếu. Log
  `crosscheck-181-t1.log` (KHỚP TỪNG SỐ).

## §2. Cờ đợt 180 — 9/9 có nội dung (xác minh lại từ đĩa)

- 9 cờ luồng có mặt, đều có nội dung, kích thước KHỚP §10.1 aggregate 180
  từng byte: t0 954 B (21:18Z), t1 1.111 B (21:03Z), t2 583 B (21:30Z),
  t4 1.010 B (21:29Z), t5 663 B (21:05Z), t6 827 B (21:19Z), t7 1.108 B
  (23:34:50Z), t8 1.057 B (22:55Z), t9 895 B (22:58Z). 8/9 trong hạn cờ
  ~23:00Z; T7 trễ ~34' nhưng trong hạn cứng ~23:35Z (chỉ dư ~10 s) — theo
  tiền lệ vẫn tính có nội dung.
- Cờ closing T10 `round180-t10.done` 1.134 B (23:48Z) có mặt, có nội dung
  (§12.3 TRỐNG cho parent viết — KHÔNG điền sẵn).
- **Chuỗi 9/9 cờ có nội dung = 2 — xác nhận** (đợt 179 = 1, đợt 180 = 2;
  parent đã quyết TÍNH TIẾP ở (q) đợt 180).

## §3. Kích thước LIMITS đợt 180 — KHỚP §12.3 (p)

- **0/9 file LIMITS đợt 180 VƯỢT giới hạn push 37.768 B** — KHỚP (p):
  T6 37.747 B (chỉ dư 21 B, sát nhất), T7 37.667 B, T8 37.197 B, T4
  36.551 B, T5 34.463 B, T9 33.703 B, T2 29.938 B, T0 12.407 B, T1 8.838 B.
- Aggregate 180 `docs/PHASE9_ROUND180_LIMITS.md` = **54.100 B — VƯỢT giới
  hạn push** (sau §12.3; lúc push cần `ENABLE_PRIVSEP=0`). Đối chiếu với
  số T10 ghi trước §12.3 (48.628 B): tăng 5.472 B; khối §12.3 đo được
  5.523 B (gồm dòng tiêu đề 55 B đã có sẵn trước khi parent viết) →
  48.628 + 5.523 − 55 = 54.096, chênh **4 B** so với thực tế — số 48.628
  không còn trong file/cờ T10 nên không truy được điểm đo gốc; chênh lệch
  ở mức dòng trống/newline lúc ghi, ghi nhận, KHÔNG phải lệch số đếm.
  Chỉ ghi nhận, KHÔNG push (luật cứng).

## §4. Lệch prose mới — F-181-T1-1 (ghi nhận, KHÔNG tự sửa, giao parent quyết)

- **F-181-T1-1:** aggregate 180 §10.3 dòng 113 ghi "quét **1.335** file
  `phase9-round*.txt` (round 1–180, sau closing)" — **SAI, đúng là 1.336
  file.** Bằng chứng: đếm trực tiếp `ls phase9-round*.txt | wc -l` =
  1.336; script dedup viết mới đợt này quét 1.336 file; output postclosing
  của chính T10-180 ghi `TOTAL 1-180: (1336, 7066, 3845)`; cùng §10.3
  dòng 119 và quyết (q) đều ghi đúng 1.336 batch. Nguồn gốc sai: output
  preclosing của T10-180 ghi `TOTAL 1-180: (1335, 7064, 3844)` — số 1.335
  là số file TRƯỚC closing, lọt vào prose sau closing. Cùng mẫu
  F-179-T1-1 ("quét 1.315 file" → 1.316, đã sửa ở đợt 180).
- Cách sửa đề xuất (chờ parent duyệt): dòng 113 "quét 1.335 file" →
  "quét 1.336 file" — CHỈ sửa prose, KHÔNG đổi bất kỳ số đếm hay verdict
  nào đã quyết. Theo tiền lệ T1-180 sửa aggregate 178, nếu parent duyệt
  thì T1-182 sửa + stage batch đợt 182. T1-181 **không sửa, không stage
  aggregate 180** trong đợt này (paths file đợt này chỉ có 1 entry là
  LIMITS này).
- Kiểm thêm: không còn lệch prose nào khác trong §10.3/§10.4/footer của
  aggregate 180 và GAP §109 — mọi số đếm khác đã đối chiếu từng số, xem §5.

## §5. Đối chiếu phụ (đã kiểm, không lệch)

- Paths file đợt 180 (10 file): entry từng file 1/2/1/5/1/1/1/1/1/2 = 16
  — khớp footer §10.4; closing 2 entry = aggregate 180 (mới) + GAP (đã
  có) — khớp §10.4; T4 5 entry (LIMITS + 4 script lượt yên) — khớp §10.3;
  T1 2 entry (LIMITS + aggregate 178 đã sửa prose) — khớp §2 aggregate 180.
- GAP §109 có mặt (`PHASE9_GAP_ANALYSIS.md` dòng 2325); mọi số đếm trong
  §109 khớp từng số với quyết (q) đợt 180.
- Aggregate 178 sau sửa prose = **63.712 B** — KHỚP T1-180 (F-179-T1-1/
  F-179-T1-2 ĐÃ XONG, quyết (p) đợt 180).
- Aggregate 179 = **50.375 B** — KHỚP §2 aggregate 180 ("sau đính chính
  của parent").
- Số slot HB/DR trong §12.3 (o) T1-181 không tái kiểm (ngoài phạm vi đếm
  paths) — chỉ ghi nhận.
- Không có file `phase9-round181-*.txt` nào lúc quét (23:55Z) — ảnh chụp
  đúng trạng thái cuối đợt 180, không lẫn đợt 181.

## §6. Kết luận

- **PASS.** Mọi số quyết parent đợt 180 về đếm batch/entry/đường dẫn/file
  mới đều đứng vững khi tái kiểm độc lập bằng hai phương pháp khác nhau; 0
  file thiếu; cờ 9/9 có nội dung (chuỗi 9/9 = 2); kích thước LIMITS khớp
  §12.3 (p); GAP §109 có mặt; closing đủ 2 entry.
- Chuỗi "đếm khớp" nối dài: **lần thứ 82 liên tiếp** (81 lần trước đó theo
  quyết (q) đợt 180 — gồm lần kiểm độc lập của parent trong lượt đóng sổ —
  + lần này).
- 1 lệch prose mới F-181-T1-1 ("quét 1.335 file" → 1.336) — ghi nhận, giao
  parent quyết, không tự sửa. Không có đính chính nào làm đổi verdict
  CHẤP NHẬN đợt 180 hay các quyết (a)–(r).
- Nợ mở sang T10-181: F-181-T1-1 (chờ parent quyết có sửa prose aggregate
  180 §10.3 không; nếu duyệt, T1-182 sửa + stage batch đợt 182 theo tiền
  lệ T1-180).
