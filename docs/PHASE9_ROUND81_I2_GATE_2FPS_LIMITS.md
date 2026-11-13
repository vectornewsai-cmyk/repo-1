# PHASE 9 — ĐỢT 81, LUỒNG I2: Gate — kiểm chứng độ sắc ngưỡng FN 2 fps

> Đóng nợ đợt 80 §4.2 (H2 §7.3): độ sắc ngưỡng FN 2 fps VẪN CHƯA kiểm chứng
> được — trong dải 1,5–2,5 fps chỉ n=2, không có ca slot1 FN + re-gate FAIL
> nào trong H2. Đợt này chạy thêm phiên gate (harness chuẩn F2, luật mới,
> Y3_BURNER_N), ưu tiên tìm ca slot1 FN + re-gate FAIL để kiểm chứng độ sắc.
> Ngưỡng 30/20/2 GIỮ NGUYÊN. Ngày: 2026-11-10 (UTC 11:39–13:15, +07 18:39–20:15).

## 0. Kết luận (đọc trước)

1. **NỢ ĐÃ ĐÓNG — đã có ca slot1 FN + re-gate FAIL trong dải, ở phía dưới
   2 fps: S14 slot1 1,96 fps (FN) + re-gate delta 4 FAIL → luật mới GIẾT.**
   Đây là ca dưới-2,0 trong dải đầu tiên có re-gate FAIL (H2 không có ca nào).
2. **Độ sắc ngưỡng 2 fps: KIỂM CHỨNG ĐƯỢC Ở MỨC QUAN SÁT (n nhỏ), chưa phải
   chứng minh thống kê.** Gộp H2+I2 trong dải 1,5–2,5 fps: re-gate FAIL 6 ca
   — dưới 2 fps: 1/1 GIẾT (S14 1,96); trên 2 fps: 5/5 THA (2,03 / 2,06 /
   2,23 / 2,27 / 2,30). Verdict lật đúng theo phía của 2 fps trong mọi ca
   FAIL. Cặp sát nhất hai phía ranh giới (gộp G2): giết 1,96 / 1,97 vs tha
   2,03 / 2,06 / 2,07 — cửa sổ lật 0,06 fps quanh 2,0. Nhưng phía dưới
   trong dải chỉ có đúng 1 ca (S14) — đừng trích đây là "đã chứng minh".
3. **Luật mới đợt I2: 4 lần giết thật** (S2 1,29 / re-gate 11; S7 0,88 /
   re-gate 29; S14 1,96 / re-gate 4; S15 0,88 / re-gate 23) — tổng số lần
   giết thật của luật mới nay là 6 (G2 2 + I2 4). Bắt FN sớm 4/6 (luật cũ
   5/6); FP kiểm duyệt 0; FP đầy đủ 0 (luật cũ 4); tha oan 5.
4. **Gộp E2+F2+G2+H2+I2 (luật mới, 37 phiên): FN 13, bắt FN sớm 6/13
   (luật cũ 10/13), Wilson 95% luật mới [23%, 71%]** (trước I2: 2/7,
   [8%, 64%]) — khoảng thu hẹp nhưng vẫn rộng; FP kiểm duyệt 0, tha oan 10.
5. **Ngưỡng GIỮ NGUYÊN 30/20/2.** Delta re-gate phiên FN (n=17): 2, 2, 4,
   11, 15, 17, 18, 18, 18, 20, 21, 23, 29, 30, 44, 75, 183; phiên khỏe
   (n=39): min 4 — vẫn CHỒNG LẤN hoàn toàn, không có ngưỡng tách sạch.
6. **VM REBOOT giữa đợt (~12:32Z)** giết chết driver ngay sau re-gate của
   S6 attempt 4 (slot1 2,64, re-gate 13 FAIL, luật mới tha — chỉ còn log,
   không có JSON). Driver khởi động lại (resume) sau khi tái tạo config
   vite (md5 khớp); 10/10 lượt chạy sau reboot đều ra JSON ngay attempt 1.
   S1/S3/S5 đốt 18 lượt chạy mà 0 JSON (chết gate 1a, mẫu draw 2→4 quen thuộc).

