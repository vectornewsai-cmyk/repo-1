# PHASE9 — Đợt 177, T1: Verify đợt 176 (lượt cron 15:35 +07 23/11/2026)

**Verdict: PASS — mọi số quyết parent đợt 176 (§12.3 (q)/(r) + §12.4) đều KHỚP
từng số khi tái kiểm độc lập; 0 file thiếu; chuỗi khớp nối dài lần thứ 75.**

Phạm vi nhiệm vụ T1-177 (theo task giao): tái kiểm độc lập các số đếm của đợt 176
— KHÔNG chạy lại suite 28 mục, KHÔNG xác minh lại O8/lượt yên (đã do T1-176 /
T10-176 làm và không nằm trong các số quyết (q) cần tái kiểm). Script dedup viết
mới hoàn toàn (`recount-177-t1.py`), không dùng script mang nhãn parent
(`round176-parent/count-verify-*-parent.py` — KHÔNG PHẢI của parent) và không
dùng `count-final-176-t10.py` / `recount-176-t1.py`.

## §1. Đếm: KHỚP lần thứ 75 liên tiếp

- Script `recount-177-t1.py` (VIẾT MỚI, `hidden_files/round177-t1/`): quét
  **1.296 file** `phase9-round*.txt` (round 1–176, đủ 176 round, sắp xếp theo số
  round tăng dần — bài học F-173-T1-3). Purity 0 cảnh báo: 0 entry rỗng/newline/
  trùng trong file, 0 file thiếu NUL cuối. 15 file không khớp mẫu trong
  `paths-loop/` (chunk-*/merged-*/push-*/test-one-large.txt + `.closing.tmp`
  0 byte từ 08/11) — đúng là không phải batch round, loại khỏi đếm.
- **Đợt 176 = 10 batch / 15 entry / 15 đường dẫn khác nhau / 13 file mới** —
  KHỚP quyết parent (q). Gồm 10 file: closing 2, t0/t1/t2/t6/t7/t8/t9 mỗi file 1,
  t4 4, t5 2 (tổng 15 — khớp footer Batch stage aggregate 176). Batch T7 gộp muộn
  (`phase9-round176-t7-scheduler.txt`, 1 entry) ĐÃ CÓ trên đĩa và đã tính trong
  số trên — không còn là "dự báo".
- **Lũy kế 111–176 = 648/1.135/985/807** — KHỚP (q).
- **Chờ push 166–176 = 110/156/146/143** — KHỚP (q)/(r).
- **Tái kiểm 111–175 = 638/1.120/972/794** — KHỚP (q); 111–174 =
  628/1.106/959/781; 111–173 = 618/1.092/946/768 — KHỚP các số parent đã kiểm
  đợt 176 (ghi chú nguồn gốc §12.3).
- **Tổng 1–176 = 1.296 batch / 7.005 entry / 3.790 đường dẫn duy nhất /
  3.790 file mới** — KHỚP §12.4.
- **0 file thiếu trên đĩa** (kiểm trực tiếp 3.790 đường dẫn duy nhất, chuẩn hóa
  tương đối theo repo `~/workspace/repo-1`).
- 2/15 đường dẫn đợt 176 KHÔNG phải file mới (đã xuất hiện ở round trước):
  `PHASE9_GAP_ANALYSIS.md` (cập nhật mỗi đợt) và
  `apps/web/scripts/vcut-webkit-postboot-check.sh` (T5-176 sửa theo F-175-T5-3)
  — giải thích đúng 15 − 13 = 2, không phải lệch đếm.
- Kiểm chéo lần 2 (`crosscheck-177-t1.sh`, shell union-trừ qua `tr/sort -u/comm`,
  lọc round bằng sed/awk theo số): **KHỚP từng số** với phương pháp python —
  đợt 176 10/15/15/13; 111–176 648/1.135/985/807; 166–176 110/156/146/143;
  111–175 638/1.120/972/794; 111–174 628/1.106/959/781; 111–173 618/1.092/946/768;
  tổng 1–176 1.296/7.005/3.790. Log `crosscheck-177-t1.log` (KHỚP TỪNG SỐ).

## §2. Cờ đợt 176 — 10/10 có nội dung

- 9 cờ luồng (t0/t1/t2/t4/t5/t6/t7/t8/t9) + cờ closing T10 đều có mặt, đều có nội
  dung (1.170–3.125 B). Riêng cờ T7 gộp muộn kiểm lại trực tiếp: `round176-t7.done`
  **3.125 B** — KHỚP §12.4; LIMITS T7 `docs/PHASE9_ROUND176_T7_SCHEDULER_LIMITS.md`
  **37.325 B** — KHỚP §12.4, dưới giới hạn push 37.768 B.
