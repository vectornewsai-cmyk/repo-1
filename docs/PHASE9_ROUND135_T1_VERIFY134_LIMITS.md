# PHASE9_ROUND135_T1_VERIFY134_LIMITS — T1 kiểm chứng độc lập đợt 134

> Luồng T1, đợt 135, lượt cron 09:35 +07 18/11/2026 (mở lượt 02:35Z 18/11/2026).
> **VERDICT: PASS — xác nhận CHẤP NHẬN của T10 (đợt 134) đứng vững.**
> Mọi claim lớn của đợt 134 đều tái kiểm đúng bằng code/bằng chứng độc lập trên đĩa.
> Tìm được **1 sai số mới (F-135-T1-1), KHÔNG đổi verdict nào.**
> KHÔNG push. KHÔNG release/tag. Không code giả — mọi claim dưới đây đều có bằng chứng trên đĩa.

## 0. Phương pháp + phạm vi + môi trường kiểm

- **Đếm:** code riêng viết mới tại `hidden_files/round135-t1/count-135.py`
  (không chạy script của T10-134, không dùng bất kỳ số nào của T10 làm đầu vào).
  Quét trực tiếp mọi file `phase9-round<N>-*.txt` trong
  `~/workspace/repo-1-push/paths-loop/` (111–134, gồm cả closing) trong MỘT lần quét,
  tách entry theo byte NUL, tính batch/entry/unique trực tiếp từ tập hợp (hợp toàn cục),
  KHÔNG cộng số round-unique vào lũy kế cũ (bài học đợt 126–127).
- **Tính lại độc lập thống kê ghost/(c2):** script riêng viết mới
  `hidden_files/round135-t1/verify-ghost-recompute.py` (từ định nghĩa prereg,
  không copy code T3/T4/T5) chạy trên JSON gốc của T4 — tái tạo mọi số T3/T4/T5
  cho lượt yên #10 (JSON đầy đủ đợt 133) và #11 (JSON partial đợt 134), xem §3.
  Script xử lý được `flip.wallMs=None` (không crash như script bước 2 gốc của T3).
- **Claim từng luồng:** đọc trực tiếp log/script/dữ liệu gốc của luồng đó trong
  `hidden_files/round134-*/` + file LIMITS của luồng + bản copy lúc đóng của LIMITS gộp;
  không tin lời T10 mà không có vết trên đĩa. Chỗ nào chỉ kiểm lại được qua log
  (trạng thái đã trôi) thì ghi rõ, không tuyên bố kiểm lại được.
- **Thời gian kiểm:** 02:40–02:54Z 18/11/2026. Boot hiện tại lúc kiểm: **8ae55060**,
  btime 01:31:18Z — cùng boot T10 đóng đợt 134 (không reboot thêm kể từ lúc đóng).
  Mọi số đo trạng thái lúc đóng đợt 134 (suite/O8/lock/RAM) chỉ kiểm lại được qua log
  gốc, không đo lại trên boot hiện tại.
- **Cây lúc mở đợt 135 (theo quyết parent đợt 134 §12.3(a) — GIỮ fix T3):**
  `preview.tsx 530e10a7`, `media.ts 2c384ed1`, `vite.config.ts ee80d093`
  (đo trực tiếp lúc 02:40Z, xem §4.7). KHÔNG ai "sửa lại" preview.tsx về 805409f0.

## 1. Đếm cuối đợt 134 + lũy kế — KHỚP HOÀN TOÀN

| Phạm vi | T10 công bố | T1-135 tái kiểm trực tiếp | Khớp |
|---|---|---|---|
| Đợt 134 (gồm closing) | 10 batch / 12 entry / 12 file duy nhất | **10 / 12 / 12** | ✅ |
| Lũy kế 111–133 (tái kiểm) | 228 / 551 / 483 (số công bố đợt 133) | **228 / 551 / 483** | ✅ |
| Lũy kế 111–134 (gồm closing) | 238 / 563 / 493 | **238 / 563 / 493** | ✅ |
| File mới-only đợt 134 | 10 | **10** | ✅ |
| File đợt 134 trùng 111–133 | 2 | **2** | ✅ |

Chi tiết đợt 134 (đếm trực tiếp từ đĩa, script + output tại `round135-t1/count-135.py`):

| File paths | Entry |
|---|---|
| phase9-round134-closing.txt | 2 (`docs/PHASE9_ROUND134_LIMITS.md`, `PHASE9_GAP_ANALYSIS.md`) |
| phase9-round134-t1-verify133.txt | 1 |
| phase9-round134-t2-eperm.txt | 1 |
| phase9-round134-t3-c2.txt | 1 |
| phase9-round134-t4-quiet11.txt | 1 |
| phase9-round134-t5-infra.txt | 2 (`apps/web/scripts/vcut-webkit-postboot-check.sh`, `docs/PHASE9_ROUND134_T5_INFRA_LIMITS.md`) |
| phase9-round134-t6-lockhealth.txt | 1 |
| phase9-round134-t7-scheduler.txt | 1 |
| phase9-round134-t8-viteharness.txt | 1 |
| phase9-round134-t9-headroom.txt | 1 |
| **Tổng** | **10 batch / 12 entry / 12 duy nhất** |

- 12 entry vs 12 duy nhất: không có file nào lặp trong đợt 134.
- 10 file mới-only: 9 LIMITS luồng (T1–T9) + LIMITS gộp 134.
  2 file trùng 111–133: `PHASE9_GAP_ANALYSIS.md` + `apps/web/scripts/vcut-webkit-postboot-check.sh`.
- Đối chiếu: 483 + 10 = 493 ✅.
- **Mọi đường dẫn 111–134 đều tồn tại trên đĩa** (0 thiếu, kiểm trên toàn bộ 493 file
  duy nhất — không chỉ đợt 134).
- **Định dạng:** cả 10 file đợt 134 đều NUL-delimited thuần (0 ký tự newline, kết thúc
  bằng NUL — kiểm bằng đọc byte trực tiếp trong script đếm).
