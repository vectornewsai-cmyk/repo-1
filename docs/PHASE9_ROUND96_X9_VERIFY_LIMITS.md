# PHASE9_ROUND96_X9_VERIFY_LIMITS — Kiểm chứng độc lập toàn bộ đợt 96 (X9 + X9b)

> Luồng X9 (gốc) + nối tiếp X9b sau reboot #18. Lượt cron 15:35 +07 12/11/2026.
> Repo `~/workspace/repo-1` (cây làm việc, HEAD GitHub vẫn `5f548ef8`).
> **KHÔNG push. KHÔNG release/tag. Không sửa production trong luồng này.**
> Scratch: `hidden_files/round96-x9b-*` (poll, verify, O8, status). File X9 gốc
> (`round96-x9-*`) không bị ghi đè.

## 0. Dòng thời gian + phương pháp

- Đợt 96 spawn 15:35 +07 12/11 (08:35Z), 9 luồng X1–X9. **Reboot #18
  09:24:17Z (boot mới `04b83831`)** giết X1/X4/X5/X6/X9 giữa chừng (xem §3.5
  — "giết" là nói gọn: X4/X5/X6 có dấu vết hoạt động ngắn sau reboot rồi mới dừng).
- X9 gốc poll đĩa 9 lần 08:41–09:21Z rồi chết theo reboot. X9b spawn 10:10Z,
  nối tiếp: poller `round96-x9b-poll.sh` (PID 20879, 20×5 phút, log
  `round96-x9b-poll.log`), deadline ~100 phút (~11:50Z).
- **Poll 6, 10:35:47Z: all-landed=1 — cả 8 luồng X1–X8 đã về** (LIMITS + batch
  trên đĩa). Không luồng nào phải kết luận "mất": X5b là luồng về cuối cùng
  (10:35:11Z), sau khi chạy thêm 2 lượt probe (chr-blur-r6, chr-delay-r1,
  driver xong 10:28:27Z) rồi mới viết LIMITS. Poller kết thúc 10:35:47Z.
- Kiểm chứng chạy trên cây gộp tại thời điểm đó: suite offline 10:23:37Z
  (trước khi X5 hạ cánh — nhưng X5 không sửa production, chỉ thêm 2 file
  probe + LIMITS; `preview.tsx` mtime 09:41:00Z và `media.ts` 09:56:43Z
  không đổi sau suite, nên kết quả suite vẫn đứng), O8 10:37–10:39Z (sau
  khi X5 hạ cánh, trên cây cuối cùng).
- Đối chiếu số headline: đọc file thô/JSON gốc trên đĩa cho cả 8 luồng,
  tính lại độc lập bằng script (pool G1, JSON blob, harmonic model, dbgFinal).

## 1. Kiểm chứng trên cây gộp — TOÀN XANH

### 1.1 Typecheck + build

| kiểm tra | kết quả |
|---|---|
| tsc web (`npx --prefix apps/web tsc --noEmit`) | exit 0 |
| tsc desktop | exit 0 |
| vite build (chạy đúng từ `apps/web`) | **✓ built in 6,15 s** (chạy lại 10:40Z; lần chạy trực tiếp trước đó 11,61 s) |
| vite build trong script verify (chạy từ repo root) | exit 1 — **lỗi cách chạy, không phải lỗi build**: `Could not resolve entry module "index.html"` vì vite tìm entry ở cwd sai. Đừng đọc exit này như build hỏng. |

### 1.2 Suite offline (log `hidden_files/round96-x9b-verify.log`, xong 10:23:37Z)

