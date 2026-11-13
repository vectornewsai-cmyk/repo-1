# PHASE9 ROUND91 — S9: Kiểm chứng độc lập S1–S6 (VERIFY LIMITS)

Ngày: 12/11/2026 (lượt cron 00:35 +07; S9 làm việc 17:38–19:15Z 11/11/2026).
Repo: `~/workspace/repo-1`. KHÔNG push. KHÔNG release/tag. KHÔNG sửa code
production (S9 chỉ chạy lại test/harness + đọc đĩa; file mp4 copy tạm vào
`apps/web/public/` để đo assert đã xoá sau khi đo xong).
Theo skill `verify_delegated_work`: S1–S6 hạ cánh muộn (S1 18:52, S3 18:57),
S9 kiểm tra lại đĩa nhiều lần (17:38, 17:49, 17:59, 18:10, 18:21, 18:31,
18:42, 18:52) trước khi kết luận; không luồng nào bị kết luận thiếu khi
chưa kiểm tra đĩa.

## 0. Kết luận ngắn — từng luồng S1–S6

| Luồng | Kết luận S9 | Bằng chứng chạy lại chính |
|---|---|---|
| S1 motion blur rVFC | **XÁC NHẬN** | Assert A–E chạy lại **100/100 ✅, 0 ❌, exit 0**; unit previewEngine 20/20; O8 21/21 cả 2 engine |
| S2 playhead sawtooth | **XÁC NHẬN** | Unit 25/25 + previewLoop50F2 20/20 + seek 20/20 + seekSkipRender 9/9; probe WebKit tự chạy lại: **0 re-seek**, stall 307 ms giữ ph +0,000 s; O8 21/21 cả 2 engine |
| S3 WebKit clip D | **XÁC NHẬN, kèm 4 lưu ý** (§3) | Đếm lại JSON từ đĩa: bảng load-play khớp từng số; LOOP 0/8 vs 8/8 qua `loopsCompleted`; ERR 5/5 + retry 2/2; flip-flop xác nhận trên element id 7 (29 lần đổi src) |
| S4 fallback warn ext | **XÁC NHẬN** | Test mới chạy lại **60/60, exit 0**; P1 chạy lại **30/30**; `render.js` không đổi trong đợt 91 |
| S5 i18n văn bản | **XÁC NHẬN, NHƯNG 1 hồi quy trên cây gộp do S1** (§5) | Dict đếm lại 2517/2517; chạy lại đủ 17 test đã bump + validateCodes 1596/1596: **16/17 xanh, Audit P7 7/8** — literal mới của S1 ở `preview.tsx:1112` |
| S6 G1 evidence v3 | **XÁC NHẬN** | Deint test 12/12; report JSON E1/60fps khớp từng số; script gộp pool chạy lại khớp (30fps 24/30 = 80%, 60fps 12/14 = 86%); G1 vẫn CHƯA ĐÓNG (S6 không tự đóng — đúng) |

**Hồi quy chéo cây cuối (S9 chạy):** tsc web **0**, desktop **0**; vite build
**PASS 6,24s**; O2 render **25/25**; O8 Chromium **21/21** + WebKit **21/21**
(S9 tự chạy, xem §6). Marker S1 (`rvfcPumps`) và S2 (`resumeWatches91S2`)
cùng tồn tại trong `preview.tsx`, không ghi đè nhau.
**Batch đợt 91 verify read-back: 49 entry / 8 file, 0 thiếu, 0 binary,
0 file workflow** (§7). S9 stage thêm 1 entry (file LIMITS này).

## 1. S1 — Motion blur preview qua rVFC: XÁC NHẬN

### 1.1 Chạy lại assert A/B/C/D/E (harness S1, 5 pass/case, vite 5173)

S9 chạy lại toàn bộ trên cây cuối, spec gộp a/b/c (round90-r1) + d/e
(round91-s1), media copy tạm vào `public/` rồi xoá sau đo:
**exit 0, 100 ✅, 0 ❌, "ASSERT PASS: tất cả kiểm tra xanh"**
(log `hidden_files/round91-s9-s1-assert.log`, JSON
`~/workspace/round91-s9/out/preview-abcde-assert.json`).

Đối chiếu số chạy lại với LIMITS S1 §2.1 (biến thiên theo lượt chạy như
chính S1 đã cảnh báo — gStd median đổi theo pha cửa sổ/tải):

