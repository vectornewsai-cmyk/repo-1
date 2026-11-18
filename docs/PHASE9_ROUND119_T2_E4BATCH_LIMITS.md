# Phase 9 — Đợt 119, luồng T2: E4BATCH lượt 2 (B, gop30) — VOID trên cây H3f

> **Kết quả gọn: lượt đếm được ĐẦU TIÊN của lô E4BATCH — lượt 2 (B,
> gop30, phase `e4b2`) = VOID (0 steady-close trong 360 velocity tick,
> probe exit=0). Lô đang 1/10 (1 VOID, 0 CAUGHT). Lượt chạy trên cây
> H3f md5 `5be5a250` (T1 apply xong 23:57Z, tsc 0 + vite build PASS),
> boot #57, lock chờ 0 s / giữ 32 s, không reboot, không DEFER.
> H1/H3 vẫn CHƯA PHÂN ĐỊNH. E4 giữ ĐÓNG CÓ ĐIỀU KIỆN.**

## 0. Bối cảnh và quyết parent

- E4 = stall r1f3 att2 + r1f4 (drift re-seek chậm/kẹt sau steady-close).
  Quyết parent đợt 117 §13 mục (1): hướng (a) — giữ ĐÓNG CÓ ĐIỀU KIỆN
  tới lô đo lớn đăng ký trước; CẤM hướng (c).
- Lô E4BATCH (10 lượt đếm được, 5 A gop250 + 5 B gop30, xen kẽ, bắt
  đầu A): lượt 1 ĐỂ TRỐNG (att1 KILLED-HARNESS + att2 DEFER-LOCK,
  đợt 118 T9). Lô 0/10 trước lượt này.
- Quyết parent đợt 118 §12 mục (2): CHẤP NHẬN apply H3f đợt 119 +
  đo A/B. Addendum đợt 119 trong sổ cái (`hidden_files/round118-t9/
  e4batch-ledger.md`, viết TRƯỚC lượt 2): cây đổi từ baseline
  `03bf029f` sang md5 H3f mới; lượt 1 trống nên chưa có lượt đếm nào
  trên cây cũ — lượt 2 vẫn là B gop30 theo prereg; mọi lượt đếm từ
  nay đều trên cây H3f, ghi md5 từng lượt; không gộp số khác cây cho
  verdict H1/H3 (prereg §5).

## 1. Chờ cờ — T1 (11 phút), T7 (0 phút)

- Driver khởi động 23:47:01Z. preview.tsx lúc đó vẫn `03bf029f`
  (T1 chưa apply; T1 đang giữ lock cổng 5590 từ 23:44:08Z, đo chân A
  trên cây cũ trước khi apply).
- **Cờ T1 sau 11 phút chờ (23:58:02Z):**
  `hidden_files/round119-t1-applied` — preview.tsx sau apply H3f:
  `5be5a250a552357c50cc189de9a9c08a`, baseline trước apply
  `03bf029f09b8890b285eacc10a02172b`, patch
  `hidden_files/round118-t2/h3f.patch` (108 dòng, 5 hunks), apply
  bằng `patch -p1`, rc=0; verify: **tsc exit 0 (23:57:29Z) + vite
  build PASS 7,03 s (23:57:43Z)**; chân A baseline đã xong trước
  apply (`chr-mixedalt-h3f-A-fr4`, DIAG-GATE ĐẠT); chân B đang chuẩn
  bị chạy. md5 này KHỚP đúng số T2 đợt 118 dự kiến (`5be5a250…`) —
  nhưng số đo lấy theo md5 thực tế, không lấy số dự kiến.