## 1. Thay đổi harness/test (I2) — nhỏ, không động production

- `apps/web/scripts/test_round77_e2_regate_confirm.test.mjs`: thêm 2 test
  hồi quy I2 (12 phiên đợt 81 + độ sắc S14 1,96 giết vs S6 2,03 tha).
  Tổng test gate: **20/20 PASS** (18 cũ + 2 mới I2).
- Analyzer `tools/analyze-81i2.mjs` (kế thừa `analyze-80h2.mjs`, nội bộ
  trong goal workspace): thêm thư mục I2, §1i (riêng I2), §1j (gộp
  E2+F2+G2+H2+I2), §1k (độ sắc gộp H2+I2). `node --check` OK; chạy cuối
  đợt không lỗi (output lưu `hidden_files/round81-i2/analyze-81i2-output.txt`).
- **KHÔNG sửa harness** `measure-78f2-gate-harness.mjs` (không cần — đã có
  `Y3_BURNER_N` từ H2) và **KHÔNG sửa production**, không sửa
  `gate-regate-confirm.mjs` (luật giết không đổi). Không push/tag.
- Ghi chú (không sửa trong đợt này): dòng log `E2-SECOND-GATE` của harness
  vẫn in sai chữ ở nhánh giết — luôn ghi "+ slot1 FN (X fps)" dù slot1Fn
  có thể là false (nợ từ F2, nhắc lại ở H2 §1). JSON ghi đúng. Lần này
  cả 4 ca giết đều có slot1 FN thật nên log không sai thực tế lần nào;
  vẫn để đợt sau sửa (không đổi harness giữa đợt đo).

## 2. Kế hoạch đo (đã chạy — gồm 3 chặng do reboot)

- Chặng gốc (driver `run-all-i2.sh`): 12 phiên luật mới, burner trộn:
  S1 plain, S2 burner2, S3 burner4, S4 burner3, S5 plain, S6 burner6,
  S7 burner2, S8 plain, S9 burner3, S10 burner4, S11 burner2, S12 plain.
  Mỗi phiên retry tối đa 6 attempt; `F2_WAIT_TICKS=1` (tối đa 30 s chờ
  load < 3 trước mỗi attempt, bài học H2).
- Chặng resume (`run-all-i2-resume.sh`, sau reboot): S6–S12, tối đa 40 lượt.
- Chặng extra (`run-all-i2-extra.sh`, để đạt ≥10 phiên + săn thêm ca dưới
  2,0 trong dải): S13 plain, S14 burner2, S15 burner3, tối đa 18 lượt.
- Tổng: **37 lượt chạy → 12 phiên có JSON** (S1/S3/S5: 0 JSON sau 6 attempt
  mỗi phiên). Chi tiết attempt: S1 6, S2 4, S3 6, S4 1, S5 6, S6 5 (4 lượt
  gốc gồm 1 lượt bị reboot giết + 1 lượt resume), S7–S12 mỗi phiên 1 lượt
  (resume), S13–S15 mỗi phiên 1 lượt (extra) — tổng 6+4+6+1+6+5+6+3 = **37 lượt**
  (gốc 27 + resume 7 + extra 3, theo driver log).
- Config vite tái tạo 2 lần sau reboot bằng `tools/gen-vite-config.mjs`
  của F2: 1.726 byte, md5 `ca5b3c48afd54171d995e74cbadf7215`, KHỚP
  A6/B8/C4/E2/G2/H2 cả hai lần.

## 3. Diễn biến đo — sóng tải + chết gate + REBOOT VM

- 11:39Z bắt đầu (load 2,37; EPERM đã hết — exec ghi được cả /tmp và
  workspace, xem §7.1). S1 đốt 6 attempt chết gate (delta 19 suýt qua ở
  attempt 1, rồi 2, 2, 2, 2, 2 — mẫu draw đóng băng 2→4 trong 6 s dù
  element vẫn decode, đúng mẫu E2 §6.3/G2 §3).