| case | trail (S1 → S9) | edgeL/R med (S1 → S9) | gStd med t=0.5/1/1.5 (S1 → S9) | spread med (S1 → S9) | rvfc |
|---|---|---|---|---|---|
| A | 0/242 → **0/325** | 2.0/2.1 → 2/2.1 | 111.8/112/111.9 → 111.8/111.9/111.9 | 0.2 → 0.2 | active, fallback "" |
| B | 0/366 → **0/364** | 1.2/2.1 → 1.2/2.1 | 60.7/82.9/83.7 → **38.4**/82.9/82.9 | 0.0 → 0 | active, fallback "" |
| C | 0/356 → **0/372** | 2.0/2.1 → 2/2.1 | 60.7/82.6/82.3 → **38.5/38.4/38** | 0.6 → 0 | active, fallback "" |
| D | 0/360 → **0/373** | 1.7/4.0 → 1.4/3.9 | 83.7/38.3/83.5 → **38.4**/38.3/37.9 | 0.3 → 0 | active, fallback "" |
| E | 0/302 → **0/318** | 56.5/58.4 → 56.5/58.4 | 82.6/83/37.8 → **38.4**/82.9/60.6 | 1.3 → 0.9 | active, fallback "" |

- Trail = 0 mọi khung cả 5 case; mép khớp trong 0,3px; E feather
  56.5/58.4 khớp chính xác pause như S1 nói; spread median 0–0,9 (ngưỡng
  ≤15); `rvfcActive=true`, `rvfcFallback=""` mọi case — không fallback lần
  nào. gStd median đổi giữa các lượt (38 ↔ 60–83) đúng như S1 §2.1 đã ghi:
  chỉ khóa bất đẳng thức ≤0,85×baseline, cả hai lượt đều là blur thật.
- Đếm lại từ JSON gốc của S1: log assert của S1 có đúng **100 ✅ / 0 ❌**;
  trailEdge/spread/dbg trong `preview-abcde-assert.json` khớp bảng S1
  (captures delta trong bảng S1 lệch ±1 so với cách tính theo dbg đầu–cuối
  trong case — do counter tích lũy qua các case, không đáng kể).
- Unit chạy lại (strip-types, đúng runner từng file): previewEngine
  **20/20** (17 cũ + 3 mới rvfcFrameDecision/rvfcSupported).
- Click-test O8 S1 ghi trong LIMITS (21/21 cả 2 engine) — S9 chạy lại
  độc lập, xem §6: **21/21 cả 2 engine**, khớp.

### 1.2 Lưu ý S1 (không phải lỗi, ghi để parent biết)

- S1 tự ghi (§4): watchdog/fallback chưa từng kích hoạt thật (chỉ kiểm
  bằng `--disable-rvfc`); WebKitGTK rVFC chưa đo bằng pixel; gStd nhận
  3 giá trị rời rạc theo pha. S9 không đo thêm các mục này.
- **Phát hiện chéo S9 (xem §5):** S1 thêm 1 literal tiếng Việt hardcode
  ở `preview.tsx:1112` (`console.error("[preview] rVFC motion blur lỗi,
  fallback về snapshot theo tick:", err)`) làm Audit P7 trên cây gộp
  còn 7/8. Đây là console-only, không phải UI, nhưng phá pin 8/8 của S5.

## 2. S2 — Playhead/canvas sync, sawtooth WebKit: XÁC NHẬN

### 2.1 Unit + JSON từ đĩa

- Chạy lại (đúng runner strip-types): `playheadHold90R2.test.ts`
  **25/25** (14 cũ + 11 mới S2-R1..R11), `previewLoop50F2.test.ts`
  **20/20**, `seek.test.ts` **20/20**, `seekSkipRender86N3` **9/9**.
- Marker có mặt trên cây cuối: `preview.tsx` chứa cả
  `forwardSeekCompletedThisTick` / `resumeWatches91S2` /
  `playheadHeldResume` (12 match) lẫn marker S1 (12 match) — không ghi
  đè nhau; `PLAYHEAD_RESUME_STALL_GRACE_MS = 1500` +
  `shouldHoldForResumeStall` có trong `playheadHold90R2.ts`.
