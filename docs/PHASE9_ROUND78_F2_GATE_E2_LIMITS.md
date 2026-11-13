# PHASE 9 — ĐỢT 78, LUỒNG F2: Gate re-gate giết oan (nợ §4.2 đợt 77)

> Đóng nợ §4.2 trong `docs/PHASE9_ROUND77_LIMITS.md`: luật confirm mới
> **GIẾT ⟺ re-gate FAIL (delta < 30) ∧ slot 1 là FN (draw < 2 fps)**.
> Ngưỡng 30/20/2 fps giữ nguyên.
> Harness chuẩn mới thay Z3 launcher: `apps/web/scripts/measure-78f2-gate-harness.mjs`.
> Ngày: 2026-11-09/10 (UTC). Deadline luồng: 02:35 UTC 10/11 (09:35 +07).

## 0. Kết luận (đọc trước)

1. **Lần giết thật đầu tiên của luật mới: CHƯA XẢY RA.** Trong 5 phiên chuẩn
   hoàn chỉnh của F2 (session5–9) không có phiên FN nào (0/5), re-gate đều
   PASS (delta 36/94/107/89/87), cả hai luật đều tha. Không có bằng chứng
   mới nào về khả năng bắt FN của luật mới ngoài 1 phiên FN của E2.
2. **Gộp E2+F2 (9 phiên luật mới):** FN 1/9, luật mới bắt FN sớm **0/1**,
   FP kiểm duyệt (slot-1-only) **0**, phiên được luật mới tha khỏi giết oan
   (sparedByConfirm) **1** (E2-S1: re-gate delta 2 FAIL nhưng slot1 2,92 fps
   không FN — luật cũ giết, luật mới tha; FN vẫn được đo đầy đủ ở slot 2–3).
3. **Ngưỡng GIỮ NGUYÊN 30/20/2.** Dữ liệu gộp 25 phiên: delta re-gate ở
   phiên FN (n=5): 2, 17, 18, 21, 75; ở phiên khỏe (n=20): 4, 18, 27, 36,
   41, 44, 49, 52, 82, 87, 89, 94, 107, 137, 149, 191, 206, 228, 244, 273.
   Max FN (75) > min khỏe (4) — **chồng lấn, không có ngưỡng tách sạch**.
   FN gộp 10/74 slot (14%), Wilson 95% [8%, 23%].
4. **Mục tiêu ≥10 phiên CHƯA ĐẠT:** chỉ 5 phiên hoàn chỉnh + 1 phiên
   log-only (session10) vì (a) bão tải giết 24 lần gate-1a liên tiếp đầu
   đợt, (b) từ ~01:35 UTC sóng EPERM/xkb làm Xvfb không khởi động được —
   32 attempt foreground cuối đợt (8 phiên × 4) đều chết ở Xvfb, load máy
   chỉ 0,2–1,3. Đối chứng A/B luật cũ (session11–12, `E2_REGATE_CONFIRM=0`)
   và burner (session13) **chưa chạy được lần nào trên máy thật** — chỉ
   được kiểm chứng bằng unit test + dry-run (xem §5).
5. Harness chuẩn + test: **`node --test` 16/16 PASS** (E2 10 + F2 6),
   dry-run exit 0 cả confirm BẬT/TẮT.

## 1. Harness chuẩn F2 (thay Z3 launcher)

- `apps/web/scripts/measure-78f2-gate-harness.mjs` (58.554 byte):
  sinh từ variant dry-run của launcher E2 (27 thay thế, mỗi thay thế khớp
  đúng 1 lần) qua `hidden_files/round78-f2/tools/build-harness.mjs`.
  Diff variant→harness CHỈ gồm: header F2, import `decideRegateKill` từ
  `./gate-regate-confirm.mjs` (bỏ đoạn inject decide inline), cổng
  5578/9678 (E2: 5574/9674), `/tmp/round78-f2`, config
  `vite.f2-presented.config.cjs`, khối `F2_DRY_RUN`. **Toàn bộ logic đo
  (gate 1a, slot, re-gate, resume-probe, đối chứng tab trắng) giữ nguyên
  100%.** Không còn string-surgery (mảng REPS) hay import data-URL.
- `gate-regate-confirm.mjs` **không đổi** từ đợt 77 (đã stage ở đợt 77,
  không stage lại ở đây).
