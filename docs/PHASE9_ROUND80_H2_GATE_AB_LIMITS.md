# PHASE 9 — ĐỢT 80, LUỒNG H2: Gate re-gate — thêm phiên FN + đối chứng A/B luật cũ live lần đầu

> Đóng nợ đợt 79 §4.2/§8 (G2/F2): (1) chạy ≥10 phiên chuẩn mới, ưu tiên điều
> chỉnh tải để slot1 rơi vào dải cận ngưỡng 1,5–2,5 fps (kiểm chứng độ sắc
> ngưỡng FN 2 fps); (2) chạy đối chứng A/B luật cũ live lần đầu (confirm=0)
> xen kẽ luật mới, cùng điều kiện tải. Luật mới GIẾT ⟺ re-gate FAIL
> (delta < 30) ∧ slot 1 FN (draw < 2 fps), ngưỡng 30/20/2 GIỮ NGUYÊN.
> Harness chuẩn F2 `apps/web/scripts/measure-78f2-gate-harness.mjs` (+ 1 sửa
> nhỏ H2: số vòng burner qua `Y3_BURNER_N`).
> Ngày: 2026-11-10 (UTC 08:38–10:18, +07 15:38–17:18).

## 0. Kết luận (đọc trước)

1. **Đối chứng A/B luật cũ live lần đầu: ĐÃ CHẠY ĐƯỢC — và luật cũ giết
   thật 3/3 phiên.** C2/C3/C4 (confirm=0, xen kẽ, cùng burner với phiên cặp)
   đều bị luật cũ GIẾT ở re-gate (exit 1, `kill-old-rule`), cả 3 đều KHỎE
   (slot1 3,53 / 3,85 / 3,66 fps, không FN) — **FP của luật cũ được quan sát
   trực tiếp lần đầu**, không còn là tính toán lại từ JSON luật mới. Nợ F2 §8
   đã đóng (trừ C1, xem §7).
2. **Cặp A/B ghép đôi sạch:** S2 (burner2, luật mới) được THA vs C2
   (burner2, luật cũ) bị GIẾT — cùng re-gate FAIL; S3 (burner4) THA vs C3
   (burner4) GIẾT. Luật mới tha đúng những phiên luật cũ giết oan, trong
   cùng điều kiện tải.
3. **Luật mới trong đợt H2: bắt FN sớm 0/3 (luật cũ 2/3) — GIẢM, nhưng là
   đánh đổi đã biết và đã chấp nhận ở E2 §1.** Cả 3 phiên FN của H2 (S2, S3,
   S5) đều không bị luật mới giết sớm: S2/S3 vì slot1 không FN, S5 vì
   re-gate PASS 183. FN vẫn được đo ĐẦY ĐỦ (slot 2–3 + resume-probe + đối
   chứng), chỉ mất giết sớm. Đổi lại, luật mới tha 3 phiên (S1, S2, S3) mà
   luật cũ sẽ giết, và FP kiểm duyệt luật mới = 0.
4. **Độ sắc ngưỡng FN 2 fps: VẪN CHƯA kiểm chứng được.** Trong dải 1,5–2,5
   fps chỉ có n=2 (S5 1,50 re-gate PASS; S2 2,30 re-gate FAIL được tha) và
   KHÔNG có ca nào slot1 FN + re-gate FAIL trong H2 (không có lần giết mới
   nào của luật mới). Bằng chứng lật verdict qua 2,0 vẫn chỉ là cặp G2
   (1,97 giết / 2,07 tha) + H2-S2 (2,30 tha).
5. **Ngưỡng GIỮ NGUYÊN 30/20/2.** Delta re-gate phiên FN (n=11, gộp mọi
   đợt): 2, 2, 15, 17, 18, 18, 18, 21, 30, 75, 183; phiên khỏe (n=33):
   min 4 — vẫn CHỒNG LẤN hoàn toàn, không có ngưỡng tách sạch.
