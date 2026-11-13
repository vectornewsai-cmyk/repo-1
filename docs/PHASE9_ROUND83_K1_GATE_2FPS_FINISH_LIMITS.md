# PHASE 9 — ĐỢT 83, LUỒNG K1: Gate — HOÀN THÀNH J6 (độ sắc ngưỡng FN 2 fps)

> Hoàn thành nợ đợt 82 §4 (J6 dở dang): chạy tiếp các phiên còn thiếu
> (J6 S6–S15), mục tiêu ≥3–4 ca slot1 dưới 2,0 fps có re-gate FAIL,
> gộp E2+F2+G2+H2+I2+J6+K1, kết luận ngưỡng 30/20/2.
> Ngày: 2026-11-10/11 (UTC 17:40–19:43, +07 11/11 00:40–02:43).

## 0. Kết luận (đọc trước)

1. **MỤC TIÊU ĐÃ ĐẠT — đã có 3 ca slot1 dưới 2,0 fps trong dải có
   re-gate FAIL, cả 3 đều GIẾT:** K1 S11 1,81 fps (re-gate 14 FAIL),
   K1 S12 1,84 fps (re-gate 18 FAIL), cùng I2 S14 1,96 fps (re-gate 4
   FAIL). Phía trên 2,0 fps trong dải: 8/8 ca re-gate FAIL đều THA
   (2,03 / 2,05 / 2,06 / 2,23 / 2,27 / 2,30 / 2,36 / 2,37).
2. **Độ sắc ngưỡng 2 fps: KIỂM CHỨNG ĐƯỢC Ở MỨC QUAN SÁT MẠNH HƠN I2**
   (n=11 ca FAIL trong dải, gộp H2+I2+J6+K1 — I2 chỉ có n=6): verdict
   lật đúng theo phía của 2 fps trong mọi ca. Cặp sát nhất hai phía
   ranh giới vẫn là giết 1,96 / tha 2,03 — cửa sổ lật 0,07 fps quanh
   2,0. Đây vẫn chưa phải chứng minh thống kê (n=11, không có khoảng
   tin cậy cho độ sắc), nhưng nợ H2 §7.3 / I2 §7.1 nay coi như **ĐÃ
   ĐÓNG** ở mức "có bằng chứng quan sát đủ dày" — không cần săn thêm
   ca dưới-2,0 trong dải nữa trừ khi muốn nâng n lên mức thống kê.
3. **Luật mới đứng vững ở dải dưới-2fps: 3 lần giết thật trong K1**
   (S10 0,39 / S11 1,81 / S12 1,84) — tổng số lần giết thật của luật
   mới nay là 9 (G2 2 + I2 4 + K1 3). FP kiểm duyệt 0, FP đầy đủ 0
   trong K1 (luật cũ: FP kiểm duyệt 4, FP đầy đủ 2).
4. **Gộp E2+F2+G2+H2+I2+J6+K1 (luật mới, 45 phiên): FN 19, bắt FN sớm
   luật mới 9/19 (luật cũ 16/19), Wilson 95% luật mới [27%, 68%]**
   (trước K1: 6/14, [21%, 67%]) — khoảng thu hẹp một chút nhưng vẫn
   rộng; FP kiểm duyệt luật mới 0, tha oan 15.
5. **Ngưỡng GIỮ NGUYÊN 30/20/2.** Delta re-gate phiên FN (n=23, max
   183) và phiên khỏe (n=41, min 3) vẫn CHỒNG LẤN hoàn toàn, không có
   ngưỡng tách sạch. Không sửa production.
6. **Ca làm việc nhiễu loạn nhất từ trước tới nay:** 2 lần sóng EPERM,
   1 lần 2 driver chạy song song (lỗi kill của chính K1), 2 lần VM
   reboot — nhưng dữ liệu JSON cuối cùng đều sạch (mọi attempt nhiễm
   đều không ra JSON; chỉ các phiên sạch mới có JSON).

## 1. Thay đổi harness/test (K1) — nhỏ, không động production