- 11:59Z S2 qua gate ở attempt 4 (delta 22): slot1 1,29 fps FN, re-gate
  11 FAIL → **GIẾT — lần giết thật đầu tiên của đợt I2**.
- 12:03–12:13Z S3 đốt 6 attempt chết gate; S4 qua ngay attempt 1
  (slot1 2,06, re-gate 20 FAIL → tha).
- 12:16–12:25Z S5 đốt 6 attempt chết gate (0 JSON).
- 12:25–12:32Z S6: 3 attempt chết gate, attempt 4 qua (delta 22):
  slot1 2,64 fps, re-gate 13 FAIL → luật mới THA — rồi **VM REBOOT
  ~12:32Z** (uptime 10 phút lúc 12:42, trước đó 1:10 lúc 12:32), giết
  driver + mọi tiến trình đo giữa slot 2. Không còn process vite/chrome/
  Xvfb nào sống; /tmp bị xóa (config vite mất). Phiên S6 attempt 4 chỉ
  còn log, không có JSON (xem §7.2).
- 12:43Z khởi động lại driver resume (sau khi tái tạo config vite, md5
  khớp): pha máy tốt — **S6–S12 đều qua ngay attempt 1** (7/7 lượt),
  S7 giết (slot1 0,88, re-gate 29 — chỉ thiếu 1 draw so với ngưỡng 30).
- 13:05–13:10Z chặng extra: S13–S15 đều qua ngay attempt 1 (3/3 lượt).
  **S14: slot1 1,96 fps (FN, trong dải) + re-gate 4 FAIL → GIẾT** — ca
  dưới-2,0 trong dải đầu tiên. S15 giết (slot1 0,88, re-gate 23).
- 13:10Z driver extra kết thúc: 12/15 phiên có JSON. Load trong đợt:
  0,4–21,1 (sóng tải từ các luồng đợt 81 khác); pha tốt sau reboot
  (load 0,2–10) cho tỉ lệ qua gate cao hẳn.

## 4. Phiên đo I2 (12 phiên có JSON)

Gate 1a = 6 s, delta ≥ 20 mới PASS. Re-gate = 6 s sau slot 1, ngưỡng 30.
FN = slot draw < 2 fps. Tất cả giờ UTC; giờ +07 = UTC + 7.

| Phiên | Điều kiện | Gate 1a | Slot draw fps (1/2/3) | Re-gate | Slot1 FN | Luật cũ | Luật mới | Kết quả |
|---|---|---|---|---|---|---|---|---|
| S2 | burner2 | 22 PASS | 1,29 | 11 FAIL | **CÓ** | GIẾT | **GIẾT** | exit 1, kill-confirmed-slot1-fn — giết thật #1 của I2 |
| S4 | burner3 | 22 PASS | 2,06 / 0,58 / 4,35 | 20 FAIL | không | GIẾT | **THA** | exit 0, sparedByConfirm — FN slot 2, slot1 2,06 trong dải |
| S6 | burner6 | 24 PASS | 2,03 / 5,54 / 5,98 | 17 FAIL | không | GIẾT | **THA** | exit 0 — slot1 2,03 trong dải, sát ranh giới trên |
| S7 | burner2 | 29 PASS | 0,88 | 29 FAIL | **CÓ** | GIẾT | **GIẾT** | exit 1 — giết thật #2; re-gate 29, chỉ thiếu 1 draw so với ngưỡng 30 |
| S8 | plain | 29 PASS | 5,84 / 18,74 / 4,41 | 43 PASS | không | tha | tha | exit 0, khỏe |
| S9 | burner3 | 26 PASS | 3,17 / 5,34 / 4,87 | 17 FAIL | không | GIẾT | **THA** | exit 0 — FP đầy đủ của luật cũ (phiên không FN) |
| S10 | burner4 | 25 PASS | 2,23 / 3,54 / 3,27 | 4 FAIL | không | GIẾT | **THA** | exit 0 — re-gate FAIL sâu (4) nhưng slot1 khỏe |
| S11 | burner2 | 25 PASS | 2,27 / 5,95 / 4,74 | 4 FAIL | không | GIẾT | **THA** | exit 0 — như S10, re-gate FAIL sâu vẫn tha đúng |
| S12 | plain | 32 PASS | 1,00 / 16,72 / 18,28 | 44 PASS | **CÓ** | tha | tha | exit 0 — FN slot1 nhưng re-gate PASS nên lọt cả hai luật (như H2-S5) |
| S13 | plain | 37 PASS | 10,82 / 16,79 / 3,11 | 84 PASS | không | tha | tha | exit 0, khỏe |
| S14 | burner2 | 25 PASS | 1,96 | 4 FAIL | **CÓ** | GIẾT | **GIẾT** | exit 1 — **giết thật #3; CA DƯỚI-2,0 TRONG DẢI ĐẦU TIÊN** (1,96 fps) |
| S15 | burner3 | 24 PASS | 0,88 | 23 FAIL | **CÓ** | GIẾT | **GIẾT** | exit 1 — giết thật #4 |
| S1/S3/S5 | plain/burner4/plain | — | — | — | — | — | — | KHÔNG CÓ JSON — mỗi phiên 6 attempt chết gate 1a (delta 2 là chính; S1 attempt 1 suýt qua với delta 19) |
| S6-att4 (trước reboot) | burner6 | 22 PASS | 2,64 (slot 1) | 13 FAIL | không | GIẾT | THA | LOG-ONLY, không JSON — VM reboot giết driver giữa slot 2 (xem §7.2) |

