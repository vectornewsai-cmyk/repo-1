# Phase 9 đợt 96 — X8: Sửa các nợ harness (nối tiếp W8 đợt 95)

**Nợ gốc:** docs/PHASE9_ROUND95_W8_HARNESS_LIMITS.md §8 (5 nợ) + LIMITS gộp
đợt 95 §4 mục 8 + §1 W8 (register-first/spec C).
**Ngày:** 2026-11-12 (lượt cron 15:35 +07; làm việc ~08:40–09:30Z).
**Repo:** `~/workspace/repo-1` (cây làm việc, KHÔNG push).
**Trạng thái: 4/5 mục XONG + kiểm chứng bằng chạy thật; 1 mục (register-first
dưới tải nặng + baseline sạch spec C) ĐO ĐƯỢC MỘT PHẦN — xem §4.**
Chỉ sửa harness/test/probe + 1 dòng build bundle thiếu cho doDbg — không
sửa logic production, không đụng TTS 39, birefnet, `.github/workflows`,
0 binary. Marker "Đợt 96 X8" ở mọi chỗ sửa.

## 0. Môi trường đo

- Boot sau reboot #17 ~08:01Z. Uptime ~40' lúc X8 bắt đầu (08:40Z). RAM khả
  dụng 576 MB lúc bắt đầu → 1,4–2,6 GB lúc đo (dao động theo Chrome của
  luồng khác). 4 vCPU chia sẻ với 9 luồng đợt 96.
- Vite dev 5173 của X8 (pid 8148, log `hidden_files/round96-x8/vite-5173.log`),
  HTTP 200 suốt lượt. Chrome headless Playwright chromium-1254 (probe tự spawn).
- **Code production đổi giữa lượt (luồng khác):** `preview.tsx` mtime
  06:15:41Z (đợt 95 W5) → **08:58:45Z (đợt 96 X2: sửa blend sai tập ghost,
  W4 §1.6/§6.1)**; `media.ts` 06:00:02Z → **09:12:45Z (đợt 96 X3: retry
  blob-lỗi không proxy)**. Hai lần đo baseline C (§4) chạy TRƯỚC 08:58:45Z
  nên dùng code cũ; A/B register-first (§4) chạy SAU, trên code X2/X3, có
  kiểm mtime trước/sau mỗi lần chạy. Log luồng: `hidden_files/round96-x8.md`.
- Loadavg 1-phút trong lượt: 0,41 (lúc bắt đầu) → 11,63 (đỉnh, lúc chạy q5) →
  0,88 (lúc bắt đầu A/B) → xem từng lượt đo ở §4.

## 1. thresholdNoiseLimited — CHỨNG MINH KHÔNG GẶP ĐƯỢC (mục 1)

**Kết luận: nhánh `thresholdNoiseLimited` (ngưỡng bị nhiễu chi phối,
`rawThreshold < 2×noise`) KHÔNG THỂ gặp qua nội dung clip/effect trong
pipeline hiện tại khi pause — chứng minh bằng code + đo thực trên clip
nhạy nhất có thể. Không phải "chưa thử", mà là không tới được.**

### 1.1 Chứng minh bằng code (chuỗi xác định)

Hiệu chuẩn (probe89q5, `CALIBRATE_FN`) lấy 3 mẫu darkCx tại cùng một t
(playhead), cách nhau 150 ms, canvas vẽ lại mỗi rAF. `noise` = lệch lớn
nhất khỏi trung vị của 3 mẫu. Muốn `noise > 0`, canvas ở cùng t phải vẽ
khác nhau giữa các mẫu. Nhưng mọi đầu vào của canvas lúc pause đều là hàm
xác định của (clip, t):

| đầu vào | vì sao xác định lúc pause |
|---|---|
| frame video | element pause tại currentTime cố định → cùng frame giải mã (decode xác định) |
| effect canvas | `canvasEffectOps(clip.effects, localT)` (preview.tsx:3099); `localT = t − clip.start`, `t` = store playhead (preview.tsx:5596, cố định lúc pause). Seed noise/glitch = hằng ^ floor(localT×30/12) (effectCanvas.ts:1036-1056); shake dx/dy = sin/cos(localT). **Không Math.random, không wall-clock trong đường vẽ** (grep: Math.random không có trong preview.tsx; performance.now chỉ đo thời gian) |
| motion blur | blend CHỈ khi playing: `ghostWeights = … && drawTransport.playing && … ? … : []` (preview.tsx:3019-3023); lúc pause vẽ trực tiếp, ring không đổi |
| held frame / mask / track | đều nội suy theo localT |

