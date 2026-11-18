# LIMITS — Phase 9 đợt 124 T1: E4BATCH lượt 5 att1 + att2 (A, gop250, e4a5) trên cây BASELINE

> Đo thật, không code giả. Lượt đếm được trên cây baseline.
> Verdict lượt 5: **VOID (đếm được, att2)**. Lô E4BATCH: **4/10**
> (0 CAUGHT, 4 VOID).

## 1. Kết quả — lượt 5 att2: VOID

- Probe `probe116s1.mjs` (giữ nguyên, không sửa), engine WebKit,
  loadN=0, gop=250, clip `o8-ball-720p-6s.mp4`, phase `e4a5`.
- Probe chạy 17:48:37–17:49:20Z, **exit=0** (43 s). Pause-seek tới
  t=5: confirmed=true (tElement 1423 ms, tCanvas 1473 ms). Phát sau
  seek tới cuối tự nhiên (localPh=6) + 10 s quan sát.
- Số đo thật (probe-results.json, đã copy về
  `hidden_files/round124-t1/probe-webkit-load0-gop250-e4a5/`,
  md5 `22c21e2d501136b67fa0071b46fa0efe` khớp bản gốc round116-s1):
  velTicks=293, sampler=124, renderTicks=43, raf=77, rvfc=0,
  pageErrs=0.
- **tailSteadyClosed = 0 → VOID** (prereg §4: 0 steady-close trong
  toàn bộ 180 s, probe exit 0 — ĐẾM vào lô, không retry vì kết quả
  seek).
- resyncsV chỉ đổi ở tick 3 (seek ban đầu, ct=ph=0,5),
  restartV cuối=0. Sampler chỉ bắt 1 seeking run (samples 0..1,
  relMs 184..285, 101 ms — seek ban đầu).
- Drift recount sau seek ban đầu (prereg §3, kiểm tay): vượt
  >0,35 = **0 lần**; max 0,2375, min −0,0334; không có 2 tick liên
  tiếp cùng vượt; 10 tick cuối drift toàn 0 (ct=ph=6).
  tailBursts cuối 0, tailEndedClosed cuối 0.
- Probe verdict nội bộ: playhead-giữ-trong-seek PASS;
  playhead-lúc-canvas-đổi-khung PASS.

## 2. Tính hợp lệ của lượt đếm (att2)

- Cây đo: preview.tsx md5 `03bf029f09b8890b285eacc10a02172b`
  (BASELINE) trước=sau; media.ts
  `2c384ed13703809d5e999311147745e7`; preview.tsx mtime
  12:02:56Z không đổi. H3f đã gỡ 12:02:56Z đợt 122,
  **không apply lại**. Không sửa production.
- Boot `69359761-1650-4956-b3cb-481410689a9b` (#68 tạm, chờ T6 xác
  nhận số) không đổi trước=sau; không reboot giữa lượt.
- Lock v2 cổng 5590: wait 0 s, hold 43 s, RELEASED 17:49:20Z
  (ticket 1-1794851317083482578-15796-t1-round124). Cờ cây
  NO-CHANGE. Không DEFER, không KILLED.