- Đây là lần tái kiểm độc lập thứ mười liên tiếp khớp số công bố (111–133 = 228/551/483).
- File oversize đợt 134: T2 LIMITS 58.271 B, T6 LIMITS 50.224 B, T5 LIMITS 49.794 B
  (vượt ngưỡng push-files 37.768 B — chỉ stage paths, không push; đúng luật).
  File oversize chưa lên từ trước vẫn còn: 1 file 6,4 MB
  `benchmarks/results/webkit-blob-flaky-96x3.json` (không nằm trong paths đợt 134).

## 2. LIMITS gộp đợt 134 — sha/size lúc đóng vs hiện tại

| | Lúc đóng (T10, 02:02Z) | Hiện tại (T1-135 đo trong phiên kiểm) |
|---|---|---|
| Byte-size | 29.922 B | **33.784 B (+3.862 B)** |
| sha256 | `8346bacc…c1f89` | `—` (xem diff dưới) |

- **Bản copy lúc đóng khớp đúng:** `round134-t10/PHASE9_ROUND134_LIMITS.closing-copy.md` =
  29.922 B, sha256 `8346baccc72b487c8961f698380e1f43082cec2a584780371ae70f54df5c1f89` ✅
  (T1-135 đo trực tiếp trong phiên kiểm; khớp cả file `.sha256` kèm theo).
- **Diff copy-lúc-đóng → bản hiện tại: chỉ có 2 loại thay đổi, đều đã giải thích:**
  1. Dòng tiêu đề §12 sửa từ `## §12. Chờ quyết parent` thành
     `## §12. Chờ quyết parent (đã quyết ở §12.3 dưới)` (1 dòng).
  2. Thêm mới §12.3 QUYẾT PARENT (a)–(f) (pure append sau dòng 147). Không có dòng cũ
     nào khác bị sửa hay xóa. Footer "Batch stage / Tổng batch" đã có sẵn lúc đóng.
- **Không có thay đổi nào không giải thích được** sau khi đóng. File dài thêm là do quyết
  parent ghi vào, đúng như dự kiến (bài học F-132-1/F-132-2 + quy định AGENTS.md).
- **Cờ `.done`:** đủ 10 file `round134-t1.done` … `round134-t10.done` (9 luồng T1–T9 +
  cờ đóng của T10) ✅.

## 3. Thống kê ghost/(c2) — tính lại độc lập từ JSON gốc

Script riêng `round135-t1/verify-ghost-recompute.py` (+ output `.out`), cùng định nghĩa
prereg với `t3-step2-verify.py` nhưng code viết mới, không copy.

### 3.1 Lượt yên #10 (round 133, JSON đầy đủ) — khớp 100% mọi số T3/T4/T5/T1-134

File `round133-t4/preview-b-f3-flip-webkit-t4-attempt1.json`:

| Số liệu | T3/T4/T5/T1-134 công bố | T1-135 tính lại từ JSON gốc | Khớp |
|---|---|---|---|
| size / sha256 | 3.274.496 B / `e3ca1ac5…423133` | **3.274.496 B / `e3ca1ac5dd79be72014a88268fe5abec1703f585b25a64473ad434c245423133`** | ✅ |
| passes / flip | 20 / afterPass=5, wallMs=26187 | **20 / afterPass=5, wallMs=26187** | ✅ |
| tickCost total median (n=650) | 39,5 ms | **39,5 ms** (mean 45,0; min 28; max 107) | ✅ |
| tickCost post flip+2000ms (n=471) | 39,0 ms | **39,0 ms** | ✅ |
| nTicks post / nGhost / nomatch | 376 / 752 / 0 | **376 / 752 / 0** | ✅ |
| Histogram | {-9: 2, -3: 4, -1: 69, 0: 259, 1: 203, 2: 190, 3: 23, 4: 2} | **y hệt từng bin** | ✅ |
| bin0 / +1/+2 / +3 | 34,4% / 52,3% / 3,1% | **34,4% / 52,3% / 3,1%** | ✅ |
| (c2) skp=0 | 5: seq 166/218/293/323/394, đều lag +1f | **5, đúng 5 seq, đều lag +1f** | ✅ |
| (c2) skp=1 / lag ≥+5f / lag âm | 0 / 0 / 0 | **0 / 0 / 0** | ✅ |
| curPix run ≥3 tick | 12 run | **12 run** (cùng danh sách từng run) | ✅ |
| snap−label / raw−label median | 35 / 8 ms | **35 / 8 ms** | ✅ |
| label−floor +1 | 76,5% (575/752) | **76,5% ({0: 177, 1: 575})** | ✅ |
| P1: k=5/5, baseline, p | 5/5, 36/376=0,096, p=8,046×10⁻⁶ | **5/5, 36/376=0,0957, p=8,0459×10⁻⁶** | ✅ |
| P3: frozen 5/5, baseline, p | 5/5, 76/375=0,203, p=3,419×10⁻⁴ | **5/5, 76/375=0,2027, p=3,4191×10⁻⁴** | ✅ |
| P7 log draw phủ (c2) | 0/5; log 9854→16068, flip 26187 | **0/5; n=137, loops {1: 66, 2: 71}, wallMs 9854→16068; delta −15.060…−44.224 ms** | ✅ |

- Ngưỡng lượt yên ≤60 ms: median 39,5 ms (tổng) / 39,0 ms (post) — ĐẠT, thấp nhất
  trong 9 lượt hợp lệ. Trung bình 9 lượt T1-135 tính lại = 46,94 ms (công bố 46,9 ms) ✅.
- **T5 pha 2 khớp 100%:** `t5-partial-drawlog-check.txt` không phải pha 2 đợt 133 —
  xem §3.2 cho pha 2 đợt 134. Pha 2 đợt 133 đã được T1-134 kiểm khớp (xem LIMITS T1-134 §3.2).

### 3.2 Lượt yên #11 (round 134, JSON partial) — KHÔNG CÓ DỮ LIỆU MỚI, khớp 100% T3/T4/T5

File `round134-t4/preview-b-f3-flip-webkit-t4-attempt1.json-ABORTED-boot-d2e66749-reboot235317Z`:

| Số liệu | T3/T4/T5 công bố | T1-135 tính lại từ JSON gốc | Khớp |
|---|---|---|---|
| size / sha256 | 257.631 B / `b402b3f3…76bc6` | **257.631 B / `b402b3f3f83137a785303784eeb3a02c6653b1413b34552dce230533d3766bc6`** | ✅ |
| engine / partial | webkit 27.2 / partial=true, `partialReason="sau pass"` | **webkit 27.2 / partial=True** | ✅ |
| flip | afterPass=5, wallMs=None (chưa tới) | **afterPass=5, wallMs=None** | ✅ |
| passes | 2 (len) | **2** (`results.b.passes` len=2; top-level `passesDone`=2 — xem ghi chú dưới) | ✅ |
| blendTick | n=23, seq 0→22, viaRvfc=0 toàn bộ, tBlend 10697→12787 | **n=23, seq 0→22, viaRvfc={0: 23}, tBlend 10697→12787** | ✅ |
| tickCost | n=27, median 58 ms — chỉ pre-flip, KHÔNG phải số lượt yên | **n=27, median 58 ms (mean 55,5; min 29; max 93)** | ✅ |
| c2DrawLog | n=53, loopNo {1: 53}, wrap 0 | **n=53, loopNo {1: 53}, wrap (loop≥2) = 0** | ✅ |
| c2DrawLog chi tiết | drawSrc 27 / rawUnit 26; frameIdx 0–65 (distinct 17); wallMs 9696→12741 (span 3045 ms); ct 0–2,167 s; readyState 4 53/53; seeking False 53/53 | **y hệt** (đếm trực tiếp từ JSON — xem ghi chú về key `point` dưới) | ✅ |
| tick post-flip / (c2) / P1–P7 | 0 / 0 / KHÔNG KIỂM ĐƯỢC | **0 / 0 / KHÔNG KIỂM ĐƯỢC** (script dừng có kiểm soát khi `wallMs=None`) | ✅ |

- **T5 pha 2 khớp 100%:** `round134-t5/t5-partial-drawlog-check.txt` cho cùng mọi số
  (n=53, loopNo {1: 53}, drawSrc 27/rawUnit 26, frameIdx 0–65 distinct 17,
  wallMs 9696→12741 span 3045 ms, tickCost n=27 median 58,0 ms, blendTick n=23,
  0 tick post-flip, kết luận "P1–P7 ĐỀU KHÔNG KIỂM ĐƯỢC"). Ba bên T3/T4/T5 không
  có số nào lệch trên dữ liệu partial.
- **Ghi chú về `passesDone` (làm rõ F-134-T3-5):** T3-tiếp đọc `results.b.passesDone`
  được `None`; T5 ghi "passesDone field: 2". T1-135 kiểm trực tiếp: trường `passesDone=2`
  nằm ở **top-level** của JSON (`data['passesDone']`), còn `results.b.passesDone` đúng
  là không tồn tại. T3 đọc nhầm cấp — đúng như T10 đã ghi. Số pass hoàn thành vẫn là 2
  theo cả hai cách đếm (`len(results.b.passes)=2`, top-level `passes=20` là số pass
  kế hoạch, không phải số đã chạy). Không ảnh hưởng kết luận nào.
- **Ghi chú về script của chính T1-135 (tự sửa, không phải sai số của đợt 134):**
  bản đầu của `verify-ghost-recompute.py` đọc nhầm key `drawSrc` thay vì `point`
  trong entry c2DrawLog nên in `drawSrc=Counter({None: 53})`. Đã đếm trực tiếp lại
  bằng key đúng: `point={'drawSrc': 27, 'rawUnit': 26}` (đợt 134) và
  `{'drawSrc': 70, 'rawUnit': 67}` (đợt 133, n=137) — khớp T3/T4. Lỗi thuộc về script
  của T1-135, đã sửa trước khi kết luận (tiền lệ cách ghi của T1-134 §5).

## 4. Bảng đối chiếu từng claim lớn

### 4.1 Suite 27/27 + O8 21/21 ×2 + WebKit FULL PASS lần thứ 12 liên tiếp (T10)

| Claim | Bằng chứng độc lập | Kết quả |
|---|---|---|
| Suite cây gộp 27/27 exit 0, 0 rerun | `round134-t10-suites.log`: đúng **27 dòng `exit=0`** (đủ 27 mục: tsc-web, tsc-desktop, vite-build, playheadHold90R2, playheadPacing54K9, previewEngine, seek, seekSkipRender86N3, previewLoop50F2, ghostBlend.probe, rvfcClipWindow102D3, driftConfirmSkip103E4, css60, css61, P7-esbuild, orphans, r6, U4, media-tests, media-retry96X3, media-watchdog96X3, deint-verdict, deint-verdict-100b7, armHeld99a3, vite-diagnosis-regex, xvfb-lock, test-preview-engine.sh), **0 lần nhắc "rerun"**, `preview-engine: 354 assertions pass`; bắt đầu 01:44:12Z, `ALL DONE 01:48:07Z`, boot 8ae55060; dòng 2: `frozen tree: preview.tsx 530e10a7…` | ✅ |
| O8 Chromium 21/21 exit 0 | `t10-o8.log`: `KẾT QUẢ CLICK-TEST O8: 21/21 pass, 0 fail, 0 note` | ✅ |
| O8 WebKit 21/21 exit 0 | `t10-o8.log`: `KẾT QUẢ CLICK-TEST O8 WebKit: 21/21 pass, 0 fail, 0 note`; tổng **42 dòng PASS** (21+21) | ✅ |
| WebKit FULL PASS lần thứ 12 liên tiếp (đợt 123–134) | Đọc 12 file `round12{3..9,3{0,1,2,3,4}}-t10/t10-o8.log`: **cả 12 đều `WebKit: 21/21 pass`** | ✅ |
| 1 reboot trong phiên đóng sổ (cc1f9de0 → 8ae55060, btime 01:31:18Z) | Suite log boot 8ae55060 (01:44–01:48Z) trong khi T4/T8 đóng trên cc1f9de0; O8 log cùng boot 8ae55060; T8 retry chạy trên 8ae55060 (01:35:55Z) | ✅ |
| Cây lúc đóng preview.tsx 530e10a7 | Suite log dòng 2 + O8 log header (theo LIMITS gộp §10.2); md5 lúc mở đợt 135 vẫn 530e10a7 (xem §4.7) | ✅ (log cho lúc đóng) |

