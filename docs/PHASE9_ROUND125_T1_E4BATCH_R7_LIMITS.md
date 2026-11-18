# LIMITS — Phase 9 đợt 125 T1: E4BATCH lượt 7 att1 + att2 (A, gop250, e4a7) trên cây BASELINE

> Đo thật, không code giả. Lượt đếm được trên cây baseline.
> Verdict lượt 7: **VOID (đếm được, att2)**. Lô E4BATCH: **6/10**
> (0 CAUGHT, 6 VOID).

## 1. Kết quả — lượt 7 att2: VOID

- Probe `probe116s1.mjs` (giữ nguyên, không sửa), engine WebKit,
  loadN=0, gop=250, clip `o8-ball-720p-6s.mp4`, phase `e4a7`.
- Probe chạy 20:59:51–21:00:51Z, **exit=0** (60 s). Pause-seek tới
  t=5: confirmed=true (tElement 1806 ms, tCanvas 1871 ms — **chậm
  nhất từ trước tới nay**, vượt lượt 5 att2 1423/1473 ms). Phát sau
  seek tới cuối tự nhiên (localPh=6) + 10 s quan sát.
- Số đo thật (probe-results.json, đã copy về
  `hidden_files/round125-t1/probe-webkit-load0-gop250-e4a7/`,
  md5 `776a67604eb7307defc3e9f409bd7713` khớp bản gốc round116-s1):
  velTicks=292, sampler=150, renderTicks=73, raf=114, rvfc=0,
  pageErrs=0.
- **tailSteadyClosed = 0 → VOID** (prereg §4: 0 steady-close trong
  toàn bộ 180 s, probe exit 0 — ĐẾM vào lô, không retry vì kết quả
  seek).
- resyncsV chỉ đổi ở tick 3 (seek ban đầu, ct=ph=0,5),
  restartV cuối=0 (KHÔNG có resync/restart cuối clip như lượt 6
  tick 74). Sampler chỉ bắt 1 seeking run (samples 1..2,
  relMs 421..591, 170 ms — seek ban đầu).
- Drift recount sau seek ban đầu (prereg §3, kiểm tay): vượt
  >0,35 = **14 lần** (tick 12, 13, 14, 17, 19, 21, 23, 25, 26, 28,
  29, 31, 32, 34; max 0,6068 ở tick 17, min −0,2000); **có 2 tick
  liên tiếp cùng vượt** (12–13–14). Cụm vượt tập trung tick 12–34
  (t 2686–7204 ms): ct chạy trước ph 0,27–0,61 trong khi cả hai
  cùng tăng đơn điệu — KHÔNG kèm đổi resyncsV, KHÔNG có sampler
  seeking run nào sau run ban đầu, KHÔNG có ct nhảy về ph — nên
  đây KHÔNG phải drift re-seek theo định nghĩa prereg, mà là
  playhead tụt sau currentTime trong ~4,5 s đầu phát. Sau tick 35
  drift lắng (tick 60–149 mean −0,0333, max 0,0000; tick 150–291
  toàn 0, ct=ph=6). tailBursts cuối 0, tailEndedClosed cuối 0.
- Probe verdict nội bộ: playhead-giữ-trong-seek PASS;
  playhead-lúc-canvas-đổi-khung PASS (seekDoneIdx=3, relMs 810 ms).

## 2. Tính hợp lệ của lượt đếm (att2)

- Cây đo: preview.tsx md5 `03bf029f09b8890b285eacc10a02172b`
  (BASELINE) trước=sau; media.ts
  `2c384ed13703809d5e999311147745e7`; preview.tsx mtime
  12:02:56Z không đổi. H3f đã gỡ 12:02:56Z đợt 122,
  **không apply lại**. Không sửa production.
- Boot `310f07e4-f789-427a-bee8-a9aefd5a1f02` (#70 tạm, theo tên
  file T5 `t5-postboot-b70-*`, chờ T6 xác nhận số) không đổi
  trước=sau; không reboot giữa lượt.
- Lock v2 cổng 5590: wait 0 s, hold 61 s, RELEASED 21:00:51Z
  (ticket 1-1794862790542769407-7605-t1-round125). Cờ cây
  NO-CHANGE. Không DEFER, không KILLED.