Chi tiết:

- **S14 — ca then chốt của đợt:** gate 25, slot1 1,96 fps (FN, trong dải
  1,5–2,5, dưới 2,0 chỉ 0,04 fps), re-gate delta 4 FAIL (0,67 fps) →
  luật mới GIẾT (exit 1, `kill-confirmed-slot1-fn`). Đây là bằng chứng
  đầu tiên cho phía dưới của ranh giới 2 fps *trong cùng dải* với re-gate
  FAIL — thứ H2 tìm không ra.
- **S6 — ca sát ranh giới phía trên:** slot1 2,03 fps (trên 2,0 chỉ
  0,03 fps), re-gate 17 FAIL → luật mới THA. Cặp S14/S6: verdict lật
  trong khoảng 1,96 → 2,03 (0,07 fps).
- **S7 — giết sát ngưỡng re-gate:** re-gate delta 29 (thiếu đúng 1 draw
  so với ngưỡng 30), slot1 0,88 fps FN → GIẾT. Nếu ngưỡng re-gate là 29
  thay vì 30 thì ca này đã lọt — nhưng ngưỡng 30 vẫn giữ (xem §6: delta
  FN và khỏe chồng lấn, không có cơ sở đổi).
- **S10/S11 — re-gate FAIL sâu vẫn tha đúng:** delta 4 (0,67 fps) nhưng
  slot1 2,23/2,27 fps khỏe → luật mới tha; luật cũ sẽ giết cả hai.
  Độ sâu của re-gate FAIL không dự báo FN — chỉ slot1 FN mới quyết định.
- **S12 — FN lọt cả hai luật:** slot1 1,00 fps FN nhưng re-gate 44 PASS
  → tha. FN vẫn đo đầy đủ (slot 2–3 + resume-probe + đối chứng), chỉ
  mất giết sớm. Mẫu này đã thấy ở H2-S5 (1,50 fps, re-gate 183 PASS)
  và G2-S8.
- **S4 — FN ở slot sau, slot1 trong dải:** slot1 2,06 fps (không FN),
  slot2 0,58 fps FN, re-gate 20 FAIL → luật mới tha (luật cũ giết).
  FN vẫn đo đầy đủ.

## 5. Kết quả gộp (analyzer `tools/analyze-81i2.mjs`, chạy cuối đợt)

### §1 — Tất cả các đợt (56 phiên có JSON)
- FN 19/140 slot; phiên FN 17/56; luật cũ bắt được 13/17.
- FP ground-truth đầy đủ: **6/33** phiên không FN, Wilson 95% [9%, 34%]
  — tăng từ 2/27 (H2) vì I2 thêm 4 ca (S6, S9, S10, S11).