- `apps/web/scripts/test_round77_e2_regate_confirm.test.mjs`: thêm 2 test
  hồi quy K1 (7 phiên đợt 83 + độ sắc gộp H2+I2+J6+K1, n=11 ca FAIL).
  Tổng test gate: **16/16 PASS** (14 cũ + 2 mới K1), chạy cuối đợt
  19:44 UTC. Lưu ý đính chính: LIMITS I2 §8 ghi "20/20" nhưng file test
  này chỉ chứa 16 block `test(` sau khi thêm K1 (14 trước K1) — con số
  20 của I2 không tái lập được từ file này (có thể I2 đã chạy thêm file
  test khác mà không ghi rõ); số 16/16 ở đây là số đo trực tiếp bằng
  `node --test` trên đúng file này.
- Analyzer `tools/analyze-83k1.mjs` (kế thừa `analyze-82j6.mjs`, thêm
  K1 + §1o/§1p/§1q; §1k/§1n được lọc đúng phạm vi H2+I2 / H2+I2+J6 để
  các số lịch sử không bị K1 làm lệch). `node --check` OK; chạy cuối
  đợt không lỗi (output lưu `hidden_files/round83-k1/analyze-83k1-output.txt`).
  Chạy thử pre-đo tái lập đúng số I2/J6 (37+1 phiên, FN 13→14, Wilson
  [23%, 71%]→[21%, 67%] sau khi cộng J6 S1 là phiên FN).
- **KHÔNG sửa harness** `measure-78f2-gate-harness.mjs` và **KHÔNG sửa
  production**, không sửa `gate-regate-confirm.mjs`. Không push/tag.
  Ngoại lệ ngoài tầm kiểm soát của K1: luồng K8 (cùng đợt 83) đã nối
  helper `eperm-retry` vào chính harness này GIỮA lúc driver K1 đang
  chạy (~18:12–18:26Z, xem log K8) — chỉ thay cách ghi file (writeBestEffort
  + retry EPERM), không đổi ngưỡng/quyết định gate; các phiên K1 sau thời
  điểm đó (S10–S15) vẫn ra JSON đúng cấu trúc, dry-run OK ngay sau sửa.
  Ghi nhận để parent biết, không coi là K1 sửa harness.
- Ghi chú (không sửa trong đợt này): dòng log `E2-SECOND-GATE` của
  harness vẫn in sai chữ ở nhánh giết — luôn ghi "+ slot1 FN (X fps)"
  dù slot1Fn có thể là false (nợ từ F2, nhắc lại ở H2 §1, I2 §1). JSON
  ghi đúng. Lần này cả 3 ca giết đều có slot1 FN thật nên log không sai
  thực tế lần nào; vẫn để đợt sau sửa (không đổi harness giữa đợt đo).

## 2. Kế hoạch đo (đã chạy — 5 lượt chạy driver do sự cố)

- Driver `run-all-k1.sh` (sao từ J6, đổi BASE sang round83-k1): 10 phiên
  luật mới S6–S15, burner trộn theo J6 (S6/9/11/14 burner2, S7/10/12/15
  burner3, S8 burner4, S13 plain). Mỗi phiên tối đa 6 attempt;
  `F2_WAIT_TICKS=1`. J6 S1 giữ nguyên ở round82-j6, không chạy lại.
- Chặng A = S6–S10, chặng B = S11–S15. Do EPERM + reboot + lỗi kill,
  driver phải chạy lại nhiều lần (xem §3); tổng cộng **64 attempt** cho
  10 phiên, **7 phiên có JSON**.
- Config vite tái tạo 2 lần sau reboot bằng `tools/gen-vite-config.mjs`
  của F2: 1.726 byte, md5 `ca5b3c48afd54171d995e74cbadf7215`, KHỚP
  A6/B8/C4/E2/G2/H2/I2/J6 cả hai lần.

## 3. Diễn biến đo — EPERM ×2, 2 driver song song, reboot ×2

- 17:40Z bắt đầu (VM vừa reboot, uptime 13 phút, /tmp bị xóa).
  EPERM probe trước đo: 3× /tmp + 3× workspace, 6/6 ghi đủ byte.
  Không có file round-in-progress.md. Tái tạo config vite, dry-run OK.
