# Đợt 61 R2 — Tách chi phí vidstabdetect/transform + jitter lặp lại + ghosting denoise + chặn preset stabilize ở UI: LIMITS trung thực

Ngày đo: 2026-11-08 (lượt 1: ~03:40–04:35; bổ sung: ~04:40–05:00; extra 0.8/1.0: ~05:05; unit/headed: ~05:10–05:25, giờ +07).
Máy đo: VM này (4 vCPU, RAM ~7.8GB, CPU-only, FFmpeg 8.1.2, libx264).
Đóng nợ đợt 60 §5.2 (Q8 enhance render). Harness mới:
`server/render/src/test_round61_r2_enhance_cost.js` (lượt 1: **33/34 pass**,
1 fail duy nhất là assert đơn điệu ghost trên cạnh cứng — xem §4.1, assert
đã sửa trong file sau khi phân tích) + `server/render/src/
test_round61_r2_enhance_cost_supplement.js` (bổ sung: **18/18 pass, exit 0**)
+ đo thêm 0.8/1.0 (`/tmp/r61r2-extra08.js`, đã chạy xong, không giữ lại
file — số liệu trong §4.3). Log đầy đủ tại
`workspace/goals/capcut-clone-video-editor/hidden_files/round61-r2/
r61r2-run1.log`, `r61r2-run2.log`, `r61r2-headed2.log`, `r61r2-headed3.log`.

## 1. Kết luận ngắn

- **(a) Chi phí stabilize tách được — detect chiếm phần lớn, transform rẻ.**
  Đo sạch nhất (bổ sung (a2), 720p, tải thấp ổn định): full render Cân bằng
  29,44s = detect 9,56s (32,5%) + decode 5,03s (17,1%) + transform thuần
  1,26s (4,3%) + encode thuần 6,49s (22,0%) + phần còn lại 7,10s (24,1%,
  denoise 0.5 + khởi động node + graph). Thứ tự chi phí ở cả 2 độ phân giải
  và cả 2 lượt: **detect > encode > transform** — vidstabtransform chỉ
  1,26s (720p) / 5,59s (1080p) cho clip 5s, tức ~119 fps / ~27 fps nếu
  tính riêng; pass đắt là vidstabdetect, không phải transform. Muốn
  stabilize nhanh hơn thì phải tối ưu/bỏ pass detect (vd cache .trf, giảm
  accuracy/stepsize), không phải transform.
- **(a) Cảnh báo phương pháp:** phép trừ trực tiếp transform-only − baseline
  encode ở lượt 1 ra số ÂM ở cả 2 độ phân giải (−4,27s / −25,37s) vì tải VM
  dao động 0,6–22,7 giữa các lần đo — x264 encode là phần biến thiên mạnh
  nhất. Lượt 1 chỉ giữ lại các số đo TRỰC TIẾP (wall từng pass); phép tách
  chỉ tin được ở (a2) dùng probe to-null + median 3 lần xen kẽ, và chỉ
  720p là sạch (1080p vẫn nhiễm xu hướng tải, tổng các phần = 145,8% full).
- **(b) Metric giảm jitter dao động MẠNH giữa các lần chạy stabilize.**
  Stabilize giảm inter-frame MAD 76,5% (720p) / 80,0% (1080p) so với đối
  chứng rung — hiệu quả giảm rung là thật và vững (cả 6 lần chạy đều giảm
  sâu). Nhưng giá trị tuyệt đối của metric dao động **38,0% (720p) /
  67,6% (1080p)** giữa 3 lần chạy cùng input (do .trf không xác định, Q8
  §5). Kết luận: đừng bao giờ trích MỘT số jitter của stabilize; phải đo
  ≥3 lần và báo kèm spread. So sánh 2 preset/thuật toán stabilize bằng
  1 lần chạy là vô nghĩa.
- **(c) Ghosting denoise: 0.3/0.5 an toàn, 0.7 ở ngưỡng, 0.8 (preset Mạnh)
  vệt mờ đo được, 1.0 vệt rõ.** Trên nguồn nhạy (khối gradient mềm chạy
  24px/frame): trail mean 0,3 = 0; 0,5 ≈ 0,006; 0,7 = 1,90; 0,8 = 2,88;
  1,0 = 5,93 (mức xám/255). Cạnh cứng 0→255 KHÔNG ghost ở mọi mức
  (0,3–0,7 đều trail = 0) vì filter temporal của hqdn3d chỉ blend sai khác
  nhỏ dưới ngưỡng. Vùng tĩnh gần như không đổi ở mọi mức (≤0,44).
