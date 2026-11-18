# LIMITS — Phase 9 đợt 123 T2: E4BATCH lượt 4 att4 + att5 (B, gop30, e4b4) trên cây BASELINE

> Đo thật, không code giả. Lượt đếm được trên cây baseline.
> Verdict lượt 4: **VOID (đếm được, att5)**. Lô E4BATCH: **3/10**
> (0 CAUGHT, 3 VOID).

## 1. Kết quả — lượt 4 att5: VOID

- Probe `probe116s1.mjs` (giữ nguyên, không sửa), engine WebKit,
  loadN=0, gop=30, clip `o8-ball-720p-6s-gop30.mp4`, phase `e4b4`.
- Probe chạy 15:00:28–15:01:03Z, **exit=0** (35 s). Pause-seek tới
  t=5: confirmed=true (tElement 563 ms, tCanvas 672 ms). Phát sau
  seek tới cuối tự nhiên (localPh=6) + 10 s quan sát.
- Số đo thật (probe-results.json, đã copy về
  `hidden_files/round123-t2/probe-webkit-load0-gop30-e4b4/`):
  velTicks=447, sampler=131, renderTicks=79, raf=121, rvfc=0,
  pageErrs=0.
- **tailSteadyClosed = 0 → VOID** (prereg §4: 0 steady-close trong
  toàn bộ 180 s, probe exit 0 — ĐẾM vào lô, không retry vì kết quả
  seek).
- resyncsV chỉ đổi ở tick 3 (seek ban đầu, t=207 ms, ct=ph=0,5),
  restartV cuối=0. Sampler chỉ bắt 1 seeking run (samples 0..1,
  relMs 125..322, 197 ms — seek ban đầu).
- Drift recount sau seek ban đầu (prereg §3, kiểm tay): vượt
  >0,35 = **0 lần**; max 0,1102, min −0,0334; không có 2 tick liên
  tiếp cùng vượt; 10 tick cuối drift toàn 0 (ct=ph=6).
  tailBursts cuối 7, tailEndedClosed cuối 0.
- Probe verdict nội bộ: playhead-giữ-trong-seek PASS;
  playhead-lúc-canvas-đổi-khung PASS.

## 2. Tính hợp lệ của lượt đếm (att5)

- Cây đo: preview.tsx md5 `03bf029f09b8890b285eacc10a02172b`
  (BASELINE) trước=sau; media.ts
  `2c384ed13703809d5e999311147745e7`. H3f đã gỡ 12:02:56Z đợt 122,
  **không apply lại**. Không sửa production (preview.tsx mtime
  12:02:56Z không đổi giữa lượt).
- Boot `94e29be5-a52c-4840-9ca9-4e896482e4a2` (#67 tạm, chờ T6 xác
  nhận số) không đổi trước=sau; không reboot giữa lượt.
- Lock v2 cổng 5581: wait 0 s, hold 36 s, RELEASED 15:01:03Z
  (ticket 1-1794841227412859436-9176-t2-round123). Cờ cây
  NO-CHANGE. Không DEFER, không KILLED.
- Postboot PASS sau 4 phút chờ cờ T5 đợt 123: cờ PASS cũ của boot
  #66 bị chặn đúng luật STALE mới (xem §5); cờ PASS MỚI cho boot
  #67 xuất hiện 14:59:19Z (T5 ghi, exit 0, PASS NHỜ REPLAY, không
  repair) → driver chấp nhận 15:00:27Z. Replay #67 nhanh:
  configure 14:52:59Z (boot +40s), installs tới
  gstreamer1.0-tools 14:55:31Z (boot +3m12), dpkg.log 2→1509
  dòng; postboot FAIL 14:53:53Z → PASS 14:59:19Z.

## 3. Lượt 4 att4: KILLED-REBOOT (không đếm)

