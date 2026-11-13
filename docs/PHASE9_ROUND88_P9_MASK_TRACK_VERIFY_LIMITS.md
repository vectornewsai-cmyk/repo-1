# LIMITS — Phase 9 đợt 88, luồng P9: kiểm chứng độc lập mask bám motion track + benchmark tổng hợp

Ngày: 11/11/2026 (lượt cron 15:35 +07). Luồng kiểm chứng độc lập: KHÔNG tin
báo cáo luồng khác, tự chạy lại mọi thứ dưới đây. KHÔNG sửa production.
KHÔNG push, KHÔNG release/tag, KHÔNG đụng TTS 39, KHÔNG đụng file workflow.

## 0. Kết luận ngắn

**Mask bám motion track VẪN HOẠT ĐỘNG ĐÚNG ở cả 2 đường render** (video mask
mặc định + geq động), đo bằng pixel thật trên render 720p, trên cây sau khi
P1/P2/P6 đợt 88 đã hạ cánh:

- Tâm mask đo được khớp quỹ đạo tuyến tính với sai số ≤ 0,001 ở mọi mốc đo
  (0,275 / 0,499 / 0,725 tại t = 0,5 / 2,0 / 3,5; kỳ vọng 0,275 / 0,5 / 0,725).
- T của geq vẫn là thời gian clip-local (clip.start = 1,0 cho cùng tâm).
- Video đứng yên khi mask bám track (không double-shift): chứng minh bằng
  pixel phân biệt, cả 2 đường render.
- Mask vẫn bám track qua transitionOut (fade), cả mode trackgeq lẫn png:
  tâm 0,275 / 0,499 / 0,649.
- Hồi quy: render lại spec B1/B2/B3 của O7 cho **số đo frame KHỚP CHÍNH
  XÁC từng chữ số với số O7 đã ghi** (mean/max/pctGt8 giống hệt) + kích
  thước output byte giống hệt + render 2 lần MAD = 0 (xem §3 — giới hạn:
  không so trực tiếp được với frame O7 vì /tmp đã mất sau reboot).
- Benchmark tổng hợp: tracked render 720p **5,6–6,8 fps** đợt này (O7:
  10,9–18,9 fps — VM tải nặng hơn nhiều, xem §4); preview tracked
  **15,48 fps** (chạy lại) ≈ static 14,80 fps — khớp kết luận O7.
- Claim P1/P2/P6 đợt 88 **đều xác minh được ở mức smoke/chạy lại test**:
  P1 fallback 30/30, P2 pre-pass 18/18, P6 validate_codes 1596/1596 +
  dict 2516 + parity preview 37/37 (xem §5).

## 1. Ghi chú về cây đo — đọc trước (trung thực về thời điểm)

Lúc P9 bắt đầu (15:38 +07), **KHÔNG có file đợt 88 nào trên đĩa**
(grep `round88` toàn repo = 0 kết quả; không docs ROUND88, không
hidden_files round88-*, không paths-loop round88). P1/P2/P6/P7/P8 hạ cánh
TRONG LÚC P9 chạy. Vì vậy:

- Các render P1–P4 (§2) chạy bằng code cây đã gộp đợt 87 + parent closing
  (TRƯỚC khi P2 sửa `render.js` lúc 15:49:46 +07 và P6 sửa `validate.js`
  lúc 15:45:37 +07).
- Các render P5 (§3) + suite D + tsc/vite chạy SAU khi P2/P6 đã lên đĩa
  — tức là trên cây có sửa đổi đợt 88. Thay đổi của P2 chỉ bỏ 1 lần vẽ PNG
  thừa (không chạm filter graph), và số đo P5 khớp chính xác số O7 nên
  không có dấu hiệu hồi quy do P2.
- Mục B (validator) trong harness chạy TRƯỚC khi P6 sửa `validate.js` nên
  B6 ghi lại warn image CŨ; đã kiểm lại trực tiếp sau P6 ở §5.3 (warn mới
  đúng).
- Mục (e) — kiểm tra claim P1/P2/P6 — chỉ thực hiện được SAU khi các luồng
  đó hạ cánh, tức là nửa sau của lượt P9. Không có claim nào được "tin"
  trước khi có file trên đĩa.