- JSON sau sửa đếm lại từ đĩa (khớp LIMITS S2 §3 từng số):
  tải `lagAfterMax 0.4536 / steadyLagMean 0.3062`, yên `0.5484 / 0.204`,
  playhead lúc seek xong = 0,5, lúc canvas đổi = 0,5 cả 2 lượt.
- Số trước sửa S2 trích (0,781/1,014 tải; 0,748/0,793 yên) còn trong
  console log (`probe-webkit-load-console.log`: lagAfterMax=0.7814,
  steadyLagMean=1.0137; `probe-webkit-quiet-console.log`: 0.7484/0.7927)
  — JSON trước sửa đã bị ghi đè như S2 tự khai ở §4, không phục hồi
  được, nhưng console log đủ để đối chiếu.

### 2.2 Probe WebKit tự chạy lại (phase `s9verify`, không ghi đè file S2)

S9 chạy `probe91s2-playhead-sawtooth.mjs --engine webkit --phase
s9verify` trên cây cuối (yên, không tải): **exit 0, VERDICT PASS cả 2
chỉ tiêu R2** (playhead lúc seek xong 0,5; lúc canvas đổi 0,5).
Phân tích bằng `analyze91s2-sawtooth.mjs` trên JSON mới:
**0 re-seek sau seekDone**; stall 307 ms (231→538 ms) với playhead tăng
**+0,000 s** trong lúc element đứng yên (giữ đúng); lag sau seekDone
max 0,083 s, mean 0,022 s. Lag thấp hơn số sau sửa của S2 (0,548/0,204)
vì lượt S9 yên hẳn (không còn luồng sibling), còn S2 đo dưới tải —
đúng với cảnh báo "chỉ tiêu chính là hành vi giữ, không phụ thuộc tải"
của S2 §4.
- O8: S2 ghi "đang chạy, chưa claim" và không để lại log O8 nào trong
  `hidden_files/round91-s2/` — S2 chưa hoàn tất O8. S9 chạy lại O8 độc
  lập trên cây gộp S1+S2, xem §6: **21/21 cả 2 engine**.

## 3. S3 — WebKit clip D (bitrate / chẩn đoán / swap-trượt / error handler): XÁC NHẬN, KÈM 4 LƯU Ý

### 3.1 Đếm lại JSON từ đĩa (loại đúng 16 case nhiễm, index 37–52)

`benchmarks/results/webkit-clipd-bitrate-91s3.json`: 79 case. Đếm lại
chỉ các case load-play hợp lệ (`Lc*`, trừ index 37–52):

| clip | blob (S3 → S9) | progressive (S3 → S9) |
|---|---|---|
| c2 2,0 MB | 1/2 → **1/2** | 2/2 → **2/2** |
| c4 4,0 MB | 2/3 → **2/3** | 3/3 → **3/3** |
| c6 5,9 MB | 3/3 → **3/3** | 3/3 → **3/3** |
| c8 7,8 MB | 3/6 → **3/6** | 6/6 → **6/6** |
| c8 + delay 1 s | 3/3 → **3/3** | 3/3 → **3/3** |
| c10 9,7 MB (skipped → prog) | 3/3 → **3/3** | 3/3 → **3/3** |

- Progressive tổng **20/20** (bảng S3 cộng đúng 20/20); blob eligible
  tổng 15/20 với rerun (xem lưu ý (b) dưới). 16 case nhiễm index 37–52
  đều mang chữ ký S3 nêu (playErr null + 0 frame): **16/16**.
- LOOP rút gọn: `loopsCompleted` trong JSON — blob 0/8 (0,0,1,0,1,0,1,1
  vòng so với target 5/3/2/2, không run nào đạt target), progressive
  8/8 — **khớp S3**. (Đếm theo frames>0 sẽ ra 2/8 — sai tiêu chí; tiêu
  chí đúng là hoàn thành target vòng.)
- (d) Error handler: 5 case ERR hợp lệ, srcTrace đều
  `http → blob → http` **5/5**; retry 2/2 (ERR-run10/11):
  **192 frame, ct = 8, playedAfterRetry true** — khớp S3.
