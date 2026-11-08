# Đợt 63 R2 — Chi phí render enhance còn lại + ghosting pan thật + metric jitter bằng ước lượng chuyển động: LIMITS trung thực

Ngày đo: 2026-11-08 (lượt ~09:35–11:40, giờ +07).
Máy đo: VM này (4 vCPU, RAM ~7.8GB, CPU-only, FFmpeg 8.1.2, libx264, OpenCV 5.0.0 trong `server/tracking/.venv`).
Đóng 3 nợ đợt 62 §4 mục 2 (LIMITS: `docs/PHASE9_ROUND62_R2_TRF_CACHE_LIMITS.md` §6.7 + §8).
Harness mới: `server/render/src/test_round63_r2_render_cost.js` (**49/49 pass, exit 0**),
`server/render/src/test_round63_r2_render_cost_cpu.js` (**28/28 pass, exit 0**),
`server/render/src/test_round63_r2_motion_metric.js` (**11/11 pass, exit 0**).
Self-test module dùng chung: `enhance.js`, `trfCache.js`, `gpuencode.js` đều pass.
Log đầy đủ tại `workspace/goals/capcut-clone-video-editor/hidden_files/round63-r2/`
(`r63r2-cost-run2.log`, `r63r2-cost-run3.log`, `r63r2-cpu.log`,
`r63r2-motion-run3.log`, `r63r2-motion-run4.log`, `r63r2-bandb.log`).
Không sửa code production, không đụng web (không cần tsc/vite — xem §6).

## 1. Kết luận ngắn

- **(a) Kế toán chi phí full render ĐÃ ĐÓNG — không còn "thiếu" 5,6–6,4s.**
  Bằng **CPU time** (user+sys qua bash `time`, cộng dồn mọi process con —
  kháng tải, spread chỉ 1,0–6,6% so với wall 4–137%): full render Cân bằng
  720p 5s = **28,81s CPU = detect 13,36s (46%) + tiến trình chính 15,10s
  (52%) + residual 0,36s (1%)** — DET + MAIN = **98,8%** full. Residual
  0,36s khớp tổng vi mô CPU 0,63s (node 0,13 + ffprobe 0,10 + filters 0,05
  + version 0,06 + GPU probe 0,23 + spawn 0,06). **Không có khối công việc
  nào 5–6s bị bỏ sót** — "phần còn lại" của đợt 61 là tạo tác của phép trừ
  wall time dưới tải dao động + tính không cộng được của các probe rời
  (xem §2.4). Kiểm chứng độc lập bằng wall trong cửa sổ yên (run 3):
  DET 8,87 + MAIN 10,76 = 19,63s vs FULL 20,28s → **96,8%**, residual
  +0,65s. Ngược lại, run 2 dưới tải nặng cho residual wall **−13,54s**
  (DET+MAIN = 133,9% full) — lặp lại đúng bài học đợt 61: trừ wall time
  giữa các thời điểm tải khác nhau ra số âm, vô nghĩa.
- **(a) Chi phí từng pass (CPU, median 3 vòng, 720p 5s):** decode 6,62s;
  denoise 0.5 thuần **1,18s**; transform thuần **2,15s**; encode thuần
  **9,03s**; detect 13,36s; tiến trình chính 15,10s; full 28,81s. Bất ngờ:
  tiến trình chính (15,10s CPU) RẺ HƠN baseline encode (15,65s CPU) —
  khử nhiễu + stabilize làm input nhẹ entropy nên encode rẻ hơn ~4s CPU,
  bù thừa chi phí filter (~1,2s denoise + ~2,2s transform). Scale/pad/
  fps/format chỉ +0,24s CPU.
- **(a) Probe GPU là overhead wall lớn nhất của một lần render** (mặc định
  encoder=auto): CPU chỉ 0,23s nhưng wall **0,31–2,50s** giữa các lần đo
  (spread tới 174%) — chi phí là CHỜ dò thiết bị, không phải tính toán.
  Node start wall 0,41–0,93s (CPU 0,13s), ffprobe wall 0,15–0,91s (CPU
  0,10s) — mọi overhead vi mô đều là chờ/spawn, nở ra 2–6× khi tải nặng.
  Nợ mở: cache/bỏ probe GPU khi máy đã biết không có GPU (xem §5.1).