- 17:42Z chặng A bắt đầu. **S6 XONG attempt 3** (17:46Z): gate1a 34
  PASS, slot1 3,82, re-gate 20 FAIL → luật mới THA.
- 17:50–17:58Z S7 đốt 6 attempt chết gate 1a (tải 15–24 do các luồng
  đợt 83 khác: ffmpeg K4/K10, node K2/K5, Chrome K3, 2 process `yes`).
- 17:58Z **TẠM DỪNG driver lần 1** (load 1-min ~15–24). **LỖI KILL CỦA
  K1:** `pgrep -f run-all-k1.sh | head -1` chỉ bắt launcher shell
  (pid 4050), còn script driver thật (pid 4052) vẫn sống (đang ngủ 20 s
  giữa attempt nên `ps` kiểm tra sau đó không thấy process nào — kiểm
  tra sót, bài học: kill phải bắt đúng PID script `/bin/bash
  ./run-all-k1.sh`, không dùng pattern launcher).
- 17:59–18:06Z **HAI DRIVER CHẠY SONG SONG:** driver cũ 4052 (6–10)
  tiếp tục S8 attempt 2–6; driver mới 13952 (7–10) chạy lại lúc 18:01:51
  (S7 attempt 1–2) — hai harness tranh port 5578/9678, load lên 17–24.
  S8 attempt 1 exit=143 (SIGTERM từ lần kill đầu), attempt 2–5 chết
  gate, attempt 6 bị kill giữa chừng; S7 (chạy lại) attempt 1 chết gate,
  attempt 2 bị kill giữa chừng. Một exec giữa chừng bị SIGKILL (chưa rõ
  nguyên nhân, có thể OOM do 2 driver Chrome song song). Đã diệt cả hai
  driver + toàn bộ cây con bằng PID cụ thể, verify sạch (không còn
  process K1, port 5578/9678 trống, Chrome K1 = 0).
- 18:10Z chạy lại driver 7–10 (pid 17755, duy nhất). S7 attempt 1–2
  chết gate (delta 4, rồi 15 suýt qua); attempt 3–6 chết vì **Xvfb :180
  không lên sau 15 s**.
- 18:17–18:22Z **SÓNG EPERM TRỞ LẠI — DỪNG DRIVER LẦN 2:** Xvfb :180
  chết 6 lần liên tiếp; nguyên nhân: Xvfb không ghi được pid vào
  `/tmp/.tX180-lock` (file 0 byte tái xuất sau mỗi lần xóa — đúng mẫu
  EPERM); bằng chứng trực tiếp: harness log `[eperm-retry] ...
  EPERM: operation not permitted, write` lúc ~18:22; K8 probe 18:21:27
  fail 2/2 (/tmp + workspace đều 0 byte); K7 probe 18:15 0 byte. Đã
  dừng driver lúc 18:22 theo luật "bị chặn thì dừng, không cố lách".
  Probe sau khi dừng: 18:23:58 6/6 OK, 18:25:40 3/3 OK; K7 18:23 100
  byte OK — sóng đã qua (~18:15–18:22, ~7 phút). **Chạy lại sau khi
  sóng qua** (một driver duy nhất, pid 21324, đã xóa stale
  `.tX180-lock`): Xvfb :181 lên bình thường, S7 attempt 1–3 chết gate.
- 18:30Z **VM REBOOT lần 2 trong ca K1** (uptime 0 lúc 18:30:36;
  reboot trước ~17:27 — VM reboot roughly mỗi ~1 giờ trong ngày này,
  I2 cũng gặp 1 lần) — driver chết giữa S7 attempt 4. Tái tạo config
  vite (md5 khớp), EPERM probe 2/2 OK, chạy lại một driver (pid 2361).
- 18:41Z **S7 HẾT 6 attempt, 0 JSON** (lượt sau reboot) — tổng cộng S7:
  23 attempt qua 5 lượt chạy, 0 JSON (mẫu như I2 S1/S3/S5).
