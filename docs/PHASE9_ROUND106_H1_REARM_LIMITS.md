# PHASE9_ROUND106_H1_REARM_LIMITS — Re-arm A/B RAM cao (late merge)

> Đợt 106, luồng H1. Late merge: luồng H1 gốc bị reboot #33 (14:50:59Z, gap 19'07")
> cắt ngang trước khi viết LIMITS/batch; mọi số dưới đây được tính lại độc lập
> từ dữ liệu thô đã có trên đĩa, KHÔNG chạy probe live mới.
> KHÔNG push. KHÔNG release/tag. Không sửa production code.

## 1. Kết quả — trigger đạt, nhưng 0/2 lượt hợp lệ → re-arm A/B vẫn MỞ

### 1.1 Watcher (wait-hiram.sh, F5 không sửa) — TRIGGER ĐẠT

| check | thời gian (Z) | avail (kB) | load1 | sibProcs |
|---|---|---|---|---|
| 1 | 14:39:49 | 791.924 | 0,90 | 0 |
| 2 | 14:40:34 | 1.158.252 | 1,00 | 0 |
| 3 | 14:41:19 | 2.227.524 | 2,44 | 0 |
| 4 | 14:42:04 | **2.425.576** | **3,98** | 0 |

Trigger check 4: avail 2.425.576 ≥ 2.400.000 ✓, load1 3,98 < 4,0 ✓, sibProcs = 0 ✓.
Boot lúc watcher start: `75697729-9014-47e0-a0cc-c1aad4926fe5`, `uptime -s` 14:31:52Z.
Watcher PID 6948, poll 45 s × 50 check (dự kiến kết thúc ~15:17:21Z — đã trigger ở check 4
nên dừng sớm, hiram chạy 14:42:04–14:44:38Z).

### 1.2 Lượt f6r — LOẠI (mtime đổi giữa lượt)

- 14:42:04–14:43:08Z, load4, gop 250, clip `o8-ball-720p-6s.mp4`, webkit 27.2.
- RAM đầu lượt 2.417.876 kB (≥ 2.400.000 ✓), load1 3,98.
- 135 samples, 158 velocityTicks, 4 tails. **CAP = 3, ages [5181, 5159, 5007] ms.**
- CAP chi tiết: ended 4705 age 5181 adv 0 drift 0,47 ct 1,3667 ph 0,9 t 9886;
  ended 14414 age 5159 adv 0 drift 0,6 ct 1,8 ph 1,2 t 19573;
  ended 23797 age 5007 adv 0 drift 0,57 ct 2,0667 ph 1,5 t 28804.
  Tail thứ 4 age 4498 ms (< 4800) — gần ngưỡng nhưng không phải CAP.
- rate 0,129; wall 41.191 ms; max freeze 4.866 ms (trong đuôi mở 4.866, ph-adv 571);
  gap max/med 696/230 ms; stopped = true; pageErrs = [].
- Verdict probe: playhead-giữ-trong-seek PASS; playhead-lúc-canvas-đổi-khung PASS
  (seekDone 1366 ms, ph 0,5; canvas change 1700 ms, ph 0,5) — **bị loại theo lượt,
  không được trích làm bằng chứng.**

### 1.3 Lượt f7 — LOẠI (mtime đổi giữa lượt)

- 14:43:11–14:44:36Z, load4, gop 30, clip `o8-ball-720p-6s-gop30.mp4`, webkit 27.2.
- RAM đầu lượt 2.367.940 kB (< 2.400.000 ngưỡng trigger, nhưng ≥ 2.173.000 sàn tối thiểu
  chấp nhận theo G4 §3), load1 đầu lượt **9,51** (rất cao — tải nền 4x + các luồng song song).
- 115 samples, 135 velocityTicks, 2 tails. **CAP = 2, ages [5020, 5111] ms.**
- CAP chi tiết: ended 25500 age 5020 adv 0 drift 1,52 ct 4,258 ph 2,7333 t 30520;
  ended 36321 age 5111 adv 0 drift 0,93 ct 4,8667 ph 3,9333 t 41432.
- rate 0,101; wall 44.512 ms; max freeze 7.315 ms (trong đuôi mở 4.728, ph-adv 681);
  gap max/med 1296/240,0 ms; stopped = false; pageErrs = [].