- **(b) Ghosting denoise trên pan ảnh thật: kết luận của đợt 61 CHUYỂN
  ĐƯỢC nhưng phải đo bằng hệ số blend từng dải, không phải trail tuyệt
  đối.** Trên ảnh thật (biển mờ + bãi sỏi, pan 24px/frame): b dải
  small (2<|dC|≤8, nhạy nhất) = **0,49 (0.5) → 0,59 (0.7) → 0,63 (0.8)
  → 0,68 (1.0)**; b dải flat = 0,82→0,98; b dải large (cạnh) ≤0,039 ở
  mọi mức (không ghost cạnh cứng — khớp đợt 61). Trail tuyệt đối
  3,43–5,06 mức ở dải small, nhưng trong đó ~2,2 mức là sàn làm mịn
  không gian (dải flat), không phải vệt thời gian. Ngưỡng <2 mức của đợt
  61 KHÔNG áp dụng được cho ảnh có texture (sàn đã ~2,2 mức ở 0.5).
  Phim nhiễu thật ghost ÍT HƠN phim sạch (b_small 0,5: 0,32 so với 0,49)
  vì nhiễu đẩy sai khác liên-frame vượt ngưỡng blend; denoise 0.5 còn
  LÀM GIẢM trail trên phim nhiễu so với không khử (2,78 so với 3,41).
  Cảnh báo denoise ≥0,7 trên clip chuyển động nhanh (nợ đợt 61 §8) vẫn
  giữ — nay có cơ sở số: bước nhảy b_small lớn nhất nằm ở 0,5→0,7
  (+0,10), lớn hơn 0,7→0,8 (+0,04) và 0,8→1,0 (+0,05).
- **(c) Metric jitter bằng phase correlation: GIẢ THUYẾT BỊ BÁC BỎ.**
  Bộ ước lượng được kiểm chứng gần như hoàn hảo trên rung đã biết
  (corr = 1,0; RMSE 0,0355px; std đo 5,603 so với kỳ vọng 5,608) và
  pipeline lặp lại 0% trên đối chứng — nhưng trên cùng 3 lần stabilize,
  mọi metric chuyển động đều dao động MẠNH HƠN MAD: lượt 3 MAD 69,2%
  so với J1c 147,1% / J2c 128,6% / J3c 179,4%; lượt 4 MAD 17,0% so với
  J1c 122,9% / J2c 72,1% / J3c 145,2%. .trf không xác định là nguồn dao
  động chính — chất lượng stabilize thật dao động 4–5× giữa các lần
  (J1c 0,26–7,79 qua 6 lần; có lần trôi chậm tệ hơn cả đối chứng).
  Phase correlation toàn frame VÔ NGHĨA trên video stabilize (viền đen
  tĩnh chiếm ưu thế — phải crop giữa). Giữ MAD làm metric headline
  (≥3 lần + spread, như đợt 61); J2c là chẩn đoán phụ nhạy nhất
  (giảm 89–97%) nhưng không thay thế MAD.

## 2. (a) Tách nốt chi phí còn lại — đo bằng CPU time

Clip 5s = 150 frame, preset Cân bằng (stabilize smoothing 10 + denoise
0.5), nguồn shakynoisy720 (gen P2 seed 7 → upscale 720p → noise alls=15),
encode veryfast/CRF23 như Q8. Probe to-null + median 3 lần, xen kẽ
round-robin; mỗi probe đo cả wall (Date.now) và CPU (bash `time`,
user+sys cộng dồn con cháu). Tiến trình chính F replay y hệt lệnh
`--dry-run` của render.js (parse lệnh, thay .trf placeholder bằng .trf
thật). Full render I qua render.js `--no-trf-cache` (detect mới mỗi lần).

### 2.1 Vi mô — CPU time (5 lần, median; harness CPU)