- `apps/web/scripts/test_round78_f2_gate_harness.test.mjs` (7.178 byte,
  6 test): import trực tiếp, không decide inline, không data-URL, hằng số
  (cổng/ngưỡng 30/cờ confirm), live `F2_DRY_RUN` spawn (exit 0, cờ đúng),
  `E2_REGATE_CONFIRM=0` lật confirm thành false, hồi quy trên 16 phiên
  lịch sử + 4 phiên E2, hình dạng lần giết thật đầu tiên (mẫu D5-S1).
- Vite config `/tmp/round78-f2/vite.f2-presented.config.cjs`: 1.726 byte,
  md5 `ca5b3c48afd54171d995e74cbadf7215` — khớp A6/B8/C4/E2. Gen lại 1 lần
  sau khi VM reboot xóa /tmp; md5 vẫn khớp.
- Analyzer `hidden_files/round78-f2/tools/analyze-78f2.mjs` (không stage):
  kế thừa `analyze-77e2.mjs`, thêm thư mục F2 + mục §1c + gộp E2+F2.
  Chạy offline trên JSON đã đo (không đo mới, không Chrome).
- Kiểm chứng (2026-11-09 ~23:46 UTC): `node --test` E2 (10) + F2 (6) =
  **16/16 PASS**; `node --check` harness OK; `F2_DRY_RUN=1` exit 0 cả
  confirm BẬT và TẮT. Không cần tsc (chỉ script + docs, như E2/D5).
- Môi trường: VM 4 vCPU EPYC 9D25 (RESULTS.md còn ghi 2 vCPU 7D13 — nhãn
  cũ), cell 1,5 CPU chia sẻ, ~8 GB RAM. Chrome
  `~/.cache/ms-playwright/chromium-1254`. Media
  `/home/hatch/workspace/.scratch-r61r3-1cOf/media`.

## 2. Phiên đo F2 (luật mới, confirm BẬT, plain trừ khi ghi khác)

Gate 1a = 6 s, delta ≥ 20 mới PASS. Re-gate = 6 s sau slot 1, ngưỡng 30.
FN = slot draw < 2 fps. Tất cả giờ UTC; giờ +07 = UTC + 7.

| Phiên | Gate 1a | Slot draw fps | Presented (mean) | Re-gate | Slot1 FN | Luật cũ | Luật mới | Kết quả |
|---|---|---|---|---|---|---|---|---|
| S5 (att. 3) | 21 PASS | 4,50 / 4,46 / 4,71 | 30,41 | 36 PASS | không | tha | tha | exit 0, JSON 147.855 B |
| S6 (att. 2) | 36 PASS | 12,27 / 14,53 / 15,59 | 30,20 | 94 PASS | không | tha | tha | exit 0, JSON 146.412 B |
| S7 (att. 1) | 34 PASS | 12,19 / 16,46 / 13,46 | 30,04 | 107 PASS | không | tha | tha | exit 0, JSON 147.052 B |
| S8 (att. 1) | 26 PASS | 13,27 / 13,20 / 12,89 | 30,01 | 89 PASS | không | tha | tha | exit 0, JSON 148.927 B |
| S9 (att. 1) | 32 PASS | 14,07 / 13,41 / 12,61 | 29,84 | 87 PASS | không | tha | tha | exit 0, JSON 148.626 B |
| S10 (att. 1, log-only) | 28 PASS | 13,05 / … | — | 109 PASS | không | tha | tha | **chết ở resume-probe** (CDP timeout 60 s), KHÔNG có JSON |

Chi tiết:

- **S5** là phiên đầu tiên qua gate sau bão (xem §3). Gate sát ngưỡng
  (21 ≥ 20), slot draw chỉ ~4,5 fps (dưới tải dư), presented vẫn ~30,4 —
  khỏe, không FN. Re-gate 36 là delta khỏe thấp nhất đợt F2 (cách ngưỡng
  30 chỉ 6 draws).
- **S6–S9** khỏe rõ: slot 12–16 fps, presented ~30, re-gate 87–107.
  Đối chứng tab trắng: 19,8 / 24,3 / 24,3 / 23,6 / 22,1 fps.
