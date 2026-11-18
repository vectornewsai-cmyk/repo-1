# LIMITS — Phase 9 đợt 123 T1: E4BATCH lượt 3 att3 (A, gop250, e4a3) trên cây BASELINE

> Đo thật, không code giả. Lượt đếm ĐẦU TIÊN trên cây baseline.
> Verdict lượt: **VOID (đếm được)**. Lô E4BATCH: **2/10** (0 CAUGHT, 2 VOID).

## 1. Kết quả — lượt 3 att3: VOID

- Probe `probe116s1.mjs` (giữ nguyên, không sửa), engine WebKit,
  loadN=0, gop=250, clip `o8-ball-720p-6s.mp4`, phase `e4a3`.
- Probe chạy 14:50:14–14:50:48Z, **exit=0** (34 s). Pause-seek tới
  t=5: confirmed=true (tElement 781 ms, tCanvas 897 ms). Phát sau
  seek tới cuối tự nhiên (localPh=6) + 10 s quan sát.
- Số đo thật (probe-results.json, đã copy về
  `hidden_files/round123-t1/probe-webkit-load0-gop250-e4a3/`):
  velTicks=428, sampler=133, renderTicks=74, raf=135, rvfc=0,
  pageErrs=0.
- **tailSteadyClosed = 0 → VOID** (prereg §4: 0 steady-close trong
  toàn bộ 180 s, probe exit 0 — ĐẾM vào lô, không retry vì kết quả
  seek).
- resyncsV chỉ đổi ở tick 5 (seek ban đầu), restartV cuối=0.
  Sampler chỉ bắt 1 seeking run (samples 0..2, relMs 129..342,
  213 ms — seek ban đầu).
- Drift recount sau seek ban đầu (prereg §3, kiểm tay): vượt
  >0,35 = **0 lần**; max 0,1475, min −0,0667; tailBursts cuối 0;
  10 tick cuối drift toàn 0 (ct=ph=6).
- Probe verdict nội bộ: playhead-giữ-trong-seek PASS;
  playhead-lúc-canvas-đổi-khung PASS.

## 2. Tính hợp lệ của lượt đếm

- Cây đo: preview.tsx md5 `03bf029f09b8890b285eacc10a02172b`
  (BASELINE) trước=sau; media.ts
  `2c384ed13703809d5e999311147745e7`. H3f đã gỡ 12:02:56Z đợt 122,
  **không apply lại**. Không sửa production (preview.tsx mtime
  12:02:56Z không đổi giữa lượt).
- Boot `9bbda390-bd64-4679-a1ff-3619899cee7d` (#66 tạm, chờ T6 xác
  nhận số) không đổi trước=sau; không reboot giữa lượt.
- Lock v2 cổng 5590: wait 0 s, hold 35 s, RELEASED 14:50:49Z
  (ticket 1-1794840614014546337-13435-t1-round123). Cờ cây
  NO-CHANGE. Không DEFER, không KILLED.
- Postboot PASS sau 4 phút chờ cờ T5 đợt 123 (14:46:13→14:50:13Z):
  replay boot #66 cài thật, KHÔNG repair — apt-get update pid 813
  chạy 14:35–~14:45Z (xong, không kẹt), installs 14:45:33–14:48:19Z,
  dpkg.log 2→1509 dòng, gói cuối gstreamer1.0-tools 14:48:19Z
  (boot +23m36); postboot FAIL 14:45:27Z → PASS 14:48:41Z. T5 ghi
  POSTBOOT_FAIL rồi POSTBOOT_PASS cùng 14:49 (FAIL đã hết hiệu lực
  theo ghi chú trong POSTBOOT_PASS).

## 3. Ghi chú trung thực

- **Transient tick 3 không phải re-seek:** tick 3 drift 4,5
  (ct=5, ph=0,5) xảy ra TRƯỚC seek ban đầu (tick 5), không kèm đổi
  resyncsV; tick 4 đã về 0,5/0,5. Recount §3 chỉ tính tick SAU
  seek ban đầu nên không tính tick này. Không làm đổi verdict VOID.
