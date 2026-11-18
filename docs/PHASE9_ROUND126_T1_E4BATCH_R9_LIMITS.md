# LIMITS — Phase 9 đợt 126 T1: E4BATCH lượt 9 att1 (A, gop250, e4a9) trên cây BASELINE

> Đo thật, không code giả. Lượt đếm được trên cây baseline.
> Verdict lượt 9: **CAUGHT-NO-RESEEK (đếm được, att1)** — lượt bắt
> được ĐẦU TIÊN của lô (lượt 1–8: 0 CAUGHT). Lô E4BATCH: **8/10**
> (1 CAUGHT-NO-RESEEK, 7 VOID).

## 1. Kết quả — lượt 9 att1: CAUGHT-NO-RESEEK

- Probe `probe116s1.mjs` (giữ nguyên, không sửa), engine WebKit,
  loadN=0, gop=250, clip `o8-ball-720p-6s.mp4`, phase `e4a9`.
- Probe chạy 23:45:50–23:46:43Z, **exit=0** (53 s). Pause-seek tới
  t=5: confirmed=true (tElement 1296 ms, tCanvas 1362 ms). Phát sau
  seek tới cuối tự nhiên (localPh=6, ended=true) + 10 s quan sát
  (endObserveMs 10493).
- Số đo thật (probe-results.json, đã copy về
  `hidden_files/round126-t1/probe-webkit-load0-gop250-e4a9/`,
  md5 `a403dfa9ceb22b488b398783fddc7c42` khớp bản gốc round116-s1):
  velTicks=196, sampler=111, renderTicks=36, raf=68, rvfc=0,
  pageErrs=0.
- **tailSteadyClosed cuối = 1 → CAUGHT** (prereg-e4batch §2).
  Steady-close đã xác minh đủ 3 điều kiện (prereg-e4batch §2 /
  PREREG-N1 §3): (1) bộ đếm `__vcutTailSteadyClosed112N1` 0→1 ở
  tick 17 (t=3078 ms), giữ 1 tới tick cuối 195; (2)
  steadyAdvances_last=3 ở tick 16 (đuôi ân hạn Y4 mở ở tick 13,
  endedAtMs=1767, steadyAdvances 0→1→2→3 qua tick 14/15/16, đóng
  ở tick 17); 4 lần tăng lành liên tiếp trước tick đóng — tick
  13–16 rate 0,49×/1,19×/0,20×/1,36× (đều ≤1,5×, gap 227/273/210/
  319 ms > 0); (3) drift ở tick đóng = 0,4985 > 0,35 (ct=2,1985,
  ph=1,7). Đuôi mở sau burst ở tick 12 (rate 1,87×, ct
  0,5667→0,8887 trong 172 ms) rồi đóng vì steady — đúng cơ chế
  N1 (fix CAP m1f4: decoder decode ổn định 4 tick liên tiếp thì
  đuôi đóng, không kẹt tới trần 5000 ms).
- **KHÔNG có drift re-seek nào sau steady-close → CAUGHT-NO-RESEEK:**
  resyncsV KHÔNG tăng sau tick 2 (giữ 1 tới tick 195 — bộ đếm đơn
  điệu nên seek không thể lọt khỏi quan sát), restartV cuối=0,
  sampler chỉ bắt 1 seeking run (samples 0..1, relMs 124..228,
  104 ms — seek ban đầu; quanh tick 35, relMs 6712–7454, toàn
  seeking=False), ct KHÔNG nhảy về ph (ct tăng đơn điệu
  5,6667→5,7→5,7 ở tick 34–36). Drift đóng ở tick 35 (0,2667 →
  0,0333) vì ph NHẢY LÊN (+0,2667 trong 1 tick 129 ms, ph
  5,4→5,6667) trong khi ct gần như đứng yên — playhead đuổi kịp
  currentTime, không phải seek. Ứng viên "drift re-seek tick 35"
  của analyzer (chỉ theo |ct−ph| < 0,05 sau ≥0,05) là dương tính
  giả của heuristic: sampler-bracket KHÔNG tìm thấy seeking sau
  seek ban đầu nên không đo được seeking-duration; bar H1/H3
  không áp được. Chỉ số chính VẮNG — lượt này KHÔNG quyết H1/H3
  (prereg-e4batch §4: CAUGHT-NO-RESEEK → HỖN HỢP / KHÔNG KẾT LUẬN).