6. **Đợt H2 DỞ DANG — bị chặn bởi sóng EPERM ghi file (xem §7).** Chỉ thu
   được **9/14 phiên có JSON** (6 phiên luật mới + 3 đối chứng; thiếu S7,
   S8, S9, S10, C1). Từ ~10:08Z, mọi tiến trình spawn từ exec đều bị từ
   chối ghi file (write → EPERM, kể cả /tmp; file tạo mới được nhưng 0
   byte), Xvfb không lên được socket. Theo đúng lệnh trong body vòng lặp
   ("nếu phiên nền bị từ chối ghi file... báo rõ sự chặn đó và dừng lượt
   chạy đó lại — không cố lách"), đợt đo đã DỪNG ở 10:16Z, không thử đường
   vòng. Số liệu 9 phiên trên là thật và đã kiểm chứng; phần còn thiếu
   (4 phiên mới + 1 đối chứng) để lại cho đợt sau.
7. Gộp E2+F2+G2+H2 (luật mới, 25 phiên): FN 7, bắt FN sớm luật mới 2/7
   (luật cũ 5/7), Wilson 95% luật mới [8%, 64%] — khoảng còn rộng, n quá
   nhỏ để kết luận tỉ lệ bắt thật. FP kiểm duyệt luật mới 0, tha oan 5.

## 1. Thay đổi harness/test (H2) — nhỏ, không động production

- `apps/web/scripts/measure-78f2-gate-harness.mjs`: thêm `Y3_BURNER_N`
  (mặc định 2 như trước, kẹp 1–8) — số vòng busy-loop burner sau gate 1a.
  Mục đích: điều chỉnh tải để slot1 rơi vào dải 1,5–2,5 fps. Khi
  `Y3_BURNER=1` không đặt, hành vi cũ giữ nguyên (2 vòng). `node --check`
  OK, dry-run OK trước phiên đo đầu tiên.
- `apps/web/scripts/test_round77_e2_regate_confirm.test.mjs`: thêm 2 test
  hồi quy H2 (9 phiên đợt 80 + độ sắc ngưỡng FN 2 fps). Tổng test gate:
  **18/18 PASS** (E2 12 + F2 6), chạy lại cuối đợt.
- Analyzer `tools/analyze-80h2.mjs` (kế thừa `analyze-79g2.mjs`, nội bộ
  trong goal workspace): thêm thư mục H2, §1e (riêng H2 luật mới), §1f
  (đối chứng A/B luật cũ live), §1g (gộp E2+F2+G2+H2), §1h (độ sắc ngưỡng
  FN 2 fps — slot1 trong dải 1,5–2,5 fps). `node --check` OK; chạy lại
  cuối đợt không lỗi (output chỉ đọc qua stdout vì ghi file bị EPERM —
  xem §7; toàn bộ số liệu đã đưa vào LIMITS này nên không mất dữ liệu).
- Không sửa production, không sửa `gate-regate-confirm.mjs` (luật giết
  không đổi). Không push/tag.
- Ghi chú (không sửa trong đợt này): dòng log `E2-SECOND-GATE` của harness
  in sai chữ — ở nhánh giết nó luôn ghi "+ slot1 FN (X fps)" dù slot1Fn
  có thể là false (thấy ở C2: slot1 3,53 fps nhưng log ghi "slot1 FN").
  JSON ghi đúng (`slot1Fn: false`, `e2Reason: "kill-old-rule"`). Đây là lỗi
  wording log có từ F2, không ảnh hưởng hành vi hay số liệu; để đợt sau
  sửa (không đổi harness giữa đợt đo).

## 2. Kế hoạch đo (đã chạy — dở dang do bị chặn)

- Phase A (xen kẽ mới/cũ, cùng burnerN mỗi cặp): S1 plain / C1 plain
  (session11), S2 burner2 / C2 burner2 (session12), S3 burner4 / C3 burner4
  (session13), S4 burner3 / C4 burner3 (session14).
- Phase B (luật mới): S5 plain, S6 burner2, S7 burner4, S8 plain, S9
  burner3, S10 burner2 + thử lại C1 cuối cùng.
- Mỗi phiên retry tối đa 6 attempt (chết gate 1a = attempt, không tính là
  phiên chuẩn). Driver lượt 1: `F2_WAIT_TICKS` mặc định 4 (chờ tối đa 2
  phút cho load1 < 3 trước mỗi attempt); từ lượt 3 đổi thành 1 (tối đa
  30 s) — bằng chứng E2/G2: load tức thời không dự báo được qua/chết gate,
  chờ dài chỉ tốn thời gian.
- Config vite tái tạo sau reboot bằng `tools/gen-vite-config.mjs` của F2:
  1.726 byte, md5 `ca5b3c48afd54171d995e74cbadf7215`, KHỚP A6/B8/C4/E2/G2.

## 3. Diễn biến đo — sóng tải + chết gate + sóng EPERM

- 08:42Z driver lượt 1 bắt đầu (load 1,18). S1: 3 lần chết gate (delta 0,
  5, 9) rồi qua ở attempt 4 (delta 21, load 18,22) — phiên chuẩn đầu tiên.
- 08:54Z trở đi: sóng tải từ các luồng đợt 80 khác (ffmpeg export H10,
  vidstab stress H1, script H4/H3, 2 `yes` burner) đẩy load 1-phút lên
  13–24 nhiều lần; gate chết liên tiếp (delta chết chủ yếu 2–5, cao nhất
  13; mẫu chết gate: draw 2→4 trong 6 s dù element vẫn decode — đúng mẫu
  E2 §6.3/G2 §3).
- 09:15Z TẠM DỪNG driver lượt 1 theo tiền lệ G2 §3 (load 24,1; 13 lượt
  chạy chỉ 1 phiên qua gate) để giữ ngân sách attempt; attempt 3 của S2
  chạy nốt (orphan) rồi cũng chết gate (delta 2, load 19,24).
- 09:19Z khởi động lại driver lượt 2 (load1 0,60); C1 vẫn chết gate 4 lần
  liên tiếp (tổng C1 sau lượt 1+2: 10 lần chết).
- 09:27Z khởi động lại driver lượt 3 với `F2_WAIT_TICKS=1`. (Lưu ý: lần
  kill đầu nhầm PID vỏ ngoài 28005, driver thật 28010 vẫn chạy; đã kill
  đúng 28010 rồi mới restart — không mất dữ liệu, chỉ mất ~1 phút.)
- 09:41Z PHA MÁY ĐỔI: S2 qua gate ở attempt 4 (delta 22). Từ đây các phiên
  qua nhanh: C2 attempt 2 (giết), S3 attempt 1, C3 attempt 1 (giết), S4
  attempt 1, C4 attempt 1 (giết). Phase A kết thúc 09:57Z: 7/8 phiên có
  JSON (thiếu C1 — 16 lần chết gate qua 3 lượt driver), tổng lượt 3 là
  16 lần chạy.
- Phase B 09:59Z–10:06Z: S5 qua ở attempt 3 (delta 35), S6 qua ngay
  attempt 1 (delta 43). S7 attempt 1 qua gate, đo tới resume-probe rồi
  harness CHẾT BẤT THƯỜNG ~10:08Z (toàn bộ tiến trình con biến mất, log
  0 byte) — dấu hiệu đầu tiên của sóng EPERM (xem §7).
- 10:10–10:15Z driver chạy các attempt S7–S10 rất nhanh (~25 s/chu kỳ)
  nhưng không phiên nào có JSON; log driver-phase-b.log bị hỏng do
  double-writer (xem §7) nên không đếm được chính xác số attempt đoạn
  này — chỉ biết S7/S8/S9/S10 đều không có JSON.
- 10:16Z chạy tay run-session.sh cho S7 để chẩn đoán: `tee: .../h2-run.log:
  Operation not permitted` + `Xvfb :180 không lên sau 15s`. Kiểm tra trực
  tiếp: mọi lệnh ghi file từ exec đều EPERM (workspace lẫn /tmp; file tạo
  mới được nhưng 0 byte), dù đang chạy root, disk còn 90G, mount rw.
  **DỪNG ĐO theo đúng lệnh body vòng lặp.** Driver phase B đã dừng
  (PID 53316). Tổng attempt đếm được: 37 (lượt 1: 13, lượt 2: 4, lượt 3:
  16, phase B S5+S6: 4) + số attempt S7–S10 trong sóng EPERM không đếm
  được chính xác.

## 4. Phiên đo H2 (9 phiên có JSON)

Gate 1a = 6 s, delta ≥ 20 mới PASS. Re-gate = 6 s sau slot 1, ngưỡng 30.
FN = slot draw < 2 fps. Tất cả giờ UTC; giờ +07 = UTC + 7.

| Phiên | Điều kiện | Gate 1a | Slot draw fps (1/2/3) | Re-gate | Slot1 FN | Luật cũ | Luật mới | Kết quả |
|---|---|---|---|---|---|---|---|---|
| S1 | plain | 21 PASS | 2,87 / 2,26 / 2,24 | 24 FAIL | không | GIẾT | **THA** | exit 0, sparedByConfirm — FP đầy đủ của luật cũ |
| S2 | burner2 | 22 PASS | 2,30 / 0,49 / 2,72 | 18 FAIL | không | GIẾT | **THA** | exit 0 — FN (slot 2), luật cũ bắt / luật mới tha |
| S3 | burner4 | 36 PASS | 3,27 / 4,15 / 0,59 | 2 FAIL | không | GIẾT | **THA** | exit 0 — FN (slot 3), re-gate FAIL sâu nhất đợt |
| S4 | burner3 | 39 PASS | 5,88 / 10,32 / 8,93 | 36 PASS | không | tha | tha | exit 0, khỏe |
| S5 | plain | 35 PASS | 1,50 / 6,55 / 4,99 | 183 PASS | **CÓ** | tha | tha | exit 0 — FN slot1 (đúng biên dưới dải) nhưng re-gate PASS nên lọt cả hai luật |
| S6 | burner2 | 43 PASS | 4,56 / 5,90 / 5,70 | 33 PASS | không | tha | tha | exit 0, khỏe |
| C2 (s12) | burner2, cũ | 20 PASS | 3,53 | 24 FAIL | không | **GIẾT** | (cũ) | exit 1, killedByRegate — **GIẾT LIVE #1 của luật cũ (FP)** |
| C3 (s13) | burner4, cũ | 31 PASS | 3,85 | 17 FAIL | không | **GIẾT** | (cũ) | exit 1 — **GIẾT LIVE #2 (FP)** |
| C4 (s14) | burner3, cũ | 29 PASS | 3,66 | 25 FAIL | không | **GIẾT** | (cũ) | exit 1 — **GIẾT LIVE #3 (FP)** |
| C1 (s11) | plain, cũ | — | — | — | — | — | — | KHÔNG CÓ JSON — 16 lần chết gate (delta 2, 3, 2, 13, 2, 2, …) |

Chi tiết:

- **S1 — FP đầy đủ đầu tiên của H2:** gate 21, slot 2,87/2,26/2,24 fps
  (chậm nhưng không FN), presented ~10,4 fps, re-gate 24 FAIL. Luật cũ
  GIẾT, luật mới THA. Vì phiên sống sót đủ 3 slot nên đây là FP
  ground-truth ĐẦY ĐỦ (không còn là FP "kiểm duyệt" nữa) — FP đầy đủ thứ
  hai của luật cũ sau G2-S3.
- **S2 — slot1 trong dải 1,5–2,5 (2,30), re-gate FAIL, được tha:** burner2
  trong sóng tải đẩy slot1 xuống 2,30 fps (trên ngưỡng FN 0,30); slot2
  0,49 fps là FN thật. Luật cũ giết, luật mới tha — mẫu E2-S1 lặp lại
  (FN ở slot sau, slot1 không FN). Resume-probe draw 0,51 fps,
  presented 13,41 fps.
- **S3 — re-gate FAIL sâu nhất (delta 2):** gate 36, slot1 3,27 fps,
  slot3 0,59 fps FN; re-gate delta 2 (0,33 fps) FAIL ở tải thấp (1,58).
  Luật cũ giết, luật mới tha. Cặp với C3 (cùng burner4): S3 tha / C3
  giết — A/B ghép đôi sạch.
- **S5 — slot1 FN đúng biên dưới dải (1,50 fps):** plain trong sóng tải,
  slot1 1,50 fps (FN), slot2 6,55 / slot3 4,99 fps; re-gate delta 183
  PASS (30,5 fps) nên CẢ HAI luật đều tha — FN lọt ở nghĩa giết-sớm như
  B8-S1 (delta 75). Đây là phiên FN có slot1 FN duy nhất của H2, nhưng
  không tạo ra lần giết nào của luật mới vì re-gate PASS.
- **C2/C3/C4 — 3 lần giết live của luật cũ, cả 3 đều FP:** gate 20/31/29
  PASS (C2 đúng ngưỡng 20), slot1 3,53/3,85/3,66 fps khỏe, re-gate
  24/17/25 FAIL → luật cũ giết (exit 1, `kill-old-rule`, slot 2–3 +
  resume-probe + đối chứng bị bỏ qua theo thiết kế). Cả 3 phiên đều KHÔNG
  phải FN — luật mới đã tha được cả 3 (theo logic confirm; đối chứng
  chạy confirm=0 nên không quan sát trực tiếp verdict luật mới trên
  chính phiên đó, mà suy ra từ cặp ghép đôi S2/S3/S4 cùng burner).
- **C1 — phiên đối chứng plain duy nhất, không thu được:** 16 attempt
  chết gate qua 3 lượt driver (delta 2, 2, 2, 3, 3, 4, 13, …). Không phải
  do confirm=0 (chết ở gate 1a, trước cả re-gate) mà do pha máy xấu
  08:54–09:41. Cặp A/B plain (S1/C1) vì vậy thiếu nửa đối chứng — S1
  (luật mới, tha) không có C1 tương ứng để so sánh trực tiếp.

## 5. Kết quả gộp (analyzer `tools/analyze-80h2.mjs`, chạy cuối đợt qua stdout)

### §1 — Tất cả các đợt (44 phiên có JSON)
- FN 13/112 slot; phiên FN 11/44; luật cũ bắt được 8/11.
- FP ground-truth đầy đủ: **2/27** phiên không FN, Wilson 95% [2%, 23%]
  — cả 2 đều từ G2-S3 và H2-S1 (luật cũ sẽ giết; luật mới tha).
- FP kiểm duyệt (phiên chết ở re-gate, chỉ slot 1 làm ground truth): **6/6**
  — C4-S3, D5-S2, D5-S3 (lịch sử) + H2-C2/C3/C4 (đối chứng live mới).
- FN (slot) gộp với dữ liệu cũ (V4 P1/P2 + X2 S4): **16/121 slot (13%)**,
  Wilson 95% [7%, 19%].

### §1e — Riêng đợt H2 (harness chuẩn, luật mới, 6 phiên)
- Phiên FN: **3/6**; bắt FN (giết sớm): luật cũ 2/3 → luật mới **0/3
  — GIẢM** (S2/S3 tha vì slot1 không FN; S5 re-gate PASS).
- FP kiểm duyệt (slot-1-only): luật cũ 3 → luật mới **0**.
- FP ground-truth đầy đủ: luật cũ 1 → luật mới **0**.
- Phiên được luật mới tha khỏi giết oan (sparedByConfirm): **3** (S1, S2, S3).
- Lần giết thật của luật mới trong đợt H2: **KHÔNG CÓ**.

### §1f — Đối chứng A/B luật cũ live (3 phiên, confirm=0, xen kẽ)
- Phiên FN: 0/3; luật cũ **GIẾT THẬT 3/3 phiên** (exit 1, killedByRegate).
- Trong 3 phiên bị giết: **3 phiên KHÔNG phải FN** — FP kiểm duyệt luật
  cũ quan sát trực tiếp lần đầu (trước đây chỉ có 3 FP kiểm duyệt lịch
  sử C4-S3/D5-S2/D5-S3, đều suy ra từ JSON luật cũ).

### §1g — Gộp E2+F2+G2+H2 (luật mới, 25 phiên)
- FN 7, bắt FN sớm luật mới **2/7** (luật cũ 5/7), FP kiểm duyệt luật mới
  **0**, tha oan **5** (E2-S1, G2-S3, H2-S1, H2-S2, H2-S3).
- Wilson 95% bắt FN sớm: luật mới [8%, 64%]; luật cũ [36%, 92%].
- Gộp F2+G2+H2 (harness chuẩn, luật mới): 21 phiên, FN 6.

### §1h — Độ sắc ngưỡng FN 2 fps (slot1 trong dải 1,5–2,5 fps, đợt H2)
- S5: slot1 1,50 fps (FN), re-gate 183 PASS → cả hai luật tha.
- S2: slot1 2,30 fps (không FN), re-gate 18 FAIL → luật mới tha (luật cũ GIẾT).
- Trong dải: n=2 (dưới 2 fps: 1, trên 2 fps: 1). Re-gate FAIL: 1 (trên
  2 fps: 1 → luật mới 0 giết, 1 tha; dưới 2 fps: 0). **Chưa kết luận
  được độ sắc** — cần re-gate FAIL ở cả hai phía của 2 fps trong cùng dải.

## 6. Đọc đúng kết quả

- **Bắt FN sớm của luật mới giảm 2/7 (gộp) là cái giá đã biết, không phải
  phát hiện mới.** Cả 5 ca luật mới "lọt" (E2-S1, G2-S3 là tha oan khỏe;
  H2-S2/S3 là FN ở slot sau; H2-S5 là re-gate PASS) đều có FN được đo đầy
  đủ — không có FN nào mất khỏi dữ liệu, chỉ mất giết sớm (~40 s đo
  thêm mỗi phiên). Đổi lại, luật mới đã tha 5 phiên mà luật cũ sẽ giết
  oan, trong đó 3 ca H2-C2/C3/C4 nay đã được CHỨNG MINH là giết oan bằng
  đối chứng live (trước đây 3 FP kiểm duyệt lịch sử chỉ là suy luận từ
  JSON — nay có 3 FP live nữa, tổng FP kiểm duyệt quan sát được là 6/6
  phiên chết ở re-gate mà slot1 không FN).
- **Luật cũ giết oan mỗi khi re-gate FAIL (trong đợt H2).** Re-gate FAIL
  ở H2: 6 ca (S1, S2, S3, C2, C3, C4) — luật cũ sẽ giết cả 6. Trong đó:
  S1 là FP ground-truth đầy đủ (phiên không FN); C2/C3/C4 là FP kiểm
  duyệt live (chỉ có slot1 làm ground truth, cả 3 đều không FN); S2/S3
  LÀ FN thật nên luật cũ "bắt đúng" ở nghĩa giết-sớm (dù slot1 không FN).
  Tổng: luật cũ giết oan **4 phiên** trong đợt H2 (1 đầy đủ + 3 kiểm
  duyệt live), luật mới **0**. Đây là lần đầu FP của luật cũ được đếm
  bằng quan sát trực tiếp (đối chứng live) thay vì suy luận từ JSON.
- **Burner không tách được slot1 theo liều lượng — pha máy mới là yếu tố
  quyết định.** Slot1 theo burnerN: plain 2,87 (S1, sóng tải) / 1,50
  (S5, sóng tải); burner2 2,30 (S2, sóng tải) / 4,56 (S6, lúc lặng) /
  3,53 (C2); burner4 3,27 (S3) / 3,85 (C3); burner3 5,88 (S4) / 3,66
  (C4). Cùng burner2 cho 2,30 lẫn 4,56 tùy pha máy. Không có quan hệ
  liều–đáp rõ ràng; dải 1,5–2,5 fps đạt được nhờ pha máy + may mắn
  (S2 2,30, S5 1,50), không nhờ điều chỉnh burner có kiểm soát. Đợt sau
  muốn săn slot1 cận ngưỡng thì nên đo trong pha máy xấu (slot1 tự rơi
  về ~2 fps) thay vì tăng burner.
- **Ngưỡng 30/20/2 GIỮ NGUYÊN.** Không có bằng chứng nào trong H2 buộc
  đổi ngưỡng: delta FN max 183 (S5, re-gate PASS — ngưỡng không liên
  quan) và delta khỏe min 4 vẫn chồng lấn; ngưỡng 30 vẫn nằm trong vùng
  lịch sử. Đề xuất đổi ngưỡng cần thêm phiên FN có slot1 FN + re-gate
  FAIL — đúng thứ H2 chưa thu được.

## 7. Giới hạn trung thực (nợ còn mở sau đợt này)

1. **Đợt H2 DỞ DANG (9/14 phiên):** thiếu S7, S8, S9, S10 (luật mới) và
   C1 (đối chứng plain). Mục tiêu "≥10 phiên chuẩn mới" KHÔNG đạt (6/10);
   đối chứng A/B đạt 3/4. Nguyên nhân duy nhất: sóng EPERM ghi file từ
   ~10:08Z (xem mục 2 dưới). Số liệu 9 phiên đã thu là thật và đủ cho
   kết luận A/B (§0.1–0.2), nhưng các con số gộp (§5) có n nhỏ hơn kế
   hoạch và C1 vẫn thiếu.
2. **SÓNG EPERM GHI FILE (~10:08Z trở đi, chưa rõ nguyên nhân):** mọi
   tiến trình spawn từ exec đều bị từ chối ghi file — `write()` trả
   EPERM (kể cả /tmp; file tạo mới được nhưng 0 byte), Xvfb không tạo
   được socket `/tmp/.X11-unix/X180` sau 15 s. Kiểm chứng: user root,
   disk còn 90G, mount rw; `muse.write` (kênh tool khác) vẫn ghi được
   bình thường — chặn chỉ ảnh hưởng kênh exec. Bắt đầu ~10:08Z (harness
   S7 chết bất thường, log 0 byte), vẫn còn lúc 10:18Z (kiểm tra trực
   tiếp 4 vị trí đều FAIL). Không rõ có phải toàn VM hay chỉ session
   này; không thử lách (đúng lệnh body vòng lặp). **Cần parent kiểm tra
   ở lượt sau: exec có ghi được file không, và các luồng đợt 80 khác có
   bị EPERM không.** Nếu EPERM còn, vòng lặp không đo được gì thêm bằng
   harness cho tới khi hết.
3. **Độ sắc ngưỡng FN 2 fps VẪN CHƯA kiểm chứng được** (xem §5 §1h): cần
   thêm phiên slot1 trong dải 1,5–2,5 fps KÈM re-gate FAIL ở cả hai phía
   của 2,0 fps. Hiện chỉ có: G2 (1,97 giết / 2,07 tha) + H2-S2 (2,30 tha)
   + H2-S5 (1,50 nhưng re-gate PASS nên không phân biệt được luật).
4. **Chưa có thêm lần giết thật nào của luật mới** (vẫn chỉ 2 lần của G2,
   S2/S4). Wilson cho bắt FN sớm luật mới gộp vẫn rộng ([8%, 64%]).
5. **FN ở slot 2+ mà re-gate PASS (S5 slot1 FN nhưng re-gate PASS; G2-S8
   FN chỉ ở slot 2) vẫn lọt cả hai luật** ở nghĩa giết-sớm — theo thiết
   kế, không phải bug; FN vẫn đo đầy đủ.
6. **Chết gate 1a vẫn tốn ~76% lượt chạy đếm được** (28/37 lượt không ra
   phiên: 9 qua / 37). Hiện tượng đã biết (E2 §6.3, G2 §3), không phải dữ
   liệu về luật re-gate. Delta chết tập trung 2–5 (draw đóng băng 2→4
   trong 6 s dù element vẫn decode).
7. **Log driver-phase-b.log bị hỏng do double-writer:** driver redirect
   stdout vào cùng file mà `tee -a` append (mẫu từ G2) — các dòng echo
   xuất hiện trùng lặp rồi bị ghi đè lẫn nhau; file dừng cập nhật ở
   10:07 dù driver vẫn chạy tới 10:15. Số attempt S7–S10 trong sóng
   EPERM vì vậy không đếm được chính xác. Bài học cho đợt sau: driver
   KHÔNG redirect stdout vào cùng file log mà tee dùng (chỉ dùng một
   đường ghi).
8. **Log harness `E2-SECOND-GATE` in sai chữ ở nhánh giết** (xem §1) —
   JSON đúng, chỉ wording log sai; để đợt sau sửa.
9. Chưa đổi ngưỡng 30/20/2 (xem §6). Không release/tag. Không push (chỉ stage).

## 8. Kiểm chứng

- **Unit test gate: `node --test` 18/18 PASS** (E2 12 — gồm 2 test hồi quy
  H2 mới — + F2 6), chạy cuối đợt 10:20 UTC. `node --check` harness +
  test + analyzer OK.
- **Analyzer:** `tools/analyze-80h2.mjs` chạy lại cuối đợt không lỗi
  (exit 0), 9/9 session JSON tồn tại và đọc được. Output analyzer không
  lưu được ra file do EPERM (ghi /tmp cũng EPERM) — số liệu đầy đủ đã
  đưa vào LIMITS này (§4–§5); analyzer + JSON gốc vẫn trên đĩa nên chạy
  lại được bất cứ lúc nào khi hết EPERM.
- **9/9 session JSON tồn tại** (session1–6, 12–14 trong `sessions/`);
  session7–11 không có JSON (S7 chết harness do EPERM; S8–S10 attempt
  chết trong sóng EPERM; C1 16 lần chết gate).
- Config vite md5 khớp (`ca5b3c48afd54171d995e74cbadf7215`); harness dry-run
  OK trước đo. Không cần tsc (chỉ script + docs, như E2/F2/G2).
  **Không sửa production.**

## 9. File và log

**Stage (KHÔNG push):** `~/workspace/repo-1-push/paths-loop/phase9-round80-h2-gate-ab.txt`
- `apps/web/scripts/measure-78f2-gate-harness.mjs` (sửa: `Y3_BURNER_N`)
- `apps/web/scripts/test_round77_e2_regate_confirm.test.mjs` (thêm 2 test hồi quy H2)
- `docs/PHASE9_ROUND80_H2_GATE_AB_LIMITS.md` (mới — file này)

**Không stage:** variant `/tmp` (sinh lại mỗi lần chạy),
`r8-presented-done.png` (binary), log/notes/tools trong goal workspace
(nội bộ — như mọi đợt gate trước). File
`hidden_files/round80-h2/test-tool-write.txt` là file probe kênh ghi
(muse.write) lúc chẩn đoán EPERM — đã xóa xong (lệnh `rm` qua exec vẫn
hoạt động, chỉ `write()` bị chặn); không stage.

**Log luồng:** `~/workspace/goals/capcut-clone-video-editor/hidden_files/round80-h2.md`
**Phiên + notes:** `hidden_files/round80-h2/sessions/session{1..14}/`
(`presented-fps.json` nếu có, `h2-run.log`)
**Driver log:** `hidden_files/round80-h2/driver-phase-{a,b}.log`
(lưu ý: driver-phase-b.log bị hỏng do double-writer sau 10:07 — xem §7.7)
**Tools:** `hidden_files/round80-h2/tools/` (run-session.sh,
run-all-phase-{a,b}.sh, analyze-80h2.mjs)