- **(d) UX stabilize + speedKeyframes: ĐÃ CHỌN VÀ LÀM HƯỚNG (i) — chặn ở UI.**
  Preset Cân bằng/Mạnh và checkbox chống rung bị disable khi clip có speed
  curve, kèm dòng cảnh báo + tooltip rõ; preset Nhẹ vẫn chọn được; trạng
  thái lỗi cũ (stabilize đã bật + curve) vẫn sửa được bằng cách tắt
  stabilize. KHÔNG làm render fallback tự bỏ stabilize (hướng (ii)) — lý
  do ở §5. Unit 9/9 (vi+en), headed 7/7, tsc 0, vite build pass.

## 2. (a) Tách chi phí vidstabdetect vs vidstabtransform

Clip 5s = 150 frame, preset Cân bằng (stabilize smoothing 10 + denoise 0.5),
nguồn shakynoisy (upscale từ nguồn rung P2 320x180, tremor ±7px + noise
alls=15), encode veryfast/CRF23 như Q8.

### 2.1 Lượt 1 — số đo trực tiếp từng pass (render MP4 thật, 2 lần/cấu hình)

| Pass | 720p lần 1 | 720p lần 2 | 720p mean | 1080p lần 1 | 1080p lần 2 | 1080p mean |
|---|---|---|---|---|---|---|
| detect-only (to null, .trf) | 24,11s / 6,22 fps | 18,30s / 8,20 fps | **21,21s / 7,07 fps** | 36,63s / 4,09 fps | 21,59s / 6,95 fps | **29,11s / 5,15 fps** |
| transform-only (MP4, .trf có sẵn) | 24,63s / 6,09 fps | 22,13s / 6,78 fps | **23,38s / 6,42 fps** | 34,35s / 4,37 fps | 42,15s / 3,56 fps | **38,25s / 3,92 fps** |
| baseline encode (MP4, không filter) | 32,00s / 4,69 fps | 23,31s / 6,44 fps | **27,65s / 5,42 fps** | 56,32s / 2,66 fps | 70,92s / 2,12 fps | **63,62s / 2,36 fps** |
| full render Cân bằng (render.js) | 53,83s / 2,79 fps | 41,50s / 3,61 fps | **47,67s / 3,15 fps** | 117,58s / 1,28 fps | 74,30s / 2,02 fps | **95,94s / 1,56 fps** |

- Detect chiếm **44,5% (720p) / 30,3% (1080p)** wall full render — phần
  đo trực tiếp, vững.
- Transform-only ≈ baseline encode (23,38s vs 27,65s ở 720p; 38,25s vs
  63,62s ở 1080p — chênh 1080p lớn do baseline #2 dính spike tải
  loadavg 22,6). Transform+encode KHÔNG chậm hơn encode trơn một cách
  ổn định → transform thuần nhỏ, nhưng phép trừ mean cho số âm (−4,27s
  / −25,37s) nên KHÔNG kết luận được bằng lượt 1 — xem §2.2.
- Full render lượt 1 chậm hơn hẳn Q8 (720p 3,15 vs 4,89 fps; 1080p 1,56
  vs 3,04 fps) — hoàn toàn do tải VM lúc đo (loadavg 0,6–22,7, các luồng
  đợt 61 chạy song song), không phải code chậm đi (không sửa code render
  ở lượt 1). Đừng so FPS tuyệt đối giữa các lượt.

### 2.2 Bổ sung (a2) — probe to-null + median 3 lần, xen kẽ round-robin

Phương pháp: decode-only / transform-to-null / detect-to-null (đúng
`runStabilizeDetect` của VCut), mỗi probe 3 lần xen kẽ nhau để cùng lấy
mẫu tải; transform thuần = median(transform) − median(decode), detect
thuần = median(detect) − median(decode); thêm baseline encode MP4 (2 lần)
+ full render Cân bằng (1 lần) trong cùng phiên. Lưu ý: render chính
decode LẠI input (ngoài lần decode trong pass detect) nên tổng kiểm chứng
= detect + decode + transform thuần + encode thuần.

