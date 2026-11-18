# LIMITS — Phase 9 đợt 125 T2: E4BATCH lượt 8 att1 + att2 (B, gop30, e4b8) trên cây BASELINE

> Đo thật, không code giả. Lượt đếm được trên cây baseline.
> Verdict lượt 8: **VOID (đếm được, att2)**. Lô E4BATCH: **7/10**
> (0 CAUGHT, 7 VOID).

## 1. Kết quả — lượt 8 att2: VOID

- Probe `probe116s1.mjs` (giữ nguyên, không sửa), engine WebKit,
  loadN=0, gop=30, clip `o8-ball-720p-6s-gop30.mp4`, phase `e4b8`.
- Probe chạy 21:11:54–21:12:27Z, **exit=0** (33 s). Pause-seek tới
  t=5: confirmed=true (tElement 266 ms, tCanvas 315 ms — **nhanh
  nhất trên baseline từ trước tới nay**; lượt 6: 524/578 ms, lượt
  4: 563/672 ms, lượt 3: 781/897 ms, lượt 5 att2: 1423/1473 ms,
  lượt 7 att2: 1806/1871 ms — chậm nhất). Phát sau seek tới cuối
  tự nhiên (localPh=6, ended=true) + 10 s quan sát (endObserveMs
  10507).
- Số đo thật (probe-results.json, đã copy về
  `hidden_files/round125-t2/probe-webkit-load0-gop30-e4b8/`,
  md5 `282e42a047c6494a46eb33001d7bcc11` khớp bản gốc round116-s1):
  velTicks=480, sampler=134, renderTicks=78, raf=110, rvfc=0,
  pageErrs=0.
- **tailSteadyClosed = 0 → VOID** (prereg §4: 0 steady-close trong
  toàn bộ 180 s, probe exit 0 — ĐẾM vào lô, không retry vì kết quả
  seek).
- resyncsV chỉ đổi ở **tick 2** (seek ban đầu, t=58 ms, ct=ph=0,5
  — sớm hơn các lượt trước, tick 3), restartV cuối=0. Sampler chỉ
  bắt 1 seeking run (samples 0..1, relMs 126..234, 108 ms — seek
  ban đầu).
- Drift recount sau seek ban đầu (prereg §3, kiểm tay): vượt
  >0,35 = **0 lần** (477 tick sau seek; max 0,1139 ở tick 70,
  min −0,0333; 10 tick drift âm, nhỏ nhất −0,0333); không có 2
  tick liên tiếp cùng vượt; 10 tick cuối drift toàn 0 (ct=ph=6).
  tailBursts cuối 0, tailEndedClosed cuối 0, tailSteadyClosed
  cuối 0.
- Probe verdict nội bộ: playhead-giữ-trong-seek PASS;
  playhead-lúc-canvas-đổi-khung PASS (seekDoneIdx=2,
  seekDoneRelMs=361 ms, canvasChangeRelMs=361 ms).

## 2. Tính hợp lệ của lượt đếm (att2)

- Cây đo: preview.tsx md5 `03bf029f09b8890b285eacc10a02172b`
  (BASELINE) trước=sau; media.ts
  `2c384ed13703809d5e999311147745e7`; preview.tsx mtime
  12:02:56Z không đổi. H3f đã gỡ 12:02:56Z đợt 122,
  **không apply lại**. Không sửa production.
- Boot `310f07e4-f789-427a-bee8-a9aefd5a1f02` (#70 tạm, theo tên
  file T5 `t5-postboot-b70-*`, chờ T6 xác nhận số) không đổi
  trước=sau; không reboot giữa lượt.
- Lock v2 cổng 5590: wait 51 s (xếp hàng sau T3, ticket
  1-1794863309687803355-11594-t3, port 5187, started 21:08:29Z),
  hold 34 s, RELEASED 21:12:27Z (ticket
  1-1794863462794508885-12548-t2-round125). Cờ cây NO-CHANGE.
  Không DEFER, không KILLED.