| test | kết quả |
|---|---|
| playheadHold90R2 | 44 passed, exit 0 |
| playheadPacing54K9 | 19 pass, 0 fail, exit 0 |
| previewEngine | 25 test passed, exit 0 |
| seek | 21 passed, exit 0 |
| seekSkipRender86N3 | 9/9 test pass, exit 0 |
| previewLoop50F2 | 20 passed, exit 0 |
| css60 (cssClasses60Q2) | PASS 60/60, exit 0 |
| css61 (cssClasses61R4) | PASS 60/60, exit 0 |
| Audit P7 (i18nAudit59P7) | **8/8 pass qua esbuild ESM bundle** (chạy lại 10:40Z: `P7 i18n audit round 59: 8/8 pass`). Bản chạy `node --experimental-strip-types` exit 1 — **lỗi runner**: `ERR_MODULE_NOT_FOUND` import không đuôi `./nestedPreview`, đúng như LIMITS đợt 95 §4 mục 8 đã ghi. Không phải lỗi audit. |
| orphans (binOrphan60Q7) | 17 pass, 0 fail, exit 0 |
| r6-i18n-check | PASS — dict vi==en==**2767 key** lá, 0 key mồ côi |
| U4 fail-fast | 141 pass, 0 fail, exit 0 |
| media (run-media-tests.mjs, X8) | blobPrefetch **25 pass**, captureThumb **2 pass**, retryPlay95W2 **7 pass** — 3/3 PASS |
| media.retryPlay96X3 (X3, esbuild) | 7 pass, 0 fail, exit 0 |
| media.stallWatchdog96X3 (X3, esbuild) | 9 pass, 0 fail, exit 0 |
| deint-fps-verdict (X6) | 17/17 ✓, exit 0 |
| vite-diagnosis-regex (X6) | 9/9 ✓, exit 0 |
| Xvfb lock test | PASS (không lỗi), exit 0 |

### 1.3 O8 — 21/21 cả 2 engine (log `hidden_files/round96-x9b-o8.log`)

| engine | thời gian | kết quả |
|---|---|---|
| Chromium (:189/5552/9652) | 10:37:19–10:38:10Z | **21/21 pass, 0 fail, 0 note** — S5 Δx=0,112 (kỳ vọng 0,112); S7 bóng Δx=0,113, mask Δx=0,112 |
| WebKit (:190/5562/9654) | 10:38:10–10:39:00Z | **21/21 pass, 0 fail, 0 note** — S5 Δx=0,194 (kỳ vọng 0,194); S7 bóng Δx=0,197, mask Δx=0,194 |

Số Δx khớp **đúng từng chữ** với O8 của X2/X3 trên cùng cây (Chromium
0,112/0,113; WebKit 0,194/0,197) — mask-track ổn định qua cả 3 lượt chạy
độc lập trong đợt 96.

## 2. Đối chiếu từng luồng — số headline KHỚP, 3 lỗi doc nhỏ

### 2.1 X1/X1b — blob 2 MiB: KHỚP, giả thuyết vẫn MỞ

- JSON `webkit-blob-flaky-96x1-2mib.json` (36 case): blob 17/18 strict
  (playOk), 18/18 loose (frames>0); prog 18/18; bogus **0/36** GST log
  (grep độc lập 0 trong cả 18 log blob). Fail duy nhất Lc2-x1-blobA-run5:
  errEvents t=1,98 s, 80 frame, ct 7,042, playing t=2,88 (W2 retry cứu)
  — khớp LIMITS §3.
- Rerun W1-exact `webkit-blob-flaky-96x1b-w1rerun.json` (24 case): blob
  strict 3/12, loose 11/12, prog 12/12; bogus trong 8/12 log (c2 5/6,
  c8 3/6), giá trị **đúng y** W1 (c2 541230788, c8 2991868683 — 4 byte tại
  offset 2 MiB); 8/9 fail có bogus; gộp lịch sử fail⇒bogus 39/42 = 93%.
- Kết luận §7 đứng: bogus tái hiện với probe nhẹ của W1 nhưng không với
  probe nặng-log của X1 — hiệu ứng thiết bị đo/cửa sổ; giả thuyết 2 MiB
  vẫn MỞ, cần test biến số độc lập ở cửa sổ yên.
- Lỗi doc nhỏ: file LIMITS 373 dòng lặp lại bảng giả thuyết §6 sau §9.

### 2.2 X2 — ghost-blend fix: KHỚP

- assert96b log: B gStdMed 37,6/37,5/37,5, spreadMed 0,8, spreadMax 77,5,
  nGroups 69, ASSERT PASS. assert96c: E t=1 gStdMed 83,9 (nG=12),
  spreadMed 0,8, spreadMax 74,9, nGroups 14, ASSERT PASS.
- Headline: median 37,5 mọi case B–E, triple 73–78%, ~19–25% mẫu vẫn
  double-count 84,6 (giả thuyết capture mislabel, chưa đóng — X5 §1.3
  nay giải thích: phần còn lại là double-count do presented lệch).
- tsc 0, build 8,72 s, ghostBlend 15/15, previewEngine 25/25, seek 21/21,
  Hold 44/44, Pacing 19/19, O8 21/21 cả 2 engine (10:01–10:06Z).