- Postboot PASS sau 0 phút chờ: cờ `round124-t5/POSTBOOT_PASS`
  đã có lúc driver khởi động (17:48:36Z), chứa đúng boot_id hiện
  tại → chấp nhận ngay theo luật STALE (cờ round123-t5/ của boot
  #67 đã chết không được dùng). T5 kiểm exit 0 lúc 17:42:03Z
  (boot +8m12s), xác nhận lại exit 0 lúc 17:43:48Z (boot +9m57s).
  Replay #68 nhanh: configure 17:35:42Z (boot +1m51s), installs
  xong 17:38:42Z (boot +4m51s), dpkg.log 2→1509 dòng, gói cuối
  gstreamer1.0-tools 17:38:42Z; 0 apt/dpkg chạy lúc kiểm; 2 gói
  từng thiếu ở #65 (plugins-bad, libav) đều được cài ở boot này.

## 3. Lượt 5 att1: KILLED-HARNESS (không đếm) — retry 1 lần theo prereg

- Driver att1 17:44:52–17:46:02Z trên cùng boot #68, md5 live khớp
  baseline ngay từ đầu, postboot PASS sau 0 phút chờ (cờ đã có).
  Lock v2 cổng 5590: wait 1 s, hold 54 s, RELEASED 17:45:47Z
  (ticket 1-1794851092968278282-13362-t1-round124).
- Probe 17:44:54–17:45:46Z **exit=2**: pause-seek tới t=5
  confirmed=false sau 30 s — tElement=1314 ms (element đã tới t=5)
  nhưng **tCanvas=null** (canvas không đổi sang khung kỳ vọng tại
  t=5 trong 30 s) → probe throw "không đo phát sau seek trên khung
  stale". Không có probe-results.json cho att1. md5/boot không đổi,
  không reboot, không sửa production.
- Log att1 đã sao lưu (`run-t1.log.att1-boot68.bak` +
  `run-t1-driver.out.att1-boot68.bak`). Chạy lại là att2 lúc
  17:48:36Z sau 90 s chờ tải hạ (xem §5) — đúng 1 retry duy nhất
  cho lỗi harness theo prereg §2.
- Lưu ý tiền lệ: lượt 1 (đợt 118/T9) cũng att1 KILLED-HARNESS với
  cùng lỗi (tElement=3136 ms, tCanvas=null) rồi att2 DEFER-LOCK
  nên lượt 1 để trống. Lần này att2 thành công nên lượt 5 ĐẾM được.

## 4. Lượt 3 + lượt 4 (đối chiếu) — đều VOID trên baseline

- Lượt 3 att3 (đợt 123/T1, boot #66): VOID, velTicks=428,
  tailSteadyClosed=0, drift >0,35 sau seek ban đầu 0 lần
  (max 0,1475, min −0,0667), resyncsV chỉ đổi ở tick 5.
- Lượt 4 att5 (đợt 123/T2, boot #67): VOID, velTicks=447,
  tailSteadyClosed=0, drift >0,35 sau seek ban đầu 0 lần
  (max 0,1102, min −0,0334), resyncsV chỉ đổi ở tick 3.
- Cặp A+B trên cây baseline sau đợt 124: lượt 3 (A) VOID + lượt 4
  (B) VOID + lượt 5 (A) VOID — **H1/H3 vẫn chưa có cặp
  CAUGHT-RESEEK**.

## 5. Ghi chú trung thực

- **Transient tick 1 không phải re-seek:** tick 1 drift 4,5
  (ct=5, ph=0,5) xảy ra TRƯỚC seek ban đầu (tick 3), không kèm
  đổi resyncsV; tick 2 đã về 0,5/0,5. Recount §3 chỉ tính tick
  SAU seek ban đầu nên không tính tick này (cùng mẫu với lượt 3
  att3 và lượt 4 att5). Không làm đổi verdict VOID.
- **Pause-seek chậm nhất từ trước tới nay (att2):** tElement/
  tCanvas 1423/1473 ms (lượt 2 trên H3f: 157/207 ms; lượt 3 trên
  baseline: 781/897 ms; lượt 4: 563/672 ms) — vẫn confirmed,
  nhưng xu hướng chậm dần qua các lượt chưa được giải thích. Att1
  cùng đợt còn chậm hơn ở phía canvas (tCanvas=null sau 30 s).
  Tải lúc probe att1: load 2,21 lúc bắt đầu, load 1 phút vọt lên
  6,62 lúc 17:46:43Z — đúng lúc T3 đợt 124 chạy quét toàn workspace
  (`find ... -exec stat`, PID 13893, 13,3% CPU, trong
  `blind40B-t3v2.py`) song song; att2 chạy sau 90 s chờ, load lúc
  bắt đầu 1,94, seek xác nhận được. Đây là tương quan, không phải
  chứng minh nhân quả — ghi lại để đối chiếu các lượt sau.
- **velTicks=293 ít hơn hẳn lượt 3 (428) và lượt 4 (447):**
  cửa sổ tick 7→18807 ms (~18,8 s) tương đương các lượt trước
  nhưng mật độ tick thưa hơn — có thể do tải hệ thống lúc đo.
  Không suy diễn thêm; chỉ số này không đổi verdict (VOID dựa
  trên tailSteadyClosed=0, không dựa trên số tick).
- **VOID này không chứng minh E4 vắng mặt tuyệt đối** — chỉ chứng
  minh trong 1 lượt A gop250 trên cây baseline, 293 tick, không
  quan sát được steady-close nào. Cần đủ 10 lượt mới kết luận lô.
- **Không gộp với lượt 2:** lượt 2 VOID đo trên cây H3f; số lượt 5
  này thuộc loạt baseline. Verdict H1/H3 cần cặp A+B
  CAUGHT-RESEEK trên CÙNG cây — chưa có.
- Không đo TTS 39, không thử birefnet (RAM khả dụng 1300–2782 MB
  lúc đo, < 6 GB guard; u2net là fallback chính thức). Không chạy
  lại tsc/vite build: cây không đổi một byte (md5 trước=sau, mtime
  không đổi) và probe đã khởi động vite dev + WebKit thành công
  trên chính cây này.
- Không push, không release/tag, không sửa production. Driver đã
  vá đếm apt bằng `pgrep -x` (không dùng grep-ps) theo luật cứng
  đợt 124; không `pkill -f`.

## 6. Tiến độ lô sau lượt này

- Lượt đếm được: **4/10** (0 CAUGHT, 4 VOID — lượt 2 B gop30 cây
  H3f; lượt 3 att3 A gop250 cây baseline; lượt 4 att5 B gop30 cây
  baseline; lượt 5 att2 A gop250 cây baseline). Lượt đếm trên
  baseline: 3. Lượt không đếm: 8 (thêm lượt 5 att1 KILLED-HARNESS).
- Lượt tiếp theo: lượt 6 (B, gop30, phase `e4b6`) ở đợt sau, trên
  cây baseline.

## 7. File liên quan

- Prereg: `workspace/goals/capcut-clone-video-editor/hidden_files/round124-t1/prereg-e4batch-luot5.md`
  (§0–§4 đăng ký; §5 hậu kiểm lượt 5 att1 + att2)
- Driver + log: `.../round124-t1/run-t1.sh`, `run-t1.log`,
  `run-t1-driver.out` (att2) + `run-t1-driver.out.att2`
  (+ bản sao lưu att1 `run-t1.log.att1-boot68.bak`,
  `run-t1-driver.out.att1-boot68.bak`)
- Analyzer: `.../round124-t1/analyze-t1.py` (logic y hệt đợt 123)
- Số thô: `.../round124-t1/probe-webkit-load0-gop250-e4a5/probe-results.json`
  (gốc: `.../round116-s1/probe-webkit-load0-gop250-e4a5/`,
  md5 `22c21e2d501136b67fa0071b46fa0efe`)
- Sổ cái: `.../round118-t9/e4batch-ledger.md` (đã thêm hàng lượt 5
  att1 + att2; tiến độ 4/10, lượt không đếm 8)
- Cờ T5: `.../round124-t5/POSTBOOT_PASS` (boot #68 tạm, 17:42:03Z,
  xác nhận lại 17:43:48Z)
- Batch stage: `repo-1-push/paths-loop/phase9-round124-t1-e4batch-r5.txt`
