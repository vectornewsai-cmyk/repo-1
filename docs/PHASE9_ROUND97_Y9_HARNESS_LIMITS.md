# Phase 9 đợt 97 — Y9: Sửa 3 nợ harness (LIMITS gộp đợt 96 §4 mục 12)

**Nợ gốc:** LIMITS gộp đợt 96 §4 mục 12 + X8 §8 (E1 còn 2 fetch không-timeout).
**Ngày:** 2026-11-12 (lượt cron 18:35 +07; làm việc ~11:40–12:05Z).
**Repo:** `~/workspace/repo-1` (cây làm việc, KHÔNG push).
**Trạng thái: 3/3 mục XONG + kiểm chứng bằng chạy thật.**
Chỉ sửa harness/test/probe — không sửa logic production, không đụng
TTS 39, birefnet, `.github/workflows`, 0 binary. Marker "Đợt 97 Y9" ở
mọi chỗ sửa.

## 0. Môi trường đo

- Boot sau reboot #19 ~11:31Z (boot d8dc09fe). Uptime 9' lúc Y9 bắt đầu
  (11:40Z). RAM khả dụng 1236 MB lúc bắt đầu → 1800 MB lúc cuối.
  10 luồng đợt 97 (Y1–Y10) chạy song song suốt lượt — máy KHÔNG yên
  (xem §3, caveat).
- Vite dev + Chrome headless của E1 (Playwright chromium-1254) và probe
  parity (chromium, scroll-blur) tự spawn; Xvfb display do probe/E1 tự
  claim (`:180`).
- Log luồng: `hidden_files/round97-y9.md`. Số liệu thô:
  `hidden_files/round97-y9/` — `e1-run{1,2,3}/`,
  `fi-media*.log`, `fi-cdp*.log`, `probe-before-results.json`,
  `probe-after-results-v1.json`, `probe-after2-results.json`,
  `analyze-slots.py`, `e1-run*.log`.

## 1. Cap mainDraws/draws 400 làm mất timing đầu lượt — XONG

**Vấn đề (đo trước):** probe parity `probe96x5b` (chromium, scroll-blur,
tag `y9-before`, EXIT=0): `drawsTotal 1052`, `drawsKept 400` (38%),
cửa sổ giữ chỉ 126304–129647 ms = **3,3 s cuối của lượt phát 9,5 s**
(playT0rel 120136) — **mất 652 draws đầu lượt (62%)**. `mainDraws`
364 mẫu (chưa tới cap) giữ đủ cửa sổ 120324–129640 ms. Bằng chứng
trên đĩa từ đợt 96 khớp: `chr-blur-r6` drawsTotal 1229, kept 400.

**Sửa** (cả 3 probe cùng dòng — `probe95w3`, `probe96x5`,
`probe96x5b-frame-parity.mjs`, vì wrapper cap giống hệt nhau):

- Cap 400 → **2000** cho cả `draws` và `mainDraws` (mỗi entry draws là
  object nhỏ; 2000 mẫu ≈ vài chục KB — không đáng kể).
- **Tóm tắt timing live** `drawsSummary`/`mainSummary` (kiểu
  `ringFirstAt` — ghi ngay lúc push, O(1)): `n`, `firstT`, `lastT`,
  `gapMin`, `gapMax`, `gapSum`, `gapSq` (→ gapMean/gapSd), và số mẫu
  theo **bucket 500 ms** (mật độ theo thời gian, thấy được đầu lượt).
  Tóm tắt tính MỌI mẫu nên dù cap có cắt, timing vẫn còn đủ.
- Export thêm `drawsSummary`, `mainSummary`, `mainDrawsTotal` (trước
  đây mainDraws không có counter tổng — chỉ có độ dài mảng đã cắt).

**Đo sau (cùng config chromium/scroll-blur):**