### 2.3 X3 — retry-play mở rộng: KHỚP (1 câu chữ chưa chính xác)

- JSON `webkit-blob-flaky-96x3.json` (128 case). Định nghĩa quan trọng:
  probe `playOk`=False ngay cả khi `play()` reject rồi phát lại thành công
  (38/80 blob theo playOk vs 67/80 theo failKind); X3 dùng failKind==ok
  (+finalCt≥1) như W2 — nhất quán.
- MATRIXA20 blob 21/24 loose+strict (run 1–3: 10/12, run 4–6: 11/12),
  7/7 error-event được cứu (retry95-fired, errT 0,51–1,19 s); NOPROXY
  2/8 → 6/8, 3/3 error-event cứu bởi retry96X3; NPT 8/8 → 7/8; TICK
  11/12 → 12/12, 1 watchdog rescue (Lc6-blobA20T-run6: 269 frame,
  ct 11,209); 0 marginal trong 128; 0 runError; errT−playCalled lớn nhất
  2,16 s (Lc6-blobNP-run2), 0 case >3 s.
- **Chưa chính xác:** §1 viết "errT lớn nhất 1,19 s" chỉ đúng cho subset
  MATRIX-A proxy, không đúng cho cả 80 case blob (max toàn bộ 2,16 s).
  Claim thực chất (không case >3 s) vẫn đứng.
- Unit 7/7 + 9/9; retry95W2 7/7; blobPrefetch 25/25; tsc 0; build PASS;
  seek 21/21; O8 21/21 cả 2 (Δx 0,112/0,113 Chromium, 0,194/0,197 WebKit).
- WebKit hỏng sau reboot #18 (thiếu libevent…): X3 đã sửa bằng libevent.deb
  + webkit `install-dependencies.sh` (LIMITS §7).

### 2.4 X4/X4b — re-arm ceiling: KHỚP, nợ CHƯA đóng

- Analyzer output `round96-x4b-analysis/analyze-b1b2b3b4cb5.txt`,
  `analyze-c1/c2.txt`: pre-fix re-arm 2, CANCELLED=0, DELAYED=2 (b1, b2).
- dt-clamp 0,35 s **BỊ BÁC**: pre-fix 23/56 (41%) tick khỏe vượt nó;
  post-fix c1 5/20 (25%), c2 0/34 (0%); gộp 28/110 (25%).
- Post-fix c1 NOT-DUE, c2 0 re-arm — **0 CANCELLED ngoài đời**; nợ KHÔNG đóng.
- Ceiling 5000 ms: 0 ứng viên / 7 lượt, 0 lần release.
- tsc 0, build 6,37 s, Pacing 19/19, Hold 44/44, seek 21/21, seekSkip 9/9,
  previewLoop 20/20. O8 không chạy lại (dựa O8 của X2 trên cùng
  preview.tsx mtime 09:41:00Z — nay X9b chạy lại O8 21/21, §1.3).

### 2.5 X5/X5b — blur parity + memo self-heal: KHỚP, 1 lỗi số học nhỏ

- Bảng cụm §1.1 khớp file phân tích: r6 D 2/0,307, A 160/0,440, B 68/0,771,
  C 4/1,000; delay D 1/0,303, A 137/0,440, B 59/0,774, C 41/0,999
  (`round96-x5b-analysis-r6.txt`).
- **Mô hình harmonic tự tính lại độc lập** (sóng vuông, trọng số 1/h,
  harmonic lẻ tới h=31, a=1,41 rad/khung): triple 0,448 (LIMITS 0,446),
  pair 0,743 **= khớp**, double-count 0,776 **= khớp**, pair cách-2 0,313
  (LIMITS 0,307; đo 0,305–0,307), {K-4,K-2,K} 0,330 (LIMITS 0,327).
  Kiểm tra đối chứng: sinusoid đơn cho triple 0,440 / pair 0,762 — khớp
  đúng số LIMITS nêu. Kết luận **D = pair cách-2** đứng; {K-4,K-2,K} bị bác.
- Zombie pump khớp dbgFinal thô: r5 c0 43/132, c1 44/132, c2 89/86;
  r4 c0 20/15, c1 22/15.
- Blind windows khớp: wk-blur-r4 c0 1409/c1 1984 ms; wk-blur-r5 c0 2031/
  c1 2132 ms. Exp A: fb 2804/6500 = +199/+98 ms sau hết stall (stall kết
  thúc 2605/6402). Exp A2: liveness 12 callback, ct 0,003→2,006, fbAt
  c0=1215 — khớp driver log.
