# LIMITS — Phase 9 đợt 124 T2: E4BATCH lượt 6 att1 (B, gop30, e4b6) trên cây BASELINE

> Đo thật, không code giả. Lượt đếm được trên cây baseline.
> Verdict lượt 6: **VOID (đếm được, att1)**. Lô E4BATCH: **5/10**
> (0 CAUGHT, 5 VOID).

## 1. Kết quả — lượt 6 att1: VOID

- Probe `probe116s1.mjs` (giữ nguyên, không sửa), engine WebKit,
  loadN=0, gop=30, clip `o8-ball-720p-6s-gop30.mp4`, phase `e4b6`.
- Probe chạy 17:53:54–17:54:30Z, **exit=0** (36 s). Pause-seek tới
  t=5: confirmed=true (tElement 524 ms, tCanvas 578 ms — nhanh nhất
  trên baseline từ trước tới nay; lượt 3: 781/897 ms, lượt 4:
  563/672 ms, lượt 5 att2: 1423/1473 ms). Phát sau seek tới cuối
  tự nhiên (localPh=6, ended=true) + 10 s quan sát (endObserveMs
  10522).
- Số đo thật (probe-results.json, đã copy về
  `hidden_files/round124-t2/probe-webkit-load0-gop30-e4b6/`):
  velTicks=433, sampler=142, renderTicks=82, raf=116, rvfc=0,
  pageErrs=0.
- **tailSteadyClosed = 0 → VOID** (prereg §4: 0 steady-close trong
  toàn bộ 180 s, probe exit 0 — ĐẾM vào lô, không retry vì kết quả
  seek).
- resyncsV đổi ở tick 3 (seek ban đầu, t=454 ms, ct=ph=0,5) VÀ
  tick 74 (xem §3 — resync/restart cuối clip, không phải re-seek).
  restartV cuối=1 (đổi 0→1 ở tick 74). Sampler bắt 2 seeking run:
  samples 0..3, relMs 206..575 (369 ms — seek ban đầu) và 1 mẫu
  đơn sample 43, relMs 6962 (ct=5,9 — cuối clip, kèm tick 74).
- Drift recount sau seek ban đầu (prereg §3, kiểm tay): vượt
  >0,35 = **0 lần** (429 tick sau seek; max 0,2288 ở tick 20,
  min 0,0 — không có drift âm nào trong lượt này); không có 2 tick
  liên tiếp cùng vượt; 10 tick cuối drift toàn 0 (ct=ph=6).
  tailBursts cuối 0, tailEndedClosed cuối 1 (clip kết thúc tự
  nhiên), tailSteadyClosed cuối 0.
- Probe verdict nội bộ: playhead-giữ-trong-seek PASS;
  playhead-lúc-canvas-đổi-khung PASS.

## 2. Tính hợp lệ của lượt đếm (att1)

- Cây đo: preview.tsx md5 `03bf029f09b8890b285eacc10a02172b`
  (BASELINE) trước=sau; media.ts
  `2c384ed13703809d5e999311147745e7`. H3f đã gỡ 12:02:56Z đợt 122,
  **không apply lại**. Không sửa production (preview.tsx mtime
  12:02:56Z không đổi giữa lượt).
- Boot `69359761-1650-4956-b3cb-481410689a9b` (#68 tạm, chờ T6 xác
  nhận số) không đổi trước=sau; không reboot giữa lượt.
- Lock v2 cổng 5581: wait 0 s, hold 37 s, RELEASED 17:54:30Z
  (ticket 1-1794851633713447665-17322-t2-round124). Cờ cây
  NO-CHANGE. Không DEFER, không KILLED.
- Postboot PASS sau 0 phút chờ cờ T5 đợt 124: POSTBOOT_PASS của
  boot #68 đã có từ 17:42:03Z (exit 0, PASS NHỜ REPLAY, không
  repair — replay nhanh: configure 17:35:42Z boot +1m51, installs
  xong 17:38:42Z boot +4m51, dpkg.log 2→1509 dòng, gói cuối
  gstreamer1.0-tools 17:38:42Z; xác nhận lại exit 0 lúc 17:43:48Z)
  và chứa đúng boot_id hiện tại nên luật STALE chấp nhận ngay.
  Driver tự kiểm postboot check-only lúc khởi động: DU DIEU KIEN.
  apt/dpkg đang chạy lúc khởi động (pgrep -x): 0/0.