- FP kiểm duyệt (phiên chết ở re-gate, chỉ slot 1 làm ground truth): **6/6**.
- FN (slot) gộp với dữ liệu cũ (V4 P1/P2 + X2 S4): **22/149 slot (15%)**,
  Wilson 95% [10%, 21%].

### §1i — Riêng đợt I2 (harness chuẩn, luật mới, 12 phiên)
- Phiên FN: **6/12**; bắt FN (giết sớm): luật cũ 5/6 → luật mới **4/6
  — GIẢM 1** (S4 tha vì slot1 không FN; S12 re-gate PASS nên cả hai luật
  đều lọt).
- FP kiểm duyệt (slot-1-only): luật cũ 5 → luật mới **0**.
- FP ground-truth đầy đủ: luật cũ 4 → luật mới **0**.
- Phiên được luật mới tha khỏi giết oan (sparedByConfirm): **5** (S4, S6,
  S9, S10, S11).
- Lần giết thật của luật mới trong đợt I2: **4** (S2, S7, S14, S15).
- Slot1 trong dải 1,5–2,5 fps (đợt I2): n=5 (S4 2,06; S6 2,03; S10 2,23;
  S11 2,27; S14 1,96).

### §1j — Gộp E2+F2+G2+H2+I2 (luật mới, 37 phiên)
- FN 13, bắt FN sớm luật mới **6/13** (luật cũ 10/13), FP kiểm duyệt luật
  mới **0**, tha oan **10**.
- Wilson 95% bắt FN sớm: luật mới **[23%, 71%]**; luật cũ [50%, 92%].
  (Trước I2: luật mới 2/7, [8%, 64%] — khoảng thu hẹp nhưng vẫn rộng.)
- GỘP F2+G2+H2+I2 (harness chuẩn, luật mới): 33 phiên, FN 12.

### §1k — Độ sắc ngưỡng FN 2 fps (slot1 trong dải 1,5–2,5 fps, gộp H2+I2)
| Phiên | Slot1 fps | Re-gate | Luật mới |
|---|---|---|---|
| H2-S5 | 1,50 (FN) | 183 PASS | tha (cả hai luật tha — không phân biệt được) |
| I2-S14 | 1,96 (FN) | 4 FAIL | **GIẾT** |
| I2-S6 | 2,03 | 17 FAIL | tha |
| I2-S4 | 2,06 | 20 FAIL | tha |
| I2-S10 | 2,23 | 4 FAIL | tha |
| I2-S11 | 2,27 | 4 FAIL | tha |
| H2-S2 | 2,30 | 18 FAIL | tha |
- Trong dải: n=7 (dưới 2 fps: 2, trên 2 fps: 5). Re-gate FAIL: 6 (dưới
  2 fps: 1 → 1 giết; trên 2 fps: 5 → 0 giết, 5 tha).
- **Kết luận độ sắc:** verdict lật đúng theo phía của 2 fps trong mọi
  ca re-gate FAIL trong dải. Cặp sát nhất: giết 1,96 vs tha 2,03 (cửa
  sổ 0,07 fps). Gộp thêm cặp G2 (1,97 giết / 2,07 tha, cùng re-gate
  delta 15): giết sát nhất 1,96/1,97 vs tha sát nhất 2,03/2,06/2,07 —
  cửa sổ lật 0,06 fps quanh 2,0.
- **Giới hạn của kết luận này (đọc kỹ):** phía dưới trong dải chỉ có
  ĐÚNG 1 ca FAIL (S14). 5 ca trên đều tha, 1 ca dưới đều giết — mẫu
  hoàn toàn nhất quán nhưng n=6 ca FAIL là nhỏ; đây là bằng chứng độ
  sắc ở mức quan sát, chưa phải chứng minh thống kê. Muốn chắc hơn cần
  thêm ca slot1 trong [1,5; 2,0) + re-gate FAIL — đợt sau vẫn nên săn
  tiếp, nhưng nợ H2 §7.3 coi như đã đóng ở mức "có bằng chứng đầu tiên".

## 6. Đọc đúng kết quả