- **Quyết định §5 đứng:** KHÔNG triển khai tự hồi memo — Exp A: 2 kill,
  0 arm; Exp A2: 1 kill, 0 arm; cấu trúc hiện tại (ngưỡng 2 kill + guard
  callbacksSeen + tái dùng element + callback ~33 ms vs ngưỡng kill
  1000 ms) gần như loại trừ arm oan. Không sửa production trong X5.
- **Lỗi số học nhỏ §1.4:** "n=42 (38 blur fix-1 + 4 stall + 3 fix-3)"
  — 38+4+3=**45**; bảng §1.1 cộng lại cũng = 45
  (6+0+32+0+4+2+1). Số đúng là **45**, không phải 42.
- Phát hiện mới §2.1 (element đóng băng chặn watchdog) và §6 (zombie pump)
  đã ghi rõ, chưa sửa — đúng phạm vi.

### 2.6 X6/X6b — G1 evidence v8: KHỚP, G1 vẫn MỞ

- Chạy lại `round96-x6/analyze-pool96x6.py`: 60fps pool n=37 median 0,980
  PASS 35/37 (95%) CI [0,927;1,027]; 60fps quiet n=10 median 0,970 10/10;
  30fps pool n=53 median 0,990 PASS 44/53 (83%); quiet 30fps n=14 median
  0,955 PASS 10/14 (71%) — 2/3 tiêu chí strict; 60fps run4 làm tròn 1,20
  vs báo cáo 1,19 đã giải thích ở LIMITS §5.1 (ratios mean 1,194).
- Cả 13 lượt X6 KHỚP. **G1 vẫn MỞ, quyết định thuộc parent/user.**
- Metric M2 đã cài + test; E1 timeout fix đã được X6b re-verify bằng
  fault-injection (exit 2 sau 15 s, đúng chẩn đoán "port in use").

### 2.7 X7 — EPERM probe #15: KHỚP

- Probe #15 08:40:51Z, boot a3a13d5a, ok=2 fail=0 (xác minh trong
  `eperm-probe-v2.log` + heartbeat n=15). Khoảng mù #14 ~181 phút chứa
  reboot #16 (~07:26–07:34Z, boot adcef40a) và #17 (08:01:15Z exact).
- Scan: 269 dòng / 94 file, R7b 294, cross-check exact (lần thứ 3 liên
  tiếp 0 diff); async writeFile ngoài helper: 0. RAM 551/507/537/869 MB
  (507 MB thấp nhất từng ghi). birefnet KHÔNG chạy (đúng luật).

### 2.8 X8 — harness: KHỚP, 2 lỗi doc nhỏ

- `run-media-tests.log` của chính X8: blobPrefetch **25** pass,
  captureThumb 2, retryPlay95W2 **7** pass (tổng 34) — nhưng LIMITS §3
  ghi 26 / 2 / 8 (tổng 36 ≠ 34). **Log đúng, bảng LIMITS sai 2 số.**
- Các claim khác đã xác minh: thresholdNoiseLimited không tới được
  (noise=0, rawThreshold 0,0001, false); GST doErr/doDbg log có prefix
  360.116 B / 408.653 B; register-first A/B không kết luận (load lấn át);
  4 case MATRIX-r1 không cứu được (đã xác minh trong analysis-cases.json);
  O8 headed 21/21; O8 webkit lúc đó BLOCKED (thiếu libavif.so.16 sau
  reboot — X3 sửa sau, X2/X3 chạy O8 webkit 21/21 sau fix).
- tsc 0, seek 21/21, Xvfb lock 8/8.
- File mới `run-media-tests.mjs` header ghi "đợt 96, luồng X8" nhưng
  **không chứa literal "Đợt 96 X8"** (grep 0) dù LIMITS nói marker có ở
  mọi chỗ đổi — lỗi chính xác doc nhỏ.

## 3. Va chạm đo giữa luồng + đính chính (đã kiểm chứng từ đĩa)

### 3.1 Vite 5173 pid 1983 chết — đính chính của parent SAI, X2 đúng