- (c) Swap-trượt app thật (`webkit-clipd-appswap-91s3.json`): 3 run đo
  được run10/11/20. Run20 (có id element): element **id 7**, 116 mẫu
  src, **29 lần đổi blob↔http trên cùng element**; play đầu trên blob
  lúc t=11,39 (ct=0) ở cả 3 run; phát lại sau pause lúc t=17,31 dùng
  **http, ct=3,33** — khớp từng số S3 nêu (ct 0,43/0,77/2,13/2,5/3,07/
  3,33). Canvas đổi thật (`canvasChanged true`) cả 3 run. Flip-flop
  **ĐÃ XÁC NHẬN**. Lưu ý: run10/11 không ghi id element (bản probe cũ
  hơn) nên chứng minh "cùng element" chỉ chắc ở run20.
- Unit `media.blobPrefetch90R3.test.ts` chạy lại (esbuild bundle như
  header ghi — strip-types trực tiếp lỗi `ERR_UNSUPPORTED_DIR_IMPORT`
  do `media.ts` import `./lib`, không phải hồi quy): **19/19**.

### 3.2 Lưu ý S3 (không làm sai kết luận chính, nhưng parent cần biết)

(a) **Chữ ký GST_DEBUG 570402281 — S3 trình bày chưa đầy đủ.** S9 grep
    toàn bộ log `~/workspace/round91-s3/gst-debug-*.log`: chữ ký có trong
    `c8-blob-run1` (1×), `run12` (1×) như S3 nói, **nhưng cũng có trong
    `c8-blob-run2` (2×) và `run3` (2×)** — S3 không nhắc tới 2 log này.
    Cả 4 log run1/2/3 đều thuộc batch nhiễm 18:02–18:03 (mtime log khớp
    giờ batch nhiễm; play() không được gọi trong các run đó). Bức tranh
    đầy đủ: chữ ký có trong **4/4 log blob của batch nhiễm + 1/1 log
    stall thật (run12)**, 0 lần trong 4 log pass S3 nêu (run10/11 c8,
    run1/2 c10) và 0 lần trong mọi log prog. Nói cách khác chữ ký là
    marker của **race teardown lúc swap** (nổ cả khi chưa gọi play()),
    không phải bằng chứng "chỉ fail mới có". Kết luận cơ chế (fail ở
    tầng swap pipeline WebKit, không phải nội dung file) vẫn đứng — thậm
    chí được củng cố vì lỗi nổ trước cả play() — nhưng cách viết
    "2/2 log blob fail vs 0/4 log blob pass" làm người đọc tưởng chữ ký
    chỉ xuất hiện ở fail. S9 không sửa LIMITS S3 (verify-only).
(b) **Thống kê blobReadyMs không tái lập đúng.** S3 ghi "25 lần, min 71,
    median 250, max 1419 ms". S9 đếm lại: load-play hợp lệ n=17 (min 74,
    median 318); mọi case hợp lệ n=32 (median 190,5); mọi case n=41
    (min 51, median 189). Max 1419 khớp. Không cách đếm nào ra 25/250.
    Kết luận (fetch < 1,5 s) không đổi, nhưng đừng trích "median 250 ms".
(c) **Số case appswap: JSON có 10 case, không phải 8** như LIMITS § mở
    đầu ghi ("4 lần chạy đầu hỏng, 3 run đo được + 1 run fail"). Thực
    tế: 5 hỏng do harness (hidden input ×2, overlay ×3) + 1 run bán
    phần (APP-run2 18:46, secondPlayErr, không có srcLog) + 3 run đo
    được (run10/11/20) + 1 fail ở bước thêm clip (run21). Các claim đo
    được không đổi.
(d) **Số "17/17" progressive và "9/14" blob ở LIMITS §1 là số batch
    đầu** (trước rerun run10–12); bảng §1 cộng đúng 20/20 prog và
    15/20 blob có rerun. Tương tự, thời gian blob→http ở ERR "0,14 s"
    chỉ đúng run2/10/11 (run1: 0,32 s; run3: 0,34 s) — nên ghi là
    khoảng 0,13–0,34 s.

## 4. S4 — Mở rộng warn fallback keyframes: XÁC NHẬN

- Test mới chạy lại trên cây cuối: `node
  test_round91_s4_fallback_warn_ext.js` → **60/60 pass, 0 fail, exit 0**
  (~176 s; log `hidden_files/round91-s9-s4-test.log`, 60 dòng ✓).
  Khớp LIMITS S4 (A 13 + B 11 + C 7 + D 10 + E 6 + F 4 + G 6 + H 3).