→ darkCx tại cùng t là hằng số → `noise = 0` → `rawThreshold = minStep/4 ≥
0 = 2×noise` → `thresholdNoiseLimited = false` với MỌI clip, MỌI effect.
Cách duy nhất để `noise > 0` là element thực ra KHÔNG pause trong lúc hiệu
chuẩn (currentTime trôi giữa các mẫu) — đó là artifact pause hỏng, không
phải tính chất clip. (Trường hợp darkCx = null ở vài khung thì rơi vào
nhánh fallback khác, không phải nhánh này — vẫn chưa đo, xem §8 mục 1.)

### 1.2 Đo thực — clip chậm + effect noise tối đa (độ nhạy cao nhất)

Để nhánh lật chỉ cần `noise > minStep/8`. Clip bóng nhanh có minStep
0,048 → cần noise > 0,006 (khó). X8 tạo clip chậm cùng hình học
(`hidden_files/round96-x8/clips/slow-ball-720p-6s.mp4`, script gen bằng
ffmpeg `geq`, ô đen 62×62, cx 0,3512 @t=1 → 0,3563 @t=5 — đo từ frame
thật): minStep chỉ ~0,0006–0,0011 → `rawThreshold` ~0,0001–0,0003, tức
**chỉ cần nhiễu 1 quantum làm tròn darkCx (0,0001) là lật nhánh**.
Thêm `--effect` mới vào probe89q5 (gắn effect canvas vào clip trước hiệu
chuẩn, chỉ đổi project trong trang probe) và chạy 3 lượt Chromium,
`--trials 1`, `--scratch round96-x8`:

| lượt | clip + effect | minStep | noise | rawThreshold | thresholdNoiseLimited | ghi chú |
|---|---|---|---|---|---|---|
| A | bóng nhanh + noise:1 | 0,0477 | **0** | 0,0119 | **false** | 6/6 khung canvasStable, 3 mẫu/khung; effect gắn OK `[{"type":"noise","intensity":1}]` |
| B | bóng chậm + noise:1 | **0,0006** | **0** | **0,0001** | **false** | 6/6 khung canvasStable; trial stale-timeout là đúng thiết kế (xem dưới) |
| C | bóng chậm, không effect | 0,0011 | **0** | 0,0003 | **false** | hiệu chuẩn xong, rồi Xvfb :197 chết giữa phase trial (xem §8 mục 3); JSON không ghi được, số lấy từ log |

- **Effect có đổi pixel thật (test không rỗng):** darkCx lượt A lệch
  tới 0,0008 so với run không effect của W8 (vd t=0: 0,3539 vs 0,3544;
  t=4: 0,5485 vs 0,5493); lượt B vs C lệch tương tự (t=0: 0,3539 vs 0,3544;
  t=5: 0,3599 vs 0,3601). Noise effect cường độ 1,0 làm đổi centroid thật,
  nhưng **giống hệt nhau qua 3 mẫu tại cùng t** → noise vẫn đúng 0.
- Lượt B nhạy tới mức rawThreshold = 0,0001 (1 quantum làm tròn): chỉ cần
  1 lần darkCx lệch 0,0001 giữa 2 mẫu là lật nhánh — vẫn 0. Đây là bằng
  chứng thực mạnh nhất có thể: nhánh không tới được qua nội dung.
- Trial của lượt B/C stale-timeout là ĐÚNG THIẾT KẾ, không phải lỗi đo:
  trial kỳ vọng proj x = 0,35+0,05×5 = 0,6 (hình học bóng nhanh) nhưng
  clip chậm có darkCx t=5 = 0,3599 (sawChange=true, maxDev 0,0049, element
  tới đích 2396 ms) nên không bao giờ "confirmed". Clip chậm là fixture
  CHỈ DÙNG CHO HIỆU CHUẨN, không dùng cho trial seek. Chỉ số hiệu chuẩn
  (mục đích của 3 lượt này) vẫn đầy đủ và sạch.
