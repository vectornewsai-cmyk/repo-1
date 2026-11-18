# PHASE9_ROUND134_T1_VERIFY133_LIMITS — T1 kiểm chứng độc lập đợt 133

> Luồng T1, đợt 134, lượt cron 06:35 +07 18/11/2026 (mở lượt 23:35Z 17/11/2026).
> **VERDICT: PASS — xác nhận CHẤP NHẬN của T10 (đợt 133) đứng vững.**
> Mọi claim lớn của đợt 133 đều tái kiểm đúng bằng code/bằng chứng độc lập trên đĩa.
> Tìm được **2 sai số mới (F-134-T1-1 → F-134-T1-2), tất cả đều KHÔNG đổi verdict nào.**
> KHÔNG push. KHÔNG release/tag. Không code giả — mọi claim dưới đây đều có bằng chứng trên đĩa.

## 0. Phương pháp + phạm vi + môi trường kiểm

- **Đếm:** code riêng viết mới tại `hidden_files/round134-t1/count-final-134-t1.py`
  (không chạy verbatim script của T10-133, không dùng bất kỳ số nào của T10 làm đầu vào).
  Quét trực tiếp mọi file `phase9-round<N>-*.txt` trong
  `~/workspace/repo-1-push/paths-loop/` (111–133, gồm cả closing) trong MỘT lần quét,
  tách entry theo byte NUL, tính batch/entry/unique trực tiếp từ tập hợp (hợp toàn cục),
  đối chiếu chéo `u(111–133) == u(111–132) | u(133)` — KHÔNG cộng số round-unique vào
  lũy kế cũ (bài học đợt 126–127).
- **Claim từng luồng:** đọc trực tiếp log/script/dữ liệu gốc của luồng đó trong
  `hidden_files/round133-*/` + file LIMITS của luồng + `PHASE9_GAP_ANALYSIS.md` §62;
  không tin lời T10 mà không có vết trên đĩa. Chỗ nào chỉ kiểm lại được qua log
  (trạng thái đã trôi) thì ghi rõ, không tuyên bố kiểm lại được.
- **Tính lại độc lập thống kê ghost/(c2):** script riêng viết mới
  `hidden_files/round134-t1/verify-t3-recompute.py` (từ định nghĩa prereg, không copy
  code T3) chạy trên JSON gốc của T4 — tái tạo mọi số T3/T4/T5 (xem §3.2).
- **Widen A2:** chạy lại 8 ca kiểm chứng khô từ điều kiện C4 trong file watcher v6 thật
  trên đĩa (`hidden_files/round134-t1/verify-widen-a2.sh`) — xem §3.4.
