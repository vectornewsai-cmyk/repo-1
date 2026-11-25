# PHASE9 — Đợt 179, T1: Verify đợt 178 (lượt cron 00:35 +07 24/11/2026)

**Verdict: PASS — mọi số quyết parent đợt 178 (§12.3 (q)/(r)) đều KHỚP từng số
khi tái kiểm độc lập bằng hai phương pháp; 0 file thiếu; chuỗi khớp nối dài
lần thứ 78.**

Phạm vi nhiệm vụ T1-179 (theo task giao): tái kiểm độc lập các số đếm của đợt
178 — KHÔNG chạy lại suite 28 mục, KHÔNG xác minh lại O8/lượt yên (đã do
T1-178 / T10-178 làm và không nằm trong các số quyết (q) cần tái kiểm).
Script dedup viết mới hoàn toàn (`recount-179-t1.py`), không dùng script cũ
(`recount-178-t1.py`, `count-final-178-t10.py`) và không dùng bất kỳ script
nào mang nhãn parent (`round178-parent/count-verify-178-parent.py` — KHÔNG
PHẢI của parent).

## §1. Đếm: KHỚP lần thứ 78 liên tiếp

- Script `recount-179-t1.py` (VIẾT MỚI, `hidden_files/round179-t1/`): quét
  **1.316 file** `phase9-round*.txt` (round 1–178, đủ 178 round, sắp xếp theo
  số round tăng dần — bài học F-173-T1-3). Purity 0 cảnh báo: 0 entry rỗng/
  newline/trùng trong file, 0 file thiếu NUL cuối, 0 entry không giải mã
  được. 15 file không khớp mẫu trong `paths-loop/` (8 chunk-*, 3 merged-*,
  2 push-106-110-chunk*, `phase10-electron.txt`, `test-one-large.txt`) —
  đúng là không phải batch round, loại khỏi đếm. (`.closing.tmp` 0 byte từ
  08/11 không còn xuất hiện trong `ls` thường — file ẩn, không phải batch,
  không đếm.)
- **Đợt 178 = 10 batch / 16 entry / 16 đường dẫn khác nhau / 14 file mới** —
  KHỚP quyết parent (q). Gồm 10 file: closing 2, t0/t1/t2/t5/t6/t7/t9 mỗi
  file 1, t4 4, t8 2 (tổng 16 — khớp footer Batch stage aggregate 178).
- **Lũy kế 111–178 = 668/1.165/1.012/834** — KHỚP (q).
- **Chờ push 166–178 = 130/186/173/170** — KHỚP (q)/(r).
- **Tái kiểm 111–177 = 658/1.149/998/820** — KHỚP (q); 111–176 =
  648/1.135/985/807; 111–175 = 638/1.120/972/794; 111–174 =
  628/1.106/959/781 — KHỚP các số parent đã kiểm đợt 178 (ghi chú nguồn
  gốc §12.3).
- **Tổng 1–178 = 1.316 batch / 7.035 entry / 3.817 đường dẫn duy nhất /
  3.817 file mới** — KHỚP §10.3/§12.3 (q).
- **0 file thiếu trên đĩa** (kiểm trực tiếp 3.817 đường dẫn duy nhất, chuẩn
  hóa tương đối theo repo `~/workspace/repo-1`).
- 2/16 đường dẫn đợt 178 KHÔNG phải file mới: `PHASE9_GAP_ANALYSIS.md`
  (cập nhật mỗi đợt) + `docs/PHASE9_ROUND176_LIMITS.md` (T1-178 sửa prose
  §10.3 — đã có từ round 176) — giải thích đúng 16 − 14 = 2, không phải
  lệch đếm. Closing 2 entry: aggregate 178 (mới) + GAP (đã có).