| lượt | drawsTotal | drawsKept | summary n | buckets tổng | cửa sổ giữ | gapMin |
|---|---|---|---|---|---|---|
| y9-before (code cũ) | 1052 | 400 (38%) | — (không có) | — | 126304–129647 (3,3 s cuối) | — |
| y9-after (v1) | 624 | 624 (100%) | **624** | **624** | 306–9486 (đủ lượt) | draws **-0,3 ms** (artifact, xem dưới) |
| y9-after2 (v2, sửa rounding) | 346 | 346 (100%) | **346** | **346** | 120935–130772 (đủ lượt) | draws **0**, main 14 |

- v1 `mainSummary`: n=219 = mainDrawsTotal, gapMean 42,1 ms, gapSd
  29,7 ms, first 309 / last 9487. v2 `mainSummary`: n=117 = total,
  gapMean 84,2 ms, gapSd 48,0 ms.
- Buckets v1 (500 ms, rel t0): 7/21/30/26/31/28/17/27/33/33/27/26/32/
  48/44/48/37/57/52 — mật độ đầu lượt (bucket 2–5: 26–31 mẫu) nay
  đọc được; trước đây 652 mẫu đó đã mất hẳn.
- **Artifact bắt được ở v1:** gapMin draws = −0,3 ms. Nguyên nhân:
  `lastT` lưu `Math.round(t)` nhưng gap tính từ `t` thô — t sau làm
  tròn lên rồi t tiếp theo thấp hơn 0,3 ms. Đã sửa ở v2: làm tròn `t`
  TRƯỚC khi tính gap (gap thành số nguyên ms ≥ 0). v2 gapMin = 0.
- **Unit test với hàm thật** (trích `newDrawSummary`/`sumPush` từ
  file, không phải bản copy — `/tmp/y9-test-summary.mjs`): 5000 mẫu,
  đầu dày 3000 mẫu/2 s + 2000 mẫu rải 10 s, mô phỏng cap mảng 2000 →
  **PASS**: summary n=5000, mảng giữ 2000, buckets tổng 5000,
  4 bucket đầu = 3019 (= 3000 dày + 19 mẫu rải rơi vào bucket 3),
  gapMin=0, gapMean=2,36, gapSd=2,19.
- Lưu ý trung thực: drawsTotal dao động mạnh giữa các lượt
  (1052/624/346) theo tải lúc chạy (caps 248/169/104) — bất biến
  cần kiểm là tỉ lệ giữ + độ phủ của tóm tắt, không phải tổng tuyệt
  đối. Lượt dài hơn 2000 draws vẫn sẽ cắt mảng, nhưng tóm tắt giữ
  đủ (đã chứng minh bằng unit test 5000 mẫu).

## 2. Hai fetch không-timeout còn lại trong E1 — XONG + FAULT-INJECTION

**Sửa** (`apps/web/scripts/clicktest-77e1-deint-fps.mjs`, mẫu X6
`AbortSignal.timeout(2000)`; sau sửa 4/4 fetch trong E1 đều có
timeout 2 s):

- **Media probe** (dòng cũ không timeout): thêm
  `signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)`; timeout ghi
  `mediaStatus="timeout"` (phân biệt với 200 = server lạ và "error" =
  kết nối chết ngay); log ghi rõ "endpoint treo quá 2s".
- **Vòng CDP `/json/list`**: thêm timeout 2 s mỗi lần thử; số lần thử
  qua env `E1_CDP_LIST_ATTEMPTS` (mặc định 180, như cũ).
- **Chẩn đoán mới** trong throw cuối vite: nhánh "media probe timeout
  (vite đã lên nhưng endpoint media treo quá 2s cả 3 lần thử…)".
- **Hook fault-injection** (ghi trong header): `E1_MEDIA_BASE` — trỏ
  media probe sang server khác (mặc định vite dev của E1).
- Mới: `apps/web/scripts/fault-inject-hang-server.mjs` — server treo
  có chủ đích: mode `media` (`/` trả 200 ngay,
  `/r77e1-media/*` không bao giờ trả lời), mode `tcp` (accept rồi
  giữ im) để tái dùng cho fault-injection sau này.