| Probe | CPU median | CPU spread | Wall median (lượt này) | Wall các lượt trước |
|---|---|---|---|---|
| M1 node render.js --help | 0,13s | 12,6% | 0,18s | 0,62–0,93s |
| M2 ffprobe (probeFile) | 0,10s | 4,0% | 0,13s | 0,15–0,91s |
| M3 ffmpeg -filters | 0,05s | 1,9% | 0,08s | 0,09–0,41s |
| M4 ffmpeg -version | 0,06s | 12,9% | 0,09s | 0,11–0,37s |
| M5 probeGpuEncoder (nvenc→qsv→vaapi) | 0,23s | 19,5% | 0,31s | 0,34–2,50s |
| M6 spawn ffmpeg encode 1 frame | 0,06s | 6,6% | 0,09s | 0,32–0,51s |
| **Tổng vi mô** | **0,63s CPU** | — | **0,88s wall** | **1,42–5,63s wall** |

- CPU của mọi probe vi mô đều nhỏ và ổn định (spread 2–20%); wall của
  chúng dao động 2–8× theo tải — chi phí vi mô là chờ/spawn, không phải
  tính toán. Tổng CPU vi mô 0,63s là trần trên cho phần "node + probe"
  trong một lần render (chúng chạy tuần tự trước tiến trình chính).
- **Probe GPU là overhead wall lớn nhất**: wall 0,31s (lượt CPU, yên)
  → 1,34s (run 2) → 2,50s (run 1), spread trong một lượt tới 174%,
  trong khi CPU luôn ~0,23s. 3 lần encode thử đều fail trên VM không
  GPU; thời gian chờ dò thiết bị của ffmpeg là phần biến thiên. Đây là
  ứng viên tối ưu số 1 cho thời gian render (xem §5.1).
- Kiểm chứng phương pháp trước khi viết harness CPU: decode-only wall
  42,09s/37,08s dưới loadavg 25 nhưng CPU 6,90s/6,93s (chênh 0,4%) —
  CPU time kháng tải, wall thì không.

### 2.2 Vĩ mô — CPU time (median 3 vòng; harness CPU)

| Probe | CPU median | CPU spread | Wall median | Wall spread |
|---|---|---|---|---|
| A decode-only | 6,62s | 1,8% | 5,86s | 4,4% |
| B decode+hqdn3d(0.5) | 7,81s | 2,2% | 7,15s | 27,5% |
| C decode+transform | 8,77s | 2,6% | 7,65s | 38,9% |
| D decode+hqdn3d+transform | 9,84s | 1,0% | 9,12s | 61,8% |
| E full-chain → null | 10,08s | 6,6% | 8,68s | 66,6% |
| F tiến trình ffmpeg chính (replay) | 15,10s | 6,2% | 12,98s | 52,4% |
| G baseline encode | 15,65s | 2,4% | 13,02s | 42,7% |
| H detect mới | 13,36s | 6,4% | 11,09s | 38,6% |
| I full render balanced | 28,81s | 2,5% | 23,61s | 19,3% |

- CPU spread chỉ 1,0–6,6% (wall 4,4–66,6%): CPU là thước đo đúng cho
  kế toán chi phí dưới tải song song. Wall median ở đây đo trong cửa sổ
  tương đối yên; wall tuyệt đối không trích được (xem §2.3).
- Tách ra (median − median, CPU — chỉ tham chiếu): denoise 0.5 thuần
  **1,18s** (B−A); transform thuần **2,15s** (C−A); encode thuần
  **9,03s** (G−A); scale/pad/fps/format **+0,24s** (E−D); encode +
  overlay + color + audio null + mux **5,02s** (F−E).
- **F < G (15,10 < 15,65s CPU)**: tiến trình chính rẻ hơn baseline
  encode dù làm nhiều filter hơn — input đã khử nhiễu + stabilize
  encode rẻ hơn ~4s CPU so với input nhiễu rung, bù thừa chi phí
  filter. Đây là cơ chế đã ghi ở Q8 §2.3, nay đo được con số.
- Chuỗi filter gần như cộng được theo CPU: D (9,84) ≈ C+B−A (9,96).
  Tính không cộng chỉ xuất hiện ở bước encode (F so với G).

### 2.3 Kế toán đóng sổ (CPU + wall sạch)