- Lưu ý nhỏ (không phải sai số mới): header comment của `round134-t10-verify.sh`
  vẫn ghi "T10 verify đợt 131" và "baseline preview.tsx 03bf029f…" — copy cũ từ đợt 131;
  script chạy thật trên cây 530e10a7 theo log suite (dòng `frozen tree`), không ảnh hưởng kết quả.

### 4.2 Probe #53 / mù #53 / gap #82?→#83? / reboot ngoài dải (T2)

| Claim | Bằng chứng độc lập | Kết quả |
|---|---|---|
| Probe #53 ok=2 fail=0 (23:46:54Z, boot d2e66749) | `round134-t2/once.txt`: `probe#53 boot=d2e66749 ok=2 fail=0`; `status2.txt` cùng số | ✅ |
| Mù #53 A đóng (merged 120 mốc, lỗ lớn nhất 822 s) | `blind53-merged.log`: `seg A MERGED: marks=120 largest_gap=822s … max_hidden=0` | ✅ |
| Mù #53 B MỞ tối đa 3 ẩn (merged 59 mốc, lỗ lớn nhất 4.227 s) | `blind53-merged.log`: `seg B MERGED: marks=59 largest_gap=4227s (22:16:31 → 23:26:58) floor(4227/1147)=3 max_hidden=3` | ✅ |
| Mù #53 C đóng (28 mốc, lỗ lớn nhất 518 s) | `blind53-merged.log`: `seg C MERGED: marks=28 largest_gap=518s … max_hidden=0` | ✅ |
| Gap #82?→#83? = [7.635 s, 7.655 s] CHỨNG NHẬN DẠNG KHOẢNG, CERT n=47 / FULL n=62 | `blind53-gaps.txt` dòng 394: `gap #82?->#83? = INTERVAL [2h07'15", 2h07'35"] mid 2h07'25" CERTIFIED`; 2h07'25" = 7.645 s, khoảng = [7.635, 7.655] s ✅; dòng 405 `CERT47: n=47`, dòng 407 `FULL62: n=62` ✅; caveat "F83? NEVER measured" ghi rõ trong cùng dòng | ✅ |
| Gap #83?→#84? = 6.318 s giữ SPAN | `blind53-gaps.txt` dòng 422 + T2 LIMITS dòng 278 | ✅ |
| Gap #84?→#85? = 1.579 s SPAN | T2 LIMITS dòng 280: `1.579 s (26'19")` — 26'19" = 1.579 s ✅ | ✅ |
| Reboot #84?→#85? NGOÀI dải cơ học, sớm hơn cận dưới 412 s — đứt chuỗi 14 lần INSIDE | T2 LIMITS dòng 87–89, 289–293, 597–598; `blind53-gaps.txt` dòng 419: dải từ #84? = [00:00:08Z, 01:53:57Z], thực tế #85? 23:53:17Z nằm ngoài ✅. Chênh 1 s (411 vs 412 s) đã được T2 giải thích trong LIMITS dòng 291–293 (p10 float bị cắt khi đổi sang datetime — cùng mẫu T2-133 §4); không phải sai số mới | ✅ |
| EPERM 0 sóng thật; WFS lần 40 chênh 0 (891/248; R7b 916/265; copies 25/17) | T2 LIMITS dòng 627 (`+4 dòng / +1 file so với lần 39 (887/247 → 891/248)`) + `eperm-sweep-run.log`/`scan-wfs-run.log` tồn tại trong `round134-t2/` | ✅ |
| RAM max trong mù 1.903 MB (31,0% guard) | T2 LIMITS dòng 111, 662–680 + `ram-max.txt` | ✅ |

### 4.3 T3 — sửa instrumentation + bước 2 (không revert)

| Claim | Bằng chứng độc lập | Kết quả |
|---|---|---|
| preview.tsx 805409f0 → 530e10a7; tsc 0; vite build PASS | md5 hiện tại 530e10a7 (xem §4.7); bản gốc `preview.tsx.orig-805409f0` md5 `805409f0046dbf43358aeec95bf46f15` ✅; diff orig→hiện tại = **34 dòng nội dung +/−** (khớp đếm lại của T3-tiếp; xem F-134-T3-4) | ✅ |
| Bước 2 KHÔNG CÓ DỮ LIỆU MỚI; P1–P7 KHÔNG KIỂM ĐƯỢC | Tính lại độc lập §3.2: 0 tick post-flip, 0 (c2) | ✅ |
| Điều kiện revert "sau khi đo" chưa xảy ra → KHÔNG revert | 0 attempt hợp lệ (xem §4.4); quyết parent §12.3(a) đã GIỮ fix | ✅ |

### 4.4 T4 — lượt yên #11 KHÔNG ĐO ĐƯỢC, 0 attempt hợp lệ

| Claim | Bằng chứng độc lập | Kết quả |
|---|---|---|
| Gate 0 + gate A MỞ ĐÚNG 1 LẦN ở poll #1 (23:50:17Z, boot d2e66749, RAM 2037 MB) | `poll-t4.log` dòng 2–3: `poll #1 23:50:17Z … RAMavail=2037MB tree=YES:md5=530e10a7 t5flag=PASS postboot_exit=0` + `CUA YEN MO poll #1` | ✅ |
| Attempt1 bị reboot giết giữa pass 3/20 (passesDone=2, JSON partial) | JSON partial §3.2 (passes=2, flip wallMs=None); `run-webkit-t4-attempt1.log-ABORTED-…` tồn tại | ✅ |
| Tổng 82 poll (1+23+4+54), chỉ 1 lần cửa mở | `poll-t4.log`: **82 dòng bắt đầu bằng `poll #`**; 4 dòng `== poll-wait-t4-134 start` trên 4 boot (d2e66749 → 81335571 → 1d2e984d → cc1f9de0) | ✅ |
| Ngưỡng ≤60 ms GIỮ NGUYÊN, không có số mới; 9 lượt trước trung bình 46,9 ms | Tính lại §3.1: trung bình 9 lượt = 46,94 ms | ✅ |
| Log draw partial n=53 toàn loop 1, 0 wrap — fix CHƯA ĐƯỢC KIỂM CHỨNG runtime | Tính lại §3.2 | ✅ |

