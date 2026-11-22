# PHASE9_ROUND159_T4_WEBKIT_QUIET28_LIMITS.md

**Đợt:** 159. **Luồng:** T4 — đo lượt yên WebKit #28 trên 1 boot
+ LƯỢT HỢP LỆ #24 (chuỗi lượt yên hợp lệ nối dài: #22 đợt 157 →
#23 đợt 158 → #24 đợt 159)
+ KHÔNG PAGE-WEDGED (0 wedge — lần thứ 3 liên tiếp: đợt 157, 158, 159).
**Ngày:** 21/11/2026 (lượt cron 09:35 +07 21/11 = 02:35:51Z 21/11).
**Boot đo:** eec65561 (reboot #59 ĐÃ XÁC NHẬN, quyết (s) đợt 157;
btime 01:33:47Z — boot lúc mở; KHÔNG có reboot mới trong lúc đo
hay lúc đóng sổ; kiểm cuối 02:56Z vẫn eec65561).
**Trạng thái:
#28 CÓ LƯỢT HỢP LỆ — attempt1 ĐẠT NGAY ở lần mở cửa đầu tiên
(02:46:28Z), ngân sách 3/3 chỉ dùng 1/3 (poller thoát 02:50:27Z,
trước hạn cắt poller 04:30Z gần 1h40m, trước hạn cờ ~05:00Z hơn
2h). Attempt1-eec65561 probe 20/20, LỚP B ĐẠT 5/5, tickCost
median 44,5 ms ≤60 (dư 15,5 ms). (c2)=5 occurrence / 5
distinct-seq, COVERED 5/5. P1 ĐÚNG (5/5 occ), P2 ĐÚNG (5/5 lag
+1f, 0 âm), P3-A1 ĐÚNG (5/5 occ, p=4,40e-04), P3' 5/5 occ ĐẠT
(DAT seq 253, 279, 435, 458, 483), P7 ĐÚNG (0 entry trễ ≥+1f).
lag≥+5f = 0 occurrence (sạch như đợt 158). Cộng dồn MỚI (24 lượt
hợp lệ): P1 91/92, P2 83/83, P3-A1 77/92, P3' 56/64 occurrence
= 56/59 distinct-seq, P7 58/58. PRE-FLIGHT CHECK (quyết (t)
đợt 158, quy tắc đứng mới) PASS toàn bộ TRƯỚC KHI poller chạy —
F-158-T4-1/2 KHÔNG lặp lại. Cờ T5-159 CÓ cho boot đo
(POSTBOOT_PASS 02:41:22Z, replay đầy đủ, không cần repair).**

## 0. Verdict tổng

- **#28 CÓ LƯỢT HỢP LỆ (lượt hợp lệ #24, attempt1).**
  Ngân sách 3 attempt/đợt dùng **1/3**: attempt1 ĐẠT NGAY, không
  cần retry. Poller thoát 02:50:27Z vì LUOT HOP LE — KHÔNG
  phải hết ngân sách hay hết hạn (hạn cắt 04:30Z còn 1h40m).
- **Attempt1-eec65561 (02:46:28–02:50:27Z): probe 20/20,
  LƯỢT HỢP LỆ (tickCost 44,5 ≤ 60, lớp B 5/5).** Vite :5187
  (giữ lock ~4 phút), WebKit 27.2, app boot OK 02:46:42Z, C2
  draw log BẬT, rVFC TẮT, TAP BẬT, RELABEL BẬT. 20 pass (wall
  2894–3686 ms/pass): tickCost n=624, blendTick n=505,
  c2DrawLog n=1209.
  **tickCost total median= 44,5 ms (p90 70,0, max 118, min 28)**;
  hậu flip+2000 ms median 43,0. Per-pass median 38,5–59,0 ms —
  **20/20 pass ≤60** (không pass nào vượt cổng). **(c2)=5
  occurrence / 5 distinct-seq, COVERED 5/5.**
  lag≥+5f = 0 occurrence / 0 event — sạch hoàn toàn (đợt 157:
  30 occ; đợt 158: 0 occ). **p1p3p7 chạy TAY (F-148-T4-1): P1
  ĐÚNG, P2 ĐÚNG, P3-A1 ĐÚNG, P7 ĐÚNG** (xem §6). **KHÔNG
  PAGE-WEDGED** — attempt1 chạy đủ 20/20, 0 fetch timeout, JSON
  đầy đủ 3.463.123 B, probe exit=0.
