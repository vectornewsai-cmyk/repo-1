# PHASE9_ROUND115_LIMITS — Gộp đợt 115 (gộp muộn bởi parent, lượt cron 03:35 +07 15/11/2026)

> Đợt 115, lượt cron 00:35 +07 15/11/2026 (17:35Z 14/11 → 20:52Z 14/11).
> Chủ đề: đóng nợ đo lường đợt 114. 9/9 luồng R1–R9 về đủ trên đĩa
> (cờ done đầy đủ); luồng verify R10 hết giờ cron trước khi gộp xong —
> parent gộp muộn theo skill verify_delegated_work (kiểm đĩa trước,
> không tuyên bố thiếu luồng nào khi file đã có trên đĩa).
> KHÔNG push. HEAD a8f26d48 không đổi. Cây production không đổi:
> `apps/web/src/preview.tsx` md5 `03bf029f09b8890b285eacc10a02172b`
> (trước = sau đợt; R2 đổi sang a419ae05 giữa đợt rồi revert đúng
> 03bf029f, cờ NO-CHANGE 18:31Z).
> Reboot trong đợt: #47 = 17:45:50Z (gap #46→#47 = 2h01'01"),
> #48 = 19:43:46Z (gap #47→#48 = 1h57'56") — cả hai trong dải chứng
> nhận [19'07", 3h14'08"], không phá sàn. Boot cuối đợt #48
> (0c2a9f2f-2ad6-44af-998e-a8a9ff2dcee0).

## 0. Kiểm chứng gộp của parent (R10 muộn)

- **Poll R10: 9/9 DONE** (20:19:40Z, poller #3 sau reboot #48).
  R10 kịp: Fisher R1 (tính lại khớp hết, xem §1) + chạy lại analyzer
  R1 trên 3 JSON + chạy lại analyzer R3 s77c/dry3 (khớp) + bắt đầu
  recount part2 — rồi hết giờ cron. Part2 của R10 CRASH ở bước đếm
  trực tiếp R3 (TypeError: median của list chứa None — blendTick
  không có key "off"/"offset", offsets phải tính
  presented−expected). Parent vá (bản `recount-r10-part2-parent.py`,
  lọc None, in keys) và chạy lại xong: xem §3.
- **Suite cây gộp 27/27 exit 0** (parent chạy lại script verify của
  R10, `round115-r10-suites.log`, 20:45–20:52Z, boot #48,
  RAMavail 1233 MB): tsc web 0, tsc desktop 0, vite build PASS,
  playheadHold90R2, pacing, previewEngine, seek, seekSkipRender86N3,
  previewLoop50F2, ghostBlend 15/15, rvfcClipWindow102D3,
  driftConfirmSkip103E4, css60 60/60, css61 60/60, P7 8/8, orphans
  17/17, r6, U4 141/141, media-tests, media-retry96X3,
  media-watchdog96X3, deint-verdict ×2, armHeld99a3,
  vite-diagnosis-regex, xvfb-lock, test-preview-engine.sh
  354 assertions pass. 0 lỗi.
- **O8 KHÔNG chạy lại trong gộp muộn này** (postboot #48 chưa kiểm,
  RAM lúc đầu lượt chỉ ~545 MB avail). Cây production byte-identical
  với cây đợt 114 đã O8 21/21 cả 2 engine trên boot #46 — O8 dời sang
  verify đợt 116 (S10), sau postboot #48 PASS.
- **Batch đợt 115: 9 batch / 17 entry / 17 file duy nhất, 0 thiếu,
  0 binary, 0 workflow** (parent đếm lại trực tiếp từ đĩa).
  6 file oversize >37.768 B (cần ENABLE_PRIVSEP=0 khi push):
  probe115r1.mjs 47.541, R7 LIMITS 52.614, probe115r2 62.660,
  R3 LIMITS 61.451, webkit_blob_flaky_115r8_2mib.mjs 78.311,
  probe115r3 48.898.
- **Lũy kế chờ push thật (đợt 111–115): 47 batch / 96 entry /
  83 file duy nhất** + 1 file oversize 6,4 MB
  (`benchmarks/results/webkit-blob-flaky-96x3.json`).
  8 file nằm trong >1 batch (lấy bản mới nhất khi push):
  PHASE9_GAP_ANALYSIS.md (4×), preview.tsx (2×),
  playheadHold90R2.ts (2×), playheadHold90R2.test.ts (2×),
  vcut-webkit-postboot-check.sh (5×), clicktest-87o8 (2×),
  vcut-vite-lock-v2.sh (2×), vcut-poll-quiet-v2.sh (2×).
- **Đính chính verify (parent):** (a) R10 part2 crash vì None —
  đã vá, không ảnh hưởng số liệu (R3 đã xác minh lại trực tiếp,
  xem §3). (b) R3 viết "≤−2 = 0,0%": đúng là làm tròn — đếm trực
  tiếp có đúng 1 tick ở −2 trong 2231 (0,04%). (c) R1 viết "stall
  đầu tiên sau steady-close trong toàn bộ chuỗi N1/P1/Q1/R1" —
  parent xác minh độc lập từ JSON thô: đúng (xem §1). (d) Q9 đợt 114
  đính chính Q3 về freeze playhead ~12 s ở ph 44,77 — R3 Phần A
  đợt này xác nhận đầy đủ (xem §3).

## 1. R1 — E4 tải cao: KHÔNG ĐÓNG (1 stall), nhưng caveat lực mẫu đã hết

- LIMITS: `docs/PHASE9_ROUND115_R1_E4HIGHLOAD_LIMITS.md`.
  Batch: `phase9-round115-r1-e4.txt` (2 entry).
- **CAP: 0 CAP / 184 play-tick tải cao hợp lệ** (r1f2 106 tick,
  load1 play-mean 23,52 + r1f4 78 tick, load1 25,36), cả 3 luật
  (N1/M1/cũ). Vượt mục tiêu đợt (~210 tick gộp).
- **Fisher (R10 tính lại, parent kiểm khớp):** R1-lẻ 0/184 vs
  K1-on 6/284: p=0,0859. **Gộp tải cao thuần Q1+R1 0/344:
  p=0,0083 < 0,05.** Gộp toàn bộ N1+P1+Q1+R1 0/1008: p=0,000108.
  **Caveat đợt 114 ("bằng chứng tải cao trực tiếp 0/160,
  p=0,0919, chưa đủ lực một mình") về mặt số liệu ĐÃ HẾT HIỆU
  LỰC** — phần tải cao một mình nay đủ lực, không cần trộn tải
  thấp (N1+P1).
- **Verdict vẫn KHÔNG ĐÓNG theo prereg-r1 §5/§7:** lượt ngoài
  dải r1f3 att2 (load 0,92 — tải THẤP) có 1 steady-close đã xác
  minh (2497 ms, drift 1,1) và drift re-seek ngay sau đó **kẹt
  ≥5771 ms liên tục, vẫn đang seeking lúc lượt kết thúc, ct đóng
  băng 2,4667, probe dừng sớm vì playhead đóng băng**. Luật
  stall-watch trong prereg không giới hạn ở lượt hợp lệ; stall ở
  tải thấp càng không đổ được cho đói tải.
- **Parent xác minh độc lập stall từ JSON thô** (recount part2
  đã vá): velocityTicks total 48, 28 tick ct=2,4667 (t 8572..
  16383), ticks 21..47 TẤT CẢ đóng băng, resyncsV tick20=1 →
  tick21=2 (re-seek sau steady-close), sampler 23 mẫu ph=2,467
  relMs 8330..14101 span đúng 5771 ms, mẫu cuối vẫn frozen,
  playing=True. **Stall là thật, lần đầu tiên sau steady-close
  trong chuỗi N1/P1/Q1/R1.**
- **QUYẾT PARENT 1 (15/11): E4 = ĐÓNG CÓ ĐIỀU KIỆN — chờ điều
  tra stall r1f3 att2.** Chấp nhận verdict KHÔNG ĐÓNG của R1
  theo prereg (không tự loại stall ngoài dải). Đồng thời ghi nhận
  caveat lực mẫu đã hết (0/344, p=0,0083). Nợ sang đợt 116 (S1):
  điều tra stall — có phải cùng cơ chế zombie Q2 (cổng bỏ vẽ
  E4+N3 + main-thread stall) nhưng ở tải THẤP? Nếu stall được
  giải thích/bác như một cơ chế riêng không thuộc E4, parent
  quyết lại E4 lên ĐÓNG ĐẦY ĐỦ (tải cao thuần 0/344).
- Dị thường dial: load1 đáp ứng chậm nay tới **150–275 s** (tệ
  hơn Q1: 60–150 s); retry dial tối đa 120 s KHÔNG ĐỦ (r1f3 att2
  dial hết 120 s ở load1 0,75 rồi chạy luôn — play-mean 0,92).
  Luật mới "hogs chạy ≥90 s trước khi tuyên bố ĐẠT" đã hoạt động
  đúng (18 lần từ chối 2-mẫu-trong-dải vì hogs chưa đủ 90 s).
  r1f1 không có lượt nào có dữ liệu (2 attempt lỗi harness
  pause-seek 30 s timeout, như Q1).
- Dữ liệu thô: `hidden_files/round115-r1/`.

## 2. R2 — Zombie hướng sửa (cap snapshot): VERDICT BỎ, cây đã revert

- LIMITS: `docs/PHASE9_ROUND115_R2_ZOMBIEFIX_LIMITS.md`.
  Batch: `phase9-round115-r2-zombiefix.txt` (2 entry: LIMITS +
  probe 62.660 B). Patch giữ lại ở
  `hidden_files/round115-r2/r2-snapshot-cap.patch` (không stage,
  cây NO-CHANGE).
- Fix cap snapshot 1280×720 → 640×360 (cả đường pump lẫn tick)
  **không đạt bar prereg:** capMs median chỉ −13,7% (bar −40%),
  longtask khớp pump/giây phát TĂNG 65% (bar −20%). Gap-count
  giảm 36 → 11 giải thích được bằng chế độ tải đổi (baseline
  trượt dải load5 14,97 do 40 hog R3 + apt replay sau reboot #47;
  fix trong dải 7,72), không quy cho fix. Cơ chế "pixel
  drawImage là nút cổ chai" bị bác trong điều kiện đo này.
- **Parent chạy lại analyze-r2.py trên dữ liệu thô, khớp
  100% bảng R2:** capMs median 14,6 → 12,6 (−13,7%), p90
  88,5 → 79,7 (−9,9%), max 270,8 → 161,5; pump-matched(13 ms)
  n 30 → 47, ms 8462 → 12851 (+51,9%); gaps base 36 / fix 11
  (classify JSON: base nGaps 36, fix nGaps 11). Suite trên cây
  fix xanh (tsc 0, vite build PASS, ghostBlend 15/15, E4 5/5,
  hold 93, pacing 19/19, seekSkip 9/9, previewEngine 27,
  seek 21, test-preview-engine.sh 354) — không hồi quy, nhưng
  không đủ để giữ.
- **QUYẾT PARENT 2 (15/11): chấp nhận verdict BỎ.** Hướng sau
  (đợt 116 S2): chốt nửa longtask chưa rõ nguồn bằng Long
  Animation Frame API / Chrome tracing; nếu vẫn đánh hướng sửa
  thì thử giới hạn tần suất capture (H2) với A/B liền nhau cùng
  chế độ tải.

## 3. R3 — Điểm gãy tải: s77c SẠCH, GIỮ ở tải 19,63; Phần A xác nhận Q9

- LIMITS: `docs/PHASE9_ROUND115_R3_LOADBREAK_LIMITS.md`
  (61.451 B). Batch: `phase9-round115-r3-loadbreak.txt`
  (2 entry: probe 48.898 B + LIMITS).
- **Phần A (soi lại s76 bằng cửa sổ 10 s, P8): XÁC NHẬN ĐẦY ĐỦ
  đính chính Q9.** Cửa sổ 30 s min advance 4,63 s → 0 stall,
  tỉ lệ kẹt 0/3 vẫn đứng. Cửa sổ 10 s min advance 0,00 s, đúng
  2 cửa sổ <1,33 s (130594→139502, 0,00 s; 322693→331214,
  0,77 s). Freeze ph 44,7667: 3 mẫu liên tiếp, 11,82 s,
  playing=True, cách biên 45,0 s đúng 0,23 s (ngoài cửa sổ 0,1 s
  đã đăng ký); load1 lúc freeze chỉ 6,75–8,56.
- **s77 attempt 1 (197 clip): 1526 tick, GIỮ theo offset
  (80,1% ±1) ở load1 25,1 — NHƯNG LAI** (R2 sửa preview.tsx
  giữa lượt 18:04:52Z, 03bf029f → a419ae05; R2 đã revert về
  03bf029f 18:27:43Z, verdict BỎ fix). Chia trước/sau mốc edit:
  34 tick trước (85,3% ±1) vs 1492 sau (80,0% ±1), cùng trung
  vị 0 — không đứt gãy hành vi (HMR tắt), nhưng theo luật
  prereg vẫn KHÔNG dùng để đóng khoảng. Bar (c): vùng xám
  (2,17/s, 30,68%).
- **Attempt 2 (s77b): reboot #48 cắt ngang ở ph 309,87/591
  → loại hoàn toàn.** dry2 attempt 1 DEFERRED 600 s chờ vite
  — một phần do vite R5 thật, một phần do lệnh theo dõi của
  chính R3 tự match pattern pgrep của driver (false positive,
  đã rút kinh nghiệm); dry2 PASS ở retry.
- **Attempt 3 (s77c): SẠCH, HỢP LỆ — 2231 tick, trung vị 0,
  88,7% trong ±1, 0,0% ≤ −2 → GIỮ ở sampled mean load1 19,63
  (n=134, threadsR 45,0). Biên GIỮ dời 9,59 → 19,63** (chế độ
  hog nice -n 19; dãy không-nice vẫn dừng 9,59 — xem Quyết
  parent 4). Dial KHÔNG ĐẠT (load1 sụp 12,7 → 0,33 trong lúc
  dial với 40 hog sống; trong lúc phát hồi lên mean 19,63;
  loadAtPlay 0,22 là mẫu đơn gây hiểu lầm). Tick rate tăng ở
  nửa sau (2,91 → 3,84/s). Bar (c): vùng xám lần 3 (3,37/s,
  29,73%) — không kết luận. Bar (b): 0/5 (s77c: 30 s min
  advance 14,23 s; 10 s thay thế min 2,60 s; 0 freeze).
  Element chết format error 0/121 (lần 3 liên tiếp không có).
  Caps vẫn chết sau c2 (91/113) — sampler dừng sau ~9 s media,
  không phải bằng chứng đói (dry3 caps 269 phân bố đều).
- **Parent đếm trực tiếp từ JSON thô (presented−expected):**
  n=2231, median 0, mean 0,309, min −2, max 30, within ±1
  88,7%, ≤−2 đúng 1 tick (0,04% → "0,0%" là làm tròn 1 chữ
  số). Analyzer R3 chạy lại (parent): s77c GIỮ, load1
  mean/med/max 19,63/18,64/43,14, md5 03bf029f→03bf029f.
- **QUYẾT PARENT 3 (15/11): chuẩn tải điểm gãy = hog nice -n
  19** (chế độ mọi lượt N1/Q1/R1/R3 dùng). Dãy không-nice dừng
  9,59 là chế độ khác, ghi song song, không mâu thuẫn. Biên
  GIỮ hiện 19,63 (nice-19). Đợt 116 (S3) đẩy cao hơn tìm điểm
  gãy thật. Tần suất reboot dày (3 reboot/4 giờ) — lượt dài
  ~30 phút có nguy cơ bị cắt ~25%.
- Dữ liệu thô: `hidden_files/round115-r3/` (prereg + 3 driver +
  3 analyzer + 6 thư mục lượt probe).

## 4. R4 — Lock fairness v2: pilot thí điểm, 5 bug đã vá

- LIMITS: `docs/PHASE9_ROUND115_R4_LOCKV2_LIMITS.md`.
  Batch: `phase9-round115-r4-lockv2.txt` (3 entry:
  vcut-vite-lock-v2.sh, vcut-poll-quiet-v2.sh, LIMITS R4).
- **Test lại v2 phát hiện 2 bug, đã vá + verify:** (A) cooldown
  ghi epoch giây nguyên → T6 flaky 2/6 (2080/2129 ms < 2500 ms);
  vá sang mili-giây → T6 12/12 PASS (3048–3726 ms) + kiểm chứng
  thật 14967 ms. (B) poll log vỡ dòng khi có luồng khác giữ
  lock (`lock=` nhiều dòng) → T7 fail 5/5; vá `tr '\n' ' '` →
  T7 5/5 PASS (6→5).
- **Pilot thí điểm (port 5560, prio normal, timeout 900 s):
  attempt 1 TIMEOUT** — waiter v2 (ticket 18:01:32Z) chờ tường
  1204 s, thua race mkdir 2 lần trước waiter v1 (r2 ~9 phút →
  r3 ~14,5 phút → r2 lần 2), DEFERRED ×1, STALE-LOCK 0.
  **Attempt 2 ACQUIRED sau 185 s: `npm run build` PASS** (tsc 0,
  vite build 290 modules/6,69 s), giữ 27 s. **3b cooldown thật
  PASS (14967 ms). 3c vite dev PASS** (lên sau 2 s, curl 200,
  inotify 0, giữ 10 s) sau khi sửa driver thêm `--host
  127.0.0.1` (3a fail vì thiếu --host: vite bind [::1],
  curl 127.0.0.1 = 000 — R9 đo độc lập khớp).
- **Vá thêm C+D+E sau pilot:** (C) timeout tính từ wall-clock
  (giãn 1,34× dưới tải cao: 900 s danh nghĩa → 1204 s tường;
  lỗi kế thừa từ v1); (D) `status` đếm chỉ ticket (cooldown từng
  bị đếm nhầm); (E) `vite_node_pid` chỉ nhận exe là node (trước
  nhầm vỏ `timeout`/shell driver — kill-vite có thể TERM nhầm)
  + verify live PASS. Test sau vá: 12 lần, 11× 9/9 + 1× 8/9
  (T7 nhiễu do luồng r8 khởi động WebKit giữa 2 poll).
- **QUYẾT PARENT 4 (15/11): CHẤP NHẬN VITE_LOCK_AGING_S=600
  cho đợt 116 v2-only.** Lý do R4: timeout waiter chuẩn 900 s
  khiến mặc định 1800 không bao giờ có tác dụng; 600 ≈ 1 lượt
  giữ dài + 300 s đệm. **Migration: CHƯA mở rộng v2 cho tất cả
  luồng đợt 116 theo kiểu hỗn hợp** — pilot chứng minh chế độ
  hỗn hợp làm waiter v2 thiệt thòi; cần chuyển đổi nguyên tử
  theo đợt (đợt v2-only, mọi driver cùng v2). Giữ v1 frozen
  (md5 fd21193c nguyên vẹn).
- Dọn cooldown: QUEUEDIR chỉ có 1 file cooldown-r4 mới (<1h),
  0 file quá 1 ngày → 0 file xóa. Nợ Q4 §6 đóng.
- Dữ liệu thô: `hidden_files/round115-r4/`.

## 5. R5 — WebKit ≤60 ms, lượt yên xác nhận LẦN 4: vẫn MỎNG

- LIMITS: `docs/PHASE9_ROUND115_R5_F6P60MS_LIMITS.md`
  (27.526 B). Batch: `phase9-round115-r5-f6p60ms.txt`
  (1 entry: LIMITS).
- **KHÔNG có lượt yên hoàn chỉnh; ngưỡng WebKit ≤60 ms GIỮ
  nhưng MỎNG (lần thứ 4 liên tiếp chưa chốt: N4, P4, Q5, R5).**
  4 lần thử: attempt1/3/4 gate lớp A không mở trong 10 phút
  poll nên không chạy probe; attempt2 gate MỞ 19:11:32Z (load
  0,66/1,41, RAM 1515 MB, postboot #47 PASS, cờ R2-tree
  NO-CHANGE, cây 03bf029f) và chạy được 9/20 pass trong ~42 s
  (nhanh như Q5), rồi kẹt ở pass 10 suốt 17 phút (log mtime
  19:12:14) và chết 19:30:04Z với `page.evaluate: Target page,
  context or browser has been closed` (exit 2) — WebKit target
  chết dưới áp lực RAM (avail 350–600 MB, swap 434 MB). Không
  có JSON output (probe chỉ ghi sau đủ 20 pass) → không có
  tickCost median/p90, không có (b)/F6', không quan sát được
  stale-ghost (event P4 frame-26 và event Q5 seq 282–285 vẫn
  chờ lượt yên sạch). F6' vẫn ĐÃ ĐÓNG từ L7, không kiểm lại
  được đợt này.
- **RAM là nút thắt (không phải load):** 21 mẫu 5 phút: median
  724 MB, min 350 MB, max 3899 MB; chỉ 8/21 lần ≥1024 MB. Cú
  sụt RAM 1429→788 MB trong 21 s ngay sau khi attempt2 bắt đầu
  (19:11:33→19:11:54Z) từ consumer ngoài cell, vô hình với `ps`
  (top-RSS chỉ thấy process của chính R5 + hatch daemon) —
  nhiều khả năng là nguyên nhân trực tiếp làm renderer thrash
  rồi chết. Load-mid sampler mới (56 mẫu/20 s, lần đầu có số
  giữa lượt đầy đủ): load1 max 1,77, không vượt 4; ps-before
  0 blocker; file round115 khác sửa trong cửa sổ chỉ là ghi nhẹ
  (R6 log + cờ R8-done).
- **Gate 0 replay (MỚI, theo nợ Q5 §8.4) đã làm đúng:** kiểm
  postboot check-only + apt trước lớp A ở cả 4 lần thử (đều
  PASS trên boot #47); replay apt sau boot #47 được thấy đang
  chạy 18:02–18:04Z, postboot #47 PASS lại 18:19:51Z. R5 chờ cờ
  R2-tree (R2 hoàn tác cây fix a419ae05 về baseline 03bf029f,
  NO-CHANGE ~18:28Z) rồi mới thử attempt1. Sửa grep đếm blocker
  sau attempt1 (dương tính giả: shell giám sát của R6 chứa
  chuỗi `preview-b-f3-flip-webkit-r5-*.json`).
- **Reboot #47 (17:45:50Z, gap 2h01'01")** giết poller v1 (chỉ
  kịp 1 mẫu); poller v2 (setsid) chạy lại 18:03:35Z. **Reboot
  #48 (19:43:46Z, gap 1h57'56")** giết attempt4 đang poll gate +
  poller v2; replay apt sau #48 đang chạy lúc R5 kết thúc —
  postboot #48 CHƯA kiểm, vite.lock stale của R3 (boot #47,
  pid 105555) còn trên đĩa, R5 không đụng. Cả 2 gap đều không
  phá sàn 19'07". Mù #33 ĐÃ ĐÓNG (R7 probe #34, 17:45:02Z);
  mù #34 mới mở (chứa #47–#48).
- **Nợ mới cho đợt sau:** (i) bổ sung điều kiện RAM giữa lượt
  vào lớp B; (ii) timeout wall-clock mỗi pass trong probe + ghi
  JSON tăng dần từng pass (để không mất 9 pass vì 1 pass kẹt);
  (iii) kiểm stale vite.lock sau reboot (phân biệt qua boot_id +
  pid). tsc/ghostBlend/vite build KHÔNG chạy lại (cây 03bf029f
  không đổi, Q5 đã PASS trên đúng cây này). Analyzer đã dry-run
  khớp đúng số Q5 (median 70,0) — toolchain sẵn sàng, chỉ thiếu
  dữ liệu.
- Dữ liệu thô: `hidden_files/round115-r5/` (prereg-r5.md,
  probe/analyzer copy Q5 md5 khớp, run-r5.sh, poll-r5.log,
  chain-r5.log, postboot b46/b47 + gate0 ×4, ps-before/after +
  load-mid attempt2, run-webkit-r5-attempt2.log).

## 6. R6 — Ghost stale sau seek: P4-type tái hiện, event seek Q5 không tái hiện

- LIMITS: `docs/PHASE9_ROUND115_R6_GHOSTSEEK_LIMITS.md`
  (27.368 B). Batch: `phase9-round115-r6-ghostseek.txt`
  (1 entry: LIMITS). Chỉ chẩn đoán, KHÔNG sửa production.
- **Event seek Q5 (seq 282–285, label 0/pixels 68) KHÔNG tái
  hiện trên lượt yên sạch attempt5 (0/20 seek; gộp Q5+R6:
  1/40 = 2,5%)** — chưa kết luận cơ chế seek/H-D, nợ thêm lượt
  yên (tổng ≥80 seek).
- **Phát hiện chính: event kiểu P4 TÁI HIỆN 2 lần rõ + 1 nhỏ
  trên lượt yên** (20 occ lag ≥+5f, pixels đóng băng frame 31
  ~320–370 ms, label chạy 17→26, skp=0) — cơ chế tổng quát
  "video yield frame đi trước currentTime tới +14f, snapshot
  gán nhãn theo currentTime" đã rõ hơn (đọc code preview.tsx:
  pixels lấy mẫu thật ở rawMs/rawCt đường mask; strip khớp M
  với 0 bit lỗi). H-B (E4) bị yếu thêm (skp=0 cả 20 occ); H-C
  dạng tổng quát bị bác (snapshot capture mới mỗi tick mà pixels
  vẫn sai).
- **Parent kiểm lại output analyzer R6:** 20 pass, stale 0/20,
  (B) lag ≥+5f: 20 occ / 3 event — event 1: 2 occ lag max +5f
  (tBlend 35960–36050, 90 ms); event 2: 10 occ, M=[31], label
  17→26, lag max +14f (36050–36417, 367 ms); event 3: 8 occ,
  M=[31], lag max +14f (65461–65777, 316 ms). Khớp LIMITS.
- Attempt5: boot #48, cây 03bf029f (R2 đổi sang a419ae05 rồi
  revert, cờ NO-CHANGE), gate yên lớp A+B mới ĐẠT (load1 max
  3,13, load5 cuối 1,60, RAM 1407→844 MB), 20 pass/508 tick,
  probe_exit=0; tsc 0, ghostBlend 15/15.