- Lúc quét (08:42:52Z) chưa có file `phase9-round177-*.txt` nào được stage — số
  đếm trên là ảnh chụp đúng trạng thái cuối đợt 176, không lẫn đợt 177.

## §3. Lệch ghi nhận (trung thực, không làm tròn cho khớp)

- **F-177-T1-1 (prose, cùng họ F-176-T1-2):** aggregate 176 §10.3 dòng 116 vẫn
  ghi "quét 1.294 file" — đếm trực tiếp lúc T1-177 quét là **1.296 file**.
  Parent đã ghi nhận trong (q): lúc T10 đóng sổ là 1.295, sau gộp muộn T7 là
  1.296. Lệch prose 2, không ảnh hưởng số quyết.
- **F-177-T1-2 (prose, MỚI):** aggregate 176 §10.3 dòng 123 vẫn ghi tổng cũ
  trước gộp muộn — "**1.295 batch / 7.004 entry / 3.789 đường dẫn duy nhất**".
  Sau gộp muộn batch T7, tổng đúng là **1.296/7.005/3.790** (đã sửa đúng trong
  §12.3 (q) + §12.4, nhưng §10.3 chưa sửa theo). Lệch prose đúng 1 batch /
  1 entry / 1 đường dẫn — đúng bằng batch T7 (1 entry, 1 file mới
  `docs/PHASE9_ROUND176_T7_SCHEDULER_LIMITS.md`). Không ảnh hưởng số quyết;
  đề nghị T10-177 sửa §10.3 cho khớp §12.4 khi đóng sổ đợt 177.
- **F-177-T1-3 (ghi chú phương pháp, không phải lệch dữ liệu):** lần chạy đầu
  của `crosscheck-177-t1.sh`, hàm đếm batch dùng awk `$3` trên tên file
  (`phase9-round176-closing.txt` → $3 = "closing") nên báo batch=0 cho mọi
  khoảng — trong khi entry/unique/new đã khớp ngay lần đầu. Lỗi do chính T1-177
  viết sai parser, đã sửa (sed trích số round) và chạy lại toàn bộ: KHỚP từng
  số. Việc đối chiếu hai phương pháp đã bắt được lỗi này trước khi kết luận.
- **Ghi chú:** chênh 1.294 (script T10 quét) vs 1.295 (đếm trực tiếp lúc T10
  đóng sổ) mà parent đã nêu trong (q) vẫn chưa giải thích được ngược — nhưng
  trạng thái đĩa hiện tại tự nhất quán hoàn toàn (1.296 file = 1.296 batch,
  đủ round 1–176, mọi số khớp quyết), nên không còn ảnh hưởng.
- `.closing.tmp` (0 byte, 08/11) trong `paths-loop/` là file tạm cũ, không phải
  batch — không đếm, không xóa (ngoài phạm vi T1).

## §4. Đối chiếu phụ (đã kiểm, không lệch)

- LIMITS T9-176 **46.293 B — VƯỢT giới hạn push 37.768 B** (đã ghi trong quyết
  (p); lúc push cần `ENABLE_PRIVSEP=0`); LIMITS T8-176 **37.767 B** — chỉ 1 byte
  dưới giới hạn (đã ghi trong quyết (p)). Cả hai số đều khớp aggregate 176.
- Số slot HB/DR trong §12.3 (o) (44/447, 51/296 là SỐ THIẾU lũy kế) đã được
  parent đính chính đúng trong §12.4; T1-177 không tái kiểm số này (ngoài phạm
  vi đếm paths) — chỉ ghi nhận đính chính đã có trong aggregate.

## §5. Kết luận

- **PASS.** Mọi số quyết parent đợt 176 về đếm batch/entry/đường dẫn/file mới
  đều đứng vững khi tái kiểm độc lập bằng hai phương pháp khác nhau; 0 file
  thiếu; batch T7 gộp muộn đã có mặt đầy đủ trên đĩa (cờ + LIMITS + paths).
- Chuỗi "đếm khớp" nối dài: **lần thứ 75 liên tiếp** (74 lần trước đó theo quyết
  (q) đợt 176 + lần này).
- Không có đính chính nào làm đổi verdict CHẤP NHẬN đợt 176 hay chuỗi WebKit
  FULL PASS 26. Hai lệch prose (F-177-T1-1, F-177-T1-2) chỉ nằm trong §10.3
  aggregate, không nằm trong §12.3/§12.4 đã quyết.
- Nợ mở sang T10-177: sửa §10.3 aggregate 176 (dòng 116: 1.294 → 1.296;
  dòng 123: 1.295/7.004/3.789 → 1.296/7.005/3.790) khi đóng sổ đợt 177 —
  nếu parent đồng ý sửa prose sau quyết.