- Postboot PASS sau 0 phút chờ: cờ `round125-t5/POSTBOOT_PASS`
  đã có từ 20:59:21Z (poll=3, chứa đúng boot_id hiện tại —
  luật STALE chấp nhận ngay; cờ PASS của boot #69 đã chết không
  được dùng). T5 kiểm cuối PASS đầy đủ: wrapper/libs/GST 269
  plugin đủ isomp4+libav/apt đủ 11 pkg
  (`t5-postboot-b70-final.log`). Replay boot #70 cài thật:
  dpkg.log 2→1509 dòng, gói cuối gstreamer1.0-tools 21:01:36Z.
  T2 tự kiểm postboot check-only lúc khởi động driver: CHƯA ĐU
  (replay #70 đang chạy — GST 32 plugin, apt thiếu 5 gói).
- Giai đoạn 0 qua sau 14 phút chờ cờ `round125-t1.done` (cờ xuất
  hiện 21:10Z; T1 viết LIMITS + cờ sau khi lượt 7 att2 xong).

## 3. Lượt 8 att1: KILLED-REBOOT (không đếm) — chạy lại att2

- Driver att1 (PID 10544) 20:46:02–~20:54:19Z trên boot #69
  (btime 20:35:11Z, boot_id `670c07f6-2299-43f6-951c-0cf1116afd6d`,
  gap #68→#69 3h01'20"), md5 live khớp baseline ngay từ đầu;
  postboot check-only lúc khởi động FAIL (thiếu 5 lib, GST 0
  plugin, apt thiếu 11 gói — replay #69 mới bắt đầu).
- Đang ở giai đoạn 0 chờ cờ `round125-t1.done` (checkpoint 5
  phút 20:51:03Z) thì **reboot ~20:54:19Z giết driver giữa lúc
  chờ** (log cuối 20:51:03Z, không marker kết thúc; runtime cũng
  restart cùng lúc — lệnh chờ sleep 300 của T2 bị gián đoạn, đã
  kiểm lại trạng thái bằng tay, không mất dữ liệu). Không chạy
  probe, không lấy lock, không sửa production.
- Boot mới btime 20:54:19Z, boot_id
  `310f07e4-f789-427a-bee8-a9aefd5a1f02` (gap #69→#70 19'08").
  Log att1 đã sao lưu (`run-t2.log.att1-boot69.bak` +
  `run-t2-driver.out.att1-boot69.bak`). Chạy lại là att2 lúc
  20:57:02Z trên boot mới — đồng hồ chờ 60' chạy lại từ đầu
  (tiền lệ đợt 121; driver vá nhận số att qua tham số $4).
- Boot #69 là boot "chết replay" thứ hai kiểu boot #60 (T1 LIMITS
  §3: dpkg.log đóng băng 2 dòng suốt 19 phút quan sát, 0 apt/dpkg
  chạy, replay không cài được gì trước khi reboot sang #70 cài
  thật).

## 4. Lượt 7 của T1 (đối chiếu) — VOID, lô → 6/10 trước lượt 8

- T1 att1 KILLED-REBOOT (cùng reboot ~20:54:19Z, driver chết
  giữa lúc chờ cờ T5 trên boot #69); att2 retry thành công,
  probe exit=0 (20:59:51–21:00:51Z, 60 s).
- T1 att2: velTicks=292, sampler=150, renderTicks=73, raf=114,
  rvfc=0, pageErrs=0, tailSteadyClosed=0, drift >0,35 sau seek
  ban đầu **14 lần** (max 0,6068 ở tick 17, min −0,2000; CÓ 2
  tick liên tiếp cùng vượt 12–13–14 — lần đầu vượt ngưỡng trên
  baseline; cụm tick 12–34, ct chạy trước ph 0,27–0,61 — KHÔNG
  kèm đổi resyncsV, KHÔNG có sampler seeking run sau run ban đầu,
  KHÔNG có ct nhảy về ph → KHÔNG phải drift re-seek, là playhead
  tụt sau currentTime ~4,5 s đầu phát), resyncsV chỉ đổi ở tick 3
  (seek ban đầu), restartV cuối=0. Sampler 1 seeking run
  (samples 1..2, relMs 421..591, 170 ms — seek ban đầu).
  Pause-seek confirmed=true (tElement 1806 ms, tCanvas 1871 ms —
  chậm nhất từ trước tới nay). T2 đối chiếu độc lập bằng
  analyze-t2.py trên probe-results.json của T1 — tái hiện đúng
  VOID. T1 viết LIMITS + cờ `round125-t1.done` lúc 21:10Z. Xem
  `docs/PHASE9_ROUND125_T1_E4BATCH_R7_LIMITS.md`. Lô: 6/10 trước
  lượt 8.

## 5. Ghi chú trung thực

- **Cụm drift lượt 7 KHÔNG lặp lại ở lượt 8:** lượt 7 att2 có 14
  lần vượt >0,35 (cụm tick 12–34, max 0,6068) + pause-seek chậm
  nhất (1806/1871 ms); lượt 8 này có 0 lần vượt (max 0,1139) +
  pause-seek nhanh nhất (266/315 ms). Cụm drift lượt 7 không
  phải đặc tính hệ thống chung của cặp A+B trên boot #70 — chỉ
  xuất hiện ở chân A gop250 dưới tải cao lúc đó (load 4,45 lúc
  bắt đầu probe lượt 7; lượt 8 load 0,79 lúc bắt đầu). Đây là
  tương quan, không phải chứng minh nhân quả — ghi lại để đối
  chiếu các lượt sau. Cả hai lượt đều VOID (tailSteadyClosed=0).
- **Sự kiện cuối clip lượt 6 KHÔNG lặp lại:** lượt 6 att1 có
  resyncsV + restartV đổi thêm ở tick 74 cuối clip (ct=ph=5,9);
  lượt 7 và lượt 8 đều không có (resyncsV chỉ đổi ở tick seek
  ban đầu, restartV cuối=0). Sự kiện tick 74 lượt 6 vẫn là đơn
  lẻ, chưa lặp lại trong 2 lượt sau.
- **Transient tick 0 không phải re-seek:** tick 0 drift 4,5
  (ct=5, ph=0,5) xảy ra TRƯỚC seek ban đầu (tick 2), không kèm
  đổi resyncsV; tick 1 đã về 0,5/0,5 (drift 0,0). Recount §3 chỉ
  tính tick SAU seek ban đầu nên không tính tick này (cùng mẫu
  các lượt trước, chỉ khác tick transient là 0 thay vì 1 — do
  seek sớm hơn ở tick 2). Không làm đổi verdict VOID.
- **velTicks=480 là nhiều nhất trên baseline từ trước tới nay**
  (lượt 3: 428; lượt 4: 447; lượt 5: 293; lượt 6: 433; lượt 7:
  292) — cửa sổ tick 21→17813 ms (~17,8 s), mật độ tick dày hơn
  các lượt trước. Chỉ số này không đổi verdict (VOID dựa trên
  tailSteadyClosed=0, không dựa trên số tick).
- **VOID này không chứng minh E4 vắng mặt tuyệt đối** — chỉ chứng
  minh trong 1 lượt B gop30 trên cây baseline, 480 tick, không
  quan sát được steady-close nào. Cần đủ 10 lượt mới kết luận lô.
- **Không gộp với lượt 2:** lượt 2 VOID đo trên cây H3f; số lượt
  8 này thuộc loạt baseline. Verdict H1/H3 cần cặp A+B
  CAUGHT-RESEEK trên CÙNG cây — chưa có (lượt 7 A + lượt 8 B
  trên baseline đều VOID — cặp A+B đợt 125 khép lại đều VOID).
- Không đo TTS 39, không thử birefnet (RAM khả dụng 1111–1601 MB
  lúc đo, < 6 GB guard; u2net là fallback chính thức). Không chạy
  lại tsc/vite build: cây không đổi một byte (md5 trước=sau,
  mtime không đổi) và probe đã khởi động vite dev + WebKit thành
  công trên chính cây này.
- Không push, không release/tag, không sửa production. Driver đã
  đếm apt bằng `pgrep -x` (không dùng grep-ps) theo luật cứng
  đợt 124; không `pkill -f`.

## 6. Tiến độ lô sau lượt này

- Lượt đếm được: **7/10** (0 CAUGHT, 7 VOID — lượt 2 B gop30 cây
  H3f; lượt 3 att3 A gop250 cây baseline; lượt 4 att5 B gop30 cây
  baseline; lượt 5 att2 A gop250 cây baseline; lượt 6 att1 B
  gop30 cây baseline; lượt 7 att2 A gop250 cây baseline; lượt 8
  att2 B gop30 cây baseline). Lượt đếm trên baseline: 6. Lượt
  không đếm: 10 (thêm lượt 8 att1 KILLED-REBOOT).
- Lượt tiếp theo: lượt 9 (A, gop250, phase `e4a9`) ở đợt sau, trên
  cây baseline.

## 7. File liên quan

- Prereg: `workspace/goals/capcut-clone-video-editor/hidden_files/round125-t2/prereg-e4batch-luot8.md`
  (§0–§4 đăng ký; §5 hậu kiểm lượt 8 att1 + att2)
- Driver + log: `.../round125-t2/run-t2.sh`, `run-t2.log`,
  `run-t2-driver.out` (att2) + `run-t2.log.att1-boot69.bak`,
  `run-t2-driver.out.att1-boot69.bak`
- Analyzer: `.../round125-t2/analyze-t2.py` (logic y hệt đợt 124;
  verify sống bằng dry-run trên dữ liệu lượt 6 trước khi đo)
- Số thô: `.../round125-t2/probe-webkit-load0-gop30-e4b8/probe-results.json`
  (gốc: `.../round116-s1/probe-webkit-load0-gop30-e4b8/`,
  md5 `282e42a047c6494a46eb33001d7bcc11`)
- Sổ cái: `.../round118-t9/e4batch-ledger.md` (đã thêm hàng lượt 8
  att1 + att2; tiến độ 7/10, lượt không đếm 10)
- Cờ T5: `.../round125-t5/POSTBOOT_PASS` (boot #70 tạm, 20:59:21Z,
  poll=3, chứa đúng boot_id `310f07e4…`)
- Cờ T1: `.../round125-t1.done` (21:10Z)
- Batch stage: `repo-1-push/paths-loop/phase9-round125-t2-e4batch-r8.txt`