**720p (tải thấp ổn định, loadavg 1,0–2,8 — phép đo sạch nhất đợt này):**

| Probe (median 3 lần) | Wall | FPS riêng |
|---|---|---|
| decode-only | 5,03s (6,93 / 4,90 / 5,03) | 29,84 |
| transform-to-null | 6,28s (6,44 / 6,28 / 6,17) | 23,87 |
| detect-to-null | 9,56s (9,56 / 9,31 / 9,60) | 15,69 |
| baseline encode (median 2) | 11,52s (11,52 / 11,43) | 13,03 |
| full render Cân bằng | 29,44s | 5,09 |

Tách ra: **transform thuần 1,26s (119,33 fps — 4,3% full)**; **detect thuần
4,54s (33,06 fps)**; **encode thuần 6,49s (22,0% full)**; decode 5,03s
(17,1% full). Tổng kiểm chứng detect + decode + transform thuần + encode
thuần = 22,34s = **75,9% full**; phần còn lại 7,10s (24,1%) = denoise 0.5
+ khởi động node + graph (không tách riêng trong đợt này).

**1080p (nhiễm xu hướng tải: probe lúc spike loadavg 9–13, full render lúc
tải hạ 5,9 — chỉ đọc thứ tự, không đọc tỉ lệ tuyệt đối):**

| Probe (median 3 lần) | Wall |
|---|---|
| decode-only | 6,63s (7,98 / 6,55 / 6,63) |
| transform-to-null | 12,22s (16,08 / 12,22 / 10,40) |
| detect-to-null | 24,09s (35,56 / 24,09 / 16,88 — dao động 2,1× trong 3 lần) |
| baseline encode (median 2) | 22,50s |
| full render Cân bằng | 35,78s (4,19 fps) |

Tách ra: transform thuần 5,59s (26,81 fps); detect thuần 17,46s (8,59
fps); encode thuần 15,87s. Tổng kiểm chứng = 52,18s = **145,8% full**
(vượt 100% vì các phần đo lúc tải cao hơn lúc đo full — bằng chứng trực
tiếp rằng tỉ lệ 1080p đợt này không dùng được). Thứ tự chi phí vẫn khớp
720p: **detect (24,09s) > encode (15,87s thuần) > transform (5,59s thuần)**.

### 2.3 Kết luận (a)

- Pass đắt của stabilize là **vidstabdetect** (720p: 9,56s wall gồm decode,
  thuần 4,54s; 1080p: 24,09s wall, thuần 17,46s). vidstabtransform rẻ
  (720p thuần 1,26s; 1080p thuần 5,59s).
- Encode x264 trên nguồn nhiễu là chi phí lớn thứ hai (720p thuần 6,49s;
  1080p thuần 15,87s) — denoise càng mạnh càng giảm tải encode (cơ chế Q8
  §2.3 đã ghi), nên chi phí denoise ròng nhỏ hơn wall của nó.
- Hướng tối ưu sau này (chưa làm): cache `.trf` theo (src, trim, tham số)
  để khỏi detect lại khi render lại cùng clip; giảm accuracy/stepsize khi
  preview; detect ở độ phân giải thấp rồi scale transform. Đều là việc
  riêng, không thuộc luồng này.

## 3. (b) Metric giảm jitter lặp lại

Metric: inter-frame MAD = mean abs diff giữa các frame liên tiếp (frame
320x180 gray, 149 cặp/5s) — proxy cho chuyển động dư/jitter; stabilize
tốt phải làm số này GIẢM so với đối chứng rung không stabilize. Cùng
input shakynoisy, preset Cân bằng, render thật bằng render.js, 3 lần.

### 3.1 720p

| Lần chạy | MAD mean | MAD median | MAD std | FPS render | Kích thước MP4 |
|---|---|---|---|---|---|
| Đối chứng (rung, không stabilize) | **11,8789** | 12,3499 | 4,2295 | — (baseline encode lượt 1) | — |
| Stabilize #1 | 3,3005 | 1,1626 | 7,1062 | 3,63 | 1.419.917 byte |
| Stabilize #2 | 2,2395 | 0,9275 | 3,2509 | 4,93 | 1.401.832 byte |
| Stabilize #3 | 2,8301 | 1,8295 | 3,4434 | 5,62 | 1.660.244 byte |
| **Mean 3 lần** | **2,7900 (−76,5%)** | — | — | — | — |