- P1 chạy lại: `test_round88_p1_mask_fallback.js` → **30/30 pass, 0 fail**
  (log `hidden_files/round91-s9-p1-test.log`).
- `server/render/src/render.js` mtime 14:54 ngày 11/11 (trước lượt 91) —
  S4 không sửa production như đã claim. tsc web 0 / vite build pass đã
  chạy trong hồi quy chéo (§6).

## 5. S5 — i18n văn bản: XÁC NHẬN, NHƯNG 1 HỒI QUY TRÊN CÂY GỘP DO S1

### 5.1 Đếm lại từ đĩa (không qua test)

- Dict: **vi 2517, en 2517 key lá, cùng tập key, 0 key chỉ-một-bên,
  0 giá trị rỗng**; `motionTrack.title`: vi `"🎯 Theo dõi chuyển động"`,
  en `"🎯 Motion tracking"` — khớp S5.
- `TrackPanel.tsx:140` dùng `{t("motionTrack.title")}`; fragment thừa ở
  `MaskPanel.tsx` đã xóa (chỉ còn 1 tham chiếu MASK_LIMITS.md qua
  template `mask.tipUnsupported`); `StickerPanel.tsx:192` vẫn hardcode
  `🌟 Sticker` — đúng như S5 khai (ngoài brief, để parent quyết).
- `2516` còn lại trong `apps/web/src` chỉ là comment lịch sử (đã nối
  `+1 key đợt 91 S5 → 2517`); 17 file test pin `2517`.

### 5.2 Chạy lại toàn bộ suite pin của S5 (đúng runner từng file)

| Test | S5 claim → S9 chạy lại |
|---|---|
| i18nOrphans60Q4 | 16/16 → **16/16** |
| i18nAudit59P7 | 8/8 → **7/8 — FAIL** (xem dưới) |
| i18nSweep81I9 | 16/16 → **16/16** |
| i18nModals79G9 | 9/9 → **9/9** (cần `--format=esm`) |
| i18nModals80H7 | 13/13 → **13/13** (cần `--format=esm`) |
| ProjectMenu.i18n55L1 | 6/6 → **6/6** (cần `--format=cjs`) |
| codecProbeUi75C6 | 16/16 → **16/16** |
| saveToast31 / structuredNotes32 | 15/15, 12/12 → **15/15, 12/12** |
| reverseBadge / Compat / Playback / Toggle | 8/8, 10/10, 3/3, 3/3 → **khớp hết** |
| i18nRound57N4 / codecProbeDebts / errorDetail / speedWarn | 14/14, 14/14, 35/35, 5/5 → **khớp hết** |
| test_validate_codes (server/render/src) | 1596/1596 → **1596/1596** |
| validateCodes63R9 (mcp-server) | 53/53 → **không chạy lại** (cần build dist; dict đã đếm trực tiếp từ đĩa, không đổi) |

Lưu ý runner (lỗi của S9 lúc đầu, không phải hồi quy): strip-types trực
tiếp fail ở các test import extensionless (`./projectRepo`,
`./gopTrialDecode55L8`, `@repo-1/video-spec`) — phải bundle esbuild như
header từng file ghi; O4 cũng vậy (`--format=cjs`). S9 đã chạy lại đúng
cách và ghi rõ ở đây để lần sau khỏi mất công.

### 5.3 Hồi quy P7 7/8 — nguyên nhân S1, không phải S5

Check scan của P7 fail đúng 1 assert: tồn đọng literal phải là 0, nhận
1 — `preview.tsx::[preview] rVFC motion blur lỗi, fallback về snapshot
theo tick:`. Đó là `console.error` mới của **S1** tại `preview.tsx:1112`
(trong `catch` của pump rVFC), thêm vào lúc 18:02 — **sau khi S5 xong**
(S5 hạ cánh ~17:48, LIMITS ghi P7 8/8 đúng trên cây lúc đó). 4
`TRKEY-MISMATCH` còn lại trong scan là benign có sẵn (S5/R9 đã ghi).
**Mức độ:** thấp — console-only, không phải chuỗi UI người dùng thấy —
nhưng pin 8/8 của S5 nay đỏ trên cây gộp. S9 KHÔNG sửa (verify-only,
không đụng production): parent/closing quyết — hoặc cho literal này vào
allowlist của scan P7, hoặc đổi message sang tiếng Anh/ascii cho khớp
quy ước scan.