- **S10** (01:32–01:33 UTC): qua gate 28 + re-gate 109, slot1 13,05 fps,
  rồi chết ở resume-probe với `CDP.send timeout 60s: Runtime.evaluate` —
  **không có JSON, chỉ có log** (`session10/f2-run.log`, 6.318 byte).
  5 attempt redo sau đó đều chết ở Xvfb (xem §4). S10 tính là phiên
  log-only, KHÔNG gộp vào analyzer (analyzer chỉ đọc JSON).
- **Session1–4: 24 lần chết gate-1a liên tiếp, 0 phiên hoàn chỉnh** (xem §3).
- **Session11–13, 16–19: 0 phiên hoàn chỉnh** — 32 attempt foreground
  cuối đợt đều chết ở Xvfb (xem §4). Session11–12 là đối chứng A/B luật
  cũ (confirm=0), session13 là burner — cả ba **chưa có số đo thật nào**.

## 3. Bão gate-1a + reboot (23:47 UTC 09/11 – 01:17 UTC 10/11)

- Driver 1 bắt đầu 23:47:02 UTC. Session1: 6 attempt, delta 12, 2, 2,
  timeout (chờ project mẫu + hook), 2, 17 — chết cả khi tải thấp
  (load 2,31 / 2,94 / 1,48). Bỏ qua.
- **VM reboot ~00:06–00:07 UTC 10/11** (uptime 9 phút lúc 00:15): giết
  driver + harness + vite + chrome giữa session2 attempt 1, xóa /tmp.
  Driver khởi động lại 00:16:49, bỏ qua session1, ngân sách 40 lượt mới.
- Session2: 6 attempt, delta 2, 2, 2, 3, 2, timeout. Session3: 6 attempt
  (2, 2, timeout ở clip-patch, 10, 17, 3). Session4: 6 attempt (4, 3, 2, …).
- Nguyên nhân: 3 tiến trình `yes` (PID 4738–4740, burner của luồng khác,
  chạy ~00:11–01:17 UTC, ~66 phút) + bgremove u2net + tsc + ffmpeg +
  Chrome các luồng khác bóp cell 1,5 CPU. Draw đóng băng 2→4 trong 6 s
  dù element vẫn decode (q.total tăng, ct chạy) — cùng chữ ký E2 §6.
- Driver tạm dừng 00:44 UTC để giữ ngân sách; probe tay 00:48 delta 2
  (load lúc bắt đầu 0,84), 00:56 delta 14 (đang hồi) — chứng minh **chờ
  tải thấp không giúp qua gate** trong bão.
- Bão tan sau khi `yes` dừng ~01:17 UTC. Session5–9 hoàn chỉnh 01:21–01:31.
- Bài học ghi lại: gate-1a chết hàng loạt dưới bão tải là hiện tượng đã
  biết (E2 §6); số attempt chết gate không phải dữ liệu về luật re-gate —
  chúng không vào analyzer.

## 4. Sóng EPERM / xkbcomp — Xvfb chết từ ~01:35 UTC đến hết đợt

- Từ ~01:35 UTC: `tee` append lỗi `Operation not permitted`; file tạo ra
  0 byte; Xvfb không khởi động được. Driver `run-all.sh` (PID 18130)
  chết im giữa 01:40:28–01:42:22 UTC, không có dòng log cuối; **không có
  reboot** (uptime liên tục, 1:37 lúc 01:43:41 UTC).
- Session11: 6 attempt, không JSON, `f2-run.log` 0 byte (log bị EPERM ăn
  hết — delta gate không khôi phục được). Session12 attempt 1 cũng mất.
- Chẩn đoán foreground 01:49–02:02 UTC: harness lỗi
  `Xvfb :180 không lên sau 15s` ngay cả khi load 0,48. Gốc: xkbcomp
  không đóng được `/var/lib/xkb/server-<display>.xkm`
  (`Cannot close ... properly (not enough space?)`) →
  `XKB: Failed to compile keymap` → `Failed to activate virtual core
  keyboard`. Thử nghiệm ghi file: Python ghi lỗi EPERM cả khi chỉ 100
  byte; Node `writeFileSync` lúc được lúc không (OK 1.000 byte lúc
  01:55:03, FAIL ×5 lúc 01:56:38); bash redirect OK; tee OK lúc 01:55:21;
  `setxkbmap -print > file` 0 byte trong khi pipe sang `head` vẫn in
  được. **Khối ghi bật/tắt theo từng chục giây, không thuần theo tiến
  trình** — kết luận "phụ thuộc tiến trình" ban đầu đã bị bác bỏ bằng
  test lặp 5/5 FAIL cho cả setxkbmap lẫn node cùng một lúc.