### 4.5 T5 — infra + A2 kích hoạt LIVE lần đầu + --repair

| Claim | Bằng chứng độc lập | Kết quả |
|---|---|---|
| Nhánh A2 KÍCH HOẠT LIVE LẦN ĐẦU trên boot cc1f9de0 | `t5-wait-replay-b87.log` dòng 197/201: poll 49 (01:09:55Z, silent 633 s) + poll 50 (01:10:55Z, silent 693 s), `c4_form=A2(yes) … TRIGGER=YES` | ✅ |
| Kiểm chứng độc lập 5/5 → --repair 1 lần 01:11:39Z | `t5-repair-A2.log` dòng 1: `REPAIR-A2-START 2026-11-18T01:11:39Z boot=cc1f9de0 form=A2 TRIGGER=YES poll49+50 verify-5/5-OK once-only-…` | ✅ |
| RE-CHECK 4/4 PASS; GST 120 → 269 file | `t5-repair-A2.log`: `RE-CHECK wrapper/libs/GST/apt: PASS` (4/4) + `KET LUAN: DU DIEU KIEN chay WebKit`; `INFO GST: file plugin hệ thống=120, debroot=269` (trước repair) và poll50 `hệ thống=120, debroot=269`; 120 + 149 = 269 ✅ | ✅ |
| Cờ `POSTBOOT_PASS` viết 01:13:56Z (poll 53) | File `round134-t5/POSTBOOT_PASS`: `boot_id=cc1f9de0-… btime=2026-11-18T00:17:36Z pass_at=2026-11-18T01:13:56Z poll=53` (đọc trực tiếp) | ✅ |
| Boot 81335571: replay KHÔNG CHẠY → TRIGGER=YES dạng (B) poll 6 → --repair bị reboot giết giữa update | `t5-wait-replay-b86.log` dòng 25: poll 6 00:05:07Z `c4_form=B(yes) … TRIGGER=YES`; `t5-repair-newboot.log` dòng 1: `REPAIR-START 2026-11-18T00:06:20Z boot=81335571 form=B TRIGGER=YES poll6 verify-5/5-OK` | ✅ |
| Pha 2: KHÔNG CÓ DỮ LIỆU — khớp 100% số T3 | Xem §3.2 (`t5-partial-drawlog-check.txt`) | ✅ |
| R9 (a) "nhắc lần 17" | T5 LIMITS dòng 87, 590, 605 đều viết "nhắc lần 17" — **đã có quyết parent §12.3(d): số đếm VẪN LÀ 16, số 17 KHÔNG được chấp nhận** (xem §5) | ⚠️ đã quyết, không phải sai số mới |

### 4.6 T6 — lock KHỎE + prune lần 9 xóa 0 + chuỗi boot

| Claim | Bằng chứng độc lập | Kết quả |
|---|---|---|
| Lock KHỎE: 869 dòng / 251 cặp lúc T6 đóng | `vite-lock-v2-cleaned-869.log`: **869 dòng**; đếm lại đúng định dạng `<timestamp> <thread> <EVENT>`: TICKET=266, ACQUIRED=257, RELEASED=251, COOLDOWN=80, STALE-LOCK=6, STALE-TICKET=1, TIMEOUT=8 (tổng 869 ✅); `analyze-log-cleaned-close2.txt`: `pairs ACQUIRED->RELEASED: 251` ✅ | ✅ |
| 1 ACQUIRED không cặp = t4 reboot-kill (F-134-T6-2) | ACQUIRED−RELEASED = 6 = 5 ca double-acquire đã biết + **1 dòng cuối: `2026-11-17T23:50:17Z t4 ACQUIRED port=5187` không có RELEASED sau đó** (dòng 869/869) ✅ | ✅ |
| Prune lần 9: xóa 0 file; queue 78 file | `prune-deleted.txt` + `cooldown-now.txt` (78 dòng) trong `round134-t6/` | ✅ |
| Chuỗi boot tương đối #57→#85; số tuyệt đối VẪN TẠM | T6 LIMITS + `analyze-log-cleaned-close2.txt`; T6 đóng 00:07Z trước reboot #5 nên chưa chốt #89? — đúng như LIMITS gộp §11 ghi | ✅ |

### 4.7 T7 — cửa BẨN, HB 43/191, DR 48/166 + started_at viết lại lần thứ 5

| Claim | Bằng chứng độc lập | Kết quả |
|---|---|---|
| HB 43/191 (22,5%), DR 48/166 (28,9%); 2 slot thiếu MỚI | T7 LIMITS dòng 128–130: HB 42/184 → 43/191 (184+7=191 ✅); DR 47/163 → 48/166 (163+3=166 ✅); 43/191=22,5% ✅, 48/166=28,9% ✅ | ✅ |
| HB muộn +887 s, lần thứ 5 mẫu ":35:37Z" | T7 LIMITS (ghi nhận mốc; không kiểm lại trạng thái scheduler đã trôi) | ⚠️ log-only |
| Started_at lượt vcut đợt 133 bị viết lại +3.985 s (lần thứ 4) | T7 LIMITS §2 + T1-134 §3.6 đã kiểm | ✅ (đợt 133) |
| Started_at lượt vcut đợt 134 (run `19a360f1`) CŨNG BỊ VIẾT LẠI +6.967 s (lần thứ 5) — T10 kiểm lúc đóng 01:44Z | Số học: 01:31:58Z − 23:35:51Z = **6.967 s** ✅; 01:31:58Z − btime 01:31:18Z = **40 s** ✅ (đúng mẫu 31–46 s sau btime); T7 ghi lúc 23:53Z run này `started 23:35:51Z, jitter 0 s` (`round134-t7/NOTES.md` dòng 55) — hai mốc quan sát mâu thuẫn nhau theo đúng hướng "bị viết lại". **Nhưng bằng chứng truy vấn DB lúc đóng không còn file riêng — xem F-135-T1-1** | ⚠️ xem F-135-T1-1 |