| | CPU | Wall (run 3, yên) | Wall (run 2, tải nặng) |
|---|---|---|---|
| DET (H) | 13,36s | 8,87s | 21,79s |
| MAIN (F) | 15,10s | 10,76s | 31,68s |
| DET + MAIN | 28,45s | 19,63s | 53,47s |
| FULL (I) | 28,81s | 20,28s | 39,93s |
| DET+MAIN / FULL | **98,8%** | **96,8%** | 133,9% |
| Residual FULL − DET − MAIN | **+0,36s** | **+0,65s** | **−13,54s** |

- CPU: residual +0,36s, khớp tổng vi mô CPU 0,63s trong sai số đo —
  kế toán đóng được, không còn phần "chưa tách".
- Wall yên (run 3): residual +0,65s, khớp tổng vi mô wall 1,42s (run 3)
  trong sai số — cùng kết luận.
- Wall tải nặng (run 2): residual −13,54s — vô nghĩa, đúng như cảnh báo
  đợt 61 §2.1. Wall time chỉ dùng được khi các phép đo cùng phiên tải
  ổn định; dưới tải dao động 0,3–25 thì chỉ CPU time mới đóng sổ được.
- So với đợt 61 (a2, wall yên): full 29,44s = detect 9,56 + decode 5,03
  + transform thuần 1,26 + encode thuần 6,49 + còn lại 7,10s. Phần
  7,10s đó nay giải thích được: (1) overhead wall node+probe
  1,4–5,6s (tùy tải; CPU chỉ 0,63s — phần lớn là chờ), (2) tính không
  cộng của probe rời: encode input đã xử lý rẻ hơn ~4s CPU so với
  encode input gốc (F < G), nên cộng các phần rời bị đội lên, (3) full
  render đợt 61 chỉ đo 1 lần (29,44s) ở thời điểm tải khác các probe.
  Không có khối công việc 5,6–6,4s nào bị bỏ sót.

### 2.4 Wall time 3 lượt chạy chính — để thấy tải là biến số lớn nhất

| | Run 1 (chết giữa chừng) | Run 2 (tải nặng) | Run 3 (yên hơn) |
|---|---|---|---|
| Micro wall sum | 5,63s | 3,65s | 1,42s |
| Dry-run wall | 5,11s | 1,77s | 1,19s |
| A decode-only median | — | 24,33s | 4,67s |
| I full median | — | 39,93s | 20,28s |
| Residual wall | — | −13,54s | +0,65s |
| Kết quả | chết sau vòng 1, không EXIT (phiên nền bị mất — xem §6) | 45 pass, 1 fail (assert ngưỡng ghost sai tiền đề) | **49 pass, 0 fail** |

- Cùng một probe, wall dao động 5–6× giữa các lượt chỉ vì tải VM
  (loadavg 0,3–25 trong các phiên, 8–10 luồng đợt 63 chạy song song).
  Mọi số wall tuyệt đối trong tài liệu này chỉ có nghĩa kèm loadavg
  lúc đo; đừng trích "full render 20,28s" hay "39,93s" như tốc độ thật
  của sản phẩm — đó là tốc độ dưới tải đo.

## 3. (b) Ghosting denoise trên pan ảnh thật

Ảnh: picsum seed `vcut-pan-c` (4000×2250, biển mờ + bãi sỏi;
sha256 `5ecc4f69…`, chỉ làm vật liệu đo trong scratch, không đưa vào
batch). Pan ngang 24px/frame (720px/s — cùng tốc độ test tổng hợp
đợt 61) bằng `crop=1280:720:x='mod(24*n,2720)':y=500`, 150 frame, 720p.
Hình học pan kiểm chứng: frame sạch so với crop PIL trực tiếp từ ảnh
gốc tại x=(24t)%2720 cho mad **0,72–1,04** (< 5) ở mọi frame mẫu, kể
cả frame wrap (t113 x=2712 → t114 x=16). 148/149 cặp frame dùng được.
Tỉ lệ pixel theo |dC|: flat ≤2: 26,05%; small 2–8: 16,38%; mid 8–24:
16,32%; large >24: 41,25%. Hai lượt chạy chính cho số ghost **giống
hệt nhau tới 4 chữ số thập phân** (nguồn sạch xác định; cả nguồn nhiễu
cũng vậy — filter noise của build này xác định).