- `/tmp` tmpfs còn 507M trống (2% dùng); `/var/lib/xkb` còn 7,4G trống;
  overlay root 2% dùng — **không phải hết dung lượng**. Cùng chữ ký đợt
  EPERM 09/11 (ghi 0 byte).
- Workaround đã thử và THẤT BẠI: `Xvfb -kb` (tùy chọn không nhận);
  `Xvfb -extension XKEYBOARD` (không tắt được lúc chạy). Harness hỗ trợ
  env `R8_DISPLAY` nhưng vẫn spawn Xvfb mới trên display đó (dòng 551),
  nên không dùng chung Xvfb của luồng khác được. Kiểm tra 02:02 UTC: mọi
  display khác đều đã chết (socket X170/X171/X191/X197 mồ côi, không còn
  tiến trình Xvfb nào) — không còn display sống để dùng chung.
- Strace xkbcomp không bắt được (strace không tạo được file log vì EPERM;
  strace qua pipe chỉ thấy execve của chính Xvfb). Test O_TMPFILE không
  kết luận được (Node trả EISDIR — cờ không truyền đúng qua fs.openSync).
- Driver retry nền `run-retry.sh` (bắt đầu 01:57:13 UTC, 7 phiên × 6
  attempt) cũng **chết im ~02:00–02:04 UTC** như `run-all.sh` trước đó —
  hai driver nền đều chết im trong sóng EPERM, nguyên nhân chưa rõ.
  (Ghi chú: `pkill -f "Xvfb :180"` từng giết luôn shell của chính mình vì
  pattern khớp dòng lệnh — dùng kill theo PID hoặc pattern có ngoặc.)
- **Vòng lặp foreground cuối đợt (02:04:52–02:15:15 UTC):** 8 phiên
  (11, 12, 13, 10, 16, 17, 18, 19) × 4 attempt = **32 attempt, tất cả
  chết ở `Xvfb :180 không lên sau 15s`**, load 0,21–1,30 (máy gần như
  rỗi). JSON cuối cùng vẫn 5. Đây là bằng chứng Xvfb/xkbcomp lỗi **liên
  tục ~40 phút**, không chỉ là sóng ghi chập chờn.
- Hệ quả: không thể đo thêm phiên nào trong đợt này cho đến khi môi
  trường hồi phục (reboot VM hoặc sóng EPERM tự hết như đợt 09/11).
  **Không đổi sang headless** để lách: số đo headless không so sánh được
  với chuỗi phiên headed đã hiệu chuẩn ngưỡng 20/30.

## 5. Kết quả gộp (analyzer `analyze-78f2.mjs`, chạy 02:13 UTC)

Chạy: `node analyze-78f2.mjs` trên JSON của Z3/Y3/A6/B8/C4/D5/E2/F2.
FP kiểm duyệt = giết phiên có slot1 không FN (chỉ slot 1 làm ground
truth vì phiên chết ở re-gate không đo slot 2–3). FP ground-truth đầy đủ
= giết phiên không có slot FN nào.

### §1 — Tất cả các đợt (25 phiên có JSON)
- FN 7/65 slot; phiên FN 5/25; luật cũ bắt được 4/5.
- FP ground-truth đầy đủ: **0/17** phiên không FN, Wilson 95% [0%, 18%].
- FP kiểm duyệt (phiên chết ở re-gate): **3/3** — đây là 3 FP mà E2/F2
  được lập ra để triệt (C4-S3, D5-S2, D5-S3: re-gate FAIL ở phiên khỏe,
  delta 4/27/18).

### §1b — Riêng E2 (luật mới, 4 phiên)
- Phiên FN: 1/4; bắt FN sớm: luật cũ 1/1 → luật mới **0/1** (GIẢM — xem
  ghi chú E2-S1 dưới đây).
