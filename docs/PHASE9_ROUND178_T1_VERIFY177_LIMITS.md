# PHASE9 — Đợt 178, T1: Verify đợt 177 (lượt cron 18:35 +07 23/11/2026)

**Verdict: PASS — mọi số quyết parent đợt 177 (§12.3 (q)/(r)) đều KHỚP từng số
khi tái kiểm độc lập bằng hai phương pháp; 0 file thiếu; chuỗi khớp nối dài
lần thứ 76.**

Phạm vi nhiệm vụ T1-178 (theo task giao): tái kiểm độc lập các số đếm của đợt
177 — KHÔNG chạy lại suite 28 mục, KHÔNG xác minh lại O8/lượt yên (đã do
T1-177 / T10-177 làm và không nằm trong các số quyết (q) cần tái kiểm).
Đồng thời sửa prose §10.3 aggregate 176 theo F-177-T1-1/F-177-T1-2 và ghi
nhận aggregate 177 vượt giới hạn push.

## §1. Đếm: KHỚP lần thứ 76 liên tiếp

- Script `recount-178-t1.py` (VIẾT MỚI, `hidden_files/round178-t1/`): quét
  **1.306 file** `phase9-round*.txt` (round 1–177, đủ 177 round, sắp xếp theo
  số round tăng dần — bài học F-173-T1-3). Purity 0 cảnh báo: 0 entry rỗng/
  newline/trùng trong file, 0 file thiếu NUL cuối, 0 entry không giải mã
  được. 16 file không khớp mẫu trong `paths-loop/` (8 chunk-*, 3 merged-*,
  2 push-106-110-chunk*, `phase10-electron.txt`, `test-one-large.txt` +
  `.closing.tmp` 0 byte từ 08/11) — đúng là không phải batch round, loại
  khỏi đếm.
- **Đợt 177 = 10 batch / 14 entry / 14 đường dẫn khác nhau / 13 file mới** —
  KHỚP quyết parent (q). Gồm 10 file: closing 2, t0/t1/t2/t5/t6/t7/t8/t9 mỗi
  file 1, t4 4 (tổng 14 — khớp footer Batch stage aggregate 177).
- **Lũy kế 111–177 = 658/1.149/998/820** — KHỚP (q).
- **Chờ push 166–177 = 120/170/159/156** — KHỚP (q)/(r).
- **Tái kiểm 111–176 = 648/1.135/985/807** — KHỚP (q); 111–175 =
  638/1.120/972/794; 111–174 = 628/1.106/959/781 — KHỚP các số parent đã
  kiểm đợt 177 (ghi chú nguồn gốc §12.3).
- **Tổng 1–177 = 1.306 batch / 7.019 entry / 3.803 đường dẫn duy nhất /
  3.803 file mới** — KHỚP §12.3 (q).
- **0 file thiếu trên đĩa** (kiểm trực tiếp 3.803 đường dẫn duy nhất, chuẩn
  hóa tương đối theo repo `~/workspace/repo-1`).
- 1/14 đường dẫn đợt 177 KHÔNG phải file mới: `PHASE9_GAP_ANALYSIS.md`
  (xuất hiện lần đầu ở round 100, cập nhật mỗi đợt) — giải thích đúng
  14 − 13 = 1, không phải lệch đếm. Closing 2 entry: aggregate 177 (mới)
  + GAP (đã có).
- Kiểm chéo lần 2 (`crosscheck-178-t1.sh`, shell union-trừ qua `tr/sort
  -u/comm`, lọc round bằng sed theo số — tránh lỗi awk `$3` ở F-177-T1-3):
  **KHỚP từng số** với phương pháp python — đợt 177 10/14/14/13;
  111–177 658/1.149/998/820; 166–177 120/170/159/156; 111–176
  648/1.135/985/807; 111–175 638/1.120/972/794; 111–174 628/1.106/959/781;
  tổng 1–177 1.306/7.019/3.803. Log `crosscheck-178-t1.log` (KHỚP TỪNG SỐ).

## §2. Phương pháp — độc lập, không dùng script cũ hay script nhãn parent

- `recount-178-t1.py` viết mới hoàn toàn cho đợt này; KHÔNG dùng
  `recount-177-t1.py`, `count-final-177-t10.py`, và KHÔNG dùng bất kỳ script
  nào mang nhãn parent (`round177-parent/count-verify-177-parent.py` —
  KHÔNG PHẢI của parent).
- Chuẩn hóa đường dẫn tuyệt đối: paths T2-177 ghi dạng tuyệt đối
  (`/home/hatch/workspace/repo-1/docs/...`, cùng mẫu T2-176) — script cắt
  tiền tố `/home/hatch/workspace/repo-1/` về dạng tương đối trước khi dedup;
  T1-177 đã dung nạp được, không làm lệch số đếm.