- Kiểm chéo lần 2 (`crosscheck-179-t1.sh`, shell union-trừ qua `tr/sort
  -u/comm`, lọc round bằng sed theo số): **KHỚP từng số** với phương pháp
  python — đợt 178 10/16/16/14; 111–178 668/1.165/1.012/834; 166–178
  130/186/173/170; 111–177 658/1.149/998/820; 111–176 648/1.135/985/807;
  111–175 638/1.120/972/794; 111–174 628/1.106/959/781; tổng 1–178
  1.316/7.035/3.817. Log `crosscheck-179-t1.log` (KHỚP TỪNG SỐ).
- Ghi chú phương pháp: lần chạy đầu của crosscheck v1 có bug ghi đè
  (nhiều file batch cùng round dùng `>` vào cùng file tạm — bài học mới,
  xem §4 F-179-T1-3); lần chạy v2 dùng `>>` + đếm entry thô trước
  `sort -u` mới khớp. Việc đối chiếu hai phương pháp đã bắt được bug này
  trước khi kết luận (cùng họ F-177-T1-3).
- Snapshot: lúc quét (17:41Z) chưa có file `phase9-round179-*.txt` nào
  được stage — số đếm trên là ảnh chụp đúng trạng thái cuối đợt 178,
  không lẫn đợt 179.

## §2. Cờ đợt 178 — 8/9 có nội dung, T8 VẮNG CỜ (xác minh lại từ đĩa)

- 8 cờ luồng có mặt, đều có nội dung, kích thước KHỚP §10.1 aggregate
  178 từng byte: t0 734 B (12:02Z), t1 798 B (11:45Z), t2 1.365 B
  (13:31Z), t4 680 B (13:29Z), t5 1.209 B (12:04Z), t6 879 B (11:57Z),
  t7 1.452 B (14:14Z), t9 1.497 B (14:06Z). Nội dung đầu cờ khớp mô tả:
  T0 "#92 XÁC NHẬN 9 nguồn", T1 "verify đợt 177 — PASS, đếm khớp lần
  thứ 76", T2 "(m) #91 ÂM + (m) #92 ÂM", T4 "lượt yên WebKit #47: CÓ
  lượt hợp lệ", T5 "POSTBOOT_PASS #92", T6 lockhealth, T7 scheduler,
  T9 headroom 0.
- **T8 VẮNG CỜ — xác nhận lại:** không có file `round178-t8.done` trên
  đĩa (kiểm 2 lần). Nội dung T8 vẫn đầy đủ trên đĩa qua late merge:
  LIMITS T8 45.247 B + script hb128 `clicktest-86n2-webkit-w7-hb128.mjs`
  41.196 B, md5 `1e3a16124cea6a06a3dd659c350ed2e2` — KHỚP §10.1; paths
  file T8 (`phase9-round178-t8-viteharness.txt`, T10 tự tạo 14:40:49Z)
  2 entry đúng như §10.1/§10.3.
- Cờ closing T10 `round178-t10.done` 2.100 B (14:47Z) có mặt.
- **Chuỗi 9/9 cờ có nội dung ĐỨT tại đợt 178 — xác nhận:** giữ trọn vẹn
  25 lần (152–177) DỪNG; chuỗi mới tính lại từ đợt 179 nếu đủ 9/9.

## §3. Kích thước LIMITS đợt 178 — KHỚP §10/§12.3

- T8 **45.247 B — VƯỢT giới hạn push 37.768 B** (đã trim từ 47.735 B;
  KHỚP quyết (p)); T2 **37.751 B**, T4 **37.679 B**, T6 **37.680 B**,
  T7 **37.716 B** — cả bốn sát giới hạn, KHỚP (p). T0 12.767 B, T1
  7.378 B, T5 36.050 B, T9 32.328 B — dưới giới hạn.
- Aggregate 178 `docs/PHASE9_ROUND178_LIMITS.md` = **63.713 B — VƯỢT
  giới hạn push** (sau §12.3; KHỚP (r)); lúc push cần `ENABLE_PRIVSEP=0`.
  Chỉ ghi nhận, KHÔNG push (luật cứng).

## §4. Lệch ghi nhận (trung thực, không làm tròn cho khớp)