**Kiểm chứng** (hang-server thật, E1 thật — không mô phỏng):

| case | trước-fix (bản copy tạm, đã xoá) | sau-fix |
|---|---|---|
| Media probe treo (`E1_MEDIA_BASE` → hang-server :5599) | **treo → exit 124** (bị `timeout 45` giết; log dừng sau "vite dev :5580") | **exit 2 trong 20,6 s**; 3 lần thử đều "media probe :558x trả timeout (… endpoint treo quá 2s)"; chẩn đoán cuối đúng "media probe timeout (vite đã lên nhưng endpoint media treo quá 2s cả 3 lần thử…)" |
| CDP `/json/list` treo (tcp hang-server :9699, `E1_DEBUG_PORT=9699`, `E1_CDP_LIST_ATTEMPTS=3`) | **treo → exit 124** (bị `timeout 30` giết; log dừng sau "vite dev đã lên") | **exit 2 trong 14,6 s**; "không lấy được page target CDP" (3 lần × 2 s timeout + 0,5 s sleep) |

- Đối chứng server: `curl /` trả `hang-server-ok`; `curl
  /r77e1-media/clean720.mp4` và `curl /json/list` đều treo
  (curl exit 28 @3 s). Hang-server đã tắt hết sau kiểm chứng
  (không còn process, không còn cổng nghe); file copy tạm đã xoá.
- `node --check` E1 sau sửa: pass.
- Lưu ý: với mặc định 180 lần thử, trường hợp endpoint treo nay bị
  chặn ở ~180×2,5 s = **450 s** (có giới hạn, trước đây là vô hạn).
  Chưa hạ mặc định — xem nợ §6 mục 1.

## 3. Nhiễu slot trên máy yên — ĐIỀU TRA XONG, KẾT LUẬN CÓ ĐIỀU KIỆN

**Thiết kế:** E1 ×3 lần liên tiếp (11:41–11:50Z), mỗi lần 11 slot
(5 tỉ lệ drift-corrected). Thêm vào slot row (Y9): `heapBeforeMB` /
`heapAfterMB` (`performance.memory`, Chromium headed) để đo áp lực
GC; sẵn có theo slot: `loadBefore`/`loadAfter`, rAF `gapP50`/`gapP95`/
`gapMax`/`over100`/`lostMs`.

**Caveat lớn, ghi trước:** KHÔNG lần nào đạt chuẩn "yên" ≥10 fps
baseline-mean của X6 (3,16 / 6,96 / 3,68 fps). 9 luồng đợt 97 chạy
song song, loadavg trong lượt 0,8→19,2. Đây là **phân tán trong điều
kiện tải**, không phải 3 lần yên như đề bài — máy không yên được
trong lượt 10 luồng. Bằng chứng yên của X6 (run3/4/6: tỉ lệ
0,46–2,67 trong một lần) vẫn đứng; số dưới đây là bằng chứng bổ sung
dưới tải, và kết luận về verdict 1 lần được rút cho cả hai.

**Kết quả 3 lần:**

| lần | baseline mean | deint mean | 5 tỉ lệ | mean | sd | max/min |
|---|---|---|---|---|---|---|
| 1 | 3,16 fps | 3,08 | 0,89 / 1,34 / 1,30 / 1,16 / 0,89 | 1,12 | 0,19 | 1,51 |
| 2 | 6,96 fps | 6,54 | 0,82 / 0,99 / 0,87 / 1,05 / 0,92 | 0,93 | 0,08 | 1,28 |
| 3 | 3,68 fps | 4,14 | 1,05 / 1,19 / 1,45 / 1,14 / 0,95 | 1,16 | 0,17 | 1,53 |

- Gộp 15 tỉ lệ: mean 1,07, median 1,05, **sd 0,18**, min 0,82,
  max 1,45. 0 slot đóng băng cả 3 lần. Cả 3 lần G5 PASS
  (mean ≥ 0,75).