- Giai đoạn 0 qua ngay: cờ `round124-t1.done` đã có từ 17:53Z
  (T2 chờ cờ TRƯỚC KHI chạy driver theo nhiệm vụ parent — vòng
  chờ `wait-t1.sh` poll 30 s, cờ xuất hiện sau 120 s chờ, boot
  không đổi trong lúc chờ).

## 3. Sự kiện tick 74 — resync/restart cuối clip (ghi lại, không đổi verdict)

- Tick 74 (t=6986 ms): resyncsV 1→2, restartV 0→1, ct=ph=5,9,
  drift 0; rTicks=6, rHolds=1. Tick 70–73 trước đó: ct leo
  5,7→6→5,9, ph 5,6333→5,9; tick 73 đã ct=ph=5,9. Sau tick 74,
  ct đóng băng ~5,9015–5,9017 suốt 10 s quan sát (clip đã tới
  cuối tự nhiên, dur=6).
- Đây là resync/restart ở CUỐI CLIP, không phải re-seek giữa lúc
  phát: drift tại tick 74 = 0, không kèm drift vượt >0,35 nào
  trước/sau, và tailSteadyClosed vẫn 0 trước/sau sự kiện nên
  không đủ điều kiện CAUGHT (CAUGHT cần tailSteadyClosed ≥ 1).
  Sampler chỉ bắt thêm 1 mẫu seeking đơn lẻ ở relMs 6962
  (sample 43, ct=5,9) — trùng thời điểm tick 74.
- Khác các lượt trước: lượt 3/4/5 resyncsV chỉ đổi ở tick seek
  ban đầu, restartV cuối=0; lượt 6 là lượt đầu tiên có sự kiện
  cuối clip này. Ghi lại để đối chiếu các lượt sau; không suy
  diễn nguyên nhân (có thể do clip chạm cuối tự nhiên trong lúc
  sampler còn chạy — không có bằng chứng phân biệt thêm).
- tailEndedClosed cuối=1 (lượt 4: 0) — clip kết thúc tự nhiên
  được ghi nhận; không phải steady-close, không đổi verdict.

## 4. Lượt 5 của T1 (đối chiếu) — VOID, lô → 4/10 trước lượt 6

- T1 att1 KILLED-HARNESS (probe exit=2, pause-seek tới t=5
  confirmed=false sau 30 s, tElement=1314 ms, tCanvas=null,
  17:45:46Z — cùng dạng lỗi lượt 1 att1 đợt 118); att2 retry
  thành công, probe exit=0 (17:48:37–17:49:20Z).
- T1 att2: velTicks=293, sampler=124, renderTicks=43, raf=77,
  rvfc=0, pageErrs=0, tailSteadyClosed=0, drift >0,35 sau seek
  ban đầu 0 lần (max 0,2375, min −0,0334), resyncsV chỉ đổi ở
  tick 3 (seek ban đầu), restartV cuối=0. Sampler 1 seeking run
  (samples 0..1, relMs 184..285, 101 ms — seek ban đầu).
  Pause-seek confirmed=true (tElement 1423 ms, tCanvas 1473 ms).
  T2 đối chiếu độc lập bằng analyze-t2.py trên
  probe-results.json của T1 — tái hiện đúng VOID. Xem
  `docs/PHASE9_ROUND124_T1_E4BATCH_R5_LIMITS.md`. T1 viết LIMITS
  + cờ `round124-t1.done` lúc 17:53Z.
- **Cặp A+B đợt 124 (lượt 5 A + lượt 6 B) khép lại đều VOID —
  H1/H3 vẫn chưa có cặp CAUGHT-RESEEK.**

## 5. Ghi chú trung thực

- **Transient tick 1 không phải re-seek:** tick 1 drift 4,5
  (ct=5, ph=0,5) xảy ra TRƯỚC seek ban đầu (tick 3), không kèm
  đổi resyncsV; tick 2 đã về 0,5/0,5. Recount §3 chỉ tính tick
  SAU seek ban đầu nên không tính tick này (cùng mẫu với lượt 3
  att3, lượt 4 att5, lượt 5 att2). Không làm đổi verdict VOID.
