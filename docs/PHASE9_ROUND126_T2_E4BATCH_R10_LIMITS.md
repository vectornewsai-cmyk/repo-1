# LIMITS — Phase 9 đợt 126 T2: E4BATCH lượt 10 att1 (B, gop30, e4b10) trên cây BASELINE

> Đo thật, không code giả. Lượt đếm được trên cây baseline.
> Verdict lượt 10: **VOID (đếm được, att1)**. Lô E4BATCH: **10/10 —
> LÔ KHÉP** (1 CAUGHT-NO-RESEEK, 9 VOID).

## 1. Kết quả — lượt 10 att1: VOID

- Probe `probe116s1.mjs` (giữ nguyên, không sửa), engine WebKit,
  loadN=0, gop=30, clip `o8-ball-720p-6s-gop30.mp4`, phase `e4b10`.
- Probe chạy 00:01:06–00:01:40Z, **exit=0** (34 s). Pause-seek tới
  t=5: confirmed=true (tElement 143 ms, tCanvas 193 ms — **nhanh
  nhất trên baseline từ trước tới nay**; lượt 8: 266/315 ms, lượt
  6: 524/578 ms, lượt 4: 563/672 ms, lượt 3: 781/897 ms, lượt 9:
  1296/1362 ms, lượt 5 att2: 1423/1473 ms, lượt 7 att2: 1806/1871
  ms — chậm nhất). Phát sau seek tới cuối tự nhiên (localPh=6,
  ended=true) + 10 s quan sát (endObserveMs 10085).
- Số đo thật (probe-results.json, đã copy về
  `hidden_files/round126-t2/probe-webkit-load0-gop30-e4b10/`,
  md5 `8ee2dc35e88135bb045088094118f3f1` khớp bản gốc round116-s1):
  velTicks=441, sampler=128, renderTicks=76, raf=111, rvfc=0,
  pageErrs=0.
- **tailSteadyClosed = 0 → VOID** (prereg §4: 0 steady-close trong
  toàn bộ 180 s, probe exit 0 — ĐẾM vào lô, không retry vì kết quả
  seek).
- resyncsV chỉ đổi ở **tick 4** (seek ban đầu, t=285 ms, ct=ph=0,5
  — muộn hơn các lượt trước, tick 2/3), restartV cuối=0. Sampler
  chỉ bắt 1 seeking run (samples 0..1, relMs 194..288, 94 ms —
  seek ban đầu).
- Drift recount sau seek ban đầu (prereg §3, kiểm tay): vượt
  >0,35 = **0 lần** (436 tick sau seek; max 0,1602 ở tick 26,
  min −0,0334 ở tick 30); không có 2 tick liên tiếp cùng vượt;
  10 tick cuối drift toàn 0 (ct=ph=6). tailBursts cuối 0,
  tailEndedClosed cuối 0, tailSteadyClosed cuối 0.
- Probe verdict nội bộ: playhead-giữ-trong-seek PASS;
  playhead-lúc-canvas-đổi-khung PASS (seekDoneIdx=2,
  seekDoneRelMs=486 ms, canvasChangeRelMs=486 ms).

## 2. Tính hợp lệ của lượt đếm (att1, không chạy lại)

- Cây đo: preview.tsx md5 `03bf029f09b8890b285eacc10a02172b`
  (BASELINE) trước=sau; media.ts
  `2c384ed13703809d5e999311147745e7`; preview.tsx mtime
  12:02:56Z không đổi. H3f đã gỡ 12:02:56Z đợt 122,
  **không apply lại**. Không sửa production.
- Boot `ff7afbbb-1f8b-46e7-abd3-3e9d9ae1af69` (#71 tạm, theo tên
  file T5 `t5-postboot-b71-*`, chờ T6 xác nhận số) không đổi
  trước=sau; không reboot giữa lượt.
- Lock v2 cổng 5590: wait 0 s, hold 34 s, RELEASED 00:01:40Z
  (ticket 1-1794873666468688241-18793-t2-round126). Cờ cây
  NO-CHANGE. Không DEFER, không KILLED.
- Postboot PASS sau 0 phút chờ: cờ `round126-t5/POSTBOOT_PASS`
  đã có từ 23:43:58Z (poll=try1, chứa đúng boot_id hiện tại —
  luật STALE chấp nhận ngay; cờ PASS của boot #70 đã chết không
  được dùng). T5 kiểm cuối PASS đầy đủ: wrapper/libs/GST 269
  plugin đủ isomp4+libav/apt đủ 11 pkg
  (`t5-postboot-b71-try1.log`). Replay boot #71 cài thật:
  dpkg.log 1509 dòng, gói cuối gstreamer1.0-tools 23:37:46Z.
  T2 tự kiểm postboot check-only lúc khởi động driver: PASS đầy
  đủ (replay đã xong trước khi driver khởi động — khác boot #69
  đợt 125 chết replay).
- Giai đoạn 0 qua sau 18 phút chờ cờ `round126-e4a9-done` (cờ xuất
  hiện 00:00Z; T1 viết LIMITS lượt 9 lúc ~23:58Z, cờ sau đó 2
  phút).