### 3.1 Trail tuyệt đối (mức xám/255, mean)

| Nguồn / strength | flat | small | mid | large |
|---|---|---|---|---|
| Clean, không enhance (sàn encode) | 0,46 | 0,99 | 1,69 | 2,06 |
| Clean 0.5 | 2,17 | **3,43** | 4,24 | 3,88 |
| Clean 0.7 | 2,71 | **4,14** | 5,69 | 5,23 |
| Clean 0.8 (= preset Mạnh) | 2,97 | **4,46** | 6,35 | 5,96 |
| Clean 1.0 | 3,44 | **5,06** | 7,49 | 7,52 |
| Noisy, không enhance (sàn) | 2,97 | 3,41 | 3,92 | 4,14 |
| Noisy 0.5 | 1,61 | **2,78** | 3,99 | 4,04 |
| Noisy 0.8 | 2,02 | **3,63** | 5,51 | 5,25 |
| Noisy 1.0 | 2,54 | **4,27** | 6,66 | 6,59 |

- **Ngưỡng <2 mức của đợt 61 không áp dụng được cho ảnh thật.**
  Trên gradient tổng hợp, lỗi làm mịn không gian ≈ 0 nên trail ≈ vệt
  thời gian thuần. Trên ảnh thật, dải flat (không chuyển động) đã
  lệch 2,17 mức ở 0.5 — đó là lỗi làm mịn không gian, không phải vệt
  ma. Trail small 3,43 ở 0.5 bao gồm ~2,2 mức sàn không gian + ~1,3
  mức vệt thời gian. Assert "0.5 an toàn vì trail < 2" ở lượt chạy đầu
  đã fail đúng vì tiền đề này sai — assert đã sửa sang hệ số blend
  từng dải (§3.2), không phải lỗi sản phẩm.
- **Denoise 0.5 LÀM GIẢM trail trên phim nhiễu** (2,78 so với 3,41 khi
  không khử) — khử nhiễu có ích ròng ở mức này; 0.8/1.0 mới làm trail
  vượt sàn (3,63/4,27 > 3,41).

### 3.2 Hệ số blend b từng dải (D_t = C_t − b·(C_t − C_{t-1}))

| Nguồn / strength | b flat | b small | b mid | b large | b gộp |
|---|---|---|---|---|---|
| Clean, không enhance | 0,034 | 0,024 | 0,010 | 0,003 | 0,003 |
| Clean 0.5 | 0,824 | **0,495** | 0,164 | 0,012 | 0,015 |
| Clean 0.7 | 0,906 | **0,594** | 0,258 | 0,021 | 0,025 |
| Clean 0.8 | 0,930 | **0,630** | 0,301 | 0,026 | 0,031 |
| Clean 1.0 | 0,979 | **0,684** | 0,373 | 0,039 | 0,044 |
| Noisy, không enhance | 0,081 | 0,045 | 0,014 | 0,004 | 0,004 |
| Noisy 0.5 | 0,465 | **0,317** | 0,132 | 0,009 | 0,011 |
| Noisy 0.8 | 0,732 | **0,512** | 0,261 | 0,019 | 0,023 |
| Noisy 1.0 | 0,825 | **0,593** | 0,337 | 0,031 | 0,036 |

- **b gộp (cả frame) gây hiểu lầm** — nó bị pha loãng bởi 41% pixel
  dải large không blend (b≈0,01–0,04), nên chỉ ra 0,015–0,044 và che
  mất vệt thật. b từng dải mới là thước đo đúng.
- **b_small là con số kết luận**: pixel thay đổi ít (2–8 mức/frame —
  đúng vùng gradient phẳng chuyển động nhanh) bị kéo về frame trước
  ~50% ở 0.5, ~63% ở 0.8, ~68% ở 1.0. Quy ra độ nhòe: 0,5×24px ≈
  12px vệt mờ tương đương ở vùng nhạy nhất — nhưng vì sai khác tuyệt
  đối chỉ ~5 mức nên vệt chỉ thấy khi soi kỹ trên bề mặt phẳng.
  Đây là cùng bản chất với số gradient tổng hợp đợt 61 (trail 2,88 ở
  0.8; 5,93 ở 1.0) — kết luận đợt 61 CHUYỂN ĐƯỢC sang footage thật,
  chỉ khác thang đo.