- 18:52Z S8 HẾT 6 attempt, 0 JSON. 19:03Z S9 HẾT 6 attempt, 0 JSON.
- 19:11Z **S10 XONG attempt 4 — GIẾT** (slot1 0,39, re-gate 8 FAIL).
  Chặng A KẾT THÚC: 2/4 phiên có JSON.
- 19:14Z chặng B bắt đầu (pid 15965, duy nhất). 19:20Z **S11 XONG
  attempt 4 — GIẾT, ca trong dải dưới 2,0 thứ 2** (slot1 1,81, re-gate
  14 FAIL). 19:29Z **S12 XONG attempt 6 — GIẾT, ca trong dải thứ 3**
  (slot1 1,84, re-gate 18 FAIL). 19:35Z S13 XONG attempt 2 — THA
  (slot1 3,77, re-gate 17 FAIL). 19:38Z S14 XONG attempt 1 — THA trong
  dải phía trên (slot1 2,37, re-gate 3 FAIL). 19:43Z S15 XONG attempt 2
  — THA trong dải phía trên (slot1 2,05, re-gate 12 FAIL). Chặng B
  KẾT THÚC: 5/5 phiên có JSON.
- Tổng lượt chạy đếm được: **64 attempt → 7 phiên có JSON** (S6 3, S7 23,
  S8 13, S9 6, S10 4, S11 4, S12 6, S13 2, S14 1, S15 2). Trong đó 53
  attempt exit=2 (chết gate 1a là chính: draw đóng băng 2→4/2→6; 6 lần
  Xvfb không lên do EPERM; 1 lần exit=143 SIGTERM; còn lại bị kill/
  reboot giữa chừng). Chết gate vẫn là chi phí chính, không phải dữ
  liệu về luật re-gate.

## 4. Phiên đo K1 (7 phiên có JSON)

Gate 1a = 6 s, delta ≥ 20 mới PASS. Re-gate = 6 s sau slot 1, ngưỡng 30.
FN = slot draw < 2 fps. Tất cả giờ UTC; giờ +07 = UTC + 7.

| Phiên | Điều kiện | Gate 1a | Slot draw fps (1/2/3) | Re-gate | Slot1 FN | Luật cũ | Luật mới | Kết quả |
|---|---|---|---|---|---|---|---|---|
| S6 | burner2 | 34 PASS | 3,82 / 0,99 / 5,79 | 20 FAIL | không | GIẾT | **THA** | exit 0, sparedByConfirm — FN slot 2, slot1 ngoài dải |
| S10 | burner3 | 21 PASS | 0,39 | 8 FAIL | **CÓ** | GIẾT | **GIẾT** | exit 1, kill-confirmed-slot1-fn — giết thật #1 của K1 |
| S11 | burner2 | 26 PASS | 1,81 | 14 FAIL | **CÓ** | GIẾT | **GIẾT** | exit 1 — **giết thật #2; CA DƯỚI-2,0 TRONG DẢI THỨ 2** |
| S12 | burner3 | 22 PASS | 1,84 | 18 FAIL | **CÓ** | GIẾT | **GIẾT** | exit 1 — **giết thật #3; CA DƯỚI-2,0 TRONG DẢI THỨ 3** |
| S13 | plain | 25 PASS | 3,77 / 0,49 / 3,36 | 17 FAIL | không | GIẾT | **THA** | exit 0 — FN slot 2, slot1 ngoài dải |
| S14 | burner2 | 23 PASS | 2,37 / 3,92 / 3,73 | 3 FAIL | không | GIẾT | **THA** | exit 0 — slot1 2,37 trong dải phía trên, re-gate FAIL rất sâu vẫn tha đúng |
| S15 | burner3 | 26 PASS | 2,05 / 3,30 / 3,37 | 12 FAIL | không | GIẾT | **THA** | exit 0 — slot1 2,05 trong dải phía trên, sát ranh giới nhất phía tha sau 2,03; không có slot FN nào (FP đầy đủ của luật cũ) |
| S7/S8/S9 | burner3/4/2 | — | — | — | — | — | — | KHÔNG CÓ JSON — S7: 23 attempt / 5 lượt chạy; S8: 13 attempt; S9: 6 attempt; toàn chết gate 1a (delta 2 là chính; S7 attempt 2 lượt 18:10 suýt qua với delta 15; 4 attempt S7 chết Xvfb do EPERM, 2 attempt nhiễm đua driver) |