- Driver att4 (PID 5363) khởi động 14:43:43Z trên boot #66 (btime
  14:24:43Z, boot_id `9bbda390-bd64-4679-a1ff-3619899cee7d`), md5
  live khớp baseline `03bf029f` ngay từ đầu, postboot check-only
  lúc khởi động FAIL (thiếu 5 lib, GST 0 file, apt thiếu 11 gói —
  replay #66 mới bắt đầu 14:35Z).
- Đang ở giai đoạn 0 chờ cờ `round123-t1.done` thì **reboot
  ~14:52:19Z giết driver giữa lúc chờ** (log cuối 14:43:44Z,
  không marker kết thúc; poll kiểm tra của T2 cũng bị SIGTERM
  theo). Boot mới #67 (btime 14:52:19Z, boot_id `94e29be5…`,
  gap #66→#67 27'36").
- Không chạy probe, không lấy lock, không sửa production, không
  có `probe-results.json` cho att4. Log att4-run1 đã sao lưu
  (`run-t2.log.att4-boot66.bak` +
  `run-t2-driver.out.att4-boot66.bak`). Chạy lại là att5 trên
  boot #67 (đồng hồ chờ chạy lại từ đầu; prereg phụ lục §6).

## 4. Lượt 3 của T1 (đối chiếu) — VOID, lô → 2/10 trước lượt 4

- T1 driver 14:46:13–14:51:04Z trên boot #66, probe exit=0
  (14:50:14–14:50:48Z), velTicks=428, tailSteadyClosed=0, drift
  >0,35 sau seek ban đầu 0 lần (max 0,1475, min −0,0667),
  resyncsV chỉ đổi ở tick 5. T2 đối chiếu độc lập bằng
  analyze-t2.py trên probe-results.json của T1 — tái hiện đúng
  VOID. Xem `docs/PHASE9_ROUND123_T1_E4BATCH_R3_LIMITS.md`.
- Reboot 14:52:19Z xảy ra SAU khi driver T1 kết thúc (14:51:04Z),
  không ảnh hưởng lượt đếm của T1; T1 viết LIMITS + cờ
  `round123-t1.done` lúc 14:54Z (sau reboot).
- Cặp A+B trên cây baseline sau đợt 123: lượt 3 (A) VOID + lượt 4
  (B) VOID — **H1/H3 vẫn chưa có cặp CAUGHT-RESEEK**.

## 5. Luật đứng mới — cờ postboot phải khớp boot hiện tại (STALE)

- **Vấn đề:** sau reboot #66→#67, file POSTBOOT_PASS của boot #66
  (PASS 14:48:41Z, exit 0, "PASS NHỜ REPLAY") vẫn nằm trong
  `round123-t5/`. Driver cũ chỉ kiểm tra file TỒN TẠI → sẽ chấp
  nhận ngay và đo mù trên boot #67 chưa được xác minh.
- **Vá (đợt 123 T2, trước khi khởi động lại att5):**
  `t5_status()` trong run-t2.sh chỉ PASS khi cờ chứa đúng boot_id
  hiện tại (`/proc/sys/kernel/random/boot_id`); cờ của boot cũ →
  STALE (ghi log, tiếp tục chờ, KHÔNG thoát sớm, KHÔNG đo mù).
  Áp dụng cho cả POSTBOOT_PASS, t5-replay-done.md và fallback
  quét file. Đã verify bằng grep tay trước khi khởi động lại:
  boot hiện tại `94e29be5…` không khớp boot trong POSTBOOT_PASS
  (`9bbda390…`) → STALE đúng thiết kế. `bash -n` OK.
- **Kiểm chứng sống:** driver att5 log 14:56:27Z "cờ T5 là của
  BOOT CŨ đã chết (không khớp boot_id hiện tại) — KHÔNG chấp nhận,
  tiếp tục chờ cờ mới"; tới 15:00:27Z mới chấp nhận cờ PASS MỚI
  cho boot #67 (boot_id `94e29be5…` trong cờ). T5 cũng tự đánh dấu
  PASS cũ là SUPERSEDED trong lịch sử cờ của mình.
- Dị thường ghi lại (không ảnh hưởng verdict): watcher b66 ghi
  poll 7 lúc 14:52:44Z với boot_changed=no + dpkg_lines=1509 (số
  liệu của boot cũ) trong khi btime boot mới là 14:52:19Z — mâu
  thuẫn 25 giây, không có dòng "REBOOT DETECTED"; watcher đã chết.
  T2 lấy btime 14:52:19Z + boot_id `94e29be5…` làm căn cứ boot
  hiện tại; T5/T6 xác nhận số hiệu #67.

## 6. Ghi chú trung thực

- **Transient tick 1 không phải re-seek:** tick 1 drift 4,5
  (ct=5, ph=0,5) xảy ra TRƯỚC seek ban đầu (tick 3), không kèm
  đổi resyncsV; tick 2 đã về 0,5/0,5. Recount §3 chỉ tính tick
  SAU seek ban đầu nên không tính tick này (cùng mẫu với lượt 3
  att3: tick 3 drift 4,5 trước seek). Không làm đổi verdict VOID.
- **tailBursts cuối 7 (lượt 3: 0):** chỉ số thô từ trang
  (`__vcutTailBurstBlocked100B3`), không phải steady-close, không
  đổi verdict; prereg không định nghĩa đối chiếu cho chỉ số này
  nên chỉ ghi lại, không suy diễn.
- **VOID này không chứng minh E4 vắng mặt tuyệt đối** — chỉ chứng
  minh trong 1 lượt B gop30 trên cây baseline, 447 tick, không
  quan sát được steady-close nào. Cần đủ 10 lượt mới kết luận lô.
- **Không gộp với lượt 2:** lượt 2 VOID đo trên cây H3f; số lượt 4
  này thuộc loạt baseline. Verdict H1/H3 cần cặp A+B
  CAUGHT-RESEEK trên CÙNG cây — chưa có.
- **Tải lúc probe:** load lúc bắt đầu 0,86; loadavg cuối
  3,67/1,97/1,06 (tăng trong lúc probe — có thể do các luồng khác
  trong đợt chạy song song; không suy diễn thêm). Pause-seek
  tElement/tCanvas 563/672 ms (lượt 2 trên H3f: 157/207 ms; lượt 3
  trên baseline: 781/897 ms) — vẫn confirmed, chênh lệch chưa được
  giải thích, ghi lại để đối chiếu các lượt sau.
- Không đo TTS 39, không thử birefnet (RAM khả dụng 1466 MB lúc
  driver att5 khởi động, < 6 GB guard; u2net là fallback chính
  thức). Không chạy lại tsc/vite build: cây không đổi một byte
  (md5 trước=sau, mtime không đổi) và probe đã khởi động vite dev
  + WebKit thành công trên chính cây này.
- Không push, không release/tag, không sửa production.

## 7. Tiến độ lô sau lượt này

- Lượt đếm được: **3/10** (0 CAUGHT, 3 VOID — lượt 2 B gop30 cây
  H3f; lượt 3 att3 A gop250 cây baseline; lượt 4 att5 B gop30 cây
  baseline). Lượt đếm trên baseline: 2. Lượt không đếm: 7.
- Lượt tiếp theo: lượt 5 (A, gop250, phase `e4a5`) ở đợt sau, trên
  cây baseline.

## 8. File liên quan

- Prereg: `workspace/goals/capcut-clone-video-editor/hidden_files/round123-t2/prereg-e4batch-luot4.md`
  (§0–§4 đăng ký att4; §5 hậu kiểm att4 KILLED-REBOOT; §6 phụ lục
  chạy lại att5 + luật STALE; §7 hậu kiểm att5 VOID)
- Driver + log: `.../round123-t2/run-t2.sh`, `run-t2.log`,
  `run-t2-driver.out` (+ bản sao lưu att4-run1
  `run-t2.log.att4-boot66.bak`,
  `run-t2-driver.out.att4-boot66.bak`)
- Analyzer: `.../round123-t2/analyze-t2.py` (logic y hệt đợt 122;
  verify sống bằng dry-run trên dữ liệu lượt 2 trước khi đo)
- Số thô: `.../round123-t2/probe-webkit-load0-gop30-e4b4/probe-results.json`
  (gốc: `.../round116-s1/probe-webkit-load0-gop30-e4b4/`)
- Sổ cái: `.../round118-t9/e4batch-ledger.md` (đã thêm hàng lượt 4
  att4 + att5; tiến độ 3/10, lượt không đếm 7)
- Cờ T5: `.../round123-t5/POSTBOOT_PASS` (boot #67, 14:59:19Z)