## 6. S6 — G1 evidence vòng 3: XÁC NHẬN (G1 vẫn CHƯA ĐÓNG)

- `node --test deint-fps-verdict-83k3.test.mjs`: **12/12** chạy lại.
- Report JSON từ đĩa khớp LIMITS §3 từng số: E1 run1 **8/10** (G5 0,73×
  FAIL, tỉ lệ 0/0,54/1,36/1,19/0,57, frozenSlots [0,1]); E1 run2
  **10/10** (G5 1,05× PASS, tỉ lệ 0,96/1,62/0,81/0,85/1,00); 60fps N10
  ratioMean **1,19 / 1,33 / 0,99** (4/4 cases mỗi lần), D1 MAD 0,3835
  (đọc từ JSON — S9 không chạy lại probe N10 headed, tin report JSON +
  script gộp).
- Script gộp pool chạy lại (`analyze-pool91s6.py`): khớp file phân tích
  của S6 — 30fps **n=30, median 0,935, PASS 24/30 (80% đúng vạch)**;
  60fps **n=14, median 0,970, PASS 12/14 (86%)**; cửa sổ 5 lần 60fps
  mới nhất median 1,19, 5/5 PASS; cửa sổ trượt 30fps 17/26 PASS.
- md5 harness khớp LIMITS §5: 78f1 `5b123275…`, 79g1 `53686333…`,
  E1 `26b7d572…`, verdict `fcac097d…`, test `7a49f9ad…`.
- **G1 vẫn CHƯA ĐÓNG** — S6 không tự đóng, chỉ đưa số + khuyến nghị
  (phương án A có điều kiện / B / C); quyết định thuộc parent/user.
  S9 đồng ý với cách trình bày này: pool 30fps đúng vạch 80% (thêm 1
  FAIL là rơi dưới), chân yên 30fps n=4 và 60fps n=1 đều chưa đủ.
- S6 không chạy tsc/vite (không chạm TS) — S9 đã chạy ở hồi quy chéo
  (§0): tsc web 0, desktop 0, vite build pass.

## 7. Hồi quy chéo cây cuối (S9 tự chạy — tóm tắt)

| Check | Kết quả |
|---|---|
| tsc web (`apps/web`, `npx tsc --noEmit`) | **0 lỗi** |
| tsc desktop (`apps/desktop`) | **0 lỗi** |
| vite build (`apps/web`) | **PASS 6,24 s** |
| O2 render (`test_round87_o2_mask_track.js`) | **25/25 pass, 0 fail** |
| O8 Chromium (clicktest-87o8 headed, scratch S9) | **21/21 pass, 0 fail** |
| O8 WebKit (clicktest-87o8 webkit, scratch S9) | **21/21 pass, 0 fail** |
| S2 probe WebKit tự chạy (phase s9verify) | **PASS cả 2 chỉ tiêu R2; 0 re-seek** (§2.2) |
| S1 assert A–E tự chạy | **100/100 ✅** (§1.1) |
| S4 test + P1 tự chạy | **60/60 + 30/30** (§4) |

- O8 lần đầu S9 chạy thiếu fixture trong scratch (harness lỗi exit 2 —
  lỗi của S9, không phải sản phẩm); copy fixture từ scratch S1 rồi chạy
  lại xanh cả 2 engine.
- Không process mồ côi do S9: vite/bridge của O8 đã tắt sau chạy; còn
  chạy trên VM là vite 5173 của S1 và bridge 8787 + vite preview 4173
  của S3 (S3 để lại cho parent quyết, xem LIMITS S3 §8) — S9 không tắt.
- S9 không sửa production: chỉ ghi log/scratch; 2 file mp4 copy tạm vào
  `apps/web/public/` đã xoá.

## 8. Ngoài phạm vi S1–S6 (spot-check nhanh, không kiểm chứng đầy đủ)

- **S7 EPERM probe:** log `eperm-probe-v2.log` có probe **#10,
  17:39:23Z, boot 182a689e, ok=2 fail=0**; heartbeat n=10 — khớp LIMITS
  S7. S9 không kiểm chứng phần điều tra khoảng mù/quét writeFileSync.