- Drift recount sau seek ban đầu (prereg §3, kiểm tay): vượt
  >0,35 = **14 lần** (tick 12 (0,3887), 14 (0,4251), 16 (0,5),
  17 (0,4985), 19 (0,4193), 20 (0,3667), 21 (0,4594), 23 (0,4237),
  25 (0,4238), 29 (0,4448), 30 (0,4), 31 (0,3612), 32 (0,3667),
  33 (0,452); max 0,5 ở tick 16, min −0,3 ở tick 37 — bỏ 3 tick
  đầu sau seek); **có 2 tick liên tiếp cùng vượt** (16–17, 19–21,
  29–33). Sau tick 35 drift lắng (tick 60–195 drift toàn 0,
  ct=ph=6). tailBursts cuối 0, tailEndedClosed cuối 0,
  tailDriftGate cuối 2 (chặn ở tick 15 và tick 17).
- Probe verdict nội bộ: playhead-giữ-trong-seek PASS;
  playhead-lúc-canvas-đổi-khung PASS (seekDoneIdx=2,
  seekDoneRelMs=328 ms, canvasChangeRelMs=437 ms).

## 2. Tính hợp lệ của lượt đếm (att1, không chạy lại)

- Cây đo: preview.tsx md5 `03bf029f09b8890b285eacc10a02172b`
  (BASELINE) trước=sau; media.ts
  `2c384ed13703809d5e999311147745e7`; preview.tsx mtime
  12:02:56Z không đổi. H3f đã gỡ 12:02:56Z đợt 122,
  **không apply lại**. Không sửa production.
- Boot `ff7afbbb-1f8b-46e7-abd3-3e9d9ae1af69` (#71 tạm, theo tên
  file T5 `t5-postboot-b71-try1.log`, chờ T6 xác nhận số) không đổi
  trước=sau; không reboot giữa lượt. Gap #70→#71 2h31'22".
- Lock v2 cổng 5590: wait 0 s, hold 53 s, RELEASED 23:46:43Z
  (ticket 1-1794872750893107893-13734-t1-round126). Cờ cây
  NO-CHANGE. Không DEFER, không KILLED.
- Postboot PASS sau 3 phút chờ: cờ `round126-t5/POSTBOOT_PASS`
  xuất hiện 23:43:58Z (poll=try1, chứa đúng boot_id hiện tại —
  luật STALE chấp nhận ngay; cờ PASS của boot #70 đã chết không
  được dùng). T5 kiểm cuối PASS đầy đủ: wrapper/libs/GST 269
  plugin đủ isomp4+libav/apt đủ 11 pkg
  (`t5-postboot-b71-try1.log`). Replay boot #71 cài thật:
  dpkg.log 1509 dòng, gói cuối gstreamer1.0-tools 23:37:46Z
  (replay xong TRƯỚC khi T1 khởi động — khác boot #69 đợt 125
  chết replay). Tải lúc bắt đầu probe: load 3,46, RAM khả dụng
  1730 MB.

## 3. Lượt 8 của T2 (đối chiếu) — VOID, lô → 7/10 trước lượt 9