Máy đo: AMD EPYC 9D25, 4 vCPU, RAM 7.934 MiB (khả dụng ~850–1.700 MiB
lúc đo), không GPU, ffmpeg 8.1.2, Node v24.22.1, Chromium headless 1254
(preview). VM reboot trước lượt (up 13 phút lúc P9 bắt đầu); loadavg
dao động 0,6 → 13 trong lượt do các luồng đợt 88 chạy song song — mọi
số fps tuyệt đối đều nhiễu mạnh, chỉ tỉ lệ trong cùng một lượt đo mới có
ý nghĩa (nhắc lại quy tắc O6/O7).

## 2. Render thật — đo tâm mask bằng pixel (720p, 30fps, tuần tự)

Harness mới của P9: `server/render/test_r88_p9_mask_track_verify.js`
(dùng lại `test_r87_o6_measure.py` của O6 để đo pixel — công cụ đo đã
sửa format output ở đợt 87, đo là xác định). Nguồn: `split.mp4` tự tạo
1280×720 4s — nửa trái đỏ, nửa phải xanh (ranh giới x = 0,5). Mask
ellipse w = 0,3 h = 0,4 feather = 0. Track tuyến tính (0, 0,2, 0,5) →
(4, 0,8, 0,5). Đo bằng quét hàng y = 0,5, tìm vệt sáng dài nhất
(dung sai ±0,03).

Kết quả harness verify: **61 pass, 0 fail** (WORK=/tmp/vcut-r88-p9-pVviCZ).

### P1. `--mask-mode png` mặc định + track + mask (đo lại C7 của O6)

| t | Kỳ vọng | Đo được | Kết quả |
|---|---|---|---|
| 0,5 | 0,275 | 0,275 (vệt [0,126, 0,424], rộng 0,298) | ✅ |
| 2,0 | 0,5 | 0,499 (vệt [0,350, 0,648], rộng 0,298) | ✅ |
| 3,5 | 0,725 | 0,725 (vệt [0,576, 0,874], rộng 0,298) | ✅ |

Video đứng yên: (0,4, 0,5)@0,5 đỏ [252,0,0]; (0,6, 0,5)@3,5 xanh
[0,0,252]; (0,2, 0,5)@0,5 đỏ, (0,8, 0,5)@3,5 xanh. Wall 13,2 s =
9,09 fps (cả job 4 s, gồm sinh video mask).

### P2. `--mask-mode trackgeq` (đo lại C7b)

| t | Kỳ vọng | Đo được | Kết quả |
|---|---|---|---|
| 0,5 | 0,275 | 0,275 | ✅ |
| 2,0 | 0,5 | 0,499 | ✅ |
| 3,5 | 0,725 | 0,725 | ✅ |

Video đứng yên ((0,4, 0,5)@0,5 đỏ, (0,6, 0,5)@3,5 xanh). Wall 95,8 s =
1,25 fps (geq tính từng pixel — chậm là đúng, khớp 1,33 fps của O6 lúc
tải nặng).

### P3. trackgeq, clip.start = 1,0 — T là local hay timeline? (đo lại C2)

Cùng tâm đo được tại timeline t = 1,5 / 3,0 / 4,5 (local 0,5 / 2,0 / 3,5):
**0,275 / 0,499 / 0,725** — khớp local, KHÔNG khớp timeline. ✅ **T của
geq là thời gian clip-local.** Wall 104,3 s, duration output 5 s đúng.

### P4. mask + track + transitionOut (fade 0,5s) — trackgeq (đo lại C6) + png (đo lại closing)

Clip c1 (split, mask + track) có `transitionOut: fade 0,5s` sang clip c2
(xanh), đo trước vùng fade; duration output 8 s đúng cả 2 mode.

| t | Kỳ vọng (local) | trackgeq | png | Kết quả |
|---|---|---|---|---|
| 0,5 | 0,275 | 0,275 | 0,275 | ✅ ✅ |
| 2,0 | 0,5 | 0,499 | 0,499 | ✅ ✅ |
| 3,0 | 0,65 | 0,649 | 0,649 | ✅ ✅ |

Wall: trackgeq 102,9 s; png 40,5 s. **Mask vẫn bám track qua transition
ở cả 2 mode** — khớp C6 (O6) và closing png (parent).