- **b_flat ≈ 0,82–0,98** trông đáng sợ nhưng vô hại trong thực tế:
  pixel flat gần như không đổi giữa 2 frame (|dC|≤2) nên kéo về
  frame trước cũng chỉ lệch ~2–3 mức tuyệt đối — không có gì để ghost.
- **b_large ≤ 0,039 ở mọi mức**: cạnh lớn không bao giờ ghost (khớp
  phát hiện cạnh cứng đợt 61 — ngưỡng temporal của hqdn3d).
- **Phim nhiễu ghost ít hơn phim sạch** ở cùng strength (b_small 0,5:
  0,317 so với 0,495; 1,0: 0,593 so với 0,684) vì nhiễu đẩy nhiều pixel
  vượt ngưỡng blend. Đo trên phim sạch là trường hợp xấu nhất.
- Bước nhảy b_small lớn nhất nằm ở **0,5→0,7 (+0,10)**, lớn hơn
  0,7→0,8 (+0,04) và 0,8→1,0 (+0,05) — ngưỡng thực tế nằm giữa 0,5
  và 0,7. Cảnh báo khi denoise ≥0,7 trên clip chuyển động nhanh (nợ
  đợt 61 §8) vẫn giữ, nay có cơ sở số này.

## 4. (c) Metric jitter bằng phase correlation — giả thuyết bị bác bỏ

Nguồn: shakynoisy720 (như §2), stabilize Cân bằng, render thật bằng
render.js `--no-trf-cache`, 3 lần/lượt, 2 lượt độc lập (6 lần total).
Frame 320×180 gray (như MAD đợt 61). Phase correlation OpenCV 5.0
(`cv2.phaseCorrelate` + cửa sổ Hanning) trên crop giữa 160×90 (tránh
viền đen của vidstabtransform) và toàn frame (để đối chiếu).

### 4.1 Kiểm chứng bộ ước lượng (c0) — gần như hoàn hảo

Trên nguồn shaky320 (rung đã biết từ công thức gen, seed 7):
corrX = **1,0**, corrY = **1,0**, RMSE **0,0355px**; std(dx) đo 5,603
so với kỳ vọng 5,608; std(dy) 4,352 so với 4,359. Bộ ước lượng không
có lỗi đáng kể — mọi dao động sau đó là dao động thật của video
stabilize, không phải lỗi đo.

### 4.2 Đối chứng lặp lại 0% — pipeline xác định

Baseline encode 2 lần cho metric giống hệt nhau (MAD 11,8789;
J1c 9,9443; chênh 0%). Toàn bộ spread dưới đây đến từ .trf không xác
định, không phải từ encode hay đo.

### 4.3 MAD so với J1/J2/J3 trên cùng các lần render

| Metric | Lượt 3: giảm / spread | Lượt 4: giảm / spread |
|---|---|---|
| MAD mean (đợt 61) | −70,3% / **69,2%** | −82,9% / **17,0%** |
| J1c = std(dx)+std(dy), center | −58,6% / 147,1% | −91,1% / 122,9% |
| J2c = mean\|Δdx\|+mean\|Δdy\|, center | −89,2% / 128,6% | −97,4% / 72,1% |
| J3c = RMS quỹ đạo khử xu hướng, center | −26,5% / 179,4% | −83,0% / 145,2% |
| J1f / J2f / J3f (full-frame) | −92,8% / 205,6% ; −97,9% / 157,0% ; −88,2% / 169,1% | −90,6% / 144,4% ; −98,0% / 115,9% ; −84,4% / 128,2% |

- **Trong cả 2 lượt, mọi metric chuyển động đều dao động mạnh hơn MAD
  trên cùng các lần render.** Giả thuyết "ước lượng chuyển động ổn
  định hơn MAD" bị bác bỏ với thiết lập này. Giữ MAD làm metric
  headline (≥3 lần + spread, như đợt 61 §3.3).