- **VOID này không chứng minh E4 vắng mặt tuyệt đối** — chỉ chứng
  minh trong 1 lượt B gop30 trên cây baseline, 433 tick, không
  quan sát được steady-close nào. Cần đủ 10 lượt mới kết luận lô.
- **Không gộp với lượt 2:** lượt 2 VOID đo trên cây H3f; số lượt 6
  này thuộc loạt baseline. Verdict H1/H3 cần cặp A+B
  CAUGHT-RESEEK trên CÙNG cây — chưa có.
- **Tải lúc probe:** RAM khả dụng lúc driver khởi động 2936 MB
  (cao hơn hẳn mức ghim ~474 MB đợt 123); load lúc bắt đầu 1,67;
  loadavg cuối 4,49/3,36/2,51 (tăng trong lúc probe — có thể do
  các luồng khác trong đợt chạy song song; không suy diễn thêm).
  Pause-seek tElement/tCanvas 524/578 ms là nhanh nhất trên
  baseline từ trước tới nay — vẫn confirmed, chênh lệch chưa được
  giải thích, ghi lại để đối chiếu các lượt sau.
- Không đo TTS 39, không thử birefnet (u2net là fallback chính
  thức). Không chạy lại tsc/vite build: cây không đổi một byte
  (md5 trước=sau, mtime không đổi) và probe đã khởi động vite dev
  + WebKit thành công trên chính cây này.
- Không push, không release/tag, không sửa production.

## 6. Vết nhỏ trong log driver (chỉ nhãn chữ, không ảnh hưởng phép đo)

- Khi thích ứng driver từ đợt 123 bằng sed, 3 dòng log giữ nhãn
  cũ: "quyết parent đợt 121 §12.1: lượt 3 (A) chạy trước, rồi
  lượt 6 (B)", "T1 đợt 123 đã xong (lượt 3)", "thư mục cờ hạ
  tầng… (T5 đợt 123)". Đường cờ/tham số thực tế dùng đều đúng
  đợt 124: chờ `round124-t1.done`, `round124-t5/POSTBOOT_PASS`
  chứa boot_id hiện tại `69359761…`, phase e4b6, cổng 5581,
  EXPECTED_MD5 baseline `03bf029f` — log tự chứng minh (giai
  đoạn 0 qua ngay nhờ cờ round124-t1.done 17:53Z; cờ T5 chấp
  nhận sau 0 phút nhờ boot_id khớp). Không sửa lại log sau đo.

## 7. Tiến độ lô sau lượt này

- Lượt đếm được: **5/10** (0 CAUGHT, 5 VOID — lượt 2, B gop30, cây
  H3f; lượt 3 att3, A gop250, cây baseline; lượt 4 att5, B gop30,
  cây baseline; lượt 5 att2, A gop250, cây baseline; lượt 6 att1,
  B gop30, cây baseline). Lượt đếm trên baseline: 4 (lượt 3 + 4 +
  5 + 6, cả bốn VOID). Lượt không đếm: 8.
- Lượt tiếp theo: lượt 7 (A, gop250, phase `e4a7`) ở đợt sau, trên
  cây baseline.

## 8. File liên quan

- Prereg: `workspace/goals/capcut-clone-video-editor/hidden_files/round124-t2/prereg-e4batch-luot6.md`
  (§0–§4 đăng ký att1; §5 hậu kiểm VOID)
- Driver + log: `.../round124-t2/run-t2.sh`, `run-t2.log`,
  `run-t2-driver.out`, `wait-t1.sh` (+ `wait-t1.log`)
- Analyzer: `.../round124-t2/analyze-t2.py` (logic y hệt đợt 123;
  verify sống bằng dry-run trên dữ liệu lượt 4 trước khi đo)
- Số thô: `.../round124-t2/probe-webkit-load0-gop30-e4b6/probe-results.json`
  (gốc: `.../round116-s1/probe-webkit-load0-gop30-e4b6/`)
- Sổ cái: `.../round118-t9/e4batch-ledger.md` (đã thêm hàng lượt 6
  att1; tiến độ 5/10, lượt không đếm 8)
- Cờ T5: `.../round124-t5/POSTBOOT_PASS` (boot #68, 17:42:03Z,
  exit 0, PASS NHỜ REPLAY)
- Cờ T1: `.../round124-t1.done` (17:53Z)