### 4.8 T8 — vite harness 2/3 exit 0 (86n2 TIMEOUT 124)

| Claim | Bằng chứng độc lập | Kết quả |
|---|---|---|
| 84l10 exit 0 (01:15:24–01:16:31Z, boot cc1f9de0) | `run-webkit-summary.txt`: `--- 84l10 exit=0 end 01:16:31Z ---` | ✅ |
| 85m4 chạy 1 KẸT P1-phaseA, bị reboot #5 giết; retry exit 0 (01:51:14–01:53:23Z) | `run-webkit-85m4-retry.log`: `KẾT QUẢ: KHÔNG FAIL` 01:53:23Z; `run-webkit-retry-summary.txt`: `--- 85m4 exit=0 end 01:53:23Z ---` | ✅ |
| 86n2 exit 124 TIMEOUT 900 s (01:35:58–01:50:58Z) | `run-webkit-summary.txt`: `--- 86n2 exit=124 end 01:50:58Z ---`; `run-webkit-86n2-retry.log` dòng cuối: `HARNESS/FAIL: page.evaluate: Target page, context or browser has been closed` → `KẾT QUẢ: CÓ FAIL` | ✅ |
| Gate mở 01:14:08Z (waiter4 poll 55) | T8 LIMITS + `wait-t4-t5.log` (ghi nhận qua log; không đếm lại từng poll waiter) | ⚠️ log-only |
| Fixture rebuild 2 lần, 6/6 md5 khớp đợt 125–133 | `rebuild-fixtures.log` + `rebuild-fixtures-retry.log` tồn tại trong `round134-t8/smoke/` (không chạy lại rebuild) | ⚠️ log-only |

### 4.9 T9 — headroom 2.505

| Claim | Bằng chứng độc lập | Kết quả |
|---|---|---|
| Headroom 2.505 (2.515 → 2.505, chênh −10 trong boot) | T9 LIMITS dòng 5, 25–29: đo 23:45:29Z + 23:48:01Z, boot d2e66749; 2.632 → 2.505 = −127 (−4,8%) ✅ | ✅ (số học) |
| Còn 705 trên ngưỡng báo < ~1.800; gấp ~1,59 lần nhu cầu vite | 2.505 − 1.800 = 705 ✅; 2.505/1,578 ≈ 1,59 ✅ | ✅ |
| Watch ngoài cell 61.242 | 63.747 − 2.505 = **61.242** ✅ | ✅ |
| RAM 460–2.438 MB; balloon xả −2,05 GB trong ~4,5 phút | T9 LIMITS §1–§2 (số đo tại thời điểm đo; T1-135 không đo lại — trạng thái đã trôi) | ⚠️ log-only |
| Birefnet KHÔNG THỬ (max 2.438 MB = 39,7% guard 6 GB) | 2.438/6.144 = 39,7% ✅ | ✅ |

### 4.10 Cây lúc mở đợt 135 (đo trực tiếp 02:40Z 18/11/2026)

| File | md5 đo được | Quyết parent §12.3(a) / cây lúc đóng đợt 134 | Khớp |
|---|---|---|---|
| `apps/web/src/preview.tsx` | **530e10a7** (`530e10a7266b8c148411ba21510b501a`) | GIỮ 530e10a7 — KHÔNG revert về 805409f0 | ✅ |
| `apps/web/src/media.ts` | **2c384ed1** (`2c384ed13703809d5e999311147745e7`) | 2c384ed1 | ✅ |
| `apps/web/vite.config.ts` | **ee80d093** (`ee80d09370b6bfb1ad86efd9a737e411`) | ee80d093 | ✅ |

- Bản gốc 805409f0 còn nguyên tại `round134-t3/preview.tsx.orig-805409f0`
  (md5 `805409f0046dbf43358aeec95bf46f15`) — revert sau vẫn làm được nếu parent quyết khác.

## 5. Trạng thái các sai số đã biết (F-134-*, xác nhận còn đúng như T10 ghi — KHÔNG phải sai số mới)