- **J2c là chẩn đoán phụ tốt nhất**: giảm sâu nhất (89–97%) và spread
  thấp nhất trong các metric chuyển động — dùng để xếp hạng, không để
  kết luận một lần đo.
- **J3c không đáng tin**: lượt 3 chỉ giảm 26,5% vì lần stabilize #1
  trôi chậm TỆ HƠN cả đối chứng (J3c 6,84 so với 4,31) — vidstab với
  .trf xấu có thể làm quỹ đạo dài hạn tệ đi dù từng frame đỡ rung.
- **Full-frame phase correlation VÔ NGHĨA trên video stabilize**:
  J1f/J2f/J3f nhỏ bất thường (0,11–1,58) vì viền đen tĩnh của
  vidstabtransform chiếm ưu thế — phải crop giữa hoặc mask viền.
  Đừng bao giờ tính phase correlation trên toàn frame stabilize.
- **Chất lượng stabilize dao động 4–5× giữa các lần chạy** (J1c qua
  6 lần: 0,26–7,79; MAD qua 6 lần: 1,90–4,37). Đây là vấn đề chất
  lượng thật, không chỉ vấn đề đo — và là lý do cache .trf (đợt 62)
  quan trọng: render lại dùng cùng .trf thì tái lập được, không chỉ
  nhanh hơn.
- Xếp hạng không khớp nhau: lượt 3 MAD nói lần #3 tốt nhất (1,93)
  trong khi J1c nói lần #2 tốt nhất (1,73) — hai metric đo hai thứ
  khác nhau (thay đổi pixel so với độ phân tán dịch chuyển toàn cục).

## 5. Kiểm chứng gộp

- `enhance.js --self-test`, `trfCache.js --self-test`,
  `gpuencode.js --self-test`: **pass cả 3** (probe GPU thật trên máy
  này: null → fallback libx264).
- Harness chính run 3: **49/49 pass, exit 0** (run 2: 45 pass, 1 fail
  do assert ngưỡng ghost sai tiền đề — đã sửa, xem §6).
- Harness CPU: **28/28 pass, exit 0**.
- Harness motion run 4: **11/11 pass, exit 0** (run 3: 9 pass, 2 fail
  — J3c giảm 26,5% là kết quả thật; lỗi field `respMedian` là bug
  harness — cả hai đã sửa, xem §6).
- Không sửa code production; không đụng web → không chạy tsc/vite
  (không có file web nào đổi — xem stage batch §7).

## 6. Giới hạn — đọc trước khi trích số

1. **Tải VM là biến số lớn nhất (như mọi đợt).** Loadavg trong các
   phiên: 0,3–25. Wall time tuyệt đối dao động 2–6× cho cùng probe
   giữa các lượt (decode-only: 4,67s yên → 24–31s tải nặng). Chỉ CPU
   time (spread 1–7%) và tỉ lệ trong cùng một phép đo mới trích được;
   đừng trích wall tuyệt đối của bất kỳ probe nào như tốc độ sản phẩm.
2. **Chỉ đo clip 5s, 720p, preset Cân bằng.** Ngoại suy clip dài/
   1080p chưa kiểm chứng. Detect 1080p đắt hơn nhiều (24,09s wall
   đợt 61) nên tỉ lệ có thể khác.
3. **(b) chỉ 1 ảnh, 1 tốc độ pan (24px/frame), 1 vị trí crop
   (y=500).** Ảnh khác / pan chậm hơn / hướng khác có thể cho số
   khác; ngưỡng b_small là quy ước của luồng này, không phải ngưỡng
   tri giác đã hiệu chuẩn. Không có footage quay thật (ảnh tĩnh pan
   bằng crop) — chuyển động của máy quay thật có thêm rung + thay đổi
   phối cảnh mà crop không có.
4. **(c) chỉ 6 lần stabilize, 1 nguồn rung tổng hợp, 1 preset.**
   Kết luận "motion metric dao động hơn MAD" vững trong 2 lượt độc
   lập (6 lần) nhưng n=6 nhỏ; chưa thử optical flow dày (Farneback)
   hay block matching — chỉ thử phase correlation.