### A. Unit — hình học (chạy lại trên cây hiện tại)

- `maskGeometryAtTrack` không track == `maskGeometryAt` tại t = -1/0/1,3/5 ✅
- Track tuyến tính 0,2→0,8: t = -1/0/1/2/3/4/5/10 → x = 0,2/0,2/0,35/0,5/0,65/0,8/0,8/0,8 (sai số < 1e-9) ✅
- Keyframes + track: x từ track (0,5), w từ keyframes (0,4) ✅
- Cross-mirror CJS == ESM bit-for-bit ✅; geq động chứa `T` + `if(lt(T` + `sqrt(` ✅; chain 3 entry + `geq=lum=` + `alphamerge` ✅
- `mask.js --self-test` ✅ pass

### B. Validator — combo mask+track (chạy lại, TRƯỚC sửa P6)

- mask+track hợp lệ → ok, 0 error, 0 warning ✅
- mask+track+transition → ok; warn transition **NÓI ĐÚNG sau closing**
  ("chỉ phần dịch chuyển của unit; mask vẫn bám theo track") ✅
- image+mask+track → ok; warn lúc này vẫn là câu CŨ ("track sẽ bị bỏ
  qua") — **đây là trạng thái trước P6**, đã kiểm lại sau P6 ở §5.3.

### D. Suite cũ trên code hiện tại (sau P2/P6)

| Suite | Kết quả |
|---|---|
| `test_round87_o2_mask_track.js` (O2) | ✅ **25/25** |
| `test_mask_p4.js` | ✅ **33/33** |
| `test_d4_mask_keyframes.js` | ✅ **13/13** |
| self-test `tracking.js` / `sticker.js` | ✅ pass |
| `maskTrack.test.ts` (O1, strip-types) | ✅ **22/22** |
| `maskKeyframes.test.ts` (D4) | ✅ **14/14** |
| `check-video-spec-mirror.mjs` | ✅ **427 pass, 6 known, 0 fail** |
| `tsc` apps/web | ✅ 0 lỗi (chạy sau P6) |
| `tsc` apps/desktop | ✅ 0 lỗi |
| `vite build` apps/web | ✅ pass (6,23 s) |

## 3. Hồi quy — render lại spec B1/B2/B3 của O7, so với số O7 đã ghi

**Giới hạn phương pháp (ghi rõ):** frame O7 đã lưu nằm trong /tmp và đã
mất sau reboot VM ngày 11/11, nên KHÔNG so MAD trực tiếp với frame O7
được như O6 đã làm ở C4. Thay vào đó, P9 render lại đúng spec B1/B2/B3
của O7 (testsrc2 1280×720, 30fps, 5s; rect w=0,4 h=0,4 feather=0,2)
bằng code hiện tại và so các số đo frame với số O7 đã ghi trong
`PHASE9_ROUND87_O7_MASK_TRACK_BENCH_LIMITS.md` §2:

| So sánh | O7 đã ghi (mean / max / pctGt8) | P9 đo lại | Kết quả |
|---|---|---|---|
| B3@2,5 vs B1@2,5 (tracked vs tĩnh, cùng hình học x=0,5) | 0,234 / 82 / 0,489% | **0,234 / 82 / 0,489%** | ✅ giống hệt |
| B3@0,2 vs B3@4,8 (mask phải di chuyển) | 40,65 / 255 / 21,465% | **40,65 / 255 / 21,465%** | ✅ giống hệt |
| B1@2,5 vs B2@2,5 (png ≈ geq) | 0,251 / 115 / 0,464% | **0,251 / 115 / 0,464%** | ✅ giống hệt |
| Tính xác định: render B1 2 lần, MAD giữa 2 lần | — | **0 / 0 / 0%** | ✅ |
| Kích thước output | B1 228.329 B, B2 207.208 B, B3 270.655 B (O6 C4) | **228.329 / 207.208 / 270.655 B** | ✅ giống hệt |

Render là xác định (deterministic): cùng spec → cùng byte output và cùng
số đo frame tới 3 chữ số thập phân, kể cả sau khi P2 sửa `render.js`.
Đây là bằng chứng hồi quy mạnh nhất có thể sau khi frame gốc đã mất —
không phải so sánh frame-trực-tiếp, và P9 không claim hơn thế.

Wall P5 (tải nặng, chỉ để tham khảo): B1 15,9 s = 9,46 fps; B1-lại
22,2 s = 6,76 fps; B2-geq 80,7 s = 1,86 fps; B3-tracked 24,0 s =
6,26 fps.

## 4. Benchmark tổng hợp (đo lại bằng script P9, bản sao O7)

Script: `benchmarks/render/bench_round88_p9_mask_track.cjs` (bản sao
của O7, chỉ đổi đường ra JSON + thêm kiểm tra tính xác định B1-1 vs
B1-2). Kết quả thô: `benchmarks/results/round88-p9-mask-track.json`.
Chạy TUẦN TỰ, 1 render/lần. Load VM trong lúc đo: **12,6 → 2,0**
(các luồng đợt 88 khác chạy song song, tải giảm dần trong lượt) —
số tuyệt đối nhiễu mạnh, chỉ tỉ lệ trong cùng lượt mới có ý nghĩa.

### (a) Render fps — cùng clip testsrc2 1280×720 30fps 5s (150 frame)

| Arm | n | Wall (s) | FPS P9 | FPS O7 (để so) |
|---|---|---|---|---|
| B0 baseline (không mask) | 2 | 7,2 / 6,6 | **20,86 / 22,81** | 41,20 / 41,57 |
| B1 mask tĩnh, `--mask-mode png` | 2 | 8,9 / 9,3 | **16,84 / 16,15** | 34,01 / 34,84 |
| B2 mask tĩnh, `--mask-mode geq` | 2 | 53,0 / 47,4 | **2,83 / 3,17** | 4,28 / 4,83 |
| B3 tracked mask (video mask D4) | 2 | 26,8 / 22,0 | **5,60 / 6,83** | 10,87 / 18,91 |
| B4 tracked + denoise 0,5 | 1 | 23,6 | **6,36** | 16,34 |
| B5 tracked + stabilize smoothing 10 | 1 | 26,0 | **5,77** | 11,05 |

Đọc đúng:

- **Mọi arm đều chậm hơn O7 khoảng 2×** vì VM tải nặng hơn nhiều lúc
  này (load 12,6 lúc đầu lượt vs 3,7–9,1 lúc O7 đo). Đây là nhiễu tải,
  không phải hồi quy hiệu năng — bằng chứng: output byte giống hệt O7
  (§3) và frame-check giống hệt O7 (§3 + dưới đây).
- Tỉ lệ trong lượt P9: tracked **nhanh hơn geq ~2,0–2,4×** (5,6–6,8 vs
  2,8–3,2 fps; O7: 2,4–4,4×) và **chậm hơn PNG tĩnh ~2,5–3×**
  (16,2–16,8 fps; O7: ~2–3×) — cùng hướng với O7.
- B4 (tracked + denoise) không chậm hơn B3 (6,36 vs 5,60–6,83 fps,
  n=1) — khớp hướng O7; vẫn đừng kết luận "denoise miễn phí" (n=1,
  tải khác nhau giữa các lần đo).
- B5 (tracked + stabilize) 5,77 fps, n=1 — cùng bậc với B3, không sụp.

Kiểm chứng frame thật (numpy, giống hệt số O7 — xem §3): tracked@2,5
vs static-png@2,5 mean=0,234 max=82 pctGt8=0,489%; tracked@0,2 vs
tracked@4,8 mean=40,65 max=255 pctGt8=21,465%; static png@2,5 vs static
geq@2,5 mean=0,251 max=115 pctGt8=0,464%; **determinism B1-1 vs B1-2
mean=0 max=0 pctGt8=0%**.

### (b) Chi phí sinh video mask (`mask_anim.py` trực tiếp)

| Cấu hình | Frame | Wall | s/frame P9 | s/frame O7 |
|---|---|---|---|---|
| 720p, 2 s, 2 keyframe | 60 | 3,33 s | **0,0554** | 0,0298 |
| 720p, 5 s, 2 keyframe | 150 | 10,01 s | **0,0667** | 0,0281 |
| 720p, 5 s, 11 keyframe | 150 | 11,74 s | **0,0783** | 0,0259 |
| 720p, 10 s, 2 keyframe | 300 | 12,79 s | **0,0426** | 0,0252 |
| 1080p, 5 s, 2 keyframe | 150 | 25,40 s | **0,1693** | 0,0666 |

- s/frame đợt này cao hơn O7 ~1,7–2,5× (tải VM); nhưng **dung lượng
  .mkv giống hệt O7 từng byte** (530.021 / 1.326.129 / 1.326.139 /
  2.649.901 / 3.013.114 B) — output xác định, không đổi.
- Mật độ keyframe vẫn không ảnh hưởng chi phí theo hướng có ý nghĩa
  (11 keyframe 0,0783 vs 2 keyframe 0,0667 trên cùng 150 frame — chênh
  trong nhiễu tải; O7: 0,0259 vs 0,0281, cũng trong nhiễu).
- 1 frame PNG tạm: 720p 2.204 B, 1080p 3.940 B — giống hệt O7.

### (c) Preview FPS — Chromium headless 1254, project mẫu, cửa sổ 6 s sau warmup 1 s

Harness: `apps/web/scripts/bench-preview-fps.mjs --serve` (cần
`CHROME_BIN` trỏ chromium-1254; script mặc định tìm 1248 nên phải đặt
tay). Seed: dump autosave "Dự án mẫu" bằng `--dump-autosave` rồi sửa
tay (static: rect x=0,5; tracked: keyframes x 0,2→0,8 — cùng cách O7;
seed `seedLoaded=true` cả 2 lần). Playhead chỉ tiến ~2,5 s / 6 s wall
ở mọi arm (decode-bound trên VM, như O7) — FPS rAF không đồng nghĩa
phát mượt.

| Arm | Lần 1 | Lần 2 | O7 (n=1) |
|---|---|---|---|
| Control: không mask | **24,44** (148 frame, p50 40,8 ms, CPU Chrome 64,1%) | — | 21,48 (130 frame, p50 40,1 ms) |
| Static mask (rect x=0,5) | **9,50** (58 frame, p50 108,4 ms, CPU 96,6%) | **14,80** (90 frame, p50 75,4 ms, CPU 120,6%) | 13,15 (80 frame, p50 75,5 ms) |
| Tracked mask (x 0,2→0,8) | **4,29** ⚠️ (27 frame, p50 202,1 ms, CPU 104,5%) | **15,48** (94 frame, p50 73,3 ms, CPU 109,9%) | 15,15 (92 frame, p50 74,7 ms) |

Đọc đúng:

- **Tracked ≈ static ở preview** — kết luận O7 đứng vững: lần 2 của cả
  hai arm gần như trùng nhau (15,48 vs 14,80 fps; p50 73,3 vs 75,4 ms).
- ⚠️ **Lần 1 của tracked (4,29 fps) là nhiễu thoáng qua, KHÔNG phải
  hồi quy:** cùng seed, cùng script, chạy lại ngay sau đó cho 15,48 fps
  (p50 từ 202,1 ms về 73,3 ms); static lần 1 (9,50) cũng thấp hơn hẳn
  lần 2 (14,80) trong cùng điều kiện tải. Load VM lúc đo ~8 suốt cả 3
  arm. P9 báo cả 2 lần chạy, không giấu lần xấu — nhưng chỉ lần 2 mới
  phản ánh trạng thái ổn định.
- Cái mask tự nó vẫn tốn ~30–40% FPS preview so với không mask (24,44
  → ~15 fps; p50 40,8 → ~75 ms) — khớp O7: vòng lặp alpha từng pixel
  của mask nói chung là điểm nghẽn, không riêng tracked mask.
- n=2/arm (tracked/static), n=1 control — vẫn ít; cần n≥3 mới kết luận
  chặt, như O7 đã ghi.

## 5. Kiểm tra claim luồng P1/P2/P6 đợt 88 (mức smoke + chạy lại test, không sửa code họ)

### 5.1. P1 — fallback video-mask ép kích hoạt end-to-end (nợ O2 §5.5)

Claim: fallback 2 tầng hoạt động đúng; không sửa production (chỉ thêm
test + LIMITS). P9 **chạy lại test của P1**:
`node server/render/test_round88_p1_mask_fallback.js` →
**30/30 pass, exit 0** (P9 chạy lại: A ~5,5 s, B geq ~44,5 s, C 14,1 s;
tổng ~158 s do tải VM). Tự xác nhận: A fallback PNG t=0 tâm 0,35 tĩnh
tại mọi t, MAD=0,000 vs mask tĩnh cùng hình học; B fallback geq t=0 tâm
0,35, MAD=0,000; C không shim: bám track 0,3875/0,5/0,6125, không warn
fallback. **Claim P1 ĐÚNG.** Nợ O2 §5.5 mục 2 coi như đã đóng (theo
phương pháp shim PATH — xem giới hạn P1 §5: nguyên nhân fail là giả lập,
chưa có lần fail tự nhiên nào của `mask_anim.py`).

### 5.2. P2 — dọn pre-pass R2 vẽ PNG tĩnh thừa cho clip tracked (nợ O2 §5.5)

Claim: thêm `if (clip.track !== undefined) continue;` trước
`seen.add(key)` ở vòng R2 (`render.js:1690`, marker "đợt 88 P2"); output
không đổi (MAD 0), filter byte-identical; static vẫn vẽ PNG. P9
**chạy lại test của P2**: `node server/render/test_round88_p2_mask_prepass.js` →
**18/18 pass, exit 0**. Tự xác nhận: tracked 0 PNG R2 / 1 video mask;
2 clip tracked 0 PNG / 2 video mask; tĩnh vẫn 1 PNG; dry-run filter
không chứa `repo1-mask-*.png` nhưng vẫn có `.mkv` + `trim=end_frame=120`;
tâm tracked 0,3875/0,5/0,6125. **Claim P2 ĐÚNG.** Bằng chứng độc lập
thêm: số đo P5 (§3) chạy SAU khi P2 lên đĩa vẫn khớp chính xác số O7 —
P2 không làm lệch output. Nợ còn lại do chính P2 ghi: mask có keyframes
(không track) CŨNG bị vẽ PNG R2 thừa — chưa sửa, ngoài phạm vi P2.

### 5.3. P6 — sửa warn validator image+track+mask + refactor preview sang helper O1 (nợ gộp §4 mục 11 + 13)

Claim: (a) warn mới cho image+mask+track; mã `TRACK_IMAGE_MASK` mới
(dict 2515→2516); đồng bộ lại regex `TRACK_TRANSITION` bị stale từ
closing đợt 87; (b) preview `maskedUnitSource` dùng `maskGeometryAtTrack`
(O1), parity pixel ≤0,0003 vs render. P9 xác minh:

| Kiểm tra | Kết quả |
|---|---|
| `validateSpec` trực tiếp: image+mask+track → warn mới "track không dịch chuyển clip image (ảnh giữ vị trí tĩnh), nhưng mask vẫn bám theo track" | ✅ đúng từng chữ |
| image+track (không mask) → giữ warn cũ "track sẽ bị bỏ qua" | ✅ |
| video+mask+track+transitionOut (spec 2 clip) → ok=true, warn transition đúng ("mask vẫn bám theo track") | ✅ |
| Dict: vi==en==**2516** key lá, cùng tập key, có `validation.TRACK_IMAGE_MASK` | ✅ (đếm bằng flatten) |
| `server/render/src/test_validate_codes.js` (chạy lại) | ✅ **1596 pass, 0 fail** (khớp claim P6) |
| `maskTrackPreview87O4.test.ts` (esbuild bundle, chạy lại) | ✅ **37/37 xanh** (khớp claim P6) |
| `preview.tsx:662` dùng `maskGeometryAtTrack(mask, track ?? null, localT)`; `interpolateMaskAt` không còn import; `interpolateTrackPoints` còn dùng ở 2 chỗ khác | ✅ đúng như P6 mô tả |
| `tsc` web/desktop + `vite build` sau P6 | ✅ 0 lỗi / pass (xem §2 D) |

**Claim P6 ĐÚNG.** Lưu ý: P6 tự phát hiện và ghi rõ (LIMITS P6 §5.1):
preview LỆCH render ở combo image+track+mask (call site image không
truyền track nên preview giữ mask tĩnh, render thì bám) — chưa sửa,
cần parent quyết. P9 không đo lại pixel preview cho combo này (ngoài
phạm vi verify render), chỉ xác nhận comment đã sửa cho đúng sự thật
và code call site không đổi.

### 5.4. P5 (ngoài phạm vi (e), ghi nhận)

P5 chạy lại click-test O8 sau gộp i18n: Chromium 21/21, WebKitGTK
20/21 (S5 fail lần 1) → 21/21 lần 2 (nhưng S7 t=5 đo khung stale, PASS
rỗng — xem LIMITS P5 §3). Nợ O8 coi như đóng theo P5. P9 KHÔNG chạy
lại click-test (ngoài phạm vi task P9).

## 6. Lỗi harness của chính P9 (đã sửa, ghi trung thực)

Lần chạy đầu của harness verify crash ở A5 (`TypeError: lbl is not a
function`): P9 truyền nhầm chuỗi thay vì hàm `lbl` cho
`buildMaskTrackGeqChain`. Lỗi của chính test, không liên quan production.
Đã sửa (truyền hàm), chạy lại từ đầu — lần chạy đầu crash trước khi có
render nào nên không mất dữ liệu đo.

## 7. Chưa kiểm được trong lượt này / nợ mở

- Preview pixel cho combo image+track+mask (P6 §5.1 — lệch preview vs
  render, chờ parent quyết có truyền `clip.track` cho call site image
  hay không).
- Fallback: chưa ép cho mask keyframes không track (đường D4), image
  clip track+mask, `--mask-mode geq`, mask `invert`/feather > 0 trong
  đường fallback; timeout (đợt 74 B4) chưa ép kiểm chứng (P1 §5).
- Pre-pass R2 vẫn vẽ PNG thừa cho mask keyframes không track (P2 §5.1).
- Chưa đo: 4K, clip dài, track dày 240 điểm ở trackgeq, mask+track+SR/
  motion-blur/feather > 0 ở preview.
- Benchmark: n=2/arm render, n=1–2/arm preview — số tuyệt đối nhiễu
  mạnh theo tải VM; tỉ lệ trong lượt mới đáng tin.
- TTS 39 (cấm theo luật cứng — không đụng, không đo).

## 8. File của luồng P9 (stage, KHÔNG push)

- `server/render/test_r88_p9_mask_track_verify.js` — harness verify mới (P1–P5 + A/B/D).
- `benchmarks/render/bench_round88_p9_mask_track.cjs` — script benchmark (bản sao O7 + determinism).
- `benchmarks/results/round88-p9-mask-track.json` — số thô benchmark render + sinh video mask.
- `benchmarks/results/preview-fps-r88-p9-control.json` — preview control 24,44 fps.
- `benchmarks/results/preview-fps-r88-p9-static.json` — preview static lần 1 (9,50 fps).
- `benchmarks/results/preview-fps-r88-p9-static-r2.json` — preview static lần 2 (14,80 fps).
- `benchmarks/results/preview-fps-r88-p9-tracked.json` — preview tracked lần 1 (4,29 fps — nhiễu, xem §4c).
- `benchmarks/results/preview-fps-r88-p9-tracked-r2.json` — preview tracked lần 2 (15,48 fps).
- `benchmarks/results/preview-fps-r88-p9-dump.json` — kết quả lần dump autosave để làm seed (không phải arm benchmark; fps 5,46 trên cửa sổ 2 s, không trích).
- `docs/PHASE9_ROUND88_P9_MASK_TRACK_VERIFY_LIMITS.md` — file này.
- Log luồng: `workspace/goals/capcut-clone-video-editor/hidden_files/round88-p9.md`.
- Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round88-p9-mask-track-verify.txt`
  (10 entry, verify read-back 10/10 tồn tại và là text). KHÔNG push.
- Render/work tạm nằm ở `/tmp/vcut-r88-p9-pVviCZ/` (verify), `/tmp/vcut-r88-p9-4TfkDm/`
  (bench), `/tmp/vcut-p1-v1vRxL/` (chạy lại test P1), `/tmp/vcut-p2-I8UNwn/`
  (chạy lại test P2), `/tmp/r88-p9-seed-*.json` + `/tmp/r88-p9-autosave.json`
  (seed preview) — không stage (file tạm, không phải asset repo).