- Chờ phát tới localPh ≥ 5,0: **HẾT 40 s (chưa đạt)** — playback không đạt mốc trong lượt.
- Verdict probe: PASS/PASS (seekDone 4077 ms, ph 0,5; canvas change 5097 ms, ph 0,5) —
  **bị loại theo lượt, không được trích làm bằng chứng.**

### 1.4 Tổng hợp — KHÔNG có số A/B mới

- CAP đo được (chỉ ghi nhận, **KHÔNG trích làm số A/B**): 5 CAP / 2 lượt = 2,50 CAP/lượt.
  Con số này vô nghĩa để so với baseline f1–f5 (2,80 CAP/lượt): cả 2 lượt đều vi phạm
  tiêu chí cây không đổi (§2), chạy trên cây khác nhau (f6r lai F8/H5, f7 H5-đổi-giữa-lượt),
  khác cây baseline F5 (`ca378bbf`), mẫu n = 2 và đều loại.
- Đối chiếu H9: headline H9 (trigger 2.425.576 kB, load 3,98; f6r 3 CAP + f7 2 CAP;
  cả 2 loại vì H5 sửa preview.tsx) — **tính lại độc lập KHỚP 100%** trên mọi trường
  (n_cap, CAP ages, rate, wall, max freeze/tail/phadv, gap max/med, mtime trước/sau,
  stopped). Bản sao local `probe-results-f6r.json` / `probe-results-f7.json` khớp
  byte-identical (md5 `5daa4f9d…`, `1734359a…`) với file gốc tại
  `round104-f5/probe-webkit-load4-gop250-f6r/` và `round104-f5/probe-webkit-load4-gop30-f7/`.

## 2. Vì sao loại — preview.tsx đổi mtime giữa cả 2 lượt (H5 sửa comment)

| lượt | mtime trước | mtime sau | đổi giữa lượt? |
|---|---|---|---|
| f6r | 2026-11-13T11:52:15.947Z | 2026-11-13T14:42:56.737Z | CÓ |
| f7 | 2026-11-13T14:43:09.257Z | 2026-11-13T14:43:56.519Z | CÓ |

- `FAILED-MTIME-f6r.txt` và `FAILED-MTIME-f7.txt` đều ghi `MTIME-ĐỔI-GIỮA-LƯỢT`.
- Mtime trước của f7 (14:43:09.257Z) ≠ mtime sau của f6r (14:42:56.737Z) → có thêm
  1 lần ghi giữa 2 lượt. Tổng cộng **≥ 3 lần ghi** `preview.tsx` trong cửa sổ
  14:42:56–14:43:56Z.
- Đối chiếu H5 LIMITS (`PHASE9_ROUND106_H5_GHOST_LIMITS.md`): H5 sửa 6 comment
  "0/30 clean" trong `apps/web/src/preview.tsx`, **chỉ comment, không đổi logic**,
  md5 `f0b9e496…` → `ced42efd…` — khớp đúng md5 đầu lượt (f0b9e496, cây G1-land F8 đợt 105)
  và md5 cuối driver log (ced42efd) của H1.
- `preview.tsx` hiện tại (boot 14:50:59Z): md5 `ced42efd785724c8c0d1b16fc32c7341`,
  mtime 14:43:56.518Z = mtime sau của f7.
- Hệ quả: tiêu chí lượt hợp lệ (mtime không đổi trong lượt) vi phạm ở cả 2 lượt →
  **LOẠI cả 2, verdict PASS đi kèm cũng loại**. Việc sửa chỉ là comment KHÔNG cứu được
  lượt: không biết vite dev server đã hot-reload cây mới giữa lượt hay chưa, và 2 lượt
  chạy trên cây khác nhau nên không thể gộp hay so baseline.

## 3. Phương pháp — tính lại độc lập từ dữ liệu thô