Chi tiết:

- **S11 — ca then chốt thứ nhất của K1:** gate 26, slot1 1,81 fps (FN,
  trong dải 1,5–2,5, dưới 2,0), re-gate delta 14 FAIL → luật mới GIẾT.
- **S12 — ca then chốt thứ hai:** gate 22, slot1 1,84 fps, re-gate
  delta 18 FAIL → GIẾT. Cùng S11 và I2 S14, phía dưới trong dải nay có
  3 ca FAIL và cả 3 đều giết.
- **S15 — ca sát ranh giới phía trên:** slot1 2,05 fps (trên 2,0 chỉ
  0,05 fps), re-gate 12 FAIL → luật mới THA; cả 3 slot đều khỏe (không
  có slot FN nào) — FP đầy đủ của luật cũ được tha đúng. Cặp sát nhất
  vẫn là giết 1,96 / tha 2,03 (S15 2,05 là ca tha sát thứ hai).
- **S14 — re-gate FAIL sâu nhất vẫn tha đúng:** delta 3 (0,5 fps)
  nhưng slot1 2,37 fps khỏe → luật mới tha; luật cũ sẽ giết. Độ sâu
  của re-gate FAIL không dự báo FN — chỉ slot1 FN mới quyết định
  (nhắc lại I2 §4 S10/S11).
- **S10 — giết sát ngưỡng gate 1a:** gate delta 21 (chỉ hơn ngưỡng 20
  đúng 1 draw), slot1 0,39 fps FN → GIẾT. Nếu gate 1a là 22 thay vì 20
  thì ca này đã không vào đo — nhưng ngưỡng 20 vẫn giữ (xem §6).
- **S6/S13 — FN ở slot sau, slot1 ngoài dải:** luật mới tha (luật cũ
  giết); FN vẫn đo đầy đủ, chỉ mất giết sớm — cái giá đã biết và đã
  chấp nhận ở E2 §1.

## 5. Kết quả gộp (analyzer `tools/analyze-83k1.mjs`, chạy cuối đợt)

### §1 — Tất cả các đợt (64 phiên có JSON)
- FN 26/158 slot; phiên FN 23/64; trong đó re-gate bắt được 19/23 (luật cũ).
- FP ground-truth đầy đủ: 8/35 phiên không FN, Wilson 95% [12%, 39%].

### §1o — Riêng đợt K1 (harness chuẩn, luật mới, 7 phiên)
- Phiên FN: **5/7**; bắt FN (giết sớm): luật cũ 5/5 → luật mới **3/5
  — GIẢM 2** (S6/S13 tha vì slot1 không FN; FN vẫn đo đầy đủ).
- FP kiểm duyệt (slot-1-only): luật cũ 4 → luật mới **0**.
- FP ground-truth đầy đủ: luật cũ 2 → luật mới **0**.
- Phiên được luật mới tha khỏi giết oan (sparedByConfirm): **4** (S6,
  S13, S14, S15).
- Lần giết thật của luật mới trong đợt K1: **3** (S10, S11, S12).
- Slot1 trong dải 1,5–2,5 fps (đợt K1): n=4 (S11 1,81; S12 1,84;
  S14 2,37; S15 2,05 — dưới 2 fps: 2).
- GỘP J6+K1 (cùng kế hoạch đo): 8 phiên, FN 6, bắt FN sớm luật mới
  3/6 (luật cũ 6/6).

### §1p — Gộp E2+F2+G2+H2+I2+J6+K1 (luật mới, 45 phiên)
- FN 19, bắt FN sớm luật mới **9/19** (luật cũ 16/19), FP kiểm duyệt
  luật mới **0**, tha oan **15**.
- Wilson 95% bắt FN sớm: luật mới **[27%, 68%]**; luật cũ [62%, 94%].
  (Trước K1: luật mới 6/14, [21%, 67%] — khoảng thu hẹp một chút
  nhưng vẫn rộng.)