- **S8 birefnet window:** unit guard `test_bgremove_ramguard.py` chạy
  lại **8/8**; AppImage Q9 sha `9680cef1586149a9…` khớp; vùng guard
  bgremove.py trong gói giống hệt source (diff dòng 40–100 identical);
  MemAvailable lúc S9 kiểm tra ~1358 MB — xa dưới ngưỡng 6144 MB, nên
  quyết định không chạy birefnet của S8 là đúng. Birefnet vẫn 0 lần
  chạy thành công trong gói — nợ còn mở.

## 9. Batch đã stage (KHÔNG push)

- Batch S9: `~/workspace/repo-1-push/paths-loop/phase9-round91-s9-verify.txt`
  — 1 entry (file LIMITS này), đã verify read-back.
- Verify read-back toàn bộ batch đợt 91 (S9 đếm lại từ đĩa): **49 entry /
  8 file, 0 thiếu, 0 binary, 0 file `.github/workflows`** (S1 7, S2 8,
  S3 5, S4 2, S5 22, S6 3, S7 1, S8 1).
- Tổng chờ push (đếm lại từ đĩa, parent chốt ở closing): đợt 67–90:
  2018 entry / 242 file batch / 1223 file duy nhất (LIMITS gộp đợt 90);
  đợt 91: +49 entry / +8 file batch / **+18 file duy nhất** (48 file
  duy nhất trong đợt, 30 đã có trong batch đợt trước — chủ yếu dict +
  test i18n + preview.tsx/previewEngine đã stage từ trước); + S9: 1
  entry / 1 file batch / +1 file duy nhất. **Tạm tính sau đợt 91:
  2068 entry / 251 file batch / 1242 file duy nhất.** HEAD vẫn 5f548ef8.
  KHÔNG push.

## 10. Nợ / việc cho parent ở closing đợt 91

1. **P7 audit 7/8 trên cây gộp** (§5.3): literal console mới của S1
   (`preview.tsx:1112`) — quyết allowlist hay đổi message. Nhỏ, không
   chặn push, nhưng pin đỏ sẽ đỏ tiếp ở mọi lượt sau nếu không xử lý.
2. **S3:** bổ sung vào LIMITS S3 (hoặc closing): chữ ký GST 570402281
   cũng có trong log run2/run3 batch nhiễm; số blobReadyMs "25 lần /
   median 250" không tái lập được (S9 đếm 17/32/41 tùy phạm vi);
   appswap JSON có 10 case (không phải 8); "17/17" prog và "9/14" blob
   là số batch đầu (bảng đầy đủ là 20/20 và 15/20).
3. **S2 O8:** S2 chưa chạy O8 (LIMITS ghi "đang chạy"); S9 đã chạy thay
   trên cây gộp: 21/21 cả 2 engine — parent có thể coi là đã đủ.
4. **G1:** vẫn MỞ, chờ parent/user quyết theo phương án S6 §4 (S9 không
   có ý kiến thêm).
5. **Flip-flop src blob↔http trong app thật (S3 §7 mục 1)** là nợ mới
   ưu tiên cho đợt 92 (cần khóa `videoFor` chỉ gán src khi srcKey đổi
   thật).
6. Server S3 để lại (bridge 8787 + vite preview 4173) và vite 5173 của
   S1 vẫn chạy — parent quyết tắt hay giữ.

## 11. File làm việc của S9 (ngoài repo, không stage)

- Log luồng: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round91-s9.md`
- Assert S1 chạy lại: `~/workspace/round91-s9/out/preview-abcde-assert.json` + log `hidden_files/round91-s9-s1-assert.log`
- S4/P1/O2: `hidden_files/round91-s9-s4-test.log`, `round91-s9-p1-test.log`, `round91-s9-o2-test.log`
- S2 probe tự chạy: `hidden_files/round91-s2/probe-webkit-s9verify/probe-results.json` + log `hidden_files/round91-s9-s2-probe.log`
- O8 tự chạy: `hidden_files/round91-s9-o8/{headed,webkit}/` + log `round91-s9-o8-chromium.log`, `round91-s9-o8-webkit.log`
- Bundle test tạm: `/tmp/round91-s9/*.cjs|*.mjs` (esbuild, xoá được)