- Nguồn duy nhất: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round106-h1/`
  (`wait-hiram.out`, `run-f5-hiram.log`, `probe-log-f6r.txt`, `probe-log-f7.txt`,
  `probe-results-f6r.json`, `probe-results-f7.json`, `cap-pattern-rows.json`,
  `analyze-f6r-f7-cap-pattern.py`, `FAILED-MTIME-f*.txt`, `round106-h1-status.md`,
  `watcher-start.txt`). Không chạy probe live mới.
- Định nghĩa CAP (giống script phân tích F5): nhóm `velocityTicks` thành tail spans theo
  `tail.endedAtMs`; age = t tick cuối − endedAtMs; CAP iff age ≥ 4800 ms VÀ `rearms`
  không tăng ở tick ngay sau span. Code tính lại viết mới, độc lập với
  `analyze-f6r-f7-cap-pattern.py`; kết quả khớp 100% với `cap-pattern-rows.json` trên
  mọi trường (n_cap, caps, cap_details, rate, wall, max_freeze_ms, max_freeze_tail_ms,
  max_freeze_phadv_ms, max_gap_ms, med_gap_ms, n_tails, n_vt, mtime_before, stopped).
- Lưu ý: `cap-pattern-rows.json` có `ram`/`load1` = null (ENV join trong analyze script
  không bắt được từ log driver) — RAM/load1 trong LIMITS này lấy trực tiếp từ
  `run-f5-hiram.log` (dòng `lượt … RAM_kB=… load1=…`).
- Reboot: H1 chạy trên boot `75697729…` (uptime -s 14:31:52Z); reboot #33 lúc 14:50:59Z
  (gap 19'07") cắt ngang trước khi H1 viết LIMITS/batch. Boot hiện tại `63a52041…`,
  uptime -s 14:50:59Z. Số #33 theo lệnh late-merge; số #32 trước đó chưa xác minh độc lập
  (status ghi "nhiều khả năng là #32"; gap #31 11:26:40Z → boot này 3h05'12", dài hơn
  chu kỳ ~2h nên không loại trừ reboot trung gian không quan sát được).

## 4. Giới hạn — những gì KHÔNG làm được

1. **0 lượt A/B hợp lệ → re-arm A/B RAM cao VẪN MỞ.** Không kết luận được RAM cao
   có giảm CAP hay không. Không có số A/B mới nào từ đợt này.
2. Không đo lại; không sửa production code; không đụng file luồng khác.
3. Driver không kiểm lại RAM trước mỗi lượt (nợ G4 §3): f7 bắt đầu ở RAM 2.367.940 kB
   < ngưỡng trigger 2.400.000 — chỉ đạt sàn tối thiểu 2.173.000. Nếu f7 không bị loại
   vì mtime thì vẫn chỉ tính "RAM cao" theo tiêu chí sàn, không phải tiêu chí trigger
   đầy đủ.
4. Điều kiện tải lúc f7 khác hẳn f6r: load1 đầu lượt 9,51 (ngưỡng trigger < 4,0 chỉ áp
   cho lúc trigger, không áp cho lúc bắt đầu từng lượt) và playback không đạt
   localPh ≥ 5,0 trong 40 s; stopped = false.
5. Cây đo đã đổi 2 lần trong đợt: baseline F5 (`ca378bbf`) ≠ cây F8 (`f0b9e496`)
   ≠ cây H5 (`ced42efd`). Mọi so sánh CAP/lượt chéo cây đều nhiễu.
6. `cap-pattern-rows.json` thiếu RAM/load1 (null) — đã bù bằng log driver (§3).

## 5. Nợ mở / kế hoạch đợt sau

1. **Re-arm A/B RAM cao — chạy lại toàn bộ:** watcher + f6r/f7 trên cây ĐÓNG BĂNG
   (cấm mọi luồng khác sửa `preview.tsx` trong cửa sổ đo; tốt nhất chạy khi không có
   luồng song song nào đụng `preview.tsx`, hoặc đo trên cây đã land ổn định).
   Cần ≥ 2 lượt hợp lệ cùng cây mới so được với baseline 2,80 CAP/lượt (f1–f5).
2. **Vá driver (G4 §3):** kiểm lại RAM trước mỗi lượt; ghi RAM/load1 đầu mỗi lượt
   vào JSON (đừng để ENV join null như lần này).
3. Ghi mtime/md5 `preview.tsx` vào từng lượt (đã có) + cảnh báo/khóa nếu có luồng khác
   đang sửa cùng file trong cửa sổ đo.
4. G1 vẫn mở, chờ user quyết metric (nợ đợt 105) — không thuộc H1.

## 6. File / stage

- LIMITS này: `docs/PHASE9_ROUND106_H1_REARM_LIMITS.md`
- Dữ liệu gốc: `hidden_files/round106-h1/` (watcher log, run log, probe log/JSON,
  `cap-pattern-rows.json`, analyze script, FAILED-MTIME, status) — ngoài repo,
  không stage qua paths-loop; bản sao probe JSON khớp md5 với file gốc round104-f5.
- Batch stage (KHÔNG push): `repo-1-push/paths-loop/phase9-round106-h1-rearm.txt`
  — LIMITS-only, NUL-delimited, đã verify read-back.