Dao động giữa 3 lần: min 2,2395 – max 3,3005 → **spread 38,0%**.

### 3.2 1080p

| Lần chạy | MAD mean | MAD median | MAD std | FPS render | Kích thước MP4 |
|---|---|---|---|---|---|
| Đối chứng (rung, không stabilize) | **11,8076** | 12,2933 | 4,2425 | — | — |
| Stabilize #1 | 2,0648 | 0,5857 | 5,9680 | 2,53 | 2.484.676 byte |
| Stabilize #2 | 3,3142 | 0,9210 | 6,2802 | 2,63 | 2.965.453 byte |
| Stabilize #3 | 1,7149 | 0,4301 | 5,3696 | 3,33 | 2.345.862 byte |
| **Mean 3 lần** | **2,3646 (−80,0%)** | — | — | — | — |

Dao động giữa 3 lần: min 1,7149 – max 3,3142 → **spread 67,6%**.

### 3.3 Đọc số (b)

- Hiệu quả giảm rung là thật: cả 6 lần chạy stabilize đều giảm MAD 72–85%
  so với đối chứng (đối chứng ~11,8 ở cả 2 độ phân giải — nguồn rung giống
  nhau, upscale khác res không đổi bản chất rung).
- Nhưng **một lần đo không có ý nghĩa**: cùng input, cùng preset, metric
  dao động 38–68% chỉ vì `.trf` khác nhau mỗi lần chạy (Q8 §5: 79,7% LM
  entry khác). Kích thước MP4 cũng dao động theo (720p: 1,40–1,66 MB;
  1080p: 2,35–2,97 MB).