- **Poller: 6 poll thật** (1 test + 5 poller), **1 boot duy
  nhất, 1 instance duy nhất** (không chết/khởi động lại; fix
  F-155-T4-1 giữ vững đợt thứ tư). RAM ≥1024: 6/6; 0 poll
  <500 MB. **1 poll** load+RAM cùng đạt — **poll đó mở cửa**
  (#5), 0 poll gần-mở bị chặn bởi apt/gate0.
  Gate0: T5 6 poll (1 test + 5 poller), T4-check-only 0 poll
  (cờ T5 tới trước khi mở poller).
  apt>0: 0 poll (replay đã xong trước khi mở).
- **Chuỗi lượt yên hợp lệ: NỐI DÀI LÊN #24.** Cộng dồn 24 lượt:
  P1 91/92, P2 83/83, P3-A1 77/92, **P3' 56/64 occurrence =
  56/59 distinct-seq**, P7 58/58. Chuỗi median tickCost 24 lượt:
  39,0–60,0 ms, mean ~48,1 ms, 0 lượt vượt 60.
- **Điều kiện GIỮ NGUYÊN như #27 (quyết (j) đợt 158):** ngưỡng
  gate A RAM ≥1024 MB, load1<2, load5<2, tickCost median ≤60 ms,
  lớp B 5/5, ngân sách 3 attempt/đợt, poll 45 s — KHÔNG đổi
  ngưỡng/cadence nào.
- **Cây:** `apps/web/src/preview.tsx` md5 `530e10a7` (lúc mở
  poller, lúc test poll, lúc đóng — không đổi; mọi poll đều
  tree=YES).
- **Cờ:** `hidden_files/round159-t4.done` viết ~03:0xZ 21/11
  (trong hạn cờ ~05:00Z, sớm ~2h), CÓ NỘI DUNG.

## 0b. Pre-flight check — QUY TẮC ĐỨNG MỚI (quyết (t) đợt 158)

Chạy **trước mọi attempt, trước khi mở poller** (02:40–02:43Z),
ghi vào `hidden_files/round159-t4/preflight-159.txt` — **PASS
TOÀN BỘ**:

- **b.json CÓ trong `round159-t4/`, md5
  `078938cf92d33016f8bd29e45bf129c6`** — khớp hệt bản đợt
  156/157/158 (F-158-T4-1/2 KHÔNG lặp lại: file spec đã có
  trước khi poller chạy).
- **probe md5 `4291e539ce1d330bd35ec7b3b6764f05`** — khớp bản đã
  stage đợt 148–158. **vite.t4-temp.config.mjs md5
  `e3e874e1528b28563f7aa26234661522`** — khớp.
- **tree-md5.txt `530e10a7` == preview.tsx hiện tại** (`530e10a7`).
- **10/10 analyzer** `analyze-t4-*.py` có mặt (c2coverage,
  c2drawlog, labellag, lag5, p1p3p7, perpass, skiplatest, stall,
  tickcost, wallbands).
- **Script hệ thống:** `vcut-webkit-postboot-check.sh` +
  `vcut-vite-lock-v2.sh` có mặt; `bash -n` OK cả 4 script T4;
  `python3 -m py_compile` OK 12 file py.
- **Playwright-core** `/home/hatch/scratch-round63-r4/
  node_modules/playwright-core/index.mjs` có mặt.
- **Media** `apps/web/public/stripes-nonperiodic.mp4` có mặt
  (140.828 B).
- **Lock + ngân sách trống:** không có `vite.lock`,
  không có `attempt-done-*` trong thư mục làm việc mới.
- **Postboot check-only chạy tay: exit 0** trên boot #59
  ("DU DIEU KIEN chay WebKit", xem `preflight-postboot-159.log`).
- **Cờ T5-159 PASS trước khi mở poller** (xem §3).
- **Test poll (POLL_TEST=1): exit 7 đúng thiết kế** —
  poll #1 RAM 1837 MB, load1 4,83/load5 2,70 (cửa đóng vì tải),
  gate0=T5 PASS, tree YES, blockers comm-based 0, apt 0,
  dpkg 1545 (xem `poll-test-159.log`).

## 1. Poller — 6 poll thật, 1 lần cửa mở, trên 1 boot

- **Instance 1 — TEST (POLL_TEST=1), 1 poll, boot eec65561
  (02:43:10Z):** poll #1 RAM=1837 MB, load1=4,83 load5=2,70,
  blockers=0, gate0=T5 (cờ T5-159 đã có — viết 02:41:22Z,
  xem §3; check-only không cần chạy) → cửa đóng (chỉ tải
  chặn) → **TEST-POLL-OK exit 7 đúng thiết kế**. Poll này nằm
  trong `poll-test-159.log`; thống kê §A đã hợp nhất.
- **Instance 2 (không POLL_TEST), 5 poll, boot eec65561
  (02:43:26–02:46:27Z):** RAM ≥1024: 5/5; load1<2: 2/5;
  load5<2: 1/5; gate0: T5=5; lock=khong 5/5; dpkg 1545 suốt;
  blockers=0 (comm-based) cả 5 poll; apt>0: 0 poll.
- **Giai đoạn 1 — chờ tải hạ (poll #1–#4, 02:43–02:45Z):**
  gate0=T5 PASS ngay từ poll đầu, RAM 2161 → 2166 → 1894 →
  1784 MB (đều ≥1024), cây YES, lock trống, blockers 0 —
  **chỉ tải chặn cửa**: load1 4,61 → 2,82 → 2,41 → 1,57;
  load5 2,76 → 2,55 → 2,46 → 2,25 (luồng khác đợt 159 đang
  chạy việc nặng lúc mở poller).
- **Giai đoạn 2 — cửa mở (poll #5, 02:46:27Z): load1=0,87,
  load5=1,96 <2, RAM=1584 MB** → **CỬA MỞ, chạy attempt1** →
  ĐẠT → poller thoát 02:50:27Z.
- **Phân rã 6 poll thật:** RAM≥1024: 6/6; RAM 500–1023: 0/6;
  RAM<500: 0/6. load1<2: 2/6; load5<2: 1/6. Chỉ 1 poll mà
  load + RAM cùng đạt — **poll đó mở cửa** (#5), 0 poll
  gần-mở bị chặn. gate0: T5 6 poll, T4-check-only 0 poll.
  blockers>0: 0 poll. apt>0: 0 poll. **KHÔNG có reboot trong
  phiên đo** (boot eec65561 suốt, btime 01:33:47Z, kiểm lúc
  đóng 02:56Z).
- **RAM sập KHÔNG tái diễn:** đợt 154: 74/147 poll <500 MB;
  đợt 155: 2/123 + 64 phút <1024 liên tiếp; đợt 156: 0/32
  <500 MB; đợt 157: 0/25 <500 MB; đợt 158: 0/18 <500 MB;
  đợt này: **0/6 poll <500 MB, 0 poll <1024** — RAM mở
  1837 MB (test) rồi 1584–2166 MB (poller). Gate A RAM ≥1024
  không phải nguyên nhân chặn cửa đợt này — cửa bị chặn duy
  nhất bởi tải (load1/load5).

## 2. Một attempt — ĐẠT NGAY, 0 wedge

- **Attempt1-eec65561 (02:46:28–02:50:27Z): probe 20/20,
  LƯỢT HỢP LỆ (tickCost 44,5 ≤ 60, lớp B 5/5).** Vite :5187
  (ready 549 ms, giữ lock ~4 phút, ticket
  1-1795229188278782451-35541-t4), WebKit 27.2 (Xvfb :193),
  app boot OK 02:46:42Z, C2 draw log BẬT, rVFC TẮT, TAP BẬT,
  RELABEL BẬT. 20 pass (wall 2894–3686 ms/pass): tickCost
  n=624, blendTick n=505, c2DrawLog n=1209.
  **tickCost total median= 44,5 ms (p90 70,0, max 118, min 28)**
  — dư 15,5 ms dưới cổng; hậu flip+2000 ms median 43,0.
  **Lớp B: ĐẠT 5/5** (B1 load5 cuối 1,14 ≤2,5; B2 load1 max
  1,04 ≤4 — xem caveat ps dưới; B3 không reboot; B4 pgrep
  -x=0, ps exact-comm=0, dpkg delta=0; B5 RAM min 1064 MB,
  0 mẫu <500 MB, **0/103 mẫu <1024 MB** — tốt nhất kể từ
  đợt 157). Sampler n=103.
  Per-pass: tickCost median/pass 38,5–59,0 ms — **20/20 pass
  ≤60**; load1 trong attempt 0,42–1,04 (mean/pass 0,43–1,00);
  RAM mean/pass **giảm nhẹ 1269 → 1172 MB** (balloon ghim nhẹ
  trong lúc đo — nhẹ hơn hẳn đợt 158: 837 → 657 MB; xem
  §7(e), giao T9 đối chiếu). Pearson r=0,34 median~load1_mean,
  r=0,41 median~RAM_mean (chỉ mô tả). **KHÔNG PAGE-WEDGED:**
  0 fetch timeout, JSON đầy đủ 3.463.123 B (md5
  `bb86b066d1f8104b3d90393852bf6d6f`), `passes=20`, không có
  trường `partial`/`passesDone`, probe exit=0.
  **(c2)=5 occurrence / 5 distinct-seq, COVERED 5/5.**
  lag≥+5f = 0 occurrence / 0 event — đây là số (a)/(b) (label
  lag sau presented), không phải (c2); ghi nhận, không dùng
  làm verdict. **p1p3p7 chạy TAY (xem §6).**
  **F6' ĐÓNG** — skipLatest pixel-verified 100% (64/64 tick
  không vi phạm thật, bar ≥30 tick, xem skiplatest).
- **Caveat B2 (F-159-T4-3, ghi nhận — KHÔNG đổi verdict):**
  `ps-before` có 1 process của luồng khác — pid 34972
  `node .../server/render/src/test_v19_pixelate_probe.js`
  (probe render của luồng khác, có mặt lúc attempt bắt đầu);
  `ps-after` chỉ còn esbuild service của chính vite T4 —
  probe lạ đã hết trước khi attempt kết thúc. Load1 max
  trong cửa sổ chỉ 1,04 (sampler n=103, load1 0,42–1,04),
  load5 cuối 1,14 — máy yên về hiệu ứng; không có bằng chứng
  process lạ gây tải trong lúc đo. B2 ĐẠT theo tiêu chí tải;
  ghi nhận sự hiện diện này để T10/T8 đối chiếu, verdict
  giữ nguyên.
- **Lưu ý (c2) seq 259 (quyết (j) đợt 156):** đợt này KHÔNG
  phát sinh trường hợp tương tự — cả 5 seq đều mới (xem §6);
  không có seq nào ĐẠT trong attempt không hợp lệ để phải
  loại trừ.

## 3. Replay/postboot trên boot mới — cờ T5 CÓ

- **Boot eec65561 (reboot #59 ĐÃ XÁC NHẬN, btime 01:33:47Z):**
  replay ĐÃ XONG lúc mở (dpkg.log 1545 dòng ngay poll đầu —
  rootfs KHÔNG rebuild đợt này, như boot #58 đợt 158).
  T5-159: **POSTBOOT_PASS mới viết 02:41:22Z (boot+1h07m35s;
  dpkg 1545 dòng; cache 178 .deb, lists 39; postboot PASS độc
  lập exit 0 poll=0; replay-day-du, không cần repair)**; cờ cũ
  lưu `POSTBOOT_PASS-28366bd0`. Gate0=T5 từ poll đầu tiên
  (cả test poll 02:43:10Z lẫn poller #1 02:43:26Z).
  T4 check-only: **PASS exit 0 chạy tay lúc pre-flight**
  (02:40–02:44Z, xem `preflight-postboot-159.log`) — đường dự
  phòng không cần dùng vì cờ T5 đã có trước khi mở poller;
  check-only trong poller chạy ở poll #1/#5 (mỗi 4 poll) đều
  exit 0 (`postboot-t4-159-gate0wait-1.log`,
  `postboot-t4-159-gate0wait-5.log`).
- **KHÔNG có reboot mới trong phiên đo hay lúc đóng:** boot
  eec65561 lúc mở poller (02:43:26Z), lúc attempt1, lúc poller
  thoát (02:50:27Z) và lúc kiểm cuối (02:56Z) — btime
  01:33:47Z không đổi. Số hiệu #59 ĐÃ XÁC NHẬN theo quyết (s)
  đợt 157; mù #91? (#59) giao T2 (đợt 159).

## 4. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND159_T4_WEBKIT_QUIET28_LIMITS.md`.
- **Script snapshot để stage (trong repo `apps/web/scripts/` —
  md5 khớp bản làm việc ở `hidden_files/round159-t4/`):**
  `poll-wait-t4-159.sh` (deadline 04:30Z 21/11 + cờ T5
  round159-t5/ + fallback round158-t5/ + nhãn T4-159a),
  `run-attempt-159.sh` (đổi số vòng/đường dẫn/nhãn so với 158).
  **KHÔNG stage lại probe** (`probe121t3-ghost-k7.webkit.mjs`
  — byte-identical với bản đã stage đợt 148–158, md5
  `4291e539...`) và **KHÔNG ghi đè `t4-attempt-inner.sh` /
  `check-classb-t4.sh`** (bản làm việc ở
  `hidden_files/round159-t4/` — inner có fix F-156-T4-1 đổi
  `round158-*` → `round159-*`, theo đúng mẫu 149–158: chỉ
  stage 2 script trên; fix inner theo bản làm việc sang đợt
  160). **`b.json` KHÔNG stage** (file spec làm việc, theo mẫu
  các đợt trước — chỉ có trong `hidden_files/round159-t4/`,
  md5 `078938cf...`, giống hệt bản đợt 156/157/158).
- **Script làm việc (hidden_files, không stage):**
  `poll-wait-t4-159.sh`, `run-attempt-159.sh`,
  `t4-attempt-inner.sh` (CÓ fix F-156-T4-1 đổi sang
  `round159-*`), `check-classb-t4.sh`, 10 analyzer
  `analyze-t4-*.py`, `vite.t4-temp.config.mjs`, `b.json`,
  `probe121t3-ghost-k7.webkit.mjs`, `tree-md5.txt` (530e10a7),
  `stats-159.py` (thống kê §A — trích từ log gốc, không gõ tay),
  `distinct-seq-159.py` (helper cột distinct-seq — đợt này
  input mới: attempt1 5 distinct-seq, xem §6 + F-159-T4-4),
  `preflight-159.txt` + `preflight-postboot-159.log`
  (pre-flight check, quyết (t) đợt 158).
- **Log/evidence (hidden_files/round159-t4/, không stage):**
  `poll-t4.log` (start ×1 instance + 5 poll thật + CUA YEN MO
  ×1 + LUOT HOP LE), `poll-test-159.log` (test start + 1 poll
  thật + TEST-POLL-OK exit 7), `poll-t4.nohup.log`,
  `chain-t4.log`, `postboot-t4-159-gate0wait-*.log` (check-only
  poll #1/#5 — đều PASS), `appendix-159.txt` (output
  stats-159.py),
  `preview-b-f3-flip-webkit-t4-attempt1-eec65561.json`
  (3.463.123 B, 20/20, md5 `bb86b066d1f8104b3d90393852bf6d6f`)
  + `run-webkit-t4-attempt1-eec65561.log` +
  `load-mid-t4-attempt1-eec65561.log` (sampler n=103) +
  `ps-before/after-t4-attempt1-eec65561.txt`
  + `classb-t4-attempt1-eec65561.txt` (LOP-B-TONG DAT 5/5)
  + `analyze-t4-attempt1-eec65561-*.txt` (10 file/attempt)
  + `analyze-t4-p1p3p7-attempt1-eec65561.txt`
  + `coverage-check-attempt1-eec65561.txt` (5/5)
  + `attempt-done-attempt1-eec65561` (exit 0).
  `analyze-l7-labellag.txt` + `lag5-detail.txt` là output mặc
  định của analyzer (ghi theo tên mặc định trong script —
  xem F-157-T4-6), nội dung trùng bản per-attempt.
- **KHÔNG có:** sửa code repo nào ngoài LIMITS này + 2 script
  snapshot (§4); không process T4 nào còn sống lúc đóng
  (poller đã thoát 02:50:27Z vì LUOT HOP LE; vite :5187 +
  lock trống, curl 000).
- **Stage:**
  `~/workspace/repo-1-push/paths-loop/phase9-round159-t4-quiet28.txt`
  (NUL-delimited, 3 entry — LIMITS + 2 script snapshot; đã verify
  bằng `od`).
- **Cờ:** `hidden_files/round159-t4.done` (~03:0xZ 21/11 — trong
  hạn cờ ~05:00Z, sớm ~2h, CÓ NỘI DUNG).

## 5. Sai số F-159-T4-1..4 (+ nợ cũ)

- **F-159-T4-1 — p1p3p7 CHẠY TAY LẦN ĐẦU THIẾU ĐỐI SỐ seqs
  (sai số thao tác, phát hiện + sửa trong phiên, không ảnh
  hưởng đo).** Lần đầu chạy `analyze-t4-p1p3p7.py <JSON>`
  thiếu argv[2] → `IndexError`, exit 1 (xem F-148-T4-1:
  script KHÔNG tự gọi p1p3p7, T4 phải chạy tay — nhưng cú pháp
  tay là 2 đối số). Chạy lại với `"253,279,435,458,483"` →
  exit 0, output lưu
  `analyze-t4-p1p3p7-attempt1-eec65561.txt` (xem §6). Chỉ là
  analyzer hậu kiểm, không chạm vào đo. Bài học: p1p3p7 tay
  luôn kèm seqs CSV lấy từ labellag.
- **F-159-T4-2 — COPY-FORWARD sed CẦN 3 MẪU, KHÔNG PHẢI 1
  (sai số quy trình, phát hiện + sửa trong phiên nhờ grep
  kiểm, không ảnh hưởng đo).** Lệnh sed đầu chỉ đổi
  `round158` → `round159`, còn sót `t4-158` (trong
  `poll-wait-t4-158.sh`, `postboot-t4-158-gate0wait`) và
  `attempt-158` (trong `run-attempt-158.sh`,
  `poll-test-158.log`). Grep kiểm sau mỗi lượt sed phát hiện
  0 sót cuối cùng: chỉ còn `round158-t5` fallback (đúng) +
  trích dẫn `LIMITS 158 §6` (đúng). Bài học: copy-forward
  phải sed cả 3 mẫu (`roundNNN`, `t4-NNN`, `attempt-NNN`)
  rồi grep `NNN` cũ — đã làm đúng quy trình kiểm, không lỗi
  nào lọt vào poller (pre-flight + test poll đều chạy trên
  bản đã sửa xong).
- **F-159-T4-3 — ps-before CÓ PROCESS LẠ CỦA LUỒNG KHÁC
  (caveat B2, xem §2 — KHÔNG đổi verdict).** pid 34972
  `node .../test_v19_pixelate_probe.js` có mặt lúc attempt
  bắt đầu, hết trước khi attempt kết thúc. Load1 max 1,04 /
  load5 cuối 1,14 trong cửa sổ → không có bằng chứng gây
  tải; B2 ĐẠT theo tiêu chí tải. Ghi nhận để T10/T8 đối
  chiếu khi xét chuỗi FULL PASS (O8 chạy sau về thời gian).
- **F-159-T4-4 — HELPER distinct-seq VẪN CHƯA TRỪ SEQ CŨ TỰ
  ĐỘNG (nợ F-157-T4-5 chưa vá — nhưng đợt này KHÔNG SAI SỐ
  NHỜ KIỂM TAY).** Helper in `56/59` với giả định cả 5 seq
  đều mới. T4 kiểm tay bằng grep từng seq trên toàn bộ LIMITS
  T4 cũ (xem §6): **không seq nào trong 5 seq từng xuất hiện
  trong dòng (c2) của attempt hợp lệ nào** — seq 279 chỉ
  từng xuất hiện trong dải event lag≥+5f 276–279 (đợt 126–
  130), KHÔNG phải (c2), nên chưa từng được đếm. Kết luận:
  cả 5 seq đều mới, 56/59 là ĐÚNG. Nợ vá helper tự động (đọc
  sổ distinct-seq) vẫn còn — giao T10/T4-160.
- **F-158-T4-1/2 — ĐÃ TRÁNH (pre-flight check, quyết (t)).**
  Pre-flight check bắt buộc chạy trước poller đã kiểm `b.json`
  có mặt + md5 khớp (xem §0b) — lỗi quên copy file setup của
  đợt 158 không lặp lại; attempt1 ĐẠT NGAY, ngân sách chỉ
  dùng 1/3.
- **F-157-T4-2 — ĐÃ TRÁNH (bài học áp dụng thành công).**
  Khi sed copy-forward poll-wait, T4 grep cả 3 dạng deadline
  (`04:30:00 UTC`, `04:30Z`, `T04:30:00Z`) sau sed — 0 còn
  sót dạng cũ `01:30` (chỉ còn chuỗi lịch sử `brief dot 159`
  trong comment, đã sửa đúng).
- **F-156-T4-1 — ĐÃ VÁ + THEO BẢN LÀM VIỆC SANG ĐỢT 159,
  CHƯA STAGE.** Mẫu `round158-*` trong t4-attempt-inner.sh đã
  đổi thành `round159-*` trong bản làm việc (kiểm bằng grep +
  diff với bản 158: chỉ khác W path + 2 dòng nhãn). Theo mẫu
  149–158 inner KHÔNG stage vào repo nên fix này vẫn chỉ ở
  bản làm việc — sẽ theo sang đợt 160.
- **F-151-T5-3 — VẪN CHƯA kiểm chứng live đường elif/else.**
  Cờ T5-159 cho boot mới xuất hiện dạng PASS (đủ boot_id);
  trên boot mới chỉ gặp cờ cũ "cu(mtime-cu)". Sửa từ đợt 152
  vẫn đứng; chờ lượt sau có cờ chính non-PASS. Không đánh
  ĐÓNG vội.
- **F-148-T4-1 — ĐÃ ÁP DỤNG đợt này.** p1p3p7 chạy TAY sau
  poller, exit 0, output lưu
  `analyze-t4-p1p3p7-attempt1-eec65561.txt` (xem §6; kèm
  F-159-T4-1 về đối số). Nợ đứng ở mức cơ chế (script chưa tự
  gọi p1p3p7) vẫn còn — mỗi đợt có attempt hợp lệ T4 phải
  chạy tay và ghi rõ.

## 6. P3' cộng dồn (MỚI — 24 lượt hợp lệ) + ghi chú DEF/GAP

- **P3' cộng dồn sau đợt 159 (MỚI): P1 91/92, P2 83/83,
  P3-A1 77/92, P3' 56/64 occurrence = 56/59 distinct-seq, P7
  58/58** (24 lượt hợp lệ). Cơ sở: cộng dồn chỉ tính trên các
  lượt yên HỢP LỆ (LIMITS 158 §6: "23 lượt hợp lệ" — nay 24).
- **Đóng góp lượt #28 (attempt1-eec65561, occurrence — theo
  mẫu đợt 151 §4, đếm theo occurrence, seq lặp tính 2 lần):**
  (c2)=5 occurrence / 5 distinct-seq [253, 279, 435, 458, 483].
  - **P1 ĐÚNG — 5/5 occ** (distinct 5/5 gần run-end:
    run_end seqs [154, 178, 207, 231, 253, 278, 303, 326, 351,
    377, 405, 434, 458, 483]; baseline 42/367, p=1,96298e-05
    trên distinct 5/5). Cộng dồn 86/87 → **91/92**.
  - **P2 ĐÚNG — 5/5 occ** lag ≥+1f, 0 lag âm (lag từng
    tuple: 1, 1, 1, 1, 1 — tất cả +1f). Cộng dồn 78/78 →
    **83/83**.
  - **P3-A1 ĐÚNG — 5/5 occ** (distinct 5/5: 253, 279, 435,
    458, 483 đóng băng-tại-tick; baseline 78/366,
    p=0,00043961 trên distinct 5/5). Cộng dồn 72/87 →
    **77/92**. (Đợt 157 P3-A1 SAI 4/11 — đợt 158 ĐÚNG 7/7,
    đợt này ĐÚNG 5/5, chuỗi ĐÚNG nối dài.)
  - **P3' 5/5 occ ĐẠT** (distinct 5/5; DAT seq 253 stall 3,
    279 stall 5, 435 stall 6, 458 stall 3, 483 stall 3).
    Cộng dồn 51/59 → **56/64 occurrence**; distinct 51/54 →
    **56/59** (5 seq đều mới — xem kiểm chứng dưới).
  - **P7 ĐÚNG — 0 entry trễ ≥+1f** (c2 drawSrc delta
    {-1: 30, 0: 25}; đối chứng toàn bộ drawSrc post: {-1: 309,
    0: 143}, 0/452 entry). Cộng dồn 57/57 → **58/58**.
- **Kiểm chứng 5 seq "đã thấy" (F-159-T4-4):** grep toàn bộ
  LIMITS T4 cũ cho thấy **không seq nào trong 5 seq từng
  xuất hiện trong dòng (c2) của attempt hợp lệ nào**. Seq 279
  chỉ từng xuất hiện trong dải event lag≥+5f 276–279 (đợt
  126–130, frame 27) — đó là event (b), KHÔNG phải (c2), nên
  chưa từng được đếm vào cộng dồn. 4 seq còn lại (253, 435,
  458, 483) chỉ xuất hiện lẻ tẻ dưới dạng số khác (RAM MB,
  tickCost n, số pass) — không phải seq (c2). → 5/5 seq mới,
  helper in 56/59 là đúng, không cần hiệu chỉnh.
- **Điều tra (c2) VẪN ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ
  MẠNH" đứng nguyên** — không có điều kiện nào trong ba điều
  kiện mở lại (§13 DEF v0.5) xảy ra: (1) P1 ĐÚNG; (2) lag âm
  — KHÔNG (0); (3) +2f ≥3 — KHÔNG (tất cả lag đều +1f).
  lag≥+5f = 0 occurrence — lượt sạch thứ hai liên tiếp về lag.
- Chuỗi median tickCost 24 lượt: 49,5 / 40,0 / 52,0 / 47,5 /
  44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 / 58,0 / 59,0 /
  41,0 / 47,0 / 49,0 / 55,0 / 58,0 / 60,0 / 39,0 / 60,0 /
  40,0 / 41,0 / 41,0 / **44,5 ms** (trung bình ~48,1 ms; min
  39,0, max 60,0; 0 lượt vượt ngưỡng 60). Lượt này 44,5 ms —
  thấp thứ 8 trong chuỗi.
- Cơ chế "catch-up lag sau đóng băng" ĐÃ GHI vào DEF_v0.5 §6.4 +
  GAP §82 đợt 154 — đợt này không ghi lại.

## 7. Chờ quyết parent / nợ đợt 160

- **(a) #28 CÓ lượt hợp lệ — lượt hợp lệ #24 (chuỗi lượt yên
  hợp lệ NỐI DÀI #22 → #23 → #24).** Từ phía T4, **chân lượt
  yên cho chuỗi FULL PASS (O8) ĐÃ ĐẠT** — lượt yên #28 thuộc
  boot eec65561 (#59). O8 chạy trên boot nào, có qua gate
  chuẩn hay phải dùng thủ tục (i), là do T8/T10 quyết theo
  tiền lệ (quyết (h) đợt 157: chuỗi được tính khi O8 chạy sau
  lượt yên về thời gian, dù reboot xen giữa đổi boot). T4 chỉ
  ghi dữ kiện, không tự kết luận chuỗi FULL PASS.
- **(b) P3' cộng dồn MỚI 56/64 = 56/59 (xem §6 + F-159-T4-4):**
  helper in 56/59 — T4 đã kiểm tay bằng grep từng seq trên
  LIMITS cũ (seq 279 chỉ có trong event lag5 đợt 126–130 nên
  chưa được đếm). T10 kiểm lại phép cộng khi viết aggregate
  (§12): P1 91/92, P2 83/83, P3-A1 77/92, P3' 56/64 = 56/59,
  P7 58/58.
- **(c) PAGE-WEDGED KHÔNG tái diễn lần thứ ba liên tiếp (0
  wedge đợt 157 + 0 wedge đợt 158 + 0 wedge đợt này).** Chữ ký
  đợt 156 (2 wedge liên tiếp, fetch writePartial timeout 30 s)
  không xuất hiện — attempt1 chạy đủ 20/20 sạch. T4-160 tiếp
  tục theo dõi, ghi nhận nếu tái diễn; chưa mở điều tra riêng
  (quyết (j) đợt 156 giữ nguyên). Câu hỏi đợt 156 §7(c)
  (wedge có tính là "kẹt" cho chuỗi "P3 không kẹt" của T8
  không) VẪN MỞ — đợt này không có wedge mới nên không thêm
  dữ kiện.
- **(d) PRE-FLIGHT CHECK (quyết (t) đợt 158) ĐÃ ÁP DỤNG
  THÀNH CÔNG — giữ làm quy tắc đứng.** Pre-flight PASS toàn
  bộ, F-158-T4-1/2 không lặp lại, attempt1 ĐẠT NGAY, ngân
  sách chỉ dùng 1/3 (đợt 158 đốt 2/3 vì thiếu b.json). T4-160
  chạy pre-flight y hệt trước mọi attempt (checklist §0b).
- **(e) RAM TRONG ATTEMPT1 GIẢM NHẸ 1269 → 1172 MB
  mean/pass (sampler n=103: min 1064, max 1624, 0/103 mẫu
  <1024):** balloon ghim nhẹ trong lúc đo — nhẹ hơn hẳn đợt
  158 (837 → 657 MB, 75/101 mẫu <1024). B5 vẫn ĐẠT (min
  ≥500 MB) nên không ảnh hưởng verdict, nhưng T9 đối chiếu
  với sampler balloon của mình. Nếu balloon ghim sâu hơn ở
  lượt sau, gate A lúc poll có thể khó mở hơn — ghi nhận,
  không tự kết luận.
- **(f) F-159-T4-3 (ps-before có process lạ của luồng khác):**
  pid 34972 `node test_v19_pixelate_probe.js` có mặt lúc
  attempt bắt đầu, hết trước khi attempt kết thúc; load1 max
  1,04 → không bằng chứng gây tải. T10 ghi nhận khi xét
  chuỗi FULL PASS; T4 không tự đổi luật B2.
- **(g) ĐIỂM MÙ LIVE-DIAG F-158-T8-4 (quyết (u) đợt 158) —
  GIỚI HẠN ĐỨNG, CHƯA BỔ SUNG KIỂM "NỘI DUNG TƯƠI".**
  HB128 heartbeat làm tươi log mtime nên live-diag dựa trên
  mtime có thể mù (live-diag 0/2 ở 85m4). Đợt này **không có
  kẹt nào** (0 wedge, probe chạy sạch 20/20) nên live-diag
  không được thử thách — không có dữ kiện mới về việc nó bắt
  được hay không bắt được kẹt. Ghi nhận làm giới hạn đứng;
  không bổ sung kiểm "nội dung tươi" theo quyết (u).
- **(h) F-159-T4-4 (helper distinct-seq chưa trừ seq cũ tự
  động):** có nên vá helper đọc sổ distinct-seq cộng dồn
  (hoặc grep LIMITS cũ tự động) để T4-160 không phải kiểm tay
  không? T4 không tự đổi — chờ T10/parent phán (nợ từ
  F-157-T4-5).
- **(i) Các nợ đứng khác giữ nguyên từ đợt 158 §7:** G1 chờ
  user, R9 (16), ci-security.yml 403, file oversize 6,4 MB,
  TTS 39 cấm kiểm lại; mù #77?/#88?/#91? giao T2 (mù #88? MỞ,
  #91? (#59) giao T2-159); birefnet 0 thử (lần thứ 13 liên
  tiếp — đợt này không thử); u2net là fallback chính thức;
  run 158 kết cục thuộc T7-159; reboot #59 (ứng viên, boot
  eec65561) đã xác nhận quyết (s) đợt 157; POSTBOOT_PASS #59
  ĐÃ CÓ (T5-159, 02:41:22Z — xem §3).
- **(j) Đối chiếu waiter/O8 (T8):** T4 gate mở 02:46:27Z
  (poll #5); attempt1 ĐẠT → **GATE cho chuỗi FULL PASS ĐẠT
  từ phía T4** (có lượt yên hợp lệ #28 trên boot eec65561).
  T8 tự quyết thủ tục (i) sau waiter hết hạn / boot mới; T4
  chỉ ghi dữ kiện, không tự kết luận chuỗi FULL PASS.

## A. Phụ lục số liệu (script trích từ log gốc — stats-159.py)
```
== PHU LUC A — thong ke poll trich tu log goc (script stats-159.py) ==
-- instance 1-test(POLL_TEST=1): 1 poll, 2026-11-21T02:43:10Z - 2026-11-21T02:43:10Z, boot=eec65561
   RAM min=1837 max=1837 >=1024: 1/1 500-1023: 0/1 <500: 0/1
   load1<2: 0/1 load5<2: 0/1 blockers>0: 0 apt>0: 0
   gate0: T5=1
   lock: khong=1
   dpkg 1545->1545
   chuoi RAM<500 dai nhat: 0 poll
-- instance 2: 5 poll, 2026-11-21T02:43:26Z - 2026-11-21T02:46:27Z, boot=eec65561
   RAM min=1584 max=2166 >=1024: 5/5 500-1023: 0/5 <500: 0/5
   load1<2: 2/5 load5<2: 1/5 blockers>0: 0 apt>0: 0
   gate0: T5=5
   lock: khong=5
   dpkg 1545->1545
   chuoi RAM<500 dai nhat: 0 poll
-- TONG poll that: 6
-- RAM toan phien: min=1584 max=2166 >=1024: 6/6 <500: 0/6
-- poll load1<2 + load5<2 + RAM>=1024 dong thoi: 1/6
   gan-mo? #5 2026-11-21T02:46:27Z boot=eec65561 RAM=1584 L1=0.87 L5=1.96 blk=0 apt=0 gate0=T5(/home/hatch/workspace/goals/capcut-cl lock=khong t5=PASS
-- boot eec65561: 6 poll; RAM>=1024 lan cuoi: 2026-11-21T02:46:27Z #5; RAM<1024 lan dau: KHONG CO
-- cong don P3' (MOI, 24 luot hop le): P1 91/92 P2 83/83 P3-A1 77/92 P3' 56/64 occ = 56/59 distinct-seq P7 58/58
-- chuoi median 24 luot: n=24 mean=48,1 min=39,0 max=60,0 vuot-60: 0
```