- **Cờ T7 sau 0 phút chờ (đã có sẵn lúc 23:58:02Z):**
  `round119-t7/POSTBOOT_PASS` + `t7-replay-done.md` — boot
  `27c8b1d9-33dd-4c63-9989-f9254a66dbc2` (#57? tạm — T7 ghi chờ T6
  đếm lại mù #37), bắt đầu 2026-11-15 23:33:34Z; replay
  (2'05", 7'34"] — dpkg đầu 23:35:39, cuối 23:41:08, 1509 dòng;
  postboot PASS live 23:43:45Z + PASS sau replay im 23:44:17Z;
  --repair KHÔNG chạy (replay tới trong ~15' — chính sách repair
  15 phút không kích hoạt); headroom inotify 670 (rơi tiếp từ 804
  ở #54); RAM 2124 MB lúc T7 đo. Nhanh hơn hẳn replay #54
  (+47'14") — WebKit đã sẵn sàng khi lượt này bắt đầu đo.
- Cờ cây `round116-tree` vẫn NO-CHANGE trước và sau lượt.

## 2. Lượt 2 — điều kiện đo

- md5 trước = sau = `5be5a250a552357c50cc189de9a9c08a` (khớp md5 kỳ
  vọng từ cờ T1; không đổi giữa lượt). Boot trước = sau =
  2026-11-15 23:33:34 `27c8b1d9` — không reboot giữa lượt.
- Lock v2: ticket 23:58:02Z, **chờ 0 s**, ACQUIRED cổng 5581,
  **giữ 32 s**, RELEASED 23:58:34Z (log
  `hidden_files/vite-lock-v2.log` dòng 212–214). Lock script live
  md5 `5cac10af` trước = sau acquire = cuối lượt (không đổi giữa
  lượt). Không gây DEFER cho luồng khác: T1 lấy lại lock 23:58:35Z
  (1 s sau khi tôi nhả) cho chân B của nó — xếp hàng sạch.
- Probe: `apps/web/scripts/probe116s1.mjs` không sửa
  (`node --check` OK trước khi đo); engine WebKit 27.2, loadN=0,
  gop=30, clip `o8-ball-720p-6s-gop30.mp4`, vite :5580, bridge
  :8881, Xvfb :194. RAM khả dụng lúc bắt đầu probe 4293 MB; load
  lúc probe bắt đầu **0,65** (yên — trái với 5,17 lúc att1 lượt 1).
- Pause-seek tới t=5: **confirmed=true, tElement=157 ms,
  tCanvas=207 ms** — nhanh và xác nhận được ngay. Đối chiếu att1
  lượt 1 (tElement 3136 ms, tCanvas=null sau 30 s): lỗi canvas
  không xác nhận KHÔNG lặp lại ở lượt này. Ghi nhận, không kết
  luận nguyên nhân — lượt này khác cả GOP (30 vs 250), cây (H3f
  vs baseline) và tải nền (0,65 vs 5,17); probe này không tách
  được ba yếu tố đó. Nợ quan sát att1 vẫn mở nếu pause-seek
  gop250 lại không xác nhận ở lượt 3.

## 3. Kết quả probe — VOID

- Probe exit=0 (23:58:02–23:58:34Z). Phát sau seek: bắt đầu ở
  playhead 5, tới cuối tự nhiên (localPh=6) + 10 s quan sát.
  velocityTicks=360, sampler=127, renderTicks=59, rafSamples=108,
  rvfcSamples=0, pageErrs=0.
- Verdict nội bộ của probe: playhead-giữ-trong-seek PASS;
  playhead-lúc-canvas-đổi-khung PASS (seekDoneIdx=1,
  seekDoneRelMs=250 ms, canvasChangeRelMs=250 ms,
  lagAfterMax=0,1868 s tham chiếu, holdTicks=12,
  steadyLagMean=nulls).
- Analyzer (`hidden_files/round119-t2/analyze-t2.py` = bản sao y
  hệt `round118-t9/analyze-t9.py`, chỉ đổi header):
  **steady-close ticks: [] (n=0)**; resyncsV transitions chỉ
  [(2, 1)] (seek ban đầu); sampler seeking run duy nhất là
  samples 0..0 relMs 122 (seek ban đầu). **KẾT LUẬN: VOID —
  không quan sát được steady-close (prereg-t1 §4).**

## 4. Drift recount — kiểm tay từ probe-results.json (prereg §3)

- Mọi velocity tick sau seek ban đầu (tick ≥ 3) có drift (ct−ph)
  > 0,35: **KHÔNG CÓ — 0 lần**. Drift max 0,2338, min −0,1333
  (tick ≥ 3). Không có 2 tick liên tiếp cùng vượt (hiển nhiên khi
  tổng số lần vượt = 0).
- tailSteadyClosed cuối = 0; tailBursts cuối = 0 (5 tick cuối đều
  0); steadyAdvances_last = None; drift_last = None; restartV
  cuối = 0; resyncsV cuối = 1.
- Tick 0 có drift 4,5 (ct=5, ph=0,5 trước khi seek hoàn tất) — là
  nhiễu tiền-seek, đã loại theo luật bỏ 3 tick đầu của prereg §3.
  Drift tick 1–7 đều 0,0 sau khi seek đóng.
- Render ticks trong lượt: n=59, skipped 5/59, gap max 202 ms,
  median 106 ms — **không có main-thread stall (>1000 ms)** nào.
  (Không có cửa sổ seeking drift re-seek để kiểm — VOID không có
  re-seek; số này chỉ ghi nhận môi trường lượt đo.)
- Phân loại theo prereg §2: **VOID — kết quả HỢP LỆ, ĐẾM vào 10
  lượt.** Không retry lượt VOID.

## 5. Verdict — T2 không tự quyết E4

- **H1: CHƯA PHÂN ĐỊNH.** Không lượt CAUGHT-RESEEK nào (0/1 lượt
  đếm được của lô bắt được steady-close).
- **H3: CHƯA PHÂN ĐỊNH.** Không lượt CAUGHT-RESEEK nào.
- **E4 giữ ĐÓNG CÓ ĐIỀU KIỆN.** Lô E4BATCH đang **1/10 lượt đếm
  được (1 VOID, 0 CAUGHT)** — lượt đếm được đầu tiên của lô, và
  là lượt đầu tiên trên cây H3f. Lượt tiếp theo: lượt 3 (A,
  gop250, phase `e4a3`) trên cây H3f md5 `5be5a250…`.
- Ghi chú sức mạnh: 1 VOID trên cây H3f không nói gì về p
  (xác suất bắt/lượt) ngoài việc tiền điều kiện không xuất hiện
  trong lượt B đầu tiên trên cây mới. Mọi so sánh A/B cho verdict
  chỉ dùng các lượt cùng cây H3f.

## 6. Môi trường lượt 2 (boot #57?)

- Boot `27c8b1d9`, bắt đầu 2026-11-15 23:33:34Z (T7 ghi #57? tạm —
  số thứ tự chờ T6 đợt 119 đếm lại mù #37; boot trước đó #55 bắt
  đầu 12:51:56Z 15/11, giữa đó có ít nhất một boot #56 đã chết
  trước 23:33Z theo log đóng đợt 118). Không reboot nào giữa lượt.
- Replay boot mới tới nhanh (2'05"–7'34", xong 23:41:08Z) so với
  #54 (47'14"–52'30"); chính sách repair 15 phút không kích hoạt.
  Headroom inotify 670 — tiếp tục rơi (804 ở #54); vite tạm
  `watch.ignored` vẫn bắt buộc.
- Tải yên lúc đo (load 0,65 lúc probe bắt đầu; 9,82 lúc driver
  khởi động 23:47Z đã hạ trước khi probe chạy). RAM khả dụng
  4293 MB lúc probe (< 6 GB — birefnet không thử, đúng luật).

## 7. Kiểm chứng

- Cây đo: preview.tsx md5 `5be5a250a552357c50cc189de9a9c08a`
  trước/sau lượt, không đổi; mtime 2026-11-15T23:56:49.530Z
  trước = sau. Không sửa production (chỉ thêm LIMITS này +
  driver/analyzer/log trong `hidden_files/round119-t2/`).
- Probe: `apps/web/scripts/probe116s1.mjs` không sửa;
  `node --check` OK trước khi đo. Analyzer
  `hidden_files/round119-t2/analyze-t2.py` = bản sao y hệt
  `round118-t9/analyze-t9.py` (diff chỉ 2 dòng header); drift
  recount §4 kiểm tay trực tiếp từ `probe-results.json`, khớp
  analyzer (0 steady-close, 0 lần drift vượt).
- Lock: log `hidden_files/vite-lock-v2.log` khớp §2 (t2-round119
  wait 0 s, hold 32 s; T1 giữ 358 s cho chân A trước đó, lấy lại
  23:58:35Z cho chân B).
- Prereg: `hidden_files/round118-t9/prereg-e4batch.md` (viết
  trước mọi phép đo của lô) + addendum đợt 119 trong sổ cái
  `e4batch-ledger.md` (viết TRƯỚC lượt 2, 23:45Z); sổ cái đã cập
  nhật lượt 2 (VOID, lô 1/10).
- `tsc` / `vite build` toàn repo: KHÔNG chạy lại trong luồng này
  (không sửa production); T1 đã verify tsc exit 0 (23:57:29Z) +
  vite build PASS 7,03 s (23:57:43Z) trên đúng md5 cây đã đo.

## 8. File trong batch

- `docs/PHASE9_ROUND119_T2_E4BATCH_LIMITS.md` (file này — mới).
- Dữ liệu + prereg + driver + analyzer (KHÔNG stage, chỉ tham chiếu):
  `hidden_files/round119-t2/` (run-t2.sh, run-t2.log,
  run-t2-driver.out, analyze-t2.py, vcut-vite-lock-v2-copy.sh);
  `hidden_files/round116-s1/probe-webkit-load0-gop30-e4b2/`
  (probe-results.json, probe-log.txt, r2-bridge.log,
  r2-vite-attempt1.log); sổ cái + addendum
  `hidden_files/round118-t9/e4batch-ledger.md`.