- **F-179-T1-1 (prose §10.3 aggregate 178, KHÔNG ảnh hưởng số quyết):**
  §10.3 ghi script T10 "quét 1.315 file" nhưng tổng batch ngay sau đó là
  1.316 và đếm trực tiếp lúc T1-179 quét là **1.316 file = 1.316 batch**
  (đủ round 1–178, tự nhất quán). Lệch prose đúng 1 file — có thể T10
  quét trước khi file closing (14:47:14Z) hoặc file T8 (14:40:49Z) kịp
  có mặt, rồi cộng batch closing riêng. Mọi số quyết (q) vẫn khớp.
  Đề nghị T10-179 sửa "1.315" → "1.316" trong §10.3 khi đóng sổ đợt 179
  (nếu parent đồng ý sửa prose sau quyết — theo tiền lệ F-177-T1-1/
  F-177-T1-2 đã sửa ở đợt 178). T1-179 KHÔNG tự sửa aggregate 178 vì
  §12.3 đã quyết xong.
- **F-179-T1-2 (prose §10.3 aggregate 178, KHÔNG ảnh hưởng số quyết):**
  §10.3 ghi `PHASE9_GAP_ANALYSIS.md` "xuất hiện lần đầu ở round 100" —
  kiểm trực tiếp: lần đầu là **`phase9-round59-p10-docs.txt` (round 59)**,
  và GAP có mặt trong 108 file paths (closing các đợt 100–104 trở đi là
  những lần xuất hiện muộn, không phải lần đầu). Lệch chi tiết nguồn
  gốc; giải thích 16 − 14 = 2 vẫn đứng (GAP không phải file mới ở đợt
  178 dù lần đầu là 59 hay 100). Đề nghị sửa "round 100" → "round 59"
  cùng lúc với F-179-T1-1.
- **F-179-T1-3 (ghi chú phương pháp, không phải lệch dữ liệu):** lần chạy
  đầu của `crosscheck-179-t1.sh` dùng `>` ghi file tạm theo round nên
  nhiều file batch cùng round ghi đè nhau (chỉ còn file cuối) — báo sai
  batch/entry/unique (vd: đợt 178 chỉ còn 1/1/1/1). Lỗi do chính T1-179
  viết sai script, đã sửa (`>>` + đếm entry thô trước `sort -u`) và chạy
  lại toàn bộ: KHỚP từng số với python. Ghi lại để các T sau tránh lặp.

## §5. Đối chiếu phụ (đã kiểm, không lệch)

- Số slot HB/DR trong §12.3 (o) (44/459, 51/302 là SỐ SLOT THIẾU lũy kế)
  T1-179 không tái kiểm (ngoài phạm vi đếm paths) — chỉ ghi nhận.
- `.closing.tmp` (0 byte, 08/11) là file tạm cũ, không phải batch —
  không đếm, không xóa (ngoài phạm vi T1).

## §6. Kết luận

- **PASS.** Mọi số quyết parent đợt 178 về đếm batch/entry/đường dẫn/file
  mới đều đứng vững khi tái kiểm độc lập bằng hai phương pháp khác nhau; 0
  file thiếu; cờ 8/9 có nội dung (T8 vắng cờ, nội dung đã xác minh trên
  đĩa qua late merge); kích thước LIMITS khớp §12.3 (p)/(r).
- Chuỗi "đếm khớp" nối dài: **lần thứ 78 liên tiếp** (77 lần trước đó theo
  quyết (q) đợt 178 — gồm lần kiểm độc lập của parent trong lượt đóng sổ
  — + lần này).
- Không có đính chính nào làm đổi verdict CHẤP NHẬN đợt 178 hay các quyết
  (a)–(r). Hai lệch prose (F-179-T1-1, F-179-T1-2) chỉ nằm trong §10.3
  aggregate, không nằm trong §12.3 đã quyết — giao T10-179 sửa nếu parent
  đồng ý.
- Nợ mở sang T10-179: sửa §10.3 aggregate 178 ("quét 1.315 file" →
  "1.316 file"; GAP "lần đầu ở round 100" → "round 59") khi đóng sổ đợt
  179 — nếu parent đồng ý sửa prose sau quyết.