Build-loop-log ghi reboot #18 giết vite 1983 trước lượt 3 của X2. Bằng chứng:
vite 1983 start 09:26Z (**sau** reboot 09:24:17Z), phục vụ lượt 2 của X2
(09:32–09:35Z) và A/B rep3 của X8; log của X8 (`round96-x8.md`, "Cập nhật
cuối lượt"): "Vite 5173: pid 8148 (chết theo reboot) → pid 1983 sau reboot
→ đã kill cuối lượt, HTTP 000." Vậy **X8 kill 1983 cuối lượt của nó
(~09:35–09:40Z)**. Reboot #18 giết vite **8148** (vite chung trước reboot),
không phải 1983. Câu "chết không rõ lý do, không reboot mới" của X2 là
trung thực tại thời điểm đó.

### 3.2 Edit preview.tsx 09:28:20Z — X8 ghi sai tác giả

LIMITS X8 §4.2 nói "X4 sửa preview.tsx 09:28:20Z (+2.687 byte, resume-stall
watch)". X2 LIMITS §0 (epoch 1794475700) + md của X2: 09:28:20Z là **fix
capacity của X2** (ring frames−1 → frames); LIMITS X4 §0: fix của X4 là
09:22–09:23Z; X4b §6.3 đồng ý 09:28:20Z = X2. +2.687 B của X8 có lẽ là tăng
trưởng gộp qua cửa sổ reboot (edit X4 + fix capacity X2). X8 đã loại đúng
ON 3 cho mid-pass HMR bất kể điều này.

### 3.3 X2 sửa preview.tsx 08:58:45Z giữa lượt đo của X5

Lượt 1–2 của X6 chạy code cũ, lượt 3–5 code mới — không ảnh hưởng số deint
(D1 MAD 0,3835 giống hệt 5/5). Mọi lượt của X5 đều sau fix (md5 fd588ca0).

### 3.4 Va chạm Xvfb :197 giữa X5 và X8 — kẻ giết KHÔNG xác định được

Sự cố pkill của X5 ~09:07Z tự SIGTERM shell của nó; X5 dọn Xvfb :197 như
mồ côi. X8 claim :197 lúc 09:07:35.990Z, Xvfb lên 09:07:42Z, calibration
xong 09:08:27Z; lượt C chết ~09:09:13Z ("X connection error", browser đóng).
Driver khởi động lại của X5 (09:09:40Z) dùng **:193, không phải :197** — nên
restart của X5 không lấy :197. Nguyên nhân :197 chết vẫn chưa biết (LIMITS
X8 §8.5 nói trung thực như vậy).

### 3.5 Reboot #18 — session resume ngắn, không phải kill sạch

Bằng chứng: LIMITS X6 xong 09:24:40Z (23 s sau boot mới); file probe X5
mtime 09:24:34Z; X4 sửa preview.tsx 09:28:20Z (sau reboot); file probe X3
mtime 09:26:56Z. Vậy session X4/X5/X6 resume ngắn sau reboot rồi mới dừng
ở các thời điểm khác nhau; X1 (dấu vết cuối 09:15Z) và X9 (poll cuối
09:21:27Z) không có hoạt động sau reboot. Câu "reboot #18 giết X1/X4/X5/
X6/X9" của parent là **không chính xác với X4/X5/X6**.

### 3.6 Edit preview.tsx của X4 và X2 xen kẽ sạch

Mtime cuối 09:41:00Z (nhãn X2); marker X2 ×16 + X4 ×5 nguyên vẹn; tsc 0
sau cả hai. X5 không sửa production nên không có va chạm thêm.

### 3.7 Mâu thuẫn rerun X1 vs probe X1 là phát hiện §7, không phải lỗi dữ liệu

Bogus tái hiện với probe nhẹ của W1 nhưng không với probe nặng-log của X1
— hiệu ứng thiết bị đo/cửa sổ (xem §2.1).

## 4. Read-back batch + tổng chờ push

- **Đợt 96: 8 batch / 38 entry / 37 unique, 0 binary, 0 workflow, mọi entry
  tồn tại trên đĩa** (read-back đầy đủ, §4.1). File duy nhất trùng trong đợt:
  `apps/web/src/preview.tsx` xuất hiện 2 lần (batch X2 + batch X4).
- Marker file chung (cây cuối): `apps/web/src/preview.tsx` "Đợt 96 X2" ×16,
  "Đợt 96 X4" ×5; `apps/web/src/media.ts` "Đợt 96 X3" ×11, "96X3" ×25.