- Snapshot: danh sách file chụp một lần lúc bắt đầu quét (11:37Z); lúc quét
  chưa có file `phase9-round178-*.txt` nào được stage — số đếm trên là ảnh
  chụp đúng trạng thái cuối đợt 177, không lẫn đợt 178.

## §3. Sửa prose §10.3 aggregate 176 — F-177-T1-1 / F-177-T1-2 ĐÃ SỬA XONG

- **F-177-T1-1:** dòng 116 "quét 1.294 file" → **"quét 1.296 file"** (đã sửa,
  kiểm lại bằng grep — khớp).
- **F-177-T1-2:** dòng 123 "1.295 batch / 7.004 entry / 3.789 đường dẫn duy
  nhất" → **"1.296 batch / 7.005 entry / 3.790 đường dẫn duy nhất"** (đã
  sửa, kiểm lại bằng grep — khớp).
- Chỉ sửa prose hai dòng trên; KHÔNG đổi bất kỳ số đếm nào đã quyết (§12.3
  (q)/(r) + §12.4 aggregate 176 giữ nguyên). Các dòng còn lại của §10.3
  (đợt 176 sau closing 9/14/14/12, lũy kế 647/1.134/984/806, chờ push
  109/155/145/142) mô tả đúng trạng thái đĩa lúc T10-176 đóng sổ, TRƯỚC
  gộp muộn batch T7 — số đúng sau gộp muộn đã có trong §12.4 — nên giữ
  nguyên, không sửa.
- File `docs/PHASE9_ROUND176_LIMITS.md` sau sửa: 48.915 B (không đổi — thay
  thế cùng độ dài). Ghi trong paths đợt này (file text đã đổi).

## §4. Ghi nhận: aggregate 177 VƯỢT giới hạn push

- `docs/PHASE9_ROUND177_LIMITS.md` = **43.398 B — VƯỢT giới hạn push
  37.768 B** (sau khi thêm §12.3; đã xác nhận bằng `wc -c` lúc 11:44Z).
  Lúc push cần `ENABLE_PRIVSEP=0`. Chỉ ghi nhận, KHÔNG push (luật cứng).
- Đối chiếu: aggregate 176 = 48.915 B (đã vượt từ trước, cùng tình trạng).

## §5. Reboot #92 — đếm KHÔNG bị ảnh hưởng

- Boot hiện tại lúc quét: `985bc2a3-f5b0-451f-af26-fac9d89a5419` (đọc lúc
  11:37Z và 11:44Z, khớp boot_id trong task giao — reboot mới #92 ~11:02Z,
  số hiệu chờ T0-178 xác minh 9 nguồn).
- Đếm là đọc file trên đĩa nên reboot không đổi số đếm: quét đủ 177 round,
  1.306 file, purity 0 cảnh báo, **0 file thiếu** — xác minh sau reboot.
  Không có file round 178 nào xuất hiện giữa chừng làm nhiễu snapshot.

## §6. Đối chiếu phụ (đã kiểm, không lệch)

- Cờ đợt 177: 9/9 cờ luồng (t0/t1/t2/t4/t5/t6/t7/t8/t9) + cờ closing T10
  đều có mặt trên đĩa (10 file `.done`) — khớp §10.1 aggregate 177.
- Số slot HB/DR trong §12.3 (o) (44/453, 51/299 là SỐ SLOT THIẾU lũy kế)
  đã được parent đính chính đúng trong §12.4; T1-178 không tái kiểm số này
  (ngoài phạm vi đếm paths) — chỉ ghi nhận đính chính đã có trong aggregate.
- `.closing.tmp` (0 byte, 08/11) vẫn là file tạm cũ, không phải batch —
  không đếm, không xóa (ngoài phạm vi T1).

## §7. Kết luận

- **PASS.** Mọi số quyết parent đợt 177 về đếm batch/entry/đường dẫn/file
  mới đều đứng vững khi tái kiểm độc lập bằng hai phương pháp khác nhau; 0
  file thiếu; batch closing đã có đủ trên đĩa (aggregate + GAP).
- Chuỗi "đếm khớp" nối dài: **lần thứ 76 liên tiếp** (75 lần trước đó theo
  quyết (q) đợt 177 + lần này).
- Không có đính chính nào làm đổi verdict CHẤP NHẬN đợt 177 hay chuỗi
  WebKit FULL PASS 26. Hai lệch prose F-177-T1-1/F-177-T1-2 đã được sửa
  xong trong §10.3 aggregate 176 (§3 trên).
- Nợ mở sang T10-178: không còn nợ đếm nào từ T1. Aggregate 177 vượt giới
  hạn push — lúc push cần ENABLE_PRIVSEP=0.