- Lượt A trial 1/1 confirmed (tElement 3122 ms, tCanvas 3187 ms — phồng
  do tải, loadavg ~7 lúc chạy; không dùng để kết luận latency).

**Hệ quả cho harness:** nhánh `thresholdNoiseLimited` giữ lại làm lưới an
toàn (fallback đã có), nhưng không cần — và không thể — "đo thêm" bằng
clip khác. Nếu sau này đường vẽ thêm đầu vào phụ thuộc wall-clock/random
(vd effect noise seed theo thời gian thực), nhánh này mới có thể gặp; lúc
đó đo lại bằng chính clip chậm + `--effect noise:1` này.

## 2. GST log doErr/doDbg mang tiền tố matrix (mục 2) — XONG + KIỂM CHỨNG

**Sửa** (`benchmarks/render/webkit_blob_flaky_94v3.mjs`):

- `doErr(runIdx, extra)`: trước đây KHÔNG truyền `gstDebugFile` cho
  `runPage` nên không có GST log nào. Nay ghi như doLoad (chỉ khi
  `GST_DEBUG_BLOB=1`): `${key}-ERR-blob-runN.log` trong GST_DIR
  (round94-v3/gst), kèm `gstDebugFile`/`gstDebugBytes` vào payload.
- `doDbg(runIdx, extra)`: bỏ đường cứng
  `/home/hatch/workspace/round91-s3/gst-debug-c10-blob-run${runIdx}.log`
  (ngoài GST_DIR, không tiền tố, chạy lại ghi đè); nay ghi
  `${key}-DBG-c10-blob-runN.log` trong GST_DIR. DBG vẫn luôn ghi GST log
  (không cần `GST_DEBUG_BLOB=1` — đó là mục đích của mode).
- Nối dispatch `ERR`/`DBG` (trước đây 2 hàm tồn tại nhưng KHÔNG nhánh nào
  gọi) + cập nhật danh sách mode trong header. Tên case cuối:
  `ERR-blob-run1`, `DBG-c10-blob-run1` (pushCase thêm tiền tố key như cũ).
- **Bug bắt được khi kiểm chứng:** không dòng nào build bundle 16 MiB
  (`media-pool-bundle-16mib.js`) — thư mục bundle đợt 94 cũng chỉ có 4
  file — nên mọi lần chạy DBG đều chết `ENOENT` trước khi đo; doDbg chưa
  từng chạy được trong file probe này. Đã thêm 1 dòng
  `await buildBundle(16 * 1024 * 1024, "media-pool-bundle-16mib.js");`
  (harness-only, marker "Đợt 96 X8"). Đây là fix bắt buộc để kiểm chứng
  mục 2, không phải sửa production.

**Kiểm chứng** (bản copy của probe tại /tmp/x8-v3 — OUT/BUNDLE/GST dời
sang /tmp, symlink apps, thêm entry bundle; file thật + file kết quả thật
không đụng; Xvfb :199 tự mở, PID 23305, kill theo PID sau khi xong):

| lượt | kết quả |
|---|---|
| ERR 1 (`GST_DEBUG_BLOB=1`) | exit 0; case `ERR-blob-run1` matrix=ERR; GST log `/tmp/x8-v3/gst/ERR-blob-run1.log` **360.116 byte**; payload `gstDebugBytes=360116`. Hành vi error-handler đúng: blob lỗi t=0,7 → fallback http → totalFrames 96, finalCt 8, finalSrcKind http; playOk=false (playErr "The operation is not supported") nhưng playedAfterRetry=true (đường retry-play W2). |
| DBG 1 (lần 1) | exit 1 — `ENOENT media-pool-bundle-16mib.js` (bug trên); file `DBG-c10-blob-run1.log` đã tạo (0 byte) đúng tên có tiền tố — chứng tỏ phần đổi tên đúng, phần thiếu là bundle. |
| DBG 1 (lần 2, sau khi thêm build 16 MiB) | **exit 0**; case `DBG-c10-blob-run1` matrix=DBG; GST log `/tmp/x8-v3/gst/DBG-c10-blob-run1.log` **408.653 byte**; payload `gstDebugBytes=408653`. playOk=false, failKind=error-event (blob c10 lỗi t=1,82 → fallback http, 112 frame, finalCt 8,995) — hành vi flaky-blob đã biết trên WebKit, không liên quan tới sửa này. |