- Attempt1/2 hoãn (máy bận, R1/R5 giữ lock); attempt3 R6 tự
  hủy để đổi 40→20 pass sau stall RAM ngoài cell của R5
  attempt2 (kẹt pass 10, 17 phút); attempt4 chết do reboot #48
  (lock R3 stale đã dọn đúng cơ chế).
- Dữ liệu thô: `hidden_files/round115-r6/`.

## 7. R7 — EPERM probe #34: mù #33 ĐÓNG HOÀN TOÀN (thứ 2 liên tiếp)

- LIMITS: `docs/PHASE9_ROUND115_R7_EPERM_LIMITS.md`
  (52.614 B). Batch: `phase9-round115-r7-eperm.txt`
  (1 entry: LIMITS).
- **Probe #34 (17:45:02Z): boot 7a0638c4 (#46), ok=2 fail=0.**
  Checklist P8 §2.3 đúng 1 lần: status DEAD/STALE (age
  10.539 s, exit 1) → once probe #34 (exit 0) → status ALIVE
  n=34 (exit 0). Log probe v2 91 → 94 dòng (+3 như prereg dự
  báo). Heartbeat n=34, ts 17:45:02Z.
- **Mù #33 ĐÓNG HOÀN TOÀN (14:49:23Z → 17:45:02Z, 2h55'39"):**
  đoạn A đóng bằng poller Q9 1 tiến trình duy nhất (12 poll
  300/301 s, 14:45:53Z → 15:40:54Z) + dấu boot tươi Q7/Q3/Q5
  (14:55:33Z–15:11:02Z) + sàn đuôi 3'55"; đoạn B đóng bằng
  uptime -s ×2 lúc probe + dấu tươi Q7/Q1/Q2/Q9 (15:46:12Z →
  17:07:58Z). 1 reboot chốt (#46 15:44:49Z) + 0 ẩn. Mù thứ 2
  liên tiếp đóng hoàn toàn (sau #32).
- **Gap #45 → #46 = 2h27'07" ĐƯỢC CHỨNG NHẬN (mới):** CERT
  n=24 → n=25, FULL n=39 → n=40 (kiểm tra chéo khớp 100% số
  Q6). Dải chứng nhận [19'07", 3h14'08"] không đổi.
- **QUYẾT PARENT 5 (15/11): CHẤP NHẬN chứng nhận gap #45→#46
  (2h27'07", CERT n=25).** Căn cứ: cùng phương pháp đã chấp
  nhận cho #44→#45; khoảng (13:17:42Z, 15:44:49Z) được phủ kín
  bởi mù #32 đóng hoàn toàn (11:37:14Z→14:49:23Z) + mù #33 đóng
  hoàn toàn (14:49:23Z→17:45:02Z); R7 kiểm chéo CERT n=22/23/24
  khớp 100% số N6/P6/Q6. Nếu logic này sai thì hạ về cận trên,
  CERT n=24.
- **Sóng EPERM: 0 thật** (88 log có mtime trong mù; 10 dòng
  "đã tắt" đều dương tính giả launcher, tất cả ở đoạn B). Sóng
  gần nhất vẫn ~11:55–12:11Z (R7), ~77h34' trước probe #34.
- **WFS lần 21: 680 dòng / 196 file (phạm vi 2857); R7b
  705/213; copies 25/17 — chênh 0, lần thứ 21 liên tiếp.** +24
  dòng/+5 file vs lần 20, giải thích hết bằng diff (Q6 LIMITS
  +7, ROUND114_LIMITS +1, probe114q2 +7, probe115r1 +1,
  probe115r3 +8). Async `.writeFile(` vẫn đúng 2 vị trí helper
  đã biết.
- **RAM:** 434.660 kB (probe) / 2.008.556 kB (scan bắt đầu) /
  2.320.368 kB (scan xong) / 1.171.744 kB (viết LIMITS); max
  trong mù 3.378 MB ≈ 3,30 GB (Q2, 15:56:12Z) = 55% guard.
  Birefnet KHÔNG chạy, vẫn 0 lần thành công.
- **Mù #31 KHÔNG thử lại** (đã cạn nguồn ở đợt 114, không có
  nguồn mới thật sự) — giữ nguyên không đóng hoàn toàn, chờ
  user quyết. Các mù #22/#24/#26/#28/#29/#30 + reboot #16 giữ
  nguyên, chờ user quyết.
- **Mù #33 ĐÃ ĐÓNG lúc probe #34 (17:45:02Z)** — reboot #47
  (48 s sau probe) mở mù MỚI #34; probe #35 đối chiếu từ mốc
  17:45:02Z (đợt 116).
- Dữ liệu thô: `hidden_files/round115-r7/`.

## 8. R8 — Seek/preload: trigger blob error-event ĐÃ TÌM ĐƯỢC (ring-wrap)

- LIMITS: `docs/PHASE9_ROUND115_R8_SEEKPRELOAD_LIMITS.md`
  (30.691 B). Batch: `phase9-round115-r8-seekpreload.txt`
  (3 entry: webkit_blob_flaky_115r8_2mib.mjs 78.311 B +
  q8_analyze_115r8.py + LIMITS).
- **Bar B-Q8-1 KHÔNG ĐẠT — nhưng vì tiền đề của bar không xảy
  ra trên lượt sạch, không phải vì H1 sai.** Trong 4 run PAUSED
  tải sạch, pha blob kết thúc sớm vì lỗi ở 3 run (sau 0,7–2,6 s)
  và đói hoàn toàn ở 1 run — KHÔNG run nào ở trong pha blob đủ
  20 s để đo C / flatness / T_c / im lặng GST. 4/6 điều kiện
  PAUSED của bar là KHÔNG ĐÁNH GIÁ ĐƯỢC; 2 điều kiện còn lại
  ĐẠT (0 progress sau suspend 13/13 run; PLAYING đạt full 2/2
  cả 2 lượt).
- **Trigger blob error-event ĐÃ TÌM ĐƯỢC (đáp án cho nợ Q8
  §8.3): cuộc đua ring-wrap ở lần pull đầu.** Adapter blob là
  ring 4.194.304 B; một pull ở req_off=0 đôi khi trả về byte ở
  file offset 4.194.304 (`16 f7 6b 79…`) thay vì offset 0
  (`00 00 00 20 66 74 79 70…`) → qtdemux đọc atom size
  385.313.657 → "atom has bogus size" → "This file is invalid"
  → pipeline chết → element error-event (code null) → pool
  fallback HTTP. Bằng chứng: pull đầu trả byte wrap ⟺ lỗi 9/9
  run có bất kỳ pull wrap nào; 0 pull wrap → sạch 3/4 run
  (1 ngoại lệ, xem §5). Tần suất R8: lỗi 8/12 run blob (67%) +
  1 đói (75% bị ảnh hưởng); gộp Q8+R8: lỗi 13/23 (57%), bị ảnh
  hưởng 14/23 (61%). Giả thuyết "lỗi do tải cao" của Q8 BỊ YẾU
  ĐI: lượt 2 sạch lỗi 5/5, trong khi SEEKFAST lượt 1 dưới tải
  nặng lỗi 0/2. Giả thuyết RAM thấp cũng KHÔNG đứng (Q8 SEEKFAST
  r1 lỗi ở mem 2.866 MB cao nhất; xem §5).
- **Trần 17,421 s vẫn xuất hiện khi pha blob sống sót:** PAUSED
  r1 lượt 1: 1 mẫu [0, 17.031] ngay trước lỗi; PLAYING r2 lượt 1:
  firstSample [0, 17.421]. H1 vẫn "được hỗ trợ về cơ chế, chưa
  đóng bar thời gian" — như Q8, nhưng nay đã rõ LÝ DO bar không
  đóng được: đường blob quá flaky (lỗi ring-wrap) để giữ pha
  blob 20 s.
- **F2 seek-không-chờ KHÔNG tái xác nhận đầy đủ theo bar chữ:**
  lượt 2 sạch seekImmMs 1008/760 ms (bar ≤940 ms: 1/2 đạt).
  Gộp 6 lượt SEEKFAST (Q8 653/810 + R8-L1 997/794 + R8-L2
  1008/760): 4/6 đạt, median 802 ms, seekedOk 6/6, phát tới
  cuối clip 6/6. Khuyến nghị thiết kế KHÔNG ĐỔI (seek ngay ~0,8 s
  vẫn hơn chờ 20 s rồi seek 0,44 s — tổng 20,4 s so với 0,8 s),
  nhưng bar ±500 ms so với P2SEEK 0,44 s là quá chặt cho seek
  lạnh (metadata chưa load lúc seek).
- **Đường HTTP đối chứng sạch:** full [0,32] trong 543 ms (lượt
  2 sạch; Q8: 913 ms), 724 frames — trần là tính chất pipeline
  blob/GStreamer, không phải của element nói chung (khẳng định
  lại đính chính M2 §4.1 của Q8).
- **PAUSED r2 lượt 1 — mode đói mới ("starve"):** blob không
  error, không fallback: qtdemux chết ngay ở pull ĐẦU (byte
  wrap) trước khi typefind nhận diện file → element không bao
  giờ có metadata, rs=0, buf=0,0 suốt 20 s, `stalled` 4,38 s,
  seek không xong, 0 progress sau suspend — mode đói này CHƯA
  có trong bar B-Q8-1 (cần bổ sung điều kiện phân biệt
  error/starve khi chạy lại bar).
- Dữ liệu thô: `hidden_files/round115-r8/` (prereg-r8.md,
  bundle/gst/pull, r8-*.log, r8-analysis*.txt).

## 9. R9 — Hạ tầng: replay #47 kẹp được (22.6', 27.7']; headroom rơi tiếp

- LIMITS: `docs/PHASE9_ROUND115_R9_INFRA_LIMITS.md`
  (28.918 B). Batch: `phase9-round115-r9-infra.txt` (2 entry:
  LIMITS R9 + postboot-check.sh).
- **REBOOT #47 XẢY RA GIỮA LƯỢT (17:45:50Z, boot_id
  5578af38-…, sau #46 = 15:44:49Z, gap #46→#47 = 2h01'01",
  không phá sàn 19'07").** R9 phát hiện ngay khi đang thử vite
  tạm (lock ghi boot mới lúc 17:46:46Z), đo try1 tay lúc boot
  1'59" và chạy watcher early-run LIVE — lần đầu watcher được
  dùng đúng lúc reboot vừa xảy ra.
- **Khoảng replay #47 ĐÃ KẸP ĐƯỢC: (22.6', 27.7']** — try#5
  FAIL lúc boot 22.6' (18:08:26Z), try#6 PASS lúc boot 27.7'
  (18:13:29Z, wrapper PASS, libs đủ 5, GST thư mục thật 269
  file đủ isomp4+libav, apt đủ 11). Nợ M8 §9.4 ĐÃ ĐÓNG cho boot
  #47 (boot thứ 2 liên tiếp sau #46). Chậm hơn #46 (1'23",
  7'08"] gần 4×: apt-get update của replay mất ~12 phút (mirror
  chậm, lists 3 → 37 lúc boot ~12.8'), rồi ledger ~170 package
  cài dần; 5 package plugin GST về đợt cuối (GST 32 → 256 file
  trong boot 25–26'). Caveat: postboot PASS ≠ replay xong toàn
  bộ ledger — replay shell (pid 772) + apt vẫn chạy sau PASS.
- **Headroom: #46 cuối đợt 114 là 1207 → R9 đo 1094 (17:43Z)
  → 1103 sau crash vite → boot #47 mới 1092 → sau replay PASS
  1073.** Reboot KHÔNG hồi headroom lần thứ 2 liên tiếp. Vite
  thường KHÔNG chạy được: "ready in 460 ms" rồi CHẾT ENOSPC
  (exit 1, tại captionPhase63R1.test.ts). Vite tạm watch.ignored
  vẫn sống: ready 369 ms, 0 inotify FD, HTTP 200 qua localhost
  (lưu ý: vite chỉ bind [::1] nên curl 127.0.0.1 = 000 là artifact
  đo, không phải vite hỏng).
- **Sửa postboot-check.sh (md5 6e5f400d… → f56aababe…):** (i)
  timeout riêng apt-get update 1500 s + install 1800 s trong
  --repair, báo rõ exit 124, không install mù; (ii) nhánh symlink
  GST trong --repair BỎ QUA khi replay đang chạy (lock/apt/dpkg)
  để không cướp thư mục plugin thật — lỗi này đã xảy ra ở boot
  #45; (iii) tham chiếu boot #46 → #47 + ghi bracket #47 vào
  header. bash -n OK; kiểm chỉ-đọc + kiểm final PASS (exit 0)
  xác nhận. --repair với code mới CHƯA chạy sống (cấm chạy trong
  lúc kẹp replay).
- **Watcher early-run v2** (r9-postboot-early-watch-v2.sh,
  bash -n OK): thêm snapshot trạng thái replay vào mỗi lần kiểm
  (apt/dpkg pids, lists, GST) để phân biệt "replay chưa chạy" vs
  "đang chạy nhưng chưa xong"; dry-run OK (try#1 FAIL boot 7.4',
  snapshot ghi đủ). Đề xuất vận hành (cần parent duyệt, R9 không
  tự gắn cron): (a) cron vòng lặp chạy v2 ở đầu mỗi lượt với
  --wait-new-boot, hoặc (b) luồng infra đầu tiên sau reboot chạy
  ngay.
- **QUYẾT PARENT 6 (15/11): phê duyệt đề xuất (b) làm luật
  đứng** — luồng infra đầu tiên sau mỗi reboot chạy watcher v2
  ngay (không gắn cron mới). Đề xuất (a) hoãn (cần sửa cron,
  parent chạy tay khi phát hiện reboot mới ở đầu lượt).
- **Symlink GST → debroot:** trên #47 hiện KHÔNG cần và KHÔNG
  ĐƯỢC tạo lúc này (replay đang cài thư mục thật). Đề xuất bền
  vững: phương án A — đưa mục apt lên trước mục GST trong
  --repair, symlink chỉ là fallback khi apt thất bại (ghi rõ
  FALLBACK-DEBROOT); phương án B — thay symlink bằng
  GST_PLUGIN_PATH ở driver launch (cần kiểm chứng, chỉ làm khi
  A không đủ).
- **Mù #33 ĐÃ ĐÓNG HOÀN TOÀN lúc probe #34 (17:45:02Z, R7)**
  — reboot #47 (48 s sau probe) mở mù MỚI #34; probe #35 đối
  chiếu từ mốc 17:45:02Z. Khoảng replay #45 VẪN MỞ.
- Dữ liệu thô: `hidden_files/round115-r9/`.

## 10. Nợ mở cho đợt 116 (gộp từ §1–§9)

1. **E4 — stall r1f3 att2 (S1):** tải thấp 0,92, sau
   steady-close 2497 ms, ct đóng băng 2,4667 ≥5771 ms,
   playing=True, probe dừng sớm. Điều tra cơ chế: có phải
   zombie Q2 (skip-gate + main-thread stall) ở tải thấp? Dữ
   liệu thô đã có trên đĩa (`round115-r1/`).
2. **Zombie H2 + LoAF/tracing (S2):** giới hạn tần suất capture
   A/B liền nhau cùng chế độ tải; chốt nửa longtask chưa rõ
   nguồn bằng Long Animation Frame API / Chrome tracing.
3. **Điểm gãy tải (S3):** biên GIỮ 19,63 (nice-19); đẩy cao hơn
   (s78, nhiều clip/tải hơn) tìm điểm gãy thật; dial load1 chậm
   150–275 s cần luật dial mới (hogs ≥90 s đã có — kiểm lại
   hiệu quả).
4. **Lock v2 migration nguyên tử (S4):** đợt v2-only, mọi driver
   cùng v2, VITE_LOCK_AGING_S=600; đo waiter dưới tải song song
   thật; cấm chế độ hỗn hợp v1/v2.
5. **WebKit ≤60 ms lần 5 (S5):** bổ sung điều kiện RAM giữa lượt
   vào lớp B; timeout wall-clock mỗi pass + ghi JSON tăng dần
   từng pass; chạy SAU postboot #48 PASS.
6. **Ghost seek ≥80 (S6):** tổng hiện 40 (Q5+R6); thêm lượt yên
   nữa; xác nhận cơ chế P4-type (frame đi trước currentTime
   +14f, pixels đóng băng frame 31); H-B đã yếu thêm.
7. **EPERM probe #35 + mù #34 (S7):** mù #34 mở từ 17:45:50Z
   (chứa #47/#48); probe #35 đối chiếu từ 17:45:02Z.
8. **Hạ tầng (S8):** postboot #48 CHƯA kiểm; replay #48 CHƯA
   kẹp; headroom ~1073 rơi tiếp; kiểm stale vite.lock sau reboot
   (boot_id + pid); chạy watcher v2 ngay (luật đứng mới, Quyết 6);
   khoảng replay #45 VẪN MỞ.
9. **Seek/preload B-Q8-1 (S9):** tiền đề bar chưa xảy ra vì lỗi
   ring-wrap ở pull đầu (R8 đã tìm trigger). Thử sửa adapter
   (prereg + A/B như R2) hoặc thiết kế lượt đo giữ pha blob đủ
   20 s; bổ sung phân biệt error/starve vào bar; bar seek lạnh
   ±500 ms so với P2SEEK 0,44 s quá chặt — xem lại.
10. **G1 + mù #22/#28/#29/#30 + mù #31 + reboot #16:** chờ user
    quyết (không tự quyết). Birefnet: 0 lần thành công — chỉ thử
    lại khi RAM đổi (RAM khả dụng ~1,0–2,5 GB < ngưỡng 6 GB;
    u2net là fallback chính thức). TTS 39 CẤM kiểm lại.
    ci-security.yml vẫn 403 chờ user.
11. **Nợ nhỏ R10:** recount part2 gốc crash vì None (đã vá bởi
    parent); O8 chưa chạy lại trên cây gộp đợt 115 — dời sang
    verify đợt 116 (S10) sau postboot #48 PASS.
12. **Dial:** load1 đáp ứng chậm 150–275 s; retry dial 120 s
    không đủ — mọi luồng đo tải cao đợt 116 dùng luật hogs ≥90 s
    + dial-wait dài hơn (ghi rõ trong prereg).

## 11. Ghi chú vận hành đợt 115

- R10 hết giờ cron khi đang recount — lần đầu verify không gộp
  xong trong lượt. Bài học: verify cần bắt đầu sớm hơn (poll
  9/9 DONE 20:19Z nhưng recount + suite chỉ chạy 20:33Z trở đi);
  đợt 116: S10 bắt đầu recount ngay khi 7–8/9 luồng về, không
  chờ 9/9; suite cây gộp chạy song song với recount.
- R2 đổi cây giữa đợt làm LAI lượt R3 attempt 1 (1526 tick) và
  buộc R1/R5/R6 chờ cờ tree — bài học cũ vẫn đúng: mọi sửa
  production trong đợt đo phải đăng ký trước giờ đo, hoặc dời
  sang đợt sau; cờ tree NO-CHANGE đã hoạt động đúng (R1/R5/R6
  đều chờ và đo trên đúng cây).
- Tần suất reboot dày (3 reboot/4 giờ: #46 15:44Z, #47 17:45Z,
  #48 19:43Z) — lượt đo dài ~30 phút có nguy cơ bị cắt ~25%;
  mọi probe dài cần checkpoint tăng dần + resume sau reboot
  (R5 đã nêu cho WebKit; áp dụng chung).
- RAM avail dao động mạnh (350 MB – 3,9 GB trong một lượt);
  consumer ngoài cell vô hình với `ps` — mọi gate "yên" phải
  kèm RAM-mid-run, không chỉ RAM lúc mở gate.

## 12. Bổ sung kiểm chứng parent (main chat, 04:0x +07 15/11/2026 — sau gộp muộn lượt 03:35)

- **Bối cảnh đua lượt:** lượt cron 03:35 đã gộp muộn đợt 115 song song
  với verify của main chat (cùng cửa sổ 20:33–20:57Z — lượt 03:35
  bắt đầu trước khi chốt chặn main-chat được đặt, nên không bị chặn).
  Parent main chat kiểm lại độc lập toàn bộ: suite cây gộp của mình
  (tsc 0/0, r6 PASS, vite build PASS 7,23 s, P7 8/8, orphans 17/17,
  css60/61 60/60, pacing 19/19, hold 93, ghostBlend 15/15, test E4
  5/5, preview-engine 354, U4 141/141) + **O8 trên boot #48: Chromium
  21/21 (20:52:21Z), WebKit 21/21 (20:53:19Z), boot 0c2a9f2f** +
  **postboot #48 PASS** (DU DIEU KIEN, GST 269 file, apt 11/11) +
  recount độc lập 7/7 luồng (qua điều phối viên, file
  `recount-<rX>.txt` trong `hidden_files/round115-r10/`). Kết luận:
  gộp muộn của lượt 03:35 là ĐÚNG ở mọi verdict lớn; phần dưới chỉ
  bổ sung đính chính sâu hơn và đóng 2 mục nợ (O8 + postboot #48).
  Các quyết parent 1–6 trong log (dòng 5010) được parent main chat
  PHÊ CHUẨN LẠI, không thay đổi — kể cả Quyết 6 (watcher v2 (b) làm
  luật đứng: luồng infra đầu tiên sau mỗi reboot chạy watcher v2
  ngay; phương án (a) sửa thân cron KHÔNG duyệt).
- **Đính chính R2 (phương pháp, quan trọng):** "longtask khớp pump"
  trong LIMITS tính bằng |start − invoke| ≤ 13 ms (tuyệt đối) trong
  khi prereg §3(a) ghi "start trong 13 ms SAU pump invoke" (có
  hướng). Tính lại đúng chữ: 10 → 10 ca, 39,8 → 34,5 ms/s (−13,2%),
  không tăng; suy luận §6 mất bằng chứng. Số đúng nếu giữ chữ
  "sau": 39,8 → 34,5 ms/s; nếu giữ +65% thì phải sửa chữ thành
  "trong ±13 ms quanh pump invoke". Lỗi kế thừa từ Q2. Verdict BỎ
  vẫn đúng dưới cả hai định nghĩa (bar (a) cần giảm ≥20%:
  −13,2% theo hướng vẫn trượt; bar (b) capMs median −13,4% chưa
  tới −40%). Nhỏ: capMs median Δ −13,4% (không phải −13,7% từ số
  làm tròn); p90 tùy cách tính phân vị (−9,9% theo chỉ số, −7,5%
  nội suy); nhãn load5 14,97/7,83 là loadBandAtPlay, không phải
  median snaps; patch +23 net (không phải +14).
- **Đính chính R4:** bảng §4.5 thiếu 5/18 dòng log (3a + toàn bộ
  pidfix); timeline §4.1 tiêu đề "chuỗi holder v1" nhưng gồm cả
  attempt 2 (v2), thiếu các hold r4, r1 hold ~75–77 s; dòng log
  "KHÔNG NHẢ — owner hiện tại là '?'" chưa được giải thích trong
  LIMITS (khả dĩ là 1 lần release thử lại sau khi owner đã mất —
  suy luận, chưa chứng minh); không có log chạy test gốc trong
  thư mục r4 (cờ done là file rỗng) nên lịch sử T6/T7 trước đó
  không đối chiếu được từ đĩa — bù lại recount chạy lại test 3
  lần độc lập đều 9/9, T6 3416–3519 ms (nằm trong khoảng đã báo).
  Quan sát: T6 chậm dần 3048–3110 ms → 3300–3530 ms sau các vá,
  chưa giải thích.
- **Đính chính R5 (15 mục, chủ yếu số RAM):** median RAM poller
  đúng 736 MB (không phải 724 — 724 chỉ là giá trị poll#15;
  v2-only n=21; đếm cả 22 dòng = 730 MB); dải load-mid đúng
  247–1429 MB (không phải 350–712); attempt1 poll1 cả load1 VÀ
  load5 đều vượt (không phải chỉ load1); poll 1–3 RAM 438–463
  (không phải 438–444); poll 6–8 load5 1,64–1,82 (không phải
  1,65–1,82); CPU WebKit "1 s/1,5 phút (5,7%)" không có dữ liệu
  và sai số học (1/90 = 1,1%); CPU node, RSS, swap 434 MB, đỉnh
  RAM 1793 MB, "libgssdp-1.6-0" đều không có dữ liệu đối chiếu;
  mâu thuẫn RAM lúc chết (447 MB lúc 19:29:54 vs 927 MB lúc
  19:30:04); postboot #47 lệch mtime 1 s; FLIP chênh Q5 1207 ms;
  "kẹt 17 phút" đúng là 17'50". Kết luận chính không đổi: không
  có lượt yên hoàn chỉnh, ngưỡng ≤60 ms GIỮ MỎNG.
- **Đính chính R6 (nhỏ):** §4.2 ghi lẫn đơn vị snapMs/tBlend —
  khoảng freeze frame 31 đúng là tBlend 36050–36417 = 367 ms trên
  6 tick (seq 214–219), không phải "5 tick (35960–36263,
  ~300 ms)"; đuôi event 3 lag đúng 0..+4f (không phải +2..+4f).
  Chưa kiểm: keyframe fixture, tsc/ghostBlend (parent chạy suite
  song song), RAM 1407 MB lúc gate-A.
- **Đính chính R7 (nhỏ):** giây phân biệt đúng 253 (không phải
  255 — 2 giây trùng giữa hai cây); 17 file copies thực tế là 3
  build/bundled-server + 7 release/linux-unpacked + 7
  release-round55-l4, 0 file dưới slim-venv (LIMITS lẫn với
  files-copies.txt); khoảng poller Q5 đúng 60 s ×8 + 61 s ×1 =
  541 s (không phải "60 s ×9 + 61 s ×1" = 601 s). Chưa kiểm:
  16/88 file log Q8 đã bị xoá; 3/4 mẫu RAM §3 không có trong dữ
  liệu r7; uptime lúc probe không đo lại được. (Lưu ý: "quan sát
  mới" của subagent recount R7 — reboot 19:43:46Z = #47, gap
  3h58'57" vượt dải chứng nhận — là SAI: bỏ sót reboot #47 =
  17:45:50Z đã được R2/R4/R9 xác nhận; boot 19:43:46Z là #48,
  gap #47→#48 = 1h57'56", trong dải.)
- **Đính chính R8 (số đếm, phải sửa trước khi dùng số):**
  "pull wrap → lỗi 9/9" sai, đúng 8/8 (run lỗi thứ 9 không có
  pull wrap — chính là ngoại lệ §5.3); bogus size không duy nhất:
  L2 SEEKFAST r2 có 4002606236 (= byte tại file offset 4.194.336,
  ring+32) — 6/8 run lỗi có 385313657, 1/8 có 4002606236, 1/8
  không có bogus; "pull đầu wrap → lỗi/đói 7/7" sai, đúng 6/6,
  hệ quả "first ftyp → sạch 3/5" sai, đúng 3/6; "9/9 errEvents
  code null" sai, đúng 8/8; "gộp Q8+R8 bị ảnh hưởng 14/23 (61%)"
  sai, đúng 16/23 (70%) — Q8 có thêm 2 run stall-timeout LIMITS
  không đếm; dải delay "0,44–3,80 s" thiếu ngoại lệ Q8 PLAYING r1
  delay 16,21 s, và "PLAYPAUSE r2: 23,2 s" là errT tuyệt đối,
  delay đúng 17,81 s. Nhỏ: "blobReady nhanh → lỗi 5/6" nên là
  5/5; "Internal data stream error" cũng xuất hiện ở run sạch.
  Mẫu lỗi chung: cộng run đói/stall vào mẫu số của các đếm chỉ
  liên quan error-event. Không điểm lệch nào đổi verdict lớn
  (B-Q8-1 vẫn KHÔNG ĐẠT; ring-wrap vẫn là cơ chế đúng).
- **Đính chính R9 (nhỏ):** "apt-get update xong lúc boot ~12.5'"
  — chỉ chứng minh được trong (11,8', 12,8']; dao động headroom
  1103→1092 = −11, vượt ±10 đúng 1 watch; bước GST đúng là 33 →
  256 trong (24,9', 26,0'] (không phải 32 → 256); §4.2 nhãn "lần
  thử đầu trên boot #47 (trước reboot #47?)" tự mâu thuẫn, §4.4
  đính chính đúng là sau reboot; header log try1 tay vẫn ghi
  reboot #46/boot cũ vì chạy script cũ trước khi sửa. Chưa kiểm
  được từ dữ liệu thô trong thư mục r9: O8, exit code vite
  thường, output curl/ss/FD vite tạm, RAM "401 MB", pid replay
  772, "~170 package ledger", "ghostscript xong 18:09:16Z", lock
  boot/timestamp, dry-run v2 try#1, md5 trung gian 22e8867c, pid
  watcher, md5 vcut-vite-lock.sh, "preview.tsx không sửa" — ghi
  là "R9 báo cáo, chưa có log thô trong thư mục r9".
- **Đính chính R1/R3 (R10, parent kiểm lại):** R1 Fisher +
  analyzer chạy lại khớp hết (0/184 p=0,0859; Q1+R1 0/344
  p=0,0083; 0/1008 p=0,000108; nhị thức chính xác khớp);
  R3 analyzer chạy lại khớp (s77c GIỮ 2231 tick, 88,7% ±1,
  load1 19,63; dry3 471 tick 100% ±1). Lưu ý: R3 "≤−2 = 0,0%"
  là làm tròn của 1/2231 (0,04%).
- **Đính chính §10 mục 7:** mù #34 mở từ **17:45:02Z** (probe
  #34), không phải từ 17:45:50Z (đó là reboot #47); mù #34 chứa
  #47 (17:45:50Z) và #48 (19:43:46Z), chờ probe #35 đóng.
- **Đóng 2 mục nợ §10/§11:** postboot #48 PASS (main chat chạy,
  DU DIEU KIEN, GST 269, apt 11/11) — mục 8 "postboot #48 CHƯA
  kiểm" ĐÃ ĐÓNG; O8 trên boot #48 21/21 cả 2 engine — mục 11
  "O8 chưa chạy lại" ĐÃ ĐÓNG (không cần dời sang S10 nữa; S10
  vẫn làm verify đợt 116 bình thường). Replay #48 vẫn CHƯA kẹp
  (bracket) — giữ mở cho S8.
- **Đếm lại cuối (sau bổ sung gap §44 + closing batch):** đợt
  115 = 10 batch / 19 entry / 18 file duy nhất; chờ push thật
  (đợt 111–115) = **48 batch / 98 entry / 84 file duy nhất + 1
  oversize 6,4 MB**. Số trong log dòng 5010 (47/96/83) tính
  trước khi stage closing batch nên thiếu 1 batch / 1 entry /
  1 unique (file LIMITS gộp).