- T2 att1 KILLED-REBOOT (cùng reboot ~20:54:19Z đợt 125, driver
  chết giữa lúc chờ cờ T1 trên boot #69); att2 retry thành công,
  probe exit=0 (21:11:54–21:12:27Z, 33 s).
- T2 att2: velTicks=480, sampler=134, renderTicks=78, raf=110,
  rvfc=0, pageErrs=0, tailSteadyClosed=0, drift >0,35 sau seek
  ban đầu **0 lần** (max 0,1139 ở tick 70, min −0,0333),
  resyncsV chỉ đổi ở tick 2 (seek ban đầu), restartV cuối=0.
  Sampler 1 seeking run (samples 0..1, relMs 126..234, 108 ms —
  seek ban đầu). Pause-seek confirmed=true (tElement 266 ms,
  tCanvas 315 ms — nhanh nhất trên baseline từ trước tới nay).
  T2 đối chiếu độc lập bằng analyze-t2.py trên probe-results.json
  của T1 lượt 7 — tái hiện đúng VOID. T2 viết LIMITS + cờ
  `round125-t2.done`. Xem
  `docs/PHASE9_ROUND125_T2_E4BATCH_R8_LIMITS.md`. Lô: 7/10 trước
  lượt 9.

## 4. Đối chiếu lượt 9 với lượt 7 + lượt 8

- **Cụm drift chân A gop250 LẶP LẠI:** lượt 7 att2 (A, boot #70)
  14 lần vượt >0,35, max 0,6068, cụm tick 12–34; lượt 9 att1 (A,
  boot #71) 14 lần vượt, max 0,5, cụm tick 12–33 — cùng số lần,
  cùng cửa sổ tick, cùng dạng (ct chạy trước ph 0,36–0,5 trong
  khi cả hai cùng tăng đơn điệu, KHÔNG kèm đổi resyncsV, KHÔNG có
  sampler seeking run sau run ban đầu). Lượt 8 (B, gop30) 0 lần
  vượt, max 0,1139. Kết luận đối chiếu: cụm drift là đặc tính của
  chân A gop250 (hai lượt A liên tiếp trên hai boot khác nhau đều
  có), không phải nhiễu một lượt, không phải đặc tính chung của
  cặp A+B.
- **Steady-close CHỈ xuất hiện ở lượt 9, không ở lượt 7 — ĐÃ GIẢI
  THÍCH ĐƯỢC BẰNG KIỂM TAY DỮ LIỆU LƯỢT 7 (không phải câu hỏi
  mở):** cả hai lượt A đều có đuôi ân hạn Y4 mở ở tick 13 sau
  burst tick 12, với steadyAdvances 0→1→2→3 qua tick 13–16 giống
  hệt nhau (lượt 7: endedAtMs=2686; lượt 9: endedAtMs=1767).
  Điểm khác nằm ở ĐÚNG 1 lần tăng thứ 4 (tick 17): lượt 7 rate
  **1,71× > 1,5× → burst-block** (ct +0,6068 trong 355 ms) nên
  steady reset về 0, đuôi biến mất ở tick 17 mà steadyClosed giữ
  0; lượt 9 rate **1,41× ≤ 1,5× → tăng lành** (ct +0,3985 trong
  282 ms) nên steady 3→4, đuôi đóng vì steady, bộ đếm 0→1. Đúng
  thiết kế N1 (burst reset steady — PREREG-N1 §2). Lượt 8 (B)
  đuôi chỉ mở 2 tick (14–15, steadyAdvances tối đa 1) rồi đóng,
  không steady-close. Kết luận: steady-close không phải ngẫu
  nhiên — nó phụ thuộc vào lần tăng thứ 4 sau khi đuôi mở có lành
  hay burst.
- **Pause-seek:** lượt 9: 1296/1362 ms — giữa lượt 5 att2
  (1423/1473 ms) và lượt 3 (781/897 ms); chậm hơn lượt 8
  (266/315 ms, nhanh nhất) nhưng nhanh hơn lượt 7 (1806/1871 ms,
  chậm nhất). Thứ tự pause-seek trên baseline từ nhanh tới chậm:
  lượt 8 (266/315) < lượt 6 (524/578) < lượt 4 (563/672) <
  lượt 3 (781/897) < lượt 9 (1296/1362) < lượt 5 (1423/1473) <
  lượt 7 (1806/1871). Tải lúc bắt đầu probe lượt 9 (load 3,46)
  cao hơn lượt 8 (0,79) nhưng thấp hơn lượt 7 (4,45) — khớp
  hướng tương quan tải ↔ pause-seek chậm, chưa chứng minh nhân
  quả.
- **Sự kiện cuối clip lượt 6 KHÔNG lặp lại:** lượt 6 att1 có
  resyncsV + restartV đổi thêm ở tick 74 cuối clip; lượt 7, 8, 9
  đều không có (resyncsV chỉ đổi ở tick seek ban đầu, restartV
  cuối=0). Sự kiện tick 74 lượt 6 vẫn là đơn lẻ.
- **velTicks=196 là ít nhất trên baseline** (lượt 3: 428; lượt 4:
  447; lượt 5: 293; lượt 6: 433; lượt 7: 292; lượt 8: 480) —
  cửa sổ tick t=85→19369 ms (~19,3 s). Chỉ số này không đổi
  verdict (CAUGHT dựa trên tailSteadyClosed=1, không dựa trên
  số tick).
- **Transient tick 0 không phải re-seek:** tick 0 drift 4,5
  (ct=5, ph=0,5) xảy ra TRƯỚC seek ban đầu (tick 2), không kèm
  đổi resyncsV; tick 1 đã về 0,5/0,5 (drift 0,0). Recount §3 chỉ
  tính tick SAU seek ban đầu nên không tính tick này (cùng mẫu
  các lượt trước).

## 5. Ghi chú trung thực

- **Đây là lượt CAUGHT đầu tiên của lô (8 lượt trước đều VOID),
  nhưng là CAUGHT-NO-RESEEK — không quyết được H1/H3.** Tiền điều
  kiện (steady-close) đã xuất hiện: đuôi ân hạn đóng vì decoder
  decode ổn định 4 tick liên tiếp, đúng cơ chế fix N1. Nhưng sau
  khi đuôi đóng, hệ thống KHÔNG bắn drift re-seek nào để sửa lệch
  vị trí còn lại (drift vẫn >0,35 ở 10 tick sau đó) — lệch chỉ
  hết vì playhead tự đuổi kịp currentTime ở tick 35. Theo
  prereg-e4batch §4, lượt này thuộc nhóm HỖN HỢP / KHÔNG KẾT LUẬN.
- **Caveat phân loại — parent cần xét lại trước lượt 10:** dòng
  chú thích trong ngoặc của prereg-e4batch §2 cho CAUGHT-NO-RESEEK
  viết "(drift sau steady-close không bao giờ vượt 0,35 xác nhận
  2 tick liên tiếp)". Ở lượt 9, drift sau steady-close VẪN vượt
  0,35 ở 10 tick (19, 20, 21, 23, 25, 29, 30, 31, 32, 33; có cặp
  liên tiếp 19–21 và 29–33) — lệch vị trí tồn tại ~3,4 s sau khi
  đuôi đóng mà không có re-seek. Phân loại CAUGHT-NO-RESEEK ở đây
  theo định nghĩa CHÍNH ("KHÔNG có drift re-seek nào trong cửa sổ
  quan sát" — đã xác minh bằng 3 bằng chứng độc lập: resyncsV
  không tăng, sampler không seeking, ct không nhảy về ph). Điểm
  lệch này làm cho lượt 9 là bằng chứng MẠNH HƠN (không yếu hơn)
  cho "không re-seek": điều kiện kích re-seek đã đủ mà re-seek vẫn
  không bắn. Nhưng vì prereg viết dòng chú thích hẹp hơn định
  nghĩa chính, T1 ghi rõ để parent quyết: giữ nguyên phân loại
  hay đính chính prereg-e4batch §2 trước lượt 10.
- **Ứng viên re-seek tick 35 của analyzer là dương tính giả —
  đã kiểm tay, không phải re-seek.** Analyzer T1 tìm "drift
  re-seek" bằng |ct−ph| < 0,05 sau ≥0,05; ở tick 35 drift đóng
  vì ph nhảy lên, không phải ct nhảy về ph, và sampler-bracket
  không tìm thấy seeking nào. Nếu chỉ tin mù output analyzer mà
  không kiểm tay 3 bằng chứng trên thì lượt này đã bị phân loại
  sai thành CAUGHT-RESEEK với seeking-duration không đo được.
  Bài học: heuristic |ct−ph| của analyzer không phân biệt được
  "ct nhảy về ph" (seek thật) với "ph đuổi kịp ct" (không seek)
  — các lượt sau cần kiểm tay bước này như lượt 9 đã làm.
- **CAUGHT này không chứng minh E4 đã đóng hay mở** — chỉ chứng
  minh trong 1 lượt A gop250 trên cây baseline, tiền điều kiện
  steady-close đã xuất hiện 1 lần và không có re-seek theo sau.
  Cần lượt 10 (B, gop30) khép lô 10/10; cặp A+B CAUGHT-RESEEK
  vẫn chưa có nên H1/H3 vẫn chưa phân định.
- **Không gộp với lượt 2:** lượt 2 VOID đo trên cây H3f; số lượt
  9 này thuộc loạt baseline. Verdict H1/H3 cần cặp A+B
  CAUGHT-RESEEK trên CÙNG cây — chưa có.
- Không đo TTS 39, không thử birefnet (RAM khả dụng 1604–1730 MB
  lúc đo, < 6 GB guard; u2net là fallback chính thức). Không chạy
  lại tsc/vite build: cây không đổi một byte (md5 trước=sau, mtime
  không đổi) và probe đã khởi động vite dev + WebKit thành công
  trên chính cây này.
- Không push, không release/tag, không sửa production. Driver đã
  đếm apt bằng `pgrep -x` (không dùng grep-ps) theo luật cứng
  đợt 124; không `pkill -f`.

## 6. Tiến độ lô sau lượt này

- Lượt đếm được: **8/10** (1 CAUGHT-NO-RESEEK, 7 VOID — lượt 2 B
  gop30 cây H3f; lượt 3 att3 A gop250 cây baseline; lượt 4 att5 B
  gop30 cây baseline; lượt 5 att2 A gop250 cây baseline; lượt 6
  att1 B gop30 cây baseline; lượt 7 att2 A gop250 cây baseline;
  lượt 8 att2 B gop30 cây baseline; lượt 9 att1 A gop250 cây
  baseline — **CAUGHT-NO-RESEEK, lượt bắt được ĐẦU TIÊN**).
  Lượt đếm trên baseline: 7. Lượt không đếm: 10.
- Lượt tiếp theo: lượt 10 (B, gop30, phase `e4b10`) ở đợt sau,
  trên cây baseline. Lô sẽ khép ở 10/10 sau lượt 10 (trừ khi
  lượt 10 là CAUGHT-RESEEK và cặp với lượt 9 — không thể, vì
  lượt 9 là NO-RESEEK — nên không có DỪNG-VERDICT ở lượt 10;
  lô kết thúc theo DỪNG-HẾT-LƯỢT, E4 giữ ĐÓNG CÓ ĐIỀU KIỆN trừ
  khi parent quyết khác).

## 7. File liên quan

- Prereg: `workspace/goals/capcut-clone-video-editor/hidden_files/round126-t1/prereg-e4batch-luot9.md`
  (§0–§4 đăng ký; §5 hậu kiểm lượt 9 att1)
- Driver + log: `.../round126-t1/run-t1.sh`, `run-t1.log`,
  `run-t1-driver.out` (att1, không chạy lại)
- Analyzer: `.../round126-t1/analyze-t1.py` (logic y hệt đợt 125;
  verify sống bằng chạy trên dữ liệu lượt 9 trước khi ghi LIMITS)
- Số thô: `.../round126-t1/probe-webkit-load0-gop250-e4a9/probe-results.json`
  (gốc: `.../round116-s1/probe-webkit-load0-gop250-e4a9/`,
  md5 `a403dfa9ceb22b488b398783fddc7c42`)
- Sổ cái: `.../round118-t9/e4batch-ledger.md` (đã thêm hàng lượt 9
  att1; tiến độ 8/10, lượt không đếm 10)
- Cờ T5: `.../round126-t5/POSTBOOT_PASS` (boot #71 tạm, 23:43:58Z,
  poll=try1, chứa đúng boot_id `ff7afbbb…`)
- Batch stage: `repo-1-push/paths-loop/phase9-round126-t1-e4batch-r9.txt`