## 3. Lượt 9 của T1 (đối chiếu độc lập) — CAUGHT-NO-RESEEK, lô → 8/10 trước lượt 10

- T1 att1, probe exit=0 (23:45:50–23:46:43Z, 53 s).
- T1 att1: velTicks=196, sampler=111, renderTicks=36, raf=68,
  rvfc=0, pageErrs=0, tailSteadyClosed cuối=1 (0→1 ở tick 17,
  t=3078, drift 0,4985; 179 tick steady-close), drift >0,35 sau
  seek ban đầu **14 lần** (max 0,5 ở tick 16, min −0,3 ở tick 37;
  có 2 tick liên tiếp cùng vượt 16–17, 19–21, 29–33), resyncsV
  chỉ đổi ở tick 2 (seek ban đầu), restartV cuối=0. Sampler 1
  seeking run (samples 0..1, relMs 124..228, 104 ms — seek ban
  đầu). Pause-seek confirmed=true (tElement 1296 ms, tCanvas
  1362 ms). T2 đối chiếu độc lập bằng analyze-t2.py trên
  probe-results.json của T1 — tái hiện đúng CAUGHT-NO-RESEEK
  (steady-close ticks 17–21, n=179; ứng viên re-seek tick 35 của
  analyzer là dương tính giả của heuristic |ct−ph| — ph nhảy lên
  +0,2667 trong 1 tick, ct không nhảy về ph; sampler-bracket
  không tìm thấy seeking sau seek ban đầu). T1 viết LIMITS + cờ
  `round126-e4a9-done` lúc 00:00Z. Xem
  `docs/PHASE9_ROUND126_T1_E4BATCH_R9_LIMITS.md`. Lô: 8/10 trước
  lượt 10.

## 4. Ghi chú trung thực

- **Cụm drift chân A KHÔNG lặp lại ở chân B đợt 126:** lượt 7
  att2 và lượt 9 att1 (cả hai chân A gop250) đều có 14 lần vượt
  >0,35 (cụm tick 12–34, max 0,6068 / 0,5); lượt 10 này (chân B
  gop30) có 0 lần vượt (max 0,1602). Cùng với lượt 8 B gop30
  (0 lần, max 0,1139), cả ba chân B trên baseline đều 0 lần vượt
  trong khi hai chân A gần nhất đều 14 lần — củng cố kết luận
  của T1: cụm drift là đặc tính chân A gop250, không phải đặc
  tính chung của cặp A+B. Đây là tương quan qua 5 lượt gần nhất,
  không phải chứng minh nhân quả.
- **Sự kiện cuối clip lượt 6 KHÔNG lặp lại:** lượt 6 att1 có
  resyncsV + restartV đổi thêm ở tick 74 cuối clip (ct=ph=5,9);
  lượt 7, 8, 9, 10 đều không có (resyncsV chỉ đổi ở tick seek
  ban đầu, restartV cuối=0). Sự kiện tick 74 lượt 6 vẫn là đơn
  lẻ, chưa lặp lại trong 4 lượt sau.
- **Transient tick 2 không phải re-seek:** tick 2 drift 4,5
  (ct=5/ph=0,5) xảy ra TRƯỚC seek ban đầu (tick 4), không kèm
  đổi resyncsV; tick 3 đã về 0,5/0,5 (drift 0,0). Recount §3 chỉ
  tính tick SAU seek ban đầu nên không tính tick này (cùng mẫu
  các lượt trước; khác mẫu cũ ở chỗ tick 0–1 ở đây ct=ph=5,
  drift 0 — các lượt trước tick 0/1 là ct=5/ph=0,5). Không làm
  đổi verdict VOID.
- **Pause-seek nhanh nhất từ trước tới nay (143/193 ms):** tải
  lúc bắt đầu probe thấp (load 0,84; RAM khả dụng 1049 MB) —
  khớp hướng tương quan tải ↔ pause-seek đã ghi ở các lượt trước
  (lượt 7 tải 4,45 → chậm nhất 1806/1871 ms; lượt 8 tải 0,79 →
  266/315 ms; lượt 9 tải 3,46 → 1296/1362 ms). Tương quan, không
  chứng minh nhân quả. Chỉ số này không đổi verdict (VOID dựa
  trên tailSteadyClosed=0, không dựa trên tốc độ seek).
- **Seek ban đầu muộn hơn (tick 4 thay vì tick 2/3):** resyncsV
  đổi ở tick 4 (t=285 ms) thay vì tick 2 (lượt 7/8/9) hay tick 3
  (lượt 3/4/5/6). Chỉ là thời điểm sampler bắt được seek, không
  đổi verdict.
- **Lưu ý log driver:** dòng log "T1 đợt 126 đã xong (lượt 7) —
  T2 tiếp tục đo lượt 8" trong run-t2.log là chuỗi mẫu cũ còn sót
  khi copy script đợt 125 (sed không đổi dòng này) — chỉ là chữ
  trong log, không ảnh hưởng phép đo: cờ thực tế là
  `round126-e4a9-done`, phase thực tế `e4b10`, lượt thực tế 10.