- GỘP F2+G2+H2+I2+J6+K1 (harness chuẩn, luật mới): 41 phiên, FN 18.

### §1q — Độ sắc ngưỡng FN 2 fps (slot1 trong dải 1,5–2,5 fps, gộp H2+I2+J6+K1)
| Phiên | Slot1 fps | Re-gate | Luật mới |
|---|---|---|---|
| H2-S5 | 1,50 (FN) | 183 PASS | tha (cả hai luật tha — không phân biệt được) |
| K1-S11 | 1,81 (FN) | 14 FAIL | **GIẾT** |
| K1-S12 | 1,84 (FN) | 18 FAIL | **GIẾT** |
| I2-S14 | 1,96 (FN) | 4 FAIL | **GIẾT** |
| I2-S6 | 2,03 | 17 FAIL | tha |
| K1-S15 | 2,05 | 12 FAIL | tha |
| I2-S4 | 2,06 | 20 FAIL | tha |
| I2-S10 | 2,23 | 4 FAIL | tha |
| I2-S11 | 2,27 | 4 FAIL | tha |
| H2-S2 | 2,30 | 18 FAIL | tha |
| J6-S1 | 2,36 | 15 FAIL | tha |
| K1-S14 | 2,37 | 3 FAIL | tha |
- Trong dải: n=12 (dưới 2 fps: 4, trên 2 fps: 8). Re-gate FAIL: 11
  (dưới 2 fps: 3 → 3 giết; trên 2 fps: 8 → 0 giết, 8 tha).
- **Kết luận độ sắc:** verdict lật đúng theo phía của 2 fps trong mọi
  ca re-gate FAIL trong dải. Cặp sát nhất: giết 1,96 vs tha 2,03 (cửa
  sổ 0,07 fps). Gộp thêm cặp G2 (1,97 giết / 2,07 tha, cùng re-gate
  delta 15): giết sát nhất 1,81/1,84/1,96/1,97 vs tha sát nhất
  2,03/2,05/2,06/2,07 — cửa sổ lật vẫn 0,06–0,07 fps quanh 2,0.
- **Giới hạn của kết luận này (đọc kỹ):** phía dưới trong dải có 3 ca
  FAIL (tăng từ 1 ở I2) nhưng n=11 ca FAIL vẫn là nhỏ; đây là bằng
  chứng độ sắc ở mức quan sát, chưa phải chứng minh thống kê. Không cần
  săn thêm ca dưới-2,0 trong dải nữa trừ khi muốn nâng n lên mức thống
  kê (cần thêm nhiều phiên, chi phí gate-death cao — xem §7.4).

## 6. Đọc đúng kết quả

- **Bắt FN sớm của luật mới 3/5 (K1) / 9/19 (gộp) vẫn thấp hơn luật cũ
  5/5 / 16/19 — là cái giá đã biết và đã chấp nhận ở E2 §1.** Cả 10 ca
  luật mới "lọt" gộp đều có FN được đo ĐẦY ĐỦ — không có FN nào mất
  khỏi dữ liệu, chỉ mất giết sớm. Đổi lại, luật mới đã tha 15 phiên mà
  luật cũ sẽ giết oan (gộp), trong đó K1 đóng góp 4 ca (S6, S13, S14,
  S15).
- **Luật cũ giết oan mỗi khi re-gate FAIL mà slot1 không FN (trong đợt
  K1: 4/4 ca).** Re-gate FAIL ở K1: 7 ca (cả 7 phiên có JSON đều FAIL)
  — luật cũ sẽ giết cả 7. Trong đó 4 ca là FP (S6/S13 là FN ở slot sau
  nhưng slot1 không FN nên giết-sớm của luật cũ cũng là giết oan ở
  nghĩa xác nhận slot-1; S14/S15 là FP đầy đủ). Luật mới giết đúng 3 ca
  FN thật, tha đúng 4 ca. **Cả 7 phiên K1 đều re-gate FAIL** — tỉ lệ
  FAIL 100% trong đợt này (so với I2: 9/12) phản ánh pha máy tải cao
  kéo dài, không phải luật re-gate đổi tính chất.