- FP kiểm duyệt: luật cũ 1 → luật mới **0**. FP đầy đủ: 0 → 0.
- Phiên được luật mới tha (sparedByConfirm): **1**.
- E2-S1 là trường hợp kép, ghi rõ hai cách đọc: (a) theo hạch toán lúc
  quyết định (chỉ slot 1): slot1 2,92 fps không FN, re-gate delta 2 FAIL
  → luật cũ giết một phiên có slot1 không FN = FP tránh được; (b) theo
  ground truth đầy đủ (3 slot): phiên LÀ FN (slot 2: 0,39 fps, slot 3:
  1,87 fps) → luật cũ "bắt đúng", luật mới "lọt" ở nghĩa giết-sớm — NHƯNG
  FN vẫn được đo đầy đủ (slot 2–3 + resume-probe đều stall), chỉ tốn
  thêm ~40 s đo thay vì giết sớm. **Không có FN nào mất khỏi dữ liệu.**

### §1c — Riêng F2 (harness chuẩn, luật mới, 5 phiên + 0 đối chứng)
- Phiên FN (luật mới): **0/5**; bắt FN sớm: luật cũ 0/0 → luật mới 0/0
  (không giảm — không có FN để bắt).
- FP kiểm duyệt: luật cũ 0 → luật mới 0. FP đầy đủ: 0 → 0.
- Phiên được luật mới tha: **0**.
- **LẦN GIẾT THẬT ĐẦU TIÊN của luật mới: CHƯA XẢY RA trong đợt F2**
  (không phiên FN nào có slot1 FN + re-gate FAIL).
- Đối chứng A/B luật cũ (`E2_REGATE_CONFIRM=0`): **0 phiên**, FN 0,
  luật cũ giết 0 phiên.
- Burner (session13): **0 phiên**, FN 0.
- **GỘP E2+F2 (luật mới): 9 phiên, FN 1, bắt FN sớm luật mới 0/1, FP
  kiểm duyệt luật mới 0, tha oan 1.**

### §2 — Tỉ lệ FN gộp + hiệu chuẩn ngưỡng
- FN gộp (V4 P1/P2 + X2 S4 + Y3 + Z3 + A6 + B8 + C4 + D5 + E2 + F2):
  **10/74 slot (14%)**, Wilson 95% [8%, 23%]. Lưu ý: FN là hiện tượng
  theo PHIÊN (tập trung ở phiên lạnh/tải); tỉ lệ gộp theo slot chỉ có ý
  nghĩa khi các phiên tương đương nhau, mà chúng không tương đương.
- Delta re-gate ở phiên FN (n=5): **2, 17, 18, 21, 75**.
- Delta re-gate ở phiên không FN (n=20): **4, 18, 27, 36, 41, 44, 49,
  52, 82, 87, 89, 94, 107, 137, 149, 191, 206, 228, 244, 273**.
- Max delta FN = 75; min delta khỏe = 4; khoảng trống (gap) = (75, 4] —
  **CHỒNG LẤN, không có ngưỡng tách sạch. Không đề xuất đổi ngưỡng.**
- Riêng F2: delta re-gate khỏe 36–107, min 36 (S5) — vẫn trên ngưỡng 30,
  nhưng chỉ cách 6 draws.

## 6. Giới hạn trung thực (nợ còn mở sau đợt này)

1. **Chưa quan sát lần giết thật đầu tiên của luật mới.** Cần phiên FN
   có slot1 FN + re-gate FAIL. F2 có 0 phiên FN; E2 có 1 phiên FN nhưng
   slot1 không FN (2,92 fps) nên luật mới tha. Đây là câu hỏi trung tâm
   của đợt và vẫn chưa có đáp án đo thật.
2. **Đối chứng A/B luật cũ chưa chạy live lần nào.** Cờ
   `E2_REGATE_CONFIRM=0` chỉ được kiểm chứng bằng unit test (test F2:
   lật confirm thành false) + dry-run (exit 0). Chưa có phiên
   confirm=0 nào chạy qua Chrome thật để chứng minh luật cũ vẫn giết
   khi re-gate FAIL (kỳ vọng: session11–12 sẽ cho thấy điều này khi
   môi trường hồi phục).
3. **Burner chưa chạy.** Session13 (Y3_BURNER=1) chưa có số đo thật;
   E2-S3 là burner duy nhất từng đo (slot1 6,29 fps dưới burner, re-gate
   49 PASS — burner không đủ mạnh để gây FAIL).