- File GST cũ tại đường cứng round91-s3 không bị đụng:
  `gst-debug-c10-blob-run1.log` mtime 11/11 17:59:37, 216.081 byte,
  sha256 `76db0637…` — trước/sau giống nhau.
- `node --check` probe sau sửa: pass.

## 3. Thống nhất runner media.* (mục 3) — XONG + KIỂM CHỨNG

**Vấn đề:** 3 file `apps/web/src/media.*.test.ts` chạy bằng 3 cách khác nhau
trong đầu file: blobPrefetch + retryPlay đã có lệnh esbuild; captureThumb
KHÔNG có header nào; `node --experimental-strip-types` fail import không
đuôi (`"./media"`, `"./lib"` dạng thư mục) và CJS fail do top-level await.

**Sửa:**

- Thêm header esbuild vào `media.captureThumb66T6.test.ts` (lệnh đầy đủ +
  trỏ runner); 2 file còn lại thêm 1 dòng trỏ runner.
- Mới: `apps/web/scripts/run-media-tests.mjs` — runner thống nhất: bundle
  từng file bằng esbuild (`--bundle --format=esm --platform=node`,
  outfile /tmp) rồi chạy bằng node, in PASS/FAIL từng file, exit != 0
  nếu có file fail (kể cả lỗi bundle). Chạy mặc định cả 3 file;
  `run-media-tests.mjs <tên-file>` chạy 1 file.
- **Bug tự bắt:** bản đầu tính ROOT sai (`../..` thay vì `../../..` →
  tìm esbuild tại `apps/node_modules/.bin/esbuild`); chạy lần đầu fail
  ngay với thông báo rõ, đã sửa, chạy lại xanh.

**Kiểm chứng** (`run-media-tests.mjs`, log `round96-x8/run-media-tests.log`):

| file | kết quả |
|---|---|
| media.blobPrefetch90R3.test.ts | PASS (26 ✓) |
| media.captureThumb66T6.test.ts | PASS (PASS 2 FAIL 0) |
| media.retryPlay95W2.test.ts | PASS (8 ✓) |
| **Tổng** | **3/3 PASS, 34 ✓, 0 fail** |

- Đối chứng strip-types: `node --experimental-strip-types
  apps/web/src/media.captureThumb66T6.test.ts` fail đúng như mô tả:
  `ERR_MODULE_NOT_FOUND: Cannot find module '.../src/media'`.

## 4. Register-first dưới tải nặng có kiểm soát + baseline sạch spec C (mục 4) — CHƯA KẾT LUẬN ĐƯỢC (đo được, nhưng nhiễu lấn át)

### 4.1 Baseline sạch spec C — VẪN CHƯA CÓ (2 lần thử đều nhiễm/vô hiệu)

| lần | điều kiện | kết quả |
|---|---|---|
| 1 | pump-c 3 pass, code 06:15:41Z; loadavg 1,42→3,46 giữa lượt | **NHIỄM:** captureRatio 0,534 / 0,324 / 0,589; ticks 68 / 32 / 73 (sạch ~130–145); schedLat med 38,5 / 81,5 / 38 ms; capMs med 5,9 / 14,8 / 5,1 ms. Không dùng làm baseline. |
| 2 (retry) | pump-c 3 pass, code 06:15:41Z; loadavg 1,07 lúc bắt đầu → 7,31 giữa lượt | **VÔ HIỆU:** p1 cap 0,75 / ticks 104 (load 7,31); **p2–p3 callbacks=0** (coverage 0, presented 70–74) — rVFC im hoàn toàn lúc tải nặng, đúng mode V1 `pump94-c2.json` p2–p3. Load sau lượt 9,66. |

- mtime `preview.tsx` ổn định 06:15:41Z trước/sau cả 2 lần (không nhiễm
  do sửa code). File: `round96-x8/pump-c-baseline96*.json` (+ `.log`).