5. **Run 1 của harness chính chết lặng giữa chừng** (sau vòng 1 vĩ
   mô, không có dòng EXIT — phiên nền bị mất theo dõi, process không
   còn trong `ps`). Không rõ nguyên nhân hệ thống (không có dấu OOM
   trong dmesg); dữ liệu run 1 chỉ dùng phần vi mô + vòng 1, không
   tính vào kết luận. Các lần chạy sau dùng `setsid nohup` để tách
   khỏi phiên exec và đều chạy tới cùng.
6. **Lịch sử assert sai (đã sửa, ghi rõ):** (i) harness chính run 2
   fail 1 check "trail small 0.5 < 2" — tiền đề ngưỡng <2 lấy từ
   gradient tổng hợp, không áp dụng cho ảnh thật (sàn không gian
   ~2,2 mức); assert đổi sang b từng dải, run 3 xanh 49/49.
   (ii) harness motion run 3 fail 2 check: J3c giảm 26,5% < 50% là
   kết quả thật (không sửa số, chỉ bỏ ngưỡng assert cho J1/J3);
   `comp.J1center.respMedian` là field không tồn tại (bug harness),
   sửa thành `results.stab1.center.respMedian`.
   (iii) harness motion 2 lần đầu fail ở validate do sai đường dẫn
   venv (`server/render/tracking` thay vì `server/tracking`) và API
   OpenCV 5.0 (`createHanningWindow` cần `(size, CV_32F)`); đã sửa.
   (iv) assert gpuProbe <2s ở run 1 sai vì probe thật 1,3–2,5s wall;
   đổi ngưỡng 5s + kiểm tra hành vi (trả null encoder).

## 7. Cách chạy lại

```bash
node server/render/src/enhance.js --self-test
node server/render/src/trfCache.js --self-test
node server/render/src/gpuencode.js --self-test
node server/render/src/test_round63_r2_render_cost.js          # (a) wall + (b) ghost, ~20-30 phút tùy tải
node server/render/src/test_round63_r2_render_cost_cpu.js      # (a) CPU time, ~15-25 phút tùy tải
node server/render/src/test_round63_r2_motion_metric.js        # (c) phase correlation, ~6-10 phút
```

## 8. Nợ mở thêm (cho đợt sau)

- **(a) Cache/bỏ probe GPU khi máy đã biết không có GPU.** Probe GPU
  tốn 0,31–2,50s wall mỗi lần render (CPU chỉ 0,23s) mà trên máy không
  GPU luôn trả null. Hướng: cache kết quả probe theo máy (vd file
  `~/.cache/vcut/gpu-probe.json` + TTL) hoặc probe 1 lần rồi nhớ;
  cẩn thận: GPU có thể được gắn thêm sau — cần TTL/invalidation rõ
  ràng, và `--encoder` ép tay vẫn probe như cũ. Tiết kiệm kỳ vọng
  ~0,3–2,5s wall/render (1–9% full render Cân bằng).
- **(b) Cảnh báo denoise ≥0,7 trên clip chuyển động nhanh** (nợ đợt 61
  §8, nay có số b_small: 0,59 ở 0,7 so với 0,49 ở 0,5): thêm cảnh báo
  ở EnhancePanel khi strength ≥0,7 và clip có chuyển động nhanh
  (chưa có detector chuyển động nhanh — cần ngưỡng tốc độ pan trước).
- **(b) Đo ghost trên footage quay thật** (pan tay thật, không phải
  crop ảnh tĩnh) + tốc độ pan khác (12px/frame, 48px/frame) để kiểm
  ngưỡng b_small có phụ thuộc tốc độ không.
- **(c) Thử optical flow dày (Farneback) làm metric jitter** — phase
  correlation đã bị bác bỏ; flow dày có thể bắt chuyển động cục bộ
  mà phase correlation toàn cục bỏ qua. Vẫn phải đo spread ≥3 lần
  và so với MAD trên cùng render.
- **(c) Đo spread jitter trên clip dài hơn 5s** (nợ đợt 61 §8) — 5s
  chỉ có 149 cặp frame; clip 15–30s cho ước lượng spread vững hơn.
- **(a) Đo FPS enhance trên clip dài thật (>5s)** để kiểm ngoại suy
  (nợ đợt 61 §8).