- **Tổng chờ push đợt 67–96 (đếm lại từ đĩa): 297 batch / 2266 entry /
  1354 file duy nhất** (HEAD vẫn 5f548ef8). Đối chiếu: đợt 67–95 là 289 /
  2228 / 1330 — khớp đúng số LIMITS gộp đợt 95, nên phương pháp đếm đã
  được kiểm chứng. 13 file đợt 96 đã từng xuất hiện ở đợt 67–95 (sửa lại
  trong đợt 96).

### 4.1 Từng batch đợt 96

| batch | entry | trạng thái |
|---|---|---|
| phase9-round96-x1-blob-2mib.txt | 5 | OK |
| phase9-round96-x2-ghost-fix.txt | 3 | OK |
| phase9-round96-x3-retry-play-ext.txt | 6 | OK |
| phase9-round96-x4-rearm-ceiling.txt | 8 | OK |
| phase9-round96-x5-webkit-blur.txt | 3 | OK |
| phase9-round96-x6-g1-evidence8.txt | 5 | OK |
| phase9-round96-x7-eperm-probe.txt | 1 | OK |
| phase9-round96-x8-harness.txt | 7 | OK |

## 5. Nợ mở cho đợt 97+ (cập nhật từ §4 LIMITS gộp đợt 95)

1. **2 MiB:** vẫn mở — cần test biến số độc lập: probe nhẹ kiểu W1 trong
   cửa sổ yên, hoặc probe nặng của X1 với log giảm.
2. **Ghost double-count ~19–25%:** vẫn mở — cần pump event log; giả thuyết
   capture mislabel nay có thêm giải thích (presented lệch, X5 §1.3).
3. **Retry-play lỗi muộn (>3 s):** vẫn chưa tái hiện trực tiếp (max đo được
   2,16 s trong 128 case).
4. **Re-arm grace:** 0 lần CANCELLED ngoài đời; ceiling 5000 ms: 0 lần release.
5. **Blur parity:** D đã định danh (pair cách-2) nhưng tần suất fix-3 mới đo
   1 lượt (n=2, chỉ đầu clip); cần thêm lượt chr-blur fix-3 + wk-blur.
   **Memo self-heal: ĐÃ QUYẾT — KHÔNG triển khai** (2 thí nghiệm âm tính,
   §2.5); giữ ở mức đề xuất + số đo, chỉ xem lại nếu xuất hiện hạn hán
   callback toàn cục đầu phiên (2 kill với 0 callback — chưa từng thấy).
6. **Watchdog đóng băng (mới, X5 §2.1):** kill theo thời gian cả khi frame
   không tiến; tick cưỡng bức counterfactual cứu ~1111 ms ở wk-blur-r5 c1.
7. **Memo c2 blind thật ~0,4–0,5 s** khi chuyển clip chậm (không phải ~0,1 s
   như W3): cần thêm lượt wk-blur với caps dày.
8. **B-band WebKit n=5:** cần thêm lượt wk-blur để tách pair/double-count
   (trình chiếu thưa: snapshot cách nhau ~18 khung ≈ bội chu kỳ sọc).
9. **G1: vẫn MỞ** — quyết định thuộc parent/user (bằng chứng 60fps mạnh:
   pool n=37 median 0,980, PASS 95%; 30fps 44/53 = 83%).
10. **EPERM probe #16 + khoảng mù #15:** đang chờ (đề xuất cron 10 phút vẫn
    chờ user quyết).
11. **Zombie pump (mới, X5 §6):** kill pump ngay khi clip đổi hoặc loại
    capture zombie khỏi thống kê theo clip (số liệu theo clip phồng ~40%).
12. **Harness:** mainDraws/draws cắt 400 mẫu cuối (mất timing đầu lượt dày);
    tăng cap hoặc ghi tóm tắt timing live như ringFirstAt.
13. **TTS 39 CẤM kiểm lại. birefnet 0 lần thành công** — chỉ thử lại khi RAM
    đổi (u2net là fallback chính thức).
14. `.github/workflows/ci-security.yml` vẫn 403 chờ user. Release gate không
    đổi: không release/tag cho tới khi ngang hoặc hơn CapCut thật.

## 6. Batch đã stage (KHÔNG push)

- `phase9-round96-x9-verify.txt` — 1 entry, read-back OK, 0 binary,
  0 workflow:
  - `docs/PHASE9_ROUND96_X9_VERIFY_LIMITS.md` (file này)