4. **Mục tiêu ≥10 phiên: chỉ đạt 5 hoàn chỉnh + 1 log-only.** Thiếu 5
   phiên plain nữa. Nguyên nhân là môi trường (bão tải + EPERM/xkb),
   không phải harness.
5. **Session10 chết ở resume-probe (CDP timeout 60 s)** — lần đầu
   resume-probe chết kiểu này sau khi qua cả hai cửa. Không rõ là do
   EPERM (CDP evaluate bị chặn?) hay Chrome treo thật; log không đủ để
   phân biệt. Không gộp S10 vào analyzer (không JSON).
6. **Ngưỡng 30 vẫn là lựa chọn "giữa vùng chồng lấn", không phải ngưỡng
   tách sạch.** B8-S1 (FN, slot1 1,79 fps) có re-gate delta 75 PASS —
   FN lọt qua cả luật cũ lẫn luật mới. C4-S3 (khỏe) có delta 4 FAIL —
   FP mà luật mới triệt được nhờ slot1 không FN. Hai trường hợp này cho
   thấy re-gate delta đơn thuần không phân biệt FN/khỏe; luật confirm
   chỉ sửa được phía FP, không sửa được phía FN lọt.
7. **Driver nền chết im trong sóng EPERM** (run-all.sh ~01:41,
   run-retry.sh ~02:02) — nguyên nhân chưa rõ, cần điều tra riêng nếu
   còn dùng driver nền trong môi trường này. Vòng lặp foreground (exec
   trực tiếp, output qua stdout) là cách chạy tin cậy trong sóng EPERM.
8. VM đã là 4 vCPU EPYC 9D25; các doc cũ ghi 2 vCPU 7D13 cần cập nhật
   nhãn khi có dịp (không thuộc phạm vi F2).

## 7. Lệnh kiểm chứng đã chạy

```sh
# Harness + test (2026-11-09 ~23:46 UTC)
node --check apps/web/scripts/measure-78f2-gate-harness.mjs   # OK
node --test apps/web/scripts/test_round78_f2_gate_harness.test.mjs \
  apps/web/scripts/test_round77_e2_regate_confirm.test.mjs        # 16/16 PASS
F2_DRY_RUN=1 node apps/web/scripts/measure-78f2-gate-harness.mjs  # exit 0 (confirm BẬT)
E2_REGATE_CONFIRM=0 F2_DRY_RUN=1 node apps/web/scripts/measure-78f2-gate-harness.mjs  # exit 0 (confirm TẮT)

# Analyzer (2026-11-10 02:13 UTC) — offline trên JSON đã đo
node hidden_files/round78-f2/tools/analyze-78f2.mjs           # §1/§1b/§1c/§2 như §5 trên

# Vòng lặp foreground cuối đợt (02:04:52–02:15:15 UTC)
# 8 phiên × 4 attempt = 32 attempt, tất cả: "HARNESS LỖI: Xvfb :180 không lên sau 15s"
# JSON cuối cùng: 5 (session5–9)
```

## 8. Việc tiếp theo (cho đợt sau, khi môi trường hồi phục)

1. Chạy bù 5 phiên plain (đủ 10) + 2 đối chứng A/B (session11–12) +
   1 burner (session13) bằng harness chuẩn này — ưu tiên đối chứng A/B
   vì chúng là bằng chứng duy nhất còn thiếu cho việc luật cũ vẫn giết.
2. Mục tiêu chính vẫn là **quan sát lần giết thật đầu tiên của luật
   mới** (cần phiên FN có slot1 FN). FN hiếm ở phiên ấm (0/5 F2, 1/4 E2)
   — cân nhắc phiên lạnh sau reboot để tăng tỉ lệ gặp FN (A6-S1 đã tái
   hiện FN lạnh: slot1 0,77 fps, re-gate 21 FAIL → luật mới GIẾT ĐÚNG
   theo tính toán lại, nhưng đó là tính toán lại từ dữ liệu luật cũ, chưa
   phải lần giết thật đo trực tiếp bằng luật mới).
3. Điều tra riêng: vì sao driver nền chết im trong sóng EPERM; vì sao
   xkbcomp không đóng được .xkm trong khi Node ghi cùng thư mục lúc
   được lúc không.
4. Không đổi ngưỡng 30/20/2 cho đến khi có thêm phiên FN (đặc biệt là
   phiên FN có slot1 FN) để tách vùng chồng lấn.