- **Thời gian kiểm:** 23:35–23:58Z 17/11/2026. Boot hiện tại lúc kiểm: **d2e66749,
  btime 23:26:58Z 17/11/2026** — REBOOT MỚI xảy ra SAU khi đợt 133 đóng (boot cũ
  3e7a7b51 #83? đã chết). Mọi số đo trạng thái lúc đóng đợt 133 (suite/O8/lock/RAM)
  chỉ kiểm lại được qua log gốc, không đo lại trên boot mới.
- **Cây lúc mở đợt 134 (theo brief):** `preview.tsx 805409f0`, `media.ts 2c384ed1`,
  `vite.config.ts ee80d093`. Lúc T1-134 kiểm (23:47Z): `preview.tsx` đã là
  `530e10a7…` (mtime 23:47:42Z), `vcut-webkit-postboot-check.sh` đã là `512aed0e…`
  (mtime 23:47:08Z) — **thay đổi trong đợt 134 đang chạy** (T3-134 sửa instrumentation
  theo quyết parent §12.1(a) đã phê duyệt; T5-134 cập nhật postboot-check), KHÔNG phải
  thay đổi trong đợt 133. `media.ts` vẫn `2c384ed1…`, `vite.config.ts`
  (`apps/web/vite.config.ts`) vẫn `ee80d093…` — khớp cây đợt 133. Cây đợt 133 đã đóng
  băng (không đổi trong lúc T10 đóng) được kiểm qua log T10 + md5 các luồng, xem §3.1.

## 1. Đếm cuối đợt 133 + lũy kế — KHỚP HOÀN TOÀN

| Phạm vi | T10 công bố | T1-134 tái kiểm trực tiếp | Khớp |
|---|---|---|---|
| Đợt 133 (gồm closing) | 10 batch / 12 entry / 12 file duy nhất | **10 / 12 / 12** | ✅ |
| Lũy kế 111–132 (tái kiểm) | 218 / 539 / 473 (số công bố đợt 132) | **218 / 539 / 473** | ✅ |
| Lũy kế 111–133 (gồm closing) | 228 / 551 / 483 | **228 / 551 / 483** | ✅ |
| File mới-only đợt 133 | 10 | **10** | ✅ |
| File đợt 133 trùng 111–132 | 2 | **2** | ✅ |

Chi tiết đợt 133 (đếm trực tiếp từ đĩa, log đầy đủ tại
`round134-t1/count-final-134-t1.out`):

| File paths | Entry |
|---|---|
| phase9-round133-closing.txt | 2 (`docs/PHASE9_ROUND133_LIMITS.md`, `PHASE9_GAP_ANALYSIS.md`) |
| phase9-round133-t1-verify132.txt | 1 |
| phase9-round133-t2-eperm.txt | 1 |
| phase9-round133-t3-c2.txt | 1 |
| phase9-round133-t4-quiet10.txt | 1 |
| phase9-round133-t5-infra.txt | 2 (`apps/web/scripts/vcut-webkit-postboot-check.sh`, `docs/PHASE9_ROUND133_T5_INFRA_LIMITS.md`) |
| phase9-round133-t6-lockhealth.txt | 1 |
| phase9-round133-t7-scheduler.txt | 1 |
| phase9-round133-t8-viteharness.txt | 1 |
| phase9-round133-t9-headroom.txt | 1 |
| **Tổng** | **10 batch / 12 entry / 12 duy nhất** |

- 12 entry vs 12 duy nhất: không có file nào lặp trong đợt 133 (closing thêm LIMITS gộp
  mới + GAP đã có từ trước; T5 2 entry là 2 file khác nhau).
- 10 file mới-only: 9 LIMITS luồng (T1/T2/T3/T4/T5/T6/T7/T8/T9) + LIMITS gộp 133.
  2 file trùng 111–132: `PHASE9_GAP_ANALYSIS.md` + `apps/web/scripts/vcut-webkit-postboot-check.sh`.
- Đối chiếu: 473 + 10 = 483 ✅; `u(111–133) == u(111–132) | u(133)` ✅ (tính trực tiếp
  trong cùng một lần quét, không cộng số học lũy kế).
- **Mọi đường dẫn 111–133 đều tồn tại trên đĩa** (0 thiếu, kiểm trên toàn bộ 483 file
  duy nhất — không chỉ đợt 133).
- **Định dạng:** cả 10 file đợt 133 đều NUL-delimited thuần (0 ký tự newline, kết thúc
  bằng NUL — kiểm bằng `od -c` từng file).
- Đây là lần tái kiểm độc lập thứ chín liên tiếp khớp số công bố (111–132 = 218/539/473).
- File oversize: T2 LIMITS 53.711 B (vượt ngưỡng push-files 37.768 B — chỉ stage paths,
  không push; đúng luật). File oversize chưa lên từ trước vẫn còn: 1 file 6,4 MB
  `benchmarks/results/webkit-blob-flaky-96x3.json` (không nằm trong paths đợt 133).

## 2. LIMITS gộp đợt 133 — sha/size lúc đóng vs hiện tại

| | Lúc đóng (T10, 22:12Z) | Hiện tại (T1-134 đo 23:57Z) |
|---|---|---|
| Byte-size | 38.006 B | **40.897 B (+2.891 B)** |
| sha256 | `e9cf1773…90316e017` | `c1c8b836…e4201b54e08` |

- **Bản copy lúc đóng khớp đúng:** `round133-t10/PHASE9_ROUND133_LIMITS.closing-copy.md` =
  38.006 B, sha256 `e9cf1773a9dd1aa007ac6bcb0d7e00bb18730366cd76b72f66b8f7b90316e017` ✅
  (T1-134 đo trực tiếp) — bài học F-132-1 đã phát huy: nội dung trước §12.1 khôi phục
  được đầy đủ từ bản copy.
- **Diff copy-lúc-đóng → bản hiện tại: chỉ có 2 loại thay đổi, đều đã giải thích:**
  1. Dòng tiêu đề §12 sửa từ `## 12. Chờ quyết parent` thành
     `## 12. Chờ quyết parent (đã quyết ở §12.1 dưới)` (1 dòng).
  2. Thêm mới §12.1 QUYẾT PARENT (a)–(c) (pure append sau dòng 160). Không có dòng cũ
     nào khác bị sửa hay xóa. Không có footer mới thêm (footer "Batch stage / Tổng batch"
     đã có sẵn lúc đóng).
- **Không có thay đổi nào không giải thích được** sau khi đóng. File dài thêm là do quyết
  parent ghi vào, đúng như dự kiến (bài học F-132-1/F-132-2 + quy định AGENTS.md).
- **GAP không đổi sau khi đóng:** `PHASE9_GAP_ANALYSIS.md` hiện 317.907 B, §62 có mặt
  (cập nhật sau đợt 133) — đúng y số T10 ghi lúc đóng ✅.
- **Cờ `.done`:** đủ 10 file `round133-t1.done` … `round133-t10.done` (9 luồng T1–T9 +
  cờ đóng của T10) ✅.

## 3. Bảng đối chiếu từng claim lớn

### 3.1 Suite 27/27 + O8 21/21 (T10, trên boot mới 3e7a7b51)

| Claim | Bằng chứng độc lập | Kết quả |
|---|---|---|
| Suite cây gộp 27/27 exit 0, 0 rerun | `round133-t10-suites.log` (904 dòng): đúng **27 dòng `exit=0`** (tsc-web, tsc-desktop, vite-build, playheadHold90R2, playheadPacing54K9, previewEngine, seek, seekSkipRender86N3, previewLoop50F2, ghostBlend.probe, rvfcClipWindow102D3, driftConfirmSkip103E4, css60, css61, P7-esbuild, orphans, r6, U4, media-tests, media-retry96X3, media-watchdog96X3, deint-verdict, deint-verdict-100b7, armHeld99a3, vite-diagnosis-regex, xvfb-lock, test-preview-engine.sh), **0 lần nhắc "rerun"**, `preview-engine: 354 assertions pass`; bắt đầu 21:57:12Z, `ALL DONE 22:02:06Z`, boot 3e7a7b51, RAMavail 606 MB lúc bắt đầu (đều trong header log) | ✅ |
| O8 Chromium 21/21 exit 0 | `t10-o8.log`: `KẾT QUẢ CLICK-TEST O8: 21/21 pass, 0 fail, 0 note` | ✅ |
| O8 WebKit 21/21 exit 0 | `t10-o8.log`: `KẾT QUẢ CLICK-TEST O8 WebKit: 21/21 pass, 0 fail, 0 note`; tổng **42 dòng PASS** (21+21), 2 dòng chứa "fail" đều là `0 fail` | ✅ |
| WebKit FULL PASS lần thứ mười một liên tiếp (đợt 123–133) | Đọc 11 file `round12{3..9,3{0,1,2,3}}-t10/t10-o8.log`: **cả 11 đều `WebKit: 21/21 pass`** | ✅ |
| O8 giữ lock 120 s (22:02:37–22:04:37Z, wait 0 s) | `t10-o8-lock.log`: `ĐÃ GIỮ … chờ 0s` + `ĐÃ NHẢ … giữ 120s` 22:04:37Z | ✅ |
| Cây không đổi trong lúc đóng | Suite log header + O8 log header đều `preview.tsx 805409f0…`; mtime preview.tsx lúc đó trước lúc đóng (file đã đổi sau đó trong đợt 134 — xem §0, không thuộc đợt 133) | ✅ (log-only cho mtime lúc đóng) |
| Không reboot trong lúc đóng | Suite + O8 log đều boot 3e7a7b51, 21:52–22:12Z; btime hiện tại đã là boot mới d2e66749 (23:26:58Z) — reboot xảy ra SAU khi đóng | ✅ (log-only) |
| Lock trống lúc đóng (0 ticket + 78 cooldown) | Chỉ kiểm lại được một phần qua log — trạng thái đã trôi (xem §6). T6 ghi 77 file / 1078 B lúc 21:43Z; T10 ghi 78 / 1092 B lúc đóng — chênh +1 cooldown đúng bằng chu kỳ O8 của T10 | ⚠️ log-only |

### 3.2 Lượt yên WebKit #10 + mô hình ghost-freeze/skew (T4/T3/T5)

T1-134 tính lại HOÀN TOÀN từ JSON gốc bằng script riêng (`verify-t3-recompute.py`,
không copy code T3), đối chiếu với T3/T4/T5:

| Số liệu | T3/T4/T5 công bố | T1-134 tính lại từ JSON gốc | Khớp |
|---|---|---|---|
| JSON attempt1: size / sha256 | 3.274.496 B / `e3ca1ac5…423133` | **3.274.496 B / `e3ca1ac5dd79be72014a88268fe5abec1703f585b25a64473ad434c245423133`** | ✅ |
| passes / flip | 20 / afterPass=5, wallMs=26187 | **20 / afterPass=5, wallMs=26187** | ✅ |
| tickCost total median (n=650) | 39,5 ms | **39,5 ms** (mean 45,0; min 28; max 107) | ✅ |
| tickCost post flip+2000ms (n=471) | 39,0 ms | **39,0 ms** | ✅ |
| nTicks post / nGhost / nomatch | 376 / 752 / 0 | **376 / 752 / 0** | ✅ |
| Histogram bin0 / +1/+2 / +3 | 34,4% / 52,3% / 3,1% | **34,4% / 52,3% / 3,1%** (hist đầy đủ `{-9: 2, -3: 4, -1: 69, 0: 259, 1: 203, 2: 190, 3: 23, 4: 2}` khớp từng bin) | ✅ |
| (c2) skp=0 | 5: seq 166/218/293/323/394, đều lag +1f | **5, đúng 5 seq, đều (presented, label, lag) = (22,21,+1), (24,23,+1), (13,12,+1), (22,21,+1), (16,15,+1)** | ✅ |
| (c2) skp=1 / lag ≥+5f / lag âm | 0 / 0 / 0 | **0 / 0 / 0** | ✅ |
| curPix run ≥3 tick | 12 run, cùng danh sách | **12 run, cùng danh sách từng run** | ✅ |
| snap−label / raw−label median | 35 / 8 ms | **35 / 8 ms** | ✅ |
| label−floor +1 | 76,5% (575/752) | **76,5% ({0: 177, 1: 575})** | ✅ |
| P1: k=5/5, baseline, p | 5/5, 36/376=0,096, p=8,0×10⁻⁶ | **5/5, 36/376=0,0957, p=8,046×10⁻⁶** | ✅ |
| P3: frozen 5/5, baseline, p | 5/5, 76/375=0,203, p=3,4×10⁻⁴ | **5/5, 76/375=0,2027, p=3,419×10⁻⁴** | ✅ |
| P5 | 2/4 (snap ✓, raw ✓; label-floor 76,5% vượt 76%; run 12 thiếu 1) | **2/4, đúng cả 4 số** | ✅ |
| P7 log draw phủ (c2) | 0/5; log 9854→16068, flip 26187, gap 10.119 ms | **0/5; n=137, loops chỉ {1, 2}, wallMs cuối 16068, gap 10.119 ms** | ✅ |
| Prereg T3 đăng ký 17:45Z | 17:45Z (+A1 17:50Z) | **`round132-t3/prereg-t3.md` dòng 4: "Đăng ký lúc 17:45Z"** ✅ | ✅ (xem F-134-T1-1 về chữ 17:46Z trong LIMITS T4) |

- **T5 pha 2 khớp 100%:** `t5-labellag-rerun.txt` cho (c2) đúng 5 seq; `t5-histogram-rerun.txt`
  cho histogram/snap/raw/label-floor/run giống hệt; `t5-c2-drawlog-analysis.txt` cho 0/5
  phủ với cùng 5 delta (−15.060…−44.224 ms); T5 LIMITS ghi P1/P3 với baseline 36/376,
  76/375 và p ≈ 8,2×10⁻⁶ / 3,4×10⁻⁴ — khớp T3 trong sai số làm tròn. Ba bên T3/T4/T5
  không có số nào lệch.
- **Attempt 20/20 pass:** `run-webkit-t4-attempt1.log` dòng 90: `partial JSON đã ghi: 20/20 pass`
  (tickCost n=649 lúc ghi partial, n=650 trong JSON cuối — khớp: 1 tickCost ghi sau dòng log
  đó; không phải mâu thuẫn).
- **Lớp B 5/5:** `classb-t4-attempt1.txt` — load5 cuối 0,85; load1 max 1,48; RAM min 636 MB
  (0 mẫu <500 MB); không reboot (boot trước/sau 19:34:15Z); apt/dpkg 0. T1-134 đối chiếu
  file, các số nội bộ nhất quán. (Xem F-133-8 về RAM min 636 vs 622 của T5.)
- **Gate A poll #3:** `poll-t4.log` — 3 poll: RAM 1549 → 1398 → **1168 MB** (20:50:45Z),
  `t5flag` chua-co → chua-co → **PASS**; cửa mở đúng poll #3. Dòng kết của poll log ghi
  timestamp stale 20:50:45Z thay vì ~20:54:34Z — T4 đã tự ghi nhận là lỗi cosmetic trong
  LIMITS §7.2 (không phải sai số mới).
- **9 lượt yên hợp lệ:** 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 ms;
  trung bình T1-134 tính lại = **46,94 ms** (công bố 46,9 ms) ✅; 39,5 ms thấp nhất ✅;
  biên ngưỡng 60 − 39,5 = 20,5 ms ✅.
- **F6' ĐÓNG tái xác nhận:** T4 LIMITS §3 + `analyze-t4-attempt1-lag5.txt`/`skiplatest` —
  62/62 nhãn + 62/62 pixel-verified, lag5 0. T1-134 đối chiếu file phân tích của T4
  (không tính lại pixel từ đầu — dữ liệu gốc là JSON đã kiểm ở trên).

### 3.3 Probe #52 / mù #52 / gap mới / mù #51 B (T2)

| Claim | Bằng chứng độc lập | Kết quả |
|---|---|---|
| Probe #52 ok=2 fail=0 (20:42:56Z, boot 07da9c50) | `round133-t2/once.txt`: `probe#52 boot=07da9c50 ok=2 fail=0`, heartbeat n=52 ts 20:42:56Z; `status2.txt` ALIVE | ✅ |
| Mù #52 ĐÓNG HOÀN TOÀN — A đóng (merged 162 mốc, lỗ lớn nhất 419 s, đuôi 15 s) | `blind52-merged.log`: `seg A MERGED: marks=162 largest_gap=419s (18:48:31 → 18:55:30) floor(419/1147)=0`, first 17:47:00, last 19:34:00, tail=15s | ✅ |
| Mù #52 — B đóng (merged 113 mốc, lỗ lớn nhất 469 s, đuôi 3 s) | `blind52-merged.log`: `seg B MERGED: marks=113 largest_gap=469s (20:00:40 → 20:08:29) floor=0`, tail=3s; đồng thời uptime trực tiếp (B first mark 19:34:46Z = +31 s sau btime) | ✅ |
| Hai cây riêng cho lỗ đuôi A 2.934 s là artifact mtime ghi-đè-cuối | `blind52-investigate.log`: `seg A: marks=150 largest_mtime_gap=2934s (18:45:21 → 19:34:15)`; merged (thêm session ngoài cây) lấp đầy → 419 s. Lần đầu merged đảo verdict hai cây — đúng như T2 mô tả | ✅ |
| Gap #81?→#82? = [7.797, 7.817] s CHỨNG NHẬN DẠNG KHOẢNG, CERT n=46 / FULL n=61 | `blind52-gaps.txt` dòng 364: `gap #81?->#82? = INTERVAL [2h09'57", 2h10'17"] mid 2h10'07" CERTIFIED`; `CERT46: n=46 …`, `FULL61: n=61 …` + sensitivity LO/HI; btime 19:34:15Z − 17:24:08Z = **7.807 s** (T1-134 tính lại) = mid ✅ | ✅ |
| #82? trong dải cơ học lần thứ 12 liên tiếp | `blind52-gaps.txt`: `#82? mechanical range … [17:57:00Z, 19:54:40Z] — actual 19:34:15Z, INSIDE (12th consecutive)` | ✅ |
| Mù #51 B kiểm lại lần thứ 3: KHÔNG ĐỔI (lỗ lớn nhất 4.393 s, tối đa 3 ẩn) | `blind51-recheck3.log`: `seg B MERGED: marks=122 largest_gap=4393s (16:10:55 → 17:24:08) floor(4393/1147)=3` — LIMITS T2 §2.6 viết 4.393 s ✅ | ✅ (xem F-133-2: log investigate vẫn ghi 4392 s) |
| Mù #49 B: KHÔNG kiểm lại đợt này | Đúng quyết parent 132 §12.3(d); không có file recheck mới cho mù #49 trong `round133-t2/` | ✅ |
| EPERM 0 sóng thật; WFS lần 39 chênh 0 | `eperm-sweep-run.log` + `scan-wfs-run.log` trong `round133-t2/` (T1-134 kiểm sự tồn tại + khớp số T2 ghi: 887/247, R7b 912/264, copies 25/17 — xem chi tiết trong LIMITS T2 §2.7) | ✅ |
| RAM max trong mù 3.111 MB (50,7% guard); birefnet KHÔNG chạy | `ram-max.txt` (T2 LIMITS §2.5); 3.111/6.144 = 50,6% ≈ 50,7% làm tròn ✅ | ✅ |
| Khung chết #81?: ghi cả hai — (19:33:56Z, 19:34:15Z] (19 s) và (19:34:00Z, 19:34:15Z] (15 s) | T2 LIMITS §2.2/§4 mục 4 ghi cả hai, "khung hẹp nhất làm chuẩn" — nhưng §0 dòng 80 viết ngược lại (xem F-133-7) | ⚠️ xem F-133-7 |

### 3.4 T5 — widen trigger §8.2(B) v6 (A2) + postboot PASS + pha 2

| Claim | Bằng chứng độc lập | Kết quả |
|---|---|---|
| Widen v6 (A2) XONG, kiểm chứng khô 8/8 | T1-134 chạy lại 8 ca từ điều kiện C4 trong file watcher v6 thật (`t5-wait-replay-b84.sh` dòng 109–117): **8/8 OK** (`verify-widen-a2.sh` + `.out` tại `round134-t1/`). Lưu ý: harness gốc của T5 đặt trong `/tmp/t5v6-test/` — đã mất sau reboot (tmpfs); chỉ còn bảng 8 ca trong LIMITS (xem F-134-T1-2) | ✅ (nội dung) / ⚠️ (hồ sơ) |
| v5 không bắt được hình dạng b379ecd7 | `round132-t5/t5-wait-replay-b81.sh`: 0 lần nhắc `MISS_TARGET`/`FORM=A2` | ✅ |
| Watcher md5 v5 → v6 | `watcher.md5.before` = `6a04a3647e3957d644530f90de7f7af5`; `watcher.md5.after` = `1946b2d05e2e70e468f071171d272c59` — khớp LIMITS T5 §5.3 | ✅ |
| postboot-check.sh sửa 1 lần (header + dòng `say`), md5 0d412c35… → 55f6b3df… | `postboot-check.md5.before` = `0d412c35…`; `.after` = `55f6b3df…` — khớp LIMITS T5 | ✅ |
| POSTBOOT_PASS boot 07da9c50, cờ 20:50:22Z | File `round133-t5/POSTBOOT_PASS`: `boot_id=07da9c50-… btime=2026-11-17T19:34:15Z pass_at=2026-11-17T20:50:22Z poll=2` (122 B) | ✅ |
| Postboot poll2 PASS (GST đủ, apt đủ 11 package) | `t5-postboot-b84-poll2.log`: `PASS GST: đủ isomp4 + libav`, `PASS apt: đủ 11 package`, `KET LUAN: DU DIEU KIEN chay WebKit` | ✅ |
| Nhánh A2 chưa kích hoạt live | Không có dòng TRIGGER=YES nào cho A2 trong log watcher đợt 133 (postboot boot 07da9c50 PASS, không thiếu gói) — đúng như T5 ghi | ✅ |
| Pha 2 (c2) khớp T3 | Xem §3.2 (labellag rerun + histogram rerun + drawlog analysis) | ✅ |
| Headroom T5 2625 → 2623 (thấp hơn T9 7–9, khác thời điểm) | `headroom-open.txt` / `headroom-end.txt` trong `round133-t5/`; không mâu thuẫn với T9 (xem §3.7) | ✅ |

### 3.5 T6 — lock KHỎE + prune lần 8 xóa 0 + chuỗi boot #57→#83

| Claim | Bằng chứng độc lập | Kết quả |
|---|---|---|
| Lock KHỎE: 864 dòng / 250 cặp lúc T6 đóng 21:43Z | `round133-t6/vite-lock-v2-cleaned-864.log`: 864 dòng; file phân tích của T6 `analyze-log-cleaned-close.txt` dòng 4: `TOTAL: ACQUIRED=255, COOLDOWN=80, RELEASED=250, STALE-LOCK=6, STALE-TICKET=1, TICKET=264, TIMEOUT=8, total=864` (255+80+250+6+1+264+8 = 864 ✅); 250/250 cặp, 0 đang giữ, 0 mất dấu | ✅ |
| T10 recount lúc đóng: 867 dòng (251/251 cặp) — khớp T6 | Số học: 864 + 3 dòng chu kỳ O8 của T10 (TICKET+ACQUIRED+RELEASED, hold 120 s — xem §3.1) = 867 ✅; ACQUIRED − RELEASED = 5 (255−250) đúng bằng 5 ca double-acquire đã biết | ✅ |
| Recount 856 dòng lúc repro của T6 | Số học: 847 (snapshot T6-132) + 6 dòng repro lỗi + 3 dòng chu kỳ t10-round132 = 856 ✅ (khớp T10 §10.3) | ✅ |
| Prune lần 8: xóa 0 file; queue 77 file / 1078 B lúc đóng | `prune-deleted.txt` + `cooldown-now.txt` trong `round133-t6/`; T10 ghi 78 file / 1092 B lúc đóng (+1 cooldown-t10-round133) — nhất quán | ✅ (log-only cho số lúc đóng) |
| Chuỗi boot tương đối #57→#83; gap #81?→#82? CERTIFIED [2h09'57", 2h10'17"] | T6 LIMITS §8.3/§8.4 + bảng boot: #82 07da9c50 19:34:15Z, #83 3e7a7b51 21:41:40Z; gap #82?→#83? = 7.645 s (T1-134 tính lại: 21:41:40 − 19:34:15 = 7.645 s ✅) SPAN | ✅ |
| Reboot #82?→#83? giết sleep chờ T6 (SIGTERM), không luồng nào mất việc | T6 LIMITS §8.4: boot mới `3e7a7b51…`, btime 21:41:40Z (`uptime -s` + `who -b`); 8/9 cờ `.done` đã có trước 21:41:40Z (muộn nhất T8 21:27Z) — khớp LIMITS gộp §1 | ✅ |
| Khung chết #82? hai bản ghi | (a) (21:28:35Z, 21:41:40Z]: mốc 21:28:35Z nay chỉ còn trong hồ sơ T6 (mtime `build-loop-log.md` đã trôi sang 21:52:26Z+ do parent ghi thêm — T10 đã ghi caveat rõ). (b) (21:29:47Z, 21:41:40Z]: **T1-134 kiểm lại trực tiếp — thư mục `workspace/agents/9e39f4db-…/exec-logs` mtime vẫn Nov 17 21:29, TRỐNG (total 0)** ✅ — bản ghi hẹp còn đo được trên đĩa, không quy trách nhiệm được (không còn file nào trong đó) | ✅ |

### 3.6 T7 — cửa SẠCH, 0 slot thiếu mới; started_at +7.135 s lần thứ 3

| Claim | Bằng chứng | Kết quả |
|---|---|---|
| HB 42/184, DR 47/163 (0 slot thiếu mới) | Số học lũy kế: HB 42/178 + 6 mẫu mới = 42/184 ✅; DR 47/160 + 3 mẫu mới = 47/163 ✅; tỉ lệ 42/184 = 22,8%, 47/163 = 28,8% ✅ (T7 LIMITS §1/§3) | ✅ |
| Dị thường started_at +7.135 s (lần thứ 3 liên tiếp, lớn nhất) | T7 LIMITS §2: lượt đợt 132 ghi `started_at_utc` 19:34:46Z, chênh +7.135 s so với giờ hẹn 17:35:51Z; chuỗi đợt 130 +5.251 s → 131 +1.585 s → 132 +7.135 s; `started_at` ghi 31 s sau btime boot mới 19:34:15Z | ✅ (ghi nhận mốc; nguyên nhân vẫn mở) |
| Đợt 133 running, started đúng giờ 20:35:51Z, jitter 0 s | T7 LIMITS §1; T1-134 không đo lại trạng thái scheduler (đã trôi) | ⚠️ log-only |

### 3.7 T8 — vite harness 3/3 exit 0; T9 — headroom 2.632

| Claim | Bằng chứng | Kết quả |
|---|---|---|
| T8: 84l10 / 85m4 / 86n2 đều exit 0 (21:15:30–21:23:09Z) | `round133-t8/smoke/run-webkit-*.log`: `--- 84l10 exit=0 end 21:16:38Z ---`, `--- 85m4 exit=0 end 21:19:03Z ---`, `--- 86n2 exit=0 end 21:23:09Z ---` | ✅ |
| T8: gate mở 21:10:33Z (waiter poll 28, sau 27 poll NOT-YET) | `round133-t8/smoke/wait-t4-t5.log`: **27 dòng NOT-YET + 1 dòng `GATE-FOUND poll=28 21:10:33Z`** | ✅ |
| T8: fixture rebuild 6/6 md5 khớp đợt 125–132 | `mirror-verify133.py` + `rebuild-fixtures-133t8.sh` trong `round133-t8/` (T1-134 kiểm sự tồn tại; không chạy lại rebuild) | ✅ (log-only cho kết quả rebuild) |
| T9: headroom 2.632 (2 lần đo cùng số, chênh 0) | T9 LIMITS §1: 2.632 lúc 20:40:32Z + 20:42:53Z; số học 63.747 − 2.632 = **61.115** watch ngoài cell ✅; 2.738 − 2.632 = 106 (−3,9%) ✅; chuỗi dài hạn 4.438 → 2.632 = −40,7% ✅ | ✅ |
| T9: RAM 433–512 MB; balloon đứng yên 6.443.824 kB | T9 LIMITS §1–§2 (số đo tại thời điểm đo; T1-134 không đo lại — trạng thái đã trôi) | ⚠️ log-only |
| T5 (2625→2623) vs T9 (2.632): khác thời điểm, không mâu thuẫn | T5 đo 20:48Z/21:04Z (sau T9, sau khi các luồng khác mở watch) — thấp hơn 7–9 là hợp lý | ✅ |

### 3.8 Đối chiếu chéo giữa các LIMITS luồng (nhiệm vụ 4)

- **T2 vs T6 về gap/khung chết:** T2 [7.797, 7.817] s = T6 [2h09'57", 2h10'17"] ✅;
  khung chết #81? cả hai bên ghi 19 s (19:33:56Z) + 15 s (19:34:00Z) ✅ (chỉ khác câu chữ
  chuẩn — xem F-133-7); khung chết #82? cả hai bên ghi cả hai bản (21:28:35Z + 21:29:47Z) ✅.
- **T3 vs T5 về (c2)/P1–P7:** mọi số khớp 100% (xem §3.2) ✅; T5 pha 2 dùng code T3 cho
  histogram nhưng chạy lại labellag bằng code riêng — hai codebase khác nhau cho cùng kết quả.
- **T4 vs T5 vs T8 về cờ gate theo từng giây:** cờ T5 `POSTBOOT_PASS` 20:50:22Z →
  gate A T4 mở poll #3 **20:50:45Z** (RAM 1168 MB, `t5flag=PASS` trong `poll-t4.log`) →
  T8 gate mở **21:10:33Z** (waiter poll 28, sau cờ `round133-t4.done`) — ba mốc khớp nhau
  từng giây giữa ba LIMITS + log lock (ACQUIRED t4 20:50:45Z trong log lock; ACQUIRED t8
  21:15:33Z) ✅.
- **T7 vs T6 về started_at +7.135 s:** T7 ghi nhận mốc (lần thứ 3); T6 không kết luận
  nguyên nhân — không mâu thuẫn, vẫn mở ✅.
- **T4 vs T5 về RAM min giữa lượt yên:** T4 sampler 636 MB vs T5 622 MB lúc 20:52:07Z —
  chênh 14 MB, cùng cửa sổ (xem F-133-8) ⚠️.
- **T2 vs T4/T5/T5b/T8 về khung chết #81?:** bốn nguồn + đĩa cho (19:33:56Z, 19:34:15Z];
  session T2 thu hẹp (19:34:00Z, 19:34:15Z] — nhất quán, chỉ khác câu chữ chuẩn (F-133-7).

## 4. Trạng thái 8 sai số F-133-1→F-133-8

| Sai số | Nội dung | Trạng thái sau kiểm lại đợt 133 |
|---|---|---|
| F-133-1 | Brief nói RAM gate A đợt 132 "420–552 MB", đo trực tiếp 427–552 MB | **ĐÃ SỬA ĐÚNG** — LIMITS gộp §10.3 dùng 427–552 MB; T1-134 xác nhận số 427/552 từ `poll-t4.log` đợt 132 (đã kiểm ở đợt 133, xem LIMITS T1-133 §4) |
| F-133-2 | Lỗ đuôi B mù #51: 4.392 s vs 4.393 s — cần ghi rõ quy ước biên | **SỬA MỘT NỬA, VẪN MỞ** — T2-133 LIMITS §2.6 nay viết **4.393 s** (đúng phép trừ) và log merged `blind51-recheck3.log` cũng ghi 4393 s; NHƯNG log investigate hai cây (`blind51-recheck3-investigate.log`) vẫn ghi **4392 s** cho cùng cặp mốc (16:10:55 → 17:24:08) và **không nơi nào ghi quy ước biên** — hai script vẫn lệch 1 s trên cùng một cặp mốc mà không giải thích. Cần T2 đợt sau ghi rõ quy ước (vd floor float vs mốc giây) hoặc thống nhất một cách tính |
| F-133-3 | T8 viết "8 lần thử đều hết 10 phút" — thực ra 7 timeout + 1 lần bị reboot giết | **ĐÃ SỬA ĐÚNG / KHÔNG TÁI DIỄN** — LIMITS gộp §10.3 dùng "7 timeout + 1 lần bị reboot giết"; T8-133 chạy harness 3/3 (không còn cảnh timeout gate A), waiter đếm đúng 27 NOT-YET + GATE-FOUND poll 28 (T1-134 đếm trực tiếp) |
| F-133-4 | Brief nói prereg T3 "đăng ký 17:46Z", file ghi 17:45Z | **ĐÃ SỬA ĐÚNG trong LIMITS gộp** (dùng 17:45Z, §3 + §10.3) — nhưng xem F-134-T1-1: LIMITS T4-133 lại viết 17:46Z hai lần |
| F-133-5 | Nhãn "reboot lần thứ N" dùng hai định nghĩa chuỗi đếm | **ĐÃ CHỐT ĐỊNH NGHĨA (T10 §10.2) nhưng CHƯA ÁP DỤNG ĐỀU** — T10 chốt chuỗi gộp mọi reboot quanh đợt; T2-133 vẫn dùng chuỗi riêng của mình (xem F-133-6). Từ đợt 134 mọi luồng phải dùng MỘT định nghĩa duy nhất (§10.2) + ghi rõ định nghĩa khi dùng nhãn "lần thứ N" |
| F-133-6 | T2-133 §0 gọi reboot #81?→#82? là "lần thứ 7", trong khi chuỗi gộp đếm là sự kiện thứ 6 | **XÁC NHẬN CÒN ĐÚNG NHƯ T10 GHI — CHƯA SỬA** — T2 LIMITS dòng 113: "Reboot #81?→#82? là reboot giữa lượt lần thứ 7 liên tiếp (chuỗi T2-132 §2.2: #79?→#80? giữa lượt 131, #80?→#81? quanh ranh giới đợt, thêm #81?→#82? giữa lượt 132 …)" — ngoặc chỉ liệt kê 3 sự kiện, không tái tạo được số 7; theo chuỗi gộp §10.2 (129-giữa, 130-ranh, 130-giữa, 131-giữa, 132-ranh, 132-giữa, 133-giữa) thì #81?→#82? là sự kiện thứ **6**, sự kiện thứ 7 là #82?→#83? (21:41:40Z). Khung chết/btime của cả hai reboot đều đúng; chỉ nhãn đếm sai |
| F-133-7 | T2-133 §0 viết "khung 19 s vẫn là chuẩn", mâu thuẫn chính §2.2 + §4 và quyết parent 132 §12.3(c) | **XÁC NHẬN CÒN ĐÚNG NHƯ T10 GHI — CHƯA SỬA** — T2 LIMITS dòng 80: "khung 19 s vẫn là chuẩn đã thỏa thuận (xem §2.2)"; trong khi dòng 675–677 (§2.2 mục 4) và dòng 771 (§4 mục 4) viết "Ghi cả hai, khung hẹp nhất làm chuẩn (tiền lệ quyết parent …)". **Chuẩn đúng theo quyết parent: khung hẹp nhất (15 s) làm chuẩn** cho #81?; khung 19 s vẫn được ghi lại đầy đủ |
| F-133-8 | RAM min giữa lượt yên #10: T4 ghi 636 MB, T5 ghi 622 MB cùng cửa sổ | **XÁC NHẬN CÒN ĐÚNG NHƯ T10 GHI** — T4 `classb-t4-attempt1.txt`: sampler giữa lượt (20:51:08–20:52:08Z) min **636 MB**; T5 LIMITS §4.2 bảng RAM: **622 MB lúc 20:52:07Z**. Hai sampler khác nhau, cùng thời điểm, chênh 14 MB — dao động lấy mẫu bình thường của MemAvailable. Cả hai đều >500 MB nên B5 ĐẠT không đổi. Đề nghị các luồng ghi rõ "min theo sampler của mình" khi báo RAM min |

## 5. Sai số mới tìm được (F-134-T1-*) — tất cả KHÔNG đổi verdict

### F-134-T1-1 — LIMITS T4-133 viết prereg T3 "17:46Z" hai lần, file prereg ghi 17:45Z (không đổi verdict)
- `PHASE9_ROUND133_T4_WEBKIT_QUIET10_LIMITS.md` dòng ~119 (§5.2): "T3 có prereg
  ghost-freeze/skew đứng từ 17:46Z đợt 132" và dòng ~193 (§9.3): "T3 bước 2 (prereg
  ghost-freeze/skew 17:46Z đợt 132 đứng nguyên)".
- Sự thật: `round132-t3/prereg-t3.md` dòng 4 ghi "**Đăng ký lúc 17:45Z 17/11/2026**"
  (T1-134 đọc trực tiếp); T3 LIMITS + LIMITS gộp đều viết đúng 17:45Z.
- Đây là trường hợp mới của F-133-4 (lệch 1 phút trong chữ, không phải lỗi hồ sơ):
  prereg vẫn đứng trước khi T4 đo (T4 bắt đầu gate 0 lúc 17:51Z đợt 132 / đo đợt 133),
  verdict P1–P7 không đổi. **Sửa:** dùng 17:45Z khi trích giờ đăng ký prereg.

### F-134-T1-2 — Harness kiểm chứng khô widen v6 của T5 chỉ nằm trong /tmp, đã mất sau reboot (không đổi verdict)
- T5 LIMITS §5.2: harness `/tmp/t5v6-test/harness.sh` (trích block C4 từ watcher thật
  rồi eval 8 ca). `/tmp` là tmpfs — sau 2 reboot (21:41:40Z + 23:26:58Z) thư mục này
  **không còn tồn tại** (T1-134 kiểm `ls /tmp/t5v6-test/` → không có).
- Claim 8/8 **vẫn đứng vững**: T1-134 chạy lại 8 ca từ điều kiện C4 trong file watcher v6
  thật trên đĩa (`t5-wait-replay-b84.sh` dòng 109–117) — **8/8 OK** (script + output tại
  `round134-t1/verify-widen-a2.{sh,out}`). Nhưng bằng chứng gốc của T5 (harness + log
  chạy khô) không còn khôi phục được — chỉ còn bảng 8 ca trong LIMITS.
- Bài học: bằng chứng kiểm chứng phải lưu trong `hidden_files/round<N>-t*/`, không để
  riêng trong `/tmp` (tmpfs mất sau reboot). Không đổi verdict: widen A2 đã được kiểm
  chứng độc lập lại từ code đã ship.

### (Không phải sai số mới) — Đếm lock bằng grep thô trùng lặp 1 dòng
- T1-134 lúc đầu đếm `vite-lock-v2-cleaned-864.log` bằng `grep -c TICKET` được 265, tổng
  các mục = 865 ≠ 864 dòng. Kiểm lại bằng file phân tích của chính T6
  (`analyze-log-cleaned-close.txt` dòng 4): `TICKET=264` (tổng 864 ✅) — dòng
  `STALE-TICKET` chứa chuỗi con `TICKET` nên grep thô đếm trùng 1 dòng. Số của T6/T10
  (864 dòng, 250 cặp; 867 dòng, 251 cặp lúc T10 đóng) là đúng; lỗi thuộc về cách đếm
  thô của T1-134, đã sửa trước khi kết luận. Ghi lại để luồng sau khỏi lặp: đếm lock
  phải khớp từ đầu dòng hoặc dùng file phân tích đã có, không `grep -c` chuỗi con.

## 6. Giới hạn của lần kiểm chứng này (trung thực)

- **Trạng thái đã trôi, chỉ kiểm lại được qua log:** lock lúc đóng, 0 process sót,
  `/tmp/.X11-unix/` trống lúc đóng, RAM lúc T10 bắt đầu suite (606 MB — có trong log
  header, khớp), số watch ngoài cell lúc T9 đo, RAM 433–512 MB của T9, trạng thái
  scheduler của T7. T1-134 không tuyên bố kiểm lại được những trạng thái này bằng quan
  sát trực tiếp hiện tại (boot đã đổi sang d2e66749 lúc 23:26:58Z, đợt 134 đang chạy).
- **Không chạy lại suite/O8:** suite 27/27 và O8 21/21 được kiểm bằng cách đếm lại dòng
  kết quả trong log gốc của T10 (27 dòng `exit=0`, 42 dòng PASS, 0 `fail` ngoài `0 fail`)
  + đối chiếu md5 cây — không chạy lại vì chạy lại sẽ cho số đo mới của cây/boot hiện
  tại (preview.tsx đã đổi trong đợt 134), không phải bằng chứng cho số đo lúc đóng.
  Log gốc đầy đủ, timestamp + boot_id khớp nhau (suite 21:57:12–22:02:06Z, O8
  22:02:37–22:04:37Z, cùng boot 3e7a7b51).
- **Không đo lại headroom/RAM:** lý do như T1-133 §6 (số đo là trạng thái tại thời điểm
  đo; đo lại bây giờ sẽ khác vì đợt 134 đang chạy + boot mới). Kiểm bằng số học +
  chuỗi nối tiếp + script tồn tại.
- **Không kiểm chứng lại toàn bộ nội dung 9 file LIMITS luồng** (mỗi file 10–54 KB)
  theo từng dòng; chỉ kiểm mọi claim lớn + mọi con số được trích trong brief/T10/LIMITS
  gộp + đối chiếu chéo các luồng. Các claim nhỏ không trích ở đây vẫn nằm trong LIMITS
  của từng luồng, chịu trách nhiệm của luồng đó.
- **F6' pixel-verified:** T1-134 đối chiếu file phân tích của T4, không tính lại pixel
  từ đầu (dữ liệu gốc JSON đã tính lại độc lập ở §3.2).

## 7. Kết luận

- **Verdict: PASS.** Đếm cuối đợt 133 (10/12/12; lũy kế 228/551/483) tái kiểm đúng bằng
  code riêng, quét trực tiếp từ đĩa trong một lần quét toàn cục. Sha/size LIMITS gộp lúc
  đóng khớp bản copy đã lưu; phần dài thêm sau đóng chỉ là §12.1 quyết parent. Lượt yên
  #10 đo xong hợp lệ (median 39,5 ms — tính lại độc lập từ JSON gốc, khớp từng con số);
  mô hình ghost-freeze/skew ĐƯỢC CỦNG CỐ (P1 5/5 p=8,0×10⁻⁶, P3 5/5 p=3,4×10⁻⁴ — tính
  lại độc lập, khớp từng bin histogram và từng seq (c2)); mù #52 ĐÓNG HOÀN TOÀN
  (merged A 162 mốc/419 s + B 113 mốc/469 s); gap #81?→#82? = [7.797, 7.817] s CHỨNG
  NHẬN, CERT n=46 / FULL n=61; widen A2 chạy lại 8/8 từ code đã ship; suite 27/27 +
  O8 21/21 ×2 đúng; WebKit FULL PASS lần thứ 11 liên tiếp (123–133) đúng; reboot giữa
  lượt lần thứ 7 (chuỗi gộp) + khung chết #82? hai bản ghi đúng; T6 lock 250 cặp đúng;
  T7/T8/T9 số học đúng.
- **Trạng thái F-133-1→8:** đã sửa đúng F-133-1, F-133-3, F-133-4 (trong LIMITS gộp);
  F-133-2 sửa một nửa (số báo đã đúng 4.393 s, quy ước biên vẫn chưa ghi);
  F-133-5 đã chốt định nghĩa nhưng T2-133 chưa áp dụng đều;
  F-133-6, F-133-7, F-133-8 xác nhận còn đúng như T10 ghi (chưa sửa, không đổi verdict).
- **2 sai số mới (F-134-T1-1 → F-134-T1-2) đều không đổi verdict:** T4 viết nhầm giờ
  đăng ký prereg thành 17:46Z (hai lần); harness kiểm chứng khô widen v6 chỉ lưu trong
  /tmp nên đã mất sau reboot (đã kiểm chứng lại độc lập 8/8 từ code đã ship).
- **CHẤP NHẬN của T10 đứng vững.** Điều kiện chuyển đợt 134 (sửa instrumentation log
  draw theo quyết parent §12.1(a) + lượt yên #11 với logger đã nới + nhánh A2 chờ kích
  hoạt live + probe #53/mù #53) giữ nguyên.
- **Nợ mở chuyển đợt 134 (từ LIMITS gộp đợt 133 §11, T1-134 xác nhận vẫn mở):**
  F-132-3 (script hồi quy phải chạy được — T1-134 đã lưu script đếm + script tính lại
  ghost/(c2) chạy được); F-133-2 (ghi rõ quy ước biên lỗ đuôi); F-133-5/F-133-6 (từ
  đợt 134 dùng MỘT định nghĩa chuỗi reboot gộp §10.2 + ghi rõ định nghĩa khi dùng nhãn
  "lần thứ N"); F-133-7 (câu chữ khung chuẩn trong §0 — chuẩn đúng: khung hẹp nhất làm
  chuẩn); F-133-8 (ghi rõ "min theo sampler của mình"); F-134-T1-1 (dùng 17:45Z cho
  prereg); F-134-T1-2 (bằng chứng kiểm chứng lưu trong `hidden_files/`, không để riêng
  trong `/tmp`); ci-security.yml vẫn 403 chờ user; TTS 39 cấm kiểm lại; birefnet chỉ
  thử khi available ≥ 6 GB.

## 8. Stage (KHÔNG push)

- File LIMITS này: `docs/PHASE9_ROUND134_T1_VERIFY133_LIMITS.md`.
- Stage file: `repo-1-push/paths-loop/phase9-round134-t1-verify133.txt` (1 entry,
  NUL-delimited, verify read-back, 0 binary).
- Hồ sơ làm việc: `hidden_files/round134-t1/` (`count-final-134-t1.py` +
  `count-final-134-t1.out`, `verify-t3-recompute.py` + `verify-t3-recompute.out`,
  `verify-widen-a2.sh` + `verify-widen-a2.out`).
- Cờ: `hidden_files/round134-t1.done` (dòng đầu: verdict một dòng).
- Chốt chặn `round-in-progress.md` KHÔNG xóa (việc của T10).