- **Bắt FN sớm của luật mới 4/6 (I2) / 6/13 (gộp) vẫn thấp hơn luật cũ
  5/6 / 10/13 — là cái giá đã biết và đã chấp nhận ở E2 §1.** Cả 7 ca
  luật mới "lọt" gộp (E2-S1, G2-S3, H2-S2/S3/S5, I2-S4/S12) đều có FN
  được đo ĐẦY ĐỦ — không có FN nào mất khỏi dữ liệu, chỉ mất giết sớm.
  Đổi lại, luật mới đã tha 10 phiên mà luật cũ sẽ giết oan (gộp), trong
  đó I2 đóng góp 5 ca (S4, S6, S9, S10, S11).
- **Luật cũ giết oan mỗi khi re-gate FAIL mà slot1 không FN (trong đợt
  I2: 5/5 ca).** Re-gate FAIL ở I2: 9 ca (S2, S4, S6, S7, S9, S10, S11,
  S14, S15) — luật cũ sẽ giết cả 9. Trong đó 5 ca là FP (S4 là FN ở slot
  sau nhưng slot1 không FN nên giết-sớm của luật cũ cũng là giết oan ở
  nghĩa xác nhận slot-1; S6/S9/S10/S11 là FP đầy đủ). Luật mới giết đúng
  4 ca FN thật, tha đúng 5 ca.
- **Burner vẫn không tách được slot1 theo liều lượng — pha máy mới là
  yếu tố quyết định** (nhắc lại H2 §6). Slot1 theo burnerN trong I2:
  plain 5,84 (S8) / 1,00 (S12) / 10,82 (S13); burner2 1,29 (S2) /
  0,88 (S7) / 2,27 (S11) / 1,96 (S14); burner3 2,06 (S4) / 3,17 (S9) /
  0,88 (S15); burner4 2,23 (S10); burner6 2,03 (S6). Cùng burner2 cho
  0,88 lẫn 2,27. Dải 1,5–2,5 fps đạt được nhờ pha máy + may mắn, không
  nhờ điều chỉnh burner có kiểm soát. 10/10 lượt chạy sau reboot đều ra
  JSON ngay attempt 1 — pha máy tốt quan trọng hơn burner.
- **Ngưỡng 30/20/2 GIỮ NGUYÊN.** Không có bằng chứng nào trong I2 buộc
  đổi ngưỡng: delta re-gate FN max 183 (S5 H2, re-gate PASS) và delta
  khỏe min 4 (S10/S11 I2, re-gate FAIL sâu nhưng slot1 khỏe) vẫn chồng
  lấn hoàn toàn. Đề xuất đổi ngưỡng cần dữ liệu tách sạch — hiện không có.

## 7. Giới hạn trung thực (nợ còn mở sau đợt này)

1. **Độ sắc ngưỡng 2 fps: bằng chứng đầu tiên đã có, nhưng n còn nhỏ.**
   Phía dưới trong dải chỉ 1 ca FAIL (S14 1,96). Muốn chắc hơn cần thêm
   ca slot1 trong [1,5; 2,0) + re-gate FAIL. Nợ H2 §7.3 đóng ở mức "có
   bằng chứng đầu tiên", không đóng ở mức "đã chứng minh thống kê".
2. **VM REBOOT ~12:32Z giữa đợt** (uptime 10 phút lúc 12:42, trước đó
   1:10 lúc 12:32): driver gốc chết, /tmp bị xóa, S6 attempt 4 mất JSON
   (chỉ còn log: slot1 2,64 fps, re-gate 13 FAIL, luật mới tha — quan
   sát log-only, KHÔNG đưa vào số gộp JSON; phù hợp mẫu phía trên 2 fps).
   Các luồng đợt 81 khác cũng bị reboot giết process — parent kiểm tra
   khi gộp đợt 81. Reboot là sự kiện hạ tầng, không phải lỗi harness.