- **Burner vẫn không tách được slot1 theo liều lượng — pha máy mới là
  yếu tố quyết định** (nhắc lại H2 §6, I2 §6). Slot1 theo burnerN trong
  K1: plain 3,77 (S13); burner2 3,82 (S6) / 1,81 (S11) / 2,37 (S14);
  burner3 0,39 (S10) / 1,84 (S12) / 2,05 (S15); burner4: S8 0 JSON.
  Cùng burner2 cho 1,81 lẫn 3,82. Dải 1,5–2,5 fps đạt được nhờ pha máy
  + may mắn, không nhờ điều chỉnh burner có kiểm soát. Chặng B (sau
  reboot, tải thấp dần) cho 5/5 phiên có JSON — pha máy tốt quan trọng
  hơn burner.
- **Ngưỡng 30/20/2 GIỮ NGUYÊN.** Không có bằng chứng nào trong K1 buộc
  đổi ngưỡng: delta re-gate FN (n=23, max 183) và khỏe (n=41, min 3)
  vẫn chồng lấn hoàn toàn (§5 §3). Gate 1a delta 21 của S10 và gate
  delta 22 của S12 đều suýt trượt ngưỡng 20, nhưng đó là biên của gate
  vào đo, không phải bằng chứng đổi ngưỡng re-gate 30. Đề xuất đổi
  ngưỡng cần dữ liệu tách sạch — hiện không có.

## 7. Giới hạn trung thực (nợ còn mở sau đợt này)

1. **Độ sắc ngưỡng 2 fps: ĐÃ ĐÓNG ở mức quan sát (n=11 ca FAIL trong
   dải), chưa phải chứng minh thống kê.** Phía dưới trong dải nay có 3
   ca FAIL (1,81 / 1,84 / 1,96, cả 3 giết) thay vì 1 như I2. Muốn chứng
   minh thống kê cần thêm nhiều ca nữa — không khuyến nghị săn tiếp
   trong khuôn khổ vòng lặp thường (chi phí gate-death cao: 64 attempt
   mới được 7 phiên), trừ khi có chủ trương riêng.
2. **Bắt FN sớm của luật mới vẫn thấp hơn luật cũ (9/19 vs 16/19 gộp,
   Wilson [27%, 68%] vs [62%, 94%])** — là đánh đổi đã chấp nhận (E2
   §1): luật mới tha oan 0 FP kiểm duyệt, đổi lại mất giết sớm ở phiên
   FN có slot1 không FN. Không có cơ sở đổi luật từ dữ liệu này.
3. **S7/S8/S9: 0 JSON sau 42 attempt gộp** (S7 23, S8 13, S9 6 — trong
   23 attempt của S7 đã gồm 4 attempt nhiễm Xvfb/EPERM và 2 attempt
   nhiễm đua driver). Chết gate 1a (draw đóng băng 2→4) vẫn là chi phí
   chính của harness: 57/64 attempt không ra phiên. Hiện tượng đã biết
   (E2 §6.3, G2 §3, I2 §7.3), không phải dữ liệu về luật re-gate.
4. **Sóng EPERM tái phát 2 lần trong ca K1** (~18:15–18:22, ~7 phút;
   lần đầu lúc 17:40 probe đã hết): Xvfb không ghi được pid lock
   (file `/tmp/.tX180-lock` 0 byte), harness log EPERM trực tiếp, K8
   probe 18:21:27 fail 2/2. Đây là sóng lặp lại, không phải đã hết hẳn
   (nhắc lại đợt 82: sóng 22:50–23:05 +07). Driver đã dừng đúng luật và
   chạy lại sau khi sóng qua (probe độc lập K7/K8/K1 đều OK).
5. **Hai driver chạy song song 17:59–18:06 do lỗi kill của K1** (bắt
   nhầm launcher shell thay vì script driver). Các attempt trong khoảng
   này (S7 attempt 1–2 lượt 18:01, S8 attempt 4–6) bị NHIỄM — không
   dùng làm bằng chứng sạch; không attempt nào trong số đó ra JSON nên
   không làm lệch số gộp. Bài học đã ghi trong log luồng: kill driver
   phải bắt đúng PID `/bin/bash ./run-all-k1.sh`, verify bằng PID, không
   dùng pattern launcher.