- Baseline C sạch (cap ~0,986, ticks ~130–145 như V1 §3 đợt 93) vẫn chưa
  có — và từ lúc đo, code đã đổi 2 lần (X2 08:58:45Z, X4 09:28:20Z) nên
  baseline trên code cũ cũng không còn giá trị đối chiếu cho code hiện
  tại. Đợt sau phải đo lại trên code đứng yên.

### 4.2 A/B register-first dưới tải nặng có kiểm soát — 6 pass, KHÔNG TÁCH ĐƯỢC TÁC DỤNG

**Thiết kế:** spec B (như V1 §2.2), 1 pass/lần, xen kẽ ON/OFF/ON/OFF/ON/OFF
(3 cặp), tải nền **2× `yes` có kiểm soát** (2/4 vCPU, spawn theo PID, kill
theo PID sau lượt — trap cleanup; không dùng pkill). Vite 5173 của X8.
Ghi mtime `preview.tsx`/`media.ts` trước/sau mỗi lần chạy.

**Sự cố giữa chừng (ghi trung thực):** runtime restart làm chết script A/B
sau OFF 2 (OFF 2 đã XONG trong log riêng); VM **reboot #18 ~09:24–09:25Z**
(uptime 1' lúc 09:25:52Z). `yes` của X8 chết theo reboot (không còn
process mồ côi — kiểm tra `ps` sau reboot: không còn `yes` nào của X8).
Rep 3 chạy lại sau reboot. Giữa rep 2 và rep 3, **X4 sửa `preview.tsx`
09:28:20Z (+2.687 byte, resume-stall watch)**; và **trong lúc ON 3 chạy,
`preview.tsx` đổi mtime 09:24:18Z → 09:28:20Z (HMR giữa pass)** — xem
bảng dưới. mtime `media.ts` ổn định 09:12:45Z suốt A/B.

| pass | arm | code (mtime preview.tsx) | load 1-phút lúc pass | coverage | captureRatio | ticks | schedLat med | capMs med / p90 |
|---|---|---|---|---|---|---|---|---|
| ON 1 | ON | 08:58:45Z (X2) | 0,79 | 0,552 | **0,448** | 58 | 69,9 | 5,3 / 55,7 |
| OFF 1 | OFF | 08:58:45Z (X2) | 7,54 | 0,344 | **0,250** | 32 | 81,0 | 8,9 / 76,0 |
| ON 2 | ON | 08:58:45Z (X2) | 4,52 | 0,310 | **0,254** | 30 | 103,3 | 7,5 / 78,2 |
| OFF 2 | OFF | 08:58:45Z (X2) | 1,28 | 0,480 | **0,427** | 64 | 73,1 | 6,3 / 9,9 |
| ON 3 | ON | **ĐỔI GIỮA PASS** (X4) | 4,53 | 0,549 | 0,479 | 55 | 73,1 | 7,3 / 55,8 |
| OFF 3 | OFF | 09:28:20Z (X2+X4) | 7,33 | 0,237 | 0,212 | 24 | 82,3 | **56,7** / 88,5 |

(Chuẩn sạch để đối chiếu, V1 §3: coverage/capture ~0,986, ticks ~130–145,
schedLat med ~33 ms, capMs med 2–3 ms. Cả 6 pass đều nhiễm nặng theo chuẩn
này — không pass nào sạch.)

**Đọc số (trung thực, không bẻ cong):**

1. **Tải lấn át mọi thứ.** Capture ratio đi theo tải, không đi theo arm:
   ở tải nhẹ (~1–3,6) cả hai chiều đều ~0,43–0,45 (ON 1: 0,448; OFF 2:
   0,427); ở tải nặng (~4,5–7,5) cả hai chiều đều ~0,21–0,25 (ON 2: 0,254;
   OFF 1: 0,250; OFF 3: 0,212). Trong cặp 1, ON "thắng" vì nó chạy lúc tải
   nhẹ hơn (0,79 vs 7,54); trong cặp 2, OFF "thắng" vì nó chạy lúc tải nhẹ
   hơn (1,28 vs 4,52) — **dấu hiệu đảo ngược theo tải, đúng mẫu nhiễu**.
   Thiết kế "xen kẽ để khử nhiễu tải" THẤT BẠI vì tải nền dao động ±3–6
   loadavg giữa 2 pass liên tiếp (luồng khác burst Chrome/WebKit/tsc),
   lớn hơn mọi tác dụng register-first có thể có.