- Draws/slot chỉ **5–37** (3 s/slot × 2–12 fps) → **±1 draw =
  3–20% mỗi slot**: lượng tử hoá đếm là nguồn nhiễu chính.
  Lần 2 nhiều draws nhất (14–37/slot) có sd tỉ lệ nhỏ nhất (0,08);
  lần 1/3 (5–17/slot) sd 0,17–0,19 — khớp đúng thang lượng tử hoá.
- Baseline spike: lần 2 slot 2 vọt 12,24 fps (gấp ~2× hai slot kề
  6,45/5,17) nhưng trung bình kề đã triệt nó (tỉ lệ slot 1/3 là
  0,82/0,99, không cực trị).

**Tương quan (33 slot gộp; Pearson):**

| cặp | r | đọc |
|---|---|---|
| drawFps vs loadBefore (1-phút) | **+0,72** gộp, nhưng **trong-lần 0,31 / 0,45 / 0,04** | Nhiễu Simpson: tương quan gộp do khác-biệt-giữa-lần (lần 2 vừa tải cao vừa fps cao), không phải nhân quả. Trong một lần, load 1-phút KHÔNG dự báo được fps slot (thậm chí dấu dương — ngược với "tải cao → fps thấp"). Loadavg 1-phút là chỉ báo trễ, sai粒度. |
| drawFps vs heapDelta | **+0,02** (n=33) | **GC không phải nguồn nhiễu.** Heap 24–42 MB, delta/slot thường ±2 MB; 2 lần rơi lớn −16,4 MB (lần 1 slot 0) và −13,9 MB (lần 3 slot 0) đều ở slot 0 (GC sau tích luỹ G1–G4) mà fps slot 0 KHÔNG thấp (lần 1 slot 0 = baseline cao nhất 4,83 fps). |
| drawFps vs raf gapP50 / gapMax | −0,61 / −0,78 | Cơ học, không giải thích: gap và fps đo cùng dòng tick (fps thấp thì gap lớn theo định nghĩa). rAF gapP50 83–500 ms, gapP95 tới 900 ms — vòng lặp tick ở 2–12 Hz; "rAF jitter" CHÍNH LÀ nhịp đo, không phải nguồn nhiễu độc lập. |
| (kiểm chứng) loadAfter | +0,68 | Cùng mẫu nhiễu Simpson như loadBefore. |

**Kết luận — verdict 1 lần có dùng được không: CÓ, VỚI BIÊN (conditional yes).**

- Mean của 5 tỉ lệ có sai số chuẩn SE ≈ sd/√5 ≈ **0,04–0,09 (1σ)**;
  spread của mean giữa 3 lần (0,93–1,16) khớp 2σ ≈ 0,16–0,23.
  Verdict 1 lần quyết được khi mean cách ngưỡng 0,75 ít nhất
  ~0,15–0,2 (mean ≥ 0,9 PASS chắc; ≤ 0,6 FAIL chắc). **Vùng
  0,6–0,9 là không-quyết-được — phải đo thêm lần 2** (median 5 tỉ
  lệ + mean lần 2). Cả 3 lần ở đây (0,93/1,12/1,16) đều PASS có
  biên ≥ 0,18 nên verdict đứng.
- Quy tắc này là khuyến nghị (chưa cài vào E1/G5 — xem nợ §6 mục 4).
- Đề xuất giảm nhiễu (chưa làm — đổi hành vi G5, cần parent quyết):
  slot dài hơn (5 s thay vì 3 s) hoặc thêm slot để tăng draws/slot,
  vì lượng tử hoá ±1 draw đang chi phối sd tỉ lệ.

## 4. Kiểm chứng tổng hợp