| Sai số | Nội dung | Trạng thái sau kiểm lại đợt 134 |
|---|---|---|
| F-134-T1-1 | LIMITS T4-133 viết prereg T3 "17:46Z" hai lần, file ghi 17:45Z | Xác nhận còn trong file T4-133 (không sửa lại file cũ — đúng quy tắc không sửa LIMITS đã đóng) |
| F-134-T1-2 | Harness kiểm chứng khô widen v6 của T5 chỉ nằm trong `/tmp`, đã mất sau reboot | Xác nhận: `/tmp/t5v6-test/` không còn; T1-134 đã kiểm lại 8/8 từ code đã ship |
| F-134-T3-1 | Wait-script ghi nhãn cutoff sai (epoch đúng, nhãn sai) | Ghi trong LIMITS T3 §7; không đổi hành vi chờ |
| F-134-T3-2 | Script bước 2 crash `TypeError` khi `flip.wallMs=None` | Xác nhận: script gốc không có nhánh partial; T1-135 viết script riêng xử lý được `None` (xem §3.2) |
| F-134-T3-3 | Wait-script chỉ chạy 1 poll rồi bị reboot #1 giết | Ghi trong LIMITS T3 §7 |
| F-134-T3-4 | Đếm dòng diff 60 vs 36 vs 34 | T1-135 đếm lại trực tiếp: **34 dòng nội dung +/−** (khớp T3-tiếp); "60" (cờ fix.done) và "36" (T4) là cách đếm khác, không phải nội dung diff khác |
| F-134-T3-5 | `passesDone` đọc ở `results.b` được None | **Đã làm rõ cơ chế:** `passesDone=2` nằm ở top-level JSON, `results.b.passesDone` không tồn tại (xem §3.2) |
| F-134-T5-1 | T5 §2 viết "đợt 133 (07da9c50 sống — chuỗi đứt 1 đợt)": SAI theo định nghĩa gộp (đợt 133 CÓ reboot giữa lượt, sự kiện gộp #7) | Xác nhận còn trong LIMITS T5 dòng ~105; chỉ sai câu về chuỗi, không đổi verdict A2/repair |
| F-134-T6-1 | T5 đếm lệch 1 so với định nghĩa gộp ("reboot #8" thay vì sự kiện gộp #9) | Xác nhận: T5 LIMITS dòng 39 "reboot #8 liên tiếp", dòng 45 "reboot #9 giết"; mọi mốc thời gian/boot_id của T5 đều đúng |
| F-134-T6-2 | Reboot cắt giữa hai bước ghi → log giữ mãi 1 ACQUIRED không cặp (t4, 23:50:17Z) | **Xác nhận trên đĩa:** dòng 869/869 của log lock là ACQUIRED t4 không RELEASED (xem §4.6); quyết parent §12.3(b) đã PHÊ DUYỆT đổi thứ tự ghi log |
| F-134-T7-1 | Quyết định biên cửa sổ về slot HB 23:50:50Z (43/191 thay vì 43/190) | Ghi trong LIMITS T7 dòng 142; verdict 2 thiếu mới không đổi theo cả hai cách |
| F-134-T8-1 | Header `run-webkit-summary.txt` dòng 1 ghi "btime 00:17:46Z", lệch +10 s so với btime thật 00:17:36Z | Xác nhận: dòng 1 file summary ghi đúng "btime 00:17:46Z"; LIMITS T8 §1 ghi đúng 00:17:36Z — chỉ sai ở header summary |
| F-134-T8-2 | T8 §0 viết "preview.tsx 530e10a7 suốt lượt": SAI — lúc T8 mở 23:45Z cây còn 805409f0, fix T3 chỉ áp lúc 23:48:59Z | Xác nhận theo mốc thời gian (fix.done mtime 23:48:59Z); mọi lần chạy harness đều trên 530e10a7 nên không đổi kết quả |
| F-134-T9-1/2/3 | Brief mở ~1.295 MB vs T9 đo 460 MB; đỉnh 2.438 MB là chớp ngắn; mốc bắt đầu đợt hồi không xác định chính xác | Ghi trong LIMITS T9; không đổi verdict headroom |
| R9 (a) | T5 viết "nhắc lần 17" ở §5 và §11 | **Quyết parent §12.3(d): SỐ ĐẾM VẪN LÀ 16 — số 17 KHÔNG được chấp nhận.** T1-135 xác nhận T5 LIMITS dòng 87, 590, 605 đều viết "lần 17" — số này đứng ngoài sổ đếm, lần nhắc này vẫn là lần 16 |

## 6. Sai số mới tìm được (F-135-T1-*) — tất cả KHÔNG đổi verdict

### F-135-T1-1 — T10 §10.2: các kiểm đầu lúc đóng không còn file bằng chứng riêng (không đổi verdict)
- `round134-t10/t10-verify-134.log` chỉ có **1 dòng**: `VERIFY DONE 2026-11-18T01:48:07Z`.
  Không có file nào trong `round134-t10/` lưu output của các kiểm lúc đóng mà LIMITS gộp
  §10.2 liệt kê: lock trống (0 ticket + 80 cooldown), 0 process sót (kiểm 02:00:33Z),
  `/tmp/.X11-unix/` trống lúc đóng, và truy vấn scheduler cho run `19a360f1`
  (started_at viết lại +6.967 s). Các claim này hiện chỉ được chứng minh bằng chính
  văn bản LIMITS gộp — khác với suite (log đầy đủ 904 dòng), O8 (log đầy đủ) và đếm
  cuối (script + output đầy đủ), vốn đều tái kiểm được độc lập.
- T1-135 kiểm được phần số học nội bộ, không kiểm được trạng thái lúc đóng (đã trôi,
  đợt 135 đang chạy): lock 78 (T6) + 2 cooldown mới (t8 + t10) = 80 ✅;
  suite/O8 log cùng boot 8ae55060 ✅; T7 ghi run 19a360f1 `started 23:35:51Z, jitter 0 s`
  lúc 23:53Z ✅; số học viết lại 01:31:58Z − 23:35:51Z = 6.967 s ✅ và
  01:31:58Z − btime 01:31:18Z = 40 s ✅ (đúng mẫu 31–46 s sau btime). Không có mâu thuẫn
  nào — chỉ thiếu file bằng chứng.
- **Sửa:** từ đợt 135, T10 lưu output thật của các kiểm lúc đóng vào `round<N>-t10/`
  (vd: listing thư mục lock/cooldown, `ps`, `ls /tmp/.X11-unix/`, output truy vấn
  scheduler) thay vì chỉ ghi kết luận vào LIMITS gộp. Cùng bài học F-134-T1-2
  (bằng chứng kiểm chứng phải lưu trong `hidden_files/`, không để riêng trong `/tmp`).

## 7. Giới hạn của lần kiểm chứng này (trung thực)

- **Trạng thái đã trôi, chỉ kiểm lại được qua log:** lock lúc đóng, 0 process sót,
  `/tmp/.X11-unix/` trống lúc đóng, RAM lúc T10 bắt đầu suite (439 MB — có trong log
  header suite, khớp), số watch ngoài cell lúc T9 đo, RAM 460–2.438 MB của T9,
  trạng thái scheduler của T7 (trừ số học đã kiểm). T1-135 không tuyên bố kiểm lại
  được những trạng thái này bằng quan sát trực tiếp hiện tại (đợt 135 đang chạy).
- **Không chạy lại suite/O8:** suite 27/27 và O8 21/21 được kiểm bằng cách đếm lại dòng
  kết quả trong log gốc của T10 (27 dòng `exit=0`, 42 dòng PASS, 0 `fail` ngoài `0 fail`)
  + đối chiếu md5 cây — không chạy lại vì chạy lại sẽ cho số đo mới của cây/boot hiện
  tại, không phải bằng chứng cho số đo lúc đóng. Log gốc đầy đủ, timestamp + boot_id
  khớp nhau (suite 01:44:12–01:48:07Z, O8 01:57:43–01:59:31Z, cùng boot 8ae55060).
- **Không đo lại headroom/RAM:** lý do như T1-134 §6 (số đo là trạng thái tại thời điểm
  đo; đo lại bây giờ sẽ khác vì đợt 135 đang chạy + boot mới). Kiểm bằng số học +
  chuỗi nối tiếp + script tồn tại.
- **Không kiểm chứng lại toàn bộ nội dung 9 file LIMITS luồng** theo từng dòng; chỉ kiểm
  mọi claim lớn + mọi con số được trích trong brief/T10/LIMITS gộp + đối chiếu chéo
  các luồng. Các claim nhỏ không trích ở đây vẫn nằm trong LIMITS của từng luồng,
  chịu trách nhiệm của luồng đó.
- **F6' pixel-verified:** không tính lại (dữ liệu gốc JSON đã tính lại độc lập ở §3.1;
  lượt #11 không có dữ liệu mới).
- **T2 đếm reboot:** T2 dùng nhãn riêng trong LIMITS của mình (xem F-134-T6-1);
  T1-135 đối chiếu theo định nghĩa gộp của LIMITS gộp (§10.2 đợt 133): sự kiện trong
  đợt 134 là #9–#13, boot mở đợt d2e66749 = #84?, boot đóng 8ae55060 = #89? (chưa chốt
  tuyệt đối — T6 đợt 135 chốt lại với #89?).

## 8. Kết luận

- **Verdict: PASS.** Đếm cuối đợt 134 (10/12/12; lũy kế 238/563/493) tái kiểm đúng bằng
  code riêng, quét trực tiếp từ đĩa trong một lần quét toàn cục — lần tái kiểm độc lập
  thứ mười liên tiếp khớp. Sha/size LIMITS gộp lúc đóng khớp bản copy đã lưu; phần dài
  thêm sau đóng chỉ là §12.3 quyết parent. Lượt yên #11 không đo được (0 attempt hợp lệ)
  — tính lại độc lập từ JSON partial khớp 100% T3/T4/T5 (passes=2, blendTick n=23,
  tickCost n=27 median 58 ms pre-flip, c2DrawLog n=53 toàn loop 1, 0 wrap, 0 tick
  post-flip, P1–P7 không kiểm được); lượt yên #10 tính lại khớp từng con số
  (median 39,5 ms, (c2)=5 seq, P1 5/5 p=8,046×10⁻⁶, P3 5/5 p=3,419×10⁻⁴);
  gap #82?→#83? = [7.635, 7.655] s CHỨNG NHẬN, CERT n=47 / FULL n=62; A2 kích hoạt LIVE
  lần đầu + --repair thành công 1 lần (POSTBOOT_PASS 01:13:56Z poll 53, GST 269);
  suite 27/27 + O8 21/21 ×2 đúng; WebKit FULL PASS lần thứ 12 liên tiếp (123–134) đúng;
  T6 lock 251 cặp đúng (1 ACQUIRED không cặp đã giải thích); T7 HB 43/191 DR 48/166 đúng
  số học; T8 2/3 (86n2 TIMEOUT 124) đúng; T9 headroom 2.505 đúng số học;
  cây lúc mở đợt 135 preview.tsx 530e10a7 đúng quyết parent §12.3(a).
- **Trạng thái F-134-1→F-134-T9-3:** tất cả đã ghi nhận trong LIMITS gộp; T1-135 xác nhận
  còn đúng như ghi (F-134-T3-5 đã làm rõ cơ chế: `passesDone` nằm ở top-level JSON);
  R9 (a) giữ 16 theo quyết parent §12.3(d).
- **1 sai số mới (F-135-T1-1) không đổi verdict:** các kiểm đầu lúc đóng của T10 (§10.2)
  không còn file bằng chứng riêng — chỉ còn 1 dòng `VERIFY DONE` trong
  `t10-verify-134.log`. Đề nghị T10 từ đợt 135 lưu output thật của các kiểm lúc đóng.
- **CHẤP NHẬN của T10 đứng vững.** Điều kiện chuyển đợt 135 (giữ fix 530e10a7 + đo lại
  lượt yên #11 với logger đã nới + mù #54 mới mở + T6 đổi thứ tự ghi log RELEASED/cooldown
  theo quyết parent §12.3(b)) giữ nguyên.
- **Nợ mở chuyển đợt 135 (từ LIMITS gộp đợt 134 §11, T1-135 xác nhận vẫn mở):**
  lượt yên #11 đo lại; mù #54 mới mở (T2 đợt 135); mù #53 B vẫn mở tối đa 3 ẩn;
  A2 watcher chết theo boot (T8 phải tự check trực tiếp); G1 khung (a) M2 vẫn hoãn —
  chờ quyết G1 của user; R9 (a) vẫn chờ user — nhắc lần 16 (KHÔNG tăng số đếm);
  ci-security.yml vẫn 403 chờ user; TTS 39 cấm kiểm lại; birefnet chỉ thử khi
  available ≥ 6 GB; file oversize chưa lên: 1 file 6,4 MB
  `benchmarks/results/webkit-blob-flaky-96x3.json` + LIMITS oversize đợt 134
  (T2 58.271 B, T6 50.224 B, T5 49.794 B); F-135-T1-1 (T10 lưu output kiểm lúc đóng).

## 9. Stage (KHÔNG push)

- File LIMITS này: `docs/PHASE9_ROUND135_T1_VERIFY134_LIMITS.md`.
- Stage file: `repo-1-push/paths-loop/phase9-round135-t1-verify134.txt` (1 entry,
  NUL-delimited, verify read-back, 0 binary).
- Hồ sơ làm việc: `hidden_files/round135-t1/` (`count-135.py`,
  `verify-ghost-recompute.py` + `verify-ghost-recompute.out`).
- Cờ: `hidden_files/round135-t1.done` (dòng đầu: verdict một dòng).
- Chốt chặn `round-in-progress.md` KHÔNG xóa (việc của T10).