6. **VM REBOOT 2 lần trong ca K1** (~17:27 trước khi bắt đầu, ~18:30
   giữa S7 attempt 4 — roughly mỗi ~1 giờ trong ngày này; I2 cũng gặp
   1 lần): driver chết, /tmp bị xóa, config vite phải tái tạo (md5 khớp
   cả hai lần). Reboot là sự kiện hạ tầng, không phải lỗi harness. Không
   phiên nào mất JSON vì reboot (S7 đang ở pha retry).
7. **FN ở slot sau mà slot1 không FN (S6/S13) vẫn lọt luật mới** ở nghĩa
   giết-sớm — theo thiết kế, không phải bug; FN vẫn đo đầy đủ.
8. **Chưa có thêm bằng chứng về ngưỡng re-gate 30 tách sạch.** Delta FN
   (n=23) và khỏe (n=41) chồng lấn hoàn toàn (§5 §3).
9. **Log harness `E2-SECOND-GATE` vẫn in sai chữ ở nhánh giết** (xem §1)
   — JSON đúng, chỉ wording log sai; để đợt sau sửa.
10. **EPERM: gặp 2 lần trong ca này** (xem §7.4); probe trước đo 6/6 OK
    không bảo đảm sóng không quay lại giữa đợt.
11. Chưa đổi ngưỡng 30/20/2 (xem §6). Không release/tag. Không push (chỉ stage).

## 8. Kiểm chứng

- **Unit test gate: `node --test` 16/16 PASS** (14 cũ + 2 mới K1), chạy
  cuối đợt 19:44 UTC. `node --check` harness + test + analyzer OK.
- **Analyzer:** `tools/analyze-83k1.mjs` chạy cuối đợt không lỗi (exit 0),
  7/7 session JSON K1 + 1/1 session JSON J6 tồn tại và đọc được; số gộp
  E2..J6 tái lập đúng (38 phiên, FN 14, 6/14, Wilson [21%, 67%]) trước
  khi cộng K1; số I2 tái lập đúng (12 phiên, 4/6, Wilson [23%, 71%]).
- **7/7 session JSON K1 tồn tại** (session6, 10–15); session7/8/9 không
  có JSON (chết gate mỗi phiên 6 attempt trong lượt chạy cuối; S7 tổng
  23 attempt qua 5 lượt chạy).
- Config vite md5 khớp 2 lần (`ca5b3c48afd54171d995e74cbadf7215`); harness
  dry-run OK trước đo và sau mỗi lần reboot. Không cần tsc (chỉ script +
  docs, như E2/F2/G2/H2/I2/J6). **Không sửa production.**

## 9. File và log

**Stage (KHÔNG push):** `~/workspace/repo-1-push/paths-loop/phase9-round83-k1-gate-2fps-finish.txt`
- `apps/web/scripts/test_round77_e2_regate_confirm.test.mjs` (sửa: thêm 2 test hồi quy K1)
- `docs/PHASE9_ROUND83_K1_GATE_2FPS_FINISH_LIMITS.md` (mới — file này)

**Không stage:** harness (không đổi), analyzer `tools/analyze-83k1.mjs` +
  driver scripts + log/notes trong goal workspace (nội bộ — như mọi đợt
  gate trước), session JSON/log (dữ liệu đo thô, nội bộ).

**Log luồng:** `~/workspace/goals/capcut-clone-video-editor/hidden_files/round83-k1.md`
**Phiên + notes:** `hidden_files/round83-k1/sessions/session{6..15}/`
  (`presented-fps.json` nếu có, `k1-run.log`)
**Driver log:** `hidden_files/round83-k1/driver-k1.log` (một file duy nhất
  cho cả 5 lượt chạy driver — các lượt chạy lại nối tiếp vào cùng file)
**Tools:** `hidden_files/round83-k1/tools/` (run-session.sh,
  run-all-k1.sh, analyze-83k1.mjs) + `analyze-83k1-pre.txt` (chạy thử
  pre-đo) + `analyze-83k1-output.txt` (cuối đợt)