- **VOID này không chứng minh E4 vắng mặt tuyệt đối** — chỉ chứng
  minh trong 1 lượt B gop30 trên cây baseline, 441 tick, không
  quan sát được steady-close nào.
- **Không gộp với lượt 2:** lượt 2 VOID đo trên cây H3f; số lượt
  10 này thuộc loạt baseline. Verdict H1/H3 cần cặp A+B
  CAUGHT-RESEEK trên CÙNG cây — chưa từng có trong cả lô.
- Không đo TTS 39, không thử birefnet (RAM khả dụng 1049–1534 MB
  lúc đo, < 6 GB guard; u2net là fallback chính thức). Không chạy
  lại tsc/vite build: cây không đổi một byte (md5 trước=sau,
  mtime không đổi) và probe đã khởi động vite dev + WebKit thành
  công trên chính cây này.
- Không push, không release/tag, không sửa production. Driver đã
  đếm apt bằng `pgrep -x` (không dùng grep-ps) theo luật cứng
  đợt 124; không `pkill -f`.

## 5. Tiến độ lô sau lượt này — LÔ KHÉP 10/10

- Lượt đếm được: **10/10** (1 CAUGHT-NO-RESEEK, 9 VOID — lượt 2 B
  gop30 cây H3f; lượt 3 att3 A gop250 cây baseline; lượt 4 att5 B
  gop30 cây baseline; lượt 5 att2 A gop250 cây baseline; lượt 6
  att1 B gop30 cây baseline; lượt 7 att2 A gop250 cây baseline;
  lượt 8 att2 B gop30 cây baseline; lượt 9 att1 A gop250 cây
  baseline — **CAUGHT-NO-RESEEK, lượt bắt được ĐẦU TIÊN**; lượt
  10 att1 B gop30 cây baseline — **VOID, LƯỢT CUỐI**). Lượt đếm
  trên baseline: 8. Lượt không đếm: 10.
- **Lô kết thúc theo DỪNG-HẾT-LƯỢT, không có DỪNG-VERDICT:**
  cặp A+B CAUGHT-RESEEK chưa từng xuất hiện trong cả 10 lượt đếm
  (chỉ 1 lượt CAUGHT-NO-RESEEK duy nhất là lượt 9, và chỉ số
  chính VẮNG ở lượt đó); cặp A+B đợt 126 khép lại
  CAUGHT-NO-RESEEK + VOID. E4 giữ **ĐÓNG CÓ ĐIỀU KIỆN** trừ khi
  parent quyết khác (theo T1 LIMITS lượt 9 §6). H1/H3 không phân
  định — chỉ số chính (seeking-duration của drift re-seek đầu
  tiên sau steady-close đầu tiên) không đo được trong cả lô vì
  không có lượt CAUGHT-RESEEK nào.
- **Caveat để lại cho parent (từ T1 LIMITS lượt 9 §5, T2 ghi
  nhận):** drift sau steady-close ở lượt 9 vẫn vượt 0,35 ở 10
  tick (19–33) mà không có re-seek — không khớp dòng chú thích
  trong ngoặc của prereg-e4batch §2 cho CAUGHT-NO-RESEEK
  ("drift sau steady-close không bao giờ vượt 0,35 xác nhận 2
  tick liên tiếp"). Phân loại lượt 9 theo định nghĩa chính
  ("KHÔNG có drift re-seek nào trong cửa sổ quan sát"). Parent
  cần xét lại định nghĩa này trước khi dùng kết quả lô cho quyết
  định tiếp theo về E4.
- Lượt tiếp theo: KHÔNG CÓ — lô E4BATCH đã khép.

## 6. File liên quan

- Prereg: `workspace/goals/capcut-clone-video-editor/hidden_files/round126-t2/prereg-e4batch-luot10.md`
  (§0–§4 đăng ký; §5 hậu kiểm lượt 10 att1)
- Driver + log: `.../round126-t2/run-t2.sh`, `run-t2.log`,
  `run-t2-driver.out` (att1, không chạy lại)
- Analyzer: `.../round126-t2/analyze-t2.py` (logic y hệt đợt 125;
  verify sống bằng dry-run trên dữ liệu lượt 8 trước khi đo;
  dùng lại để đối chiếu độc lập lượt 9 của T1 — tái hiện đúng
  CAUGHT-NO-RESEEK)
- Số thô: `.../round126-t2/probe-webkit-load0-gop30-e4b10/probe-results.json`
  (gốc: `.../round116-s1/probe-webkit-load0-gop30-e4b10/`,
  md5 `8ee2dc35e88135bb045088094118f3f1`)
- Sổ cái: `.../round118-t9/e4batch-ledger.md` (đã thêm hàng lượt 10
  att1; tiến độ **10/10 — LÔ KHÉP**, lượt không đếm 10)
- Cờ T5: `.../round126-t5/POSTBOOT_PASS` (boot #71 tạm, 23:43:58Z,
  poll=try1, chứa đúng boot_id `ff7afbbb…`)
- Cờ T1: `.../round126-e4a9-done` (00:00Z)
- Batch stage: `repo-1-push/paths-loop/phase9-round126-t2-e4batch-r10.txt`