3. **S1/S3/S5: 0 JSON sau 18 lượt chạy** (chết gate 1a, delta 2 là chính).
   Chết gate vẫn tốn ~68% lượt chạy đếm được (25/37 lượt không ra phiên:
   S1/S3/S5: 18; S2: 3 gồm 1 mount-timeout; S6: 4 gồm 1 lượt bị reboot
   giết). Hiện tượng đã biết (E2 §6.3, G2 §3), không phải dữ liệu về
   luật re-gate. Đếm chính xác: 37 lượt − 12 phiên = 25 lượt không ra
   JSON (23 chết gate + 1 mount-timeout + 1 reboot).
4. **FN ở slot 1 mà re-gate PASS (S12) vẫn lọt cả hai luật** ở nghĩa
   giết-sớm — theo thiết kế, không phải bug; FN vẫn đo đầy đủ.
5. **Chưa có thêm bằng chứng về ngưỡng re-gate 30 tách sạch.** Delta FN
   (n=17) và khỏe (n=39) chồng lấn hoàn toàn (§5 §3).
6. **Log harness `E2-SECOND-GATE` vẫn in sai chữ ở nhánh giết** (xem §1)
   — JSON đúng, chỉ wording log sai; để đợt sau sửa.
7. **EPERM: KHÔNG gặp trong đợt này.** Exec ghi được cả /tmp và workspace
   từ đầu đợt (probe 11:37Z) đến cuối; sóng EPERM của H2 đã hết (nhiều
   khả năng do VM reboot 2 lần trong ngày).
8. Chưa đổi ngưỡng 30/20/2 (xem §6). Không release/tag. Không push (chỉ stage).

## 8. Kiểm chứng

- **Unit test gate: `node --test` 20/20 PASS** (18 cũ + 2 mới I2), chạy cuối đợt 13:15 UTC. `node --check` harness + test + analyzer OK.
- **Analyzer:** `tools/analyze-81i2.mjs` chạy cuối đợt không lỗi (exit 0),
  12/12 session JSON I2 tồn tại và đọc được; số gộp H2 tái lập đúng
  (25 phiên, FN 7, 2/7, Wilson [8%, 64%]) trước khi cộng I2.
- **12/12 session JSON I2 tồn tại** (session2, 4, 6–15 trừ 1/3/5);
  session1/3/5 không có JSON (6 attempt chết gate mỗi phiên); session6
  attempt 4 trước reboot chỉ có log (xem §7.2).
- Config vite md5 khớp 2 lần (`ca5b3c48afd54171d995e74cbadf7215`); harness
  dry-run OK trước đo. Không cần tsc (chỉ script + docs, như E2/F2/G2/H2).
  **Không sửa production.**

## 9. File và log

**Stage (KHÔNG push):** `~/workspace/repo-1-push/paths-loop/phase9-round81-i2-gate-2fps.txt`
- `apps/web/scripts/test_round77_e2_regate_confirm.test.mjs` (sửa: thêm 2 test hồi quy I2)
- `docs/PHASE9_ROUND81_I2_GATE_2FPS_LIMITS.md` (mới — file này)

**Không stage:** harness (không đổi), analyzer `tools/analyze-81i2.mjs` +
  driver scripts + log/notes trong goal workspace (nội bộ — như mọi đợt
  gate trước), session JSON/log (dữ liệu đo thô, nội bộ).

**Log luồng:** `~/workspace/goals/capcut-clone-video-editor/hidden_files/round81-i2.md`
**Phiên + notes:** `hidden_files/round81-i2/sessions/session{1..15}/`
  (`presented-fps.json` nếu có, `i2-run.log`; session6 có thêm
  `i2-notes.txt` ghi dữ liệu log-only của attempt 4 bị reboot giết)
**Driver log:** `hidden_files/round81-i2/driver-i2.log` (một file duy nhất
  cho cả 3 chặng — đã sửa lỗi double-writer của H2 §7.7: stdout driver
  redirect sang file riêng `driver-i2*.stdout.log`)
**Tools:** `hidden_files/round81-i2/tools/` (run-session.sh,
  run-all-i2.sh, run-all-i2-resume.sh, run-all-i2-extra.sh,
  analyze-81i2.mjs) + `analyze-81i2-output.txt`