- Postboot PASS sau 4 phút chờ: cờ `round125-t5/POSTBOOT_PASS`
  xuất hiện 20:59:21Z (poll=3, chứa đúng boot_id hiện tại —
  luật STALE chấp nhận ngay; cờ PASS của boot #69 đã chết không
  được dùng). T5 kiểm cuối PASS đầy đủ: wrapper/libs/GST 269
  plugin đủ isomp4+libav/apt đủ 11 pkg
  (`t5-postboot-b70-final.log`). Replay boot #70 cài thật:
  dpkg.log 2→1509 dòng, gói cuối gstreamer1.0-tools 21:01:36Z.
  Tải lúc bắt đầu probe: load 4,45, RAM khả dụng 1071 MB.

## 3. Lượt 7 att1: KILLED-REBOOT (không đếm) — chạy lại att2

- Driver att1 20:42:53–~20:54:19Z trên boot #69
  (`670c07f6-2299-43f6-951c-0cf1116afd6d`, btime 20:35:11Z, gap
  #68→#69 3h01'20"), md5 live khớp baseline ngay từ đầu,
  postboot check-only FAIL lúc khởi động (thiếu 5 lib, GST 0
  plugin, apt thiếu 11 pkg, dpkg.log đóng băng 2 dòng "startup
  packages configure" @20:35:38/39Z, 0 apt/dpkg chạy).
- Đang chờ cờ T5 đợt 125 (checkpoint 5 phút 20:47:53Z, 10 phút
  20:52:53Z — T5 poll tới poll12, postboot_exit=1 suốt, GST sys 0,
  dpkg.log vẫn 2 dòng) thì **reboot ~20:54:19Z giết driver giữa
  lúc chờ** (log cuối 20:52:53Z, không marker kết thúc; kiểm
  20:55:16Z driver không còn chạy). Boot mới
  `310f07e4-f789-427a-bee8-a9aefd5a1f02`, btime 20:54:19Z
  (gap 19'08"). Không chạy probe, không lấy lock, không sửa
  production.
- Log att1 đã sao lưu (`run-t1.log.att1-boot69.bak` +
  `run-t1-driver.out.att1-boot69.bak`). Chạy lại là att2 lúc
  20:55:49Z trên boot mới — đồng hồ chờ 60' chạy lại từ đầu
  (tiền lệ đợt 121). Lưu ý: runtime cũng restart cùng lúc với
  reboot này (lệnh chờ sleep 540 của T1 bị gián đoạn, đã kiểm lại
  trạng thái bằng tay — không mất dữ liệu, log driver còn nguyên
  tới checkpoint 10 phút).
- **Boot #69 là boot "chết replay" thứ hai kiểu boot #60:**
  dpkg.log đóng băng 2 dòng suốt 19 phút quan sát, 0 apt/dpkg
  chạy, replay không cài được gì trước khi reboot sang #70 cài
  thật. (Boot #64 kẹt ở apt-get update là dạng khác.)

## 4. Lượt 5 + lượt 6 (đối chiếu) — đều VOID trên baseline

- Lượt 5 att2 (đợt 124/T1, boot #68): VOID, velTicks=293,
  tailSteadyClosed=0, drift >0,35 sau seek ban đầu 0 lần
  (max 0,2375, min −0,0334), resyncsV chỉ đổi ở tick 3.
  Pause-seek 1423/1473 ms (chậm nhất lúc đó).
- Lượt 6 att1 (đợt 124/T2, boot #68): VOID, velTicks=433,
  tailSteadyClosed=0, drift >0,35 sau seek ban đầu 0 lần
  (max 0,2288, min 0,0), resyncsV đổi ở tick 3 VÀ tick 74
  (resync/restart cuối clip, restartV 0→1). Pause-seek 524/578 ms
  (nhanh nhất trên baseline).
- Cặp A+B trên cây baseline sau đợt 125: lượt 5 (A) VOID + lượt 6
  (B) VOID + lượt 7 (A) VOID — **H1/H3 vẫn chưa có cặp
  CAUGHT-RESEEK**.

## 5. Ghi chú trung thực

- **Drift vượt ngưỡng lần đầu trên baseline (att2):** 14 lần vượt
  >0,35, max 0,6068, có 3 tick liên tiếp cùng vượt (12–13–14) —
  các lượt baseline trước đều 0 lần (max 0,1475 / 0,1102 /
  0,2375 / 0,2288). Nhưng verdict vẫn VOID vì tailSteadyClosed=0
  và không có re-seek nào (không đổi resyncsV, không sampler
  seeking run sau run ban đầu, ct không nhảy về ph). Cụm drift
  này là playhead tụt sau currentTime đầu phát, không phải bằng
  chứng E4. Cần đối chiếu ở lượt 8 (B, gop30) xem có lặp lại
  không — nếu lặp lại ở cả A lẫn B thì đây là đặc tính hệ thống
  dưới tải, không phải nhiễu một lượt.
- **Pause-seek chậm nhất từ trước tới nay (att2):** tElement/
  tCanvas 1806/1871 ms (lượt 2 trên H3f: 157/207 ms; lượt 3:
  781/897 ms; lượt 4: 563/672 ms; lượt 5 att2: 1423/1473 ms;
  lượt 6: 524/578 ms) — vẫn confirmed, nhưng xu hướng chậm dần
  qua các lượt chưa được giải thích; lượt này trùng tải cao lúc
  bắt đầu probe (load 4,45, RAM khả dụng 1071 MB — thấp nhất
  trong các lượt gần đây). Đây là tương quan, không phải chứng
  minh nhân quả — ghi lại để đối chiếu các lượt sau. Tick 4–8
  ct=ph=0,5 đóng băng ~1,2 s sau seek (t 781→1971 ms) rồi mới
  bắt đầu tăng — khớp với pause-seek chậm.
- **Transient tick 1 không phải re-seek:** tick 1 drift 4,5
  (ct=5, ph=0,5) xảy ra TRƯỚC seek ban đầu (tick 3), không kèm
  đổi resyncsV; tick 2 đã về 0,5/0,5. Recount §3 chỉ tính tick
  SAU seek ban đầu nên không tính tick này (cùng mẫu với mọi
  lượt trước). Không làm đổi verdict VOID.
- **VOID này không chứng minh E4 vắng mặt tuyệt đối** — chỉ chứng
  minh trong 1 lượt A gop250 trên cây baseline, 292 tick, không
  quan sát được steady-close nào. Cần đủ 10 lượt mới kết luận lô.
- **Không gộp với lượt 2:** lượt 2 VOID đo trên cây H3f; số lượt 7
  này thuộc loạt baseline. Verdict H1/H3 cần cặp A+B
  CAUGHT-RESEEK trên CÙNG cây — chưa có.
- Không đo TTS 39, không thử birefnet (RAM khả dụng 1071–1587 MB
  lúc đo, < 6 GB guard; u2net là fallback chính thức). Không chạy
  lại tsc/vite build: cây không đổi một byte (md5 trước=sau, mtime
  không đổi) và probe đã khởi động vite dev + WebKit thành công
  trên chính cây này.
- Không push, không release/tag, không sửa production. Driver đã
  đếm apt bằng `pgrep -x` (không dùng grep-ps) theo luật cứng
  đợt 124; không `pkill -f`.

## 6. Tiến độ lô sau lượt này

- Lượt đếm được: **6/10** (0 CAUGHT, 6 VOID — lượt 2 B gop30 cây
  H3f; lượt 3 att3 A gop250 cây baseline; lượt 4 att5 B gop30 cây
  baseline; lượt 5 att2 A gop250 cây baseline; lượt 6 att1 B gop30
  cây baseline; lượt 7 att2 A gop250 cây baseline). Lượt đếm trên
  baseline: 5. Lượt không đếm: 9 (thêm lượt 7 att1 KILLED-REBOOT).
- Lượt tiếp theo: lượt 8 (B, gop30, phase `e4b8`) ở đợt sau, trên
  cây baseline.

## 7. File liên quan

- Prereg: `workspace/goals/capcut-clone-video-editor/hidden_files/round125-t1/prereg-e4batch-luot7.md`
  (§0–§4 đăng ký; §5 hậu kiểm lượt 7 att1 + att2)
- Driver + log: `.../round125-t1/run-t1.sh`, `run-t1.log`,
  `run-t1-driver.out` (att2; bản sao lưu att1
  `run-t1.log.att1-boot69.bak`,
  `run-t1-driver.out.att1-boot69.bak`)
- Analyzer: `.../round125-t1/analyze-t1.py` (logic y hệt đợt 124)
- Số thô: `.../round125-t1/probe-webkit-load0-gop250-e4a7/probe-results.json`
  (gốc: `.../round116-s1/probe-webkit-load0-gop250-e4a7/`,
  md5 `776a67604eb7307defc3e9f409bd7713`)
- Sổ cái: `.../round118-t9/e4batch-ledger.md` (đã thêm hàng lượt 7
  att1 + att2; tiến độ 6/10, lượt không đếm 9)
- Cờ T5: `.../round125-t5/POSTBOOT_PASS` (boot #70 tạm, 20:59:21Z,
  poll=3, chứa đúng boot_id `310f07e4…`)
- Batch stage: `repo-1-push/paths-loop/phase9-round125-t1-e4batch-r7.txt`