2. **Ở tải tương đương, hai chiều không phân biệt được** (0,448 vs 0,427;
   0,254 vs 0,250) — phù hợp với kết luận "trung tính lúc tải vừa" của V1,
   nhưng mẫu chỉ có 2 cặp và đều nhiễm nặng nên **không đủ sức kết luận
   "trung tính dưới tải nặng"** — chỉ đủ sức nói "không tách được".
3. **ON 3 LOẠI BỎ** (code đổi giữa pass, HMR — không dùng để so sánh).
   OFF 3 là pass duy nhất mà capMs med phình thật (56,7 ms — đúng tiền
   đề lý thuyết của register-first) nhưng không có pass ON đối chứng cùng
   tải + cùng code nên không kết luận được gì từ nó.
4. **Cơ chế gây miss dưới tải:** schedLat med 70–103 ms (gấp 2–3× lúc
   yên ~33 ms) trong khi capMs med chỉ 5–9 ms ở 5/6 pass — miss chủ yếu do
   **callback tới trễ** (main thread bận), không phải do capture lâu.
   Register-first chỉ giúp khi capture dài làm lỡ đăng ký; khi chính
   callback đã trễ 70–100 ms thì thứ tự đăng ký không cứu được. Đây là
   giải thích cơ chế cho việc không thấy tác dụng — nhưng vẫn là giả
   thuyết, chưa phải kết luận đo được (cần pass ON đối chứng lúc capMs
   phình).
5. Tải nền có kiểm soát (2× `yes`) KHÔNG giữ được chế độ đo: tổng tải vẫn
   dao động 0,79–7,54 do ambient của 8 luồng khác. Bài học cho đợt sau:
   muốn đo A/B này cần (a) cửa sổ mà các luồng nặng khác tạm nghỉ (như
   W4 §5.1 đã kết luận), hoặc (b) đo xen kẽ NGẮN HƠN (nửa pass?) để tải
   không kịp đổi giữa 2 arm, hoặc (c) chấp nhận đo trên VM riêng lúc
   không có luồng khác.

**Verdict mục 4: baseline sạch spec C — CHƯA CÓ (giữ mở). Register-first
dưới tải nặng — KHÔNG KẾT LUẬN ĐƯỢC (inconclusive): dữ liệu đo được phù
hợp với "trung tính" nhưng nhiễu tải lớn hơn tín hiệu cần đo; không đo
nhiễm để ép kết luận.**

## 5. Bốn case MATRIX-r1 mất — KHÔNG KHÔI PHỤC ĐƯỢC VÀO FILE (mục 5)

**Xác minh lại từ đĩa (chỉ đọc, không sửa file nào):**

- `hidden_files/round94-v3/analysis-cases.json`: 68 case, gồm 12 case
  `_batch=MATRIX-r1` (4 clip × 3 biến thể). 4 case blobA-run1 gốc:

  | case | clip | playOk | failKind | totalFrames | blobReadyMs | finalCt | loadavg |
  |---|---|---|---|---|---|---|---|
  | Lc2-blobA-run1 | c2.mp4 | false | error-event | 0 | 200 | 0 | [3.15, 4.03, 3.17] |
  | Lc4-blobA-run1 | c4.mp4 | false | error-event | 0 | 804 | 0 | [2.76, 3.84, 3.14] |
  | Lc6-blobA-run1 | c6.mp4 | false | error-event | 0 | 616 | 0 | [1.44, 3.31, 2.99] |
  | Lc8-blobA-run1 | c8.mp4 | **true** | ok | **128** | 510 | 8.583 | [0.8, 2.85, 2.85] |

- `benchmarks/results/webkit-blob-flaky-94v3.json`: 64 case. 4 tên
  `Lc2/4/6/8-blobA-run1` trong file đang giữ **dữ liệu MATRIX2-r1**
  (không có trường `matrix` — ghi trước fix W8): blobReadyMs 473 / 157 /
  499 / 194; **Lc8 bị lật từ playOk=true (128 frame) thành playOk=false
  (0 frame)**. Nghĩa là số liệu V3 trong LIMITS đã tính từ
  analysis-cases.json nên không sai số nào — chỉ ai phân tích lại từ file
  kết quả sẽ thiếu 4 case và sai verdict Lc8.