- Median << mean ở mọi lần chạy (vd 720p #1: median 1,16 vs mean 3,30;
  1080p #3: median 0,43 vs mean 1,71): phần lớn frame sau stabilize gần
  như đứng yên, mean bị kéo lên bởi một số ít frame nhảy lớn (chuyển động
  nội dung testsrc2 + hiệu chỉnh stabilize). Mean là metric headline cho
  đúng với Q8; median cho biết frame điển hình mượt hơn mean thể hiện.
- Quy tắc đo từ nay: metric stabilize phải đo ≥3 lần, báo mean + spread;
  so sánh 2 cấu hình stabilize bằng 1 lần chạy là vô nghĩa.

## 4. (c) Ghosting denoise trên footage chuyển động nhanh

### 4.1 Cạnh cứng 0→255: KHÔNG ghost ở mọi mức (phát hiện về phương pháp)

Nguồn: thanh trắng 120px chạy 24px/frame trên nền đen (720p, 5s). Metric:
trail = mean |render_t − orig_t| trên dải 24px thanh vừa rời khỏi;
leading = dải 24px thanh mới che; static = toàn frame trừ thanh t/t-1.

| Strength | Trail mean | Trail max | Leading mean | Static mean | Render |
|---|---|---|---|---|---|
| 0.3 | 0 | 0 | 0 | 0,0001 | 4,8s / 31,32 fps |
| 0.5 | 0 | 0 | 0 | 0,0001 | 10,2s / 14,72 fps |
| 0.7 | 0 | 0 | 0 | 0,0001 | 5,6s / 26,85 fps |

Trail = 0 tuyệt đối ở mọi mức — không phải vì hqdn3d không ghost, mà vì
filter temporal của hqdn3d chỉ blend sai khác nhỏ dưới ngưỡng (luma_tmp
7,2/12/16,8), còn cạnh 255 không bao giờ blend. **Cạnh cứng là ca KHÔNG
nhạy** — lượt 1 đã assert sai "trail tăng theo strength" (0 > 0 sai) và
fail 1/34 check vì tiền đề này; assert đã bỏ trong file harness, thay bằng
ghi nhận + trỏ sang (c2). Denoise 0.5 render lặp lại byte-identical
(28.687 byte cả 2 lần) — denoise xác định, không stabilize.

### 4.2 Khối gradient mềm: ca nhạy, kết luận mức an toàn

Nguồn: khối gradient 80→176 (400×300px) chạy 24px/frame trên nền xám 128
(720p, 5s) — sai khác liên-frame ~5,8 mức, dưới ngưỡng temporal ở mọi
mức nên blend xảy ra thật. Cùng metric trail/leading/static (n=145 frame).

| Strength | Trail mean | Trail median | Trail p90 | Trail max | Leading mean | Static mean |
|---|---|---|---|---|---|---|
| 0.3 | 0 | 0 | 0 | 0,0028 | 1,4807 | 0,0106 |
| 0.5 | 0,0055 | 0 | 0,0417 | 0,0814 | 2,3587 | 0,0645 |
| 0.7 | 1,8952 | 1,9989 | 2,0017 | 2,0528 | 3,9233 | 0,3035 |
| 0.8 (= preset Mạnh) | 2,8829 | 2,9689 | 3,0222 | 3,6822 | 5,0378 | 0,3413 |
| 1.0 | 5,9263 | 5,9742 | 5,9979 | 6,3772 | 7,4386 | 0,4373 |

### 4.3 Kết luận (c) — mức nào an toàn

- **0.3 và 0.5: an toàn.** Trail ≈ 0 ngay cả trên nguồn nhạy; leading
  smear 1,5–2,4 mức (≤1% thang xám) — không thấy được.
- **0.7: ở ngưỡng.** Trail ~1,9 mức, ngay ngưỡng <2 đã đặt trước — vệt
  mờ chỉ đo được bằng số, khó thấy bằng mắt trên footage thường.
- **0.8 (preset Mạnh): vệt mờ đo được rõ.** Trail 2,88 mức (~1,1% thang
  xám), leading 5,04 — trên cảnh pan nhanh có gradient phẳng (bầu trời,
  tường, mặt nước) có thể thấy vệt mờ nếu soi kỹ; trên footage thường
  khó nhận ra. Không phải lỗi nghiêm trọng, nhưng preset Mạnh không còn
  "sạch" tuyệt đối trên chuyển động nhanh.
- **1.0: vệt rõ.** Trail 5,93 mức (~2,3%), leading 7,44 — thấy được trên
  gradient phẳng chuyển động nhanh. Chỉ dùng khi nhiễu quá nặng và chấp
  nhận đánh đổi.
- Vùng tĩnh gần như không đổi ở mọi mức (static ≤0,44) — hqdn3d không phá
  vùng đứng yên; ghost chỉ xuất hiện ở vùng chuyển động.
- Lưu ý: số trên là với vật thể gradient mềm chuyển động 24px/frame
  (720px/s — nhanh). Chuyển động chậm hơn / cạnh cứng hơn → ghost nhỏ
  hơn; texture nhiễu thật phức tạp hơn gradient tổng hợp — hướng đo sau:
  footage thật có pan nhanh + bề mặt phẳng.

## 5. (d) UX stabilize + speedKeyframes — quyết định và làm thật

### 5.1 Quyết định: hướng (i) — chặn ở UI, KHÔNG làm fallback render (ii)

Lý do chọn (i), bác (ii):
1. **Fail-fast ở render là thiết kế cố ý, đã kiểm chứng** (Q8 §4:
   validateSpec + render.js đều chặn, exit 1, thông báo rõ, không MP4).
   Comment trong render.js: "user đã khai stabilize thì render thiếu nó là
   sai hợp đồng". Fallback (ii) tự bỏ stabilize sẽ lặng lẽ render thiếu
   tính năng user đã bật — phá hợp đồng trung thực này, và user sẽ nhận
   được video không chống rung mà không hiểu vì sao.
2. Chặn ở UI ngăn trạng thái lỗi ngay từ lúc tạo — user không bao giờ đụng
   render fail. Preset Nhẹ (chỉ denoise) vẫn dùng được trên clip có speed
   curve, nên user không bị mất hết enhance.
3. Thay đổi nhỏ, kiểm chứng được bằng headed thật; không đụng render
   pipeline (không sửa validate.js/render.js — backstop chặn vẫn giữ nguyên
   cho project cũ/MCP/CLI tạo trạng thái lỗi).

### 5.2 Đã làm thật

- `apps/web/src/components/enhance/presets.ts`: 2 helper thuần
  `isEnhancePresetSpeedBlocked(preset, hasSpeedRamp)` (chỉ balanced/strong
  bị chặn khi có ramp) và `isStabilizeToggleDisabled(stabOn, hasSpeedRamp)`
  (checkbox bị vô hiệu khi có ramp + đang tắt).
- `apps/web/src/components/enhance/EnhancePanel.tsx`: option preset Cân
  bằng/Mạnh `disabled` khi clip có speedKeyframes; select + checkbox có
  `title` tooltip nêu lý do; dòng cảnh báo mới
  `[data-testid="enhance-preset-speed-blocked"]` ("Clip có speed curve nên
  preset Cân bằng/Mạnh bị tắt — … Dùng preset Nhẹ (chỉ khử nhiễu) hoặc bỏ
  speed curve rồi bật lại."). Cảnh báo cũ `enhance.stabSpeedConflict`
  ("render sẽ bị chặn…") giữ nguyên cho trạng thái lỗi cũ.
- **Trạng thái lỗi cũ vẫn sửa được (quyết định cố ý):** nếu clip đã có
  stabilize + speedKeyframes (tạo trước đợt này, hoặc qua MCP/CLI/file
  project), checkbox chống rung vẫn MỞ để user TẮT đi — vô hiệu hoá hẳn
  sẽ khoá luôn đường sửa duy nhất trong panel. Validator/render vẫn chặn
  render trạng thái này cho đến khi user sửa.
- 3 key i18n mới trong fragment
  `workspace/goals/capcut-clone-video-editor/hidden_files/
  round61-r2-fragment.json` (KHÔNG sửa trực tiếp vi.json/en.json):
  `enhance.presetSpeedBlocked`, `enhance.presetSpeedTitle`,
  `enhance.stabilizeSpeedTitle` (parity vi/en, dùng `enhanceT` + fallback
  VI trong panel cho đến khi parent gộp).

### 5.3 Kiểm chứng (d)

- Unit `apps/web/src/components/enhance/enhanceSpeedBlock61R2.test.ts`:
  **9/9 pass cả vi lẫn en** (helper chặn, fragment 3 key parity + đúng
  từng chữ, fallback pre-merge, post-merge theo locale).
- Headed `apps/web/scripts/clicktest-61r2-enhance-speedblock.mjs`:
  **7/7 pass, exit 0** (vite dev + Chromium Xvfb + CDP): B0 setup; B1 bật
  speed curve bằng chuột thật → preset Cân bằng/Mạnh + checkbox bị tắt,
  cảnh báo hiện; B2 bấm checkbox disabled bằng chuột thật → enhance vẫn
  null; B3 chọn preset Nhẹ bằng phím thật → denoise 0.3; B4 ArrowDown×3 +
  Enter không chọn được Cân bằng/Mạnh (select ở lại "light"); B5 sửa
  trạng thái lỗi cũ: tắt curve → checkbox mở → bật stabilize → bật lại
  curve → cảnh báo "render sẽ bị chặn" hiện nhưng checkbox vẫn mở → tắt
  stabilize → hết conflict, cảnh báo preset-blocked vẫn hiện đúng (curve
  còn bật); H9 0 lỗi trang. Screenshots + report tại
  `hidden_files/round61-r2/headed/`.
- `tsc` apps/web: **0 lỗi**; `vite build` apps/web: **pass, 10,68s**
  (cảnh báo chunk >500 kB có sẵn).
- Lịch sử harness headed: lần chạy 1 fail setup do lỗi test (B0 chờ
  `presetVisible` trước khi chọn clip — section chỉ hiện khi đã chọn
  clip); lần chạy 2 đạt 6/7, B5 fail do assert test sai (đòi cảnh báo
  preset-blocked biến mất sau khi tắt stabilize trong khi curve còn bật —
  đáng ra nó phải còn hiện); cả hai đều là lỗi harness, không phải lỗi
  app, đã sửa harness và chạy lại 7/7.

## 6. Giới hạn — đọc trước khi trích số

1. **Tải VM là biến số lớn nhất.** Loadavg trong lúc đo: lượt 1 0,6–22,7;
   bổ sung 1,0–12,8. FPS tuyệt đối giữa các lượt chênh tới ~2,7× cho cùng
   cấu hình (full Cân bằng 1080p: 1,56 fps lượt 1 vs 4,19 fps bổ sung vs
   3,04 fps Q8). Chỉ tỉ lệ/thứ tự trong cùng một phiên đo mới có ý nghĩa;
   phép trừ giữa các phép đo ở thời điểm tải khác nhau có thể ra số âm —
   đã ghi rõ ở §2.1, đừng trích "transform thuần −4,27s" như kết quả.
2. **(a2) 1080p nhiễm xu hướng tải** (tổng các phần 145,8% full) — chỉ
   dùng thứ tự detect > encode > transform; tỉ lệ % chính xác chỉ có ở
   720p (a2).
3. **Nguồn rung là upscale tổng hợp** (P2 320x180 tremor ±7px), không phải
   footage rung quay thật; metric jitter là inter-frame MAD trên frame
   320x180 gray — proxy, không phải ước lượng chuyển động quang học đầy đủ.
4. **Nguồn ghosting là tổng hợp** (thanh cứng + khối gradient trên nền
   phẳng) — chưa đo trên footage thật có pan nhanh + bề mặt phẳng; ngưỡng
   "an toàn" (<2 mức xám) là quy ước của luồng này, không phải ngưỡng
   tri giác đã hiệu chuẩn.
5. **Chỉ đo clip 5s.** Ngoại suy clip dài chưa kiểm chứng (pass detect
   tuyến tính theo độ dài, nhưng chưa đo clip >5s cho enhance).
6. **(d) chỉ chặn ở EnhancePanel.** SpeedPanel không cảnh báo khi user bật
   speed curve trên clip đang có stabilize (trạng thái lỗi tạo ra từ phía
   SpeedPanel vẫn hiện cảnh báo conflict ở EnhancePanel + bị chặn ở render,
   nhưng không có chặn/cảnh báo ngay tại SpeedPanel). MCP/CLI/file project
   vẫn tạo được trạng thái lỗi — validator/render là backstop cuối.
7. Lượt 1 harness exit 1 do 1 assert sai tiền đề (§4.1); assert đã sửa
   trong file, 33 check còn lại pass. File harness trên đĩa là bản đã sửa.

## 7. Cách chạy lại

```bash
node server/render/src/test_round61_r2_enhance_cost.js            # lượt 1: (a)+(b)+(c) cạnh cứng, ~25-35 phút tùy tải
node server/render/src/test_round61_r2_enhance_cost_supplement.js # bổ sung: (a2) probe to-null + (c2) gradient mềm, ~10-15 phút
node apps/web/scripts/clicktest-61r2-enhance-speedblock.mjs      # headed (d): 7 case, ~90 s
./node_modules/.bin/esbuild apps/web/src/components/enhance/enhanceSpeedBlock61R2.test.ts --bundle --platform=node --format=cjs --outfile=/tmp/round61-r2/speedblock.test.cjs && node /tmp/round61-r2/speedblock.test.cjs
```

## 8. Nợ mở thêm (cho đợt sau)

- Cache `.trf` theo (src, trim, tham số stabilize) để khỏi detect lại khi
  render lại cùng clip — detect là pass đắt nhất (§2.3).
- Tách phần còn lại 7,10s (24,1%) của full render 720p: đo riêng denoise
  0.5 trên nguồn nhiễu (wall hqdn3d thuần) + khởi động node + graph.
- Đo ghosting denoise 0.8/1.0 trên footage thật pan nhanh + bề mặt phẳng;
  cân nhắc cảnh báo khi denoise ≥0,7 trên clip chuyển động nhanh (hiện
  chưa có cảnh báo nào).
- Cảnh báo/chặn ở SpeedPanel khi bật speed curve trên clip đang có
  stabilize (đối xứng với (d) — hiện chỉ chặn từ phía EnhancePanel).
- Metric jitter: thử ước lượng chuyển động (phase correlation / optical
  flow thô) thay cho inter-frame MAD để metric ít nhạy với nội dung
  testsrc2 hơn; đo spread trên clip dài hơn 5s.
- Đo FPS enhance trên clip dài thật (>5s) để kiểm chứng ngoại suy.