| Hạng mục | Kết quả |
|---|---|
| Cap + summary (probe96x5b, chromium/scroll-blur) | Trước: kept 400/1052 (38%); sau v2: kept 346/346, summary n=346, buckets 346, gapMin=0 |
| Unit test summary (hàm thật, 5000 mẫu) | **PASS** (n=5000, kept 2000, buckets 5000) |
| Media probe fault-injection | Trước exit 124 @45 s; sau exit 2 trong 20,6 s, chẩn đoán đúng |
| CDP /json/list fault-injection | Trước exit 124 @30 s; sau exit 2 trong 14,6 s, lỗi đúng |
| E1 ×3 (đo nhiễu slot) | **10/10 pass** cả 3 lần |
| `node --check` 5 file .mjs đã sửa/mới + parse INSTALL_SAMPLER 3 probe | pass |
| `tsc --noEmit -p apps/web/tsconfig.json` | **0 lỗi** |
| `vite build` (từ `apps/web`) | **PASS 8,80 s** (cảnh báo chunk >500 kB đã có từ trước) |
| Runner media.* (`run-media-tests.mjs`) | **3/3 PASS** |
| Không process mồ côi của luồng này | hang-server đã kill; vite/chrome/xvfb của E1 + probe đã dọn bởi cleanup của chúng; không còn file copy tạm |

## 5. File thay đổi (stage, KHÔNG push)

- `apps/web/scripts/clicktest-77e1-deint-fps.mjs` — timeout 2 s cho
  media probe + vòng CDP `/json/list`, chẩn đoán "media probe
  timeout", env `E1_MEDIA_BASE` / `E1_CDP_LIST_ATTEMPTS`, heap
  theo slot.
- `apps/web/scripts/fault-inject-hang-server.mjs` — MỚI: server treo
  (mode `media`/`tcp`) cho fault-injection E1.
- `apps/web/scripts/probe95w3-frame-parity.mjs` — cap 400→2000 +
  drawsSummary/mainSummary + export.
- `apps/web/scripts/probe96x5-frame-parity.mjs` — như trên.
- `apps/web/scripts/probe96x5b-frame-parity.mjs` — như trên + sửa
  rounding gap (gapMin âm giả) + header.
- `docs/PHASE9_ROUND97_Y9_HARNESS_LIMITS.md` — tài liệu này.

Batch stage: `phase9-round97-y9-harness`
(`~/workspace/repo-1-push/paths-loop/phase9-round97-y9-harness.txt`).
Log luồng: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round97-y9.md`.
Số liệu thô: `hidden_files/round97-y9/` — `e1-run{1,2,3}/`,
`fi-media*.log`, `fi-cdp*.log`, `probe-before-results.json`,
`probe-after-results-v1.json`, `probe-after2-results.json`,
`analyze-slots.py`, `e1-run*.log`, `probe-*.log`.

## 6. Nợ còn lại cho đợt sau

1. **Vòng `/json/list` mặc định 180 lần:** endpoint treo nay bị chặn
   ở ~450 s (180×2,5 s) thay vì vô hạn — nhưng 450 s vẫn dài. Cân
   nhắc hạ mặc định hoặc thêm deadline tổng cho vòng (đổi ngữ nghĩa
   timeout đã có — cần parent quyết, Y9 không tự đổi).
2. **Nhiễu slot — đề xuất chưa làm:** slot 5 s thay vì 3 s (hoặc thêm
   slot) để tăng draws/slot, giảm lượng tử hoá ±1 draw (3–20% hiện
   tại). Đổi hành vi G5 — cần quyết.
3. **Chưa có lần E1 thật-yên nào dưới code Y9** (baseline ≥10 fps):
   cần cửa sổ mà các luồng nặng khác tạm nghỉ (bài học X8 §4) — 3
   lần Y9 đều dưới tải.
4. **Quy tắc verdict 1 lần** (vùng 0,6–0,9 đo thêm lần 2) mới là
   khuyến nghị trong doc này, chưa cài vào E1/G5.
5. **Bucket tóm tắt tính theo t0** (lúc cài sampler), không phải
  playT0 — muốn map bucket sang thời gian phát thì trừ `playT0rel`.
  Analyzer sau này đọc `drawsSummary` nhớ trừ mốc này.