- sha256 file kết quả **97812cae… — không đổi so với W8 ghi** (không ai
  sửa file). sha256 analysis-cases.json `ed4008e0…`.

**Vì sao không khôi phục vào file:** file kết quả là JSON append-only theo
thứ tự chạy, mỗi case có `date` + (từ W8) `matrix`; 4 case gốc không có
trường `matrix`, không có `date` ghi trong analysis-cases.json (chỉ có
`_name`/`_batch` + payload), và đã có 4 case khác chiếm đúng tên đó.
Chèn lại = bịa `date`/`matrix`, đổi thứ tự file, và vẫn còn 2 bản cùng tên
(dù đã có cơ chế `-dup<N>` của W8 thì việc "khôi phục" cũng là tái tạo dữ
liệu, không phải dữ liệu gốc). **Quyết định: KHÔNG khôi phục; ghi rõ ở đây
+ 1 dòng trỏ trong comment pushCase của probe.** Nguồn sự thật cho 4 case
này là `analysis-cases.json` (đọc trực tiếp, không bịa lại số nào — bảng
trên copy nguyên giá trị từ file đó).

## 6. Kiểm chứng tổng hợp

| Hạng mục | Kết quả |
|---|---|
| thresholdNoiseLimited — clip chậm + noise:1 (nhạy nhất) | noise=0, rawThreshold=0,0001, **false** (3 lượt: bóng nhanh + noise, bóng chậm + noise, bóng chậm plain) |
| GST doErr (bản copy, ERR 1) | exit 0; `ERR-blob-run1.log` 360.116 byte, matrix=ERR |
| GST doDbg (bản copy, DBG 1) | exit 0 sau khi thêm build 16 MiB; `DBG-c10-blob-run1.log` 408.653 byte, matrix=DBG; file GST cũ round91-s3 không đổi (sha256 76db0637…) |
| Runner media.* (`run-media-tests.mjs`) | **3/3 PASS** (34 ✓: blobPrefetch 25, captureThumb 2, retryPlay 7) |
| `tsc --noEmit -p apps/web/tsconfig.json` | **0 lỗi** |
| `seek.test.ts` (strip-types) | **21 passed** |
| Xvfb lock test (`test-xvfb-display-lock.mjs`) | **PASS 8/8** (sau reboot #18; lock dir trống) |
| O8 headed (code X2+X4) | **21/21** (S7: mask Δx=0,112, bóng Δx=0,113 — khớp W8) |
| O8 webkit | **CHẶN MÔI TRƯỜNG, không chạy được:** MiniBrowser lỗi `libavif.so.16: cannot open shared object file` sau reboot #18 (thư viện không còn trên boot này; WebKit vẫn chạy được trước reboot — ERR/DBG §2). Cần `install-deps webkit` trên boot này, ngoài phạm vi luồng này. |
| Register-first A/B (6 pass) + baseline C (2 lần) | Không kết luận được — xem §4 (nhiễu tải + reboot #18 + code đổi giữa chừng) |
| `node --check` 3 file .mjs đã sửa/mới | pass (probe89q5, webkit probe, run-media-tests) |
| Không process mồ côi của luồng này | `yes` đã kill theo PID (trap) + chết theo reboot; Xvfb :199 đã kill theo PID 23305; vite 5173 sẽ tắt cuối lượt (xem §7) |

**Caveat (ghi trung thực):**
- Chạy `tsc` trần từ gốc repo (không `-p`, không phải lệnh của project)
  báo 2 lỗi trong `media.retryPlay95W2.test.ts` (TS5097 import `.ts`,
  TS6133 `MB` không dùng) — cả hai đều nằm trong code của W2, không phải
  do sửa comment đầu file của X8 (chỉ thêm 2 dòng `//`); lệnh typecheck
  của project (`tsc --noEmit -p apps/web/tsconfig.json`, cũng là bước
  `build` trong apps/web/package.json) cho **0 lỗi**.
- Run C hiệu chuẩn bóng chậm (không effect): Xvfb :197 chết giữa phase
  trial → probe exit 2, `probe-results.json` không ghi được; số hiệu
  chuẩn lấy từ log (`minStep=0,0011 noise=0`, frames đầy đủ 6 t).
- A/B rep 3 chạy sau reboot #18 trên code X2+X4 (khác code rep 1–2);
  ON 3 loại bỏ do HMR giữa pass (xem §4.2).

## 7. File thay đổi (stage, KHÔNG push)

- `apps/web/scripts/probe89q5-seek-latency.mjs` — thêm `--effect <type>[:intensity]` (gắn effect canvas trước hiệu chuẩn).
- `apps/web/scripts/run-media-tests.mjs` — MỚI: runner thống nhất media.*.
- `apps/web/src/media.blobPrefetch90R3.test.ts` — header thêm dòng trỏ runner.
- `apps/web/src/media.captureThumb66T6.test.ts` — thêm header esbuild + dòng trỏ runner (trước đây không có header).
- `apps/web/src/media.retryPlay95W2.test.ts` — header thêm dòng trỏ runner.
- `benchmarks/render/webkit_blob_flaky_94v3.mjs` — doErr/doDbg mang tiền tố matrix + dispatch ERR/DBG + build bundle 16 MiB cho doDbg + comment pushCase (4 case MATRIX-r1).
- `docs/PHASE9_ROUND96_X8_HARNESS_LIMITS.md` — tài liệu này.

Batch stage: `phase9-round96-x8-harness`
(`~/workspace/repo-1-push/paths-loop/phase9-round96-x8-harness.txt`).
Log luồng: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round96-x8.md`.
Số liệu thô: `hidden_files/round96-x8/` — `pump-c-baseline96*.json/log`,
`pump-b-regfirst-{on,off}-{1,2,3}.json/log`, `ab-regfirst-run.log`,
`ab-regfirst-rep3.log`, `run-ab-regfirst*.sh`, `q5-ball-noise1.log`,
`q5-slow-noise1.log`, `q5-slow-plain.log`,
`probe-chromium-{noise1,slow-noise1,slow-plain}/`,
`run-media-tests.log`, `xvfb-lock-test.log`, `o8-headed.log`,
`o8-webkit.log`, `vite-5173*.log`, `clips/slow-ball-720p-6s.mp4`
(clip gen, KHÔNG đưa vào batch push — binary, chỉ ghi chú nguồn gen:
ffmpeg `geq` trên nền trắng, ô đen 62×62, x=417+1,6·T).
Bản copy kiểm chứng V3 + log GST ở /tmp/x8-v3/ (ngoài repo, không stage).

## 8. Nợ còn lại cho đợt sau

1. **Hiệu chuẩn canvasOk — trường hợp darkCx null vẫn chưa đo:** clip mà
   darkCx đo được là null ở vài khung (không có vùng tối) → hiệu chuẩn trả
   fallback (W8 §8 mục 1b). Vẫn chưa có số đo; nhánh này khác với
   thresholdNoiseLimited (§1 — nhánh đó nay đã chứng minh không tới được).
2. **T1 vẫn dùng assert thời gian** (W8 §8 mục 2, giữ nguyên có chủ ý).
3. **Register-first dưới tải nặng + baseline sạch spec C:** vẫn mở (xem §4
   — cần cửa sổ yên mà các luồng nặng khác tạm nghỉ, hoặc đo xen kẽ ngắn
   hơn; baseline C phải đo lại trên code đứng yên sau X2/X4).
4. **O8 webkit sau reboot #18:** cần `install-deps webkit` trên boot này
   (thiếu `libavif.so.16`) trước khi chạy lại O8 webkit hay bất kỳ probe
   WebKit nào.
5. **Xvfb chết giữa probe (mới, đợt này):** Xvfb :197 chết trong lúc run C
   hiệu chuẩn bóng chậm (09:09:13Z, "X connection error", Chromium chết
   theo) — lock display của W8 không bảo vệ được khi chính X server chết;
   nguyên nhân chưa rõ (có thể do luồng khác dọn display hoặc Xvfb crash
   dưới tải). Nếu tái diễn, cần điều tra ai giết Xvfb / thêm watch cho
   X server.
6. **Lock Xvfb mới chỉ probe89q5 + lock test dùng:** các probe khác muốn
   claim display thì dùng `xvfb-display.mjs`, đừng copy mẫu picker cũ
   (W8 §8 mục 4, nhắc lại).