- **Pause-seek chậm hơn lượt 2:** tElement/tCanvas 781/897 ms
  (lượt 2 trên H3f: 157/207 ms) — vẫn confirmed, nhưng chênh lệch
  này chưa được giải thích (có thể do tải hệ thống lúc probe:
  load 2,84 lúc bắt đầu; replay vừa cài xong). Không suy diễn
  thêm; ghi lại để đối chiếu các lượt sau.
- **VOID này không chứng minh E4 vắng mặt tuyệt đối** — chỉ chứng
  minh trong 1 lượt A gop250 trên cây baseline, 428 tick, không
  quan sát được steady-close nào. Cần đủ 10 lượt mới kết luận lô.
- **Không gộp với lượt 2:** lượt 2 VOID đo trên cây H3f; số lượt 3
  này thuộc loạt baseline. Verdict H1/H3 cần cặp A+B
  CAUGHT-RESEEK trên CÙNG cây — chưa có.
- Không đo TTS 39, không thử birefnet (u2net là fallback chính
  thức). Không chạy lại tsc/vite build: cây không đổi một byte
  (md5 trước=sau, mtime không đổi) và probe đã khởi động vite dev
  + WebKit thành công trên chính cây này — chạy lại tsc chỉ xác
  minh lại cây đã xác minh.

## 4. Hạ tầng — điểm sáng sau 3 đợt DEFER liên tiếp

- Đây là lần đầu tiên sau boot #60/#63/#64/#65, replay của boot
  mới hoàn thành thật và T5 ghi cờ PASS đúng lúc (4 phút chờ thay
  vì 60 phút DEFER). Dạng lỗi (C) "sống nhưng kẹt ở apt-get
  update" KHÔNG xuất hiện ở boot #66 (apt-get update xong trong
  ~10 phút, không cần repair).
- Số hiệu boot #66 vẫn là tạm (T5 ghi "TEMPORARY number", gap
  #65→#66 1h31m18s) — chờ T6 đợt 123 xác nhận lại theo mù #37.

- **REBOOT SAU LƯỢT (không ảnh hưởng verdict):** boot đổi sang
  `94e29be5…` lúc 14:52:19Z (gap 27'36" sau boot #66) — SAU khi
  driver kết thúc (14:51:04Z). Boot trước=sau TRONG lượt vẫn là
  `9bbda390…`. Reboot giết driver T2 đợt 123 đang chờ cờ ở giai
  đoạn 0 (T2 đã tự chạy lại lúc 14:55Z trên boot mới); T5 đã
  chuyển sang theo dõi boot mới (b67, watcher chạy từ 14:54Z).
  Số hiệu boot mới chờ T6 xác nhận (dự kiến #67).

## 5. Việc tiếp theo

- Lượt 4 (B, gop30, phase `e4b4`): T2 đợt 123 đang chờ cờ
  `round123-t1.done` (tối đa 2 giờ), đo trên cây baseline.
- Lô E4BATCH: 2/10 (lượt 2 VOID trên H3f; lượt 3 VOID trên
  baseline). Còn 8 lượt đếm nữa mới đủ lô (hoặc cặp A+B
  CAUGHT-RESEEK để quyết H1/H3 sớm).

## 6. File liên quan

- Prereg: `workspace/goals/capcut-clone-video-editor/hidden_files/round123-t1/prereg-e4batch-luot3.md`
- Driver + log: `.../round123-t1/run-t1.sh`, `run-t1.log`, `run-t1-driver.out`
- Analyzer: `.../round123-t1/analyze-t1.py` (logic y hệt đợt 122)
- Số thô: `.../round123-t1/probe-webkit-load0-gop250-e4a3/probe-results.json`
- Sổ cái: `.../round118-t9/e4batch-ledger.md` (đã thêm hàng lượt 3 att3)
- Cờ T5: `.../round123-t5/POSTBOOT_PASS` (+ POSTBOOT_FAIL đã hết hiệu lực)
